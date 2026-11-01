/* Request kinds and backend kinds: what users send and what Nodes send downstream. */

/** What users send. */
export const REQUEST_KINDS = ['page', 'read', 'write', 'login', 'search', 'upload', 'bot'] as const
export type RequestKind = (typeof REQUEST_KINDS)[number]

/** What a Node sends downstream to the data tier or a Managed Component. */
export const BACKEND_KINDS = ['q-read', 'q-write', 'auth', 'q-search', 'blob-put', 'task'] as const
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
  page: { label: 'Page view', value: 0.2, color: 0x77a4f6 },
  read: { label: 'API read', value: 0.4, color: 0x4f7fe0 },
  write: { label: 'API write', value: 1, color: 0x7152b5 },
  login: { label: 'Login', value: 0.5, color: 0xd0438b },
  search: { label: 'Search', value: 1.2, color: 0x2f9e8f },
  upload: { label: 'Upload', value: 1.5, color: 0xd9822b },
  bot: { label: 'Bot', value: 0, color: 0x8a8f98 },
  'q-read': { label: 'Read query', value: 0, color: 0x4f7fe0 },
  'q-write': { label: 'Write query', value: 0, color: 0x7152b5 },
  auth: { label: 'Auth call', value: 0, color: 0xd0438b },
  'q-search': { label: 'Search query', value: 0, color: 0x2f9e8f },
  'blob-put': { label: 'Object put', value: 0, color: 0xd9822b },
  task: { label: 'Task', value: 0, color: 0xb8a03a },
}

export type RequestProfile = Readonly<{
  /** App CPU in reference ms, on a runtime with speed 1.0 (Go). */
  cpu: number
  /** Native code (bcrypt): the runtime speed does not divide it. */
  native: boolean
  /** Apdex target T, in ms. */
  apdex: number
  /** Synchronous backend calls per request, by backend kind. */
  calls: Readonly<Partial<Record<'q-read' | 'q-write' | 'q-search' | 'blob-put', number>>>
  /** An ORM turns this kind's reads into N+1 queries. */
  orm: boolean
  /** KB the response sends over the network. */
  payloadKB: number
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
    orm: true,
    payloadKB: 80,
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
    orm: true,
    payloadKB: 4,
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
    orm: false,
    payloadKB: 2,
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
    orm: false,
    payloadKB: 1,
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
    orm: false,
    payloadKB: 8,
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
    orm: false,
    payloadKB: 2,
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
    orm: false,
    payloadKB: 4,
    compressible: true,
    inKB: 0,
    offload: 0,
    scored: false,
  },
}

/** CPU ms that one query costs a database. Stylized, so the database matters at Pre-seed volume. */
export const QUERY_CPU: Readonly<{
  'q-read': number
  'q-write': number
  'q-search': number
  'blob-put': number
}> = {
  'q-read': 8,
  'q-write': 25,
  // Postgres full-text search: fine at low volume, ten reads' worth of CPU each (10 "Seed").
  'q-search': 80,
  // A 2 MB object stored as a row. Proposed: not in the GDD.
  'blob-put': 60,
}

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
