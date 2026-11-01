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
    // Fields added since: each decodes to its default.
    expect(game.links.every((link) => link.timeout === 30 && link.retries === 'none')).toBe(true)
    expect(game.links.every((link) => link.kinds === null)).toBe(true)
    expect(game.nodes.every((node) => node.policy === 'weighted' && node.checkEvery === 10)).toBe(
      true,
    )
    expect(game.nodes.every((node) => node.engine === 'redis' && node.ttl === 300)).toBe(true)
    // The old Analytics `sample: 1` was 10%; the rate now lives by value and decodes as 10%.
    const analytics = game.nodes.find((node) => node.type === 'analytics')
    expect(analytics?.sample).toBe(1)
    expect(analytics?.sampleRate).toBe(0.1)
    expect(game.servedKinds).toEqual(['page', 'read'])
    expect(game.alertRules).toEqual({ errors: 0.01, latency: 4, saturation: 0.9 })
    expect(game.falseAlarms.saturation).toBe(0)
    expect(game.incident?.severity).toBeGreaterThan(0)
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
