import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// Payments: a card terminal with a keypad and a card in its reader, and a receipt
// printer behind it feeding a strip off its paper roll. The card is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, G, S, L, D, at, slab } = t
  const out = []
  const PLATE = { x: -46, y: -42, w: 92, d: 82, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  // Receipt printer at the back left.
  const PR = { x: -38, y: -34, w: 40, d: 26, r: 2.4 }
  const PH = 10
  out.push(
    S(slab(PR, 0, PH, 4, 0.5), {
      tone: 'mid',
      inner: L(k.sideSeam(PR, 3, P, 4), { tone: 'faint' }),
    }),
  )
  out.push(L(t.slots('y', PR.y + PR.d, PR.x + 26, PR.x + 36, 4.6, 7.4, 4, 1.2), { tone: 'lo' }))
  out.push(D([at([PR.x + 4, PR.y + PR.d, PH - 3])], { size: 0.55, tone: 'hi' }))
  const ROLL = [-24, PH + 6.4]
  const cheek = (x) =>
    S(slab({ x, y: PR.y + 3, w: 3, d: 18, r: 1 }, PH, 10, 3, 0.3), { tone: 'mid' })
  out.push(cheek(PR.x + 3))
  const F = G.frameAlong([PR.x + 6, ROLL[0], ROLL[1]], [1, 0, 0])
  out.push(S(G.disc(0, 28, 6.4, F, P), { tone: 'hi', crease: 'lo' }))
  out.push(
    L(G.circleOf(G.frameAlong([PR.x + 34, ROLL[0], ROLL[1]], [1, 0, 0]), 0, 2, P), { tone: 'lo' }),
  )
  // The strip leaves the front of the roll and rises out of the tear bar.
  const STRIP = { x: PR.x + 9, y: ROLL[0] + 6.4, w: 22, d: 0.5, r: 0 }
  out.push(S(slab(STRIP, ROLL[1], 15, 1), { tone: 'hi', crease: 'lo' }))
  out.push(
    L(
      [3, 5, 7, 9.6, 11.6]
        .map((dz, index) =>
          t.faceLine(
            'y',
            STRIP.y + 0.5,
            [STRIP.x + 3, ROLL[1] + 15 - dz],
            [STRIP.x + 3 + [14, 10, 12, 8, 15][index], ROLL[1] + 15 - dz],
          ),
        )
        .join(''),
      { tone: 'faint', free: true },
    ),
  )
  out.push(
    S(slab({ x: PR.x + 7, y: STRIP.y + 0.5, w: 26, d: 2, r: 0.6 }, ROLL[1] - 1, 3, 2), {
      tone: 'mid',
    }),
  )
  out.push(cheek(PR.x + PR.w - 6))

  // The card terminal at the front right.
  const TM = { x: -2, y: -8, w: 34, d: 42, r: 4 }
  const TH = 7
  const FRONT = TM.y + TM.d
  // The cable between printer and terminal, behind the terminal.
  out.push(
    t.tube(
      [
        [PR.x + PR.w, -20, 3],
        [TM.x + 8, -20, 3],
        [TM.x + 8, TM.y, 3],
      ],
      1,
      { tone: 'lo' },
    ),
  )
  out.push(
    S(slab(TM, 0, TH, 6, 0.6), {
      tone: 'mid',
      inner: L(k.sideSeam(TM, 2.2, P, 6), { tone: 'faint' }),
    }),
  )
  // The reader housing at the back of the terminal, with the card in its slot.
  const RD = { x: TM.x + 4, y: TM.y + 3, w: TM.w - 8, d: 12, r: 2 }
  out.push(S(slab(RD, TH, 6, 4, 0.5), { tone: 'mid' }))
  out.push(
    L(k.planOutline({ x: RD.x + 3.6, y: RD.y + 5, w: RD.w - 7.2, d: 1.6, r: 0.6 }, TH + 6, P, 2), {
      tone: 'lo',
    }),
  )
  out.push(
    S(slab({ x: RD.x + 4.6, y: RD.y + 5.5, w: RD.w - 9.2, d: 0.6, r: 0 }, TH + 6, 13, 1), {
      tone: 'hi',
      lit,
    }),
  )
  out.push(
    L(t.faceRect('y', RD.y + 6.1, RD.x + 6.6, RD.x + 11.4, TH + 13, TH + 16.4, 0.6), {
      tone: 'lit',
    }),
  )
  // Screen window, keypad and a confirm key.
  const screen = { x: TM.x + 5, y: RD.y + RD.d + 2.4, w: TM.w - 10, d: 8, r: 1 }
  out.push(S(slab(screen, TH, 0.6, 2), { tone: 'lo', crease: 'none' }))
  out.push(L(k.planOutline(k.insetPlan(screen, 1.2), TH + 0.6, P, 2), { tone: 'faint' }))
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const key = {
        x: TM.x + 6 + col * 8,
        y: screen.y + screen.d + 2.4 + row * 4.6,
        w: 6,
        d: 3.4,
        r: 0.8,
      }
      out.push(S(slab(key, TH, 1, 2, 0.2), { tone: 'hi', crease: 'lo' }))
    }
  }
  out.push(L(t.slots('x', TM.x + TM.w, TM.y + 10, TM.y + 30, 2, 5, 6, 1.2), { tone: 'lo' }))
  out.push(
    t.topScrews(
      [
        [TM.x + 2.6, FRONT - 2.6],
        [TM.x + TM.w - 2.6, FRONT - 2.6],
      ],
      TH,
      0.6,
    ),
  )

  out.push(t.labelPlate({ x: -40, y: 10, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'Payments: a card terminal with a keypad and a card in its reader, and a receipt printer feeding a strip off its paper roll.',
    body: draw(STAGE),
  }
}
