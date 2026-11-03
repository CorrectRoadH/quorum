import * as Effect from 'effect/Effect'
import { Mount } from 'foldkit'
import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowLeft, ArrowRight, Check, Download, Lock } from 'lucide'
import { icon } from '@/lib/icons'
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  ERAS,
  MUTATORS,
  MUTATOR_IDS,
  PERKS,
  PERK_IDS,
  VENTURES,
  VENTURE_IDS,
  EXITS,
} from '@quorum/simulation/catalog'
import { foundingOf, levelOf, perkPrice } from '@quorum/simulation/founder'
import { legacyMultiplier, startEra } from '@quorum/simulation/founding'
import { eraOf } from '@quorum/simulation/lookups'
import { CHALLENGES, challengeOpen, dailyDrill } from '@quorum/simulation/challenges'
import { GUIDED, TRACKS, sandboxOpen, type SandboxId } from '@quorum/simulation/sandbox'
import { clock, compact } from './format.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { menuOf } from './route.ts'
import { play } from './sound.ts'

/* ==========================================================================
   The title screen: the night shift. One 16:10 stage, 1600 x 1000 units,
   scales as a whole so the menu's port, the overlay cable and the bench's
   lead cable always meet. The bench is the game idling (Factorio's menu
   world); the menu is a node wired into it (Upload Labs). Pointing at an
   item lifts the machines it touches.
   ========================================================================== */

/** Stage units to percentages of the stage box. */
const x = (u: number) => `${u / 16}%`
const y = (u: number) => `${u / 10}%`

/** The bench SVG is 640 x 360 and sits here, at this scale, bleeding off the right. */
const BENCH = { left: 560, top: 190, width: 1120 }
const S = BENCH.width / 640
const fromBench = (bx: number, by: number) => [BENCH.left + bx * S, BENCH.top + by * S] as const

/** The lead cable's points in the bench SVG, from apps/web/art/figures/hero.mjs:
 *  where it meets the users plate, where it crosses the front edge, and where it ends below. */
const LEAD_PLATE = fromBench(74.07, 102.86)
const LEAD_EDGE = fromBench(48.44, 115.68)
const LEAD_END = fromBench(48.44, 140.69)

const MENU = { left: 96, top: 470, width: 400, pad: 8, row: 64 }
/** Where the menu must end, in stage units. */
const MENU_BOTTOM = 900
const PORT = [MENU.left + MENU.width, MENU.top + MENU.pad + MENU.row / 2] as const

/** Once assembled, the bench floats this many units up and back; the cable's end follows it. */
const FLOAT = 10
const cable = (lift: number) =>
  `M${PORT[0]} ${PORT[1]} C${PORT[0] + 70} ${PORT[1]} ${LEAD_END[0]} ${PORT[1] + 26 - lift} ${LEAD_END[0]} ${LEAD_END[1] - lift}`
const CABLE = cable(0)
const CABLE_STYLE = { '--cable-raised': `path("${cable(FLOAT)}")` }

/** The bench's footprint on the floor below it, where its shadow falls. */
const FLOOR = '858,283 1649,678 1382,811 592,416'

const ROUTE = `${CABLE} L${LEAD_EDGE[0]} ${LEAD_EDGE[1]} L${LEAD_PLATE[0]} ${LEAD_PLATE[1]}`

/* --------------------------------------------------------------------------
   The bench, inlined so page CSS reaches its machines. Both SVG clocks are
   reset together, so a packet on the menu cable reaches the users plate as
   the bench sends its next request on.
   -------------------------------------------------------------------------- */

const BenchMounted = Mount.define('BenchMounted', {
  messages: [Message.Synced],
  execute: ({ element }) =>
    Effect.tryPromise(() => fetch('/art/hero.svg').then((response) => response.text())).pipe(
      Effect.orElseSucceed(() => ''),
      Effect.map((svg) => {
        element.innerHTML = svg
        for (const clockRoot of element.closest('.title-stage')?.querySelectorAll('svg') ?? [])
          if (clockRoot instanceof SVGSVGElement) clockRoot.setCurrentTime(0)
        return Message.Synced()
      }),
    ),
})

