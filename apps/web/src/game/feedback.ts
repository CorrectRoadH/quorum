import type { Ledger } from './engine/ledger.ts'
import type { Game } from './engine/state.ts'
import type { Change, Delta, Figures, Model } from './model.ts'

/* ==========================================================================
   Feedback after a change: Settling while the Design settles, then a delta
   that compares before and after, with Undo for 30 seconds.
   ========================================================================== */

/** Ticks of revenue a change must hold steady for. Four ticks a second. */
const STEADY_TICKS = 12
/** A change counts as settled after this many sim seconds even if it still moves. */
const SETTLE_LIMIT = 30
export const UNDO_SECONDS = 30
const DELTA_SECONDS = 10

export const figuresOf = (ledger: Ledger): Figures => ({
  revenue: ledger.revenue,
  latency: ledger.latency,
  p99: ledger.p99,
  errors: ledger.errorShare,
})

/** Starts or extends a change. Several quick changes settle as one. */
export const beginChange = (model: Model, label: string, before: Figures): Model => ({
  ...model,
  delta: null,
  change: model.change
    ? { ...model.change, label, count: model.change.count + 1, recent: [] }
    : { label, count: 1, startedAt: model.game.time, before, recent: [] },
})

const warming = (game: Game): boolean => game.nodes.some((node) => node.down > 0 || node.warm < 1)

/** Advances the running change; returns the delta once it settles. */
export const advanceChange = (
  model: Model,
  ledger: Ledger,
  seq: number,
): Readonly<{ change: Change | null; delta: Delta | null }> => {
  const change = model.change
  if (!change) return { change: null, delta: null }
  const recent = [...change.recent, ledger.revenue].slice(-STEADY_TICKS)
  const elapsed = model.game.time - change.startedAt
  const high = Math.max(...recent)
  const low = Math.min(...recent)
  const steady =
    recent.length >= STEADY_TICKS && high - low <= Math.max(0.01, 0.01 * Math.abs(high))
  if (elapsed < SETTLE_LIMIT && (!steady || warming(model.game)))
    return { change: { ...change, recent }, delta: null }
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

/** Undo stays open while the change settles and for a while after its delta shows. */
export const undoAvailable = (model: Model): boolean => {
  if (!model.undo) return false
  if (model.change) return true
  const since = Math.max(model.undo.at, model.delta?.shownAt ?? model.undo.at)
  return model.game.time - since <= UNDO_SECONDS
}

/**
 * Puts the Design back as it was before the last board action and reverses the
 * Cash it moved: a purchase is refunded, and a sale's refund is taken back.
 */
export const undoGame = (model: Model): Game | null => {
  const undo = model.undo
  if (!undo || !undoAvailable(model)) return null
  return {
    ...model.game,
    nodes: undo.game.nodes.map((node) => {
      const now = model.game.nodes.find((entry) => entry.id === node.id)
      // Keep what time did to the Node; take back what the player did.
      return now ? { ...node, credits: now.credits, leak: now.leak } : node
    }),
    links: undo.game.links,
    nextId: Math.max(undo.game.nextId, model.game.nextId),
    cash: model.game.cash - undo.cash,
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
