import type { Document, Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowUpRight, Menu, Pencil, Play, Search, X } from 'lucide'
import { ERAS } from '@quorum/simulation/catalog'
import { EYEBROW, FIGURE, FLOAT, PANEL, SCROLL, WELL } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import { homeView } from './home.ts'
import { ALL_ERAS, Message, type Model } from './main.ts'
import type { Page } from './page.ts'
import { PAGES, SECTION_ORDER, childrenOf, navOf, pageAt } from './pages.ts'
import { QUADRANTS, quadrantBadge, quadrantColor } from './quadrant.ts'
import { eraPath } from './reference/shared.ts'
import { indexOf, search } from './search.ts'
import { GAME_ORIGIN, VERSION, WIKI_ORIGIN, editUrl, sourceUrl } from './site.ts'

/* ==========================================================================
   The wiki's frame, in the game's design language: the dotted board canvas
   behind, floating card surfaces, mono eyebrows, and the ink primary. A
   toolbar on top, the navigation on the left, the page in the middle, and
   its headings on the right.
   ========================================================================== */

type H = HtmlBuilder<Message>

const INDEX = indexOf(PAGES)

/** The Quorum q, as on the favicon. */
const mark = (h: H): Html =>
  h.svg(
    [h.AriaHidden(true), h.ViewBox('0 0 64 64'), h.Class('size-8 shrink-0')],
    [
      h.rect([h.Width('64'), h.Height('64'), h.Rx('14'), h.Fill('#141517')], []),
      h.g(
        [h.Transform('translate(18.5 9.5) scale(0.24)')],
        [
          h.path(
            [
              h.D('M89 11V150M50 11a39 39 0 1 0 0.01 0'),
              h.Fill('none'),
              h.Stroke('#eaebec'),
              h.StrokeWidth('22'),
            ],
            [],
          ),
          h.circle([h.Cx('89'), h.Cy('180'), h.R('14'), h.Fill('#58cef8')], []),
        ],
      ),
    ],
  )

const searchBox = (model: Model, h: H): Html => {
  const hits = model.searching ? search(INDEX, model.query) : []
  return h.div(
    [h.Class('relative min-w-0 flex-1 sm:max-w-[420px]')],
    [
      h.label(
        [h.Class(cn(WELL, 'flex h-9 items-center gap-2 px-3 text-muted-foreground'))],
        [
          icon(h, Search, 'size-4 shrink-0'),
          h.input([
            h.Id('search'),
            h.Type('search'),
            h.Value(model.query),
            h.Placeholder('Search the wiki'),
            h.AriaLabel('Search the wiki'),
            h.Autocomplete('off'),
            h.Spellcheck(false),
            h.Class(
              'h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground',
            ),
            h.OnInput((query) => Message.QueryChanged({ query })),
            h.OnKeyDown((key) => (key === 'Escape' ? Message.SearchClosed() : Message.Navigated())),
          ]),
          h.kbd(
            [
              h.Class(
                'hidden rounded-md bg-raised px-1.5 font-mono text-[11px] shadow-raised sm:block',
              ),
            ],
            ['/'],
          ),
        ],
      ),
      model.searching
        ? h.div(
            [
              h.Role('listbox'),
              h.AriaLabel('Search results'),
              h.Class(
                cn(FLOAT, 'absolute top-11 right-0 left-0 z-50 overflow-hidden p-1.5 enter-pop'),
              ),
            ],
            hits.length === 0
              ? [
                  h.p(
                    [h.Class('px-3 py-2.5 text-[13px] text-muted-foreground')],
                    ['No page matches.'],
                  ),
                ]
              : hits.map(({ page, heading }) =>
                  h.a(
                    [
                      h.Key(page.path),
                      h.Href(heading ? `${page.path}#${heading}` : page.path),
                      h.Class(
                        'block rounded-xl px-3 py-2 hover:bg-well focus-visible:bg-well focus-visible:outline-none',
                      ),
                    ],
                    [
                      h.div(
                        [h.Class('flex items-baseline justify-between gap-3')],
                        [
                          h.span(
                            [h.Class('text-[13.5px] font-medium text-foreground')],
                            [page.title],
                          ),
                          h.span([h.Class(EYEBROW)], [QUADRANTS[page.section].label]),
                        ],
                      ),
                      h.p(
                        [h.Class('mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground')],
                        [page.summary],
                      ),
                    ],
                  ),
                ),
          )
        : h.empty,
    ],
  )
}

