import type { Html, HtmlBuilder } from 'foldkit/html'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bot,
  Check,
  Hourglass,
  Lock,
  Plus,
  Rocket,
  Trash2,
  UserMinus,
  UserPlus,
  X,
  Zap,
} from 'lucide'
import {
  ERAS,
  FEATURES,
  FEATURE_IDS,
  LANGUAGES,
  MIGRATION_STEPS,
  POLICIES,
  POLICY_IDS,
  RUNTIMES,
  FRAMEWORKS,
  TASKS,
  TASK_IDS,
  type FeatureId,
  type TaskId,
} from '@quorum/simulation/catalog'
import { has } from '@quorum/simulation/lookups'
import type { Engineer, Game, Team, WorkItem } from '@quorum/simulation/state'
import {
  badDeployChance,
  devHoursRate,
  languageOfService,
  membersOf,
  outputOf,
  payrollOf,
  policyNow,
  salaryOf,
  serviceOf,
  signingOf,
  teamOutputs,
} from '@quorum/simulation/team'
import { featureRefusal, itemName, MAX_TEAMS, taskRefusal } from '@quorum/simulation/work'
import { describeRefusal } from '@quorum/simulation/actions'
import { money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import { ledgerOf, type Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, NESTED, SCROLL, WELL, meter } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   The Team panel (08): engineers and teams on the left; on the right what
   they build — the backlog, Features, Engineering tasks, a migration — and
   the next deploy that ships it.
   ========================================================================== */

const NAMES = [
  'Ada',
  'Linus',
  'Grace',
  'Ken',
  'Barbara',
  'Dennis',
  'Margaret',
  'Guido',
  'Frances',
  'Bjarne',
  'Radia',
  'Yukihiro',
  'Sophie',
  'Rasmus',
  'Hedy',
  'Ryan',
]

const nameOf = (id: string): string => NAMES[Number(id.slice(1)) % NAMES.length] ?? id

const dh = (value: number): string => `${value < 10 ? value.toFixed(1) : Math.round(value)} DH`

/** Dev Hours per sim second, per minute. */
const perMinute = (rate: number): string => {
  const value = rate * 60
  return value < 10 ? value.toFixed(1) : String(Math.round(value))
}

/** A wait in sim seconds: seconds under a minute and a half, minutes above. */
const wait = (seconds: number): string =>
  seconds < 90 ? `${Math.max(0, Math.ceil(seconds))} s` : `${Math.ceil(seconds / 60)} min`

const heading = (title: string, right: Html, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex items-center justify-between gap-2 px-1 pt-1')],
    [h.span([h.Class(EYEBROW)], [title]), right],
  )

const iconButton = (
  label: string,
  glyph: Parameters<typeof icon>[1],
  message: Message,
  enabled: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  button(
    {
      onClick: message,
      isDisabled: !enabled,
      variant: 'ghost',
      size: 'icon-xs',
      className: 'text-muted-foreground',
      attributes: [h.AriaLabel(label), h.Title(label)],
    },
    icon(h, glyph, 'size-3.5'),
    h,
  )

const segment = (
  key: string,
  selected: boolean,
  message: Message,
  label: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.button(
    [
      h.Key(key),
      h.Type('button'),
      h.AriaPressed(selected ? 'true' : 'false'),
      h.OnClick(message),
      h.Class(
        cn(
          'h-7 min-w-0 truncate rounded-lg px-2 text-[12px] font-medium transition-colors',
          selected
            ? 'bg-raised text-foreground shadow-raised'
            : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
        ),
      ),
    ],
    [label],
  )

/* ---------- people ---------- */

const member = (
  game: Game,
  engineer: Engineer,
  teams: ReadonlyArray<Team>,
  h: HtmlBuilder<Message>,
): Html => {
  const ramping = outputOf(game, engineer) < 1
  const index = teams.findIndex((team) => team.id === engineer.team)
  const next = teams[(index + 1) % teams.length]
  return h.div(
    [h.Key(engineer.id), h.Class('flex items-center gap-2 px-3 py-1.5 text-[12.5px]')],
    [
      h.span([h.Class('min-w-0 flex-1 truncate font-medium')], [nameOf(engineer.id)]),
      h.span([h.Class('text-[11.5px] text-muted-foreground')], [LANGUAGES[engineer.language].name]),
      ramping ? badge({ variant: 'secondary' }, ['Ramping'], h) : h.empty,
      h.span(
        [h.Class(cn(FIGURE, 'w-14 text-right text-[11.5px] text-muted-foreground'))],
        [`${money(salaryOf(game, engineer.language))}/s`],
      ),
      teams.length > 1 && next
        ? iconButton(
            `Move to ${next.name}`,
            ArrowRight,
            Message.EngineerAssigned({ engineerId: engineer.id, teamId: next.id }),
            true,
            h,
          )
        : h.empty,
      iconButton('Lay off', UserMinus, Message.LayoffChosen({ engineerId: engineer.id }), true, h),
    ],
  )
}

const teamCard = (model: Model, team: Team, index: number, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const output = teamOutputs(game, ledgerOf(model)).find((entry) => entry.team.id === team.id)
  const now = policyNow(game, team)
  const pending = game.hires.filter((entry) => entry.team === team.id)
  return h.div(
    [h.Key(team.id), h.Class(cn(NESTED, 'flex flex-col'))],
    [
      h.div(
        [h.Class('flex items-center gap-2 px-3 pt-2.5 pb-2')],
        [
          h.span([h.Class('text-[13px] font-semibold')], [team.name]),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
            [`${output?.headcount ?? 0} · ${perMinute(output?.rate ?? 0)} DH/min`],
          ),
          h.div([h.Class('flex-1')], []),
          index > 0
            ? iconButton('Remove team', Trash2, Message.TeamRemoved({ teamId: team.id }), true, h)
            : h.empty,
        ],
      ),
      h.div(
        [h.Class('px-3 pb-2')],
        [
          h.div(
            [h.Class(cn('grid grid-cols-3 gap-[3px] p-[3px]', WELL, 'rounded-[11px]'))],
            POLICY_IDS.map((policy) =>
              segment(
                `${team.id}-${policy}`,
                team.policy === policy,
                Message.TeamPolicyChosen({ teamId: team.id, policy }),
                POLICIES[policy].label,
                h,
              ),
            ),
          ),
          now.id !== team.policy
            ? h.span(
                [h.Class('mt-1 block px-1 text-[11px] text-muted-foreground')],
                [`${now.label} until tomorrow`],
              )
            : h.empty,
        ],
      ),
      h.div(
        [h.Class('flex flex-col divide-y divide-hairline border-t border-hairline')],
        [
          ...(index === 0
            ? [
                h.div(
                  [h.Key('founder'), h.Class('flex items-center gap-2 px-3 py-1.5 text-[12.5px]')],
                  [
                    h.span([h.Class('flex-1 font-medium')], ['You']),
                    h.span([h.Class('text-[11.5px] text-muted-foreground')], ['Founder']),
                  ],
                ),
              ]
            : []),
          ...membersOf(game, team).map((engineer) => member(game, engineer, game.teams, h)),
          ...pending.map((entry) =>
            h.div(
              [
                h.Key(entry.id),
                h.Class('flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-muted-foreground'),
              ],
              [
                icon(h, Hourglass, 'size-3.5'),
                h.span([h.Class('flex-1')], [nameOf(entry.id)]),
                h.span([h.Class(FIGURE)], [`joins in ${wait(entry.readyAt - game.time)}`]),
              ],
            ),
          ),
        ],
      ),
    ],
  )
}

const people = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const language = languageOfService(game)
  const price = signingOf(game, language)
  const open = game.stage >= 1
  return h.div(
    [h.Class(`flex min-h-0 flex-col gap-3 p-4 ${SCROLL}`)],
    [
      button(
        {
          onClick: Message.HireChosen(),
          isDisabled: !open || game.cash < price,
          size: 'lg',
          className: 'w-full',
        },
        open
          ? [
              icon(h, UserPlus, 'size-4'),
              `Hire ${LANGUAGES[language].name} engineer`,
              h.span([h.Class(cn(FIGURE, 'opacity-75'))], [money(price)]),
            ]
          : [icon(h, Lock, 'size-3.5'), `Hiring opens in ${ERAS[1]?.name ?? ''}`],
        h,
      ),
      ...game.teams.map((team, index) => teamCard(model, team, index, h)),
      open && game.teams.length < MAX_TEAMS
        ? button(
            {
              onClick: Message.TeamCreated(),
              variant: 'ghost',
              size: 'sm',
              className: 'self-start',
            },
            [icon(h, Plus, 'size-3.5'), 'New team'],
            h,
          )
        : h.empty,
    ],
  )
}

/* ---------- work ---------- */

const backlogRow = (
  game: Game,
  item: WorkItem,
  index: number,
  building: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Key(`item-${item.id}`), h.Class('flex flex-col gap-1.5 px-3 py-2')],
    [
      h.div(
        [h.Class('flex items-center gap-2 text-[12.5px]')],
        [
          building
            ? h.span([h.Class('size-1.5 shrink-0 animate-pulse rounded-full bg-ok')], [])
            : h.span([h.Class('size-1.5 shrink-0 rounded-full bg-foreground/20')], []),
          h.span([h.Class('min-w-0 flex-1 truncate font-medium')], [itemName(item)]),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
            [`${Math.floor(item.spent)}/${dh(item.cost)}`],
          ),
          iconButton(
            'Up',
            ArrowUp,
            Message.WorkMoved({ id: item.id, direction: -1 }),
            index > 0,
            h,
          ),
          iconButton(
            'Down',
            ArrowDown,
            Message.WorkMoved({ id: item.id, direction: 1 }),
            index < game.backlog.length - 1,
            h,
          ),
          iconButton(
            `Rush with ${dh(game.devHours)}`,
            Zap,
            Message.WorkRushed({ id: item.id }),
            game.devHours >= 0.1,
            h,
          ),
          item.kind === 'migration' || item.ref === 'fix-bugs'
            ? h.empty
            : iconButton('Cancel', X, Message.WorkCancelled({ id: item.id }), true, h),
        ],
      ),
      meter(item.spent / item.cost, building ? 'bg-ok' : 'bg-primary-fill', h),
    ],
  )

