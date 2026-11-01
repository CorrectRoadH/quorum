import { Effect, Schema } from 'effect'
import {
  COMPONENT_IDS,
  FAMILY_IDS,
  FRAMEWORK_IDS,
  INCIDENT_IDS,
  RESEARCH_IDS,
  RUNTIME_IDS,
} from './catalog.ts'

/* ==========================================================================
   The saved game. Everything the Simulation needs to continue lives here, and
   nothing else: the Ledger is derived from it on every Step.
   ========================================================================== */

export const ComponentId = Schema.Literals(COMPONENT_IDS)
export const FamilyId = Schema.Literals(FAMILY_IDS)
export const RuntimeId = Schema.Literals(RUNTIME_IDS)
export const FrameworkId = Schema.Literals(FRAMEWORK_IDS)
export const ResearchId = Schema.Literals(RESEARCH_IDS)
export const IncidentId = Schema.Literals(INCIDENT_IDS)

export const DownCause = Schema.Literals(['restart', 'failure', 'oom'])
export type DownCause = typeof DownCause.Type

/** One placed Component. */
export const GameNode = Schema.Struct({
  id: Schema.String,
  type: ComponentId,
  x: Schema.Finite,
  y: Schema.Finite,
  /** Index into SIZES for sized Components; the drawer or sampler size otherwise. */
  size: Schema.Finite,
  family: FamilyId,
  runtime: RuntimeId,
  framework: FrameworkId,
  /** Pool size for pooled runtimes. */
  workers: Schema.Finite,
  /** Postgres runs on this App Server. Only the starting box has it. */
  localDb: Schema.Boolean,
  /** Index into SAMPLE_RATES, for Analytics. */
  sample: Schema.Finite,
  /** Seconds left down. Minus one means down until replaced. */
  down: Schema.Finite,
  /** Why the Node is down: a restart, a failure, or an out-of-memory kill. */
  downCause: DownCause.pipe(Schema.withDecodingDefaultKey(Effect.succeed('restart' as const))),
  /** 0 when cold, 1 when warm. */
  warm: Schema.Finite,
  /** Burstable CPU credits, in core-seconds. */
  credits: Schema.Finite,
  /** GB leaked by a memory leak. */
  leak: Schema.Finite,
})
export type GameNode = typeof GameNode.Type

export const GameLink = Schema.Struct({ from: Schema.String, to: Schema.String })
export type GameLink = typeof GameLink.Type

export const Incident = Schema.Struct({
  kind: IncidentId,
  /** Sim seconds left. */
  remaining: Schema.Finite,
  nodeId: Schema.NullOr(Schema.String),
  startedAt: Schema.Finite,
  /** Revenue per second when it started, to measure what it cost. */
  baseline: Schema.Finite,
  usersAtStart: Schema.Finite,
  /** Seconds with more than 1% of requests failing: the MTTR. */
  impaired: Schema.Finite,
  lostRevenue: Schema.Finite,
  failed: Schema.Finite,
})
export type Incident = typeof Incident.Type

export const Postmortem = Schema.Struct({
  id: Schema.Finite,
  kind: IncidentId,
  target: Schema.NullOr(Schema.String),
  duration: Schema.Finite,
  mttr: Schema.Finite,
  lostUsers: Schema.Finite,
  lostRevenue: Schema.Finite,
  failed: Schema.Finite,
  /** The research this postmortem opens as an action item. */
  action: Schema.NullOr(ResearchId),
})
export type Postmortem = typeof Postmortem.Type

/** One second of history, for the sparklines. */
export const Sample = Schema.Struct({
  users: Schema.Finite,
  demand: Schema.Finite,
  served: Schema.Finite,
  revenue: Schema.Finite,
  burn: Schema.Finite,
  latency: Schema.Finite,
  p99: Schema.Finite,
  apdex: Schema.Finite,
  errors: Schema.Finite,
})
export type Sample = typeof Sample.Type

/** Seconds each alert condition has held, for the pager. */
export const Alarms = Schema.Struct({
  errors: Schema.Finite,
  latency: Schema.Finite,
  saturation: Schema.Finite,
})
export type Alarms = typeof Alarms.Type

export const Game = Schema.Struct({
  nodes: Schema.Array(GameNode),
  links: Schema.Array(GameLink),
  nextId: Schema.Finite,
  cash: Schema.Finite,
  insight: Schema.Finite,
  users: Schema.Finite,
  /** Revenue waiting in the Payments drawer. */
  pending: Schema.Finite,
  /** Revenue lost to a full drawer. */
  spilled: Schema.Finite,
  researched: Schema.Array(ResearchId),
  stage: Schema.Finite,
  equity: Schema.Finite,
  /** The current Era began with a declined round. */
  declined: Schema.Boolean,
  /** Seconds of simulated time since the company started. */
  time: Schema.Finite,
  seed: Schema.Finite,
  /** Apdex averaged over the last calendar hour. */
  apdex: Schema.Finite,
  incident: Schema.NullOr(Incident),
  /** The last incident type, so the director does not repeat itself. */
  lastIncident: Schema.NullOr(IncidentId),
  nextIncidentAt: Schema.Finite,
  postmortems: Schema.Array(Postmortem),
  postmortemSeq: Schema.Finite,
  /** Action items from postmortems. Each stays open until its research is owned. */
  openActions: Schema.Array(ResearchId),
  alarms: Alarms,
  earned: Schema.Finite,
  history: Schema.Array(Sample),
  /**
   * A Board outside any Company: demand is flat, users do not grow or leave,
   * placing costs nothing, and incidents come only from the Sandbox's script.
   */
  sandbox: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
})
export type Game = typeof Game.Type
