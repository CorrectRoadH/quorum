import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowUp, ChevronRight, Minus, Plus, RotateCcw, Trash2, X } from 'lucide'
import {
  COMPONENTS,
  CREDIT_CAP,
  FAMILIES,
  FAMILY_IDS,
  FRAMEWORKS,
  FRAMEWORK_IDS,
  KINDS,
  LANGUAGES,
  OS_RAM,
  PROFILES,
  REQUEST_KINDS,
  RUNTIMES,
  RUNTIME_IDS,
  SAMPLE_RATES,
  SIZES,
} from '@/game/engine/catalog.ts'
import type { Ledger } from '@/game/engine/ledger.ts'
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
  vcpuOf,
} from '@/game/engine/lookups.ts'
import type { Game, GameNode } from '@/game/engine/state.ts'
import { compact, money, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { COMPONENT_ICONS } from '@/game/icons.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, NESTED, PANEL, SCROLL, WELL, mark, meter, row } from './bits.ts'

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
const section = (title: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.details(
    [h.Key(title), h.Class('fold group px-4')],
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
) =>
  h.button(
    [
      h.Key(key),
      h.Type('button'),
      h.Title(title),
      h.Disabled(!ready),
      h.AriaPressed(selected ? 'true' : 'false'),
      h.OnClick(message),
      h.Class(
        `flex h-8 min-w-0 items-center gap-2 rounded-lg px-2 text-left text-[12px] font-medium transition-colors ${
          selected
            ? 'bg-raised text-foreground shadow-raised'
            : ready
              ? 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              : 'cursor-not-allowed text-muted-foreground/45'
        }`,
      ),
    ],
    children,
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
          ['Replace', h.span([h.Class(FIGURE)], [money(price)])],
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
        row('Users', compact(game.users), 'plain', h),
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
        row('Burn', `${money(ledger.burn)}/s`, 'plain', h),
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
        row('Latency', `${Math.round(own.latency)} ms`, 'plain', h),
        row('Dropped', `${rate(own.dropped)}/s`, own.dropped > 0.05 ? 'danger' : 'plain', h),
        ...(own.hitRatio !== null ? [row('Hit ratio', percent(own.hitRatio), 'plain', h)] : []),
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
            price === null ? 'Largest size' : `Larger · ${money(price)}`,
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
            Message.FamilyChosen({ nodeId: node.id, family: id }),
            [h.span([h.Class('w-full text-center')], [FAMILIES[id].name])],
            FAMILIES[id].blurb,
            h,
          ),
        ),
        h,
      ),
    ],
    h,
  )
}

const stack = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
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
              Message.RuntimeChosen({ nodeId: node.id, runtime: id }),
              [
                mark(
                  LANGUAGES[RUNTIMES[id].language].mark,
                  'size-5 rounded text-[9px] lowercase',
                  h,
                ),
                h.span([h.Class('truncate')], [RUNTIMES[id].name]),
              ],
              runtimeReady(game, id)
                ? RUNTIMES[id].blurb
                : `Research ${RUNTIMES[id].name} to unlock`,
              h,
            ),
          ),
          h,
        ),
        h.p([h.Class('text-[12px] leading-snug text-muted-foreground')], [runtime.blurb]),
      ],
      h,
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
              Message.FrameworkChosen({ nodeId: node.id, framework: id }),
              [h.span([h.Class('truncate')], [FRAMEWORKS[id].name])],
              frameworkReady(game, id)
                ? FRAMEWORKS[id].blurb
                : `Research ${FRAMEWORKS[id].name} to unlock`,
              h,
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
  ]
}

const sampler = (game: Game, node: GameNode, h: HtmlBuilder<Message>): Html =>
  section(
    'Sample rate',
    [
      segmented(
        'grid-cols-4',
        SAMPLE_RATES.map((value, index) =>
          choice(
            String(value),
            node.sample === index,
            true,
            Message.SampleChosen({ nodeId: node.id, sample: index }),
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
        return h.div(
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
                `${rate(entry?.rate ?? 0)}/s · ${percent(entry?.success ?? 0)} ok · ${
                  percentiles
                    ? `p99 ${Math.round(entry?.p99 ?? 0)}`
                    : `${Math.round(entry?.mean ?? 0)}`
                } ms`,
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
  const game = model.game
  const node = game.nodes.find((entry) => entry.id === model.selected)
  if (!node) return h.empty
  const def = COMPONENTS[node.type]
  const history = model.nodeHistory[node.id] ?? []
  const price = resizePrice(game, node)
  const sizeLabel = def.sized
    ? SIZES[node.size]?.name
    : node.type === 'payments' || node.type === 'analytics'
      ? `size ${node.size}`
      : null

  return h.aside(
    [
      h.Key('inspector'),
      h.Class(
        `absolute top-[76px] right-3 bottom-3 z-20 flex w-[348px] flex-col overflow-hidden ${PANEL} enter-panel`,
      ),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-3 px-4 pt-4 pb-2')],
        [
          h.span(
            [h.Class('grid size-10 shrink-0 place-items-center rounded-lg bg-well shadow-well')],
            [icon(h, COMPONENT_ICONS[node.type], 'size-5')],
          ),
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
            ? [section('Load, last 2 minutes', [sparkline(history, h)], h)]
            : []),
          ...resources(node, ledger, h),
          ...(node.type === 'users' ? traffic(game, ledger, h) : []),
          ...(def.sized ? [instance(game, node, h)] : []),
          ...(node.type === 'server' ? stack(game, node, h) : []),
          ...(node.type === 'analytics' ? [sampler(game, node, h)] : []),
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
                      def.sized
                        ? `${SIZES[node.size + 1]?.name ?? ''}`
                        : node.type === 'payments'
                          ? 'Bigger drawer'
                          : 'More samples',
                    ],
                  ),
                  h.span([h.Class(FIGURE)], [money(price)]),
                ],
                h,
              )
            : h.empty,
          node.type === 'server' && node.down === 0
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
                  onClick: Message.NodeSold({ nodeId: node.id }),
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
