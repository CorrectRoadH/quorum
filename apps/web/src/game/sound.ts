/* ==========================================================================
   Sound effects, synthesised with Web Audio, so there are no audio files.

   The palette is a factory floor, and each sound follows one of two methods
   from auditory display research:

   - Auditory icons (Gaver, "Synthesizing auditory icons", CHI 1993) for
     things the player touches: cards, Nodes, wires, panels. An impact is a
     sum of sine partials, each decaying exponentially. The partial ratios
     give the object's shape, the first partial its size, the damping its
     material (metal rings, plastic thunks), and the slope of the initial
     amplitudes the hardness of what hit it. Machines are periodic impacts
     whose rate follows the motor speed. This is modal synthesis, as in van
     den Doel, Kry and Pai, "FoleyAutomatic", SIGGRAPH 2001.
   - Earcons (Brewster, Wright and Edwards, "Experimentally derived
     guidelines for the creation of earcons", 1995) for abstract news:
     notices and progress. They are one family with one timbre, a panel
     beeper, and differ by register and rhythm. Their urgency follows
     Edworthy, Loxley and Dennis (1991): urgency rises with pitch, pulse
     speed, pulse count, and inharmonic partials. Warnings start with a
     20 ms onset, so they do not startle.

   Mixing follows Material Design's sound choreography: a loudness tier per
   level of the hierarchy, related sounds share timbre and envelope, and a
   repeated sound varies a little each time. Variation keeps the most frequent
   sounds from tiring the ear (Jacobsen's "nuisance score"); earcons and the
   cash ping stay fixed, so they stay recognisable. All sounds share one room,
   so they sound like one place.

   Impact comes from four things. Loudness grows with duration up to about
   200 ms (temporal integration: Pedersen and Salomon 1977, Florentine 1996),
   so the body of an impact lasts that long, not a 20 ms click. With visuals
   present, loudness rather than pitch sets how big an object seems (Grassi,
   Pastore and Lemaitre 2013; "The louder, the longer", 2019), so gestures sit
   well above controls. Each impact is layered, as sound designers stack sub,
   body, transient, and tail within 80 ms: a thump that drops in pitch under
   the partials and the contact noise, and the room after them. Saturation
   rounds the peaks and adds harmonics, so a sound reads louder at the same
   peak and gains the grit of machinery.

   Browsers start audio only after the page has had a click or key press, so
   the AudioContext opens with the first sound after that, and sounds before
   it are skipped.
   ========================================================================== */

/** One part of a sound. Times are in ms from the sound's start, frequencies in Hz. */
type Layer =
  | Readonly<{
      kind: 'modes'
      at: number
      /** Partial frequencies, already scaled by the object's size. */
      partials: ReadonlyArray<number>
      /** Each partial's initial amplitude. */
      amplitudes: ReadonlyArray<number>
      /** Gaver's material damping δ0: partial n decays as e^(-f·δ0·t). */
      damping: number
    }>
  | Readonly<{
      kind: 'noise'
      at: number
      attack: number
      decay: number
      gain: number
      filter: BiquadFilterType
      frequency: number
      /** The filter sweeps here by the end of the decay. */
      to: number
      q: number
    }>
  | Readonly<{
      kind: 'tone'
      at: number
      wave: OscillatorType
      frequency: number
      /** The pitch sweeps here by the end of the tone. */
      to: number
      attack: number
      hold: number
      decay: number
      gain: number
      /** A low-pass at this frequency softens the wave. */
      cutoff: number
    }>

/* ---- objects: Gaver's parameters ---- */

/** Partial ratios by shape. Bars follow (2n + 1)² / 9; plates are inharmonic. */
const SHAPE = {
  bar: [1, 2.78, 5.44, 9, 13.44],
  plate: [1, 1.59, 2.14, 2.3, 2.65, 2.92, 3.5],
  string: [1, 2, 3, 4, 5, 6],
} as const

/** Gaver's δ0, from about 0.001 for free metal to 0.5 for well-damped plastic.
 *  Iron here is a part bolted into a housing, so it rings only briefly. */
