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
  /** Most routing links out. Users resolve to one host until DNS. */
  maxOut: number
  /** Receives a copy of its parent's traffic instead of a share of it. */
  tap: boolean
  /** Research that unlocks it, or null for the starter kit. */
  unlock: ResearchId | null
  /** The player cannot place or sell it. */
  fixed: boolean
}>

const def = (
  entry: Omit<ComponentDef, 'maxOut' | 'tap' | 'unlock' | 'fixed' | 'sized' | 'burn' | 'steps'> &
    Partial<ComponentDef>,
): ComponentDef => ({
  maxOut: 99,
  tap: false,
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
    accepts: ['q-read', 'q-write'],
    maxOut: 0,
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
  }),
  lb: def({
    id: 'lb',
    code: 'lb',
    name: 'Load Balancer',
    product: 'NGINX',
    group: 'edge',
    blurb: 'Splits by capacity and stops sending to a dead host.',
    cost: 120,
    burn: 0.08,
    latency: 1,
    accepts: REQUEST_KINDS,
    unlock: 'load-balancing',
    steps: 6,
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
    accepts: ['q-read', 'q-write'],
    unlock: 'pooling',
    steps: 4,
  }),
  cache: def({
    id: 'cache',
    code: 'kv',
    name: 'Cache',
    product: 'Redis',
    group: 'data',
    blurb: 'Answers most read queries from memory. Writes pass through and invalidate.',
    cost: 150,
    burn: 0.06,
    latency: 0.5,
    accepts: ['q-read', 'q-write'],
    unlock: 'caching',
    steps: 8,
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
}

/** Auth Provider price, in dollars per second per user. */
export const AUTH_PRICE_PER_USER = 0.00006

export const SAMPLE_RATES = [0.01, 0.1, 0.5, 1] as const
/** CPU overhead on tapped Nodes, per sample rate. */
export const SAMPLE_OVERHEAD = [0.001, 0.01, 0.03, 0.05] as const
/** Storage Burn multiplier, per sample rate. */
export const SAMPLE_STORAGE = [0.1, 1, 5, 10] as const
/** Insight per sampled request. Failed and slow requests teach twice as much. */
export const INSIGHT_YIELD = 0.5
/** Samples per second Analytics keeps at size 1. Each size step doubles it. */
export const ANALYTICS_CAPACITY = 4
