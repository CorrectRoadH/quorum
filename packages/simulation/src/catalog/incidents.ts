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
] as const
export type IncidentId = (typeof INCIDENT_IDS)[number]

export type IncidentDef = Readonly<{
  id: IncidentId
  name: string
  /** The first Era the director can pick it in. */
  era: number
  severity: 2 | 3
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
}

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
