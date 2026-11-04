import * as Markdown from '@foldkit/markdown'
import type { HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowRight, Info, Lightbulb, TriangleAlert } from 'lucide'
import { COMPONENTS, ERAS, researchList } from '@quorum/simulation/catalog'
import { EYEBROW, PANEL, groupBadge } from '@quorum/ui/game/bits'
import { COMPONENT_ICONS } from '@quorum/ui/game/icons'
import { researchMark } from '@quorum/ui/game/research-marks'
import { icon } from '@quorum/ui/primitives/icon'
import { islandAttributes } from './islands.ts'
import type { Message, Model } from './main.ts'
import { mixBar } from './mix.ts'
import { sandboxView } from './sandbox-view.ts'

/* The live views behind each Markdown directive. src/islands.ts declares their attributes. */

const NOTE = {
  tip: { label: 'Tip', glyph: Lightbulb, tone: 'text-ok' },
  warn: { label: 'Watch out', glyph: TriangleAlert, tone: 'text-warn' },
  real: { label: 'How real is it', glyph: Info, tone: 'text-group-edge' },
} as const

export const islandViews = (model: Model, h: HtmlBuilder<Message>): Markdown.Islands =>
  Markdown.islandsFor(islandAttributes, {
    Note: ({ tone }, content) => {
      const note = NOTE[tone ?? 'tip']
      return h.aside(
        [
          h.Class(
            'not-prose my-5 rounded-xl bg-nested px-4 py-3 shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
          ),
        ],
        [
          h.div(
            [h.Class(`mb-1.5 flex items-center gap-1.5 ${EYEBROW}`)],
            [icon(h, note.glyph, `size-3.5 ${note.tone}`), note.label],
          ),
          h.div([h.Class('prose text-[14px] [&>*+*]:mt-2')], content),
        ],
      )
    },
    Sandbox: ({ id }, _content, index) => sandboxView(model, id, index, h),
    Component: ({ id }) => {
      const def = COMPONENTS[id]
      return h.a(
        [
          h.Href(`/components/${id}`),
          h.Class(
            cn(
              PANEL,
              'not-prose group my-5 flex max-w-md items-center gap-3.5 px-4 py-3 transition-[filter] hover:brightness-[0.985]',
            ),
          ),
        ],
        [
          groupBadge(def.group, COMPONENT_ICONS[id], 'size-10', h),
          h.span(
            [h.Class('min-w-0 flex-1')],
            [
              h.span(
                [h.Class('flex items-baseline gap-2')],
                [
                  h.span([h.Class('text-[15px] font-semibold tracking-tight')], [def.name]),
                  h.span([h.Class(cn(EYEBROW, 'text-[9.5px]'))], [def.product]),
                ],
              ),
              h.span(
                [h.Class('mt-0.5 block text-[13px] leading-snug text-muted-foreground')],
                [def.blurb],
              ),
            ],
          ),
          icon(
            h,
            ArrowRight,
            'size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5',
          ),
        ],
      )
    },
    Mix: ({ era }) => {
      const def = ERAS[Number(era)]
      return def
        ? h.figure(
            [h.Class('not-prose my-5')],
            [mixBar(def.mix, h), h.figcaption([h.Class(EYEBROW)], [`${def.name} request mix`])],
          )
        : h.empty
    },
    Track: ({ track }) =>
      h.ol(
        [h.Class('not-prose my-5 flex flex-wrap gap-2')],
        researchList
          .filter((entry) => entry.track === track)
          .map((entry) =>
            h.li(
              [h.Key(entry.id)],
              [
                h.a(
                  [
                    h.Href(`/research/${entry.id}`),
                    h.Class(
                      'press flex items-center gap-2 rounded-xl bg-raised py-1.5 pr-3 pl-1.5 text-[12.5px] font-medium shadow-raised hover:brightness-[0.985]',
                    ),
                  ],
                  [researchMark(entry, 'sm', false, h), entry.name],
                ),
              ],
            ),
          ),
      ),
  })
