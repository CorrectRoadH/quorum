import * as Effect from 'effect/Effect'
import * as Queue from 'effect/Queue'
import * as Stream from 'effect/Stream'
import { Schema } from 'effect'
import { Mount } from 'foldkit'
import type { Html, HtmlBuilder } from 'foldkit/html'
import { Message } from './message.ts'
import { attachDiagram } from './diagram.ts'

/** The only Messages this canvas produces. Narrowing the stream to them keeps
 *  `Mount.defineStream`'s `messages` declaration honest. */
type PointerMessage = ReturnType<typeof Message.NodeTapped> | ReturnType<typeof Message.NodeHovered>

/* ==========================================================================
   Foldkit's side of the Pixi canvas: an element-scoped Mount that owns the
   renderer for as long as the element is on screen, and pushes pointers back
   as Messages. The Model reaches the canvas through the SyncDiagram Command
   in update, never through this Mount's args (those are fixed at mount).
   ========================================================================== */

const DiagramMounted = Mount.defineStream('DiagramMounted', {
  args: { key: Schema.String },
  messages: [Message.NodeTapped, Message.NodeHovered],
  execute: ({ element, key }) =>
    Stream.callback<PointerMessage>((queue) =>
      Effect.gen(function* () {
        // The renderer lives in the stream's scope: it is torn down when the
        // element unmounts and the runtime interrupts this fiber.
        yield* Effect.acquireRelease(
          Effect.sync(() =>
            attachDiagram(key, element as HTMLElement, {
              onNodeTap: (nodeId) => Queue.offerUnsafe(queue, Message.NodeTapped({ nodeId })),
              onNodeHover: (nodeId) => Queue.offerUnsafe(queue, Message.NodeHovered({ nodeId })),
            }),
          ),
          (detach) => Effect.sync(detach),
        )
        return yield* Effect.never
      }),
    ),
})

/** Keyed by canvas so the host element is never reused between screens: a
 *  reused element would keep the previous screen's renderer attached. */
export const diagramHost = (key: string, h: HtmlBuilder<Message>): Html =>
  h.div([h.Key(`diagram-${key}`), h.Class('absolute inset-0'), h.OnMount(DiagramMounted({ key }))])
