import { Schema } from 'effect'
import * as Stream from 'effect/Stream'
import { Subscription } from 'foldkit'
import { Message } from './message.ts'
import type { Model } from './model.ts'
import { TICKS_IN_MONTH } from './simulation.ts'

/* ==========================================================================
   Time. A Tick is one step of the simulated month, and the session clock is
   what tells a player how long they have been in the room.
   ========================================================================== */

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  /** The month advances only while a Run is live, unfinished, and nothing is
   *  in the way: any open overlay holds the clock, the Tradeoff card included
   *  — reading it should not cost the player Ticks. */
  tick: entry(
    { running: Schema.Boolean, interval: Schema.Finite },
    {
      modelToDependencies: (model: Model) => ({
        running:
          model.route === 'run' &&
          model.run.playing &&
          model.run.overlay === 'none' &&
          model.run.tick < TICKS_IN_MONTH,
        interval: Math.round(260 / model.run.speed),
      }),
      dependenciesToStream: (dependencies: { running: boolean; interval: number }) =>
        dependencies.running
          ? Stream.tick(dependencies.interval).pipe(Stream.map(() => Message.Ticked()))
          : Stream.empty,
    },
  ),

  /** Wall clock for the session, 15 to 30 minutes in the real thing. */
  clock: entry(
    {},
    {
      modelToDependencies: () => ({}),
      dependenciesToStream: () => Stream.tick(1000).pipe(Stream.map(() => Message.SessionTicked())),
    },
  ),
}))
