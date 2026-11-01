import {
  ANALYTICS_CAPACITY,
  CACHE_ENGINES,
  CACHE_OPS,
  CACHE_TTLS,
  COMPONENTS,
  DIURNAL_AMPLITUDE,
  CALENDAR_START,
  FRAMEWORKS,
  HOT_KB_PER_USER,
  INSIGHT_YIELD,
  KINDS,
  LANGUAGES,
  MAX_CONNECTIONS,
  P2C_CAPACITY,
  P2C_IMBALANCE,
  POOLER_CONNECTIONS,
  MIGRATION_BUGS,
  PROFILES,
  REQUEST_KINDS,
  RPS_PER_USER,
  RUNTIMES,
  SAMPLE_OVERHEAD,
  LINK_TIMEOUT,
  SESSION_STATE_CRASHES,
  WEEKEND_FACTOR,
  type Kind,
  type RequestKind,
} from './catalog.ts'
import {
  FLAT_CAPACITY,
  NO_RESOURCES,
  callsOf,
  databaseModel,
  flatModel,
  serverModel,
  type Calls,
  type NodeModel,
} from './capacity.ts'
import {
  ERROR_CAUSES,
  NO_FAILURES,
  answered,
  attemptsFor,
  heldFor,
  retried,
  timedOut,
  apdexOf,
  blend,
  failed,
  failSome,
  hop,
  meanOf,
  percentile,
  through,
  type ErrorCause,
  type Outcome,
} from './distribution.ts'
import { marketOf, mixOf, payloadFactor, subscriptionsOf, valueFactor } from './features.ts'
import type { KindLedger, Ledger, LinkLedger, NodeLedger, NodeStatus } from './ledger.ts'
import {
  burnOf,
  flatScale,
  grown,
  has,
  hopMs,
  isDown,
  languageOf,
  sampleIndex,
  transferMs,
} from './lookups.ts'
import { buggy } from './migration.ts'
import type { Game, GameLink, GameNode } from './state.ts'
import { badDeployShare, fixed, payrollOf } from './team.ts'

/* ==========================================================================
   The flow solve: turns a Design and the current demand into the Ledger.

   Requests walk the graph from Users in topological order. Each Node takes
   what its capacity allows and sends the rest of the work on. An App Server's
   capacity depends on how long its database calls take, and the database's
   latency depends on how much the App Servers send, so the solve repeats the
   walk a few times and blends the call latencies until they settle.
   ========================================================================== */

const PASSES = 6
/** Replication lag: a floor, plus milliseconds per write per second to replay (16 D12). */
const REPLICA_LAG_MS = 20
const REPLICA_LAG_PER_WRITE = 2

type Rates = Partial<Record<Kind, number>>

/* ---------- demand and the calendar ---------- */

/** Minutes since the calendar began. One sim second is one calendar minute. */
export const calendarMinute = (time: number): number => CALENDAR_START + time

export const clockOf = (time: number) => {
  const minute = calendarMinute(time)
  return {
    day: Math.floor(minute / 1440) + 1,
    hour: Math.floor((minute % 1440) / 60),
    minute: Math.floor(minute % 60),
  }
}

const PI = 3.141592653589793

/** Taylor series of cos and sin around 0, exact to double precision on [−π/4, π/4]. */
const cosSeries = (x: number): number => {
  const xx = x * x
  let term = 1
  let sum = 1
  for (let n = 2; n <= 20; n += 2) {
    term *= -xx / ((n - 1) * n)
    sum += term
  }
  return sum
}
const sinSeries = (x: number): number => {
  const xx = x * x
  let term = x
  let sum = x
  for (let n = 3; n <= 21; n += 2) {
    term *= -xx / ((n - 1) * n)
    sum += term
  }
  return sum
}

/**
 * cos(2π × turns) with only + − × ÷ and floor, so every engine gets the same
 * bits (04 "Determinism"). The angle folds into [0, π/4] by symmetry first.
 */
export const cosTurns = (turns: number): number => {
  const t = turns - Math.floor(turns)
  // cos is even and has period 1 in turns: fold to [0, 1/2].
  const half = t > 0.5 ? 1 - t : t
  // cos(π − x) = −cos(x): fold to [0, 1/4].
  const sign = half > 0.25 ? -1 : 1
  const quarter = half > 0.25 ? 0.5 - half : half
  // cos(x) = sin(π/2 − x): fold to [0, 1/8].
  return quarter > 0.125
    ? sign * sinSeries((0.25 - quarter) * 2 * PI)
    : sign * cosSeries(quarter * 2 * PI)
}

/** The daily cycle: 1 + A × cos(2π × (hour − 20) / 24). */
export const diurnal = (time: number): number => {
  const minute = calendarMinute(time) % 1440
  return 1 + DIURNAL_AMPLITUDE * cosTurns((minute - 20 * 60) / 1440)
}

/** The weekly cycle: weekdays 1, Saturday and Sunday the weekend factor. Day 1 is a Monday. */
export const weekly = (time: number): number => {
  const day = Math.floor(calendarMinute(time) / 1440) % 7
  return day >= 5 ? WEEKEND_FACTOR : 1
}

export const demandOf = (game: Game): Partial<Record<RequestKind, number>> => {
  const mix = mixOf(game)
  const spike = game.incident?.kind === 'spike' ? game.incident.magnitude : 1
  const cycle = game.sandbox ? 1 : diurnal(game.time) * weekly(game.time)
  const total = game.users * RPS_PER_USER * cycle * spike
  const demand: Partial<Record<RequestKind, number>> = {}
  for (const kind of REQUEST_KINDS) {
    const share = mix[kind] ?? 0
    if (share > 0) demand[kind] = total * share
  }
  return demand
}

