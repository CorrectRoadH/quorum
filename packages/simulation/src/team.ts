import {
  BAD_DEPLOY_BASE,
  BAD_DEPLOY_ERRORS,
  BAD_DEPLOY_MAX,
  CALENDAR_DAY,
  CI_DEPLOY_MINUTES,
  CODE_REVIEW_FACTOR,
  COORDINATION,
  DEV_HOURS_PER_DAY,
  ERAS,
  FOUNDER_OUTPUT,
  HIRE_DAYS,
  LANGUAGES,
  LAYOFF_MORALE,
  LIVE_TUNING,
  MANUAL_DEPLOY_MINUTES,
  MORALE_DAYS,
  POLICIES,
  POLICY_SWITCH_DAYS,
  RAMP_DAYS,
  RAMP_OUTPUT,
  RETROGRADE,
  SALARY_BASE,
  SIGNING_BASE,
  STRUCTURED_COORDINATION,
  TESTS_FACTOR,
  VERIFY_MINUTES,
  WORK_MINUTES,
  type FixId,
  type FrameworkId,
  type LanguageId,
  type PolicyDef,
  type RuntimeId,
  type Tuning,
} from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { eraOf, has, languageOf } from './lookups.ts'
import { budgetVelocity } from './slo.ts'
import {
  monolith,
  type Engineer,
  type Game,
  type Service,
  type Team,
  type WorkItem,
} from './state.ts'

/* ==========================================================================
   The Team (08): who works, how fast, and what it costs. Pure numbers; the
   actions and the Step that use them are in work.ts.
   ========================================================================== */

/** Headcount after the coordination penalty (08 "Coordination"). */
export const effectiveEngineers = (n: number, structured = false): number => {
  if (n <= 0) return 0
  const k = COORDINATION * (structured ? STRUCTURED_COORDINATION : 1)
  return n / (1 + k * (n - 1) + RETROGRADE * n * (n - 1))
}

/** The slice has one Service. */
export const serviceOf = (game: Game): Service => game.services[0] ?? monolith([])

export const withService = (game: Game, change: Partial<Service>): Game => ({
  ...game,
  services: [{ ...serviceOf(game), ...change }, ...game.services.slice(1)],
})

/** A Sandbox has no Team: every fix is in its code, unless its Challenge makes fixes cost Dev Hours. */
export const fixed = (game: Game, fix: FixId): boolean =>
  (game.sandbox && !game.scenario?.tasks) || serviceOf(game).fixes.includes(fix)

const servers = (game: Game) => game.nodes.filter((node) => node.type === 'server')

