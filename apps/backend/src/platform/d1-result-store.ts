import { Effect } from 'effect'
import type { ChallengeScores } from '@template/rpc'
import {
  StoreError,
  type Axis,
  type Board,
  type Counts,
  type Edges,
  type ResultStore,
} from '../contexts/challenges/store.ts'

/**
 * The part of a D1 database the store uses. `D1Database` satisfies it, and so
 * does a `node:sqlite` shim in tests, so both run the same SQL.
 */
export interface SqlStatement {
  bind(...values: Array<unknown>): SqlStatement
  all<T = Record<string, unknown>>(): Promise<{ results: Array<T> }>
}
export interface SqlRunner {
  prepare(query: string): SqlStatement
}

const AXES: ReadonlyArray<Axis> = ['cost', 'tail', 'complexity']

const query = <T>(db: SqlRunner, sql: string, values: Array<unknown>) =>
  Effect.tryPromise({
    try: () =>
      db
        .prepare(sql)
        .bind(...values)
        .all<T>(),
    catch: (cause) => new StoreError({ cause }),
  }).pipe(Effect.map((result) => result.results))

const BEST = `SELECT cost, tail, complexity FROM results
  WHERE challenge_id = ? AND sim_version = ? AND device_id = ?`

// SQLite evaluates every SET expression against the row before the update.
const RECORD = `INSERT INTO results (challenge_id, sim_version, device_id, cost, tail, complexity,
    cost_replay, tail_replay, complexity_replay, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (challenge_id, sim_version, device_id) DO UPDATE SET
    cost_replay = CASE WHEN excluded.cost < results.cost THEN excluded.cost_replay ELSE results.cost_replay END,
    tail_replay = CASE WHEN excluded.tail < results.tail THEN excluded.tail_replay ELSE results.tail_replay END,
    complexity_replay = CASE WHEN excluded.complexity < results.complexity
      THEN excluded.complexity_replay ELSE results.complexity_replay END,
    cost = MIN(results.cost, excluded.cost),
    tail = MIN(results.tail, excluded.tail),
    complexity = MIN(results.complexity, excluded.complexity),
    updated_at = excluded.updated_at
  RETURNING cost, tail, complexity`

const PERCENTILES = `SELECT COUNT(*) AS players,
    SUM(CASE WHEN cost > ? THEN 1 ELSE 0 END) AS cost,
    SUM(CASE WHEN tail > ? THEN 1 ELSE 0 END) AS tail,
    SUM(CASE WHEN complexity > ? THEN 1 ELSE 0 END) AS complexity
  FROM results WHERE challenge_id = ? AND sim_version = ?`

/** Buckets one axis by the Challenge's edges: bucket i holds values up to edge i. */
const bucketSql = (axis: Axis, edges: ReadonlyArray<number>): string =>
  `SELECT CASE ${edges.map((_, index) => `WHEN ${axis} <= ? THEN ${index}`).join(' ')}
    ELSE ${edges.length} END AS bucket, COUNT(*) AS n
  FROM results WHERE challenge_id = ? AND sim_version = ? GROUP BY bucket`

type Scores = Readonly<ChallengeScores>

export const d1ResultStore = (db: SqlRunner): ResultStore['Service'] => ({
  best: (board: Board, deviceId: string) =>
    query<Scores>(db, BEST, [board.challengeId, board.simVersion, deviceId]).pipe(
      Effect.map((rows) => rows[0] ?? null),
    ),
  record: (board, deviceId, score, replay, at) =>
    query<Scores>(db, RECORD, [
      board.challengeId,
      board.simVersion,
      deviceId,
      score.cost,
      score.tail,
      score.complexity,
      replay,
      replay,
      replay,
      at,
    ]).pipe(
      Effect.flatMap((rows) =>
        rows[0] ? Effect.succeed(rows[0]) : Effect.fail(new StoreError({ cause: 'no row' })),
      ),
    ),
  percentiles: (board, best) =>
    query<Readonly<{ players: number } & Scores>>(db, PERCENTILES, [
      best.cost,
      best.tail,
      best.complexity,
      board.challengeId,
      board.simVersion,
    ]).pipe(
      Effect.map((rows) => {
        const row = rows[0]
        const players = row?.players ?? 0
        const share = (count: number | null | undefined) =>
          players > 0 ? (count ?? 0) / players : 0
        return {
          cost: share(row?.cost),
          tail: share(row?.tail),
          complexity: share(row?.complexity),
        }
      }),
    ),
  histogram: (board: Board, edges: Edges) =>
    Effect.gen(function* () {
      const counts: Record<Axis, Array<number>> = { cost: [], tail: [], complexity: [] }
      let players = 0
      for (const axis of AXES) {
        const rows = yield* query<Readonly<{ bucket: number; n: number }>>(
          db,
          bucketSql(axis, edges[axis]),
          [...edges[axis], board.challengeId, board.simVersion],
        )
        counts[axis] = Array.from({ length: edges[axis].length + 1 }, () => 0)
        for (const row of rows) counts[axis][row.bucket] = row.n
        players = counts[axis].reduce((sum, n) => sum + n, 0)
      }
      return { players, ...counts } satisfies Counts
    }),
})
