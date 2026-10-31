import {
  COMPONENTS,
  FRAMEWORKS,
  FRAMEWORK_RESEARCH,
  KINDS,
  LANGUAGES,
  LANGUAGE_RESEARCH,
  LEVEL_BURN,
  LEVEL_CAPACITY,
  LEVEL_COST,
  MAX_LEVEL,
  REQUEST_KINDS,
  RESEARCH,
  RPS_PER_USER,
  STAGES,
  type ComponentId,
  type FrameworkId,
  type Kind,
  type LanguageId,
  type RequestKind,
  type ResearchId,
  type StageDef,
} from './catalog.ts'
import type { Game, GameLink, GameNode, Incident, Sample } from './state.ts'

/* ==========================================================================
   The Simulation. `solve` derives the Ledger for a Game: how much of each
   request kind reaches each Node, what each Node can take, what it answers,
   and what the users get back. `step` advances the Game by some seconds.
   Every action the player takes is a pure function here too, so the update
   function only routes Messages.
   ========================================================================== */

export type NodeStatus = 'idle' | 'ok' | 'warn' | 'danger' | 'down'

export type NodeFlow = Readonly<{
  /** Requests per second that arrive. */
  inbound: number
  /** Requests per second the Node can take. */
  capacity: number
  utilization: number
  /** Milliseconds this Node adds right now. */
  latency: number
  /** Requests per second this Node answers itself. */
  answered: number
  /** Requests per second that arrive and are dropped for lack of capacity. */
  dropped: number
  /** Requests per second that leave with nowhere to go. */
  stranded: number
  /** Request kinds that leave with nowhere to go. */
  strandedKinds: ReadonlyArray<Kind>
  status: NodeStatus
}>

export type LinkFlow = Readonly<{
  from: string
  to: string
  rate: number
  /** The kind carrying the most traffic, for the particle colour. */
  kind: Kind
}>

export type Flow = Readonly<{
  nodes: Readonly<Record<string, NodeFlow>>
  links: ReadonlyArray<LinkFlow>
  /** Human requests per second. */
  demand: number
  /** Human requests per second that got an answer. */
  served: number
  /** Share of human requests answered, 0 to 1. */
  quality: number
  /** Mean latency of an answered request, in milliseconds. */
  latency: number
  /** Revenue multiplier the latency costs, 0.25 to 1. */
  patience: number
  revenue: number
  insight: number
  burn: number
  /** Human request kinds that fail entirely, for hints. */
  failing: ReadonlyArray<RequestKind>
}>

/* ---------- lookups ---------- */

export const has = (game: Game, id: ResearchId): boolean => game.researched.includes(id)

export const stageOf = (game: Game): StageDef =>
  STAGES[Math.min(game.stage, STAGES.length - 1)] as StageDef

export const isUnlocked = (game: Game, type: ComponentId): boolean => {
  const unlock = COMPONENTS[type].unlock
  return unlock === null || has(game, unlock)
}

const stackOf = (node: GameNode) => {
  const language = LANGUAGES[node.language].effect
  const framework = FRAMEWORKS[node.framework].effect
  return { language, framework }
}

export const capacityOf = (game: Game, node: GameNode): number => {
  if (node.down > 0) return 0
  const def = COMPONENTS[node.type]
  let capacity = def.capacity * LEVEL_CAPACITY ** (node.level - 1)
  if (node.type === 'server') {
    const { language, framework } = stackOf(node)
    capacity *= language.capacity * framework.capacity
  }
  if ((node.type === 'database' || node.type === 'replica') && has(game, 'pooling')) capacity *= 1.5
  if (node.type === 'database' && has(game, 'sharding')) capacity *= 2
  if ((node.type === 'server' || node.type === 'worker') && has(game, 'autoscaling'))
    capacity *= 1.4
  return capacity
}

export const burnOf = (node: GameNode): number => {
  const def = COMPONENTS[node.type]
  let burn = def.burn * LEVEL_BURN ** (node.level - 1)
  if (node.type === 'server') {
    const { language, framework } = stackOf(node)
    burn *= language.burn * framework.burn
  }
  return burn
}

export const acceptsOf = (node: GameNode): ReadonlyArray<Kind> => {
  const def = COMPONENTS[node.type]
  if (node.type !== 'server') return def.accepts
  const cannot = LANGUAGES[node.language].effect.cannot
  return def.accepts.filter((kind) => !cannot.includes(kind))
}

