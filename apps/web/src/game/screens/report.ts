import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { frame } from '@/components/game/frame.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { money } from '@/game/simulation.ts'
import { roles } from '@/game/content.ts'
import { EYEBROW } from '@/components/game/text.ts'

/* ==========================================================================
   Report card. Four scores with the reason behind each one, the money that
   explains them, and the tradeoffs the player actually engaged with.
   ========================================================================== */

type Axis = Readonly<{
  name: string
  score: number
  tone: 'plain' | 'warn'
  reason: string
}>

const moneyCell = 'flex flex-col gap-1 px-4 py-3.5 border-border'

/** What the month actually ended on, read straight off the Ledger. */
const readings = (model: Model, h: HtmlBuilder<Message>): Html => {
  // A crashed Node reports an em dash where a number would go, so only the
  // rows that actually produced a figure get to set the worst case.
  const numeric = (values: ReadonlyArray<string>): ReadonlyArray<number> =>
    values.map((value) => Number.parseFloat(value)).filter((value) => Number.isFinite(value))
  const worst = (values: ReadonlyArray<string>): number => Math.max(...numeric(values), 0)

  const p99 = worst(model.ledger.map((row) => row.p99))
  const worstErrors = worst(model.ledger.map((row) => row.errors))
  const utilisation =
    model.ledger.length === 0
      ? 0
      : Math.round(model.ledger.reduce((total, row) => total + row.util, 0) / model.ledger.length)

  const cells: ReadonlyArray<Readonly<{ label: string; value: string; note: string }>> = [
    { label: 'Nodes', value: String(model.design.nodes.length), note: 'paying rent' },
    { label: 'Links', value: String(model.design.links.length), note: 'carrying traffic' },
    { label: 'Burn', value: money(model.run.burn), note: 'per month' },
    { label: 'Worst p99', value: `${p99} ms`, note: 'one Node' },
    { label: 'Worst errors', value: `${worstErrors}%`, note: 'sampled' },
    { label: 'Fleet utilisation', value: `${utilisation}%`, note: 'average' },
  ]

  return h.div(
    [
      h.Class(
        'grid grid-cols-[auto_repeat(6,minmax(0,1fr))] items-center gap-x-4 border border-border bg-card px-4 py-3',
      ),
    ],
    [
      h.span([h.Class('w-[104px]')], [h.span([h.Class(EYEBROW)], ['Final readings'])]),
      ...cells.map((cell) =>
        h.div(
          [h.Key(cell.label), h.Class('flex flex-col gap-0.5 border-l border-border pl-4')],
          [
            h.span([h.Class(EYEBROW)], [cell.label]),
            h.span([h.Class('font-mono text-[16px]')], [cell.value]),
            h.span([h.Class('text-[11px] text-muted-foreground')], [cell.note]),
          ],
        ),
      ),
    ],
  )
}

