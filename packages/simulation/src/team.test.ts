import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import type { Action } from './actions.ts'
import {
  CALENDAR_DAY,
  DESIGN_TUNING,
  ERAS,
  LANGUAGES,
  LIVE_TUNING,
  SALARY_BASE,
  SIGNING_BASE,
} from './catalog.ts'
import { newGame, preseedGame } from './company.ts'
import type { Ledger } from './ledger.ts'
import { solveFlow } from './solve.ts'
import type { Engineer, Game } from './state.ts'
import { devHoursRate, effectiveEngineers, signingOf, teamOutputs } from './team.ts'
import { advanceTeam, hire, layoff } from './work.ts'

/* 08 "Dev Hours", "Hiring", and "Coordination", at the design's calendar unless a test says otherwise. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

/** The Ledger with the Stack's velocity pinned, so Dev Hours read in round numbers. */
const at = (game: Game, velocity = 1): Ledger => ({ ...solveFlow(game), velocity })

const preseed = (): Game => ({ ...preseedGame(), cash: 1e6, autopilot: false })

const engineer = (id: string, hiredAt = -1e6, team = 'core'): Engineer => ({
  id,
  team,
  language: 'php',
  hiredAt,
})

describe('coordination', () => {
  test('effective engineers match the table in 08 "Coordination"', () => {
    const table: ReadonlyArray<readonly [number, number]> = [
      [1, 1],
      [5, 3.8],
      [10, 5.7],
      [20, 7.5],
      [40, 8.4],
      [80, 8.1],
    ]
    for (const [n, expected] of table)
      expect([n, Math.abs(effectiveEngineers(n) - expected) <= 0.05]).toEqual([n, true])
  })

  test('a structured framework coordinates better, and nobody is no one', () => {
    expect(effectiveEngineers(10, true)).toBeGreaterThan(effectiveEngineers(10))
    expect(effectiveEngineers(0)).toBe(0)
  })
})

describe('Dev Hours', () => {
  test('the founder makes 0.8 Dev Hours per calendar hour at velocity 1', () => {
    const game: Game = { ...newGame(), autopilot: false }
    expect(devHoursRate(game, at(game), DESIGN_TUNING) * 60).toBeCloseTo(0.8)
    let current = game
    for (let second = 0; second < 60; second += 1)
      current = advanceTeam(
        { ...current, time: current.time + 1 },
        at(current),
        1,
        DESIGN_TUNING,
      ).game
    // With nothing on the backlog, they go to the pool.
    expect(current.devHours).toBeCloseTo(0.8)
  })

  test('the live game makes Dev Hours at its growth pace', () => {
    const game = newGame()
    expect(devHoursRate(game, at(game), LIVE_TUNING)).toBeCloseTo(
      devHoursRate(game, at(game), DESIGN_TUNING) * LIVE_TUNING.pace,
    )
  })

  test('a Sandbox has no Team', () => {
    const game: Game = { ...newGame(), sandbox: true }
    expect(devHoursRate(game, at(game))).toBe(0)
    expect(Result.isFailure(hire({ ...game, stage: 1, cash: 1e6 }))).toBe(true)
  })
})

describe('hiring', () => {
  test('opens in the Pre-seed Era', () => {
    expect(Result.isFailure(hire({ ...newGame(), cash: 1e6 }))).toBe(true)
    expect(Result.isSuccess(hire(preseed()))).toBe(true)
  })

  test('a hire joins after the time to hire, then works at 30% for a calendar week', () => {
    const start = preseed()
    const signed = ok(hire(start, DESIGN_TUNING))
    expect(start.cash - signed.cash).toBe(signingOf(start, 'php'))
    const offer = signed.hires[0]
    expect(offer && offer.readyAt - signed.time).toBe(CALENDAR_DAY * LANGUAGES.php.hireTime)
    const joined = advanceTeam(
      { ...signed, time: offer?.readyAt ?? 0 },
      at(signed),
      0,
      DESIGN_TUNING,
    ).game
    expect(joined.engineers).toHaveLength(1)
    const ramping = teamOutputs(joined, at(joined), DESIGN_TUNING)[0]
    expect(ramping?.effective).toBeCloseTo((effectiveEngineers(2) * (0.8 + 0.3)) / 2)
    const week: Game = { ...joined, time: joined.time + 7 * CALENDAR_DAY }
    const full = teamOutputs(week, at(week), DESIGN_TUNING)[0]
    expect(full?.effective).toBeCloseTo((effectiveEngineers(2) * (0.8 + 1)) / 2)
  })

  test('Rails halves the ramp-up', () => {
    const rails: Game = {
      ...preseed(),
      nodes: preseed().nodes.map((node) =>
        node.type === 'server' ? { ...node, runtime: 'puma', framework: 'rails' } : node,
      ),
      engineers: [engineer('e1', 0)],
      time: 3.6 * CALENDAR_DAY,
    }
    const output = teamOutputs(rails, at(rails), DESIGN_TUNING)[0]
    expect(output?.effective).toBeCloseTo((effectiveEngineers(2) * (0.8 + 1)) / 2)
  })

  test('each engineer adds 0.40 × the salary index × their language to Burn', () => {
    const base = preseed()
    const staffed: Game = { ...base, engineers: [engineer('e1')] }
    const salary = SALARY_BASE * (ERAS[1]?.salaryIndex ?? 0) * LANGUAGES.php.salary
    expect(solveFlow(staffed).burn - solveFlow(base).burn).toBeCloseTo(salary)
    expect(solveFlow(staffed).salaries).toBeCloseTo(salary)
  })

  test('the signing cost is $2,000 × the salary factor in Pre-seed, and scales with the Era', () => {
    expect(signingOf(preseed(), 'node')).toBe(SIGNING_BASE)
    expect(signingOf(preseed(), 'php')).toBe(SIGNING_BASE * LANGUAGES.php.salary)
    const seed: Game = { ...preseed(), stage: 2 }
    expect(signingOf(seed, 'node')).toBe(
      Math.round(SIGNING_BASE * ((ERAS[2]?.salaryIndex ?? 0) / (ERAS[1]?.salaryIndex ?? 1))),
    )
  })

  test('a layoff ends the salary and costs the rest of the team 10% velocity for a week', () => {
    const staffed: Game = { ...preseed(), engineers: [engineer('e1'), engineer('e2')] }
    const after = ok(layoff(staffed, 'e2', DESIGN_TUNING))
    expect(after.engineers).toHaveLength(1)
    expect(solveFlow(staffed).salaries - solveFlow(after).salaries).toBeGreaterThan(0)
    const hurt = teamOutputs(after, at(after), DESIGN_TUNING)[0]?.velocity ?? 0
    const healed: Game = { ...after, time: after.time + 7 * CALENDAR_DAY }
    expect(hurt / (teamOutputs(healed, at(healed), DESIGN_TUNING)[0]?.velocity ?? 1)).toBeCloseTo(
      0.9,
    )
  })
})
