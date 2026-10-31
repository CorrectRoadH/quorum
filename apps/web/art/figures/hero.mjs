import * as k from '../kit/iso-kit.mjs'
import * as G from '../kit/lathe.mjs'
import { PLATE_H, tools } from '../parts.mjs'
import { draw as cache } from './cache.mjs'
import { draw as database } from './database.mjs'
import { draw as lb } from './lb.mjs'
import { draw as server } from './server.mjs'
import { draw as users } from './users.mjs'

// The title-screen scene: users -> load balancer -> two servers -> cache -> database,
// each machine on its own plate, all on one long bench and joined by cables. Same
// azimuth, elevation and tones as the cards; the load balancer's rotor is the one lit part.
// The title screen inlines this SVG in the dark theme: each machine is a
// `data-machine` group the menu can lift, and a lead cable leaves the users plate
// over the bench's front edge, where the menu's own cable picks it up.

const WIDTH = 640
const HEIGHT = 360
const BENCH = { x: -282, y: -98, w: 564, d: 190, r: 10 }
const BENCH_H = 8
const FOOT_H = 5
const TOP = -PLATE_H
const BOTTOM = TOP - BENCH_H

const MODULES = [
  { name: 'users', tag: 'USERS', draw: users, at: [-222, 24], top: 34, lit: false },
  { name: 'lb', tag: 'LB-01', draw: lb, at: [-114, 18], top: 28, lit: true },
  { name: 'server', tag: 'APP-01', draw: server, at: [14, -48], top: 52, lit: false },
  { name: 'server', tag: 'APP-02', draw: server, at: [14, 50], top: 52, lit: false, left: true },
  { name: 'cache', tag: 'CACHE', draw: cache, at: [124, -14], top: 22, lit: false },
  { name: 'database', tag: 'DB-01', draw: database, at: [230, -22], top: 46, lit: false },
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
  return out
}

// Cables lie on the bench and run under the plates they connect, so they are drawn
// before the machines. Each leaves its plate and runs through the gaps between
// plates, where it can be seen, and request packets ride along it.
const CABLE_Z = TOP + 1.5
const CABLE_R = 1.5
const CABLE_BEND = 5
const CABLES = {
  // Out the front of the users plate, along the bench edge, and under the load balancer.
  users: [
    [-200, 54],
    [-200, 74],
    [-130, 74],
    [-130, 54],
  ],
  // Two cables run side by side down the gap between the servers, one into each.
  serverA: [
    [-76, -6],
    [0, -6],
    [0, -22],
  ],
  serverB: [
    [-76, 4],
    [8, 4],
    [8, 20],
  ],
  // Out of each server's inner edge, across to the cache.
  cacheA: [
    [44, -22],
    [44, -4],
    [86, -4],
  ],
  cacheB: [
    [52, 20],
    [52, 4],
    [86, 4],
  ],
  // Out the front of the cache and into the front of the database.
  database: [
    [150, 18],
    [150, 36],
    [200, 36],
    [200, 14],
  ],
}
// The lead: out from under the users plate, over the front edge, and down.
const LEAD = [
  [-240, 56, CABLE_Z],
  [-240, 96, CABLE_Z],
  [-240, 96, BOTTOM - 16],
]

/** A cable's centreline as the tube draws it, rounded corners included. */
const centreline = (points) => G.fillet(points, CABLE_BEND, 7, { P, tube: CABLE_R })

function cables(t) {
  const routes = [
    ...Object.values(CABLES).map((route) => route.map(([x, y]) => [x, y, CABLE_Z])),
    LEAD,
  ]
  return routes.map((points) => t.tube(points, CABLE_R, { tone: 'mid', bend: CABLE_BEND }))
}

// The title screen is the game idling, as Factorio's menu is: requests leave the
// users and ride the cables machine to machine. Four requests per loop take the two
// servers in turn. Packets follow each cable's centreline and are drawn with the
// cables, under the machines, so a plate hides a packet where its cable runs beneath.
const LOOP = 3.6
const START = 2.3
const TRIPS = [
  ['users', 'serverA', 'cacheA', 'database'],
  ['users', 'serverB', 'cacheB', 'database'],
]
const WINDOWS = [
  [0, 0.55],
  [0.75, 1.5],
  [1.7, 2.35],
  [2.55, 3.15],
]

function packet(route, [from, to], begin) {
  const path = centreline(route.map(([x, y]) => [x, y, CABLE_Z]))
    .map((point, i) => {
      const [px, py] = k.iso(point, P)
      return `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`
    })
    .join('')
  const a = (from / LOOP).toFixed(4)
  const b = (to / LOOP).toFixed(4)
  const fadeIn = ((from + 0.06) / LOOP).toFixed(4)
  const fadeOut = ((to - 0.06) / LOOP).toFixed(4)
  const timing = `dur="${LOOP}s" begin="${begin}s" repeatCount="indefinite"`
  return `<g opacity="0"><animate attributeName="opacity" ${timing} keyTimes="0;${a};${fadeIn};${fadeOut};${b};1" values="0;0;1;1;0;0"/><animateMotion ${timing} path="${path}" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;${a};${b};1"/><circle r="5" fill="var(--anatomy-lit)" opacity=".16"/><circle r="2.2" fill="var(--anatomy-lit)"/></g>`
}

