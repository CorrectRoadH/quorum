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
} from './engine/catalog.ts'
import { newGame, preseedGame } from './engine/company.ts'
import { forceIncident } from './engine/director.ts'
import { StepEvent } from './engine/events.ts'
import { nextGoal } from './engine/goals.ts'
import type { Ledger } from './engine/ledger.ts'
import { eraOf, has, isFinalEra } from './engine/lookups.ts'
import { solve } from './engine/solve.ts'
import { Game } from './engine/state.ts'
import { step } from './engine/step.ts'
import {
  AppendLog,
  ClearLog,
  ClearToast,
  ExportLog,
  FitBoard,
  LoadSave,
  SyncBoard,
  ToggleFullscreen,
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
import { Message } from './message.ts'
import { Model, type Tone } from './model.ts'
import type { LogEntry } from './playlog.ts'
import { contextOf, diffOf, line, sampleOf } from './telemetry.ts'

/* ==========================================================================
   Quorum — init and update. The Simulation owns every rule; update routes
   Messages to it, turns refusals into toasts, measures each change, and
   writes the playtest log.
   ========================================================================== */

export const TICK_MS = 250
const STEP_SECONDS = 0.25
const SAVE_EVERY = 5
const SAMPLE_EVERY = 10
const HISTORY_POINTS = 120
export const SPEEDS = [1, 3, 10] as const

/* ---------- init ---------- */

export const initialModel = (): Model =>
  Model.make({
    route: 'title',
    game: newGame(),
    saved: false,
    selected: null,
    placing: null,
    panel: 'none',
    buildGroup: null,
    speed: 1,
    paused: false,
    savedAt: 0,
    sampledAt: 0,
    toast: null,
    toastSeq: 0,
    change: null,
    delta: null,
    undo: null,
    nodeHistory: {},
    lastGoal: '',
    lastBottleneck: '',
  })

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: initialModel(),
  commands: [LoadSave({})],
})

/* ---------- helpers ---------- */

type Result = Update.Return<Model, Message>
type AnyCommand = NonNullable<Result['commands']>[number]

const sync = (model: Model): AnyCommand =>
  SyncBoard({ game: model.game, selected: model.selected, placing: model.placing })

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
      const measured = beginChange(model, label, figuresOf(solve(model.game)))
      const next: Model = {
        ...measured,
        ...options.patch?.(model, game),
        game,
        undo: options.undoable
          ? {
              label,
              game: model.game,
              spent: Math.max(0, model.game.cash - game.cash),
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
  const steps = Math.max(1, Math.round(model.speed))
  let game = model.game
  const events: Array<StepEvent> = []
  for (let index = 0; index < steps; index += 1) {
    const result = step(game, STEP_SECONDS)
    game = result.game
    events.push(...result.events)
  }
  const ledger = solve(game)
  // An incident drops the clock to 1×, so the player has time to respond.
  const incident = events.some((event) => event._tag === 'IncidentStarted')
  let next: Model = { ...model, game, speed: incident ? 1 : model.speed }
  const commands: Array<AnyCommand> = [sync(next)]
  const logs: Array<LogEntry> = []

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
  const bottleneck = ledger.bottleneck
    ? `${ledger.bottleneck}:${ledger.nodes[ledger.bottleneck]?.limit ?? 'none'}`
    : ''
  if (bottleneck !== next.lastBottleneck) {
    logs.push(line(game.time, 'BottleneckChanged', { bottleneck: bottleneck || null }))
    next = { ...next, lastBottleneck: bottleneck }
  }
  if (game.time - next.sampledAt >= SAMPLE_EVERY) {
    logs.push(line(game.time, 'Sample', sampleOf(next, ledger)))
    next = { ...next, sampledAt: game.time }
  }
  if (game.time - model.savedAt >= SAVE_EVERY) {
    next = { ...next, savedAt: game.time }
    commands.push(WriteSave({ game }))
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

/** After a round: the Era card, or the end of the slice. */
const afterRound = (model: Model, game: Game): Partial<Model> => ({
  panel: isFinalEra(game) ? 'end' : 'era',
  selected: model.selected,
})

/* ---------- update ---------- */

const route = (model: Model, message: Message): Result =>
  Message.match<Result>(message, {
    SaveLoaded: ({ json }) =>
      Option.match(parseSave(json), {
        onNone: () => ({ model }),
        onSome: (game) => ({
          model: { ...model, game, saved: true, savedAt: game.time, sampledAt: game.time },
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

    TitleOpened: () => ({
      model: { ...model, route: 'title', panel: 'none', placing: null },
      commands: [WriteSave({ game: model.game })],
    }),

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
          const group = BUILD_KEYS[key]
          return group ? route(model, Message.BuildGroupChosen({ group })) : { model }
        }
      }
    },

    BuildGroupChosen: ({ group }) => ({
      model: { ...model, buildGroup: model.buildGroup === group ? null : group },
    }),

    PlacingChosen: ({ type }) => {
      const next: Model = { ...model, placing: model.placing === type ? null : type, panel: 'none' }
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
        ...beginChange(model, `Undid ${label}`, figuresOf(solve(model.game))),
        game,
        undo: null,
      }
      return withToast(next, `Undid: ${label}.`, 'plain', [sync(next)])
    },

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

    PanelOpened: ({ panel }) => ({ model: { ...model, panel, placing: null } }),
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
      const game = forceIncident(model.game, solve(model.game), kind)
      if (!game)
        return withToast(model, `${INCIDENTS[kind].name} has no target in this Design.`, 'warn')
      const next: Model = { ...model, game, panel: 'none' }
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
    const ledger: Ledger = solve(model.game)
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
