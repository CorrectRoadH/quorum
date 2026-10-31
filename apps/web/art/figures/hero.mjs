import * as k from '../kit/iso-kit.mjs'
import { PLATE_H, tools } from '../parts.mjs'
import { draw as cache } from './cache.mjs'
import { draw as database } from './database.mjs'
import { draw as lb } from './lb.mjs'
import { draw as server } from './server.mjs'
import { draw as users } from './users.mjs'

// The title-screen scene: users -> load balancer -> two servers -> cache -> database,
// each machine on its own plate, all on one long bench and joined by cables. Same
// azimuth, elevation and tones as the cards; the load balancer's rotor is the one lit part.

const WIDTH = 640
const HEIGHT = 360
const BENCH = { x: -282, y: -98, w: 564, d: 190, r: 10 }
const BENCH_H = 8
const FOOT_H = 5
const TOP = -PLATE_H
const BOTTOM = TOP - BENCH_H

const MODULES = [
  { draw: users, at: [-222, 24], top: 34, lit: false },
  { draw: lb, at: [-114, 18], top: 28, lit: true },
  { draw: server, at: [14, -48], top: 52, lit: false },
  { draw: server, at: [14, 50], top: 52, lit: false },
  { draw: cache, at: [124, -14], top: 22, lit: false },
  { draw: database, at: [230, -22], top: 46, lit: false },
]

const P = k.fitProjection(
  [
    ...k.boxCorners(BENCH, BOTTOM - FOOT_H, TOP),
    ...MODULES.flatMap(({ at: [x, y], top }) =>
      k.boxCorners({ x: x - 46, y: y - 40, w: 92, d: 80 }, 0, top),
    ),
  ],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 45, elevation: 30 },
)

const moved = ([dx, dy]) => ({ ...P, origin: k.iso([dx, dy, 0], P) })

function bench(t) {
  const { S, L, D, at, cyl, slab } = t
  const out = [
    `<path class="iso-halo" d="${k.haloOf(BENCH, BOTTOM - FOOT_H, BENCH_H + FOOT_H, P)}"/>`,
  ]
  const feet = [...k.corners(BENCH, 14), [0, BENCH.y + 14], [0, BENCH.y + BENCH.d - 14]]
  for (const [x, y] of t.byDepth(feet)) {
    out.push(S(cyl(x, y, 7, BOTTOM - FOOT_H, 1.4, 28), { tone: 'lo' }))
    out.push(
      S(cyl(x, y, 5.4, BOTTOM - FOOT_H + 1.4, FOOT_H - 1.4, 28), { tone: 'mid', crease: 'none' }),
    )
  }
  out.push(
    S(slab(BENCH, BOTTOM, BENCH_H, 8, 1.6), {
      tone: 'mid',
      inner: L(k.sideSeam(BENCH, BOTTOM + 2.6, P, 8), { tone: 'faint' }),
    }),
  )
  out.push(L(k.planOutline(k.insetPlan(BENCH, 5), TOP, P, 8), { tone: 'faint' }))
  const screws = [...k.corners(BENCH, 10), [0, BENCH.y + 10], [0, BENCH.y + BENCH.d - 10]]
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, TOP, P, 16)).join(''), { tone: 'lo' }))
  out.push(
    D(
      screws.map(([x, y]) => at([x, y, TOP])),
      { size: 0.5 },
    ),
  )
  // A ruler strip along the near edge, under the front of the bench.
  const strip = { x: -262, y: BENCH.y + BENCH.d - 13, w: 210, d: 6, r: 1 }
  out.push(S(slab(strip, TOP, 0.6, 3), { tone: 'lo', crease: 'none' }))
  const ticks = k.topTicks(
    strip.x + 3,
    strip.x + strip.w - 3,
    5,
    5,
    strip.y + 0.6,
    TOP + 0.6,
    [1.8, 3.4],
    P,
  )
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
  out.push(
    D(
      [
        at([strip.x + 1.6, strip.y + 3, TOP + 0.6]),
        at([strip.x + strip.w - 1.6, strip.y + 3, TOP + 0.6]),
      ],
      { size: 0.45 },
    ),
  )
  return out.join('')
}

// Cables lie on the bench and run under the plates they connect, so they are drawn
// before the machines. Each leaves its plate through a small gland block.
function cables(t) {
  const z = TOP + 1.5
  const routes = [
    [
      [-182, 30, z],
      [-154, 30, z],
    ],
    [
      [-74, -10, z],
      [-52, -10, z],
      [-52, -40, z],
      [-28, -40, z],
    ],
    [
      [-74, 46, z],
      [-28, 46, z],
    ],
    [
      [56, -30, z],
      [84, -30, z],
    ],
    [
      [56, 20, z],
      [84, 20, z],
    ],
    [
      [164, 0, z],
      [190, 0, z],
    ],
  ]
  return routes.map((points) => t.tube(points, 1.5, { tone: 'mid', bend: 5 })).join('')
}

export function figure() {
  const t = tools(P)
  const body = [bench(t), cables(t)]
  const order = [...MODULES].sort((a, b) => k.depthOf([...a.at, 0], P) - k.depthOf([...b.at, 0], P))
  for (const module of order)
    body.push(...module.draw(moved(module.at), { feet: false, lit: module.lit }))
  return {
    width: WIDTH,
    height: HEIGHT,
    label:
      'A workbench of machines in a row: phone handsets send requests to a rotary load balancer, which feeds two rack servers; they read from a memory-stick cache and a disk-pack database, all joined by cables.',
    body,
  }
}
