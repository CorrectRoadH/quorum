import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import type { Action } from './actions.ts'
import {
  ERAS,
  FAILOVER_SECONDS,
  INCIDENTS,
  UPGRADE_CRASHES,
  VM_REACTION,
  type ResearchId,
  type RuntimeId,
} from './catalog.ts'
import { company, link, node } from './company.ts'
import { forceIncident, weaknessOf } from './director.ts'
import { burnOf } from './lookups.ts'
import { budgetOf, budgetVelocity, recordBudget } from './slo.ts'
import { solve } from './solve.ts'
import type { Game, GameNode } from './state.ts'
import { step } from './step.ts'
import { quarterSeconds } from './team.ts'

/* Series A (10 "Era 3: Series A"): new runtimes, media, rt and buy, zones, the Autoscaler, and the SLO. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const RESEARCH: ReadonlyArray<ResearchId> = [
  'stripe',
  'php-fpm',
  'lang-node',
  'lang-go',
  'lang-java',
  'lang-csharp',
  'lang-elixir',
  'lang-rust',
  'load-balancing',
  'object-storage',
  'checkout',
  'cdn',
  'multi-az',
  'autoscaling',
  'containers',
  'error-budgets',
]

/** A flat-demand Series A board: one App Server with a Database, Object Storage and the Payment Provider. */
const seriesA = (
  users: number,
  runtime: RuntimeId,
  extra: ReadonlyArray<GameNode> = [],
  links: ReadonlyArray<readonly [string, string]> = [],
  server: Partial<GameNode> = {},
): Game => ({
  ...company(7),
  sandbox: true,
  stage: 3,
  users,
  researched: RESEARCH,
  nodes: [
    node('users', 'users', 120, 280),
    node('server', 'server', 440, 280, { size: 3, runtime, ...server }),
    node('database', 'database', 760, 200, { size: 4 }),
    node('storage', 'storage', 760, 360),
    node('psp', 'psp', 760, 520),
    ...extra,
  ],
  links: [
    link('users', 'server'),
    link('server', 'database'),
    link('server', 'storage'),
    link('server', 'psp'),
    ...links.map(([from, to]) => link(from, to)),
  ],
})

const settle = (game: Game, seconds: number): Game => {
  let current = game
  for (let elapsed = 0; elapsed < seconds; elapsed += 1) current = step(current, 1).game
  return current
}

const serverOf = (game: Game): GameNode =>
  game.nodes.find((entry) => entry.id === 'server') as GameNode

describe('the Series A Era', () => {
  test('raises Series B at 150,000 users with the GDD mix and a 99.9% SLO', () => {
    const era = ERAS[3]
    expect(era?.name).toBe('Series A')
    expect(era?.raiseAt).toBe(150_000)
    expect(era?.slo).toBe(0.999)
    const shares = Object.values(era?.mix ?? {}).reduce((sum, share) => sum + (share ?? 0), 0)
    expect(shares).toBeCloseTo(1, 9)
    // Each Era tightens the SLO and lets worse incidents through.
    for (const [index, entry] of ERAS.entries()) {
      const before = ERAS[index - 1]
      if (!before) continue
      expect(entry.slo).toBeGreaterThanOrEqual(before.slo)
      expect(entry.maxSeverity).toBeLessThanOrEqual(before.maxSeverity)
    }
  })
})

describe('runtimes', () => {
  test('a cold JVM runs at 30% and is warm once 30 seconds pass', () => {
    const warm = solve(seriesA(4_000, 'tomcat')).nodes.server?.capacity ?? 0
    const cold = seriesA(4_000, 'tomcat', [], [], { warm: 0 })
    // A cold JVM's CPU runs at 30%; its thread pool still bounds it, so the loss is less than 70%.
    expect(solve(cold).nodes.server?.capacity ?? 0).toBeLessThan(warm * 0.7)
    const warmed = settle(cold, 31)
    expect(serverOf(warmed).warm).toBe(1)
    expect(solve(warmed).nodes.server?.capacity ?? 0).toBeCloseTo(warm, 6)
    // Go has no JIT: it starts at full speed.
    const go = seriesA(4_000, 'go', [], [], { warm: 0 })
    expect(solve(go).nodes.server?.capacity ?? 0).toBeCloseTo(
      solve(seriesA(4_000, 'go')).nodes.server?.capacity ?? 0,
      6,
    )
  })

  test('PHP-FPM cannot hold rt; Elixir holds a connection in less memory than Tomcat', () => {
    const php = solve(seriesA(4_000, 'php_fpm', [], [], { workers: 24 }))
    expect(php.kinds.rt?.success ?? 0).toBe(0)
    const ramOf = (runtime: RuntimeId): number =>
      solve(seriesA(4_000, runtime)).nodes.server?.resources.ram?.used ?? 0
    expect(solve(seriesA(4_000, 'beam')).kinds.rt?.success).toBeGreaterThan(0.99)
    expect(ramOf('beam')).toBeLessThan(ramOf('tomcat'))
  })
})

