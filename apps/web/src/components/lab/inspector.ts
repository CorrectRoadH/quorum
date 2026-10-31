import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowUp, Trash2, X } from 'lucide'
import {
  COMPONENTS,
  FRAMEWORKS,
  FRAMEWORK_IDS,
  KINDS,
  LANGUAGES,
  LANGUAGE_IDS,
  LEVEL_CAPACITY,
  MAX_LEVEL,
  REQUEST_KINDS,
} from '@/game/engine/catalog.ts'
import {
  burnOf,
  canUpgrade,
  drawerSize,
  frameworkReady,
  has,
  languageReady,
  stageOf,
  upgradePrice,
  type Flow,
} from '@/game/engine/sim.ts'
import type { Game, GameNode } from '@/game/engine/state.ts'
import { compact, money, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { EYEBROW, PANEL, SCROLL, mark } from './bits.ts'

/* ==========================================================================
   The inspector: one Node up close. Its numbers, its stack if it is a
   server, and what the next level buys.
   ========================================================================== */

const row = (
  name: string,
  value: string,
  tone: 'plain' | 'warn' | 'danger' | 'ok',
  h: HtmlBuilder<Message>,
) =>
  h.div(
    [
      h.Key(name),
      h.Class(
        'flex items-baseline justify-between border-b border-border/70 py-1.5 last:border-b-0',
      ),
    ],
    [
      h.span([h.Class('text-[12.5px] text-muted-foreground')], [name]),
      h.span(
        [
          h.Class(
            `font-mono text-[12px] tabular-nums ${tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : 'text-foreground'}`,
          ),
        ],
        [value],
      ),
    ],
  )

const section = (title: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div(
    [h.Key(title), h.Class('flex flex-col gap-2 border-t border-border px-4 py-3')],
    [h.span([h.Class(EYEBROW)], [title]), ...children],
  )

const stats = (
  game: Game,
  node: GameNode,
  flow: Flow,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const own = flow.nodes[node.id]
  if (!own) return []
  if (node.type === 'users') {
    const stage = stageOf(game)
    return [
      row('Users', compact(game.users), 'plain', h),
      row('Market', compact(stage.market), 'plain', h),
      row('Requests', `${rate(flow.demand)} rps`, 'plain', h),
      row(
        'Answered',
        `${(flow.quality * 100).toFixed(1)}%`,
        flow.quality >= 0.95 ? 'ok' : 'danger',
        h,
      ),
      row('Latency', `${Math.round(flow.latency)} ms`, flow.patience < 1 ? 'danger' : 'plain', h),
      row(
        'Revenue kept',
        `${Math.round(flow.patience * 100)}%`,
        flow.patience < 1 ? 'danger' : 'plain',
        h,
      ),
    ]
  }
  if (node.type === 'payments') {
    return [
      row(
        'In the drawer',
        money(game.pending),
        game.pending >= drawerSize(game) ? 'warn' : 'plain',
        h,
      ),
      row('Drawer size', money(drawerSize(game)), 'plain', h),
      row('Revenue', `${money(flow.revenue)}/s`, 'ok', h),
      row('Collection', has(game, 'stripe') ? 'Stripe, automatic' : 'By hand', 'plain', h),
    ]
  }
  if (node.type === 'analytics') {
    const sampled = Math.min(own.inbound, own.capacity)
    return [
      row('Watching', `${rate(own.inbound)} rps`, 'plain', h),
      row(
        'Samples',
        `${rate(sampled)} / ${rate(own.capacity)} rps`,
        own.inbound > own.capacity ? 'warn' : 'plain',
        h,
      ),
      row('Insight', `+${(sampled * 0.03).toFixed(2)}/s`, 'ok', h),
      row('Burn', `${money(burnOf(node))}/s`, 'plain', h),
    ]
  }
  const util = own.utilization * 100
  return [
    row('Inbound', `${rate(own.inbound)} rps`, 'plain', h),
    row('Capacity', `${rate(own.capacity)} rps`, 'plain', h),
    row(
      'Utilization',
      `${util.toFixed(0)}%`,
      util > 95 ? 'danger' : util > 80 ? 'warn' : 'plain',
      h,
    ),
    row('Latency', `${Math.round(own.latency)} ms`, 'plain', h),
    row('Dropped', `${rate(own.dropped)} rps`, own.dropped > 0.05 ? 'danger' : 'plain', h),
    row('Burn', `${money(burnOf(node))}/s`, 'plain', h),
  ]
}

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

const stack = (game: Game, node: GameNode, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const language = LANGUAGES[node.language]
  const frameworks = FRAMEWORK_IDS.filter(
    (id) => id === 'none' || FRAMEWORKS[id].language === node.language,
  )
  return [
    section(
      'Language',
      [
        h.div(
          [h.Class('grid grid-cols-2 gap-1.5')],
          LANGUAGE_IDS.map((id) =>
            choice(
              id,
              node.language === id,
              languageReady(game, id),
              Message.LanguageChosen({ nodeId: node.id, language: id }),
              [
                mark(LANGUAGES[id].mark, 'size-5 text-[9.5px] lowercase', h),
                h.span([h.Class('truncate')], [LANGUAGES[id].name]),
              ],
              languageReady(game, id)
                ? LANGUAGES[id].blurb
                : `Research ${LANGUAGES[id].name} to unlock`,
              h,
            ),
          ),
        ),
        h.p([h.Class('text-[12px] leading-snug text-muted-foreground')], [language.blurb]),
      ],
      h,
    ),
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

const traffic = (flow: Flow, node: GameNode, h: HtmlBuilder<Message>): Html => {
  const own = flow.nodes[node.id]
  if (!own || own.stranded <= 0.01) return h.empty
  const names = own.strandedKinds.map((kind) => KINDS[kind].label.toLowerCase()).join(', ')
  return h.div(
    [
      h.Class(
        'mx-4 mb-3 border border-danger/40 bg-danger/8 px-3 py-2 text-[12px] leading-snug text-danger',
      ),
    ],
    [
      `${rate(own.stranded)} rps of ${names} leave with nowhere to go. Link this Node to something that takes them.`,
    ],
  )
}

const upgradeLabel = (node: GameNode): string => {
  if (node.type === 'payments') return `Drawer ${money(120 * 3 ** node.level)}`
  if (node.type === 'analytics') return `${node.level + 1}: ${LEVEL_CAPACITY}× samples`
  return `Level ${node.level + 1}: ${LEVEL_CAPACITY}× capacity`
}

export const inspector = (model: Model, flow: Flow, h: HtmlBuilder<Message>): Html => {
  const node = model.game.nodes.find((entry) => entry.id === model.selected)
  if (!node) return h.empty
  const def = COMPONENTS[node.type]
  const price = upgradePrice(node)
  const upgradable = canUpgrade(node)
  const mixed =
    node.type === 'users'
      ? REQUEST_KINDS.filter((kind) => (stageOf(model.game).mix[kind] ?? 0) > 0)
      : []

  return h.aside(
    [
      h.Key(`inspector-${node.id}`),
      h.Class(
        `absolute top-[76px] right-4 bottom-[128px] z-20 flex w-[332px] flex-col ${PANEL} animate-in fade-in slide-in-from-right-2`,
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
          node.type === 'users'
            ? h.empty
            : h.span(
                [h.Class('border border-border bg-secondary px-2 py-0.5 font-mono text-[11px]')],
                [`Lv ${node.level} / ${MAX_LEVEL}`],
              ),
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
      traffic(flow, node, h),
      h.div(
        [h.Class(`flex min-h-0 flex-1 flex-col ${SCROLL}`)],
        [
          h.div(
            [h.Class('flex flex-col border-t border-border px-4 py-1.5')],
            stats(model.game, node, flow, h),
          ),
          ...(node.type === 'server' ? stack(model.game, node, h) : []),
          mixed.length > 0
            ? section(
                'What users send',
                mixed.map((kind) =>
                  h.div(
                    [h.Key(kind), h.Class('flex items-center gap-2 text-[12px]')],
                    [
                      h.span(
                        [
                          h.Class('size-2'),
                          h.Style({
                            background: `#${KINDS[kind].color.toString(16).padStart(6, '0')}`,
                          }),
                        ],
                        [],
                      ),
                      h.span([h.Class('flex-1')], [KINDS[kind].label]),
                      h.span(
                        [
                          h.Class(
                            `font-mono ${flow.failing.includes(kind as never) ? 'text-danger' : 'text-muted-foreground'}`,
                          ),
                        ],
                        [
                          `${Math.round((stageOf(model.game).mix[kind] ?? 0) * 100)}% · ${money(KINDS[kind].value)}`,
                        ],
                      ),
                    ],
                  ),
                ),
                h,
              )
            : h.empty,
        ],
      ),
      h.div(
        [h.Class('flex gap-2 border-t border-border p-3')],
        [
          node.type === 'payments' && model.game.pending > 0
            ? h.button(
                [
                  h.Type('button'),
                  h.OnClick(Message.Collected()),
                  h.Class(
                    'flex h-10 flex-1 items-center justify-center gap-2 border border-ok bg-ok text-[13px] font-semibold text-white hover:bg-ok/90',
                  ),
                ],
                [`Collect ${money(model.game.pending)}`],
              )
            : h.empty,
          upgradable
            ? h.button(
                [
                  h.Type('button'),
                  h.Title('U'),
                  h.Disabled(model.game.cash < price),
                  h.OnClick(Message.UpgradeBought({ nodeId: node.id })),
                  h.Class(
                    'flex h-10 flex-1 items-center justify-between gap-2 border border-primary-strong bg-primary px-3 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground',
                  ),
                ],
                [
                  h.span(
                    [h.Class('flex items-center gap-1.5 truncate')],
                    [icon(h, ArrowUp, 'size-4 shrink-0'), upgradeLabel(node)],
                  ),
                  h.span([h.Class('font-mono text-[12px]')], [money(price)]),
                ],
              )
            : h.empty,
          def.fixed
            ? h.empty
            : h.button(
                [
                  h.Type('button'),
                  h.Title(`Sell for ${money(def.cost * 0.5)} (Delete)`),
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
