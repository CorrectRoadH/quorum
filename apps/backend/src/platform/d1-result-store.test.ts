import { Effect } from 'effect'
import { expect, test } from 'vitest'
import { d1ResultStore } from './d1-result-store.ts'
import { sqliteRunner } from './sqlite-runner.ts'

const board = { challengeId: 'hello-world', simVersion: 8 }
const edges = { cost: [0.02, 0.04], tail: [100, 500], complexity: [2, 4] }

test('the D1 store keeps each axis best, and counts percentiles and buckets', async () => {
  const store = d1ResultStore(sqliteRunner())
  const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect)

  expect(await run(store.best(board, 'device-a'))).toBeNull()
  await run(store.record(board, 'device-a', { cost: 0.05, tail: 90, complexity: 3 }, 'QRP1:a1', 1))
  // A cheaper but slower result improves Cost only: each axis keeps its own best.
  const best = await run(
    store.record(board, 'device-a', { cost: 0.03, tail: 600, complexity: 3 }, 'QRP1:a2', 2),
  )
  expect(best).toEqual({ cost: 0.03, tail: 90, complexity: 3 })
  expect(await run(store.best(board, 'device-a'))).toEqual(best)

  await run(store.record(board, 'device-b', { cost: 0.05, tail: 700, complexity: 2 }, 'QRP1:b', 3))
  await run(
    store.record(
      { ...board, simVersion: 7 },
      'device-c',
      { cost: 1, tail: 1, complexity: 1 },
      'x',
      4,
    ),
  )
  expect(await run(store.percentiles(board, best))).toEqual({ cost: 0.5, tail: 0.5, complexity: 0 })

  expect(await run(store.histogram(board, edges))).toEqual({
    players: 2,
    cost: [0, 1, 1],
    tail: [1, 0, 1],
    complexity: [1, 1, 0],
  })
})
