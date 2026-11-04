import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import {
  Antenna,
  ArchiveRestore,
  BadgeCheck,
  Boxes,
  DatabaseZap,
  FileLock,
  Globe,
  Handshake,
  HardDriveDownload,
  Landmark,
  LockKeyhole,
  Radio,
  RefreshCcwDot,
  ScanSearch,
  ShieldCheck,
  Split,
  TrendingUp,
  Waypoints,
  Zap,
  Cable,
  CloudOff,
  ChartColumnIncreasing,
  ChartLine,
  FileArchive,
  Flame,
  Funnel,
  FileBadge,
  Target,
  GitBranch,
  Copy,
  Gauge,
  HeartPulse,
  Layers,
  Network,
  Rocket,
  Route,
  ScanEye,
  ScrollText,
  SearchCode,
  Snowflake,
  Shuffle,
  Siren,
  TestTube,
  Timer,
  Workflow,
  Fingerprint,
  PowerOff,
  Recycle,
  Repeat,
  ShieldMinus,
  Cpu,
  Database,
  Server,
  type IconNode,
} from 'lucide'
import { siStripe } from 'simple-icons'
import {
  COMPONENTS,
  type BuildGroup,
  type ComponentId,
  type ResearchDef,
  type ResearchId,
  type ResearchTrack,
} from '@quorum/simulation/catalog'
import { groupBadge } from './bits.ts'
import { COMPONENT_ICONS, STACK_LOGOS, type StackLogoId } from './icons.ts'

/* The mark each Research item wears, in the game's Research tree and on the wiki. */

/**
 * How each item looks. An item that unlocks a Component wears that
 * Component's badge. The rest wear the badge shape of the part of the system
 * they change (Edge hexagon, Compute chip, Data disc, Ops diamond), in their
 * own colour: a brand colour, or an OKLCH hue angle.
 */
type Look =
  | Readonly<{ component: ComponentId }>
  | Readonly<{ group: BuildGroup; logo: StackLogoId }>
  | Readonly<{ group: BuildGroup; brand: Readonly<{ path: string; color: string }> }>
  | Readonly<{ group: BuildGroup; glyph: IconNode; hue: number }>