export const reportScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const kept = Math.round(model.run.capital)
  const role = roles.find((entry) => entry.key === model.room.role)?.name ?? 'Edge Lead'
  const moneyScore = Math.max(10, Math.min(99, Math.round(88 + (kept - 8420) / 40)))

  const axes: ReadonlyArray<Axis> = [
    {
      name: 'Reliability',
      score: 92,
      tone: 'plain',
      reason:
        '9,812 of 10,000 sampled requests served. The crash-looping Search node never entered rotation, so nobody noticed.',
    },
    {
      name: 'Performance',
      score: 71,
      tone: 'warn',
      reason:
        'p95 finished at 168 ms against a 120 ms target. Postgres sat above 95% utilization for 41 Ticks.',
    },
    {
      name: 'Simplicity',
      score: 84,
      tone: 'plain',
      reason:
        'Eight nodes, seven links. One node had no path from traffic entry and earned nothing all month.',
    },
    {
      name: 'Money',
      score: moneyScore,
      tone: 'plain',
      reason: `You kept ${money(kept)} of $12,300 earned. 18% of paid capacity went unused.`,
    },
  ]

  const moneyCells: ReadonlyArray<Readonly<{ label: string; value: string; note: string }>> = [
    {
      label: 'Capital kept',
      value: money(kept),
      note: '+$310 in the last week',
    },
    { label: 'Earned', value: '$12,300', note: 'at $0.004 / request' },
    { label: 'Burned', value: '$4,880', note: 'across 8 nodes' },
    { label: 'Idle capacity', value: '18%', note: 'paid, never used' },
  ]

  const engagements: ReadonlyArray<
    Readonly<{ tag: string; title: string; why: string; delta: string }>
  > = [
    {
      tag: 'Cache',
      title:
        model.run.tradeoff === 'write-through'
          ? 'Write-through · no warm reads'
          : 'Cache reads · TTL 60s',
      why: 'Fast reads, 1.1% stale. You never raised the TTL, so the staleness stayed small.',
      delta: '−180 ms',
    },
    {
      tag: 'Postgres',
      title: 'Two replicas, no read pool',
      why: 'Every read hit the primary. The second replica only absorbed failover.',
      delta: '+$310 / mo',
    },
    {
      tag: 'Skip',
      title: 'You ignored “Add a CDN?”',
      why: 'Static assets came from the app, which is why p95 never fell below 140 ms.',
      delta: '+42 ms p95',
    },
  ]

  return frame(
    'report',
    [
      h.div(
        [h.Class('flex h-full min-h-0 flex-col gap-5 px-10 py-8')],
        [
          h.div(
            [h.Class('grid grid-cols-[1fr_auto] items-end gap-5 border-b border-border pb-4')],
            [
              h.div(
                [],
                [
                  h.span(
                    [h.Class(EYEBROW)],
                    [`Report card · Scenario 1 · ${model.room.code} · ${role}`],
                  ),
                  h.h2([h.Class('mt-1 text-[38px] tracking-[-0.03em]')], ['A month in the black']),
                  h.p(
                    [h.Class('max-w-[60ch] text-[13.5px] text-muted-foreground')],
                    [
                      'You held the site up through the Tuesday spike and paid for the headroom. One database should have been two.',
                    ],
                  ),
                ],
              ),
              h.div(
                [h.Class('flex flex-col items-end gap-1')],
                [
                  h.span(
                    [h.Class('text-[26px] tracking-[3px] text-primary-strong')],
                    ['★★', h.span([h.Class('text-border')], ['★'])],
                  ),
                  h.span([h.Class('font-semibold')], ['2 of 3 stars']),
                  h.span(
                    [
                      h.Class(
                        'font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground',
                      ),
                    ],
                    ['Targets met · 3 of 4'],
                  ),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('flex min-h-0 flex-1 flex-col justify-center gap-5')],
            [
              h.div(
                [h.Class('grid grid-cols-4 gap-3')],
                axes.map((axis) =>
                  h.div(
                    [
                      h.Key(axis.name),
                      h.Class('flex flex-col gap-2.5 border border-border bg-card p-3.5'),
                    ],
                    [
                      h.div(
                        [h.Class('flex items-baseline justify-between gap-2')],
                        [
                          h.span([h.Class('text-[15px] font-semibold')], [axis.name]),
                          h.span(
                            [
                              h.Class(
                                `font-mono text-[19px] ${axis.tone === 'warn' ? 'text-warn' : ''}`,
                              ),
                            ],
                            [String(axis.score)],
                          ),
                        ],
                      ),
                      h.div(
                        [h.Class('h-1.5 bg-muted')],
                        [
                          h.div(
                            [
                              h.Class(
                                `h-full ${axis.tone === 'warn' ? 'bg-warn' : 'bg-primary-strong'}`,
                              ),
                              h.Style({ width: `${axis.score}%` }),
                            ],
                            [],
                          ),
                        ],
                      ),
                      h.p(
                        [h.Class('text-[12px] leading-relaxed text-muted-foreground')],
                        [axis.reason],
                      ),
                    ],
                  ),
                ),
              ),
              h.div(
                [h.Class('grid min-h-0 grid-cols-2 items-start gap-3')],
                [
                  h.div(
                    [h.Class('grid grid-cols-2 border border-border bg-card')],
                    moneyCells.map((cell, index) =>
                      h.div(
                        [
                          h.Key(cell.label),
                          h.Class(
                            `${moneyCell} ${index % 2 === 1 ? 'border-l' : ''} ${index >= 2 ? 'border-t' : ''}`,
                          ),
                        ],
                        [
                          h.span([h.Class(EYEBROW)], [cell.label]),
                          h.span([h.Class('font-mono text-[18px]')], [cell.value]),
                          h.span([h.Class('text-[11px] text-muted-foreground')], [cell.note]),
                        ],
                      ),
                    ),
                  ),
                  h.div(
                    [h.Class('flex min-h-0 flex-col gap-2 overflow-auto [scrollbar-width:thin]')],
                    [
                      h.div(
                        [h.Class('flex items-center justify-between')],
                        [
                          h.span([h.Class(EYEBROW)], ['Tradeoffs you engaged']),
                          badge({ variant: 'ghost' }, ['2 of 5'], h),
                        ],
                      ),
                      ...engagements.map((entry) =>
                        h.div(
                          [
                            h.Key(entry.title),
                            h.Class(
                              'flex items-center gap-3 border border-border bg-card px-3 py-2.5',
                            ),
                          ],
                          [
                            badge(
                              {
                                variant: entry.tag === 'Skip' ? 'ghost' : 'outline',
                              },
                              [entry.tag],
                              h,
                            ),
                            h.div(
                              [h.Class('flex-1')],
                              [
                                h.div([h.Class('text-[13px] font-semibold')], [entry.title]),
                                h.div(
                                  [h.Class('text-[11.5px] text-muted-foreground')],
                                  [entry.why],
                                ),
                              ],
                            ),
                            h.span(
                              [h.Class('whitespace-nowrap font-mono text-[12px] text-warn')],
                              [entry.delta],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              readings(model, h),
            ],
          ),
          h.div(
            [h.Class('flex items-center justify-between gap-5 border-t border-border pt-4')],
            [
              h.span(
                [h.Class('max-w-[70ch] text-[12px] text-muted-foreground')],
                [
                  'Next up: ',
                  h.span(
                    [h.Class('font-semibold text-foreground')],
                    ['Scenario 2 · Incident: 3AM'],
                  ),
                  ` — you arrive at a run that is already broken. Leftover Capital carries with you, so ${money(kept)} is your starting balance.`,
                ],
              ),
              h.div(
                [h.Class('flex items-center gap-2')],
                [
                  button(
                    {
                      variant: 'outline',
                      onClick: Message.WentTo({ route: 'menu' }),
                    },
                    'Back to menu',
                    h,
                  ),
                  button(
                    {
                      variant: 'outline',
                      onClick: Message.CopyRequested({
                        text: `Quorum · Scenario 1 · The Blog\nReliability 92 · Performance 71 · Simplicity 84 · Money ${moneyScore}\nCapital kept ${money(kept)}`,
                        label: 'Result',
                      }),
                    },
                    'Copy result',
                    h,
                  ),
                  button({ onClick: Message.WentTo({ route: 'scenarios' }) }, 'Next Scenario', h),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
    h,
  )
}
