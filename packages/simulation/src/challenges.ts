import { Effect, Result, Schema } from 'effect'
import type { ComponentId, IncidentId, RequestKind, ResearchId } from './catalog.ts'
import { COMPONENTS, DESIGN_TUNING, KINDS, REQUEST_KINDS, TASKS } from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { isDown } from './lookups.ts'
import { migrationCost } from './migration.ts'
import { serviceOf, stackOf, withService } from './team.ts'
import { company, link, node } from './company.ts'
import { forceIncident } from './director.ts'
import { hashGame } from './hash.ts'
import { SHARED } from './playbook.ts'
import * as Actions from './actions.ts'
import type { RegionId } from './catalog.ts'
import {
  SERIES_B_RESEARCH,
  SERIES_C_RESEARCH,
  seriesBData,
  seriesBLinks,
  seriesCData,
  seriesCLinks,
} from './sandbox.ts'
import { nextRandom } from './random.ts'
import { applyAction, applyDesign, type Replay, type Response } from './replay.ts'
import { solveFlow } from './solve.ts'
import type { Game, GameLink, GameNode } from './state.ts'
import { StepEvent } from './events.ts'
import { step } from './step.ts'
import { SIM_VERSION } from './version.ts'

/* ==========================================================================
   Challenges (14 "Challenges"): fixed puzzles outside any Company. A fixed
   start, palette, demand script and scripted incidents; the player's Design
   runs from t = 0 on a fixed seed and scores three axes, lower is better:
   Cost (mean Burn per second), Tail (request-weighted p99) and Complexity
   (Nodes plus Links). The browser and the API Worker run the same code.
   ========================================================================== */

export type ScoreAxis = 'cost' | 'tail' | 'complexity'
export const SCORE_AXES: ReadonlyArray<ScoreAxis> = ['cost', 'tail', 'complexity']

export type Challenge = Readonly<{
  id: string
  name: string
  /** The Era whose Challenges hold it, and whose request mix it runs. */
  era: number
  brief: string
  inspiredBy: string
  /** First-completion Legacy, 1 to 10 by difficulty; the daily drill pays none. */
  legacy: number
  start: () => Game
  /** Sim seconds the run lasts. */
  duration: number
  /** Sim seconds per Step, the same in the browser and on the server. */
  stepSeconds: number
  /**
   * Users from each time on, in sim seconds. The first entry is at 0. An entry with a mix
   * sends that mix from then on, as when a million clients reconnect at once.
   */
  demand: ReadonlyArray<
    Readonly<{ at: number; users: number; mix?: Partial<Record<RequestKind, number>> }>
  >
  incidents: ReadonlyArray<
    Readonly<{ at: number; kind: IncidentId; only?: ComponentId; magnitude?: number }>
  >
  /**
   * Nodes that go down until replaced: the first `count` live Nodes of a type, in board
   * order, and only in `region` when it is set.
   */
  outages?: ReadonlyArray<
    Readonly<{ at: number; type: ComponentId; count: number; region?: RegionId }>
  >
  /** The incident responses a run may use; unset allows every one. */
  responses?: ReadonlyArray<Response>
  /** Most Dev Hours the Design may spend on fixes and Stack changes. */
  devHours?: number
  targets: Readonly<{
    /** Highest share of failed requests. */
    errors: number
    /** Highest Tail, in ms. */
    tail?: number
    /** Highest Cost, in dollars per second. */
    cost?: number
    /** Highest share of requests refused for want of a connection. */
    refused?: number
    /** Lowest margin: revenue less Burn, as a share of revenue. */
    margin?: number
    /** Highest share of one request kind's requests that fail. */
    kinds?: Partial<Record<RequestKind, number>>
    /** Highest p99 of one request kind, in ms, weighted by its rate. */
    kindTail?: Partial<Record<RequestKind, number>>
  }>
  /** A rule the Design must keep, as the reason it breaks it, or null. */
  rule?: (game: Game) => string | null
  /** Histogram bucket edges per axis, ascending. */
  edges: Readonly<Record<ScoreAxis, ReadonlyArray<number>>>
}>

/** Sim seconds before the run is scored: caches and pools fill first. */
export const WARMUP = 30

const SEED = 20_261_102

const board = (
  era: number,
  users: number,
  palette: ReadonlyArray<ResearchId>,
  nodes: ReadonlyArray<GameNode>,
  links: ReadonlyArray<readonly [string, string]>,
  seed = SEED,
): Game => ({
  ...company(seed),
  sandbox: true,
  cash: 0,
  stage: era,
  users,
  researched: ['stripe', 'logs', 'metrics', 'percentiles', ...palette],
  nodes: [node('users', 'users', 120, 280), ...nodes],
  links: links.map(([from, to]): GameLink => link(from, to)),
  nextId: 1,
})

const servers = (game: Game) => game.nodes.filter((entry) => entry.type === 'server')

const SEED_PALETTE: ReadonlyArray<ResearchId> = [
  'php-fpm',
  'load-balancing',
  'pooling',
  'caching',
  'replication',
  'full-text-search',
  'object-storage',
  'cdn',
  'waf',
  'background-jobs',
  'queues',
  'lang-csharp',
  'lang-go',
]

/** Nodes the player can change: what Stack Overflow on a Shoestring counts. */
const placed = (game: Game) =>
  game.nodes.filter((entry) => !COMPONENTS[entry.type].fixed && !SHARED.includes(entry.type))

const PRESEED_PALETTE: ReadonlyArray<ResearchId> = [
  'php-fpm',
  'load-balancing',
  'pooling',
  'caching',
  'lang-node',
  'node-cluster',
]

/**
 * C10k: half the requests are realtime connections that stay open for minutes, so
 * 10,000 are open at once. A runtime with a worker per connection refuses them.
 */
const C10K_USERS = 3_400
/** 800 requests per second at Seed's mix. */
const SHOESTRING_USERS = 40_000
const C10K_MIX: Partial<Record<RequestKind, number>> = { page: 0.3, read: 0.2, rt: 0.5 }

const STUFFING_USERS = 12_000
/** The forecast: launch day grows it 50× over 10 minutes. */
const POKEMON_USERS = 4_000
/** Users each minute from minute 1: 50× the forecast in 10 equal ratios, 4,000 × 50^(m/10). */
const POKEMON_RAMP = [
  4_000, 5_915, 8_747, 12_935, 19_127, 28_284, 41_826, 61_850, 91_461, 135_249, 200_000,
]
const LAUNCH_USERS = 20_000
/** Half the requests keep a chat connection open: about a million at once. */
const HERD_USERS = 60_000
const HERD_MIX: Partial<Record<RequestKind, number>> = {
  rt: 0.5,
  page: 0.15,
  read: 0.2,
  write: 0.1,
  login: 0.02,
  media: 0.03,
}
/** Every client that lost its connection logs in again before it reconnects. */
const RECONNECT_MIX: Partial<Record<RequestKind, number>> = {
  rt: 0.45,
  login: 0.35,
  read: 0.2,
}
/** Each realtime request holds its connection for minutes: about two million open at once. */
const SOCKETS_USERS = 500_000
const SOCKETS_MIX: Partial<Record<RequestKind, number>> = { rt: 0.98, page: 0.01, read: 0.01 }
const FRIDAY_USERS = 16_000
const FRIDAY_COST = 40
const EAST_USERS = 16_000
const ONCE_USERS = 16_000
const N_PLUS_ONE_USERS = 2_000
const N_PLUS_ONE_COST = 2.8
/** A migration off Rails costs about 40 Dev Hours. */
const N_PLUS_ONE_KLOC = 40
const THIRTEEN_USERS = 20_000
const THIRTEEN_COST = 11.5
/** Thousands of lines: a rewrite costs more Dev Hours than the team has. */
const THIRTEEN_KLOC = 115

/** A hot read service: what Discord's Read States answers. */
const READ_STATES_USERS = 4_000
const READ_STATES_MIX: Partial<Record<RequestKind, number>> = { read: 0.85, write: 0.05, rt: 0.1 }
const NOON_USERS = 8_000
/** An AI product: two in five requests are prompts. */
const GPU_USERS = 8_500
const GPU_MIX: Partial<Record<RequestKind, number>> = {
  ai: 0.4,
  page: 0.3,
  read: 0.25,
  login: 0.05,
}
/** A paid assistant: each prompt earns four times a free one. */
const GPU_VALUE: Partial<Record<RequestKind, number>> = { ai: 4 }
/** A timeline service: most requests read a feed, and some accounts have millions of followers. */
const WHALE_USERS = 8_000
const WHALE_MIX: Partial<Record<RequestKind, number>> = {
  feed: 0.45,
  page: 0.15,
  read: 0.15,
  write: 0.12,
  login: 0.03,
  rt: 0.1,
}
const STORM_USERS = 10_000
const REGEX_USERS = 24_000

/**
 * A Series B board: Go App Servers behind a Load Balancer and a Database, with files,
 * checkouts, AI, exports and, with `warehouse`, a Data Warehouse.
 */
