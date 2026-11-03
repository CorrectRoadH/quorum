import { cosTurns } from './calendar.ts'
import {
  CALENDAR_START,
  DIURNAL_AMPLITUDE,
  HOME_REGION,
  HTTP3_CUT,
  REGIONS,
  REGIONS_FROM_STAGE,
  REGION_INFO,
  SPREAD_REGIONS,
  USER_ROUND_TRIPS,
  rttOf,
  type ComponentId,
  type RegionId,
} from './catalog.ts'
import { has, zoneMs } from './lookups.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   Regions (05 "Zones and regions", docs/adr/0005-regions-are-tabs-over-one-design.md).
   One Design, one graph: every Node sits in a region, and the board shows one
   tab per open region. From Series C users live on four continents, each with
   its own share and its own evening peak. Without GeoDNS they all enter the
   home Users Node and the far ones pay the round trips; with GeoDNS each
   region's users go to their own Users Node, or the nearest one alive.
   ========================================================================== */

/** Managed and edge Components that serve every region from everywhere: no round trip to reach them. */
const GLOBAL: ReadonlyArray<ComponentId> = [
  'psp',
  'llm',
  'msgp',
  'auth',
  'cdn',
  'analytics',
  'payments',
]

export const isGlobal = (node: GameNode): boolean => GLOBAL.includes(node.type)

/** Users live in four regions from Series C; before, every user is at home. */
export const regional = (game: Game): boolean => game.stage >= REGIONS_FROM_STAGE

/** The home region, and every region the Company opened: each has its own Users Node. */
export const openRegions = (game: Game): ReadonlyArray<RegionId> =>
  REGIONS.filter(
    (region) =>
      region === HOME_REGION ||
      game.nodes.some((node) => node.type === 'users' && node.region === region),
  )

/** The Users Node of a region, if the region is open. */
export const usersOf = (game: Game, region: RegionId): GameNode | undefined =>
  game.nodes.find((node) => node.type === 'users' && node.region === region) ??
  (region === HOME_REGION ? game.nodes.find((node) => node.type === 'users') : undefined)

/** A region's daily cycle: its local 20:00 peak, read on the home calendar. Exact. */
export const regionDiurnal = (time: number, region: RegionId): number => {
  const minute = (CALENDAR_START + time + REGION_INFO[region].offset) % 1440
  return 1 + DIURNAL_AMPLITUDE * cosTurns((minute - 20 * 60) / 1440)
}

/** Demand relative to the mean across regions: the sum of each region's share times its cycle. */
export const regionalCycle = (time: number): number => {
  let sum = 0
  for (const region of REGIONS) sum += REGION_INFO[region].share * regionDiurnal(time, region)
  return sum
}

/** Each region's share of the demand right now. Sums to 1. */
export const regionShares = (game: Game): ReadonlyArray<readonly [RegionId, number]> => {
  if (!regional(game)) return [[HOME_REGION, 1]]
  const weights = REGIONS.map(
    (region) =>
      [
        region,
        REGION_INFO[region].share *
          (game.sandbox && !game.scenario?.daily ? 1 : regionDiurnal(game.time, region)),
      ] as const,
  )
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  return weights.map(([region, weight]) => [region, total > 0 ? weight / total : 0] as const)
}

/** The region a Region outage or the DR drill has taken down, if any. */
export const outRegion = (game: Game): RegionId | null =>
  (game.incident?.kind === 'region' || game.incident?.kind === 'dr-drill') &&
  game.incident.region !== null
    ? game.incident.region
    : null

/** Milliseconds a user hop pays to cross from one region to another: two round trips, less HTTP/3. */
export const userRttMs = (game: Game, from: RegionId, to: RegionId): number => {
  const rtt = rttOf(from, to) * USER_ROUND_TRIPS
  return rtt > 0 && has(game, 'http3') ? rtt * (1 - HTTP3_CUT) : rtt
}

