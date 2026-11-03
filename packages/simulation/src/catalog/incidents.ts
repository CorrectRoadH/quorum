/* Incidents, postmortems and the alert rules. */

import type { ResearchId } from './research.ts'

export const INCIDENT_IDS = [
  'spike',
  'instance',
  'connections',
  'loop',
  'leak',
  'slow-query',
  'bad-deploy',
  'bot-surge',
  'stuffing',
  'stampede',
  'poison',
  'ddos',
  'certificate',
  'psp-outage',
  'zone',
  'disk-full',
  'repl-lag',
  'gc-storm',
  'retry-storm',
  'double-charge',
  'report-db',
  'gpu-shortage',
  'regex',
  'region',
  'partition',
  'hot-key',
  'bgp',
  'audit',
  'dr-drill',
  'breach',
] as const
export type IncidentId = (typeof INCIDENT_IDS)[number]

export type IncidentDef = Readonly<{
  id: IncidentId
  name: string
  /** The first Era the director can pick it in. */
  era: number
  severity: 1 | 2 | 3
  /** The severity it steps up to when it stays unmitigated (11 "Escalation"). */
  escalatesTo: 1 | 2
  /** Sim seconds before it ends on its own. */
  duration: number
  /** What happened, for the postmortem. */
  cause: string
  /** What would prevent it, for the postmortem. */
  prevention: string
  /** Research that prevents it, in order. The postmortem opens the first one not yet owned. */
  actions: ReadonlyArray<ResearchId>
}>

