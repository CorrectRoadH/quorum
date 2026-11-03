import * as Effect from 'effect/Effect'
import { Mount } from 'foldkit'
import type { Html, HtmlBuilder } from 'foldkit/html'
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
  Check,
  Cpu,
  Database,
  Server,
  X,
  FileArchive,
  Flame,
  Funnel,
  FileBadge,
  Target,
  GitBranch,
  Gauge,
  HeartPulse,
  type IconNode,
  Layers,
  Lock,
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
  TriangleAlert,
  Workflow,
  Fingerprint,
  PowerOff,
  Recycle,
  Repeat,
  ShieldMinus,
} from 'lucide'
import { siStripe } from 'simple-icons'
import {
  COMPONENTS,
  RESEARCH,
  RESEARCH_TRACKS,
  researchList,
  type BuildGroup,
  type ComponentId,
  type ResearchDef,
  type ResearchId,
  type ResearchTrack,
} from '@quorum/simulation/catalog'
import { has, researchReady } from '@quorum/simulation/lookups'
import type { Game } from '@quorum/simulation/state'
import { compact } from '@/game/format.ts'
import { COMPONENT_ICONS, STACK_LOGOS, type StackLogoId } from '@/game/icons.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, FLOAT, PANEL, SCROLL, groupBadge } from './bits.ts'
import { NODE_SIZE, eraName, researchLayout, type Layout, type Placed } from './research-layouts.ts'

/* ==========================================================================
   Research, fullscreen. The tree (research-layouts.ts) scrolls under a fixed
   header. Click an item to read it in the detail card; research it from
   there.
   ========================================================================== */

/** Items that list `id` as a prerequisite. */
const followUps = (id: ResearchId): ReadonlyArray<ResearchDef> =>
  researchList.filter((entry) => entry.requires.includes(id))

/* ---------- state ---------- */

type State = 'owned' | 'buy' | 'saving' | 'locked'

const stateOf = (game: Game, entry: ResearchDef): State =>
  has(game, entry.id)
    ? 'owned'
    : !researchReady(game, entry.id)
      ? 'locked'
      : game.insight >= entry.cost
        ? 'buy'
        : 'saving'

/** The item the side pane shows: the player's pick, else the most useful next one. */
const focusOf = (model: Model): ResearchDef => {
  const game = model.game
  if (model.researchFocus) return RESEARCH[model.researchFocus]
  const action = game.openActions.find((id) => !has(game, id))
  if (action) return RESEARCH[action]
  const ready = researchList
    .filter((entry) => researchReady(game, entry.id) && !has(game, entry.id))
    .toSorted((a, b) => a.cost - b.cost)
  return ready[0] ?? researchList[0] ?? RESEARCH.stripe
}

/* ---------- marks ---------- */

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

