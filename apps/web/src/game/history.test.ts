import { expect, test } from 'vitest'
import type { Sample } from '@quorum/simulation/state'
import { EMPTY_HISTORY, TIERS, historyOfSave, newSamples, record, startOf } from './history.ts'

const sample = (p99: number, users = 100): Sample => ({
  users,
  demand: 10,
  served: 10,
  revenue: 1,
  burn: 1,
  latency: 20,
  p99,
  apdex: 1,
  errors: 0,
})

test('blocks split at the clock quarter and keep min, max, sum, and count', () => {
  // Sim seconds 14, 15, 16 are 14:14, 14:15, 14:16: the second and third share a quarter.
  const history = record(EMPTY_HISTORY, [sample(30), sample(90), sample(50)], 16)
  expect(history.quarter.map((block) => block.count)).toEqual([1, 2])
  const [first, second] = history.quarter
  expect(startOf(first!.index, 'quarter')).toBe(0)
  expect(startOf(second!.index, 'quarter')).toBe(15)
  expect(second!.min.p99).toBe(50)
  expect(second!.max.p99).toBe(90)
  expect(second!.sum.p99).toBe(140)
  expect(history.hour.map((block) => block.count)).toEqual([3])
})

test('a Game that went back in time drops the blocks after it', () => {
  const later = record(EMPTY_HISTORY, [sample(10)], 200)
  const reset = record(later, [sample(20)], 3)
  expect(reset.quarter.map((block) => block.max.p99)).toEqual([20])
})

test('each resolution keeps only its window', () => {
  let history = EMPTY_HISTORY
  for (let block = 0; block < TIERS.quarter.keep + 5; block += 1)
    history = record(history, [sample(block)], block * 15)
  expect(history.quarter).toHaveLength(TIERS.quarter.keep)
  expect(history.quarter[0]?.max.p99).toBe(5)
})

test('a tick adds one Sample per sim second it crossed', () => {
  const kept = [sample(1), sample(2), sample(3)]
  expect(newSamples(kept, 9.7, 11.2).map((entry) => entry.p99)).toEqual([2, 3])
  expect(newSamples(kept, 9.1, 9.9)).toEqual([])
})

test('the save round-trips the blocks, and an old or broken save starts empty', () => {
  const history = record(EMPTY_HISTORY, [sample(30), sample(90)], 16)
  const saved = JSON.parse(JSON.stringify({ time: 16, dashboard: history }))
  expect(historyOfSave(saved)).toEqual(history)
  expect(historyOfSave({ time: 16 })).toEqual(EMPTY_HISTORY)
  expect(historyOfSave({ dashboard: { quarter: 'x' } })).toEqual(EMPTY_HISTORY)
})
