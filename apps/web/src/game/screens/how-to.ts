import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { foot, frame, head } from '@/components/game/frame.ts'
import {
  card,
  cardBody,
  cardHead,
  kv,
  noteList,
  note,
  sectionTitle,
} from '@/components/game/panel.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { roles } from '@/game/content.ts'
import { clock } from '@/game/simulation.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   How a run plays. This is the screen a player (or a room full of them) reads
   before the first Tick, and the one that has to carry the whole idea.
   ========================================================================== */

type Step = Readonly<{ index: string; name: string; description: string }>

const steps: ReadonlyArray<Step> = [
  {
    index: '01',
    name: 'Design',
    description:
      'Drag Components from the catalog onto the canvas and connect them. Placing a Node spends Capital.',
  },
  {
    index: '02',
    name: 'Deploy',
    description:
      'Press run. The cluster becomes real Kubernetes: pods, rollout, probes, endpoints.',
  },
  {
    index: '03',
    name: 'Observe',
    description:
      'The metrics table and the graphs show latency, throughput, errors and money as they move.',
  },
  {
    index: '04',
    name: 'Adapt',
    description: 'Add capacity, move a cache, kill a Node. Every Node burns money while it exists.',
  },
  {
    index: '05',
    name: 'Score',
    description: 'The month ends in a report card: Reliability, Performance, Simplicity, Money.',
  },
]

const axes: ReadonlyArray<Readonly<{ name: string; blurb: string }>> = [
  { name: 'Reliability', blurb: 'requests served, and survival through failures' },
  { name: 'Performance', blurb: 'latency against the Scenario target' },
  { name: 'Simplicity', blurb: 'unnecessary Nodes and needless links' },
  { name: 'Money', blurb: 'Capital earned and kept through the month' },
]

const stepCard = (step: Step, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Key(step.index),
      h.Class('flex flex-col gap-1.5 border border-l-0 border-border bg-card p-4 first:border-l'),
    ],
    [
      h.span([h.Class('font-mono text-[11px] tracking-[0.1em] text-primary-strong')], [step.index]),
      h.span([h.Class('text-[15px] font-semibold')], [step.name]),
      h.span([h.Class('text-[12px] leading-relaxed text-muted-foreground')], [step.description]),
    ],
  )

