import type { Html, HtmlBuilder } from 'foldkit/html'
import { Expand, FlaskConical, Menu, CircleHelp, Pause, Play, Rocket, Scan, Undo2 } from 'lucide'
import { researchList } from '@/game/engine/catalog.ts'
import { canRaise } from '@/game/engine/actions.ts'
import type { Ledger } from '@/game/engine/ledger.ts'
import { eraOf, has, nextEra, researchReady } from '@/game/engine/lookups.ts'
import { clockOf } from '@/game/engine/solve.ts'
import { describeDelta, undoAvailable } from '@/game/feedback.ts'
import { compact, money, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { EYEBROW, figure } from './bits.ts'

/* ==========================================================================
   The HUD: the company at a glance, the funding round in reach, the clock,
   and what the last change did.
   ========================================================================== */

const iconButton = (
  label: string,
  glyph: Parameters<typeof icon>[1],
  message: Message,
  h: HtmlBuilder<Message>,
  active = false,
): Html =>
  h.button(
    [
      h.Type('button'),
      h.AriaLabel(label),
      h.Title(label),
      h.OnClick(message),
      h.Class(
        `grid size-9 place-items-center border transition-colors ${active ? 'border-primary-strong bg-primary/15 text-primary-strong' : 'border-border bg-card text-foreground hover:bg-muted'}`,
      ),
    ],
    [icon(h, glyph, 'size-4')],
  )

const funding = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const era = eraOf(game)
  const next = nextEra(game)
  const share = next ? Math.min(1, game.users / era.raiseAt) : 1
  const ready = canRaise(game)
  const clock = clockOf(game.time)
  return h.div(
    [h.Class('flex items-center gap-3')],
    [
      h.div(
        [h.Class('flex w-[176px] flex-col gap-1.5')],
        [
          h.div(
            [h.Class('flex items-baseline justify-between')],
            [
              h.span([h.Class('text-[13px] font-semibold')], [era.name]),
              h.span(
                [
                  h.Class('font-mono text-[10px] text-muted-foreground'),
                  h.Title('Calendar: one second is one minute'),
                ],
                [
                  `Day ${clock.day} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`,
                ],
              ),
            ],
          ),
          h.div(
            [
              h.Class('h-1.5 bg-muted'),
              h.Title(next ? `${next.name} round at ${compact(era.raiseAt)} users` : ''),
            ],
            [
              h.div(
                [
                  h.Class(
                    `h-full transition-[width] duration-300 ${ready ? 'bg-ok' : 'bg-primary-strong'}`,
                  ),
                  h.Style({ width: `${share * 100}%` }),
                ],
                [],
              ),
            ],
          ),
        ],
      ),
      ready && next
        ? h.button(
            [
              h.Type('button'),
              h.OnClick(Message.PanelOpened({ panel: 'offer' })),
              h.Class(
                'flex h-9 items-center gap-2 border border-ok bg-ok px-3 text-[13px] font-semibold text-white transition-colors hover:bg-ok/90 animate-in fade-in',
              ),
            ],
            [icon(h, Rocket, 'size-4'), `${next.name} offer`],
          )
        : h.empty,
    ],
  )
}

