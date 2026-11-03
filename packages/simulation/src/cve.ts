import { CVE_DEFS, CVE_EVERY, PATCH_GRACE, patchCost, patchWindow } from './catalog.ts'
import { startIncident } from './director.ts'
import { StepEvent } from './events.ts'
import type { Ledger } from './ledger.ts'
import { nextRandom } from './random.ts'
import type { Game, WorkItem } from './state.ts'
import { enqueue } from './team.ts'

/* ==========================================================================
   CVEs (GDD 18): a disclosure is a ticket with a deadline. It joins the end
   of the backlog, so the player must move it up or rush it; it is overdue once the deadline passes, and a grace later
   the CVE is exploited: the ticket is gone and a Data breach starts.
   ========================================================================== */

/** Share of the Users a breach drives away. */
export const BREACH_CHURN = 0.15

/** A CVE can be disclosed again once this many others have come since. */
const RECENT_CVES = 4

/** Seconds a patch is overdue: 0 before its deadline. */
export const overdueBy = (game: Game, item: WorkItem): number =>
  item.due === undefined ? 0 : Math.max(0, game.time - item.due)

/** Discloses a CVE at each interval, and exploits a patch that stayed overdue. */
export const advanceCves = (
  game: Game,
  ledger: Ledger,
  seconds: number,
  events: Array<StepEvent>,
): Game => {
  if (game.sandbox || game.stage < 1) return game
  let next = game

  const crossed = Math.floor(next.time / CVE_EVERY) > Math.floor((next.time - seconds) / CVE_EVERY)
  if (crossed) {
    const open = CVE_DEFS.flatMap((def) => {
      const target = def.affects.find((id) => next.nodes.some((node) => node.type === id))
      return target && !next.cves.includes(def.id) ? [{ def, target }] : []
    })
    // The draw hashes the seed and the interval, so it leaves the incident generator alone.
    const [roll] = nextRandom(
      (next.seed + Math.floor(next.time / CVE_EVERY) * 7_919) % 2_147_483_648,
    )
    const chosen = open[Math.floor(roll * open.length)]
    if (chosen) {
      const { def, target } = chosen
      const due = next.time + patchWindow(def.score)
      next = enqueue(next, 'patch', def.id, patchCost(def.score), false, { due, target })
      next = { ...next, cves: [...next.cves, def.id].slice(-RECENT_CVES) }
      events.push(StepEvent.CveDisclosed({ item: next.backlog.at(-1) as WorkItem }))
    }
  }

  // One breach at a time: an expired patch waits for the running incident to end.
  const expired = next.backlog.find(
    (item) => item.kind === 'patch' && overdueBy(next, item) >= PATCH_GRACE,
  )
  if (expired && !next.incident) {
    const started = startIncident(next, ledger, 'breach', 0)
    if (started) {
      next = {
        ...started.game,
        users: Math.floor(started.game.users * (1 - BREACH_CHURN)),
        backlog: started.game.backlog.filter((item) => item.id !== expired.id),
      }
      events.push(StepEvent.IncidentStarted({ incident: started.incident }))
      events.push(StepEvent.CveExploited({ cve: expired.ref, target: expired.target ?? '' }))
    }
  }
  return next
}
