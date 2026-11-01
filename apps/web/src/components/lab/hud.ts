import type { Html, HtmlBuilder } from 'foldkit/html'
import {
  CircleHelp,
  Expand,
  FlaskConical,
  Gem,
  type IconNode,
  Lightbulb,
  Menu,
  Pause,
  Play,
  Rocket,
  Scan,
  Smile,
  Timer,
  TriangleAlert,
  Undo2,
  Users,
  Wallet,
} from 'lucide'
import { researchList } from '@/game/engine/catalog.ts'
import { canRaise } from '@/game/engine/actions.ts'
import type { Ledger } from '@/game/engine/ledger.ts'
import { eraOf, has, nextEra, researchReady } from '@/game/engine/lookups.ts'
import { clockOf } from '@/game/engine/solve.ts'
import { describeDelta, undoAvailable } from '@/game/feedback.ts'
import { compact, money, ms, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { button } from '@/components/ui/button'
import { spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { CHIPS, FIGURE, PANEL, WELL, type Tone, meter, tool, toneText } from './bits.ts'

/* ==========================================================================
   The HUD: the company at a glance on the left, the controls on the right,
   and the goal and the last change in the middle.
   ========================================================================== */

/** A phone shows Apdex before Insight, Errors and Latency, which scroll off the edge. */
const CHIP_ORDER: Record<string, string> = {
  Insight: 'compact:order-1',
  Errors: 'compact:order-2',
  p99: 'compact:order-3',
  Latency: 'compact:order-3',
}

/** One stat: a glyph and its name, then the value and a short note. */
const stat = (
  name: string,
  glyph: IconNode,
  value: string,
  note: string,
  tone: Tone,
  h: HtmlBuilder<Message>,
  title = name,
): Html =>
  h.div(
    [
      h.Key(name),
      h.Title(title),
      h.Class(
        `flex h-8 items-center gap-2.5 px-2.5 compact:shrink-0 compact:gap-1.5 compact:px-3 ${CHIP_ORDER[name] ?? ''}`,
      ),
    ],
    [
      icon(h, glyph, 'size-3.5 shrink-0 text-muted-foreground'),
      h.span(
        [h.Class('w-[46px] shrink-0 text-[11.5px] text-muted-foreground compact:hidden')],
        [name],
      ),
      // With no note, the tone colours the value itself.
      h.span(
        [
          h.Class(
            cn(
              FIGURE,
              'text-[13.5px] leading-none whitespace-nowrap',
              note || tone === 'plain' ? '' : toneText(tone),
            ),
          ),
        ],
        [value],
      ),
      note
        ? h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'ml-auto text-[10px] leading-none whitespace-nowrap compact:ml-0.5',
                  tone === 'plain' ? 'text-muted-foreground' : toneText(tone),
                ),
              ),
            ],
            [note],
          )
        : h.empty,
    ],
  )

/** What the toolbar takes from the top row of a phone: the funding row leaves it free. */
const TOOLBAR_ROOM = 'compact:min-h-9 compact:pr-[var(--toolbar-w)]'

