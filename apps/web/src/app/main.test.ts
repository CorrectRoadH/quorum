import { expect, test } from 'vitest'
import type { Model } from '@/game/model.ts'
import { init, Message, subscriptions, update } from './main.ts'

const started = () => init().model

test('the title screen starts on the menu with no run in flight', () => {
  const model = started()

  expect(model.route).toBe('menu')
  expect(model.run.playing).toBe(false)
})

test('entering the run arms the clock and resets the month', () => {
  const result = update(started(), Message.RunStarted())

  expect(result.model.route).toBe('run')
  expect(result.model.run.playing).toBe(true)
  expect(result.model.run.tick).toBe(306)
})

test('the month ends in the report card when the last Tick passes', () => {
  const near = {
    ...started(),
    route: 'run' as const,
    run: { ...started().run, tick: 900, playing: true },
  }

  const result = update(update(near, Message.Ticked()).model, Message.Ticked())

  expect(result.model.route).toBe('report')
  expect(result.model.run.playing).toBe(false)
})

test('a wrong room code is refused and a real one is accepted', () => {
  const wrong = update(started(), Message.CodeChanged({ code: 'ZZZZ' }))
  expect(wrong.model.join.check).toBe('unknown')

  const right = update(wrong.model, Message.CodeChanged({ code: 'BLOG' }))
  expect(right.model.join.check).toBe('found')

  const joined = update(right.model, Message.JoinSubmitted())
  expect(joined.model.route).toBe('lobby')
  expect(joined.model.room.code).toBe('BLOG')
})

test('the tradeoff card records the choice on the design', () => {
  const chosen = update(started(), Message.TradeoffChosen({ choice: 'write-through' }))
  const placed = update(
    {
      ...chosen.model,
      route: 'run' as const,
      run: { ...chosen.model.run, overlay: 'tradeoff' as const },
    },
    Message.TradeoffPlaced(),
  )

  const cache = placed.model.design.nodes.find((node) => node.id === 'cache')

  expect(cache?.meta).toBe('Managed · write-through')
  expect(placed.model.run.overlay).toBe('none')
})

test('toasts clear themselves once their id comes back', () => {
  const raised = update(started(), Message.ToastRaised({ message: 'Placed.', tone: 'ok' }))
  const id = raised.model.toast?.id ?? 0

  expect(id).toBeGreaterThan(0)
  expect(update(raised.model, Message.ToastCleared({ id })).model.toast).toBeNull()
})

const runningModel = (): Model => ({
  ...started(),
  route: 'run',
  run: { ...started().run, playing: true },
})

const stateOf = (model: Model, nodeId: string) =>
  model.design.nodes.find((node) => node.id === nodeId)?.state

test('an injected failure comes back after its twelve Ticks', () => {
  const injected = update(runningModel(), Message.FailureInjected()).model
  expect(stateOf(injected, 'worker')).toBe('warn')

  // Eleven Ticks is not enough: the recovery is booked for Tick + 12.
  const eleven = Array.from({ length: 11 }).reduce<Model>(
    (model) => update(model, Message.Ticked()).model,
    injected,
  )
  expect(stateOf(eleven, 'worker')).toBe('warn')

  const twelve = update(eleven, Message.Ticked()).model
  expect(stateOf(twelve, 'worker')).toBe('ok')
  expect(twelve.run.recoveries).toHaveLength(0)
  expect(twelve.toast?.message).toBe('Worker back at full replicas.')
})

test('an open overlay holds the clock, the Tradeoff card included', () => {
  const running = runningModel()
  const clock = (model: Model) => subscriptions.tick.modelToDependencies(model).running

  expect(clock(running)).toBe(true)

  const tradeoff = update(running, Message.OverlayOpened({ overlay: 'tradeoff' })).model
  expect(clock(tradeoff)).toBe(false)

  const paused = update(running, Message.OverlayOpened({ overlay: 'pause' })).model
  expect(clock(paused)).toBe(false)

  // Closing gives the clock back, because opening never took `playing` away.
  expect(clock(update(tradeoff, Message.OverlayClosed()).model)).toBe(true)
  expect(paused.run.playing).toBe(true)
})
