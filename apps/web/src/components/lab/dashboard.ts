import { DashboardMessage } from '@/game/dashboard.ts'
import type { Html, HtmlBuilder } from 'foldkit/html'
import { ChevronDown, Clock3, LayoutGrid, RefreshCw, Star, X } from 'lucide'
import { clockOf } from '@quorum/simulation/calendar'
import {
  COMPONENTS,
  INCIDENTS,
  KINDS,
  type Kind,
  type ResearchId,
} from '@quorum/simulation/catalog'
import { ERROR_CAUSES } from '@quorum/simulation/distribution'
import type { Ledger } from '@quorum/simulation/ledger'
import { eraOf, has } from '@quorum/simulation/lookups'
import { budgetOf } from '@quorum/simulation/slo'
import type { Sample } from '@quorum/simulation/state'
import { type Field, TIERS, type Tier, startOf } from '@/game/history.ts'
import { compact, money, ms } from '@quorum/ui/game/format'
import { Message } from '@/game/message.ts'
import { type Model, ledgerOf } from '@/game/model.ts'
import { icon } from '@quorum/ui/primitives/icon'
import { cn } from '@/lib/utils'
import { button } from '@quorum/ui/primitives/button'
import { Pie, PieChart } from '@quorum/ui/primitives/chart-core'
import {
  Area,
  type CartesianChild,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from '@quorum/ui/primitives/composed-chart'
import { FIGURE, PANEL, SCROLL, WELL } from '@quorum/ui/game/bits'

/* ==========================================================================
   The Dashboard (12 "The Dashboard"): the Design over time, as a full page
   like Research, styled after a Grafana board in the game's own tokens, so
   it follows the theme. Panels vary the way Grafana's do: stats, gauges, LCD bar gauges, a state timeline, time
   series with gradient fills, a pie, and a table with coloured cells.
   ========================================================================== */

/** Time ranges in calendar minutes: up to 10 hours read the Game's one-minute Samples, longer
    ones the 15-minute and 1-hour blocks (12 "History and resolution"). */
export const DASHBOARD_RANGES = [60, 360, 1440, 10_080, 43_200] as const

/** Utilization history is one point per 10 sim seconds (update.ts). */
const NODE_EVERY = 10

/* The series palette: the game's own hues, so the Dashboard matches the Board. */
const BLUE = 'var(--group-edge)'
const PURPLE = 'var(--group-compute)'
const TEAL = 'var(--group-data)'
const PINK = 'var(--group-ops)'
const GREEN = 'var(--ok)'
const AMBER = 'var(--warn)'
const RED = 'var(--danger)'
const MUTED = 'var(--muted-foreground)'

type Level = 'ok' | 'warn' | 'danger'
const LEVEL_COLOR: Record<Level, string> = { ok: GREEN, warn: AMBER, danger: RED }

/** Grafana's thresholds: a value at or above `warn` is amber, at or above `danger` red. */
type Thresholds = Readonly<{ warn: number; danger: number; invert?: boolean }>
const levelOf = (value: number, thresholds: Thresholds): Level =>
  thresholds.invert
    ? value <= thresholds.danger
      ? 'danger'
      : value <= thresholds.warn
        ? 'warn'
        : 'ok'
    : value >= thresholds.danger
      ? 'danger'
      : value >= thresholds.warn
        ? 'warn'
        : 'ok'

const hhmm = (time: number): string => {
  const { hour, minute } = clockOf(time)
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const percent = (share: number, digits = 0): string => `${(share * 100).toFixed(digits)}%`

type Row = Readonly<Record<string, number | string>>

/* ==========================================================================
   Data
   ========================================================================== */

/** The resolution a range reads: one-minute Samples, then 15-minute blocks, then 1-hour blocks. */
const tierOf = (range: number): Tier | null =>
  range <= 600 ? null : range <= 10_080 ? 'quarter' : 'hour'

/** A row's label: the clock, and the calendar day when the range spans days. */
const labelOf = (time: number, range: number): string =>
  range > 1440 ? `D${clockOf(time).day} ${hhmm(time)}` : hhmm(time)

/**
 * The rows in range, each with its label, its start in sim time (`at`), its length in calendar
 * minutes (`span`), and its figures. A block row draws the mean of each field, except p99,
 * which draws the worst minute: a block's mean p99 would hide the spike the tail is about.
 */
const rowsOf = (model: Model, slo: number): ReadonlyArray<Row> => {
  const range = model.board.dashboard.range
  const tier = tierOf(range)
  const figures = (value: (field: Field) => number, at: number, span: number): Row => ({
    t: labelOf(at, range),
    at,
    span,
    users: value('users'),
    demand: value('demand'),
    served: value('served'),
    latency: value('latency'),
    p99: value('p99'),
    apdex: value('apdex'),
    errors: value('errors') * 100,
    revenue: value('revenue'),
    burn: value('burn'),
    burnRate: value('errors') / (1 - slo),
  })
  if (tier === null) {
    const history = model.board.game.history
    const last = Math.floor(model.board.game.time)
    const kept = history.slice(Math.max(0, history.length - range))
    return kept.map((sample: Sample, index) =>
      figures((field) => sample[field], last - (kept.length - 1 - index), 1),
    )
  }
  const { minutes } = TIERS[tier]
  const blocks = model.board.dashboard.history[tier]
  return blocks
    .slice(Math.max(0, blocks.length - Math.ceil(range / minutes)))
    .map((block) =>
      figures(
        (field) =>
          field === 'p99' ? (block.max[field] ?? 0) : (block.sum[field] ?? 0) / block.count,
        startOf(block.index, tier),
        minutes,
      ),
    )
}

/** The label of the row a sim time falls in, if the range holds it. */
const labelAt = (rows: ReadonlyArray<Row>, time: number): string | null => {
  const row = rows.find(
    (entry) => Number(entry.at) <= time && time < Number(entry.at) + Number(entry.span),
  )
  return row ? String(row.t) : null
}

type NodeTrack = Readonly<{ id: string; name: string; values: ReadonlyArray<number> }>

/** Utilization per Node from the Model's 10-second history, with numbered names. */
const tracksOf = (model: Model): ReadonlyArray<NodeTrack> => {
  const names = new Map<string, number>()
  return model.board.game.nodes
    .filter((node) => node.type !== 'users')
    .map((node) => {
      const base = COMPONENTS[node.type].name
      const count = (names.get(base) ?? 0) + 1
      names.set(base, count)
      return {
        id: node.id,
        name: count > 1 ? `${base} ${count}` : base,
        values: (model.board.nodeHistory[node.id] ?? []).map((sample) => sample.utilization),
      }
    })
}

/* ==========================================================================
   Panel chrome
   ========================================================================== */

/** A status lamp, lit in its colour, like the dot on a Node card's icon. */
const led = (color: string, h: HtmlBuilder<Message>): Html =>
  h.span(
    [
      h.Class('size-[7px] shrink-0 rounded-full'),
      h.Style({
        background: color,
        boxShadow: `0 0 0 2px color-mix(in oklab, ${color} 22%, transparent), 0 0 6px color-mix(in oklab, ${color} 55%, transparent)`,
      }),
    ],
    [],
  )

/** A sunken display inside a panel: the well recipe, where every plot sits. */
const SCREEN = 'rounded-xl bg-well shadow-well'

/** A Grafana panel as a Board card: raised, with a lamp and a title. `tint` is Grafana's background colour mode. */
const panel = (
  key: string,
  span: string,
  title: string,
  unit: string,
  body: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
  tint: Level | null = null,
  accent: string = MUTED,
): Html =>
  h.div(
    [
      h.Key(key),
      h.Class(
        cn(
          'flex min-w-0 flex-col gap-1.5 rounded-2xl bg-surface p-1.5 shadow-card compact:col-span-24',
          span,
        ),
      ),
      ...(tint
        ? [
            h.Style({
              background: `linear-gradient(to bottom, color-mix(in oklab, ${LEVEL_COLOR[tint]} 16%, var(--card)), var(--card) 64px)`,
            }),
          ]
        : []),
    ],
    [
      h.div(
        [h.Class('flex h-6 shrink-0 items-center gap-2 px-1.5')],
        [
          led(tint ? LEVEL_COLOR[tint] : accent, h),
          h.span([h.Class('truncate text-[12.5px] font-semibold tracking-[-0.01em]')], [title]),
          unit
            ? h.span([h.Class(cn(FIGURE, 'truncate text-[10.5px] text-muted-foreground'))], [unit])
            : h.empty,
        ],
      ),
      ...body,
    ],
  )

/** A panel the player has not researched yet. */
const locked = (
  key: string,
  span: string,
  title: string,
  research: ResearchId,
  h: HtmlBuilder<Message>,
): Html =>
  panel(
    key,
    span,
    title,
    '',
    [
      h.div(
        [
          h.Class(
            cn(
              SCREEN,
              'grid min-h-[120px] flex-1 place-items-center bg-[repeating-linear-gradient(135deg,transparent_0_7px,var(--hairline)_7px_8px)]',
            ),
          ),
        ],
        [
          h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'rounded-lg bg-raised px-2.5 py-1 text-[11px] text-muted-foreground shadow-raised',
                ),
              ),
            ],
            [`No data · research ${research}`],
          ),
        ],
      ),
    ],
    h,
  )

