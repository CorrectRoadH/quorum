/* Regions (05 "Zones and regions"): where users live, and how far apart the regions are. */

export const REGIONS = ['na', 'eu', 'apac', 'sa'] as const
export type RegionId = (typeof REGIONS)[number]

/** The region every Company starts in. Its Users Node is the home Users Node. */
export const HOME_REGION: RegionId = 'na'

export type RegionDef = Readonly<{
  name: string
  /** Tab label. */
  short: string
  /** Share of users who live here, from Series C. Proposed: the GDD gives none. */
  share: number
  /**
   * Calendar minutes this region's clock runs ahead of the home clock, so its
   * 20:00 peak lands at a different home hour (10 "Era 5": follow the sun). Proposed.
   */
  offset: number
}>

export const REGION_INFO: Record<RegionId, RegionDef> = {
  na: { name: 'North America', short: 'NA', share: 0.4, offset: 0 },
  eu: { name: 'Europe', short: 'EU', share: 0.3, offset: 360 },
  apac: { name: 'Asia-Pacific', short: 'APAC', share: 0.2, offset: 840 },
  sa: { name: 'South America', short: 'SA', share: 0.1, offset: 120 },
}

/**
 * Round trips between regions, in ms (05 "Zones and regions": US East to Europe 75,
 * Europe to Asia 160, US East to Sydney 200). The South America figures are proposed.
 */
const RTT: Readonly<Record<string, number>> = {
  'na-eu': 75,
  'na-apac': 200,
  'na-sa': 120,
  'eu-apac': 160,
  'eu-sa': 190,
  'apac-sa': 300,
}

/** Milliseconds of one round trip between two regions; 0 inside one. Symmetric. */
export const rttOf = (from: RegionId, to: RegionId): number =>
  from === to ? 0 : (RTT[`${from}-${to}`] ?? RTT[`${to}-${from}`] ?? 0)

/**
 * A user far away pays two round trips on the user hop: one to open the connection,
 * one for the request. Calls between Nodes reuse connections and pay one.
 */
export const USER_ROUND_TRIPS = 2
/** Anycast takes this many ms off every user hop (10 "Infrastructure"). */
export const ANYCAST_MS = 20
/** HTTP/3 cuts the user hop to distant users by this share (10 "Performance"). */
export const HTTP3_CUT = 0.2
/** HTTP/2 cuts the user hop on page views by this share (10 "Performance"). */
export const HTTP2_CUT = 0.15
/** Egress price per GB between regions (09 "Egress"). */
export const EGRESS_CROSS_REGION = 0.02
/** Cash to open a region: its network, its accounts, its Users. Proposed. */
export const OPEN_REGION_PRICE = 20_000
/** The Era regions arrive in (10 "Era 5"). */
export const REGIONS_FROM_STAGE = 5
