import { Application, Container, Graphics, Point, Text } from 'pixi.js'
import {
  COMPONENTS,
  FRAMEWORKS,
  INSIGHT_YIELD,
  KINDS,
  RUNTIMES,
  SIZES,
  type ComponentId,
} from './engine/catalog.ts'
import type { Ledger } from './engine/ledger.ts'
import { burnOf, drawerSize, eraOf, has, replacePrice, resizePrice } from './engine/lookups.ts'
import type { Game, GameNode } from './engine/state.ts'
import { compact, money, rate } from './format.ts'

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
}>

export type BoardState = Readonly<{
  game: Game
  ledger: Ledger
  selected: string | null
  placing: ComponentId | null
}>

export const CARD_W = 216
const HEAD = 30
const ROW = 24
const FOOT = 32
const PORT_R = 6

type Layout = Readonly<{
  rows: number
  inRow: number | null
  outRow: number | null
  footer: boolean
}>

/** Row count and port rows per Component. Fixed per type, so hit tests need no flow. */
const layoutOf = (type: ComponentId): Layout => {
  switch (type) {
    case 'users':
      return { rows: 3, inRow: null, outRow: 2, footer: false }
    case 'payments':
      return { rows: 2, inRow: null, outRow: null, footer: true }
    case 'analytics':
      return { rows: 3, inRow: 0, outRow: null, footer: true }
    case 'server':
      return { rows: 5, inRow: 0, outRow: 4, footer: true }
    case 'database':
    case 'replica':
      return { rows: 4, inRow: 0, outRow: null, footer: true }
    case 'auth':
      return { rows: 3, inRow: 0, outRow: null, footer: false }
    case 'dns':
    case 'lb':
      return { rows: 3, inRow: 0, outRow: 2, footer: false }
    case 'cache':
    case 'pooler':
      return { rows: 4, inRow: 0, outRow: 3, footer: false }
  }
}

const rowTop = (index: number): number => HEAD + 4 + index * ROW
const rowMid = (index: number): number => rowTop(index) + ROW / 2

export const heightOf = (type: ComponentId): number => {
  const layout = layoutOf(type)
  return rowTop(layout.rows) + (layout.footer ? FOOT : 6)
}

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

const palette = () => ({
  canvas: token('--canvas', '#f1f4f9'),
  grid: token('--canvas-dot', '#c9d3e3'),
  card: token('--card', '#ffffff'),
  head: token('--surface-nested', '#f7f7f8'),
  well: token('--well', '#eeeef0'),
  border: token('--input', '#d5ddea'),
  edge: token('--edge-solid', '#9aa8bf'),
  accent: token('--primary-strong', '#4f7fe0'),
  ink: token('--foreground', '#16233d'),
  muted: token('--muted-foreground', '#5c6b85'),
  track: token('--muted', '#eef2f8'),
  ok: token('--ok', '#1a8a51'),
  warn: token('--warn', '#cd7d09'),
  danger: token('--danger', '#c72e2b'),
})

type Palette = ReturnType<typeof palette>

/* ---------- geometry ---------- */

type Pt = Readonly<{ x: number; y: number }>

const outPort = (node: GameNode): Pt => ({
  x: node.x + CARD_W,
  y: node.y + rowMid(layoutOf(node.type).outRow ?? 0),
})
const inPort = (node: GameNode): Pt => ({
  x: node.x,
  y: node.y + rowMid(layoutOf(node.type).inRow ?? 0),
})

/** The footer button, in the node's own coordinates. */
const footerRect = (type: ComponentId) => {
  const y = rowTop(layoutOf(type).rows) + 4
  return { x: 8, y, w: CARD_W - 16, h: FOOT - 10 }
}

const inFooter = (node: GameNode, point: Pt): boolean => {
  if (!layoutOf(node.type).footer) return false
  const rect = footerRect(node.type)
  const x = point.x - node.x
  const y = point.y - node.y
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
}

const bezier = (a: Pt, b: Pt) => {
  const reach = Math.max(60, Math.abs(b.x - a.x) * 0.5)
  return { a, c1: { x: a.x + reach, y: a.y }, c2: { x: b.x - reach, y: b.y }, b }
}