/* ---------- the graph ---------- */

const accepts = (node: GameNode, kind: Kind): boolean =>
  COMPONENTS[node.type].accepts.includes(kind)

type Graph = Readonly<{
  byId: ReadonlyMap<string, GameNode>
  /** Each routing Link, by `from>to`. */
  links: ReadonlyMap<string, GameLink>
  routes: ReadonlyMap<string, ReadonlyArray<GameNode>>
  parents: ReadonlyMap<string, ReadonlyArray<GameNode>>
  taps: ReadonlyMap<string, ReadonlyArray<string>>
  order: ReadonlyArray<GameNode>
  /** DNS drops dead hosts after its TTL, and Load Balancers check deep, only with Health checks. */
  healthChecked: boolean
  /** Sim seconds, so a Load Balancer or DNS notices a dead Node late. */
  time: number
}>

const graphOf = (game: Game): Graph => {
  const byId = new Map(game.nodes.map((node) => [node.id, node]))
  const routes = new Map<string, Array<GameNode>>()
  const parents = new Map<string, Array<GameNode>>()
  const taps = new Map<string, Array<string>>()
  const links = new Map<string, GameLink>()
  for (const link of game.links) {
    const from = byId.get(link.from)
    const to = byId.get(link.to)
    if (!from || !to) continue
    if (COMPONENTS[to.type].tap) {
      taps.set(to.id, [...(taps.get(to.id) ?? []), from.id])
    } else {
      links.set(`${from.id}>${to.id}`, link)
      routes.set(from.id, [...(routes.get(from.id) ?? []), to])
      parents.set(to.id, [...(parents.get(to.id) ?? []), from])
    }
  }
  // Kahn's order over routing links. A Node caught in a cycle never runs.
  const indegree = new Map(game.nodes.map((node) => [node.id, parents.get(node.id)?.length ?? 0]))
  const order: Array<GameNode> = []
  const ready = game.nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0)
  while (ready.length > 0) {
    const node = ready.shift() as GameNode
    order.push(node)
    for (const child of routes.get(node.id) ?? []) {
      const left = (indegree.get(child.id) ?? 0) - 1
      indegree.set(child.id, left)
      if (left === 0) ready.push(child)
    }
  }
  return {
    byId,
    links,
    routes,
    parents,
    taps,
    order,
    healthChecked: has(game, 'health-checks'),
    time: game.time,
  }
}

/** A Link's timeout in ms and whether it retries. Every Link waits 30 s and never retries until Timeouts and retries. */
const policyOf = (
  game: Game,
  graph: Graph,
  from: string,
  to: string,
): Readonly<{ timeout: number; naive: boolean }> => {
  const link = graph.links.get(`${from}>${to}`)
  if (!link || !has(game, 'timeouts')) return { timeout: LINK_TIMEOUT * 1000, naive: false }
  return { timeout: link.timeout * 1000, naive: link.retries === 'naive' }
}

const delegates = (graph: Graph, node: GameNode): boolean =>
  (graph.routes.get(node.id) ?? []).some((child) => accepts(child, 'auth'))

const runsLocalDb = (graph: Graph, node: GameNode): boolean =>
  node.localDb &&
  !(graph.routes.get(node.id) ?? []).some(
    (child) => accepts(child, 'q-read') || accepts(child, 'q-write'),
  )

/** CPU overhead from Analytics sampling a Node: the highest rate of any tap on it. */
const samplingOf = (game: Game, graph: Graph, node: GameNode): number => {
  let overhead = 0
  for (const [tapId, sources] of graph.taps) {
    if (!sources.includes(node.id)) continue
    const tap = graph.byId.get(tapId)
    if (tap) overhead = Math.max(overhead, SAMPLE_OVERHEAD[sampleIndex(tap)] ?? 0)
  }
  return overhead
}

/* ---------- one pass ---------- */

type Pass = Readonly<{
  arriving: ReadonlyMap<string, Rates>
  models: ReadonlyMap<string, NodeModel & { disk?: boolean }>
  hits: ReadonlyMap<string, number>
  /** Share of each Cache's hits that are stale. */
  staleHits: ReadonlyMap<string, number>
  stranded: ReadonlyMap<string, Readonly<{ rate: number; kinds: ReadonlySet<Kind> }>>
  links: ReadonlyMap<string, Rates>
  connections: ReadonlyMap<string, Readonly<{ used: number; max: number }>>
  /** Milliseconds replicas lag behind the primary. */
  lag: number
  /** Share of replica reads that are stale. */
  staleShare: number
}>

type Inputs = Readonly<{
  game: Game
  graph: Graph
  demand: Partial<Record<RequestKind, number>>
  boost: string | null
  callLatency: ReadonlyMap<string, Calls>
  inflight: ReadonlyMap<string, number>
  weights: ReadonlyMap<string, number>
  /** Share of calls that fail on each retrying Link, by `from>to:kind`, from the last pass. */
  failures: ReadonlyMap<string, number>
  /** Capacity each Node had on paper at the start of the solve: what a weighted split sees. */
  nominal: ReadonlyMap<string, number>
  /** App Servers whose database is down or overloaded: a deep health check takes them out. */
  sick: ReadonlySet<string>
}>

