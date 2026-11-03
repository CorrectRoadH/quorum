import { describe, expect, test } from 'vitest'
import { Option } from 'effect'
import { DragAndDrop } from '@foldkit/ui'
import { fromString } from 'foldkit/url'
import { newGame, preseedGame } from '@quorum/simulation/company'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { init, initialModel, update } from './update.ts'
import { AppRoute } from './route.ts'

/* The clock: 100 ms Steps under a 250 ms UI tick, and the Bottleneck search once per sim second. */

const tick = (model: Model, times = 1): Model => {
  let current = model
  for (let index = 0; index < times; index += 1) current = update(current, Message.Ticked()).model
  return current
}

const at = (path: string) => Option.getOrThrow(fromString(`https://quorum.test${path}`))

const inLab = (): Model => ({ ...initialModel(), route: AppRoute.Company(), game: newGame() })

test('dropping an engineer on another team moves them', () => {
  const game = preseedGame()
  const start: Model = {
    ...inLab(),
    panel: 'team',
    game: {
      ...game,
      teams: [
        ...game.teams,
        { id: 't2', name: 'Team 2', policy: 'balanced', previous: 'balanced', since: 0 },
      ],
      engineers: [{ id: 'e1', team: 'core', language: 'php', hiredAt: 0 }],
    },
  }
  const send = (model: Model, message: DragAndDrop.Message) =>
    update(model, Message.TeamDragChanged({ message })).model
  const picked = send(
    start,
    DragAndDrop.Message.ActivatedKeyboardDrag({ itemId: 'e1', containerId: 'core', index: 0 }),
  )
  const moved = send(
    picked,
    DragAndDrop.Message.CompletedResolveKeyboardMove({ targetContainerId: 't2', targetIndex: 0 }),
  )
  const dropped = send(moved, DragAndDrop.Message.ConfirmedKeyboardDrop())
  expect(dropped.game.engineers.find((engineer) => engineer.id === 'e1')?.team).toBe('t2')
})

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
    route: AppRoute.Company(),
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
    expect(title.route).toEqual(AppRoute.Menu({ menu: 'found' }))
    const next = send(title, Message.CompanyFounded())
    expect(next.route).toEqual(AppRoute.Company())
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

describe('M9: sound, achievements, glossary, keys', () => {
  type Named = Readonly<{ name: string; args: Record<string, unknown> }>
  const names = (commands: ReadonlyArray<unknown> | undefined): ReadonlyArray<Named> =>
    (commands ?? []) as ReadonlyArray<Named>
  const incidentDue = (change: Partial<Model> = {}): Model => {
    const game = preseedGame()
    return {
      ...initialModel(),
      route: AppRoute.Company(),
      game: { ...game, nextIncidentAt: game.time },
      ...change,
    }
  }
  const sounds = (model: Model) =>
    names(update(model, Message.Ticked()).commands)
      .filter((command) => command.name === 'PlaySound')
      .map((command) => command.args['sound'])

  test('a fresh load waits for one clock-in before the title, and a return skips it', () => {
    const shut = init(at('/')).model
    expect(shut.gate).toBe('shut')
    expect(update(shut, Message.KeyPressed({ key: 'Escape' })).model.gate).toBe('shut')
    const clocking = update(shut, Message.KeyPressed({ key: 'a' }))
    expect(clocking.model.gate).toBe('clocking')
    expect(names(clocking.commands).map((command) => command.args['sound'])).toContain('clockin')
    const again = names(update(clocking.model, Message.ClockedIn()).commands)
    expect(again.filter((command) => command.name !== 'AppendLog')).toEqual([])
    const open = update(clocking.model, Message.TitleRevealed()).model
    expect(open.gate).toBe('open')
    const lab = update(open, Message.NewCompanyStarted()).model
    expect(update(lab, Message.TitleOpened()).model.gate).toBe('open')
  })

  test('an incident plays its sound, unless muted', () => {
    expect(sounds(incidentDue())).toContain('incident')
    expect(sounds(incidentDue({ muted: true }))).toEqual([])
  })

  test('the first served request earns Hello, World once, in the Founder record', () => {
    const once = update(incidentDue(), Message.Ticked()).model
    expect(once.founder.achievements).toContain('hello-world')
    expect(once.toast?.message).toBeDefined()
    const twice = update(once, Message.Ticked()).model
    expect(twice.founder.achievements.filter((id) => id === 'hello-world')).toHaveLength(1)
  })

  test('a Sandbox earns no achievement and meets no glossary entry', () => {
    const sandbox: Model = {
      ...inLab(),
      game: { ...newGame(), sandbox: true },
      sandbox: { id: null, progress: { objective: 0, held: 0, scripted: false } } as never,
    }
    const after = update(sandbox, Message.Ticked()).model
    expect(after.founder.achievements).toEqual([])
    expect(after.founder.glossary).toEqual([])
  })

  test('mute and reduced motion are saved as prefs, not in the Game', () => {
    const start = inLab()
    const muted = update(start, Message.MuteToggled())
    expect(muted.model.muted).toBe(true)
    expect(muted.model.game).toBe(start.game)
    const write = names(muted.commands).find((command) => command.name === 'WritePrefs')
    expect(write?.args['prefs']).toMatchObject({ muted: true, motion: 'system' })
    expect(update(start, Message.KeyPressed({ key: 'm' })).model.muted).toBe(true)
    expect(update(start, Message.MotionToggled()).model.motion).toBe('reduce')
  })

  test('a Tradeoff term opens the Glossary on it and marks it met', () => {
    const opened = update(inLab(), Message.GlossaryOpened({ id: 'event-loop' })).model
    expect(opened.panel).toBe('glossary')
    expect(opened.glossaryFocus).toBe('event-loop')
    expect(opened.founder.glossary).toContain('event-loop')
  })

  test('arrow keys move the selection between Nodes', () => {
    const start: Model = { ...inLab(), selected: 'users' }
    const moved = update(start, Message.KeyPressed({ key: 'ArrowRight' })).model
    expect(moved.selected).not.toBe('users')
    expect(moved.selected).not.toBeNull()
  })
})

