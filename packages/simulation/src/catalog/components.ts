/* The Components a player can place, and how Analytics samples. */

import { REQUEST_KINDS, type Kind } from './kinds.ts'
import type { ResearchId } from './research.ts'

export const COMPONENT_IDS = [
  'users',
  'payments',
  'analytics',
  'server',
  'database',
  'dns',
  'lb',
  'pooler',
  'cache',
  'replica',
  'auth',
  'search',
  'storage',
  'queue',
  'worker',
  'cdn',
  'waf',
  'psp',
  'autoscaler',
  'cluster',
  'warehouse',
  'gpu',
  'llm',
  'msgp',
  'wide',
  'dsql',
] as const
export type ComponentId = (typeof COMPONENT_IDS)[number]

export type BuildGroup = 'edge' | 'compute' | 'data' | 'ops'

export const BUILD_GROUPS: ReadonlyArray<Readonly<{ key: BuildGroup; label: string }>> = [
  { key: 'edge', label: 'Edge' },
  { key: 'compute', label: 'Compute' },
  { key: 'data', label: 'Data' },
  { key: 'ops', label: 'Ops' },
]

export type ComponentDef = Readonly<{
  id: ComponentId
  /** Short mark for chips on the board and in the dock. */
  code: string
  name: string
  /** Real-world product the Component stands for. */
  product: string
  group: BuildGroup
  blurb: string
  /** Cash to place the first copy. Each further copy costs 25% more. */
  cost: number
  /** Dollars per second for Components without an instance type. */
  burn: number
  /** Has an instance type (size and family). */
  sized: boolean
  /**
   * Largest size for Components without an instance type, from size 1. Each
   * step doubles capacity and Burn. 1 means it has one size.
   */
  steps: number
  /** Milliseconds of fixed overhead per request that passes through. */
  latency: number
  /** Kinds this Node takes on an inbound link. */
  accepts: ReadonlyArray<Kind>
  /** Kinds this Node sends on its routing links. */
  sends: ReadonlyArray<Kind>
  /**
   * Kinds it takes only when no linked Node takes them as its own job: Postgres
   * searches and stores files until a Search Engine or Object Storage is linked.
   */
  fallback: ReadonlyArray<Kind>
  /** Runs the Service's Stack, and holds a slot while it waits on each call. */
  stack: boolean
  /** Its capacity can limit the Design: the Bottleneck search weighs it and Instance failure can hit it. */
  limiting: boolean
  /** A new copy starts cold and warms up. */
  coldStart: boolean
  /** Most routing links out. Users resolve to one host until DNS. */
  maxOut: number
  /** Receives a copy of its parent's traffic instead of a share of it. */
  tap: boolean
  /** Takes no traffic: App Servers and Workers link into it to come under its control. */
  control: boolean
  /** Research that unlocks it, or null for the starter kit. */
  unlock: ResearchId | null
  /** The player cannot place or sell it. */
  fixed: boolean
}>

const def = (
  entry: Omit<
    ComponentDef,
    | 'maxOut'
    | 'tap'
    | 'control'
    | 'unlock'
    | 'fixed'
    | 'sized'
    | 'burn'
    | 'steps'
    | 'sends'
    | 'fallback'
    | 'stack'
    | 'limiting'
    | 'coldStart'
  > &
    Partial<ComponentDef>,
): ComponentDef => ({
  sends: [],
  fallback: [],
  stack: false,
  limiting: false,
  coldStart: false,
  maxOut: 99,
  tap: false,
  control: false,
  unlock: null,
  fixed: false,
  sized: false,
  steps: 1,
  burn: 0,
  ...entry,
})

