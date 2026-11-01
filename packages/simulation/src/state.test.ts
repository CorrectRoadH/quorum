import { Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import save from './fixtures/save-02f8200.json' with { type: 'json' }
import m3Save from './fixtures/save-v2-m3.json' with { type: 'json' }
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
    // Seed (M5): Queue, WAF and Cache options, and the files in Object Storage.
    expect(
      game.nodes.every(
        (node) =>
          node.depth === 0 &&
          !node.dlq &&
          node.paranoia === 2 &&
          !node.underAttack &&
          !node.coalesce &&
          !node.warming,
      ),
    ).toBe(true)
    expect(game.stored).toBe(0)
    // The old Analytics `sample: 1` was 10%; the rate now lives by value and decodes as 10%.
    const analytics = game.nodes.find((node) => node.type === 'analytics')
    expect(analytics?.sample).toBe(1)
    expect(analytics?.sampleRate).toBe(0.1)
    expect(game.servedKinds).toEqual(['page', 'read'])
    expect(game.alertRules).toEqual({ errors: 0.01, latency: 4, saturation: 0.9 })
    expect(game.falseAlarms.saturation).toBe(0)
    expect(game.incident?.severity).toBeGreaterThan(0)
    // The Team (M4): one monolith that already had the fixes its old behavior relied on.
    expect(game.services.map((service) => service.id)).toEqual(['monolith'])
    expect(game.services[0]?.fixes).toEqual(['eager-loading', 'session-state'])
    expect(game.teams.map((team) => team.id)).toEqual(['core'])
    expect(game.engineers).toEqual([])
    expect(game.backlog).toEqual([])
    expect(game.shipped).toEqual([])
    expect(game.autopilot).toBe(true)
    expect(game.devHours).toBe(0)
    expect(game.nodes.every((node) => node.mode === 'transaction')).toBe(true)
    // Series A (M5): zones, copies and the Autoscaler, and the error budget.
    expect(
      game.nodes.every(
        (node) =>
          node.zone === 'a' &&
          !node.standby &&
          node.replicas === 1 &&
          node.pending === 0 &&
          node.signal === 'cpu' &&
          node.minCopies === 1 &&
          node.maxCopies === 8,
      ),
    ).toBe(true)
    expect(game.incident?.zone).toBeNull()
    expect(game.budget).toEqual([])
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

  /*
   * A Garage Company saved by build 2559d8c (M3) after five sim minutes. Never
   * regenerate it: every field added to the Game or a Node after M3 needs a
   * decoding default, and this test proves the save still loads and plays.
   */
  test('a save from build 2559d8c decodes, solves, and steps', () => {
    const game = decode(m3Save)
    expect(game.stage).toBe(0)
    expect(game.time).toBe(300)
    expect(game.nodes.map((node) => node.type)).toEqual([
      'users',
      'server',
      'analytics',
      'payments',
    ])
    expect(game.history).toHaveLength(300)
    expect(game.services[0]?.migration).toBeNull()
    expect(game.teams).toHaveLength(1)
    expect(solve(game).revenue).toBeGreaterThan(0)
    expect(step(game, 1).game.time).toBe(game.time + 1)
  })
})
