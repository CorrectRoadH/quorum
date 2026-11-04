import { describe, expect, test } from 'vitest'
import { bootMachine, bootStep, type Boot, type BootEvent } from './boot-machine.ts'

/* ==========================================================================
   The boot sequence's contract: the title reveals once, the connect animation
   only starts from the ready state, and an event out of order changes nothing.
   ========================================================================== */

const shut: Boot = { _tag: 'Shut' }
const move = (boot: Boot, event: BootEvent) => bootStep(boot, event)

describe('the boot machine', () => {
  test('one clock-in opens the title', () => {
    const clocking = move(shut, { _tag: 'ClockedIn' })
    expect(clocking._tag).toBe('Clocking')
    expect(move(clocking, { _tag: 'ClockedIn' })).toBe(clocking)
    expect(move(clocking, { _tag: 'TitleRevealed' })._tag).toBe('Ready')
  })

  test('a reveal before the clock-in does nothing', () => {
    expect(move(shut, { _tag: 'TitleRevealed' })).toBe(shut)
    expect(move(shut, { _tag: 'Connected' })).toBe(shut)
    expect(move(shut, { _tag: 'BoardOpened' })).toBe(shut)
  })

  test('a board connects only from the ready state, and connects once', () => {
    const ready: Boot = { _tag: 'Ready' }
    const connecting = move(ready, { _tag: 'BoardOpened' })
    expect(connecting._tag).toBe('Connecting')
    expect(move(connecting, { _tag: 'BoardOpened' })).toBe(connecting)
    expect(move(connecting, { _tag: 'Connected' })._tag).toBe('Ready')
    expect(move(connecting, { _tag: 'TitleRevealed' })).toBe(connecting)
  })

  test('every state is reachable and no edge is dead', () => {
    // A fresh load is the second entry point: it starts at Shut, not at the machine's initial Ready.
    expect(bootMachine.unreachableStates(['Shut'])).toEqual([])
    expect(bootMachine.deadTransitions(['Shut'])).toEqual([])
    expect(bootMachine.stateTags).toEqual(['Shut', 'Clocking', 'Ready', 'Connecting'])
  })
})
