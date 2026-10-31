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
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, PANEL, WELL, figure, meter } from './bits.ts'

/* ==========================================================================
   The HUD: the company at a glance, the funding round in reach, the clock,
   and what the last change did.
   ========================================================================== */

type Glyph = Parameters<typeof icon>[1]

const iconButton = (
  label: string,
  glyph: Glyph,
  message: Message,
  h: HtmlBuilder<Message>,
  active = false,
): Html =>
  button(
    {
      onClick: message,
      variant: active ? 'default' : 'outline',
      size: 'icon-lg',
      attributes: [h.AriaLabel(label), h.Title(label)],
    },
    icon(h, glyph, 'size-4'),
    h,
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
        [
          h.Class('flex w-[168px] flex-col gap-1.5'),
          h.Title(next ? `${next.name} round at ${compact(era.raiseAt)} users` : ''),
        ],
        [
          h.div(
            [h.Class('flex items-baseline justify-between')],
            [
              h.span([h.Class('text-[13px] font-semibold')], [era.name]),
              h.span(
                [
                  h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground')),
                  h.Title('Calendar: one second is one minute'),
                ],
                [
                  `Day ${clock.day} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`,
                ],
              ),
            ],
          ),
          meter(share, ready ? 'bg-ok' : 'bg-primary-fill', h),
        ],
      ),
      ready && next
        ? button(
            {
              onClick: Message.PanelOpened({ panel: 'offer' }),
              size: 'lg',
              className: 'animate-in fade-in',
            },
            [icon(h, Rocket, 'size-4'), `${next.name} offer`],
            h,
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
        `absolute inset-x-3 top-3 z-20 grid h-[60px] grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-4 px-2.5 ${PANEL}`,
      ),
    ],
    [
      button(
        {
          onClick: Message.TitleOpened(),
          variant: 'ghost',
          size: 'lg',
          className: 'gap-2 px-2 text-[17px] font-semibold tracking-[-0.03em]',
          attributes: [h.Title('Title screen')],
        },
        [icon(h, Menu, 'size-4 text-muted-foreground'), 'Quorum'],
        h,
      ),
      funding(model, h),
      h.div(
        [
          h.Class(
            `flex min-w-0 items-center divide-x divide-hairline overflow-hidden ${WELL} [&>*]:flex-1`,
          ),
        ],
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
          button(
            {
              onClick: Message.PanelOpened({
                panel: model.panel === 'research' ? 'none' : 'research',
              }),
              variant: model.panel === 'research' ? 'default' : 'outline',
              size: 'lg',
              className: cn('gap-2', affordable > 0 ? 'pr-1.5' : ''),
              attributes: [h.Title('Research (R)')],
            },
            [
              icon(h, FlaskConical, 'size-4'),
              'Research',
              affordable > 0
                ? badge({ className: cn(FIGURE, 'min-w-5') }, [String(affordable)], h)
                : h.empty,
            ],
            h,
          ),
          h.div([h.Class('mx-1 h-6 w-px bg-hairline')], []),
          iconButton(
            model.paused ? 'Resume (Space)' : 'Pause (Space)',
            model.paused ? Play : Pause,
            Message.PauseToggled(),
            h,
            model.paused,
          ),
          button(
            {
              onClick: Message.SpeedCycled(),
              variant: model.speed > 1 ? 'default' : 'outline',
              size: 'lg',
              className: cn(FIGURE, 'w-12 text-[12px]'),
              attributes: [h.Title('Speed (S)')],
            },
            `${model.speed}×`,
            h,
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

const pill = `absolute left-3 z-10 flex max-w-[480px] items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-[12.5px] shadow-card`

export const goalBar = (text: string, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class(`pointer-events-none top-[84px] ${pill}`)],
    [h.span([h.Class(`${EYEBROW} text-foreground`)], ['Next']), text],
  )

/** Settling while the Design settles, then what the change did, with Undo. */
const undoButton = (danger: boolean, h: HtmlBuilder<Message>): Html =>
  button(
    {
      onClick: Message.UndoChosen(),
      variant: danger ? 'destructive' : 'outline',
      size: 'sm',
      className: 'ml-1',
      attributes: [h.Title('Undo (Z), full refund')],
    },
    [icon(h, Undo2, 'size-3.5'), 'Undo'],
    h,
  )

export const changeBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const undo = undoAvailable(model)
  if (model.change) {
    return h.div(
      [h.Key('settling'), h.Class(`top-[130px] ${pill}`)],
      [
        spinner({ className: 'size-3.5 text-muted-foreground' }, h),
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
    [h.Key(`delta-${delta.id}`), h.Class(`top-[130px] animate-in fade-in ${pill}`)],
    [
      h.span([h.Class(`size-2 shrink-0 rounded-full ${delta.worse ? 'bg-danger' : 'bg-ok'}`)], []),
      h.span([h.Class(`font-semibold ${delta.worse ? 'text-danger' : 'text-ok'}`)], ['Stable']),
      h.span(
        [h.Class(cn(FIGURE, 'text-[11.5px]'))],
        [describeDelta(delta, has(model.game, 'percentiles'))],
      ),
      undo ? undoButton(delta.worse, h) : h.empty,
    ],
  )
}
