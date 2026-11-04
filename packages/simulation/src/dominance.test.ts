import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { SLOW } from '../slow.ts'
import {
  connect,
  disconnect,
  place,
  setFamily,
  setFramework,
  setPm,
  setRuntime,
} from './actions.ts'
import {
  DESIGN_TUNING,
  FAMILY_IDS,
  FRAMEWORKS,
  FRAMEWORK_IDS,
  FRAMEWORK_RESEARCH,
  PM_MODES,
  LANGUAGE_IDS,
  LOCAL_DB_RAM,
  LOCAL_DB_RAM_PER_USER,
  MAX_CONNECTIONS,
  OS_RAM,
  POOL_LIMITS,
  RUNTIMES,
  RUNTIME_IDS,
  type FamilyId,
  type FrameworkId,
  type LanguageId,
  type ResearchId,
  type RuntimeId,
} from './catalog.ts'
import { newGame, preseedGame } from './company.ts'
import { ramOf, vcpuOf } from './lookups.ts'
import { GUIDED, SANDBOX_IDS } from './sandbox.ts'
import { solveFlow } from './solve.ts'
import type { Game, PmMode } from './state.ts'
import { step } from './step.ts'

/*
 * 16 "The dominance test": no option strictly dominates a sibling. For each
 * option set, every option must beat every sibling by at least 10% on at least
 * one score on at least one reference design. Scores: revenue per Burn, p99,
 * error share, and velocity, the stand-in for Dev Hours until M4 (plan D8).
 * A failure is a design question: fix the option in the catalog or the model.
 */

const ok = (game: Game, action: Result.Result<Game, unknown>): Game =>
  Result.isSuccess(action) ? action.success : game

/** A Pre-seed Design with three medium App Servers behind a Load Balancer, sharing one Postgres. */
const threeServers = (): Game => {
  let game: Game = { ...preseedGame(), cash: 1e9, users: 4_000 }
  game = {
    ...game,
    nodes: game.nodes.map((node) => (node.id === 'server' ? { ...node, size: 3 } : node)),
  }
  game = disconnect(game, 'users', 'server')
  game = ok(game, place(game, 'lb', 280, 280))
  const lb = game.nodes.at(-1)?.id ?? ''
  game = ok(game, connect(game, 'users', lb))
  game = ok(game, connect(game, lb, 'server'))
  for (const y of [120, 440]) {
    game = ok(game, place(game, 'server', 440, y))
    const id = game.nodes.at(-1)?.id ?? ''
    game = {
      ...game,
      nodes: game.nodes.map((node) => (node.id === id ? { ...node, size: 3 } : node)),
    }
    game = ok(game, connect(game, lb, id))
    game = ok(game, connect(game, id, 'database'))
  }
  return game
}

const DESIGNS: ReadonlyArray<readonly [string, () => Game]> = [
  ['Garage start', () => newGame()],
  ['Pre-seed start', () => preseedGame()],
  ['three servers', threeServers],
  ...SANDBOX_IDS.map((id) => [`Sandbox ${GUIDED[id].name}`, GUIDED[id].start] as const),
]

const SECONDS = 600
/**
 * Sim seconds per Step. 1 s and 2 s Steps give the same verdicts and take 4× and
 * 2× as long; restarts (1–10 s) and warmups (15 s) still play out at 5 s.
 */
const STEP = 5

type Scores = Readonly<{ value: number; p99: number; errors: number; velocity: number }>

/**
 * Sizes every pool the way a careful player would: 10 workers per vCPU (plan D6),
 * no more than fits in the RAM left after the OS and any local Postgres, and no
 * more than its share of Postgres `max_connections`. The pool size is the lever
 * a pooled runtime has and an event loop does not.
 */
const fit = (game: Game): Game => {
  const servers = game.nodes.filter((node) => node.type === 'server' && !node.localDb).length
  return {
    ...game,
    nodes: game.nodes.map((node) => {
      if (node.type !== 'server' || !RUNTIMES[node.runtime].pool) return node
      const each = RUNTIMES[node.runtime].memory + FRAMEWORKS[node.framework].memory
      const postgres = node.localDb ? LOCAL_DB_RAM + game.users * LOCAL_DB_RAM_PER_USER : 0
      const room = Math.floor(((ramOf(node) - OS_RAM - postgres) * 0.9 * 1024) / each)
      const connections = Math.floor(MAX_CONNECTIONS / Math.max(1, servers))
      const workers = Math.min(room, connections, 10 * Math.max(1, vcpuOf(node)))
      return { ...node, workers: Math.max(POOL_LIMITS.min, Math.min(POOL_LIMITS.max, workers)) }
    }),
  }
}

/** Runs a Design for ten sim minutes at the design pace, with no incidents, and reads the scores at the end. */
const score = (game: Game): Scores => {
  let current: Game = { ...game, nextIncidentAt: Number.MAX_SAFE_INTEGER, cash: 1e9 }
  for (let elapsed = 0; elapsed < SECONDS; elapsed += STEP)
    current = step(current, STEP, DESIGN_TUNING).game
  const ledger = solveFlow(current)
  return {
    value: ledger.burn > 0 ? ledger.revenue / ledger.burn : 0,
    p99: ledger.p99,
    errors: ledger.errorShare,
    velocity: ledger.velocity,
  }
}

const withResearch = (game: Game, ids: ReadonlyArray<ResearchId | null>): Game => ({
  ...game,
  researched: [
    ...game.researched,
    ...ids.filter((id): id is ResearchId => id !== null && !game.researched.includes(id)),
  ],
})

