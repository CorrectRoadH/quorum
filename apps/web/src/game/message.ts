import { Listbox, Menu as UiMenu } from '@foldkit/ui'
import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest } from 'foldkit/navigation'
import { Url } from 'foldkit/url'
import { EXIT_IDS, FIXES, PERK_IDS, TASK_IDS } from '@quorum/simulation/catalog'
import {
  CacheEngine,
  Collector,
  ComponentId,
  GpuType,
  FamilyId,
  FrameworkId,
  IncidentId,
  MutatorId,
  VentureId,
  LbPolicy,
  PmMode,
  PoolerMode,
  RequestKindId,
  ResearchId,
  Retries,
  RuntimeId,
  ScaleSignal,
  Zone,
  Backup,
  Fanout,
  Region,
  IacTool,
  SyncMode,
  DataPattern,
} from '@quorum/simulation/state'
import { MANAGED } from '@quorum/simulation/mirror'
import { ChallengeVerdict } from '@quorum/rpc'
import { histogramQuery } from './challenge-query.ts'
import { DashboardMessage } from './dashboard.ts'
import { GlossaryMessage } from './glossary.ts'
import { InboxMessage } from './inbox.ts'
import { PrefsMessage } from './prefs.ts'
import { ResearchMessage } from './research.ts'
import { TeamMessage } from './team.ts'
import {
  BuildGroupKey,
  Menu,
  Panel,
  PreviewFigures,
  SandboxId,
  Tone,
  TradeoffOption,
} from './model.ts'

/* ==========================================================================
   Every gesture in Quorum becomes one of these.
   ========================================================================== */

