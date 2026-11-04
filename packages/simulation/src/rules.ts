import {
  BACKEND_KINDS,
  BACKLOG_MS,
  CACHE_ENGINES,
  CACHE_OPS,
  CACHE_TTLS,
  CDN_HIT,
  CDN_TTLS,
  PSP_CAPACITY,
  GPU_FIRST_TOKEN_MS,
  GPU_TYPES,
  LLM_FIRST_TOKEN_MS,
  LLM_RATE,
  REGEX_CAPACITY,
  SLOW_CHARGE_MS,
  TOKENS_PER_PROMPT,
  DSQL_READ_COST,
  DSQL_TX,
  HOT_KEY_SHARE,
  MSGP_RATE,
  SPREAD_REGIONS,
  WIDE_OPS,
  WIDE_STALE,
  WIDE_TX_DUPLICATE,
  WIDE_TX_STALE,
  rttOf,
  TIERED_MEDIA_HIT,
  COALESCED,
  COMPONENTS,
  DRAIN_SECONDS,
  PARANOIA,
  POISON_SHARE,
  PROFILES,
  QUEUE_RATE,
  SEARCH_QPS,
  UNDER_ATTACK,
  FRAMEWORKS,
  HOT_KB_PER_USER,
  MIGRATION_BUGS,
  P2C_CAPACITY,
  POOLER_CONNECTIONS,
  REQUEST_KINDS,
  ROLLOUT_SHARE,
  RUNTIMES,
  SESSION_STATE_CRASHES,
  UPGRADE_CRASHES,
  type ComponentId,
  type Kind,
  type RequestKind,
} from './catalog.ts'
import {
  FLAT_CAPACITY,
  asyncCallsOf,
  callsOf,
  databaseModel,
  flatModel,
  serverModel,
  type Calls,
  type NodeModel,
} from './capacity.ts'
import {
  NO_FAILURES,
  answered,
  blend,
  failSome,
  failed,
  kthFastest,
  through,
  type Hop,
  type Outcome,
} from './distribution.ts'
import { mixOf, payloadFactor, queryFactor } from './features.ts'
import { clusterOf, flatScale, grown, has, hopMs, inCluster, transferMs } from './lookups.ts'
import { buggy } from './migration.ts'
import { spreadRegions } from './regions.ts'
import type { Game, GameNode } from './state.ts'
import { RUNNING, warmOf } from './life.ts'
import { badDeployShare, fixed } from './team.ts'

/* ==========================================================================
   What each Component does in the flow solve, one rule per Component. The
   solve walks the graph, splits traffic, repeats its passes, and builds the
   Ledger; a rule answers the questions that depend on the Component:

   - `model`: its capacity and latency for the work that reaches it.
   - `serve`: what it sends on for the work it processed.
   - `outcome`: what one request of a kind gets back from it.
   - `connections`: the database connections it opens to each data Node it calls.
   - `probe`: the work it is weighed with, for a Load Balancer's split.

   The table is a Record over every ComponentId, so a new Component cannot
   compile until it answers each one.
   ========================================================================== */

export type Rates = Partial<Record<Kind, number>>

/** What a rule may ask the solve about the Design in the current pass. */
export type Solver = Readonly<{
  game: Game
  /** 2 on the Node the Bottleneck search boosts, 1 elsewhere. */
  boost: (node: GameNode) => number
  /** Milliseconds an App Server holds a slot per call, by backend kind, from the last pass. */
  callLatency: (node: GameNode) => Calls
  /** Requests in flight on the last pass. */
  inflight: (node: GameNode) => number
  /** An Auth Provider takes this App Server's logins. */
  delegates: (node: GameNode) => boolean
  /** Postgres still runs on this App Server. */
  runsLocalDb: (node: GameNode) => boolean
  /** CPU overhead from Analytics sampling this Node. */
  sampling: (node: GameNode) => number
  /** This App Server can hand async work to a Queue. */
  offloads: (node: GameNode) => boolean
  /** This Worker pulls from a Queue a poison message is stuck in. */
  poisoned: (node: GameNode) => boolean
  /** Share of the tasks a Queue or Worker gets that come from each request kind, in this pass. */
  taskMix: (node: GameNode) => Partial<Record<RequestKind, number>>
  /** Attempts per task this Worker runs: failed tasks come back until the Queue parks them. */
  attempts: (node: GameNode) => number
  /** Tasks per second a Queue's live Workers could take, from the last pass; infinite before one. */
  drainable: (node: GameNode) => number
}>

export type Model = NodeModel & { disk?: boolean }