const onServers = (game: Game, apply: (game: Game, id: string) => Game): Game =>
  game.nodes
    .filter((node) => node.type === 'server')
    .reduce((current, node) => apply(current, node.id), game)

const runtimeOption =
  (runtime: RuntimeId) =>
  (game: Game): Game =>
    fit(
      onServers(withResearch(game, [RUNTIMES[runtime].research]), (current, id) =>
        ok(current, setRuntime(current, id, runtime)),
      ),
    )

const DEFAULT_RUNTIME: Record<LanguageId, RuntimeId> = {
  php: 'php_fpm',
  ruby: 'puma',
  node: 'node',
  python: 'gunicorn',
  go: 'go',
  java: 'tomcat',
  csharp: 'kestrel',
  elixir: 'beam',
  rust: 'tokio',
  zig: 'zig',
  haskell: 'warp',
}

const frameworkOption =
  (language: LanguageId, framework: FrameworkId) =>
  (game: Game): Game => {
    const runtime = DEFAULT_RUNTIME[language]
    const ready = withResearch(runtimeOption(runtime)(game), [FRAMEWORK_RESEARCH[framework]])
    return fit(onServers(ready, (current, id) => ok(current, setFramework(current, id, framework))))
  }

const familyOption =
  (family: FamilyId) =>
  (game: Game): Game =>
    fit(onServers(game, (current, id) => ok(current, setFamily(current, id, family))))

/**
 * A PHP-FPM process manager on a pool twice the careful size: the case the modes exist for. Static
 * keeps it all resident; dynamic and ondemand keep only what is busy, and pay spawn latency.
 */
const pmOption =
  (pm: PmMode) =>
  (game: Game): Game => {
    const fitted = runtimeOption('php_fpm')(game)
    const doubled: Game = {
      ...fitted,
      nodes: fitted.nodes.map((node) =>
        node.type === 'server'
          ? { ...node, workers: Math.min(POOL_LIMITS.max, node.workers * 2) }
          : node,
      ),
    }
    return onServers(doubled, (current, id) => ok(current, setPm(current, id, pm)))
  }

type OptionSet = Readonly<{
  name: string
  options: ReadonlyArray<readonly [string, (game: Game) => Game]>
}>

const OPTION_SETS: ReadonlyArray<OptionSet> = [
  { name: 'runtimes', options: RUNTIME_IDS.map((id) => [id, runtimeOption(id)] as const) },
  ...LANGUAGE_IDS.map((language) => ({
    name: `${language} frameworks`,
    options: FRAMEWORK_IDS.filter(
      (id) => FRAMEWORKS[id].language === language || FRAMEWORKS[id].language === null,
    ).map((id) => [id, frameworkOption(language, id)] as const),
  })),
  { name: 'instance families', options: FAMILY_IDS.map((id) => [id, familyOption(id)] as const) },
  {
    name: 'PHP-FPM process managers',
    options: (Object.keys(PM_MODES) as ReadonlyArray<PmMode>).map(
      (pm) => [pm, pmOption(pm)] as const,
    ),
  },
]

/**
 * Pairs no reference design separates yet. The GDD separates them on what this
 * test does not score: BEAM holds a realtime connection in half the memory, and
 * Axum and Actix each beat the other by 5% (GDD 06: Axum 1.0× CPU and 1.15×
 * velocity, Actix 0.95× and 1.10×), under the 10% bar. They wait for the Series
 * A reference designs (plan B14). Go against Kestrel, and Gin, Axum, and Actix
 * against their bare runtimes, separated once the design pace ran the Team on
 * the live calendar (SIM_VERSION 8). The list is exact: a new gap fails, and so
 * does a closed one.
 */
const KNOWN_GAPS: Readonly<Record<string, ReadonlyArray<string>>> = {
  runtimes: ['beam never beats go', 'beam never beats kestrel'],
  'rust frameworks': ['axum never beats actix', 'actix never beats axum'],
}

/** `a` beats `b` by at least 10% on this score. Lower is better for p99 and errors. */
const beats = (a: Scores, b: Scores): ReadonlyArray<string> => {
  const wins: Array<string> = []
  if (a.value >= b.value * 1.1 && a.value > 0) wins.push('revenue per Burn')
  if (a.p99 * 1.1 <= b.p99) wins.push('p99')
  if (a.errors * 1.1 <= b.errors && b.errors - a.errors > 0.001) wins.push('errors')
  if (a.velocity >= b.velocity * 1.1) wins.push('velocity')
  return wins
}

describe.skipIf(!SLOW)('the dominance test', () => {
  for (const set of OPTION_SETS)
    // The runtimes set takes about 62 s alone on a 2-core machine.
    test(`${set.name}: every option beats every sibling somewhere`, { timeout: 240_000 }, () => {
      const table = set.options.map(([name, apply]) => ({
        name,
        scores: DESIGNS.map(([, start]) => score(apply(start()))),
      }))
      const dominated: Array<string> = []
      for (const a of table)
        for (const b of table) {
          if (a === b) continue
          const somewhere = a.scores.some((scores, index) => {
            const other = b.scores[index]
            return other !== undefined && beats(scores, other).length > 0
          })
          if (!somewhere) dominated.push(`${a.name} never beats ${b.name}`)
        }
      expect(dominated).toEqual(KNOWN_GAPS[set.name] ?? [])
    })
})
