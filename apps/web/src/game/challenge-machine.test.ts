import { describe, expect, test } from 'vitest'
import { newGame } from '@quorum/simulation/company'
import { NO_TOTALS, type ChallengeResult } from '@quorum/simulation/challenges'
import { SIM_VERSION } from '@quorum/simulation/version'
import type { ChallengeVerdict } from '@quorum/rpc'
import {
  challengeMachine,
  challengeStep,
  type ChallengeEvent,
  type ChallengeRun,
} from './challenge-machine.ts'

/* ==========================================================================
   The Challenge flow's contract: which events may move it, and which must be
   ignored. A stale server reply or a click that no longer fits cannot corrupt
   a run.
   ========================================================================== */

const replay = {
  v: 1 as const,
  challenge: 'hello-world',
  simVersion: SIM_VERSION,
  design: { nodes: [], links: [] },
  actions: [],
}

const result: ChallengeResult = {
  passed: true,
  cost: 0.05,
  tail: 880,
  complexity: 2,
  errors: 0,
  refused: 0,
  margin: 0.4,
  missed: null,
  hash: '00000000',
}

const verdict: ChallengeVerdict = {
  passed: true,
  missed: null,
  score: { cost: 0.05, tail: 880, complexity: 2 },
  best: { cost: 0.05, tail: 880, complexity: 2 },
  percentiles: { cost: 0.5, tail: 0.5, complexity: 0 },
}

const building: ChallengeRun = { _tag: 'Building', id: 'hello-world', totals: NO_TOTALS }

const running: ChallengeRun = {
  _tag: 'Running',
  id: 'hello-world',
  totals: NO_TOTALS,
  board: newGame(),
  replay,
}

const scored: ChallengeRun = {
  _tag: 'Result',
  id: 'hello-world',
  totals: NO_TOTALS,
  board: newGame(),
  replay,
  result,
  verdict: null,
  verification: 'sending',
  note: null,
}

const move = (run: ChallengeRun, event: ChallengeEvent) => challengeStep(run, event)

describe('the Challenge machine', () => {
  test('Run starts a run only from the build board', () => {
    const started = move(building, { _tag: 'Run', board: newGame(), replay })
    expect(started._tag).toBe('Running')
    expect(started._tag === 'Running' ? started.replay : null).toBe(replay)
    // A second Run cannot restart a run in progress.
    expect(move(running, { _tag: 'Run', board: newGame(), replay })).toBe(running)
  })

  test('a server reply lands only on a scored run', () => {
    // A stale reply that arrives after Rebuild must not touch the build board.
    expect(move(building, { _tag: 'Verified', verdict })).toBe(building)
    expect(move(running, { _tag: 'Verified', verdict })).toBe(running)
    const verified = move(scored, { _tag: 'Verified', verdict })
    expect(verified._tag).toBe('Result')
    expect(verified._tag === 'Result' ? verified.verification : null).toBe('verified')
    expect(verified._tag === 'Result' ? verified.verdict : null).toBe(verdict)
  })

  test('an unverified result keeps the note and its offline cause', () => {
    const offline = move(scored, { _tag: 'Unverified', message: 'Failed to fetch', offline: true })
    expect(offline._tag === 'Result' ? offline.verification : null).toBe('offline')
    expect(offline._tag === 'Result' ? offline.note : null).toBe('Failed to fetch')
  })

  test('Rebuild returns to the build board and clears the run', () => {
    const rebuilt = move(scored, { _tag: 'Rebuilt' })
    expect(rebuilt).toEqual(building)
    expect(move(running, { _tag: 'Rebuilt' })).toEqual(building)
    // There is nothing to rebuild before Run.
    expect(move(building, { _tag: 'Rebuilt' })).toBe(building)
  })

  test('the clock and logged actions move only a run in progress', () => {
    const totals = { ...NO_TOTALS, step: 4 }
    expect(move(building, { _tag: 'Ticked', totals })).toBe(building)
    const ticked = move(running, { _tag: 'Ticked', totals })
    expect(ticked._tag === 'Running' ? ticked.totals.step : null).toBe(4)

    const logged = move(running, {
      _tag: 'ActionLogged',
      action: { _tag: 'Restart', node: 'server' },
    })
    expect(logged._tag === 'Running' ? logged.replay.actions : null).toEqual([
      { step: 0, action: { _tag: 'Restart', node: 'server' } },
    ])
    expect(
      move(scored, { _tag: 'ActionLogged', action: { _tag: 'Restart', node: 'server' } }),
    ).toBe(scored)
  })

  test('every phase is reachable and no edge is dead', () => {
    expect(challengeMachine.unreachableStates()).toEqual([])
    expect(challengeMachine.deadTransitions()).toEqual([])
    expect(challengeMachine.stateTags).toEqual(['Building', 'Running', 'Result'])
  })
})
