/* Request kinds and backend kinds: what users send and what Nodes send downstream. */

/** What users send. */
export const REQUEST_KINDS = [
  'page',
  'read',
  'write',
  'login',
  'search',
  'upload',
  'bot',
  'media',
  'rt',
  'buy',
  'job',
  'report',
  'ai',
  'feed',
  'hook',
  'push',
] as const
export type RequestKind = (typeof REQUEST_KINDS)[number]

/** What a Node sends downstream to the data tier or a Managed Component. */
export const BACKEND_KINDS = [
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
] as const
export type BackendKind = (typeof BACKEND_KINDS)[number]

export type Kind = RequestKind | BackendKind

export const isBackendKind = (kind: Kind): kind is BackendKind =>
  (BACKEND_KINDS as ReadonlyArray<Kind>).includes(kind)

export type KindInfo = Readonly<{
  label: string
  /** Dollars earned per satisfied request. */
  value: number
  /** Particle colour on the board, as a 0xRRGGBB number. */
  color: number
}>

export const KINDS: Record<Kind, KindInfo> = {
  page: { label: 'Page view', value: 0.1, color: 0x77a4f6 },
  read: { label: 'API read', value: 0.2, color: 0x4f7fe0 },
  write: { label: 'API write', value: 0.5, color: 0x7152b5 },
  login: { label: 'Login', value: 0.25, color: 0xd0438b },
  search: { label: 'Search', value: 0.6, color: 0x2f9e8f },
  upload: { label: 'Upload', value: 0.75, color: 0xd9822b },
  bot: { label: 'Bot', value: 0, color: 0x8a8f98 },
  media: { label: 'Video', value: 1, color: 0xe0564f },
  rt: { label: 'Realtime', value: 0.025, color: 0x3fb6c9 },
  buy: { label: 'Checkout', value: 25, color: 0x2e9d57 },
  job: { label: 'Export', value: 1.6, color: 0x9a7b4f },
  report: { label: 'Report', value: 2, color: 0x5b6abf },
  ai: { label: 'AI prompt', value: 4, color: 0xb04fc7 },
  'q-read': { label: 'Read query', value: 0, color: 0x4f7fe0 },
  'q-write': { label: 'Write query', value: 0, color: 0x7152b5 },
  auth: { label: 'Auth call', value: 0, color: 0xd0438b },
  'q-search': { label: 'Search query', value: 0, color: 0x2f9e8f },
  'blob-put': { label: 'Object put', value: 0, color: 0xd9822b },
  task: { label: 'Task', value: 0, color: 0xb8a03a },
  'blob-get': { label: 'Object get', value: 0, color: 0xe0564f },
  'q-tx': { label: 'Transaction', value: 0, color: 0x2e9d57 },
  charge: { label: 'Charge', value: 0, color: 0x2e9d57 },
  'q-scan': { label: 'Scan', value: 0, color: 0x5b6abf },
  infer: { label: 'Inference', value: 0, color: 0xb04fc7 },
  feed: { label: 'Feed', value: 0.3, color: 0xc9a227 },
  hook: { label: 'Webhook', value: 0.4, color: 0x6d8f3a },
  push: { label: 'Notify', value: 0.05, color: 0xd96b9a },
  notify: { label: 'Push message', value: 0, color: 0xd96b9a },
  callout: { label: 'Customer call', value: 0, color: 0x6d8f3a },
  'k-write': { label: 'Timeline write', value: 0, color: 0xc9a227 },
}

