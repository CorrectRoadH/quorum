import { Option } from 'effect'
import { expect, test } from 'vitest'
import { SIM_VERSION } from '@quorum/simulation/version'
import { crashTagsOf } from './crash-context.ts'
import { initialModel } from './update.ts'

test('a crash report carries labels only, never the Model or a Message payload', () => {
  const model = {
    ...initialModel(),
    saves: { ...initialModel().saves, current: 'secret-company-id' },
  }
  const tags = crashTagsOf(model, Option.some({ _tag: 'NodePlaced', x: 4, y: 9 }))

  expect(tags).toEqual({
    message: 'NodePlaced',
    route: 'Title',
    session: 'Company',
    era: 0,
    sim_version: SIM_VERSION,
  })
  expect(JSON.stringify(tags)).not.toContain('secret-company-id')
  expect(crashTagsOf(model, Option.none()).message).toBe('none')
})