const MATERIAL = { steel: 0.0015, iron: 0.02, plastic: 0.06, rubber: 0.25 } as const

type Impact = Readonly<{
  at?: number
  /** The first partial, in Hz: small objects are high. */
  size: number
  shape: keyof typeof SHAPE
  material: keyof typeof MATERIAL
  /** From 0, a soft mallet with little high energy, to 1, a hard one (Freed). */
  hardness: number
  gain: number
}>

/** An object struck once: its partials, and a short contact noise as bright as the mallet is hard. */
const impact = ({ at = 0, size, shape, material, hardness, gain }: Impact): Array<Layer> => {
  const partials = SHAPE[shape].map((ratio) => size * ratio)
  // Gaver's linear amplitude slope over frequency, scaled so 0 hardness cuts partials above about 1.6 kHz.
  const slope = -(1 - hardness) * 0.0006
  const raw = partials.map((frequency) => Math.max(0, 1 + slope * (frequency - size)))
  const total = raw.reduce((sum, value) => sum + value, 0)
  return [
    {
      kind: 'modes',
      at,
      partials,
      amplitudes: raw.map((value) => (value / total) * gain),
      damping: MATERIAL[material],
    },
    {
      kind: 'noise',
      at,
      attack: 0.5,
      decay: 4 + 6 * (1 - hardness),
      gain: gain * 0.5 * hardness,
      filter: 'bandpass',
      frequency: 1500 + 6000 * hardness,
      to: 1500 + 6000 * hardness,
      q: 0.8,
    },
  ]
}

/** Gaver's machine: an object struck again and again, at a rate that moves from `from` to `to` per second. */
const ratchet = (object: Impact, length: number, from: number, to: number): Array<Layer> => {
  const layers: Array<Layer> = []
  for (let time = 0; time < length;) {
    layers.push(...impact({ ...object, at: (object.at ?? 0) + time }))
    time += 1000 / (from + ((to - from) * time) / length)
  }
  return layers
}

/** Air through a valve: band-passed noise that sweeps from `from` to `to`. */
const hiss = (
  at: number,
  from: number,
  to: number,
  attack: number,
  decay: number,
  gain: number,
): Layer => ({
  kind: 'noise',
  at,
  attack,
  decay,
  gain,
  filter: 'bandpass',
  frequency: from,
  to,
  q: 1.2,
})

/** A motor's whine, a filtered saw that sweeps with its speed. */
const motor = (at: number, from: number, to: number, length: number, gain: number): Layer => ({
  kind: 'tone',
  at,
  wave: 'sawtooth',
  frequency: from,
  to,
  attack: 10,
  hold: length - 40,
  decay: 30,
  gain,
  cutoff: 900,
})

/** The weight under an impact: a sine that drops in pitch as it fades, felt more than heard. */
const thump = (at: number, from: number, to: number, length: number, gain: number): Layer => ({
  kind: 'tone',
  at,
  wave: 'sine',
  frequency: from,
  to,
  attack: 1,
  hold: 0,
  decay: length,
  gain,
  cutoff: 1000,
})

/* ---- earcons: one beeper, told apart by register and rhythm ---- */

/** One pulse of the panel beeper: a square softened by a low-pass, rich in harmonics so it is not masked. */
const beep = (at: number, frequency: number, length: number, gain: number, onset = 4): Layer => ({
  kind: 'tone',
  at,
  wave: 'square',
  frequency,
  to: frequency,
  attack: onset,
  hold: length,
  decay: 12,
  gain,
  cutoff: 3200,
})

/** The level of each tier of the hierarchy, from barely there to loud. */
const TIER = { control: 0.18, gesture: 0.445, notice: 0.978, hero: 0.945 } as const

type Spec = Readonly<{
  tier: keyof typeof TIER
  /** How far pitch and level wander between plays, as a fraction. 0 for earcons. */
  vary: number
  /** How much of the sound goes to the room. */
  room: number
  /** The sound's fader, in dB, so it peaks where its tier does. */
  trim: number
  /** Saturation: 0 is clean; higher rounds the peaks and adds harmonics, so it reads louder. */
  drive: number
  layers: ReadonlyArray<Layer>
}>

