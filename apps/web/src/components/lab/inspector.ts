import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowUp, ChevronRight, Minus, Plus, RotateCcw, Trash2, X } from 'lucide'
import {
  CACHE_ENGINES,
  CACHE_TTLS,
  CDN_TTLS,
  CHECK_INTERVALS,
  COLLECTORS,
  COMPONENTS,
  GOGC,
  GPU_TYPES,
  CREDIT_CAP,
  DNS_TTLS,
  FAMILIES,
  FAMILY_IDS,
  FRAMEWORKS,
  FRAMEWORK_IDS,
  KINDS,
  LB_POLICIES,
  MAX_ATTEMPTS,
  PM_MODES,
  PREFETCH,
  QUEUE_LENGTHS,
  OS_RAM,
  PARANOIA,
  PROFILES,
  REQUEST_KINDS,
  RUNTIMES,
  RUNTIME_IDS,
  SAMPLE_RATES,
  SCALE_MAXIMA,
  SCALE_TARGETS,
  SIZES,
  STANDBY_TYPES,
  TASKS,
  ZONES,
  type RequestKind,
  type RuntimeId,
  BACKUPS,
  REGION_INFO,
} from '@quorum/simulation/catalog'
import { isGlobal, openRegions, regional, regionUsers } from '@quorum/simulation/regions'
import { platformTax, quartersBehind } from '@quorum/simulation/team'
import type { Ledger } from '@quorum/simulation/ledger'
import {
  burnOf,
  drawerSize,
  eraOf,
  frameworkReady,
  has,
  ramOf,
  refundOf,
  replacePrice,
  resizePrice,
  runtimeReady,
  sizeLabel as sizeLabelOf,
  vcpuOf,
  zoned,
} from '@quorum/simulation/lookups'
import { LINK_TIMEOUTS } from '@quorum/simulation/actions'
import type {
  CacheEngine,
  Game,
  GameLink,
  GameNode,
  LbPolicy,
  PmMode,
} from '@quorum/simulation/state'
import { compact, duration, money, ms, priceLabel, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { COMPONENT_ICONS } from '@/game/icons.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  EYEBROW,
  FIGURE,
  NESTED,
  PANEL,
  SCROLL,
  WELL,
  groupBadge,
  meter,
  row,
  stackLogo,
} from './bits.ts'

/* ==========================================================================
   The inspector: one Node up close. Its numbers and resources, its instance
   type, its Stack if it is an App Server, and the actions it offers.
   ========================================================================== */

const gauge = (
  name: string,
  used: number,
  total: number,
  value: string,
  h: HtmlBuilder<Message>,
  invert = false,
) => {
  const share = total > 0 ? Math.min(1, used / total) : 0
  const level = invert ? 1 - share : share
  const fill = level >= 0.9 ? 'bg-danger' : level >= 0.7 ? 'bg-warn' : 'bg-primary-fill'
  return h.div(
    [h.Key(name), h.Class('flex flex-col gap-1.5 py-0.5')],
    [
      h.div(
        [h.Class('flex items-baseline justify-between')],
        [
          h.span([h.Class('text-[12.5px] text-muted-foreground')], [name]),
          h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'text-[12px]',
                  level >= 0.9 ? 'text-danger' : level >= 0.7 ? 'text-warn' : '',
                ),
              ),
            ],
            [value],
          ),
        ],
      ),
      meter(share, fill, h),
    ],
  )
}

/** A folded section: the title alone until opened. */
const section = (
  title: string,
  children: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
  open = false,
) =>
  h.details(
    [h.Key(title), h.Open(open), h.Class('fold group px-4')],
    [
      h.summary(
        [
          h.Class(
            'flex cursor-pointer list-none items-center gap-1.5 py-2.5 hover:[&>span]:text-foreground [&::-webkit-details-marker]:hidden',
          ),
        ],
        [
          icon(
            h,
            ChevronRight,
            'fold-chevron size-3.5 shrink-0 text-muted-foreground group-open:rotate-90',
          ),
          h.span([h.Class(EYEBROW)], [title]),
        ],
      ),
      h.div([h.Class('flex flex-col gap-2 pb-3')], children),
    ],
  )

/** A segmented control: options sunk in a well, the chosen one raised. */
const segmented = (columns: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div([h.Class(cn('grid gap-[3px] p-[3px]', WELL, 'rounded-[11px]', columns))], children)

const choice = (
  key: string,
  selected: boolean,
  ready: boolean,
  message: Message,
  children: ReadonlyArray<Html | string>,
  title: string,
  h: HtmlBuilder<Message>,
  /** Hovering previews the option on a Tradeoff card. */
  hover?: Message,
) =>
  h.button(
    [
      h.Key(key),
      h.Type('button'),
      h.Title(title),
      h.Disabled(!ready),
      h.AriaPressed(selected ? 'true' : 'false'),
      h.OnClick(message),
      ...(hover && !selected && ready
        ? [h.OnMouseEnter(hover), h.OnMouseLeave(Message.OptionLeft())]
        : []),
      h.Class(
        `flex h-8 min-w-0 items-center gap-2 rounded-lg px-2 text-left text-[12px] font-medium transition-colors ${
          selected
            ? 'bg-raised text-foreground shadow-raised'
            : ready
              ? 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              : 'cursor-not-allowed text-muted-foreground/45 [&_svg]:opacity-45 [&_svg]:grayscale'
        }`,
      ),
    ],
    children,
  )

const COLUMNS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
}

/** One option set as a segmented control: each value with its label. */
const picker = <T extends string | number | boolean>(
  key: string,
  values: ReadonlyArray<readonly [T, string]>,
  current: T,
  message: (value: T) => Message,
  h: HtmlBuilder<Message>,
  ready: (value: T) => boolean = () => true,
  columns = COLUMNS[values.length] ?? 'grid-cols-4',
): Html =>
  segmented(
    columns,
    values.map(([value, label]) =>
      choice(
        `${key}-${String(value)}`,
        value === current,
        ready(value),
        message(value),
        [h.span([h.Class('w-full truncate text-center')], [label])],
        label,
        h,
      ),
    ),
    h,
  )

const smallButton = (
  label: string,
  glyph: Parameters<typeof icon>[1],
  message: Message,
  enabled: boolean,
  h: HtmlBuilder<Message>,
) =>
  button(
    {
      onClick: message,
      isDisabled: !enabled,
      variant: 'outline',
      size: 'icon-sm',
      attributes: [h.AriaLabel(label), h.Title(label)],
    },
    icon(h, glyph, 'size-3.5'),
    h,
  )

