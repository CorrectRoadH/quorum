import {
  CARD_W,
  CLEARANCE,
  heightOf,
  inPort,
  layoutOf,
  outPort,
  smooth,
  type Placed,
  type Pt,
  type Route,
} from './geometry.ts'

/*
 * Link routing, after Wybrow, Marriott and Stuckey, "Orthogonal Connector
 * Routing" (GD 2009), with congestion costs from PathFinder (McMurchie and
 * Ebeling, 1995):
 *
 * 1. A sparse grid runs along every card's clearance edge and every port.
 * 2. Each link takes the cheapest path on it: length, plus a cost per bend,
 *    plus a cost for channels that are already full. Links into one Node join
 *    one trunk, so a channel holds one lane per target, not one per link.
 * 3. A few passes raise the cost of channels that stay over capacity, so some
 *    links take a longer way through an emptier gap.
 * 4. Nudging spreads the lanes that share a channel line, in an order that
 *    avoids crossings where it can.
 * 5. Where two lanes still cross, the vertical one has a gap.
 */

export type RoutedNode = Placed & Readonly<{ id: string }>
export type RoutedLink = Readonly<{ from: string; to: string }>
/**
 * A routed link: the whole path for packets and hit tests, the pieces to stroke,
 * and the hops where it passes under another link.
 */
export type Wire = Readonly<{ path: Route; pieces: ReadonlyArray<Route>; hops: ReadonlyArray<Pt> }>

/** Obstacles grow by half the clearance, so grid lines run down the middle of a tight gap. */
const MARGIN = CLEARANCE / 2
/** Distance between lanes in a channel that has the room. */
const LANE = 12
/** Lanes keep this far from a card edge. */
const PAD = 5
/** Closest that lanes squeeze in a channel that is over capacity. */
const MIN_LANE = 4
/** A bend costs as much as this much length. */
const BEND_COST = 40
/** Cost per extra lane in a full channel, and history added per pass. */
const PRESENT_COST = 4
const HISTORY_COST = 2
const PASSES = 4
/** Half the length of the gap a vertical lane leaves where a horizontal one crosses it. */
export const HOP = 7

const keyOf = (link: RoutedLink): string => `${link.from}>${link.to}`

type Rect = Readonly<{ x0: number; y0: number; x1: number; y1: number }>

/** A binary min-heap of states keyed by cost. */
class Heap {
  private keys: Array<number> = []
  private items: Array<number> = []
  get size(): number {
    return this.items.length
  }
  push(key: number, item: number): void {
    const keys = this.keys
    const items = this.items
    let index = items.length
    keys.push(key)
    items.push(item)
    while (index > 0) {
      const parent = (index - 1) >> 1
      if ((keys[parent] as number) <= key) break
      keys[index] = keys[parent] as number
      items[index] = items[parent] as number
      index = parent
    }
    keys[index] = key
    items[index] = item
  }
  pop(): number {
    const keys = this.keys
    const items = this.items
    const top = items[0] as number
    const lastKey = keys.pop() as number
    const lastItem = items.pop() as number
    if (items.length === 0) return top
    let index = 0
    for (;;) {
      const left = index * 2 + 1
      if (left >= items.length) break
      const right = left + 1
      const child =
        right < items.length && (keys[right] as number) < (keys[left] as number) ? right : left
      if ((keys[child] as number) >= lastKey) break
      keys[index] = keys[child] as number
      items[index] = items[child] as number
      index = child
    }
    keys[index] = lastKey
    items[index] = lastItem
    return top
  }
}

/** Directions: 0 is +x, 1 is -x, 2 is +y, 3 is -y. The opposite of d is d ^ 1. */
const DX = [1, -1, 0, 0] as const
const DY = [0, 0, 1, -1] as const

/** The links into one Node, as one tree toward its in-port. */
type Tree = {
  /** Each vertex's next vertex toward the port; the root, the in-port stub, has -1. */
  next: Map<number, number>
  /** The direction of each vertex's step toward the port. The root steps +x into the port. */
  dir: Map<number, number>
  edges: Set<number>
  /** Out-port stubs of the links in this tree. */
  starts: Set<number>
  box: { x0: number; y0: number; x1: number; y1: number }
}

