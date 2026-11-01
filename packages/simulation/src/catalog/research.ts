/* Research: what Insight buys, by track and Era. */

import { FRAMEWORKS, RUNTIMES, type FrameworkId } from './runtimes.ts'

export const RESEARCH_IDS = [
  'stripe',
  'dns-rr',
  'load-balancing',
  'health-checks',
  'auth-provider',
  'caching',
  'pooling',
  'replication',
  'eager-loading',
  'query-analysis',
  'logs',
  'metrics',
  'percentiles',
  'alerting',
  'funnels',
  'php-fpm',
  'opcache',
  'lang-ruby',
  'lang-node',
  'lang-python',
  'node-cluster',
  'libuv-pool',
  'fw-laravel',
  'fw-rails',
  'fw-express',
  'fw-django',
  'fw-symfony',
  'fw-sinatra',
  'fw-flask',
  'keepalive',
  'gzip',
  'timeouts',
  'lb-algorithms',
] as const
export type ResearchId = (typeof RESEARCH_IDS)[number]

export type ResearchTrack =
  | 'infrastructure'
  | 'data'
  | 'reliability'
  | 'observability'
  | 'performance'
  | 'runtimes'
  | 'frameworks'
  | 'product'

export const RESEARCH_TRACKS: ReadonlyArray<Readonly<{ key: ResearchTrack; label: string }>> = [
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'data', label: 'Data' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'observability', label: 'Observability' },
  { key: 'performance', label: 'Performance' },
  { key: 'runtimes', label: 'Runtimes' },
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'product', label: 'Product' },
]

export type ResearchDef = Readonly<{
  id: ResearchId
  name: string
  track: ResearchTrack
  /** Insight to research it. */
  cost: number
  /** The first Era it is offered in. */
  era: number
  requires: ReadonlyArray<ResearchId>
  blurb: string
}>

const research = (entry: ResearchDef): ResearchDef => entry

