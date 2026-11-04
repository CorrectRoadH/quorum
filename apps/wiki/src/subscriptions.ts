import * as Effect from 'effect/Effect'
import * as Queue from 'effect/Queue'
import * as Stream from 'effect/Stream'
import { Schema } from 'effect'
import { Subscription } from 'foldkit'
import { Message, type Model } from './main.ts'
import * as Search from './submodels/search.ts'

/* "/" focuses the search, as on most documentation sites; Escape closes the results. */

const keys = Stream.callback<Message>((queue) =>
  Effect.gen(function* () {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const listener = (event: KeyboardEvent) => {
          const target = event.target as HTMLElement | null
          const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
          if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
            event.preventDefault()
            Queue.offerUnsafe(queue, Message.SearchChanged({ message: Search.Message.Focused() }))
          }
          if (event.key === 'Escape')
            Queue.offerUnsafe(queue, Message.SearchChanged({ message: Search.Message.Closed() }))
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
  keys: entry(
    { on: Schema.Boolean },
    {
      modelToDependencies: () => ({ on: true }),
      dependenciesToStream: () => keys,
    },
  ),
}))
