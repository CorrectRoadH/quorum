import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import {
  ERAS,
  GLOSSARY,
  RESEARCH,
  type BuildGroup,
  type ResearchId,
} from '@quorum/simulation/catalog'
import { FIGURE } from '@quorum/ui/game/bits'
import type { Message } from '../main.ts'
import { proseAt } from '../content.ts'
import { headingsOf, prose } from '../prose.ts'
import { slug, type Heading, type Page, type View } from '../page.ts'

/* ==========================================================================
   The pieces every catalog page is built from: the facts box, sections with
   anchors, link lists, and hub cards. A catalog page reads its prose from
   content/<hub>/<id>.md when that file exists.
   ========================================================================== */

export type H = HtmlBuilder<Message>

export const eraName = (era: number): string => ERAS[era]?.name ?? `Era ${era}`

export const eraPath = (era: number): string => `/eras/${slug(eraName(era))}`

export const researchPath = (id: ResearchId): string => `/research/${id}`

export const termPath = (id: string): string => `/glossary/${id}`

export const termName = (id: string): string =>
  GLOSSARY.find((entry) => entry.id === id)?.term ?? id

/** A link inside the wiki. */
export const link = (path: string, text: string, h: H): Html =>
  h.a(
    [
      h.Href(path),
      h.Class(
        'underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground',
      ),
    ],
    [text],
  )

export const researchLink = (id: ResearchId, h: H): Html =>
  link(researchPath(id), RESEARCH[id].name, h)

/** Links separated by commas, or a dash when there are none. */
export const linkList = (items: ReadonlyArray<Html>, h: H): Html =>
  items.length === 0
    ? h.span([h.Class('text-muted-foreground')], ['—'])
    : h.span(
        [],
        items.flatMap((item, index) => (index === 0 ? [item] : [', ', item])),
      )

export type Fact = Readonly<{ name: string; value: Html | string }>

/** The facts box beside a page: the name with its mark, then one fact per row. */
export const factsBox = (
  title: string,
  badge: Html | null,
  _group: BuildGroup | null,
  facts: ReadonlyArray<Fact>,
  h: H,
): Html =>
  h.aside(
    [h.AriaLabel(`${title} facts`), h.Class('rounded-lg border border-border')],
    [
      h.div(
        [h.Class('flex items-center gap-2.5 border-b border-border px-4 py-3')],
        [badge ?? h.empty, h.span([h.Class('text-[14px] font-semibold')], [title])],
      ),
      h.dl(
        [h.Class('divide-y divide-border')],
        facts.map((fact) =>
          h.div(
            [h.Key(fact.name), h.Class('flex items-baseline justify-between gap-3 px-4 py-2')],
            [
              h.dt([h.Class('shrink-0 text-[13px] text-muted-foreground')], [fact.name]),
              h.dd(
                [h.Class(cn(FIGURE, 'min-w-0 text-right text-[12.5px] [overflow-wrap:anywhere]'))],
                [fact.value],
              ),
            ],
          ),
        ),
      ),
    ],
  )

/** A titled section of a catalog page, with an anchor the contents list links to. */
export const section = (title: string, content: ReadonlyArray<Html>, h: H): Html =>
  h.section(
    [h.Key(title)],
    [
      h.h2(
        [h.Id(slug(title)), h.Class('group')],
        [title, h.a([h.Href(`#${slug(title)}`), h.Class('anchor')], ['#'])],
      ),
      ...content,
    ],
  )

export const headingsFor = (titles: ReadonlyArray<string | null>): ReadonlyArray<Heading> =>
  titles.flatMap((title) => (title ? [{ id: slug(title), text: title, level: 2 as const }] : []))

export const paragraph = (text: string, h: H): Html => h.p([], [text])

/** Engineering terms a page teaches, as links into the glossary. */
export const termsSection = (ids: ReadonlyArray<string> | undefined, h: H): Html =>
  ids && ids.length
    ? section(
        'Engineering terms',
        [
          h.ul(
            [],
            ids.map((id) => h.li([h.Key(id)], [link(termPath(id), termName(id), h)])),
          ),
        ],
        h,
      )
    : h.empty

/** The hand-written prose for a catalog page, if any, and its source file for editing. */
export const authored = (
  path: string,
): Readonly<{
  view: View | null
  source: string | null
  text: string
  headings: ReadonlyArray<Heading>
}> => {
  const found = proseAt(path)
  if (!found) return { view: null, source: null, text: '', headings: [] }
  return {
    view: (model, h) => prose(found.document, model, h),
    source: found.source,
    text: found.text,
    headings: headingsOf(found.document),
  }
}

/** A tile on a hub page: mark, title, a line of facts, and the summary. */
export const hubCard = (page: Page, mark: Html, meta: string, h: H): Html =>
  h.a(
    [
      h.Key(page.path),
      h.Href(page.path),
      h.Class('group flex gap-3 bg-background p-4 transition-colors hover:bg-muted/60'),
    ],
    [
      mark,
      h.div(
        [h.Class('min-w-0')],
        [
          h.div(
            [h.Class('flex items-baseline gap-2')],
            [
              h.span([h.Class('text-[14px] font-medium')], [page.title]),
              h.span([h.Class('truncate text-[12px] text-muted-foreground')], [meta]),
            ],
          ),
          h.p(
            [h.Class('mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground')],
            [page.summary],
          ),
        ],
      ),
    ],
  )

export type Cell = Html | string

/** A table in the same nested style as a Markdown table. Columns after the first that hold figures align right. */
export const table = (
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<Readonly<{ key: string; cells: ReadonlyArray<Cell> }>>,
  h: H,
  figures: ReadonlyArray<number> = [],
): Html =>
  h.div(
    [h.Class('not-prose my-6 overflow-x-auto rounded-lg border border-border')],
    [
      h.table(
        [h.Class('w-full border-collapse text-[13.5px] leading-snug')],
        [
          h.thead(
            [],
            [
              h.tr(
                [],
                headers.map((header, index) =>
                  h.th(
                    [
                      h.Key(header),
                      h.Class(
                        cn(
                          'border-b border-border bg-muted/50 px-3 py-2 text-left text-[12.5px] font-medium whitespace-nowrap text-muted-foreground',
                          figures.includes(index) && 'text-right',
                        ),
                      ),
                    ],
                    [header],
                  ),
                ),
              ),
            ],
          ),
          h.tbody(
            [h.Class('divide-y divide-border')],
            rows.map((row) =>
              h.tr(
                [h.Key(row.key)],
                row.cells.map((cell, index) =>
                  h.td(
                    [
                      h.Class(
                        cn(
                          'px-3 py-2 align-top',
                          figures.includes(index) &&
                            cn(FIGURE, 'text-right text-[12.5px] whitespace-nowrap'),
                        ),
                      ),
                    ],
                    [cell],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    ],
  )

export const percent = (share: number): string => `${Math.round(share * 1000) / 10}%`

/** Tiles in a grid, separated by hairlines. */
export const cardGrid = (cards: ReadonlyArray<Html>, h: H): Html =>
  h.div(
    [
      h.Class(
        'not-prose my-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 sm:[&>:last-child:nth-child(odd)]:col-span-2',
      ),
    ],
    cards,
  )

/** A page's defaults, so each generator states only what differs. */
export const page = (
  fields: Partial<Page> & Pick<Page, 'path' | 'title' | 'summary' | 'body'>,
): Page => ({
  section: 'reference',
  parent: null,
  order: 100,
  era: null,
  aliases: [],
  source: null,
  gdd: null,
  headings: [],
  aside: null,
  related: [],
  text: '',
  ...fields,
})