const RESEARCH_LIST: ReadonlyArray<ResearchDef> = [
  research({
    id: 'stripe',
    name: 'Stripe Billing',
    track: 'product',
    cost: 30,
    era: 0,
    requires: [],
    blurb: 'Payments collect themselves.',
  }),
  research({
    id: 'dns-rr',
    name: 'DNS round robin',
    track: 'infrastructure',
    cost: 15,
    era: 0,
    requires: [],
    blurb: 'Unlocks DNS: spread Users over up to 8 hosts.',
  }),
  research({
    id: 'load-balancing',
    name: 'Load balancing',
    track: 'infrastructure',
    cost: 25,
    era: 0,
    requires: [],
    blurb: 'Unlocks the Load Balancer: split by capacity, skip dead hosts.',
  }),
  research({
    id: 'health-checks',
    name: 'Health checks',
    track: 'infrastructure',
    cost: 90,
    era: 1,
    requires: ['load-balancing'],
    blurb: 'DNS stops sending Users to a dead host.',
  }),
  research({
    id: 'auth-provider',
    name: 'Managed identity',
    track: 'infrastructure',
    cost: 140,
    era: 1,
    requires: [],
    blurb: 'Unlocks the Auth Provider. Logins stop costing your CPU.',
  }),
  research({
    id: 'caching',
    name: 'Caching',
    track: 'data',
    cost: 80,
    era: 1,
    requires: [],
    blurb: 'Unlocks Redis. Most read queries never reach the database.',
  }),
  research({
    id: 'pooling',
    name: 'Connection pooling',
    track: 'data',
    cost: 120,
    era: 1,
    requires: [],
    blurb: 'Unlocks PgBouncer. App connections share a few database connections.',
  }),
  research({
    id: 'replication',
    name: 'Read replicas',
    track: 'data',
    cost: 220,
    era: 1,
    requires: [],
    blurb: 'Unlocks the Read Replica.',
  }),
  research({
    id: 'eager-loading',
    name: 'Eager loading',
    track: 'performance',
    cost: 100,
    era: 1,
    requires: [],
    blurb: 'Fixes N+1 queries: ORM frameworks send 1 read query, not 3.',
  }),
  research({
    id: 'query-analysis',
    name: 'Query analysis',
    track: 'data',
    cost: 40,
    era: 0,
    requires: [],
    blurb: 'EXPLAIN finds queries with no index. Add the index from the Database card.',
  }),
  research({
    id: 'logs',
    name: 'Structured logs',
    track: 'observability',
    cost: 20,
    era: 0,
    requires: [],
    blurb: 'Errors split by cause: stranded, dropped, refused, down, stale, oom.',
  }),
  research({
    id: 'metrics',
    name: 'Metrics',
    track: 'observability',
    cost: 50,
    era: 0,
    requires: [],
    blurb: 'History graphs for every Node.',
  }),
  research({
    id: 'percentiles',
    name: 'Percentiles',
    track: 'observability',
    cost: 150,
    era: 1,
    requires: ['metrics'],
    blurb: 'p50, p95 and p99 next to the mean. See how much the mean hides.',
  }),
  research({
    id: 'alerting',
    name: 'Alerting',
    track: 'observability',
    cost: 250,
    era: 1,
    requires: ['metrics'],
    blurb: 'A pager banner when errors, p99 or saturation cross a threshold.',
  }),
  research({
    id: 'funnels',
    name: 'Funnel analytics',
    track: 'product',
    cost: 150,
    era: 1,
    requires: [],
    blurb: 'See where sign-ups drop off and fix it: user growth +10%.',
  }),
  research({
    id: 'php-fpm',
    name: 'PHP-FPM',
    track: 'runtimes',
    cost: 25,
    era: 0,
    requires: [],
    blurb: 'A worker pool instead of Apache processes. You set the pool size.',
  }),
  research({
    id: 'opcache',
    name: 'OPcache',
    track: 'runtimes',
    cost: 45,
    era: 0,
    requires: ['php-fpm'],
    blurb: 'PHP stops compiling scripts on every request: 2.5× CPU speed.',
  }),
  research({
    id: 'lang-ruby',
    name: 'Ruby',
    track: 'runtimes',
    cost: 30,
    era: 0,
    requires: [],
    blurb: RUNTIMES.puma.blurb,
  }),
  research({
    id: 'lang-node',
    name: 'Node.js',
    track: 'runtimes',
    cost: 40,
    era: 0,
    requires: [],
    blurb: RUNTIMES.node.blurb,
  }),
  research({
    id: 'lang-python',
    name: 'Python',
    track: 'runtimes',
    cost: 120,
    era: 1,
    requires: [],
    blurb: RUNTIMES.gunicorn.blurb,
  }),
  research({
    id: 'node-cluster',
    name: 'Node.js cluster mode',
    track: 'runtimes',
    cost: 100,
    era: 1,
    requires: ['lang-node'],
    blurb: RUNTIMES.node_cluster.blurb,
  }),
  research({
    id: 'libuv-pool',
    name: 'libuv thread pool',
    track: 'runtimes',
    cost: 120,
    era: 1,
    requires: ['lang-node'],
    blurb: 'Password hashing moves off the event loop, so logins stop stalling other requests.',
  }),
  research({
    id: 'fw-laravel',
    name: 'Laravel',
    track: 'frameworks',
    cost: 20,
    era: 0,
    requires: [],
    blurb: FRAMEWORKS.laravel.blurb,
  }),
  research({
    id: 'fw-rails',
    name: 'Rails',
    track: 'frameworks',
    cost: 30,
    era: 0,
    requires: ['lang-ruby'],
    blurb: FRAMEWORKS.rails.blurb,
  }),
  research({
    id: 'fw-express',
    name: 'Express',
    track: 'frameworks',
    cost: 30,
    era: 0,
    requires: ['lang-node'],
    blurb: FRAMEWORKS.express.blurb,
  }),
  research({
    id: 'fw-django',
    name: 'Django',
    track: 'frameworks',
    cost: 150,
    era: 1,
    requires: ['lang-python'],
    blurb: FRAMEWORKS.django.blurb,
  }),
  research({
    id: 'fw-symfony',
    name: 'Symfony',
    track: 'frameworks',
    cost: 80,
    era: 1,
    requires: [],
    blurb: FRAMEWORKS.symfony.blurb,
  }),
  research({
    id: 'fw-sinatra',
    name: 'Sinatra',
    track: 'frameworks',
    cost: 60,
    era: 1,
    requires: ['lang-ruby'],
    blurb: FRAMEWORKS.sinatra.blurb,
  }),
  research({
    id: 'fw-flask',
    name: 'Flask',
    track: 'frameworks',
    cost: 100,
    era: 1,
    requires: ['lang-python'],
    blurb: FRAMEWORKS.flask.blurb,
  }),
  research({
    id: 'keepalive',
    name: 'Connection reuse',
    track: 'performance',
    cost: 25,
    era: 0,
    requires: [],
    blurb: 'Keep-alive: internal calls skip the TCP handshake, 1 ms each.',
  }),
  research({
    id: 'gzip',
    name: 'Compression',
    track: 'performance',
    cost: 30,
    era: 0,
    requires: [],
    blurb: 'Gzip: page and read responses 70% smaller, for 10% more CPU.',
  }),
  research({
    id: 'timeouts',
    name: 'Timeouts and retries',
    track: 'reliability',
    cost: 60,
    era: 1,
    requires: [],
    blurb: 'Set each call timeout to 1, 5 or 30 s, and retry failed calls.',
  }),
  research({
    id: 'lb-algorithms',
    name: 'Load balancing algorithms',
    track: 'infrastructure',
    cost: 120,
    era: 1,
    requires: ['load-balancing'],
    blurb: 'Least connections and power of two choices.',
  }),
]

export const RESEARCH: Record<ResearchId, ResearchDef> = Object.fromEntries(
  RESEARCH_LIST.map((entry) => [entry.id, entry]),
) as Record<ResearchId, ResearchDef>

export const researchList = RESEARCH_LIST

export const FRAMEWORK_RESEARCH: Record<FrameworkId, ResearchId | null> = {
  none: null,
  laravel: 'fw-laravel',
  rails: 'fw-rails',
  express: 'fw-express',
  django: 'fw-django',
  symfony: 'fw-symfony',
  sinatra: 'fw-sinatra',
  flask: 'fw-flask',
}
