import { Application, Container, Graphics, Point, Text, type TextStyleOptions } from 'pixi.js'
import { CANVAS, NODE_HEIGHT, NODE_WIDTH, type Design, type Node } from './model.ts'

/* ==========================================================================
   The design canvas is a PixiJS scene, not DOM.

   Nodes and links are drawn in a design space (CANVAS) and fitted to whatever
   the window gives us, so the diagram is a real pannable, zoomable plane.
   Foldkit owns the Model; this module owns pixels and reports gestures back
   as Messages.
   ========================================================================== */

export type DiagramEvents = Readonly<{
  onNodeTap: (nodeId: string) => void
  onNodeHover: (nodeId: string | null) => void
}>

export type DiagramState = Readonly<{
  design: Design
  hovered: string | null
  interactive: boolean
}>

/** Latest state each canvas should show. Written by update, read on mount so
 *  a canvas that appears mid-frame still draws the current Model. */
const desired = new Map<string, DiagramState>()
const controllers = new Map<string, DiagramController>()

export const setDesired = (key: string, state: DiagramState): void => {
  desired.set(key, state)
  controllers.get(key)?.draw(state)
}

/* ---------- token colours, resolved once through the DOM ---------- */

/** Paint one CSS colour into one pixel and read the bytes back. Chromium keeps
 *  modern colour spaces in computed values (`oklch(...)`), so text parsing is
 *  not reliable; the raster is. Created lazily: nothing here touches the DOM
 *  until a canvas actually draws. */
let pixelContext: CanvasRenderingContext2D | null | undefined

const paint = (): CanvasRenderingContext2D | null => {
  if (pixelContext === undefined) {
    const pixel = document.createElement('canvas')
    pixel.width = 1
    pixel.height = 1
    pixelContext = pixel.getContext('2d', { willReadFrequently: true })
  }
  return pixelContext
}

const toInt = (value: string): number => {
  const context = paint()
  if (!context) return 0
  context.fillStyle = '#000000'
  context.fillStyle = value
  context.clearRect(0, 0, 1, 1)
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
  return (r << 16) | (g << 8) | b
}

const colorCache = new Map<string, number>()

/** Lazily created: nothing touches the DOM until a canvas actually draws. */
let probe: HTMLSpanElement | null = null

const token = (name: string, fallback: string): number => {
  const cached = colorCache.get(name)
  if (cached !== undefined) return cached
  probe ??= document.createElement('span')
  probe.style.display = 'none'
  if (!probe.isConnected) document.body.append(probe)
  probe.style.color = `var(${name}, ${fallback})`
  const value = toInt(getComputedStyle(probe).color)
  colorCache.set(name, value)
  return value
}

export const palette = () => ({
  canvas: token('--canvas', '#f2f5f9'),
  grid: token('--canvas-grid', 'rgb(112 128 153 / 0.1)'),
  node: token('--node', '#ffffff'),
  border: token('--border', '#dce3ee'),
  edge: token('--edge', 'rgb(140 155 180 / 0.45)'),
  accent: token('--primary-strong', '#4f7fe0'),
  ink: token('--foreground', '#16233d'),
  muted: token('--muted', '#eef2f8'),
  mutedInk: token('--muted-foreground', '#5c6b85'),
  warn: token('--warn', '#c9871f'),
  danger: token('--danger', '#c0392b'),
  ok: token('--ok', '#2f8f5b'),
})

type Palette = ReturnType<typeof palette>

const digestOf = (state: DiagramState): string =>
  JSON.stringify([state.design, state.hovered, state.interactive])

type PointerDrag = { x: number; y: number; lastX: number; lastY: number; moved: boolean }

/* ---------- the controller ---------- */

class DiagramController {
  private readonly app = new Application()
  private readonly world = new Container()
  private readonly scene = new Container()
  private readonly packetLayer = new Container()
  private state: DiagramState | null = null
  private digest: string | null = null
  private readonly resizeObserver: ResizeObserver
  private readonly abort = new AbortController()
  private dragging: PointerDrag | null = null
  private phase = 0
  private started = false
  private destroyed = false

