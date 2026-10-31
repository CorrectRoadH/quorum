import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// Object storage: a three-shelf rack of crates (buckets). One crate is pulled
// half out of its bay, being fetched, and is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, S, L, D, at, slab } = t
  const out = []
  const PLATE = { x: -46, y: -40, w: 92, d: 80, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const X0 = -38
  const X1 = 38
  const Y0 = -26
  const Y1 = -2
  const POST = 3
  const TOP = 50
  const SHELVES = [3, 19, 35]
  const SHELF_H = 1.6
  const post = (x, y) =>
    [
      S(slab({ x: x - 0.8, y: y - 0.8, w: POST + 1.6, d: POST + 1.6, r: 0.6 }, 0, 1.2, 2), {
        tone: 'lo',
      }),
      S(slab({ x, y, w: POST, d: POST, r: 0.4 }, 1.2, TOP - 1.2, 2), { tone: 'mid' }),
    ].join('')
  out.push(post(X0, Y0), post(X1 - POST, Y0))
  // A back brace between the far posts.
  out.push(
    S(slab({ x: X0 + POST, y: Y0 + 0.6, w: X1 - X0 - 2 * POST, d: 1.4, r: 0.3 }, TOP - 6, 2, 1), {
      tone: 'lo',
    }),
  )

  const crate = (x, y, z, w, active) => {
    const plan = { x, y, w, d: 18, r: 1 }
    const h = 11
    const face = y + plan.d
    return [
      S(slab(plan, z, h, 3, 0.4), {
        tone: 'hi',
        crease: 'lo',
        lit: active,
        inner: L(k.sideSeam(plan, z + h - 2, P, 3), { tone: active ? 'lit' : 'faint' }),
      }),
      L(k.planOutline(k.insetPlan(plan, 1.2), z + h, P, 3), { tone: 'faint' }),
      L(t.faceRect('y', face, x + w / 2 - 3.2, x + w / 2 + 3.2, z + h - 4.6, z + h - 3, 0.8), {
        tone: 'lo',
      }),
      L(t.faceRect('y', face, x + 2, x + 7.6, z + 2, z + 5, 0.3), { tone: 'faint' }),
      L(t.faceRect('x', x + w, y + 7, y + 11, z + h - 4.6, z + h - 3, 0.8), { tone: 'lo' }),
    ].join('')
  }
  const LAYOUT = [
    [0, 1, 2],
    [0, 2],
    [1, 2],
  ]
  const PULLED = [1, 0]
  let pulled = ''
  SHELVES.forEach((z, row) => {
    const plan = { x: X0, y: Y0, w: X1 - X0, d: Y1 - Y0, r: 0.6 }
    out.push(
      S(slab(plan, z, SHELF_H, 2, 0.3), {
        tone: 'mid',
        inner: L(k.sideSeam(plan, z + 0.6, P, 2), { tone: 'faint' }),
      }),
    )
    for (const bay of LAYOUT[row]) {
      const active = row === PULLED[0] && bay === PULLED[1]
      const svg = crate(
        X0 + POST + 1 + bay * 24,
        Y0 + 3 + (active ? 12 : 0),
        z + SHELF_H,
        21.4,
        lit && active,
      )
      // The pulled crate stands out past the front posts, so it is drawn after them.
      if (active) pulled = svg
      else out.push(svg)
    }
  })
  // Front posts and the top frame.
  out.push(post(X0, Y1 - POST), post(X1 - POST, Y1 - POST), pulled)
  out.push(
    S(slab({ x: X0, y: Y0, w: X1 - X0, d: Y1 - Y0, r: 0.6 }, TOP, 1.6, 2, 0.3), { tone: 'mid' }),
  )
  out.push(t.topScrews(k.corners({ x: X0, y: Y0, w: X1 - X0, d: Y1 - Y0 }, 1.5), TOP + 1.6, 0.7))
  out.push(
    D(
      Array.from({ length: 12 }, (_, index) => at([X0 + POST / 2, Y1, 4 + index * 3.8])),
      { size: 0.3, tone: 'lo' },
    ),
  )
  out.push(t.labelPlate({ x: 10, y: 14, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'Object storage: a three-shelf rack of crates standing for buckets; one crate is pulled half out of its bay.',
    body: draw(STAGE),
  }
}
