import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { Overlay, PaletteGroup, Route, RoleKey, Tone, TradeoffChoice } from './model.ts'

/* ==========================================================================
   Every gesture in Quorum becomes one of these.
   ========================================================================== */

export const Message = defineMessageUnion({
  /** Move to a screen. The router in update is the only thing that reads it. */
  WentTo: { route: Route },
  /** Context back: the header's back button, Esc. */
  Backed: {},

  PaletteGroupChosen: { group: PaletteGroup },
  CatalogItemPicked: { name: Schema.String },

  RoomNameChanged: { name: Schema.String },
  RoomScenarioChanged: { scenarioId: Schema.String },
  RoomRoleChosen: { role: RoleKey },
  RoomLengthChosen: { minutes: Schema.Finite },
  RoomShareToggled: {},
  RoomCreated: { code: Schema.String },
  ScenarioPicked: { scenarioId: Schema.String },

  CodeChanged: { code: Schema.String },
  JoinSubmitted: {},
  RoomJoined: { code: Schema.String },

  RunStarted: {},
  Ticked: {},
  SessionTicked: {},
  SpeedCycled: {},
  MonthEnded: {},
  TradeoffChosen: { choice: TradeoffChoice },
  TradeoffPlaced: {},
  FailureInjected: {},

  NodeTapped: { nodeId: Schema.String },
  NodeHovered: { nodeId: Schema.NullOr(Schema.String) },

  OverlayOpened: { overlay: Overlay },
  OverlayClosed: {},

  CopyRequested: { text: Schema.String, label: Schema.String },
  ToastRaised: { message: Schema.String, tone: Tone },
  ToastCleared: { id: Schema.Finite },
  /** The canvas finished applying the Model. Nothing reads it; a Command has
   *  to produce a Message, and this one is deliberately inert. */
  DiagramSynced: {},
})

export type Message = typeof Message.Type