const percent = (value: number) => `${Math.round(value * 100)}%`

/* ---------- warnings ---------- */

const callout = (
  text: string,
  tone: 'danger' | 'warn',
  action: Html | null,
  h: HtmlBuilder<Message>,
) =>
  h.div(
    [
      h.Key(text),
      h.Class(
        `mx-4 mb-3 flex flex-col gap-2 rounded-xl px-3 py-2.5 text-[12px] leading-snug ${tone === 'danger' ? 'bg-danger/8 text-danger shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--danger)_25%,transparent)]' : 'bg-warn/10 text-warn shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--warn)_28%,transparent)]'}`,
      ),
    ],
    [h.span([], [text]), ...(action ? [action] : [])],
  )

const warnings = (
  game: Game,
  node: GameNode,
  ledger: Ledger,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const own = ledger.nodes[node.id]
  if (!own) return []
  const list: Array<Html> = []
  if (node.down === -1) {
    const price = replacePrice(game, node)
    list.push(
      callout(
        'The host under this VM died. It still bills.',
        'danger',
        button(
          {
            onClick: Message.ReplaceBought({ nodeId: node.id }),
            isDisabled: game.cash < price,
            variant: 'outline',
            size: 'sm',
            className: 'self-start text-danger',
          },
          ['Replace', h.span([h.Class(FIGURE)], [priceLabel(game.sandbox, price)])],
          h,
        ),
        h,
      ),
    )
  }
  if (own.stranded > 0.01) {
    const names = own.strandedKinds.map((kind) => KINDS[kind].label.toLowerCase()).join(', ')
    list.push(callout(`${rate(own.stranded)}/s of ${names} have nowhere to go.`, 'danger', null, h))
  }
  if (own.refused > 0.01)
    list.push(
      callout(`Refusing ${rate(own.refused)} queries/s: too many connections.`, 'danger', null, h),
    )
  if (own.swapping)
    list.push(callout('Out of RAM and swapping: every request is slower.', 'danger', null, h))
  if (own.throttled)
    list.push(callout('Out of CPU credits: throttled to 20% CPU.', 'warn', null, h))
  if (own.disk)
    list.push(callout('The working set does not fit in RAM: reads hit disk.', 'warn', null, h))
  if (node.leak > 0) {
    list.push(
      callout(
        `Memory grows: ${node.leak.toFixed(1)} GB leaked.`,
        'danger',
        button(
          {
            onClick: Message.RestartChosen({ nodeId: node.id }),
            variant: 'outline',
            size: 'sm',
            className: 'self-start text-danger',
          },
          [icon(h, RotateCcw, 'size-3.5'), 'Restart'],
          h,
        ),
        h,
      ),
    )
  }
  if (node.type === 'cluster' && !game.sandbox) {
    const upgrade = button(
      {
        onClick: Message.TaskQueued({ id: 'upgrade-cluster' }),
        variant: 'outline',
        size: 'sm',
        className: 'self-start',
      },
      [`Upgrade clusters · ${TASKS['upgrade-cluster'].dh} DH`],
      h,
    )
    if (game.incident?.kind === 'cluster-upgrade' && game.incident.nodeId === node.id)
      list.push(
        callout(
          'The provider is forcing an upgrade. Pods that use removed APIs crash.',
          'danger',
          upgrade,
          h,
        ),
      )
    else if (quartersBehind(game, node) > 0)
      list.push(
        callout(
          'Its Kubernetes version is out of support. The provider can force an upgrade.',
          'warn',
          upgrade,
          h,
        ),
      )
    if (platformTax(game) > 0)
      list.push(
        callout(
          `Clusters take ${platformTax(game)} engineers of Dev Hours. A Platform team takes that work.`,
          'warn',
          null,
          h,
        ),
      )
  }
  if (node.type === 'queue' && game.incident?.kind === 'poison' && game.incident.nodeId === node.id)
    list.push(
      callout(
        node.dlq
          ? 'A task keeps failing. The dead-letter queue holds it.'
          : 'A task keeps failing. Workers retry it forever.',
        node.dlq ? 'warn' : 'danger',
        node.dlq
          ? null
          : button(
              {
                onClick: Message.MessageDeleted(),
                variant: 'outline',
                size: 'sm',
                className: 'self-start text-danger',
              },
              ['Delete message'],
              h,
            ),
        h,
      ),
    )
  const fix = (text: string, label: string, message: Message) =>
    list.push(
      callout(
        text,
        'danger',
        button(
          { onClick: message, variant: 'outline', size: 'sm', className: 'self-start text-danger' },
          [label],
          h,
        ),
        h,
      ),
    )
  if (node.type === 'waf' && game.incident?.kind === 'regex')
    fix('A rule backtracks. CPU at 100%.', 'Disable rule', Message.RuleDisabled())
  if (node.type === 'database' && game.incident?.kind === 'report-db')
    fix('A report is scanning every table.', 'Cancel report', Message.ReportCancelled())
  if (
    node.type === 'database' &&
    game.incident?.kind === 'disk-full' &&
    game.incident.nodeId === node.id
  )
    fix('The disk is full. Writes fail.', 'Expand volume', Message.VolumeExpanded())
  if (node.type === 'waf' && game.incident?.kind === 'ddos' && !node.underAttack)
    list.push(
      callout(
        'A flood of junk traffic.',
        'danger',
        button(
          {
            onClick: Message.UnderAttackChosen({ nodeId: node.id, underAttack: true }),
            variant: 'outline',
            size: 'sm',
            className: 'self-start text-danger',
          },
          ['Under attack'],
          h,
        ),
        h,
      ),
    )
  if (node.type === 'database' && game.incident?.kind === 'slow-query') {
    const analysed = has(game, 'query-analysis')
    list.push(
      callout(
        analysed
          ? 'A new query has no index. Every read scans the table.'
          : 'A new query has no index. Research Query analysis to find it.',
        'danger',
        analysed
          ? button(
              {
                onClick: Message.IndexAdded({ nodeId: node.id }),
                variant: 'outline',
                size: 'sm',
                className: 'self-start text-danger',
              },
              ['Add index'],
              h,
            )
          : null,
        h,
      ),
    )
  }
  return list
}

/* ---------- numbers ---------- */

