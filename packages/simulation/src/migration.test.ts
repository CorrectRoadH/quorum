import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { connect, disconnect, place, type Action } from './actions.ts'
import { DESIGN_TUNING, LANGUAGES, MIGRATION_BUGS } from './catalog.ts'
import { preseedGame } from './company.ts'
import type { Ledger } from './ledger.ts'
import { migrationCost } from './migration.ts'
import { GUIDED } from './sandbox.ts'
import { solveFlow } from './solve.ts'
import type { Game } from './state.ts'
import { serviceOf } from './team.ts'
import { advanceTeam, cancelMigration, changeStack, queueFeature, shiftMigration } from './work.ts'

/* 08 "Migrations": a Stack change in a Company is Dev Hours and a strangler, not a restart. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const at = (game: Game): Ledger => ({ ...solveFlow(game), velocity: 1 })

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

/** Pre-seed with four PHP-FPM App Servers behind a Load Balancer, Node.js researched. */
const four = (): Game => {
  let game: Game = {
    ...preseedGame(),
    cash: 1e6,
    autopilot: false,
    nextIncidentAt: Number.MAX_SAFE_INTEGER,
    researched: [...preseedGame().researched, 'lang-node'],
  }
  game = ok(place(game, 'lb', 280, 280))
  const lb = game.nodes.at(-1)?.id ?? ''
  game = ok(connect(disconnect(game, 'users', 'server'), 'users', lb))
  game = ok(connect(game, lb, 'server'))
  for (let index = 0; index < 3; index += 1) {
    game = ok(place(game, 'server', 440, 400 + index * 140))
    const id = game.nodes.at(-1)?.id ?? ''
    game = ok(connect(ok(connect(game, id, 'database')), lb, id))
  }
  return game
}

const onNode = (game: Game) =>
  game.nodes.filter((node) => node.type === 'server' && node.runtime === 'node').length

/** Builds the next step at once and shifts to it. */
const step = (game: Game): Game => {
  const top = game.backlog.find((item) => item.kind === 'migration')
  const built = work(
    {
      ...game,
      backlog: game.backlog.map((item) => (item === top ? { ...item, spent: item.cost } : item)),
    },
    1,
  )
  return ok(shiftMigration(built))
}

describe('migrations', () => {
  test('a Stack change in a Company starts a migration and changes nothing yet', () => {
    const game = four()
    const started = ok(changeStack(game, 'server', { runtime: 'node' }))
    expect(onNode(started)).toBe(0)
    const migration = serviceOf(started).migration
    expect(migration?.runtime).toBe('node')
    // A language change: the codebase over the new language's velocity.
    expect(migration?.total).toBeCloseTo(serviceOf(game).codebase / LANGUAGES.node.velocity, 1)
    expect(started.backlog.map((item) => item.ref)).toEqual(['step-1'])
  })

  test('the strangler moves 0, 1, 2, then all 4 App Servers, and each move reveals bugs', () => {
    let game = ok(changeStack(four(), 'server', { runtime: 'node' }))
    const moved: Array<number> = []
    for (let index = 0; index < 4; index += 1) {
      game = step(game)
      moved.push(onNode(game))
      if (index === 1) {
        expect(serviceOf(game).migration?.bugs).toBe(true)
        // Once the moved server is back from its restart, it fails some of its requests.
        const up: Game = {
          ...game,
          nodes: game.nodes.map((node) => ({ ...node, down: 0, warm: 1 })),
        }
        const errors = solveFlow(up).errors.crash
        expect(errors).toBeGreaterThan(0)
        expect(errors / solveFlow(up).demand).toBeLessThan(MIGRATION_BUGS)
      }
    }
    expect(moved).toEqual([0, 1, 2, 4])
    // Fix bugs ends it.
    expect(serviceOf(game).migration?.step).toBe(4)
    const fixedUp = work(game, 60 * 60)
    expect(fixedUp.backlog.some((item) => item.ref === 'fix-bugs')).toBe(false)
    expect(serviceOf(fixedUp).migration).toBeNull()
    expect(solveFlow(fixedUp).errors.crash).toBe(0)
  })

  test('the next step waits for its Dev Hours', () => {
    const game = ok(changeStack(four(), 'server', { runtime: 'node' }))
    expect(Result.isFailure(shiftMigration(game))).toBe(true)
  })

  test('one migration at a time, and a cancel moves the servers back', () => {
    const running = step(step(ok(changeStack(four(), 'server', { runtime: 'node' }))))
    expect(onNode(running)).toBe(1)
    expect(Result.isFailure(changeStack(running, 'server', { framework: 'laravel' }))).toBe(true)
    const cancelled = ok(cancelMigration(running))
    expect(onNode(cancelled)).toBe(0)
    expect(serviceOf(cancelled).migration).toBeNull()
    expect(cancelled.backlog.some((item) => item.kind === 'migration')).toBe(false)
  })

  test('Features build at half speed while the Service migrates', () => {
    const queued = ok(queueFeature(four(), 'pagination'))
    const migrating = ok(changeStack(queued, 'server', { runtime: 'node' }))
    // The Feature is on top: the migration step waits behind it.
    expect(work(queued, 60).backlog[0]?.spent).toBeCloseTo(0.8)
    expect(work(migrating, 60).backlog[0]?.spent).toBeCloseTo(0.4)
  })

  test('a variant costs a tenth of a language change', () => {
    const game = four()
    expect(migrationCost(game, { runtime: 'mod_php', framework: 'none' })).toBeCloseTo(
      serviceOf(game).codebase * 0.1,
    )
  })

  test('a Sandbox changes Stacks at once, as before', () => {
    const sandbox = GUIDED['event-loop-stall'].start()
    const server = sandbox.nodes.find((node) => node.type === 'server')
    if (!server) throw new Error('no server')
    const changed = ok(changeStack(sandbox, server.id, { runtime: 'node_cluster' }))
    expect(changed.nodes.find((node) => node.id === server.id)?.runtime).toBe('node_cluster')
    expect(serviceOf(changed).migration).toBeNull()
  })
})