/** A Grafana row header. */
const rowHeader = (label: string, count: number, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Key(`row-${label}`), h.Class('col-span-24 flex items-center gap-1.5 pt-3 pb-0.5')],
    [
      icon(h, ChevronDown, 'size-3.5 text-muted-foreground'),
      h.span([h.Class('text-[13px] font-semibold')], [label]),
      h.span([h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))], [`(${count} panels)`]),
    ],
  )

/* ==========================================================================
   Time series
   ========================================================================== */

/** Chart text in the game's figure face; only foldcn's hover bands take the pointer, not the fills drawn over them. */
const PLOT =
  '[&_text]:font-mono [&_text]:text-[10px] [&_text]:fill-[var(--muted-foreground)] [&_text]:tracking-[-0.01em] [&_path]:pointer-events-none [&_line]:pointer-events-none [&_text]:pointer-events-none'

/** Lifts a marker's label from the bottom of the plot to its top. */
const TOP_OF_PLOT = -150

/** Design changes from the undo stack and the open Incident, as labelled vertical markers. */
const markersOf = (model: Model, rows: ReadonlyArray<Row>): ReadonlyArray<CartesianChild> => {
  const changes = model.board.undo
    .flatMap((entry) => {
      const t = labelAt(rows, Math.floor(entry.at))
      return t === null ? [] : [{ t, label: entry.label }]
    })
    .map((mark) =>
      ReferenceLine({
        x: mark.t,
        stroke: BLUE,
        strokeDasharray: '3 3',
        label: { value: mark.label, dx: 4, dy: TOP_OF_PLOT, fill: BLUE },
      }),
    )
  const incident = model.board.game.incident
  const at = incident ? labelAt(rows, Math.floor(incident.startedAt)) : null
  const open =
    incident && at !== null
      ? [
          ReferenceLine({
            x: at,
            stroke: RED,
            strokeDasharray: '3 3',
            label: {
              value: `▲ ${INCIDENTS[incident.kind].name}`,
              dx: 4,
              dy: TOP_OF_PLOT,
              fill: RED,
            },
          }),
        ]
      : []
  return [...changes, ...open]
}

type Series = Readonly<{
  key: string
  name: string
  color: string
  /** Fill under the line with a fading gradient, as Grafana's opacity gradient mode. */
  fill?: boolean
  dashed?: boolean
}>

type SeriesSpec = Readonly<{
  key: string
  span: string
  title: string
  unit: string
  series: ReadonlyArray<Series>
  format: (value: number) => string
  rules?: ReadonlyArray<Readonly<{ y: number; label: string; color: string }>>
  domain?: readonly [number, number]
  width?: number
}>

