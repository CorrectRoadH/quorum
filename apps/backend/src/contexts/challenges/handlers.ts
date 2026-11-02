import { Clock, Effect, Result } from 'effect'
import { ApiError, ChallengeRpc, type ChallengeScores } from '@quorum/rpc'
import {
  type ScoreAxis,
  MAX_REPLAY_CHARS,
  SIM_VERSION,
  challengeById,
  decodeReplay,
  runChallenge,
} from '@quorum/simulation'
import { ResultStore, type Board } from './store.ts'

/* Challenge verification (14 "Rules"): the server re-runs every submitted replay and keeps its own score. */

const DAY_MS = 86_400_000

const unavailable = () => new ApiError({ message: 'Results are unavailable. Try again later.' })

const fail = (message: string) => Effect.fail(new ApiError({ message }))

const utcDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/** A daily drill takes results for today and yesterday, in UTC. */
const drillOpen = (challengeId: string, now: number): boolean => {
  if (!challengeId.startsWith('daily:')) return true
  const date = challengeId.slice('daily:'.length)
  return date === utcDate(now) || date === utcDate(now - DAY_MS)
}

const DEVICE_ID = /^[A-Za-z0-9-]{8,64}$/

const scoresOf = (result: ChallengeScores): ChallengeScores => ({
  cost: result.cost,
  tail: result.tail,
  complexity: result.complexity,
})

export const ChallengeHandlers = ChallengeRpc.toLayer(
  Effect.gen(function* () {
    const store = yield* ResultStore
    return ChallengeRpc.of({
      challengeSubmit: (submission) =>
        Effect.gen(function* () {
          if (submission.replay.length > MAX_REPLAY_CHARS)
            return yield* fail('The replay is too long.')
          const challenge = challengeById(submission.challengeId)
          if (!challenge) return yield* fail('There is no such Challenge.')
          if (submission.simVersion !== SIM_VERSION)
            return yield* fail('Update Quorum to submit this result.')
          if (!DEVICE_ID.test(submission.deviceId))
            return yield* fail('The device id is not valid.')
          const now = yield* Clock.currentTimeMillis
          if (!drillOpen(challenge.id, now)) return yield* fail('That daily drill is closed.')
          const replay = decodeReplay(submission.replay)
          if (Result.isFailure(replay)) return yield* fail(replay.failure)
          // The Simulation scores the replay; nothing the client claims about its result is read.
          const result = runChallenge(challenge, replay.success)
          if (Result.isFailure(result)) return yield* fail(result.failure)
          const board: Board = { challengeId: challenge.id, simVersion: SIM_VERSION }
          const score = scoresOf(result.success)
          const best = result.success.passed
            ? yield* store.record(board, submission.deviceId, score, submission.replay, now)
            : yield* store.best(board, submission.deviceId)
          const percentiles = best === null ? null : yield* store.percentiles(board, best)
          return {
            passed: result.success.passed,
            missed: result.success.missed,
            score,
            best,
            percentiles,
          }
        }).pipe(Effect.catchTag('StoreError', () => Effect.fail(unavailable()))),
      challengeHistogramGet: ({ challengeId, simVersion }) =>
        Effect.gen(function* () {
          const challenge = challengeById(challengeId)
          if (!challenge) return yield* fail('There is no such Challenge.')
          if (simVersion !== SIM_VERSION) return yield* fail('Update Quorum to see these results.')
          const counts = yield* store.histogram({ challengeId, simVersion }, challenge.edges)
          const axis = (name: ScoreAxis) => ({
            edges: challenge.edges[name],
            counts: counts[name],
          })
          return {
            challengeId,
            simVersion,
            players: counts.players,
            cost: axis('cost'),
            tail: axis('tail'),
            complexity: axis('complexity'),
          }
        }).pipe(Effect.catchTag('StoreError', () => Effect.fail(unavailable()))),
    })
  }),
)
