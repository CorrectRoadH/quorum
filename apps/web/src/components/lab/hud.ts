import type { Html, HtmlBuilder } from 'foldkit/html'
import {
  Circle,
  CircleCheck,
  BookCopy,
  BookOpen,
  ChartLine,
  CircleHelp,
  DatabaseZap,
  Expand,
  FlaskConical,
  Gem,
  Hammer,
  type IconNode,
  Menu,
  Pause,
  Play,
  Rocket,
  Scan,
  ShieldCheck,
  Smile,
  Timer,
  TriangleAlert,
  Redo2,
  Settings,
  Undo2,
  Users,
  UsersRound,
  Wallet,
} from 'lucide'
import { OPEN_REGION_PRICE, REGIONS, REGION_INFO, researchList } from '@quorum/simulation/catalog'
import { openRegions, regional } from '@quorum/simulation/regions'
import { canRaise } from '@quorum/simulation/actions'
import type { Ledger } from '@quorum/simulation/ledger'
import { eraOf, has, nextEra, researchReady } from '@quorum/simulation/lookups'
import { PRE_IPO_STAGE, checklistOf } from '@quorum/simulation/ipo'
import {
  GUIDANCE_GROWTH,
  GUIDANCE_MARGIN,
  guidanceOpen,
  quarterGrowth,
} from '@quorum/simulation/quarters'
import { budgetOf, budgeted } from '@quorum/simulation/slo'
import { marginOf, valuationOf } from '@quorum/simulation/valuation'
import { clockOf } from '@quorum/simulation/solve'
import { devHoursRate } from '@quorum/simulation/team'
import { itemName } from '@quorum/simulation/work'
import { describeDelta, redoAvailable, settleProgress, undoAvailable } from '@/game/feedback.ts'
import { compact, money, ms, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import { offCompany, type Model } from '@/game/model.ts'
import { glowing, playbooksShown, shown } from '@/game/reveal.ts'
import { icon } from '@/lib/icons'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CHIPS, FIGURE, PANEL, WELL, type Tone, meter, ring, tool, toneText } from './bits.ts'

/* ==========================================================================
   The HUD: the company at a glance on the left, the controls on the right,
   and the goal and the last change in the middle.
   ========================================================================== */

/** A phone shows Apdex before Insight, Errors and Latency, which scroll off the edge. */
const CHIP_ORDER: Record<string, string> = {
  Insight: 'compact:order-1',
  Errors: 'compact:order-2',
  p99: 'compact:order-3',
  Latency: 'compact:order-3',
  SLO: 'compact:order-2',
}

/** One stat: a glyph and its name, then the value and a short note. */
const stat = (
  name: string,
  glyph: IconNode,
  value: string,
  note: string,
  tone: Tone,
  h: HtmlBuilder<Message>,
  title = name,
  className = '',
): Html =>
  h.div(
    [
      h.Key(name),
      h.Title(title),
      h.Class(
        cn(
          'flex h-8 items-center gap-2.5 px-2.5 compact:shrink-0 compact:gap-1.5 compact:px-3',
          CHIP_ORDER[name],
          className,
        ),
      ),
    ],
    [
      icon(h, glyph, 'size-3.5 shrink-0 text-muted-foreground'),
      h.span(
        [h.Class('w-[46px] shrink-0 text-[11.5px] text-muted-foreground compact:hidden')],
        [name],
      ),
      // With no note, the tone colours the value itself.
      h.span(
        [
          h.Class(
            cn(
              FIGURE,
              'text-[13.5px] leading-none whitespace-nowrap',
              note || tone === 'plain' ? '' : toneText(tone),
            ),
          ),
        ],
        [value],
      ),
      note
        ? h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'ml-auto text-[10px] leading-none whitespace-nowrap compact:ml-0.5',
                  tone === 'plain' ? 'text-muted-foreground' : toneText(tone),
                ),
              ),
            ],
            [note],
          )
        : h.empty,
    ],
  )