const seriesB = (
  users: number,
  count: number,
  extra: Partial<GameNode>,
  database: number,
  palette: ReadonlyArray<ResearchId>,
  warehouse = false,
): Game => {
  const ids = Array.from({ length: count }, (_, index) => `server${index + 1}`)
  return board(
    4,
    users,
    [...SERIES_B_RESEARCH, ...palette],
    [
      node('lb', 'lb', 360, 280),
      ...ids.map((id, index) =>
        node(id, 'server', 600, 280 + 280 * (index - (ids.length - 1) / 2), {
          size: 3,
          runtime: 'go',
          ...extra,
        }),
      ),
      node('database', 'database', 880, 220, { size: database }),
      ...seriesBData(warehouse),
    ],
    seriesBLinks(ids, warehouse),
  )
}

const CELEBRITY_USERS = 1_000_000
const PARTITION_USERS = 8_000
const BGP_USERS = 8_000
const TYPO_USERS = 8_000
const SUN_USERS = 400_000
const LEAP_USERS = 8_000
const FORTY_USERS = 20_000
const NINES_USERS = 8_000
/** A web app with checkout and feeds: the kinds a Design keeps up through every failure. */
const NINES_MIX: Partial<Record<RequestKind, number>> = {
  page: 0.3,
  read: 0.3,
  write: 0.15,
  login: 0.05,
  rt: 0.1,
  buy: 0.05,
  feed: 0.05,
}
const DAY = 1_440
const POSTGRES_USERS = 24_000
/** What Postgres for Everything replaces: every data Component that is not Postgres. */
const NOT_POSTGRES: ReadonlyArray<ComponentId> = [
  'cache',
  'search',
  'storage',
  'wide',
  'dsql',
  'queue',
  'worker',
  'warehouse',
]
/** A cheap plan: every request earns a third of its catalog value. */
const FORTY_VALUE: Partial<Record<RequestKind, number>> = Object.fromEntries(
  REQUEST_KINDS.map((kind) => [kind, 1 / 3]),
)
/** Series C's mix without AI prompts: a SaaS product before its assistant. */
const SAAS_MIX: Partial<Record<RequestKind, number>> = {
  page: 0.16,
  read: 0.2,
  write: 0.08,
  login: 0.02,
  search: 0.06,
  upload: 0.02,
  bot: 0.07,
  media: 0.1,
  rt: 0.08,
  buy: 0.03,
  job: 0.02,
  report: 0.02,
  feed: 0.08,
  hook: 0.04,
  push: 0.02,
}
/** A social app's web traffic: what follows the sun is the App Servers' load. */
const SUN_MIX: Partial<Record<RequestKind, number>> = {
  page: 0.3,
  read: 0.35,
  write: 0.15,
  login: 0.05,
  rt: 0.15,
}

/** A start built with the board's own actions, which accept it by construction. */
const built = (action: Actions.Action): Game => {
  if (Result.isFailure(action))
    throw new Error(`A Challenge start was refused: ${action.failure._tag}`)
  return action.success
}

/**
 * A Series C board: Go App Servers behind a Load Balancer and a Wide-column Store, with
 * Search, a Warehouse, files, checkouts, AI, pushes and async work.
 */
const seriesC = (
  users: number,
  palette: ReadonlyArray<ResearchId>,
  store: Partial<GameNode> = {},
  extra: Partial<GameNode> = {},
  scale = 1,
  era = 5,
): Game =>
  board(
    era,
    users,
    [...SERIES_C_RESEARCH, ...palette],
    [
      node('lb', 'lb', 360, 280),
      ...[0, 1].map((index) =>
        node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
          size: 3,
          runtime: 'go',
          ...extra,
        }),
      ),
      node('wide', 'wide', 880, 220, { size: 2, n: 3, r: 2, w: 2, ...store }),
      ...seriesCData(scale),
    ],
    seriesCLinks(['server1', 'server2'], 'wide'),
  )

/** Opens a region whose Users reach an App Server there, wired like the home ones. */
const regionServer = (
  game: Game,
  region: RegionId,
  callees: ReadonlyArray<string> = [
    'wide',
    'storage',
    'psp',
    'llm',
    'queue',
    'search',
    'warehouse',
  ],
  size = 3,
): Game => {
  let next = built(
    Actions.place(built(Actions.openRegion(game, region)), 'server', 600, 300, region),
  )
  const id = next.nodes.at(-1)?.id ?? ''
  next = {
    ...next,
    nodes: next.nodes.map((entry) =>
      entry.id === id ? { ...entry, size, runtime: 'go' as const } : entry,
    ),
  }
  for (const to of callees) next = built(Actions.connect(next, id, to))
  return built(Actions.connect(next, `users-${region}`, id))
}

/** Pre-seed's mix, without the Seed's uploads and bots: what an ORM's reads load. */
const PAGES_AND_READS: Partial<Record<RequestKind, number>> = {
  page: 0.45,
  read: 0.35,
  write: 0.15,
  login: 0.05,
}

/**
 * Rails App Servers behind a Load Balancer and a Database, on a codebase of `kloc`
 * thousand lines. With `files`, Search and Object Storage for the Seed's other kinds.
 */
const railsBoard = (
  users: number,
  count: number,
  size: number,
  database: number,
  kloc: number,
  files: boolean,
): Game => {
  const { nodes, links } = fleet(count, { runtime: 'puma', framework: 'rails', size }, 'database')
  const ids = nodes.filter((entry) => entry.type === 'server').map((entry) => entry.id)
  const game = board(
    2,
    users,
    [...SEED_PALETTE, 'lang-ruby', 'fw-rails', 'eager-loading', 'lang-node', 'fw-express'],
    [
      ...nodes,
      node('database', 'database', 880, 220, { size: database }),
      ...(files ? [node('search', 'search', 880, 400), node('storage', 'storage', 880, 560)] : []),
    ],
    [
      ...links,
      ...(files
        ? ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
            [id, 'search'],
            [id, 'storage'],
          ])
        : []),
    ],
  )
  return { ...withService(game, { codebase: kloc }), scenario: { tasks: true } }
}

const SERIES_A_PALETTE: ReadonlyArray<ResearchId> = [
  'load-balancing',
  'health-checks',
  'caching',
  'pooling',
  'replication',
  'full-text-search',
  'object-storage',
  'cdn',
  'waf',
  'background-jobs',
  'queues',
  'lang-go',
  'lang-java',
  'lang-csharp',
  'lang-node',
  'node-cluster',
  'checkout',
  'multi-az',
  'autoscaling',
  'containers',
  'timeouts',
  'backoff-jitter',
  'circuit-breakers',
  'load-shedding',
]

/**
 * A Series A board: Go App Servers behind a Load Balancer, each linked to the Database,
 * Object Storage and the Payment Provider. `extra` adds settings to every App Server.
 */
const seriesA = (
  users: number,
  count: number,
  extra: Partial<GameNode>,
  database: number,
  palette: ReadonlyArray<ResearchId> = [],
): Game => {
  const { nodes, links } = fleet(count, { runtime: 'go', size: 2, ...extra }, 'database')
  const ids = nodes.filter((entry) => entry.type === 'server').map((entry) => entry.id)
  return board(
    3,
    users,
    [...SERIES_A_PALETTE, ...palette],
    [
      ...nodes,
      node('database', 'database', 1_000, 220, { size: database }),
      node('search', 'search', 1_000, 60),
      node('storage', 'storage', 1_000, 420),
      node('psp', 'psp', 1_000, 580),
    ],
    [
      ...links,
      ...ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
        [id, 'search'],
        [id, 'storage'],
        [id, 'psp'],
      ]),
    ],
  )
}

/** A Load Balancer in front of `count` App Servers, all linked to `to`. */
const fleet = (
  count: number,
  extra: Partial<GameNode>,
  to: string,
): Readonly<{
  nodes: ReadonlyArray<GameNode>
  links: ReadonlyArray<readonly [string, string]>
}> => {
  const ids = Array.from({ length: count }, (_, index) => `server${index + 1}`)
  return {
    nodes: [
      node('lb', 'lb', 320, 280),
      ...ids.map((id, index) =>
        count <= 4
          ? // A few App Servers get room for their cards; a large fleet packs in a grid.
            node(id, 'server', 560, 280 + 280 * (index - (count - 1) / 2), extra)
          : node(id, 'server', 560 + 60 * Math.floor(index / 10), 40 + 52 * (index % 10), extra),
      ),
    ],
    links: [
      ['users', 'lb'],
      ...ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
        ['lb', id],
        [id, to],
      ]),
    ],
  }
}