const migrationCard = (game: Game, h: HtmlBuilder<Message>): Html => {
  const migration = serviceOf(game).migration
  if (!migration) return h.empty
  const target = `${RUNTIMES[migration.runtime].name}${migration.framework === 'none' ? '' : ` · ${FRAMEWORKS[migration.framework].name}`}`
  const done = migration.step >= MIGRATION_STEPS.length
  return h.div(
    [h.Key('migration'), h.Class(cn(NESTED, 'flex flex-col gap-2 px-3 py-2.5'))],
    [
      h.div(
        [h.Class('flex items-center gap-2 text-[12.5px]')],
        [
          h.span([h.Class('flex-1 font-medium')], [`Migrating to ${target}`]),
          migration.bugs ? badge({ variant: 'destructive' }, ['Bugs'], h) : h.empty,
        ],
      ),
      h.div(
        [h.Class('grid grid-cols-4 gap-1')],
        MIGRATION_STEPS.map((share, index) =>
          h.div(
            [h.Key(`step-${index}`), h.Class('flex flex-col gap-1')],
            [
              h.div(
                [
                  h.Class(
                    cn(
                      'h-1.5 rounded-full',
                      index < migration.step
                        ? 'bg-ok'
                        : index === migration.step && migration.ready
                          ? 'bg-primary-fill'
                          : 'bg-well shadow-well',
                    ),
                  ),
                ],
                [],
              ),
              h.span(
                [h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))],
                [`${Math.round(share * 100)}%`],
              ),
            ],
          ),
        ),
      ),
      done
        ? h.empty
        : h.div(
            [h.Class('flex gap-2')],
            [
              button(
                {
                  onClick: Message.MigrationShifted(),
                  isDisabled: !migration.ready,
                  size: 'sm',
                },
                [
                  icon(h, ArrowRight, 'size-3.5'),
                  `Shift to ${Math.round((MIGRATION_STEPS[migration.step] ?? 1) * 100)}%`,
                ],
                h,
              ),
              button(
                { onClick: Message.MigrationCancelled(), variant: 'outline', size: 'sm' },
                ['Cancel'],
                h,
              ),
            ],
          ),
    ],
  )
}

