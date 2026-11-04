import { refusal, stateJson } from './agent-tools.ts'
import { Listbox, Menu as UiMenu } from '@foldkit/ui'
import { moreMenu, type MoreItem } from './more.ts'
import { languageListbox } from '../i18n/listbox.ts'
import { Cause, Exit, Option, Result, Schema } from 'effect'
import { Update, type Runtime } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'
import { toString as urlToString, type Url } from 'foldkit/url'
import * as Actions from '@quorum/simulation/actions'
import * as Mirrors from '@quorum/simulation/mirror'
import {
  ACHIEVEMENTS,
  ALERT_RULES,
  DILATION_SPEEDS,
  EXITS,
  PERKS,
  CACHE_ENGINES,
  COMPONENTS,
  FAMILIES,
  FEATURES,
  FRAMEWORKS,
  INCIDENTS,
  BACKUPS,
  COLLECTORS,
  LANGUAGES,
  REGION_INFO,
  IAC_TOOL_INFO,
  MIGRATION_STEPS,
  POLICIES,
  KINDS,
  LB_POLICIES,
  PM_MODES,
  RESEARCH,
  RUNTIME_IDS,
  RUNTIMES,
  SIZES,
  STEP_SECONDS,
  TASKS,
  type RegionId as Region,
  type ResearchId,
} from '@quorum/simulation/catalog'
import { newGame, preseedGame } from '@quorum/simulation/company'
import {
  NO_TOTALS,
  advanceRun,
  beginRun,
  challengeById,
  challengeOpen,
  resultOf,
  responseAllowed,
  stepsOf,
  type Challenge,
} from '@quorum/simulation/challenges'
import { designOf, encodeReplay, type ReplayAction, type Response } from '@quorum/simulation/replay'
import { SIM_VERSION } from '@quorum/simulation/version'
import type { ApiRpc } from '@/platform/rpc.ts'
import { histogramQuery } from './challenge-query.ts'
import {
  advanceReveals,
  cueNode,
  dockGroups,
  dockItems,
  noticed,
  playbooksShown,
  revealAtStart,
  revealsOfSave,
  shown,
} from './reveal.ts'
import { EMPTY_HISTORY, historyOfSave, newSamples, record } from './history.ts'
import { HISTORY_EVERY, HISTORY_POINTS, sampleNode, type NodeSample } from './node-metrics.ts'
import { ipoExit, takeExit } from '@quorum/simulation/exit'
import {
  Founder,
  buyPerk,
  emptyFounder,
  founded,
  foundingOf,
  recordExit,
  removePlaybook,
  savePlaybook,
  toggleKeep,
  toggleMutator,
  unlockVenture,
  completeChallenge,
  discoverTerm,
  earnAchievements,
  recordEra,
} from '@quorum/simulation/founder'
import {
  challengeAchievements,
  countStats,
  detectAchievements,
  everyVenture,
} from '@quorum/simulation/achievements'
import type { AchievementId } from '@quorum/simulation/catalog'
import { discoverTerms } from '@quorum/simulation/discovery'
import { foundCompany, perkLevel } from '@quorum/simulation/founding'
import { OFFLINE_MIN, simulateAway } from '@quorum/simulation/offline'
import {
  capture,
  SHARED,
  decodePlaybook,
  encodePlaybook,
  ghostReason,
  placePlaybook,
} from '@quorum/simulation/playbook'
import { forceIncident } from '@quorum/simulation/director'
import { StepEvent } from '@quorum/simulation/events'
import { nextAdvice } from '@quorum/simulation/goals'
import {
  EVENT_EVERY,
  churnFact,
  disclosureFact,
  eventFact,
  eventMail,
  factOf,
  type Fact,
} from './mail.ts'
import type { EventMail } from './copy/index.ts'
import { updateDashboard } from './dashboard.ts'
import { updateGlossary } from './glossary.ts'
import {
  EMPTY_INBOX,
  InboxMessage,
  InboxOutMessage,
  closed,
  folderList,
  mailed,
  reading,
  resolvedExcept,
  updateInbox,
} from './inbox.ts'
import { PrefsMessage, updatePrefs } from './prefs.ts'
import { EMPTY_RESEARCH, ResearchMessage, ResearchOutMessage, updateResearch } from './research.ts'
import { TeamOutMessage, initTeam, updateTeam, type TeamMessage } from './team.ts'
import type { Ledger } from '@quorum/simulation/ledger'
import { eraOf, has, isFinalEra, nextEra, zoned } from '@quorum/simulation/lookups'
import { cheatCash, cheatInsight } from './cheats.ts'
import {
  advanceSandbox,
  freeSandbox,
  GUIDED,
  passedAll,
  sandboxOf,
  START,
} from '@quorum/simulation/sandbox'
import { solveFlow } from '@quorum/simulation/solve'
import { optionAction } from '@quorum/ui/board/jobs'
import { Game } from '@quorum/simulation/state'
import { IPO_BURN_SECONDS, PRE_IPO_STAGE } from '@quorum/simulation/ipo'
import { firstQuarter } from '@quorum/simulation/quarters'
import { step } from '@quorum/simulation/step'
import { serviceOf } from '@quorum/simulation/team'
import * as Work from '@quorum/simulation/work'
import {
  AskPlaybook,
  ApplySettings,
  ClearSave,
  FocusInspector,
  CopyText,
  LoadFounder,
  KeepBrokenSave,
  WriteFounder,
  AppendLog,
  ClearLog,
  ComputeBottleneck,
  ConnectBoard,
  ComputePreview,
  ClearToast,
  ExportLog,
  FitBoard,
  LoadPrefs,
  LoadSandboxStore,
  LoadSave,
  LoadUrl,
  PlaySound,
  PushUrl,
  ReplaceUrl,
  RevealTitle,
  SyncBoard,
  ToggleFullscreen,
  WritePrefs,
  WriteSandboxStore,
  WriteSave,
  SubmitChallenge,
} from './commands.ts'
import {
  STABLE_TICKS,
  UNDO_SECONDS,
  advanceChange,
  beginChange,
  deltaExpired,
  figuresOf,
  pushUndo,
  redoGame,
  snapshotOf,
  undoGame,
  type Reversal,
} from './feedback.ts'
import { BIG_PURCHASE, cueOf } from './cues.ts'
import { bigBoard, stressBoard } from '@quorum/ui/board/stress'
import {
  CARD_W,
  boxOf,
  crowds,
  freeSpot,
  heightOf,
  tidy,
  type Box,
} from '@quorum/ui/board/geometry'
import { alertText, duration, money } from '@quorum/ui/game/format'
import { Message } from './message.ts'
import {
  ledgerOf,
  Model,
  Prefs,
  type Board,
  type Inbox,
  SandboxStore,
  type SandboxRun,
  type Tone,
  type Tradeoff,
  type TradeoffOption,
  halted,
  offCompany,
  placingOf,
  stampedPlaybook,
  type ChallengeRun,
  type Menu,
} from './model.ts'
import { poolName, recipeOf } from '@quorum/ui/game/pools'
import { AppRoute, menuFor, onBoard, routeOfMenu, urlOf, urlToAppRoute } from './route.ts'
import type { LogEntry } from './playlog.ts'
import { contextOf, diffOf, line, sampleOf } from './telemetry.ts'
import { nearestNode, type Direction } from './viewport.ts'
import { openRegions, regionApdexOf, regionView } from '@quorum/simulation/regions'
import { churnOf } from '@quorum/simulation/churn'

/* ==========================================================================
   Quorum — init and update. The Simulation owns every rule; update routes
   Messages to it, turns refusals into toasts, measures each change, and
   writes the playtest log.
   ========================================================================== */

/** The UI reads the Ledger four times a second; the Simulation steps every 100 ms of sim time. */
export const TICK_MS = 250
/** Steps per tick at 1×: 250 ms over 100 ms Steps. 2.5 is exact in binary, so the carry never drifts. */
const STEPS_PER_TICK = 2.5
const SAVE_EVERY = 5
const SAMPLE_EVERY = 10
export const SPEEDS = [0.5, 1, 3, 10] as const

/** The Company speeds: Time dilation adds 20× and 40× (plan M7.3). */
export const speedsOf = (game: Game): ReadonlyArray<number> => [
  ...SPEEDS,
  ...(DILATION_SPEEDS[perkLevel(game, 'time-dilation')] ?? []),
]

/* ---------- init ---------- */

/** A board that starts on `game`: nothing selected, nothing measured yet, and an empty Inbox. */
export const freshBoard = (game: Game): Board => ({
  game,
  sandbox: null,
  challenge: null,
  exited: null,
  away: null,
  region: 'na',
  selected: null,
  selection: [],
  tool: null,
  confirmSell: null,
  clipboard: null,
  buildGroup: null,
  team: initTeam(),
  research: EMPTY_RESEARCH,
  insightHelp: false,
  clock: {
    speed: 1,
    paused: false,
    away: false,
    carry: 0,
    savedAt: game.time,
    sampledAt: game.time,
  },
  change: null,
  delta: null,
  stableTicks: 0,
  tradeoff: null,
  disclosure: { revealed: [], pending: [], cue: null },
  undo: [],
  redo: [],
  bottleneck: null,
  bottleneckAt: -1,
  nodeHistory: {},
  nodeSample: null,
  inbox: EMPTY_INBOX,
  dashboard: { history: EMPTY_HISTORY, range: 360, hover: null },
  lastGoal: '',
  lastBottleneck: '',
})

export const initialModel = (): Model =>
  Model.make({
    route: AppRoute.Title(),
    gate: 'open',
    panel: 'none',
    toast: null,
    toastSeq: 0,
    board: freshBoard(newGame()),
    company: null,
    saved: false,
    connecting: false,
    founder: emptyFounder(),
    passed: [],
    freeBoard: null,
    histograms: histogramQuery.init(),
    today: '',
    prefs: {
      locale: 'en',
      seenTradeoffs: [],
      muted: false,
      autoPause: false,
      blurPause: true,
      motion: 'system',
      agentAccess: false,
    },
    glossary: { focus: null, returnTo: 'none', query: '', category: null },
    languagePicker: Listbox.init({ id: 'interface-language' }),
    moreMenu: UiMenu.init({ id: 'more-menu' }),
  })

/** A fresh load opens on the title screen behind the clock-in splash, so a
 *  board URL opens the menu that lists that board instead. */
export const init: Runtime.RoutingApplicationInit<Model, Message, void, ApiRpc> = (url) => {
  const route = menuFor(urlToAppRoute(url))
  return {
    model: { ...initialModel(), route, gate: 'shut' },
    commands: [
      LoadSave({}),
      LoadSandboxStore({}),
      LoadPrefs({}),
      LoadFounder({}),
      ...(url.pathname === urlOf(route) ? [] : [ReplaceUrl({ url: urlOf(route) })]),
    ],
  }
}

/* ---------- helpers ---------- */

type Result = Update.Return<Model, Message, ApiRpc>
type AnyCommand = NonNullable<Result['commands']>[number]

/** The panel under the open one: the Glossary goes back to where it opened, Settings on the board to the game menu. */
const closePanel = (model: Model): Model => ({
  ...model,
  panel:
    model.panel === 'glossary'
      ? model.glossary.returnTo
      : model.panel === 'settings' && onBoard(model.route)
        ? 'menu'
        : 'none',
  glossary: { ...model.glossary, returnTo: 'none' },
})

const sync = (model: Model, fit: boolean): AnyCommand =>
  SyncBoard({
    fit,
    game: model.board.game,
    locale: model.prefs.locale,
    bottleneck: model.board.bottleneck,
    selected: model.board.selected,
    selection: model.board.selection,
    placing: placingOf(model),
    stamp: stampOf(model),
    history: Object.fromEntries(
      Object.entries(model.board.nodeHistory).map(([id, samples]) => [
        id,
        samples.map((sample) => sample.utilization),
      ]),
    ),
    region: model.board.region,
    paused: halted(model),
    suspended: model.panel === 'research',
    cue: cueNode(model),
  })

/** The Company save: the Game, and what this Company has shown so far. */
const saveOf = (model: Model): AnyCommand =>
  WriteSave({
    game: model.board.game,
    revealed: model.board.disclosure.revealed,
    pending: model.board.disclosure.pending,
    dashboard: model.board.dashboard.history,
  })

/** The Playbook being placed, as the board draws it: ghosts where research is missing. */
const stampOf = (model: Model) => {
  const playbook = stampedPlaybook(model)
  if (!playbook) return null
  return playbook.nodes.map((node) => ({
    type: node.type,
    dx: node.dx,
    dy: node.dy,
    ghost: ghostReason(model.board.game, node, model.board.region) !== null,
  }))
}

/* ---------- Mail (GDD 18) ---------- */

/** A fact joins the Inbox; it needs no preview card while the Inbox panel is open. */
/** Sim seconds in one calendar hour. */
const CALENDAR_HOUR = 60

const mailedTo = (model: Model, fact: Fact, time: number, repeats = false): Model => ({
  ...model,
  board: {
    ...model.board,
    inbox: mailed(model.board.inbox, fact, time, model.panel === 'inbox', repeats),
  },
})

/** The Inbox's keys: J and K move, E deletes (or restores), S reports spam, 1 to 3 press a button. */
const mailKey = (model: Model, key: string): Result | null => {
  const list = folderList(model.board.inbox)
  const at = list.findIndex((mail) => mail.id === model.board.inbox.focus)
  const current = list[at]
  const neighbour = (list[at + 1] ?? list[at - 1])?.id ?? null
  // Deleting or reporting a Mail moves on to its neighbour.
  const apply = (message: InboxMessage): Result =>
    Update.combine(model, [
      (next: Model) => foldInbox(next, message),
      (next: Model) => foldInbox(next, InboxMessage.Opened({ id: neighbour })),
    ])
  switch (key) {
    case 'j':
      return foldInbox(
        model,
        InboxMessage.Opened({ id: list[Math.min(at + 1, list.length - 1)]?.id ?? null }),
      )
    case 'k':
      return foldInbox(model, InboxMessage.Opened({ id: list[Math.max(at - 1, 0)]?.id ?? null }))
    case 'e':
      return current
        ? apply(
            current.trashed
              ? InboxMessage.Restored({ id: current.id })
              : InboxMessage.Trashed({ id: current.id }),
          )
        : null
    case 's':
      return current && !current.trashed ? apply(InboxMessage.MarkedSpam({ id: current.id })) : null
    case '1':
    case '2':
    case '3': {
      const action =
        current?.answer === null && current.resolved === null
          ? current.actions[Number(key) - 1]
          : undefined
      return current && action
        ? foldInbox(model, InboxMessage.Acted({ id: current.id, action: action.id }))
        : { model } // the Inbox owns 1 to 3 while open, so they never reach the build shortcuts
    }
    default:
      return null
  }
}

/** The Model with a toast raised, and the Command that clears it later. */
const toasted = (model: Model, message: string, tone: Tone): [Model, AnyCommand] => {
  const id = model.toastSeq + 1
  return [{ ...model, toast: { id, message, tone }, toastSeq: id }, ClearToast({ id })]
}

const withToast = (
  model: Model,
  message: string,
  tone: Tone,
  extra: ReadonlyArray<AnyCommand> = [],
): Result => {
  const [next, clear] = toasted(model, message, tone)
  return { model: next, commands: [clear, ...extra] }
}

type ActOptions = Readonly<{
  /** Board actions go on the undo stack. */
  undoable?: boolean
  patch?: (model: Model, game: Game) => Partial<Board>
  /** The panel the action opens, from the Game it made. */
  panel?: (game: Game) => Model['panel']
  note?: (game: Game) => readonly [string, Tone] | null
}>

/**
 * Applies a Simulation action. A refusal becomes a toast that says why; a
 * success syncs the board and starts measuring the change.
 */