  constructor(
    private readonly host: HTMLElement,
    private readonly events: DiagramEvents,
  ) {
    this.resizeObserver = new ResizeObserver(() => this.fit())
  }

  async start(initial: DiagramState | undefined): Promise<void> {
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
    if (this.destroyed) {
      this.app.destroy(true, { children: true })
      return
    }
    // The faces are served by a stylesheet, so they are not loaded until the
    // DOM uses them. Pixi bakes text into textures; load them first.
    await Promise.all([
      document.fonts.load('600 13px "Space Grotesk"'),
      document.fonts.load('500 10px "JetBrains Mono"'),
    ]).catch(() => undefined)
    if (this.destroyed) {
      this.app.destroy(true, { children: true })
      return
    }
    this.host.append(this.app.canvas)
    this.app.stage.addChild(this.world)
    this.world.addChild(this.scene, this.packetLayer)
    this.bindPointer()
    this.app.ticker.add((ticker) => this.animate(ticker.deltaTime))
    this.started = true
    this.resizeObserver.observe(this.host)
    this.fit()
  }

  draw(state: DiagramState): void {
    const first = this.state === null
    this.state = state
    if (!this.started) return
    if (first) return this.fit()
    // Rebuilding the scene means re-baking every text texture, so skip the
    // draw when the Model change did not touch what the canvas shows.
    const digest = digestOf(state)
    if (digest === this.digest) return
    this.digest = digest
    this.render()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true
    this.abort.abort()
    this.resizeObserver.disconnect()
    // Before `init` resolves there is nothing to tear down; `start` finishes
    // the job when it sees the flag.
    if (this.started) this.app.destroy(true, { children: true })
  }

  /* ---------- geometry ---------- */

  private bounds() {
    const nodes = this.state?.design.nodes ?? []
    // An empty plane still needs a frame to draw its grid into.
    if (nodes.length === 0) return { x: 0, y: 0, width: CANVAS.width, height: CANVAS.height }
    const xs = nodes.map((n) => n.x)
    const ys = nodes.map((n) => n.y)
    const minX = Math.min(...xs, 0)
    const minY = Math.min(...ys, 0)
    const maxX = Math.max(...xs.map((x) => x + NODE_WIDTH), CANVAS.width)
    const maxY = Math.max(...ys.map((y) => y + NODE_HEIGHT), CANVAS.height)
    return { x: minX - 24, y: minY - 24, width: maxX - minX + 48, height: maxY - minY + 48 }
  }

  /** Fit the design to the host. Runs on mount and on every host resize, so
   *  it deliberately resets any pan and zoom the player applied. */
  private fit(): void {
    const { clientWidth: w, clientHeight: h } = this.host
    if (w === 0 || h === 0) return
    this.app.renderer.resize(w, h)
    const bounds = this.bounds()
    const scale = Math.min(w / bounds.width, h / bounds.height) * 0.94
    this.world.position.set(w / 2, h / 2)
    this.world.scale.set(scale)
    this.world.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
    this.digest = this.state ? digestOf(this.state) : null
    this.render()
  }

  /** Pan and zoom move the world without rebuilding it. The ticker repaints
   *  while packets are in flight; otherwise paint once by hand. */
  private repaint(): void {
    if (!this.app.ticker.started) this.app.render()
  }

  /* ---------- pointer ---------- */

  /** Screen point to design coordinates. Pixi owns the pan, zoom and pivot, so
   *  ask it to invert them: hand-rolling the maths forgot the pivot, and the
   *  hit regions drifted away from the Nodes they were meant to cover. */
  private toDesign(event: PointerEvent): { x: number; y: number } {
    const rect = this.host.getBoundingClientRect()
    const local = this.world.toLocal(new Point(event.clientX - rect.left, event.clientY - rect.top))
    return { x: local.x, y: local.y }
  }

