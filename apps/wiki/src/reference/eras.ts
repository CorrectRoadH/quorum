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
  KINDS,
  researchList,
  type EraDef,
  type RequestKind,
} from '@quorum/simulation/catalog'
import { EYEBROW, FIGURE } from '@quorum/ui/game/bits'
import { compact, money } from '@quorum/ui/game/format'
import type { Page } from '../page.ts'
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

const colorOf = (kind: RequestKind): string => `#${KINDS[kind].color.toString(16).padStart(6, '0')}`

/** The Era's request mix as one stacked bar, then a legend. */
export const mixBar = (mix: EraDef['mix'], h: H): Html => {
  const entries = Object.entries(mix) as ReadonlyArray<[RequestKind, number]>
  return h.div(
    [h.Class('not-prose my-5 flex flex-col gap-3')],
    [
      h.div(
        [h.Class('flex h-3 overflow-hidden rounded-full shadow-well'), h.AriaHidden(true)],
        entries.map(([kind, share]) =>
          h.span([h.Key(kind), h.Style({ width: percent(share), background: colorOf(kind) })], []),
        ),
      ),
      h.ul(
        [h.Class('flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]')],
        entries.map(([kind, share]) =>
          h.li(
            [h.Key(kind), h.Class('inline-flex items-center gap-1.5')],
            [
              h.span([h.Class('size-2.5 rounded-sm'), h.Style({ background: colorOf(kind) })], []),
              KINDS[kind].label,
              h.span([h.Class(cn(FIGURE, 'text-muted-foreground'))], [percent(share)]),
            ],
          ),
        ),
      ),
    ],
  )
}

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

/** The Eras left to right: name, question, and the users it takes to raise. */
const timeline = (h: H): Html =>
  h.ol(
    [h.Class('not-prose my-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4')],
    ERAS.map((def, index) =>
      h.li(
        [h.Key(def.name)],
        [
          h.a(
            [
              h.Href(eraPath(index)),
              h.Class(
                'group flex h-full flex-col gap-2 rounded-xl bg-nested p-3.5 shadow-[inset_0_0_0_1px_var(--hairline-soft)] transition-colors hover:bg-well',
              ),
            ],
            [
              h.span(
                [h.Class('flex items-center justify-between')],
                [
                  h.span([h.Class(EYEBROW)], [`Era ${index}`]),
                  h.span(
                    [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
                    [`${compact(def.market)} market`],
                  ),
                ],
              ),
              h.span([h.Class('text-[17px] font-semibold tracking-tight')], [def.name]),
              h.span([h.Class('text-[13px] leading-snug text-muted-foreground')], [def.question]),
            ],
          ),
        ],
      ),
    ),
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
          'Each Era ends when you raise the next round. A new Era brings a bigger market, new kinds of traffic, worse incidents, and new Research. Use the Spoilers menu to hide what comes after the Era you play in.',
          h,
        ),
        section('The climb', [timeline(h)], h),
      ],
    ),
})

export const eraPages: ReadonlyArray<Page> = [hub, ...entities]
