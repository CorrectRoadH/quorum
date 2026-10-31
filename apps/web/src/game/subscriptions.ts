import * as Effect from 'effect/Effect'
import * as Queue from 'effect/Queue'
import * as Stream from 'effect/Stream'
import { Schema } from 'effect'
import { Subscription } from 'foldkit'
import { Message } from './message.ts'
import type { Model } from './model.ts'
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
          if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
          if (event.metaKey || event.ctrlKey || event.altKey) return
          if (event.key === ' ') event.preventDefault()
          Queue.offerUnsafe(
            queue,
            Message.KeyPressed({
              key: event.key.length === 1 ? event.key.toLowerCase() : event.key,
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
      modelToDependencies: (model: Model) => ({ running: model.route === 'lab' && !model.paused }),
      dependenciesToStream: ({ running }: { running: boolean }) =>
        running ? Stream.tick(TICK_MS).pipe(Stream.map(() => Message.Ticked())) : Stream.empty,
    },
  ),

  keys: entry(
    { lab: Schema.Boolean },
    {
      modelToDependencies: (model: Model) => ({ lab: model.route === 'lab' }),
      dependenciesToStream: ({ lab }: { lab: boolean }) => (lab ? keys : Stream.empty),
    },
  ),
}))
