import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { connect, decline, place, raise, resize, study, type Action } from './actions.ts'
import { newGame } from './company.ts'
import type { Game } from './state.ts'

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const refusal = (action: Action): string =>
  Result.isFailure(action) ? action.failure._tag : 'accepted'

describe('links', () => {
  test('Users cannot reach a Database directly', () => {
    const game = ok(place({ ...newGame(), cash: 1e6 }, 'database', 760, 280))
    expect(refusal(connect(game, 'users', game.nodes.at(-1)?.id ?? ''))).toBe('NotAllowed')
  })

  test('linking the first box to a Database moves Postgres off it', () => {
    let game = ok(place({ ...newGame(), cash: 1e6 }, 'database', 760, 280))
    game = ok(connect(game, 'server', game.nodes.at(-1)?.id ?? ''))
    expect(game.nodes.find((node) => node.id === 'server')?.localDb).toBe(false)
  })
})

describe('money and research', () => {
  test('a resize spends Cash and restarts the Node, or says what it costs', () => {
    expect(refusal(resize({ ...newGame(), cash: 10 }, 'server', 1))).toBe('Unaffordable')
    const game = ok(resize(newGame(), 'server', 1))
    const box = game.nodes.find((node) => node.id === 'server')
    expect(game.cash).toBe(newGame().cash - 240)
    expect(box?.size).toBe(2)
    expect(box?.down).toBeGreaterThan(0)
  })

  test('Pre-seed research waits for Pre-seed', () => {
    expect(refusal(study({ ...newGame(), insight: 1e6 }, 'caching'))).toBe('TooEarly')
  })

  test('raising trades Equity for a grant; declining keeps both and slows growth', () => {
    const ready = { ...newGame(), users: 1_000 }
    const raised = ok(raise(ready))
    const declined = ok(decline(ready))
    expect(raised.stage).toBe(1)
    expect(raised.cash).toBe(ready.cash + 2_500)
    expect(raised.equity).toBeCloseTo(0.9)
    expect(declined.stage).toBe(1)
    expect(declined.cash).toBe(ready.cash)
    expect(declined.equity).toBe(1)
    expect(declined.declined).toBe(true)
  })
})
