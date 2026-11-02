import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import type { Action } from './actions.ts'
import { Result as R } from 'effect'
import { COMPONENTS, COMPONENT_IDS, FRAMEWORK_IDS, RUNTIME_IDS } from './catalog.ts'
import { newGame } from './company.ts'
import { frameworkReady, runtimeReady } from './lookups.ts'
import { previewOf } from './preview.ts'
import {
  GUIDED,
  START,
  advanceSandbox,
  freeSandbox,
  passedAll,
  sandboxOf,
  type Progress,
  type SandboxId,
} from './sandbox.ts'
import { solve } from './solve.ts'
import { addIndex } from './work.ts'
import { step } from './step.ts'
import type { Game } from './state.ts'

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

/** What the player does: once at the start, then after each objective that passes. */
type Plan = (game: Game, passed: number) => Game

const idle: Plan = (game) => game

/** Sim seconds per Step. Coarser than the game's clock, so the suite stays fast. */
const STEP = 1

/** Plays a guided Sandbox for some sim seconds, adding an index when a slow query is found. */
const play = (
  id: SandboxId,
  plan: Plan,
  seconds: number,
  index = false,
): Progress & Readonly<{ elapsed: number; game: Game }> => {
  const sandbox = GUIDED[id]
  let game = plan(sandbox.start(), 0)
  let progress = START
  let elapsed = 0
  for (; elapsed < seconds && !passedAll(sandbox, progress); elapsed += STEP) {
    game = step(game, STEP).game
    if (index && game.incident?.kind === 'slow-query' && game.time - game.incident.startedAt > 15)
      game = ok(addIndex(game, 'database'))
    const next = advanceSandbox(sandbox, progress, game, solve(game), STEP)
    game = next.game
    progress = next.progress
    if (next.advanced) game = plan(game, progress.objective)
  }
  return { ...progress, elapsed, game }
}

const lastId = (game: Game): string => game.nodes.at(-1)?.id ?? ''

const behindLoadBalancer = (game: Game): Game => {
  const placed = ok(Actions.place(game, 'lb', 300, 280))
  const lb = lastId(placed)
  const rewired = ok(Actions.connect(Actions.disconnect(placed, 'users', 'server'), 'users', lb))
  return ok(Actions.connect(rewired, lb, 'server'))
}

/** Adds an App Server behind the Load Balancer, linked to `to`. */
const addServer = (game: Game, to: string, workers?: number): Game => {
  const lb = game.nodes.find((node) => node.type === 'lb')?.id ?? ''
  const placed = ok(Actions.place(game, 'server', 600, 560))
  const id = lastId(placed)
  const linked = ok(Actions.connect(ok(Actions.connect(placed, lb, id)), id, to))
  return workers === undefined ? linked : ok(Actions.setWorkers(linked, id, workers))
}

/** Puts a data Node between the App Servers and the Database. */
const inFront = (game: Game, type: 'pooler' | 'cache'): Game => {
  const placed = ok(Actions.place(game, type, 740, 280))
  const id = lastId(placed)
  const rewired = placed.nodes
    .filter((node) => node.type === 'server')
    .reduce(
      (current, server) =>
        ok(Actions.connect(Actions.disconnect(current, server.id, 'database'), server.id, id)),
      placed,
    )
  return ok(Actions.connect(rewired, id, 'database'))
}

/** Long enough for any objective to pass twice over. */
const LONG = 900

/** 14 "Length": the fastest pass of a guided Sandbox takes 4 to 11 sim minutes. */
const passesInTime = (
  run: Readonly<{ objective: number; elapsed: number }>,
  objectives: number,
) => {
  expect(run.objective).toBe(objectives)
  expect(run.elapsed).toBeGreaterThanOrEqual(240)
  expect(run.elapsed).toBeLessThanOrEqual(660)
}

