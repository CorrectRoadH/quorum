/* Ventures and Mutators (13 "Ventures", "Mutators"). */

import type { ComponentId } from './components.ts'
import type { RequestKind } from './kinds.ts'

export const VENTURE_IDS = [
  'b2b-saas',
  'consumer-social',
  'fintech',
  'streaming',
  'game-backend',
  'ai-startup',
  'e-commerce',
  'bootstrapped',
] as const
export type VentureId = (typeof VENTURE_IDS)[number]

export type VentureDef = Readonly<{
  id: VentureId
  name: string
  /** Legacy to unlock it; 0 for the default. Bootstrapped indie opens with the first Exit. */
  cost: number
  /** The daily peak, in calendar hours, and how far demand swings around the mean. */
  peak: number
  amplitude: number
  /** Saturday and Sunday demand. */
  weekend: number
  /** Multiplies a kind's share of the mix, where the Era has it. */
  mix: Partial<Record<RequestKind, number>>
  /** Multiplies what every request earns, and the market. */
  value: number
  market: number
  /** No funding rounds: Equity stays 100%, and declining costs no growth. */
  bootstrapped: boolean
  legacy: number
  /** The shape and rule, in one line. */
  summary: string
}>

const venture = (
  entry: Pick<VentureDef, 'id' | 'name' | 'cost' | 'legacy' | 'summary'> & Partial<VentureDef>,
): VentureDef => ({
  peak: 20,
  amplitude: 0.45,
  weekend: 1,
  mix: {},
  value: 1,
  market: 1,
  bootstrapped: false,
  ...entry,
})

export const VENTURES: Record<VentureId, VentureDef> = {
  // The slice's balance was tuned on this curve; the GDD's office hours wait for a re-tune.
  'b2b-saas': venture({
    id: 'b2b-saas',
    name: 'B2B SaaS',
    cost: 0,
    legacy: 1,
    summary: 'Evening peak',
  }),
  'consumer-social': venture({
    id: 'consumer-social',
    name: 'Consumer social',
    cost: 5,
    weekend: 1.15,
    mix: { media: 1.5 },
    value: 0.5,
    market: 2,
    legacy: 1.1,
    summary: 'Twice the users, half the value each; media +50%',
  }),
  fintech: venture({
    id: 'fintech',
    name: 'Fintech',
    cost: 10,
    peak: 14,
    amplitude: 0.6,
    weekend: 0.4,
    mix: { buy: 4, write: 1.5 },
    legacy: 1.3,
    summary: 'Business hours; buy ×4, write +50%',
  }),
  streaming: venture({
    id: 'streaming',
    name: 'Streaming media',
    cost: 10,
    peak: 21,
    amplitude: 0.55,
    mix: { media: 4 },
    legacy: 1.2,
    summary: 'Late evening peak; media ×4',
  }),
  'game-backend': venture({
    id: 'game-backend',
    name: 'Game backend',
    cost: 15,
    peak: 21,
    mix: { rt: 4 },
    legacy: 1.3,
    summary: 'Evening peak; realtime ×4',
  }),
  'ai-startup': venture({
    id: 'ai-startup',
    name: 'AI startup',
    cost: 15,
    amplitude: 0.1,
    mix: { ai: 3 },
    legacy: 1.3,
    summary: 'Flat demand; AI ×3',
  }),
  'e-commerce': venture({
    id: 'e-commerce',
    name: 'E-commerce',
    cost: 20,
    mix: { buy: 2, search: 2 },
    legacy: 1.2,
    summary: 'Buy ×2, search ×2',
  }),
  bootstrapped: venture({
    id: 'bootstrapped',
    name: 'Bootstrapped indie',
    cost: 0,
    bootstrapped: true,
    legacy: 1.4,
    summary: 'No funding rounds; Equity stays 100%',
  }),
}

export const MUTATOR_IDS = [
  'chaos-monkey',
  'hn-front-page',
  'legacy-monolith',
  'one-region',
  'no-caches',
  'tight-budget',
  'single-language',
  'postgres',
  'strict-slo',
] as const
export type MutatorId = (typeof MUTATOR_IDS)[number]

export type MutatorDef = Readonly<{
  id: MutatorId
  name: string
  rule: string
  /** Added to the Legacy multiplier. */
  legacy: number
}>

export const MUTATORS: Record<MutatorId, MutatorDef> = {
  'chaos-monkey': {
    id: 'chaos-monkey',
    name: 'Chaos Monkey',
    rule: 'Instance failures dominate from Seed',
    legacy: 0.25,
  },
  'hn-front-page': {
    id: 'hn-front-page',
    name: 'Hacker News front page',
    rule: 'Traffic spikes three times as often',
    legacy: 0.15,
  },
  'legacy-monolith': {
    id: 'legacy-monolith',
    name: 'Legacy monolith',
    rule: 'Large PHP codebase: migrations ×3, debt starts at 40%',
    legacy: 0.2,
  },
  'one-region': {
    id: 'one-region',
    name: 'One region forever',
    rule: 'No Nodes outside the home region',
    legacy: 0.2,
  },
  'no-caches': { id: 'no-caches', name: 'No caches', rule: 'No Cache, no CDN', legacy: 0.4 },
  'tight-budget': {
    id: 'tight-budget',
    name: 'Tight budget',
    rule: 'Funding grants halved',
    legacy: 0.2,
  },
  'single-language': {
    id: 'single-language',
    name: 'Single language',
    rule: 'Every App Server runs PHP',
    legacy: 0.15,
  },
  postgres: {
    id: 'postgres',
    name: 'Postgres for everything',
    rule: 'No Cache, wide-column, consensus or warehouse stores',
    legacy: 0.3,
  },
  'strict-slo': {
    id: 'strict-slo',
    name: 'Strict SLO',
    rule: 'The SLO is one level higher',
    legacy: 0.2,
  },
}

/** What each Mutator refuses to place. */
export const MUTATOR_BANS: Partial<Record<MutatorId, ReadonlyArray<ComponentId>>> = {
  'no-caches': ['cache', 'cdn'],
  postgres: ['cache', 'wide', 'dsql', 'warehouse'],
}

/** Legacy monolith: thousands of lines at founding, migration cost, and starting debt. */
export const MONOLITH_KLOC = 40
export const MONOLITH_MIGRATION = 3
export const MONOLITH_DEBT = 0.4
/** Chaos Monkey's weight on instance failures, from Seed. */
export const CHAOS_WEIGHT = 4
export const CHAOS_FROM_STAGE = 2
/** Hacker News front page: spike weight. */
export const HN_WEIGHT = 3
/** SLO levels: Strict SLO moves each Era's target to the next one up. */
export const SLO_LEVELS: ReadonlyArray<number> = [0.99, 0.995, 0.999, 0.9995, 0.9999, 0.99999]