const control = (trim: number, layers: ReadonlyArray<Layer>): Spec => ({
  tier: 'control',
  vary: 0.05,
  room: 0.08,
  trim,
  drive: 1,
  layers,
})
const gesture = (trim: number, layers: ReadonlyArray<Layer>): Spec => ({
  tier: 'gesture',
  vary: 0.04,
  room: 0.18,
  trim,
  drive: 1.5,
  layers,
})
const notice = (trim: number, layers: ReadonlyArray<Layer>): Spec => ({
  tier: 'notice',
  vary: 0,
  room: 0.12,
  trim,
  drive: 0,
  layers,
})
const hero = (trim: number, layers: ReadonlyArray<Layer>): Spec => ({
  tier: 'hero',
  vary: 0,
  room: 0.35,
  trim,
  drive: 2,
  layers,
})

/** A key on the panel: a small plastic bar, struck hard. */
const key = (at: number, size: number, gain: number) =>
  impact({ at, size, shape: 'bar', material: 'plastic', hardness: 0.8, gain })
/** A latch: a small iron plate that snaps shut. */
const latch = (at: number, size: number, gain: number) =>
  impact({ at, size, shape: 'plate', material: 'iron', hardness: 0.9, gain })

const SOUNDS = {
  /* ---- the title screen ---- */
  /** The badge goes in: it slides along the slot, latches, and the reader beeps twice. */
  clockin: hero(2.5, [
    hiss(0, 2600, 1800, 60, 150, 0.12),
    ...latch(270, 1500, 0.7),
    thump(270, 150, 55, 180, 0.9),
    ...impact({
      at: 272,
      size: 160,
      shape: 'plate',
      material: 'plastic',
      hardness: 0.4,
      gain: 0.6,
    }),
    beep(380, 1200, 60, 0.18),
    beep(480, 1200, 90, 0.18),
  ]),
  /** A plate slams down: a stamping press. The title steps it up a scale. */
  burst: gesture(6.5, [
    thump(0, 130, 40, 260, 1.4),
    ...impact({ size: 120, shape: 'plate', material: 'plastic', hardness: 0.5, gain: 1 }),
    ...impact({ size: 1100, shape: 'bar', material: 'iron', hardness: 0.9, gain: 0.25 }),
  ]),
  /** A part seats onto its plate. */
  pop: control(1, [...key(0, 1800, 0.6), thump(0, 240, 120, 50, 0.3)]),
  /** The pointer reaches a menu item: a soft touch on a key. */
  hover: control(
    3.5,
    impact({ size: 4200, shape: 'bar', material: 'plastic', hardness: 0.3, gain: 0.25 }),
  ),
  /** A menu item is chosen: a key press and a confirm beep. */
  choose: control(5, [...key(0, 1400, 0.8), thump(0, 200, 90, 80, 0.5), beep(20, 1320, 50, 0.3)]),

  /* ---- controls: heard tens of times a minute, so barely there ---- */
  /** A selection moves: a dry key tick. */
  tick: control(0, [...key(0, 2400, 0.7), thump(0, 260, 140, 35, 0.25)]),
  /** A setting changes: a relay pulls in, its armature thunks, and the contact bounces once. */
  toggle: control(1, [
    ...latch(0, 1800, 0.6),
    thump(0, 210, 100, 70, 0.45),
    ...impact({ size: 900, shape: 'bar', material: 'plastic', hardness: 0.5, gain: 0.5 }),
    ...latch(28, 2300, 0.35),
  ]),
  /** A surface opens: a valve lets out air, then latches. */
  open: control(1, [
    hiss(0, 5000, 2000, 10, 140, 0.6),
    ...latch(70, 1400, 0.45),
    thump(70, 170, 65, 130, 1),
  ]),
  /** A surface closes: the same latch and air, the other way round. */
  close: control(0.5, [
    ...latch(0, 1200, 0.55),
    thump(0, 160, 60, 130, 1),
    hiss(5, 2500, 4500, 2, 110, 0.4),
  ]),
  /** Moving between tabs of one surface: a rotary switch steps once. */
  switch: control(0, [...key(0, 2000, 0.6), thump(0, 240, 130, 40, 0.3), ...key(16, 2600, 0.3)]),
  /** A part is picked up: a gripper ratchets shut. */
  pick: control(1, [
    ...ratchet(
      { size: 2200, shape: 'bar', material: 'plastic', hardness: 0.6, gain: 0.25 },
      50,
      90,
      140,
    ),
    ...latch(55, 1600, 0.55),
    thump(55, 190, 70, 120, 1),
  ]),

  /* ---- the board ---- */
  /** A card lifts off the board: a servo whirs up. */
  lift: gesture(6, [motor(0, 140, 260, 70, 0.22), ...key(0, 1900, 0.25)]),
  /** A dragged card crosses a grid line: a detent, barely there. */
  detent: control(-1, [...key(0, 3200, 0.3), thump(0, 300, 180, 25, 0.15)]),
  /** A card settles back onto the board: a steel tray on rubber feet. */
  drop: gesture(1.5, [
    thump(0, 150, 55, 140, 1),
    ...impact({ size: 180, shape: 'plate', material: 'rubber', hardness: 0.3, gain: 0.9 }),
    ...key(0, 1500, 0.3),
  ]),
  /** A wire is pulled out of a port: friction, then the plug comes free. */
  pull: gesture(0, [
    hiss(0, 3000, 2400, 3, 30, 0.25),
    ...impact({ at: 25, size: 700, shape: 'bar', material: 'plastic', hardness: 0.4, gain: 0.5 }),
    thump(25, 180, 90, 70, 0.4),
  ]),
  /** A wire's end finds a port: a connector latches in two clicks. */
  snap: gesture(0.5, [
    ...impact({ size: 2600, shape: 'bar', material: 'iron', hardness: 0.9, gain: 0.45 }),
    thump(0, 220, 90, 90, 0.7),
    ...key(14, 1700, 0.4),
  ]),
  /** A wire let go over nothing reels back and knocks into its port. */
  release: gesture(-0.5, [
    hiss(0, 1800, 900, 5, 80, 0.3),
    ...key(80, 1200, 0.45),
    thump(80, 200, 90, 70, 0.5),
  ]),
  /** A Node lands: a short rush of air as it comes down, then a heavy clamp with a ring of steel. */
  place: gesture(5.5, [
    hiss(0, 1500, 4500, 18, 6, 0.2),
    thump(20, 130, 42, 260, 1.6),
    ...impact({ at: 20, size: 95, shape: 'plate', material: 'plastic', hardness: 0.3, gain: 2.5 }),
    ...impact({ at: 20, size: 620, shape: 'plate', material: 'steel', hardness: 0.9, gain: 0.06 }),
    ...latch(28, 1900, 0.35),
  ]),
  /** A Node is sold: a relay drops out and its motor winds down. */
  remove: gesture(3, [
    ...latch(0, 1400, 0.45),
    thump(0, 170, 60, 140, 0.7),
    motor(10, 300, 70, 220, 0.25),
  ]),
  /** A Link snaps into a port: a latch, then a two-beep handshake. */
  connect: gesture(2, [
    ...impact({ size: 2600, shape: 'bar', material: 'iron', hardness: 0.9, gain: 0.45 }),
    ...impact({ size: 180, shape: 'plate', material: 'plastic', hardness: 0.5, gain: 0.4 }),
    thump(0, 200, 75, 120, 0.8),
    beep(45, 1480, 25, 0.12),
    beep(85, 1480, 25, 0.12),
  ]),
  /** A Link is cut: a shear blade closes on the wire. */
  cut: gesture(1, [
    hiss(0, 7000, 4000, 1, 70, 0.45),
    ...impact({ size: 2900, shape: 'bar', material: 'steel', hardness: 1, gain: 0.1 }),
    ...key(0, 1300, 0.4),
    thump(0, 220, 80, 110, 0.9),
  ]),
  /** A Node grows: its motor spins up, ratcheting faster, then a rising beep pair. */
  upgrade: gesture(5, [
    motor(0, 70, 220, 220, 0.25),
    ...ratchet(
      { size: 1600, shape: 'bar', material: 'plastic', hardness: 0.6, gain: 0.18 },
      220,
      20,
      60,
    ),
    thump(220, 160, 70, 120, 0.6),
    beep(240, 880, 40, 0.14),
    beep(300, 1320, 60, 0.14),
  ]),
  /** A Node shrinks: the same motor and beeps, the other way round. */
  downgrade: gesture(5.5, [
    motor(0, 220, 70, 220, 0.25),
    ...ratchet(
      { size: 1600, shape: 'bar', material: 'plastic', hardness: 0.6, gain: 0.18 },
      220,
      60,
      20,
    ),
    thump(220, 160, 70, 120, 0.6),
    beep(240, 1320, 40, 0.14),
    beep(300, 880, 60, 0.14),
  ]),
  /** A Node restarts: power drops, the motor winds down and back up, and it beeps ready. */
  reboot: gesture(3.5, [
    ...latch(0, 1400, 0.45),
    thump(0, 170, 60, 140, 0.7),
    motor(0, 260, 70, 180, 0.22),
    motor(220, 70, 260, 180, 0.22),
    beep(420, 1320, 40, 0.14),
  ]),
  /** Cash is collected: a counter ticks over and pings. Fixed, so it stays recognisable. */
  coin: {
    tier: 'gesture',
    vary: 0,
    room: 0.18,
    trim: 2.5,
    drive: 1.5,
    layers: [
      ...key(0, 2000, 0.3),
      thump(0, 200, 80, 120, 0.8),
      ...key(25, 2300, 0.3),
      ...impact({ at: 25, size: 2093, shape: 'bar', material: 'steel', hardness: 0.9, gain: 0.25 }),
    ],
  },
  /** A change is taken back: an actuator retracts. */
  undo: gesture(0.5, [
    hiss(0, 3000, 1500, 4, 60, 0.3),
    ...key(60, 1500, 0.4),
    thump(60, 190, 90, 70, 0.4),
  ]),

  /* ---- progress: rare, so they may ring ---- */
  /** A Research lands: a printer chatters out the result, then two beeps. */
  unlock: hero(0.5, [
    thump(0, 160, 60, 120, 0.6),
    ...ratchet(
      { size: 2600, shape: 'bar', material: 'plastic', hardness: 0.7, gain: 0.2 },
      160,
      35,
      35,
    ),
    beep(190, 880, 60, 0.16),
    beep(270, 1760, 120, 0.16),
  ]),
  /** A funding round can be raised: three ready beeps, the last one up. */
  ready: notice(3.5, [
    beep(0, 1320, 40, 0.16),
    beep(90, 1320, 40, 0.16),
    beep(180, 1760, 80, 0.16),
  ]),
  /** A round is raised, or a Sandbox passed: a relay, then the shift horn, a fifth. */
  fanfare: hero(3.5, [
    ...latch(0, 1500, 0.4),
    thump(0, 140, 45, 250, 1.2),
    {
      kind: 'tone',
      at: 20,
      wave: 'sawtooth',
      frequency: 220,
      to: 220,
      attack: 25,
      hold: 250,
      decay: 160,
      gain: 0.2,
      cutoff: 1400,
    },
    {
      kind: 'tone',
      at: 20,
      wave: 'sawtooth',
      frequency: 330,
      to: 330,
      attack: 25,
      hold: 250,
      decay: 160,
      gain: 0.16,
      cutoff: 1400,
    },
  ]),

  /* ---- notices: earcons, in order of urgency ---- */
  /** A change settled: one faint, short, high pulse. */
  settle: notice(-2.5, [beep(0, 1760, 12, 0.08)]),
  /** Something to know: one pulse. */
  notify: notice(0.5, [beep(0, 880, 70, 0.2)]),
  /** Something went well: two slow pulses, rising a fifth. */
  success: notice(2, [beep(0, 660, 50, 0.18), beep(90, 990, 80, 0.18)]),
  /** A warning: three quicker pulses at one mid pitch, each with a soft onset. */
  warn: notice(2.5, [
    beep(0, 740, 60, 0.2, 20),
    beep(150, 740, 60, 0.2, 20),
    beep(300, 740, 60, 0.2, 20),
  ]),
  /** An error: a low buzzer, twice. Two detuned waves beat, so the partials are not harmonic. */
  error: notice(-4, [
    thump(0, 120, 50, 120, 0.6),
    thump(130, 120, 50, 120, 0.6),
    {
      kind: 'tone',
      at: 0,
      wave: 'sawtooth',
      frequency: 220,
      to: 220,
      attack: 6,
      hold: 80,
      decay: 20,
      gain: 0.18,
      cutoff: 2000,
    },
    beep(0, 233, 80, 0.12),
    {
      kind: 'tone',
      at: 130,
      wave: 'sawtooth',
      frequency: 220,
      to: 220,
      attack: 6,
      hold: 140,
      decay: 30,
      gain: 0.18,
      cutoff: 2000,
    },
    beep(130, 233, 140, 0.12),
  ]),

  /* ---- moments ---- */
  /** An incident starts: the most urgent sound, a fast two-tone klaxon, high and inharmonic. */
  incident: hero(2.5, [
    thump(0, 110, 40, 300, 1.2),
    ...[0, 1, 2, 3, 4, 5].flatMap((step) => {
      const frequency = step % 2 === 0 ? 800 : 600
      return [beep(step * 85, frequency, 60, 0.13), beep(step * 85, frequency * 1.06, 60, 0.08)]
    }),
  ]),
  /** A new Era: the factory whistle, long and low, after a slam. */
  era: hero(5, [
    thump(0, 90, 30, 600, 1.6),
    ...impact({ size: 70, shape: 'plate', material: 'plastic', hardness: 0.5, gain: 1 }),
    hiss(40, 3000, 2400, 40, 500, 0.1),
    {
      kind: 'tone',
      at: 60,
      wave: 'sawtooth',
      frequency: 233,
      to: 233,
      attack: 50,
      hold: 450,
      decay: 300,
      gain: 0.16,
      cutoff: 1800,
    },
    {
      kind: 'tone',
      at: 60,
      wave: 'sawtooth',
      frequency: 349,
      to: 349,
      attack: 50,
      hold: 450,
      decay: 300,
      gain: 0.13,
      cutoff: 1800,
    },
    {
      kind: 'tone',
      at: 60,
      wave: 'square',
      frequency: 466,
      to: 466,
      attack: 50,
      hold: 450,
      decay: 300,
      gain: 0.06,
      cutoff: 1800,
    },
  ]),
  /** An achievement: a stamp, then a bright beep pair. */
  achievement: hero(3.5, [
    thump(0, 120, 40, 300, 1.4),
    ...impact({ size: 110, shape: 'plate', material: 'plastic', hardness: 0.6, gain: 0.9 }),
    ...latch(0, 1500, 0.3),
    beep(80, 1568, 50, 0.15),
    beep(150, 2093, 120, 0.15),
  ]),
} satisfies Record<string, Spec>