describe('guided Sandboxes pass with their fix and stall without it', { timeout: 60_000 }, () => {
  test('Out of Credits: leave Burstable, scale up, then go back for the night', () => {
    const plan: Plan = (game, passed) =>
      passed === 0
        ? ok(Actions.setFamily(game, 'server', 'general'))
        : passed === 1
          ? ok(Actions.resize(game, 'server', 1))
          : passed === 2
            ? ok(Actions.resize(ok(Actions.setFamily(game, 'server', 'burstable')), 'server', -1))
            : game
    passesInTime(play('out-of-credits', plan, LONG), 3)
    expect(play('out-of-credits', idle, LONG).objective).toBe(0)
    // A bigger Burstable box earns credits at night, then runs dry at four times the demand.
    expect(
      play(
        'out-of-credits',
        (game, passed) => (passed === 0 ? ok(Actions.resize(game, 'server', 1)) : game),
        LONG,
      ).objective,
    ).toBe(1)
  })

  test('Shared Box: split the database out, then shape each Node for its work', () => {
    const plan: Plan = (game, passed) => {
      if (passed === 0)
        return ok(Actions.connect(ok(Actions.place(game, 'database', 760, 280)), 'server', 'n1'))
      if (passed === 1) {
        const bigger = ok(Actions.resize(game, 'server', 1))
        return ok(
          Actions.setFamily(ok(Actions.setFamily(bigger, 'n1', 'memory')), 'server', 'compute'),
        )
      }
      if (passed === 2) return ok(Actions.resize(game, 'server', -1))
      return game
    }
    passesInTime(play('shared-box', plan, LONG), 3)
    // One big box serves the demand but costs more than the budget allows.
    const vertical: Plan = (game, passed) =>
      passed <= 1 ? ok(Actions.resize(game, 'server', 1)) : game
    expect(play('shared-box', vertical, LONG).objective).toBe(1)
  })

  test('Second Server: spare copies behind a Load Balancer survive a failure', () => {
    const plan: Plan = (game, passed) =>
      passed === 0
        ? addServer(behindLoadBalancer(game), 'database')
        : passed <= 2
          ? addServer(game, 'database')
          : game
    passesInTime(play('second-server', plan, LONG), 3)
    const bigBox: Plan = (game, passed) =>
      passed <= 2 ? ok(Actions.resize(game, 'server', 1)) : game
    expect(play('second-server', bigBox, LONG).objective).toBe(1)
  })

  test('Connection Limit: more App Servers need a pooler, not more connections', () => {
    const more = (game: Game): Game =>
      [0, 1, 2].reduce(
        (current) =>
          addServer(
            current,
            current.nodes.find((node) => node.type === 'pooler')?.id ?? 'database',
            40,
          ),
        game,
      )
    const plan: Plan = (game, passed) =>
      passed === 0 ? inFront(game, 'pooler') : passed === 1 ? more(game) : game
    passesInTime(play('connection-limit', plan, LONG), 3)
    expect(play('connection-limit', more, LONG).objective).toBe(0)
  })

  test('Event Loop Stall: one event loop does not get faster on a bigger box', () => {
    const cluster: Plan = (game, passed) =>
      passed === 0 ? ok(Actions.setRuntime(game, 'server', 'node_cluster')) : game
    passesInTime(play('event-loop-stall', cluster, LONG), 2)
    const bigger: Plan = (game, passed) =>
      passed === 0 ? ok(Actions.resize(game, 'server', 1)) : game
    expect(play('event-loop-stall', bigger, LONG).objective).toBe(0)
    // Or keep one event loop for the rest, and send login hashing to its own Node.js servers.
    // One event loop of logins alone does not survive 4× hashing: the hasher needs every core.
    const routeLogin: Plan = (game, passed) => {
      if (passed > 0) return game
      const fronted = addServer(behindLoadBalancer(game), 'database')
      const lb = fronted.nodes.find((node) => node.type === 'lb')?.id ?? ''
      const hasher = lastId(fronted)
      const sized = ok(Actions.resize(ok(Actions.resize(fronted, hasher, 1)), hasher, 1))
      const node = ok(Actions.setRuntime(sized, hasher, 'node_cluster'))
      const apart = ok(Actions.setLinkKinds(node, lb, hasher, ['login']))
      return ok(Actions.setLinkKinds(apart, lb, 'server', ['page', 'read', 'write']))
    }
    passesInTime(play('event-loop-stall', routeLogin, LONG), 2)
  })

  test('Read Mostly: a Cache is cheaper than a bigger Database, and an index ends a slow query', () => {
    const plan: Plan = (game, passed) =>
      passed === 0
        ? inFront(game, 'cache')
        : passed === 1
          ? ok(Actions.resize(game, 'database', 1))
          : game
    passesInTime(play('read-mostly', plan, LONG, true), 3)
    // A Read Replica takes the reads too, and some come back stale. It holds the first objective;
    // at 8,000 users its stale reads alone pass 1% of requests, and a replica big enough for the
    // load costs more than the budget. The Cache is the cheaper fix, which is the lesson.
    const replica: Plan = (game, passed) => {
      if (passed > 0) return game
      const placed = ok(Actions.place(game, 'replica', 880, 520))
      const id = lastId(placed)
      return placed.nodes
        .filter((node) => node.type === 'server')
        .reduce((current, server) => ok(Actions.connect(current, server.id, id)), placed)
    }
    const replicated = play('read-mostly', replica, LONG, true)
    expect(replicated.objective).toBe(1)
    expect(solve(replicated.game).errors.stale).toBeGreaterThan(0)
    const bigger: Plan = (game, passed) =>
      passed <= 1 ? ok(Actions.resize(game, 'database', 1)) : game
    expect(play('read-mostly', bigger, LONG).objective).toBe(1)
  })

  test('Stampede: coalesce the misses, then warm the Cache before traffic', () => {
    const guard =
      (change: Readonly<{ coalesce?: boolean; warming?: boolean }>): Plan =>
      (game, passed) =>
        passed === 0 ? ok(Actions.setCacheGuard(game, 'cache', change)) : game
    passesInTime(play('stampede', guard({ coalesce: true, warming: true }), LONG), 3)
    // A cold Cache overloads the database, its refills time out, and it stays cold.
    expect(play('stampede', idle, LONG).objective).toBe(1)
    // Coalescing alone survives one restart; at 50% more demand the cold Cache still slows the App Servers.
    expect(play('stampede', guard({ coalesce: true }), LONG).objective).toBe(2)
    // A bigger Database survives too, at a Burn the budget does not allow.
    const bigger: Plan = (game, passed) =>
      passed === 0
        ? ok(
            Actions.setCacheGuard(ok(Actions.resize(game, 'database', 1)), 'cache', {
              coalesce: true,
            }),
          )
        : game
    expect(play('stampede', bigger, LONG).objective).toBe(2)
  })

  test('Slow Uploads: a Queue and a Worker take uploads off the App Servers', () => {
    const queue =
      (dlq: boolean): Plan =>
      (game, passed) => {
        if (passed > 0) return game
        const placed = ok(Actions.place(game, 'queue', 880, 60))
        const id = lastId(placed)
        const worked = ok(Actions.place(placed, 'worker', 1100, 60))
        const worker = lastId(worked)
        const linked = ['server1', 'server2'].reduce(
          (current, server) => ok(Actions.connect(current, server, id)),
          ok(Actions.connect(worked, id, worker)),
        )
        return ok(Actions.setDlq(linked, id, dlq))
      }
    passesInTime(play('slow-uploads', queue(true), LONG), 3)
    expect(play('slow-uploads', idle, LONG).objective).toBe(1)
    // Without a dead-letter queue, the poison message keeps the Workers busy and the queue climbs.
    const poisoned = play('slow-uploads', queue(false), LONG)
    expect(poisoned.objective).toBe(2)
    // More PHP-FPM workers only add waiting: the boxes are out of CPU.
    const workers: Plan = (game, passed) =>
      passed === 0
        ? ok(Actions.setWorkers(ok(Actions.setWorkers(game, 'server1', 40)), 'server2', 40))
        : game
    expect(play('slow-uploads', workers, LONG).objective).toBe(1)
  })

  test('Bots: a WAF at a moderate paranoia level blocks the flood', () => {
    const waf =
      (level: number): Plan =>
      (game, passed) => {
        if (passed > 0) return game
        const placed = ok(Actions.place(game, 'waf', 240, 280))
        const id = lastId(placed)
        const wired = ok(
          Actions.connect(
            ok(Actions.connect(Actions.disconnect(placed, 'users', 'lb'), 'users', id)),
            id,
            'lb',
          ),
        )
        return ok(Actions.setParanoia(wired, id, level))
      }
    passesInTime(play('bots', waf(2), LONG), 3)
    expect(play('bots', idle, LONG).objective).toBe(1)
    // Paranoia 4 blocks 6% of real users: errors never fall under 1%.
    expect(play('bots', waf(4), LONG).objective).toBe(0)
    // A third App Server rides out the flood, over the Burn budget.
    const third: Plan = (game, passed) => {
      if (passed > 0) return game
      const placed = ok(Actions.place(game, 'server', 600, 580))
      const id = lastId(placed)
      const sized = ok(Actions.resize(ok(Actions.resize(placed, id, 1)), id, 1))
      const php = ok(Actions.setWorkers(ok(Actions.setRuntime(sized, id, 'php_fpm')), id, 24))
      return ['database', 'search', 'storage'].reduce(
        (current, to) => ok(Actions.connect(current, id, to)),
        ok(Actions.connect(php, 'lb', id)),
      )
    }
    expect(play('bots', third, LONG).objective).toBe(2)
  })
})

