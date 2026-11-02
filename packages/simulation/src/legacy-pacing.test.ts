import { describe, expect, test } from 'vitest'
import { runBot } from './pacing.ts'
import type { Founding } from './state.ts'

/*
 * A second Company (13, plan M7): the Legacy a first Exit pays buys perks, and
 * the Balanced bot with them reaches Pre-seed and Seed sooner on the same seed.
 * Ten Legacy buys Angel network, Pattern recognition and Founder's reputation
 * at level 1. The measured times are in the divergence log (16-balancing.md).
 * The M7 target, a second Company to Exit in 3–6 hours, needs a bot that plays
 * to Series A or later, which the bots do not; it is not asserted.
 */

const SECOND: Founding = {
  venture: 'b2b-saas',
  mutators: [],
  perks: { 'angel-network': 1, 'pattern-recognition': 1, 'founders-reputation': 1 },
}
const NINETY_MINUTES = 90 * 60
const minutes = (seconds: number | undefined) => ((seconds ?? 0) / 60).toFixed(1)

describe('a second Company with Legacy perks', { timeout: 120_000 }, () => {
  for (const seed of [1, 2, 3])
    test(`seed ${seed}: reaches Pre-seed and Seed sooner than the first`, async ({ annotate }) => {
      const first = runBot(seed, NINETY_MINUTES)
      const second = runBot(seed, NINETY_MINUTES, undefined, 'balanced', 2, SECOND)
      expect(second.game.stage).toBe(2)
      expect(second.milestones.preseed ?? Infinity).toBeLessThan(
        first.milestones.preseed ?? Infinity,
      )
      expect(second.milestones.seed ?? Infinity).toBeLessThan(first.milestones.seed ?? Infinity)
      await annotate(
        `First: Pre-seed ${minutes(first.milestones.preseed)}, Seed ${minutes(first.milestones.seed)} min. ` +
          `Second: Pre-seed ${minutes(second.milestones.preseed)}, Seed ${minutes(second.milestones.seed)} min.`,
      )
    })
})