export type RequestProfile = Readonly<{
  /** App CPU in reference ms, on a runtime with speed 1.0 (Go). */
  cpu: number
  /** Native code (bcrypt): the runtime speed does not divide it. */
  native: boolean
  /** Apdex target T, in ms. */
  apdex: number
  /** Synchronous backend calls per request, by backend kind. */
  calls: Readonly<Partial<Record<Exclude<BackendKind, 'auth' | 'task'>, number>>>
  /**
   * Backend calls the async part makes: a Worker sends them once the kind goes
   * through a Queue; without one, the App Server makes them inline.
   */
  asyncCalls: Readonly<Partial<Record<'q-read' | 'q-write' | 'notify' | 'callout', number>>>
  /** An ORM turns this kind's reads into N+1 queries. */
  orm: boolean
  /** KB the response sends over the network. */
  payloadKB: number
  /** KB the response sends when the work went to a Worker: an acknowledgement. */
  asyncKB: number
  /** Streamed: the user waits only for the first segment, not the whole response. */
  stream: boolean
  /** Gzip shrinks the response. */
  compressible: boolean
  /** KB the request sends up, over the user's uplink. */
  inKB: number
  /** Share of the app CPU an App Server can hand to a Worker through a Queue. */
  offload: number
  /** Counts toward Apdex, errors, revenue and growth. Bots do not. */
  scored: boolean
}>

