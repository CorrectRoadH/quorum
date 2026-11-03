import type { Html, HtmlBuilder } from 'foldkit/html'
import { Option } from 'effect'
import { DragAndDrop } from '@foldkit/ui'
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Bot,
  Bug,
  Check,
  Crown,
  Gem,
  Hourglass,
  Lock,
  Plus,
  Rabbit,
  Rocket,
  Scale,
  Trash2,
  UserMinus,
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
  type FrameworkId,
  type PolicyId,
  type RuntimeId,
  type TaskId,
} from '@quorum/simulation/catalog'
import { has } from '@quorum/simulation/lookups'
import type { Engineer, Game, Team, WorkItem, WorkKind } from '@quorum/simulation/state'
import {
  badDeployChance,
  deployEvery,
  devHoursRate,
  languageOfService,
  membersOf,
  payrollOf,
  policyNow,
  rampSeconds,
  salaryOf,
  serviceOf,
  signingOf,
  teamOutputs,
} from '@quorum/simulation/team'
import { featureRefusal, itemName, MAX_TEAMS, taskRefusal } from '@quorum/simulation/work'
import { describeRefusal } from '@quorum/simulation/actions'
import { money } from '@/game/format.ts'
import { STACK_LOGOS } from '@/game/icons.ts'
import { Message } from '@/game/message.ts'
import { ledgerOf, type Model } from '@/game/model.ts'
import { glowing, shown } from '@/game/reveal.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, PANEL, SCROLL, WELL, ring, stackLogo } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   The Team panel (08), drawn as the engineering floor. On the left each team
   is a pod of seats: the founder, engineers, offers on their way, and an
   open seat to hire into. On the right the work moves along a ship line,
   queue → building → built → deploy → live, with a migration shown as the
   share of traffic on each Stack, and the roadmap of Features and tasks.
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

/** Each person keeps one avatar colour. */
const HUES = [28, 62, 150, 195, 240, 285, 330]
const hueOf = (id: string): number => HUES[Number(id.slice(1)) % HUES.length] ?? 240

const amount = (value: number): string =>
  value < 10 ? value.toFixed(1) : String(Math.floor(value))
const dh = (value: number): string => `${amount(value)} DH`

/** Dev Hours per sim second, per minute. */
const perMinute = (rate: number): string => {
  const value = rate * 60
  return value < 10 ? value.toFixed(1) : String(Math.round(value))
}

/** A wait in sim seconds: seconds under a minute and a half, minutes above. */
const wait = (seconds: number): string =>
  seconds < 90 ? `${Math.max(0, Math.ceil(seconds))} s` : `${Math.ceil(seconds / 60)} min`

const clamp = (share: number): number => Math.max(0, Math.min(1, share))

const POLICY_ICONS: Record<PolicyId, Parameters<typeof icon>[1]> = {
  'move-fast': Rabbit,
  balanced: Scale,
  quality: Gem,
}

/** Work kinds keep the build-group colours, so a kind reads the same everywhere. */
const KIND: Record<WorkKind, Readonly<{ label: string; fill: string }>> = {
  feature: { label: 'Feature', fill: 'bg-group-edge' },
  task: { label: 'Engineering', fill: 'bg-group-data' },
  migration: { label: 'Migration', fill: 'bg-group-compute' },
}

const STRIPES = 'repeating-linear-gradient(-45deg, oklch(1 0 0 / 0.28) 0 6px, transparent 6px 12px)'

const heading = (title: string, right: Html, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex items-center justify-between gap-2 px-1 pt-2')],
    [h.span([h.Class(EYEBROW)], [title]), right],
  )

const iconButton = (
  label: string,
  glyph: Parameters<typeof icon>[1],
  message: Message,
  enabled: boolean,
  h: HtmlBuilder<Message>,
  className = '',
): Html =>
  button(
    {
      onClick: message,
      isDisabled: !enabled,
      variant: 'ghost',
      size: 'icon-xs',
      className: cn('text-muted-foreground', className),
      attributes: [h.AriaLabel(label), h.Title(label)],
    },
    icon(h, glyph, 'size-3.5'),
    h,
  )

/** A circle drawn around an avatar: ramp-up for a new hire, the wait for an offer. */
const halo = (share: number, className: string, h: HtmlBuilder<Message>): Html => {
  const radius = 25
  const length = 2 * Math.PI * radius
  return h.svg(
    [
      h.AriaHidden(true),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 54 54'),
      h.Fill('none'),
      h.Class(cn('pointer-events-none absolute -inset-[5px] size-[54px]', className)),
    ],
    [
      h.circle([
        h.Cx('27'),
        h.Cy('27'),
        h.R(String(radius)),
        h.Stroke('currentColor'),
        h.StrokeWidth('2.5'),
        h.Attribute('opacity', '0.18'),
      ]),
      h.circle([
        h.Cx('27'),
        h.Cy('27'),
        h.R(String(radius)),
        h.Stroke('currentColor'),
        h.StrokeWidth('2.5'),
        h.StrokeLinecap('round'),
        h.Attribute('stroke-dasharray', `${length}`),
        h.Attribute('stroke-dashoffset', `${length * (1 - clamp(share))}`),
        h.Attribute('transform', 'rotate(-90 27 27)'),
        h.Class('transition-[stroke-dashoffset] duration-200 ease-out'),
      ]),
    ],
  )
}

/* ---------- the floor ---------- */

