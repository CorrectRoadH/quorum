import {
  Activity,
  Archive,
  ArrowRightFromLine,
  ArrowRightToLine,
  Banknote,
  Cable,
  Check,
  ChevronsUp,
  Coins,
  Copy,
  Tag,
  Plus,
  Gauge,
  Gem,
  HardDrive,
  Hourglass,
  HandCoins,
  Inbox,
  Layers,
  ListOrdered,
  LogIn,
  RotateCcw,
  ScanLine,
  ShieldBan,
  Shuffle,
  Smile,
  Target,
  Timer,
  Unplug,
  Users,
  Wallet,
} from 'lucide'
import {
  COMPONENTS,
  FRAMEWORKS,
  LB_POLICIES,
  RUNTIMES,
  GPU_TYPES,
  SCAN_PRICE,
  SIZES,
  ZONES,
  POOLS,
  type InsightPool,
  MSGP_PRICE,
  REGION_INFO,
  rttOf,
} from '@quorum/simulation/catalog'
import { POOL_ORDER } from '../game/pools.ts'
import type { Ledger } from '@quorum/simulation/ledger'
import {
  burnOf,
  drawerSize,
  eraOf,
  has,
  replacePrice,
  resizePrice,
  sizeLabel,
  zoned,
} from '@quorum/simulation/lookups'
import { isGlobal, regional, regionApdexOf, regionUsers } from '@quorum/simulation/regions'
import { quartersBehind } from '@quorum/simulation/team'
import type { Game, GameNode, Region } from '@quorum/simulation/state'
import { compact, money, ms, priceLabel, queueWait, rate } from '../game/format.ts'
import { layoutOf } from './geometry.ts'
import { type StackLogoId } from '../game/icons.ts'

/* ==========================================================================
   What a Node card says: its rows, its header level, and its footer button,
   as plain data from the Game and the Ledger. The board paints them with
   Pixi; the wiki prints the same card as HTML. No renderer imports here.
   ========================================================================== */

export type RowTone = 'plain' | 'warn' | 'danger' | 'ok' | 'muted'
/** Row glyphs by key, so the per-frame digest stays a short string. */
export const ROW_ICONS = {
  inbound: ArrowRightToLine,
  load: Gauge,
  latency: Timer,
  out: ArrowRightFromLine,
  stranded: Unplug,
  users: Users,
  apdex: Smile,
  requests: Activity,
  revenue: Banknote,
  drawer: Wallet,
  stripe: Check,
  sampling: ScanLine,
  kept: Archive,
  insight: Gem,
  stack: Layers,
  connections: Cable,
  hits: Target,
  lag: Hourglass,
  policy: Shuffle,
  logins: LogIn,
  cost: Coins,
  depth: ListOrdered,
  stored: HardDrive,
  blocked: ShieldBan,
  copies: Copy,
  version: Tag,
} as const

export const FOOT_ICONS = {
  collect: HandCoins,
  auto: Check,
  empty: Inbox,
  replace: RotateCcw,
  max: ChevronsUp,
  resize: ChevronsUp,
  more: Plus,
} as const

export type Row = Readonly<{
  glyph: keyof typeof ROW_ICONS
  name: string
  value: string
  tone?: RowTone
  bar?: number
  /** An Insight pool's icon, in its colour, in place of the row glyph. */
  pool?: InsightPool
  /** A brand mark in place of the row glyph. */
  logo?: StackLogoId
  /** A brand mark just before the value. */
  valueLogo?: StackLogoId
  /** Recent values, drawn as a sparkline under the row. */
  trend?: ReadonlyArray<number>
}>
export type Footer = Readonly<{
  glyph: keyof typeof FOOT_ICONS
  text: string
  enabled: boolean
  tone: 'accent' | 'ok' | 'muted' | 'danger'
}>

export const pct = (value: number): string => `${Math.round(value * 100)}%`

export const outRate = (ledger: Ledger, id: string): number =>
  ledger.links.reduce((sum, link) => (link.from === id ? sum + link.rate : sum), 0)

