/* Exits and the Legacy shop (13 "Exit and Legacy"). */

export const EXIT_IDS = ['acqui-hire', 'acquisition', 'ipo', 'step-down'] as const
export type ExitId = (typeof EXIT_IDS)[number]

export type ExitDef = Readonly<{
  id: ExitId
  name: string
  /** The first Era it is offered in. The IPO is the Pre-IPO round itself. */
  stage: number
  /** The valuation it pays on, at most. */
  cap: number
  multiplier: number
  /** The Company goes on after it: the IPO lists, and the Public Era follows. */
  continues: boolean
}>

export const EXITS: Record<ExitId, ExitDef> = {
  'acqui-hire': {
    id: 'acqui-hire',
    name: 'Acqui-hire',
    stage: 3,
    cap: 50_000_000,
    multiplier: 0.5,
    continues: false,
  },
  acquisition: {
    id: 'acquisition',
    name: 'Acquisition',
    stage: 4,
    cap: Number.POSITIVE_INFINITY,
    multiplier: 1,
    continues: false,
  },
  ipo: {
    id: 'ipo',
    name: 'IPO',
    stage: 6,
    cap: Number.POSITIVE_INFINITY,
    multiplier: 1.5,
    continues: true,
  },
  'step-down': {
    id: 'step-down',
    name: 'Step down',
    stage: 7,
    cap: Number.POSITIVE_INFINITY,
    multiplier: 1.5,
    continues: false,
  },
}

/** Step down adds this to its multiplier per quarter in the beat streak, up to the cap. */
export const STREAK_BONUS = 0.1
export const STREAK_BONUS_CAP = 1

export const PERK_IDS = [
  'angel-network',
  'alumni-network',
  'institutional-knowledge',
  'pattern-recognition',
  'founders-reputation',
  'better-terms',
  'night-shift',
  'time-dilation',
  'playbooks',
  'war-stories',
  'head-start',
] as const
export type PerkId = (typeof PERK_IDS)[number]

export type PerkDef = Readonly<{
  id: PerkId
  name: string
  /** Legacy per level; the length is the number of levels. */
  costs: ReadonlyArray<number>
  effect: string
}>

const doubling = (first: number, levels: number): ReadonlyArray<number> => {
  const costs: Array<number> = []
  let cost = first
  for (let level = 0; level < levels; level += 1) {
    costs.push(cost)
    cost *= 2
  }
  return costs
}

const tripling = (first: number, levels: number): ReadonlyArray<number> => {
  const costs: Array<number> = []
  let cost = first
  for (let level = 0; level < levels; level += 1) {
    costs.push(cost)
    cost *= 3
  }
  return costs
}

export const PERKS: Record<PerkId, PerkDef> = {
  'angel-network': {
    id: 'angel-network',
    name: 'Angel network',
    costs: doubling(2, 5),
    effect: 'Starting Cash ×2',
  },
  'alumni-network': {
    id: 'alumni-network',
    name: 'Alumni network',
    costs: doubling(3, 5),
    effect: '+1 engineer at Pre-seed',
  },
  'institutional-knowledge': {
    id: 'institutional-knowledge',
    name: 'Institutional knowledge',
    costs: Array.from({ length: 10 }, () => 5),
    effect: 'Keep 1 research through an Exit',
  },
  'pattern-recognition': {
    id: 'pattern-recognition',
    name: 'Pattern recognition',
    costs: doubling(4, 5),
    effect: 'Insight +20%',
  },
  'founders-reputation': {
    id: 'founders-reputation',
    name: 'Founder’s reputation',
    costs: doubling(4, 5),
    effect: 'User growth +10%',
  },
  'better-terms': {
    id: 'better-terms',
    name: 'Better terms',
    costs: doubling(6, 5),
    effect: 'Dilution per round −2 points',
  },
  'night-shift': {
    id: 'night-shift',
    name: 'Night shift',
    costs: tripling(5, 3),
    effect: 'Offline cap 12 h, 18 h, 24 h',
  },
  'time-dilation': {
    id: 'time-dilation',
    name: 'Time dilation',
    costs: [20, 80],
    effect: 'Unlocks 20×, then 40× speed',
  },
  playbooks: {
    id: 'playbooks',
    name: 'Playbooks',
    costs: tripling(5, 4),
    effect: 'Playbook slots 2, 5, 10, 25',
  },
  'war-stories': {
    id: 'war-stories',
    name: 'War stories',
    costs: tripling(8, 3),
    effect: 'Open action items raise odds half as much',
  },
  // Levels 2 and 3 (Seed and Series A starts) need starter designs for those Eras.
  'head-start': {
    id: 'head-start',
    name: 'Head start',
    costs: [25],
    effect: 'Start in Pre-seed',
  },
}

/** Playbook slots by perk level. Level 0 keeps one, so the first Company can try them. */
export const PLAYBOOK_SLOTS: ReadonlyArray<number> = [1, 2, 5, 10, 25]
/** Offline cap in sim seconds by Night shift level (04 "Offline progress"). */
export const OFFLINE_CAP: ReadonlyArray<number> = [8 * 3_600, 12 * 3_600, 18 * 3_600, 24 * 3_600]
/** Extra Company speeds by Time dilation level. */
export const DILATION_SPEEDS: ReadonlyArray<ReadonlyArray<number>> = [[], [20], [20, 40]]
