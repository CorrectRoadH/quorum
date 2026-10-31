import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowUp, Minus, Plus, RotateCcw, Trash2, X } from 'lucide'
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
import { icon } from '@/lib/icons'
import { EYEBROW, PANEL, SCROLL, mark } from './bits.ts'

/* ==========================================================================
   The inspector: one Node up close. Its numbers and resources, its instance
   type, its Stack if it is an App Server, and the actions it offers.
   ========================================================================== */

type Tone = 'plain' | 'warn' | 'danger' | 'ok'

const toneText = (tone: Tone) =>
  tone === 'danger'
    ? 'text-danger'
    : tone === 'warn'
      ? 'text-warn'
      : tone === 'ok'
        ? 'text-ok'
        : 'text-foreground'

const row = (name: string, value: string, tone: Tone, h: HtmlBuilder<Message>) =>
  h.div(
    [
      h.Key(name),
      h.Class(
        'flex items-baseline justify-between border-b border-border/70 py-1.5 last:border-b-0',
      ),
    ],
    [
      h.span([h.Class('text-[12.5px] text-muted-foreground')], [name]),
      h.span([h.Class(`font-mono text-[12px] tabular-nums ${toneText(tone)}`)], [value]),
    ],
  )

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
  const color = level >= 0.9 ? 'bg-danger' : level >= 0.7 ? 'bg-warn' : 'bg-primary-strong'
  return h.div(
    [h.Key(name), h.Class('flex flex-col gap-1 py-1')],
    [
      h.div(
        [h.Class('flex items-baseline justify-between')],
        [
          h.span([h.Class('text-[12.5px] text-muted-foreground')], [name]),
          h.span(
            [h.Class(`font-mono text-[12px] tabular-nums ${level >= 0.9 ? 'text-danger' : ''}`)],
            [value],
          ),
        ],
      ),
      h.div(
        [h.Class('h-1.5 bg-muted')],
        [h.div([h.Class(`h-full ${color}`), h.Style({ width: `${share * 100}%` })], [])],
      ),
    ],
  )
}

