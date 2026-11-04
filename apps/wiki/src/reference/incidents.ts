import type { Html } from 'foldkit/html'
import { cn } from 'cn'
import { INCIDENTS, INCIDENT_IDS, type IncidentDef } from '@quorum/simulation/catalog'
import { BY_INCIDENT } from '@quorum/simulation/discovery'
import { FIGURE } from '@quorum/ui/game/bits'
import { duration } from '@quorum/ui/game/format'
import type { Page } from '../page.ts'
import {
  authored,
  eraName,
  eraPath,
  factsBox,
  headingsFor,
  link,
  page,
  paragraph,
  researchLink,
  section,
  table,
  termsSection,
  type H,
} from './shared.ts'

/* One page per incident, and a hub that lists them by Era. */

export const incidentPath = (id: IncidentDef['id']): string => `/incidents/${id}`

const SEVERITY_CLASS: Record<1 | 2 | 3, string> = {
  1: 'bg-danger text-white',
  2: 'bg-warn text-white',
  3: 'bg-foreground/10 text-foreground',
}

/** SEV1 is the worst, as in a real on-call rotation. */
export const severityChip = (severity: 1 | 2 | 3, h: H): Html =>
  h.span(
    [
      h.Class(
        cn(
          FIGURE,
          'inline-flex rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold',
          SEVERITY_CLASS[severity],
        ),
      ),
    ],
    [`SEV${severity}`],
  )

const entity = (def: IncidentDef): Page => {
  const path = incidentPath(def.id)
  const text = authored(path)
  return page({
    path,
    title: def.name,
    summary: def.cause,
    parent: '/incidents',
    order: INCIDENT_IDS.indexOf(def.id),
    era: def.era,
    aliases: [def.id, 'incident', 'outage'],
    source: text.source,
    headings: [
      ...text.headings,
      ...headingsFor([
        'What happens',
        'How to prevent it',
        BY_INCIDENT[def.id]?.length ? 'Engineering terms' : null,
      ]),
    ],
    text: `${def.cause} ${def.prevention} ${text.text}`,
    aside: (_model, h) =>
      factsBox(
        def.name,
        severityChip(def.severity, h),
        null,
        [
          { name: 'First Era', value: link(eraPath(def.era), eraName(def.era), h) },
          { name: 'Starts at', value: `SEV${def.severity}` },
          {
            name: 'Escalates to',
            value: def.escalatesTo === def.severity ? '—' : `SEV${def.escalatesTo}`,
          },
          { name: 'Lasts', value: duration(def.duration) },
        ],
        h,
      ),
    body: (model, h) =>
      h.div(
        [h.Class('prose')],
        [
          section('What happens', [paragraph(def.cause, h)], h),
          ...(text.view ? [text.view(model, h)] : []),
          section(
            'How to prevent it',
            [
              paragraph(def.prevention, h),
              ...(def.actions.length
                ? [
                    h.p([], ['The postmortem opens the first of these that you do not own yet:']),
                    h.ol(
                      [],
                      def.actions.map((id) => h.li([h.Key(id)], [researchLink(id, h)])),
                    ),
                  ]
                : []),
            ],
            h,
          ),
          termsSection(BY_INCIDENT[def.id], h),
        ],
      ),
    related: ['/incidents', '/mechanics/incidents'],
  })
}

const entities = INCIDENT_IDS.map((id) => entity(INCIDENTS[id]))

const hub = page({
  path: '/incidents',
  title: 'Incidents',
  summary:
    'Every incident the director can start, the Era it first appears in, how bad it gets, and the Research that prevents it.',
  order: 5,
  aliases: ['outage', 'postmortem', 'severity'],
  headings: headingsFor(['All incidents']),
  text: entities.map((entry) => entry.title).join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'An incident starts at a severity and escalates when nobody fixes it. SEV1 is the worst. When it ends, the postmortem names the cause and opens the Research that prevents it next time.',
          h,
        ),
        section(
          'All incidents',
          [
            table(
              ['Incident', 'Era', 'Severity', 'Prevented by'],
              [...INCIDENT_IDS]
                .sort((a, b) => INCIDENTS[a].era - INCIDENTS[b].era)
                .map((id) => {
                  const def = INCIDENTS[id]
                  return {
                    key: id,
                    cells: [
                      link(incidentPath(id), def.name, h),
                      eraName(def.era),
                      severityChip(def.severity, h),
                      def.actions[0] ? researchLink(def.actions[0], h) : '—',
                    ],
                  }
                }),
              h,
            ),
          ],
          h,
        ),
      ],
    ),
})

export const incidentPages: ReadonlyArray<Page> = [hub, ...entities]
