import { Result } from 'effect'
import {
  addIndex,
  canRaise,
  collect,
  connect,
  disconnect,
  filePostmortem,
  place,
  raise,
  replace,
  resize,
  restart,
  setFamily,
  setRuntime,
  setWorkers,
  study,
  type Action,
} from './actions.ts'
import {
  COMPONENTS,
  DESIGN_COST_INDEX,
  DESIGN_TUNING,
  FRAMEWORKS,
  OS_RAM,
  POOL_LIMITS,
  RESEARCH,
  RUNTIMES,
  type ComponentId,
  type ResearchId,
  type Tuning,
} from './catalog.ts'
import { newGame } from './company.ts'
import type { Ledger } from './ledger.ts'
import { burnOf, eraOf, has, isDown, ramOf, researchReady } from './lookups.ts'
import { bottleneckOf, solveFlow } from './solve.ts'
import type { Game, GameNode } from './state.ts'
import { step } from './step.ts'

/* ==========================================================================
   Pacing bots (16 "Pacing model"): scripted players that run against the real
   Simulation, so balance changes show up as test failures. Pure: no Vitest,
   no UI. M1 has the Balanced player and records margins; M2 adds Greedy,
   Stubborn and Decliner and asserts the pacing targets.
   ========================================================================== */

export type Milestone =
  | 'first-upgrade'
  | 'first-research'
  | 'db-split'
  | 'second-server'
  | 'preseed'
  | 'first-incident'
  | 'seed'

/** Margin when an Era ends: `live` at the build's prices, `design` at the design's cost index. */
export type MarginRecord = Readonly<{
  /** The Era that just ended. */
  stage: number
  time: number
  live: number
  /** Margin with Burn at the next Era's design cost index, as the Company enters it. */
  design: number
}>

export type BotRun = Readonly<{
  game: Game
  /** Sim seconds since the Company started when each milestone first happened. */
  milestones: Readonly<Partial<Record<Milestone, number>>>
  margins: ReadonlyArray<MarginRecord>
}>

/** The order the Balanced player researches in. It skips what is not open yet. */
const PRIORITY: ReadonlyArray<ResearchId> = [
  'stripe',
  'logs',
  'php-fpm',
  'opcache',
  'metrics',
  'load-balancing',
  'query-analysis',
  'caching',
  'pooling',
  'percentiles',
  'eager-loading',
  'alerting',
  'health-checks',
  'funnels',
]

/** Seconds of Burn the player keeps in Cash before spending. */
const RESERVE_SECONDS = 30
/** The player looks at the board this often, in sim seconds. */
const LOOK_EVERY = 5
/** A Node this busy gets attention even when the Bottleneck search names none. */
const BUSY = 0.8

const tried = (game: Game, action: Action): Game =>
  Result.isSuccess(action) ? action.success : game

/** Burn at a cost index, so margins can be read at the design's prices. */
export const burnAt = (game: Game, index: number): number =>
  game.nodes.reduce((total, node) => {
    const burn = burnOf(game, node)
    // The Auth Provider charges per user, not by the cost index.
    return total + (node.type === 'auth' ? burn : (burn / eraOf(game).costIndex) * index)
  }, 0)

const marginOf = (revenue: number, burn: number): number =>
  revenue > 0 ? (revenue - burn) / revenue : -1

const servers = (game: Game): ReadonlyArray<GameNode> =>
  game.nodes.filter((node) => node.type === 'server')

const byId = (game: Game, id: string): GameNode | undefined =>
  game.nodes.find((node) => node.id === id)

const last = (game: Game): string => game.nodes.at(-1)?.id ?? ''

/** Workers that fit in RAM with a margin, for runtimes with a pool. */
const fittingWorkers = (node: GameNode): number => {
  const each = RUNTIMES[node.runtime].memory + FRAMEWORKS[node.framework].memory
  return Math.max(
    POOL_LIMITS.min,
    Math.min(POOL_LIMITS.max, Math.floor(((ramOf(node) - OS_RAM) * 0.9 * 1024) / each)),
  )
}

