import type { Html, HtmlBuilder } from 'foldkit/html'
import { button } from '@/components/ui/button'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { roles } from '@/game/content.ts'
import {
  TICKS_IN_MONTH,
  calendarAt,
  errorsAt,
  latencyAt,
  loadAt,
  money,
} from '@/game/simulation.ts'
import { stat } from './stat.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   The run HUD: where the player is in the month, what it costs, and how the
   design is holding up. Read-only except for pause, speed, and End month.
   ========================================================================== */

const ROWS =
  'grid grid-cols-[minmax(210px,auto)_180px_minmax(0,1fr)_auto] items-center gap-6 border-b border-border bg-card px-5'

export const hud = (model: Model, h: HtmlBuilder<Message>): Html => {
  const { tick, playing, speed, capital, burn, spiked, overlay } = model.run
  const paused = overlay === 'pause'
  const load = loadAt(tick)
  const date = calendarAt(tick)
  const role = roles.find((entry) => entry.key === model.room.role)?.name ?? 'Edge Lead'

  return h.header(
    [h.Class(ROWS)],
    [
      h.div(
        [h.Class('flex min-w-0 flex-col gap-0.5')],
        [
          h.span([h.Class(EYEBROW)], [`Scenario 1 · ${model.room.code} · ${role}`]),
          h.span([h.Class('text-[16px] font-semibold tracking-[-0.02em]')], ['The Blog']),
          h.span(
            [h.Class('flex items-center gap-2 text-[12px] text-muted-foreground')],
            [
              `Week ${date.week} · ${date.label}`,
              h.span(
                [
                  h.Class(
                    'border border-transparent bg-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground',
                  ),
                ],
                [paused ? 'Paused' : playing ? 'Running' : 'Stopped'],
              ),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('flex flex-col gap-1')],
        [
          h.div(
            [h.Class('relative h-1.5 overflow-hidden bg-muted')],
            [
              h.div(
                [
                  h.Class(
                    'absolute inset-y-0 left-0 bg-primary-strong transition-[width] duration-200',
                  ),
                  h.Style({ width: `${Math.min(100, (tick / TICKS_IN_MONTH) * 100)}%` }),
                ],
                [],
              ),
              h.div(
                [
                  h.Class('absolute -top-[3px] -bottom-[3px] left-[42%] w-px bg-warn'),
                  h.Title('Tuesday spike'),
                ],
                [],
              ),
            ],
          ),
          h.div(
            [h.Class('flex justify-between font-mono text-[10px] text-muted-foreground')],
            [
              h.span([h.Class('tabular-nums')], [`${tick} / ${TICKS_IN_MONTH}`]),
              h.span([], ['ticks']),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('flex items-center justify-end')],
        [
          stat('Capital', money(capital), '+310', 'ok', h),
          stat('Burn / mo', money(burn), '', 'plain', h),
          stat('Load', `${load.toFixed(2)}k`, 'rps', 'plain', h),
          stat('p95', String(latencyAt(tick, spiked)), 'ms', 'warn', h),
          stat('Errors', errorsAt(tick, spiked), '%', 'danger', h),
        ],
      ),
      h.div(
        [h.Class('flex items-center gap-1.5')],
        [
          button(
            {
              variant: 'outline',
              size: 'icon',
              onClick: Message.OverlayOpened({ overlay: paused ? 'none' : 'pause' }),
              attributes: [h.AriaLabel('Pause the run'), h.Title('Pause (Esc)')],
            },
            h.span([h.Class('font-mono text-[11px]')], [paused ? '▶' : '❙❙']),
            h,
          ),
          button(
            {
              variant: 'outline',
              onClick: Message.SpeedCycled(),
              attributes: [h.Title('Run speed')],
            },
            `${speed}×`,
            h,
          ),
          button({ onClick: Message.MonthEnded() }, 'End month', h),
        ],
      ),
    ],
  )
}
