import { describe, expect, test } from 'vitest'
import {
  collect,
  connect,
  drawerSize,
  newGame,
  place,
  setLanguage,
  solve,
  step,
  study,
} from './sim.ts'
import type { Game } from './state.ts'
import { RESEARCH } from './catalog.ts'

const rich = (game: Game): Game => ({ ...game, cash: 1e9, insight: 1e9 })

const ok = (result: ReturnType<typeof place>): Game => {
  if (!result.ok) throw new Error(result.reason)
  return result.game
}

/** A Game with `users` users and the given research already done. */
const withUsers = (users: number, researched: Game['researched'] = []): Game => ({
  ...rich(newGame()),
  users,
  researched: [...researched],
})

describe('the starter design', () => {
  test('answers every request while demand is under capacity', () => {
    const flow = solve(newGame())
    expect(flow.demand).toBeCloseTo(newGame().users * 0.02)
    expect(flow.quality).toBeCloseTo(1)
    expect(flow.revenue).toBeGreaterThan(0)
  })

  test('a saturated server drops the excess and slows down', () => {
    // 1,500 users send 30 rps into a 12 rps server.
    const flow = solve(withUsers(1500))
    expect(flow.nodes.server?.utilization).toBeCloseTo(30 / 12)
    expect(flow.served).toBeCloseTo(12, 0)
    expect(flow.latency).toBeGreaterThan(200)
    expect(flow.patience).toBeLessThan(1)
  })
})

describe('routing', () => {
  test('a cache in front of the database absorbs 80% of read queries', () => {
    let game = withUsers(500, ['load-balancing', 'caching'])
    game = ok(place(game, 'cache', 600, 300))
    const cache = game.nodes.at(-1)?.id ?? ''
    game = { ...game, links: game.links.filter((link) => link.to !== 'database') }
    game = ok(connect(game, 'server', cache))
    game = ok(connect(game, cache, 'database'))
    const reads = 500 * 0.02 * 0.3
    expect(solve(game).nodes.database?.inbound).toBeCloseTo(reads * 0.2)
  })

  test('a load balancer splits by capacity, not evenly', () => {
    let game = withUsers(100, ['load-balancing', 'lang-node'])
    game = ok(place(game, 'lb', 300, 300))
    const lb = game.nodes.at(-1)?.id ?? ''
    game = ok(place(game, 'server', 440, 500))
    const second = game.nodes.at(-1)?.id ?? ''
    game = ok(setLanguage(game, second, 'node'))
    game = {
      ...game,
      links: [
        { from: 'users', to: lb },
        { from: 'server', to: 'database' },
      ],
    }
    game = ok(connect(game, lb, 'server'))
    game = ok(connect(game, lb, second))
    game = ok(connect(game, second, 'database'))
    const flow = solve(game)
    const first = flow.nodes.server?.inbound ?? 0
    const other = flow.nodes[second]?.inbound ?? 0
    expect(other / first).toBeCloseTo(1.6)
  })

  test('writes fail behind a read replica but succeed behind a database', () => {
    let game = {
      ...withUsers(100, ['load-balancing', 'caching', 'pooling', 'replication']),
      stage: 1,
    }
    game = ok(place(game, 'replica', 760, 500))
    const replica = game.nodes.at(-1)?.id ?? ''
    game = { ...game, links: [{ from: 'users', to: 'server' }] }
    game = ok(connect(game, 'server', replica))
    expect(solve(game).failing).toEqual(['write'])
    game = ok(connect(game, 'server', 'database'))
    expect(solve(game).failing).toEqual([])
  })

  test('Users reach one host, and a link may not close a loop', () => {
    let game = rich(newGame())
    game = ok(place(game, 'server', 440, 500))
    const second = game.nodes.at(-1)?.id ?? ''
    expect(connect(game, 'users', second).ok).toBe(false)
    game = ok(connect(game, 'database', second))
    expect(connect(game, second, 'server').ok).toBe(false)
  })

  test('a queue keeps slow workers out of the latency users feel', () => {
    const researched: Game['researched'] = [
      'load-balancing',
      'caching',
      'cdn',
      'object-storage',
      'queues',
    ]
    const base = { ...withUsers(200, researched), stage: 4, incident: null }
    let direct = ok(place(base, 'worker', 760, 500))
    const worker = direct.nodes.at(-1)?.id ?? ''
    direct = ok(connect(direct, 'server', worker))
    let queued = ok(place(base, 'queue', 600, 500))
    const queue = queued.nodes.at(-1)?.id ?? ''
    queued = ok(place(queued, 'worker', 760, 500))
    const worker2 = queued.nodes.at(-1)?.id ?? ''
    queued = ok(connect(queued, 'server', queue))
    queued = ok(connect(queued, queue, worker2))
    expect(solve(direct).latency).toBeGreaterThan(solve(queued).latency + 20)
  })
})

describe('the stack', () => {
  test('Node.js serves 1.6× what PHP does', () => {
    const game = withUsers(100, ['lang-node'])
    const php = solve(game).nodes.server?.capacity ?? 0
    const node = solve(ok(setLanguage(game, 'server', 'node'))).nodes.server?.capacity ?? 0
    expect(node / php).toBeCloseTo(1.6)
  })

  test('a language must be researched before a server runs it', () => {
    expect(setLanguage(newGame(), 'server', 'rust').ok).toBe(false)
  })

  test('research spends Insight and respects prerequisites', () => {
    const game = { ...newGame(), insight: 100 }
    const price = RESEARCH['load-balancing'].cost
    expect(study(game, 'caching').ok).toBe(false)
    const result = study(game, 'load-balancing')
    expect(result.ok && result.game.insight).toBe(100 - price)
  })
})

describe('money', () => {
  test('revenue waits in the Payments drawer until collected, up to its size', () => {
    let game = withUsers(80)
    game = { ...game, cash: 0 }
    for (let second = 0; second < 2000; second += 1) game = step(game, 1).game
    expect(game.pending).toBeCloseTo(drawerSize(game))
    expect(collect(game).cash).toBeCloseTo(game.cash + drawerSize(game))
  })

  test('Stripe Billing pays straight into Capital', () => {
    const game = { ...withUsers(80, ['stripe']), cash: 0 }
    const after = step(game, 10).game
    expect(after.pending).toBe(0)
    expect(after.cash).toBeGreaterThan(0)
  })

  test('users grow while served well and leave while failing', () => {
    const served = step(withUsers(100), 10).game.users
    const failing = step({ ...withUsers(100), links: [] }, 10).game.users
    expect(served).toBeGreaterThan(100)
    expect(failing).toBeLessThan(100)
  })
})
