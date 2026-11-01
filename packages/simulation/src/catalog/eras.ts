/* Eras: market, growth, request mix and the funding round that ends each one. */

import type { RequestKind } from './kinds.ts'

export type EraDef = Readonly<{
  name: string
  /** Most users the market holds, before the Stack's market multiplier. */
  market: number
  /** Users needed to raise the next round. */
  raiseAt: number
  /** Cash the next round pays out. */
  grant: number
  /** Equity the next round costs. */
  dilution: number
  /** Growth rate per sim second. */
  growth: number
  /** Apdex below this loses users. */
  apdexTarget: number
  /**
   * Multiplies placement, resize and Burn prices. The design keeps 1 until Seed;
   * the slice raises Pre-seed so Cash still forces choices.
   */
  costIndex: number
  /** Share of each request kind in the traffic. Sums to 1. */
  mix: Partial<Record<RequestKind, number>>
  /** What the Era asks, shown on its card. */
  question: string
  /** New kinds and systems, shown on its card. */
  arrivals: string
}>

export const ERAS: ReadonlyArray<EraDef> = [
  {
    name: 'Garage',
    market: 1_500,
    raiseAt: 1_000,
    grant: 2_500,
    dilution: 0.1,
    growth: 0.004,
    apdexTarget: 0.85,
    costIndex: 1,
    mix: { page: 0.6, read: 0.4 },
    question: 'How far does one box go?',
    arrivals: 'Page views and API reads.',
  },
  {
    name: 'Pre-seed',
    market: 7_000,
    raiseAt: 5_000,
    grant: 15_000,
    dilution: 0.15,
    growth: 0.0022,
    apdexTarget: 0.86,
    costIndex: 4,
    mix: { page: 0.45, read: 0.35, write: 0.15, login: 0.05 },
    question: 'What happens when the database is the bottleneck?',
    arrivals:
      'Writes contend for the database. Logins hash passwords: 80 ms of CPU each. Incidents begin.',
  },
  {
    name: 'Seed',
    market: 35_000,
    raiseAt: Number.POSITIVE_INFINITY,
    grant: 0,
    dilution: 0,
    growth: 0.0016,
    apdexTarget: 0.88,
    costIndex: 4,
    mix: { page: 0.45, read: 0.35, write: 0.15, login: 0.05 },
    question: 'The slice ends here.',
    arrivals: 'Seed content is not built yet. Keep playing to stress your design.',
  },
]

/** Requests per second each user sends, before the daily cycle. */
export const RPS_PER_USER = 0.02
/** The daily cycle: demand peaks at 20:00 and bottoms out at 08:00. */
export const DIURNAL_AMPLITUDE = 0.45
/** Weekend demand relative to weekdays. Each Venture sets its own; the default Venture is not defined yet. */
export const WEEKEND_FACTOR = 1
/** Sim seconds in one Step of the Simulation. */
export const STEP_SECONDS = 0.1
/** The calendar starts at 14:00 on day 1, so the Garage ends near the evening peak. One sim second is one calendar minute. */
export const CALENDAR_START = 14 * 60
/** Users leave at this rate per second at the worst Apdex. */
export const CHURN = 0.004
/** Growth multiplier from Funnel analytics. */
export const FUNNEL_GROWTH = 1.1
/** Growth multiplier in an Era that began with a declined round. */
export const DECLINED_GROWTH = 0.7
/** The Apdex average covers one calendar hour. */
export const APDEX_WINDOW = 60
