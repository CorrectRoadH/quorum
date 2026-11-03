import { Schema } from 'effect'
import type { ComponentId, IncidentId, ResearchId } from './catalog.ts'
import { company, link, node } from './company.ts'
import { forceIncident } from './director.ts'
import type { Ledger } from './ledger.ts'
import { RESEARCH_IDS } from './catalog.ts'
import type { Game, GameLink, GameNode } from './state.ts'

/* ==========================================================================
   Sandboxes: Boards outside any Company. A guided Sandbox teaches one
   mechanic from a fixed Design through ordered objectives. Each objective
   sets the demand, may script an incident, and passes when its condition on
   the Ledger holds long enough. The free Sandbox is a test bench.
   ========================================================================== */

export type Objective = Readonly<{
  goal: string
  /** Users while this objective runs. Unset keeps the demand of the one before. */
  users?: number
  /** Sim seconds the condition must hold without a break. */
  hold: number
  /**
   * An incident the objective fires once the condition has held for a while.
   * With `survive`, the Design must ride it out: a break fires it again.
   * Without, the player may fix it by hand and then hold the condition.
   */
  incident?: Readonly<{
    kind: IncidentId
    only?: ComponentId
    survive: boolean
    /** A fixed spike multiplier instead of a roll, so the lesson does not depend on luck. */
    magnitude?: number
  }>
  met: (game: Game, ledger: Ledger) => boolean
}>

export const SANDBOX_IDS = [
  'out-of-credits',
  'shared-box',
  'second-server',
  'connection-limit',
  'event-loop-stall',
  'read-mostly',
  'stampede',
  'slow-uploads',
  'bots',
  'zone-outage',
  'cold-start',
  'stale-checkout',
  'gc-pauses',
  'retry-storm',
  'analytics-primary',
  'far-away',
  'missed-write',
  'hot-key',
] as const
export type SandboxId = (typeof SANDBOX_IDS)[number]

export type GuidedSandbox = Readonly<{
  id: SandboxId
  name: string
  /** The Era whose track holds it, and whose request mix it runs. */
  stage: number
  start: () => Game
  objectives: ReadonlyArray<Objective>
}>

/** Seconds an objective's condition holds before its incident fires. */
export const INCIDENT_AFTER = 20

/* ---------- conditions ---------- */

const serving =
  (apdex: number) =>
  (_: Game, ledger: Ledger): boolean =>
    ledger.errorShare < 0.01 && ledger.apdex >= apdex

const within =
  (apdex: number, burn: number) =>
  (game: Game, ledger: Ledger): boolean =>
    serving(apdex)(game, ledger) && ledger.burn <= burn + 1e-9

/** Serving, with every Queue's backlog under `depth` tasks. */
const draining =
  (apdex: number, depth: number) =>
  (game: Game, ledger: Ledger): boolean =>
    serving(apdex)(game, ledger) &&
    game.nodes.every((entry) => entry.type !== 'queue' || entry.depth < depth)

const fast =
  (p99: number) =>
  (_: Game, ledger: Ledger): boolean =>
    ledger.errorShare < 0.01 && ledger.p99 <= p99

/** Every checkout sees its own write, and Apdex holds. */
const checkingOut =
  (apdex: number, burn = Number.POSITIVE_INFINITY) =>
  (_: Game, ledger: Ledger): boolean =>
    (ledger.kinds.buy?.success ?? 1) >= 0.995 && ledger.apdex >= apdex && ledger.burn <= burn + 1e-9

/** API reads come back fast at the p99, with errors under 1% and Burn within the cap. */
const steadyReads =
  (p99: number, burn = Number.POSITIVE_INFINITY) =>
  (_: Game, ledger: Ledger): boolean =>
    ledger.errorShare < 0.01 && (ledger.kinds.read?.p99 ?? 0) <= p99 && ledger.burn <= burn + 1e-9

/* ---------- starting Designs ---------- */

const SEED = 20_261_101

