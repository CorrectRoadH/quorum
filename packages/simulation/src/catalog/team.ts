/* The Team (08): engineers, policies, pay, deploys, and migrations. */

/** Sim seconds in a calendar day: one sim second is one calendar minute. */
export const CALENDAR_DAY = 1_440

/** Dev Hours one engineer makes in a calendar day: one per hour of an 8-hour workday (08). */
export const DEV_HOURS_PER_DAY = 8

/** The founder produces this share of an engineer's Dev Hours: they also run the company. */
export const FOUNDER_OUTPUT = 0.8

export const POLICY_IDS = ['move-fast', 'balanced', 'quality'] as const
export type PolicyId = (typeof POLICY_IDS)[number]

export type PolicyDef = Readonly<{
  id: PolicyId
  label: string
  velocity: number
  /** Tech debt each shipped Feature adds. */
  debt: number
  /** Multiplies the bad-deploy chance. */
  badDeploy: number
  /** Most deploys in one calendar day. */
  deploysPerDay: number
  /** Share of the team's Dev Hours that pays down debt on its own. */
  paydown: number
}>

export const POLICIES: Record<PolicyId, PolicyDef> = {
  'move-fast': {
    id: 'move-fast',
    label: 'Move fast',
    velocity: 1.3,
    debt: 0.06,
    badDeploy: 1.5,
    deploysPerDay: 16,
    paydown: 0,
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced',
    velocity: 1,
    debt: 0.03,
    badDeploy: 1,
    deploysPerDay: 8,
    paydown: 0,
  },
  quality: {
    id: 'quality',
    label: 'Quality',
    velocity: 0.8,
    debt: 0.01,
    badDeploy: 0.5,
    deploysPerDay: 4,
    paydown: 0.1,
  },
}

/** Calendar days before a new policy takes over from the old one. */
export const POLICY_SWITCH_DAYS = 1

/* ---------- hiring and pay ---------- */

/** Dollars per second per engineer at salary index 1 (09 "Base prices"). */
export const SALARY_BASE = 0.4
/** Cash to sign an engineer in the Pre-seed Era, before the language's salary factor. */
export const SIGNING_BASE = 2_000
/** Calendar days to hire, before the language's time-to-hire factor. */
export const HIRE_DAYS = 1
/** A new hire produces this share for their first calendar week. */
export const RAMP_OUTPUT = 0.3
export const RAMP_DAYS = 7
/** A layoff costs the rest of the team this share of its velocity for a calendar week. */
export const LAYOFF_MORALE = 0.9
export const MORALE_DAYS = 7

/** Coordination (08): n / (1 + k(n − 1) + βn(n − 1)). */
export const COORDINATION = 0.08
/** A structured framework lowers k by this factor. */
export const STRUCTURED_COORDINATION = 0.7
export const RETROGRADE = 0.0004

/* ---------- codebases and tech debt ---------- */

/** Thousands of lines in the first codebase, and per Dev Hour of shipped Features. */
export const START_KLOC = 5
export const KLOC_PER_DH = 0.5
/** Debt a Refactor removes per Dev Hour. */
export const REFACTOR_PER_DH = 0.02
/** Debt a Feature adds to a codebase with no framework. */
export const UNSTRUCTURED_DEBT = 0.01
/** Debt a task adds when it ships during an incident: a hotfix. */
export const HOTFIX_DEBT = 0.02
/** A structured framework grows debt this much slower (06 Symfony). */
export const STRUCTURED_DEBT = 0.7

/* ---------- deploys ---------- */

/** Work hours in a calendar day, in minutes: deploys happen in them. */
export const WORK_MINUTES = 480
/** Minutes to deploy by hand, or through a pipeline after Continuous delivery. */
export const MANUAL_DEPLOY_MINUTES = 30
export const CI_DEPLOY_MINUTES = 5
/** Minutes to check a deploy. */
export const VERIFY_MINUTES = 15
/** Bad-deploy chance per deploy, per Era (11 "Bad deploy"). */
export const BAD_DEPLOY_BASE: ReadonlyArray<number> = [0, 0.1, 0.1]
/** Share of requests a bad deploy fails for each item it shipped, and at most. */
export const BAD_DEPLOY_ERRORS = 0.08
export const BAD_DEPLOY_MAX = 0.4
/** Automated tests and code review lower the bad-deploy chance. */
export const TESTS_FACTOR = 0.3
export const CODE_REVIEW_FACTOR = 0.2

/* ---------- migrations (08 "Migrations") ---------- */

/** The strangler steps: the share of traffic on the new Stack. */
export const MIGRATION_STEPS: ReadonlyArray<number> = [0.05, 0.25, 0.5, 1]
/** The share of a migration's Dev Hours each step needs. */
export const MIGRATION_TRANCHES: ReadonlyArray<number> = [0.1, 0.2, 0.3, 0.4]
export const MIGRATION_FACTORS = { variant: 0.1, framework: 0.5, language: 1 } as const
/** Requests on a new Stack fail this often until its bugs are fixed. */
export const MIGRATION_BUGS = 0.03
/** Fixing a step's bugs costs this share of its tranche, and at least 1 DH. */
export const FIX_BUGS_SHARE = 0.25
/** Features on a migrating service build at this speed. */
export const MIGRATION_FEATURE_SPEED = 0.5

/* ---------- pooler modes (07 "Connection Pooler") ---------- */

/** Pooled queries that fail in transaction mode while the code still uses session state. */
export const SESSION_STATE_CRASHES = 0.05

/* ---------- subscriptions (09 "Sources") ---------- */

/** Share of users on a paid plan, and what a plan pays per calendar day. */
export const PAYING_SHARE = 0.05
export const PLAN_PER_DAY = 24