const act = (
  model: Model,
  label: string,
  action: Actions.Action,
  options: ActOptions = {},
): Result =>
  Result.match(action, {
    onFailure: (refusal) => withToast(model, Actions.describeRefusal(refusal), 'warn'),
    onSuccess: (game) => {
      if (game === model.board.game) return { model }
      // A run replays the Design it started with: only logged run actions may change it.
      if (model.board.challenge && model.board.challenge.phase !== 'build')
        return withToast(model, 'Rebuild to change the Design.', 'warn')
      const measured = beginChange(model.board, label, figuresOf(solveFlow(model.board.game)))
      const next: Model = {
        ...model,
        panel: options.panel?.(game) ?? model.panel,
        board: {
          ...measured,
          ...options.patch?.(model, game),
          game,
          // The Design changed: search for the Bottleneck again on the next tick.
          bottleneckAt: -1,
          ...(options.undoable
            ? pushUndo(
                model.board,
                snapshotOf(
                  label,
                  model.board.game,
                  game.cash - model.board.game.cash,
                  model.board.game.time,
                ),
              )
            : {}),
        },
      }
      const note = options.note?.(game)
      return note ? withToast(next, note[0], note[1]) : { model: next }
    },
  })

/** Applies an undo or a redo, or says why it cannot. */
const reverse = (model: Model, reversal: Reversal | string, verb: string): Result => {
  if (typeof reversal === 'string') return withToast(model, reversal, 'plain')
  if (model.board.challenge && model.board.challenge.phase !== 'build')
    return withToast(model, 'Rebuild to change the Design.', 'warn')
  const measured = beginChange(
    model.board,
    `${verb} ${reversal.label}`,
    figuresOf(solveFlow(model.board.game)),
  )
  const next: Model = {
    ...model,
    board: {
      ...measured,
      game: reversal.game,
      undo: reversal.undo,
      redo: reversal.redo,
      bottleneckAt: -1,
    },
  }
  return withToast(next, `${verb}: ${reversal.label}.`, 'plain')
}

/** The Nodes an edit applies to: the multi-selection, or the one Node open. */
const chosenIds = (model: Model): ReadonlyArray<string> =>
  model.board.selection.length > 0
    ? model.board.selection
    : model.board.selected
      ? [model.board.selected]
      : []

const NUDGE = 16

const countNodes = (count: number): string => (count === 1 ? '1 Node' : `${count} Nodes`)

/** Sells every Node it can. Fixed Nodes stay; it fails only when nothing sold. */
const sellAll = (game: Game, ids: ReadonlyArray<string>): Actions.Action => {
  let next = game
  let refusal: Actions.Action = Actions.sell(game, '')
  for (const id of ids) {
    const sold = Actions.sell(next, id)
    if (Result.isSuccess(sold)) next = sold.success
    else refusal = sold
  }
  return next === game ? refusal : Result.succeed(next)
}

const nodeName = (game: Game, id: string): string => {
  const node = game.nodes.find((entry) => entry.id === id)
  return node ? COMPONENTS[node.type].name : 'A Node'
}

const percent = (share: number): string => `${Math.round(share * 100)}%`

/** A Stack choice on this Node starts a migration rather than swapping at once. */
const migrates = (game: Game, nodeId: string): boolean =>
  !game.sandbox && game.nodes.some((node) => node.id === nodeId && node.type === 'server')

/** What the player hears when a Stack choice started a migration. */
const migrationNote = (before: Game, after: Game): Note => {
  const migration = serviceOf(after).migration
  if (!migration || serviceOf(before).migration === migration) return null
  return [
    `Migration queued: ${Math.round(migration.total)} DH. Shift traffic as steps finish.`,
    'primary',
  ]
}

/* ---------- Tradeoff cards ---------- */

/** The Message that applies an option, as the inspector sent before Tradeoff cards. */
const optionMessage = (nodeId: string, option: TradeoffOption): Message => {
  switch (option.kind) {
    case 'runtime':
      return Message.RuntimeChosen({ nodeId, runtime: option.id })
    case 'framework':
      return Message.FrameworkChosen({ nodeId, framework: option.id })
    case 'family':
      return Message.FamilyChosen({ nodeId, family: option.id })
  }
}

/**
 * A card for an option. A refusal shows at once; the ghost runs go to the compute
 * worker, and their preview arrives as PreviewComputed.
 */
const tradeoffOf = (
  model: Model,
  nodeId: string,
  option: TradeoffOption,
  pinned: boolean,
): readonly [Tradeoff, ReadonlyArray<AnyCommand>] =>
  Result.match(
    migrates(model.board.game, nodeId) && option.kind !== 'family'
      ? Work.changeStack(
          model.board.game,
          nodeId,
          option.kind === 'runtime' ? { runtime: option.id } : { framework: option.id },
        )
      : optionAction(model.board.game, nodeId, option),
    {
      onSuccess: () =>
        [
          { nodeId, option, pinned, preview: null, refusal: null },
          [ComputePreview({ game: model.board.game, nodeId, option })],
        ] as const,
      onFailure: (refusal) =>
        [
          { nodeId, option, pinned, preview: null, refusal: Actions.describeRefusal(refusal) },
          [],
        ] as const,
    },
  )

/** Applies an option and logs what its card predicted, so playtests can compare it with the outcome. */
const applyOption = (model: Model, card: Tradeoff): Result => {
  const closed: Model = { ...model, board: { ...model.board, tradeoff: null } }
  const applied = route(closed, optionMessage(card.nodeId, card.option))
  if (applied.model.board.game === closed.board.game) return applied
  const seen = applied.model.prefs.seenTradeoffs.includes(card.option.kind)
    ? applied.model.prefs.seenTradeoffs
    : [...applied.model.prefs.seenTradeoffs, card.option.kind]
  const next: Model = { ...applied.model, prefs: { ...applied.model.prefs, seenTradeoffs: seen } }
  return {
    model: next,
    commands: [
      ...(applied.commands ?? []),
      WritePrefs({ prefs: next.prefs }),
      AppendLog({
        entries: [
          line(model.board.game.time, 'TradeoffPreviewed', {
            option: card.option,
            preview: card.preview,
          }),
        ],
      }),
    ],
  }
}

/** Saves and applies the Model's settings. */
const savePrefs = (model: Model): Result => ({
  model,
  commands: [
    WritePrefs({ prefs: model.prefs }),
    ApplySettings({
      muted: model.prefs.muted,
      motion: model.prefs.motion,
      locale: model.prefs.locale,
      agentAccess: model.prefs.agentAccess,
    }),
  ],
})

/** A Settings gesture: the Prefs Submodel changes, then the new settings are saved and applied. */
const foldPrefs = (model: Model, message: PrefsMessage): Result =>
  Update.combine(model, [
    Update.foldChild({
      update: updatePrefs,
      read: (parent: Model) => Option.some(parent.prefs),
      write: (parent, prefs) => ({ ...parent, prefs }),
      toParentMessage: (child) => Message.PrefsChanged({ message: child }),
    })(message),
    savePrefs,
  ])

const foldGlossary = Update.foldChild({
  update: updateGlossary,
  read: (model: Model) => Option.some(model.glossary),
  write: (model, glossary) => ({ ...model, glossary }),
  toParentMessage: (message) => Message.GlossaryChanged({ message }),
})

const foldDashboard = Update.foldChild({
  update: updateDashboard,
  read: (model: Model) => Option.some(model.board.dashboard),
  write: (model, dashboard) => ({ ...model, board: { ...model.board, dashboard } }),
  toParentMessage: (message) => Message.DashboardChanged({ message }),
})

/** A Mail button whose effect is outside the Inbox: the Message it stands for. */
const mailAction = (model: Model, kind: string, target: string | null): Result => {
  switch (kind) {
    case 'raise':
      return route(model, Message.RoundRaised())
    case 'decline':
      return route(model, Message.RoundDeclined())
    case 'hire':
      return teamAction(model, TeamOutMessage.Hire())
    case 'team':
      return route(model, Message.PanelOpened({ panel: 'team' }))
    case 'rewrite': {
      const runtime = RUNTIME_IDS.find((id) => LANGUAGES[RUNTIMES[id].language].name === target)
      if (!runtime)
        return withToast(
          model,
          `${target} has no playable runtime. You can decline this proposal.`,
          'warn',
        )
      const game = model.board.game
      const servers = game.nodes.filter((node) => node.type === 'server')
      const node =
        servers.find((entry) => entry.id === model.board.selected && entry.runtime !== runtime) ??
        servers.find((entry) => entry.runtime !== runtime)
      if (!node)
        return withToast(
          model,
          servers.length === 0
            ? 'Add an App Server before reviewing a migration.'
            : `Your App Servers already run ${target}. No rewrite is needed.`,
          'warn',
        )
      const research = RUNTIMES[runtime].research
      if (research && !game.researched.includes(research)) {
        const opened = route(model, Message.PanelOpened({ panel: 'research' }))
        return withToast(
          {
            ...opened.model,
            board: { ...opened.model.board, research: { focus: research } },
          },
          `Research ${RESEARCH[research].name}, then review the proposal again in Inbox.`,
          'warn',
        )
      }
      const [card, commands] = tradeoffOf(model, node.id, { kind: 'runtime', id: runtime }, true)
      return {
        model: {
          ...model,
          panel: 'none',
          board: {
            ...model.board,
            region: node.region,
            selected: node.id,
            selection: [],
            tool: null,
            tradeoff: card,
          },
        },
        commands,
      }
    }
    case 'churn':
      return route(model, Message.PanelOpened({ panel: 'churn' }))
    case 'first':
      return route(model, Message.WorkPrioritized({ id: Number(target) }))
    case 'rush':
      return route(model, Message.WorkRushed({ id: Number(target) }))
    case 'show':
      return { model: { ...model, board: { ...model.board, selected: target } } }
    case 'trap':
      return withToast(model, 'That was phishing. Check the sender address first.', 'danger')
    default:
      return { model }
  }
}

/** Runs a Team panel action on the board's Game, with its undo entry and note. */
const teamAction = (model: Model, out: TeamOutMessage): Result => {
  const game = model.board.game
  return TeamOutMessage.match<Result>(out, {
    Hire: () =>
      act(model, 'Hired', Work.hire(game), {
        note: () => ['Offer accepted. They start soon.', 'ok'],
      }),
    Layoff: ({ engineerId }) =>
      act(model, 'Laid off', Work.layoff(game, engineerId), {
        note: () => ['Laid off. The team is shaken for a week.', 'warn'],
      }),
    CreateTeam: () => act(model, 'New team', Work.createTeam(game)),
    RemoveTeam: ({ teamId }) => act(model, 'Removed a team', Work.removeTeam(game, teamId)),
    Assign: ({ engineerId, teamId }) =>
      act(model, 'Moved an engineer', Work.assign(game, engineerId, teamId)),
    SetPolicy: ({ teamId, policy }) =>
      act(model, `${POLICIES[policy].label} policy`, Work.setTeamPolicy(game, teamId, policy)),
    SetKind: ({ teamId, kind }) =>
      act(
        model,
        kind === 'platform' ? 'Platform team' : 'Product team',
        Work.setTeamKind(game, teamId, kind),
      ),
    QueueFeature: ({ id }) =>
      act(model, `Queued ${FEATURES[id].name}`, Work.queueFeature(game, id)),
  })
}

const foldTeam = (model: Model, message: TeamMessage): Result =>
  Update.foldChild({
    update: updateTeam,
    read: (parent: Model) => Option.some(parent.board.team),
    write: (parent, team) => ({ ...parent, board: { ...parent.board, team } }),
    toParentMessage: (child) => Message.TeamChanged({ message: child }),
    foldOutMessage: (out: TeamOutMessage) => (parent: Model) => teamAction(parent, out),
  })(model, message)

const foldResearch = (model: Model, message: ResearchMessage): Result =>
  Update.foldChild({
    update: updateResearch,
    read: (parent: Model) => Option.some(parent.board.research),
    write: (parent, research) => ({ ...parent, board: { ...parent.board, research } }),
    toParentMessage: (child) => Message.ResearchChanged({ message: child }),
    foldOutMessage: (out: ResearchOutMessage) => (parent: Model) =>
      ResearchOutMessage.match<Result>(out, {
        Study: ({ id }) =>
          act(parent, `Study ${RESEARCH[id].name}`, Actions.study(parent.board.game, id), {
            note: (game) => {
              // Warn when the pools hold less than the recipe: the Study waits on their rates.
              const short = recipeOf(id)
                .filter(([pool, cost]) => game.pools[pool] < cost)
                .map(([pool]) => poolName(pool))
              return short.length > 0
                ? [
                    `Study queued: ${RESEARCH[id].name}. Not enough ${short.join(', ')} yet: it runs at their earn rate.`,
                    'warn',
                  ]
                : [`Study queued: ${RESEARCH[id].name}.`, 'primary']
            },
          }),
        Move: ({ id, direction }) =>
          act(parent, 'Reordered research', Actions.moveStudy(parent.board.game, id, direction)),
        StudyNow: ({ id }) =>
          act(
            parent,
            `Study ${RESEARCH[id].name} now`,
            Actions.study(parent.board.game, id, true),
            { note: () => [`Studying now: ${RESEARCH[id].name}.`, 'primary'] },
          ),
        Cancel: ({ id }) =>
          act(
            parent,
            `Cancelled ${RESEARCH[id].name}`,
            Actions.cancelStudy(parent.board.game, id),
            {
              note: () => [`Study cancelled: ${RESEARCH[id].name}.`, 'plain'],
            },
          ),
      }),
  })(model, message)

/** An Inbox gesture. The Inbox reads the board's Game and whether its panel is open. */
const foldInbox = (model: Model, message: InboxMessage): Result =>
  Update.foldChild({
    update: (inbox: Inbox, child: InboxMessage) =>
      updateInbox(inbox, child, { game: model.board.game, open: model.panel === 'inbox' }),
    read: (parent: Model) => Option.some(parent.board.inbox),
    write: (parent, inbox) => ({ ...parent, board: { ...parent.board, inbox } }),
    toParentMessage: (child) => Message.InboxChanged({ message: child }),
    foldOutMessage: (out: InboxOutMessage) => (parent: Model) =>
      InboxOutMessage.match<Result>(out, {
        PanelWanted: () => ({
          model: { ...parent, panel: 'inbox', board: { ...parent.board, tool: null } },
        }),
        ActionTaken: ({ kind, target }) => mailAction(parent, kind, target),
      }),
  })(model, message)

/** Puts the badge in the reader, once: it beeps, and the title follows. */
const clockIn = (model: Model): Result =>
  model.gate !== 'shut'
    ? { model }
    : {
        model: { ...model, gate: 'clocking' },
        commands: [
          ...(model.prefs.muted ? [] : [PlaySound({ sound: 'clockin', pitch: 1, spatial: false })]),
          RevealTitle({}),
        ],
      }

/** Earns achievements: the Founder record, a toast each, and a chime unless muted. */
const achieve = (
  model: Model,
  ids: ReadonlyArray<AchievementId>,
): readonly [Model, ReadonlyArray<AnyCommand>] => {
  const fresh = ids.filter((id) => !model.founder.achievements.includes(id))
  if (fresh.length === 0) return [model, []]
  let next: Model = { ...model, founder: earnAchievements(model.founder, fresh) }
  const commands: Array<AnyCommand> = [WriteFounder({ founder: next.founder })]
  for (const id of fresh) {
    const [raised, clear] = toasted(next, `Achievement: ${ACHIEVEMENTS[id].name}.`, 'primary')
    next = raised
    commands.push(clear)
  }
  if (!next.prefs.muted)
    commands.push(PlaySound({ sound: 'achievement', pitch: 1, spatial: false }))
  commands.push(
    AppendLog({
      entries: fresh.map((id) => line(next.board.game.time, 'AchievementEarned', { id })),
    }),
  )
  return [next, commands]
}

/**
 * What a Company's moment earns beyond the Game: achievements, glossary
 * entries, and the incident and Era sounds. Never in a Sandbox or Challenge.
 */