const board = (
  stage: number,
  users: number,
  researched: ReadonlyArray<ResearchId>,
  nodes: ReadonlyArray<GameNode>,
  links: ReadonlyArray<readonly [string, string]>,
): Game => ({
  ...company(SEED),
  sandbox: true,
  cash: 0,
  stage,
  users,
  researched: ['stripe', 'logs', 'metrics', ...researched],
  nodes: [node('users', 'users', 120, 280), ...nodes],
  links: links.map(([from, to]): GameLink => link(from, to)),
  nextId: 1,
})

/* ---------- the tracks ---------- */

const STAMPEDE_USERS = 6_000
const STAMPEDE_BURN = 7.4
const BOTS_USERS = 12_000
const BOTS_BURN = 10.2
const ZONE_USERS = 8_000
const ZONE_BURN = 21.2
const COLD_USERS = 8_000
const COLD_BURN = 17.4
const COLD_SPIKE = 4
const COLD_DATABASE = 5

/** What a Series A Design needs besides App Servers: files, checkouts, and their Links. */
const seriesAData = (size = 4): ReadonlyArray<GameNode> => [
  node('database', 'database', 880, 220, { size }),
  node('storage', 'storage', 880, 420),
  node('psp', 'psp', 880, 580),
]
const seriesALinks = (servers: ReadonlyArray<string>): ReadonlyArray<readonly [string, string]> =>
  servers.flatMap((server): ReadonlyArray<readonly [string, string]> => [
    ['lb', server],
    [server, 'database'],
    [server, 'storage'],
    [server, 'psp'],
  ])
const SERIES_A_RESEARCH: ReadonlyArray<ResearchId> = [
  'load-balancing',
  'health-checks',
  'percentiles',
  'object-storage',
  'checkout',
  'multi-az',
]

const STALE_USERS = 8_000
const GC_USERS = 4_000
const GC_P99 = 110
const GC_BURN = 93.2
const STORM_USERS = 10_000
const STORM_BURN = 197
const ANALYTICS_USERS = 8_000
const ANALYTICS_BURN = 254

/** What a Series B Design needs besides App Servers and its Database: files, checkouts, AI, and exports. */
const seriesBData = (warehouse: boolean): ReadonlyArray<GameNode> => [
  node('storage', 'storage', 880, 420),
  node('psp', 'psp', 880, 560),
  node('llm', 'llm', 880, 700),
  node('queue', 'queue', 360, 40),
  node('worker', 'worker', 880, 60, { size: 3, runtime: 'go' }),
  ...(warehouse ? [node('warehouse', 'warehouse', 1120, 420)] : []),
]
const seriesBLinks = (
  servers: ReadonlyArray<string>,
  warehouse: boolean,
): ReadonlyArray<readonly [string, string]> => [
  ['users', 'lb'],
  ['queue', 'worker'],
  ['worker', 'database'],
  ...servers.flatMap((server): ReadonlyArray<readonly [string, string]> => [
    ['lb', server],
    [server, 'database'],
    [server, 'storage'],
    [server, 'psp'],
    [server, 'llm'],
    [server, 'queue'],
    ...(warehouse ? [[server, 'warehouse'] as const] : []),
  ]),
]
const SERIES_B_RESEARCH: ReadonlyArray<ResearchId> = [
  ...SERIES_A_RESEARCH,
  'lang-go',
  'background-jobs',
  'queues',
  'hosted-models',
  'data-warehouse',
]

const FAR_USERS = 8_000
const FAR_READ_MS = 140
const MISSED_USERS = 8_000
const HOT_USERS = 1_000_000

/** What a Series C Design needs besides App Servers and its store: files, checkouts, AI, pushes, and async work. */
const seriesCData = (scale = 1): ReadonlyArray<GameNode> => [
  node('search', 'search', 1120, 60, { size: 2 + scale }),
  node('warehouse', 'warehouse', 1120, 220),
  node('storage', 'storage', 880, 420),
  node('psp', 'psp', 880, 560, { size: scale }),
  node('llm', 'llm', 880, 700, { size: 1 + scale }),
  node('msgp', 'msgp', 880, 840),
  node('queue', 'queue', 360, 40),
  node('worker', 'worker', 880, 60, { size: scale > 1 ? 9 : 4, runtime: 'go' }),
]
const seriesCLinks = (
  servers: ReadonlyArray<string>,
  store: string,
): ReadonlyArray<readonly [string, string]> => [
  ['users', 'lb'],
  ['queue', 'worker'],
  ['worker', store],
  ['worker', 'msgp'],
  ...servers.flatMap((server): ReadonlyArray<readonly [string, string]> => [
    ['lb', server],
    [server, store],
    [server, 'storage'],
    [server, 'psp'],
    [server, 'llm'],
    [server, 'queue'],
    [server, 'search'],
    [server, 'warehouse'],
  ]),
]
const SERIES_C_RESEARCH: ReadonlyArray<ResearchId> = [
  ...SERIES_B_RESEARCH,
  'notifications',
  'replication',
  'sharding',
  'leaderless',
  'multi-region',
  'geo-dns',
]

