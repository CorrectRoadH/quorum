import { Result, Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import { replace, restart, sell } from './actions.ts'
import { preseedGame } from './company.ts'
import { isDown, leftOf, warmOf } from './life.ts'
import { step } from './step.ts'
import { Game, type GameNode } from './state.ts'

/* ==========================================================================
   A Node's lifecycle: the states, the transitions, and the save form that
   still reads a Company from before the machine.
   ========================================================================== */

const ok = <A>(result: Result.Result<A, unknown>): A => {
  if (Result.isFailure(result)) throw new Error('Expected a success.')
  return result.success
}

const server = (game: Game): GameNode => {
  const node = game.nodes.find((entry) => entry.id === 'server')
  if (!node) throw new Error('The starting box is missing.')
  return node
}

const run = (game: Game, seconds: number): Game => {
  let next = game
  for (let left = seconds; left > 0; left -= 0.1) next = step(next, Math.min(0.1, left)).game
  return next
}

describe('a Node lifecycle', () => {
  test('a restart counts down, then warms up, then runs', () => {
    const restarted = ok(restart(preseedGame(), 'server'))
    const life = server(restarted).life
    expect(life._tag).toBe('Restarting')
    expect(leftOf(life)).toBeGreaterThan(0)
    expect(isDown(server(restarted).life)).toBe(true)

    const back = run(restarted, 1)
    expect(isDown(server(back).life)).toBe(false)

    const warm = server(run(back, 60))
    expect(warm.life._tag).toBe('Running')
    expect(warmOf(warm.life)).toBe(1)
  })

  test('a failed Node waits for a replacement, and a running one refuses one', () => {
    expect(Result.isFailure(replace(preseedGame(), 'server'))).toBe(true)
  })

  test('the save derives the state from an old save, and writes the state back', () => {
    const game = preseedGame()
    const encoded = Schema.encodeSync(Game)(game)
    const old = {
      ...encoded,
      nodes: encoded.nodes.map((node) => {
        if (node.id !== 'server') return node
        const legacy = { ...node }
        delete legacy.life
        return { ...legacy, down: -1, downCause: 'failure' as const, warm: 1 }
      }),
    }
    const decoded = Schema.decodeSync(Game)(old)
    expect(server(decoded).life).toEqual({ _tag: 'Stopped', cause: 'failure', warm: 1 })
    expect(isDown(server(decoded).life)).toBe(true)

    const saved = Schema.encodeSync(Game)(decoded).nodes.find((node) => node.id === 'server')
    expect(saved?.life).toEqual({ _tag: 'Stopped', cause: 'failure', warm: 1 })
    expect(saved && 'down' in saved).toBe(false)
  })

  test('a sold Node leaves the board, so no state is left behind', () => {
    const game = ok(sell(preseedGame(), 'analytics'))
    expect(game.nodes.some((node) => node.id === 'analytics')).toBe(false)
  })
})
