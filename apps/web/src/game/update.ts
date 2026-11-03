import { Option, Result, Schema } from 'effect'
import { Update, type Runtime } from 'foldkit'
import { DragAndDrop } from '@foldkit/ui'
import { UrlRequest } from 'foldkit/navigation'
import { toString as urlToString, type Url } from 'foldkit/url'
import * as Actions from '@quorum/simulation/actions'
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
  REGION_INFO,
  MIGRATION_STEPS,
  POLICIES,
  KINDS,
  LB_POLICIES,
  PM_MODES,
  RESEARCH,
  RUNTIMES,
  SIZES,
  STEP_SECONDS,
  TASKS,
} from '@quorum/simulation/catalog'
import { newGame, preseedGame } from '@quorum/simulation/company'
import {
  NO_TOTALS,
  advanceRun,
  beginRun,
  challengeById,
  resultOf,
  stepsOf,
  type Challenge,
} from '@quorum/simulation/challenges'
import { designOf, encodeReplay, type ReplayAction } from '@quorum/simulation/replay'
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
  SAMPLES,
  eventFact,
  randomSample,
  eventMail,
  factOf,
  type Fact,
} from './mail.ts'
import type { EventMail } from './copy/index.ts'
import type { Ledger } from '@quorum/simulation/ledger'
import { eraOf, has, isFinalEra, nextEra } from '@quorum/simulation/lookups'
import { cheatCash, cheatInsight } from './cheats.ts'
import {
  advanceSandbox,
  freeSandbox,
  GUIDED,
  passedAll,
  sandboxOf,
  START,
} from '@quorum/simulation/sandbox'
import { previewOf } from '@quorum/simulation/preview'
import { bottleneckOf, solveFlow } from '@quorum/simulation/solve'
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
  WriteFounder,
  AppendLog,
  ClearLog,
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
import { cueOf } from './cues.ts'
import { stressBoard } from './stress.ts'
import { CARD_W, boxOf, freeSpot, heightOf } from './geometry.ts'
import { alertText, duration } from './format.ts'
import { Message } from './message.ts'
import {
  ledgerOf,
  Model,
  Prefs,
  SandboxStore,
  type SandboxRun,
  type Mail,
  type Tone,
  type Tradeoff,
  type TradeoffOption,
  offCompany,
  type ChallengeRun,
  type Menu,
} from './model.ts'
import { AppRoute, menuFor, onBoard, routeOfMenu, urlOf, urlToAppRoute } from './route.ts'
import type { LogEntry } from './playlog.ts'
import { contextOf, diffOf, line, sampleOf } from './telemetry.ts'
import { nearestNode, type Direction } from './viewport.ts'
import { regionView } from '@quorum/simulation/regions'

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
/** One calendar day of load: a point every 10 sim seconds. */
const HISTORY_POINTS = 144
const HISTORY_EVERY = 10
export const SPEEDS = [1, 3, 10] as const

/** The Company speeds: Time dilation adds 20× and 40× (plan M7.3). */
export const speedsOf = (game: Game): ReadonlyArray<number> => [
  ...SPEEDS,
  ...(DILATION_SPEEDS[perkLevel(game, 'time-dilation')] ?? []),
]

/* ---------- init ---------- */