describe('URL routing', () => {
  type Named = Readonly<{ name: string; args: Record<string, unknown> }>
  const pushed = (commands: ReadonlyArray<unknown> | undefined) =>
    ((commands ?? []) as ReadonlyArray<Named>)
      .filter((command) => command.name === 'PushUrl' || command.name === 'ReplaceUrl')
      .map((command) => `${command.name} ${String(command.args['url'])}`)

  test('a board URL on a fresh load opens the menu that lists it', () => {
    const challenge = init(at('/challenges/hello-world'))
    expect(challenge.model.route).toEqual(AppRoute.Menu({ menu: 'challenges' }))
    expect(pushed(challenge.commands)).toEqual(['ReplaceUrl /challenges'])
    expect(pushed(init(at('/history')).commands)).toEqual([])
    expect(init(at('/no/such/page')).model.route).toEqual(AppRoute.Title())
  })

  test('opening a Sandbox adds its URL; back closes it and gives the Company back', () => {
    const company = inLab()
    const opened = update(company, Message.FreeSandboxStarted())
    expect(opened.model.route).toEqual(AppRoute.Sandbox({ sandbox: 'free' }))
    expect(pushed(opened.commands)).toEqual(['PushUrl /sandbox/free'])

    const back = update(opened.model, Message.ChangedUrl({ url: at('/') }))
    expect(back.model.route).toEqual(AppRoute.Title())
    expect(back.model.sandbox).toBeNull()
    expect(back.model.game).toBe(company.game)
    expect(pushed(back.commands)).toEqual([])

    const forward = update(back.model, Message.ChangedUrl({ url: at('/sandbox/second-server') }))
    expect(forward.model.sandbox?.id).toBe('second-server')
    expect(pushed(forward.commands)).toEqual([])
  })

  test('a URL for a board that cannot open goes back to the screen in place', () => {
    const title = initialModel()
    const company = update(title, Message.ChangedUrl({ url: at('/company') }))
    expect(company.model.route).toEqual(AppRoute.Title())
    expect(pushed(company.commands)).toEqual(['ReplaceUrl /'])
    const unknown = update(title, Message.ChangedUrl({ url: at('/challenges/no-such-drill') }))
    expect(pushed(unknown.commands)).toEqual(['ReplaceUrl /'])
  })
})

describe('progressive disclosure', () => {
  const send = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
    messages.reduce((current, message) => update(current, message).model, model)
  const founded = (): Model => send(initialModel(), Message.CompanyFounded())

  test('a first Company opens on the board, with Research shut until Insight can buy an item', () => {
    const start = founded()
    expect(start.panel).toBe('none')
    expect(start.revealed).not.toContain('research')
    expect(send(start, Message.KeyPressed({ key: 'r' })).panel).toBe('none')
    // The cheapest Garage item costs 15 ◆: 14 is not enough, 15 is.
    const short = tick({ ...start, game: { ...start.game, insight: 14 } })
    expect(short.revealed).not.toContain('research')
    const enough = tick({ ...start, game: { ...start.game, insight: 15 } })
    expect(enough.revealed).toContain('research')
    expect(enough.cue?.key).toBe('research')
    const opened = send(enough, Message.KeyPressed({ key: 'r' }))
    expect(opened.panel).toBe('research')
    expect(opened.cue).toBeNull()
  })

  test('two triggers at once show one element; the second waits until the first is used', () => {
    const start = founded()
    const both = tick(
      send(
        { ...start, game: { ...start.game, insight: 100, cash: 10_000 } },
        Message.ResizeChosen({ nodeId: 'server', direction: 1 }),
      ),
    )
    expect(both.revealed).toContain('undo')
    expect(both.revealed).not.toContain('research')
    expect(both.pending).toContain('research')
    const used = tick(send(both, Message.UndoChosen()))
    expect(used.revealed).toContain('research')
    expect(used.cue?.key).toBe('research')
  })

  test('a save from before disclosure shows everything; a save with it keeps its set', () => {
    const game = preseedGame()
    const old = send(initialModel(), Message.SaveLoaded({ json: JSON.stringify(game), now: 0 }))
    expect(old.revealed).toContain('team')
    expect(old.revealed).toContain('glossary')
    const kept = send(
      initialModel(),
      Message.SaveLoaded({
        json: JSON.stringify({ ...game, disclosure: { revealed: ['undo'], pending: ['team'] } }),
        now: 0,
      }),
    )
    expect(kept.revealed).toEqual(['undo'])
    expect(kept.pending).toEqual(['team'])
  })
})