export const CHALLENGES: ReadonlyArray<Challenge> = [
  {
    id: 'hello-world',
    name: 'Hello, World',
    era: 0,
    brief: 'Serve 20 rps on one box under $0.05/s.',
    inspiredBy: 'Every first deploy',
    legacy: 1,
    start: () =>
      board(
        0,
        1_000,
        [],
        [node('server', 'server', 440, 280, { localDb: true, family: 'burstable', credits: 3 })],
        [['users', 'server']],
      ),
    duration: 180,
    stepSeconds: 1,
    demand: [{ at: 0, users: 1_000 }],
    incidents: [],
    targets: { errors: 0.01, cost: 0.05 },
    edges: {
      cost: [0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05],
      tail: [100, 200, 300, 400, 500, 600, 800, 1_000, 1_500],
      complexity: [2, 3, 4, 5, 6, 8],
    },
  },
  {
    id: 'split-the-box',
    name: 'Split the Box',
    era: 0,
    brief: 'App and database share a box. Reach 100 rps with p99 under 300 ms.',
    inspiredBy: 'The first scaling step at most companies',
    legacy: 1,
    start: () =>
      board(
        0,
        5_000,
        ['load-balancing'],
        [node('server', 'server', 440, 280, { localDb: true })],
        [['users', 'server']],
      ),
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: 5_000 }],
    incidents: [],
    // A bigger box passes too, at a higher Cost: an app box and a database box each sized
    // and shaped for their own work are the cheapest Design under the tail target.
    targets: { errors: 0.01, tail: 300 },
    edges: {
      cost: [0.26, 0.28, 0.3, 0.32, 0.34, 0.37, 0.4, 0.45, 0.5],
      tail: [200, 220, 240, 250, 260, 270, 280, 290, 300],
      complexity: [2, 3, 4, 5, 6, 8, 10],
    },
  },
  {
    id: 'slashdotted',
    name: 'Slashdotted',
    era: 1,
    brief: '×10 traffic for 3 minutes on a fixed budget.',
    inspiredBy: 'The Slashdot effect',
    legacy: 2,
    start: () => {
      const { nodes, links } = fleet(2, { runtime: 'php_fpm', workers: 16 }, 'database')
      return board(
        1,
        1_500,
        PRESEED_PALETTE,
        [...nodes, node('database', 'database', 880, 280, { size: 2 })],
        links,
      )
    },
    duration: 300,
    stepSeconds: 1,
    demand: [
      { at: 0, users: 1_500 },
      { at: 60, users: 15_000 },
      { at: 240, users: 1_500 },
    ],
    incidents: [],
    targets: { errors: 0.02, cost: 4 },
    edges: {
      cost: [2.5, 2.75, 3, 3.25, 3.5, 3.75, 4],
      tail: [100, 200, 300, 400, 600, 800, 1_000, 1_500, 2_000],
      complexity: [20, 25, 30, 35, 40, 45, 50, 60],
    },
  },
  {
    id: 'c10k',
    name: 'C10k',
    era: 1,
    brief: '10,000 open connections. Process-per-request servers refuse them.',
    inspiredBy: 'Dan Kegel’s C10k problem (1999)',
    legacy: 2,
    start: () => ({
      ...(() => {
        const { nodes, links } = fleet(2, { runtime: 'php_fpm', workers: 24, size: 2 }, 'database')
        return board(
          1,
          C10K_USERS,
          PRESEED_PALETTE,
          [...nodes, node('database', 'database', 880, 280, { size: 2 })],
          links,
        )
      })(),
      scenario: { mix: C10K_MIX },
    }),
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: C10K_USERS }],
    incidents: [],
    targets: { errors: 0.01 },
    edges: {
      cost: [0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 2],
      tail: [60, 80, 100, 125, 150, 200, 250, 300],
      complexity: [3, 4, 5, 6, 8, 10, 12],
    },
  },
  {
    id: 'event-loop',
    name: 'The Event Loop',
    era: 1,
    brief: 'Node.js only. 5% login. p99 under 300 ms.',
    inspiredBy: 'Node.js “Don’t block the event loop”',
    legacy: 2,
    start: () =>
      board(
        1,
        6_000,
        PRESEED_PALETTE,
        [
          node('server', 'server', 440, 280, { size: 3, runtime: 'node' }),
          node('database', 'database', 760, 280, { size: 3 }),
        ],
        [
          ['users', 'server'],
          ['server', 'database'],
        ],
      ),
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: 6_000 }],
    incidents: [],
    targets: { errors: 0.01, tail: 300 },
    rule: (game) =>
      servers(game).every((entry) => entry.runtime === 'node' || entry.runtime === 'node_cluster')
        ? null
        : 'Every App Server runs Node.js.',
    edges: {
      cost: [0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 2, 2.5],
      tail: [50, 75, 100, 125, 150, 200, 250, 300],
      complexity: [4, 5, 6, 7, 8, 10, 12, 15],
    },
  },
  {
    id: 'too-many-connections',
    name: 'Too Many Connections',
    era: 1,
    brief: '40 App Servers, one Postgres. No refused connections.',
    inspiredBy: 'PostgreSQL connection limits',
    legacy: 3,
    start: () => {
      const { nodes, links } = fleet(40, { runtime: 'php_fpm', workers: 40 }, 'database')
      return board(
        1,
        20_000,
        PRESEED_PALETTE,
        [...nodes, node('database', 'database', 1_000, 280, { size: 4 })],
        links,
      )
    },
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: 20_000 }],
    incidents: [{ at: 120, kind: 'connections' }],
    targets: { errors: 0.01, refused: 0 },
    rule: (game) =>
      servers(game).length < 40
        ? 'Keep 40 App Servers.'
        : game.nodes.filter((entry) => entry.type === 'database').length !== 1
          ? 'Keep one Database.'
          : null,
    edges: {
      cost: [6, 7, 8, 9, 10, 10.5, 11, 12, 14],
      tail: [100, 150, 200, 250, 300, 400, 600, 800, 1_000],
      complexity: [120, 122, 124, 126, 128, 130, 135, 140],
    },
  },
  {
    id: 'shoestring',
    name: 'Stack Overflow on a Shoestring',
    era: 2,
    brief: 'Serve 800 rps with at most 12 Nodes.',
    inspiredBy: 'Stack Overflow serving huge traffic from a small number of servers',
    legacy: 3,
    start: () => {
      const { nodes, links } = fleet(2, { runtime: 'php_fpm', workers: 16, size: 2 }, 'database')
      return board(
        2,
        SHOESTRING_USERS,
        SEED_PALETTE,
        [
          ...nodes,
          node('database', 'database', 880, 220, { size: 2 }),
          node('search', 'search', 880, 400),
          node('storage', 'storage', 880, 560),
        ],
        [
          ...links,
          ...['server1', 'server2'].flatMap((id): ReadonlyArray<readonly [string, string]> => [
            [id, 'search'],
            [id, 'storage'],
          ]),
        ],
      )
    },
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: SHOESTRING_USERS }],
    incidents: [],
    targets: { errors: 0.01, tail: 500 },
    rule: (game) => (placed(game).length > 12 ? 'Use at most 12 Nodes.' : null),
    edges: {
      cost: [10, 11, 12, 13, 14, 15, 17, 20],
      tail: [100, 150, 200, 250, 300, 350, 400, 500],
      complexity: [6, 7, 8, 9, 10, 11, 12, 14],
    },
  },
  {
    id: 'n-plus-one',
    name: 'The N+1',
    era: 2,
    brief: 'Rails with N+1 queries. 12 Dev Hours to fix it.',
    inspiredBy: 'ORM lazy loading',
    legacy: 3,
    start: () => {
      const game = railsBoard(N_PLUS_ONE_USERS, 2, 2, 1, N_PLUS_ONE_KLOC, false)
      return { ...game, scenario: { ...game.scenario, mix: PAGES_AND_READS } }
    },
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: N_PLUS_ONE_USERS }],
    incidents: [],
    devHours: 12,
    targets: { errors: 0.01, cost: N_PLUS_ONE_COST },
    edges: {
      cost: [1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8],
      tail: [200, 250, 300, 400, 500, 750, 1_000, 1_500, 2_000],
      complexity: [5, 6, 7, 8, 9, 10, 12],
    },
  },
  {
    id: 'thirteen-engineers',
    name: 'Thirteen Engineers',
    era: 2,
    brief: 'Rails at 400 rps. 13 engineers have one day: 104 Dev Hours.',
    inspiredBy: 'Instagram had 13 employees when Facebook acquired it (2012)',
    legacy: 4,
    start: () => railsBoard(THIRTEEN_USERS, 3, 3, 3, THIRTEEN_KLOC, true),
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: THIRTEEN_USERS }],
    incidents: [],
    devHours: 104,
    targets: { errors: 0.01, cost: THIRTEEN_COST },
    edges: {
      cost: [9, 9.5, 10, 10.5, 11, 11.5],
      tail: [200, 250, 300, 350, 400, 500, 750, 1_000],
      complexity: [16, 18, 20, 22, 24, 26, 30],
    },
  },
  {
    id: 'credential-stuffing',
    name: 'Credential Stuffing',
    era: 2,
    brief: 'Bots try leaked passwords on login. Keep real users signing in.',
    inspiredBy: 'Common attacks on login endpoints',
    legacy: 3,
    start: () => {
      const { nodes, links } = fleet(2, { runtime: 'php_fpm', workers: 24, size: 3 }, 'database')
      return board(
        2,
        STUFFING_USERS,
        [...SEED_PALETTE, 'auth-provider'],
        [
          ...nodes,
          node('database', 'database', 880, 220, { size: 4 }),
          node('search', 'search', 880, 400),
          node('storage', 'storage', 880, 560),
        ],
        [
          ...links,
          ...['server1', 'server2'].flatMap((id): ReadonlyArray<readonly [string, string]> => [
            [id, 'search'],
            [id, 'storage'],
          ]),
        ],
      )
    },
    duration: 300,
    stepSeconds: 1,
    demand: [{ at: 0, users: STUFFING_USERS }],
    incidents: [{ at: 90, kind: 'stuffing' }],
    targets: { errors: 0.01 },
    edges: {
      cost: [8, 9, 10, 11, 12, 13, 14, 16],
      tail: [150, 200, 250, 300, 400, 500, 750, 1_000],
      complexity: [15, 16, 17, 18, 19, 20, 22, 25],
    },
  },
  {
    id: 'black-friday',
    name: 'Black Friday',
    era: 3,
    brief: 'Demand triples at minute 5 for 5 minutes. Spend as little as you can.',
    inspiredBy: 'Retail peak days',
    legacy: 4,
    start: () => seriesA(FRIDAY_USERS, 2, {}, 4),
    duration: 900,
    stepSeconds: 1,
    demand: [
      { at: 0, users: FRIDAY_USERS },
      { at: 300, users: FRIDAY_USERS * 3 },
      { at: 600, users: FRIDAY_USERS },
    ],
    incidents: [],
    targets: { errors: 0.01, cost: FRIDAY_COST },
    edges: {
      cost: [28, 30, 32, 34, 36, 38, 40],
      tail: [200, 225, 250, 275, 300, 400, 500, 750],
      complexity: [20, 24, 28, 32, 36, 40, 45, 50],
    },
  },
  {
    id: 'us-east-1',
    name: 'us-east-1',
    era: 3,
    brief: 'A zone dies at minute 5. Keep 99.9% of requests.',
    inspiredBy: 'Several AWS us-east-1 outages',
    legacy: 4,
    start: () => seriesA(EAST_USERS, 3, {}, 4),
    duration: 900,
    stepSeconds: 1,
    demand: [{ at: 0, users: EAST_USERS }],
    incidents: [{ at: 300, kind: 'zone' }],
    targets: { errors: 0.001 },
    edges: {
      cost: [22, 24, 26, 28, 30, 32, 36, 40],
      tail: [200, 225, 250, 275, 300, 400, 500, 750],
      complexity: [18, 20, 22, 24, 26, 28, 32, 36],
    },
  },
  {
    id: 'exactly-once',
    name: 'Exactly Once',
    era: 3,
    brief: 'The Payment Provider slows to 2 s, twice. Charge each checkout once.',
    inspiredBy: 'Payment idempotency',
    legacy: 4,
    start: () => {
      const game = seriesA(ONCE_USERS, 2, {}, 4)
      // Checkouts give up after a second and retry at once.
      return {
        ...game,
        links: game.links.map((entry) =>
          entry.to === 'psp' ? { ...entry, timeout: 1, retries: 'naive' as const } : entry,
        ),
      }
    },
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: ONCE_USERS }],
    incidents: [
      { at: 120, kind: 'double-charge' },
      { at: 300, kind: 'double-charge' },
    ],
    targets: { errors: 0.01, kinds: { buy: 0.02 } },
    edges: {
      cost: [17, 18, 19, 20, 21, 22, 24, 26],
      tail: [225, 250, 275, 300, 350, 400, 500, 750],
      complexity: [14, 16, 18, 20, 22, 24, 28],
    },
  },
  {
    id: 'two-million-sockets',
    name: 'Two Million Sockets',
    era: 3,
    brief: 'Two million open chat connections. Hold them for the fewest dollars.',
    inspiredBy: 'Phoenix reached 2 million WebSocket connections on one server (2015)',
    legacy: 5,
    start: () => {
      const { nodes, links } = fleet(4, { runtime: 'tomcat', size: 4 }, 'database')
      return {
        ...board(
          3,
          SOCKETS_USERS,
          [...SERIES_A_PALETTE, 'lang-elixir', 'lang-rust', 'fw-phoenix'],
          [
            ...nodes.map((entry) => (entry.type === 'lb' ? { ...entry, size: 4 } : entry)),
            node('database', 'database', 1_000, 280, { size: 3 }),
          ],
          links,
        ),
        scenario: { mix: SOCKETS_MIX },
      }
    },
    duration: 240,
    stepSeconds: 1,
    demand: [{ at: 0, users: SOCKETS_USERS }],
    incidents: [],
    targets: { errors: 0.01 },
    edges: {
      cost: [8, 10, 12, 14, 16, 18, 20, 25],
      tail: [40, 45, 50, 60, 70, 80, 100, 150],
      complexity: [3, 4, 5, 6, 8, 10, 12, 15],
    },
  },
  {
    id: 'pokemon-go',
    name: 'Pokémon GO',
    era: 3,
    brief: 'Launch day: demand reaches 50× the forecast within 10 minutes.',
    inspiredBy: 'Pokémon GO launch traffic reached about 50× the planned target (2016)',
    legacy: 5,
    start: () => seriesA(POKEMON_USERS, 2, {}, 3),
    duration: 780,
    stepSeconds: 1,
    demand: [
      { at: 0, users: POKEMON_USERS },
      ...POKEMON_RAMP.map((users, minute) => ({ at: 60 + minute * 60, users })),
    ],
    incidents: [],
    targets: { errors: 0.02 },
    edges: {
      cost: [70, 80, 90, 100, 110, 120, 140, 160],
      tail: [150, 175, 200, 225, 250, 300, 400, 500],
      complexity: [24, 28, 32, 36, 40, 50, 60, 80],
    },
  },
  {
    id: 'healthcare-launch',
    name: 'Healthcare Launch Day',
    era: 3,
    brief: 'Launch is at minute 2, and this Design has many faults. Find them.',
    inspiredBy: 'The healthcare.gov launch (2013)',
    legacy: 5,
    start: () => {
      const { nodes, links } = fleet(
        3,
        { runtime: 'php_fpm', workers: 120, size: 2, family: 'burstable', credits: 30 },
        'database',
      )
      return board(
        3,
        LAUNCH_USERS / 10,
        [...SERIES_A_PALETTE, 'php-fpm', 'auth-provider', 'query-analysis'],
        [
          ...nodes.map((entry) => (entry.type === 'lb' ? { ...entry, checkEvery: 30 } : entry)),
          node('database', 'database', 1_000, 220, { size: 3, family: 'burstable', credits: 60 }),
          node('cache', 'cache', 800, 60, { ttl: 10 }),
          node('search', 'search', 1_000, 40),
          node('storage', 'storage', 1_000, 420),
          node('psp', 'psp', 1_000, 580),
        ],
        [
          ...links,
          ...['server1', 'server2', 'server3'].flatMap(
            (id): ReadonlyArray<readonly [string, string]> => [
              [id, 'cache'],
              [id, 'search'],
              [id, 'storage'],
              [id, 'psp'],
            ],
          ),
        ],
      )
    },
    duration: 600,
    stepSeconds: 1,
    demand: [
      { at: 0, users: LAUNCH_USERS / 10 },
      { at: 120, users: LAUNCH_USERS / 2 },
      { at: 180, users: LAUNCH_USERS },
    ],
    incidents: [],
    targets: { errors: 0.02 },
    edges: {
      cost: [16, 18, 20, 22, 24, 26, 28, 32],
      tail: [200, 250, 300, 400, 500, 750, 1_000, 1_500],
      complexity: [24, 26, 28, 30, 32, 35, 40],
    },
  },
  {
    id: 'thundering-herd',
    name: 'Thundering Herd',
    era: 3,
    brief: 'The chat servers restart at minute 2. A million clients reconnect and log in at once.',
    inspiredBy: 'Reconnect storms',
    legacy: 5,
    start: () => ({
      ...seriesA(HERD_USERS, 3, { size: 3 }, 5, ['auth-provider']),
      scenario: { mix: HERD_MIX },
    }),
    duration: 420,
    stepSeconds: 1,
    demand: [
      { at: 0, users: HERD_USERS },
      { at: 120, users: HERD_USERS * 4, mix: RECONNECT_MIX },
      { at: 150, users: HERD_USERS * 2, mix: RECONNECT_MIX },
      { at: 180, users: HERD_USERS, mix: HERD_MIX },
    ],
    incidents: [],
    targets: { errors: 0.02 },
    edges: {
      cost: [22, 24, 26, 28, 30, 32, 36, 40],
      tail: [100, 125, 150, 175, 200, 250, 300, 400],
      complexity: [20, 22, 24, 26, 28, 30, 35, 40],
    },
  },
  {
    id: 'read-states',
    name: 'Read States',
    era: 4,
    brief: 'The heap fills twice. Keep the p99 under 90 ms. Any runtime.',
    inspiredBy: 'Discord moved a service from Go to Rust to remove GC spikes (2020)',
    legacy: 6,
    start: () => {
      const ids = ['server1', 'server2']
      return {
        ...board(
          4,
          READ_STATES_USERS,
          [
            'load-balancing',
            'lang-go',
            'lang-java',
            'lang-rust',
            'lang-elixir',
            'zgc',
            'gogc-tuning',
          ],
          [
            node('lb', 'lb', 360, 280),
            ...ids.map((id, index) =>
              node(id, 'server', 600, 180 + index * 240, {
                size: 1,
                family: 'compute',
                runtime: 'tomcat',
              }),
            ),
            node('database', 'database', 880, 280, { size: 4 }),
          ],
          [
            ['users', 'lb'],
            ...ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
              ['lb', id],
              [id, 'database'],
            ]),
          ],
        ),
        scenario: { mix: READ_STATES_MIX },
      }
    },
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: READ_STATES_USERS }],
    incidents: [
      { at: 90, kind: 'gc-storm', only: 'server' },
      { at: 270, kind: 'gc-storm', only: 'server' },
    ],
    targets: { errors: 0.01, tail: 90 },
    edges: {
      cost: [2, 3, 4, 5, 6, 7, 8, 9],
      tail: [78, 79, 80, 81, 82, 84, 86, 90],
      complexity: [4, 5, 6, 7, 8, 9, 10, 12],
    },
  },
  {
    id: 'fail-whale',
    name: 'The Fail Whale',
    era: 4,
    brief: 'Serve feeds under 200 ms at the p99. Some accounts have 10 million followers.',
    inspiredBy: "Twitter's timeline scaling problems",
    legacy: 6,
    start: () => {
      const ids = ['server1', 'server2', 'server3']
      return {
        ...board(
          4,
          WHALE_USERS,
          ['load-balancing', 'lang-go', 'caching', 'replication', 'pooling', 'hybrid-fanout'],
          [
            node('lb', 'lb', 360, 280),
            ...ids.map((id, index) =>
              node(id, 'server', 600, 280 + 280 * (index - (ids.length - 1) / 2), {
                size: 3,
                runtime: 'go',
              }),
            ),
            node('database', 'database', 880, 280, { size: 4 }),
          ],
          [
            ['users', 'lb'],
            ...ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
              ['lb', id],
              [id, 'database'],
            ]),
          ],
        ),
        scenario: { mix: WHALE_MIX },
      }
    },
    duration: 300,
    stepSeconds: 1,
    demand: [{ at: 0, users: WHALE_USERS }],
    incidents: [],
    targets: { errors: 0.01, tail: 200, cost: 20 },
    edges: {
      cost: [6, 8, 10, 12, 14, 16, 18, 20],
      tail: [100, 110, 120, 130, 140, 150, 175, 200],
      complexity: [4, 5, 6, 8, 10, 12, 14, 16],
    },
  },
  {
    id: 'reports-at-noon',
    name: 'Reports at Noon',
    era: 4,
    brief:
      'Finance runs its reports on the primary at minute 2 and 5, and they may not be cancelled. Keep checkouts fast.',
    inspiredBy: 'Analytical queries on transactional databases',
    legacy: 6,
    start: () => seriesB(NOON_USERS, 2, {}, 4, []),
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: NOON_USERS }],
    incidents: [
      { at: 120, kind: 'report-db' },
      { at: 300, kind: 'report-db' },
    ],
    responses: [],
    targets: { errors: 0.01, cost: 156, kindTail: { buy: 900 } },
    edges: {
      cost: [146, 148, 150, 152, 153, 154, 155, 156],
      tail: [250, 275, 300, 325, 350, 375, 400, 450],
      complexity: [22, 24, 26, 27, 28, 30, 32, 36],
    },
  },
  {
    id: 'gpu-economics',
    name: 'GPU Economics',
    era: 4,
    brief: 'Serve every AI prompt and keep 15% of revenue as margin.',
    inspiredBy: 'Self-hosted inference against hosted APIs',
    legacy: 6,
    start: () => {
      const ids = ['server1', 'server2']
      const gpus = ['gpu1', 'gpu2', 'gpu3', 'gpu4']
      return {
        ...board(
          4,
          GPU_USERS,
          ['load-balancing', 'lang-go', 'model-serving', 'hosted-models'],
          [
            node('lb', 'lb', 360, 280),
            ...ids.map((id, index) =>
              node(id, 'server', 600, 180 + index * 200, { size: 3, runtime: 'go' }),
            ),
            node('database', 'database', 880, 280, { size: 3 }),
            ...gpus.map((id, index) =>
              node(id, 'gpu', 1_200, -110 + index * 260, { size: 3, gpu: 'a100' as const }),
            ),
          ],
          [
            ['users', 'lb'],
            ...ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
              ['lb', id],
              [id, 'database'],
              ...gpus.map((gpu): readonly [string, string] => [id, gpu]),
            ]),
          ],
        ),
        scenario: { mix: GPU_MIX, value: GPU_VALUE },
      }
    },
    duration: 300,
    stepSeconds: 1,
    demand: [{ at: 0, users: GPU_USERS }],
    incidents: [],
    targets: { errors: 0.01, margin: 0.15 },
    edges: {
      cost: [750, 780, 800, 820, 840, 860, 880, 900],
      tail: [400, 600, 800, 1_000, 1_200, 1_400, 1_600, 2_000],
      complexity: [9, 10, 11, 12, 13, 14, 15, 18],
    },
  },
  {
    id: 'metastable',
    name: 'Metastable',
    era: 4,
    brief: 'A retry storm is running. Recover with the fewest changes.',
    inspiredBy: 'Metastable failures in distributed systems',
    legacy: 6,
    start: () => {
      const game = seriesB(STORM_USERS, 2, {}, 4, [
        'timeouts',
        'backoff-jitter',
        'circuit-breakers',
        'load-shedding',
      ])
      // Every call to the Database gives up after a second and retries at once.
      return {
        ...game,
        links: game.links.map((entry) =>
          entry.to === 'database' && entry.from.startsWith('server')
            ? { ...entry, timeout: 1, retries: 'naive' as const }
            : entry,
        ),
      }
    },
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: STORM_USERS }],
    incidents: [{ at: 0, kind: 'retry-storm' }],
    targets: { errors: 0.04, cost: 190 },
    edges: {
      cost: [170, 175, 180, 182, 184, 186, 188, 190],
      tail: [250, 260, 270, 280, 290, 300, 325, 350],
      complexity: [18, 19, 20, 21, 22, 23, 24, 26],
    },
  },
  {
    id: 'regex-of-doom',
    name: 'Regex of Doom',
    era: 4,
    brief: 'A new WAF rule pins every WAF at 100% CPU at minute 2. Restore service.',
    inspiredBy: 'Cloudflare outage, 2 July 2019',
    legacy: 6,
    start: () => {
      const game = seriesB(REGEX_USERS, 3, {}, 5, ['waf'])
      const guarded = {
        ...game,
        nodes: [...game.nodes, node('waf', 'waf', 240, 280, { paranoia: 2 })],
        links: [
          ...game.links.filter((entry) => !(entry.from === 'users' && entry.to === 'lb')),
          link('users', 'waf'),
          link('waf', 'lb'),
        ],
      }
      return guarded
    },
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: REGEX_USERS }],
    incidents: [{ at: 120, kind: 'regex' }],
    targets: { errors: 0.02, cost: 440 },
    rule: (game) =>
      game.links.some((entry) => {
        const waf = game.nodes.find((candidate) => candidate.id === entry.to)
        return entry.from === 'users' && waf?.type === 'waf' && waf.paranoia >= 2
      })
        ? null
        : 'Keep a WAF at paranoia 2 or more in front of the site: the bots come back without it.',
    edges: {
      cost: [380, 390, 400, 410, 420, 425, 430, 440],
      tail: [250, 260, 270, 280, 290, 300, 325, 350],
      complexity: [24, 26, 28, 30, 32, 33, 34, 36],
    },
  },
  {
    id: 'forty-three-seconds',
    name: '43 Seconds',
    era: 5,
    brief: 'The link between regions drops at minute 2. Keep one leader.',
    inspiredBy: 'GitHub network partition, 21 October 2018',
    legacy: 7,
    start: () =>
      regionServer(
        built(Actions.setSpread(regionServer(seriesC(PARTITION_USERS, []), 'eu'), 'wide', false)),
        'apac',
      ),
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: PARTITION_USERS }],
    incidents: [{ at: 120, kind: 'partition' }],
    targets: { errors: 0.01 },
    edges: {
      cost: [250, 260, 270, 280, 290, 300, 320, 350],
      tail: [300, 350, 400, 425, 450, 500, 550, 600],
      complexity: [36, 40, 44, 46, 48, 50, 52, 56],
    },
  },
  {
    id: 'follow-the-sun',
    name: 'Follow the Sun',
    era: 5,
    brief: 'Four regions, each with its own evening peak, over one day. Spend under $700/s.',
    inspiredBy: 'Global daily peaks',
    legacy: 7,
    start: () => {
      const home = board(
        5,
        SUN_USERS,
        [...SERIES_C_RESEARCH, 'autoscaling', 'containers'],
        [
          node('lb', 'lb', 360, 280, { size: 3 }),
          ...['server1', 'server2'].map((id, index) =>
            node(id, 'server', 600, 180 + index * 240, { size: 6, runtime: 'go' }),
          ),
          node('wide', 'wide', 880, 280, { size: 4, n: 3, r: 2, w: 2, spread: true }),
        ],
        [
          ['users', 'lb'],
          ['lb', 'server1'],
          ['lb', 'server2'],
          ['server1', 'wide'],
          ['server2', 'wide'],
        ],
      )
      const game = (['eu', 'apac', 'sa'] as const).reduce(
        (current, region) => regionServer(current, region, ['wide'], 7),
        home,
      )
      return { ...game, scenario: { mix: SUN_MIX, daily: true } }
    },
    duration: 1_440,
    stepSeconds: 5,
    demand: [{ at: 0, users: SUN_USERS }],
    incidents: [],
    targets: { errors: 0.01, cost: 700 },
    edges: {
      cost: [600, 620, 640, 650, 660, 670, 680, 700],
      tail: [100, 110, 120, 125, 130, 135, 140, 150],
      complexity: [12, 14, 16, 18, 20, 24, 28, 32],
    },
  },
  {
    id: 'celebrity',
    name: 'Celebrity',
    era: 5,
    brief: 'A celebrity posts at minute 2. 30% of reads ask for one key.',
    inspiredBy: 'Hot keys from viral accounts',
    legacy: 7,
    start: () => {
      const game = seriesC(
        CELEBRITY_USERS,
        ['hybrid-fanout'],
        { size: 4 },
        { size: 7, replicas: 2 },
        4,
      )
      return {
        ...game,
        nodes: game.nodes.map((entry) => (entry.id === 'lb' ? { ...entry, size: 5 } : entry)),
      }
    },
    duration: 360,
    stepSeconds: 1,
    demand: [{ at: 0, users: CELEBRITY_USERS }],
    incidents: [{ at: 120, kind: 'hot-key' }],
    targets: { errors: 0.01 },
    edges: {
      cost: [20_000, 21_000, 22_000, 23_000, 24_000, 25_000, 26_000, 28_000],
      tail: [500, 550, 600, 625, 650, 675, 700, 750],
      complexity: [24, 26, 28, 30, 32, 34, 36, 40],
    },
  },
  {
    id: 'gone-from-the-internet',
    name: 'Gone From the Internet',
    era: 5,
    brief: 'A routing change at minute 2 removes every region from the internet. Restore it.',
    inspiredBy: 'Facebook outage, 4 October 2021',
    legacy: 7,
    start: () => seriesC(BGP_USERS, []),
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: BGP_USERS }],
    incidents: [{ at: 120, kind: 'bgp' }],
    targets: { errors: 0.01 },
    edges: {
      cost: [240, 250, 260, 270, 280, 290, 300, 320],
      tail: [300, 325, 350, 375, 400, 425, 450, 500],
      complexity: [24, 26, 28, 30, 32, 34, 36, 40],
    },
  },
  {
    id: 'the-typo',
    name: 'The Typo',
    era: 5,
    brief: 'At minute 2 a command meant to remove one server removes the Search tier.',
    inspiredBy: 'Amazon S3 outage, 28 February 2017',
    legacy: 7,
    start: () => seriesC(TYPO_USERS, ['full-text-search']),
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: TYPO_USERS }],
    incidents: [],
    outages: [{ at: 120, type: 'search', count: 1 }],
    targets: { errors: 0.01 },
    edges: {
      cost: [240, 250, 260, 270, 280, 290, 300, 320],
      tail: [300, 325, 350, 375, 400, 425, 450, 500],
      complexity: [24, 26, 28, 30, 32, 34, 36, 40],
    },
  },
  {
    id: 'leap-second',
    name: 'Leap Second',
    era: 6,
    brief:
      'At minute 2 the clock in Asia-Pacific repeats a second. Every App Server there spins at 100% CPU. Keep the p99 under 380 ms.',
    inspiredBy: 'The 2012 leap second',
    legacy: 8,
    start: () => regionServer(seriesC(LEAP_USERS, [], {}, {}, 1, 6), 'apac', undefined, 4),
    duration: 420,
    stepSeconds: 1,
    demand: [{ at: 0, users: LEAP_USERS }],
    incidents: [],
    outages: [{ at: 120, type: 'server', count: 10, region: 'apac' }],
    targets: { errors: 0.01, tail: 380 },
    edges: {
      cost: [320, 330, 335, 340, 345, 350, 355, 360],
      tail: [330, 340, 350, 360, 365, 370, 375, 380],
      complexity: [36, 40, 42, 44, 46, 48, 50, 55],
    },
  },
  {
    id: 'rule-of-40',
    name: 'Rule of 40',
    era: 6,
    brief: 'Users grow 25% over the run. Reach growth plus margin of 40: keep a 15% margin.',
    inspiredBy: 'The SaaS Rule of 40',
    legacy: 8,
    start: () => {
      const game = seriesC(FORTY_USERS, [], { size: 4 }, { size: 5 }, 1, 6)
      return {
        ...regionServer(game, 'eu', undefined, 5),
        scenario: { mix: SAAS_MIX, value: FORTY_VALUE },
      }
    },
    duration: 420,
    stepSeconds: 1,
    demand: [0, 1, 2, 3, 4, 5].map((index) => ({
      at: index * 70,
      users: Math.round(FORTY_USERS * (1 + 0.05 * index)),
    })),
    incidents: [],
    targets: { errors: 0.01, margin: 0.15 },
    edges: {
      cost: [50, 60, 70, 80, 90, 100, 110, 130],
      tail: [380, 390, 400, 405, 410, 420, 430, 450],
      complexity: [30, 34, 38, 41, 44, 48, 52, 56],
    },
  },
  {
    id: 'postgres-for-everything',
    name: 'Postgres for Everything',
    era: 6,
    brief: 'Serve every kind with Postgres as the only data store, at a p99 under 800 ms.',
    inspiredBy: 'The "just use Postgres" argument',
    legacy: 8,
    start: () => {
      const ids = ['server1', 'server2']
      return board(
        6,
        POSTGRES_USERS,
        [...SERIES_C_RESEARCH, 'pooling', 'replication', 'ryw-routing'],
        [
          node('lb', 'lb', 360, 280),
          ...ids.map((id, index) =>
            node(id, 'server', 600, 180 + index * 240, { size: 3, runtime: 'go' }),
          ),
          node('database', 'database', 880, 220, { size: 3 }),
          node('psp', 'psp', 880, 560),
          node('llm', 'llm', 880, 700, { size: 2 }),
          node('msgp', 'msgp', 880, 840),
        ],
        [
          ['users', 'lb'],
          ...ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
            ['lb', id],
            [id, 'database'],
            [id, 'psp'],
            [id, 'llm'],
            [id, 'msgp'],
          ]),
        ],
      )
    },
    duration: 300,
    stepSeconds: 1,
    demand: [{ at: 0, users: POSTGRES_USERS }],
    incidents: [],
    targets: { errors: 0.01, tail: 800 },
    rule: (game) => {
      const other = game.nodes.find((entry) => NOT_POSTGRES.includes(entry.type))
      return other ? `${COMPONENTS[other.type].name} is not Postgres.` : null
    },
    edges: {
      cost: [740, 750, 760, 770, 780, 790, 800, 820],
      tail: [650, 675, 700, 725, 750, 775, 790, 800],
      complexity: [12, 14, 16, 18, 20, 22, 24, 28],
    },
  },
  {
    id: 'five-nines',
    name: 'Five Nines',
    era: 7,
    brief: 'Four weeks: two servers and a region fail, and traffic triples once. Serve 99.999%.',
    inspiredBy: '99.999% availability targets',
    legacy: 10,
    start: () => {
      const ids = ['server1', 'server2']
      return {
        ...board(
          7,
          NINES_USERS,
          [...SERIES_C_RESEARCH, 'health-checks', 'multi-az', 'consensus'],
          [
            node('lb', 'lb', 360, 280),
            ...ids.map((id, index) =>
              node(id, 'server', 600, 180 + index * 240, { size: 3, runtime: 'go' }),
            ),
            node('wide', 'wide', 880, 220, { size: 2, n: 3, r: 2, w: 2 }),
            node('psp', 'psp', 880, 560),
          ],
          [
            ['users', 'lb'],
            ...ids.flatMap((id): ReadonlyArray<readonly [string, string]> => [
              ['lb', id],
              [id, 'wide'],
              [id, 'psp'],
            ]),
          ],
        ),
        scenario: { mix: NINES_MIX },
      }
    },
    duration: 28 * DAY,
    stepSeconds: 60,
    demand: [{ at: 0, users: NINES_USERS }],
    incidents: [
      { at: 3 * DAY, kind: 'instance', only: 'server' },
      { at: 10 * DAY, kind: 'spike', magnitude: 3 },
      { at: 16 * DAY, kind: 'region' },
      { at: 23 * DAY, kind: 'instance', only: 'server' },
    ],
    targets: { errors: 0.000_01 },
    edges: {
      cost: [150, 160, 170, 180, 190, 200, 220, 250],
      tail: [250, 260, 270, 280, 290, 300, 325, 350],
      complexity: [36, 40, 44, 50, 60, 70, 80, 100],
    },
  },
]

