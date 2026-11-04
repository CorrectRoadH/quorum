import { canRaise } from './actions.ts'
import type { Limit } from './capacity.ts'
import { COMPONENTS, KINDS, RUNTIMES, researchList, type RequestKind } from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { drawerSize, eraOf, has, nextEra, researchReady } from './lookups.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   The next thing to say: one fact, from the most urgent problem down, and who would say it.
   ========================================================================== */

/** Warn this many sim seconds before a Burstable box runs out of CPU credits. */
const CREDIT_WARNING = 120

/** Who would know the fact in real life. The web app gives each kind its Senders (GDD 18). */
export type AdviceFrom =
  | 'cloud'
  | 'monitoring'
  | 'vendor'
  | 'investor'
  | 'finance'
  | 'customers'
  | 'mentor'

/** A button on the Mail. The id names what it does; the web app maps it to a Message. */
export interface AdviceAction {
  readonly id: string
  readonly label: string
}

type Node = { readonly node: string }
type Nothing = Record<never, never>

/** What each kind of advice is about, and the values the web app's letters may quote. */
export type AdviceVars = {
  readonly credits: Node
  readonly memory: Node
  /** Out of RAM because Postgres shares the box. */
  readonly 'memory-shared': Node
  readonly workers: Node
  /** Workers busy on a runtime with a pool size the player can raise. */
  readonly 'workers-pool': Node & { readonly runtime: string }
  readonly connections: Nothing
  readonly network: Node
  readonly disk: Node
  readonly cpu: Node
  readonly throughput: Node
  /** A Node limits the Design, without a named reason. */
  readonly limit: Node
  readonly drawer: Nothing
  readonly collect: Nothing
  readonly failed: Node
  readonly restarting: Node
  /** A query has no index, and the player can add one. */
  readonly 'slow-query-fix': Nothing
  /** A query has no index, and Query analysis is not researched yet. */
  readonly 'slow-query': Nothing
  /** Writes fail: they need the primary Database. */
  readonly 'failing-writes': { readonly kind: string }
  readonly failing: { readonly kind: string }
  readonly stranded: Node
  readonly draining: Node
  readonly negative: Nothing
  readonly round: { readonly round: string }
  readonly research: Nothing
  readonly guidance: Nothing
  readonly ipo: { readonly users: string }
  readonly grow: { readonly round: string; readonly users: string }
}

export type AdviceTopic = keyof AdviceVars

/** A fact worth telling the player. `key` names the thing it is about, so a repeat joins its Thread.
 *  `text` is the plain fact; the web app writes the letter from `topic` and `vars`. */
export interface Advice {
  readonly key: string
  readonly from: AdviceFrom
  readonly subject: string
  readonly text: string
  readonly topic: AdviceTopic
  readonly vars: Readonly<Record<string, string>>
  readonly actions: ReadonlyArray<AdviceAction>
}

const advice = <T extends AdviceTopic>(
  key: string,
  from: AdviceFrom,
  subject: string,
  text: string,
  topic: T,
  vars: AdviceVars[T],
  actions: ReadonlyArray<AdviceAction> = [],
): Advice => ({ key, from, subject, text, topic, vars, actions })