const LOOKS: Record<ResearchId, Look> = {
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
  'fw-gin': { group: 'compute', logo: 'gin' },
  'fw-spring-boot': { group: 'compute', logo: 'spring-boot' },
  'fw-aspnet': { group: 'compute', logo: 'aspnet' },
  'fw-phoenix': { group: 'compute', logo: 'phoenix' },
  tracing: { group: 'ops', glyph: Route, hue: 185 },
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
const colorOf = (look: Look): string =>
  'component' in look
    ? `var(--group-${COMPONENTS[look.component].group})`
    : 'glyph' in look
      ? `oklch(0.62 0.15 ${look.hue})`
      : 'logo' in look
        ? (STACK_LOGOS[look.logo].color ?? 'var(--foreground)')
        : look.brand.color

/** The item's mark, at node size or at the side pane's size. Grey when locked. */
const researchMark = (
  entry: ResearchDef,
  size: 'sm' | 'lg',
  muted: boolean,
  h: HtmlBuilder<Message>,
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

/* ---------- nodes ---------- */

const NODE_CLASS: Record<State, string> = {
  owned: 'bg-nested shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
  buy: 'bg-raised shadow-raised hover:brightness-[0.985]',
  saving: 'bg-raised shadow-raised hover:brightness-[0.985]',
  locked: 'border border-dashed border-border bg-canvas hover:bg-foreground/[0.03]',
}

/** The price, or a check once researched. Affordable: a filled pill, the one loud thing on the tree. */
const price = (entry: ResearchDef, state: State, grey: boolean, h: HtmlBuilder<Message>): Html =>
  state === 'owned'
    ? h.span(
        [h.Class('flex items-center gap-1 text-[11px] text-ok')],
        [icon(h, Check, 'size-3'), 'Researched'],
      )
    : h.span(
        [
          h.Class(
            cn(
              FIGURE,
              'flex w-fit items-center gap-1 text-[11px]',
              state === 'buy'
                ? '-ml-0.5 rounded-md bg-primary-fill px-1.5 text-on-primary-fill shadow-primary'
                : grey
                  ? 'text-muted-foreground'
                  : 'text-foreground',
            ),
          ),
        ],
        [state === 'locked' ? icon(h, Lock, 'size-2.5') : h.empty, `${compact(entry.cost)} ◆`],
      )

/** A card's icon, name and price or status; `grey` draws it uncoloured. */
const face = (
  game: Game,
  entry: ResearchDef,
  state: State,
  grey: boolean,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const open = state !== 'owned' && game.openActions.includes(entry.id)
  return [
    researchMark(entry, 'sm', grey, h),
    h.span(
      [h.Class('flex min-w-0 flex-1 flex-col gap-0.5')],
      [
        h.span(
          [
            h.Class(
              cn(
                'flex items-center gap-1 truncate text-[12.5px] leading-tight font-semibold',
                grey ? 'text-muted-foreground' : '',
              ),
            ),
          ],
          [
            h.span([h.Class('truncate')], [entry.name]),
            open ? icon(h, TriangleAlert, 'size-3 shrink-0 text-warn') : h.empty,
          ],
        ),
        price(entry, state, grey, h),
      ],
    ),
  ]
}

/** A card node. Saving up: the card is the progress bar, a coloured copy wiping in from the left. */
const card = (game: Game, entry: ResearchDef, state: State, h: HtmlBuilder<Message>) => {
  const share = Math.min(1, game.insight / entry.cost)
  const color = colorOf(LOOKS[entry.id])
  return state === 'saving'
    ? [
        ...face(game, entry, state, true, h),
        h.span(
          [
            h.Key('fill'),
            h.AriaHidden(true),
            h.Class(
              'absolute inset-0 flex items-center gap-2.5 px-2.5 transition-[clip-path] duration-500 ease-linear',
            ),
            h.Style({
              background: `linear-gradient(to right, color-mix(in oklab, ${color} 8%, var(--raised-top)), color-mix(in oklab, ${color} 22%, var(--raised-top)))`,
              'clip-path': `inset(0 ${(1 - share) * 100}% 0 0)`,
            }),
          ],
          face(game, entry, state, false, h),
        ),
        h.span(
          [
            h.Key('edge'),
            h.AriaHidden(true),
            h.Class('absolute inset-y-0 w-[1.5px] transition-[left] duration-500 ease-linear'),
            h.Style({ left: `${share * 100}%`, background: color, opacity: '0.55' }),
          ],
          [],
        ),
      ]
    : face(game, entry, state, state === 'locked', h)
}

const node = (model: Model, place: Placed, focused: boolean, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const { entry } = place
  const state = stateOf(game, entry)
  // Beyond the next Era: in the fog.
  const far = entry.era > game.stage + 1 && state === 'locked'
  return h.button(
    [
      h.Key(entry.id),
      h.Type('button'),
      h.DataAttribute('research', entry.id),
      h.AriaPressed(focused ? 'true' : 'false'),
      h.OnClick(Message.ResearchFocused({ id: entry.id })),
      h.OnDoubleClick(Message.ResearchBought({ id: entry.id })),
      h.Style({
        left: `${place.x}px`,
        top: `${place.y}px`,
        width: `${NODE_SIZE.w}px`,
        height: `${NODE_SIZE.h}px`,
      }),
      h.Class(
        cn(
          'press absolute flex items-center gap-2.5 overflow-hidden rounded-xl px-2.5 text-left transition-[filter,box-shadow,outline-color,opacity]',
          NODE_CLASS[state],
          focused
            ? 'outline-2 outline-offset-2 outline-primary-strong'
            : 'outline-2 outline-offset-2 outline-transparent',
          far && !focused ? 'opacity-45' : '',
        ),
      ),
    ],
    card(game, entry, state, h),
  )
}

/* ---------- lines ---------- */

const wires = (model: Model, layout: Layout, focus: ResearchDef, h: HtmlBuilder<Message>): Html =>
  h.svg(
    [
      h.AriaHidden(true),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.Class('pointer-events-none absolute inset-0 overflow-visible'),
      h.Width(String(layout.width)),
      h.Height(String(layout.height)),
      h.Fill('none'),
    ],
    layout.wires.map((wire) => {
      const done = wire.from
        ? has(model.game, wire.from)
        : wire.to
          ? has(model.game, wire.to)
          : false
      const lit = focus.id === wire.to || focus.id === wire.from
      return h.path(
        [
          h.Key(wire.key),
          h.D(wire.d),
          h.StrokeWidth(lit ? '2.25' : wire.root ? '2' : '1.5'),
          h.StrokeLinecap('round'),
          h.StrokeLinejoin('round'),
          h.Class(
            cn(
              lit
                ? 'stroke-primary-strong'
                : done
                  ? 'stroke-foreground/40'
                  : wire.root
                    ? 'stroke-foreground/15'
                    : 'stroke-foreground/20',
              'transition-[stroke] duration-150',
            ),
          ),
          ...(done || wire.root ? [] : [h.Attribute('stroke-dasharray', '3 4')]),
        ],
        [],
      )
    }),
  )

/* ---------- the backdrop: Eras and tracks ---------- */

const TRACK_ICONS: Record<ResearchTrack, IconNode> = {
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

const progressOf = (game: Game, track: ResearchTrack) => {
  const entries = researchList.filter((entry) => entry.track === track)
  return { owned: entries.filter((entry) => has(game, entry.id)).length, total: entries.length }
}

const progressBar = (
  game: Game,
  track: ResearchTrack,
  className: string,
  h: HtmlBuilder<Message>,
) => {
  const { owned, total } = progressOf(game, track)
  return h.div(
    [h.Class(cn('flex items-center gap-2', className))],
    [
      h.span(
        [h.Class('h-1 flex-1 overflow-hidden rounded-full bg-well shadow-well')],
        [
          h.span(
            [
              h.Class('block h-full rounded-full bg-ok'),
              h.Style({ width: `${(owned / total) * 100}%` }),
            ],
            [],
          ),
        ],
      ),
      h.span([h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))], [`${owned}/${total}`]),
    ],
  )
}

const eraLabel = (game: Game, era: number, h: HtmlBuilder<Message>) => [
  era > game.stage ? icon(h, Lock, 'size-3') : h.empty,
  eraName(era),
  era === game.stage ? h.span([h.Class('size-1.5 rounded-full bg-ok')], []) : h.empty,
]

const backdrop = (model: Model, layout: Layout, h: HtmlBuilder<Message>) => {
  const game = model.game
  // One band per Era, the current one tinted and the ones ahead washed out.
  const bands = layout.bands.map((band) =>
    h.div(
      [
        h.Key(`era-${band.era}`),
        h.Class(
          cn(
            'absolute border-t border-hairline',
            band.era === game.stage
              ? 'bg-ok/[0.035]'
              : band.era > game.stage + 1
                ? 'bg-foreground/[0.04]'
                : band.era > game.stage
                  ? 'bg-foreground/[0.02]'
                  : '',
          ),
        ),
        h.Style({
          left: `${band.x}px`,
          top: `${band.y}px`,
          width: `${band.w}px`,
          height: `${band.h}px`,
        }),
      ],
      [
        h.span(
          [
            h.Class(
              cn(
                EYEBROW,
                'absolute top-3 left-5 flex items-center gap-1.5',
                band.era === game.stage ? 'text-foreground' : '',
              ),
            ),
          ],
          eraLabel(game, band.era, h),
        ),
      ],
    ),
  )
  const roots = layout.tracks.map((track) =>
    h.div(
      [
        h.Key(`root-${track.track}`),
        h.Class(
          'absolute flex w-[180px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2',
        ),
        h.Style({ left: `${track.x}px`, top: `${track.y}px` }),
      ],
      [
        h.span(
          [h.Class('grid size-14 place-items-center rounded-2xl bg-surface shadow-card')],
          [icon(h, TRACK_ICONS[track.track], 'size-6')],
        ),
        h.span([h.Class('text-[14px] font-semibold')], [track.label]),
        progressBar(game, track.track, 'w-28', h),
      ],
    ),
  )
  return [...bands, ...roots]
}

/* ---------- scrolling ---------- */

/**
 * The screen scrolls like a page. It opens with the focused item in view,
 * and scrolls to an item when the player focuses one that is off screen.
 */
const scrollTo = (host: HTMLElement, target: Element, behavior: ScrollBehavior) => {
  const box = target.getBoundingClientRect()
  const view = host.getBoundingClientRect()
  if (
    box.left > view.left &&
    box.right < view.right &&
    box.top > view.top + 80 &&
    box.bottom < view.bottom - 80
  )
    return
  target.scrollIntoView({ block: 'center', inline: 'center', behavior })
}

const ResearchScroll = Mount.define('ResearchScroll', {
  messages: [Message.Synced],
  execute: ({ element }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const host = element as HTMLElement
        const focused = host.querySelector('[aria-pressed="true"]')
        if (focused) scrollTo(host, focused, 'instant')
        const watch = new MutationObserver((changes) => {
          for (const change of changes)
            if ((change.target as Element).getAttribute('aria-pressed') === 'true')
              scrollTo(host, change.target as Element, 'smooth')
        })
        watch.observe(host, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] })
        const events = new AbortController()
        let start: { id: number; x: number; y: number; left: number; top: number } | null = null
        let dragged = false
        host.addEventListener(
          'pointerdown',
          (event) => {
            if (event.pointerType !== 'mouse' || event.button !== 0) return
            start = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              left: host.scrollLeft,
              top: host.scrollTop,
            }
            dragged = false
          },
          { signal: events.signal },
        )
        host.addEventListener(
          'pointermove',
          (event) => {
            if (!start || start.id !== event.pointerId) return
            if ((event.buttons & 1) === 0) {
              start = null
              host.classList.remove('cursor-grabbing', 'select-none')
              return
            }
            const dx = event.clientX - start.x
            const dy = event.clientY - start.y
            if (!dragged && Math.hypot(dx, dy) < 5) return
            if (!dragged) {
              dragged = true
              host.setPointerCapture(event.pointerId)
              host.classList.add('cursor-grabbing', 'select-none')
            }
            event.preventDefault()
            host.scrollLeft = start.left - dx
            host.scrollTop = start.top - dy
          },
          { signal: events.signal },
        )
        const end = (event: PointerEvent) => {
          if (start?.id !== event.pointerId) return
          start = null
          host.classList.remove('cursor-grabbing', 'select-none')
        }
        host.addEventListener('pointerup', end, { signal: events.signal })
        host.addEventListener('pointercancel', end, { signal: events.signal })
        host.addEventListener(
          'click',
          (event) => {
            if (!dragged || event.detail === 0) return
            event.preventDefault()
            event.stopPropagation()
            dragged = false
          },
          { capture: true, signal: events.signal },
        )
        host.addEventListener('dragstart', (event) => event.preventDefault(), {
          signal: events.signal,
        })
        return { watch, events }
      }),
      ({ watch, events }) =>
        Effect.sync(() => {
          watch.disconnect()
          events.abort()
        }),
    ).pipe(Effect.as(Message.Synced())),
})