const stats = (
  game: Game,
  node: GameNode,
  ledger: Ledger,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const own = ledger.nodes[node.id]
  if (!own) return []
  switch (node.type) {
    case 'users': {
      const target = eraOf(game).apdexTarget
      return [
        row(
          'Users',
          compact(regional(game) ? regionUsers(game)[node.region] : game.users),
          'plain',
          h,
        ),
        row('Market', compact(ledger.market), 'plain', h),
        row('Requests', `${rate(ledger.demand)}/s`, 'plain', h),
        row('Apdex now', ledger.apdex.toFixed(3), ledger.apdex >= target ? 'ok' : 'danger', h),
        row('Apdex, last hour', game.apdex.toFixed(3), game.apdex >= target ? 'ok' : 'danger', h),
        row('Velocity', `${ledger.velocity.toFixed(2)}×`, 'plain', h),
      ]
    }
    case 'payments':
      return [
        row(
          'In the drawer',
          money(game.pending),
          game.pending >= drawerSize(game, ledger.revenue) * 0.98 ? 'warn' : 'plain',
          h,
        ),
        row('Drawer size', money(drawerSize(game, ledger.revenue)), 'plain', h),
        row('Spilled', money(game.spilled), game.spilled > 0 ? 'warn' : 'plain', h),
        row('Revenue', `${money(ledger.revenue)}/s`, 'ok', h),
        ...(ledger.subscriptions > 0
          ? [row('Subscriptions', `${money(ledger.subscriptions)}/s`, 'ok', h)]
          : []),
        row('Burn', `${money(ledger.burn)}/s`, 'plain', h),
        ...(ledger.salaries > 0
          ? [row('Salaries', `${money(ledger.salaries)}/s`, 'plain', h)]
          : []),
      ]
    case 'analytics':
      return [
        row('Sampling', `${rate(own.inbound)}/s`, 'plain', h),
        row(
          'Kept',
          `${rate(Math.min(own.inbound, own.capacity))} / ${rate(own.capacity)}/s`,
          own.inbound > own.capacity ? 'warn' : 'plain',
          h,
        ),
        row('Burn', `${money(burnOf(game, node))}/s`, 'plain', h),
      ]
    default: {
      const util = own.utilization
      return [
        row('Inbound', `${rate(own.inbound)}/s`, 'plain', h),
        row(
          'Load',
          own.inbound > 0 ? `${percent(util)} of ${rate(own.capacity)}/s` : 'idle',
          util >= 0.9 ? 'danger' : util >= 0.7 ? 'warn' : 'plain',
          h,
        ),
        row('Latency', ms(own.latency), 'plain', h),
        // What a Worker cannot take waits in its Queue: it is not lost.
        node.type === 'worker'
          ? row('Requeued', `${rate(own.dropped)}/s`, own.dropped > 0.05 ? 'warn' : 'plain', h)
          : row('Dropped', `${rate(own.dropped)}/s`, own.dropped > 0.05 ? 'danger' : 'plain', h),
        ...(own.hitRatio !== null ? [row('Hit ratio', percent(own.hitRatio), 'plain', h)] : []),
        ...(own.lag !== null ? [row('Lag', ms(own.lag), 'plain', h)] : []),
        row('Burn', `${money(burnOf(game, node))}/s`, 'plain', h),
      ]
    }
  }
}

const resources = (
  node: GameNode,
  ledger: Ledger,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const own = ledger.nodes[node.id]
  if (!own) return []
  const { cpu, ram, slots, credits } = own.resources
  const list: Array<Html> = []
  if (cpu)
    list.push(
      gauge(
        'CPU',
        cpu.used,
        cpu.total,
        `${cpu.used.toFixed(2)} / ${cpu.total.toFixed(1)} cores`,
        h,
      ),
    )
  if (ram)
    list.push(
      gauge('RAM', ram.used, ram.total, `${ram.used.toFixed(1)} / ${ram.total.toFixed(0)} GB`, h),
    )
  if (slots)
    list.push(
      gauge(
        'Workers busy',
        slots.used,
        slots.total,
        `${slots.used.toFixed(1)} / ${slots.total}`,
        h,
      ),
    )
  if (credits) {
    const cap = CREDIT_CAP * vcpuOf(node)
    list.push(
      gauge(
        'CPU credits',
        credits.balance,
        cap,
        `${Math.round(credits.balance)} · ${credits.rate >= 0 ? '+' : ''}${credits.rate.toFixed(2)}/s`,
        h,
        true,
      ),
    )
  }
  if (own.connections)
    list.push(
      gauge(
        'Connections',
        own.connections.used,
        own.connections.max,
        `${Math.round(own.connections.used)} / ${own.connections.max}`,
        h,
      ),
    )
  return list.length > 0 ? [section('Resources', list, h)] : []
}

const sparkline = (points: ReadonlyArray<number>, h: HtmlBuilder<Message>): Html => {
  const width = 300
  const height = 44
  const top = Math.max(1, ...points)
  const path = points
    .map(
      (value, index) =>
        `${(index / Math.max(1, points.length - 1)) * width},${height - (Math.min(value, top) / top) * height}`,
    )
    .join(' ')
  const limit = height - (1 / top) * height
  return h.svg(
    [
      h.Class('h-11 w-full'),
      h.Attribute('viewBox', `0 0 ${width} ${height}`),
      h.Attribute('preserveAspectRatio', 'none'),
    ],
    [
      h.line([
        h.Attribute('x1', '0'),
        h.Attribute('x2', String(width)),
        h.Attribute('y1', String(limit)),
        h.Attribute('y2', String(limit)),
        h.Attribute('stroke', 'var(--danger)'),
        h.Attribute('stroke-dasharray', '3 3'),
        h.Attribute('stroke-width', '1'),
      ]),
      h.polyline([
        h.Attribute('points', path),
        h.Attribute('fill', 'none'),
        h.Attribute('stroke', 'var(--primary-strong)'),
        h.Attribute('stroke-width', '1.5'),
      ]),
    ],
  )
}

/* ---------- instance and Stack ---------- */