const NO_CALLS: Calls = { reads: 0, writes: 0, auth: 0 }

/** Requests per second of a flat Component at its size. */
const flatCapacity = (node: GameNode): number => (FLAT_CAPACITY[node.type] ?? 0) * flatScale(node)

const modelFor = (
  inputs: Inputs,
  node: GameNode,
  arriving: Rates,
): NodeModel & { disk?: boolean } => {
  const { game, graph } = inputs
  const boost = inputs.boost === node.id ? 2 : 1
  switch (node.type) {
    case 'server':
      return serverModel({
        game,
        node,
        arriving,
        callLatency: inputs.callLatency.get(node.id) ?? NO_CALLS,
        delegated: delegates(graph, node),
        local: runsLocalDb(graph, node),
        inflight: inputs.inflight.get(node.id) ?? 0,
        boost,
        sampling: samplingOf(game, graph, node),
        hashing: game.incident?.kind === 'loop' ? 4 : 1,
      })
    case 'database':
    case 'replica':
      return databaseModel({ game, node, arriving, boost })
    case 'lb':
      return flatModel(
        flatCapacity(node) *
          (node.policy === 'p2c' && has(game, 'lb-algorithms') ? P2C_CAPACITY : 1),
        arriving,
        { fixed: 1, variable: 0.1 },
        boost,
      )
    case 'cache':
      return flatModel(cacheCapacity(node), arriving, { fixed: 0.5, variable: 0.2 }, boost)
    case 'pooler':
      return flatModel(flatCapacity(node), arriving, { fixed: 0.3, variable: 0 }, boost)
    case 'auth':
      return flatModel(Number.POSITIVE_INFINITY, arriving, { fixed: 120, variable: 15 }, 1)
    case 'users':
      return flatModel(Number.POSITIVE_INFINITY, arriving, { fixed: 30, variable: 0 }, 1)
    case 'dns':
      return flatModel(Number.POSITIVE_INFINITY, arriving, { fixed: 0, variable: 0 }, 1)
    case 'analytics':
    case 'payments':
      return flatModel(Number.POSITIVE_INFINITY, {}, { fixed: 0, variable: 0 }, 1)
  }
}

/** Redis answers on one main thread; Memcached on every core of its box. */
const cacheCapacity = (node: GameNode): number =>
  CACHE_OPS * (CACHE_ENGINES[node.engine].scales ? Math.max(1, grown(1, 2, node.size - 3)) : 1)

/** The TTL class a Cache's TTL falls in. */
export const cacheTtlOf = (ttl: number) =>
  ttl <= 10 ? CACHE_TTLS[0] : ttl < 3_600 ? CACHE_TTLS[1] : CACHE_TTLS[2]

/** Share of read queries a Cache answers: sqrt(memory / hot data) × TTL × invalidation × warmth. */
export const hitRatioOf = (game: Game, node: GameNode, writeShare: number): number => {
  const memory = flatScale(node)
  const hot = (game.users * HOT_KB_PER_USER) / 1_000_000
  const fits = hot > 0 ? Math.min(1, memory / hot) : 1
  return (
    Math.sqrt(fits) * cacheTtlOf(node.ttl).factor * (1 - Math.min(0.5, 2 * writeShare)) * node.warm
  )
}

/** Requests per second a Node could take with the Era's mix, for splitting traffic. */
const probeCapacity = (inputs: Inputs, node: GameNode): number => {
  const mix = mixOf(inputs.game)
  const probe: Rates =
    node.type === 'server'
      ? Object.fromEntries(REQUEST_KINDS.map((kind) => [kind, mix[kind] ?? 0]))
      : node.type === 'database' || node.type === 'replica'
        ? { 'q-read': 1 }
        : {}
  if (Object.keys(probe).length === 0)
    return FLAT_CAPACITY[node.type] === undefined ? 1_000 : flatCapacity(node)
  const model = modelFor(inputs, node, probe)
  return model.utilization > 0 ? 1 / model.utilization : 1_000
}

