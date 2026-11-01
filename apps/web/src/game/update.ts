import { Option, Result, Schema } from 'effect'
import type { Runtime, Update } from 'foldkit'
import * as Actions from './engine/actions.ts'
import {
  BUILD_GROUPS,
  COMPONENTS,
  FAMILIES,
  FRAMEWORKS,
  INCIDENTS,
  RESEARCH,
  RUNTIMES,
  SAMPLE_RATES,
  SIZES,
  STEP_SECONDS,
} from './engine/catalog.ts'
import { newGame, preseedGame } from './engine/company.ts'
import { forceIncident } from './engine/director.ts'
import { StepEvent } from './engine/events.ts'
import { nextGoal } from './engine/goals.ts'
import type { Ledger } from './engine/ledger.ts'
import { buildItems, eraOf, has, isFinalEra } from './engine/lookups.ts'
import {
  advanceSandbox,
  freeSandbox,
  GUIDED,
  passedAll,
  sandboxOf,
  START,
} from './engine/sandbox.ts'
import { bottleneckOf, solveFlow } from './engine/solve.ts'
import { Game } from './engine/state.ts'
import { step } from './engine/step.ts'
import {
  AppendLog,
  ClearLog,
  ClearToast,
  ExportLog,
  FitBoard,
  LoadSandboxStore,
  LoadSave,
  PlaySound,
  SyncBoard,
  ToggleFullscreen,
  WriteSandboxStore,
  WriteSave,
} from './commands.ts'
import {
  advanceChange,
  beginChange,
  deltaExpired,
  figuresOf,
  undoAvailable,
  undoGame,
} from './feedback.ts'
import { cueOf } from './cues.ts'
import { Message } from './message.ts'
import { ledgerOf, Model, SandboxStore, type SandboxRun, type Tone } from './model.ts'
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
const HISTORY_POINTS = 120
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
    undo: null,
    bottleneck: null,
    bottleneckAt: -1,
    nodeHistory: {},
    lastGoal: '',
    lastBottleneck: '',
  })

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: initialModel(),
  commands: [LoadSave({}), LoadSandboxStore({})],
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
  /** Board actions can be undone for 30 seconds. */
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
        undo: options.undoable
          ? {
              label,
              game: model.game,
              cash: game.cash - model.game.cash,
              at: model.game.time,
            }
          : model.undo,
      }
      const note = options.note?.(game)
      return note
        ? withToast(next, note[0], note[1], [sync(next)])
        : { model: next, commands: [sync(next)] }
    },
  })

const nodeName = (game: Game, id: string): string => {
  const node = game.nodes.find((entry) => entry.id === id)
  return node ? COMPONENTS[node.type].name : 'A Node'
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
      incident.kind === 'instance' && incident.nodeId
        ? [`${nodeName(game, incident.nodeId)} failed. Select it and click Replace.`, 'danger']
        : incident.kind === 'slow-query'
          ? ['A new query has no index. Every read scans the table.', 'danger']
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
      rule === 'errors'
        ? 'Page: error rate above 1% for 30 s.'
        : rule === 'latency'
          ? 'Page: p99 above 4× the Apdex target for 30 s.'
          : 'Page: a Node above 90% for 60 s.',
      'danger',
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
  next = { ...next, change: settled.change, delta: settled.delta ?? next.delta }
  if (settled.delta) logs.push(line(game.time, 'ChangeSettled', settled.delta))
  if (deltaExpired(next)) next = { ...next, delta: null }
  if (next.undo && !undoAvailable(next)) next = { ...next, undo: null }

  // Utilization history, once per sim second.
  if (Math.floor(game.time) > Math.floor(model.game.time)) {
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
    undo: null,
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
      const next: Model = { ...model, selected: nodeId }
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
      const next: Model = { ...model, selected: null }
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
        Actions.setRuntime(model.game, nodeId, runtime),
        {
          undoable: true,
          note: () => [`Now running ${RUNTIMES[runtime].name}. It restarts cold.`, 'ok'],
        },
      ),

    FrameworkChosen: ({ nodeId, framework }) =>
      act(
        model,
        `Framework ${FRAMEWORKS[framework].name}`,
        Actions.setFramework(model.game, nodeId, framework),
        {
          undoable: true,
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

    SampleChosen: ({ nodeId, sample }) =>
      act(
        model,
        `Sample ${Math.round((SAMPLE_RATES[sample] ?? 0) * 100)}%`,
        Actions.setSample(model.game, nodeId, sample),
        {
          undoable: true,
        },
      ),

    ReplaceBought: ({ nodeId }) =>
      act(model, `Replaced ${nodeName(model.game, nodeId)}`, Actions.replace(model.game, nodeId)),

    RestartChosen: ({ nodeId }) =>
      act(model, `Restarted ${nodeName(model.game, nodeId)}`, Actions.restart(model.game, nodeId)),

    IndexAdded: ({ nodeId }) => act(model, 'Added an index', Actions.addIndex(model.game, nodeId)),

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

    UndoChosen: () => {
      const game = undoGame(model)
      if (!game || !model.undo) return withToast(model, 'Nothing to undo.', 'plain')
      const label = model.undo.label
      const next: Model = {
        ...beginChange(model, `Undid ${label}`, figuresOf(solveFlow(model.game))),
        game,
        undo: null,
        bottleneckAt: -1,
      }
      return withToast(next, `Undid: ${label}.`, 'plain', [sync(next)])
    },

    ResearchFocused: ({ id }) => ({ model: { ...model, researchFocus: id } }),

    ResearchBought: ({ id }) =>
      act(model, `Researched ${RESEARCH[id].name}`, Actions.study(model.game, id), {
        note: () => [`Researched ${RESEARCH[id].name}.`, 'primary'],
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
      const next: Model = { ...model, game: { ...model.game, cash: model.game.cash + 1_000 } }
      return { model: next, commands: [sync(next)] }
    },
    CheatInsight: () => ({
      model: { ...model, game: { ...model.game, insight: model.game.insight + 100 } },
    }),
    CheatPreseed: () => {
      if (model.game.stage >= 1) return withToast(model, 'Already past the Garage.', 'plain')
      const ready = { ...model.game, users: Math.max(model.game.users, eraOf(model.game).raiseAt) }
      return act({ ...model, game: ready }, 'Skipped to Pre-seed', Actions.raise(ready), {
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