describe('the Series A track', () => {
  /** A third Go App Server behind the Load Balancer, in the zone it is placed in. */
  const third = (game: Game): Game => {
    const placed = ok(Actions.place(game, 'server', 600, 580))
    const id = lastId(placed)
    const go = ok(Actions.setRuntime(ok(Actions.resize(placed, id, 1)), id, 'go'))
    return ['database', 'storage', 'psp'].reduce(
      (current, to) => ok(Actions.connect(current, id, to)),
      ok(Actions.connect(go, 'lb', id)),
    )
  }

  test('Zone Outage: a second zone and a standby ride out the outage', () => {
    const spread: Plan = (game, passed) =>
      passed > 0
        ? game
        : ok(Actions.setStandby(ok(Actions.setZone(game, 'server2', 'b')), 'database', true))
    passesInTime(play('zone-outage', spread, LONG), 3)
    expect(play('zone-outage', idle, LONG).objective).toBe(1)
    // More App Servers in the same zone go down with it.
    expect(
      play('zone-outage', (game, passed) => (passed > 0 ? game : third(game)), LONG).objective,
    ).toBe(1)
    // Spread and a spare server survive too, over the Burn budget.
    const spare: Plan = (game, passed) => (passed > 0 ? game : third(spread(game, 0)))
    expect(play('zone-outage', spare, LONG).objective).toBe(2)
  }, 60_000)

  test('Cold Start: warm spare copies take the spike and give it back at night', () => {
    const scaler =
      (cluster: boolean, day: number, night: number): Plan =>
      (game, passed) => {
        if (passed === 2) {
          const id = game.nodes.find((node) => node.type === 'autoscaler')?.id ?? ''
          return ok(Actions.setAutoscaler(game, id, { minCopies: night }))
        }
        if (passed > 0) return game
        let next = ok(Actions.place(game, 'autoscaler', 600, 80))
        const id = lastId(next)
        next = ok(Actions.connect(next, 'server1', id))
        if (cluster) {
          next = ok(Actions.place(next, 'cluster', 800, 80))
          next = ok(Actions.connect(next, 'server1', lastId(next)))
        }
        return ok(Actions.setAutoscaler(next, id, { minCopies: day }))
      }
    passesInTime(play('cold-start', scaler(true, 2, 1), LONG), 3)
    expect(play('cold-start', idle, LONG).objective).toBe(1)
    // Two warm copies all night run over the Burn budget.
    expect(play('cold-start', scaler(true, 2, 2), LONG).objective).toBe(2)
    // A box two sizes bigger takes the spike and costs too much at night.
    const vertical: Plan = (game, passed) =>
      passed > 0 ? game : ok(Actions.resize(ok(Actions.resize(game, 'server1', 1)), 'server1', 1))
    expect(play('cold-start', vertical, LONG).objective).toBe(2)
    // An Autoscaler on VMs alone reacts too late, then catches up: slower, not failing.
    expect(play('cold-start', scaler(false, 1, 1), LONG).elapsed).toBeGreaterThan(
      play('cold-start', scaler(true, 2, 1), LONG).elapsed,
    )
  }, 60_000)
})

