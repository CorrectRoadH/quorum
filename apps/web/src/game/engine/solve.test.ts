import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  connect,
  disconnect,
  place,
  setFamily,
  setRuntime,
  setWorkers,
  type Action,
} from './actions.ts'
import { newGame, preseedGame } from './company.ts'
import { serverModel } from './capacity.ts'
import { cosTurns, diurnal, solve, weekly } from './solve.ts'
import type { Game, GameNode } from './state.ts'

const rich = (game: Game): Game => ({ ...game, cash: 1e9, insight: 1e9 })

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const tune = (game: Game, id: string, change: Partial<GameNode>): Game => ({
  ...game,
  nodes: game.nodes.map((node) => (node.id === id ? { ...node, ...change } : node)),
})

/** The id of the Node placed last. */
const last = (game: Game): string => game.nodes.at(-1)?.id ?? ''

/** Pre-seed with a split database, at the given users and research. */
const preseed = (users: number, researched: Game['researched'] = []): Game => ({
  ...rich(preseedGame()),
  users,
  researched: [...preseedGame().researched, ...researched],
})

describe('the daily cycle', () => {
  // The calendar starts at 14:00, and one sim second is one calendar minute.
  const at = (hour: number): number => (hour - 14) * 60

  test('peaks at 20:00 and bottoms out at 08:00', () => {
    expect(Math.abs(diurnal(at(20)) - 1.45)).toBeLessThan(1e-12)
    expect(Math.abs(diurnal(at(32)) - 0.55)).toBeLessThan(1e-12)
  })

  test('matches Math.cos at every calendar minute without calling it', () => {
    for (let minute = 0; minute < 1440; minute += 1) {
      const reference = 1 + 0.45 * Math.cos((2 * Math.PI * (minute / 60 - 20)) / 24)
      expect(Math.abs(diurnal(minute - 14 * 60) - reference)).toBeLessThan(1e-9)
    }
    for (let turns = -2; turns <= 2; turns += 0.001)
      expect(Math.abs(cosTurns(turns) - Math.cos(2 * Math.PI * turns))).toBeLessThan(1e-12)
  })

  test('weekends use the weekend factor, which is 1 until Ventures exist', () => {
    for (let day = 0; day < 14; day += 1) expect(weekly(day * 1440)).toBe(1)
  })
})

describe('the Garage box', () => {
  test('serves the starting users fast', () => {
    const ledger = solve(newGame())
    expect(ledger.errorShare).toBeCloseTo(0)
    expect(ledger.apdex).toBeGreaterThan(0.95)
    expect(ledger.revenue).toBeGreaterThan(0)
  })

  test('drops to 20% CPU when its credits run out', () => {
    const game = { ...newGame(), users: 400 }
    const fresh = solve(game).nodes.server
    const spent = solve(tune(game, 'server', { credits: 0 })).nodes.server
    expect(spent?.limit).toBe('credits')
    expect(spent?.resources.cpu?.total).toBeCloseTo(0.2)
    expect(spent?.utilization ?? 0).toBeGreaterThan((fresh?.utilization ?? 0) * 4)
  })

  test('runs out of RAM with Postgres on board, and splitting it out fixes that', () => {
    const crowded = { ...rich(newGame()), users: 900 }
    expect(solve(crowded).nodes.server?.swapping).toBe(true)
    let split = ok(place(crowded, 'database', 760, 280))
    split = ok(connect(split, 'server', last(split)))
    const server = solve(split).nodes.server
    expect(server?.swapping).toBe(false)
    expect(server?.resources.ram?.used ?? 99).toBeLessThan(1)
  })
})

describe('the latency coupling', () => {
  // A database on half a vCPU is slow at this volume. PHP-FPM holds a worker while it
  // waits; Node.js does not.
  const slowDatabase = (runtime: 'php_fpm' | 'node'): Game => {
    let game = tune(preseed(2_200, ['lang-node']), 'database', { size: 0 })
    game = ok(setRuntime(game, 'server', runtime))
    return tune(game, 'server', { warm: 1, down: 0, workers: 8, size: 3 })
  }

  test('a slow database fills PHP-FPM workers while the CPU idles', () => {
    const server = solve(slowDatabase('php_fpm')).nodes.server
    expect(server?.limit).toBe('workers')
    expect(server?.resources.cpu?.used ?? 1).toBeLessThan((server?.resources.cpu?.total ?? 0) * 0.5)
  })

  test('the same slow database only adds latency to Node.js', () => {
    const php = solve(slowDatabase('php_fpm')).nodes.server
    const node = solve(slowDatabase('node')).nodes.server
    expect(node?.limit).not.toBe('workers')
    expect(node?.utilization ?? 9).toBeLessThan(php?.utilization ?? 0)
  })
})

