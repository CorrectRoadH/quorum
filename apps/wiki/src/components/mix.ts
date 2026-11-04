import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { KINDS, type EraDef, type RequestKind } from '@quorum/simulation/catalog'
import { FIGURE } from '@quorum/ui/game/bits'

/* An Era's request mix, in each kind's colour from the game. */

const percent = (share: number): string => `${Math.round(share * 1000) / 10}%`

const colorOf = (kind: RequestKind): string => `#${KINDS[kind].color.toString(16).padStart(6, '0')}`

/** The Era's request mix as one bar; with `legend`, each kind's share beneath it. */
export const mixBar = <M>(mix: EraDef['mix'], h: HtmlBuilder<M>, legend = true): Html => {
  const entries = Object.entries(mix) as ReadonlyArray<[RequestKind, number]>
  return h.div(
    [h.Class(cn('not-prose flex flex-col gap-3', legend && 'my-5'))],
    [
      h.div(
        [
          h.Class('flex h-2 gap-px overflow-hidden rounded-full'),
          ...(legend
            ? [h.AriaHidden(true)]
            : [
                h.Role('img'),
                h.AriaLabel(
                  entries
                    .map(([kind, share]) => `${KINDS[kind].label} ${percent(share)}`)
                    .join(', '),
                ),
              ]),
        ],
        entries.map(([kind, share]) =>
          h.span(
            [
              h.Key(kind),
              h.Title(`${KINDS[kind].label} ${percent(share)}`),
              h.Style({ width: percent(share), background: colorOf(kind) }),
            ],
            [],
          ),
        ),
      ),
      legend
        ? h.ul(
            [h.Class('flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]')],
            entries.map(([kind, share]) =>
              h.li(
                [h.Key(kind), h.Class('inline-flex items-center gap-1.5')],
                [
                  h.span(
                    [h.Class('size-2.5 rounded-sm'), h.Style({ background: colorOf(kind) })],
                    [],
                  ),
                  KINDS[kind].label,
                  h.span([h.Class(cn(FIGURE, 'text-muted-foreground'))], [percent(share)]),
                ],
              ),
            ),
          )
        : h.empty,
    ],
  )
}