const instance = (game: Game, node: GameNode, h: HtmlBuilder<Message>): Html => {
  const price = resizePrice(game, node)
  return section(
    'Instance',
    [
      h.div(
        [h.Class(cn('flex items-center justify-between gap-2 p-1', WELL))],
        [
          smallButton(
            'Smaller (free)',
            Minus,
            Message.ResizeChosen({ nodeId: node.id, direction: -1 }),
            node.size > 0,
            h,
          ),
          h.span(
            [h.Class(cn(FIGURE, 'flex-1 text-center text-[12.5px]'))],
            [`${SIZES[node.size]?.name ?? ''} · ${vcpuOf(node)} vCPU · ${ramOf(node)} GB`],
          ),
          smallButton(
            price === null ? 'Largest size' : game.sandbox ? 'Larger' : `Larger · ${money(price)}`,
            Plus,
            Message.ResizeChosen({ nodeId: node.id, direction: 1 }),
            price !== null && game.cash >= price,
            h,
          ),
        ],
      ),
      segmented(
        'grid-cols-4',
        FAMILY_IDS.map((id) =>
          choice(
            id,
            node.family === id,
            true,
            Message.OptionChosen({ nodeId: node.id, option: { kind: 'family', id } }),
            [h.span([h.Class('w-full text-center')], [FAMILIES[id].name])],
            FAMILIES[id].blurb,
            h,
            Message.OptionPreviewed({ nodeId: node.id, option: { kind: 'family', id } }),
          ),
        ),
        h,
      ),
    ],
    h,
  )
}

const stack = (
  game: Game,
  node: GameNode,
  h: HtmlBuilder<Message>,
  reviewingRuntime: RuntimeId | null,
): ReadonlyArray<Html> => {
  const runtime = RUNTIMES[node.runtime]
  const frameworks = FRAMEWORK_IDS.filter(
    (id) => id === 'none' || FRAMEWORKS[id].language === runtime.language,
  )
  const fit = Math.max(
    0,
    Math.floor(
      ((ramOf(node) - OS_RAM - (node.localDb ? 1 : 0)) * 1024) /
        (runtime.memory + FRAMEWORKS[node.framework].memory),
    ),
  )
  return [
    section(
      'Runtime',
      [
        segmented(
          'grid-cols-2',
          RUNTIME_IDS.map((id) =>
            choice(
              id,
              node.runtime === id,
              runtimeReady(game, id),
              Message.OptionChosen({ nodeId: node.id, option: { kind: 'runtime', id } }),
              [
                stackLogo(RUNTIMES[id].language, 'size-4', h),
                h.span([h.Class('truncate')], [RUNTIMES[id].name]),
                ...(reviewingRuntime === id
                  ? [h.span([h.Class('text-[10px] text-group-compute')], ['Proposed'])]
                  : []),
              ],
              runtimeReady(game, id)
                ? RUNTIMES[id].blurb
                : `Research ${RUNTIMES[id].name} to unlock`,
              h,
              Message.OptionPreviewed({ nodeId: node.id, option: { kind: 'runtime', id } }),
            ),
          ),
          h,
        ),
        h.p([h.Class('text-[12px] leading-snug text-muted-foreground')], [runtime.blurb]),
      ],
      h,
      reviewingRuntime !== null,
    ),
    ...(runtime.pool
      ? [
          section(
            'Pool size',
            [
              h.div(
                [h.Class('flex items-center gap-2')],
                [
                  smallButton(
                    'Fewer workers',
                    Minus,
                    Message.WorkersChosen({
                      nodeId: node.id,
                      workers: Math.max(1, Math.round(node.workers * 0.75)),
                    }),
                    node.workers > 1,
                    h,
                  ),
                  h.span(
                    [h.Class(cn(FIGURE, 'w-12 text-center text-[13px]'))],
                    [String(node.workers)],
                  ),
                  smallButton(
                    'More workers',
                    Plus,
                    Message.WorkersChosen({
                      nodeId: node.id,
                      workers: Math.max(node.workers + 1, Math.round(node.workers * 1.5)),
                    }),
                    true,
                    h,
                  ),
                  h.span(
                    [
                      h.Class(
                        `ml-auto ${FIGURE} text-[11.5px] ${node.workers > fit ? 'text-danger' : 'text-muted-foreground'}`,
                      ),
                    ],
                    [`RAM fits ${fit}`],
                  ),
                ],
              ),
            ],
            h,
          ),
        ]
      : []),
    section(
      'Framework',
      [
        segmented(
          'grid-cols-2',
          frameworks.map((id) =>
            choice(
              id,
              node.framework === id,
              frameworkReady(game, id),
              Message.OptionChosen({ nodeId: node.id, option: { kind: 'framework', id } }),
              [
                id === 'none' ? h.empty : stackLogo(id, 'size-4', h),
                h.span([h.Class('truncate')], [FRAMEWORKS[id].name]),
              ],
              frameworkReady(game, id)
                ? FRAMEWORKS[id].blurb
                : `Research ${FRAMEWORKS[id].name} to unlock`,
              h,
              Message.OptionPreviewed({ nodeId: node.id, option: { kind: 'framework', id } }),
            ),
          ),
          h,
        ),
        h.p(
          [h.Class('text-[12px] leading-snug text-muted-foreground')],
          [FRAMEWORKS[node.framework].blurb],
        ),
      ],
      h,
    ),
    ...(node.runtime === 'php_fpm'
      ? [
          section(
            'Process manager',
            [
              picker(
                'pm',
                (Object.keys(PM_MODES) as ReadonlyArray<PmMode>).map(
                  (pm) => [pm, PM_MODES[pm].label] as const,
                ),
                node.pm,
                (pm) => Message.PmChosen({ nodeId: node.id, pm }),
                h,
              ),
            ],
            h,
          ),
        ]
      : []),
    ...(has(game, 'gzip')
      ? [
          section(
            'Compression',
            [
              picker(
                'gzip',
                [
                  [false, 'Off'],
                  [true, 'Gzip'],
                ],
                node.compress,
                (compress) => Message.CompressionChosen({ nodeId: node.id, compress }),
                h,
              ),
            ],
            h,
          ),
        ]
      : []),
  ]
}

const sampler = (game: Game, node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Sample rate',
    [
      segmented(
        'grid-cols-5',
        SAMPLE_RATES.map((value) =>
          choice(
            String(value),
            node.sampleRate === value,
            true,
            Message.SampleChosen({ nodeId: node.id, sampleRate: value }),
            [h.span([h.Class('w-full text-center')], [`${Math.round(value * 100)}%`])],
            'More samples: more Insight, more CPU on sampled Nodes, more storage Burn',
            h,
          ),
        ),
        h,
      ),
    ],
    h,
  )

/** A Node's name, numbered when the Design has more than one of its kind. */
const nameOf = (game: Game, node: GameNode): string => {
  const same = game.nodes.filter((entry) => entry.type === node.type)
  const name = COMPONENTS[node.type].name
  return same.length > 1 ? `${name} ${same.indexOf(node) + 1}` : name
}

