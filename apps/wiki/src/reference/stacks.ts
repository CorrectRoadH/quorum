import type { Html } from 'foldkit/html'
import {
  AXES,
  FRAMEWORKS,
  FRAMEWORK_IDS,
  LANGUAGES,
  LANGUAGE_IDS,
  RUNTIMES,
  RUNTIME_IDS,
  type Axes,
  type FrameworkDef,
  type RuntimeDef,
} from '@quorum/simulation/catalog'
import { stackLogo } from '@quorum/ui/game/bits'
import { ms } from '@quorum/ui/game/format'
import type { Page } from '../page.ts'
import {
  authored,
  factsBox,
  headingsFor,
  link,
  page,
  paragraph,
  researchLink,
  section,
  table,
  termsSection,
  type Fact,
  type H,
} from './shared.ts'

/* Languages, runtimes, and frameworks: one page per runtime and framework, and a hub that compares them. */

export const runtimePath = (id: RuntimeDef['id']): string => `/runtimes/${id}`
export const frameworkPath = (id: FrameworkDef['id']): string => `/frameworks/${id}`

const AXIS_LABELS: Record<(typeof AXES)[number], string> = {
  throughput: 'Throughput',
  tail: 'Tail latency',
  memory: 'Memory',
  velocity: 'Velocity',
  resilience: 'Resilience',
  operability: 'Operability',
}

const MODEL_LABELS: Record<RuntimeDef['model'], string> = {
  process: 'One process per request',
  threads: 'A thread pool',
  loop: 'One event loop',
  green: 'Green threads',
  async: 'Async tasks on a thread pool',
}

/** Five pips per axis, as on the stack picker. */
const axes = (values: Axes, h: H): Html =>
  table(
    ['Axis', 'Score'],
    AXES.map((axis) => ({
      key: axis,
      cells: [
        AXIS_LABELS[axis],
        h.span(
          [h.AriaLabel(`${values[axis]} of 5`), h.Class('inline-flex gap-1')],
          [1, 2, 3, 4, 5].map((step) =>
            h.span(
              [
                h.Key(String(step)),
                h.Class(
                  step <= values[axis]
                    ? 'size-2 rounded-full bg-foreground/70'
                    : 'size-2 rounded-full bg-foreground/12',
                ),
              ],
              [],
            ),
          ),
        ),
      ],
    })),
    h,
    [1],
  )

const languageFacts = (language: RuntimeDef['language']): ReadonlyArray<Fact> => {
  const def = LANGUAGES[language]
  return [
    { name: 'Velocity', value: `×${def.velocity}` },
    { name: 'Salary', value: `×${def.salary}` },
    { name: 'Build', value: `${def.buildMinutes} min` },
  ]
}

const runtimePage = (def: RuntimeDef): Page => {
  const path = runtimePath(def.id)
  const text = authored(path)
  const frameworks = FRAMEWORK_IDS.filter((id) => FRAMEWORKS[id].language === def.language)
  return page({
    path,
    title: def.name,
    summary: def.blurb,
    parent: '/runtimes',
    order: RUNTIME_IDS.indexOf(def.id),
    era: null,
    aliases: [LANGUAGES[def.language].name, MODEL_LABELS[def.model]],
    source: text.source,
    headings: [
      ...text.headings,
      ...headingsFor([
        'Trade-offs',
        'Frameworks',
        def.glossary.length ? 'Engineering terms' : null,
      ]),
    ],
    text: `${def.blurb} ${text.text}`,
    aside: (_model, h) =>
      factsBox(
        def.name,
        stackLogo(def.language, 'size-6', h),
        null,
        [
          { name: 'Language', value: LANGUAGES[def.language].name },
          { name: 'Concurrency', value: MODEL_LABELS[def.model] },
          { name: 'Speed', value: `×${def.speed}` },
          { name: 'Memory', value: `${def.memory} MB` },
          { name: 'Startup', value: `${def.startup} s` },
          { name: 'Warm-up', value: def.warmup ? `${def.warmup} s` : '—' },
          { name: 'GC pause', value: def.gc ? ms(def.gc.pauseMs) : 'None' },
          {
            name: 'Unlocked by',
            value: def.research ? researchLink(def.research, h) : 'Starter kit',
          },
          ...languageFacts(def.language),
        ],
        h,
      ),
    body: (model, h) =>
      h.div(
        [h.Class('prose')],
        [
          ...(text.view ? [text.view(model, h)] : []),
          section('Trade-offs', [axes(def.axes, h)], h),
          section(
            'Frameworks',
            [
              h.ul(
                [],
                frameworks.map((id) =>
                  h.li([h.Key(id)], [link(frameworkPath(id), FRAMEWORKS[id].name, h)]),
                ),
              ),
            ],
            h,
          ),
          termsSection(def.glossary, h),
        ],
      ),
    related: ['/runtimes', ...frameworks.map(frameworkPath)],
  })
}

