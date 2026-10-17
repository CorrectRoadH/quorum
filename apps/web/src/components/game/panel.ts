import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Message } from '@/game/message.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Panels: the bordered surfaces every screen is built from.
   ========================================================================== */

export const card = (
  children: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
  className = '',
): Html => h.div([h.Class(`border border-border bg-card ${className}`)], children)

export const cardHead = (label: string, right: Html, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex items-center justify-between gap-3 border-b border-border px-4 py-3')],
    [h.span([h.Class(EYEBROW)], [label]), right],
  )

export const cardBody = (
  children: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
  className = '',
): Html => h.div([h.Class(`px-4 py-4 ${className}`)], children)

export type KVCell = Readonly<{ label: string; value: string; tone?: string }>

export const kv = (cells: ReadonlyArray<KVCell>, h: HtmlBuilder<Message>): Html =>
  h.dl(
    [h.Class('grid grid-cols-[1fr_auto] gap-x-4 gap-y-2')],
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

export type MiniStatCell = Readonly<{ label: string; value: string; note: string }>

export const miniStat = (cells: ReadonlyArray<MiniStatCell>, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('grid grid-cols-4 border border-t-0 border-border bg-card')],
    cells.map((cell) =>
      h.div(
        [
          h.Key(cell.label),
          h.Class('flex flex-col gap-0.5 border-l border-border px-3.5 py-3 first:border-l-0'),
        ],
        [
          h.span([h.Class(EYEBROW)], [cell.label]),
          h.span([h.Class('font-mono text-[16px]')], [cell.value]),
          h.span([h.Class('text-[11px] text-muted-foreground')], [cell.note]),
        ],
      ),
    ),
  )

export const note = (text: string, h: HtmlBuilder<Message>): Html =>
  h.p([h.Class('text-[12px] leading-relaxed text-muted-foreground')], [text])

export const noteList = (texts: ReadonlyArray<string>, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex flex-col gap-2')],
    texts.map((text) =>
      h.p([h.Key(text), h.Class('text-[12px] leading-relaxed text-muted-foreground')], [text]),
    ),
  )

export const numbered = (texts: ReadonlyArray<string>, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex flex-col gap-2')],
    texts.map((text, index) =>
      h.p(
        [h.Key(text), h.Class('text-[12px] leading-relaxed text-muted-foreground')],
        [h.span([h.Class('font-semibold text-foreground')], [`${index + 1}. `]), text],
      ),
    ),
  )

export const sectionTitle = (
  eyebrow: string,
  title: string,
  blurb: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class('flex flex-col')],
    [
      h.span([h.Class(EYEBROW)], [eyebrow]),
      h.h2([h.Class('mt-2 text-[26px]')], [title]),
      h.p([h.Class('mt-2 max-w-[62ch] text-[15px] text-muted-foreground')], [blurb]),
    ],
  )
