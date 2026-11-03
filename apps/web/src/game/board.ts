import {
  Activity,
  Archive,
  ArrowRightFromLine,
  ArrowRightToLine,
  Banknote,
  Cable,
  Check,
  ChevronsUp,
  Coins,
  Copy,
  Gauge,
  Gem,
  HardDrive,
  Hourglass,
  HandCoins,
  type IconNode,
  Inbox,
  Layers,
  ListOrdered,
  LogIn,
  Plus,
  RotateCcw,
  ScanLine,
  ShieldBan,
  Shuffle,
  Smile,
  Target,
  Timer,
  Unplug,
  Users,
  Wallet,
} from 'lucide'
import { play } from './sound.ts'
import {
  Application,
  Container,
  FillGradient,
  Graphics,
  Point,
  Sprite,
  Text,
  Texture,
} from 'pixi.js'
import {
  COMPONENTS,
  FRAMEWORKS,
  LB_POLICIES,
  KINDS,
  RUNTIMES,
  GPU_TYPES,
  SCAN_PRICE,
  SIZES,
  ZONES,
  POOLS,
  type BuildGroup,
  type InsightPool,
  type ComponentId,
  MSGP_PRICE,
  REGION_INFO,
  rttOf,
} from '@quorum/simulation/catalog'
import { POOL_ICONS, POOL_ORDER } from './pools'
import type { Ledger } from '@quorum/simulation/ledger'
import {
  burnOf,
  drawerSize,
  eraOf,
  has,
  replacePrice,
  resizePrice,
  sizeLabel,
  zoned,
  zoneMs,
} from '@quorum/simulation/lookups'
import { isGlobal } from '@quorum/simulation/regions'
import type { Game, GameNode, Region } from '@quorum/simulation/state'
import { compact, money, ms, priceLabel, rate } from './format.ts'
import { isPhone } from './viewport.ts'
import {
  CARD_W,
  FOOT,
  HEAD,
  PORT_R,
  ROW,
  boxOf,
  freeSpot,
  gap,
  heightOf,
  inPort,
  layoutOf,
  outPort,
  route,
  rowMid,
  rowTop,
  type Pt,
  type Route,
} from './geometry.ts'
import { HOP, routeLinks, type Wire } from './routing.ts'
import { COMPONENT_ICONS, GROUP_SHAPES, STACK_LOGOS, type StackLogoId } from './icons.ts'

/* ==========================================================================
   The board: a PixiJS plane the player builds on. Foldkit owns the Model;
   this module owns pixels and reports gestures back through BoardEvents.
   Pointer input is read from DOM events and hit-tested by hand against the
   Model's geometry, so what the player clicks is exactly what the Model says.
   ========================================================================== */

export type BoardEvents = Readonly<{
  onNodeTap: (nodeId: string) => void
  onNodeMove: (nodeId: string, x: number, y: number) => void
  onFooter: (nodeId: string) => void
  onLink: (from: string, to: string) => void
  onUnlink: (from: string, to: string) => void
  onPlace: (x: number, y: number) => void
  onEmptyTap: () => void
  /** Shift-click: add a Node to the selection, or take it out. */
  onNodeToggle: (nodeId: string) => void
  /** Shift-drag on empty space: select every Node the box touches. */
  onBox: (ids: ReadonlyArray<string>) => void
}>

/** A Playbook following the pointer: its Nodes relative to the top-left corner. */
export type Stamp = ReadonlyArray<
  Readonly<{ type: ComponentId; dx: number; dy: number; ghost: boolean }>
>

export type BoardState = Readonly<{
  game: Game
  ledger: Ledger
  selected: string | null
  /** Nodes picked with shift for a Playbook. */
  selection: ReadonlyArray<string>
  placing: ComponentId | null
  /** A Playbook being placed: the next click puts its top-left corner there. */
  stamp: Stamp | null
  /** Each Node's utilization, one point per 10 sim seconds. */
  history: Readonly<Record<string, ReadonlyArray<number>>>
  /** The region tab on show; its Nodes, and the Nodes they reach elsewhere, are drawn. */
  region: Region
  /** The company is paused: belts hold still. */
  paused: boolean
  /** The Node whose footer button glows: a disclosure cue (15 "Progressive disclosure"). */
  cue: string | null
}>

/** Latest state per board, written by update and read on mount. */
const desired = new Map<string, BoardState>()
const controllers = new Map<string, BoardController>()

export const setBoard = (key: string, state: BoardState): void => {
  desired.set(key, state)
  controllers.get(key)?.draw(state)
}

export const fitBoard = (key: string): void => controllers.get(key)?.fit()

/* ---------- colours, resolved once through the DOM ---------- */

let pixel: CanvasRenderingContext2D | null | undefined

const toInt = (value: string): number => {
  if (pixel === undefined) {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    pixel = canvas.getContext('2d', { willReadFrequently: true })
  }
  if (!pixel) return 0
  pixel.fillStyle = '#000000'
  pixel.fillStyle = value
  pixel.clearRect(0, 0, 1, 1)
  pixel.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = pixel.getImageData(0, 0, 1, 1).data
  return (r << 16) | (g << 8) | b
}

const colors = new Map<string, number>()
let probe: HTMLSpanElement | null = null

const token = (name: string, fallback: string): number => {
  const cached = colors.get(name)
  if (cached !== undefined) return cached
  probe ??= document.createElement('span')
  probe.style.display = 'none'
  if (!probe.isConnected) document.body.append(probe)
  probe.style.color = `var(${name}, ${fallback})`
  const value = toInt(getComputedStyle(probe).color)
  colors.set(name, value)
  return value
}

const resolvePalette = () => ({
  canvas: token('--canvas', '#f1f4f9'),
  grid: token('--canvas-dot', '#c9d3e3'),
  card: token('--card', '#ffffff'),
  well: token('--well', '#eeeef0'),
  border: token('--input', '#d5ddea'),
  edge: token('--edge-solid', '#9aa8bf'),
  accent: token('--primary-strong', '#4f7fe0'),
  fillTop: token('--primary-fill-top', '#4a4a50'),
  fillBottom: token('--primary-fill-bottom', '#2a2a2e'),
  onFill: token('--on-primary-fill', '#ffffff'),
  ink: token('--foreground', '#16233d'),
  muted: token('--muted-foreground', '#5c6b85'),
  track: token('--muted', '#eef2f8'),
  ok: token('--ok', '#1a8a51'),
  warn: token('--warn', '#cd7d09'),
  danger: token('--danger', '#c72e2b'),
  groups: {
    edge: token('--group-edge', '#3a9ad9'),
    compute: token('--group-compute', '#6c4fe0'),
    data: token('--group-data', '#1fa59a'),
    ops: token('--group-ops', '#d43d93'),
  } satisfies Record<BuildGroup, number>,
})

type Palette = ReturnType<typeof resolvePalette>

let resolved: Palette | null = null

/** Every token is resolved once and kept, so the palette is too. */
const palette = (): Palette => (resolved ??= resolvePalette())

/** Blends two 0xRRGGBB colours; `t` is the share of `b`. */
const mix = (a: number, b: number, t: number): number => {
  const channel = (shift: number) =>
    Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) << shift
  return channel(16) | channel(8) | channel(0)
}

const gradients = new Map<string, FillGradient>()

/** A cached top-to-bottom gradient, so redraws do not allocate textures. */
const gradient = (top: number, bottom: number, across = false): FillGradient => {
  const key = `${top}:${bottom}:${across}`
  const cached = gradients.get(key)
  if (cached) return cached
  const made = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: across ? { x: 1, y: 0 } : { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: top },
      { offset: 1, color: bottom },
    ],
    textureSpace: 'local',
  })
  gradients.set(key, made)
  return made
}

type Corner = Readonly<{ cut: boolean; r: number }>
const round = (r: number): Corner => ({ cut: false, r })
const cut = (r: number): Corner => ({ cut: true, r })

/**
 * Card corners per build group, clockwise from the top left. Edge cards are
 * chamfered like a hexagon, Compute cards are chips, Data cards are soft like a
 * disc, and Ops cards are leaves, with two sharp corners like a diamond.
 */
const CORNERS: Record<BuildGroup, readonly [Corner, Corner, Corner, Corner]> = {
  edge: [cut(9), cut(9), cut(9), cut(9)],
  compute: [round(10), round(10), round(10), round(10)],
  data: [round(18), round(18), round(18), round(18)],
  ops: [round(16), round(4), round(16), round(4)],
}

/**
 * Traces a card's silhouette into `g`, ready to fill or stroke. `grow` offsets
 * it outward, for halos around the card; `head` keeps the bottom corners
 * square, for the header band.
 */
const silhouette = (
  g: Graphics,
  group: BuildGroup,
  x: number,
  y: number,
  w: number,
  h: number,
  grow = 0,
  head = false,
): Graphics => {
  const [tl, tr, br, bl] = CORNERS[group].map((corner, index) =>
    head && index >= 2
      ? round(0)
      : { cut: corner.cut, r: corner.r + (corner.cut ? grow * 0.41 : grow) },
  ) as [Corner, Corner, Corner, Corner]
  const left = x - grow
  const top = y - grow
  const right = x + w + grow
  const bottom = y + h + (head ? 0 : grow)
  const turn = (
    corner: Corner,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    ax: number,
    ay: number,
  ) => {
    g.lineTo(bx, by)
    if (corner.cut) g.lineTo(ax, ay)
    else if (corner.r > 0) g.arcTo(cx, cy, ax, ay, corner.r)
  }
  g.moveTo(left + tl.r, top)
  turn(tr, right - tr.r, top, right, top, right, top + tr.r)
  turn(br, right, bottom - br.r, right, bottom, right - br.r, bottom)
  turn(bl, left + bl.r, bottom, left, bottom, left, bottom - bl.r)
  turn(tl, left, top + tl.r, left, top, left + tl.r, top)
  return g.closePath()
}

/** A build group's badge shape, centred on (x, y) with outer radius `r`. */
const badgeShape = (g: Graphics, group: BuildGroup, x: number, y: number, r: number): Graphics => {
  switch (GROUP_SHAPES[group]) {
    case 'hexagon':
      return g.roundPoly(x, y, r * 1.04, 6, r * 0.22)
    case 'diamond':
      return g.roundPoly(x, y, r * 1.12, 4, r * 0.24)
    case 'chip': {
      // A body with three pins on each side.
      const body = r * 0.74
      const pin = r * 0.15
      for (const at of [-0.42, 0, 0.42]) {
        const k = at * r
        g.rect(x - r, y + k - pin / 2, r - body, pin)
        g.rect(x + body, y + k - pin / 2, r - body, pin)
        g.rect(x + k - pin / 2, y - r, pin, r - body)
        g.rect(x + k - pin / 2, y + body, pin, r - body)
      }
      return g.roundRect(x - body, y - body, body * 2, body * 2, r * 0.22)
    }
    case 'disc':
      return g.circle(x, y, r * 0.95)
  }
}

/** Glyph size inside a badge of radius `r`; a diamond has the least room. */
const badgeGlyph = (group: BuildGroup, r: number): number =>
  Math.round(
    r * (GROUP_SHAPES[group] === 'diamond' ? 0.9 : GROUP_SHAPES[group] === 'chip' ? 0.95 : 1.1),
  )

/** A cached left-to-right gradient. */
const gradientX = (left: number, right: number): FillGradient => gradient(left, right, true)

/** CSS cubic-bezier timing, so the board moves on the same curves as the DOM. */
const cubicBezier =
  (x1: number, y1: number, x2: number, y2: number) =>
  (t: number): number => {
    const at = (s: number, a: number, b: number) =>
      3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s
    // Solve x(s) = t by bisection; 20 halvings is far below a pixel.
    let lo = 0
    let hi = 1
    for (let step = 0; step < 20; step += 1) {
      const mid = (lo + hi) / 2
      if (at(mid, x1, x2) < t) lo = mid
      else hi = mid
    }
    return at((lo + hi) / 2, y1, y2)
  }

/** `--ease-out` in styles.css. */
const easeOut = cubicBezier(0.23, 1, 0.32, 1)
const ENTER_S = 0.2
const EXIT_S = 0.15
/** A new link draws out of its port, then glows a moment; a cut one fades. */
const DRAW_IN_S = 0.22
const GLOW_S = 0.6
const CUT_S = 0.18
const RETRACT_S = 0.18

let reduceQuery: MediaQueryList | null = null

/** The system setting, or the player's Reduce motion setting (`data-motion` on the root).
 *  The query is made once: its `matches` stays live, and the board asks every frame. */
const reducedMotion = (): boolean =>
  document.documentElement.dataset['motion'] === 'reduce' ||
  (reduceQuery ??= matchMedia('(prefers-reduced-motion: reduce)')).matches

/** How far toward its target a followed value moves this frame. A follow keeps its
 *  speed when the target changes mid-way, so drags and selections never restart. */
const follow = (seconds: number, rate: number, still: boolean): number =>
  still ? 1 : 1 - Math.exp(-rate * seconds)