describe('connections', () => {
  const twoServers = (pooled: boolean): Game => {
    let game = tune(preseed(2_000, ['pooling']), 'server', { workers: 70, warm: 1 })
    game = ok(place(game, 'server', 440, 120))
    const second = last(game)
    game = tune(game, second, { runtime: 'php_fpm', workers: 70, warm: 1, size: 2 })
    game = ok(place(game, 'lb', 280, 200))
    const lb = last(game)
    game = disconnect(game, 'users', 'server')
    game = ok(connect(game, 'users', lb))
    game = ok(connect(game, lb, 'server'))
    game = ok(connect(game, lb, second))
    if (!pooled) return ok(connect(game, second, 'database'))
    game = ok(place(game, 'pooler', 600, 200))
    const pooler = last(game)
    game = disconnect(game, 'server', 'database')
    game = ok(connect(game, 'server', pooler))
    game = ok(connect(game, second, pooler))
    return ok(connect(game, pooler, 'database'))
  }

  test('two big PHP-FPM pools exhaust max_connections', () => {
    const ledger = solve(twoServers(false))
    const database = ledger.nodes.database
    expect(database?.connections?.used).toBe(140)
    expect(database?.limit).toBe('connections')
    expect(ledger.errors.refused).toBeGreaterThan(0)
  })

  test('a Connection Pooler keeps Postgres under its limit', () => {
    const ledger = solve(twoServers(true))
    expect(ledger.nodes.database?.connections?.used).toBe(20)
    expect(ledger.errors.refused).toBeCloseTo(0)
  })
})

describe('the network limit', () => {
  test('a nano box moves 0.5 Gbps: about 781 page views a second at 80 KB', () => {
    const game = preseed(1_000)
    const node = { ...(game.nodes.find((entry) => entry.id === 'server') as GameNode), size: 0 }
    const model = serverModel({
      game,
      node,
      arriving: { page: 10 },
      callLatency: { reads: 3, writes: 3, auth: 0 },
      delegated: false,
      local: false,
      inflight: 0,
      boost: 1,
      sampling: 0,
      hashing: 1,
    })
    const network = model.resources.network
    expect(network?.used).toBeCloseTo(800)
    expect((network?.total ?? 0) / 80).toBeCloseTo(781.25)
  })

  test('Garage and Pre-seed designs never hit it', () => {
    for (const game of [newGame(), preseed(5_000)])
      for (const entry of Object.values(solve(game).nodes)) expect(entry.limit).not.toBe('network')
  })
})

describe('the event loop', () => {
  // 06: added_p99 = loop_block_ms × min(1, 2ρ), so the stall shows in full from ρ = 0.5. This box
  // runs at about ρ = 0.57 at the 20:00 peak, behind a Database big enough to stay out of the way.
  const nodeServer = (researched: Game['researched']): Game => {
    const game = ok(setRuntime(preseed(2_500, ['lang-node', ...researched]), 'server', 'node'))
    return tune(tune({ ...game, time: 6 * 60 }, 'server', { warm: 1, down: 0 }), 'database', {
      size: 4,
    })
  }

  test('login hashing stalls API reads on Node.js until the libuv pool takes it', () => {
    const blocked = solve(nodeServer([])).kinds.read
    const offloaded = solve(nodeServer(['libuv-pool'])).kinds.read
    expect(blocked?.p99 ?? 0).toBeGreaterThan((offloaded?.p99 ?? 0) + 30)
    // The stall hits the slowest 2%: the p95 does not move, and the mean moves far less than the tail.
    expect((blocked?.p95 ?? 0) - (offloaded?.p95 ?? 0)).toBeLessThan(1)
    expect((blocked?.mean ?? 0) - (offloaded?.mean ?? 0)).toBeLessThan(
      ((blocked?.p99 ?? 0) - (offloaded?.p99 ?? 0)) / 2,
    )
  })

  test('a quiet loop stalls less: the stall scales with min(1, 2ρ)', () => {
    const quiet = (researched: Game['researched']) =>
      solve({ ...nodeServer(researched), users: 600 }).kinds.read?.p99 ?? 0
    const busy = (researched: Game['researched']) =>
      solve(nodeServer(researched)).kinds.read?.p99 ?? 0
    expect(quiet([]) - quiet(['libuv-pool'])).toBeLessThan((busy([]) - busy(['libuv-pool'])) * 0.5)
  })
})

