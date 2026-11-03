import type { ComponentId, IncidentId, ResearchId } from './catalog.ts'
import type { StepEvent } from './events.ts'
import type { Game } from './state.ts'

/* ==========================================================================
   Glossary discovery (15 "Glossary"): the entries a Company has met. The
   panel shows every entry; met ones are marked. Pure: the browser calls it
   per tick in a Company and keeps the ids in the Founder record.
   ========================================================================== */

const BY_COMPONENT: Partial<Record<ComponentId, ReadonlyArray<string>>> = {
  lb: ['vertical-and-horizontal-scaling', 'health-check'],
  pooler: ['connection-pooling'],
  cache: ['cache-aside'],
  replica: ['replication-lag', 'read-your-writes-consistency'],
  queue: ['backpressure', 'at-least-once-delivery'],
  autoscaler: ['vertical-and-horizontal-scaling'],
  waf: ['rate-limiting', 'token-bucket'],
  warehouse: ['oltp-and-olap', 'cdc-change-data-capture'],
  auth: ['bcrypt'],
  wide: ['consistent-hashing', 'quorum', 'eventual-consistency'],
  dsql: ['raft', 'quorum'],
  cdn: ['egress'],
}

const BY_RESEARCH: Partial<Record<ResearchId, ReadonlyArray<string>>> = {
  percentiles: ['percentile-p50-p95-p99', 'tail-at-scale'],
  'eager-loading': ['n1-query'],
  'query-analysis': ['n1-query'],
  'error-budgets': ['error-budget', 'slo-sla-sli'],
  'slo-dashboards': ['slo-sla-sli', 'burn-rate'],
  tracing: ['red-method'],
  'backoff-jitter': ['retry-with-backoff-and-jitter'],
  'circuit-breakers': ['circuit-breaker', 'bulkhead'],
  'load-shedding': ['load-shedding'],
  'idempotency-keys': ['idempotency', 'transactional-outbox'],
  'stampede-protection': ['cache-stampede', 'thundering-herd'],
  'health-checks': ['health-check'],
  'lb-algorithms': ['power-of-two-choices'],
  ci: ['dora-metrics'],
  'testing-culture': ['canary-deployment', 'feature-flag'],
  'multi-az': ['blast-radius'],
  pitr: ['rpo-and-rto'],
  'restore-drills': ['rpo-and-rto'],
  'gogc-tuning': ['gc-pause'],
  zgc: ['gc-pause'],
  'lang-node': ['event-loop', 'async-io'],
  'lang-python': ['gil-global-interpreter-lock'],
  'lang-go': ['green-threads'],
  'lang-elixir': ['green-threads'],
  'lang-java': ['jit-warmup'],
}

const BY_INCIDENT: Partial<Record<IncidentId, ReadonlyArray<string>>> = {
  spike: ['thundering-herd', 'littles-law'],
  instance: ['spot-instance', 'mttr'],
  connections: ['connection-pooling'],
  loop: ['event-loop'],
  leak: ['memory-leak'],
  'slow-query': ['n1-query'],
  'bad-deploy': ['blue-green-deployment', 'canary-deployment'],
  'bot-surge': ['rate-limiting'],
  stampede: ['cache-stampede'],
  zone: ['blast-radius'],
  'repl-lag': ['replication-lag'],
  'gc-storm': ['gc-pause'],
  'retry-storm': ['metastable-failure', 'retry-with-backoff-and-jitter'],
  'double-charge': ['idempotency'],
  partition: ['fallacies-of-distributed-computing', 'quorum'],
  'hot-key': ['hot-key', 'sharding'],
  'dr-drill': ['rpo-and-rto'],
}

const ALWAYS = ['apdex', 'utilization']
const BY_STATE = [
  'mttr',
  'strangler-pattern',
  'tech-debt',
  'brookss-law',
  'conways-law',
  'rule-of-40',
]

/** Every id discovery can name, for the test that keeps them glossary ids. */
export const DISCOVERABLE: ReadonlyArray<string> = [
  ...ALWAYS,
  ...BY_STATE,
  ...[BY_COMPONENT, BY_RESEARCH, BY_INCIDENT].flatMap((map) =>
    Object.values(map).flatMap((ids) => ids ?? []),
  ),
]

/** Glossary ids the Company meets in this moment: what it runs, owns, and just went through. */
export const discoverTerms = (
  game: Game,
  events: ReadonlyArray<StepEvent>,
): ReadonlyArray<string> => {
  if (game.sandbox) return []
  const found = new Set<string>(ALWAYS)
  for (const node of game.nodes) for (const id of BY_COMPONENT[node.type] ?? []) found.add(id)
  for (const id of game.researched) for (const term of BY_RESEARCH[id] ?? []) found.add(term)
  for (const event of events) {
    if (event._tag === 'IncidentStarted')
      for (const term of BY_INCIDENT[event.incident.kind] ?? []) found.add(term)
    if (event._tag === 'IncidentResolved') found.add('mttr')
    if (event._tag === 'MigrationShifted') found.add('strangler-pattern')
  }
  if (game.services.some((service) => service.debt >= 0.25)) found.add('tech-debt')
  if (game.engineers.length >= 8) found.add('brookss-law')
  if (game.teams.length > 1) found.add('conways-law')
  if (game.quarter) found.add('rule-of-40')
  return [...found]
}
