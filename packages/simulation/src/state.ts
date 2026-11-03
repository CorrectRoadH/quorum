import { Effect, Schema } from 'effect'
import {
  MUTATOR_IDS,
  VENTURE_IDS,
  COMPONENT_IDS,
  FAMILY_IDS,
  FEATURE_IDS,
  FIXES,
  FRAMEWORK_IDS,
  INCIDENT_IDS,
  INSIGHT_POOLS,
  LANGUAGE_IDS,
  POLICY_IDS,
  REQUEST_KINDS,
  REGIONS,
  RESEARCH_IDS,
  RUNTIME_IDS,
  START_KLOC,
  ZONES,
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
export const VentureId = Schema.Literals(VENTURE_IDS)
export const MutatorId = Schema.Literals(MUTATOR_IDS)

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

export const Zone = Schema.Literals(ZONES)
export type Zone = typeof Zone.Type

/** A GPU Node's GPU type (05 "GPU Node"). */
export const GpuType = Schema.Literals(['t4', 'a100', 'h100'])
export type GpuType = typeof GpuType.Type

/** A Java App Server's garbage collector. */
export const Collector = Schema.Literals(['g1', 'parallel', 'zgc'])
export type Collector = typeof Collector.Type

/** What an Autoscaler reads: CPU, or the Node's whole load, slots and memory included. */
export const Region = Schema.Literals(REGIONS)
export type Region = typeof Region.Type

export const Backup = Schema.Literals(['none', 'nightly', 'pitr'])
export type Backup = typeof Backup.Type

export const Fanout = Schema.Literals(['pull', 'push'])
export type Fanout = typeof Fanout.Type

export const ScaleSignal = Schema.Literals(['cpu', 'load'])
export type ScaleSignal = typeof ScaleSignal.Type

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
  /** Seconds of traces Analytics keeps. */
  retention: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(900))),
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
  /** Tasks waiting in a Queue. */
  depth: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** A Queue moves a task that keeps failing to a dead-letter queue. */
  dlq: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** A Cache coalesces misses for the same key (Stampede protection). */
  coalesce: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** A Cache refills before it takes traffic after a restart (Cache warming). */
  warming: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** A WAF's paranoia level, 1 to 4. */
  paranoia: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(2))),
  /** A WAF challenges every request. */
  underAttack: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** The zone the Node runs in. */
  zone: Zone.pipe(Schema.withDecodingDefaultKey(Effect.succeed('a' as const))),
  /** A data Node keeps a standby in another zone and fails over to it. */
  standby: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** Copies of an App Server or Worker that serve now. */
  replicas: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1))),
  /** Copies an Autoscaler has asked for that are still booting, and the seconds until they serve. */
  pending: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  readyIn: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** Sim time an Autoscaler last changed this Node's copies. */
  scaledAt: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** An Autoscaler's signal, target load, and copy limits. A max of 0 means none. */
  signal: ScaleSignal.pipe(Schema.withDecodingDefaultKey(Effect.succeed('cpu' as const))),
  target: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0.6))),
  minCopies: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1))),
  maxCopies: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(8))),
  /** A GPU Node's GPU type. */
  gpu: GpuType.pipe(Schema.withDecodingDefaultKey(Effect.succeed('t4' as const))),
  /** A Java App Server's collector, and a Go App Server's GOGC. */
  collector: Collector.pipe(Schema.withDecodingDefaultKey(Effect.succeed('g1' as const))),
  gogc: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(100))),
  /** A saturated App Server drops the lowest-value kinds first (Priority load shedding). */
  shed: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** An App Server sends reads that follow a write to the primary (Read-your-writes routing). */
  ryw: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  region: Region.pipe(Schema.withDecodingDefaultKey(Effect.succeed('na' as const))),
  /** Wide-column Store: replicas per key, replicas a read asks, replicas a write waits for. */
  n: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(3))),
  r: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1))),
  w: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1))),
  /** Sim seconds one of its replicas stays lost (a Wide-column Store keeps serving). */
  lost: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** A Wide-column Store or Distributed SQL Node replicates across regions. */
  spread: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  backup: Backup.pipe(Schema.withDecodingDefaultKey(Effect.succeed('none' as const))),
  fanout: Fanout.pipe(Schema.withDecodingDefaultKey(Effect.succeed('pull' as const))),
  /** A Cache splits hot keys across its shards. */
  split: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
})
export type GameNode = typeof GameNode.Type