export const LOOKS: Record<ResearchId, Look> = {
  stripe: { group: 'ops', brand: { path: siStripe.path, color: `#${siStripe.hex}` } },
  'dns-rr': { component: 'dns' },
  'load-balancing': { component: 'lb' },
  'health-checks': { group: 'edge', glyph: HeartPulse, hue: 15 },
  'auth-provider': { component: 'auth' },
  caching: { component: 'cache' },
  pooling: { component: 'pooler' },
  replication: { component: 'replica' },
  'eager-loading': { group: 'data', glyph: Layers, hue: 50 },
  'query-analysis': { group: 'data', glyph: SearchCode, hue: 80 },
  logs: { group: 'ops', glyph: ScrollText, hue: 250 },
  metrics: { group: 'ops', glyph: ChartLine, hue: 205 },
  percentiles: { group: 'ops', glyph: ChartColumnIncreasing, hue: 275 },
  alerting: { group: 'ops', glyph: Siren, hue: 30 },
  funnels: { group: 'ops', glyph: Funnel, hue: 135 },
  'php-fpm': { group: 'compute', glyph: Boxes, hue: 290 },
  opcache: { group: 'compute', glyph: Rocket, hue: 325 },
  'lang-ruby': { group: 'compute', logo: 'ruby' },
  'lang-node': { group: 'compute', logo: 'node' },
  'lang-python': { group: 'compute', logo: 'python' },
  'node-cluster': { group: 'compute', glyph: Network, hue: 150 },
  'libuv-pool': { group: 'compute', glyph: Workflow, hue: 180 },
  'fw-laravel': { group: 'compute', logo: 'laravel' },
  'fw-rails': { group: 'compute', logo: 'rails' },
  'fw-express': { group: 'compute', logo: 'express' },
  'fw-django': { group: 'compute', logo: 'django' },
  'fw-symfony': { group: 'compute', logo: 'symfony' },
  'fw-sinatra': { group: 'compute', logo: 'sinatra' },
  'fw-flask': { group: 'compute', logo: 'flask' },
  keepalive: { group: 'edge', glyph: Cable, hue: 200 },
  gzip: { group: 'edge', glyph: FileArchive, hue: 95 },
  timeouts: { group: 'edge', glyph: Timer, hue: 60 },
  'lb-algorithms': { group: 'edge', glyph: Shuffle, hue: 240 },
  ci: { group: 'ops', glyph: GitBranch, hue: 160 },
  'code-review': { group: 'ops', glyph: ScanEye, hue: 300 },
  'testing-culture': { group: 'ops', glyph: TestTube, hue: 110 },
  'full-text-search': { component: 'search' },
  'object-storage': { component: 'storage' },
  cdn: { component: 'cdn' },
  waf: { component: 'waf' },
  'background-jobs': { component: 'worker' },
  queues: { component: 'queue' },
  'stampede-protection': { group: 'data', glyph: Flame, hue: 25 },
  'cache-warming': { group: 'data', glyph: Snowflake, hue: 220 },
  'lang-go': { group: 'compute', logo: 'go' },
  'lang-java': { group: 'compute', logo: 'java' },
  'lang-csharp': { group: 'compute', logo: 'csharp' },
  'lang-elixir': { group: 'compute', logo: 'elixir' },
  'lang-rust': { group: 'compute', logo: 'rust' },
  'lang-zig': { group: 'compute', logo: 'zig' },
  'lang-haskell': { group: 'compute', logo: 'haskell' },
  'fw-gin': { group: 'compute', logo: 'gin' },
  'fw-spring-boot': { group: 'compute', logo: 'spring-boot' },
  'fw-aspnet': { group: 'compute', logo: 'aspnet' },
  'fw-phoenix': { group: 'compute', logo: 'phoenix' },
  tracing: { group: 'ops', glyph: Route, hue: 185 },
  'trace-search': { group: 'ops', glyph: Route, hue: 200 },
  notebooks: { group: 'ops', glyph: Route, hue: 215 },
  'cert-automation': { group: 'edge', glyph: FileBadge, hue: 120 },
  checkout: { component: 'psp' },
  'tiered-caching': { group: 'edge', glyph: Layers, hue: 170 },
  'multi-az': { group: 'edge', glyph: CloudOff, hue: 345 },
  autoscaling: { component: 'autoscaler' },
  containers: { component: 'cluster' },
  'slo-dashboards': { group: 'ops', glyph: Target, hue: 140 },
  'error-budgets': { group: 'ops', glyph: Gauge, hue: 95 },
  'backoff-jitter': { group: 'edge', glyph: Repeat, hue: 75 },
  'circuit-breakers': { group: 'edge', glyph: PowerOff, hue: 10 },
  'load-shedding': { group: 'compute', glyph: ShieldMinus, hue: 40 },
  'idempotency-keys': { group: 'data', glyph: Fingerprint, hue: 150 },
  'ryw-routing': { group: 'data', glyph: Repeat, hue: 260 },
  'gogc-tuning': { group: 'compute', glyph: Recycle, hue: 195 },
  zgc: { group: 'compute', glyph: Recycle, hue: 30 },
  'fw-axum': { group: 'compute', logo: 'axum' },
  'fw-actix': { group: 'compute', logo: 'actix' },
  'data-warehouse': { component: 'warehouse' },
  'hosted-models': { component: 'llm' },
  'model-serving': { component: 'gpu' },
  pitr: { group: 'data', glyph: ArchiveRestore, hue: 220 },
  'tls-everywhere': { group: 'edge', glyph: LockKeyhole, hue: 145 },
  http2: { group: 'edge', glyph: Zap, hue: 95 },
  'sync-replication': { group: 'data', glyph: RefreshCcwDot, hue: 175 },
  'restore-drills': { group: 'ops', glyph: HardDriveDownload, hue: 200 },
  'dependency-scanning': { group: 'ops', glyph: ScanSearch, hue: 340 },
  sharding: { group: 'data', glyph: Split, hue: 260 },
  'encryption-at-rest': { group: 'data', glyph: FileLock, hue: 125 },
  'multi-region': { group: 'edge', glyph: Globe, hue: 210 },
  'geo-dns': { group: 'edge', glyph: Waypoints, hue: 190 },
  'infra-as-code': { group: 'edge', glyph: Copy, hue: 260 },
  gitops: { group: 'edge', glyph: GitBranch, hue: 280 },
  anycast: { group: 'edge', glyph: Antenna, hue: 230 },
  http3: { group: 'edge', glyph: Radio, hue: 110 },
  notifications: { component: 'msgp' },
  'hybrid-fanout': { group: 'data', glyph: Shuffle, hue: 40 },
  leaderless: { component: 'wide' },
  consensus: { component: 'dsql' },
  'dr-drills': { group: 'ops', glyph: DatabaseZap, hue: 10 },
  soc2: { group: 'ops', glyph: BadgeCheck, hue: 155 },
  'gdpr-residency': { group: 'data', glyph: Landmark, hue: 240 },
  'security-team': { group: 'ops', glyph: ShieldCheck, hue: 300 },
  'investor-relations': { group: 'ops', glyph: Handshake, hue: 60 },
  'guidance-modeling': { group: 'ops', glyph: TrendingUp, hue: 85 },
}

/** The item's own colour: its group's, its brand's, or its hue. */
export const colorOf = (look: Look): string =>
  'component' in look
    ? `var(--group-${COMPONENTS[look.component].group})`
    : 'glyph' in look
      ? `oklch(0.62 0.15 ${look.hue})`
      : 'logo' in look
        ? (STACK_LOGOS[look.logo].color ?? 'var(--foreground)')
        : look.brand.color

/** The item's mark, at node size or at the side pane's size. Grey when locked. */
export const researchMark = <M>(
  entry: ResearchDef,
  size: 'sm' | 'lg',
  muted: boolean,
  h: HtmlBuilder<M>,
): Html => {
  const look = LOOKS[entry.id]
  const badge =
    'component' in look
      ? groupBadge(
          COMPONENTS[look.component].group,
          COMPONENT_ICONS[look.component],
          size === 'lg' ? 'size-11' : 'size-7',
          h,
          muted,
        )
      : groupBadge(
          look.group,
          'glyph' in look
            ? look.glyph
            : { path: 'logo' in look ? STACK_LOGOS[look.logo].path : look.brand.path },
          size === 'lg' ? 'size-11' : 'size-7',
          h,
          muted,
          colorOf(look),
        )
  return h.span(
    [h.Class(cn('grid shrink-0 place-items-center', size === 'lg' ? 'size-12' : 'size-8'))],
    [badge],
  )
}

/** Each Research track's icon, at the root of its trunk. */
export const TRACK_ICONS: Record<ResearchTrack, IconNode> = {
  infrastructure: Server,
  data: Database,
  reliability: HeartPulse,
  observability: ChartLine,
  performance: Gauge,
  runtimes: Cpu,
  frameworks: Boxes,
  security: ShieldCheck,
  product: Rocket,
}
