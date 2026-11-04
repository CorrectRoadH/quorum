import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowRight, Play, Search } from 'lucide'
import {
  COMPONENTS,
  COMPONENT_IDS,
  ERAS,
  GLOSSARY,
  INCIDENT_IDS,
  KINDS,
  researchList,
  type ComponentId,
} from '@quorum/simulation/catalog'
import { SANDBOX_IDS } from '@quorum/simulation/sandbox'
import { EYEBROW, FIGURE, PANEL, groupBadge } from '@quorum/ui/game/bits'
import { COMPONENT_ICONS } from '@quorum/ui/game/icons'
import { icon } from '@quorum/ui/primitives/icon'
import type { Section } from './frontmatter.ts'
import { Message, type Model } from './main.ts'
import type { Page } from './page.ts'
import { childrenOf, navOf } from './pages.ts'
import { QUADRANTS, quadrantBadge, quadrantColor } from './quadrant.ts'
import { GAME_ORIGIN, VERSION } from './site.ts'

/* ==========================================================================
   The home page, drawn as a board. The hero is the title screen's night
   shift with a small Design running in it: real Component badges, and
   requests in their kind's colour riding the wires. Below it the four kinds
   of page (Diátaxis) are four Nodes wired to one hub, and the catalog's
   size runs along the bottom as readouts.
   ========================================================================== */

type H = HtmlBuilder<Message>

/* ---------- the hero's Design ---------- */

type Placed = Readonly<{ id: ComponentId; x: number; y: number; readout: string }>

const STAGE = { w: 520, h: 300 }

const NODES: ReadonlyArray<Placed> = [
  { id: 'users', x: 54, y: 150, readout: '1.2k users' },
  { id: 'lb', x: 200, y: 150, readout: '24 rps' },
  { id: 'server', x: 340, y: 72, readout: 'p99 41 ms' },
  { id: 'server', x: 340, y: 228, readout: 'p99 38 ms' },
  { id: 'database', x: 470, y: 150, readout: '62% CPU' },
]

/** A wire from one Node's right port to the next one's left port, as the board routes it. */
const wire = (from: Placed, to: Placed): string => {
  const x1 = from.x + 34
  const x2 = to.x - 34
  const mid = (x1 + x2) / 2
  return `M${x1} ${from.y} C${mid} ${from.y} ${mid} ${to.y} ${x2} ${to.y}`
}

const [users, lb, app1, app2, db] = NODES as unknown as readonly [
  Placed,
  Placed,
  Placed,
  Placed,
  Placed,
]

const WIRES: ReadonlyArray<
  Readonly<{ key: string; d: string; kind: keyof typeof KINDS; delay: number }>
> = [
  { key: 'users-lb', d: wire(users, lb), kind: 'page', delay: 0 },
  { key: 'lb-app1', d: wire(lb, app1), kind: 'page', delay: 0.5 },
  { key: 'lb-app2', d: wire(lb, app2), kind: 'read', delay: 1.1 },
  { key: 'app1-db', d: wire(app1, db), kind: 'read', delay: 0.9 },
  { key: 'app2-db', d: wire(app2, db), kind: 'page', delay: 1.6 },
]

const hex = (kind: keyof typeof KINDS): string =>
  `#${KINDS[kind].color.toString(16).padStart(6, '0')}`

