import type { Html, HtmlBuilder } from 'foldkit/html'
import { Check, Lock, X } from 'lucide'
import {
  COMPONENTS,
  RESEARCH,
  RESEARCH_TRACKS,
  researchList,
  type ResearchDef,
} from '@/game/engine/catalog.ts'
import { has, researchReady } from '@/game/engine/sim.ts'
import { clock, compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { EYEBROW, PANEL, SCROLL, mark } from './bits.ts'

/* ==========================================================================
   The full panels over the board: Research, How to play, and the IPO.
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

/* ---------- research ---------- */

const researchCard = (model: Model, entry: ResearchDef, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const owned = has(game, entry.id)
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
        `group grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 border p-2.5 text-left transition-colors ${
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
        entry.figure ? COMPONENTS[entry.figure].code.toUpperCase() : entry.mark,
        `size-11 text-[12px] ${entry.figure ? '' : 'lowercase'} ${state === 'locked' ? 'opacity-40' : ''}`,
        h,
      ),
      h.div(
        [h.Class('flex min-w-0 flex-col gap-0.5')],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-2')],
            [
              h.span([h.Class('truncate text-[13px] font-semibold')], [entry.name]),
              state === 'owned'
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
                    [icon(h, Lock, 'size-3'), `Needs ${missing.join(', ')}`],
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
        [h.Class(`grid min-h-0 grid-cols-4 gap-4 p-5 ${SCROLL}`)],
        RESEARCH_TRACKS.map((track) =>
          h.div(
            [h.Key(track.key), h.Class('flex flex-col gap-2')],
            [
              h.div(
                [h.Class('flex items-baseline justify-between pb-1')],
                [
                  h.span([h.Class(EYEBROW)], [track.label]),
                  h.span(
                    [h.Class('font-mono text-[10px] text-muted-foreground')],
                    [
                      `${researchList.filter((entry) => entry.track === track.key && has(model.game, entry.id)).length} / ${researchList.filter((entry) => entry.track === track.key).length}`,
                    ],
                  ),
                ],
              ),
              ...researchList
                .filter((entry) => entry.track === track.key)
                .toSorted((a, b) => a.cost - b.cost)
                .map((entry) => researchCard(model, entry, h)),
            ],
          ),
        ),
      ),
    ],
    'max-w-[1180px]',
    h,
  )

/* ---------- how to play ---------- */

const STEPS: ReadonlyArray<readonly [string, string]> = [
  [
    'Wire it',
    'Drag from a Node’s blue output port to another Node. Requests flow left to right. Click a link to cut it.',
  ],
  [
    'Collect',
    'Revenue piles up in Payments. Click it before the drawer fills. Stripe Billing collects for you.',
  ],
  [
    'Learn',
    'Link any Node into Analytics. Sampled traffic becomes Insight ◆. Spend it in Research on languages, frameworks and infrastructure.',
  ],
  [
    'Scale',
    'A Node past its capacity drops requests and slows everything behind it. Upgrade it, or add another behind a Load Balancer.',
  ],
  [
    'Grow',
    'Users grow while you answer at least 90% of them quickly. Slow pages cost revenue, and failed requests cost users.',
  ],
  [
    'Raise',
    'Reach the user target to raise the next round. Each round brings new kinds of traffic. Take the company public.',
  ],
]

const KEYS: ReadonlyArray<readonly [string, string]> = [
  ['1–5', 'Build group'],
  ['R', 'Research'],
  ['U', 'Upgrade selected'],
  ['Del', 'Sell selected'],
  ['C', 'Collect'],
  ['Space', 'Pause'],
  ['F', 'Fullscreen'],
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
        [
          h.button(
            [
              h.Type('button'),
              h.OnClick(Message.PanelClosed()),
              h.Class(
                'h-9 border border-primary-strong bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/85',
              ),
            ],
            ['Start building'],
          ),
        ],
      ),
    ],
    'max-w-[980px]',
    h,
  )

/* ---------- IPO ---------- */

export const ipoPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  shell(
    'Public',
    [],
    [
      h.div(
        [h.Class('flex flex-col items-center gap-5 px-8 pt-4 pb-8')],
        [
          h.img([h.Src('/art/hero.svg'), h.Alt(''), h.Class('w-full max-w-[640px]')]),
          h.span([h.Class('text-[34px] font-semibold tracking-[-0.03em]')], ['The bell rings.']),
          h.div(
            [h.Class('grid w-full max-w-[560px] grid-cols-3 border border-border')],
            [
              ['Time', clock(model.game.time)],
              ['Users', compact(model.game.users)],
              ['Earned', money(model.game.earned)],
            ].map(([name, value]) =>
              h.div(
                [
                  h.Key(name ?? ''),
                  h.Class('flex flex-col gap-1 border-r border-border p-4 last:border-r-0'),
                ],
                [
                  h.span([h.Class(EYEBROW)], [name ?? '']),
                  h.span([h.Class('font-mono text-[20px]')], [value ?? '']),
                ],
              ),
            ),
          ),
          h.div(
            [h.Class('flex gap-2')],
            [
              h.button(
                [
                  h.Type('button'),
                  h.OnClick(Message.PanelClosed()),
                  h.Class(
                    'h-10 border border-primary-strong bg-primary px-5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/85',
                  ),
                ],
                ['Keep scaling'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.OnClick(Message.NewCompanyStarted()),
                  h.Class(
                    'h-10 border border-border bg-card px-5 text-[13px] font-medium hover:bg-muted',
                  ),
                ],
                ['Found a new company'],
              ),
            ],
          ),
        ],
      ),
    ],
    'max-w-[760px]',
    h,
  )
