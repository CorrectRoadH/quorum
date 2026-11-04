import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowRight } from 'lucide'
import { EYEBROW, PANEL } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import type { Message, Model } from './main.ts'
import type { Page } from './page.ts'
import { SECTION_LABELS, SECTION_ORDER, navOf } from './pages.ts'
import { GAME_ORIGIN, VERSION } from './site.ts'

/* The home page: the title screen's dark stage as a banner, the page's own prose, then each
   section with its first pages. */

type H = HtmlBuilder<Message>

const banner = (page: Page, h: H): Html =>
  h.section(
    [
      h.Class(
        'relative overflow-hidden rounded-2xl bg-[#141517] px-6 py-10 text-[#eaebec] shadow-card sm:px-10 sm:py-12',
      ),
    ],
    [
      // The title screen's isometric grid, faint.
      h.div(
        [
          h.AriaHidden(true),
          h.Class(
            'pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(30deg,#fff_1px,transparent_1px),linear-gradient(150deg,#fff_1px,transparent_1px)] [background-size:44px_26px]',
          ),
        ],
        [],
      ),
      h.div(
        [
          h.AriaHidden(true),
          h.Class(
            'pointer-events-none absolute -top-24 right-0 size-[420px] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.12_225/0.18),transparent)]',
          ),
        ],
        [],
      ),
      h.div(
        [h.Class('relative max-w-[60ch]')],
        [
          h.div(
            [h.Class('font-mono text-[11px] tracking-[0.12em] text-[#58cef8] uppercase')],
            [`Wiki · game version ${VERSION}`],
          ),
          h.h1(
            [h.Class('mt-3 text-[34px] font-semibold tracking-tight text-balance sm:text-[40px]')],
            ['How Quorum works'],
          ),
          h.p(
            [h.Class('mt-3 text-[16px] leading-relaxed text-[#eaebec]/75 text-pretty')],
            [page.summary],
          ),
          h.div(
            [h.Class('mt-6 flex flex-wrap gap-2.5')],
            [
              h.a(
                [
                  h.Href('/start/first-company'),
                  h.Class(
                    'press inline-flex h-10 items-center gap-2 rounded-xl bg-[#eaebec] px-4 text-[13.5px] font-medium text-[#141517]',
                  ),
                ],
                ['Start here', icon(h, ArrowRight, 'size-4')],
              ),
              h.a(
                [
                  h.Href(GAME_ORIGIN),
                  h.Class(
                    'press inline-flex h-10 items-center rounded-xl px-4 text-[13.5px] font-medium text-[#eaebec] shadow-[inset_0_0_0_1px_oklch(1_0_0/0.18)] hover:bg-white/5',
                  ),
                ],
                ['Play Quorum'],
              ),
            ],
          ),
        ],
      ),
    ],
  )

const sectionCard = (section: (typeof SECTION_ORDER)[number], h: H): Html => {
  const pages = navOf(section)
  if (pages.length === 0) return h.empty
  return h.section(
    [h.Key(section), h.Class(cn(PANEL, 'p-5'))],
    [
      h.h2([h.Class(EYEBROW)], [SECTION_LABELS[section]]),
      h.ul(
        [h.Class('mt-3 space-y-1')],
        pages
          .slice(0, 7)
          .map((target) =>
            h.li(
              [h.Key(target.path)],
              [
                h.a(
                  [
                    h.Href(target.path),
                    h.Class('group block rounded-lg px-2 py-1.5 -mx-2 hover:bg-well'),
                  ],
                  [
                    h.div([h.Class('text-[14px] font-medium')], [target.title]),
                    h.div(
                      [h.Class('line-clamp-1 text-[12.5px] text-muted-foreground')],
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
}

export const homeView = (page: Page, model: Model, h: H): Html =>
  h.div(
    [h.Class('min-w-0 space-y-4 xl:col-span-2')],
    [
      banner(page, h),
      h.div([h.Class(cn(PANEL, 'px-6 py-7 sm:px-10'))], [page.body(model, h)]),
      h.div(
        [h.Class('grid gap-4 md:grid-cols-2')],
        SECTION_ORDER.map((section) => sectionCard(section, h)),
      ),
    ],
  )
