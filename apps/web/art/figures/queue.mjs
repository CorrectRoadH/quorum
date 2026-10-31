import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// A conveyor on legs: side rails, an end drum at each end, a belt with joints and
// a drive motor under one end. `boxes` are x positions of boxes waiting on it;
// `pick` is the index of the lit box (or -1).
export function conveyor(
  t,
  {
    x0 = -42,
    x1 = 40,
    y = 0,
    width = 16,
    z = 12,
    boxes = [],
    pick = -1,
    box = 10,
    legs = true,
    motor = true,
  } = {},
) {
  const { k, G, S, L, D, at, slab, P } = t
  const out = []
  const y0 = y - width / 2
  const y1 = y + width / 2
  const RAIL = 2
  const legAt = (x, yy) =>
    [
      S(slab({ x: x - 2.4, y: yy - 2.4, w: 4.8, d: 4.8, r: 0.6 }, 0, 1, 2), { tone: 'lo' }),
      S(slab({ x: x - 1.4, y: yy - 1.4, w: 2.8, d: 2.8, r: 0.4 }, 1, z - 4 - 1, 2), {
        tone: 'mid',
      }),
    ].join('')
  const legXs = [x0 + 6, x1 - 6]
  // Back legs and the back rail.
  if (legs) for (const x of legXs) out.push(legAt(x, y0 - RAIL / 2))
  if (legs)
    out.push(
      S(slab({ x: x0 + 6, y: y0 - 1.2, w: x1 - x0 - 12, d: 1.4, r: 0.3 }, 3, 2, 1), { tone: 'lo' }),
    )
  out.push(
    S(slab({ x: x0, y: y0 - RAIL, w: x1 - x0, d: RAIL, r: 0.6 }, z - 4, 5.4, 2, 0.3), {
      tone: 'mid',
    }),
  )
  // End drums and the belt.
  for (const x of [x0 + 2.6, x1 - 2.6]) {
    out.push(
      S(G.disc(y0, y1, 2.6, G.frameOf([x, 0, z - 2.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]), P), {
        tone: 'mid',
      }),
    )
  }
  const BELT = { x: x0 + 2.6, y: y0, w: x1 - x0 - 5.2, d: width, r: 0 }
  out.push(S(slab(BELT, z - 1, 1, 1), { tone: 'mid', crease: 'lo' }))
  const joints = []
  for (let x = BELT.x + 6; x < BELT.x + BELT.w - 2; x += 6)
    joints.push(k.lineOnTop([x, y0], [x, y1], z, P))
  out.push(L(joints.join(''), { tone: 'faint' }))
  // Boxes waiting in line.
  boxes.forEach((bx, index) =>
    out.push(
      parcel(
        t,
        { x: bx - box / 2, y: y - box / 2, w: box, d: box, r: 0.6 },
        z,
        box * 0.8,
        index === pick,
      ),
    ),
  )
  // Front rail with its bolt row, front legs and the drive motor.
  out.push(
    S(slab({ x: x0, y: y1, w: x1 - x0, d: RAIL, r: 0.6 }, z - 4, 5.4, 2, 0.3), { tone: 'mid' }),
  )
  out.push(
    D(
      Array.from({ length: Math.floor((x1 - x0 - 6) / 8) + 1 }, (_, index) =>
        at([x0 + 3 + index * 8, y1 + RAIL, z - 1.3]),
      ),
      { size: 0.35 },
    ),
  )
  if (legs) for (const x of legXs) out.push(legAt(x, y1 + RAIL / 2))
  if (motor) {
    const F = G.frameOf([x1 - 6, y1 + RAIL, z - 7], [0, 1, 0], [1, 0, 0], [0, 0, 1])
    out.push(
      S(G.disc(0, 6, 3.2, F, P), {
        tone: 'mid',
        inner: L(G.arcOf(F, 3, 3.2, P), { tone: 'faint' }),
      }),
    )
    out.push(S(G.disc(6, 7, 2.2, F, P), { tone: 'mid' }))
    out.push(D(G.dotsOf(F, 7, 1.4, 4, P, { all: true }), { size: 0.3 }))
  }
  return out.join('')
}

// A cardboard box with a tape line over the lid and a label on its front.
export function parcel(t, plan, z, h, lit = false) {
  const { k, S, L, P } = t
  return [
    S(t.slab(plan, z, h, 2, 0.3), { tone: 'hi', crease: 'lo', lit }),
    L(
      k.lineOnTop([plan.x, plan.y + plan.d / 2], [plan.x + plan.w, plan.y + plan.d / 2], z + h, P),
      { tone: lit ? 'lit' : 'lo' },
    ),
    L(
      t.faceRect(
        'y',
        plan.y + plan.d,
        plan.x + 1.6,
        plan.x + plan.w * 0.5,
        z + h * 0.45,
        z + h * 0.78,
        0.3,
      ),
      { tone: 'faint' },
    ),
  ].join('')
}

export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const out = []
  const PLATE = { x: -48, y: -34, w: 96, d: 66, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))
  out.push(t.labelPlate({ x: -42, y: 14, w: 22, d: 9, r: 1 }))
  out.push(conveyor(t, { y: -6, boxes: [-30, -15, 0, 15, 30], pick: lit ? 4 : -1 }))
  // A stop bar across the head of the line, on two posts.
  for (const y of [-15.5, 3.5])
    out.push(t.S(t.cyl(41.6, y, 1.2, 0, 17, 14), { tone: 'mid', crease: 'none' }))
  out.push(
    t.S(t.slab({ x: 40.4, y: -17, w: 2.4, d: 22, r: 0.8 }, 15, 2.6, 2, 0.3), { tone: 'mid' }),
  )
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A queue: boxes waiting in line on a conveyor belt; the box at the head of the line is lit.',
    body: draw(STAGE),
  }
}
