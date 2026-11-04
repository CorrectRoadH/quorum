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
/**
 * When regions arrive, each far region starts with this share of the users at home,
 * times its share over North America's (04 "Going global"). Proposed.
 */
export const ABROAD_SEED = 0.05
/**
 * How much users in other regions count toward word of mouth in a region, against
 * 1 for its own users (04 "Going global"). Putsis et al. (1997) measured adoption in
 * one country speeding it in others; Takada and Jain (1991) found later countries
 * adopt faster. Proposed.
 */
export const BORDER_MIXING = 0.1

/* ---------- Mirrors (05 "Mirror a region") ---------- */

/**
 * Calendar minutes from Apply until a Mirror's new Nodes serve (16 `mirror_time`). Proposed:
 * about what `terraform apply` takes to boot instances and a replica.
 */
export const MIRROR_TIME = 30
/** Calendar minutes GitOps Staged holds a change on the source before the Mirrors get it (16 `stage_wait`). Proposed. */
export const STAGE_WAIT = 60
/** Calendar minutes between GitOps syncs: Argo CD polls its repository every 3 minutes by default. */
export const SYNC_POLL = 3
/** Calendar minutes Mirrors do not sync while the Company moves to another IaC tool. Proposed: one calendar day. */
export const IAC_SWITCH = 1_440

export const IAC_TOOLS = ['terraform', 'pulumi', 'alchemy'] as const
export type IacToolId = (typeof IAC_TOOLS)[number]

export const SYNC_MODES = ['all', 'staged'] as const
export type SyncModeId = (typeof SYNC_MODES)[number]

/** How a Mirror copies a source data Node (05 "Mirror a region", 07 "Multi-region data"). */
export const DATA_PATTERNS = ['replica', 'primary', 'replicate', 'call'] as const
export type DataPatternId = (typeof DATA_PATTERNS)[number]

/**
 * Calendar minutes a plan spends reading one Node's live state before it diffs (05 "IaC tools").
 * Terraform refreshes on every plan and apply; Pulumi documents the same round trip per resource
 * as the reason `pulumi up` does not refresh by default. Proposed.
 */
export const REFRESH_TIME = 0.5

export type IacToolDef = Readonly<{
  name: string
  /** What the code is written in. */
  language: string
  /**
   * Every plan reads live state first, so it shows every hand change (`terraform plan` refreshes).
   * When false, plans diff against the state the last Apply recorded, and hand changes show only
   * after the player reads live state.
   */
  refreshOnPlan: boolean
  /** The command that reads live state when plans do not: `pulumi refresh` or `alchemy drift`. */
  refresh: string | null
  /** Restores drifted Nodes to the last deployed state without taking source changes (`alchemy drift --repair`). */
  repair: boolean
}>

/**
 * The IaC tools (05 "IaC tools"). All three build every Component and can set any value per
 * region. They differ in how a plan finds hand changes, as each tool's documented default workflow.
 */
export const IAC_TOOL_INFO: Record<IacToolId, IacToolDef> = {
  terraform: {
    name: 'Terraform',
    language: 'HCL',
    refreshOnPlan: true,
    refresh: null,
    repair: false,
  },
  pulumi: {
    name: 'Pulumi',
    language: 'TypeScript',
    refreshOnPlan: false,
    refresh: 'pulumi refresh',
    repair: false,
  },
  alchemy: {
    name: 'Alchemy',
    language: 'TypeScript',
    refreshOnPlan: false,
    refresh: 'alchemy drift',
    repair: true,
  },
}