const serveShare = (game: Game, node: GameNode, kind: Kind): number => {
  if (node.type === 'cache' && kind === 'q-read') return has(game, 'warming') ? 0.92 : 0.8
  if (node.type === 'cdn' && kind === 'read') return has(game, 'edge-compute') ? 0.3 : 0
  return COMPONENTS[node.type].serves[kind] ?? 0
}

const outKind = (node: GameNode, kind: Kind): Kind => COMPONENTS[node.type].transforms[kind] ?? kind

/** How much of a server's capacity one request of this kind takes. */
const loadOf = (game: Game, node: GameNode, kind: Kind): number => {
  if (node.type !== 'server') return 1
  if (kind === 'page') return has(game, 'gzip') ? 0.5 : 1
  if (kind === 'ai') return 2
  return 1
}

const valueMultiplier = (node: GameNode, kind: Kind): number => {
  if (node.type !== 'server') return 1
  const { language, framework } = stackOf(node)
  return (language.value[kind] ?? 1) * (framework.value[kind] ?? 1)
}

const baseLatency = (game: Game, node: GameNode): number => {
  let latency = COMPONENTS[node.type].latency
  if (node.type === 'server') {
    const { language, framework } = stackOf(node)
    latency *= language.latency * framework.latency
  }
  if (has(game, 'http2')) latency *= 0.85
  return latency
}

/** Latency climbs with utilization, and steeply once the Node is past its capacity. */
const loadedLatency = (base: number, utilization: number): number => {
  const busy = Math.min(utilization, 1)
  const over = Math.max(0, utilization - 1)
  return base * (1 + 2.5 * busy ** 3 + 6 * Math.min(over, 2))
}

/** Revenue multiplier for a mean latency: users leave once pages feel slow. */
export const patienceFor = (latency: number): number =>
  latency <= 220 ? 1 : Math.max(0.25, 1 - (latency - 220) / 900)

/* ---------- the solver ---------- */

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

const emptyKinds = (): Partial<Record<Kind, number>> => ({})

export const demandOf = (game: Game): Partial<Record<RequestKind, number>> => {
  const stage = stageOf(game)
  const total = game.users * RPS_PER_USER * (game.incident?.kind === 'spike' ? 2.5 : 1)
  const demand: Partial<Record<RequestKind, number>> = {}
  for (const kind of REQUEST_KINDS) {
    const share = stage.mix[kind] ?? 0
    if (share > 0) demand[kind] = total * share
  }
  if (game.incident?.kind === 'ddos') {
    demand.bot = (demand.bot ?? 0) + game.users * RPS_PER_USER * 1.6
  }
  return demand
}