describe('the Series A track, continued', () => {
  const onBoth =
    (apply: (game: Game, id: string) => Game): Plan =>
    (game, passed) =>
      passed > 0 ? game : apply(apply(game, 'server1'), 'server2')

  test('Stale Checkout: read-your-writes routing, not more replicas', () => {
    passesInTime(
      play(
        'stale-checkout',
        onBoth((game, id) => ok(Actions.setRyw(game, id, true))),
        LONG,
      ),
      3,
    )
    expect(play('stale-checkout', idle, LONG).objective).toBe(1)
    // A second replica lags as far behind as the first.
    const replicas: Plan = (game, passed) => {
      if (passed > 0) return game
      const placed = ok(Actions.place(game, 'replica', 1120, 400))
      const id = lastId(placed)
      return ok(Actions.connect(ok(Actions.connect(placed, 'server1', id)), 'server2', id))
    }
    expect(play('stale-checkout', replicas, LONG).objective).toBe(1)
  }, 60_000)
})

describe('the Series B track', () => {
  const onBoth =
    (apply: (game: Game, id: string) => Game): Plan =>
    (game, passed) =>
      passed > 0 ? game : apply(apply(game, 'server1'), 'server2')

  test('GC Pauses: more memory or ZGC keeps the p99 down; Parallel GC makes it worse', () => {
    passesInTime(
      play(
        'gc-pauses',
        onBoth((game, id) => ok(Actions.setFamily(game, id, 'memory'))),
        LONG,
      ),
      3,
    )
    passesInTime(
      play(
        'gc-pauses',
        onBoth((game, id) => ok(Actions.setCollector(game, id, 'zgc'))),
        LONG,
      ),
      3,
    )
    expect(play('gc-pauses', idle, LONG).objective).toBe(1)
    expect(
      play(
        'gc-pauses',
        onBoth((game, id) => ok(Actions.setCollector(game, id, 'parallel'))),
        LONG,
      ).objective,
    ).toBe(1)
  }, 60_000)

  test('Retry Storm: backoff or breakers end it; a bigger Database costs too much', () => {
    const policy = (change: Parameters<typeof Actions.setLinkPolicy>[3]) =>
      onBoth((game, id) => ok(Actions.setLinkPolicy(game, id, 'database', change)))
    passesInTime(play('retry-storm', policy({ retries: 'backoff' }), LONG), 3)
    passesInTime(play('retry-storm', policy({ breaker: true }), LONG), 3)
    // Naive retries keep the Database overloaded after the trigger ends.
    expect(play('retry-storm', idle, LONG).objective).toBe(1)
    const bigger: Plan = (game, passed) =>
      passed > 0 ? game : ok(Actions.resize(ok(Actions.resize(game, 'database', 1)), 'database', 1))
    expect(play('retry-storm', bigger, LONG).objective).toBe(2)
  }, 120_000)

  test('Analytics on Primary: a Warehouse, not a bigger primary', () => {
    const warehouse: Plan = (game, passed) => {
      if (passed > 0) return game
      const placed = ok(Actions.place(game, 'warehouse', 1120, 420))
      const id = lastId(placed)
      return ok(Actions.connect(ok(Actions.connect(placed, 'server1', id)), 'server2', id))
    }
    passesInTime(play('analytics-primary', warehouse, LONG), 3)
    expect(play('analytics-primary', idle, LONG).objective).toBe(1)
    const bigger: Plan = (game, passed) =>
      passed > 0
        ? game
        : ok(
            Actions.resize(
              ok(Actions.resize(ok(Actions.resize(game, 'database', 1)), 'database', 1)),
              'database',
              1,
            ),
          )
    expect(play('analytics-primary', bigger, LONG).objective).toBe(2)
  }, 60_000)
})

