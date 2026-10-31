import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { ComponentId, FrameworkId, LanguageId, ResearchId } from './engine/state.ts'
import { BuildGroupKey, Panel, Tone } from './model.ts'

/* ==========================================================================
   Every gesture in Quorum becomes one of these.
   ========================================================================== */

export const Message = defineMessageUnion({
  /** The save in localStorage, read once at boot. Null when there is none. */
  SaveLoaded: { json: Schema.NullOr(Schema.String) },
  Saved: {},
  Continued: {},
  NewCompanyStarted: {},
  TitleOpened: {},

  Ticked: {},
  SpeedCycled: {},
  PauseToggled: {},
  KeyPressed: { key: Schema.String },
  FullscreenToggled: {},
  BoardFitted: {},

  BuildGroupChosen: { group: BuildGroupKey },
  PlacingChosen: { type: Schema.NullOr(ComponentId) },
  NodePlaced: { x: Schema.Finite, y: Schema.Finite },
  NodeTapped: { nodeId: Schema.String },
  NodeMoved: { nodeId: Schema.String, x: Schema.Finite, y: Schema.Finite },
  LinkRequested: { from: Schema.String, to: Schema.String },
  LinkCut: { from: Schema.String, to: Schema.String },
  EmptyTapped: {},

  UpgradeBought: { nodeId: Schema.String },
  NodeSold: { nodeId: Schema.String },
  LanguageChosen: { nodeId: Schema.String, language: LanguageId },
  FrameworkChosen: { nodeId: Schema.String, framework: FrameworkId },
  Collected: {},

  ResearchBought: { id: ResearchId },
  RoundRaised: {},

  PanelOpened: { panel: Panel },
  PanelClosed: {},

  ToastRaised: { message: Schema.String, tone: Tone },
  ToastCleared: { id: Schema.Finite },
  /** A Command finished applying something to the DOM. Nothing reads it. */
  Synced: {},
})

export type Message = typeof Message.Type
