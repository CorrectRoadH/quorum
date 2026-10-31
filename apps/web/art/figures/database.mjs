import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// A disk pack: four platters on a spindle over its motor, with an actuator comb
// that swings one arm over each platter. The top arm, reading, is lit.
export function pack(
  t,
  { c = [0, 0], r = 28, levels = 4, gap = 8, pivot, lit = true, motor = 12 },
) {
  const { k, S, L, D, at, P, cyl } = t
  const [cx, cy] = c
  const flange = S(cyl(cx, cy, r * 0.58, 0, 2.4, 48, 0.4), { tone: 'mid' })
  const out = []
  const PL = 2.2
  const z0 = motor
  const levelZ = Array.from({ length: levels }, (_, index) => z0 + index * gap)
  const top = levelZ[levels - 1] + PL

  // Motor under the stack.
  out.push(S(cyl(cx, cy, r * 0.42, 2.4, z0 - 2.4, 48), { tone: 'mid' }))
  out.push(L(k.knurl(cx, cy, r * 0.42, 2.4, z0, 40, P, 0.8), { tone: 'faint' }))

  // The actuator: a coil block with a pivot post.
  const [px, py] = pivot ?? [0, 0]
  const block = { x: px - 8, y: py - 8, w: 16, d: 16, r: 2 }
  const armDraw = []
  if (pivot) {
    out.push(S(t.slab(block, 0, 7, 3, 0.5), { tone: 'mid' }))
    out.push(
      L(t.slots('y', block.y + block.d, block.x + 3, block.x + 13, 1.8, 5.2, 4, 1.2), {
        tone: 'lo',
      }),
    )
    out.push(t.topScrews(k.corners(block, 2.4), 7, 0.8))
    out.push(S(cyl(px, py, 2.6, 7, top + 6 - 7, 20), { tone: 'mid', crease: 'none' }))
    out.push(S(cyl(px, py, 3.6, top + 6, 2, 20), { tone: 'mid' }))
    out.push(D([at([px, py, top + 8])], { size: 0.45, tone: 'hi' }))
  }
  // An arm from the pivot toward the spindle, ending over the middle tracks.
  const toward = [cx - px, cy - py]
  const length = Math.hypot(...toward)
  const ux = toward[0] / length
  const uy = toward[1] / length
  const reach = length - r * 0.55
  const arm = (z, isLit) => {
    const nx = -uy
    const ny = ux
    const w0 = 3
    const w1 = 1.2
    const ring = [
      [px + nx * w0, py + ny * w0],
      [px + ux * reach + nx * w1, py + uy * reach + ny * w1],
      [px + ux * reach - nx * w1, py + uy * reach - ny * w1],
      [px - nx * w0, py - ny * w0],
    ]
    const tip = [px + ux * (reach - 1.4), py + uy * (reach - 1.4)]
    return [
      S(cyl(px, py, 4.4, z - 0.6, 2.4, 24), { tone: 'mid' }),
      S(k.extrude(ring, z, 1, P, { bevel: 0.3 }), { tone: 'hi', crease: 'lo', lit: isLit }),
      S(t.slab({ x: tip[0] - 1.4, y: tip[1] - 1.4, w: 2.8, d: 2.8, r: 0.4 }, z - 1, 1, 2), {
        tone: 'hi',
        lit: isLit,
      }),
      D([at([px, py, z + 1.8])], { size: 0.4 }),
    ].join('')
  }

  levelZ.forEach((z, index) => {
    // Spacer below this platter (the first sits on the motor).
    if (index > 0)
      out.push(
        S(cyl(cx, cy, r * 0.32, levelZ[index - 1] + PL, gap - PL, 40), {
          tone: 'mid',
          crease: 'none',
        }),
      )
    out.push(S(cyl(cx, cy, r, z, PL, 96, 0.6), { tone: 'hi', crease: 'lo' }))
    if (index === levels - 1) {
      out.push(
        L([0.5, 0.68, 0.86].map((share) => k.ring(cx, cy, r * share, z + PL, P, 72)).join(''), {
          tone: 'faint',
        }),
      )
    }
    if (pivot) armDraw.push(arm(z + PL + 1.4, lit && index === levels - 1))
    if (pivot) out.push(armDraw[index])
  })
  // The clamp and spindle cap on top.
  out.push(S(cyl(cx, cy, r * 0.36, top, 2.4, 48, 0.4), { tone: 'mid' }))
  out.push(
    D(
      Array.from({ length: 6 }, (_, index) => {
        const a = (index / 6) * Math.PI * 2
        return at([cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25, top + 2.4])
      }),
      { size: 0.4 },
    ),
  )
  out.push(S(cyl(cx, cy, r * 0.13, top + 2.4, 3, 24), { tone: 'mid' }))
  out.push(L(k.knurl(cx, cy, r * 0.13, top + 2.4, top + 5.4, 16, P, 0.4), { tone: 'lo' }))
  const rest = out.join('')
  return { flange, rest, svg: flange + rest, top }
}

// The drive controller: a small box with vents, a status row and a cable gland.
export function controller(t, box, h = 9) {
  const { k, S, L, D, at, P } = t
  const front = box.y + box.d
  return [
    S(t.slab(box, 0, h, 3, 0.5), { tone: 'mid' }),
    L(k.lineOnTop([box.x, box.y + 4], [box.x + box.w, box.y + 4], h, P), { tone: 'faint' }),
    t.topScrews(k.corners(box, 2.2), h, 0.7),
    L(t.slots('x', box.x + box.w, box.y + 3, front - 3, 2.4, h - 2.4, 5, 1.2), { tone: 'lo' }),
    D(
      [0, 1, 2, 3].map((index) => at([box.x + 4 + index * 2.6, front, h - 2.6])),
      { size: 0.5, tone: 'hi' },
    ),
    L(t.faceRect('y', front, box.x + box.w - 9, box.x + box.w - 3, 2, 5, 0.6), { tone: 'lo' }),
  ].join('')
}

export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const out = []
  const PLATE = { x: -46, y: -46, w: 92, d: 90, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))
  out.push(t.labelPlate({ x: -40, y: 30, w: 24, d: 9, r: 1 }))
  // A ribbon cable from the actuator to the controller box at the front.
  out.push(
    t.tube(
      [
        [30, -20, 3.4],
        [30, 18, 3.4],
      ],
      1.3,
      { tone: 'lo' },
    ),
  )
  out.push(pack(t, { c: [-6, 6], r: 29, levels: 4, gap: 8.4, pivot: [30, -28], lit }).svg)
  out.push(controller(t, { x: 20, y: 18, w: 20, d: 18, r: 1.6 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A database: a disk pack of four platters on a spindle over its motor, with an actuator comb that reaches one arm over each platter.',
    body: draw(STAGE),
  }
}
