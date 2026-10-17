import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { Message } from '@/game/message.ts'
import type { Scenario } from '@/game/content.ts'

/* ==========================================================================
   One Scenario card. The difficulty dots are the only game-y flourish; the
   rest is the teaching order, made visible.
   ========================================================================== */

const CARD = 'group flex flex-col border border-border bg-card text-left transition-all'
const CARD_LOCKED = 'opacity-60'

export const scenarioCard = (scenario: Scenario, h: HtmlBuilder<Message>): Html =>
  h.button(
    [
      h.Key(scenario.id),
      h.Type('button'),
      h.OnClick(Message.ScenarioPicked({ scenarioId: scenario.id })),
      h.Class(
        `${CARD} ${
          scenario.locked ? CARD_LOCKED : 'hover:-translate-y-0.5 hover:border-primary-strong'
        }`,
      ),
    ],
    [
      h.div(
        [h.Class('flex items-start justify-between gap-3 border-b border-border px-4 py-3.5')],
        [
          h.div(
            [],
            [
              h.div(
                [h.Class('font-mono text-[11px] tracking-[0.1em] text-muted-foreground')],
                [`Scenario ${scenario.index} · ${scenario.minutes} min`],
              ),
              h.div([h.Class('mt-0.5 text-[17px] font-semibold')], [scenario.name]),
            ],
          ),
          scenario.locked
            ? badge({ variant: 'secondary' }, ['Locked'], h)
            : badge({ variant: 'outline' }, ['Cleared'], h),
        ],
      ),
      h.p([h.Class('flex-1 px-4 py-3.5 text-[12.5px] text-muted-foreground')], [scenario.teaches]),
      h.div(
        [
          h.Class(
            'flex items-center justify-between gap-3 border-t border-border bg-muted px-4 py-3',
          ),
        ],
        [
          h.span(
            [h.Class('flex items-center gap-2')],
            [
              h.span(
                [h.Class('flex gap-1')],
                [0, 1, 2].map((step) =>
                  h.span(
                    [
                      h.Key(String(step)),
                      h.Class(
                        `size-1.5 ${step < scenario.complexity ? 'bg-primary-strong' : 'bg-input'}`,
                      ),
                    ],
                    [],
                  ),
                ),
              ),
              badge({ variant: 'ghost' }, [scenario.angle], h),
            ],
          ),
          h.span(
            [h.Class('font-mono text-[12px] text-primary-strong')],
            [scenario.locked ? 'Locked' : 'Play'],
          ),
        ],
      ),
    ],
  )
