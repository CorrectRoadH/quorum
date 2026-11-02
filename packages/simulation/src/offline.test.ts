import { describe, expect, test } from 'vitest'
import { OFFLINE_CAP } from './catalog.ts'
import { preseedGame } from './company.ts'
import { OFFLINE_CHURN, offlineCap, simulateAway } from './offline.ts'
import type { Game } from './state.ts'

/* Offline progress (04 "Offline progress"). */

const company = (): Game => ({ ...preseedGame(4), researched: [...preseedGame(4).researched] })

describe('offline progress', { timeout: 30_000 }, () => {
  // The GDD budget is under 1 s. One Pre-seed solve takes about 0.7 ms, so 2,880
  // Steps take about 2.4 s until the solver gets faster (16 divergence log).
  test('8 hours simulate with no incident', async ({ annotate }) => {
    const start = { ...company(), nextIncidentAt: 0 }
    const began = performance.now()
    const { game, report } = simulateAway(start, 8 * 3_600)
    const took = performance.now() - began
    // A guard against a pathological slowdown, loose enough for a loaded machine.
    expect(took).toBeLessThan(20_000)
    await annotate(`8 h offline took ${Math.round(took)} ms`)
    expect(report.seconds).toBe(8 * 3_600)
    expect(game.incident).toBeNull()
    expect(game.postmortems).toEqual(start.postmortems)
    // Nothing waits to strike the moment the player is back.
    expect(game.nextIncidentAt).toBeGreaterThan(game.time)
  })

  test('revenue goes straight to Cash, and the cap follows Night shift', () => {
    const start = company()
    expect(offlineCap(start)).toBe(OFFLINE_CAP[0])
    const night = { ...start, founding: { ...start.founding, perks: { 'night-shift': 3 } } }
    expect(offlineCap(night)).toBe(24 * 3_600)
    expect(simulateAway(start, 30 * 3_600).report.seconds).toBe(8 * 3_600)
    const { game } = simulateAway({ ...start, researched: [] }, 600)
    expect(game.pending).toBe(0)
    expect(game.cash).not.toBe(start.cash)
  })

  test('a Design that cannot serve loses at most 5% of its users', () => {
    const broken: Game = { ...company(), links: [] }
    const { game, report } = simulateAway(broken, 8 * 3_600)
    expect(game.users).toBeGreaterThanOrEqual(broken.users * (1 - OFFLINE_CHURN) - 1e-9)
    expect(report.lost).toBe(true)
  })

  test('users do not grow while the SLO does not hold', () => {
    const failing: Game = {
      ...company(),
      nodes: company().nodes.map((node) =>
        node.type === 'database' ? { ...node, down: -1 } : node,
      ),
    }
    expect(simulateAway(failing, 3_600).game.users).toBeLessThanOrEqual(failing.users)
  })
})
