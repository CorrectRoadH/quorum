import { expect, test, vi } from 'vitest'

const load = async () => {
  vi.resetModules()
  return import('./analytics-budget.ts')
}

const NOW = Date.UTC(2026, 10, 4)

test('caps a session at 80 events, but lets a funnel event through', async () => {
  const budget = await load()
  for (let index = 0; index < budget.SESSION_LIMIT; index += 1)
    expect(budget.allow('game:heartbeat', NOW)).toBe(true)
  expect(budget.allow('game:heartbeat', NOW)).toBe(false)
  expect(budget.allow('company:era_reached', NOW)).toBe(true)
  expect(budget.allow('game:heartbeat', NOW)).toBe(false)
})

test('stops every event at the month cap, funnel included', async () => {
  const budget = await load()
  for (let index = 0; index < budget.MONTH_LIMIT; index += 1)
    expect(budget.allow('company:era_reached', NOW)).toBe(true)
  expect(budget.allow('company:founded', NOW)).toBe(false)
  expect(budget.allow('game:heartbeat', NOW)).toBe(false)
})