export const rowsOf = (
  game: Game,
  node: GameNode,
  ledger: Ledger,
  history: ReadonlyArray<number> = [],
): ReadonlyArray<Row> => {
  const own = ledger.nodes[node.id]
  if (!own) return []
  const inbound: Row = {
    glyph: 'inbound',
    name: 'Inbound',
    value: `${rate(own.inbound)}/s`,
    tone: own.dropped > 0.05 ? 'danger' : 'plain',
  }
  const capacity: Row = {
    glyph: 'load',
    name: 'Load',
    value:
      own.inbound > 0
        ? `${pct(Math.min(own.utilization, 9.99))} of ${rate(own.capacity)}/s`
        : 'idle',
    tone: own.utilization >= 0.9 ? 'danger' : own.utilization >= 0.7 ? 'warn' : 'plain',
    bar: Math.min(own.utilization, 1),
    ...(has(game, 'metrics') && history.length > 1 ? { trend: history } : {}),
  }
  const latency: Row = {
    glyph: 'latency',
    name: 'Latency',
    value: has(game, 'percentiles') ? `${ms(own.latency)} · p99 ${ms(own.p99)}` : ms(own.latency),
  }
  const out: Row = {
    glyph: own.stranded > 0.01 ? 'stranded' : 'out',
    name: own.stranded > 0.01 ? 'Stranded' : 'Out',
    value: own.stranded > 0.01 ? `${rate(own.stranded)}/s` : `${rate(outRate(ledger, node.id))}/s`,
    tone: own.stranded > 0.01 ? 'danger' : 'plain',
  }
  switch (node.type) {
    case 'users': {
      const target = eraOf(game).apdexTarget
      // From Series C each Users Node shows its own region's users (04 "Users and growth").
      const split = regional(game)
      const users = split ? regionUsers(game)[node.region] : game.users
      const apdex = split ? regionApdexOf(game, node.region) : game.apdex
      const sent = split
        ? Object.values(ledger.regionKinds[node.region] ?? {}).reduce(
            (sum, entry) => sum + (entry?.rate ?? 0),
            0,
          )
        : ledger.demand
      return [
        { glyph: 'users', name: 'Users', value: compact(users) },
        {
          glyph: 'apdex',
          name: 'Apdex',
          value: apdex.toFixed(2),
          tone: apdex >= target ? 'ok' : 'danger',
        },
        { glyph: 'requests', name: 'Requests', value: `${rate(sent)}/s` },
      ]
    }
    case 'payments': {
      const size = drawerSize(game, ledger.revenue)
      return [
        { glyph: 'revenue', name: 'Revenue', value: `${money(ledger.revenue)}/s`, tone: 'ok' },
        {
          glyph: has(game, 'stripe') ? 'stripe' : 'drawer',
          name: has(game, 'stripe') ? 'Stripe' : 'Drawer',
          value: has(game, 'stripe') ? 'auto' : `${money(game.pending)} / ${money(size)}`,
          tone: game.pending >= size * 0.98 ? 'warn' : 'plain',
          bar: has(game, 'stripe') ? 0 : game.pending / size,
        },
      ]
    }
    case 'analytics': {
      const sampled = Math.min(own.inbound, own.capacity)
      return [
        { glyph: 'sampling', name: 'Sampling', value: `${rate(own.inbound)}/s` },
        {
          glyph: 'kept',
          name: 'Kept',
          value: `${rate(sampled)} / ${rate(own.capacity)}`,
          tone: own.inbound > own.capacity ? 'warn' : 'plain',
          bar: own.capacity > 0 ? Math.min(1, own.inbound / own.capacity) : 0,
        },
        // The three pools it earns most, each with its own icon.
        ...POOL_ORDER.filter((pool) => ledger.insight[pool] > 0)
          .toSorted((a, b) => ledger.insight[b] - ledger.insight[a])
          .slice(0, 3)
          .map((pool): Row => ({
            glyph: 'insight',
            pool,
            name: POOLS[pool].label,
            value: `+${ledger.insight[pool].toFixed(1)}/s`,
            tone: 'ok',
          })),
      ]
    }
    case 'server': {
      const runtime = RUNTIMES[node.runtime]
      const framework = node.framework === 'none' ? null : node.framework
      return [
        inbound,
        capacity,
        {
          glyph: 'stack',
          logo: runtime.language,
          name: runtime.name,
          value: framework ? FRAMEWORKS[framework].name : '—',
          ...(framework ? { valueLogo: framework } : { tone: 'muted' }),
        },
        latency,
        out,
      ]
    }
    case 'database':
    case 'replica': {
      const pool = own.connections
      return [
        inbound,
        capacity,
        {
          glyph: 'connections',
          name: 'Connections',
          value: pool ? `${Math.round(pool.used)} / ${pool.max}` : '—',
          tone:
            pool && pool.used > pool.max
              ? 'danger'
              : pool && pool.used > pool.max * 0.8
                ? 'warn'
                : 'plain',
        },
        latency,
        ...(own.lag === null ? [] : [{ glyph: 'lag', name: 'Lag', value: ms(own.lag) } as const]),
      ]
    }
    case 'cache':
      return [
        inbound,
        { glyph: 'hits', name: 'Hit ratio', value: pct(own.hitRatio ?? 0), bar: own.hitRatio ?? 0 },
        latency,
        out,
      ]
    case 'pooler':
      return [inbound, capacity, latency, out]
    case 'lb':
      return [
        inbound,
        capacity,
        { glyph: 'policy', name: 'Policy', value: LB_POLICIES[node.policy].label },
        out,
      ]
    case 'dns':
      return [inbound, { glyph: 'policy', name: 'Policy', value: 'round robin' }, out]
    case 'auth':
      return [
        { glyph: 'logins', name: 'Logins', value: `${rate(own.inbound)}/s` },
        { glyph: 'cost', name: 'Cost', value: `${money(burnOf(game, node))}/s` },
        latency,
      ]
    case 'search':
      return [inbound, capacity, latency]
    case 'storage':
      return [
        inbound,
        { glyph: 'stored', name: 'Stored', value: `${compact(game.stored)} GB` },
        { glyph: 'cost', name: 'Cost', value: `${money(burnOf(game, node))}/s` },
      ]
    case 'queue':
      return [
        inbound,
        {
          glyph: 'depth',
          name: 'Depth',
          // How long a new task waits behind the backlog: past 40 s, an upload's result is late.
          value:
            node.depth < 1 ? '0' : `${compact(Math.round(node.depth))} · ${queueWait(own.age)}`,
          tone:
            (own.age ?? 0) >= 40
              ? 'danger'
              : (own.age ?? 0) >= 10 || node.depth >= 100
                ? 'warn'
                : 'plain',
        },
        capacity,
        out,
      ]
    case 'worker': {
      const runtime = RUNTIMES[node.runtime]
      const framework = node.framework === 'none' ? null : node.framework
      return [
        inbound,
        capacity,
        {
          glyph: 'stack',
          logo: runtime.language,
          name: runtime.name,
          value: framework ? FRAMEWORKS[framework].name : '—',
          ...(framework ? { valueLogo: framework } : { tone: 'muted' }),
        },
        out,
      ]
    }
    case 'cdn':
      return [
        inbound,
        { glyph: 'hits', name: 'Hit ratio', value: pct(own.hitRatio ?? 0), bar: own.hitRatio ?? 0 },
        out,
      ]
    case 'waf':
      return [
        inbound,
        capacity,
        {
          glyph: 'blocked',
          name: 'Paranoia',
          value: node.underAttack ? 'under attack' : `level ${node.paranoia}`,
          tone: node.underAttack ? 'warn' : 'plain',
        },
        out,
      ]
    case 'psp':
      return [
        { ...inbound, name: 'Checkouts' },
        latency,
        { glyph: 'cost', name: 'Fees', value: `${money(ledger.fees)}/s` },
      ]
    case 'autoscaler': {
      const members = membersOf(game, node)
      const copies = members.reduce((total, member) => total + member.replicas, 0)
      const pending = members.reduce((total, member) => total + member.pending, 0)
      return [
        {
          glyph: 'copies',
          name: 'Copies',
          value: members.length === 0 ? '—' : pending > 0 ? `${copies} +${pending}` : `${copies}`,
          tone: members.length === 0 ? 'muted' : pending > 0 ? 'warn' : 'plain',
        },
        {
          glyph: 'load',
          name: 'Target',
          value: `${node.signal === 'cpu' ? 'CPU' : 'load'} ${pct(node.target)}`,
        },
        {
          glyph: 'policy',
          name: 'Range',
          value: `${node.minCopies}–${node.maxCopies > 0 ? node.maxCopies : '∞'}`,
        },
      ]
    }
    case 'cluster': {
      const members = membersOf(game, node)
      const behind = quartersBehind(game, node)
      const upgrading =
        game.incident?.kind === 'cluster-upgrade' && game.incident.nodeId === node.id
      return [
        { glyph: 'copies', name: 'Members', value: `${members.length}` },
        {
          glyph: 'cost',
          name: 'Burn',
          value: `${money(members.reduce((total, member) => total + burnOf(game, member), 0))}/s`,
        },
        {
          glyph: 'version',
          name: 'Version',
          value: upgrading ? 'upgrading' : behind > 0 ? 'unsupported' : 'supported',
          tone: upgrading ? 'danger' : behind > 0 ? 'warn' : 'plain',
        },
      ]
    }
    case 'warehouse':
      return [
        { ...inbound, name: 'Scans' },
        latency,
        {
          glyph: 'cost',
          name: 'Cost',
          value: `${money((own.inbound - own.dropped) * SCAN_PRICE * eraOf(game).costIndex)}/s`,
        },
      ]
    case 'gpu':
      return [
        { ...inbound, name: 'Prompts' },
        capacity,
        { glyph: 'stack', name: 'GPU', value: GPU_TYPES[node.gpu].name },
        { glyph: 'cost', name: 'Cost', value: `${money(burnOf(game, node))}/s` },
      ]
    case 'llm':
      return [{ ...inbound, name: 'Prompts' }, capacity, latency]
    case 'msgp':
      return [
        { ...inbound, name: 'Messages' },
        capacity,
        {
          glyph: 'cost',
          name: 'Cost',
          value: `${money((own.inbound - own.dropped) * MSGP_PRICE * eraOf(game).costIndex)}/s`,
        },
      ]
    case 'wide':
      return [
        inbound,
        capacity,
        {
          glyph: 'policy',
          name: 'Quorum',
          value: `N${node.n} R${node.r} W${node.w}`,
          tone: node.r + node.w > node.n ? 'plain' : 'warn',
        },
        latency,
      ]
    case 'dsql':
      return [inbound, capacity, latency]
  }
}