/* --------------------------------------------------------------------------
   Sounds. Each bench pop sounds as its animation starts: the plates stamp down
   on a rising pentatonic scale, left to right. Menu items blip under the
   pointer and beep when chosen.
   -------------------------------------------------------------------------- */

const SCALE = [0, 2, 4, 7, 9, 12, 14]

const TitleSounds = Mount.define('TitleSounds', {
  messages: [Message.Synced],
  execute: ({ element }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        let bursts = 0
        const onAnimationStart = (event: Event) => {
          if (!(event instanceof AnimationEvent) || event.animationName !== 'iso-pop') return
          if (!(event.target instanceof Element)) return
          if (event.target.classList.contains('slam'))
            play('burst', 2 ** (SCALE[bursts++ % SCALE.length]! / 12))
          else play('pop')
        }
        const aimOf = (target: EventTarget | null) =>
          target instanceof Element ? target.closest('[data-aim]') : null
        const onPointerOver = (event: Event) => {
          if (!(event instanceof PointerEvent) || event.pointerType === 'touch') return
          const aim = aimOf(event.target)
          if (aim && aim !== aimOf(event.relatedTarget)) play('hover')
        }
        const onClick = (event: Event) => {
          if (aimOf(event.target)) play('choose')
        }
        element.addEventListener('animationstart', onAnimationStart)
        element.addEventListener('pointerover', onPointerOver)
        element.addEventListener('click', onClick)
        return () => {
          element.removeEventListener('animationstart', onAnimationStart)
          element.removeEventListener('pointerover', onPointerOver)
          element.removeEventListener('click', onClick)
        }
      }),
      (cleanup) => Effect.sync(cleanup),
    ).pipe(Effect.as(Message.Synced())),
})

/* --------------------------------------------------------------------------
   The wordmark. Monoline geometric lowercase on a 100-unit x-height with a
   22-unit stroke; the q's tail is a link that ends in a lit node.
   -------------------------------------------------------------------------- */

const GLYPHS: ReadonlyArray<{ at: number; paths: ReadonlyArray<string> }> = [
  { at: 0, paths: ['M89 11V150', 'M50 11a39 39 0 1 0 0.01 0'] },
  { at: 120, paths: ['M11 0V50a39 39 0 0 0 78 0', 'M89 0V100'] },
  { at: 240, paths: ['M50 11a39 39 0 1 0 0.01 0'] },
  { at: 360, paths: ['M11 0V100', 'M11 50a39 39 0 0 1 39-39H60'] },
  { at: 440, paths: ['M11 0V50a39 39 0 0 0 78 0', 'M89 0V100'] },
  {
    at: 560,
    paths: ['M11 0V100', 'M11 45a34.5 34.5 0 0 1 69 0V100', 'M80 45a34.5 34.5 0 0 1 69 0V100'],
  },
]

const wordmark = (h: HtmlBuilder<Message>): Html =>
  h.svg(
    [
      h.ViewBox('0 0 720 194'),
      h.Class('title-wordmark absolute overflow-visible text-foreground'),
      h.Style({ left: x(MENU.left), top: y(282), width: x(420) }),
      h.Role('img'),
      h.AriaLabel('Quorum'),
    ],
    [
      ...GLYPHS.flatMap(({ at, paths }, letter) =>
        paths.map((d) =>
          h.path([
            h.D(d),
            h.Transform(`translate(${at} 0)`),
            h.PathLength('1'),
            h.Fill('none'),
            h.Stroke('currentColor'),
            h.StrokeWidth('22'),
            h.Style({ 'animation-delay': `${letter * 70}ms` }),
          ]),
        ),
      ),
      h.circle([h.Class('title-node'), h.Cx('89'), h.Cy('180'), h.R('14')]),
    ],
  )

