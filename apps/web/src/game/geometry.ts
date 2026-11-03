import type { ComponentId } from '@quorum/simulation/catalog'
import type { GameNode } from '@quorum/simulation/state'

/* Card and port geometry, shared by the board, placement and link routing. */

/** What geometry needs of a Node. */
export type Placed = Pick<GameNode, 'type' | 'x' | 'y'>

export const CARD_W = 216
export const HEAD = 36
export const ROW = 24
export const FOOT = 44
export const PORT_R = 6

export type Layout = Readonly<{
  rows: number
  inRow: number | null
  outRow: number | null
  footer: boolean
}>

/** Row count and port rows per Component. Fixed per type, so hit tests need no flow. */
export const layoutOf = (type: ComponentId): Layout => {
  switch (type) {
    case 'users':
      return { rows: 3, inRow: null, outRow: 2, footer: false }
    case 'payments':
      return { rows: 2, inRow: null, outRow: null, footer: true }
    case 'analytics':
      return { rows: 5, inRow: 0, outRow: null, footer: true }
    case 'server':
      return { rows: 5, inRow: 0, outRow: 4, footer: true }
    case 'database':
      return { rows: 4, inRow: 0, outRow: null, footer: true }
    case 'replica':
      return { rows: 5, inRow: 0, outRow: null, footer: true }
    case 'auth':
      return { rows: 3, inRow: 0, outRow: null, footer: false }
    case 'dns':
      return { rows: 3, inRow: 0, outRow: 2, footer: false }
    case 'lb':
      return { rows: 4, inRow: 0, outRow: 3, footer: false }
    case 'cache':
    case 'pooler':
      return { rows: 4, inRow: 0, outRow: 3, footer: false }
    case 'search':
      return { rows: 3, inRow: 0, outRow: null, footer: true }
    case 'storage':
      return { rows: 3, inRow: 0, outRow: null, footer: false }
    case 'queue':
      return { rows: 4, inRow: 0, outRow: 3, footer: true }
    case 'worker':
      return { rows: 3, inRow: 0, outRow: null, footer: true }
    case 'cdn':
      return { rows: 3, inRow: 0, outRow: 2, footer: false }
    case 'waf':
      return { rows: 4, inRow: 0, outRow: 3, footer: true }
    case 'psp':
      return { rows: 3, inRow: 0, outRow: null, footer: false }
    case 'autoscaler':
      return { rows: 3, inRow: 0, outRow: null, footer: false }
    case 'cluster':
      return { rows: 2, inRow: 0, outRow: null, footer: false }
    case 'warehouse':
      return { rows: 3, inRow: 0, outRow: null, footer: false }
    case 'gpu':
      return { rows: 4, inRow: 0, outRow: null, footer: true }
    case 'llm':
      return { rows: 3, inRow: 0, outRow: null, footer: true }
    case 'msgp':
      return { rows: 3, inRow: 0, outRow: null, footer: false }
    case 'wide':
      return { rows: 4, inRow: 0, outRow: null, footer: true }
    case 'dsql':
      return { rows: 3, inRow: 0, outRow: null, footer: true }
  }
}

export const rowTop = (index: number): number => HEAD + 4 + index * ROW
export const rowMid = (index: number): number => rowTop(index) + ROW / 2

export const heightOf = (type: ComponentId): number => {
  const layout = layoutOf(type)
  return rowTop(layout.rows) + (layout.footer ? FOOT : 6)
}

export type Pt = Readonly<{ x: number; y: number }>

export const outPort = (node: Placed): Pt => ({
  x: node.x + CARD_W,
  y: node.y + rowMid(layoutOf(node.type).outRow ?? 0),
})
export const inPort = (node: Placed): Pt => ({
  x: node.x,
  y: node.y + rowMid(layoutOf(node.type).inRow ?? 0),
})

/** How far a backward link runs out of a port before it turns. */
export const STUB = 16
/** Corner radius of a link's bends. */
const BEND = 6

export const gap = (a: Pt, b: Pt): number => Math.hypot(b.x - a.x, b.y - a.y)

/** A link's path as a polyline: straight runs with soft right-angle bends. */
export type Route = ReadonlyArray<Pt>

/**
 * Forward links bend once, halfway between the ports. Backward links leave
 * the port, drop to `lane` under both cards, and come back in from the left.
 * The router uses this while a card is on the move, and when it finds no way.
 */
export const route = (a: Pt, b: Pt, lane: number): Route => {
  const x = Math.round((a.x + b.x) / 2)
  return smooth(
    b.x - a.x > 8
      ? [a, { x, y: a.y }, { x, y: b.y }, b]
      : [
          a,
          { x: a.x + STUB, y: a.y },
          { x: a.x + STUB, y: lane },
          { x: b.x - STUB, y: lane },
          { x: b.x - STUB, y: b.y },
          b,
        ],
  )
}

