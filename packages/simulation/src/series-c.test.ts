import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import type { Action } from './actions.ts'
import { ERAS, REGIONS, RESEARCH_IDS, rttOf, type ResearchId } from './catalog.ts'
import { company, link, node } from './company.ts'
import { forceIncident } from './director.ts'
import { churnOf } from './churn.ts'
import { checklistOf, rpoOf } from './ipo.ts'
import { QUARTER_SECONDS, advanceQuarter, firstQuarter } from './quarters.ts'
import { majorityMs } from './rules.ts'
import { regionDiurnal, regionUsers, regionalCycle } from './regions.ts'
import { diurnal, solve } from './solve.ts'
import type { Game, GameNode } from './state.ts'
import { step } from './step.ts'
import { valuationOf } from './valuation.ts'

/* M6 (10 "Era 5" to "Era 7"): regions, quorums, consensus, fan-out, the IPO and quarters. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const ALL: ReadonlyArray<ResearchId> = RESEARCH_IDS

/** A flat-demand Series C board with every Component the mix needs, all in North America. */
const seriesC = (
  users: number,
  extra: ReadonlyArray<GameNode> = [],
  links: ReadonlyArray<readonly [string, string]> = [],
  researched: ReadonlyArray<ResearchId> = ALL,
): Game => ({
  ...company(12),
  sandbox: true,
  stage: 5,
  users,
  researched,
  nodes: [
    node('users', 'users', 120, 280),
    node('server', 'server', 440, 280, { size: 5, runtime: 'go' }),
    node('database', 'database', 760, 200, { size: 6 }),
    node('storage', 'storage', 760, 360),
    node('psp', 'psp', 760, 520),
    node('llm', 'llm', 760, 680, { size: 3 }),
    node('msgp', 'msgp', 760, 820),
    ...extra,
  ],
  links: [
    link('users', 'server'),
    link('server', 'database'),
    link('server', 'storage'),
    link('server', 'psp'),
    link('server', 'llm'),
    link('server', 'msgp'),
    ...links.map(([from, to]) => link(from, to)),
  ],
})

const patchNode = (game: Game, id: string, change: Partial<GameNode>): Game => ({
  ...game,
  nodes: game.nodes.map((entry) => (entry.id === id ? { ...entry, ...change } : entry)),
})

describe('the M6 Eras', () => {
  test('Series C raises at 10M, Pre-IPO ends with the IPO at 50M, and Public is endless', () => {
    expect(ERAS.map((era) => era.name).slice(5)).toEqual(['Series C', 'Pre-IPO', 'Public'])
    expect(ERAS[5]?.raiseAt).toBe(10_000_000)
    expect(ERAS[6]?.raiseAt).toBe(50_000_000)
    expect(ERAS[7]?.raiseAt).toBe(Number.POSITIVE_INFINITY)
    expect(ERAS.map((era) => era.slo).slice(5)).toEqual([0.9995, 0.9995, 0.9999])
    for (const era of ERAS.slice(5)) {
      const mix = Object.values(era.mix).reduce((sum, share) => sum + (share ?? 0), 0)
      expect(mix).toBeCloseTo(1, 9)
    }
  })
})

