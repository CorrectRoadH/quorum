import type { Html, HtmlBuilder } from 'foldkit/html'
import { Expand, Pause, Play, Rocket, FlaskConical, Menu, CircleHelp, Scan } from 'lucide'
import { STAGES, researchList } from '@/game/engine/catalog.ts'
import { canRaise, has, researchReady, stageOf, type Flow } from '@/game/engine/sim.ts'
import { compact, money, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { EYEBROW, figure } from './bits.ts'

/* ==========================================================================
   The HUD: the company at a glance. Money, Insight, users, traffic and
   latency, the funding round in reach, and the clock controls.
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
  const stage = stageOf(game)
  const next = STAGES[game.stage + 1]
  const share = next ? Math.min(1, game.users / stage.raiseAt) : 1
  const ready = canRaise(game)
  return h.div(
    [h.Class('flex items-center gap-3')],
    [
      h.div(
        [h.Class('flex w-[168px] flex-col gap-1.5')],
        [
          h.div(
            [h.Class('flex items-baseline justify-between')],
            [
              h.span([h.Class('text-[13px] font-semibold')], [stage.name]),
              h.span(
                [h.Class('font-mono text-[10px] text-muted-foreground')],
                [next ? `${next.name} at ${compact(stage.raiseAt)}` : 'Public'],
              ),
            ],
          ),
          h.div(
            [h.Class('h-1.5 bg-muted')],
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
              h.OnClick(Message.RoundRaised()),
              h.Class(
                'flex h-9 items-center gap-2 border border-ok bg-ok px-3 text-[13px] font-semibold text-white transition-colors hover:bg-ok/90 animate-in fade-in',
              ),
            ],
            [icon(h, Rocket, 'size-4'), `Raise ${next.name} · ${money(stage.grant)}`],
          )
        : h.empty,
    ],
  )
}

export const hud = (model: Model, flow: Flow, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const net = flow.revenue - flow.burn
  const then = game.history.at(-30)
  const trend = then ? game.users - then.users : 0
  const affordable = researchList.filter(
    (entry) => !has(game, entry.id) && researchReady(game, entry.id) && game.insight >= entry.cost,
  ).length
  const quality = flow.quality * 100
  const income = has(game, 'stripe') ? flow.revenue : 0

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
        [h.Class('flex items-center justify-center gap-7 overflow-hidden')],
        [
          figure(
            'Capital',
            money(game.cash),
            `${(has(game, 'stripe') ? net : -flow.burn) >= 0 ? '+' : ''}${money(has(game, 'stripe') ? net : -flow.burn)}/s`,
            net >= 0 && income > 0 ? 'ok' : 'plain',
            h,
          ),
          figure('Insight', compact(game.insight), `+${flow.insight.toFixed(1)}/s`, 'plain', h),
          figure(
            'Users',
            compact(game.users),
            trend === 0 ? '' : `${trend > 0 ? '▲' : '▼'} ${compact(Math.abs(trend))}`,
            trend >= 0 ? 'ok' : 'danger',
            h,
          ),
          figure('Traffic', `${rate(flow.served)}`, `/ ${rate(flow.demand)} rps`, 'plain', h),
          figure(
            'Served',
            `${quality.toFixed(quality >= 99.95 ? 0 : 1)}%`,
            '',
            quality >= 95 ? 'ok' : quality >= 90 ? 'warn' : 'danger',
            h,
          ),
          figure(
            'Latency',
            `${Math.round(flow.latency)}`,
            'ms',
            flow.patience < 1 ? 'danger' : flow.latency > 160 ? 'warn' : 'plain',
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
              h.Title('Speed'),
              h.Class('h-9 w-11 border border-border bg-card font-mono text-[12px] hover:bg-muted'),
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

export const incidentBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const incident = model.game.incident
  if (!incident) return h.empty
  const title =
    incident.kind === 'spike' ? 'Front page' : incident.kind === 'ddos' ? 'DDoS' : 'Outage'
  return h.div(
    [
      h.Class(
        'pointer-events-none absolute top-[76px] right-4 z-10 flex items-center gap-3 border border-danger/60 bg-card px-3 py-2 text-[12.5px] text-danger shadow-sm',
      ),
    ],
    [
      h.span([h.Class('size-2 animate-pulse bg-danger')], []),
      h.span([h.Class('font-semibold')], [title]),
      h.span([h.Class('font-mono tabular-nums')], [`${Math.ceil(incident.remaining)}s`]),
    ],
  )
}
