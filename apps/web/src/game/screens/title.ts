import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { foot, frame } from '@/components/game/frame.ts'
import { miniStat } from '@/components/game/panel.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { clock } from '@/game/simulation.ts'
import { diagram } from '@/components/game/canvas.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Title screen: the first thing a player sees, and the only place Quorum
   asks for a decision before it starts.
   ========================================================================== */

type Action = Readonly<{
  id: string
  mark: string
  label: string
  hint: string
  message: Message
  primary: boolean
}>

const actions: ReadonlyArray<Action> = [
  {
    id: 'play',
    mark: '▶',
    label: 'Continue · 1 · The Blog',
    hint: 'Scenario 1 of 6 · 15 min · start here',
    message: Message.WentTo({ route: 'briefing' }),
    primary: true,
  },
  {
    id: 'create',
    mark: '+',
    label: 'Create a room',
    hint: 'Pick a Scenario, a Role and a length. Hand out the code.',
    message: Message.WentTo({ route: 'create' }),
    primary: false,
  },
  {
    id: 'join',
    mark: '⌨',
    label: 'Join a room',
    hint: 'Enter a four-character code.',
    message: Message.WentTo({ route: 'join' }),
    primary: false,
  },
  {
    id: 'howto',
    mark: '?',
    label: 'How a run plays',
    hint: 'The loop, the economy, and the four scores.',
    message: Message.WentTo({ route: 'howto' }),
    primary: false,
  },
]

const actionRow = (action: Action, h: HtmlBuilder<Message>): Html =>
  h.button(
    [
      h.Key(action.id),
      h.Type('button'),
      h.OnClick(action.message),
      h.Class(
        `grid grid-cols-[28px_1fr_auto] items-center gap-3 border px-3.5 py-3 text-left transition-all hover:translate-x-0.5 ${
          action.primary
            ? 'border-primary-strong bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border-border bg-card hover:border-primary-strong hover:bg-primary/8'
        }`,
      ),
    ],
    [
      h.span(
        [
          h.Class(
            `grid size-7 place-items-center font-mono text-[13px] ${
              action.primary
                ? 'bg-white/40 text-primary-foreground'
                : 'bg-muted text-primary-strong'
            }`,
          ),
        ],
        [action.mark],
      ),
      h.span(
        [],
        [
          h.span([h.Class('block text-[15px] font-semibold tracking-[-0.01em]')], [action.label]),
          h.span(
            [
              h.Class(
                `mt-0.5 block text-[12px] ${
                  action.primary ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`,
              ),
            ],
            [action.hint],
          ),
        ],
      ),
      h.span([h.Class('font-mono text-[15px] opacity-70')], ['→']),
    ],
  )

export const titleScreen = (model: Model, h: HtmlBuilder<Message>): Html =>
  frame(
    'title',
    [
      h.div(
        [h.Class('grid min-h-0 grid-cols-[1fr_1fr] items-center gap-12 px-12 py-10')],
        [
          h.div(
            [h.Class('flex flex-col')],
            [
              h.span([h.Class(EYEBROW)], ['A learning game about system design']),
              h.h1(
                [h.Class('mt-3 text-[76px] leading-[0.94] font-bold tracking-[-0.045em]')],
                ['Quorum'],
              ),
              h.p(
                [h.Class('mt-4 max-w-[44ch] text-[15px] text-muted-foreground')],
                [
                  'Assemble an architecture from a fixed catalog. Run it for one simulated month. Get scored on what it did.',
                ],
              ),
              h.div(
                [h.Class('mt-7 flex max-w-[560px] flex-col gap-2')],
                actions.map((action) => actionRow(action, h)),
              ),
              h.div(
                [h.Class('mt-6 flex flex-col gap-1.5 text-[12px] text-muted-foreground')],
                [
                  h.span([], ['No account. A session lives 15 to 30 minutes, then it is gone.']),
                  h.span([], ['Same Scenario, same failures. Every run is repeatable.']),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col')],
            [
              h.div(
                [h.Class('relative h-[452px] w-full border border-border bg-canvas')],
                [diagram('hero', h)],
              ),
              miniStat(
                [
                  { label: 'Capital', value: '$8,420', note: 'held' },
                  { label: 'Burn', value: '$1,730', note: 'per month' },
                  { label: 'p95', value: '142 ms', note: 'this week' },
                  { label: 'Errors', value: '0.9%', note: 'sampled' },
                ],
                h,
              ),
            ],
          ),
        ],
      ),
      foot(
        {
          hint: 'The diagram is the input. The ledger is the truth. Every choice costs something.',
          actions: [
            h.span(
              [h.Class('font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground')],
              [`Session ${clock(model.sessionSeconds)}`],
            ),
            badge({ variant: 'secondary' }, ['Single-player first'], h),
          ],
        },
        h,
      ),
    ],
    h,
  )