const milestones = (
  before: Model,
  result: Result,
  events: ReadonlyArray<StepEvent>,
  ledger: Ledger,
): Result => {
  const after = result.model
  if (!onBoard(after.route) || offCompany(after)) return result
  const commands: Array<AnyCommand> = [...(result.commands ?? [])]
  const stats = countStats(after.founder.stats, events)
  const earned = detectAchievements(
    { before: before.board.game, after: after.board.game, ledger, events, stats },
    after.founder.achievements,
  )
  const terms = discoverTerms(after.board.game, events).filter(
    (id) => !after.founder.glossary.includes(id),
  )
  let next = after
  if (stats !== after.founder.stats && events.some((event) => event._tag === 'IncidentResolved'))
    next = { ...next, founder: { ...next.founder, stats } }
  if (terms.length > 0) next = { ...next, founder: terms.reduce(discoverTerm, next.founder) }
  const [achieved, earnedCommands] = achieve(next, earned)
  next = achieved
  commands.push(...earnedCommands)
  if (next.founder !== after.founder && earnedCommands.length === 0)
    commands.push(WriteFounder({ founder: next.founder }))
  if (!next.prefs.muted) {
    if (after.board.game.stage > before.board.game.stage)
      commands.push(PlaySound({ sound: 'era', pitch: 1, spatial: false }))
    else if (events.some((event) => event._tag === 'IncidentStarted'))
      commands.push(PlaySound({ sound: 'incident', pitch: 1, spatial: false }))
  }
  return next === after && commands.length === (result.commands ?? []).length
    ? result
    : { model: next, commands }
}

// Stored JSON that does not parse or no longer fits its Schema reads as nothing.
const parsePrefs = Schema.decodeUnknownOption(Schema.fromJsonString(Prefs))
const parseStore = Schema.decodeUnknownOption(Schema.fromJsonString(SandboxStore))
const parseJson = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Unknown))
const decodeGame = Schema.decodeUnknownExit(Game)

/** What the Sandbox store holds for this Model. */
const storeOf = (model: Model): SandboxStore => ({
  passed: model.passed,
  free: model.freeBoard,
})

/** What the player hears about a Step event, if anything. */
type Note = readonly [string, Tone] | null

/** A Step event's toast, and the Mail behind it. */
type EventNote = readonly [string, Tone, EventMail] | null

const eventText = (event: StepEvent, game: Game): EventNote =>
  StepEvent.$match(event, {
    IncidentStarted: ({ incident }): EventNote =>
      incident.kind === 'bad-deploy'
        ? null
        : incident.kind === 'breach'
          ? [
              'Data breach: an unpatched CVE was exploited. Users are leaving.',
              'danger',
              { topic: 'incident-breach', vars: {} },
            ]
          : incident.kind === 'instance' && incident.nodeId
            ? [
                `${nodeName(game, incident.nodeId)} failed. Select it and click Replace.`,
                'danger',
                { topic: 'incident-instance', vars: { node: nodeName(game, incident.nodeId) } },
              ]
            : incident.kind === 'slow-query'
              ? [
                  'A new query has no index. Every read scans the table.',
                  'danger',
                  { topic: 'incident-slow-query', vars: {} },
                ]
              : incident.kind === 'poison'
                ? [
                    'A task keeps failing. Workers retry it instead of the queue.',
                    'danger',
                    { topic: 'incident-poison', vars: {} },
                  ]
                : incident.kind === 'ddos'
                  ? [
                      'A flood of junk traffic hits the edge.',
                      'danger',
                      { topic: 'incident-ddos', vars: {} },
                    ]
                  : incident.kind === 'stampede'
                    ? [
                        'The Cache restarted empty. Every miss goes to the database.',
                        'danger',
                        { topic: 'incident-stampede', vars: {} },
                      ]
                    : incident.kind === 'zone' && incident.zone
                      ? [
                          `Zone ${incident.zone.toUpperCase()} is down.`,
                          'danger',
                          { topic: 'incident-zone', vars: { zone: incident.zone.toUpperCase() } },
                        ]
                      : incident.kind === 'psp-outage'
                        ? [
                            'The Payment Provider is down. Checkouts fail.',
                            'danger',
                            { topic: 'incident-psp', vars: {} },
                          ]
                        : null,
    IncidentResolved: ({ postmortem }): EventNote =>
      postmortem.action
        ? [
            `${INCIDENTS[postmortem.kind].name} is over. Action item: ${RESEARCH[postmortem.action].name}. Until then it is twice as likely.`,
            'primary',
            {
              topic: 'resolved-action',
              vars: {
                incident: INCIDENTS[postmortem.kind].name,
                action: RESEARCH[postmortem.action].name,
              },
            },
          ]
        : [
            `${INCIDENTS[postmortem.kind].name} is over.`,
            'primary',
            { topic: 'resolved', vars: { incident: INCIDENTS[postmortem.kind].name } },
          ],
    DrawerFull: (): EventNote => [
      'The Payments drawer is full. Revenue is spilling.',
      'warn',
      { topic: 'drawer', vars: {} },
    ],
    OutOfMemory: ({ nodeId }): EventNote => [
      `${nodeName(game, nodeId)} ran out of memory and restarted.`,
      'danger',
      { topic: 'oom', vars: { node: nodeName(game, nodeId) } },
    ],
    CreditsExhausted: ({ nodeId }): EventNote => [
      `${nodeName(game, nodeId)} is out of CPU credits: throttled to 20%.`,
      'warn',
      { topic: 'credits', vars: { node: nodeName(game, nodeId) } },
    ],
    AlertFired: ({ rule }): EventNote => [
      `Page: ${alertText(rule, game.alertRules[rule]).toLowerCase()} for ${ALERT_RULES[rule].seconds} s.`,
      'danger',
      {
        topic: 'alert',
        vars: {
          alert: alertText(rule, game.alertRules[rule]),
          seconds: String(ALERT_RULES[rule].seconds),
        },
      },
    ],
    AlertIgnored: ({ rule }): EventNote => [
      `Five false alarms today: the team ignores “${alertText(rule, game.alertRules[rule])}”. Change its threshold.`,
      'warn',
      { topic: 'alert-ignored', vars: { alert: alertText(rule, game.alertRules[rule]) } },
    ],
    Hired: (): EventNote => ['An engineer joined the team.', 'ok', { topic: 'hired', vars: {} }],
    // A disclosure and its exploit are written by `security`, not by the event table.
    CveDisclosed: (): EventNote => null,
    CveExploited: (): EventNote => null,
    WorkFinished: ({ item }): EventNote =>
      item.kind === 'task'
        ? [
            `${Work.itemName(item)} is done.`,
            'ok',
            { topic: 'finished', vars: { item: Work.itemName(item) } },
          ]
        : null,
    Deployed: ({ features, bad }): EventNote => {
      const names = features.map((id) => FEATURES[id].name).join(', ')
      return bad
        ? [
            `Deployed ${names} with a bug. App Servers are crashing.`,
            'danger',
            { topic: 'deployed-bad', vars: { features: names } },
          ]
        : [`Deployed ${names}.`, 'primary', { topic: 'deployed', vars: { features: names } }]
    },
    StudyCompleted: ({ research }): EventNote => [
      `${RESEARCH[research].name} is researched.`,
      'ok',
      { topic: 'finished', vars: { item: RESEARCH[research].name } },
    ],
    MigrationShifted: ({ step }): EventNote => [
      `${percent(MIGRATION_STEPS[step - 1] ?? 0)} of App Servers moved to the new Stack.`,
      'primary',
      { topic: 'migration', vars: { share: percent(MIGRATION_STEPS[step - 1] ?? 0) } },
    ],
  })

const eventLog = (event: StepEvent): Record<string, unknown> =>
  StepEvent.$match(event, {
    IncidentStarted: ({ incident }) => ({ kind: incident.kind, node: incident.nodeId }),
    IncidentResolved: ({ postmortem }) => ({ ...postmortem }),
    DrawerFull: () => ({}),
    OutOfMemory: ({ nodeId }) => ({ node: nodeId }),
    CreditsExhausted: ({ nodeId }) => ({ node: nodeId }),
    AlertFired: ({ rule }) => ({ rule }),
    AlertIgnored: ({ rule }) => ({ rule }),
    Hired: ({ engineerId }) => ({ engineer: engineerId }),
    CveDisclosed: ({ item }) => ({ cve: item.ref, due: item.due }),
    CveExploited: ({ cve, target }) => ({ cve, target }),
    WorkFinished: ({ item }) => ({ kind: item.kind, ref: item.ref, cost: item.cost }),
    Deployed: ({ features, bad }) => ({ features, bad }),
    MigrationShifted: ({ step }) => ({ step }),
    StudyCompleted: ({ research }) => ({ research }),
  })

/* ---------- the clock ---------- */

const tick = (model: Model): Result => {
  if (model.board.challenge?.phase === 'running') return runTick(model, model.board.challenge)
  const owed = model.board.clock.carry + STEPS_PER_TICK * model.board.clock.speed
  const steps = Math.floor(owed)
  let game = model.board.game
  const events: Array<StepEvent> = []
  for (let index = 0; index < steps; index += 1) {
    const result = step(game, STEP_SECONDS)
    game = result.game
    events.push(...result.events)
  }
  // A guided Sandbox checks its objective, and may script an incident or change demand.
  const guided = model.board.sandbox?.id ? GUIDED[model.board.sandbox.id] : null
  let run = model.board.sandbox
  let advanced = false
  if (run && guided && !passedAll(guided, run.progress)) {
    const advance = advanceSandbox(
      guided,
      run.progress,
      game,
      solveFlow(game),
      steps * STEP_SECONDS,
    )
    if (advance.game.incident && advance.game.incident !== game.incident)
      events.push(StepEvent.IncidentStarted({ incident: advance.game.incident }))
    game = advance.game
    run = { ...run, progress: advance.progress }
    advanced = advance.advanced
  }
  // The Bottleneck search re-solves three times, so it runs once per sim second (04).
  const second = Math.floor(game.time)
  const search = model.board.bottleneckAt < 0 || second !== model.board.bottleneckAt
  const flow = solveFlow(game)
  // The search runs on the compute worker; until it answers, the last Bottleneck stands.
  const bottleneck = model.board.bottleneck
  const ledger: Ledger = { ...flow, bottleneck }
  // An incident drops the clock to 1×, so the player has time to respond.
  const incident = events.some((event) => event._tag === 'IncidentStarted')
  // With auto-pause on, a SEV1 or SEV2 stops the clock until the player resumes it.
  const severe = events.find(
    (event) => event._tag === 'IncidentStarted' && event.incident.severity <= 2,
  )
  const autoPaused = model.prefs.autoPause && severe !== undefined && !model.board.clock.paused
  let next: Model = {
    ...model,
    board: {
      ...model.board,
      game,
      sandbox: run,
      bottleneck,
      bottleneckAt: search ? second : model.board.bottleneckAt,
      clock: {
        ...model.board.clock,
        paused: model.board.clock.paused || autoPaused,
        speed: incident ? Math.min(model.board.clock.speed, 1) : model.board.clock.speed,
        carry: owed - steps,
      },
    },
  }
  next = advanceReveals(next, ledger)
  const commands: Array<AnyCommand> = []
  if (search) commands.push(ComputeBottleneck({ game, at: second }))
  const logs: Array<LogEntry> = []

  if (run && guided && advanced) {
    const done = passedAll(guided, run.progress)
    logs.push(
      line(game.time, 'ObjectivePassed', { sandbox: guided.id, objective: run.progress.objective }),
    )
    if (done) {
      const passed = next.passed.includes(guided.id) ? next.passed : [...next.passed, guided.id]
      next = { ...next, passed, panel: 'passed', board: { ...next.board, tool: null } }
      commands.push(WriteSandboxStore({ store: storeOf(next) }))
    } else {
      const [raised, clear] = toasted(
        next,
        `Objective ${run.progress.objective} of ${guided.objectives.length} done.`,
        'ok',
      )
      next = raised
      commands.push(clear)
    }
  }

  if (autoPaused && severe?._tag === 'IncidentStarted') {
    const [raised, clear] = toasted(
      next,
      `Paused: SEV${severe.incident.severity} ${INCIDENTS[severe.incident.kind].name}. Space resumes.`,
      'danger',
    )
    next = raised
    commands.push(clear)
  }

  for (const event of events) {
    logs.push(line(game.time, event._tag, eventLog(event)))
    // The Simulation files a CVE as a ticket; Security writes the advisory, and a thread closes with its ticket.
    if (!next.board.challenge && event._tag === 'CveDisclosed') {
      next = mailedTo(next, disclosureFact(event.item, game), game.time)
      continue
    }
    if (event._tag === 'CveExploited')
      next = {
        ...next,
        board: {
          ...next.board,
          inbox: closed(
            next.board.inbox,
            `security:${event.cve}`,
            game.time,
            'Exploited. The ticket expired, and so did the Users who trusted you.',
          ),
        },
      }
    if (event._tag === 'WorkFinished' && event.item.kind === 'patch')
      next = {
        ...next,
        board: {
          ...next.board,
          inbox: closed(
            next.board.inbox,
            `security:${event.item.ref}`,
            game.time,
            'Patched before the deadline. Nothing happened, which is the point.',
          ),
        },
      }
    const text = eventText(event, game)
    if (!text) continue
    // What happened in the Design is Mail (GDD 18); a Challenge has no Inbox, so it keeps the toast.
    if (next.board.challenge) {
      const [raised, clear] = toasted(next, text[0], text[1])
      next = raised
      commands.push(clear)
    } else {
      next = mailedTo(next, eventFact(event, text[2], game), game.time, true)
    }
  }

  // Feedback after a change.
  const settled = advanceChange(next.board, ledger, next.toastSeq + 1)
  next = {
    ...next,
    board: {
      ...next.board,
      change: settled.change,
      delta: settled.delta ?? next.board.delta,
      stableTicks: settled.delta ? STABLE_TICKS : Math.max(0, next.board.stableTicks - 1),
    },
  }
  if (settled.delta) logs.push(line(game.time, 'ChangeSettled', settled.delta))
  if (deltaExpired(next.board)) next = { ...next, board: { ...next.board, delta: null } }

  // The Dashboard's long history: every Sample the Steps added.
  next = {
    ...next,
    board: {
      ...next.board,
      dashboard: {
        ...next.board.dashboard,
        history: record(
          next.board.dashboard.history,
          newSamples(game.history, model.board.game.time, game.time),
          Math.floor(game.time),
        ),
      },
    },
  }

  // Capture actual observations, not reconstructed samples across skipped time.
  if (Math.floor(game.time / HISTORY_EVERY) > Math.floor(model.board.game.time / HISTORY_EVERY)) {
    const history: Record<string, ReadonlyArray<NodeSample>> = {}
    for (const node of game.nodes) {
      const past = next.board.nodeHistory[node.id] ?? []
      history[node.id] = [...past, sampleNode(game, node, ledger)]
        .filter((sample) => sample.time > game.time - HISTORY_EVERY * HISTORY_POINTS)
        .slice(-HISTORY_POINTS)
    }
    const chosen = next.board.nodeSample
    next = {
      ...next,
      board: {
        ...next.board,
        nodeHistory: history,
        nodeSample:
          chosen && history[chosen.nodeId]?.some((sample) => sample.time === chosen.time)
            ? chosen
            : null,
      },
    }
  }

  // The log records what the player was told and what limited the Design.
  const advice = nextAdvice(game, ledger)
  const told = `${advice.key}|${advice.text}`
  if (told !== next.board.lastGoal) {
    logs.push(line(game.time, 'GoalChanged', { goal: advice.text }))
    next = { ...next, board: { ...next.board, lastGoal: told } }
    if (!offCompany(next))
      next = mailedTo(
        {
          ...next,
          board: { ...next.board, inbox: resolvedExcept(next.board.inbox, advice.key, game.time) },
        },
        factOf(advice, game),
        game.time,
      )
  }
  // Once a calendar hour, a region whose users fell over the hour gets a Customers Mail; its
  // thread resolves when the region grows again (GDD 12 "The Churn breakdown").
  if (
    !offCompany(next) &&
    Math.floor(game.time / CALENDAR_HOUR) > Math.floor(model.board.game.time / CALENDAR_HOUR)
  ) {
    for (const region of churnOf(game, ledger)) {
      const key = `customers:churn:${region.region}`
      const falling = region.perHour < 0 && regionApdexOf(game, region.region) < region.target
      const open = next.board.inbox.mail.some(
        (mail) => mail.key === key && mail.resolved === null && !mail.trashed,
      )
      if (falling) next = mailedTo(next, churnFact(game, region), game.time)
      else if (open)
        next = {
          ...next,
          board: {
            ...next.board,
            inbox: closed(
              next.board.inbox,
              key,
              game.time,
              `${REGION_INFO[region.region].name} is growing again.`,
            ),
          },
        }
    }
  }
  // The world writes too: teammates, CVEs, customers, and spam.
  const bucket = Math.floor(game.time / EVENT_EVERY)
  if (!offCompany(next) && game.stage >= 1 && bucket > next.board.inbox.bucket) {
    const event = eventMail(game, bucket)
    next = { ...next, board: { ...next.board, inbox: { ...next.board.inbox, bucket } } }
    if (event) next = mailedTo(next, event, game.time)
  }
  const marker = bottleneck ? `${bottleneck}:${ledger.nodes[bottleneck]?.limit ?? 'none'}` : ''
  if (marker !== next.board.lastBottleneck) {
    logs.push(line(game.time, 'BottleneckChanged', { bottleneck: marker || null }))
    next = { ...next, board: { ...next.board, lastBottleneck: marker } }
  }
  if (game.time - next.board.clock.sampledAt >= SAMPLE_EVERY) {
    logs.push(line(game.time, 'Sample', sampleOf(next, ledger)))
    next = {
      ...next,
      board: { ...next.board, clock: { ...next.board.clock, sampledAt: game.time } },
    }
  }
  if (game.time - model.board.clock.savedAt >= SAVE_EVERY) {
    next = { ...next, board: { ...next.board, clock: { ...next.board.clock, savedAt: game.time } } }
    if (!offCompany(next)) commands.push(saveOf(next))
    else if (next.board.sandbox?.id === null) {
      next = { ...next, freeBoard: game }
      commands.push(WriteSandboxStore({ store: storeOf(next) }))
    }
  }
  // The Founder records each Era reached in a Company.
  if (!offCompany(next) && !next.founder.erasReached.includes(game.stage)) {
    next = { ...next, founder: recordEra(next.founder, game.stage) }
    commands.push(WriteFounder({ founder: next.founder }))
  }
  if (logs.length > 0) commands.push(AppendLog({ entries: logs }))
  return milestones(model, { model: next, commands }, events, ledger)
}