type Curve = ReturnType<typeof bezier>

const pointOn = ({ a, c1, c2, b }: Curve, t: number): Pt => {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  }
}

const distanceTo = (curve: Curve, point: Pt): number => {
  let best = Number.POSITIVE_INFINITY
  for (let index = 0; index <= 32; index += 1) {
    const at = pointOn(curve, index / 32)
    best = Math.min(best, Math.hypot(at.x - point.x, at.y - point.y))
  }
  return best
}

/* ---------- one node window ---------- */

const MONO = '"Geist Mono", ui-monospace, monospace'
const SANS = '"Geist", ui-sans-serif, system-ui, sans-serif'
/** Corner radius of a Node card, matching the panels around the board. */
const RADIUS = 12

const label = (size: number, family: string, weight: '400' | '500' | '600' = '500') =>
  new Text({
    text: '',
    style: { fontFamily: family, fontSize: size, fontWeight: weight, fill: 0x16233d },
    resolution: 3,
  })

type RowTone = 'plain' | 'warn' | 'danger' | 'ok'
type Row = Readonly<{ name: string; value: string; tone?: RowTone; bar?: number }>
type Footer = Readonly<{
  text: string
  enabled: boolean
  tone: 'accent' | 'ok' | 'muted' | 'danger'
}>

const pct = (value: number): string => `${Math.round(value * 100)}%`

const outRate = (ledger: Ledger, id: string): number =>
  ledger.links.reduce((sum, link) => (link.from === id ? sum + link.rate : sum), 0)

