import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { SCROLL } from '@quorum/ui/game/bits'
import type { Message, Model } from '../main.ts'
import type { Page } from '../page.ts'
import { PAGES, SECTION_ORDER, childrenOf, navOf, pageAt } from '../pages.ts'
import { QUADRANTS, quadrantBadge } from './quadrant.ts'

/* The navigation rail: each kind of page with its hubs, and the open hub's pages beneath it. */

type H = HtmlBuilder<Message>

const navLink = (page: Page, current: string, h: H, nested = false): Html =>
  h.a(
    [
      h.Key(page.path),
      h.Href(page.path),
      ...(page.path === current ? [h.AriaCurrent('page')] : []),
      h.Class(
        cn(
          'block truncate py-1 text-[13.5px] transition-colors',
          nested && '-ml-px border-l pl-3',
          page.path === current
            ? cn('font-medium text-foreground', nested && 'border-foreground')
            : cn(
                'text-muted-foreground hover:text-foreground',
                nested && 'border-transparent hover:border-foreground/30',
              ),
        ),
      ),
    ],
    [page.title],
  )

export const sidebar = (model: Model, h: H): Html => {
  const page = pageAt(model.path)
  const open = page?.parent ?? page?.path ?? null
  return h.nav(
    [
      h.AriaLabel('Wiki'),
      h.Class(
        cn(
          SCROLL,
          'sticky top-14 h-[calc(100dvh-56px)] self-start border-border py-8 pr-5 lg:block lg:border-r',
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
            [h.Key(section), h.Class('mt-6')],
            [
              h.div(
                [
                  h.Class(
                    'mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold text-foreground',
                  ),
                ],
                [quadrantBadge(section, 'size-4', h), QUADRANTS[section].label],
              ),
              ...pages.flatMap((hub) => [
                navLink(hub, model.path, h),
                ...(hub.path === open
                  ? [
                      h.div(
                        [
                          h.Key(`${hub.path}-children`),
                          h.Class('my-1 ml-1 border-l border-border'),
                        ],
                        childrenOf(hub.path).map((child) => navLink(child, model.path, h, true)),
                      ),
                    ]
                  : []),
              ]),
            ],
          ),
        ]
      }),
    ],
  )
}
