import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// Analytics: a chart recorder. Paper runs from a back roll to a front roll over the
// bed while a pen on a carriage draws the trace, which is lit; a dial reads the level.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, G, S, L, D, at, slab, cyl } = t
  const out = []
  const PLATE = { x: -46, y: -40, w: 92, d: 78, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const H = { x: -38, y: -30, w: 76, d: 48, r: 2 }
  const HH = 12
  const FRONT = H.y + H.d
  out.push(
    S(slab(H, 0, HH, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(H, 3, P, 4), { tone: 'faint' }) }),
  )
  out.push(L(t.slots('x', H.x + H.w, H.y + 6, H.y + 30, 4.4, 8.6, 8, 1.3), { tone: 'lo' }))
  out.push(
    t.topScrews(
      [
        [H.x + 2.6, FRONT - 2.6],
        [H.x + H.w - 2.6, FRONT - 2.6],
        [H.x + H.w - 2.6, H.y + 2.6],
      ],
      HH,
      0.7,
    ),
  )

  // The paper and its grid.
  const PAPER = { x: -32, y: -24, w: 42, d: 38, r: 0 }
  const PZ = HH + 0.4
  out.push(S(slab(PAPER, HH, 0.4, 1), { tone: 'hi', crease: 'lo' }))
  const grid = []
  for (let x = PAPER.x + 6; x < PAPER.x + PAPER.w; x += 6)
    grid.push(k.lineOnTop([x, PAPER.y], [x, PAPER.y + PAPER.d], PZ, P))
  for (let y = PAPER.y + 5; y < PAPER.y + PAPER.d; y += 5)
    grid.push(k.lineOnTop([PAPER.x, y], [PAPER.x + PAPER.w, y], PZ, P))
  out.push(L(grid.join(''), { tone: 'faint' }))

  // Rolls on cheeks: the back roll, then the trace, then the front roll.
  const roll = (y, r) => {
    const F = G.frameOf([PAPER.x - 1, y, PZ + r], [1, 0, 0], [0, 1, 0], [0, 0, 1])
    return [
      S(slab({ x: PAPER.x - 4, y: y - 2.4, w: 2.4, d: 4.8, r: 0.6 }, HH, r * 2 + 1.6, 2), {
        tone: 'mid',
      }),
      S(G.disc(0, PAPER.w + 2, r, F, P), { tone: 'hi', crease: 'lo' }),
      S(
        slab({ x: PAPER.x + PAPER.w + 1, y: y - 2.4, w: 2.4, d: 4.8, r: 0.6 }, HH, r * 2 + 1.6, 2),
        { tone: 'mid' },
      ),
      D([at([PAPER.x + PAPER.w + 3.4, y, PZ + r])], { size: 0.4 }),
    ].join('')
  }
  out.push(roll(PAPER.y + 1, 3.4))

  const PEN_Y = 4
  const wave = (y) => -11 + 7 * Math.sin(y * 0.38) + 3.4 * Math.sin(y * 1.1 + 1)
  const trace = []
  for (let y = PAPER.y + 5; y <= PEN_Y + 1e-6; y += 0.6) trace.push([wave(y), y, PZ])
  const pen = [wave(PEN_Y), PEN_Y]
  out.push(
    `<g style="--anatomy-weight:1px">${L(t.path(trace), { tone: lit ? 'lit' : 'mid', free: 'start' })}</g>`,
  )

  // The pen carriage on its rail, between two posts.
  const RAIL_Z = HH + 9
  const post = (x) =>
    S(slab({ x, y: PEN_Y - 1.6, w: 3, d: 3.2, r: 0.5 }, HH, RAIL_Z + 2.4 - HH, 2), { tone: 'mid' })
  out.push(post(PAPER.x - 6))
  out.push(S(cyl(pen[0], pen[1], 0.6, PZ, RAIL_Z - 1 - PZ, 10), { tone: 'hi', crease: 'none' }))
  out.push(
    S(slab({ x: PAPER.x - 3, y: PEN_Y - 1, w: PAPER.w + 6, d: 2, r: 0.4 }, RAIL_Z, 2, 2, 0.3), {
      tone: 'mid',
    }),
  )
  out.push(
    S(slab({ x: pen[0] - 3, y: PEN_Y - 2.6, w: 6, d: 5.2, r: 0.8 }, RAIL_Z - 1, 4.4, 2, 0.3), {
      tone: 'mid',
    }),
  )
  out.push(
    t.topScrews(
      [
        [pen[0] - 1.6, PEN_Y],
        [pen[0] + 1.6, PEN_Y],
      ],
      RAIL_Z + 3.4,
      0.5,
    ),
  )
  out.push(post(PAPER.x + PAPER.w + 3))
  out.push(roll(PAPER.y + PAPER.d - 1, 2.6))

  // The level dial on the right of the deck.
  const DIAL = [26, -14]
  const DR = 8
  const DT = HH + 3.6
  out.push(S(cyl(DIAL[0], DIAL[1], DR, HH, 3.6, 56, 0.5), { tone: 'hi', crease: 'lo' }))
  out.push(L(k.ring(DIAL[0], DIAL[1], DR - 1.4, DT, P, 48), { tone: 'lo' }))
  const ticks = k.radialTicks(
    DIAL[0],
    DIAL[1],
    DR - 1.6,
    20,
    5,
    DT,
    [1, 2],
    P,
    -Math.PI * 0.75,
    Math.PI * 1.5,
  )
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
  const needle = 0.9
  out.push(
    L(
      k.lineOnTop(
        [DIAL[0] - Math.sin(needle) * 1.4, DIAL[1] + Math.cos(needle) * 1.4],
        [DIAL[0] + Math.sin(needle) * (DR - 2.4), DIAL[1] - Math.cos(needle) * (DR - 2.4)],
        DT + 0.1,
        P,
      ),
      { tone: 'hi', free: 'start' },
    ),
  )
  out.push(L(k.ring(DIAL[0], DIAL[1], 1, DT, P, 12), { tone: 'mid' }))

  // Front panel: two knobs, a toggle and status lights.
  out.push(t.faceKnob('y', FRONT, 20, 6.4, 3, 2.2, 0.5))
  out.push(t.faceKnob('y', FRONT, 30, 6.4, 3, 2.2, -0.8))
  out.push(L(t.faceRect('y', FRONT, -30, -24, 4, 8.6, 0.6), { tone: 'lo' }))
  out.push(S(slab({ x: -27.8, y: FRONT, w: 1.6, d: 1.8, r: 0.6 }, 5.8, 1.6, 2), { tone: 'mid' }))
  out.push(
    D(
      [-18, -15, -12].map((x) => at([x, FRONT, 7.6])),
      { size: 0.55, tone: 'hi' },
    ),
  )

  out.push(t.labelPlate({ x: -40, y: 23, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'Analytics: a chart recorder whose pen draws a trace on paper running between two rolls, with a level dial and front knobs.',
    body: draw(STAGE),
  }
}
