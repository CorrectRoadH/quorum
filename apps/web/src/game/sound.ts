/* ==========================================================================
   Sound effects, synthesised with ZzFX: each sound is a row of its parameters,
   so there are no audio files. Tune them in the designer at
   https://killedbyapixel.github.io/ZzFX/ and paste the row back.

   Browsers start audio only after the page has had a click or key press, and
   ZzFX opens its AudioContext on import. So ZzFX loads with the first sound
   after that, and sounds before it are skipped.
   ========================================================================== */

/** ZzFX parameters, in order: volume, randomness, frequency, attack, sustain,
 *  release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime,
 *  repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay. */
type Row = readonly [volume: number, randomness: number, frequency: number, ...rest: Array<number>]

const SOUNDS = {
  /** A plate pops up: a short bubble pop, a sine that flicks up in pitch. */
  burst: [[0.6, 0.05, 320, 0, 0.01, 0.06, 0, 1, 24]],
  /** A part pops onto its plate. */
  pop: [[0.18, 0.2, 1100, 0, 0.005, 0.03, 1, 1, 3]],
  /** The pointer reaches a menu item. */
  hover: [[0.12, 0.02, 880, 0, 0.01, 0.03, 0, 1]],
  /** A menu item is chosen: two rising steps. */
  choose: [[0.4, 0, 440, 0, 0.05, 0.15, 1, 1, 0, 0, 220, 0.05]],
} satisfies Record<string, ReadonlyArray<Row>>

export type Sound = keyof typeof SOUNDS

/** The same sound again within this many ms is dropped, so a run of parts does not buzz. */
const GAP = 40
const lastPlayed = new Map<Sound, number>()
let zzfx: Promise<(...parameters: ReadonlyArray<number>) => unknown> | undefined

/** Plays a sound, `pitch` times its usual frequency. */
export const play = (sound: Sound, pitch = 1): void => {
  if (!navigator.userActivation.hasBeenActive) return
  const now = performance.now()
  if (now - (lastPlayed.get(sound) ?? -Infinity) < GAP) return
  lastPlayed.set(sound, now)
  zzfx ??= import('zzfx').then((module) => module.zzfx)
  void zzfx.then((zzfx) => {
    for (const [volume, randomness, frequency, ...rest] of SOUNDS[sound])
      zzfx(volume, randomness, frequency * pitch, ...rest)
  })
}
