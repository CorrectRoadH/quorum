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
  INSIGHT_YIELD,
  KINDS,
  LANGUAGES,
  MAX_CONNECTIONS,
  P2C_IMBALANCE,
  PROFILES,
  REQUEST_KINDS,
  RPS_PER_USER,
  SAMPLE_OVERHEAD,
  LINK_TIMEOUT,
  WEEKEND_FACTOR,
  isBackendKind,
  type BackendKind,
  type Kind,
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
import type { KindLedger, Ledger, LinkLedger, NodeLedger, NodeStatus } from './ledger.ts'
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
  accepts,
  cdnHitOf,
  flatCapacity,
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
  type UserRoute,
} from './regions.ts'
import type { Game, GameLink, GameNode } from './state.ts'
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
    ? 1
    : regional(game)
      ? regionalCycle(game.time) * ventureWeekly(game)
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
    // A link into an Autoscaler or a Cluster puts the Node under its control: no traffic.
    if (COMPONENTS[to.type].control) continue
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

const linkPolicy = (game: Game, graph: Graph, from: string, to: string): Policy =>
  policyOf(game, graph.links.get(`${from}>${to}`))

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

/* ---------- one pass ---------- */

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
  /** Share of the demand each Users Node takes in. */
  intake: ReadonlyMap<string, number>
}>

const NO_CALLS: Calls = {}

