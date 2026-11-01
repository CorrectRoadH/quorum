import type { Html, HtmlBuilder } from 'foldkit/html'
import type { IconNode } from 'lucide'
import type { BuildGroup } from '@/game/engine/catalog.ts'
import { GROUP_SHAPES, type GroupShape, STACK_LOGOS, type StackLogoId } from '@/game/icons.ts'
import type { Message } from '@/game/message.ts'
import type { Toast } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

/* ==========================================================================
   Small pieces every lab surface shares: the surfaces, the language marks,
   labels, figures, and the toast. Depth comes from the four elevations in
   styles.css: well, raised, card, float.
   ========================================================================== */

export const EYEBROW =
  'font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground'
export const SCROLL = 'overflow-auto [scrollbar-width:thin]'
/** A panel resting on the board. */
export const PANEL = 'rounded-2xl bg-surface shadow-card'
/** A panel above everything else. */
export const FLOAT = 'rounded-2xl bg-surface shadow-float'
/** A group inside a panel, one step lighter, with hairline dividers. */
export const NESTED =
  'divide-y divide-hairline rounded-xl bg-nested shadow-[inset_0_0_0_1px_var(--hairline-soft)]'
/** A sunken strip: tracks, segmented controls, figure rows. */
export const WELL = 'rounded-xl bg-well shadow-well'
export const FIGURE = 'font-mono tabular-nums tracking-[-0.01em]'

/** A square icon control inside a panel: flat at rest, a raised ink fill when on. */
export const tool = (active: boolean): string =>
  cn(
    'press relative grid size-10 shrink-0 place-items-center rounded-xl',
    active
      ? 'bg-primary-fill text-on-primary-fill shadow-primary'
      : 'text-muted-foreground hover:bg-well hover:text-foreground',
  )

export type Tone = 'plain' | 'ok' | 'warn' | 'danger'

export const toneText = (tone: Tone): string =>
  tone === 'danger'
    ? 'text-danger'
    : tone === 'warn'
      ? 'text-warn'
      : tone === 'ok'
        ? 'text-ok'
        : 'text-foreground'

/** A monogram for a Component, language, framework or technique, sunk into its surface. */
export const mark = (text: string, className: string, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Class(
        cn(
          'grid shrink-0 place-items-center rounded-md bg-well font-mono font-semibold text-foreground shadow-well',
          className,
        ),
      ),
    ],
    [text],
  )

export const GROUP_TEXT: Record<BuildGroup, string> = {
  edge: 'text-group-edge',
  compute: 'text-group-compute',
  data: 'text-group-data',
  ops: 'text-group-ops',
}

/** Glyph scale inside each badge shape; a diamond has the least room. */
const GLYPH_SCALE: Record<GroupShape, number> = {
  hexagon: 0.5,
  chip: 0.56,
  disc: 0.52,
  diamond: 0.42,
}

const shapeOf = (shape: GroupShape, h: HtmlBuilder<Message>): Html => {
  // A stroke in the fill colour with round joins softens the polygon corners.
  const soft = [
    h.Fill('currentColor'),
    h.Stroke('currentColor'),
    h.StrokeWidth('2'),
    h.StrokeLinejoin('round'),
  ]
  switch (shape) {
    case 'hexagon':
      return h.polygon(
        [h.Points('12,1.5 21.1,6.75 21.1,17.25 12,22.5 2.9,17.25 2.9,6.75'), ...soft],
        [],
      )
    case 'diamond':
      return h.polygon([h.Points('12,1.5 22.5,12 12,22.5 1.5,12'), ...soft], [])
    case 'chip':
      return h.rect(
        [h.X('1.5'), h.Y('1.5'), h.Width('21'), h.Height('21'), h.Rx('6'), h.Fill('currentColor')],
        [],
      )
    case 'disc':
      return h.circle([h.Cx('12'), h.Cy('12'), h.R('11'), h.Fill('currentColor')], [])
  }
}

/**
 * A Component glyph on its build group's badge: the group's colour and shape,
 * with the glyph knocked out in white. Grey when `muted`, for locked entries.
 */
export const groupBadge = (
  group: BuildGroup,
  glyph: IconNode,
  className: string,
  h: HtmlBuilder<Message>,
  muted = false,
): Html => {
  const shape = GROUP_SHAPES[group]
  const scale = GLYPH_SCALE[shape]
  const offset = 12 - 12 * scale
  return h.svg(
    [
      h.AriaHidden(true),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(
        cn(
          'shrink-0 overflow-visible drop-shadow-[0_1px_1px_oklch(0_0_0/0.18)]',
          muted ? 'text-muted-foreground/35' : GROUP_TEXT[group],
          className,
        ),
      ),
    ],
    [
      shapeOf(shape, h),
      h.g(
        [h.Transform(`translate(${offset} ${offset}) scale(${scale})`)],
        // A nested 24-unit svg; its currentColor is white.
        [icon(h, glyph, 'size-6 text-white')],
      ),
    ],
  )
}

/** A language or framework brand mark, in its brand colour. */
export const stackLogo = (id: StackLogoId, className: string, h: HtmlBuilder<Message>): Html => {
  const logo = STACK_LOGOS[id]
  return h.svg(
    [
      h.AriaHidden(true),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 24 24'),
      h.Class(cn('shrink-0', logo.color ? '' : 'text-foreground', className)),
    ],
    [h.path([h.D(logo.path), h.Fill(logo.color ?? 'currentColor')], [])],
  )
}

/** A label over a value, for the HUD. */
export const figure = (
  name: string,
  value: string,
  note: string,
  noteTone: Tone,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Key(name), h.Class('flex min-w-0 flex-col gap-1 px-3.5 py-2')],
    [
      h.span([h.Class(EYEBROW)], [name]),
      h.span(
        [
          h.Class(
            cn(FIGURE, 'flex items-baseline gap-1.5 text-[15px] leading-none whitespace-nowrap'),
          ),
        ],
        [
          value,
          note
            ? h.span(
                [
                  h.Class(
                    cn(
                      'text-[10.5px]',
                      noteTone === 'plain' ? 'text-muted-foreground' : toneText(noteTone),
                    ),
                  ),
                ],
                [note],
              )
            : h.empty,
        ],
      ),
    ],
  )

/** A label and a value on one line, for nested groups. */
export const row = (name: string, value: string, tone: Tone, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Key(name), h.Class('flex items-baseline justify-between gap-3 px-3 py-1.5')],
    [
      h.span([h.Class('text-[12.5px] text-muted-foreground')], [name]),
      h.span([h.Class(cn(FIGURE, 'text-[12px] whitespace-nowrap', toneText(tone)))], [value]),
    ],
  )

/** A sunken track with a rounded fill. */
export const meter = (share: number, fill: string, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('h-1.5 overflow-hidden rounded-full bg-well shadow-well')],
    [
      h.div(
        [
          // The fill slides rather than resizing: transform skips layout, and progress moves linearly.
          h.Class(
            cn('h-full w-full rounded-full transition-transform duration-250 ease-linear', fill),
          ),
          h.Style({
            transform: `translateX(${(Math.max(0, Math.min(1, share)) - 1) * 100}%)`,
          }),
        ],
        [],
      ),
    ],
  )

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
            `pointer-events-none fixed bottom-[176px] left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-surface px-3.5 py-2.5 text-[13px] shadow-float enter-toast`,
          ),
        ],
        [
          h.span([h.Class(`size-2 shrink-0 rounded-full ${TOAST_MARK[value.tone]}`)], []),
          value.message,
        ],
      )
    : h.empty
