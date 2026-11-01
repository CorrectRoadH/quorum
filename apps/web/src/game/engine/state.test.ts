import { Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import save from './fixtures/save-02f8200.json' with { type: 'json' }
import { sizeName } from './lookups.ts'
import { solve } from './solve.ts'
import { Game } from './state.ts'
import { step } from './step.ts'

/*
 * A Company saved by build 02f8200: Pre-seed, a Node.js box with a leak running,
 * a Load Balancer and a Cache, and one postmortem. Never regenerate it. Every
 * field added to the Game since then needs a decoding default, and this test
 * proves an old save still loads and plays.
 */

const decode = Schema.decodeUnknownSync(Game)

describe('old saves', () => {
  test('a save from build 02f8200 decodes, solves, and steps', () => {
    const game = decode(save)
    expect(game.nodes).toHaveLength(7)
    expect(game.incident?.kind).toBe('leak')
    expect(game.sandbox).toBe(false)
    expect(solve(game).revenue).toBeGreaterThan(0)
    expect(step(game, 1).game.time).toBe(game.time + 1)
  })

  test('saved size indexes keep their meaning', () => {
    const big = { ...save, nodes: save.nodes.map((node) => ({ ...node, size: 6 })) }
    const server = decode(big).nodes.find((node) => node.type === 'server')
    expect(server && sizeName(server)).toBe('2xlarge')
  })

  test('a save from before the Sandbox decodes as a Company', () => {
    const { sandbox: _, ...older } = save
    expect(decode(older).sandbox).toBe(false)
  })
})
