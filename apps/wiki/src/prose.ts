import * as Markdown from '@foldkit/markdown'
import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Message, Model } from './main.ts'
import { islandViews } from './island-views.ts'
import { type Heading, slug } from './page.ts'

/* ==========================================================================
   Markdown in the wiki's style. Headings get anchors, links stay in the
   wiki when they can, tables sit in the game's nested-group style, and
   directives become live islands (src/island-views.ts).
   ========================================================================== */

type Inline = Markdown.Inline

/** The plain text of inline content, for anchors and search. */
export const plain = (content: ReadonlyArray<Inline>): string =>
  content
    .map((node) => {
      switch (node._tag) {
        case 'Text':
        case 'InlineCode':
          return node.value
        case 'Emphasis':
        case 'Strong':
        case 'Strikethrough':
        case 'Link':
          return plain(node.content)
        default:
          return ''
      }
    })
    .join('')

/** The second- and third-level headings of a document, in order. */
export const headingsOf = (document: Markdown.MarkdownDocument): ReadonlyArray<Heading> =>
  document.blocks.flatMap((block): ReadonlyArray<Heading> => {
    if (block._tag !== 'Heading' || (block.level !== 2 && block.level !== 3)) return []
    const text = plain(block.content)
    return [{ id: slug(text), text, level: block.level }]
  })

/** The text of a document, for the search index. */
export const textOf = (document: Markdown.MarkdownDocument): string =>
  document.blocks
    .map((block) =>
      block._tag === 'Paragraph' || block._tag === 'Heading' ? plain(block.content) : '',
    )
    .join(' ')

const external = (url: string): boolean => /^https?:/.test(url)

export const prose = (
  document: Markdown.MarkdownDocument,
  model: Model,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class('prose')],
    Markdown.viewBlocks(document, {
      islands: islandViews(model, h),
      views: {
        Heading: (heading, content) => {
          const id = slug(plain(heading.content))
          const anchor = h.a(
            [h.Href(`#${id}`), h.AriaLabel('Link to this section'), h.Class('anchor')],
            ['#'],
          )
          return heading.level === 2
            ? h.h2([h.Id(id), h.Class('group')], [...content, anchor])
            : heading.level === 3
              ? h.h3([h.Id(id), h.Class('group')], [...content, anchor])
              : h.h4([h.Id(id)], content)
        },
        Link: ({ url }, content) =>
          h.a(
            [h.Href(url), ...(external(url) ? [h.Rel('noopener'), h.Target('_blank')] : [])],
            content,
          ),
        Table: (_table, header, rows) =>
          h.div(
            [
              h.Class(
                'overflow-x-auto rounded-xl bg-nested shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
              ),
            ],
            [
              h.table(
                [h.Class('w-full border-collapse text-[13.5px] leading-snug')],
                [h.thead([], [header]), h.tbody([h.Class('divide-y divide-hairline')], rows)],
              ),
            ],
          ),
        TableCell: (_cell, content, alignment, isHeader) =>
          isHeader
            ? h.th(
                [
                  h.Class(
                    'border-b border-hairline px-3 py-2 text-left font-mono text-[10.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase',
                  ),
                  ...(alignment === 'Right' ? [h.Style({ textAlign: 'right' })] : []),
                ],
                content,
              )
            : h.td(
                [
                  h.Class('px-3 py-2 align-top'),
                  ...(alignment === 'Right' ? [h.Style({ textAlign: 'right' })] : []),
                ],
                content,
              ),
      },
    }),
  )