const percent = (share: number): string => `${(Math.floor(share * 10_000) / 100).toFixed(2)}%`

/** Availability over the week against the Era's SLO; the error budget left with SLO dashboards. */
const slo = (game: Model['game'], h: HtmlBuilder<Message>): Html => {
  const budget = budgetOf(game)
  const left = Math.max(0, budget.left)
  return stat(
    'SLO',
    ShieldCheck,
    percent(budget.availability),
    has(game, 'slo-dashboards')
      ? budget.left > 0
        ? `${Math.round(left * 100)}% left`
        : 'spent'
      : `/ ${Number((budget.slo * 100).toFixed(2))}%`,
    budget.left > 0.5 ? 'ok' : budget.left > 0 ? 'warn' : 'danger',
    h,
    `Availability this week against ${percent(budget.slo)}. The error budget: ${budget.left > 0 ? `${Math.round(left * 100)}% left` : 'spent'}.`,
  )
}

/** What the toolbar takes from the top row of a phone: the funding row leaves it free. */
const TOOLBAR_ROOM = 'compact:min-h-9 compact:pr-[var(--toolbar-w)]'

const funding = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const era = eraOf(game)
  const next = nextEra(game)
  const share = next ? Math.min(1, game.users / era.raiseAt) : 1
  const ready = canRaise(game)
  const clock = clockOf(game.time)
  return h.div(
    [
      h.Class('flex flex-col gap-1.5 px-2.5 pt-1.5 pb-2 compact:pb-1'),
      h.Title(next ? `${next.name} round at ${compact(era.raiseAt)} users` : era.name),
    ],
    [
      h.div(
        [h.Class(`flex items-center gap-2 ${TOOLBAR_ROOM}`)],
        [
          button(
            {
              onClick: Message.TitleOpened(),
              variant: 'ghost',
              size: 'icon-sm',
              className: '-ml-1.5 text-muted-foreground',
              attributes: [h.AriaLabel('Title screen'), h.Title('Title screen')],
            },
            icon(h, Menu, 'size-4'),
            h,
          ),
          h.span([h.Class('text-[13px] font-semibold compact:shrink-0')], [era.name]),
          h.span(
            [
              h.Class(cn(FIGURE, 'ml-auto text-[10.5px] text-muted-foreground compact:hidden')),
              h.Title('Calendar: one second is one minute'),
            ],
            [
              `D${clock.day} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`,
            ],
          ),
        ],
      ),
      meter(share, ready ? 'bg-ok' : 'bg-primary-fill', h),
      ready && next
        ? button(
            {
              onClick: Message.PanelOpened({ panel: 'offer' }),
              size: 'sm',
              className: 'enter-pop shine mt-1 w-full',
              attributes: [h.Key('offer'), h.DataAttribute('exit', 'gesture')],
            },
            [
              icon(h, Rocket, 'size-3.5'),
              game.stage === PRE_IPO_STAGE ? 'IPO' : `${next.name} offer`,
            ],
            h,
          )
        : h.empty,
    ],
  )
}

/** What the Team builds now: the top of the backlog, and how fast. Opens the Team panel. */
const building = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const item = game.backlog[0]
  const rate = devHoursRate(game, ledger) * 60
  const ready = game.awaiting.length
  return h.button(
    [
      h.Key('building'),
      h.Type('button'),
      h.Title('Team (T)'),
      h.OnClick(Message.PanelOpened({ panel: model.panel === 'team' ? 'none' : 'team' })),
      h.Class(
        cn(
          'enter-pop flex flex-col gap-1.5 rounded-xl px-2.5 py-2 text-left hover:bg-foreground/5 compact:hidden',
        ),
      ),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-2 text-[12px]')],
        [
          icon(h, Hammer, 'size-3.5 shrink-0 text-muted-foreground'),
          h.span(
            [
              h.Class(
                cn('min-w-0 flex-1 truncate', item ? 'font-medium' : 'text-muted-foreground'),
              ),
            ],
            [item ? itemName(item) : 'Idle'],
          ),
          ready > 0
            ? h.span(
                [h.Class(cn(FIGURE, 'text-[10.5px] text-primary-strong'))],
                [`${ready} to deploy`],
              )
            : h.span(
                [h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))],
                [`${rate < 10 ? rate.toFixed(1) : Math.round(rate)} DH/min`],
              ),
        ],
      ),
      item ? meter(item.spent / item.cost, 'bg-ok', h) : h.empty,
    ],
  )
}

