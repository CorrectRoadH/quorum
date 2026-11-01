import type { Html, HtmlBuilder } from 'foldkit/html'
import { Check, Download, Lock, TriangleAlert, Trash2, X } from 'lucide'
import { offer } from '@/game/engine/actions.ts'
import {
  COMPONENTS,
  COMPONENT_IDS,
  ERAS,
  INCIDENTS,
  INCIDENT_IDS,
  RESEARCH,
  RESEARCH_TRACKS,
  researchList,
  type ResearchDef,
  type ResearchId,
} from '@/game/engine/catalog.ts'
import { eraOf, has, researchReady } from '@/game/engine/lookups.ts'
import { clock, compact, money } from '@/game/format.ts'
import { COMPONENT_ICONS, type StackLogoId } from '@/game/icons.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { SPEEDS } from '@/game/update.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import {
  EYEBROW,
  FIGURE,
  FLOAT,
  NESTED,
  SCROLL,
  WELL,
  groupBadge,
  mark,
  stackLogo,
} from './bits.ts'

/* ==========================================================================
   The panels over the board: Research, How to play, the funding offer, the
   Era card, the end of the slice, and the playtest panel.
   ========================================================================== */

const shell = (
  title: string,
  right: ReadonlyArray<Html>,
  body: ReadonlyArray<Html>,
  width: string,
  h: HtmlBuilder<Message>,
) =>
  h.div(
    [
      h.Class(
        'absolute inset-0 z-30 grid place-items-center bg-foreground/10 p-6 backdrop-blur-[3px] enter-backdrop',
      ),
    ],
    [
      h.div(
        [h.Class(`flex max-h-full w-full flex-col overflow-hidden ${width} ${FLOAT} enter-modal`)],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-4 px-5 pt-4 pb-3')],
            [
              h.span([h.Class('text-[17px] font-semibold tracking-[-0.025em]')], [title]),
              h.div(
                [h.Class('flex items-center gap-3')],
                [
                  ...right,
                  button(
                    {
                      onClick: Message.PanelClosed(),
                      variant: 'ghost',
                      size: 'icon',
                      className: 'text-muted-foreground',
                      attributes: [h.AriaLabel('Close (Esc)')],
                    },
                    icon(h, X, 'size-4'),
                    h,
                  ),
                ],
              ),
            ],
          ),
          ...body,
        ],
      ),
    ],
  )

const primaryButton = (label: string, message: Message, h: HtmlBuilder<Message>) =>
  button({ onClick: message, size: 'lg', className: 'px-4' }, label, h)

const secondaryButton = (
  label: string,
  message: Message,
  h: HtmlBuilder<Message>,
  glyph?: Parameters<typeof icon>[1],
) =>
  button(
    { onClick: message, variant: 'outline', size: 'lg', className: 'px-3.5' },
    [...(glyph ? [icon(h, glyph, 'size-4')] : []), label],
    h,
  )