/** Opens a region with an App Server behind its Users, wired like the home ones. */
const regionServer = (game: Game, region: 'eu' | 'apac'): Game => {
  let next = ok(Actions.place(ok(Actions.openRegion(game, region)), 'server', 600, 300, region))
  const id = lastId(next)
  next = {
    ...next,
    nodes: next.nodes.map((node) => (node.id === id ? { ...node, size: 3, runtime: 'go' } : node)),
  }
  for (const to of ['wide', 'storage', 'psp', 'llm', 'queue', 'search', 'warehouse'])
    next = ok(Actions.connect(next, id, to))
  return ok(Actions.connect(next, `users-${region}`, id))
}

describe('the Series C track', () => {
  test('Far Away: a second region with GeoDNS passes; bigger home servers do not', () => {
    const regions: Plan = (game, passed) =>
      passed === 1
        ? ok(Actions.setSpread(regionServer(regionServer(game, 'eu'), 'apac'), 'wide', true))
        : game
    passesInTime(play('far-away', regions, LONG), 2)
    expect(play('far-away', idle, LONG).objective).toBe(1)
    const bigger: Plan = (game, passed) =>
      passed === 1
        ? {
            ...game,
            nodes: game.nodes.map((node) => (node.type === 'server' ? { ...node, size: 6 } : node)),
          }
        : game
    expect(play('far-away', bigger, LONG).objective).toBe(1)
  }, 60_000)

  test('Missed Write: R + W > N passes; more replicas at R = W = 1 do not, and W = N fails with a replica down', () => {
    const quorum: Plan = (game, passed) =>
      passed === 0 ? ok(Actions.setQuorum(game, 'wide', 3, 2, 2)) : game
    passesInTime(play('missed-write', quorum, LONG), 2)
    const more: Plan = (game, passed) =>
      passed === 0 ? ok(Actions.setQuorum(game, 'wide', 5, 1, 1)) : game
    expect(play('missed-write', more, LONG).objective).toBe(0)
    const all: Plan = (game, passed) =>
      passed === 0 ? ok(Actions.setQuorum(game, 'wide', 3, 1, 3)) : game
    expect(play('missed-write', all, LONG).objective).toBe(1)
  }, 60_000)

  test('Hot Key: splitting keys passes; a bigger store does not', () => {
    const split: Plan = (game, passed) =>
      passed === 1 ? ok(Actions.setSplit(game, 'wide', true)) : game
    passesInTime(play('hot-key', split, LONG), 2)
    expect(play('hot-key', idle, LONG).objective).toBe(1)
    const bigger: Plan = (game, passed) =>
      passed === 1 ? ok(Actions.resize(game, 'wide', 1)) : game
    expect(play('hot-key', bigger, LONG).objective).toBe(1)
  }, 60_000)
})