const glyphs = new Map<IconNode, Texture>()
const GLYPH_PX = 96

/**
 * A lucide icon drawn once in white onto a canvas, then tinted per use.
 * Canvas `Path2D` reads every SVG path form lucide uses.
 */
const glyphOf = (node: IconNode): Texture => {
  const cached = glyphs.get(node)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = GLYPH_PX
  canvas.height = GLYPH_PX
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(GLYPH_PX / 24, GLYPH_PX / 24)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const num = (value: unknown) => Number(value ?? 0)
    for (const [tag, attrs] of node) {
      const a = attrs as Record<string, unknown>
      ctx.beginPath()
      switch (tag) {
        case 'path':
          ctx.stroke(new Path2D(String(a['d'])))
          continue
        case 'circle':
          ctx.arc(num(a['cx']), num(a['cy']), num(a['r']), 0, Math.PI * 2)
          break
        case 'ellipse':
          ctx.ellipse(num(a['cx']), num(a['cy']), num(a['rx']), num(a['ry']), 0, 0, Math.PI * 2)
          break
        case 'rect':
          ctx.roundRect(num(a['x']), num(a['y']), num(a['width']), num(a['height']), num(a['rx']))
          break
        case 'line':
          ctx.moveTo(num(a['x1']), num(a['y1']))
          ctx.lineTo(num(a['x2']), num(a['y2']))
          break
        case 'polyline':
        case 'polygon': {
          const points = String(a['points'])
            .trim()
            .split(/[\s,]+/)
            .map(Number)
          for (let index = 0; index + 1 < points.length; index += 2)
            ctx.lineTo(points[index] ?? 0, points[index + 1] ?? 0)
          if (tag === 'polygon') ctx.closePath()
          break
        }
      }
      ctx.stroke()
    }
  }
  const made = Texture.from(canvas)
  glyphs.set(node, made)
  return made
}

/** A sprite for one glyph at `size` pixels; set its texture and tint per update. */
const glyph = (size: number): Sprite => {
  const view = new Sprite(Texture.EMPTY)
  view.setSize(size)
  return view
}

/** Points a glyph sprite at an icon and colour. */
const paint = (view: Sprite, node: IconNode, color: number): void => {
  const size = view.width
  view.texture = glyphOf(node)
  view.setSize(size)
  view.tint = color
}

const logos = new Map<string, Texture>()

/** A brand mark filled once in white, then tinted to its brand colour per use. */
const logoOf = (path: string): Texture => {
  const cached = logos.get(path)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = GLYPH_PX
  canvas.height = GLYPH_PX
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(GLYPH_PX / 24, GLYPH_PX / 24)
    ctx.fillStyle = '#ffffff'
    ctx.fill(new Path2D(path))
  }
  const made = Texture.from(canvas)
  logos.set(path, made)
  return made
}

/** Points a sprite at a language or framework mark; black marks take `ink`. */
const paintLogo = (view: Sprite, id: StackLogoId, ink: number): void => {
  const size = view.width
  const logo = STACK_LOGOS[id]
  view.texture = logoOf(logo.path)
  view.setSize(size)
  view.tint = logo.color ? Number.parseInt(logo.color.slice(1), 16) : ink
}

/* ---------- geometry ---------- */

/** The footer button, in the node's own coordinates. */
const footerRect = (type: ComponentId) => {
  const y = rowTop(layoutOf(type).rows) + 4
  return { x: 8, y, w: CARD_W - 16, h: FOOT - 13 }
}

const inFooter = (node: GameNode, point: Pt): boolean => {
  if (!layoutOf(node.type).footer) return false
  const rect = footerRect(node.type)
  const x = point.x - node.x
  const y = point.y - node.y
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
}

const lengthOf = (path: Route): number =>
  path.reduce((sum, point, index) => {
    const previous = path[index - 1]
    return previous ? sum + gap(previous, point) : sum
  }, 0)

/** The point `t` of the way along a path, by length. */
const pointOn = (path: Route, t: number, length = lengthOf(path)): Pt => {
  let left = length * t
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1]
    const b = path[index]
    if (!a || !b) continue
    const span = gap(a, b)
    if (left <= span && span > 0) {
      const k = left / span
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
    }
    left -= span
  }
  return path[path.length - 1] ?? { x: 0, y: 0 }
}

const distanceTo = (path: Route, point: Pt): number => {
  let best = Number.POSITIVE_INFINITY
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1]
    const b = path[index]
    if (!a || !b) continue
    const span = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
    const k =
      span === 0
        ? 0
        : Math.max(
            0,
            Math.min(1, ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / span),
          )
    best = Math.min(best, gap({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }, point))
  }
  return best
}

/** The lane a backward link runs along, under both cards. */
const laneUnder = (from: GameNode, toBottom: number): number =>
  Math.max(from.y + heightOf(from.type), toBottom) + 18

const routeOf = (from: GameNode, to: GameNode): Route =>
  route(outPort(from), inPort(to), laneUnder(from, to.y + heightOf(to.type)))

/** The first `t` of a path, by length. */
const partOf = (path: Route, t: number): Route => {
  const out: Array<Pt> = []
  let left = lengthOf(path) * Math.max(0, Math.min(1, t))
  for (let index = 0; index < path.length; index += 1) {
    const point = path[index]
    const previous = path[index - 1]
    if (!point) continue
    if (!previous) {
      out.push(point)
      continue
    }
    const span = gap(previous, point)
    if (left >= span) {
      out.push(point)
      left -= span
      continue
    }
    const k = span > 0 ? left / span : 0
    out.push({
      x: previous.x + (point.x - previous.x) * k,
      y: previous.y + (point.y - previous.y) * k,
    })
    break
  }
  return out
}

const traceOf = (graphics: Graphics, path: Route): Graphics => {
  const [first, ...rest] = path
  if (!first) return graphics
  graphics.moveTo(first.x, first.y)
  for (const point of rest) graphics.lineTo(point.x, point.y)
  return graphics
}

/*
 * Links are belts. Every belt has the same body between two rails; chevrons on it
 * point the way it runs and move at its speed, and requests ride on it as items.
 * A busier belt runs faster. Where a belt passes under another, it dips
 * underground: a gap with a cap at each mouth.
 */
const BELT = 7
/** Width of the splitter where one port feeds several belts. */
const SPLITTER_W = 12
/** World pixels between chevrons, and their half-width and depth. */
const CHEVRON_GAP = 10
const CHEVRON_HALF = 2.2
const CHEVRON_DEPTH = 2
/** Belt speed in world pixels per second. */
const beltSpeed = (rate: number): number => 22 + 16 * Math.log2(1 + rate)

/** Calls `visit` every `step` pixels along a path, starting `offset` in. */
const walk = (
  path: Route,
  step: number,
  offset: number,
  visit: (point: Pt, ux: number, uy: number) => void,
): void => {
  let next = ((offset % step) + step) % step
  let travelled = 0
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1]
    const b = path[index]
    if (!a || !b) continue
    const span = gap(a, b)
    if (span === 0) continue
    const ux = (b.x - a.x) / span
    const uy = (b.y - a.y) / span
    while (next <= travelled + span) {
      const k = next - travelled
      visit({ x: a.x + ux * k, y: a.y + uy * k }, ux, uy)
      next += step
    }
    travelled += span
  }
}

/* ---------- one node window ---------- */

const MONO = '"Geist Mono", ui-monospace, monospace'
const SANS = '"Geist", ui-sans-serif, system-ui, sans-serif'
/** The medallion in a card's header: its centre and the badge's outer radius. It breaks
 *  out of the card's top-left corner. */
const BADGE_X = 20
const BADGE_Y = 13
const BADGE_R = 16
/** Where the title starts, clear of the medallion. */
const TITLE_X = 48

/** The plate behind a badge, in the build group's shape; a chip's plate is a square. */
const plateShape = (g: Graphics, group: BuildGroup, x: number, y: number, r: number): Graphics =>
  GROUP_SHAPES[group] === 'chip'
    ? g.roundRect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, r * 0.3)
    : badgeShape(g, group, x, y, r)

/** The header's medallion: a card-coloured plate in the group's shape, with the badge on it. */
const medallion = (g: Graphics, group: BuildGroup, tone: number, colors: Palette): void => {
  const plate = BADGE_R + 5.5
  plateShape(g, group, BADGE_X, BADGE_Y + 1.5, plate + 0.5).fill({ color: colors.ink, alpha: 0.08 })
  plateShape(g, group, BADGE_X, BADGE_Y, plate).fill(colors.card)
  plateShape(g, group, BADGE_X, BADGE_Y, plate).stroke({
    color: mix(colors.border, tone, 0.5),
    width: 1.5,
  })
  badgeShape(g, group, BADGE_X, BADGE_Y, BADGE_R).fill(
    gradient(mix(tone, 0xffffff, 0.2), mix(tone, 0x000000, 0.1)),
  )
}

/** The header band: a wash of the group's colour, fading to the right, over a hairline. */
const headerBand = (g: Graphics, group: BuildGroup, hue: number, colors: Palette): void => {
  silhouette(g, group, 0, 0, CARD_W, HEAD, 0, true).fill(
    gradientX(mix(colors.card, hue, 0.22), mix(colors.card, hue, 0.04)),
  )
  g.moveTo(0, HEAD)
    .lineTo(CARD_W, HEAD)
    .stroke({ color: mix(colors.border, hue, 0.35), width: 1, alpha: 0.8 })
}

/** Width of `total` size pips. */
const pipsWidth = (total: number): number => total * (total > 5 ? 5.5 : 7) - 2

/** A Node's size as slanted pips: `filled` of `total` lit, drawn from (x, y). */
const pips = (
  g: Graphics,
  x: number,
  y: number,
  filled: number,
  total: number,
  on: number,
  off: number,
): void => {
  const w = total > 5 ? 3.5 : 5
  const step = w + 2
  for (let index = 0; index < total; index += 1) {
    const at = x + index * step
    g.poly([at + 2, y, at + w + 2, y, at + w, y + 9, at, y + 9]).fill(index < filled ? on : off)
  }
}

const fits = new WeakMap<Text, Readonly<{ text: string; room: number; fit: string }>>()

/** Shows `text` in `view`, cut with an ellipsis until it is no wider than `room`. The
 *  last cut is kept, so a label that has not changed is not measured again. */
const fitText = (view: Text, text: string, room: number): void => {
  const last = fits.get(view)
  if (last?.text === text && last.room === room) {
    view.text = last.fit
    return
  }
  view.text = text
  while (view.width > room && view.text.length > 2)
    view.text = `${view.text.slice(0, -2).trimEnd()}…`
  fits.set(view, { text, room, fit: view.text })
}

const label = (size: number, family: string, weight: '400' | '500' | '600' | '700' = '500') =>
  new Text({
    text: '',
    style: { fontFamily: family, fontSize: size, fontWeight: weight, fill: 0x16233d },
    resolution: 3,
  })

type RowTone = 'plain' | 'warn' | 'danger' | 'ok' | 'muted'
/** Row glyphs by key, so the per-frame digest stays a short string. */
const ROW_ICONS = {
  inbound: ArrowRightToLine,
  load: Gauge,
  latency: Timer,
  out: ArrowRightFromLine,
  stranded: Unplug,
  users: Users,
  apdex: Smile,
  requests: Activity,
  revenue: Banknote,
  drawer: Wallet,
  stripe: Check,
  sampling: ScanLine,
  kept: Archive,
  insight: Gem,
  stack: Layers,
  connections: Cable,
  hits: Target,
  lag: Hourglass,
  policy: Shuffle,
  logins: LogIn,
  cost: Coins,
  depth: ListOrdered,
  stored: HardDrive,
  blocked: ShieldBan,
  copies: Copy,
} as const

const FOOT_ICONS = {
  collect: HandCoins,
  auto: Check,
  empty: Inbox,
  replace: RotateCcw,
  max: ChevronsUp,
  resize: ChevronsUp,
  more: Plus,
} as const

type Row = Readonly<{
  glyph: keyof typeof ROW_ICONS
  name: string
  value: string
  tone?: RowTone
  bar?: number
  /** An Insight pool's icon, in its colour, in place of the row glyph. */
  pool?: InsightPool
  /** A brand mark in place of the row glyph. */
  logo?: StackLogoId
  /** A brand mark just before the value. */
  valueLogo?: StackLogoId
  /** Recent values, drawn as a sparkline under the row. */
  trend?: ReadonlyArray<number>
}>
type Footer = Readonly<{
  glyph: keyof typeof FOOT_ICONS
  text: string
  enabled: boolean
  tone: 'accent' | 'ok' | 'muted' | 'danger'
}>

const pct = (value: number): string => `${Math.round(value * 100)}%`

const outRate = (ledger: Ledger, id: string): number =>
  ledger.links.reduce((sum, link) => (link.from === id ? sum + link.rate : sum), 0)

