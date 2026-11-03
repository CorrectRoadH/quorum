import { Effect, Schema } from 'effect'
import { BUILD_GROUPS, type BuildGroup } from '@quorum/simulation/catalog'
import { Progress, SANDBOX_IDS } from '@quorum/simulation/sandbox'
import type { Ledger } from '@quorum/simulation/ledger'
import { solveFlow } from '@quorum/simulation/solve'
import { HistoryRow } from '@quorum/simulation/exit'
import { Founder } from '@quorum/simulation/founder'
import { ChallengeResult, RunTotals } from '@quorum/simulation/challenges'
import { Replay } from '@quorum/simulation/replay'
import { ChallengeVerdict } from '@quorum/rpc'
import { histogramQuery } from './challenge-query.ts'
import { History } from './history.ts'
import { AppRoute, MENU_PAGES } from './route.ts'
import {
  ComponentId,
  FamilyId,
  FrameworkId,
  Game,
  GameLink,
  GameNode,
  ResearchId,
  RuntimeId,
  Region,
} from '@quorum/simulation/state'

/* ==========================================================================
   Quorum — what the UI holds. The Game is the saved company; everything else
   is the player's view of it. The Ledger is never stored: views derive it
   from the Game with `ledgerOf`.
   ========================================================================== */

export const Gate = Schema.Literals(['shut', 'clocking', 'open'])

export const Panel = Schema.Literals([
  'none',
  'research',
  'team',
  'exit',
  'exited',
  'away',
  'playbooks',
  'help',
  'offer',
  'era',
  'end',
  'dev',
  'passed',
  'challenge',
  'settings',
  'glossary',
  'inbox',
  'dashboard',
])
export type Panel = typeof Panel.Type

export const BuildGroupKey = Schema.Literals(
  BUILD_GROUPS.map((group) => group.key) as [BuildGroup, ...Array<BuildGroup>],
)

/** The title menu's page. */
export const Menu = Schema.Literals(['main', ...MENU_PAGES])
export type Menu = typeof Menu.Type

export const SandboxId = Schema.Literals(SANDBOX_IDS)

/** The Sandbox on the board: a guided one and its progress, or the free one when `id` is null. */
export const SandboxRun = Schema.Struct({
  id: Schema.NullOr(SandboxId),
  progress: Progress,
})
export type SandboxRun = typeof SandboxRun.Type

/** What the Sandbox keeps in localStorage, apart from the Company save. */
export const SandboxStore = Schema.Struct({
  passed: Schema.Array(SandboxId),
  free: Schema.NullOr(Game),
})
export type SandboxStore = typeof SandboxStore.Type

/** What happened while the player was away (15 "Offline return"). */
export const Away = Schema.Struct({
  seconds: Schema.Finite,
  away: Schema.Finite,
  usersBefore: Schema.Finite,
  usersAfter: Schema.Finite,
  cash: Schema.Finite,
  insight: Schema.Finite,
  devHours: Schema.Finite,
  peak: Schema.Finite,
  peakHour: Schema.Finite,
  peakNode: Schema.NullOr(Schema.String),
  lost: Schema.Boolean,
})
export type Away = typeof Away.Type

/** The Company that just exited: its history row, and the research it could pass on. */
export const Exited = Schema.Struct({
  row: HistoryRow,
  researched: Schema.Array(ResearchId),
})
export type Exited = typeof Exited.Type

/** Where a Challenge result stands with the server: provisional until it confirms. */
export const Verification = Schema.Literals([
  'local',
  'sending',
  'verified',
  'unverified',
  'offline',
])
export type Verification = typeof Verification.Type

/**
 * The open Challenge. The player builds on a live preview, then Run replays
 * the Design from t = 0 on the Challenge's seed; only that run is scored.
 */
export const ChallengeRun = Schema.Struct({
  id: Schema.String,
  phase: Schema.Literals(['build', 'running', 'result']),
  /** The build board at Run, restored by Rebuild. */
  board: Schema.NullOr(Game),
  /** The run's replay: the Design at Run, and the actions logged since. */
  replay: Schema.NullOr(Replay),
  totals: RunTotals,
  result: Schema.NullOr(ChallengeResult),
  verdict: Schema.NullOr(ChallengeVerdict),
  verification: Verification,
  /** Why the server did not confirm, when it did not. */
  note: Schema.NullOr(Schema.String),
})
export type ChallengeRun = typeof ChallengeRun.Type

export const Tone = Schema.Literals(['plain', 'ok', 'warn', 'danger', 'primary'])
export type Tone = typeof Tone.Type

export const Toast = Schema.Struct({
  id: Schema.Finite,
  message: Schema.String,
  tone: Tone,
})
export type Toast = typeof Toast.Type