describe('the free Sandbox', () => {
  test('holds demand flat, spends nothing, and starts no incidents', () => {
    let game = freeSandbox()
    for (let elapsed = 0; elapsed < 1_800; elapsed += STEP) game = step(game, STEP).game
    expect(game.users).toBe(freeSandbox().users)
    expect(game.cash).toBe(freeSandbox().cash)
    expect(game.incident).toBeNull()
    expect(solve(game).demand).toBeCloseTo(solve(freeSandbox()).demand, 6)
  })

  test('places Nodes for free', () => {
    const placed = ok(Actions.place(freeSandbox(), 'cache', 600, 500))
    expect(placed.cash).toBe(freeSandbox().cash)
  })

  test('places every Component that is not fixed to the board', () => {
    // Users and Payments come with every board, once.
    for (const type of COMPONENT_IDS.filter((id) => !COMPONENTS[id].fixed))
      expect(R.isSuccess(Actions.place(freeSandbox(), type, 600, 500))).toBe(true)
  })

  test('has every runtime and framework ready', () => {
    const game = freeSandbox()
    for (const id of RUNTIME_IDS) expect(runtimeReady(game, id)).toBe(true)
    for (const id of FRAMEWORK_IDS) expect(frameworkReady(game, id)).toBe(true)
  })

  test('previews a Tradeoff, with no Cash at all', () => {
    const game = freeSandbox()
    expect(game.cash).toBe(0)
    const preview = previewOf(game, 'cluster', (current) =>
      Actions.setRuntime(current, 'server', 'node_cluster'),
    )
    expect(R.isSuccess(preview)).toBe(true)
    if (R.isSuccess(preview)) {
      expect(preview.success.cash).toBe(0)
      expect(preview.success.after.revenue).toBeGreaterThan(0)
    }
  })

  test('copies a Company Design at its demand without touching the Company', () => {
    const company = newGame()
    const copy = sandboxOf(company)
    expect(copy.sandbox).toBe(true)
    expect(copy.nodes.map((node) => node.id)).toEqual(company.nodes.map((node) => node.id))
    expect(copy.users).toBe(Math.round(company.users))
    expect(company.sandbox).toBe(false)
  })
})
