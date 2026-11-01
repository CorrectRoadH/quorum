import { describe, expect, test } from 'vitest'
import { newGame, preseedGame } from '@template/simulation/company'
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

describe('Tradeoff cards', () => {
  const option = { kind: 'runtime', id: 'node_cluster' } as const
  const ready = (): Model => ({
    ...initialModel(),
    route: 'lab',
    selected: 'server',
    game: {
      ...preseedGame(),
      users: 4_000,
      researched: [...preseedGame().researched, 'lang-node', 'node-cluster'],
    },
  })
  const send = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
    messages.reduce((current, message) => update(current, message).model, model)

  test('hovering previews; leaving closes; the Game does not change', () => {
    const start = ready()
    const hovered = send(start, Message.OptionPreviewed({ nodeId: 'server', option }))
    expect(hovered.tradeoff?.pinned).toBe(false)
    expect(hovered.tradeoff?.preview?.after.revenue).toBeGreaterThan(
      hovered.tradeoff?.preview?.before.revenue ?? Infinity,
    )
    expect(hovered.game).toBe(start.game)
    expect(send(hovered, Message.OptionLeft()).tradeoff).toBeNull()
  })

  test('the first click pins the card; Confirm applies it; the second time a click applies it', () => {
    const pinned = send(ready(), Message.OptionChosen({ nodeId: 'server', option }))
    expect(pinned.tradeoff?.pinned).toBe(true)
    expect(pinned.game.nodes.find((node) => node.id === 'server')?.runtime).toBe('php_fpm')
    // Leaving the option keeps a pinned card open.
    expect(send(pinned, Message.OptionLeft()).tradeoff?.pinned).toBe(true)
    const confirmed = send(pinned, Message.OptionConfirmed())
    expect(confirmed.tradeoff).toBeNull()
    expect(confirmed.seenTradeoffs).toEqual(['runtime'])
    expect(confirmed.game.nodes.find((node) => node.id === 'server')?.runtime).toBe('node_cluster')
    expect(confirmed.change).not.toBeNull()
    const back = send(
      confirmed,
      Message.OptionChosen({ nodeId: 'server', option: { kind: 'runtime', id: 'php_fpm' } }),
    )
    expect(back.game.nodes.find((node) => node.id === 'server')?.runtime).toBe('php_fpm')
  })

  test('Escape and Cancel close the card without changing anything', () => {
    const pinned = send(ready(), Message.OptionChosen({ nodeId: 'server', option }))
    expect(send(pinned, Message.KeyPressed({ key: 'Escape' })).tradeoff).toBeNull()
    expect(send(pinned, Message.TradeoffClosed()).game).toBe(pinned.game)
  })

  test('a locked option shows why, and Confirm does nothing', () => {
    const locked = { ...ready(), game: preseedGame() }
    const pinned = send(locked, Message.OptionChosen({ nodeId: 'server', option }))
    expect(pinned.tradeoff?.refusal).toBeTruthy()
    expect(send(pinned, Message.OptionConfirmed()).game.nodes).toEqual(locked.game.nodes)
  })
})