/** The Stack most App Servers run: what the Service is written in. */
export const stackOf = (game: Game): Readonly<{ runtime: RuntimeId; framework: FrameworkId }> => {
  const counts = new Map<string, number>()
  for (const node of servers(game)) {
    const key = `${node.runtime}/${node.framework}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let best: string | null = null
  for (const [key, count] of counts)
    if (best === null || count > (counts.get(best) ?? 0)) best = key
  const first = servers(game)[0]
  if (best === null || !first) return { runtime: 'mod_php', framework: 'none' }
  const [runtime, framework] = best.split('/') as [RuntimeId, FrameworkId]
  return { runtime, framework }
}

/** The language the Service hires for. */
export const languageOfService = (game: Game): LanguageId => {
  const node = servers(game).find((entry) => entry.runtime === stackOf(game).runtime)
  return node ? languageOf(node) : 'php'
}

/** A structured framework lowers coordination and slows tech debt (Symfony). */
export const structured = (game: Game): boolean => stackOf(game).framework === 'symfony'

/* ---------- calendar time ---------- */

const days = (count: number, tuning: Tuning): number => (count * CALENDAR_DAY) / tuning.calendarPace

/** The policy a team works under now: the old one for a calendar day after a change. */
export const policyNow = (game: Game, team: Team, tuning: Tuning = LIVE_TUNING): PolicyDef =>
  game.time - team.since < days(POLICY_SWITCH_DAYS, tuning)
    ? POLICIES[team.previous]
    : POLICIES[team.policy]

/** Sim seconds a new hire runs at 30%. Rails halves it; no framework stretches it with debt. */
export const rampSeconds = (game: Game, tuning: Tuning = LIVE_TUNING): number => {
  const framework = stackOf(game).framework
  const factor = framework === 'rails' ? 0.5 : framework === 'none' ? 1 + serviceOf(game).debt : 1
  return days(RAMP_DAYS, tuning) * factor
}

export const outputOf = (game: Game, engineer: Engineer, tuning: Tuning = LIVE_TUNING): number =>
  game.time - engineer.hiredAt < rampSeconds(game, tuning) ? RAMP_OUTPUT : 1

export const hireSeconds = (language: LanguageId, tuning: Tuning = LIVE_TUNING): number =>
  days(HIRE_DAYS * LANGUAGES[language].hireTime, tuning)

export const moraleSeconds = (tuning: Tuning = LIVE_TUNING): number => days(MORALE_DAYS, tuning)

/* ---------- output ---------- */

export type TeamOutput = Readonly<{
  team: Team
  /** People on the team, the founder included. */
  headcount: number
  effective: number
  velocity: number
  /** Dev Hours per sim second. */
  rate: number
}>

export const membersOf = (game: Game, team: Team): ReadonlyArray<Engineer> =>
  game.engineers.filter((engineer) => engineer.team === team.id)

/**
 * Dev Hours each team makes (08): effective engineers × velocity × 8 per
 * calendar day, where velocity is the Stack's, slowed by debt, set by the
 * policy, and hit by morale. Dev Hours follow the Team's calendar, so
 * `calendarPace` speeds them as it speeds hiring and deploys.
 */
export const teamOutputs = (
  game: Game,
  ledger: Ledger,
  tuning: Tuning = LIVE_TUNING,
): ReadonlyArray<TeamOutput> => {
  if (game.sandbox) return []
  const debt = serviceOf(game).debt
  const morale = game.time < game.moraleUntil ? LAYOFF_MORALE : 1
  return game.teams.map((team, index) => {
    const members = membersOf(game, team)
    const founder = index === 0 ? FOUNDER_OUTPUT : 0
    const headcount = members.length + (index === 0 ? 1 : 0)
    const output = members.reduce(
      (sum, engineer) => sum + outputOf(game, engineer, tuning),
      founder,
    )
    const effective =
      headcount > 0 ? (effectiveEngineers(headcount, structured(game)) * output) / headcount : 0
    const velocity =
      ledger.velocity *
      (1 - 0.5 * debt) *
      policyNow(game, team, tuning).velocity *
      morale *
      budgetVelocity(game)
    const rate = (effective * velocity * DEV_HOURS_PER_DAY * tuning.calendarPace) / CALENDAR_DAY
    return { team, headcount, effective, velocity, rate }
  })
}

export const devHoursRate = (game: Game, ledger: Ledger, tuning: Tuning = LIVE_TUNING): number =>
  teamOutputs(game, ledger, tuning).reduce((sum, entry) => sum + entry.rate, 0)

/* ---------- money ---------- */

export const salaryOf = (game: Game, language: LanguageId): number =>
  SALARY_BASE * eraOf(game).salaryIndex * LANGUAGES[language].salary

/** Dollars per second of payroll. The founder draws no salary. */
export const payrollOf = (game: Game): number =>
  game.engineers.reduce((sum, engineer) => sum + salaryOf(game, engineer.language), 0)

/** One-time Cash to sign an engineer: $2,000 × the language's salary in Pre-seed, scaled by the Era. */
export const signingOf = (game: Game, language: LanguageId): number =>
  Math.round(
    (SIGNING_BASE * LANGUAGES[language].salary * eraOf(game).salaryIndex) /
      (ERAS[1]?.salaryIndex ?? 1),
  )

/* ---------- deploys ---------- */

export const deploysPerDay = (game: Game, tuning: Tuning = LIVE_TUNING): number => {
  const team = game.teams[0]
  const policy = team ? policyNow(game, team, tuning) : POLICIES.balanced
  const deploy = has(game, 'ci') ? CI_DEPLOY_MINUTES : MANUAL_DEPLOY_MINUTES
  const build = LANGUAGES[languageOfService(game)].buildMinutes
  return Math.min(policy.deploysPerDay, WORK_MINUTES / (build + deploy + VERIFY_MINUTES))
}

/** Sim seconds between deploy slots. */
export const deployEvery = (game: Game, tuning: Tuning = LIVE_TUNING): number =>
  CALENDAR_DAY / deploysPerDay(game, tuning) / tuning.calendarPace

/** The chance one deploy ships a bug (11 "Bad deploy"). */
export const badDeployChance = (game: Game, tuning: Tuning = LIVE_TUNING): number => {
  const team = game.teams[0]
  const policy = team ? policyNow(game, team, tuning) : POLICIES.balanced
  return (
    (BAD_DEPLOY_BASE[game.stage] ?? BAD_DEPLOY_BASE.at(-1) ?? 0) *
    policy.badDeploy *
    (1 + 2 * serviceOf(game).debt) *
    (has(game, 'testing-culture') ? 1 - TESTS_FACTOR : 1) *
    (has(game, 'code-review') ? 1 - CODE_REVIEW_FACTOR : 1)
  )
}

/** Share of App Server requests a bad deploy fails: bigger deploys break more. */
export const badDeployShare = (game: Game): number =>
  Math.min(BAD_DEPLOY_MAX, BAD_DEPLOY_ERRORS * Math.max(1, serviceOf(game).lastDeploy.length))

/* ---------- the backlog ---------- */

/** Adds an item to the backlog: at the end, or at the top. */
export const enqueue = (
  game: Game,
  kind: WorkItem['kind'],
  ref: string,
  cost: number,
  top = false,
  extra: Pick<WorkItem, 'due' | 'target'> = {},
): Game => {
  const item: WorkItem = { id: game.workSeq + 1, kind, ref, cost, spent: 0, ...extra }
  return {
    ...game,
    workSeq: game.workSeq + 1,
    backlog: top ? [item, ...game.backlog] : [...game.backlog, item],
  }
}
