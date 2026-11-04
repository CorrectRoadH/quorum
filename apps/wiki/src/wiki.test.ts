import { expect, test } from 'vitest'
import {
  COMPONENT_IDS,
  ERAS,
  FRAMEWORK_IDS,
  GLOSSARY,
  INCIDENT_IDS,
  RUNTIME_IDS,
  researchList,
} from '@quorum/simulation/catalog'
import { SANDBOX_IDS } from '@quorum/simulation/sandbox'
import { prosePaths } from './content.ts'
import { normalize } from './main.ts'
import { renderPage, prerenderPaths } from './entry.server.ts'
import { PAGES, pageAt } from './pages.ts'
import { indexOf, search } from './search.ts'

/* The wiki's contract: every page has one clean path, renders at build time, and can be found. */

test('every page has one path, without a trailing slash', () => {
  const paths = PAGES.map((page) => page.path)
  expect(new Set(paths).size).toBe(paths.length)
  expect(paths.filter((path) => normalize(path) !== path)).toEqual([])
})

test('every prerendered path renders its own page', async () => {
  for (const path of prerenderPaths) {
    const result = await renderPage(new Request(`https://wiki.playquorum.dev${path}`))
    expect(result._tag, path).toBe('Rendered')
    if (result._tag !== 'Rendered') continue
    expect(result.status, path).toBeUndefined()
    expect(result.application.title, path).toContain(pageAt(path)?.title ?? '')
  }
}, 120_000)

test('every catalog entry has its own page', () => {
  const ids = [
    ...COMPONENT_IDS.map((id) => `/components/${id}`),
    ...researchList.map((entry) => `/research/${entry.id}`),
    ...INCIDENT_IDS.map((id) => `/incidents/${id}`),
    ...RUNTIME_IDS.map((id) => `/runtimes/${id}`),
    ...FRAMEWORK_IDS.map((id) => `/frameworks/${id}`),
    ...GLOSSARY.map((entry) => `/glossary/${entry.id}`),
    ...SANDBOX_IDS.map((id) => `/sandboxes/${id}`),
  ]
  expect(ids.filter((path) => !pageAt(path))).toEqual([])
  expect(PAGES.filter((page) => page.parent === '/eras')).toHaveLength(ERAS.length)
})

test('every prose file belongs to a page', () => {
  expect(prosePaths.filter((path) => !pageAt(path))).toEqual([])
})

test('a path with no page renders the 404 page with a 404 status', async () => {
  const result = await renderPage(new Request('https://wiki.playquorum.dev/no/such/page'))
  expect(result._tag === 'Rendered' && result.status).toBe(404)
})

test('a trailing slash reaches the same page', async () => {
  const result = await renderPage(new Request('https://wiki.playquorum.dev/about/contributing/'))
  expect(result._tag === 'Rendered' && result.status).toBeUndefined()
})

test('search ranks a title match first and finds a page by its alias', () => {
  const index = indexOf(PAGES)
  expect(search(index, 'improve the wiki')[0]?.page.path).toBe('/about/contributing')
  expect(search(index, 'github')[0]?.page.path).toBe('/about/contributing')
  expect(search(index, 'zzzz-no-match')).toEqual([])
})