const seat = (
  key: string,
  face: Html,
  name: string,
  note: Html | string,
  corners: ReadonlyArray<Html>,
  className: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(key),
      h.Class(
        cn(
          'group relative flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1.5 pt-3.5 pb-2.5 text-center',
          className,
        ),
      ),
    ],
    [
      face,
      h.span([h.Class('mt-1 w-full truncate text-[12.5px] font-medium')], [name]),
      h.span([h.Class(cn(FIGURE, 'w-full truncate text-[10.5px] text-muted-foreground'))], [note]),
      ...corners,
    ],
  )

const corner = (side: 'left' | 'right', control: Html, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class(
        cn(
          'absolute top-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100',
          side === 'left' ? 'left-1' : 'right-1',
        ),
      ),
    ],
    [control],
  )

const face = (
  hue: number | null,
  content: Html,
  badgeMark: Html,
  ring: Html,
  h: HtmlBuilder<Message>,
): Html =>
  h.span(
    [
      h.Class(
        cn(
          'relative grid size-11 shrink-0 place-items-center rounded-full text-[17px] font-semibold text-white shadow-[inset_0_-2px_0_oklch(0_0_0/0.12),0_1px_2px_oklch(0_0_0/0.12)]',
          hue === null && 'bg-primary-fill text-on-primary-fill',
        ),
      ),
      ...(hue === null
        ? []
        : [
            h.Style({
              'background-image': `linear-gradient(to bottom, oklch(0.72 0.13 ${hue}), oklch(0.6 0.15 ${hue}))`,
            }),
          ]),
    ],
    [ring, content, badgeMark],
  )

const languageMark = (language: Engineer['language'], h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Class(
        'absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full bg-surface shadow-raised',
      ),
    ],
    [stackLogo(language, 'size-3', h)],
  )

const engineerSeat = (game: Game, engineer: Engineer, h: HtmlBuilder<Message>): Html => {
  const ramp = (game.time - engineer.hiredAt) / rampSeconds(game)
  const ramping = ramp < 1
  const name = nameOf(engineer.id)
  return seat(
    engineer.id,
    face(
      hueOf(engineer.id),
      h.span([], [name.slice(0, 1)]),
      languageMark(engineer.language, h),
      ramping ? halo(ramp, 'text-ok', h) : h.empty,
      h,
    ),
    name,
    ramping ? 'Ramping' : `${money(salaryOf(game, engineer.language))}/s`,
    [],
    'bg-raised shadow-raised',
    h,
  )
}

const engineerControls = (
  engineer: Engineer,
  teams: ReadonlyArray<Team>,
  h: HtmlBuilder<Message>,
): ReadonlyArray<Html> => {
  const index = teams.findIndex((team) => team.id === engineer.team)
  const next = teams[(index + 1) % teams.length]
  return [
    teams.length > 1 && next
      ? corner(
          'left',
          iconButton(
            `Move to ${next.name}`,
            ArrowLeftRight,
            Message.EngineerAssigned({ engineerId: engineer.id, teamId: next.id }),
            true,
            h,
          ),
          h,
        )
      : h.empty,
    corner(
      'right',
      iconButton(
        `Lay off ${nameOf(engineer.id)}`,
        UserMinus,
        Message.LayoffChosen({ engineerId: engineer.id }),
        true,
        h,
        'hover:text-danger',
      ),
      h,
    ),
  ]
}

const founderSeat = (h: HtmlBuilder<Message>): Html =>
  seat(
    'founder',
    face(null, icon(h, Crown, 'size-[18px]'), h.empty, h.empty, h),
    'You',
    'Founder',
    [],
    'bg-raised shadow-raised',
    h,
  )

const hireSeat = (game: Game, h: HtmlBuilder<Message>): Html => {
  const language = languageOfService(game)
  const price = signingOf(game, language)
  const open = game.stage >= 1
  const afford = game.cash >= price
  return h.button(
    [
      h.Key('hire'),
      h.Type('button'),
      h.OnClick(Message.HireChosen()),
      h.Disabled(!open || !afford),
      h.AriaLabel(
        open ? `Hire ${LANGUAGES[language].name} engineer for ${money(price)}` : 'Hiring locked',
      ),
      h.Class(
        cn(
          'press group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border-[1.5px] border-dashed px-1.5 pt-3.5 pb-2.5 text-center',
          open && afford
            ? 'border-foreground/25 text-foreground hover:border-foreground/45 hover:bg-foreground/[0.03]'
            : 'cursor-not-allowed border-foreground/12 text-muted-foreground',
        ),
      ),
    ],
    [
      h.span(
        [
          h.Class(
            cn(
              'relative grid size-11 place-items-center rounded-full',
              open && afford ? 'bg-primary-fill text-on-primary-fill shadow-primary' : WELL,
              'rounded-full',
            ),
          ),
        ],
        [
          icon(h, open ? Plus : Lock, open ? 'size-5' : 'size-4'),
          open ? languageMark(language, h) : h.empty,
        ],
      ),
      h.span(
        [h.Class('mt-1 w-full truncate text-[12.5px] font-medium')],
        [open ? 'Hire' : 'Locked'],
      ),
      h.span(
        [h.Class(cn(FIGURE, 'w-full truncate text-[10.5px] text-muted-foreground'))],
        [open ? money(price) : (ERAS[1]?.name ?? '')],
      ),
    ],
  )
}