export const COMPONENTS: Record<ComponentId, ComponentDef> = {
  users: def({
    id: 'users',
    code: 'www',
    name: 'Users',
    product: 'The internet',
    group: 'edge',
    blurb: 'Where traffic starts. A domain resolves to one host, so Users take one link.',
    cost: 0,
    latency: 30,
    accepts: [],
    maxOut: 1,
    fixed: true,
    sends: REQUEST_KINDS,
  }),
  payments: def({
    id: 'payments',
    code: 'pay',
    name: 'Payments',
    product: 'Invoices',
    group: 'ops',
    blurb: 'Revenue waits here. The drawer holds about a minute of it.',
    cost: 0,
    latency: 0,
    accepts: [],
    maxOut: 0,
    fixed: true,
    steps: 6,
  }),
  analytics: def({
    id: 'analytics',
    code: 'otel',
    name: 'Analytics',
    product: 'OpenTelemetry',
    group: 'ops',
    blurb: 'Link any Node into it. It samples that traffic and turns it into Insight.',
    cost: 40,
    burn: 0.05,
    latency: 0,
    accepts: [],
    maxOut: 0,
    tap: true,
    steps: 8,
  }),
  server: def({
    id: 'server',
    code: 'app',
    name: 'App Server',
    product: 'VM',
    group: 'compute',
    blurb: 'Runs your code. Answers requests and sends queries to the database.',
    cost: 60,
    sized: true,
    latency: 2,
    accepts: REQUEST_KINDS,
    sends: [
      'q-read',
      'q-write',
      'auth',
      'q-search',
      'blob-put',
      'task',
      'blob-get',
      'q-tx',
      'charge',
      'q-scan',
      'infer',
      'notify',
      'callout',
      'k-write',
    ],
    stack: true,
    limiting: true,
    coldStart: true,
  }),
  database: def({
    id: 'database',
    code: 'sql',
    name: 'Database',
    product: 'PostgreSQL',
    group: 'data',
    blurb: 'The source of truth. One process per connection, 100 connections at most.',
    cost: 90,
    sized: true,
    latency: 2,
    accepts: ['q-read', 'q-write', 'q-search', 'blob-put', 'q-tx', 'blob-get', 'q-scan', 'k-write'],
    fallback: ['q-search', 'blob-put', 'blob-get', 'q-scan', 'k-write'],
    maxOut: 0,
    limiting: true,
    coldStart: true,
  }),
  dns: def({
    id: 'dns',
    code: 'dns',
    name: 'DNS',
    product: 'Route 53',
    group: 'edge',
    blurb: 'Round robin across up to 8 hosts. No health checks: a dead host keeps its share.',
    cost: 20,
    burn: 0.01,
    latency: 0,
    accepts: REQUEST_KINDS,
    maxOut: 8,
    unlock: 'dns-rr',
    sends: REQUEST_KINDS,
  }),
  lb: def({
    id: 'lb',
    code: 'lb',
    name: 'Load Balancer',
    product: 'NGINX',
    group: 'edge',
    blurb: 'Splits traffic across App Servers and drops a dead host at its next health check.',
    cost: 120,
    burn: 0.08,
    latency: 1,
    accepts: REQUEST_KINDS,
    unlock: 'load-balancing',
    steps: 6,
    sends: REQUEST_KINDS,
    limiting: true,
  }),
  pooler: def({
    id: 'pooler',
    code: 'pool',
    name: 'Connection Pooler',
    product: 'PgBouncer',
    group: 'data',
    blurb: 'Many app connections share 20 database connections.',
    cost: 80,
    burn: 0.03,
    latency: 0.3,
    accepts: ['q-read', 'q-write', 'q-search', 'blob-put', 'q-tx', 'blob-get', 'q-scan', 'k-write'],
    fallback: ['q-search', 'blob-put', 'blob-get', 'q-scan', 'k-write'],
    unlock: 'pooling',
    steps: 4,
    sends: ['q-read', 'q-write', 'q-search', 'blob-put', 'q-tx', 'blob-get', 'q-scan', 'k-write'],
    limiting: true,
  }),
  cache: def({
    id: 'cache',
    code: 'kv',
    name: 'Cache',
    product: 'Redis',
    group: 'data',
    blurb:
      'Answers read queries from memory while the hot data fits. Writes pass through and invalidate.',
    cost: 150,
    burn: 0.06,
    latency: 0.5,
    accepts: ['q-read', 'q-write', 'q-search', 'blob-put', 'q-tx', 'blob-get', 'q-scan', 'k-write'],
    fallback: ['q-search', 'blob-put', 'blob-get', 'q-scan'],
    unlock: 'caching',
    steps: 8,
    sends: ['q-read', 'q-write', 'q-search', 'blob-put', 'q-tx', 'blob-get', 'q-scan', 'k-write'],
    limiting: true,
    coldStart: true,
  }),
  replica: def({
    id: 'replica',
    code: 'rep',
    name: 'Read Replica',
    product: 'PostgreSQL replica',
    group: 'data',
    blurb: 'Answers reads. Lags behind writes, so some API reads come back stale.',
    cost: 160,
    sized: true,
    latency: 2,
    accepts: ['q-read'],
    maxOut: 0,
    unlock: 'replication',
    limiting: true,
    coldStart: true,
  }),
  auth: def({
    id: 'auth',
    code: 'idp',
    name: 'Auth Provider',
    product: 'Auth0',
    group: 'data',
    blurb: 'Hashes passwords for you. Charged per user.',
    cost: 0,
    latency: 120,
    accepts: ['auth'],
    maxOut: 0,
    unlock: 'auth-provider',
  }),
  search: def({
    id: 'search',
    code: 'fts',
    name: 'Search Engine',
    product: 'Elasticsearch',
    group: 'data',
    blurb: 'Answers search queries. 400 per second per size step.',
    cost: 300,
    burn: 0.25,
    latency: 15,
    accepts: ['q-search'],
    maxOut: 0,
    unlock: 'full-text-search',
    steps: 8,
    limiting: true,
  }),
  storage: def({
    id: 'storage',
    code: 's3',
    name: 'Object Storage',
    product: 'Amazon S3',
    group: 'data',
    blurb: 'Holds uploaded files. No limit. Pay for what it stores.',
    cost: 280,
    burn: 0.01,
    latency: 40,
    accepts: ['blob-put', 'blob-get'],
    maxOut: 0,
    unlock: 'object-storage',
  }),
  queue: def({
    id: 'queue',
    code: 'mq',
    name: 'Queue',
    product: 'RabbitMQ',
    group: 'compute',
    blurb: 'Takes work now so Workers can do it later. Users wait only for the enqueue.',
    cost: 360,
    burn: 0.1,
    latency: 2,
    accepts: ['task'],
    sends: ['task'],
    unlock: 'queues',
    steps: 6,
    limiting: true,
  }),
  worker: def({
    id: 'worker',
    code: 'wrk',
    name: 'Worker',
    product: 'Sidekiq',
    group: 'compute',
    blurb:
      'Runs your code on tasks from a Queue. Users never wait for it. Link it to the data an export reads.',
    cost: 60,
    sized: true,
    latency: 0,
    accepts: ['task'],
    sends: ['q-read', 'q-write', 'notify', 'callout'],
    unlock: 'background-jobs',
    stack: true,
    limiting: true,
    coldStart: true,
  }),
  cdn: def({
    id: 'cdn',
    code: 'cdn',
    name: 'CDN',
    product: 'Cloudflare',
    group: 'edge',
    blurb: 'Answers cacheable pages near the user. Egress from the edge costs less.',
    cost: 220,
    burn: 0.05,
    latency: 8,
    accepts: REQUEST_KINDS,
    sends: REQUEST_KINDS,
    unlock: 'cdn',
  }),
  waf: def({
    id: 'waf',
    code: 'waf',
    name: 'WAF',
    product: 'ModSecurity',
    group: 'edge',
    blurb: 'Blocks bots before they reach the app, and some real users with them.',
    cost: 260,
    burn: 0.1,
    latency: 2,
    accepts: REQUEST_KINDS,
    sends: REQUEST_KINDS,
    unlock: 'waf',
    steps: 6,
    limiting: true,
  }),
  psp: def({
    id: 'psp',
    code: 'psp',
    name: 'Payment Provider',
    product: 'Stripe',
    group: 'data',
    blurb: 'Charges cards for checkouts. 2.9% plus $0.30 per checkout.',
    cost: 0,
    latency: 400,
    accepts: ['charge'],
    maxOut: 0,
    unlock: 'checkout',
    steps: 8,
    limiting: true,
  }),
  autoscaler: def({
    id: 'autoscaler',
    code: 'hpa',
    name: 'Autoscaler',
    product: 'Auto Scaling group',
    group: 'ops',
    blurb:
      'Link App Servers or Workers into it. It adds copies when they run hot and removes them when idle.',
    cost: 200,
    latency: 0,
    accepts: [],
    maxOut: 0,
    control: true,
    unlock: 'autoscaling',
  }),
  cluster: def({
    id: 'cluster',
    code: 'k8s',
    name: 'Kubernetes Cluster',
    product: 'Kubernetes',
    group: 'compute',
    blurb:
      'Link App Servers or Workers into it. They pack onto shared nodes: 15% less Burn, copies in 30 s.',
    cost: 500,
    burn: 0.1,
    latency: 0,
    accepts: [],
    maxOut: 0,
    control: true,
    unlock: 'containers',
  }),
  warehouse: def({
    id: 'warehouse',
    code: 'olap',
    name: 'Data Warehouse',
    product: 'BigQuery',
    group: 'data',
    blurb: 'Answers report scans in columns. 1.5 s each, no limit, paid per scan.',
    cost: 800,
    burn: 0.05,
    latency: 1_500,
    accepts: ['q-scan'],
    maxOut: 0,
    unlock: 'data-warehouse',
  }),
  gpu: def({
    id: 'gpu',
    code: 'gpu',
    name: 'GPU Node',
    product: 'vLLM on NVIDIA',
    group: 'compute',
    blurb: 'Serves AI prompts in tokens per second. Each size step doubles the GPUs.',
    cost: 900,
    latency: 300,
    accepts: ['infer'],
    maxOut: 0,
    unlock: 'model-serving',
    steps: 8,
    limiting: true,
    coldStart: true,
  }),
  llm: def({
    id: 'llm',
    code: 'llm',
    name: 'LLM API',
    product: 'A hosted model',
    group: 'data',
    blurb: 'Serves AI prompts with no GPUs. Paid per token, and rate limited.',
    cost: 0,
    latency: 600,
    accepts: ['infer'],
    maxOut: 0,
    unlock: 'hosted-models',
    steps: 8,
    limiting: true,
  }),
  msgp: def({
    id: 'msgp',
    code: 'msgp',
    name: 'Push Provider',
    product: 'Amazon SNS',
    group: 'data',
    blurb: 'Sends push notifications and email. Paid per message, 10,000 a second.',
    cost: 0,
    latency: 100,
    accepts: ['notify'],
    maxOut: 0,
    unlock: 'notifications',
    limiting: true,
  }),
  wide: def({
    id: 'wide',
    code: 'wide',
    name: 'Wide-column Store',
    product: 'Apache Cassandra',
    group: 'data',
    blurb: 'Replicates each key to N nodes. Reads ask R of them, writes wait for W.',
    cost: 1_200,
    burn: 1.2,
    latency: 3,
    accepts: ['q-read', 'q-write', 'q-tx', 'k-write'],
    maxOut: 0,
    unlock: 'leaderless',
    steps: 6,
    limiting: true,
  }),
  dsql: def({
    id: 'dsql',
    code: 'dsql',
    name: 'Distributed SQL',
    product: 'CockroachDB',
    group: 'data',
    blurb: 'SQL on Raft. Every write waits for a majority of its replicas.',
    cost: 2_500,
    burn: 1.95,
    latency: 3,
    accepts: ['q-read', 'q-write', 'q-tx'],
    maxOut: 0,
    unlock: 'consensus',
    steps: 6,
    limiting: true,
  }),
}