const rowsOf = (
  game: Game,
  node: GameNode,
  ledger: Ledger,
  history: ReadonlyArray<number> = [],
): ReadonlyArray<Row> => {
  const own = ledger.nodes[node.id]
  if (!own) return []
  const inbound: Row = {
    glyph: 'inbound',
    name: 'Inbound',
    value: `${rate(own.inbound)}/s`,
    tone: own.dropped > 0.05 ? 'danger' : 'plain',
  }
  const capacity: Row = {
    glyph: 'load',
    name: 'Load',
    value:
      own.inbound > 0
        ? `${pct(Math.min(own.utilization, 9.99))} of ${rate(own.capacity)}/s`
        : 'idle',
    tone: own.utilization >= 0.9 ? 'danger' : own.utilization >= 0.7 ? 'warn' : 'plain',
    bar: Math.min(own.utilization, 1),
    ...(has(game, 'metrics') && history.length > 1 ? { trend: history } : {}),
  }
  const latency: Row = {
    glyph: 'latency',
    name: 'Latency',
    value: has(game, 'percentiles') ? `${ms(own.latency)} · p99 ${ms(own.p99)}` : ms(own.latency),
  }
  const out: Row = {
    glyph: own.stranded > 0.01 ? 'stranded' : 'out',
    name: own.stranded > 0.01 ? 'Stranded' : 'Out',
    value: own.stranded > 0.01 ? `${rate(own.stranded)}/s` : `${rate(outRate(ledger, node.id))}/s`,
    tone: own.stranded > 0.01 ? 'danger' : 'plain',
  }
  switch (node.type) {
    case 'users': {
      const target = eraOf(game).apdexTarget
      return [
        { glyph: 'users', name: 'Users', value: compact(game.users) },
        {
          glyph: 'apdex',
          name: 'Apdex',
          value: game.apdex.toFixed(2),
          tone: game.apdex >= target ? 'ok' : 'danger',
        },
        { glyph: 'requests', name: 'Requests', value: `${rate(ledger.demand)}/s` },
      ]
    }
    case 'payments': {
      const size = drawerSize(game, ledger.revenue)
      return [
        { glyph: 'revenue', name: 'Revenue', value: `${money(ledger.revenue)}/s`, tone: 'ok' },
        {
          glyph: has(game, 'stripe') ? 'stripe' : 'drawer',
          name: has(game, 'stripe') ? 'Stripe' : 'Drawer',
          value: has(game, 'stripe') ? 'auto' : `${money(game.pending)} / ${money(size)}`,
          tone: game.pending >= size * 0.98 ? 'warn' : 'plain',
          bar: has(game, 'stripe') ? 0 : game.pending / size,
        },
      ]
    }
    case 'analytics': {
      const sampled = Math.min(own.inbound, own.capacity)
      return [
        { glyph: 'sampling', name: 'Sampling', value: `${rate(own.inbound)}/s` },
        {
          glyph: 'kept',
          name: 'Kept',
          value: `${rate(sampled)} / ${rate(own.capacity)}`,
          tone: own.inbound > own.capacity ? 'warn' : 'plain',
          bar: own.capacity > 0 ? Math.min(1, own.inbound / own.capacity) : 0,
        },
        // The three pools it earns most, each with its own icon.
        ...POOL_ORDER.filter((pool) => ledger.insight[pool] > 0)
          .toSorted((a, b) => ledger.insight[b] - ledger.insight[a])
          .slice(0, 3)
          .map((pool): Row => ({
            glyph: 'insight',
            pool,
            name: POOLS[pool].label,
            value: `+${ledger.insight[pool].toFixed(1)}/s`,
            tone: 'ok',
          })),
      ]
    }
    case 'server': {
      const runtime = RUNTIMES[node.runtime]
      const framework = node.framework === 'none' ? null : node.framework
      return [
        inbound,
        capacity,
        {
          glyph: 'stack',
          logo: runtime.language,
          name: runtime.name,
          value: framework ? FRAMEWORKS[framework].name : '—',
          ...(framework ? { valueLogo: framework } : { tone: 'muted' }),
        },
        latency,
        out,
      ]
    }
    case 'database':
    case 'replica': {
      const pool = own.connections
      return [
        inbound,
        capacity,
        {
          glyph: 'connections',
          name: 'Connections',
          value: pool ? `${Math.round(pool.used)} / ${pool.max}` : '—',
          tone:
            pool && pool.used > pool.max
              ? 'danger'
              : pool && pool.used > pool.max * 0.8
                ? 'warn'
                : 'plain',
        },
        latency,
        ...(own.lag === null ? [] : [{ glyph: 'lag', name: 'Lag', value: ms(own.lag) } as const]),
      ]
    }
    case 'cache':
      return [
        inbound,
        { glyph: 'hits', name: 'Hit ratio', value: pct(own.hitRatio ?? 0), bar: own.hitRatio ?? 0 },
        latency,
        out,
      ]
    case 'pooler':
      return [inbound, capacity, latency, out]
    case 'lb':
      return [
        inbound,
        capacity,
        { glyph: 'policy', name: 'Policy', value: LB_POLICIES[node.policy].label },
        out,
      ]
    case 'dns':
      return [inbound, { glyph: 'policy', name: 'Policy', value: 'round robin' }, out]
    case 'auth':
      return [
        { glyph: 'logins', name: 'Logins', value: `${rate(own.inbound)}/s` },
        { glyph: 'cost', name: 'Cost', value: `${money(burnOf(game, node))}/s` },
        latency,
      ]
    case 'search':
      return [inbound, capacity, latency]
    case 'storage':
      return [
        inbound,
        { glyph: 'stored', name: 'Stored', value: `${compact(game.stored)} GB` },
        { glyph: 'cost', name: 'Cost', value: `${money(burnOf(game, node))}/s` },
      ]
    case 'queue':
      return [
        inbound,
        {
          glyph: 'depth',
          name: 'Depth',
          value: compact(Math.round(node.depth)),
          tone: node.depth >= 1_000 ? 'danger' : node.depth >= 100 ? 'warn' : 'plain',
        },
        capacity,
        out,
      ]
    case 'worker': {
      const runtime = RUNTIMES[node.runtime]
      const framework = node.framework === 'none' ? null : node.framework
      return [
        inbound,
        capacity,
        {
          glyph: 'stack',
          logo: runtime.language,
          name: runtime.name,
          value: framework ? FRAMEWORKS[framework].name : '—',
          ...(framework ? { valueLogo: framework } : { tone: 'muted' }),
        },
      ]
    }
    case 'cdn':
      return [
        inbound,
        { glyph: 'hits', name: 'Hit ratio', value: pct(own.hitRatio ?? 0), bar: own.hitRatio ?? 0 },
        out,
      ]
    case 'waf':
      return [
        inbound,
        capacity,
        {
          glyph: 'blocked',
          name: 'Paranoia',
          value: node.underAttack ? 'under attack' : `level ${node.paranoia}`,
          tone: node.underAttack ? 'warn' : 'plain',
        },
        out,
      ]
    case 'psp':
      return [
        { ...inbound, name: 'Checkouts' },
        latency,
        { glyph: 'cost', name: 'Fees', value: `${money(ledger.fees)}/s` },
      ]
    case 'autoscaler': {
      const members = membersOf(game, node)
      const copies = members.reduce((total, member) => total + member.replicas, 0)
      const pending = members.reduce((total, member) => total + member.pending, 0)
      return [
        {
          glyph: 'copies',
          name: 'Copies',
          value: members.length === 0 ? '—' : pending > 0 ? `${copies} +${pending}` : `${copies}`,
          tone: members.length === 0 ? 'muted' : pending > 0 ? 'warn' : 'plain',
        },
        {
          glyph: 'load',
          name: 'Target',
          value: `${node.signal === 'cpu' ? 'CPU' : 'load'} ${pct(node.target)}`,
        },
        {
          glyph: 'policy',
          name: 'Range',
          value: `${node.minCopies}–${node.maxCopies > 0 ? node.maxCopies : '∞'}`,
        },
      ]
    }
    case 'cluster': {
      const members = membersOf(game, node)
      return [
        { glyph: 'copies', name: 'Members', value: `${members.length}` },
        {
          glyph: 'cost',
          name: 'Burn',
          value: `${money(members.reduce((total, member) => total + burnOf(game, member), 0))}/s`,
        },
      ]
    }
    case 'warehouse':
      return [
        { ...inbound, name: 'Scans' },
        latency,
        {
          glyph: 'cost',
          name: 'Cost',
          value: `${money((own.inbound - own.dropped) * SCAN_PRICE * eraOf(game).costIndex)}/s`,
        },
      ]
    case 'gpu':
      return [
        { ...inbound, name: 'Prompts' },
        capacity,
        { glyph: 'stack', name: 'GPU', value: GPU_TYPES[node.gpu].name },
        { glyph: 'cost', name: 'Cost', value: `${money(burnOf(game, node))}/s` },
      ]
    case 'llm':
      return [{ ...inbound, name: 'Prompts' }, capacity, latency]
    case 'msgp':
      return [
        { ...inbound, name: 'Messages' },
        capacity,
        {
          glyph: 'cost',
          name: 'Cost',
          value: `${money((own.inbound - own.dropped) * MSGP_PRICE * eraOf(game).costIndex)}/s`,
        },
      ]
    case 'wide':
      return [
        inbound,
        capacity,
        {
          glyph: 'policy',
          name: 'Quorum',
          value: `N${node.n} R${node.r} W${node.w}`,
          tone: node.r + node.w > node.n ? 'plain' : 'warn',
        },
        latency,
      ]
    case 'dsql':
      return [inbound, capacity, latency]
  }
}

/** The App Servers and Workers linked into a control Node. */
const membersOf = (game: Game, node: GameNode): ReadonlyArray<GameNode> =>
  game.nodes.filter((entry) =>
    game.links.some((link) => link.from === entry.id && link.to === node.id),
  )

/** A Node's size as pips: the current size of all sizes, or null for a Component without sizes. */
const sizePips = (node: GameNode): Readonly<{ filled: number; total: number }> | null => {
  const def = COMPONENTS[node.type]
  if (def.sized) return { filled: node.size + 1, total: SIZES.length }
  return def.steps > 1 ? { filled: node.size, total: def.steps } : null
}

/** The header's right label, before the size pips: the copies, and the zone once zones are researched. */
const levelOf = (game: Game, node: GameNode, region: Region | null = null): string => {
  const copies =
    `${node.replicas > 1 ? `×${node.replicas}` : ''}${node.pending > 0 ? ` +${node.pending}` : ''}`.trim()
  // A standby sits in the next zone over.
  const standby = ZONES[(ZONES.indexOf(node.zone) + 1) % ZONES.length] ?? ''
  const zone =
    has(game, 'multi-az') && zoned(node)
      ? `${node.zone.toUpperCase()}${node.standby ? `+${standby.toUpperCase()}` : ''}`
      : ''
  // A Node from another region shows where it is and the round trip to reach it.
  const remote =
    region !== null && node.region !== region && !isGlobal(node) && !node.spread
      ? `${REGION_INFO[node.region].short} ${rttOf(region, node.region)} ms`
      : node.spread && (node.type === 'wide' || node.type === 'dsql')
        ? 'Spread'
        : ''
  return [remote, zone, copies].filter(Boolean).join(' · ')
}

const footerOf = (game: Game, node: GameNode): Footer | null => {
  if (!layoutOf(node.type).footer) return null
  if (node.type === 'payments') {
    if (has(game, 'stripe'))
      return { glyph: 'auto', text: 'Collected automatically', enabled: false, tone: 'muted' }
    return game.pending >= 0.01
      ? { glyph: 'collect', text: `Collect  ${money(game.pending)}`, enabled: true, tone: 'ok' }
      : { glyph: 'empty', text: 'Drawer empty', enabled: false, tone: 'muted' }
  }
  if (node.down === -1) {
    const price = replacePrice(game, node)
    return {
      glyph: 'replace',
      text: `Replace  ${priceLabel(game.sandbox, price)}`.trim(),
      enabled: game.cash >= price,
      tone: 'danger',
    }
  }
  const price = resizePrice(game, node)
  if (price === null) return { glyph: 'max', text: 'Largest size', enabled: false, tone: 'muted' }
  const analytics = node.type === 'analytics'
  return {
    glyph: analytics ? 'more' : 'resize',
    text: analytics
      ? `More samples  ${priceLabel(game.sandbox, price)}`.trim()
      : `Resize to ${sizeLabel(node, node.size + 1)}  ${priceLabel(game.sandbox, price)}`.trim(),
    enabled: game.cash >= price,
    tone: game.cash >= price ? 'accent' : 'muted',
  }
}

/** The smallest zoom Fit uses, so card text stays readable. */
const MIN_FIT_SCALE = 0.85
/** A phone has pinch-zoom, so fit may go smaller to show the whole Design. */
const MIN_FIT_SCALE_PHONE = 0.7

