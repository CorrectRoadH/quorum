import { authoredPages } from './content.ts'
import type { Section } from './frontmatter.ts'
import type { Page } from './page.ts'
import { referencePages } from './reference/index.ts'

/* ==========================================================================
   Every page on the wiki, and the navigation over them. The build
   prerenders exactly these paths (src/entry.server.ts).
   ========================================================================== */

export const PAGES: ReadonlyArray<Page> = [...authoredPages, ...referencePages]

const byPath = new Map(PAGES.map((page) => [page.path, page]))

export const pageAt = (path: string): Page | null => byPath.get(path) ?? null

/** The top level of the navigation: the four Diátaxis kinds, in the order a new player needs them. */
export const SECTION_ORDER: ReadonlyArray<Section> = [
  'tutorials',
  'guides',
  'explanation',
  'reference',
  'about',
]

/** A section's top-level pages in order. */
export const navOf = (section: Section): ReadonlyArray<Page> =>
  PAGES.filter(
    (page) => page.section === section && page.parent === null && page.path !== '/',
  ).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

/** The pages under a hub, in order. */
export const childrenOf = (path: string): ReadonlyArray<Page> =>
  PAGES.filter((page) => page.parent === path).sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  )