const pendingSeat = (game: Game, id: string, readyAt: number, h: HtmlBuilder<Message>): Html => {
  const left = readyAt - game.time
  return seat(
    id,
    h.span(
      [
        h.Class(
          'relative grid size-11 place-items-center rounded-full border-[1.5px] border-dashed border-foreground/25 text-muted-foreground',
        ),
      ],
      [icon(h, Hourglass, 'size-4')],
    ),
    nameOf(id),
    `in ${wait(left)}`,
    [],
    'bg-foreground/[0.025] shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
    h,
  )
}

const policySwitch = (team: Team, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class(cn('grid grid-cols-3 gap-[3px] p-[3px]', WELL, 'rounded-[11px]'))],
    POLICY_IDS.map((policy) => {
      const selected = team.policy === policy
      return h.button(
        [
          h.Key(`${team.id}-${policy}`),
          h.Type('button'),
          h.AriaPressed(selected ? 'true' : 'false'),
          h.OnClick(Message.TeamPolicyChosen({ teamId: team.id, policy })),
          h.Class(
            cn(
              'press flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] font-medium',
              selected
                ? 'bg-raised text-foreground shadow-raised'
                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
            ),
          ),
        ],
        [
          icon(h, POLICY_ICONS[policy], 'size-3.5'),
          h.span([h.Class('truncate')], [POLICIES[policy].label]),
        ],
      )
    }),
  )

const pod = (model: Model, team: Team, index: number, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const output = teamOutputs(game, ledgerOf(model)).find((entry) => entry.team.id === team.id)
  const now = policyNow(game, team)
  const pending = game.hires.filter((entry) => entry.team === team.id)
  const sandbox = game.sandbox
  const target = DragAndDrop.maybeDropTarget(model.teamDrag)
  const dropTarget =
    DragAndDrop.isDragging(model.teamDrag) &&
    Option.exists(target, (entry) => entry.containerId === team.id)
  return h.section(
    [
      h.Key(team.id),
      ...DragAndDrop.droppable(team.id, team.name),
      h.Class(
        cn(
          PANEL,
          'flex flex-col gap-3 p-3 transition-shadow',
          dropTarget && 'ring-2 ring-primary ring-offset-2',
        ),
      ),
    ],
    [
      h.div(
        [h.Class('flex items-start gap-2 px-1')],
        [
          h.div(
            [h.Class('flex min-w-0 flex-1 flex-col')],
            [
              h.span(
                [h.Class('truncate text-[15px] font-semibold tracking-[-0.02em]')],
                [team.name],
              ),
              h.span(
                [h.Class('text-[11.5px] text-muted-foreground')],
                [
                  `${output?.headcount ?? 0} ${(output?.headcount ?? 0) === 1 ? 'person' : 'people'}`,
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col items-end')],
            [
              h.span(
                [h.Class(cn(FIGURE, 'text-[22px] leading-none font-medium'))],
                [perMinute(output?.rate ?? 0)],
              ),
              h.span([h.Class(cn(EYEBROW, 'mt-1 text-[9.5px]'))], ['DH / min']),
            ],
          ),
          index > 0
            ? iconButton('Remove team', Trash2, Message.TeamRemoved({ teamId: team.id }), true, h)
            : h.empty,
        ],
      ),
      policySwitch(team, h),
      now.id !== team.policy
        ? h.span(
            [h.Class('-mt-1.5 px-1 text-[11px] text-muted-foreground')],
            [`${now.label} until tomorrow`],
          )
        : h.empty,
      h.div(
        [h.Class('grid grid-cols-3 gap-2')],
        [
          index === 0 ? founderSeat(h) : h.empty,
          ...membersOf(game, team).map((engineer, memberIndex) =>
            h.div(
              [h.Key(engineer.id), h.Class('group relative')],
              [
                h.div(
                  [
                    ...DragAndDrop.draggable(
                      {
                        model: model.teamDrag,
                        toParentMessage: (message) => Message.TeamDragChanged({ message }),
                        itemId: engineer.id,
                        containerId: team.id,
                        index: memberIndex,
                      },
                      h,
                    ),
                    ...DragAndDrop.sortable(engineer.id),
                    h.AriaLabel(`Move ${nameOf(engineer.id)} from ${team.name}`),
                    h.Class(
                      cn(
                        'cursor-grab touch-none rounded-xl focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing',
                        Option.exists(
                          DragAndDrop.maybeDraggedItemId(model.teamDrag),
                          (id) => id === engineer.id,
                        ) && 'opacity-45',
                      ),
                    ),
                  ],
                  [engineerSeat(game, engineer, h)],
                ),
                ...engineerControls(engineer, game.teams, h),
              ],
            ),
          ),
          ...pending.map((entry) => pendingSeat(game, entry.id, entry.readyAt, h)),
          // Hiring is not shown before its Era (15 "Progressive disclosure").
          index === 0 && !sandbox && game.stage >= 1 ? hireSeat(game, h) : h.empty,
        ],
      ),
      sandbox ? h.empty : working(game.backlog[index], h),
    ],
  )
}

/** What the pod has on its desk: the backlog item its team builds. */
const working = (item: WorkItem | undefined, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class(cn('flex items-center gap-2 px-2.5 py-2', WELL, 'rounded-[10px]'))],
    item
      ? [
          statusMark('building', item.spent / item.cost, h),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
            [codeOf(item.kind, item.ref)],
          ),
          h.span([h.Class('min-w-0 flex-1 truncate text-[12.5px] font-medium')], [itemName(item)]),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
            [`${Math.floor(clamp(item.spent / item.cost) * 100)}%`],
          ),
        ]
      : [
          statusMark('queued', 0, h),
          h.span([h.Class('text-[12.5px] text-muted-foreground')], ['Nothing assigned']),
        ],
  )

