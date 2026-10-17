import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { overlay } from '@/components/game/frame.ts'
import { Message } from '@/game/message.ts'
import type { Model, TradeoffChoice } from '@/game/model.ts'

/* ==========================================================================
   The Tradeoff card. A card belongs to a configuration choice, not to a
   Component, so this one is reached from the catalog and from the inspector.
   ========================================================================== */

type Option = Readonly<{
  choice: TradeoffChoice
  name: string
  description: string
  facts: ReadonlyArray<Readonly<{ label: string; value: string; tone: string }>>
}>

const OPTIONS: ReadonlyArray<Option> = [
  {
    choice: 'cache-reads',
    name: 'Cache reads',
    description: 'Serve reads from memory. A write stays invisible until the TTL expires.',
    facts: [
      { label: 'p50 read', value: '4 ms', tone: 'text-ok' },
      { label: 'Stale reads', value: '1.1%', tone: 'text-danger' },
      { label: 'Burn', value: '+$90 / mo', tone: '' },
    ],
  },
  {
    choice: 'write-through',
    name: 'Write-through',
    description: 'Every write lands in both places, so a read never returns an old page.',
    facts: [
      { label: 'Stale reads', value: '0.0%', tone: 'text-ok' },
      { label: 'p50 write', value: '38 ms', tone: 'text-warn' },
      { label: 'Burn', value: '+$90 / mo', tone: '' },
    ],
  },
]

const optionCard = (option: Option, chosen: boolean, h: HtmlBuilder<Message>): Html =>
  h.button(
    [
      h.Key(option.choice),
      h.Type('button'),
      h.OnClick(Message.TradeoffChosen({ choice: option.choice })),
      h.Class(
        `flex flex-col gap-2.5 border p-4 text-left transition-colors ${
          chosen
            ? 'border-primary-strong bg-primary/8 shadow-[inset_0_0_0_1px_var(--primary-strong)]'
            : 'border-border bg-background hover:border-primary-strong/50'
        }`,
      ),
    ],
    [
      h.div(
        [h.Class('flex items-center justify-between gap-2')],
        [
          h.span(
            [h.Class('flex items-center gap-2 text-[14.5px] font-semibold')],
            [
              h.span(
                [h.Class('size-3.5 border border-input')],
                [chosen ? h.span([h.Class('block size-full bg-primary-strong')], []) : h.empty],
              ),
              option.name,
            ],
          ),
          chosen ? badge({ variant: 'outline' }, ['Selected'], h) : h.empty,
        ],
      ),
      h.p([h.Class('text-[12.5px] text-muted-foreground')], [option.description]),
      h.div(
        [
          h.Class(
            'mt-1 flex flex-col gap-1 border-t border-dashed border-border pt-2.5 font-mono text-[11px]',
          ),
        ],
        option.facts.map((fact) =>
          h.div(
            [h.Key(fact.label), h.Class('flex justify-between gap-3 text-muted-foreground')],
            [h.span([], [fact.label]), h.span([h.Class(fact.tone)], [fact.value])],
          ),
        ),
      ),
    ],
  )

export const tradeoffOverlay = (model: Model, h: HtmlBuilder<Message>): Html =>
  overlay(
    {
      eyebrow: 'Tradeoff card · Cache',
      title: 'Cache reads?',
      description:
        'Every read can come from memory or from the database. You cannot have both speed and freshness.',
      width: 'w-[680px]',
      body: [
        h.div(
          [h.Class('grid grid-cols-2 gap-3')],
          OPTIONS.map((option) => optionCard(option, model.run.tradeoff === option.choice, h)),
        ),
      ],
      footer: [
        h.span(
          [h.Class('font-mono text-[10px] tracking-[0.06em] text-muted-foreground')],
          ['Collapses after the first placement in a Run'],
        ),
        h.div(
          [h.Class('flex items-center gap-2')],
          [
            button({ variant: 'ghost', onClick: Message.OverlayClosed() }, 'Cancel', h),
            button({ onClick: Message.TradeoffPlaced() }, 'Place node · $90', h),
          ],
        ),
      ],
    },
    h,
  )
