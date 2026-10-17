/**
 * The application surface: what `entry.ts` mounts and what tests drive.
 *
 * Quorum is a Foldkit application. The Model, the Messages, the update
 * function, the Subscriptions, and the view all live under `src/game`; this
 * module is the one place that names them together.
 */
export { Model } from '../game/model.ts'
export { Message } from '../game/message.ts'
export { init, update } from '../game/update.ts'
export { subscriptions } from '../game/subscriptions.ts'
export { view } from '../game/view.ts'
