import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { input } from '@/components/ui/input'
import { nativeSelect, nativeSelectOption } from '@/components/ui/native-select'
import { switch_ } from '@/components/ui/switch'
import { foot, frame, head } from '@/components/game/frame.ts'
import { card, cardBody, cardHead, kv, noteList } from '@/components/game/panel.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { roles, scenarioById, scenarios } from '@/game/content.ts'
import { clock } from '@/game/simulation.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Create a room. A room is one Run: a Scenario, a Role, a length, and a code
   you can hand out. Nothing here needs an account.
   ========================================================================== */

const LENGTHS: ReadonlyArray<Readonly<{ minutes: number; label: string }>> = [
  { minutes: 15, label: '15 min · gentle' },
  { minutes: 20, label: '20 min · standard' },
  { minutes: 30, label: '30 min · hard' },
]

export const createRoomScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const scenario = scenarioById(model.room.scenarioId)
  const role = roles.find((entry) => entry.key === model.room.role) ?? roles[0]

  return frame(
    'flow',
    [
      head(
        {
          back: Message.WentTo({ route: 'menu' }),
          backLabel: 'Menu',
          title: 'Create a room',
          hint: 'One room, one Run',
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
                [h.Class('flex flex-col gap-5')],
                [
                  h.div(
                    [],
                    [
                      h.span([h.Class(EYEBROW)], ['Step 1 of 2']),
                      h.h2([h.Class('mt-2 text-[26px]')], ['Set up the room']),
                      h.p(
                        [h.Class('mt-2 max-w-[56ch] text-[15px] text-muted-foreground')],
                        [
                          'A room holds one Run. You pick what it is, then hand the code to anyone who should be in it.',
                        ],
                      ),
                    ],
                  ),
                  input(
                    {
                      id: 'room-name',
                      label: 'Room name',
                      value: model.room.name,
                      placeholder: 'Give the room a name',
                      onInput: (value) => Message.RoomNameChanged({ name: value }),
                    },
                    h,
                  ),
                  nativeSelect(
                    {
                      id: 'room-scenario',
                      label: 'Scenario',
                      value: model.room.scenarioId,
                      onChange: (value) => Message.RoomScenarioChanged({ scenarioId: value }),
                      options: scenarios.map((entry) =>
                        nativeSelectOption(
                          {
                            value: entry.id,
                            label: `${entry.index} · ${entry.name} — ${entry.teaches}`,
                          },
                          h,
                        ),
                      ),
                    },
                    h,
                  ),
                  h.div(
                    [h.Class('flex flex-col gap-2')],
                    [
                      h.span([h.Class(EYEBROW)], ['Your Role']),
                      h.div(
                        [h.Class('grid grid-cols-3 gap-2')],
                        roles.map((entry) =>
                          h.button(
                            [
                              h.Key(entry.key),
                              h.Type('button'),
                              h.OnClick(Message.RoomRoleChosen({ role: entry.key })),
                              h.Class(
                                `flex flex-col gap-1 border px-3 py-3 text-left transition-colors ${
                                  model.room.role === entry.key
                                    ? 'border-primary-strong bg-primary/8 shadow-[inset_3px_0_0_var(--primary-strong)]'
                                    : 'border-border bg-card hover:border-primary-strong/50'
                                }`,
                              ),
                            ],
                            [
                              h.span([h.Class('text-[14px] font-semibold')], [entry.name]),
                              h.span([h.Class('text-[12px] text-muted-foreground')], [entry.scope]),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  h.div(
                    [h.Class('flex flex-col gap-2')],
                    [
                      h.span([h.Class(EYEBROW)], ['Length']),
                      h.div(
                        [h.Class('flex border border-border bg-muted p-0.5')],
                        LENGTHS.map((entry) =>
                          h.button(
                            [
                              h.Key(String(entry.minutes)),
                              h.Type('button'),
                              h.OnClick(Message.RoomLengthChosen({ minutes: entry.minutes })),
                              h.Class(
                                `flex-1 px-3 py-1.5 text-[12.5px] transition-colors ${
                                  model.room.minutes === entry.minutes
                                    ? 'bg-card text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`,
                              ),
                            ],
                            [entry.label],
                          ),
                        ),
                      ),
                    ],
                  ),
                  h.div(
                    [
                      h.Class(
                        'flex items-center justify-between gap-4 border border-border bg-card px-4 py-3',
                      ),
                    ],
                    [
                      h.div(
                        [],
                        [
                          h.div([h.Class('font-semibold')], ['Let others join with the code']),
                          h.div(
                            [h.Class('text-[12px] text-muted-foreground')],
                            ['Off means the room stays yours. You can share it later.'],
                          ),
                        ],
                      ),
                      switch_(
                        {
                          id: 'room-share',
                          isChecked: model.room.shared,
                          label: 'Share the room',
                          onToggle: () => Message.RoomShareToggled(),
                        },
                        h,
                      ),
                    ],
                  ),
                ],
              ),
              h.div(
                [h.Class('flex flex-col gap-3')],
                [
                  card(
                    [
                      cardHead(
                        'Room preview',
                        badge({ variant: 'outline' }, [model.room.code], h),
                        h,
                      ),
                      cardBody(
                        [
                          h.div(
                            [h.Class('flex items-start justify-between gap-3')],
                            [
                              h.div(
                                [],
                                [
                                  h.div(
                                    [h.Class('text-[17px] font-semibold')],
                                    [model.room.name === '' ? 'Untitled room' : model.room.name],
                                  ),
                                  h.div(
                                    [h.Class('text-[12px] text-muted-foreground')],
                                    [`Scenario ${scenario.index} · ${scenario.name}`],
                                  ),
                                ],
                              ),
                              badge({ variant: 'ghost' }, [`${model.room.minutes} min`], h),
                            ],
                          ),
                          h.div(
                            [h.Class('mt-3')],
                            [
                              kv(
                                [
                                  { label: 'Role', value: role?.name ?? 'Edge Lead' },
                                  { label: 'Seats', value: `${model.room.seats} total` },
                                  { label: 'Scenario length', value: '900 Ticks' },
                                  { label: 'Saves after close', value: 'No' },
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
                      cardHead('What the code does', badge({ variant: 'ghost' }, ['Invite'], h), h),
                      cardBody(
                        [
                          noteList(
                            [
                              'Anyone with the code joins this exact Run: the same Scenario, the same failures, the same Capital.',
                              'A run is short. If a session drops, the code lets you rejoin from the start.',
                              'Roles are hats over one design, so a second player takes a Role, not a second Capital.',
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
          hint: 'Rooms exist because sessions are short. Nothing is stored once the tab closes.',
          actions: [
            button({ variant: 'ghost', onClick: Message.WentTo({ route: 'menu' }) }, 'Cancel', h),
            button({ onClick: Message.RoomCreated({ code: model.room.code }) }, 'Create room', h),
          ],
        },
        h,
      ),
    ],
    h,
  )
}
