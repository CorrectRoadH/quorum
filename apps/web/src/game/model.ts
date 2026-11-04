import { TradeoffOption } from '@quorum/ui/game/tradeoff'
import { Listbox, Menu as UiMenu } from '@foldkit/ui'
import { Locale } from '../i18n/index.ts'
import { Effect, Schema } from 'effect'
import { DragAndDrop } from '@foldkit/ui'
import { BUILD_GROUPS, type BuildGroup } from '@quorum/simulation/catalog'
import { Progress, SANDBOX_IDS } from '@quorum/simulation/sandbox'
import type { Ledger } from '@quorum/simulation/ledger'
import { solveFlow } from '@quorum/simulation/solve'
import { HistoryRow, exitOffers } from '@quorum/simulation/exit'
import { Founder } from '@quorum/simulation/founder'
import { Playbook } from '@quorum/simulation/playbook'
import { ChallengeResult, RunTotals } from '@quorum/simulation/challenges'
import { Replay } from '@quorum/simulation/replay'
import { ChallengeVerdict } from '@quorum/rpc'
import { histogramQuery } from './challenge-query.ts'
import { History } from './history.ts'
import { NodeSample } from './node-metrics.ts'
import { AppRoute, MENU_PAGES } from './route.ts'
import { ComponentId, Game, GameLink, GameNode, ResearchId, Region } from '@quorum/simulation/state'

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
  'menu',
  'settings',
  'glossary',
  'inbox',
  'dashboard',
  'churn',
  'mirror',
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
  studied: Schema.Array(ResearchId),
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

export const Folder = Schema.Literals(['action', 'fyi', 'spam', 'trash'])
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

/** An option a Tradeoff card previews; the board's compute jobs share it. */
export { TradeoffOption }

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
  locale: Locale.pipe(Schema.withDecodingDefaultKey(Effect.succeed('en' as const))),
  seenTradeoffs: Schema.Array(TradeoffKind).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
  muted: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  autoPause: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
  blurPause: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(true))),
  motion: Motion.pipe(Schema.withDecodingDefaultKey(Effect.succeed('system' as const))),
  agentAccess: Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(false))),
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

/** The Dashboard panel: its long history, time range, and crosshair. */
export const Dashboard = Schema.Struct({
  /** The 15-minute and 1-hour blocks, beyond the Game's 600 Samples. */
  history: History,
  /** The time range in calendar minutes. */
  range: Schema.Finite,
  /** The Sample the crosshair is on. */
  hover: Schema.NullOr(Schema.Finite),
})
export type Dashboard = typeof Dashboard.Type

/** The Inbox: the Mail the game has sent, and how the panel and its preview card show it. */
export const Inbox = Schema.Struct({
  /** Oldest first. */
  mail: Schema.Array(Mail),
  /** The Mail the panel shows. */
  focus: Schema.NullOr(Schema.Finite),
  /** The Mail whose preview card waits above the Inbox button until the player reads or dismisses it. */
  peek: Schema.NullOr(Schema.Finite),
  /** The last event tick the world wrote Mail for. */
  bucket: Schema.Finite,
  /** The Sandbox's mail generator: the sample the next send uses. */
  sample: Schema.String,
  /** The folder the panel lists. */
  folder: Folder,
})
export type Inbox = typeof Inbox.Type

/** The Glossary panel: its open entry, search, category filter, and the panel it closes back to. */
/** The Team panel's transient drag gesture for moving engineers between teams. */
export const Team = Schema.Struct({ drag: DragAndDrop.Model })
export type Team = typeof Team.Type

/** The research item the Research panel shows in its side pane; null picks one. */
export const Research = Schema.Struct({ focus: Schema.NullOr(ResearchId) })
export type Research = typeof Research.Type

export const Glossary = Schema.Struct({
  focus: Schema.NullOr(Schema.String),
  /** Research when a (?) link opened it. */
  returnTo: Panel,
  query: Schema.String,
  category: Schema.NullOr(Schema.String),
})
export type Glossary = typeof Glossary.Type

/** A board mode: placing one Component, or stamping the Founder's Playbook (by index) or the copied Nodes. */
export const Tool = Schema.Union([
  Schema.TaggedStruct('Placing', { type: ComponentId }),
  Schema.TaggedStruct('Stamping', {
    source: Schema.Union([Schema.Finite, Schema.Literal('clipboard')]),
  }),
])
export type Tool = typeof Tool.Type

/** Progressive disclosure (15): the elements this board shows, triggers that wait their turn, and the one that glows. */
export const Disclosure = Schema.Struct({
  revealed: Schema.Array(Reveal),
  pending: Schema.Array(Reveal),
  cue: Schema.NullOr(RevealCue),
})
export type Disclosure = typeof Disclosure.Type

/** The board's clock: its speed, whether it runs, and when it last saved and sampled. */
export const Clock = Schema.Struct({
  speed: Schema.Finite,
  paused: Schema.Boolean,
  /** The pause came from the window losing focus, so focus resumes it. */
  away: Schema.Boolean,
  /** Steps owed but not run yet: a tick at 1× is 2.5 Steps. */
  carry: Schema.Finite,
  /** Game time of the last save, so the clock saves every few seconds. */
  savedAt: Schema.Finite,
  /** Game time of the last log sample. */
  sampledAt: Schema.Finite,
})
export type Clock = typeof Clock.Type

/**
 * One board: the Company, a Sandbox or a Challenge being played, and
 * everything the player does on it. Entering another board starts a fresh
 * one; the Company's board waits aside while a Sandbox or Challenge is open.
 */
