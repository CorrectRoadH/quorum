import { describe, expect, test } from 'vitest'
import { newGame } from '@quorum/simulation/company'
import type { Ledger } from '@quorum/simulation/ledger'
import { solve } from '@quorum/simulation/solve'
import { STEADY_TICKS, advanceChange, beginChange, settleProgress } from './feedback.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { initialModel, update } from './update.ts'
import { AppRoute } from './route.ts'

/* Undo puts the Design back and reverses exactly the Cash the action moved; redo puts it forward. */

const send = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
  messages.reduce((current, message) => update(current, message).model, model)

const inLab = (): Model => ({
  ...initialModel(),
  route: AppRoute.Company(),
  board: { ...initialModel().board, game: { ...newGame(), cash: 5_000 } },
})

const placed = (): Model =>
  send(inLab(), Message.PlacingChosen({ type: 'database' }), Message.NodePlaced({ x: 760, y: 280 }))

describe('undo', () => {
  test('place, then undo, leaves Cash where it started', () => {
    const start = inLab()
    const model = send(placed(), Message.UndoChosen())
    expect(model.board.game.cash).toBe(start.board.game.cash)
    expect(model.board.game.nodes).toHaveLength(start.board.game.nodes.length)
  })

  test('sell, then undo, takes the refund back', () => {
    const before = placed()
    const id = before.board.game.nodes.at(-1)?.id ?? ''
    const sold = send(before, Message.NodeSold({ nodeId: id }))
    expect(sold.board.game.cash).toBeGreaterThan(before.board.game.cash)
    const undone = send(sold, Message.UndoChosen())
    expect(undone.board.game.nodes.some((node) => node.id === id)).toBe(true)
    expect(undone.board.game.cash).toBe(before.board.game.cash)
  })

  test('resize, then undo, refunds the resize in full', () => {
    const start = inLab()
    const resized = send(start, Message.ResizeChosen({ nodeId: 'server', direction: 1 }))
    expect(resized.board.game.cash).toBeLessThan(start.board.game.cash)
    const undone = send(resized, Message.UndoChosen())
    expect(undone.board.game.cash).toBe(start.board.game.cash)
    expect(undone.board.game.nodes.find((node) => node.id === 'server')?.size).toBe(1)
  })

  test('a paid resize tells the player Undo refunds it', () => {
    const start = inLab()
    const resized = send(start, Message.ResizeChosen({ nodeId: 'server', direction: 1 }))
    expect(resized.toast?.message).toContain('Undo (Z) refunds')
  })

  test('a big resize plays the purchase fanfare; a small one does not', () => {
    const resize = (size: number): { spent: number; sound: string } => {
      const game = newGame()
      const start = {
        ...inLab(),
        board: {
          ...inLab().board,
          game: {
            ...game,
            cash: 1_000_000,
            nodes: game.nodes.map((node) => (node.id === 'server' ? { ...node, size } : node)),
          },
        },
      }
      const { model, commands } = update(
        start,
        Message.ResizeChosen({ nodeId: 'server', direction: 1 }),
      )
      const play = commands?.find((command) => command.name === 'PlaySound')
      return { spent: start.board.game.cash - model.board.game.cash, sound: JSON.stringify(play) }
    }
    const small = resize(1)
    const big = resize(4)
    expect(small.spent).toBeLessThan(1_000)
    expect(small.sound).not.toContain('purchase')
    expect(big.spent).toBeGreaterThanOrEqual(1_000)
    expect(big.sound).toContain('purchase')
  })
})

const design = (model: Model) => ({ nodes: model.board.game.nodes, links: model.board.game.links })
const later = (model: Model, seconds: number): Model => ({
  ...model,
  board: { ...model.board, game: { ...model.board.game, time: model.board.game.time + seconds } },
})