const footer = (children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div([h.Class('flex justify-end gap-2 border-t border-hairline bg-nested px-5 py-3')], children)

const stat = (name: string, value: string, h: HtmlBuilder<Message>) =>
  h.div(
    [h.Key(name), h.Class('flex flex-col gap-1 px-4 py-3')],
    [h.span([h.Class(EYEBROW)], [name]), h.span([h.Class(cn(FIGURE, 'text-[18px]'))], [value])],
  )

const stats = (columns: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div([h.Class(cn('grid w-full divide-x divide-hairline', WELL, columns))], children)

/* ---------- research ---------- */

const RESEARCH_LOGOS: Partial<Record<ResearchId, StackLogoId>> = {
  'lang-ruby': 'ruby',
  'lang-node': 'node',
  'lang-python': 'python',
  'fw-laravel': 'laravel',
  'fw-rails': 'rails',
  'fw-express': 'express',
  'fw-django': 'django',
}

/** The Component badge or brand logo a research item unlocks, else its monogram. */
const researchMark = (entry: ResearchDef, locked: boolean, h: HtmlBuilder<Message>): Html => {
  const component = COMPONENT_IDS.find((id) => COMPONENTS[id].unlock === entry.id)
  if (component)
    return h.span(
      [h.Class('grid size-10 place-items-center')],
      [groupBadge(COMPONENTS[component].group, COMPONENT_ICONS[component], 'size-9', h, locked)],
    )
  const logo = RESEARCH_LOGOS[entry.id]
  if (logo)
    return h.span(
      [
        h.Class(
          cn(
            'grid size-10 place-items-center rounded-lg bg-well shadow-well',
            locked ? 'opacity-40 grayscale' : '',
          ),
        ),
      ],
      [stackLogo(logo, 'size-5', h)],
    )
  return mark(
    entry.mark,
    cn('size-10 rounded-lg text-[11px] lowercase', locked ? 'opacity-40' : ''),
    h,
  )
}

const researchCard = (model: Model, entry: ResearchDef, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const owned = has(game, entry.id)
  const early = entry.era > game.stage
  const ready = researchReady(game, entry.id)
  const affordable = game.insight >= entry.cost
  const state = owned ? 'owned' : !ready ? 'locked' : affordable ? 'buy' : 'saving'
  const open = !owned && game.openActions.includes(entry.id)
  const missing = entry.requires
    .filter((needed) => !has(game, needed))
    .map((needed) => RESEARCH[needed].name)
  return h.button(
    [
      h.Key(entry.id),
      h.Type('button'),
      h.Disabled(state !== 'buy'),
      h.OnClick(Message.ResearchBought({ id: entry.id })),
      h.Class(
        `group grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-xl p-2.5 text-left transition-[filter,box-shadow] ${
          state === 'owned'
            ? 'bg-nested shadow-[inset_0_0_0_1px_var(--hairline-soft)]'
            : state === 'buy'
              ? 'bg-raised shadow-[var(--elev-raised),0_0_0_1.5px_var(--primary-strong)] hover:brightness-[0.985]'
              : state === 'saving'
                ? 'bg-raised shadow-raised'
                : 'border border-dashed border-border'
        }`,
      ),
    ],
    [
      researchMark(entry, state === 'locked', h),
      h.div(
        [h.Class('flex min-w-0 flex-col gap-0.5')],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-2')],
            [
              h.span(
                [h.Class('flex min-w-0 items-center gap-1.5')],
                [
                  h.span([h.Class('truncate text-[13px] font-semibold')], [entry.name]),
                  open
                    ? h.span(
                        [
                          h.Class('shrink-0 text-warn'),
                          h.Title('Open action item: the incident it prevents is twice as likely'),
                          h.AriaLabel('Open action item'),
                        ],
                        [icon(h, TriangleAlert, 'size-3.5')],
                      )
                    : h.empty,
                ],
              ),
              owned
                ? h.span([h.Class('text-ok')], [icon(h, Check, 'size-4')])
                : badge(
                    {
                      variant: state === 'buy' ? 'default' : 'secondary',
                      className: cn(FIGURE, 'shrink-0'),
                    },
                    [`${compact(entry.cost)} ◆`],
                    h,
                  ),
            ],
          ),
          h.span(
            [h.Class('line-clamp-2 text-[11.5px] leading-snug text-muted-foreground')],
            [
              state === 'locked'
                ? h.span(
                    [h.Class('inline-flex items-center gap-1')],
                    [
                      icon(h, Lock, 'size-3'),
                      early
                        ? `Opens in ${ERAS[entry.era]?.name ?? ''}`
                        : `Needs ${missing.join(', ')}`,
                    ],
                  )
                : entry.blurb,
            ],
          ),
        ],
      ),
    ],
  )
}

export const researchPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  shell(
    'Research',
    [
      h.span(
        [h.Class(cn(FIGURE, 'flex items-baseline gap-1.5 text-[15px]'))],
        [
          compact(model.game.insight),
          h.span([h.Class('text-[11px] text-muted-foreground')], ['Insight ◆']),
        ],
      ),
    ],
    [
      h.div(
        [h.Class(`grid min-h-0 grid-cols-5 gap-3 px-5 pt-1 pb-5 ${SCROLL}`)],
        RESEARCH_TRACKS.map((track) => {
          const entries = researchList.filter((entry) => entry.track === track.key)
          return h.div(
            [h.Key(track.key), h.Class('flex flex-col gap-2')],
            [
              h.div(
                [h.Class('flex items-baseline justify-between pb-1')],
                [
                  h.span([h.Class(EYEBROW)], [track.label]),
                  h.span(
                    [h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))],
                    [
                      `${entries.filter((entry) => has(model.game, entry.id)).length} / ${entries.length}`,
                    ],
                  ),
                ],
              ),
              ...entries
                .toSorted((a, b) => a.era - b.era || a.cost - b.cost)
                .map((entry) => researchCard(model, entry, h)),
            ],
          )
        }),
      ),
    ],
    'max-w-[1240px]',
    h,
  )

