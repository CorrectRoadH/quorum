import { Schema } from 'effect'
import { COMPONENT_IDS, FRAMEWORK_IDS, LANGUAGE_IDS, RESEARCH_IDS } from './catalog.ts'

/* ==========================================================================
   The saved game. Everything the Simulation needs to continue lives here, and
   nothing else: the Ledger is derived from it on every Tick.
   ========================================================================== */

export const ComponentId = Schema.Literals(COMPONENT_IDS)
export const LanguageId = Schema.Literals(LANGUAGE_IDS)
export const FrameworkId = Schema.Literals(FRAMEWORK_IDS)
export const ResearchId = Schema.Literals(RESEARCH_IDS)

/** One placed Component. */
export const GameNode = Schema.Struct({
  id: Schema.String,
  type: ComponentId,
  x: Schema.Finite,
  y: Schema.Finite,
  level: Schema.Finite,
  language: LanguageId,
  framework: FrameworkId,
  /** Seconds left in an outage. Zero when the Node is up. */
  down: Schema.Finite,
})
export type GameNode = typeof GameNode.Type

export const GameLink = Schema.Struct({ from: Schema.String, to: Schema.String })
export type GameLink = typeof GameLink.Type

export const IncidentKind = Schema.Literals(['spike', 'ddos', 'outage'])
export type IncidentKind = typeof IncidentKind.Type

export const Incident = Schema.Struct({
  kind: IncidentKind,
  remaining: Schema.Finite,
  nodeId: Schema.NullOr(Schema.String),
})
export type Incident = typeof Incident.Type

/** One second of history, for the sparklines. */
export const Sample = Schema.Struct({
  users: Schema.Finite,
  demand: Schema.Finite,
  served: Schema.Finite,
  revenue: Schema.Finite,
  latency: Schema.Finite,
})
export type Sample = typeof Sample.Type

export const Game = Schema.Struct({
  nodes: Schema.Array(GameNode),
  links: Schema.Array(GameLink),
  nextId: Schema.Finite,
  cash: Schema.Finite,
  insight: Schema.Finite,
  users: Schema.Finite,
  /** Revenue waiting in the Payments drawer. */
  pending: Schema.Finite,
  researched: Schema.Array(ResearchId),
  stage: Schema.Finite,
  /** Seconds of simulated time since the company started. */
  time: Schema.Finite,
  seed: Schema.Finite,
  incident: Schema.NullOr(Incident),
  nextIncidentAt: Schema.Finite,
  earned: Schema.Finite,
  history: Schema.Array(Sample),
})
export type Game = typeof Game.Type
