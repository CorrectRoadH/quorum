import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import type { Action } from './actions.ts'
import { ERAS, type ResearchId } from './catalog.ts'
import { company, link, node } from './company.ts'
import { forceIncident, weaknessOf } from './director.ts'
import { mixOf } from './features.ts'
import { solve, solveFlow } from './solve.ts'
import type { Game, GameNode } from './state.ts'
import { step } from './step.ts'

/* The Seed Era (10 "Era 2: Seed"): search, uploads and bots, and the Components that answer them. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const SEED_RESEARCH: ReadonlyArray<ResearchId> = [
  'stripe',
  'php-fpm',
  'load-balancing',
  'full-text-search',
  'object-storage',
  'background-jobs',
  'queues',
  'cdn',
  'waf',
  'caching',
  'stampede-protection',
]

/** A flat-demand Seed board: one PHP-FPM App Server, a Database, and whatever else is asked. */
const seed = (
  users: number,
  extra: ReadonlyArray<GameNode> = [],
  links: ReadonlyArray<readonly [string, string]> = [],
  front = 'server',
): Game => ({
  ...company(7),
  sandbox: true,
  stage: 2,
  users,
  researched: SEED_RESEARCH,
  nodes: [
    node('users', 'users', 120, 280),
    node('server', 'server', 440, 280, { size: 3, runtime: 'php_fpm', workers: 24 }),
    node('database', 'database', 760, 280, { size: 3 }),
    ...extra,
  ],
  links: [link('users', front), link('server', 'database'), ...links.map(([a, b]) => link(a, b))],
})

const settle = (game: Game, seconds: number): Game => {
  let current = game
  for (let elapsed = 0; elapsed < seconds; elapsed += 1) current = step(current, 1).game
  return current
}

describe('the Seed Era', () => {
  test('raises Series A at 25,000 users, and Series A is where the build ends', () => {
    expect(ERAS[2]?.raiseAt).toBe(25_000)
    expect(ERAS[2]?.grant).toBe(80_000)
    expect(ERAS[3]?.name).toBe('Series A')
    expect(ERAS[3]?.raiseAt).toBe(Number.POSITIVE_INFINITY)
    const shares = Object.values(ERAS[2]?.mix ?? {}).reduce((sum, share) => sum + (share ?? 0), 0)
    expect(shares).toBeCloseTo(1, 9)
  })

  test('uploads arrive only once Profile photos ships', () => {
    const company: Game = { ...seed(4_000), sandbox: false }
    expect(mixOf(company).upload).toBeUndefined()
    expect(mixOf({ ...company, shipped: ['profile-photos'] }).upload).toBeGreaterThan(0)
  })
})

describe('search', () => {
  test('Postgres answers search, at ten reads of CPU each; a Search Engine takes it off the Database', () => {
    const postgres = solve(seed(4_000))
    expect(postgres.kinds.search?.success).toBeGreaterThan(0.99)
    expect(postgres.nodes.database?.out).toBeDefined()
    const engine = solve(seed(4_000, [node('search', 'search', 760, 480)], [['server', 'search']]))
    expect(engine.nodes.search?.inbound).toBeCloseTo(postgres.kinds.search?.rate ?? 0, 6)
    // Search is a tenth of the requests and about a third of the Database's work.
    expect(engine.nodes.database?.utilization).toBeLessThan(
      0.75 * (postgres.nodes.database?.utilization ?? 0),
    )
  })

  test('Search filters make each search query cost 40% more', () => {
    const base: Game = {
      ...seed(4_000, [node('search', 'search', 760, 480)], [['server', 'search']]),
      sandbox: false,
    }
    const filtered = { ...base, shipped: ['search-filters' as const] }
    const ratio =
      (solve(filtered).nodes.search?.utilization ?? 0) /
      (solve(base).nodes.search?.utilization ?? 1)
    expect(ratio).toBeCloseTo(1.4, 1)
  })
})

describe('uploads and Object Storage', () => {
  test('files land in Postgres until Object Storage is linked, and storage grows with them', () => {
    const storage = node('storage', 'storage', 760, 480)
    const inPostgres = solve(seed(6_000))
    const offloaded = solve(seed(6_000, [storage], [['server', 'storage']]))
    expect(offloaded.nodes.storage?.inbound).toBeGreaterThan(0)
    expect(offloaded.nodes.database?.utilization).toBeLessThan(
      inPostgres.nodes.database?.utilization ?? 0,
    )
    const later = settle(
      {
        ...seed(6_000, [storage], [['server', 'storage']]),
        sandbox: false,
        shipped: ['profile-photos'],
      },
      60,
    )
    expect(later.stored).toBeGreaterThan(0)
  })
})

