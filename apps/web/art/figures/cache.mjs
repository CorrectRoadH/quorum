import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// A cache: four memory sticks standing in a slotted board, next to the controller
// chip under its heat sink. The stick being read is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, S, L, slab, cyl } = t
  const out = []
  const PLATE = { x: -46, y: -42, w: 92, d: 82, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  // The board on four standoffs.
  const BOARD = { x: -40, y: -36, w: 80, d: 66, r: 2 }
  const BZ = 3
  for (const [x, y] of t.byDepth(k.corners(BOARD, 4)))
    out.push(S(cyl(x, y, 1.8, 0, BZ, 16), { tone: 'mid' }))
  out.push(S(slab(BOARD, BZ, 1.4, 3, 0.3), { tone: 'mid' }))
  const TOP = BZ + 1.4
  out.push(t.topScrews(k.corners(BOARD, 4), TOP, 1.1))

  const X0 = -34
  const LEN = 50
  const SLOT_D = 4
  const STICK_D = 1.4
  const STICK_H = 15
  const ROWS = [-30, -21, -12, -3]
  const ACTIVE = 3
  ROWS.forEach((y, index) => {
    const active = lit && index === ACTIVE
    // Slot with a latch at each end.
    out.push(S(slab({ x: X0, y, w: LEN, d: SLOT_D, r: 0.6 }, TOP, 3, 2, 0.3), { tone: 'mid' }))
    out.push(
      S(slab({ x: X0 - 3, y: y + 0.5, w: 3, d: SLOT_D - 1, r: 0.6 }, TOP, 5.4, 2), { tone: 'mid' }),
    )
    // The stick, standing in the slot, with chips on its front face.
    const sy = y + (SLOT_D - STICK_D) / 2
    const face = sy + STICK_D
    const stick = { x: X0 + 1, y: sy, w: LEN - 2, d: STICK_D, r: 0.2 }
    out.push(S(slab(stick, TOP + 3, STICK_H, 1, 0), { tone: 'hi', crease: 'lo', lit: active }))
    for (let chip = 0; chip < 4; chip++) {
      const cx = X0 + 4 + chip * 11.4
      out.push(
        S(slab({ x: cx, y: face, w: 8.4, d: 0.7, r: 0.2 }, TOP + 6.4, 7.4, 1), { tone: 'mid' }),
      )
    }
    out.push(
      L(t.faceLine('y', face, [X0 + 1, TOP + 4.6], [X0 + LEN - 1, TOP + 4.6]), {
        tone: active ? 'lit' : 'faint',
      }),
    )
    out.push(
      S(slab({ x: X0 + LEN, y: y + 0.5, w: 3, d: SLOT_D - 1, r: 0.6 }, TOP, 5.4, 2), {
        tone: 'mid',
      }),
    )
  })

  // Controller chip under a finned heat sink, at the front right.
  const HS = { x: 22, y: -30, w: 14, d: 26, r: 1 }
  out.push(S(slab(k.insetPlan(HS, -1.4), TOP, 1.2, 2), { tone: 'lo' }))
  out.push(S(slab(HS, TOP + 1.2, 2, 2, 0.3), { tone: 'mid' }))
  for (let fin = 0; fin < 6; fin++) {
    out.push(
      S(slab({ x: HS.x, y: HS.y + 0.6 + fin * 4.6, w: HS.w, d: 1.2, r: 0.2 }, TOP + 3.2, 7, 1), {
        tone: 'mid',
      }),
    )
  }
  // Capacitors and a bus connector along the front of the board.
  for (const [i, x] of [-30, -24, -18].entries()) {
    out.push(S(cyl(x, 12, 2.2, TOP, 5 + (i % 2), 18, 0.3), { tone: 'mid' }))
    out.push(L(k.ring(x, 12, 1, TOP + 5 + (i % 2), P, 12), { tone: 'lo' }))
  }
  out.push(S(slab({ x: -8, y: 20, w: 40, d: 5, r: 0.6 }, TOP, 3, 2, 0.3), { tone: 'mid' }))
  out.push(L(t.slots('y', 25, -6, 30, TOP + 0.8, TOP + 2.2, 14, 1.2), { tone: 'lo' }))
  out.push(t.labelPlate({ x: 8, y: 6, w: 22, d: 9, r: 1 }, TOP))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A cache: four memory sticks standing in a slotted board beside a controller under its heat sink; the stick being read is lit.',
    body: draw(STAGE),
  }
}
