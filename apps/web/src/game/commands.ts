import * as Effect from 'effect/Effect'
import { Schema } from 'effect'
import { Command } from 'foldkit'
import { fitBoard, setBoard } from './board.ts'
import { solve } from './engine/solve.ts'
import { ComponentId, Game } from './engine/state.ts'
import { Message } from './message.ts'
import { SandboxStore } from './model.ts'
import { play, SOUND_NAMES } from './sound.ts'
import { appendLog, clearLog, downloadLog, LogEntry } from './playlog.ts'

/* ==========================================================================
   Commands: every side effect Quorum has. The board, localStorage, the
   fullscreen API, timers, and the playtest log.
   ========================================================================== */

export const SAVE_KEY = 'quorum.save.v2'
export const SANDBOX_KEY = 'quorum.sandbox.v1'

export const SyncBoard = Command.define('SyncBoard', {
  args: { game: Game, selected: Schema.NullOr(Schema.String), placing: Schema.NullOr(ComponentId) },
  messages: [Message.Synced],
  execute: ({ game, selected, placing }) =>
    Effect.sync(() => setBoard('board', { game, ledger: solve(game), selected, placing })).pipe(
      Effect.as(Message.Synced()),
    ),
})

export const FitBoard = Command.define('FitBoard', {
  args: {},
  messages: [Message.Synced],
  execute: () => Effect.sync(() => fitBoard('board')).pipe(Effect.as(Message.Synced())),
})

export const LoadSave = Command.define('LoadSave', {
  args: {},
  messages: [Message.SaveLoaded],
  execute: () =>
    Effect.sync(() => {
      try {
        return Message.SaveLoaded({ json: window.localStorage.getItem(SAVE_KEY) })
      } catch {
        return Message.SaveLoaded({ json: null })
      }
    }),
})

export const WriteSave = Command.define('WriteSave', {
  args: { game: Game },
  messages: [Message.Saved],
  execute: ({ game }) =>
    Effect.sync(() => {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(game))
      } catch {
        // A full or blocked storage loses the save, not the game.
      }
      return Message.Saved()
    }),
})

export const LoadSandboxStore = Command.define('LoadSandboxStore', {
  args: {},
  messages: [Message.SandboxStoreLoaded],
  execute: () =>
    Effect.sync(() => {
      try {
        return Message.SandboxStoreLoaded({ json: window.localStorage.getItem(SANDBOX_KEY) })
      } catch {
        return Message.SandboxStoreLoaded({ json: null })
      }
    }),
})

export const WriteSandboxStore = Command.define('WriteSandboxStore', {
  args: { store: SandboxStore },
  messages: [Message.Synced],
  execute: ({ store }) =>
    Effect.sync(() => {
      try {
        window.localStorage.setItem(SANDBOX_KEY, JSON.stringify(store))
      } catch {
        // A full or blocked storage loses Sandbox progress, not the game.
      }
      return Message.Synced()
    }),
})

export const ToggleFullscreen = Command.define('ToggleFullscreen', {
  args: {},
  messages: [Message.Synced],
  execute: () =>
    Effect.promise(async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen()
        else await document.documentElement.requestFullscreen()
      } catch {
        // The browser refused; the game still fills the window.
      }
      return Message.Synced()
    }),
})

export const ClearToast = Command.define('ClearToast', {
  args: { id: Schema.Finite },
  messages: [Message.ToastCleared],
  execute: ({ id }) => Effect.sleep('3600 millis').pipe(Effect.as(Message.ToastCleared({ id }))),
})

export const AppendLog = Command.define('AppendLog', {
  args: { entries: Schema.Array(LogEntry) },
  messages: [Message.Synced],
  execute: ({ entries }) => Effect.sync(() => appendLog(entries)).pipe(Effect.as(Message.Synced())),
})

export const ExportLog = Command.define('ExportLog', {
  args: {},
  messages: [Message.Synced],
  execute: () => Effect.sync(() => downloadLog()).pipe(Effect.as(Message.Synced())),
})

export const ClearLog = Command.define('ClearLog', {
  args: {},
  messages: [Message.Synced],
  execute: () => Effect.sync(() => clearLog()).pipe(Effect.as(Message.Synced())),
})

export const PlaySound = Command.define('PlaySound', {
  args: { sound: Schema.Literals(SOUND_NAMES), pitch: Schema.Finite, spatial: Schema.Boolean },
  messages: [Message.Synced],
  execute: ({ sound, pitch, spatial }) =>
    Effect.sync(() => play(sound, pitch, spatial)).pipe(Effect.as(Message.Synced())),
})