const design = (h: H): Html =>
  h.div(
    [
      h.AriaHidden(true),
      h.Class('relative hidden shrink-0 lg:block'),
      h.Style({ width: `${STAGE.w}px`, height: `${STAGE.h}px` }),
    ],
    [
      h.svg(
        [
          h.Class('absolute inset-0 overflow-visible'),
          h.Width(String(STAGE.w)),
          h.Height(String(STAGE.h)),
          h.ViewBox(`0 0 ${STAGE.w} ${STAGE.h}`),
          h.Fill('none'),
        ],
        [
          ...WIRES.map((entry) =>
            h.path(
              [
                h.Key(entry.key),
                h.D(entry.d),
                h.Stroke('#eaebec'),
                h.StrokeOpacity('0.22'),
                h.StrokeWidth('2'),
              ],
              [],
            ),
          ),
          ...WIRES.flatMap((entry) =>
            [0, 1].map((lap) =>
              h.circle(
                [
                  h.Key(`${entry.key}-${lap}`),
                  h.Class('packet'),
                  h.R('3.5'),
                  h.Fill(hex(entry.kind)),
                  h.Style({
                    offsetPath: `path('${entry.d}')`,
                    animationDelay: `${entry.delay + lap * 1.2}s`,
                  }),
                ],
                [],
              ),
            ),
          ),
        ],
      ),
      ...NODES.map((node, index) =>
        h.div(
          [
            h.Key(`${node.id}-${index}`),
            h.Class(
              'absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-[#1d1e21] py-1.5 pr-3 pl-1.5 shadow-[0_0_0_1px_oklch(1_0_0/0.1),0_8px_24px_oklch(0_0_0/0.4)]',
            ),
            h.Style({ left: `${node.x}px`, top: `${node.y}px` }),
          ],
          [
            groupBadge(COMPONENTS[node.id].group, COMPONENT_ICONS[node.id], 'size-7', h),
            h.span(
              [h.Class('flex flex-col leading-tight')],
              [
                h.span(
                  [h.Class('text-[12px] font-medium whitespace-nowrap text-[#eaebec]')],
                  [COMPONENTS[node.id].name],
                ),
                h.span(
                  [h.Class(cn(FIGURE, 'text-[10.5px] whitespace-nowrap text-[#eaebec]/55'))],
                  [node.readout],
                ),
              ],
            ),
          ],
        ),
      ),
    ],
  )

const hero = (page: Page, h: H): Html =>
  h.section(
    [h.Class('relative overflow-hidden rounded-[22px] bg-[#141517] text-[#eaebec] shadow-card')],
    [
      // The title screen's dotted floor, lit from the top right.
      h.div(
        [
          h.AriaHidden(true),
          h.Class(
            'pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,oklch(1_0_0/0.09)_1px,transparent_0)] [background-size:24px_24px]',
          ),
        ],
        [],
      ),
      h.div(
        [
          h.AriaHidden(true),
          h.Class(
            'pointer-events-none absolute -top-40 -right-20 size-[640px] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.12_225/0.2),transparent)]',
          ),
        ],
        [],
      ),
      h.div(
        [h.Class('relative flex items-center justify-between gap-10 px-6 py-10 sm:px-12 sm:py-14')],
        [
          h.div(
            [h.Class('max-w-[34rem]')],
            [
              h.div(
                [
                  h.Class(
                    'flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-[#58cef8] uppercase',
                  ),
                ],
                [
                  h.span([h.Class('size-1.5 animate-pulse rounded-full bg-[#58cef8]')], []),
                  `Game version ${VERSION}`,
                ],
              ),
              h.h1(
                [
                  h.Class(
                    'mt-4 text-[44px] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-[60px]',
                  ),
                ],
                ['Every Design breaks somewhere.'],
              ),
              h.p(
                [h.Class('mt-5 text-[16.5px] leading-relaxed text-pretty text-[#eaebec]/70')],
                [page.summary],
              ),
              h.div(
                [h.Class('mt-8 flex flex-wrap gap-2.5')],
                [
                  h.button(
                    [
                      h.Type('button'),
                      h.OnClick(Message.SearchFocused()),
                      h.Class(
                        'press inline-flex h-11 min-w-[15rem] items-center gap-2.5 rounded-xl bg-white/8 px-4 text-[14px] text-[#eaebec]/70 shadow-[inset_0_0_0_1px_oklch(1_0_0/0.14)] hover:bg-white/12',
                      ),
                    ],
                    [
                      icon(h, Search, 'size-4'),
                      'Search the wiki',
                      h.kbd(
                        [h.Class('ml-auto rounded-md bg-white/10 px-1.5 font-mono text-[11px]')],
                        ['/'],
                      ),
                    ],
                  ),
                  h.a(
                    [
                      h.Href(GAME_ORIGIN),
                      h.Class(
                        'press inline-flex h-11 items-center gap-2 rounded-xl bg-[#eaebec] px-4 text-[14px] font-medium text-[#141517]',
                      ),
                    ],
                    [icon(h, Play, 'size-4'), 'Play Quorum'],
                  ),
                ],
              ),
            ],
          ),
          design(h),
        ],
      ),
    ],
  )

