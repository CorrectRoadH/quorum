/* ==========================================================================
   The catalog: every request kind, Component, server stack, research item and
   funding stage. Pure data. The Simulation reads it; the UI only displays it.
   Balance numbers live here and nowhere else.
   ========================================================================== */

/** What users send. */
export const REQUEST_KINDS = [
  'page',
  'read',
  'write',
  'search',
  'media',
  'job',
  'ai',
  'bot',
] as const
export type RequestKind = (typeof REQUEST_KINDS)[number]

/** What a server sends downstream once it has handled a request. */
export const BACKEND_KINDS = ['q-read', 'q-write', 'q-search', 'blob', 'task', 'infer'] as const
export type BackendKind = (typeof BACKEND_KINDS)[number]

export type Kind = RequestKind | BackendKind

export type KindInfo = Readonly<{
  label: string
  /** Dollars earned per request of this kind that reaches a terminal. */
  value: number
  /** Particle colour on the board, as a 0xRRGGBB number. */
  color: number
}>

export const KINDS: Record<Kind, KindInfo> = {
  page: { label: 'Page view', value: 0.2, color: 0x77a4f6 },
  read: { label: 'API read', value: 0.4, color: 0x4f7fe0 },
  write: { label: 'API write', value: 1, color: 0x7152b5 },
  search: { label: 'Search', value: 1.2, color: 0x008781 },
  media: { label: 'Video', value: 2, color: 0xcd7d09 },
  job: { label: 'Export job', value: 3.2, color: 0x8a5a2b },
  ai: { label: 'AI prompt', value: 8, color: 0xd0438b },
  bot: { label: 'Bot traffic', value: 0, color: 0xc72e2b },
  'q-read': { label: 'Read query', value: 0, color: 0x4f7fe0 },
  'q-write': { label: 'Write query', value: 0, color: 0x7152b5 },
  'q-search': { label: 'Index lookup', value: 0, color: 0x008781 },
  blob: { label: 'Blob fetch', value: 0, color: 0xcd7d09 },
  task: { label: 'Task', value: 0, color: 0x8a5a2b },
  infer: { label: 'Inference', value: 0, color: 0xd0438b },
}

export const ALL_REQUESTS: ReadonlyArray<Kind> = REQUEST_KINDS

/* ---------- Components ---------- */

export const COMPONENT_IDS = [
  'users',
  'payments',
  'server',
  'database',
  'analytics',
  'lb',
  'cache',
  'cdn',
  'replica',
  'waf',
  'search',
  'storage',
  'queue',
  'worker',
  'gpu',
] as const
export type ComponentId = (typeof COMPONENT_IDS)[number]

export type BuildGroup = 'edge' | 'compute' | 'data' | 'async' | 'ops'

export const BUILD_GROUPS: ReadonlyArray<Readonly<{ key: BuildGroup; label: string }>> = [
  { key: 'edge', label: 'Edge' },
  { key: 'compute', label: 'Compute' },
  { key: 'data', label: 'Data' },
  { key: 'async', label: 'Async' },
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
  /** Capital to place the first copy. Each further copy costs 25% more. */
  cost: number
  /** Dollars per second while the Node exists, at level 1. */
  burn: number
  /** Requests per second at level 1. */
  capacity: number
  /** Milliseconds added to a request that passes through, when idle. */
  latency: number
  accepts: ReadonlyArray<Kind>
  /** Share of each kind this Node answers itself. The rest passes on. */
  serves: Partial<Record<Kind, number>>
  /** Kinds this Node turns into another kind before passing them on. */
  transforms: Partial<Record<Kind, Kind>>
  /** Most outbound links. Users only resolve to one host through DNS. */
  maxOut: number
  /** Downstream latency stops counting: the user does not wait for it. */
  async: boolean
  /** Receives a copy of its parent's traffic instead of a share of it. */
  tap: boolean
  /** Research that unlocks it, or null for the starter kit. */
  unlock: ResearchId | null
  /** The player cannot place or sell it. */
  fixed: boolean
}>

const def = (
  entry: Omit<
    ComponentDef,
    'serves' | 'transforms' | 'maxOut' | 'async' | 'tap' | 'unlock' | 'fixed'
  > &
    Partial<ComponentDef>,
): ComponentDef => ({
  serves: {},
  transforms: {},
  maxOut: 99,
  async: false,
  tap: false,
  unlock: null,
  fixed: false,
  ...entry,
})

