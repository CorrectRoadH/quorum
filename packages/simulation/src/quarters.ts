import type { Ledger } from './ledger.ts'
import type { Game, Quarter } from './state.ts'
import { marginOf } from './valuation.ts'

/* ==========================================================================
   Public quarters (10 "Era 7"). A quarter is 7 calendar days. The player sets
   guidance on its first day; at its end the market compares revenue growth and
   margin with it. A beat raises the multiple, a miss lowers it, and every
   fourth beat in a row adds a bonus. The GDD gives no magnitudes: these are
   proposed (plan 5.20) and listed in 16's divergence log.
   ========================================================================== */

/** Sim seconds in a quarter: 7 calendar days. */
export const QUARTER_SECONDS = 10_080
/** Guidance may change only in the first calendar day. */
export const GUIDANCE_WINDOW = 1_440
/** Guidance levels: revenue growth over the quarter, and margin, in percent. */
export const GUIDANCE_GROWTH = [5, 10, 20] as const
export const GUIDANCE_MARGIN = [10, 20, 30] as const
/** A beat adds this to the multiple, plus a share per guidance level; a miss takes this off. */
export const BEAT = 0.5
export const BEAT_PER_LEVEL = 0.25
export const MISS = 1
/** Every fourth beat in a row adds this. */
export const STREAK = 1
/** What quarters can add to or take from the multiple. */
export const BONUS_LIMIT = 10

export const firstQuarter = (game: Game, revenue: number): Quarter => ({
  index: 1,
  startedAt: game.time,
  growth: 0,
  margin: 0,
  revenue,
  streak: 0,
  bonus: 0,
  last: null,
})

export const guidanceOpen = (game: Game): boolean =>
  game.quarter !== null && game.time - game.quarter.startedAt < GUIDANCE_WINDOW

/** Revenue growth since the quarter began, in percent. The quarter ends at the same hour of the week. */
export const quarterGrowth = (quarter: Quarter, ledger: Ledger): number =>
  quarter.revenue > 0 ? (ledger.revenue / quarter.revenue - 1) * 100 : 0

/** Closes a quarter that has run its 7 days and opens the next with the same guidance. */
export const advanceQuarter = (game: Game, ledger: Ledger): Quarter | null => {
  const quarter = game.quarter
  if (!quarter || game.time - quarter.startedAt < QUARTER_SECONDS) return quarter
  const growth = quarterGrowth(quarter, ledger)
  const margin = marginOf(ledger)
  const beat =
    growth >= (GUIDANCE_GROWTH[quarter.growth] ?? 5) &&
    margin >= (GUIDANCE_MARGIN[quarter.margin] ?? 10)
  const streak = beat ? quarter.streak + 1 : 0
  const change = beat
    ? BEAT + BEAT_PER_LEVEL * (quarter.growth + quarter.margin) + (streak % 4 === 0 ? STREAK : 0)
    : -MISS
  return {
    ...quarter,
    index: quarter.index + 1,
    startedAt: game.time,
    revenue: ledger.revenue,
    streak,
    bonus: Math.max(-BONUS_LIMIT, Math.min(BONUS_LIMIT, quarter.bonus + change)),
    last: { beat, growth, margin },
  }
}