/** Spends only what leaves the reserve. */
const affordable = (game: Game, ledger: Ledger, apply: (game: Game) => Action): Game => {
  const reserve = ledger.burn * RESERVE_SECONDS
  const next = tried(game, apply(game))
  return next !== game && next.cash >= reserve ? next : game
}

/** Places a Component and returns the Game and its id, or null when it cannot. */
const placed = (
  game: Game,
  ledger: Ledger,
  type: ComponentId,
  x: number,
  y: number,
): readonly [Game, string] | null => {
  const next = affordable(game, ledger, (current) => place(current, type, x, y))
  return next === game ? null : [next, last(next)]
}

/** Moves Postgres off the first box onto its own Database. */
const splitDatabase = (game: Game, ledger: Ledger, server: GameNode): Game => {
  const db = placed(game, ledger, 'database', server.x + 320, server.y)
  return db ? tried(db[0], connect(db[0], server.id, db[1])) : game
}

/** Puts a Load Balancer in front, then adds an App Server with the same Stack and links. */
const addServer = (game: Game, ledger: Ledger, model: GameNode): Game => {
  if (!has(game, 'load-balancing')) return game
  let next = game
  let lb = next.nodes.find((node) => node.type === 'lb')
  if (!lb) {
    const front = placed(next, ledger, 'lb', model.x - 160, model.y)
    if (!front) return game
    next = front[0]
    for (const link of next.links.filter((entry) => entry.from === 'users'))
      next = disconnect(next, link.from, link.to)
    next = tried(next, connect(next, 'users', front[1]))
    for (const server of servers(next)) next = tried(next, connect(next, front[1], server.id))
    lb = byId(next, front[1])
  }
  const copy = placed(next, ledger, 'server', model.x, model.y - 140 * servers(next).length)
  if (!copy || !lb) return next
  next = copy[0]
  next = tried(next, setRuntime(next, copy[1], model.runtime))
  if (RUNTIMES[model.runtime].pool)
    next = tried(next, setWorkers(next, copy[1], fittingWorkers(byId(next, copy[1]) ?? model)))
  next = tried(next, connect(next, lb.id, copy[1]))
  for (const link of next.links.filter((entry) => entry.from === model.id))
    next = tried(next, connect(next, copy[1], link.to))
  return next
}

/** Puts a Connection Pooler between every App Server and the Database. */
const addPooler = (game: Game, ledger: Ledger, database: GameNode): Game => {
  const pooler = placed(game, ledger, 'pooler', database.x - 160, database.y + 120)
  if (!pooler) return game
  let next = pooler[0]
  for (const link of next.links.filter((entry) => entry.to === database.id)) {
    next = disconnect(next, link.from, link.to)
    next = tried(next, connect(next, link.from, pooler[1]))
  }
  return tried(next, connect(next, pooler[1], database.id))
}

/** What the Balanced player does about the Node that limits the Design. */
const relieve = (game: Game, ledger: Ledger, node: GameNode): Game => {
  const limit = ledger.nodes[node.id]?.limit ?? 'none'
  const grow = (current: Game) => resize(current, node.id, 1)
  if (node.type === 'server') {
    if (limit === 'credits') return tried(game, setFamily(game, node.id, 'general'))
    if (node.localDb && (limit === 'memory' || limit === 'cpu'))
      return splitDatabase(game, ledger, node)
    if (limit === 'workers' && RUNTIMES[node.runtime].pool && node.workers < fittingWorkers(node))
      return tried(game, setWorkers(game, node.id, fittingWorkers(node)))
    // Grow a box up to medium, then scale out.
    if (node.size < 3) {
      const bigger = affordable(game, ledger, grow)
      const resized = byId(bigger, node.id)
      return resized && RUNTIMES[resized.runtime].pool
        ? tried(bigger, setWorkers(bigger, node.id, fittingWorkers(resized)))
        : bigger
    }
    return addServer(game, ledger, node)
  }
  if (node.type === 'database' && limit === 'connections' && has(game, 'pooling'))
    return game.nodes.some((entry) => entry.type === 'pooler')
      ? game
      : addPooler(game, ledger, node)
  return affordable(game, ledger, grow)
}

