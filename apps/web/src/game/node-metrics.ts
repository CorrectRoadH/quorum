import { Schema } from 'effect'
import { BACKEND_KINDS, COMPONENTS, REQUEST_KINDS } from '@quorum/simulation/catalog'
import type { Ledger } from '@quorum/simulation/ledger'
import type { Game, GameNode } from '@quorum/simulation/state'

const Rates = Schema.Record(Schema.String, Schema.Finite)

/** Inspector history is session state, not part of the replayed Game. */
export const NodeSample = Schema.Struct({
  time: Schema.Finite,
  inbound: Schema.Finite,
  capacity: Schema.Finite,
  utilization: Schema.Finite,
  traffic: Rates,
  sources: Schema.Array(
    Schema.Struct({ id: Schema.String, name: Schema.String, rate: Schema.Finite }),
  ),
  limit: Schema.Literals([
    'cpu',
    'credits',
    'memory',
    'workers',
    'connections',
    'network',
    'disk',
    'throughput',
    'none',
  ]),
  dropped: Schema.Finite,
  refused: Schema.Finite,
  down: Schema.Boolean,
  disk: Schema.Boolean,
  swapping: Schema.Boolean,
  throttled: Schema.Boolean,
  hitRatio: Schema.NullOr(Schema.Finite),
  queue: Schema.NullOr(
    Schema.Struct({
      depth: Schema.Finite,
      out: Schema.Finite,
      stalled: Schema.Boolean,
      wait: Schema.Finite,
    }),
  ),
})
export type NodeSample = typeof NodeSample.Type

export const HISTORY_POINTS = 144
export const HISTORY_EVERY = 10
export const TRAFFIC_KINDS = [...REQUEST_KINDS, ...BACKEND_KINDS]

export const hasTraffic = (node: GameNode): boolean => {
  const def = COMPONENTS[node.type]
  return def.accepts.length > 0 && !def.fixed && !def.control && !def.tap
}

export const sampleNode = (game: Game, node: GameNode, ledger: Ledger): NodeSample => {
  const own = ledger.nodes[node.id]!
  return {
    time: game.time,
    inbound: own.inbound,
    capacity: own.capacity,
    utilization: own.utilization,
    traffic: own.traffic,
    sources: ledger.links
      .filter((link) => link.to === node.id && link.rate > 0)
      .map((link) => {
        const source = game.nodes.find((entry) => entry.id === link.from)!
        return { id: source.id, name: COMPONENTS[source.type].name, rate: link.rate }
      }),
    limit: own.limit,
    dropped: own.dropped,
    refused: own.refused,
    down: node.down !== 0,
    disk: own.disk,
    swapping: own.swapping,
    throttled: own.throttled,
    hitRatio: own.hitRatio,
    queue:
      node.type === 'queue'
        ? {
            depth: node.depth,
            out: Object.values(own.out).reduce((sum, rate) => sum + rate, 0),
            stalled: own.age === Number.POSITIVE_INFINITY,
            wait: own.age !== null && Number.isFinite(own.age) ? own.age : 0,
          }
        : null,
  }
}

/** A recommendation needs a measured constraint, not just a large traffic share. */
export const hintOf = (sample: NodeSample): string | null => {
  if (sample.down)
    return 'This component is down. Check its incident or restart status before resizing it.'
  if (sample.swapping)
    return 'RAM is exhausted and this component is swapping. Reduce resident memory or add RAM.'
  if (sample.throttled)
    return 'CPU credits are exhausted. Consider a non-burstable instance or reduce sustained CPU work.'
  if (sample.refused > 0)
    return 'The connection limit is refusing queries. Consider connection pooling or reduce database concurrency.'
  if (sample.disk && (sample.traffic['q-read'] ?? 0) > 0)
    return 'The working set exceeds RAM and reads hit disk. Consider more RAM, caching, or a read replica.'
  if (sample.queue && sample.queue.depth > 0 && sample.queue.stalled)
    return 'Queued work is stalled. Check that Workers are connected and their downstream calls can complete.'
  if (sample.utilization < 0.9 || sample.inbound <= 0) return null
  switch (sample.limit) {
    case 'cpu':
      return 'CPU limits capacity. Reduce CPU-heavy work or add compute capacity.'
    case 'workers':
      return 'Worker slots limit capacity. Check downstream latency before adding workers.'
    case 'memory':
      return 'Memory limits capacity. Reduce per-request memory or add RAM.'
    case 'network':
      return 'Network bandwidth limits capacity. Consider smaller payloads or more network capacity.'
    case 'disk':
      return 'Disk throughput limits capacity. Reduce disk work or increase storage throughput.'
    case 'throughput':
      return 'Throughput limits capacity. Reduce incoming work or increase this component’s capacity.'
    default:
      return null
  }
}