/* --------------------------------------------------------------------------
   The menu: a node with one output port. `aim` names the machines an item
   touches, which the stylesheet lifts while the item is pointed at.
   -------------------------------------------------------------------------- */

const item = (
  label: string,
  detail: string,
  aim: string,
  message: Message,
  primary: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.button(
    [
      h.Key(label),
      h.Type('button'),
      h.OnClick(message),
      h.DataAttribute('aim', aim),
      h.Class(
        `press group relative flex w-full items-center justify-between gap-4 rounded-[calc(var(--u)*1)] px-[calc(var(--u)*1.5)] text-left ${
          primary
            ? 'h-[calc(var(--u)*4)] bg-primary-fill text-on-primary-fill shadow-primary hover:brightness-105'
            : 'h-[calc(var(--u)*3)] text-muted-foreground hover:bg-muted hover:text-foreground'
        }`,
      ),
    ],
    [
      primary ? h.empty : h.span([h.Class('title-marker')], []),
      h.span(
        [h.Class('flex flex-col')],
        [
          h.span([h.Class('text-[max(13px,calc(var(--u)*1.05))] font-medium')], [label]),
          detail
            ? h.span(
                [h.Class('font-mono text-[max(11px,calc(var(--u)*0.78))] tabular-nums opacity-60')],
                [detail],
              )
            : h.empty,
        ],
      ),
      h.span(
        [
          h.Class(
            `transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 ${primary ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'}`,
          ),
        ],
        [icon(h, ArrowRight, 'size-4')],
      ),
    ],
  )

/** A guided Sandbox in the Sandbox menu: passed ones show a check, closed ones a lock. */
const guidedItem = (model: Model, id: SandboxId, h: HtmlBuilder<Message>): Html => {
  const open = sandboxOpen(id, model.passed)
  const passed = model.passed.includes(id)
  return h.button(
    [
      h.Key(id),
      h.Type('button'),
      h.Disabled(!open),
      h.OnClick(Message.GuidedStarted({ id })),
      h.DataAttribute('aim', open ? 'server' : ''),
      h.Class(
        `press group relative flex h-[calc(var(--u)*2.3)] w-full items-center justify-between gap-4 rounded-[calc(var(--u)*1)] px-[calc(var(--u)*1.5)] text-left text-[max(13px,calc(var(--u)*1.05))] font-medium ${
          open
            ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
            : 'cursor-not-allowed text-muted-foreground/45'
        }`,
      ),
    ],
    [
      open ? h.span([h.Class('title-marker')], []) : h.empty,
      h.span([], [GUIDED[id].name]),
      passed
        ? icon(h, Check, 'size-4 text-ok')
        : open
          ? h.span(
              [h.Class('opacity-0 transition-opacity duration-150 group-hover:opacity-60')],
              [icon(h, ArrowRight, 'size-4')],
            )
          : icon(h, Lock, 'size-3.5'),
    ],
  )
}

const trackLabel = (text: string, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Key(`track-${text}`),
      h.Class(
        'px-[calc(var(--u)*1.5)] pt-[calc(var(--u)*0.6)] pb-[calc(var(--u)*0.1)] font-mono text-[max(10px,calc(var(--u)*0.72))] tracking-[0.1em] text-muted-foreground uppercase',
      ),
    ],
    [text],
  )

const sandboxMenu = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  h.button(
    [
      h.Key('back'),
      h.Type('button'),
      h.OnClick(Message.MenuChosen({ menu: 'main' })),
      h.Class(
        'press flex h-[calc(var(--u)*2.6)] shrink-0 items-center gap-2 rounded-[calc(var(--u)*1)] px-[calc(var(--u)*1.5)] text-[max(13px,calc(var(--u)*1.05))] font-semibold hover:bg-muted',
      ),
    ],
    [icon(h, ArrowLeft, 'size-4 text-muted-foreground'), 'Sandbox'],
  ),
  ...TRACKS.flatMap((track) => [
    trackLabel(ERAS[track.stage]?.name ?? '', h),
    ...track.sandboxes.map((id) => guidedItem(model, id, h)),
  ]),
  h.div(
    [
      h.Key('rule'),
      h.Class('mx-[calc(var(--u)*1.5)] my-[calc(var(--u)*0.4)] h-px shrink-0 bg-hairline'),
    ],
    [],
  ),
  item(
    'Free Sandbox',
    '',
    'users lb server cache database',
    Message.FreeSandboxStarted(),
    false,
    h,
  ),
]

