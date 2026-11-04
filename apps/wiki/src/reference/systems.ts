import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  ERAS,
  EXITS,
  EXIT_IDS,
  FAMILIES,
  FAMILY_IDS,
  FEATURES,
  FEATURE_IDS,
  IAC_TOOLS,
  IAC_TOOL_INFO,
  MUTATORS,
  MUTATOR_IDS,
  PERKS,
  PERK_IDS,
  POLICIES,
  POLICY_IDS,
  REGIONS,
  REGION_INFO,
  SIZES,
  TASKS,
  TASK_IDS,
  VENTURES,
  VENTURE_IDS,
  rttOf,
} from '@quorum/simulation/catalog'
import { GUIDED, SANDBOX_IDS, type GuidedSandbox } from '@quorum/simulation/sandbox'
import { compact, money } from '@quorum/ui/game/format'
import type { Page } from '../page.ts'
import {
  authored,
  eraName,
  eraPath,
  headingsFor,
  link,
  page,
  paragraph,
  percent,
  researchLink,
  section,
  table,
} from './shared.ts'

/* The systems around the board: the team, the infrastructure, prestige, and the Sandboxes. */

const team = page({
  path: '/team',
  title: 'Team and work',
  summary:
    'Engineering policies, the Features you can ship, and the tasks that keep the code base healthy.',
  order: 7,
  aliases: ['engineers', 'features', 'tasks', 'policy', 'tech debt', 'deploys'],
  headings: headingsFor(['Policies', 'Features', 'Tasks']),
  text: [
    ...FEATURE_IDS.map((id) => `${FEATURES[id].name} ${FEATURES[id].effect}`),
    ...TASK_IDS.map((id) => TASKS[id].name),
  ].join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'Engineers turn Dev Hours into Features and tasks. A policy sets how fast they ship and how much debt each Feature leaves behind.',
          h,
        ),
        section(
          'Policies',
          [
            table(
              ['Policy', 'Velocity', 'Debt per Feature', 'Bad deploys', 'Deploys a day'],
              POLICY_IDS.map((id) => {
                const def = POLICIES[id]
                return {
                  key: id,
                  cells: [
                    def.label,
                    `×${def.velocity}`,
                    percent(def.debt),
                    `×${def.badDeploy}`,
                    String(def.deploysPerDay),
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
          'Features',
          [
            table(
              ['Feature', 'Era', 'Dev Hours', 'Effect', 'Hidden cost'],
              FEATURE_IDS.map((id) => {
                const def = FEATURES[id]
                return {
                  key: id,
                  cells: [
                    def.research
                      ? h.span([], [def.name, h.br([]), researchLink(def.research, h)])
                      : def.name,
                    link(eraPath(def.era), eraName(def.era), h),
                    String(def.dh),
                    def.effect,
                    def.hidden ?? '—',
                  ],
                }
              }),
              h,
              [2],
            ),
          ],
          h,
        ),
        section(
          'Tasks',
          [
            table(
              ['Task', 'Dev Hours', 'Effect', 'Needs'],
              TASK_IDS.filter((id) => !TASKS[id].internal).map((id) => {
                const def = TASKS[id]
                return {
                  key: id,
                  cells: [
                    def.name,
                    String(def.dh),
                    def.effect,
                    def.research ? researchLink(def.research, h) : '—',
                  ],
                }
              }),
              h,
              [1],
            ),
          ],
          h,
        ),
      ],
    ),
})

const infrastructure = page({
  path: '/infrastructure',
  title: 'Instances and regions',
  summary:
    'Instance families and sizes, the regions your users live in, and the IaC tools that deploy to them.',
  order: 8,
  aliases: ['vcpu', 'ram', 'instance type', 'region', 'latency', 'terraform', 'pulumi', 'alchemy'],
  headings: headingsFor(['Instance families', 'Sizes', 'Regions', 'Round trips', 'IaC tools']),
  text: [
    ...FAMILY_IDS.map((id) => FAMILIES[id].blurb),
    ...REGIONS.map((id) => REGION_INFO[id].name),
  ].join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        section(
          'Instance families',
          [
            table(
              ['Family', 'RAM per vCPU', 'Price', 'Notes'],
              FAMILY_IDS.map((id) => {
                const def = FAMILIES[id]
                return { key: id, cells: [def.name, `${def.ram} GB`, `×${def.price}`, def.blurb] }
              }),
              h,
              [1, 2],
            ),
          ],
          h,
        ),
        section(
          'Sizes',
          [
            paragraph('Each step up doubles capacity and Burn, until the largest sizes.', h),
            table(
              ['Size', 'vCPU', 'Network'],
              SIZES.map((size) => ({
                key: size.name,
                cells: [size.name, String(size.vcpu), `${size.gbps} Gbps`],
              })),
              h,
              [1, 2],
            ),
          ],
          h,
        ),
        section(
          'Regions',
          [
            table(
              ['Region', 'Share of users', 'Clock offset'],
              REGIONS.map((id) => {
                const def = REGION_INFO[id]
                return { key: id, cells: [def.name, percent(def.share), `+${def.offset / 60} h`] }
              }),
              h,
              [1, 2],
            ),
          ],
          h,
        ),
        section(
          'Round trips',
          [
            paragraph('Milliseconds for one round trip between regions.', h),
            table(
              ['From', ...REGIONS.map((id) => REGION_INFO[id].short)],
              REGIONS.map((from) => ({
                key: from,
                cells: [REGION_INFO[from].name, ...REGIONS.map((to) => `${rttOf(from, to)} ms`)],
              })),
              h,
              REGIONS.map((_, index) => index + 1),
            ),
          ],
          h,
        ),
        section(
          'IaC tools',
          [
            table(
              ['Tool', 'Language', 'Finds hand changes'],
              IAC_TOOLS.map((id) => {
                const def = IAC_TOOL_INFO[id]
                return {
                  key: id,
                  cells: [
                    def.name,
                    def.language,
                    def.refreshOnPlan
                      ? 'On every plan'
                      : `When you run ${def.refresh}${def.repair ? ', and can repair them' : ''}`,
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

const prestige = page({
  path: '/prestige',
  title: 'Exits and Legacy',
  summary: 'How a Company ends, the Legacy it earns, and what Legacy buys for the next run.',
  order: 9,
  aliases: ['prestige', 'legacy', 'perks', 'ventures', 'mutators', 'achievements', 'new game plus'],
  headings: headingsFor(['Exits', 'Perks', 'Ventures', 'Mutators', 'Achievements']),
  text: [
    ...PERK_IDS.map((id) => `${PERKS[id].name} ${PERKS[id].effect}`),
    ...VENTURE_IDS.map((id) => `${VENTURES[id].name} ${VENTURES[id].summary}`),
    ...MUTATOR_IDS.map((id) => `${MUTATORS[id].name} ${MUTATORS[id].rule}`),
    ...ACHIEVEMENT_IDS.map((id) => `${ACHIEVEMENTS[id].name} ${ACHIEVEMENTS[id].condition}`),
  ].join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'An Exit ends the Company and pays Legacy on its valuation. Spend Legacy on Perks that make the next Company start stronger, or on Ventures and Mutators that change the rules.',
          h,
        ),
        section(
          'Exits',
          [
            table(
              ['Exit', 'From Era', 'Valuation cap', 'Legacy ×', 'Company goes on'],
              EXIT_IDS.map((id) => {
                const def = EXITS[id]
                return {
                  key: id,
                  cells: [
                    def.name,
                    link(eraPath(def.stage), ERAS[def.stage]?.name ?? '', h),
                    Number.isFinite(def.cap) ? money(def.cap) : 'None',
                    `×${def.multiplier}`,
                    def.continues ? 'Yes' : 'No',
                  ],
                }
              }),
              h,
              [2, 3],
            ),
          ],
          h,
        ),
        section(
          'Perks',
          [
            table(
              ['Perk', 'Effect per level', 'Levels', 'Legacy cost'],
              PERK_IDS.map((id) => {
                const def = PERKS[id]
                return {
                  key: id,
                  cells: [
                    def.name,
                    def.effect,
                    String(def.costs.length),
                    def.costs.map(compact).join(' · '),
                  ],
                }
              }),
              h,
              [2, 3],
            ),
          ],
          h,
        ),
        section(
          'Ventures',
          [
            table(
              ['Venture', 'Traffic', 'Cost', 'Legacy ×'],
              VENTURE_IDS.map((id) => {
                const def = VENTURES[id]
                return {
                  key: id,
                  cells: [def.name, def.summary, String(def.cost), `×${def.legacy}`],
                }
              }),
              h,
              [2, 3],
            ),
          ],
          h,
        ),
        section(
          'Mutators',
          [
            table(
              ['Mutator', 'Rule', 'Legacy bonus'],
              MUTATOR_IDS.map((id) => {
                const def = MUTATORS[id]
                return { key: id, cells: [def.name, def.rule, `+${percent(def.legacy)}`] }
              }),
              h,
              [2],
            ),
          ],
          h,
        ),
        section(
          'Achievements',
          [
            table(
              ['Achievement', 'How to earn it', 'Unlocks'],
              ACHIEVEMENT_IDS.map((id) => {
                const def = ACHIEVEMENTS[id]
                const unlocks = [
                  def.unlocks?.venture ? VENTURES[def.unlocks.venture].name : null,
                  def.unlocks?.mutator ? MUTATORS[def.unlocks.mutator].name : null,
                ].filter((name) => name !== null)
                return { key: id, cells: [def.name, def.condition, unlocks.join(', ') || '—'] }
              }),
              h,
            ),
          ],
          h,
        ),
      ],
    ),
})

/* ---------- Sandboxes ---------- */

export const sandboxPath = (id: GuidedSandbox['id']): string => `/sandboxes/${id}`

const sandbox = (def: GuidedSandbox): Page => {
  const path = sandboxPath(def.id)
  const text = authored(path)
  return page({
    path,
    title: def.name,
    summary: def.objectives[0]?.goal ?? def.name,
    parent: '/sandboxes',
    order: SANDBOX_IDS.indexOf(def.id),
    era: def.stage,
    aliases: ['sandbox', 'challenge', 'tutorial', def.id],
    source: text.source,
    headings: [...text.headings, ...headingsFor(['Objectives'])],
    text: `${def.objectives.map((objective) => objective.goal).join(' ')} ${text.text}`,
    body: (model, h) =>
      h.div(
        [h.Class('prose')],
        [
          h.p(
            [],
            [
              'A guided Sandbox from the ',
              link(eraPath(def.stage), eraName(def.stage), h),
              ' track. Its Design is fixed; your changes stay in the Sandbox.',
            ],
          ),
          ...(text.view ? [text.view(model, h)] : []),
          section(
            'Objectives',
            [
              h.ol(
                [],
                def.objectives.map((objective, index) =>
                  h.li(
                    [h.Key(String(index))],
                    [
                      objective.goal,
                      objective.users
                        ? h.span(
                            [h.Class('text-muted-foreground')],
                            [` · ${compact(objective.users)} users`],
                          )
                        : h.empty,
                    ],
                  ),
                ),
              ),
            ],
            h,
          ),
        ],
      ),
    related: ['/sandboxes'],
  })
}

const sandboxes = SANDBOX_IDS.map((id) => sandbox(GUIDED[id]))

const sandboxHub = page({
  path: '/sandboxes',
  title: 'Sandboxes',
  summary:
    'Short guided boards that each teach one failure, and how to fix it, outside any Company.',
  order: 10,
  aliases: ['challenges', 'tutorials', 'lessons', 'puzzles'],
  headings: headingsFor(
    ERAS.map((era, index) => (sandboxes.some((entry) => entry.era === index) ? era.name : null)),
  ),
  text: sandboxes.map((entry) => entry.title).join(' '),
  body: (_model, h) =>
    h.div(
      [h.Class('prose')],
      [
        paragraph(
          'Each Sandbox starts from a fixed Design with one problem in it. Fix the problem and hold the fix to pass.',
          h,
        ),
        ...ERAS.map((era, index) => {
          const items = SANDBOX_IDS.filter((id) => GUIDED[id].stage === index)
          return items.length
            ? section(
                era.name,
                [
                  h.ul(
                    [],
                    items.map((id) =>
                      h.li([h.Key(id)], [link(sandboxPath(id), GUIDED[id].name, h)]),
                    ),
                  ),
                ],
                h,
              )
            : h.empty
        }),
      ],
    ),
})

export const systemPages: ReadonlyArray<Page> = [
  team,
  infrastructure,
  prestige,
  sandboxHub,
  ...sandboxes,
]