const gradient = (id: string, color: string, h: HtmlBuilder<Message>): Html =>
  h.linearGradient(
    [
      h.Id(id),
      h.Attribute('x1', '0'),
      h.Attribute('y1', '0'),
      h.Attribute('x2', '0'),
      h.Attribute('y2', '1'),
    ],
    [
      h.stop(
        [
          h.Attribute('offset', '0%'),
          h.Attribute('stop-color', color),
          h.Attribute('stop-opacity', '0.45'),
        ],
        [],
      ),
      h.stop(
        [
          h.Attribute('offset', '100%'),
          h.Attribute('stop-color', color),
          h.Attribute('stop-opacity', '0'),
        ],
        [],
      ),
    ],
  )

/** The legend under a time series, in Grafana's list mode: swatch, name, mean, max, last. */
const seriesLegend = (
  rows: ReadonlyArray<Row>,
  spec: SeriesSpec,
  hovered: Row | undefined,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class('flex flex-wrap gap-x-4 gap-y-0.5 px-1.5 pb-0.5 text-[11px]')],
    [
      ...(hovered
        ? [h.span([h.Key('at'), h.Class(cn(FIGURE, 'text-muted-foreground'))], [String(hovered.t)])]
        : []),
      ...spec.series.map((series) => {
        const values = rows.map((row) => Number(row[series.key]))
        const last = values[values.length - 1] ?? 0
        const max = Math.max(...values)
        const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
        return h.span(
          [h.Key(series.key), h.Class('flex items-center gap-1.5 whitespace-nowrap')],
          [
            h.span(
              [h.Class('h-[3px] w-3.5 rounded-full'), h.Style({ background: series.color })],
              [],
            ),
            h.span([h.Class('text-foreground')], [series.name]),
            h.span(
              [h.Class(cn(FIGURE, 'text-muted-foreground'))],
              hovered
                ? [spec.format(Number(hovered[series.key]))]
                : [`mean ${spec.format(mean)}  max ${spec.format(max)}  last ${spec.format(last)}`],
            ),
          ],
        )
      }),
    ],
  )

const timeSeries = (
  model: Model,
  rows: ReadonlyArray<Row>,
  markers: ReadonlyArray<CartesianChild>,
  spec: SeriesSpec,
  h: HtmlBuilder<Message>,
): Html => {
  const hovered =
    model.board.dashboard.hover !== null ? rows[model.board.dashboard.hover] : undefined
  const id = (series: Series) => `fill-${spec.key}-${series.key}`
  return panel(
    spec.key,
    spec.span,
    spec.title,
    spec.unit,
    [
      h.div(
        [h.Class(cn(SCREEN, 'min-h-0 flex-1 px-1 pt-1'))],
        [
          ComposedChart(
            {
              data: rows,
              responsive: true,
              width: spec.width ?? 760,
              height: 210,
              margin: { top: 10, right: 12, bottom: 0, left: 2 },
              title: spec.title,
              className: PLOT,
              accessibilityLayer: true,
              activeIndex: model.board.dashboard.hover,
              onActiveIndexChange: (index) =>
                Message.DashboardChanged({ message: DashboardMessage.Hovered({ index }) }),
              defs: spec.series
                .filter((series) => series.fill)
                .map((series) => gradient(id(series), series.color, h)),
              children: [
                CartesianGrid({ stroke: 'var(--hairline)' }),
                XAxis({
                  dataKey: 't',
                  interval: Math.max(0, Math.ceil(rows.length / ((spec.width ?? 760) / 70)) - 1),
                  padding: { left: 32 },
                  // Ends the right-most label at the plot edge, so the well does not clip it.
                  tick: ({ x, y, value }) =>
                    h.text(
                      [
                        h.Attribute('x', String(x)),
                        h.Attribute('y', String(y - 14)),
                        h.Attribute('text-anchor', x + 30 > (spec.width ?? 760) ? 'end' : 'middle'),
                      ],
                      [String(value)],
                    ),
                  stroke: 'var(--hairline)',
                }),
                YAxis({
                  width: 58,
                  tickCount: 5,
                  ...(spec.domain ? { domain: spec.domain } : {}),
                  tickFormatter: (value) => spec.format(Number(value)),
                  stroke: 'transparent',
                }),
                Tooltip({ content: 'none' }),
                ...(spec.rules ?? []).map((rule) =>
                  ReferenceLine({
                    y: rule.y,
                    stroke: rule.color,
                    strokeDasharray: '6 4',
                    label: { value: rule.label, dy: -6, fill: rule.color },
                  }),
                ),
                ...markers,
                ...(hovered
                  ? [
                      ReferenceLine({
                        x: String(hovered.t),
                        stroke: 'var(--foreground)',
                        strokeOpacity: 0.4,
                      }),
                    ]
                  : []),
                ...spec.series.map((series) =>
                  series.fill
                    ? Area({
                        dataKey: series.key,
                        name: series.name,
                        stroke: series.color,
                        strokeWidth: 1.5,
                        fill: `url(#${id(series)})`,
                        fillOpacity: 1,
                        type: 'linear',
                      })
                    : Line({
                        dataKey: series.key,
                        name: series.name,
                        stroke: series.color,
                        strokeWidth: 1.5,
                        type: 'linear',
                        dot: false,
                        activeDot: { r: 3, fill: series.color, stroke: 'var(--card)' },
                        ...(series.dashed ? { strokeDasharray: '4 3' } : {}),
                      }),
                ),
              ],
            },
            h,
          ),
        ],
      ),
      seriesLegend(rows, spec, hovered, h),
    ],
    h,
    null,
    spec.series[0]?.color,
  )
}

/* ==========================================================================
   Stat and gauge
   ========================================================================== */

/** The top of a sparkline's scale: room above the peak, so a flat history is a line, not a slab. */
const sparkTop = (rows: ReadonlyArray<Row>, key: string): number =>
  Math.max(1e-9, ...rows.map((row) => Number(row[key]))) * 1.6

