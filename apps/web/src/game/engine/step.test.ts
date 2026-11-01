import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import {
  filePostmortem,
  restart,
  setAlertRule,
  setRuntime,
  setWorkers,
  type Action,
} from './actions.ts'
import { newGame, preseedGame } from './company.ts'
import { directIncidents, forceIncident } from './director.ts'
import type { StepEvent } from './events.ts'
import { solve } from './solve.ts'
import { DESIGN_TUNING, ERAS } from './catalog.ts'
import type { Ledger } from './ledger.ts'
import { growthOf, ignored, step } from './step.ts'
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
    // An unmitigated spike escalates halfway and runs 50% longer (11 "Escalation").
    const { game } = run(spiked, 50)
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

describe('alert fatigue', () => {
  // A saturated Pre-seed box with Alerting and no incident: every saturation page is false.
  const busy = (): Game => ({
    ...preseedGame(),
    users: 6_000,
    researched: [...preseedGame().researched, 'alerting'],
    nextIncidentAt: Number.MAX_SAFE_INTEGER,
  })
  /** Fires the saturation alert once: the condition held 60 s, then cleared. */
  const page = (game: Game) => {
    const result = step({ ...game, alarms: { ...game.alarms, saturation: 59.9 } }, 0.25)
    return {
      game: { ...result.game, alarms: { ...result.game.alarms, saturation: 0 } },
      events: result.events,
    }
  }

  test('five false saturation alerts in one day mark the rule ignored, and a new threshold clears it', () => {
    let game = busy()
    expect(solve(game).nodes.server?.utilization ?? 0).toBeGreaterThan(0.95)
    const tags: Array<string> = []
    for (let index = 0; index < 6; index += 1) {
      const paged = page(game)
      game = paged.game
      tags.push(...paged.events.map((event) => event._tag))
    }
    expect(tags.filter((tag) => tag === 'AlertFired')).toHaveLength(5)
    expect(tags.filter((tag) => tag === 'AlertIgnored')).toHaveLength(1)
    expect(ignored(game, 'saturation')).toBe(true)
    const tuned = ok(setAlertRule(game, 'saturation', 0.95))
    expect(ignored(tuned, 'saturation')).toBe(false)
    expect(tuned.alertRules.saturation).toBe(0.95)
  })

  test('an alert during an incident is not false', () => {
    let game = forceIncident(busy(), solve(busy()), 'spike') as Game
    for (let index = 0; index < 6; index += 1)
      game = { ...page(game).game, incident: game.incident }
    expect(game.falseAlarms.saturation).toBe(0)
  })
})

describe('Insight', () => {
  test('the first served API write pays 20 Insight, once', () => {
    const game: Game = {
      ...preseedGame(),
      nextIncidentAt: Number.MAX_SAFE_INTEGER,
      servedKinds: ['page', 'read', 'login'],
    }
    expect(solve(game).kinds.write?.success ?? 0).toBeGreaterThan(0.5)
    const first = step(game, 0.25).game
    const second = step(first, 0.25).game
    const earned = (from: Game, to: Game) => to.insight - from.insight - solve(from).insight * 0.25
    expect(earned(game, first)).toBeCloseTo(20)
    expect(earned(first, second)).toBeCloseTo(0)
    expect(first.servedKinds).toContain('write')
  })
})

describe('incidents per the GDD', () => {
  const spiked = (seed: number, users = 1_050): Game =>
    forceIncident({ ...preseedGame(seed), users }, solve(preseedGame(seed)), 'spike') as Game

  test('a spike multiplies demand by 3 to 10, the same for the same seed', () => {
    const magnitudes = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => spiked(seed).incident?.magnitude ?? 0)
    for (const magnitude of magnitudes) {
      expect(magnitude).toBeGreaterThanOrEqual(3)
      expect(magnitude).toBeLessThanOrEqual(10)
    }
    expect(new Set(magnitudes).size).toBeGreaterThan(4)
    expect(spiked(3).incident?.magnitude).toBe(spiked(3).incident?.magnitude)
    const game = spiked(3)
    expect(solve(game).demand).toBeCloseTo(
      solve({ ...game, incident: null }).demand * (game.incident?.magnitude ?? 0),
    )
  })

  test('an unmitigated spike escalates halfway; a Design with headroom does not', () => {
    const halfway = (game: Game) => run(game, 16).game.incident
    // The Pre-seed box at 5,000 users fails under any spike.
    const weak = halfway(spiked(3, 5_000))
    expect(weak?.severity).toBe(2)
    expect(weak?.magnitude).toBeCloseTo((spiked(3).incident?.magnitude ?? 0) * 1.5)
    // A few users on the same box ride it out.
    const strong = halfway(spiked(3, 30))
    expect(strong?.severity).toBe(3)
  })

  test('incidents start about 12 minutes apart, ± 40%, at design pace', () => {
    let game: Game = { ...preseedGame(), nextIncidentAt: 0 }
    const ledger = solve(game)
    const gaps: Array<number> = []
    for (let index = 0; index < 40; index += 1) {
      const directed = directIncidents(
        { ...game, incident: null },
        ledger,
        DESIGN_TUNING.incidentGap,
      )
      gaps.push(directed.game.nextIncidentAt - game.time)
      game = { ...directed.game, incident: null, time: directed.game.nextIncidentAt }
    }
    for (const gap of gaps) {
      expect(gap).toBeGreaterThanOrEqual(12 * 60 * 0.6 - 1e-9)
      expect(gap).toBeLessThanOrEqual(12 * 60 * 1.4 + 1e-9)
    }
    const mean = gaps.reduce((total, gap) => total + gap, 0) / gaps.length
    expect(Math.abs(mean - 12 * 60)).toBeLessThan(12 * 60 * 0.15)
  })
})
