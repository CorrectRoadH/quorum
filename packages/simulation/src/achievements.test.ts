import { describe, expect, test } from 'vitest'
import {
  challengeAchievements,
  countStats,
  detectAchievements,
  everyVenture,
  type Moment,
} from './achievements.ts'
import { ACHIEVEMENTS, ACHIEVEMENT_IDS, MUTATOR_IDS, VENTURE_IDS } from './catalog.ts'
import { newGame } from './company.ts'
import { StepEvent } from './events.ts'
import {
  earnAchievements,
  emptyFounder,
  recordExit,
  toggleMutator,
  unlockVenture,
} from './founder.ts'
import type { Ledger } from './ledger.ts'
import { solveFlow } from './solve.ts'
import type { Game, GameNode, Postmortem } from './state.ts'
import { Result } from 'effect'

/* Achievements (14): each fires on its moment, not on a near miss, and never in a Sandbox. */

const base = newGame(7)
const ledgerOf = (game: Game, change: Partial<Ledger> = {}): Ledger => ({
  ...solveFlow(game),
  ...change,
})
const moment = (change: Partial<Moment> = {}): Moment => ({
  before: base,
  after: base,
  ledger: ledgerOf(base),
  events: [],
  stats: { postmortems: 0, terminations: 0 },
  ...change,
})
const earned = (change: Partial<Moment>) => detectAchievements(moment(change), [])
const postmortem = (change: Partial<Postmortem>): Postmortem => ({
  id: 1,
  kind: 'instance',
  target: null,
  duration: 60,
  mttr: 30,
  lostUsers: 0,
  lostRevenue: 0,
  failed: 0,
  action: null,
  severity: 3,
  ...change,
})
const resolved = (change: Partial<Postmortem>) =>
  StepEvent.IncidentResolved({ postmortem: postmortem(change) })
const withNodes = (game: Game, nodes: ReadonlyArray<Partial<GameNode>>): Game => ({
  ...game,
  nodes: nodes.map((node, at) => ({ ...base.nodes[0]!, id: `n${at}`, ...node })),
})

