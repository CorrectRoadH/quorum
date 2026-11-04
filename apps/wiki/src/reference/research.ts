import type { Html } from 'foldkit/html'
import { cn } from 'cn'
import {
  COMPONENTS,
  COMPONENT_IDS,
  FEATURES,
  INCIDENTS,
  RESEARCH_TRACKS,
  RUNTIMES,
  TASKS,
  researchList,
  type ResearchDef,
} from '@quorum/simulation/catalog'
import { BY_RESEARCH } from '@quorum/simulation/discovery'
import { EYEBROW, FIGURE, SCROLL, insightChip } from '@quorum/ui/game/bits'
import { compact } from '@quorum/ui/game/format'
import { recipeOf } from '@quorum/ui/game/pools'
import { NODE_SIZE, researchLayout } from '@quorum/ui/game/research-layouts'
import { TRACK_ICONS, researchMark } from '@quorum/ui/game/research-marks'
import { icon } from '@quorum/ui/primitives/icon'
import type { Page } from '../page.ts'
import {
  authored,
  eraName,
  eraPath,
  factsBox,
  headingsFor,
  link,
  linkList,
  page,
  paragraph,
  researchLink,
  researchPath,
  section,
  termsSection,
  type H,
} from './shared.ts'
import { componentPath } from './components.ts'

/* One page per Research item, and the Research tree as the hub. Layout and marks are the game's. */

const trackLabel = (track: ResearchDef['track']): string =>
  RESEARCH_TRACKS.find((entry) => entry.key === track)?.label ?? track

const recipe = (entry: ResearchDef, h: H): Html =>
  h.span(
    [h.Class('inline-flex flex-wrap items-center justify-end gap-2')],
    recipeOf(entry.id).map(([pool, cost]) => insightChip(pool, compact(cost), h)),
  )

const unlocksOf = (entry: ResearchDef): ReadonlyArray<Readonly<{ path: string; text: string }>> => [
  ...COMPONENT_IDS.filter((id) => COMPONENTS[id].unlock === entry.id).map((id) => ({
    path: componentPath(id),
    text: COMPONENTS[id].name,
  })),
  ...Object.values(RUNTIMES)
    .filter((runtime) => runtime.research === entry.id)
    .map((runtime) => ({ path: `/runtimes/${runtime.id}`, text: runtime.name })),
  ...Object.values(TASKS)
    .filter((task) => task.research === entry.id)
    .map((task) => ({ path: '/team#tasks', text: `${task.name} (task)` })),
  ...Object.values(FEATURES)
    .filter((feature) => feature.research === entry.id)
    .map((feature) => ({ path: '/team#features', text: `${feature.name} (feature)` })),
]

