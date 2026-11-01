import {
  ALERT_FATIGUE,
  ALERT_RULES,
  APDEX_WINDOW,
  CHURN,
  CREDIT_CAP,
  DECLINED_GROWTH,
  FIRST_KIND_INSIGHT,
  FUNNEL_GROWTH,
  LIVE_TUNING,
  OOM_RATIO,
  PROFILES,
  REQUEST_KINDS,
  POD_REACTION,
  RUNTIMES,
  SCALE_COOLDOWN,
  SCALE_IN,
  UPLOAD_MB,
  VM_REACTION,
  WARMUP_SECONDS,
  type Tuning,
} from './catalog.ts'
import { advanceIncident, directIncidents } from './director.ts'
import { StepEvent, type AlertRule } from './events.ts'
import { churnFactor, growthFactor } from './features.ts'
import type { Ledger } from './ledger.ts'
import {
  drawerSize,
  eraOf,
  has,
  inCluster,
  isDown,
  restarted,
  vcpuOf,
  warmAfterRestart,
} from './lookups.ts'
import { recordBudget } from './slo.ts'
import { calendarMinute, solveFlow } from './solve.ts'
import type { Alarms, FalseAlarms, Game, GameNode, Sample } from './state.ts'
import { advanceTeam } from './work.ts'

/* ==========================================================================
   Time. `step` advances a Game by some seconds: money moves, credits drain,
   cold Nodes warm up, users grow or leave, incidents run, and the pager
   counts how long each alert condition has held.
   ========================================================================== */

export type StepResult = Readonly<{
  game: Game
  ledger: Ledger
  events: ReadonlyArray<StepEvent>
}>

const HISTORY = 600

/**
 * Users grow along an S-curve while Apdex beats the Era's target, and leave fast
 * when it does not. `pace` multiplies `g`: the live game plays faster than the design.
 * Shipped Features raise growth and the market, and lower churn.
 */
export const growthOf = (game: Game, ledger: Ledger, pace = LIVE_TUNING.pace): number => {
  const era = eraOf(game)
  const target = era.apdexTarget
  const health = Math.max(-1, Math.min(1, (game.apdex - target) / (1 - target)))
  if (health < 0) return CHURN * churnFactor(game) * game.users * health
  const rate =
    era.growth *
    pace *
    growthFactor(game) *
    (game.declined ? DECLINED_GROWTH : 1) *
    (has(game, 'funnels') ? FUNNEL_GROWTH : 1)
  return rate * game.users * Math.max(0, 1 - game.users / ledger.market) * health
}

/**
 * During a Cache stampede, refills time out while a database behind the Cache
 * is overloaded, so the Cache stays cold (11 "Cache stampede").
 */
/** Database load at which a cold Cache's refill queries start to time out. */
const REFILL_STALL = 0.9

const refillsStall = (game: Game, ledger: Ledger, node: GameNode): boolean =>
  node.type === 'cache' &&
  game.incident?.kind === 'stampede' &&
  game.links.some((link) => {
    if (link.from !== node.id) return false
    const target = game.nodes.find((entry) => entry.id === link.to)
    return (
      (target?.type === 'database' || target?.type === 'pooler') &&
      (ledger.nodes[link.to]?.utilization ?? 0) >= REFILL_STALL
    )
  })

/**
 * A Queue's backlog: tasks it accepted minus tasks its Workers took. With no
 * Worker linked, nothing drains.
 */
const depthAfter = (game: Game, ledger: Ledger, queue: GameNode, seconds: number): number => {
  const own = ledger.nodes[queue.id]
  if (!own) return queue.depth
  const accepted = Math.max(0, own.inbound - own.dropped)
  let drained = 0
  for (const link of ledger.links) {
    if (link.from !== queue.id) continue
    const worker = ledger.nodes[link.to]
    if (!worker || worker.inbound <= 0) continue
    drained += link.rate * ((worker.inbound - worker.dropped) / worker.inbound)
  }
  return Math.max(0, queue.depth + (accepted - drained) * seconds)
}

/** Seconds a cold Node takes to warm: its runtime's JIT for App Servers and Workers. */
const warmupOf = (node: GameNode): number =>
  node.type === 'server' || node.type === 'worker' ? RUNTIMES[node.runtime].warmup : WARMUP_SECONDS

/** The live Autoscaler a Node links into, if any. */
const autoscalerOf = (game: Game, node: GameNode): GameNode | undefined => {
  if (node.type !== 'server' && node.type !== 'worker') return undefined
  for (const link of game.links) {
    if (link.from !== node.id) continue
    const target = game.nodes.find((entry) => entry.id === link.to)
    if (target?.type === 'autoscaler' && !isDown(target)) return target
  }
  return undefined
}

/**
 * Copies boot, then join cold. An Autoscaler asks for more when the Node runs
 * above its target, and gives one back when it idles, at most once per cooldown.
 */
