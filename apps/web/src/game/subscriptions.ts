import * as Effect from 'effect/Effect'
import * as Queue from 'effect/Queue'
import * as Stream from 'effect/Stream'
import { Schema } from 'effect'
import { Subscription } from 'foldkit'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { onBoard } from './route.ts'
import { TICK_MS } from './update.ts'

/* ==========================================================================
   Time and keys. The company runs while the lab is open and not paused, even
   with a panel up: Quorum is an idle game. Keys only matter in the lab.
   ========================================================================== */

type KeyMessage = ReturnType<typeof Message.KeyPressed>

const keys = Stream.callback<KeyMessage>((queue) =>
  Effect.gen(function* () {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const listener = (event: KeyboardEvent) => {
          const target = event.target as HTMLElement | null
          if (event.defaultPrevented || target?.closest('[data-language-picker], [role="listbox"]'))
            return
          if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
          if (event.metaKey || event.ctrlKey || event.altKey) return
          // Arrows and Enter move over the board only when no control has focus.
          const onBoard = !target || target === document.body || target.tagName === 'CANVAS'
          if ((event.key.startsWith('Arrow') || event.key === 'Enter') && !onBoard) return
          if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault()
          Queue.offerUnsafe(
            queue,
            Message.KeyPressed({
              // Single keys arrive lower case, except Shift+Z, which is redo.
              key:
                event.key.length !== 1
                  ? event.key
                  : event.shiftKey && event.key.toLowerCase() === 'z'
                    ? 'Z'
                    : event.key.toLowerCase(),
            }),
          )
        }
        window.addEventListener('keydown', listener)
        return listener
      }),
      (listener) => Effect.sync(() => window.removeEventListener('keydown', listener)),
    )
    return yield* Effect.never
  }),
)

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  tick: entry(
    { running: Schema.Boolean },
    {
      modelToDependencies: (model: Model) => ({ running: onBoard(model.route) && !model.paused }),
      dependenciesToStream: ({ running }: { running: boolean }) =>
        running ? Stream.tick(TICK_MS).pipe(Stream.map(() => Message.Ticked())) : Stream.empty,
    },
  ),

  keys: entry(
    { lab: Schema.Boolean },
    {
      modelToDependencies: (model: Model) => ({ lab: onBoard(model.route) }),
      dependenciesToStream: ({ lab }: { lab: boolean }) => (lab ? keys : Stream.empty),
    },
  ),
}))
