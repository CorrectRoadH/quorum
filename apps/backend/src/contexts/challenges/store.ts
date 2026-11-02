import { Context, Data, type Effect } from 'effect'
import type { ChallengeScores } from '@quorum/rpc'

/** A Challenge's histogram: results only compare within one Simulation version. */
export type Board = Readonly<{ challengeId: string; simVersion: number }>

export type Axis = 'cost' | 'tail' | 'complexity'

export type Edges = Readonly<Record<Axis, ReadonlyArray<number>>>

/** Players on a board, and per axis the count in each bucket: one per edge, plus one above. */
export type Counts = Readonly<{ players: number } & Record<Axis, ReadonlyArray<number>>>

export class StoreError extends Data.TaggedError('StoreError')<{ readonly cause: unknown }> {}

/**
 * Where verified results live: each device's independent best per axis, with
 * the replay behind each best, so results can be re-verified later.
 */
export class ResultStore extends Context.Service<
  ResultStore,
  {
    readonly best: (
      board: Board,
      deviceId: string,
    ) => Effect.Effect<ChallengeScores | null, StoreError>
    /** Keeps the better of the stored and the new score on each axis, and returns the bests. */
    readonly record: (
      board: Board,
      deviceId: string,
      score: ChallengeScores,
      replay: string,
      at: number,
    ) => Effect.Effect<ChallengeScores, StoreError>
    /** Per axis, the share of players whose best is worse than `best`. */
    readonly percentiles: (
      board: Board,
      best: ChallengeScores,
    ) => Effect.Effect<ChallengeScores, StoreError>
    readonly histogram: (board: Board, edges: Edges) => Effect.Effect<Counts, StoreError>
  }
>()('quorum/backend/ResultStore') {}
