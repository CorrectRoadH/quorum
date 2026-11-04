import type { Html, HtmlBuilder } from 'foldkit/html'
import type { IconNode } from 'lucide'
import type { BuildGroup, InsightPool } from '@quorum/simulation/catalog'
import { GROUP_SHAPES, type GroupShape, STACK_LOGOS, type StackLogoId } from '@/game/icons.ts'
import type { Message } from '@/game/message.ts'
import { POOL_ICONS, poolColor, poolName } from '@/game/pools.ts'
import type { Toast } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { cn } from '@/lib/utils'

/* ==========================================================================
   Small pieces every lab surface shares: the surfaces, group badges, brand marks,
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
/** A phone shows the figures as one row of chips that scrolls sideways. */
export const CHIPS =
  'compact:flex-row compact:divide-x compact:divide-y-0 compact:overflow-x-auto compact:[scrollbar-width:none]'

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

export const GROUP_TEXT: Record<BuildGroup, string> = {
  edge: 'text-group-edge',
  compute: 'text-group-compute',
  data: 'text-group-data',
  ops: 'text-group-ops',
}

/** Glyph scale inside each badge shape; a diamond has the least room. */
const GLYPH_SCALE: Record<GroupShape, number> = {
  hexagon: 0.5,
  chip: 0.48,
  disc: 0.52,
  diamond: 0.42,
}

/** A chip's pins: three short legs on each side of its body. */
const CHIP_PINS = [7.5, 12, 16.5].flatMap((at) => [
  [0.5, at - 0.9, 3.5, 1.8],
  [20, at - 0.9, 3.5, 1.8],
  [at - 0.9, 0.5, 1.8, 3.5],
  [at - 0.9, 20, 1.8, 3.5],
])

const shapeOf = (shape: GroupShape, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  // A stroke in the fill colour with round joins softens the polygon corners.
  const soft = [
    h.Fill('currentColor'),
    h.Stroke('currentColor'),
    h.StrokeWidth('2'),
    h.StrokeLinejoin('round'),
  ]
  switch (shape) {
    case 'hexagon':
      return [
        h.polygon(
          [h.Points('12,1.5 21.1,6.75 21.1,17.25 12,22.5 2.9,17.25 2.9,6.75'), ...soft],
          [],
        ),
      ]
    case 'diamond':
      return [h.polygon([h.Points('12,1.5 22.5,12 12,22.5 1.5,12'), ...soft], [])]
    case 'chip':
      return [
        ...CHIP_PINS.map(([x = 0, y = 0, w = 0, ht = 0]) =>
          h.rect(
            [
              h.X(String(x)),
              h.Y(String(y)),
              h.Width(String(w)),
              h.Height(String(ht)),
              h.Rx('0.6'),
              h.Fill('currentColor'),
              h.Opacity('0.75'),
            ],
            [],
          ),
        ),
        h.rect(
          [
            h.X('3.5'),
            h.Y('3.5'),
            h.Width('17'),
            h.Height('17'),
            h.Rx('3'),
            h.Fill('currentColor'),
          ],
          [],
        ),
      ]
    case 'disc':
      return [h.circle([h.Cx('12'), h.Cy('12'), h.R('11'), h.Fill('currentColor')], [])]
  }
}

/** What sits on a badge: a lucide glyph, or a filled brand path. */
export type BadgeContent = IconNode | Readonly<{ path: string }>

/**
 * A glyph on a shaped badge, knocked out in white. The shape says what part
 * of the system it belongs to: Edge hexagons, Compute chips, Data discs, Ops
 * diamonds. `color` overrides the group's colour; grey when `muted`.
 */