const entity = (entry: ResearchDef): Page => {
  const path = researchPath(entry.id)
  const text = authored(path)
  const followUps = researchList.filter((candidate) => candidate.requires.includes(entry.id))
  const unlocks = unlocksOf(entry)
  const prevents = Object.values(INCIDENTS).filter((incident) =>
    incident.actions.includes(entry.id),
  )
  return page({
    path,
    title: entry.name,
    summary: entry.blurb,
    parent: '/research',
    order: researchList.indexOf(entry),
    era: entry.era,
    aliases: [entry.id, trackLabel(entry.track)],
    source: text.source,
    headings: [
      ...text.headings,
      ...headingsFor([
        unlocks.length ? 'What it unlocks' : null,
        'Prerequisites',
        prevents.length ? 'Incidents it prevents' : null,
        BY_RESEARCH[entry.id]?.length ? 'Engineering terms' : null,
      ]),
    ],
    text: `${entry.blurb} ${text.text}`,
    aside: (_model, h) =>
      factsBox(
        entry.name,
        researchMark(entry, 'sm', false, h),
        null,
        [
          { name: 'Track', value: trackLabel(entry.track) },
          { name: 'Era', value: link(eraPath(entry.era), eraName(entry.era), h) },
          { name: 'Cost', value: recipe(entry, h) },
          {
            name: 'Requires',
            value: linkList(
              entry.requires.map((id) => researchLink(id, h)),
              h,
            ),
          },
        ],
        h,
      ),
    body: (model, h) =>
      h.div(
        [h.Class('prose')],
        [
          ...(text.view ? [text.view(model, h)] : []),
          unlocks.length
            ? section(
                'What it unlocks',
                [
                  h.p(
                    [],
                    [
                      linkList(
                        unlocks.map((item) => link(item.path, item.text, h)),
                        h,
                      ),
                    ],
                  ),
                ],
                h,
              )
            : h.empty,
          section(
            'Prerequisites',
            [
              h.p(
                [],
                entry.requires.length
                  ? [
                      'Research these first: ',
                      linkList(
                        entry.requires.map((id) => researchLink(id, h)),
                        h,
                      ),
                      '.',
                    ]
                  : [
                      `It is a root of the ${trackLabel(entry.track)} track. Nothing comes before it.`,
                    ],
              ),
              ...(followUps.length
                ? [
                    h.p(
                      [],
                      [
                        'It leads to ',
                        linkList(
                          followUps.map((next) => researchLink(next.id, h)),
                          h,
                        ),
                        '.',
                      ],
                    ),
                  ]
                : []),
            ],
            h,
          ),
          prevents.length
            ? section(
                'Incidents it prevents',
                [
                  h.ul(
                    [],
                    prevents.map((incident) =>
                      h.li(
                        [h.Key(incident.id)],
                        [link(`/incidents/${incident.id}`, incident.name, h)],
                      ),
                    ),
                  ),
                ],
                h,
              )
            : h.empty,
          termsSection(BY_RESEARCH[entry.id], h),
        ],
      ),
    related: ['/research'],
  })
}

const entities = researchList.map(entity)

