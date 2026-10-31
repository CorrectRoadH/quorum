import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// A load balancer: a rotary distributor. One inlet pipe feeds a drum whose rotor
// turns to each of three outlets in turn; the rotor arm on top is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, G, S, L, D, at, cyl } = t
  const out = []
  const PLATE = { x: -46, y: -44, w: 92, d: 88, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const C = [-8, -8]
  const R = 15
  const H = 24
  const PIPE_Z = 8
  const PR = 2.4
  const flangeAt = (point, dir, r = PR + 1.6) =>
    S(G.disc(-0.7, 0.7, r, G.frameAlong(point, dir), P), { tone: 'mid' })
  const along = (angle, d, z = PIPE_Z) => [
    C[0] + Math.cos(angle) * d,
    C[1] + Math.sin(angle) * d,
    z,
  ]

  // A receiver post: a short round housing with a cap, at each pipe's far end.
  const post = (x, y) =>
    [
      S(cyl(x, y, 5.4, 0, 1.4, 28), { tone: 'lo' }),
      S(cyl(x, y, 4.2, 1.4, PIPE_Z + 4, 28), { tone: 'mid' }),
      S(cyl(x, y, 4.8, PIPE_Z + 5.4, 1.6, 28, 0.3), { tone: 'mid' }),
      D([at([x, y, PIPE_Z + 7])], { size: 0.45, tone: 'hi' }),
    ].join('')

  // The inlet comes in from the back left.
  const IN = Math.PI * 1.25
  const inEnd = along(IN, 36)
  out.push(post(inEnd[0], inEnd[1]))
  const inDir = [Math.cos(IN), Math.sin(IN), 0]
  out.push(t.tube([along(IN, R + 2), along(IN, 36 - 4.2 - 0.7)], PR))
  out.push(flangeAt(along(IN, R + 1.4), inDir))

  // The drum, with its base ring, two bands and the top cap.
  out.push(S(cyl(C[0], C[1], R + 3, 0, 2.6, 64, 0.5), { tone: 'mid' }))
  out.push(
    S(cyl(C[0], C[1], R, 2.6, H - 2.6, 64, 0.5), {
      tone: 'hi',
      crease: 'lo',
      inner: L([9, 15].map((z) => k.sideArc(C[0], C[1], R, z, P, 40)).join(''), { tone: 'faint' }),
    }),
  )
  out.push(
    D(
      Array.from({ length: 12 }, (_, index) => {
        const a = (index / 12) * Math.PI * 2
        return at([C[0] + Math.cos(a) * (R + 1.6), C[1] + Math.sin(a) * (R + 1.6), 2.6])
      }),
      { size: 0.4 },
    ),
  )
  const ticks = k.radialTicks(C[0], C[1], R - 1.2, 36, 3, H, [1.2, 2.6], P)
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
  out.push(L(k.ring(C[0], C[1], R - 4.4, H, P, 48), { tone: 'faint' }))
  // The rotor: a hub with an arm that points at the active outlet.
  const OUTS = [-Math.PI * 0.2, Math.PI * 0.05, Math.PI * 0.3]
  const aim = OUTS[1]
  const ux = Math.cos(aim)
  const uy = Math.sin(aim)
  const nx = -uy
  const ny = ux
  const arm = [
    [C[0] + nx * 2.6 - ux * 3, C[1] + ny * 2.6 - uy * 3],
    [C[0] + ux * (R - 3) + nx * 1.2, C[1] + uy * (R - 3) + ny * 1.2],
    [C[0] + ux * (R - 1.6), C[1] + uy * (R - 1.6)],
    [C[0] + ux * (R - 3) - nx * 1.2, C[1] + uy * (R - 3) - ny * 1.2],
    [C[0] - nx * 2.6 - ux * 3, C[1] - ny * 2.6 - uy * 3],
  ]
  out.push(S(k.extrude(arm, H, 1.4, P, { bevel: 0.3 }), { tone: 'hi', lit }))
  out.push(S(cyl(C[0], C[1], 4.4, H, 3, 28, 0.4), { tone: 'mid' }))
  out.push(L(k.knurl(C[0], C[1], 4.4, H, H + 3, 22, P, 0.4), { tone: 'lo' }))
  out.push(D([at([C[0], C[1], H + 3])], { size: 0.5, tone: 'hi' }))

  // Three outlets to the front, nearest last.
  const outlets = OUTS.map((angle) => ({ angle, end: along(angle, 40) })).sort(
    (a, b) => t.depth(a.end) - t.depth(b.end),
  )
  for (const { angle, end } of outlets) {
    const dir = [Math.cos(angle), Math.sin(angle), 0]
    out.push(
      S(G.disc(R - 1, R + 2.2, PR + 0.9, G.frameAlong([C[0], C[1], PIPE_Z], dir), P), {
        tone: 'mid',
      }),
    )
    out.push(t.tube([along(angle, R + 2.2), along(angle, 40 - 4.2 - 0.7)], PR))
    out.push(flangeAt(along(angle, 40 - 4.2 - 0.7), dir))
    out.push(post(end[0], end[1]))
  }
  out.push(t.labelPlate({ x: -40, y: 22, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A load balancer: a rotary distributor drum with one inlet pipe and three outlets; the rotor arm on top points at the outlet that takes the next request.',
    body: draw(STAGE),
  }
}