export const groupBadge = (
  group: BuildGroup,
  content: BadgeContent,
  className: string,
  h: HtmlBuilder<Message>,
  muted = false,
  color?: string,
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
          muted ? 'text-muted-foreground/35' : color ? '' : GROUP_TEXT[group],
          className,
        ),
      ),
      ...(color && !muted ? [h.Style({ color })] : []),
    ],
    [
      ...shapeOf(shape, h),
      h.g(
        [h.Transform(`translate(${offset} ${offset}) scale(${scale})`)],
        // A nested 24-unit svg; its currentColor is white.
        'path' in content
          ? [h.path([h.D(content.path), h.Fill('white')], [])]
          : [icon(h, content, 'size-6 text-white')],
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

/** One toast surface. A new message replaces the text in place and the surface
 *  morphs to fit it, so a run of messages never blinks; it leaves when the
 *  last one expires. */
export const toast = (value: Toast | null, overPanel: boolean, h: HtmlBuilder<Message>): Html =>
  value
    ? h.div(
        [
          h.Key('toast'),
          h.Role('status'),
          h.DataAttribute('morph', 'notice'),
          h.DataAttribute('exit', 'notice'),
          // A panel can fill a short screen, so the toast moves above it rather than over its actions.
          h.Class(
            `pointer-events-none fixed bottom-[176px] left-1/2 z-50 flex max-w-[calc(100%-16px)] -translate-x-1/2 justify-center rounded-xl bg-surface px-3.5 py-2.5 text-[13px] shadow-float enter-toast compact:right-[calc(max(8px,env(safe-area-inset-right))+52px)] compact:bottom-[calc(max(8px,env(safe-area-inset-bottom))+84px)] compact:left-[max(8px,env(safe-area-inset-left))] compact:max-w-none compact:translate-x-0 compact:justify-start ${
              overPanel
                ? 'short:top-[max(2px,env(safe-area-inset-top))]! short:right-auto! short:bottom-auto! short:left-1/2! short:max-w-[calc(100%-16px)]! short:translate-x-[-50%]! short:justify-center!'
                : ''
            }`,
          ),
        ],
        [
          h.div(
            [
              h.Key(`toast-${value.id}`),
              h.DataAttribute('exit', 'notice'),
              h.Class('swap flex w-max max-w-full shrink-0 items-center gap-2.5'),
            ],
            [
              h.span([h.Class(`size-2 shrink-0 rounded-full ${TOAST_MARK[value.tone]}`)], []),
              value.message,
            ],
          ),
        ],
      )
    : h.empty

/** A progress ring, from 0 to 1, drawn clockwise from the top. */
export const ring = (share: number, className: string, h: HtmlBuilder<Message>): Html => {
  const radius = 6
  const length = 2 * Math.PI * radius
  return h.svg(
    [
      h.AriaHidden(true),
      h.Class(className),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 16 16'),
      h.Fill('none'),
    ],
    [
      h.circle([
        h.Cx('8'),
        h.Cy('8'),
        h.R(String(radius)),
        h.Stroke('currentColor'),
        h.StrokeWidth('2'),
        h.Attribute('opacity', '0.2'),
      ]),
      h.circle([
        h.Cx('8'),
        h.Cy('8'),
        h.R(String(radius)),
        h.Stroke('currentColor'),
        h.StrokeWidth('2'),
        h.StrokeLinecap('round'),
        h.Attribute('stroke-dasharray', `${length}`),
        h.Attribute('stroke-dashoffset', `${length * (1 - Math.max(0, Math.min(1, share)))}`),
        h.Attribute('transform', 'rotate(-90 8 8)'),
        h.Class('transition-[stroke-dashoffset] duration-200 ease-out'),
      ]),
    ],
  )
}

/**
 * One Insight pool and a figure: the pool's own icon in its colour, then the
 * figure. `grey` draws it uncoloured; `tone` colours the figure.
 */
export const insightChip = (
  pool: InsightPool,
  figure: string,
  h: HtmlBuilder<Message>,
  grey = false,
  tone: Tone = 'plain',
): Html =>
  h.span(
    [
      h.Title(`${poolName(pool)} ${figure}`),
      h.AriaLabel(`${poolName(pool)} ${figure}`),
      h.Class(cn(FIGURE, 'inline-flex items-center gap-[3px] whitespace-nowrap')),
    ],
    [
      h.span(
        [
          h.Class('inline-flex'),
          h.Style({ color: grey ? 'var(--muted-foreground)' : poolColor(pool) }),
        ],
        [icon(h, POOL_ICONS[pool], 'size-3 shrink-0')],
      ),
      h.span(
        [
          h.AriaHidden(true),
          h.Class(grey ? 'text-muted-foreground' : tone === 'plain' ? '' : toneText(tone)),
        ],
        [figure],
      ),
    ],
  )