export const hud = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const income = has(game, 'stripe') ? ledger.revenue : 0
  const net = income - ledger.burn
  const then = game.history.at(-30)
  const trend = then ? game.users - then.users : 0
  const affordable = researchList.filter(
    (entry) => !has(game, entry.id) && researchReady(game, entry.id) && game.insight >= entry.cost,
  ).length
  const target = eraOf(game).apdexTarget
  const errors = ledger.errorShare * 100
  const percentiles = has(game, 'percentiles')
  const errorTitle = has(game, 'logs')
    ? Object.entries(ledger.errors)
        .filter(([, value]) => value > 0.005)
        .map(([cause, value]) => `${cause} ${rate(value)}/s`)
        .join(' · ') || 'No errors'
    : 'Research Structured logs to see causes'

  return h.header(
    [
      h.Class(
        'absolute inset-x-0 top-0 z-20 grid h-16 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-6 border-b border-border bg-card/95 px-4 backdrop-blur',
      ),
    ],
    [
      h.button(
        [
          h.Type('button'),
          h.OnClick(Message.TitleOpened()),
          h.Title('Title screen'),
          h.Class(
            'flex items-center gap-2 pr-1 text-[19px] font-semibold tracking-[-0.03em] hover:text-primary-strong',
          ),
        ],
        [icon(h, Menu, 'size-4 text-muted-foreground'), 'Quorum'],
      ),
      funding(model, h),
      h.div(
        [h.Class('flex items-center justify-center gap-6 overflow-hidden')],
        [
          figure(
            'Cash',
            money(game.cash),
            `${net >= 0 ? '+' : ''}${money(net)}/s`,
            game.cash < 0 ? 'danger' : net >= 0 && income > 0 ? 'ok' : 'plain',
            h,
          ),
          figure('Insight', compact(game.insight), `+${ledger.insight.toFixed(1)}/s`, 'plain', h),
          figure(
            'Users',
            compact(game.users),
            trend === 0 ? '' : `${trend > 0 ? '▲' : '▼'} ${compact(Math.abs(trend))}`,
            trend >= 0 ? 'ok' : 'danger',
            h,
          ),
          h.div(
            [h.Key('apdex'), h.Title(`Users grow above ${target.toFixed(2)} and leave below it`)],
            [
              figure(
                'Apdex',
                ledger.apdex.toFixed(2),
                `/ ${target.toFixed(2)}`,
                ledger.apdex >= target ? 'ok' : 'danger',
                h,
              ),
            ],
          ),
          h.div(
            [h.Key('errors'), h.Title(errorTitle)],
            [
              figure(
                'Errors',
                `${errors.toFixed(errors >= 10 ? 0 : 1)}%`,
                '',
                errors < 1 ? 'ok' : errors < 5 ? 'warn' : 'danger',
                h,
              ),
            ],
          ),
          figure(
            percentiles ? 'p99' : 'Latency',
            `${Math.round(percentiles ? ledger.p99 : ledger.latency)}`,
            percentiles ? `ms · mean ${Math.round(ledger.latency)}` : 'ms',
            'plain',
            h,
          ),
        ],
      ),
      h.div(
        [h.Class('flex items-center gap-1.5')],
        [
          h.button(
            [
              h.Type('button'),
              h.OnClick(
                Message.PanelOpened({ panel: model.panel === 'research' ? 'none' : 'research' }),
              ),
              h.Title('Research (R)'),
              h.Class(
                `relative flex h-9 items-center gap-2 border px-3 text-[13px] font-medium transition-colors ${model.panel === 'research' ? 'border-primary-strong bg-primary/15 text-primary-strong' : 'border-border bg-card hover:bg-muted'}`,
              ),
            ],
            [
              icon(h, FlaskConical, 'size-4'),
              'Research',
              affordable > 0
                ? h.span(
                    [
                      h.Class(
                        'grid h-4.5 min-w-4.5 place-items-center bg-primary-strong px-1 font-mono text-[10px] text-white',
                      ),
                    ],
                    [String(affordable)],
                  )
                : h.empty,
            ],
          ),
          h.div([h.Class('mx-1 h-6 w-px bg-border')], []),
          iconButton(
            model.paused ? 'Resume (Space)' : 'Pause (Space)',
            model.paused ? Play : Pause,
            Message.PauseToggled(),
            h,
            model.paused,
          ),
          h.button(
            [
              h.Type('button'),
              h.OnClick(Message.SpeedCycled()),
              h.Title('Speed (S)'),
              h.Class(
                `h-9 w-12 border font-mono text-[12px] ${model.speed > 1 ? 'border-primary-strong bg-primary/15 text-primary-strong' : 'border-border bg-card hover:bg-muted'}`,
              ),
            ],
            [`${model.speed}×`],
          ),
          iconButton('Fit the board', Scan, Message.BoardFitted(), h),
          iconButton(
            'How to play (H)',
            CircleHelp,
            Message.PanelOpened({ panel: model.panel === 'help' ? 'none' : 'help' }),
            h,
            model.panel === 'help',
          ),
          iconButton('Fullscreen (F)', Expand, Message.FullscreenToggled(), h),
        ],
      ),
    ],
  )
}

export const goalBar = (text: string, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class(
        'pointer-events-none absolute top-[76px] left-4 z-10 flex max-w-[460px] items-center gap-2.5 border border-border bg-card/95 px-3 py-2 text-[12.5px] shadow-sm',
      ),
    ],
    [h.span([h.Class(`${EYEBROW} text-primary-strong`)], ['Next']), text],
  )

/** Settling while the Design settles, then what the change did, with Undo. */
const undoButton = (danger: boolean, h: HtmlBuilder<Message>): Html =>
  h.button(
    [
      h.Type('button'),
      h.Title('Undo (Z), full refund'),
      h.OnClick(Message.UndoChosen()),
      h.Class(
        `ml-1 flex h-7 items-center gap-1.5 border px-2 text-[12px] font-medium ${danger ? 'border-danger bg-danger text-white hover:bg-danger/90' : 'border-border hover:bg-muted'}`,
      ),
    ],
    [icon(h, Undo2, 'size-3.5'), 'Undo'],
  )

export const changeBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const undo = undoAvailable(model)
  if (model.change) {
    return h.div(
      [
        h.Key('settling'),
        h.Class(
          'absolute top-[122px] left-4 z-10 flex items-center gap-2.5 border border-border bg-card/95 px-3 py-2 text-[12.5px] shadow-sm',
        ),
      ],
      [
        h.span(
          [
            h.Class(
              'size-3 animate-spin rounded-full border-2 border-primary-strong border-t-transparent',
            ),
          ],
          [],
        ),
        h.span([h.Class('font-medium')], ['Settling']),
        h.span(
          [h.Class('text-muted-foreground')],
          [model.change.count > 1 ? `${model.change.count} changes` : model.change.label],
        ),
        undo ? undoButton(false, h) : h.empty,
      ],
    )
  }
  const delta = model.delta
  if (!delta) return h.empty
  return h.div(
    [
      h.Key(`delta-${delta.id}`),
      h.Class(
        `absolute top-[122px] left-4 z-10 flex max-w-[460px] items-center gap-2.5 border bg-card/95 px-3 py-2 text-[12.5px] shadow-sm animate-in fade-in ${delta.worse ? 'border-danger/60' : 'border-ok/50'}`,
      ),
    ],
    [
      h.span([h.Class(`font-semibold ${delta.worse ? 'text-danger' : 'text-ok'}`)], ['Stable']),
      h.span(
        [h.Class('font-mono text-[11.5px] tabular-nums')],
        [describeDelta(delta, has(model.game, 'percentiles'))],
      ),
      undo ? undoButton(delta.worse, h) : h.empty,
    ],
  )
}
