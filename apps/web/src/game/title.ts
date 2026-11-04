import * as Effect from 'effect/Effect'
import { Mount } from 'foldkit'
import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowUpRight, Check, Download, Lock, ScrollText, Settings, Store, Trophy } from 'lucide'
import { icon } from '@/lib/icons'
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  COMPONENTS,
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
import { solveFlow } from '@quorum/simulation/solve'
import type { Game } from '@quorum/simulation/state'
import { CHALLENGES, challengeById, challengeOpen, dailyDrill } from '@quorum/simulation/challenges'
import { GUIDED, TRACKS, sandboxOpen } from '@quorum/simulation/sandbox'
import { clock, compact } from './format.ts'
import { Message } from './message.ts'
import { PrefsMessage } from './prefs.ts'
import type { Model } from './model.ts'
import { menuOf, type MenuPage } from './route.ts'
import { supportedLocales } from '../i18n/index.ts'
import { play } from './sound.ts'

/* ==========================================================================
   The title screen: the on-call booth at night. You sit at the desk, and the
   menu runs on your own monitor like a game's menu: one list, one selection
   bar that follows the pointer and the arrow keys, pages that replace the list
   in place. The keyboard and mouse on the desk answer what you do. The screen
   is the room's only light.
   ========================================================================== */

type Page = typeof MenuPage.Type | 'main'

/* --------------------------------------------------------------------------
   The driver: everything the screen does below the Model. The selection bar is
   focus, so Enter and Space work as they do on any button; the arrows move it,
   Escape and Backspace press Back, the pointer moves it and the desk mouse,
   and each key lights its key on the desk.
   -------------------------------------------------------------------------- */

/** The page the screen showed before main, so Back lands on the row that opened it. */
let lastPage: Page = 'main'

const rowsOf = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>('.booth-list [data-row]')].filter(
    (row) => !(row instanceof HTMLButtonElement && row.disabled),
  )

const BoothDriver = Mount.define('BoothDriver', {
  messages: [Message.Synced],
  execute: ({ element }) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const screen = element.querySelector<HTMLElement>('.booth-screen')
        const mouse = element.querySelector<HTMLElement>('.booth-mouse')
        const keys = [...element.querySelectorAll<HTMLElement>('.booth-key')]
        const light = (name: string) => {
          const key =
            keys.find((key) => key.dataset.k === name) ??
            keys[Math.floor(Math.random() * keys.length)]
          if (!key) return
          key.classList.remove('is-lit')
          void key.offsetWidth
          key.classList.add('is-lit')
        }
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.altKey || event.metaKey || event.ctrlKey) return
          const target = event.target
          if (target instanceof Element && target !== document.body && !element.contains(target))
            return
          if (element.querySelector('.booth-term')) return
          light(event.key === ' ' ? 'Space' : event.key)
          play('tick')
          const rows = rowsOf(element)
          const at = rows.indexOf(document.activeElement as HTMLElement)
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const step = event.key === 'ArrowDown' ? 1 : -1
            const next = rows[at < 0 ? 0 : (at + step + rows.length) % rows.length]
            if (next && next !== rows[at]) {
              next.focus()
              play('hover')
            }
          } else if (['Escape', 'Backspace', 'ArrowLeft'].includes(event.key)) {
            const back = element.querySelector<HTMLElement>('[data-back]')
            if (back) {
              event.preventDefault()
              back.click()
            }
          } else if (
            event.key === 'ArrowRight' ||
            ((event.key === 'Enter' || event.key === ' ') && at < 0)
          ) {
            event.preventDefault()
            if (at < 0) rows[0]?.focus()
            else rows[at]?.click()
          }
        }
        const onPointerOver = (event: Event) => {
          if (!(event instanceof PointerEvent)) return
          const row = event.target instanceof Element ? event.target.closest('[data-row]') : null
          if (!(row instanceof HTMLElement) || row === document.activeElement) return
          if (row instanceof HTMLButtonElement && row.disabled) return
          row.focus({ preventScroll: true })
          if (event.pointerType !== 'touch') play('hover')
        }
        const onPointerMove = (event: Event) => {
          if (!(event instanceof PointerEvent)) return
          if (!screen || event.pointerType === 'touch') return
          const box = screen.getBoundingClientRect()
          const x = event.clientX - box.left
          if (mouse) mouse.style.translate = `${((x / box.width - 0.5) * 60).toFixed(1)}% 0`
        }
        const onPointerDown = () => mouse?.classList.add('is-down')
        const onPointerUp = () => mouse?.classList.remove('is-down')
        const onClick = (event: Event) => {
          if (event.target instanceof Element && event.target.closest('button')) play('choose')
        }
        window.addEventListener('keydown', onKeyDown)
        element.addEventListener('pointerover', onPointerOver)
        element.addEventListener('pointermove', onPointerMove)
        element.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointerup', onPointerUp)
        element.addEventListener('click', onClick)
        return () => {
          window.removeEventListener('keydown', onKeyDown)
          element.removeEventListener('pointerover', onPointerOver)
          element.removeEventListener('pointermove', onPointerMove)
          element.removeEventListener('pointerdown', onPointerDown)
          window.removeEventListener('pointerup', onPointerUp)
          element.removeEventListener('click', onClick)
        }
      }),
      (cleanup) => Effect.sync(cleanup),
    ).pipe(Effect.as(Message.Synced())),
})

