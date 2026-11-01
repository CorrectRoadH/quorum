import { describe, expect, test } from 'vitest'
import { runBot } from './pacing.ts'

/*
 * The margin bot, M1 part (16 "Pacing model", plan C5). Margin is defined from
 * Seed on and needs payroll (M4), so M1 asserts only that the Garage and
 * Pre-seed pay for themselves, and records the margin at Seed entry at the
 * design's cost index (25). The 25–45% assertion waits for payroll.
 */

const SEEDS = [1, 2, 3]
const NINETY_MINUTES = 90 * 60

describe('the Balanced bot at the design pace', () => {
  for (const seed of SEEDS)
    test(`seed ${seed}: Garage and Pre-seed margins are positive, and it reaches Seed`, async ({
      annotate,
    }) => {
      const run = runBot(seed, NINETY_MINUTES)
      expect(run.game.stage).toBe(2)
      const garage = run.margins.find((entry) => entry.stage === 0)
      const preseed = run.margins.find((entry) => entry.stage === 1)
      expect(garage?.live ?? -1).toBeGreaterThan(0)
      expect(preseed?.live ?? -1).toBeGreaterThan(0)
      await annotate(
        `Seed at ${((run.milestones.seed ?? 0) / 60).toFixed(1)} min; margin at Seed entry ` +
          `${((preseed?.live ?? 0) * 100).toFixed(0)}% live, ` +
          `${((preseed?.design ?? 0) * 100).toFixed(0)}% at cost index 25`,
      )
    })
})