export const solve = (game: Game): Flow => {
  const byId = new Map(game.nodes.map((node) => [node.id, node]))
  const isTap = (id: string) => {
    const node = byId.get(id)
    return node ? COMPONENTS[node.type].tap : false
  }
  const routes = new Map<string, Array<GameNode>>()
  const taps = new Map<string, Array<string>>()
  for (const link of game.links) {
    const to = byId.get(link.to)
    if (!byId.has(link.from) || !to) continue
    if (isTap(link.to)) {
      taps.set(link.to, [...(taps.get(link.to) ?? []), link.from])
    } else {
      routes.set(link.from, [...(routes.get(link.from) ?? []), to])
    }
  }

  // Kahn's order over routing links. A Node caught in a cycle never runs.
  const indegree = new Map(game.nodes.map((node) => [node.id, 0]))
  for (const [, children] of routes) {
    for (const child of children) indegree.set(child.id, (indegree.get(child.id) ?? 0) + 1)
  }
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

  const capacity = new Map(game.nodes.map((node) => [node.id, capacityOf(game, node)]))
  const inbound = new Map<string, Partial<Record<Kind, number>>>(
    game.nodes.map((node) => [node.id, emptyKinds()]),
  )
  const processedShare = new Map<string, number>()
  const flows: Record<string, Mutable<NodeFlow>> = {}
  const linkRates = new Map<string, Partial<Record<Kind, number>>>()
  const demand = demandOf(game)

  /** Children that take this kind, each with its share of it. */
  const splitFor = (node: GameNode, kind: Kind): ReadonlyArray<[GameNode, number]> => {
    const takers = (routes.get(node.id) ?? []).filter((child) => acceptsOf(child).includes(kind))
    const weights = takers.map((child) => Math.max(capacity.get(child.id) ?? 0, 0.001))
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    return takers.map((child, index) => [child, (weights[index] ?? 0) / total])
  }

  for (const node of order) {
    const arriving = inbound.get(node.id) ?? emptyKinds()
    if (node.type === 'users') Object.assign(arriving, demand)
    const kinds = Object.keys(arriving) as Array<Kind>
    const load = kinds.reduce(
      (sum, kind) => sum + (arriving[kind] ?? 0) * loadOf(game, node, kind),
      0,
    )
    const total = kinds.reduce((sum, kind) => sum + (arriving[kind] ?? 0), 0)
    const cap = capacity.get(node.id) ?? 0
    const share = load <= 0 ? 1 : cap === Number.POSITIVE_INFINITY ? 1 : Math.min(1, cap / load)
    const utilization =
      cap === Number.POSITIVE_INFINITY || cap <= 0 ? (load > 0 && cap <= 0 ? 2 : 0) : load / cap
    processedShare.set(node.id, share)

    let answered = 0
    let stranded = 0
    const strandedKinds: Array<Kind> = []
    for (const kind of kinds) {
      const processed = (arriving[kind] ?? 0) * share
      const serve = serveShare(game, node, kind)
      answered += processed * serve
      const passing = processed * (1 - serve)
      if (passing <= 0) continue
      const next = outKind(node, kind)
      const split = splitFor(node, next)
      if (split.length === 0) {
        stranded += passing
        strandedKinds.push(next)
        continue
      }
      for (const [child, weight] of split) {
        const into = inbound.get(child.id) ?? emptyKinds()
        into[next] = (into[next] ?? 0) + passing * weight
        const key = `${node.id}>${child.id}`
        const rates = linkRates.get(key) ?? emptyKinds()
        rates[next] = (rates[next] ?? 0) + passing * weight
        linkRates.set(key, rates)
      }
    }

    const down = node.down > 0
    flows[node.id] = {
      inbound: total,
      capacity: cap,
      utilization,
      latency: loadedLatency(baseLatency(game, node), utilization),
      answered,
      dropped: total * (1 - share),
      stranded,
      strandedKinds,
      status: down
        ? 'down'
        : total <= 0
          ? 'idle'
          : utilization > 0.95
            ? 'danger'
            : utilization > 0.8 || stranded > 0
              ? 'warn'
              : 'ok',
    }
  }

  // Success, value and latency per (Node, kind), walking the routes backwards.
  type Outcome = Readonly<{ success: number; value: number; latency: number }>
  const memo = new Map<string, Outcome>()
  const outcome = (node: GameNode, kind: Kind): Outcome => {
    const key = `${node.id}:${kind}`
    const cached = memo.get(key)
    if (cached) return cached
    const share = processedShare.get(node.id) ?? 0
    const serve = serveShare(game, node, kind)
    const next = outKind(node, kind)
    let success = 0
    let value = 0
    let latency = 0
    for (const [child, weight] of serve < 1 ? splitFor(node, next) : []) {
      const downstream = outcome(child, next)
      success += downstream.success * weight
      value += downstream.value * weight
      latency += downstream.latency * weight
    }
    const multiplier = valueMultiplier(node, kind)
    const own = flows[node.id]?.latency ?? 0
    const result: Outcome = {
      success: share * (serve + (1 - serve) * success),
      value: share * multiplier * (serve + (1 - serve) * value),
      latency: own + (COMPONENTS[node.type].async ? 0 : (1 - serve) * latency),
    }
    memo.set(key, result)
    return result
  }

  const users = game.nodes.find((node) => node.type === 'users')
  let humans = 0
  let served = 0
  let worth = 0
  let latencyWeight = 0
  const failing: Array<RequestKind> = []
  for (const kind of REQUEST_KINDS) {
    const rate = demand[kind] ?? 0
    if (rate <= 0 || !users) continue
    const result = outcome(users, kind)
    if (kind === 'bot') continue
    humans += rate
    served += rate * result.success
    worth += rate * result.value * KINDS[kind].value
    latencyWeight += rate * result.success * result.latency
    if (result.success < 0.05) failing.push(kind)
  }
  const latency = served > 0 ? latencyWeight / served : 0
  const patience = patienceFor(latency)

  let insight = 0
  for (const [tapId, parents] of taps) {
    const tap = byId.get(tapId)
    if (!tap) continue
    const volume = parents.reduce((sum, parent) => {
      const flow = flows[parent]
      return sum + (flow ? flow.inbound - flow.dropped : 0)
    }, 0)
    const cap = capacity.get(tapId) ?? 0
    const sampled = Math.min(volume, cap)
    insight += sampled * 0.03
    flows[tapId] = {
      inbound: volume,
      capacity: cap,
      utilization: cap > 0 ? volume / cap : 0,
      latency: 0,
      answered: sampled,
      dropped: 0,
      stranded: 0,
      strandedKinds: [],
      status: tap.down > 0 ? 'down' : volume <= 0 ? 'idle' : volume > cap ? 'warn' : 'ok',
    }
  }

  const links: Array<LinkFlow> = game.links.map((link) => {
    if (isTap(link.to)) {
      const flow = flows[link.from]
      return { ...link, rate: flow ? (flow.inbound - flow.dropped) * 0.15 : 0, kind: 'page' }
    }
    const rates = linkRates.get(`${link.from}>${link.to}`) ?? emptyKinds()
    const entries = Object.entries(rates) as Array<[Kind, number]>
    const rate = entries.reduce((sum, [, value]) => sum + value, 0)
    const top = entries.reduce<[Kind, number]>(
      (best, entry) => (entry[1] > best[1] ? entry : best),
      ['page', -1],
    )
    return { ...link, rate, kind: top[0] }
  })

  for (const node of game.nodes) {
    flows[node.id] ??= {
      inbound: 0,
      capacity: capacity.get(node.id) ?? 0,
      utilization: 0,
      latency: 0,
      answered: 0,
      dropped: 0,
      stranded: 0,
      strandedKinds: [],
      status: node.down > 0 ? 'down' : 'idle',
    }
  }

  return {
    nodes: flows,
    links,
    demand: humans,
    served,
    quality: humans > 0 ? served / humans : 1,
    latency,
    patience,
    revenue: worth * patience,
    insight,
    burn: game.nodes.reduce((sum, node) => sum + burnOf(node), 0),
    failing,
  }
}

