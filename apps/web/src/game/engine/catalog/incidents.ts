/* Incidents, postmortems and the alert rules. */

export const INCIDENT_IDS = ['spike', 'instance', 'connections', 'loop', 'leak'] as const
export type IncidentId = (typeof INCIDENT_IDS)[number]

export type IncidentDef = Readonly<{
  id: IncidentId
  name: string
  severity: 2 | 3
  /** Sim seconds before it ends on its own. */
  duration: number
  /** What happened, for the postmortem. */
  cause: string
  /** What would prevent it, for the postmortem. */
  prevention: string
}>

export const INCIDENTS: Record<IncidentId, IncidentDef> = {
  spike: {
    id: 'spike',
    name: 'Traffic spike',
    severity: 3,
    duration: 30,
    cause: 'A big news site linked to you. Demand tripled.',
    prevention: 'Spare capacity, a cache, more App Servers.',
  },
  instance: {
    id: 'instance',
    name: 'Instance failure',
    severity: 3,
    duration: 60,
    cause: 'The host under a VM died.',
    prevention: 'A second copy behind a Load Balancer, which skips dead hosts.',
  },
  connections: {
    id: 'connections',
    name: 'Connection exhaustion',
    severity: 2,
    duration: 40,
    cause: 'A deploy doubled every connection pool. Postgres refused the excess.',
    prevention: 'A Connection Pooler, or smaller pools.',
  },
  loop: {
    id: 'loop',
    name: 'Event loop block',
    severity: 3,
    duration: 35,
    cause: 'Password hashing cost went from 10 to 12 rounds: 4× CPU per login.',
    prevention: 'The libuv thread pool, an Auth Provider, or a runtime without one event loop.',
  },
  leak: {
    id: 'leak',
    name: 'Memory leak',
    severity: 3,
    duration: 60,
    cause: 'A persistent process leaked memory until the kernel killed it.',
    prevention: 'Restart the service, or run PHP: it frees everything after each request.',
  },
}

/** Insight for a postmortem, by severity. */
export const POSTMORTEM_INSIGHT: Record<2 | 3, number> = { 2: 40, 3: 20 }
/** Share of its RAM a leaking server gains per second. */
export const LEAK_RATE = 1 / 40

export const ALERT_RULES = {
  errors: { threshold: 0.01, seconds: 30 },
  latency: { seconds: 30 },
  saturation: { threshold: 0.9, seconds: 60 },
} as const
