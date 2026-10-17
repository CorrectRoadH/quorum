import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { foot, frame, head } from '@/components/game/frame.ts'
import { scenarioCard } from '@/components/game/scenario-card.ts'
import { sectionTitle } from '@/components/game/panel.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { scenarios } from '@/game/content.ts'

/* ==========================================================================
   Scenario picker. Six briefs, in the order they teach, with what each one
   costs you in minutes and complexity.
   ========================================================================== */

export const scenariosScreen = (_model: Model, h: HtmlBuilder<Message>): Html =>
  frame(
    'flow',
    [
      head(
        {
          back: Message.WentTo({ route: 'menu' }),
          backLabel: 'Menu',
          title: 'Scenarios',
          hint: 'Six briefs, longest last',
          right: [
            badge({ variant: 'outline' }, ['1 of 6 cleared'], h),
            badge({ variant: 'ghost' }, ['$8,420 carried'], h),
          ],
        },
        h,
      ),
      h.div(
        [h.Class('min-h-0 overflow-auto [scrollbar-width:thin] px-8 py-7')],
        [
          h.div(
            [h.Class('mx-auto flex w-full max-w-[1180px] flex-col gap-6')],
            [
              sectionTitle(
                'Six Scenarios',
                'Each one teaches one thing',
                'They get longer and harder from left to right. Leftover Capital carries into the next one, so a careful month pays for the next brief.',
                h,
              ),
              h.div(
                [h.Class('grid grid-cols-3 gap-3.5')],
                scenarios.map((scenario) => scenarioCard(scenario, h)),
              ),
            ],
          ),
        ],
      ),
      foot(
        {
          hint: 'Locked Scenarios keep the teaching order. Nothing is lost by replaying one.',
          actions: [
            button(
              { variant: 'ghost', onClick: Message.WentTo({ route: 'menu' }) },
              'Back to menu',
              h,
            ),
            button({ onClick: Message.WentTo({ route: 'briefing' }) }, 'Open Scenario 1', h),
          ],
        },
        h,
      ),
    ],
    h,
  )
