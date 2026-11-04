import type { Html } from 'foldkit/html'
import { cn } from 'cn'
import {
  COMPONENTS,
  COMPONENT_IDS,
  ERAS,
  EXITS,
  EXIT_IDS,
  FEATURES,
  FEATURE_IDS,
  INCIDENTS,
  INCIDENT_IDS,
  researchList,
  type EraDef,
} from '@quorum/simulation/catalog'
import { EYEBROW, FIGURE } from '@quorum/ui/game/bits'
import { compact, money } from '@quorum/ui/game/format'
import type { Page } from '../page.ts'
import { mixBar } from '../components/mix.ts'
import { componentEra, componentPath } from './components.ts'
import { incidentPath } from './incidents.ts'
import {
  authored,
  eraPath,
  factsBox,
  headingsFor,
  link,
  linkList,
  page,
  paragraph,
  percent,
  researchLink,
  section,
  type H,
} from './shared.ts'

/* One page per Era, and a hub that runs them left to right as a timeline. */

const entity = (def: EraDef, index: number): Page => {
  const path = eraPath(index)
  const text = authored(path)
  const next = ERAS[index + 1]
  const components = COMPONENT_IDS.filter((id) => componentEra(COMPONENTS[id]) === index)
  const research = researchList.filter((entry) => entry.era === index)
  const incidents = INCIDENT_IDS.filter((id) => INCIDENTS[id].era === index)
  const features = FEATURE_IDS.filter((id) => FEATURES[id].era === index)
  const exits = EXIT_IDS.filter((id) => EXITS[id].stage === index)
  return page({
    path,
    title: def.name,
    summary: def.question,
    parent: '/eras',
    order: index,
    era: index,
    aliases: [`Era ${index}`, 'funding round', 'stage'],
    source: text.source,
    headings: [
      ...text.headings,
      ...headingsFor(['Traffic', next ? 'Raising the next round' : null, 'What arrives']),
    ],
    text: `${def.question} ${def.arrivals} ${text.text}`,
    aside: (_model, h) =>
      factsBox(
        def.name,
        h.span(
          [
            h.Class(
              cn(
                FIGURE,
                'grid size-6 place-items-center rounded-md bg-foreground text-[11px] text-background',
              ),
            ),
          ],
          [String(index)],
        ),
        null,
        [
          { name: 'Market', value: `${compact(def.market)} users` },
          { name: 'Apdex target', value: def.apdexTarget.toFixed(2) },
          { name: 'Weekly SLO', value: percent(def.slo) },
          { name: 'Worst start', value: `SEV${def.maxSeverity}` },
          { name: 'Cost index', value: `×${def.costIndex}` },
          { name: 'Salary index', value: `×${def.salaryIndex}` },
          ...(next
            ? [
                { name: 'Raise at', value: `${compact(def.raiseAt)} users` },
                { name: 'Round pays', value: money(def.grant) },
                { name: 'Dilution', value: percent(def.dilution) },
              ]
            : []),
        ],
        h,
      ),
    body: (model, h) =>
      h.div(
        [h.Class('prose')],
        [
          ...(text.view ? [text.view(model, h)] : []),
          section('Traffic', [paragraph(def.arrivals, h), mixBar(def.mix, h)], h),
          next
            ? section(
                'Raising the next round',
                [
                  h.p(
                    [],
                    [
                      `Reach ${compact(def.raiseAt)} users to raise ${next.name}. The round pays ${money(def.grant)} and costs ${percent(def.dilution)} of the Company. Then the `,
                      link(eraPath(index + 1), next.name, h),
                      ' Era starts.',
                    ],
                  ),
                ],
                h,
              )
            : h.empty,
          section(
            'What arrives',
            [
              h.dl(
                [h.Class('grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]')],
                [
                  [
                    'Components',
                    components.map((id) => link(componentPath(id), COMPONENTS[id].name, h)),
                  ],
                  ['Research', research.map((entry) => researchLink(entry.id, h))],
                  [
                    'Incidents',
                    incidents.map((id) => link(incidentPath(id), INCIDENTS[id].name, h)),
                  ],
                  ['Features', features.map((id) => link('/team#features', FEATURES[id].name, h))],
                  ['Exits', exits.map((id) => link('/prestige#exits', EXITS[id].name, h))],
                ].flatMap(([label, items]) =>
                  (items as ReadonlyArray<Html>).length
                    ? [
                        h.dt(
                          [h.Key(`${label}-t`), h.Class(cn(EYEBROW, 'pt-1'))],
                          [label as string],
                        ),
                        h.dd(
                          [h.Key(`${label}-d`), h.Class('m-0')],
                          [linkList(items as ReadonlyArray<Html>, h)],
                        ),
                      ]
                    : [],
                ),
              ),
            ],
            h,
          ),
        ],
      ),
    related: ['/eras', ...(next ? [eraPath(index + 1)] : [])],
  })
}