/** Grafana's stat panel: one big coloured value over a sparkline of its history. */
const stat = (
  key: string,
  title: string,
  value: string,
  level: Level | 'plain',
  rows: ReadonlyArray<Row>,
  dataKey: string,
  color: string,
  h: HtmlBuilder<Message>,
  background = false,
): Html =>
  panel(
    key,
    'col-span-4 compact:col-span-12',
    title,
    '',
    [
      h.div(
        [
          h.Class(
            cn(SCREEN, 'relative flex min-h-[92px] flex-1 flex-col justify-end overflow-hidden'),
          ),
          ...(background && level !== 'plain' && level !== 'ok'
            ? [
                h.Style({
                  background: `color-mix(in oklab, ${LEVEL_COLOR[level]} 18%, var(--well))`,
                }),
              ]
            : []),
        ],
        [
          h.div(
            [h.Class('absolute inset-x-0 bottom-0 h-[46px] opacity-90')],
            [
              ComposedChart(
                {
                  data: rows,
                  responsive: true,
                  width: 260,
                  height: 46,
                  margin: { top: 0, right: 0, bottom: 0, left: 0 },
                  defs: [gradient(`stat-${key}`, color, h)],
                  children: [
                    XAxis({ dataKey: 't', hide: true }),
                    YAxis({ hide: true, domain: [0, sparkTop(rows, dataKey)] }),
                    Area({
                      dataKey,
                      stroke: color,
                      strokeWidth: 1.25,
                      fill: `url(#stat-${key})`,
                      fillOpacity: 1,
                      type: 'linear',
                    }),
                  ],
                },
                h,
              ),
            ],
          ),
          h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'relative px-3 pb-7 text-[30px] leading-none font-medium tracking-[-0.03em] [text-shadow:0_1px_0_var(--highlight)]',
                ),
              ),
              h.Style({ color: level === 'plain' ? 'var(--foreground)' : LEVEL_COLOR[level] }),
            ],
            [value],
          ),
        ],
      ),
    ],
    h,
    null,
    level === 'plain' ? color : LEVEL_COLOR[level],
  )

/** A point on a circle, for the gauge arcs; 0° points right and angles grow clockwise. */
const point = (cx: number, cy: number, r: number, degrees: number): string => {
  const radians = (degrees * Math.PI) / 180
  return `${(cx + r * Math.cos(radians)).toFixed(2)} ${(cy + r * Math.sin(radians)).toFixed(2)}`
}
const arc = (cx: number, cy: number, r: number, from: number, to: number): string =>
  `M ${point(cx, cy, r, from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${point(cx, cy, r, to)}`

/** Grafana's gauge: a 240° arc with the threshold bands drawn as a thin outer ring. */
const gauge = (
  key: string,
  title: string,
  share: number,
  label: string,
  thresholds: Thresholds,
  h: HtmlBuilder<Message>,
): Html => {
  const START = 150
  const SWEEP = 240
  const at = (value: number) => START + SWEEP * Math.min(1, Math.max(0, value))
  const level = levelOf(share, thresholds)
  const bands: ReadonlyArray<readonly [number, number, Level]> = thresholds.invert
    ? [
        [0, thresholds.danger, 'danger'],
        [thresholds.danger, thresholds.warn, 'warn'],
        [thresholds.warn, 1, 'ok'],
      ]
    : [
        [0, thresholds.warn, 'ok'],
        [thresholds.warn, thresholds.danger, 'warn'],
        [thresholds.danger, 1, 'danger'],
      ]
  return panel(
    key,
    'col-span-4 compact:col-span-12',
    title,
    '',
    [
      h.div(
        [h.Class(cn(SCREEN, 'grid flex-1 place-items-center px-2 pt-2'))],
        [
          h.svg(
            [h.ViewBox('0 0 200 140'), h.Class('h-[112px] w-full max-w-[220px]')],
            [
              ...bands.map(([from, to, band]) =>
                h.path(
                  [
                    h.Key(band),
                    h.Attribute('d', arc(100, 92, 84, at(from) + 0.6, at(to) - 0.6)),
                    h.Attribute('fill', 'none'),
                    h.Attribute('stroke', LEVEL_COLOR[band]),
                    h.Attribute('stroke-width', '3'),
                  ],
                  [],
                ),
              ),
              h.path(
                [
                  h.Attribute('d', arc(100, 92, 70, START, START + SWEEP)),
                  h.Attribute('fill', 'none'),
                  h.Attribute('stroke', 'var(--hairline)'),
                  h.Attribute('stroke-width', '16'),
                ],
                [],
              ),
              share > 0.002
                ? h.path(
                    [
                      h.Attribute('d', arc(100, 92, 70, START, at(share))),
                      h.Attribute('fill', 'none'),
                      h.Attribute('stroke', LEVEL_COLOR[level]),
                      h.Attribute('stroke-width', '16'),
                    ],
                    [],
                  )
                : h.empty,
              h.text(
                [
                  h.Attribute('x', '100'),
                  h.Attribute('y', '100'),
                  h.Attribute('text-anchor', 'middle'),
                  h.Attribute('fill', LEVEL_COLOR[level]),
                  h.Class('font-mono text-[30px] font-medium tracking-[-0.03em]'),
                ],
                [label],
              ),
            ],
          ),
        ],
      ),
    ],
    h,
    null,
    LEVEL_COLOR[level],
  )
}

/* ==========================================================================
   Bar gauge, state timeline, pie, and table
   ========================================================================== */

const UTILIZATION: Thresholds = { warn: 0.7, danger: 0.9 }
const CELLS = 32

