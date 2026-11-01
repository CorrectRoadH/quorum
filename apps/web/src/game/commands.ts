import * as Effect from 'effect/Effect'
import { Schema } from 'effect'
import { Command } from 'foldkit'
import { fitBoard, setBoard } from './board.ts'
import { solveFlow } from './engine/solve.ts'
import { ComponentId, Game } from './engine/state.ts'
import { Message } from './message.ts'
import { Prefs, SandboxStore } from './model.ts'
import { play, SOUND_NAMES } from './sound.ts'
import { appendLog, clearLog, downloadLog, LogEntry } from './playlog.ts'

/* ==========================================================================
   Commands: every side effect Quorum has. The board, localStorage, the
   fullscreen API, timers, and the playtest log.
   ========================================================================== */

export const SAVE_KEY = 'quorum.save.v2'
export const SANDBOX_KEY = 'quorum.sandbox.v1'
export const PREFS_KEY = 'quorum.prefs.v1'

export const SyncBoard = Command.define('SyncBoard', {
  args: {
    game: Game,
    bottleneck: Schema.NullOr(Schema.String),
    selected: Schema.NullOr(Schema.String),
    placing: Schema.NullOr(ComponentId),
    history: Schema.Record(Schema.String, Schema.Array(Schema.Finite)),
  },
  messages: [Message.Synced],
  execute: ({ game, bottleneck, selected, placing, history }) =>
    Effect.sync(() =>
      setBoard('board', {
        game,
        ledger: { ...solveFlow(game), bottleneck },
        selected,
        placing,
        history,
      }),
    ).pipe(Effect.as(Message.Synced())),
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

export const LoadPrefs = Command.define('LoadPrefs', {
  args: {},
  messages: [Message.PrefsLoaded],
  execute: () =>
    Effect.sync(() => {
      try {
        return Message.PrefsLoaded({ json: window.localStorage.getItem(PREFS_KEY) })
      } catch {
        return Message.PrefsLoaded({ json: null })
      }
    }),
})

export const WritePrefs = Command.define('WritePrefs', {
  args: { prefs: Prefs },
  messages: [Message.Synced],
  execute: ({ prefs }) =>
    Effect.sync(() => {
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      } catch {
        // Blocked storage only means the cards stay full size.
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
