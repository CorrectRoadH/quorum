import * as Effect from 'effect/Effect'
import { Schema } from 'effect'
import { Command, Update } from 'foldkit'
import type { Runtime } from 'foldkit'
import { Message } from './message.ts'
import { Design, Model, Route, type Run, type TradeoffChoice } from './model.ts'
import { heroDesign, openingDesign, openingLedger, scenarioById } from './content.ts'
import { TICKS_IN_MONTH } from './simulation.ts'
import { setDesired, type DiagramState } from './diagram.ts'

/* ==========================================================================
   Quorum — init, update, Commands, and the Mount that owns each Pixi canvas.
   ========================================================================== */

/** Demo rooms the prototype accepts. A real build asks the server. */
const VALID_CODES = new Set(['BLOG', 'RAID'])

export const syncDiagram = (key: string, state: DiagramState) =>
  SyncDiagram({ key, design: state.design, hovered: state.hovered, interactive: state.interactive })

/** The canvas a route shows, if it shows one. */
const diagramFor = (model: Model): ReadonlyArray<ReturnType<typeof syncDiagram>> => {
  if (model.route === 'run') {
    return [
      syncDiagram('run', {
        design: model.design,
        hovered: model.run.hovered,
        interactive: true,
      }),
    ]
  }
  if (model.route === 'menu') {
    return [syncDiagram('hero', { design: heroDesign, hovered: null, interactive: false })]
  }
  return []
}

/* ---------- Commands ---------- */

const SyncDiagram = Command.define('SyncDiagram', {
  args: {
    key: Schema.String,
    design: Design,
    hovered: Schema.NullOr(Schema.String),
    interactive: Schema.Boolean,
  },
  messages: [Message.DiagramSynced],
  execute: ({ key, design, hovered, interactive }) =>
    Effect.sync(() => setDesired(key, { design, hovered, interactive })).pipe(
      Effect.as(Message.DiagramSynced()),
    ),
})

const CopyText = Command.define('CopyText', {
  args: { text: Schema.String, label: Schema.String },
  messages: [Message.ToastRaised],
  execute: ({ text, label }) =>
    Effect.tryPromise(() => navigator.clipboard.writeText(text)).pipe(
      Effect.match({
        onSuccess: () => Message.ToastRaised({ message: `${label} copied.`, tone: 'ok' }),
        onFailure: () =>
          Message.ToastRaised({ message: 'The browser refused the clipboard.', tone: 'warn' }),
      }),
    ),
})

const ClearToast = Command.define('ClearToast', {
  args: { id: Schema.Finite },
  messages: [Message.ToastCleared],
  execute: ({ id }) => Effect.sleep('3200 millis').pipe(Effect.as(Message.ToastCleared({ id }))),
})

/* ---------- init ---------- */

export const initialModel = (): Model =>
  Model.make({
    route: 'menu',
    paletteGroup: 'edge',
    room: {
      code: 'BLOG',
      name: 'The Blog, tuesday night',
      scenarioId: 'the-blog',
      role: 'edge',
      minutes: 15,
      shared: true,
      seats: 4,
    },
    join: { code: '', check: 'idle' },
    run: {
      tick: 306,
      playing: false,
      speed: 1,
      capital: 8420,
      burn: 1730,
      spiked: false,
      injected: 0,
      overlay: 'none',
      tradeoff: 'none',
      hovered: null,
      recoveries: [],
    },
    design: openingDesign,
    ledger: [...openingLedger],
    sessionSeconds: 0,
    cleared: true,
    carriedCapital: 8420,
    toast: null,
    toastSeq: 0,
  })

export const init: Runtime.ApplicationInit<Model, Message> = () => {
  const model = initialModel()
  return { model, commands: diagramFor(model) }
}

/* ---------- helpers ---------- */

const BACK: Record<Route, Route> = {
  menu: 'menu',
  howto: 'menu',
  scenarios: 'menu',
  briefing: 'scenarios',
  create: 'menu',
  lobby: 'briefing',
  join: 'menu',
  run: 'briefing',
  report: 'scenarios',
}

const runWith = (run: Run, patch: Partial<Run>): Run => ({ ...run, ...patch })

const codeFrom = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)

const checkCode = (code: string): Model['join']['check'] => {
  if (code.length < 4) return code.length === 0 ? 'idle' : 'short'
  return VALID_CODES.has(code) ? 'found' : 'unknown'
}

const toastOf = (
  model: Model,
  message: string,
  tone: 'plain' | 'ok' | 'warn' | 'danger' | 'primary',
) => {
  const id = model.toastSeq + 1
  return {
    model: { ...model, toast: { id, message, tone }, toastSeq: id },
    commands: [ClearToast({ id })],
  }
}

const describeTradeoff = (choice: TradeoffChoice) =>
  choice === 'write-through'
    ? {
        title: 'Tradeoff engaged: Write-through',
        body: 'Every write lands in the cache too, so reads never go stale. Writes pay 38 ms.',
      }
    : {
        title: 'Tradeoff engaged: Cache reads',
        body: 'Reads come from memory and stay fast. A write stays invisible for 60 seconds.',
      }