const section = (title: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div(
    [h.Key(title), h.Class('flex flex-col gap-2 border-t border-border px-4 py-3')],
    [h.span([h.Class(EYEBROW)], [title]), ...children],
  )

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
      h.OnClick(message),
      h.Class(
        `flex items-center gap-2 border px-2 py-1.5 text-left text-[12px] transition-colors ${
          selected
            ? 'border-primary-strong bg-primary/12 text-foreground'
            : ready
              ? 'border-border bg-card hover:bg-muted'
              : 'cursor-not-allowed border-dashed border-border bg-card text-muted-foreground/60'
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
  h.button(
    [
      h.Type('button'),
      h.AriaLabel(label),
      h.Title(label),
      h.Disabled(!enabled),
      h.OnClick(message),
      h.Class(
        'grid size-7 place-items-center border border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40',
      ),
    ],
    [icon(h, glyph, 'size-3.5')],
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
        `mx-4 mb-3 flex flex-col gap-2 border px-3 py-2 text-[12px] leading-snug ${tone === 'danger' ? 'border-danger/40 bg-danger/8 text-danger' : 'border-warn/50 bg-warn/8 text-warn'}`,
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
        h.button(
          [
            h.Type('button'),
            h.Disabled(game.cash < price),
            h.OnClick(Message.ReplaceBought({ nodeId: node.id })),
            h.Class(
              'h-8 self-start border border-danger bg-danger px-3 text-[12px] font-semibold text-white hover:bg-danger/90 disabled:opacity-50',
            ),
          ],
          [`Replace · ${money(price)}`],
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
        h.button(
          [
            h.Type('button'),
            h.OnClick(Message.RestartChosen({ nodeId: node.id })),
            h.Class(
              'flex h-8 items-center gap-1.5 self-start border border-danger px-3 text-[12px] font-semibold hover:bg-danger/10',
            ),
          ],
          [icon(h, RotateCcw, 'size-3.5'), 'Restart'],
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
        [h.Class('flex items-center justify-between gap-2')],
        [
          smallButton(
            'Smaller (free)',
            Minus,
            Message.ResizeChosen({ nodeId: node.id, direction: -1 }),
            node.size > 0,
            h,
          ),
          h.span(
            [h.Class('flex-1 text-center font-mono text-[12.5px]')],
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
      h.div(
        [h.Class('grid grid-cols-4 gap-1.5')],
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
        h.div(
          [h.Class('grid grid-cols-2 gap-1.5')],
          RUNTIME_IDS.map((id) =>
            choice(
              id,
              node.runtime === id,
              runtimeReady(game, id),
              Message.RuntimeChosen({ nodeId: node.id, runtime: id }),
              [
                mark(LANGUAGES[RUNTIMES[id].language].mark, 'size-5 text-[9px] lowercase', h),
                h.span([h.Class('truncate')], [RUNTIMES[id].name]),
              ],
              runtimeReady(game, id)
                ? RUNTIMES[id].blurb
                : `Research ${RUNTIMES[id].name} to unlock`,
              h,
            ),
          ),
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
                    [h.Class('w-12 text-center font-mono text-[13px] tabular-nums')],
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
                        `ml-auto font-mono text-[11px] ${node.workers > fit ? 'text-danger' : 'text-muted-foreground'}`,
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
        h.div(
          [h.Class('grid grid-cols-2 gap-1.5')],
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
      h.div(
        [h.Class('grid grid-cols-4 gap-1.5')],
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
                h.Class('size-2'),
                h.Style({ background: `#${KINDS[kind].color.toString(16).padStart(6, '0')}` }),
              ],
              [],
            ),
            h.span([h.Class('flex-1')], [KINDS[kind].label]),
            h.span(
              [
                h.Class(
                  `font-mono text-[11.5px] tabular-nums ${failing ? 'text-danger' : slow ? 'text-warn' : 'text-muted-foreground'}`,
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
        Object.entries(ledger.errors).map(([cause, value]) =>
          row(cause, `${rate(value)}/s`, value > 0.01 ? 'danger' : 'plain', h),
        ),
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
      h.Key(`inspector-${node.id}`),
      h.Class(
        `absolute top-[76px] right-4 bottom-[128px] z-20 flex w-[340px] flex-col ${PANEL} animate-in fade-in slide-in-from-right-2`,
      ),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-3 px-4 pt-3.5 pb-2')],
        [
          mark(def.code, 'h-9 w-11 text-[11px] uppercase', h),
          h.div(
            [h.Class('flex min-w-0 flex-1 flex-col')],
            [
              h.span([h.Class('text-[18px] font-semibold tracking-[-0.02em]')], [def.name]),
              h.span([h.Class('font-mono text-[11px] text-muted-foreground')], [def.product]),
            ],
          ),
          sizeLabel
            ? h.span(
                [h.Class('border border-border bg-secondary px-2 py-0.5 font-mono text-[11px]')],
                [sizeLabel],
              )
            : h.empty,
          h.button(
            [
              h.Type('button'),
              h.AriaLabel('Close'),
              h.OnClick(Message.EmptyTapped()),
              h.Class(
                'grid size-7 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground',
              ),
            ],
            [icon(h, X, 'size-4')],
          ),
        ],
      ),
      h.p([h.Class('px-4 pb-3 text-[12.5px] leading-snug text-muted-foreground')], [def.blurb]),
      ...warnings(game, node, ledger, h),
      h.div(
        [h.Class(`flex min-h-0 flex-1 flex-col ${SCROLL}`)],
        [
          h.div(
            [h.Class('flex flex-col border-t border-border px-4 py-1.5')],
            stats(game, node, ledger, h),
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
        [h.Class('flex gap-2 border-t border-border p-3')],
        [
          node.type === 'payments' && game.pending > 0
            ? h.button(
                [
                  h.Type('button'),
                  h.OnClick(Message.Collected()),
                  h.Class(
                    'flex h-10 flex-1 items-center justify-center gap-2 border border-ok bg-ok text-[13px] font-semibold text-white hover:bg-ok/90',
                  ),
                ],
                [`Collect ${money(game.pending)}`],
              )
            : h.empty,
          price !== null && node.down !== -1
            ? h.button(
                [
                  h.Type('button'),
                  h.Title('U'),
                  h.Disabled(game.cash < price),
                  h.OnClick(Message.ResizeChosen({ nodeId: node.id, direction: 1 })),
                  h.Class(
                    'flex h-10 flex-1 items-center justify-between gap-2 border border-primary-strong bg-primary px-3 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground',
                  ),
                ],
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
                  h.span([h.Class('font-mono text-[12px]')], [money(price)]),
                ],
              )
            : h.empty,
          node.type === 'server' && node.down === 0
            ? h.button(
                [
                  h.Type('button'),
                  h.Title('Restart: frees leaked memory, comes back cold'),
                  h.AriaLabel('Restart'),
                  h.OnClick(Message.RestartChosen({ nodeId: node.id })),
                  h.Class(
                    'grid size-10 shrink-0 place-items-center border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                  ),
                ],
                [icon(h, RotateCcw, 'size-4')],
              )
            : h.empty,
          def.fixed
            ? h.empty
            : h.button(
                [
                  h.Type('button'),
                  h.Title(`Sell for ${money(refundOf(game, node))} (Delete)`),
                  h.AriaLabel('Sell'),
                  h.OnClick(Message.NodeSold({ nodeId: node.id })),
                  h.Class(
                    'grid size-10 shrink-0 place-items-center border border-border text-muted-foreground transition-colors hover:border-danger/50 hover:bg-danger/8 hover:text-danger',
                  ),
                ],
                [icon(h, Trash2, 'size-4')],
              ),
        ],
      ),
    ],
  )
}