/** Each page puts the selection on its first row after Back, or main on the row that opened the last page. */
const PageMounted = Mount.define('PageMounted', {
  messages: [Message.Synced],
  execute: ({ element }) =>
    Effect.sync(() => {
      const page = (element.getAttribute('data-page') ?? 'main') as Page
      const rows = rowsOf(element.parentElement ?? element)
      const from = page === 'main' ? rows.find((row) => row.dataset.to === lastPage) : undefined
      lastPage = page
      ;(from ?? rows.find((row) => !('back' in row.dataset)) ?? rows[0])?.focus({
        preventScroll: true,
      })
      return Message.Synced()
    }),
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

const glyphPaths = (
  paths: ReadonlyArray<string>,
  at: number,
  delay: number,
  h: HtmlBuilder<Message>,
) =>
  paths.map((d) =>
    h.path([
      h.D(d),
      h.Transform(`translate(${at} 0)`),
      h.PathLength('1'),
      h.Style({ 'animation-delay': `${delay}ms` }),
    ]),
  )

const wordmark = (h: HtmlBuilder<Message>): Html =>
  h.svg(
    [h.ViewBox('0 0 720 194'), h.Class('booth-wordmark'), h.Role('img'), h.AriaLabel('Quorum')],
    [
      ...GLYPHS.flatMap(({ at, paths }, letter) => glyphPaths(paths, at, 300 + letter * 70, h)),
      h.circle([h.Cx('89'), h.Cy('180'), h.R('14')]),
    ],
  )

/* --------------------------------------------------------------------------
   Rows. Every page is one list of rows: actions are buttons, records (history,
   achievements) are rows the selection can still rest on.
   -------------------------------------------------------------------------- */

type Row = Readonly<{
  key: string
  label: string
  detail?: string
  side?: Html | string | undefined
  message: Message | null
  big?: boolean
  back?: boolean
  to?: Page
  pressed?: boolean
  record?: boolean
}>

const row = (r: Row, h: HtmlBuilder<Message>): Html => {
  const body = [
    r.back ? h.span([h.Class('booth-mark'), h.AriaHidden(true)], ['‹']) : h.empty,
    h.span(
      [h.Class('booth-label')],
      [h.span([], [r.label]), r.detail ? h.span([h.Class('booth-detail')], [r.detail]) : h.empty],
    ),
    r.side === undefined
      ? h.empty
      : typeof r.side === 'string'
        ? h.span([h.Class('booth-side')], [r.side])
        : h.span([h.Class('booth-side')], [r.side]),
  ]
  const className = `booth-row ${r.big ? 'is-big' : ''} ${r.back ? 'is-back' : ''}`
  if (r.record)
    return h.div(
      [h.Key(r.key), h.Tabindex(-1), h.DataAttribute('row', ''), h.Class(`${className} is-record`)],
      body,
    )
  return h.button(
    [
      h.Key(r.key),
      h.Type('button'),
      h.Disabled(r.message === null),
      ...(r.message ? [h.OnClick(r.message)] : []),
      h.DataAttribute('row', ''),
      ...(r.back ? [h.DataAttribute('back', '')] : []),
      ...(r.to ? [h.DataAttribute('to', r.to)] : []),
      ...(r.pressed === undefined ? [] : [h.AriaPressed(r.pressed ? 'true' : 'false')]),
      h.Class(className),
    ],
    body,
  )
}

const done = (h: HtmlBuilder<Message>) => icon(h, Check, 'booth-icon text-ok')
const locked = (h: HtmlBuilder<Message>) => icon(h, Lock, 'booth-icon')

const backRow = (h: HtmlBuilder<Message>): Html =>
  row({ key: 'back', label: 'Back', message: Message.MenuChosen({ menu: 'main' }), back: true }, h)

const group = (text: string, h: HtmlBuilder<Message>): Html =>
  h.span([h.Key(`group-${text}`), h.Class('booth-group')], [text])

const mainRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const game = model.board.game
  const veteran = model.founder.history.length > 0
  return [
    ...(model.saved
      ? [
          row(
            {
              key: 'continue',
              label: 'Continue',
              detail: `${eraOf(game).name} · ${compact(game.users)} users · ${clock(game.time)}`,
              message: Message.Continued(),
              big: true,
            },
            h,
          ),
        ]
      : []),
    row(
      {
        key: 'new',
        label: model.saved ? 'New company' : 'Start a company',
        message: veteran ? Message.MenuChosen({ menu: 'found' }) : Message.NewCompanyStarted(),
        big: !model.saved,
        to: 'found',
      },
      h,
    ),
    row({ key: 'preseed', label: 'Start in Pre-seed', message: Message.PreseedStarted() }, h),
    row(
      {
        key: 'sandbox',
        label: 'Sandbox',
        message: Message.MenuChosen({ menu: 'sandbox' }),
        to: 'sandbox',
      },
      h,
    ),
    row(
      {
        key: 'challenges',
        label: 'Challenges',
        message: Message.MenuChosen({ menu: 'challenges' }),
        to: 'challenges',
      },
      h,
    ),
  ]
}

const sandboxRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  backRow(h),
  ...TRACKS.flatMap((track) => [
    group(ERAS[track.stage]?.name ?? '', h),
    ...track.sandboxes.map((id) => {
      const open = sandboxOpen(id, model.passed)
      return row(
        {
          key: id,
          label: GUIDED[id].name,
          side: model.passed.includes(id) ? done(h) : open ? undefined : locked(h),
          message: open ? Message.GuidedStarted({ id }) : null,
        },
        h,
      )
    }),
  ]),
  group('', h),
  row({ key: 'free', label: 'Free Sandbox', message: Message.FreeSandboxStarted() }, h),
]

const foundRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const founder = model.founder
  const founding = foundingOf(founder)
  return [
    backRow(h),
    group('Venture', h),
    ...VENTURE_IDS.map((id) => {
      const def = VENTURES[id]
      const owned = founder.ventures.includes(id)
      return row(
        {
          key: id,
          label: def.name,
          detail: def.summary,
          side: owned
            ? id === founding.venture
              ? done(h)
              : `×${def.legacy.toFixed(1)}`
            : def.bootstrapped
              ? locked(h)
              : `${def.cost} Legacy`,
          message:
            owned || (!def.bootstrapped && founder.legacy >= def.cost)
              ? Message.VentureChosen({ id })
              : null,
          pressed: id === founding.venture,
        },
        h,
      )
    }),
    group('Mutators', h),
    ...MUTATOR_IDS.map((id) =>
      row(
        {
          key: id,
          label: MUTATORS[id].name,
          detail: MUTATORS[id].rule,
          side: founder.mutators.includes(id)
            ? founding.mutators.includes(id)
              ? done(h)
              : `+${Math.round(MUTATORS[id].legacy * 100)}%`
            : locked(h),
          message: founder.mutators.includes(id) ? Message.MutatorToggled({ id }) : null,
          pressed: founding.mutators.includes(id),
        },
        h,
      ),
    ),
    group('', h),
    row(
      {
        key: 'found',
        label: 'Found',
        detail: `${startEra(founding)} · Legacy ×${legacyMultiplier(founding).toFixed(2)}`,
        message: Message.CompanyFounded(),
        big: true,
      },
      h,
    ),
  ]
}

const challengeRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const founder = model.founder
  const drill = model.today ? dailyDrill(model.today) : null
  const challenge = (id: string, name: string, detail: string, legacy: number, open: boolean) =>
    row(
      {
        key: id,
        label: name,
        detail,
        side: founder.completed.includes(id)
          ? done(h)
          : open
            ? legacy > 0
              ? `${legacy} Legacy`
              : undefined
            : locked(h),
        message: open ? Message.ChallengeStarted({ id }) : null,
      },
      h,
    )
  return [
    backRow(h),
    ...(drill ? [challenge(drill.id, 'Daily drill', drill.brief, 0, true)] : []),
    ...ERAS.flatMap((era, stage) => {
      const list = CHALLENGES.filter((entry) => entry.era === stage)
      return list.length === 0
        ? []
        : [
            group(era.name, h),
            ...list.map((entry) =>
              challenge(
                entry.id,
                entry.name,
                entry.brief,
                entry.legacy,
                challengeOpen(entry, founder.completed),
              ),
            ),
          ]
    }),
  ]
}

const legacyRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  backRow(h),
  ...PERK_IDS.map((id) => {
    const def = PERKS[id]
    const price = perkPrice(model.founder, id)
    return row(
      {
        key: id,
        label: `${def.name} ${levelOf(model.founder, id)}/${def.costs.length}`,
        detail: def.effect,
        side: price === null ? done(h) : `${price} Legacy`,
        message:
          price !== null && model.founder.legacy >= price ? Message.PerkBought({ id }) : null,
      },
      h,
    )
  }),
]

const historyRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  backRow(h),
  ...(model.founder.history.length === 0
    ? [group('No Exits yet', h)]
    : model.founder.history
        .map((entry, index) =>
          row(
            {
              key: `h${index}`,
              label: `${EXITS[entry.exit].name} · ${VENTURES[entry.founding.venture].name}`,
              detail: `${ERAS[entry.stage]?.name ?? ''} · ${compact(entry.peak)} users · ${clock(entry.time)}`,
              side: `+${entry.legacy}`,
              message: null,
              record: true,
            },
            h,
          ),
        )
        .toReversed()),
]

const achievementRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => [
  backRow(h),
  ...ACHIEVEMENT_IDS.map((id) => {
    const earned = model.founder.achievements.includes(id)
    return row(
      {
        key: id,
        label: ACHIEVEMENTS[id].name,
        detail: ACHIEVEMENTS[id].condition,
        side: h.span(
          [h.Class('flex items-center')],
          [
            earned ? done(h) : locked(h),
            h.span([h.Class('sr-only')], [earned ? 'Earned' : 'Not yet']),
          ],
        ),
        message: null,
        record: true,
      },
      h,
    )
  }),
]

