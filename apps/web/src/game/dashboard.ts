import { Schema } from 'effect'
import type { Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import type { Dashboard } from './model.ts'

/* The Dashboard panel's time range and crosshair, folded into the parent with foldChild. */

export const DashboardMessage = defineMessageUnion({
  RangeChosen: { minutes: Schema.Finite },
  /** The crosshair moved onto a Sample, or off the chart. Sent on every pointer move. */
  Hovered: { index: Schema.NullOr(Schema.Finite) },
})
export type DashboardMessage = typeof DashboardMessage.Type

export const updateDashboard = (
  dashboard: Dashboard,
  message: DashboardMessage,
): Update.Return<Dashboard, DashboardMessage> =>
  DashboardMessage.match<Update.Return<Dashboard, DashboardMessage>>(message, {
    RangeChosen: ({ minutes }) => ({ model: { ...dashboard, range: minutes, hover: null } }),
    Hovered: ({ index }) => ({ model: { ...dashboard, hover: index } }),
  })