const floor = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  return h.div(
    [
      h.Class(`flex min-h-0 flex-col gap-3 p-4 ${SCROLL}`),
      h.DataAttribute('team-drag-floor', ''),
      ...(DragAndDrop.isDragging(model.teamDrag) ? [h.DataAttribute('team-drag-active', '')] : []),
    ],
    [
      game.teams.length > 1 && game.engineers.length > 0
        ? h.p(
            [h.Class('px-1 text-[11.5px] text-muted-foreground')],
            ['Drag an engineer to another team, or use the move button.'],
          )
        : h.empty,
      ...game.teams.map((team, index) => pod(model, team, index, h)),
      Option.match(DragAndDrop.ghostStyle(model.teamDrag), {
        onNone: () => h.empty,
        onSome: (style) =>
          Option.match(DragAndDrop.maybeDraggedItemId(model.teamDrag), {
            onNone: () => h.empty,
            onSome: (id) =>
              h.div(
                [
                  h.Style(style),
                  h.Class(cn(PANEL, 'pointer-events-none z-50 px-4 py-3 text-sm font-medium')),
                ],
                [nameOf(id)],
              ),
          }),
      }),
      game.stage >= 1 && game.teams.length < MAX_TEAMS
        ? h.button(
            [
              h.Key('new-team'),
              h.Type('button'),
              h.OnClick(Message.TeamCreated()),
              h.Class(
                'press flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-foreground/20 text-[13px] font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground',
              ),
            ],
            [icon(h, Plus, 'size-4'), 'New team'],
          )
        : h.empty,
    ],
  )
}

/* ---------- the ship line ---------- */

/* ---------- a migration ---------- */

const stackName = (runtime: RuntimeId, framework: FrameworkId): string =>
  `${RUNTIMES[runtime].name}${framework === 'none' ? '' : ` · ${FRAMEWORKS[framework].name}`}`

