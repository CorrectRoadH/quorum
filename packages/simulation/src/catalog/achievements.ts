/* Achievements (14 "Achievements"): knowledge, unusual builds, and real engineering moments, never hours played. */

import type { MutatorId, VentureId } from './ventures.ts'

export const ACHIEVEMENT_IDS = [
  'hello-world',
  'works-on-my-machine',
  'split-brain',
  'averages-lie',
  'metastable',
  'strangler',
  'polyglot',
  'zero-gc',
  'no-cache',
  'postgres-for-everything',
  'hug-of-death',
  'chaos-monkey',
  'blameless',
  'nines',
  'monoglot',
  'default-alive',
  'unicorn',
  'decacorn',
  'rule-of-40',
  'beat-and-raise',
  'serial-founder',
  'histogram',
  'pareto',
] as const
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

export type AchievementDef = Readonly<{
  id: AchievementId
  name: string
  condition: string
  unlocks?: Readonly<{ venture?: VentureId; mutator?: MutatorId }>
}>

const achievement = (def: AchievementDef): AchievementDef => def

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  'hello-world': achievement({
    id: 'hello-world',
    name: 'Hello, World',
    condition: 'Serve the first request',
  }),
  'works-on-my-machine': achievement({
    id: 'works-on-my-machine',
    name: 'It Works on My Machine',
    condition: 'Ship a bad deploy',
  }),
  'split-brain': achievement({
    id: 'split-brain',
    name: 'Split Brain',
    condition: 'Split the database onto its own Node',
  }),
  'averages-lie': achievement({
    id: 'averages-lie',
    name: 'Averages Lie',
    condition: 'Research percentiles while p99 is more than 5× the mean',
  }),
  metastable: achievement({
    id: 'metastable',
    name: 'Metastable',
    condition: 'Recover from a retry storm',
  }),
  strangler: achievement({
    id: 'strangler',
    name: 'Strangler',
    condition: 'Finish a migration in four traffic steps with errors under 1%',
  }),
  polyglot: achievement({
    id: 'polyglot',
    name: 'Polyglot',
    condition: 'Run five languages in production at once',
  }),
  'zero-gc': achievement({
    id: 'zero-gc',
    name: 'Zero GC',
    condition: 'Run a Rust service at 100,000 rps',
  }),
  'no-cache': achievement({
    id: 'no-cache',
    name: 'No Cache',
    condition: 'Reach Series A with no Cache and no CDN',
    unlocks: { mutator: 'no-caches' },
  }),
  'postgres-for-everything': achievement({
    id: 'postgres-for-everything',
    name: 'Postgres for Everything',
    condition: 'Reach Series B with only Postgres data Components',
    unlocks: { mutator: 'postgres' },
  }),
  'hug-of-death': achievement({
    id: 'hug-of-death',
    name: 'Hug of Death',
    condition: 'Survive a ×10 spike with no lost users',
    unlocks: { mutator: 'hn-front-page' },
  }),
  'chaos-monkey': achievement({
    id: 'chaos-monkey',
    name: 'Chaos Monkey',
    condition: 'Survive 100 random terminations',
    unlocks: { mutator: 'chaos-monkey' },
  }),
  blameless: achievement({
    id: 'blameless',
    name: 'Blameless',
    condition: 'Write 50 postmortems',
  }),
  nines: achievement({
    id: 'nines',
    name: 'Nines',
    condition: 'Hold 99.99% for a calendar week',
    unlocks: { mutator: 'strict-slo' },
  }),
  monoglot: achievement({
    id: 'monoglot',
    name: 'Monoglot',
    condition: 'Reach IPO with one language',
    unlocks: { mutator: 'single-language' },
  }),
  'default-alive': achievement({
    id: 'default-alive',
    name: 'Default Alive',
    condition: 'Reach IPO without raising any round',
    unlocks: { venture: 'bootstrapped' },
  }),
  unicorn: achievement({
    id: 'unicorn',
    name: 'Unicorn',
    condition: 'Reach a $1 billion valuation',
  }),
  decacorn: achievement({
    id: 'decacorn',
    name: 'Decacorn',
    condition: 'Reach a $10 billion valuation',
  }),
  'rule-of-40': achievement({
    id: 'rule-of-40',
    name: 'Rule of 40',
    condition: 'Reach a Rule of 40 score of 80 as a public company',
  }),
  'beat-and-raise': achievement({
    id: 'beat-and-raise',
    name: 'Beat and Raise',
    condition: 'Beat guidance eight quarters in a row',
  }),
  'serial-founder': achievement({
    id: 'serial-founder',
    name: 'Serial Founder',
    condition: 'Exit with every Venture',
  }),
  histogram: achievement({
    id: 'histogram',
    name: 'Histogram',
    condition: 'Reach the 90th percentile on any axis of any Challenge',
  }),
  pareto: achievement({
    id: 'pareto',
    name: 'Pareto',
    condition: 'Reach the 70th percentile on all three axes of one Challenge',
  }),
}

/** Mutators no achievement in 14 unlocks: the first Exit opens them. */
export const EXIT_MUTATORS: ReadonlyArray<MutatorId> = [
  'legacy-monolith',
  'one-region',
  'tight-budget',
]