export const Board = Schema.Struct({
  /** The Company, or the Sandbox or Challenge while one is open. */
  game: Game,
  /** The open Sandbox, or null. */
  sandbox: Schema.NullOr(SandboxRun),
  /** The open Challenge, or null. */
  challenge: Schema.NullOr(ChallengeRun),
  /** What the Company earned when it exited, until the player leaves it. */
  exited: Schema.NullOr(Exited),
  /** What happened while the player was away. */
  away: Schema.NullOr(Away),
  /** The region tab the board shows. */
  region: Region,
  selected: Schema.NullOr(Schema.String),
  /** Nodes picked with shift for a Playbook. */
  selection: Schema.Array(Schema.String),
  /** What a click on the board does, and what follows the pointer. */
  tool: Schema.NullOr(Tool),
  /** The Nodes a sale is waiting on, until the player confirms it. */
  confirmSell: Schema.NullOr(Schema.Array(Schema.String)),
  /** The Nodes last copied or cut. */
  clipboard: Schema.NullOr(Playbook),
  /** The open build tray, or null when the dock shows only its group icons. */
  buildGroup: Schema.NullOr(BuildGroupKey),
  team: Team,
  research: Research,
  /** The Insight card's help section is open. */
  insightHelp: Schema.Boolean,
  clock: Clock,
  change: Schema.NullOr(Change),
  delta: Schema.NullOr(Delta),
  /** Ticks left to show "Stable" after a change settles. */
  stableTicks: Schema.Finite,
  tradeoff: Schema.NullOr(Tradeoff),
  disclosure: Disclosure,
  /** Board actions to undo, newest last, at most 50. */
  undo: Schema.Array(Undo),
  /** Undone actions to redo, newest last. A new action clears it. */
  redo: Schema.Array(Undo),
  /** The Bottleneck, searched once per sim second, not on every tick. */
  bottleneck: Schema.NullOr(Schema.String),
  /** The sim second of the last search; minus one searches again on the next tick. */
  bottleneckAt: Schema.Finite,
  /** Recorded traffic and load per Node, at most one calendar day in this session. */
  nodeHistory: Schema.Record(Schema.String, Schema.Array(NodeSample)),
  nodeSample: Schema.NullOr(Schema.Struct({ nodeId: Schema.String, time: Schema.Finite })),
  inbox: Inbox,
  dashboard: Dashboard,
  /** The last goal and bottleneck logged, so the log records changes only. */
  lastGoal: Schema.String,
  lastBottleneck: Schema.String,
})
export type Board = typeof Board.Type

/** The session: what lasts while the page is open, and the board being played. */
export const Model = Schema.Struct({
  /** The screen, parsed from the URL. */
  route: AppRoute,
  /** The clock-in splash before the title: shut until the first click or key press, which lets the title play sound. */
  gate: Gate,
  panel: Panel,
  toast: Schema.NullOr(Toast),
  toastSeq: Schema.Finite,
  board: Board,
  /** The Company's board, kept aside while a Sandbox or Challenge is open. */
  company: Schema.NullOr(Board),
  /** A saved company exists, so the title screen offers Continue. */
  saved: Schema.Boolean,
  /** The board route is set, but the title screen's monitor plays its connect sequence first. */
  connecting: Schema.Boolean,
  /** The player across Companies, kept apart from the Company save. */
  founder: Founder,
  /** Guided Sandboxes the player has passed. */
  passed: Schema.Array(SandboxId),
  /** The free Sandbox as the player left it. */
  freeBoard: Schema.NullOr(Game),
  /** Challenge histograms from the API Worker. */
  histograms: histogramQuery.Model,
  /** Today's UTC date, for the daily drill. */
  today: Schema.String,
  /** The player's settings, kept in the browser apart from saves. */
  prefs: Prefs,
  glossary: Glossary,
  languagePicker: Listbox.Model,
  /** The phone toolbar's More menu. */
  moreMenu: UiMenu.Model,
})
export type Model = typeof Model.Type

/** The Ledger the views show: the flow solve, with the Bottleneck the clock last searched. */
export const ledgerOf = (model: Model): Ledger => ({
  ...solveFlow(model.board.game),
  bottleneck: model.board.bottleneck,
})

/** The board is not the Company: a Sandbox or a Challenge is open. */
export const offCompany = (model: Model): boolean =>
  model.board.sandbox !== null || model.board.challenge !== null

/** The most Legacy an Exit pays now, or null while no Exit is on the table. */
export const exitLegacy = (model: Model): number | null => {
  if (offCompany(model) || model.board.exited) return null
  const offers = exitOffers(model.board.game, ledgerOf(model))
  return offers.length === 0 ? null : Math.max(...offers.map((offer) => offer.legacy))
}

/** The game menu, or the Settings it opens, is over the board. */
export const inMenu = (model: Model): boolean =>
  model.panel === 'menu' || model.panel === 'settings'

/** The clock holds still: the player paused it, or the game menu is open. */
export const halted = (model: Model): boolean =>
  model.board.clock.paused || inMenu(model) || model.connecting

/** The Playbook that follows the pointer, if any. */
export const stampedPlaybook = (model: Model): Playbook | null =>
  model.board.tool?._tag !== 'Stamping'
    ? null
    : model.board.tool.source === 'clipboard'
      ? model.board.clipboard
      : (model.founder.playbooks[model.board.tool.source] ?? null)

/** The Component a click on the board places, if any. */
export const placingOf = (model: Model): typeof ComponentId.Type | null =>
  model.board.tool?._tag === 'Placing' ? model.board.tool.type : null