/* ---------- the daily drill ---------- */

/** FNV-1a over a string, 32 bits. */
const fnv = (text: string): number => {
  let hash = 0x81_1c_9d_c5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0
  }
  return hash
}

type DrillIncident = Readonly<{ kind: IncidentId; only?: ComponentId; magnitude?: number }>

const LOST_SERVER: DrillIncident = { kind: 'instance', only: 'server' }
const TRIPLED: DrillIncident = { kind: 'spike', magnitude: 3 }
const LEAK: DrillIncident = { kind: 'leak' }
const POOLS: DrillIncident = { kind: 'connections' }

/**
 * The drill's starting Designs. Each serves its users with no incident, and
 * lists only incidents that hurt it: a leak needs a persistent runtime, and
 * doubled pools need enough PHP workers to pass Postgres's limit.
 */
const DRILL_BASES: ReadonlyArray<
  Readonly<{
    name: string
    era: number
    users: number
    incidents: ReadonlyArray<DrillIncident>
    game: (seed: number, users: number) => Game
  }>
> = [
  {
    name: 'One box',
    era: 0,
    users: 1_600,
    incidents: [LOST_SERVER, TRIPLED],
    game: (seed, users) =>
      board(
        0,
        users,
        ['load-balancing'],
        [node('server', 'server', 440, 280), node('database', 'database', 760, 280, { size: 2 })],
        [
          ['users', 'server'],
          ['server', 'database'],
        ],
        seed,
      ),
  },
  {
    name: 'Two PHP servers',
    era: 1,
    users: 3_000,
    incidents: [LOST_SERVER, TRIPLED, POOLS],
    game: (seed, users) => {
      const { nodes, links } = fleet(2, { runtime: 'php_fpm', workers: 30 }, 'database')
      return board(
        1,
        users,
        PRESEED_PALETTE,
        [...nodes, node('database', 'database', 880, 280, { size: 2 })],
        links,
        seed,
      )
    },
  },
  {
    name: 'Two Rails servers',
    era: 1,
    users: 4_000,
    incidents: [LOST_SERVER, TRIPLED, LEAK],
    game: (seed, users) => {
      const { nodes, links } = fleet(2, { runtime: 'puma', size: 2 }, 'database')
      return board(
        1,
        users,
        [...PRESEED_PALETTE, 'lang-ruby'],
        [...nodes, node('database', 'database', 880, 280, { size: 2 })],
        links,
        seed,
      )
    },
  },
]

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** The daily drill for a UTC date (`YYYY-MM-DD`): the same for every player, derived, never stored. */
export const dailyDrill = (date: string): Challenge => {
  const [base_, seed] = nextRandom(fnv(date) % 2_147_483_648)
  const [incident_] = nextRandom(seed)
  const base =
    DRILL_BASES[Math.floor(base_ * DRILL_BASES.length)] ??
    (DRILL_BASES[0] as (typeof DRILL_BASES)[number])
  const incident = base.incidents[Math.floor(incident_ * base.incidents.length)] ?? LOST_SERVER
  return {
    id: `daily:${date}`,
    name: `Daily drill ${date}`,
    era: base.era,
    brief: `${base.name}. ${INCIDENT_BRIEF[incident.kind] ?? 'An incident at minute 2.'}`,
    inspiredBy: 'Game days',
    legacy: 0,
    start: () => base.game(seed, base.users),
    duration: 300,
    stepSeconds: 1,
    demand: [{ at: 0, users: base.users }],
    incidents: [{ at: 120, ...incident }],
    // A spare App Server keeps a lost one under 1.5%: the health checks take a few seconds.
    targets: { errors: 0.015 },
    edges: {
      cost: [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.6, 0.8, 1],
      tail: [50, 100, 150, 200, 300, 400, 600, 800, 1_000],
      complexity: [3, 4, 5, 6, 8, 10, 12, 15],
    },
  }
}

