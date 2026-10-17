import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { inputOtp } from '@/components/ui/input-otp'
import { foot, frame, head } from '@/components/game/frame.ts'
import { card, cardBody, cardHead, noteList } from '@/components/game/panel.ts'
import { roomRow } from '@/components/game/seats.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Join a room. Four characters, no account, no email. The code is the whole
   identity, and a wrong code has to say so without shouting.
   ========================================================================== */

const CHECK_HINT: Record<Model['join']['check'], string> = {
  idle: 'Try the demo code BLOG.',
  short: 'Four characters, in any order.',
  unknown: 'That code does not match a live room.',
  found: 'Looks good. Join when you are ready.',
}

const recent: ReadonlyArray<
  Readonly<{ code: string; mark: string; detail: string; action: string }>
> = [
  { code: 'BLOG', mark: 'BL', detail: 'The Blog · Edge Lead · 14 min left', action: 'Rejoin' },
  { code: 'RAID', mark: 'RA', detail: 'Incident: 3AM · Data Lead · finished', action: 'Review' },
]

export const joinRoomScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const { check, code } = model.join
  const invalid = check === 'unknown'

  return frame(
    'flow',
    [
      head(
        {
          back: Message.WentTo({ route: 'menu' }),
          backLabel: 'Menu',
          title: 'Join a room',
          hint: 'Four characters',
          right: [],
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
                      h.span([h.Class(EYEBROW)], ['Have a code?']),
                      h.h2([h.Class('mt-2 text-[26px]')], ['Enter the room code']),
                      h.p(
                        [h.Class('mt-2 max-w-[56ch] text-[15px] text-muted-foreground')],
                        ['Four characters. The room owner reads them out, or sends the link.'],
                      ),
                    ],
                  ),
                  h.div(
                    [h.Class('flex flex-col gap-3')],
                    [
                      inputOtp(
                        {
                          length: 4,
                          value: code,
                          alphabet: 'alphanumeric',
                          isInvalid: invalid,
                          autoFocus: true,
                          className: 'gap-2.5',
                          onInput: (value) => Message.CodeChanged({ code: value }),
                        },
                        h,
                      ),
                      h.div(
                        [h.Class('flex items-center gap-3')],
                        [
                          button(
                            {
                              isDisabled: check !== 'found',
                              onClick: Message.JoinSubmitted(),
                            },
                            'Join room',
                            h,
                          ),
                          button(
                            {
                              variant: 'outline',
                              onClick: Message.CodeChanged({ code: 'BLOG' }),
                            },
                            'Paste a link',
                            h,
                          ),
                          h.span(
                            [
                              h.Class(
                                `text-[12px] ${invalid ? 'text-danger' : 'text-muted-foreground'}`,
                              ),
                            ],
                            [invalid ? `No room with the code ${code}.` : CHECK_HINT[check]],
                          ),
                        ],
                      ),
                    ],
                  ),
                  check === 'found'
                    ? card(
                        [
                          h.div(
                            [h.Class('flex items-center justify-between gap-4 px-4 py-4')],
                            [
                              h.div(
                                [],
                                [
                                  h.span([h.Class(EYEBROW)], ['Room found']),
                                  h.div(
                                    [h.Class('mt-1 text-[17px] font-semibold')],
                                    ['The Blog — the loop itself'],
                                  ),
                                  h.div(
                                    [h.Class('text-[12px] text-muted-foreground')],
                                    ['Host wears Edge Lead · 1 open seat · 15 min'],
                                  ),
                                ],
                              ),
                              badge({ variant: 'outline' }, ['Open'], h),
                            ],
                          ),
                        ],
                        h,
                        'bg-muted/50',
                      )
                    : h.empty,
                ],
              ),
              h.div(
                [h.Class('flex flex-col gap-3')],
                [
                  card(
                    [
                      cardHead('Recent rooms', badge({ variant: 'ghost' }, ['This browser'], h), h),
                      cardBody(
                        recent.map((entry) => roomRow(entry, h)),
                        h,
                      ),
                    ],
                    h,
                  ),
                  card(
                    [
                      cardHead(
                        'Nothing to install',
                        badge({ variant: 'ghost' }, ['Short sessions'], h),
                        h,
                      ),
                      cardBody(
                        [
                          noteList(
                            [
                              'Sessions are 15 to 30 minutes, so there is no password to forget and no history to manage.',
                              'Close the tab and the session is gone. The code is the whole identity.',
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
          hint: 'A code joins one Run: same Scenario, same failures, one shared Capital.',
          actions: [
            button(
              { variant: 'ghost', onClick: Message.WentTo({ route: 'menu' }) },
              'Back to menu',
              h,
            ),
            button(
              { variant: 'outline', onClick: Message.WentTo({ route: 'create' }) },
              'Create instead',
              h,
            ),
          ],
        },
        h,
      ),
    ],
    h,
  )
}