/** One line in a Thread: what was said, and when. */
export const MailEntry = Schema.Struct({ time: Schema.Finite, text: Schema.String })

/** A button on a Mail. The id says what it does; `update.ts` maps it to a Message. */
export const MailAction = Schema.Struct({ id: Schema.String, label: Schema.String })

/** One Thread: Mail about one thing from one Sender. It stays until the player deletes it. */
export const Mail = Schema.Struct({
  id: Schema.Finite,
  key: Schema.String,
  sender: Schema.String,
  subject: Schema.String,
  /** Game time of the newest entry. */
  time: Schema.Finite,
  entries: Schema.Array(MailEntry),
  actions: Schema.Array(MailAction),
  /** What the player chose, once they chose; it replaces the buttons. */
  answer: Schema.NullOr(Schema.String),
  read: Schema.Boolean,
  trashed: Schema.Boolean,
  spam: Schema.Boolean,
  /** Game time its cause went away, or null while it holds. */
  resolved: Schema.NullOr(Schema.Finite),
})
export type Mail = typeof Mail.Type

export const Folder = Schema.Literals(['inbox', 'spam', 'trash'])
export type Folder = typeof Folder.Type

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
  /** Revenue, served, and error share over the last few ticks, to tell when they stop moving. */
  recent: Schema.Array(
    Schema.Struct({ revenue: Schema.Finite, served: Schema.Finite, errors: Schema.Finite }),
  ),
  /** Trailing ticks the figures have held within 1%. */
  steady: Schema.Finite,
})
export type Change = typeof Change.Type

/** An option a Tradeoff card previews: a Stack choice or an instance family. */
export const TradeoffOption = Schema.Union([
  Schema.Struct({ kind: Schema.Literal('runtime'), id: RuntimeId }),
  Schema.Struct({ kind: Schema.Literal('framework'), id: FrameworkId }),
  Schema.Struct({ kind: Schema.Literal('family'), id: FamilyId }),
])
export type TradeoffOption = typeof TradeoffOption.Type

export const TradeoffKind = Schema.Literals(['runtime', 'framework', 'family'])
export type TradeoffKind = typeof TradeoffKind.Type

/** What a ghost run says an option does to the player's Design. */
export const PreviewFigures = Schema.Struct({
  before: Figures,
  after: Figures,
  burn: Schema.Array(Schema.Finite),
  restart: Schema.Finite,
  cash: Schema.Finite,
})
export type PreviewFigures = typeof PreviewFigures.Type

/** The open Tradeoff card: hovered, or pinned by a click until Confirm or Cancel. */
export const Tradeoff = Schema.Struct({
  nodeId: Schema.String,
  option: TradeoffOption,
  pinned: Schema.Boolean,
  preview: Schema.NullOr(PreviewFigures),
  /** Why the option cannot be chosen, when it cannot. */
  refusal: Schema.NullOr(Schema.String),
})
export type Tradeoff = typeof Tradeoff.Type

/** An element a first Company shows only once it is useful (15 "Progressive disclosure"). */
export const Reveal = Schema.Literals([
  'undo',
  'collect',
  'resize',
  'research',
  'errors',
  'team',
  'engineering',
  'autopilot',
  'glossary',
])
export type Reveal = typeof Reveal.Type

/** The element that just appeared: it glows until the player uses it or its UI ticks run out. */
export const RevealCue = Schema.Struct({ key: Reveal, left: Schema.Finite })
export type RevealCue = typeof RevealCue.Type

/** Motion: follow the system setting, or reduce it whatever the system says. */
export const Motion = Schema.Literals(['system', 'reduce'])
export type Motion = typeof Motion.Type

/** What the player's browser remembers apart from saves: settings, and the option sets confirmed once. */
export const Prefs = Schema.Struct({
  seenTradeoffs: Schema.Array(TradeoffKind).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  muted: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  motion: Motion.pipe(Schema.withDecodingDefaultKey(Effect.succeed('system' as const))),
})
export type Prefs = typeof Prefs.Type

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

/** The Design before a board action, and the Cash it moved. Design pieces only, to keep the Model small. */
export const Undo = Schema.Struct({
  label: Schema.String,
  nodes: Schema.Array(GameNode),
  links: Schema.Array(GameLink),
  nextId: Schema.Finite,
  /** The signed Cash change of the action: negative for a purchase, positive for a sale. */
  cash: Schema.Finite,
  at: Schema.Finite,
})
export type Undo = typeof Undo.Type

