import {
  CALENDAR_DAY,
  FEATURES,
  FEATURE_IDS,
  PAYING_SHARE,
  PLAN_PER_DAY,
  type BackendKind,
  type FeatureDef,
  type RequestKind,
} from './catalog.ts'
import { ventureOf } from './founding.ts'
import { eraOf } from './lookups.ts'
import type { Game } from './state.ts'

/* ==========================================================================
   What shipped Features do to users, money, and load (08 "Features"). A
   Sandbox runs its Era's mix with no Feature effects, as it always has.
   ========================================================================== */

const shipped = (game: Game): ReadonlyArray<FeatureDef> =>
  game.sandbox ? [] : game.shipped.map((id) => FEATURES[id])

const product = (game: Game, of: (feature: FeatureDef) => number): number =>
  shipped(game).reduce((total, feature) => total * of(feature), 1)

/**
 * The share of demand each kind gets. A gated kind sends nothing until its
 * Feature ships, and the other shares grow to fill its place. An early kind
 * takes its share from the others. Load effects then add demand on top.
 */
export const mixOf = (game: Game): Partial<Record<RequestKind, number>> => {
  const era = eraOf(game).mix
  if (game.sandbox) return (game.scenario?.mix as Partial<Record<RequestKind, number>>) ?? era
  const shares: Partial<Record<RequestKind, number>> = { ...era }
  for (const id of FEATURE_IDS) {
    const unlocks = FEATURES[id].unlocks
    if (unlocks?.gated && !game.shipped.includes(id)) delete shares[unlocks.kind]
  }
  const total = Object.values(shares).reduce((sum, share) => sum + (share ?? 0), 0)
  for (const kind of Object.keys(shares) as Array<RequestKind>)
    shares[kind] = total > 0 ? (shares[kind] ?? 0) / total : 0
  for (const feature of shipped(game)) {
    const unlocks = feature.unlocks
    if (!unlocks || unlocks.gated || (shares[unlocks.kind] ?? 0) > 0) continue
    for (const kind of Object.keys(shares) as Array<RequestKind>)
      shares[kind] = (shares[kind] ?? 0) * (1 - unlocks.share)
    shares[unlocks.kind] = unlocks.share
  }
  for (const feature of shipped(game))
    for (const [kind, factor] of Object.entries(feature.load) as Array<[RequestKind, number]>)
      if (shares[kind] !== undefined) shares[kind] = (shares[kind] ?? 0) * factor
  return ventureMix(game, shares)
}

/** The Venture's mix changes, on the kinds the Era has, with the total kept. */
const ventureMix = (
  game: Game,
  shares: Partial<Record<RequestKind, number>>,
): Partial<Record<RequestKind, number>> => {
  const changes = Object.entries(ventureOf(game).mix) as Array<[RequestKind, number]>
  if (!changes.some(([kind]) => (shares[kind] ?? 0) > 0)) return shares
  const before = Object.values(shares).reduce((sum, share) => sum + (share ?? 0), 0)
  const next = { ...shares }
  for (const [kind, factor] of changes)
    if (next[kind] !== undefined) next[kind] = (next[kind] ?? 0) * factor
  const after = Object.values(next).reduce((sum, share) => sum + (share ?? 0), 0)
  for (const kind of Object.keys(next) as Array<RequestKind>)
    next[kind] = after > 0 ? ((next[kind] ?? 0) * before) / after : 0
  return next
}

/** Most users the market holds: the Era's, grown by Features. */
export const marketOf = (game: Game): number =>
  eraOf(game).market * product(game, (feature) => feature.market) * ventureOf(game).market

export const growthFactor = (game: Game): number => product(game, (feature) => feature.growth)
export const churnFactor = (game: Game): number => product(game, (feature) => feature.churn)

/** What a request of `kind` earns relative to its catalog value. */
export const valueFactor = (game: Game, kind: RequestKind): number =>
  product(game, (feature) => feature.value[kind] ?? 1) *
  ventureOf(game).value *
  (game.scenario?.value?.[kind] ?? 1)

/** How big a response of `kind` is relative to its profile. */
export const payloadFactor = (game: Game, kind: RequestKind): number =>
  product(game, (feature) => feature.payload[kind] ?? 1)

/** Dollars per second from paid plans: paying users times the plan, per calendar day. */
export const subscriptionsOf = (game: Game): number =>
  shipped(game).some((feature) => feature.subscription)
    ? (game.users * PAYING_SHARE * PLAN_PER_DAY) / CALENDAR_DAY
    : 0

/** What one query of a backend kind costs relative to its catalog cost. */
export const queryFactor = (game: Game, kind: BackendKind): number =>
  product(game, (feature) => feature.queries[kind] ?? 1)
