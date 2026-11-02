import { Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import { goldenGame, replay } from './fixtures/golden.ts'
import save from './fixtures/save-v2-m3.json' with { type: 'json' }
import { hashGame } from './hash.ts'
import { Game } from './state.ts'
import { SIM_VERSION } from './version.ts'

/*
 * The golden hash (04 "Determinism and randomness"): one fixed Company replayed
 * for 10,000 Steps must end in the same Game, bit for bit. A change that moves
 * this hash changes every replay: bump SIM_VERSION and GOLDEN_HASH together,
 * and say why in the commit.
 */

const GOLDEN_STEPS = 10_000
// SIM_VERSION 2 (M4): the founder now builds Features with Dev Hours and each
// deploy rolls for a bad deploy, so the Pre-seed replay's demand and seed move.
// SIM_VERSION 3 (M5 Seed): the save gains Queue depth, Cache, Queue and WAF
// options, and stored GB. The Pre-seed replay's values are unchanged; the
// encoded Game carries the new fields, so its hash moves.
// SIM_VERSION 4 (M5 Series A): the save gains each Node's zone, standby, copies
// and Autoscaler settings, the incident's zone, and the error budget. The
// Pre-seed replay's values are unchanged; the encoded Game carries the new
// fields, so its hash moves.
// SIM_VERSION 5 (M5 Series B): the save gains each Node's GPU type, collector,
// GOGC, load shedding and read-your-writes, and each Link's breaker, open time
// and failure share. The Pre-seed replay's values are unchanged; the encoded
// Game carries the new fields, so its hash moves.
const GOLDEN_HASH = 'bf00cf54'

describe('determinism', () => {
  test(`the golden Company hashes to ${GOLDEN_HASH} after ${GOLDEN_STEPS} Steps (SIM_VERSION ${SIM_VERSION})`, () => {
    const game = replay(goldenGame(), GOLDEN_STEPS)
    // Incidents fired, so the seeded generator is in the hash too.
    expect(game.seed).not.toBe(1)
    expect(game.postmortems.length).toBeGreaterThan(0)
    expect(hashGame(game)).toBe(GOLDEN_HASH)
  }, 60_000)

  test('two replays of the same save end in the same Game', () => {
    const decode = Schema.decodeUnknownSync(Game)
    const first = replay(decode(save), 400)
    const second = replay(decode(save), 400)
    expect(hashGame(first)).toBe(hashGame(second))
    expect(hashGame(first)).not.toBe(hashGame(decode(save)))
  })
})
