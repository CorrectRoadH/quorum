import { Schema } from 'effect'
import { BUILD_GROUPS, type BuildGroup } from './engine/catalog.ts'
import { ComponentId, Game, ResearchId } from './engine/state.ts'

/* ==========================================================================
   Quorum — what the UI holds. The Game is the saved company; everything else
   is the player's view of it. The Ledger is never stored: views derive it
   from the Game with `solve`.
   ========================================================================== */

export const Route = Schema.Literals(['title', 'lab'])
export type Route = typeof Route.Type

export const Panel = Schema.Literals(['none', 'research', 'help', 'offer', 'era', 'end', 'dev'])
export type Panel = typeof Panel.Type

export const BuildGroupKey = Schema.Literals(
  BUILD_GROUPS.map((group) => group.key) as [BuildGroup, ...Array<BuildGroup>],
)

export const Tone = Schema.Literals(['plain', 'ok', 'warn', 'danger', 'primary'])
export type Tone = typeof Tone.Type

export const Toast = Schema.Struct({
  id: Schema.Finite,
  message: Schema.String,
  tone: Tone,
})
export type Toast = typeof Toast.Type

/** The figures a change is measured by. */
export const Figures = Schema.Struct({
  revenue: Schema.Finite,
  latency: Schema.Finite,
  p99: Schema.Finite,
  errors: Schema.Finite,
})
export type Figures = typeof Figures.Type

/** A change the player made, settling: queues drain, caches and runtimes warm up. */
export const Change = Schema.Struct({
  label: Schema.String,
  count: Schema.Finite,
  startedAt: Schema.Finite,
  before: Figures,
  /** Revenue over the last few ticks, to tell when it stops moving. */
  recent: Schema.Array(Schema.Finite),
})
export type Change = typeof Change.Type

/** The result of a change, once it settled. */
export const Delta = Schema.Struct({
  id: Schema.Finite,
  label: Schema.String,
  before: Figures,
  after: Figures,
  worse: Schema.Boolean,
  shownAt: Schema.Finite,
})
export type Delta = typeof Delta.Type

/** The Design before the last board action, and the Cash it cost. */
export const Undo = Schema.Struct({
  label: Schema.String,
  game: Game,
  spent: Schema.Finite,
  at: Schema.Finite,
})
export type Undo = typeof Undo.Type

export const Model = Schema.Struct({
  route: Route,
  game: Game,
  /** A saved company exists, so the title screen offers Continue. */
  saved: Schema.Boolean,
  selected: Schema.NullOr(Schema.String),
  placing: Schema.NullOr(ComponentId),
  panel: Panel,
  /** The research item the Research panel shows in its side pane; null picks one. */
  researchFocus: Schema.NullOr(ResearchId),
  /** The open build tray, or null when the dock shows only its group icons. */
  buildGroup: Schema.NullOr(BuildGroupKey),
  speed: Schema.Finite,
  paused: Schema.Boolean,
  /** Game time of the last save, so the clock saves every few seconds. */
  savedAt: Schema.Finite,
  /** Game time of the last log sample. */
  sampledAt: Schema.Finite,
  toast: Schema.NullOr(Toast),
  toastSeq: Schema.Finite,
  change: Schema.NullOr(Change),
  delta: Schema.NullOr(Delta),
  undo: Schema.NullOr(Undo),
  /** Utilization per Node over the last two minutes, for Metrics. */
  nodeHistory: Schema.Record(Schema.String, Schema.Array(Schema.Finite)),
  /** The last goal and bottleneck logged, so the log records changes only. */
  lastGoal: Schema.String,
  lastBottleneck: Schema.String,
})
export type Model = typeof Model.Type