const forward = (inputs: Inputs): Pass => {
  const { game, graph, demand } = inputs
  const arriving = new Map<string, Rates>(game.nodes.map((node) => [node.id, {}]))
  const models = new Map<string, NodeModel & { disk?: boolean }>()
  const hits = new Map<string, number>()
  const staleHits = new Map<string, number>()
  const stranded = new Map<string, { rate: number; kinds: Set<Kind> }>()
  const links = new Map<string, Rates>()

  const split = (node: GameNode, kind: Kind): ReadonlyArray<readonly [GameNode, number]> =>
    splitOf(inputs, node, kind)

  const route = (node: GameNode, kind: Kind, rate: number) => {
    if (rate <= 0) return
    const targets = split(node, kind)
    if (targets.length === 0) {
      const entry = stranded.get(node.id) ?? { rate: 0, kinds: new Set<Kind>() }
      entry.rate += rate
      entry.kinds.add(kind)
      stranded.set(node.id, entry)
      return
    }
    for (const [child, weight] of targets) {
      const key = `${node.id}>${child.id}`
      // Naive retries resend what failed, up to three times: the callee sees more.
      const amplified = policyOf(game, graph, node.id, child.id).naive
        ? attemptsFor(inputs.failures.get(`${key}:${kind}`) ?? 0)
        : 1
      const sent = rate * weight * amplified
      const into = arriving.get(child.id) ?? {}
      into[kind] = (into[kind] ?? 0) + sent
      arriving.set(child.id, into)
      const carried = links.get(key) ?? {}
      carried[kind] = (carried[kind] ?? 0) + sent
      links.set(key, carried)
    }
  }

  for (const node of graph.order) {
    const rates = node.type === 'users' ? { ...demand } : (arriving.get(node.id) ?? {})
    arriving.set(node.id, rates)
    const model = modelFor(inputs, node, rates)
    models.set(node.id, model)
    const share = isDown(node) ? 0 : model.share
    const delegated = node.type === 'server' && delegates(graph, node)
    const local = node.type === 'server' && runsLocalDb(graph, node)

    if (node.type === 'cache') {
      const reads = rates['q-read'] ?? 0
      const writes = rates['q-write'] ?? 0
      const writeShare = reads + writes > 0 ? writes / (reads + writes) : 0
      hits.set(node.id, hitRatioOf(game, node, writeShare))
      staleHits.set(node.id, cacheTtlOf(node.ttl).stale * writeShare)
    }

    for (const kind of Object.keys(rates) as Array<Kind>) {
      const processed = (rates[kind] ?? 0) * share
      if (processed <= 0) continue
      switch (node.type) {
        case 'users':
        case 'dns':
        case 'lb':
        case 'pooler':
          route(node, kind, processed)
          break
        case 'server': {
          if (local) break
          const calls = callsOf(game, node, kind as RequestKind, delegated)
          route(node, 'q-read', processed * calls.reads)
          route(node, 'q-write', processed * calls.writes)
          route(node, 'auth', processed * calls.auth)
          break
        }
        case 'cache':
          route(
            node,
            kind,
            kind === 'q-read' ? processed * (1 - (hits.get(node.id) ?? 0)) : processed,
          )
          break
        default:
          break
      }
    }
  }

  // Every app process holds its own pool to each database it reaches.
  const connectionsIn = new Map<string, number>()
  const connectionsOut = (node: GameNode): number => {
    switch (node.type) {
      case 'server': {
        if (runsLocalDb(graph, node)) return 0
        const surge = game.incident?.kind === 'connections' ? 2 : 1
        return (models.get(node.id)?.processes ?? 0) * RUNTIMES[node.runtime].connections * surge
      }
      case 'cache':
        return connectionsIn.get(node.id) ?? 0
      // Session mode holds a server connection per client; transaction mode shares a few.
      case 'pooler':
        return node.mode === 'session'
          ? (connectionsIn.get(node.id) ?? 0)
          : Math.min(POOLER_CONNECTIONS, connectionsIn.get(node.id) ?? 0)
      default:
        return 0
    }
  }
  for (const node of graph.order) {
    const out = connectionsOut(node)
    if (out <= 0) continue
    for (const child of graph.routes.get(node.id) ?? []) {
      if (!accepts(child, 'q-read') && !accepts(child, 'q-write')) continue
      connectionsIn.set(child.id, (connectionsIn.get(child.id) ?? 0) + out)
    }
  }
  const connections = new Map<string, { used: number; max: number }>()
  let writes = 0
  for (const node of game.nodes) {
    if (node.type !== 'database' && node.type !== 'replica') continue
    connections.set(node.id, {
      used: connectionsIn.get(node.id) ?? 0,
      max: MAX_CONNECTIONS * (inputs.boost === node.id ? 2 : 1),
    })
    writes += arriving.get(node.id)?.['q-write'] ?? 0
  }

  return {
    arriving,
    models,
    hits,
    staleHits,
    stranded,
    links,
    connections,
    lag: REPLICA_LAG_MS + REPLICA_LAG_PER_WRITE * writes,
    staleShare: Math.min(0.15, (REPLICA_LAG_MS + REPLICA_LAG_PER_WRITE * writes) / 1000),
  }
}

/** Whether a Node is down and the router in front of it has noticed. Planned restarts drain first. */
const noticed = (graph: Graph, child: GameNode, after: number): boolean =>
  isDown(child) && (child.downCause === 'restart' || graph.time - child.downAt >= after)

/** The kinds a Link carries: an L7 Load Balancer Link can carry only some. */
const carries = (graph: Graph, node: GameNode, child: GameNode, kind: Kind): boolean => {
  const kinds = graph.links.get(`${node.id}>${child.id}`)?.kinds
  return node.type !== 'lb' || !kinds || (kinds as ReadonlyArray<Kind>).includes(kind)
}

const splitOf = (
  inputs: Inputs,
  node: GameNode,
  kind: Kind,
): ReadonlyArray<readonly [GameNode, number]> => {
  const { game, graph } = inputs
  const takers = (graph.routes.get(node.id) ?? []).filter(
    (child) => accepts(child, kind) && carries(graph, node, child, kind),
  )
  if (takers.length === 0) return []
  const even = (live: ReadonlyArray<GameNode>) =>
    live.map((child) => [child, 1 / live.length] as const)
  if (node.type === 'dns') {
    // DNS round robin splits evenly. With health checks, a dead host leaves once its TTL runs out.
    const live = graph.healthChecked
      ? takers.filter((child) => !noticed(graph, child, node.ttl))
      : takers
    return even(live.length > 0 ? live : takers)
  }
  if (node.type !== 'lb') return weighted(takers, (child) => inputs.weights.get(child.id))
  // A Load Balancer notices a dead host at its next health check. A deep check also takes out
  // servers whose database is down or overloaded, even when that leaves none.
  const up = takers.filter((child) => !noticed(graph, child, node.checkEvery))
  const checked = up.length > 0 ? up : takers
  const healthy =
    node.deepCheck && graph.healthChecked
      ? checked.filter((child) => !inputs.sick.has(child.id))
      : checked
  if (healthy.length === 0) return []
  // A dead host the checks have not caught yet still looks as big as it was.
  const live = (child: GameNode) =>
    isDown(child) ? inputs.nominal.get(child.id) : inputs.weights.get(child.id)
  const policy =
    has(game, 'lb-algorithms') || node.policy === 'round-robin' ? node.policy : 'weighted'
  switch (policy) {
    case 'round-robin':
      return even(healthy)
    case 'weighted':
      return weighted(healthy, (child) => inputs.nominal.get(child.id))
    case 'least-conn':
      return weighted(healthy, live)
    case 'p2c': {
      const spread = 1 / healthy.length
      return weighted(healthy, live).map(
        ([child, share]) => [child, (1 - P2C_IMBALANCE) * share + P2C_IMBALANCE * spread] as const,
      )
    }
  }
}