describe('achievements', () => {
  test('every achievement has a name and a condition, and unlocks follow GDD 13/14', () => {
    for (const id of ACHIEVEMENT_IDS) expect(ACHIEVEMENTS[id].name.length).toBeGreaterThan(0)
    expect(ACHIEVEMENTS['default-alive'].unlocks?.venture).toBe('bootstrapped')
    expect(ACHIEVEMENTS['chaos-monkey'].unlocks?.mutator).toBe('chaos-monkey')
  })

  test('Hello, World needs a served request', () => {
    expect(earned({ ledger: ledgerOf(base, { served: 1 }) })).toContain('hello-world')
    expect(earned({ ledger: ledgerOf(base, { served: 0 }) })).not.toContain('hello-world')
  })

  test('a bad deploy, not a good one, is It Works on My Machine', () => {
    const bad = StepEvent.Deployed({ features: [], bad: true })
    const good = StepEvent.Deployed({ features: [], bad: false })
    expect(earned({ events: [bad] })).toContain('works-on-my-machine')
    expect(earned({ events: [good] })).not.toContain('works-on-my-machine')
  })

  test('Split Brain fires when the first database Node appears', () => {
    const before = withNodes(base, [{ type: 'server' }])
    const after = withNodes(base, [{ type: 'server' }, { type: 'database' }])
    expect(earned({ before, after })).toContain('split-brain')
    expect(earned({ before: after, after })).not.toContain('split-brain')
  })

  test('Metastable needs a retry storm resolved', () => {
    expect(earned({ events: [resolved({ kind: 'retry-storm' })] })).toContain('metastable')
    expect(earned({ events: [resolved({ kind: 'spike' })] })).not.toContain('metastable')
  })

  test('Polyglot needs five languages on compute Nodes', () => {
    const runtimes = ['php_fpm', 'puma', 'node', 'go', 'tokio'] as const
    const five = withNodes(
      base,
      runtimes.map((runtime) => ({ type: 'server' as const, runtime })),
    )
    const four = withNodes(
      base,
      runtimes.slice(0, 4).map((runtime) => ({ type: 'server' as const, runtime })),
    )
    expect(earned({ after: five })).toContain('polyglot')
    expect(earned({ after: four })).not.toContain('polyglot')
  })

  test('Hug of Death needs a ×10 spike resolved with no users lost', () => {
    const spiking = {
      ...base,
      incident: {
        kind: 'spike' as const,
        remaining: 1,
        nodeId: null,
        startedAt: 0,
        baseline: 0,
        usersAtStart: 0,
        impaired: 0,
        lostRevenue: 0,
        failed: 0,
        severity: 3,
        magnitude: 10,
        zone: null,
        region: null,
      },
    }
    const clean = [resolved({ kind: 'spike', lostUsers: 0 })]
    expect(earned({ before: spiking, events: clean })).toContain('hug-of-death')
    expect(
      earned({ before: spiking, events: [resolved({ kind: 'spike', lostUsers: 5 })] }),
    ).not.toContain('hug-of-death')
    const small = { ...spiking, incident: { ...spiking.incident, magnitude: 3 } }
    expect(earned({ before: small, events: clean })).not.toContain('hug-of-death')
  })

  test('the counting achievements count across Companies', () => {
    const stats = countStats({ postmortems: 49, terminations: 99 }, [
      resolved({ kind: 'instance' }),
    ])
    expect(stats).toEqual({ postmortems: 50, terminations: 100 })
    expect(earned({ stats })).toEqual(expect.arrayContaining(['blameless', 'chaos-monkey']))
    expect(earned({ stats: { postmortems: 49, terminations: 99 } })).not.toContain('blameless')
  })

  test('Default Alive needs the IPO with no round raised', () => {
    const preIpo = { ...base, stage: 6, equity: 0.9 }
    const listed = { ...preIpo, stage: 7 }
    expect(earned({ before: preIpo, after: listed })).toContain('default-alive')
    const raised = { ...preIpo, equity: 0.6 }
    expect(earned({ before: raised, after: { ...raised, stage: 7 } })).not.toContain(
      'default-alive',
    )
  })

  test('Beat and Raise needs eight beats in a row', () => {
    const quarter = (streak: number): Game => ({
      ...base,
      stage: 7,
      quarter: {
        index: 0,
        startedAt: 0,
        growth: 0,
        margin: 0,
        revenue: 0,
        streak,
        bonus: 0,
        last: null,
      },
    })
    expect(earned({ after: quarter(8) })).toContain('beat-and-raise')
    expect(earned({ after: quarter(7) })).not.toContain('beat-and-raise')
  })

  test('a Sandbox earns nothing, and owned achievements are not earned twice', () => {
    const sandbox = { ...base, sandbox: true }
    expect(earned({ after: sandbox, ledger: ledgerOf(base, { served: 1 }) })).toEqual([])
    expect(
      detectAchievements(moment({ ledger: ledgerOf(base, { served: 1 }) }), ['hello-world']),
    ).not.toContain('hello-world')
  })

  test('Challenge percentiles earn Histogram and Pareto', () => {
    expect(challengeAchievements([0.91, 0.1, 0.1])).toEqual(['histogram'])
    expect(challengeAchievements([0.7, 0.75, 0.8])).toEqual(['pareto'])
    expect(challengeAchievements([0.89, 0.69, 0.9])).toEqual(['histogram'])
    expect(challengeAchievements([0.5, 0.5, 0.5])).toEqual([])
  })

  test('Serial founder needs an Exit with every Venture', () => {
    expect(everyVenture(VENTURE_IDS)).toBe(true)
    expect(everyVenture(VENTURE_IDS.slice(1))).toBe(false)
  })
})

describe('achievement unlocks', () => {
  test('Default Alive opens Bootstrapped; an Exit does not', () => {
    const row = {
      exit: 'acquisition',
      founding: base.founding,
      time: 0,
      peak: 0,
      stage: 4,
      payout: 0,
      legacy: 1,
      stack: [],
      snapshot: { nodes: [], links: [] },
    } as never
    const exited = recordExit(emptyFounder(), { legacy: 1, row } as never)
    expect(exited.mutators).not.toContain('no-caches')
    expect(Result.isFailure(unlockVenture(exited, 'bootstrapped'))).toBe(true)
    const alive = earnAchievements(emptyFounder(), ['default-alive'])
    expect(alive.ventures).toContain('bootstrapped')
    expect(Result.isSuccess(unlockVenture(alive, 'bootstrapped'))).toBe(true)
  })

  test('a Mutator opens with its achievement, and earning twice changes nothing', () => {
    expect(Result.isFailure(toggleMutator(emptyFounder(), 'no-caches'))).toBe(true)
    const once = earnAchievements(emptyFounder(), ['no-cache', 'no-cache'])
    expect(once.achievements).toEqual(['no-cache'])
    expect(once.mutators).toEqual(['no-caches'])
    expect(earnAchievements(once, ['no-cache'])).toBe(once)
    expect(Result.isSuccess(toggleMutator(once, 'no-caches'))).toBe(true)
    expect(MUTATOR_IDS).toContain('no-caches')
  })
})