/** Grafana's retro LCD bar gauge: lit cells take the colour of the threshold they sit in. */
const lcd = (share: number, h: HtmlBuilder<Message>, cells = CELLS): Html =>
  h.div(
    [h.Class('flex h-full min-w-0 flex-1 gap-[2px] rounded-md bg-well p-[3px] shadow-well')],
    Array.from({ length: cells }, (_, index) => {
      const position = (index + 0.5) / cells
      const lit = position <= Math.min(share, 1)
      return h.span(
        [
          h.Key(String(index)),
          h.Class('min-w-0 flex-1 rounded-[2px]'),
          h.Style({
            background: lit
              ? LEVEL_COLOR[levelOf(position, UTILIZATION)]
              : `color-mix(in oklab, ${LEVEL_COLOR[levelOf(position, UTILIZATION)]} 10%, transparent)`,
          }),
        ],
        [],
      )
    }),
  )

const barGauge = (
  ledger: Ledger,
  tracks: ReadonlyArray<NodeTrack>,
  h: HtmlBuilder<Message>,
): Html =>
  panel(
    'bar-gauge',
    'col-span-8',
    'Utilization now',
    '% of capacity',
    [
      h.div(
        [h.Class(cn(SCREEN, 'flex flex-1 flex-col justify-center gap-2.5 p-3'))],
        tracks.map((track) => {
          const share = ledger.nodes[track.id]?.utilization ?? 0
          return h.div(
            [h.Key(track.id), h.Class('flex flex-col gap-1')],
            [
              h.div(
                [h.Class('flex items-baseline justify-between text-[11.5px]')],
                [
                  h.span([h.Class('text-muted-foreground')], [track.name]),
                  h.span(
                    [
                      h.Class(cn(FIGURE, 'text-[13px]')),
                      h.Style({ color: LEVEL_COLOR[levelOf(share, UTILIZATION)] }),
                    ],
                    [percent(Math.min(share, 9.99))],
                  ),
                ],
              ),
              h.div([h.Class('flex h-5')], [lcd(share, h)]),
            ],
          )
        }),
      ),
    ],
    h,
  )

const STATE_LABEL: Record<Level, string> = { ok: 'OK', warn: 'HIGH', danger: 'SATURATED' }

/** Grafana's state timeline: one lane per Node, a block per run of the same state. */
const stateTimeline = (
  model: Model,
  tracks: ReadonlyArray<NodeTrack>,
  h: HtmlBuilder<Message>,
): Html => {
  const length = Math.max(1, ...tracks.map((track) => track.values.length))
  const last = Math.floor(model.board.game.time / NODE_EVERY) * NODE_EVERY
  const first = last - (length - 1) * NODE_EVERY
  const runs = (values: ReadonlyArray<number>) => {
    const out: Array<{ level: Level; from: number; to: number }> = []
    const offset = length - values.length
    values.forEach((value, index) => {
      const level = levelOf(value, UTILIZATION)
      const run = out[out.length - 1]
      if (run && run.level === level) run.to = offset + index + 1
      else out.push({ level, from: offset + index, to: offset + index + 1 })
    })
    return out
  }
  return panel(
    'state-timeline',
    'col-span-16',
    'Node state',
    'utilization · last 24 h',
    [
      h.div(
        [h.Class(cn(SCREEN, 'flex flex-1 flex-col justify-center gap-1.5 p-3'))],
        [
          ...tracks.map((track) =>
            h.div(
              [h.Key(track.id), h.Class('flex items-center gap-3')],
              [
                h.span(
                  [h.Class('w-28 shrink-0 truncate text-[11.5px] text-muted-foreground')],
                  [track.name],
                ),
                h.div(
                  [
                    h.Class(
                      'relative h-7 min-w-0 flex-1 overflow-hidden rounded-md bg-card shadow-[inset_0_0_0_1px_var(--hairline)]',
                    ),
                  ],
                  runs(track.values).map((run, index) =>
                    h.div(
                      [
                        h.Key(String(index)),
                        h.Class(
                          cn(
                            FIGURE,
                            'absolute inset-y-[3px] flex items-center overflow-hidden rounded-[3px] px-1.5 text-[10px] font-medium whitespace-nowrap text-black/70 shadow-[inset_0_1px_0_oklch(1_0_0/0.35)]',
                          ),
                        ),
                        h.Style({
                          left: `calc(${(run.from / length) * 100}% + 1px)`,
                          width: `calc(${((run.to - run.from) / length) * 100}% - 2px)`,
                          background: LEVEL_COLOR[run.level],
                        }),
                        h.Title(`${track.name}: ${STATE_LABEL[run.level]}`),
                      ],
                      [(run.to - run.from) / length > 0.08 ? STATE_LABEL[run.level] : ''],
                    ),
                  ),
                ),
              ],
            ),
          ),
          h.div(
            [
              h.Class(
                cn(FIGURE, 'flex justify-between pl-[124px] text-[10px] text-muted-foreground'),
              ),
            ],
            [
              h.span([], [hhmm(first)]),
              h.span([], [hhmm(first + (last - first) / 2)]),
              h.span([], [hhmm(last)]),
            ],
          ),
        ],
      ),
    ],
    h,
  )
}

const kindColor = (kind: Kind): string => `#${KINDS[kind].color.toString(16).padStart(6, '0')}`

