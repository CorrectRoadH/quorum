/* What Dev Hours build: Features for the product, and Engineering tasks for the system (08). */

import type { BackendKind, RequestKind } from './kinds.ts'
import type { ResearchId } from './research.ts'

export const FEATURE_IDS = [
  'landing-page',
  'signup-flow',
  'pagination',
  'password-login',
  'paid-plans',
  'email-digests',
  'search-filters',
  'profile-photos',
  'public-api',
  'infinite-scroll',
  'video',
  'chat',
  'checkout',
  'notifications-center',
  'mobile-app',
  'data-export',
  'dashboards',
  'ai-assistant',
  'recommendations',
  'audit-log',
] as const
export type FeatureId = (typeof FEATURE_IDS)[number]

export type FeatureDef = Readonly<{
  id: FeatureId
  name: string
  /** The first Era it can be built in. */
  era: number
  dh: number
  requires: ReadonlyArray<FeatureId>
  /** Research the Company needs before it can build it. */
  research: ResearchId | null
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
  /** Multiplies what one query of a backend kind costs the Node that answers it. */
  queries: Partial<Record<BackendKind, number>>
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
  research: null,
  market: 1,
  growth: 1,
  churn: 1,
  load: {},
  value: {},
  payload: {},
  queries: {},
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
  'search-filters': feature({
    id: 'search-filters',
    name: 'Search filters',
    era: 2,
    dh: 30,
    value: { search: 1.25 },
    queries: { 'q-search': 1.4 },
    effect: 'Searches earn 25% more',
    hidden: 'Each search query costs 40% more',
  }),
  'profile-photos': feature({
    id: 'profile-photos',
    name: 'Profile photos',
    era: 2,
    dh: 25,
    growth: 1.1,
    unlocks: { kind: 'upload', share: 0.04, gated: true },
    effect: 'Growth +10%, uploads arrive: 120 ms of CPU each',
  }),
  'public-api': feature({
    id: 'public-api',
    name: 'Public API',
    era: 2,
    dh: 40,
    market: 1.25,
    load: { read: 1.3, bot: 1.5 },
    effect: 'Market +25%, API reads +30%',
    hidden: 'Bots +50%',
  }),
  'infinite-scroll': feature({
    id: 'infinite-scroll',
    name: 'Infinite scroll',
    era: 2,
    dh: 20,
    value: { read: 1.1 },
    load: { read: 1.4 },
    effect: 'API reads earn 10% more, and users send 40% more',
  }),
  video: feature({
    id: 'video',
    name: 'Video',
    era: 3,
    dh: 60,
    market: 1.4,
    unlocks: { kind: 'media', share: 0.1, gated: true },
    effect: 'Market +40%, video arrives: 5 MB each',
  }),
  chat: feature({
    id: 'chat',
    name: 'Chat',
    era: 3,
    dh: 70,
    churn: 0.8,
    unlocks: { kind: 'rt', share: 0.08, gated: true },
    effect: 'Churn −20%, realtime messages hold connections open',
  }),
  checkout: feature({
    id: 'checkout',
    name: 'Checkout',
    era: 3,
    dh: 80,
    research: 'checkout',
    unlocks: { kind: 'buy', share: 0.03, gated: true },
    effect: 'Checkouts arrive: $25 each, through the Payment Provider',
  }),
  'notifications-center': feature({
    id: 'notifications-center',
    name: 'Notifications center',
    era: 3,
    dh: 35,
    requires: ['chat'],
    growth: 1.1,
    load: { rt: 1.2 },
    effect: 'Growth +10%, realtime +20%',
  }),
  'mobile-app': feature({
    id: 'mobile-app',
    name: 'Mobile app',
    era: 3,
    dh: 120,
    market: 1.6,
    load: { read: 1.5 },
    effect: 'Market +60%, API reads +50%',
  }),
  'data-export': feature({
    id: 'data-export',
    name: 'Data export',
    era: 4,
    dh: 40,
    value: { write: 1.2 },
    unlocks: { kind: 'job', share: 0.02, gated: true },
    effect: 'Writes earn 20% more. Exports arrive: 400 ms of CPU and 50 reads each',
  }),
  dashboards: feature({
    id: 'dashboards',
    name: 'Dashboards',
    era: 4,
    dh: 60,
    market: 1.1,
    unlocks: { kind: 'report', share: 0.03, gated: true },
    effect: 'Market +10%. Reports arrive: a table scan each',
  }),
  'ai-assistant': feature({
    id: 'ai-assistant',
    name: 'AI assistant',
    era: 4,
    dh: 100,
    unlocks: { kind: 'ai', share: 0.05, gated: true },
    effect: 'AI prompts arrive: $8 each, served by a GPU Node or the LLM API',
  }),
  recommendations: feature({
    id: 'recommendations',
    name: 'Recommendations',
    era: 4,
    dh: 90,
    requires: ['data-export'],
    load: { media: 1.3, job: 1.3 },
    effect: 'Video +30%',
    hidden: 'Exports +30%: the model trains in batch',
  }),
  'audit-log': feature({
    id: 'audit-log',
    name: 'Audit log',
    era: 4,
    dh: 50,
    market: 1.1,
    queries: { 'q-write': 1.2 },
    effect: 'Market +10%: enterprises can buy',
    hidden: 'Each write query costs 20% more',
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