export const hud = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const income = has(game, 'stripe') ? ledger.revenue : 0
  const net = income - ledger.burn
  const then = game.history.at(-30)
  const trend = then ? game.users - then.users : 0
  const target = eraOf(game).apdexTarget
  const errors = ledger.errorShare * 100
  const percentiles = has(game, 'percentiles')
  const errorTitle = has(game, 'logs')
    ? Object.entries(ledger.errors)
        .filter(([, value]) => value > 0.005)
        .map(([cause, value]) => `${cause} ${rate(value)}/s`)
        .join(' · ') || 'No errors'
    : 'Research Structured logs to see causes'

  return h.header(
    [
      h.DataAttribute('morph', 'notice'),
      h.Class(
        `absolute top-3 left-3 z-20 flex w-[248px] flex-col gap-1 p-1.5 ${PANEL} compact:pointer-events-auto compact:static compact:w-auto compact:p-1`,
      ),
    ],
    [
      funding(model, h),
      h.div(
        [h.Class(`flex flex-col divide-y divide-hairline ${WELL} ${CHIPS}`)],
        [
          stat(
            'Cash',
            Wallet,
            money(game.cash),
            `${net >= 0 ? '+' : ''}${money(net)}/s`,
            game.cash < 0 ? 'danger' : net >= 0 && income > 0 ? 'ok' : 'plain',
            h,
          ),
          stat(
            'Users',
            Users,
            compact(game.users),
            trend === 0 ? '' : `${trend > 0 ? '▲' : '▼'} ${compact(Math.abs(trend))}`,
            trend >= 0 ? 'ok' : 'danger',
            h,
          ),
          shown(model, 'research')
            ? stat(
                'Insight',
                Gem,
                compact(game.insight),
                `+${ledger.insight.toFixed(1)}/s`,
                'plain',
                h,
                'Insight',
                'enter-pop',
              )
            : h.empty,
          stat(
            'Apdex',
            Smile,
            game.apdex.toFixed(2),
            `/ ${target.toFixed(2)}`,
            game.apdex >= target ? 'ok' : 'danger',
            h,
            `Apdex over the last hour: users grow above ${target.toFixed(2)} and leave below it`,
          ),
          shown(model, 'errors')
            ? stat(
                'Errors',
                TriangleAlert,
                `${errors.toFixed(errors >= 10 ? 0 : 1)}%`,
                '',
                errors < 1 ? 'ok' : errors < 5 ? 'warn' : 'danger',
                h,
                `Errors: ${errorTitle}`,
                cn('enter-pop rounded-lg', glowing(model, 'errors') && 'cue-glow'),
              )
            : h.empty,
          budgeted(game) ? slo(game, h) : h.empty,
          stat(
            percentiles ? 'p99' : 'Latency',
            Timer,
            ms(percentiles ? ledger.p99 : ledger.latency),
            percentiles ? `μ ${ms(ledger.latency)}` : '',
            'plain',
            h,
          ),
        ],
      ),
      game.stage === PRE_IPO_STAGE && !offCompany(model) ? checklist(model, ledger, h) : h.empty,
      game.quarter && !offCompany(model) ? quarterly(model, ledger, h) : h.empty,
      shown(model, 'team') ? building(model, ledger, h) : h.empty,
    ],
  )
}