/** How a Load Balancer splits traffic, and the research each policy needs. */
export const LB_POLICIES = {
  weighted: { label: 'Weighted', research: null },
  'round-robin': { label: 'Round robin', research: null },
  'least-conn': { label: 'Least conn', research: 'lb-algorithms' },
  p2c: { label: 'Two choices', research: 'lb-algorithms' },
} as const
/** Power of two choices keeps no global state: its LB handles this much more traffic... */
export const P2C_CAPACITY = 1.5
/** ...at the price of this share of traffic split evenly, whatever the load. */
export const P2C_IMBALANCE = 0.1
/** Seconds between a Load Balancer's health checks. All but 10 s need Health checks. */
export const CHECK_INTERVALS = [2, 10, 30] as const
/** DNS TTLs, in seconds. */
export const DNS_TTLS = [30, 300, 3_600] as const

/** Cache engines. Redis runs one main thread; Memcached uses every core. Redis reloads its data after a restart. */
export const CACHE_ENGINES = {
  redis: { name: 'Redis', scales: false, warmAfterRestart: 0.5 },
  memcached: { name: 'Memcached', scales: true, warmAfterRestart: 0 },
} as const
/** Cache TTLs in seconds, with the share of hot reads each keeps and the share of hits it serves stale per unit of write share. */
export const CACHE_TTLS = [
  { ttl: 10, factor: 0.6, stale: 0.005 },
  { ttl: 60, factor: 0.85, stale: 0.02 },
  { ttl: 3_600, factor: 0.97, stale: 0.1 },
] as const
/** KB of hot data per user: 5,000 users is about 1 GB (16 D11). */
export const HOT_KB_PER_USER = 200
/** Operations per second one cache thread answers. */
export const CACHE_OPS = 50_000

