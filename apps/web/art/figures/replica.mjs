import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'
import { pack } from './database.mjs'

// A read replica: a smaller twin disk pack driven from the master's spindle by a
// shaft and coupling, so it turns in step. The replica's reading arm is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { G, S, D } = t
  const out = []
  const PLATE = { x: -48, y: -42, w: 96, d: 80, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const MASTER = [-18, 16]
  const REPLICA = [23, -12]
  const master = { c: MASTER, r: 21, levels: 4, gap: 7.4, motor: 11 }
  const replica = { c: REPLICA, r: 16, levels: 4, gap: 6.2, motor: 11, pivot: [40, -29], lit }

  // The drive shaft between the two motors, on two pillow blocks, with a coupling.
  const SHAFT_Z = 6
  const dir = G.unit3([REPLICA[0] - MASTER[0], REPLICA[1] - MASTER[1], 0])
  const F = G.frameAlong([MASTER[0], MASTER[1], SHAFT_Z], dir)
  const span = Math.hypot(REPLICA[0] - MASTER[0], REPLICA[1] - MASTER[1])
  const r0 = master.r * 0.42
  const r1 = replica.r * 0.42
  const shaftFrom = Math.sqrt(r0 * r0 - 1.6 * 1.6)
  const shaftTo = span - Math.sqrt(r1 * r1 - 1.6 * 1.6)
  const pillow = (s) => {
    const p = G.pointOf(F, s, 0, 0)
    return [
      S(t.slab({ x: p[0] - 3.5, y: p[1] - 3.5, w: 7, d: 7, r: 1 }, 0, SHAFT_Z - 2.8, 3, 0.3), {
        tone: 'mid',
      }),
      S(G.disc(-2, 2, 3.4, G.frameAlong(p, dir), P), { tone: 'mid' }),
    ].join('')
  }
  const third = shaftFrom + (shaftTo - shaftFrom) * 0.24
  const twoThirds = shaftFrom + (shaftTo - shaftFrom) * 0.76
  const middle = (shaftFrom + shaftTo) / 2

  const A = pack(t, master)
  const B = pack(t, replica)
  out.push(A.flange, B.flange)
  out.push(S(G.disc(shaftFrom, third - 2, 1.6, F, P), { tone: 'mid' }))
  out.push(pillow(third))
  out.push(S(G.disc(third + 2, middle - 2.4, 1.6, F, P), { tone: 'mid' }))
  out.push(S(G.disc(middle - 2.4, middle - 0.2, 4.2, F, P), { tone: 'mid' }))
  out.push(S(G.disc(middle + 0.2, middle + 2.4, 4.2, F, P), { tone: 'mid' }))
  out.push(D(G.dotsOf(F, middle + 2.4, 3, 6, P, { fade: [0.04, 0.42] }), { size: 0.35 }))
  out.push(S(G.disc(middle + 2.4, twoThirds - 2, 1.6, F, P), { tone: 'mid' }))
  out.push(pillow(twoThirds))
  out.push(S(G.disc(twoThirds + 2, shaftTo, 1.6, F, P), { tone: 'mid' }))
  out.push(A.rest, B.rest)
  out.push(t.labelPlate({ x: 10, y: 24, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A read replica: a smaller twin disk pack driven from the master pack by a shaft and coupling, with its own reading arm.',
    body: draw(STAGE),
  }
}
