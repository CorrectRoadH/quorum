import { describe, expect, test } from 'vitest'
import { Effect } from 'effect'
import { newGame, preseedGame } from '@quorum/simulation/company'
import { DeleteCompany, LoadSaves, ReadOldSave, WriteCompany } from './commands.ts'
import { Message } from './message.ts'
import { currentFile, type Model } from './model.ts'
import { AppRoute } from './route.ts'
import { initialModel, update } from './update.ts'
import {
  EMPTY_SAVE_INDEX,
  MAX_COMPANY_NAME,
  fileFor,
  nameOr,
  newSaveId,
  refreshedIndex,
  type CompanyFile,
  type SaveIndex,
} from './saves.ts'

/* ==========================================================================
   Company files: many Companies in one browser, each with its own name,
   logo, Venture, Mutators, and Game.
   ========================================================================== */

const send = (model: Model, ...messages: ReadonlyArray<Message>): Model =>
  messages.reduce((current, message) => update(current, message).model, model)

const commandsOf = (model: Model, ...messages: ReadonlyArray<Message>) => {
  let result = update(model, messages[0]!)
  for (const message of messages.slice(1)) result = update(result.model, message)
  return (result.commands ?? []).map((command) => command.name)
}

const tick = (model: Model, times = 1): Model => {
  let current = model
  for (let index = 0; index < times; index += 1) current = update(current, Message.Ticked()).model
  return current
}

const fileIn = (index: SaveIndex, id: string): CompanyFile => {
  const file = index.companies.find((entry) => entry.id === id)
  if (!file) throw new Error(`no file ${id}`)
  return file
}

/** The browser storage the commands read and write. Every write is observable. */
type Storage = Readonly<{
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  key: (index: number) => string | null
  length: number
}>

const fakeStorage = (seed: Record<string, string>): Storage => {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size
    },
  }
}

/** Runs commands against a fake `window.localStorage`, then puts the global back. */
const withStorage = <A>(storage: Storage, run: () => A): A => {
  const scope = globalThis as unknown as { window: { localStorage: Storage } | undefined }
  const prior = scope.window
  scope.window = { localStorage: storage }
  try {
    return run()
  } finally {
    scope.window = prior
  }
}

const runCommand = <A>(command: { effect: Effect.Effect<A, never, never> }): A =>
  Effect.runSync(command.effect)

/** A Company file as `SavesLoaded` reads it from storage. */
const indexOf = (files: ReadonlyArray<CompanyFile>, current: string | null): SaveIndex => ({
  current,
  companies: [...files],
})

/** One stored Company, with no time away. */
const stored = (): Readonly<{ index: SaveIndex; game: ReturnType<typeof preseedGame> }> => {
  const game = { ...preseedGame(), wall: 0 }
  const file = fileFor({
    id: 'c-one',
    name: 'Stored Co',
    logo: 'signal',
    founding: game.founding,
    game,
    now: 1_000,
  })
  return { index: indexOf([file], file.id), game }
}

