import {
  ANALYTICS_CAPACITY,
  BOT_SURGE,
  DDOS_MAGNITUDE,
  BACKEND_KB,
  EGRESS_CDN,
  EGRESS_CROSS_ZONE,
  EGRESS_ORIGIN,
  PSP_FIXED,
  PSP_RATE,
  CALLOUT_FAILURE,
  CALLOUT_MS,
  EGRESS_CROSS_REGION,
  MSGP_PRICE,
  LAG_SURGE,
  LLM_PRICE,
  SCAN_PRICE,
  TOKENS_PER_PROMPT,
  STUFFING_MAGNITUDE,
  COMPONENTS,
  DIURNAL_AMPLITUDE,
  FRAMEWORKS,
  FAILURE_YIELD,
  INSIGHT_YIELD,
  KINDS,
  LANGUAGES,
  MAX_CONNECTIONS,
  P2C_IMBALANCE,
  PROFILES,
  REQUEST_KINDS,
  RPS_PER_USER,
  SAMPLE_LATENCY,
  SAMPLE_OVERHEAD,
  LINK_TIMEOUT,
  FOREVER_ATTEMPTS,
  TASK_RETRY_SECONDS,
  WEEKEND_FACTOR,
  BACKEND_KINDS,
  isBackendKind,
  type BackendKind,
  type InsightPool,
  type Kind,
  type RegionId,
  type RequestKind,
} from './catalog.ts'
import { insightPerk, ventureOf } from './founding.ts'
import { calendarMinute, clockOf, cosTurns } from './calendar.ts'
import { FLAT_CAPACITY, NO_RESOURCES, type Calls } from './capacity.ts'
import {
  ERROR_CAUSES,
  NO_FAILURES,
  RETRY_BUDGET,
  attemptsFor,
  taskAttempts,
  taskLost,
  backedOff,
  failSome,
  heldFor,
  retried,
  timedOut,
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
import { marketOf, mixOf, subscriptionsOf, valueFactor } from './features.ts'
import type {
  KindLedger,
  Ledger,
  LinkLedger,
  NodeLedger,
  NodeStatus,
  RegionKindLedger,
} from './ledger.ts'
import {
  burnOf,
  eraOf,
  grown,
  has,
  hopMs,
  isDown,
  languageOf,
  sampleIndex,
  zoneMs,
} from './lookups.ts'
import {
  RULES,
  slotOf,
  accepts,
  cdnHitOf,
  flatCapacity,
  taskMixOf,
  type Model,
  type Pass,
  type Rates,
  type Solver,
} from './rules.ts'
import {
  isGlobal,
  placeMs,
  regional,
  regionalCycle,
  userRoutes,
  userSharesOf,
  type UserRoute,
} from './regions.ts'
import { NO_INSIGHT, type Game, type GameLink, type GameNode } from './state.ts'
import { payrollOf } from './team.ts'

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

/* ---------- demand and the calendar ---------- */

export { calendarMinute, clockOf, cosTurns }

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

/** The Venture's daily cycle. The default Venture runs the slice's curve. */
const ventureDiurnal = (game: Game): number => {
  const venture = ventureOf(game)
  if (venture.id === 'b2b-saas') return diurnal(game.time)
  const minute = calendarMinute(game.time) % 1440
  return 1 + venture.amplitude * cosTurns((minute - venture.peak * 60) / 1440)
}

/** The Venture's weekly cycle. */
const ventureWeekly = (game: Game): number => {
  const venture = ventureOf(game)
  if (venture.id === 'b2b-saas') return weekly(game.time)
  const day = Math.floor(calendarMinute(game.time) / 1440) % 7
  return day >= 5 ? venture.weekend : 1
}

export const demandOf = (game: Game): Partial<Record<RequestKind, number>> => {
  const mix = mixOf(game)
  const spike = game.incident?.kind === 'spike' ? game.incident.magnitude : 1
  const cycle = game.sandbox
    ? game.scenario?.daily && regional(game)
      ? regionalCycle(game.time, userSharesOf(game))
      : 1
    : regional(game)
      ? regionalCycle(game.time, userSharesOf(game)) * ventureWeekly(game)
      : ventureDiurnal(game) * ventureWeekly(game)
  const total = game.users * RPS_PER_USER * cycle * spike
  const demand: Partial<Record<RequestKind, number>> = {}
  for (const kind of REQUEST_KINDS) {
    const share = mix[kind] ?? 0
    if (share > 0) demand[kind] = total * share
  }
  // Attacks add bots on top of the users: scrapers, a flood, or leaked passwords tried on login.
  const attack =
    game.incident?.kind === 'bot-surge'
      ? total * BOT_SURGE
      : game.incident?.kind === 'ddos'
        ? total * DDOS_MAGNITUDE
        : game.incident?.kind === 'stuffing'
          ? total * (mix.login ?? 0.04) * STUFFING_MAGNITUDE
          : 0
  if (attack > 0) demand.bot = (demand.bot ?? 0) + attack
  return demand
}

/* ---------- the graph ---------- */

/**
 * A routing Link as the solve sees it: numbered, so per-Link state in a pass lives in
 * arrays, with its key and policy worked out once per solve instead of on every call.
 * Two Links with the same ends share one Edge, as they share one key.
 */
type Edge = Readonly<{
  index: number
  /** `from>to`, the key of the Ledger's Link figures. */
  key: string
  from: GameNode
  to: GameNode
  /** The callee's place in the per-Node arrays. */
  toAt: number
  /** The last Link with these ends: its kinds and policy are the ones that apply. */
  link: GameLink
  policy: Policy
}>

type Graph = Readonly<{
  byId: ReadonlyMap<string, GameNode>
  /** Each Node's place in the per-Node arrays of a solve: its index in the Design, by id. */
  at: ReadonlyMap<string, number>
  /** Each routing Link, by caller, then callee. */
  edgeTo: ReadonlyMap<string, ReadonlyMap<string, Edge>>
  /** Each Node's outgoing Edges, one per routing Link, in the Design's order. */
  out: ReadonlyMap<string, ReadonlyArray<Edge>>
  /** Every Edge, by index. */
  edges: ReadonlyArray<Edge>
  routes: ReadonlyMap<string, ReadonlyArray<GameNode>>
  parents: ReadonlyMap<string, ReadonlyArray<GameNode>>
  taps: ReadonlyMap<string, ReadonlyArray<string>>
  order: ReadonlyArray<GameNode>
  /** DNS drops dead hosts after its TTL, and Load Balancers check deep, only with Health checks. */
  healthChecked: boolean
  /** Sim seconds, so a Load Balancer or DNS notices a dead Node late. */
  time: number
}>

/** One Graph per Game: the Bottleneck search re-solves the same Game, and reuses it. */
const graphs = new WeakMap<Game, Graph>()

const graphOf = (game: Game): Graph => {
  let graph = graphs.get(game)
  if (!graph) {
    graph = buildGraph(game)
    graphs.set(game, graph)
  }
  return graph
}

const buildGraph = (game: Game): Graph => {
  const byId = new Map(game.nodes.map((node) => [node.id, node]))
  const at = new Map(game.nodes.map((node, index) => [node.id, index]))
  const routes = new Map<string, Array<GameNode>>()
  const parents = new Map<string, Array<GameNode>>()
  const taps = new Map<string, Array<string>>()
  const routing: Array<readonly [GameNode, GameNode]> = []
  const last = new Map<string, GameLink>()
  for (const link of game.links) {
    const from = byId.get(link.from)
    const to = byId.get(link.to)
    if (!from || !to) continue
    // A link into an Autoscaler or a Cluster puts the Node under its control: no traffic.
    if (COMPONENTS[to.type].control) continue
    if (COMPONENTS[to.type].tap) {
      taps.set(to.id, [...(taps.get(to.id) ?? []), from.id])
    } else {
      routing.push([from, to])
      last.set(`${from.id}>${to.id}`, link)
      routes.set(from.id, [...(routes.get(from.id) ?? []), to])
      parents.set(to.id, [...(parents.get(to.id) ?? []), from])
    }
  }
  const edgeTo = new Map<string, Map<string, Edge>>()
  const out = new Map<string, Array<Edge>>()
  const edges: Array<Edge> = []
  for (const [from, to] of routing) {
    const byTo = edgeTo.get(from.id) ?? new Map<string, Edge>()
    edgeTo.set(from.id, byTo)
    let edge = byTo.get(to.id)
    if (!edge) {
      const key = `${from.id}>${to.id}`
      const link = last.get(key) as GameLink
      edge = {
        index: edges.length,
        key,
        from,
        to,
        toAt: at.get(to.id) as number,
        link,
        policy: policyOf(game, link),
      }
      byTo.set(to.id, edge)
      edges.push(edge)
    }
    const list = out.get(from.id) ?? []
    list.push(edge)
    out.set(from.id, list)
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
    at,
    edgeTo,
    out,
    edges,
    routes,
    parents,
    taps,
    order,
    healthChecked: has(game, 'health-checks'),
    time: game.time,
  }
}

type Policy = Readonly<{
  timeout: number
  /** It retries failed calls: at once and up to three times, or with backoff inside a budget. */
  retry: 'none' | 'naive' | 'backoff'
  /** Its circuit breaker is open: it sends nothing and fails fast. */
  open: boolean
}>

const NO_POLICY: Policy = { timeout: LINK_TIMEOUT * 1000, retry: 'none', open: false }

/**
 * A Link's timeout in ms, its retries, and its breaker. Every Link waits 30 s and
 * never retries until Timeouts and retries; backoff and breakers need their research.
 */
export const policyOf = (game: Game, link: GameLink | undefined): Policy => {
  if (!link || !has(game, 'timeouts')) return NO_POLICY
  const retry =
    link.retries === 'backoff' ? (has(game, 'backoff-jitter') ? 'backoff' : 'naive') : link.retries
  return {
    timeout: link.timeout * 1000,
    retry,
    open: link.breaker && link.open > 0 && has(game, 'circuit-breakers'),
  }
}

/** The Edge from one Node to another, if a routing Link joins them. */
const edgeOf = (graph: Graph, from: string, to: string): Edge | undefined =>
  graph.edgeTo.get(from)?.get(to)

const NO_RATES: Rates = {}

/** What a pass sent from one Node to another, by kind. */
const carriedOn = (graph: Graph, pass: Pass, from: string, to: string): Rates => {
  const edge = edgeOf(graph, from, to)
  return (edge && pass.links[edge.index]) ?? NO_RATES
}

/** Calls per call a retrying Link sends when a share `failure` fails. */
const amplification = (policy: Policy, failure: number): number =>
  policy.open
    ? 0
    : policy.retry === 'naive'
      ? attemptsFor(failure)
      : policy.retry === 'backoff'
        ? 1 + Math.min(RETRY_BUDGET, attemptsFor(failure) - 1)
        : 1

const delegates = (graph: Graph, node: GameNode): boolean =>
  (graph.routes.get(node.id) ?? []).some((child) => accepts(child, 'auth'))

/** An App Server with a Link to a Queue hands its async work to Workers. */
const offloads = (graph: Graph, node: GameNode): boolean =>
  node.type === 'server' &&
  (graph.routes.get(node.id) ?? []).some((child) => accepts(child, 'task'))

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

/** Milliseconds sampling adds to a Node's hop: the highest rate of any tap on it. */
const samplingMsOf = (graph: Graph, node: GameNode): number => {
  let ms = 0
  for (const [tapId, sources] of graph.taps) {
    if (!sources.includes(node.id)) continue
    const tap = graph.byId.get(tapId)
    if (tap) ms = Math.max(ms, SAMPLE_LATENCY[sampleIndex(tap)] ?? 0)
  }
  return ms
}

/**
 * The request kinds behind each Node's traffic, as shares. A request keeps its
 * kind on every hop: the backend kinds a Node receives carry the mix of the
 * Nodes that sent them.
 */
const originsOf = (
  graph: Graph,
  pass: Pass,
): Map<string, ReadonlyArray<readonly [RequestKind, number]>> => {
  const origins = new Map<string, ReadonlyArray<readonly [RequestKind, number]>>()
  for (const node of graph.order) {
    const mix = new Map<RequestKind, number>()
    const arriving = pass.arriving[slotOf(pass, node)] ?? {}
    for (const kind of REQUEST_KINDS) {
      const rate = arriving[kind] ?? 0
      if (rate > 0) mix.set(kind, rate)
    }
    for (const parent of graph.parents.get(node.id) ?? []) {
      const carried = carriedOn(graph, pass, parent.id, node.id)
      let backend = 0
      for (const kind of BACKEND_KINDS) backend += carried[kind] ?? 0
      if (backend <= 0) continue
      for (const [kind, share] of origins.get(parent.id) ?? [])
        mix.set(kind, (mix.get(kind) ?? 0) + backend * share)
    }
    let total = 0
    for (const rate of mix.values()) total += rate
    origins.set(
      node.id,
      total > 0 ? [...mix].map(([kind, rate]) => [kind, rate / total] as const) : [],
    )
  }
  return origins
}

/* ---------- one pass ---------- */

type Inputs = Readonly<{
  game: Game
  graph: Graph
  demand: Partial<Record<RequestKind, number>>
  boost: string | null
  /** The per-Node figures below are indexed by the Graph's `at`. */
  callLatency: ReadonlyArray<Calls | undefined>
  inflight: ReadonlyArray<number | undefined>
  weights: ReadonlyArray<number | undefined>
  /** Share of calls that fail on each retrying Link, by `from>to:kind`, from the last pass. */
  failures: ReadonlyArray<Partial<Record<Kind, number>> | undefined>
  /** Capacity each Node had on paper at the start of the solve: what a weighted split sees. */
  nominal: ReadonlyArray<number | undefined>
  /** App Servers whose database is down or overloaded: a deep health check takes them out. */
  sick: ReadonlyArray<boolean | undefined>
  /** Share of the demand each Users Node takes in. */
  intake: ReadonlyArray<number | undefined>
  /** Share of each Worker's attempts that failed on the last pass: they come back as retries. */
  taskFailure: ReadonlyArray<number | undefined>
  /** Tasks per second each Worker could take on the last pass. */
  taskCapacity: ReadonlyArray<number | undefined>
}>

/** Attempts a Queue gives a task: its max attempts with a dead-letter queue, else forever. */
export const attemptsAllowed = (queue: GameNode): number =>
  queue.dlq ? queue.attempts : FOREVER_ATTEMPTS

/** The Queue a Worker pulls from, if any. */
const queueOf = (graph: Graph, node: GameNode): GameNode | undefined =>
  (graph.parents.get(node.id) ?? []).find((parent) => parent.type === 'queue')

/** Shares of a per-kind rate record, or null when it is empty. */
const sharesOf = (
  rates: Partial<Record<RequestKind, number>> | undefined,
): Partial<Record<RequestKind, number>> | null => {
  if (!rates) return null
  let total = 0
  for (const kind of Object.keys(rates) as Array<RequestKind>) total += rates[kind] ?? 0
  if (total <= 0) return null
  const shares: Partial<Record<RequestKind, number>> = {}
  for (const kind of Object.keys(rates) as Array<RequestKind>)
    shares[kind] = (rates[kind] ?? 0) / total
  return shares
}

const NO_CALLS: Calls = {}

/**
 * What the rules may ask about the Design in this pass. `tasks` holds what the
 * pass has sent so far: Nodes walk in order, so a Worker sees its Queue's mix.
 */
const solverOf = (
  inputs: Inputs,
  tasks: ReadonlyArray<Partial<Record<RequestKind, number>> | undefined> = [],
): Solver => {
  const { game, graph } = inputs
  return {
    game,
    boost: (node) => (inputs.boost === node.id ? 2 : 1),
    callLatency: (node) => inputs.callLatency[graph.at.get(node.id) as number] ?? NO_CALLS,
    inflight: (node) => inputs.inflight[graph.at.get(node.id) as number] ?? 0,
    delegates: (node) => delegates(graph, node),
    runsLocalDb: (node) => runsLocalDb(graph, node),
    sampling: (node) => samplingOf(game, graph, node),
    offloads: (node) => offloads(graph, node),
    poisoned: (node) => {
      const incident = game.incident
      if (incident?.kind !== 'poison') return false
      return (graph.parents.get(node.id) ?? []).some(
        (parent) => parent.id === incident.nodeId && !parent.dlq,
      )
    },
    taskMix: (node) => sharesOf(tasks[graph.at.get(node.id) as number]) ?? taskMixOf(game),
    attempts: (node) => {
      const queue = queueOf(graph, node)
      if (!queue) return 1
      const failure = Math.min(0.99, inputs.taskFailure[graph.at.get(node.id) as number] ?? 0)
      return taskAttempts(failure, attemptsAllowed(queue))
    },
    drainable: (node) => {
      let total = 0
      for (const edge of graph.out.get(node.id) ?? []) {
        if (edge.to.type !== 'worker' || isDown(edge.to)) continue
        total += inputs.taskCapacity[edge.toAt] ?? Number.POSITIVE_INFINITY
      }
      return total
    },
  }
}

/** Requests per second a Node could take with the Era's mix, for splitting traffic. */
const probeCapacity = (inputs: Inputs, solver: Solver, node: GameNode): number => {
  const probe = RULES[node.type].probe(inputs.game)
  if (probe === null) return FLAT_CAPACITY[node.type] === undefined ? 1_000 : flatCapacity(node)
  const model = RULES[node.type].model(solver, node, probe)
  return model.utilization > 0 ? 1 / model.utilization : 1_000
}

/** A Users Node's share of the demand. */
const intakeOf = (demand: Partial<Record<RequestKind, number>>, share: number) => {
  if (share === 1) return { ...demand }
  const rates: Partial<Record<Kind, number>> = {}
  for (const kind of Object.keys(demand) as Array<RequestKind>)
    if (share > 0) rates[kind] = (demand[kind] ?? 0) * share
  return rates
}

/** A customer's webhook endpoint: slow, and it fails now and then (04 "Request kinds"). */
const CALLOUT: Outcome = failSome(
  through(hop({ fixed: CALLOUT_MS / 2, variable: CALLOUT_MS / 2 })),
  CALLOUT_FAILURE,
  'upstream',
)

const forward = (inputs: Inputs): Pass => {
  const { game, graph, demand } = inputs
  const tasks: Array<Partial<Record<RequestKind, number>> | undefined> = []
  const solver = solverOf(inputs, tasks)
  const at = graph.at
  const arriving: Array<Rates> = game.nodes.map(() => ({}))
  // The request kinds behind the tasks the Node now walking sends on.
  let composition: Partial<Record<RequestKind, number>> | null = null
  const models: Array<Model | undefined> = []
  const hits: Array<number | undefined> = []
  const staleHits: Array<number | undefined> = []
  const stranded: Array<{ rate: number; kinds: Set<Kind> } | undefined> = []
  const links: Array<Rates | undefined> = []
  const linkOrder: Array<number> = []

  const route = (node: GameNode, slot: number, kind: Kind, rate: number) => {
    // A webhook's call goes to a customer's server, outside the Design.
    if (rate <= 0 || kind === 'callout') return
    const targets = splitOf(inputs, node, kind)
    if (targets.length === 0) {
      const entry = stranded[slot] ?? { rate: 0, kinds: new Set<Kind>() }
      entry.rate += rate
      entry.kinds.add(kind)
      stranded[slot] = entry
      return
    }
    for (const [edge, weight] of targets) {
      // Retries resend what failed: the callee sees more. An open breaker sends nothing.
      const amplified = amplification(edge.policy, inputs.failures[edge.index]?.[kind] ?? 0)
      const sent = rate * weight * amplified
      const into = arriving[edge.toAt] as Rates
      into[kind] = (into[kind] ?? 0) + sent
      let carried = links[edge.index]
      if (!carried) {
        carried = {}
        links[edge.index] = carried
        linkOrder.push(edge.index)
      }
      carried[kind] = (carried[kind] ?? 0) + sent
      if (kind === 'task' && composition) {
        const into = tasks[edge.toAt] ?? {}
        for (const origin of Object.keys(composition) as Array<RequestKind>)
          into[origin] = (into[origin] ?? 0) + sent * (composition[origin] ?? 0)
        tasks[edge.toAt] = into
      }
    }
  }

  for (const node of graph.order) {
    const slot = at.get(node.id) as number
    const rates =
      node.type === 'users' ? intakeOf(demand, inputs.intake[slot] ?? 0) : (arriving[slot] as Rates)
    arriving[slot] = rates
    const rule = RULES[node.type]
    const model = rule.model(solver, node, rates)
    models[slot] = model
    const shares = model.shares
    const share = isDown(node) ? 0 : shares ? 1 : model.share
    // Load shedding keeps a different share of each kind.
    const kept: Rates = shares && !isDown(node) ? {} : rates
    if (shares && !isDown(node))
      for (const kind of Object.keys(rates) as Array<Kind>)
        kept[kind] = (rates[kind] ?? 0) * (shares[kind] ?? model.share)
    // An App Server enqueues one task per request of a kind that goes async; a Queue passes on its mix.
    if (node.type === 'server') {
      const offloaded: Partial<Record<RequestKind, number>> = {}
      for (const kind of REQUEST_KINDS)
        if (PROFILES[kind].offload > 0 && (kept[kind] ?? 0) > 0) offloaded[kind] = kept[kind] ?? 0
      composition = sharesOf(offloaded)
    } else composition = node.type === 'queue' ? sharesOf(tasks[slot]) : null
    rule.serve(
      {
        solver,
        route: (kind, rate) => route(node, slot, kind, rate),
        setHits: (hit, stale) => {
          hits[slot] = hit
          staleHits[slot] = stale
        },
      },
      node,
      kept,
      share,
    )
  }

  // Every app process holds its own pool to each database it reaches.
  const connectionsIn: Array<number | undefined> = []
  for (const node of graph.order) {
    const slot = at.get(node.id) as number
    const out = RULES[node.type].connections(solver, node, models[slot], connectionsIn[slot] ?? 0)
    if (out <= 0) continue
    for (const edge of graph.out.get(node.id) ?? []) {
      const child = edge.to
      if (!accepts(child, 'q-read') && !accepts(child, 'q-write')) continue
      connectionsIn[edge.toAt] = (connectionsIn[edge.toAt] ?? 0) + out
    }
  }
  const connections: Array<{ used: number; max: number } | undefined> = []
  let writes = 0
  for (const node of game.nodes) {
    if (node.type !== 'database' && node.type !== 'replica') continue
    const slot = at.get(node.id) as number
    connections[slot] = {
      used: connectionsIn[slot] ?? 0,
      max: MAX_CONNECTIONS * (inputs.boost === node.id ? 2 : 1),
    }
    writes += arriving[slot]?.['q-write'] ?? 0
  }

  // What each Queue's Workers take from it.
  const drained: Array<number | undefined> = []
  for (const node of game.nodes) {
    if (node.type !== 'queue') continue
    let total = 0
    for (const edge of graph.out.get(node.id) ?? []) {
      if (edge.to.type !== 'worker') continue
      const share = isDown(edge.to) ? 0 : (models[edge.toAt]?.share ?? 1)
      total += (links[edge.index]?.task ?? 0) * share
    }
    drained[at.get(node.id) as number] = total
  }

  // A burst of writes during a Replication lag incident leaves replicas far behind.
  const surge = game.incident?.kind === 'repl-lag'
  const lag = REPLICA_LAG_MS + REPLICA_LAG_PER_WRITE * writes
  return {
    at,
    arriving,
    models,
    hits,
    staleHits,
    stranded,
    links,
    linkOrder,
    connections,
    tasks,
    drained,
    lag: surge ? lag * LAG_SURGE : lag,
    staleShare: surge ? Math.min(0.5, (lag * LAG_SURGE) / 1000) : Math.min(0.15, lag / 1000),
  }
}

/** Whether a Node is down and the router in front of it has noticed. Planned restarts drain first. */
const noticed = (graph: Graph, child: GameNode, after: number): boolean =>
  isDown(child) && (child.downCause === 'restart' || graph.time - child.downAt >= after)

/** The kinds a Link carries: an L7 Load Balancer Link can carry only some. */
const carries = (node: GameNode, edge: Edge, kind: Kind): boolean => {
  if (node.type !== 'lb') return true
  const kinds = edge.link.kinds
  return !kinds || (kinds as ReadonlyArray<Kind>).includes(kind)
}

type Split = ReadonlyArray<readonly [Edge, number]>

/** Splits by Node and kind, per pass: routing, outcomes and held time all ask for the same ones. */
const splits = new WeakMap<Inputs, Map<GameNode, Map<Kind, Split>>>()

const splitOf = (inputs: Inputs, node: GameNode, kind: Kind): Split => {
  let byNode = splits.get(inputs)
  if (!byNode) {
    byNode = new Map()
    splits.set(inputs, byNode)
  }
  let byKind = byNode.get(node)
  if (!byKind) {
    byKind = new Map()
    byNode.set(node, byKind)
  }
  let split = byKind.get(kind)
  if (!split) {
    split = splitFor(inputs, node, kind)
    byKind.set(kind, split)
  }
  return split
}

/** The Edges out of a Node that can take a kind, per Graph: they do not change during a solve. */
const takersByGraph = new WeakMap<Graph, Map<GameNode, Map<Kind, ReadonlyArray<Edge>>>>()

const takersOf = (graph: Graph, node: GameNode, kind: Kind): ReadonlyArray<Edge> => {
  let byNode = takersByGraph.get(graph)
  if (!byNode) {
    byNode = new Map()
    takersByGraph.set(graph, byNode)
  }
  let byKind = byNode.get(node)
  if (!byKind) {
    byKind = new Map()
    byNode.set(node, byKind)
  }
  let takers = byKind.get(kind)
  if (!takers) {
    const linked = (graph.out.get(node.id) ?? []).filter(
      (edge) => accepts(edge.to, kind) && carries(node, edge, kind),
    )
    // A Node built for the kind takes it from one that only falls back to it.
    const own = linked.filter((edge) => !COMPONENTS[edge.to.type].fallback.includes(kind))
    takers = own.length > 0 ? own : linked
    byKind.set(kind, takers)
  }
  return takers
}

/** The share of `kind` each Edge out of `node` takes in this pass. */
const splitFor = (inputs: Inputs, node: GameNode, kind: Kind): Split => {
  const { game, graph } = inputs
  const takers = takersOf(graph, node, kind)
  if (takers.length === 0) return []
  const even = (live: ReadonlyArray<Edge>) => live.map((edge) => [edge, 1 / live.length] as const)
  if (node.type === 'dns') {
    // DNS round robin splits evenly. With health checks, a dead host leaves once its TTL runs out.
    const live = graph.healthChecked
      ? takers.filter((edge) => !noticed(graph, edge.to, node.ttl))
      : takers
    return even(live.length > 0 ? live : takers)
  }
  if (node.type !== 'lb') return weighted(takers, (edge) => inputs.weights[edge.toAt])
  // A Load Balancer notices a dead host at its next health check. A deep check also takes out
  // servers whose database is down or overloaded, even when that leaves none.
  const up = takers.filter((edge) => !noticed(graph, edge.to, node.checkEvery))
  const checked = up.length > 0 ? up : takers
  const healthy =
    node.deepCheck && graph.healthChecked
      ? checked.filter((edge) => !inputs.sick[edge.toAt])
      : checked
  if (healthy.length === 0) return []
  // A dead host the checks have not caught yet still looks as big as it was.
  const live = (edge: Edge) =>
    isDown(edge.to) ? inputs.nominal[edge.toAt] : inputs.weights[edge.toAt]
  const policy =
    has(game, 'lb-algorithms') || node.policy === 'round-robin' ? node.policy : 'weighted'
  switch (policy) {
    case 'round-robin':
      return even(healthy)
    case 'weighted':
      return weighted(healthy, (edge) => inputs.nominal[edge.toAt])
    case 'least-conn':
      return weighted(healthy, live)
    case 'p2c': {
      const spread = 1 / healthy.length
      return weighted(healthy, live).map(
        ([edge, share]) => [edge, (1 - P2C_IMBALANCE) * share + P2C_IMBALANCE * spread] as const,
      )
    }
  }
}

/** Shares proportional to each target's capacity. */
const weighted = (
  targets: ReadonlyArray<Edge>,
  weightOf: (edge: Edge) => number | undefined,
): Split => {
  const raw = targets.map((edge) => {
    const weight = weightOf(edge) ?? 1
    return Number.isFinite(weight) ? Math.max(weight, 1e-6) : 1e9
  })
  const sum = raw.reduce((total, weight) => total + weight, 0)
  return targets.map((edge, index) => [edge, (raw[index] ?? 0) / sum] as const)
}

/* ---------- outcomes ---------- */

const outcomesOf = (inputs: Inputs, pass: Pass) => {
  const { game, graph } = inputs
  const memo = new Map<GameNode, Map<Kind, Outcome>>()

  const ownHop = (node: GameNode, kind: Kind, value = 1) => {
    const model = pass.models[slotOf(pass, node)]
    const service = model?.service[kind] ?? { fixed: COMPONENTS[node.type].latency, variable: 0 }
    return hop({
      share: model?.shares?.[kind] ?? model?.share ?? 1,
      fixed: service.fixed + samplingMsOf(graph, node),
      variable: service.variable,
      tailP: model?.tailP ?? 0,
      tailMs: model?.tailMs ?? 0,
      value,
    })
  }

  /** One attempt on a Link: the callee's outcome cut at the Link's timeout. */
  const attempt = (edge: Edge, kind: Kind): Outcome =>
    timedOut(outcome(edge.to, kind), edge.policy.timeout)

  /**
   * A call on a Link: one attempt, and the retries if the Link retries. An open
   * breaker fails fast. A retried charge that timed out may already have charged:
   * without idempotency keys, those fail as `duplicate`.
   */
  const call = (edge: Edge, kind: Kind): Outcome => {
    const policy = edge.policy
    if (policy.open) return failed('refused')
    const once = attempt(edge, kind)
    if (policy.retry === 'none') return once
    const again =
      policy.retry === 'naive'
        ? retried(once, policy.timeout)
        : backedOff(once, policy.timeout, RETRY_BUDGET)
    // A charge that succeeded on a retry after a timeout charged twice: the first one went through.
    const timedOutShare = once.success < 1 ? once.fail.timeout / (1 - once.success) : 0
    const duplicates =
      again.success > 0
        ? (Math.max(0, again.success - once.success) / again.success) * timedOutShare
        : 0
    return kind === 'charge' && !has(game, 'idempotency-keys') && duplicates > 0
      ? failSome(again, duplicates, 'duplicate')
      : again
  }

  /** Share of attempts that fail on a Link, which drives naive retries. */
  const failureOn = (edge: Edge, kind: Kind): number => 1 - attempt(edge, kind).success

  /** A call that leaves its zone or region pays the hop on top. */
  const placed = (edge: Edge, kind: Kind): Outcome => {
    const node = edge.from
    const child = edge.to
    // A partition cuts calls between regions until it heals.
    if (
      game.incident?.kind === 'partition' &&
      node.region !== child.region &&
      node.type !== 'users' &&
      !isGlobal(node) &&
      !isGlobal(child)
    )
      return failed('timeout')
    const extra = placeMs(game, node, child)
    const answer = call(edge, kind)
    return extra > 0 ? through(hop({ fixed: extra }), [[answer, 1]]) : answer
  }

  /** What one request of `kind` sent from `node` to its targets gets back. */
  const downstream = (node: GameNode, kind: Kind, extraHop = 0): Outcome => {
    if (kind === 'callout') return CALLOUT
    const mixed = blend(
      splitOf(inputs, node, kind).map(([edge, weight]) => [placed(edge, kind), weight]),
    )
    if (!mixed) return failed('stranded')
    return extraHop > 0 ? through(hop({ fixed: extraHop }), [[mixed, 1]]) : mixed
  }

  /** Milliseconds a caller holds its slot for one call: E[min(X, T)] per attempt, times the attempts. */
  const held = (node: GameNode, kind: Kind, extraHop = 0): number =>
    splitOf(inputs, node, kind).reduce((total, [edge, weight]) => {
      const policy = edge.policy
      if (policy.open) return total
      const attempts = policy.retry === 'none' ? 1 : amplification(policy, failureOn(edge, kind))
      const each =
        heldFor(outcome(edge.to, kind), policy.timeout) + extraHop + placeMs(game, node, edge.to)
      return total + weight * attempts * Math.min(policy.timeout, each)
    }, 0)

  const outcome = (node: GameNode, kind: Kind): Outcome => {
    let byKind = memo.get(node)
    if (!byKind) {
      byKind = new Map()
      memo.set(node, byKind)
    }
    const cached = byKind.get(kind)
    if (cached) return cached
    // A Node the kernel killed for memory fails as `oom` until it is back.
    const result = isDown(node)
      ? failed(node.downCause === 'oom' ? 'oom' : 'down')
      : RULES[node.type].outcome(
          {
            game,
            pass,
            ownHop: (of, value) => ownHop(node, of, value),
            downstream: (of, extraHop) => downstream(node, of, extraHop),
            delegates: delegates(graph, node),
            runsLocalDb: runsLocalDb(graph, node),
            offloads: offloads(graph, node),
          },
          node,
          kind,
        )
    byKind.set(kind, result)
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
        (pass.models[slotOf(pass, child)]?.utilization ?? 0) >= 1
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
  let callLatency: Array<Calls | undefined> = []
  let inflight: Array<number | undefined> = []
  let weights: Array<number | undefined> = []
  // Retrying Links start from the failure share they saw last Step: retries carry a storm forward.
  let failures: Array<Partial<Record<Kind, number>> | undefined> = []
  for (const link of game.links) {
    const edge = edgeOf(graph, link.from, link.to)
    if (link.failure <= 0 || !edge || edge.policy.retry === 'none') continue
    const byKind: Partial<Record<Kind, number>> = {}
    for (const kind of COMPONENTS[edge.to.type].accepts) byKind[kind] = link.failure
    failures[edge.index] = byKind
  }
  const at = graph.at
  const nominal: Array<number | undefined> = []
  const sick: Array<boolean | undefined> = []
  const routes = userRoutes(game, (node) => (graph.routes.get(node.id)?.length ?? 0) > 0)
  const intake: Array<number | undefined> = []
  for (const entry of routes)
    if (entry.source) {
      const slot = at.get(entry.source.id) as number
      intake[slot] = (intake[slot] ?? 0) + entry.share
    }
  let taskFailure: Array<number | undefined> = []
  let taskCapacity: Array<number | undefined> = []
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
    intake,
    taskFailure,
    taskCapacity,
  }
  const seedSolver = solverOf(seed)
  for (const node of game.nodes)
    nominal[at.get(node.id) as number] = probeCapacity(seed, seedSolver, node)
  weights = [...nominal]

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
      sick: [...sick],
      intake,
      taskFailure,
      taskCapacity,
    }
    pass = forward(inputs)
    outcomes = outcomesOf(inputs, pass)
    // A Worker's failed attempts come back: what its calls and code failed, not what it dropped,
    // since a dropped task waits in the Queue.
    const nextTaskFailure: Array<number | undefined> = []
    const nextTaskCapacity: Array<number | undefined> = []
    for (const node of game.nodes) {
      if (node.type !== 'worker') continue
      const slot = at.get(node.id) as number
      const utilization = pass.models[slot]?.utilization ?? 0
      const offered = pass.arriving[slot]?.task ?? 0
      if (utilization > 0 && offered > 0) nextTaskCapacity[slot] = offered / utilization
      if (!pass.tasks[slot]) continue
      const result = outcomes.outcome(node, 'task')
      const fresh = Math.max(0, 1 - (result.success + result.fail.dropped))
      const previous = taskFailure[slot]
      nextTaskFailure[slot] = previous === undefined ? fresh : (previous + fresh) / 2
    }
    taskFailure = nextTaskFailure
    taskCapacity = nextTaskCapacity
    const nextLatency: Array<Calls | undefined> = []
    const nextInflight: Array<number | undefined> = []
    const nextWeights: Array<number | undefined> = []
    for (const node of game.nodes) {
      const slot = at.get(node.id) as number
      const model = pass.models[slot]
      nextInflight[slot] = ((inflight[slot] ?? 0) + (model?.inflight ?? 0)) / 2
      const rate = sumRates(pass.arriving[slot] ?? {})
      nextWeights[slot] = isDown(node)
        ? 0
        : rate > 0 && model
          ? model.capacity
          : (weights[slot] ?? 1)
      // A Node that runs code holds its slot while it waits on each call it makes.
      if (!COMPONENTS[node.type].stack) continue
      const previous = callLatency[slot] ?? NO_CALLS
      const blended: Partial<Record<BackendKind, number>> = {}
      for (const kind of COMPONENTS[node.type].sends) {
        if (!isBackendKind(kind)) continue
        const fresh = kind === 'callout' ? CALLOUT_MS : outcomes.held(node, kind, hopMs(game))
        blended[kind] = index === 0 ? fresh : ((previous[kind] ?? 0) + fresh) / 2
      }
      nextLatency[slot] = blended
    }
    // Failure shares on retrying Links, blended like the call latencies.
    const nextFailures: Array<Partial<Record<Kind, number>> | undefined> = []
    for (const index of pass.linkOrder) {
      const edge = graph.edges[index] as Edge
      const carried = pass.links[index] as Rates
      if (edge.policy.retry === 'none') continue
      const byKind: Partial<Record<Kind, number>> = {}
      for (const kind of Object.keys(carried) as Array<Kind>) {
        const fresh = outcomes.failureOn(edge, kind)
        const previous = failures[index]?.[kind]
        byKind[kind] = previous === undefined ? fresh : (previous + fresh) / 2
      }
      nextFailures[index] = byKind
    }
    // Once a deep check fails a server in a pass, it stays out for the solve: no flapping.
    for (const node of game.nodes)
      if (node.type === 'server' && databaseSick(graph, pass, node))
        sick[at.get(node.id) as number] = true
    callLatency = nextLatency
    inflight = nextInflight
    weights = nextWeights
    failures = nextFailures
  }
  if (!pass || !outcomes) throw new Error('The solve ran no passes.')
  return ledgerOf(game, graph, demand, pass, outcomes, routes)
}