const migrationCard = (game: Game, h: HtmlBuilder<Message>): Html => {
  const migration = serviceOf(game).migration
  if (!migration) return h.empty
  const done = migration.step >= MIGRATION_STEPS.length
  const current = migration.step > 0 ? (MIGRATION_STEPS[migration.step - 1] ?? 1) : 0
  const next = MIGRATION_STEPS[migration.step] ?? 1
  const language = RUNTIMES[migration.runtime].language
  const brand = STACK_LOGOS[language].color ?? 'var(--group-compute)'
  const step = game.backlog.find((item) => item.kind === 'migration')
  const percent = (share: number) => `${Math.round(share * 100)}%`
  return h.section(
    [h.Key('migration'), h.Class(cn(PANEL, 'flex shrink-0 flex-col gap-3 px-4 pt-3.5 pb-3'))],
    [
      h.div(
        [h.Class('flex flex-wrap items-center gap-x-3 gap-y-2')],
        [
          h.div(
            [h.Class('flex min-w-0 flex-1 items-center gap-2.5')],
            [
              h.span(
                [h.Class('opacity-45 grayscale')],
                [stackLogo(RUNTIMES[migration.fromRuntime].language, 'size-5', h)],
              ),
              h.span(
                [
                  h.Class(
                    'truncate text-[13px] text-muted-foreground line-through decoration-foreground/25',
                  ),
                ],
                [stackName(migration.fromRuntime, migration.fromFramework)],
              ),
              icon(h, ArrowRight, 'size-3.5 shrink-0 text-muted-foreground'),
              stackLogo(language, 'size-5', h),
              h.span(
                [h.Class('truncate text-[15px] font-semibold tracking-[-0.02em]')],
                [stackName(migration.runtime, migration.framework)],
              ),
              migration.bugs
                ? badge({ variant: 'destructive' }, [icon(h, Bug, 'size-3'), 'Bugs'], h)
                : h.empty,
            ],
          ),
          done
            ? badge({ variant: 'secondary' }, [icon(h, Check, 'size-3'), 'Migrated'], h)
            : h.div(
                [h.Class('flex items-center gap-2')],
                [
                  h.span(
                    [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
                    [
                      migration.ready
                        ? 'Ready'
                        : step
                          ? `${codeOf('migration', step.ref)} · ${amount(step.spent)}/${dh(step.cost)}`
                          : '',
                    ],
                  ),
                  button(
                    { onClick: Message.MigrationCancelled(), variant: 'ghost', size: 'sm' },
                    ['Cancel'],
                    h,
                  ),
                  button(
                    {
                      onClick: Message.MigrationShifted(),
                      isDisabled: !migration.ready,
                      size: 'sm',
                    },
                    [icon(h, ArrowRight, 'size-3.5'), `Shift to ${percent(next)}`],
                    h,
                  ),
                ],
              ),
        ],
      ),
      h.div(
        [h.Class('flex flex-col gap-1')],
        [
          h.div(
            [h.Class(cn('relative h-7 overflow-hidden', WELL, 'rounded-lg'))],
            [
              done
                ? h.empty
                : h.div(
                    [
                      h.Class('absolute inset-0 transition-[clip-path] duration-500 ease-out'),
                      h.Style({
                        'background-color': `color-mix(in oklch, ${brand} ${migration.ready ? 45 : 18}%, transparent)`,
                        'background-image': STRIPES,
                        'clip-path': `inset(0 ${(1 - next) * 100}% 0 0)`,
                      }),
                    ],
                    [],
                  ),
              h.div(
                [
                  h.Class(
                    'absolute inset-0 shadow-[inset_0_1px_0_oklch(1_0_0/0.3)] transition-[clip-path] duration-700 [transition-timing-function:var(--ease-in-out)]',
                  ),
                  h.Style({
                    'background-color': brand,
                    'clip-path': `inset(0 ${(1 - current) * 100}% 0 0 round 8px)`,
                  }),
                ],
                [],
              ),
              ...MIGRATION_STEPS.slice(0, -1).map((share, at) =>
                h.div(
                  [
                    h.Key(`tick-${at}`),
                    h.Class('absolute inset-y-0 w-px bg-foreground/15'),
                    h.Style({ left: `${share * 100}%` }),
                  ],
                  [],
                ),
              ),
              h.span(
                [
                  h.Class(
                    cn(
                      FIGURE,
                      'absolute inset-y-0 right-2.5 flex items-center text-[11px] text-muted-foreground',
                    ),
                  ),
                ],
                [`${percent(current)} of traffic`],
              ),
            ],
          ),
          h.div(
            [h.Class('relative h-3.5')],
            MIGRATION_STEPS.map((share, at) =>
              h.span(
                [
                  h.Key(`label-${at}`),
                  h.Class(
                    cn(
                      FIGURE,
                      'absolute top-0 text-[10px]',
                      at < migration.step ? 'text-foreground' : 'text-muted-foreground',
                      share >= 1 ? '-translate-x-full' : '-translate-x-1/2',
                    ),
                  ),
                  h.Style({ left: `${share * 100}%` }),
                ],
                [percent(share)],
              ),
            ),
          ),
        ],
      ),
    ],
  )
}

/* ---------- the board ---------- */

type Status = 'queued' | 'building' | 'shipping' | 'live'

/** A Linear-style status mark: a dashed ring waits, a filling pie builds, a check is live. */
const statusMark = (status: Status, share: number, h: HtmlBuilder<Message>): Html => {
  const pie = 2 * Math.PI * 2.5
  const tone =
    status === 'building' ? 'text-warn' : status === 'queued' ? 'text-muted-foreground' : 'text-ok'
  return h.svg(
    [
      h.AriaHidden(true),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox('0 0 14 14'),
      h.Fill('none'),
      h.Class(cn('size-3.5 shrink-0', tone)),
    ],
    status === 'live'
      ? [
          h.circle([h.Cx('7'), h.Cy('7'), h.R('6.5'), h.Fill('currentColor')]),
          h.path([
            h.D('M4.3 7.2 6.2 9 9.8 5.2'),
            h.Stroke('white'),
            h.StrokeWidth('1.5'),
            h.StrokeLinecap('round'),
            h.StrokeLinejoin('round'),
          ]),
        ]
      : [
          h.circle([
            h.Cx('7'),
            h.Cy('7'),
            h.R('6'),
            h.Stroke('currentColor'),
            h.StrokeWidth('1.5'),
            ...(status === 'queued' ? [h.Attribute('stroke-dasharray', '1.6 1.9')] : []),
          ]),
          status === 'queued'
            ? h.empty
            : h.circle([
                h.Cx('7'),
                h.Cy('7'),
                h.R('2.5'),
                h.Stroke('currentColor'),
                h.StrokeWidth('5'),
                h.Attribute('stroke-dasharray', `${pie * clamp(share)} ${pie}`),
                h.Attribute('transform', 'rotate(-90 7 7)'),
              ]),
        ],
  )
}

/** A stable identifier per catalog entry, as an issue tracker would show it. */
const codeOf = (kind: WorkKind, ref: string): string => {
  if (kind === 'feature') return `FEAT-${FEATURE_IDS.indexOf(ref as FeatureId) + 1}`
  if (kind === 'task') return `ENG-${TASK_IDS.indexOf(ref as TaskId) + 1}`
  return `MIG-${ref.replace(/\D/g, '') || '1'}`
}

const label = (kind: WorkKind, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Class(
        'inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[10.5px] font-medium text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
      ),
    ],
    [h.span([h.Class(cn('size-1.5 rounded-full', KIND[kind].fill))], []), KIND[kind].label],
  )

const estimate = (text: string, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Class(
        cn(
          FIGURE,
          'inline-flex h-5 items-center rounded-full px-1.5 text-[10.5px] whitespace-nowrap text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
        ),
      ),
    ],
    [text],
  )

/** A small avatar for a card's assignees. */
const mini = (id: string | null, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Key(id ?? 'founder'),
      h.Title(id ? nameOf(id) : 'You'),
      h.Class(
        cn(
          'grid size-5 shrink-0 place-items-center rounded-full text-[9.5px] font-semibold text-white ring-2 ring-[var(--card)] not-first:-ml-1.5',
          id === null && 'bg-primary-fill text-on-primary-fill',
        ),
      ),
      ...(id === null ? [] : [h.Style({ 'background-color': `oklch(0.64 0.14 ${hueOf(id)})` })]),
    ],
    [id ? nameOf(id).slice(0, 1) : icon(h, Crown, 'size-2.5')],
  )

