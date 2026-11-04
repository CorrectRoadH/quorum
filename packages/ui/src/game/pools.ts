import {
  Bell,
  BookOpen,
  Bot,
  ChartColumn,
  Clapperboard,
  FileText,
  Flame,
  type IconNode,
  KeyRound,
  Package,
  PenLine,
  Radio,
  Rss,
  Search,
  ShoppingCart,
  Sparkles,
  Upload,
  Webhook,
} from 'lucide'
import {
  INSIGHT_POOLS,
  POOLS,
  RECIPE,
  type InsightPool,
  type ResearchId,
} from '@quorum/simulation/catalog'

/*
 * Insight pools as the player sees them (15 "Insight pools"): each has its own
 * shape, so pools differ without colour, and its request kind's particle colour.
 */

export const POOL_ICONS: Record<InsightPool, IconNode> = {
  page: FileText,
  read: BookOpen,
  write: PenLine,
  login: KeyRound,
  search: Search,
  upload: Upload,
  bot: Bot,
  media: Clapperboard,
  rt: Radio,
  buy: ShoppingCart,
  job: Package,
  report: ChartColumn,
  ai: Sparkles,
  feed: Rss,
  hook: Webhook,
  push: Bell,
  failure: Flame,
}

/** The pool's colour as CSS. */
export const poolColor = (pool: InsightPool): string =>
  `#${POOLS[pool].color.toString(16).padStart(6, '0')}`

/** The pool's accessible name, such as "Checkout Insight". */
export const poolName = (pool: InsightPool): string => `${POOLS[pool].label} Insight`

/** Pools in catalog order, for stable rows. */
export const POOL_ORDER: ReadonlyArray<InsightPool> = INSIGHT_POOLS

/** An item's cost, by pool, in pool order. */
export const recipeOf = (id: ResearchId): ReadonlyArray<readonly [InsightPool, number]> =>
  POOL_ORDER.flatMap((pool) => {
    const cost = RECIPE[id][pool]
    return cost ? [[pool, cost] as const] : []
  })
