import type { Html, HtmlBuilder } from 'foldkit/html'
import { Message } from '@/game/message.ts'
import type { Toast } from '@/game/model.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Screen chrome: the frames every screen sits in, the in-game header, the
   action strip, toasts, and the overlay panel used by the pause menu and the
   Tradeoff card. Everything is Tailwind utilities over the Quorum tokens.
   ========================================================================== */

export type FrameKind = 'title' | 'flow' | 'run' | 'report'

const FRAME_ROWS: Record<FrameKind, string> = {
  title: 'grid-rows-[minmax(0,1fr)_56px]',
  flow: 'grid-rows-[60px_minmax(0,1fr)_64px]',
  run: 'grid-rows-[60px_minmax(0,1fr)_300px]',
  report: 'grid-rows-[minmax(0,1fr)]',
}

export const frame = (
  kind: FrameKind,
  children: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Class(
        `grid h-full min-h-0 bg-background text-foreground ${FRAME_ROWS[kind]} overflow-hidden`,
      ),
    ],
    children,
  )

export type HeadConfig = Readonly<{
  back?: Message
  backLabel?: string
  title: string
  hint?: string
  right?: ReadonlyArray<Html>
}>

export const head = (config: HeadConfig, h: HtmlBuilder<Message>): Html =>
  h.header(
    [
      h.Class(
        'grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-border bg-card px-5',
      ),
    ],
    [
      config.back
        ? h.button(
            [
              h.Class(
                'flex items-center gap-2 border border-transparent px-2.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground',
              ),
              h.Type('button'),
              h.OnClick(config.back),
            ],
            [h.span([h.Class('font-mono text-[13px]')], ['←']), config.backLabel ?? 'Back'],
          )
        : h.span([], []),
      h.div(
        [h.Class('flex items-baseline gap-3 justify-self-center text-[14.5px] font-semibold')],
        [
          h.span([], [config.title]),
          config.hint
            ? h.span(
                [
                  h.Class(
                    'font-mono text-[9.5px] font-normal uppercase tracking-[0.15em] text-muted-foreground',
                  ),
                ],
                [config.hint],
              )
            : h.empty,
        ],
      ),
      h.div([h.Class('flex items-center gap-2')], config.right ?? []),
    ],
  )

export type FootConfig = Readonly<{
  hint: string
  actions: ReadonlyArray<Html>
  keys?: ReadonlyArray<string>
}>

export const foot = (config: FootConfig, h: HtmlBuilder<Message>): Html =>
  h.footer(
    [
      h.Class(
        'flex items-center justify-between gap-4 border-t border-border bg-card px-5 text-[12px] text-muted-foreground',
      ),
    ],
    [
      h.p([], [config.hint]),
      h.div(
        [h.Class('flex items-center gap-3')],
        [
          ...(config.keys ?? []).map((key) =>
            h.span(
              [
                h.Class(
                  'border border-border border-b-2 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground',
                ),
              ],
              [key],
            ),
          ),
          h.div([h.Class('flex items-center gap-2')], config.actions),
        ],
      ),
    ],
  )

const TOAST_TONE: Record<Toast['tone'], string> = {
  plain: 'border-border',
  ok: 'border-ok/40',
  warn: 'border-warn/40',
  danger: 'border-danger/40',
  primary: 'border-primary-strong/40',
}

const TOAST_MARK: Record<Toast['tone'], string> = {
  plain: 'bg-primary-strong',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  primary: 'bg-primary-strong',
}

export const toasts = (toast: Toast | null, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class(
        'pointer-events-none fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2',
      ),
      h.AriaLive('polite'),
    ],
    toast
      ? [
          h.div(
            [
              h.Key(String(toast.id)),
              h.Class(
                `flex items-center gap-2.5 border bg-card px-3.5 py-2.5 text-[13px] shadow-lg shadow-foreground/10 animate-in fade-in-0 slide-in-from-bottom-2 duration-150 ${TOAST_TONE[toast.tone]}`,
              ),
            ],
            [
              h.span([h.Class(`size-2 shrink-0 ${TOAST_MARK[toast.tone]}`)], []),
              h.span([], [toast.message]),
            ],
          ),
        ]
      : [],
  )

export type OverlayConfig = Readonly<{
  eyebrow: string
  title: string
  description?: string
  body: ReadonlyArray<Html>
  footer: ReadonlyArray<Html>
  width?: string
}>

/** The panel both overlays use: a backdrop button, then the panel itself. */
export const overlay = (config: OverlayConfig, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class('fixed inset-0 z-40 grid place-items-center bg-foreground/40 backdrop-blur-[2px]'),
      h.Role('dialog'),
      h.Attribute('aria-modal', 'true'),
    ],
    [
      h.button(
        [
          h.Class('absolute inset-0 cursor-default'),
          h.AriaLabel('Close'),
          h.Type('button'),
          h.OnClick(Message.OverlayClosed()),
        ],
        [],
      ),
      h.div(
        [
          h.Class(
            `relative border border-border bg-card shadow-2xl shadow-foreground/25 ${config.width ?? 'w-[680px] max-w-[92vw]'}`,
          ),
        ],
        [
          h.div(
            [h.Class('flex flex-col gap-2.5 border-b border-border px-6 py-5')],
            [
              h.span([h.Class(EYEBROW)], [config.eyebrow]),
              h.h2([h.Class('text-[26px] font-semibold')], [config.title]),
              config.description
                ? h.p(
                    [h.Class('max-w-[54ch] text-[13.5px] text-muted-foreground')],
                    [config.description],
                  )
                : h.empty,
            ],
          ),
          h.div([h.Class('px-6 py-5')], config.body),
          h.div(
            [
              h.Class(
                'flex items-center justify-between gap-3 border-t border-border bg-muted px-6 py-3.5',
              ),
            ],
            config.footer,
          ),
        ],
      ),
    ],
  )

export const rows = (
  id: string,
  cells: ReadonlyArray<Readonly<{ label: string; value: string; tone?: string }>>,
  h: HtmlBuilder<Message>,
): Html =>
  h.dl(
    [h.Key(id), h.Class('grid grid-cols-[1fr_auto] gap-x-4 gap-y-2')],
    cells.flatMap((cell) => [
      h.dt(
        [
          h.Key(`${cell.label}-k`),
          h.Class(
            'self-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground',
          ),
        ],
        [cell.label],
      ),
      h.dd(
        [h.Key(`${cell.label}-v`), h.Class(`text-right font-mono tabular-nums ${cell.tone ?? ''}`)],
        [cell.value],
      ),
    ]),
  )
