import { tools } from '../parts.mjs'
import { HEIGHT, P as STAGE, WIDTH } from '../stage.mjs'

// Search: a library card catalog. Twelve index drawers with pulls and label holders;
// one drawer is pulled out to show its cards, and its front is lit.
export function draw(P, { feet = true, lit = true } = {}) {
  const t = tools(P)
  const { k, S, L, D, at, slab } = t
  const out = []
  const PLATE = { x: -46, y: -42, w: 92, d: 82, r: 6 }
  out.push(t.basePlate(PLATE, { feet }))

  const CASE = { x: -34, y: -32, w: 68, d: 28, r: 1.2 }
  const FRONT = CASE.y + CASE.d
  const Z0 = 4
  const Z1 = 40
  // Recessed plinth, the case and its top cap.
  out.push(
    S(slab({ x: CASE.x + 2, y: CASE.y + 2, w: CASE.w - 4, d: CASE.d - 4, r: 1 }, 0, Z0, 3), {
      tone: 'lo',
    }),
  )
  out.push(
    S(slab(CASE, Z0, Z1 - Z0, 3, 0.6), {
      tone: 'mid',
      inner: L(k.sideSeam(CASE, Z0 + 2, P, 3), { tone: 'faint' }),
    }),
  )
  out.push(S(slab(k.insetPlan(CASE, -1), Z1, 2, 3, 0.6), { tone: 'mid' }))
  out.push(t.topScrews(k.corners(CASE, 2.6), Z1 + 2, 0.7))
  // A tray of loose cards on top.
  const TRAY = { x: -26, y: -26, w: 16, d: 12, r: 0.8 }
  out.push(S(slab(TRAY, Z1 + 2, 2, 2, 0.3), { tone: 'mid' }))
  for (let index = 0; index < 4; index++) {
    out.push(
      S(
        slab(
          { x: TRAY.x + 1.6, y: TRAY.y + 2 + index * 2.2, w: TRAY.w - 3.2, d: 0.4, r: 0 },
          Z1 + 3,
          3.4 - (index % 2) * 0.8,
          1,
        ),
        { tone: 'hi', crease: 'lo' },
      ),
    )
  }

  const COLS = 4
  const ROWS = 3
  const CW = (CASE.w - 4) / COLS
  const CH = (Z1 - Z0 - 4) / ROWS
  const PULL = [2, 1]
  const front = (x, z, w, h, y, active) => {
    const cx = x + w / 2
    return [
      S(slab({ x, y, w, d: 0.8, r: 0.3 }, z, h, 2, 0.2), { tone: 'hi', crease: 'lo', lit: active }),
      S(slab({ x: cx - 2.4, y: y + 0.8, w: 4.8, d: 1.2, r: 0.5 }, z + h * 0.24, 1.4, 2), {
        tone: 'mid',
      }),
      L(t.faceRect('y', y + 0.8, cx - 3.6, cx + 3.6, z + h * 0.56, z + h * 0.84, 0.3), {
        tone: active ? 'lit' : 'lo',
      }),
      D([at([cx - 4.4, y + 0.8, z + h * 0.7]), at([cx + 4.4, y + 0.8, z + h * 0.7])], {
        size: 0.32,
      }),
    ].join('')
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = CASE.x + 2 + col * CW + 0.6
      const z = Z0 + 2 + row * CH + 0.6
      if (col === PULL[0] && row === PULL[1]) {
        out.push(L(t.faceRect('y', FRONT, x, x + CW - 1.2, z, z + CH - 1.2, 0.3), { tone: 'mid' }))
        continue
      }
      out.push(front(x, z, CW - 1.2, CH - 1.2, FRONT, false))
    }
  }

  // The pulled drawer: floor, far wall, cards back to front, near wall, front.
  const DX = CASE.x + 2 + PULL[0] * CW + 1.2
  const DZ = Z0 + 2 + PULL[1] * CH + 0.8
  const DW = CW - 2.4
  const OUT = 18
  out.push(S(slab({ x: DX, y: FRONT - 2, w: DW, d: OUT + 2, r: 0 }, DZ, 0.8, 1), { tone: 'mid' }))
  out.push(
    S(slab({ x: DX, y: FRONT - 2, w: 0.8, d: OUT + 2, r: 0 }, DZ + 0.8, CH - 4, 1), {
      tone: 'mid',
    }),
  )
  for (let index = 0; index < 9; index++) {
    const y = FRONT + 0.6 + index * 1.8
    const tab = index % 3 === 1 ? 1.6 : 0
    out.push(
      S(slab({ x: DX + 1.2, y, w: DW - 2.4, d: 0.35, r: 0 }, DZ + 0.8, CH - 3.4 + tab, 1), {
        tone: 'hi',
        crease: 'lo',
      }),
    )
  }
  out.push(
    S(slab({ x: DX + DW - 0.8, y: FRONT - 2, w: 0.8, d: OUT + 2, r: 0 }, DZ + 0.8, CH - 4, 1), {
      tone: 'mid',
    }),
  )
  out.push(front(DX - 0.6, DZ - 0.2, CW - 1.2, CH - 1.2, FRONT + OUT, lit))

  out.push(t.labelPlate({ x: -40, y: 22, w: 22, d: 9, r: 1 }))
  return out
}

export function figure() {
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'Search: a library card catalog with twelve index drawers; one drawer is pulled out to show its cards.',
    body: draw(STAGE),
  }
}