describe('regions', () => {
  test('the raise into Series C keeps every user at home and seeds each far region', () => {
    const game = ok(
      Actions.raise({ ...company(12), nodes: [], links: [], stage: 4, users: 1_000_000 }),
    )
    const users = regionUsers(game)
    expect(users.na).toBeCloseTo(1_000_000, 6)
    expect(users.eu).toBeCloseTo(37_500, 6)
    expect(users.apac).toBeCloseTo(25_000, 6)
    expect(users.sa).toBeCloseTo(12_500, 6)
    expect(game.users).toBeCloseTo(1_075_000, 6)
  })

  test("the Churn breakdown splits each region's lost Apdex into the round trip, slowness, and failures", () => {
    const game: Game = { ...seriesC(20_000), sandbox: false }
    const ledger = solve(game)
    const apac = churnOf(game, ledger).find((entry) => entry.region === 'apac')
    expect(apac).toBeDefined()
    if (!apac) return
    const points = apac.rows.reduce((sum, row) => sum + row.points, 0)
    // Rows under 0.002 are left out, so the sum may fall short by a little.
    expect(points).toBeLessThanOrEqual(1 - apac.now + 1e-9)
    expect(points).toBeGreaterThan(1 - apac.now - 0.02)
    // An NA-only Design: most of what Asia-Pacific loses is the ocean, and the fix is a region.
    expect(apac.rows[0]?.cause).toBe('far')
    expect(apac.rows[0]?.fix).toEqual({ _tag: 'region', region: 'apac' })
    expect(apac.rows[0]?.needed).toBe(true)
    // North America is served at home: no round trip to win back.
    const na = churnOf(game, ledger).find((entry) => entry.region === 'na')
    expect(na?.rows.some((row) => row.cause === 'far')).toBe(false)
  })

  test('users abroad leave on their own Apdex, and the users at home keep growing', () => {
    const game: Game = {
      ...seriesC(20_000),
      sandbox: false,
      userShares: { na: 0.5, eu: 0.3, apac: 0.2, sa: 0 },
      // Blended, the Company sits under the Series C target of 0.92; only Asia-Pacific is slow.
      apdex: 0.9,
      regionApdex: { na: 0.99, eu: 0.99, apac: 0.5, sa: 0.99 },
    }
    const before = regionUsers(game)
    const after = regionUsers(step(game, 1).game)
    expect(after.na).toBeGreaterThan(before.na)
    expect(after.eu).toBeGreaterThan(before.eu)
    expect(after.apac).toBeLessThan(before.apac)
    // South America has no users yet; word of mouth from the other regions brings its first.
    expect(after.sa).toBeGreaterThan(0)
    // An NA-only Design: the users who cross the Pacific get the worst Apdex.
    const regions = solve(game).regions
    expect(regions.apac).toBeLessThan(regions.na ?? 0)
  })

  test('round trips are symmetric, and the home peak is the old daily cycle', () => {
    for (const a of REGIONS) for (const b of REGIONS) expect(rttOf(a, b)).toBe(rttOf(b, a))
    expect(rttOf('na', 'eu')).toBe(75)
    expect(rttOf('eu', 'apac')).toBe(160)
    for (let time = 0; time < 1_440; time += 37) {
      expect(regionDiurnal(time, 'na')).toBe(diurnal(time))
      // Four offset peaks flatten the world's daily cycle: follow the sun.
      expect(regionalCycle(time)).toBeGreaterThan(0.75)
      expect(regionalCycle(time)).toBeLessThan(1.25)
    }
  })

  test('far users pay two round trips to an NA-only Design: about 150 ms on average', () => {
    const extra = (game: Game) =>
      (solve(game).kinds.read?.mean ?? 0) - (solve({ ...game, stage: 4 }).kinds.read?.mean ?? 0)
    // 30% in Europe at 150 ms, 20% in Asia-Pacific at 400, 10% in South America at 240.
    const plain = extra(
      seriesC(
        20_000,
        [],
        [],
        ALL.filter((id) => id !== 'http3'),
      ),
    )
    expect(plain).toBeGreaterThan(140)
    expect(plain).toBeLessThan(160)
    // HTTP/3 takes 20% off the far users' hop.
    expect(extra(seriesC(20_000))).toBeCloseTo(plain * 0.8, 0)
  })

  test('GeoDNS sends European users to a European App Server that reads a local quorum', () => {
    const base = ok(Actions.openRegion(seriesC(20_000), 'eu'))
    const eu: Game = {
      ...base,
      nodes: [
        ...base.nodes,
        node('server-eu', 'server', 440, 280, { size: 5, runtime: 'go', region: 'eu' }),
        node('wide', 'wide', 900, 200, { size: 4, spread: true, n: 3, r: 2, w: 2 }),
      ],
      links: [
        ...base.links,
        link('users-eu', 'server-eu'),
        link('server-eu', 'wide'),
        link('server-eu', 'storage'),
        link('server-eu', 'psp'),
        link('server-eu', 'llm'),
        link('server-eu', 'msgp'),
      ],
    }
    const without = solve({ ...eu, researched: ALL.filter((id) => id !== 'geo-dns') })
    const withGeo = solve(eu)
    expect(without.nodes['server-eu']?.inbound ?? 0).toBe(0)
    expect(withGeo.nodes['server-eu']?.inbound ?? 0).toBeGreaterThan(0)
    expect(withGeo.kinds.read?.mean ?? 0).toBeLessThan((without.kinds.read?.mean ?? 0) - 15)
  })

  test('a Region outage downs one region, and a spread store keeps serving', () => {
    let game = ok(Actions.openRegion(seriesC(20_000), 'eu'))
    game = ok(Actions.openRegion(game, 'sa'))
    game = {
      ...game,
      nodes: [...game.nodes, node('wide', 'wide', 900, 200, { spread: true, size: 3 })],
      links: [...game.links, link('server', 'wide')],
    }
    const started = forceIncident(game, solve(game), 'region')
    expect(started?.incident?.region).toBe('na')
    const down = started?.nodes.filter((entry) => entry.down !== 0).map((entry) => entry.id)
    expect(down).toContain('server')
    expect(down).toContain('database')
    expect(down).not.toContain('wide')
    expect(down).not.toContain('psp')
  })
})