/** The routing Links out of a Node, with the Node at the far end. */
const outbound = (game: Game, node: GameNode): ReadonlyArray<readonly [GameLink, GameNode]> =>
  game.links.flatMap((link) => {
    const target = game.nodes.find((entry) => entry.id === link.to)
    return link.from === node.id && target && !COMPONENTS[target.type].tap
      ? [[link, target] as const]
      : []
  })

const caption = (text: string, h: HtmlBuilder<Message>): Html =>
  h.span([h.Class('text-[12px] font-medium text-muted-foreground')], [text])

const loadBalancer = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const checked = has(game, 'health-checks')
  const policies = Object.entries(LB_POLICIES) as ReadonlyArray<
    readonly [LbPolicy, (typeof LB_POLICIES)[LbPolicy]]
  >
  return [
    section(
      'Policy',
      [
        picker(
          'policy',
          policies.map(([policy, entry]) => [policy, entry.label] as const),
          node.policy,
          (policy) => Message.PolicyChosen({ nodeId: node.id, policy }),
          h,
          (policy) => {
            const research = LB_POLICIES[policy].research
            return research === null || has(game, research)
          },
          'grid-cols-2',
        ),
      ],
      h,
    ),
    section(
      'Health checks',
      [
        picker(
          'check-every',
          CHECK_INTERVALS.map((seconds) => [seconds, `${seconds} s`] as const),
          node.checkEvery,
          (checkEvery) => Message.HealthCheckChosen({ nodeId: node.id, checkEvery }),
          h,
          (seconds) => checked || seconds === 10,
        ),
        picker(
          'deep-check',
          [
            [false, 'Shallow'],
            [true, 'Deep'],
          ],
          node.deepCheck,
          (deepCheck) => Message.HealthCheckChosen({ nodeId: node.id, deepCheck }),
          h,
          (deep) => checked || !deep,
        ),
      ],
      h,
    ),
    section(
      'Routes',
      outbound(game, node).map(([link, target]) => {
        const carried = link.kinds ?? REQUEST_KINDS
        const toggled = (kind: RequestKind) => {
          const next = carried.includes(kind)
            ? carried.filter((entry) => entry !== kind)
            : REQUEST_KINDS.filter((entry) => entry === kind || carried.includes(entry))
          return next.length === REQUEST_KINDS.length ? null : next
        }
        return h.div(
          [h.Key(link.to), h.Class('flex flex-col gap-1.5')],
          [
            caption(nameOf(game, target), h),
            segmented(
              'grid-cols-4',
              REQUEST_KINDS.map((kind) => {
                const next = toggled(kind)
                return choice(
                  `${link.to}-${kind}`,
                  carried.includes(kind),
                  next === null || next.length > 0,
                  Message.LinkKindsChosen({ from: node.id, to: link.to, kinds: next }),
                  [h.span([h.Class('w-full truncate text-center')], [KIND_SHORT[kind]])],
                  KINDS[kind].label,
                  h,
                )
              }),
              h,
            ),
          ],
        )
      }),
      h,
    ),
  ]
}

const KIND_SHORT: Record<RequestKind, string> = {
  page: 'Page',
  read: 'Read',
  write: 'Write',
  login: 'Login',
  search: 'Search',
  upload: 'Upload',
  bot: 'Bot',
  media: 'Media',
  rt: 'Realtime',
  buy: 'Buy',
  job: 'Export',
  report: 'Report',
  ai: 'AI',
  feed: 'Feed',
  hook: 'Webhook',
  push: 'Push',
}

const dnsTtl = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'TTL',
    [
      picker(
        'ttl',
        DNS_TTLS.map((ttl) => [ttl, duration(ttl)] as const),
        node.ttl,
        (ttl) => Message.TtlChosen({ nodeId: node.id, ttl }),
        h,
      ),
    ],
    h,
  )

const cache = (game: Game, node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Cache',
    [
      ...(has(game, 'stampede-protection')
        ? [
            picker(
              'coalesce',
              [
                [false, 'Every miss'],
                [true, 'Coalesce'],
              ],
              node.coalesce,
              (coalesce) => Message.CacheGuardChosen({ nodeId: node.id, coalesce }),
              h,
            ),
          ]
        : []),
      ...(has(game, 'cache-warming')
        ? [
            picker(
              'warming',
              [
                [false, 'Cold start'],
                [true, 'Warm start'],
              ],
              node.warming,
              (warming) => Message.CacheGuardChosen({ nodeId: node.id, warming }),
              h,
            ),
          ]
        : []),
      picker(
        'engine',
        (Object.keys(CACHE_ENGINES) as ReadonlyArray<CacheEngine>).map(
          (engine) => [engine, CACHE_ENGINES[engine].name] as const,
        ),
        node.engine,
        (engine) => Message.CacheEngineChosen({ nodeId: node.id, engine }),
        h,
      ),
      picker(
        'cache-ttl',
        CACHE_TTLS.map((entry) => [entry.ttl, duration(entry.ttl)] as const),
        node.ttl,
        (ttl) => Message.TtlChosen({ nodeId: node.id, ttl }),
        h,
      ),
    ],
    h,
  )

const queue = (node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  section(
    'Failed tasks',
    [
      picker(
        'dlq',
        [
          [false, 'Retry forever'],
          [true, 'Dead-letter queue'],
        ],
        node.dlq,
        (dlq) => Message.DlqChosen({ nodeId: node.id, dlq }),
        h,
      ),
      ...(node.dlq
        ? [
            picker(
              'attempts',
              MAX_ATTEMPTS.map((attempts) => [attempts, `${attempts}×`] as const),
              node.attempts,
              (attempts) => Message.AttemptsChosen({ nodeId: node.id, attempts }),
              h,
            ),
          ]
        : []),
    ],
    h,
  ),
  section(
    'Max length',
    [
      picker(
        'max-length',
        QUEUE_LENGTHS.map(
          (maxLength) => [maxLength, maxLength === 0 ? 'None' : compact(maxLength)] as const,
        ),
        node.maxLength,
        (maxLength) => Message.MaxLengthChosen({ nodeId: node.id, maxLength }),
        h,
      ),
    ],
    h,
  ),
]

const prefetching = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Prefetch',
    [
      picker(
        'prefetch',
        PREFETCH.map((prefetch) => [prefetch, String(prefetch)] as const),
        node.prefetch,
        (prefetch) => Message.PrefetchChosen({ nodeId: node.id, prefetch }),
        h,
      ),
    ],
    h,
  )

