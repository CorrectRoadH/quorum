import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { restart, setRuntime, type Action } from './actions.ts'
import { newGame, preseedGame } from './company.ts'
import { forceIncident } from './director.ts'
import type { StepEvent } from './events.ts'
import { solve } from './solve.ts'
import { step } from './step.ts'
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

  test('the same Game and steps give the same result', () => {
    const a = run(preseedGame(7), 240).game
    const b = run(preseedGame(7), 240).game
    expect(a).toEqual(b)
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
    expect(game.postmortems[0]?.reward ?? 0).toBeGreaterThan(0)
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
    const { events } = run(forceIncident(node, solve(node), 'leak') as Game, 60)
    expect(events.some((event) => event._tag === 'OutOfMemory')).toBe(true)
  })
})