class NodeView {
  readonly root = new Container()
  /** A deeper shadow, shown while the card is lifted. */
  private readonly shadow = new Graphics()
  /** The selection ring, outside the card's edge. */
  private readonly ring = new Graphics()
  private readonly frame = new Graphics()
  /** The medallion and status mark, over the card's edge. */
  private readonly medal = new Graphics()
  private readonly bars = new Graphics()
  private readonly ports = new Graphics()
  private readonly mark = glyph(12)
  private readonly title = label(15, SANS, '700')
  private readonly level = label(10.5, MONO)
  private readonly glyphs: Array<Sprite> = []
  private readonly names: Array<Text> = []
  private readonly values: Array<Text> = []
  private readonly valueMarks: Array<Sprite> = []
  private readonly foot = label(12, SANS, '600')
  private readonly footMark = glyph(14)
  private digest = ''
  /** What each layer was last drawn for. */
  private frameKey = ''
  private medalKey = ''
  private barsKey = ''
  private stranded: boolean | null = null
  private shadowDrawn = false
  /** Seconds since the card arrived; Infinity when it was already on the board. */
  private age = Number.POSITIVE_INFINITY
  /** Seconds into the exit, or -1 while the Node lives. */
  private leaving = -1

  private readonly group: BuildGroup
  private readonly height: number
  /** Where the card is drawn. It follows its Node, so a move, a drop on the grid
   *  and an undo glide instead of jumping. */
  at: Pt | null = null
  private target: Pt = { x: 0, y: 0 }
  /** Picked up by a drag: the card rises, grows a little and casts a deeper shadow. */
  lifted = false
  private lift = 0
  /** Pressed: the card sinks a little under the pointer. */
  held = false
  private hold = 0
  private selected = false
  /** Off the focused path: the card fades back. */
  dim = false
  private selection = 0
  private accent = 0

  constructor(
    readonly type: ComponentId,
    enter: boolean,
  ) {
    const layout = layoutOf(type)
    this.group = COMPONENTS[type].group
    this.height = heightOf(type)
    // Scale around the card's center, so it grows in place.
    this.root.pivot.set(CARD_W / 2, this.height / 2)
    if (enter) {
      this.age = 0
      this.root.alpha = 0
      if (!reducedMotion()) this.root.scale.set(0.96)
    }
    this.shadow.alpha = 0
    this.root.addChild(
      this.shadow,
      this.ring,
      this.frame,
      this.bars,
      this.ports,
      this.medal,
      this.mark,
      this.title,
      this.level,
      this.foot,
      this.footMark,
    )
    const glyphSize = badgeGlyph(this.group, BADGE_R)
    this.mark.setSize(glyphSize)
    this.mark.position.set(BADGE_X - glyphSize / 2, BADGE_Y - glyphSize / 2)
    this.title.anchor.set(0, 0.5)
    this.title.position.set(TITLE_X, HEAD / 2)
    this.level.anchor.set(1, 0.5)
    for (let index = 0; index < layout.rows; index += 1) {
      const mark = glyph(13)
      const name = label(11, SANS, '500')
      const value = label(11, MONO, '500')
      name.anchor.set(0, 0.5)
      value.anchor.set(1, 0.5)
      mark.position.set(13, rowMid(index) - 7.5)
      name.position.set(32, rowMid(index) - 1)
      value.position.set(CARD_W - 14, rowMid(index) - 1)
      const valueMark = glyph(13)
      valueMark.visible = false
      this.glyphs.push(mark)
      this.names.push(name)
      this.values.push(value)
      this.valueMarks.push(valueMark)
      this.root.addChild(mark, name, value, valueMark)
    }
    this.foot.anchor.set(0, 0.5)
  }

  leave(): void {
    this.leaving = 0
  }

  /** Entrance 200ms and exit 150ms on --ease-out, from 0.96 scale; the follow,
   *  lift, press and selection ring on top. False once the exit ends. */
  tick(seconds: number, still: boolean): boolean {
    let scale = 1
    if (this.leaving >= 0) {
      this.leaving += seconds
      const t = easeOut(Math.min(1, this.leaving / EXIT_S))
      this.root.alpha = 1 - t
      scale = 1 - 0.04 * t
    } else if (this.age < ENTER_S) {
      this.age += seconds
      const t = easeOut(Math.min(1, this.age / ENTER_S))
      this.root.alpha = t
      scale = 0.96 + 0.04 * t
    }
    if (this.leaving < 0 && this.age >= ENTER_S)
      this.root.alpha += ((this.dim ? DIM : 1) - this.root.alpha) * follow(seconds, 16, still)
    // A held card stays under the pointer; a released one eases into its grid cell.
    const at = this.at ?? this.target
    const k = follow(seconds, this.lifted ? 38 : 16, still)
    const x = at.x + (this.target.x - at.x) * k
    const y = at.y + (this.target.y - at.y) * k
    this.at = {
      x: Math.abs(this.target.x - x) < 0.1 ? this.target.x : x,
      y: Math.abs(this.target.y - y) < 0.1 ? this.target.y : y,
    }
    this.root.position.set(this.at.x + CARD_W / 2, this.at.y + this.height / 2)
    this.lift += ((this.lifted ? 1 : 0) - this.lift) * follow(seconds, 20, still)
    this.hold += ((this.held ? 1 : 0) - this.hold) * follow(seconds, 32, still)
    this.shadow.alpha = this.lift
    if (!still) scale *= 1 + 0.03 * this.lift - 0.02 * this.hold
    this.root.scale.set(still ? 1 : scale)
    // Selection: the ring closes in from a little way out and comes up to full strength.
    const selection =
      this.selection + ((this.selected ? 1 : 0) - this.selection) * follow(seconds, 24, still)
    if (Math.abs(selection - this.selection) > 0.001) {
      this.selection =
        Math.abs(selection - (this.selected ? 1 : 0)) < 0.01 ? (this.selected ? 1 : 0) : selection
      this.drawRing()
    }
    return this.leaving < EXIT_S
  }

  private drawRing(): void {
    const e = this.selection
    this.ring.clear()
    this.ring.alpha = e
    if (e <= 0) return
    const pad = 2.5 + 5 * (1 - e)
    silhouette(this.ring, this.group, 0, 0, CARD_W, this.height, pad + 2).fill({
      color: this.accent,
      alpha: 0.07,
    })
    silhouette(this.ring, this.group, 0, 0, CARD_W, this.height, pad).stroke({
      color: this.accent,
      width: 2,
    })
  }

  update(
    game: Game,
    node: GameNode,
    ledger: Ledger,
    selected: boolean,
    pressed: boolean,
    colors: Palette,
    history: ReadonlyArray<number>,
    region: Region | null,
  ): void {
    const own = ledger.nodes[node.id]
    if (!own) return
    const def = COMPONENTS[node.type]
    const layout = layoutOf(node.type)
    const rows = rowsOf(game, node, ledger, history)
    const footer = footerOf(game, node)
    this.target = { x: node.x, y: node.y }
    this.at ??= this.target
    if (this.selected !== selected || this.accent !== colors.accent) {
      this.selected = selected
      this.accent = colors.accent
      this.drawRing()
    }
    const digest = JSON.stringify([
      pressed,
      rows,
      footer,
      node.size,
      own.status,
      selected,
      Math.ceil(node.down),
      node.warm < 1,
      levelOf(game, node, region),
    ])
    if (digest === this.digest) return
    this.digest = digest

    const height = heightOf(node.type)
    const toneOf = (tone: RowTone | undefined) =>
      tone === 'danger'
        ? colors.danger
        : tone === 'warn'
          ? colors.warn
          : tone === 'ok'
            ? colors.ok
            : tone === 'muted'
              ? colors.muted
              : colors.ink
    const status =
      own.status === 'down' || own.status === 'danger'
        ? colors.danger
        : own.status === 'warn'
          ? colors.warn
          : own.status === 'ok'
            ? colors.ok
            : colors.border
    // Selection is the ring outside the card (drawRing), so the edge keeps its status.
    const edge = own.status === 'danger' || own.status === 'down' ? colors.danger : colors.border

    const group = this.group
    const hue = colors.groups[group]
    const badgeTone = node.down === -1 ? colors.muted : hue
    const rect = footerRect(node.type)
    const sink = footer && pressed && footer.enabled && footer.tone !== 'muted' ? 2 : 0
    // Each layer is redrawn only when what it shows changes; values change every tick.
    const frameKey = `${edge}:${node.down !== 0}:${footer?.tone}:${sink}:${selected}`
    if (frameKey !== this.frameKey) {
      this.frameKey = frameKey
      this.frame.clear()
      // Depth: a wide soft shadow and a tight contact shadow under the card.
      silhouette(this.frame, group, 1, 3, CARD_W - 2, height).fill({
        color: colors.ink,
        alpha: 0.035,
      })
      silhouette(this.frame, group, 0, 1, CARD_W, height).fill({ color: colors.ink, alpha: 0.05 })
      silhouette(this.frame, group, 0, 0, CARD_W, height).fill(colors.card)
      headerBand(this.frame, group, hue, colors)
      for (let index = 1; index < layout.rows; index += 1) {
        this.frame
          .moveTo(10, rowTop(index))
          .lineTo(CARD_W - 10, rowTop(index))
          .stroke({ color: colors.border, width: 1, alpha: 0.55 })
      }
      if (node.down !== 0)
        silhouette(this.frame, group, 0, 0, CARD_W, height).fill({
          color: colors.danger,
          alpha: 0.07,
        })
      if (footer) {
        const fill =
          footer.tone === 'ok'
            ? colors.ok
            : footer.tone === 'danger'
              ? colors.danger
              : footer.tone === 'accent'
                ? colors.accent
                : colors.track
        const { x, y, w, h } = rect
        if (footer.tone === 'muted') {
          // Disabled: sunk into the card instead of raised.
          this.frame.roundRect(x, y + 1, w, h, 8).fill(fill)
          this.frame
            .roundRect(x, y + 1, w, h, 8)
            .stroke({ color: colors.ink, width: 1, alignment: 1, alpha: 0.06 })
          this.frame
            .moveTo(x + 8, y + 1.5)
            .lineTo(x + w - 8, y + 1.5)
            .stroke({ color: colors.ink, width: 1, alpha: 0.06 })
        } else {
          const top = footer.tone === 'accent' ? colors.fillTop : mix(fill, 0xffffff, 0.16)
          const bottom = footer.tone === 'accent' ? colors.fillBottom : mix(fill, 0x000000, 0.08)
          // Raised: soft drop, a darker lip, a top-lit body and a glossy top edge.
          // Pressed, the body sinks onto its lip and the drop shadow goes.
          const lifted = y + sink
          if (!sink)
            this.frame.roundRect(x, y + 3, w, h, 8).fill({ color: colors.ink, alpha: 0.12 })
          this.frame.roundRect(x, y + 2, w, h, 8).fill(mix(bottom, 0x000000, 0.28))
          this.frame.roundRect(x, lifted, w, h, 8).fill(gradient(top, bottom))
          this.frame
            .roundRect(x, lifted, w, h, 8)
            .stroke({ color: mix(bottom, 0x000000, 0.3), width: 1, alignment: 1, alpha: 0.7 })
          this.frame
            .moveTo(x + 8, lifted + 1.5)
            .lineTo(x + w - 8, lifted + 1.5)
            .stroke({ color: 0xffffff, width: 1, alpha: 0.28 })
        }
      }
      silhouette(this.frame, group, 0, 0, CARD_W, height).stroke({
        color: edge,
        width: 1,
        alignment: 1,
        alpha: 0.8,
      })
      // The selection is the board's focus: a ring outside the card, as on a focused control.
      if (selected)
        silhouette(this.frame, group, 0, 0, CARD_W, height, 4).stroke({
          color: colors.accent,
          width: 2.5,
          alpha: 0.55,
        })
    }
    if (footer) {
      const { x, y, w, h } = rect
      const ink =
        footer.tone === 'muted' ? colors.muted : footer.tone === 'accent' ? colors.onFill : 0xffffff
      this.foot.text = footer.text
      // Center the glyph and text together.
      const start = x + (w - (14 + 6 + this.foot.width)) / 2
      const mid = y + h / 2 + (footer.tone === 'muted' ? 1 : sink)
      paint(this.footMark, FOOT_ICONS[footer.glyph], ink)
      this.footMark.position.set(start, mid - 7)
      this.footMark.visible = true
      this.foot.position.set(start + 20, mid)
      this.foot.style.fill = ink
    } else {
      this.foot.text = ''
      this.footMark.visible = false
    }
    // The lifted shadow: drawn once, faded in by the lift.
    if (!this.shadowDrawn) {
      this.shadowDrawn = true
      silhouette(this.shadow, group, 6, 18, CARD_W - 12, height - 6, 10).fill({
        color: colors.ink,
        alpha: 0.05,
      })
      silhouette(this.shadow, group, 2, 9, CARD_W - 4, height - 2, 3).fill({
        color: colors.ink,
        alpha: 0.08,
      })
    }
    // Status is a shape as well as a colour: a dot, a triangle, a square, a cross. It sits
    // on the medallion's corner, on a disc of the card's colour.
    const medalKey = `${badgeTone}:${own.status}`
    if (medalKey !== this.medalKey) {
      this.medalKey = medalKey
      this.medal.clear()
      medallion(this.medal, group, badgeTone, colors)
      if (status !== colors.border) {
        const sx = BADGE_X + 15
        const sy = BADGE_Y + 15
        this.medal.circle(sx, sy, 6).fill(colors.card)
        if (own.status === 'ok') this.medal.circle(sx, sy, 3.5).fill(status)
        else if (own.status === 'warn')
          this.medal.poly([sx, sy - 4, sx + 4.2, sy + 3.2, sx - 4.2, sy + 3.2]).fill(status)
        else if (own.status === 'danger') this.medal.rect(sx - 3.3, sy - 3.3, 6.6, 6.6).fill(status)
        else
          this.medal
            .moveTo(sx - 3.5, sy - 3.5)
            .lineTo(sx + 3.5, sy + 3.5)
            .moveTo(sx + 3.5, sy - 3.5)
            .lineTo(sx - 3.5, sy + 3.5)
            .stroke({ color: status, width: 2.2, cap: 'round' })
      }
    }

    paint(this.mark, COMPONENT_ICONS[node.type], 0xffffff)
    const title =
      node.down === -1
        ? `${def.name} · failed`
        : node.down > 0
          ? `${def.name} · restart`
          : node.warm < 1 && (def.sized || node.type === 'cache')
            ? `${def.name} · cold`
            : def.name
    this.title.style.fill = node.down !== 0 ? colors.danger : colors.ink
    const size = sizePips(node)
    const barsKey = JSON.stringify([size, badgeTone, rows.map((row) => row.trend ?? row.bar)])
    const bars = barsKey !== this.barsKey
    this.barsKey = barsKey
    if (bars) this.bars.clear()
    // Right to left: the size pips, then the zone and copies, then the title takes the rest.
    let right = CARD_W - 12
    if (size) {
      const width = pipsWidth(size.total)
      if (bars)
        pips(
          this.bars,
          right - width,
          HEAD / 2 - 4.5,
          size.filled,
          size.total,
          badgeTone,
          colors.well,
        )
      right -= width + 7
    }
    this.level.text = levelOf(game, node, region)
    this.level.style.fill = colors.muted
    this.level.position.set(right, HEAD / 2)
    if (this.level.text) right -= this.level.width + 8
    // A long title gives way to the level: it is cut with an ellipsis before the two touch.
    fitText(this.title, title, right - 4 - this.title.x)

    rows.forEach((row, index) => {
      const mark = this.glyphs[index]
      const name = this.names[index]
      const value = this.values[index]
      const valueMark = this.valueMarks[index]
      if (!mark || !name || !value || !valueMark) return
      if (row.logo) paintLogo(mark, row.logo, colors.ink)
      else if (row.pool) paint(mark, POOL_ICONS[row.pool], POOLS[row.pool].color)
      else paint(mark, ROW_ICONS[row.glyph], colors.muted)
      name.style.fill = row.logo ? colors.ink : colors.muted
      value.text = row.value
      value.style.fill = toneOf(row.tone)
      // A long name gives way to the value: it is cut with an ellipsis before the two touch.
      fitText(name, row.name, value.x - value.width - (row.valueLogo ? 22 : 0) - 10 - name.x)
      valueMark.visible = row.valueLogo !== undefined
      if (row.valueLogo) {
        paintLogo(valueMark, row.valueLogo, colors.ink)
        valueMark.position.set(value.x - value.width - 18, rowMid(index) - 7.5)
      }
      if (!bars) return
      if (row.trend) {
        // Load over the last day: a sparkline in place of the bar.
        const bottom = rowTop(index) + ROW - 1
        const width = CARD_W - 28
        const points = row.trend
        const at = (i: number) => {
          const x = 14 + (width * i) / (points.length - 1)
          return [x, bottom - 6 * Math.min(1, points[i] ?? 0)] as const
        }
        const [x0, y0] = at(0)
        this.bars.moveTo(x0, y0)
        for (let i = 1; i < points.length; i += 1) this.bars.lineTo(...at(i))
        const peak = Math.max(...points)
        this.bars.stroke({
          color: peak > 0.95 ? colors.danger : peak > 0.8 ? colors.warn : colors.accent,
          width: 1.25,
        })
      } else if (row.bar !== undefined) {
        const y = rowTop(index) + ROW - 4
        const tone = row.bar > 0.95 ? colors.danger : row.bar > 0.8 ? colors.warn : colors.accent
        const share = Math.max(0, Math.min(1, row.bar))
        this.bars.roundRect(14, y, CARD_W - 28, 3, 1.5).fill(colors.well)
        if (share > 0)
          this.bars.roundRect(14, y, Math.max(3, (CARD_W - 28) * share), 3, 1.5).fill(tone)
      }
    })

    const stranded = own.stranded > 0.01
    if (stranded === this.stranded) return
    this.stranded = stranded
    this.ports.clear()
    if (layout.inRow !== null) {
      const y = rowMid(layout.inRow)
      this.ports.circle(0, y, PORT_R).fill(colors.card).stroke({ color: colors.edge, width: 1.5 })
      this.ports.circle(0, y, 2).fill(colors.edge)
    }
    if (layout.outRow !== null) {
      const y = rowMid(layout.outRow)
      this.ports
        .circle(CARD_W, y, PORT_R)
        .fill(stranded ? colors.danger : colors.groups[this.group])
      this.ports.circle(CARD_W, y, 2).fill(colors.card)
    }
  }
}