const back = (label: string, h: HtmlBuilder<Message>, right: Html = h.empty): Html =>
  h.div(
    [
      h.Key('back'),
      h.Class('flex shrink-0 items-center justify-between gap-2 pr-[calc(var(--u)*1)]'),
    ],
    [
      h.button(
        [
          h.Type('button'),
          h.OnClick(Message.MenuChosen({ menu: 'main' })),
          h.Class(
            'press flex h-[calc(var(--u)*2.6)] items-center gap-2 rounded-[calc(var(--u)*1)] px-[calc(var(--u)*1.5)] text-[max(13px,calc(var(--u)*1.05))] font-semibold hover:bg-muted',
          ),
        ],
        [icon(h, ArrowLeft, 'size-4 text-muted-foreground'), label],
      ),
      right,
    ],
  )

const legacyBadge = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.span(
    [h.Class('font-mono text-[max(11px,calc(var(--u)*0.8))] tabular-nums text-muted-foreground')],
    [`${model.founder.legacy} Legacy`],
  )

/** A row of a list page: a name, a short figure, and a state on the right. */
const listRow = (
  key: string,
  label: string,
  detail: string,
  right: Html | string,
  message: Message | null,
  selected: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.button(
    [
      h.Key(key),
      h.Type('button'),
      h.Disabled(message === null),
      ...(message ? [h.OnClick(message)] : []),
      h.AriaPressed(selected ? 'true' : 'false'),
      h.Class(
        `press flex min-h-[calc(var(--u)*2.4)] w-full items-center justify-between gap-3 rounded-[calc(var(--u)*0.8)] px-[calc(var(--u)*1.5)] py-[calc(var(--u)*0.35)] text-left ${
          selected
            ? 'bg-muted text-foreground'
            : message
              ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
              : 'cursor-not-allowed text-muted-foreground/45'
        }`,
      ),
    ],
    [
      h.span(
        [h.Class('flex min-w-0 flex-col')],
        [
          h.span([h.Class('text-[max(13px,calc(var(--u)*1))] font-medium')], [label]),
          detail
            ? h.span(
                [h.Class('truncate text-[max(11px,calc(var(--u)*0.72))] opacity-70')],
                [detail],
              )
            : h.empty,
        ],
      ),
      typeof right === 'string'
        ? h.span(
            [h.Class('shrink-0 font-mono text-[max(11px,calc(var(--u)*0.78))] tabular-nums')],
            [right],
          )
        : right,
    ],
  )

const foundMenu = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const founder = model.founder
  const founding = foundingOf(founder)
  return [
    back('New company', h, legacyBadge(model, h)),
    trackLabel('Venture', h),
    ...VENTURE_IDS.map((id) => {
      const def = VENTURES[id]
      const owned = founder.ventures.includes(id)
      return listRow(
        id,
        def.name,
        def.summary,
        owned
          ? id === founding.venture
            ? icon(h, Check, 'size-4 text-ok')
            : `×${def.legacy.toFixed(1)}`
          : def.bootstrapped
            ? icon(h, Lock, 'size-3.5')
            : `${def.cost} Legacy`,
        owned || (!def.bootstrapped && founder.legacy >= def.cost)
          ? Message.VentureChosen({ id })
          : null,
        id === founding.venture,
        h,
      )
    }),
    trackLabel('Mutators', h),
    ...MUTATOR_IDS.map((id) =>
      listRow(
        id,
        MUTATORS[id].name,
        MUTATORS[id].rule,
        founder.mutators.includes(id)
          ? founding.mutators.includes(id)
            ? icon(h, Check, 'size-4 text-ok')
            : `+${Math.round(MUTATORS[id].legacy * 100)}%`
          : icon(h, Lock, 'size-3.5'),
        founder.mutators.includes(id) ? Message.MutatorToggled({ id }) : null,
        founding.mutators.includes(id),
        h,
      ),
    ),
    h.div(
      [
        h.Key('rule'),
        h.Class('mx-[calc(var(--u)*1.5)] my-[calc(var(--u)*0.4)] h-px shrink-0 bg-hairline'),
      ],
      [],
    ),
    item(
      'Found',
      `${startEra(founding)} · Legacy ×${legacyMultiplier(founding).toFixed(2)}`,
      'users lb server',
      Message.CompanyFounded(),
      true,
      h,
    ),
  ]
}

