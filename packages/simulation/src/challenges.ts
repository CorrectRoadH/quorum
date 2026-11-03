import { Result, Schema } from 'effect'
import type { ComponentId, IncidentId, ResearchId } from './catalog.ts'
import { COMPONENTS, DESIGN_TUNING } from './catalog.ts'
import { company, link, node } from './company.ts'
import { forceIncident } from './director.ts'
import { hashGame } from './hash.ts'
import { SHARED } from './playbook.ts'
import { nextRandom } from './random.ts'
import { applyAction, applyDesign, type Replay } from './replay.ts'
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
  /** Users from each time on, in sim seconds. The first entry is at 0. */
  demand: ReadonlyArray<Readonly<{ at: number; users: number }>>
  incidents: ReadonlyArray<
    Readonly<{ at: number; kind: IncidentId; only?: ComponentId; magnitude?: number }>
  >
  targets: Readonly<{
    /** Highest share of failed requests. */
    errors: number
    /** Highest Tail, in ms. */
    tail?: number
    /** Highest Cost, in dollars per second. */
    cost?: number
    /** Highest share of requests refused for want of a connection. */
    refused?: number
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

const PRESEED_PALETTE: ReadonlyArray<ResearchId> = [
  'php-fpm',
  'load-balancing',
  'pooling',
  'caching',
  'lang-node',
  'node-cluster',
]

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
        node(id, 'server', 560 + 60 * Math.floor(index / 10), 40 + 52 * (index % 10), extra),
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
    brief: 'App and database share a box. Reach 100 rps.',
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
    targets: { errors: 0.01 },
    edges: {
      cost: [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1],
      tail: [250, 500, 1_000, 1_500, 2_000, 2_500, 3_000, 4_000, 5_000],
      complexity: [4, 5, 6, 7, 8, 10, 12],
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

const DRILL_BASES: ReadonlyArray<
  Readonly<{
    name: string
    era: number
    users: number
    game: (seed: number, users: number) => Game
  }>
> = [
  {
    name: 'One box',
    era: 0,
    users: 2_400,
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
    name: 'Two servers',
    era: 1,
    users: 5_000,
    game: (seed, users) => {
      const { nodes, links } = fleet(2, { runtime: 'php_fpm', workers: 16 }, 'database')
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
]

const DRILL_INCIDENTS: ReadonlyArray<
  Readonly<{ kind: IncidentId; only?: ComponentId; magnitude?: number }>
> = [
  { kind: 'instance', only: 'server' },
  { kind: 'spike', magnitude: 3 },
  { kind: 'leak' },
  { kind: 'connections' },
]

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** The daily drill for a UTC date (`YYYY-MM-DD`): the same for every player, derived, never stored. */
export const dailyDrill = (date: string): Challenge => {
  const [base_, seed] = nextRandom(fnv(date) % 2_147_483_648)
  const [incident_] = nextRandom(seed)
  const base =
    DRILL_BASES[Math.floor(base_ * DRILL_BASES.length)] ??
    (DRILL_BASES[0] as (typeof DRILL_BASES)[number])
  const usable = DRILL_INCIDENTS.filter((entry) => base.era >= 1 || entry.kind !== 'connections')
  const incident = usable[Math.floor(incident_ * usable.length)] ?? { kind: 'instance' as const }
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
    targets: { errors: 0.02 },
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
}

export const ChallengeResult = Schema.Struct({
  passed: Schema.Boolean,
  cost: Schema.Finite,
  tail: Schema.Finite,
  complexity: Schema.Finite,
  errors: Schema.Finite,
  refused: Schema.Finite,
  /** The first target missed, or null. */
  missed: Schema.NullOr(Schema.String),
  hash: Schema.String,
})
export type ChallengeResult = typeof ChallengeResult.Type

export const stepsOf = (challenge: Challenge): number =>
  Math.round(challenge.duration / challenge.stepSeconds)

const usersAt = (challenge: Challenge, time: number): number =>
  challenge.demand.reduce((users, entry) => (entry.at <= time + 1e-9 ? entry.users : users), 0)

/** The replay's Design on the Challenge's start, or why it is refused. */
export const beginRun = (challenge: Challenge, replay: Replay): Result.Result<Game, string> => {
  if (replay.challenge !== challenge.id) return Result.fail('The replay is for another Challenge.')
  if (replay.simVersion !== SIM_VERSION) return Result.fail('Update Quorum to submit this result.')
  const built = applyDesign(challenge.start(), replay.design)
  if (Result.isFailure(built)) return built
  const broken = challenge.rule?.(built.success)
  if (broken) return Result.fail(broken)
  return Result.succeed({ ...built.success, users: usersAt(challenge, 0) })
}

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
    if (entry.step === index) current = applyAction(current, entry.action)
  current = { ...current, users: usersAt(challenge, time) }
  const events: Array<StepEvent> = []
  for (const scripted of challenge.incidents) {
    if (scripted.at < time - 1e-9 || scripted.at >= time + challenge.stepSeconds - 1e-9) continue
    const started = forceIncident(current, solveFlow(current), scripted.kind, scripted.only)
    if (!started || started.incident === null) continue
    current =
      scripted.magnitude === undefined
        ? started
        : { ...started, incident: { ...started.incident, magnitude: scripted.magnitude } }
    if (current.incident) events.push(StepEvent.IncidentStarted({ incident: current.incident }))
  }
  const result = step(current, challenge.stepSeconds, DESIGN_TUNING)
  events.push(...result.events)
  const ledger = result.ledger
  const scored = time >= WARMUP - 1e-9
  return {
    game: result.game,
    events,
    totals: scored
      ? {
          step: index + 1,
          scored: totals.scored + 1,
          burn: totals.burn + ledger.burn,
          tail: totals.tail + ledger.p99 * ledger.served,
          served: totals.served + ledger.served,
          failed: totals.failed + ledger.errorShare * ledger.demand,
          refused: totals.refused + ledger.errors.refused,
          demand: totals.demand + ledger.demand,
        }
      : { ...totals, step: index + 1 },
  }
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
  const { targets } = challenge
  const missed =
    totals.served <= 0
      ? 'Nothing was served.'
      : errors > targets.errors
        ? 'Too many errors.'
        : targets.refused !== undefined && refused > targets.refused
          ? 'Connections were refused.'
          : targets.tail !== undefined && tail > targets.tail
            ? 'The tail is too long.'
            : targets.cost !== undefined && cost > targets.cost
              ? 'Over budget.'
              : null
  return {
    passed: missed === null,
    cost,
    tail,
    complexity: complexityOf(game),
    errors,
    refused,
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