describe('naming a Company', () => {
  test('a typed name is trimmed and cut to the field length; an empty one gets a fallback', () => {
    expect(nameOr('  Acme  ')).toBe('Acme')
    expect(nameOr('')).toBe('Untitled company')
    expect(nameOr('x'.repeat(MAX_COMPANY_NAME + 10))).toHaveLength(MAX_COMPANY_NAME)
  })

  test('the founding screen keeps the draft name and logo, and the Company takes them', () => {
    const typed = send(
      initialModel(),
      Message.CompanyNameChanged({ name: '  Night Shift  ' }),
      Message.LogoChosen({ logo: 'bolt' }),
      Message.CompanyFounded(),
    )
    const file = currentFile(typed)
    expect(file).toMatchObject({ name: 'Night Shift', logo: 'bolt', venture: 'b2b-saas' })
    expect(typed.loaded).toBe(true)
    expect(typed.route).toEqual(AppRoute.Company())
    expect(commandsOf(initialModel(), Message.CompanyFounded())).toContain('WriteCompany')
  })

  test('the name field never grows past its limit while the player types', () => {
    const model = send(
      initialModel(),
      Message.CompanyNameChanged({ name: 'x'.repeat(MAX_COMPANY_NAME) }),
      Message.CompanyNameChanged({ name: `${'x'.repeat(MAX_COMPANY_NAME)}y` }),
    )
    expect(model.draft.name).toHaveLength(MAX_COMPANY_NAME)
  })

  test('a second Company becomes its own file, and the first one stays', () => {
    const first = send(initialModel(), Message.CompanyFounded())
    const firstId = first.saves.current
    const second = send(
      { ...first, draft: { name: 'Second Co', logo: 'cube' } },
      Message.CompanyFounded(),
    )
    expect(second.saves.companies).toHaveLength(2)
    expect(second.saves.current).not.toBe(firstId)
    expect(fileIn(second.saves, firstId!)).toMatchObject({ name: 'Untitled company' })
    expect(currentFile(second)).toMatchObject({ name: 'Second Co', logo: 'cube' })
  })

  test('a save id is unique even when two Companies share a seed', () => {
    const game = newGame(7920)
    const template = fileFor({
      id: newSaveId([], game.seed),
      name: 'One',
      logo: 'orbit',
      founding: game.founding,
      game,
      now: 1,
    })
    expect(newSaveId([template], game.seed)).not.toBe(template.id)
  })
})

describe('the Companies page', () => {
  test('an index loads its current Company in the background, without leaving the title', () => {
    const { index } = stored()
    const loaded = update(
      initialModel(),
      Message.SavesLoaded({ index: JSON.stringify(index), legacy: null, now: 2_000 }),
    )
    expect(loaded.model.saves).toEqual(index)
    expect(loaded.model.loaded).toBe(false)
    expect(loaded.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'LoadCompany',
          args: expect.objectContaining({ id: 'c-one', open: false }),
        }),
      ]),
    )
  })

  test('opening a file reads its Game, its disclosure, and its dashboard', () => {
    const { index, game } = stored()
    const json = JSON.stringify({
      ...game,
      disclosure: { revealed: ['undo'], pending: [] },
      dashboard: { blocks: {} },
    })
    const opened = send(
      initialModel(),
      Message.SavesLoaded({ index: JSON.stringify(index), legacy: null, now: 0 }),
      Message.CompanyLoaded({ id: 'c-one', open: true, json, now: 0 }),
    )
    expect(opened.loaded).toBe(true)
    expect(opened.route).toEqual(AppRoute.Company())
    expect(opened.saves.current).toBe('c-one')
    expect(opened.board.game.seed).toBe(game.seed)
    expect(opened.board.disclosure.revealed).toEqual(['undo'])
  })

  test('deleting the current Company drops its file and leaves no Company open', () => {
    const { index, game } = stored()
    const opened = send(
      initialModel(),
      Message.SavesLoaded({ index: JSON.stringify(index), legacy: null, now: 0 }),
      Message.CompanyLoaded({ id: 'c-one', open: true, json: JSON.stringify(game), now: 0 }),
    )
    const asked = send(opened, Message.CompanyChosen({ id: 'c-one' }), Message.CompanyDeleteAsked())
    expect(asked.saveConfirm).toBe(true)
    const result = update(asked, Message.CompanyDeleteConfirmed())
    expect(result.model.saves).toEqual(EMPTY_SAVE_INDEX)
    expect(result.model.loaded).toBe(false)
    expect(result.model.saves.current).toBeNull()
    expect(result.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'DeleteCompany',
          args: expect.objectContaining({ id: 'c-one' }),
        }),
      ]),
    )
  })

  test('deleting another Company keeps the current one open', () => {
    const game = { ...preseedGame(), wall: 0 }
    const first = fileFor({
      id: 'c-one',
      name: 'One',
      logo: 'orbit',
      founding: game.founding,
      game,
      now: 1,
    })
    const second: CompanyFile = {
      ...first,
      id: 'c-two',
      name: 'Two',
      logo: 'wave',
      updatedAt: 2,
    }
    const index = indexOf([first, second], 'c-one')
    const opened = send(
      initialModel(),
      Message.SavesLoaded({ index: JSON.stringify(index), legacy: null, now: 0 }),
      Message.CompanyLoaded({ id: 'c-one', open: true, json: JSON.stringify(game), now: 0 }),
      Message.CompanyChosen({ id: 'c-two' }),
      Message.CompanyDeleteAsked(),
      Message.CompanyDeleteConfirmed(),
    )
    expect(opened.saves.current).toBe('c-one')
    expect(opened.saves.companies.map((file) => file.id)).toEqual(['c-one'])
    expect(opened.loaded).toBe(true)
  })

  test('a broken save is kept aside, and no Company opens', () => {
    const result = update(
      initialModel(),
      Message.SavesLoaded({ index: null, legacy: '{not json', now: 0 }),
    )
    expect(result.model.loaded).toBe(false)
    expect(result.commands).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'KeepBrokenSave' })]),
    )
  })
})

