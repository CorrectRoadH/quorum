import { Effect, Schema } from 'effect'
import {
  COMPONENT_IDS,
  FAMILY_IDS,
  FRAMEWORK_IDS,
  INCIDENT_IDS,
  REQUEST_KINDS,
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

export const RequestKindId = Schema.Literals(REQUEST_KINDS)

export const LbPolicy = Schema.Literals(['weighted', 'round-robin', 'least-conn', 'p2c'])
export type LbPolicy = typeof LbPolicy.Type

export const PmMode = Schema.Literals(['static', 'dynamic', 'ondemand'])
export type PmMode = typeof PmMode.Type

export const CacheEngine = Schema.Literals(['redis', 'memcached'])
export type CacheEngine = typeof CacheEngine.Type

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
  /** Old saves' index into the sample rates. Unused: `sampleRate` holds the rate by value. */
  sample: Schema.Finite,
  /** Share of requests Analytics samples. */
  sampleRate: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0.1))),
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
  /** The App Server gzips page and read responses. */
  compress: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** Sim time the Node last went down, so health checks and DNS notice it late. */
  downAt: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** How a Load Balancer splits traffic. */
  policy: LbPolicy.pipe(Schema.withDecodingDefaultKey(Effect.succeed('weighted' as const))),
  /** Seconds between a Load Balancer's health checks. */
  checkEvery: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(10))),
  /** A deep health check also checks the server's database. */
  deepCheck: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** DNS or Cache TTL, in seconds. */
  ttl: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(300))),
  /** PHP-FPM's process manager. */
  pm: PmMode.pipe(Schema.withDecodingDefaultKey(Effect.succeed('static' as const))),
  /** The Cache's engine. */
  engine: CacheEngine.pipe(Schema.withDecodingDefaultKey(Effect.succeed('redis' as const))),
})
export type GameNode = typeof GameNode.Type

export const Retries = Schema.Literals(['none', 'naive'])
export type Retries = typeof Retries.Type

/** A directed network call, with its timeout, retry policy, and the kinds it carries. */
export const GameLink = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
  /** Seconds before the caller gives up. */
  timeout: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(30))),
  retries: Retries.pipe(Schema.withDecodingDefaultKey(Effect.succeed('none' as const))),
  /** The request kinds a Load Balancer sends on this link, or null for every kind. */
  kinds: Schema.NullOr(Schema.Array(RequestKindId)).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(null)),
  ),
})
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
  /** SEV level now: it starts at the incident's own and can step up once. */
  severity: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(3))),
  /** How many times normal demand a spike sends. */
  magnitude: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(3))),
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
  /** The SEV level it ended at. */
  severity: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(3))),
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

/** Alert thresholds: error share, p99 as a multiple of the Apdex target, and Node load. */
export const AlertRules = Schema.Struct({
  errors: Schema.Finite,
  latency: Schema.Finite,
  saturation: Schema.Finite,
})
export type AlertRules = typeof AlertRules.Type

/** Alerts that fired with no incident running, per rule, in the calendar day `day`. */
export const FalseAlarms = Schema.Struct({
  day: Schema.Finite,
  errors: Schema.Finite,
  latency: Schema.Finite,
  saturation: Schema.Finite,
})
export type FalseAlarms = typeof FalseAlarms.Type

export const DEFAULT_ALERT_RULES: AlertRules = { errors: 0.01, latency: 4, saturation: 0.9 }
export const NO_FALSE_ALARMS: FalseAlarms = { day: 0, errors: 0, latency: 0, saturation: 0 }

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
  /** Request kinds users have been served, so the first of each pays Insight once. */
  servedKinds: Schema.Array(RequestKindId).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(['page', 'read'] as const)),
  ),
  alertRules: AlertRules.pipe(Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_ALERT_RULES))),
  falseAlarms: FalseAlarms.pipe(Schema.withDecodingDefaultKey(Effect.succeed(NO_FALSE_ALARMS))),
  earned: Schema.Finite,
  history: Schema.Array(Sample),
  /**
   * A Board outside any Company: demand is flat, users do not grow or leave,
   * placing costs nothing, and incidents come only from the Sandbox's script.
   */
  sandbox: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
})
export type Game = typeof Game.Type