const NUDGES: Record<string, readonly [number, number]> = {
  'Shift+ArrowUp': [0, -NUDGE],
  'Shift+ArrowDown': [0, NUDGE],
  'Shift+ArrowLeft': [-NUDGE, 0],
  'Shift+ArrowRight': [NUDGE, 0],
}

const ARROWS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const startCompany = (model: Model, game: Game, panel: Model['panel']): Result => {
  const fresh: Model = {
    ...model,
    route: AppRoute.Company(),
    saved: true,
    toast: null,
    panel,
    company: null,
    board: freshBoard(game),
  }
  const next = revealAtStart(fresh, ledgerOf(fresh))
  return {
    model: next,
    commands: [
      saveOf(next),
      FitBoard({}),
      AppendLog({
        entries: [
          line(game.time, 'CompanyStarted', {
            stage: game.stage,
            seed: game.seed,
            viewport:
              typeof window === 'undefined' ? null : [window.innerWidth, window.innerHeight],
            agent: typeof navigator === 'undefined' ? null : navigator.userAgent,
          }),
        ],
      }),
    ],
  }
}

/** Opens a Sandbox on the board. The Company waits aside until the title screen. */
const enterSandbox = (model: Model, game: Game, run: SandboxRun): Result => {
  const next: Model = {
    ...model,
    route: AppRoute.Sandbox({ sandbox: run.id ?? 'free' }),
    toast: null,
    panel: 'none',
    company: offCompany(model) ? model.company : model.board,
    board: { ...freshBoard(game), sandbox: run },
  }
  return {
    model: next,
    commands: [
      FitBoard({}),
      AppendLog({ entries: [line(game.time, 'SandboxStarted', { sandbox: run.id ?? 'free' })] }),
    ],
  }
}

/** Swaps the free Sandbox's Game, keeping the player's view. */
const replaceFree = (model: Model, game: Game, text: string): Result => {
  if (model.board.sandbox?.id !== null) return { model }
  const next: Model = {
    ...model,
    freeBoard: game,
    board: {
      ...model.board,
      game,
      selected: null,
      tool: null,
      undo: [],
      redo: [],
      change: null,
      delta: null,
      bottleneck: null,
      bottleneckAt: -1,
      nodeHistory: {},
      nodeSample: null,
      dashboard: { ...model.board.dashboard, history: EMPTY_HISTORY },
      clock: { ...model.board.clock, savedAt: game.time, sampledAt: game.time },
    },
  }
  return withToast(next, text, 'plain', [FitBoard({}), WriteSandboxStore({ store: storeOf(next) })])
}

/** Changes the free Sandbox's demand or mix in place. */
const tuneFree = (model: Model, game: Game): Result => {
  if (model.board.sandbox?.id !== null) return { model }
  const next: Model = { ...model, board: { ...model.board, game, bottleneckAt: -1 } }
  return { model: next }
}

/** Demand steps on the free Sandbox, in users. */
const DEMAND_STEPS = [100, 250, 500, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000]

/** After a round: the Era card, or the end of the slice. */
const afterRound = (game: Game): Model['panel'] => (isFinalEra(game) ? 'end' : 'era')

/* ---------- the Founder ---------- */

const parseFounder = Schema.decodeUnknownOption(Schema.fromJsonString(Founder))

/** Applies a change to the Founder record, saves it, or says why not. */
const changeFounder = (
  model: Model,
  change: Result.Result<Founder, Actions.Refusal>,
  done?: string,
): Result =>
  Result.match(change, {
    onFailure: (refusal) => withToast(model, Actions.describeRefusal(refusal), 'warn'),
    onSuccess: (founder) => {
      const next: Model = { ...model, founder }
      const commands = [WriteFounder({ founder })]
      return done ? withToast(next, done, 'ok', commands) : { model: next, commands }
    },
  })

/** Founds the next Company with the Founder's Venture, Mutators, perks and kept research. */
const found = (model: Model): Result => {
  const founder = founded(model.founder)
  const game = foundCompany(
    model.board.game.seed + 7919,
    foundingOf(model.founder),
    model.founder.keep,
  )
  const started = startCompany({ ...model, founder }, game, game.stage >= 1 ? 'era' : 'none')
  return {
    ...started,
    commands: [...(started.commands ?? []), WriteFounder({ founder })],
  }
}

/** Leaves an exited Company for the title screen: nothing to continue, nothing to save. */
const leaveExited = (model: Model, menu: Menu): Result => ({
  model: {
    ...model,
    route: routeOfMenu(menu),
    panel: 'none',
    saved: false,
    board: freshBoard(newGame(model.board.game.seed)),
  },
})

/** The IPO lists the Company: Legacy for the listing, and the Company goes on as Public. */
const listed = (model: Model, game: Game): Readonly<{ game: Game; founder: Founder }> => {
  const ipo = ipoExit(game, solveFlow(game))
  return { game: ipo.game, founder: recordExit(model.founder, ipo) }
}

/* ---------- Challenges ---------- */

const foldLanguagePicker = Update.foldChild({
  update: languageListbox.update,
  read: (model: Model) => Option.some(model.languagePicker),
  write: (model, languagePicker) => ({ ...model, languagePicker }),
  toParentMessage: (message) => Message.LanguagePickerChanged({ message }),
  foldOutMessage:
    ({ value }) =>
    (model) =>
      handle(
        model,
        Message.PrefsChanged({ message: PrefsMessage.LocaleChosen({ locale: value }) }),
      ),
})

/** What each item in the phone toolbar's More menu does: the same as its desktop button. */
const MORE_ACTIONS: Record<MoreItem, Message> = {
  exit: Message.PanelOpened({ panel: 'exit' }),
  playbooks: Message.PanelOpened({ panel: 'playbooks' }),
  dashboard: Message.PanelOpened({ panel: 'dashboard' }),
  help: Message.PanelOpened({ panel: 'help' }),
  glossary: Message.GlossaryOpened({ id: null }),
  undo: Message.UndoChosen(),
  redo: Message.RedoChosen(),
  tidy: Message.BoardTidied(),
  fit: Message.BoardFitted(),
  fullscreen: Message.FullscreenToggled(),
}

const foldMoreMenu = Update.foldChild({
  update: moreMenu.update,
  read: (model: Model) => Option.some(model.moreMenu),
  write: (model, moreMenu) => ({ ...model, moreMenu }),
  toParentMessage: (message) => Message.MoreMenuChanged({ message }),
  foldOutMessage:
    ({ value }) =>
    (model) =>
      handle(model, MORE_ACTIONS[value]),
})

const histograms = histogramQuery.lift<Model, Message>({
  parentField: 'histograms',
  toParentMessage: (message) => Message.GotHistograms({ message }),
})

/**
 * A Challenge's start with its cards apart: each card in board order moves to the nearest
 * spot that keeps its clearance in its region. Fixed cards stay put, so the run's board,
 * which takes the Design's positions, shows the same layout.
 */
const spreadOut = (game: Game): Game => {
  const settled = new Map<string, Array<Box>>()
  const taken = (region: string) => settled.get(region) ?? []
  for (const node of game.nodes.filter((entry) => COMPONENTS[entry.type].fixed))
    settled.set(node.region, [...taken(node.region), boxOf(node)])
  let next = game
  for (const node of game.nodes.filter((entry) => !COMPONENTS[entry.type].fixed)) {
    const spot = freeSpot(taken(node.region), boxOf(node))
    settled.set(node.region, [...taken(node.region), { ...boxOf(node), ...spot }])
    if (spot.x !== node.x || spot.y !== node.y) next = Actions.move(next, node.id, spot.x, spot.y)
  }
  return next
}

const boardOf = (challenge: Challenge): Game =>
  spreadOut({ ...challenge.start(), users: challenge.demand[0]?.users ?? 0 })

/** Opens a Challenge's build board. The Company waits aside, as for a Sandbox. */
const enterChallenge = (model: Model, id: string): Result => {
  const challenge = challengeById(id)
  if (!challenge) return { model }
  const game = boardOf(challenge)
  const next: Model = {
    ...model,
    route: AppRoute.Challenge({ challenge: id }),
    toast: null,
    panel: 'none',
    company: offCompany(model) ? model.company : model.board,
    board: {
      ...freshBoard(game),
      challenge: {
        id,
        phase: 'build',
        board: null,
        replay: null,
        totals: NO_TOTALS,
        result: null,
        verdict: null,
        verification: 'local',
        note: null,
      },
    },
  }
  const loaded = histograms.loadIfMissing(next, { challengeId: id, simVersion: SIM_VERSION })
  return {
    model: loaded.model,
    commands: [
      FitBoard({}),
      ...(loaded.commands ?? []),
      AppendLog({ entries: [line(game.time, 'ChallengeStarted', { challenge: id })] }),
    ],
  }
}

/** Run: the Design restarts from t = 0 on the Challenge's seed. Only this run is scored. */
const startRun = (model: Model, run: ChallengeRun): Result => {
  const challenge = challengeById(run.id)
  if (!challenge || run.phase !== 'build') return { model }
  const replay = {
    v: 1 as const,
    challenge: run.id,
    simVersion: SIM_VERSION,
    design: designOf(model.board.game),
    actions: [],
  }
  return Result.match(beginRun(challenge, replay), {
    onFailure: (reason) => withToast(model, reason, 'warn'),
    onSuccess: (game) => {
      const next: Model = {
        ...model,
        panel: 'none',
        board: {
          ...model.board,
          game,
          challenge: {
            ...run,
            phase: 'running',
            board: model.board.game,
            replay,
            totals: NO_TOTALS,
          },
          tool: null,
          selected: null,
          bottleneckAt: -1,
          clock: { ...model.board.clock, carry: 0, paused: false },
        },
      }
      return { model: next }
    },
  })
}

/** Runs canonical Steps: the clock's share, or every one left when `all`. */
const runSteps = (
  model: Model,
  run: ChallengeRun,
  all: boolean,
): Readonly<{ model: Model; done: boolean }> => {
  const challenge = challengeById(run.id)
  if (!challenge || !run.replay) return { model, done: false }
  const owed = all
    ? Number.POSITIVE_INFINITY
    : model.board.clock.carry +
      (STEPS_PER_TICK * model.board.clock.speed * STEP_SECONDS) / challenge.stepSeconds
  const total = stepsOf(challenge)
  let game = model.board.game
  let totals = run.totals
  let taken = 0
  while (totals.step < total && taken + 1 <= owed) {
    const next = advanceRun(challenge, run.replay, game, totals)
    game = next.game
    totals = next.totals
    taken += 1
  }
  return {
    model: {
      ...model,
      board: {
        ...model.board,
        game,
        challenge: { ...run, totals },
        clock: { ...model.board.clock, carry: all ? 0 : owed - taken },
      },
    },
    done: totals.step >= total,
  }
}

/** The run is over: the provisional result shows, and the server is asked to confirm it. */
const finishRun = (model: Model): Result => {
  const run = model.board.challenge
  const challenge = run ? challengeById(run.id) : undefined
  if (!run || !challenge || !run.replay) return { model }
  const result = resultOf(challenge, model.board.game, run.totals)
  const first = result.passed && !model.founder.completed.includes(run.id)
  const founder = result.passed
    ? completeChallenge(model.founder, run.id, challenge.legacy)
    : model.founder
  const next: Model = {
    ...model,
    founder,
    panel: 'challenge',
    board: {
      ...model.board,
      challenge: { ...run, phase: 'result', result, verification: 'sending' },
    },
  }
  const commands: Array<AnyCommand> = [
    SubmitChallenge({
      submission: {
        challengeId: run.id,
        simVersion: SIM_VERSION,
        deviceId: founder.deviceId,
        replay: encodeReplay(run.replay),
      },
    }),
    AppendLog({
      entries: [line(model.board.game.time, 'ChallengeRun', { challenge: run.id, ...result })],
    }),
  ]
  if (founder !== model.founder) commands.push(WriteFounder({ founder }))
  return first && challenge.legacy > 0
    ? withToast(next, `First completion: +${challenge.legacy} Legacy.`, 'ok', commands)
    : { model: next, commands }
}

const runTick = (model: Model, run: ChallengeRun): Result => {
  const ran = runSteps(model, run, false)
  return ran.done ? finishRun(ran.model) : { model: ran.model }
}

/** A run action is logged at the next Step and applied there, as the server will apply it. */
const logRunAction = (model: Model, action: ReplayAction): Result | null => {
  const run = model.board.challenge
  if (run?.phase !== 'running' || !run.replay) return null
  const replay = {
    ...run.replay,
    actions: [...run.replay.actions, { step: run.totals.step, action }],
  }
  return { model: { ...model, board: { ...model.board, challenge: { ...run, replay } } } }
}

/** An incident response during a run: logged like any run action, or refused when the Challenge forbids it. */
const logResponse = (model: Model, response: Response): Result | null => {
  const run = model.board.challenge
  if (run?.phase !== 'running') return null
  const challenge = challengeById(run.id)
  const action: ReplayAction = { _tag: 'Respond', response }
  if (challenge && !responseAllowed(challenge, action))
    return withToast(model, 'This Challenge does not allow that.', 'warn')
  return logRunAction(model, action)
}

/** Leaves a Challenge for the Challenges menu; the Company comes back as it was. */
/** The Company's board as the player left it for a Sandbox or Challenge. Its Bottleneck is searched again. */
const companyBoard = (model: Model): Board =>
  model.company ? { ...model.company, bottleneckAt: -1 } : freshBoard(newGame())

const leaveChallenge = (model: Model): Result => ({
  model: {
    ...model,
    route: AppRoute.Menu({ menu: 'challenges' }),
    panel: 'none',
    board: companyBoard(model),
    company: null,
  },
})

/* ---------- routes ---------- */

const continued = (model: Model): Result => {
  const next: Model = {
    ...model,
    route: AppRoute.Company(),
    panel: model.board.away ? 'away' : 'none',
    board: { ...model.board, clock: { ...model.board.clock, paused: false } },
  }
  return {
    model: next,
    commands: [AppendLog({ entries: [line(model.board.game.time, 'SessionResumed', {})] })],
  }
}