/** One line of the IPO checklist or the quarter: a mark, a name and its figure. */
const line = (name: string, value: string, tone: Tone, h: HtmlBuilder<Message>, mark?: boolean) =>
  h.div(
    [h.Key(name), h.Class('flex h-6 items-center gap-2 px-2.5 text-[11.5px]')],
    [
      mark === undefined
        ? h.empty
        : icon(
            h,
            mark ? CircleCheck : Circle,
            cn('size-3.5 shrink-0', mark ? 'text-ok' : 'text-muted-foreground'),
          ),
      h.span([h.Class('text-muted-foreground')], [name]),
      h.span(
        [h.Class(cn(FIGURE, 'ml-auto text-[10.5px] whitespace-nowrap', toneText(tone)))],
        [value],
      ),
    ],
  )

/** The IPO checklist (10 "Era 6"): every item at once opens the IPO. */
const checklist = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const items = checklistOf(game, ledger)
  const drillReady = has(game, 'dr-drills') && !game.incident && !(game.drill && !game.drill.done)
  return h.div(
    [h.Key('ipo'), h.Class(`flex flex-col py-1 ${WELL} compact:hidden`)],
    [
      ...items.map((item) => line(item.label, item.value, item.met ? 'ok' : 'plain', h, item.met)),
      has(game, 'dr-drills')
        ? h.div(
            [h.Class('px-1.5 pt-1')],
            [
              button(
                {
                  onClick: Message.DrillRun(),
                  variant: 'outline',
                  size: 'sm',
                  className: 'w-full',
                  attributes: [h.Disabled(!drillReady)],
                },
                [icon(h, DatabaseZap, 'size-3.5'), 'Run DR drill'],
                h,
              ),
            ],
          )
        : h.empty,
    ],
  )
}

const LEVELS = ['Low', 'Mid', 'High'] as const

/** A guidance picker: three levels, open on a quarter's first day. */
const guidance = (
  label: string,
  values: ReadonlyArray<number>,
  chosen: number,
  pick: (level: number) => Message,
  open: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Key(label), h.Class('flex h-7 items-center gap-1 px-2.5 text-[11.5px]')],
    [
      h.span([h.Class('mr-auto text-muted-foreground')], [label]),
      ...values.map((value, level) =>
        h.button(
          [
            h.Type('button'),
            h.Title(`${LEVELS[level]}: ${value}%`),
            h.Disabled(!open && level !== chosen),
            h.AriaPressed(level === chosen ? 'true' : 'false'),
            h.OnClick(pick(level)),
            h.Class(
              cn(
                FIGURE,
                'h-6 min-w-9 rounded-md px-1.5 text-[10.5px] disabled:opacity-35',
                level === chosen ? 'bg-foreground text-background' : 'hover:bg-foreground/5',
              ),
            ),
          ],
          [`${value}%`],
        ),
      ),
    ],
  )

/** The Public quarter (10 "Era 7"): days left, guidance, and the market's verdict. */
const quarterly = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const quarter = game.quarter
  if (!quarter) return h.empty
  const day = Math.min(7, Math.floor((game.time - quarter.startedAt) / 1_440) + 1)
  const value = valuationOf(game, ledger)
  const open = guidanceOpen(game)
  const growth = quarterGrowth(quarter, ledger)
  return h.div(
    [h.Key('quarter'), h.Class(`flex flex-col py-1 ${WELL} compact:hidden`)],
    [
      line(`Quarter ${quarter.index}`, `day ${day} of 7`, 'plain', h),
      guidance(
        'Growth',
        GUIDANCE_GROWTH,
        quarter.growth,
        (level) => Message.GuidanceChosen({ growth: level, margin: quarter.margin }),
        open,
        h,
      ),
      guidance(
        'Margin',
        GUIDANCE_MARGIN,
        quarter.margin,
        (level) => Message.GuidanceChosen({ growth: quarter.growth, margin: level }),
        open,
        h,
      ),
      line(
        'So far',
        `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% · ${marginOf(ledger).toFixed(0)}%`,
        growth >= (GUIDANCE_GROWTH[quarter.growth] ?? 0) &&
          marginOf(ledger) >= (GUIDANCE_MARGIN[quarter.margin] ?? 0)
          ? 'ok'
          : 'warn',
        h,
      ),
      line('Valuation', `${money(value.valuation)} · ×${value.multiple.toFixed(1)}`, 'plain', h),
      quarter.last
        ? line(
            `Q${quarter.index - 1}`,
            quarter.last.beat ? `Beat · streak ${quarter.streak}` : 'Missed',
            quarter.last.beat ? 'ok' : 'danger',
            h,
          )
        : h.empty,
    ],
  )
}

