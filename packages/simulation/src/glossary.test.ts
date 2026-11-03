import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { GLOSSARY } from './catalog.ts'
import { newGame } from './company.ts'
import { DISCOVERABLE, discoverTerms } from './discovery.ts'
import { StepEvent } from './events.ts'
import type { Incident } from './state.ts'

const incident: Incident = {
  kind: 'spike',
  remaining: 60,
  nodeId: null,
  startedAt: 0,
  baseline: 0,
  usersAtStart: 0,
  impaired: 0,
  lostRevenue: 0,
  failed: 0,
  severity: 3,
  magnitude: 3,
  zone: null,
  region: null,
}

/* The in-game glossary ships docs/gdd/glossary.md: every heading, in order, with its slug as id. */

const source = fileURLToPath(new URL('../../../docs/gdd/glossary.md', import.meta.url))

const slug = (heading: string): string =>
  heading
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9 -]/g, '')
    .replaceAll(' ', '-')

test('the glossary catalog matches docs/gdd/glossary.md', async () => {
  const text = await readFile(source, 'utf8')
  const headings = [...text.matchAll(/^## (.+)$/gm)].map(([, heading]) => heading ?? '')
  expect(GLOSSARY.map((entry) => entry.term)).toEqual(headings.map((heading) => heading.trim()))
  expect(GLOSSARY.map((entry) => entry.id)).toEqual(headings.map(slug))
  const ids = new Set(GLOSSARY.map((entry) => entry.id))
  const sections = text.split(/^## /m).slice(1)
  GLOSSARY.forEach((entry, index) => {
    expect(entry.definition.length).toBeGreaterThan(0)
    expect(entry.inGame.length).toBeGreaterThan(0)
    expect(entry.links.length, entry.id).toBeGreaterThan(0)
    for (const link of entry.links) {
      expect(link.url, entry.id).toMatch(/^https:\/\//)
      expect(sections[index], entry.id).toContain(link.url)
    }
    for (const id of entry.related) {
      expect(ids.has(id) && id !== entry.id, `${entry.id} → ${id}`).toBe(true)
    }
  })
})

test('discovery meets entries from what the Company runs and goes through, never in a Sandbox', () => {
  const game = newGame(7)
  const ids = new Set(GLOSSARY.map((entry) => entry.id))
  const first = discoverTerms(game, [])
  expect(first).toContain('apdex')
  expect(first).not.toContain('cache-aside')
  const cached = {
    ...game,
    nodes: [...game.nodes, { ...game.nodes[1]!, id: 'c', type: 'cache' as const }],
  }
  expect(discoverTerms(cached, [])).toContain('cache-aside')
  const storm = discoverTerms(game, [
    StepEvent.IncidentStarted({ incident: { ...incident, kind: 'retry-storm' } }),
  ])
  expect(storm).toContain('metastable-failure')
  for (const id of storm) expect(ids.has(id)).toBe(true)
  expect(discoverTerms({ ...game, sandbox: true }, [])).toEqual([])
})

test('every discovery id names a glossary entry', () => {
  const ids = new Set(GLOSSARY.map((entry) => entry.id))
  for (const id of DISCOVERABLE) expect(ids.has(id), id).toBe(true)
})
