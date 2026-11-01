import { Data } from 'effect'
import type { Incident, Postmortem } from './state.ts'

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
}>

export const StepEvent = Data.taggedEnum<StepEvent>()
