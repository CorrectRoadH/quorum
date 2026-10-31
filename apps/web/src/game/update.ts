import * as Effect from 'effect/Effect'
import { Option, Schema } from 'effect'
import { Command, type Runtime, type Update } from 'foldkit'
import {
  BUILD_GROUPS,
  COMPONENTS,
  FRAMEWORKS,
  LANGUAGES,
  RESEARCH,
  STAGES,
} from './engine/catalog.ts'
import * as Sim from './engine/sim.ts'
import { ComponentId, Game } from './engine/state.ts'
import { fitBoard, setBoard } from './board.ts'
import { Message } from './message.ts'
import { Model, type Tone } from './model.ts'

/* ==========================================================================
   Quorum — init, update and the Commands. The Simulation owns every rule;
   update routes Messages to it and turns refusals into toasts.
   ========================================================================== */

export const SAVE_KEY = 'quorum.save.v1'
export const TICK_MS = 250
const SAVE_EVERY = 5

/* ---------- Commands ---------- */

const SyncBoard = Command.define('SyncBoard', {
  args: { game: Game, selected: Schema.NullOr(Schema.String), placing: Schema.NullOr(ComponentId) },
  messages: [Message.Synced],
  execute: ({ game, selected, placing }) =>
    Effect.sync(() => setBoard('board', { game, flow: Sim.solve(game), selected, placing })).pipe(
      Effect.as(Message.Synced()),
    ),
})

const FitBoard = Command.define('FitBoard', {
  args: {},
  messages: [Message.Synced],
  execute: () => Effect.sync(() => fitBoard('board')).pipe(Effect.as(Message.Synced())),
})

const LoadSave = Command.define('LoadSave', {
  args: {},
  messages: [Message.SaveLoaded],
  execute: () =>
    Effect.sync(() => {
      try {
        return Message.SaveLoaded({ json: window.localStorage.getItem(SAVE_KEY) })
      } catch {
        return Message.SaveLoaded({ json: null })
      }
    }),
})

const WriteSave = Command.define('WriteSave', {
  args: { game: Game },
  messages: [Message.Saved],
  execute: ({ game }) =>
    Effect.sync(() => {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(game))
      } catch {
        // A full or blocked storage loses the save, not the game.
      }
      return Message.Saved()
    }),
})

const ToggleFullscreen = Command.define('ToggleFullscreen', {
  args: {},
  messages: [Message.Synced],
  execute: () =>
    Effect.promise(async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen()
        else await document.documentElement.requestFullscreen()
      } catch {
        // The browser refused; the game still fills the window.
      }
      return Message.Synced()
    }),
})

const ClearToast = Command.define('ClearToast', {
  args: { id: Schema.Finite },
  messages: [Message.ToastCleared],
  execute: ({ id }) => Effect.sleep('3600 millis').pipe(Effect.as(Message.ToastCleared({ id }))),
})

/* ---------- init ---------- */

