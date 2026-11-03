import {
  BREADTH,
  ERA_RECIPES,
  INSIGHT_POOLS,
  POOL_FLOOR,
  RECIPE,
  RESEARCH,
  RETENTION_WINDOWS,
  SPIKE_SPEED,
  STUDY_SECONDS,
  STUDY_SPEEDUP,
  STUDY_SPEED_RESEARCH,
  researchList,
  type InsightPool,
  type RequestKind,
  type ResearchId,
} from './catalog.ts'
import { StepEvent } from './events.ts'
import type { Ledger } from './ledger.ts'
import { has, researchReady } from './lookups.ts'
import type { Game, InsightPools } from './state.ts'

/* ==========================================================================
   Studies (10 "Studies"): research runs one item at a time, and takes its
   Insight from its recipe's pools as it runs, like a Factorio lab takes
   packs. The scarcest pool sets the pace.
   ========================================================================== */

/** Seconds of traces the Company keeps: its longest Analytics retention. */
export const retentionOf = (game: Game): number =>
  game.nodes.reduce(
    (longest, node) => (node.type === 'analytics' ? Math.max(longest, node.retention) : longest),
    0,
  ) || RETENTION_WINDOWS[0]

/** Per Era and pool, the largest share of any item open by then: a pool always holds one Study. */
const FLOORS: ReadonlyArray<Readonly<Record<InsightPool, number>>> = STUDY_SECONDS.map(
  (_, stage) =>
    Object.fromEntries(
      INSIGHT_POOLS.map((pool) => [
        pool,
        researchList.reduce(
          (most, entry) =>
            entry.era <= stage ? Math.max(most, RECIPE[entry.id][pool] ?? 0) : most,
          POOL_FLOOR,
        ),
      ]),
    ) as Record<InsightPool, number>,
)

/**
 * The most a pool holds (12 "Retention"): the retention window of its live
 * rate, and never less than the costliest open Study's share, so a burst of
 * failures in an incident can pay for a Study later.
 */
export const capOf = (game: Game, ledger: Ledger, pool: InsightPool): number =>
  Math.max(
    FLOORS[Math.min(game.stage, FLOORS.length - 1)]?.[pool] ?? POOL_FLOOR,
    retentionOf(game) * ledger.insight[pool],
  )

/** Splits an old save's single balance into pools by the request mix users send. */
const migrated = (game: Game, ledger: Ledger): InsightPools => {
  if (game.insight <= 0) return game.pools
  const pools = { ...game.pools }
  const mix = (Object.keys(ledger.kinds) as Array<RequestKind>).filter((kind) => kind !== 'bot')
  const total = mix.reduce((sum, kind) => sum + (ledger.kinds[kind]?.rate ?? 0), 0)
  if (total <= 0) pools.page += game.insight
  else
    for (const kind of mix) pools[kind] += (game.insight * (ledger.kinds[kind]?.rate ?? 0)) / total
  return pools
}

/** Adds a Step's Insight up to each pool's cap. Grants ignore the cap. */
export const accrue = (
  game: Game,
  ledger: Ledger,
  seconds: number,
  grants: ReadonlyArray<InsightPool>,
  grant: number,
): InsightPools => {
  const pools = migrated(game, ledger)
  const next = { ...pools }
  for (const pool of INSIGHT_POOLS) {
    const cap = capOf(game, ledger, pool)
    const held = pools[pool]
    if (held < cap) next[pool] = Math.min(cap, held + ledger.insight[pool] * seconds)
  }
  for (const pool of grants) next[pool] += grant
  return next
}

/** The request kinds of a recipe, without Failure. */
const recipeKinds = (id: ResearchId): ReadonlyArray<RequestKind> =>
  (Object.keys(RECIPE[id]) as Array<InsightPool>).filter(
    (pool): pool is RequestKind => pool !== 'failure',
  )

/** Whether the Design samples an item's recipe kinds at enough Component types. */
export const broadEnough = (id: ResearchId, ledger: Ledger): boolean => {
  const needed = BREADTH[id] ?? 0
  return needed === 0 || recipeKinds(id).every((kind) => (ledger.breadth[kind] ?? 0) >= needed)
}

/** Whether a Team spikes the running Study: its Spike is among the items the Teams take. */
export const spiked = (game: Game): boolean => {
  const running = game.studies[0]
  if (!running) return false
  // Teams take items in order and skip a Spike whose Study is not running (`takeable` in work.ts).
  const index = game.backlog
    .filter((item) => item.kind !== 'spike' || item.ref === running.id)
    .findIndex((item) => item.kind === 'spike')
  return index !== -1 && index < game.teams.length
}

/** How fast the running Study goes: a Spike doubles it, study-speed research adds to it. */
export const studySpeed = (game: Game): number =>
  (spiked(game) ? SPIKE_SPEED : 1) *
  (1 + STUDY_SPEEDUP * STUDY_SPEED_RESEARCH.filter((id) => has(game, id)).length)

/** Base seconds of an item's Study. */
export const studySeconds = (id: ResearchId): number =>
  STUDY_SECONDS[RESEARCH[id].era] ?? STUDY_SECONDS[STUDY_SECONDS.length - 1] ?? 3_600

/** The pool that limits the running Study now, if any: the one with the least for its draw. */
export const limitingPool = (game: Game): InsightPool | null => {
  const running = game.studies[0]
  if (!running) return null
  let worst: InsightPool | null = null
  let least = Number.POSITIVE_INFINITY
  for (const [pool, cost] of Object.entries(RECIPE[running.id]) as Array<[InsightPool, number]>) {
    const left = game.pools[pool] / cost
    if (left < least) {
      least = left
      worst = pool
    }
  }
  return worst
}

/** Advances the running Study by some seconds, and completes it when done. */
export const advanceStudies = (
  game: Game,
  ledger: Ledger,
  seconds: number,
  events: Array<StepEvent>,
): Game => {
  const studies = game.studies.filter((entry) => !has(game, entry.id))
  const running = studies[0]
  if (!running || !researchReady(game, running.id) || !broadEnough(running.id, ledger))
    return studies.length === game.studies.length ? game : { ...game, studies }
  const speed = studySpeed(game)
  const share = (speed * seconds) / studySeconds(running.id)
  const recipe = Object.entries(RECIPE[running.id]) as Array<[InsightPool, number]>
  // The scarcest pool sets the pace: each pool pays the same share of its draw.
  let paid = 1
  for (const [pool, cost] of recipe) {
    const draw = cost * share
    if (draw > 0) paid = Math.min(paid, game.pools[pool] / draw)
  }
  paid = Math.max(0, Math.min(1, paid))
  const pools = { ...game.pools }
  for (const [pool, cost] of recipe) pools[pool] = Math.max(0, pools[pool] - cost * share * paid)
  const progress = running.progress + share * paid
  if (progress < 1 - 1e-9)
    return { ...game, pools, studies: [{ ...running, progress }, ...studies.slice(1)] }
  events.push(StepEvent.StudyCompleted({ research: running.id }))
  return {
    ...game,
    pools,
    researched: [...game.researched, running.id],
    studies: studies.slice(1),
    backlog: game.backlog.filter((item) => !(item.kind === 'spike' && item.ref === running.id)),
  }
}

/** The pools a new Era's default recipe asks for, for hints. */
export const eraPools = (stage: number): ReadonlyArray<InsightPool> => ERA_RECIPES[stage] ?? []