const eraPicker = (model: Model, h: H): Html =>
  h.label(
    [h.Class('hidden items-center gap-2 lg:flex')],
    [
      h.span([h.Class(EYEBROW)], ['Spoilers']),
      h.select(
        [
          h.AriaLabel('Show content up to an Era'),
          h.Class(
            cn(
              WELL,
              'h-9 cursor-pointer rounded-lg px-2.5 text-[13px] text-foreground outline-none',
            ),
          ),
          h.OnChange((value) => Message.EraChosen({ era: Number(value) })),
        ],
        [
          h.option(
            [h.Value(String(ALL_ERAS)), h.Selected(model.era === ALL_ERAS)],
            ['Show all Eras'],
          ),
          ...ERAS.map((era, index) =>
            h.option(
              [h.Value(String(index)), h.Selected(model.era === index)],
              [`Up to ${era.name}`],
            ),
          ),
        ],
      ),
    ],
  )

const toolbar = (model: Model, h: H): Html =>
  h.header(
    [h.Class('sticky top-0 z-40 px-3 pt-3')],
    [
      h.div(
        [h.Class(cn(PANEL, 'mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-2.5 sm:gap-3'))],
        [
          h.button(
            [
              h.Type('button'),
              h.AriaLabel(model.menu ? 'Close the menu' : 'Open the menu'),
              h.AriaExpanded(model.menu),
              h.Class(
                'press grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-well lg:hidden',
              ),
              h.OnClick(Message.MenuToggled()),
            ],
            [icon(h, model.menu ? X : Menu, 'size-[18px]')],
          ),
          h.a(
            [h.Href('/'), h.Class('flex shrink-0 items-center gap-2.5 rounded-xl pr-2')],
            [
              mark(h),
              h.span(
                [h.Class('hidden flex-col leading-none sm:flex')],
                [
                  h.span([h.Class('text-[15px] font-semibold tracking-tight')], ['Quorum']),
                  h.span([h.Class(cn(EYEBROW, 'mt-1 text-[9.5px]'))], ['Wiki']),
                ],
              ),
            ],
          ),
          searchBox(model, h),
          h.div([h.Class('flex-1')], []),
          eraPicker(model, h),
          h.span(
            [
              h.Title(`Every number on the wiki matches Simulation version ${VERSION}`),
              h.Class(cn(WELL, 'hidden h-9 items-center gap-1.5 px-2.5 md:flex')),
            ],
            [
              h.span([h.Class(EYEBROW)], ['Game']),
              h.span([h.Class(cn(FIGURE, 'text-[13px]'))], [`v${VERSION}`]),
            ],
          ),
          h.a(
            [
              h.Href(GAME_ORIGIN),
              h.Class(
                'press flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary-fill px-3.5 text-[13px] font-medium text-on-primary-fill shadow-primary',
              ),
            ],
            [icon(h, Play, 'size-3.5'), h.span([h.Class('hidden sm:inline')], ['Play Quorum'])],
          ),
        ],
      ),
    ],
  )

const navLink = (page: Page, current: string, h: H, nested = false): Html =>
  h.a(
    [
      h.Key(page.path),
      h.Href(page.path),
      ...(page.path === current ? [h.AriaCurrent('page')] : []),
      h.Class(
        cn(
          'block truncate rounded-lg px-2.5 py-[5px] text-[13px] transition-colors',
          nested && 'pl-5 text-[12.5px]',
          page.path === current
            ? 'bg-well font-medium text-foreground shadow-well'
            : 'text-muted-foreground hover:bg-well/60 hover:text-foreground',
        ),
      ),
    ],
    [page.title],
  )