  private nodeAt(point: { x: number; y: number }): Node | null {
    const nodes = this.state?.design.nodes ?? []
    return (
      nodes.findLast(
        (node) =>
          point.x >= node.x &&
          point.x <= node.x + NODE_WIDTH &&
          point.y >= node.y &&
          point.y <= node.y + NODE_HEIGHT,
      ) ?? null
    )
  }

  private bindPointer(): void {
    const canvas = this.app.canvas
    const { signal } = this.abort
    canvas.style.touchAction = 'none'
    let hovered: string | null = null
    const interactive = () => this.state?.interactive ?? false

    canvas.addEventListener(
      'pointermove',
      (event) => {
        const drag = this.dragging
        if (drag) {
          // A tap is allowed a little jitter; past this it is a pan.
          if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 4) return
          drag.moved = true
          this.world.position.x += event.clientX - drag.lastX
          this.world.position.y += event.clientY - drag.lastY
          drag.lastX = event.clientX
          drag.lastY = event.clientY
          this.repaint()
          return
        }
        if (!interactive()) return
        const node = this.nodeAt(this.toDesign(event))
        const id = node?.id ?? null
        canvas.style.cursor = node ? 'pointer' : 'grab'
        if (id !== hovered) {
          hovered = id
          this.events.onNodeHover(id)
        }
      },
      { signal },
    )

    canvas.addEventListener(
      'pointerdown',
      (event) => {
        if (!interactive() || event.button !== 0) return
        this.dragging = {
          x: event.clientX,
          y: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
          moved: false,
        }
        canvas.setPointerCapture(event.pointerId)
      },
      { signal },
    )

    const endDrag = (event: PointerEvent): PointerDrag | null => {
      const drag = this.dragging
      this.dragging = null
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      return drag
    }

    canvas.addEventListener(
      'pointerup',
      (event) => {
        const drag = endDrag(event)
        if (!drag || drag.moved) return
        const node = this.nodeAt(this.toDesign(event))
        if (node) this.events.onNodeTap(node.id)
      },
      { signal },
    )

    canvas.addEventListener('pointercancel', (event) => void endDrag(event), { signal })

    canvas.addEventListener(
      'pointerleave',
      () => {
        if (hovered !== null) {
          hovered = null
          this.events.onNodeHover(null)
        }
      },
      { signal },
    )