describe('the undo and redo stack', () => {
  // Buy a Database, sell it, then resize the App Server: three actions that move Cash each way.
  const threeActions = (start: Model): Model => {
    const bought = send(
      start,
      Message.PlacingChosen({ type: 'database' }),
      Message.NodePlaced({ x: 760, y: 280 }),
    )
    const id = bought.board.game.nodes.at(-1)?.id ?? ''
    return send(
      bought,
      Message.NodeSold({ nodeId: id }),
      Message.ResizeChosen({ nodeId: 'server', direction: 1 }),
    )
  }

  test('three actions, then three undos, return the exact Design and Cash', () => {
    const start = inLab()
    const acted = threeActions(start)
    expect(acted.board.undo).toHaveLength(3)
    const undone = send(acted, Message.UndoChosen(), Message.UndoChosen(), Message.UndoChosen())
    expect(design(undone)).toEqual(design(start))
    expect(undone.board.game.cash).toBe(start.board.game.cash)
    expect(undone.board.undo).toHaveLength(0)
    expect(undone.board.redo).toHaveLength(3)
  })

  test('cycling undo and redo over buy, sell, and resize never moves Cash off the path', () => {
    const start = inLab()
    const acted = threeActions(start)
    let model = acted
    for (let round = 0; round < 4; round += 1) {
      model = send(model, Message.UndoChosen(), Message.UndoChosen(), Message.UndoChosen())
      expect(model.board.game.cash).toBe(start.board.game.cash)
      expect(design(model)).toEqual(design(start))
      model = send(model, Message.RedoChosen(), Message.RedoChosen(), Message.RedoChosen())
      expect(model.board.game.cash).toBe(acted.board.game.cash)
      expect(design(model)).toEqual(design(acted))
    }
    // Back to the start one last time: Cash ends exactly where it started.
    model = send(model, Message.UndoChosen(), Message.UndoChosen(), Message.UndoChosen())
    expect(model.board.game.cash).toBe(start.board.game.cash)
  })

  test('a new action clears redo', () => {
    const undone = send(threeActions(inLab()), Message.UndoChosen())
    expect(undone.board.redo).toHaveLength(1)
    const acted = send(undone, Message.FamilyChosen({ nodeId: 'server', family: 'compute' }))
    expect(acted.board.redo).toHaveLength(0)
    expect(send(acted, Message.RedoChosen()).board.game).toBe(acted.board.game)
  })

  test('the stack keeps the last 50 actions', () => {
    let model = {
      ...inLab(),
      board: { ...inLab().board, game: { ...inLab().board.game, cash: 1e9 } },
    }
    for (let index = 0; index < 55; index += 1)
      model = send(
        model,
        Message.FamilyChosen({ nodeId: 'server', family: index % 2 === 0 ? 'compute' : 'general' }),
      )
    expect(model.board.undo).toHaveLength(50)
  })

  test('after 30 s, undoing a placement refunds half its price, and redo takes that back', () => {
    const start = inLab()
    const bought = placed()
    const price = start.board.game.cash - bought.board.game.cash
    const undone = send(later(bought, 31), Message.UndoChosen())
    expect(undone.board.game.cash).toBe(bought.board.game.cash + Math.round(price * 0.5))
    expect(undone.board.game.nodes).toHaveLength(start.board.game.nodes.length)
    const redone = send(undone, Message.RedoChosen())
    expect(redone.board.game.cash).toBe(bought.board.game.cash)
    expect(redone.board.game.nodes).toHaveLength(bought.board.game.nodes.length)
  })

  test('after 30 s, an undone sale charges the place price, and an undone resize refunds nothing', () => {
    const before = placed()
    const id = before.board.game.nodes.at(-1)?.id ?? ''
    const sold = send(before, Message.NodeSold({ nodeId: id }))
    const unsold = send(later(sold, 31), Message.UndoChosen())
    expect(unsold.board.game.cash).toBe(
      sold.board.game.cash - (inLab().board.game.cash - before.board.game.cash),
    )
    const resized = send(inLab(), Message.ResizeChosen({ nodeId: 'server', direction: 1 }))
    const shrunk = send(later(resized, 31), Message.UndoChosen())
    expect(shrunk.board.game.cash).toBe(resized.board.game.cash)
  })
})

describe('Settling', () => {
  const base = solve(newGame())
  const stub = (revenue: number, served: number, errors: number): Ledger => ({
    ...base,
    revenue,
    served,
    errorShare: errors,
  })
  const before = { revenue: 1, latency: 20, p99: 80, errors: 0 }
  const settling = (): Model => {
    const model = inLab()
    return {
      ...model,
      board: beginChange({ ...model.board, game: newGame() }, 'Resized', before),
    }
  }

  /** Feeds Ledgers one tick at a time; returns the delta, if any, and the last Model. */
  const feed = (ledgers: ReadonlyArray<Ledger>) => {
    let model = settling()
    for (const ledger of ledgers) {
      const result = advanceChange(model.board, ledger, 1)
      if (result.delta) return { model, delta: result.delta }
      model = { ...model, board: { ...model.board, change: result.change } }
    }
    return { model, delta: null }
  }

  test('no delta while any figure still moves more than 1%', () => {
    const wobble = (index: number) => (index % 2 === 0 ? 1 : 1.02)
    expect(feed(Array.from({ length: 40 }, (_, i) => stub(wobble(i), 10, 0))).delta).toBeNull()
    expect(feed(Array.from({ length: 40 }, (_, i) => stub(1, 10 * wobble(i), 0))).delta).toBeNull()
    expect(
      feed(Array.from({ length: 40 }, (_, i) => stub(1, 10, i % 2 === 0 ? 0 : 0.002))).delta,
    ).toBeNull()
  })

  test('a delta after 12 steady ticks, and the ring fills on the way', () => {
    const steady = Array.from({ length: STEADY_TICKS }, () => stub(1.1, 10, 0))
    const halfway = feed(steady.slice(0, STEADY_TICKS / 2))
    expect(halfway.delta).toBeNull()
    expect(settleProgress(halfway.model.board)).toBeCloseTo(0.5)
    const done = feed(steady)
    expect(done.delta?.after.revenue).toBeCloseTo(1.1)
    expect(done.delta?.worse).toBe(false)
  })

  test('worse when revenue falls more than 2% or errors rise more than half a point', () => {
    const run = (revenue: number, errors: number) =>
      feed(Array.from({ length: STEADY_TICKS }, () => stub(revenue, 10, errors))).delta?.worse
    expect(run(0.97, 0)).toBe(true)
    expect(run(0.99, 0)).toBe(false)
    expect(run(1, 0.006)).toBe(true)
    expect(run(1, 0.004)).toBe(false)
  })
})