/* ---------- how to play ---------- */

const STEPS: ReadonlyArray<readonly [string, string]> = [
  ['Wire it', 'Drag from a Node’s blue output port to another Node. Click a link to cut it.'],
  [
    'Collect',
    'Revenue waits in Payments. Click it before the drawer fills. Stripe Billing collects for you.',
  ],
  ['Learn', 'Analytics samples linked Nodes. Sampled traffic becomes Insight ◆ for Research.'],
  [
    'Find the limit',
    'The pulsing outline marks the bottleneck. Its card says if it is out of CPU, credits, RAM, workers or connections.',
  ],
  ['Grow', 'Users grow while Apdex beats the Era target, and leave fast when it does not.'],
  [
    'Raise',
    'At the user target, take or decline the round. Pre-seed brings writes, logins and incidents.',
  ],
]

const KEYS: ReadonlyArray<readonly [string, string]> = [
  ['1–4', 'Build group'],
  ['R', 'Research'],
  ['U', 'Resize selected'],
  ['Z', 'Undo'],
  ['Del', 'Sell selected'],
  ['C', 'Collect'],
  ['S', 'Speed'],
  ['Space', 'Pause'],
  ['`', 'Playtest panel'],
  ['Esc', 'Cancel'],
]

export const helpPanel = (h: HtmlBuilder<Message>): Html =>
  shell(
    'How to play',
    [],
    [
      h.div(
        [h.Class(`grid min-h-0 grid-cols-[minmax(0,1fr)_230px] gap-4 px-5 pt-1 pb-5 ${SCROLL}`)],
        [
          h.ol(
            [h.Class('grid grid-cols-2 gap-2')],
            STEPS.map(([title, body], index) =>
              h.li(
                [
                  h.Key(title),
                  h.Class(
                    'flex flex-col gap-1.5 rounded-xl bg-nested p-4 shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
                  ),
                ],
                [
                  h.span(
                    [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
                    [String(index + 1).padStart(2, '0')],
                  ),
                  h.span([h.Class('text-[15px] font-semibold')], [title]),
                  h.span([h.Class('text-[13px] leading-relaxed text-muted-foreground')], [body]),
                ],
              ),
            ),
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Keys']),
              h.div(
                [h.Class(NESTED)],
                KEYS.map(([key, action]) =>
                  h.div(
                    [
                      h.Key(key),
                      h.Class('flex items-center justify-between gap-2 px-3 py-1.5 text-[12.5px]'),
                    ],
                    [h.span([h.Class('text-muted-foreground')], [action]), Kbd({}, [key], h)],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      footer([primaryButton('Start building', Message.PanelClosed(), h)], h),
    ],
    'max-w-[980px]',
    h,
  )

/* ---------- funding ---------- */

export const offerPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const deal = offer(model.game)
  if (!deal) return h.empty
  return shell(
    `${deal.era.name} round`,
    [],
    [
      h.div(
        [h.Class('grid grid-cols-2 gap-3 px-5 pt-1 pb-5')],
        [
          h.div(
            [h.Class('flex flex-col gap-3 rounded-xl bg-raised p-4 shadow-raised')],
            [
              h.span([h.Class('text-[15px] font-semibold')], ['Raise']),
              h.div(
                [h.Class('flex flex-1 flex-col gap-0.5 text-[13px] text-muted-foreground')],
                [
                  h.span([], [`+${money(deal.grant)} Cash`]),
                  h.span(
                    [],
                    [
                      `Equity ${Math.round(model.game.equity * 100)}% → ${Math.round(model.game.equity * (1 - deal.dilution) * 100)}%`,
                    ],
                  ),
                  h.span([], ['Full growth']),
                ],
              ),
              primaryButton('Raise', Message.RoundRaised(), h),
            ],
          ),
          h.div(
            [
              h.Class(
                'flex flex-col gap-3 rounded-xl bg-nested p-4 shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
              ),
            ],
            [
              h.span([h.Class('text-[15px] font-semibold')], ['Decline']),
              h.div(
                [h.Class('flex flex-1 flex-col gap-0.5 text-[13px] text-muted-foreground')],
                [
                  h.span([], ['No Cash']),
                  h.span([], [`Equity stays ${Math.round(model.game.equity * 100)}%`]),
                  h.span([], ['Growth × 0.7']),
                ],
              ),
              secondaryButton('Decline', Message.RoundDeclined(), h),
            ],
          ),
        ],
      ),
    ],
    'max-w-[620px]',
    h,
  )
}

export const eraPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const era = eraOf(model.game)
  return shell(
    era.name,
    [],
    [
      h.div(
        [h.Class('stagger flex flex-col gap-4 px-5 pt-1 pb-5')],
        [
          h.span(
            [h.Class('text-[26px] font-semibold leading-tight tracking-[-0.035em]')],
            [era.question],
          ),
          h.p([h.Class('text-[14px] leading-relaxed text-muted-foreground')], [era.arrivals]),
          stats(
            'grid-cols-3',
            [
              stat(
                'Next round',
                Number.isFinite(era.raiseAt) ? `${compact(era.raiseAt)} users` : '—',
                h,
              ),
              stat('Apdex target', era.apdexTarget.toFixed(2), h),
              stat('Prices', `×${era.costIndex}`, h),
            ],
            h,
          ),
        ],
      ),
      footer([primaryButton('Continue', Message.PanelClosed(), h)], h),
    ],
    'max-w-[620px]',
    h,
  )
}

export const endPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  shell(
    'End of the slice',
    [],
    [
      h.div(
        [h.Class('flex flex-col items-center gap-5 px-8 pt-4 pb-8')],
        [
          h.img([h.Src('/art/hero.svg'), h.Alt(''), h.Class('w-full max-w-[520px]')]),
          h.span([h.Class('text-[30px] font-semibold tracking-[-0.035em]')], ['Seed reached.']),
          stats(
            'max-w-[640px] grid-cols-4',
            [
              stat('Time', clock(model.game.time), h),
              stat('Users', compact(model.game.users), h),
              stat('Earned', money(model.game.earned), h),
              stat('Equity', `${Math.round(model.game.equity * 100)}%`, h),
            ],
            h,
          ),
          h.div(
            [h.Class('flex gap-2')],
            [
              primaryButton('Keep playing', Message.PanelClosed(), h),
              secondaryButton('Export playtest log', Message.LogExported(), h, Download),
            ],
          ),
        ],
      ),
    ],
    'max-w-[760px]',
    h,
  )

/* ---------- playtest panel ---------- */

export const devPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  shell(
    'Playtest',
    [],
    [
      h.div(
        [h.Class('flex flex-col gap-5 px-5 pt-1 pb-5')],
        [
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Speed']),
              h.div(
                [h.Class('flex gap-2')],
                SPEEDS.map((speed) =>
                  button(
                    {
                      onClick: Message.SpeedChosen({ speed }),
                      variant: model.speed === speed ? 'default' : 'outline',
                      size: 'lg',
                      className: cn(FIGURE, 'w-16'),
                      attributes: [h.Key(String(speed))],
                    },
                    `${speed}×`,
                    h,
                  ),
                ),
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Skip ahead']),
              h.div(
                [h.Class('flex flex-wrap gap-2')],
                [
                  model.game.stage === 0
                    ? secondaryButton('Skip to Pre-seed', Message.CheatPreseed(), h)
                    : h.empty,
                  secondaryButton('+$1,000', Message.CheatCash(), h),
                  secondaryButton('+100 Insight', Message.CheatInsight(), h),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Start an incident']),
              h.div(
                [h.Class('flex flex-wrap gap-2')],
                INCIDENT_IDS.map((kind) =>
                  secondaryButton(INCIDENTS[kind].name, Message.IncidentForced({ kind }), h),
                ),
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Log']),
              h.div(
                [h.Class('flex flex-wrap gap-2')],
                [
                  secondaryButton('Export playtest log', Message.LogExported(), h, Download),
                  secondaryButton('Clear log', Message.LogCleared(), h, Trash2),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
    'max-w-[640px]',
    h,
  )
