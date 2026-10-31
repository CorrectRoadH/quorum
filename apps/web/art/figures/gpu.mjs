import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// A GPU: a graphics card lying on two cradles, its fin stack under a shroud with two
// fans, the bracket with display ports at the end. The light strip is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, S, L, D, at, slab } = t
  const out = []
  const PLATE = { x: -46, y: -38, w: 92, d: 76, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const PCB = { x: -38, y: -18, w: 70, d: 30, r: 0.6 }
  const PZ = 8
  for (const x of [-30, 20]) {
    out.push(S(slab({ x, y: -16, w: 6, d: 26, r: 0.8 }, 0, PZ, 2, 0.3), { tone: 'mid' }))
  }
  out.push(S(slab(PCB, PZ, 1.4, 2, 0.3), { tone: 'mid' }))
  const TOP = PZ + 1.4
  // Gold fingers on a tab along the front edge.
  const TAB = { x: -24, y: PCB.y + PCB.d, w: 30, d: 2.6, r: 0 }
  out.push(S(slab(TAB, PZ, 1.4, 1), { tone: 'lo' }))
  const fingers = []
  for (let x = TAB.x + 1; x < TAB.x + TAB.w - 0.5; x += 1.2)
    fingers.push(k.lineOnTop([x, TAB.y], [x, TAB.y + TAB.d], TOP, P))
  out.push(L(fingers.join(''), { tone: 'faint' }))

  // The fin stack, far fin first.
  const FIN_TOP = 16
  for (let x = PCB.x + 2; x <= PCB.x + PCB.w - 4; x += 2) {
    out.push(
      S(slab({ x, y: PCB.y + 2, w: 0.7, d: PCB.d - 3, r: 0 }, TOP, FIN_TOP - TOP, 1), {
        tone: 'mid',
        crease: 'none',
      }),
    )
  }

  // The shroud with two fans and the light strip.
  const SH = { x: PCB.x, y: PCB.y, w: PCB.w, d: PCB.d, r: 1.6 }
  const SZ = FIN_TOP + 3
  out.push(S(slab(SH, FIN_TOP, 3, 4, 0.6), { tone: 'hi', crease: 'lo' }))
  out.push(t.topScrews(k.corners(SH, 2.4), SZ, 0.6))
  for (const cx of [-20, 12]) {
    const cy = -3
    out.push(L(k.ring(cx, cy, 12.6, SZ, P, 64), { tone: 'faint' }))
    out.push(L(k.ring(cx, cy, 11.4, SZ, P, 64), { tone: 'lo' }))
    const blades = []
    for (let index = 0; index < 9; index++) {
      const a0 = (index / 9) * Math.PI * 2
      const points = []
      for (let step = 0; step <= 6; step++) {
        const r = 4 + (step / 6) * 7
        const a = a0 + (step / 6) * 0.9
        points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
      }
      blades.push(k.onTop(points, SZ, P))
    }
    out.push(L(blades.join(''), { tone: 'lo' }))
    out.push(S(t.cyl(cx, cy, 4, SZ, 0.8, 32, 0.3), { tone: 'mid' }))
    out.push(D([at([cx, cy, SZ + 0.8])], { size: 0.5, tone: 'hi' }))
  }
  out.push(
    S(slab({ x: -28, y: SH.y + SH.d, w: 40, d: 0.5, r: 0 }, FIN_TOP + 1, 1, 1), {
      tone: 'hi',
      lit,
    }),
  )
  // Power socket on the back corner.
  out.push(S(slab({ x: 18, y: -16, w: 9, d: 4, r: 0.6 }, SZ, 3, 2, 0.3), { tone: 'mid' }))
  out.push(L(t.slots('y', -12, 19.6, 25.6, SZ + 0.8, SZ + 2.2, 4, 1.2), { tone: 'lo' }))

  // The bracket at the near end, with ports on its outer face.
  const BX = PCB.x + PCB.w
  const BF = BX + 1.6
  out.push(S(slab({ x: BX, y: -20, w: 1.6, d: 34, r: 0.3 }, 0, 24, 1), { tone: 'mid' }))
  for (const [y0, y1] of [
    [-17, -12],
    [-10, -5],
    [-3, 2],
  ])
    out.push(L(t.faceRect('x', BF, y0, y1, 9.4, 12, 0.6), { tone: 'lo' }))
  out.push(L(t.faceRect('x', BF, 4, 11, 9.2, 12.2, 0.4), { tone: 'lo' }))
  out.push(L(t.slots('x', BF, -16, 10, 15, 21, 9, 1.3), { tone: 'lo' }))
  out.push(
    t.faceScrews(
      'x',
      BF,
      [
        [-18.4, 22.4],
        [12.4, 22.4],
      ],
      0.7,
    ),
  )

  out.push(t.labelPlate({ x: -40, y: 22, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A GPU: a graphics card on two cradles with a fin stack under a two-fan shroud and a bracket of display ports.',
    body: draw(STAGE),
  }
}