/* ---------- the four kinds, as Nodes on a hub ---------- */

/** A kind's pages, counting each hub's children. */
const countOf = (section: Section): number =>
  navOf(section).reduce((total, hub) => total + 1 + childrenOf(hub.path).length, 0)

const kindNode = (section: Section, corner: 'tl' | 'tr' | 'bl' | 'br', h: H): Html => {
  const kind = QUADRANTS[section]
  const pages = navOf(section)
  const color = quadrantColor(section)
  const port = {
    tl: 'right-[-5px] bottom-[-5px]',
    tr: 'bottom-[-5px] left-[-5px]',
    bl: 'top-[-5px] right-[-5px]',
    br: 'top-[-5px] left-[-5px]',
  }[corner]
  return h.section(
    [h.Key(section), h.Class(cn(PANEL, 'relative flex flex-col'))],
    [
      h.span(
        [
          h.AriaHidden(true),
          h.Class(
            cn(
              'absolute z-10 hidden size-2.5 rounded-full ring-2 ring-[var(--card)] md:block',
              port,
            ),
          ),
          h.Style({ background: color }),
        ],
        [],
      ),
      h.div(
        [
          h.Class('flex items-center gap-3.5 rounded-t-2xl border-b border-hairline px-5 py-4'),
          h.Style({
            background: `linear-gradient(to right, color-mix(in oklch, ${color} 24%, var(--card)), color-mix(in oklch, ${color} 4%, var(--card)))`,
          }),
        ],
        [
          quadrantBadge(section, 'size-10', h),
          h.div(
            [h.Class('min-w-0 flex-1')],
            [
              h.h2([h.Class('text-[19px] font-semibold tracking-tight')], [kind.label]),
              h.p([h.Class('text-[13px] text-muted-foreground')], [kind.purpose]),
            ],
          ),
          h.span(
            [h.Class(cn(FIGURE, 'text-[12px] text-muted-foreground'))],
            [String(countOf(section))],
          ),
        ],
      ),
      h.ul(
        [h.Class('flex flex-1 flex-col p-2')],
        pages.length === 0
          ? [h.li([h.Class('px-3 py-2 text-[13px] text-muted-foreground')], ['Coming soon.'])]
          : pages
              .slice(0, 6)
              .map((target) =>
                h.li(
                  [h.Key(target.path)],
                  [
                    h.a(
                      [
                        h.Href(target.path),
                        h.Class(
                          'group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-well',
                        ),
                      ],
                      [
                        h.span(
                          [h.Class('min-w-0 flex-1')],
                          [
                            h.span([h.Class('block text-[14px] font-medium')], [target.title]),
                            h.span(
                              [h.Class('block truncate text-[12.5px] text-muted-foreground')],
                              [target.summary],
                            ),
                          ],
                        ),
                        icon(
                          h,
                          ArrowRight,
                          'size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100',
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

/** The q, as on the favicon, as the hub the four kinds wire into. */
const hubMark = (h: H): Html =>
  h.div(
    [
      h.AriaHidden(true),
      h.Class(
        'absolute top-1/2 left-1/2 z-10 hidden size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-[#141517] shadow-[0_0_0_6px_var(--canvas),0_8px_24px_oklch(0_0_0/0.25)] md:grid',
      ),
    ],
    [
      h.svg(
        [h.ViewBox('0 0 64 64'), h.Class('size-10')],
        [
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
      ),
    ],
  )

const axis = (text: string, className: string, h: H): Html =>
  h.span([h.AriaHidden(true), h.Class(cn(EYEBROW, 'absolute hidden md:block', className))], [text])

/* The grid's gaps, in px: each Node's inner corner sits this far from the hub's centre. */
const GAP = { x: 128, y: 96 }

/** Board-style cables from the hub to each Node's inner-corner port. */
const cables = (h: H): Html => {
  const dx = GAP.x / 2
  const dy = GAP.y / 2
  return h.svg(
    [
      h.AriaHidden(true),
      h.Class(
        'pointer-events-none absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 overflow-visible md:block',
      ),
      h.Width(String(GAP.x)),
      h.Height(String(GAP.y)),
      h.ViewBox(`${-dx} ${-dy} ${GAP.x} ${GAP.y}`),
      h.Fill('none'),
    ],
    (['tutorials', 'guides', 'explanation', 'reference'] as const).map((section, index) => {
      const sx = index % 2 === 0 ? -1 : 1
      const sy = index < 2 ? -1 : 1
      return h.path(
        [
          h.Key(section),
          h.D(`M${sx * dx} ${sy * dy} C${sx * dx * 0.2} ${sy * dy} ${sx * 12} ${sy * 14} 0 0`),
          h.Stroke(quadrantColor(section)),
          h.StrokeOpacity('0.7'),
          h.StrokeWidth('2'),
          h.StrokeLinecap('round'),
        ],
        [],
      )
    }),
  )
}

const compass = (h: H): Html =>
  h.div(
    [h.Class('relative md:pt-9 md:pl-9')],
    [
      axis('While you learn', 'top-1 left-[calc(25%+18px-32px)] -translate-x-1/2', h),
      axis('While you play', 'top-1 left-[calc(75%+18px+32px)] -translate-x-1/2', h),
      axis('Doing', 'top-[calc(25%+18px)] left-2 -translate-x-1/2 -rotate-90', h),
      axis('Knowing', 'top-[calc(75%+18px)] left-2 -translate-x-1/2 -rotate-90', h),
      h.div(
        [h.Class('relative')],
        [
          h.div(
            [
              h.Class('grid auto-rows-fr gap-4 md:grid-cols-2'),
              h.Style({ columnGap: `${GAP.x}px`, rowGap: `${GAP.y}px` }),
            ],
            [
              kindNode('tutorials', 'tl', h),
              kindNode('guides', 'tr', h),
              kindNode('explanation', 'bl', h),
              kindNode('reference', 'br', h),
            ],
          ),
          cables(h),
          hubMark(h),
        ],
      ),
    ],
  )

/* ---------- readouts ---------- */

const READOUTS: ReadonlyArray<Readonly<{ path: string; value: number; label: string }>> = [
  { path: '/components', value: COMPONENT_IDS.length, label: 'Components' },
  { path: '/research', value: researchList.length, label: 'Research items' },
  { path: '/eras', value: ERAS.length, label: 'Eras' },
  { path: '/incidents', value: INCIDENT_IDS.length, label: 'Incidents' },
  { path: '/sandboxes', value: SANDBOX_IDS.length, label: 'Sandboxes' },
  { path: '/glossary', value: GLOSSARY.length, label: 'Engineering terms' },
]

const readouts = (h: H): Html =>
  h.nav(
    [
      h.AriaLabel('The catalog'),
      h.Class(
        cn(PANEL, 'grid grid-cols-2 divide-hairline sm:grid-cols-3 lg:grid-cols-6 lg:divide-x'),
      ),
    ],
    READOUTS.map((entry) =>
      h.a(
        [
          h.Key(entry.path),
          h.Href(entry.path),
          h.Class('group flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-well/60'),
        ],
        [
          h.span(
            [h.Class(cn(FIGURE, 'text-[30px] leading-none font-medium tracking-[-0.04em]'))],
            [String(entry.value)],
          ),
          h.span(
            [h.Class('text-[12.5px] text-muted-foreground group-hover:text-foreground')],
            [entry.label],
          ),
        ],
      ),
    ),
  )

export const homeView = (page: Page, _model: Model, h: H): Html =>
  h.div([h.Class('min-w-0 space-y-6 xl:col-span-2')], [hero(page, h), readouts(h), compass(h)])
