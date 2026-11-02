import { readFileSync } from 'node:fs'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import type { SqlRunner, SqlStatement } from './d1-result-store.ts'

/**
 * An in-memory SQLite database with the D1 migrations applied, behind the same
 * `SqlRunner` shape as D1, so tests run the SQL the API Worker runs.
 */
export const sqliteRunner = (): SqlRunner => {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync(new URL('../../migrations/0001_results.sql', import.meta.url), 'utf8'))
  const statement = (query: string, values: Array<unknown>): SqlStatement => ({
    bind: (...next) => statement(query, next),
    all: <T>() =>
      Promise.resolve({
        results: db.prepare(query).all(...(values as Array<SQLInputValue>)) as Array<T>,
      }),
  })
  return { prepare: (query) => statement(query, []) }
}
