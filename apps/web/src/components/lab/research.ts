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
  ERAS,
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
import { EYEBROW, FIGURE, SCROLL, groupBadge } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   Research as a tech tree: a lane per track, a column per Era, and a line
   from each prerequisite to what it opens. The layout comes from the
   catalog alone, so it is computed once and the lines need no measuring.
   Click an item to read it in the side pane; research it from there.
   ========================================================================== */

const NODE_W = 176
const NODE_H = 48
const GAP_X = 12
const GAP_Y = 8
const PAD = 12
const SLOTS = 2
const COLUMN_W = SLOTS * NODE_W + (SLOTS - 1) * GAP_X + PAD * 2
const LABEL_W = 132
const HEADER_H = 30
/** The column that stands for the Eras after the next one. */
const LATER_W = 120

type Placed = Readonly<{ entry: ResearchDef; x: number; y: number }>
type Lane = Readonly<{ track: ResearchTrack; label: string; y: number; h: number }>

const ERA_COLUMNS = [...new Set(researchList.map((entry) => entry.era))].toSorted((a, b) => a - b)

const slotX = (column: number, slot: number): number =>
  LABEL_W + column * COLUMN_W + PAD + slot * (NODE_W + GAP_X)

/**
 * Places every item so no line crosses a node. Within a cell, in order:
 * an item and its in-cell follow-up share a line; an item whose prerequisite
 * is in an earlier Era starts its own line, so the line runs straight in;
 * an item whose prerequisite is in a lane above takes the same slot, so the
 * line drops straight down; the rest fill the free slots.
 */
const layoutFor = (columns: number) => {
  const eras = ERA_COLUMNS.slice(0, columns)
  const placed = new Map<ResearchId, Placed>()
  const lanes: Array<Lane> = []
  let top = HEADER_H
  // A track with nothing in the visible Eras has no lane yet.
  const tracks = RESEARCH_TRACKS.filter((track) =>
    researchList.some((entry) => entry.track === track.key && eras.includes(entry.era)),
  )
  for (const track of tracks) {
    // Slot assignments per column: grid[column][line][slot].
    const grid = eras.map((era, column) => {
      const cell = researchList.filter((entry) => entry.track === track.key && entry.era === era)
      const inCell = new Set(cell.map((entry) => entry.id))
      const rows: Array<Array<ResearchDef | null>> = []
      const put = (entry: ResearchDef, slot: number | null) => {
        const line =
          slot === null
            ? rows.findIndex((row) => row.includes(null))
            : rows.findIndex((row) => row[slot] === null)
        const row = line >= 0 ? rows[line] : null
        if (row) row[slot ?? row.indexOf(null)] = entry
        else {
          const fresh: Array<ResearchDef | null> = Array.from({ length: SLOTS }, () => null)
          fresh[slot ?? 0] = entry
          rows.push(fresh)
        }
      }
      const parent = (entry: ResearchDef) => {
        const id = entry.requires.find((needed) => !inCell.has(needed))
        return id ? RESEARCH[id] : null
      }
      const roots = cell.filter((entry) => !entry.requires.some((id) => inCell.has(id)))
      const chained = roots.filter((root) => cell.some((entry) => entry.requires.includes(root.id)))
      for (const root of chained)
        rows.push([root, ...cell.filter((entry) => entry.requires.includes(root.id))])
      const loose = roots.filter((root) => !chained.includes(root))
      const earlier = loose.filter((entry) => parent(entry)?.track === track.key)
      const above = loose.filter((entry) => {
        const from = parent(entry)
        return from !== null && from.track !== track.key
      })
      for (const entry of earlier)
        rows.push([entry, ...Array.from({ length: SLOTS - 1 }, () => null)])
      for (const entry of above) {
        const from = placed.get(parent(entry)?.id ?? entry.id)
        const slot = from ? Math.round((from.x - slotX(column, 0)) / (NODE_W + GAP_X)) : 0
        put(entry, Math.max(0, Math.min(SLOTS - 1, slot)))
      }
      for (const entry of loose.filter((item) => !earlier.includes(item) && !above.includes(item)))
        put(entry, null)
      // Place now, so later columns of this lane can line up with it.
      rows.forEach((row, line) =>
        row.forEach((entry, slot) => {
          if (entry)
            placed.set(entry.id, {
              entry,
              x: slotX(column, slot),
              y: top + PAD + line * (NODE_H + GAP_Y),
            })
        }),
      )
      return rows
    })
    const lines = Math.max(1, ...grid.map((rows) => rows.length))
    const h = PAD * 2 + lines * NODE_H + (lines - 1) * GAP_Y
    lanes.push({ track: track.key, label: track.label, y: top, h })
    top += h
  }
  const later = researchList.filter((entry) => entry.era > (eras.at(-1) ?? 0)).length
  const width = LABEL_W + eras.length * COLUMN_W + (later > 0 ? LATER_W : 0)
  return { eras, later, placed, lanes, width, height: top }
}