describe('bots', () => {
  test('cost capacity, earn nothing, and never count toward Apdex or errors', () => {
    const game = seed(6_000)
    const ledger = solve(game)
    expect(ledger.kinds.bot?.rate).toBeGreaterThan(0)
    // Requests users send excludes the bots.
    const scored = Object.entries(ledger.kinds)
      .filter(([kind]) => kind !== 'bot')
      .reduce((sum, [, entry]) => sum + (entry?.rate ?? 0), 0)
    expect(ledger.demand).toBeCloseTo(scored, 6)
    const surged = forceIncident(game, ledger, 'bot-surge')
    if (!surged) throw new Error('no surge')
    const flood = solve(surged)
    expect(flood.nodes.server?.utilization).toBeGreaterThan(ledger.nodes.server?.utilization ?? 0)
    expect(flood.demand).toBeCloseTo(ledger.demand, 6)
  })

  test('paranoia 4 blocks 98% of bots and 6% of real users', () => {
    const game = seed(
      4_000,
      [node('waf', 'waf', 280, 280, { paranoia: 4 })],
      [['waf', 'server']],
      'waf',
    )
    const ledger = solve(game)
    expect(ledger.kinds.bot?.success).toBeCloseTo(0.02, 2)
    expect(ledger.errors.blocked / ledger.demand).toBeCloseTo(0.06, 2)
    const moderate = solve(ok(Actions.setParanoia(game, 'waf', 2)))
    expect(moderate.errors.blocked / moderate.demand).toBeCloseTo(0.005, 3)
  })

  test('a DDoS fails most requests without a WAF; Under attack mode saves them', () => {
    const bare = seed(4_000)
    const attacked = forceIncident(bare, solve(bare), 'ddos')
    if (!attacked) throw new Error('no attack')
    expect(solve(attacked).errorShare).toBeGreaterThan(0.5)
    const guarded = seed(
      4_000,
      [node('waf', 'waf', 280, 280, { size: 4, underAttack: true })],
      [['waf', 'server']],
      'waf',
    )
    const shielded = forceIncident(guarded, solve(guarded), 'ddos')
    if (!shielded) throw new Error('no attack')
    expect(solve(shielded).errorShare).toBeLessThan(0.05)
  })
})

describe('the CDN', () => {
  const cdn = (users: number) =>
    seed(users, [node('cdn', 'cdn', 280, 280)], [['cdn', 'server']], 'cdn')

  test('answers 70% of page views at the edge', () => {
    const direct = solve(seed(4_000))
    const edged = solve(cdn(4_000))
    expect(edged.nodes.cdn?.hitRatio).toBeCloseTo(0.7, 6)
    const pages = (ledger: typeof direct) => ledger.nodes.server?.out
    expect(pages(edged)).toBeDefined()
    expect(edged.nodes.server?.inbound).toBeLessThan(direct.nodes.server?.inbound ?? 0)
    expect(edged.kinds.page?.mean).toBeLessThan(direct.kinds.page?.mean ?? 0)
  })

  test('cuts the egress bill: edge bytes cost less than origin bytes', () => {
    const direct = solve({ ...seed(8_000), sandbox: false })
    const edged = solve({ ...cdn(8_000), sandbox: false })
    expect(direct.egress).toBeGreaterThan(0)
    expect(edged.egress).toBeLessThan(direct.egress)
  })

  test('egress is billed from Seed on, not before', () => {
    expect(solve({ ...seed(4_000), stage: 1 }).egress).toBe(0)
  })
})