/** Closes the board for the title screen. A Sandbox or Challenge gives the Company back. */
const leaveBoard = (model: Model): Result => {
  if (model.board.exited) return leaveExited(model, 'found')
  if (model.board.challenge) return leaveChallenge(model)
  if (!model.board.sandbox)
    return {
      model: {
        ...model,
        route: AppRoute.Title(),
        panel: 'none',
        board: { ...model.board, tool: null },
      },
      commands: [saveOf(model)],
    }
  const freeBoard = model.board.sandbox.id === null ? model.board.game : model.freeBoard
  const next: Model = {
    ...model,
    route: AppRoute.Menu({ menu: 'sandbox' }),
    panel: 'none',
    board: companyBoard(model),
    company: null,
    freeBoard,
  }
  return { model: next, commands: [WriteSandboxStore({ store: storeOf(next) })] }
}

/** Opens a route's screen. A board that cannot open (no Company to continue)
 *  leaves the Model as it is; a locked Challenge lands on the Challenge list. */
const open = (model: Model, route: AppRoute): Result =>
  AppRoute.match<Result>(route, {
    Title: () => ({ model: { ...model, route } }),
    Menu: () => ({ model: { ...model, route } }),
    Company: () => (model.saved ? continued(model) : { model }),
    Sandbox: ({ sandbox }) =>
      sandbox === 'free'
        ? enterSandbox(model, model.freeBoard ?? freeSandbox(), { id: null, progress: START })
        : enterSandbox(model, GUIDED[sandbox].start(), { id: sandbox, progress: START }),
    Challenge: ({ challenge }) => {
      const entry = challengeById(challenge)
      if (!entry) return { model }
      return challengeOpen(entry, model.founder.completed)
        ? enterChallenge(model, challenge)
        : { model: { ...model, route: AppRoute.Menu({ menu: 'challenges' }) } }
    },
  })

/** Follows a URL from back, forward, or a link: closes the open board, opens
 *  the route's screen, and corrects the URL when that screen cannot open. */
const visit = (model: Model, url: Url): Result => {
  const route = urlToAppRoute(url)
  if (urlOf(route) === urlOf(model.route)) return { model }
  const left = onBoard(model.route) ? leaveBoard(model) : { model }
  const opened = open(left.model, route)
  const landed = urlOf(opened.model.route)
  return {
    model: opened.model,
    commands: [
      ...(left.commands ?? []),
      ...(opened.commands ?? []),
      ...(landed === urlOf(route) ? [] : [ReplaceUrl({ url: landed })]),
    ],
  }
}

/* ---------- update ---------- */

/** Handles a Message and adds its sound cue. Messages that route to another
 *  Message (keys, the Collect footer) sound once, as the Message they became. */
const route = (model: Model, message: Message): Result => {
  const handled = handle(model, message)
  const result = { ...handled, model: noticed(handled.model, message) }
  if (result.model.prefs.muted || result.commands?.some((command) => command.name === 'PlaySound'))
    return result
  const cue = cueOf(model, message, result.model)
  return cue ? { ...result, commands: [...(result.commands ?? []), PlaySound(cue)] } : result
}