/** The tree shows the current and the next Era; later Eras collapse to a count (15). */
const layouts = new Map<number, ReturnType<typeof layoutFor>>()
const layoutOf = (game: Game): ReturnType<typeof layoutFor> => {
  const columns = ERA_COLUMNS.filter((era) => era <= game.stage + 1).length
  const cached = layouts.get(columns) ?? layoutFor(columns)
  layouts.set(columns, cached)
  return cached
}

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

/* ---------- the tree ---------- */

const NODE_CLASS: Record<State, string> = {
  owned: 'bg-nested shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
  buy: 'bg-raised shadow-raised hover:brightness-[0.985]',
  saving: 'bg-raised shadow-raised hover:brightness-[0.985]',
  locked: 'border border-dashed border-border hover:bg-foreground/[0.03]',
}

/** A node's icon, name and price or status; `grey` draws it uncoloured. */
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
                    // Affordable: the price is a filled pill, the one loud thing on the tree.
                    state === 'buy'
                      ? '-ml-0.5 rounded-md bg-primary-fill px-1.5 text-on-primary-fill shadow-primary'
                      : grey
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                  ),
                ),
              ],
              [
                state === 'locked' ? icon(h, Lock, 'size-2.5') : h.empty,
                `${compact(entry.cost)} ◆`,
              ],
            ),
      ],
    ),
  ]
}

const node = (model: Model, place: Placed, focused: boolean, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const { entry } = place
  const state = stateOf(game, entry)
  const share = Math.min(1, game.insight / entry.cost)
  const color = colorOf(LOOKS[entry.id])
  return h.button(
    [
      h.Key(entry.id),
      h.Type('button'),
      h.AriaPressed(focused ? 'true' : 'false'),
      h.OnClick(Message.ResearchFocused({ id: entry.id })),
      h.OnDoubleClick(Message.ResearchBought({ id: entry.id })),
      h.Style({
        left: `${place.x}px`,
        top: `${place.y}px`,
        width: `${NODE_W}px`,
        height: `${NODE_H}px`,
      }),
      h.Class(
        cn(
          'press absolute flex items-center gap-2.5 overflow-hidden rounded-xl px-2.5 text-left transition-[filter,box-shadow,outline-color]',
          NODE_CLASS[state],
          focused
            ? 'outline-2 outline-offset-2 outline-primary-strong'
            : 'outline-2 outline-offset-2 outline-transparent',
        ),
      ),
    ],
    state === 'saving'
      ? [
          // Saving up: the card is the progress bar. It rests grey, and a
          // coloured copy wipes in from the left as Insight comes in.
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
      : face(game, entry, state, state === 'locked', h),
  )
}

/** One prerequisite line: across when the follow-up is to the right, else down. */
const connector = (from: Placed, to: Placed): string => {
  if (to.x >= from.x + NODE_W) {
    const ax = from.x + NODE_W
    const ay = from.y + NODE_H / 2
    const bx = to.x
    const by = to.y + NODE_H / 2
    const bend = Math.max(6, (bx - ax) / 2)
    return `M${ax} ${ay} C${ax + bend} ${ay} ${bx - bend} ${by} ${bx} ${by}`
  }
  const ax = from.x + NODE_W / 2
  const ay = from.y + NODE_H
  const bx = to.x + NODE_W / 2
  const by = to.y
  const bend = Math.max(6, (by - ay) / 2)
  return `M${ax} ${ay} C${ax} ${ay + bend} ${bx} ${by - bend} ${bx} ${by}`
}

const lines = (model: Model, focus: ResearchDef, h: HtmlBuilder<Message>): Html => {
  const layout = layoutOf(model.game)
  return h.svg(
    [
      h.AriaHidden(true),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.Class('pointer-events-none absolute inset-0 overflow-visible'),
      h.Width(String(layout.width)),
      h.Height(String(layout.height)),
      h.Fill('none'),
    ],
    researchList.flatMap((entry) =>
      entry.requires.flatMap((id) => {
        const from = layout.placed.get(id)
        const to = layout.placed.get(entry.id)
        if (!from || !to) return []
        const done = has(model.game, id)
        const lit = focus.id === entry.id || focus.id === id
        return [
          h.path(
            [
              h.Key(`${id}>${entry.id}`),
              h.D(connector(from, to)),
              h.StrokeWidth(lit ? '2' : '1.5'),
              h.StrokeLinecap('round'),
              h.Class(
                cn(
                  lit
                    ? 'stroke-primary-strong'
                    : done
                      ? 'stroke-foreground/35'
                      : 'stroke-foreground/20',
                  'transition-[stroke] duration-150',
                ),
              ),
              ...(done ? [] : [h.Attribute('stroke-dasharray', '3 4')]),
            ],
            [],
          ),
        ]
      }),
    ),
  )
}

const tree = (model: Model, focus: ResearchDef, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const layout = layoutOf(game)
  return h.div(
    [
      h.Class('relative shrink-0'),
      h.Style({ width: `${layout.width}px`, height: `${layout.height}px` }),
    ],
    [
      // Era columns, with the ones not reached yet washed out.
      ...layout.eras.map((era, column) =>
        h.div(
          [
            h.Key(`era-${era}`),
            h.Class(
              cn(
                'absolute top-0 bottom-0 border-l border-hairline',
                era > game.stage ? 'bg-foreground/[0.025]' : '',
              ),
            ),
            h.Style({ left: `${LABEL_W + column * COLUMN_W}px`, width: `${COLUMN_W}px` }),
          ],
          [
            h.span(
              [
                h.Class(
                  cn(
                    EYEBROW,
                    'absolute top-1.5 flex items-center gap-1.5',
                    era === game.stage ? 'text-foreground' : '',
                  ),
                ),
                h.Style({ left: `${PAD}px` }),
              ],
              [
                era > game.stage ? icon(h, Lock, 'size-3') : h.empty,
                ERAS[era]?.name ?? '',
                era === game.stage ? h.span([h.Class('size-1.5 rounded-full bg-ok')], []) : h.empty,
              ],
            ),
          ],
        ),
      ),
      layout.later > 0
        ? h.div(
            [
              h.Key('era-later'),
              h.Title(`${layout.later} items in later Eras`),
              h.Class('absolute top-0 bottom-0 border-l border-hairline bg-foreground/[0.025]'),
              h.Style({
                left: `${LABEL_W + layout.eras.length * COLUMN_W}px`,
                width: `${LATER_W}px`,
              }),
            ],
            [
              h.span(
                [
                  h.Class(cn(EYEBROW, 'absolute top-1.5 flex items-center gap-1.5')),
                  h.Style({ left: `${PAD}px` }),
                ],
                [icon(h, Lock, 'size-3'), `+${layout.later}`],
              ),
            ],
          )
        : h.empty,
      // Track lanes: a label with progress, and a hairline between lanes.
      ...layout.lanes.map((lane, index) => {
        const entries = researchList.filter((entry) => entry.track === lane.track)
        const owned = entries.filter((entry) => has(game, entry.id)).length
        return h.div(
          [
            h.Key(`lane-${lane.track}`),
            h.Class(cn('absolute right-0 left-0', index > 0 ? 'border-t border-hairline' : '')),
            h.Style({ top: `${lane.y}px`, height: `${lane.h}px` }),
          ],
          [
            h.div(
              [
                h.Class('absolute flex flex-col gap-1.5'),
                h.Style({ left: '0px', top: `${PAD + 4}px`, width: `${LABEL_W - 20}px` }),
              ],
              [
                h.span([h.Class('text-[13px] font-semibold')], [lane.label]),
                h.div(
                  [h.Class('flex items-center gap-2')],
                  [
                    h.span(
                      [h.Class('h-1 flex-1 overflow-hidden rounded-full bg-well shadow-well')],
                      [
                        h.span(
                          [
                            h.Class('block h-full rounded-full bg-ok'),
                            h.Style({ width: `${(owned / entries.length) * 100}%` }),
                          ],
                          [],
                        ),
                      ],
                    ),
                    h.span(
                      [h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))],
                      [`${owned}/${entries.length}`],
                    ),
                  ],
                ),
              ],
            ),
          ],
        )
      }),
      lines(model, focus, h),
      ...[...layout.placed.values()].map((place) =>
        node(model, place, place.entry.id === focus.id, h),
      ),
    ],
  )
}