type Run = {
  bundle: string
  vertical: boolean
  /** Index of the line: an x index for a vertical run, a y index for a horizontal one. */
  line: number
  lo: number
  hi: number
  edges: Array<number>
  offset: number
}

/** Routes every link around the cards. A link with no way through is left out. */
export const routeLinks = (
  nodes: ReadonlyArray<RoutedNode>,
  links: ReadonlyArray<RoutedLink>,
): Map<string, Wire> => {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const rects: Array<Rect> = nodes.map((node) => ({
    x0: node.x,
    y0: node.y,
    x1: node.x + CARD_W,
    y1: node.y + heightOf(node.type),
  }))
  const ends = links.flatMap((link) => {
    const from = byId.get(link.from)
    const to = byId.get(link.to)
    if (!from || !to || link.from === link.to) return []
    if (layoutOf(from.type).outRow === null || layoutOf(to.type).inRow === null) return []
    return [{ link, out: outPort(from), in: inPort(to) }]
  })
  const wires = new Map<string, Wire>()
  if (ends.length === 0) return wires

  /* ---------- 1. the grid ---------- */

  const xSet = new Set<number>()
  const ySet = new Set<number>()
  for (const rect of rects) {
    xSet.add(rect.x0 - MARGIN).add(rect.x1 + MARGIN)
    ySet.add(rect.y0 - MARGIN).add(rect.y1 + MARGIN)
  }
  for (const end of ends) {
    xSet.add(end.out.x + MARGIN).add(end.in.x - MARGIN)
    ySet.add(end.out.y).add(end.in.y)
  }
  const outer = 3 * MARGIN
  xSet.add(Math.min(...rects.map((rect) => rect.x0)) - outer)
  xSet.add(Math.max(...rects.map((rect) => rect.x1)) + outer)
  ySet.add(Math.min(...rects.map((rect) => rect.y0)) - outer)
  ySet.add(Math.max(...rects.map((rect) => rect.y1)) + outer)
  const xs = [...xSet].sort((a, b) => a - b)
  const ys = [...ySet].sort((a, b) => a - b)
  const nx = xs.length
  const ny = ys.length
  const xIndex = new Map(xs.map((x, index) => [x, index]))
  const yIndex = new Map(ys.map((y, index) => [y, index]))
  const vid = (i: number, j: number): number => i * ny + j
  const xOf = (v: number): number => xs[Math.floor(v / ny)] as number
  const yOf = (v: number): number => ys[v % ny] as number

  const inside = (x: number, y: number): boolean =>
    rects.some(
      (rect) =>
        x > rect.x0 - MARGIN &&
        x < rect.x1 + MARGIN &&
        y > rect.y0 - MARGIN &&
        y < rect.y1 + MARGIN,
    )

  // Edge ids: vertex * 2 is the edge to i + 1 (horizontal), vertex * 2 + 1 the edge to j + 1.
  const count = nx * ny
  const open = new Uint8Array(count * 2)
  const capacity = new Int32Array(count * 2)
  const freeLo = new Float64Array(count * 2)
  const freeHi = new Float64Array(count * 2)
  const blocked = new Uint8Array(count)
  for (let i = 0; i < nx; i += 1)
    for (let j = 0; j < ny; j += 1)
      blocked[vid(i, j)] = inside(xs[i] as number, ys[j] as number) ? 1 : 0

  /** The free interval across a channel: the nearest card edges on either side. */
  const across = (
    at: number,
    from: number,
    to: number,
    vertical: boolean,
  ): Readonly<{ lo: number; hi: number }> => {
    let lo = Number.NEGATIVE_INFINITY
    let hi = Number.POSITIVE_INFINITY
    for (const rect of rects) {
      const [a0, a1, c0, c1] = vertical
        ? [rect.y0, rect.y1, rect.x0, rect.x1]
        : [rect.x0, rect.x1, rect.y0, rect.y1]
      if (a0 >= to || a1 <= from) continue
      if (c1 <= at) lo = Math.max(lo, c1)
      else if (c0 >= at) hi = Math.min(hi, c0)
    }
    return { lo, hi }
  }
  const lanesFor = (lo: number, hi: number): number =>
    Number.isFinite(hi - lo) ? Math.max(1, Math.floor((hi - lo - 2 * PAD) / LANE) + 1) : 99

  for (let i = 0; i < nx; i += 1) {
    for (let j = 0; j < ny; j += 1) {
      const v = vid(i, j)
      const x = xs[i] as number
      const y = ys[j] as number
      if (i + 1 < nx) {
        const x2 = xs[i + 1] as number
        const e = v * 2
        if (!blocked[v] && !blocked[vid(i + 1, j)] && !inside((x + x2) / 2, y)) {
          open[e] = 1
          const free = across(y, x, x2, false)
          freeLo[e] = free.lo
          freeHi[e] = free.hi
          capacity[e] = lanesFor(free.lo, free.hi)
        }
      }
      if (j + 1 < ny) {
        const y2 = ys[j + 1] as number
        const e = v * 2 + 1
        if (!blocked[v] && !blocked[vid(i, j + 1)] && !inside(x, (y + y2) / 2)) {
          open[e] = 1
          const free = across(x, y, y2, true)
          freeLo[e] = free.lo
          freeHi[e] = free.hi
          capacity[e] = lanesFor(free.lo, free.hi)
        }
      }
    }
  }

  /** The edge and vertex one step from `v` in direction `d`, or null at the grid's edge. */
  const step = (v: number, d: number): Readonly<{ edge: number; to: number }> | null => {
    const i = Math.floor(v / ny) + (DX[d] as number)
    const j = (v % ny) + (DY[d] as number)
    if (i < 0 || i >= nx || j < 0 || j >= ny) return null
    const to = vid(i, j)
    const edge = d === 0 ? v * 2 : d === 1 ? to * 2 : d === 2 ? v * 2 + 1 : to * 2 + 1
    return open[edge] ? { edge, to } : null
  }

  /* ---------- 2 and 3. paths, in passes ---------- */

  const history = new Float64Array(count * 2)
  const order = [...ends].sort((a, b) => (keyOf(a.link) < keyOf(b.link) ? -1 : 1))
  let trees = new Map<string, Tree>()
  let paths = new Map<string, Array<number>>()
  const g = new Float64Array(count * 4)
  const came = new Int32Array(count * 4)

  for (let pass = 0; pass < PASSES; pass += 1) {
    trees = new Map()
    paths = new Map()
    const use = new Int32Array(count * 2)
    for (const end of order) {
      const start = vid(xIndex.get(end.out.x + MARGIN) as number, yIndex.get(end.out.y) as number)
      const root = vid(xIndex.get(end.in.x - MARGIN) as number, yIndex.get(end.in.y) as number)
      if (blocked[start] || blocked[root]) continue
      const bundle = end.link.to
      let tree = trees.get(bundle)
      if (!tree) {
        tree = {
          next: new Map([[root, -1]]),
          dir: new Map([[root, 0]]),
          edges: new Set(),
          starts: new Set(),
          box: { x0: xOf(root), y0: yOf(root), x1: xOf(root), y1: yOf(root) },
        }
        trees.set(bundle, tree)
      }
      const t = tree
      const h = (v: number): number => {
        const x = xOf(v)
        const y = yOf(v)
        return Math.max(0, t.box.x0 - x, x - t.box.x1) + Math.max(0, t.box.y0 - y, y - t.box.y1)
      }
      g.fill(Number.POSITIVE_INFINITY)
      const heap = new Heap()
      const first = start * 4
      g[first] = 0
      came[first] = -1
      heap.push(h(start), first)
      let found = -1
      while (heap.size > 0) {
        const state = heap.pop()
        const v = state >> 2
        const d = state & 3
        const cost = g[state] as number
        const joinDir = t.dir.get(v)
        if (joinDir !== undefined) {
          if (d !== (joinDir ^ 1)) {
            found = state
            break
          }
          // Running into the trunk head-on: no join here, and no way through it.
          continue
        }
        for (let nd = 0; nd < 4; nd += 1) {
          if (nd === (d ^ 1)) continue
          const next = step(v, nd)
          if (!next) continue
          const length = Math.abs(xOf(next.to) - xOf(v)) + Math.abs(yOf(next.to) - yOf(v))
          const crowd = t.edges.has(next.edge)
            ? 0
            : Math.max(0, (use[next.edge] as number) + 1 - (capacity[next.edge] as number))
          const total =
            cost +
            length * (1 + (history[next.edge] as number) + PRESENT_COST * crowd) +
            (nd === d ? 0 : BEND_COST)
          const ns = next.to * 4 + nd
          if (total < (g[ns] as number)) {
            g[ns] = total
            came[ns] = state
            heap.push(total + h(next.to), ns)
          }
        }
      }
      if (found < 0) continue
      const own: Array<number> = []
      for (let state = found; state >= 0; state = came[state] as number) own.push(state)
      own.reverse()
      for (let index = 0; index < own.length - 1; index += 1) {
        const state = own[index + 1] as number
        const v = (own[index] as number) >> 2
        const d = state & 3
        const edge = (step(v, d) as { edge: number }).edge
        t.next.set(v, state >> 2)
        t.dir.set(v, d)
        if (!t.edges.has(edge)) {
          t.edges.add(edge)
          use[edge] = (use[edge] as number) + 1
        }
        t.box.x0 = Math.min(t.box.x0, xOf(v))
        t.box.x1 = Math.max(t.box.x1, xOf(v))
        t.box.y0 = Math.min(t.box.y0, yOf(v))
        t.box.y1 = Math.max(t.box.y1, yOf(v))
      }
      t.starts.add(start)
      const vertices = own.map((state) => state >> 2)
      for (let v = t.next.get(found >> 2) ?? -1; v >= 0; v = t.next.get(v) ?? -1) vertices.push(v)
      paths.set(keyOf(end.link), vertices)
    }
    let over = false
    for (let e = 0; e < count * 2; e += 1) {
      const extra = (use[e] as number) - (capacity[e] as number)
      if (extra > 0) {
        over = true
        history[e] = (history[e] as number) + HISTORY_COST * extra
      }
    }
    if (!over) break
  }

  /* ---------- 4. nudging ---------- */

  // Runs: the stretches of one tree along one grid line.
  const runs: Array<Run> = []
  const runOf = new Map<string, Run>()
  for (const [bundle, tree] of trees) {
    const byLine = new Map<string, Array<{ at: number; edge: number }>>()
    for (const edge of tree.edges) {
      const v = edge >> 1
      const vertical = (edge & 1) === 1
      const line = vertical ? Math.floor(v / ny) : v % ny
      const at = vertical ? v % ny : Math.floor(v / ny)
      const key = `${vertical ? 'v' : 'h'}${line}`
      const list = byLine.get(key) ?? []
      list.push({ at, edge })
      byLine.set(key, list)
    }
    for (const [key, list] of byLine) {
      list.sort((a, b) => a.at - b.at)
      let run: Run | null = null
      for (const { at, edge } of list) {
        if (run && run.hi === at) {
          run.hi = at + 1
          run.edges.push(edge)
        } else {
          run = {
            bundle,
            vertical: key.startsWith('v'),
            line: Number(key.slice(1)),
            lo: at,
            hi: at + 1,
            edges: [edge],
            offset: 0,
          }
          runs.push(run)
        }
        runOf.set(`${edge}:${bundle}`, run)
      }
    }
  }

  /** Which way a tree leaves a run's end: -1 toward lower coordinates, 1 higher, 0 neither or both. */
  const sideAt = (run: Run, at: number): number => {
    const tree = trees.get(run.bundle) as Tree
    const vertical = run.vertical
    const v = vertical ? vid(run.line, at) : vid(at, run.line)
    // An edge in direction d from v; a tree's in-stub leaves toward +x, an out-stub came from -x.
    const has = (d: number): boolean => {
      if (vertical && d === 0 && tree.dir.get(v) === 0 && tree.next.get(v) === -1) return true
      if (vertical && d === 1 && tree.starts.has(v)) return true
      const next = step(v, d)
      return next !== null && tree.edges.has(next.edge)
    }
    const [plus, minus] = vertical ? [0, 1] : [2, 3]
    return (has(plus) ? 1 : 0) - (has(minus) ? 1 : 0)
  }
  const compare = (a: Run, b: Run): number => {
    let low = 0
    if (a.lo === b.lo) low = sideAt(a, a.lo) - sideAt(b, b.lo)
    else if (a.lo > b.lo) low = sideAt(a, a.lo)
    else low = -sideAt(b, b.lo)
    let high = 0
    if (a.hi === b.hi) high = sideAt(a, a.hi) - sideAt(b, b.hi)
    else if (a.hi < b.hi) high = sideAt(a, a.hi)
    else high = -sideAt(b, b.hi)
    const vote = low !== 0 ? low : high
    return vote !== 0 ? vote : a.bundle < b.bundle ? -1 : 1
  }

  const lines = new Map<string, Array<Run>>()
  for (const run of runs) {
    const key = `${run.vertical ? 'v' : 'h'}${run.line}`
    const list = lines.get(key) ?? []
    list.push(run)
    lines.set(key, list)
  }
  for (const [key, list] of lines) {
    const vertical = key.startsWith('v')
    const coordinate = vertical
      ? (xs[Number(key.slice(1))] as number)
      : (ys[Number(key.slice(1))] as number)
    list.sort((a, b) => a.lo - b.lo)
    // Clusters: runs that share some stretch of the line, directly or through others.
    let cluster: Array<Run> = []
    let reach = Number.NEGATIVE_INFINITY
    const settle = (group: Array<Run>): void => {
      if (group.length < 2) return
      group.sort(compare)
      let lo = Number.NEGATIVE_INFINITY
      let hi = Number.POSITIVE_INFINITY
      for (const run of group)
        for (const edge of run.edges) {
          lo = Math.max(lo, freeLo[edge] as number)
          hi = Math.min(hi, freeHi[edge] as number)
        }
      const n = group.length
      const room = hi - lo - 2 * PAD
      const spacing = Math.max(MIN_LANE, Math.min(LANE, room / (n - 1)))
      let shift = 0
      const first = coordinate - ((n - 1) / 2) * spacing
      const last = coordinate + ((n - 1) / 2) * spacing
      if (last - first <= room) {
        if (first < lo + PAD) shift = lo + PAD - first
        else if (last > hi - PAD) shift = hi - PAD - last
      } else if (Number.isFinite(room)) shift = (lo + hi) / 2 - coordinate
      group.forEach((run, index) => {
        run.offset = (index - (n - 1) / 2) * spacing + shift
      })
    }
    for (const run of list) {
      if (run.lo >= reach) {
        settle(cluster)
        cluster = []
      }
      cluster.push(run)
      reach = Math.max(reach, run.hi)
    }
    settle(cluster)
  }

  /* ---------- polylines ---------- */

  const corners = new Map<string, Array<Pt>>()
  for (const end of order) {
    const key = keyOf(end.link)
    const vertices = paths.get(key)
    if (!vertices) continue
    const bundle = end.link.to
    const points: Array<Pt> = [end.out]
    // The port stubs are horizontal and sit on no lane.
    let previous: Readonly<{ vertical: boolean; at: number }> = { vertical: false, at: end.out.y }
    let index = 0
    while (index < vertices.length - 1) {
      const v = vertices[index] as number
      const d = [0, 1, 2, 3].find((dir) => step(v, dir)?.to === vertices[index + 1]) as number
      const edge = (step(v, d) as { edge: number }).edge
      const vertical = d >= 2
      const run = runOf.get(`${edge}:${bundle}`)
      const at = (vertical ? xOf(v) : yOf(v)) + (run?.offset ?? 0)
      let last = index + 1
      while (last < vertices.length - 1) {
        const w = vertices[last] as number
        if (step(w, d)?.to !== vertices[last + 1]) break
        last += 1
      }
      if (vertical === previous.vertical) {
        // Two horizontal stretches in a row: the port stub, then a lane off its centre.
        if (at !== previous.at) {
          points.push({ x: end.out.x + 3, y: previous.at })
          points.push({ x: xOf(v), y: at })
        }
      } else points.push(vertical ? { x: at, y: previous.at } : { x: previous.at, y: at })
      previous = { vertical, at }
      index = last
    }
    if (previous.vertical) points.push({ x: previous.at, y: end.in.y })
    else if (previous.at !== end.in.y) {
      points.push({ x: end.in.x - MARGIN, y: previous.at })
      points.push({ x: end.in.x - 3, y: end.in.y })
    }
    points.push(end.in)
    corners.set(key, points)
  }

  /* ---------- 5. gaps where lanes cross ---------- */

  const hops = new Map<string, Array<Pt>>()
  const entries = [...corners]
  for (const [aKey, a] of entries) {
    const aTo = aKey.slice(aKey.indexOf('>') + 1)
    for (const [bKey, b] of entries) {
      if (bKey.slice(bKey.indexOf('>') + 1) === aTo) continue
      for (let i = 1; i < a.length; i += 1) {
        const p = a[i - 1] as Pt
        const q = a[i] as Pt
        if (Math.abs(p.x - q.x) > 0.01) continue
        const top = Math.min(p.y, q.y)
        const bottom = Math.max(p.y, q.y)
        for (let k = 1; k < b.length; k += 1) {
          const r = b[k - 1] as Pt
          const s = b[k] as Pt
          if (Math.abs(r.y - s.y) > 0.01) continue
          const left = Math.min(r.x, s.x)
          const right = Math.max(r.x, s.x)
          if (p.x > left + 1 && p.x < right - 1 && r.y > top + HOP && r.y < bottom - HOP) {
            const list = hops.get(aKey) ?? []
            if (!list.some((hop) => Math.abs(hop.y - r.y) < 1)) list.push({ x: p.x, y: r.y })
            hops.set(aKey, list)
          }
        }
      }
    }
  }

  for (const [key, points] of corners) {
    const path = smooth(points)
    wires.set(key, { path, pieces: cut(path, hops.get(key) ?? []), hops: hops.get(key) ?? [] })
  }
  return wires
}

/** Splits a path where it passes a hop on a vertical stretch. */
const cut = (path: Route, hops: ReadonlyArray<Pt>): ReadonlyArray<Route> => {
  if (hops.length === 0) return [path]
  const pieces: Array<Array<Pt>> = []
  let piece: Array<Pt> = []
  for (let index = 0; index < path.length; index += 1) {
    const point = path[index] as Pt
    const previous = path[index - 1]
    if (previous && Math.abs(previous.x - point.x) < 0.01) {
      const down = point.y > previous.y
      const passed = hops
        .filter(
          (hop) =>
            Math.abs(hop.x - point.x) < 0.5 &&
            hop.y > Math.min(previous.y, point.y) &&
            hop.y < Math.max(previous.y, point.y),
        )
        .sort((a, b) => (down ? a.y - b.y : b.y - a.y))
      for (const hop of passed) {
        piece.push({ x: point.x, y: hop.y + (down ? -HOP : HOP) })
        pieces.push(piece)
        piece = [{ x: point.x, y: hop.y + (down ? HOP : -HOP) }]
      }
    }
    piece.push(point)
  }
  pieces.push(piece)
  return pieces
}