const entities = ERAS.map(entity)

/** What arrives in an Era, counted. */
const arrivals = (index: number): string => {
  const parts = [
    [COMPONENT_IDS.filter((id) => componentEra(COMPONENTS[id]) === index).length, 'Components'],
    [researchList.filter((entry) => entry.era === index).length, 'Research items'],
    [INCIDENT_IDS.filter((id) => INCIDENTS[id].era === index).length, 'incidents'],
  ] as const
  return parts
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(' · ')
}

/** The Eras top to bottom, on one line: each with its question, its numbers, and its traffic. */
const timeline = (h: H): Html =>
  h.ol(
    [h.Class('not-prose relative my-8 border-l border-border')],
    ERAS.map((def, index) => {
      const next = ERAS[index + 1]
      const figures: ReadonlyArray<readonly [string, string]> = [
        ['Market', `${compact(def.market)} users`],
        ['Apdex target', def.apdexTarget.toFixed(2)],
        ...(next
          ? ([
              ['Raise at', `${compact(def.raiseAt)} users`],
              ['Round pays', money(def.grant)],
            ] as const)
          : []),
      ]
      return h.li(
        [h.Key(def.name), h.Class('relative pb-10 pl-8 last:pb-0')],
        [
          h.span(
            [
              h.AriaHidden(true),
              h.Class(
                cn(
                  FIGURE,
                  'absolute top-0 -left-3 grid size-6 place-items-center rounded-full border border-border bg-background text-[11px] text-muted-foreground',
                ),
              ),
            ],
            [String(index + 1)],
          ),
          h.div(
            [h.Class('flex flex-wrap items-baseline gap-x-3 gap-y-1')],
            [
              h.a(
                [
                  h.Href(eraPath(index)),
                  h.Class('text-[18px] font-semibold tracking-tight hover:underline'),
                ],
                [def.name],
              ),
              h.span([h.Class('text-[14.5px] text-muted-foreground')], [def.question]),
            ],
          ),
          h.dl(
            [h.Class('mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[13px]')],
            figures.map(([name, value]) =>
              h.div(
                [h.Key(name), h.Class('flex items-baseline gap-1.5')],
                [
                  h.dt([h.Class('text-muted-foreground')], [name]),
                  h.dd([h.Class(cn(FIGURE, 'text-[12.5px]'))], [value]),
                ],
              ),
            ),
          ),
          h.div([h.Class('mt-3 max-w-md')], [mixBar(def.mix, h, false)]),
          h.p([h.Class('mt-2 text-[13px] text-muted-foreground')], [arrivals(index)]),
        ],
      )
    }),
  )

const hub = page({
  path: '/eras',
  title: 'Eras',
  summary:
    'The funding rounds a Company climbs through, from Garage to Public, and what each one asks of your system.',
  order: 2,
  aliases: ['stages', 'funding', 'rounds', 'progression'],
  headings: headingsFor(['The climb']),
  text: ERAS.map((def) => `${def.name} ${def.question}`).join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'Each Era ends when you raise the next round. A new Era brings a bigger market, new kinds of traffic, worse incidents, and new Research. To hide what comes after the Era you play in, pick it in the header.',
          h,
        ),
        section('The climb', [timeline(h)], h),
      ],
    ),
})

export const eraPages: ReadonlyArray<Page> = [hub, ...entities]