// Each hop sits in the depth order at its nearest point, so a machine in front hides it.
function packets() {
  const out = Object.entries(CABLES).flatMap(([name, route]) =>
    [0, 1, 2, 3].map((n) => {
      const i = TRIPS[n % 2].indexOf(name)
      return i < 0 ? '' : packet(route, WINDOWS[i], START + (n * LOOP) / 4)
    }),
  )
  return `<g class="packets">${out.join('')}</g>`
}

// On first paint the bench is assembled. The slab falls into place, its fittings
// drop on, and then each machine in turn, left to right, lands as a plate and has
// its parts set on it one by one, back to front, before its callout is pinned.
// Things fall with gravity, sink a little and settle. The cables lay
// once both ends are down; then traffic starts.
const GRAVITY = 'cubic-bezier(.55,0,1,.45)'
const SETTLE = 'cubic-bezier(.23,1,.32,1)'
const ASSEMBLY = `<style>
.iso .slam{animation:iso-slam 520ms both}
.iso .drop{animation:iso-drop 420ms both}
.iso .pin{animation:iso-fade 300ms ease both}
@keyframes iso-slam{
  0%{opacity:0;transform:translateY(-26px);animation-timing-function:${GRAVITY}}
  10%{opacity:1}
  50%{transform:translateY(0);animation-timing-function:${SETTLE}}
  66%{transform:translateY(1.6px);animation-timing-function:${SETTLE}}
  100%{transform:none}}
@keyframes iso-drop{
  0%{opacity:0;transform:translateY(-16px);animation-timing-function:${GRAVITY}}
  15%{opacity:1}
  55%{transform:translateY(0);animation-timing-function:${SETTLE}}
  72%{transform:translateY(.8px);animation-timing-function:${SETTLE}}
  100%{transform:none}}
@keyframes iso-fade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .iso :is(.slam,.drop){animation:iso-fade 300ms ease both}
  .iso .packets{display:none}}
</style>`

const FIRST_MACHINE = 300
const MACHINE_GAP = 170
/** A slam lands halfway through: plates are down this long after they start. */
const PLATE = 260
const PARTS = 420

const step = (kind, delay, inner) =>
  `<g class="${kind}" style="animation-delay:${Math.round(delay)}ms">${inner}</g>`

/** Parts dropped one after another inside a time budget, from `start`. */
const dropAll = (parts, start) => {
  const gap = Math.min(28, PARTS / Math.max(parts.length, 1))
  return parts.map((part, index) => step('drop', start + index * gap, part)).join('')
}

// A drawing callout above each machine: a dot on its top, a leader up, and its tag.
// `left` turns the tag to the left where the machine behind would cover it.
// The title screen sets --callout on the machine the menu aims at.
function callout({ at: [x, y], top, tag, left = false }) {
  const [px, py] = k.iso([x, y, top], P)
  const up = py - (left ? 12 : 22)
  const ink = 'var(--callout,var(--anatomy-muted))'
  const text = left ? `x="${(px - 8).toFixed(1)}" text-anchor="end"` : `x="${(px + 8).toFixed(1)}"`
  return `<g class="callout"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.1" style="fill:${ink}"/><path d="M${px.toFixed(1)} ${py.toFixed(1)}V${up.toFixed(1)}h${left ? -6 : 6}" style="fill:none;stroke:${ink};stroke-width:.5"/><text ${text} y="${(up + 2.2).toFixed(1)}" style="fill:${ink};font:500 6.2px var(--anatomy-mono);letter-spacing:.08em">${tag}</text></g>`
}

export function figure() {
  const t = tools(P)
  const leftToRight = [...MODULES].sort((a, b) => a.at[0] - b.at[0])
  const start = (module) => FIRST_MACHINE + leftToRight.indexOf(module) * MACHINE_GAP
  const [users, lb, serverA, serverB, cache, database] = MODULES.map(start)
  const benchParts = bench(t)
  // The slab, its feet and its halo land together; screws, outline and ruler drop onto it.
  const body = [
    step('slam', 0, benchParts.slice(0, 14).join('')),
    dropAll(benchParts.slice(14), PLATE),
  ]
  // Each cable lays once the later of its two machines has its plate down.
  const laid = [lb, serverA, serverB, cache, cache, database, users]
  body.push(...cables(t).map((cable, index) => step('pin', laid[index] + PLATE, cable)))
  body.push(packets())
  const machines = MODULES.map((module) => {
    const at = start(module)
    const [x, y] = module.at
    const [plate, ...parts] = module.draw(moved(module.at), { feet: false, lit: module.lit })
    return {
      depth: k.depthOf([x, y, 0], P),
      svg: `<g data-machine="${module.name}">${step('slam', at, plate)}${dropAll(parts, at + PLATE)}${step('pin', at + PLATE + PARTS + 60, callout(module))}</g>`,
    }
  })
  for (const { svg } of machines.sort((a, b) => a.depth - b.depth)) body.push(svg)
  return {
    width: WIDTH,
    height: HEIGHT,
    theme: 'dark',
    label:
      'A workbench of machines in a row: phone handsets send requests to a rotary load balancer, which feeds two rack servers; they read from a memory-stick cache and a disk-pack database, all joined by cables.',
    body: [ASSEMBLY, ...body],
  }
}