export const COMPONENTS: Record<ComponentId, ComponentDef> = {
  users: def({
    id: 'users',
    code: 'www',
    name: 'Users',
    product: 'The internet',
    group: 'edge',
    blurb: 'Where traffic starts. DNS resolves to one host, so Users take one link.',
    cost: 0,
    burn: 0,
    capacity: Number.POSITIVE_INFINITY,
    latency: 30,
    accepts: [],
    maxOut: 1,
    fixed: true,
  }),
  payments: def({
    id: 'payments',
    code: 'pay',
    name: 'Payments',
    product: 'Invoices',
    group: 'ops',
    blurb: 'Revenue piles up here. Click it to collect before the drawer is full.',
    cost: 0,
    burn: 0,
    capacity: 0,
    latency: 0,
    accepts: [],
    maxOut: 0,
    fixed: true,
  }),
  server: def({
    id: 'server',
    code: 'app',
    name: 'App Server',
    product: 'VM',
    group: 'compute',
    blurb: 'Runs your code. Answers page views and turns everything else into backend calls.',
    cost: 60,
    burn: 0.2,
    capacity: 12,
    latency: 40,
    accepts: ALL_REQUESTS,
    serves: { page: 1, bot: 1 },
    transforms: {
      read: 'q-read',
      write: 'q-write',
      search: 'q-search',
      media: 'blob',
      job: 'task',
      ai: 'infer',
    },
  }),
  database: def({
    id: 'database',
    code: 'sql',
    name: 'Database',
    product: 'PostgreSQL',
    group: 'data',
    blurb: 'The source of truth. Answers every read and write, and is the first thing to saturate.',
    cost: 90,
    burn: 0.2,
    capacity: 16,
    latency: 25,
    accepts: ['q-read', 'q-write'],
    serves: { 'q-read': 1, 'q-write': 1 },
  }),
  analytics: def({
    id: 'analytics',
    code: 'otl',
    name: 'Analytics',
    product: 'OpenTelemetry',
    group: 'ops',
    blurb: 'Link any Node into it. It samples what passes through and turns it into Insight.',
    cost: 40,
    burn: 0.18,
    capacity: 6,
    latency: 0,
    accepts: [],
    maxOut: 0,
    tap: true,
  }),
  lb: def({
    id: 'lb',
    code: 'lb',
    name: 'Load Balancer',
    product: 'NGINX',
    group: 'edge',
    blurb: 'Spreads requests across its links in proportion to what each one can take.',
    cost: 120,
    burn: 0.3,
    capacity: 90,
    latency: 4,
    accepts: ALL_REQUESTS,
    unlock: 'load-balancing',
  }),
  cache: def({
    id: 'cache',
    code: 'kv',
    name: 'Cache',
    product: 'Redis',
    group: 'data',
    blurb: 'Answers most read queries from memory. Writes go straight through to the database.',
    cost: 150,
    burn: 0.3,
    capacity: 70,
    latency: 2,
    accepts: ['q-read', 'q-write'],
    serves: { 'q-read': 0.8 },
    unlock: 'caching',
  }),
  cdn: def({
    id: 'cdn',
    code: 'cdn',
    name: 'CDN',
    product: 'Cloudflare',
    group: 'edge',
    blurb: 'Serves page views and video from the edge. Everything else continues to your origin.',
    cost: 220,
    burn: 0.36,
    capacity: 400,
    latency: 8,
    accepts: ALL_REQUESTS,
    serves: { page: 0.92, media: 0.75 },
    unlock: 'cdn',
  }),
  replica: def({
    id: 'replica',
    code: 'ro',
    name: 'Read Replica',
    product: 'PostgreSQL replica',
    group: 'data',
    blurb: 'A copy of the database that answers reads only. Writes have nowhere to go here.',
    cost: 160,
    burn: 0.3,
    capacity: 22,
    latency: 22,
    accepts: ['q-read'],
    serves: { 'q-read': 1 },
    unlock: 'replication',
  }),
  waf: def({
    id: 'waf',
    code: 'waf',
    name: 'Firewall',
    product: 'WAF + rate limit',
    group: 'edge',
    blurb: 'Drops bot traffic before it eats your servers. Humans pass through.',
    cost: 260,
    burn: 0.36,
    capacity: 600,
    latency: 3,
    accepts: ALL_REQUESTS,
    serves: { bot: 1 },
    unlock: 'firewall',
  }),
  search: def({
    id: 'search',
    code: 'idx',
    name: 'Search Index',
    product: 'Elasticsearch',
    group: 'data',
    blurb: 'Answers index lookups. Without one, search requests fail.',
    cost: 300,
    burn: 0.48,
    capacity: 30,
    latency: 30,
    accepts: ['q-search'],
    serves: { 'q-search': 1 },
    unlock: 'search',
  }),
  storage: def({
    id: 'storage',
    code: 's3',
    name: 'Object Storage',
    product: 'S3',
    group: 'data',
    blurb: 'Holds the video files. Every CDN miss lands here.',
    cost: 280,
    burn: 0.3,
    capacity: 60,
    latency: 45,
    accepts: ['blob'],
    serves: { blob: 1 },
    unlock: 'object-storage',
  }),
  queue: def({
    id: 'queue',
    code: 'mq',
    name: 'Queue',
    product: 'Kafka',
    group: 'async',
    blurb: 'Buffers tasks so users stop waiting for them. Workers drain it.',
    cost: 360,
    burn: 0.36,
    capacity: 240,
    latency: 3,
    accepts: ['task'],
    async: true,
    unlock: 'queues',
  }),
  worker: def({
    id: 'worker',
    code: 'job',
    name: 'Worker',
    product: 'Background job runner',
    group: 'async',
    blurb: 'Runs export jobs. Slow, so put a Queue in front of it.',
    cost: 240,
    burn: 0.3,
    capacity: 10,
    latency: 900,
    accepts: ['task'],
    serves: { task: 1 },
    unlock: 'queues',
  }),
  gpu: def({
    id: 'gpu',
    code: 'gpu',
    name: 'GPU Node',
    product: 'Inference server',
    group: 'compute',
    blurb: 'Runs the model behind AI prompts. Expensive to run, so size it to the traffic.',
    cost: 900,
    burn: 2.4,
    capacity: 8,
    latency: 400,
    accepts: ['infer'],
    serves: { infer: 1 },
    unlock: 'inference',
  }),
}