export const howToScreen = (model: Model, h: HtmlBuilder<Message>): Html =>
  frame(
    'flow',
    [
      head(
        {
          back: Message.WentTo({ route: 'menu' }),
          backLabel: 'Menu',
          title: 'How a run plays',
          hint: 'The loop',
          right: [
            h.span(
              [h.Class('font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground')],
              [`Session ${clock(model.sessionSeconds)}`],
            ),
          ],
        },
        h,
      ),
      h.div(
        [h.Class('min-h-0 overflow-auto [scrollbar-width:thin] px-8 py-7')],
        [
          h.div(
            [h.Class('mx-auto flex w-full max-w-[1160px] flex-col gap-6')],
            [
              h.div(
                [h.Class('grid grid-cols-[1fr_380px] items-start gap-8')],
                [
                  sectionTitle(
                    'The loop',
                    'Five steps, one month',
                    'A run is a single simulated month at The Blog. The clock moves while you work, so a fix that lands late costs money.',
                    h,
                  ),
                  card(
                    [
                      cardHead('Session shape', badge({ variant: 'ghost' }, ['One sitting'], h), h),
                      cardBody(
                        [
                          kv(
                            [
                              { label: 'One run', value: '900 Ticks' },
                              { label: 'Wall clock', value: '15–30 min' },
                              { label: 'Accounts', value: 'None' },
                              { label: 'Saved after close', value: 'Nothing' },
                            ],
                            h,
                          ),
                        ],
                        h,
                      ),
                    ],
                    h,
                    'bg-muted/50',
                  ),
                ],
              ),
              h.div(
                [h.Class('grid grid-cols-5')],
                steps.map((step) => stepCard(step, h)),
              ),
              h.div(
                [h.Class('grid grid-cols-[1.05fr_0.95fr] items-start gap-6')],
                [
                  card(
                    [
                      cardHead(
                        'The economy',
                        badge({ variant: 'outline' }, ['Three numbers'], h),
                        h,
                      ),
                      cardBody(
                        [
                          h.div(
                            [h.Class('grid grid-cols-2 gap-4')],
                            [
                              kv(
                                [
                                  { label: 'Capital', value: 'the money you hold' },
                                  { label: 'Burn', value: 'monthly cost per Node' },
                                  { label: 'Income', value: 'earned per request' },
                                ],
                                h,
                              ),
                              noteList(
                                [
                                  'Placing a Node spends Capital. Removing one returns nothing, but it stops the Burn.',
                                  'Demand grows all month, so Income grows with it, and so does the cost of keeping up.',
                                  'When Capital runs out, the design sheds Nodes it cannot pay for, one at a time.',
                                ],
                                h,
                              ),
                            ],
                          ),
                        ],
                        h,
                      ),
                    ],
                    h,
                  ),
                  h.div(
                    [h.Class('flex flex-col gap-3')],
                    [
                      card(
                        [
                          cardHead(
                            'What you are scored on',
                            badge({ variant: 'outline' }, ['Four axes'], h),
                            h,
                          ),
                          cardBody(
                            [
                              h.div(
                                [h.Class('flex flex-col gap-2.5')],
                                axes.map((axis) =>
                                  h.div(
                                    [h.Key(axis.name), h.Class('flex items-center gap-2.5')],
                                    [
                                      badge({ variant: 'outline' }, [axis.name], h),
                                      h.span(
                                        [h.Class('text-[12px] text-muted-foreground')],
                                        [axis.blurb],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                            h,
                          ),
                        ],
                        h,
                      ),
                      card(
                        [
                          cardHead(
                            'Roles are hats',
                            badge({ variant: 'outline' }, ['One design'], h),
                            h,
                          ),
                          cardBody(
                            [
                              h.div(
                                [h.Class('flex flex-col gap-2')],
                                [
                                  ...roles.map((role) =>
                                    h.p(
                                      [
                                        h.Key(role.key),
                                        h.Class('text-[12px] text-muted-foreground'),
                                      ],
                                      [
                                        h.span(
                                          [h.Class('font-semibold text-foreground')],
                                          [`${role.name} — `],
                                        ),
                                        role.objective,
                                      ],
                                    ),
                                  ),
                                  note(
                                    'One Capital, three objectives. Change your hat and the same design scores differently.',
                                    h,
                                  ),
                                ],
                              ),
                            ],
                            h,
                          ),
                        ],
                        h,
                      ),
                    ],
                  ),
                ],
              ),
              card(
                [
                  h.div(
                    [h.Class('flex items-center justify-between gap-6 px-4 py-4')],
                    [
                      h.div(
                        [],
                        [
                          h.span([h.Class(EYEBROW)], ['Ready?']),
                          h.p(
                            [h.Class('mt-1 text-[14px]')],
                            ['Scenario 1, The Blog, teaches the loop in about fifteen minutes.'],
                          ),
                        ],
                      ),
                      h.div(
                        [h.Class('flex items-center gap-2')],
                        [
                          button(
                            { variant: 'outline', onClick: Message.WentTo({ route: 'scenarios' }) },
                            'See all Scenarios',
                            h,
                          ),
                          button(
                            { onClick: Message.WentTo({ route: 'briefing' }) },
                            'Start · The Blog',
                            h,
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
                h,
                'border-primary-strong/40 bg-primary/8',
              ),
            ],
          ),
        ],
      ),
      foot(
        {
          hint: 'Every choice costs something. There are no free wins.',
          actions: [],
          keys: ['Esc'],
        },
        h,
      ),
    ],
    h,
  )
