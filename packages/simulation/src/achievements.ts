import {
  COMPONENTS,
  ERAS,
  MIGRATION_STEPS,
  RUNTIMES,
  VENTURES,
  VENTURE_IDS,
  type AchievementId,
  type ComponentId,
  type LanguageId,
} from './catalog.ts'
import type { StepEvent } from './events.ts'
import { PRE_IPO_STAGE } from './ipo.ts'
import type { Ledger } from './ledger.ts'
import { budgetOf, budgeted } from './slo.ts'
import type { Game } from './state.ts'
import { valuationOf } from './valuation.ts'

/* ==========================================================================
   Achievements (14 "Achievements"): what a Company's Steps did that is worth
   a badge. Pure: the browser calls it on each tick of a Company, never in a
   Sandbox or a Challenge, and keeps the badges in the Founder record.
   ========================================================================== */

/** Counts the Founder keeps across Companies for the counting achievements. */
export type AchievementStats = Readonly<{ postmortems: number; terminations: number }>

export type Moment = Readonly<{
  before: Game
  after: Game
  ledger: Ledger
  events: ReadonlyArray<StepEvent>
  /** The Founder's counts, with this moment's events already added. */
  stats: AchievementStats
}>

const SERIES_A = ERAS.findIndex((era) => era.name === 'Series A')
const SERIES_B = ERAS.findIndex((era) => era.name === 'Series B')
const PUBLIC = PRE_IPO_STAGE + 1
const WEEK_HOURS = 7 * 24
const POSTGRES: ReadonlySet<ComponentId> = new Set(['database', 'pooler', 'replica'])

const reached = (moment: Moment, stage: number): boolean =>
  moment.before.stage < stage && moment.after.stage >= stage

const languages = (game: Game): ReadonlySet<LanguageId> =>
  new Set(
    game.nodes
      .filter((node) => COMPONENTS[node.type].group === 'compute')
      .map((node) => RUNTIMES[node.runtime].language),
  )

/** Equity before any round: the Pre-seed grant's dilution, or none when bootstrapped. */
const foundedEquity = (game: Game): number =>
  VENTURES[game.founding.venture].bootstrapped ? 1 : 1 - (ERAS[0]?.dilution ?? 0)

/** The terminations the chaos count takes: an instance failing on its own. */
export const isTermination = (event: StepEvent): boolean =>
  event._tag === 'IncidentResolved' && event.postmortem.kind === 'instance'

/** The Founder's counts after these events. */
export const countStats = (
  stats: AchievementStats,
  events: ReadonlyArray<StepEvent>,
): AchievementStats => ({
  postmortems:
    stats.postmortems + events.filter((event) => event._tag === 'IncidentResolved').length,
  terminations: stats.terminations + events.filter(isTermination).length,
})

const CHECKS: Partial<Record<AchievementId, (moment: Moment) => boolean>> = {
  'hello-world': ({ ledger }) => ledger.served > 0,
  'works-on-my-machine': ({ events }) =>
    events.some((event) => event._tag === 'Deployed' && event.bad),
  'split-brain': ({ before, after }) =>
    !before.nodes.some((node) => node.type === 'database') &&
    after.nodes.some((node) => node.type === 'database'),
  'averages-lie': ({ before, after, ledger }) =>
    !before.researched.includes('percentiles') &&
    after.researched.includes('percentiles') &&
    ledger.p99 > 5 * ledger.latency,
  metastable: ({ events }) =>
    events.some(
      (event) => event._tag === 'IncidentResolved' && event.postmortem.kind === 'retry-storm',
    ),
  strangler: ({ events, ledger }) =>
    events.some(
      (event) => event._tag === 'MigrationShifted' && event.step === MIGRATION_STEPS.length - 1,
    ) && ledger.errorShare < 0.01,
  polyglot: ({ after }) => languages(after).size >= 5,
  'zero-gc': ({ after, ledger }) =>
    after.nodes.some(
      (node) =>
        RUNTIMES[node.runtime].language === 'rust' &&
        COMPONENTS[node.type].group === 'compute' &&
        (ledger.nodes[node.id]?.inbound ?? 0) >= 100_000,
    ),
  'no-cache': (moment) =>
    reached(moment, SERIES_A) &&
    !moment.after.nodes.some((node) => node.type === 'cache' || node.type === 'cdn'),
  'postgres-for-everything': (moment) =>
    reached(moment, SERIES_B) &&
    moment.after.nodes.every(
      (node) => COMPONENTS[node.type].group !== 'data' || POSTGRES.has(node.type),
    ),
  'hug-of-death': ({ before, events }) =>
    before.incident !== null &&
    before.incident.kind === 'spike' &&
    before.incident.magnitude >= 10 &&
    events.some(
      (event) =>
        event._tag === 'IncidentResolved' &&
        event.postmortem.kind === 'spike' &&
        event.postmortem.lostUsers <= 0,
    ),
  'chaos-monkey': ({ stats }) => stats.terminations >= 100,
  blameless: ({ stats }) => stats.postmortems >= 50,
  nines: ({ after }) => {
    if (!budgeted(after) || after.budget.length < WEEK_HOURS) return false
    const budget = budgetOf(after)
    return budget.requests > 0 && budget.availability >= 0.9999
  },
  monoglot: (moment) => reached(moment, PUBLIC) && languages(moment.after).size === 1,
  'default-alive': (moment) =>
    reached(moment, PUBLIC) && moment.before.equity >= foundedEquity(moment.before) - 1e-9,
  unicorn: ({ after, ledger }) =>
    after.stage >= SERIES_A && valuationOf(after, ledger).valuation >= 1e9,
  decacorn: ({ after, ledger }) =>
    after.stage >= SERIES_A && valuationOf(after, ledger).valuation >= 1e10,
  'rule-of-40': ({ after, ledger }) =>
    after.quarter !== null && valuationOf(after, ledger).ruleOf40 >= 80,
  'beat-and-raise': ({ after }) => after.quarter !== null && after.quarter.streak >= 8,
}

/** Achievements this moment earns that `owned` does not hold yet. */
export const detectAchievements = (
  moment: Moment,
  owned: ReadonlyArray<AchievementId>,
): ReadonlyArray<AchievementId> => {
  if (moment.after.sandbox) return []
  return Object.entries(CHECKS)
    .filter(([id, check]) => !owned.includes(id as AchievementId) && check(moment))
    .map(([id]) => id as AchievementId)
}

/** Serial founder: an Exit with every Venture. */
export const everyVenture = (ventures: ReadonlyArray<string>): boolean =>
  VENTURE_IDS.every((id) => ventures.includes(id))

/** Challenge achievements from one verified result's percentiles (0 to 1) per axis. */
export const challengeAchievements = (
  percentiles: ReadonlyArray<number>,
): ReadonlyArray<AchievementId> => [
  ...(percentiles.some((value) => value >= 0.9) ? (['histogram'] as const) : []),
  ...(percentiles.length >= 3 && percentiles.every((value) => value >= 0.7)
    ? (['pareto'] as const)
    : []),
]