/** Shares proportional to each target's capacity. */
const weighted = (
  targets: ReadonlyArray<GameNode>,
  weightOf: (child: GameNode) => number | undefined,
): ReadonlyArray<readonly [GameNode, number]> => {
  const raw = targets.map((child) => {
    const weight = weightOf(child) ?? 1
    return Number.isFinite(weight) ? Math.max(weight, 1e-6) : 1e9
  })
  const sum = raw.reduce((total, weight) => total + weight, 0)
  return targets.map((child, index) => [child, (raw[index] ?? 0) / sum] as const)
}

/* ---------- outcomes ---------- */

const outcomesOf = (inputs: Inputs, pass: Pass) => {
  const { game, graph } = inputs
  const memo = new Map<string, Outcome>()

  const ownHop = (node: GameNode, kind: Kind, value = 1) => {
    const model = pass.models.get(node.id)
    const service = model?.service[kind] ?? { fixed: COMPONENTS[node.type].latency, variable: 0 }
    return hop({
      share: model?.share ?? 1,
      fixed: service.fixed,
      variable: service.variable,
      tailP: model?.tailP ?? 0,
      tailMs: model?.tailMs ?? 0,
      value,
    })
  }

  /** One attempt on a Link: the callee's outcome cut at the Link's timeout. */
  const attempt = (node: GameNode, child: GameNode, kind: Kind): Outcome =>
    timedOut(outcome(child, kind), policyOf(game, graph, node.id, child.id).timeout)

  /** A call on a Link: one attempt, and the retries if the Link retries. */
  const call = (node: GameNode, child: GameNode, kind: Kind): Outcome => {
    const policy = policyOf(game, graph, node.id, child.id)
    const once = attempt(node, child, kind)
    return policy.naive ? retried(once, policy.timeout) : once
  }

  /** Share of attempts that fail on a Link, which drives naive retries. */
  const failureOn = (node: GameNode, child: GameNode, kind: Kind): number =>
    1 - attempt(node, child, kind).success

  /** What one request of `kind` sent from `node` to its targets gets back. */
  const downstream = (node: GameNode, kind: Kind, extraHop = 0): Outcome => {
    const mixed = blend(
      splitOf(inputs, node, kind).map(([child, weight]) => [call(node, child, kind), weight]),
    )
    if (!mixed) return failed('stranded')
    return extraHop > 0 ? through(hop({ fixed: extraHop }), [[mixed, 1]]) : mixed
  }

  /** Milliseconds a caller holds its slot for one call: E[min(X, T)] per attempt, times the attempts. */
  const held = (node: GameNode, kind: Kind, extraHop = 0): number =>
    splitOf(inputs, node, kind).reduce((total, [child, weight]) => {
      const policy = policyOf(game, graph, node.id, child.id)
      const attempts = policy.naive ? attemptsFor(failureOn(node, child, kind)) : 1
      const each = heldFor(outcome(child, kind), policy.timeout) + extraHop
      return total + weight * attempts * Math.min(policy.timeout, each)
    }, 0)

  const outcome = (node: GameNode, kind: Kind): Outcome => {
    const key = `${node.id}:${kind}`
    const cached = memo.get(key)
    if (cached) return cached
    const result = ((): Outcome => {
      // A Node the kernel killed for memory fails as `oom` until it is back.
      if (isDown(node)) return failed(node.downCause === 'oom' ? 'oom' : 'down')
      switch (node.type) {
        case 'users':
        case 'dns':
        case 'lb':
          return through(ownHop(node, kind), [[downstream(node, kind), 1]])
        case 'pooler':
          // Transaction pooling breaks code that keeps session state, until a task removes it.
          return failSome(
            through(ownHop(node, kind), [[downstream(node, kind), 1]]),
            node.mode === 'transaction' && !fixed(game, 'session-state')
              ? SESSION_STATE_CRASHES
              : 0,
            'crash',
          )
        case 'server': {
          const requestKind = kind as RequestKind
          const served = ownHop(node, kind, FRAMEWORKS[node.framework].value[requestKind] ?? 1)
          // The response crosses the user's downlink: bytes over bandwidth.
          const own = {
            ...served,
            fixed: served.fixed + transferMs(node, requestKind) * payloadFactor(game, requestKind),
          }
          // A bad deploy, or a migration's bugs, make the code itself fail some requests.
          const crashes =
            (game.incident?.kind === 'bad-deploy' ? badDeployShare(game) : 0) +
            (buggy(game, node) ? MIGRATION_BUGS : 0)
          if (runsLocalDb(graph, node)) return failSome(through(own), crashes, 'crash')
          const calls = callsOf(game, node, requestKind, delegates(graph, node))
          return failSome(
            through(
              own,
              [
                [downstream(node, 'q-read', hopMs(game)), calls.reads],
                [downstream(node, 'q-write', hopMs(game)), calls.writes],
                [downstream(node, 'auth', hopMs(game)), calls.auth],
              ],
              requestKind === 'read',
            ),
            crashes,
            'crash',
          )
        }
        case 'cache': {
          if (kind !== 'q-read') return through(ownHop(node, kind), [[downstream(node, kind), 1]])
          const hit = pass.hits.get(node.id) ?? 0
          const mixed = blend([
            [{ ...answered(0, 0), stale: pass.staleHits.get(node.id) ?? 0 }, hit],
            [downstream(node, kind, hopMs(game)), 1 - hit],
          ])
          return through(ownHop(node, kind), mixed ? [[mixed, 1]] : [])
        }
        case 'database':
        case 'replica': {
          const pool = pass.connections.get(node.id)
          const refused = pool && pool.used > pool.max ? 1 - pool.max / pool.used : 0
          const reply: Outcome = {
            ...answered(0, 0),
            success: 1 - refused,
            stale: node.type === 'replica' && kind === 'q-read' ? pass.staleShare : 0,
            fail: { ...NO_FAILURES, refused },
          }
          return through(ownHop(node, kind), [[reply, 1]])
        }
        case 'auth':
          return through(ownHop(node, kind))
        case 'analytics':
        case 'payments':
          return failed('stranded')
      }
    })()
    memo.set(key, result)
    return result
  }

  return { outcome, downstream, held, failureOn }
}