export const componentDef = (id: ComponentId): ComponentDef => COMPONENTS[id]

/* ---------- server stacks ---------- */

export type StackEffect = Readonly<{
  capacity: number
  latency: number
  burn: number
  /** Revenue multiplier per request kind answered behind this server. */
  value: Partial<Record<Kind, number>>
  /** Request kinds this stack cannot run at all. */
  cannot: ReadonlyArray<Kind>
}>

export const LANGUAGE_IDS = [
  'php',
  'ruby',
  'node',
  'python',
  'java',
  'go',
  'elixir',
  'rust',
] as const
export type LanguageId = (typeof LANGUAGE_IDS)[number]

export type LanguageDef = Readonly<{
  id: LanguageId
  name: string
  mark: string
  blurb: string
  effect: StackEffect
}>

const effect = (entry: Partial<StackEffect>): StackEffect => ({
  capacity: 1,
  latency: 1,
  burn: 1,
  value: {},
  cannot: [],
  ...entry,
})

export const LANGUAGES: Record<LanguageId, LanguageDef> = {
  php: {
    id: 'php',
    name: 'PHP',
    mark: 'php',
    blurb: 'What the first server came with. Cheap and it works. No AI libraries worth the name.',
    effect: effect({ cannot: ['ai'] }),
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    mark: 'rb',
    blurb: 'Slow, but you ship features fast. Writes earn 20% more.',
    effect: effect({ capacity: 0.9, value: { write: 1.2 }, cannot: ['ai'] }),
  },
  node: {
    id: 'node',
    name: 'Node.js',
    mark: 'js',
    blurb: 'An event loop that keeps many requests in flight. 1.6× throughput.',
    effect: effect({ capacity: 1.6, latency: 0.9, cannot: ['ai'] }),
  },
  python: {
    id: 'python',
    name: 'Python',
    mark: 'py',
    blurb: 'The only stack that can call the models. Required for AI prompts.',
    effect: effect({ capacity: 1.1, latency: 1.05 }),
  },
  java: {
    id: 'java',
    name: 'Java',
    mark: 'jv',
    blurb: 'The JIT warms up to 2.2× throughput. The heap costs 30% more Burn.',
    effect: effect({ capacity: 2.2, latency: 0.85, burn: 1.3, cannot: ['ai'] }),
  },
  go: {
    id: 'go',
    name: 'Go',
    mark: 'go',
    blurb: 'Goroutines and a small runtime. 2.8× throughput, 30% less latency.',
    effect: effect({ capacity: 2.8, latency: 0.7, cannot: ['ai'] }),
  },
  elixir: {
    id: 'elixir',
    name: 'Elixir',
    mark: 'ex',
    blurb: 'The BEAM shrugs off load. 2.4× throughput, and latency stays flat when busy.',
    effect: effect({ capacity: 2.4, latency: 0.6, cannot: ['ai'] }),
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    mark: 'rs',
    blurb: 'No garbage collector, no pauses. 3.6× throughput at 20% less Burn.',
    effect: effect({ capacity: 3.6, latency: 0.55, burn: 0.8, cannot: ['ai'] }),
  },
}

