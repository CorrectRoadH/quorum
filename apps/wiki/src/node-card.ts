import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { COMPONENTS, type ComponentId } from '@quorum/simulation/catalog'
import { blankNode } from '@quorum/simulation/actions'
import { freeSandbox } from '@quorum/simulation/sandbox'
import { solveFlow } from '@quorum/simulation/solve'
import type { Game } from '@quorum/simulation/state'
import {
  FOOT_ICONS,
  ROW_ICONS,
  footerOf,
  levelOf,
  rowsOf,
  sizePips,
  type Row,
} from '@quorum/ui/board/card'
import { FIGURE, groupBadge, stackLogo } from '@quorum/ui/game/bits'
import { COMPONENT_ICONS } from '@quorum/ui/game/icons'
import { POOL_ICONS, poolColor } from '@quorum/ui/game/pools'
import { icon } from '@quorum/ui/primitives/icon'

/* ==========================================================================
   A Component's Node card, as the board draws it, in HTML. The rows come
   from the board's own card data (packages/ui/src/board/card.ts), solved on
   the free Sandbox's Design, so the card says what it says in the game.
   ========================================================================== */

/** The free Sandbox's Design, with the Component placed if it is not already on it. */
const sampleOf = (type: ComponentId): Readonly<{ game: Game; id: string }> => {
  const base = freeSandbox()
  const existing = base.nodes.find((node) => node.type === type)
  if (existing) return { game: base, id: existing.id }
  const id = `sample-${type}`
  return { game: { ...base, nodes: [...base.nodes, blankNode(base, id, type, 1080, 280)] }, id }
}

const TONE: Record<NonNullable<Row['tone']>, string> = {
  plain: 'text-foreground',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
}

const rowGlyph = <M>(row: Row, h: HtmlBuilder<M>): Html =>
  row.pool
    ? h.span([h.Style({ color: poolColor(row.pool) })], [icon(h, POOL_ICONS[row.pool], 'size-3.5')])
    : row.logo
      ? stackLogo(row.logo, 'size-3.5', h)
      : icon(h, ROW_ICONS[row.glyph], 'size-3.5 text-muted-foreground')

export const nodeCard = <M>(type: ComponentId, h: HtmlBuilder<M>): Html => {
  const def = COMPONENTS[type]
  const { game, id } = sampleOf(type)
  const node = game.nodes.find((entry) => entry.id === id)!
  const ledger = solveFlow(game)
  const rows = rowsOf(game, node, ledger)
  const footer = footerOf(game, node)
  const pips = sizePips(node)
  const level = levelOf(game, node)
  return h.figure(
    [
      h.AriaLabel(`${def.name} Node card`),
      h.Class('not-prose w-[216px] shrink-0 overflow-hidden rounded-xl bg-card shadow-raised'),
    ],
    [
      h.div(
        [
          h.Class('flex h-9 items-center gap-2 border-b border-hairline px-2.5'),
          h.Style({
            background: `linear-gradient(to right, color-mix(in oklch, var(--group-${def.group}) 22%, var(--card)), color-mix(in oklch, var(--group-${def.group}) 4%, var(--card)))`,
          }),
        ],
        [
          groupBadge(def.group, COMPONENT_ICONS[type], 'size-6', h),
          h.span([h.Class('min-w-0 flex-1 truncate text-[13px] font-semibold')], [def.name]),
          level
            ? h.span([h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))], [level])
            : h.empty,
          pips
            ? h.span(
                [h.AriaLabel(`Size ${pips.filled} of ${pips.total}`), h.Class('flex gap-[2px]')],
                Array.from({ length: pips.total }, (_, index) =>
                  h.span(
                    [
                      h.Key(String(index)),
                      h.Class(
                        cn(
                          'h-2.5 w-[3px] rounded-[1px]',
                          index < pips.filled ? 'bg-foreground/70' : 'bg-foreground/15',
                        ),
                      ),
                    ],
                    [],
                  ),
                ),
              )
            : h.empty,
        ],
      ),
      h.dl(
        [h.Class('py-1')],
        rows.map((row) =>
          h.div(
            [
              h.Key(row.name),
              h.Class('relative flex h-6 items-center gap-1.5 px-2.5 text-[11.5px]'),
            ],
            [
              rowGlyph(row, h),
              h.dt([h.Class('min-w-0 flex-1 truncate text-muted-foreground')], [row.name]),
              h.dd(
                [
                  h.Class(
                    cn(FIGURE, 'flex items-center gap-1 text-[11px]', TONE[row.tone ?? 'plain']),
                  ),
                ],
                [row.valueLogo ? stackLogo(row.valueLogo, 'size-3', h) : h.empty, row.value],
              ),
              row.bar !== undefined && row.bar > 0
                ? h.span(
                    [
                      h.AriaHidden(true),
                      h.Class(
                        'absolute right-2.5 bottom-0.5 left-2.5 h-[2px] rounded-full bg-current opacity-60',
                      ),
                      h.Style({ width: `calc((100% - 20px) * ${row.bar})` }),
                    ],
                    [],
                  )
                : h.empty,
            ],
          ),
        ),
      ),
      footer
        ? h.div(
            [h.Class('px-2 pb-2')],
            [
              h.span(
                [
                  h.Class(
                    cn(
                      'flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium',
                      footer.tone === 'accent'
                        ? 'bg-primary-fill text-on-primary-fill'
                        : footer.tone === 'danger'
                          ? 'bg-danger text-white'
                          : footer.tone === 'ok'
                            ? 'bg-ok text-white'
                            : 'bg-well text-muted-foreground',
                    ),
                  ),
                ],
                [icon(h, FOOT_ICONS[footer.glyph], 'size-3.5'), footer.text],
              ),
            ],
          )
        : h.empty,
    ],
  )
}