export const Message = defineMessageUnion({
  /** The save in localStorage, read once at boot. Null when there is none. */
  SaveLoaded: { json: Schema.NullOr(Schema.String), now: Schema.Finite },
  FounderLoaded: {
    json: Schema.NullOr(Schema.String),
    deviceId: Schema.String,
    today: Schema.String,
  },
  Saved: {},
  /** The title screen's connect sequence ended: the board it was opening shows. */
  Connected: {},
  Continued: {},
  NewCompanyStarted: {},
  PreseedStarted: {},
  TitleOpened: {},
  /** The badge goes into the reader on the splash; the title follows. */
  ClockedIn: {},
  TitleRevealed: {},
  MenuChosen: { menu: Menu },
  /** URL routing: a link click, a new URL from any source, and a finished navigation. */
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  Navigated: {},

  /** Guided and free Sandboxes, and the Sandbox store read once at boot. */
  SandboxStoreLoaded: { json: Schema.NullOr(Schema.String) },
  PrefsLoaded: { json: Schema.NullOr(Schema.String) },
  GuidedStarted: { id: SandboxId },
  ChallengeStarted: { id: Schema.String },
  /** Replays the Design from t = 0 and scores it. */
  ChallengeRan: {},
  /** Runs the rest of the run at once. */
  ChallengeFinished: {},
  /** Back to the build board as it was at Run. */
  ChallengeRebuilt: {},
  /** Turns a code fix on or off in a Challenge that pays Dev Hours for it. */
  FixChosen: { fix: Schema.Literals(FIXES), on: Schema.Boolean },
  ChallengeVerified: { verdict: ChallengeVerdict },
  ChallengeUnverified: { message: Schema.String, offline: Schema.Boolean },
  GotHistograms: { message: histogramQuery.Message },
  FreeSandboxStarted: {},
  FreeSandboxReset: {},
  /** Replaces the free Sandbox with a stress board: the link-routing one, or the big one. */
  StressBoardLoaded: { big: Schema.Boolean },
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
  BoardTidied: {},

  BuildGroupChosen: { group: BuildGroupKey },
  PlacingChosen: { type: Schema.NullOr(ComponentId) },
  NodePlaced: { x: Schema.Finite, y: Schema.Finite },
  NodeTapped: { nodeId: Schema.String },
  /** Inspect a recorded component sample, or return to live traffic. */
  NodeSampleChosen: { nodeId: Schema.String, time: Schema.NullOr(Schema.Finite) },
  NodeMoved: { nodeId: Schema.String, x: Schema.Finite, y: Schema.Finite },
  LinkRequested: { from: Schema.String, to: Schema.String },
  LinkCut: { from: Schema.String, to: Schema.String },
  EmptyTapped: {},
  NodeToggled: { nodeId: Schema.String },
  SelectionBoxed: {
    ids: Schema.Array(Schema.String),
    /** Plain shift-drag replaces the selection; with Ctrl it adds, with Alt it takes away. */
    mode: Schema.Literals(['replace', 'add', 'subtract']),
  },
  SelectionCleared: {},
  /** Select every Node on the Board that can be sold. */
  SelectionAll: {},
  NodesCopied: {},
  NodesCut: {},
  /** The copied Nodes follow the pointer until a click places them. */
  NodesPasted: {},
  /** Asks to sell the selection; nothing is sold until it is confirmed. */
  SellAsked: {},
  SellConfirmed: {},
  SellDismissed: {},
  /** Places a copy of the selected Nodes just beside them. */
  NodesDuplicated: {},
  /** Moves the selected Nodes by a few board units. */
  NodesNudged: { dx: Schema.Finite, dy: Schema.Finite },
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
    breaker: Schema.optional(Schema.Boolean),
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
  AttemptsChosen: { nodeId: Schema.String, attempts: Schema.Finite },
  MaxLengthChosen: { nodeId: Schema.String, maxLength: Schema.Finite },
  PrefetchChosen: { nodeId: Schema.String, prefetch: Schema.Finite },
  ParanoiaChosen: { nodeId: Schema.String, paranoia: Schema.Finite },
  UnderAttackChosen: { nodeId: Schema.String, underAttack: Schema.Boolean },
  ZoneChosen: { nodeId: Schema.String, zone: Zone },
  StandbyChosen: { nodeId: Schema.String, standby: Schema.Boolean },
  AutoscalerChosen: {
    nodeId: Schema.String,
    signal: Schema.optional(ScaleSignal),
    target: Schema.optional(Schema.Finite),
    minCopies: Schema.optional(Schema.Finite),
    maxCopies: Schema.optional(Schema.Finite),
  },
  GpuChosen: { nodeId: Schema.String, gpu: GpuType },
  CollectorChosen: { nodeId: Schema.String, collector: Collector },
  GogcChosen: { nodeId: Schema.String, gogc: Schema.Finite },
  ShedChosen: { nodeId: Schema.String, shed: Schema.Boolean },
  RywChosen: { nodeId: Schema.String, ryw: Schema.Boolean },
  RuleDisabled: {},
  RegionPicked: { region: Region },
  RegionOpened: { region: Region },
  NodeRegionChosen: { nodeId: Schema.String, region: Region },
  QuorumChosen: { nodeId: Schema.String, n: Schema.Finite, r: Schema.Finite, w: Schema.Finite },
  SpreadChosen: { nodeId: Schema.String, spread: Schema.Boolean },
  BackupChosen: { nodeId: Schema.String, backup: Backup },
  FanoutChosen: { nodeId: Schema.String, fanout: Fanout },
  SplitChosen: { nodeId: Schema.String, split: Schema.Boolean },
  RoutesRolledBack: {},
  ConfigRolledBack: {},
  /** Mirrors (05 "Mirror a region"): the IaC tool, GitOps, and each Mirror's plan. */
  IacToolPicked: { tool: IacTool },
  SyncModePicked: { sync: Schema.NullOr(SyncMode) },
  MirrorStarted: { target: Region, source: Region },
  MirrorApplied: { region: Region, destroy: Schema.Boolean },
  MirrorDataPicked: { region: Region, source: Schema.String, pattern: DataPattern },
  MirrorOverrideSet: {
    region: Region,
    nodeId: Schema.String,
    field: Schema.Literals(MANAGED),
    keep: Schema.Boolean,
  },
  MirrorComputedSet: { region: Region, computed: Schema.Boolean },
  MirrorStopped: { region: Region },
  /** Reads live state: `pulumi refresh` or `alchemy drift`. */
  MirrorRefreshed: { region: Region },
  /** Alchemy's `drift --repair`: hand changes go back to the last deploy. */
  MirrorRepaired: { region: Region },
  LeaderFenced: {},
  DrillRun: {},
  GuidanceChosen: { growth: Schema.Finite, margin: Schema.Finite },
  ReportCancelled: {},
  VolumeExpanded: {},
  CertificateRenewed: {},
  MessageDeleted: {},
  NodeSold: { nodeId: Schema.String },
  Collected: {},
  /** Hovering an option opens its Tradeoff card; clicking pins it, or applies it once seen. */
  OptionPreviewed: { nodeId: Schema.String, option: TradeoffOption },
  OptionLeft: {},
  OptionChosen: { nodeId: Schema.String, option: TradeoffOption },
  OptionConfirmed: {},
  /** The compute worker ran an option's ghost runs. */
  PreviewComputed: { nodeId: Schema.String, option: TradeoffOption, preview: PreviewFigures },
  /** The compute worker searched the Bottleneck for the sim second `at`. */
  BottleneckFound: { bottleneck: Schema.NullOr(Schema.String), at: Schema.Finite },
  TradeoffClosed: {},
  UndoChosen: {},
  RedoChosen: {},

  ResearchChanged: { message: ResearchMessage },
  /** The Team panel: engineers, teams, the backlog, migrations, and deploys. */
  TeamChanged: { message: TeamMessage },
  TaskQueued: { id: Schema.Literals(TASK_IDS) },
  WorkMoved: { id: Schema.Finite, direction: Schema.Literals([1, -1]) },
  WorkCancelled: { id: Schema.Finite },
  WorkRushed: { id: Schema.Finite },
  WorkPrioritized: { id: Schema.Finite },
  AutopilotToggled: {},
  MigrationShifted: {},
  MigrationCancelled: {},
  RolledBack: {},

  /** Exits, the Founder, and the Legacy shop (13). */
  ExitTaken: { exit: Schema.Literals(EXIT_IDS) },
  KeepToggled: { id: ResearchId },
  PerkBought: { id: Schema.Literals(PERK_IDS) },
  VentureChosen: { id: VentureId },
  MutatorToggled: { id: MutatorId },
  CompanyFounded: {},
  AwayClosed: {},

  /** Playbooks. */
  PlaybookSaved: {},
  PlaybookChosen: { index: Schema.Finite },
  PlaybookDeleted: { index: Schema.Finite },
  PlaybookExported: { index: Schema.Finite },
  PlaybookImportAsked: {},
  PlaybookImported: { text: Schema.NullOr(Schema.String) },

  RoundRaised: {},
  RoundDeclined: {},
  PostmortemFiled: { id: Schema.Finite, take: Schema.Boolean },

  PanelOpened: { panel: Panel },
  /** A fix in the Churn breakdown: open or show a region, a research item, or a Node. */
  ChurnFixTaken: {
    fix: Schema.Literals(['region', 'research', 'node']),
    target: Schema.String,
  },
  PanelClosed: {},

  /** Settings and the Glossary (15). Each panel is a Submodel with its own Messages. */
  PrefsChanged: { message: PrefsMessage },
  /** The window lost focus. */
  WindowBlurred: {},
  /** The window got focus back. */
  WindowFocused: {},
  LanguagePickerChanged: { message: Listbox.Message },
  MoreMenuChanged: { message: UiMenu.Message },
  InsightHelpToggled: {},
  GlossaryOpened: { id: Schema.NullOr(Schema.String) },
  GlossaryChanged: { message: GlossaryMessage },
  DashboardChanged: { message: DashboardMessage },
  InboxChanged: { message: InboxMessage },

  /** Playtest panel. */
  CheatCash: {},
  CheatInsight: {},
  CheatRound: {},
  CheatLegacy: {},
  IncidentForced: { kind: IncidentId },
  LogExported: {},
  StateCopied: {},
  LogCleared: {},

  ToastRaised: { message: Schema.String, tone: Tone },
  ToastCleared: { id: Schema.Finite },
  /** A Command finished applying something to the DOM. Nothing reads it. */
  Synced: {},
})

export type Message = typeof Message.Type