const limitAdvice = (game: Game, node: GameNode, limit: Limit): Advice => {
  const name = COMPONENTS[node.type].name
  const key = (kind: string) => `${kind}:${limit}:${node.id}`
  switch (limit) {
    case 'credits':
      return advice(
        key('cloud'),
        'cloud',
        `${name}: CPU credits exhausted`,
        `${name} ran out of CPU credits and is throttled to 20%. Resize it, or switch it off Burstable.`,
        'credits',
        { node: name },
      )
    case 'memory':
      return advice(
        key('cloud'),
        'cloud',
        `${name}: out of memory, swapping`,
        node.localDb
          ? `${name} is out of RAM and swapping: Postgres shares the box. Place a Database and link to it.`
          : `${name} is out of RAM and swapping. Resize it, pick the Memory family, or shrink the pool.`,
        node.localDb ? 'memory-shared' : 'memory',
        { node: name },
      )
    case 'workers':
      return RUNTIMES[node.runtime].pool
        ? advice(
            key('monitoring'),
            'monitoring',
            `${name}: all workers busy`,
            `Every ${RUNTIMES[node.runtime].name} worker on ${name} is busy, mostly waiting. Raise the pool, or speed up the database.`,
            'workers-pool',
            { node: name, runtime: RUNTIMES[node.runtime].name },
          )
        : advice(
            key('monitoring'),
            'monitoring',
            `${name}: all workers busy`,
            `Every worker on ${name} is busy, mostly waiting on the database.`,
            'workers',
            { node: name },
          )
    case 'connections':
      return advice(
        key('monitoring'),
        'monitoring',
        'Postgres is refusing connections',
        'Postgres is refusing connections: too many app processes hold pools. Shrink pools or add a Connection Pooler.',
        'connections',
        {},
      )
    case 'network':
      return advice(
        key('cloud'),
        'cloud',
        `${name}: network at line rate`,
        `${name} is sending as many bytes as its network card moves. Resize it, or add a copy behind a Load Balancer.`,
        'network',
        { node: name },
      )
    case 'disk':
      return advice(
        key('cloud'),
        'cloud',
        `${name}: working set left RAM`,
        `The ${name} working set no longer fits in RAM, so reads hit disk. Resize it or pick the Memory family.`,
        'disk',
        { node: name },
      )
    case 'cpu':
      return advice(
        key('cloud'),
        'cloud',
        `${name}: CPU at 100%`,
        `${name} is out of CPU. Resize it, or add a copy behind a Load Balancer.`,
        'cpu',
        { node: name },
      )
    case 'throughput':
      return advice(
        key('monitoring'),
        'monitoring',
        `${name}: past its throughput`,
        `${name} is past its throughput.`,
        'throughput',
        { node: name },
      )
    case 'none':
      return advice(
        key('monitoring'),
        'monitoring',
        `${name} limits the design`,
        `${name} limits the design.`,
        'limit',
        { node: name },
      )
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

const SHOW = (id: string): AdviceAction => ({ id: `show:${id}`, label: 'Show on Board' })

export const nextAdvice = (game: Game, ledger: Ledger): Advice => {
  const stripe = has(game, 'stripe')
  if (!stripe && game.pending >= drawerSize(game, ledger.revenue) * 0.98)
    return advice(
      'vendor:drawer',
      'vendor',
      'Your payout drawer is full',
      'The Payments drawer is full and revenue is spilling. Click Payments to collect.',
      'drawer',
      {},
    )
  if (!stripe && game.pending > 5 && game.cash < 100)
    return advice(
      'vendor:collect',
      'vendor',
      'Revenue waiting to be collected',
      'Click Payments to collect your revenue.',
      'collect',
      {},
    )
  const failed = game.nodes.find((node) => node.life._tag === 'Stopped')
  if (failed)
    return advice(
      `monitoring:failed:${failed.id}`,
      'monitoring',
      `${COMPONENTS[failed.type].name} failed`,
      `${COMPONENTS[failed.type].name} failed. Select it and click Replace, or wait for the provider.`,
      'failed',
      { node: COMPONENTS[failed.type].name },
      [SHOW(failed.id)],
    )
  const restarting = game.nodes.find((node) => node.life._tag === 'Restarting')
  if (restarting)
    return advice(
      `monitoring:restart:${restarting.id}`,
      'monitoring',
      `${COMPONENTS[restarting.type].name} is restarting`,
      `${COMPONENTS[restarting.type].name} is restarting. Requests fail until it is up.`,
      'restarting',
      { node: COMPONENTS[restarting.type].name },
      [SHOW(restarting.id)],
    )
  if (game.incident?.kind === 'slow-query')
    return has(game, 'query-analysis')
      ? advice(
          'monitoring:slow-query',
          'monitoring',
          'A query has no index',
          'A query has no index and the Database scans whole tables. Select it and click Add index.',
          'slow-query-fix',
          {},
        )
      : advice(
          'monitoring:slow-query',
          'monitoring',
          'A query has no index',
          'A query has no index and the Database scans whole tables. Research Query analysis, or put a Cache in front.',
          'slow-query',
          {},
        )
  const failing = ledger.failing[0]
  if (failing)
    return advice(
      `monitoring:failing:${failing}`,
      'monitoring',
      `${KINDS[failing].label} requests are failing`,
      `${KINDS[failing].label} requests fail. ${strandedHint(failing)}`,
      failing === 'write' ? 'failing-writes' : 'failing',
      { kind: KINDS[failing].label },
    )
  const stranded = game.nodes.find((node) => (ledger.nodes[node.id]?.stranded ?? 0) > 0.01)
  if (stranded)
    return advice(
      `monitoring:stranded:${stranded.id}`,
      'monitoring',
      `${COMPONENTS[stranded.type].name}: requests with nowhere to go`,
      `${COMPONENTS[stranded.type].name} has requests with nowhere to go. Link it to something that takes them.`,
      'stranded',
      { node: COMPONENTS[stranded.type].name },
      [SHOW(stranded.id)],
    )
  const draining = game.nodes.find((node) => {
    const rate = ledger.nodes[node.id]?.resources.credits?.rate ?? 0
    return node.credits >= 1 && rate < 0 && node.credits / -rate < CREDIT_WARNING
  })
  if (draining)
    return advice(
      `cloud:draining:${draining.id}`,
      'cloud',
      `${COMPONENTS[draining.type].name}: CPU credits nearly gone`,
      `${COMPONENTS[draining.type].name} runs out of CPU credits soon and drops to 20% CPU. Switch it to General or resize it.`,
      'draining',
      { node: COMPONENTS[draining.type].name },
      [SHOW(draining.id)],
    )
  const bottleneck = game.nodes.find((node) => node.id === ledger.bottleneck)
  if (bottleneck)
    return {
      ...limitAdvice(game, bottleneck, ledger.nodes[bottleneck.id]?.limit ?? 'none'),
      actions: [SHOW(bottleneck.id)],
    }
  if (game.cash < 0)
    return advice(
      'finance:negative',
      'finance',
      'Your balance is negative',
      'Cash is negative. Sell Nodes you do not need, or grow revenue.',
      'negative',
      {},
    )
  const next = nextEra(game)
  if (next && canRaise(game))
    return advice(
      `investor:round:${game.stage}`,
      'investor',
      `${next.name} term sheet`,
      `Investors are calling. Take or decline the ${next.name} round.`,
      'round',
      { round: next.name },
      [
        { id: 'raise', label: 'Raise' },
        { id: 'decline', label: 'Decline' },
      ],
    )
  const ready = researchList.some((entry) => !has(game, entry.id) && researchReady(game, entry.id))
  if (ready && game.studies.length === 0 && game.researched.length < 3)
    return advice(
      'mentor:research',
      'mentor',
      'Start a Study',
      'Open Research and queue a Study. It takes Insight as it runs.',
      'research',
      {},
    )
  if (!next)
    return advice(
      'finance:guidance',
      'finance',
      'Guidance for this quarter',
      'Meet the guidance you set for this quarter.',
      'guidance',
      {},
    )
  if (next.name === 'Public')
    return advice(
      'mentor:ipo',
      'mentor',
      'Going public',
      `Grow to ${eraOf(game).raiseAt.toLocaleString('en-US')} users and clear the IPO checklist to go public.`,
      'ipo',
      { users: eraOf(game).raiseAt.toLocaleString('en-US') },
    )
  return advice(
    `mentor:grow:${game.stage}`,
    'mentor',
    `On the way to ${next.name}`,
    `Grow to ${eraOf(game).raiseAt.toLocaleString('en-US')} users to raise the ${next.name} round.`,
    'grow',
    { round: next.name, users: eraOf(game).raiseAt.toLocaleString('en-US') },
  )
}