/* ---------- one belt ---------- */

/**
 * One link's belt, in three layers so belts stack as they always have: a later belt
 * covers an earlier one's chevrons where they share a trunk. The body and the mouths
 * are redrawn only when their path or colours change; the chevrons only while they move.
 */
/** How far a card or belt off the focused path fades. */
const DIM = 0.3

class BeltView {
  readonly root = new Container()
  private readonly body = new Graphics()
  private readonly chevrons = new Graphics()
  private readonly mouths = new Graphics()
  private bodyFor: unknown = null
  private bodyKey = ''
  private chevronsFor: unknown = null
  private chevronsKey = ''

  constructor() {
    // Moving chevrons change every frame. In a render group of their own, a change
    // rebuilds only them, not every belt's batches.
    const moving = new Container({ isRenderGroup: true })
    moving.addChild(this.chevrons)
    this.root.addChild(this.body, moving, this.mouths)
  }

  draw(
    pieces: ReadonlyArray<Route>,
    rail: number,
    body: number,
    busy: boolean,
    chevron: number,
    offset: number,
  ): void {
    const key = `${rail}:${body}:${busy}`
    if (pieces !== this.bodyFor || key !== this.bodyKey) {
      this.bodyFor = pieces
      this.bodyKey = key
      this.body.clear()
      for (const piece of pieces) traceOf(this.body, piece)
      this.body.stroke({ color: rail, width: BELT + 3, join: 'round', alpha: busy ? 0.9 : 0.6 })
      for (const piece of pieces) traceOf(this.body, piece)
      this.body.stroke({ color: body, width: BELT, join: 'round' })
      // The mouths where the belt dips under another one.
      this.mouths.clear()
      pieces.forEach((piece, index) => {
        const ends = [
          index > 0 ? piece[0] : undefined,
          index < pieces.length - 1 ? piece.at(-1) : undefined,
        ]
        for (const end of ends)
          if (end)
            this.mouths.moveTo(end.x - BELT / 2 - 2.5, end.y).lineTo(end.x + BELT / 2 + 2.5, end.y)
      })
      this.mouths.stroke({ color: rail, width: 3, cap: 'round' })
    }
    // Chevrons point the way the belt runs, and move with it.
    const step = ((offset % CHEVRON_GAP) + CHEVRON_GAP) % CHEVRON_GAP
    const chevronKey = `${chevron}:${busy}:${step}`
    if (pieces === this.chevronsFor && chevronKey === this.chevronsKey) return
    this.chevronsFor = pieces
    this.chevronsKey = chevronKey
    this.chevrons.clear()
    for (const piece of pieces)
      walk(piece, CHEVRON_GAP, offset, (point, ux, uy) => {
        this.chevrons
          .moveTo(
            point.x - uy * CHEVRON_HALF - ux * CHEVRON_DEPTH,
            point.y + ux * CHEVRON_HALF - uy * CHEVRON_DEPTH,
          )
          .lineTo(point.x, point.y)
          .lineTo(
            point.x + uy * CHEVRON_HALF - ux * CHEVRON_DEPTH,
            point.y - ux * CHEVRON_HALF - uy * CHEVRON_DEPTH,
          )
      })
    this.chevrons.stroke({ color: chevron, width: 1.2, alpha: busy ? 0.9 : 0.5 })
  }
}

/* ---------- the controller ---------- */

type Gesture =
  /** `cut` is the link under a finger that went down on it: a tap cuts it, a drag only pans. */
  | {
      kind: 'pan'
      x: number
      y: number
      moved: boolean
      cut: Readonly<{ from: string; to: string }> | null
    }
  | { kind: 'node'; id: string; dx: number; dy: number; x: number; y: number; moved: boolean }
  | { kind: 'link'; from: string; at: Pt }
  | { kind: 'box'; from: Pt; at: Pt }
  | null

class BoardController {
  private readonly app = new Application()
  private readonly world = new Container()
  private readonly grid = new Graphics()
  private gridKey = ''
  /** The belts, one BeltView per link in the Model's order, under the splitters. */
  private readonly wires = new Container()
  private readonly belts = new Map<string, BeltView>()
  private beltLinks: ReadonlyArray<unknown> = []
  private beltOrder = ''
  private readonly splitters = new Graphics()
  private splittersKey = ''
  private readonly packets = new Graphics()
  private readonly cards = new Container()
  private readonly overlay = new Graphics()
  private readonly bottleneckTag = label(9, MONO, '600')
  private readonly ghost = new Container()
  private readonly views = new Map<string, NodeView>()
  /** Cards fading out after their Node left the Design. */
  private leaving: Array<NodeView> = []
  /** False until the first sync, so a loaded board does not animate in. */
  private seeded = false
  /** The Node whose card button is held down. */
  private pressed: string | null = null
  private state: BoardState | null = null
  private gesture: Gesture = null
  private hoverLink: Readonly<{ from: string; to: string }> | null = null
  /** The link a click picked: Delete or its × badge cuts it. A click never cuts by itself. */
  private selectedLink: Readonly<{ from: string; to: string }> | null = null
  /** The Node under the pointer: with the selected one, it lights its whole path. */
  private hoverNode: string | null = null
  private pointer: Pt = { x: 0, y: 0 }
  /** Fingers and pens on the board, in client coordinates. Two of them pinch. */
  private readonly touches = new Map<number, Pt>()
  private pinch: Readonly<{ distance: number; center: Pt }> | null = null
  /** The last pointer to move was a finger or a pen, which has no hover and a wide tip. */
  private coarse = false
  /** Local positions while a node is dragged, ahead of the Model. */
  private dragged: Readonly<{ id: string; x: number; y: number }> | null = null
  private droppedAt = 0
  /** Where the held card, new Node or Playbook lands: the nearest spot that keeps clear. */
  private landing: Pt | null = null
  private landingKey = ''
  /** Routed links for the Model's positions, and the Design they were routed for. */
  private routed = new Map<string, Wire>()
  private routedFor = ''
  /** The Game the routes and `modelNodes` were last checked against. */
  private routedGame: Game | null = null
  /** The Model's Nodes by id, where they are in the Design (not where they are drawn). */
  private modelNodes = new Map<string, GameNode>()
  private ghostType: ComponentId | null = null
  /** The drawn end of a wire being pulled. It eases onto a port it snaps to. */
  private wireEnd: Pt | null = null
  /** The Node a pulled wire is snapped to, and how far its highlight has come in. */
  private snapTo: string | null = null
  private snapGlow = 0
  /** A wire let go over nothing, drawing back into its port. */
  private retract: { path: Route; t: number } | null = null
  /** Links that just arrived, by key, with their age in seconds. */
  private readonly fresh = new Map<string, number>()
  /** The link the last wire drag asked for: it is already drawn, so it does not draw in. */
  private wired: string | null = null
  /** Links that just left, fading where they were. */
  private cuts: Array<{ path: Route; t: number }> = []
  private readonly abort = new AbortController()
  private readonly resize: ResizeObserver
  private phase = 0
  private started = false
  private fitted = false
  private destroyed = false

  constructor(
    private readonly host: HTMLElement,
    private readonly events: BoardEvents,
  ) {
    this.resize = new ResizeObserver(() => this.onResize())
  }