/* ---------- time ---------- */

/** A small deterministic generator, so a saved Game replays the same incidents. */
const nextRandom = (seed: number): [number, number] => {
  const next = (seed * 1_103_515_245 + 12_345) % 2_147_483_648
  return [next / 2_147_483_648, next]
}

export const drawerSize = (game: Game): number => {
  const payments = game.nodes.find((node) => node.type === 'payments')
  return 120 * 3 ** ((payments?.level ?? 1) - 1)
}

export type StepEvent =
  | Readonly<{ kind: 'incident'; incident: Incident }>
  | Readonly<{ kind: 'recovered'; incident: Incident }>
  | Readonly<{ kind: 'drawer-full' }>

export type StepResult = Readonly<{ game: Game; flow: Flow; events: ReadonlyArray<StepEvent> }>

const INCIDENT_SECONDS: Record<Incident['kind'], number> = { spike: 25, ddos: 25, outage: 18 }

export const step = (game: Game, seconds: number): StepResult => {
  const flow = solve(game)
  const events: Array<StepEvent> = []
  const stage = stageOf(game)

  const earned = flow.revenue * seconds
  let cash = game.cash
  let pending = game.pending
  if (has(game, 'stripe')) {
    cash += earned
  } else {
    const room = Math.max(0, drawerSize(game) - pending)
    if (room > 0 && earned >= room) events.push({ kind: 'drawer-full' })
    pending += Math.min(room, earned)
  }
  cash = Math.max(0, cash - flow.burn * seconds)

  const satisfied = flow.quality * flow.patience
  const growth =
    satisfied >= 0.9
      ? 0.012 * game.users * Math.max(0, 1 - game.users / stage.market) * ((satisfied - 0.9) / 0.1)
      : -0.05 * game.users * ((0.9 - satisfied) / 0.9)
  const users = Math.max(20, game.users + growth * seconds)

  let incident = game.incident
  let nodes = game.nodes
  let seed = game.seed
  let nextIncidentAt = game.nextIncidentAt
  const time = game.time + seconds

  if (incident) {
    const remaining = incident.remaining - seconds
    if (remaining <= 0) {
      events.push({ kind: 'recovered', incident })
      incident = null
    } else {
      incident = { ...incident, remaining }
    }
  } else if (game.stage >= 1 && time >= nextIncidentAt) {
    const [roll, afterRoll] = nextRandom(seed)
    const [gap, afterGap] = nextRandom(afterRoll)
    const [pick, afterPick] = nextRandom(afterGap)
    seed = afterPick
    nextIncidentAt = time + 75 + gap * 60
    const pool: Array<Incident['kind']> =
      game.stage >= 2 ? ['spike', 'ddos', 'outage'] : ['spike', 'outage']
    const kind = pool[Math.floor(roll * pool.length)] ?? 'spike'
    const candidates = game.nodes.filter((node) => !COMPONENTS[node.type].fixed)
    const target = kind === 'outage' ? candidates[Math.floor(pick * candidates.length)] : undefined
    if (kind !== 'outage' || target) {
      incident = { kind, remaining: INCIDENT_SECONDS[kind], nodeId: target?.id ?? null }
      events.push({ kind: 'incident', incident })
      if (target) {
        nodes = nodes.map((node) =>
          node.id === target.id ? { ...node, down: INCIDENT_SECONDS.outage } : node,
        )
      }
    }
  }
  nodes = nodes.map((node) =>
    node.down > 0 ? { ...node, down: Math.max(0, node.down - seconds) } : node,
  )

  const crossedSecond = Math.floor(time) > Math.floor(game.time)
  const sample: Sample = {
    users: game.users,
    demand: flow.demand,
    served: flow.served,
    revenue: flow.revenue,
    latency: flow.latency,
  }
  const history = crossedSecond ? [...game.history, sample].slice(-120) : game.history

  return {
    game: {
      ...game,
      nodes,
      cash,
      pending,
      users,
      insight: game.insight + flow.insight * seconds,
      time,
      seed,
      incident,
      nextIncidentAt,
      earned: game.earned + earned,
      history,
    },
    flow,
    events,
  }
}