/** Incidents, postmortems, the drawer, research, the Stack, and the Bottleneck. */
const look = (game: Game, tuning: Tuning): Game => {
  let next = game.pending > 0 ? collect(game) : game

  for (const postmortem of next.postmortems) {
    const cost = postmortem.action ? RESEARCH[postmortem.action].cost : 0
    next = tried(next, filePostmortem(next, postmortem.id, next.insight >= cost))
  }
  for (const node of next.nodes.filter((entry) => entry.down === -1))
    next = tried(next, replace(next, node.id))
  const incident = next.incident
  if (incident?.kind === 'leak' && incident.nodeId)
    next = tried(next, restart(next, incident.nodeId))
  if (incident?.kind === 'slow-query' && incident.nodeId)
    next = tried(next, addIndex(next, incident.nodeId))

  const research = PRIORITY.find(
    (id) => !has(next, id) && researchReady(next, id) && next.insight >= RESEARCH[id].cost,
  )
  if (research) next = tried(next, study(next, research))

  // PHP-FPM replaces Apache as soon as it is researched, with a pool that fits in RAM.
  for (const server of servers(next))
    if (server.runtime === 'mod_php' && has(next, 'php-fpm')) {
      next = tried(next, setRuntime(next, server.id, 'php_fpm'))
      const switched = byId(next, server.id)
      if (switched) next = tried(next, setWorkers(next, server.id, fittingWorkers(switched)))
    }

  const flow = solveFlow(next)
  const target =
    bottleneckOf(next, flow) ??
    next.nodes
      .filter((node) => !isDown(node) && COMPONENTS[node.type].accepts.length > 0)
      .map((node) => [node.id, flow.nodes[node.id]?.utilization ?? 0] as const)
      .filter(([, utilization]) => utilization > BUSY)
      .toSorted((a, b) => b[1] - a[1])[0]?.[0]
  const node = target ? byId(next, target) : undefined
  if (node) next = relieve(next, flow, node)

  return canRaise(next) ? tried(next, raise(next, tuning.firstIncidentAfter)) : next
}

/** Which milestones a look reached, by comparing the Game before and after. */
const reached = (before: Game, after: Game): ReadonlyArray<Milestone> => {
  const found: Array<Milestone> = []
  const sized = (game: Game) =>
    game.nodes.reduce((total, node) => total + node.size, 0) +
    game.nodes.filter((node) => node.family !== 'burstable').length
  if (sized(after) > sized(before)) found.push('first-upgrade')
  if (after.researched.length > before.researched.length) found.push('first-research')
  if (after.nodes.some((node) => node.type === 'database')) found.push('db-split')
  if (servers(after).length > 1) found.push('second-server')
  if (after.stage >= 1) found.push('preseed')
  if (after.stage >= 2) found.push('seed')
  return found
}

/**
 * Plays a Company with the Balanced strategy in 1 s Steps until `until` sim
 * seconds or the Seed round. `tuning` defaults to the design's pacing.
 */
export const runBot = (seed: number, until: number, tuning: Tuning = DESIGN_TUNING): BotRun => {
  let game = newGame(seed)
  const milestones: Partial<Record<Milestone, number>> = {}
  const margins: Array<MarginRecord> = []
  const mark = (milestone: Milestone) => {
    if (milestones[milestone] === undefined) milestones[milestone] = game.time
  }
  while (game.time < until && game.stage < 2) {
    if (Math.round(game.time) % LOOK_EVERY === 0) {
      const before = game
      const ledger = solveFlow(before)
      game = look(before, tuning)
      for (const milestone of reached(before, game)) mark(milestone)
      if (game.stage > before.stage)
        margins.push({
          stage: before.stage,
          time: game.time,
          live: marginOf(ledger.revenue, ledger.burn),
          design: marginOf(ledger.revenue, burnAt(before, DESIGN_COST_INDEX[game.stage] ?? 1)),
        })
    }
    const result = step(game, 1, tuning)
    game = result.game
    if (result.events.some((event) => event._tag === 'IncidentStarted')) mark('first-incident')
  }
  return { game, milestones, margins }
}
