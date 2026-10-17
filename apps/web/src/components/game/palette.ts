import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { Message } from '@/game/message.ts'
import type { Model, PaletteGroup } from '@/game/model.ts'
import { catalog } from '@/game/content.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   The catalog. Every Component a player can place, grouped by the Role that
   owns it. Placing spends Capital, so the price sits next to the name.
   ========================================================================== */

const GROUPS: ReadonlyArray<Readonly<{ key: PaletteGroup; label: string }>> = [
  { key: 'edge', label: 'Edge' },
  { key: 'data', label: 'Data' },
  { key: 'platform', label: 'Platform' },
]

const FAMILY_MARK: Record<'cluster' | 'managed', string> = {
  cluster: 'border-primary-strong/40 bg-primary/15 text-primary-strong',
  managed: 'border-dashed border-border bg-transparent text-muted-foreground',
}

const item = (
  entry: Readonly<{ glyph: string; name: string; cost: number; family: 'cluster' | 'managed' }>,
  h: HtmlBuilder<Message>,
): Html =>
  h.button(
    [
      h.Key(entry.name),
      h.Type('button'),
      h.OnClick(Message.CatalogItemPicked({ name: entry.name })),
      h.Class(
        'grid grid-cols-[18px_1fr_auto] items-center gap-2 border border-transparent px-1.5 py-1.5 text-left transition-colors hover:border-border hover:bg-muted',
      ),
    ],
    [
      h.span(
        [
          h.Class(
            `grid size-[18px] shrink-0 place-items-center border font-mono text-[8.5px] ${FAMILY_MARK[entry.family]}`,
          ),
        ],
        [entry.glyph],
      ),
      h.span([h.Class('truncate text-[12.5px]')], [entry.name]),
      h.span([h.Class('font-mono text-[10px] text-muted-foreground')], [`$${entry.cost}`]),
    ],
  )

export const palette = (model: Model, h: HtmlBuilder<Message>): Html => {
  const shown = catalog.filter((group) => group.key === model.paletteGroup)

  return h.aside(
    [h.Class('flex min-h-0 flex-col border-r border-border bg-card')],
    [
      h.div(
        [h.Class('flex flex-col gap-2 px-3 py-3')],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Catalog']),
              badge({ variant: 'outline' }, ['Edge Lead'], h),
            ],
          ),
          h.div(
            [h.Class('flex border border-border bg-muted p-0.5')],
            GROUPS.map((group) =>
              h.button(
                [
                  h.Key(group.key),
                  h.Type('button'),
                  h.OnClick(Message.PaletteGroupChosen({ group: group.key })),
                  h.Class(
                    `flex-1 py-1 text-center font-mono text-[9.5px] uppercase tracking-[0.08em] transition-colors ${
                      group.key === model.paletteGroup
                        ? 'bg-card text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`,
                  ),
                ],
                [group.label],
              ),
            ),
          ),
        ],
      ),
      h.div(
        [
          h.Class(
            'flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto [scrollbar-width:thin] px-2 pb-3',
          ),
        ],
        shown.flatMap((group) => [
          h.div(
            [h.Key(`group-${group.key}`), h.Class('flex justify-between px-1 pt-2.5 pb-1')],
            [
              h.span([h.Class(EYEBROW)], [group.label]),
              h.span(
                [h.Class('font-mono text-[9.5px] text-muted-foreground')],
                [String(group.items.length)],
              ),
            ],
          ),
          ...group.items.map((entry) => item(entry, h)),
        ]),
      ),
      h.div(
        [h.Class('flex items-center justify-between gap-2 border-t border-border px-3 py-2.5')],
        [
          h.span([h.Class(EYEBROW)], ['Drag to canvas']),
          h.span(
            [
              h.Class(
                'border border-border border-b-2 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground',
              ),
            ],
            ['/'],
          ),
        ],
      ),
    ],
  )
}