const finish = (model: Model, reason: 'month' | 'early'): Update.Return<Model, Message> => {
  const withRoute: Model = {
    ...model,
    route: 'report',
    carriedCapital: Math.round(model.run.capital),
    run: runWith(model.run, { playing: false, overlay: 'none' }),
  }
  const id = withRoute.toastSeq + 1
  return {
    model: {
      ...withRoute,
      toast: {
        id,
        message:
          reason === 'month'
            ? `Tick ${TICKS_IN_MONTH}. The month closed and the report card is ready.`
            : `Month ended early at Tick ${model.run.tick}. The rest of the month is forfeited.`,
        tone: 'ok',
      },
      toastSeq: id,
    },
    commands: [...diagramFor(withRoute), ClearToast({ id })],
  }
}

/* ---------- update ---------- */

export const update = (model: Model, message: Message): Update.Return<Model, Message> =>
  Message.match<Update.Return<Model, Message>>(message, {
    WentTo: ({ route }) => {
      const next: Model = {
        ...model,
        route,
        run: runWith(model.run, {
          overlay: 'none',
          playing: route === 'run',
          ...(route === 'run' && model.run.tick >= TICKS_IN_MONTH
            ? { tick: 306, spiked: false, recoveries: [] }
            : {}),
        }),
      }
      return { model: next, commands: diagramFor(next) }
    },

    Backed: () => {
      const route = BACK[model.route]
      const next: Model = { ...model, route, run: runWith(model.run, { overlay: 'none' }) }
      return { model: next, commands: diagramFor(next) }
    },

    PaletteGroupChosen: ({ group }) => ({ model: { ...model, paletteGroup: group } }),

    CatalogItemPicked: ({ name }) => {
      if (name === 'Cache') {
        const next: Model = { ...model, run: runWith(model.run, { overlay: 'tradeoff' }) }
        return { model: next, commands: diagramFor(next) }
      }
      return toastOf(model, `${name} is ready to place. Drop it on the canvas.`, 'plain')
    },

    RoomNameChanged: ({ name }) => ({ model: { ...model, room: { ...model.room, name } } }),
    RoomScenarioChanged: ({ scenarioId }) => ({
      model: { ...model, room: { ...model.room, scenarioId } },
    }),
    RoomRoleChosen: ({ role }) => ({ model: { ...model, room: { ...model.room, role } } }),
    RoomLengthChosen: ({ minutes }) => ({ model: { ...model, room: { ...model.room, minutes } } }),
    RoomShareToggled: () => ({
      model: { ...model, room: { ...model.room, shared: !model.room.shared } },
    }),
    RoomCreated: ({ code }) => ({
      model: { ...model, room: { ...model.room, code } },
    }),
    ScenarioPicked: ({ scenarioId }) => {
      const scenario = scenarioById(scenarioId)
      return {
        model: { ...model, room: { ...model.room, scenarioId, role: scenario.role } },
      }
    },

    CodeChanged: ({ code }) => {
      const next = codeFrom(code)
      return { model: { ...model, join: { code: next, check: checkCode(next) } } }
    },
    JoinSubmitted: () => {
      if (model.join.check !== 'found') {
        return toastOf(model, `No room with the code ${model.join.code || '····'}.`, 'danger')
      }
      return {
        model: {
          ...model,
          route: 'lobby',
          room: { ...model.room, code: model.join.code },
        },
      }
    },
    RoomJoined: ({ code }) => ({
      model: { ...model, route: 'lobby', room: { ...model.room, code } },
    }),

    RunStarted: () => {
      const next: Model = {
        ...model,
        route: 'run',
        run: runWith(model.run, {
          tick: 306,
          playing: true,
          spiked: false,
          overlay: 'none',
          injected: 0,
        }),
      }
      return { model: next, commands: diagramFor(next) }
    },

    Ticked: () => {
      const run = model.run
      const tick = Math.min(TICKS_IN_MONTH, run.tick + run.speed)
      const messages: Array<ReturnType<typeof ClearToast>> = []
      let t = { ...model }

      if (!run.spiked && tick >= 340) {
        t = { ...t, run: runWith(t.run, { spiked: true }) }
        const id = t.toastSeq + 1
        t = {
          ...t,
          toast: {
            id,
            message: 'Tue 09:00. Traffic spike begins: demand doubles for 40 Ticks.',
            tone: 'warn',
          },
          toastSeq: id,
        }
        messages.push(ClearToast({ id }))
      }

      const due = t.run.recoveries.filter((entry) => entry.atTick <= tick)
      if (due.length > 0) {
        const waiting = new Map(due.map((entry) => [entry.nodeId, entry.state]))
        const names = t.design.nodes
          .filter((node) => waiting.has(node.id))
          .map((node) => node.name)
          .join(' and ')
        t = {
          ...t,
          design: {
            ...t.design,
            nodes: t.design.nodes.map((node) =>
              waiting.has(node.id) ? { ...node, state: waiting.get(node.id) ?? node.state } : node,
            ),
          },
          run: runWith(t.run, {
            recoveries: t.run.recoveries.filter((entry) => entry.atTick > tick),
          }),
        }
        const id = t.toastSeq + 1
        t = {
          ...t,
          toast: { id, message: `${names} back at full replicas.`, tone: 'ok' },
          toastSeq: id,
        }
        messages.push(ClearToast({ id }))
      }

      const nextRun = runWith(t.run, { tick, capital: t.run.capital + 0.42 * run.speed })
      if (tick >= TICKS_IN_MONTH) {
        return finish({ ...t, run: nextRun }, 'month')
      }
      const next: Model = { ...t, run: nextRun }
      return {
        model: next,
        commands: due.length > 0 ? [...messages, ...diagramFor(next)] : messages,
      }
    },

    SessionTicked: () => ({ model: { ...model, sessionSeconds: model.sessionSeconds + 1 } }),

    SpeedCycled: () => {
      const speed = model.run.speed === 1 ? 2 : model.run.speed === 2 ? 4 : 1
      return { model: { ...model, run: runWith(model.run, { speed }) } }
    },

    MonthEnded: () => finish(model, model.run.tick >= TICKS_IN_MONTH ? 'month' : 'early'),

    OverlayOpened: ({ overlay }) => {
      const next: Model = {
        ...model,
        // The overlay itself holds the clock, so `playing` stays the player's
        // intent and closing the overlay gives it straight back.
        run: runWith(model.run, { overlay }),
      }
      return { model: next, commands: diagramFor(next) }
    },
    OverlayClosed: () => ({
      model: { ...model, run: runWith(model.run, { overlay: 'none' }) },
    }),

    TradeoffChosen: ({ choice }) => ({
      model: { ...model, run: runWith(model.run, { tradeoff: choice }) },
    }),

    TradeoffPlaced: () => {
      const choice = model.run.tradeoff
      const { title } = describeTradeoff(choice)
      const design: Design = {
        ...model.design,
        nodes: model.design.nodes.map((node) =>
          node.id === 'cache'
            ? {
                ...node,
                meta: choice === 'write-through' ? 'Managed · write-through' : 'Managed · TTL 60s',
              }
            : node,
        ),
      }
      const next: Model = {
        ...model,
        design,
        run: runWith(model.run, { overlay: 'none', playing: true }),
      }
      const raised = toastOf(
        next,
        `${title.replace('Tradeoff engaged: ', '')} placed. Capital −$90, Burn +$90/mo.`,
        'ok',
      )
      return {
        model: raised.model,
        commands: [...raised.commands, ...diagramFor(next)],
      }
    },

    FailureInjected: () => {
      const injected = model.run.injected + 1
      const targetId = injected % 2 === 1 ? 'worker' : 'lb'
      const label = injected % 2 === 1 ? 'Worker' : 'Load Balancer'
      const design: Design = {
        ...model.design,
        nodes: model.design.nodes.map((node) =>
          node.id === targetId ? { ...node, state: 'warn' } : node,
        ),
      }
      const previous = model.design.nodes.find((node) => node.id === targetId)
      const next: Model = {
        ...model,
        design,
        run: runWith(model.run, {
          overlay: 'none',
          playing: true,
          injected,
          // The toast promises 12 Ticks; this is what makes that true.
          recoveries: [
            ...model.run.recoveries.filter((entry) => entry.nodeId !== targetId),
            { nodeId: targetId, atTick: model.run.tick + 12, state: previous?.state ?? 'ok' },
          ],
        }),
      }
      const raised = toastOf(
        next,
        `Injected: ${label} lost a replica for 12 Ticks. It keeps billing.`,
        'warn',
      )
      return {
        model: raised.model,
        commands: [...raised.commands, ...diagramFor(next)],
      }
    },

    NodeTapped: ({ nodeId }) => {
      const next: Model = { ...model, design: { ...model.design, selected: nodeId } }
      return { model: next, commands: diagramFor(next) }
    },

    NodeHovered: ({ nodeId }) => {
      if (model.run.hovered === nodeId) return { model }
      const next: Model = { ...model, run: runWith(model.run, { hovered: nodeId }) }
      return { model: next, commands: diagramFor(next) }
    },

    CopyRequested: ({ text, label }) => ({ model, commands: [CopyText({ text, label })] }),

    ToastRaised: ({ message, tone }) => {
      const id = model.toastSeq + 1
      return {
        model: { ...model, toast: { id, message, tone }, toastSeq: id },
        commands: [ClearToast({ id })],
      }
    },

    ToastCleared: ({ id }) => ({
      model: model.toast?.id === id ? { ...model, toast: null } : model,
    }),

    DiagramSynced: () => ({ model }),
  })