/** A CDN's hit ratio per kind at the default TTL (05 "CDN"): 70% of pages, 75% of video. */
export const CDN_HIT: Partial<Record<Kind, number>> = { page: 0.7, media: 0.75 }
/** With Tiered caching, a CDN answers this share of video. */
export const TIERED_MEDIA_HIT = 0.92
/** CDN TTLs in seconds, and what each does to the hit ratio. Proposed: the GDD gives no numbers. */
export const CDN_TTLS = [
  { ttl: 60, factor: 0.8 },
  { ttl: 300, factor: 1 },
  { ttl: 3_600, factor: 1.2 },
] as const
/** Milliseconds a request crosses the internet to reach the origin. A CDN edge sits closer. */
export const INTERNET_MS = 30

/** WAF paranoia levels (05 "WAF"): bots blocked, real users blocked, and CPU per request. */
export const PARANOIA = [
  { level: 1, block: 0.6, falsePositive: 0.001, cpu: 1 },
  { level: 2, block: 0.8, falsePositive: 0.005, cpu: 1.5 },
  { level: 3, block: 0.92, falsePositive: 0.02, cpu: 2.5 },
  { level: 4, block: 0.98, falsePositive: 0.06, cpu: 4 },
] as const
/** "Under attack" mode challenges every request: it blocks nearly all junk and some real users, and adds latency. A challenge costs paranoia 1's CPU. */
export const UNDER_ATTACK = { block: 0.99, falsePositive: 0.01, latency: 40, cpu: 1 } as const

