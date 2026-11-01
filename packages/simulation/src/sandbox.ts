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
  incident?: Readonly<{ kind: IncidentId; only?: ComponentId; survive: boolean }>
  met: (game: Game, ledger: Ledger) => boolean
}>

export const SANDBOX_IDS = [
  'out-of-credits',
  'shared-box',
  'second-server',
  'connection-limit',
  'event-loop-stall',
  'read-mostly',
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

const fast =
  (p99: number) =>
  (_: Game, ledger: Ledger): boolean =>
    ledger.errorShare < 0.01 && ledger.p99 <= p99

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
            node(`server${index + 1}`, 'server', 600, 140 + index * 140, {
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
            node(`server${index + 1}`, 'server', 600, 180 + index * 200, {
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
}

export const TRACKS: ReadonlyArray<
  Readonly<{ stage: number; sandboxes: ReadonlyArray<SandboxId> }>
> = [
  { stage: 0, sandboxes: ['out-of-credits', 'shared-box', 'second-server'] },
  { stage: 1, sandboxes: ['connection-limit', 'event-loop-stall', 'read-mostly'] },
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
 * starts the hold again. For an incident the Design must survive, the break
 * also arms the incident again once it is over.
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
  let fired =
    progress.fired && !(objective.incident?.survive && held === 0 && game.incident === null)
  let next = game
  if (objective.incident && !fired && held >= INCIDENT_AFTER) {
    const started = forceIncident(game, ledger, objective.incident.kind, objective.incident.only)
    if (started) {
      next = started
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