/* ---------- the solve ---------- */

const statusOf = (
  node: GameNode,
  inbound: number,
  utilization: number,
  trouble: boolean,
): NodeStatus =>
  isDown(node)
    ? 'down'
    : inbound <= 0
      ? 'idle'
      : utilization >= 0.9
        ? 'danger'
        : utilization >= 0.7 || trouble
          ? 'warn'
          : 'ok'

/** A deep health check fails when a database behind the server is down or overloaded. */
const databaseSick = (graph: Graph, pass: Pass, server: GameNode): boolean => {
  const seen = new Set<string>()
  const visit = (node: GameNode): boolean =>
    (graph.routes.get(node.id) ?? []).some((child) => {
      if (seen.has(child.id) || !(accepts(child, 'q-read') || accepts(child, 'q-write')))
        return false
      seen.add(child.id)
      if (isDown(child)) return true
      if (
        (child.type === 'database' || child.type === 'replica') &&
        (pass.models.get(child.id)?.utilization ?? 0) >= 1
      )
        return true
      return visit(child)
    })
  return visit(server)
}

const sumRates = (rates: Rates): number =>
  Object.values(rates).reduce((total, rate) => total + (rate ?? 0), 0)

const solveWith = (game: Game, boost: string | null): Ledger => {
  const graph = graphOf(game)
  const demand = demandOf(game)
  let callLatency = new Map<string, Calls>()
  let inflight = new Map<string, number>()
  let weights = new Map<string, number>()
  let failures = new Map<string, number>()
  const nominal = new Map<string, number>()
  const sick = new Set<string>()
  const seed: Inputs = {
    game,
    graph,
    demand,
    boost,
    callLatency,
    inflight,
    weights,
    failures,
    nominal,
    sick,
  }
  for (const node of game.nodes) nominal.set(node.id, probeCapacity(seed, node))
  weights = new Map(nominal)

  let pass: Pass | null = null
  let outcomes: ReturnType<typeof outcomesOf> | null = null
  for (let index = 0; index < PASSES; index += 1) {
    const inputs: Inputs = {
      game,
      graph,
      demand,
      boost,
      callLatency,
      inflight,
      weights,
      failures,
      nominal,
      sick: new Set(sick),
    }
    pass = forward(inputs)
    outcomes = outcomesOf(inputs, pass)
    const nextLatency = new Map<string, Calls>()
    const nextInflight = new Map<string, number>()
    const nextWeights = new Map<string, number>()
    for (const node of game.nodes) {
      const model = pass.models.get(node.id)
      nextInflight.set(node.id, ((inflight.get(node.id) ?? 0) + (model?.inflight ?? 0)) / 2)
      const rate = sumRates(pass.arriving.get(node.id) ?? {})
      nextWeights.set(
        node.id,
        isDown(node) ? 0 : rate > 0 && model ? model.capacity : (weights.get(node.id) ?? 1),
      )
      if (node.type !== 'server') continue
      const previous = callLatency.get(node.id) ?? NO_CALLS
      const fresh = {
        reads: outcomes.held(node, 'q-read', hopMs(game)),
        writes: outcomes.held(node, 'q-write', hopMs(game)),
        auth: outcomes.held(node, 'auth', hopMs(game)),
      }
      nextLatency.set(
        node.id,
        index === 0
          ? fresh
          : {
              reads: (previous.reads + fresh.reads) / 2,
              writes: (previous.writes + fresh.writes) / 2,
              auth: (previous.auth + fresh.auth) / 2,
            },
      )
    }
    // Failure shares on retrying Links, blended like the call latencies.
    const nextFailures = new Map<string, number>()
    for (const [key, carried] of pass.links) {
      const [from, to] = key.split('>')
      const source = graph.byId.get(from ?? '')
      const target = graph.byId.get(to ?? '')
      if (!source || !target || !policyOf(game, graph, source.id, target.id).naive) continue
      for (const kind of Object.keys(carried) as Array<Kind>) {
        const fresh = outcomes.failureOn(source, target, kind)
        const previous = failures.get(`${key}:${kind}`)
        nextFailures.set(`${key}:${kind}`, previous === undefined ? fresh : (previous + fresh) / 2)
      }
    }
    // Once a deep check fails a server in a pass, it stays out for the solve: no flapping.
    for (const node of game.nodes)
      if (node.type === 'server' && databaseSick(graph, pass, node)) sick.add(node.id)
    callLatency = nextLatency
    inflight = nextInflight
    weights = nextWeights
    failures = nextFailures
  }
  if (!pass || !outcomes) throw new Error('The solve ran no passes.')
  return ledgerOf(game, graph, demand, pass, outcomes)
}