/** Messages per second one RabbitMQ node takes (05 "Queue"). */
export const QUEUE_RATE = 20_000
/** Milliseconds a backlog of one message adds to the enqueue: a large backlog slows the broker. Proposed. */
export const BACKLOG_MS = 0.01
/** A Queue offers its Workers its backlog over this many seconds. */
export const DRAIN_SECONDS = 10
/** While a poison message is stuck, Workers spend this share of their time on it. Proposed. */
export const POISON_SHARE = 0.9

/** Search queries per second one Search Engine answers at size 1 (05 "Stats"). */
export const SEARCH_QPS = 400
/** MB in one uploaded file (04 "Request kinds"). */
export const UPLOAD_MB = 2
/**
 * Object Storage price per GB stored per second. Like every time-billed price, a sim second bills
 * a real hour: S3 Standard is $0.023 per GB-month, about $0.000032 per GB-hour.
 */
export const STORAGE_PRICE = 0.000032

/** Egress price per GB (09 "Egress"). */
export const EGRESS_ORIGIN = 0.09
export const EGRESS_CDN = 0.02

/** With Stampede protection, a cold Cache sends at most this share of its misses on: the rest wait on one fetch. */
export const COALESCED = 0.25
/** How warm a Cache comes back from a restart with Cache warming. */
export const WARMED = 0.8

