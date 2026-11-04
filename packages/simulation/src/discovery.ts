import type { ComponentId, IncidentId, ResearchId } from './catalog.ts'
import type { StepEvent } from './events.ts'
import type { Game } from './state.ts'

/* ==========================================================================
   Glossary discovery (15 "Glossary"): the entries a Company has met. The
   panel shows every entry; met ones are marked. Pure: the browser calls it
   per tick in a Company and keeps the ids in the Founder record.
   ========================================================================== */

const BY_COMPONENT: Partial<Record<ComponentId, ReadonlyArray<string>>> = {
  queue: ['at-least-once-delivery', 'backpressure', 'dead-letter-queue', 'transactional-outbox'],
  autoscaler: ['autoscaling', 'cold-start', 'diurnal-traffic', 'vertical-and-horizontal-scaling'],
  auth: ['bcrypt'],
  cache: ['cache-hit-rate', 'cache-aside', 'hot-key', 'write-through-cache'],
  cdn: ['cache-hit-rate', 'cdn-content-delivery-network', 'egress'],
  warehouse: ['cdc-change-data-capture', 'oltp-and-olap'],
  cluster: ['cold-start', 'container-orchestration'],
  pooler: ['connection-pooling'],
  wide: [
    'consistent-hashing',
    'eventual-consistency',
    'hedged-request',
    'hot-key',
    'leaderless-replication',
    'quorum',
    'tail-at-scale',
  ],
  dns: ['dns-round-robin', 'health-check', 'vertical-and-horizontal-scaling'],
  replica: [
    'eventual-consistency',
    'read-replica',
    'read-your-writes-consistency',
    'replication-lag',
  ],
  lb: ['health-check', 'load-balancer', 'vertical-and-horizontal-scaling'],
  psp: ['idempotency'],
  search: ['inverted-index'],
  gpu: ['model-inference'],
  llm: ['model-inference', 'rate-limiting'],
  storage: ['object-storage'],
  analytics: ['observability'],
  server: ['process-per-request'],
  dsql: ['quorum', 'raft', 'synchronous-replication'],
  waf: ['rate-limiting', 'waf-web-application-firewall'],
}

/** The entries each Research item teaches; the Research detail links to them. */
export const BY_RESEARCH: Partial<Record<ResearchId, ReadonlyArray<string>>> = {
  anycast: ['anycast', 'bgp-border-gateway-protocol'],
  'lang-node': ['async-io', 'blast-radius', 'event-loop'],
  'lang-csharp': ['async-io', 'jit-warmup'],
  'lang-rust': ['async-io'],
  'lang-zig': ['thread-pool', 'blast-radius'],
  'lang-haskell': ['green-threads', 'gc-pause'],
  'idempotency-keys': ['at-least-once-delivery', 'idempotency'],
  autoscaling: ['autoscaling', 'cold-start', 'diurnal-traffic', 'vertical-and-horizontal-scaling'],
  'multi-az': ['availability-zone', 'blast-radius', 'egress'],
  queues: ['backpressure', 'transactional-outbox'],
  'auth-provider': ['bcrypt'],
  'libuv-pool': ['bcrypt', 'event-loop', 'thread-pool'],
  ci: ['blue-green-deployment', 'continuous-delivery', 'dora-metrics', 'feature-flag'],
  'circuit-breakers': ['bulkhead', 'circuit-breaker', 'metastable-failure'],
  opcache: ['bytecode-cache'],
  caching: ['cache-hit-rate', 'cache-aside', 'write-through-cache'],
  'stampede-protection': ['cache-stampede', 'thundering-herd'],
  'cache-warming': ['cache-stampede', 'cache-warming'],
  'testing-culture': ['canary-deployment', 'dora-metrics', 'feature-flag'],
  'data-warehouse': ['cdc-change-data-capture', 'oltp-and-olap'],
  cdn: ['cdn-content-delivery-network', 'egress'],
  'tiered-caching': ['cdn-content-delivery-network', 'tiered-caching'],
  'code-review': ['code-review', 'dora-metrics'],
  'lang-java': ['cold-start', 'gc-pause', 'jit-warmup', 'thread-pool'],
  gzip: ['compression', 'egress'],
  pooling: ['connection-pooling'],
  leaderless: ['consistent-hashing', 'eventual-consistency', 'leaderless-replication'],
  sharding: ['consistent-hashing', 'hot-key', 'sharding'],
  containers: ['container-orchestration'],
  'gdpr-residency': ['data-residency'],
  'dependency-scanning': ['dependency-scanning'],
  tracing: ['distributed-tracing', 'red-method'],
  'trace-search': ['distributed-tracing'],
  notebooks: ['observability'],
  metrics: [
    'annotation',
    'diurnal-traffic',
    'downsampling',
    'four-golden-signals',
    'observability',
  ],
  'dns-rr': ['dns-round-robin'],
  'encryption-at-rest': ['encryption-at-rest'],
  'error-budgets': ['error-budget', 'slo-sla-sli'],
  'slo-dashboards': ['burn-rate', 'error-budget', 'slo-sla-sli'],
  'node-cluster': ['event-loop'],
  replication: ['eventual-consistency', 'read-replica', 'replication-lag'],
  'ryw-routing': ['eventual-consistency', 'read-replica', 'read-your-writes-consistency'],
  'multi-region': ['fallacies-of-distributed-computing'],
  timeouts: ['fallacies-of-distributed-computing', 'retry-with-backoff-and-jitter', 'timeout'],
  'hybrid-fanout': ['fan-out', 'fan-out-on-write', 'hot-key'],
  'eager-loading': ['fan-out', 'n1-query'],
  'lang-go': ['gc-pause', 'green-threads'],
  'gogc-tuning': ['gc-pause'],
  zgc: ['gc-pause'],
  'geo-dns': ['geodns'],
  'infra-as-code': ['iac-tool', 'mirror', 'drift'],
  gitops: ['gitops', 'drift', 'blast-radius'],
  'lang-python': ['gil-global-interpreter-lock', 'pre-fork-worker-model', 'process-per-request'],
  'lang-ruby': ['gil-global-interpreter-lock', 'thread-pool'],
  'lang-elixir': ['green-threads'],
  'load-balancing': ['health-check', 'load-balancer', 'vertical-and-horizontal-scaling'],
  'health-checks': ['health-check'],
  percentiles: ['hedged-request', 'percentile-p50-p95-p99', 'tail-at-scale'],
  keepalive: ['http-keep-alive'],
  http2: ['http2-and-http3'],
  http3: ['http2-and-http3'],
  'full-text-search': ['inverted-index'],
  'php-fpm': ['littles-law', 'pre-fork-worker-model', 'process-per-request', 'shared-nothing'],
  'lb-algorithms': ['load-balancer', 'power-of-two-choices'],
  'load-shedding': ['load-shedding'],
  'backoff-jitter': ['metastable-failure', 'retry-with-backoff-and-jitter'],
  'hosted-models': ['model-inference', 'rate-limiting'],
  'model-serving': ['model-inference'],
  'query-analysis': ['n1-query'],
  'fw-laravel': ['n1-query'],
  'fw-rails': ['n1-query'],
  'fw-django': ['n1-query'],
  'object-storage': ['object-storage'],
  logs: ['observability'],
  alerting: ['observability', 'percentile-p50-p95-p99'],
  'investor-relations': ['operating-margin'],
  'guidance-modeling': ['operating-margin'],
  pitr: ['point-in-time-recovery', 'rpo-and-rto'],
  'restore-drills': ['point-in-time-recovery', 'rpo-and-rto'],
  consensus: ['raft'],
  'dr-drills': ['rpo-and-rto'],
  soc2: ['soc-2'],
  'tls-everywhere': ['soc-2', 'tls-certificate'],
  'sync-replication': ['synchronous-replication'],
  'cert-automation': ['tls-certificate'],
  waf: ['waf-web-application-firewall'],
}