export type Sound = keyof typeof SOUNDS
export const SOUND_NAMES = Object.keys(SOUNDS) as ReadonlyArray<Sound>

/* ---- the engine ---- */

/** The output every sound goes into: dry to the compressor, and a send to the room. */
export type Bus = Readonly<{ dry: AudioNode; room: AudioNode }>

/** A second of white noise per context, which noise layers read from a random offset. */
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()
const noiseOf = (context: BaseAudioContext): AudioBuffer => {
  let buffer = noiseBuffers.get(context)
  if (!buffer) {
    buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1
    noiseBuffers.set(context, buffer)
  }
  return buffer
}

/** A factory hall: a few early reflections off near walls, then a second of decaying stereo
 *  noise that darkens as it fades. */
const hallOf = (context: BaseAudioContext): AudioBuffer => {
  const rate = context.sampleRate
  const length = Math.round(rate * 1.1)
  const buffer = context.createBuffer(2, length, rate)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel)
    let low = 0
    for (let index = 0; index < length; index += 1) {
      const fade = index / length
      low += (Math.random() * 2 - 1 - low) * (0.6 - 0.55 * fade)
      data[index] = 0.7 * low * (1 - fade) ** 4 * Math.min(1, index / (rate * 0.02))
    }
    // Each channel hears the walls at slightly different times, which widens the room.
    for (const [ms, gain] of [
      [11, 0.5],
      [19, 0.35],
      [29, 0.3],
      [43, 0.2],
    ] as const)
      data[Math.round(((ms + channel * 3) / 1000) * rate)]! += gain
  }
  return buffer
}

