import { Locale } from '../i18n/index.ts'
import * as Effect from 'effect/Effect'
import { Schema } from 'effect'
import { Command } from 'foldkit'
import { load, pushUrl, replaceUrl } from 'foldkit/navigation'
import { fitBoard, setBoard } from './board.ts'
import { solveFlow } from '@quorum/simulation/solve'
import { compute } from './compute.ts'
import { regionView } from '@quorum/simulation/regions'
import { ComponentId, Game, Region } from '@quorum/simulation/state'
import { Message } from './message.ts'
import { Founder } from '@quorum/simulation/founder'
import { Motion, Prefs, Reveal, SandboxStore, TradeoffOption } from './model.ts'
import { History } from './history.ts'
import { play, setMuted, SOUND_NAMES } from './sound.ts'
import { setAgentAccess } from './agent-relay.ts'
import { appendLog, clearLog, downloadLog, LogEntry } from './playlog.ts'
import { ChallengeSubmission } from '@quorum/rpc'
import { ApiRpc } from '@/platform/rpc.ts'

/* ==========================================================================
   Commands: every side effect Quorum has. The board, localStorage, the
   fullscreen API, timers, and the playtest log.
   ========================================================================== */

export const SAVE_KEY = 'quorum.save.v2'
export const SANDBOX_KEY = 'quorum.sandbox.v1'
export const PREFS_KEY = 'quorum.prefs.v1'
export const FOUNDER_KEY = 'quorum.founder.v1'

/** A Playbook following the pointer on the board. */
const StampArg = Schema.NullOr(
  Schema.Array(
    Schema.Struct({
      type: ComponentId,
      dx: Schema.Finite,
      dy: Schema.Finite,
      ghost: Schema.Boolean,
    }),
  ),
)

export const SyncBoard = Command.define('SyncBoard', {
  args: {
    game: Game,
    locale: Locale,
    bottleneck: Schema.NullOr(Schema.String),
    selected: Schema.NullOr(Schema.String),
    selection: Schema.Array(Schema.String),
    placing: Schema.NullOr(ComponentId),
    stamp: StampArg,
    history: Schema.Record(Schema.String, Schema.Array(Schema.Finite)),
    region: Region,
    paused: Schema.Boolean,
    suspended: Schema.Boolean,
    /** The Node whose footer button glows: a disclosure cue. */
    cue: Schema.NullOr(Schema.String),
    /** Fit the view to the new Design once it is drawn. */
    fit: Schema.Boolean,
  },
  messages: [Message.Synced],
  execute: ({
    game,
    locale,
    bottleneck,
    selected,
    selection,
    placing,
    stamp,
    history,
    region,
    paused,
    suspended,
    cue,
    fit,
  }) =>
    Effect.sync(() => {
      setBoard('board', {
        locale,
        game: regionView(game, region),
        ledger: { ...solveFlow(game), bottleneck },
        selected,
        selection,
        placing,
        stamp,
        history,
        region,
        paused,
        suspended,
        cue,
      })
      if (fit) fitBoard('board')
    }).pipe(Effect.as(Message.Synced())),
})

/** Runs a Tradeoff option's ghost runs on the compute worker. A superseded or refused run sends nothing back. */
export const ComputePreview = Command.define('ComputePreview', {
  args: { game: Game, nodeId: Schema.String, option: TradeoffOption },
  messages: [Message.PreviewComputed, Message.Synced],
  execute: ({ game, nodeId, option }) =>
    Effect.promise(() => compute('preview', { game, nodeId, option })).pipe(
      Effect.map((preview) =>
        preview
          ? Message.PreviewComputed({
              nodeId,
              option,
              preview: { ...preview, burn: [...preview.burn] },
            })
          : Message.Synced(),
      ),
    ),
})

/** Searches the Bottleneck on the compute worker. A superseded search sends nothing back. */
export const ComputeBottleneck = Command.define('ComputeBottleneck', {
  args: { game: Game, at: Schema.Finite },
  messages: [Message.BottleneckFound, Message.Synced],
  execute: ({ game, at }) =>
    Effect.promise(() => compute('bottleneck', { game })).pipe(
      Effect.map((bottleneck) =>
        bottleneck === undefined ? Message.Synced() : Message.BottleneckFound({ bottleneck, at }),
      ),
    ),
})

/** Adds a history entry for the route a Message opened. */
export const PushUrl = Command.define('PushUrl', {
  args: { url: Schema.String },
  messages: [Message.Navigated],
  execute: ({ url }) => pushUrl(url).pipe(Effect.as(Message.Navigated())),
})

/** Corrects the URL in place when it names a screen that cannot open. */
export const ReplaceUrl = Command.define('ReplaceUrl', {
  args: { url: Schema.String },
  messages: [Message.Navigated],
  execute: ({ url }) => replaceUrl(url).pipe(Effect.as(Message.Navigated())),
})

export const LoadUrl = Command.define('LoadUrl', {
  args: { href: Schema.String },
  messages: [Message.Navigated],
  execute: ({ href }) => load(href).pipe(Effect.as(Message.Navigated())),
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
        return Message.SaveLoaded({ json: window.localStorage.getItem(SAVE_KEY), now: Date.now() })
      } catch {
        return Message.SaveLoaded({ json: null, now: Date.now() })
      }
    }),
})

