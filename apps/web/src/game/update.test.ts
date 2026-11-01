import { describe, expect, test } from 'vitest'
import { newGame } from './engine/company.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { initialModel, update } from './update.ts'

/* The clock: 100 ms Steps under a 250 ms UI tick, and the Bottleneck search once per sim second. */

const tick = (model: Model, times = 1): Model => {
  let current = model
  for (let index = 0; index < times; index += 1) current = update(current, Message.Ticked()).model
  return current
}

const inLab = (): Model => ({ ...initialModel(), route: 'lab', game: newGame() })

describe('the clock', () => {
  test('four ticks at 1× run ten 0.1 s Steps: one sim second', () => {
    const start = inLab()
    expect(tick(start, 2).game.time).toBeCloseTo(start.game.time + 0.5)
    expect(tick(start, 4).game.time).toBe(start.game.time + 1)
  })

  test('3× runs three times the Steps', () => {
    const start = { ...inLab(), speed: 3 }
    expect(tick(start, 4).game.time).toBe(start.game.time + 3)
  })

  test('the Bottleneck search runs once per sim second, and again after an action', () => {
    const first = tick(inLab())
    expect(first.bottleneckAt).toBe(Math.floor(first.game.time))
    const second = tick(first)
    expect(second.bottleneckAt).toBe(first.bottleneckAt)
    const acted = update(second, Message.ResizeChosen({ nodeId: 'server', direction: 1 })).model
    expect(acted.bottleneckAt).toBe(-1)
    expect(tick(acted).bottleneckAt).toBe(Math.floor(tick(acted).game.time))
  })
})