/** What one pass of the solve found. */
export type Pass = Readonly<{
  /** Each Node's place in the per-Node arrays below, by id. */
  at: ReadonlyMap<string, number>
  arriving: ReadonlyArray<Rates>
  models: ReadonlyArray<Model | undefined>
  hits: ReadonlyArray<number | undefined>
  /** Share of each Cache's hits that are stale. */
  staleHits: ReadonlyArray<number | undefined>
  stranded: ReadonlyArray<Readonly<{ rate: number; kinds: ReadonlySet<Kind> }> | undefined>
  /** What each routing Link carried, by kind, indexed by the solve's Edge numbers. */
  links: ReadonlyArray<Rates | undefined>
  /** The Edges that carried anything, in the order they first did: sums over Links run in it. */
  linkOrder: ReadonlyArray<number>
  connections: ReadonlyArray<Readonly<{ used: number; max: number }> | undefined>
  /** Tasks per second each Queue or Worker gets, by the request kind that enqueued them. */
  tasks: ReadonlyArray<Partial<Record<RequestKind, number>> | undefined>
  /** Tasks per second each Queue's Workers take from it. */
  drained: ReadonlyArray<number | undefined>
  /** Milliseconds replicas lag behind the primary. */
  lag: number
  /** Share of replica reads that are stale. */
  staleShare: number
}>

/** A Node's place in a pass's per-Node arrays. */
export const slotOf = (pass: Pass, node: GameNode): number => pass.at.get(node.id) as number

/** What `serve` may do: send work on, and record a Cache's hit ratio. */
export type Serve = Readonly<{
  solver: Solver
  /** Sends `rate` requests of `kind` on, split over the Links that take it. */
  route: (kind: Kind, rate: number) => void
  setHits: (hit: number, stale: number) => void
}>

/** With Read-your-writes routing, this share of stale reads still reaches a lagging replica. */
export const RYW_STALE = 0.2

/**
 * Share of the tasks that come from each kind when nothing says otherwise: the
 * kinds that can go async, by demand. A Queue's own mix comes from its App Servers.
 */
export const taskMixOf = (game: Game): Partial<Record<RequestKind, number>> => {
  const mix = mixOf(game)
  const shares: Partial<Record<RequestKind, number>> = {}
  let total = 0
  for (const kind of REQUEST_KINDS)
    if (PROFILES[kind].offload > 0 && (mix[kind] ?? 0) > 0) {
      shares[kind] = mix[kind] ?? 0
      total += mix[kind] ?? 0
    }
  if (total <= 0) return { upload: 1 }
  for (const kind of Object.keys(shares) as Array<RequestKind>)
    shares[kind] = (shares[kind] ?? 0) / total
  return shares
}

/** A Queue's or Worker's task mix in a pass, or null when no task reached it. */
export const mixIn = (pass: Pass, node: GameNode): Partial<Record<RequestKind, number>> | null => {
  const tasks = pass.tasks[slotOf(pass, node)]
  if (!tasks) return null
  let total = 0
  for (const kind of Object.keys(tasks) as Array<RequestKind>) total += tasks[kind] ?? 0
  if (total <= 0) return null
  const shares: Partial<Record<RequestKind, number>> = {}
  for (const kind of Object.keys(tasks) as Array<RequestKind>)
    shares[kind] = (tasks[kind] ?? 0) / total
  return shares
}

/**
 * Share of requests the code itself fails on an App Server or Worker: a bad
 * deploy, a migration's bugs, or a Cluster upgrade gone wrong. A rolling deploy
 * stops after its first batch of pods, so pods take a share of a bad deploy.
 */
export const codeCrashes = (game: Game, node: GameNode): number => {
  const incident = game.incident
  const cluster = clusterOf(game, node)
  const deploy =
    incident?.kind === 'bad-deploy' ? badDeployShare(game) * (cluster ? ROLLOUT_SHARE : 1) : 0
  const upgrade =
    incident?.kind === 'cluster-upgrade' && cluster !== undefined && cluster === incident.nodeId
      ? UPGRADE_CRASHES
      : 0
  return deploy + upgrade + (buggy(game, node) ? MIGRATION_BUGS : 0)
}

/** What `outcome` may ask: this Node's own hop, and what its calls get back. */
export type Answer = Readonly<{
  game: Game
  pass: Pass
  ownHop: (kind: Kind, value?: number) => Hop
  /** What one request of `kind` sent on from this Node gets back. */
  downstream: (kind: Kind, extraHop?: number) => Outcome
  delegates: boolean
  runsLocalDb: boolean
  offloads: boolean
}>