export type UserRoute = Readonly<{
  /** Where these users live. */
  region: RegionId
  /** The Users Node they enter through. */
  source: GameNode | undefined
  /** Their share of the demand. */
  share: number
  /** Milliseconds their hop to the source adds. */
  extraMs: number
}>

/**
 * Where each region's users enter the Design. Without GeoDNS, through the home
 * Users Node. With GeoDNS, through their own region's, or the nearest live one
 * that leads somewhere.
 */
export const userRoutes = (
  game: Game,
  leadsSomewhere: (node: GameNode) => boolean,
): ReadonlyArray<UserRoute> => {
  const home = usersOf(game, HOME_REGION)
  const down = outRegion(game)
  const geo = has(game, 'geo-dns')
  const candidates = geo
    ? REGIONS.flatMap((region) => {
        const source = game.nodes.find(
          (node) => node.type === 'users' && node.region === region && region !== down,
        )
        return source && leadsSomewhere(source) ? [source] : []
      })
    : []
  return regionShares(game).map(([region, share]) => {
    const nearest = candidates.reduce<GameNode | undefined>(
      (best, node) =>
        !best || rttOf(region, node.region) < rttOf(region, best.region) ? node : best,
      undefined,
    )
    const source = nearest ?? home
    return {
      region,
      source,
      share,
      extraMs: source ? userRttMs(game, region, source.region) : 0,
    }
  })
}

/**
 * Extra milliseconds a call between two Nodes pays for where they sit: the round
 * trip between their regions, or the cross-zone hop inside one. A Users Node
 * linked to another region pays a user's two round trips.
 */
export const placeMs = (game: Game, from: GameNode, to: GameNode): number => {
  if (isGlobal(from) || isGlobal(to)) return 0
  // A leaderless store spread across regions answers from a local quorum (07 "Multi-region data").
  if (
    to.type === 'wide' &&
    to.spread &&
    spreadRegions(game, to, SPREAD_REGIONS).includes(from.region)
  )
    return 0
  if (from.region !== to.region)
    return from.type === 'users'
      ? userRttMs(game, from.region, to.region)
      : rttOf(from.region, to.region)
  return zoneMs(from, to)
}

/** A Node that keeps serving through a Region outage: global, or a store spread across regions. */
export const survivesRegion = (game: Game, node: GameNode): boolean =>
  isGlobal(node) ||
  node.type === 'users' ||
  // Leaderless: every region keeps its own quorum. Consensus: a majority of three regions survives one.
  (node.type === 'wide' && node.spread && openRegions(game).length >= 2) ||
  (node.type === 'dsql' && node.spread && openRegions(game).length >= 3)

/** The regions a spread store replicates to: its own first, then the nearest open ones. */
export const spreadRegions = (
  game: Game,
  node: GameNode,
  limit: number,
): ReadonlyArray<RegionId> =>
  node.spread
    ? openRegions(game)
        .toSorted((a, b) => rttOf(node.region, a) - rttOf(node.region, b))
        .slice(0, limit)
    : [node.region]

/**
 * The Nodes a region's tab shows: its own, stores spread across regions, and the
 * Nodes elsewhere that its Nodes link to (drawn with the round trip, or none for a
 * global Component).
 */
export const regionView = (game: Game, region: RegionId): Game => {
  const own = (node: GameNode): boolean =>
    node.region === region || ((node.type === 'wide' || node.type === 'dsql') && node.spread)
  const shown = new Set(game.nodes.filter(own).map((node) => node.id))
  // A global Node's own Links stay on its home tab; the region's Nodes pull in what they call.
  const local = new Set(
    game.nodes.filter((node) => node.region === region && !isGlobal(node)).map((node) => node.id),
  )
  for (const link of game.links) if (local.has(link.from)) shown.add(link.to)
  if (shown.size === game.nodes.length) return game
  return {
    ...game,
    nodes: game.nodes.filter((node) => shown.has(node.id)),
    links: game.links.filter((link) => shown.has(link.from) && shown.has(link.to)),
  }
}