describe('autosave and migration', () => {
  test('the autosave writes the open Company file', () => {
    const founded = send(initialModel(), Message.CompanyFounded())
    const id = founded.saves.current
    const saved = tick(founded, 20)
    expect(saved.board.clock.savedAt).toBeGreaterThan(founded.board.clock.savedAt)
    const result = update(tick(founded, 19), Message.Ticked())
    expect(result.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'WriteCompany',
          args: expect.objectContaining({ id }),
        }),
      ]),
    )
  })

  test('leaving the board brings the Company file up to date for the title list', () => {
    const founded = send(initialModel(), Message.CompanyFounded())
    const id = founded.saves.current
    const played: Model = {
      ...founded,
      board: {
        ...founded.board,
        game: { ...founded.board.game, users: 999, time: 123 },
      },
    }
    const left = send(played, Message.TitleOpened())
    expect(left.route).toEqual(AppRoute.Title())
    expect(left.saves.current).toBe(id)
    expect(currentFile(left)).toMatchObject({ users: 999, time: 123 })
    expect(commandsOf(played, Message.TitleOpened())).toContain('WriteCompany')
  })

  test('the single save of the old build becomes the first recovered Company', () => {
    const game = { ...preseedGame(), wall: 5_000 }
    const migrated = send(
      initialModel(),
      Message.SavesLoaded({ index: null, legacy: JSON.stringify(game), now: 8_000 }),
    )
    const file = currentFile(migrated)
    expect(file).toMatchObject({
      name: 'Recovered company',
      venture: game.founding.venture,
      createdAt: 5_000,
      recovered: true,
    })
    expect(migrated.loaded).toBe(true)
    expect(migrated.oldSave).toBe(true)
    const commands = commandsOf(
      initialModel(),
      Message.SavesLoaded({ index: null, legacy: JSON.stringify(game), now: 8_000 }),
    )
    expect(commands).toContain('WriteCompany')
    // The old key stays where it is, so a player can still go back to the old build.
    expect(commands).not.toContain('DropLegacySave')
  })

  test('an index and the previous save both stay, and the previous save stays recoverable', () => {
    const { index, game } = stored()
    const result = update(
      initialModel(),
      Message.SavesLoaded({
        index: JSON.stringify(index),
        legacy: JSON.stringify(game),
        now: 2_000,
      }),
    )
    expect(result.model.saves).toEqual(index)
    expect(result.model.oldSave).toBe(true)
    expect(result.model.saves.companies).toHaveLength(1)
  })

  test('recovering the previous save adds it to the list and opens it', () => {
    const { index } = stored()
    const legacy = { ...preseedGame(4242), wall: 3_000 }
    const asked = send(
      initialModel(),
      Message.SavesLoaded({
        index: JSON.stringify(index),
        legacy: JSON.stringify(legacy),
        now: 4_000,
      }),
    )
    expect(commandsOf(asked, Message.OldSaveImportAsked())).toContain('ReadOldSave')
    const imported = send(
      asked,
      Message.OldSaveLoaded({ json: JSON.stringify(legacy), now: 4_000 }),
    )
    expect(imported.saves.companies).toHaveLength(2)
    expect(imported.saves.companies[0]).toMatchObject({
      name: 'Recovered company',
      recovered: true,
      createdAt: 3_000,
    })
    expect(imported.loaded).toBe(true)
    expect(imported.route).toEqual(AppRoute.Company())
    expect(
      commandsOf(asked, Message.OldSaveLoaded({ json: JSON.stringify(legacy), now: 4_000 })),
    ).toContain('WriteCompany')
  })

  test('recovering the previous save twice never duplicates it', () => {
    const { index } = stored()
    const legacy = JSON.stringify(preseedGame(4242))
    const imported = send(
      initialModel(),
      Message.SavesLoaded({ index: JSON.stringify(index), legacy, now: 4_000 }),
      Message.OldSaveLoaded({ json: legacy, now: 4_000 }),
      Message.OldSaveLoaded({ json: legacy, now: 4_000 }),
    )
    expect(imported.saves.companies.filter((file) => file.recovered)).toHaveLength(1)
    expect(imported.toast?.message).toContain('already')
  })

  test('a previous save this version cannot read is left untouched', () => {
    const { index } = stored()
    const broken = send(
      initialModel(),
      Message.SavesLoaded({ index: JSON.stringify(index), legacy: '{not json', now: 4_000 }),
      Message.OldSaveLoaded({ json: '{not json', now: 4_000 }),
    )
    expect(broken.saves.companies).toHaveLength(1)
    expect(broken.toast?.tone).toBe('warn')
    expect(broken.oldSave).toBe(true)
  })

  test('the index figures follow the Company they name', () => {
    const game = preseedGame()
    const file = fileFor({
      id: 'c-one',
      name: 'One',
      logo: 'orbit',
      founding: game.founding,
      game,
      now: 1,
    })
    const index = indexOf([file], 'c-one')
    const refreshed = refreshedIndex(index, { ...game, stage: 4, users: 42, time: 99 })
    expect(refreshed.companies[0]).toMatchObject({
      id: 'c-one',
      name: 'One',
      stage: 4,
      users: 42,
      time: 99,
    })
  })
})

