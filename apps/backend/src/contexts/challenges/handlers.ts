import { Cause, Clock, Effect, ErrorReporter, Result } from 'effect'
import { ApiError, ChallengeRpc, type ChallengeScores } from '@quorum/rpc'
import {
  type ScoreAxis,
  MAX_REPLAY_CHARS,
  SIM_VERSION,
  challengeById,
  decodeReplay,
  runChallenge,
} from '@quorum/simulation'
import { ResultStore, StoreError, type Board } from './store.ts'

/* Challenge verification (14 "Rules"): the server re-runs every submitted replay and keeps its own score. */

const DAY_MS = 86_400_000

const unavailable = () => new ApiError({ message: 'Results are unavailable. Try again later.' })

/** A store failure reaches the client as "unavailable"; its cause goes to the Worker log and the error reporters. */
const storeUnavailable = <A, E, R>(effect: Effect.Effect<A, E | StoreError, R>) =>
  effect.pipe(
    Effect.tapError((error) =>
      error instanceof StoreError
        ? Effect.logError('ResultStore failed', error.cause).pipe(
            Effect.andThen(ErrorReporter.report(Cause.fail(error))),
          )
        : Effect.void,
    ),
    Effect.catchTag('StoreError', () => Effect.fail(unavailable())),
  )

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
          yield* Effect.annotateCurrentSpan({
            'challenge.id': challenge.id,
            'challenge.replay_chars': submission.replay.length,
            'sim.version': SIM_VERSION,
          })
          const replay = yield* Effect.sync(() => decodeReplay(submission.replay)).pipe(
            Effect.withSpan('challenge.decode'),
          )
          if (Result.isFailure(replay)) return yield* fail(replay.failure)
          // The Simulation scores the replay; nothing the client claims about its result is read.
          // A Worker's clock stands still until I/O, so this span's duration reads zero: its
          // attributes carry the outcome, and the Worker's CPU time carries the cost.
          const result = yield* Effect.sync(() => runChallenge(challenge, replay.success)).pipe(
            Effect.withSpan('challenge.replay'),
          )
          if (Result.isFailure(result)) return yield* fail(result.failure)
          yield* Effect.annotateCurrentSpan({
            'challenge.passed': result.success.passed,
            'challenge.missed': result.success.missed ?? 'none',
          })
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
        }).pipe(storeUnavailable),
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
        }).pipe(storeUnavailable),
    })
  }),
)
