import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// Users: five handsets in a stepped charging stand with a small wifi router beside
// it. They are where the traffic starts; the one screen that is lit is sending.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, S, L, D, at, slab } = t
  const out = []
  const PLATE = { x: -46, y: -40, w: 92, d: 78, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const W = 12
  const DEPTH = 2.6
  const H = 22
  const phone = (x, y, z, active) => {
    const face = y + DEPTH
    const parts = [
      S(slab({ x, y, w: W, d: DEPTH, r: 1.1 }, z, H, 3, 0.3), { tone: 'hi', crease: 'lo' }),
      L(t.faceRect('y', face, x + 1, x + W - 1, z + 3.2, z + H - 2.6, 0.6), { tone: 'lo' }),
      L(t.faceRect('y', face, x + W / 2 - 2, x + W / 2 + 2, z + H - 1.6, z + H - 1, 0.3), {
        tone: 'lo',
      }),
    ]
    if (active) {
      parts.push(
        S(slab({ x: x + 1.4, y: face, w: W - 2.8, d: 0.4, r: 0.3 }, z + 3.6, H - 6.6, 2), {
          tone: 'hi',
          lit: true,
        }),
      )
    } else {
      parts.push(
        L(
          [0.3, 0.48, 0.66]
            .map((row) =>
              t.faceLine(
                'y',
                face,
                [x + 2.6, z + 4 + row * (H - 7)],
                [x + W - 2.6 - row * 3, z + 4 + row * (H - 7)],
              ),
            )
            .join(''),
          { tone: 'faint', free: true },
        ),
      )
    }
    parts.push(L(k.sideRing([x + W / 2, face, z + 1.7], 0.8, 'y', P, 12), { tone: 'lo' }))
    return parts.join('')
  }
  const lip = (x, y, z) =>
    S(slab({ x: x - 1, y: y + DEPTH, w: W + 2, d: 1.6, r: 0.4 }, z, 2.6, 2), { tone: 'mid' })

  // The stand: a tall back step and a low front step.
  const X0 = -40
  const X1 = 14
  out.push(S(slab({ x: X0, y: -24, w: X1 - X0, d: 13, r: 1.4 }, 0, 10, 3, 0.4), { tone: 'mid' }))
  out.push(L(k.sideSeam({ x: X0, y: -24, w: X1 - X0, d: 13, r: 1.4 }, 2, P, 3), { tone: 'faint' }))
  for (const x of [X0 + 7, X0 + 27]) out.push(phone(x, -22, 10, false))
  for (const x of [X0 + 7, X0 + 27]) out.push(lip(x, -22, 10))
  out.push(S(slab({ x: X0, y: -11, w: X1 - X0, d: 16, r: 1.4 }, 0, 4, 3, 0.4), { tone: 'mid' }))
  ;[X0 + 2, X0 + 19, X0 + 36].forEach((x, index) => out.push(phone(x, -8, 4, lit && index === 1)))
  for (const x of [X0 + 2, X0 + 19, X0 + 36]) out.push(lip(x, -8, 4))
  out.push(
    D(
      [X0 + 3, X1 - 3].map((x) => at([x, 3, 4])),
      { size: 0.4 },
    ),
  )

  // The router: a box with vents, link lights and two antennas.
  const R = { x: 22, y: -20, w: 18, d: 24, r: 2 }
  const RH = 7
  const antenna = (y) =>
    [
      S(t.cyl(R.x + 4, y, 1.8, RH, 2, 16), { tone: 'mid' }),
      S(t.cyl(R.x + 4, y, 0.9, RH + 2, 18, 12), { tone: 'mid', crease: 'none' }),
      S(t.cyl(R.x + 4, y, 1.1, RH + 20, 1.6, 12), { tone: 'mid' }),
    ].join('')
  // A charging lead from the stand to the router.
  out.push(
    t.tube(
      [
        [X1, -18, 3],
        [R.x, -18, 3],
      ],
      1,
      { tone: 'lo' },
    ),
  )
  out.push(S(slab(R, 0, RH, 4, 0.5), { tone: 'mid' }))
  out.push(D(k.dotGrid(R.x + 9, R.y + 4, 3, 7, 2.4, RH, P), { size: 0.32, tone: 'lo' }))
  out.push(antenna(R.y + 4))
  out.push(antenna(R.y + R.d - 4))
  out.push(
    D(
      [0, 1, 2, 3].map((index) => at([R.x + R.w, R.y + 5 + index * 3, RH - 2.4])),
      { size: 0.5, tone: 'hi' },
    ),
  )
  out.push(L(t.slots('x', R.x + R.w, R.y + 17, R.y + 21.5, 1.6, 3.6, 2, 2), { tone: 'lo' }))

  out.push(t.labelPlate({ x: -38, y: 14, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'Users: five phone handsets in a stepped charging stand beside a wifi router; one lit screen is sending a request.',
    body: draw(STAGE),
  }
}
