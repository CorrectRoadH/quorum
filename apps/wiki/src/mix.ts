import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { KINDS, type EraDef, type RequestKind } from '@quorum/simulation/catalog'
import { FIGURE } from '@quorum/ui/game/bits'

/* An Era's request mix, in each kind's colour from the game. */

const percent = (share: number): string => `${Math.round(share * 1000) / 10}%`

const colorOf = (kind: RequestKind): string => `#${KINDS[kind].color.toString(16).padStart(6, '0')}`

/** The Era's request mix as one stacked bar, then a legend. */
export const mixBar = <M>(mix: EraDef['mix'], h: HtmlBuilder<M>): Html => {
  const entries = Object.entries(mix) as ReadonlyArray<[RequestKind, number]>
  return h.div(
    [h.Class('not-prose my-5 flex flex-col gap-3')],
    [
      h.div(
        [h.Class('flex h-3 overflow-hidden rounded-full shadow-well'), h.AriaHidden(true)],
        entries.map(([kind, share]) =>
          h.span([h.Key(kind), h.Style({ width: percent(share), background: colorOf(kind) })], []),
        ),
      ),
      h.ul(
        [h.Class('flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]')],
        entries.map(([kind, share]) =>
          h.li(
            [h.Key(kind), h.Class('inline-flex items-center gap-1.5')],
            [
              h.span([h.Class('size-2.5 rounded-sm'), h.Style({ background: colorOf(kind) })], []),
              KINDS[kind].label,
              h.span([h.Class(cn(FIGURE, 'text-muted-foreground'))], [percent(share)]),
            ],
          ),
        ),
      ),
    ],
  )
}