export const WriteSave = Command.define('WriteSave', {
  args: {
    game: Game,
    revealed: Schema.Array(Reveal),
    pending: Schema.Array(Reveal),
    dashboard: History,
  },
  messages: [Message.Saved],
  execute: ({ game, revealed, pending, dashboard }) =>
    Effect.sync(() => {
      try {
        // The wall clock goes in at the last moment: it is the only one, for offline progress.
        window.localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({
            ...game,
            wall: Date.now(),
            disclosure: { revealed, pending },
            dashboard,
          }),
        )
      } catch {
        // A full or blocked storage loses the save, not the game.
      }
      return Message.Saved()
    }),
})

export const BROKEN_SAVE_KEY = 'quorum.save.v2.broken'

/** Sets a save this version cannot read aside, so the next Company does not overwrite it. */
export const KeepBrokenSave = Command.define('KeepBrokenSave', {
  args: { json: Schema.String, reason: Schema.String },
  messages: [Message.Synced],
  execute: ({ json, reason }) =>
    Effect.sync(() => {
      console.error('The save could not be read:', reason)
      try {
        window.localStorage.setItem(BROKEN_SAVE_KEY, json)
      } catch {
        // Storage is full or blocked: the save stays only where it was.
      }
      return Message.Synced()
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

/** Applies the settings: mute for every sound, and reduced motion as `data-motion` on the root. */
export const ApplySettings = Command.define('ApplySettings', {
  args: { muted: Schema.Boolean, motion: Motion, locale: Locale, agentAccess: Schema.Boolean },
  messages: [Message.Synced],
  execute: ({ muted, motion, locale, agentAccess }) =>
    Effect.sync(() => {
      setMuted(muted)
      setAgentAccess(agentAccess)
      document.documentElement.lang = locale
      if (motion === 'reduce') document.documentElement.dataset.motion = 'reduce'
      else delete document.documentElement.dataset.motion
      return Message.Synced()
    }),
})

/** Moves keyboard focus into the Inspector, onto its first control. */
export const FocusInspector = Command.define('FocusInspector', {
  args: {},
  messages: [Message.Synced],
  execute: () =>
    Effect.sync(() => {
      document
        .querySelector<HTMLElement>(
          '[data-inspector] :is(button, [href], input, select, [tabindex]):not([disabled])',
        )
        ?.focus()
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

/** Waits out the clock-in, then shows the title. */
export const RevealTitle = Command.define('RevealTitle', {
  args: {},
  messages: [Message.TitleRevealed],
  execute: () => Effect.sleep('1100 millis').pipe(Effect.as(Message.TitleRevealed())),
})

/** The title monitor's connect sequence plays, then the board shows. */
export const ConnectBoard = Command.define('ConnectBoard', {
  args: {},
  messages: [Message.Connected],
  execute: () => Effect.sleep('1200 millis').pipe(Effect.as(Message.Connected())),
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

/** Forgets the Company save: after an Exit there is nothing to continue. */
export const ClearSave = Command.define('ClearSave', {
  args: {},
  messages: [Message.Synced],
  execute: () =>
    Effect.sync(() => {
      try {
        window.localStorage.removeItem(SAVE_KEY)
      } catch {
        // Nothing to forget.
      }
      return Message.Synced()
    }),
})

export const LoadFounder = Command.define('LoadFounder', {
  args: {},
  messages: [Message.FounderLoaded],
  execute: () =>
    Effect.sync(() => {
      // A device id for Challenge histograms, used only if the Founder has none yet.
      const fresh = { deviceId: crypto.randomUUID(), today: new Date().toISOString().slice(0, 10) }
      try {
        return Message.FounderLoaded({ json: window.localStorage.getItem(FOUNDER_KEY), ...fresh })
      } catch {
        return Message.FounderLoaded({ json: null, ...fresh })
      }
    }),
})

export const WriteFounder = Command.define('WriteFounder', {
  args: { founder: Founder },
  messages: [Message.Synced],
  execute: ({ founder }) =>
    Effect.sync(() => {
      try {
        window.localStorage.setItem(FOUNDER_KEY, JSON.stringify(founder))
      } catch {
        // A full or blocked storage loses the record, not the Company.
      }
      return Message.Synced()
    }),
})

/** Copies text to the clipboard, and says whether it worked. */
export const CopyText = Command.define('CopyText', {
  args: { text: Schema.String, done: Schema.String },
  messages: [Message.ToastRaised],
  execute: ({ text, done }) =>
    Effect.promise(async () => {
      try {
        await navigator.clipboard.writeText(text)
        return Message.ToastRaised({ message: done, tone: 'ok' })
      } catch {
        return Message.ToastRaised({ message: 'The clipboard is blocked.', tone: 'warn' })
      }
    }),
})

/** Asks for a Playbook string. */
export const AskPlaybook = Command.define('AskPlaybook', {
  args: {},
  messages: [Message.PlaybookImported],
  execute: () =>
    Effect.sync(() =>
      Message.PlaybookImported({ text: window.prompt('Paste a Playbook (QPB1:…)') }),
    ),
})

/** Sends a Challenge result for the server to re-run. A mutation, not a Query. */
export const SubmitChallenge = Command.define('SubmitChallenge', {
  args: { submission: ChallengeSubmission },
  messages: [Message.ChallengeVerified, Message.ChallengeUnverified],
  execute: ({ submission }) =>
    Effect.gen(function* () {
      const rpc = yield* ApiRpc
      return yield* rpc.challengeSubmit(submission)
    }).pipe(
      Effect.match({
        onSuccess: (verdict) => Message.ChallengeVerified({ verdict }),
        onFailure: (error) =>
          Message.ChallengeUnverified({
            message: error.message,
            offline: error._tag === 'RpcClientError',
          }),
      }),
    ),
})
