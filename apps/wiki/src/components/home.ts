import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowRight } from 'lucide'
import {
  COMPONENT_IDS,
  ERAS,
  GLOSSARY,
  INCIDENT_IDS,
  researchList,
} from '@quorum/simulation/catalog'
import { SANDBOX_IDS } from '@quorum/simulation/sandbox'
import { FIGURE } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import type { Section } from '../frontmatter.ts'
import type { Message, Model } from '../main.ts'
import type { Page } from '../page.ts'
import { navOf, pageAt } from '../pages.ts'
import { PATHS, stepsOf } from '../paths.ts'
import { pathCard } from './path-nav.ts'
import { QUADRANTS, quadrantBadge } from './quadrant.ts'

/* The home page: what the wiki is, the guided paths, then the four kinds of page and the catalog. */

type H = HtmlBuilder<Message>

const heading = (title: string, h: H): Html =>
  h.h2([h.Class('text-[20px] font-semibold tracking-tight')], [title])

/** One kind of page: its badge, what it is for, and its first pages. */
const kind = (section: Section, h: H): Html =>
  h.section(
    [h.Key(section), h.Class('flex flex-col bg-background p-5')],
    [
      h.div(
        [h.Class('flex items-center gap-2')],
        [
          quadrantBadge(section, 'size-5', h),
          h.h3([h.Class('text-[15px] font-semibold')], [QUADRANTS[section].label]),
        ],
      ),
      h.p([h.Class('mt-1 text-[13px] text-muted-foreground')], [QUADRANTS[section].purpose]),
      h.ul(
        [h.Class('mt-3 flex flex-col')],
        navOf(section)
          .slice(0, 6)
          .map((target) =>
            h.li(
              [h.Key(target.path)],
              [
                h.a(
                  [h.Href(target.path), h.Class('block truncate py-1 text-[14px] hover:underline')],
                  [target.title],
                ),
              ],
            ),
          ),
      ),
    ],
  )

const COUNTS: ReadonlyArray<Readonly<{ path: string; value: number; label: string }>> = [
  { path: '/components', value: COMPONENT_IDS.length, label: 'Components' },
  { path: '/research', value: researchList.length, label: 'Research items' },
  { path: '/eras', value: ERAS.length, label: 'Eras' },
  { path: '/incidents', value: INCIDENT_IDS.length, label: 'Incidents' },
  { path: '/sandboxes', value: SANDBOX_IDS.length, label: 'Sandboxes' },
  { path: '/glossary', value: GLOSSARY.length, label: 'Engineering terms' },
]

const counts = (h: H): Html =>
  h.dl(
    [h.Class('grid grid-cols-2 border-y border-border sm:grid-cols-3 lg:grid-cols-6')],
    COUNTS.map((entry) =>
      h.a(
        [h.Key(entry.path), h.Href(entry.path), h.Class('group flex flex-col gap-0.5 py-4 pr-4')],
        [
          h.dd(
            [h.Class(cn(FIGURE, 'text-[24px] leading-none font-medium'))],
            [String(entry.value)],
          ),
          h.dt(
            [h.Class('text-[13px] text-muted-foreground group-hover:text-foreground')],
            [entry.label],
          ),
        ],
      ),
    ),
  )

const FIRST_TUTORIAL = '/tutorials/first-company'

const grid = (columns: string, items: ReadonlyArray<Html>, h: H): Html =>
  h.div(
    [h.Class(cn('grid gap-px overflow-hidden rounded-lg border border-border bg-border', columns))],
    items,
  )

export const homeView = (page: Page, model: Model, h: H): Html =>
  h.div(
    [h.Class('min-w-0 py-10 lg:col-span-2 xl:col-span-3')],
    [
      h.header(
        [h.Class('max-w-[62ch]')],
        [
          h.h1(
            [h.Class('text-[36px] leading-tight font-semibold tracking-[-0.03em]')],
            ['Quorum Wiki'],
          ),
          h.p(
            [h.Class('mt-3 text-[16.5px] leading-relaxed text-pretty text-muted-foreground')],
            [page.summary],
          ),
          // The link shows once the first tutorial is written.
          pageAt(FIRST_TUTORIAL)
            ? h.a(
                [
                  h.Href(FIRST_TUTORIAL),
                  h.Class(
                    'mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-medium hover:underline',
                  ),
                ],
                ['New to Quorum? Start with your first Company', icon(h, ArrowRight, 'size-4')],
              )
            : h.empty,
        ],
      ),
      h.section(
        [h.Class('mt-12')],
        [
          heading('Guided paths', h),
          h.div(
            [h.Class('mt-4')],
            [
              grid(
                'md:grid-cols-2 md:[&>:last-child:nth-child(odd)]:col-span-2',
                PATHS.filter((path) => stepsOf(path).length > 0).map((path) =>
                  pathCard(path, model, h),
                ),
                h,
              ),
            ],
          ),
        ],
      ),
      h.section(
        [h.Class('mt-12')],
        [
          heading('Browse', h),
          h.div(
            [h.Class('mt-4')],
            [
              grid(
                'sm:grid-cols-2 xl:grid-cols-4',
                (['tutorials', 'guides', 'explanation', 'reference'] as const).map((section) =>
                  kind(section, h),
                ),
                h,
              ),
            ],
          ),
          h.div([h.Class('mt-8')], [counts(h)]),
        ],
      ),
    ],
  )