const scale = (game: Game, node: GameNode, ledger: Ledger, seconds: number): GameNode => {
  if (node.pending > 0) {
    const readyIn = node.readyIn - seconds
    if (readyIn > 0) return { ...node, readyIn }
    const replicas = node.replicas + node.pending
    // The new copies start cold: a JIT runtime runs them slowly for its warmup.
    return {
      ...node,
      replicas,
      pending: 0,
      readyIn: 0,
      warm: (node.warm * node.replicas) / replicas,
    }
  }
  const scaler = autoscalerOf(game, node)
  if (!scaler || isDown(node) || game.time - node.scaledAt < SCALE_COOLDOWN) return node
  const own = ledger.nodes[node.id]
  if (!own) return node
  const cpu = own.resources.cpu
  const load =
    scaler.signal === 'cpu' ? (cpu && cpu.total > 0 ? cpu.used / cpu.total : 0) : own.utilization
  const most = scaler.maxCopies > 0 ? scaler.maxCopies : Number.POSITIVE_INFINITY
  const wanted = Math.min(
    most,
    Math.max(scaler.minCopies, Math.ceil((node.replicas * load) / scaler.target)),
  )
  if (wanted > node.replicas)
    return {
      ...node,
      pending: wanted - node.replicas,
      readyIn: inCluster(game, node) ? POD_REACTION : VM_REACTION,
      scaledAt: game.time,
    }
  // Give one back only when the rest would still run under the target, so it does not flap.
  if (
    node.replicas > scaler.minCopies &&
    load < scaler.target * SCALE_IN &&
    (load * node.replicas) / (node.replicas - 1) < scaler.target
  )
    return { ...node, replicas: node.replicas - 1, scaledAt: game.time }
  return node
}

const advanceNode = (
  game: Game,
  node: GameNode,
  ledger: Ledger,
  seconds: number,
  events: Array<StepEvent>,
): GameNode => {
  const time = game.time
  let next = node
  if (node.down > 0) {
    const down = Math.max(0, node.down - seconds)
    next = {
      ...next,
      down,
      warm:
        down === 0 ? warmAfterRestart(node, node.warming && has(game, 'cache-warming')) : node.warm,
      downCause: down === 0 ? 'restart' : node.downCause,
    }
  } else if (node.down === 0 && node.warm < 1 && !refillsStall(game, ledger, node)) {
    next = { ...next, warm: Math.min(1, node.warm + seconds / warmupOf(node)) }
  }
  if (node.type === 'server' || node.type === 'worker') next = scale(game, next, ledger, seconds)
  if (node.type === 'queue') next = { ...next, depth: depthAfter(game, ledger, node, seconds) }
  const credits = ledger.nodes[node.id]?.resources.credits
  if (node.family === 'burstable' && credits) {
    const balance = Math.max(
      0,
      Math.min(CREDIT_CAP * vcpuOf(node), node.credits + credits.rate * seconds),
    )
    if (node.credits >= 1 && balance < 1)
      events.push(StepEvent.CreditsExhausted({ nodeId: node.id }))
    next = { ...next, credits: balance }
  }
  // A pool the player sized too big for its RAM swaps, then the kernel kills it, and so does a
  // leak. Runtimes that size themselves (mod_php, Puma, Node.js) only swap: the player has no
  // pool size to fix, only the box.
  const ram = ledger.nodes[node.id]?.resources.ram
  const killable = RUNTIMES[node.runtime].pool || node.leak > 0
  if (
    (node.type === 'server' || node.type === 'worker') &&
    node.down === 0 &&
    killable &&
    ram &&
    ram.used > ram.total * OOM_RATIO
  ) {
    events.push(StepEvent.OutOfMemory({ nodeId: node.id }))
    next = { ...next, ...restarted(node, 'oom'), leak: 0, downAt: time }
  }
  return next
}

/** Whether the player has stopped listening to a rule: too many false alarms today. */
export const ignored = (game: Game, rule: AlertRule): boolean =>
  game.falseAlarms[rule] >= ALERT_FATIGUE

