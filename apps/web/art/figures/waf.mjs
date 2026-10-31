import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// A firewall: a tripod turnstile on a tread plate between two guide fences. One arm
// bars the lane; the lamp on the cabinet, which lets one through at a time, is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, G, S, L, D, slab, cyl } = t
  const out = []
  const PLATE = { x: -46, y: -42, w: 92, d: 82, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const TREAD = { x: -38, y: -14, w: 76, d: 28, r: 1 }
  out.push(S(slab(TREAD, 0, 0.8, 2, 0.3), { tone: 'lo' }))
  out.push(D(k.dotGrid(TREAD.x + 4, TREAD.y + 4, 18, 6, 4, 0.8, P), { size: 0.3, tone: 'lo' }))

  // Back guide fence on both sides of the cabinet.
  const CAB = { x: -8, y: -32, w: 16, d: 16, r: 1.6 }
  const fence = (x0, x1, y, h) => {
    const post = (x) =>
      S(cyl(x, y + 1, 2.2, 0, 1, 20), { tone: 'lo' }) +
      S(cyl(x, y + 1, 1.4, 1, h - 1, 16), { tone: 'mid', crease: 'none' })
    const rail = (z) =>
      S(slab({ x: Math.min(x0, x1), y, w: Math.abs(x1 - x0), d: 2, r: 0.6 }, z, 2, 2, 0.3), {
        tone: 'mid',
      })
    return { post, rail }
  }
  const back = fence(-34, -8, -22, 20)
  out.push(back.post(-34), back.rail(18), back.rail(9))

  // The cabinet: door panel, vents, cap, reader and the lamp.
  const CH = 32
  const FACE = CAB.y + CAB.d
  out.push(
    S(slab(CAB, 0, CH, 3, 0.6), {
      tone: 'mid',
      inner: L(k.sideSeam(CAB, 3, P, 3), { tone: 'faint' }),
    }),
  )
  out.push(L(t.faceRect('y', FACE, CAB.x + 2, CAB.x + CAB.w - 2, 4, 17, 0.8), { tone: 'lo' }))
  out.push(L(k.sideRing([CAB.x + CAB.w - 4, FACE, 11], 0.7, 'y', P, 12), { tone: 'lo' }))
  out.push(L(t.slots('x', CAB.x + CAB.w, CAB.y + 3, CAB.y + 13, 22, 28, 5, 1.2), { tone: 'lo' }))
  out.push(S(slab(k.insetPlan(CAB, -0.8), CH, 1.6, 3, 0.5), { tone: 'mid' }))
  out.push(
    S(slab({ x: -6, y: CAB.y + 3, w: 9, d: 7, r: 0.8 }, CH + 1.6, 2.2, 2, 0.4), {
      tone: 'hi',
      crease: 'lo',
    }),
  )
  out.push(
    L(k.planOutline({ x: -4.6, y: CAB.y + 4.4, w: 6.2, d: 4.2, r: 0.5 }, CH + 3.8, P, 2), {
      tone: 'faint',
    }),
  )
  out.push(S(cyl(5, CAB.y + 10, 2, CH + 1.6, 1, 20), { tone: 'mid' }))
  out.push(S(cyl(5, CAB.y + 10, 1.5, CH + 2.6, 2.6, 20), { tone: 'hi', lit }))

  // The rotor: a boss on the cabinet face, a tilted hub and three arms.
  const HUB = [0, FACE + 5, 24]
  const A = G.unit3([0, 0.5, 0.866])
  const E1 = [1, 0, 0]
  const E2 = G.cross3(A, E1)
  const F = G.frameOf(HUB, A, E2, E1)
  out.push(S(G.disc(0, 5, 3.6, G.frameAlong([0, FACE, 24], [0, 1, 0]), P), { tone: 'mid' }))
  const arm = (angle) => {
    const from = G.pointOf(F, 2, 2.6, angle)
    const to = G.pointOf(F, 2, 19, angle)
    return t.tube([from, to], 1.1, { tone: 'mid' }) + S(G.sphereOf(to, 1.5, P), { tone: 'mid' })
  }
  out.push(arm((Math.PI * 4) / 3), arm((Math.PI * 2) / 3))
  out.push(
    S(G.disc(-1, 4.4, 4, F, P), {
      tone: 'mid',
      inner: L(G.arcOf(F, 1.6, 4, P), { tone: 'faint' }),
    }),
  )
  out.push(S(G.disc(4.4, 5.6, 2.4, F, P), { tone: 'mid' }))
  out.push(arm(0))

  // Right part of the back fence, then the near fence.
  const right = fence(8, 34, -22, 20)
  out.push(right.rail(18), right.rail(9), right.post(34))
  const near = fence(-34, 34, 16, 20)
  out.push(near.post(-34), near.rail(18), near.rail(9), near.post(34))

  out.push(t.labelPlate({ x: -40, y: 25, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A firewall: a tripod turnstile in a fenced lane; one arm bars the way and the lamp on the cabinet lets one through at a time.',
    body: draw(STAGE),
  }
}
