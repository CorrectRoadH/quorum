import * as Effect from 'effect/Effect'
import * as Queue from 'effect/Queue'
import * as Stream from 'effect/Stream'
import { Mount } from 'foldkit'
import type { Html, HtmlBuilder } from 'foldkit/html'
import { attachBoard } from '@quorum/ui/board/board'
import { Message } from './message.ts'
import { play } from './sound.ts'

/* ==========================================================================
   Foldkit's side of the Pixi board: an element-scoped Mount that owns the
   renderer while the element is on screen and pushes gestures back as
   Messages. The Model reaches the board through the SyncBoard Command.
   ========================================================================== */

type BoardMessage =
  | ReturnType<typeof Message.NodeTapped>
  | ReturnType<typeof Message.NodeMoved>
  | ReturnType<typeof Message.LinkRequested>
  | ReturnType<typeof Message.LinkCut>
  | ReturnType<typeof Message.NodePlaced>
  | ReturnType<typeof Message.EmptyTapped>
  | ReturnType<typeof Message.FooterPressed>
  | ReturnType<typeof Message.NodeToggled>
  | ReturnType<typeof Message.SelectionBoxed>

const BoardMounted = Mount.defineStream('BoardMounted', {
  args: {},
  messages: [
    Message.NodeTapped,
    Message.NodeMoved,
    Message.LinkRequested,
    Message.LinkCut,
    Message.NodePlaced,
    Message.EmptyTapped,
    Message.FooterPressed,
    Message.NodeToggled,
    Message.SelectionBoxed,
  ],
  execute: ({ element }) =>
    Stream.callback<BoardMessage>((queue) =>
      Effect.gen(function* () {
        const offer = (message: BoardMessage) => Queue.offerUnsafe(queue, message)
        yield* Effect.acquireRelease(
          Effect.sync(() =>
            attachBoard('board', element as HTMLElement, {
              onNodeTap: (nodeId) => offer(Message.NodeTapped({ nodeId })),
              onNodeMove: (nodeId, x, y) => offer(Message.NodeMoved({ nodeId, x, y })),
              onFooter: (nodeId) => offer(Message.FooterPressed({ nodeId })),
              onLink: (from, to) => offer(Message.LinkRequested({ from, to })),
              onUnlink: (from, to) => offer(Message.LinkCut({ from, to })),
              onPlace: (x, y) => offer(Message.NodePlaced({ x, y })),
              onEmptyTap: () => offer(Message.EmptyTapped()),
              onNodeToggle: (nodeId) => offer(Message.NodeToggled({ nodeId })),
              onBox: (ids, mode) => offer(Message.SelectionBoxed({ ids: [...ids], mode })),
              onSound: play,
            }),
          ),
          (detach) => Effect.sync(detach),
        )
        return yield* Effect.never
      }),
    ),
})

export const boardHost = (h: HtmlBuilder<Message>): Html =>
  h.div([h.Key('board'), h.Class('absolute inset-0 bg-canvas'), h.OnMount(BoardMounted({}))])
