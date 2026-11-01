import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { resize, setRuntime, type Action } from './actions.ts'
import { preseedGame } from './company.ts'
import { previewOf, type Preview } from './preview.ts'
import { solveFlow } from './solve.ts'
import type { Game } from './state.ts'
import { step } from './step.ts'

/*
 * The preview against what really happens. The preview runs 10 sim seconds
 * with the changed Node already warm; the settled run pays the real restart
 * and warmup and runs 60 s. Both hold users, so growth cannot differ.
 *
 * The Pre-seed box at 4,000 users is overloaded, so a change moves revenue a
 * lot. At the Pre-seed start (1,050 users) the change barely moves revenue,
 * and 50 calendar minutes of the diurnal curve move it more than the change.
 */

const loaded = (): Game => ({
  ...preseedGame(),
  users: 4_000,
  cash: 1e6,
  researched: [...preseedGame().researched, 'lang-node', 'node-cluster'],
  nextIncidentAt: Number.MAX_SAFE_INTEGER,
})

const settled = (game: Game, seconds = 60) => {
  let current = game
  for (let elapsed = 0; elapsed < seconds; elapsed += 1)
    current = { ...step(current, 1).game, users: game.users }
  return solveFlow(current)
}

const success = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const preview = (game: Game, key: string, apply: (game: Game) => Action): Preview => {
  const result = previewOf(game, key, apply)
  if (Result.isFailure(result)) throw new Error(JSON.stringify(result.failure))
  return result.success
}

const within = (actual: number, expected: number, share: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.abs(expected) * share)

describe('the Tradeoff preview', () => {
  const cases: ReadonlyArray<readonly [string, (game: Game) => Action]> = [
    ['PHP-FPM to Node.js cluster', (game) => setRuntime(game, 'server', 'node_cluster')],
    ['a resize to medium', (game) => resize(game, 'server', 1)],
  ]

  for (const [name, apply] of cases)
    test(`${name}: the revenue delta is within 15% of the settled delta`, () => {
      const game = loaded()
      const predicted = preview(game, name, apply)
      const base = settled(game)
      const after = settled(success(apply(game)))
      const delta = after.revenue - base.revenue
      expect(Math.abs(delta)).toBeGreaterThan(1)
      within(predicted.after.revenue - predicted.before.revenue, delta, 0.15)
    })

  test('PHP-FPM to Node.js cluster: revenue and p99 within 10% of the settled values', () => {
    const game = loaded()
    const apply = (current: Game) => setRuntime(current, 'server', 'node_cluster')
    const predicted = preview(game, 'cluster', apply)
    const after = settled(success(apply(game)))
    within(predicted.after.revenue, after.revenue, 0.1)
    within(predicted.after.p99, after.p99, 0.1)
    // The restart is reported apart from the figures.
    expect(predicted.restart).toBeGreaterThan(0)
  })

  test('never changes the Game it is given', () => {
    const game = loaded()
    const copy = structuredClone(game)
    preview(game, 'resize', (current) => resize(current, 'server', 1))
    expect(game).toEqual(copy)
  })

  test('starts no incident, even when one is due', () => {
    const apply = (current: Game) => resize(current, 'server', 1)
    const due = { ...loaded(), nextIncidentAt: loaded().time }
    expect(preview(due, 'resize', apply)).toEqual(preview(loaded(), 'resize', apply))
  })

  test('answers from its cache for the same Game and option', () => {
    const game = loaded()
    const apply = (current: Game) => resize(current, 'server', 1)
    expect(previewOf(game, 'resize', apply)).toBe(previewOf(game, 'resize', apply))
  })

  test('returns the refusal of an action that cannot happen', () => {
    const locked = { ...loaded(), researched: preseedGame().researched }
    const result = previewOf(locked, 'cluster', (game) =>
      setRuntime(game, 'server', 'node_cluster'),
    )
    expect(Result.isFailure(result)).toBe(true)
  })
})