const frameworkPage = (def: FrameworkDef): Page => {
  const path = frameworkPath(def.id)
  const text = authored(path)
  const runtimes = RUNTIME_IDS.filter(
    (id) => def.language === null || RUNTIMES[id].language === def.language,
  )
  return page({
    path,
    title: def.name,
    summary: def.blurb,
    parent: '/runtimes',
    order: 100 + FRAMEWORK_IDS.indexOf(def.id),
    aliases: def.language ? [LANGUAGES[def.language].name, 'framework'] : ['framework'],
    source: text.source,
    headings: [
      ...text.headings,
      ...headingsFor(['Trade-offs', 'Runs on', def.glossary.length ? 'Engineering terms' : null]),
    ],
    text: `${def.blurb} ${text.text}`,
    aside: (_model, h) =>
      factsBox(
        def.name,
        def.id === 'none' ? null : stackLogo(def.id, 'size-6', h),
        null,
        [
          { name: 'Language', value: def.language ? LANGUAGES[def.language].name : 'Any' },
          { name: 'Overhead', value: `${def.overhead} ms CPU` },
          { name: 'Velocity', value: `×${def.velocity}` },
          { name: 'Memory', value: `+${def.memory} MB` },
          { name: 'Startup', value: `+${def.startup} s` },
          { name: 'ORM', value: def.orm ? 'Yes, N+1 until Eager loading' : 'No' },
        ],
        h,
      ),
    body: (model, h) =>
      h.div(
        [h.Class('prose')],
        [
          ...(text.view ? [text.view(model, h)] : []),
          section('Trade-offs', [axes(def.axes, h)], h),
          section(
            'Runs on',
            [
              h.ul(
                [],
                runtimes.map((id) =>
                  h.li([h.Key(id)], [link(runtimePath(id), RUNTIMES[id].name, h)]),
                ),
              ),
            ],
            h,
          ),
          termsSection(def.glossary, h),
        ],
      ),
    related: ['/runtimes'],
  })
}

const hub = page({
  path: '/runtimes',
  title: 'Runtimes and frameworks',
  summary:
    'The Stack an App Server runs: its language, runtime, and framework, and how each one trades speed for safety.',
  order: 4,
  aliases: ['stack', 'language', 'framework'],
  headings: headingsFor(['Languages', 'Runtimes', 'Frameworks']),
  text: [
    ...RUNTIME_IDS.map((id) => RUNTIMES[id].name),
    ...FRAMEWORK_IDS.map((id) => FRAMEWORKS[id].name),
  ].join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'Each App Server runs one Stack. The language sets how fast the team writes code and what it costs to hire. The runtime sets how the server handles many requests at once. The framework adds speed of work, and costs CPU and memory on each request.',
          h,
        ),
        section(
          'Languages',
          [
            table(
              ['Language', 'Velocity', 'Salary', 'Hire time', 'Build'],
              LANGUAGE_IDS.map((id) => {
                const def = LANGUAGES[id]
                return {
                  key: id,
                  cells: [
                    h.span(
                      [h.Class('inline-flex items-center gap-2')],
                      [stackLogo(id, 'size-4', h), def.name],
                    ),
                    `×${def.velocity}`,
                    `×${def.salary}`,
                    `×${def.hireTime}`,
                    `${def.buildMinutes} min`,
                  ],
                }
              }),
              h,
              [1, 2, 3, 4],
            ),
          ],
          h,
        ),
        section(
          'Runtimes',
          [
            table(
              ['Runtime', 'Concurrency', 'Speed', 'Memory', 'GC pause'],
              RUNTIME_IDS.map((id) => {
                const def = RUNTIMES[id]
                return {
                  key: id,
                  cells: [
                    link(runtimePath(id), def.name, h),
                    MODEL_LABELS[def.model],
                    `×${def.speed}`,
                    `${def.memory} MB`,
                    def.gc ? ms(def.gc.pauseMs) : '—',
                  ],
                }
              }),
              h,
              [2, 3, 4],
            ),
          ],
          h,
        ),
        section(
          'Frameworks',
          [
            table(
              ['Framework', 'Language', 'Overhead', 'Velocity', 'ORM'],
              FRAMEWORK_IDS.map((id) => {
                const def = FRAMEWORKS[id]
                return {
                  key: id,
                  cells: [
                    link(frameworkPath(id), def.name, h),
                    def.language ? LANGUAGES[def.language].name : 'Any',
                    `${def.overhead} ms`,
                    `×${def.velocity}`,
                    def.orm ? 'Yes' : 'No',
                  ],
                }
              }),
              h,
              [2, 3],
            ),
          ],
          h,
        ),
      ],
    ),
})

export const stackPages: ReadonlyArray<Page> = [
  hub,
  ...RUNTIME_IDS.map((id) => runtimePage(RUNTIMES[id])),
  ...FRAMEWORK_IDS.map((id) => frameworkPage(FRAMEWORKS[id])),
]
