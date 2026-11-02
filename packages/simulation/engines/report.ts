import { Result } from 'effect'
import { CHALLENGES, challengeById, runChallenge } from '../src/challenges.ts'
import { referenceReplay } from '../src/fixtures/challenges.ts'
import { GOLDEN_STEPS, goldenGame, replay } from '../src/fixtures/golden.ts'
import { hashGame } from '../src/hash.ts'

/* What every engine computes for the cross-engine golden check (04 "Determinism and randomness"). */

export const goldenHash = (): string => hashGame(replay(goldenGame(), GOLDEN_STEPS))

export const CHALLENGE_IDS: ReadonlyArray<string> = CHALLENGES.map((challenge) => challenge.id)

/** The end hash of a Challenge's reference replay, or the reason it did not run. */
export const referenceHash = (id: string): string => {
  const challenge = challengeById(id)
  if (!challenge) return `unknown ${id}`
  const result = runChallenge(challenge, referenceReplay(challenge))
  return Result.isSuccess(result) ? result.success.hash : result.failure
}