describe('quorums (07 "Wide-column Store")', () => {
  const wide = (n: number, r: number, w: number, lost = 0) =>
    patchNode(
      seriesC(20_000, [node('wide', 'wide', 900, 200, { size: 4 })], [['server', 'wide']]),
      'wide',
      { n, r, w, lost },
    )
  // The App Server sends reads and writes to the Wide-column Store only.
  const only = (game: Game): Game => ({
    ...game,
    links: game.links.filter((entry) => !(entry.from === 'server' && entry.to === 'database')),
  })

  test('R + W > N never reads stale; R = W = 1 does under writes', () => {
    const weak = solve(only(wide(3, 1, 1)))
    const strong = solve(only(wide(3, 2, 2)))
    expect(weak.kinds.read?.success ?? 1).toBeLessThan(0.99)
    expect(strong.kinds.read?.success ?? 0).toBeGreaterThan(0.999)
  })

  test('a quorum waits for the k-th fastest replica', () => {
    const one = solve(only(wide(3, 1, 1))).nodes.wide?.latency ?? 0
    const two = solve(only(wide(3, 2, 2))).nodes.wide?.latency ?? 0
    const all = solve(only(wide(3, 3, 3))).nodes.wide?.latency ?? 0
    expect(two).toBeGreaterThan(one)
    expect(all).toBeGreaterThan(two)
  })

  test('W = 3 fails every write with one replica lost; QUORUM survives it', () => {
    expect(solve(only(wide(3, 1, 3, 30))).kinds.write?.success ?? 1).toBe(0)
    expect(solve(only(wide(3, 2, 2, 30))).kinds.write?.success ?? 0).toBeGreaterThan(0.99)
  })
})

describe('Distributed SQL (07 "Distributed SQL")', () => {
  test('a write across three regions waits for the majority round trip', () => {
    let game = seriesC(20_000, [node('dsql', 'dsql', 900, 200, { spread: true })])
    expect(majorityMs(game, game.nodes.find((entry) => entry.id === 'dsql') as GameNode)).toBe(0)
    game = ok(Actions.openRegion(game, 'eu'))
    game = ok(Actions.openRegion(game, 'sa'))
    // North America, Europe at 75 ms, South America at 120: the second-smallest is 75.
    expect(majorityMs(game, game.nodes.find((entry) => entry.id === 'dsql') as GameNode)).toBe(75)
  })
})

describe('fan-out (07 "Fan-out")', () => {
  test('pull reads 20 rows per feed; push reads one timeline and writes to followers', () => {
    const pull = solve(seriesC(20_000))
    const push = solve(patchNode(seriesC(20_000), 'server', { fanout: 'push' }))
    const feeds = pull.kinds.feed?.rate ?? 0
    expect(feeds).toBeGreaterThan(0)
    expect(pull.nodes.database?.inbound ?? 0).toBeGreaterThan(push.nodes.database?.inbound ?? 0)
    expect(push.kinds.feed?.mean ?? 0).toBeLessThan(pull.kinds.feed?.mean ?? 0)
  })

  test('a hot key saturates one Cache shard, and splitting keys spreads it', () => {
    const game = seriesC(20_000, [
      node('cache', 'cache', 600, 200, { engine: 'memcached', size: 4 }),
    ])
    const cached = {
      ...game,
      links: [
        ...game.links.filter((entry) => !(entry.from === 'server' && entry.to === 'database')),
        link('server', 'cache'),
        link('cache', 'database'),
      ],
    }
    const calm = solve(cached).nodes.cache?.capacity ?? 0
    const hot = forceIncident(cached, solve(cached), 'hot-key') as Game
    expect(solve(hot).nodes.cache?.capacity ?? 0).toBeLessThan(calm / 2)
    expect(solve(patchNode(hot, 'cache', { split: true })).nodes.cache?.capacity ?? 0).toBe(calm)
  })
})

