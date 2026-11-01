import type { Html, HtmlBuilder } from 'foldkit/html'
import { Download, Trash2, X } from 'lucide'
import { offer } from '@/game/engine/actions.ts'
import { INCIDENTS, INCIDENT_IDS } from '@/game/engine/catalog.ts'
import { eraOf } from '@/game/engine/lookups.ts'
import { clock, compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { SPEEDS } from '@/game/update.ts'
import { icon } from '@/lib/icons'
import { button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, FLOAT, NESTED, SCROLL, WELL } from './bits.ts'

/* ==========================================================================
   The panels over the board: How to play, the funding offer, the
   Era card, the end of the slice, and the playtest panel.
   ========================================================================== */

export const shell = (
  title: string,
  right: ReadonlyArray<Html>,
  body: ReadonlyArray<Html>,
  width: string,
  h: HtmlBuilder<Message>,
) =>
  h.div(
    [
      h.Class(
        'absolute inset-0 z-30 grid place-items-center bg-foreground/10 p-6 backdrop-blur-[3px] enter-backdrop',
      ),
    ],
    [
      h.div(
        [h.Class(`flex max-h-full w-full flex-col overflow-hidden ${width} ${FLOAT} enter-modal`)],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-4 px-5 pt-4 pb-3')],
            [
              h.span([h.Class('text-[17px] font-semibold tracking-[-0.025em]')], [title]),
              h.div(
                [h.Class('flex items-center gap-3')],
                [
                  ...right,
                  button(
                    {
                      onClick: Message.PanelClosed(),
                      variant: 'ghost',
                      size: 'icon',
                      className: 'text-muted-foreground',
                      attributes: [h.AriaLabel('Close (Esc)')],
                    },
                    icon(h, X, 'size-4'),
                    h,
                  ),
                ],
              ),
            ],
          ),
          ...body,
        ],
      ),
    ],
  )

const primaryButton = (label: string, message: Message, h: HtmlBuilder<Message>) =>
  button({ onClick: message, size: 'lg', className: 'px-4' }, label, h)

const secondaryButton = (
  label: string,
  message: Message,
  h: HtmlBuilder<Message>,
  glyph?: Parameters<typeof icon>[1],
) =>
  button(
    { onClick: message, variant: 'outline', size: 'lg', className: 'px-3.5' },
    [...(glyph ? [icon(h, glyph, 'size-4')] : []), label],
    h,
  )