/** Settings as rows: each switch shows On or Off, and Language steps to the next one. */
const settingsRows = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const at = supportedLocales.findIndex(({ value }) => value === model.prefs.locale)
  const next = supportedLocales[(at + 1) % supportedLocales.length]!
  const toggle = (key: string, label: string, on: boolean, message: Message) =>
    row({ key, label, side: on ? 'On' : 'Off', message, pressed: on }, h)
  return [
    backRow(h),
    toggle(
      'muted',
      'Mute sound (M)',
      model.prefs.muted,
      Message.PrefsChanged({ message: PrefsMessage.MuteToggled() }),
    ),
    toggle(
      'auto-pause',
      'Pause on SEV1 and SEV2',
      model.prefs.autoPause,
      Message.PrefsChanged({ message: PrefsMessage.AutoPauseToggled() }),
    ),
    toggle(
      'blur-pause',
      'Pause when the window loses focus',
      model.prefs.blurPause,
      Message.PrefsChanged({ message: PrefsMessage.BlurPauseToggled() }),
    ),
    toggle(
      'motion',
      'Reduce motion',
      model.prefs.motion === 'reduce',
      Message.PrefsChanged({ message: PrefsMessage.MotionToggled() }),
    ),
    toggle(
      'agent',
      'Agent access',
      model.prefs.agentAccess,
      Message.PrefsChanged({ message: PrefsMessage.AgentAccessToggled() }),
    ),
    row(
      {
        key: 'language',
        label: 'Language',
        side: supportedLocales[at]?.label ?? '',
        message: Message.PrefsChanged({
          message: PrefsMessage.LocaleChosen({ locale: next.value }),
        }),
      },
      h,
    ),
    row({ key: 'copy', label: 'Copy state as JSON', message: Message.StateCopied() }, h),
  ]
}

const PAGES: Record<
  Page,
  Readonly<{ title: string; rows: (model: Model, h: HtmlBuilder<Message>) => ReadonlyArray<Html> }>
> = {
  main: { title: '', rows: mainRows },
  found: { title: 'New company', rows: foundRows },
  sandbox: { title: 'Sandbox', rows: sandboxRows },
  challenges: { title: 'Challenges', rows: challengeRows },
  legacy: { title: 'Legacy shop', rows: legacyRows },
  history: { title: 'History', rows: historyRows },
  achievements: { title: 'Achievements', rows: achievementRows },
  settings: { title: 'Settings', rows: settingsRows },
}

/** A page's heading: where it is, and the figure it spends or counts. */
const crumb = (model: Model, page: Page, h: HtmlBuilder<Message>): Html => {
  const figure =
    page === 'found' || page === 'challenges' || page === 'legacy'
      ? `${model.founder.legacy} Legacy`
      : page === 'achievements'
        ? `${model.founder.achievements.length}/${ACHIEVEMENT_IDS.length}`
        : ''
  return h.div(
    [h.Class('booth-crumb')],
    page === 'main'
      ? []
      : [
          h.span([], ['Main menu']),
          h.span([h.AriaHidden(true)], [' › ']),
          h.b([], [PAGES[page].title]),
          figure ? h.span([h.Class('booth-figure')], [figure]) : h.empty,
        ],
  )
}

const hint = (h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('booth-hint'), h.AriaHidden(true)],
    [
      ['↑↓', 'Select'],
      ['Enter', 'Open'],
      ['Esc', 'Back'],
    ].map(([key, label]) => h.span([], [h.kbd([], [key ?? '']), h.span([], [label ?? ''])])),
  )

/* --------------------------------------------------------------------------
   The status column: the saved Company at a glance, from the save itself.
   -------------------------------------------------------------------------- */

/** The busiest Node of the saved Design, by utilization. */
const busiest = (game: Game): { name: string; load: number } | null => {
  const flow = solveFlow(game)
  let best: { name: string; load: number } | null = null
  for (const node of game.nodes) {
    if (COMPONENTS[node.type].fixed) continue
    const load = flow.nodes[node.id]?.utilization ?? 0
    if (!best || load > best.load) best = { name: COMPONENTS[node.type].name, load }
  }
  return best
}

/** The users line over the last Samples, in a 100 x 30 box. */
const sparkOf = (game: Game): string => {
  const users = game.history.slice(-60).map((sample) => sample.users)
  if (users.length < 2) return ''
  const low = Math.min(...users)
  const span = Math.max(...users) - low || 1
  return `M${users
    .map(
      (value, i) =>
        `${((i / (users.length - 1)) * 100).toFixed(1)} ${(28 - ((value - low) / span) * 26).toFixed(1)}`,
    )
    .join(' L')}`
}