const assignees = (game: Game, team: Team, h: HtmlBuilder<Message>): Html => {
  const people: ReadonlyArray<string | null> = [
    ...(game.teams[0]?.id === team.id ? [null] : []),
    ...membersOf(game, team).map((engineer) => engineer.id),
  ]
  const shown = people.slice(0, 4)
  return h.span(
    [h.Class('flex items-center'), h.Title(`${team.name}: ${people.length}`)],
    [
      ...shown.map((id) => mini(id, h)),
      people.length > shown.length
        ? h.span(
            [h.Class(cn(FIGURE, 'ml-1 text-[10.5px] text-muted-foreground'))],
            [`+${people.length - shown.length}`],
          )
        : h.empty,
    ],
  )
}

const unassigned = (h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Title('Unassigned'),
      h.Class('size-5 rounded-full border-[1.5px] border-dashed border-foreground/25'),
    ],
    [],
  )

const card = (
  key: string,
  code: string,
  title: string,
  status: Status,
  share: number,
  owner: Html,
  chips: ReadonlyArray<Html>,
  actions: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(key),
      h.Class(
        cn(
          'group relative flex flex-col gap-2 rounded-[10px] bg-surface px-3 py-2.5 shadow-[0_0_0_1px_var(--hairline-soft),0_1px_2px_oklch(0_0_0/0.05)] transition-shadow duration-150 hover:shadow-[0_0_0_1px_var(--hairline),0_2px_6px_oklch(0_0_0/0.07)]',
          status === 'live' && 'bg-transparent shadow-[0_0_0_1px_var(--hairline-soft)]',
        ),
      ),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-2')],
        [h.span([h.Class(cn(FIGURE, 'flex-1 text-[11px] text-muted-foreground'))], [code]), owner],
      ),
      h.div(
        [h.Class('flex items-start gap-2')],
        [
          h.span([h.Class('mt-[2px]')], [statusMark(status, share, h)]),
          h.span(
            [
              h.Class(
                cn(
                  'line-clamp-2 text-[13px] leading-[1.35] font-medium',
                  status === 'live' && 'text-muted-foreground',
                ),
              ),
            ],
            [title],
          ),
        ],
      ),
      chips.length > 0
        ? h.div([h.Class('flex min-h-5 flex-wrap items-center gap-1')], chips)
        : h.empty,
      actions.length > 0
        ? h.div(
            [
              h.Class(
                'absolute top-1.5 right-1.5 flex items-center rounded-lg bg-surface p-0.5 opacity-0 shadow-[0_0_0_1px_var(--hairline-soft),0_2px_6px_oklch(0_0_0/0.08)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
              ),
            ],
            actions,
          )
        : h.empty,
    ],
  )

const rush = (game: Game, item: WorkItem, h: HtmlBuilder<Message>): Html =>
  iconButton(
    `Rush with ${dh(game.devHours)}`,
    Zap,
    Message.WorkRushed({ id: item.id }),
    game.devHours >= 0.1,
    h,
  )

const cancel = (item: WorkItem, h: HtmlBuilder<Message>): Html =>
  item.kind === 'migration' || item.ref === 'fix-bugs'
    ? h.empty
    : iconButton('Cancel', X, Message.WorkCancelled({ id: item.id }), true, h)

const backlogCard = (
  game: Game,
  item: WorkItem,
  index: number,
  team: Team | undefined,
  h: HtmlBuilder<Message>,
): Html => {
  const share = clamp(item.spent / item.cost)
  return card(
    `item-${item.id}`,
    codeOf(item.kind, item.ref),
    itemName(item),
    team ? 'building' : 'queued',
    share,
    team ? assignees(game, team, h) : unassigned(h),
    [
      label(item.kind, h),
      estimate(
        team || item.spent > 0 ? `${amount(item.spent)}/${dh(item.cost)}` : dh(item.cost),
        h,
      ),
    ],
    [
      team
        ? h.empty
        : iconButton(
            'Up',
            ArrowUp,
            Message.WorkMoved({ id: item.id, direction: -1 }),
            index > 0,
            h,
          ),
      team
        ? h.empty
        : iconButton(
            'Down',
            ArrowDown,
            Message.WorkMoved({ id: item.id, direction: 1 }),
            index < game.backlog.length - 1,
            h,
          ),
      rush(game, item, h),
      cancel(item, h),
    ],
    h,
  )
}

const idleCard = (game: Game, team: Team, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Key(`idle-${team.id}`),
      h.Class(
        'flex items-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-foreground/15 px-3 py-2.5',
      ),
    ],
    [
      assignees(game, team, h),
      h.span(
        [h.Class('flex-1 truncate text-[12.5px] text-muted-foreground')],
        [`${team.name} idle`],
      ),
    ],
  )

const column = (
  key: string,
  status: Status,
  title: string,
  count: number,
  top: Html,
  cards: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(key),
      h.Class('flex min-h-[260px] min-w-0 flex-col gap-1.5 rounded-xl bg-foreground/[0.028] p-1.5'),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-2 px-1.5 pt-1 pb-1')],
        [
          statusMark(status, status === 'building' ? 0.5 : 1, h),
          h.span([h.Class('text-[12.5px] font-medium')], [title]),
          h.span([h.Class(cn(FIGURE, 'text-[12px] text-muted-foreground'))], [String(count)]),
        ],
      ),
      top,
      ...cards,
    ],
  )