/* ---------- the player's actions ---------- */

export type Outcome = Readonly<{ ok: true; game: Game }> | Readonly<{ ok: false; reason: string }>

const done = (game: Game): Outcome => ({ ok: true, game })
const refuse = (reason: string): Outcome => ({ ok: false, reason })

export const priceOf = (game: Game, type: ComponentId): number => {
  const count = game.nodes.filter((node) => node.type === type).length
  return Math.round(COMPONENTS[type].cost * 1.25 ** count)
}

export const upgradePrice = (node: GameNode): number => {
  const base =
    node.type === 'payments' ? 60 : node.type === 'users' ? 0 : COMPONENTS[node.type].cost
  return Math.round(base * LEVEL_COST ** node.level)
}

export const canUpgrade = (node: GameNode): boolean =>
  node.type !== 'users' && node.level < MAX_LEVEL

export const place = (game: Game, type: ComponentId, x: number, y: number): Outcome => {
  const def = COMPONENTS[type]
  if (def.fixed) return refuse(`${def.name} cannot be placed.`)
  if (!isUnlocked(game, type))
    return refuse(`Research ${RESEARCH[def.unlock as ResearchId].name} first.`)
  const price = priceOf(game, type)
  if (game.cash < price) return refuse(`${def.name} costs $${price}.`)
  const node: GameNode = {
    id: `n${game.nextId}`,
    type,
    x: Math.round(x),
    y: Math.round(y),
    level: 1,
    language: 'php',
    framework: 'none',
    down: 0,
  }
  return done({
    ...game,
    cash: game.cash - price,
    nextId: game.nextId + 1,
    nodes: [...game.nodes, node],
  })
}

export const sell = (game: Game, id: string): Outcome => {
  const node = game.nodes.find((entry) => entry.id === id)
  if (!node) return refuse('That Node is gone.')
  if (COMPONENTS[node.type].fixed) return refuse(`${COMPONENTS[node.type].name} stays.`)
  return done({
    ...game,
    cash: game.cash + Math.round(COMPONENTS[node.type].cost * 0.5),
    nodes: game.nodes.filter((entry) => entry.id !== id),
    links: game.links.filter((link) => link.from !== id && link.to !== id),
  })
}

