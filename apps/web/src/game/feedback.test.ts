import { describe, expect, test } from 'vitest'
import { newGame } from './engine/company.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { initialModel, update } from './update.ts'

/* Undo puts the Design back and reverses exactly the Cash the action moved. */

const send = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
  messages.reduce((current, message) => update(current, message).model, model)

const inLab = (): Model => ({
  ...initialModel(),
  route: 'lab',
  game: { ...newGame(), cash: 5_000 },
})

const placed = (): Model =>
  send(inLab(), Message.PlacingChosen({ type: 'database' }), Message.NodePlaced({ x: 760, y: 280 }))

describe('undo', () => {
  test('place, then undo, leaves Cash where it started', () => {
    const start = inLab()
    const model = send(placed(), Message.UndoChosen())
    expect(model.game.cash).toBe(start.game.cash)
    expect(model.game.nodes).toHaveLength(start.game.nodes.length)
  })

  test('sell, then undo, takes the refund back', () => {
    const before = placed()
    const id = before.game.nodes.at(-1)?.id ?? ''
    const sold = send(before, Message.NodeSold({ nodeId: id }))
    expect(sold.game.cash).toBeGreaterThan(before.game.cash)
    const undone = send(sold, Message.UndoChosen())
    expect(undone.game.nodes.some((node) => node.id === id)).toBe(true)
    expect(undone.game.cash).toBe(before.game.cash)
  })

  test('resize, then undo, refunds the resize in full', () => {
    const start = inLab()
    const resized = send(start, Message.ResizeChosen({ nodeId: 'server', direction: 1 }))
    expect(resized.game.cash).toBeLessThan(start.game.cash)
    const undone = send(resized, Message.UndoChosen())
    expect(undone.game.cash).toBe(start.game.cash)
    expect(undone.game.nodes.find((node) => node.id === 'server')?.size).toBe(1)
  })
})