const ledgerOf = (
  game: Game,
  graph: Graph,
  demand: Partial<Record<RequestKind, number>>,
  pass: Pass,
  outcomes: ReturnType<typeof outcomesOf>,
): Ledger => {
  const users = game.nodes.find((node) => node.type === 'users')

  // What users get back, per kind.
  const kinds: Partial<Record<RequestKind, KindLedger>> = {}
  const errors: Record<ErrorCause, number> = { ...NO_FAILURES }
  const mixture: Array<readonly [Outcome, number]> = []
  let rateTotal = 0
  let served = 0
  let satisfied = 0
  let revenue = 0
  let latencyWeight = 0
  const failing: Array<RequestKind> = []
  for (const kind of REQUEST_KINDS) {
    const rate = demand[kind] ?? 0
    if (rate <= 0) continue
    const result = users ? outcomes.outcome(users, kind) : failed('stranded')
    const apdex = apdexOf(result, PROFILES[kind].apdex)
    rateTotal += rate
    served += rate * result.success
    satisfied += rate * result.success * apdex
    revenue +=
      rate * result.success * apdex * KINDS[kind].value * result.value * valueFactor(game, kind)
    latencyWeight += rate * result.success * meanOf(result)
    for (const cause of ERROR_CAUSES) errors[cause] += rate * result.fail[cause]
    if (result.success > 0) mixture.push([result, rate * result.success])
    if (result.success < 0.05 && result.fail.stranded >= 0.5) failing.push(kind)
    kinds[kind] = {
      rate,
      success: result.success,
      apdex,
      mean: meanOf(result),
      p50: percentile(result, 0.5),
      p95: percentile(result, 0.95),
      p99: percentile(result, 0.99),
    }
  }
  const overall = blend(mixture)

  // Node ledgers.
  const nodes: Record<string, NodeLedger> = {}
  for (const node of game.nodes) {
    const rates = pass.arriving.get(node.id) ?? {}
    const model = pass.models.get(node.id)
    const inbound = sumRates(rates)
    const share = isDown(node) ? 0 : (model?.share ?? 1)
    const pool = pass.connections.get(node.id) ?? null
    const refusedShare = pool && pool.used > pool.max ? 1 - pool.max / pool.used : 0
    const strand = pass.stranded.get(node.id)
    const out: Rates = {}
    for (const child of graph.routes.get(node.id) ?? []) {
      const carried = pass.links.get(`${node.id}>${child.id}`) ?? {}
      for (const [kind, rate] of Object.entries(carried) as Array<[Kind, number]>)
        out[kind] = (out[kind] ?? 0) + rate
    }
    const kindsHere = Object.keys(rates) as Array<Kind>
    const latency =
      inbound > 0 && model
        ? kindsHere.reduce((total, kind) => {
            const service = model.service[kind]
            return total + (rates[kind] ?? 0) * (service ? service.fixed + service.variable : 0)
          }, 0) / inbound
        : 0
    // The slowest 1% of this Node's own time, for its busiest kind.
    const busiest = kindsHere.reduce<Kind | null>(
      (best, kind) => (best === null || (rates[kind] ?? 0) > (rates[best] ?? 0) ? kind : best),
      null,
    )
    const own = busiest && model?.service[busiest]
    const p99 =
      inbound > 0 && model && own
        ? percentile(
            through(
              hop({
                fixed: own.fixed,
                variable: own.variable,
                tailP: model.tailP,
                tailMs: model.tailMs,
              }),
            ),
            0.99,
          )
        : 0
    const utilization =
      refusedShare > 0
        ? Math.max(model?.utilization ?? 0, 1 / (1 - refusedShare))
        : (model?.utilization ?? 0)
    nodes[node.id] = {
      inbound,
      capacity: model && inbound > 0 ? model.capacity : 0,
      utilization,
      limit: refusedShare > 0 ? 'connections' : (model?.limit ?? 'none'),
      latency,
      p99,
      dropped: inbound * (1 - share),
      refused: inbound * share * refusedShare,
      stranded: strand?.rate ?? 0,
      strandedKinds: strand ? [...strand.kinds] : [],
      connections: pool,
      hitRatio: node.type === 'cache' ? (pass.hits.get(node.id) ?? 0) : null,
      lag: node.type === 'replica' ? pass.lag : null,
      disk: model?.disk ?? false,
      out,
      resources: model?.resources ?? NO_RESOURCES,
      throttled: model?.throttled ?? false,
      swapping: model?.swapping ?? false,
      status: statusOf(node, inbound, utilization, (strand?.rate ?? 0) > 0 || refusedShare > 0),
    }
  }

  // Analytics turns sampled traffic into Insight.
  const apdex = rateTotal > 0 ? satisfied / rateTotal : 1
  let insight = 0
  for (const [tapId, sources] of graph.taps) {
    const tap = graph.byId.get(tapId)
    if (!tap) continue
    const rate = tap.sampleRate
    const volume = sources.reduce((total, source) => {
      const entry = nodes[source]
      return total + (entry ? entry.inbound - entry.dropped : 0)
    }, 0)
    const capacity = grown(ANALYTICS_CAPACITY, 2, tap.size - 1)
    const sampled = isDown(tap) ? 0 : Math.min(volume * rate, capacity)
    insight += sampled * INSIGHT_YIELD * (2 - apdex)
    nodes[tapId] = {
      ...(nodes[tapId] as NodeLedger),
      inbound: volume * rate,
      capacity,
      utilization: capacity > 0 ? (volume * rate) / capacity : 0,
      limit: volume * rate > capacity ? 'throughput' : 'none',
      status: statusOf(tap, volume, capacity > 0 ? (volume * rate) / capacity : 0, false),
    }
  }

  const links: Array<LinkLedger> = game.links.map((link) => {
    const to = graph.byId.get(link.to)
    if (to && COMPONENTS[to.type].tap) {
      const source = nodes[link.from]
      return {
        ...link,
        rate: source ? (source.inbound - source.dropped) * 0.15 : 0,
        kind: 'page',
        failing: false,
      }
    }
    const carried = pass.links.get(`${link.from}>${link.to}`) ?? {}
    const entries = Object.entries(carried) as Array<[Kind, number]>
    const top = entries.reduce<[Kind, number]>(
      (best, entry) => (entry[1] > best[1] ? entry : best),
      ['page', -1],
    )
    const target = nodes[link.to]
    return {
      ...link,
      rate: entries.reduce((total, [, rate]) => total + rate, 0),
      kind: top[0],
      failing:
        !!target && (target.status === 'down' || target.refused > 0 || target.dropped > 0.01),
    }
  })

  // Velocity: how fast the Stack ships, which sets the Team's Dev Hours.
  const servers = game.nodes.filter((node) => node.type === 'server')
  const traffic = servers.reduce((total, node) => total + (nodes[node.id]?.inbound ?? 0), 0)
  const velocity =
    servers.length === 0
      ? 1
      : servers.reduce((total, node) => {
          const weight = traffic > 0 ? (nodes[node.id]?.inbound ?? 0) / traffic : 1 / servers.length
          return (
            total +
            weight * LANGUAGES[languageOf(node)].velocity * FRAMEWORKS[node.framework].velocity
          )
        }, 0)

  const subscriptions = subscriptionsOf(game)
  const salaries = payrollOf(game)
  const errorTotal = ERROR_CAUSES.reduce((total, cause) => total + errors[cause], 0)
  return {
    nodes,
    links,
    kinds,
    demand: rateTotal,
    served,
    errors,
    errorShare: rateTotal > 0 ? errorTotal / rateTotal : 0,
    latency: served > 0 ? latencyWeight / served : 0,
    p50: overall ? percentile(overall, 0.5) : 0,
    p95: overall ? percentile(overall, 0.95) : 0,
    p99: overall ? percentile(overall, 0.99) : 0,
    apdex,
    revenue: revenue + subscriptions,
    subscriptions,
    insight,
    burn: game.nodes.reduce((total, node) => total + burnOf(game, node), 0) + salaries,
    salaries,
    market: marketOf(game),
    velocity,
    failing,
    bottleneck: null,
  }
}

