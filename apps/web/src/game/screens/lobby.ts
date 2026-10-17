import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { foot, frame, head } from '@/components/game/frame.ts'
import { card, cardBody, cardHead, kv, numbered } from '@/components/game/panel.ts'
import { seatList, type Seat } from '@/components/game/seats.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { roles, scenarioById } from '@/game/content.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Lobby. One code, four seats, one shared Capital. The screen exists because
   sessions are short: the code is the invite and the room is the run.
   ========================================================================== */

export const lobbyScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const scenario = scenarioById(model.room.scenarioId)
  const role = roles.find((entry) => entry.key === model.room.role) ?? roles[0]
  const seats: ReadonlyArray<Seat> = [
    {
      id: 'you',
      mark: 'EL',
      name: `You · ${role?.name ?? 'Edge Lead'}`,
      detail: 'Ready · this browser',
      filled: true,
    },
    {
      id: 'open-1',
      mark: '+',
      name: 'Open seat',
      detail: 'Anyone with the code takes Data Lead or Platform Lead',
      filled: false,
    },
    {
      id: 'open-2',
      mark: '+',
      name: 'Open seat',
      detail: 'Spectators watch the Ledger, they do not place Nodes',
      filled: false,
    },
  ]

  return frame(
    'flow',
    [
      head(
        {
          back: Message.WentTo({ route: 'menu' }),
          backLabel: 'Leave',
          title: 'Room',
          hint: model.room.code,
          right: [badge({ variant: 'outline' }, ['Waiting'], h)],
        },
        h,
      ),
      h.div(
        [h.Class('flex min-h-0 flex-col overflow-auto [scrollbar-width:thin] px-8 py-7')],
        [
          h.div(
            [
              h.Class(
                'mx-auto my-auto grid w-full max-w-[1160px] grid-cols-[1fr_420px] items-start gap-8',
              ),
            ],
            [
              h.div(
                [h.Class('flex flex-col gap-4')],
                [
                  h.div(
                    [],
                    [
                      h.span([h.Class(EYEBROW)], ['Room code']),
                      h.div(
                        [h.Class('mt-1 flex items-center gap-4')],
                        [
                          h.span(
                            [h.Class('font-mono text-[64px] leading-none tracking-[0.08em]')],
                            [model.room.code],
                          ),
                          h.div(
                            [h.Class('flex flex-col gap-1.5')],
                            [
                              button(
                                {
                                  variant: 'outline',
                                  onClick: Message.CopyRequested({
                                    text: model.room.code,
                                    label: 'Room code',
                                  }),
                                },
                                'Copy code',
                                h,
                              ),
                              button(
                                {
                                  variant: 'ghost',
                                  onClick: Message.CopyRequested({
                                    text: `http://localhost:5173/#/join`,
                                    label: 'Invite link',
                                  }),
                                },
                                'Copy invite link',
                                h,
                              ),
                            ],
                          ),
                        ],
                      ),
                      h.p(
                        [h.Class('mt-2 text-[12px] text-muted-foreground')],
                        ['The code is the whole invite. No account, no email, nothing to accept.'],
                      ),
                    ],
                  ),
                  card(
                    [
                      cardHead(
                        'Seats',
                        badge({ variant: 'ghost' }, [`1 of ${model.room.seats} filled`], h),
                        h,
                      ),
                      cardBody([seatList(seats, h)], h),
                    ],
                    h,
                  ),
                ],
              ),
              h.div(
                [h.Class('flex flex-col gap-3')],
                [
                  card(
                    [
                      cardHead(
                        'This room plays',
                        badge({ variant: 'outline' }, [`Scenario ${scenario.index}`], h),
                        h,
                      ),
                      cardBody(
                        [
                          h.div([h.Class('text-[17px] font-semibold')], [scenario.teaches]),
                          h.p(
                            [h.Class('mt-1 text-[12px] leading-relaxed text-muted-foreground')],
                            [scenario.brief],
                          ),
                          h.div(
                            [h.Class('mt-3')],
                            [
                              kv(
                                [
                                  { label: 'Length', value: `${scenario.minutes} min · 900 Ticks` },
                                  { label: 'Starting Capital', value: '$12,000' },
                                  { label: 'Income', value: '$0.004 / request' },
                                  { label: 'Targets', value: 'p95 · 98% · $3k' },
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
                  card(
                    [
                      cardHead(
                        'What happens next',
                        badge({ variant: 'ghost' }, ['Three steps'], h),
                        h,
                      ),
                      cardBody(
                        [
                          numbered(
                            [
                              'You read the brief: demand curve, targets, scheduled failures.',
                              'The clock starts. Demand grows all month, so keep moving.',
                              'The month ends in a report card with the reasons behind each score.',
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
            ],
          ),
        ],
      ),
      foot(
        {
          hint: 'Everyone in the room shares one Capital. Roles change the objective, not the bank.',
          actions: [
            button(
              { variant: 'ghost', onClick: Message.WentTo({ route: 'menu' }) },
              'Leave room',
              h,
            ),
            button(
              { variant: 'outline', onClick: Message.WentTo({ route: 'briefing' }) },
              'Read the brief',
              h,
            ),
            button({ onClick: Message.RunStarted() }, 'Start the run', h),
          ],
        },
        h,
      ),
    ],
    h,
  )
}