const rowsOf = (game: Game, node: GameNode, ledger: Ledger): ReadonlyArray<Row> => {
  const own = ledger.nodes[node.id]
  if (!own) return []
  const inbound: Row = {
    name: 'Inbound',
    value: `${rate(own.inbound)}/s`,
    tone: own.dropped > 0.05 ? 'danger' : 'plain',
  }
  const capacity: Row = {
    name: 'Load',
    value:
      own.inbound > 0
        ? `${pct(Math.min(own.utilization, 9.99))} of ${rate(own.capacity)}/s`
        : 'idle',
    tone: own.utilization >= 0.9 ? 'danger' : own.utilization >= 0.7 ? 'warn' : 'plain',
    bar: Math.min(own.utilization, 1),
  }
  const latency: Row = { name: 'Latency', value: `${Math.round(own.latency)} ms` }
  const out: Row = {
    name: own.stranded > 0.01 ? 'Stranded' : 'Out',
    value: own.stranded > 0.01 ? `${rate(own.stranded)}/s` : `${rate(outRate(ledger, node.id))}/s`,
    tone: own.stranded > 0.01 ? 'danger' : 'plain',
  }
  switch (node.type) {
    case 'users': {
      const target = eraOf(game).apdexTarget
      return [
        { name: 'Users', value: compact(game.users) },
        {
          name: 'Apdex',
          value: ledger.apdex.toFixed(2),
          tone: ledger.apdex >= target ? 'ok' : 'danger',
        },
        { name: 'Requests', value: `${rate(ledger.demand)}/s` },
      ]
    }
    case 'payments': {
      const size = drawerSize(game, ledger.revenue)
      return [
        { name: 'Revenue', value: `${money(ledger.revenue)}/s`, tone: 'ok' },
        {
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
        { name: 'Sampling', value: `${rate(own.inbound)}/s` },
        {
          name: 'Kept',
          value: `${rate(sampled)} / ${rate(own.capacity)}`,
          tone: own.inbound > own.capacity ? 'warn' : 'plain',
          bar: own.capacity > 0 ? Math.min(1, own.inbound / own.capacity) : 0,
        },
        {
          name: 'Insight',
          value: `+${(sampled * INSIGHT_YIELD * (2 - ledger.apdex)).toFixed(2)}/s`,
          tone: 'ok',
        },
      ]
    }
    case 'server': {
      const runtime = RUNTIMES[node.runtime].name
      const stack =
        node.framework === 'none' ? runtime : `${runtime} · ${FRAMEWORKS[node.framework].name}`
      return [inbound, capacity, { name: 'Stack', value: stack }, latency, out]
    }
    case 'database':
    case 'replica': {
      const pool = own.connections
      return [
        inbound,
        capacity,
        {
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
      ]
    }
    case 'cache':
      return [
        inbound,
        { name: 'Hit ratio', value: pct(own.hitRatio ?? 0), bar: own.hitRatio ?? 0 },
        latency,
        out,
      ]
    case 'pooler':
      return [inbound, capacity, latency, out]
    case 'lb':
      return [inbound, capacity, out]
    case 'dns':
      return [inbound, { name: 'Policy', value: 'round robin' }, out]
    case 'auth':
      return [
        { name: 'Logins', value: `${rate(own.inbound)}/s` },
        { name: 'Cost', value: `${money(burnOf(game, node))}/s` },
        latency,
      ]
  }
}

const footerOf = (game: Game, node: GameNode): Footer | null => {
  if (!layoutOf(node.type).footer) return null
  if (node.type === 'payments') {
    if (has(game, 'stripe'))
      return { text: 'Collected automatically', enabled: false, tone: 'muted' }
    return game.pending >= 0.01
      ? { text: `Collect ${money(game.pending)}`, enabled: true, tone: 'ok' }
      : { text: 'Drawer empty', enabled: false, tone: 'muted' }
  }
  if (node.down === -1) {
    const price = replacePrice(game, node)
    return { text: `Replace  ${money(price)}`, enabled: game.cash >= price, tone: 'danger' }
  }
  const price = resizePrice(game, node)
  if (price === null) return { text: 'Largest size', enabled: false, tone: 'muted' }
  const label =
    node.type === 'analytics' ? 'More samples' : `Resize → ${SIZES[node.size + 1]?.name ?? ''}`
  return {
    text: `${label}  ${money(price)}`,
    enabled: game.cash >= price,
    tone: game.cash >= price ? 'accent' : 'muted',
  }
}

class NodeView {
  readonly root = new Container()
  private readonly frame = new Graphics()
  private readonly bars = new Graphics()
  private readonly ports = new Graphics()
  private readonly code = label(9.5, MONO, '600')
  private readonly title = label(12.5, SANS, '600')
  private readonly level = label(10, MONO)
  private readonly names: Array<Text> = []
  private readonly values: Array<Text> = []
  private readonly foot = label(11, MONO, '600')
  private digest = ''

  constructor(readonly type: ComponentId) {
    const layout = layoutOf(type)
    this.root.addChild(
      this.frame,
      this.bars,
      this.ports,
      this.code,
      this.title,
      this.level,
      this.foot,
    )
    this.code.anchor.set(0.5)
    this.code.position.set(25, HEAD / 2)
    this.title.position.set(46, 7)
    this.level.anchor.set(1, 0)
    this.level.position.set(CARD_W - 12, 9)
    for (let index = 0; index < layout.rows; index += 1) {
      const name = label(11, SANS, '500')
      const value = label(11, MONO, '500')
      name.anchor.set(0, 0.5)
      value.anchor.set(1, 0.5)
      name.position.set(14, rowMid(index) - 1)
      value.position.set(CARD_W - 14, rowMid(index) - 1)
      this.names.push(name)
      this.values.push(value)
      this.root.addChild(name, value)
    }
    const rect = footerRect(type)
    this.foot.anchor.set(0.5)
    this.foot.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2)
  }

  update(game: Game, node: GameNode, ledger: Ledger, selected: boolean, colors: Palette): void {
    const own = ledger.nodes[node.id]
    if (!own) return
    const def = COMPONENTS[node.type]
    const layout = layoutOf(node.type)
    const rows = rowsOf(game, node, ledger)
    const footer = footerOf(game, node)
    this.root.position.set(node.x, node.y)
    const digest = JSON.stringify([
      rows,
      footer,
      node.size,
      own.status,
      selected,
      Math.ceil(node.down),
      node.warm < 1,
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
            : colors.ink
    const status =
      own.status === 'down' || own.status === 'danger'
        ? colors.danger
        : own.status === 'warn'
          ? colors.warn
          : own.status === 'ok'
            ? colors.ok
            : colors.border
    const edge = selected
      ? colors.accent
      : own.status === 'danger' || own.status === 'down'
        ? colors.danger
        : colors.border

    this.frame.clear()
    // Depth: a wide soft shadow and a tight contact shadow under the card.
    this.frame.roundRect(1, 3, CARD_W - 2, height, RADIUS).fill({ color: colors.ink, alpha: 0.035 })
    this.frame.roundRect(0, 1, CARD_W, height, RADIUS).fill({ color: colors.ink, alpha: 0.05 })
    this.frame.roundRect(0, 0, CARD_W, height, RADIUS).fill(colors.card)
    this.frame.roundRect(0, 0, CARD_W, HEAD + RADIUS, RADIUS).fill(colors.head)
    this.frame.rect(0, HEAD, CARD_W, RADIUS).fill(colors.card)
    this.frame
      .moveTo(0, HEAD)
      .lineTo(CARD_W, HEAD)
      .stroke({ color: colors.border, width: 1, alpha: 0.7 })
    this.frame.roundRect(8, 7, 34, HEAD - 14, 4).fill(colors.well)
    for (let index = 1; index < layout.rows; index += 1) {
      this.frame
        .moveTo(10, rowTop(index))
        .lineTo(CARD_W - 10, rowTop(index))
        .stroke({ color: colors.border, width: 1, alpha: 0.55 })
    }
    if (node.down !== 0)
      this.frame.roundRect(0, 0, CARD_W, height, RADIUS).fill({ color: colors.danger, alpha: 0.07 })
    if (footer) {
      const rect = footerRect(node.type)
      const fill =
        footer.tone === 'ok'
          ? colors.ok
          : footer.tone === 'danger'
            ? colors.danger
            : footer.tone === 'accent'
              ? colors.accent
              : colors.track
      this.frame.roundRect(rect.x, rect.y, rect.w, rect.h, 7).fill(fill)
      if (footer.tone !== 'muted')
        this.frame
          .moveTo(rect.x + 7, rect.y + 0.5)
          .lineTo(rect.x + rect.w - 7, rect.y + 0.5)
          .stroke({ color: 0xffffff, width: 1, alpha: 0.18 })
      this.foot.text = footer.text
      this.foot.style.fill = footer.tone === 'muted' ? colors.muted : colors.card
    } else {
      this.foot.text = ''
    }
    this.frame
      .roundRect(0, 0, CARD_W, height, RADIUS)
      .stroke({ color: edge, width: selected ? 2 : 1, alignment: 1, alpha: selected ? 1 : 0.8 })

    this.code.text = def.code.toUpperCase()
    this.code.style.fill = colors.accent
    this.title.text =
      node.down === -1
        ? `${def.name} · failed`
        : node.down > 0
          ? `${def.name} · restart`
          : node.warm < 1 && (def.sized || node.type === 'cache')
            ? `${def.name} · cold`
            : def.name
    this.title.style.fill = node.down !== 0 ? colors.danger : colors.ink
    this.level.text = def.sized
      ? (SIZES[node.size]?.name ?? '')
      : node.type === 'payments' || node.type === 'analytics'
        ? `S${node.size}`
        : ''
    this.level.style.fill = colors.muted

    this.bars.clear()
    if (status !== colors.border)
      this.bars.circle(this.title.x + this.title.width + 8, HEAD / 2, 3).fill(status)
    rows.forEach((row, index) => {
      const name = this.names[index]
      const value = this.values[index]
      if (!name || !value) return
      name.text = row.name
      name.style.fill = colors.muted
      value.text = row.value
      value.style.fill = toneOf(row.tone)
      if (row.bar !== undefined) {
        const y = rowTop(index) + ROW - 4
        const tone = row.bar > 0.95 ? colors.danger : row.bar > 0.8 ? colors.warn : colors.accent
        const share = Math.max(0, Math.min(1, row.bar))
        this.bars.roundRect(14, y, CARD_W - 28, 3, 1.5).fill(colors.well)
        if (share > 0)
          this.bars.roundRect(14, y, Math.max(3, (CARD_W - 28) * share), 3, 1.5).fill(tone)
      }
    })

    this.ports.clear()
    if (layout.inRow !== null) {
      const y = rowMid(layout.inRow)
      this.ports.circle(0, y, PORT_R).fill(colors.card).stroke({ color: colors.edge, width: 1.5 })
      this.ports.circle(0, y, 2).fill(colors.edge)
    }
    if (layout.outRow !== null) {
      const y = rowMid(layout.outRow)
      this.ports.circle(CARD_W, y, PORT_R).fill(own.stranded > 0.01 ? colors.danger : colors.accent)
      this.ports.circle(CARD_W, y, 2).fill(colors.card)
    }
  }
}

/* ---------- the controller ---------- */

type Gesture =
  | { kind: 'pan'; x: number; y: number; moved: boolean }
  | { kind: 'node'; id: string; dx: number; dy: number; x: number; y: number; moved: boolean }
  | { kind: 'link'; from: string; at: Pt }
  | null

class BoardController {
  private readonly app = new Application()
  private readonly world = new Container()
  private readonly grid = new Graphics()
  private readonly wires = new Graphics()
  private readonly packets = new Graphics()
  private readonly cards = new Container()
  private readonly overlay = new Graphics()
  private readonly bottleneckTag = label(9, MONO, '600')
  private readonly ghost = new Container()
  private readonly views = new Map<string, NodeView>()
  private state: BoardState | null = null
  private gesture: Gesture = null
  private hoverLink: Readonly<{ from: string; to: string }> | null = null
  private pointer: Pt = { x: 0, y: 0 }
  /** Local positions while a node is dragged, ahead of the Model. */
  private dragged: Readonly<{ id: string; x: number; y: number }> | null = null
  private ghostType: ComponentId | null = null
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
    this.ghost.alpha = 0.55
    this.ghost.visible = false
    this.bindPointer()
    this.app.ticker.add((ticker) => this.animate(ticker.deltaMS / 1000))
    this.started = true
    this.resize.observe(this.host)
    this.onResize()
  }

  draw(state: BoardState): void {
    this.state = state
    if (!this.started) return
    if (!this.fitted) this.fit()
    this.syncCards()
    this.syncGhost()
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
    const top = 120
    const bottom = 210
    const room = Math.max(1, h - top - bottom)
    const scale = Math.min(1.1, Math.min(w / (maxX - minX), room / (maxY - minY)))
    this.world.scale.set(scale)
    this.world.position.set(
      w / 2 - ((minX + maxX) / 2) * scale,
      top + room / 2 - ((minY + maxY) / 2) * scale,
    )
    this.fitted = true
    this.drawGrid()
  }

  private drawGrid(): void {
    const colors = palette()
    const { clientWidth: w, clientHeight: h } = this.host
    const step = 32 * this.world.scale.x
    this.grid.clear()
    if (step < 8) return
    const ox = ((this.world.position.x % step) + step) % step
    const oy = ((this.world.position.y % step) + step) % step
    for (let x = ox; x < w; x += step) {
      for (let y = oy; y < h; y += step) this.grid.rect(x - 0.75, y - 0.75, 1.5, 1.5)
    }
    this.grid.fill(colors.grid)
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
    const reach = PORT_R + 6 / this.world.scale.x
    return (
      this.nodes().findLast((node) => {
        if (layoutOf(node.type).outRow === null) return false
        const port = outPort(node)
        return Math.hypot(port.x - point.x, port.y - point.y) <= reach
      }) ?? null
    )
  }

  private linkAt(point: Pt): Readonly<{ from: string; to: string }> | null {
    const byId = new Map(this.nodes().map((node) => [node.id, node]))
    const reach = 7 / this.world.scale.x
    for (const link of this.state?.game.links ?? []) {
      const from = byId.get(link.from)
      const to = byId.get(link.to)
      if (!from || !to) continue
      if (distanceTo(bezier(outPort(from), inPort(to)), point) <= reach) return link
    }
    return null
  }

  /* ---------- pointer ---------- */

  private bindPointer(): void {
    const canvas = this.app.canvas
    const { signal } = this.abort
    canvas.style.touchAction = 'none'
    canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal })

    canvas.addEventListener(
      'pointerdown',
      (event) => {
        const point = this.toWorld(event)
        this.pointer = point
        if (event.button === 2) {
          const link = this.linkAt(point)
          if (link) this.events.onUnlink(link.from, link.to)
          return
        }
        if (event.button !== 0) return
        canvas.setPointerCapture(event.pointerId)
        if (this.state?.placing) {
          this.events.onPlace(point.x - CARD_W / 2, point.y - heightOf(this.state.placing) / 2)
          return
        }
        const port = this.outPortAt(point)
        if (port) {
          this.gesture = { kind: 'link', from: port.id, at: point }
          return
        }
        const node = this.nodeAt(point)
        if (node) {
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
        if (this.hoverLink) {
          this.events.onUnlink(this.hoverLink.from, this.hoverLink.to)
          this.hoverLink = null
          return
        }
        this.gesture = { kind: 'pan', x: event.clientX, y: event.clientY, moved: false }
      },
      { signal },
    )

    canvas.addEventListener(
      'pointermove',
      (event) => {
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
          gesture.moved = true
          this.dragged = {
            id: gesture.id,
            x: Math.round((point.x - gesture.dx) / 8) * 8,
            y: Math.round((point.y - gesture.dy) / 8) * 8,
          }
          this.syncCards()
          canvas.style.cursor = 'grabbing'
          return
        }
        if (gesture?.kind === 'link') {
          gesture.at = point
          canvas.style.cursor = 'crosshair'
          return
        }
        if (this.state?.placing) {
          canvas.style.cursor = 'copy'
          return
        }
        this.hoverLink = this.nodeAt(point) ? null : this.linkAt(point)
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
      const gesture = this.gesture
      this.gesture = null
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      canvas.style.cursor = 'grab'
      if (!gesture || cancelled) {
        this.dragged = null
        return
      }
      const point = this.toWorld(event)
      if (gesture.kind === 'pan' && !gesture.moved) this.events.onEmptyTap()
      if (gesture.kind === 'node') {
        const node = this.nodes().find((entry) => entry.id === gesture.id)
        if (gesture.moved && this.dragged)
          this.events.onNodeMove(gesture.id, this.dragged.x, this.dragged.y)
        else if (node && inFooter(node, point)) this.events.onFooter(gesture.id)
        else this.events.onNodeTap(gesture.id)
        this.dragged = null
      }
      if (gesture.kind === 'link') {
        const target = this.nodeAt(point)
        if (target && target.id !== gesture.from) this.events.onLink(gesture.from, target.id)
      }
    }
    canvas.addEventListener('pointerup', (event) => finish(event, false), { signal })
    canvas.addEventListener('pointercancel', (event) => finish(event, true), { signal })
    canvas.addEventListener('pointerleave', () => (this.hoverLink = null), { signal })

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

  /* ---------- drawing ---------- */

  private syncCards(): void {
    const state = this.state
    if (!state) return
    const colors = palette()
    const live = new Set<string>()
    for (const node of this.nodes()) {
      live.add(node.id)
      let view = this.views.get(node.id)
      if (!view || view.type !== node.type) {
        view?.root.destroy({ children: true })
        view = new NodeView(node.type)
        this.views.set(node.id, view)
        this.cards.addChild(view.root)
      }
      view.update(state.game, node, state.ledger, state.selected === node.id, colors)
    }
    for (const [id, view] of this.views) {
      if (live.has(id)) continue
      view.root.destroy({ children: true })
      this.views.delete(id)
    }
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
    const frame = new Graphics()
    frame
      .roundRect(0, 0, CARD_W, height, RADIUS)
      .fill(colors.card)
      .stroke({ color: colors.accent, width: 2 })
    frame.roundRect(8, 7, 34, HEAD - 14, 4).fill(colors.well)
    const name = label(12.5, SANS, '600')
    name.text = COMPONENTS[type].name
    name.position.set(46, 7)
    const code = label(9.5, MONO, '600')
    code.text = COMPONENTS[type].code.toUpperCase()
    code.style.fill = colors.accent
    code.anchor.set(0.5)
    code.position.set(25, HEAD / 2)
    this.ghost.addChild(frame, name, code)
  }

  private animate(seconds: number): void {
    const state = this.state
    if (!state) return
    const colors = palette()
    this.phase += seconds
    const byId = new Map(this.nodes().map((node) => [node.id, node]))
    const rates = new Map(state.ledger.links.map((link) => [`${link.from}>${link.to}`, link]))

    this.wires.clear()
    this.packets.clear()
    this.overlay.clear()
    for (const link of state.game.links) {
      const from = byId.get(link.from)
      const to = byId.get(link.to)
      if (!from || !to) continue
      const curve = bezier(outPort(from), inPort(to))
      const flow = rates.get(`${link.from}>${link.to}`)
      const tap = COMPONENTS[to.type].tap
      const hovered = this.hoverLink?.from === link.from && this.hoverLink.to === link.to
      const busy = (flow?.rate ?? 0) > 0.01
      const color = hovered || flow?.failing ? colors.danger : busy ? colors.accent : colors.edge
      this.wires
        .moveTo(curve.a.x, curve.a.y)
        .bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.b.x, curve.b.y)
      this.wires.stroke({
        color,
        width: hovered ? 3 : busy ? 2 : 1.5,
        alpha: tap ? 0.5 : busy ? 0.55 : 0.8,
      })
      if (hovered) {
        const mid = pointOn(curve, 0.5)
        this.overlay.circle(mid.x, mid.y, 9).fill(colors.danger)
        this.overlay
          .moveTo(mid.x - 3.5, mid.y - 3.5)
          .lineTo(mid.x + 3.5, mid.y + 3.5)
          .moveTo(mid.x + 3.5, mid.y - 3.5)
          .lineTo(mid.x - 3.5, mid.y + 3.5)
        this.overlay.stroke({ color: colors.card, width: 2 })
      }
      if (!flow || !busy) continue
      const count = Math.min(9, Math.max(1, Math.round(Math.log2(1 + flow.rate) * 1.4)))
      const length = Math.hypot(curve.b.x - curve.a.x, curve.b.y - curve.a.y) + 60
      const speed = 150 / length
      const packet = tap ? colors.muted : KINDS[flow.kind].color
      for (let index = 0; index < count; index += 1) {
        const t = (this.phase * speed + index / count) % 1
        const at = pointOn(curve, t)
        this.packets.circle(at.x, at.y, 3)
      }
      this.packets.fill({ color: packet, alpha: tap ? 0.6 : 0.95 })
    }

    // The bottleneck: a pulsing outline on the one Node that costs the most revenue.
    const bottleneck = state.ledger.bottleneck ? byId.get(state.ledger.bottleneck) : undefined
    if (bottleneck) {
      const pulse = 0.45 + 0.4 * Math.abs(Math.sin(this.phase * 2.4))
      const pad = 5
      this.overlay
        .roundRect(
          bottleneck.x - pad,
          bottleneck.y - pad,
          CARD_W + pad * 2,
          heightOf(bottleneck.type) + pad * 2,
          RADIUS + pad,
        )
        .stroke({ color: colors.warn, width: 2.5, alpha: pulse })
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

    const gesture = this.gesture
    if (gesture?.kind === 'link') {
      const from = byId.get(gesture.from)
      if (from) {
        const target = this.nodeAt(gesture.at)
        const end = target && target.id !== from.id ? inPort(target) : gesture.at
        const curve = bezier(outPort(from), end)
        this.overlay
          .moveTo(curve.a.x, curve.a.y)
          .bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.b.x, curve.b.y)
        this.overlay.stroke({ color: colors.accent, width: 2.5 })
        this.overlay.circle(end.x, end.y, 5).fill(colors.accent)
        if (target && target.id !== from.id) {
          this.overlay
            .roundRect(
              target.x - 3,
              target.y - 3,
              CARD_W + 6,
              heightOf(target.type) + 6,
              RADIUS + 3,
            )
            .stroke({ color: colors.accent, width: 2 })
        }
      }
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