/** The game's Research tree, read-only: each item links to its page. */
const tree = (h: H): Html => {
  const layout = researchLayout()
  return h.div(
    [
      // column-reverse opens the box scrolled to the bottom, where the Garage Era and the roots are.
      h.Class(
        cn(
          SCROLL,
          'not-prose flex max-h-[72vh] flex-col-reverse overflow-auto rounded-lg border border-border bg-canvas',
        ),
      ),
      h.AriaLabel('Research tree'),
    ],
    [
      h.div(
        [
          h.Class('relative shrink-0'),
          h.Style({ width: `${layout.width}px`, height: `${layout.height}px` }),
        ],
        [
          ...layout.bands.map((band) =>
            h.div(
              [
                h.Key(`era-${band.era}`),
                h.Class('absolute border-t border-hairline'),
                h.Style({
                  left: `${band.x}px`,
                  top: `${band.y}px`,
                  width: `${band.w}px`,
                  height: `${band.h}px`,
                }),
              ],
              [
                h.a(
                  [
                    h.Href(eraPath(band.era)),
                    h.Class(cn(EYEBROW, 'absolute top-3 left-5 hover:text-foreground')),
                  ],
                  [eraName(band.era)],
                ),
              ],
            ),
          ),
          ...layout.tracks.map((track) =>
            h.div(
              [
                h.Key(`root-${track.track}`),
                h.Class(
                  'absolute flex w-[180px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2',
                ),
                h.Style({ left: `${track.x}px`, top: `${track.y}px` }),
              ],
              [
                h.span(
                  [
                    h.Class(
                      'grid size-14 place-items-center rounded-xl border border-border bg-background',
                    ),
                  ],
                  [icon(h, TRACK_ICONS[track.track], 'size-6')],
                ),
                h.span([h.Class('text-[14px] font-semibold')], [track.label]),
              ],
            ),
          ),
          h.svg(
            [
              h.AriaHidden(true),
              h.Class('pointer-events-none absolute inset-0 overflow-visible'),
              h.Width(String(layout.width)),
              h.Height(String(layout.height)),
              h.Fill('none'),
            ],
            layout.wires.map((wire) =>
              h.path(
                [
                  h.Key(wire.key),
                  h.D(wire.d),
                  h.StrokeWidth(wire.root ? '2' : '1.5'),
                  h.StrokeLinecap('round'),
                  h.StrokeLinejoin('round'),
                  h.Class(wire.root ? 'stroke-foreground/15' : 'stroke-foreground/25'),
                ],
                [],
              ),
            ),
          ),
          ...[...layout.placed.values()].map(({ entry, x, y }) =>
            h.a(
              [
                h.Key(entry.id),
                h.Href(researchPath(entry.id)),
                h.Style({
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${NODE_SIZE.w}px`,
                  height: `${NODE_SIZE.h}px`,
                }),
                h.Class(
                  'press absolute flex items-center gap-2.5 overflow-hidden rounded-xl bg-raised px-2.5 shadow-raised transition-[filter] hover:brightness-[0.985]',
                ),
              ],
              [
                researchMark(entry, 'sm', false, h),
                h.span(
                  [h.Class('flex min-w-0 flex-1 flex-col gap-0.5')],
                  [
                    h.span(
                      [h.Class('truncate text-[12.5px] leading-tight font-semibold')],
                      [entry.name],
                    ),
                    h.span(
                      [h.Class('flex w-fit items-center gap-2 text-[11px]')],
                      recipeOf(entry.id).map(([pool, cost]) => insightChip(pool, compact(cost), h)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ],
  )
}

/** Every track side by side, its items grouped under the Era they open in. */
const byTrack = (h: H): Html =>
  h.div(
    [
      h.Class(
        'not-prose my-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 xl:grid-cols-3 md:max-xl:[&>:last-child:nth-child(odd)]:col-span-2',
      ),
    ],
    RESEARCH_TRACKS.map((track) => {
      const items = researchList.filter((entry) => entry.track === track.key)
      const eras = [...new Set(items.map((entry) => entry.era))].sort((a, b) => a - b)
      return h.section(
        [h.Key(track.key), h.Class('bg-background p-4')],
        [
          h.h3(
            [h.Class('flex items-center gap-2 text-[14.5px] font-semibold')],
            [
              icon(h, TRACK_ICONS[track.key], 'size-4 text-muted-foreground'),
              track.label,
              h.span(
                [h.Class(cn(FIGURE, 'ml-auto text-[12px] font-normal text-muted-foreground'))],
                [String(items.length)],
              ),
            ],
          ),
          h.dl(
            [h.Class('mt-3 flex flex-col gap-3')],
            eras.flatMap((era) => [
              h.dt(
                [
                  h.Key(`${era}-t`),
                  h.Class(
                    'text-[11.5px] font-medium tracking-wide text-muted-foreground uppercase',
                  ),
                ],
                [h.a([h.Href(eraPath(era)), h.Class('hover:text-foreground')], [eraName(era)])],
              ),
              h.dd(
                [h.Key(`${era}-d`), h.Class('mt-1 flex flex-col gap-1')],
                items
                  .filter((entry) => entry.era === era)
                  .map((entry) =>
                    h.a(
                      [
                        h.Key(entry.id),
                        h.Href(researchPath(entry.id)),
                        h.Class(
                          'flex items-center gap-2 text-[13.5px] leading-snug hover:underline',
                        ),
                      ],
                      [researchMark(entry, 'sm', false, h), entry.name],
                    ),
                  ),
              ),
            ]),
          ),
        ],
      )
    }),
  )

const hub = page({
  path: '/research',
  title: 'Research tree',
  summary:
    'Every Research item by track and Era: what it costs in Insight, what it needs first, and what it unlocks.',
  order: 3,
  aliases: ['tech tree', 'insight', 'unlocks'],
  headings: headingsFor(['The tree', 'By track']),
  text: entities.map((entry) => entry.title).join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'Research turns Insight into new Components, runtimes, and practices. Each item costs Insight from the pools its subject earns, and some need other items first. The tree grows up from each track’s root and to the right through the Eras.',
          h,
        ),
        section('The tree', [tree(h)], h),
        section('By track', [byTrack(h)], h),
      ],
    ),
})

export const researchPages: ReadonlyArray<Page> = [hub, ...entities]
