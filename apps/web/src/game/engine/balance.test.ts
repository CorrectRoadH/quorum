import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { setRuntime } from './actions.ts'
import { serverModel, type Calls } from './capacity.ts'
import { ERAS, type RequestKind } from './catalog.ts'
import { node, preseedGame } from './company.ts'
import { burnOf } from './lookups.ts'
import { solve } from './solve.ts'
import type { Game, GameNode } from './state.ts'

/*
 * 16 "Runtime balance targets". The capacity checks call the capacity model
 * directly on one reference box, General `medium` (4 vCPU): throughput is the
 * box's capacity for `read`, and dollars are its Burn. If a target fails,
 * change the design (worker RAM, overhead, the event-loop rule), not the test.
 */

const game: Game = {
  ...preseedGame(),
  researched: [...preseedGame().researched, 'opcache', 'lang-node', 'node-cluster'],
}

const box = (extra: Partial<GameNode>): GameNode =>
  node('server', 'server', 0, 0, { size: 3, family: 'general', ...extra })

const model = (
  server: GameNode,
  arriving: Readonly<Partial<Record<RequestKind, number>>>,
  callLatency: Calls,
) =>
  serverModel({
    game,
    node: server,
    arriving,
    callLatency,
    delegated: false,
    local: false,
    inflight: 0,
    boost: 1,
    sampling: 0,
    hashing: 1,
  })

/** Requests per second per dollar of Burn, for `read` with database calls of `dbMs`. */
const perDollar = (server: GameNode, dbMs: number): number =>
  model(server, { read: 1 }, { reads: dbMs, writes: dbMs, auth: 0 }).capacity / burnOf(game, server)

// PHP-FPM with OPcache and 10 workers per vCPU (plan D6), against Node.js cluster with no framework.
const php = box({ runtime: 'php_fpm', workers: 40 })
const nodeCluster = box({ runtime: 'node_cluster' })

describe('runtime balance targets', () => {
  test('Node.js cluster serves 1.5× to 2.5× the reads per dollar of PHP-FPM on a fast database', () => {
    const ratio = perDollar(nodeCluster, 3) / perDollar(php, 3)
    expect(ratio).toBeGreaterThanOrEqual(1.5)
    expect(ratio).toBeLessThanOrEqual(2.5)
  })

  test('with the database at 100 ms, Node.js cluster serves 3× to 6×: PHP workers wait', () => {
    const ratio = perDollar(nodeCluster, 100) / perDollar(php, 100)
    expect(ratio).toBeGreaterThanOrEqual(3)
    expect(ratio).toBeLessThanOrEqual(6)
  })

  // 06: added_p99 = loop_block_ms × min(1, 2ρ). The check is on the stall the event loop adds
  // with 5% login, and that the solve adds exactly that stall to the p99 of `read`.
  describe('Node.js single process with 5% login', () => {
    const single = box({ runtime: 'node' })
    const mix = ERAS[1]?.mix ?? {}
    /** Pre-seed demand that loads the single loop to `rho`. */
    const loadedTo = (rho: number) => {
      const unit = model(single, mix, { reads: 3, writes: 3, auth: 0 })
      const rate = rho / unit.utilization
      return Object.fromEntries(
        Object.entries(mix).map(([kind, share]) => [kind, (share ?? 0) * rate]),
      )
    }

    for (const rho of [0.5, 0.8])
      test(`adds 40 to 120 ms to the p99 at ρ = ${rho}`, () => {
        const stall = model(single, loadedTo(rho), { reads: 3, writes: 3, auth: 0 }).tailMs
        expect(stall).toBeGreaterThanOrEqual(40)
        expect(stall).toBeLessThanOrEqual(120)
      })

    test('the solve adds the stall to the p99 of `read`, and the libuv pool takes the login part away', () => {
      const design = (researched: Game['researched']): Game => {
        const base = { ...preseedGame(), users: 2_500, time: 6 * 60 }
        const start: Game = {
          ...base,
          researched: [...base.researched, 'lang-node', ...researched],
          nodes: base.nodes.map((entry) =>
            entry.id === 'database' ? { ...entry, size: 4 } : entry,
          ),
        }
        const switched = setRuntime(start, 'server', 'node')
        const next = Result.isSuccess(switched) ? switched.success : start
        return {
          ...next,
          nodes: next.nodes.map((entry) =>
            entry.id === 'server' ? { ...entry, down: 0, warm: 1 } : entry,
          ),
        }
      }
      const blocked = solve(design([]))
      const pooled = solve(design(['libuv-pool']))
      expect(blocked.nodes.server?.utilization ?? 0).toBeGreaterThan(0.5)
      const rise = (blocked.kinds.read?.p99 ?? 0) - (pooled.kinds.read?.p99 ?? 0)
      // Light callbacks still block about 4 ms with the pool, so the rise is the login part.
      expect(rise).toBeGreaterThan(35)
      expect(rise).toBeLessThan(120)
    })
  })

  test.todo('Java cold against warm throughput: 30% at start, 100% after 30 s (M5: Java)')
  test.todo('Rust against Go, server cost for the same load: 25% to 40% lower (M5: Rust, Go)')
  test.todo('Rust against Go, Dev Hours for the same feature set: 50% to 70% higher (M4, M5)')
  test.todo('Elixir against Node.js, `rt` connections per GB: 3× to 5× (M5: Elixir, `rt`)')
  test.todo('Rails against Go, Dev Hours for the same feature set: 35% to 50% lower (M4, M5)')
})