/** Rounds each inner corner of a polyline with a short quadratic arc, sampled into it. */
export const smooth = (corners: Route): Route => {
  const points = corners.filter((point, index) => {
    const previous = corners[index - 1]
    return !previous || gap(previous, point) > 0.5
  })
  const first = points[0]
  if (!first) return []
  const path: Array<Pt> = [first]
  for (let index = 1; index < points.length - 1; index += 1) {
    const before = points[index - 1]
    const corner = points[index]
    const after = points[index + 1]
    if (!before || !corner || !after) continue
    const r = Math.min(BEND, gap(before, corner) / 2, gap(corner, after) / 2)
    const start = {
      x: corner.x + ((before.x - corner.x) / gap(before, corner)) * r,
      y: corner.y + ((before.y - corner.y) / gap(before, corner)) * r,
    }
    const end = {
      x: corner.x + ((after.x - corner.x) / gap(corner, after)) * r,
      y: corner.y + ((after.y - corner.y) / gap(corner, after)) * r,
    }
    for (let step = 0; step <= 4; step += 1) {
      const t = step / 4
      const u = 1 - t
      path.push({
        x: u * u * start.x + 2 * u * t * corner.x + t * t * end.x,
        y: u * u * start.y + 2 * u * t * corner.y + t * t * end.y,
      })
    }
  }
  const last = points[points.length - 1]
  if (last && points.length > 1) path.push(last)
  return path
}

/** The space every card keeps clear around it, so links always have a channel. */
export const CLEARANCE = 24

/** A rectangle on the board: a card, or a Playbook's bounding box. */
export type Box = Readonly<{ x: number; y: number; w: number; h: number }>

export const boxOf = (node: Placed): Box => ({
  x: node.x,
  y: node.y,
  w: CARD_W,
  h: heightOf(node.type),
})

export const crowds = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w + CLEARANCE &&
  b.x < a.x + a.w + CLEARANCE &&
  a.y < b.y + b.h + CLEARANCE &&
  b.y < a.y + a.h + CLEARANCE

/**
 * The nearest top-left corner on the 8 px grid where `box` keeps its clearance
 * from every card in `others`. A sideways move costs three times a vertical one,
 * so a card stays in the column it was dropped in. The nearest free corner always
 * lines up with the wanted corner or with some card's clearance edge, so those
 * lines are the only ones tried.
 */
export const freeSpot = (
  others: ReadonlyArray<Box>,
  box: Box,
): Readonly<{ x: number; y: number }> => {
  const x = Math.round(box.x / 8) * 8
  const y = Math.round(box.y / 8) * 8
  const xs = new Set([x])
  const ys = new Set([y])
  for (const other of others) {
    xs.add(Math.ceil((other.x + other.w + CLEARANCE) / 8) * 8)
    xs.add(Math.floor((other.x - box.w - CLEARANCE) / 8) * 8)
    ys.add(Math.ceil((other.y + other.h + CLEARANCE) / 8) * 8)
    ys.add(Math.floor((other.y - box.h - CLEARANCE) / 8) * 8)
  }
  let best = { x, y }
  let bestCost = Number.POSITIVE_INFINITY
  for (const cx of xs) {
    for (const cy of ys) {
      const cost = Math.abs(cy - y) + 3 * Math.abs(cx - x)
      if (cost >= bestCost) continue
      const at = { ...box, x: cx, y: cy }
      if (others.some((other) => crowds(at, other))) continue
      best = { x: cx, y: cy }
      bestCost = cost
    }
  }
  return best
}

/**
 * Tidy positions: one band per group, top to bottom. Inside a band the cards form columns by
 * how far they sit from the start of a Link chain, so traffic reads left to right, and each
 * column stacks in its current vertical order. The result stays anchored at the top-left
 * corner of the cards it replaces.
 */
export const tidy = <K extends string | number>(
  nodes: ReadonlyArray<Placed & Readonly<{ id: string; group: K }>>,
  links: ReadonlyArray<Readonly<{ from: string; to: string }>>,
  order: ReadonlyArray<K>,
): ReadonlyMap<string, Pt> => {
  const spots = new Map<string, Pt>()
  if (nodes.length === 0) return spots
  const left = Math.min(...nodes.map((node) => node.x))
  const top = Math.min(...nodes.map((node) => node.y))
  const depth = new Map<string, number>()
  const depthOf = (id: string, seen: ReadonlySet<string>): number => {
    const known = depth.get(id)
    if (known !== undefined) return known
    const parents = links.filter((link) => link.to === id && !seen.has(link.from))
    const value = Math.max(
      0,
      ...parents.map((link) => depthOf(link.from, new Set([...seen, id])) + 1),
    )
    depth.set(id, value)
    return value
  }
  let y = top
  for (const group of order) {
    const members = nodes.filter((node) => node.group === group)
    if (members.length === 0) continue
    const levels = [...new Set(members.map((node) => depthOf(node.id, new Set())))].toSorted(
      (a, b) => a - b,
    )
    let tallest = 0
    for (const [column, level] of levels.entries()) {
      let at = y
      for (const node of members
        .filter((entry) => depth.get(entry.id) === level)
        .toSorted((a, b) => a.y - b.y || a.x - b.x)) {
        spots.set(node.id, { x: left + column * (CARD_W + CLEARANCE * 3), y: at })
        at += heightOf(node.type) + CLEARANCE
      }
      tallest = Math.max(tallest, at - CLEARANCE - y)
    }
    y += tallest + CLEARANCE * 4
  }
  return spots
}
