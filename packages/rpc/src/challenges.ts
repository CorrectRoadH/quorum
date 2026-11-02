import { Schema } from 'effect'
import { Rpc, RpcGroup } from 'effect/rpc'
import { ApiError } from './errors.ts'

/**
 * A Challenge result to verify. `replay` is the Simulation's versioned replay
 * string (`QRP1:`); the API Worker decodes and re-runs it, so the contract
 * carries no Simulation types.
 */
export const ChallengeSubmission = Schema.Struct({
  challengeId: Schema.String,
  simVersion: Schema.Finite,
  /** A random id the browser keeps; there are no accounts. */
  deviceId: Schema.String,
  replay: Schema.String,
})
export type ChallengeSubmission = typeof ChallengeSubmission.Type

/** One value per scoring axis. Lower is better on all three. */
export const ChallengeScores = Schema.Struct({
  cost: Schema.Finite,
  tail: Schema.Finite,
  complexity: Schema.Finite,
})
export type ChallengeScores = typeof ChallengeScores.Type

/** The server's score for a submission, and where the device's bests fall. */
export const ChallengeVerdict = Schema.Struct({
  passed: Schema.Boolean,
  /** The first target missed, when it did not pass. */
  missed: Schema.NullOr(Schema.String),
  score: ChallengeScores,
  /** The device's best per axis, once it has passed. */
  best: Schema.NullOr(ChallengeScores),
  /** Share of players each best beats, 0 to 1. Never a rank. */
  percentiles: Schema.NullOr(ChallengeScores),
})
export type ChallengeVerdict = typeof ChallengeVerdict.Type

/** Counts per bucket: one per edge (values up to it), plus one above the last edge. */
export const Histogram = Schema.Struct({
  edges: Schema.Array(Schema.Finite),
  counts: Schema.Array(Schema.Finite),
})
export type Histogram = typeof Histogram.Type

export const ChallengeKey = Schema.Struct({
  challengeId: Schema.String,
  simVersion: Schema.Finite,
})
export type ChallengeKey = typeof ChallengeKey.Type

export const ChallengeHistograms = Schema.Struct({
  challengeId: Schema.String,
  simVersion: Schema.Finite,
  players: Schema.Finite,
  cost: Histogram,
  tail: Histogram,
  complexity: Histogram,
})
export type ChallengeHistograms = typeof ChallengeHistograms.Type

export class ChallengeRpc extends RpcGroup.make(
  Rpc.make('challengeSubmit', {
    payload: ChallengeSubmission,
    success: ChallengeVerdict,
    error: ApiError,
  }),
  Rpc.make('challengeHistogramGet', {
    payload: ChallengeKey,
    success: ChallengeHistograms,
    error: ApiError,
  }),
) {}
