import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { SCROLL } from '@quorum/ui/game/bits'
import type { Message, Model } from '../main.ts'
import type { Page } from '../page.ts'
import { childrenOf, navOf, pageAt } from '../pages.ts'
import { QUADRANTS } from './quadrant.ts'

/* The navigation rail: the current section's pages, and the open hub's pages beneath it. */

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
  // Home has no section of its own; it lists the tutorials, where a new player starts.
  const section = model.path === '/' ? 'tutorials' : (page?.section ?? 'tutorials')
  return h.nav(
    [
      h.AriaLabel(QUADRANTS[section].label),
      h.Class(
        cn(
          SCROLL,
          'sticky top-[100px] h-[calc(100dvh-100px)] self-start border-border py-8 pr-5 lg:block lg:border-r',
          model.menu ? 'block' : 'hidden',
        ),
      ),
    ],
    [
      h.div(
        [h.Class('mb-2 text-[12.5px] font-semibold text-foreground')],
        [QUADRANTS[section].label],
      ),
      ...navOf(section).flatMap((hub) => [
        navLink(hub, model.path, h),
        ...(hub.path === open
          ? [
              h.div(
                [h.Key(`${hub.path}-children`), h.Class('my-1 ml-1 border-l border-border')],
                childrenOf(hub.path).map((child) => navLink(child, model.path, h, true)),
              ),
            ]
          : []),
      ]),
    ],
  )
}