/* ---------- the bottleneck ---------- */

const CANDIDATES = new Set(['server', 'database', 'replica', 'cache', 'lb', 'pooler'])

/**
 * The Node whose doubled capacity would earn the most: re-solve with each of
 * the three busiest Nodes boosted and keep the largest gain.
 */
export const bottleneckOf = (game: Game, base: Ledger): string | null => {
  const busiest = game.nodes
    .filter((node) => CANDIDATES.has(node.type) && !isDown(node))
    .map((node) => [node.id, base.nodes[node.id]?.utilization ?? 0] as const)
    .filter(([, utilization]) => utilization > 0.6)
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 3)
  let best: string | null = null
  let gain = Math.max(0.005, base.revenue * 0.01)
  for (const [id] of busiest) {
    const boosted = solveWith(game, id).revenue - base.revenue
    if (boosted > gain) {
      gain = boosted
      best = id
    }
  }
  return best
}

/* ---------- entry points ---------- */

const flows = new WeakMap<Game, Ledger>()
const marked = new WeakMap<Game, Ledger>()

/**
 * The Ledger without the bottleneck search: what each Step and each view
 * needs. The game runs the search once per sim second (04 "The bottleneck")
 * and keeps the answer itself. Cached per Game.
 */
export const solveFlow = (game: Game): Ledger => {
  const cached = flows.get(game)
  if (cached) return cached
  const ledger = solveWith(game, null)
  flows.set(game, ledger)
  return ledger
}

/** The full Ledger, with the bottleneck searched now. For tests and one-off checks. Cached per Game. */
export const solve = (game: Game): Ledger => {
  const cached = marked.get(game)
  if (cached) return cached
  const base = solveFlow(game)
  const ledger = { ...base, bottleneck: bottleneckOf(game, base) }
  marked.set(game, ledger)
  return ledger
}
