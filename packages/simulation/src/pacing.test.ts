import { describe, expect, test } from 'vitest'
import { SLOW } from '../slow.ts'
import { DESIGN_TUNING } from './catalog.ts'
import { runBot } from './pacing.ts'
import { budgetOf } from './slo.ts'

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
 * The Balanced bot through Seed (10 "Era 2: Seed") and 40 minutes into Series A
 * (10 "Era 3: Series A"). Growth bounds Seed again: from 5,000 to 25,000 users
 * against a 35,000 market takes about 28 minutes at the design's g, but the
 * Team's Features raise growth and the market, so Series A comes 23–30 minutes
 * after Seed. The bot places a Search Engine and a WAF as soon as it can. Its
 * autopilot ships Video, Chat, and Checkout in Series A, so media, rt and buy
 * reach its Design. PHP refuses realtime connections, so once Chat is on the
 * backlog the bot migrates to Node.js cluster mode. In Series A it researches
 * Multiple zones first, then spreads its App Servers across two zones and gives
 * every data Node a standby, and raises Series B (91–106 min on seeds 1–5). It moves each CVE patch ticket to the top of
 * the backlog, so no ticket expires into a Data breach.
 * Series C is a placeholder, so the run stops on the clock. Margins at the design's cost indexes are recorded, not asserted.
 */
describe.skipIf(!SLOW)(
  'the Balanced bot through Seed and Series A into Series B',
  { timeout: 360_000 },
  () => {
    for (const seed of SEEDS)
      test(`seed ${seed}: plays Seed, raises Series A, spreads across zones, raises Series B`, async ({
        annotate,
      }) => {
        const run = runBot(seed, 130 * 60, DESIGN_TUNING, 'balanced', 5)
        const { milestones } = run
        expect(run.game.stage).toBe(4)
        expect(milestones['series-b'] ?? Infinity).toBeLessThan(130 * 60)
        expect(milestones['search-engine'] ?? Infinity).toBeLessThan(milestones['series-a'] ?? 0)
        expect(milestones.waf ?? Infinity).toBeLessThan(milestones['series-a'] ?? 0)
        const seedEra = run.margins.find((entry) => entry.stage === 2)
        expect(seedEra?.live ?? -1).toBeGreaterThan(0)
        expect(milestones['second-zone'] ?? Infinity).toBeGreaterThan(milestones['series-a'] ?? 0)
        expect(milestones.standby ?? Infinity).toBeLessThan(milestones['series-b'] ?? 0)
        expect(run.game.apdex).toBeGreaterThan(0.9)
        const budget = budgetOf(run.game)
        await annotate(
          `Seed at ${minutes(milestones.seed)} min, Series A at ${minutes(milestones['series-a'])}; ` +
            `Search Engine ${minutes(milestones['search-engine'])}, WAF ${minutes(milestones.waf)}, ` +
            `second server ${minutes(milestones['second-server'])}; margin at Series A entry ` +
            `${((seedEra?.live ?? 0) * 100).toFixed(0)}% live, ` +
            `${((seedEra?.design ?? 0) * 100).toFixed(0)}% at cost index 120; second zone ` +
            `${minutes(milestones['second-zone'])}, standby ${minutes(milestones.standby)}; ` +
            `Series B at ${minutes(milestones['series-b'])}; at 130 min ` +
            `${Math.round(run.game.users)} users, availability ${(budget.availability * 100).toFixed(2)}% ` +
            `against ${(budget.slo * 100).toFixed(1)}%`,
        )
      })
  },
)