/* ---------- the detail card ---------- */

const linkRow = (game: Game, entry: ResearchDef, h: HtmlBuilder<Message>): Html =>
  h.button(
    [
      h.Key(entry.id),
      h.Type('button'),
      h.OnClick(Message.ResearchFocused({ id: entry.id })),
      h.Class(
        'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-foreground/5',
      ),
    ],
    [
      researchMark(entry, 'sm', stateOf(game, entry) === 'locked', h),
      h.span([h.Class('min-w-0 flex-1 truncate')], [entry.name]),
      has(game, entry.id)
        ? icon(h, Check, 'size-3.5 text-ok')
        : icon(h, Lock, 'size-3 text-muted-foreground'),
    ],
  )

const detail = (model: Model, entry: ResearchDef, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const state = stateOf(game, entry)
  const open = state !== 'owned' && game.openActions.includes(entry.id)
  const track = RESEARCH_TRACKS.find((item) => item.key === entry.track)?.label ?? ''
  const missing = entry.requires.filter((id) => !has(game, id))
  const label =
    state === 'owned'
      ? 'Researched'
      : state === 'buy'
        ? `Research · ${compact(entry.cost)} ◆`
        : entry.era > game.stage
          ? `Opens in ${eraName(entry.era)}`
          : missing.length > 0
            ? `Needs ${missing.map((id) => RESEARCH[id].name).join(', ')}`
            : `${compact(entry.cost - game.insight)} ◆ more`
  const follow = followUps(entry.id)
  return h.aside(
    [
      h.Key('detail'),
      h.Class(
        cn(
          FLOAT,
          'absolute right-4 bottom-4 z-10 flex max-h-[calc(100%-96px)] w-[320px] flex-col overflow-hidden compact:right-3 compact:bottom-3 compact:left-3 compact:max-h-[46%] compact:w-auto',
        ),
      ),
    ],
    [
      h.div(
        [h.Key(entry.id), h.Class(`flex min-h-0 flex-1 flex-col gap-4 p-5 ${SCROLL} enter-pop`)],
        [
          h.div(
            [h.Class('flex items-center gap-3')],
            [
              researchMark(entry, 'lg', state === 'locked', h),
              h.div(
                [h.Class('flex min-w-0 flex-col gap-1')],
                [
                  h.span(
                    [h.Class('text-[16px] leading-tight font-semibold tracking-[-0.02em]')],
                    [entry.name],
                  ),
                  h.span([h.Class(EYEBROW)], [`${track} · ${eraName(entry.era)}`]),
                ],
              ),
            ],
          ),
          h.p([h.Class('text-[13px] leading-relaxed text-foreground/85')], [entry.blurb]),
          open
            ? h.div(
                [
                  h.Class(
                    'flex items-start gap-2 rounded-lg bg-[var(--warn-soft)] px-3 py-2 text-[12px] leading-snug text-warn',
                  ),
                ],
                [
                  icon(h, TriangleAlert, 'mt-px size-3.5 shrink-0'),
                  'Open action item. The incident it prevents is twice as likely until you research it.',
                ],
              )
            : h.empty,
          entry.requires.length > 0
            ? h.div(
                [h.Class('flex flex-col gap-1')],
                [
                  h.span([h.Class(cn(EYEBROW, 'px-2'))], ['Requires']),
                  ...entry.requires.map((id) => linkRow(game, RESEARCH[id], h)),
                ],
              )
            : h.empty,
          follow.length > 0
            ? h.div(
                [h.Class('flex flex-col gap-1')],
                [
                  h.span([h.Class(cn(EYEBROW, 'px-2'))], ['Leads to']),
                  ...follow.map((next) => linkRow(game, next, h)),
                ],
              )
            : h.empty,
        ],
      ),
      h.div(
        [h.Class('border-t border-hairline p-3')],
        [
          button(
            {
              onClick: Message.ResearchBought({ id: entry.id }),
              isDisabled: state !== 'buy',
              size: 'lg',
              variant: state === 'buy' ? 'default' : 'outline',
              className: cn(FIGURE, 'w-full'),
            },
            [state === 'owned' ? icon(h, Check, 'size-4 text-ok') : h.empty, label],
            h,
          ),
        ],
      ),
    ],
  )
}

