import { Data } from 'effect'
import type { FeatureId, ResearchId } from './catalog.ts'
import type { Incident, Postmortem, WorkItem } from './state.ts'

/* What a Step reports besides the new Game: things the player should hear about. */

export type AlertRule = 'errors' | 'latency' | 'saturation'

export type StepEvent = Data.TaggedEnum<{
  IncidentStarted: { readonly incident: Incident }
  IncidentResolved: { readonly postmortem: Postmortem }
  DrawerFull: {}
  OutOfMemory: { readonly nodeId: string }
  CreditsExhausted: { readonly nodeId: string }
  AlertFired: { readonly rule: AlertRule }
  AlertIgnored: { readonly rule: AlertRule }
  /** A hire joined the team. */
  Hired: { readonly engineerId: string }
  /** A backlog item is built. A Feature then waits for a deploy. */
  WorkFinished: { readonly item: WorkItem }
  /** A deploy shipped Features; `bad` when it shipped a bug too. */
  Deployed: { readonly features: ReadonlyArray<FeatureId>; readonly bad: boolean }
  /** The autopilot shifted a migration to its next step. */
  MigrationShifted: { readonly step: number }
  /** A CVE was disclosed in something the Design runs: its patch ticket is at the end of the backlog. */
  CveDisclosed: { readonly item: WorkItem }
  /** A patch ticket expired: the CVE was exploited and a Data breach started. */
  CveExploited: { readonly cve: string; readonly target: string }
  /** A Study completed: its research is the Company's now. */
  StudyCompleted: { readonly research: ResearchId }
}>

export const StepEvent = Data.taggedEnum<StepEvent>()