export const FRAMEWORK_IDS = [
  'none',
  'laravel',
  'rails',
  'express',
  'nextjs',
  'django',
  'fastapi',
  'spring',
  'gin',
  'phoenix',
  'axum',
] as const
export type FrameworkId = (typeof FRAMEWORK_IDS)[number]

export type FrameworkDef = Readonly<{
  id: FrameworkId
  name: string
  language: LanguageId | null
  blurb: string
  effect: StackEffect
}>

export const FRAMEWORKS: Record<FrameworkId, FrameworkDef> = {
  none: {
    id: 'none',
    name: 'No framework',
    language: null,
    blurb: 'Hand-rolled routing. No bonus.',
    effect: effect({}),
  },
  laravel: {
    id: 'laravel',
    name: 'Laravel',
    language: 'php',
    blurb: 'Batteries included. Writes earn 30% more.',
    effect: effect({ value: { write: 1.3 } }),
  },
  rails: {
    id: 'rails',
    name: 'Rails',
    language: 'ruby',
    blurb: 'Convention over configuration. Page views and writes earn 40% more.',
    effect: effect({ value: { page: 1.4, write: 1.4 } }),
  },
  express: {
    id: 'express',
    name: 'Express',
    language: 'node',
    blurb: 'Minimal and fast. 15% more throughput.',
    effect: effect({ capacity: 1.15 }),
  },
  nextjs: {
    id: 'nextjs',
    name: 'Next.js',
    language: 'node',
    blurb: 'Server-rendered pages convert better. Page views earn 2× more.',
    effect: effect({ value: { page: 2 } }),
  },
  django: {
    id: 'django',
    name: 'Django',
    language: 'python',
    blurb: 'The admin pays for itself. Writes and searches earn 30% more.',
    effect: effect({ value: { write: 1.3, search: 1.3 } }),
  },
  fastapi: {
    id: 'fastapi',
    name: 'FastAPI',
    language: 'python',
    blurb: 'Async Python for model serving. 25% more throughput, AI prompts earn 50% more.',
    effect: effect({ capacity: 1.25, value: { ai: 1.5 } }),
  },
  spring: {
    id: 'spring',
    name: 'Spring Boot',
    language: 'java',
    blurb: 'Enterprise customers trust it. Every request earns 15% more.',
    effect: effect({
      value: { page: 1.15, read: 1.15, write: 1.15, search: 1.15, media: 1.15, job: 1.15 },
    }),
  },
  gin: {
    id: 'gin',
    name: 'Gin',
    language: 'go',
    blurb: 'A zero-allocation router. 20% more throughput.',
    effect: effect({ capacity: 1.2 }),
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    language: 'elixir',
    blurb: 'LiveView keeps users engaged. Reads and searches earn 40% more.',
    effect: effect({ value: { read: 1.4, search: 1.4 } }),
  },
  axum: {
    id: 'axum',
    name: 'Axum',
    language: 'rust',
    blurb: 'Tokio all the way down. 25% more throughput, 20% less latency.',
    effect: effect({ capacity: 1.25, latency: 0.8 }),
  },
}

/* ---------- research ---------- */

export const RESEARCH_IDS = [
  'stripe',
  'load-balancing',
  'caching',
  'gzip',
  'pooling',
  'cdn',
  'replication',
  'http2',
  'firewall',
  'search',
  'object-storage',
  'queues',
  'warming',
  'autoscaling',
  'inference',
  'sharding',
  'edge-compute',
  'lang-ruby',
  'lang-node',
  'lang-python',
  'lang-java',
  'lang-go',
  'lang-elixir',
  'lang-rust',
  'fw-laravel',
  'fw-rails',
  'fw-express',
  'fw-nextjs',
  'fw-django',
  'fw-fastapi',
  'fw-spring',
  'fw-gin',
  'fw-phoenix',
  'fw-axum',
] as const
export type ResearchId = (typeof RESEARCH_IDS)[number]

