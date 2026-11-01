import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import type { Action } from './actions.ts'
import { newGame } from './company.ts'
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
      game = ok(Actions.addIndex(game, 'database'))
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
    // Or keep one event loop, and send login hashing to a second Node.js server.
    const routeLogin: Plan = (game, passed) => {
      if (passed > 0) return game
      const fronted = addServer(behindLoadBalancer(game), 'database')
      const lb = fronted.nodes.find((node) => node.type === 'lb')?.id ?? ''
      const hasher = lastId(fronted)
      const node = ok(Actions.setRuntime(fronted, hasher, 'node'))
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

  test('copies a Company Design at its demand without touching the Company', () => {
    const company = newGame()
    const copy = sandboxOf(company)
    expect(copy.sandbox).toBe(true)
    expect(copy.nodes.map((node) => node.id)).toEqual(company.nodes.map((node) => node.id))
    expect(copy.users).toBe(Math.round(company.users))
    expect(company.sandbox).toBe(false)
  })
})