const deployRow = (game: Game, h: HtmlBuilder<Message>): Html => {
  const service = serviceOf(game)
  const chance = badDeployChance(game)
  return h.div(
    [h.Key('deploy'), h.Class(cn(NESTED, 'flex items-center gap-2 px-3 py-2 text-[12.5px]'))],
    [
      icon(h, Rocket, 'size-3.5 shrink-0 text-muted-foreground'),
      h.span(
        [h.Class('min-w-0 flex-1 truncate')],
        [
          game.awaiting.length > 0
            ? game.awaiting.map((id) => FEATURES[id].name).join(', ')
            : 'Nothing to deploy',
        ],
      ),
      game.awaiting.length > 0
        ? h.span(
            [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
            [
              game.incident?.kind === 'bad-deploy'
                ? 'after the bad deploy'
                : `in ${wait(service.nextDeployAt - game.time)}`,
            ],
          )
        : h.empty,
      chance > 0
        ? h.span(
            [
              h.Class(
                cn(FIGURE, 'text-[11.5px]', chance >= 0.15 ? 'text-warn' : 'text-muted-foreground'),
              ),
              h.Title('Chance a deploy ships a bug'),
            ],
            [`${Math.round(chance * 100)}% bad`],
          )
        : h.empty,
    ],
  )
}

const catalogRow = (
  key: string,
  name: string,
  cost: number,
  effect: string,
  extra: string | null,
  status: Html,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Key(key), h.Class('flex items-center gap-3 px-3 py-2')],
    [
      h.div(
        [h.Class('flex min-w-0 flex-1 flex-col gap-0.5')],
        [
          h.div(
            [h.Class('flex items-baseline gap-2')],
            [
              h.span([h.Class('truncate text-[12.5px] font-medium')], [name]),
              h.span([h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))], [dh(cost)]),
            ],
          ),
          h.span([h.Class('truncate text-[11.5px] text-muted-foreground')], [effect]),
          extra ? h.span([h.Class('truncate text-[11.5px] text-warn')], [extra]) : h.empty,
        ],
      ),
      status,
    ],
  )