const status = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.board.game
  const hot = busiest(game)
  const spark = sparkOf(game)
  const tone = !hot ? '' : hot.load >= 0.9 ? 'is-bad' : hot.load >= 0.7 ? 'is-warn' : 'is-ok'
  return h.aside(
    [h.Class('booth-status')],
    [
      h.span(
        [h.Class('booth-status-era')],
        [h.span([], [eraOf(game).name]), ` · ${clock(game.time)}`],
      ),
      h.span([h.Class('booth-status-users')], [compact(game.users)]),
      h.span([h.Class('booth-status-unit')], ['users']),
      spark
        ? h.svg(
            [
              h.ViewBox('0 0 100 30'),
              h.Attribute('preserveAspectRatio', 'none'),
              h.AriaHidden(true),
            ],
            [h.path([h.D(spark)])],
          )
        : h.empty,
      hot
        ? h.span(
            [h.Class(`booth-status-hot ${tone}`)],
            [h.i([], []), h.span([], [hot.name]), ` ${Math.round(hot.load * 100)}%`],
          )
        : h.empty,
    ],
  )
}

/* --------------------------------------------------------------------------
   The taskbar: the Founder's pages, Settings, and the wall clock.
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

const taskbar = (model: Model, page: Page, h: HtmlBuilder<Message>): Html => {
  const tool = (
    menu: typeof MenuPage.Type,
    label: string,
    glyph: Parameters<typeof icon>[1],
    extra = '',
  ) =>
    h.button(
      [
        h.Key(menu),
        h.Type('button'),
        h.Title(label),
        h.AriaLabel(label),
        h.AriaPressed(page === menu ? 'true' : 'false'),
        h.OnClick(Message.MenuChosen({ menu: page === menu ? 'main' : menu })),
      ],
      [icon(h, glyph, 'booth-icon'), extra ? h.span([h.Class('booth-figure')], [extra]) : h.empty],
    )
  const veteran = model.founder.history.length > 0
  return h.nav(
    [h.Class('booth-taskbar'), h.AriaLabel('Taskbar')],
    [
      ...(veteran
        ? [
            tool('legacy', 'Legacy shop', Store, `${model.founder.legacy}`),
            tool('history', 'History', ScrollText),
          ]
        : []),
      tool('achievements', 'Achievements', Trophy),
      tool('settings', 'Settings', Settings),
      h.span([h.Class('booth-clock'), h.OnMount(ReaderClock())], ['--:--']),
    ],
  )
}

/** The host the monitor connects to, and what it restores there: the Company, a Sandbox, or a Challenge. */
const sessionOf = (model: Model): readonly [string, string] => {
  const game = model.board.game
  if (model.board.challenge) {
    const challenge = challengeById(model.board.challenge.id)
    return [
      `drill@${model.board.challenge.id.replace(':', '-')}`,
      challenge ? `${challenge.name} · ${challenge.brief}` : '',
    ]
  }
  if (model.board.sandbox)
    return [
      `you@sandbox-${model.board.sandbox.id ?? 'free'}`,
      model.board.sandbox.id ? GUIDED[model.board.sandbox.id].name : 'Free Sandbox',
    ]
  return ['oncall@prod', `${eraOf(game).name} · ${compact(game.users)} users · ${clock(game.time)}`]
}

/** Leaving the title: the screen connects to the board before it opens. */
const terminal = (model: Model, h: HtmlBuilder<Message>): Html => {
  const [host, line] = sessionOf(model)
  return h.div(
    [h.Key('term'), h.Class('booth-term'), h.AriaLive('polite')],
    [
      h.p([], [h.b([], [`$ ssh ${host}`])]),
      h.p([], [line]),
      h.p([h.Class('text-ok')], ['Connected.']),
      h.span([h.Class('booth-caret')], []),
    ],
  )
}

const screen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const page = menuOf(model.route)
  return h.div(
    [h.Class(`booth-screen ${model.saved ? '' : 'is-new'}`)],
    [
      h.section(
        [h.Class('booth-home')],
        [
          wordmark(h),
          crumb(model, page, h),
          h.nav(
            [
              h.Key(page),
              h.Class('booth-list'),
              h.AriaLabel('Main menu'),
              h.DataAttribute('page', page),
              h.OnMount(PageMounted()),
            ],
            PAGES[page].rows(model, h),
          ),
          hint(h),
        ],
      ),
      model.saved ? status(model, h) : h.empty,
      taskbar(model, page, h),
      model.connecting ? terminal(model, h) : h.empty,
    ],
  )
}

