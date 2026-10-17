import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { Message } from '@/game/message.ts'

/* ==========================================================================
   Seats: who is in the room. A filled seat has a Role; an empty seat says
   what taking it would mean.
   ========================================================================== */

export type Seat = Readonly<{
  id: string
  mark: string
  name: string
  detail: string
  filled: boolean
}>

export const seatRow = (seat: Seat, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Key(seat.id),
      h.Class(
        `grid grid-cols-[34px_1fr_auto] items-center gap-3 border px-3 py-3 ${
          seat.filled ? 'border-border bg-card' : 'border-dashed border-border bg-transparent'
        }`,
      ),
    ],
    [
      h.span(
        [
          h.Class(
            `grid size-[34px] place-items-center font-mono text-[12px] ${
              seat.filled ? 'bg-primary/15 text-primary-strong' : 'bg-muted text-muted-foreground'
            }`,
          ),
        ],
        [seat.mark],
      ),
      h.span(
        [],
        [
          h.span([h.Class('block text-[14px] font-semibold')], [seat.name]),
          h.span([h.Class('block text-[12px] text-muted-foreground')], [seat.detail]),
        ],
      ),
      badge({ variant: seat.filled ? 'outline' : 'ghost' }, [seat.filled ? 'Ready' : 'Empty'], h),
    ],
  )

export const seatList = (seats: ReadonlyArray<Seat>, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex flex-col gap-2 px-4 py-4')],
    seats.map((seat) => seatRow(seat, h)),
  )

/** The compact row the Join screen lists recent rooms with. */
export const roomRow = (
  room: Readonly<{ code: string; mark: string; detail: string; action: string }>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(room.code),
      h.Class(
        'grid grid-cols-[34px_1fr_auto] items-center gap-3 border border-border bg-card px-3 py-2.5',
      ),
    ],
    [
      h.span(
        [
          h.Class(
            'grid size-[34px] place-items-center bg-primary/15 font-mono text-[12px] text-primary-strong',
          ),
        ],
        [room.mark],
      ),
      h.span(
        [],
        [
          h.span([h.Class('block text-[14px] font-semibold')], [room.code]),
          h.span([h.Class('block text-[12px] text-muted-foreground')], [room.detail]),
        ],
      ),
      h.span(
        [h.Class('flex')],
        [
          h.button(
            [
              h.Class(
                'border border-border bg-background px-2.5 py-1 text-[12px] transition-colors hover:bg-muted',
              ),
              h.Type('button'),
              h.OnClick(Message.RoomJoined({ code: room.code })),
            ],
            [room.action],
          ),
        ],
      ),
    ],
  )