export const Model = Schema.Struct({
  /** The screen, parsed from the URL. */
  route: AppRoute,
  /** The clock-in splash before the title: shut until the first click or key press, which lets the title play sound. */
  gate: Gate,
  /** The Company, or the Sandbox while one is open. */
  game: Game,
  /** A saved company exists, so the title screen offers Continue. */
  saved: Schema.Boolean,
  /** The open Challenge, or null. */
  challenge: Schema.NullOr(ChallengeRun),
  /** Challenge histograms from the API Worker. */
  histograms: histogramQuery.Model,
  /** Today's UTC date, for the daily drill. */
  today: Schema.String,
  /** The open Sandbox, or null in a Company. */
  sandbox: Schema.NullOr(SandboxRun),
  /** The Company, kept aside while a Sandbox is open. */
  company: Schema.NullOr(Game),
  /** Guided Sandboxes the player has passed. */
  passed: Schema.Array(SandboxId),
  /** The free Sandbox as the player left it. */
  freeBoard: Schema.NullOr(Game),
  selected: Schema.NullOr(Schema.String),
  /** Nodes picked with shift for a Playbook. */
  selection: Schema.Array(Schema.String),
  placing: Schema.NullOr(ComponentId),
  /** The Founder's Playbook being placed, by index. */
  stamping: Schema.NullOr(Schema.Finite),
  /** The player across Companies, kept apart from the Company save. */
  founder: Founder,
  away: Schema.NullOr(Away),
  exited: Schema.NullOr(Exited),
  /** The region tab the board shows. */
  region: Region,
  panel: Panel,
  /** The research item the Research panel shows in its side pane; null picks one. */
  researchFocus: Schema.NullOr(ResearchId),
  /** The open build tray, or null when the dock shows only its group icons. */
  buildGroup: Schema.NullOr(BuildGroupKey),
  /** The group that was open last, so the dock can animate out of it and back from it. */
  speed: Schema.Finite,
  paused: Schema.Boolean,
  /** Steps owed to the clock but not run yet: a tick at 1× is 2.5 Steps. */
  carry: Schema.Finite,
  /** Game time of the last save, so the clock saves every few seconds. */
  savedAt: Schema.Finite,
  /** Game time of the last log sample. */
  sampledAt: Schema.Finite,
  toast: Schema.NullOr(Toast),
  toastSeq: Schema.Finite,
  change: Schema.NullOr(Change),
  delta: Schema.NullOr(Delta),
  tradeoff: Schema.NullOr(Tradeoff),
  /** Option sets the player confirmed once: their cards collapse to one line. */
  seenTradeoffs: Schema.Array(TradeoffKind),
  /** Elements this Company shows, triggers that wait their turn, and the one that glows. */
  revealed: Schema.Array(Reveal),
  pending: Schema.Array(Reveal),
  cue: Schema.NullOr(RevealCue),
  muted: Schema.Boolean,
  motion: Motion,
  /** The Glossary panel's open entry, search, and category filter. */
  glossaryFocus: Schema.NullOr(Schema.String),
  glossaryQuery: Schema.String,
  glossaryCategory: Schema.NullOr(Schema.String),
  /** Advice the game has sent, oldest first, and the one the Inbox shows. */
  inbox: Schema.Array(Mail),
  inboxFocus: Schema.NullOr(Schema.Finite),
  /** The last event tick the world wrote Mail for. */
  mailBucket: Schema.Finite,
  /** The Sandbox's mail generator: the sample the next send uses. */
  mailSample: Schema.String,
  /** The mail folder the Inbox panel lists. */
  folder: Folder,
  /** Ticks left to show "Stable" after a change settles. */
  stableTicks: Schema.Finite,
  /** Board actions to undo, newest last, at most 50. */
  undo: Schema.Array(Undo),
  /** Undone actions to redo, newest last. A new action clears it. */
  redo: Schema.Array(Undo),
  /** The Bottleneck, searched once per sim second, not on every tick. */
  bottleneck: Schema.NullOr(Schema.String),
  /** The sim second of the last search; minus one searches again on the next tick. */
  bottleneckAt: Schema.Finite,
  /** Utilization per Node over the last two minutes, for Metrics. */
  nodeHistory: Schema.Record(Schema.String, Schema.Array(Schema.Finite)),
  /** The Dashboard's 15-minute and 1-hour blocks, beyond the Game's 600 Samples. */
  dashboardHistory: History,
  /** The Dashboard's time range in calendar minutes, and the Sample its crosshair is on. */
  dashboardRange: Schema.Finite,
  dashboardHover: Schema.NullOr(Schema.Finite),
  /** The last goal and bottleneck logged, so the log records changes only. */
  lastGoal: Schema.String,
  lastBottleneck: Schema.String,
})
export type Model = typeof Model.Type

/** The Ledger the views show: the flow solve, with the Bottleneck the clock last searched. */
export const ledgerOf = (model: Model): Ledger => ({
  ...solveFlow(model.game),
  bottleneck: model.bottleneck,
})

/** The board is not the Company: a Sandbox or a Challenge is open. */
export const offCompany = (model: Model): boolean =>
  model.sandbox !== null || model.challenge !== null
