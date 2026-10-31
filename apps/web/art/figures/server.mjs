import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// An app server: a 2U chassis on slide rails in a small four-post rack stand.
// The status light bar on the front panel is the part to watch.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, S, L, D, at, slab } = t
  const out = []

  const PLATE = { x: -48, y: -38, w: 96, d: 72, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const POST = 5
  const TOP = 48
  const xs = [-42.5, 37.5]
  const ys = [-30, 18]
  const post = (x, y) => {
    const pad = { x: x - 1.5, y: y - 1.5, w: POST + 3, d: POST + 3, r: 1 }
    return [
      S(slab(pad, 0, 1.4, 3, 0.3), { tone: 'mid' }),
      t.topScrews([[x + POST / 2, y + POST + 0.6]], 1.4, 0.6),
      S(slab({ x, y, w: POST, d: POST, r: 0.6 }, 1.4, TOP - 1.4, 2), { tone: 'mid' }),
      D(
        Array.from({ length: 13 }, (_, index) => at([x + POST / 2, y + POST, 6 + index * 3.2])),
        { size: 0.32, tone: 'lo' },
      ),
    ].join('')
  }
  const bottomBar = (plan) => S(slab(plan, 1.4, 2.6, 2, 0.3), { tone: 'lo' })
  const rail = (x) =>
    S(slab({ x, y: ys[0] + POST, w: 2.6, d: ys[1] - ys[0] - POST, r: 0.3 }, 11.6, 2.4, 2), {
      tone: 'lo',
    })

  // Back of the stand: the left posts and rails are behind the chassis.
  out.push(bottomBar({ x: xs[0] + 1, y: ys[0] + POST, w: 3, d: ys[1] - ys[0] - POST, r: 0.4 }))
  out.push(bottomBar({ x: xs[0] + POST, y: ys[0] + 1, w: xs[1] - xs[0] - POST, d: 3, r: 0.4 }))
  out.push(post(xs[0], ys[0]))
  out.push(post(xs[0], ys[1]))
  out.push(rail(-38))
  out.push(bottomBar({ x: xs[1] + 1, y: ys[0] + POST, w: 3, d: ys[1] - ys[0] - POST, r: 0.4 }))
  out.push(bottomBar({ x: xs[0] + POST, y: ys[1] + 1, w: xs[1] - xs[0] - POST, d: 3, r: 0.4 }))

  // The chassis.
  const CH = { x: -36, y: -28, w: 72, d: 51, r: 0.8 }
  const Z0 = 14
  const Z1 = 32
  const FRONT = CH.y + CH.d
  out.push(
    S(slab(CH, Z0, Z1 - Z0, 2, 0.5), {
      tone: 'hi',
      crease: 'lo',
      inner: L(k.sideSeam(CH, Z0 + 3, P, 2), { tone: 'faint' }),
    }),
  )
  out.push(L(k.lineOnTop([CH.x, -4], [CH.x + CH.w, -4], Z1, P), { tone: 'faint' }))
  out.push(D(k.dotGrid(-30, -24, 12, 5, 2.4, Z1, P), { size: 0.32, tone: 'lo' }))
  out.push(
    t.topScrews(
      [
        [-33, -1],
        [33, -1],
        [-33, 20],
        [33, 20],
      ],
      Z1,
      0.9,
    ),
  )
  out.push(t.labelPlate({ x: 8, y: 4, w: 22, d: 11, r: 1 }, Z1))
  // Side vents on the +x face.
  out.push(L(t.slots('x', CH.x + CH.w, -22, 8, 20, 28, 7, 2), { tone: 'lo' }))

  // Front panel with drive caddies, vents, power button and the status bar.
  const PANEL = { x: CH.x, y: FRONT, w: CH.w, d: 1.2, r: 0.3 }
  const FACE = FRONT + 1.2
  out.push(S(slab(PANEL, Z0, Z1 - Z0, 2), { tone: 'hi', crease: 'lo' }))
  for (let index = 0; index < 4; index++) {
    const x = -33 + index * 9.2
    out.push(S(slab({ x, y: FACE, w: 8.2, d: 0.8, r: 0.3 }, 16.5, 13, 2), { tone: 'mid' }))
    const f = FACE + 0.8
    out.push(L(t.slots('y', f, x + 1.4, x + 6.8, 22, 27.6, 4, 0.9), { tone: 'lo' }))
    out.push(L(t.faceRect('y', f, x + 1.4, x + 6.8, 18, 20, 0.6), { tone: 'lo' }))
    out.push(D([at([x + 6.6, f, 19])], { size: 0.45, tone: 'hi' }))
  }
  out.push(L(t.slots('y', FACE, 5, 21, 17.5, 29, 8, 1), { tone: 'lo' }))
  out.push(t.faceDisc('y', FACE, 29, 19.6, 1.9, 0.9, { tone: 'mid' }))
  out.push(L(k.sideRing([29, FACE + 0.9, 19.6], 1, 'y', P, 12), { tone: 'lo' }))
  out.push(S(slab({ x: 24.5, y: FACE, w: 9, d: 1, r: 0.4 }, 25, 3, 2), { tone: 'hi', lit }))

  // Right side of the stand and the rack ears are in front of the chassis.
  out.push(rail(36))
  out.push(post(xs[1], ys[0]))
  out.push(post(xs[1], ys[1]))
  for (const [x, w] of [
    [xs[0], CH.x - xs[0]],
    [CH.x + CH.w, xs[1] + POST - CH.x - CH.w],
  ]) {
    const ear = { x, y: ys[1] + POST, w, d: FACE - ys[1] - POST, r: 0.3 }
    out.push(S(slab(ear, Z0, Z1 - Z0, 2), { tone: 'mid' }))
    out.push(
      t.faceScrews(
        'y',
        FACE,
        [
          [x + w / 2, Z0 + 3],
          [x + w / 2, Z1 - 3],
        ],
        0.9,
      ),
    )
    out.push(
      S(slab({ x: x + w / 2 - 1.2, y: FACE, w: 2.4, d: 2.2, r: 0.9 }, Z0 + 6, Z1 - Z0 - 12, 3), {
        tone: 'mid',
      }),
    )
  }

  // Top frame joining the four posts.
  const bar = (plan) => S(slab(plan, TOP, 3, 2, 0.4), { tone: 'mid' })
  out.push(bar({ x: xs[0], y: ys[0], w: xs[1] - xs[0] + POST, d: POST, r: 0.6 }))
  out.push(bar({ x: xs[0], y: ys[0] + POST, w: POST, d: ys[1] - ys[0] - POST, r: 0.3 }))
  out.push(bar({ x: xs[1], y: ys[0] + POST, w: POST, d: ys[1] - ys[0] - POST, r: 0.3 }))
  out.push(bar({ x: xs[0], y: ys[1], w: xs[1] - xs[0] + POST, d: POST, r: 0.6 }))
  out.push(
    t.topScrews(
      xs.flatMap((x) => ys.map((y) => [x + POST / 2, y + POST / 2])),
      TOP + 3,
      1,
    ),
  )
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'An app server: a 2U chassis with drive bays, vents and a status light bar, on slide rails in a small four-post rack stand.',
    body: draw(STAGE),
  }
}