export type ResearchTrack = 'languages' | 'frameworks' | 'infrastructure' | 'techniques'

export const RESEARCH_TRACKS: ReadonlyArray<Readonly<{ key: ResearchTrack; label: string }>> = [
  { key: 'languages', label: 'Languages' },
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'techniques', label: 'Techniques' },
]

export type ResearchDef = Readonly<{
  id: ResearchId
  name: string
  track: ResearchTrack
  /** Insight to research it. */
  cost: number
  requires: ReadonlyArray<ResearchId>
  blurb: string
  /** What it unlocks, for the card's mark: a Component figure, a language mark or a glyph. */
  figure: ComponentId | null
  mark: string
}>

const research = (entry: Omit<ResearchDef, 'figure' | 'mark'> & Partial<ResearchDef>) =>
  ({ figure: null, mark: '', ...entry }) as ResearchDef

const RESEARCH_LIST: ReadonlyArray<ResearchDef> = [
  research({
    id: 'stripe',
    name: 'Stripe Billing',
    track: 'techniques',
    cost: 30,
    requires: [],
    blurb: 'Payments collect themselves.',
    figure: 'payments',
  }),
  research({
    id: 'load-balancing',
    name: 'Load balancing',
    track: 'infrastructure',
    cost: 16,
    requires: [],
    blurb: 'Unlocks the Load Balancer, so Users can reach more than one server.',
    figure: 'lb',
  }),
  research({
    id: 'caching',
    name: 'Caching',
    track: 'infrastructure',
    cost: 60,
    requires: ['load-balancing'],
    blurb: 'Unlocks Redis. Most reads never reach the database.',
    figure: 'cache',
  }),
  research({
    id: 'gzip',
    name: 'Compression',
    track: 'techniques',
    cost: 50,
    requires: [],
    blurb: 'Gzip on every response. Servers handle page views at half the cost.',
    mark: 'gz',
  }),
  research({
    id: 'pooling',
    name: 'Connection pooling',
    track: 'techniques',
    cost: 120,
    requires: ['caching'],
    blurb: 'PgBouncer in front of the database. Databases and replicas take 50% more.',
    mark: 'pg',
  }),
  research({
    id: 'cdn',
    name: 'Content delivery',
    track: 'infrastructure',
    cost: 160,
    requires: ['caching'],
    blurb: 'Unlocks the CDN. Page views stop at the edge.',
    figure: 'cdn',
  }),
  research({
    id: 'replication',
    name: 'Replication',
    track: 'infrastructure',
    cost: 240,
    requires: ['pooling'],
    blurb: 'Unlocks Read Replicas.',
    figure: 'replica',
  }),
  research({
    id: 'http2',
    name: 'HTTP/2',
    track: 'techniques',
    cost: 280,
    requires: ['cdn'],
    blurb: 'Multiplexed connections. Every Node adds 15% less latency.',
    mark: 'h2',
  }),
  research({
    id: 'firewall',
    name: 'Firewall',
    track: 'infrastructure',
    cost: 320,
    requires: ['cdn'],
    blurb: 'Unlocks the WAF. Bots stop at the door.',
    figure: 'waf',
  }),
  research({
    id: 'search',
    name: 'Full-text search',
    track: 'infrastructure',
    cost: 440,
    requires: ['replication'],
    blurb: 'Unlocks Elasticsearch, so search requests have somewhere to go.',
    figure: 'search',
  }),
  research({
    id: 'object-storage',
    name: 'Object storage',
    track: 'infrastructure',
    cost: 600,
    requires: ['cdn'],
    blurb: 'Unlocks S3 for video files.',
    figure: 'storage',
  }),
  research({
    id: 'queues',
    name: 'Message queues',
    track: 'infrastructure',
    cost: 1200,
    requires: ['object-storage'],
    blurb: 'Unlocks Kafka and Workers for export jobs.',
    figure: 'queue',
  }),
  research({
    id: 'warming',
    name: 'Cache warming',
    track: 'techniques',
    cost: 800,
    requires: ['caching', 'http2'],
    blurb: 'Pre-fill hot keys. Cache hit rate rises from 80% to 92%.',
    mark: 'hit',
  }),
  research({
    id: 'autoscaling',
    name: 'Autoscaling',
    track: 'techniques',
    cost: 2400,
    requires: ['queues'],
    blurb: 'Servers and workers burst to 40% more throughput when they run hot.',
    mark: 'k8s',
  }),
  research({
    id: 'inference',
    name: 'Model serving',
    track: 'infrastructure',
    cost: 3200,
    requires: ['queues', 'lang-python'],
    blurb: 'Unlocks GPU Nodes for AI prompts.',
    figure: 'gpu',
  }),
  research({
    id: 'sharding',
    name: 'Sharding',
    track: 'techniques',
    cost: 4800,
    requires: ['replication', 'autoscaling'],
    blurb: 'Split the data by key. Databases take 2× more.',
    mark: 'shd',
  }),
  research({
    id: 'edge-compute',
    name: 'Edge compute',
    track: 'techniques',
    cost: 8000,
    requires: ['sharding', 'http2'],
    blurb: 'Workers at the edge. The CDN answers 30% of API reads too.',
    mark: 'edg',
  }),
  research({
    id: 'lang-ruby',
    name: 'Ruby',
    track: 'languages',
    cost: 24,
    requires: [],
    blurb: LANGUAGES.ruby.blurb,
    mark: 'rb',
  }),
  research({
    id: 'lang-node',
    name: 'Node.js',
    track: 'languages',
    cost: 50,
    requires: [],
    blurb: LANGUAGES.node.blurb,
    mark: 'js',
  }),
  research({
    id: 'lang-python',
    name: 'Python',
    track: 'languages',
    cost: 180,
    requires: ['lang-node'],
    blurb: LANGUAGES.python.blurb,
    mark: 'py',
  }),
  research({
    id: 'lang-java',
    name: 'Java',
    track: 'languages',
    cost: 400,
    requires: ['lang-node'],
    blurb: LANGUAGES.java.blurb,
    mark: 'jv',
  }),
  research({
    id: 'lang-go',
    name: 'Go',
    track: 'languages',
    cost: 1000,
    requires: ['lang-java'],
    blurb: LANGUAGES.go.blurb,
    mark: 'go',
  }),
  research({
    id: 'lang-elixir',
    name: 'Elixir',
    track: 'languages',
    cost: 1800,
    requires: ['lang-go'],
    blurb: LANGUAGES.elixir.blurb,
    mark: 'ex',
  }),
  research({
    id: 'lang-rust',
    name: 'Rust',
    track: 'languages',
    cost: 4400,
    requires: ['lang-go'],
    blurb: LANGUAGES.rust.blurb,
    mark: 'rs',
  }),
  research({
    id: 'fw-laravel',
    name: 'Laravel',
    track: 'frameworks',
    cost: 20,
    requires: [],
    blurb: FRAMEWORKS.laravel.blurb,
    mark: 'php',
  }),
  research({
    id: 'fw-rails',
    name: 'Rails',
    track: 'frameworks',
    cost: 80,
    requires: ['lang-ruby'],
    blurb: FRAMEWORKS.rails.blurb,
    mark: 'rb',
  }),
  research({
    id: 'fw-express',
    name: 'Express',
    track: 'frameworks',
    cost: 90,
    requires: ['lang-node'],
    blurb: FRAMEWORKS.express.blurb,
    mark: 'js',
  }),
  research({
    id: 'fw-nextjs',
    name: 'Next.js',
    track: 'frameworks',
    cost: 300,
    requires: ['fw-express'],
    blurb: FRAMEWORKS.nextjs.blurb,
    mark: 'js',
  }),
  research({
    id: 'fw-django',
    name: 'Django',
    track: 'frameworks',
    cost: 320,
    requires: ['lang-python'],
    blurb: FRAMEWORKS.django.blurb,
    mark: 'py',
  }),
  research({
    id: 'fw-fastapi',
    name: 'FastAPI',
    track: 'frameworks',
    cost: 1400,
    requires: ['fw-django'],
    blurb: FRAMEWORKS.fastapi.blurb,
    mark: 'py',
  }),
  research({
    id: 'fw-spring',
    name: 'Spring Boot',
    track: 'frameworks',
    cost: 760,
    requires: ['lang-java'],
    blurb: FRAMEWORKS.spring.blurb,
    mark: 'jv',
  }),
  research({
    id: 'fw-gin',
    name: 'Gin',
    track: 'frameworks',
    cost: 1600,
    requires: ['lang-go'],
    blurb: FRAMEWORKS.gin.blurb,
    mark: 'go',
  }),
  research({
    id: 'fw-phoenix',
    name: 'Phoenix',
    track: 'frameworks',
    cost: 2800,
    requires: ['lang-elixir'],
    blurb: FRAMEWORKS.phoenix.blurb,
    mark: 'ex',
  }),
  research({
    id: 'fw-axum',
    name: 'Axum',
    track: 'frameworks',
    cost: 7000,
    requires: ['lang-rust'],
    blurb: FRAMEWORKS.axum.blurb,
    mark: 'rs',
  }),
]