const sidebar = (model: Model, h: H): Html => {
  const page = pageAt(model.path)
  const open = page?.parent ?? page?.path ?? null
  return h.nav(
    [
      h.AriaLabel('Wiki'),
      h.Class(
        cn(
          PANEL,
          SCROLL,
          'sticky top-[84px] max-h-[calc(100dvh-96px)] self-start p-2.5 lg:block',
          model.menu ? 'block' : 'hidden',
        ),
      ),
    ],
    [
      navLink(
        { ...PAGES.find((candidate) => candidate.path === '/')!, title: 'Home' },
        model.path,
        h,
      ),
      ...SECTION_ORDER.flatMap((section) => {
        const pages = navOf(section)
        if (pages.length === 0) return []
        return [
          h.div(
            [h.Key(section), h.Class('mt-4')],
            [
              h.div(
                [h.Class('mb-1.5 flex items-center gap-2 px-2.5')],
                [
                  quadrantBadge(section, 'size-[18px]', h),
                  h.span([h.Class(EYEBROW)], [QUADRANTS[section].label]),
                ],
              ),
              ...pages.flatMap((hub) => [
                navLink(hub, model.path, h),
                ...(hub.path === open
                  ? childrenOf(hub.path).map((child) => navLink(child, model.path, h, true))
                  : []),
              ]),
            ],
          ),
        ]
      }),
    ],
  )
}

const contents = (page: Page, h: H): Html =>
  page.headings.length < 2
    ? h.empty
    : h.nav(
        [h.AriaLabel('On this page'), h.Class('sticky top-[96px] hidden xl:block')],
        [
          h.div([h.Class(cn(EYEBROW, 'mb-2'))], ['On this page']),
          h.ul(
            [h.Class('space-y-1 border-l border-hairline')],
            page.headings.map((heading) =>
              h.li(
                [h.Key(heading.id)],
                [
                  h.a(
                    [
                      h.Href(`#${heading.id}`),
                      h.Class(
                        cn(
                          '-ml-px block border-l border-transparent py-0.5 text-[12.5px] text-muted-foreground hover:border-foreground hover:text-foreground',
                          heading.level === 3 ? 'pl-6' : 'pl-3',
                        ),
                      ),
                    ],
                    [heading.text],
                  ),
                ],
              ),
            ),
          ),
        ],
      )

