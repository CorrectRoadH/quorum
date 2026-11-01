import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { filePostmortem, restart, setRuntime, setWorkers, type Action } from './actions.ts'
import { newGame, preseedGame } from './company.ts'
import { forceIncident } from './director.ts'
import type { StepEvent } from './events.ts'
import { solve } from './solve.ts'
import { DESIGN_TUNING, ERAS } from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { growthOf, step } from './step.ts'
import type { Game } from './state.ts'

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

/** Runs the Game for some seconds in quarter-second steps and collects the events. */
const run = (game: Game, seconds: number) => {
  let current = game
  const events: Array<StepEvent> = []
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.25) {
    const result = step(current, 0.25)
    current = result.game
    events.push(...result.events)
  }
  return { game: current, events }
}

describe('a Garage minute', () => {
  test('users grow while Apdex beats the target', () => {
    const { game } = run(newGame(), 60)
    expect(game.users).toBeGreaterThan(newGame().users * 1.2)
  })

  test('revenue waits in the drawer and spills when nobody collects it', () => {
    const { game, events } = run(newGame(), 120)
    expect(game.pending).toBeGreaterThan(0)
    expect(game.spilled).toBeGreaterThan(0)
    expect(events.some((event) => event._tag === 'DrawerFull')).toBe(true)
  })

  test('Stripe Billing pays revenue straight into Cash', () => {
    const start = { ...newGame(), researched: ['stripe' as const] }
    const { game } = run(start, 60)
    expect(game.pending).toBe(0)
    expect(game.cash).toBeGreaterThan(start.cash)
  })

  test('a busy Burstable box spends its credits, says so once, then loses users', () => {
    const busy = { ...newGame(), users: 700, credits: 0 }
    const { game, events } = run(
      {
        ...busy,
        nodes: busy.nodes.map((node) => (node.type === 'server' ? { ...node, credits: 20 } : node)),
      },
      90,
    )
    const box = game.nodes.find((node) => node.type === 'server')
    expect(box?.credits).toBeLessThan(1)
    expect(events.filter((event) => event._tag === 'CreditsExhausted')).toHaveLength(1)
    expect(game.users).toBeLessThan(700)
  })

  test('no incidents in the Garage', () => {
    const { events } = run(newGame(), 300)
    expect(events.some((event) => event._tag === 'IncidentStarted')).toBe(false)
  })

  test('ten 0.1 s Steps earn what one 1 s Step earns, within 1%', () => {
    let fine = newGame()
    for (let index = 0; index < 10; index += 1) fine = step(fine, 0.1).game
    const coarse = step(newGame(), 1).game
    expect(fine.time).toBe(coarse.time)
    expect(Math.abs(fine.earned - coarse.earned)).toBeLessThan(coarse.earned * 0.01)
  })

  test('the same Game and steps give the same result', () => {
    const a = run(preseedGame(7), 240).game
    const b = run(preseedGame(7), 240).game
    expect(a).toEqual(b)
  })
})

describe('user growth at the design pace', () => {
  // 16 "User growth": Apdex 1, no capacity limit, the Era's market. The live game runs at
  // PLAYTEST_PACE; the design's times hold at pace 1.
  const minutesTo = (stage: number, from: number, to: number): number => {
    const ledger = { market: ERAS[stage]?.market ?? 0 } as Ledger
    let game: Game = { ...newGame(), stage, users: from, apdex: 1 }
    let seconds = 0
    while (game.users < to) {
      game = { ...game, users: game.users + growthOf(game, ledger, DESIGN_TUNING.pace) * 0.1 }
      seconds += 0.1
    }
    return seconds / 60
  }

  test('the Garage grows from 150 to 1,000 users in 12 minutes', () => {
    expect(Math.abs(minutesTo(0, 150, 1_000) - 12) / 12).toBeLessThan(0.05)
  })

  test('Pre-seed grows from 1,000 to 5,000 users in 21 minutes', () => {
    expect(Math.abs(minutesTo(1, 1_000, 5_000) - 21) / 21).toBeLessThan(0.05)
  })
})