const challengesMenu = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const founder = model.founder
  const drill = model.today ? dailyDrill(model.today) : null
  const row = (id: string, name: string, detail: string, legacy: number, open: boolean) =>
    listRow(
      id,
      name,
      detail,
      founder.completed.includes(id)
        ? icon(h, Check, 'size-4 text-ok')
        : open
          ? legacy > 0
            ? `${legacy} Legacy`
            : ''
          : icon(h, Lock, 'size-3.5'),
      open ? Message.ChallengeStarted({ id }) : null,
      false,
      h,
    )
  return [
    back('Challenges', h, legacyBadge(model, h)),
    ...(drill ? [row(drill.id, 'Daily drill', drill.brief, 0, true)] : []),
    ...ERAS.flatMap((era, stage) => {
      const list = CHALLENGES.filter((challenge) => challenge.era === stage)
      return list.length === 0
        ? []
        : [
            trackLabel(era.name, h),
            ...list.map((challenge) =>
              row(
                challenge.id,
                challenge.name,
                challenge.brief,
                challenge.legacy,
                challengeOpen(challenge, founder.completed),
              ),
            ),
          ]
    }),
  ]
}

const legacyMenu = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const founder = model.founder
  return [
    back('Legacy shop', h, legacyBadge(model, h)),
    ...PERK_IDS.map((id) => {
      const def = PERKS[id]
      const level = levelOf(founder, id)
      const price = perkPrice(founder, id)
      return listRow(
        id,
        `${def.name} ${level}/${def.costs.length}`,
        def.effect,
        price === null ? icon(h, Check, 'size-4 text-ok') : `${price} Legacy`,
        price !== null && founder.legacy >= price ? Message.PerkBought({ id }) : null,
        false,
        h,
      )
    }),
  ]
}

const historyMenu = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  back('History', h),
  ...(model.founder.history.length === 0
    ? [trackLabel('No Exits yet', h)]
    : model.founder.history
        .map((row, index) =>
          listRow(
            `h${index}`,
            `${EXITS[row.exit].name} · ${VENTURES[row.founding.venture].name}`,
            `${ERAS[row.stage]?.name ?? ''} · ${compact(row.peak)} users · ${clock(row.time)}`,
            `+${row.legacy}`,
            null,
            false,
            h,
          ),
        )
        .toReversed()),
]

