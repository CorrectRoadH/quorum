import * as Effect from 'effect/Effect'
import * as Queue from 'effect/Queue'
import * as Stream from 'effect/Stream'
import { Option, Schema } from 'effect'
import { DragAndDrop } from '@foldkit/ui'
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
          if (event.defaultPrevented) return
          if (event.key === 'Escape' && document.querySelector('[data-team-drag-active]')) return
          const target = event.target as HTMLElement | null
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

const teamDrag = Subscription.lift(DragAndDrop.subscriptions)<Model, Message>({
  read: (model) => (model.panel === 'team' ? Option.some(model.teamDrag) : Option.none()),
  toParentMessage: (message) => Message.TeamDragChanged({ message }),
})

const teamDragScroll = Stream.callback<Message>((queue) =>
  Effect.gen(function* () {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        let pointer: PointerEvent | null = null
        let frame = 0
        let lastTime = 0
        const scroll = (time: number) => {
          frame = 0
          const floor = document.querySelector<HTMLElement>(
            '[data-team-drag-floor][data-team-drag-active]',
          )
          if (!floor || !pointer) return
          const rect = floor.getBoundingClientRect()
          const { clientX, clientY, screenX, screenY } = pointer
          if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
          )
            return
          const edge = 52
          const distance = Math.min(clientY - rect.top, rect.bottom - clientY)
          if (distance >= edge) return
          const direction = clientY - rect.top < rect.bottom - clientY ? -1 : 1
          const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16
          lastTime = time
          const before = floor.scrollTop
          floor.scrollTop += direction * 600 * (1 - distance / edge) * (elapsed / 1000)
          if (floor.scrollTop !== before) {
            const container = document
              .elementsFromPoint(clientX, clientY)
              .find(
                (element) => element.hasAttribute('data-droppable-id') && floor.contains(element),
              )
            const containerId = container?.getAttribute('data-droppable-id')
            const items = container
              ? Array.from(container.querySelectorAll('[data-sortable-id]'))
              : []
            const index = items.findIndex((item) => {
              const bounds = item.getBoundingClientRect()
              return clientY < bounds.top + bounds.height / 2
            })
            Queue.offerUnsafe(
              queue,
              Message.TeamDragChanged({
                message: DragAndDrop.Message.MovedPointer({
                  screenX,
                  screenY,
                  clientX,
                  clientY,
                  maybeDropTarget: containerId
                    ? Option.some({ containerId, index: index < 0 ? items.length : index })
                    : Option.none(),
                }),
              }),
            )
            frame = requestAnimationFrame(scroll)
          }
        }
        const move = (event: PointerEvent) => {
          pointer = event
          if (!frame) {
            lastTime = 0
            frame = requestAnimationFrame(scroll)
          }
        }
        document.addEventListener('pointermove', move)
        return () => {
          document.removeEventListener('pointermove', move)
          cancelAnimationFrame(frame)
        }
      }),
      (cleanup) => Effect.sync(cleanup),
    )
    return yield* Effect.never
  }),
)

export const subscriptions = {
  ...teamDrag,
  ...Subscription.make<Model, Message>()((entry) => ({
    tick: entry(
      { running: Schema.Boolean },
      {
        modelToDependencies: (model: Model) => ({ running: onBoard(model.route) && !model.paused }),
        dependenciesToStream: ({ running }: { running: boolean }) =>
          running ? Stream.tick(TICK_MS).pipe(Stream.map(() => Message.Ticked())) : Stream.empty,
      },
    ),

    keys: entry(
      { lab: Schema.Boolean, dragging: Schema.Boolean },
      {
        modelToDependencies: (model: Model) => ({
          lab: onBoard(model.route),
          dragging: model.panel === 'team' && model.teamDrag.dragState._tag !== 'Idle',
        }),
        dependenciesToStream: ({ lab, dragging }: { lab: boolean; dragging: boolean }) =>
          lab && !dragging ? keys : Stream.empty,
      },
    ),
    teamDragScroll: entry(
      { active: Schema.Boolean },
      {
        modelToDependencies: (model: Model) => ({
          active:
            model.panel === 'team' &&
            (model.teamDrag.dragState._tag === 'Pending' ||
              model.teamDrag.dragState._tag === 'Dragging'),
        }),
        dependenciesToStream: ({ active }: { active: boolean }) =>
          active ? teamDragScroll : Stream.empty,
      },
    ),
  })),
}