export const RESEARCH: Record<ResearchId, ResearchDef> = Object.fromEntries(
  RESEARCH_LIST.map((entry) => [entry.id, entry]),
) as Record<ResearchId, ResearchDef>

export const researchList = RESEARCH_LIST

export const LANGUAGE_RESEARCH: Record<LanguageId, ResearchId | null> = {
  php: null,
  ruby: 'lang-ruby',
  node: 'lang-node',
  python: 'lang-python',
  java: 'lang-java',
  go: 'lang-go',
  elixir: 'lang-elixir',
  rust: 'lang-rust',
}

export const FRAMEWORK_RESEARCH: Record<FrameworkId, ResearchId | null> = {
  none: null,
  laravel: 'fw-laravel',
  rails: 'fw-rails',
  express: 'fw-express',
  nextjs: 'fw-nextjs',
  django: 'fw-django',
  fastapi: 'fw-fastapi',
  spring: 'fw-spring',
  gin: 'fw-gin',
  phoenix: 'fw-phoenix',
  axum: 'fw-axum',
}

/* ---------- funding stages ---------- */

export type StageDef = Readonly<{
  name: string
  /** Most users the market holds at this stage. */
  market: number
  /** Users needed to raise the next round. */
  raiseAt: number
  /** Capital the next round pays out. */
  grant: number
  /** Share of each request kind in the traffic. Sums to 1. */
  mix: Partial<Record<RequestKind, number>>
  /** What the round brings, shown when it lands. */
  news: string
}>