/* --------------------------------------------------------------------------
   The desk, seen straight on at eye level like the monitor: a keyboard slab
   whose keycap tops catch the screen's light and light up when pressed, and a
   mouse that follows the pointer.
   -------------------------------------------------------------------------- */

/** The keycap tops seen over the slab's front edge, with the keys the driver lights by name. */
const KEYS: ReadonlyArray<readonly [string, string?]> = [
  ['', 'Escape'],
  ...Array.from({ length: 5 }, () => [''] as const),
  ['space', 'Space'],
  ...Array.from({ length: 4 }, () => [''] as const),
  ['', 'Backspace'],
  ['wide', 'Enter'],
  ['', 'ArrowLeft'],
  ['', 'ArrowUp'],
  ['', 'ArrowDown'],
  ['', 'ArrowRight'],
]

const desk = (h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('booth-desk'), h.AriaHidden(true)],
    [
      h.div(
        [h.Class('booth-keyboard')],
        [
          h.div(
            [h.Class('booth-keyrow')],
            KEYS.map(([size, name]) =>
              h.span(
                [
                  h.Class(`booth-key ${size ? `is-${size}` : ''}`),
                  ...(name ? [h.DataAttribute('k', name)] : []),
                ],
                [],
              ),
            ),
          ),
        ],
      ),
      h.div([h.Class('booth-mouse')], []),
    ],
  )

/** The edge of the screen: the playtest tools and the warning that saves can break. */
const strip = (h: HtmlBuilder<Message>): Html =>
  h.header(
    [h.Class('booth-strip')],
    [
      h.button(
        [h.Type('button'), h.OnClick(Message.LogExported())],
        [
          icon(h, Download, 'size-3.5'),
          h.span([h.Class('booth-strip-label')], ['Export playtest log']),
        ],
      ),
      h.a(
        [
          h.Href('https://github.com/elianiva/quorum/issues'),
          h.Target('_blank'),
          h.Rel('noreferrer noopener'),
        ],
        [
          h.span([h.Class('booth-strip-dot')], []),
          h.span([], ['Playtest build']),
          ' · ',
          h.span([], ['Saves can reset']),
          ' · ',
          h.span([], ['Feedback']),
          icon(h, ArrowUpRight, 'size-3.5'),
        ],
      ),
    ],
  )

const booth = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Key('booth'), h.Class('booth'), h.OnMount(BoothDriver())],
    [
      h.div(
        [h.Class('booth-stage')],
        [
          desk(h),
          h.div([h.Class('booth-neck')], []),
          h.div(
            [h.Class('booth-monitor')],
            [
              screen(model, h),
              h.div(
                [h.Class('booth-chin'), h.AriaHidden(true)],
                [
                  h.svg(
                    [h.ViewBox('0 0 100 194')],
                    [
                      ...GLYPHS[0]!.paths.map((d) => h.path([h.D(d)])),
                      h.circle([h.Cx('89'), h.Cy('180'), h.R('14')]),
                    ],
                  ),
                  h.span([h.Class(`booth-power ${model.connecting ? 'is-busy' : ''}`)], []),
                ],
              ),
            ],
          ),
        ],
      ),
      strip(h),
    ],
  )

/* --------------------------------------------------------------------------
   The clock-in splash. Browsers play sound only after a click or key press,
   so a fresh load opens on a badge reader: the badge goes in, the reader
   beeps, and the booth follows with its sounds.
   -------------------------------------------------------------------------- */

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

export const titleScreen = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.main(
    [
      h.Class(
        'title-screen dark relative grid h-full place-items-center overflow-hidden bg-page text-foreground',
      ),
    ],
    [model.gate !== 'open' ? reader(model, h) : booth(model, h)],
  )
