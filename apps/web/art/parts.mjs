// Shared drawing helpers for the Quorum component figures. Every figure draws through
// `tools(P)`, so the same part can be drawn by its own card camera or by the hero
// bench camera. Heights are world units with z up; the base plate top is z = 0.

import * as k from './kit/iso-kit.mjs'
import * as G from './kit/lathe.mjs'
import * as T from './kit/tube.mjs'

export const PLATE_H = 5
export const FOOT_H = 3
export const FLOOR = -PLATE_H - FOOT_H

export function tools(P) {
  const S = (paths, style) => k.solidSvg(paths, style)
  const L = (d, style) => k.lineSvg(d, style)
  const D = (points, style) => k.dotsSvg(points, style)
  const at = (point) => k.iso(point, P)
  const depth = (point) => k.depthOf(point, P)
  const byDepth = (points) =>
    [...points].sort((a, b) => depth([a[0], a[1], a[2] ?? 0]) - depth([b[0], b[1], b[2] ?? 0]))
  const slab = (plan, z, h, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel)
  const cyl = (x, y, r, z, h, steps = 28, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel)
  const path = (points, closed = false) => k.pathOf(points.map(at), closed)

  // A point on a vertical face: face 'y' is the plane y = c (u runs along x),
  // face 'x' is the plane x = c (u runs along y).
  const onFace = (face, c, u, z) => (face === 'y' ? [u, c, z] : [c, u, z])
  const faceRect = (face, c, u0, u1, z0, z1, r = 0) =>
    path(
      k
        .ringOf({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, r > 0 ? 4 : 1)
        .map(([u, z]) => onFace(face, c, u, z)),
      true,
    )
  const faceLine = (face, c, a, b) =>
    path([onFace(face, c, a[0], a[1]), onFace(face, c, b[0], b[1])])
  // A row of closed vent slots on a face.
  const slots = (face, c, u0, u1, z0, z1, count, width) => {
    const step = (u1 - u0 - width) / Math.max(1, count - 1)
    return Array.from({ length: count }, (_, index) => {
      const u = u0 + step * index
      return faceRect(face, c, u, u + width, z0, z1, width / 2)
    }).join('')
  }
  // A screw head on a vertical face: a ring and a centre dot.
  const faceScrews = (face, c, points, r = 0.9) =>
    L(points.map(([u, z]) => k.sideRing(onFace(face, c, u, z), r, face, P, 12)).join(''), {
      tone: 'lo',
    }) +
    D(
      points.map(([u, z]) => at(onFace(face, c, u, z))),
      { size: 0.35 },
    )
  // A screw head on a top face.
  const topScrews = (points, z, r = 1.3) =>
    L(points.map(([x, y]) => k.ring(x, y, r, z, P, 14)).join(''), { tone: 'lo' }) +
    D(
      points.map(([x, y]) => at([x, y, z])),
      { size: 0.4 },
    )
  // A round boss standing out of a vertical face along its normal (+x or +y).
  const faceDisc = (face, c, u, z, r, h, style = { tone: 'mid' }) => {
    const F = G.frameAlong(onFace(face, c, u, z), face === 'y' ? [0, 1, 0] : [1, 0, 0])
    return S(G.disc(0, h, r, F, P), style)
  }
  // A knurled knob on a vertical face, with a pointer line on its face.
  const faceKnob = (face, c, u, z, r, h, angle = 0.6) => {
    const normal = face === 'y' ? [0, 1, 0] : [1, 0, 0]
    const F = G.frameOf(
      onFace(face, c, u, z),
      normal,
      [0, 0, 1],
      face === 'y' ? [1, 0, 0] : [0, -1, 0],
    )
    const ribs = G.ribsOf(F, 0.3, h - 0.3, r, 28, P, { fade: [0.05, 0.4] })
    const tip = G.pointOf(F, h, r * 0.75, angle)
    const tail = G.pointOf(F, h, r * 0.15, angle + Math.PI)
    return (
      S(G.disc(-0.6, 0, r + 1.2, F, P), { tone: 'lo' }) +
      S(G.disc(0, h, r, F, P), { tone: 'mid' }) +
      k.fadedSvg(ribs, { tone: 'lo' }) +
      L(path([tail, tip]), { tone: 'hi', free: 'start' })
    )
  }

  // The base plate on four feet that every component stands on.
  const PLATE_STEPS = 8
  function basePlate(plan, { feet = true, screws = true } = {}) {
    const out = []
    if (feet) {
      out.push(`<path class="iso-halo" d="${k.haloOf(plan, FLOOR, PLATE_H + FOOT_H, P)}"/>`)
      for (const [x, y] of byDepth(k.corners(plan, 8))) {
        out.push(S(cyl(x, y, 4.2, FLOOR, 1, 24), { tone: 'lo' }))
        out.push(S(cyl(x, y, 3.2, FLOOR + 1, FOOT_H - 1, 24), { tone: 'mid', crease: 'none' }))
      }
    } else {
      out.push(
        `<path class="iso-halo" style="filter:blur(4px)" d="${k.haloOf(k.insetPlan(plan, 2), -PLATE_H, 0.1, P)}"/>`,
      )
    }
    out.push(S(slab(plan, -PLATE_H, PLATE_H, PLATE_STEPS, 1.2), { tone: 'mid' }))
    out.push(L(k.planOutline(k.insetPlan(plan, 3.2), 0, P, PLATE_STEPS), { tone: 'faint' }))
    if (screws) out.push(topScrews(k.corners(plan, 6.4), 0, 1.4))
    return out.join('')
  }
  // A small label plate with rule lines standing for printed text.
  function labelPlate(plan, z = 0) {
    const h = 0.7
    const inner = k.insetPlan(plan, 1.2)
    const rows = [0.3, 0.55, 0.78]
    const lengths = [0.7, 0.5, 0.62]
    return [
      S(slab(plan, z, h, 3), { tone: 'lo', crease: 'none' }),
      L(k.planOutline(inner, z + h, P, 3), { tone: 'faint' }),
      L(
        rows
          .map((row, index) => {
            const x0 = inner.x + 2.6
            const y = inner.y + inner.d * row
            return k.lineOnTop([x0, y], [x0 + (inner.w - 4) * lengths[index], y], z + h, P)
          })
          .join(''),
        { tone: 'lo', free: true },
      ),
      D(
        [
          at([plan.x + 1.4, plan.y + plan.d / 2, z + h]),
          at([plan.x + plan.w - 1.4, plan.y + plan.d / 2, z + h]),
        ],
        { size: 0.35 },
      ),
    ].join('')
  }
  // A ruler strip with ticks growing from its back edge.
  function ruler(plan, z = 0, step = 3, every = 5) {
    const t = k.topTicks(
      plan.x + 2,
      plan.x + plan.w - 2,
      step,
      every,
      plan.y + 0.6,
      z + 0.5,
      [1.4, 2.6],
      P,
    )
    return [
      S(slab(plan, z, 0.5, 3), { tone: 'lo', crease: 'none' }),
      L(t.minor, { tone: 'lo' }),
      L(t.major, { tone: 'mid' }),
    ].join('')
  }
  // A cable or pipe along a polyline, with its own stripes.
  function tube(points, r, { tone = 'mid', bend = r * 2.6 } = {}) {
    const route = G.fillet(points, bend, 7, { P, tube: r })
    return T.tubePieces(route, r, P, { maxLength: 400 })
      .map((piece) => T.tubeSvg(piece, { tone }))
      .join('')
  }

  return {
    P,
    k,
    G,
    S,
    L,
    D,
    at,
    depth,
    byDepth,
    slab,
    cyl,
    path,
    onFace,
    faceRect,
    faceLine,
    slots,
    faceScrews,
    topScrews,
    faceDisc,
    faceKnob,
    basePlate,
    labelPlate,
    ruler,
    tube,
  }
}
