import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowUpRight, ChevronRight, Pencil } from 'lucide'
import { ERAS } from '@quorum/simulation/catalog'
import { FIGURE } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import type { Message, Model } from '../main.ts'
import type { Page } from '../page.ts'
import { pageAt } from '../pages.ts'
import { eraPath } from '../reference/shared.ts'
import { VERSION, editUrl, sourceUrl } from '../site.ts'
import { hides } from '../submodels/spoilers.ts'
import { pathBar, pathNext } from './path-nav.ts'
import { QUADRANTS, quadrantBadge } from './quadrant.ts'

/* One page: its header, its body (and facts beside it), and its footer. */

type H = HtmlBuilder<Message>

const breadcrumbs = (page: Page, h: H): Html => {
  const parent = page.parent ? pageAt(page.parent) : null
  return h.div(
    [h.Class('flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground')],
    [
      quadrantBadge(page.section, 'size-4', h),
      h.span([], [QUADRANTS[page.section].label]),
      ...(parent
        ? [
            icon(h, ChevronRight, 'size-3.5 opacity-60'),
            h.a([h.Href(parent.path), h.Class('hover:text-foreground')], [parent.title]),
          ]
        : []),
    ],
  )
}

/** Content from an Era the reader has not reached folds behind a toggle. */
const spoiler = (page: Page, model: Model, body: Html, h: H): Html => {
  if (!hides(model.spoilers, page.era)) return body
  return h.details(
    [h.Class('fold')],
    [
      h.summary(
        [
          h.Class(
            'cursor-pointer list-none rounded-md border border-dashed border-border px-4 py-3 text-[13.5px]',
          ),
        ],
        [
          h.span(
            [h.Class('font-medium')],
            [`This page is about the ${ERAS[page.era ?? 0]?.name ?? ''} Era. `],
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

const footer = (page: Page, h: H): Html => {
  const related = page.related.flatMap((path) => {
    const target = pageAt(path)
    return target ? [target] : []
  })
  return h.footer(
    [h.Class('mt-16')],
    [
      related.length
        ? h.div(
            [h.Class('mb-10')],
            [
              h.div([h.Class('mb-3 text-[13px] font-semibold')], ['See also']),
              h.ul(
                [h.Class('divide-y divide-border border-y border-border')],
                related.map((target) =>
                  h.li(
                    [h.Key(target.path)],
                    [
                      h.a(
                        [h.Href(target.path), h.Class('group flex items-baseline gap-4 py-2.5')],
                        [
                          h.span(
                            [h.Class('shrink-0 text-[14px] font-medium group-hover:underline')],
                            [target.title],
                          ),
                          h.span(
                            [h.Class('min-w-0 truncate text-[13px] text-muted-foreground')],
                            [target.summary],
                          ),
                        ],
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
            'flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-[12.5px] text-muted-foreground',
          ),
        ],
        [
          page.source
            ? h.a(
                [
                  h.Href(editUrl(page.source)),
                  h.Class('inline-flex items-center gap-1.5 hover:text-foreground'),
                ],
                [icon(h, Pencil, 'size-3.5'), 'Edit this page on GitHub'],
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
          h.span([h.Class(cn(FIGURE, 'ml-auto'))], [`Game version ${VERSION}`]),
        ],
      ),
    ],
  )
}

export const article = (page: Page, model: Model, h: H): Html =>
  h.article(
    [h.Class('min-w-0 py-8 lg:px-10'), h.DataAttribute('kind', page.section)],
    [
      h.header(
        [h.Class('border-b border-border pb-8')],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-4')],
            [
              breadcrumbs(page, h),
              page.era !== null
                ? h.a(
                    [
                      h.Href(eraPath(page.era)),
                      h.Class(
                        cn(FIGURE, 'text-[12px] text-muted-foreground hover:text-foreground'),
                      ),
                    ],
                    [`Era ${page.era} · ${ERAS[page.era]?.name ?? ''}`],
                  )
                : h.empty,
            ],
          ),
          h.h1(
            [
              h.Class(
                'mt-4 text-[32px] leading-tight font-semibold tracking-[-0.025em] text-balance',
              ),
            ],
            [page.title],
          ),
          h.p(
            [
              h.Class(
                'mt-2 max-w-[65ch] text-[16px] leading-relaxed text-pretty text-muted-foreground',
              ),
            ],
            [page.summary],
          ),
          pathBar(page, model, h),
        ],
      ),
      h.div(
        [h.Class('pt-8')],
        [
          spoiler(
            page,
            model,
            page.aside
              ? h.div(
                  [h.Class('grid gap-10 lg:grid-cols-[minmax(0,1fr)_272px]')],
                  [
                    h.div([h.Class('order-2 min-w-0 lg:order-1')], [page.body(model, h)]),
                    h.div([h.Class('order-1 lg:order-2')], [page.aside(model, h)]),
                  ],
                )
              : page.body(model, h),
            h,
          ),
          pathNext(page, h),
          footer(page, h),
        ],
      ),
    ],
  )

export const notFound = (model: Model, h: H): Html =>
  h.article(
    [h.Class('py-16 lg:px-10')],
    [
      h.div([h.Class(cn(FIGURE, 'text-[13px] text-muted-foreground'))], ['404']),
      h.h1([h.Class('mt-2 text-[32px] font-semibold tracking-tight')], ['No page here']),
      h.p(
        [h.Class('mt-2 text-[15px] text-muted-foreground')],
        [`Nothing lives at ${model.path}. Search for it, or start from the home page.`],
      ),
      h.a(
        [
          h.Href('/'),
          h.Class('mt-6 inline-block text-[14px] font-medium underline underline-offset-4'),
        ],
        ['Go to the home page'],
      ),
    ],
  )
