import {
  CHAOS_FROM_STAGE,
  CHAOS_WEIGHT,
  COMPONENTS,
  ERAS,
  HN_WEIGHT,
  HOME_REGION,
  MONOLITH_DEBT,
  MONOLITH_KLOC,
  MUTATORS,
  MUTATOR_BANS,
  OPEN_ACTION_WEIGHT,
  PERKS,
  RESEARCH,
  RUNTIMES,
  SLO_LEVELS,
  VENTURES,
  type ComponentId,
  type IncidentId,
  type LanguageId,
  type MutatorId,
  type PerkId,
  type ResearchId,
  type RuntimeId,
  type VentureDef,
} from './catalog.ts'
import { newGame, preseedGame } from './company.ts'
import type { Founding, Game, Region } from './state.ts'

/* ==========================================================================
   What a Company's founding changes (13): perk levels, the Venture, and the
   Mutators. Every rule reads `game.founding`. A Sandbox ignores all of it.
   ========================================================================== */

/** The level of a perk the Company was founded with. 0 in a Sandbox. */
export const perkLevel = (game: Game, id: PerkId): number =>
  game.sandbox ? 0 : Math.min(PERKS[id].costs.length, game.founding.perks[id] ?? 0)

export const ventureOf = (game: Game): VentureDef =>
  game.sandbox ? VENTURES['b2b-saas'] : VENTURES[game.founding.venture]

export const hasMutator = (game: Game, id: MutatorId): boolean =>
  !game.sandbox && game.founding.mutators.includes(id)

/** The Legacy multiplier of a founding: the Venture's, times one plus every Mutator's share. */
export const legacyMultiplier = (founding: Founding): number =>
  VENTURES[founding.venture].legacy *
  (1 + founding.mutators.reduce((sum, id) => sum + MUTATORS[id].legacy, 0))

/* ---------- perks ---------- */

/** Starting Cash: ×2 per Angel network level. */
export const angelFactor = (level: number): number => {
  let factor = 1
  for (let index = 0; index < level; index += 1) factor *= 2
  return factor
}

export const insightPerk = (game: Game): number => 1 + 0.2 * perkLevel(game, 'pattern-recognition')
export const growthPerk = (game: Game): number => 1 + 0.1 * perkLevel(game, 'founders-reputation')

/** Equity a round costs: the Era's dilution less 2 points per Better terms level. */
export const dilutionOf = (game: Game, dilution: number): number =>
  Math.max(0, dilution - 0.02 * perkLevel(game, 'better-terms'))

/** Cash a round pays: Tight budget halves it. */
export const grantOf = (game: Game, grant: number): number =>
  hasMutator(game, 'tight-budget') ? grant / 2 : grant

/** How much an open action item multiplies its incident's weight: War stories halves the excess. */
export const openActionWeight = (game: Game): number => {
  let excess = OPEN_ACTION_WEIGHT - 1
  for (let level = 0; level < perkLevel(game, 'war-stories'); level += 1) excess /= 2
  return 1 + excess
}

/** What the Mutators do to an incident's weight. */
export const mutatorWeight = (game: Game, kind: IncidentId): number =>
  (kind === 'spike' && hasMutator(game, 'hn-front-page') ? HN_WEIGHT : 1) *
  (kind === 'instance' && hasMutator(game, 'chaos-monkey') && game.stage >= CHAOS_FROM_STAGE
    ? CHAOS_WEIGHT
    : 1)

/* ---------- Mutator rules ---------- */

/** The language Single language holds every App Server to: the Garage's. */
export const FOUNDING_LANGUAGE: LanguageId = 'php'

/** Why a Mutator refuses to place a Component here, or null. */
export const placeRefusal = (game: Game, type: ComponentId, region: Region): string | null => {
  for (const id of game.founding.mutators) {
    if (game.sandbox) break
    if (MUTATOR_BANS[id]?.includes(type))
      return `${MUTATORS[id].name}: no ${COMPONENTS[type].name}.`
  }
  if (region !== HOME_REGION && hasMutator(game, 'one-region'))
    return `${MUTATORS['one-region'].name}: the home region only.`
  return null
}

/** Why a Mutator refuses a runtime, or null. */
export const runtimeRefusal = (game: Game, runtime: RuntimeId): string | null =>
  hasMutator(game, 'single-language') && RUNTIMES[runtime].language !== FOUNDING_LANGUAGE
    ? `${MUTATORS['single-language'].name}: every App Server runs PHP.`
    : null

/** Strict SLO: the Era's target moves to the next level up. */
export const sloOf = (game: Game, slo: number): number => {
  if (!hasMutator(game, 'strict-slo')) return slo
  return SLO_LEVELS.find((level) => level > slo) ?? slo
}

/* ---------- founding a Company ---------- */

/**
 * A new Company for a founding: the Garage, or Pre-seed with Head start. It
 * starts with the perks' Cash and engineers, the research the Founder kept,
 * and the Legacy monolith's codebase.
 */
export const foundCompany = (
  seed: number,
  founding: Founding,
  keep: ReadonlyArray<ResearchId> = [],
): Game => {
  const start = (founding.perks['head-start'] ?? 0) >= 1 ? preseedGame(seed) : newGame(seed)
  const founded: Game = { ...start, founding }
  const kept = keep.filter((id) => RESEARCH[id] && !founded.researched.includes(id))
  const monolith = founding.mutators.includes('legacy-monolith')
  const service = founded.services[0]
  const alumni = founded.stage >= 1 ? perkLevel(founded, 'alumni-network') : 0
  return {
    ...founded,
    cash: founded.cash * angelFactor(perkLevel(founded, 'angel-network')),
    researched: [...founded.researched, ...kept],
    equity: VENTURES[founding.venture].bootstrapped ? 1 : founded.equity,
    services:
      monolith && service
        ? [
            { ...service, codebase: MONOLITH_KLOC, debt: MONOLITH_DEBT },
            ...founded.services.slice(1),
          ]
        : founded.services,
    engineers: [...founded.engineers, ...alumniOf(founded, alumni)],
    workSeq: founded.workSeq + alumni,
  }
}

/** Alumni join ramped, on the first team, hired for the Service's language. */
export const alumniOf = (game: Game, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `e${game.workSeq + index + 1}`,
    team: game.teams[0]?.id ?? 'core',
    language: FOUNDING_LANGUAGE,
    hiredAt: Number.MIN_SAFE_INTEGER,
  }))

/** The Era a founding starts in. */
export const startEra = (founding: Founding): string =>
  ERAS[(founding.perks['head-start'] ?? 0) >= 1 ? 1 : 0]?.name ?? ''
