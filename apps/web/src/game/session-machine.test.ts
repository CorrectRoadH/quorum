import { describe, expect, test } from 'vitest'
import {
  sessionMachine,
  sessionStep,
  type Session,
  type SessionEvent,
  type SandboxRun,
} from './session-machine.ts'
import type { ChallengeRun } from './challenge-machine.ts'

/* ==========================================================================
   A board plays one thing at a time. Opening a Sandbox cannot leave a
   Challenge open, and a stale message cannot open one twice.
   ========================================================================== */

const sandbox: SandboxRun = { id: null, progress: { objective: 0, held: 0, fired: false } }

const challenge: ChallengeRun = {
  _tag: 'Building',
  id: 'hello-world',
  totals: {
    step: 0,
    scored: 0,
    burn: 0,
    tail: 0,
    served: 0,
    failed: 0,
    refused: 0,
    demand: 0,
    revenue: 0,
    kinds: {},
  },
}

const company: Session = { _tag: 'Company' }
const move = (session: Session, event: SessionEvent) => sessionStep(session, event)

describe('the session machine', () => {
  test('a Sandbox opens from the Company, and closes back to it', () => {
    const opened = move(company, { _tag: 'SandboxOpened', run: sandbox })
    expect(opened._tag).toBe('Sandbox')
    expect(move(opened, { _tag: 'Closed' })).toEqual(company)
  })

  test('opening another board replaces the one that is open', () => {
    const sandboxed = move(company, { _tag: 'SandboxOpened', run: sandbox })
    const switched = move(sandboxed, { _tag: 'ChallengeOpened', run: challenge })
    expect(switched).toEqual({ _tag: 'Challenge', run: challenge })
    const back = move(switched, { _tag: 'SandboxOpened', run: sandbox })
    expect(back).toEqual({ _tag: 'Sandbox', run: sandbox })
    expect(move(back, { _tag: 'Closed' })).toEqual(company)
  })

  test('an update keeps the session it belongs to', () => {
    const sandboxed = move(company, { _tag: 'SandboxOpened', run: sandbox })
    const nextSandbox = { ...sandbox, progress: { ...sandbox.progress, held: 1 } }
    expect(move(sandboxed, { _tag: 'SandboxUpdated', run: nextSandbox })).toEqual({
      _tag: 'Sandbox',
      run: nextSandbox,
    })
    expect(move(company, { _tag: 'ChallengeUpdated', run: challenge })).toEqual(company)
  })

  test('every state is reachable and no edge is dead', () => {
    expect(sessionMachine.unreachableStates()).toEqual([])
    expect(sessionMachine.deadTransitions()).toEqual([])
    expect(sessionMachine.stateTags).toEqual(['Company', 'Sandbox', 'Challenge'])
  })
})