/** Users served, with Apdex above `apdex`, at every request kind. */
const answered =
  (apdex: number) =>
  (_: Game, ledger: Ledger): boolean =>
    ledger.errorShare < 0.01 && ledger.apdex >= apdex

/** API reads come back fresh: under 0.5% stale or failed. */
const fresh = (_: Game, ledger: Ledger): boolean =>
  (ledger.kinds.read?.success ?? 1) >= 0.995 && ledger.errorShare < 0.01

export const GUIDED: Record<SandboxId, GuidedSandbox> = {
  'out-of-credits': {
    id: 'out-of-credits',
    name: 'Out of Credits',
    stage: 0,
    start: () =>
      board(
        0,
        700,
        [],
        [
          node('server', 'server', 440, 280, { family: 'burstable', credits: 3 }),
          node('database', 'database', 760, 280, { size: 2 }),
        ],
        [
          ['users', 'server'],
          ['server', 'database'],
        ],
      ),
    objectives: [
      { goal: 'Serve every request for 90 seconds.', hold: 90, met: serving(0.85) },
      {
        goal: 'Demand is up 4×. Keep Apdex above 0.85 for 2 minutes.',
        users: 2_400,
        hold: 120,
        met: serving(0.85),
      },
      {
        goal: 'Night traffic is back to the start. Keep Apdex above 0.85 with Burn at $0.12/s or less.',
        users: 600,
        hold: 120,
        met: within(0.85, 0.12),
      },
    ],
  },
  'shared-box': {
    id: 'shared-box',
    name: 'Shared Box',
    stage: 0,
    start: () =>
      board(
        0,
        1_400,
        [],
        [node('server', 'server', 440, 280, { localDb: true })],
        [['users', 'server']],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.85 for 90 seconds.', hold: 90, met: serving(0.85) },
      {
        goal: 'Demand doubled. Keep Apdex above 0.9 with Burn at $0.16/s or less.',
        users: 2_800,
        hold: 120,
        met: within(0.9, 0.16),
      },
      {
        goal: 'Night traffic is back to the start. Keep Apdex above 0.9 with Burn at $0.11/s or less.',
        users: 1_400,
        hold: 90,
        met: within(0.9, 0.11),
      },
    ],
  },
  'second-server': {
    id: 'second-server',
    name: 'Second Server',
    stage: 0,
    start: () =>
      board(
        0,
        2_400,
        ['load-balancing'],
        [node('server', 'server', 440, 280), node('database', 'database', 760, 280, { size: 3 })],
        [
          ['users', 'server'],
          ['server', 'database'],
        ],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'A server will fail. Keep Apdex above 0.85 for 2 minutes.',
        hold: 120,
        incident: { kind: 'instance', only: 'server', survive: true },
        met: serving(0.85),
      },
      {
        goal: 'Demand doubled. Keep Apdex above 0.9 through another failure.',
        users: 4_800,
        hold: 120,
        incident: { kind: 'instance', only: 'server', survive: true },
        met: serving(0.9),
      },
    ],
  },
  'connection-limit': {
    id: 'connection-limit',
    name: 'Connection Limit',
    stage: 1,
    start: () =>
      board(
        1,
        3_000,
        ['php-fpm', 'load-balancing', 'pooling', 'percentiles'],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1, 2].map((index) =>
            node(`server${index + 1}`, 'server', 600, 40 + index * 240, {
              runtime: 'php_fpm',
              workers: 40,
            }),
          ),
          node('database', 'database', 880, 280, { size: 3 }),
        ],
        [
          ['users', 'lb'],
          ...[1, 2, 3].flatMap((index): ReadonlyArray<readonly [string, string]> => [
            ['lb', `server${index}`],
            [`server${index}`, 'database'],
          ]),
        ],
      ),
    objectives: [
      { goal: 'Serve every request for 90 seconds.', hold: 90, met: serving(0.85) },
      {
        goal: 'Demand doubled. Keep Apdex above 0.9 for 2 minutes.',
        users: 6_000,
        hold: 120,
        met: serving(0.9),
      },
      {
        goal: 'A deploy will double every pool. Keep errors under 1%.',
        hold: 90,
        incident: { kind: 'connections', survive: true },
        met: serving(0),
      },
    ],
  },
  'event-loop-stall': {
    id: 'event-loop-stall',
    name: 'Event Loop Stall',
    stage: 1,
    start: () =>
      board(
        1,
        6_000,
        ['lang-node', 'node-cluster', 'php-fpm', 'load-balancing', 'percentiles'],
        [
          node('server', 'server', 440, 280, { size: 3, runtime: 'node' }),
          node('database', 'database', 760, 280, { size: 3 }),
        ],
        [
          ['users', 'server'],
          ['server', 'database'],
        ],
      ),
    objectives: [
      { goal: 'Keep p99 under 300 ms for 2 minutes.', hold: 120, met: fast(300) },
      {
        goal: 'Password hashing will get 4× slower. Keep p99 under 600 ms for 2 minutes.',
        hold: 120,
        incident: { kind: 'loop', survive: true },
        met: fast(600),
      },
    ],
  },
  'read-mostly': {
    id: 'read-mostly',
    name: 'Read Mostly',
    stage: 1,
    start: () =>
      board(
        1,
        4_000,
        [
          'php-fpm',
          'load-balancing',
          'caching',
          'replication',
          'pooling',
          'percentiles',
          'query-analysis',
        ],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 3,
              runtime: 'php_fpm',
              workers: 24,
            }),
          ),
          node('database', 'database', 880, 280, { size: 1 }),
        ],
        [
          ['users', 'lb'],
          ...[1, 2].flatMap((index): ReadonlyArray<readonly [string, string]> => [
            ['lb', `server${index}`],
            [`server${index}`, 'database'],
          ]),
        ],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'Demand doubled. Keep Apdex above 0.9 with Burn at $2.60/s or less.',
        users: 8_000,
        hold: 120,
        met: within(0.9, 2.6),
      },
      {
        goal: 'A query will ship with no index. Keep Apdex above 0.85 for 2 minutes after.',
        hold: 120,
        incident: { kind: 'slow-query', survive: false },
        met: serving(0.85),
      },
    ],
  },
  stampede: {
    id: 'stampede',
    name: 'Stampede',
    stage: 2,
    start: () =>
      board(
        2,
        STAMPEDE_USERS,
        [
          'php-fpm',
          'load-balancing',
          'caching',
          'stampede-protection',
          'cache-warming',
          'percentiles',
          'full-text-search',
          'object-storage',
        ],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 3,
              runtime: 'php_fpm',
              workers: 24,
            }),
          ),
          node('cache', 'cache', 880, 160, { ttl: 3_600 }),
          node('database', 'database', 1120, 280, { size: 2 }),
          node('search', 'search', 880, 400),
          node('storage', 'storage', 880, 560),
        ],
        [
          ['users', 'lb'],
          ...[1, 2].flatMap((index): ReadonlyArray<readonly [string, string]> => [
            ['lb', `server${index}`],
            [`server${index}`, 'cache'],
            [`server${index}`, 'search'],
            [`server${index}`, 'storage'],
          ]),
          ['cache', 'database'],
        ],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'The Cache will restart. Keep Apdex above 0.85 for 2 minutes.',
        hold: 120,
        incident: { kind: 'stampede', survive: true },
        met: serving(0.85),
      },
      {
        goal: `Demand is up 50%. The Cache restarts again. Keep Apdex above 0.85 with Burn at $${STAMPEDE_BURN.toFixed(2)}/s or less.`,
        users: STAMPEDE_USERS * 1.5,
        hold: 120,
        incident: { kind: 'stampede', survive: true },
        met: within(0.85, STAMPEDE_BURN),
      },
    ],
  },
  'slow-uploads': {
    id: 'slow-uploads',
    name: 'Slow Uploads',
    stage: 2,
    start: () =>
      board(
        2,
        5_000,
        ['php-fpm', 'load-balancing', 'background-jobs', 'queues', 'object-storage', 'percentiles'],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 2,
              runtime: 'php_fpm',
              workers: 16,
            }),
          ),
          node('database', 'database', 880, 220, { size: 3 }),
          node('storage', 'storage', 880, 440),
        ],
        [
          ['users', 'lb'],
          ...[1, 2].flatMap((index): ReadonlyArray<readonly [string, string]> => [
            ['lb', `server${index}`],
            [`server${index}`, 'database'],
            [`server${index}`, 'storage'],
          ]),
        ],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'Demand is up 60%. Keep Apdex above 0.9 with Burn at $5.20/s or less.',
        users: 8_000,
        hold: 120,
        met: within(0.9, 5.2),
      },
      {
        goal: 'A task will fail forever. Keep the Queue under 500 tasks for 2 minutes.',
        hold: 120,
        incident: { kind: 'poison', survive: true },
        met: draining(0.9, 500),
      },
    ],
  },
  bots: {
    id: 'bots',
    name: 'Bots',
    stage: 2,
    start: () =>
      board(
        2,
        BOTS_USERS,
        ['php-fpm', 'load-balancing', 'waf', 'percentiles', 'full-text-search', 'object-storage'],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 3,
              runtime: 'php_fpm',
              workers: 24,
            }),
          ),
          node('database', 'database', 880, 220, { size: 4 }),
          node('search', 'search', 880, 400),
          node('storage', 'storage', 880, 560),
        ],
        [
          ['users', 'lb'],
          ...[1, 2].flatMap((index): ReadonlyArray<readonly [string, string]> => [
            ['lb', `server${index}`],
            [`server${index}`, 'database'],
            [`server${index}`, 'search'],
            [`server${index}`, 'storage'],
          ]),
        ],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'Scrapers are coming. Keep Apdex above 0.9 for 2 minutes.',
        hold: 120,
        incident: { kind: 'bot-surge', survive: true },
        met: serving(0.9),
      },
      {
        goal: `They are back. Keep Apdex above 0.9 with Burn at $${BOTS_BURN.toFixed(2)}/s or less.`,
        hold: 120,
        incident: { kind: 'bot-surge', survive: true },
        met: within(0.9, BOTS_BURN),
      },
    ],
  },
  'zone-outage': {
    id: 'zone-outage',
    name: 'Zone Outage',
    stage: 3,
    start: () =>
      board(
        3,
        ZONE_USERS,
        [...SERIES_A_RESEARCH, 'lang-go'],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 2,
              runtime: 'go',
            }),
          ),
          ...seriesAData(),
        ],
        [['users', 'lb'], ...seriesALinks(['server1', 'server2'])],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'A zone will fail. Keep Apdex above 0.85 for 2 minutes.',
        hold: 120,
        incident: { kind: 'zone', survive: true },
        met: serving(0.85),
      },
      {
        goal: `Demand is up 50%. A zone fails again. Keep Apdex above 0.85 with Burn at $${ZONE_BURN.toFixed(2)}/s or less.`,
        users: ZONE_USERS * 1.5,
        hold: 120,
        incident: { kind: 'zone', survive: true },
        met: within(0.85, ZONE_BURN),
      },
    ],
  },
  'cold-start': {
    id: 'cold-start',
    name: 'Cold Start',
    stage: 3,
    start: () =>
      board(
        3,
        COLD_USERS,
        [...SERIES_A_RESEARCH, 'lang-java', 'autoscaling', 'containers'],
        [
          node('lb', 'lb', 360, 280),
          node('server1', 'server', 600, 280, { size: 3, runtime: 'tomcat' }),
          ...seriesAData(COLD_DATABASE),
        ],
        [['users', 'lb'], ...seriesALinks(['server1'])],
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: `A ${COLD_SPIKE}× spike is coming. Keep Apdex above 0.85 for 2 minutes.`,
        hold: 120,
        incident: { kind: 'spike', survive: true, magnitude: COLD_SPIKE },
        met: serving(0.85),
      },
      {
        goal: `Night traffic. Keep Apdex above 0.9 with Burn at $${COLD_BURN.toFixed(2)}/s or less.`,
        users: COLD_USERS / 2,
        hold: 120,
        met: within(0.9, COLD_BURN),
      },
    ],
  },
  'stale-checkout': {
    id: 'stale-checkout',
    name: 'Stale Checkout',
    stage: 3,
    start: () =>
      board(
        3,
        STALE_USERS,
        [...SERIES_A_RESEARCH, 'lang-go', 'replication', 'ryw-routing'],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 2,
              runtime: 'go',
            }),
          ),
          ...seriesAData(3),
          node('replica', 'replica', 1120, 220, { size: 3 }),
        ],
        [
          ['users', 'lb'],
          ...seriesALinks(['server1', 'server2']),
          ['server1', 'replica'],
          ['server2', 'replica'],
        ],
      ),
    objectives: [
      {
        goal: 'Keep Apdex above 0.9 for 90 seconds.',
        hold: 90,
        met: (_, ledger) => ledger.apdex >= 0.9,
      },
      {
        goal: 'Writes will pile up. Keep every checkout correct for 2 minutes.',
        hold: 120,
        incident: { kind: 'repl-lag', survive: false },
        met: checkingOut(0.85),
      },
      {
        goal: 'Demand is up 50%, and the writes come back. Keep every checkout correct through it.',
        users: STALE_USERS * 1.5,
        hold: 120,
        incident: { kind: 'repl-lag', survive: true },
        met: checkingOut(0.85),
      },
    ],
  },
  'gc-pauses': {
    id: 'gc-pauses',
    name: 'GC Pauses',
    stage: 4,
    start: () =>
      board(
        4,
        GC_USERS,
        [...SERIES_B_RESEARCH, 'lang-java', 'zgc'],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 1,
              family: 'compute',
              runtime: 'tomcat',
            }),
          ),
          node('database', 'database', 880, 220, { size: 4 }),
          ...seriesBData(true),
        ],
        seriesBLinks(['server1', 'server2'], true),
      ),
    objectives: [
      {
        goal: `Keep API reads under ${GC_P99} ms at the p99 for 90 seconds.`,
        hold: 90,
        met: steadyReads(GC_P99),
      },
      {
        goal: `The heap will fill. Keep API reads under ${GC_P99} ms at the p99 for 2 minutes.`,
        hold: 120,
        incident: { kind: 'gc-storm', survive: true },
        met: steadyReads(GC_P99),
      },
      {
        goal: `It fills again. Keep reads under ${GC_P99} ms at the p99 with Burn at $${GC_BURN.toFixed(2)}/s or less.`,
        hold: 120,
        incident: { kind: 'gc-storm', survive: true },
        met: steadyReads(GC_P99, GC_BURN),
      },
    ],
  },
  'retry-storm': {
    id: 'retry-storm',
    name: 'Retry Storm',
    stage: 4,
    start: () => {
      const game = board(
        4,
        STORM_USERS,
        [...SERIES_B_RESEARCH, 'timeouts', 'backoff-jitter', 'circuit-breakers', 'load-shedding'],
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 3,
              runtime: 'go',
            }),
          ),
          node('database', 'database', 880, 220, { size: 4 }),
          ...seriesBData(true),
        ],
        seriesBLinks(['server1', 'server2'], true),
      )
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
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'The Database will slow down for 20 s. Get errors back under 1% and hold for 2 minutes.',
        hold: 120,
        incident: { kind: 'retry-storm', survive: false },
        met: serving(0.85),
      },
      {
        goal: `It slows again. Get errors under 1% and hold with Burn at $${STORM_BURN.toFixed(2)}/s or less.`,
        hold: 120,
        incident: { kind: 'retry-storm', survive: false },
        met: within(0.85, STORM_BURN),
      },
    ],
  },
  'analytics-primary': {
    id: 'analytics-primary',
    name: 'Analytics on Primary',
    stage: 4,
    start: () =>
      board(
        4,
        ANALYTICS_USERS,
        SERIES_B_RESEARCH,
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 3,
              runtime: 'go',
            }),
          ),
          node('database', 'database', 880, 220, { size: 4 }),
          ...seriesBData(false),
        ],
        seriesBLinks(['server1', 'server2'], false),
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 90 seconds.', hold: 90, met: serving(0.9) },
      {
        goal: 'Quarter end: a report will scan every table. Keep Apdex above 0.85 for 2 minutes.',
        hold: 120,
        incident: { kind: 'report-db', survive: true },
        met: serving(0.85),
      },
      {
        goal: `Demand is up 50%. Keep Apdex above 0.9 with Burn at $${ANALYTICS_BURN.toFixed(2)}/s or less.`,
        users: ANALYTICS_USERS * 1.5,
        hold: 120,
        met: within(0.9, ANALYTICS_BURN),
      },
    ],
  },
  'far-away': {
    id: 'far-away',
    name: 'Far Away',
    stage: 5,
    start: () =>
      board(
        5,
        FAR_USERS,
        SERIES_C_RESEARCH,
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 3,
              runtime: 'go',
            }),
          ),
          node('wide', 'wide', 880, 220, { size: 2, n: 3, r: 2, w: 2 }),
          ...seriesCData(),
        ],
        seriesCLinks(['server1', 'server2'], 'wide'),
      ),
    objectives: [
      { goal: 'Serve every request for 2 minutes.', hold: 120, met: answered(0.5) },
      {
        goal: `Half your users live outside North America. Get API reads under ${FAR_READ_MS} ms on average for 2 minutes.`,
        hold: 120,
        met: (game, ledger) =>
          answered(0.5)(game, ledger) && (ledger.kinds.read?.mean ?? 0) <= FAR_READ_MS,
      },
    ],
  },
  'missed-write': {
    id: 'missed-write',
    name: 'Missed Write',
    stage: 5,
    start: () =>
      board(
        5,
        MISSED_USERS,
        SERIES_C_RESEARCH,
        [
          node('lb', 'lb', 360, 280),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 3,
              runtime: 'go',
            }),
          ),
          node('wide', 'wide', 880, 220, { size: 2, n: 3, r: 1, w: 1 }),
          ...seriesCData(),
        ],
        seriesCLinks(['server1', 'server2'], 'wide'),
      ),
    objectives: [
      {
        goal: 'Every API read must see the latest write. Hold it for 2 minutes.',
        hold: 120,
        met: fresh,
      },
      {
        goal: 'A replica will fail. Keep reads fresh and errors under 1% for 2 minutes.',
        hold: 120,
        incident: { kind: 'instance', only: 'wide', survive: true },
        met: fresh,
      },
    ],
  },
  'hot-key': {
    id: 'hot-key',
    name: 'Hot Key',
    stage: 5,
    start: () =>
      board(
        5,
        HOT_USERS,
        [...SERIES_C_RESEARCH, 'hybrid-fanout'],
        [
          node('lb', 'lb', 360, 280, { size: 5 }),
          ...[0, 1].map((index) =>
            node(`server${index + 1}`, 'server', 600, 180 + index * 240, {
              size: 7,
              runtime: 'go',
              replicas: 2,
            }),
          ),
          node('wide', 'wide', 880, 220, { size: 4, n: 3, r: 2, w: 2 }),
          ...seriesCData(4),
        ],
        seriesCLinks(['server1', 'server2'], 'wide'),
      ),
    objectives: [
      { goal: 'Keep Apdex above 0.9 for 2 minutes.', hold: 120, met: answered(0.9) },
      {
        goal: 'A celebrity will post. Keep Apdex above 0.85 for 2 minutes.',
        hold: 120,
        incident: { kind: 'hot-key', survive: true },
        met: answered(0.85),
      },
    ],
  },
}

