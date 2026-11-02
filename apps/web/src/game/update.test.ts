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
    // In a Company, Confirm starts a migration: Dev Hours first, then the strangler.
    const confirmed = send(pinned, Message.OptionConfirmed())
    expect(confirmed.tradeoff).toBeNull()
    expect(confirmed.seenTradeoffs).toEqual(['runtime'])
    expect(confirmed.game.nodes.find((node) => node.id === 'server')?.runtime).toBe('php_fpm')
    expect(confirmed.game.services[0]?.migration?.runtime).toBe('node_cluster')
    expect(confirmed.game.backlog.some((item) => item.kind === 'migration')).toBe(true)
    expect(confirmed.change).not.toBeNull()
    // The second time, a click applies at once.
    const fresh = { ...ready(), seenTradeoffs: confirmed.seenTradeoffs }
    const clicked = send(fresh, Message.OptionChosen({ nodeId: 'server', option }))
    expect(clicked.tradeoff).toBeNull()
    expect(clicked.game.services[0]?.migration?.runtime).toBe('node_cluster')
  })

  test('a Sandbox swaps the Stack at once', () => {
    const start = ready()
    const sandboxed = { ...start, game: { ...start.game, sandbox: true } }
    const applied = send(
      sandboxed,
      Message.OptionChosen({ nodeId: 'server', option }),
      Message.OptionConfirmed(),
    )
    expect(applied.game.nodes.find((node) => node.id === 'server')?.runtime).toBe('node_cluster')
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

describe('Exit and offline return', () => {
  const send = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
    messages.reduce((current, message) => update(current, message).model, model)

  test('an Exit pays Legacy, writes history, and the next company starts fresh with the record', () => {
    const game = { ...preseedGame(), stage: 4, users: 200_000, cash: 1e8 }
    const exited = send({ ...inLab(), game }, Message.ExitTaken({ exit: 'acquisition' }))
    expect(exited.panel).toBe('exited')
    expect(exited.founder.history).toHaveLength(1)
    expect(exited.founder.legacy).toBe(exited.founder.history[0]?.legacy)
    const title = send(exited, Message.TitleOpened())
    expect(title.route).toBe('title')
    expect(title.menu).toBe('found')
    const next = send(title, Message.CompanyFounded())
    expect(next.route).toBe('lab')
    expect(next.game.stage).toBe(0)
    expect(next.founder.history).toHaveLength(1)
  })

  test('a save from an hour ago plays the hour out and shows the return', () => {
    const game = { ...preseedGame(), wall: 1_000_000 }
    const loaded = send(
      initialModel(),
      Message.SaveLoaded({ json: JSON.stringify(game), now: 1_000_000 + 3_600_000 }),
    )
    expect(loaded.game.time).toBeCloseTo(game.time + 3_600)
    expect(loaded.away?.seconds).toBe(3_600)
    expect(loaded.game.incident).toBeNull()
    expect(send(loaded, Message.Continued()).panel).toBe('away')
  })
})

describe('Challenges', () => {
  const send = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
    messages.reduce((current, message) => update(current, message).model, model)
  const verdict = {
    passed: true,
    missed: null,
    score: { cost: 0.05, tail: 880, complexity: 2 },
    best: { cost: 0.05, tail: 880, complexity: 2 },
    percentiles: { cost: 0.5, tail: 0.5, complexity: 0 },
  }

  const solved = (model: Model): Model =>
    send(
      model,
      Message.ChallengeStarted({ id: 'hello-world' }),
      Message.FamilyChosen({ nodeId: 'server', family: 'general' }),
      Message.ChallengeRan(),
      Message.ChallengeFinished(),
    )

  test('Run scores a provisional result, and the server confirms it', () => {
    const company = { ...initialModel(), saved: true, game: preseedGame() }
    const done = solved(company)
    expect(done.challenge?.phase).toBe('result')
    expect(done.challenge?.result?.passed).toBe(true)
    expect(done.challenge?.verification).toBe('sending')
    expect(done.panel).toBe('challenge')
    const verified = send(done, Message.ChallengeVerified({ verdict }))
    expect(verified.challenge?.verification).toBe('verified')
    // Leaving brings the Company back untouched.
    const left = send(verified, Message.TitleOpened())
    expect(left.challenge).toBeNull()
    expect(left.game).toBe(company.game)
  })

  test('a first completion pays Legacy once, and perks do not reach the board', () => {
    const founder = { ...initialModel().founder, perks: { 'angel-network': 3 } }
    const once = solved({ ...initialModel(), founder })
    expect(once.founder.legacy).toBe(1)
    expect(once.founder.completed).toEqual(['hello-world'])
    expect(once.game.founding.perks).toEqual({})
    const twice = solved(send(once, Message.TitleOpened()))
    expect(twice.founder.legacy).toBe(1)
  })

  test('the Design is fixed during a run; restarts are logged as run actions', () => {
    const running = send(
      initialModel(),
      Message.ChallengeStarted({ id: 'hello-world' }),
      Message.ChallengeRan(),
    )
    const resized = send(running, Message.FamilyChosen({ nodeId: 'server', family: 'general' }))
    expect(resized.game.nodes).toEqual(running.game.nodes)
    const built = send(
      initialModel(),
      Message.ChallengeStarted({ id: 'hello-world' }),
      Message.FamilyChosen({ nodeId: 'server', family: 'general' }),
      Message.ChallengeRan(),
    )
    expect(send(built, Message.UndoChosen()).game.nodes).toEqual(built.game.nodes)
    const restarted = send(running, Message.RestartChosen({ nodeId: 'server' }))
    expect(restarted.challenge?.replay?.actions).toEqual([
      { step: 0, action: { _tag: 'Restart', node: 'server' } },
    ])
  })

  test('without the API Worker the result stays provisional', () => {
    const done = solved(initialModel())
    const offline = send(
      done,
      Message.ChallengeUnverified({ message: 'Failed to fetch', offline: true }),
    )
    expect(offline.challenge?.verification).toBe('offline')
    expect(offline.challenge?.result?.passed).toBe(true)
  })
})
