import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowUpRight, Menu, X } from 'lucide'
import { FIGURE } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import { Message, type Model } from '../main.ts'
import { PAGES, SECTION_ORDER, navOf, pageAt } from '../pages.ts'
import { QUADRANTS } from './quadrant.ts'
import { indexOf } from '../search.ts'
import { GAME_ORIGIN, VERSION } from '../site.ts'
import * as Search from '../submodels/search.ts'
import * as Spoilers from '../submodels/spoilers.ts'

const INDEX = indexOf(PAGES)

/* The header bar: the wordmark, the search, the spoiler filter, the game version, and Play. */

type H = HtmlBuilder<Message>

/** The Quorum q, as on the favicon. */
export const mark = (h: H): Html =>
  h.svg(
    [h.AriaHidden(true), h.ViewBox('0 0 64 64'), h.Class('size-7 shrink-0')],
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

export const header = (model: Model, h: H): Html =>
  h.header(
    [
      h.Class(
        'sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70',
      ),
    ],
    [
      h.div(
        [h.Class('mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6')],
        [
          h.button(
            [
              h.Type('button'),
              h.AriaLabel(model.menu ? 'Close the menu' : 'Open the menu'),
              h.AriaExpanded(model.menu),
              h.Class(
                '-ml-1 grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground lg:hidden',
              ),
              h.OnClick(Message.MenuToggled()),
            ],
            [icon(h, model.menu ? X : Menu, 'size-[18px]')],
          ),
          h.a(
            [h.Href('/'), h.Class('flex shrink-0 items-center gap-2 pr-3')],
            [
              mark(h),
              h.span([h.Class('text-[14.5px] font-semibold tracking-tight')], ['Quorum']),
              h.span([h.Class('hidden text-[14.5px] text-muted-foreground sm:inline')], ['Wiki']),
            ],
          ),
          h.submodel({
            slotId: 'search',
            model: model.search,
            view: Search.view,
            viewInputs: INDEX,
            toParentMessage: (message) => Message.SearchChanged({ message }),
          }),
          h.div([h.Class('flex-1')], []),
          h.submodel({
            slotId: 'spoilers',
            model: model.spoilers,
            view: Spoilers.view,
            toParentMessage: (message) => Message.SpoilersChanged({ message }),
          }),
          h.span(
            [
              h.Title(`Every number on the wiki matches game version ${VERSION}`),
              h.Class(cn(FIGURE, 'hidden text-[12px] text-muted-foreground md:inline')),
            ],
            [`v${VERSION}`],
          ),
          h.a(
            [
              h.Href(GAME_ORIGIN),
              h.Class(
                'flex h-8 shrink-0 items-center gap-1 rounded-md bg-foreground px-3 text-[13px] font-medium text-background hover:opacity-90',
              ),
            ],
            ['Play', icon(h, ArrowUpRight, 'size-3.5')],
          ),
        ],
      ),
      sections(model, h),
    ],
  )

/** The section bar: each kind of page links to its first page. The sidebar lists only the current one. */
const sections = (model: Model, h: H): Html => {
  const current = model.path === '/' ? null : (pageAt(model.path)?.section ?? null)
  return h.nav(
    [h.AriaLabel('Sections')],
    [
      h.div(
        [
          h.Class(
            'mx-auto flex h-11 max-w-[1400px] items-stretch gap-6 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none]',
          ),
        ],
        SECTION_ORDER.flatMap((section) => {
          const first = navOf(section)[0]
          if (!first) return []
          return [
            h.a(
              [
                h.Key(section),
                h.Href(first.path),
                ...(section === current ? [h.AriaCurrent('true')] : []),
                h.Class(
                  cn(
                    'flex shrink-0 items-center gap-2 border-b-2 text-[13.5px] transition-colors',
                    section === current
                      ? 'border-foreground font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  ),
                ),
              ],
              [icon(h, QUADRANTS[section].icon, 'size-4'), QUADRANTS[section].label],
            ),
          ]
        }),
      ),
    ],
  )
}