const funding = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const era = eraOf(game)
  const next = nextEra(game)
  const share = next ? Math.min(1, game.users / era.raiseAt) : 1
  const ready = canRaise(game)
  const clock = clockOf(game.time)
  return h.div(
    [
      h.Class('flex flex-col gap-1.5 px-2.5 pt-1.5 pb-2 compact:pb-1'),
      h.Title(next ? `${next.name} round at ${compact(era.raiseAt)} users` : era.name),
    ],
    [
      h.div(
        [h.Class(`flex items-center gap-2 ${TOOLBAR_ROOM}`)],
        [
          button(
            {
              onClick: Message.TitleOpened(),
              variant: 'ghost',
              size: 'icon-sm',
              className: '-ml-1.5 text-muted-foreground',
              attributes: [h.AriaLabel('Title screen'), h.Title('Title screen')],
            },
            icon(h, Menu, 'size-4'),
            h,
          ),
          h.span([h.Class('text-[13px] font-semibold compact:shrink-0')], [era.name]),
          h.span(
            [
              h.Class(cn(FIGURE, 'ml-auto text-[10.5px] text-muted-foreground compact:hidden')),
              h.Title('Calendar: one second is one minute'),
            ],
            [
              `D${clock.day} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`,
            ],
          ),
        ],
      ),
      meter(share, ready ? 'bg-ok' : 'bg-primary-fill', h),
      ready && next
        ? button(
            {
              onClick: Message.PanelOpened({ panel: 'offer' }),
              size: 'sm',
              className: 'enter-pop shine mt-1 w-full',
            },
            [icon(h, Rocket, 'size-3.5'), `${next.name} offer`],
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
        `absolute top-3 left-3 z-20 flex w-[248px] flex-col gap-1 p-1.5 ${PANEL} compact:pointer-events-auto compact:static compact:w-auto compact:p-1`,
      ),
    ],
    [
      funding(model, h),
      h.div(
        [h.Class(`flex flex-col divide-y divide-hairline ${WELL} ${CHIPS}`)],
        [
          stat(
            'Cash',
            Wallet,
            money(game.cash),
            `${net >= 0 ? '+' : ''}${money(net)}/s`,
            game.cash < 0 ? 'danger' : net >= 0 && income > 0 ? 'ok' : 'plain',
            h,
          ),
          stat(
            'Users',
            Users,
            compact(game.users),
            trend === 0 ? '' : `${trend > 0 ? '▲' : '▼'} ${compact(Math.abs(trend))}`,
            trend >= 0 ? 'ok' : 'danger',
            h,
          ),
          stat(
            'Insight',
            Gem,
            compact(game.insight),
            `+${ledger.insight.toFixed(1)}/s`,
            'plain',
            h,
          ),
          stat(
            'Apdex',
            Smile,
            game.apdex.toFixed(2),
            `/ ${target.toFixed(2)}`,
            game.apdex >= target ? 'ok' : 'danger',
            h,
            `Apdex over the last hour: users grow above ${target.toFixed(2)} and leave below it`,
          ),
          stat(
            'Errors',
            TriangleAlert,
            `${errors.toFixed(errors >= 10 ? 0 : 1)}%`,
            '',
            errors < 1 ? 'ok' : errors < 5 ? 'warn' : 'danger',
            h,
            `Errors: ${errorTitle}`,
          ),
          stat(
            percentiles ? 'p99' : 'Latency',
            Timer,
            ms(percentiles ? ledger.p99 : ledger.latency),
            percentiles ? `μ ${ms(ledger.latency)}` : '',
            'plain',
            h,
          ),
        ],
      ),
    ],
  )
}

const toolButton = (
  label: string,
  glyph: IconNode,
  message: Message,
  active: boolean,
  h: HtmlBuilder<Message>,
  extra: Html = h.empty,
): Html =>
  h.button(
    [
      h.Key(label),
      h.Type('button'),
      h.Title(label),
      h.AriaLabel(label),
      h.AriaPressed(active ? 'true' : 'false'),
      h.OnClick(message),
      h.Class(cn(tool(active), 'compact:size-9')),
    ],
    [icon(h, glyph, 'size-[18px]'), extra],
  )

const divider = (h: HtmlBuilder<Message>): Html =>
  h.div([h.Class('mx-0.5 h-6 w-px bg-hairline compact:hidden')], [])

