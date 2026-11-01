import { Option, Result, Schema } from 'effect'
import type { Runtime, Update } from 'foldkit'
import * as Actions from '@template/simulation/actions'
import {
  ALERT_RULES,
  BUILD_GROUPS,
  CACHE_ENGINES,
  COMPONENTS,
  FAMILIES,
  FEATURES,
  FRAMEWORKS,
  INCIDENTS,
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
} from '@template/simulation/catalog'
import { newGame, preseedGame } from '@template/simulation/company'
import { forceIncident } from '@template/simulation/director'
import { StepEvent } from '@template/simulation/events'
import { nextGoal } from '@template/simulation/goals'
import type { Ledger } from '@template/simulation/ledger'
import { buildItems, eraOf, has, isFinalEra, nextEra } from '@template/simulation/lookups'
import { cheatCash, cheatInsight } from './cheats.ts'
import {
  advanceSandbox,
  freeSandbox,
  GUIDED,
  passedAll,
  sandboxOf,
  START,
} from '@template/simulation/sandbox'
import { previewOf } from '@template/simulation/preview'
import { bottleneckOf, solveFlow } from '@template/simulation/solve'
import { Game } from '@template/simulation/state'
import { step } from '@template/simulation/step'
import { serviceOf } from '@template/simulation/team'
import * as Work from '@template/simulation/work'
import {
  AppendLog,
  ClearLog,
  ClearToast,
  ExportLog,
  FitBoard,
  LoadPrefs,
  LoadSandboxStore,
  LoadSave,
  PlaySound,
  SyncBoard,
  ToggleFullscreen,
  WritePrefs,
  WriteSandboxStore,
  WriteSave,
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
import { alertText, duration } from './format.ts'
import { Message } from './message.ts'
import {
  ledgerOf,
  Model,
  Prefs,
  SandboxStore,
  type SandboxRun,
  type Tone,
  type Tradeoff,
  type TradeoffOption,
} from './model.ts'
import type { LogEntry } from './playlog.ts'
import { contextOf, diffOf, line, sampleOf } from './telemetry.ts'

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

/* ---------- init ---------- */

export const initialModel = (): Model =>
  Model.make({
    route: 'title',
    menu: 'main',
    game: newGame(),
    saved: false,
    sandbox: null,
    company: null,
    passed: [],
    freeBoard: null,
    selected: null,
    placing: null,
    panel: 'none',
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
    undo: [],
    redo: [],
    bottleneck: null,
    bottleneckAt: -1,
    nodeHistory: {},
    lastGoal: '',
    lastBottleneck: '',
  })

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: initialModel(),
  commands: [LoadSave({}), LoadSandboxStore({}), LoadPrefs({})],
})

/* ---------- helpers ---------- */

type Result = Update.Return<Model, Message>
type AnyCommand = NonNullable<Result['commands']>[number]

const sync = (model: Model): AnyCommand =>
  SyncBoard({
    game: model.game,
    bottleneck: model.bottleneck,
    selected: model.selected,
    placing: model.placing,
    history: model.nodeHistory,
  })

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
      WritePrefs({ prefs: { seenTradeoffs: seen } }),
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