const advanceAlarms = (
  game: Game,
  ledger: Ledger,
  seconds: number,
  events: Array<StepEvent>,
): Readonly<{ alarms: Alarms; falseAlarms: FalseAlarms }> => {
  const rules = game.alertRules
  const slowest = Object.entries(ledger.kinds).some(
    ([kind, entry]) => entry.p99 > rules.latency * PROFILES[kind as keyof typeof PROFILES].apdex,
  )
  const hottest = Math.max(
    0,
    ...game.nodes
      .filter((node) => node.type !== 'users' && node.type !== 'analytics')
      .map((node) => ledger.nodes[node.id]?.utilization ?? 0),
  )
  const next: Alarms = {
    errors: ledger.errorShare > rules.errors ? game.alarms.errors + seconds : 0,
    latency: slowest ? game.alarms.latency + seconds : 0,
    saturation: hottest > rules.saturation ? game.alarms.saturation + seconds : 0,
  }
  // A new calendar day forgives false alarms, except on rules the player already ignores.
  const day = Math.floor(calendarMinute(game.time) / 1440)
  const fresh = day !== game.falseAlarms.day
  const counts: Record<AlertRule, number> = {
    errors: game.falseAlarms.errors,
    latency: game.falseAlarms.latency,
    saturation: game.falseAlarms.saturation,
  }
  for (const rule of ['errors', 'latency', 'saturation'] as const) {
    if (fresh && counts[rule] < ALERT_FATIGUE) counts[rule] = 0
    if (!has(game, 'alerting')) continue
    const limit = ALERT_RULES[rule].seconds
    if (game.alarms[rule] >= limit || next[rule] < limit) continue
    if (ignored(game, rule)) continue
    events.push(StepEvent.AlertFired({ rule }))
    // An alert with no incident behind it is a false alarm.
    if (!game.incident) {
      counts[rule] += 1
      if (counts[rule] === ALERT_FATIGUE) events.push(StepEvent.AlertIgnored({ rule }))
    }
  }
  return { alarms: next, falseAlarms: { day, ...counts } }
}

export const step = (game: Game, seconds: number, tuning: Tuning = LIVE_TUNING): StepResult => {
  const ledger = solveFlow(game)
  const events: Array<StepEvent> = []

  // Money: revenue waits in the drawer until Stripe Billing collects it.
  const earned = ledger.revenue * seconds
  let cash = game.cash
  let pending = game.pending
  let spilled = game.spilled
  if (game.sandbox) {
    // A Sandbox has no money: placing is free, and revenue and Burn are only figures.
  } else if (has(game, 'stripe')) {
    cash += earned
  } else {
    const room = Math.max(0, drawerSize(game, ledger.revenue) - pending)
    if (room > 0 && earned >= room) events.push(StepEvent.DrawerFull())
    pending += Math.min(room, earned)
    spilled += Math.max(0, earned - room)
  }
  if (!game.sandbox) cash -= ledger.burn * seconds

  const nodes = game.nodes.map((node) => advanceNode(game, node, ledger, seconds, events))
  // Object Storage keeps every file it is sent: data never shrinks by itself (07 "Data volume").
  const puts = game.nodes.reduce(
    (total, node) =>
      node.type === 'storage' ? total + (ledger.nodes[node.id]?.inbound ?? 0) : total,
    0,
  )
  const users = game.sandbox
    ? game.users
    : Math.max(20, game.users + growthOf(game, ledger, tuning.pace) * seconds)
  const apdex = game.apdex + (ledger.apdex - game.apdex) * Math.min(1, seconds / APDEX_WINDOW)
  // Sim time stays on a microsecond grid, so ten 0.1 s Steps make exactly one second.
  const time = Math.round((game.time + seconds) * 1e6) / 1e6
  const { alarms, falseAlarms } = advanceAlarms(game, ledger, seconds, events)

  // The first time users get a new kind of request through, the team learns from it, once.
  const firsts = REQUEST_KINDS.filter(
    (kind) =>
      PROFILES[kind].scored &&
      !game.servedKinds.includes(kind) &&
      (ledger.kinds[kind]?.success ?? 0) > 0.5,
  )

  const crossedSecond = Math.floor(time) > Math.floor(game.time)
  const sample: Sample = {
    users: game.users,
    demand: ledger.demand,
    served: ledger.served,
    revenue: ledger.revenue,
    burn: ledger.burn,
    latency: ledger.latency,
    p99: ledger.p99,
    apdex: ledger.apdex,
    errors: ledger.errorShare,
  }

  let next: Game = {
    ...game,
    nodes,
    cash,
    pending,
    spilled,
    users,
    apdex,
    alarms,
    falseAlarms,
    insight: game.insight + ledger.insight * seconds + FIRST_KIND_INSIGHT * firsts.length,
    servedKinds: firsts.length > 0 ? [...game.servedKinds, ...firsts] : game.servedKinds,
    stored: puts > 0 ? game.stored + (puts * UPLOAD_MB * seconds) / 1_000 : game.stored,
    budget: recordBudget(game, ledger, seconds),
    time,
    earned: game.earned + earned,
    history: crossedSecond ? [...game.history, sample].slice(-HISTORY) : game.history,
  }

  const running = advanceIncident(next, ledger, seconds)
  next = running.game
  events.push(...running.events)
  const team = advanceTeam(next, ledger, seconds, tuning)
  next = team.game
  events.push(...team.events)
  const directed = directIncidents(next, ledger, tuning.incidentGap)
  next = directed.game
  events.push(...directed.events)

  return { game: next, ledger, events }
}