const featureStatus = (game: Game, id: FeatureId, h: HtmlBuilder<Message>): Html => {
  if (game.shipped.includes(id))
    return badge({ variant: 'secondary' }, [icon(h, Check, 'size-3'), 'Live'], h)
  if (game.awaiting.includes(id)) return badge({ variant: 'outline' }, ['Built'], h)
  if (game.backlog.some((item) => item.ref === id))
    return badge({ variant: 'outline' }, ['Queued'], h)
  const refusal = featureRefusal(game, id)
  return button(
    {
      onClick: Message.FeatureQueued({ id }),
      isDisabled: refusal !== null,
      variant: 'outline',
      size: 'sm',
      attributes: [h.Title(refusal ? describeRefusal(refusal) : 'Add to the backlog')],
    },
    refusal ? [icon(h, Lock, 'size-3')] : [icon(h, Plus, 'size-3.5'), 'Build'],
    h,
  )
}

const taskStatus = (game: Game, id: TaskId, h: HtmlBuilder<Message>): Html => {
  if (serviceOf(game).fixes.includes(id as never))
    return badge({ variant: 'secondary' }, [icon(h, Check, 'size-3'), 'Done'], h)
  if (game.backlog.some((item) => item.ref === id))
    return badge({ variant: 'outline' }, ['Queued'], h)
  const refusal = taskRefusal(game, id)
  return button(
    {
      onClick: Message.TaskQueued({ id }),
      isDisabled: refusal !== null,
      variant: 'outline',
      size: 'sm',
      attributes: [h.Title(refusal ? describeRefusal(refusal) : 'Add to the backlog')],
    },
    [icon(h, Plus, 'size-3.5'), 'Queue'],
    h,
  )
}