    canvas.addEventListener(
      'wheel',
      (event) => {
        if (!interactive()) return
        event.preventDefault()
        const rect = this.host.getBoundingClientRect()
        const factor = Math.exp(-event.deltaY * 0.0016)
        const scale = Math.min(3, Math.max(0.35, this.world.scale.x * factor))
        const next = scale / this.world.scale.x
        const px = event.clientX - rect.left
        const py = event.clientY - rect.top
        this.world.position.x = px - (px - this.world.position.x) * next
        this.world.position.y = py - (py - this.world.position.y) * next
        this.world.scale.set(scale)
        this.repaint()
      },
      { passive: false, signal },
    )
  }

  /* ---------- drawing ---------- */

  private animate(deltaTime: number): void {
    const packets = this.packetLayer.children
    if (packets.length === 0) return
    // deltaTime is 1 at 60 fps, so packets keep one speed on any display.
    this.phase = (this.phase + 0.008 * deltaTime) % 1
    const links = (this.state?.design.links ?? []).filter((link) => link.flow)
    links.forEach((link, index) => {
      const packet = packets[index]
      if (!packet) return
      const t = (this.phase + index * 0.33) % 1
      const point = this.curvePoint(link.from, link.to, t)
      packet.position.set(point.x, point.y)
    })
  }

  private curve(from: string, to: string) {
    const nodes = this.state?.design.nodes ?? []
    const source = nodes.find((n) => n.id === from)
    const target = nodes.find((n) => n.id === to)
    if (!source || !target) return null
    const start = { x: source.x + NODE_WIDTH, y: source.y + NODE_HEIGHT / 2 }
    const end = { x: target.x, y: target.y + NODE_HEIGHT / 2 }
    // Vertical neighbours prefer a stem-to-stem curve.
    if (Math.abs(source.x - target.x) < 8) {
      return {
        start: { x: source.x + NODE_WIDTH / 2, y: source.y + NODE_HEIGHT },
        end: { x: target.x + NODE_WIDTH / 2, y: target.y },
        c1: { x: source.x + NODE_WIDTH / 2, y: source.y + NODE_HEIGHT + 60 },
        c2: { x: target.x + NODE_WIDTH / 2, y: target.y - 60 },
      }
    }
    return {
      start,
      end,
      c1: { x: start.x + 34, y: start.y },
      c2: { x: end.x - 34, y: end.y },
    }
  }

  private curvePoint(from: string, to: string, t: number): { x: number; y: number } {
    const curve = this.curve(from, to)
    if (!curve) return { x: 0, y: 0 }
    const inv = 1 - t
    return {
      x:
        inv ** 3 * curve.start.x +
        3 * inv ** 2 * t * curve.c1.x +
        3 * inv * t ** 2 * curve.c2.x +
        t ** 3 * curve.end.x,
      y:
        inv ** 3 * curve.start.y +
        3 * inv ** 2 * t * curve.c1.y +
        3 * inv * t ** 2 * curve.c2.y +
        t ** 3 * curve.end.y,
    }
  }

  private label(text: string, style: TextStyleOptions): Text {
    return new Text({ text, style: { fontFamily: 'JetBrains Mono', ...style } })
  }

  private render(): void {
    if (this.destroyed || !this.state) return
    const colors = palette()
    this.scene.removeChildren().forEach((child) => child.destroy({ children: true }))
    this.packetLayer.removeChildren().forEach((child) => child.destroy({ children: true }))

    const { design, hovered, interactive } = this.state

    this.scene.addChild(this.grid(colors))

    for (const link of design.links) {
      const curve = this.curve(link.from, link.to)
      if (!curve) continue
      const stroke = new Graphics()
      stroke.moveTo(curve.start.x, curve.start.y)
      stroke.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.end.x, curve.end.y)
      stroke.stroke({
        width: link.active ? 2 : 1.5,
        color: link.active ? colors.accent : colors.edge,
        alpha: link.active ? 1 : 0.9,
      })
      this.scene.addChild(stroke)
      if (link.flow) {
        const packet = new Graphics()
        packet.circle(0, 0, 3.2).fill({ color: colors.accent })
        this.packetLayer.addChild(packet)
      }
      const joint = new Graphics()
      joint
        .circle(curve.end.x, curve.end.y, 2.5)
        .fill({ color: link.active ? colors.accent : colors.edge })
      this.scene.addChild(joint)
    }

    for (const node of design.nodes) {
      this.drawNode(node, colors, {
        selected: design.selected === node.id,
        hovered: hovered === node.id,
        interactive,
      })
    }

    // A diagram with nothing in flight is a still image: park the ticker and
    // paint once, instead of spending every frame redrawing the same scene.
    if (design.links.some((link) => link.flow)) {
      this.app.ticker.start()
    } else {
      this.app.ticker.stop()
      this.app.render()
    }
  }

  private grid(colors: Palette): Graphics {
    const bounds = this.bounds()
    const grid = new Graphics()
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 24) {
      grid.moveTo(x, bounds.y).lineTo(x, bounds.y + bounds.height)
    }
    for (let y = bounds.y; y < bounds.y + bounds.height; y += 24) {
      grid.moveTo(bounds.x, y).lineTo(bounds.x + bounds.width, y)
    }
    grid.stroke({ width: 1, color: colors.grid, alpha: 0.55 })
    return grid
  }

  private drawNode(
    node: Node,
    colors: Palette,
    flags: { selected: boolean; hovered: boolean; interactive: boolean },
  ): void {
    const tone = {
      ok: colors.accent,
      warn: colors.warn,
      danger: colors.danger,
      down: colors.danger,
    }[node.state]

    const card = new Graphics()
    card.rect(node.x, node.y, NODE_WIDTH, NODE_HEIGHT).fill({ color: colors.node })
    card.stroke({
      width: node.state === 'ok' ? 1 : 1.4,
      color: node.state === 'ok' ? colors.border : tone,
      alpha: node.state === 'down' ? 0.7 : 1,
    })
    this.scene.addChild(card)

    if (flags.selected || flags.hovered) {
      const ring = new Graphics()
      ring.rect(node.x - 3, node.y - 3, NODE_WIDTH + 6, NODE_HEIGHT + 6)
      ring.stroke({ width: 2, color: colors.accent })
      this.scene.addChild(ring)
    }

    const rail = new Graphics()
    rail.rect(node.x, node.y + 10, 3, NODE_HEIGHT - 20).fill({
      color: node.family === 'managed' ? colors.mutedInk : colors.accent,
      alpha: node.family === 'managed' ? 0.55 : 1,
    })
    this.scene.addChild(rail)

    const name = new Text({
      text: node.name,
      style: {
        fontFamily: 'Space Grotesk',
        fontWeight: '600',
        fontSize: 13,
        fill: colors.ink,
      },
    })
    name.position.set(node.x + 12, node.y + 8)
    if (node.state === 'down') name.alpha = 0.65
    this.scene.addChild(name)

    const replica = this.label(`×${node.replicas}`, { fontSize: 10, fill: colors.mutedInk })
    replica.position.set(node.x + NODE_WIDTH - 18 - replica.width, node.y + 9)
    this.scene.addChild(replica)

    const meta = this.label(node.meta.toUpperCase(), {
      fontSize: 9,
      letterSpacing: 0.5,
      fill: colors.mutedInk,
    })
    meta.position.set(node.x + 12, node.y + 27)
    this.scene.addChild(meta)

    const track = new Graphics()
    track.rect(node.x + 12, node.y + 42, NODE_WIDTH - 24, 4).fill({ color: colors.muted })
    if (node.util > 0) {
      track
        .rect(node.x + 12, node.y + 42, ((NODE_WIDTH - 24) * node.util) / 100, 4)
        .fill({ color: tone })
    }
    this.scene.addChild(track)

    const traffic = this.label(`${node.inbound} / ${node.capacity} rps`, {
      fontSize: 10,
      fill: colors.mutedInk,
    })
    traffic.position.set(node.x + 12, node.y + NODE_HEIGHT - 20)
    this.scene.addChild(traffic)

    const usage = this.label(node.state === 'down' ? '100% err' : `${node.util}%`, {
      fontSize: 10,
      fill: node.state === 'ok' ? colors.ink : tone,
      fontWeight: '500',
    })
    usage.position.set(node.x + NODE_WIDTH - 12 - usage.width, node.y + NODE_HEIGHT - 20)
    this.scene.addChild(usage)
  }
}

/* ---------- public API ---------- */

/** Create the controller for one host element and begin starting it. Returns
 *  the teardown. Construction is synchronous, so a Mount can register the
 *  teardown atomically; the async renderer start is cancelled by `destroy`. */
export const attachDiagram = (
  key: string,
  host: HTMLElement,
  events: DiagramEvents,
): (() => void) => {
  const controller = new DiagramController(host, events)
  controllers.set(key, controller)
  controller.start(desired.get(key)).catch((error: unknown) => {
    console.error(`Quorum: the "${key}" canvas failed to start`, error)
  })
  return () => {
    controller.destroy()
    // A newer canvas may already own the key; only drop our own entry.
    if (controllers.get(key) === controller) controllers.delete(key)
  }
}
