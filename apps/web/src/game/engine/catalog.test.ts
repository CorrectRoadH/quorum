import { describe, expect, test } from 'vitest'
import glossary from '../../../../../docs/gdd/glossary.md?raw'
import {
  AXES,
  RUNTIMES,
  RUNTIME_IDS,
  type Axes,
  FRAMEWORKS,
  FRAMEWORK_IDS,
  FRAMEWORK_RESEARCH,
  LANGUAGES,
  RESEARCH,
  RESEARCH_IDS,
  researchList,
  type ResearchId,
} from './catalog.ts'

/* The research catalog against 10 "Research": cost bands, prerequisites, and the GDD's ids. */

/** 10 "Cost bands", in Insight, per Era. */
const BANDS: ReadonlyArray<readonly [number, number]> = [
  [10, 60],
  [60, 300],
]

/** Every Garage and Pre-seed research id in 10 "Research", plus the Auth Provider's (plan C8). */
const GDD_IDS: ReadonlyArray<string> = [
  'dns-rr',
  'load-balancing',
  'health-checks',
  'lb-algorithms',
  'query-analysis',
  'caching',
  'pooling',
  'replication',
  'timeouts',
  'ci',
  'logs',
  'metrics',
  'percentiles',
  'alerting',
  'keepalive',
  'gzip',
  'eager-loading',
  'php-fpm',
  'opcache',
  'lang-ruby',
  'lang-node',
  'lang-python',
  'node-cluster',
  'libuv-pool',
  'fw-laravel',
  'fw-rails',
  'fw-express',
  'fw-symfony',
  'fw-sinatra',
  'fw-django',
  'fw-flask',
  'stripe',
  'funnels',
  'code-review',
  'testing-culture',
  'auth-provider',
]

/** Deploys, CI/CD and Dev Hours arrive in M4. */
const DEFERRED: ReadonlyArray<string> = ['ci', 'code-review', 'testing-culture']

describe('the research catalog', () => {
  test('every cost sits inside its Era’s band', () => {
    for (const entry of researchList) {
      const [low, high] = BANDS[entry.era] ?? [0, Number.POSITIVE_INFINITY]
      expect([entry.id, entry.cost >= low && entry.cost <= high]).toEqual([entry.id, true])
    }
  })

  test('every prerequisite exists, opens no later, and no chain loops', () => {
    for (const entry of researchList)
      for (const needed of entry.requires)
        expect(RESEARCH[needed].era).toBeLessThanOrEqual(entry.era)
    const visiting = new Set<ResearchId>()
    const done = new Set<ResearchId>()
    const visit = (id: ResearchId) => {
      if (done.has(id)) return
      expect(visiting.has(id)).toBe(false)
      visiting.add(id)
      for (const needed of RESEARCH[id].requires) visit(needed)
      visiting.delete(id)
      done.add(id)
    }
    for (const id of RESEARCH_IDS) visit(id)
  })

  test('every framework has a language and a research item', () => {
    for (const id of FRAMEWORK_IDS) {
      const language = FRAMEWORKS[id].language
      if (id === 'none') continue
      expect(language && LANGUAGES[language]).toBeTruthy()
      expect(FRAMEWORK_RESEARCH[id]).not.toBeNull()
    }
  })

  test('every Garage and Pre-seed id in the design exists, except the M4 ones', () => {
    const missing = GDD_IDS.filter((id) => !(RESEARCH_IDS as ReadonlyArray<string>).includes(id))
    expect(missing).toEqual(DEFERRED)
    for (const id of RESEARCH_IDS) expect(RESEARCH[id]?.id).toBe(id)
  })
})

/* 06 "The six axes": the data behind the Tradeoff card's radar. */
describe('the six axes', () => {
  const runtimes = RUNTIME_IDS.map((id) => [id, RUNTIMES[id]] as const)
  const frameworks = FRAMEWORK_IDS.map((id) => [id, FRAMEWORKS[id]] as const)

  test('every runtime and framework has six axes, each from 1 to 5', () => {
    for (const [, def] of [...runtimes, ...frameworks]) {
      expect(Object.keys(def.axes).toSorted()).toEqual([...AXES].toSorted())
      for (const axis of AXES) {
        expect(def.axes[axis]).toBeGreaterThanOrEqual(1)
        expect(def.axes[axis]).toBeLessThanOrEqual(5)
      }
    }
  })

  /** A static form of pillar 2: no option is at least as good as a sibling on all six axes. */
  const undominated = (options: ReadonlyArray<readonly [string, { axes: Axes }]>) => {
    const dominated: Array<string> = []
    for (const [a, first] of options)
      for (const [b, second] of options)
        if (a !== b && AXES.every((axis) => first.axes[axis] >= second.axes[axis]))
          dominated.push(`${a} is at least ${b} on every axis`)
    return dominated
  }

  test('no runtime is at least as good as another on every axis', () => {
    expect(undominated(runtimes)).toEqual([])
  })

  test('no framework is at least as good as a sibling in its language on every axis', () => {
    for (const language of Object.keys(LANGUAGES))
      expect(
        undominated(
          frameworks.filter(([, def]) => def.language === language || def.language === null),
        ),
      ).toEqual([])
  })

  test('every glossary term names a heading in the glossary', () => {
    const anchors = new Set(
      [...glossary.matchAll(/^## (.+)$/gm)].map(([, title]) =>
        (title ?? '')
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/ /g, '-'),
      ),
    )
    for (const [, def] of [...runtimes, ...frameworks])
      for (const term of def.glossary) expect(anchors).toContain(term)
  })
})
