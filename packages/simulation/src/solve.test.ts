import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  connect,
  disconnect,
  place,
  setFamily,
  setHealthCheck,
  setLinkKinds,
  setLinkPolicy,
  setPolicy,
  setTtl,
  setRuntime,
  setWorkers,
  type Action,
} from './actions.ts'
import { newGame, preseedGame } from './company.ts'
import { serverModel } from './capacity.ts'
import { BACKEND_KINDS, REQUEST_KINDS, type Kind } from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { restarted } from './lookups.ts'
import { hitRatioOf } from './rules.ts'
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

/** Pre-seed with a split database and Password login shipped, at the given users and research. */
const preseed = (users: number, researched: Game['researched'] = []): Game => ({
  ...rich(preseedGame()),
  shipped: ['password-login'],
  users,
  researched: [...preseedGame().researched, ...researched],
})

describe('operation traffic', () => {
  const reconciles = (ledger: Ledger) => {
    for (const node of Object.values(ledger.nodes))
      expect(Object.values(node.traffic).reduce((total, rate) => total + rate, 0)).toBeCloseTo(
        node.inbound,
        8,
      )
    for (const link of ledger.links)
      expect(Object.values(link.traffic).reduce((total, rate) => total + rate, 0)).toBeCloseTo(
        link.rate,
        8,
      )
  }

  test('keeps asymmetric incoming reads and writes distinct from transformed backend calls', () => {
    const ledger = solve(preseed(100))
    const server = ledger.nodes.server
    const database = ledger.nodes.database
    if (!server || !database) throw new Error('Missing server or database ledger')
    for (const kind of REQUEST_KINDS)
      expect(server.traffic[kind] ?? 0).toBeCloseTo(ledger.kinds[kind]?.rate ?? 0, 8)
    expect(server.traffic.read ?? 0).toBeGreaterThan(server.traffic.write ?? 0)
    expect(server.traffic.write ?? 0).toBeGreaterThan(0)
    expect(server.traffic['q-read']).toBeUndefined()
    expect(server.out.page).toBeUndefined()
    expect(server.out['q-read'] ?? 0).toBeGreaterThan(server.traffic.read ?? 0)
    expect(database.traffic).toEqual(server.out)
    expect(database.traffic['q-read'] ?? 0).toBeGreaterThan(database.traffic['q-write'] ?? 0)
    expect(database.traffic.page).toBeUndefined()
    expect(database.out).toEqual({})
    expect(ledger.links.find((link) => link.from === 'users')?.traffic).toEqual(server.traffic)
    expect(ledger.links.find((link) => link.to === 'database')?.traffic).toEqual(database.traffic)
    expect(ledger.nodes.payments?.traffic).toEqual({})
    reconciles(ledger)
  })

  test('reports offered arrivals at an overloaded server, not only the calls it can send', () => {
    const game = tune(preseed(100_000), 'server', { credits: 0 })
    const ledger = solve(game)
    const server = ledger.nodes.server
    if (!server) throw new Error('Missing server ledger')
    expect(server.dropped).toBeGreaterThan(0)
    expect(server.inbound).toBeGreaterThan(server.capacity)
    expect(server.traffic.read).toBeCloseTo(ledger.kinds.read?.rate ?? 0, 8)
    expect(server.traffic.write).toBeCloseTo(ledger.kinds.write?.rate ?? 0, 8)
    expect(ledger.links.find((link) => link.from === 'users')?.traffic).toEqual(server.traffic)
    expect(server.traffic['q-write']).toBeUndefined()
    expect(server.out['q-write'] ?? 0).toBeLessThan(server.traffic.write ?? 0)
    reconciles(ledger)
  })

  test('attributes Analytics samples to source operations while preserving tap volume semantics', () => {
    let game = tune(preseed(100_000), 'server', { credits: 0 })
    game = tune(game, 'analytics', { sampleRate: 0.5, size: 0 })
    game = ok(connect(game, 'database', 'analytics'))
    for (const down of [0, -1]) {
      const ledger = solve(tune(game, 'analytics', { down }))
      const tap = ledger.nodes.analytics
      if (!tap) throw new Error('Missing Analytics ledger')
      expect(tap.inbound).toBeGreaterThan(tap.capacity)
      const expected: Partial<Record<Kind, number>> = {}
      for (const id of ['server', 'database']) {
        const source = ledger.nodes[id]
        if (!source) throw new Error('Missing sample source')
        const processed = source.inbound - source.dropped
        const link = ledger.links.find((entry) => entry.from === id && entry.to === 'analytics')
        expect(link?.rate).toBeCloseTo(processed * 0.15, 8)
        for (const kind of [...REQUEST_KINDS, ...BACKEND_KINDS]) {
          const done = ((source.traffic[kind] ?? 0) * processed) / source.inbound
          expected[kind] = (expected[kind] ?? 0) + done * 0.5
          expect(link?.traffic[kind] ?? 0).toBeCloseTo(done * 0.15, 8)
        }
      }
      for (const kind of [...REQUEST_KINDS, ...BACKEND_KINDS])
        expect(tap.traffic[kind] ?? 0).toBeCloseTo(expected[kind] ?? 0, 8)
      expect(tap.traffic.read ?? 0).toBeGreaterThan(0)
      expect(tap.traffic['q-read'] ?? 0).toBeGreaterThan(0)
      reconciles(ledger)
    }
  })
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
    const parents = ledger.links.filter((link) => link.to === 'database')
    expect(parents).toHaveLength(2)
    for (const kind of ['q-read', 'q-write'] as const) {
      expect(parents.every((link) => (link.traffic[kind] ?? 0) > 0)).toBe(true)
      expect(database?.traffic[kind]).toBeCloseTo(
        parents.reduce((total, link) => total + (link.traffic[kind] ?? 0), 0),
        8,
      )
    }
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
      callLatency: { 'q-read': 3, 'q-write': 3, auth: 0 },
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

describe('the wire', () => {
  test('connection reuse takes 1 ms off each internal call', () => {
    // A read makes one query: one internal hop.
    const before = solve(preseed(1_000)).kinds.read?.mean ?? 0
    const after = solve(preseed(1_000, ['keepalive'])).kinds.read?.mean ?? 0
    expect(before - after).toBeCloseTo(1, 1)
  })

  // 80 KB at 20 Mbps is 32 ms; gzip leaves 30%, saving 22.4 ms, and its extra CPU gives a little back.
  test('gzip takes about 20 ms off a page view and costs about 10% more CPU', () => {
    const plain = preseed(1_000, ['gzip'])
    const zipped = tune(plain, 'server', { compress: true })
    const a = solve(plain)
    const b = solve(zipped)
    const saved = (a.kinds.page?.mean ?? 0) - (b.kinds.page?.mean ?? 0)
    expect(saved).toBeGreaterThan(15)
    expect(saved).toBeLessThan(22.4)
    const cpu = (ledger: typeof a) => ledger.nodes.server?.resources.cpu?.used ?? 0
    expect(cpu(b) / cpu(a)).toBeGreaterThan(1.05)
    expect(cpu(b) / cpu(a)).toBeLessThan(1.1)
  })
})

describe('timeouts and retries', () => {
  const policy = (
    game: Game,
    from: string,
    to: string,
    change: Parameters<typeof setLinkPolicy>[3],
  ) => ok(setLinkPolicy(game, from, to, change))

  // A database on half a vCPU, far past saturation, behind a PHP-FPM pool big enough not to be
  // the limit, and no bigger than max_connections.
  const saturated = (timeout: number): Game => {
    const game = tune(tune(preseed(2_000, ['timeouts']), 'database', { size: 0 }), 'server', {
      workers: 100,
      size: 4,
    })
    return policy(game, 'server', 'database', { timeout })
  }

  test('a 1 s timeout fails slow queries as timeouts and frees PHP-FPM workers', () => {
    const patient = solve(saturated(30))
    const impatient = solve(saturated(1))
    expect(patient.errors.timeout).toBeCloseTo(0)
    expect(impatient.errors.timeout).toBeGreaterThan(0)
    const busy = (ledger: typeof patient) => ledger.nodes.server?.resources.slots?.used ?? 0
    expect(busy(impatient)).toBeLessThan(busy(patient) * 0.7)
  })

  test('naive retries at a 50% failure share nearly double what the callee receives', () => {
    // 200 PHP-FPM connections against max_connections 100: half the queries are refused.
    const base = tune(preseed(1_000, ['timeouts']), 'server', { workers: 200, size: 4 })
    const plain = solve(base)
    expect(plain.nodes.database?.connections?.used).toBe(200)
    const retrying = solve(policy(base, 'server', 'database', { retries: 'naive' }))
    const ratio = (retrying.nodes.database?.inbound ?? 0) / (plain.nodes.database?.inbound ?? 1)
    expect(ratio).toBeGreaterThan(1.825)
    expect(ratio).toBeLessThan(1.925)
    // Retries trade load for answers: 1 − 0.5⁴ of queries get through.
    expect(retrying.errors.refused).toBeLessThan(plain.errors.refused)
  })

  test('the policy is locked until Timeouts and retries', () => {
    expect(
      Result.isFailure(setLinkPolicy(preseed(1_000), 'server', 'database', { timeout: 1 })),
    ).toBe(true)
  })
})

describe('PHP-FPM process managers', () => {
  // 200 workers on a medium box: far more than its RAM holds once they are all resident.
  const oversized = (pm: GameNode['pm']) =>
    solve(tune(preseed(1_000), 'server', { workers: 200, size: 2, pm })).nodes.server

  test('ondemand stops an oversized pool swapping, at the price of tail latency', () => {
    expect(oversized('static')?.swapping).toBe(true)
    expect(oversized('ondemand')?.swapping).toBe(false)
    expect(oversized('dynamic')?.swapping).toBe(false)
    const p99 = (pm: GameNode['pm']) =>
      solve(tune(preseed(1_000), 'server', { workers: 16, size: 2, pm })).kinds.page?.p99 ?? 0
    expect(p99('ondemand')).toBeGreaterThan(p99('dynamic'))
    expect(p99('dynamic')).toBeGreaterThan(p99('static'))
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

  const cached = (users: number, change: Partial<GameNode> = {}) => {
    let game = preseed(users, ['caching'])
    game = ok(place(game, 'cache', 600, 160))
    const cache = last(game)
    game = tune(game, cache, { warm: 1, ...change })
    game = disconnect(game, 'server', 'database')
    game = ok(connect(game, 'server', cache))
    game = ok(connect(game, cache, 'database'))
    return { game, cache }
  }

  test('a Cache hits more as it grows, until the hot data fits', () => {
    // 20,000 users keep 4 GB hot: 1 GB holds sqrt(1/4) of it, 4 GB all of it.
    const hit = (size: number) => {
      const { game, cache } = cached(20_000, { size })
      return solve(game).nodes[cache]?.hitRatio ?? 0
    }
    expect(hit(2)).toBeGreaterThan(hit(1))
    expect(hit(3)).toBeGreaterThan(hit(2))
    expect(hit(3)).toBeCloseTo(hit(4))
    // Writes invalidate: a 20% write share costs 40% of the hits.
    const { game, cache } = cached(20_000, { size: 3 })
    const node = game.nodes.find((entry) => entry.id === cache) as GameNode
    expect(hitRatioOf(game, node, 0.2)).toBeCloseTo(hitRatioOf(game, node, 0) * 0.6)
  })

  test('Memcached uses every core: it outruns Redis from size 4', () => {
    const capacity = (engine: GameNode['engine'], size: number) => {
      const { game, cache } = cached(1_500, { engine, size })
      return solve(game).nodes[cache]?.capacity ?? 0
    }
    expect(capacity('memcached', 3)).toBeCloseTo(capacity('redis', 3))
    expect(capacity('memcached', 4)).toBeGreaterThan(capacity('redis', 4) * 1.9)
  })

  test('a 1 h TTL hits more and serves more stale reads', () => {
    const run = (ttl: number) => {
      const { game, cache } = cached(1_500)
      const ledger = solve(ok(setTtl(game, cache, ttl)))
      return { hit: ledger.nodes[cache]?.hitRatio ?? 0, stale: ledger.errors.stale }
    }
    expect(run(3_600).hit).toBeGreaterThan(run(60).hit)
    expect(run(3_600).stale).toBeGreaterThan(run(60).stale)
    expect(run(60).hit).toBeGreaterThan(run(10).hit)
  })

  test('Redis comes back half warm from a restart; Memcached comes back empty', () => {
    const { game, cache } = cached(1_500)
    const node = game.nodes.find((entry) => entry.id === cache) as GameNode
    expect(restarted(node).warm).toBe(0.5)
    expect(restarted({ ...node, engine: 'memcached' }).warm).toBe(0)
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
    // Lag is 20 ms plus 2 ms per write per second, and grows with the write rate.
    const lag = ledger.nodes[replica]?.lag ?? 0
    expect(lag).toBeGreaterThan(20)
    expect(solve({ ...game, users: 3_000 }).nodes[replica]?.lag ?? 0).toBeGreaterThan(lag)
  })
})

describe('Load Balancer policies and health checks', () => {
  // A big and a small App Server behind one Load Balancer, on a Database that stays out of the way.
  const pair = (users: number, researched: Game['researched'] = []) => {
    let game = tune(
      tune(preseed(users, researched), 'server', { size: 4, workers: 64, warm: 1 }),
      'database',
      {
        size: 5,
      },
    )
    game = ok(place(game, 'server', 440, 120))
    const small = last(game)
    game = tune(game, small, { warm: 1, size: 1, runtime: 'php_fpm', workers: 8 })
    game = ok(connect(game, small, 'database'))
    game = ok(place(game, 'lb', 280, 200))
    const lb = last(game)
    game = disconnect(game, 'users', 'server')
    game = ok(connect(game, 'users', lb))
    game = ok(connect(game, lb, 'server'))
    game = ok(connect(game, lb, small))
    return { game, lb, small }
  }

  test('round robin overloads the smaller server; weighted and least connections do not', () => {
    const { game, lb, small } = pair(5_000, ['lb-algorithms'])
    const busiest = (policy: GameNode['policy']) => {
      const ledger = solve(ok(setPolicy(game, lb, policy)))
      return Math.max(ledger.nodes.server?.utilization ?? 0, ledger.nodes[small]?.utilization ?? 0)
    }
    expect(busiest('round-robin')).toBeGreaterThan(1)
    expect(busiest('weighted')).toBeLessThan(0.5)
    expect(busiest('least-conn')).toBeLessThan(0.5)
    expect(busiest('p2c')).toBeLessThan(0.5)
  })

  test('least connections and two choices need research', () => {
    const { game, lb } = pair(1_000)
    expect(Result.isFailure(setPolicy(game, lb, 'least-conn'))).toBe(true)
    expect(Result.isSuccess(setPolicy(game, lb, 'round-robin'))).toBe(true)
  })

  test('a dead server keeps half the traffic until the next health check', () => {
    const { game, lb, small } = pair(1_000)
    const equal = ok(setPolicy(tune(game, small, { size: 4, workers: 64 }), lb, 'round-robin'))
    const dead = tune(equal, small, { down: -1, downCause: 'failure', downAt: equal.time })
    const at = (seconds: number) => {
      const ledger = solve({ ...dead, time: dead.time + seconds })
      return ledger.errors.down / ledger.demand
    }
    expect(at(5)).toBeCloseTo(0.5, 2)
    expect(at(10)).toBeCloseTo(0)
  })

  test('a 2 s health check needs research, and notices sooner', () => {
    const { game, lb, small } = pair(1_000, ['health-checks'])
    expect(Result.isFailure(setHealthCheck(pair(1_000).game, lb, { checkEvery: 2 }))).toBe(true)
    const quick = ok(setHealthCheck(game, lb, { checkEvery: 2 }))
    const dead = tune(quick, small, { down: -1, downCause: 'failure', downAt: quick.time })
    expect(solve({ ...dead, time: dead.time + 3 }).errors.down).toBeCloseTo(0)
  })

  test('a deep check takes every server out when the database is overloaded', () => {
    const { game, lb } = pair(3_000, ['health-checks'])
    const slow = tune(game, 'database', { size: 0 })
    const shallow = solve(slow)
    const deep = solve(ok(setHealthCheck(slow, lb, { deepCheck: true })))
    expect(shallow.errorShare).toBeLessThan(0.9)
    expect(deep.errorShare).toBeCloseTo(1)
    expect(deep.nodes.database?.inbound ?? 0).toBeCloseTo(0)
  })

  test('a Load Balancer Link with kinds carries only those kinds', () => {
    const { game, lb, small } = pair(1_000)
    const split = ok(
      setLinkKinds(ok(setLinkKinds(game, lb, small, ['login'])), lb, 'server', [
        'page',
        'read',
        'write',
      ]),
    )
    const ledger = solve(split)
    const carried = ledger.links.find((entry) => entry.from === lb && entry.to === small)
    expect(carried?.kind).toBe('login')
    expect(carried?.rate ?? 0).toBeCloseTo(ledger.kinds.login?.rate ?? 0)
    expect(carried?.traffic).toEqual({ login: ledger.kinds.login?.rate })
    expect(ledger.nodes[small]?.traffic).toEqual(carried?.traffic)
    const other = ledger.links.find((entry) => entry.from === lb && entry.to === 'server')
    expect(other?.traffic.login).toBeUndefined()
    for (const kind of ['page', 'read', 'write'] as const)
      expect(other?.traffic[kind]).toBeCloseTo(ledger.kinds[kind]?.rate ?? 0, 8)
    expect(ledger.kinds.login?.success).toBeCloseTo(1)
    expect(ledger.kinds.page?.success).toBeCloseTo(1)
  })
})

describe('DNS TTL', () => {
  const dns = () => {
    let game = preseed(1_500, ['dns-rr', 'health-checks'])
    game = ok(place(game, 'server', 440, 120))
    const second = last(game)
    game = tune(game, second, { warm: 1, size: 2, runtime: 'php_fpm', workers: 16 })
    game = ok(connect(game, second, 'database'))
    game = ok(place(game, 'dns', 280, 200))
    const edge = last(game)
    game = disconnect(game, 'users', 'server')
    game = ok(connect(game, 'users', edge))
    game = ok(connect(game, edge, 'server'))
    game = ok(connect(game, edge, second))
    game = ok(setTtl(game, edge, 30))
    return tune(game, second, { down: -1, downCause: 'failure', downAt: game.time })
  }

  test('with health checks, a dead host leaves DNS once its TTL runs out', () => {
    const game = dns()
    const down = (seconds: number) => {
      const ledger = solve({ ...game, time: game.time + seconds })
      return ledger.errors.down / ledger.demand
    }
    expect(down(20)).toBeCloseTo(0.5, 1)
    expect(down(30)).toBeCloseTo(0)
  })

  test('the TTL needs Health checks', () => {
    let game = preseed(1_500, ['dns-rr'])
    game = ok(place(game, 'dns', 280, 200))
    expect(Result.isFailure(setTtl(game, last(game), 30))).toBe(true)
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