describe('the Queue and the Worker', () => {
  const queued = (users: number, workers: number, dlq = false) =>
    seed(
      users,
      [
        node('storage', 'storage', 760, 480),
        node('queue', 'queue', 760, 80, { dlq }),
        ...Array.from({ length: workers }, (_, index) =>
          node(`worker${index}`, 'worker', 1000, 80 + index * 140, {
            size: 2,
            runtime: 'php_fpm',
            workers: 16,
          }),
        ),
      ],
      [
        ['server', 'storage'],
        ['server', 'queue'],
        ...Array.from({ length: workers }, (_, index): readonly [string, string] => [
          'queue',
          `worker${index}`,
        ]),
      ],
    )

  test('an offloaded upload costs the user only the enqueue, and the App Server most of its CPU', () => {
    const inline = solve(queued(6_000, 0)) // a Queue with no Worker strands the tasks
    expect(inline.kinds.upload?.success).toBe(0)
    const sync = solve(seed(6_000, [node('storage', 'storage', 760, 480)], [['server', 'storage']]))
    const async = solve(queued(6_000, 1))
    expect(async.kinds.upload?.success).toBeGreaterThan(0.99)
    expect(async.kinds.upload?.mean).toBeLessThan((sync.kinds.upload?.mean ?? 0) - 90)
    expect(async.nodes.server?.utilization).toBeLessThan(sync.nodes.server?.utilization ?? 0)
    expect(async.nodes.worker0?.inbound).toBeGreaterThan(0)
  })

  test('the backlog grows when Workers fall behind and drains when they catch up', () => {
    const behind = settle(
      {
        ...queued(6_000, 1),
        nodes: queued(6_000, 1).nodes.map((entry) =>
          entry.id === 'worker0' ? { ...entry, size: 0 } : entry,
        ),
      },
      60,
    )
    const backlog = behind.nodes.find((entry) => entry.id === 'queue')?.depth ?? 0
    expect(backlog).toBeGreaterThan(100)
    const caughtUp = settle(
      {
        ...behind,
        nodes: behind.nodes.map((entry) =>
          entry.id === 'worker0' ? { ...entry, size: 3 } : entry,
        ),
      },
      120,
    )
    expect(caughtUp.nodes.find((entry) => entry.id === 'queue')?.depth ?? 0).toBeLessThan(
      backlog / 4,
    )
  })

  test('a poison message fills the queue without a dead-letter queue, and not with one', () => {
    const depthAfterPoison = (dlq: boolean) => {
      const game = queued(6_000, 1, dlq)
      const poisoned = forceIncident(game, solve(game), 'poison')
      if (!poisoned) throw new Error('no poison')
      return settle(poisoned, 60).nodes.find((entry) => entry.id === 'queue')?.depth ?? 0
    }
    expect(depthAfterPoison(false)).toBeGreaterThan(100)
    expect(depthAfterPoison(true)).toBeLessThan(5)
  })

  test('Delete message ends the poison message', () => {
    const game = queued(6_000, 1)
    const poisoned = forceIncident(game, solve(game), 'poison')
    if (!poisoned) throw new Error('no poison')
    expect(step(ok(Actions.deleteMessage(poisoned)), 1).game.incident).toBeNull()
  })
})

describe('a Cache stampede', () => {
  const cached = (users: number, coalesce: boolean) =>
    seed(
      users,
      [node('cache', 'cache', 600, 160, { ttl: 3_600, coalesce })],
      [
        ['server', 'cache'],
        ['cache', 'database'],
      ],
    )
  const nodes = (game: Game) => ({
    ...game,
    links: game.links.filter((entry) => !(entry.from === 'server' && entry.to === 'database')),
  })

  test('a cold Cache under load stays cold without protection, and refills with it', () => {
    const coldAfter = (coalesce: boolean) => {
      const game = {
        ...nodes(cached(4_000, coalesce)),
        nodes: nodes(cached(4_000, coalesce)).nodes.map((entry) =>
          entry.id === 'database' ? { ...entry, size: 2 } : entry,
        ),
      }
      const started = forceIncident(game, solveFlow(game), 'stampede')
      if (!started) throw new Error('no stampede')
      return settle(started, 40).nodes.find((entry) => entry.id === 'cache')?.warm ?? 0
    }
    expect(coldAfter(false)).toBe(0)
    expect(coldAfter(true)).toBe(1)
  })

  test('the director only weighs Seed incidents from Seed on', () => {
    const game = { ...nodes(cached(4_000, false)), sandbox: false }
    expect(weaknessOf(game, solve(game), 'stampede')).toBeGreaterThan(0)
    const preseed = { ...game, stage: 1 }
    expect(weaknessOf(preseed, solve(preseed), 'stampede')).toBe(0)
  })
})