const footer = (page: Page, h: H): Html => {
  const related = page.related.flatMap((path) => {
    const target = pageAt(path)
    return target ? [target] : []
  })
  return h.footer(
    [h.Class('mt-12 space-y-6')],
    [
      related.length
        ? h.div(
            [],
            [
              h.div([h.Class(cn(EYEBROW, 'mb-2'))], ['See also']),
              h.div(
                [h.Class('grid gap-2 sm:grid-cols-2')],
                related.map((target) =>
                  h.a(
                    [
                      h.Key(target.path),
                      h.Href(target.path),
                      h.Class(
                        'rounded-xl bg-nested px-3.5 py-2.5 shadow-[inset_0_0_0_1px_var(--hairline-soft)] transition-colors hover:bg-well',
                      ),
                    ],
                    [
                      h.div([h.Class('text-[13.5px] font-medium')], [target.title]),
                      h.div(
                        [h.Class('mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground')],
                        [target.summary],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          )
        : h.empty,
      h.div(
        [
          h.Class(
            'flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-4 text-[12.5px] text-muted-foreground',
          ),
        ],
        [
          h.span([h.Class(FIGURE)], [`Matches game version ${VERSION}`]),
          page.source
            ? h.a(
                [
                  h.Href(editUrl(page.source)),
                  h.Class('inline-flex items-center gap-1 hover:text-foreground'),
                ],
                [icon(h, Pencil, 'size-3.5'), 'Edit on GitHub'],
              )
            : h.empty,
          page.gdd
            ? h.a(
                [
                  h.Href(sourceUrl(page.gdd)),
                  h.Class('inline-flex items-center gap-1 hover:text-foreground'),
                ],
                ['Design notes', icon(h, ArrowUpRight, 'size-3.5')],
              )
            : h.empty,
        ],
      ),
    ],
  )
}

/** Content from an Era the reader has not reached folds behind a toggle. */
const spoiler = (page: Page, model: Model, body: Html, h: H): Html => {
  const era = page.era
  if (era === null || model.era === ALL_ERAS || era <= model.era) return body
  return h.details(
    [h.Class('fold')],
    [
      h.summary(
        [h.Class(cn(WELL, 'cursor-pointer list-none px-4 py-3 text-[13.5px]'))],
        [
          h.span(
            [h.Class('font-medium')],
            [`This page is about the ${ERAS[era]?.name ?? ''} Era. `],
          ),
          h.span(
            [h.Class('text-muted-foreground')],
            ['You chose to hide later Eras. Show it anyway.'],
          ),
        ],
      ),
      h.div([h.Class('mt-6')], [body]),
    ],
  )
}

const article = (page: Page, model: Model, h: H): Html => {
  const parent = page.parent ? pageAt(page.parent) : null
  const color = quadrantColor(page.section)
  return h.article(
    [h.Class(cn(PANEL, 'min-w-0 overflow-clip')), h.DataAttribute('kind', page.section)],
    [
      h.header(
        [
          h.Class('relative border-b border-hairline px-5 pt-7 pb-7 sm:px-10 sm:pt-9'),
          h.Style({
            background: `linear-gradient(160deg, color-mix(in oklch, ${color} 20%, var(--card)) 0%, var(--card) 70%)`,
          }),
        ],
        [
          h.div(
            [h.Class('flex flex-wrap items-center gap-2.5')],
            [
              quadrantBadge(page.section, 'size-7', h),
              h.span([h.Class(cn(EYEBROW, 'text-foreground/70'))], [QUADRANTS[page.section].label]),
              ...(parent
                ? [
                    h.span([h.AriaHidden(true), h.Class('text-muted-foreground/50')], ['/']),
                    h.a(
                      [h.Href(parent.path), h.Class(cn(EYEBROW, 'hover:text-foreground'))],
                      [parent.title],
                    ),
                  ]
                : []),
              ...(page.era !== null
                ? [
                    h.a(
                      [
                        h.Href(eraPath(page.era)),
                        h.Class(
                          cn(
                            FIGURE,
                            'ml-auto rounded-full bg-card/70 px-2.5 py-1 text-[11px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline)] hover:text-foreground',
                          ),
                        ),
                      ],
                      [`Era ${page.era} · ${ERAS[page.era]?.name ?? ''}`],
                    ),
                  ]
                : []),
            ],
          ),
          h.h1(
            [
              h.Class(
                'mt-4 text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]',
              ),
            ],
            [page.title],
          ),
          h.p(
            [
              h.Class(
                'mt-3 max-w-[62ch] text-[16px] leading-relaxed text-pretty text-muted-foreground',
              ),
            ],
            [page.summary],
          ),
        ],
      ),
      h.div(
        [h.Class('px-5 py-8 sm:px-10')],
        [
          spoiler(
            page,
            model,
            page.aside
              ? h.div(
                  [h.Class('grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]')],
                  [
                    h.div([h.Class('order-2 min-w-0 lg:order-1')], [page.body(model, h)]),
                    h.div([h.Class('order-1 lg:order-2')], [page.aside(model, h)]),
                  ],
                )
              : page.body(model, h),
            h,
          ),
          footer(page, h),
        ],
      ),
    ],
  )
}

const notFound = (model: Model, h: H): Html =>
  h.article(
    [h.Class(cn(PANEL, 'px-10 py-12'))],
    [
      h.div([h.Class(EYEBROW)], ['404']),
      h.h1([h.Class('mt-2 text-[30px] font-semibold tracking-tight')], ['No page here']),
      h.p(
        [h.Class('mt-2 text-[15px] text-muted-foreground')],
        [`Nothing lives at ${model.path}. Search for it, or start from the home page.`],
      ),
      h.a(
        [
          h.Href('/'),
          h.Class(
            'press mt-6 inline-flex h-9 items-center rounded-xl bg-primary-fill px-3.5 text-[13px] font-medium text-on-primary-fill shadow-primary',
          ),
        ],
        ['Go to the home page'],
      ),
    ],
  )

export const view = (model: Model, h: H): Document => {
  const page = pageAt(model.path)
  const isHome = model.path === '/'
  return {
    title: page
      ? isHome
        ? 'Quorum Wiki'
        : `${page.title} · Quorum Wiki`
      : 'Not found · Quorum Wiki',
    lang: 'en',
    ...(page ? { canonical: `${WIKI_ORIGIN}${page.path}` } : {}),
    body: h.div(
      [h.Class('min-h-dvh pb-16')],
      [
        toolbar(model, h),
        h.div(
          [
            h.Class(
              'mx-auto grid max-w-[1440px] gap-4 px-3 pt-4 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)_196px]',
            ),
          ],
          [
            sidebar(model, h),
            page
              ? isHome
                ? homeView(page, model, h)
                : article(page, model, h)
              : notFound(model, h),
            page && !isHome ? contents(page, h) : h.empty,
          ],
        ),
      ],
    ),
  }
}
