import { describe, expect, test } from 'vitest'
import { DESIGN_TUNING } from './catalog.ts'
import { runBot } from './pacing.ts'

/*
 * The other pacing bots (16 "Pacing model"), at the design pace. Greedy must not
 * beat 0.6 × the Balanced lower bound (27 min), Stubborn must reach Seed within
 * 1.6 × 60 min and within 1.6 × Balanced on the same seed, Decliner must reach
 * Seed, and Polyglot, who migrates to every language it researches, must be no
 * more than 30% faster than Balanced. The design's targets run to IPO; the slice
 * ends at Seed, so these are the slice's versions. Decliner's Legacy check waits
 * for M7. Three seeds each keep the suite fast.
 */

const SEEDS = [1, 2, 3]
const LIMIT = 96 * 60

const balancedRuns = new Map<number, number>()
/** Balanced's time to Seed, played once per seed however many tests compare against it. */
const balancedSeed = (seed: number): number => {
  const known = balancedRuns.get(seed)
  if (known !== undefined) return known
  const time = runBot(seed, LIMIT).milestones.seed ?? 0
  balancedRuns.set(seed, time)
  return time
}

describe('the other pacing bots', { timeout: 60_000 }, () => {
  test('Greedy, who only buys bigger boxes, is no faster than 27 minutes', () => {
    for (const seed of SEEDS) {
      const run = runBot(seed, LIMIT, DESIGN_TUNING, 'greedy')
      expect(run.milestones.seed ?? Infinity).toBeGreaterThanOrEqual(27 * 60)
    }
  })

  test('Stubborn, who never changes runtime or framework, reaches Seed within 96 minutes and 1.6 × Balanced', () => {
    for (const seed of SEEDS) {
      const stubborn = runBot(seed, LIMIT, DESIGN_TUNING, 'stubborn')
      expect(stubborn.game.stage).toBe(2)
      const balanced = balancedSeed(seed)
      expect(stubborn.milestones.seed ?? Infinity).toBeLessThanOrEqual(1.6 * balanced)
    }
  })

  test('Polyglot, who migrates to every language it researches, is no more than 30% faster than Balanced', async ({
    annotate,
  }) => {
    const times: Array<string> = []
    for (const seed of SEEDS) {
      const polyglot = runBot(seed, LIMIT, DESIGN_TUNING, 'polyglot')
      const balanced = balancedSeed(seed)
      expect(polyglot.game.stage).toBe(2)
      expect(polyglot.milestones.seed ?? 0).toBeGreaterThanOrEqual(0.7 * balanced)
      times.push(
        `${((polyglot.milestones.seed ?? 0) / 60).toFixed(1)} vs ${(balanced / 60).toFixed(1)}`,
      )
    }
    await annotate(`Polyglot vs Balanced to Seed, min: ${times.join('; ')}`)
  })

  test.todo('Stubborn and Polyglot within their limits to IPO: needs the Eras after Seed (M5, M6)')

  test('Decliner, who turns every round down, still reaches Seed', () => {
    for (const seed of SEEDS) {
      const run = runBot(seed, LIMIT, DESIGN_TUNING, 'decliner')
      expect(run.game.stage).toBe(2)
      expect(run.game.equity).toBe(1)
    }
  })
})