const toolButton = (
  label: string,
  glyph: IconNode,
  message: Message,
  active: boolean,
  h: HtmlBuilder<Message>,
  extra: Html = h.empty,
  cue = false,
): Html =>
  h.button(
    [
      h.Key(label),
      h.Type('button'),
      h.Title(label),
      h.AriaLabel(label),
      h.AriaPressed(active ? 'true' : 'false'),
      h.OnClick(message),
      h.Class(cn(tool(active), 'enter-pop compact:size-9', cue && 'cue-glow')),
    ],
    [icon(h, glyph, 'size-[18px]'), extra],
  )

/** Undo or redo: dimmed when its stack is empty. */
const historyButton = (
  label: string,
  glyph: IconNode,
  message: Message,
  ready: boolean,
  h: HtmlBuilder<Message>,
  cue = false,
): Html =>
  h.button(
    [
      h.Key(label),
      h.Type('button'),
      h.Title(label),
      h.AriaLabel(label),
      h.Disabled(!ready),
      h.OnClick(message),
      h.Class(
        cn(
          tool(false),
          'enter-pop compact:size-9 disabled:opacity-35 disabled:pointer-events-none',
          cue && 'cue-glow',
        ),
      ),
    ],
    [icon(h, glyph, 'size-[18px]')],
  )

const divider = (h: HtmlBuilder<Message>): Html =>
  h.div([h.Class('mx-0.5 h-6 w-px bg-hairline compact:hidden')], [])

