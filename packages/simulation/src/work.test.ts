import { Result, Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import { connect, place, setPoolerMode, type Action } from './actions.ts'
import { callsOf } from './capacity.ts'
import {
  CALENDAR_DAY,
  DESIGN_TUNING,
  FEATURES,
  PAYING_SHARE,
  PLAN_PER_DAY,
  POOLER_CONNECTIONS,
  type FeatureId,
} from './catalog.ts'
import { preseedGame } from './company.ts'
import { forceIncident } from './director.ts'
import type { Ledger } from './ledger.ts'
import { nextRandom } from './random.ts'
import { solve, solveFlow } from './solve.ts'
import { Game } from './state.ts'
import { growthOf } from './step.ts'
import { badDeployChance, deploysPerDay, serviceOf, teamOutputs, withService } from './team.ts'
import {
  addIndex,
  advanceTeam,
  createTeam,
  moveItem,
  queueFeature,
  queueTask,
  rollback,
  rushItem,
  setTeamPolicy,
} from './work.ts'

/* 08 "Features", "Engineering tasks", "Tech debt", "Team policy", and "Deploy frequency". */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const at = (game: Game, velocity = 1): Ledger => ({ ...solveFlow(game), velocity })

/** Pre-seed with the autopilot off and nothing to interrupt. */
const preseed = (): Game => ({
  ...preseedGame(),
  cash: 1e6,
  autopilot: false,
  nextIncidentAt: Number.MAX_SAFE_INTEGER,
})

/** Advances only the Team, by `seconds` in 1 s Steps, at velocity 1 and the design's calendar. */
const work = (game: Game, seconds: number): Game => {
  let current = game
  for (let elapsed = 0; elapsed < seconds; elapsed += 1)
    current = advanceTeam(
      { ...current, time: current.time + 1 },
      at(current),
      1,
      DESIGN_TUNING,
    ).game
  return current
}

const shipped = (game: Game, ...features: ReadonlyArray<FeatureId>): Game => ({
  ...game,
  shipped: features,
})

describe('the backlog', () => {
  test('the top item gets the Dev Hours; the next waits', () => {
    const game = ok(queueFeature(ok(queueFeature(preseed(), 'landing-page')), 'pagination'))
    // 5 sim s are a twelfth of a calendar day: the founder makes 6.4 / 12 DH.
    const after = work(game, 5)
    expect(after.backlog[0]?.spent).toBeCloseTo(6.4 / 12)
    expect(after.backlog[1]?.spent).toBe(0)
  })

  test('two teams build the first two items at once', () => {
    const queued = ok(queueFeature(ok(queueFeature(preseed(), 'landing-page')), 'pagination'))
    const second = ok(createTeam(queued))
    const team = second.teams[1]?.id ?? ''
    const staffed: Game = {
      ...second,
      engineers: [{ id: 'e1', team, language: 'php', hiredAt: -1e6 }],
    }
    // A twelfth of a calendar day: the founder makes 6.4 / 12 DH, an engineer 8 / 12.
    const after = work(staffed, 5)
    expect(after.backlog[0]?.spent).toBeCloseTo(6.4 / 12)
    expect(after.backlog[1]?.spent).toBeCloseTo(8 / 12)
  })

  test('items move, and the pool rushes one', () => {
    const game = ok(queueFeature(ok(queueFeature(preseed(), 'landing-page')), 'pagination'))
    const moved = ok(moveItem(game, game.backlog[1]?.id ?? 0, -1))
    expect(moved.backlog[0]?.ref).toBe('pagination')
    const rushed = ok(rushItem({ ...moved, devHours: 4 }, moved.backlog[0]?.id ?? 0))
    expect(rushed.backlog[0]?.spent).toBe(4)
    expect(rushed.devHours).toBe(0)
  })

  test('with the autopilot on, an idle team picks the next Feature itself', () => {
    expect(work({ ...preseed(), autopilot: true }, 1).backlog[0]?.ref).toBe('landing-page')
    expect(work(preseed(), 1).backlog).toEqual([])
  })

  test('Paid plans needs Password login on the way, and Pre-seed Features wait for Pre-seed', () => {
    const signedUp = shipped(preseed(), 'signup-flow')
    expect(Result.isFailure(queueFeature(preseed(), 'password-login'))).toBe(true)
    expect(Result.isFailure(queueFeature(signedUp, 'paid-plans'))).toBe(true)
    expect(
      Result.isSuccess(queueFeature(ok(queueFeature(signedUp, 'password-login')), 'paid-plans')),
    ).toBe(true)
    expect(Result.isFailure(queueFeature({ ...preseed(), stage: 0 }, 'password-login'))).toBe(true)
  })
})

describe('deploys', () => {
  test('a built Feature waits for the next deploy, then ships', () => {
    const built = ok(queueFeature(preseed(), 'pagination'))
    const almost: Game = {
      ...built,
      backlog: built.backlog.map((item) => ({ ...item, spent: item.cost - 0.001 })),
    }
    const finished = work(withService(almost, { nextDeployAt: almost.time + 100 }), 2)
    expect(finished.awaiting).toEqual(['pagination'])
    expect(finished.shipped).toEqual([])
    const deployed = work(finished, 100)
    expect(deployed.shipped).toEqual(['pagination'])
    expect(deployed.deploys).toBe(1)
    // Pagination ships a query shape with no index.
    expect(serviceOf(deployed).shapes).toBe(1)
  })

  test('PHP deploys more often than Node.js at the same policy, and a pipeline more still', () => {
    const fast = ok(setTeamPolicy(preseed(), 'core', 'move-fast', DESIGN_TUNING))
    const php: Game = { ...fast, time: fast.time + CALENDAR_DAY }
    const node: Game = {
      ...php,
      nodes: php.nodes.map((entry) =>
        entry.type === 'server' ? { ...entry, runtime: 'node' } : entry,
      ),
    }
    expect(deploysPerDay(php, DESIGN_TUNING)).toBeGreaterThan(deploysPerDay(node, DESIGN_TUNING))
    const piped: Game = { ...php, researched: [...php.researched, 'ci'] }
    expect(deploysPerDay(piped, DESIGN_TUNING)).toBeGreaterThan(deploysPerDay(php, DESIGN_TUNING))
    // Balanced caps the day at 8 deploys.
    expect(deploysPerDay({ ...preseed(), researched: ['ci'] }, DESIGN_TUNING)).toBe(8)
  })

  test('the bad-deploy chance follows the policy, the debt, tests, and review', () => {
    const game = preseed()
    const base = badDeployChance(game, DESIGN_TUNING)
    expect(base).toBeCloseTo(0.1)
    const fast = ok(setTeamPolicy(game, 'core', 'move-fast', DESIGN_TUNING))
    expect(badDeployChance({ ...fast, time: fast.time + CALENDAR_DAY }, DESIGN_TUNING)).toBeCloseTo(
      0.15,
    )
    expect(badDeployChance(withService(game, { debt: 0.5 }), DESIGN_TUNING)).toBeCloseTo(0.2)
    const careful: Game = {
      ...game,
      researched: [...game.researched, 'ci', 'testing-culture', 'code-review'],
    }
    expect(badDeployChance(careful, DESIGN_TUNING)).toBeCloseTo(0.1 * 0.7 * 0.8)
  })

  test('a seeded deploy is bad exactly when its roll is under the chance', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const ready: Game = withService(
        { ...preseed(), seed, awaiting: ['landing-page'] },
        { nextDeployAt: 0, debt: 1 },
      )
      const chance = badDeployChance(ready, DESIGN_TUNING)
      const deployed = work(ready, 1)
      expect(deployed.badDeploys === 1).toBe(nextRandom(seed)[0] < chance)
    }
  })

  test('a bad deploy fails App Server requests; rolling back needs Continuous delivery', () => {
    const live = withService(shipped(preseed(), 'landing-page'), { lastDeploy: ['landing-page'] })
    const broken = forceIncident(live, solveFlow(live), 'bad-deploy')
    if (!broken) throw new Error('no bad deploy')
    expect(solveFlow(broken).errors.crash).toBeGreaterThan(0)
    expect(Result.isFailure(rollback(broken))).toBe(true)
    const rolled = ok(rollback({ ...broken, researched: [...broken.researched, 'ci'] }))
    expect(rolled.shipped).toEqual([])
    expect(rolled.awaiting).toEqual(['landing-page'])
    expect(rolled.incident?.remaining).toBe(0)
  })
})