export type ComponentRule = Readonly<{
  model: (solver: Solver, node: GameNode, arriving: Rates) => Model
  serve: (serve: Serve, node: GameNode, rates: Rates, share: number) => void
  outcome: (answer: Answer, node: GameNode, kind: Kind) => Outcome
  /** Database connections it holds to each data Node it calls, given what reaches it. */
  connections: (solver: Solver, node: GameNode, model: Model | undefined, inbound: number) => number
  /** The work a Load Balancer weighs it by, or null to use its flat capacity. */
  probe: (game: Game) => Rates | null
}>

/* ---------- shared pieces ---------- */

/** Requests per second of a flat Component at its size. */
export const flatCapacity = (node: GameNode): number =>
  (FLAT_CAPACITY[node.type] ?? 0) * flatScale(node)

/** Each kind it processed, at its processed rate. */
const each = (rates: Rates, share: number, apply: (kind: Kind, processed: number) => void) => {
  for (const kind of Object.keys(rates) as Array<Kind>) {
    const processed = (rates[kind] ?? 0) * share
    if (processed > 0) apply(kind, processed)
  }
}

/** Sends everything it processed on, unchanged. */
const passOn = (serve: Serve, _: GameNode, rates: Rates, share: number) =>
  each(rates, share, (kind, processed) => serve.route(kind, processed))

const nothing = () => {}
const noConnections = () => 0
const noProbe = () => null

/** Its own hop, then what it sends on. */
const relay = (answer: Answer, _: GameNode, kind: Kind): Outcome =>
  through(answer.ownHop(kind), [[answer.downstream(kind), 1]])

const unlimited =
  (fixedMs: number, variableMs: number) => (_: Solver, __: GameNode, arriving: Rates) =>
    flatModel(Number.POSITIVE_INFINITY, arriving, { fixed: fixedMs, variable: variableMs }, 1)

const flat =
  (service: Readonly<{ fixed: number; variable: number }>, capacity = flatCapacity) =>
  (solver: Solver, node: GameNode, arriving: Rates) =>
    flatModel(capacity(node), arriving, service, solver.boost(node))

/* ---------- the Cache ---------- */

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
    Math.sqrt(fits) *
    cacheTtlOf(node.ttl).factor *
    (1 - Math.min(0.5, 2 * writeShare)) *
    warmOf(node.life)
  )
}

/** A CDN's hit ratio for a kind at its TTL. Tiered caching lifts video. */
export const cdnHitOf = (node: GameNode, kind: Kind, game?: Game): number => {
  const ttl = CDN_TTLS.find((entry) => entry.ttl === node.ttl) ?? CDN_TTLS[1]
  const base =
    kind === 'media' && game && has(game, 'tiered-caching')
      ? TIERED_MEDIA_HIT
      : (CDN_HIT[kind] ?? 0)
  return Math.min(0.95, base * ttl.factor)
}

/** A WAF's paranoia level, or Under attack mode. */
export const wafOf = (node: GameNode) => {
  const level =
    PARANOIA[Math.max(0, Math.min(PARANOIA.length - 1, node.paranoia - 1))] ?? PARANOIA[1]
  return node.underAttack
    ? {
        block: UNDER_ATTACK.block,
        falsePositive: UNDER_ATTACK.falsePositive,
        cpu: UNDER_ATTACK.cpu,
      }
    : level
}

/* ---------- the table ---------- */

const terminal: Pick<ComponentRule, 'serve' | 'connections' | 'probe'> = {
  serve: nothing,
  connections: noConnections,
  probe: noProbe,
}