const BY_INCIDENT: Partial<Record<IncidentId, ReadonlyArray<string>>> = {
  poison: ['at-least-once-delivery', 'dead-letter-queue'],
  'double-charge': [
    'at-least-once-delivery',
    'idempotency',
    'retry-with-backoff-and-jitter',
    'timeout',
  ],
  zone: ['availability-zone', 'blast-radius'],
  loop: ['bcrypt', 'event-loop', 'thread-pool'],
  stuffing: ['bcrypt', 'credential-stuffing'],
  bgp: ['bgp-border-gateway-protocol'],
  'bad-deploy': [
    'blast-radius',
    'blue-green-deployment',
    'canary-deployment',
    'code-review',
    'continuous-delivery',
    'dora-metrics',
  ],
  stampede: ['cache-stampede', 'cache-warming', 'thundering-herd'],
  regex: ['canary-deployment', 'redos-regular-expression-denial-of-service'],
  'report-db': ['cdc-change-data-capture', 'oltp-and-olap'],
  'retry-storm': [
    'circuit-breaker',
    'load-shedding',
    'metastable-failure',
    'retry-with-backoff-and-jitter',
  ],
  instance: ['cold-start', 'health-check', 'load-balancer', 'mttr', 'spot-instance'],
  connections: ['connection-pooling'],
  ddos: ['ddos-distributed-denial-of-service'],
  'repl-lag': [
    'eventual-consistency',
    'read-replica',
    'read-your-writes-consistency',
    'replication-lag',
  ],
  partition: ['fallacies-of-distributed-computing', 'network-partition', 'quorum'],
  'hot-key': ['fan-out', 'fan-out-on-write', 'hot-key', 'sharding'],
  'gc-storm': ['gc-pause'],
  region: ['geodns'],
  config: ['blast-radius', 'drift'],
  spike: ['littles-law', 'thundering-herd'],
  leak: ['memory-leak', 'shared-nothing'],
  'gpu-shortage': ['model-inference', 'spot-instance'],
  'dr-drill': ['point-in-time-recovery', 'rpo-and-rto'],
  'bot-surge': ['rate-limiting', 'waf-web-application-firewall'],
  audit: ['soc-2'],
  certificate: ['tls-certificate'],
}

const ALWAYS = ['apdex', 'utilization', 'diurnal-traffic']
const BY_STATE = [
  'mttr',
  'strangler-pattern',
  'tech-debt',
  'brookss-law',
  'conways-law',
  'rule-of-40',
  'token-bucket',
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
    if (event._tag === 'CreditsExhausted') found.add('token-bucket')
  }
  if (game.services.some((service) => service.debt >= 0.25)) found.add('tech-debt')
  if (game.engineers.length >= 8) found.add('brookss-law')
  if (game.teams.length > 1) found.add('conways-law')
  if (game.quarter) found.add('rule-of-40')
  return [...found]
}
