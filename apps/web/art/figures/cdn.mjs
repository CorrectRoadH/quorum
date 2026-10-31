import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// A CDN edge node: a short relay mast on a plinth with three sector panels, a
// backhaul dish and an equipment cabinet. The beacon on top is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, G, S, L, D, slab, cyl } = t
  const out = []
  const PLATE = { x: -44, y: -44, w: 88, d: 86, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const M = [4, -4]
  const MR = 2.6
  const MAST_TOP = 66

  // Equipment cabinet at the back left, with a feeder to the plinth.
  const CAB = { x: -38, y: -36, w: 20, d: 26, r: 1.4 }
  const CH = 20
  out.push(
    S(slab(CAB, 0, CH, 3, 0.5), {
      tone: 'mid',
      inner: L(k.sideSeam(CAB, 3, P, 3), { tone: 'faint' }),
    }),
  )
  out.push(
    L(t.faceRect('x', CAB.x + CAB.w, CAB.y + 2.4, CAB.y + CAB.d - 2.4, 5, CH - 2.4, 0.6), {
      tone: 'lo',
    }),
  )
  out.push(
    L(t.slots('x', CAB.x + CAB.w, CAB.y + 5, CAB.y + CAB.d - 5, CH - 7, CH - 4, 7, 1.2), {
      tone: 'lo',
    }),
  )
  out.push(
    S(slab({ x: CAB.x + CAB.w, y: CAB.y + 6, w: 1.4, d: 2, r: 0.4 }, 9, 4, 2), { tone: 'mid' }),
  )
  out.push(D(k.dotGrid(CAB.x + 4, CAB.y + 4, 4, 5, 3.6, CH, P), { size: 0.32, tone: 'lo' }))
  out.push(
    t.tube(
      [
        [CAB.x + CAB.w, -14, 3],
        [M[0] - 9, -14, 3],
      ],
      1.2,
      { tone: 'lo' },
    ),
  )

  // Plinth and mast foot.
  const PL = { x: M[0] - 9, y: M[1] - 9, w: 18, d: 18, r: 1.4 }
  out.push(S(slab(PL, 0, 5, 3, 0.5), { tone: 'mid' }))
  out.push(t.topScrews(k.corners(PL, 2.6), 5, 0.8))
  out.push(S(cyl(M[0], M[1], 5, 5, 3, 28, 0.4), { tone: 'mid' }))

  // Sector panels around the mast, with two arms each. Back panels go before the
  // mast and the front panel after it.
  const ANGLES = [Math.PI * 0.25, Math.PI * 0.92, Math.PI * 1.58]
  const P0 = 38
  const P1 = 56
  const panel = (angle) => {
    const radial = [Math.cos(angle), Math.sin(angle), 0]
    const tangent = [-Math.sin(angle), Math.cos(angle), 0]
    const c = [M[0] + radial[0] * 8, M[1] + radial[1] * 8, P0]
    const arms = [P0 + 4, P1 - 4].map((z) =>
      t.tube(
        [
          [M[0] + radial[0] * MR, M[1] + radial[1] * MR, z],
          [M[0] + radial[0] * 6.6, M[1] + radial[1] * 6.6, z],
        ],
        0.8,
        { tone: 'mid' },
      ),
    )
    const body = G.prismOf(
      G.frameOf(c, [0, 0, 1], radial, tangent),
      [
        [-1.4, -4.6],
        [1, -4.6],
        [1.4, -3.6],
        [1.4, 3.6],
        [1, 4.6],
        [-1.4, 4.6],
      ],
      0,
      P1 - P0,
      P,
    )
    return arms.join('') + S(body, { tone: 'hi', crease: 'lo' })
  }
  const facing = (angle) => Math.cos(angle) + Math.sin(angle)
  for (const angle of ANGLES.filter((a) => facing(a) <= 0)) out.push(panel(angle))

  // The backhaul dish on the right, its face and feed horn turned toward us.
  const DISH_Z = 24
  const DIR = G.unit3([0.86, -0.42, 0.08])
  const DF = G.frameAlong([M[0] + DIR[0] * MR, M[1] + DIR[1] * MR, DISH_Z], DIR)

  out.push(
    S(cyl(M[0], M[1], MR, 8, MAST_TOP - 8, 24), {
      tone: 'mid',
      crease: 'none',
      inner: L([20, 34, 60].map((z) => k.sideArc(M[0], M[1], MR, z, P, 16)).join(''), {
        tone: 'faint',
      }),
    }),
  )
  out.push(S(G.disc(0, 3, 1.4, DF, P), { tone: 'mid' }))
  const dish = []
  for (let index = 0; index <= 8; index++) {
    const share = index / 8
    dish.push([3 + share * 5, 2 + 9 * Math.sqrt(share), 1])
  }
  out.push(S(G.solidOf(dish, DF, P), { tone: 'hi', crease: 'lo' }))
  out.push(L(G.circleOf(DF, 8, 9.6, P), { tone: 'faint' }))
  out.push(S(G.disc(8, 13, 0.6, DF, P), { tone: 'mid', crease: 'none' }))
  out.push(S(G.disc(13, 14.6, 1.4, DF, P), { tone: 'mid' }))

  for (const angle of ANGLES.filter((a) => facing(a) > 0)) out.push(panel(angle))

  // The beacon and the lightning rod.
  out.push(S(cyl(M[0], M[1], 3.6, MAST_TOP, 1.4, 24, 0.3), { tone: 'mid' }))
  out.push(S(cyl(M[0], M[1], 2.6, MAST_TOP + 1.4, 4, 24), { tone: 'hi', lit }))
  out.push(S(cyl(M[0], M[1], 3.2, MAST_TOP + 5.4, 1.2, 24, 0.3), { tone: 'mid' }))
  out.push(S(cyl(M[0], M[1], 0.5, MAST_TOP + 6.6, 7, 10), { tone: 'mid', crease: 'none' }))
  out.push(t.labelPlate({ x: -38, y: 18, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A CDN edge node: a short relay mast with three sector panels, a backhaul dish and an equipment cabinet; the beacon on top is lit.',
    body: draw(STAGE),
  }
}