const achievementsMenu = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  back(
    'Achievements',
    h,
    h.span(
      [h.Class('font-mono text-[max(11px,calc(var(--u)*0.8))] tabular-nums text-muted-foreground')],
      [`${model.founder.achievements.length}/${ACHIEVEMENT_IDS.length}`],
    ),
  ),
  h.ul(
    [h.Key('achievements'), h.Class('flex flex-col')],
    ACHIEVEMENT_IDS.map((id) => {
      const def = ACHIEVEMENTS[id]
      const earned = model.founder.achievements.includes(id)
      return h.li(
        [
          h.Key(id),
          h.Class(
            `flex min-h-[calc(var(--u)*2.4)] items-center justify-between gap-3 px-[calc(var(--u)*1.5)] py-[calc(var(--u)*0.35)] ${earned ? 'text-foreground' : 'text-muted-foreground'}`,
          ),
        ],
        [
          h.span(
            [h.Class('flex min-w-0 flex-col')],
            [
              h.span([h.Class('text-[max(13px,calc(var(--u)*1))] font-medium')], [def.name]),
              h.span([h.Class('text-[max(11px,calc(var(--u)*0.72))]')], [def.condition]),
            ],
          ),
          earned
            ? h.span(
                [h.Class('flex shrink-0 items-center text-ok')],
                [icon(h, Check, 'size-4'), h.span([h.Class('sr-only')], ['Earned'])],
              )
            : h.span(
                [h.Class('flex shrink-0 items-center')],
                [icon(h, Lock, 'size-3.5'), h.span([h.Class('sr-only')], ['Not yet'])],
              ),
        ],
      )
    }),
  ),
]

const menu = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  const page = menuOf(model.route)
  return h.nav(
    [
      h.AriaLabel('Main menu'),
      h.Class(
        'title-menu absolute flex flex-col gap-[calc(var(--u)*0.25)] overflow-y-auto [&>*]:shrink-0 overscroll-contain rounded-[calc(var(--u)*1.5)] bg-surface shadow-card',
      ),
      h.Style({
        left: x(MENU.left),
        top: y(MENU.top),
        width: x(MENU.width),
        padding: x(MENU.pad),
        // Above the corner rule and the playtest log button: a longer list scrolls.
        maxHeight: y(MENU_BOTTOM - MENU.top),
      }),
    ],
    page === 'sandbox'
      ? sandboxMenu(model, h)
      : page === 'found'
        ? foundMenu(model, h)
        : page === 'legacy'
          ? legacyMenu(model, h)
          : page === 'history'
            ? historyMenu(model, h)
            : page === 'challenges'
              ? challengesMenu(model, h)
              : page === 'achievements'
                ? achievementsMenu(model, h)
                : [
                    ...(model.saved
                      ? [
                          item(
                            'Continue',
                            `${eraOf(game).name} · ${compact(game.users)} users · ${clock(game.time)}`,
                            'users lb server cache database',
                            Message.Continued(),
                            true,
                            h,
                          ),
                        ]
                      : []),
                    item(
                      model.saved ? 'New company' : 'Start a company',
                      '',
                      'users',
                      model.founder.history.length > 0
                        ? Message.MenuChosen({ menu: 'found' })
                        : Message.NewCompanyStarted(),
                      !model.saved,
                      h,
                    ),
                    ...(model.founder.history.length > 0
                      ? [
                          item(
                            'Legacy shop',
                            `${model.founder.legacy} Legacy`,
                            'server',
                            Message.MenuChosen({ menu: 'legacy' }),
                            false,
                            h,
                          ),
                          item(
                            'History',
                            '',
                            'database',
                            Message.MenuChosen({ menu: 'history' }),
                            false,
                            h,
                          ),
                        ]
                      : []),
                    item('Start in Pre-seed', '', 'lb server', Message.PreseedStarted(), false, h),
                    item(
                      'Sandbox',
                      '',
                      'cache database',
                      Message.MenuChosen({ menu: 'sandbox' }),
                      false,
                      h,
                    ),
                    item(
                      'Challenges',
                      '',
                      'lb server database',
                      Message.MenuChosen({ menu: 'challenges' }),
                      false,
                      h,
                    ),
                    item(
                      'Achievements',
                      '',
                      'server',
                      Message.MenuChosen({ menu: 'achievements' }),
                      false,
                      h,
                    ),
                  ],
  )
}

/* --------------------------------------------------------------------------
   The clock-in splash. Browsers play sound only after a click or key press,
   so a fresh load opens on a badge reader: the badge goes in, the reader
   beeps, and the title boots with its sounds.
   -------------------------------------------------------------------------- */

