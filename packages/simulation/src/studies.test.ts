import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { study, setSample, type Action } from './actions.ts'
import { RECIPE } from './catalog.ts'
import { preseedGame } from './company.ts'
import { solve } from './solve.ts'
import { NO_INSIGHT, type Game } from './state.ts'
import { step } from './step.ts'
import { queueSpike } from './work.ts'

/* 12 "Earning Insight" and 10 "Studies": Insight by kind, and research that takes time. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

/** Pre-seed with no incidents and no autopilot, so only the rules under test move. */
const quiet = (extra: Partial<Game> = {}): Game => ({
  ...preseedGame(),
  nextIncidentAt: Number.MAX_SAFE_INTEGER,
  autopilot: false,
  ...extra,
})

const run = (game: Game, seconds: number): Game => {
  let current = game
  for (let elapsed = 0; elapsed < seconds; elapsed += 1) current = step(current, 1).game
  return current
}

describe('Insight by request kind', () => {
  test('grows with the square root of the sampled traffic', () => {
    const at = (rate: number) => solve(ok(setSample(quiet(), 'analytics', rate))).insight.read
    // Five times the samples teach √5 times as much, not five times.
    expect(at(0.05) / at(0.01)).toBeCloseTo(Math.sqrt(5), 5)
  })

  test('a request keeps its kind on every hop, and each Component type adds a term', () => {
    const game = quiet()
    const tapped: Game = {
      ...game,
      links: [...game.links, { ...game.links[0]!, from: 'database', to: 'analytics' }],
    }
    const before = solve(game)
    const after = solve(tapped)
    // The Database sees `q-read` and `q-write`, but they teach `read` and `write`.
    expect(after.insight.read).toBeGreaterThan(before.insight.read * 1.5)
    expect(after.insight.write).toBeGreaterThan(before.insight.write * 1.5)
    expect(after.breadth.read).toBe(2)
    expect(before.breadth.read).toBe(1)
  })

  test('an old save’s single balance moves into pools by the request mix', () => {
    const old = quiet({ insight: 100, pools: NO_INSIGHT })
    const next = step(old, 0.1).game
    expect(next.insight).toBe(0)
    const total = Object.values(next.pools).reduce((sum, value) => sum + value, 0)
    expect(total).toBeGreaterThan(100)
    expect(next.pools.page).toBeGreaterThan(next.pools.login)
  })

  test('a pool stops at its retention cap', () => {
    const full = quiet({ pools: { ...NO_INSIGHT, read: 1e9 } })
    expect(step(full, 1).game.pools.read).toBe(1e9)
    const rate = solve(full).insight.read
    const near = quiet({ pools: { ...NO_INSIGHT, read: 900 * rate - 0.5 * rate } })
    expect(step(near, 1).game.pools.read).toBeCloseTo(900 * rate, 6)
  })
})

describe('Studies', () => {
  const caching = (pools: Game['pools']) => ok(study(quiet({ pools }), 'caching'))
  const rich = { ...NO_INSIGHT, read: 1e6 }

  test('a Study takes its base duration, and its Insight as it runs', () => {
    const queued = caching(rich)
    const almost = run(queued, 59)
    expect(almost.researched).not.toContain('caching')
    // It took its recipe in proportion: 59 of 60 seconds' worth.
    expect(rich.read - almost.pools.read).toBeLessThan(
      (RECIPE.caching.read ?? 0) * (59 / 60) + 1e-6,
    )
    const done = run(almost, 2)
    expect(done.researched).toContain('caching')
    expect(done.studies).toEqual([])
  })

  test('with an empty pool, the pool’s live rate sets the pace', () => {
    const queued = caching(NO_INSIGHT)
    const rate = solve(queued).insight.read
    const later = run(queued, 60)
    // About a minute of `read` Insight pays about that share of the cost.
    expect(later.studies[0]?.progress ?? 0).toBeCloseTo((rate * 60) / (RECIPE.caching.read ?? 1), 1)
    expect(later.researched).not.toContain('caching')
  })

  test('a Spike doubles the running Study’s speed', () => {
    const spiked = ok(queueSpike(caching(rich)))
    const done = run(spiked, 31)
    expect(done.researched).toContain('caching')
    // The Spike ends with its Study.
    expect(done.backlog.some((item) => item.kind === 'spike')).toBe(false)
  })
})
