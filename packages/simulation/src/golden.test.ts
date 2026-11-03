import { Result, Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import { CHALLENGES, runChallenge } from './challenges.ts'
import { referenceReplay } from './fixtures/challenges.ts'
import {
  GOLDEN_HASH,
  GOLDEN_STEPS,
  REFERENCE_HASHES,
  goldenGame,
  replay,
} from './fixtures/golden.ts'
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

  test('every Challenge reference replay ends on its committed hash', { timeout: 180_000 }, () => {
    const hashes = Object.fromEntries(
      CHALLENGES.map((challenge) => {
        const result = runChallenge(challenge, referenceReplay(challenge))
        return [challenge.id, Result.isSuccess(result) ? result.success.hash : result.failure]
      }),
    )
    expect(hashes).toEqual(REFERENCE_HASHES)
  })
})
