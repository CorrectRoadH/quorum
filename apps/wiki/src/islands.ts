import { Schema } from 'effect'
import { COMPONENT_IDS, ERAS, RESEARCH_TRACKS } from '@quorum/simulation/catalog'
import { SANDBOX_IDS } from '@quorum/simulation/sandbox'

/* The live views a Markdown page may place with a directive, and the attributes each takes.
   vite.config.ts passes these to the Markdown plugin, so an unknown island or attribute fails
   the build with its file and line. src/island-views.ts renders them. */

export const islandAttributes = {
  /** An aside: `:::Note{tone="tip"}`. */
  Note: Schema.Struct({ tone: Schema.optionalKey(Schema.Literals(['tip', 'warn', 'real'])) }),
  /** A guided Sandbox's board, replayed in the page: `::Sandbox{id="out-of-credits"}`. */
  Sandbox: Schema.Struct({ id: Schema.Literals(SANDBOX_IDS) }),
  /** A Component's card, as it stands on the board: `::Component{id="lb"}`. */
  Component: Schema.Struct({ id: Schema.Literals(COMPONENT_IDS) }),
  /** An Era's request mix as one bar: `::Mix{era="3"}`. */
  Mix: Schema.Struct({
    era: Schema.Literals(ERAS.map((_, index) => String(index)) as ReadonlyArray<string>),
  }),
  /** One Research track, as the tree draws it: `::Track{track="data"}`. */
  Track: Schema.Struct({ track: Schema.Literals(RESEARCH_TRACKS.map((entry) => entry.key)) }),
}