export const TRACKS: ReadonlyArray<
  Readonly<{ stage: number; sandboxes: ReadonlyArray<SandboxId> }>
> = [
  { stage: 0, sandboxes: ['out-of-credits', 'shared-box', 'second-server'] },
  { stage: 1, sandboxes: ['connection-limit', 'event-loop-stall', 'read-mostly'] },
  { stage: 2, sandboxes: ['stampede', 'slow-uploads', 'bots'] },
  { stage: 3, sandboxes: ['zone-outage', 'cold-start', 'stale-checkout'] },
  { stage: 4, sandboxes: ['gc-pauses', 'retry-storm', 'analytics-primary'] },
  { stage: 5, sandboxes: ['far-away', 'missed-write', 'hot-key'] },
]

/** A guided Sandbox opens when the one before it in its track has passed. */
export const sandboxOpen = (id: SandboxId, passed: ReadonlyArray<SandboxId>): boolean => {
  const track = TRACKS.find((entry) => entry.sandboxes.includes(id))
  const index = track?.sandboxes.indexOf(id) ?? 0
  const before = track?.sandboxes[index - 1]
  return before === undefined || passed.includes(before)
}

/* ---------- the free Sandbox ---------- */

/** Every Component and Stack, the Pre-seed mix, and a small Design to start from. */
export const freeSandbox = (): Game =>
  board(
    1,
    1_000,
    RESEARCH_IDS,
    [
      node('server', 'server', 440, 280, { runtime: 'php_fpm', workers: 16, size: 2 }),
      node('database', 'database', 760, 280),
    ],
    [
      ['users', 'server'],
      ['server', 'database'],
    ],
  )

