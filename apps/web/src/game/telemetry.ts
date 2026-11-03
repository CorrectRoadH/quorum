import { COMPONENTS } from '@quorum/simulation/catalog'
import { insightTotal } from '@quorum/simulation/lookups'
import type { Ledger } from '@quorum/simulation/ledger'
import { clockOf } from '@quorum/simulation/solve'
import type { Game, GameNode } from '@quorum/simulation/state'
import type { Model } from './model.ts'
import type { LogEntry } from './playlog.ts'

/* ==========================================================================
   What the playtest log records about a moment: a compact context for each
   gesture, what the gesture changed, and a periodic sample of the company.
   ========================================================================== */

const round = (value: number, digits = 2): number => {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

export const line = (t: number, type: string, data: unknown): LogEntry => ({
  t,
  type,
  data: JSON.stringify(data),
})

const SETTINGS = ['size', 'family', 'runtime', 'framework', 'workers', 'sample', 'localDb'] as const

/** What a gesture changed in the Game, with empty parts left out. */
export const diffOf = (before: Game, after: Game): Record<string, unknown> => {
  if (before === after) return {}
  const ids = new Set(before.nodes.map((node) => node.id))
  const afterIds = new Set(after.nodes.map((node) => node.id))
  const key = (link: { from: string; to: string }) => `${link.from}>${link.to}`
  const beforeLinks = new Set(before.links.map(key))
  const afterLinks = new Set(after.links.map(key))
  const changed: Array<Record<string, unknown>> = []
  for (const node of after.nodes) {
    const old = before.nodes.find((entry) => entry.id === node.id)
    if (!old) continue
    for (const field of SETTINGS) {
      if (old[field] !== node[field])
        changed.push({ id: node.id, type: node.type, field, from: old[field], to: node[field] })
    }
    if (old.down !== -1 && node.down === -1)
      changed.push({ id: node.id, type: node.type, field: 'failed' })
  }
  const diff: Record<string, unknown> = {
    cash: round(after.cash - before.cash),
    insight: round(insightTotal(after.pools) - insightTotal(before.pools)),
    added: after.nodes
      .filter((node) => !ids.has(node.id))
      .map((node) => ({ id: node.id, type: node.type })),
    removed: before.nodes
      .filter((node) => !afterIds.has(node.id))
      .map((node) => ({ id: node.id, type: node.type })),
    linked: after.links.filter((link) => !beforeLinks.has(key(link))).map(key),
    unlinked: before.links.filter((link) => !afterLinks.has(key(link))).map(key),
    researched: after.researched.filter((id) => !before.researched.includes(id)),
    changed,
    stage: after.stage !== before.stage ? after.stage : undefined,
  }
  return Object.fromEntries(
    Object.entries(diff).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== 0,
    ),
  )
}

const nodeBrief = (node: GameNode, ledger: Ledger) => {
  const entry = ledger.nodes[node.id]
  return {
    id: node.id,
    type: node.type,
    size: node.size,
    util: round(entry?.utilization ?? 0),
    limit: entry?.limit ?? 'none',
    status: entry?.status ?? 'idle',
  }
}

/** A short context attached to every gesture. */
export const contextOf = (model: Model, ledger: Ledger): Record<string, unknown> => ({
  users: Math.round(model.board.game.users),
  cash: round(model.board.game.cash),
  insight: round(insightTotal(model.board.game.pools), 1),
  stage: model.board.game.stage,
  revenue: round(ledger.revenue),
  apdex: round(ledger.apdex, 3),
  errors: round(ledger.errorShare, 4),
  bottleneck: ledger.bottleneck,
  panel: model.panel,
  speed: model.board.speed,
  selected: model.board.game.nodes.find((node) => node.id === model.board.selected)?.type ?? null,
})

/** A full sample of the company, every 10 sim seconds. */
export const sampleOf = (model: Model, ledger: Ledger): Record<string, unknown> => {
  const clock = clockOf(model.board.game.time)
  const bottleneck = model.board.game.nodes.find((node) => node.id === ledger.bottleneck)
  return {
    clock: `${clock.day} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`,
    stage: model.board.game.stage,
    users: Math.round(model.board.game.users),
    market: Math.round(ledger.market),
    cash: round(model.board.game.cash),
    pending: round(model.board.game.pending),
    spilled: round(model.board.game.spilled),
    revenue: round(ledger.revenue),
    burn: round(ledger.burn),
    demand: round(ledger.demand),
    served: round(ledger.served),
    apdex: round(ledger.apdex, 3),
    apdexHour: round(model.board.game.apdex, 3),
    errors: round(ledger.errorShare, 4),
    errorCauses: Object.fromEntries(
      Object.entries(ledger.errors).map(([cause, rate]) => [cause, round(rate)]),
    ),
    latency: round(ledger.latency, 1),
    p50: round(ledger.p50, 1),
    p95: round(ledger.p95, 1),
    p99: round(ledger.p99, 1),
    insight: round(insightTotal(model.board.game.pools), 1),
    insightRate: round(insightTotal(ledger.insight), 2),
    bottleneck: bottleneck
      ? { id: bottleneck.id, type: bottleneck.type, limit: ledger.nodes[bottleneck.id]?.limit }
      : null,
    incident: model.board.game.incident?.kind ?? null,
    nodes: model.board.game.nodes
      .filter((node) => !COMPONENTS[node.type].fixed)
      .map((node) => nodeBrief(node, ledger)),
    speed: model.board.speed,
    paused: model.board.paused,
    panel: model.panel,
    settling: model.board.change !== null,
  }
}
