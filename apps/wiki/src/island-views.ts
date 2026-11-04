import * as Markdown from '@foldkit/markdown'
import type { HtmlBuilder } from 'foldkit/html'
import { Info, Lightbulb, TriangleAlert } from 'lucide'
import { EYEBROW } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import { islandAttributes } from './islands.ts'
import type { Message, Model } from './main.ts'

/* The live views behind each Markdown directive. src/islands.ts declares their attributes. */

const NOTE = {
  tip: { label: 'Tip', glyph: Lightbulb, tone: 'text-ok' },
  warn: { label: 'Watch out', glyph: TriangleAlert, tone: 'text-warn' },
  real: { label: 'How real is it', glyph: Info, tone: 'text-group-edge' },
} as const

export const islandViews = (_model: Model, h: HtmlBuilder<Message>): Markdown.Islands =>
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
  })
