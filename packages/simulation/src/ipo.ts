import {
  BACKUPS,
  DRILL_RECOVERED,
  DRILL_RPO,
  DRILL_RTO,
  DRILL_SECONDS,
  ERAS,
  HOME_REGION,
  type ComponentId,
} from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { has, isDown } from './lookups.ts'
import { survivesRegion } from './regions.ts'
import { budgetOf } from './slo.ts'
import type { Drill, Game, GameNode } from './state.ts'
import { valuationOf } from './valuation.ts'

/* ==========================================================================
   The IPO checklist and the DR drill (10 "Era 6: Pre-IPO"). Every item must
   hold at once. The drill fails the home region for a minute; it passes when
   users are served again within the hour and the data it would lose is under
   five calendar minutes.
   ========================================================================== */

/** The Era the IPO checklist ends. */
export const PRE_IPO_STAGE = 6
/** The IPO pays this many seconds of Burn, like a funding round (plan 5.19). */
export const IPO_BURN_SECONDS = 1_000

const DATA: ReadonlyArray<ComponentId> = [
  'database',
  'replica',
  'pooler',
  'cache',
  'search',
  'storage',
  'queue',
  'wide',
  'dsql',
  'warehouse',
]

/**
 * Calendar minutes of writes the home region's data would lose if it failed:
 * leaderless and consensus stores spread across regions lose none, a Database
 * with a replica in another region loses its lag, otherwise its backups decide.
 */
export const rpoOf = (game: Game, ledger: Ledger | null): number => {
  let worst = 0
  for (const node of game.nodes) {
    if (node.region !== HOME_REGION) continue
    if (node.type === 'wide' || node.type === 'dsql') {
      if (!survivesRegion(game, node)) worst = Math.max(worst, Number.POSITIVE_INFINITY)
      continue
    }
    if (node.type !== 'database') continue
    const remote = game.nodes.some(
      (other) => other.type === 'replica' && other.region !== node.region,
    )
    const replica = game.nodes.find(
      (other) => other.type === 'replica' && other.region !== node.region,
    )
    const lag = remote
      ? (ledger?.nodes[replica?.id ?? '']?.lag ?? 0) / 60_000
      : Number.POSITIVE_INFINITY
    worst = Math.max(worst, Math.min(lag, BACKUPS[node.backup].rpo))
  }
  return worst
}

/** Starts a drill record; the director runs the outage. */
export const newDrill = (game: Game, ledger: Ledger | null): Drill => ({
  startedAt: game.time,
  rto: null,
  rpo: rpoOf(game, ledger),
  done: false,
  passed: false,
})

/** Advances a running drill: it recovers once errors fall under 1%, and ends after its outage. */
export const advanceDrill = (game: Game, ledger: Ledger): Drill | null => {
  const drill = game.drill
  if (!drill || drill.done) return drill
  const elapsed = game.time - drill.startedAt
  if (ledger.errorShare < DRILL_RECOVERED && elapsed > 0) {
    // One sim second is one calendar minute.
    const rto = elapsed
    return { ...drill, rto, done: true, passed: rto < DRILL_RTO && drill.rpo < DRILL_RPO }
  }
  if (elapsed >= DRILL_SECONDS + DRILL_RTO) return { ...drill, done: true, passed: false }
  return drill
}

export type ChecklistItem = Readonly<{
  id: 'users' | 'reliability' | 'soc2' | 'drill' | 'residency' | 'rule40'
  label: string
  met: boolean
  /** What it reads now, for the panel. */
  value: string
}>

/** Data Nodes the EU Users Node reaches. */
const reachedData = (game: Game, from: GameNode): ReadonlyArray<GameNode> => {
  const seen = new Set<string>([from.id])
  const stack = [from.id]
  const found: Array<GameNode> = []
  while (stack.length > 0) {
    const at = stack.pop() as string
    for (const link of game.links) {
      if (link.from !== at || seen.has(link.to)) continue
      seen.add(link.to)
      const node = game.nodes.find((entry) => entry.id === link.to)
      if (!node) continue
      if (DATA.includes(node.type)) found.push(node)
      stack.push(node.id)
    }
  }
  return found
}

/** EU users are served from an EU region: GeoDNS, an EU Users Node, and only EU data behind it. */
export const residencyMet = (game: Game): boolean => {
  if (!has(game, 'gdpr-residency') || !has(game, 'geo-dns')) return false
  const eu = game.nodes.find((node) => node.type === 'users' && node.region === 'eu')
  if (!eu || isDown(eu)) return false
  const data = reachedData(game, eu)
  return (
    data.length > 0 &&
    data.every(
      (node) =>
        node.region === 'eu' || ((node.type === 'wide' || node.type === 'dsql') && node.spread),
    )
  )
}

export const checklistOf = (game: Game, ledger: Ledger): ReadonlyArray<ChecklistItem> => {
  const era = ERAS[PRE_IPO_STAGE]
  const target = era?.raiseAt ?? 50_000_000
  const budget = budgetOf(game)
  const slo = era?.slo ?? 0.9995
  const value = valuationOf(game, ledger)
  const drill = game.drill
  return [
    {
      id: 'users',
      label: 'Users',
      met: game.users >= target,
      value: `${Math.round(game.users).toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`,
    },
    {
      id: 'reliability',
      label: 'Reliability',
      met: budget.requests > 0 && budget.availability >= slo,
      value: `${(budget.availability * 100).toFixed(3)}% / ${(slo * 100).toFixed(2)}%`,
    },
    {
      id: 'soc2',
      label: 'SOC 2',
      met: has(game, 'soc2') && has(game, 'security-team'),
      value: has(game, 'soc2') ? (has(game, 'security-team') ? 'Done' : 'Security team') : 'SOC 2',
    },
    {
      id: 'drill',
      label: 'DR drill',
      met: drill?.passed ?? false,
      value: !drill
        ? 'Not run'
        : !drill.done
          ? 'Running'
          : drill.passed
            ? `RTO ${Math.round(drill.rto ?? 0)} min`
            : drill.rto === null
              ? 'Not recovered'
              : drill.rpo >= DRILL_RPO
                ? 'Data lost'
                : `RTO ${Math.round(drill.rto)} min`,
    },
    {
      id: 'residency',
      label: 'Data residency',
      met: residencyMet(game),
      value: residencyMet(game) ? 'EU' : 'Not yet',
    },
    {
      id: 'rule40',
      label: 'Rule of 40',
      met: value.ruleOf40 >= 40,
      value: `${Math.round(value.ruleOf40)}`,
    },
  ]
}

export const ipoReady = (game: Game, ledger: Ledger): boolean =>
  game.stage === PRE_IPO_STAGE && checklistOf(game, ledger).every((item) => item.met)
