import { Schema } from 'effect'

/* ==========================================================================
   A Node's lifecycle, as a state machine. It was three fields: `down` (0 up,
   seconds left down, −1 until replaced), `warm` (0 cold to 1 warm), and
   `downCause`. Nothing stopped the fields from disagreeing. Now one tagged
   state says where the Node is, and every transition lives in
   `advanceLife` and the constructors below.
   ========================================================================== */

export const DownCause = Schema.Literals(['restart', 'failure', 'oom'])
export type DownCause = typeof DownCause.Type

export const Life = Schema.Union([
  /** Serving at full speed. */
  Schema.TaggedStruct('Running', {}),
  /** Serving while its runtime warms up: capacity climbs from `warm` to 1. */
  Schema.TaggedStruct('Warming', { warm: Schema.Finite }),
  /** Down for `left` seconds, then it warms up from `warm`. */
  Schema.TaggedStruct('Restarting', {
    left: Schema.Finite,
    cause: DownCause,
    warm: Schema.Finite,
  }),
  /** Down until the player replaces it. */
  Schema.TaggedStruct('Stopped', { cause: DownCause, warm: Schema.Finite }),
])
export type Life = typeof Life.Type

export const RUNNING: Life = { _tag: 'Running' }

/** Warm up from `warm`; 1 is already running. */
export const warming = (warm: number): Life => (warm >= 1 ? RUNNING : { _tag: 'Warming', warm })

export const restarting = (left: number, cause: DownCause, warm: number): Life => ({
  _tag: 'Restarting',
  left,
  cause,
  warm,
})

export const stopped = (cause: DownCause, warm: number): Life => ({
  _tag: 'Stopped',
  cause,
  warm,
})

/** It takes no traffic. */
export const isDown = (life: Life): boolean => life._tag === 'Restarting' || life._tag === 'Stopped'

/** The warm-up the capacity model reads: 1 when running, the stored value otherwise. */
export const warmOf = (life: Life): number => (life._tag === 'Running' ? 1 : life.warm)

/** Why it is down; a running Node reports the last cause it had. */
export const causeOf = (life: Life): DownCause =>
  life._tag === 'Restarting' || life._tag === 'Stopped' ? life.cause : 'restart'

/** Seconds left down: −1 until replaced, 0 when up. */
export const leftOf = (life: Life): number =>
  life._tag === 'Restarting' ? life.left : life._tag === 'Stopped' ? -1 : 0

/** The same lifecycle with a different warm-up: an engine swap, a scale, a cache reset. */
export const withWarm = (life: Life, warm: number): Life =>
  life._tag === 'Running' || life._tag === 'Warming' ? warming(warm) : { ...life, warm }

/** Takes the Node down for `left` seconds, or until replaced when `left` is −1. */
export const down = (life: Life, left: number, cause: DownCause): Readonly<{ life: Life }> => ({
  life: left === -1 ? stopped(cause, warmOf(life)) : restarting(left, cause, warmOf(life)),
})

/** The lifecycle the three old fields described: `down` 0, −1, or seconds left. */
export const lifeOf = (down: number, warm: number, cause: DownCause): Life =>
  down === -1 ? stopped(cause, warm) : down > 0 ? restarting(down, cause, warm) : warming(warm)
