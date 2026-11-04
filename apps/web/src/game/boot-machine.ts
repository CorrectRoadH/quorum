import { Schema } from 'effect'
import { define, to } from 'foldkit/experimental/machine'

/* ==========================================================================
   The boot sequence: the clock-in reader, the title, and the monitor's
   connect animation before a board. It was a `gate` literal plus a
   `connecting` boolean, so "shut and connecting" and "clocking and ready"
   were representable. Now one state says where the app is.
   ========================================================================== */

export const Boot = Schema.Union([
  /** The title screen behind the clock-in splash, before any input. */
  Schema.TaggedStruct('Shut', {}),
  /** The badge went in; the title is revealing. */
  Schema.TaggedStruct('Clocking', {}),
  /** The title and every board wait for input. */
  Schema.TaggedStruct('Ready', {}),
  /** A board is opening; the monitor plays its connect sequence. */
  Schema.TaggedStruct('Connecting', {}),
])
export type Boot = typeof Boot.Type

export const BootEvent = Schema.Union([
  Schema.TaggedStruct('ClockedIn', {}),
  Schema.TaggedStruct('TitleRevealed', {}),
  Schema.TaggedStruct('BoardOpened', {}),
  Schema.TaggedStruct('Connected', {}),
])
export type BootEvent = typeof BootEvent.Type

export const bootMachine = define({ state: Boot, message: BootEvent })({
  initial: { _tag: 'Ready' },
  states: {
    Shut: {
      on: {
        ClockedIn: to('Clocking', () => ({ model: { _tag: 'Clocking' } })),
      },
    },
    Clocking: {
      on: {
        TitleRevealed: to('Ready', () => ({ model: { _tag: 'Ready' } })),
      },
    },
    Ready: {
      on: {
        BoardOpened: to('Connecting', () => ({ model: { _tag: 'Connecting' } })),
      },
    },
    Connecting: {
      on: {
        Connected: to('Ready', () => ({ model: { _tag: 'Ready' } })),
      },
    },
  },
})

/** The next state, or the same one when the event does not apply. */
export const bootStep = (boot: Boot, event: BootEvent): Boot => bootMachine.step(boot, event).state

/** The title has finished revealing, so the booth replaces the reader. */
export const titleIsOpen = (boot: Boot): boolean =>
  boot._tag === 'Ready' || boot._tag === 'Connecting'

/** The monitor is playing its connect sequence: the clock holds and keys are ignored. */
export const connecting = (boot: Boot): boolean => boot._tag === 'Connecting'
