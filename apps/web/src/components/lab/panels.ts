import type { Html, HtmlBuilder } from 'foldkit/html'
import { Check, Download, Lock, Trash2, X } from 'lucide'
import { offer } from '@/game/engine/actions.ts'
import {
  ERAS,
  INCIDENTS,
  INCIDENT_IDS,
  RESEARCH,
  RESEARCH_TRACKS,
  researchList,
  type ResearchDef,
} from '@/game/engine/catalog.ts'
import { eraOf, has, researchReady } from '@/game/engine/lookups.ts'
import { clock, compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { SPEEDS } from '@/game/update.ts'
import { icon } from '@/lib/icons'
import { EYEBROW, PANEL, SCROLL, mark } from './bits.ts'

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
        'absolute inset-0 z-30 grid place-items-center bg-foreground/15 p-6 backdrop-blur-[2px] animate-in fade-in',
      ),
    ],
    [
      h.div(
        [h.Class(`flex max-h-full w-full flex-col ${width} ${PANEL}`)],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-4 border-b border-border px-5 py-3.5')],
            [
              h.span([h.Class('text-[17px] font-semibold tracking-[-0.02em]')], [title]),
              h.div(
                [h.Class('flex items-center gap-3')],
                [
                  ...right,
                  h.button(
                    [
                      h.Type('button'),
                      h.AriaLabel('Close (Esc)'),
                      h.OnClick(Message.PanelClosed()),
                      h.Class('grid size-8 place-items-center border border-border hover:bg-muted'),
                    ],
                    [icon(h, X, 'size-4')],
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
  h.button(
    [
      h.Type('button'),
      h.OnClick(message),
      h.Class(
        'h-10 border border-primary-strong bg-primary px-5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/85',
      ),
    ],
    [label],
  )

const secondaryButton = (
  label: string,
  message: Message,
  h: HtmlBuilder<Message>,
  glyph?: Parameters<typeof icon>[1],
) =>
  h.button(
    [
      h.Type('button'),
      h.OnClick(message),
      h.Class(
        'flex h-10 items-center gap-2 border border-border bg-card px-4 text-[13px] font-medium hover:bg-muted',
      ),
    ],
    [...(glyph ? [icon(h, glyph, 'size-4')] : []), label],
  )

const stat = (name: string, value: string, h: HtmlBuilder<Message>) =>
  h.div(
    [h.Key(name), h.Class('flex flex-col gap-1 border-r border-border p-4 last:border-r-0')],
    [h.span([h.Class(EYEBROW)], [name]), h.span([h.Class('font-mono text-[18px]')], [value])],
  )

/* ---------- research ---------- */

const researchCard = (model: Model, entry: ResearchDef, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const owned = has(game, entry.id)
  const early = entry.era > game.stage
  const ready = researchReady(game, entry.id)
  const affordable = game.insight >= entry.cost
  const state = owned ? 'owned' : !ready ? 'locked' : affordable ? 'buy' : 'saving'
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
        `group grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 border p-2.5 text-left transition-colors ${
          state === 'owned'
            ? 'border-ok/40 bg-ok/6'
            : state === 'buy'
              ? 'border-primary-strong bg-card hover:bg-primary/10'
              : state === 'saving'
                ? 'border-border bg-card'
                : 'border-dashed border-border bg-card/60'
        }`,
      ),
    ],
    [
      mark(
        entry.mark,
        `size-10 text-[11px] lowercase ${state === 'locked' ? 'opacity-40' : ''}`,
        h,
      ),
      h.div(
        [h.Class('flex min-w-0 flex-col gap-0.5')],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-2')],
            [
              h.span([h.Class('truncate text-[13px] font-semibold')], [entry.name]),
              owned
                ? h.span([h.Class('text-ok')], [icon(h, Check, 'size-4')])
                : h.span(
                    [
                      h.Class(
                        `shrink-0 font-mono text-[11px] ${state === 'buy' ? 'text-primary-strong' : 'text-muted-foreground'}`,
                      ),
                    ],
                    [`${compact(entry.cost)} ◆`],
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
        [h.Class('flex items-baseline gap-1.5 font-mono text-[15px] tabular-nums')],
        [
          compact(model.game.insight),
          h.span([h.Class('text-[11px] text-muted-foreground')], ['Insight ◆']),
        ],
      ),
    ],
    [
      h.div(
        [h.Class(`grid min-h-0 grid-cols-5 gap-3 p-5 ${SCROLL}`)],
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
                    [h.Class('font-mono text-[10px] text-muted-foreground')],
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
        [h.Class(`grid min-h-0 grid-cols-[minmax(0,1fr)_220px] ${SCROLL}`)],
        [
          h.ol(
            [h.Class('grid grid-cols-2 gap-px bg-border')],
            STEPS.map(([title, body], index) =>
              h.li(
                [h.Key(title), h.Class('flex flex-col gap-1.5 bg-card p-5')],
                [
                  h.span(
                    [h.Class('font-mono text-[11px] text-primary-strong')],
                    [String(index + 1).padStart(2, '0')],
                  ),
                  h.span([h.Class('text-[15px] font-semibold')], [title]),
                  h.span([h.Class('text-[13px] leading-relaxed text-muted-foreground')], [body]),
                ],
              ),
            ),
          ),
          h.div(
            [h.Class('flex flex-col gap-2 border-l border-border bg-secondary/40 p-5')],
            [
              h.span([h.Class(EYEBROW)], ['Keys']),
              ...KEYS.map(([key, action]) =>
                h.div(
                  [h.Key(key), h.Class('flex items-center justify-between gap-2 text-[12.5px]')],
                  [
                    h.span([h.Class('text-muted-foreground')], [action]),
                    h.span(
                      [
                        h.Class(
                          'border border-b-2 border-border bg-card px-1.5 font-mono text-[11px]',
                        ),
                      ],
                      [key],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('flex justify-end border-t border-border px-5 py-3')],
        [primaryButton('Start building', Message.PanelClosed(), h)],
      ),
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
        [h.Class('grid grid-cols-2 gap-px bg-border')],
        [
          h.div(
            [h.Class('flex flex-col gap-3 bg-card p-5')],
            [
              h.span([h.Class('text-[15px] font-semibold')], ['Raise']),
              h.div(
                [h.Class('flex flex-col text-[13px]')],
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
            [h.Class('flex flex-col gap-3 bg-card p-5')],
            [
              h.span([h.Class('text-[15px] font-semibold')], ['Decline']),
              h.div(
                [h.Class('flex flex-col text-[13px]')],
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
        [h.Class('flex flex-col gap-4 px-6 py-6')],
        [
          h.span(
            [h.Class('text-[26px] font-semibold leading-tight tracking-[-0.03em]')],
            [era.question],
          ),
          h.p([h.Class('text-[14px] leading-relaxed text-muted-foreground')], [era.arrivals]),
          h.div(
            [h.Class('grid grid-cols-3 border border-border')],
            [
              stat(
                'Next round',
                Number.isFinite(era.raiseAt) ? `${compact(era.raiseAt)} users` : '—',
                h,
              ),
              stat('Apdex target', era.apdexTarget.toFixed(2), h),
              stat('Prices', `×${era.costIndex}`, h),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('flex justify-end border-t border-border px-5 py-3')],
        [primaryButton('Continue', Message.PanelClosed(), h)],
      ),
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
          h.span([h.Class('text-[30px] font-semibold tracking-[-0.03em]')], ['Seed reached.']),
          h.div(
            [h.Class('grid w-full max-w-[640px] grid-cols-4 border border-border')],
            [
              stat('Time', clock(model.game.time), h),
              stat('Users', compact(model.game.users), h),
              stat('Earned', money(model.game.earned), h),
              stat('Equity', `${Math.round(model.game.equity * 100)}%`, h),
            ],
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
        [h.Class('flex flex-col gap-5 p-5')],
        [
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Speed']),
              h.div(
                [h.Class('flex gap-2')],
                SPEEDS.map((speed) =>
                  h.button(
                    [
                      h.Key(String(speed)),
                      h.Type('button'),
                      h.OnClick(Message.SpeedChosen({ speed })),
                      h.Class(
                        `h-9 w-16 border font-mono text-[13px] ${model.speed === speed ? 'border-primary-strong bg-primary/15 text-primary-strong' : 'border-border hover:bg-muted'}`,
                      ),
                    ],
                    [`${speed}×`],
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
