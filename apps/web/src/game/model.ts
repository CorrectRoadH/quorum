import { Schema } from 'effect'

/* ==========================================================================
   Quorum — the domain the UI reads.
   Vocabulary follows CONTEXT.md: Component, Node, Design, Cluster, Ledger,
   Capital, Burn, Income, Scenario, Run, Role, Report card, Tradeoff card,
   Tick, Manifest.
   ========================================================================== */

export const Route = Schema.Literals([
  'menu',
  'howto',
  'scenarios',
  'briefing',
  'create',
  'join',
  'lobby',
  'run',
  'report',
])
export type Route = typeof Route.Type

export const RoleKey = Schema.Literals(['edge', 'data', 'platform'])
export type RoleKey = typeof RoleKey.Type

export const PaletteGroup = Schema.Literals(['edge', 'data', 'platform'])
export type PaletteGroup = typeof PaletteGroup.Type

export const Overlay = Schema.Literals(['none', 'tradeoff', 'pause'])
export type Overlay = typeof Overlay.Type

export const TradeoffChoice = Schema.Literals(['none', 'cache-reads', 'write-through'])
export type TradeoffChoice = typeof TradeoffChoice.Type

export const NodeState = Schema.Literals(['ok', 'warn', 'danger', 'down'])
export type NodeState = typeof NodeState.Type

export const NodeFamily = Schema.Literals(['cluster', 'managed'])
export type NodeFamily = typeof NodeFamily.Type

export const Tone = Schema.Literals(['plain', 'ok', 'warn', 'danger', 'primary'])
export type Tone = typeof Tone.Type

/** One placed Component: a Node on the canvas, with a row in the Ledger. */
export const Node = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  family: NodeFamily,
  meta: Schema.String,
  replicas: Schema.Finite,
  util: Schema.Finite,
  inbound: Schema.String,
  capacity: Schema.String,
  state: NodeState,
  /** Design-space position on the canvas, in canvas units. */
  x: Schema.Finite,
  y: Schema.Finite,
})
export type Node = typeof Node.Type

/** One link between two Nodes. Quorum has one connection type. */
export const Link = Schema.Struct({
  from: Schema.String,
  to: Schema.String,
  active: Schema.Boolean,
  flow: Schema.Boolean,
})
export type Link = typeof Link.Type

export const Design = Schema.Struct({
  nodes: Schema.Array(Node),
  links: Schema.Array(Link),
  selected: Schema.NullOr(Schema.String),
})
export type Design = typeof Design.Type

/** A Ledger row: what the Simulation derived for one Node at this Tick. */
export const LedgerRow = Schema.Struct({
  nodeId: Schema.String,
  name: Schema.String,
  replicas: Schema.Finite,
  burn: Schema.Finite,
  inbound: Schema.String,
  capacity: Schema.String,
  util: Schema.Finite,
  p50: Schema.String,
  p99: Schema.String,
  errors: Schema.String,
  status: Schema.String,
  tone: Tone,
  rowTone: Tone,
})
export type LedgerRow = typeof LedgerRow.Type

export const Room = Schema.Struct({
  code: Schema.String,
  name: Schema.String,
  scenarioId: Schema.String,
  role: RoleKey,
  minutes: Schema.Finite,
  shared: Schema.Boolean,
  seats: Schema.Finite,
})
export type Room = typeof Room.Type

export const JoinCheck = Schema.Literals(['idle', 'short', 'unknown', 'found'])
export type JoinCheck = typeof JoinCheck.Type

export const Join = Schema.Struct({
  code: Schema.String,
  check: JoinCheck,
})
export type Join = typeof Join.Type

/** A failure that is still counting down. When `atTick` arrives, the Node goes
 *  back to `state` — the state it held before it was knocked down. */
export const Recovery = Schema.Struct({
  nodeId: Schema.String,
  atTick: Schema.Finite,
  state: NodeState,
})
export type Recovery = typeof Recovery.Type

export const Run = Schema.Struct({
  tick: Schema.Finite,
  playing: Schema.Boolean,
  speed: Schema.Finite,
  capital: Schema.Finite,
  burn: Schema.Finite,
  spiked: Schema.Boolean,
  injected: Schema.Finite,
  overlay: Overlay,
  tradeoff: TradeoffChoice,
  hovered: Schema.NullOr(Schema.String),
  recoveries: Schema.Array(Recovery),
})
export type Run = typeof Run.Type

export const Toast = Schema.Struct({
  id: Schema.Finite,
  message: Schema.String,
  tone: Tone,
})
export type Toast = typeof Toast.Type

export const Model = Schema.Struct({
  route: Route,
  paletteGroup: PaletteGroup,
  room: Room,
  join: Join,
  run: Run,
  design: Design,
  ledger: Schema.Array(LedgerRow),
  sessionSeconds: Schema.Finite,
  cleared: Schema.Boolean,
  carriedCapital: Schema.Finite,
  toast: Schema.NullOr(Toast),
  toastSeq: Schema.Finite,
})
export type Model = typeof Model.Type

/** Design-space canvas the diagram lays out in, before it fits the window. */
export const CANVAS = { width: 852, height: 502, nodeWidth: 176, nodeHeight: 76 } as const

export const NODE_WIDTH = CANVAS.nodeWidth
export const NODE_HEIGHT = CANVAS.nodeHeight
