/* ==========================================================================
   Sound effects, synthesised with ZzFX: each note is a row of its parameters,
   so there are no audio files. Tune a row in the designer at
   https://killedbyapixel.github.io/ZzFX/ and paste it back.

   A sound is one or more notes, each with a start time, mixed into one
   buffer so chords and arpeggios land on time. Sounds pan to where the
   pointer was, so the dock sounds from the middle and the toolbar from the
   right.

   Browsers start audio only after the page has had a click or key press, and
   ZzFX opens its AudioContext on import. So ZzFX loads with the first sound
   after that, and sounds before it are skipped.
   ========================================================================== */

/** ZzFX parameters, in order: volume, randomness, frequency, attack, sustain,
 *  release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime,
 *  repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay,
 *  tremolo, filter. Shape: 0 sine, 1 triangle, 2 saw, 3 tan, 4 noise. */
type Row = readonly [volume: number, randomness: number, frequency: number, ...rest: Array<number>]
/** A note: when it starts, in ms, and its row. */
type Note = readonly [at: number, row: Row]

/** Interface sounds are short and quiet: they confirm, they do not perform.
 *  The louder, longer ones are for things that happen rarely. */
const SOUNDS = {
  /* ---- the title screen ---- */
  /** A plate pops up: a short bubble pop, a sine that flicks up in pitch. */
  burst: [[0, [0.6, 0.05, 320, 0, 0.01, 0.06, 0, 1, 24]]],
  /** A part pops onto its plate. */
  pop: [[0, [0.18, 0.2, 1100, 0, 0.005, 0.03, 1, 1, 3]]],
  /** The pointer reaches a menu item. */
  hover: [[0, [0.12, 0.02, 880, 0, 0.01, 0.03, 0, 1]]],
  /** A menu item is chosen: two rising steps. */
  choose: [[0, [0.4, 0, 440, 0, 0.05, 0.15, 1, 1, 0, 0, 220, 0.05]]],

  /* ---- controls: heard tens of times a minute, so barely there ---- */
  /** A selection moves: a dry tick. */
  tick: [[0, [0.14, 0.05, 1500, 0, 0.004, 0.018, 1, 2]]],
  /** A setting changes: a two-part latch click. */
  toggle: [
    [0, [0.16, 0.03, 1250, 0, 0.003, 0.02, 1, 2]],
    [34, [0.12, 0.03, 1700, 0, 0.003, 0.02, 1, 2]],
  ],
  /** A surface opens: a short rising swish. */
  open: [[0, [0.16, 0, 330, 0.008, 0.02, 0.07, 0, 1, 9]]],
  /** A surface closes: the same swish, falling. */
  close: [[0, [0.13, 0, 560, 0.004, 0.02, 0.06, 0, 1, -9]]],
  /** Moving between tabs of one surface. */
  switch: [[0, [0.12, 0.02, 980, 0, 0.008, 0.035, 0, 1, 2]]],
  /** A part is picked up: two quick rising steps. */
  pick: [
    [0, [0.2, 0, 660, 0, 0.015, 0.045, 1, 1]],
    [45, [0.18, 0, 990, 0, 0.015, 0.06, 1, 1]],
  ],

  /* ---- the board ---- */
  /** A card lifts off the board under the pointer. */
  lift: [[0, [0.13, 0, 520, 0.004, 0.01, 0.045, 0, 1, 7]]],
  /** A dragged card crosses a grid line: a detent, barely there. */
  detent: [[0, [0.045, 0.1, 2300, 0, 0.002, 0.008, 1, 2]]],
  /** A card settles back onto the board. */
  drop: [
    [0, [0.26, 0.05, 190, 0, 0.012, 0.07, 0, 1, -4]],
    [0, [0.05, 0, 1700, 0, 0.002, 0.012, 4, 1]],
  ],
  /** A wire is pulled out of a port. */
  pull: [[0, [0.11, 0, 880, 0, 0.006, 0.035, 0, 1, 10]]],
  /** A wire's end finds a port: a magnetic double click. */
  snap: [
    [0, [0.13, 0, 1900, 0, 0.002, 0.014, 1, 2]],
    [14, [0.1, 0, 1450, 0, 0.002, 0.016, 1, 2]],
  ],
  /** A wire let go over nothing springs back into its port. */
  release: [[0, [0.11, 0, 760, 0.004, 0.02, 0.07, 0, 1, -18]]],
  /** A Node lands: a soft, low thunk with a little grit. */
  place: [
    [0, [0.55, 0.05, 150, 0, 0.02, 0.13, 0, 1, -5, 0, 0, 0, 0, 0.15]],
    [0, [0.12, 0, 1800, 0, 0.003, 0.02, 4, 1]],
  ],
  /** A Node is sold: a falling, hollow knock. */
  remove: [[0, [0.3, 0.05, 330, 0, 0.03, 0.14, 1, 1, -14]]],
  /** A Link snaps into a port. */
  connect: [
    [0, [0.12, 0, 2400, 0, 0.002, 0.012, 4, 1]],
    [10, [0.28, 0, 720, 0, 0.012, 0.06, 1, 1, 0, 0, 360, 0.025]],
  ],
  /** A Link is cut: a short snip of noise. */
  cut: [[0, [0.22, 0, 3200, 0, 0.006, 0.035, 4, 1, -30]]],
  /** A Node grows: a rising major arpeggio. */
  upgrade: [
    [0, [0.2, 0, 523, 0, 0.02, 0.07, 1, 1]],
    [55, [0.2, 0, 659, 0, 0.02, 0.07, 1, 1]],
    [110, [0.22, 0, 784, 0, 0.03, 0.12, 1, 1]],
  ],
  /** A Node shrinks: the arpeggio, falling. */
  downgrade: [
    [0, [0.2, 0, 784, 0, 0.02, 0.07, 1, 1]],
    [55, [0.2, 0, 659, 0, 0.02, 0.07, 1, 1]],
    [110, [0.2, 0, 523, 0, 0.03, 0.12, 1, 1]],
  ],
  /** A Node restarts: a spin-down, then a spin-up. */
  reboot: [
    [0, [0.18, 0, 600, 0, 0.03, 0.06, 2, 1, -12, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1800]],
    [130, [0.2, 0, 300, 0.01, 0.04, 0.08, 2, 1, 14, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1800]],
  ],
  /** Cash is collected: a bright two-note coin. */
  coin: [[0, [0.3, 0, 1320, 0, 0.04, 0.2, 1, 1.8, 0, 0, 660, 0.05]]],
  /** A change is taken back: a quick reverse swish. */
  undo: [[0, [0.18, 0, 900, 0.01, 0.02, 0.07, 0, 1, -14]]],

  /* ---- progress: rare, so they may ring ---- */
  /** A Research lands: a bell with a sparkle above it. */
  unlock: [
    [0, [0.25, 0, 880, 0, 0.04, 0.35, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.05]],
    [70, [0.18, 0, 1320, 0, 0.03, 0.3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.05]],
    [140, [0.12, 0, 1760, 0, 0.02, 0.35, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.05]],
  ],
  /** A funding round can be raised: a rising shimmer. */
  ready: [
    [0, [0.16, 0, 988, 0.01, 0.03, 0.2, 0, 1]],
    [80, [0.16, 0, 1319, 0.01, 0.03, 0.2, 0, 1]],
    [160, [0.18, 0, 1976, 0.01, 0.05, 0.3, 0, 1]],
  ],
  /** A round is raised, or a Sandbox passed: a short fanfare. */
  fanfare: [
    [0, [0.25, 0, 523, 0.01, 0.06, 0.1, 1, 1]],
    [110, [0.25, 0, 659, 0.01, 0.06, 0.1, 1, 1]],
    [220, [0.28, 0, 784, 0.01, 0.1, 0.35, 1, 1]],
    [220, [0.18, 0, 1047, 0.01, 0.1, 0.4, 0, 1]],
  ],

  /* ---- notices: each tone has its own sound ---- */
  /** Something went well. */
  success: [
    [0, [0.2, 0, 784, 0, 0.02, 0.08, 0, 1]],
    [70, [0.22, 0, 1175, 0, 0.03, 0.16, 0, 1]],
  ],
  /** Something to know: a soft single bell. */
  notify: [[0, [0.2, 0, 1047, 0, 0.02, 0.3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.04]]],
  /** A change settled: a faint glass tap. */
  settle: [[0, [0.1, 0, 1568, 0, 0.005, 0.12, 0, 1]]],
  /** A warning: two falling mid tones, rounded so they nudge rather than nag. */
  warn: [
    [0, [0.26, 0, 740, 0, 0.05, 0.06, 1, 1]],
    [120, [0.26, 0, 554, 0, 0.06, 0.1, 1, 1]],
  ],
  /** An error: a low, buzzy double knock. */
  error: [
    [0, [0.3, 0, 196, 0, 0.06, 0.05, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 900]],
    [120, [0.32, 0, 147, 0, 0.09, 0.09, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 900]],
  ],
} satisfies Record<string, ReadonlyArray<Note>>

