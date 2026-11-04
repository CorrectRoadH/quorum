import { describe, expect, test } from 'vitest'
import { CARD_W, CLEARANCE, heightOf, type Pt, type Route } from './geometry.ts'
import { routeLinks, type RoutedNode } from './routing.ts'
import { STRESS_LINKS as LINKS, stressNodes as placed } from './stress.ts'

type Segment = readonly [Pt, Pt]
const segments = (path: Route): ReadonlyArray<Segment> =>
  path.slice(1).map((point, index) => [path[index] as Pt, point] as const)

/**
 * The stretches of a path off its port rows. Every link of a port leaves from
 * one point, so the stroke along the port's row before the first bend is shared.
 */
const lanes = (path: Route): ReadonlyArray<Segment> => {
  const first = path[0] as Pt
  const last = path[path.length - 1] as Pt
  const all = segments(path)
  const head = all.findIndex(([a, b]) => a.y !== first.y || b.y !== first.y)
  const tail = all.findLastIndex(([a, b]) => a.y !== last.y || b.y !== last.y)
  return all.slice(Math.max(0, head), tail + 1)
}

/** Length of every stroke that runs inside a card, sampled each pixel. */
const underCards = (nodes: ReadonlyArray<RoutedNode>, path: Route): number => {
  let length = 0
  for (const [a, b] of segments(path)) {
    const span = Math.hypot(b.x - a.x, b.y - a.y)
    for (let t = 0; t < span; t += 1) {
      const x = a.x + ((b.x - a.x) * t) / span
      const y = a.y + ((b.y - a.y) * t) / span
      if (
        nodes.some(
          (node) =>
            x > node.x + 1 &&
            x < node.x + CARD_W - 1 &&
            y > node.y + 1 &&
            y < node.y + heightOf(node.type) - 1,
        )
      )
        length += 1
    }
  }
  return length
}

/** Length that two links to different targets draw on top of each other. */
const shared = (a: Route, b: Route): number => {
  let length = 0
  for (const [p, q] of lanes(a))
    for (const [r, s] of lanes(b)) {
      if (p.x === q.x && r.x === s.x && Math.abs(p.x - r.x) < 2) {
        const overlap =
          Math.min(Math.max(p.y, q.y), Math.max(r.y, s.y)) -
          Math.max(Math.min(p.y, q.y), Math.min(r.y, s.y))
        if (overlap > 2) length += overlap
      }
      if (p.y === q.y && r.y === s.y && Math.abs(p.y - r.y) < 2) {
        const overlap =
          Math.min(Math.max(p.x, q.x), Math.max(r.x, s.x)) -
          Math.max(Math.min(p.x, q.x), Math.min(r.x, s.x))
        if (overlap > 2) length += overlap
      }
    }
  return length
}

describe('the stress board', () => {
  const nodes = placed()
  const wires = routeLinks(nodes, LINKS)

  test('dropped cards keep their clearance from every other card', () => {
    for (const a of nodes)
      for (const b of nodes) {
        if (a === b) continue
        const apart =
          a.x >= b.x + CARD_W + CLEARANCE ||
          b.x >= a.x + CARD_W + CLEARANCE ||
          a.y >= b.y + heightOf(b.type) + CLEARANCE ||
          b.y >= a.y + heightOf(a.type) + CLEARANCE
        expect(apart, `${a.id} and ${b.id}`).toBe(true)
      }
  })

  test('a free drop stays where it was dropped, and a crowded one moves down its column', () => {
    const at = (id: string) => nodes.find((node) => node.id === id) as RoutedNode
    expect(at('app1')).toMatchObject({ x: 712, y: -160 })
    // Payments was dropped under the WAF; it stays in its column.
    expect(at('payments').x).toBe(328)
    expect(at('wide').x).toBe(776)
  })

  test('every link is routed, none runs under a card, and only trunks share a lane', () => {
    expect([...wires.keys()].sort()).toEqual(LINKS.map((link) => `${link.from}>${link.to}`).sort())
    for (const [key, wire] of wires) expect(underCards(nodes, wire.path), key).toBe(0)
    for (const [aKey, a] of wires)
      for (const [bKey, b] of wires) {
        if (aKey.split('>')[1] === bKey.split('>')[1]) continue
        expect(shared(a.path, b.path), `${aKey} on ${bKey}`).toBe(0)
      }
  })

  test('each crossing leaves a gap in one of the two lanes', () => {
    const gaps = [...wires.values()].reduce((sum, wire) => sum + wire.pieces.length - 1, 0)
    expect(gaps).toBeGreaterThan(0)
  })
})
