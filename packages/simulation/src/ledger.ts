import type { Limit, Resources } from './capacity.ts'
import type { Kind, RequestKind } from './catalog.ts'
import type { ErrorCause } from './distribution.ts'

/* ==========================================================================
   The Ledger: every figure the Simulation derives at a Step. It is the single
   source of truth for every number the game shows, and it is never saved.
   ========================================================================== */

export type NodeStatus = 'idle' | 'ok' | 'warn' | 'danger' | 'down'

export type NodeLedger = Readonly<{
  /** Requests per second that arrive. */
  inbound: number
  /** Requests per second of the current mix the Node could take. */
  capacity: number
  utilization: number
  limit: Limit
  /** Mean milliseconds this Node adds to a request. */
  latency: number
  /** 99th percentile of the milliseconds this Node adds, for its busiest kind. */
  p99: number
  /** Requests per second dropped for lack of capacity. */
  dropped: number
  /** Queries per second refused for lack of connections. */
  refused: number
  /** Requests per second that leave with nowhere to go, and their kinds. */
  stranded: number
  strandedKinds: ReadonlyArray<Kind>
  /** Database connections in use, and the limit. */
  connections: Readonly<{ used: number; max: number }> | null
  /** Cache hit ratio. */
  hitRatio: number | null
  /** Milliseconds a replica lags behind the primary. */
  lag: number | null
  /** The working set does not fit in RAM. */
  disk: boolean
  /** Requests per second sent on, by kind. */
  out: Readonly<Partial<Record<Kind, number>>>
  resources: Resources
  throttled: boolean
  swapping: boolean
  status: NodeStatus
}>

export type LinkLedger = Readonly<{
  from: string
  to: string
  rate: number
  /** The kind carrying the most traffic, for the particle colour. */
  kind: Kind
  /** The far end fails what this link carries. */
  failing: boolean
}>

export type KindLedger = Readonly<{
  /** Requests per second users send. */
  rate: number
  success: number
  apdex: number
  mean: number
  p50: number
  p95: number
  p99: number
}>

export type Ledger = Readonly<{
  nodes: Readonly<Record<string, NodeLedger>>
  links: ReadonlyArray<LinkLedger>
  kinds: Readonly<Partial<Record<RequestKind, KindLedger>>>
  /** Requests per second users send. */
  demand: number
  /** Requests per second answered. */
  served: number
  /** Failed requests per second, by cause. */
  errors: Readonly<Record<ErrorCause, number>>
  /** Share of requests that fail. */
  errorShare: number
  /** Latency of answered requests, in ms. */
  latency: number
  p50: number
  p95: number
  p99: number
  /** Apdex of all requests; failures count as frustrated. */
  apdex: number
  revenue: number
  insight: number
  burn: number
  /** The Era's market times the Stack's velocity. */
  market: number
  /** Traffic-weighted velocity of the App Servers. */
  velocity: number
  /** Request kinds that mostly have no route, for hints. */
  failing: ReadonlyArray<RequestKind>
  /** The Node whose extra capacity would earn the most, if any. */
  bottleneck: string | null
}>
