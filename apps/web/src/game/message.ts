import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import {
  ComponentId,
  FamilyId,
  FrameworkId,
  IncidentId,
  ResearchId,
  RuntimeId,
} from './engine/state.ts'
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
  PreseedStarted: {},
  TitleOpened: {},

  Ticked: {},
  SpeedCycled: {},
  SpeedChosen: { speed: Schema.Finite },
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
  /** The button at the bottom of a Node card. */
  FooterPressed: { nodeId: Schema.String },

  ResizeChosen: { nodeId: Schema.String, direction: Schema.Literals([1, -1]) },
  FamilyChosen: { nodeId: Schema.String, family: FamilyId },
  RuntimeChosen: { nodeId: Schema.String, runtime: RuntimeId },
  FrameworkChosen: { nodeId: Schema.String, framework: FrameworkId },
  WorkersChosen: { nodeId: Schema.String, workers: Schema.Finite },
  SampleChosen: { nodeId: Schema.String, sample: Schema.Finite },
  ReplaceBought: { nodeId: Schema.String },
  RestartChosen: { nodeId: Schema.String },
  IndexAdded: { nodeId: Schema.String },
  NodeSold: { nodeId: Schema.String },
  Collected: {},
  UndoChosen: {},

  ResearchFocused: { id: ResearchId },
  ResearchBought: { id: ResearchId },
  RoundRaised: {},
  RoundDeclined: {},
  PostmortemFiled: { id: Schema.Finite, take: Schema.Boolean },

  PanelOpened: { panel: Panel },
  PanelClosed: {},

  /** Playtest panel. */
  CheatCash: {},
  CheatInsight: {},
  CheatPreseed: {},
  IncidentForced: { kind: IncidentId },
  LogExported: {},
  LogCleared: {},

  ToastRaised: { message: Schema.String, tone: Tone },
  ToastCleared: { id: Schema.Finite },
  /** A Command finished applying something to the DOM. Nothing reads it. */
  Synced: {},
})

export type Message = typeof Message.Type
