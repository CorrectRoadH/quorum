import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Message } from '@/game/message.ts'

/* ==========================================================================
   The HUD stat cell. One number, its unit, and a tone the design owns:
   amber means "watch this", red means "this is failing".
   ========================================================================== */

export type StatTone = 'plain' | 'ok' | 'warn' | 'danger' | 'primary'

const TONE_TEXT: Record<StatTone, string> = {
  plain: 'text-muted-foreground',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  primary: 'text-primary-strong',
}

const cellClass =
  'flex min-w-[92px] flex-col gap-0.5 border-l border-border px-3.5 first:border-l-0'
const labelClass =
  'font-mono text-[9.5px] font-normal uppercase tracking-[0.1em] text-muted-foreground'
const valueClass = 'flex items-baseline gap-1.5 font-mono text-[14px] tabular-nums'

export const stat = (
  label: string,
  value: string,
  unit: string,
  tone: StatTone,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class(cellClass)],
    [
      h.span([h.Class(labelClass)], [label]),
      h.span(
        [h.Class(valueClass)],
        [
          h.span([], [value]),
          unit === '' ? h.empty : h.span([h.Class(`text-[10px] ${TONE_TEXT[tone]}`)], [unit]),
        ],
      ),
    ],
  )