/** The App Servers and Workers linked into a control Node. */
export const membersOf = (game: Game, node: GameNode): ReadonlyArray<GameNode> =>
  game.nodes.filter((entry) =>
    game.links.some((link) => link.from === entry.id && link.to === node.id),
  )

/** A Node's size as pips: the current size of all sizes, or null for a Component without sizes. */
export const sizePips = (node: GameNode): Readonly<{ filled: number; total: number }> | null => {
  const def = COMPONENTS[node.type]
  if (def.sized) return { filled: node.size + 1, total: SIZES.length }
  return def.steps > 1 ? { filled: node.size, total: def.steps } : null
}

/** The header's right label, before the size pips: the copies, and the zone once zones are researched. */
export const levelOf = (game: Game, node: GameNode, region: Region | null = null): string => {
  const copies =
    `${node.replicas > 1 ? `×${node.replicas}` : ''}${node.pending > 0 ? ` +${node.pending}` : ''}`.trim()
  // A standby sits in the next zone over.
  const standby = ZONES[(ZONES.indexOf(node.zone) + 1) % ZONES.length] ?? ''
  const zone =
    has(game, 'multi-az') && zoned(node)
      ? `${node.zone.toUpperCase()}${node.standby ? `+${standby.toUpperCase()}` : ''}`
      : ''
  // A Node from another region shows where it is and the round trip to reach it.
  const remote =
    region !== null && node.region !== region && !isGlobal(node) && !node.spread
      ? `${REGION_INFO[node.region].short} ${rttOf(region, node.region)} ms`
      : node.spread && (node.type === 'wide' || node.type === 'dsql')
        ? 'Spread'
        : ''
  return [remote, zone, copies].filter(Boolean).join(' · ')
}

