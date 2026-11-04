import { pageAt } from './pages.ts'
import type { Page } from './page.ts'

/* ==========================================================================
   Guided paths: short reading orders across the four kinds, so a reader is
   led from a lesson to the idea behind it and then to the recipe, instead
   of choosing from a list. A page shows its place in the first path that
   holds it, and the step after it.
   ========================================================================== */

export type Path = Readonly<{
  id: string
  title: string
  summary: string
  steps: ReadonlyArray<string>
}>

export const PATHS: ReadonlyArray<Path> = [
  {
    id: 'first-steps',
    title: 'First steps',
    summary:
      'Play your first Company from the Garage to its first incident and its first Research.',
    steps: [
      '/tutorials/first-company',
      '/tutorials/first-bottleneck',
      '/explanation/requests',
      '/tutorials/first-incident',
      '/tutorials/research-and-insight',
      '/guides/find-the-bottleneck',
    ],
  },
  {
    id: 'read-the-numbers',
    title: 'Read the numbers',
    summary: 'What latency, queues, Apdex, and Insight tell you, and how to act on them.',
    steps: [
      '/explanation/latency',
      '/explanation/queues',
      '/guides/read-p99',
      '/explanation/apdex-and-revenue',
      '/explanation/observability',
    ],
  },
  {
    id: 'scale-up',
    title: 'Scale up',
    summary: 'Grow past one box: the data tier, spikes, retries, and more regions.',
    steps: [
      '/explanation/the-data-tier',
      '/guides/scale-the-database',
      '/guides/fix-slow-queries',
      '/guides/survive-a-traffic-spike',
      '/explanation/errors-and-retries',
      '/guides/stop-a-retry-storm',
      '/guides/go-global',
    ],
  },
  {
    id: 'run-the-company',
    title: 'Run the Company',
    summary: 'Money, the team, the Eras, and how a Company ends well.',
    steps: [
      '/explanation/money',
      '/guides/cut-the-cloud-bill',
      '/explanation/team-and-velocity',
      '/explanation/progression',
      '/tutorials/first-exit',
      '/explanation/legacy',
      '/guides/prepare-for-an-exit',
    ],
  },
]

/** A path's pages that exist. */
export const stepsOf = (path: Path): ReadonlyArray<Page> =>
  path.steps.flatMap((step) => {
    const page = pageAt(step)
    return page ? [page] : []
  })

/** The first path that holds a page, and the page's index in it. */
export const placeOf = (pagePath: string): Readonly<{ path: Path; index: number }> | null => {
  for (const path of PATHS) {
    const index = stepsOf(path).findIndex((page) => page.path === pagePath)
    if (index !== -1) return { path, index }
  }
  return null
}

/** The step a reader resumes from: the first one they have not opened. */
export const resumeOf = (path: Path, visited: ReadonlyArray<string>): Page | null => {
  const steps = stepsOf(path)
  return steps.find((page) => !visited.includes(page.path)) ?? null
}