/** Saturation curves by drive: tanh, scaled so small signals pass at unity. The shaper sees a
 *  quarter of the signal, since its input stops at ±1. */
const driveCurves = new Map<number, Float32Array<ArrayBuffer>>()
const driveCurve = (drive: number): Float32Array<ArrayBuffer> => {
  let curve = driveCurves.get(drive)
  if (!curve) {
    curve = new Float32Array(2049)
    for (let index = 0; index < curve.length; index += 1) {
      const x = (index / 1024 - 1) * 4
      curve[index] = Math.tanh(drive * x) / drive / 4
    }
    driveCurves.set(drive, curve)
  }
  return curve
}

/** A soft clipper: straight up to half scale (-6 dBFS), then rounding off, so overlapping sounds
 *  never clip. Not a compressor: a compressor starts fully attenuated and ducks the first sound of
 *  a session. */
const clipCurve = (() => {
  const curve = new Float32Array(1025)
  for (let index = 0; index < curve.length; index += 1) {
    const x = index / 512 - 1
    curve[index] =
      Math.abs(x) < 0.5 ? x : Math.sign(x) * (0.5 + 0.5 * Math.tanh((Math.abs(x) - 0.5) / 0.5))
  }
  return curve
})()

/** Builds the shared bus on a context: the room and a soft clipper, into `output`. */
export const busOf = (context: BaseAudioContext, output: AudioNode): Bus => {
  const clipper = new WaveShaperNode(context, { curve: clipCurve, oversample: '2x' })
  clipper.connect(output)
  const room = new ConvolverNode(context, { buffer: hallOf(context) })
  room.connect(clipper)
  return { dry: clipper, room }
}

