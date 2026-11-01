import {
  ALERT_RULES,
  APDEX_WINDOW,
  CHURN,
  CREDIT_CAP,
  DECLINED_GROWTH,
  FUNNEL_GROWTH,
  PLAYTEST_PACE,
  PROFILES,
  RESTART_SECONDS,
  WARMUP_SECONDS,
} from './catalog.ts'
import { advanceIncident, directIncidents } from './director.ts'
import { StepEvent, type AlertRule } from './events.ts'
import type { Ledger } from './ledger.ts'
import { drawerSize, eraOf, has, vcpuOf } from './lookups.ts'
import { solveFlow } from './solve.ts'
import type { Alarms, Game, GameNode, Sample } from './state.ts'

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

/** Users grow along an S-curve while Apdex beats the Era's target, and leave fast when it does not. */
export const growthOf = (game: Game, ledger: Ledger): number => {
  const era = eraOf(game)
  const target = era.apdexTarget
  const health = Math.max(-1, Math.min(1, (game.apdex - target) / (1 - target)))
  if (health < 0) return CHURN * game.users * health
  const rate =
    era.growth *
    PLAYTEST_PACE *
    (game.declined ? DECLINED_GROWTH : 1) *
    (has(game, 'funnels') ? FUNNEL_GROWTH : 1)
  return rate * game.users * Math.max(0, 1 - game.users / ledger.market) * health
}

const advanceNode = (
  node: GameNode,
  ledger: Ledger,
  seconds: number,
  events: Array<StepEvent>,
): GameNode => {
  let next = node
  if (node.down > 0) {
    const down = Math.max(0, node.down - seconds)
    next = { ...next, down, warm: down === 0 ? 0 : node.warm }
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
  // A leaking process grows until the kernel kills it.
  const ram = ledger.nodes[node.id]?.resources.ram
  if (node.leak > 0 && ram && ram.used > ram.total * 1.25) {
    events.push(StepEvent.OutOfMemory({ nodeId: node.id }))
    next = { ...next, leak: 0, down: RESTART_SECONDS, warm: 0 }
  }
  return next
}

const advanceAlarms = (
  game: Game,
  ledger: Ledger,
  seconds: number,
  events: Array<StepEvent>,
): Alarms => {
  const slowest = Object.entries(ledger.kinds).some(
    ([kind, entry]) => entry.p99 > 4 * PROFILES[kind as keyof typeof PROFILES].apdex,
  )
  const hottest = Math.max(
    0,
    ...game.nodes
      .filter((node) => node.type !== 'users' && node.type !== 'analytics')
      .map((node) => ledger.nodes[node.id]?.utilization ?? 0),
  )
  const next: Alarms = {
    errors: ledger.errorShare > ALERT_RULES.errors.threshold ? game.alarms.errors + seconds : 0,
    latency: slowest ? game.alarms.latency + seconds : 0,
    saturation: hottest > ALERT_RULES.saturation.threshold ? game.alarms.saturation + seconds : 0,
  }
  if (has(game, 'alerting')) {
    for (const rule of [
      'errors',
      'latency',
      'saturation',
    ] as const satisfies ReadonlyArray<AlertRule>) {
      const limit = ALERT_RULES[rule].seconds
      if (game.alarms[rule] < limit && next[rule] >= limit)
        events.push(StepEvent.AlertFired({ rule }))
    }
  }
  return next
}

export const step = (game: Game, seconds: number): StepResult => {
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

  const nodes = game.nodes.map((node) => advanceNode(node, ledger, seconds, events))
  const users = game.sandbox
    ? game.users
    : Math.max(20, game.users + growthOf(game, ledger) * seconds)
  const apdex = game.apdex + (ledger.apdex - game.apdex) * Math.min(1, seconds / APDEX_WINDOW)
  const time = game.time + seconds
  const alarms = advanceAlarms(game, ledger, seconds, events)

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
    insight: game.insight + ledger.insight * seconds,
    time,
    earned: game.earned + earned,
    history: crossedSecond ? [...game.history, sample].slice(-HISTORY) : game.history,
  }

  const running = advanceIncident(next, ledger, seconds)
  next = running.game
  events.push(...running.events)
  const directed = directIncidents(next, ledger)
  next = directed.game
  events.push(...directed.events)

  return { game: next, ledger, events }
}