  async start(initial: BoardState | undefined): Promise<void> {
    this.state = initial ?? null
    await this.app.init({
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      width: Math.max(1, this.host.clientWidth),
      height: Math.max(1, this.host.clientHeight),
      preference: 'webgl',
    })
    await Promise.all([
      document.fonts.load('600 13px "Geist"'),
      document.fonts.load('500 10px "Geist Mono"'),
    ]).catch(() => undefined)
    if (this.destroyed) {
      this.app.destroy(true, { children: true })
      return
    }
    this.host.append(this.app.canvas)
    this.app.stage.addChild(this.grid, this.world)
    this.bottleneckTag.style.fill = 0xffffff
    this.bottleneckTag.visible = false
    this.world.addChild(
      this.wires,
      this.packets,
      this.cards,
      this.overlay,
      this.bottleneckTag,
      this.ghost,
    )
    // Pixi rebuilds a render group's batches whenever a Graphics in it changes. The
    // chevrons, packets and overlay change every frame, the cards on each tick: in
    // groups of their own, a frame does not repack every card.
    this.wires.isRenderGroup = true
    this.cards.isRenderGroup = true
    this.ghost.alpha = 0.55
    this.ghost.visible = false
    this.bindPointer()
    this.app.ticker.add((ticker) => this.animate(ticker.deltaMS / 1000))
    this.started = true
    this.resize.observe(this.host)
    this.onResize()
  }

  draw(state: BoardState): void {
    if (this.started && this.seeded) this.diffLinks(state)
    this.state = state
    const dragged = this.dragged
    if (dragged && this.gesture?.kind !== 'node') {
      const node = state.game.nodes.find((entry) => entry.id === dragged.id)
      // If the move was refused, the card goes back once the drop is old news.
      const stale = performance.now() - this.droppedAt > 250
      if (!node || (node.x === dragged.x && node.y === dragged.y) || stale) this.dragged = null
    }
    if (!this.started) return
    if (!this.fitted) this.fit()
    this.syncCards()
    this.syncGhost()
  }

  /** New links draw in from their port; removed ones fade where they were. */
  private diffLinks(next: BoardState): void {
    const keyOf = (link: Readonly<{ from: string; to: string }>) => `${link.from}>${link.to}`
    const before = this.state?.game.links ?? []
    const was = new Set(before.map(keyOf))
    const now = new Set(next.game.links.map(keyOf))
    for (const link of next.game.links) {
      const key = keyOf(link)
      if (was.has(key)) continue
      // A wire the player just drew is already on screen: it only glows.
      this.fresh.set(key, key === this.wired ? DRAW_IN_S : 0)
    }
    this.wired = null
    const shown = this.shown()
    for (const link of before) {
      if (now.has(keyOf(link))) continue
      const from = shown.get(link.from)
      const to = shown.get(link.to)
      if (from && to) this.cuts.push({ path: this.wireOf(from, to).path, t: 0 })
    }
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.abort.abort()
    this.resize.disconnect()
    if (this.started) this.app.destroy(true, { children: true })
  }

  /* ---------- camera ---------- */

  private onResize(): void {
    const { clientWidth: w, clientHeight: h } = this.host
    if (w === 0 || h === 0) return
    this.app.renderer.resize(w, h)
    if (!this.fitted) this.fit()
    this.drawGrid()
  }

  fit(): void {
    const nodes = this.state?.game.nodes ?? []
    const { clientWidth: w, clientHeight: h } = this.host
    if (nodes.length === 0 || w === 0 || h === 0) return
    const minX = Math.min(...nodes.map((node) => node.x)) - 80
    const minY = Math.min(...nodes.map((node) => node.y)) - 80
    const maxX = Math.max(...nodes.map((node) => node.x + CARD_W)) + 80
    const maxY = Math.max(...nodes.map((node) => node.y + heightOf(node.type))) + 80
    // Keep clear of the HUD above and the build dock below.
    const phone = isPhone()
    const short = matchMedia('(max-height: 499px)').matches
    const top = short ? 120 : phone ? 160 : 120
    const bottom = short ? 70 : phone ? 90 : 210
    const room = Math.max(1, h - top - bottom)
    // The stats panel sits on the left on desktop: keep cards out from under it.
    const left = phone || short ? 0 : 380
    const across = Math.max(1, w - left - 24)
    // Below this zoom the card text is too small to read; pan to see the rest.
    const scale = Math.max(
      phone ? MIN_FIT_SCALE_PHONE : MIN_FIT_SCALE,
      Math.min(1.1, Math.min(across / (maxX - minX), room / (maxY - minY))),
    )
    this.world.scale.set(scale)
    // A Design wider than the phone starts at its left edge, where the Users are.
    const x =
      phone && (maxX - minX) * scale > w
        ? -minX * scale
        : left + across / 2 - ((minX + maxX) / 2) * scale
    this.world.position.set(x, top + room / 2 - ((minY + maxY) / 2) * scale)
    this.fitted = true
    this.drawGrid()
  }