/**
 * When the async part of each kind is done (16 "Series B": completion-time
 * Apdex). A new task waits behind its Queue's backlog for as long as the
 * Workers take to drain it (Little's law), then runs. An attempt that fails
 * comes back after a backoff until the Queue's attempts run out, and then the
 * task is lost.
 */
const completionsOf = (game: Game, pass: Pass, outcomes: ReturnType<typeof outcomesOf>) => {
  const enqueued: Partial<Record<RequestKind, number>> = {}
  const scored: Partial<Record<RequestKind, number>> = {}
  const waits = new Map<string, number>()
  for (const queue of game.nodes) {
    if (queue.type !== 'queue') continue
    const slot = slotOf(pass, queue)
    const drained = pass.drained[slot] ?? 0
    const wait =
      queue.depth <= 0 ? 0 : drained > 0 ? queue.depth / drained : Number.POSITIVE_INFINITY
    waits.set(queue.id, wait)
    const tasks = pass.tasks[slot]
    if (!tasks || isDown(queue)) continue
    const worker = outcomes.downstream(queue, 'task')
    // A task a busy Worker dropped waits in the Queue: the wait counts it, not the attempts.
    const failure = Math.min(1, Math.max(0, 1 - worker.success - worker.fail.dropped))
    const allowed = attemptsAllowed(queue)
    const lost = taskLost(failure, allowed)
    const extra = taskAttempts(failure, allowed) - 1
    const done: Outcome =
      wait === Number.POSITIVE_INFINITY || worker.fail.stranded >= 1
        ? failed('stranded')
        : {
            ...worker,
            success: 1 - lost,
            fixed: worker.fixed + (wait + extra * TASK_RETRY_SECONDS) * 1000,
            fail: { ...NO_FAILURES, upstream: lost },
          }
    for (const kind of Object.keys(tasks) as Array<RequestKind>) {
      const target = PROFILES[kind].completion
      const rate = tasks[kind] ?? 0
      if (!target || rate <= 0) continue
      enqueued[kind] = (enqueued[kind] ?? 0) + rate
      scored[kind] = (scored[kind] ?? 0) + rate * done.success * apdexOf(done, target)
    }
  }
  return { enqueued, scored, waits }
}

