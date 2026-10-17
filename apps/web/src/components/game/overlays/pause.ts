import type { Html, HtmlBuilder } from 'foldkit/html'
import { button } from '@/components/ui/button'
import { overlay } from '@/components/game/frame.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { TICKS_IN_MONTH, clock } from '@/game/simulation.ts'

/* ==========================================================================
   The pause sheet. Every row is one decision, with the key that reaches it.
   ========================================================================== */

type Item = Readonly<{ mark: string; title: string; detail: string; key: string; message: Message }>

const items: ReadonlyArray<Item> = [
  {
    mark: '▶',
    title: 'Resume the run',
    detail: 'Back to the same Tick, same demand.',
    key: 'Esc',
    message: Message.OverlayClosed(),
  },
  {
    mark: '!',
    title: 'Inject a failure',
    detail: 'A replica dies for 12 Ticks and keeps billing. Practice runs do not score.',
    key: 'I',
    message: Message.FailureInjected(),
  },
  {
    mark: '⧉',
    title: 'Copy the invite link',
    detail: 'Anyone with it joins this exact Run.',
    key: 'C',
    message: Message.CopyRequested({
      text: 'http://localhost:5173/#/join',
      label: 'Invite link',
    }),
  },
  {
    mark: '⏹',
    title: 'End the month now',
    detail: 'Score what you have. The leftover Ticks are forfeited.',
    key: 'E',
    message: Message.MonthEnded(),
  },
  {
    mark: '⏏',
    title: 'Leave the run',
    detail: 'Back to the menu. The session is not saved.',
    key: 'Q',
    message: Message.WentTo({ route: 'menu' }),
  },
]

const itemRow = (entry: Item, h: HtmlBuilder<Message>): Html =>
  h.button(
    [
      h.Key(entry.title),
      h.Type('button'),
      h.OnClick(entry.message),
      h.Class(
        'grid grid-cols-[30px_1fr_auto] items-center gap-3 border border-transparent px-3 py-3 text-left transition-colors hover:border-border hover:bg-muted',
      ),
    ],
    [
      h.span([h.Class('font-mono text-[12px] text-muted-foreground')], [entry.mark]),
      h.span(
        [],
        [
          h.span([h.Class('block text-[13.5px] font-semibold')], [entry.title]),
          h.span([h.Class('block text-[12px] text-muted-foreground')], [entry.detail]),
        ],
      ),
      h.span(
        [
          h.Class(
            'border border-border border-b-2 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground',
          ),
        ],
        [entry.key],
      ),
    ],
  )

export const pauseOverlay = (model: Model, h: HtmlBuilder<Message>): Html =>
  overlay(
    {
      eyebrow: `Paused · Tick ${model.run.tick} of ${TICKS_IN_MONTH}`,
      title: 'The clock is stopped',
      description:
        'Nothing burns while you read. Capital is charged each Tick, so a pause is free and honest.',
      width: 'w-[560px]',
      body: [
        h.div(
          [h.Class('flex flex-col')],
          items.map((entry) => itemRow(entry, h)),
        ),
      ],
      footer: [
        h.span(
          [h.Class('text-[12px] text-muted-foreground')],
          [`Session ${clock(model.sessionSeconds)} · room ${model.room.code}`],
        ),
        button({ onClick: Message.OverlayClosed() }, 'Resume', h),
      ],
    },
    h,
  )