describe('a playtest browser', () => {
  const playtestGame = () => {
    // Five seconds ago, so the boot import does not replay years of offline progress.
    const game = { ...preseedGame(20261031), wall: Date.now() - 5_000 }
    return {
      ...game,
      disclosure: { revealed: ['undo', 'team'], pending: ['research'] },
      dashboard: { blocks: {} },
    }
  }

  const playtestStorage = () => {
    const legacy = JSON.stringify(playtestGame())
    const founder = JSON.stringify({
      legacy: 12,
      earned: 20,
      perks: { 'angel-network': 1 },
      history: [],
      playbooks: [],
      achievements: ['first-exit'],
      glossary: ['apdex'],
    })
    const playlog = JSON.stringify([
      {
        session: 'playtest',
        seq: 42,
        wall: 1_700_000_005_000,
        t: 120,
        type: 'CompanyStarted',
        data: { stage: 0, seed: 20261031 },
      },
      {
        session: 'playtest',
        seq: 43,
        wall: 1_700_000_006_000,
        t: 130,
        type: 'Sample',
        data: { users: 400 },
      },
    ])
    const prefs = JSON.stringify({ locale: 'fr', muted: true, motion: 'reduce' })
    const sandbox = JSON.stringify({ passed: ['first-server'], free: null })
    return {
      legacy,
      keys: {
        'quorum.save.v2': legacy,
        'quorum.founder.v1': founder,
        'quorum.playlog.v1': playlog,
        'quorum.prefs.v1': prefs,
        'quorum.sandbox.v1': sandbox,
      },
    }
  }

  test('the boot import reads the old save and leaves the other playtest data alone', () => {
    const { legacy, keys } = playtestStorage()
    const storage = fakeStorage(keys)
    withStorage(storage, () => {
      const loaded = runCommand(LoadSaves({}))
      expect(loaded).toMatchObject({ index: null, legacy })
      const read = runCommand(ReadOldSave({}))
      expect(read).toMatchObject({ json: legacy })

      const migrated = update(initialModel(), loaded)
      const file = currentFile(migrated.model)
      expect(file).toMatchObject({ name: 'Recovered company', recovered: true })
      expect(file).not.toBeNull()

      expect(migrated.commands).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'WriteCompany',
            args: expect.objectContaining({ id: file?.id }),
          }),
        ]),
      )
      const board = migrated.model.board
      runCommand(
        WriteCompany({
          id: file!.id,
          index: refreshedIndex(migrated.model.saves, board.game),
          game: board.game,
          revealed: board.disclosure.revealed,
          pending: board.disclosure.pending,
          dashboard: board.dashboard.history,
        }),
      )

      // The old single save, the Founder, the playtest log, and the settings are untouched.
      for (const [key, value] of Object.entries(keys)) expect(storage.getItem(key)).toBe(value)

      const index = JSON.parse(storage.getItem('quorum.saves.v1') ?? '{}') as SaveIndex
      expect(index.current).toBe(file?.id)
      expect(index.companies[0]).toMatchObject({ name: 'Recovered company', recovered: true })
      const saved = storage.getItem(`quorum.save.v3.${file?.id}`)
      expect(saved).not.toBeNull()
      const game = JSON.parse(saved ?? '{}') as ReturnType<typeof playtestGame>
      expect(game.seed).toBe(20261031)
      expect(game.nodes).toHaveLength(playtestGame().nodes.length)
      expect(game.disclosure.revealed).toEqual(['undo', 'team'])

      // Deleting the imported Company removes only its new file.
      const chosen = update(migrated.model, Message.CompanyChosen({ id: file!.id }))
      const asked = update(chosen.model, Message.CompanyDeleteAsked())
      const deleted = update(asked.model, Message.CompanyDeleteConfirmed())
      expect(deleted.commands).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'DeleteCompany',
            args: expect.objectContaining({ id: file?.id }),
          }),
        ]),
      )
      runCommand(DeleteCompany({ id: file!.id, index: deleted.model.saves }))
      expect(storage.getItem(`quorum.save.v3.${file!.id}`)).toBeNull()
      for (const [key, value] of Object.entries(keys)) expect(storage.getItem(key)).toBe(value)
    })
  })

  test('the hidden recovery writes only its own Company and leaves every old key in place', () => {
    const { legacy, keys } = playtestStorage()
    const storage = fakeStorage(keys)
    withStorage(storage, () => {
      const index = JSON.stringify({ current: null, companies: [] })
      storage.setItem('quorum.saves.v1', index)
      const loaded = runCommand(LoadSaves({}))
      const booted = update(initialModel(), loaded)
      const result = update(booted.model, Message.OldSaveLoaded({ json: legacy, now: 4_000 }))
      const model = result.model
      expect(model.saves.companies).toHaveLength(1)
      expect(model.saves.companies[0]).toMatchObject({ name: 'Recovered company', recovered: true })

      expect(result.commands).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'WriteCompany' })]),
      )
      const board = model.board
      runCommand(
        WriteCompany({
          id: model.saves.companies[0]!.id,
          index: refreshedIndex(model.saves, board.game),
          game: board.game,
          revealed: board.disclosure.revealed,
          pending: board.disclosure.pending,
          dashboard: board.dashboard.history,
        }),
      )
      for (const [key, value] of Object.entries(keys)) expect(storage.getItem(key)).toBe(value)
      const imported = model.saves.companies[0]!
      expect(storage.getItem(`quorum.save.v3.${imported.id}`)).not.toBeNull()
    })
  })
})
