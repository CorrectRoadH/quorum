import { Schema } from 'effect'

/* ==========================================================================
   Company logos. A logo is pure presentation: the Simulation never reads it,
   and the save keeps only its id. Each mark is a monoline glyph in one hue,
   so it reads on the title screen's dark glass and in the board's panels.
   ========================================================================== */

export const LOGO_IDS = [
  'orbit',
  'bolt',
  'layers',
  'spark',
  'wave',
  'cube',
  'signal',
  'bracket',
] as const
export type LogoId = (typeof LOGO_IDS)[number]
export const LogoId = Schema.Literals(LOGO_IDS)

export const DEFAULT_LOGO: LogoId = 'orbit'

export type LogoDef = Readonly<{
  id: LogoId
  name: string
  /** The hue of the mark's oklch color: the same mark on every screen. */
  hue: number
  /** Stroked paths on a 24 x 24 grid. */
  paths: ReadonlyArray<string>
}>

export const LOGOS: ReadonlyArray<LogoDef> = [
  {
    id: 'orbit',
    name: 'Orbit',
    hue: 230,
    paths: ['M12 5a7 7 0 1 0 .01 0', 'M18.5 5.5a11 11 0 0 1-13 13'],
  },
  { id: 'bolt', name: 'Bolt', hue: 75, paths: ['M13 3 5 14h6l-1 7 8-11h-6z'] },
  { id: 'layers', name: 'Layers', hue: 285, paths: ['M12 3 3 8l9 5 9-5z', 'M3 13l9 5 9-5'] },
  {
    id: 'spark',
    name: 'Spark',
    hue: 160,
    paths: ['M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z'],
  },
  { id: 'wave', name: 'Wave', hue: 195, paths: ['M3 14c3-6 6-6 9 0s6 6 9 0'] },
  {
    id: 'cube',
    name: 'Cube',
    hue: 25,
    paths: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M12 12l8-4.5', 'M12 12v9', 'M12 12 4 7.5'],
  },
  { id: 'signal', name: 'Signal', hue: 330, paths: ['M5 18v-4', 'M12 18v-9', 'M19 18V5'] },
  { id: 'bracket', name: 'Bracket', hue: 120, paths: ['M9 5 4 12l5 7', 'M15 5l5 7-5 7'] },
]

export const logoOf = (id: LogoId): LogoDef => LOGOS.find((logo) => logo.id === id) ?? LOGOS[0]!