export const move = (game: Game, id: string, x: number, y: number): Game => ({
  ...game,
  nodes: game.nodes.map((node) =>
    node.id === id ? { ...node, x: Math.round(x), y: Math.round(y) } : node,
  ),
})

const reaches = (links: ReadonlyArray<GameLink>, from: string, to: string): boolean => {
  const seen = new Set<string>()
  const stack = [from]
  while (stack.length > 0) {
    const at = stack.pop() as string
    if (at === to) return true
    if (seen.has(at)) continue
    seen.add(at)
    for (const link of links) if (link.from === at) stack.push(link.to)
  }
  return false
}

export const connect = (game: Game, from: string, to: string): Outcome => {
  const source = game.nodes.find((node) => node.id === from)
  const target = game.nodes.find((node) => node.id === to)
  if (!source || !target || from === to) return refuse('Link two different Nodes.')
  const sourceDef = COMPONENTS[source.type]
  const targetDef = COMPONENTS[target.type]
  if (sourceDef.maxOut === 0) return refuse(`${sourceDef.name} has no output.`)
  if (target.type === 'users' || target.type === 'payments')
    return refuse(`${targetDef.name} has no input.`)
  if (game.links.some((link) => link.from === from && link.to === to))
    return refuse('Already linked.')
  if (!targetDef.tap) {
    const out = game.links.filter(
      (link) =>
        link.from === from &&
        !COMPONENTS[game.nodes.find((node) => node.id === link.to)?.type ?? 'server'].tap,
    )
    if (out.length >= sourceDef.maxOut) {
      return refuse(
        source.type === 'users'
          ? 'DNS points at one host. Put a Load Balancer in front to reach more.'
          : `${sourceDef.name} takes ${sourceDef.maxOut} link.`,
      )
    }
    if (reaches(game.links, to, from)) return refuse('That link would make a loop.')
  }
  return done({ ...game, links: [...game.links, { from, to }] })
}

export const disconnect = (game: Game, from: string, to: string): Game => ({
  ...game,
  links: game.links.filter((link) => !(link.from === from && link.to === to)),
})

export const upgrade = (game: Game, id: string): Outcome => {
  const node = game.nodes.find((entry) => entry.id === id)
  if (!node || !canUpgrade(node)) return refuse('That Node is at its last level.')
  const price = upgradePrice(node)
  if (game.cash < price) return refuse(`Level ${node.level + 1} costs $${price}.`)
  return done({
    ...game,
    cash: game.cash - price,
    nodes: game.nodes.map((entry) =>
      entry.id === id ? { ...entry, level: entry.level + 1 } : entry,
    ),
  })
}

export const languageReady = (game: Game, language: LanguageId): boolean => {
  const needed = LANGUAGE_RESEARCH[language]
  return needed === null || has(game, needed)
}

export const frameworkReady = (game: Game, framework: FrameworkId): boolean => {
  const needed = FRAMEWORK_RESEARCH[framework]
  return needed === null || has(game, needed)
}

export const setLanguage = (game: Game, id: string, language: LanguageId): Outcome => {
  if (!languageReady(game, language)) return refuse(`Research ${LANGUAGES[language].name} first.`)
  return done({
    ...game,
    nodes: game.nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            language,
            framework: FRAMEWORKS[node.framework].language === language ? node.framework : 'none',
          }
        : node,
    ),
  })
}

export const setFramework = (game: Game, id: string, framework: FrameworkId): Outcome => {
  if (!frameworkReady(game, framework))
    return refuse(`Research ${FRAMEWORKS[framework].name} first.`)
  const node = game.nodes.find((entry) => entry.id === id)
  const needs = FRAMEWORKS[framework].language
  if (!node || (needs !== null && needs !== node.language)) {
    return refuse(
      `${FRAMEWORKS[framework].name} needs ${needs ? LANGUAGES[needs].name : 'a server'}.`,
    )
  }
  return done({
    ...game,
    nodes: game.nodes.map((entry) => (entry.id === id ? { ...entry, framework } : entry)),
  })
}

export const researchReady = (game: Game, id: ResearchId): boolean =>
  RESEARCH[id].requires.every((needed) => has(game, needed))