describe('Pre-seed incidents', () => {
  test('the director starts one when it is due and files a postmortem when it ends', () => {
    const due = { ...preseedGame(), nextIncidentAt: preseedGame().time }
    const { game, events } = run(due, 90)
    const started = events.find((event) => event._tag === 'IncidentStarted')
    const resolved = events.find((event) => event._tag === 'IncidentResolved')
    expect(started).toBeDefined()
    expect(resolved).toBeDefined()
    expect(game.postmortems.length).toBe(1)
  })

  test('a postmortem pays nothing and leaves its action item open until it is researched', () => {
    const due = { ...preseedGame(), nextIncidentAt: Number.MAX_SAFE_INTEGER, insight: 100 }
    const spiked = forceIncident(due, solve(due), 'spike') as Game
    const { game } = run(spiked, 35)
    const postmortem = game.postmortems[0]
    // Pre-seed owns no spike prevention, so Caching (80) is the first.
    expect(postmortem?.action).toBe('caching')
    expect(game.openActions).toEqual(['caching'])
    const id = postmortem?.id ?? -1
    const filed = ok(filePostmortem(game, id, false))
    expect(filed.insight).toBe(game.insight)
    expect(filed.openActions).toEqual(['caching'])
    const taken = ok(filePostmortem(game, id, true))
    expect(taken.insight).toBe(game.insight - 80)
    expect(taken.researched).toContain('caching')
  })

  test('an open action item makes its incident come back more often', () => {
    const count = (openActions: ReadonlyArray<'caching'>) => {
      let spikes = 0
      for (let seed = 1; seed <= 40; seed += 1) {
        const base = { ...preseedGame(seed), openActions, nextIncidentAt: preseedGame().time }
        const { events } = run(base, 1)
        const started = events.find((event) => event._tag === 'IncidentStarted')
        if (started?._tag === 'IncidentStarted' && started.incident.kind === 'spike') spikes += 1
      }
      return spikes
    }
    expect(count(['caching'])).toBeGreaterThan(count([]))
  })

  test('PHP shared nothing does not leak; a Node.js process leaks until it is restarted', () => {
    const php = preseedGame()
    expect(forceIncident(php, solve(php), 'leak')).toBeNull()

    let node = ok(
      setRuntime({ ...php, researched: [...php.researched, 'lang-node'] }, 'server', 'node'),
    )
    node = run(node, 20).game
    const leaking = forceIncident(node, solve(node), 'leak')
    expect(leaking?.incident?.nodeId).toBe('server')
    const grown = run(leaking as Game, 10).game
    expect(grown.nodes.find((entry) => entry.id === 'server')?.leak ?? 0).toBeGreaterThan(0.3)
    const restarted = run(ok(restart(grown, 'server')), 5)
    expect(restarted.game.incident).toBeNull()
    expect(restarted.events.some((event) => event._tag === 'IncidentResolved')).toBe(true)
  })

  test('an unattended leak ends in an out-of-memory kill', () => {
    let node = ok(
      setRuntime(
        { ...preseedGame(), researched: [...preseedGame().researched, 'lang-node'] },
        'server',
        'node',
      ),
    )
    node = run(node, 20).game
    let leaking = forceIncident(node, solve(node), 'leak') as Game
    let killed = false
    for (let elapsed = 0; elapsed < 60 && !killed; elapsed += 0.25) {
      const result = step(leaking, 0.25)
      leaking = result.game
      killed = result.events.some((event) => event._tag === 'OutOfMemory')
    }
    expect(killed).toBe(true)
    expect(solve(leaking).errors.oom).toBeGreaterThan(0)
  })
})

describe('restarts and memory', () => {
  const box = (game: Game) => game.nodes.find((node) => node.id === 'server')

  test('each runtime boots in its own time: PHP about 1 s, Ruby 10 s', () => {
    const php = ok(restart(preseedGame(), 'server'))
    expect(box(php)?.down).toBe(1)
    const ruby = ok(
      setRuntime(
        { ...preseedGame(), researched: [...preseedGame().researched, 'lang-ruby'] },
        'server',
        'puma',
      ),
    )
    expect(box(ruby)?.down).toBe(10)
    expect(box(run(ruby, 9.5).game)?.down).toBeGreaterThan(0)
    expect(box(run(ruby, 10.5).game)?.down).toBe(0)
  })

  test('a PHP-FPM pool twice what RAM holds swaps, then the kernel kills it', () => {
    // A small box has 8 GB: about 190 PHP-FPM workers at 40 MB fit.
    const oversized = ok(setWorkers(preseedGame(), 'server', 400))
    expect(solve(oversized).nodes.server?.swapping).toBe(true)
    const { game, events } = run(oversized, 0.25)
    expect(events.some((event) => event._tag === 'OutOfMemory')).toBe(true)
    expect(box(game)?.downCause).toBe('oom')
    expect(solve(game).errors.oom).toBeGreaterThan(0)
    expect(solve(game).errors.down).toBe(0)
  })

  test('a pool that only swaps keeps running', () => {
    const swapping = ok(setWorkers(preseedGame(), 'server', 220))
    expect(solve(swapping).nodes.server?.swapping).toBe(true)
    expect(run(swapping, 5).events.some((event) => event._tag === 'OutOfMemory')).toBe(false)
  })
})