export const RULES: Record<ComponentId, ComponentRule> = {
  users: {
    model: unlimited(30, 0),
    serve: passOn,
    // An expired certificate: every browser refuses the site until it is renewed.
    outcome: (answer, node, kind) =>
      answer.game.incident?.kind === 'certificate' || answer.game.incident?.kind === 'bgp'
        ? failed('down')
        : relay(answer, node, kind),
    connections: noConnections,
    probe: noProbe,
  },
  dns: {
    model: unlimited(0, 0),
    serve: passOn,
    outcome: relay,
    connections: noConnections,
    probe: noProbe,
  },
  lb: {
    model: (solver, node, arriving) =>
      flatModel(
        flatCapacity(node) *
          (node.policy === 'p2c' && has(solver.game, 'lb-algorithms') ? P2C_CAPACITY : 1),
        arriving,
        { fixed: 1, variable: 0.1 },
        solver.boost(node),
      ),
    serve: passOn,
    outcome: relay,
    connections: noConnections,
    probe: noProbe,
  },
  server: {
    model: (solver, node, arriving) =>
      serverModel({
        game: solver.game,
        node,
        arriving,
        callLatency: solver.callLatency(node),
        delegated: solver.delegates(node),
        local: solver.runsLocalDb(node),
        inflight: solver.inflight(node),
        boost: solver.boost(node),
        sampling: solver.sampling(node),
        hashing: solver.game.incident?.kind === 'loop' ? 4 : 1,
        offloaded: solver.offloads(node),
        pod: inCluster(solver.game, node),
      }),
    serve: (serve, node, rates, share) => {
      const { solver } = serve
      if (solver.runsLocalDb(node)) return
      const delegated = solver.delegates(node)
      const offloaded = solver.offloads(node)
      each(rates, share, (kind, processed) => {
        const calls = callsOf(solver.game, node, kind as RequestKind, delegated, offloaded)
        for (const backend of BACKEND_KINDS) serve.route(backend, processed * (calls[backend] ?? 0))
      })
    },
    outcome: (answer, node, kind) => {
      const { game } = answer
      const requestKind = kind as RequestKind
      const served = answer.ownHop(kind, FRAMEWORKS[node.framework].value[requestKind] ?? 1)
      // The response crosses the user's downlink: bytes over bandwidth.
      const own = {
        ...served,
        fixed:
          served.fixed +
          transferMs(node, requestKind, answer.offloads) * payloadFactor(game, requestKind),
      }
      const crashes = codeCrashes(game, node)
      // A runtime that holds a worker per open connection cannot keep realtime connections.
      if (requestKind === 'rt' && RUNTIMES[node.runtime].connectionKB === null)
        return failed('refused')
      if (answer.runsLocalDb) return failSome(through(own), crashes, 'crash')
      const calls = callsOf(game, node, requestKind, answer.delegates, answer.offloads)
      const hop = hopMs(game)
      // Read-your-writes routing sends a checkout's read, and most reads after a write, to the primary.
      const ryw = node.ryw && has(game, 'ryw-routing')
      const fresh = (backend: Kind, outcome: Outcome): Outcome =>
        ryw && backend === 'q-read' && outcome.stale > 0
          ? { ...outcome, stale: requestKind === 'buy' ? 0 : outcome.stale * RYW_STALE }
          : outcome
      // A call to a Queue returns once the task is enqueued: what happens after is async.
      // A stale read fails an API read, and a checkout that reads its own write.
      return failSome(
        through(
          own,
          BACKEND_KINDS.flatMap((backend, index) =>
            index < 3 || (calls[backend] ?? 0) > 0
              ? [[fresh(backend, answer.downstream(backend, hop)), calls[backend] ?? 0] as const]
              : [],
          ),
          requestKind === 'read' || requestKind === 'buy',
        ),
        crashes,
        'crash',
      )
    },
    // Every app process holds its own pool to each database it reaches.
    connections: (solver, node, model) => {
      if (solver.runsLocalDb(node)) return 0
      const surge = solver.game.incident?.kind === 'connections' ? 2 : 1
      return (model?.processes ?? 0) * RUNTIMES[node.runtime].connections * surge
    },
    probe: (game) => {
      const mix = mixOf(game)
      return Object.fromEntries(REQUEST_KINDS.map((kind) => [kind, mix[kind] ?? 0]))
    },
  },
  database: {
    model: (solver, node, arriving) =>
      databaseModel({ game: solver.game, node, arriving, boost: solver.boost(node) }),
    outcome: (answer, node, kind) => {
      // A full disk: Postgres cannot extend a file, so every write fails.
      if (
        answer.game.incident?.kind === 'disk-full' &&
        answer.game.incident.nodeId === node.id &&
        (kind === 'q-write' || kind === 'q-tx' || kind === 'blob-put')
      )
        return failed('refused')
      const pool = answer.pass.connections[slotOf(answer.pass, node)]
      const refused = pool && pool.used > pool.max ? 1 - pool.max / pool.used : 0
      const reply: Outcome = {
        ...answered(0, 0),
        success: 1 - refused,
        stale: node.type === 'replica' && kind === 'q-read' ? answer.pass.staleShare : 0,
        fail: { ...NO_FAILURES, refused },
      }
      return through(answer.ownHop(kind), [[reply, 1]])
    },
    ...terminal,
    probe: () => ({ 'q-read': 1 }),
  },
  // A Read Replica runs the Database's model and answers only reads.
  replica: {
    model: (solver, node, arriving) =>
      databaseModel({ game: solver.game, node, arriving, boost: solver.boost(node) }),
    outcome: (answer, node, kind) => RULES.database.outcome(answer, node, kind),
    ...terminal,
    probe: () => ({ 'q-read': 1 }),
  },
  pooler: {
    model: flat({ fixed: 0.3, variable: 0 }),
    serve: passOn,
    // Transaction pooling breaks code that keeps session state, until a task removes it.
    outcome: (answer, node, kind) =>
      failSome(
        relay(answer, node, kind),
        node.mode === 'transaction' && !fixed(answer.game, 'session-state')
          ? SESSION_STATE_CRASHES
          : 0,
        'crash',
      ),
    // Session mode holds a server connection per client; transaction mode shares a few.
    connections: (_, node, __, inbound) =>
      node.mode === 'session' ? inbound : Math.min(POOLER_CONNECTIONS, inbound),
    probe: noProbe,
  },
  cache: {
    model: (solver, node, arriving) =>
      flatModel(
        cacheCapacity(node) / hotKeyFactor(solver.game, node),
        arriving,
        { fixed: 0.5, variable: 0.2 },
        solver.boost(node),
      ),
    serve: (serve, node, rates, share) => {
      const reads = rates['q-read'] ?? 0
      const writes = rates['q-write'] ?? 0
      const writeShare = reads + writes > 0 ? writes / (reads + writes) : 0
      const { game } = serve.solver
      const hit = hitRatioOf(game, node, writeShare)
      serve.setHits(hit, cacheTtlOf(node.ttl).stale * writeShare)
      // Stampede protection: misses only a cold Cache has wait on one fetch per key.
      const warmHit = hitRatioOf(game, { ...node, life: RUNNING }, writeShare)
      const sent =
        node.coalesce && has(game, 'stampede-protection')
          ? 1 - warmHit + (warmHit - hit) * COALESCED
          : 1 - hit
      each(rates, share, (kind, processed) =>
        serve.route(kind, kind === 'q-read' ? processed * sent : processed),
      )
    },
    outcome: (answer, node, kind) => {
      if (kind !== 'q-read') return relay(answer, node, kind)
      const hit = answer.pass.hits[slotOf(answer.pass, node)] ?? 0
      const mixed = blend([
        [{ ...answered(0, 0), stale: answer.pass.staleHits[slotOf(answer.pass, node)] ?? 0 }, hit],
        [answer.downstream(kind, hopMs(answer.game)), 1 - hit],
      ])
      return through(answer.ownHop(kind), mixed ? [[mixed, 1]] : [])
    },
    // A Cache in front of the Database passes its callers' connections through.
    connections: (_, __, ___, inbound) => inbound,
    probe: noProbe,
  },
  auth: {
    model: unlimited(120, 15),
    outcome: (answer, _, kind) => through(answer.ownHop(kind)),
    ...terminal,
  },
  analytics: {
    model: () => flatModel(Number.POSITIVE_INFINITY, {}, { fixed: 0, variable: 0 }, 1),
    outcome: () => failed('stranded'),
    ...terminal,
  },
  payments: {
    model: () => flatModel(Number.POSITIVE_INFINITY, {}, { fixed: 0, variable: 0 }, 1),
    outcome: () => failed('stranded'),
    ...terminal,
  },
  search: {
    model: (solver, node, arriving) =>
      flatModel(
        (SEARCH_QPS * flatScale(node)) / queryFactor(solver.game, 'q-search'),
        arriving,
        { fixed: 15, variable: 2 },
        solver.boost(node),
      ),
    outcome: (answer, _, kind) => through(answer.ownHop(kind)),
    ...terminal,
  },
  storage: {
    model: unlimited(40, 5),
    outcome: (answer, _, kind) => through(answer.ownHop(kind)),
    ...terminal,
  },
  queue: {
    model: flat({ fixed: 2, variable: 0.05 }, (node) => QUEUE_RATE * flatScale(node)),
    // It offers its Workers what arrived, plus a share of its backlog as far as they have room.
    serve: (serve, node, rates, share) => {
      if (share <= 0) return
      const arrived = (rates.task ?? 0) * share
      const room = Math.max(0, serve.solver.drainable(node) - arrived)
      serve.route('task', arrived + Math.min(node.depth / DRAIN_SECONDS, room))
    },
    // The caller waits for the enqueue only. A long backlog slows the broker.
    outcome: (answer, node, kind) => {
      const own = answer.ownHop(kind)
      // With no Worker linked, the task has nowhere to go.
      if (answer.downstream(kind).fail.stranded >= 1) return failed('stranded')
      const enqueued = through({ ...own, fixed: own.fixed + BACKLOG_MS * node.depth })
      // A full Queue refuses what its Workers cannot take (RabbitMQ `reject-publish`).
      if (node.maxLength <= 0 || node.depth < node.maxLength) return enqueued
      const slot = slotOf(answer.pass, node)
      const inflow = answer.pass.arriving[slot]?.task ?? 0
      const drained = answer.pass.drained[slot] ?? 0
      return inflow > 0
        ? failSome(enqueued, Math.max(0, 1 - drained / inflow), 'dropped')
        : enqueued
    },
    connections: noConnections,
    probe: noProbe,
  },
  worker: {
    // Each task costs the async part of the kind it came from, once per attempt. A poison
    // message eats most of its time.
    model: (solver, node, arriving) => {
      const tasks =
        ((arriving.task ?? 0) * solver.attempts(node)) /
        (solver.poisoned(node) ? 1 - POISON_SHARE : 1)
      const mix = solver.taskMix(node)
      const work: Partial<Record<RequestKind, number>> = {}
      for (const kind of Object.keys(mix) as Array<RequestKind>)
        work[kind] = tasks * (mix[kind] ?? 0)
      return serverModel({
        game: solver.game,
        node,
        arriving: work,
        callLatency: solver.callLatency(node),
        delegated: false,
        local: false,
        inflight: solver.inflight(node),
        boost: solver.boost(node),
        sampling: solver.sampling(node),
        hashing: 1,
        worker: true,
        pod: inCluster(solver.game, node),
      })
    },
    // It sends the async part's calls, once per attempt: an export's 50 reads.
    serve: (serve, node, rates, share) => {
      const tasks = (rates.task ?? 0) * share * serve.solver.attempts(node)
      if (tasks <= 0) return
      const mix = serve.solver.taskMix(node)
      for (const kind of Object.keys(mix) as Array<RequestKind>) {
        const calls = asyncCallsOf(serve.solver.game, kind)
        for (const backend of BACKEND_KINDS)
          serve.route(backend, tasks * (mix[kind] ?? 0) * (calls[backend] ?? 0))
      }
    },
    // One attempt: its own time, its calls, and the code's own failures. Users never wait for it.
    outcome: (answer, node, kind) => {
      const { game } = answer
      const mix = mixIn(answer.pass, node) ?? taskMixOf(game)
      const calls: Partial<Record<Kind, number>> = {}
      for (const origin of Object.keys(mix) as Array<RequestKind>) {
        const each = asyncCallsOf(game, origin)
        for (const backend of BACKEND_KINDS)
          calls[backend] = (calls[backend] ?? 0) + (mix[origin] ?? 0) * (each[backend] ?? 0)
      }
      const hop = hopMs(game)
      return failSome(
        through(
          answer.ownHop(kind),
          BACKEND_KINDS.flatMap((backend) =>
            (calls[backend] ?? 0) > 0
              ? [[answer.downstream(backend, hop), calls[backend] ?? 0] as const]
              : [],
          ),
        ),
        codeCrashes(game, node),
        'crash',
      )
    },
    // A Worker holds a pool to each database it reads, like an App Server.
    connections: (_, node, model) => (model?.processes ?? 0) * RUNTIMES[node.runtime].connections,
    probe: noProbe,
  },
  cdn: {
    model: unlimited(8, 0),
    serve: (serve, node, rates, share) => {
      const { game } = serve.solver
      serve.setHits(cdnHitOf(node, 'page'), 0)
      each(rates, share, (kind, processed) =>
        serve.route(kind, processed * (1 - cdnHitOf(node, kind, game))),
      )
    },
    // A hit is answered at the edge; a miss goes on to the origin.
    outcome: (answer, node, kind) => {
      const hit = cdnHitOf(node, kind, answer.game)
      if (hit <= 0) return relay(answer, node, kind)
      const mixed = blend([
        [answered(0, 0), hit],
        [answer.downstream(kind), 1 - hit],
      ])
      return through(answer.ownHop(kind), mixed ? [[mixed, 1]] : [])
    },
    connections: noConnections,
    probe: noProbe,
  },
  waf: {
    model: (solver, node, arriving) =>
      flatModel(
        (flatCapacity(node) / wafOf(node).cpu) *
          (solver.game.incident?.kind === 'regex' ? REGEX_CAPACITY : 1),
        arriving,
        { fixed: 2 + (node.underAttack ? UNDER_ATTACK.latency : 0), variable: 0.1 },
        solver.boost(node),
      ),
    // Bots stop here at the block rate; real users at the false positive rate.
    serve: (serve, node, rates, share) => {
      const waf = wafOf(node)
      each(rates, share, (kind, processed) =>
        serve.route(kind, processed * (1 - (kind === 'bot' ? waf.block : waf.falsePositive))),
      )
    },
    outcome: (answer, node, kind) =>
      failSome(
        relay(answer, node, kind),
        kind === 'bot' ? wafOf(node).block : wafOf(node).falsePositive,
        'blocked',
      ),
    connections: noConnections,
    probe: noProbe,
  },
  // A Managed Component: 400 ms per charge, and its own outages.
  psp: {
    model: (solver, node, arriving) =>
      flatModel(
        PSP_CAPACITY * flatScale(node),
        arriving,
        {
          fixed: 400,
          variable: 30 + (solver.game.incident?.kind === 'double-charge' ? SLOW_CHARGE_MS : 0),
        },
        solver.boost(node),
      ),
    outcome: (answer, _, kind) =>
      answer.game.incident?.kind === 'psp-outage'
        ? failed('upstream')
        : through(answer.ownHop(kind)),
    ...terminal,
  },
  autoscaler: {
    model: () => flatModel(Number.POSITIVE_INFINITY, {}, { fixed: 0, variable: 0 }, 1),
    outcome: () => failed('stranded'),
    ...terminal,
  },
  cluster: {
    model: () => flatModel(Number.POSITIVE_INFINITY, {}, { fixed: 0, variable: 0 }, 1),
    outcome: () => failed('stranded'),
    ...terminal,
  },
  // Columnar scans: slow, unlimited, and paid per scan.
  warehouse: {
    model: unlimited(1_500, 200),
    outcome: (answer, _, kind) => through(answer.ownHop(kind)),
    ...terminal,
  },
  // Prompts per second: tokens per second over the tokens in a prompt. A cold Node loads its model.
  gpu: {
    model: (solver, node, arriving) =>
      flatModel(
        gpuCapacity(node) * Math.max(0.1, warmOf(node.life)),
        arriving,
        { fixed: GPU_FIRST_TOKEN_MS, variable: 100 },
        solver.boost(node),
      ),
    outcome: (answer, _, kind) => through(answer.ownHop(kind)),
    ...terminal,
  },
  // A Managed Component: 10,000 messages a second, paid per message.
  msgp: {
    model: (solver, node, arriving) =>
      flatModel(
        MSGP_RATE * flatScale(node),
        arriving,
        { fixed: 100, variable: 10 },
        solver.boost(node),
      ),
    outcome: (answer, _, kind) => through(answer.ownHop(kind)),
    ...terminal,
  },
  // Leaderless quorums: a read waits for R replies, a write for W, of N replicas.
  wide: {
    model: (solver, node, arriving) => {
      const { reads, writes } = splitWork(arriving)
      const ops = reads * quorumR(node) + writes * quorumN(node)
      const rate = reads + writes
      const capacity =
        (WIDE_OPS * flatScale(node)) / hotKeyFactor(solver.game, node) / (ops > 0 ? ops / rate : 1)
      const model = flatModel(capacity, arriving, { fixed: 1, variable: 0 }, solver.boost(node))
      const wait = model.service['q-read']?.variable ?? 0
      const service: Record<string, { fixed: number; variable: number }> = {}
      for (const kind of Object.keys(arriving))
        service[kind] = {
          fixed: 1,
          variable:
            wait +
            WIDE_REPLICA_MS *
              kthFastest(kind === 'q-read' ? quorumR(node) : quorumW(node), quorumN(node)),
        }
      return { ...model, service }
    },
    outcome: (answer, node, kind) => {
      const n = quorumN(node)
      // One replica lost: a quorum that needs every replica cannot form.
      const short = node.lost > 0 ? 1 : 0
      const needed = kind === 'q-read' ? quorumR(node) : quorumW(node)
      if (needed > n - short) return failed('refused')
      const reply = through(answer.ownHop(kind))
      // Overlap is not linearizability: a checkout on a quorum store still goes wrong now and then.
      if (kind === 'q-tx')
        return failSome({ ...reply, stale: WIDE_TX_STALE }, WIDE_TX_DUPLICATE, 'duplicate')
      if (kind !== 'q-read') return reply
      return {
        ...reply,
        stale: wideStale(answer.pass.arriving[slotOf(answer.pass, node)] ?? {}, node),
      }
    },
    ...terminal,
    probe: () => ({ 'q-read': 1 }),
  },
  // Consensus: a write waits for a majority of its regions; a read asks the leaseholder.
  dsql: {
    model: (solver, node, arriving) => {
      const { reads, writes } = splitWork(arriving)
      const rate = reads + writes
      const work = reads * DSQL_READ_COST + writes
      const capacity = (DSQL_TX * flatScale(node)) / (work > 0 ? work / rate : 1)
      const model = flatModel(capacity, arriving, { fixed: 3, variable: 1 }, solver.boost(node))
      const majority = majorityMs(solver.game, node)
      const service: Record<string, { fixed: number; variable: number }> = {}
      for (const kind of Object.keys(arriving)) {
        const base = model.service[kind] ?? { fixed: 3, variable: 1 }
        service[kind] = kind === 'q-read' ? base : { ...base, fixed: base.fixed + majority }
      }
      return { ...model, service }
    },
    outcome: (answer, _, kind) => through(answer.ownHop(kind)),
    ...terminal,
    probe: () => ({ 'q-tx': 1 }),
  },
  // A Managed Component with a rate limit: past it, prompts fail as `throttled` at once.
  llm: {
    model: (solver, node, arriving) =>
      flatModel(
        LLM_RATE * flatScale(node),
        arriving,
        { fixed: LLM_FIRST_TOKEN_MS, variable: 0 },
        solver.boost(node),
      ),
    outcome: (answer, _, kind) => through({ ...answer.ownHop(kind), cause: 'throttled' }),
    ...terminal,
  },
}