describe('routing', () => {
  test('a cache answers its hit ratio of read queries', () => {
    let game = preseed(1_500, ['caching'])
    const reads = solve(game).nodes.database?.out
    const before = solve(game).nodes.database?.inbound ?? 0
    expect(reads).toEqual({})
    game = ok(place(game, 'cache', 600, 160))
    const cache = last(game)
    game = tune(game, cache, { warm: 1 })
    game = disconnect(game, 'server', 'database')
    game = ok(connect(game, 'server', cache))
    game = ok(connect(game, cache, 'database'))
    const ledger = solve(game)
    const hit = ledger.nodes[cache]?.hitRatio ?? 0
    const arriving = ledger.nodes[cache]?.inbound ?? 0
    const writes = ledger.nodes[cache]?.out['q-write'] ?? 0
    expect(hit).toBeGreaterThan(0.5)
    expect(ledger.nodes.database?.inbound ?? 0).toBeCloseTo(
      (arriving - writes) * (1 - hit) + writes,
      3,
    )
    expect(ledger.nodes.database?.inbound ?? 0).toBeLessThan(before * 0.6)
  })

  const behind = (front: 'dns' | 'lb'): Game => {
    let game = preseed(1_500, ['dns-rr'])
    game = ok(place(game, 'server', 440, 120))
    const second = last(game)
    game = tune(game, second, { warm: 1, size: 2, runtime: 'php_fpm', workers: 16 })
    game = ok(connect(game, second, 'database'))
    game = ok(place(game, front, 280, 200))
    const edge = last(game)
    game = disconnect(game, 'users', 'server')
    game = ok(connect(game, 'users', edge))
    game = ok(connect(game, edge, 'server'))
    game = ok(connect(game, edge, second))
    return tune(game, second, { down: -1 })
  }

  test('DNS keeps sending half the users to a dead host', () => {
    const ledger = solve(behind('dns'))
    expect(ledger.errors.down / ledger.demand).toBeCloseTo(0.5, 1)
  })

  test('a Load Balancer stops sending to a dead host', () => {
    expect(solve(behind('lb')).errors.down).toBeCloseTo(0)
  })

  test('a replica answers reads, and some API reads come back stale', () => {
    let game = preseed(1_500, ['replication'])
    game = ok(place(game, 'replica', 760, 120))
    const replica = last(game)
    game = tune(game, replica, { warm: 1 })
    game = ok(connect(game, 'server', replica))
    const ledger = solve(game)
    expect(ledger.nodes[replica]?.inbound ?? 0).toBeGreaterThan(0)
    expect(ledger.errors.stale).toBeGreaterThan(0)
    expect(ledger.kinds.page?.success).toBeCloseTo(1)
    expect(ledger.kinds.read?.success ?? 1).toBeLessThan(1)
  })
})

describe('the bottleneck marker', () => {
  test('marks the Node whose extra capacity earns the most', () => {
    // The box is throttled; the database next to it is idle.
    let game = rich(newGame())
    game = ok(place({ ...game, users: 700 }, 'database', 760, 280))
    game = ok(connect(game, 'server', last(game)))
    game = tune(game, 'server', { credits: 0 })
    expect(solve(game).bottleneck).toBe('server')
    const fixed = ok(setFamily(game, 'server', 'general'))
    expect(solve(tune(fixed, 'server', { down: 0, warm: 1 })).bottleneck).toBeNull()
  })

  test('raising the pool moves the limit from workers to CPU', () => {
    let game = tune(tune(preseed(3_000), 'server', { workers: 3, warm: 1 }), 'database', {
      size: 3,
    })
    expect(solve(game).nodes.server?.limit).toBe('workers')
    game = ok(setWorkers(game, 'server', 60))
    expect(solve(game).nodes.server?.limit).not.toBe('workers')
  })
})