describe('Features', () => {
  test('Landing page raises the market by 20% and page views by 10%', () => {
    const before = solveFlow(preseed())
    const after = solveFlow(shipped(preseed(), 'landing-page'))
    expect(after.market / before.market).toBeCloseTo(1.2)
    expect((after.kinds.page?.rate ?? 0) / (before.kinds.page?.rate ?? 1)).toBeCloseTo(1.1)
  })

  test('Signup flow raises growth by 15%', () => {
    const game: Game = { ...preseed(), apdex: 1 }
    const ledger = { ...solveFlow(game) }
    expect(growthOf(shipped(game, 'signup-flow'), ledger) / growthOf(game, ledger)).toBeCloseTo(
      1.15,
    )
  })

  test('Password login is what brings logins', () => {
    expect(solveFlow(preseed()).kinds.login).toBeUndefined()
    const after = solveFlow(shipped(preseed(), 'password-login'))
    expect((after.kinds.login?.rate ?? 0) / after.demand).toBeCloseTo(0.05)
  })

  test('Paid plans adds subscriptions, paid per paying user per calendar day', () => {
    const game = shipped(preseed(), 'password-login', 'paid-plans')
    const ledger = solveFlow(game)
    expect(ledger.subscriptions).toBeCloseTo(
      (game.users * PAYING_SHARE * PLAN_PER_DAY) / CALENDAR_DAY,
    )
    expect(ledger.revenue).toBeGreaterThan(
      solveFlow(shipped(preseed(), 'password-login')).revenue + ledger.subscriptions,
    )
  })

  test('a shipped Feature survives a save round trip', () => {
    const game = shipped(preseed(), 'landing-page', 'pagination')
    const decoded = Schema.decodeUnknownSync(Game)(
      JSON.parse(JSON.stringify(Schema.encodeSync(Game)(game))),
    )
    expect(decoded.shipped).toEqual(['landing-page', 'pagination'])
    expect(decoded.services).toEqual(game.services)
  })

  test('every Feature belongs to an Era the build has: Garage to Public', () => {
    for (const feature of Object.values(FEATURES)) expect(feature.era).toBeLessThanOrEqual(7)
  })
})