const ReaderClock = Mount.define('ReaderClock', {
  messages: [Message.Synced],
  execute: ({ element }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const show = () =>
          (element.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }))
        show()
        return setInterval(show, 1000)
      }),
      (timer) => Effect.sync(() => clearInterval(timer)),
    ).pipe(Effect.as(Message.Synced())),
})

const reader = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Key('reader'), h.Class(`reader ${model.gate === 'clocking' ? 'is-in' : ''}`)],
    [
      h.div(
        [h.Class('reader-body')],
        [
          ...['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((at) =>
            h.span([h.Class(`reader-screw ${at}`)], []),
          ),
          h.div(
            [h.Class('reader-screen'), h.AriaLive('polite')],
            [
              h.span([h.Class('reader-time'), h.OnMount(ReaderClock())], ['--:--']),
              h.span(
                [h.Class('reader-status')],
                [
                  h.span([h.Class('reader-status-out')], ['Insert badge']),
                  h.span([h.Class('reader-status-in')], ['Clocked in']),
                ],
              ),
            ],
          ),
          h.span([h.Class('reader-led')], []),
          h.span([h.Class('reader-slot')], []),
        ],
      ),
      h.div(
        [h.Class('reader-well')],
        [
          h.button(
            [
              h.Type('button'),
              h.AriaLabel('Clock in'),
              h.OnClick(Message.ClockedIn()),
              h.Class('reader-card'),
            ],
            [
              h.svg(
                [h.ViewBox('0 0 100 194'), h.Class('reader-card-mark'), h.AriaHidden(true)],
                [
                  ...GLYPHS[0]!.paths.map((d) =>
                    h.path([h.D(d), h.Fill('none'), h.Stroke('currentColor'), h.StrokeWidth('22')]),
                  ),
                  h.circle([h.Class('fill-signal'), h.Cx('89'), h.Cy('180'), h.R('14')]),
                ],
              ),
              h.span([h.Class('reader-card-chip')], []),
              h.span([h.Class('reader-card-name')], ['Founder']),
            ],
          ),
        ],
      ),
    ],
  )

/* --------------------------------------------------------------------------
   The overlay: the cable from the menu's port to the bench's lead, and the
   requests that ride it, four per bench loop.
   -------------------------------------------------------------------------- */

const LOOP = 3.6
const TRAVEL = 1.4
/** When the bench, once assembled, sends its first request on (START in hero.mjs).
 *  Cable packets leave so they reach the users plate just before each one. */
const BENCH_START = 2.3
const FIRST_DEPARTURE = BENCH_START + LOOP / 4 - 0.15 - TRAVEL

const packet = (begin: number, h: HtmlBuilder<Message>): Html =>
  h.g(
    [h.Opacity('0')],
    [
      h.animate([
        h.Attribute('attributeName', 'opacity'),
        h.Attribute('dur', `${LOOP}s`),
        h.Attribute('begin', `${begin}s`),
        h.Attribute('repeatCount', 'indefinite'),
        h.Attribute(
          'keyTimes',
          `0;0.03;${(TRAVEL / LOOP - 0.03).toFixed(3)};${(TRAVEL / LOOP).toFixed(3)};1`,
        ),
        h.Attribute('values', '0;1;1;0;0'),
      ]),
      h.animateMotion([
        h.Attribute('path', ROUTE),
        h.Attribute('dur', `${LOOP}s`),
        h.Attribute('begin', `${begin}s`),
        h.Attribute('repeatCount', 'indefinite'),
        h.Attribute('calcMode', 'linear'),
        h.Attribute('keyPoints', '0;1;1'),
        h.Attribute('keyTimes', `0;${(TRAVEL / LOOP).toFixed(3)};1`),
      ]),
      h.circle([h.R('9'), h.Class('fill-signal opacity-20')]),
      h.circle([h.R('3.8'), h.Class('fill-signal')]),
    ],
  )