/** Below this level a decaying envelope counts as silent. */
const SILENT = 0.0005

/** Schedules one layer into `output` at `start` seconds; returns when it ends. */
const schedule = (
  context: BaseAudioContext,
  output: AudioNode,
  layer: Layer,
  start: number,
  pitch: number,
  jitter: () => number,
): number => {
  const at = start + layer.at / 1000
  const nyquist = context.sampleRate / 2
  switch (layer.kind) {
    case 'modes': {
      let end = at
      layer.partials.forEach((partial, index) => {
        const frequency = partial * pitch * (1 + jitter() * 0.01)
        const amplitude = layer.amplitudes[index]!
        if (amplitude <= 0 || frequency >= nyquist * 0.9) return
        // Gaver: partial n decays as e^(-δn t) with δn = fn · δ0, capped so nothing rings past its moment.
        const tau = Math.min(frequency < 600 ? 0.35 : 0.15, 1 / (frequency * layer.damping))
        const stop = at + 0.001 + tau * Math.log(amplitude / SILENT)
        const oscillator = new OscillatorNode(context, { frequency })
        const gain = new GainNode(context, { gain: 0 })
        gain.gain.setValueAtTime(0, at)
        gain.gain.linearRampToValueAtTime(amplitude, at + 0.001)
        gain.gain.setTargetAtTime(0, at + 0.001, tau)
        oscillator.connect(gain).connect(output)
        oscillator.start(at)
        oscillator.stop(stop)
        end = Math.max(end, stop)
      })
      return end
    }
    case 'noise': {
      const attack = layer.attack / 1000
      const stop = at + attack + layer.decay / 1000
      const source = new AudioBufferSourceNode(context, { buffer: noiseOf(context), loop: true })
      const filter = new BiquadFilterNode(context, { type: layer.filter, Q: layer.q })
      const from = Math.min(layer.frequency * pitch, nyquist * 0.9)
      filter.frequency.setValueAtTime(from, at)
      filter.frequency.exponentialRampToValueAtTime(Math.min(layer.to * pitch, nyquist * 0.9), stop)
      const gain = new GainNode(context, { gain: 0 })
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(layer.gain, at + attack)
      gain.gain.exponentialRampToValueAtTime(SILENT, stop)
      source.connect(filter).connect(gain).connect(output)
      source.start(at, Math.random())
      source.stop(stop)
      return stop
    }
    case 'tone': {
      const attack = layer.attack / 1000
      const hold = layer.hold / 1000
      const stop = at + attack + hold + layer.decay / 1000
      const oscillator = new OscillatorNode(context, { type: layer.wave })
      oscillator.frequency.setValueAtTime(layer.frequency * pitch, at)
      oscillator.frequency.exponentialRampToValueAtTime(layer.to * pitch, stop)
      const filter = new BiquadFilterNode(context, {
        type: 'lowpass',
        frequency: layer.cutoff,
        Q: 0.7,
      })
      const gain = new GainNode(context, { gain: 0 })
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(layer.gain, at + attack)
      gain.gain.setValueAtTime(layer.gain, at + attack + hold)
      gain.gain.exponentialRampToValueAtTime(SILENT, stop)
      oscillator.connect(filter).connect(gain).connect(output)
      oscillator.start(at)
      oscillator.stop(stop)
      return stop
    }
  }
}

