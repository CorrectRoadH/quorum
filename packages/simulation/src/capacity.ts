import {
  APACHE_MAX_WORKERS,
  APACHE_SPARE,
  NOISY_MS,
  NOISY_SHARE,
  BURST_BASELINE,
  FRAMEWORKS,
  GZIP_CPU,
  LOCAL_DB_CONTENTION,
  LOCAL_DB_RAM,
  LOCAL_DB_RAM_PER_USER,
  LOGIN_DELEGATED_CPU,
  OPCACHE_SPEED,
  ORM_READS,
  OS_RAM,
  PM_MODES,
  QUERY_CPU,
  REQUEST_KINDS,
  ROWS_PER_USER,
  UNINDEXED_MS_PER_ROW,
  RT_HOLD_SECONDS,
  RUNTIMES,
  USER_UP_MBPS,
  BACKEND_KINDS,
  type BackendKind,
  type RequestKind,
} from './catalog.ts'
import { combineTail } from './distribution.ts'
import { payloadFactor, queryFactor } from './features.ts'
import { asLogin, has, networkOf, payloadOf, profileOf, ramOf, vcpuOf } from './lookups.ts'
import { fixed } from './team.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   The capacity model: what one Node can do with the work that reaches it.
   Capacity is the tightest of CPU, worker slots and memory. A request holds a
   slot while it waits for the database, so a slow database lowers the
   capacity of runtimes that hold a worker while they wait (Little's law).
   ========================================================================== */

export type Limit =
  | 'cpu'
  | 'credits'
  | 'memory'
  | 'workers'
  | 'connections'
  | 'network'
  | 'disk'
  | 'throughput'
  | 'none'

export type Gauge = Readonly<{ used: number; total: number }>

export type Resources = Readonly<{
  /** Cores. */
  cpu: Gauge | null
  /** GB. */
  ram: Gauge | null
  /** Requests in flight against worker slots. */
  slots: Gauge | null
  /** KB per second sent, against what the network card moves. */
  network: Gauge | null
  /** Burstable credits in core-seconds, and their change per second. */
  credits: Readonly<{ balance: number; rate: number }> | null
}>

export const NO_RESOURCES: Resources = {
  cpu: null,
  ram: null,
  slots: null,
  network: null,
  credits: null,
}

export type Service = Readonly<{ fixed: number; variable: number }>

export type NodeModel = Readonly<{
  /** Offered work over capacity. */
  utilization: number
  limit: Limit
  /** Share of arrivals processed; the rest is dropped. */
  share: number
  /** Requests per second of the current mix at full utilization. */
  capacity: number
  /** Latency this Node adds, per arriving kind. */
  service: Readonly<Record<string, Service>>
  /** Event-loop stalls: the share of requests hit and the stall length. */
  tailP: number
  tailMs: number
  /** Processes that hold database connections. */
  processes: number
  /** Requests in flight. */
  inflight: number
  resources: Resources
  throttled: boolean
  swapping: boolean
}>

/** Share of requests on an event loop that wait behind a blocking callback. */
export const LOOP_TAIL_SHARE = 0.02
/** Garbage collection pauses start above this share of the heap (06 "Runtime behaviors"). */
export const GC_HEAP = 0.7
/** Share of requests a GC pause lands on at a full heap: the p99, not the p50. Proposed. */
export const GC_TAIL_SHARE = 0.02

/** M/M/c-style waiting time, capped at saturation. */
const waitFor = (service: number, utilization: number, servers: number): number => {
  const rho = Math.min(utilization, 0.98)
  return (service * rho) / (Math.max(1, servers) * (1 - rho))
}

const total = (rates: Readonly<Record<string, number>>): number =>
  Object.values(rates).reduce((sum, rate) => sum + rate, 0)

/* ---------- App Server ---------- */

/** Backend calls per request, or milliseconds per call, by backend kind. A missing kind is 0. */
export type Calls = Readonly<Partial<Record<BackendKind, number>>>

/** Sums count × latency over the backend kinds, in catalog order, so the sum is the same everywhere. */
export const waitOf = (calls: Calls, latency: Calls): number => {
  let sum = 0
  for (const kind of BACKEND_KINDS) {
    const count = calls[kind] ?? 0
    if (count !== 0) sum += count * (latency[kind] ?? 0)
  }
  return sum
}

/**
 * The backend calls one request of a kind makes from this App Server. With a
 * Queue linked, a kind that can go async also enqueues one task.
 */
export const callsOf = (
  game: Game,
  node: GameNode,
  kind: RequestKind,
  delegated: boolean,
  offloaded = false,
): Calls => {
  const profile = profileOf(game, kind)
  if (asLogin(game, kind) && delegated) return { auth: 1 }
  // Eager loading: the research shows the N+1 queries, and the task removes them.
  const orm =
    profile.orm &&
    FRAMEWORKS[node.framework].orm &&
    !(has(game, 'eager-loading') && fixed(game, 'eager-loading'))
  const calls: Partial<Record<BackendKind, number>> = {
    ...profile.calls,
    'q-read': (profile.calls['q-read'] ?? 0) * (orm ? ORM_READS : 1),
  }
  if (offloaded && profile.offload > 0) calls.task = 1
  return calls
}

export type ServerContext = Readonly<{
  game: Game
  node: GameNode
  arriving: Readonly<Partial<Record<RequestKind, number>>>
  /** Mean latency of one call to each backend, in ms. */
  callLatency: Calls
  /** An Auth Provider takes this server's logins. */
  delegated: boolean
  /** Postgres runs on this box. */
  local: boolean
  /** Requests in flight on the previous pass, for Apache's process count. */
  inflight: number
  /** Capacity multiplier, for the bottleneck test. */
  boost: number
  /** CPU overhead from Analytics sampling this Node. */
  sampling: number
  /** Login hashing costs this many times more (incident "Event loop block"). */
  hashing: number
  /** A Queue is linked: kinds that can go async hand most of their CPU to a Worker. */
  offloaded?: boolean
  /** A Worker: it runs only the async part of each kind, and answers no user. */
  worker?: boolean
  /** It runs as pods in a Kubernetes Cluster: neighbours on the same node steal CPU now and then. */
  pod?: boolean
}>

/**
 * CPU speed of this server: runtime, OPcache, and warmup. A cold JIT runtime
 * starts at its `warmFrom` share; a cold PHP box runs without OPcache until the
 * cache fills.
 */
export const speedOf = (game: Game, node: GameNode): number => {
  const runtime = RUNTIMES[node.runtime]
  const opcache =
    runtime.language === 'php' && has(game, 'opcache') ? 1 + (OPCACHE_SPEED - 1) * node.warm : 1
  return runtime.speed * opcache * (runtime.warmFrom + (1 - runtime.warmFrom) * node.warm)
}

/** Core-milliseconds one request of a kind costs this server. */
const cpuOf = (context: ServerContext, kind: RequestKind, calls: Calls): number => {
  const { game, node } = context
  const profile = profileOf(game, kind)
  const framework = FRAMEWORKS[node.framework]
  const speed = speedOf(game, node)
  const login = asLogin(game, kind)
  let cpu =
    login && context.delegated && !context.worker
      ? (LOGIN_DELEGATED_CPU * framework.overhead) / speed
      : profile.native
        ? profile.cpu * (login ? context.hashing : 1)
        : (profile.cpu * framework.overhead) / speed
  // A Worker runs the part that went async; the App Server keeps the rest.
  if (context.worker) return cpu * profile.offload * (1 + context.sampling)
  if (context.offloaded) cpu *= 1 - profile.offload
  if (node.compress && profile.compressible) cpu *= GZIP_CPU
  if (context.local) {
    let queries = 0
    for (const backend of BACKEND_KINDS) {
      const count = calls[backend] ?? 0
      const each = QUERY_CPU[backend as keyof typeof QUERY_CPU]
      if (count !== 0 && each !== undefined) queries += count * each
    }
    cpu += queries * LOCAL_DB_CONTENTION
  }
  return cpu * (1 + context.sampling)
}

export const serverModel = (context: ServerContext): NodeModel => {
  const { game, node, arriving } = context
  const runtime = RUNTIMES[node.runtime]
  const framework = FRAMEWORKS[node.framework]
  // Copies an Autoscaler added serve as one Node: every resource scales with them.
  const copies = node.replicas
  const vcpu = vcpuOf(node) * context.boost * copies
  const ram = ramOf(node) * context.boost * copies

  // Puma runs a process per core behind its GVL; the JVM, Go, .NET, BEAM and Tokio run one
  // process on every core.
  const processes =
    node.runtime === 'mod_php'
      ? Math.min(APACHE_MAX_WORKERS, Math.ceil(context.inflight) + APACHE_SPARE)
      : runtime.pool
        ? node.workers * copies
        : (runtime.model === 'threads' && !runtime.parallel) || node.runtime === 'node_cluster'
          ? Math.max(1, Math.round(vcpu / copies)) * copies
          : copies
  const slots =
    runtime.model === 'loop' || runtime.model === 'green' || runtime.model === 'async'
      ? Number.POSITIVE_INFINITY
      : runtime.model === 'threads'
        ? processes * runtime.threads
        : node.runtime === 'mod_php'
          ? APACHE_MAX_WORKERS * context.boost * copies
          : node.workers * context.boost * copies

  // PHP-FPM's process manager: static keeps the whole pool resident; dynamic and ondemand keep
  // what is busy, plus spares, and make some requests wait for a fork (06 "PHP-FPM pool modes").
  const pm = node.runtime === 'php_fpm' ? PM_MODES[node.pm] : PM_MODES.static
  const resident =
    pm.spares === null
      ? processes
      : Math.min(processes, Math.max(1, Math.ceil(context.inflight) + pm.spares))
  // A realtime connection stays open between messages. A runtime that waits for free holds a
  // few KB per connection; one that holds a worker or a thread per connection fills its pool.
  const connections = (arriving.rt ?? 0) * RT_HOLD_SECONDS
  const connectionRam =
    connections > 0 && runtime.connectionKB !== null
      ? (connections * runtime.connectionKB) / 1_048_576
      : 0
  const ramUsed =
    OS_RAM * copies +
    (resident * (runtime.memory + framework.memory)) / 1024 +
    (context.local ? LOCAL_DB_RAM + game.users * LOCAL_DB_RAM_PER_USER : 0) +
    node.leak +
    connectionRam
  const swapping = ramUsed > ram
  const efficiency = swapping ? Math.max(0.15, 1 - (2.5 * (ramUsed - ram)) / ram) : 1
  // Above 70% heap a collector pauses some requests; Go's spends CPU instead (06 "Runtime behaviors").
  const heap = ram > 0 ? ramUsed / ram : 0
  const pressure = runtime.gc && heap > GC_HEAP ? Math.min(1, (heap - GC_HEAP) / (1 - GC_HEAP)) : 0
  const collecting = pressure > 0 && runtime.gc ? 1 + runtime.gc.cpu * pressure : 1

  const usable = runtime.parallel
    ? vcpu
    : Math.min(vcpu, runtime.model === 'process' ? Math.max(1, processes) : processes)
  const throttled = node.family === 'burstable' && node.credits < 1
  const cores = throttled ? Math.min(usable, BURST_BASELINE * vcpu) : usable
  const perRequest = Math.min(1, cores)

  const kinds = REQUEST_KINDS.filter((kind) => (arriving[kind] ?? 0) > 0)
  const rate = kinds.reduce((sum, kind) => sum + (arriving[kind] ?? 0), 0)
  const calls = Object.fromEntries(
    REQUEST_KINDS.map((kind) => [
      kind,
      context.worker
        ? {}
        : callsOf(game, node, kind, context.delegated, context.offloaded ?? false),
    ]),
  ) as Record<RequestKind, Calls>
  const cpu = Object.fromEntries(
    REQUEST_KINDS.map((kind) => [
      kind,
      collecting > 1
        ? (cpuOf(context, kind, calls[kind]) / efficiency) * collecting
        : cpuOf(context, kind, calls[kind]) / efficiency,
    ]),
  ) as Record<RequestKind, number>

  const cpuWork = kinds.reduce((sum, kind) => sum + (arriving[kind] ?? 0) * cpu[kind], 0)
  const cpuUtilization = cores > 0 ? cpuWork / (cores * 1000) : rate > 0 ? 99 : 0
  const meanService = rate > 0 ? cpuWork / rate / perRequest : 0
  const cpuWait = waitFor(meanService, cpuUtilization, cores)

  const waiting = (kind: RequestKind): number => {
    if (context.local) return 0
    return waitOf(calls[kind], context.callLatency)
  }
  // A slow client holds the slot while its request body comes up the wire, unless the work went
  // async: then the file goes straight to storage and the App Server keeps the small sync part.
  const receiving = (kind: RequestKind): number => {
    const profile = profileOf(game, kind)
    if (context.worker || profile.inKB <= 0) return 0
    const kept = context.offloaded ? 1 - profile.offload : 1
    return ((profile.inKB * 8) / USER_UP_MBPS) * kept
  }
  const residence = (kind: RequestKind): number =>
    cpu[kind] / perRequest + cpuWait + waiting(kind) + receiving(kind)
  const slotWork = kinds.reduce((sum, kind) => sum + (arriving[kind] ?? 0) * residence(kind), 0)
  const slotUtilization = slots === Number.POSITIVE_INFINITY ? 0 : slotWork / (slots * 1000)
  const slotWait = rate > 0 ? waitFor(slotWork / rate, slotUtilization, slots) : 0

  // Every response leaves through the box's network card: bandwidth over bytes per request.
  const bytes = context.worker
    ? 0
    : kinds.reduce(
        (sum, kind) =>
          sum + (arriving[kind] ?? 0) * payloadOf(node, kind) * payloadFactor(context.game, kind),
        0,
      )
  const networkUtilization = bytes / (networkOf(node) * context.boost)

  const utilization = Math.max(cpuUtilization, slotUtilization, networkUtilization)
  const share = utilization > 1 ? 1 / utilization : 1
  const limit: NodeModel['limit'] =
    utilization <= 0
      ? 'none'
      : throttled
        ? 'credits'
        : swapping
          ? 'memory'
          : networkUtilization >= utilization
            ? 'network'
            : slotUtilization > cpuUtilization
              ? 'workers'
              : 'cpu'

  // One event loop runs one callback at a time: a heavy callback stalls every request behind
  // it (06 "Event loops and blocking"). The squared term lets rare heavy kinds dominate:
  //   loop_block_ms = Σ λ·cpu² / Σ λ·cpu,   added_p99 = loop_block_ms × min(1, 2ρ)
  // The stall hits LOOP_TAIL_SHARE of requests, above 1%, so it lands on the p99 and not the p95.
  // The libuv pool and an Auth Provider take the login hash off the loop, not the rest.
  const offLoop = (kind: RequestKind): boolean =>
    asLogin(game, kind) && (has(game, 'libuv-pool') || context.delegated)
  // Tokio blocks one worker thread of many: the stall lands on a share of requests per core.
  const onLoop = runtime.blocking !== null ? kinds.filter((kind) => !offLoop(kind)) : []
  const callback = (kind: RequestKind): number => cpu[kind] / perRequest
  const loopWork = onLoop.reduce((sum, kind) => sum + (arriving[kind] ?? 0) * callback(kind), 0)
  const loopSquares = onLoop.reduce(
    (sum, kind) => sum + (arriving[kind] ?? 0) * callback(kind) * callback(kind),
    0,
  )
  const loopBlock = loopWork > 0 ? loopSquares / loopWork : 0
  const stallP =
    loopBlock > 0
      ? runtime.blocking === 'worker'
        ? LOOP_TAIL_SHARE / Math.max(1, cores)
        : LOOP_TAIL_SHARE
      : pm.spawnShare
  const stallMs =
    loopBlock > 0 ? loopBlock * Math.min(1, 2 * Math.min(1, cpuUtilization)) : pm.spawnMs
  const gcP = pressure > 0 ? pressure * GC_TAIL_SHARE : 0
  const collected =
    gcP > 0 && runtime.gc
      ? combineTail(stallP, stallMs, gcP, runtime.gc.pauseMs)
      : { tailP: stallP, tailMs: stallMs }
  const { tailP, tailMs } = context.pod
    ? combineTail(collected.tailP, collected.tailMs, NOISY_SHARE, NOISY_MS)
    : collected

  const service = Object.fromEntries(
    REQUEST_KINDS.map((kind) => [
      kind,
      { fixed: 2, variable: cpu[kind] / perRequest + cpuWait + slotWait },
    ]),
  )

  const used = Math.min(cpuWork * share, cores * 1000) / 1000
  return {
    utilization,
    limit,
    share,
    capacity: rate > 0 ? rate / Math.max(utilization, 1e-9) : 0,
    service,
    tailP,
    tailMs,
    processes: resident,
    inflight: (slotWork * share) / 1000,
    resources: {
      cpu: { used, total: cores },
      ram: { used: ramUsed, total: ram },
      slots:
        slots === Number.POSITIVE_INFINITY
          ? null
          : { used: (slotWork * share) / 1000, total: slots },
      network: { used: bytes * share, total: networkOf(node) * context.boost },
      credits:
        node.family === 'burstable'
          ? { balance: node.credits, rate: BURST_BASELINE * vcpu - used }
          : null,
    },
    throttled,
    swapping,
  }
}

/* ---------- Database and Read Replica ---------- */

/** Extra latency on a read query that misses the buffer cache. */
const DISK_READ_MS = 8

export type DatabaseContext = Readonly<{
  game: Game
  node: GameNode
  arriving: Readonly<
    Partial<Record<'q-read' | 'q-write' | 'q-search' | 'blob-put' | 'q-tx' | 'blob-get', number>>
  >
  boost: number
}>

export const databaseModel = (context: DatabaseContext): NodeModel & { disk: boolean } => {
  const { game, node, arriving } = context
  const vcpu = vcpuOf(node) * context.boost
  const ram = ramOf(node) * context.boost
  const workingSet = LOCAL_DB_RAM + game.users * LOCAL_DB_RAM_PER_USER
  const disk = workingSet > ram - OS_RAM
  const throttled = node.family === 'burstable' && node.credits < 1
  const cores = throttled ? BURST_BASELINE * vcpu : vcpu
  const perRequest = Math.min(1, cores)
  const warmth = 0.5 + 0.5 * node.warm
  // A Slow query incident: every read scans the table until someone adds the index.
  const scan =
    game.incident?.kind === 'slow-query' ? game.users * ROWS_PER_USER * UNINDEXED_MS_PER_ROW : 0
  const readCpu = ((QUERY_CPU['q-read'] + scan) * (disk ? 1.5 : 1)) / warmth
  const writeCpu = QUERY_CPU['q-write'] / warmth
  // Postgres full-text search and files stored as rows: both work, both badly at volume.
  const searchCpu = (QUERY_CPU['q-search'] * queryFactor(game, 'q-search')) / warmth
  const putCpu = QUERY_CPU['blob-put'] / warmth
  const txCpu = QUERY_CPU['q-tx'] / warmth
  const getCpu = QUERY_CPU['blob-get'] / warmth
  const reads = arriving['q-read'] ?? 0
  const writes = arriving['q-write'] ?? 0
  const searches = arriving['q-search'] ?? 0
  const puts = arriving['blob-put'] ?? 0
  const txs = arriving['q-tx'] ?? 0
  const gets = arriving['blob-get'] ?? 0
  let rate = reads + writes + searches + puts
  let work = reads * readCpu + writes * writeCpu + searches * searchCpu + puts * putCpu
  // Checkouts and files read back from rows arrive with Series A.
  if (txs > 0 || gets > 0) {
    rate += txs + gets
    work += txs * txCpu + gets * getCpu
  }
  const utilization = cores > 0 ? work / (cores * 1000) : rate > 0 ? 99 : 0
  const wait = rate > 0 ? waitFor(work / rate / perRequest, utilization, cores) : 0
  const share = utilization > 1 ? 1 / utilization : 1
  const used = Math.min(work * share, cores * 1000) / 1000
  return {
    utilization,
    limit: utilization <= 0 ? 'none' : throttled ? 'credits' : disk ? 'disk' : 'cpu',
    share,
    capacity: rate > 0 ? rate / Math.max(utilization, 1e-9) : 0,
    service: {
      'q-read': { fixed: 2.5 + (disk ? DISK_READ_MS : 0), variable: readCpu / perRequest + wait },
      'q-write': { fixed: 2.5, variable: writeCpu / perRequest + wait },
      'q-search': { fixed: 2.5, variable: searchCpu / perRequest + wait },
      'blob-put': { fixed: 2.5, variable: putCpu / perRequest + wait },
      'q-tx': { fixed: 2.5, variable: txCpu / perRequest + wait },
      'blob-get': { fixed: 2.5 + DISK_READ_MS, variable: getCpu / perRequest + wait },
    },
    tailP: 0,
    tailMs: 0,
    processes: 0,
    inflight: 0,
    resources: {
      cpu: { used, total: cores },
      ram: { used: Math.min(workingSet + OS_RAM, ram), total: ram },
      slots: null,
      network: null,
      credits:
        node.family === 'burstable'
          ? { balance: node.credits, rate: BURST_BASELINE * vcpu - used }
          : null,
    },
    throttled,
    swapping: false,
    disk,
  }
}

/* ---------- Components with a flat capacity ---------- */

/** Requests per second for Components without an instance type. */
export const FLAT_CAPACITY: Readonly<Record<string, number>> = {
  lb: 2_000,
  cache: 50_000,
  pooler: 10_000,
  search: 400,
  queue: 20_000,
  waf: 5_000,
}

export const flatModel = (
  capacity: number,
  arriving: Readonly<Record<string, number>>,
  service: Service,
  boost: number,
): NodeModel => {
  const rate = total(arriving)
  const utilization = capacity === Number.POSITIVE_INFINITY ? 0 : rate / (capacity * boost)
  const share = utilization > 1 ? 1 / utilization : 1
  const wait = waitFor(service.variable, utilization, 1)
  const entry = { fixed: service.fixed, variable: service.variable + wait }
  return {
    utilization,
    limit: utilization <= 0 ? 'none' : 'throughput',
    share,
    capacity: capacity * boost,
    service: Object.fromEntries(Object.keys(arriving).map((kind) => [kind, entry])),
    tailP: 0,
    tailMs: 0,
    processes: 0,
    inflight: 0,
    resources: NO_RESOURCES,
    throttled: false,
    swapping: false,
  }
}
