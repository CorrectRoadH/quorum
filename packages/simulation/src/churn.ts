import {
  CALENDAR_DAY,
  PROFILES,
  REGIONS,
  REGION_INFO,
  type RegionId,
  type RequestKind,
} from './catalog.ts'
import { ERROR_CAUSES, type ErrorCause } from './distribution.ts'
import type { Ledger } from './ledger.ts'
import { eraOf, has } from './lookups.ts'
import { openRegions, regional, regionApdexOf, regionUsers } from './regions.ts'
import type { Game } from './state.ts'
import { forecastUsers, regionGrowth } from './step.ts'

/* ==========================================================================
   The Churn breakdown (12 "The Churn breakdown"): why each region's Users
   leave, as the Apdex points each Request kind and cause takes, and the
   fixes that win back the points the region needs. Every figure comes from
   the Ledger and the growth rule, with no estimate.
   ========================================================================== */

/**
 * What takes Apdex: `far` is the round trip to a Design in another region,
 * `slow` is time inside the Design, and an error cause is a failure.
 * Without Structured logs every failure reads `failed`.
 */
export type ChurnCause = 'far' | 'slow' | 'failed' | ErrorCause

/** What the player can do about a row. */
export type ChurnFix =
  | Readonly<{ _tag: 'region'; region: RegionId }>
  | Readonly<{ _tag: 'research'; research: 'multi-region' | 'geo-dns' }>
  | Readonly<{ _tag: 'node'; nodeId: string }>
  | Readonly<{ _tag: 'advice'; text: string }>

export type ChurnRow = Readonly<{
  kind: RequestKind
  cause: ChurnCause
  /** Apdex points this row takes from the region. The rows add up to 1 − Apdex. */
  points: number
  /** p99 of the kind for this region's users, in ms, once Percentiles is researched. */
  p99: number | null
  /** The kind's Apdex T, in ms. */
  target: number
  /** Fixing this row and the ones above it wins back the points the region needs. */
  needed: boolean
  fix: ChurnFix
}>

export type RegionChurn = Readonly<{
  region: RegionId
  users: number
  /** Apdex of this region's users over the last calendar hour. */
  apdex: number
  /** Apdex of this region's users right now, which the hourly figure moves toward. */
  now: number
  target: number
  /** Users per calendar hour, gained above 0 or lost below it. */
  perHour: number
  /** Users after one calendar day at the current Apdex. */
  inADay: number
  rows: ReadonlyArray<ChurnRow>
}>

/** Rows smaller than this are noise. */
const MIN_POINTS = 0.002

/** What fixes a failure, in one line. */
const FAILURE_FIX: Readonly<Record<ErrorCause, string>> = {
  stranded: 'Link a Node that accepts this kind.',
  dropped: 'Add capacity: a Node is past its backlog.',
  refused: 'Add a Connection Pooler: a connection limit is full.',
  down: 'Replace or restore the Node that is down.',
  stale: 'Read this kind from the primary, or turn on read-your-writes.',
  oom: 'Give the Node more RAM, or fewer workers.',
  timeout: 'Add capacity behind the Link, or raise its timeout.',
  crash: 'Restart the Node, and give it more RAM or copies.',
  blocked: 'Lower the WAF paranoia level.',
  upstream: 'Wait out the provider, or add a fallback.',
  throttled: 'Raise the rate limit.',
  duplicate: 'Research Idempotency keys.',
}

/** The fix for the round trip: open the region, route its users there, then build in it. */
const farFix = (game: Game, region: RegionId): ChurnFix => {
  if (!has(game, 'multi-region')) return { _tag: 'research', research: 'multi-region' }
  if (!openRegions(game).includes(region)) return { _tag: 'region', region }
  if (!has(game, 'geo-dns')) return { _tag: 'research', research: 'geo-dns' }
  return { _tag: 'region', region }
}

/** The rows of one region, largest first, with the ones the region needs marked. */
const rowsOf = (game: Game, ledger: Ledger, region: RegionId, gap: number): Array<ChurnRow> => {
  const kinds = ledger.regionKinds[region] ?? {}
  const total = Object.values(kinds).reduce((sum, entry) => sum + (entry?.rate ?? 0), 0)
  if (total <= 0) return []
  const logs = has(game, 'logs')
  const percentiles = has(game, 'percentiles')
  const rows: Array<Omit<ChurnRow, 'needed'>> = []
  for (const [kind, entry] of Object.entries(kinds) as Array<
    [RequestKind, NonNullable<(typeof kinds)[RequestKind]>]
  >) {
    const share = entry.rate / total
    const target = PROFILES[kind].apdex
    const p99 = percentiles ? entry.p99 : null
    const far = share * entry.success * Math.max(0, entry.near - entry.apdex)
    const slow = share * entry.success * (1 - Math.max(entry.near, entry.apdex))
    if (far >= MIN_POINTS)
      rows.push({ kind, cause: 'far', points: far, p99, target, fix: farFix(game, region) })
    if (slow >= MIN_POINTS)
      rows.push({
        kind,
        cause: 'slow',
        points: slow,
        p99,
        target,
        fix: ledger.bottleneck
          ? { _tag: 'node', nodeId: ledger.bottleneck }
          : { _tag: 'advice', text: 'Add capacity on the busiest Node.' },
      })
    if (logs) {
      for (const cause of ERROR_CAUSES) {
        const points = share * (entry.fail[cause] ?? 0)
        if (points >= MIN_POINTS)
          rows.push({
            kind,
            cause,
            points,
            p99,
            target,
            fix: { _tag: 'advice', text: FAILURE_FIX[cause] },
          })
      }
    } else {
      const points = share * (1 - entry.success)
      if (points >= MIN_POINTS)
        rows.push({
          kind,
          cause: 'failed',
          points,
          p99,
          target,
          fix: { _tag: 'advice', text: 'Research Structured logs to see why.' },
        })
    }
  }
  rows.sort((a, b) => b.points - a.points)
  let won = 0
  return rows.map((row) => {
    const needed = gap > 0 && won < gap
    won += row.points
    return { ...row, needed }
  })
}

/**
 * The Churn breakdown: one section per region that has users, the region that
 * loses the most users per hour first. Before Series C there is one region.
 */
export const churnOf = (game: Game, ledger: Ledger): ReadonlyArray<RegionChurn> => {
  const target = eraOf(game).apdexTarget
  const users = regionUsers(game)
  const growth = regionGrowth(game, ledger)
  const day = forecastUsers(game, ledger, CALENDAR_DAY)
  const regions = regional(game) ? REGIONS : REGIONS.filter((region) => users[region] > 0)
  return regions
    .filter((region) => users[region] >= 1)
    .map((region) => {
      const now = ledger.regions[region] ?? ledger.apdex
      return {
        region,
        users: users[region],
        apdex: regionApdexOf(game, region),
        now,
        target,
        perHour: growth[region] * 60,
        inADay: day[region],
        rows: rowsOf(game, ledger, region, target - now),
      }
    })
    .toSorted((a, b) => a.perHour - b.perHour)
}

/** The region's name, for copy. */
export const regionName = (region: RegionId): string => REGION_INFO[region].name