/** Schedules a sound into `bus`, `pitch` times its usual frequency and panned to `pan`.
 *  `random` returns values in [0, 1) and drives the variation between plays.
 *  Returns when the sound ends, before the room's tail. */
export const render = (
  context: BaseAudioContext,
  bus: Bus,
  sound: Sound,
  { pitch = 1, pan = 0, start = context.currentTime, random = Math.random } = {},
): number => {
  const spec: Spec = SOUNDS[sound]
  const jitter = () => (spec.vary > 0 ? random() * 2 - 1 : 0)
  const level = new GainNode(context, {
    gain: TIER[spec.tier] * 10 ** (spec.trim / 20) * (1 + jitter() * spec.vary * 2),
  })
  const panner = new StereoPannerNode(context, { pan })
  const send = new GainNode(context, { gain: spec.room })
  let input: AudioNode = level
  if (spec.drive > 0) {
    input = new GainNode(context, { gain: 0.25 })
    const shaper = new WaveShaperNode(context, { curve: driveCurve(spec.drive), oversample: '4x' })
    const restore = new GainNode(context, { gain: 4 })
    input.connect(shaper).connect(restore).connect(level)
  }
  level.connect(panner)
  panner.connect(bus.dry)
  panner.connect(send).connect(bus.room)
  const varied = pitch * (1 + jitter() * spec.vary)
  return spec.layers.reduce(
    (end, layer) => Math.max(end, schedule(context, input, layer, start, varied, jitter)),
    start,
  )
}

/** The same sound again within this many ms is dropped, so a run of parts does not buzz. */
const GAP = 40
const lastPlayed = new Map<Sound, number>()

let live: Readonly<{ context: AudioContext; bus: Bus }> | undefined

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

let muted = false

/** The player's mute setting; every sound checks it. */
export const setMuted = (value: boolean): void => {
  muted = value
}

/** Plays a sound, `pitch` times its usual frequency. With `spatial`, it pans
 *  a little toward where the pointer last went down. */
export const play = (sound: Sound, pitch = 1, spatial = false): void => {
  if (muted || !navigator.userActivation.hasBeenActive) return
  const now = performance.now()
  if (now - (lastPlayed.get(sound) ?? -Infinity) < GAP) return
  lastPlayed.set(sound, now)
  if (!live) {
    const context = new AudioContext({ latencyHint: 'interactive' })
    const master = new GainNode(context, { gain: 0.5 })
    master.connect(context.destination)
    live = { context, bus: busOf(context, master) }
  }
  if (live.context.state === 'suspended') void live.context.resume()
  render(live.context, live.bus, sound, { pitch, pan: spatial ? pointerPan * 0.35 : 0 })
}
