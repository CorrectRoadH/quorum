import { describe, expect, test } from 'vitest'
import { DESIGN_TUNING } from './catalog.ts'
import { runBot } from './pacing.ts'

/*
 * The Balanced bot at the design pace (16 "Pacing model", plan D16: five seeds).
 * It asserts what the model reaches. The GDD's 45–60 min to Seed and 15–20 min
 * to Pre-seed are not reached: growth alone takes the Company from 150 users to
 * the Seed threshold in about 34 minutes, so the bot raises Seed at 34–41 min
 * and Pre-seed at about 13 min. The measured times are in the divergence log
 * (16-balancing.md), and the annotations below report them on every run.
 * Margin is defined from Seed on and needs payroll (M4), so the Garage and
 * Pre-seed only have to pay for themselves.
 */

const SEEDS = [1, 2, 3, 4, 5]
const NINETY_MINUTES = 90 * 60
const minutes = (seconds: number | undefined) => ((seconds ?? 0) / 60).toFixed(1)

describe('the Balanced bot at the design pace', { timeout: 60_000 }, () => {
  for (const seed of SEEDS)
    test(`seed ${seed}: pays its way, raises Pre-seed within 20 min, and reaches Seed`, async ({
      annotate,
    }) => {
      const run = runBot(seed, NINETY_MINUTES)
      expect(run.game.stage).toBe(2)
      expect(run.milestones.preseed ?? Infinity).toBeLessThanOrEqual(20 * 60)
      expect(run.milestones['first-research'] ?? Infinity).toBeLessThan(5 * 60)
      expect(run.milestones['db-split'] ?? Infinity).toBeLessThan(10 * 60)
      const garage = run.margins.find((entry) => entry.stage === 0)
      const preseed = run.margins.find((entry) => entry.stage === 1)
      expect(garage?.live ?? -1).toBeGreaterThan(0)
      expect(preseed?.live ?? -1).toBeGreaterThan(0)
      const { milestones } = run
      await annotate(
        `Seed at ${minutes(milestones.seed)} min; Pre-seed ${minutes(milestones.preseed)}, ` +
          `first research ${minutes(milestones['first-research'])}, first upgrade ` +
          `${minutes(milestones['first-upgrade'])}, DB split ${minutes(milestones['db-split'])}, ` +
          `second server ${milestones['second-server'] === undefined ? 'never' : minutes(milestones['second-server'])}, ` +
          `first incident ${minutes(milestones['first-incident'])}, first Feature live ` +
          `${minutes(milestones['first-feature'])}, first hire ${minutes(milestones['first-hire'])}, ` +
          `${run.game.engineers.length} engineers and ${run.game.shipped.length} Features at Seed; margin at Seed entry ` +
          `${((preseed?.live ?? 0) * 100).toFixed(0)}% live, ` +
          `${((preseed?.design ?? 0) * 100).toFixed(0)}% at cost index 25`,
      )
    })
})

/*
 * The Balanced bot through Seed (10 "Era 2: Seed"). Growth bounds the Era again:
 * from 5,000 to 25,000 users against a 35,000 market takes about 28 minutes at
 * the design's g, so Series A comes 27–33 minutes after Seed. The bot places a
 * Search Engine and a WAF as soon as it can; uploads wait on Profile photos,
 * which its autopilot has not built by Series A. Margin at the design's Series A
 * cost index (120) is recorded, not asserted: the Margin bot is later work.
 */
describe('the Balanced bot through Seed', { timeout: 120_000 }, () => {
  for (const seed of SEEDS)
    test(`seed ${seed}: plays Seed with its new Components and raises Series A`, async ({
      annotate,
    }) => {
      const run = runBot(seed, 150 * 60, DESIGN_TUNING, 'balanced', 3)
      const { milestones } = run
      expect(run.game.stage).toBe(3)
      expect(milestones['search-engine'] ?? Infinity).toBeLessThan(milestones['series-a'] ?? 0)
      expect(milestones.waf ?? Infinity).toBeLessThan(milestones['series-a'] ?? 0)
      expect(run.game.apdex).toBeGreaterThan(0.88)
      const seedEra = run.margins.find((entry) => entry.stage === 2)
      expect(seedEra?.live ?? -1).toBeGreaterThan(0)
      await annotate(
        `Seed at ${minutes(milestones.seed)} min, Series A at ${minutes(milestones['series-a'])}; ` +
          `Search Engine ${minutes(milestones['search-engine'])}, WAF ${minutes(milestones.waf)}, ` +
          `second server ${minutes(milestones['second-server'])}; margin at Series A entry ` +
          `${((seedEra?.live ?? 0) * 100).toFixed(0)}% live, ` +
          `${((seedEra?.design ?? 0) * 100).toFixed(0)}% at cost index 120`,
      )
    })
})