export type Sound = keyof typeof SOUNDS
export const SOUND_NAMES = Object.keys(SOUNDS) as ReadonlyArray<Sound>

/** The same sound again within this many ms is dropped, so a run of parts does not buzz. */
const GAP = 40
const lastPlayed = new Map<Sound, number>()

type Zzfx = Readonly<{
  sampleRate: number
  buildSamples: (...parameters: ReadonlyArray<number>) => Float32Array
  playSamples: (
    channels: ReadonlyArray<Float32Array>,
    volume?: number,
    rate?: number,
    pan?: number,
  ) => unknown
}>
let engine: Promise<Zzfx> | undefined

/** Mixes a sound's notes into one buffer. */
export const mix = (zzfx: Zzfx, sound: Sound, pitch: number): Float32Array => {
  const parts = SOUNDS[sound].map(([at, [volume, randomness, frequency, ...rest]]) => ({
    offset: Math.round((at / 1000) * zzfx.sampleRate),
    samples: zzfx.buildSamples(volume, randomness, frequency * pitch, ...rest),
  }))
  const out = new Float32Array(Math.max(...parts.map((part) => part.offset + part.samples.length)))
  for (const { offset, samples } of parts)
    for (let index = 0; index < samples.length; index += 1) out[offset + index]! += samples[index]!
  return out
}

/** Where the pointer last went down, from -1 (left) to 1 (right). */
let pointerPan = 0
if (typeof window !== 'undefined') {
  addEventListener(
    'pointerdown',
    (event) => (pointerPan = (event.clientX / Math.max(1, innerWidth)) * 2 - 1),
    true,
  )
  addEventListener('keydown', () => (pointerPan = 0), true)
}

/** Plays a sound, `pitch` times its usual frequency. With `spatial`, it pans
 *  a little toward where the pointer last went down. */
export const play = (sound: Sound, pitch = 1, spatial = false): void => {
  if (!navigator.userActivation.hasBeenActive) return
  const now = performance.now()
  if (now - (lastPlayed.get(sound) ?? -Infinity) < GAP) return
  lastPlayed.set(sound, now)
  engine ??= import('zzfx').then((module) => module.ZZFX)
  const pan = spatial ? pointerPan * 0.35 : 0
  void engine.then((zzfx) => zzfx.playSamples([mix(zzfx, sound, pitch)], 1, 1, pan))
}
