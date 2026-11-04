import { describe, expect, test } from 'vitest'
import { newGame } from '@quorum/simulation/company'
import { eventsOf, type BridgeContext } from './analytics-bridge.ts'
import { line } from './telemetry.ts'

const context = (): BridgeContext => ({ game: newGame(), seenComponents: new Set<string>() })

describe('the analytics bridge', () => {
  test('maps a founded Company', () => {
    const events = eventsOf(
      [
        line(0, 'CompanyStarted', {
          stage: 0,
          venture: 'b2b-saas',
          mutators: [],
          first: true,
        }),
      ],
      context(),
    )
    expect(events).toEqual([
      {
        event: 'company:founded',
        properties: {
          venture: 'b2b-saas',
          mutators: [],
          mutator_count: 0,
          is_first_company: true,
          era: 0,
        },
      },
    ])
  })

  test('maps each placed Node, and marks only the first of its Component', () => {
    const bridge = context()
    const placed = (id: string) =>
      line(0, 'NodePlaced', {
        x: 0,
        y: 0,
        context: { stage: 2 },
        diff: { added: [{ id, type: 'cache', size: 3, region: 'eu' }] },
      })

    const first = eventsOf([placed('n1')], bridge)
    const second = eventsOf([placed('n2')], bridge)

    expect(first[0]).toMatchObject({
      event: 'board:node_placed',
      properties: {
        component_id: 'cache',
        component_kind: 'data',
        size: 3,
        era: 2,
        region: 'eu',
        placement_method: 'click',
        is_first_placement_of_component: true,
      },
    })
    expect(second[0]?.properties['is_first_placement_of_component']).toBe(false)
  })

  test('names both ends of a new Link', () => {
    const events = eventsOf(
      [
        line(0, 'LinkRequested', {
          from: 'users',
          to: 'server',
          context: { stage: 0 },
          diff: { linked: ['users>server'] },
        }),
      ],
      context(),
    )
    expect(events).toEqual([
      {
        event: 'board:link_created',
        properties: {
          from_component: 'users',
          to_component: 'server',
          is_cross_region: false,
          era: 0,
        },
      },
    ])
  })

  test('maps a refusal without inventing the action it refused', () => {
    const events = eventsOf(
      [
        line(0, 'NodePlaced', {
          x: 0,
          y: 0,
          refused: 'Not enough Cash.',
          context: { stage: 1 },
        }),
      ],
      context(),
    )
    expect(events).toEqual([
      {
        event: 'ui:action_refused',
        properties: {
          action: 'NodePlaced',
          reason: 'Not enough Cash.',
          era: 1,
          component_id: null,
        },
      },
    ])
  })

  test('maps a completed Research item, an Era, an Exit, and a return', () => {
    const events = eventsOf(
      [
        line(0, 'ResearchCompleted', { ids: ['stripe'], era: 2 }),
        line(0, 'EraReached', { era: 2, era_name: 'Seed', users: 120 }),
        line(0, 'Exited', { exit: 'IPO', payout: 9_000, legacy: 12, era: 5 }),
        line(0, 'OfflineReturned', {
          away: 3_600,
          seconds: 600,
          usersBefore: 10,
          usersAfter: 12,
          cash: 30,
          studied: ['stripe'],
          devHours: 1,
          peak: 20,
          lost: false,
        }),
      ],
      context(),
    )
    expect(events.map((event) => event.event)).toEqual([
      'research:completed',
      'company:era_reached',
      'company:exited',
      'company:offline_return',
    ])
    expect(events[0]?.properties).toMatchObject({ research_id: 'stripe', era: 2 })
    expect(events[2]?.properties).toMatchObject({ exit_type: 'IPO', era: 5 })
    expect(events[3]?.properties).toMatchObject({ away_seconds: 3_600, users_after: 12 })
  })

  test('drops the sample, the toast, and the goal change', () => {
    expect(
      eventsOf(
        [
          line(0, 'Sample', { users: 10 }),
          line(0, 'Toast', { message: 'Hello', tone: 'plain' }),
          line(0, 'GoalChanged', { goal: 'Collect' }),
        ],
        context(),
      ),
    ).toEqual([])
  })
})