/* ---------- the screen ---------- */

export const researchPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const focus = focusOf(model)
  const layout = researchLayout()
  return h.div(
    [
      h.Key('research'),
      h.DataAttribute('exit', 'gesture'),
      h.Class('absolute inset-0 z-30 bg-canvas enter-backdrop'),
    ],
    [
      h.div(
        [
          h.Key('scroll'),
          h.OnMount(ResearchScroll()),
          h.Class(`absolute inset-0 cursor-grab ${SCROLL}`),
        ],
        [
          // Room above for the header, and to the right and below for the detail card.
          h.div(
            [h.Class('w-fit pt-20 pr-[360px] pb-10 pl-4 compact:pr-4 compact:pb-[50vh]')],
            [
              h.div(
                [
                  h.Class('relative'),
                  h.Style({ width: `${layout.width}px`, height: `${layout.height}px` }),
                ],
                [
                  ...backdrop(model, layout, h),
                  wires(model, layout, focus, h),
                  ...[...layout.placed.values()].map((place) =>
                    node(model, place, place.entry.id === focus.id, h),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      h.div(
        [
          h.Class(
            'pointer-events-none absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3 compact:inset-x-3 compact:top-[max(12px,env(safe-area-inset-top))]',
          ),
        ],
        [
          h.div(
            [h.Class(cn(PANEL, 'pointer-events-auto flex items-baseline gap-4 px-4 py-2.5'))],
            [
              h.span([h.Class('text-[17px] font-semibold tracking-[-0.025em]')], ['Research']),
              h.span(
                [h.Class(cn(FIGURE, 'flex items-baseline gap-1.5 text-[15px]'))],
                [
                  compact(model.game.insight),
                  h.span([h.Class('text-[11px] text-muted-foreground')], ['Insight ◆']),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class(cn(PANEL, 'pointer-events-auto p-1'))],
            [
              button(
                {
                  onClick: Message.PanelClosed(),
                  variant: 'ghost',
                  size: 'icon',
                  className: 'text-muted-foreground',
                  attributes: [h.AriaLabel('Close (Esc)')],
                },
                icon(h, X, 'size-4'),
                h,
              ),
            ],
          ),
        ],
      ),
      detail(model, focus, h),
    ],
  )
}