const handle = (model: Model, message: Message): Result =>
  Message.match<Result>(message, {
    SaveLoaded: ({ json, now }) => {
      if (json === null) return { model }
      const raw = parseJson(json)
      const decoded = Option.match(raw, {
        onNone: () => Exit.fail('The save is not JSON.'),
        onSome: (value) => Exit.mapError(decodeGame(value), (error) => error.message),
      })
      // A save this version cannot read is set aside, not overwritten by the next Company.
      if (Exit.isFailure(decoded))
        return withToast(model, 'Your save could not be read. A copy was kept.', 'warn', [
          KeepBrokenSave({ json, reason: String(Cause.squash(decoded.cause)) }),
        ])
      const saved = decoded.value
      const file = Option.getOrNull(raw)
      // Time away plays out at 1×: a real second is a sim second (04 "Offline progress").
      const away = saved.wall > 0 ? (now - saved.wall) / 1_000 : 0
      const back = away >= OFFLINE_MIN && !saved.sandbox ? simulateAway(saved, away) : null
      const game = back?.game ?? saved
      return {
        model: {
          ...model,
          saved: true,
          board: {
            ...model.board,
            disclosure: { ...model.board.disclosure, ...revealsOfSave(file) },
            dashboard: { ...model.board.dashboard, history: historyOfSave(file) },
            game,
            clock: { ...model.board.clock, savedAt: game.time, sampledAt: game.time },
            bottleneckAt: -1,
            away: back?.report ?? null,
          },
        },
        commands: back
          ? [AppendLog({ entries: [line(game.time, 'OfflineReturned', { ...back.report })] })]
          : [],
      }
    },
    FounderLoaded: ({ json, deviceId, today }) => {
      const loaded = Option.getOrElse(
        json === null ? Option.none() : parseFounder(json),
        () => model.founder,
      )
      if (loaded.deviceId) return { model: { ...model, founder: loaded, today } }
      const founder = { ...loaded, deviceId }
      return { model: { ...model, founder, today }, commands: [WriteFounder({ founder })] }
    },

    Saved: () => ({ model: model.saved ? model : { ...model, saved: true } }),

    Continued: () => continued(model),
    Connected: () => ({ model: { ...model, connecting: false } }),

    NewCompanyStarted: () => found(model),
    CompanyFounded: () => found(model),
    PreseedStarted: () =>
      startCompany(
        model,
        { ...preseedGame(model.board.game.seed + 7919), founding: foundingOf(model.founder) },
        'era',
      ),
    AwayClosed: () => ({
      model: { ...model, panel: 'none', board: { ...model.board, away: null } },
    }),

    TitleOpened: () => leaveBoard(model),
    ClockedIn: () => clockIn(model),
    TitleRevealed: () => ({ model: { ...model, gate: 'open' } }),
    MenuChosen: ({ menu }) =>
      model.board.exited
        ? leaveExited(model, menu)
        : { model: { ...model, route: routeOfMenu(menu) } },
    ClickedLink: ({ request }) =>
      UrlRequest.match<Result>(request, {
        Internal: ({ url }) => ({ model, commands: [PushUrl({ url: urlToString(url) })] }),
        External: ({ href }) => ({ model, commands: [LoadUrl({ href })] }),
      }),
    ChangedUrl: ({ url }) => visit(model, url),
    Navigated: () => ({ model }),

    PrefsLoaded: ({ json }) =>
      Option.match(json === null ? Option.none() : parsePrefs(json), {
        onNone: () => ({ model }),
        onSome: (prefs) => ({
          model: {
            ...model,
            prefs,
          },
          commands: [
            ApplySettings({
              muted: prefs.muted,
              motion: prefs.motion,
              locale: prefs.locale,
              agentAccess: prefs.agentAccess,
            }),
          ],
        }),
      }),

    OptionPreviewed: ({ nodeId, option }) => {
      if (model.board.tradeoff?.pinned) return { model }
      const [card, commands] = tradeoffOf(model, nodeId, option, false)
      return { model: { ...model, board: { ...model.board, tradeoff: card } }, commands }
    },
    PreviewComputed: ({ nodeId, option, preview }) => {
      const card = model.board.tradeoff
      const same =
        card?.nodeId === nodeId && card.option.kind === option.kind && card.option.id === option.id
      return same
        ? { model: { ...model, board: { ...model.board, tradeoff: { ...card, preview } } } }
        : { model }
    },
    BottleneckFound: ({ bottleneck, at }) => {
      if (at !== model.board.bottleneckAt || bottleneck === model.board.bottleneck) return { model }
      const next: Model = { ...model, board: { ...model.board, bottleneck } }
      return { model: next }
    },
    OptionLeft: () =>
      model.board.tradeoff && !model.board.tradeoff.pinned
        ? { model: { ...model, board: { ...model.board, tradeoff: null } } }
        : { model },
    OptionChosen: ({ nodeId, option }) => {
      // Once an option set is confirmed, its options apply on click; the card stays one line.
      if (model.prefs.seenTradeoffs.includes(option.kind)) {
        const hovered = model.board.tradeoff
        const same =
          hovered?.nodeId === nodeId &&
          hovered.option.kind === option.kind &&
          hovered.option.id === option.id
        return applyOption(model, {
          nodeId,
          option,
          pinned: true,
          preview: same ? hovered.preview : null,
          refusal: null,
        })
      }
      const [card, commands] = tradeoffOf(model, nodeId, option, true)
      return { model: { ...model, board: { ...model.board, tradeoff: card } }, commands }
    },
    OptionConfirmed: () =>
      model.board.tradeoff?.pinned ? applyOption(model, model.board.tradeoff) : { model },
    TradeoffClosed: () => ({ model: { ...model, board: { ...model.board, tradeoff: null } } }),

    SandboxStoreLoaded: ({ json }) =>
      Option.match(json === null ? Option.none() : parseStore(json), {
        onNone: () => ({ model }),
        onSome: (store) => ({ model: { ...model, passed: store.passed, freeBoard: store.free } }),
      }),
    ChallengeStarted: ({ id }) => enterChallenge(model, id),
    ChallengeRan: () =>
      model.board.challenge ? startRun(model, model.board.challenge) : { model },
    ChallengeFinished: () => {
      const run = model.board.challenge
      if (run?.phase !== 'running') return { model }
      return finishRun(runSteps(model, run, true).model)
    },
    FixChosen: ({ fix, on }) =>
      act(
        model,
        `${TASKS[fix].name} ${on ? 'on' : 'off'}`,
        Work.setFix(model.board.game, fix, on),
        {
          undoable: true,
        },
      ),
    ChallengeRebuilt: () => {
      const run = model.board.challenge
      if (!run?.board) return { model }
      const next: Model = {
        ...model,
        panel: 'none',
        board: {
          ...model.board,
          game: run.board,
          bottleneckAt: -1,
          challenge: {
            ...run,
            phase: 'build',
            board: null,
            replay: null,
            totals: NO_TOTALS,
            result: null,
            verdict: null,
            verification: 'local',
            note: null,
          },
        },
      }
      return { model: next }
    },
    ChallengeVerified: ({ verdict }) => {
      const run = model.board.challenge
      if (!run) return { model }
      const percentiles = verdict.percentiles
      const [next, earned] = achieve(
        {
          ...model,
          board: {
            ...model.board,
            challenge: { ...run, verdict, verification: 'verified', note: null },
          },
        },
        percentiles
          ? challengeAchievements([percentiles.cost, percentiles.tail, percentiles.complexity])
          : [],
      )
      const fetched = histograms.revalidate(next, { challengeId: run.id, simVersion: SIM_VERSION })
      return { ...fetched, commands: [...(fetched.commands ?? []), ...earned] }
    },
    ChallengeUnverified: ({ message, offline }) => {
      const run = model.board.challenge
      if (!run) return { model }
      return {
        model: {
          ...model,
          board: {
            ...model.board,
            challenge: { ...run, verification: offline ? 'offline' : 'unverified', note: message },
          },
        },
      }
    },
    GotHistograms: ({ message }) => histograms.fold(model, message),
    GuidedStarted: ({ id }) => enterSandbox(model, GUIDED[id].start(), { id, progress: START }),
    FreeSandboxStarted: () =>
      enterSandbox(model, model.freeBoard ?? freeSandbox(), { id: null, progress: START }),
    FreeSandboxReset: () => replaceFree(model, freeSandbox(), 'The free Sandbox is reset.'),
    StressBoardLoaded: ({ big }) =>
      big
        ? replaceFree(model, bigBoard(), 'The big board is loaded.')
        : replaceFree(model, stressBoard(), 'The stress board is loaded.'),
    CompanyCopied: () =>
      model.company && model.saved
        ? replaceFree(model, sandboxOf(model.company.game), 'Copied the Company Design.')
        : withToast(model, 'There is no Company to copy.', 'plain'),
    DemandStepped: ({ direction }) => {
      const index = DEMAND_STEPS.findIndex((users) => users >= model.board.game.users)
      const at = index === -1 ? DEMAND_STEPS.length - 1 : index
      const users =
        DEMAND_STEPS[Math.max(0, Math.min(DEMAND_STEPS.length - 1, at + direction))] ?? 1_000
      return tuneFree(model, { ...model.board.game, users })
    },
    MixChosen: ({ stage }) => tuneFree(model, { ...model.board.game, stage }),

    Ticked: () => tick(model),

    SpeedCycled: () => {
      const speeds = speedsOf(model.board.game)
      const index = speeds.indexOf(model.board.clock.speed)
      return {
        model: {
          ...model,
          board: {
            ...model.board,
            clock: { ...model.board.clock, speed: speeds[(index + 1) % speeds.length] ?? 1 },
          },
        },
      }
    },
    SpeedChosen: ({ speed }) => ({
      model: { ...model, board: { ...model.board, clock: { ...model.board.clock, speed } } },
    }),
    PauseToggled: () => {
      const next = {
        ...model,
        board: {
          ...model.board,
          clock: { ...model.board.clock, paused: !model.board.clock.paused, away: false },
        },
      }
      return { model: next }
    },
    FullscreenToggled: () => ({ model, commands: [ToggleFullscreen({})] }),
    BoardFitted: () => ({ model, commands: [FitBoard({})] }),
    BoardTidied: () => {
      const view = regionView(model.board.game, model.board.region)
      const nodes = view.nodes.map((node) => ({
        ...node,
        group: zoned(node) ? node.zone : 'all',
      }))
      const spots = tidy(nodes, view.links, ['all', 'a', 'b', 'c'])
      const game = [...spots].reduce(
        (game, [id, spot]) => Actions.move(game, id, spot.x, spot.y),
        model.board.game,
      )
      const tidied = act(model, 'Tidied the board by zone', Result.succeed(game), {
        undoable: true,
      })
      return { ...tidied, commands: [...(tidied.commands ?? []), FitBoard({})] }
    },

    KeyPressed: ({ key }) => {
      if (!onBoard(model.route)) return key === 'Escape' ? { model } : clockIn(model)
      if (model.panel === 'inbox') {
        const mail = mailKey(model, key)
        if (mail) return mail
      }
      const selected = model.board.selected
      switch (key) {
        case 'Escape': {
          if (model.board.exited) return leaveExited(model, 'found')
          if (model.board.confirmSell)
            return { model: { ...model, board: { ...model.board, confirmSell: null } } }
          if (model.board.tradeoff)
            return { model: { ...model, board: { ...model.board, tradeoff: null } } }
          if (model.board.insightHelp)
            return { model: { ...model, board: { ...model.board, insightHelp: false } } }
          if (model.board.tool?._tag === 'Stamping' || model.board.selection.length > 0) {
            const cleared: Model = {
              ...model,
              board: {
                ...model.board,
                tool: model.board.tool?._tag === 'Stamping' ? null : model.board.tool,
                selection: [],
              },
            }
            return { model: cleared }
          }
          const next: Model =
            model.board.tool !== null
              ? { ...model, board: { ...model.board, tool: null } }
              : model.board.buildGroup !== null
                ? { ...model, board: { ...model.board, buildGroup: null } }
                : model.panel !== 'none'
                  ? closePanel(model)
                  : model.board.selected !== null
                    ? { ...model, board: { ...model.board, selected: null } }
                    : { ...model, panel: 'menu' }
          return { model: next }
        }
        case 'r':
          if (offCompany(model) || !shown(model, 'research')) return { model }
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'research' ? 'none' : 'research' }),
          )
        case 't':
          if (offCompany(model) || !shown(model, 'team')) return { model }
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'team' ? 'none' : 'team' }),
          )
        case 'd':
          if (!has(model.board.game, 'metrics')) return { model }
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'dashboard' ? 'none' : 'dashboard' }),
          )
        case 'p':
          if (!playbooksShown(model)) return { model }
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'playbooks' ? 'none' : 'playbooks' }),
          )
        case '?':
        case 'h':
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'help' ? 'none' : 'help' }),
          )
        case '`':
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'dev' ? 'none' : 'dev' }),
          )
        case 'i':
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'inbox' ? 'none' : 'inbox' }),
          )
        case 'm':
          return route(model, Message.PrefsChanged({ message: PrefsMessage.MuteToggled() }))
        case 'g':
          if (!shown(model, 'glossary')) return { model }
          return model.panel === 'glossary'
            ? { model: { ...model, panel: 'none' } }
            : route(model, Message.GlossaryOpened({ id: null }))
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          if (model.panel !== 'none') return { model }
          const direction = ARROWS[key] ?? 'right'
          const id = nearestNode(
            regionView(model.board.game, model.board.region).nodes,
            selected,
            direction,
          )
          return id && id !== selected
            ? route(model, Message.NodeTapped({ nodeId: id }))
            : { model }
        }
        case 'Enter':
          if (model.board.confirmSell) return route(model, Message.SellConfirmed())
          if (model.panel !== 'none') return { model }
          return selected ? { model, commands: [FocusInspector({})] } : { model }
        case ' ':
          return route(model, Message.PauseToggled())
        case 's':
          return route(model, Message.SpeedCycled())
        case 'f':
          return { model, commands: [ToggleFullscreen({})] }
        case 'c':
          return route(model, Message.Collected())
        case 'z':
          return route(model, Message.UndoChosen())
        case 'Z':
        case 'y':
          return route(model, Message.RedoChosen())
        case 'u':
          return selected
            ? route(model, Message.ResizeChosen({ nodeId: selected, direction: 1 }))
            : { model }
        case 'Mod+a':
          return model.panel === 'none' ? route(model, Message.SelectionAll()) : { model }
        case 'Mod+c':
          return model.panel === 'none' ? route(model, Message.NodesCopied()) : { model }
        case 'Mod+x':
          return model.panel === 'none' ? route(model, Message.NodesCut()) : { model }
        case 'Mod+d':
          return model.panel === 'none' ? route(model, Message.NodesDuplicated()) : { model }
        case 'Shift+ArrowUp':
        case 'Shift+ArrowDown':
        case 'Shift+ArrowLeft':
        case 'Shift+ArrowRight': {
          if (model.panel !== 'none') return { model }
          const step = NUDGES[key] ?? [0, 0]
          return route(model, Message.NodesNudged({ dx: step[0], dy: step[1] }))
        }
        case 'Mod+v':
          return model.panel === 'none' ? route(model, Message.NodesPasted()) : { model }
        case 'Delete':
        case 'Backspace':
          return route(model, Message.SellAsked())
        default: {
          // With a group open, a digit picks that part.
          const picked = (
            model.board.buildGroup ? dockItems(model.board.game, model.board.buildGroup) : []
          )[Number(key) - 1]
          if (picked) return route(model, Message.PlacingChosen({ type: picked }))
          const group = /^[1-9]$/.test(key)
            ? dockGroups(model.board.game)[Number(key) - 1]
            : undefined
          return group ? route(model, Message.BuildGroupChosen({ group })) : { model }
        }
      }
    },

    BuildGroupChosen: ({ group }) => ({
      model: {
        ...model,
        board: { ...model.board, buildGroup: model.board.buildGroup === group ? null : group },
      },
    }),

    PlacingChosen: ({ type }) => {
      // Picking a part closes its list: the board is the next step.
      const next: Model = {
        ...model,
        panel: 'none',
        board: {
          ...model.board,
          tool: type === null || placingOf(model) === type ? null : { _tag: 'Placing', type },
          buildGroup: null,
        },
      }
      return { model: next }
    },

    NodePlaced: ({ x, y }) => {
      const playbook = stampedPlaybook(model)
      // Nothing lands on a card: a drop moves to the nearest spot that keeps clear.
      const others = regionView(model.board.game, model.board.region).nodes.map(boxOf)
      if (playbook) {
        const spot = freeSpot(others, {
          x,
          y,
          w: Math.max(...playbook.nodes.map((node) => node.dx)) + CARD_W,
          h: Math.max(...playbook.nodes.map((node) => node.dy + heightOf(node.type))),
        })
        const placed = placePlaybook(model.board.game, playbook, spot.x, spot.y, model.board.region)
        return act(
          model,
          `Placed ${playbook.name}`,
          Result.map(placed, (result) => result.game),
          {
            undoable: true,
            patch: () => ({ tool: null }),
            note: () =>
              Result.match(placed, {
                onFailure: () => null,
                onSuccess: (result): Note =>
                  result.ghosts.length > 0
                    ? [
                        `Placed ${result.placed}. ${result.ghosts.length} need research: ${[
                          ...new Set(
                            result.ghosts.map((ghost) =>
                              ghostReason(model.board.game, ghost, model.board.region),
                            ),
                          ),
                        ].join(', ')}.`,
                        'warn',
                      ]
                    : [`Placed ${playbook.name}.`, 'ok'],
              }),
          },
        )
      }
      const type = placingOf(model)
      if (!type) return { model }
      const spot = freeSpot(others, { x, y, w: CARD_W, h: heightOf(type) })
      return act(
        model,
        `Placed ${COMPONENTS[type].name}`,
        Actions.place(model.board.game, type, spot.x, spot.y, model.board.region),
        {
          undoable: true,
          patch: (_, game) => ({ tool: null, selected: game.nodes.at(-1)?.id ?? null }),
        },
      )
    },

    NodeSampleChosen: ({ nodeId, time }) => {
      if (nodeId !== model.board.selected) return { model }
      if (time !== null && !model.board.nodeHistory[nodeId]?.some((sample) => sample.time === time))
        return { model }
      return {
        model: {
          ...model,
          board: { ...model.board, nodeSample: time === null ? null : { nodeId, time } },
        },
      }
    },
    NodeTapped: ({ nodeId }) => {
      const next: Model = {
        ...model,
        board: {
          ...model.board,
          selected: nodeId,
          selection: [],
          nodeSample: model.board.selected === nodeId ? model.board.nodeSample : null,
          tradeoff: model.board.selected === nodeId ? model.board.tradeoff : null,
        },
      }
      return { model: next }
    },
    NodeToggled: ({ nodeId }) => {
      const selection = model.board.selection.includes(nodeId)
        ? model.board.selection.filter((id) => id !== nodeId)
        : [
            ...model.board.selection,
            ...(model.board.selected &&
            model.board.selection.length === 0 &&
            model.board.selected !== nodeId
              ? [model.board.selected]
              : []),
            nodeId,
          ]
      const next: Model = {
        ...model,
        board: { ...model.board, selection, selected: null, tradeoff: null },
      }
      return { model: next }
    },
    SelectionBoxed: ({ ids, mode }) => {
      const selection =
        mode === 'add'
          ? [
              ...new Set([
                ...model.board.selection,
                ...(model.board.selected ? [model.board.selected] : []),
                ...ids,
              ]),
            ]
          : mode === 'subtract'
            ? model.board.selection.filter((id) => !ids.includes(id))
            : [...ids]
      const next: Model = {
        ...model,
        board: { ...model.board, selection, selected: null, tradeoff: null },
      }
      return { model: next }
    },
    SelectionAll: () => {
      const ids = regionView(model.board.game, model.board.region)
        .nodes.filter((node) => !COMPONENTS[node.type].fixed && !SHARED.includes(node.type))
        .map((node) => node.id)
      if (ids.length === 0) return { model }
      const next: Model = {
        ...model,
        board: { ...model.board, selection: ids, selected: null, tradeoff: null },
      }
      return { model: next }
    },
    NodesCopied: () => {
      const playbook = capture(model.board.game, chosenIds(model), 'Nodes')
      if (!playbook) return withToast(model, 'Select the Nodes to copy first.', 'plain')
      const next: Model = { ...model, board: { ...model.board, clipboard: playbook } }
      return withToast(next, `Copied ${countNodes(playbook.nodes.length)}.`, 'ok')
    },
    NodesCut: () => {
      const playbook = capture(model.board.game, chosenIds(model), 'Nodes')
      if (!playbook) return withToast(model, 'Select the Nodes to cut first.', 'plain')
      return act(
        model,
        `Cut ${countNodes(playbook.nodes.length)}`,
        sellAll(
          model.board.game,
          playbook.nodes.map((node) => node.key),
        ),
        {
          undoable: true,
          patch: () => ({ clipboard: playbook, selected: null, selection: [] }),
        },
      )
    },
    NodesPasted: () => {
      if (!model.board.clipboard) return withToast(model, 'Copy some Nodes first.', 'plain')
      const next: Model = {
        ...model,
        panel: 'none',
        board: {
          ...model.board,
          tool: { _tag: 'Stamping', source: 'clipboard' },
          selected: null,
          selection: [],
        },
      }
      return { model: next }
    },
    NodesDuplicated: () => {
      const playbook = capture(model.board.game, chosenIds(model), 'Nodes')
      if (!playbook) return withToast(model, 'Select the Nodes to duplicate first.', 'plain')
      const keys = playbook.nodes.map((node) => node.key)
      const chosen = model.board.game.nodes.filter((node) => keys.includes(node.id))
      const left = Math.min(...chosen.map((node) => node.x))
      const top = Math.min(...chosen.map((node) => node.y))
      const spot = freeSpot(regionView(model.board.game, model.board.region).nodes.map(boxOf), {
        x: left + 48,
        y: top + 48,
        w: Math.max(...playbook.nodes.map((node) => node.dx)) + CARD_W,
        h: Math.max(...playbook.nodes.map((node) => node.dy + heightOf(node.type))),
      })
      const placed = placePlaybook(model.board.game, playbook, spot.x, spot.y, model.board.region)
      return act(
        model,
        `Duplicated ${countNodes(playbook.nodes.length)}`,
        Result.map(placed, (result) => result.game),
        { undoable: true },
      )
    },
    NodesNudged: ({ dx, dy }) => {
      const ids = chosenIds(model)
      if (ids.length === 0) return { model }
      const moving = model.board.game.nodes.filter((node) => ids.includes(node.id))
      const still = regionView(model.board.game, model.board.region)
        .nodes.filter((node) => !ids.includes(node.id))
        .map(boxOf)
      const moved = moving.map((node) => ({ ...boxOf(node), x: node.x + dx, y: node.y + dy }))
      if (moved.some((box) => still.some((other) => crowds(box, other)))) return { model }
      const game = moving.reduce(
        (current, node) => Actions.move(current, node.id, node.x + dx, node.y + dy),
        model.board.game,
      )
      const next: Model = { ...model, board: { ...model.board, game } }
      return { model: next }
    },
    SellAsked: () => {
      if (model.board.confirmSell) return route(model, Message.SellConfirmed())
      const ids = chosenIds(model)
      if (ids.length === 0) return { model }
      const sold = sellAll(model.board.game, ids)
      // Nothing to sell (fixed Nodes): say why, without asking.
      if (Result.isFailure(sold))
        return withToast(model, Actions.describeRefusal(sold.failure), 'warn')
      return { model: { ...model, board: { ...model.board, confirmSell: ids } } }
    },
    SellConfirmed: () => {
      const ids = model.board.confirmSell ?? []
      const cleared: Model = { ...model, board: { ...model.board, confirmSell: null } }
      return act(cleared, `Sold ${countNodes(ids.length)}`, sellAll(model.board.game, ids), {
        undoable: true,
        patch: () => ({ selected: null, selection: [] }),
      })
    },
    SellDismissed: () => ({ model: { ...model, board: { ...model.board, confirmSell: null } } }),
    SelectionCleared: () => {
      const next: Model = { ...model, board: { ...model.board, selection: [] } }
      return { model: next }
    },

    NodeMoved: ({ nodeId, x, y }) => {
      const node = model.board.game.nodes.find((entry) => entry.id === nodeId)
      if (!node) return { model }
      // A card in a multi-selection takes the rest of it along.
      const group =
        model.board.selection.length > 1 && model.board.selection.includes(nodeId)
          ? model.board.selection
          : [nodeId]
      const members = model.board.game.nodes.filter((entry) => group.includes(entry.id))
      const others = regionView(model.board.game, model.board.region)
        .nodes.filter((entry) => !group.includes(entry.id))
        .map(boxOf)
      const left = Math.min(...members.map((entry) => entry.x))
      const top = Math.min(...members.map((entry) => entry.y))
      const spot = freeSpot(others, {
        x: left + x - node.x,
        y: top + y - node.y,
        w: Math.max(...members.map((entry) => entry.x + CARD_W)) - left,
        h: Math.max(...members.map((entry) => entry.y + heightOf(entry.type))) - top,
      })
      const dx = spot.x - left
      const dy = spot.y - top
      const next: Model = {
        ...model,
        board: {
          ...model.board,
          game: members.reduce(
            (game, entry) => Actions.move(game, entry.id, entry.x + dx, entry.y + dy),
            model.board.game,
          ),
        },
      }
      return { model: next }
    },

    LinkRequested: ({ from, to }) =>
      act(
        model,
        `Linked ${nodeName(model.board.game, from)} to ${nodeName(model.board.game, to)}`,
        Actions.connect(model.board.game, from, to),
        {
          undoable: true,
          note: (game) =>
            model.board.game.nodes.find((node) => node.id === from)?.localDb &&
            !game.nodes.find((node) => node.id === from)?.localDb
              ? ['Postgres moved off the App Server to its own Database.', 'ok']
              : null,
        },
      ),

    LinkCut: ({ from, to }) =>
      act(
        model,
        `Cut ${nodeName(model.board.game, from)} → ${nodeName(model.board.game, to)}`,
        Result.succeed(Actions.disconnect(model.board.game, from, to)),
        {
          undoable: true,
        },
      ),

    EmptyTapped: () => {
      if (model.board.selected === null && model.board.selection.length === 0) return { model }
      const next: Model = {
        ...model,
        board: { ...model.board, selected: null, selection: [], tradeoff: null },
      }
      return { model: next }
    },

    FooterPressed: ({ nodeId }) => {
      const node = model.board.game.nodes.find((entry) => entry.id === nodeId)
      if (!node) return { model }
      if (node.type === 'payments') return route(model, Message.Collected())
      if (node.down === -1) return route(model, Message.ReplaceBought({ nodeId }))
      return route(model, Message.ResizeChosen({ nodeId, direction: 1 }))
    },

    ResizeChosen: ({ nodeId, direction }) => {
      const logged = logRunAction(model, { _tag: 'Resize', node: nodeId, direction })
      if (logged) return logged
      const node = model.board.game.nodes.find((entry) => entry.id === nodeId)
      if (!node) return { model }
      const sized = COMPONENTS[node.type].sized
      const size = node.size + direction
      return act(
        model,
        `Resized ${nodeName(model.board.game, nodeId)}`,
        Actions.resize(model.board.game, nodeId, direction),
        {
          undoable: true,
          note: (game) => {
            const spent = model.board.game.cash - game.cash
            return [
              (spent >= BIG_PURCHASE ? 'Upgrade complete! ' : '') +
                (sized
                  ? `${COMPONENTS[node.type].name} is ${SIZES[size]?.name ?? size}. It restarts cold.`
                  : `${COMPONENTS[node.type].name} is size ${size}.`) +
                // A one-click purchase says how to take it back (16 D17).
                (spent > 0 ? ` Undo (Z) refunds ${money(spent)} for ${UNDO_SECONDS} s.` : ''),
              'ok',
            ]
          },
        },
      )
    },

    FamilyChosen: ({ nodeId, family }) =>
      act(
        model,
        `${FAMILIES[family].name} family`,
        Actions.setFamily(model.board.game, nodeId, family),
        {
          undoable: true,
        },
      ),

    RuntimeChosen: ({ nodeId, runtime }) =>
      act(
        model,
        `Runtime ${RUNTIMES[runtime].name}`,
        Work.changeStack(model.board.game, nodeId, { runtime }),
        {
          undoable: !migrates(model.board.game, nodeId),
          note: (game) =>
            migrationNote(model.board.game, game) ?? [
              `Now running ${RUNTIMES[runtime].name}. It restarts cold.`,
              'ok',
            ],
        },
      ),

    FrameworkChosen: ({ nodeId, framework }) =>
      act(
        model,
        `Framework ${FRAMEWORKS[framework].name}`,
        Work.changeStack(model.board.game, nodeId, { framework }),
        {
          undoable: !migrates(model.board.game, nodeId),
          note: (game) => migrationNote(model.board.game, game),
        },
      ),

    WorkersChosen: ({ nodeId, workers }) =>
      act(
        model,
        `Pool size ${Math.round(workers)}`,
        Actions.setWorkers(model.board.game, nodeId, workers),
        {
          undoable: true,
        },
      ),

    PmChosen: ({ nodeId, pm }) =>
      act(model, `pm ${PM_MODES[pm].label}`, Actions.setPm(model.board.game, nodeId, pm), {
        undoable: true,
      }),

    PoolerModeChosen: ({ nodeId, mode }) =>
      act(model, `${mode} pooling`, Actions.setPoolerMode(model.board.game, nodeId, mode), {
        undoable: true,
      }),

    CompressionChosen: ({ nodeId, compress }) =>
      act(
        model,
        compress ? 'Gzip on' : 'Gzip off',
        Actions.setCompression(model.board.game, nodeId, compress),
        { undoable: true },
      ),

    PolicyChosen: ({ nodeId, policy }) =>
      act(
        model,
        `Policy ${LB_POLICIES[policy].label}`,
        Actions.setPolicy(model.board.game, nodeId, policy),
        { undoable: true },
      ),

    HealthCheckChosen: ({ nodeId, checkEvery, deepCheck }) =>
      act(
        model,
        checkEvery === undefined
          ? deepCheck
            ? 'Deep checks'
            : 'Shallow checks'
          : `Checks every ${checkEvery} s`,
        Actions.setHealthCheck(model.board.game, nodeId, {
          ...(checkEvery === undefined ? {} : { checkEvery }),
          ...(deepCheck === undefined ? {} : { deepCheck }),
        }),
        { undoable: true },
      ),

    TtlChosen: ({ nodeId, ttl }) =>
      act(model, `TTL ${duration(ttl)}`, Actions.setTtl(model.board.game, nodeId, ttl), {
        undoable: true,
      }),

    CacheEngineChosen: ({ nodeId, engine }) =>
      act(
        model,
        `Engine ${CACHE_ENGINES[engine].name}`,
        Actions.setCacheEngine(model.board.game, nodeId, engine),
        { undoable: true },
      ),

    LinkPolicyChosen: ({ from, to, timeout, retries, breaker }) =>
      act(
        model,
        breaker !== undefined
          ? breaker
            ? 'Circuit breaker on'
            : 'Circuit breaker off'
          : timeout === undefined
            ? retries === 'naive'
              ? 'Retries on'
              : retries === 'backoff'
                ? 'Retries with backoff'
                : 'Retries off'
            : `Timeout ${timeout} s`,
        Actions.setLinkPolicy(model.board.game, from, to, {
          ...(timeout === undefined ? {} : { timeout }),
          ...(retries === undefined ? {} : { retries }),
          ...(breaker === undefined ? {} : { breaker }),
        }),
        { undoable: true },
      ),

    LinkKindsChosen: ({ from, to, kinds }) =>
      act(
        model,
        kinds ? `Routes ${kinds.map((kind) => KINDS[kind].label).join(', ')}` : 'Routes every kind',
        Actions.setLinkKinds(model.board.game, from, to, kinds),
        { undoable: true },
      ),

    AlertRuleChosen: ({ rule, threshold }) =>
      act(
        model,
        alertText(rule, threshold),
        Actions.setAlertRule(model.board.game, rule, threshold),
      ),

    SampleChosen: ({ nodeId, sampleRate }) =>
      act(
        model,
        `Sample ${Math.round(sampleRate * 100)}%`,
        Actions.setSample(model.board.game, nodeId, sampleRate),
        {
          undoable: true,
        },
      ),

    ReplaceBought: ({ nodeId }) =>
      logRunAction(model, { _tag: 'Replace', node: nodeId }) ??
      act(
        model,
        `Replaced ${nodeName(model.board.game, nodeId)}`,
        Actions.replace(model.board.game, nodeId),
      ),

    RestartChosen: ({ nodeId }) =>
      logRunAction(model, { _tag: 'Restart', node: nodeId }) ??
      act(
        model,
        `Restarted ${nodeName(model.board.game, nodeId)}`,
        Actions.restart(model.board.game, nodeId),
      ),

    IndexAdded: ({ nodeId }) =>
      act(model, 'Added an index', Work.addIndex(model.board.game, nodeId), {
        note: (game) =>
          game.backlog[0]?.ref === 'add-index'
            ? ['Add index is at the top of the backlog.', 'plain']
            : null,
      }),

    CacheGuardChosen: ({ nodeId, coalesce, warming }) =>
      act(
        model,
        coalesce !== undefined
          ? coalesce
            ? 'Coalescing on'
            : 'Coalescing off'
          : warming
            ? 'Warming on'
            : 'Warming off',
        Actions.setCacheGuard(model.board.game, nodeId, {
          ...(coalesce === undefined ? {} : { coalesce }),
          ...(warming === undefined ? {} : { warming }),
        }),
        { undoable: true },
      ),

    DlqChosen: ({ nodeId, dlq }) =>
      act(
        model,
        dlq ? 'Dead-letter queue on' : 'Dead-letter queue off',
        Actions.setDlq(model.board.game, nodeId, dlq),
        {
          undoable: true,
        },
      ),
    AttemptsChosen: ({ nodeId, attempts }) =>
      act(
        model,
        `Max attempts ${attempts}`,
        Actions.setAttempts(model.board.game, nodeId, attempts),
        {
          undoable: true,
        },
      ),
    MaxLengthChosen: ({ nodeId, maxLength }) =>
      act(
        model,
        maxLength > 0 ? `Max length ${maxLength}` : 'No max length',
        Actions.setMaxLength(model.board.game, nodeId, maxLength),
        { undoable: true },
      ),
    PrefetchChosen: ({ nodeId, prefetch }) =>
      act(model, `Prefetch ${prefetch}`, Actions.setPrefetch(model.board.game, nodeId, prefetch), {
        undoable: true,
      }),

    ParanoiaChosen: ({ nodeId, paranoia }) =>
      act(model, `Paranoia ${paranoia}`, Actions.setParanoia(model.board.game, nodeId, paranoia), {
        undoable: true,
      }),

    UnderAttackChosen: ({ nodeId, underAttack }) =>
      act(
        model,
        underAttack ? 'Under attack mode on' : 'Under attack mode off',
        Actions.setUnderAttack(model.board.game, nodeId, underAttack),
        { undoable: true },
      ),

    ZoneChosen: ({ nodeId, zone }) =>
      act(
        model,
        `${nodeName(model.board.game, nodeId)} to zone ${zone}`,
        Actions.setZone(model.board.game, nodeId, zone),
        { undoable: true },
      ),

    StandbyChosen: ({ nodeId, standby }) =>
      act(
        model,
        standby ? 'Standby on' : 'Standby off',
        Actions.setStandby(model.board.game, nodeId, standby),
        { undoable: true },
      ),

    AutoscalerChosen: ({ nodeId, signal, target, minCopies, maxCopies }) =>
      act(
        model,
        'Autoscaler set',
        Actions.setAutoscaler(model.board.game, nodeId, {
          ...(signal === undefined ? {} : { signal }),
          ...(target === undefined ? {} : { target }),
          ...(minCopies === undefined ? {} : { minCopies }),
          ...(maxCopies === undefined ? {} : { maxCopies }),
        }),
        { undoable: true },
      ),

    GpuChosen: ({ nodeId, gpu }) =>
      act(model, `GPU ${gpu.toUpperCase()}`, Actions.setGpuType(model.board.game, nodeId, gpu), {
        undoable: true,
      }),

    CollectorChosen: ({ nodeId, collector }) =>
      act(
        model,
        `Collector ${COLLECTORS[collector].label}`,
        Actions.setCollector(model.board.game, nodeId, collector),
        { undoable: true },
      ),

    GogcChosen: ({ nodeId, gogc }) =>
      act(model, `GOGC ${gogc}`, Actions.setGogc(model.board.game, nodeId, gogc), {
        undoable: true,
      }),

    ShedChosen: ({ nodeId, shed }) =>
      act(
        model,
        shed ? 'Load shedding on' : 'Load shedding off',
        Actions.setShed(model.board.game, nodeId, shed),
        { undoable: true },
      ),

    RywChosen: ({ nodeId, ryw }) =>
      act(
        model,
        ryw ? 'Read-your-writes on' : 'Read-your-writes off',
        Actions.setRyw(model.board.game, nodeId, ryw),
        { undoable: true },
      ),

    RuleDisabled: () =>
      logResponse(model, 'disable-rule') ??
      act(model, 'Disabled the WAF rule', Actions.disableRule(model.board.game)),

    RegionPicked: ({ region }) => {
      const next = { ...model, board: { ...model.board, region, selected: null } }
      return { model: next, commands: [FitBoard({})] }
    },

    RegionOpened: ({ region }) =>
      act(
        model,
        `Opened ${REGION_INFO[region].name}`,
        Actions.openRegion(model.board.game, region),
        {
          undoable: true,
          patch: () => ({ region, selected: null }),
        },
      ),

    NodeRegionChosen: ({ nodeId, region }) =>
      act(
        model,
        `Moved to ${REGION_INFO[region].name}`,
        Actions.setRegion(model.board.game, nodeId, region),
        { undoable: true },
      ),

    QuorumChosen: ({ nodeId, n, r, w }) =>
      act(model, `N${n} R${r} W${w}`, Actions.setQuorum(model.board.game, nodeId, n, r, w), {
        undoable: true,
      }),

    SpreadChosen: ({ nodeId, spread }) =>
      act(
        model,
        spread ? 'Spread across regions' : 'One region',
        Actions.setSpread(model.board.game, nodeId, spread),
        { undoable: true },
      ),

    BackupChosen: ({ nodeId, backup }) =>
      act(
        model,
        `Backups ${BACKUPS[backup].name}`,
        Actions.setBackup(model.board.game, nodeId, backup),
        {
          undoable: true,
        },
      ),

    FanoutChosen: ({ nodeId, fanout }) =>
      act(
        model,
        fanout === 'push' ? 'Fan-out on write' : 'Fan-out on read',
        Actions.setFanout(model.board.game, nodeId, fanout),
        { undoable: true },
      ),

    SplitChosen: ({ nodeId, split }) =>
      act(
        model,
        split ? 'Hot keys split' : 'Hot keys not split',
        Actions.setSplit(model.board.game, nodeId, split),
        { undoable: true },
      ),

    RoutesRolledBack: () =>
      logResponse(model, 'roll-back-routes') ??
      act(model, 'Rolled back the routes', Actions.rollBackRoutes(model.board.game)),

    ConfigRolledBack: () =>
      logResponse(model, 'roll-back-config') ??
      act(model, 'Rolled back the config', Actions.rollBackConfig(model.board.game)),

    IacToolPicked: ({ tool }) =>
      act(
        model,
        `IaC tool: ${IAC_TOOL_INFO[tool].name}`,
        Mirrors.pickIacTool(model.board.game, tool),
        { undoable: true },
      ),

    SyncModePicked: ({ sync }) =>
      act(
        model,
        sync === null ? 'GitOps off' : sync === 'all' ? 'GitOps all at once' : 'GitOps staged',
        Mirrors.setSyncMode(model.board.game, sync),
        { undoable: true },
      ),

    MirrorStarted: ({ target, source }) =>
      act(
        model,
        `Mirror of ${REGION_INFO[source].name}`,
        Mirrors.startMirror(model.board.game, target, source),
        { undoable: true, patch: () => ({ region: target, selected: null }) },
      ),

    MirrorApplied: ({ region, destroy }) =>
      act(model, 'Applied the plan', Mirrors.applyMirror(model.board.game, region, destroy), {
        undoable: true,
      }),

    MirrorDataPicked: ({ region, source, pattern }) =>
      act(model, 'Data pattern', Mirrors.setMirrorData(model.board.game, region, source, pattern), {
        undoable: true,
      }),

    MirrorOverrideSet: ({ region, nodeId, field, keep }) =>
      act(
        model,
        keep ? 'Kept as override' : 'Override removed',
        Mirrors.setOverride(model.board.game, region, nodeId, field, keep),
        { undoable: true },
      ),

    MirrorComputedSet: ({ region, computed }) =>
      act(
        model,
        computed ? 'Computed sizes on' : 'Computed sizes off',
        Mirrors.setComputed(model.board.game, region, computed),
        { undoable: true },
      ),

    MirrorRefreshed: ({ region }) =>
      act(model, 'Read live state', Mirrors.refreshMirror(model.board.game, region)),

    MirrorRepaired: ({ region }) =>
      act(model, 'Repaired drift', Mirrors.repairMirror(model.board.game, region), {
        undoable: true,
      }),

    MirrorStopped: ({ region }) =>
      act(model, 'Stopped mirroring', Mirrors.stopMirror(model.board.game, region), {
        undoable: true,
      }),

    LeaderFenced: () =>
      logResponse(model, 'fence-leader') ??
      act(model, 'Fenced the old leader', Actions.fenceLeader(model.board.game)),

    DrillRun: () => act(model, 'DR drill', Actions.runDrill(model.board.game)),

    GuidanceChosen: ({ growth, margin }) =>
      act(model, 'Guidance', Actions.setGuidance(model.board.game, growth, margin)),

    ReportCancelled: () =>
      logResponse(model, 'cancel-report') ??
      act(model, 'Cancelled the report', Actions.cancelReport(model.board.game)),

    VolumeExpanded: () =>
      logResponse(model, 'expand-volume') ??
      act(model, 'Expanded the volume', Actions.expandVolume(model.board.game)),

    CertificateRenewed: () =>
      logResponse(model, 'renew-certificate') ??
      act(model, 'Renewed the certificate', Actions.renewCertificate(model.board.game)),

    MessageDeleted: () =>
      logResponse(model, 'delete-message') ??
      act(model, 'Deleted the poison message', Actions.deleteMessage(model.board.game)),

    NodeSold: ({ nodeId }) =>
      act(
        model,
        `Sold ${nodeName(model.board.game, nodeId)}`,
        Actions.sell(model.board.game, nodeId),
        {
          undoable: true,
          patch: () => ({ selected: null }),
        },
      ),

    Collected: () => {
      if (model.board.game.pending <= 0) return { model }
      const amount = model.board.game.pending
      const next: Model = {
        ...model,
        board: { ...model.board, game: Actions.collect(model.board.game) },
      }
      return withToast(next, `Collected $${Math.round(amount).toLocaleString('en-US')}.`, 'ok')
    },

    UndoChosen: () => reverse(model, undoGame(model.board), 'Undid'),
    RedoChosen: () => reverse(model, redoGame(model.board), 'Redid'),

    ResearchChanged: ({ message }) => foldResearch(model, message),
    TeamChanged: ({ message }) => foldTeam(model, message),
    TaskQueued: ({ id }) =>
      act(model, `Queued ${TASKS[id].name}`, Work.queueTask(model.board.game, id)),
    WorkMoved: ({ id, direction }) =>
      act(model, 'Reordered the backlog', Work.moveItem(model.board.game, id, direction)),
    WorkCancelled: ({ id }) => act(model, 'Cancelled work', Work.cancelItem(model.board.game, id)),
    WorkPrioritized: ({ id }) =>
      act(model, 'Moved work to the top', Work.prioritizeItem(model.board.game, id)),
    WorkRushed: ({ id }) => act(model, 'Rushed work', Work.rushItem(model.board.game, id)),
    AutopilotToggled: () => {
      const game = Work.setAutopilot(model.board.game, !model.board.game.autopilot)
      return { model: { ...model, board: { ...model.board, game } } }
    },
    MigrationShifted: () =>
      act(model, 'Shifted traffic', Work.shiftMigration(model.board.game), {
        note: (game) => {
          const migration = serviceOf(game).migration
          return migration
            ? [`${percent(MIGRATION_STEPS[migration.step - 1] ?? 0)} of App Servers moved.`, 'ok']
            : ['Migration done.', 'ok']
        },
      }),
    MigrationCancelled: () =>
      act(model, 'Cancelled the migration', Work.cancelMigration(model.board.game), {
        note: () => ['Migration cancelled. App Servers are back on the old Stack.', 'plain'],
      }),
    RolledBack: () =>
      act(model, 'Rolled back', Work.rollback(model.board.game), {
        note: () => ['Rolled back. The Features ship again with the next deploy.', 'ok'],
      }),

    RoundRaised: () => {
      if (model.board.game.stage !== PRE_IPO_STAGE || !Actions.canRaise(model.board.game))
        return act(model, 'Raised a round', Actions.raise(model.board.game), { panel: afterRound })
      const ipo = listed(model, model.board.game)
      const result = act({ ...model, founder: ipo.founder }, 'Listed', Actions.raise(ipo.game), {
        panel: afterRound,
        note: (game) => [`Listed. +${game.banked} Legacy.`, 'primary'],
      })
      return result.model.board.game === model.board.game
        ? withToast(model, 'The IPO did not go through.', 'warn')
        : {
            ...result,
            commands: [...(result.commands ?? []), WriteFounder({ founder: ipo.founder })],
          }
    },

    RoundDeclined: () =>
      act(model, 'Declined a round', Actions.decline(model.board.game), { panel: afterRound }),

    PostmortemFiled: ({ id, take }) => {
      const action = model.board.game.postmortems.find((entry) => entry.id === id)?.action
      return act(model, 'Postmortem', Actions.filePostmortem(model.board.game, id, take), {
        note: () =>
          take && action ? [`Study queued: ${RESEARCH[action].name}.`, 'primary'] : null,
      })
    },

    ExitTaken: ({ exit }) =>
      Result.match(takeExit(model.board.game, solveFlow(model.board.game), exit), {
        onFailure: (refusal) => withToast(model, Actions.describeRefusal(refusal), 'warn'),
        onSuccess: (result) => {
          const exited = recordExit(model.founder, result)
          const [earned, earnedCommands] = achieve(
            { ...model, founder: exited },
            everyVenture(exited.history.map((row) => row.founding.venture))
              ? ['serial-founder']
              : [],
          )
          const founder = earned.founder
          const next: Model = {
            ...earned,
            founder,
            panel: 'exited',
            saved: false,
            board: {
              ...earned.board,
              selected: null,
              selection: [],
              tool: null,
              exited: { row: result.row, researched: model.board.game.researched },
              clock: { ...earned.board.clock, paused: true },
            },
          }
          return {
            model: next,
            commands: [
              ...earnedCommands,
              WriteFounder({ founder }),
              ClearSave({}),
              AppendLog({
                entries: [
                  line(model.board.game.time, 'Exited', {
                    exit: EXITS[exit].name,
                    payout: result.row.payout,
                    legacy: result.legacy,
                  }),
                ],
              }),
            ],
          }
        },
      }),
    KeepToggled: ({ id }) => changeFounder(model, toggleKeep(model.founder, id)),
    PerkBought: ({ id }) =>
      changeFounder(model, buyPerk(model.founder, id), `${PERKS[id].name} bought.`),
    VentureChosen: ({ id }) => changeFounder(model, unlockVenture(model.founder, id)),
    MutatorToggled: ({ id }) => changeFounder(model, toggleMutator(model.founder, id)),

    PlaybookSaved: () => {
      const playbook = capture(
        model.board.game,
        model.board.selection,
        `Playbook ${model.founder.playbooks.length + 1}`,
      )
      if (!playbook) return withToast(model, 'Shift-click the Nodes to save first.', 'plain')
      const saved = changeFounder(
        { ...model, board: { ...model.board, selection: [] } },
        savePlaybook(model.founder, playbook),
        `Saved ${playbook.name}: ${playbook.nodes.length} Nodes.`,
      )
      return saved
    },
    PlaybookChosen: ({ index }) => {
      if (!model.founder.playbooks[index]) return { model }
      const next: Model = {
        ...model,
        panel: 'none',
        board: { ...model.board, tool: { _tag: 'Stamping', source: index }, selected: null },
      }
      return { model: next }
    },
    PlaybookDeleted: ({ index }) => {
      const founder = removePlaybook(model.founder, index)
      return { model: { ...model, founder }, commands: [WriteFounder({ founder })] }
    },
    PlaybookExported: ({ index }) => {
      const playbook = model.founder.playbooks[index]
      if (!playbook) return { model }
      return {
        model,
        commands: [CopyText({ text: encodePlaybook(playbook), done: `Copied ${playbook.name}.` })],
      }
    },
    PlaybookImportAsked: () => ({ model, commands: [AskPlaybook({})] }),
    PlaybookImported: ({ text }) =>
      text === null
        ? { model }
        : changeFounder(
            model,
            Result.flatMap(decodePlaybook(text), (playbook) =>
              savePlaybook(model.founder, playbook),
            ),
            'Playbook imported.',
          ),

    PanelOpened: ({ panel }) => {
      const opened: Model = {
        ...model,
        panel,
        board: {
          ...model.board,
          team: initTeam(),
          tool: null,
          research: EMPTY_RESEARCH,
          dashboard: { ...model.board.dashboard, hover: null },
        },
      }
      const next =
        panel === 'inbox'
          ? {
              ...opened,
              board: {
                ...opened.board,
                inbox: reading({ ...opened.board.inbox, folder: 'action' }),
              },
            }
          : opened
      return { model: next }
    },
    ChurnFixTaken: ({ fix, target }) => {
      const game = model.board.game
      const board = { ...model, panel: 'none' as const }
      if (fix === 'research') {
        const opened = route(model, Message.PanelOpened({ panel: 'research' }))
        const focused = route(
          opened.model,
          Message.ResearchChanged({
            message: ResearchMessage.Focused({ id: target as ResearchId }),
          }),
        )
        return { ...focused, commands: [...(opened.commands ?? []), ...(focused.commands ?? [])] }
      }
      if (fix === 'node') {
        const node = game.nodes.find((entry) => entry.id === target)
        if (!node) return { model: board }
        return route(
          { ...board, board: { ...board.board, region: node.region } },
          Message.NodeTapped({ nodeId: node.id }),
        )
      }
      const region = target as Region
      const shown = route(
        board,
        openRegions(game).includes(region)
          ? Message.RegionPicked({ region })
          : Message.RegionOpened({ region }),
      )
      // With Infrastructure as code, an empty region is built by mirroring one that works.
      const empty = !game.nodes.some((node) => node.region === region && node.type !== 'users')
      return has(game, 'infra-as-code') && empty && shown.model.board.region === region
        ? { ...shown, model: { ...shown.model, panel: 'mirror' } }
        : shown
    },
    // An exited Company has nothing left to play: closing its panel goes to the next one.
    PanelClosed: () => {
      if (model.board.exited) return leaveExited(model, 'found')
      const next = closePanel(model)
      return { model: next }
    },

    LanguagePickerChanged: ({ message }) => foldLanguagePicker(model, message),
    MoreMenuChanged: ({ message }) => foldMoreMenu(model, message),
    PrefsChanged: ({ message }) => foldPrefs(model, message),
    WindowBlurred: () => {
      if (!model.prefs.blurPause || halted(model) || !onBoard(model.route)) return { model }
      const next: Model = {
        ...model,
        board: { ...model.board, clock: { ...model.board.clock, paused: true, away: true } },
      }
      return { model: next }
    },
    WindowFocused: () => {
      if (!model.board.clock.away) return { model }
      const next: Model = {
        ...model,
        board: { ...model.board, clock: { ...model.board.clock, paused: false, away: false } },
      }
      return { model: next }
    },
    InsightHelpToggled: () => ({
      model: { ...model, board: { ...model.board, insightHelp: !model.board.insightHelp } },
    }),
    GlossaryOpened: ({ id }) => {
      const founder = id ? discoverTerm(model.founder, id) : model.founder
      // Browsing inside the panel keeps the search and filter; opening it from outside resets them.
      const browsing = model.panel === 'glossary' && id !== null
      const next: Model = {
        ...model,
        panel: 'glossary',
        glossary: {
          focus: id,
          returnTo:
            model.panel === 'research' ? 'research' : browsing ? model.glossary.returnTo : 'none',
          query: browsing ? model.glossary.query : '',
          category: browsing ? model.glossary.category : null,
        },
        founder,
        board: { ...model.board, tool: null },
      }
      return {
        model: next,
        commands: founder === model.founder ? [] : [WriteFounder({ founder })],
      }
    },
    InboxChanged: ({ message }) => foldInbox(model, message),
    GlossaryChanged: ({ message }) => foldGlossary(model, message),
    DashboardChanged: ({ message }) => foldDashboard(model, message),

    CheatCash: () => {
      const next: Model = {
        ...model,
        board: {
          ...model.board,
          game: { ...model.board.game, cash: model.board.game.cash + cheatCash(model.board.game) },
        },
      }
      return { model: next }
    },
    CheatInsight: () => ({
      model: {
        ...model,
        board: {
          ...model.board,
          game: {
            ...model.board.game,
            pools: Object.fromEntries(
              Object.entries(model.board.game.pools).map(([pool, held]) => [
                pool,
                held + cheatInsight(model.board.game),
              ]),
            ) as Game['pools'],
          },
        },
      },
    }),
    CheatLegacy: () => {
      const founder = { ...model.founder, legacy: model.founder.legacy + 20 }
      return withToast({ ...model, founder }, '+20 Legacy.', 'plain', [WriteFounder({ founder })])
    },
    CheatRound: () => {
      const next = nextEra(model.board.game)
      if (!next || isFinalEra(model.board.game))
        return withToast(model, 'No round to skip to.', 'plain')
      const ready = {
        ...model.board.game,
        users: Math.max(model.board.game.users, eraOf(model.board.game).raiseAt),
      }
      // A playtest skips the IPO checklist.
      if (ready.stage === PRE_IPO_STAGE) {
        const ledger = solveFlow(ready)
        const ipo = listed(model, ready)
        const listedGame: Game = {
          ...ipo.game,
          stage: ready.stage + 1,
          equity: ready.equity * (1 - eraOf(ready).dilution),
          cash: ready.cash + ledger.burn * IPO_BURN_SECONDS,
          quarter: firstQuarter(ready, ledger.revenue),
        }
        const next: Model = {
          ...model,
          panel: afterRound(listedGame),
          board: { ...model.board, game: listedGame },
          founder: ipo.founder,
        }
        return { model: next, commands: [WriteFounder({ founder: ipo.founder })] }
      }
      return act(
        { ...model, board: { ...model.board, game: ready } },
        `Skipped to ${next.name}`,
        Actions.raise(ready),
        {
          panel: afterRound,
        },
      )
    },
    IncidentForced: ({ kind }) => {
      if (model.board.game.incident)
        return withToast(
          model,
          `${INCIDENTS[model.board.game.incident.kind].name} is still running.`,
          'warn',
        )
      const game = forceIncident(model.board.game, solveFlow(model.board.game), kind)
      if (!game)
        return withToast(model, `${INCIDENTS[kind].name} has no target in this Design.`, 'warn')
      const next: Model = {
        ...model,
        panel: 'none',
        board: { ...model.board, game, bottleneckAt: -1 },
      }
      return { model: next }
    },
    LogExported: () => ({ model, commands: [ExportLog({})] }),
    StateCopied: () => {
      const reason = refusal(model)
      return reason
        ? withToast(model, reason, 'warn')
        : {
            model,
            commands: [
              CopyText({ text: stateJson(model), done: 'Copied the game state as JSON.' }),
            ],
          }
    },
    LogCleared: () => withToast(model, 'Playtest log cleared.', 'plain', [ClearLog({})]),

    ToastRaised: ({ message: text, tone }) => withToast(model, text, tone),
    ToastCleared: ({ id }) => ({
      model: model.toast?.id === id ? { ...model, toast: null } : model,
    }),

    Synced: () => ({ model }),
  })

