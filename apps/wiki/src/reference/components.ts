import type { Html } from 'foldkit/html'
import {
  BUILD_GROUPS,
  COMPONENTS,
  COMPONENT_IDS,
  COPY_PRICE_GROWTH,
  CVE_DEFS,
  KINDS,
  REQUEST_KINDS,
  RESEARCH,
  SELL_REFUND,
  SIZES,
  type ComponentDef,
  type ComponentId,
} from '@quorum/simulation/catalog'
import { BY_COMPONENT } from '@quorum/simulation/discovery'
import { groupBadge } from '@quorum/ui/game/bits'
import { money, ms } from '@quorum/ui/game/format'
import { COMPONENT_ICONS } from '@quorum/ui/game/icons'
import { nodeCard } from '../node-card.ts'
import type { Page } from '../page.ts'
import {
  authored,
  cardGrid,
  eraName,
  eraPath,
  factsBox,
  headingsFor,
  hubCard,
  link,
  page,
  paragraph,
  researchLink,
  section,
  termsSection,
  type Fact,
  type H,
} from './shared.ts'

/* One page per Component, and the Components hub. Every fact comes from COMPONENTS. */

export const componentPath = (id: ComponentId): string => `/components/${id}`

/** The Era a Component becomes available in: its unlocking Research's, or Garage. */
export const componentEra = (def: ComponentDef): number =>
  def.unlock ? RESEARCH[def.unlock].era : 0

export const componentBadge = (id: ComponentId, size: string, h: H): Html =>
  groupBadge(COMPONENTS[id].group, COMPONENT_ICONS[id], size, h)

const kinds = (list: ReadonlyArray<keyof typeof KINDS>): string =>
  list.length === REQUEST_KINDS.length
    ? 'Every kind'
    : list.length
      ? list.map((kind) => KINDS[kind].label).join(', ')
      : '—'

const facts = (def: ComponentDef, h: H): ReadonlyArray<Fact> => [
  { name: 'Code', value: def.code },
  { name: 'Real product', value: def.product },
  {
    name: 'Group',
    value: BUILD_GROUPS.find((group) => group.key === def.group)?.label ?? def.group,
  },
  { name: 'Unlocked by', value: def.unlock ? researchLink(def.unlock, h) : 'Starter kit' },
  { name: 'Era', value: link(eraPath(componentEra(def)), eraName(componentEra(def)), h) },
  ...(def.fixed
    ? [{ name: 'Placed', value: 'Always on the board' }]
    : [
        { name: 'Place', value: `${money(def.cost)} first copy` },
        { name: 'Burn', value: def.sized ? 'By instance type' : `${money(def.burn)}/s` },
      ]),
  {
    name: 'Sizes',
    value: def.sized ? `${SIZES[0].name} to ${SIZES[SIZES.length - 1]?.name}` : String(def.steps),
  },
  { name: 'Overhead', value: def.latency ? ms(def.latency) : '—' },
  { name: 'Takes', value: kinds(def.accepts) },
  { name: 'Sends', value: kinds(def.sends) },
  ...(def.coldStart ? [{ name: 'Cold start', value: 'Yes' }] : []),
]

const rules = (def: ComponentDef, h: H): ReadonlyArray<Html> =>
  def.fixed
    ? [paragraph(`${def.name} is always on the board. You cannot place or sell it.`, h)]
    : [
        h.ul(
          [],
          [
            h.li(
              [],
              [
                `Each further copy costs ${Math.round((COPY_PRICE_GROWTH - 1) * 100)}% more than the one before.`,
              ],
            ),
            h.li(
              [],
              [`Selling it refunds ${Math.round(SELL_REFUND * 100)}% of what its last copy cost.`],
            ),
            h.li(
              [],
              [
                def.sized
                  ? 'Its instance type sets its size and Burn. A size step doubles its resources and its Burn.'
                  : def.steps > 1
                    ? `It has ${def.steps} sizes. Each step doubles its capacity and its Burn.`
                    : 'It has one size.',
              ],
            ),
            ...(def.coldStart
              ? [h.li([], ['A new copy starts cold and is slow until it warms up.'])]
              : []),
            ...(def.tap
              ? [h.li([], ["It receives a copy of its parent's traffic, not a share of it."])]
              : []),
            ...(def.control
              ? [h.li([], ['It takes no traffic. Nodes link into it to come under its control.'])]
              : []),
          ],
        ),
      ]