/** Which zone the Node runs in, and a standby in another for data Nodes. */
const placement = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Zone',
    [
      picker(
        'zone',
        ZONES.map((zone) => [zone, zone.toUpperCase()] as const),
        node.zone,
        (zone) => Message.ZoneChosen({ nodeId: node.id, zone }),
        h,
      ),
      ...(STANDBY_TYPES.includes(node.type)
        ? [
            picker(
              'standby',
              [
                [false, 'No standby'],
                [true, 'Standby'],
              ],
              node.standby,
              (standby) => Message.StandbyChosen({ nodeId: node.id, standby }),
              h,
            ),
          ]
        : []),
    ],
    h,
  )

/** The region a Node runs in, once a second region is open. */
const regionSection = (
  game: Game,
  node: GameNode,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const open = openRegions(game)
  if (open.length < 2 || isGlobal(node) || COMPONENTS[node.type].fixed) return []
  return [
    section(
      'Region',
      [
        picker(
          'region',
          open.map((region) => [region, REGION_INFO[region].short] as const),
          node.region,
          (region) => Message.NodeRegionChosen({ nodeId: node.id, region }),
          h,
        ),
      ],
      h,
    ),
  ]
}

/** A store that can replicate across the open regions. */
const spreading = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> =>
  openRegions(game).length < 2
    ? []
    : [
        section(
          'Regions',
          [
            picker(
              'spread',
              [
                [false, 'One'],
                [true, 'Spread'],
              ],
              node.spread,
              (spread) => Message.SpreadChosen({ nodeId: node.id, spread }),
              h,
            ),
          ],
          h,
        ),
      ]

const QUORUM = [1, 2, 3, 4, 5] as const

/** N, R and W (07 "Wide-column Store"), then key splitting and regions. */
const wide = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  section(
    'Quorum',
    [
      picker(
        'n',
        QUORUM.map((n) => [n, `N${n}`] as const),
        node.n,
        (n) =>
          Message.QuorumChosen({
            nodeId: node.id,
            n,
            r: Math.min(node.r, n),
            w: Math.min(node.w, n),
          }),
        h,
      ),
      picker(
        'r',
        QUORUM.filter((r) => r <= node.n).map((r) => [r, `R${r}`] as const),
        node.r,
        (r) => Message.QuorumChosen({ nodeId: node.id, n: node.n, r, w: node.w }),
        h,
      ),
      picker(
        'w',
        QUORUM.filter((w) => w <= node.n).map((w) => [w, `W${w}`] as const),
        node.w,
        (w) => Message.QuorumChosen({ nodeId: node.id, n: node.n, r: node.r, w }),
        h,
      ),
    ],
    h,
  ),
  ...(has(game, 'hybrid-fanout') ? [splitting(node, h)] : []),
  ...spreading(game, node, h),
]

const backups = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Backups',
    [
      picker(
        'backup',
        (Object.keys(BACKUPS) as ReadonlyArray<keyof typeof BACKUPS>).map(
          (id) => [id, BACKUPS[id].name] as const,
        ),
        node.backup,
        (backup) => Message.BackupChosen({ nodeId: node.id, backup }),
        h,
      ),
    ],
    h,
  )

const fanout = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Feeds',
    [
      picker(
        'fanout',
        [
          ['pull', 'Pull'],
          ['push', 'Push'],
        ],
        node.fanout,
        (choice) => Message.FanoutChosen({ nodeId: node.id, fanout: choice }),
        h,
      ),
    ],
    h,
  )

const splitting = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Hot keys',
    [
      picker(
        'split',
        [
          [false, 'One shard'],
          [true, 'Split'],
        ],
        node.split,
        (split) => Message.SplitChosen({ nodeId: node.id, split }),
        h,
      ),
    ],
    h,
  )

const MIN_COPIES = [1, 2, 4, 8] as const

const autoscaler = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Scaling',
    [
      picker(
        'scale-signal',
        [
          ['cpu', 'CPU'],
          ['load', 'Load'],
        ],
        node.signal,
        (signal) => Message.AutoscalerChosen({ nodeId: node.id, signal }),
        h,
      ),
      picker(
        'scale-target',
        SCALE_TARGETS.map((target) => [target, `${Math.round(target * 100)}%`] as const),
        node.target,
        (target) => Message.AutoscalerChosen({ nodeId: node.id, target }),
        h,
      ),
      picker(
        'scale-min',
        MIN_COPIES.map((copies) => [copies, `min ${copies}`] as const),
        node.minCopies,
        (minCopies) => Message.AutoscalerChosen({ nodeId: node.id, minCopies }),
        h,
        (copies) => node.maxCopies === 0 || copies <= node.maxCopies,
      ),
      picker(
        'scale-max',
        SCALE_MAXIMA.map((copies) => [copies, copies === 0 ? 'no max' : `max ${copies}`] as const),
        node.maxCopies,
        (maxCopies) => Message.AutoscalerChosen({ nodeId: node.id, maxCopies }),
        h,
        (copies) => copies === 0 || copies >= node.minCopies,
      ),
    ],
    h,
  )

const gpu = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'GPU',
    [
      picker(
        'gpu',
        (Object.keys(GPU_TYPES) as ReadonlyArray<keyof typeof GPU_TYPES>).map(
          (id) => [id, GPU_TYPES[id].name] as const,
        ),
        node.gpu,
        (choice) => Message.GpuChosen({ nodeId: node.id, gpu: choice }),
        h,
      ),
    ],
    h,
  )

/** A Java App Server's collector, or a Go App Server's GOGC. */
const collector = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const language = RUNTIMES[node.runtime].language
  if (language === 'java')
    return [
      section(
        'Collector',
        [
          picker(
            'collector',
            (Object.keys(COLLECTORS) as ReadonlyArray<keyof typeof COLLECTORS>).map(
              (id) => [id, COLLECTORS[id].label] as const,
            ),
            node.collector,
            (choice) => Message.CollectorChosen({ nodeId: node.id, collector: choice }),
            h,
            (choice) => choice !== 'zgc' || has(game, 'zgc'),
          ),
        ],
        h,
      ),
    ]
  if (language === 'go' && has(game, 'gogc-tuning'))
    return [
      section(
        'GOGC',
        [
          picker(
            'gogc',
            GOGC.map((entry) => [entry.gogc, `${entry.gogc}`] as const),
            node.gogc,
            (gogc) => Message.GogcChosen({ nodeId: node.id, gogc }),
            h,
          ),
        ],
        h,
      ),
    ]
  return []
}