export const toolbar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const affordable = researchList.filter(
    (entry) => !has(game, entry.id) && researchReady(game, entry.id) && game.insight >= entry.cost,
  ).length
  return h.nav(
    [
      h.Class(
        `absolute top-3 right-3 z-20 flex items-center gap-1 p-1.5 ${PANEL} compact:pointer-events-auto compact:top-[calc(max(8px,env(safe-area-inset-top))+10px)] compact:right-[calc(max(8px,env(safe-area-inset-right))+10px)] compact:gap-0.5 compact:bg-none compact:p-0 compact:shadow-none`,
      ),
    ],
    [
      offCompany(model) || !shown(model, 'research')
        ? h.empty
        : h.button(
            [
              h.Key('research'),
              h.Type('button'),
              h.Title('Research (R)'),
              h.AriaLabel('Research'),
              h.AriaPressed(model.panel === 'research' ? 'true' : 'false'),
              h.OnClick(
                Message.PanelOpened({ panel: model.panel === 'research' ? 'none' : 'research' }),
              ),
              h.Class(
                cn(
                  tool(model.panel === 'research'),
                  'enter-pop',
                  glowing(model, 'research') && 'cue-glow',
                  'flex w-auto gap-2 px-3 text-[13px] font-medium compact:size-9 compact:px-0 max-2xl:w-9 max-2xl:px-0 max-2xl:justify-center',
                ),
              ),
            ],
            [
              icon(h, FlaskConical, 'size-[18px]'),
              h.span([h.Class('compact:hidden max-2xl:hidden')], ['Research']),
              affordable > 0
                ? h.span(
                    [
                      h.Key('badge'),
                      h.DataAttribute('exit', 'notice'),
                      h.Class(
                        cn(
                          FIGURE,
                          'enter-badge absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-ok px-1 text-[9.5px] leading-none font-semibold text-white shadow-raised',
                        ),
                      ),
                    ],
                    [String(affordable)],
                  )
                : h.empty,
            ],
          ),
      offCompany(model) || !shown(model, 'team')
        ? h.empty
        : h.button(
            [
              h.Key('team'),
              h.Type('button'),
              h.Title('Team (T)'),
              h.AriaLabel('Team'),
              h.AriaPressed(model.panel === 'team' ? 'true' : 'false'),
              h.OnClick(Message.PanelOpened({ panel: model.panel === 'team' ? 'none' : 'team' })),
              h.Class(
                cn(
                  tool(model.panel === 'team'),
                  'enter-pop',
                  glowing(model, 'team') && 'cue-glow',
                  'flex w-auto gap-2 px-3 text-[13px] font-medium compact:size-9 compact:px-0 max-2xl:w-9 max-2xl:px-0 max-2xl:justify-center',
                ),
              ),
            ],
            [
              icon(h, UsersRound, 'size-[18px]'),
              h.span([h.Class('compact:hidden max-2xl:hidden')], ['Team']),
              game.backlog.length === 0
                ? h.span(
                    [
                      h.Class(
                        'enter-badge absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-warn shadow-raised',
                      ),
                    ],
                    [],
                  )
                : h.empty,
            ],
          ),
      !playbooksShown(model)
        ? h.empty
        : toolButton(
            'Playbooks (P)',
            BookCopy,
            Message.PanelOpened({ panel: model.panel === 'playbooks' ? 'none' : 'playbooks' }),
            model.panel === 'playbooks',
            h,
          ),
      has(model.game, 'metrics')
        ? toolButton(
            'Dashboard (D)',
            ChartLine,
            Message.PanelOpened({ panel: model.panel === 'dashboard' ? 'none' : 'dashboard' }),
            model.panel === 'dashboard',
            h,
          )
        : h.empty,
      toolButton(
        'How to play (H)',
        CircleHelp,
        Message.PanelOpened({ panel: model.panel === 'help' ? 'none' : 'help' }),
        model.panel === 'help',
        h,
      ),
      shown(model, 'glossary')
        ? toolButton(
            'Glossary (G)',
            BookOpen,
            model.panel === 'glossary'
              ? Message.PanelClosed()
              : Message.GlossaryOpened({ id: null }),
            model.panel === 'glossary',
            h,
            h.empty,
            glowing(model, 'glossary'),
          )
        : h.empty,
      toolButton(
        'Settings',
        Settings,
        Message.PanelOpened({ panel: model.panel === 'settings' ? 'none' : 'settings' }),
        model.panel === 'settings',
        h,
      ),
      ...(shown(model, 'undo')
        ? [
            divider(h),
            historyButton(
              'Undo (Z)',
              Undo2,
              Message.UndoChosen(),
              undoAvailable(model),
              h,
              glowing(model, 'undo'),
            ),
            historyButton('Redo (Shift+Z)', Redo2, Message.RedoChosen(), redoAvailable(model), h),
          ]
        : []),
      divider(h),
      toolButton(
        model.paused ? 'Resume (Space)' : 'Pause (Space)',
        model.paused ? Play : Pause,
        Message.PauseToggled(),
        model.paused,
        h,
      ),
      h.button(
        [
          h.Key('speed'),
          h.Type('button'),
          h.Title('Speed (S)'),
          h.AriaLabel('Speed (S)'),
          h.OnClick(Message.SpeedCycled()),
          h.Class(cn(tool(model.speed > 1), FIGURE, 'text-[12.5px] font-medium compact:size-9')),
        ],
        [`${model.speed}×`],
      ),
      divider(h),
      toolButton('Fit the board', Scan, Message.BoardFitted(), false, h),
      h.div(
        [h.Class('contents narrow:hidden')],
        [toolButton('Fullscreen (F)', Expand, Message.FullscreenToggled(), false, h)],
      ),
    ],
  )
}

const pill = `flex max-w-[480px] compact:max-w-none items-center gap-2.5 rounded-xl bg-surface px-3 py-2 text-[12.5px] shadow-card`

