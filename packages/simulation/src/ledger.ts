import type { Limit, Resources } from './capacity.ts'
import type { InsightPool, Kind, RegionId, RequestKind } from './catalog.ts'
import type { ErrorCause, Failures } from './distribution.ts'

/* ==========================================================================
   The Ledger: every figure the Simulation derives at a Step. It is the single
   source of truth for every number the game shows, and it is never saved.
   ========================================================================== */

export type NodeStatus = 'idle' | 'ok' | 'warn' | 'danger' | 'down'

export type NodeLedger = Readonly<{
  /** Requests per second that arrive. */
  inbound: number
  /** Offered arrivals per second by operation, before drops; sums to inbound. */
  traffic: Readonly<Partial<Record<Kind, number>>>
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
  /** Cache or CDN hit ratio. */
  hitRatio: number | null
  /** Seconds a new task waits in this Queue before a Worker takes it; infinite with none draining. */
  age: number | null
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
  /** Operations per second carried, or attributed samples on a tap; sums to rate. */
  traffic: Readonly<Partial<Record<Kind, number>>>
  /** The kind carrying the most traffic, for the particle colour. */
  kind: Kind
  /** The far end fails what this link carries. */
  failing: boolean
  /** Share of calls that fail on a Link that retries or breaks; 0 on others. */
  failure: number
}>

export type KindLedger = Readonly<{
  /** Requests per second users send. */
  rate: number
  success: number
  /** Apdex, with the async part also scored on when its result is ready. */
  apdex: number
  /** Apdex of the async part's completion, or null when nothing went through a Queue. */
  completion: number | null
  mean: number
  p50: number
  p95: number
  p99: number
}>

/** What one region's users get for one request kind. */
export type RegionKindLedger = Readonly<{
  /** Requests per second this region's users send. */
  rate: number
  /** Share answered. */
  success: number
  /** Apdex of the answered requests, with the users' hop. */
  apdex: number
  /** Apdex the same answers would have with no hop to reach the Design. */
  near: number
  /** Share that fails, by cause. */
  fail: Failures
  /** Milliseconds the users' hop adds to reach the Design. */
  hopMs: number
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
  /** Apdex of each region's users, wherever the Design serves them. */
  regions: Readonly<Partial<Record<RegionId, number>>>
  /** What each region's users get for each scored request kind (12 "The Churn breakdown"). */
  regionKinds: Readonly<
    Partial<Record<RegionId, Readonly<Partial<Record<RequestKind, RegionKindLedger>>>>>
  >
  /** Dollars per second: requests, plus subscriptions. */
  revenue: number
  /** Dollars per second from paid plans, included in `revenue`. */
  subscriptions: number
  /** Insight per second, by pool (12 "Earning Insight"). */
  insight: Readonly<Record<InsightPool, number>>
  /** Component types that sample each request kind, for research that needs breadth. */
  breadth: Readonly<Partial<Record<RequestKind, number>>>
  /** Dollars per second: the cloud bill, plus salaries. */
  burn: number
  /** Dollars per second of payroll, included in `burn`. */
  salaries: number
  /** Dollars per second of egress, included in `burn`. */
  egress: number
  /** Dollars per second to third parties (Payment Provider fees, scans, tokens), included in `burn`. */
  fees: number
  /** Most users the market holds: the Era's, grown by Features. */
  market: number
  /** Traffic-weighted velocity of the App Servers' Stacks: language × framework. */
  velocity: number
  /** Request kinds that mostly have no route, for hints. */
  failing: ReadonlyArray<RequestKind>
  /** The Node whose extra capacity would earn the most, if any. */
  bottleneck: string | null
}>