/** Load shedding and read-your-writes routing on an App Server. */
const routing = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const rows: Array<Html> = []
  if (has(game, 'load-shedding'))
    rows.push(
      picker(
        'shed',
        [
          [false, 'Drop evenly'],
          [true, 'Shed low value'],
        ],
        node.shed,
        (shed) => Message.ShedChosen({ nodeId: node.id, shed }),
        h,
      ),
    )
  if (has(game, 'ryw-routing'))
    rows.push(
      picker(
        'ryw',
        [
          [false, 'Reads anywhere'],
          [true, 'Read your writes'],
        ],
        node.ryw,
        (ryw) => Message.RywChosen({ nodeId: node.id, ryw }),
        h,
      ),
    )
  return rows.length > 0 ? [section('Overload', rows, h)] : []
}

const waf = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Paranoia',
    [
      picker(
        'paranoia',
        PARANOIA.map((entry) => [entry.level, `${entry.level}`] as const),
        node.paranoia,
        (paranoia) => Message.ParanoiaChosen({ nodeId: node.id, paranoia }),
        h,
      ),
      picker(
        'under-attack',
        [
          [false, 'Normal'],
          [true, 'Under attack'],
        ],
        node.underAttack,
        (underAttack) => Message.UnderAttackChosen({ nodeId: node.id, underAttack }),
        h,
      ),
    ],
    h,
  )

const cdnTtl = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'TTL',
    [
      picker(
        'cdn-ttl',
        CDN_TTLS.map((entry) => [entry.ttl, duration(entry.ttl)] as const),
        node.ttl,
        (ttl) => Message.TtlChosen({ nodeId: node.id, ttl }),
        h,
      ),
    ],
    h,
  )

const pooler = (node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Pooling mode',
    [
      picker(
        'pooler-mode',
        [
          ['session', 'Session'],
          ['transaction', 'Transaction'],
        ],
        node.mode,
        (mode) => Message.PoolerModeChosen({ nodeId: node.id, mode }),
        h,
      ),
    ],
    h,
  )

/** Timeout and retries on each call a Node makes. */
const calls = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const links = outbound(game, node)
  if (links.length === 0) return []
  return [
    section(
      'Calls',
      links.map(([link, target]) =>
        h.div(
          [h.Key(link.to), h.Class('flex flex-col gap-1.5')],
          [
            caption(nameOf(game, target), h),
            picker(
              `timeout-${link.to}`,
              LINK_TIMEOUTS.map((seconds) => [seconds, `${seconds} s`] as const),
              link.timeout,
              (timeout) => Message.LinkPolicyChosen({ from: node.id, to: link.to, timeout }),
              h,
            ),
            picker(
              `retries-${link.to}`,
              [
                ['none', 'No retries'],
                ['naive', 'Retry 3×'],
                ['backoff', 'Backoff'],
              ],
              link.retries,
              (retries) => Message.LinkPolicyChosen({ from: node.id, to: link.to, retries }),
              h,
              (retries) => retries !== 'backoff' || has(game, 'backoff-jitter'),
            ),
            ...(has(game, 'circuit-breakers')
              ? [
                  picker(
                    `breaker-${link.to}`,
                    [
                      [false, 'No breaker'],
                      [true, link.open > 0 ? 'Breaker open' : 'Breaker'],
                    ],
                    link.breaker,
                    (breaker) => Message.LinkPolicyChosen({ from: node.id, to: link.to, breaker }),
                    h,
                  ),
                ]
              : []),
          ],
        ),
      ),
      h,
    ),
  ]
}

const traffic = (game: Game, ledger: Ledger, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const percentiles = has(game, 'percentiles')
  const kinds = REQUEST_KINDS.filter((kind) => ledger.kinds[kind])
  const list = [
    section(
      'Requests',
      kinds.map((kind) => {
        const entry = ledger.kinds[kind]
        const failing = (entry?.success ?? 1) < 0.95
        const slow = (entry?.p99 ?? 0) > PROFILES[kind].apdex
        const line = h.div(
          [h.Key(kind), h.Class('flex items-center gap-2 text-[12px]')],
          [
            h.span(
              [
                h.Class('size-2 rounded-full'),
                h.Style({ background: `#${KINDS[kind].color.toString(16).padStart(6, '0')}` }),
              ],
              [],
            ),
            h.span([h.Class('flex-1')], [KINDS[kind].label]),
            h.span(
              [
                h.Class(
                  `${FIGURE} text-[11.5px] ${failing ? 'text-danger' : slow ? 'text-warn' : 'text-muted-foreground'}`,
                ),
              ],
              [
                `${rate(entry?.rate ?? 0)}/s · ${percent(entry?.success ?? 0)} ok${
                  percentiles ? '' : ` · ${ms(entry?.mean ?? 0)}`
                }`,
              ],
            ),
          ],
        )
        if (!percentiles) return line
        return h.div(
          [h.Key(kind), h.Class('flex flex-col gap-0.5')],
          [
            line,
            h.span(
              [
                h.Class(
                  `${FIGURE} pl-4 text-[11.5px] ${slow ? 'text-warn' : 'text-muted-foreground'}`,
                ),
              ],
              [
                `mean ${ms(entry?.mean ?? 0)} · p50 ${ms(entry?.p50 ?? 0)} · p95 ${ms(entry?.p95 ?? 0)} · p99 ${ms(entry?.p99 ?? 0)}`,
              ],
            ),
          ],
        )
      }),
      h,
    ),
  ]
  if (has(game, 'logs')) {
    list.push(
      section(
        'Errors by cause',
        [
          h.div(
            [h.Class(NESTED)],
            Object.entries(ledger.errors).map(([cause, value]) =>
              row(cause, `${rate(value)}/s`, value > 0.01 ? 'danger' : 'plain', h),
            ),
          ),
        ],
        h,
      ),
    )
  }
  return list
}

/* ---------- the panel ---------- */