/** A copy of a Company's Design on the free Sandbox, at its current demand and mix. */
export const sandboxOf = (game: Game): Game => ({
  ...freeSandbox(),
  stage: game.stage,
  users: Math.round(game.users),
  nodes: game.nodes.map((entry) => ({ ...entry, down: 0, warm: 1, leak: 0 })),
  links: game.links,
  nextId: game.nextId,
})

/* ---------- progress ---------- */

export const Progress = Schema.Struct({
  /** Index of the current objective; past the last one means passed. */
  objective: Schema.Finite,
  /** Sim seconds the current objective's condition has held. */
  held: Schema.Finite,
  /** The objective's incident has fired in this attempt. */
  fired: Schema.Boolean,
})
export type Progress = typeof Progress.Type

export const START: Progress = { objective: 0, held: 0, fired: false }

export const passedAll = (sandbox: GuidedSandbox, progress: Progress): boolean =>
  progress.objective >= sandbox.objectives.length

export type Advance = Readonly<{
  game: Game
  progress: Progress
  /** An objective passed on this advance. */
  advanced: boolean
}>

/**
 * Checks the current objective against the Ledger. A break in the condition
 * starts the hold again. For an incident the Design must survive, a break that
 * lasts until the incident is over arms it again.
 */
export const advanceSandbox = (
  sandbox: GuidedSandbox,
  progress: Progress,
  game: Game,
  ledger: Ledger,
  seconds: number,
): Advance => {
  const objective = sandbox.objectives[progress.objective]
  if (!objective) return { game, progress, advanced: false }
  const held = objective.met(game, ledger) ? progress.held + seconds : 0
  // The Design must recover while the incident runs. Still broken when it ends, it fires again.
  let fired =
    progress.fired &&
    !(objective.incident?.survive && game.incident === null && (held === 0 || progress.held === 0))
  let next = game
  if (objective.incident && !fired && held >= INCIDENT_AFTER) {
    const started = forceIncident(game, ledger, objective.incident.kind, objective.incident.only)
    if (started) {
      const magnitude = objective.incident.magnitude
      next =
        magnitude === undefined || started.incident === null
          ? started
          : { ...started, incident: { ...started.incident, magnitude } }
      fired = true
    }
  }
  const done = held >= objective.hold && (!objective.incident || fired)
  if (!done) return { game: next, progress: { ...progress, held, fired }, advanced: false }
  const index = progress.objective + 1
  const users = sandbox.objectives[index]?.users
  return {
    game: users === undefined ? next : { ...next, users },
    progress: { objective: index, held: 0, fired: false },
    advanced: true,
  }
}
