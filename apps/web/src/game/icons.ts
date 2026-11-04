import {
  Activity,
  BellRing,
  Columns3,
  Network,
  Boxes,
  ChartLine,
  Combine,
  Cpu,
  CreditCard,
  Cog,
  Database,
  DatabaseBackup,
  Earth,
  Globe,
  HardDrive,
  type IconNode,
  KeyRound,
  Landmark,
  Microchip,
  Sparkles,
  Warehouse,
  ListOrdered,
  Scaling,
  Search,
  Server,
  Shield,
  Split,
  Users,
  Zap,
} from 'lucide'
import {
  siDjango,
  siDotnet,
  siElixir,
  siExpress,
  siFlask,
  siGin,
  siGo,
  siLaravel,
  siNodedotjs,
  siOpenjdk,
  siPhoenixframework,
  siPhp,
  siPython,
  siRuby,
  siRubyonrails,
  siRust,
  siZig,
  siHaskell,
  siActix,
  siTokio,
  siSpringboot,
  siSymfony,
} from 'simple-icons'
import type { BuildGroup, ComponentId, FrameworkId, LanguageId } from '@quorum/simulation/catalog'

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
  search: Search,
  storage: HardDrive,
  queue: ListOrdered,
  worker: Cog,
  cdn: Earth,
  waf: Shield,
  psp: Landmark,
  autoscaler: Scaling,
  cluster: Boxes,
  warehouse: Warehouse,
  gpu: Microchip,
  llm: Sparkles,
  msgp: BellRing,
  wide: Columns3,
  dsql: Network,
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
  symfony: { path: siSymfony.path, color: null },
  // Simple Icons has no Sinatra mark: it wears Ruby's.
  sinatra: { path: siRuby.path, color: '#B4302A' },
  flask: { path: siFlask.path, color: `#${siFlask.hex}` },
  go: { path: siGo.path, color: `#${siGo.hex}` },
  java: { path: siOpenjdk.path, color: null },
  // Simple Icons has no C# mark: C# and ASP.NET Core wear .NET's.
  csharp: { path: siDotnet.path, color: `#${siDotnet.hex}` },
  elixir: { path: siElixir.path, color: `#${siElixir.hex}` },
  rust: { path: siRust.path, color: null },
  zig: { path: siZig.path, color: `#${siZig.hex}` },
  haskell: { path: siHaskell.path, color: `#${siHaskell.hex}` },
  gin: { path: siGin.path, color: `#${siGin.hex}` },
  'spring-boot': { path: siSpringboot.path, color: `#${siSpringboot.hex}` },
  aspnet: { path: siDotnet.path, color: `#${siDotnet.hex}` },
  phoenix: { path: siPhoenixframework.path, color: `#${siPhoenixframework.hex}` },
  axum: { path: siTokio.path, color: null },
  actix: { path: siActix.path, color: null },
}