/** The request mix now, as Grafana's donut with a table legend. */
const mix = (ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const kinds = (
    Object.entries(ledger.kinds) as ReadonlyArray<[Kind, { rate: number; p99: number }]>
  )
    .filter(([, entry]) => entry.rate > 0)
    .sort((a, b) => b[1].rate - a[1].rate)
  const total = kinds.reduce((sum, [, entry]) => sum + entry.rate, 0)
  return panel(
    'mix',
    'col-span-8',
    'Request mix',
    'req/s by kind',
    [
      h.div(
        [h.Class(cn(SCREEN, 'flex flex-1 items-center gap-3 p-3'))],
        [
          h.div(
            [h.Class('w-[118px] shrink-0')],
            [
              PieChart(
                {
                  data: kinds.map(([kind, entry]) => ({ name: kind, value: entry.rate })),
                  width: 120,
                  height: 120,
                  responsive: true,
                  children: [
                    Pie({
                      dataKey: 'value',
                      nameKey: 'name',
                      innerRadius: '58%',
                      outerRadius: '96%',
                      paddingAngle: 2,
                      stroke: 'var(--card)',
                      colors: kinds.map(([kind]) => kindColor(kind)),
                    }),
                  ],
                },
                h,
              ),
            ],
          ),
          h.table(
            [h.Class('w-full text-[11.5px]')],
            [
              h.tbody(
                [],
                kinds.map(([kind, entry]) =>
                  h.tr(
                    [h.Key(kind)],
                    [
                      h.td(
                        [h.Class('py-0.5')],
                        [
                          h.span(
                            [h.Class('flex items-center gap-1.5')],
                            [
                              h.span(
                                [
                                  h.Class('size-2 rounded-[2px]'),
                                  h.Style({ background: kindColor(kind) }),
                                ],
                                [],
                              ),
                              h.span([h.Class('font-mono text-[11px]')], [kind]),
                            ],
                          ),
                        ],
                      ),
                      h.td(
                        [h.Class(cn(FIGURE, 'py-0.5 text-right'))],
                        [`${compact(entry.rate)}/s`],
                      ),
                      h.td(
                        [h.Class(cn(FIGURE, 'w-12 py-0.5 text-right text-muted-foreground'))],
                        [percent(total > 0 ? entry.rate / total : 0)],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ],
    h,
  )
}

/** Errors now, by cause, as Grafana's basic bar gauge. */
const causes = (ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const entries = ERROR_CAUSES.map((cause) => [cause, ledger.errors[cause]] as const)
    .filter(([, rate]) => rate > 0.0005)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const max = Math.max(...entries.map(([, rate]) => rate), 0.001)
  return panel(
    'causes',
    'col-span-8',
    'Errors by cause',
    'req/s now',
    [
      h.div(
        [h.Class(cn(SCREEN, 'flex flex-1 flex-col justify-center gap-1.5 p-3'))],
        entries.length === 0
          ? [h.span([h.Key('none'), h.Class(cn(FIGURE, 'text-[28px] text-ok'))], ['0 errors'])]
          : entries.map(([cause, rate]) =>
              h.div(
                [
                  h.Key(cause),
                  h.Class('grid grid-cols-[72px_minmax(0,1fr)_56px] items-center gap-2'),
                ],
                [
                  h.span([h.Class('font-mono text-[11px] text-muted-foreground')], [cause]),
                  h.div(
                    [
                      h.Class(
                        'h-3.5 rounded-[3px] bg-card shadow-[inset_0_0_0_1px_var(--hairline)]',
                      ),
                    ],
                    [
                      h.div(
                        [
                          h.Class('h-full rounded-[2px]'),
                          h.Style({
                            width: `${(rate / max) * 100}%`,
                            background: `linear-gradient(90deg, color-mix(in oklab, ${RED} 35%, transparent), ${RED})`,
                          }),
                        ],
                        [],
                      ),
                    ],
                  ),
                  h.span([h.Class(cn(FIGURE, 'text-right text-[11.5px]'))], [`${compact(rate)}/s`]),
                ],
              ),
            ),
      ),
    ],
    h,
  )
}

/** Every Node in one table, with Grafana's coloured cells for load and status. */
const nodeTable = (
  ledger: Ledger,
  tracks: ReadonlyArray<NodeTrack>,
  h: HtmlBuilder<Message>,
): Html => {
  const sorted = [...tracks].sort(
    (a, b) => (ledger.nodes[b.id]?.utilization ?? 0) - (ledger.nodes[a.id]?.utilization ?? 0),
  )
  const head = ['Node', 'Inbound', 'Capacity', 'Load', 'Latency', 'p99', 'Dropped', 'Status']
  return panel(
    'nodes',
    'col-span-24',
    'Nodes',
    `${tracks.length} rows`,
    [
      h.div(
        [h.Class(cn(SCREEN, 'px-1 pb-1', SCROLL))],
        [
          h.table(
            [h.Class('w-full min-w-[720px] border-collapse text-[12px]')],
            [
              h.thead(
                [],
                [
                  h.tr(
                    [h.Class('text-[11px] text-muted-foreground')],
                    head.map((label, index) =>
                      h.th(
                        [
                          h.Key(label),
                          h.Class(
                            cn(
                              'border-b border-hairline px-2 py-1.5 font-medium',
                              index === 0
                                ? 'text-left'
                                : index === 3
                                  ? 'w-[30%] text-left'
                                  : 'text-right',
                            ),
                          ),
                        ],
                        [label],
                      ),
                    ),
                  ),
                ],
              ),
              h.tbody(
                [],
                sorted.map((track) => {
                  const own = ledger.nodes[track.id]
                  const share = own?.utilization ?? 0
                  const level = own?.status === 'down' ? 'danger' : levelOf(share, UTILIZATION)
                  const cell = 'border-b border-hairline px-2 py-1.5'
                  return h.tr(
                    [h.Key(track.id), h.Class('hover:bg-foreground/[0.03]')],
                    [
                      h.td([h.Class(cn(cell, 'font-medium'))], [track.name]),
                      h.td(
                        [h.Class(cn(cell, FIGURE, 'text-right'))],
                        [`${compact(own?.inbound ?? 0)}/s`],
                      ),
                      h.td(
                        [h.Class(cn(cell, FIGURE, 'text-right text-muted-foreground'))],
                        [`${compact(own?.capacity ?? 0)}/s`],
                      ),
                      h.td(
                        [h.Class(cell)],
                        [
                          h.div(
                            [h.Class('flex h-3.5 items-center gap-2')],
                            [
                              lcd(share, h, 24),
                              h.span(
                                [
                                  h.Class(cn(FIGURE, 'w-11 text-right')),
                                  h.Style({ color: LEVEL_COLOR[levelOf(share, UTILIZATION)] }),
                                ],
                                [percent(Math.min(share, 9.99))],
                              ),
                            ],
                          ),
                        ],
                      ),
                      h.td([h.Class(cn(cell, FIGURE, 'text-right'))], [ms(own?.latency ?? 0)]),
                      h.td([h.Class(cn(cell, FIGURE, 'text-right'))], [ms(own?.p99 ?? 0)]),
                      h.td(
                        [
                          h.Class(
                            cn(
                              cell,
                              FIGURE,
                              'text-right',
                              (own?.dropped ?? 0) > 0.05 ? 'text-danger' : 'text-muted-foreground',
                            ),
                          ),
                        ],
                        [`${compact(own?.dropped ?? 0)}/s`],
                      ),
                      h.td(
                        [
                          h.Class(
                            cn(cell, FIGURE, 'text-right text-[11px] font-medium text-black/75'),
                          ),
                          h.Style({
                            background: `color-mix(in oklab, ${LEVEL_COLOR[level]} 85%, transparent)`,
                          }),
                        ],
                        [own?.status === 'down' ? 'DOWN' : STATE_LABEL[level]],
                      ),
                    ],
                  )
                }),
              ),
            ],
          ),
        ],
      ),
    ],
    h,
  )
}

/* ==========================================================================
   The page
   ========================================================================== */

const rangeLabel = (minutes: number): string =>
  minutes >= 1440 ? `${minutes / 1440}d` : `${minutes / 60}h`

/** Grafana's top bar: breadcrumb, time picker, and refresh. */
const topBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const now = clockOf(model.board.game.time)
  const place = model.board.sandbox
    ? model.board.sandbox.id === null
      ? 'Free Sandbox'
      : 'Sandbox'
    : 'Company'
  return h.div(
    [h.Class('flex flex-wrap items-center gap-2 px-4 pt-4 compact:px-3')],
    [
      h.div(
        [h.Class(cn(PANEL, 'flex items-center gap-2.5 py-2 pr-3 pl-3.5'))],
        [
          icon(h, LayoutGrid, 'size-4 text-muted-foreground'),
          h.span(
            [h.Class('flex items-center gap-1.5 text-[13px] text-muted-foreground')],
            [
              'Dashboards',
              h.span([], ['/']),
              place,
              h.span([], ['/']),
              h.span(
                [h.Class('text-[15px] font-semibold tracking-[-0.02em] text-foreground')],
                ['Overview'],
              ),
            ],
          ),
          icon(h, Star, 'size-3.5 text-muted-foreground'),
        ],
      ),
      h.span([h.Class('flex-1')], []),
      h.div(
        [h.Class(cn(PANEL, 'flex items-center gap-1.5 p-1.5'))],
        [
          h.span(
            [h.Class('grid h-7 place-items-center px-1.5 text-muted-foreground')],
            [icon(h, Clock3, 'size-3.5')],
          ),
          h.div(
            [h.Class(cn('flex gap-[3px] rounded-lg p-[3px]', WELL))],
            DASHBOARD_RANGES.map((minutes) =>
              h.button(
                [
                  h.Key(`range-${minutes}`),
                  h.Type('button'),
                  h.AriaPressed(minutes === model.board.dashboard.range ? 'true' : 'false'),
                  h.OnClick(
                    Message.DashboardChanged({
                      message: DashboardMessage.RangeChosen({ minutes }),
                    }),
                  ),
                  h.Class(
                    cn(
                      'h-6 rounded-md px-2.5 text-[12px]',
                      minutes === model.board.dashboard.range
                        ? 'bg-raised text-foreground shadow-raised'
                        : 'text-muted-foreground hover:text-foreground',
                    ),
                  ),
                ],
                [rangeLabel(minutes)],
              ),
            ),
          ),
          h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'flex h-7 items-center gap-2 rounded-lg bg-raised px-2.5 text-[12px] shadow-raised',
                  model.board.clock.paused ? 'text-muted-foreground' : 'text-foreground',
                ),
              ),
            ],
            [
              led(model.board.clock.paused ? MUTED : GREEN, h),
              model.board.clock.paused
                ? 'Paused'
                : `Live · D${now.day} ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}`,
              icon(h, RefreshCw, 'size-3.5 text-muted-foreground'),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class(cn(PANEL, 'p-1'))],
        [
          button(
            {
              onClick: Message.PanelClosed(),
              variant: 'ghost',
              size: 'icon',
              className: 'text-muted-foreground',
              attributes: [h.AriaLabel('Close (Esc)')],
            },
            icon(h, X, 'size-4'),
            h,
          ),
        ],
      ),
    ],
  )
}

/** Grafana's variable bar: read-only facts about what the board shows. */
const variables = (model: Model, slo: number, h: HtmlBuilder<Message>): Html => {
  const chip = (name: string, value: string) =>
    h.span(
      [
        h.Key(name),
        h.Class(
          'flex h-7 items-stretch overflow-hidden rounded-lg bg-raised text-[12px] shadow-raised',
        ),
      ],
      [
        h.span(
          [
            h.Class(
              'grid place-items-center border-r border-hairline bg-well/60 px-2 text-muted-foreground',
            ),
          ],
          [name],
        ),
        h.span([h.Class('grid place-items-center px-2 font-mono text-[11.5px]')], [value]),
      ],
    )
  return h.div(
    [h.Class('flex flex-wrap items-center gap-2 px-4 pt-4 compact:px-3')],
    [
      chip('era', eraOf(model.board.game).name),
      chip('region', model.board.region),
      chip('slo', percent(slo, slo >= 0.999 ? 1 : 0)),
      h.span([h.Class('flex-1')], []),
      h.span(
        [h.Class('flex items-center gap-3 text-[11px] text-muted-foreground')],
        [
          h.span(
            [h.Class('flex items-center gap-1.5')],
            [
              h.span([h.Class('h-3 border-l border-dashed'), h.Style({ borderColor: BLUE })], []),
              'Design change',
            ],
          ),
          h.span(
            [h.Class('flex items-center gap-1.5')],
            [
              h.span([h.Class('h-3 border-l border-dashed'), h.Style({ borderColor: RED })], []),
              'Incident',
            ],
          ),
        ],
      ),
    ],
  )
}

export const dashboardPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.board.game
  const ledger = ledgerOf(model)
  const budget = budgetOf(game)
  const slo = budget.slo > 0 && budget.slo < 1 ? budget.slo : 0.999
  const rows = rowsOf(model, slo)
  const markers = markersOf(model, rows)
  const tracks = tracksOf(model)
  const latest = game.history[game.history.length - 1]
  const percentiles = has(game, 'percentiles')
  const bottleneck = tracks.reduce<NodeTrack | null>(
    (best, track) =>
      (ledger.nodes[track.id]?.utilization ?? 0) >
      (best ? (ledger.nodes[best.id]?.utilization ?? 0) : -1)
        ? track
        : best,
    null,
  )
  const series = (spec: SeriesSpec) => timeSeries(model, rows, markers, spec, h)

  const panels: ReadonlyArray<Html> =
    rows.length < 2 || !latest
      ? [
          h.div(
            [
              h.Key('empty'),
              h.Class(cn(PANEL, 'col-span-24 px-4 py-6 text-[13px] text-muted-foreground')),
            ],
            ['Charts fill in as the clock runs.'],
          ),
        ]
      : [
          stat('users', 'Users', compact(latest.users), 'plain', rows, 'users', BLUE, h),
          stat(
            'revenue',
            'Revenue',
            `${money(latest.revenue)}/s`,
            'plain',
            rows,
            'revenue',
            TEAL,
            h,
          ),
          gauge(
            'apdex',
            'Apdex',
            latest.apdex,
            latest.apdex.toFixed(2),
            { warn: 0.85, danger: 0.7, invert: true },
            h,
          ),
          gauge(
            'bottleneck',
            bottleneck ? `Hottest Node · ${bottleneck.name}` : 'Hottest Node',
            Math.min(1, bottleneck ? (ledger.nodes[bottleneck.id]?.utilization ?? 0) : 0),
            percent(
              Math.min(9.99, bottleneck ? (ledger.nodes[bottleneck.id]?.utilization ?? 0) : 0),
            ),
            UTILIZATION,
            h,
          ),
          has(game, 'logs')
            ? stat(
                'errors',
                'Error rate',
                percent(latest.errors, latest.errors < 0.1 ? 2 : 1),
                levelOf(latest.errors, { warn: 0.001, danger: 0.01 }),
                rows,
                'errors',
                RED,
                h,
                true,
              )
            : locked('errors', 'col-span-4 compact:col-span-12', 'Error rate', 'logs', h),
          stat(
            'latency',
            percentiles ? 'p99 latency' : 'Mean latency',
            ms(percentiles ? latest.p99 : latest.latency),
            'plain',
            rows,
            percentiles ? 'p99' : 'latency',
            PURPLE,
            h,
          ),

          rowHeader('Golden signals', 4, h),
          series({
            key: 'traffic',
            span: 'col-span-12',
            title: 'Traffic',
            unit: 'req/s',
            series: [
              { key: 'served', name: 'Served', color: TEAL, fill: true },
              { key: 'demand', name: 'Demand', color: MUTED, dashed: true },
            ],
            format: (value) => `${compact(value)}/s`,
          }),
          series({
            key: 'latency',
            span: 'col-span-12',
            title: 'Latency',
            unit: percentiles ? 'mean · p99' : 'mean',
            series: percentiles
              ? [
                  { key: 'p99', name: 'p99', color: PURPLE, fill: true },
                  { key: 'latency', name: 'Mean', color: BLUE },
                ]
              : [{ key: 'latency', name: 'Mean', color: BLUE, fill: true }],
            format: ms,
          }),
          has(game, 'logs')
            ? series({
                key: 'errors-series',
                span: 'col-span-8',
                title: 'Errors',
                unit: '% failed',
                series: [{ key: 'errors', name: 'Failed', color: RED, fill: true }],
                format: (value) => `${value.toFixed(value < 1 ? 2 : 1)}%`,
                rules: [{ y: 1, label: 'alert > 1%', color: AMBER }],
                width: 500,
              })
            : locked('errors-series', 'col-span-8', 'Errors', 'logs', h),
          causes(ledger, h),
          mix(ledger, h),

          rowHeader('Saturation', 3, h),
          barGauge(ledger, tracks, h),
          stateTimeline(model, tracks, h),
          nodeTable(ledger, tracks, h),

          rowHeader('Money and error budget', 2, h),
          series({
            key: 'money',
            span: 'col-span-12',
            title: 'Revenue and Burn',
            unit: '$/s',
            series: [
              { key: 'revenue', name: 'Revenue', color: TEAL, fill: true },
              { key: 'burn', name: 'Burn', color: AMBER },
            ],
            format: (value) => money(value),
          }),
          has(game, 'slo-dashboards')
            ? series({
                key: 'burn-rate',
                span: 'col-span-12',
                title: 'Error budget burn rate',
                unit: `× budget · SLO ${percent(slo, slo >= 0.999 ? 1 : 0)}`,
                series: [{ key: 'burnRate', name: 'Burn rate', color: PINK, fill: true }],
                format: (value) => `${value < 10 ? value.toFixed(1) : Math.round(value)}×`,
                rules: [
                  { y: 10, label: 'page > 10×', color: RED },
                  { y: 1, label: '1×', color: MUTED },
                ],
              })
            : locked('burn-rate', 'col-span-12', 'Error budget burn rate', 'slo-dashboards', h),
        ]

  return h.div(
    [
      h.Key('dashboard'),
      h.DataAttribute('exit', 'gesture'),
      h.Class('absolute inset-0 z-30 flex flex-col bg-canvas text-foreground enter-backdrop'),
    ],
    [
      topBar(model, h),
      h.div(
        [h.Key('scroll'), h.Class(cn('min-h-0 flex-1', SCROLL))],
        [
          variables(model, slo, h),
          h.div([h.Class('grid grid-cols-24 gap-2.5 px-4 pt-3 pb-10 compact:px-3')], panels),
        ],
      ),
    ],
  )
}
