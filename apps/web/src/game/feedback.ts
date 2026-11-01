import type { Ledger } from './engine/ledger.ts'
import type { Game } from './engine/state.ts'
import { priceOf, refundOf } from './engine/lookups.ts'
import type { Change, Delta, Figures, Model, Undo } from './model.ts'

/* ==========================================================================
   Feedback after a change: Settling while the Design settles, then a delta
   that compares before and after. Undo and redo keep the last 50 actions.
   ========================================================================== */

/** Ticks a change must hold steady for: about 3 real seconds at four ticks a second (16 D18). */
export const STEADY_TICKS = 12
/** A change counts as settled after this many sim seconds even if it still moves. */
export const SETTLE_LIMIT = 30
/** Ticks "Stable" shows once a change settles: 2 real seconds. */
export const STABLE_TICKS = 8
const DELTA_SECONDS = 10

export { figuresOf } from './engine/preview.ts'
import { figuresOf } from './engine/preview.ts'

/** Starts or extends a change. Several quick changes settle as one. */
export const beginChange = (model: Model, label: string, before: Figures): Model => ({
  ...model,
  delta: null,
  stableTicks: 0,
  change: model.change
    ? { ...model.change, label, count: model.change.count + 1, recent: [], steady: 0 }
    : { label, count: 1, startedAt: model.game.time, before, recent: [], steady: 0 },
})

const warming = (game: Game): boolean => game.nodes.some((node) => node.down > 0 || node.warm < 1)

type Sample = Change['recent'][number]

/** Two samples agree: revenue and served within 1%, error share within 0.1 points. */
const close = (a: Sample, b: Sample): boolean =>
  Math.abs(a.revenue - b.revenue) <= Math.max(1e-6, 0.01 * Math.abs(b.revenue)) &&
  Math.abs(a.served - b.served) <= Math.max(1e-6, 0.01 * Math.abs(b.served)) &&
  Math.abs(a.errors - b.errors) <= 0.001

/** Trailing samples that agree with the newest one. */
const steadyCount = (recent: ReadonlyArray<Sample>): number => {
  const newest = recent.at(-1)
  if (!newest) return 0
  let count = 0
  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const sample = recent[index]
    if (!sample || !close(sample, newest)) break
    count += 1
  }
  return count
}

/** How far the running change is from settling, from 0 to 1, for the Settling ring. */
export const settleProgress = (model: Model): number => {
  const change = model.change
  if (!change) return 1
  const elapsed = model.game.time - change.startedAt
  return Math.min(1, Math.max(change.steady / STEADY_TICKS, elapsed / SETTLE_LIMIT))
}

/** Advances the running change; returns the delta once it settles. */
export const advanceChange = (
  model: Model,
  ledger: Ledger,
  seq: number,
): Readonly<{ change: Change | null; delta: Delta | null }> => {
  const change = model.change
  if (!change) return { change: null, delta: null }
  const sample = { revenue: ledger.revenue, served: ledger.served, errors: ledger.errorShare }
  const recent = [...change.recent, sample].slice(-STEADY_TICKS)
  const steady = steadyCount(recent)
  const elapsed = model.game.time - change.startedAt
  if (elapsed < SETTLE_LIMIT && (steady < STEADY_TICKS || warming(model.game)))
    return { change: { ...change, recent, steady }, delta: null }
  const after = figuresOf(ledger)
  const worse =
    after.revenue < change.before.revenue * 0.98 || after.errors > change.before.errors + 0.005
  return {
    change: null,
    delta: {
      id: seq,
      label: change.count > 1 ? `${change.count} changes` : change.label,
      before: change.before,
      after,
      worse,
      shownAt: model.game.time,
    },
  }
}

export const deltaExpired = (model: Model): boolean =>
  !!model.delta && model.game.time - model.delta.shownAt > DELTA_SECONDS && !model.delta.worse

/** Undo is exact for this long after an action; later, money settles at normal prices (16 D17). */
export const UNDO_SECONDS = 30
/** Undo keeps this many actions. */
export const UNDO_LIMIT = 50

/** The Design pieces of a Game, for the undo and redo stacks. */
export const snapshotOf = (label: string, game: Game, cash: number, at: number): Undo => ({
  label,
  nodes: game.nodes,
  links: game.links,
  nextId: game.nextId,
  cash,
  at,
})

