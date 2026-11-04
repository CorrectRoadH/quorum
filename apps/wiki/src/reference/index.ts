import type { Page } from '../page.ts'
import { componentPages } from './components.ts'
import { eraPages } from './eras.ts'
import { glossaryPages } from './glossary.ts'
import { incidentPages } from './incidents.ts'
import { researchPages } from './research.ts'
import { stackPages } from './stacks.ts'
import { systemPages } from './systems.ts'

/* Reference pages, generated from the catalog. */

export const referencePages: ReadonlyArray<Page> = [
  ...componentPages,
  ...researchPages,
  ...eraPages,
  ...stackPages,
  ...incidentPages,
  ...glossaryPages,
  ...systemPages,
]