/**
 * Payment Provider fee per successful checkout (09 "Third-party fees"): Stripe's standard US card
 * price, a share of the value plus a fixed part. The checkout value is real dollars, so the cost
 * index does not scale the fixed part.
 */
export const PSP_RATE = 0.029
export const PSP_FIXED = 0.3
/** Checkouts per second the Payment Provider takes at its first usage tier; each tier doubles it. */
export const PSP_CAPACITY = 1_000

/** Zones a Node can sit in (05 "Zones and regions"). */
export const ZONES = ['a', 'b', 'c'] as const
/** A call between zones costs this much more than one inside a zone, and egress both ways. */
export const CROSS_ZONE_MS = 1
export const EGRESS_CROSS_ZONE = 0.01
/** KB one backend call moves between Nodes, for cross-zone egress. Proposed. */
export const BACKEND_KB = 4
/** Data Nodes that can keep a standby in another zone; App Servers and Workers spread copies instead. */
export const STANDBY_TYPES: ReadonlyArray<ComponentId> = [
  'database',
  'pooler',
  'cache',
  'search',
  'queue',
]
/** A Node with a standby fails over to it in this many seconds when its zone goes. */
export const FAILOVER_SECONDS = 20

/** Autoscaler (05 "Autoscaler"): seconds before a new copy serves, on VMs and in a Kubernetes Cluster. */
export const VM_REACTION = 180
export const POD_REACTION = 30
/** Seconds between two scaling actions on one Node. */
export const SCALE_COOLDOWN = 30
/** Targets, and the most copies, the player can pick. Zero copies means no max. */
export const SCALE_TARGETS = [0.4, 0.6, 0.8] as const
export const SCALE_MAXIMA = [4, 8, 16, 0] as const
/** A Node scales in when its load falls below this share of the target. */
export const SCALE_IN = 0.6
/** Kubernetes bin packing: members cost this share of their Burn (05 "Kubernetes Cluster"). */
export const POD_BURN = 0.85
/** Noisy neighbours: this share of a member's requests wait this long. Proposed. */
export const NOISY_SHARE = 0.01
export const NOISY_MS = 10

/** Data Warehouse price per scan (09 "Pricing models": per scan, BigQuery style). Proposed. */
export const SCAN_PRICE = 0.02

/** Tokens in one AI prompt and its answer. Proposed: the GDD gives none. */
export const TOKENS_PER_PROMPT = 400
/**
 * GPU types (05 "GPU Node"): dollars per second per GPU, at the real rental price per GPU-hour,
 * and tokens per second serving one model. T4 is cheap and slow; H100 is the cheapest per token,
 * and scarce. Prices: AWS g4dn.xlarge $0.526/h, the A100 80GB on-demand median $1.79/h, and the
 * H100 market median $3.33/h (October 2026). The H100 rate is SemiAnalysis's 2,056 tokens/s for a
 * 70B model at 30 tokens/s per user; the others follow memory bandwidth.
 */