const footer = (children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div([h.Class('flex justify-end gap-2 border-t border-hairline bg-nested px-5 py-3')], children)

const stat = (name: string, value: string, h: HtmlBuilder<Message>) =>
  h.div(
    [h.Key(name), h.Class('flex flex-col gap-1 px-4 py-3')],
    [h.span([h.Class(EYEBROW)], [name]), h.span([h.Class(cn(FIGURE, 'text-[18px]'))], [value])],
  )

const stats = (columns: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div([h.Class(cn('grid w-full divide-x divide-hairline', WELL, columns))], children)

/* ---------- how to play ---------- */

const STEPS: ReadonlyArray<readonly [string, string]> = [
  ['Wire it', 'Drag from a Node’s blue output port to another Node. Click a link to cut it.'],
  [
    'Collect',
    'Revenue waits in Payments. Click it before the drawer fills. Stripe Billing collects for you.',
  ],
  ['Learn', 'Analytics samples linked Nodes. Sampled traffic becomes Insight ◆ for Research.'],
  [
    'Find the limit',
    'The pulsing outline marks the bottleneck. Its card says if it is out of CPU, credits, RAM, workers or connections.',
  ],
  ['Grow', 'Users grow while Apdex beats the Era target, and leave fast when it does not.'],
  [
    'Raise',
    'At the user target, take or decline the round. Pre-seed brings writes, logins and incidents.',
  ],
]

const KEYS: ReadonlyArray<readonly [string, string]> = [
  ['1–4', 'Build group'],
  ['R', 'Research'],
  ['U', 'Resize selected'],
  ['Z', 'Undo'],
  ['Del', 'Sell selected'],
  ['C', 'Collect'],
  ['S', 'Speed'],
  ['Space', 'Pause'],
  ['`', 'Playtest panel'],
  ['Esc', 'Cancel'],
]

export const helpPanel = (h: HtmlBuilder<Message>): Html =>
  shell(
    'How to play',
    [],
    [
      h.div(
        [h.Class(`grid min-h-0 grid-cols-[minmax(0,1fr)_230px] gap-4 px-5 pt-1 pb-5 ${SCROLL}`)],
        [
          h.ol(
            [h.Class('grid grid-cols-2 gap-2')],
            STEPS.map(([title, body], index) =>
              h.li(
                [
                  h.Key(title),
                  h.Class(
                    'flex flex-col gap-1.5 rounded-xl bg-nested p-4 shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
                  ),
                ],
                [
                  h.span(
                    [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
                    [String(index + 1).padStart(2, '0')],
                  ),
                  h.span([h.Class('text-[15px] font-semibold')], [title]),
                  h.span([h.Class('text-[13px] leading-relaxed text-muted-foreground')], [body]),
                ],
              ),
            ),
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Keys']),
              h.div(
                [h.Class(NESTED)],
                KEYS.map(([key, action]) =>
                  h.div(
                    [
                      h.Key(key),
                      h.Class('flex items-center justify-between gap-2 px-3 py-1.5 text-[12.5px]'),
                    ],
                    [h.span([h.Class('text-muted-foreground')], [action]), Kbd({}, [key], h)],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      footer([primaryButton('Start building', Message.PanelClosed(), h)], h),
    ],
    'max-w-[980px]',
    h,
  )

/* ---------- funding ---------- */

export const offerPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const deal = offer(model.game)
  if (!deal) return h.empty
  return shell(
    `${deal.era.name} round`,
    [],
    [
      h.div(
        [h.Class('grid grid-cols-2 gap-3 px-5 pt-1 pb-5')],
        [
          h.div(
            [h.Class('flex flex-col gap-3 rounded-xl bg-raised p-4 shadow-raised')],
            [
              h.span([h.Class('text-[15px] font-semibold')], ['Raise']),
              h.div(
                [h.Class('flex flex-1 flex-col gap-0.5 text-[13px] text-muted-foreground')],
                [
                  h.span([], [`+${money(deal.grant)} Cash`]),
                  h.span(
                    [],
                    [
                      `Equity ${Math.round(model.game.equity * 100)}% → ${Math.round(model.game.equity * (1 - deal.dilution) * 100)}%`,
                    ],
                  ),
                  h.span([], ['Full growth']),
                ],
              ),
              primaryButton('Raise', Message.RoundRaised(), h),
            ],
          ),
          h.div(
            [
              h.Class(
                'flex flex-col gap-3 rounded-xl bg-nested p-4 shadow-[inset_0_0_0_1px_var(--hairline-soft)]',
              ),
            ],
            [
              h.span([h.Class('text-[15px] font-semibold')], ['Decline']),
              h.div(
                [h.Class('flex flex-1 flex-col gap-0.5 text-[13px] text-muted-foreground')],
                [
                  h.span([], ['No Cash']),
                  h.span([], [`Equity stays ${Math.round(model.game.equity * 100)}%`]),
                  h.span([], ['Growth × 0.7']),
                ],
              ),
              secondaryButton('Decline', Message.RoundDeclined(), h),
            ],
          ),
        ],
      ),
    ],
    'max-w-[620px]',
    h,
  )
}

export const eraPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const era = eraOf(model.game)
  return shell(
    era.name,
    [],
    [
      h.div(
        [h.Class('stagger flex flex-col gap-4 px-5 pt-1 pb-5')],
        [
          h.span(
            [h.Class('text-[26px] font-semibold leading-tight tracking-[-0.035em]')],
            [era.question],
          ),
          h.p([h.Class('text-[14px] leading-relaxed text-muted-foreground')], [era.arrivals]),
          stats(
            'grid-cols-3',
            [
              stat(
                'Next round',
                Number.isFinite(era.raiseAt) ? `${compact(era.raiseAt)} users` : '—',
                h,
              ),
              stat('Apdex target', era.apdexTarget.toFixed(2), h),
              stat('Prices', `×${era.costIndex}`, h),
            ],
            h,
          ),
        ],
      ),
      footer([primaryButton('Continue', Message.PanelClosed(), h)], h),
    ],
    'max-w-[620px]',
    h,
  )
}

export const endPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  shell(
    'End of the slice',
    [],
    [
      h.div(
        [h.Class('flex flex-col items-center gap-5 px-8 pt-4 pb-8')],
        [
          h.img([h.Src('/art/hero.svg'), h.Alt(''), h.Class('w-full max-w-[520px]')]),
          h.span([h.Class('text-[30px] font-semibold tracking-[-0.035em]')], ['Seed reached.']),
          stats(
            'max-w-[640px] grid-cols-4',
            [
              stat('Time', clock(model.game.time), h),
              stat('Users', compact(model.game.users), h),
              stat('Earned', money(model.game.earned), h),
              stat('Equity', `${Math.round(model.game.equity * 100)}%`, h),
            ],
            h,
          ),
          h.div(
            [h.Class('flex gap-2')],
            [
              primaryButton('Keep playing', Message.PanelClosed(), h),
              secondaryButton('Export playtest log', Message.LogExported(), h, Download),
            ],
          ),
        ],
      ),
    ],
    'max-w-[760px]',
    h,
  )

/* ---------- playtest panel ---------- */

export const devPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  shell(
    'Playtest',
    [],
    [
      h.div(
        [h.Class('flex flex-col gap-5 px-5 pt-1 pb-5')],
        [
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Speed']),
              h.div(
                [h.Class('flex gap-2')],
                SPEEDS.map((speed) =>
                  button(
                    {
                      onClick: Message.SpeedChosen({ speed }),
                      variant: model.speed === speed ? 'default' : 'outline',
                      size: 'lg',
                      className: cn(FIGURE, 'w-16'),
                      attributes: [h.Key(String(speed))],
                    },
                    `${speed}×`,
                    h,
                  ),
                ),
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Skip ahead']),
              h.div(
                [h.Class('flex flex-wrap gap-2')],
                [
                  model.game.stage === 0
                    ? secondaryButton('Skip to Pre-seed', Message.CheatPreseed(), h)
                    : h.empty,
                  secondaryButton('+$1,000', Message.CheatCash(), h),
                  secondaryButton('+100 Insight', Message.CheatInsight(), h),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Start an incident']),
              h.div(
                [h.Class('flex flex-wrap gap-2')],
                INCIDENT_IDS.map((kind) =>
                  secondaryButton(INCIDENTS[kind].name, Message.IncidentForced({ kind }), h),
                ),
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col gap-2')],
            [
              h.span([h.Class(EYEBROW)], ['Log']),
              h.div(
                [h.Class('flex flex-wrap gap-2')],
                [
                  secondaryButton('Export playtest log', Message.LogExported(), h, Download),
                  secondaryButton('Clear log', Message.LogCleared(), h, Trash2),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
    'max-w-[640px]',
    h,
  )
