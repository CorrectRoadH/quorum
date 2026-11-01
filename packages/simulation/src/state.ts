import { Effect, Schema } from 'effect'
import {
  COMPONENT_IDS,
  FAMILY_IDS,
  FEATURE_IDS,
  FIXES,
  FRAMEWORK_IDS,
  INCIDENT_IDS,
  LANGUAGE_IDS,
  POLICY_IDS,
  REQUEST_KINDS,
  RESEARCH_IDS,
  RUNTIME_IDS,
  START_KLOC,
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
export const LanguageId = Schema.Literals(LANGUAGE_IDS)
export const PolicyId = Schema.Literals(POLICY_IDS)
export const FeatureId = Schema.Literals(FEATURE_IDS)
export const FixId = Schema.Literals(FIXES)

export const LbPolicy = Schema.Literals(['weighted', 'round-robin', 'least-conn', 'p2c'])
export type LbPolicy = typeof LbPolicy.Type

export const PmMode = Schema.Literals(['static', 'dynamic', 'ondemand'])
export type PmMode = typeof PmMode.Type

export const CacheEngine = Schema.Literals(['redis', 'memcached'])
export type CacheEngine = typeof CacheEngine.Type

export const DownCause = Schema.Literals(['restart', 'failure', 'oom'])
export type DownCause = typeof DownCause.Type

export const PoolerMode = Schema.Literals(['session', 'transaction'])
export type PoolerMode = typeof PoolerMode.Type

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
  /** The Connection Pooler's mode. Saves from before modes pooled by transaction. */
  mode: PoolerMode.pipe(Schema.withDecodingDefaultKey(Effect.succeed('transaction' as const))),
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

/* ---------- the Team (08) ---------- */

/** An engineer on the payroll. The founder is not one: every Company has them. */
export const Engineer = Schema.Struct({
  id: Schema.String,
  team: Schema.String,
  /** The language they were hired for, which sets their salary. */
  language: LanguageId,
  /** Sim time they joined, for the ramp-up. */
  hiredAt: Schema.Finite,
})
export type Engineer = typeof Engineer.Type

/** An offer accepted: the engineer joins at `readyAt`. */
export const Hire = Schema.Struct({
  id: Schema.String,
  team: Schema.String,
  language: LanguageId,
  readyAt: Schema.Finite,
})
export type Hire = typeof Hire.Type

export const Team = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  policy: PolicyId,
  /** The policy in force until a calendar day after `since`. */
  previous: PolicyId,
  since: Schema.Finite,
})
export type Team = typeof Team.Type

/** A Stack change in progress (08 "Migrations"): the strangler moves App Servers over in steps. */
export const Migration = Schema.Struct({
  runtime: RuntimeId,
  framework: FrameworkId,
  fromRuntime: RuntimeId,
  fromFramework: FrameworkId,
  /** Dev Hours for the whole migration. */
  total: Schema.Finite,
  /** Steps shifted so far, 0 to 4. */
  step: Schema.Finite,
  /** The next step's Dev Hours are built: traffic can shift. */
  ready: Schema.Boolean,
  /** The new Stack fails some requests until Fix bugs ships. */
  bugs: Schema.Boolean,
})
export type Migration = typeof Migration.Type

/** A codebase with its own deploys. The slice has one: the monolith. */
export const Service = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  /** Tech debt, 0 to 1. */
  debt: Schema.Finite,
  /** Thousands of lines: what a migration has to move. */
  codebase: Schema.Finite,
  /** Engineering tasks that changed the code for good. */
  fixes: Schema.Array(FixId),
  /** Query shapes with no index. */
  shapes: Schema.Finite,
  migration: Schema.NullOr(Migration),
  nextDeployAt: Schema.Finite,
  /** What the last deploy shipped, so a rollback can take it back. */
  lastDeploy: Schema.Array(FeatureId),
})
export type Service = typeof Service.Type

export const WorkKind = Schema.Literals(['feature', 'task', 'migration'])
export type WorkKind = typeof WorkKind.Type

/** One backlog item. `ref` is a Feature or task id; a migration item names its step. */
export const WorkItem = Schema.Struct({
  id: Schema.Finite,
  kind: WorkKind,
  ref: Schema.String,
  cost: Schema.Finite,
  spent: Schema.Finite,
})
export type WorkItem = typeof WorkItem.Type

export const CORE_TEAM: Team = {
  id: 'core',
  name: 'Core',
  policy: 'balanced',
  previous: 'balanced',
  since: 0,
}

export const monolith = (fixes: ReadonlyArray<typeof FixId.Type>): Service => ({
  id: 'monolith',
  name: 'Monolith',
  debt: 0,
  codebase: START_KLOC,
  fixes,
  shapes: 0,
  migration: null,
  nextDeployAt: 0,
  lastDeploy: [],
})

/**
 * A save from before the Team plays as it did: its code already loads eagerly
 * once researched, and its poolers already ran in transaction mode.
 */
const OLD_MONOLITH = monolith(['eager-loading', 'session-state'])

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
  /** Dev Hours no backlog item took, ready to rush any item. */
  devHours: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  engineers: Schema.Array(Engineer).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  hires: Schema.Array(Hire).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  teams: Schema.Array(Team).pipe(Schema.withDecodingDefaultKey(Effect.succeed([CORE_TEAM]))),
  /** Sim time a layoff's hit to morale ends. */
  moraleUntil: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  services: Schema.Array(Service).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed([OLD_MONOLITH])),
  ),
  /** Work in priority order: each team takes the first item no team ahead of it has. */
  backlog: Schema.Array(WorkItem).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  workSeq: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  shipped: Schema.Array(FeatureId).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  /** Features built and waiting for the next deploy. */
  awaiting: Schema.Array(FeatureId).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  /** Idle teams pick the next Feature, shift migrations, and pay down debt on their own. */
  autopilot: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(true))),
  deploys: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  badDeploys: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
})
export type Game = typeof Game.Type