const entity = (def: ComponentDef): Page => {
  const path = componentPath(def.id)
  const text = authored(path)
  const cves = CVE_DEFS.filter((cve) => cve.affects.includes(def.id))
  const terms = BY_COMPONENT[def.id]
  return page({
    path,
    title: def.name,
    summary: def.blurb,
    parent: '/components',
    order: COMPONENT_IDS.indexOf(def.id),
    era: componentEra(def),
    aliases: [def.code, def.product, ...def.product.split(/[,/]/).map((name) => name.trim())],
    source: text.source,
    headings: [
      ...text.headings,
      ...headingsFor([
        'Rules',
        cves.length ? 'Security' : null,
        terms?.length ? 'Engineering terms' : null,
      ]),
    ],
    text: `${def.product} ${def.blurb} ${text.text}`,
    aside: (_model, h) =>
      h.div(
        [h.Class('flex flex-col gap-4')],
        [
          // The card as it stands on the board, on the board's dotted canvas.
          h.div(
            [
              h.Class(
                'grid place-items-center rounded-2xl bg-canvas px-4 py-6 shadow-well [background-image:radial-gradient(circle_at_1px_1px,var(--canvas-grid)_1px,transparent_0)] [background-size:16px_16px]',
              ),
            ],
            [nodeCard(def.id, h)],
          ),
          factsBox(def.name, componentBadge(def.id, 'size-8', h), def.group, facts(def, h), h),
        ],
      ),
    body: (model, h) =>
      h.div(
        [h.Class('prose')],
        [
          ...(text.view ? [text.view(model, h)] : []),
          section('Rules', rules(def, h), h),
          cves.length
            ? section(
                'Security',
                [
                  paragraph(
                    'These vulnerabilities can hit it. Patch them before the grace period ends.',
                    h,
                  ),
                  h.ul(
                    [],
                    cves.map((cve) =>
                      h.li([h.Key(cve.id)], [`${cve.id}, CVSS ${cve.score.toFixed(1)}`]),
                    ),
                  ),
                ],
                h,
              )
            : h.empty,
          termsSection(terms, h),
        ],
      ),
    related: [...(def.unlock ? [`/research/${def.unlock}`] : []), `/components`],
  })
}

const entities = COMPONENT_IDS.map((id) => entity(COMPONENTS[id]))

const hub = page({
  path: '/components',
  title: 'Components',
  summary:
    'Every part you can place on the board: what it stands for, what it costs, and when it unlocks.',
  order: 1,
  aliases: ['nodes', 'catalog', 'parts'],
  headings: headingsFor(BUILD_GROUPS.map((group) => group.label)),
  text: entities.map((entry) => entry.title).join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'A Component is an entry in the catalog. A Node is one copy of it on your board. Components fall into four groups, and each group has its own badge shape.',
          h,
        ),
        ...BUILD_GROUPS.map((group) =>
          section(
            group.label,
            [
              cardGrid(
                COMPONENT_IDS.filter((id) => COMPONENTS[id].group === group.key).map((id) => {
                  const def = COMPONENTS[id]
                  const entry = entities.find((candidate) => candidate.path === componentPath(id))!
                  return hubCard(
                    entry,
                    componentBadge(id, 'size-9 shrink-0', h),
                    `${def.code} · ${eraName(componentEra(def))}`,
                    h,
                  )
                }),
                h,
              ),
            ],
            h,
          ),
        ),
      ],
    ),
})

export const componentPages: ReadonlyArray<Page> = [hub, ...entities]
