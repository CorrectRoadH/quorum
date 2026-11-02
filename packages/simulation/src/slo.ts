import { ERROR_BUDGET_FACTORS, SLO_FROM_STAGE, SLO_WINDOW_HOURS } from './catalog.ts'
import { ERROR_CAUSES } from './distribution.ts'
import type { Ledger } from './ledger.ts'
import { eraOf, has } from './lookups.ts'
import { calendarMinute } from './solve.ts'
import type { BudgetHour, Game } from './state.ts'

/* ==========================================================================
   The SLO and its error budget (11 "SLOs and error budgets"). The window is
   the last calendar week, kept as hourly counts of the requests users sent
   and the ones that failed. Bots do not count: the Ledger leaves them out. A
   real user the WAF blocked got a 403, a client error, so it does not spend
   the budget either: the budget counts what the service failed to answer.
   ========================================================================== */

/** Requests per second that spend the error budget: every failure but a WAF block. */
export const budgetFailures = (ledger: Ledger): number => {
  let failed = 0
  for (const cause of ERROR_CAUSES) if (cause !== 'blocked') failed += ledger.errors[cause]
  return failed
}

export type Budget = Readonly<{
  slo: number
  requests: number
  failed: number
  /** Failures the SLO allows over the window. */
  allowed: number
  /** Share of the budget left: 1 untouched, 0 spent, below 0 overspent. */
  left: number
  /** Share of requests answered over the window. */
  availability: number
}>

export const budgetOf = (game: Game): Budget => {
  const slo = eraOf(game).slo
  let requests = 0
  let failed = 0
  for (const entry of game.budget) {
    requests += entry.requests
    failed += entry.failed
  }
  const allowed = (1 - slo) * requests
  return {
    slo,
    requests,
    failed,
    allowed,
    left: allowed > 0 ? 1 - failed / allowed : 1,
    availability: requests > 0 ? 1 - failed / requests : 1,
  }
}

/** The error budget counts from Series A. */
export const budgeted = (game: Game): boolean => !game.sandbox && game.stage >= SLO_FROM_STAGE

/**
 * What the budget does to the team's velocity with Error budgets researched:
 * more than half left speeds it up, a spent budget freezes Features at half speed.
 */
export const budgetVelocity = (game: Game): number => {
  if (!budgeted(game) || !has(game, 'error-budgets')) return 1
  const { left } = budgetOf(game)
  return left > 0.5
    ? ERROR_BUDGET_FACTORS.ahead
    : left <= 0
      ? ERROR_BUDGET_FACTORS.spent
      : ERROR_BUDGET_FACTORS.normal
}

/** Adds some seconds of the Ledger to the window, from Series A on, and drops hours older than a week. */
export const recordBudget = (
  game: Game,
  ledger: Ledger,
  seconds: number,
): ReadonlyArray<BudgetHour> => {
  if (!budgeted(game) || ledger.demand <= 0) return game.budget
  const hour = Math.floor(calendarMinute(game.time) / 60)
  const requests = ledger.demand * seconds
  const failed = budgetFailures(ledger) * seconds
  const last = game.budget.at(-1)
  const kept = game.budget.filter((entry) => entry.hour > hour - SLO_WINDOW_HOURS)
  if (last && last.hour === hour)
    return [
      ...kept.slice(0, -1),
      {
        hour,
        requests: last.requests + requests,
        failed: last.failed + failed,
        users: game.users,
      },
    ]
  return [...kept, { hour, requests, failed, users: game.users }]
}