export const initialModel = (): Model =>
  Model.make({
    route: AppRoute.Title(),
    gate: 'open',
    game: newGame(),
    saved: false,
    challenge: null,
    histograms: histogramQuery.init(),
    today: '',
    sandbox: null,
    company: null,
    passed: [],
    freeBoard: null,
    selected: null,
    selection: [],
    placing: null,
    stamping: null,
    founder: emptyFounder(),
    away: null,
    exited: null,
    region: 'na',
    panel: 'none',
    teamDrag: DragAndDrop.init({ id: 'team-drag' }),
    researchFocus: null,
    buildGroup: null,
    speed: 1,
    paused: false,
    carry: 0,
    savedAt: 0,
    sampledAt: 0,
    toast: null,
    toastSeq: 0,
    change: null,
    delta: null,
    stableTicks: 0,
    tradeoff: null,
    seenTradeoffs: [],
    revealed: [],
    pending: [],
    cue: null,
    muted: false,
    motion: 'system',
    glossaryFocus: null,
    glossaryQuery: '',
    glossaryCategory: null,
    inbox: [],
    inboxFocus: null,
    folder: 'inbox',
    mailBucket: 0,
    mailSample: 'random',
    undo: [],
    redo: [],
    bottleneck: null,
    bottleneckAt: -1,
    nodeHistory: {},
    dashboardHistory: EMPTY_HISTORY,
    dashboardRange: 360,
    dashboardHover: null,
    lastGoal: '',
    lastBottleneck: '',
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

const sync = (model: Model): AnyCommand =>
  SyncBoard({
    game: model.game,
    bottleneck: model.bottleneck,
    selected: model.selected,
    selection: model.selection,
    placing: model.placing,
    stamp: stampOf(model),
    history: model.nodeHistory,
    region: model.region,
    paused: model.paused,
    cue: cueNode(model),
  })

/** The Company save: the Game, and what this Company has shown so far. */
const saveOf = (model: Model): AnyCommand =>
  WriteSave({
    game: model.game,
    revealed: model.revealed,
    pending: model.pending,
    dashboard: model.dashboardHistory,
  })

/** The Playbook being placed, as the board draws it: ghosts where research is missing. */
const stampOf = (model: Model) => {
  if (model.stamping === null) return null
  const playbook = model.founder.playbooks[model.stamping]
  if (!playbook) return null
  return playbook.nodes.map((node) => ({
    type: node.type,
    dx: node.dx,
    dy: node.dy,
    ghost: ghostReason(model.game, node, model.region) !== null,
  }))
}

/* ---------- Mail (GDD 18) ---------- */

const MAIL_KEPT = 40
const THREAD_ENTRIES = 20

/** Senders whose Mail is about the Design now: a Thread resolves when its cause is gone. */
const ADVISING = new Set(['cloud', 'monitoring', 'vendor', 'investor', 'finance', 'mentor'])

const folderHolds = (mail: Mail, folder: Model['folder']): boolean =>
  folder === 'trash' ? mail.trashed : !mail.trashed && mail.spam === (folder === 'spam')

/** A fact joins its Thread, or starts one. The same news twice changes nothing. */
const mailed = (model: Model, fact: Fact, time: number, repeats = false): Model => {
  const existing = model.inbox.find((mail) => mail.key === fact.key && !mail.trashed)
  if (
    !repeats &&
    existing &&
    existing.resolved === null &&
    existing.entries.at(-1)?.text === fact.text
  )
    return model
  const others = model.inbox.filter((mail) => mail !== existing)
  const thread: Mail = existing
    ? {
        ...existing,
        time,
        read: false,
        answer: null,
        resolved: null,
        actions: fact.actions,
        entries: [...existing.entries, { time, text: fact.text }].slice(-THREAD_ENTRIES),
      }
    : {
        id: Math.max(0, ...model.inbox.map((mail) => mail.id)) + 1,
        key: fact.key,
        sender: fact.sender,
        subject: fact.subject,
        time,
        entries: [{ time, text: fact.text }],
        actions: fact.actions,
        answer: null,
        read: false,
        trashed: false,
        spam: fact.spam,
        resolved: null,
      }
  return { ...model, inbox: [...others, thread].slice(-MAIL_KEPT) }
}

/** Advice about anything but `key` no longer holds. */
const resolvedExcept = (model: Model, key: string, time: number): Model => ({
  ...model,
  inbox: model.inbox.map((mail) =>
    ADVISING.has(mail.sender) && mail.key !== key && mail.resolved === null
      ? { ...mail, resolved: time }
      : mail,
  ),
})

/** The Inbox on one Mail, or the newest in its folder, which counts as read. */
const reading = (model: Model, focus: number | null = null): Model => {
  const inFolder = model.inbox.filter((mail) => folderHolds(mail, model.folder))
  const id = (inFolder.find((mail) => mail.id === focus) ?? inFolder.at(-1))?.id ?? null
  return {
    ...model,
    inboxFocus: id,
    inbox: model.inbox.map((mail) => (mail.id === id ? { ...mail, read: true } : mail)),
  }
}

const withMail = (model: Model, id: number, change: Partial<Mail>): Model => ({
  ...model,
  inbox: model.inbox.map((mail) => (mail.id === id ? { ...mail, ...change } : mail)),
})

/** The Inbox's keys: J and K move, E deletes (or restores), S reports spam, 1 to 3 press a button. */
const mailKey = (model: Model, key: string): Result | null => {
  const list = model.inbox.filter((mail) => folderHolds(mail, model.folder)).reverse()
  const at = list.findIndex((mail) => mail.id === model.inboxFocus)
  const current = list[at]
  const neighbour = (list[at + 1] ?? list[at - 1])?.id ?? null
  const apply = (message: Message): Result => {
    const result = handle(model, message)
    return { ...result, model: reading(result.model, neighbour) }
  }
  switch (key) {
    case 'j':
      return { model: reading(model, list[Math.min(at + 1, list.length - 1)]?.id ?? null) }
    case 'k':
      return { model: reading(model, list[Math.max(at - 1, 0)]?.id ?? null) }
    case 'e':
      return current
        ? apply(
            current.trashed
              ? Message.MailRestored({ id: current.id })
              : Message.MailTrashed({ id: current.id }),
          )
        : null
    case 's':
      return current && !current.trashed ? apply(Message.MailMarkedSpam({ id: current.id })) : null
    case '1':
    case '2':
    case '3': {
      const action =
        current?.answer === null && current.resolved === null
          ? current.actions[Number(key) - 1]
          : undefined
      return current && action
        ? route(model, Message.MailActed({ id: current.id, action: action.id }))
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
  patch?: (model: Model, game: Game) => Partial<Model>
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
      if (game === model.game) return { model }
      // A run replays the Design it started with: only logged run actions may change it.
      if (model.challenge && model.challenge.phase !== 'build')
        return withToast(model, 'Rebuild to change the Design.', 'warn')
      const measured = beginChange(model, label, figuresOf(solveFlow(model.game)))
      const next: Model = {
        ...measured,
        ...options.patch?.(model, game),
        game,
        // The Design changed: search for the Bottleneck again on the next tick.
        bottleneckAt: -1,
        ...(options.undoable
          ? pushUndo(
              model,
              snapshotOf(label, model.game, game.cash - model.game.cash, model.game.time),
            )
          : {}),
      }
      const note = options.note?.(game)
      return note
        ? withToast(next, note[0], note[1], [sync(next)])
        : { model: next, commands: [sync(next)] }
    },
  })

/** Applies an undo or a redo, or says why it cannot. */
const reverse = (model: Model, reversal: Reversal | string, verb: string): Result => {
  if (typeof reversal === 'string') return withToast(model, reversal, 'plain')
  if (model.challenge && model.challenge.phase !== 'build')
    return withToast(model, 'Rebuild to change the Design.', 'warn')
  const next: Model = {
    ...beginChange(model, `${verb} ${reversal.label}`, figuresOf(solveFlow(model.game))),
    game: reversal.game,
    undo: reversal.undo,
    redo: reversal.redo,
    bottleneckAt: -1,
  }
  return withToast(next, `${verb}: ${reversal.label}.`, 'plain', [sync(next)])
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

/** The action an option stands for. */
const optionAction = (game: Game, nodeId: string, option: TradeoffOption): Actions.Action => {
  switch (option.kind) {
    case 'runtime':
      return Actions.setRuntime(game, nodeId, option.id)
    case 'framework':
      return Actions.setFramework(game, nodeId, option.id)
    case 'family':
      return Actions.setFamily(game, nodeId, option.id)
  }
}

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

/** A card for an option, with its ghost-run preview: computed here, never in a view. */
const tradeoffOf = (
  model: Model,
  nodeId: string,
  option: TradeoffOption,
  pinned: boolean,
): Tradeoff =>
  Result.match(
    previewOf(model.game, `${nodeId}:${option.kind}:${option.id}`, (game) =>
      optionAction(game, nodeId, option),
    ),
    {
      onSuccess: (preview) => ({ nodeId, option, pinned, preview, refusal: null }),
      onFailure: (refusal) => ({
        nodeId,
        option,
        pinned,
        preview: null,
        refusal: Actions.describeRefusal(refusal),
      }),
    },
  )

/** Applies an option and logs what its card predicted, so playtests can compare it with the outcome. */
const applyOption = (model: Model, card: Tradeoff): Result => {
  const closed: Model = { ...model, tradeoff: null }
  const applied = route(closed, optionMessage(card.nodeId, card.option))
  if (applied.model.game === closed.game) return applied
  const seen = applied.model.seenTradeoffs.includes(card.option.kind)
    ? applied.model.seenTradeoffs
    : [...applied.model.seenTradeoffs, card.option.kind]
  const next: Model = { ...applied.model, seenTradeoffs: seen }
  return {
    model: next,
    commands: [
      ...(applied.commands ?? []),
      WritePrefs({ prefs: prefsOf(next) }),
      AppendLog({
        entries: [
          line(model.game.time, 'TradeoffPreviewed', {
            option: card.option,
            preview: card.preview,
          }),
        ],
      }),
    ],
  }
}

const prefsOf = (model: Model): Prefs => ({
  seenTradeoffs: model.seenTradeoffs,
  muted: model.muted,
  motion: model.motion,
})

/** Saves and applies a settings change. */
const settled = (next: Model): Result => ({
  model: next,
  commands: [
    WritePrefs({ prefs: prefsOf(next) }),
    ApplySettings({ muted: next.muted, motion: next.motion }),
  ],
})

/** Puts the badge in the reader, once: it beeps, and the title follows. */
const clockIn = (model: Model): Result =>
  model.gate !== 'shut'
    ? { model }
    : {
        model: { ...model, gate: 'clocking' },
        commands: [
          ...(model.muted ? [] : [PlaySound({ sound: 'clockin', pitch: 1, spatial: false })]),
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
  if (!next.muted) commands.push(PlaySound({ sound: 'achievement', pitch: 1, spatial: false }))
  commands.push(
    AppendLog({ entries: fresh.map((id) => line(next.game.time, 'AchievementEarned', { id })) }),
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
    { before: before.game, after: after.game, ledger, events, stats },
    after.founder.achievements,
  )
  const terms = discoverTerms(after.game, events).filter(
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
  if (!next.muted) {
    if (after.game.stage > before.game.stage)
      commands.push(PlaySound({ sound: 'era', pitch: 1, spatial: false }))
    else if (events.some((event) => event._tag === 'IncidentStarted'))
      commands.push(PlaySound({ sound: 'incident', pitch: 1, spatial: false }))
  }
  return next === after && commands.length === (result.commands ?? []).length
    ? result
    : { model: next, commands }
}

const decodePrefs = Schema.decodeUnknownOption(Prefs)

const parsePrefs = (json: string | null): Option.Option<Prefs> => {
  if (json === null) return Option.none()
  try {
    return decodePrefs(JSON.parse(json))
  } catch {
    return Option.none()
  }
}

const decodeGame = Schema.decodeUnknownOption(Game)
const decodeStore = Schema.decodeUnknownOption(SandboxStore)

const parseStore = (json: string | null): Option.Option<SandboxStore> => {
  if (json === null) return Option.none()
  try {
    return decodeStore(JSON.parse(json))
  } catch {
    return Option.none()
  }
}

/** What the Sandbox store holds for this Model. */
const storeOf = (model: Model): SandboxStore => ({
  passed: model.passed,
  free: model.freeBoard,
})

const parseSave = (json: string | null): Option.Option<Game> => {
  if (json === null) return Option.none()
  try {
    return decodeGame(JSON.parse(json))
  } catch {
    return Option.none()
  }
}

/** What the player hears about a Step event, if anything. */
type Note = readonly [string, Tone] | null

/** A Step event's toast, and the Mail behind it. */
type EventNote = readonly [string, Tone, EventMail] | null

const eventText = (event: StepEvent, game: Game): EventNote =>
  StepEvent.$match(event, {
    IncidentStarted: ({ incident }): EventNote =>
      incident.kind === 'bad-deploy'
        ? null
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
    WorkFinished: ({ item }) => ({ kind: item.kind, ref: item.ref, cost: item.cost }),
    Deployed: ({ features, bad }) => ({ features, bad }),
    MigrationShifted: ({ step }) => ({ step }),
  })

/* ---------- the clock ---------- */

const tick = (model: Model): Result => {
  if (model.challenge?.phase === 'running') return runTick(model, model.challenge)
  const owed = model.carry + STEPS_PER_TICK * model.speed
  const steps = Math.floor(owed)
  let game = model.game
  const events: Array<StepEvent> = []
  for (let index = 0; index < steps; index += 1) {
    const result = step(game, STEP_SECONDS)
    game = result.game
    events.push(...result.events)
  }
  // A guided Sandbox checks its objective, and may script an incident or change demand.
  const guided = model.sandbox?.id ? GUIDED[model.sandbox.id] : null
  let run = model.sandbox
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
  const search = model.bottleneckAt < 0 || second !== model.bottleneckAt
  const flow = solveFlow(game)
  const bottleneck = search ? bottleneckOf(game, flow) : model.bottleneck
  const ledger: Ledger = { ...flow, bottleneck }
  // An incident drops the clock to 1×, so the player has time to respond.
  const incident = events.some((event) => event._tag === 'IncidentStarted')
  let next: Model = {
    ...model,
    game,
    sandbox: run,
    speed: incident ? 1 : model.speed,
    carry: owed - steps,
    bottleneck,
    bottleneckAt: search ? second : model.bottleneckAt,
  }
  next = advanceReveals(next, ledger)
  const commands: Array<AnyCommand> = [sync(next)]
  const logs: Array<LogEntry> = []

  if (run && guided && advanced) {
    const done = passedAll(guided, run.progress)
    logs.push(
      line(game.time, 'ObjectivePassed', { sandbox: guided.id, objective: run.progress.objective }),
    )
    if (done) {
      const passed = next.passed.includes(guided.id) ? next.passed : [...next.passed, guided.id]
      next = { ...next, passed, panel: 'passed', placing: null }
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

  for (const event of events) {
    logs.push(line(game.time, event._tag, eventLog(event)))
    const text = eventText(event, game)
    if (!text) continue
    // What happened in the Design is Mail (GDD 18); a Challenge has no Inbox, so it keeps the toast.
    if (next.challenge) {
      const [raised, clear] = toasted(next, text[0], text[1])
      next = raised
      commands.push(clear)
    } else {
      next = mailed(next, eventFact(event, text[2], game), game.time, true)
    }
  }

  // Feedback after a change.
  const settled = advanceChange(next, ledger, next.toastSeq + 1)
  next = {
    ...next,
    change: settled.change,
    delta: settled.delta ?? next.delta,
    stableTicks: settled.delta ? STABLE_TICKS : Math.max(0, next.stableTicks - 1),
  }
  if (settled.delta) logs.push(line(game.time, 'ChangeSettled', settled.delta))
  if (deltaExpired(next)) next = { ...next, delta: null }

  // The Dashboard's long history: every Sample the Steps added.
  next = {
    ...next,
    dashboardHistory: record(
      next.dashboardHistory,
      newSamples(game.history, model.game.time, game.time),
      Math.floor(game.time),
    ),
  }

  // Utilization history, once per 10 sim seconds.
  if (Math.floor(game.time / HISTORY_EVERY) > Math.floor(model.game.time / HISTORY_EVERY)) {
    const history: Record<string, ReadonlyArray<number>> = {}
    for (const node of game.nodes) {
      const past = next.nodeHistory[node.id] ?? []
      history[node.id] = [...past, ledger.nodes[node.id]?.utilization ?? 0].slice(-HISTORY_POINTS)
    }
    next = { ...next, nodeHistory: history }
  }

  // The log records what the player was told and what limited the Design.
  const advice = nextAdvice(game, ledger)
  const told = `${advice.key}|${advice.text}`
  if (told !== next.lastGoal) {
    logs.push(line(game.time, 'GoalChanged', { goal: advice.text }))
    next = { ...next, lastGoal: told }
    if (!offCompany(next))
      next = mailed(resolvedExcept(next, advice.key, game.time), factOf(advice, game), game.time)
  }
  // The world writes too: teammates, CVEs, customers, and spam.
  const bucket = Math.floor(game.time / EVENT_EVERY)
  if (!offCompany(next) && game.stage >= 1 && bucket > next.mailBucket) {
    const event = eventMail(game, bucket)
    next = { ...next, mailBucket: bucket }
    if (event) next = mailed(next, event, game.time)
  }
  const marker = bottleneck ? `${bottleneck}:${ledger.nodes[bottleneck]?.limit ?? 'none'}` : ''
  if (marker !== next.lastBottleneck) {
    logs.push(line(game.time, 'BottleneckChanged', { bottleneck: marker || null }))
    next = { ...next, lastBottleneck: marker }
  }
  if (game.time - next.sampledAt >= SAMPLE_EVERY) {
    logs.push(line(game.time, 'Sample', sampleOf(next, ledger)))
    next = { ...next, sampledAt: game.time }
  }
  if (game.time - model.savedAt >= SAVE_EVERY) {
    next = { ...next, savedAt: game.time }
    if (!offCompany(next)) commands.push(saveOf(next))
    else if (next.sandbox?.id === null) {
      next = { ...next, freeBoard: game }
      commands.push(WriteSandboxStore({ store: storeOf(next) }))
    }
  }
  // Reaching an Era in a Company opens its Challenges (14 "Rules").
  if (!offCompany(next) && !next.founder.erasReached.includes(game.stage)) {
    next = { ...next, founder: recordEra(next.founder, game.stage) }
    commands.push(WriteFounder({ founder: next.founder }))
  }
  if (logs.length > 0) commands.push(AppendLog({ entries: logs }))
  return milestones(model, { model: next, commands }, events, ledger)
}

const ARROWS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const startCompany = (model: Model, game: Game, panel: Model['panel']): Result => {
  const fresh: Model = {
    ...initialModel(),
    founder: model.founder,
    histograms: model.histograms,
    today: model.today,
    route: AppRoute.Company(),
    game,
    saved: true,
    passed: model.passed,
    freeBoard: model.freeBoard,
    panel,
    savedAt: game.time,
    sampledAt: game.time,
  }
  const next = revealAtStart(fresh, ledgerOf(fresh))
  return {
    model: next,
    commands: [
      sync(next),
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
    ...initialModel(),
    founder: model.founder,
    histograms: model.histograms,
    today: model.today,
    route: AppRoute.Sandbox({ sandbox: run.id ?? 'free' }),
    game,
    sandbox: run,
    company: model.sandbox ? model.company : model.game,
    saved: model.saved,
    passed: model.passed,
    freeBoard: model.freeBoard,
    savedAt: game.time,
    sampledAt: game.time,
  }
  return {
    model: next,
    commands: [
      sync(next),
      FitBoard({}),
      AppendLog({ entries: [line(game.time, 'SandboxStarted', { sandbox: run.id ?? 'free' })] }),
    ],
  }
}

/** Swaps the free Sandbox's Game, keeping the player's view. */
const replaceFree = (model: Model, game: Game, text: string): Result => {
  if (model.sandbox?.id !== null) return { model }
  const next: Model = {
    ...model,
    game,
    freeBoard: game,
    selected: null,
    placing: null,
    undo: [],
    redo: [],
    change: null,
    delta: null,
    bottleneck: null,
    bottleneckAt: -1,
    nodeHistory: {},
    dashboardHistory: EMPTY_HISTORY,
    savedAt: game.time,
    sampledAt: game.time,
  }
  return withToast(next, text, 'plain', [
    sync(next),
    FitBoard({}),
    WriteSandboxStore({ store: storeOf(next) }),
  ])
}

/** Changes the free Sandbox's demand or mix in place. */
const tuneFree = (model: Model, game: Game): Result => {
  if (model.sandbox?.id !== null) return { model }
  const next: Model = { ...model, game, bottleneckAt: -1 }
  return { model: next, commands: [sync(next)] }
}

/** Demand steps on the free Sandbox, in users. */
const DEMAND_STEPS = [100, 250, 500, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000]

/** After a round: the Era card, or the end of the slice. */
const afterRound = (model: Model, game: Game): Partial<Model> => ({
  panel: isFinalEra(game) ? 'end' : 'era',
  selected: model.selected,
})

/* ---------- the Founder ---------- */

const decodeFounder = Schema.decodeUnknownOption(Founder)

const parseFounder = (json: string | null): Option.Option<Founder> => {
  if (json === null) return Option.none()
  try {
    return decodeFounder(JSON.parse(json))
  } catch {
    return Option.none()
  }
}

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
  const game = foundCompany(model.game.seed + 7919, foundingOf(model.founder), model.founder.keep)
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
    exited: null,
    saved: false,
    game: newGame(model.game.seed),
    selected: null,
    selection: [],
    stamping: null,
    placing: null,
  },
})

/** The IPO lists the Company: Legacy for the listing, and the Company goes on as Public. */
const listed = (model: Model, game: Game): Readonly<{ game: Game; founder: Founder }> => {
  const ipo = ipoExit(game, solveFlow(game))
  return { game: ipo.game, founder: recordExit(model.founder, ipo) }
}

/* ---------- Challenges ---------- */

const histograms = histogramQuery.lift<Model, Message>({
  parentField: 'histograms',
  toParentMessage: (message) => Message.GotHistograms({ message }),
})

const boardOf = (challenge: Challenge): Game => ({
  ...challenge.start(),
  users: challenge.demand[0]?.users ?? 0,
})

/** Opens a Challenge's build board. The Company waits aside, as for a Sandbox. */
const enterChallenge = (model: Model, id: string): Result => {
  const challenge = challengeById(id)
  if (!challenge) return { model }
  const game = boardOf(challenge)
  const next: Model = {
    ...initialModel(),
    founder: model.founder,
    histograms: model.histograms,
    today: model.today,
    route: AppRoute.Challenge({ challenge: id }),
    game,
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
    company: offCompany(model) ? model.company : model.game,
    saved: model.saved,
    passed: model.passed,
    freeBoard: model.freeBoard,
    savedAt: game.time,
    sampledAt: game.time,
  }
  const loaded = histograms.loadIfMissing(next, { challengeId: id, simVersion: SIM_VERSION })
  return {
    model: loaded.model,
    commands: [
      sync(loaded.model),
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
    design: designOf(model.game),
    actions: [],
  }
  return Result.match(beginRun(challenge, replay), {
    onFailure: (reason) => withToast(model, reason, 'warn'),
    onSuccess: (game) => {
      const next: Model = {
        ...model,
        game,
        challenge: { ...run, phase: 'running', board: model.game, replay, totals: NO_TOTALS },
        carry: 0,
        paused: false,
        placing: null,
        selected: null,
        panel: 'none',
        bottleneckAt: -1,
      }
      return { model: next, commands: [sync(next)] }
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
    : model.carry + (STEPS_PER_TICK * model.speed * STEP_SECONDS) / challenge.stepSeconds
  const total = stepsOf(challenge)
  let game = model.game
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
      game,
      carry: all ? 0 : owed - taken,
      challenge: { ...run, totals },
    },
    done: totals.step >= total,
  }
}

/** The run is over: the provisional result shows, and the server is asked to confirm it. */
const finishRun = (model: Model): Result => {
  const run = model.challenge
  const challenge = run ? challengeById(run.id) : undefined
  if (!run || !challenge || !run.replay) return { model }
  const result = resultOf(challenge, model.game, run.totals)
  const first = result.passed && !model.founder.completed.includes(run.id)
  const founder = result.passed
    ? completeChallenge(model.founder, run.id, challenge.legacy)
    : model.founder
  const next: Model = {
    ...model,
    founder,
    panel: 'challenge',
    challenge: { ...run, phase: 'result', result, verification: 'sending' },
  }
  const commands: Array<AnyCommand> = [
    sync(next),
    SubmitChallenge({
      submission: {
        challengeId: run.id,
        simVersion: SIM_VERSION,
        deviceId: founder.deviceId,
        replay: encodeReplay(run.replay),
      },
    }),
    AppendLog({
      entries: [line(model.game.time, 'ChallengeRun', { challenge: run.id, ...result })],
    }),
  ]
  if (founder !== model.founder) commands.push(WriteFounder({ founder }))
  return first && challenge.legacy > 0
    ? withToast(next, `First completion: +${challenge.legacy} Legacy.`, 'ok', commands)
    : { model: next, commands }
}

const runTick = (model: Model, run: ChallengeRun): Result => {
  const ran = runSteps(model, run, false)
  return ran.done ? finishRun(ran.model) : { model: ran.model, commands: [sync(ran.model)] }
}

/** A run action is logged at the next Step and applied there, as the server will apply it. */
const logRunAction = (model: Model, action: ReplayAction): Result | null => {
  const run = model.challenge
  if (run?.phase !== 'running' || !run.replay) return null
  const replay = {
    ...run.replay,
    actions: [...run.replay.actions, { step: run.totals.step, action }],
  }
  return { model: { ...model, challenge: { ...run, replay } } }
}

/** Leaves a Challenge for the Challenges menu; the Company comes back as it was. */
const leaveChallenge = (model: Model): Result => ({
  model: {
    ...model,
    route: AppRoute.Menu({ menu: 'challenges' }),
    panel: 'none',
    placing: null,
    selected: null,
    game: model.company ?? newGame(),
    challenge: null,
    company: null,
    bottleneck: null,
    bottleneckAt: -1,
  },
})

/* ---------- routes ---------- */

const continued = (model: Model): Result => {
  const next: Model = {
    ...model,
    route: AppRoute.Company(),
    panel: model.away ? 'away' : 'none',
    paused: false,
  }
  return {
    model: next,
    commands: [sync(next), AppendLog({ entries: [line(model.game.time, 'SessionResumed', {})] })],
  }
}

/** Closes the board for the title screen. A Sandbox or Challenge gives the Company back. */
const leaveBoard = (model: Model): Result => {
  if (model.exited) return leaveExited(model, 'found')
  if (model.challenge) return leaveChallenge(model)
  if (!model.sandbox)
    return {
      model: { ...model, route: AppRoute.Title(), panel: 'none', placing: null },
      commands: [saveOf(model)],
    }
  const freeBoard = model.sandbox.id === null ? model.game : model.freeBoard
  const next: Model = {
    ...model,
    route: AppRoute.Menu({ menu: 'sandbox' }),
    panel: 'none',
    placing: null,
    selected: null,
    game: model.company ?? newGame(),
    sandbox: null,
    company: null,
    bottleneck: null,
    bottleneckAt: -1,
    freeBoard,
  }
  return { model: next, commands: [WriteSandboxStore({ store: storeOf(next) })] }
}

/** Opens a route's screen. A board that cannot open (no Company to continue,
 *  an unknown Challenge) leaves the Model as it is. */
const open = (model: Model, route: AppRoute): Result =>
  AppRoute.match<Result>(route, {
    Title: () => ({ model: { ...model, route } }),
    Menu: () => ({ model: { ...model, route } }),
    Company: () => (model.saved ? continued(model) : { model }),
    Sandbox: ({ sandbox }) =>
      sandbox === 'free'
        ? enterSandbox(model, model.freeBoard ?? freeSandbox(), { id: null, progress: START })
        : enterSandbox(model, GUIDED[sandbox].start(), { id: sandbox, progress: START }),
    Challenge: ({ challenge }) => enterChallenge(model, challenge),
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
 *  Message (keys, taps on Payments) sound once, as the Message they became. */
const route = (model: Model, message: Message): Result => {
  const handled = handle(model, message)
  const result = { ...handled, model: noticed(handled.model, message) }
  if (result.model.muted || result.commands?.some((command) => command.name === 'PlaySound'))
    return result
  const cue = cueOf(model, message, result.model)
  return cue ? { ...result, commands: [...(result.commands ?? []), PlaySound(cue)] } : result
}

const handle = (model: Model, message: Message): Result =>
  Message.match<Result>(message, {
    SaveLoaded: ({ json, now }) =>
      Option.match(parseSave(json), {
        onNone: () => ({ model }),
        onSome: (saved) => {
          // Time away plays out at 1×: a real second is a sim second (04 "Offline progress").
          const away = saved.wall > 0 ? (now - saved.wall) / 1_000 : 0
          const back = away >= OFFLINE_MIN && !saved.sandbox ? simulateAway(saved, away) : null
          const game = back?.game ?? saved
          return {
            model: {
              ...model,
              ...revealsOfSave(JSON.parse(json ?? 'null')),
              dashboardHistory: historyOfSave(JSON.parse(json ?? 'null')),
              game,
              saved: true,
              savedAt: game.time,
              sampledAt: game.time,
              bottleneckAt: -1,
              away: back?.report ?? null,
            },
            commands: back
              ? [AppendLog({ entries: [line(game.time, 'OfflineReturned', { ...back.report })] })]
              : [],
          }
        },
      }),
    FounderLoaded: ({ json, deviceId, today }) => {
      const loaded = Option.getOrElse(parseFounder(json), () => model.founder)
      if (loaded.deviceId) return { model: { ...model, founder: loaded, today } }
      const founder = { ...loaded, deviceId }
      return { model: { ...model, founder, today }, commands: [WriteFounder({ founder })] }
    },

    Saved: () => ({ model: model.saved ? model : { ...model, saved: true } }),

    Continued: () => continued(model),

    NewCompanyStarted: () => found(model),
    CompanyFounded: () => found(model),
    PreseedStarted: () =>
      startCompany(
        model,
        { ...preseedGame(model.game.seed + 7919), founding: foundingOf(model.founder) },
        'era',
      ),
    AwayClosed: () => ({ model: { ...model, panel: 'none', away: null } }),

    TitleOpened: () => leaveBoard(model),
    ClockedIn: () => clockIn(model),
    TitleRevealed: () => ({ model: { ...model, gate: 'open' } }),
    MenuChosen: ({ menu }) =>
      model.exited ? leaveExited(model, menu) : { model: { ...model, route: routeOfMenu(menu) } },
    ClickedLink: ({ request }) =>
      UrlRequest.match<Result>(request, {
        Internal: ({ url }) => ({ model, commands: [PushUrl({ url: urlToString(url) })] }),
        External: ({ href }) => ({ model, commands: [LoadUrl({ href })] }),
      }),
    ChangedUrl: ({ url }) => visit(model, url),
    Navigated: () => ({ model }),

    PrefsLoaded: ({ json }) =>
      Option.match(parsePrefs(json), {
        onNone: () => ({ model }),
        onSome: (prefs) => ({
          model: {
            ...model,
            seenTradeoffs: prefs.seenTradeoffs,
            muted: prefs.muted,
            motion: prefs.motion,
          },
          commands: [ApplySettings({ muted: prefs.muted, motion: prefs.motion })],
        }),
      }),

    OptionPreviewed: ({ nodeId, option }) =>
      model.tradeoff?.pinned
        ? { model }
        : { model: { ...model, tradeoff: tradeoffOf(model, nodeId, option, false) } },
    OptionLeft: () =>
      model.tradeoff && !model.tradeoff.pinned
        ? { model: { ...model, tradeoff: null } }
        : { model },
    OptionChosen: ({ nodeId, option }) => {
      const card = tradeoffOf(model, nodeId, option, true)
      // Once an option set is confirmed, its options apply on click; the card stays one line.
      if (model.seenTradeoffs.includes(option.kind)) return applyOption(model, card)
      return { model: { ...model, tradeoff: card } }
    },
    OptionConfirmed: () =>
      model.tradeoff?.pinned ? applyOption(model, model.tradeoff) : { model },
    TradeoffClosed: () => ({ model: { ...model, tradeoff: null } }),

    SandboxStoreLoaded: ({ json }) =>
      Option.match(parseStore(json), {
        onNone: () => ({ model }),
        onSome: (store) => ({ model: { ...model, passed: store.passed, freeBoard: store.free } }),
      }),
    ChallengeStarted: ({ id }) => enterChallenge(model, id),
    ChallengeRan: () => (model.challenge ? startRun(model, model.challenge) : { model }),
    ChallengeFinished: () => {
      const run = model.challenge
      if (run?.phase !== 'running') return { model }
      return finishRun(runSteps(model, run, true).model)
    },
    ChallengeRebuilt: () => {
      const run = model.challenge
      if (!run?.board) return { model }
      const next: Model = {
        ...model,
        game: run.board,
        panel: 'none',
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
      }
      return { model: next, commands: [sync(next)] }
    },
    ChallengeVerified: ({ verdict }) => {
      const run = model.challenge
      if (!run) return { model }
      const percentiles = verdict.percentiles
      const [next, earned] = achieve(
        { ...model, challenge: { ...run, verdict, verification: 'verified', note: null } },
        percentiles
          ? challengeAchievements([percentiles.cost, percentiles.tail, percentiles.complexity])
          : [],
      )
      const fetched = histograms.revalidate(next, { challengeId: run.id, simVersion: SIM_VERSION })
      return { ...fetched, commands: [...(fetched.commands ?? []), ...earned] }
    },
    ChallengeUnverified: ({ message, offline }) => {
      const run = model.challenge
      if (!run) return { model }
      return {
        model: {
          ...model,
          challenge: { ...run, verification: offline ? 'offline' : 'unverified', note: message },
        },
      }
    },
    GotHistograms: ({ message }) => histograms.fold(model, message),
    GuidedStarted: ({ id }) => enterSandbox(model, GUIDED[id].start(), { id, progress: START }),
    FreeSandboxStarted: () =>
      enterSandbox(model, model.freeBoard ?? freeSandbox(), { id: null, progress: START }),
    FreeSandboxReset: () => replaceFree(model, freeSandbox(), 'The free Sandbox is reset.'),
    StressBoardLoaded: () => replaceFree(model, stressBoard(), 'The stress board is loaded.'),
    CompanyCopied: () =>
      model.company && model.saved
        ? replaceFree(model, sandboxOf(model.company), 'Copied the Company Design.')
        : withToast(model, 'There is no Company to copy.', 'plain'),
    DemandStepped: ({ direction }) => {
      const index = DEMAND_STEPS.findIndex((users) => users >= model.game.users)
      const at = index === -1 ? DEMAND_STEPS.length - 1 : index
      const users =
        DEMAND_STEPS[Math.max(0, Math.min(DEMAND_STEPS.length - 1, at + direction))] ?? 1_000
      return tuneFree(model, { ...model.game, users })
    },
    MixChosen: ({ stage }) => tuneFree(model, { ...model.game, stage }),

    Ticked: () => tick(model),

    SpeedCycled: () => {
      const speeds = speedsOf(model.game)
      const index = speeds.indexOf(model.speed)
      return { model: { ...model, speed: speeds[(index + 1) % speeds.length] ?? 1 } }
    },
    SpeedChosen: ({ speed }) => ({ model: { ...model, speed } }),
    PauseToggled: () => {
      const next = { ...model, paused: !model.paused }
      return { model: next, commands: [sync(next)] }
    },
    FullscreenToggled: () => ({ model, commands: [ToggleFullscreen({})] }),
    BoardFitted: () => ({ model, commands: [FitBoard({})] }),

    KeyPressed: ({ key }) => {
      if (!onBoard(model.route)) return key === 'Escape' ? { model } : clockIn(model)
      if (model.panel === 'inbox') {
        const mail = mailKey(model, key)
        if (mail) return mail
      }
      const selected = model.selected
      switch (key) {
        case 'Escape': {
          if (model.exited) return leaveExited(model, 'found')
          if (model.tradeoff) return { model: { ...model, tradeoff: null } }
          if (model.stamping !== null || model.selection.length > 0) {
            const cleared: Model = { ...model, stamping: null, selection: [] }
            return { model: cleared, commands: [sync(cleared)] }
          }
          const next: Model =
            model.placing !== null
              ? { ...model, placing: null }
              : model.buildGroup !== null
                ? { ...model, buildGroup: null }
                : model.panel !== 'none'
                  ? { ...model, panel: 'none' }
                  : { ...model, selected: null }
          return { model: next, commands: [sync(next)] }
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
          if (!has(model.game, 'metrics')) return { model }
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
          return route(model, Message.MuteToggled())
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
          const id = nearestNode(regionView(model.game, model.region).nodes, selected, direction)
          return id && id !== selected
            ? route(model, Message.NodeTapped({ nodeId: id }))
            : { model }
        }
        case 'Enter':
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
        case 'Delete':
        case 'Backspace':
          return selected ? route(model, Message.NodeSold({ nodeId: selected })) : { model }
        default: {
          // With a group open, a digit picks that part.
          const picked = (model.buildGroup ? dockItems(model.game, model.buildGroup) : [])[
            Number(key) - 1
          ]
          if (picked) return route(model, Message.PlacingChosen({ type: picked }))
          const group = /^[1-9]$/.test(key) ? dockGroups(model.game)[Number(key) - 1] : undefined
          return group ? route(model, Message.BuildGroupChosen({ group })) : { model }
        }
      }
    },

    BuildGroupChosen: ({ group }) => ({
      model: { ...model, buildGroup: model.buildGroup === group ? null : group },
    }),

    PlacingChosen: ({ type }) => {
      // Picking a part closes its list: the board is the next step.
      const next: Model = {
        ...model,
        placing: model.placing === type ? null : type,
        panel: 'none',
        buildGroup: null,
      }
      return { model: next, commands: [sync(next)] }
    },

    NodePlaced: ({ x, y }) => {
      const playbook = model.stamping === null ? null : model.founder.playbooks[model.stamping]
      // Nothing lands on a card: a drop moves to the nearest spot that keeps clear.
      const others = regionView(model.game, model.region).nodes.map(boxOf)
      if (playbook) {
        const spot = freeSpot(others, {
          x,
          y,
          w: Math.max(...playbook.nodes.map((node) => node.dx)) + CARD_W,
          h: Math.max(...playbook.nodes.map((node) => node.dy + heightOf(node.type))),
        })
        const placed = placePlaybook(model.game, playbook, spot.x, spot.y, model.region)
        return act(
          model,
          `Placed ${playbook.name}`,
          Result.map(placed, (result) => result.game),
          {
            undoable: true,
            patch: () => ({ stamping: null }),
            note: () =>
              Result.match(placed, {
                onFailure: () => null,
                onSuccess: (result): Note =>
                  result.ghosts.length > 0
                    ? [
                        `Placed ${result.placed}. ${result.ghosts.length} need research: ${[
                          ...new Set(
                            result.ghosts.map((ghost) =>
                              ghostReason(model.game, ghost, model.region),
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
      const type = model.placing
      if (!type) return { model }
      const spot = freeSpot(others, { x, y, w: CARD_W, h: heightOf(type) })
      return act(
        model,
        `Placed ${COMPONENTS[type].name}`,
        Actions.place(model.game, type, spot.x, spot.y, model.region),
        {
          undoable: true,
          patch: (_, game) => ({ placing: null, selected: game.nodes.at(-1)?.id ?? null }),
        },
      )
    },

    NodeTapped: ({ nodeId }) => {
      const node = model.game.nodes.find((entry) => entry.id === nodeId)
      if (node?.type === 'payments' && model.game.pending > 0) {
        const next: Model = { ...model, selected: nodeId }
        return route(next, Message.Collected())
      }
      const next: Model = {
        ...model,
        selected: nodeId,
        selection: [],
        tradeoff: model.selected === nodeId ? model.tradeoff : null,
      }
      return { model: next, commands: [sync(next)] }
    },
    NodeToggled: ({ nodeId }) => {
      const selection = model.selection.includes(nodeId)
        ? model.selection.filter((id) => id !== nodeId)
        : [
            ...model.selection,
            ...(model.selected && model.selection.length === 0 && model.selected !== nodeId
              ? [model.selected]
              : []),
            nodeId,
          ]
      const next: Model = { ...model, selection, selected: null, tradeoff: null }
      return { model: next, commands: [sync(next)] }
    },
    SelectionBoxed: ({ ids }) => {
      const next: Model = { ...model, selection: [...ids], selected: null, tradeoff: null }
      return { model: next, commands: [sync(next)] }
    },
    SelectionCleared: () => {
      const next: Model = { ...model, selection: [] }
      return { model: next, commands: [sync(next)] }
    },

    NodeMoved: ({ nodeId, x, y }) => {
      const node = model.game.nodes.find((entry) => entry.id === nodeId)
      if (!node) return { model }
      const others = regionView(model.game, model.region)
        .nodes.filter((entry) => entry.id !== nodeId)
        .map(boxOf)
      const spot = freeSpot(others, { x, y, w: CARD_W, h: heightOf(node.type) })
      const next: Model = { ...model, game: Actions.move(model.game, nodeId, spot.x, spot.y) }
      return { model: next, commands: [sync(next)] }
    },

    LinkRequested: ({ from, to }) =>
      act(
        model,
        `Linked ${nodeName(model.game, from)} to ${nodeName(model.game, to)}`,
        Actions.connect(model.game, from, to),
        {
          undoable: true,
          note: (game) =>
            model.game.nodes.find((node) => node.id === from)?.localDb &&
            !game.nodes.find((node) => node.id === from)?.localDb
              ? ['Postgres moved off the App Server to its own Database.', 'ok']
              : null,
        },
      ),

    LinkCut: ({ from, to }) =>
      act(
        model,
        `Cut ${nodeName(model.game, from)} → ${nodeName(model.game, to)}`,
        Result.succeed(Actions.disconnect(model.game, from, to)),
        {
          undoable: true,
        },
      ),

    EmptyTapped: () => {
      if (model.selected === null && model.selection.length === 0) return { model }
      const next: Model = { ...model, selected: null, selection: [], tradeoff: null }
      return { model: next, commands: [sync(next)] }
    },

    FooterPressed: ({ nodeId }) => {
      const node = model.game.nodes.find((entry) => entry.id === nodeId)
      if (!node) return { model }
      if (node.type === 'payments')
        return route({ ...model, selected: nodeId }, Message.Collected())
      if (node.down === -1) return route(model, Message.ReplaceBought({ nodeId }))
      return route(model, Message.ResizeChosen({ nodeId, direction: 1 }))
    },

    ResizeChosen: ({ nodeId, direction }) => {
      const logged = logRunAction(model, { _tag: 'Resize', node: nodeId, direction })
      if (logged) return logged
      const node = model.game.nodes.find((entry) => entry.id === nodeId)
      if (!node) return { model }
      const sized = COMPONENTS[node.type].sized
      const size = node.size + direction
      return act(
        model,
        `Resized ${nodeName(model.game, nodeId)}`,
        Actions.resize(model.game, nodeId, direction),
        {
          undoable: true,
          note: () => [
            sized
              ? `${COMPONENTS[node.type].name} is ${SIZES[size]?.name ?? size}. It restarts cold.`
              : `${COMPONENTS[node.type].name} is size ${size}.`,
            'ok',
          ],
        },
      )
    },

    FamilyChosen: ({ nodeId, family }) =>
      act(model, `${FAMILIES[family].name} family`, Actions.setFamily(model.game, nodeId, family), {
        undoable: true,
      }),

    RuntimeChosen: ({ nodeId, runtime }) =>
      act(
        model,
        `Runtime ${RUNTIMES[runtime].name}`,
        Work.changeStack(model.game, nodeId, { runtime }),
        {
          undoable: !migrates(model.game, nodeId),
          note: (game) =>
            migrationNote(model.game, game) ?? [
              `Now running ${RUNTIMES[runtime].name}. It restarts cold.`,
              'ok',
            ],
        },
      ),

    FrameworkChosen: ({ nodeId, framework }) =>
      act(
        model,
        `Framework ${FRAMEWORKS[framework].name}`,
        Work.changeStack(model.game, nodeId, { framework }),
        {
          undoable: !migrates(model.game, nodeId),
          note: (game) => migrationNote(model.game, game),
        },
      ),

    WorkersChosen: ({ nodeId, workers }) =>
      act(
        model,
        `Pool size ${Math.round(workers)}`,
        Actions.setWorkers(model.game, nodeId, workers),
        {
          undoable: true,
        },
      ),

    PmChosen: ({ nodeId, pm }) =>
      act(model, `pm ${PM_MODES[pm].label}`, Actions.setPm(model.game, nodeId, pm), {
        undoable: true,
      }),

    PoolerModeChosen: ({ nodeId, mode }) =>
      act(model, `${mode} pooling`, Actions.setPoolerMode(model.game, nodeId, mode), {
        undoable: true,
      }),

    CompressionChosen: ({ nodeId, compress }) =>
      act(
        model,
        compress ? 'Gzip on' : 'Gzip off',
        Actions.setCompression(model.game, nodeId, compress),
        { undoable: true },
      ),

    PolicyChosen: ({ nodeId, policy }) =>
      act(
        model,
        `Policy ${LB_POLICIES[policy].label}`,
        Actions.setPolicy(model.game, nodeId, policy),
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
        Actions.setHealthCheck(model.game, nodeId, {
          ...(checkEvery === undefined ? {} : { checkEvery }),
          ...(deepCheck === undefined ? {} : { deepCheck }),
        }),
        { undoable: true },
      ),

    TtlChosen: ({ nodeId, ttl }) =>
      act(model, `TTL ${duration(ttl)}`, Actions.setTtl(model.game, nodeId, ttl), {
        undoable: true,
      }),

    CacheEngineChosen: ({ nodeId, engine }) =>
      act(
        model,
        `Engine ${CACHE_ENGINES[engine].name}`,
        Actions.setCacheEngine(model.game, nodeId, engine),
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
        Actions.setLinkPolicy(model.game, from, to, {
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
        Actions.setLinkKinds(model.game, from, to, kinds),
        { undoable: true },
      ),

    AlertRuleChosen: ({ rule, threshold }) =>
      act(model, alertText(rule, threshold), Actions.setAlertRule(model.game, rule, threshold)),

    SampleChosen: ({ nodeId, sampleRate }) =>
      act(
        model,
        `Sample ${Math.round(sampleRate * 100)}%`,
        Actions.setSample(model.game, nodeId, sampleRate),
        {
          undoable: true,
        },
      ),

    ReplaceBought: ({ nodeId }) =>
      logRunAction(model, { _tag: 'Replace', node: nodeId }) ??
      act(model, `Replaced ${nodeName(model.game, nodeId)}`, Actions.replace(model.game, nodeId)),

    RestartChosen: ({ nodeId }) =>
      logRunAction(model, { _tag: 'Restart', node: nodeId }) ??
      act(model, `Restarted ${nodeName(model.game, nodeId)}`, Actions.restart(model.game, nodeId)),

    IndexAdded: ({ nodeId }) =>
      act(model, 'Added an index', Work.addIndex(model.game, nodeId), {
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
        Actions.setCacheGuard(model.game, nodeId, {
          ...(coalesce === undefined ? {} : { coalesce }),
          ...(warming === undefined ? {} : { warming }),
        }),
        { undoable: true },
      ),

    DlqChosen: ({ nodeId, dlq }) =>
      act(
        model,
        dlq ? 'Dead-letter queue on' : 'Dead-letter queue off',
        Actions.setDlq(model.game, nodeId, dlq),
        {
          undoable: true,
        },
      ),

    ParanoiaChosen: ({ nodeId, paranoia }) =>
      act(model, `Paranoia ${paranoia}`, Actions.setParanoia(model.game, nodeId, paranoia), {
        undoable: true,
      }),

    UnderAttackChosen: ({ nodeId, underAttack }) =>
      act(
        model,
        underAttack ? 'Under attack mode on' : 'Under attack mode off',
        Actions.setUnderAttack(model.game, nodeId, underAttack),
        { undoable: true },
      ),

    ZoneChosen: ({ nodeId, zone }) =>
      act(
        model,
        `${nodeName(model.game, nodeId)} to zone ${zone}`,
        Actions.setZone(model.game, nodeId, zone),
        { undoable: true },
      ),

    StandbyChosen: ({ nodeId, standby }) =>
      act(
        model,
        standby ? 'Standby on' : 'Standby off',
        Actions.setStandby(model.game, nodeId, standby),
        { undoable: true },
      ),

    AutoscalerChosen: ({ nodeId, signal, target, minCopies, maxCopies }) =>
      act(
        model,
        'Autoscaler set',
        Actions.setAutoscaler(model.game, nodeId, {
          ...(signal === undefined ? {} : { signal }),
          ...(target === undefined ? {} : { target }),
          ...(minCopies === undefined ? {} : { minCopies }),
          ...(maxCopies === undefined ? {} : { maxCopies }),
        }),
        { undoable: true },
      ),

    GpuChosen: ({ nodeId, gpu }) =>
      act(model, `GPU ${gpu.toUpperCase()}`, Actions.setGpuType(model.game, nodeId, gpu), {
        undoable: true,
      }),

    CollectorChosen: ({ nodeId, collector }) =>
      act(
        model,
        `Collector ${COLLECTORS[collector].label}`,
        Actions.setCollector(model.game, nodeId, collector),
        { undoable: true },
      ),

    GogcChosen: ({ nodeId, gogc }) =>
      act(model, `GOGC ${gogc}`, Actions.setGogc(model.game, nodeId, gogc), { undoable: true }),

    ShedChosen: ({ nodeId, shed }) =>
      act(
        model,
        shed ? 'Load shedding on' : 'Load shedding off',
        Actions.setShed(model.game, nodeId, shed),
        { undoable: true },
      ),

    RywChosen: ({ nodeId, ryw }) =>
      act(
        model,
        ryw ? 'Read-your-writes on' : 'Read-your-writes off',
        Actions.setRyw(model.game, nodeId, ryw),
        { undoable: true },
      ),

    RuleDisabled: () => act(model, 'Disabled the WAF rule', Actions.disableRule(model.game)),

    RegionPicked: ({ region }) => {
      const next = { ...model, region, selected: null }
      return { model: next, commands: [sync(next), FitBoard({})] }
    },

    RegionOpened: ({ region }) =>
      act(model, `Opened ${REGION_INFO[region].name}`, Actions.openRegion(model.game, region), {
        undoable: true,
        patch: () => ({ region, selected: null }),
      }),

    NodeRegionChosen: ({ nodeId, region }) =>
      act(
        model,
        `Moved to ${REGION_INFO[region].name}`,
        Actions.setRegion(model.game, nodeId, region),
        { undoable: true },
      ),

    QuorumChosen: ({ nodeId, n, r, w }) =>
      act(model, `N${n} R${r} W${w}`, Actions.setQuorum(model.game, nodeId, n, r, w), {
        undoable: true,
      }),

    SpreadChosen: ({ nodeId, spread }) =>
      act(
        model,
        spread ? 'Spread across regions' : 'One region',
        Actions.setSpread(model.game, nodeId, spread),
        { undoable: true },
      ),

    BackupChosen: ({ nodeId, backup }) =>
      act(model, `Backups ${BACKUPS[backup].name}`, Actions.setBackup(model.game, nodeId, backup), {
        undoable: true,
      }),

    FanoutChosen: ({ nodeId, fanout }) =>
      act(
        model,
        fanout === 'push' ? 'Fan-out on write' : 'Fan-out on read',
        Actions.setFanout(model.game, nodeId, fanout),
        { undoable: true },
      ),

    SplitChosen: ({ nodeId, split }) =>
      act(
        model,
        split ? 'Hot keys split' : 'Hot keys not split',
        Actions.setSplit(model.game, nodeId, split),
        { undoable: true },
      ),

    RoutesRolledBack: () =>
      act(model, 'Rolled back the routes', Actions.rollBackRoutes(model.game)),

    LeaderFenced: () => act(model, 'Fenced the old leader', Actions.fenceLeader(model.game)),

    DrillRun: () => act(model, 'DR drill', Actions.runDrill(model.game)),

    GuidanceChosen: ({ growth, margin }) =>
      act(model, 'Guidance', Actions.setGuidance(model.game, growth, margin)),

    ReportCancelled: () => act(model, 'Cancelled the report', Actions.cancelReport(model.game)),

    VolumeExpanded: () => act(model, 'Expanded the volume', Actions.expandVolume(model.game)),

    CertificateRenewed: () =>
      act(model, 'Renewed the certificate', Actions.renewCertificate(model.game)),

    MessageDeleted: () =>
      act(model, 'Deleted the poison message', Actions.deleteMessage(model.game)),

    NodeSold: ({ nodeId }) =>
      act(model, `Sold ${nodeName(model.game, nodeId)}`, Actions.sell(model.game, nodeId), {
        undoable: true,
        patch: () => ({ selected: null }),
      }),

    Collected: () => {
      if (model.game.pending <= 0) return { model }
      const amount = model.game.pending
      const next: Model = { ...model, game: Actions.collect(model.game) }
      return withToast(next, `Collected $${Math.round(amount).toLocaleString('en-US')}.`, 'ok', [
        sync(next),
      ])
    },

    UndoChosen: () => reverse(model, undoGame(model), 'Undid'),
    RedoChosen: () => reverse(model, redoGame(model), 'Redid'),

    ResearchFocused: ({ id }) => ({ model: { ...model, researchFocus: id } }),

    ResearchBought: ({ id }) =>
      act(model, `Researched ${RESEARCH[id].name}`, Actions.study(model.game, id), {
        note: () => [`Researched ${RESEARCH[id].name}.`, 'primary'],
      }),

    HireChosen: () =>
      act(model, 'Hired', Work.hire(model.game), {
        note: () => ['Offer accepted. They start soon.', 'ok'],
      }),
    LayoffChosen: ({ engineerId }) =>
      act(model, 'Laid off', Work.layoff(model.game, engineerId), {
        note: () => ['Laid off. The team is shaken for a week.', 'warn'],
      }),
    TeamCreated: () => act(model, 'New team', Work.createTeam(model.game)),
    TeamRemoved: ({ teamId }) => act(model, 'Removed a team', Work.removeTeam(model.game, teamId)),
    EngineerAssigned: ({ engineerId, teamId }) =>
      act(model, 'Moved an engineer', Work.assign(model.game, engineerId, teamId)),
    TeamDragChanged: ({ message }) =>
      Update.foldChild({
        update: DragAndDrop.update,
        read: (parent: Model) => Option.some(parent.teamDrag),
        write: (parent, teamDrag) => ({ ...parent, teamDrag }),
        toParentMessage: (child) => Message.TeamDragChanged({ message: child }),
        foldOutMessage: (out) => (parent) =>
          out._tag === 'Reordered' && out.fromContainerId !== out.toContainerId
            ? act(
                parent,
                'Moved an engineer',
                Work.assign(parent.game, out.itemId, out.toContainerId),
              )
            : { model: parent },
      })(model, message),
    TeamPolicyChosen: ({ teamId, policy }) =>
      act(
        model,
        `${POLICIES[policy].label} policy`,
        Work.setTeamPolicy(model.game, teamId, policy),
      ),
    FeatureQueued: ({ id }) =>
      act(model, `Queued ${FEATURES[id].name}`, Work.queueFeature(model.game, id)),
    TaskQueued: ({ id }) => act(model, `Queued ${TASKS[id].name}`, Work.queueTask(model.game, id)),
    WorkMoved: ({ id, direction }) =>
      act(model, 'Reordered the backlog', Work.moveItem(model.game, id, direction)),
    WorkCancelled: ({ id }) => act(model, 'Cancelled work', Work.cancelItem(model.game, id)),
    WorkRushed: ({ id }) => act(model, 'Rushed work', Work.rushItem(model.game, id)),
    AutopilotToggled: () => {
      const game = Work.setAutopilot(model.game, !model.game.autopilot)
      return { model: { ...model, game } }
    },
    MigrationShifted: () =>
      act(model, 'Shifted traffic', Work.shiftMigration(model.game), {
        note: (game) => {
          const migration = serviceOf(game).migration
          return migration
            ? [`${percent(MIGRATION_STEPS[migration.step - 1] ?? 0)} of App Servers moved.`, 'ok']
            : ['Migration done.', 'ok']
        },
      }),
    MigrationCancelled: () =>
      act(model, 'Cancelled the migration', Work.cancelMigration(model.game), {
        note: () => ['Migration cancelled. App Servers are back on the old Stack.', 'plain'],
      }),
    RolledBack: () =>
      act(model, 'Rolled back', Work.rollback(model.game), {
        note: () => ['Rolled back. The Features ship again with the next deploy.', 'ok'],
      }),

    RoundRaised: () => {
      if (model.game.stage !== PRE_IPO_STAGE || !Actions.canRaise(model.game))
        return act(model, 'Raised a round', Actions.raise(model.game), { patch: afterRound })
      const ipo = listed(model, model.game)
      const result = act({ ...model, founder: ipo.founder }, 'Listed', Actions.raise(ipo.game), {
        patch: afterRound,
        note: (game) => [`Listed. +${game.banked} Legacy.`, 'primary'],
      })
      return result.model.game === model.game
        ? withToast(model, 'The IPO did not go through.', 'warn')
        : {
            ...result,
            commands: [...(result.commands ?? []), WriteFounder({ founder: ipo.founder })],
          }
    },

    RoundDeclined: () =>
      act(model, 'Declined a round', Actions.decline(model.game), { patch: afterRound }),

    PostmortemFiled: ({ id, take }) => {
      const action = model.game.postmortems.find((entry) => entry.id === id)?.action
      return act(model, 'Postmortem', Actions.filePostmortem(model.game, id, take), {
        note: () =>
          take && action ? [`Action item done: ${RESEARCH[action].name}.`, 'primary'] : null,
      })
    },

    ExitTaken: ({ exit }) =>
      Result.match(takeExit(model.game, solveFlow(model.game), exit), {
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
            paused: true,
            saved: false,
            selected: null,
            selection: [],
            stamping: null,
            exited: { row: result.row, researched: model.game.researched },
          }
          return {
            model: next,
            commands: [
              ...earnedCommands,
              WriteFounder({ founder }),
              ClearSave({}),
              AppendLog({
                entries: [
                  line(model.game.time, 'Exited', {
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
        model.game,
        model.selection,
        `Playbook ${model.founder.playbooks.length + 1}`,
      )
      if (!playbook) return withToast(model, 'Shift-click the Nodes to save first.', 'plain')
      const saved = changeFounder(
        { ...model, selection: [] },
        savePlaybook(model.founder, playbook),
        `Saved ${playbook.name}: ${playbook.nodes.length} Nodes.`,
      )
      if (saved.model.founder === model.founder) return saved
      return { ...saved, commands: [...(saved.commands ?? []), sync(saved.model)] }
    },
    PlaybookChosen: ({ index }) => {
      if (!model.founder.playbooks[index]) return { model }
      const next: Model = {
        ...model,
        stamping: index,
        panel: 'none',
        placing: null,
        selected: null,
      }
      return { model: next, commands: [sync(next)] }
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
        teamDrag: DragAndDrop.init({ id: 'team-drag' }),
        placing: null,
        researchFocus: null,
        dashboardHover: null,
      }
      return { model: panel === 'inbox' ? reading({ ...opened, folder: 'inbox' }) : opened }
    },
    // An exited Company has nothing left to play: closing its panel goes to the next one.
    PanelClosed: () =>
      model.exited ? leaveExited(model, 'found') : { model: { ...model, panel: 'none' } },

    MuteToggled: () => settled({ ...model, muted: !model.muted }),
    MotionToggled: () =>
      settled({ ...model, motion: model.motion === 'reduce' ? 'system' : 'reduce' }),
    GlossaryOpened: ({ id }) => {
      const founder = id ? discoverTerm(model.founder, id) : model.founder
      // Browsing inside the panel keeps the search and filter; opening it from outside resets them.
      const browsing = model.panel === 'glossary' && id !== null
      const next: Model = {
        ...model,
        panel: 'glossary',
        placing: null,
        glossaryFocus: id,
        glossaryQuery: browsing ? model.glossaryQuery : '',
        glossaryCategory: browsing ? model.glossaryCategory : null,
        founder,
      }
      return {
        model: next,
        commands: founder === model.founder ? [] : [WriteFounder({ founder })],
      }
    },
    MailOpened: ({ id }) => ({ model: reading(model, id) }),
    MailTrashed: ({ id }) => ({ model: reading(withMail(model, id, { trashed: true })) }),
    MailRestored: ({ id }) => ({ model: reading(withMail(model, id, { trashed: false })) }),
    MailMarkedSpam: ({ id }) => {
      const mail = model.inbox.find((entry) => entry.id === id)
      return { model: reading(withMail(model, id, { spam: !mail?.spam })) }
    },
    MailSampleChosen: ({ id }) => ({ model: { ...model, mailSample: id } }),
    MailGenerated: ({ count }) => {
      // Send uses the chosen sample; a burst of 10 or 50 draws a random sample for each Mail.
      const chosen = SAMPLES.find((entry) => entry.id === model.mailSample) ?? SAMPLES[0]
      if (!chosen) return { model }
      let next = model
      for (let sent = 0; sent < count; sent += 1) {
        const n = Math.max(0, ...next.inbox.map((mail) => mail.id)) + 1
        const sample = count === 1 ? chosen : randomSample(next.game, n)
        next = mailed(next, sample.make(next.game, n), next.game.time)
      }
      return { model: reading(next, null) }
    },
    MailResolved: () => ({ model: resolvedExcept(model, '', model.game.time) }),
    MailCleared: () => ({ model: { ...model, inbox: [], inboxFocus: null } }),
    FolderChosen: ({ folder }) => ({ model: reading({ ...model, folder }) }),
    MailActed: ({ id, action }) => {
      const mail = model.inbox.find((entry) => entry.id === id)
      if (!mail) return { model }
      const [kind, target] = action.split(':')
      const answered = (answer: string): Model => withMail(model, id, { answer })
      switch (kind) {
        case 'raise':
          return route(answered('You raised the round.'), Message.RoundRaised())
        case 'decline':
          return mail.sender.startsWith('mate:')
            ? { model: answered('You declined. They will bring it up again.') }
            : route(answered('You declined the round.'), Message.RoundDeclined())
        case 'hire':
          return route(answered('You approved the hire.'), Message.HireChosen())
        case 'team':
          return route(answered('You opened Team.'), Message.PanelOpened({ panel: 'team' }))
        case 'later':
          return { model: answered('Later. They will ask again.') }
        case 'show':
          return { model: { ...model, selected: target ?? null } }
        case 'trap':
          return withToast(
            answered('You clicked it. It was a trap: the address was not the real sender.'),
            'That was phishing. Check the sender address first.',
            'danger',
          )
        default:
          return { model }
      }
    },
    GlossarySearched: ({ query }) => ({ model: { ...model, glossaryQuery: query } }),
    DashboardRangeChosen: ({ minutes }) => ({
      model: { ...model, dashboardRange: minutes, dashboardHover: null },
    }),
    DashboardHovered: ({ index }) => ({ model: { ...model, dashboardHover: index } }),
    GlossaryFiltered: ({ category }) => ({ model: { ...model, glossaryCategory: category } }),

    CheatCash: () => {
      const next: Model = {
        ...model,
        game: { ...model.game, cash: model.game.cash + cheatCash(model.game) },
      }
      return { model: next, commands: [sync(next)] }
    },
    CheatInsight: () => ({
      model: {
        ...model,
        game: { ...model.game, insight: model.game.insight + cheatInsight(model.game) },
      },
    }),
    CheatLegacy: () => {
      const founder = { ...model.founder, legacy: model.founder.legacy + 20 }
      return withToast({ ...model, founder }, '+20 Legacy.', 'plain', [WriteFounder({ founder })])
    },
    CheatRound: () => {
      const next = nextEra(model.game)
      if (!next || isFinalEra(model.game)) return withToast(model, 'No round to skip to.', 'plain')
      const ready = { ...model.game, users: Math.max(model.game.users, eraOf(model.game).raiseAt) }
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
          ...afterRound(model, listedGame),
          game: listedGame,
          founder: ipo.founder,
        }
        return { model: next, commands: [sync(next), WriteFounder({ founder: ipo.founder })] }
      }
      return act({ ...model, game: ready }, `Skipped to ${next.name}`, Actions.raise(ready), {
        patch: afterRound,
      })
    },
    IncidentForced: ({ kind }) => {
      if (model.game.incident)
        return withToast(
          model,
          `${INCIDENTS[model.game.incident.kind].name} is still running.`,
          'warn',
        )
      const game = forceIncident(model.game, solveFlow(model.game), kind)
      if (!game)
        return withToast(model, `${INCIDENTS[kind].name} has no target in this Design.`, 'warn')
      const next: Model = { ...model, game, panel: 'none', bottleneckAt: -1 }
      return { model: next, commands: [sync(next)] }
    },
    LogExported: () => ({ model, commands: [ExportLog({})] }),
    LogCleared: () => withToast(model, 'Playtest log cleared.', 'plain', [ClearLog({})]),

    ToastRaised: ({ message: text, tone }) => withToast(model, text, tone),
    ToastCleared: ({ id }) => ({
      model: model.toast?.id === id ? { ...model, toast: null } : model,
    }),

    Synced: () => ({ model }),
  })

/* ---------- the playtest log ---------- */

const QUIET = new Set(['Ticked', 'Synced', 'Navigated', 'ToastCleared', 'Saved', 'SaveLoaded'])

const fieldsOf = (message: Message): Record<string, unknown> =>
  Object.fromEntries(Object.entries(message).filter(([key]) => key !== '_tag'))

/** Logs the gesture, what it changed, why it was refused, and any toast it raised. */
const logged = (model: Model, message: Message, result: Result): Result => {
  const logs: Array<LogEntry> = []
  const after = result.model
  const time = after.game.time
  const raised = after.toast && after.toast.id !== model.toast?.id ? after.toast : null
  if (!QUIET.has(message._tag)) {
    const ledger: Ledger = ledgerOf(model)
    const refused =
      raised?.tone === 'warn' && after.game === model.game ? raised.message : undefined
    logs.push(
      line(time, message._tag, {
        ...fieldsOf(message),
        ...(refused ? { refused } : {}),
        diff: diffOf(model.game, after.game),
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

export const update = (model: Model, message: Message): Result => {
  const result = withUrl(model, message, route(model, message))
  const moved = ROUNDS.has(message._tag) && result.model.game.stage !== model.game.stage
  return logged(
    model,
    message,
    moved ? milestones(model, result, [], ledgerOf(result.model)) : result,
  )
}

export const percentilesVisible = (model: Model): boolean => has(model.game, 'percentiles')