export const footerOf = (game: Game, node: GameNode): Footer | null => {
  if (!layoutOf(node.type).footer) return null
  if (node.type === 'payments') {
    if (has(game, 'stripe'))
      return { glyph: 'auto', text: 'Collected automatically', enabled: false, tone: 'muted' }
    return game.pending >= 0.01
      ? { glyph: 'collect', text: `Collect  ${money(game.pending)}`, enabled: true, tone: 'ok' }
      : { glyph: 'empty', text: 'Drawer empty', enabled: false, tone: 'muted' }
  }
  if (node.down === -1) {
    const price = replacePrice(game, node)
    return {
      glyph: 'replace',
      text: `Replace  ${priceLabel(game.sandbox, price)}`.trim(),
      enabled: game.cash >= price,
      tone: 'danger',
    }
  }
  const price = resizePrice(game, node)
  if (price === null) return { glyph: 'max', text: 'Largest size', enabled: false, tone: 'muted' }
  const analytics = node.type === 'analytics'
  return {
    glyph: analytics ? 'more' : 'resize',
    text: analytics
      ? `Samples  ${priceLabel(game.sandbox, price)}`.trim()
      : `${sizeLabel(node, node.size + 1)}  ${priceLabel(game.sandbox, price)}`.trim(),
    enabled: game.cash >= price,
    tone: game.cash >= price ? 'accent' : 'muted',
  }
}