export const PROFILES: Record<RequestKind, RequestProfile> = {
  page: {
    cpu: 4,
    native: false,
    apdex: 400,
    calls: { 'q-read': 2, 'q-write': 0 },
    asyncCalls: {},
    orm: true,
    payloadKB: 80,
    asyncKB: 80,
    stream: false,
    compressible: true,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  read: {
    cpu: 1.5,
    native: false,
    apdex: 200,
    calls: { 'q-read': 1, 'q-write': 0 },
    asyncCalls: {},
    orm: true,
    payloadKB: 4,
    asyncKB: 4,
    stream: false,
    compressible: true,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  write: {
    cpu: 2,
    native: false,
    apdex: 300,
    calls: { 'q-read': 0, 'q-write': 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 2,
    asyncKB: 2,
    stream: false,
    compressible: false,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  login: {
    cpu: 80,
    native: true,
    apdex: 800,
    calls: { 'q-read': 1, 'q-write': 0 },
    asyncCalls: {},
    orm: false,
    payloadKB: 1,
    asyncKB: 1,
    stream: false,
    compressible: false,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  search: {
    cpu: 3,
    native: false,
    apdex: 300,
    calls: { 'q-search': 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 8,
    asyncKB: 8,
    stream: false,
    compressible: true,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  // Image resizing runs in a native library, so the runtime's speed does not divide it.
  upload: {
    cpu: 120,
    native: true,
    apdex: 1_500,
    calls: { 'blob-put': 1, 'q-write': 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 2,
    asyncKB: 2,
    stream: false,
    compressible: false,
    inKB: 2_000,
    offload: 0.9,
    scored: true,
  },
  bot: {
    cpu: 2,
    native: false,
    apdex: 400,
    calls: { 'q-read': 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 4,
    asyncKB: 4,
    stream: false,
    compressible: true,
    inKB: 0,
    offload: 0,
    scored: false,
  },
  // Video streams: the player starts after the first segment, but every byte crosses the network.
  media: {
    cpu: 1,
    native: false,
    apdex: 1_000,
    calls: { 'blob-get': 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 5_000,
    asyncKB: 5_000,
    stream: true,
    compressible: false,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  // One message on a connection that stays open (06 "Realtime connections").
  rt: {
    cpu: 0.3,
    native: false,
    apdex: 100,
    calls: {},
    asyncCalls: {},
    orm: false,
    payloadKB: 1,
    asyncKB: 1,
    stream: false,
    compressible: false,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  buy: {
    cpu: 5,
    native: false,
    apdex: 2_000,
    // It reads the cart back before it charges: on a lagging replica, the cart can be stale.
    calls: { 'q-read': 1, 'q-tx': 1, charge: 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 2,
    asyncKB: 2,
    stream: false,
    compressible: false,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  // A data export: seconds of CPU, 50 reads and a 10 MB file. Through a Queue the user gets an
  // acknowledgement and a Worker does the rest; inline, the request holds a slot for all of it.
  job: {
    cpu: 400,
    native: false,
    apdex: 1_000,
    calls: {},
    asyncCalls: { 'q-read': 50 },
    orm: false,
    payloadKB: 10_000,
    asyncKB: 2,
    stream: false,
    compressible: false,
    inKB: 0,
    offload: 0.95,
    scored: true,
  },
  // A dashboard: one scan of a whole table, on a Warehouse or, badly, on the primary.
  report: {
    cpu: 20,
    native: false,
    apdex: 3_000,
    calls: { 'q-scan': 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 50,
    asyncKB: 50,
    stream: false,
    compressible: true,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  // A prompt: the GPU or the LLM API does the work; tokens stream back as they come.
  ai: {
    cpu: 5,
    native: false,
    apdex: 4_000,
    calls: { infer: 1 },
    asyncCalls: {},
    orm: false,
    payloadKB: 4,
    asyncKB: 4,
    stream: true,
    compressible: false,
    inKB: 0,
    offload: 0,
    scored: true,
  }, // A timeline: pull reads 20 follows' posts, push reads one precomputed timeline (07 "Fan-out").
  feed: {
    cpu: 6,
    native: false,
    apdex: 300,
    calls: { 'q-read': 20 },
    asyncCalls: {},
    orm: false,
    payloadKB: 30,
    asyncKB: 30,
    stream: false,
    compressible: true,
    inKB: 0,
    offload: 0,
    scored: true,
  },
  // A webhook to a customer's server: slow and unreliable. Through a Queue a Worker waits on it.
  hook: {
    cpu: 2,
    native: false,
    apdex: 1_000,
    calls: {},
    asyncCalls: { callout: 1 },
    orm: false,
    payloadKB: 2,
    asyncKB: 2,
    stream: false,
    compressible: false,
    inKB: 0,
    offload: 0.9,
    scored: true,
  },
  // A notification: one message to the Push and Email Provider, best sent from a Worker.
  push: {
    cpu: 0.5,
    native: false,
    apdex: 1_000,
    calls: {},
    asyncCalls: { notify: 1 },
    orm: false,
    payloadKB: 1,
    asyncKB: 1,
    stream: false,
    compressible: false,
    inKB: 0,
    offload: 0.9,
    scored: true,
  },
}

/** CPU ms that one query costs a database. Stylized, so the database matters at Pre-seed volume. */
export const QUERY_CPU: Readonly<{
  'q-read': number
  'q-write': number
  'q-search': number
  'blob-put': number
  'q-tx': number
  'blob-get': number
  'q-scan': number
}> = {
  'q-read': 8,
  'q-write': 25,
  // Postgres full-text search: fine at low volume, ten reads' worth of CPU each (10 "Seed").
  'q-search': 80,
  // A 2 MB object stored as a row. Proposed: not in the GDD.
  'blob-put': 60,
  // A checkout transaction: several statements under locks. Proposed: not in the GDD.
  'q-tx': 40,
  // A file read back out of a row. Proposed.
  'blob-get': 30,
  // A report's scan of a whole table on the primary: a hundred ms, and it evicts the buffer
  // cache, so every other read on that Database slows too (07 "Data Warehouse"). Proposed.
  'q-scan': 100,
}

/** KB of a streamed response the user waits for before it starts playing. Proposed. */
export const STREAM_KB = 500
/**
 * Seconds a realtime connection stays open for each message it carries, so open
 * connections are rt per second × this. Proposed: at 8% rt it keeps about half the users online.
 */
export const RT_HOLD_SECONDS = 300

/** A user's downlink, for the time a response takes to arrive. Stylized. */
export const USER_MBPS = 20
/** A user's uplink, for the time an upload takes to send. Stylized: 20 Mbps, so 2 MB takes 0.8 s. */
export const USER_UP_MBPS = 20
/** Gzip leaves this share of a compressible response. */
export const GZIP_RATIO = 0.3
/** Gzip multiplies the app CPU of a compressible request. */
export const GZIP_CPU = 1.1

/** Login CPU, in reference ms, when an Auth Provider does the hashing. */
export const LOGIN_DELEGATED_CPU = 2

/** A customer's webhook endpoint: slow and unreliable (04 "Request kinds"). Proposed. */
export const CALLOUT_MS = 800
export const CALLOUT_FAILURE = 0.02
/**
 * Fan-out on write (07 "Fan-out"): a post becomes one timeline write per follower, and a
 * feed reads one timeline. Hybrid pulls the celebrities' posts. Followers are proposed.
 */
export const FOLLOWERS = 20
export const HYBRID_WRITES = 0.5
export const HYBRID_READS = 2
