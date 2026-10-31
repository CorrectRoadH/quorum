import { Schema } from 'effect'
import { BUILD_GROUPS, type BuildGroup } from './engine/catalog.ts'
import { ComponentId, Game } from './engine/state.ts'

/* ==========================================================================
   Quorum — what the UI holds. The Game is the saved company; everything else
   is the player's view of it. The Ledger is never stored: views derive it
   from the Game with `solve`.
   ========================================================================== */

export const Route = Schema.Literals(['title', 'lab'])
export type Route = typeof Route.Type

export const Panel = Schema.Literals(['none', 'research', 'help', 'ipo'])
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

export const Model = Schema.Struct({
  route: Route,
  game: Game,
  /** A saved company exists, so the title screen offers Continue. */
  saved: Schema.Boolean,
  selected: Schema.NullOr(Schema.String),
  placing: Schema.NullOr(ComponentId),
  panel: Panel,
  buildGroup: BuildGroupKey,
  speed: Schema.Finite,
  paused: Schema.Boolean,
  /** Game time of the last save, so the clock saves every few seconds. */
  savedAt: Schema.Finite,
  toast: Schema.NullOr(Toast),
  toastSeq: Schema.Finite,
})
export type Model = typeof Model.Type