  /** The dots are drawn once per zoom and size, from the top-left corner; a pan only
   *  slides them by less than one step. */
  private drawGrid(): void {
    const { clientWidth: w, clientHeight: h } = this.host
    const step = 32 * this.world.scale.x
    const key = `${step}:${w}:${h}`
    if (key !== this.gridKey) {
      this.gridKey = key
      this.grid.clear()
      if (step < 8) return
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) this.grid.rect(x - 0.75, y - 0.75, 1.5, 1.5)
      }
      this.grid.fill(palette().grid)
    }
    if (step < 8) return
    this.grid.position.set(
      ((this.world.position.x % step) + step) % step,
      ((this.world.position.y % step) + step) % step,
    )
  }

  private toWorld(event: PointerEvent | WheelEvent): Pt {
    const rect = this.host.getBoundingClientRect()
    const local = this.world.toLocal(new Point(event.clientX - rect.left, event.clientY - rect.top))
    return { x: local.x, y: local.y }
  }

  /* ---------- hit tests ---------- */

  private nodes(): ReadonlyArray<GameNode> {
    const nodes = this.state?.game.nodes ?? []
    const dragged = this.dragged
    return dragged
      ? nodes.map((node) =>
          node.id === dragged.id ? { ...node, x: dragged.x, y: dragged.y } : node,
        )
      : nodes
  }

  /** The Nodes where their cards are drawn, so wires stay attached while cards glide. */
  private shown(): Map<string, GameNode> {
    return new Map(
      this.nodes().map((node) => {
        const at = this.views.get(node.id)?.at
        return [node.id, at ? { ...node, x: at.x, y: at.y } : node]
      }),
    )
  }

  private nodeAt(point: Pt): GameNode | null {
    return (
      this.nodes().findLast(
        (node) =>
          point.x >= node.x &&
          point.x <= node.x + CARD_W &&
          point.y >= node.y &&
          point.y <= node.y + heightOf(node.type),
      ) ?? null
    )
  }

  private outPortAt(point: Pt): GameNode | null {
    const reach = PORT_R + (this.coarse ? 16 : 6) / this.world.scale.x
    return (
      this.nodes().findLast((node) => {
        if (layoutOf(node.type).outRow === null) return false
        const port = outPort(node)
        return Math.hypot(port.x - point.x, port.y - point.y) <= reach
      }) ?? null
    )
  }

  private selectLink(link: Readonly<{ from: string; to: string }>): void {
    this.selectedLink = link
    this.events.onEmptyTap()
  }

  /** Whether the point is on the × badge in the middle of the selected link. */
  private onBadge(point: Pt): boolean {
    const link = this.selectedLink
    const from = link && this.shown().get(link.from)
    const to = link && this.shown().get(link.to)
    if (!from || !to) return false
    const mid = pointOn(this.wireOf(from, to).path, 0.5)
    return (
      Math.hypot(mid.x - point.x, mid.y - point.y) <= (this.coarse ? 16 : 11) / this.world.scale.x
    )
  }

  private linkAt(point: Pt): Readonly<{ from: string; to: string }> | null {
    const byId = new Map(this.nodes().map((node) => [node.id, node]))
    const reach = (this.coarse ? 14 : 7) / this.world.scale.x
    for (const link of this.state?.game.links ?? []) {
      const from = byId.get(link.from)
      const to = byId.get(link.to)
      if (!from || !to) continue
      if (distanceTo(this.wireOf(from, to).path, point) <= reach) return link
    }
    return null
  }

  /** Routes every link once per change to the Design, not once per frame. The key is
   *  built once per Game, since a Game is never changed in place. */
  private routes(): Map<string, Wire> {
    const game = this.state?.game
    if (!game || game === this.routedGame) return this.routed
    this.routedGame = game
    this.modelNodes = new Map(game.nodes.map((node) => [node.id, node]))
    const key = `${game.nodes.map((node) => `${node.id}:${node.type}:${node.x}:${node.y}`).join('|')}#${game.links.map((link) => `${link.from}>${link.to}`).join('|')}`
    if (key !== this.routedFor) {
      this.routedFor = key
      this.routed = routeLinks(game.nodes, game.links)
    }
    return this.routed
  }

  /**
   * A link's wire between Nodes where they are drawn. While either card is held
   * or gliding, the link takes the quick route; it is routed again once both settle.
   */
  private wireOf(from: GameNode, to: GameNode): Wire {
    const routes = this.routes()
    const settled = (node: GameNode) => {
      const entry = this.modelNodes.get(node.id)
      return entry !== undefined && entry.x === node.x && entry.y === node.y
    }
    const routed = settled(from) && settled(to) ? routes.get(`${from.id}>${to.id}`) : undefined
    if (routed) return routed
    const path = routeOf(from, to)
    return { path, pieces: [path], hops: [] }
  }

  private landingOf(dragged = this.gesture?.kind === 'node' ? this.dragged : null): Pt | null {
    const state = this.state
    if (!state) return null
    const pointer = { x: Math.round(this.pointer.x), y: Math.round(this.pointer.y) }
    const key = `${this.routedFor}/${dragged?.id}:${dragged?.x}:${dragged?.y}/${state.placing}/${state.stamp ? 'stamp' : ''}/${pointer.x}:${pointer.y}`
    if (key === this.landingKey) return this.landing
    this.landingKey = key
    const others = state.game.nodes.filter((node) => node.id !== dragged?.id).map(boxOf)
    const held = state.game.nodes.find((node) => node.id === dragged?.id)
    this.landing =
      dragged && held
        ? freeSpot(others, { x: dragged.x, y: dragged.y, w: CARD_W, h: heightOf(held.type) })
        : state.stamp
          ? freeSpot(others, {
              x: pointer.x,
              y: pointer.y,
              w: Math.max(...state.stamp.map((entry) => entry.dx)) + CARD_W,
              h: Math.max(...state.stamp.map((entry) => entry.dy + heightOf(entry.type))),
            })
          : state.placing
            ? freeSpot(others, {
                x: pointer.x - CARD_W / 2,
                y: pointer.y - heightOf(state.placing) / 2,
                w: CARD_W,
                h: heightOf(state.placing),
              })
            : null
    return this.landing
  }

  /* ---------- pointer ---------- */

  /** The two fingers on the board: how far apart, and where between them. */
  private pinchOf(): Readonly<{ distance: number; center: Pt }> {
    const [a, b] = [...this.touches.values()]
    if (!a || !b) return this.pinch ?? { distance: 1, center: { x: 0, y: 0 } }
    return {
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    }
  }

  /** Zoom by how the fingers spread and pan by how their midpoint moved. */
  private zoomTo(next: Readonly<{ distance: number; center: Pt }>): void {
    const last = this.pinch
    this.pinch = next
    if (!last) return
    const rect = this.host.getBoundingClientRect()
    const from = this.world.toLocal(new Point(last.center.x - rect.left, last.center.y - rect.top))
    const scale = Math.min(
      1.6,
      Math.max(0.25, (this.world.scale.x * next.distance) / last.distance),
    )
    this.world.scale.set(scale)
    this.world.position.set(
      next.center.x - rect.left - from.x * scale,
      next.center.y - rect.top - from.y * scale,
    )
    this.drawGrid()
  }

  private bindPointer(): void {
    const canvas = this.app.canvas
    const { signal } = this.abort
    canvas.style.touchAction = 'none'
    canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal })

    canvas.addEventListener(
      'pointerdown',
      (event) => {
        this.coarse = event.pointerType !== 'mouse'
        if (this.coarse) {
          this.touches.set(event.pointerId, { x: event.clientX, y: event.clientY })
          canvas.setPointerCapture(event.pointerId)
          if (this.touches.size === 2) {
            // A second finger turns the gesture into a pinch.
            this.letGo()
            this.gesture = null
            this.dragged = null
            if (this.pressed) {
              this.pressed = null
              this.syncCards()
            }
            this.pinch = this.pinchOf()
            return
          }
          if (this.touches.size > 2) return
        }
        const point = this.toWorld(event)
        this.pointer = point
        if (event.button === 2) {
          const link = this.linkAt(point)
          if (link) this.selectLink(link)
          return
        }
        if (event.button !== 0) return
        canvas.setPointerCapture(event.pointerId)
        if (this.state?.stamp) {
          this.events.onPlace(Math.round(point.x / 8) * 8, Math.round(point.y / 8) * 8)
          return
        }
        if (this.state?.placing) {
          this.events.onPlace(point.x - CARD_W / 2, point.y - heightOf(this.state.placing) / 2)
          return
        }
        const port = this.outPortAt(point)
        if (port) {
          this.hoverLink = null
          this.gesture = { kind: 'link', from: port.id, at: point }
          this.wireEnd = outPort(this.shown().get(port.id) ?? port)
          this.snapTo = null
          this.snapGlow = 0
          play('pull', 1, true)
          return
        }
        const node = this.nodeAt(point)
        if (node) {
          if (inFooter(node, point)) {
            this.pressed = node.id
            this.syncCards()
          } else {
            const view = this.views.get(node.id)
            if (view) view.held = true
          }
          this.gesture = {
            kind: 'node',
            id: node.id,
            dx: point.x - node.x,
            dy: point.y - node.y,
            x: event.clientX,
            y: event.clientY,
            moved: false,
          }
          return
        }
        if (event.shiftKey) {
          this.gesture = { kind: 'box', from: point, at: point }
          return
        }
        if (this.selectedLink && this.onBadge(point)) {
          this.events.onUnlink(this.selectedLink.from, this.selectedLink.to)
          this.selectedLink = null
          return
        }
        if (this.hoverLink) {
          this.selectLink(this.hoverLink)
          return
        }
        this.gesture = {
          kind: 'pan',
          x: event.clientX,
          y: event.clientY,
          moved: false,
          cut: this.coarse ? this.linkAt(point) : null,
        }
      },
      { signal },
    )

    canvas.addEventListener(
      'pointermove',
      (event) => {
        if (this.touches.has(event.pointerId)) {
          this.touches.set(event.pointerId, { x: event.clientX, y: event.clientY })
          if (this.pinch) {
            this.zoomTo(this.pinchOf())
            return
          }
        }
        const point = this.toWorld(event)
        this.pointer = point
        const gesture = this.gesture
        if (gesture?.kind === 'pan') {
          const dx = event.clientX - gesture.x
          const dy = event.clientY - gesture.y
          if (!gesture.moved && Math.hypot(dx, dy) < 4) return
          gesture.moved = true
          this.world.position.x += dx
          this.world.position.y += dy
          gesture.x = event.clientX
          gesture.y = event.clientY
          this.drawGrid()
          canvas.style.cursor = 'grabbing'
          return
        }
        if (gesture?.kind === 'node') {
          if (
            !gesture.moved &&
            Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 4
          )
            return
          const view = this.views.get(gesture.id)
          if (!gesture.moved && view) {
            // Picked up: it rises above the other cards.
            view.held = false
            view.lifted = true
            this.cards.addChild(view.root)
            play('lift', 1, true)
          }
          gesture.moved = true
          const last = this.dragged
          this.dragged = {
            id: gesture.id,
            x: Math.round((point.x - gesture.dx) / 8) * 8,
            y: Math.round((point.y - gesture.dy) / 8) * 8,
          }
          // Each grid line it crosses is a faint detent.
          if (last && (last.x !== this.dragged.x || last.y !== this.dragged.y)) play('detent')
          this.syncCards()
          canvas.style.cursor = 'grabbing'
          return
        }
        if (gesture?.kind === 'link' || gesture?.kind === 'box') {
          gesture.at = point
          const target = this.nodeAt(point)
          const next = target && target.id !== gesture.from ? target.id : null
          if (next !== this.snapTo) {
            if (next) play('snap')
            else play('detent', 0.7)
            this.snapTo = next
          }
          canvas.style.cursor = 'crosshair'
          return
        }
        if (this.state?.stamp) {
          canvas.style.cursor = 'copy'
          return
        }
        if (this.state?.placing) {
          canvas.style.cursor = 'copy'
          return
        }
        // A port wins over the link leaving it: pulling a wire is not a cut.
        this.hoverLink = this.nodeAt(point) || this.outPortAt(point) ? null : this.linkAt(point)
        this.hoverNode = this.nodeAt(point)?.id ?? null
        canvas.style.cursor = this.outPortAt(point)
          ? 'crosshair'
          : this.nodeAt(point)
            ? inFooter(this.nodeAt(point) as GameNode, point)
              ? 'pointer'
              : 'move'
            : this.hoverLink
              ? 'pointer'
              : 'grab'
      },
      { signal },
    )

    const finish = (event: PointerEvent, cancelled: boolean) => {
      this.touches.delete(event.pointerId)
      if (this.pinch) {
        // The pinch ends with its first finger; the other one does nothing until it lifts.
        if (this.touches.size < 2) this.pinch = null
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
        return
      }
      const gesture = this.gesture
      this.gesture = null
      this.letGo()
      if (this.pressed) {
        this.pressed = null
        this.syncCards()
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      canvas.style.cursor = 'grab'
      if (!gesture || cancelled) {
        if (gesture?.kind === 'link') this.springBack(gesture.from)
        this.dragged = null
        return
      }
      const point = this.toWorld(event)
      if (gesture.kind === 'pan' && !gesture.moved) {
        if (gesture.cut) this.selectLink(gesture.cut)
        else {
          this.selectedLink = null
          this.events.onEmptyTap()
        }
      }
      if (gesture.kind === 'node') {
        const node = this.nodes().find((entry) => entry.id === gesture.id)
        // A dropped card keeps its place until the Model has it (see draw), so it
        // does not glide back toward where it was for a frame.
        if (gesture.moved && this.dragged) {
          this.droppedAt = performance.now()
          // The card settles where the Model will put it, clear of the others.
          const landing = this.landingOf(this.dragged) ?? this.dragged
          this.dragged = { id: gesture.id, x: landing.x, y: landing.y }
          this.syncCards()
          this.events.onNodeMove(gesture.id, landing.x, landing.y)
        } else {
          this.dragged = null
          if (event.shiftKey) this.events.onNodeToggle(gesture.id)
          else if (node && inFooter(node, point)) this.events.onFooter(gesture.id)
          else this.events.onNodeTap(gesture.id)
        }
      }
      if (gesture.kind === 'link') {
        const target = this.nodeAt(point)
        if (target && target.id !== gesture.from) {
          this.wired = `${gesture.from}>${target.id}`
          this.wireEnd = null
          this.snapTo = null
          this.events.onLink(gesture.from, target.id)
        } else this.springBack(gesture.from)
      }
      if (gesture.kind === 'box') {
        const left = Math.min(gesture.from.x, point.x)
        const right = Math.max(gesture.from.x, point.x)
        const top = Math.min(gesture.from.y, point.y)
        const bottom = Math.max(gesture.from.y, point.y)
        this.events.onBox(
          this.nodes()
            .filter(
              (node) =>
                node.x < right &&
                node.x + CARD_W > left &&
                node.y < bottom &&
                node.y + heightOf(node.type) > top,
            )
            .map((node) => node.id),
        )
      }
    }
    canvas.addEventListener('pointerup', (event) => finish(event, false), { signal })
    canvas.addEventListener('pointercancel', (event) => finish(event, true), { signal })
    canvas.addEventListener(
      'pointerleave',
      () => {
        this.hoverLink = null
        this.hoverNode = null
      },
      { signal },
    )
    window.addEventListener(
      'keydown',
      (event) => {
        const link = this.selectedLink
        if (!link) return
        if (event.key === 'Escape') this.selectedLink = null
        if (event.key !== 'Delete' && event.key !== 'Backspace') return
        const target = event.target as HTMLElement | null
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
        this.selectedLink = null
        this.events.onUnlink(link.from, link.to)
      },
      { signal },
    )

    canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault()
        const rect = this.host.getBoundingClientRect()
        const screen = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        const before = this.toWorld(event)
        const scale = Math.min(
          1.6,
          Math.max(0.25, this.world.scale.x * Math.exp(-event.deltaY * 0.0015)),
        )
        this.world.scale.set(scale)
        this.world.position.set(screen.x - before.x * scale, screen.y - before.y * scale)
        this.drawGrid()
      },
      { signal, passive: false },
    )
  }

  /** Puts down whatever card is held or lifted. */
  private letGo(): void {
    for (const view of this.views.values()) {
      view.held = false
      view.lifted = false
    }
  }

  /** A wire let go over nothing draws back into its port. */
  private springBack(fromId: string): void {
    const from = this.shown().get(fromId)
    const end = this.wireEnd
    this.wireEnd = null
    this.snapTo = null
    if (!from || !end) return
    const lane = laneUnder(from, end.y)
    this.retract = { path: route(outPort(from), end, lane), t: 0 }
    play('release', 1, true)
  }

  /* ---------- drawing ---------- */

  private syncCards(): void {
    const state = this.state
    if (!state) return
    const colors = palette()
    const live = new Set<string>()
    const path = this.pathOf(state)
    for (const node of this.nodes()) {
      live.add(node.id)
      let view = this.views.get(node.id)
      if (!view || view.type !== node.type) {
        view?.root.destroy({ children: true })
        view = new NodeView(node.type, this.seeded)
        this.views.set(node.id, view)
        this.cards.addChild(view.root)
      }
      view.update(
        state.game,
        node,
        state.ledger,
        state.selected === node.id || state.selection.includes(node.id),
        this.pressed === node.id,
        colors,
        state.history[node.id] ?? [],
        state.region,
      )
      view.dim = path !== null && !path.has(node.id)
    }
    for (const [id, view] of this.views) {
      if (live.has(id)) continue
      view.leave()
      this.leaving.push(view)
      this.views.delete(id)
    }
    this.seeded = true
  }

  /** The Nodes upstream and downstream of the hovered or selected Node, itself included;
   *  null when none is in focus, so nothing is dimmed. */
  private pathOf(state: BoardState): ReadonlySet<string> | null {
    const focus = this.hoverNode ?? state.selected
    if (!focus || !state.game.nodes.some((node) => node.id === focus)) return null
    const reach = (next: (link: { from: string; to: string }) => readonly [string, string]) => {
      const seen = new Set([focus])
      const queue = [focus]
      for (let id = queue.pop(); id !== undefined; id = queue.pop())
        for (const link of state.game.links) {
          const [at, to] = next(link)
          if (at === id && !seen.has(to)) {
            seen.add(to)
            queue.push(to)
          }
        }
      return seen
    }
    const down = reach((link) => [link.from, link.to])
    const up = reach((link) => [link.to, link.from])
    return new Set([...down, ...up])
  }

  /** One belt per link, stacked in the Model's link order, with the splitters on top. */
  private syncBelts(links: ReadonlyArray<Readonly<{ from: string; to: string }>>): void {
    if (links === this.beltLinks) return
    this.beltLinks = links
    const keys = links.map((link) => `${link.from}>${link.to}`)
    const order = keys.join('|')
    if (order === this.beltOrder) return
    this.beltOrder = order
    const live = new Set(keys)
    for (const [key, belt] of this.belts) {
      if (live.has(key)) continue
      belt.root.destroy({ children: true })
      this.belts.delete(key)
    }
    this.wires.removeChildren()
    for (const key of keys) {
      let belt = this.belts.get(key)
      if (!belt) {
        belt = new BeltView()
        this.belts.set(key, belt)
      }
      this.wires.addChild(belt.root)
    }
    this.wires.addChild(this.splitters)
  }

  private syncGhost(): void {
    const type = this.state?.placing ?? null
    if (type === this.ghostType) return
    this.ghostType = type
    this.ghost.removeChildren().forEach((child) => child.destroy({ children: true }))
    this.ghost.visible = type !== null
    if (!type) return
    const colors = palette()
    const height = heightOf(type)
    const group = COMPONENTS[type].group
    const hue = colors.groups[group]
    const frame = new Graphics()
    silhouette(frame, group, 0, 0, CARD_W, height).fill(colors.card)
    headerBand(frame, group, hue, colors)
    silhouette(frame, group, 0, 0, CARD_W, height).stroke({ color: hue, width: 2 })
    medallion(frame, group, hue, colors)
    const name = label(15, SANS, '700')
    name.text = COMPONENTS[type].name
    name.style.fill = colors.ink
    name.anchor.set(0, 0.5)
    name.position.set(TITLE_X, HEAD / 2)
    const size = badgeGlyph(group, BADGE_R)
    const mark = glyph(size)
    paint(mark, COMPONENT_ICONS[type], 0xffffff)
    mark.position.set(BADGE_X - size / 2, BADGE_Y - size / 2)
    this.ghost.addChild(frame, name, mark)
  }

  private animate(seconds: number): void {
    const state = this.state
    if (!state) return
    const colors = palette()
    if (!state.paused) this.phase += seconds
    // Reduced motion: packets hold still along the pipe, and the bottleneck does not pulse.
    const still = reducedMotion()
    for (const view of this.views.values()) view.tick(seconds, still)
    this.leaving = this.leaving.filter((view) => {
      if (view.tick(seconds, still)) return true
      view.root.destroy({ children: true })
      return false
    })
    const byId = this.shown()
    for (const [key, age] of this.fresh)
      if (age >= GLOW_S) this.fresh.delete(key)
      else this.fresh.set(key, age + seconds)
    const rates = new Map(state.ledger.links.map((link) => [`${link.from}>${link.to}`, link]))

    const focus = this.pathOf(state)
    this.packets.clear()
    this.overlay.clear()
    this.syncBelts(state.game.links)
    const picked = this.selectedLink
    if (picked && !state.game.links.some((l) => l.from === picked.from && l.to === picked.to))
      this.selectedLink = null
    for (const link of state.game.links) {
      const belt = this.belts.get(`${link.from}>${link.to}`)
      const from = byId.get(link.from)
      const to = byId.get(link.to)
      if (belt) belt.root.visible = from !== undefined && to !== undefined
      if (!belt || !from || !to) continue
      // Off the focused path, a belt fades back.
      const off = focus !== null && !(focus.has(link.from) && focus.has(link.to))
      belt.root.alpha = off ? DIM : 1
      const age = this.fresh.get(`${link.from}>${link.to}`)
      const wire = this.wireOf(from, to)
      // A new link draws out of its port before anything flows along it.
      const drawn = age === undefined ? 1 : easeOut(Math.min(1, age / DRAW_IN_S))
      const path = drawn < 1 ? partOf(wire.path, drawn) : wire.path
      // Where another lane crosses, a vertical lane has a gap: it is the one passing under.
      const pieces = drawn < 1 ? [path] : wire.pieces
      const flow = rates.get(`${link.from}>${link.to}`)
      const tap = COMPONENTS[to.type].tap
      const picked = this.selectedLink?.from === link.from && this.selectedLink.to === link.to
      const hovered =
        picked || (this.hoverLink?.from === link.from && this.hoverLink.to === link.to)
      const busy = (flow?.rate ?? 0) > 0.01
      // The packets' colour; the pipe under them is a pale tint of it, with no outline.
      const packet =
        hovered || flow?.failing
          ? colors.danger
          : tap
            ? colors.muted
            : flow && busy
              ? KINDS[flow.kind].color
              : colors.edge
      // The belt: rails, then the body between them.
      const speed = busy && !still ? beltSpeed(flow?.rate ?? 0) : 0
      // Rails between zones are orange: those calls pay cross-zone latency and Egress.
      const rail = hovered
        ? colors.danger
        : zoneMs(from, to) > 0
          ? colors.warn
          : busy
            ? mix(packet, colors.ink, 0.3)
            : colors.edge
      const body = mix(packet, colors.canvas, hovered ? 0.6 : busy ? 0.8 : 0.92)
      belt.draw(
        pieces,
        rail,
        body,
        busy,
        busy ? mix(packet, colors.canvas, 0.35) : colors.edge,
        this.phase * speed,
      )
      if (picked) {
        const mid = pointOn(path, 0.5)
        this.overlay.circle(mid.x, mid.y, 9).fill(colors.danger)
        this.overlay
          .moveTo(mid.x - 3.5, mid.y - 3.5)
          .lineTo(mid.x + 3.5, mid.y + 3.5)
          .moveTo(mid.x + 3.5, mid.y - 3.5)
          .lineTo(mid.x - 3.5, mid.y + 3.5)
        this.overlay.stroke({ color: colors.card, width: 2 })
      }
      if (age !== undefined) {
        const glow = 1 - easeOut(Math.min(1, age / GLOW_S))
        traceOf(this.overlay, path).stroke({
          color: colors.accent,
          width: 2 + 6 * glow,
          alpha: 0.35 * glow,
          cap: 'round',
          join: 'round',
        })
        if (drawn < 1) {
          const tip = path[path.length - 1]
          if (tip) this.overlay.circle(tip.x, tip.y, 4).fill(colors.accent)
          continue
        }
      }
      if (!flow || !busy || off) continue
      const length = lengthOf(path)
      const count = Math.max(
        1,
        Math.min(9, Math.round(Math.log2(1 + flow.rate) * 1.4), Math.floor(length / 20)),
      )
      // Items ride the belt at its speed, and are out of sight while it runs underground.
      const along = speed / Math.max(1, length)
      for (let index = 0; index < count; index += 1) {
        const t = (this.phase * along + (index + 0.5) / count) % 1
        const at = pointOn(path, t, length)
        if (wire.hops.some((hop) => Math.abs(hop.x - at.x) < 1 && Math.abs(hop.y - at.y) < HOP))
          continue
        this.packets.roundRect(at.x - 2.5, at.y - 2.5, 5, 5, 1.5)
      }
      this.packets.fill({ color: packet, alpha: tap ? 0.6 : 0.95 })
    }

    // A port that feeds several belts has a splitter over the point where they part.
    const fans = new Map<string, { x: number; top: number; bottom: number; belts: number }>()
    for (const link of state.game.links) {
      const from = byId.get(link.from)
      const to = byId.get(link.to)
      if (!from || !to || this.fresh.has(`${link.from}>${link.to}`)) continue
      const port = outPort(from)
      const fan = fans.get(link.from) ?? {
        x: port.x,
        top: port.y,
        bottom: port.y,
        belts: 0,
      }
      fan.belts += 1
      // The fan is the stretch out of the port before the belt runs straight up or down.
      const path = this.wireOf(from, to).path
      for (let index = 1; index < path.length; index += 1) {
        const point = path[index] as Pt
        const before = path[index - 1] as Pt
        if (point.x > port.x + SPLITTER_W || Math.abs(point.x - before.x) < 0.01) break
        fan.top = Math.min(fan.top, point.y)
        fan.bottom = Math.max(fan.bottom, point.y)
      }
      fans.set(link.from, fan)
    }
    const splitters = [...fans.values()].filter((fan) => fan.belts >= 2)
    const splittersKey = splitters.map((fan) => `${fan.x}:${fan.top}:${fan.bottom}`).join('|')
    if (splittersKey !== this.splittersKey) {
      this.splittersKey = splittersKey
      this.splitters.clear()
      const pad = BELT / 2 + 1.5
      for (const fan of splitters)
        this.splitters
          .roundRect(fan.x, fan.top - pad, SPLITTER_W, fan.bottom - fan.top + pad * 2, 3)
          .fill(colors.card)
          .stroke({ color: colors.edge, width: 1.5 })
    }

    // The bottleneck: a pulsing outline on the one Node that costs the most revenue.
    const bottleneck = state.ledger.bottleneck ? byId.get(state.ledger.bottleneck) : undefined
    if (bottleneck) {
      const pulse = still ? 0.85 : 0.45 + 0.4 * Math.abs(Math.sin(this.phase * 2.4))
      const pad = 5
      silhouette(
        this.overlay,
        COMPONENTS[bottleneck.type].group,
        bottleneck.x,
        bottleneck.y,
        CARD_W,
        heightOf(bottleneck.type),
        pad,
      ).stroke({ color: colors.warn, width: 2.5, alpha: pulse })
      const tag = 'BOTTLENECK'
      this.overlay
        .roundRect(bottleneck.x - pad + 6, bottleneck.y - pad - 18, tag.length * 6.4 + 12, 15, 5)
        .fill({ color: colors.warn, alpha: 0.95 })
      this.bottleneckTag.text = tag
      this.bottleneckTag.position.set(bottleneck.x - pad + 12, bottleneck.y - pad - 16.5)
      this.bottleneckTag.visible = true
    } else {
      this.bottleneckTag.visible = false
    }

    // A disclosure cue: a ring around the one footer button to press next.
    const cue = state.cue ? byId.get(state.cue) : undefined
    if (cue) {
      const rect = footerRect(cue.type)
      const pulse = still ? 0.9 : 0.35 + 0.55 * Math.abs(Math.sin(this.phase * 2.4))
      this.overlay
        .roundRect(cue.x + rect.x - 3, cue.y + rect.y - 3, rect.w + 6, rect.h + 6, 10)
        .stroke({ color: colors.ok, width: 2.5, alpha: pulse })
    }

    // Cut links fade where they were, in the colour that warned before the cut.
    this.cuts = this.cuts.filter((cut) => {
      cut.t += seconds
      const fade = 1 - easeOut(Math.min(1, cut.t / CUT_S))
      traceOf(this.overlay, cut.path).stroke({
        color: colors.danger,
        width: 2.5,
        alpha: 0.9 * fade,
        cap: 'round',
        join: 'round',
      })
      return cut.t < CUT_S
    })

    // A wire let go over nothing draws back into its port.
    const retract = this.retract
    if (retract) {
      retract.t += seconds
      const left = 1 - easeOut(Math.min(1, retract.t / RETRACT_S))
      const path = partOf(retract.path, left)
      traceOf(this.overlay, path).stroke({
        color: colors.accent,
        width: 2.5,
        cap: 'round',
        join: 'round',
      })
      const tip = path[path.length - 1]
      if (tip) this.overlay.circle(tip.x, tip.y, 5 * Math.max(0.4, left)).fill(colors.accent)
      if (retract.t >= RETRACT_S) this.retract = null
    }

    const gesture = this.gesture
    const snapped = gesture?.kind === 'link' && this.snapTo ? byId.get(this.snapTo) : undefined
    this.snapGlow += ((snapped ? 1 : 0) - this.snapGlow) * follow(seconds, 26, still)
    if (gesture?.kind === 'link') {
      const from = byId.get(gesture.from)
      if (from) {
        // Free, the end rides the pointer; near a port it is pulled onto it.
        const aim = snapped ? inPort(snapped) : gesture.at
        const end = this.wireEnd ?? aim
        const k = follow(seconds, snapped ? 30 : 60, still)
        this.wireEnd = { x: end.x + (aim.x - end.x) * k, y: end.y + (aim.y - end.y) * k }
        const lane = laneUnder(from, snapped ? snapped.y + heightOf(snapped.type) : this.wireEnd.y)
        traceOf(this.overlay, route(outPort(from), this.wireEnd, lane)).stroke({
          color: colors.accent,
          width: 2.5,
          cap: 'round',
          join: 'round',
        })
        this.overlay
          .circle(this.wireEnd.x, this.wireEnd.y, 5 + 1.5 * this.snapGlow)
          .fill(colors.accent)
        if (snapped) {
          silhouette(
            this.overlay,
            COMPONENTS[snapped.type].group,
            snapped.x,
            snapped.y,
            CARD_W,
            heightOf(snapped.type),
            3 + 5 * (1 - this.snapGlow),
          ).stroke({ color: colors.accent, width: 2, alpha: this.snapGlow })
        }
      }
    }

    if (gesture?.kind === 'box') {
      const left = Math.min(gesture.from.x, gesture.at.x)
      const top = Math.min(gesture.from.y, gesture.at.y)
      this.overlay
        .rect(
          left,
          top,
          Math.abs(gesture.at.x - gesture.from.x),
          Math.abs(gesture.at.y - gesture.from.y),
        )
        .fill({ color: colors.accent, alpha: 0.08 })
        .stroke({ color: colors.accent, width: 1.5, alpha: 0.8 })
    }
    const landing = this.landingOf()
    if (state.stamp) {
      // The Playbook shows where it will land, clear of the cards already there.
      const x = landing?.x ?? Math.round(this.pointer.x / 8) * 8
      const y = landing?.y ?? Math.round(this.pointer.y / 8) * 8
      for (const entry of state.stamp) {
        silhouette(
          this.overlay,
          COMPONENTS[entry.type].group,
          x + entry.dx,
          y + entry.dy,
          CARD_W,
          heightOf(entry.type),
          0,
        )
          .fill({ color: entry.ghost ? colors.danger : colors.accent, alpha: 0.1 })
          .stroke({ color: entry.ghost ? colors.danger : colors.accent, width: 2, alpha: 0.85 })
      }
    }

    // A held card or new Node over others: an outline shows the free spot it will take.
    const held =
      gesture?.kind === 'node' && this.dragged
        ? byId.get(this.dragged.id)
        : state.placing && this.ghost.visible
          ? {
              type: state.placing,
              x: Math.round((this.pointer.x - CARD_W / 2) / 8) * 8,
              y: Math.round((this.pointer.y - heightOf(state.placing) / 2) / 8) * 8,
            }
          : undefined
    if (held && landing && (landing.x !== held.x || landing.y !== held.y)) {
      silhouette(
        this.overlay,
        COMPONENTS[held.type].group,
        landing.x,
        landing.y,
        CARD_W,
        heightOf(held.type),
        0,
      )
        .fill({ color: colors.accent, alpha: 0.08 })
        .stroke({ color: colors.accent, width: 2, alpha: 0.7 })
    }

    if (this.ghost.visible)
      this.ghost.position.set(
        this.pointer.x - CARD_W / 2,
        this.pointer.y - heightOf(this.ghostType ?? 'server') / 2,
      )
  }
}

export const attachBoard = (key: string, host: HTMLElement, events: BoardEvents): (() => void) => {
  const controller = new BoardController(host, events)
  controllers.set(key, controller)
  controller.start(desired.get(key)).catch((error: unknown) => {
    console.error(`Quorum: the "${key}" board failed to start`, error)
  })
  return () => {
    controller.destroy()
    if (controllers.get(key) === controller) controllers.delete(key)
  }
}
