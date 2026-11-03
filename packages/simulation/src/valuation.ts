import { has } from './lookups.ts'
import type { Ledger } from './ledger.ts'
import type { Game } from './state.ts'

/* ==========================================================================
   The valuation (09 "Valuation"): ARR times a multiple the Rule of 40 sets.
   Growth reads the users at the start of the SLO window, a calendar week ago.
   ========================================================================== */

/** Converts a year of game revenue into real ARR (16 "Valuation scale"). */
export const VALUATION_SCALE = 0.00015
/** Investor relations adds this to the multiple. */
export const INVESTOR_RELATIONS = 2
const HOURS_PER_YEAR = 8_760

export type Valuation = Readonly<{
  arr: number
  /** User growth over the window, annualized, in percent. */
  growth: number
  /** (income − Burn) / income, in percent. */
  margin: number
  ruleOf40: number
  multiple: number
  valuation: number
}>

/**
 * User growth over the last calendar week, annualized linearly, in percent. The
 * GDD does not say how to annualize; compounding needs a power, so the build
 * scales the week's growth by the hours in a year.
 */
export const userGrowthOf = (game: Game): number => {
  const first = game.budget.find((entry) => entry.users > 0)
  const last = game.budget.at(-1)
  if (!first || !last || last.hour <= first.hour) return 0
  return ((game.users / first.users - 1) * HOURS_PER_YEAR * 100) / (last.hour - first.hour + 1)
}

export const marginOf = (ledger: Ledger): number =>
  ledger.revenue > 0 ? ((ledger.revenue - ledger.burn) / ledger.revenue) * 100 : -100

export const valuationOf = (game: Game, ledger: Ledger): Valuation => {
  // One sim second is one calendar minute: a calendar day is 1,440 seconds of revenue.
  const arr = ledger.revenue * 1_440 * 365 * VALUATION_SCALE
  const growth = userGrowthOf(game)
  const margin = marginOf(ledger)
  const ruleOf40 = growth + margin
  const base = Math.min(30, Math.max(2, 4 + 0.15 * Math.max(0, ruleOf40)))
  const multiple = Math.max(
    1,
    base + (has(game, 'investor-relations') ? INVESTOR_RELATIONS : 0) + (game.quarter?.bonus ?? 0),
  )
  return { arr, growth, margin, ruleOf40, multiple, valuation: arr * multiple }
}