export const Retries = Schema.Literals(['none', 'naive', 'backoff'])
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
  /** A circuit breaker on the Link (Circuit breakers). */
  breaker: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  /** Seconds the breaker stays open: the Link fails fast and sends nothing. */
  open: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /**
   * Share of calls that failed on the Link last Step, for Links that retry or break. Retries
   * carry it into the next Step, which is what keeps a retry storm going.
   */
  failure: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
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
  /** The zone a zone outage took down. */
  zone: Schema.NullOr(Zone).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
  region: Schema.NullOr(Region).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
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

/** One calendar hour of requests users sent and the share that failed, for the error budget. */
export const BudgetHour = Schema.Struct({
  hour: Schema.Finite,
  requests: Schema.Finite,
  failed: Schema.Finite,
  /** Users at the end of the hour, for growth over the week (09 "Valuation"); 0 when unknown. */
  users: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
})
export type BudgetHour = typeof BudgetHour.Type

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

export const WorkKind = Schema.Literals(['feature', 'task', 'migration', 'spike', 'patch'])
export type WorkKind = typeof WorkKind.Type

/**
 * One backlog item. `ref` is a Feature or task id; a migration item names its
 * step; a Spike names the research of the Study it speeds; a patch names its CVE.
 */
export const WorkItem = Schema.Struct({
  id: Schema.Finite,
  kind: WorkKind,
  ref: Schema.String,
  cost: Schema.Finite,
  spent: Schema.Finite,
  /** A patch's deadline, in Company seconds. It turns overdue after it and is exploited a grace later. */
  due: Schema.optionalKey(Schema.Finite),
  /** The Component id a patch is for. */
  target: Schema.optionalKey(Schema.String),
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

/** The DR drill (10 "Era 6"): when it began, how long recovery took, and the data it would lose. */
export const Drill = Schema.Struct({
  startedAt: Schema.Finite,
  /** Calendar minutes until the error share fell under 1%, or null until then. */
  rto: Schema.NullOr(Schema.Finite),
  /** Calendar minutes of writes the failed region would lose. */
  rpo: Schema.Finite,
  done: Schema.Boolean,
  passed: Schema.Boolean,
})
export type Drill = typeof Drill.Type

export const QuarterResult = Schema.Struct({
  beat: Schema.Boolean,
  growth: Schema.Finite,
  margin: Schema.Finite,
})
export type QuarterResult = typeof QuarterResult.Type

/** A Public quarter (10 "Era 7"): the guidance set at its start, and where it started from. */
export const Quarter = Schema.Struct({
  index: Schema.Finite,
  startedAt: Schema.Finite,
  /** Guidance levels, 0 to 2: revenue growth 5/10/20%, margin 10/20/30%. */
  growth: Schema.Finite,
  margin: Schema.Finite,
  revenue: Schema.Finite,
  streak: Schema.Finite,
  /** What beats and misses added to the valuation multiple. */
  bonus: Schema.Finite,
  last: Schema.NullOr(QuarterResult),
})
export type Quarter = typeof Quarter.Type

/**
 * What the Company was founded with (13): its Venture, its Mutators, and the
 * Founder's perk levels at founding. The Simulation reads this, never the
 * Founder record, so a save is self-contained.
 */
export const Founding = Schema.Struct({
  venture: VentureId,
  mutators: Schema.Array(MutatorId),
  perks: Schema.Record(Schema.String, Schema.Finite),
})
export type Founding = typeof Founding.Type

export const DEFAULT_FOUNDING: Founding = { venture: 'b2b-saas', mutators: [], perks: {} }

/** Insight held in each pool (12 "Earning Insight"). */
export const InsightPools = Schema.Struct(
  Object.fromEntries(
    INSIGHT_POOLS.map((pool) => [
      pool,
      Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
    ]),
  ) as Record<(typeof INSIGHT_POOLS)[number], Schema.withDecodingDefaultKey<typeof Schema.Finite>>,
)
export type InsightPools = typeof InsightPools.Type

export const NO_INSIGHT: InsightPools = Object.fromEntries(
  INSIGHT_POOLS.map((pool) => [pool, 0]),
) as InsightPools

/** A queued Study: the research, and the share of its base duration done. */
export const Study = Schema.Struct({ id: ResearchId, progress: Schema.Finite })
export type Study = typeof Study.Type

/**
 * What a Challenge changes about its Board (14 "Challenges"), beyond the Era's rules. Absent
 * from every Company and guided Sandbox, so their saves and hashes do not carry it.
 */
export const Scenario = Schema.Struct({
  /** The request mix, instead of the Era's. */
  mix: Schema.optionalKey(Schema.Record(Schema.String, Schema.Finite)),
  /** Each region's users follow their own daily cycle, as in a Company. */
  daily: Schema.optionalKey(Schema.Boolean),
  /** Fixes are Design choices the Design pays Dev Hours for, not given. */
  tasks: Schema.optionalKey(Schema.Boolean),
  /** What a request of each kind earns, as a multiple of its catalog value: a paid plan's price. */
  value: Schema.optionalKey(Schema.Record(Schema.String, Schema.Finite)),
})
export type Scenario = typeof Scenario.Type

export const DEFAULT_ALERT_RULES: AlertRules = { errors: 0.01, latency: 4, saturation: 0.9 }
export const NO_FALSE_ALARMS: FalseAlarms = { day: 0, errors: 0, latency: 0, saturation: 0 }

export const Game = Schema.Struct({
  nodes: Schema.Array(GameNode),
  links: Schema.Array(GameLink),
  nextId: Schema.Finite,
  cash: Schema.Finite,
  /** Old saves' single Insight balance. Unused: the first Step moves it into `pools`. */
  insight: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  pools: InsightPools.pipe(Schema.withDecodingDefaultKey(Effect.succeed(NO_INSIGHT))),
  /** Studies in order; the first one runs (10 "Studies"). */
  studies: Schema.Array(Study).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
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
  scenario: Schema.optionalKey(Scenario),
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
  /** The CVEs already disclosed, so each one comes once. */
  cves: Schema.Array(Schema.String).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  shipped: Schema.Array(FeatureId).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  /** Features built and waiting for the next deploy. */
  awaiting: Schema.Array(FeatureId).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  /** Idle teams pick the next Feature, shift migrations, and pay down debt on their own. */
  autopilot: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(true))),
  deploys: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  badDeploys: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** GB held in Object Storage. */
  stored: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** The last calendar week of requests and failures, by hour: the SLO window. */
  budget: Schema.Array(BudgetHour).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  drill: Schema.NullOr(Drill).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
  /** The current Public quarter; null before the IPO. */
  quarter: Schema.NullOr(Quarter).pipe(Schema.withDecodingDefaultKey(Effect.succeed(null))),
  founding: Founding.pipe(Schema.withDecodingDefaultKey(Effect.succeed(DEFAULT_FOUNDING))),
  /** Legacy this Company already paid: the IPO pays at listing, and Step down pays the rest. */
  banked: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** The most users the Company ever had. */
  peak: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
  /** Wall-clock milliseconds of the last save, written by the browser for offline progress. */
  wall: Schema.Finite.pipe(Schema.withDecodingDefaultKey(Effect.succeed(0))),
})
export type Game = typeof Game.Type