/* ---------- the playtest log ---------- */

const QUIET = new Set([
  'Ticked',
  'Synced',
  'Navigated',
  'NodeSampleChosen',
  'ToastCleared',
  'Saved',
  'SaveLoaded',
  // Sent by the compute worker several times a second.
  'BottleneckFound',
  'PreviewComputed',
])

/** A team drag sends a Message per pointer move; only the drop that moves someone is a gesture. */
const quiet = (model: Model, message: Message, after: Model): boolean =>
  QUIET.has(message._tag) ||
  // The Dashboard crosshair sends a Message on every pointer move.
  (message._tag === 'DashboardChanged' && message.message._tag === 'Hovered') ||
  (message._tag === 'TeamChanged' &&
    message.message._tag === 'DragChanged' &&
    after.board.game === model.board.game)

const fieldsOf = (message: Message): Record<string, unknown> =>
  Object.fromEntries(Object.entries(message).filter(([key]) => key !== '_tag'))

/** Logs the gesture, what it changed, why it was refused, and any toast it raised. */
const logged = (model: Model, message: Message, result: Result): Result => {
  const logs: Array<LogEntry> = []
  const after = result.model
  const time = after.board.game.time
  const raised = after.toast && after.toast.id !== model.toast?.id ? after.toast : null
  if (!quiet(model, message, after)) {
    const ledger: Ledger = ledgerOf(model)
    const refused =
      raised?.tone === 'warn' && after.board.game === model.board.game ? raised.message : undefined
    logs.push(
      line(time, message._tag, {
        ...fieldsOf(message),
        ...(refused ? { refused } : {}),
        diff: diffOf(model.board.game, after.board.game),
        ...(after.panel !== model.panel ? { panel: after.panel } : {}),
        context: contextOf(model, ledger),
      }),
    )
  }
  if (raised) logs.push(line(time, 'Toast', { message: raised.message, tone: raised.tone }))
  if (logs.length === 0) return result
  return { ...result, commands: [...(result.commands ?? []), AppendLog({ entries: logs })] }
}