export const INCIDENTS: Record<IncidentId, IncidentDef> = {
  spike: {
    id: 'spike',
    name: 'Traffic spike',
    era: 1,
    severity: 3,
    escalatesTo: 2,
    duration: 30,
    cause: 'A big news site linked to you. Demand tripled.',
    prevention: 'Spare capacity, a cache, more App Servers.',
    actions: ['caching', 'alerting'],
  },
  instance: {
    id: 'instance',
    name: 'Instance failure',
    era: 1,
    severity: 3,
    escalatesTo: 2,
    duration: 60,
    cause: 'The host under a VM died.',
    prevention: 'A second copy behind a Load Balancer, which skips dead hosts.',
    actions: ['load-balancing', 'health-checks'],
  },
  connections: {
    id: 'connections',
    name: 'Connection exhaustion',
    era: 1,
    severity: 2,
    escalatesTo: 1,
    duration: 40,
    cause: 'A deploy doubled every connection pool. Postgres refused the excess.',
    prevention: 'A Connection Pooler, or smaller pools.',
    actions: ['pooling'],
  },
  loop: {
    id: 'loop',
    name: 'Event loop block',
    era: 1,
    severity: 3,
    escalatesTo: 2,
    duration: 35,
    cause: 'Password hashing cost went from 10 to 12 rounds: 4× CPU per login.',
    prevention: 'The libuv thread pool, an Auth Provider, or a runtime without one event loop.',
    actions: ['libuv-pool', 'auth-provider'],
  },
  leak: {
    id: 'leak',
    name: 'Memory leak',
    era: 1,
    severity: 3,
    escalatesTo: 2,
    duration: 60,
    cause: 'A persistent process leaked memory until the kernel killed it.',
    prevention: 'Restart the service, or run PHP: it frees everything after each request.',
    actions: ['metrics', 'alerting'],
  },
  'slow-query': {
    id: 'slow-query',
    name: 'Slow query',
    era: 1,
    severity: 3,
    escalatesTo: 2,
    duration: 300,
    cause: 'A new feature shipped a query with no index. Each read scans the whole table.',
    prevention: 'Query analysis finds the missing index. A Cache keeps most reads off the table.',
    actions: ['query-analysis', 'caching'],
  },
  'bad-deploy': {
    id: 'bad-deploy',
    name: 'Bad deploy',
    era: 1,
    severity: 3,
    escalatesTo: 2,
    duration: 120,
    cause: 'A deploy shipped a bug. Requests to the App Servers fail.',
    prevention: 'A pipeline that can roll back, automated tests, and smaller deploys.',
    actions: ['ci', 'testing-culture'],
  },
  'bot-surge': {
    id: 'bot-surge',
    name: 'Bot surge',
    era: 2,
    severity: 3,
    escalatesTo: 2,
    duration: 90,
    cause: 'Scrapers found the site. Half of all traffic was bots.',
    prevention: 'A WAF in front of the App Servers.',
    actions: ['waf'],
  },
  stuffing: {
    id: 'stuffing',
    name: 'Credential stuffing',
    era: 2,
    severity: 2,
    escalatesTo: 1,
    duration: 60,
    cause: 'Bots tried leaked passwords: 20× the logins, each one a bcrypt hash.',
    prevention: 'A WAF blocks most of them. An Auth Provider hashes the rest.',
    actions: ['waf', 'auth-provider'],
  },
  stampede: {
    id: 'stampede',
    name: 'Cache stampede',
    era: 2,
    severity: 2,
    escalatesTo: 1,
    duration: 90,
    cause: 'The Cache restarted empty. Every miss went to the database at once.',
    prevention: 'Stampede protection coalesces misses. Cache warming refills it before traffic.',
    actions: ['stampede-protection', 'cache-warming'],
  },
  poison: {
    id: 'poison',
    name: 'Poison message',
    era: 2,
    severity: 3,
    escalatesTo: 2,
    duration: 120,
    cause: 'A task that always fails kept coming back. Workers retried it instead of the queue.',
    prevention: 'A dead-letter queue moves a failing task aside.',
    actions: [],
  },
  ddos: {
    id: 'ddos',
    name: 'DDoS',
    era: 2,
    severity: 2,
    escalatesTo: 1,
    duration: 60,
    cause: 'An attacker flooded the edge with 50 times normal traffic.',
    prevention: 'A WAF, with Under attack mode when it starts. A CDN takes the cacheable part.',
    actions: ['waf', 'cdn'],
  },
  certificate: {
    id: 'certificate',
    name: 'Certificate expired',
    era: 2,
    severity: 2,
    escalatesTo: 1,
    duration: 60,
    cause: 'The TLS certificate expired. Every browser refused the site.',
    prevention: 'Certificate automation renews it before it expires.',
    actions: ['cert-automation'],
  },
  'psp-outage': {
    id: 'psp-outage',
    name: 'Payment provider outage',
    era: 3,
    severity: 2,
    escalatesTo: 1,
    duration: 60,
    cause: 'The Payment Provider went down. Every checkout failed.',
    prevention: 'Nothing on your side: it is their outage. Checkouts come back when it ends.',
    actions: [],
  },
  zone: {
    id: 'zone',
    name: 'Zone outage',
    era: 3,
    severity: 2,
    escalatesTo: 1,
    duration: 120,
    cause: 'A whole zone failed. Every Node in it went grey.',
    prevention: 'Copies in a second zone with spare capacity, and a Database standby.',
    actions: ['multi-az'],
  },
  'disk-full': {
    id: 'disk-full',
    name: 'Disk full',
    era: 2,
    severity: 2,
    escalatesTo: 1,
    duration: 60,
    cause: 'Logs and WAL filled the Database disk. Every write failed.',
    prevention: 'Alerts on disk catch it early. Expand the volume to end it.',
    actions: ['alerting'],
  },
  'repl-lag': {
    id: 'repl-lag',
    name: 'Replication lag',
    era: 3,
    severity: 3,
    escalatesTo: 2,
    duration: 60,
    cause:
      'A burst of writes left the replicas seconds behind. Reads after a write came back stale.',
    prevention: 'Read-your-writes routing sends those reads to the primary.',
    actions: ['ryw-routing'],
  },
  'gc-storm': {
    id: 'gc-storm',
    name: 'GC pause storm',
    era: 3,
    severity: 3,
    escalatesTo: 2,
    duration: 60,
    cause: 'The heap passed 90%. The collector paused one request in ten.',
    prevention: 'More memory, ZGC, or GOGC tuning. Restart to end it.',
    actions: ['zgc', 'gogc-tuning'],
  },
  'retry-storm': {
    id: 'retry-storm',
    name: 'Retry storm',
    era: 3,
    severity: 2,
    escalatesTo: 1,
    duration: 300,
    cause:
      'The Database slowed for 20 s. Callers retried at once, and the retries kept it overloaded.',
    prevention: 'Backoff with jitter, circuit breakers, and load shedding.',
    actions: ['backoff-jitter', 'circuit-breakers', 'load-shedding'],
  },
  'double-charge': {
    id: 'double-charge',
    name: 'Double charge',
    era: 3,
    severity: 2,
    escalatesTo: 1,
    duration: 60,
    cause:
      'The Payment Provider slowed. Charges timed out and were retried, and some charged twice.',
    prevention: 'Idempotency keys. Stop retries on the charge Link to end it.',
    actions: ['idempotency-keys'],
  },
  'report-db': {
    id: 'report-db',
    name: 'Report kills the database',
    era: 4,
    severity: 2,
    escalatesTo: 1,
    duration: 90,
    cause: 'A quarter-end report scanned every table on the primary. Every kind slowed.',
    prevention: 'A Data Warehouse takes the scans off the primary.',
    actions: ['data-warehouse'],
  },
  'gpu-shortage': {
    id: 'gpu-shortage',
    name: 'GPU shortage',
    era: 4,
    severity: 3,
    escalatesTo: 2,
    duration: 120,
    cause: 'The provider reclaimed a GPU Node. No H100 capacity this month.',
    prevention: 'The LLM API takes prompts when GPUs run short.',
    actions: ['hosted-models'],
  },
  regex: {
    id: 'regex',
    name: 'Regex backtracking',
    era: 4,
    severity: 1,
    escalatesTo: 1,
    duration: 60,
    cause: 'A new WAF rule backtracked on long inputs. Every WAF ran at 100% CPU.',
    prevention: 'Roll rules out to a canary first. Disable the rule to end it.',
    actions: [],
  },
  region: {
    id: 'region',
    name: 'Region outage',
    era: 5,
    severity: 1,
    escalatesTo: 1,
    duration: 180,
    cause: 'A whole region failed. Its board went grey.',
    prevention: 'A second region, GeoDNS to send users there, and data that lives in both.',
    actions: ['multi-region', 'geo-dns'],
  },
  partition: {
    id: 'partition',
    name: 'Network partition',
    era: 5,
    severity: 1,
    escalatesTo: 1,
    duration: 45,
    cause: 'Regions lost contact. Calls between them timed out, and leader-based writes diverged.',
    prevention: 'A consensus store keeps one leader. Fence the old leader to end it.',
    actions: ['consensus'],
  },
  'hot-key': {
    id: 'hot-key',
    name: 'Hot key',
    era: 5,
    severity: 2,
    escalatesTo: 1,
    duration: 90,
    cause: 'A celebrity posted. 30% of reads asked for one key, and its shard saturated.',
    prevention: 'Split hot keys across shards and cache them in the App Servers.',
    actions: ['hybrid-fanout'],
  },
  bgp: {
    id: 'bgp',
    name: 'BGP misconfiguration',
    era: 5,
    severity: 1,
    escalatesTo: 1,
    duration: 120,
    cause: 'A routing change withdrew the company from the internet. No region was reachable.',
    prevention: 'Review routing changes. Roll back to end it.',
    actions: [],
  },
  audit: {
    id: 'audit',
    name: 'Audit finding',
    era: 6,
    severity: 3,
    escalatesTo: 2,
    duration: 10,
    cause: 'A SOC 2 auditor found a gap. The DR drill no longer counts.',
    prevention: 'A Security team fixes findings before they reset anything.',
    actions: ['security-team'],
  },
  'dr-drill': {
    id: 'dr-drill',
    name: 'DR drill',
    era: 6,
    severity: 1,
    escalatesTo: 1,
    duration: 60,
    cause: 'A scripted failure of the home region, to measure recovery.',
    prevention: 'Serve every kind from another region within the hour, without losing writes.',
    actions: [],
  },
  breach: {
    id: 'breach',
    name: 'Data breach',
    era: 1,
    severity: 1,
    escalatesTo: 1,
    duration: 120,
    cause: 'A disclosed vulnerability stayed unpatched past its deadline, and someone used it.',
    prevention: 'Patch the ticket before it expires. The Team backlog shows the deadline.',
    actions: [],
  },
}