export const toolbar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const affordable = researchList.filter(
    (entry) => !has(game, entry.id) && researchReady(game, entry.id) && game.insight >= entry.cost,
  ).length
  return h.nav(
    [
      h.Class(
        `absolute top-3 right-3 z-20 flex items-center gap-1 p-1.5 ${PANEL} compact:pointer-events-auto compact:top-[calc(max(8px,env(safe-area-inset-top))+10px)] compact:right-[calc(max(8px,env(safe-area-inset-right))+10px)] compact:gap-0.5 compact:bg-none compact:p-0 compact:shadow-none`,
      ),
    ],
    [
      model.sandbox
        ? h.empty
        : h.button(
            [
              h.Key('research'),
              h.Type('button'),
              h.Title('Research (R)'),
              h.AriaLabel('Research'),
              h.AriaPressed(model.panel === 'research' ? 'true' : 'false'),
              h.OnClick(
                Message.PanelOpened({ panel: model.panel === 'research' ? 'none' : 'research' }),
              ),
              h.Class(
                cn(
                  tool(model.panel === 'research'),
                  'flex w-auto gap-2 px-3 text-[13px] font-medium compact:size-9 compact:px-0',
                ),
              ),
            ],
            [
              icon(h, FlaskConical, 'size-[18px]'),
              h.span([h.Class('compact:hidden')], ['Research']),
              affordable > 0
                ? h.span(
                    [
                      h.Class(
                        cn(
                          FIGURE,
                          'enter-badge absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-ok px-1 text-[9.5px] leading-none font-semibold text-white shadow-raised',
                        ),
                      ),
                    ],
                    [String(affordable)],
                  )
                : h.empty,
            ],
          ),
      toolButton(
        'How to play (H)',
        CircleHelp,
        Message.PanelOpened({ panel: model.panel === 'help' ? 'none' : 'help' }),
        model.panel === 'help',
        h,
      ),
      divider(h),
      toolButton(
        model.paused ? 'Resume (Space)' : 'Pause (Space)',
        model.paused ? Play : Pause,
        Message.PauseToggled(),
        model.paused,
        h,
      ),
      h.button(
        [
          h.Key('speed'),
          h.Type('button'),
          h.Title('Speed (S)'),
          h.AriaLabel('Speed (S)'),
          h.OnClick(Message.SpeedCycled()),
          h.Class(cn(tool(model.speed > 1), FIGURE, 'text-[12.5px] font-medium compact:size-9')),
        ],
        [`${model.speed}×`],
      ),
      divider(h),
      toolButton('Fit the board', Scan, Message.BoardFitted(), false, h),
      h.div(
        [h.Class('contents narrow:hidden')],
        [toolButton('Fullscreen (F)', Expand, Message.FullscreenToggled(), false, h)],
      ),
    ],
  )
}

const pill = `flex max-w-[480px] compact:max-w-none items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-[12.5px] shadow-card`

export const goalBar = (text: string, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Key('goal'), h.Class(`${pill} short:hidden`)],
    [icon(h, Lightbulb, 'size-3.5 shrink-0 text-warn'), text],
  )

/** Settling while the Design settles, then what the change did, with Undo. */
const undoButton = (danger: boolean, h: HtmlBuilder<Message>): Html =>
  button(
    {
      onClick: Message.UndoChosen(),
      variant: danger ? 'destructive' : 'outline',
      size: 'icon-sm',
      className: 'pointer-events-auto ml-1',
      attributes: [h.Title('Undo (Z), full refund'), h.AriaLabel('Undo')],
    },
    icon(h, Undo2, 'size-3.5'),
    h,
  )

export const changeBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const undo = undoAvailable(model)
  if (model.change) {
    return h.div(
      [h.Key('settling'), h.Class(`enter-down ${pill}`)],
      [
        spinner({ className: 'size-3.5 text-muted-foreground' }, h),
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
    [h.Key(`delta-${delta.id}`), h.Class(`enter-down ${pill}`)],
    [
      h.span([h.Class(`size-2 shrink-0 rounded-full ${delta.worse ? 'bg-danger' : 'bg-ok'}`)], []),
      h.span(
        [h.Class(cn(FIGURE, 'text-[11.5px]'))],
        [describeDelta(delta, has(model.game, 'percentiles'))],
      ),
      undo ? undoButton(delta.worse, h) : h.empty,
    ],
  )
}
