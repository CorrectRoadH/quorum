import { PrefsMessage } from '@/game/prefs.ts'
import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowUpRight, Copy, DoorOpen, Download, House, Play, Settings, Trash2, X } from 'lucide'
import { UrlRequest } from 'foldkit/navigation'
import { PRIVACY_URL } from '@/platform/analytics.ts'
import { offer } from '@quorum/simulation/actions'
import { PRE_IPO_STAGE } from '@quorum/simulation/ipo'
import { INCIDENTS, INCIDENT_IDS, VENTURES } from '@quorum/simulation/catalog'
import { eraOf, isFinalEra, nextEra } from '@quorum/simulation/lookups'
import { cheatCash, cheatInsight } from '@/game/cheats.ts'
import { clock, compact, money } from '@quorum/ui/game/format'
import { Message } from '@/game/message.ts'
import { currentFile, exitLegacy, type Model } from '@/game/model.ts'
import { companyMark } from '@/components/company-mark.ts'
import { speedsOf } from '@/game/update.ts'
import { icon } from '@quorum/ui/primitives/icon'
import { button } from '@quorum/ui/primitives/button'
import { Kbd } from '@quorum/ui/primitives/kbd'
import { switch_ } from '@quorum/ui/primitives/switch'
import { cn } from '@/lib/utils'
import { languagePicker } from '@/i18n/picker.ts'
import { EYEBROW, FIGURE, FLOAT, NESTED, SCROLL, WELL } from '@quorum/ui/game/bits'

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
      h.DataAttribute('exit', 'gesture'),
      h.Class(
        'absolute inset-0 z-30 grid place-items-center bg-foreground/10 p-6 backdrop-blur-[3px] enter-backdrop compact:p-3 compact:pt-[max(12px,env(safe-area-inset-top))] compact:pb-[max(12px,env(safe-area-inset-bottom))] short:[[data-toast=on]_&]:pt-12!',
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
  [
    'Wire it',
    'Drag from a Node’s blue output port to another Node. Click or tap a link to cut it. Drag empty space to pan; scroll or pinch to zoom.',
  ],
  [
    'Collect',
    'Revenue waits in Payments. Press Collect before the drawer fills. Stripe Billing collects for you.',
  ],
  [
    'Learn',
    'Analytics samples linked Nodes. Each request kind it samples fills its own Insight pool.',
  ],
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
  ['T', 'Team'],
  ['P', 'Playbooks'],
  ['Shift+click', 'Select for a Playbook'],
  ['Ctrl+A', 'Select all'],
  ['Ctrl+C / X / V', 'Copy, cut, paste Nodes'],
  ['Ctrl+D', 'Duplicate Nodes'],
  ['Shift+Ctrl / Alt drag', 'Add to / remove from selection'],
  ['Shift+Arrows', 'Nudge Nodes'],
  ['U', 'Resize selected'],
  ['Z', 'Undo'],
  ['Shift+Z', 'Redo'],
  ['Del', 'Sell selected'],
  ['C', 'Collect'],
  ['S', 'Speed'],
  ['D', 'Dashboard'],
  ['G', 'Glossary'],
  ['M', 'Mute'],
  ['Arrows', 'Select Node'],
  ['Enter', 'Inspector'],
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
        [
          h.Class(
            `grid min-h-0 grid-cols-[minmax(0,1fr)_230px] gap-4 px-5 pt-1 pb-5 compact:grid-cols-1 ${SCROLL}`,
          ),
        ],
        [
          h.ol(
            [h.Class('grid grid-cols-2 gap-2 narrow:grid-cols-1')],
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
            [h.Class('flex flex-col gap-2 compact:hidden')],
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

/* ---------- game menu ---------- */

const menuItem = (
  label: string,
  glyph: Parameters<typeof icon>[1],
  message: Message,
  h: HtmlBuilder<Message>,
  isPrimary = false,
) =>
  button(
    {
      onClick: message,
      variant: isPrimary ? 'default' : 'outline',
      size: 'lg',
      className: 'h-11 w-full justify-start gap-2.5 px-3.5',
      attributes: [h.Key(label)],
    },
    [icon(h, glyph, 'size-[18px]'), label],
    h,
  )

/** The game menu over the board. The clock holds still while it is open. */
export const menuPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const file = currentFile(model)
  return shell(
    'Menu',
    [],
    [
      ...(file
        ? [
            h.div(
              [h.Class('flex items-center gap-2.5 px-5 pb-4')],
              [
                companyMark(file.logo, 'size-6 shrink-0', h),
                h.div(
                  [h.Class('flex min-w-0 flex-col')],
                  [
                    h.span([h.Class('truncate text-sm font-medium')], [file.name]),
                    h.span(
                      [h.Class('truncate text-xs text-muted-foreground')],
                      [`${VENTURES[file.venture].name} · ${eraOf(model.board.game).name}`],
                    ),
                  ],
                ),
              ],
            ),
          ]
        : []),
      h.div(
        [h.Class('flex flex-col gap-2 px-5 pt-1 pb-5')],
        [
          menuItem('Resume', Play, Message.PanelClosed(), h, true),
          menuItem('Settings', Settings, Message.PanelOpened({ panel: 'settings' }), h),
          menuItem('Export playtest log', Download, Message.LogExported(), h),
          exitLegacy(model) === null
            ? h.empty
            : menuItem('Exit company', DoorOpen, Message.PanelOpened({ panel: 'exit' }), h),
          menuItem('Title screen', House, Message.TitleOpened(), h),
        ],
      ),
    ],
    'max-w-[320px]',
    h,
  )
}

/* ---------- settings ---------- */

export const settingsPanel = (model: Model, h: HtmlBuilder<Message>): Html =>
  shell(
    'Settings',
    [],
    [
      h.div(
        [h.Class(`flex min-h-0 flex-col gap-4 px-5 pt-1 pb-5 ${SCROLL}`)],
        [
          switch_(
            {
              id: 'setting-muted',
              label: 'Mute sound (M)',
              isChecked: model.prefs.muted,
              onToggle: () => Message.PrefsChanged({ message: PrefsMessage.MuteToggled() }),
            },
            h,
          ),
          switch_(
            {
              id: 'setting-auto-pause',
              label: 'Pause on SEV1 and SEV2',
              isChecked: model.prefs.autoPause,
              onToggle: () => Message.PrefsChanged({ message: PrefsMessage.AutoPauseToggled() }),
            },
            h,
          ),
          switch_(
            {
              id: 'setting-blur-pause',
              label: 'Pause when the window loses focus',
              isChecked: model.prefs.blurPause,
              onToggle: () => Message.PrefsChanged({ message: PrefsMessage.BlurPauseToggled() }),
            },
            h,
          ),
          switch_(
            {
              id: 'setting-motion',
              label: 'Reduce motion',
              isChecked: model.prefs.motion === 'reduce',
              onToggle: () => Message.PrefsChanged({ message: PrefsMessage.MotionToggled() }),
            },
            h,
          ),
          switch_(
            {
              id: 'setting-agent-access',
              label: 'Agent access',
              isChecked: model.prefs.agentAccess,
              onToggle: () => Message.PrefsChanged({ message: PrefsMessage.AgentAccessToggled() }),
            },
            h,
          ),
          switch_(
            {
              id: 'setting-analytics',
              label: 'Share anonymous usage data',
              isChecked: model.prefs.analytics,
              onToggle: () => Message.PrefsChanged({ message: PrefsMessage.AnalyticsToggled() }),
            },
            h,
          ),
          h.div(
            [h.Class('flex items-center justify-between gap-3')],
            [
              h.span([h.Class('text-sm font-medium')], ['Language']),
              languagePicker(model.prefs.locale, model.languagePicker, h),
            ],
          ),
          secondaryButton(
            'Privacy policy',
            Message.ClickedLink({ request: UrlRequest.External({ href: PRIVACY_URL }) }),
            h,
            ArrowUpRight,
          ),
          secondaryButton('Copy state as JSON', Message.StateCopied(), h, Copy),
        ],
      ),
    ],
    'max-w-[360px]',
    h,
  )

/* ---------- funding ---------- */

export const offerPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const deal = offer(model.board.game)
  if (!deal) return h.empty
  const ipo = model.board.game.stage === PRE_IPO_STAGE
  return shell(
    ipo ? 'IPO' : `${deal.era.name} round`,
    [],
    [
      h.div(
        [h.Class('grid grid-cols-2 gap-3 px-5 pt-1 pb-5 narrow:grid-cols-1')],
        [
          h.div(
            [h.Class('flex flex-col gap-3 rounded-xl bg-raised p-4 shadow-raised')],
            [
              h.span([h.Class('text-[15px] font-semibold')], [ipo ? 'Go public' : 'Raise']),
              h.div(
                [h.Class('flex flex-1 flex-col gap-0.5 text-[13px] text-muted-foreground')],
                [
                  h.span([], [`+${money(deal.grant)} Cash`]),
                  h.span(
                    [],
                    [
                      `Equity ${Math.round(model.board.game.equity * 100)}% → ${Math.round(model.board.game.equity * (1 - deal.dilution) * 100)}%`,
                    ],
                  ),
                  h.span([], [ipo ? 'Quarters begin' : 'Full growth']),
                ],
              ),
              primaryButton(ipo ? 'Go public' : 'Raise', Message.RoundRaised(), h),
            ],
          ),
          ipo
            ? h.empty
            : h.div(
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
                      h.span([], [`Equity stays ${Math.round(model.board.game.equity * 100)}%`]),
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
  const era = eraOf(model.board.game)
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
    'IPO',
    [],
    [
      h.div(
        [
          h.Class(
            'flex flex-col items-center gap-5 px-8 pt-4 pb-8 compact:gap-3 compact:px-5 compact:pb-5',
          ),
        ],
        [
          h.img([
            h.Src('/art/hero.svg'),
            h.Alt(''),
            h.Class('w-full max-w-[520px] short:max-h-[30dvh] short:w-auto'),
          ]),
          h.span(
            [h.Class('text-[30px] font-semibold tracking-[-0.035em]')],
            ['The company is public.'],
          ),
          stats(
            'max-w-[640px] grid-cols-4 narrow:grid-cols-2 narrow:[&>:nth-child(n+3)]:border-t',
            [
              stat('Time', clock(model.board.game.time), h),
              stat('Users', compact(model.board.game.users), h),
              stat('Earned', money(model.board.game.earned), h),
              stat('Equity', `${Math.round(model.board.game.equity * 100)}%`, h),
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
                speedsOf(model.board.game).map((speed) =>
                  button(
                    {
                      onClick: Message.SpeedChosen({ speed }),
                      variant: model.board.clock.speed === speed ? 'default' : 'outline',
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
                  nextEra(model.board.game) && !isFinalEra(model.board.game)
                    ? secondaryButton(
                        `Skip to ${nextEra(model.board.game)?.name ?? ''}`,
                        Message.CheatRound(),
                        h,
                      )
                    : h.empty,
                  secondaryButton(`+${money(cheatCash(model.board.game))}`, Message.CheatCash(), h),
                  secondaryButton(
                    `+${cheatInsight(model.board.game).toLocaleString('en-US')} Insight`,
                    Message.CheatInsight(),
                    h,
                  ),
                  secondaryButton('+20 Legacy', Message.CheatLegacy(), h),
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
