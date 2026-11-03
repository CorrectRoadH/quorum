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
  /**
   * Equity the next round costs. Seed through Series C follow Carta's medians: seed 19.4% and
   * Series A 18.7% (Q2 2026), Series B 12.9% (2025), and 16% across seed to Series C.
   */
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
  /**
   * Multiplies engineer salaries and signing costs. The design keeps 1 until Seed;
   * the slice follows the raised Pre-seed cost index so payroll is a real share of Burn.
   */
  salaryIndex: number
  /** Availability target per calendar week (10 "Eras"). The error budget counts from Series A. */
  slo: number
  /** Mean sim seconds between incidents at the design pace (11 "The incident director"); 0 for none. */
  incidentInterval: number
  /** The worst severity an incident may start at in this Era. */
  maxSeverity: 1 | 2 | 3
  /** Share of each request kind in the traffic. Sums to 1. */
  mix: Partial<Record<RequestKind, number>>
  /** What the Era asks, shown on its card. */
  question: string
  /** New kinds and systems, shown on its card. */
  arrivals: string
}>

/** Series B's mix (10 "Request mix by Era"). */
const SERIES_B_MIX: Partial<Record<RequestKind, number>> = {
  page: 0.18,
  read: 0.22,
  write: 0.09,
  login: 0.03,
  search: 0.07,
  upload: 0.03,
  bot: 0.07,
  media: 0.1,
  rt: 0.08,
  buy: 0.03,
  job: 0.02,
  report: 0.03,
  ai: 0.05,
}

/** The mix from Series C on (10 "Request mix by Era": Series C+). */
const SERIES_C_MIX: Partial<Record<RequestKind, number>> = {
  page: 0.14,
  read: 0.18,
  write: 0.08,
  login: 0.02,
  search: 0.06,
  upload: 0.02,
  bot: 0.07,
  media: 0.1,
  rt: 0.08,
  buy: 0.03,
  job: 0.02,
  report: 0.02,
  ai: 0.06,
  feed: 0.08,
  hook: 0.02,
  push: 0.02,
}

export const ERAS: ReadonlyArray<EraDef> = [
  {
    name: 'Garage',
    slo: 0.99,
    incidentInterval: 0,
    maxSeverity: 3,
    market: 1_500,
    raiseAt: 1_000,
    grant: 2_500,
    dilution: 0.1,
    growth: 0.004,
    apdexTarget: 0.85,
    costIndex: 1,
    salaryIndex: 1,
    mix: { page: 0.6, read: 0.4 },
    question: 'How far does one box go?',
    arrivals: 'Page views and API reads.',
  },
  {
    name: 'Pre-seed',
    slo: 0.99,
    incidentInterval: 720,
    maxSeverity: 2,
    market: 7_000,
    raiseAt: 5_000,
    grant: 15_000,
    dilution: 0.19,
    growth: 0.0022,
    apdexTarget: 0.86,
    costIndex: 4,
    salaryIndex: 4,
    mix: { page: 0.45, read: 0.35, write: 0.15, login: 0.05 },
    question: 'What happens when the database is the bottleneck?',
    arrivals: 'Writes contend for the database. Hiring opens. Incidents begin.',
  },
  {
    name: 'Seed',
    slo: 0.995,
    incidentInterval: 600,
    maxSeverity: 2,
    market: 35_000,
    raiseAt: 25_000,
    grant: 80_000,
    dilution: 0.19,
    growth: 0.0016,
    apdexTarget: 0.88,
    costIndex: 8,
    salaryIndex: 8,
    mix: {
      page: 0.3,
      read: 0.3,
      write: 0.12,
      login: 0.04,
      search: 0.1,
      upload: 0.04,
      bot: 0.1,
    },
    question: 'What happens when one App Server type cannot serve every kind?',
    arrivals: 'Search, uploads and bots. Queues, Workers, a CDN and a WAF.',
  },
  {
    name: 'Series A',
    slo: 0.999,
    incidentInterval: 540,
    maxSeverity: 2,
    market: 200_000,
    raiseAt: 150_000,
    grant: 1_500_000,
    dilution: 0.13,
    growth: 0.0009,
    apdexTarget: 0.9,
    costIndex: 12,
    salaryIndex: 12,
    mix: {
      page: 0.22,
      read: 0.25,
      write: 0.1,
      login: 0.03,
      search: 0.08,
      upload: 0.03,
      bot: 0.08,
      media: 0.1,
      rt: 0.08,
      buy: 0.03,
    },
    question: 'What happens when a whole zone fails?',
    arrivals: 'Video, chat and checkout. Zones, autoscaling and an error budget.',
  },
  {
    name: 'Series B',
    slo: 0.999,
    incidentInterval: 480,
    maxSeverity: 1,
    market: 1_400_000,
    raiseAt: 1_000_000,
    grant: 18_000_000,
    dilution: 0.12,
    growth: 0.0007,
    apdexTarget: 0.91,
    costIndex: 16,
    salaryIndex: 16,
    mix: SERIES_B_MIX,
    question: 'What happens when analytics and AI share a database built for checkouts?',
    arrivals: 'Exports, reports and AI prompts. Warehouses, GPUs, retries and breakers.',
  },
  {
    name: 'Series C',
    slo: 0.9995,
    incidentInterval: 480,
    maxSeverity: 1,
    market: 14_000_000,
    raiseAt: 10_000_000,
    grant: 150_000_000,
    dilution: 0.12,
    growth: 0.0005,
    apdexTarget: 0.92,
    costIndex: 20,
    salaryIndex: 20,
    mix: SERIES_C_MIX,
    question: 'What happens when your users live on four continents?',
    arrivals: 'Feeds, webhooks and push. Regions, GeoDNS, quorums and consensus.',
  },
  {
    name: 'Pre-IPO',
    slo: 0.9995,
    incidentInterval: 600,
    maxSeverity: 1,
    market: 70_000_000,
    raiseAt: 50_000_000,
    // The IPO pays IPO_BURN_SECONDS of Burn instead of a fixed grant (ipo.ts).
    grant: 0,
    dilution: 0.15,
    growth: 0.0003,
    apdexTarget: 0.93,
    costIndex: 24,
    salaryIndex: 24,
    mix: SERIES_C_MIX,
    question: 'Can you prove the company is ready to go public?',
    arrivals: 'The IPO checklist: reliability, SOC 2, a DR drill, data residency, the Rule of 40.',
  },
  {
    name: 'Public',
    slo: 0.9999,
    incidentInterval: 600,
    maxSeverity: 1,
    market: 6_000_000_000,
    raiseAt: Number.POSITIVE_INFINITY,
    grant: 0,
    dilution: 0,
    growth: 0.0002,
    apdexTarget: 0.94,
    costIndex: 24,
    salaryIndex: 24,
    mix: SERIES_C_MIX,
    question: 'Can you beat your guidance every quarter?',
    arrivals: 'Quarters, guidance and the market multiple. The game is endless.',
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