const overlay = (h: HtmlBuilder<Message>): Html =>
  h.svg(
    [
      h.ViewBox('0 0 1600 1000'),
      h.Class('title-overlay pointer-events-none absolute inset-0 size-full overflow-visible'),
      h.AriaHidden(true),
    ],
    [
      h.path([h.Class('title-cable-edge'), h.D(CABLE), h.PathLength('1'), h.Style(CABLE_STYLE)]),
      h.path([h.Class('title-cable'), h.D(CABLE), h.PathLength('1'), h.Style(CABLE_STYLE)]),
      h.g(
        [h.Class('title-packets')],
        [0, 1, 2, 3].map((n) => packet(FIRST_DEPARTURE + n * (LOOP / 4), h)),
      ),
      h.circle([h.Class('title-port'), h.Cx(`${PORT[0]}`), h.Cy(`${PORT[1]}`), h.R('9')]),
      h.circle([h.Class('title-port-core'), h.Cx(`${PORT[0]}`), h.Cy(`${PORT[1]}`), h.R('3.5')]),
    ],
  )

/* --------------------------------------------------------------------------
   The drawing frame around the screen: hairline border, corner marks and edge
   rulers. The build stamp at the foot holds the playtest tools.
   -------------------------------------------------------------------------- */

const CORNERS = [
  'top-0 left-0 border-t border-l',
  'top-0 right-0 border-t border-r',
  'bottom-0 left-0 border-b border-l',
  'bottom-0 right-0 border-b border-r',
]

const frame = (h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('title-frame pointer-events-none absolute inset-6')],
    [
      h.span([h.Class('title-ruler title-ruler-x')], []),
      h.span([h.Class('title-ruler title-ruler-y')], []),
      ...CORNERS.map((corner) => h.span([h.Class(`title-corner absolute size-4 ${corner}`)], [])),
    ],
  )

const stamp = (h: HtmlBuilder<Message>): Html =>
  h.footer(
    [
      h.Class(
        'absolute right-10 bottom-9 left-10 flex items-center justify-between font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground uppercase',
      ),
    ],
    [
      h.button(
        [
          h.Type('button'),
          h.OnClick(Message.LogExported()),
          h.DataAttribute('aim', 'database'),
          h.Class(
            'press -mx-2 flex items-center gap-2 rounded-md px-2 py-1 uppercase hover:bg-muted hover:text-foreground',
          ),
        ],
        [icon(h, Download, 'size-3.5'), 'Export playtest log'],
      ),
      h.span([], ['Playtest build']),
    ],
  )

export const titleScreen = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.main(
    [
      h.Class(
        'title-screen dark relative grid h-full place-items-center overflow-hidden bg-page text-foreground',
      ),
      h.OnMount(TitleSounds()),
    ],
    [
      h.div([h.Class('title-grid pointer-events-none absolute inset-0')], []),
      frame(h),
      model.gate !== 'open'
        ? reader(model, h)
        : h.div(
            [h.Key('stage'), h.Class('title-stage relative')],
            [
              h.div(
                [h.Class('title-art')],
                [
                  h.svg(
                    [
                      h.ViewBox('0 0 1600 1000'),
                      h.Class('pointer-events-none absolute inset-0 size-full overflow-visible'),
                      h.AriaHidden(true),
                    ],
                    [h.polygon([h.Class('title-floor'), h.Points(FLOOR)])],
                  ),
                  h.div([
                    h.Key('bench'),
                    h.Class('title-bench absolute'),
                    h.Style({ left: x(BENCH.left), top: y(BENCH.top), width: x(BENCH.width) }),
                    h.OnMount(BenchMounted()),
                  ]),
                ],
              ),
              h.div([h.Class('title-ui')], [wordmark(h), menu(model, h), overlay(h)]),
            ],
          ),
      model.gate === 'open' ? stamp(h) : h.empty,
    ],
  )