describe('media, buy and the Payment Provider', () => {
  test('media without a CDN is egress; buy pays fees and fails upstream in an outage', () => {
    const game = seriesA(8_000, 'go')
    const ledger = solve(game)
    expect(ledger.egress).toBeGreaterThan(0)
    expect(ledger.fees).toBeGreaterThan(0)
    expect(ledger.kinds.buy?.success).toBeGreaterThan(0.99)
    const outage = forceIncident(game, ledger, 'psp-outage')
    expect(outage).not.toBeNull()
    const during = solve(outage as Game)
    expect(during.errors.upstream).toBeGreaterThan(0)
    expect(during.kinds.buy?.success ?? 1).toBeLessThan(0.01)
  })
})

describe('zones', () => {
  test('a call across zones adds latency and egress', () => {
    const same = solve(seriesA(4_000, 'go'))
    const apart = solve(ok(Actions.setZone(seriesA(4_000, 'go'), 'database', 'b')))
    expect(apart.latency).toBeGreaterThan(same.latency)
    expect(apart.egress).toBeGreaterThan(same.egress)
  })

  test('a zone outage downs its zone; a standby Database fails over', () => {
    const second = node('server2', 'server', 440, 440, { size: 3, runtime: 'go', zone: 'b' })
    const game = ok(
      Actions.setStandby(
        seriesA(
          4_000,
          'go',
          [node('lb', 'lb', 280, 280), second],
          [
            ['lb', 'server2'],
            ['server2', 'database'],
            ['server2', 'storage'],
            ['server2', 'psp'],
          ],
        ),
        'database',
        true,
      ),
    )
    const wired: Game = {
      ...game,
      links: [
        link('users', 'lb'),
        link('lb', 'server'),
        ...game.links.filter((entry) => entry.from !== 'users'),
      ],
    }
    const hit = forceIncident(wired, solve(wired), 'zone')
    const zone = hit?.incident?.zone
    const nodes = hit?.nodes ?? []
    const down = (id: string): number => nodes.find((entry) => entry.id === id)?.down ?? 0
    // Each App Server goes down with its own zone, and only then.
    expect(down('server') > 0).toBe(zone === 'a')
    expect(down('server2') > 0).toBe(zone === 'b')
    expect(Math.max(down('server'), down('server2'))).toBe(INCIDENTS.zone.duration)
    // The Database lives in zone a; its standby takes over in seconds.
    expect(down('database')).toBe(zone === 'a' ? FAILOVER_SECONDS : 0)
    const after = solve(settle(hit as Game, FAILOVER_SECONDS + 1))
    expect(after.errorShare).toBeLessThan(0.05)
  })
})

describe('the Autoscaler', () => {
  const scaled = (users: number, options: Parameters<typeof Actions.setAutoscaler>[2]): Game => {
    const placed = ok(
      Actions.place(seriesA(users, 'go', [], [], { size: 1 }), 'autoscaler', 440, 80),
    )
    const id = placed.nodes.at(-1)?.id ?? ''
    return ok(Actions.setAutoscaler(ok(Actions.connect(placed, 'server', id)), id, options))
  }

  test('adds copies after the VM reaction time, within its maximum', () => {
    const busy = scaled(12_000, { maxCopies: 4 })
    const load = solve(busy).nodes.server?.resources.cpu
    expect((load?.used ?? 0) / (load?.total ?? 1)).toBeGreaterThan(0.6)
    // At most once per 30 s cooldown, counted from the start of the clock.
    const asked = serverOf(settle(busy, 32))
    expect(asked.pending).toBeGreaterThan(0)
    expect(asked.replicas).toBe(1)
    const joined = settle(busy, 32 + VM_REACTION)
    expect(serverOf(joined).replicas).toBeGreaterThan(1)
    expect(serverOf(settle(joined, 600)).replicas).toBeLessThanOrEqual(4)
  })

  test('copies cost Burn; in a cluster they cost 15% less', () => {
    const one = seriesA(4_000, 'go')
    const three = seriesA(4_000, 'go', [], [], { replicas: 3 })
    expect(burnOf(three, serverOf(three))).toBeCloseTo(burnOf(one, serverOf(one)) * 3, 9)
    const placed = ok(Actions.place(three, 'cluster', 440, 80))
    const pods = ok(Actions.connect(placed, 'server', placed.nodes.at(-1)?.id ?? ''))
    expect(burnOf(pods, serverOf(pods))).toBeCloseTo(burnOf(three, serverOf(three)) * 0.85, 9)
  })
})

