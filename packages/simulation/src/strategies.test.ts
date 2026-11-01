import { describe, expect, test } from 'vitest'
import { DESIGN_TUNING } from './catalog.ts'
import { runBot } from './pacing.ts'

/*
 * The other pacing bots (16 "Pacing model", plan Step 23), at the design pace.
 * Greedy must not beat 0.6 × the Balanced lower bound (27 min), Stubborn must
 * reach Seed within 1.6 × 60 min, and Decliner must reach Seed. Its Legacy
 * check waits for M7. Three seeds each keep the suite fast.
 */

const SEEDS = [1, 2, 3]
const LIMIT = 96 * 60

describe('the other pacing bots', { timeout: 60_000 }, () => {
  test('Greedy, who only buys bigger boxes, is no faster than 27 minutes', () => {
    for (const seed of SEEDS) {
      const run = runBot(seed, LIMIT, DESIGN_TUNING, 'greedy')
      expect(run.milestones.seed ?? Infinity).toBeGreaterThanOrEqual(27 * 60)
    }
  })

  test('Stubborn, who never changes runtime or framework, reaches Seed within 96 minutes', () => {
    for (const seed of SEEDS)
      expect(runBot(seed, LIMIT, DESIGN_TUNING, 'stubborn').game.stage).toBe(2)
  })

  test('Decliner, who turns every round down, still reaches Seed', () => {
    for (const seed of SEEDS) {
      const run = runBot(seed, LIMIT, DESIGN_TUNING, 'decliner')
      expect(run.game.stage).toBe(2)
      expect(run.game.equity).toBe(1)
    }
  })
})