/** What the rules may ask about the Design in this pass. */
const solverOf = (inputs: Inputs): Solver => {
  const { game, graph } = inputs
  return {
    game,
    boost: (node) => (inputs.boost === node.id ? 2 : 1),
    callLatency: (node) => inputs.callLatency.get(node.id) ?? NO_CALLS,
    inflight: (node) => inputs.inflight.get(node.id) ?? 0,
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
  const solver = solverOf(inputs)
  const arriving = new Map<string, Rates>(game.nodes.map((node) => [node.id, {}]))
  const models = new Map<string, Model>()
  const hits = new Map<string, number>()
  const staleHits = new Map<string, number>()
  const stranded = new Map<string, { rate: number; kinds: Set<Kind> }>()
  const links = new Map<string, Rates>()

  const route = (node: GameNode, kind: Kind, rate: number) => {
    // A webhook's call goes to a customer's server, outside the Design.
    if (rate <= 0 || kind === 'callout') return
    const targets = splitOf(inputs, node, kind)
    if (targets.length === 0) {
      const entry = stranded.get(node.id) ?? { rate: 0, kinds: new Set<Kind>() }
      entry.rate += rate
      entry.kinds.add(kind)
      stranded.set(node.id, entry)
      return
    }
    for (const [child, weight] of targets) {
      const key = `${node.id}>${child.id}`
      // Retries resend what failed: the callee sees more. An open breaker sends nothing.
      const amplified = amplification(
        linkPolicy(game, graph, node.id, child.id),
        inputs.failures.get(`${key}:${kind}`) ?? 0,
      )
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
    const rates =
      node.type === 'users'
        ? intakeOf(demand, inputs.intake.get(node.id) ?? 0)
        : (arriving.get(node.id) ?? {})
    arriving.set(node.id, rates)
    const rule = RULES[node.type]
    const model = rule.model(solver, node, rates)
    models.set(node.id, model)
    const shares = model.shares
    const share = isDown(node) ? 0 : shares ? 1 : model.share
    // Load shedding keeps a different share of each kind.
    const kept: Rates = shares && !isDown(node) ? {} : rates
    if (shares && !isDown(node))
      for (const kind of Object.keys(rates) as Array<Kind>)
        kept[kind] = (rates[kind] ?? 0) * (shares[kind] ?? model.share)
    rule.serve(
      {
        solver,
        route: (kind, rate) => route(node, kind, rate),
        setHits: (hit, stale) => {
          hits.set(node.id, hit)
          staleHits.set(node.id, stale)
        },
      },
      node,
      kept,
      share,
    )
  }

  // Every app process holds its own pool to each database it reaches.
  const connectionsIn = new Map<string, number>()
  for (const node of graph.order) {
    const out = RULES[node.type].connections(
      solver,
      node,
      models.get(node.id),
      connectionsIn.get(node.id) ?? 0,
    )
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

  // A burst of writes during a Replication lag incident leaves replicas far behind.
  const surge = game.incident?.kind === 'repl-lag'
  const lag = REPLICA_LAG_MS + REPLICA_LAG_PER_WRITE * writes
  return {
    arriving,
    models,
    hits,
    staleHits,
    stranded,
    links,
    connections,
    lag: surge ? lag * LAG_SURGE : lag,
    staleShare: surge ? Math.min(0.5, (lag * LAG_SURGE) / 1000) : Math.min(0.15, lag / 1000),
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
  const linked = (graph.routes.get(node.id) ?? []).filter(
    (child) => accepts(child, kind) && carries(graph, node, child, kind),
  )
  // A Node built for the kind takes it from one that only falls back to it.
  const own = linked.filter((child) => !COMPONENTS[child.type].fallback.includes(kind))
  const takers = own.length > 0 ? own : linked
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
      share: model?.shares?.[kind] ?? model?.share ?? 1,
      fixed: service.fixed,
      variable: service.variable,
      tailP: model?.tailP ?? 0,
      tailMs: model?.tailMs ?? 0,
      value,
    })
  }

  /** One attempt on a Link: the callee's outcome cut at the Link's timeout. */
  const attempt = (node: GameNode, child: GameNode, kind: Kind): Outcome =>
    timedOut(outcome(child, kind), linkPolicy(game, graph, node.id, child.id).timeout)

  /**
   * A call on a Link: one attempt, and the retries if the Link retries. An open
   * breaker fails fast. A retried charge that timed out may already have charged:
   * without idempotency keys, those fail as `duplicate`.
   */
  const call = (node: GameNode, child: GameNode, kind: Kind): Outcome => {
    const policy = linkPolicy(game, graph, node.id, child.id)
    if (policy.open) return failed('refused')
    const once = attempt(node, child, kind)
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
  const failureOn = (node: GameNode, child: GameNode, kind: Kind): number =>
    1 - attempt(node, child, kind).success

  /** A call that leaves its zone or region pays the hop on top. */
  const placed = (node: GameNode, child: GameNode, kind: Kind): Outcome => {
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
    const answer = call(node, child, kind)
    return extra > 0 ? through(hop({ fixed: extra }), [[answer, 1]]) : answer
  }

  /** What one request of `kind` sent from `node` to its targets gets back. */
  const downstream = (node: GameNode, kind: Kind, extraHop = 0): Outcome => {
    if (kind === 'callout') return CALLOUT
    const mixed = blend(
      splitOf(inputs, node, kind).map(([child, weight]) => [placed(node, child, kind), weight]),
    )
    if (!mixed) return failed('stranded')
    return extraHop > 0 ? through(hop({ fixed: extraHop }), [[mixed, 1]]) : mixed
  }

  /** Milliseconds a caller holds its slot for one call: E[min(X, T)] per attempt, times the attempts. */
  const held = (node: GameNode, kind: Kind, extraHop = 0): number =>
    splitOf(inputs, node, kind).reduce((total, [child, weight]) => {
      const policy = linkPolicy(game, graph, node.id, child.id)
      if (policy.open) return total
      const attempts =
        policy.retry === 'none' ? 1 : amplification(policy, failureOn(node, child, kind))
      const each =
        heldFor(outcome(child, kind), policy.timeout) + extraHop + placeMs(game, node, child)
      return total + weight * attempts * Math.min(policy.timeout, each)
    }, 0)

  const outcome = (node: GameNode, kind: Kind): Outcome => {
    const key = `${node.id}:${kind}`
    const cached = memo.get(key)
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
  // Retrying Links start from the failure share they saw last Step: retries carry a storm forward.
  let failures = new Map<string, number>()
  for (const link of game.links)
    if (link.failure > 0 && linkPolicy(game, graph, link.from, link.to).retry !== 'none')
      for (const kind of COMPONENTS[graph.byId.get(link.to)?.type ?? 'users'].accepts)
        failures.set(`${link.from}>${link.to}:${kind}`, link.failure)
  const nominal = new Map<string, number>()
  const sick = new Set<string>()
  const routes = userRoutes(game, (node) => (graph.routes.get(node.id)?.length ?? 0) > 0)
  const intake = new Map<string, number>()
  for (const entry of routes)
    if (entry.source) intake.set(entry.source.id, (intake.get(entry.source.id) ?? 0) + entry.share)
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
  }
  const seedSolver = solverOf(seed)
  for (const node of game.nodes) nominal.set(node.id, probeCapacity(seed, seedSolver, node))
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
      intake,
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
      // A Node that runs code holds its slot while it waits on each call it makes.
      if (!COMPONENTS[node.type].stack) continue
      const previous = callLatency.get(node.id) ?? NO_CALLS
      const blended: Partial<Record<BackendKind, number>> = {}
      for (const kind of COMPONENTS[node.type].sends) {
        if (!isBackendKind(kind)) continue
        const fresh = kind === 'callout' ? CALLOUT_MS : outcomes.held(node, kind, hopMs(game))
        blended[kind] = index === 0 ? fresh : ((previous[kind] ?? 0) + fresh) / 2
      }
      nextLatency.set(node.id, blended)
    }
    // Failure shares on retrying Links, blended like the call latencies.
    const nextFailures = new Map<string, number>()
    for (const [key, carried] of pass.links) {
      const [from, to] = key.split('>')
      const source = graph.byId.get(from ?? '')
      const target = graph.byId.get(to ?? '')
      if (!source || !target || linkPolicy(game, graph, source.id, target.id).retry === 'none')
        continue
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
  return ledgerOf(game, graph, demand, pass, outcomes, routes)
}

const ledgerOf = (
  game: Game,
  graph: Graph,
  demand: Partial<Record<RequestKind, number>>,
  pass: Pass,
  outcomes: ReturnType<typeof outcomesOf>,
  routes: ReadonlyArray<UserRoute>,
): Ledger => {
  /** What one request of `kind` gets back, over every region's users. */
  const answerOf = (kind: RequestKind): Outcome => {
    const only = routes.length === 1 ? routes[0] : undefined
    if (only && only.extraMs === 0)
      return only.source ? outcomes.outcome(only.source, kind) : failed('stranded')
    const mixed = blend(
      routes.map((entry) => {
        const answer = entry.source ? outcomes.outcome(entry.source, kind) : failed('stranded')
        return [
          entry.extraMs > 0 ? through(hop({ fixed: entry.extraMs }), [[answer, 1]]) : answer,
          entry.share,
        ] as const
      }),
    )
    return mixed ?? failed('stranded')
  }

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
    const result = answerOf(kind)
    const apdex = apdexOf(result, PROFILES[kind].apdex)
    kinds[kind] = {
      rate,
      success: result.success,
      apdex,
      mean: meanOf(result),
      p50: percentile(result, 0.5),
      p95: percentile(result, 0.95),
      p99: percentile(result, 0.99),
    }
    // Bots earn nothing and do not count toward Apdex or errors: blocking one is a success.
    if (!PROFILES[kind].scored) continue
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
      hitRatio: node.type === 'cache' || node.type === 'cdn' ? (pass.hits.get(node.id) ?? 0) : null,
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
    insight += sampled * INSIGHT_YIELD * (2 - apdex) * insightPerk(game)
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
        failure: 0,
      }
    }
    const carried = pass.links.get(`${link.from}>${link.to}`) ?? {}
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
        const rates = pass.arriving.get(node.id) ?? {}
        for (const kind of REQUEST_KINDS)
          egress +=
            (((rates[kind] ?? 0) * cdnHitOf(node, kind, game) * PROFILES[kind].payloadKB) /
              1_000_000) *
            EGRESS_CDN
      }
    }
    // Traffic between zones bills both ways: requests at their payload, backend calls at 4 KB.
    for (const [key, carried] of pass.links) {
      const [from, to] = key.split('>')
      const source = graph.byId.get(from ?? '')
      const target = graph.byId.get(to ?? '')
      if (!source || !target) continue
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
    revenue: revenue + subscriptions,
    subscriptions,
    insight,
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
  const policy = linkPolicy(game, graph, link.from, link.to)
  const watched = policy.retry !== 'none' || (link.breaker && has(game, 'circuit-breakers'))
  const source = graph.byId.get(link.from)
  const target = graph.byId.get(link.to)
  if (!watched || policy.open || rate <= 0 || !source || !target) return 0
  return entries.reduce(
    (total, [kind, carried]) => total + (carried / rate) * outcomes.failureOn(source, target, kind),
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