/** A quarter-end report scans this many times what a report usually does. */
export const REPORT_SURGE = 10
/** A retry storm's trigger: the Database runs at this share of its capacity for this many seconds. */
export const STORM_SLOWDOWN = 0.3
export const STORM_TRIGGER = 20
/** During a GC pause storm the heap fills by this share of RAM, and this many times as many requests pause. */
export const GC_STORM_HEAP = 0.2
export const GC_STORM = 5
/** During a replication lag incident, replicas lag this many times as far. */
export const LAG_SURGE = 10
/** A slow Payment Provider during a Double charge adds this many ms to each charge, on average. */
export const SLOW_CHARGE_MS = 1_500
/** A backtracking WAF rule leaves this share of the WAF's capacity. */
export const REGEX_CAPACITY = 0.1

/** A bot surge lifts bots to half of all traffic; a DDoS adds 50 times it; stuffing 19 times the logins. */
export const BOT_SURGE = 0.8
export const DDOS_MAGNITUDE = 50
export const STUFFING_MAGNITUDE = 19

/** A traffic spike multiplies demand by a roll in this range. */
export const SPIKE_MAGNITUDE = [3, 10] as const
/** An escalation lengthens what is left of an incident, and a spike grows, by this factor. */
export const ESCALATION = 1.5
/** A possible incident weighs at least this much, so a strong Design still meets every kind. */
export const MIN_WEAKNESS = 0.2