const work = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const building = game.teams.length
  const tasks = TASK_IDS.filter((id) => {
    const def = TASKS[id]
    return !def.internal && (def.research === null || has(game, def.research))
  })
  const review = has(game, 'code-review')
  return h.div(
    [h.Class(`flex min-h-0 flex-col gap-3 p-4 ${SCROLL}`)],
    [
      migrationCard(game, h),
      deployRow(game, h),
      heading(
        'Backlog',
        h.div(
          [h.Class('flex items-center gap-1.5')],
          [
            icon(h, Bot, 'size-3.5 text-muted-foreground'),
            h.span([h.Class('text-[11.5px] text-muted-foreground')], ['Autopilot']),
            h.div(
              [h.Class(cn('grid grid-cols-2 gap-[3px] p-[3px]', WELL, 'rounded-[11px]'))],
              [
                segment('auto-off', !game.autopilot, Message.AutopilotToggled(), 'Off', h),
                segment('auto-on', game.autopilot, Message.AutopilotToggled(), 'On', h),
              ],
            ),
          ],
        ),
        h,
      ),
      h.div(
        [h.Class(cn(NESTED, 'flex flex-col divide-y divide-hairline'))],
        game.backlog.length > 0
          ? game.backlog.map((item, index) => backlogRow(game, item, index, index < building, h))
          : [
              h.div(
                [h.Key('empty'), h.Class('px-3 py-3 text-[12.5px] text-muted-foreground')],
                ['Empty'],
              ),
            ],
      ),
      heading('Features', h.empty, h),
      h.div(
        [h.Class(cn(NESTED, 'flex flex-col divide-y divide-hairline'))],
        FEATURE_IDS.filter((id) => FEATURES[id].era <= game.stage + 1).map((id) => {
          const def = FEATURES[id]
          return catalogRow(
            id,
            def.name,
            def.dh,
            def.era > game.stage ? `${ERAS[def.era]?.name ?? ''} · ${def.effect}` : def.effect,
            review && def.hidden && !game.shipped.includes(id) ? def.hidden : null,
            featureStatus(game, id, h),
            h,
          )
        }),
      ),
      tasks.length > 0 ? heading('Engineering', h.empty, h) : h.empty,
      tasks.length > 0
        ? h.div(
            [h.Class(cn(NESTED, 'flex flex-col divide-y divide-hairline'))],
            tasks.map((id) =>
              catalogRow(
                id,
                TASKS[id].name,
                TASKS[id].dh,
                TASKS[id].effect,
                null,
                taskStatus(game, id, h),
                h,
              ),
            ),
          )
        : h.empty,
    ],
  )
}

export const teamPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const rate = devHoursRate(game, ledgerOf(model))
  const payroll = payrollOf(game)
  return shell(
    'Team',
    [
      payroll > 0
        ? h.span(
            [h.Class(cn(FIGURE, 'text-[12px] text-muted-foreground'))],
            [`${money(payroll)}/s payroll`],
          )
        : h.empty,
      h.span(
        [h.Class(cn(FIGURE, 'flex items-baseline gap-1.5 text-[15px]'))],
        [
          dh(game.devHours),
          h.span([h.Class('text-[11px] text-muted-foreground')], [`+${perMinute(rate)}/min`]),
        ],
      ),
    ],
    [
      h.div(
        [
          h.Class(
            'grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)] border-t border-hairline narrow:grid-cols-1',
          ),
        ],
        [
          h.div(
            [h.Class('flex min-h-0 flex-col border-r border-hairline bg-nested narrow:border-r-0')],
            [people(model, h)],
          ),
          work(model, h),
        ],
      ),
    ],
    'max-w-[960px] h-[min(720px,100%)]',
    h,
  )
}
