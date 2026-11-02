import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { preseedGame } from './company.ts'
import { capture, decodePlaybook, encodePlaybook, placePlaybook } from './playbook.ts'
import type { Game } from './state.ts'

/* Playbooks (13): capture a Design, place it in another Company, share it as text. */

const source = preseedGame(3)
const ids = ['server', 'database']

/** A fresh Company with the fixed Nodes only, and Cash to build. */
const empty = (): Game => ({
  ...preseedGame(9),
  nodes: preseedGame(9).nodes.filter((node) => node.type !== 'server' && node.type !== 'database'),
  links: [],
  cash: 100_000,
})

describe('Playbooks', () => {
  test('capture then place rebuilds the Design: Stacks, sizes and Links', () => {
    const playbook = capture(source, ids, 'Pre-seed')
    expect(playbook?.nodes).toHaveLength(2)
    if (!playbook) return
    const placed = Result.getOrThrow(placePlaybook(empty(), playbook, 440, 280))
    expect(placed.placed).toBe(2)
    expect(placed.ghosts).toEqual([])
    const server = placed.game.nodes.find((node) => node.type === 'server')
    const original = source.nodes.find((node) => node.type === 'server')
    expect(server?.runtime).toBe(original?.runtime)
    expect(server?.size).toBe(original?.size)
    expect(server?.workers).toBe(original?.workers)
    expect(placed.game.links).toHaveLength(source.links.length)
  })

  test('a Node whose research is missing comes back as a ghost, not a refusal', () => {
    const withCache: Game = {
      ...source,
      researched: [...source.researched, 'caching'],
      nodes: [
        ...source.nodes,
        { ...(source.nodes[1] as Game['nodes'][number]), id: 'c', type: 'cache' },
      ],
    }
    const playbook = capture(withCache, [...ids, 'c'], 'Cached')
    if (!playbook) throw new Error('no playbook')
    const placed = Result.getOrThrow(placePlaybook(empty(), playbook, 0, 0))
    expect(placed.placed).toBe(2)
    expect(placed.ghosts.map((ghost) => ghost.type)).toEqual(['cache'])
  })

  test('runs out of Cash part way: refused', () => {
    const playbook = capture(source, ids, 'P')
    if (!playbook) throw new Error('no playbook')
    expect(Result.isFailure(placePlaybook({ ...empty(), cash: 10 }, playbook, 0, 0))).toBe(true)
  })

  test('the text form round-trips, and a bad string is refused', () => {
    const playbook = capture(source, ids, 'Café')
    if (!playbook) throw new Error('no playbook')
    const text = encodePlaybook(playbook)
    expect(text.startsWith('QPB1:')).toBe(true)
    expect(text).toMatch(/^[A-Za-z0-9:_-]+$/)
    expect(Result.getOrThrow(decodePlaybook(text))).toEqual(playbook)
    expect(Result.isFailure(decodePlaybook('QPB1:!!!'))).toBe(true)
    expect(Result.isFailure(decodePlaybook('hello'))).toBe(true)
  })
})