describe('the Kubernetes Cluster', () => {
  /** A Series A board whose App Server runs as pods in a Cluster. */
  const podded = (game: Game): Game => {
    const placed = ok(Actions.place(game, 'cluster', 440, 80))
    return ok(Actions.connect(placed, 'server', placed.nodes.at(-1)?.id ?? ''))
  }

  test('a Cluster past its supported quarter risks a forced upgrade that crashes its pods', () => {
    const game = podded(seriesA(4_000, 'go'))
    const cluster = game.nodes.find((entry) => entry.type === 'cluster') as GameNode
    expect(weaknessOf(game, solve(game), 'cluster-upgrade')).toBe(0)
    // Two quarters on: one past support, so the director can pick it, and likelier than the floor.
    const stale = { ...game, time: cluster.upgradedAt + 2 * quarterSeconds() }
    expect(weaknessOf(stale, solve(stale), 'cluster-upgrade')).toBeCloseTo(2, 6)
    const forced = forceIncident(stale, solve(stale), 'cluster-upgrade')
    if (!forced) throw new Error('no forced upgrade')
    expect(forced.incident?.nodeId).toBe(cluster.id)
    expect(solve(forced).kinds.page?.success).toBeCloseTo(1 - UPGRADE_CRASHES, 3)
    // Off the Cluster, nothing crashes.
    const vm = { ...forced, links: forced.links.filter((entry) => entry.to !== cluster.id) }
    expect(solve(vm).kinds.page?.success).toBeCloseTo(1, 3)
  })
})

describe('the error budget', () => {
  test('at 99.9%, one failure in a thousand spends it all, and a spent budget halves velocity', () => {
    const company: Game = { ...seriesA(4_000, 'go'), sandbox: false, researched: RESEARCH }
    expect(
      budgetOf({ ...company, budget: [{ hour: 0, requests: 1_000_000, failed: 1_000, users: 0 }] })
        .left,
    ).toBeCloseTo(0, 9)
    const budget = [{ hour: 0, requests: 1_000_000, failed: 1_100, users: 0 }]
    expect(budgetOf({ ...company, budget }).left).toBeLessThan(0)
    expect(
      budgetOf({ ...company, budget: [{ hour: 0, requests: 1_000_000, failed: 250, users: 0 }] })
        .left,
    ).toBeCloseTo(0.75, 9)
    expect(budgetVelocity({ ...company, budget })).toBe(0.5)
    expect(
      budgetVelocity({
        ...company,
        budget: [{ hour: 0, requests: 1_000_000, failed: 0, users: 0 }],
      }),
    ).toBe(1.1)
    // Without the research, or before Series A, the budget changes nothing.
    expect(budgetVelocity({ ...company, budget, researched: [] })).toBe(1)
    expect(budgetVelocity({ ...company, budget, stage: 2 })).toBe(1)
  })

  test('counts hourly buckets from Series A on, and nothing in a Sandbox', () => {
    const company: Game = { ...seriesA(4_000, 'go'), sandbox: false }
    const ledger = solve(company)
    const recorded = recordBudget(company, ledger, 60)
    expect(recorded).toHaveLength(1)
    expect(recorded[0]?.requests).toBeCloseTo(ledger.demand * 60, 6)
    expect(recordBudget({ ...company, sandbox: true }, ledger, 60)).toEqual([])
    expect(recordBudget({ ...company, stage: 2 }, ledger, 60)).toEqual([])
  })
})