describe('the IPO (10 "Era 6")', () => {
  test('the Rule of 40 sets the multiple, and Investor relations adds 2', () => {
    const game = { ...seriesC(20_000), sandbox: false, stage: 6 }
    const ledger = solve(game)
    const plain = valuationOf({ ...game, researched: [] }, ledger)
    const ir = valuationOf(game, ledger)
    expect(plain.multiple).toBeCloseTo(
      Math.min(30, Math.max(2, 4 + 0.15 * Math.max(0, plain.ruleOf40))),
      9,
    )
    expect(ir.multiple - plain.multiple).toBeCloseTo(2, 9)
  })

  test('the checklist needs every item at once, and the IPO dilutes 15% and starts quarters', () => {
    const game: Game = { ...seriesC(20_000), sandbox: false, stage: 6, users: 50_000_000 }
    const items = checklistOf(game, solve(game))
    expect(items.map((item) => item.id)).toEqual([
      'users',
      'reliability',
      'soc2',
      'drill',
      'residency',
      'rule40',
    ])
    expect(items.find((item) => item.id === 'users')?.met).toBe(true)
    expect(items.find((item) => item.id === 'drill')?.met).toBe(false)
    expect(Actions.canRaise(game)).toBe(false)
    expect(Result.isFailure(Actions.raise(game))).toBe(true)
  })

  test('the data lost in a region failure: none with consensus, everything with no backups', () => {
    const plain = seriesC(20_000)
    expect(rpoOf(plain, null)).toBe(Number.POSITIVE_INFINITY)
    expect(rpoOf(patchNode(plain, 'database', { backup: 'pitr' }), null)).toBe(2)
    let spread = ok(Actions.openRegion(plain, 'eu'))
    spread = ok(Actions.openRegion(spread, 'sa'))
    spread = {
      ...spread,
      nodes: [
        ...spread.nodes.filter((entry) => entry.id !== 'database'),
        node('dsql', 'dsql', 900, 200, { spread: true }),
      ],
    }
    expect(rpoOf(spread, null)).toBe(0)
  })
})

describe('Public quarters (10 "Era 7")', () => {
  test('a beat raises the multiple, a miss lowers it, and four beats add a streak bonus', () => {
    const game: Game = { ...seriesC(20_000), sandbox: false, stage: 7 }
    const ledger = solve(game)
    const start = { ...game, quarter: firstQuarter(game, ledger.revenue / 2) }
    let quarter = start.quarter
    const bonuses: Array<number> = []
    for (let index = 0; index < 4; index += 1) {
      const next = advanceQuarter(
        {
          ...start,
          quarter: { ...quarter, revenue: ledger.revenue / 2 },
          time: (index + 1) * QUARTER_SECONDS,
        },
        ledger,
      )
      quarter = next ?? quarter
      bonuses.push(quarter.bonus)
    }
    // A sandbox ledger has no Burn but salaries: margin high, and revenue doubled each quarter.
    expect(quarter.last?.beat).toBe(true)
    expect(bonuses).toEqual([0.5, 1, 1.5, 3])
    const missed = advanceQuarter(
      { ...start, quarter: { ...quarter, revenue: ledger.revenue * 2 }, time: 5 * QUARTER_SECONDS },
      ledger,
    )
    expect(missed?.bonus).toBe(2)
    expect(missed?.streak).toBe(0)
  })

  test('Public has no next round', () => {
    expect(Actions.canRaise({ ...seriesC(20_000), sandbox: false, stage: 7, users: 1e10 })).toBe(
      false,
    )
  })
})