export const initialModel = (): Model =>
  Model.make({
    route: 'title',
    game: Sim.newGame(),
    saved: false,
    selected: null,
    placing: null,
    panel: 'none',
    buildGroup: 'compute',
    speed: 1,
    paused: false,
    savedAt: 0,
    toast: null,
    toastSeq: 0,
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

/** Apply a Simulation action: on success sync the board, on refusal say why. */
const apply = (
  model: Model,
  outcome: Sim.Outcome,
  patch: Partial<Model> = {},
  note?: [string, Tone],
): Result => {
  if (!outcome.ok) return withToast(model, outcome.reason, 'warn')
  const next: Model = { ...model, ...patch, game: outcome.game }
  return note
    ? withToast(next, note[0], note[1], [sync(next)])
    : { model: next, commands: [sync(next)] }
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

const incidentText = (event: Sim.StepEvent, game: Game): [string, Tone] | null => {
  if (event.kind === 'drawer-full') return null
  const incident = event.incident
  const target = game.nodes.find((node) => node.id === incident.nodeId)
  const name = target ? COMPONENTS[target.type].name : 'A Node'
  if (event.kind === 'recovered') {
    return incident.kind === 'outage'
      ? [`${name} is back up.`, 'ok']
      : ['Traffic is back to normal.', 'ok']
  }
  switch (incident.kind) {
    case 'spike':
      return ['You hit the front page. Traffic is 2.5× for 25 seconds.', 'warn']
    case 'ddos':
      return ['DDoS: a botnet is flooding you for 25 seconds. A Firewall drops it.', 'danger']
    case 'outage':
      return [`${name} went down. It is back in 18 seconds and keeps billing.`, 'danger']
  }
}

const tick = (model: Model): Result => {
  const { game, events } = Sim.step(model.game, (TICK_MS / 1000) * model.speed)
  let next: Model = { ...model, game }
  const commands: Array<AnyCommand> = [sync(next)]
  for (const event of events) {
    const text = incidentText(event, game)
    if (!text) continue
    const [raised, clear] = toasted(next, text[0], text[1])
    next = raised
    commands.push(clear)
  }
  if (game.time - model.savedAt >= SAVE_EVERY) {
    next = { ...next, savedAt: game.time }
    commands.push(WriteSave({ game }))
  }
  return { model: next, commands }
}

const BUILD_KEYS: Record<string, (typeof BUILD_GROUPS)[number]['key']> = {
  '1': 'edge',
  '2': 'compute',
  '3': 'data',
  '4': 'async',
  '5': 'ops',
}

/* ---------- update ---------- */

export const update = (model: Model, message: Message): Result =>
  Message.match<Result>(message, {
    SaveLoaded: ({ json }) =>
      Option.match(parseSave(json), {
        onNone: () => ({ model }),
        onSome: (game) => ({ model: { ...model, game, saved: true, savedAt: game.time } }),
      }),

    Saved: () => ({ model: model.saved ? model : { ...model, saved: true } }),

    Continued: () => {
      const next: Model = { ...model, route: 'lab', panel: 'none', paused: false }
      return { model: next, commands: [sync(next)] }
    },

    NewCompanyStarted: () => {
      const game = Sim.newGame(model.game.seed + 7919)
      const next: Model = {
        ...model,
        route: 'lab',
        game,
        saved: true,
        savedAt: 0,
        selected: null,
        placing: null,
        panel: 'help',
        paused: false,
        speed: 1,
      }
      return { model: next, commands: [sync(next), WriteSave({ game }), FitBoard({})] }
    },

    TitleOpened: () => ({
      model: { ...model, route: 'title', panel: 'none', placing: null },
      commands: [WriteSave({ game: model.game })],
    }),

    Ticked: () => tick(model),

    SpeedCycled: () => ({
      model: { ...model, speed: model.speed === 1 ? 2 : model.speed === 2 ? 4 : 1 },
    }),
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
              : model.panel !== 'none'
                ? { ...model, panel: 'none' }
                : { ...model, selected: null }
          return { model: next, commands: [sync(next)] }
        }
        case 'r':
          return { model: { ...model, panel: model.panel === 'research' ? 'none' : 'research' } }
        case '?':
        case 'h':
          return { model: { ...model, panel: model.panel === 'help' ? 'none' : 'help' } }
        case ' ':
          return { model: { ...model, paused: !model.paused } }
        case 'f':
          return { model, commands: [ToggleFullscreen({})] }
        case 'c':
          return update(model, Message.Collected())
        case 'u':
          return selected ? update(model, Message.UpgradeBought({ nodeId: selected })) : { model }
        case 'Delete':
        case 'Backspace':
          return selected ? update(model, Message.NodeSold({ nodeId: selected })) : { model }
        default: {
          const group = BUILD_KEYS[key]
          return group ? { model: { ...model, buildGroup: group } } : { model }
        }
      }
    },

    BuildGroupChosen: ({ group }) => ({ model: { ...model, buildGroup: group } }),

    PlacingChosen: ({ type }) => {
      const next: Model = { ...model, placing: model.placing === type ? null : type, panel: 'none' }
      return { model: next, commands: [sync(next)] }
    },

    NodePlaced: ({ x, y }) => {
      const type = model.placing
      if (!type) return { model }
      const outcome = Sim.place(model.game, type, Math.round(x / 8) * 8, Math.round(y / 8) * 8)
      if (!outcome.ok) return apply({ ...model, placing: null }, outcome)
      const placed = outcome.game.nodes.at(-1)?.id ?? null
      return apply(model, outcome, { placing: null, selected: placed })
    },

    NodeTapped: ({ nodeId }) => {
      const node = model.game.nodes.find((entry) => entry.id === nodeId)
      if (node?.type === 'payments' && model.game.pending > 0) {
        const amount = model.game.pending
        const next: Model = { ...model, game: Sim.collect(model.game), selected: nodeId }
        return withToast(next, `Collected $${Math.round(amount).toLocaleString('en-US')}.`, 'ok', [
          sync(next),
        ])
      }
      const next: Model = { ...model, selected: nodeId }
      return { model: next, commands: [sync(next)] }
    },

    NodeMoved: ({ nodeId, x, y }) => {
      const next: Model = { ...model, game: Sim.move(model.game, nodeId, x, y) }
      return { model: next, commands: [sync(next)] }
    },

    LinkRequested: ({ from, to }) => apply(model, Sim.connect(model.game, from, to)),

    LinkCut: ({ from, to }) => {
      const next: Model = { ...model, game: Sim.disconnect(model.game, from, to) }
      return { model: next, commands: [sync(next)] }
    },

    EmptyTapped: () => {
      if (model.selected === null) return { model }
      const next: Model = { ...model, selected: null }
      return { model: next, commands: [sync(next)] }
    },

    UpgradeBought: ({ nodeId }) => {
      const node = model.game.nodes.find((entry) => entry.id === nodeId)
      return apply(
        model,
        Sim.upgrade(model.game, nodeId),
        {},
        node ? [`${COMPONENTS[node.type].name} is level ${node.level + 1}.`, 'ok'] : undefined,
      )
    },

    NodeSold: ({ nodeId }) => {
      const node = model.game.nodes.find((entry) => entry.id === nodeId)
      return apply(
        model,
        Sim.sell(model.game, nodeId),
        { selected: null },
        node
          ? [
              `Sold ${COMPONENTS[node.type].name} for $${Math.round(COMPONENTS[node.type].cost * 0.5)}.`,
              'plain',
            ]
          : undefined,
      )
    },

    LanguageChosen: ({ nodeId, language }) =>
      apply(model, Sim.setLanguage(model.game, nodeId, language), {}, [
        `Rewritten in ${LANGUAGES[language].name}.`,
        'ok',
      ]),

    FrameworkChosen: ({ nodeId, framework }) =>
      apply(model, Sim.setFramework(model.game, nodeId, framework), {}, [
        framework === 'none' ? 'Framework removed.' : `Now running ${FRAMEWORKS[framework].name}.`,
        'ok',
      ]),

    Collected: () => {
      if (model.game.pending <= 0) return { model }
      const amount = model.game.pending
      const next: Model = { ...model, game: Sim.collect(model.game) }
      return withToast(next, `Collected $${Math.round(amount).toLocaleString('en-US')}.`, 'ok', [
        sync(next),
      ])
    },

    ResearchBought: ({ id }) =>
      apply(model, Sim.study(model.game, id), {}, [`Researched ${RESEARCH[id].name}.`, 'primary']),

    RoundRaised: () => {
      const stage = STAGES[model.game.stage + 1]
      const outcome = Sim.raise(model.game)
      if (!outcome.ok || !stage) return apply(model, outcome)
      const ipo = Sim.isPublic(outcome.game)
      return apply(model, outcome, { panel: ipo ? 'ipo' : model.panel }, [
        `${stage.name}. ${stage.news}`,
        'primary',
      ])
    },

    PanelOpened: ({ panel }) => ({ model: { ...model, panel, placing: null } }),
    PanelClosed: () => ({ model: { ...model, panel: 'none' } }),

    ToastRaised: ({ message: text, tone }) => withToast(model, text, tone),
    ToastCleared: ({ id }) => ({
      model: model.toast?.id === id ? { ...model, toast: null } : model,
    }),

    Synced: () => ({ model }),
  })