describe('Engineering tasks and tech debt', { timeout: 30_000 }, () => {
  test('Add index from the pool ends a Slow query', () => {
    const game: Game = {
      ...preseed(),
      researched: [...preseed().researched, 'query-analysis'],
      devHours: 10,
    }
    const slow = forceIncident(game, solveFlow(game), 'slow-query')
    if (!slow) throw new Error('no slow query')
    const indexed = work(ok(addIndex(slow, 'database')), 1)
    // The pool paid the 4 DH; the founder's second of work (6.4 DH over a
    // 60 s calendar day) went back into it.
    expect(indexed.devHours).toBeCloseTo(6 + 6.4 / 60)
    expect(indexed.incident?.remaining ?? 0).toBeLessThanOrEqual(0)
  })

  test('Eager loading is researched to find the N+1 queries, and built to remove them', () => {
    const laravel: Game = {
      ...preseed(),
      researched: [...preseed().researched, 'eager-loading'],
      nodes: preseed().nodes.map((node) =>
        node.type === 'server' ? { ...node, framework: 'laravel' } : node,
      ),
    }
    const server = laravel.nodes.find((node) => node.type === 'server')
    if (!server) throw new Error('no server')
    expect(callsOf(laravel, server, 'read', false)['q-read']).toBe(3)
    const fixedUp = work({ ...ok(queueTask(laravel, 'eager-loading')), devHours: 0 }, 39 * 60)
    expect(serviceOf(fixedUp).fixes).toContain('eager-loading')
    expect(callsOf(fixedUp, server, 'read', false)['q-read']).toBe(1)
  })

  test('debt slows velocity by 1 − 0.5 × debt, and a Refactor pays it down', () => {
    const clean = preseed()
    const indebted = withService(clean, { debt: 0.4 })
    const ratio =
      (teamOutputs(indebted, at(indebted))[0]?.velocity ?? 0) /
      (teamOutputs(clean, at(clean))[0]?.velocity ?? 1)
    expect(ratio).toBeCloseTo(0.8)
    const refactored = work(ok(queueTask(indebted, 'refactor')), 60 * 60)
    expect(serviceOf(refactored).debt).toBeCloseTo(0.2)
  })

  test('Move fast ships with more debt than Quality', () => {
    const built = (policy: 'move-fast' | 'quality') => {
      const set = ok(setTeamPolicy(preseed(), 'core', policy, DESIGN_TUNING))
      const queued = ok(queueFeature({ ...set, time: set.time + CALENDAR_DAY }, 'pagination'))
      return serviceOf(work(queued, 30 * 60)).debt
    }
    expect(built('move-fast')).toBeGreaterThan(built('quality'))
  })
})

describe('Connection Pooler modes', () => {
  const pooled = (mode: 'session' | 'transaction', fixes: ReadonlyArray<'session-state'> = []) => {
    let game: Game = withService(
      {
        ...preseed(),
        researched: [...preseed().researched, 'pooling'],
        users: 2_000,
        nodes: preseed().nodes.map((node) =>
          node.type === 'server' ? { ...node, size: 4, workers: 64 } : node,
        ),
      },
      { fixes },
    )
    game = ok(place(game, 'pooler', 600, 160))
    const pooler = game.nodes.at(-1)?.id ?? ''
    game = {
      ...game,
      links: game.links.filter((link) => !(link.from === 'server' && link.to === 'database')),
    }
    game = ok(connect(ok(connect(game, 'server', pooler)), pooler, 'database'))
    return ok(setPoolerMode(game, pooler, mode))
  }

  test('transaction mode fails queries that need session state, until the task ships', () => {
    expect(solve(pooled('transaction')).errors.crash).toBeGreaterThan(0)
    expect(solve(pooled('transaction', ['session-state'])).errors.crash).toBe(0)
  })

  test('session mode holds a server connection per client', () => {
    const session = solve(pooled('session')).nodes.database?.connections?.used ?? 0
    const transaction = solve(pooled('transaction')).nodes.database?.connections?.used ?? 0
    expect(transaction).toBe(POOLER_CONNECTIONS)
    expect(session).toBeGreaterThan(transaction)
  })
})
