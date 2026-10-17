import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { foot, frame, head } from '@/components/game/frame.ts'
import { card, cardBody, cardHead, kv } from '@/components/game/panel.ts'
import { componentChips, demandCurve, timeline } from '@/components/game/scenario-detail.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { roles, scenarioById } from '@/game/content.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Briefing: everything a player knows before the first Tick. Demand, targets,
   the failures the Scenario will inject, and what their Role is scored on.
   ========================================================================== */

export const briefingScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const scenario = scenarioById(model.room.scenarioId)
  const role = roles.find((entry) => entry.key === model.room.role) ?? roles[0]

  return frame(
    'flow',
    [
      head(
        {
          back: Message.WentTo({ route: 'scenarios' }),
          backLabel: 'Scenarios',
          title: scenario.name,
          hint: `Scenario ${scenario.index} · 900 Ticks`,
          right: [badge({ variant: 'outline' }, [`${role?.name ?? 'Edge Lead'} hat`], h)],
        },
        h,
      ),
      h.div(
        [h.Class('min-h-0 overflow-auto [scrollbar-width:thin] px-8 py-7')],
        [
          h.div(
            [h.Class('mx-auto flex w-full max-w-[1180px] items-start gap-8')],
            [
              h.div(
                [h.Class('flex min-w-0 flex-1 flex-col gap-4')],
                [
                  h.div(
                    [],
                    [
                      h.span(
                        [h.Class(EYEBROW)],
                        [`Scenario ${scenario.index} · ${scenario.name} · 900 Ticks`],
                      ),
                      h.h2([h.Class('mt-2 text-[26px]')], [scenario.headline]),
                      h.p(
                        [h.Class('mt-2 max-w-[62ch] text-[15px] text-muted-foreground')],
                        [scenario.brief],
                      ),
                    ],
                  ),
                  card(
                    [
                      cardHead(
                        'Scheduled failures',
                        badge({ variant: 'ghost' }, ['You cannot stop these'], h),
                        h,
                      ),
                      cardBody([timeline(scenario, h)], h),
                    ],
                    h,
                  ),
                  card(
                    [
                      cardHead(
                        'Fixed cluster',
                        badge({ variant: 'ghost' }, ['Not yours to size'], h),
                        h,
                      ),
                      cardBody(
                        [
                          h.p(
                            [h.Class('text-[12px] leading-relaxed text-muted-foreground')],
                            [
                              'The cluster gives you 2 nodes and 8 vCPU. You place Nodes into it; you do not buy machines. That is Zone Down\u2019s lesson, not this one.',
                            ],
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
                [h.Class('flex w-[420px] shrink-0 flex-col gap-3')],
                [
                  card(
                    [
                      cardHead('Demand curve', badge({ variant: 'outline' }, ['900 Ticks'], h), h),
                      cardBody(
                        [
                          demandCurve(scenario, h),
                          h.div(
                            [
                              h.Class(
                                'mt-2 flex items-center justify-between text-[11px] text-muted-foreground',
                              ),
                            ],
                            [
                              h.span([], ['Sample rate: 1 in 8 requests · visible to you']),
                              h.span([h.Class('font-mono')], [`peak ${scenario.peak}`]),
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
                        'The numbers you start with',
                        badge({ variant: 'ghost' }, ['Balance'], h),
                        h,
                      ),
                      cardBody(
                        [
                          kv(
                            scenario.numbers.map((cell) => ({ ...cell })),
                            h,
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
                        'Allowed Components',
                        badge(
                          { variant: 'ghost' },
                          [`${scenario.components.length} of the catalog`],
                          h,
                        ),
                        h,
                      ),
                      cardBody([componentChips(scenario, h)], h),
                    ],
                    h,
                  ),
                  card(
                    [
                      cardBody(
                        [
                          h.span([h.Class(EYEBROW)], ['Your Role objective']),
                          h.p(
                            [h.Class('mt-2 text-[13.5px]')],
                            [
                              h.span(
                                [h.Class('font-semibold')],
                                [`${role?.name ?? 'Edge Lead'} — `],
                              ),
                              role?.objective ?? '',
                            ],
                          ),
                        ],
                        h,
                      ),
                    ],
                    h,
                    'border-primary-strong/40 bg-primary/8',
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      foot(
        {
          hint: 'Everything you are scored on comes from the Ledger, and the Ledger comes from the Simulation.',
          actions: [
            button(
              { variant: 'ghost', onClick: Message.WentTo({ route: 'scenarios' }) },
              'Back',
              h,
            ),
            button({ onClick: Message.RunStarted() }, 'Enter the run', h),
          ],
          keys: ['Enter'],
        },
        h,
      ),
    ],
    h,
  )
}