const deployPill = (game: Game, h: HtmlBuilder<Message>): Html => {
  const built = game.awaiting.length
  const left = serviceOf(game).nextDeployAt - game.time
  const chance = badDeployChance(game)
  const stalled = game.incident?.kind === 'bad-deploy'
  return h.div(
    [
      h.Key('deploy'),
      h.Class(
        cn(
          'flex items-center gap-2.5 rounded-[10px] px-2.5 py-2',
          built > 0
            ? 'bg-primary-fill text-on-primary-fill shadow-primary'
            : 'text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
        ),
      ),
    ],
    [
      h.span(
        [
          h.Class(
            cn(
              'relative grid size-8 shrink-0 place-items-center rounded-full',
              built > 0 && !stalled
                ? 'bg-ok text-white'
                : stalled
                  ? 'bg-danger text-white'
                  : 'bg-well',
            ),
          ),
        ],
        [
          icon(h, Rocket, 'size-3.5'),
          built > 0 && !stalled
            ? h.span(
                [h.Class('absolute -inset-[3px]')],
                [ring(1 - left / deployEvery(game), 'size-[38px] text-ok', h)],
              )
            : h.empty,
        ],
      ),
      h.div(
        [h.Class('flex min-w-0 flex-col')],
        [
          h.span(
            [h.Class('truncate text-[12.5px] font-medium')],
            [built === 0 ? 'Nothing to ship' : stalled ? 'Held' : `Deploy in ${wait(left)}`],
          ),
          chance > 0
            ? h.span(
                [
                  h.Class(cn(FIGURE, 'text-[10.5px]', chance >= 0.15 ? 'text-warn' : 'opacity-60')),
                  h.Title('Chance a deploy ships a bug'),
                ],
                [`${Math.round(chance * 100)}% bad deploys`],
              )
            : h.empty,
        ],
      ),
    ],
  )
}

const LIVE_SHOWN = 4

const board = (game: Game, h: HtmlBuilder<Message>): Html => {
  const teams = game.teams
  const queue = game.backlog.slice(teams.length)
  const building = game.backlog.slice(0, teams.length)
  const live = [...game.shipped].reverse()
  return h.div(
    [h.Class('grid grid-cols-4 gap-2 narrow:grid-cols-1')],
    [
      column(
        'queued',
        'queued',
        'Up next',
        queue.length,
        h.empty,
        queue.map((item, at) => backlogCard(game, item, teams.length + at, undefined, h)),
        h,
      ),
      column(
        'building',
        'building',
        'In progress',
        building.length,
        h.empty,
        teams.map((team, index) => {
          const item = game.backlog[index]
          return item ? backlogCard(game, item, index, team, h) : idleCard(game, team, h)
        }),
        h,
      ),
      column(
        'shipping',
        'shipping',
        'Shipping',
        game.awaiting.length,
        deployPill(game, h),
        game.awaiting.map((id) =>
          card(
            `built-${id}`,
            codeOf('feature', id),
            FEATURES[id].name,
            'shipping',
            1,
            h.empty,
            [label('feature', h)],
            [],
            h,
          ),
        ),
        h,
      ),
      column(
        'live',
        'live',
        'Live',
        live.length,
        h.empty,
        [
          ...live
            .slice(0, LIVE_SHOWN)
            .map((id) =>
              card(
                `live-${id}`,
                codeOf('feature', id),
                FEATURES[id].name,
                'live',
                1,
                h.empty,
                [],
                [],
                h,
              ),
            ),
          live.length > LIVE_SHOWN
            ? h.span(
                [h.Key('more'), h.Class(cn(FIGURE, 'px-2 py-1 text-[11px] text-muted-foreground'))],
                [`+${live.length - LIVE_SHOWN} more`],
              )
            : h.empty,
        ],
        h,
      ),
    ],
  )
}

const autopilot = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  return h.button(
    [
      h.Type('button'),
      h.Role('switch'),
      h.AriaChecked(game.autopilot),
      h.OnClick(Message.AutopilotToggled()),
      h.Class(
        cn(
          'press enter-pop inline-flex h-7 items-center gap-1.5 rounded-full pr-1 pl-2.5 text-[11.5px] font-medium',
          glowing(model, 'autopilot') && 'cue-glow',
          !shown(model, 'autopilot') && 'hidden',
          game.autopilot
            ? 'bg-primary-fill text-on-primary-fill shadow-primary'
            : 'text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline-soft)] hover:text-foreground',
        ),
      ),
    ],
    [
      icon(h, Bot, 'size-3.5'),
      'Autopilot',
      h.span(
        [
          h.Class(
            cn(
              FIGURE,
              'rounded-full px-1.5 py-0.5 text-[10px]',
              game.autopilot ? 'bg-white/20' : 'bg-well',
            ),
          ),
        ],
        [game.autopilot ? 'ON' : 'OFF'],
      ),
    ],
  )
}

/* ---------- the roadmap ---------- */

const costPill = (cost: number, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Class(
        cn(
          FIGURE,
          'shrink-0 rounded-full bg-primary-fill px-2 py-0.5 text-[10.5px] text-on-primary-fill shadow-primary',
        ),
      ),
    ],
    [dh(cost)],
  )

type TileState = 'open' | 'locked' | 'queued' | 'done'