/** Records an undoable action: its entry goes on the stack and redo is cleared. */
export const pushUndo = (model: Model, entry: Undo): Pick<Model, 'undo' | 'redo'> => ({
  undo: [...model.undo, entry].slice(-UNDO_LIMIT),
  redo: [],
})

export const undoAvailable = (model: Model): boolean => model.undo.length > 0
export const redoAvailable = (model: Model): boolean => model.redo.length > 0

/** Puts a Design back, keeping what time did to each Node: credits, leaks, and failures. */
const restore = (game: Game, entry: Undo, cash: number): Game => ({
  ...game,
  nodes: entry.nodes.map((node) => {
    const now = game.nodes.find((current) => current.id === node.id)
    if (!now) return node
    const failed = now.down !== 0 && now.downCause !== 'restart'
    return {
      ...node,
      credits: now.credits,
      leak: now.leak,
      ...(failed ? { down: now.down, downCause: now.downCause, downAt: now.downAt } : {}),
    }
  }),
  links: entry.links,
  nextId: Math.max(entry.nextId, game.nextId),
  cash: game.cash + cash,
})

/**
 * Cash an undo moves after the exact window: Nodes it removes refund half, as a
 * sale does; Nodes it brings back cost their place price; resizes move nothing.
 */
const settledCash = (game: Game, entry: Undo): number => {
  const ids = new Set(entry.nodes.map((node) => node.id))
  const current = new Set(game.nodes.map((node) => node.id))
  const removed = game.nodes
    .filter((node) => !ids.has(node.id))
    .reduce((total, node) => total + refundOf(game, node), 0)
  let added = 0
  let counted = game
  for (const node of entry.nodes.filter((entry) => !current.has(entry.id))) {
    added += priceOf(counted, node.type)
    counted = { ...counted, nodes: [...counted.nodes, node] }
  }
  return removed - added
}

export type Reversal = Readonly<{
  game: Game
  label: string
  undo: ReadonlyArray<Undo>
  redo: ReadonlyArray<Undo>
}>

/**
 * Undoes the newest action. Within 30 s it reverses exactly the Cash the action
 * moved, so undoing never gains Cash. Later, money settles at normal prices.
 * Returns a reason when it cannot.
 */
export const undoGame = (model: Model): Reversal | string => {
  const entry = model.undo.at(-1)
  if (!entry) return 'Nothing to undo.'
  const game = model.game
  const cash = game.time - entry.at <= UNDO_SECONDS ? -entry.cash : settledCash(game, entry)
  if (cash < 0 && game.cash + cash < 0) return 'Not enough Cash to undo that.'
  return {
    game: restore(game, entry, cash),
    label: entry.label,
    undo: model.undo.slice(0, -1),
    // Redo puts this Design back and takes back exactly the Cash the undo moved.
    redo: [...model.redo, snapshotOf(entry.label, game, cash, entry.at)],
  }
}

/** Redoes the newest undone action, with the inverse of the Cash its undo moved. */
export const redoGame = (model: Model): Reversal | string => {
  const entry = model.redo.at(-1)
  if (!entry) return 'Nothing to redo.'
  const game = model.game
  const cash = -entry.cash
  if (cash < 0 && game.cash + cash < 0) return 'Not enough Cash to redo that.'
  return {
    game: restore(game, entry, cash),
    label: entry.label,
    undo: [...model.undo, snapshotOf(entry.label, game, cash, game.time)].slice(-UNDO_LIMIT),
    redo: model.redo.slice(0, -1),
  }
}

const signed = (value: number, digits = 2): string =>
  `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`

/** "+$1.40/s (+18%) · p99 −120 ms · errors −2.1%" */
export const describeDelta = (delta: Delta, percentiles: boolean): string => {
  const revenue = delta.after.revenue - delta.before.revenue
  const share = delta.before.revenue > 0 ? (revenue / delta.before.revenue) * 100 : 0
  const latency = percentiles
    ? `p99 ${signed(delta.after.p99 - delta.before.p99, 0)} ms`
    : `latency ${signed(delta.after.latency - delta.before.latency, 0)} ms`
  const errors = (delta.after.errors - delta.before.errors) * 100
  return [
    `${revenue >= 0 ? '+' : '−'}$${Math.abs(revenue).toFixed(2)}/s (${signed(share, 0)}%)`,
    latency,
    Math.abs(errors) >= 0.05 ? `errors ${signed(errors, 1)}%` : null,
  ]
    .filter((part) => part !== null)
    .join(' · ')
}