/** The URL follows the route: a Message that opens another screen adds a
 *  history entry for it. ChangedUrl already came from the URL. */
const withUrl = (model: Model, message: Message, result: Result): Result => {
  const url = urlOf(result.model.route)
  if (message._tag === 'ChangedUrl' || url === urlOf(model.route)) return result
  return { ...result, commands: [...(result.commands ?? []), PushUrl({ url })] }
}

/** Messages that move a Company to another Era. */
const ROUNDS = new Set(['RoundRaised', 'RoundDeclined', 'CheatRound'])

/** Whether the board draws anything differently after a Message, or has just come on screen. */
const boardChanged = (before: Model, after: Model): boolean =>
  before.board.game !== after.board.game ||
  before.prefs.locale !== after.prefs.locale ||
  before.board.region !== after.board.region ||
  before.board.bottleneck !== after.board.bottleneck ||
  before.board.selected !== after.board.selected ||
  before.board.selection !== after.board.selection ||
  before.board.tool !== after.board.tool ||
  before.board.clipboard !== after.board.clipboard ||
  before.founder.playbooks !== after.founder.playbooks ||
  before.board.nodeHistory !== after.board.nodeHistory ||
  halted(before) !== halted(after) ||
  (before.panel === 'research') !== (after.panel === 'research') ||
  cueNode(before) !== cueNode(after) ||
  (onBoard(after.route) && !onBoard(before.route))

/** The board follows the Model: one SyncBoard after any Message that changed what it draws.
 *  A fit asked for in the same Message runs inside it, after the new state is drawn. */
const withBoard = (model: Model, result: Result): Result => {
  if (!boardChanged(model, result.model)) return result
  const commands = result.commands ?? []
  const fit = commands.some((command) => command.name === 'FitBoard')
  return {
    ...result,
    commands: [
      ...commands.filter((command) => command.name !== 'FitBoard'),
      sync(result.model, fit),
    ],
  }
}

/** Leaving the title for a board plays the monitor's connect sequence first, unless motion is reduced. */
const connecting = (model: Model, result: Result): Result =>
  onBoard(model.route) || !onBoard(result.model.route) || model.prefs.motion === 'reduce'
    ? result
    : {
        model: { ...result.model, connecting: true },
        commands: [...(result.commands ?? []), ConnectBoard({})],
      }

export const update = (model: Model, message: Message): Result => {
  if (model.connecting && message._tag === 'KeyPressed') return { model }
  const result = connecting(model, withUrl(model, message, route(model, message)))
  const moved = ROUNDS.has(message._tag) && result.model.board.game.stage !== model.board.game.stage
  return logged(
    model,
    message,
    withBoard(model, moved ? milestones(model, result, [], ledgerOf(result.model)) : result),
  )
}

export const percentilesVisible = (model: Model): boolean => has(model.board.game, 'percentiles')