/** One region's answer to a request kind, with and without its users' hop. */
type RouteAnswer = Readonly<{ entry: UserRoute; answer: Outcome; raw: Outcome }>

/** Attribute a tap's sampled volume to its source's incoming operations, not routed calls. */
const sampledTraffic = (source: NodeLedger | undefined, rate: number): Rates => {
  const traffic: Rates = {}
  if (!source || source.inbound <= 0) return traffic
  const scale = ((source.inbound - source.dropped) / source.inbound) * rate
  for (const kind of Object.keys(source.traffic) as Array<Kind>)
    traffic[kind] = (source.traffic[kind] ?? 0) * scale
  return traffic
}

const ledgerOf = (
  game: Game,
  graph: Graph,
  demand: Partial<Record<RequestKind, number>>,
  pass: Pass,
  outcomes: ReturnType<typeof outcomesOf>,
  routes: ReadonlyArray<UserRoute>,
): Ledger => {
  /** What one request of `kind` gets back for each region's users, and what it would with no user hop. */
  const answersOf = (kind: RequestKind): ReadonlyArray<RouteAnswer> =>
    routes.map((entry) => {
      const raw = entry.source ? outcomes.outcome(entry.source, kind) : failed('stranded')
      return {
        entry,
        raw,
        answer: entry.extraMs > 0 ? through(hop({ fixed: entry.extraMs }), [[raw, 1]]) : raw,
      }
    })
  /** What one request of `kind` gets back, over every region's users. */
  const answerOf = (answers: ReadonlyArray<RouteAnswer>): Outcome => {
    const only = answers.length === 1 ? answers[0] : undefined
    if (only && only.entry.extraMs === 0) return only.answer
    return (
      blend(answers.map(({ entry, answer }) => [answer, entry.share] as const)) ??
      failed('stranded')
    )
  }
  // Each region's users get their own Apdex (04 "Users and growth"), and their own rows for the
  // Churn breakdown (12 "The Churn breakdown").
  const regionRate: Partial<Record<RegionId, number>> = {}
  const regionSatisfied: Partial<Record<RegionId, number>> = {}
  const regionKinds: Partial<Record<RegionId, Partial<Record<RequestKind, RegionKindLedger>>>> = {}

  const completion = completionsOf(game, pass, outcomes)

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
    const answers = answersOf(kind)
    const result = answerOf(answers)
    // The part that went through a Queue is also scored on when its result is ready.
    const enqueued = completion.enqueued[kind] ?? 0
    const done = enqueued > 0 ? (completion.scored[kind] ?? 0) / enqueued : null
    const async =
      done === null || result.success <= 0 ? 0 : Math.min(1, enqueued / (rate * result.success))
    const finish = 1 - async + async * (done ?? 1)
    const apdex = apdexOf(result, PROFILES[kind].apdex) * finish
    kinds[kind] = {
      rate,
      success: result.success,
      apdex,
      completion: done,
      mean: meanOf(result),
      p50: percentile(result, 0.5),
      p95: percentile(result, 0.95),
      p99: percentile(result, 0.99),
    }
    // Bots earn nothing and do not count toward Apdex or errors: blocking one is a success.
    if (!PROFILES[kind].scored) continue
    for (const { entry, answer, raw } of answers) {
      const sent = rate * entry.share
      const region = entry.region
      // Each region's users wait for queued work as long as everyone else.
      const own = answer === result ? apdex : apdexOf(answer, PROFILES[kind].apdex) * finish
      regionRate[region] = (regionRate[region] ?? 0) + sent
      regionSatisfied[region] = (regionSatisfied[region] ?? 0) + sent * answer.success * own
      regionKinds[region] = {
        ...regionKinds[region],
        [kind]: {
          rate: sent,
          success: answer.success,
          apdex: own,
          near: raw === answer ? own : apdexOf(raw, PROFILES[kind].apdex) * finish,
          fail: answer.fail,
          hopMs: entry.extraMs,
          p99: percentile(answer, 0.99),
        },
      }
    }
    rateTotal += rate
    served += rate * result.success
    satisfied += rate * result.success * apdex
    revenue +=
      rate * result.success * apdex * KINDS[kind].value * result.value * valueFactor(game, kind)
    latencyWeight += rate * result.success * meanOf(result)
    for (const cause of ERROR_CAUSES) errors[cause] += rate * result.fail[cause]
    if (result.success > 0) mixture.push([result, rate * result.success])
    if (result.success < 0.05 && result.fail.stranded >= 0.5) failing.push(kind)
  }
  const overall = blend(mixture)

  // Node ledgers.
  const nodes: Record<string, NodeLedger> = {}
  for (const node of game.nodes) {
    const slot = slotOf(pass, node)
    const rates = pass.arriving[slot] ?? {}
    const model = pass.models[slot]
    const inbound = sumRates(rates)
    const share = isDown(node) ? 0 : (model?.share ?? 1)
    const pool = pass.connections[slot] ?? null
    const refusedShare = pool && pool.used > pool.max ? 1 - pool.max / pool.used : 0
    const strand = pass.stranded[slot]
    const out: Rates = {}
    for (const child of graph.routes.get(node.id) ?? []) {
      const carried = carriedOn(graph, pass, node.id, child.id)
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
      traffic: rates,
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
      hitRatio: node.type === 'cache' || node.type === 'cdn' ? (pass.hits[slot] ?? 0) : null,
      age: node.type === 'queue' ? (completion.waits.get(node.id) ?? 0) : null,
      lag: node.type === 'replica' ? pass.lag : null,
      disk: model?.disk ?? false,
      out,
      resources: model?.resources ?? NO_RESOURCES,
      throttled: model?.throttled ?? false,
      swapping: model?.swapping ?? false,
      status: statusOf(node, inbound, utilization, (strand?.rate ?? 0) > 0 || refusedShare > 0),
    }
  }

  // Analytics turns sampled traffic into Insight of each request kind (12 "Earning Insight").
  const apdex = rateTotal > 0 ? satisfied / rateTotal : 1
  const origins = originsOf(graph, pass)
  const sampledBy = new Map<string, number>()
  const failedBy = new Map<string, number>()
  for (const [tapId, sources] of graph.taps) {
    const tap = graph.byId.get(tapId)
    if (!tap) continue
    const rate = tap.sampleRate
    const volume = sources.reduce((total, source) => {
      const entry = nodes[source]
      return total + (entry ? entry.inbound - entry.dropped : 0)
    }, 0)
    const traffic: Rates = {}
    for (const source of sources) {
      const sampled = sampledTraffic(nodes[source], rate)
      for (const kind of Object.keys(sampled) as Array<Kind>)
        traffic[kind] = (traffic[kind] ?? 0) + (sampled[kind] ?? 0)
    }
    const capacity = grown(ANALYTICS_CAPACITY, 2, tap.size - 1)
    // Samples beyond the tap's capacity are dropped, evenly.
    const kept = isDown(tap) || volume * rate <= 0 ? 0 : Math.min(1, capacity / (volume * rate))
    for (const source of sources) {
      const entry = nodes[source]
      const from = graph.byId.get(source)
      if (!entry || !from || kept <= 0) continue
      const done = (entry.inbound - entry.dropped) * rate * kept
      for (const [kind, share] of origins.get(source) ?? []) {
        const samples = done * share
        if (samples <= 0) continue
        const key = `${from.type}:${kind}`
        sampledBy.set(key, (sampledBy.get(key) ?? 0) + samples)
        // A request that fails or frustrates its user teaches Failure, a tolerated one half.
        const answer = kinds[kind]
        if (answer && PROFILES[kind].scored)
          failedBy.set(
            from.type,
            (failedBy.get(from.type) ?? 0) + samples * (1 - answer.success * answer.apdex),
          )
      }
    }
    nodes[tapId] = {
      ...(nodes[tapId] as NodeLedger),
      inbound: volume * rate,
      traffic,
      capacity,
      utilization: capacity > 0 ? (volume * rate) / capacity : 0,
      limit: volume * rate > capacity ? 'throughput' : 'none',
      status: statusOf(tap, volume, capacity > 0 ? (volume * rate) / capacity : 0, false),
    }
  }
  // The square root per Component type and kind: a broad Design teaches more than a big one.
  const perk = insightPerk(game)
  const insight: Record<InsightPool, number> = { ...NO_INSIGHT }
  const breadth: Partial<Record<RequestKind, number>> = {}
  for (const [key, samples] of sampledBy) {
    const kind = key.slice(key.indexOf(':') + 1) as RequestKind
    insight[kind] += INSIGHT_YIELD * Math.sqrt(samples) * perk
    breadth[kind] = (breadth[kind] ?? 0) + 1
  }
  for (const failed of failedBy.values())
    insight.failure += INSIGHT_YIELD * FAILURE_YIELD * Math.sqrt(Math.max(0, failed)) * perk

  const links: Array<LinkLedger> = game.links.map((link) => {
    const to = graph.byId.get(link.to)
    if (to && COMPONENTS[to.type].tap) {
      const source = nodes[link.from]
      return {
        ...link,
        rate: source ? (source.inbound - source.dropped) * 0.15 : 0,
        traffic: sampledTraffic(source, 0.15),
        kind: 'page',
        failing: false,
        failure: 0,
      }
    }
    const carried = carriedOn(graph, pass, link.from, link.to)
    const entries = Object.entries(carried) as Array<[Kind, number]>
    const top = entries.reduce<[Kind, number]>(
      (best, entry) => (entry[1] > best[1] ? entry : best),
      ['page', -1],
    )
    const target = nodes[link.to]
    const rate = entries.reduce((total, [, rate]) => total + rate, 0)
    return {
      ...link,
      rate,
      traffic: carried,
      kind: top[0],
      failing:
        !!target && (target.status === 'down' || target.refused > 0 || target.dropped > 0.01),
      failure: linkFailure(game, graph, outcomes, link, entries, rate),
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

  // Egress (09 "Egress"): bytes App Servers send to the internet, and pages a CDN answers at the edge.
  // Billed from Seed: before it, the smallest box costs more than every byte the Company sends.
  let egress = 0
  if (game.stage >= 2) {
    for (const node of game.nodes) {
      if (node.type === 'server')
        egress += ((nodes[node.id]?.resources.network?.used ?? 0) / 1_000_000) * EGRESS_ORIGIN
      if (node.type === 'cdn' && !isDown(node)) {
        const rates = pass.arriving[slotOf(pass, node)] ?? {}
        for (const kind of REQUEST_KINDS)
          egress +=
            (((rates[kind] ?? 0) * cdnHitOf(node, kind, game) * PROFILES[kind].payloadKB) /
              1_000_000) *
            EGRESS_CDN
      }
    }
    // Traffic between zones bills both ways: requests at their payload, backend calls at 4 KB.
    for (const index of pass.linkOrder) {
      const { from: source, to: target } = graph.edges[index] as Edge
      const carried = pass.links[index] as Rates
      // Between regions (09 "Egress": $0.02/GB); global Components are reached at no charge.
      const crossRegion = source.region !== target.region && !isGlobal(source) && !isGlobal(target)
      if (!crossRegion && zoneMs(source, target) === 0) continue
      for (const [kind, rate] of Object.entries(carried) as Array<[Kind, number]>) {
        const kb = isBackendKind(kind) ? BACKEND_KB : PROFILES[kind as RequestKind].payloadKB
        egress += crossRegion
          ? ((rate * kb) / 1_000_000) * EGRESS_CROSS_REGION
          : ((rate * kb) / 1_000_000) * EGRESS_CROSS_ZONE * 2
      }
    }
    egress *= eraOf(game).costIndex
  }

  // Third parties (09 "Third-party fees"): the Payment Provider takes a share of each checkout
  // and a fixed part. Both are real dollars on a real-dollar checkout, so the cost index skips them.
  const checkouts = kinds.buy ? kinds.buy.rate * kinds.buy.success : 0
  const fees =
    checkouts > 0
      ? checkouts * (KINDS.buy.value * valueFactor(game, 'buy') * PSP_RATE + PSP_FIXED)
      : 0

  // A Data Warehouse bills each scan; the LLM API bills each token (09 "Pricing models").
  let usage = 0
  for (const node of game.nodes) {
    const done = (nodes[node.id]?.inbound ?? 0) - (nodes[node.id]?.dropped ?? 0)
    if (done <= 0 || isDown(node)) continue
    if (node.type === 'warehouse') usage += done * SCAN_PRICE
    if (node.type === 'llm') usage += ((done * TOKENS_PER_PROMPT) / 1_000) * LLM_PRICE
    if (node.type === 'msgp') usage += done * MSGP_PRICE
  }
  const thirdParty = usage > 0 ? fees + usage * eraOf(game).costIndex : fees

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
    regions: Object.fromEntries(
      Object.entries(regionRate).map(([region, sent]) => [
        region,
        sent > 0 ? (regionSatisfied[region as RegionId] ?? 0) / sent : 1,
      ]),
    ),
    regionKinds,
    revenue: revenue + subscriptions,
    subscriptions,
    insight,
    breadth,
    burn:
      thirdParty > 0
        ? game.nodes.reduce((total, node) => total + burnOf(game, node), 0) +
          salaries +
          egress +
          thirdParty
        : game.nodes.reduce((total, node) => total + burnOf(game, node), 0) + salaries + egress,
    salaries,
    egress,
    fees: thirdParty,
    market: marketOf(game),
    velocity,
    failing,
    bottleneck: null,
  }
}

/**
 * Share of calls that fail on a Link that retries or has a breaker, by what it
 * carries. Zero for every other Link: nothing reads it.
 */
const linkFailure = (
  game: Game,
  graph: Graph,
  outcomes: ReturnType<typeof outcomesOf>,
  link: GameLink,
  entries: ReadonlyArray<readonly [Kind, number]>,
  rate: number,
): number => {
  const edge = edgeOf(graph, link.from, link.to)
  const policy = edge?.policy ?? NO_POLICY
  const watched = policy.retry !== 'none' || (link.breaker && has(game, 'circuit-breakers'))
  if (!watched || policy.open || rate <= 0 || !edge) return 0
  return entries.reduce(
    (total, [kind, carried]) => total + (carried / rate) * outcomes.failureOn(edge, kind),
    0,
  )
}

/* ---------- the bottleneck ---------- */

/**
 * The Node whose doubled capacity would earn the most: re-solve with each of
 * the three busiest Nodes boosted and keep the largest gain.
 */
export const bottleneckOf = (game: Game, base: Ledger): string | null => {
  const busiest = game.nodes
    .filter((node) => COMPONENTS[node.type].limiting && !isDown(node))
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
