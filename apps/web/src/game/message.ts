import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { TASK_IDS } from '@template/simulation/catalog'
import {
  CacheEngine,
  ComponentId,
  FamilyId,
  FeatureId,
  FrameworkId,
  IncidentId,
  LbPolicy,
  PmMode,
  PolicyId,
  PoolerMode,
  RequestKindId,
  ResearchId,
  Retries,
  RuntimeId,
} from '@template/simulation/state'
import { BuildGroupKey, Menu, Panel, SandboxId, Tone, TradeoffOption } from './model.ts'

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
  MenuChosen: { menu: Menu },

  /** Guided and free Sandboxes, and the Sandbox store read once at boot. */
  SandboxStoreLoaded: { json: Schema.NullOr(Schema.String) },
  PrefsLoaded: { json: Schema.NullOr(Schema.String) },
  GuidedStarted: { id: SandboxId },
  FreeSandboxStarted: {},
  FreeSandboxReset: {},
  CompanyCopied: {},
  DemandStepped: { direction: Schema.Literals([1, -1]) },
  MixChosen: { stage: Schema.Finite },

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
  PmChosen: { nodeId: Schema.String, pm: PmMode },
  PoolerModeChosen: { nodeId: Schema.String, mode: PoolerMode },
  CompressionChosen: { nodeId: Schema.String, compress: Schema.Boolean },
  PolicyChosen: { nodeId: Schema.String, policy: LbPolicy },
  HealthCheckChosen: {
    nodeId: Schema.String,
    checkEvery: Schema.optional(Schema.Finite),
    deepCheck: Schema.optional(Schema.Boolean),
  },
  AlertRuleChosen: {
    rule: Schema.Literals(['errors', 'latency', 'saturation']),
    threshold: Schema.Finite,
  },
  TtlChosen: { nodeId: Schema.String, ttl: Schema.Finite },
  CacheEngineChosen: { nodeId: Schema.String, engine: CacheEngine },
  LinkPolicyChosen: {
    from: Schema.String,
    to: Schema.String,
    timeout: Schema.optional(Schema.Finite),
    retries: Schema.optional(Retries),
  },
  LinkKindsChosen: {
    from: Schema.String,
    to: Schema.String,
    kinds: Schema.NullOr(Schema.Array(RequestKindId)),
  },
  SampleChosen: { nodeId: Schema.String, sampleRate: Schema.Finite },
  ReplaceBought: { nodeId: Schema.String },
  RestartChosen: { nodeId: Schema.String },
  IndexAdded: { nodeId: Schema.String },
  CacheGuardChosen: {
    nodeId: Schema.String,
    coalesce: Schema.optional(Schema.Boolean),
    warming: Schema.optional(Schema.Boolean),
  },
  DlqChosen: { nodeId: Schema.String, dlq: Schema.Boolean },
  ParanoiaChosen: { nodeId: Schema.String, paranoia: Schema.Finite },
  UnderAttackChosen: { nodeId: Schema.String, underAttack: Schema.Boolean },
  MessageDeleted: {},
  NodeSold: { nodeId: Schema.String },
  Collected: {},
  /** Hovering an option opens its Tradeoff card; clicking pins it, or applies it once seen. */
  OptionPreviewed: { nodeId: Schema.String, option: TradeoffOption },
  OptionLeft: {},
  OptionChosen: { nodeId: Schema.String, option: TradeoffOption },
  OptionConfirmed: {},
  TradeoffClosed: {},
  UndoChosen: {},
  RedoChosen: {},

  ResearchFocused: { id: ResearchId },
  ResearchBought: { id: ResearchId },
  /** The Team panel: engineers, teams, the backlog, migrations, and deploys. */
  HireChosen: {},
  LayoffChosen: { engineerId: Schema.String },
  TeamCreated: {},
  TeamRemoved: { teamId: Schema.String },
  EngineerAssigned: { engineerId: Schema.String, teamId: Schema.String },
  TeamPolicyChosen: { teamId: Schema.String, policy: PolicyId },
  FeatureQueued: { id: FeatureId },
  TaskQueued: { id: Schema.Literals(TASK_IDS) },
  WorkMoved: { id: Schema.Finite, direction: Schema.Literals([1, -1]) },
  WorkCancelled: { id: Schema.Finite },
  WorkRushed: { id: Schema.Finite },
  AutopilotToggled: {},
  MigrationShifted: {},
  MigrationCancelled: {},
  RolledBack: {},

  RoundRaised: {},
  RoundDeclined: {},
  PostmortemFiled: { id: Schema.Finite, take: Schema.Boolean },

  PanelOpened: { panel: Panel },
  PanelClosed: {},

  /** Playtest panel. */
  CheatCash: {},
  CheatInsight: {},
  CheatRound: {},
  IncidentForced: { kind: IncidentId },
  LogExported: {},
  LogCleared: {},

  ToastRaised: { message: Schema.String, tone: Tone },
  ToastCleared: { id: Schema.Finite },
  /** A Command finished applying something to the DOM. Nothing reads it. */
  Synced: {},
})

export type Message = typeof Message.Type
