import { Schema } from 'effect'

/* The live views a Markdown page may place with a directive, and the attributes each takes.
   vite.config.ts passes these to the Markdown plugin, so an unknown island or attribute fails
   the build with its file and line. src/island-views.ts renders them. */

export const islandAttributes = {
  /** An aside: `:::Note{tone="tip"}`. */
  Note: Schema.Struct({ tone: Schema.optionalKey(Schema.Literals(['tip', 'warn', 'real'])) }),
}