export const STAGES: ReadonlyArray<StageDef> = [
  {
    name: 'Garage',
    market: 1_500,
    raiseAt: 1_000,
    grant: 800,
    mix: { page: 0.7, read: 0.3 },
    news: 'One server, one database, a few friends using it.',
  },
  {
    name: 'Pre-seed',
    market: 6_000,
    raiseAt: 4_500,
    grant: 3_000,
    mix: { page: 0.55, read: 0.3, write: 0.15 },
    news: 'Users can sign up and post. Writes arrive.',
  },
  {
    name: 'Seed',
    market: 30_000,
    raiseAt: 22_000,
    grant: 15_000,
    mix: { page: 0.45, read: 0.27, write: 0.12, search: 0.08, bot: 0.08 },
    news: 'Search ships, and scrapers found you. Bots arrive.',
  },
  {
    name: 'Series A',
    market: 150_000,
    raiseAt: 110_000,
    grant: 70_000,
    mix: { page: 0.36, read: 0.24, write: 0.1, search: 0.08, media: 0.12, bot: 0.1 },
    news: 'Video uploads launch. Media arrives.',
  },
  {
    name: 'Series B',
    market: 800_000,
    raiseAt: 600_000,
    grant: 300_000,
    mix: {
      page: 0.3,
      read: 0.22,
      write: 0.1,
      search: 0.08,
      media: 0.12,
      job: 0.04,
      ai: 0.04,
      bot: 0.1,
    },
    news: 'Enterprise exports and an AI assistant. Jobs and AI prompts arrive.',
  },
  {
    name: 'IPO',
    market: 5_000_000,
    raiseAt: Number.POSITIVE_INFINITY,
    grant: 0,
    mix: {
      page: 0.28,
      read: 0.22,
      write: 0.1,
      search: 0.08,
      media: 0.12,
      job: 0.05,
      ai: 0.07,
      bot: 0.08,
    },
    news: 'The bell rings. The system you built runs a public company.',
  },
]

/** Requests per second each user sends. */
export const RPS_PER_USER = 0.02

/** Capacity and Burn per level. */
export const LEVEL_CAPACITY = 1.75
export const LEVEL_BURN = 1.55
export const LEVEL_COST = 2.3
export const MAX_LEVEL = 12