export const inspector = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const game = model.board.game
  const node = game.nodes.find((entry) => entry.id === model.board.selected)
  if (!node) return h.empty
  const def = COMPONENTS[node.type]
  const history = model.board.nodeHistory[node.id] ?? []
  const price = resizePrice(game, node)
  const sizeLabel = def.sized || def.steps > 1 ? sizeLabelOf(node) : null

  return h.aside(
    [
      h.Key('inspector'),
      h.DataAttribute('exit', 'gesture'),
      h.DataAttribute('inspector', ''),
      h.AriaLabel(def.name),
      h.Class(
        `absolute top-[76px] right-3 bottom-3 z-20 flex w-[348px] flex-col overflow-hidden ${PANEL} enter-panel compact:inset-x-2 compact:top-auto compact:bottom-[max(8px,env(safe-area-inset-bottom))] compact:z-30 compact:max-h-[62%] compact:w-auto short:inset-x-auto short:top-[132px] short:right-[max(8px,env(safe-area-inset-right))] short:w-[320px] short:max-h-none`,
      ),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-3 px-4 pt-4 pb-2')],
        [
          groupBadge(def.group, COMPONENT_ICONS[node.type], 'size-10', h),
          h.div(
            [h.Class('flex min-w-0 flex-1 flex-col')],
            [
              h.span([h.Class('text-[17px] font-semibold tracking-[-0.025em]')], [def.name]),
              h.span([h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))], [def.product]),
            ],
          ),
          sizeLabel
            ? badge({ variant: 'secondary', className: 'font-mono' }, [sizeLabel], h)
            : h.empty,
          button(
            {
              onClick: Message.EmptyTapped(),
              variant: 'ghost',
              size: 'icon-sm',
              className: 'text-muted-foreground',
              attributes: [h.AriaLabel('Close')],
            },
            icon(h, X, 'size-4'),
            h,
          ),
        ],
      ),
      h.p([h.Class('px-4 pb-3 text-[12.5px] leading-snug text-muted-foreground')], [def.blurb]),
      ...warnings(game, node, ledger, h),
      h.div(
        [h.Class(`flex min-h-0 flex-1 flex-col divide-y divide-hairline ${SCROLL}`)],
        [
          h.div(
            [h.Class('px-4 pt-1 pb-2')],
            [h.div([h.Class(NESTED)], stats(game, node, ledger, h))],
          ),
          ...(has(game, 'metrics') && history.length > 1 && !def.fixed
            ? [section('Load, last day', [sparkline(history, h)], h)]
            : []),
          ...resources(node, ledger, h),
          ...(node.type === 'users' ? traffic(game, ledger, h) : []),
          ...(def.sized ? [instance(game, node, h)] : []),
          ...(node.type === 'server' || node.type === 'worker'
            ? stack(
                game,
                node,
                h,
                model.board.tradeoff?.nodeId === node.id &&
                  model.board.tradeoff.option.kind === 'runtime' &&
                  model.board.tradeoff.pinned
                  ? model.board.tradeoff.option.id
                  : null,
              )
            : []),
          ...(node.type === 'server' ? collector(game, node, h) : []),
          ...(node.type === 'server' ? routing(game, node, h) : []),
          ...(node.type === 'gpu' ? [gpu(node, h)] : []),
          ...(node.type === 'analytics' ? [sampler(game, node, h)] : []),
          ...(node.type === 'lb' ? loadBalancer(game, node, h) : []),
          ...(node.type === 'cache' ? [cache(game, node, h)] : []),
          ...(node.type === 'queue' ? queue(node, h) : []),
          ...(node.type === 'worker' ? [prefetching(node, h)] : []),
          ...(node.type === 'waf' ? [waf(node, h)] : []),
          ...(node.type === 'cdn' ? [cdnTtl(node, h)] : []),
          ...(node.type === 'pooler' ? [pooler(node, h)] : []),
          ...(node.type === 'autoscaler' ? [autoscaler(node, h)] : []),
          ...(has(game, 'multi-az') && zoned(node) ? [placement(node, h)] : []),
          ...regionSection(game, node, h),
          ...(node.type === 'wide' ? wide(game, node, h) : []),
          ...(node.type === 'dsql' ? spreading(game, node, h) : []),
          ...(node.type === 'database' && has(game, 'pitr') ? [backups(node, h)] : []),
          ...(node.type === 'server' && regional(game) ? [fanout(node, h)] : []),
          ...(node.type === 'cache' && has(game, 'hybrid-fanout') ? [splitting(node, h)] : []),
          ...(node.type === 'dns' && has(game, 'health-checks') ? [dnsTtl(node, h)] : []),
          ...(has(game, 'timeouts') ? calls(game, node, h) : []),
        ],
      ),
      h.div(
        [h.Class('flex gap-2 border-t border-hairline bg-nested p-3')],
        [
          node.type === 'payments' && game.pending > 0
            ? h.button(
                [
                  h.Type('button'),
                  h.OnClick(Message.Collected()),
                  h.Class(
                    'flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-ok text-[13px] font-medium text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.25),0_0_0_1px_color-mix(in_oklch,var(--ok),black_25%),0_2px_6px_-2px_color-mix(in_oklch,var(--ok)_50%,transparent)] transition-[filter] hover:brightness-105 active:translate-y-px',
                  ),
                ],
                ['Collect', h.span([h.Class(FIGURE)], [money(game.pending)])],
              )
            : h.empty,
          price !== null && node.down !== -1
            ? button(
                {
                  onClick: Message.ResizeChosen({ nodeId: node.id, direction: 1 }),
                  isDisabled: game.cash < price,
                  size: 'lg',
                  className: 'min-w-0 flex-1 justify-between px-3',
                  attributes: [h.Title('U')],
                },
                [
                  h.span(
                    [h.Class('flex items-center gap-1.5 truncate')],
                    [
                      icon(h, ArrowUp, 'size-4 shrink-0'),
                      node.type === 'payments'
                        ? 'Bigger drawer'
                        : node.type === 'analytics'
                          ? 'More samples'
                          : sizeLabelOf(node, node.size + 1),
                    ],
                  ),
                  h.span([h.Class(FIGURE)], [priceLabel(game.sandbox, price)]),
                ],
                h,
              )
            : h.empty,
          (node.type === 'server' || node.type === 'worker') && node.down === 0
            ? button(
                {
                  onClick: Message.RestartChosen({ nodeId: node.id }),
                  variant: 'outline',
                  size: 'icon-lg',
                  attributes: [
                    h.Title('Restart: frees leaked memory, comes back cold'),
                    h.AriaLabel('Restart'),
                  ],
                },
                icon(h, RotateCcw, 'size-4'),
                h,
              )
            : h.empty,
          def.fixed
            ? h.empty
            : button(
                {
                  onClick: Message.SellAsked(),
                  variant: 'outline',
                  size: 'icon-lg',
                  className: 'text-muted-foreground hover:text-danger',
                  attributes: [
                    h.Title(`Sell for ${money(refundOf(game, node))} (Delete)`),
                    h.AriaLabel('Sell'),
                  ],
                },
                icon(h, Trash2, 'size-4'),
                h,
              ),
        ],
      ),
    ],
  )
}
