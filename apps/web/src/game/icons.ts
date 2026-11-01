import {
  Activity,
  ChartLine,
  Combine,
  Cpu,
  CreditCard,
  Database,
  DatabaseBackup,
  Globe,
  type IconNode,
  KeyRound,
  Server,
  Split,
  Users,
  Zap,
} from 'lucide'
import {
  siDjango,
  siExpress,
  siLaravel,
  siNodedotjs,
  siPhp,
  siPython,
  siRuby,
  siRubyonrails,
} from 'simple-icons'
import type { BuildGroup, ComponentId, FrameworkId, LanguageId } from './engine/catalog.ts'

/** One glyph per Component, shared by the board, the dock and the inspector. */
export const COMPONENT_ICONS: Record<ComponentId, IconNode> = {
  users: Users,
  payments: CreditCard,
  analytics: ChartLine,
  server: Server,
  database: Database,
  dns: Globe,
  lb: Split,
  pooler: Combine,
  cache: Zap,
  replica: DatabaseBackup,
  auth: KeyRound,
}

export const GROUP_ICONS: Record<BuildGroup, IconNode> = {
  edge: Globe,
  compute: Cpu,
  data: Database,
  ops: Activity,
}

/**
 * Each build group has a colour and a badge shape, so a Node's place in the
 * Design reads before its name: Edge hexagons, Compute chips, Data discs,
 * Ops diamonds. The colours are `--group-*` tokens in styles.css.
 */
export type GroupShape = 'hexagon' | 'chip' | 'disc' | 'diamond'

export const GROUP_SHAPES: Record<BuildGroup, GroupShape> = {
  edge: 'hexagon',
  compute: 'chip',
  data: 'disc',
  ops: 'diamond',
}

export type StackLogoId = LanguageId | Exclude<FrameworkId, 'none'>

/**
 * Brand marks for languages and frameworks, from Simple Icons (CC0), as one
 * filled 24×24 path each. `color` is null for a mark that is black by brand,
 * so it takes the ink colour and stays visible on the dark theme.
 */
export const STACK_LOGOS: Record<StackLogoId, Readonly<{ path: string; color: string | null }>> = {
  php: { path: siPhp.path, color: `#${siPhp.hex}` },
  ruby: { path: siRuby.path, color: `#${siRuby.hex}` },
  node: { path: siNodedotjs.path, color: `#${siNodedotjs.hex}` },
  python: { path: siPython.path, color: `#${siPython.hex}` },
  laravel: { path: siLaravel.path, color: `#${siLaravel.hex}` },
  rails: { path: siRubyonrails.path, color: `#${siRubyonrails.hex}` },
  express: { path: siExpress.path, color: null },
  // Django's brand green is near black; its lighter secondary green reads on both themes.
  django: { path: siDjango.path, color: '#44B78B' },
}
