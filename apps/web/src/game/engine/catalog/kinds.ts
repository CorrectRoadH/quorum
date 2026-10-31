/* Request kinds and backend kinds: what users send and what Nodes send downstream. */

/** What users send. */
export const REQUEST_KINDS = ['page', 'read', 'write', 'login'] as const
export type RequestKind = (typeof REQUEST_KINDS)[number]

/** What a Node sends downstream to the data tier or a Managed Component. */
export const BACKEND_KINDS = ['q-read', 'q-write', 'auth'] as const
export type BackendKind = (typeof BACKEND_KINDS)[number]

export type Kind = RequestKind | BackendKind

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
  'q-read': { label: 'Read query', value: 0, color: 0x4f7fe0 },
  'q-write': { label: 'Write query', value: 0, color: 0x7152b5 },
  auth: { label: 'Auth call', value: 0, color: 0xd0438b },
}

export type RequestProfile = Readonly<{
  /** App CPU in reference ms, on a runtime with speed 1.0 (Go). */
  cpu: number
  /** Native code (bcrypt): the runtime speed does not divide it. */
  native: boolean
  /** Apdex target T, in ms. */
  apdex: number
  /** Synchronous read queries per request. */
  reads: number
  /** Synchronous write queries per request. */
  writes: number
  /** An ORM turns this kind's reads into N+1 queries. */
  orm: boolean
}>

export const PROFILES: Record<RequestKind, RequestProfile> = {
  page: { cpu: 4, native: false, apdex: 400, reads: 2, writes: 0, orm: true },
  read: { cpu: 1.5, native: false, apdex: 200, reads: 1, writes: 0, orm: true },
  write: { cpu: 2, native: false, apdex: 300, reads: 0, writes: 1, orm: false },
  login: { cpu: 80, native: true, apdex: 800, reads: 1, writes: 0, orm: false },
}

/** CPU ms that one query costs a database. Stylized, so the database matters at Pre-seed volume. */
export const QUERY_CPU: Readonly<{ 'q-read': number; 'q-write': number }> = {
  'q-read': 8,
  'q-write': 25,
}

/** Login CPU, in reference ms, when an Auth Provider does the hashing. */
export const LOGIN_DELEGATED_CPU = 2
