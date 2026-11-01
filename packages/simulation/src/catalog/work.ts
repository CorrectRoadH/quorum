/* What Dev Hours build: Features for the product, and Engineering tasks for the system (08). */

import type { RequestKind } from './kinds.ts'
import type { ResearchId } from './research.ts'

export const FEATURE_IDS = [
  'landing-page',
  'signup-flow',
  'pagination',
  'password-login',
  'paid-plans',
  'email-digests',
] as const
export type FeatureId = (typeof FEATURE_IDS)[number]

export type FeatureDef = Readonly<{
  id: FeatureId
  name: string
  /** The first Era it can be built in. */
  era: number
  dh: number
  requires: ReadonlyArray<FeatureId>
  /** Multiplies the Era's market. */
  market: number
  /** Multiplies user growth and churn. */
  growth: number
  churn: number
  /** Multiplies the demand for a kind. */
  load: Partial<Record<RequestKind, number>>
  /** Multiplies what a request earns. */
  value: Partial<Record<RequestKind, number>>
  /** Multiplies the response size of a kind. */
  payload: Partial<Record<RequestKind, number>>
  /**
   * A kind users send once this ships. Gated: no user sends it before, even
   * where the Era's mix has it. Otherwise it arrives before its Era at `share`.
   */
  unlocks: Readonly<{ kind: RequestKind; share: number; gated: boolean }> | null
  /** Unindexed query shapes it ships: Slow query grows likelier until an index covers them. */
  shapes: number
  /** Adds subscription revenue per paying user. */
  subscription: boolean
  /** The effect, in one line. */
  effect: string
  /** The hidden cost, which Code review shows before it ships. */
  hidden: string | null
}>

const feature = (
  entry: Pick<FeatureDef, 'id' | 'name' | 'era' | 'dh' | 'effect'> & Partial<FeatureDef>,
): FeatureDef => ({
  requires: [],
  market: 1,
  growth: 1,
  churn: 1,
  load: {},
  value: {},
  payload: {},
  unlocks: null,
  shapes: 0,
  subscription: false,
  hidden: null,
  ...entry,
})

export const FEATURES: Record<FeatureId, FeatureDef> = {
  'landing-page': feature({
    id: 'landing-page',
    name: 'Landing page',
    era: 0,
    dh: 8,
    market: 1.2,
    load: { page: 1.1 },
    effect: 'Market +20%, page views +10%',
  }),
  'signup-flow': feature({
    id: 'signup-flow',
    name: 'Signup flow',
    era: 0,
    dh: 12,
    growth: 1.15,
    unlocks: { kind: 'write', share: 0.05, gated: false },
    effect: 'Growth +15%, writes arrive early',
  }),
  pagination: feature({
    id: 'pagination',
    name: 'Pagination',
    era: 0,
    dh: 6,
    payload: { read: 0.5 },
    shapes: 1,
    effect: 'API reads send half the bytes',
    hidden: 'Adds a query shape with no index',
  }),
  'password-login': feature({
    id: 'password-login',
    name: 'Password login',
    era: 1,
    dh: 15,
    unlocks: { kind: 'login', share: 0.05, gated: true },
    effect: 'Logins arrive: 80 ms of CPU each',
  }),
  'paid-plans': feature({
    id: 'paid-plans',
    name: 'Paid plans',
    era: 1,
    dh: 25,
    requires: ['password-login'],
    value: { write: 1.3 },
    subscription: true,
    effect: 'Writes earn 30% more, plus subscriptions',
  }),
  'email-digests': feature({
    id: 'email-digests',
    name: 'Email digests',
    era: 1,
    dh: 20,
    churn: 0.9,
    effect: 'Churn −10%',
  }),
}

export const TASK_IDS = [
  'add-index',
  'eager-loading',
  'fix-leak',
  'session-state',
  'refactor',
  'fix-bugs',
] as const
export type TaskId = (typeof TASK_IDS)[number]

export type TaskDef = Readonly<{
  id: TaskId
  name: string
  /** Dev Hours. Fix bugs takes its size from the migration. */
  dh: number
  /** Research the player needs to know the task exists. */
  research: ResearchId | null
  effect: string
  /** Queued by the game, not offered in the Add work menu. */
  internal: boolean
}>

export const TASKS: Record<TaskId, TaskDef> = {
  'add-index': {
    id: 'add-index',
    name: 'Add index',
    dh: 4,
    research: 'query-analysis',
    effect: 'Ends a Slow query and covers one query shape',
    internal: false,
  },
  'eager-loading': {
    id: 'eager-loading',
    name: 'Eager loading',
    dh: 10,
    research: 'eager-loading',
    effect: 'ORM frameworks stop sending N+1 queries',
    internal: false,
  },
  'fix-leak': {
    id: 'fix-leak',
    name: 'Fix memory leak',
    dh: 15,
    research: null,
    effect: 'No leaks until the next Feature ships',
    internal: false,
  },
  'session-state': {
    id: 'session-state',
    name: 'Drop session state',
    dh: 8,
    research: 'pooling',
    effect: 'Transaction pooling stops breaking queries',
    internal: false,
  },
  refactor: {
    id: 'refactor',
    name: 'Refactor',
    dh: 10,
    research: null,
    effect: 'Tech debt −20 points',
    internal: false,
  },
  'fix-bugs': {
    id: 'fix-bugs',
    name: 'Fix migration bugs',
    dh: 1,
    research: null,
    effect: 'The new Stack stops failing requests',
    internal: true,
  },
}

/** Fixes a task leaves on the service. Refactor and Fix bugs act once instead. */
export const FIXES = ['eager-loading', 'fix-leak', 'session-state'] as const
export type FixId = (typeof FIXES)[number]