const INCIDENT_BRIEF: Partial<Record<IncidentId, string>> = {
  instance: 'An App Server fails at minute 2.',
  spike: 'Traffic triples at minute 2.',
  leak: 'A memory leak starts at minute 2.',
  connections: 'A deploy doubles every pool at minute 2.',
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** A real calendar date written `YYYY-MM-DD`. */
export const isDrillDate = (date: string): boolean => {
  if (!DATE.test(date)) return false
  const [year = 0, month = 0, day = 0] = date.split('-').map(Number)
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const days = month === 2 && leap ? 29 : (MONTH_DAYS[month - 1] ?? 0)
  return day >= 1 && day <= days
}

/** The Challenge for an id: a catalog entry or a daily drill. */
export const challengeById = (id: string): Challenge | undefined => {
  if (id.startsWith('daily:')) {
    const date = id.slice('daily:'.length)
    return isDrillDate(date) ? dailyDrill(date) : undefined
  }
  return CHALLENGES.find((entry) => entry.id === id)
}

/* ---------- the run ---------- */

/** Running totals of a run, over the scored Steps. Kept in the browser's Model while it runs. */
export const RunTotals = Schema.Struct({
  /** Steps run so far. */
  step: Schema.Finite,
  scored: Schema.Finite,
  burn: Schema.Finite,
  /** Σ p99 × served, and Σ served. */
  tail: Schema.Finite,
  served: Schema.Finite,
  /** Σ failed and refused requests, and Σ demand. */
  failed: Schema.Finite,
  refused: Schema.Finite,
  demand: Schema.Finite,
  /** Σ revenue per second, for the margin. */
  revenue: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** Σ demand, Σ failed requests and Σ p99 × rate of each kind a target names. */
  kinds: Schema.Record(
    Schema.String,
    Schema.Struct({
      demand: Schema.Finite,
      failed: Schema.Finite,
      tail: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
    }),
  ).pipe(Schema.withDecodingDefaultKey(Effect.succeed({}))),
})
export type RunTotals = typeof RunTotals.Type

export const NO_TOTALS: RunTotals = {
  step: 0,
  scored: 0,
  burn: 0,
  tail: 0,
  served: 0,
  failed: 0,
  refused: 0,
  demand: 0,
  revenue: 0,
  kinds: {},
}

export const ChallengeResult = Schema.Struct({
  passed: Schema.Boolean,
  cost: Schema.Finite,
  tail: Schema.Finite,
  complexity: Schema.Finite,
  errors: Schema.Finite,
  refused: Schema.Finite,
  /** Revenue less Burn, as a share of revenue. */
  margin: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** The first target missed, or null. */
  missed: Schema.NullOr(Schema.String),
  hash: Schema.String,
})
export type ChallengeResult = typeof ChallengeResult.Type

export const stepsOf = (challenge: Challenge): number =>
  Math.round(challenge.duration / challenge.stepSeconds)

const usersAt = (challenge: Challenge, time: number): number =>
  challenge.demand.reduce((users, entry) => (entry.at <= time + 1e-9 ? entry.users : users), 0)

/** The demand script's mix at a time, if it sets one. */
const mixAt = (
  challenge: Challenge,
  time: number,
): Partial<Record<RequestKind, number>> | undefined =>
  challenge.demand.reduce<Partial<Record<RequestKind, number>> | undefined>(
    (mix, entry) => (entry.at <= time + 1e-9 && entry.mix ? entry.mix : mix),
    undefined,
  )

/** The Board at a time of the script: its users, and its mix when the script sets one. */
const scripted = (challenge: Challenge, game: Game, time: number): Game => {
  const mix = mixAt(challenge, time)
  return {
    ...game,
    users: usersAt(challenge, time),
    ...(mix ? { scenario: { ...game.scenario, mix } } : {}),
  }
}

/**
 * Dev Hours a Design spends against its Challenge's start (08 "Dev Hours"): each fix it
 * adds, and a migration when its App Servers run another Stack.
 */
export const devHoursOf = (start: Game, game: Game): number => {
  const before = serviceOf(start).fixes
  const fixes = serviceOf(game)
    .fixes.filter((fix) => !before.includes(fix))
    .reduce((sum, fix) => sum + TASKS[fix].dh, 0)
  const from = stackOf(start)
  const to = stackOf(game)
  const moved = from.runtime !== to.runtime || from.framework !== to.framework
  return fixes + (moved ? migrationCost(start, to) : 0)
}

/** Takes down the first `count` live Nodes of a type, in a region if set, until they are replaced. */
const outage = (game: Game, type: ComponentId, count: number, region?: RegionId): Game => {
  const hit = new Set(
    game.nodes
      .filter(
        (node) =>
          node.type === type && !isDown(node) && (region === undefined || node.region === region),
      )
      .slice(0, count)
      .map((node) => node.id),
  )
  return {
    ...game,
    nodes: game.nodes.map((node) =>
      hit.has(node.id)
        ? { ...node, down: -1, downCause: 'failure' as const, downAt: game.time }
        : node,
    ),
  }
}

/** The replay's Design on the Challenge's start, or why it is refused. */
export const beginRun = (challenge: Challenge, replay: Replay): Result.Result<Game, string> => {
  if (replay.challenge !== challenge.id) return Result.fail('The replay is for another Challenge.')
  if (replay.simVersion !== SIM_VERSION) return Result.fail('Update Quorum to submit this result.')
  const built = applyDesign(challenge.start(), replay.design)
  if (Result.isFailure(built)) return built
  const broken = challenge.rule?.(built.success)
  if (broken) return Result.fail(broken)
  if (challenge.devHours !== undefined) {
    const spent = devHoursOf(challenge.start(), built.success)
    if (spent > challenge.devHours + 1e-9)
      return Result.fail(
        `The Design needs ${Math.round(spent * 10) / 10} Dev Hours; the budget is ${challenge.devHours}.`,
      )
  }
  return Result.succeed(scripted(challenge, built.success, 0))
}

/** Whether a run of the Challenge may take this action: a response it forbids does nothing. */
export const responseAllowed = (
  challenge: Challenge,
  action: Replay['actions'][number]['action'],
) =>
  action._tag !== 'Respond' ||
  challenge.responses === undefined ||
  challenge.responses.includes(action.response)

export type RunStep = Readonly<{ game: Game; totals: RunTotals; events: ReadonlyArray<StepEvent> }>

/** One Step of the canonical run: logged actions, the demand script, scripted incidents, then the Step. */
export const advanceRun = (
  challenge: Challenge,
  replay: Replay,
  game: Game,
  totals: RunTotals,
): RunStep => {
  const index = totals.step
  const time = index * challenge.stepSeconds
  let current = game
  for (const entry of replay.actions)
    if (entry.step === index && responseAllowed(challenge, entry.action))
      current = applyAction(current, entry.action)
  current = scripted(challenge, current, time)
  const within = (at: number) => at >= time - 1e-9 && at < time + challenge.stepSeconds - 1e-9
  for (const down of challenge.outages ?? [])
    if (within(down.at)) current = outage(current, down.type, down.count, down.region)
  const events: Array<StepEvent> = []
  for (const script of challenge.incidents) {
    if (!within(script.at)) continue
    const started = forceIncident(current, solveFlow(current), script.kind, script.only)
    if (!started || started.incident === null) continue
    current =
      script.magnitude === undefined
        ? started
        : { ...started, incident: { ...started.incident, magnitude: script.magnitude } }
    if (current.incident) events.push(StepEvent.IncidentStarted({ incident: current.incident }))
  }
  // A coarse Step runs second by second while something is failing, so a health check
  // that notices a dead App Server in 2 s costs 2 s of errors, not a whole Step.
  const fine =
    challenge.stepSeconds > 1 &&
    (current.incident !== null || current.nodes.some((entry) => entry.down !== 0))
  const parts = fine ? challenge.stepSeconds : 1
  const scored = time >= WARMUP - 1e-9
  let next = totals
  for (let part = 0; part < parts; part += 1) {
    const result = step(current, challenge.stepSeconds / parts, DESIGN_TUNING)
    events.push(...result.events)
    current = result.game
    if (scored) next = addLedger(challenge, next, result.ledger, 1 / parts)
  }
  return {
    game: current,
    events,
    totals: scored
      ? { ...next, step: index + 1, scored: totals.scored + 1 }
      : { ...totals, step: index + 1 },
  }
}

/** Adds a share of a Step's Ledger to the totals: all of it, or one second of a fine Step. */
const addLedger = (
  challenge: Challenge,
  totals: RunTotals,
  ledger: Ledger,
  weight: number,
): RunTotals => ({
  ...totals,
  burn: totals.burn + ledger.burn * weight,
  tail: totals.tail + ledger.p99 * ledger.served * weight,
  served: totals.served + ledger.served * weight,
  failed: totals.failed + ledger.errorShare * ledger.demand * weight,
  refused: totals.refused + ledger.errors.refused * weight,
  demand: totals.demand + ledger.demand * weight,
  revenue: totals.revenue + ledger.revenue * weight,
  kinds: kindTotals(challenge, totals.kinds, ledger, weight),
})

/** Adds a Step's demand and failures of each kind the Challenge's targets name. */
const kindTotals = (
  challenge: Challenge,
  kinds: RunTotals['kinds'],
  ledger: Ledger,
  weight: number,
): RunTotals['kinds'] => {
  const named = [
    ...new Set([
      ...Object.keys(challenge.targets.kinds ?? {}),
      ...Object.keys(challenge.targets.kindTail ?? {}),
    ]),
  ] as ReadonlyArray<RequestKind>
  if (named.length === 0) return kinds
  const next: Record<string, { demand: number; failed: number; tail: number }> = { ...kinds }
  for (const kind of named) {
    const entry = ledger.kinds[kind]
    const before = kinds[kind] ?? { demand: 0, failed: 0, tail: 0 }
    next[kind] = {
      demand: before.demand + (entry?.rate ?? 0) * weight,
      failed: before.failed + (entry ? entry.rate * (1 - entry.success) * weight : 0),
      tail: before.tail + (entry ? entry.rate * entry.p99 * weight : 0),
    }
  }
  return next
}

/** The first kind whose failures pass its target, if any. */
const failingKind = (challenge: Challenge, totals: RunTotals): RequestKind | null => {
  for (const [kind, limit] of Object.entries(challenge.targets.kinds ?? {})) {
    const entry = totals.kinds[kind]
    if (entry && entry.demand > 0 && entry.failed / entry.demand > (limit ?? 0) + 1e-12)
      return kind as RequestKind
  }
  return null
}

/** The first kind whose rate-weighted p99 passes its target, if any. */
const slowKind = (challenge: Challenge, totals: RunTotals): RequestKind | null => {
  for (const [kind, limit] of Object.entries(challenge.targets.kindTail ?? {})) {
    const entry = totals.kinds[kind]
    if (entry && entry.demand > 0 && entry.tail / entry.demand > (limit ?? 0) + 1e-9)
      return kind as RequestKind
  }
  return null
}

/** Nodes the player can change, plus every Link. */
export const complexityOf = (game: Game): number =>
  game.nodes.filter((entry) => !COMPONENTS[entry.type].fixed && !SHARED.includes(entry.type))
    .length + game.links.length

/** The scores of a finished run, and whether it met every target. */
export const resultOf = (challenge: Challenge, game: Game, totals: RunTotals): ChallengeResult => {
  const cost = totals.scored > 0 ? totals.burn / totals.scored : 0
  const tail = totals.served > 0 ? totals.tail / totals.served : 0
  const errors = totals.demand > 0 ? totals.failed / totals.demand : 1
  const refused = totals.demand > 0 ? totals.refused / totals.demand : 0
  const margin = totals.revenue > 0 ? (totals.revenue - totals.burn) / totals.revenue : -1
  const { targets } = challenge
  const missed =
    totals.served <= 0
      ? 'Nothing was served.'
      : errors > targets.errors
        ? 'Too many errors.'
        : failingKind(challenge, totals) !== null
          ? `Too many ${KINDS[failingKind(challenge, totals) ?? 'page'].label.toLowerCase()} requests failed.`
          : slowKind(challenge, totals) !== null
            ? `${KINDS[slowKind(challenge, totals) ?? 'page'].label} requests are too slow.`
            : targets.refused !== undefined && refused > targets.refused
              ? 'Connections were refused.'
              : targets.tail !== undefined && tail > targets.tail
                ? 'The tail is too long.'
                : targets.cost !== undefined && cost > targets.cost
                  ? 'Over budget.'
                  : targets.margin !== undefined && margin < targets.margin
                    ? 'The margin is too thin.'
                    : null
  return {
    passed: missed === null,
    cost,
    tail,
    complexity: complexityOf(game),
    errors,
    refused,
    margin,
    missed,
    hash: hashGame(game),
  }
}

/** Runs a replay from t = 0 to the end. Pure: the same replay gives the same result everywhere. */
export const runChallenge = (
  challenge: Challenge,
  replay: Replay,
): Result.Result<ChallengeResult, string> => {
  const begun = beginRun(challenge, replay)
  if (Result.isFailure(begun)) return Result.fail(begun.failure)
  let game = begun.success
  let totals = NO_TOTALS
  const steps = stepsOf(challenge)
  while (totals.step < steps) {
    const next = advanceRun(challenge, replay, game, totals)
    game = next.game
    totals = next.totals
  }
  return Result.succeed(resultOf(challenge, game, totals))
}

/** Which histogram bucket a score falls in: one per edge, plus one above the last. */
export const bucketOf = (edges: ReadonlyArray<number>, value: number): number => {
  const index = edges.findIndex((edge) => value <= edge)
  return index < 0 ? edges.length : index
}

/** The Challenge before this one in the global list, or undefined for the first. */
const previousChallenge = (challenge: Challenge): Challenge | undefined => {
  const index = CHALLENGES.findIndex((entry) => entry.id === challenge.id)
  return index > 0 ? CHALLENGES[index - 1] : undefined
}

/**
 * The first Challenge is open. Each later Challenge opens when the one before
 * it in the global list is complete, across Era boundaries. A completed
 * Challenge stays open for another run.
 */
export const challengeOpen = (challenge: Challenge, completed: ReadonlyArray<string>): boolean => {
  if (challenge.id.startsWith('daily:') || completed.includes(challenge.id)) return true
  const previous = previousChallenge(challenge)
  return previous === undefined || completed.includes(previous.id)
}