/** Settling while the Design settles, then what the change did, with Undo. */
const undoButton = (danger: boolean, h: HtmlBuilder<Message>): Html =>
  button(
    {
      onClick: Message.UndoChosen(),
      variant: danger ? 'destructive' : 'outline',
      size: 'icon-sm',
      className: 'enter-badge pointer-events-auto ml-1',
      attributes: [
        h.Key('undo'),
        h.DataAttribute('exit', 'notice'),
        h.Title('Undo (Z)'),
        h.AriaLabel('Undo'),
      ],
    },
    icon(h, Undo2, 'size-3.5'),
    h,
  )

/** One pill from the first change to the delta: Settling morphs into the result,
 *  and the pill leaves when the delta expires. */
export const changeBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const undo = undoAvailable(model)
  const delta = model.delta
  if (!model.change && !delta) return h.empty
  const body = model.change
    ? h.span(
        [
          h.Key('settling'),
          h.DataAttribute('exit', 'notice'),
          h.Class('swap flex items-center gap-2.5 whitespace-nowrap'),
        ],
        [
          ring(settleProgress(model), 'size-3.5 shrink-0 text-muted-foreground', h),
          h.span(
            [h.Class('text-muted-foreground')],
            [model.change.count > 1 ? `${model.change.count} changes` : model.change.label],
          ),
        ],
      )
    : h.span(
        [
          h.Key(`delta-${delta?.id}`),
          h.DataAttribute('exit', 'notice'),
          h.Class('swap flex items-center gap-2.5 whitespace-nowrap'),
        ],
        [
          h.span(
            [h.Class(`size-2 shrink-0 rounded-full ${delta?.worse ? 'bg-danger' : 'bg-ok'}`)],
            [],
          ),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11.5px]'))],
            [delta ? describeDelta(delta, has(model.game, 'percentiles')) : ''],
          ),
          model.stableTicks > 0
            ? h.span(
                [h.Key('stable'), h.Class('enter-badge text-[11.5px] font-medium text-ok')],
                ['Stable'],
              )
            : h.empty,
        ],
      )
  return h.div(
    [
      h.Key('change'),
      h.DataAttribute('morph', 'notice'),
      h.DataAttribute('exit', 'notice'),
      h.Class(`enter-down ${pill}`),
    ],
    [body, undo ? undoButton(!model.change && !!delta?.worse, h) : h.empty],
  )
}

/**
 * One tab per region from Series C (05 "Zones and regions"). Open regions are
 * tabs; with Multiple regions, each closed one offers to open, at its price.
 */
export const regionTabs = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const open = openRegions(game)
  if (open.length < 2 && !(has(game, 'multi-region') && regional(game))) return h.empty
  return h.nav(
    [
      h.Key('regions'),
      h.AriaLabel('Regions'),
      h.Class(
        'pointer-events-auto flex items-center gap-0.5 rounded-xl bg-surface p-1 shadow-card',
      ),
    ],
    REGIONS.map((region) => {
      const isOpen = open.includes(region)
      const info = REGION_INFO[region]
      return h.button(
        [
          h.Key(region),
          h.Type('button'),
          h.Title(
            isOpen
              ? info.name
              : `Open ${info.name}: ${money(game.sandbox ? 0 : OPEN_REGION_PRICE * eraOf(game).costIndex)}`,
          ),
          h.AriaPressed(model.region === region ? 'true' : 'false'),
          h.OnClick(isOpen ? Message.RegionPicked({ region }) : Message.RegionOpened({ region })),
          h.Class(
            cn(
              FIGURE,
              'h-7 rounded-lg px-2.5 text-[11.5px] font-medium',
              model.region === region
                ? 'bg-foreground text-background'
                : isOpen
                  ? 'hover:bg-foreground/5'
                  : 'text-muted-foreground opacity-60 hover:opacity-100',
            ),
          ),
        ],
        [isOpen ? info.short : `+ ${info.short}`],
      )
    }),
  )
}
