import { Schema } from 'effect'

/* The frontmatter of an authored page. Values are flat strings (a @foldkit/markdown rule); the
   build rejects an unknown field. An entity's prose file (content/components/lb.md) has none:
   its title and facts come from the catalog. */

export const SECTIONS = ['start', 'guides', 'mechanics', 'reference', 'about'] as const
export type Section = (typeof SECTIONS)[number]

export const Frontmatter = Schema.Struct({
  title: Schema.String.check(Schema.isNonEmpty()),
  summary: Schema.String.check(Schema.isNonEmpty()),
  section: Schema.Literals(SECTIONS),
  /** Position in its section's list, lowest first. */
  order: Schema.optionalKey(Schema.String),
  /** The Era index (0 = Garage) where a reader first needs the page. */
  era: Schema.optionalKey(Schema.String),
  /** Other words a reader may search for, comma-separated. */
  aliases: Schema.optionalKey(Schema.String),
  /** The GDD file the page rewrites, for maintainers. */
  gdd: Schema.optionalKey(Schema.String),
})
export type Frontmatter = typeof Frontmatter.Type