/** Prompts per second a GPU Node serves at full warmth. */
export const gpuCapacity = (node: GameNode): number =>
  (GPU_TYPES[node.gpu].tokens * flatScale(node)) / TOKENS_PER_PROMPT

/** Each Component's accepted kinds as a set: the solver asks on every route. */
const ACCEPTS = new Map<ComponentId, ReadonlySet<Kind>>(
  Object.values(COMPONENTS).map((component) => [component.id, new Set(component.accepts)]),
)

/** Whether a Node takes a kind on an inbound Link. */
export const accepts = (node: GameNode, kind: Kind): boolean =>
  (ACCEPTS.get(node.type) as ReadonlySet<Kind>).has(kind)

/* ---------- quorums, consensus and hot keys ---------- */

/** Mean ms one Wide-column replica takes to answer. Proposed. */
export const WIDE_REPLICA_MS = 2

export const quorumN = (node: GameNode): number => Math.max(1, Math.min(5, node.n))
export const quorumR = (node: GameNode): number => Math.max(1, Math.min(quorumN(node), node.r))
export const quorumW = (node: GameNode): number => Math.max(1, Math.min(quorumN(node), node.w))

/** R + W > N: every read asks a replica that took the latest write (07 "Wide-column Store"). */
export const strongQuorum = (node: GameNode): boolean =>
  quorumR(node) + quorumW(node) > quorumN(node)

