import { COMPONENTS } from '@quorum/simulation/catalog'
import type { Game } from '@quorum/simulation/state'
import type { LogEntry } from './playlog.ts'

/* ==========================================================================
   The playlog is the event bus. This module maps one batch of log lines to the
   PostHog events the plan keeps: no simulation imports, no browser APIs, so a
   test can drive it with plain entries.
   ========================================================================== */

export type AnalyticsEvent = Readonly<{
  event: string
  properties: Record<string, unknown>
}>

export type BridgeContext = Readonly<{
  /** The board after the batch, used to name the ends of a new Link. */
  game: Game
  /** Components placed this session, so the first placement can be marked. */
  seenComponents: Set<string>
}>

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

const text = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const bool = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null)

const listOf = (value: unknown): ReadonlyArray<unknown> => (Array.isArray(value) ? value : [])

const addedOf = (data: Record<string, unknown>): ReadonlyArray<Record<string, unknown>> =>
  listOf(record(data.diff)?.added).flatMap((node) => {
    const entry = record(node)
    return entry === null ? [] : [entry]
  })

const linkedOf = (data: Record<string, unknown>): ReadonlyArray<string> =>
  listOf(record(data.diff)?.linked).flatMap((link) => {
    const key = text(link)
    return key === null ? [] : [key]
  })

const eraOf = (data: Record<string, unknown>): number | null => count(record(data.context)?.stage)

export const eventsOf = (
  entries: ReadonlyArray<LogEntry>,
  context: BridgeContext,
): ReadonlyArray<AnalyticsEvent> => {
  const events: Array<AnalyticsEvent> = []

  for (const entry of entries) {
    let parsed: unknown
    try {
      parsed = JSON.parse(entry.data)
    } catch {
      continue
    }
    const data = record(parsed)
    if (data === null) continue

    const refused = text(data.refused)
    if (refused !== null)
      events.push({
        event: 'ui:action_refused',
        properties: {
          action: entry.type,
          reason: refused,
          era: eraOf(data),
          component_id: text(data.type),
        },
      })

    switch (entry.type) {
      case 'CompanyStarted':
        events.push({
          event: 'company:founded',
          properties: {
            venture: text(data.venture),
            mutators: listOf(data.mutators).flatMap((id) => (text(id) === null ? [] : [text(id)])),
            mutator_count: listOf(data.mutators).length,
            is_first_company: bool(data.first) ?? false,
            era: count(data.stage) ?? 0,
          },
        })
        break

      case 'EraReached':
        events.push({ event: 'company:era_reached', properties: data })
        break

      case 'ResearchCompleted': {
        const ids = listOf(data.ids).flatMap((id) => (text(id) === null ? [] : [text(id)]))
        for (const id of ids)
          events.push({
            event: 'research:completed',
            properties: {
              research_id: id,
              era: count(data.era),
              researched_count: ids.length,
            },
          })
        break
      }

      case 'Exited':
        events.push({
          event: 'company:exited',
          properties: {
            exit_type: text(data.exit),
            payout: count(data.payout),
            legacy: count(data.legacy),
            era: count(data.era),
          },
        })
        break

      case 'OfflineReturned':
        events.push({
          event: 'company:offline_return',
          properties: {
            away_seconds: count(data.away),
            sim_seconds: count(data.seconds),
            users_before: count(data.usersBefore),
            users_after: count(data.usersAfter),
            cash_gained: count(data.cash),
            research_completed: listOf(data.studied).length,
            dev_hours: count(data.devHours),
            peak_users: count(data.peak),
            lost_users: bool(data.lost) ?? false,
          },
        })
        break

      case 'NodePlaced':
      case 'NodesPasted':
        for (const node of addedOf(data)) {
          const type = text(node.type)
          if (type === null) continue
          const first = !context.seenComponents.has(type)
          context.seenComponents.add(type)
          const def = COMPONENTS[type as keyof typeof COMPONENTS]
          events.push({
            event: 'board:node_placed',
            properties: {
              component_id: type,
              component_kind: def?.group ?? null,
              size: count(node.size),
              era: eraOf(data),
              region: text(node.region),
              placement_method: entry.type === 'NodesPasted' ? 'paste' : 'click',
              is_first_placement_of_component: first,
            },
          })
        }
        break

      case 'LinkRequested':
        for (const key of linkedOf(data)) {
          const [from, to] = key.split('>')
          if (from === undefined || to === undefined) continue
          const source = context.game.nodes.find((node) => node.id === from)
          const target = context.game.nodes.find((node) => node.id === to)
          events.push({
            event: 'board:link_created',
            properties: {
              from_component: source?.type ?? null,
              to_component: target?.type ?? null,
              is_cross_region:
                source !== undefined && target !== undefined && source.region !== target.region,
              era: eraOf(data),
            },
          })
        }
        break

      default:
        break
    }
  }

  return events
}
