import {
  ANALYTICS_CAPACITY,
  COMPONENTS,
  DIURNAL_AMPLITUDE,
  CALENDAR_START,
  FRAMEWORKS,
  INSIGHT_YIELD,
  KINDS,
  LANGUAGES,
  MAX_CONNECTIONS,
  POOLER_CONNECTIONS,
  PROFILES,
  REQUEST_KINDS,
  RPS_PER_USER,
  RUNTIMES,
  SAMPLE_OVERHEAD,
  SAMPLE_RATES,
  WEEKEND_FACTOR,
  marketFor,
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
  apdexOf,
  blend,
  failed,
  hop,
  meanOf,
  percentile,
  through,
  type ErrorCause,
  type Outcome,
} from './distribution.ts'
import type { KindLedger, Ledger, LinkLedger, NodeLedger, NodeStatus } from './ledger.ts'
import { burnOf, eraOf, flatScale, grown, has, isDown, languageOf } from './lookups.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   The flow solve: turns a Design and the current demand into the Ledger.

   Requests walk the graph from Users in topological order. Each Node takes
   what its capacity allows and sends the rest of the work on. An App Server's
   capacity depends on how long its database calls take, and the database's
   latency depends on how much the App Servers send, so the solve repeats the
   walk a few times and blends the call latencies until they settle.
   ========================================================================== */

const PASSES = 6
/** Milliseconds for one internal network hop. */
const HOP_MS = 0.5
/** Share of cached reads a warm Redis answers before writes invalidate them. */
const CACHE_HIT = 0.85

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
  const era = eraOf(game)
  const spike = game.incident?.kind === 'spike' ? 3 : 1
  const cycle = game.sandbox ? 1 : diurnal(game.time) * weekly(game.time)
  const total = game.users * RPS_PER_USER * cycle * spike
  const demand: Partial<Record<RequestKind, number>> = {}
  for (const kind of REQUEST_KINDS) {
    const share = era.mix[kind] ?? 0
    if (share > 0) demand[kind] = total * share
  }
  return demand
}

/* ---------- the graph ---------- */

const accepts = (node: GameNode, kind: Kind): boolean =>
  COMPONENTS[node.type].accepts.includes(kind)

type Graph = Readonly<{
  byId: ReadonlyMap<string, GameNode>
  routes: ReadonlyMap<string, ReadonlyArray<GameNode>>
  parents: ReadonlyMap<string, ReadonlyArray<GameNode>>
  taps: ReadonlyMap<string, ReadonlyArray<string>>
  order: ReadonlyArray<GameNode>
  /** DNS answers only with live hosts. */
  healthChecked: boolean
}>

