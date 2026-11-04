import { leftOf, RUNNING } from './life.ts'
import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { connect, decline, place, raise, resize, sell, study, type Action } from './actions.ts'
import { newGame, preseedGame } from './company.ts'
import { burnOf, sizeName } from './lookups.ts'
import { solve } from './solve.ts'
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
    expect(leftOf(box?.life ?? RUNNING)).toBeGreaterThan(0)
  })

  test('selling refunds half of what that copy cost to place', () => {
    let game = ok(place({ ...newGame(), cash: 1e6 }, 'database', 760, 280))
    game = ok(place(game, 'database', 760, 120))
    // The second Database cost 90 × 1.25; selling it refunds half of that.
    const sold = ok(sell(game, game.nodes.at(-1)?.id ?? ''))
    expect(sold.cash - game.cash).toBe(Math.round(Math.round(90 * 1.25) * 0.5))
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

describe('sizes', () => {
  test('a Load Balancer resize doubles its capacity and its Burn', () => {
    let game = ok(place({ ...preseedGame(), cash: 1e6 }, 'lb', 280, 200))
    const lb = game.nodes.at(-1)?.id ?? ''
    game = ok(connect({ ...game, links: [] }, 'users', lb))
    const before = solve(game).nodes[lb]?.capacity ?? 0
    const burn = burnOf(game, game.nodes.at(-1) as Game['nodes'][number])
    const bigger = ok(resize(game, lb, 1))
    const node = bigger.nodes.find((entry) => entry.id === lb)
    expect(node?.size).toBe(2)
    expect(solve(bigger).nodes[lb]?.capacity).toBeCloseTo(before * 2)
    expect(burnOf(bigger, node as Game['nodes'][number])).toBeCloseTo(burn * 2)
  })

  test('a flat Component stops at its last size', () => {
    let game = ok(place({ ...preseedGame(), cash: 1e9 }, 'lb', 280, 200))
    const lb = game.nodes.at(-1)?.id ?? ''
    for (let size = 1; size < 6; size += 1) game = ok(resize(game, lb, 1))
    expect(refusal(resize(game, lb, 1))).toBe('NotAllowed')
  })

  test('an App Server grows to metal (96 vCPU) and no further', () => {
    let game: Game = { ...newGame(), cash: 1e9 }
    while (
      sizeName(game.nodes.find((node) => node.id === 'server') as Game['nodes'][number]) !== 'metal'
    )
      game = ok(resize(game, 'server', 1))
    expect(refusal(resize(game, 'server', 1))).toBe('NotAllowed')
  })
})
