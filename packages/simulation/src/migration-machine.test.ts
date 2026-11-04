import { Schema } from 'effect'
import { describe, expect, test } from 'vitest'
import { MIGRATION_STEPS } from './catalog.ts'
import { fixed, isReady, shifted, stepOf, trancheBuilt, type StackTarget } from './migration.ts'
import { MigrationState, type Migration } from './state.ts'

/* ==========================================================================
   The migration machine: Building → Ready → Building, and Finishing once
   every App Server moved. An event that does not fit leaves it unchanged.
   ========================================================================== */

const stack: StackTarget = { runtime: 'node', framework: 'none' }
const from: StackTarget = { runtime: 'php_fpm', framework: 'none' }

type BuildingRun = Extract<Migration, { _tag: 'Building' }>

const building = (step = 0, bugs = false): BuildingRun => ({
  _tag: 'Building',
  runtime: stack.runtime,
  framework: stack.framework,
  fromRuntime: from.runtime,
  fromFramework: from.framework,
  total: 40,
  step,
  bugs,
})

const ready = (step = 0, bugs = false): Extract<Migration, { _tag: 'Ready' }> => ({
  ...building(step, bugs),
  _tag: 'Ready',
  step,
})

const finishing = (bugs = true): Migration => ({
  _tag: 'Finishing',
  runtime: stack.runtime,
  framework: stack.framework,
  fromRuntime: from.runtime,
  fromFramework: from.framework,
  total: 40,
  bugs,
})

describe('the migration machine', () => {
  test('a built tranche makes the next step ready, and only from Building', () => {
    const built = trancheBuilt(building(1))
    expect(isReady(built)).toBe(true)
    expect(stepOf(built)).toBe(1)
    expect(trancheBuilt(ready(1))).toEqual(ready(1))
    expect(trancheBuilt(finishing())).toEqual(finishing())
  })

  test('a shift moves to the next Building step, and the last one ends or finishes', () => {
    const moved = shifted(ready(0), true)
    expect(moved).toEqual(building(1, true))

    // The last App Server moves: bugs remain only if that move revealed them.
    expect(shifted(ready(MIGRATION_STEPS.length - 1, false), false)).toBeNull()
    expect(shifted(ready(MIGRATION_STEPS.length - 1, false), true)).toEqual(finishing(true))
    // An earlier step carries its bugs forward.
    expect(shifted(ready(1, true), false)).toEqual(building(2, true))
  })

  test('a shift that is not ready changes nothing', () => {
    expect(shifted(building(1), true)).toEqual(building(1))
    expect(shifted(finishing(), true)).toEqual(finishing())
  })

  test('fixing bugs ends a finished migration and clears a running one', () => {
    expect(fixed(finishing())).toBeNull()
    expect(fixed(building(1, true))).toEqual(building(1, false))
    expect(fixed(ready(2, true))).toEqual(ready(2, false))
    expect(stepOf(finishing())).toBe(MIGRATION_STEPS.length)
  })

  test('a save from before the machine derives the state, and a new save writes it', () => {
    const legacy = {
      runtime: stack.runtime,
      framework: stack.framework,
      fromRuntime: from.runtime,
      fromFramework: from.framework,
      total: 40,
      step: 4,
      ready: false,
      bugs: true,
    }
    const decoded = Schema.decodeSync(MigrationState)(legacy)
    expect(decoded).toEqual(finishing(true))

    const saved = Schema.encodeSync(MigrationState)(decoded)
    expect(saved._tag).toBe('Finishing')
    expect(saved && 'ready' in saved).toBe(false)
  })
})