export const study = (game: Game, id: ResearchId): Outcome => {
  const entry = RESEARCH[id]
  if (has(game, id)) return refuse(`${entry.name} is already yours.`)
  if (!researchReady(game, id)) {
    const missing = entry.requires
      .filter((needed) => !has(game, needed))
      .map((needed) => RESEARCH[needed].name)
    return refuse(`Needs ${missing.join(' and ')}.`)
  }
  if (game.insight < entry.cost) return refuse(`${entry.name} needs ${entry.cost} Insight.`)
  return done({ ...game, insight: game.insight - entry.cost, researched: [...game.researched, id] })
}

export const collect = (game: Game): Game => ({
  ...game,
  cash: game.cash + game.pending,
  pending: 0,
})

export const canRaise = (game: Game): boolean =>
  game.stage < STAGES.length - 1 && game.users >= stageOf(game).raiseAt

export const raise = (game: Game): Outcome => {
  if (!canRaise(game))
    return refuse(`Reach ${stageOf(game).raiseAt.toLocaleString('en-US')} users first.`)
  const stage = stageOf(game)
  return done({
    ...game,
    stage: game.stage + 1,
    cash: game.cash + stage.grant,
    nextIncidentAt: game.time + 40,
  })
}

export const isPublic = (game: Game): boolean => game.stage >= STAGES.length - 1

/* ---------- a new company ---------- */

const starter = (id: string, type: ComponentId, x: number, y: number): GameNode => ({
  id,
  type,
  x,
  y,
  level: 1,
  language: 'php',
  framework: 'none',
  down: 0,
})

export const newGame = (seed = 20_261_031): Game => ({
  nodes: [
    starter('users', 'users', 120, 300),
    starter('server', 'server', 440, 300),
    starter('database', 'database', 760, 300),
    starter('payments', 'payments', 440, 560),
  ],
  links: [
    { from: 'users', to: 'server' },
    { from: 'server', to: 'database' },
  ],
  nextId: 1,
  cash: 120,
  insight: 0,
  users: 150,
  pending: 0,
  researched: [],
  stage: 0,
  time: 0,
  seed,
  incident: null,
  nextIncidentAt: 90,
  earned: 0,
  history: [],
})

/* ---------- the next thing to do ---------- */

export const nextGoal = (game: Game, flow: Flow): string => {
  const placed = (type: ComponentId) => game.nodes.some((node) => node.type === type)
  const tapped = game.links.some(
    (link) => game.nodes.find((node) => node.id === link.to)?.type === 'analytics',
  )
  if (!has(game, 'stripe') && game.pending >= drawerSize(game) * 0.98)
    return 'The Payments drawer is full. Click it to collect.'
  if (!has(game, 'stripe') && game.pending > 2 && game.cash < 40)
    return 'Click Payments to collect your first revenue.'
  if (!placed('analytics')) return 'Place Analytics, then link a Node into it to earn Insight.'
  if (!tapped) return 'Drag from a Node’s output into Analytics to start sampling.'
  if (flow.failing.length > 0) {
    const kind = flow.failing[0] as RequestKind
    return `${KINDS[kind].label} requests have nowhere to go. ${hintFor(kind)}`
  }
  const hot = game.nodes.find(
    (node) => (flow.nodes[node.id]?.utilization ?? 0) > 1 && node.type !== 'analytics',
  )
  if (hot) return `${COMPONENTS[hot.type].name} is past capacity. Upgrade it or add another.`
  if (flow.patience < 0.95) return 'Pages are slow and users are leaving. Find the busiest Node.'
  if (canRaise(game))
    return `Investors are calling. Raise your ${STAGES[game.stage + 1]?.name ?? ''} round.`
  if (game.researched.length < 2) return 'Open Research and spend Insight on your first unlock.'
  return `Grow to ${stageOf(game).raiseAt.toLocaleString('en-US')} users to raise the next round.`
}

const hintFor = (kind: RequestKind): string => {
  switch (kind) {
    case 'search':
      return 'Link a server to a Search Index.'
    case 'media':
      return 'Put a CDN in front, and link a server to Object Storage.'
    case 'job':
      return 'Link a server to a Queue, and the Queue to a Worker.'
    case 'ai':
      return 'Run a Python server, and link it to a GPU Node.'
    case 'write':
      return 'Writes need a Database: a replica cannot take them.'
    default:
      return 'Check the links.'
  }
}