const graphOf = (game: Game): Graph => {
  const byId = new Map(game.nodes.map((node) => [node.id, node]))
  const routes = new Map<string, Array<GameNode>>()
  const parents = new Map<string, Array<GameNode>>()
  const taps = new Map<string, Array<string>>()
  for (const link of game.links) {
    const from = byId.get(link.from)
    const to = byId.get(link.to)
    if (!from || !to) continue
    if (COMPONENTS[to.type].tap) {
      taps.set(to.id, [...(taps.get(to.id) ?? []), from.id])
    } else {
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
  return { byId, routes, parents, taps, order, healthChecked: has(game, 'health-checks') }
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
    if (tap) overhead = Math.max(overhead, SAMPLE_OVERHEAD[tap.sample] ?? 0)
  }
  return overhead
}

/* ---------- one pass ---------- */

type Pass = Readonly<{
  arriving: ReadonlyMap<string, Rates>
  models: ReadonlyMap<string, NodeModel & { disk?: boolean }>
  hits: ReadonlyMap<string, number>
  stranded: ReadonlyMap<string, Readonly<{ rate: number; kinds: ReadonlySet<Kind> }>>
  links: ReadonlyMap<string, Rates>
  connections: ReadonlyMap<string, Readonly<{ used: number; max: number }>>
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
      return flatModel(flatCapacity(node), arriving, { fixed: 1, variable: 0.1 }, boost)
    case 'cache':
      return flatModel(flatCapacity(node), arriving, { fixed: 0.5, variable: 0.2 }, boost)
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

/** Requests per second a Node could take with the Era's mix, for splitting traffic. */
const probeCapacity = (inputs: Inputs, node: GameNode): number => {
  const mix = eraOf(inputs.game).mix
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
  const { game, graph, demand, weights } = inputs
  const arriving = new Map<string, Rates>(game.nodes.map((node) => [node.id, {}]))
  const models = new Map<string, NodeModel & { disk?: boolean }>()
  const hits = new Map<string, number>()
  const stranded = new Map<string, { rate: number; kinds: Set<Kind> }>()
  const links = new Map<string, Rates>()

  const split = (node: GameNode, kind: Kind): ReadonlyArray<readonly [GameNode, number]> =>
    splitOf(graph, weights, node, kind)

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
      const into = arriving.get(child.id) ?? {}
      into[kind] = (into[kind] ?? 0) + rate * weight
      arriving.set(child.id, into)
      const key = `${node.id}>${child.id}`
      const carried = links.get(key) ?? {}
      carried[kind] = (carried[kind] ?? 0) + rate * weight
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
      hits.set(node.id, CACHE_HIT * node.warm * (1 - Math.min(0.5, 2 * writeShare)))
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
      case 'pooler':
        return Math.min(POOLER_CONNECTIONS, connectionsIn.get(node.id) ?? 0)
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
    stranded,
    links,
    connections,
    staleShare: Math.min(0.15, 0.02 + 0.002 * writes),
  }
}

const splitOf = (
  graph: Graph,
  weights: ReadonlyMap<string, number>,
  node: GameNode,
  kind: Kind,
): ReadonlyArray<readonly [GameNode, number]> => {
  const takers = (graph.routes.get(node.id) ?? []).filter((child) => accepts(child, kind))
  if (takers.length === 0) return []
  // Load Balancers skip dead hosts; DNS does so only with health checks.
  const skips = node.type === 'lb' || (node.type === 'dns' && graph.healthChecked)
  const live =
    skips && takers.some((child) => !isDown(child))
      ? takers.filter((child) => !isDown(child))
      : takers
  // DNS round robin splits evenly.
  if (node.type === 'dns') return live.map((child) => [child, 1 / live.length] as const)
  const raw = live.map((child) => {
    const weight = weights.get(child.id) ?? 1
    return Number.isFinite(weight) ? Math.max(weight, 1e-6) : 1e9
  })
  const sum = raw.reduce((total, weight) => total + weight, 0)
  return live.map((child, index) => [child, (raw[index] ?? 0) / sum] as const)
}

/* ---------- outcomes ---------- */

const outcomesOf = (inputs: Inputs, pass: Pass) => {
  const { game, graph, weights } = inputs
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

  /** What one request of `kind` sent from `node` to its targets gets back. */
  const downstream = (node: GameNode, kind: Kind, extraHop = 0): Outcome => {
    const mixed = blend(
      splitOf(graph, weights, node, kind).map(([child, weight]) => [outcome(child, kind), weight]),
    )
    if (!mixed) return failed('stranded')
    return extraHop > 0 ? through(hop({ fixed: extraHop }), [[mixed, 1]]) : mixed
  }

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
          return through(ownHop(node, kind), [[downstream(node, kind), 1]])
        case 'server': {
          const requestKind = kind as RequestKind
          const own = ownHop(node, kind, FRAMEWORKS[node.framework].value[requestKind] ?? 1)
          if (runsLocalDb(graph, node)) return through(own)
          const calls = callsOf(game, node, requestKind, delegates(graph, node))
          return through(
            own,
            [
              [downstream(node, 'q-read', HOP_MS), calls.reads],
              [downstream(node, 'q-write', HOP_MS), calls.writes],
              [downstream(node, 'auth', HOP_MS), calls.auth],
            ],
            requestKind === 'read',
          )
        }
        case 'cache': {
          if (kind !== 'q-read') return through(ownHop(node, kind), [[downstream(node, kind), 1]])
          const hit = pass.hits.get(node.id) ?? 0
          const mixed = blend([
            [answered(0, 0), hit],
            [downstream(node, kind, HOP_MS), 1 - hit],
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

  return { outcome, downstream }
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

const sumRates = (rates: Rates): number =>
  Object.values(rates).reduce((total, rate) => total + (rate ?? 0), 0)

const solveWith = (game: Game, boost: string | null): Ledger => {
  const graph = graphOf(game)
  const demand = demandOf(game)
  let callLatency = new Map<string, Calls>()
  let inflight = new Map<string, number>()
  let weights = new Map<string, number>()
  const seed: Inputs = { game, graph, demand, boost, callLatency, inflight, weights }
  for (const node of game.nodes) weights.set(node.id, probeCapacity(seed, node))

  let pass: Pass | null = null
  let outcomes: ReturnType<typeof outcomesOf> | null = null
  for (let index = 0; index < PASSES; index += 1) {
    const inputs: Inputs = { game, graph, demand, boost, callLatency, inflight, weights }
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
        reads: meanOf(outcomes.downstream(node, 'q-read', HOP_MS)),
        writes: meanOf(outcomes.downstream(node, 'q-write', HOP_MS)),
        auth: meanOf(outcomes.downstream(node, 'auth', HOP_MS)),
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
    callLatency = nextLatency
    inflight = nextInflight
    weights = nextWeights
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
    revenue += rate * result.success * apdex * KINDS[kind].value * result.value
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
      dropped: inbound * (1 - share),
      refused: inbound * share * refusedShare,
      stranded: strand?.rate ?? 0,
      strandedKinds: strand ? [...strand.kinds] : [],
      connections: pool,
      hitRatio: node.type === 'cache' ? (pass.hits.get(node.id) ?? 0) : null,
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
    const rate = SAMPLE_RATES[tap.sample] ?? 0.1
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

  // Velocity stands in for features: a Stack that ships faster grows the market.
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
    revenue,
    insight,
    burn: game.nodes.reduce((total, node) => total + burnOf(game, node), 0),
    market: eraOf(game).market * marketFor(velocity),
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
