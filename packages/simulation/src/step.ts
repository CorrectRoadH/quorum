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
  RUNTIMES,
  WARMUP_SECONDS,
  type Tuning,
} from './catalog.ts'
import { advanceIncident, directIncidents } from './director.ts'
import { StepEvent, type AlertRule } from './events.ts'
import type { Ledger } from './ledger.ts'
import { drawerSize, eraOf, has, restarted, vcpuOf, warmAfterRestart } from './lookups.ts'
import { calendarMinute, solveFlow } from './solve.ts'
import type { Alarms, FalseAlarms, Game, GameNode, Sample } from './state.ts'

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
 */
export const growthOf = (game: Game, ledger: Ledger, pace = LIVE_TUNING.pace): number => {
  const era = eraOf(game)
  const target = era.apdexTarget
  const health = Math.max(-1, Math.min(1, (game.apdex - target) / (1 - target)))
  if (health < 0) return CHURN * game.users * health
  const rate =
    era.growth *
    pace *
    (game.declined ? DECLINED_GROWTH : 1) *
    (has(game, 'funnels') ? FUNNEL_GROWTH : 1)
  return rate * game.users * Math.max(0, 1 - game.users / ledger.market) * health
}

const advanceNode = (
  node: GameNode,
  time: number,
  ledger: Ledger,
  seconds: number,
  events: Array<StepEvent>,
): GameNode => {
  let next = node
  if (node.down > 0) {
    const down = Math.max(0, node.down - seconds)
    next = {
      ...next,
      down,
      warm: down === 0 ? warmAfterRestart(node) : node.warm,
      downCause: down === 0 ? 'restart' : node.downCause,
    }
  } else if (node.down === 0 && node.warm < 1) {
    next = { ...next, warm: Math.min(1, node.warm + seconds / WARMUP_SECONDS) }
  }
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
    node.type === 'server' &&
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

  const nodes = game.nodes.map((node) => advanceNode(node, game.time, ledger, seconds, events))
  const users = game.sandbox
    ? game.users
    : Math.max(20, game.users + growthOf(game, ledger, tuning.pace) * seconds)
  const apdex = game.apdex + (ledger.apdex - game.apdex) * Math.min(1, seconds / APDEX_WINDOW)
  // Sim time stays on a microsecond grid, so ten 0.1 s Steps make exactly one second.
  const time = Math.round((game.time + seconds) * 1e6) / 1e6
  const { alarms, falseAlarms } = advanceAlarms(game, ledger, seconds, events)

  // The first time users get a new kind of request through, the team learns from it, once.
  const firsts = REQUEST_KINDS.filter(
    (kind) => !game.servedKinds.includes(kind) && (ledger.kinds[kind]?.success ?? 0) > 0.5,
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
    time,
    earned: game.earned + earned,
    history: crossedSecond ? [...game.history, sample].slice(-HISTORY) : game.history,
  }

  const running = advanceIncident(next, ledger, seconds)
  next = running.game
  events.push(...running.events)
  const directed = directIncidents(next, ledger, tuning.incidentGap)
  next = directed.game
  events.push(...directed.events)

  return { game: next, ledger, events }
}
