import { canRaise } from './actions.ts'
import type { Limit } from './capacity.ts'
import { COMPONENTS, KINDS, RUNTIMES, researchList, type RequestKind } from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { drawerSize, eraOf, has, nextEra, researchReady } from './lookups.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   The next thing to do: one sentence, from the most urgent problem down.
   ========================================================================== */

/** Warn this many sim seconds before a Burstable box runs out of CPU credits. */
const CREDIT_WARNING = 120

const limitHint = (game: Game, node: GameNode, limit: Limit): string => {
  const name = COMPONENTS[node.type].name
  switch (limit) {
    case 'credits':
      return `${name} ran out of CPU credits and is throttled to 20%. Resize it, or switch it off Burstable.`
    case 'memory':
      return node.localDb
        ? `${name} is out of RAM and swapping: Postgres shares the box. Place a Database and link to it.`
        : `${name} is out of RAM and swapping. Resize it, pick the Memory family, or shrink the pool.`
    case 'workers':
      return RUNTIMES[node.runtime].pool
        ? `Every ${RUNTIMES[node.runtime].name} worker on ${name} is busy, mostly waiting. Raise the pool, or speed up the database.`
        : `Every worker on ${name} is busy, mostly waiting on the database.`
    case 'connections':
      return 'Postgres is refusing connections: too many app processes hold pools. Shrink pools or add a Connection Pooler.'
    case 'disk':
      return `The ${name} working set no longer fits in RAM, so reads hit disk. Resize it or pick the Memory family.`
    case 'cpu':
      return `${name} is out of CPU. Resize it, or add a copy behind a Load Balancer.`
    case 'throughput':
      return `${name} is past its throughput.`
    case 'none':
      return `${name} limits the design.`
  }
}

const strandedHint = (kind: RequestKind): string => {
  switch (kind) {
    case 'write':
      return 'Writes need the primary Database: a replica cannot take them.'
    default:
      return 'Check the links.'
  }
}

export const nextGoal = (game: Game, ledger: Ledger): string => {
  const stripe = has(game, 'stripe')
  if (!stripe && game.pending >= drawerSize(game, ledger.revenue) * 0.98)
    return 'The Payments drawer is full and revenue is spilling. Click Payments to collect.'
  if (!stripe && game.pending > 5 && game.cash < 100)
    return 'Click Payments to collect your revenue.'
  const failed = game.nodes.find((node) => node.down === -1)
  if (failed)
    return `${COMPONENTS[failed.type].name} failed. Replace it from its card, or wait for the provider.`
  const restarting = game.nodes.find((node) => node.down > 0)
  if (restarting)
    return `${COMPONENTS[restarting.type].name} is restarting. Requests fail until it is up.`
  const failing = ledger.failing[0]
  if (failing) return `${KINDS[failing].label} requests fail. ${strandedHint(failing)}`
  const stranded = game.nodes.find((node) => (ledger.nodes[node.id]?.stranded ?? 0) > 0.01)
  if (stranded)
    return `${COMPONENTS[stranded.type].name} has requests with nowhere to go. Link it to something that takes them.`
  const draining = game.nodes.find((node) => {
    const rate = ledger.nodes[node.id]?.resources.credits?.rate ?? 0
    return node.credits >= 1 && rate < 0 && node.credits / -rate < CREDIT_WARNING
  })
  if (draining)
    return `${COMPONENTS[draining.type].name} runs out of CPU credits soon and drops to 20% CPU. Switch it to General or resize it.`
  const bottleneck = game.nodes.find((node) => node.id === ledger.bottleneck)
  if (bottleneck) {
    const limit = ledger.nodes[bottleneck.id]?.limit ?? 'none'
    return limitHint(game, bottleneck, limit)
  }
  if (game.cash < 0) return 'Cash is negative. Sell Nodes you do not need, or grow revenue.'
  const next = nextEra(game)
  if (next && canRaise(game))
    return `Investors are calling. Take or decline the ${next.name} round.`
  const affordable = researchList.some(
    (entry) => !has(game, entry.id) && researchReady(game, entry.id) && game.insight >= entry.cost,
  )
  if (affordable && game.researched.length < 3) return 'Open Research and spend your Insight.'
  if (!next) return 'The slice ends here. Keep growing to stress your design.'
  return `Grow to ${eraOf(game).raiseAt.toLocaleString('en-US')} users to raise the ${next.name} round.`
}
