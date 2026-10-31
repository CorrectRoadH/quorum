import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Message } from '@/game/message.ts'
import type { Toast } from '@/game/model.ts'

/* ==========================================================================
   Small pieces every lab surface shares: the illustrations, the language
   marks, labels, and the toast.
   ========================================================================== */

export const EYEBROW = 'font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground'
export const SCROLL = 'overflow-auto [scrollbar-width:thin]'
export const PANEL =
  'border border-border bg-card shadow-[0_1px_0_0_var(--border),0_12px_32px_-12px_oklch(0.259_0.052_263/0.18)]'

/** A two-letter monogram for a language, framework or technique. */
export const mark = (text: string, className: string, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Class(
        `grid shrink-0 place-items-center border border-border bg-secondary font-mono font-semibold text-primary-strong ${className}`,
      ),
    ],
    [text],
  )

/** A label over a value, for the HUD and the inspector. */
export const figure = (
  name: string,
  value: string,
  note: string,
  noteTone: 'plain' | 'ok' | 'warn' | 'danger',
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Key(name), h.Class('flex min-w-0 flex-col gap-0.5')],
    [
      h.span([h.Class(EYEBROW)], [name]),
      h.span(
        [
          h.Class(
            'flex items-baseline gap-1.5 font-mono text-[15px] leading-none tabular-nums text-foreground',
          ),
        ],
        [
          value,
          note
            ? h.span(
                [
                  h.Class(
                    `text-[10.5px] ${noteTone === 'ok' ? 'text-ok' : noteTone === 'warn' ? 'text-warn' : noteTone === 'danger' ? 'text-danger' : 'text-muted-foreground'}`,
                  ),
                ],
                [note],
              )
            : h.empty,
        ],
      ),
    ],
  )

const TOAST_TONE: Record<Toast['tone'], string> = {
  plain: 'border-border',
  ok: 'border-ok/50',
  warn: 'border-warn/60',
  danger: 'border-danger/60',
  primary: 'border-primary-strong/60',
}

const TOAST_MARK: Record<Toast['tone'], string> = {
  plain: 'bg-muted-foreground',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  primary: 'bg-primary-strong',
}

export const toast = (value: Toast | null, h: HtmlBuilder<Message>): Html =>
  value
    ? h.div(
        [
          h.Key(`toast-${value.id}`),
          h.Role('status'),
          h.Class(
            `pointer-events-none fixed top-[76px] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 border bg-card px-4 py-2.5 text-[13px] shadow-lg animate-in fade-in slide-in-from-top-2 ${TOAST_TONE[value.tone]}`,
          ),
        ],
        [h.span([h.Class(`size-2 shrink-0 ${TOAST_MARK[value.tone]}`)], []), value.message],
      )
    : h.empty