export const GPU_TYPES = {
  t4: { name: 'T4', burn: 0.53, tokens: 200 },
  a100: { name: 'A100', burn: 1.8, tokens: 900 },
  h100: { name: 'H100', burn: 3.3, tokens: 2_000 },
} as const
/** Milliseconds to the first token on a GPU Node, and on the LLM API (05 "LLM API": 600 ms). */
export const GPU_FIRST_TOKEN_MS = 300
export const LLM_FIRST_TOKEN_MS = 600
/**
 * LLM API price per 1,000 tokens, × cost index. It is billed on the GPU's scale, a real hour per
 * sim second, because the two serve the same prompts: $0.69 per million tokens, inside the real
 * $0.23 to $0.88 for an open 70B model, is $2.50 per 1,000. An H100 is cheaper only while it is
 * about two-thirds busy.
 */
export const LLM_PRICE = 2.5
/** Prompts per second the LLM API takes at its first usage tier; each tier doubles it. Proposed. */
export const LLM_RATE = 100

/** A circuit breaker opens when this share of a Link's calls fail, and stays open this many seconds. */
export const BREAKER_THRESHOLD = 0.5
export const BREAKER_OPEN = 5

/** Auth Provider price, in dollars per second per user. */
export const AUTH_PRICE_PER_USER = 0.00006

export const SAMPLE_RATES = [0.01, 0.05, 0.1, 0.5, 1] as const
/** CPU overhead on tapped Nodes, per sample rate. */
export const SAMPLE_OVERHEAD = [0.001, 0.005, 0.01, 0.03, 0.05] as const
/** Storage Burn multiplier, per sample rate. */
export const SAMPLE_STORAGE = [0.1, 0.5, 1, 5, 10] as const
/** Insight the first successful request of a new kind teaches, once (16 D14). */
export const FIRST_KIND_INSIGHT = 20
/** Insight per sampled request. Failed and slow requests teach twice as much. */
export const INSIGHT_YIELD = 0.5
/** Samples per second Analytics keeps at size 1. Each size step doubles it. */
export const ANALYTICS_CAPACITY = 4

/** Push Provider: messages per second, and the price of one × cost index (05 "Push and Email Provider"): Amazon SES's $0.10 per 1,000. */
export const MSGP_RATE = 10_000
export const MSGP_PRICE = 0.0001

/**
 * Wide-column Store (07 "Wide-column Store"): replica operations per second at size 1 (three
 * nodes at 10,000 each). A write costs N of them, a read R. The replication settings it offers.
 */
export const WIDE_OPS = 30_000
export const QUORUM_N = [1, 2, 3, 4, 5] as const
/** Share of a weak-quorum store's reads that miss the latest write, per unit of write share. Proposed. */
export const WIDE_STALE = 0.5
/** Overlap is not linearizability: checkouts on a quorum store still see these (07). Proposed. */
export const WIDE_TX_STALE = 0.02
export const WIDE_TX_DUPLICATE = 0.01

/** Distributed SQL: transactions per second at size 1 (three nodes at 2,000), and what a read costs of one. */
export const DSQL_TX = 6_000
export const DSQL_READ_COST = 0.25
/** A spread store replicates to at most this many regions. */
export const SPREAD_REGIONS = 3

/** Backups (07 "Backups"): RPO in calendar minutes, and Burn on top of the Database's. Costs proposed. */
export const BACKUPS = {
  none: { name: 'None', rpo: Number.POSITIVE_INFINITY, burn: 0 },
  nightly: { name: 'Nightly', rpo: 1_440, burn: 0.05 },
  pitr: { name: 'PITR', rpo: 2, burn: 0.15 },
} as const

/** During a hot key, this share of reads asks for one key, which lives on one shard (07 "Fan-out"). */
export const HOT_KEY_SHARE = 0.3