const eventText = (event: StepEvent, game: Game): Note =>
  StepEvent.$match(event, {
    IncidentStarted: ({ incident }): Note =>
      incident.kind === 'bad-deploy'
        ? null
        : incident.kind === 'instance' && incident.nodeId
          ? [`${nodeName(game, incident.nodeId)} failed. Select it and click Replace.`, 'danger']
          : incident.kind === 'slow-query'
            ? ['A new query has no index. Every read scans the table.', 'danger']
            : incident.kind === 'poison'
              ? ['A task keeps failing. Workers retry it instead of the queue.', 'danger']
              : incident.kind === 'ddos'
                ? ['A flood of junk traffic hits the edge.', 'danger']
                : incident.kind === 'stampede'
                  ? ['The Cache restarted empty. Every miss goes to the database.', 'danger']
                  : null,
    IncidentResolved: ({ postmortem }): Note => [
      postmortem.action
        ? `${INCIDENTS[postmortem.kind].name} is over. Action item: ${RESEARCH[postmortem.action].name}. Until then it is twice as likely.`
        : `${INCIDENTS[postmortem.kind].name} is over.`,
      'primary',
    ],
    DrawerFull: (): Note => ['The Payments drawer is full. Revenue is spilling.', 'warn'],
    OutOfMemory: ({ nodeId }): Note => [
      `${nodeName(game, nodeId)} ran out of memory and restarted.`,
      'danger',
    ],
    CreditsExhausted: ({ nodeId }): Note => [
      `${nodeName(game, nodeId)} is out of CPU credits: throttled to 20%.`,
      'warn',
    ],
    AlertFired: ({ rule }): Note => [
      `Page: ${alertText(rule, game.alertRules[rule]).toLowerCase()} for ${ALERT_RULES[rule].seconds} s.`,
      'danger',
    ],
    AlertIgnored: ({ rule }): Note => [
      `Five false alarms today: the team ignores “${alertText(rule, game.alertRules[rule])}”. Change its threshold.`,
      'warn',
    ],
    Hired: (): Note => ['An engineer joined the team.', 'ok'],
    WorkFinished: ({ item }): Note =>
      item.kind === 'task' ? [`${Work.itemName(item)} is done.`, 'ok'] : null,
    Deployed: ({ features, bad }): Note => {
      const names = features.map((id) => FEATURES[id].name).join(', ')
      return bad
        ? [`Deployed ${names} with a bug. App Servers are crashing.`, 'danger']
        : [`Deployed ${names}.`, 'primary']
    },
    MigrationShifted: ({ step }): Note => [
      `${percent(MIGRATION_STEPS[step - 1] ?? 0)} of App Servers moved to the new Stack.`,
      'primary',
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
    const [raised, clear] = toasted(next, text[0], text[1])
    next = raised
    commands.push(clear)
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
  const goal = nextGoal(game, ledger)
  if (goal !== next.lastGoal) {
    logs.push(line(game.time, 'GoalChanged', { goal }))
    next = { ...next, lastGoal: goal }
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
    if (!next.sandbox) commands.push(WriteSave({ game }))
    else if (next.sandbox.id === null) {
      next = { ...next, freeBoard: game }
      commands.push(WriteSandboxStore({ store: storeOf(next) }))
    }
  }
  if (logs.length > 0) commands.push(AppendLog({ entries: logs }))
  return { model: next, commands }
}

const BUILD_KEYS: Record<string, (typeof BUILD_GROUPS)[number]['key']> = {
  '1': 'edge',
  '2': 'compute',
  '3': 'data',
  '4': 'ops',
}

const startCompany = (model: Model, game: Game, panel: Model['panel']): Result => {
  const next: Model = {
    ...initialModel(),
    route: 'lab',
    game,
    saved: true,
    passed: model.passed,
    freeBoard: model.freeBoard,
    panel,
    savedAt: game.time,
    sampledAt: game.time,
  }
  return {
    model: next,
    commands: [
      sync(next),
      WriteSave({ game }),
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
    route: 'lab',
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

/* ---------- update ---------- */

/** Handles a Message and adds its sound cue. Messages that route to another
 *  Message (keys, taps on Payments) sound once, as the Message they became. */
const route = (model: Model, message: Message): Result => {
  const result = handle(model, message)
  if (result.commands?.some((command) => command.name === 'PlaySound')) return result
  const cue = cueOf(model, message, result.model)
  return cue ? { ...result, commands: [...(result.commands ?? []), PlaySound(cue)] } : result
}

const handle = (model: Model, message: Message): Result =>
  Message.match<Result>(message, {
    SaveLoaded: ({ json }) =>
      Option.match(parseSave(json), {
        onNone: () => ({ model }),
        onSome: (game) => ({
          model: {
            ...model,
            game,
            saved: true,
            savedAt: game.time,
            sampledAt: game.time,
            bottleneckAt: -1,
          },
        }),
      }),

    Saved: () => ({ model: model.saved ? model : { ...model, saved: true } }),

    Continued: () => {
      const next: Model = { ...model, route: 'lab', panel: 'none', paused: false }
      return {
        model: next,
        commands: [
          sync(next),
          AppendLog({ entries: [line(model.game.time, 'SessionResumed', {})] }),
        ],
      }
    },

    NewCompanyStarted: () => startCompany(model, newGame(model.game.seed + 7919), 'help'),
    PreseedStarted: () => startCompany(model, preseedGame(model.game.seed + 7919), 'era'),

    TitleOpened: () => {
      if (!model.sandbox)
        return {
          model: { ...model, route: 'title', menu: 'main', panel: 'none', placing: null },
          commands: [WriteSave({ game: model.game })],
        }
      const freeBoard = model.sandbox.id === null ? model.game : model.freeBoard
      const next: Model = {
        ...model,
        route: 'title',
        menu: 'sandbox',
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
    },
    MenuChosen: ({ menu }) => ({ model: { ...model, menu } }),

    PrefsLoaded: ({ json }) =>
      Option.match(parsePrefs(json), {
        onNone: () => ({ model }),
        onSome: (prefs) => ({ model: { ...model, seenTradeoffs: prefs.seenTradeoffs } }),
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
    GuidedStarted: ({ id }) => enterSandbox(model, GUIDED[id].start(), { id, progress: START }),
    FreeSandboxStarted: () =>
      enterSandbox(model, model.freeBoard ?? freeSandbox(), { id: null, progress: START }),
    FreeSandboxReset: () => replaceFree(model, freeSandbox(), 'The free Sandbox is reset.'),
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
      const index = SPEEDS.indexOf(model.speed as (typeof SPEEDS)[number])
      return { model: { ...model, speed: SPEEDS[(index + 1) % SPEEDS.length] ?? 1 } }
    },
    SpeedChosen: ({ speed }) => ({ model: { ...model, speed } }),
    PauseToggled: () => ({ model: { ...model, paused: !model.paused } }),
    FullscreenToggled: () => ({ model, commands: [ToggleFullscreen({})] }),
    BoardFitted: () => ({ model, commands: [FitBoard({})] }),

    KeyPressed: ({ key }) => {
      if (model.route !== 'lab') return { model }
      const selected = model.selected
      switch (key) {
        case 'Escape': {
          if (model.tradeoff) return { model: { ...model, tradeoff: null } }
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
          if (model.sandbox) return { model }
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'research' ? 'none' : 'research' }),
          )
        case 't':
          if (model.sandbox) return { model }
          return route(
            model,
            Message.PanelOpened({ panel: model.panel === 'team' ? 'none' : 'team' }),
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
          const picked = (model.buildGroup ? buildItems(model.buildGroup) : [])[Number(key) - 1]
          if (picked) return route(model, Message.PlacingChosen({ type: picked }))
          const group = BUILD_KEYS[key]
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
      const type = model.placing
      if (!type) return { model }
      return act(
        model,
        `Placed ${COMPONENTS[type].name}`,
        Actions.place(model.game, type, Math.round(x / 8) * 8, Math.round(y / 8) * 8),
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
        tradeoff: model.selected === nodeId ? model.tradeoff : null,
      }
      return { model: next, commands: [sync(next)] }
    },

    NodeMoved: ({ nodeId, x, y }) => {
      const next: Model = { ...model, game: Actions.move(model.game, nodeId, x, y) }
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
      if (model.selected === null) return { model }
      const next: Model = { ...model, selected: null, tradeoff: null }
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

    LinkPolicyChosen: ({ from, to, timeout, retries }) =>
      act(
        model,
        timeout === undefined
          ? retries === 'naive'
            ? 'Retries on'
            : 'Retries off'
          : `Timeout ${timeout} s`,
        Actions.setLinkPolicy(model.game, from, to, {
          ...(timeout === undefined ? {} : { timeout }),
          ...(retries === undefined ? {} : { retries }),
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
      act(model, `Replaced ${nodeName(model.game, nodeId)}`, Actions.replace(model.game, nodeId)),

    RestartChosen: ({ nodeId }) =>
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

    RoundRaised: () =>
      act(model, 'Raised a round', Actions.raise(model.game), { patch: afterRound }),

    RoundDeclined: () =>
      act(model, 'Declined a round', Actions.decline(model.game), { patch: afterRound }),

    PostmortemFiled: ({ id, take }) => {
      const action = model.game.postmortems.find((entry) => entry.id === id)?.action
      return act(model, 'Postmortem', Actions.filePostmortem(model.game, id, take), {
        note: () =>
          take && action ? [`Action item done: ${RESEARCH[action].name}.`, 'primary'] : null,
      })
    },

    PanelOpened: ({ panel }) => ({
      model: { ...model, panel, placing: null, researchFocus: null },
    }),
    PanelClosed: () => ({ model: { ...model, panel: 'none' } }),

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
    CheatRound: () => {
      const next = nextEra(model.game)
      if (!next || isFinalEra(model.game)) return withToast(model, 'No round to skip to.', 'plain')
      const ready = { ...model.game, users: Math.max(model.game.users, eraOf(model.game).raiseAt) }
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

const QUIET = new Set(['Ticked', 'Synced', 'ToastCleared', 'Saved', 'SaveLoaded'])

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

export const update = (model: Model, message: Message): Result =>
  logged(model, message, route(model, message))

export const percentilesVisible = (model: Model): boolean => has(model.game, 'percentiles')
