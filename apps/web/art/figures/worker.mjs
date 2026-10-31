import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'
import { conveyor, parcel } from './queue.mjs'

// A worker: a robot arm beside the end of a conveyor, lifting the next box off the
// line. The box in its gripper is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, G, S, L, D, at, cyl } = t
  const out = []
  const PLATE = { x: -46, y: -44, w: 92, d: 84, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const BELT_Y = -26
  out.push(conveyor(t, { x0: -42, x1: 30, y: BELT_Y, z: 12, boxes: [-32, -18], motor: false }))

  const BASE = [16, 12]
  const SHOULDER = [BASE[0], BASE[1], 17]
  const ELBOW = [BASE[0] - 4, BASE[1] - 6, 40]
  const WRIST = [-2, BASE[1] - 34, 36]
  const LINK = 2.6
  const hub = (c, dir, r = 4.2, len = 7) =>
    S(G.disc(-len / 2, len / 2, r, G.frameAlong(c, dir), P), { tone: 'mid', inner: '' })
  const side = G.unit3(G.cross3(G.sub3(ELBOW, SHOULDER), [0, 0, 1]))

  // The lifted box and the gripper over the belt (farthest), then the forearm, the
  // elbow, the upper arm and the base.
  const BOX = 9
  const boxZ = 20
  out.push(
    parcel(
      t,
      { x: WRIST[0] - BOX / 2, y: WRIST[1] - BOX / 2, w: BOX, d: BOX, r: 0.6 },
      boxZ,
      7.2,
      lit,
    ),
  )
  const grip = { x: WRIST[0] - 6, y: WRIST[1] - 2, w: 12, d: 4, r: 0.8 }
  for (const x of [grip.x, grip.x + grip.w - 1.6]) {
    out.push(
      S(t.slab({ x, y: grip.y + 0.6, w: 1.6, d: 2.8, r: 0.3 }, boxZ + 3, 7.6, 2), { tone: 'mid' }),
    )
  }
  out.push(S(t.slab(grip, boxZ + 10.6, 2.4, 2, 0.3), { tone: 'mid' }))
  out.push(
    S(cyl(WRIST[0], WRIST[1], 2.4, boxZ + 13, WRIST[2] - boxZ - 13 - 2, 20), {
      tone: 'mid',
      crease: 'none',
    }),
  )
  out.push(t.tube([WRIST, ELBOW], LINK, { tone: 'mid' }))
  out.push(S(G.sphereOf(WRIST, 3.4, P), { tone: 'mid' }))
  out.push(hub(ELBOW, side, 4.4, 8))
  out.push(D([at(G.add3(ELBOW, G.mul3(side, 4)))], { size: 0.5, tone: 'hi' }))
  // Base: a flange and a turntable with ticks, then the shoulder yoke around the
  // upper arm (far cheek, arm, near cheek).
  const [bx, by] = BASE
  out.push(S(cyl(bx, by, 12, 0, 2.4, 56, 0.5), { tone: 'mid' }))
  out.push(
    D(
      Array.from({ length: 8 }, (_, index) => {
        const a = (index / 8) * Math.PI * 2 + 0.2
        return at([bx + Math.cos(a) * 10.2, by + Math.sin(a) * 10.2, 2.4])
      }),
      { size: 0.4 },
    ),
  )
  out.push(S(cyl(bx, by, 8.6, 2.4, 6, 48, 0.5), { tone: 'hi', crease: 'lo' }))
  const ticks = k.radialTicks(bx, by, 8.4, 24, 6, 8.4, [1, 2], P)
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
  const across = G.unit3(G.cross3([0, 0, 1], side))
  const cheek = (sign) => {
    const c = G.add3(SHOULDER, G.mul3(side, sign * 4))
    const plate = G.prismOf(
      G.frameOf([bx, by, 8.4], [0, 0, 1], side, across),
      [
        [sign * 3.2, -4.6],
        [sign * 4.8, -4.6],
        [sign * 4.8, 4.6],
        [sign * 3.2, 4.6],
      ],
      0,
      SHOULDER[2] - 8.4,
      P,
    )
    return (
      S(plate, { tone: 'mid' }) +
      S(G.disc(-0.8, 0.8, 4.6, G.frameAlong(c, side), P), { tone: 'mid' })
    )
  }
  const far = t.depth(side) > 0 ? -1 : 1
  out.push(cheek(far))
  out.push(t.tube([ELBOW, SHOULDER], LINK + 0.6, { tone: 'mid' }))
  out.push(cheek(-far))
  out.push(D([at(G.add3(SHOULDER, G.mul3(side, -far * 5)))], { size: 0.5, tone: 'hi' }))
  out.push(t.labelPlate({ x: -40, y: 18, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label: 'A worker: a robot arm beside the end of a conveyor lifting the next box off the line.',
    body: draw(STAGE),
  }
}