/* ---------- the side pane ---------- */

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
          ? `Opens in ${ERAS[entry.era]?.name ?? ''}`
          : missing.length > 0
            ? `Needs ${missing.map((id) => RESEARCH[id].name).join(', ')}`
            : `${compact(entry.cost - game.insight)} ◆ more`
  const follow = followUps(entry.id)
  return h.aside(
    [
      h.Key('detail'),
      h.Class(
        'flex w-[300px] shrink-0 flex-col border-l border-hairline bg-nested narrow:max-h-[46%] narrow:w-auto narrow:border-t narrow:border-l-0',
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
                  h.span([h.Class(EYEBROW)], [`${track} · ${ERAS[entry.era]?.name ?? ''}`]),
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

export const researchPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const focus = focusOf(model)
  return shell(
    'Research',
    [
      h.span(
        [h.Class(cn(FIGURE, 'flex items-baseline gap-1.5 text-[15px]'))],
        [
          compact(model.game.insight),
          h.span([h.Class('text-[11px] text-muted-foreground')], ['Insight ◆']),
        ],
      ),
    ],
    [
      h.div(
        [h.Class('flex min-h-0 flex-1 border-t border-hairline narrow:flex-col')],
        [
          h.div(
            [h.Class(`min-h-0 min-w-0 flex-1 px-5 pt-2 pb-5 ${SCROLL}`)],
            [tree(model, focus, h)],
          ),
          detail(model, focus, h),
        ],
      ),
    ],
    'max-w-[1260px]',
    h,
  )
}