const tile = (
  key: string,
  code: string,
  name: string,
  cost: number,
  effect: string,
  extra: string | null,
  state: TileState,
  status: Html,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(key),
      h.Class(
        cn(
          'flex min-w-0 flex-col gap-1.5 rounded-xl px-3 pt-2.5 pb-2.5',
          state === 'locked'
            ? 'bg-foreground/[0.025] text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline-soft)]'
            : state === 'done'
              ? 'bg-[var(--ok-soft)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--ok)_18%,transparent)]'
              : 'bg-raised shadow-raised',
        ),
      ),
    ],
    [
      h.div(
        [h.Class('flex items-start gap-2')],
        [
          h.div(
            [h.Class('flex min-w-0 flex-1 flex-col')],
            [
              h.span([h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))], [code]),
              h.span([h.Class('truncate text-[13px] font-semibold')], [name]),
            ],
          ),
          state === 'done' ? h.empty : costPill(cost, h),
        ],
      ),
      h.span(
        [h.Class('line-clamp-2 min-h-[2lh] text-[11.5px] leading-snug text-muted-foreground')],
        [effect],
      ),
      extra ? h.span([h.Class('truncate text-[11.5px] text-warn')], [extra]) : h.empty,
      h.div([h.Class('mt-auto flex justify-end pt-0.5')], [status]),
    ],
  )

const queueButton = (
  label: string,
  message: Message,
  refusal: string | null,
  h: HtmlBuilder<Message>,
): Html =>
  button(
    {
      onClick: message,
      isDisabled: refusal !== null,
      variant: 'outline',
      size: 'sm',
      attributes: [h.Title(refusal ?? 'Add to the backlog')],
    },
    refusal ? [icon(h, Lock, 'size-3'), 'Locked'] : [icon(h, Plus, 'size-3.5'), label],
    h,
  )

const featureTile = (game: Game, id: FeatureId, review: boolean, h: HtmlBuilder<Message>) => {
  const def = FEATURES[id]
  const live = game.shipped.includes(id)
  const built = game.awaiting.includes(id)
  const queued = game.backlog.some((item) => item.ref === id)
  const refusal = featureRefusal(game, id)
  const state: TileState = live
    ? 'done'
    : built || queued
      ? 'queued'
      : refusal !== null
        ? 'locked'
        : 'open'
  return tile(
    id,
    codeOf('feature', id),
    def.name,
    def.dh,
    def.era > game.stage ? `${ERAS[def.era]?.name ?? ''} · ${def.effect}` : def.effect,
    review && def.hidden && !live ? def.hidden : null,
    state,
    live
      ? badge({ variant: 'secondary', className: 'text-ok' }, [icon(h, Check, 'size-3'), 'Live'], h)
      : built
        ? badge({ variant: 'outline' }, [icon(h, Rocket, 'size-3'), 'Built'], h)
        : queued
          ? badge({ variant: 'outline' }, ['Queued'], h)
          : queueButton(
              'Build',
              Message.FeatureQueued({ id }),
              refusal ? describeRefusal(refusal) : null,
              h,
            ),
    h,
  )
}

const taskTile = (game: Game, id: TaskId, h: HtmlBuilder<Message>) => {
  const done = serviceOf(game).fixes.includes(id as never)
  const queued = game.backlog.some((item) => item.ref === id)
  const refusal = taskRefusal(game, id)
  return tile(
    id,
    codeOf('task', id),
    TASKS[id].name,
    TASKS[id].dh,
    TASKS[id].effect,
    null,
    done ? 'done' : queued ? 'queued' : refusal !== null ? 'locked' : 'open',
    done
      ? badge({ variant: 'secondary', className: 'text-ok' }, [icon(h, Check, 'size-3'), 'Done'], h)
      : queued
        ? badge({ variant: 'outline' }, ['Queued'], h)
        : queueButton(
            'Queue',
            Message.TaskQueued({ id }),
            refusal ? describeRefusal(refusal) : null,
            h,
          ),
    h,
  )
}

const TILES = 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2'

const work = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const tasks = TASK_IDS.filter((id) => {
    const def = TASKS[id]
    return !def.internal && (def.research === null || has(game, def.research))
  })
  const features = FEATURE_IDS.filter((id) => FEATURES[id].era <= game.stage + 1)
  const live = features.filter((id) => game.shipped.includes(id)).length
  const review = has(game, 'code-review')
  const engineering = tasks.length > 0 && shown(model, 'engineering')
  return h.div(
    [h.Class(`flex min-h-0 flex-col gap-3 p-4 ${SCROLL}`)],
    [
      migrationCard(game, h),
      heading('Board', autopilot(model, h), h),
      board(game, h),
      heading(
        'Features',
        h.span(
          [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
          [`${live} / ${features.length} live`],
        ),
        h,
      ),
      h.div(
        [h.Class(TILES)],
        features.map((id) => featureTile(game, id, review, h)),
      ),
      engineering ? heading('Engineering', h.empty, h) : h.empty,
      engineering
        ? h.div(
            [
              h.Class(
                cn(TILES, 'enter-pop rounded-xl', glowing(model, 'engineering') && 'cue-glow'),
              ),
            ],
            tasks.map((id) => taskTile(game, id, h)),
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
            [
              h.Class(
                cn(FIGURE, 'text-[12px] whitespace-nowrap text-muted-foreground compact:hidden'),
              ),
            ],
            [`${money(payroll)}/s payroll`],
          )
        : h.empty,
      h.span(
        [
          h.Class(
            cn(
              FIGURE,
              'flex items-baseline gap-1.5 rounded-full bg-well px-3 py-1 text-[15px] whitespace-nowrap shadow-well',
            ),
          ),
        ],
        [dh(game.devHours), h.span([h.Class('text-[11px] text-ok')], [`+${perMinute(rate)}/min`])],
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
            [floor(model, h)],
          ),
          work(model, h),
        ],
      ),
    ],
    'max-w-[1360px] h-[min(820px,100%)]',
    h,
  )
}