const splitWork = (arriving: Rates) => {
  const reads = arriving['q-read'] ?? 0
  const writes = (arriving['q-write'] ?? 0) + (arriving['q-tx'] ?? 0) + (arriving['k-write'] ?? 0)
  return { reads, writes }
}

/** Share of a weak quorum's reads that miss the latest write: more writes, fewer replicas asked. */
export const wideStale = (arriving: Rates, node: GameNode): number => {
  if (strongQuorum(node)) return 0
  const { reads, writes } = splitWork(arriving)
  const writeShare = reads + writes > 0 ? writes / (reads + writes) : 0
  const missed = (quorumN(node) - quorumW(node)) / quorumN(node)
  return Math.min(0.5, WIDE_STALE * writeShare * missed * (2 / (quorumR(node) + 1)) + 0.05 * missed)
}

/**
 * Ms a consensus write waits for its majority: the ⌈n/2⌉-th smallest round trip
 * from the leader's region, itself counting as 0 (07 "Distributed SQL").
 */
export const majorityMs = (game: Game, node: GameNode): number => {
  const regions = spreadRegions(game, node, SPREAD_REGIONS)
  const trips = regions.map((region) => rttOf(node.region, region)).toSorted((a, b) => a - b)
  const majority = Math.floor(trips.length / 2) + 1
  return trips[majority - 1] ?? 0
}

/**
 * During a Hot key, 30% of the reads ask one key on one shard (07 "Fan-out"):
 * the Node's capacity divides by this. Splitting hot keys spreads them again.
 */
export const hotKeyFactor = (game: Game, node: GameNode): number => {
  const incident = game.incident
  if (incident?.kind !== 'hot-key' || incident.nodeId !== node.id) return 1
  if (node.split && has(game, 'hybrid-fanout')) return 1
  const shards = Math.max(2, flatScale(node))
  return HOT_KEY_SHARE * shards + 1 - HOT_KEY_SHARE
}
