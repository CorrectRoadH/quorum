import {
  COMPONENTS,
  FIRST_INCIDENT_AFTER,
  HOME_REGION,
  LIVE_TUNING,
  OFFLINE_CAP,
  type ResearchId,
  type Tuning,
} from './catalog.ts'
import { clockOf } from './calendar.ts'
import { perkLevel } from './founding.ts'
import { perRegion, regional, regionUsers, withRegionUsers } from './regions.ts'
import type { Game } from './state.ts'
import { step } from './step.ts'
import { devHoursRate } from './team.ts'

/* ==========================================================================
   Offline progress (04 "Offline progress"): the time the player was away, in
   10-second Steps, with the day and week cycles, no incidents, revenue
   straight to Cash, and churn capped at 5% of each region's users.
   ========================================================================== */

export const OFFLINE_STEP = 10
/** Users the Company can lose while the player is away. */
export const OFFLINE_CHURN = 0.05
/** Away for less than this is not worth a return summary. */
export const OFFLINE_MIN = 60

export type AwayReport = Readonly<{
  /** Sim seconds simulated, after the cap. */
  seconds: number
  /** Sim seconds the player was away, before the cap. */
  away: number
  usersBefore: number
  usersAfter: number
  cash: number
  /** Studies that completed while away. */
  studied: ReadonlyArray<ResearchId>
  devHours: number
  /** The highest utilization of any limiting Node, and its calendar hour and Node. */
  peak: number
  peakHour: number
  peakNode: string | null
  /** Users lost at some point while away. */
  lost: boolean
}>

/** The offline cap for a Company: 8 hours, raised by Night shift. */
export const offlineCap = (game: Game): number =>
  OFFLINE_CAP[perkLevel(game, 'night-shift')] ?? OFFLINE_CAP[0] ?? 0

/** Simulates `away` sim seconds of absence, up to the Company's cap. */
export const simulateAway = (
  game: Game,
  away: number,
  tuning: Tuning = LIVE_TUNING,
): Readonly<{ game: Game; report: AwayReport }> => {
  const seconds = Math.max(0, Math.min(away, offlineCap(game)))
  // Each region keeps at least 95% of its users (04 "Offline progress").
  const before = regionUsers(game)
  const floor = perRegion((region) => before[region] * (1 - OFFLINE_CHURN))
  const floored = (next: Game): Game => {
    if (!regional(next)) return { ...next, users: Math.max(floor[HOME_REGION], next.users) }
    const users = regionUsers(next)
    return withRegionUsers(
      next,
      perRegion((region) => Math.max(floor[region], users[region])),
    )
  }
  let current = game
  let devHours = 0
  let peak = 0
  let peakHour = 0
  let peakNode: string | null = null
  let lost = false
  let left = seconds
  while (left > 0) {
    const size = Math.min(OFFLINE_STEP, left)
    const usersBefore = current.users
    const result = step(current, size, tuning, true)
    devHours += devHoursRate(current, result.ledger, tuning) * size
    for (const node of current.nodes) {
      if (!COMPONENTS[node.type].limiting) continue
      const utilization = result.ledger.nodes[node.id]?.utilization ?? 0
      if (utilization > peak) {
        peak = utilization
        peakHour = clockOf(current.time).hour
        peakNode = COMPONENTS[node.type].name
      }
    }
    current = floored(result.game)
    if (current.users < usersBefore) lost = true
    left -= size
  }
  // Nothing waits to strike the moment the player is back.
  const rested: Game =
    current.stage >= 1
      ? {
          ...current,
          nextIncidentAt: Math.max(current.nextIncidentAt, current.time + FIRST_INCIDENT_AFTER),
        }
      : current
  return {
    game: rested,
    report: {
      seconds,
      away,
      usersBefore: game.users,
      usersAfter: rested.users,
      cash: rested.cash - game.cash,
      studied: rested.researched.filter((id) => !game.researched.includes(id)),
      devHours,
      peak,
      peakHour,
      peakNode,
      lost,
    },
  }
}