/** An unindexed read costs this many CPU ms per table row (the GDD's table_rows × 0.0001). */
export const UNINDEXED_MS_PER_ROW = 0.0001
/** Table rows per user, for the size of the scanned table. */
export const ROWS_PER_USER = 100

/** An incident whose action item is still open is this many times as likely. */
export const OPEN_ACTION_WEIGHT = 2
/** Share of its RAM a leaking server gains per second. */
export const LEAK_RATE = 1 / 40

export const ALERT_RULES = {
  errors: { threshold: 0.01, seconds: 30 },
  latency: { threshold: 4, seconds: 30 },
  saturation: { threshold: 0.9, seconds: 60 },
} as const
/** Thresholds the player can set: error share, p99 as a multiple of the Apdex target, and Node load. */
export const ALERT_THRESHOLDS = {
  errors: [0.005, 0.01, 0.05],
  latency: [2, 4, 8],
  saturation: [0.8, 0.9, 0.95],
} as const
/** False alarms in one calendar day before the player ignores a rule (12 "Alerting"). */
export const ALERT_FATIGUE = 5

/**
 * Once the error budget counts, incidents run on the calendar (11 "Duration"): an
 * unmitigated incident lasts at most this many sim seconds for its starting severity.
 * Earlier Eras and Sandboxes keep the longer playtest durations above.
 */
export const CALENDAR_DURATION: Readonly<Record<1 | 2 | 3, number>> = { 1: 60, 2: 20, 3: 5 }

/** The error budget counts from Series A (11 "SLOs and error budgets"). */
export const SLO_FROM_STAGE = 3
/** The SLO window: one calendar week, in hours. */
export const SLO_WINDOW_HOURS = 168
/** Velocity with more than half the budget left, between, and spent. */
export const ERROR_BUDGET_FACTORS = { ahead: 1.1, normal: 1, spent: 0.5 } as const

/** The DR drill fails the home region for this long; it passes when the Design recovers sooner (10 "Era 6"). */
export const DRILL_SECONDS = 60
/** The IPO checklist: recovery under one calendar hour, data loss under five calendar minutes. */
export const DRILL_RTO = 60
export const DRILL_RPO = 5
/** Recovered: the error share is back under this. */
export const DRILL_RECOVERED = 0.01
