import { describe, expect, test } from 'vitest'
import {
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
