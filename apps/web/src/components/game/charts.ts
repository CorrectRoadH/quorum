import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { errorsAt, latencyAt, loadAt, money } from '@/game/simulation.ts'

/* ==========================================================================
   The three graphs above the Ledger: latency, throughput with errors, and
   money against burn. Plain SVG — the animation budget belongs to the canvas.
   ========================================================================== */

const TITLE = 'font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground'
const NOW = 'flex items-baseline gap-1 font-mono text-[13px] tabular-nums'
const UNIT = 'text-[10px] text-muted-foreground'
const VIEWPORT = 'mt-auto h-[38px] w-full overflow-hidden'
const LINE = 'fill-none stroke-[1.5]'

const latencyPoints = '0,36 18,34 36,33 54,30 72,28 90,24 108,21 126,25 144,17 162,14 180,18 200,15'
const loadPoints = '0,38 20,36 40,33 60,30 80,26 100,21 120,18 140,15 160,13 180,12 200,13'
const errorPoints = '0,40 20,40 40,39 60,40 80,39 100,38 120,39 140,36 160,34 180,37 200,35'
const moneyPoints = '0,38 20,36 40,34 60,31 80,27 100,23 120,19 140,15 160,11 180,8 200,5'
const bars = [2, 22, 42, 62, 82, 102, 122, 142, 162, 182]

const panel = (
  id: string,
  title: string,
  now: string,
  detail: string,
  series: ReadonlyArray<Html>,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Key(id), h.Class('chart flex flex-col border-l border-border px-3 py-2.5 first:border-l-0')],
    [
      h.div(
        [h.Class('flex items-baseline justify-between gap-2')],
        [
          h.span([h.Class(TITLE)], [title]),
          h.span([h.Class(NOW)], [h.span([], [now]), h.span([h.Class(UNIT)], [detail])]),
        ],
      ),
      h.svg(
        [
          h.Class(VIEWPORT),
          h.Attribute('viewBox', '0 0 200 44'),
          h.PreserveAspectRatio('none'),
          h.AriaHidden(true),
        ],
        series,
      ),
    ],
  )

const dashed = (y: string, className: string, h: HtmlBuilder<Message>): Html =>
  h.line([
    h.Class(className),
    h.Attribute('x1', '0'),
    h.Attribute('y1', y),
    h.Attribute('x2', '200'),
    h.Attribute('y2', y),
    h.Attribute('stroke-dasharray', '2 4'),
  ])

const area = (className: string, d: string, h: HtmlBuilder<Message>): Html =>
  h.path([h.Class(`stroke-none opacity-15 ${className}`), h.Attribute('d', d)], [])

const line = (className: string, points: string, h: HtmlBuilder<Message>): Html =>
  h.polyline([
    h.Class(`${LINE} ${className}`),
    h.Attribute('points', points),
    h.Attribute('vector-effect', 'non-scaling-stroke'),
  ])

export const charts = (model: Model, h: HtmlBuilder<Message>): Html => {
  const { tick, spiked, capital, burn } = model.run

  return h.div(
    [h.Class('grid grid-cols-3 border-b border-border')],
    [
      panel(
        'p95',
        'Latency p95',
        String(latencyAt(tick, spiked)),
        'ms · +18',
        [
          dashed('11', 'stroke-warn opacity-50', h),
          dashed('28', 'stroke-border opacity-80', h),
          area(
            'fill-chart-1',
            'M0 36 L18 34 L36 33 L54 30 L72 28 L90 24 L108 21 L126 25 L144 17 L162 14 L180 18 L200 15 L200 44 L0 44 Z',
            h,
          ),
          line('stroke-chart-1', latencyPoints, h),
        ],
        h,
      ),
      panel(
        'load',
        'Throughput · errors',
        `${loadAt(tick).toFixed(2)}k`,
        `rps · ${errorsAt(tick, spiked)}%`,
        [
          area(
            'fill-chart-2',
            'M0 38 L20 36 L40 33 L60 30 L80 26 L100 21 L120 18 L140 15 L160 13 L180 12 L200 13 L200 44 L0 44 Z',
            h,
          ),
          line('stroke-chart-2', loadPoints, h),
          h.polyline([
            h.Class('fill-none stroke-danger stroke-1'),
            h.Attribute('points', errorPoints),
            h.Attribute('stroke-dasharray', '2 2'),
            h.Attribute('vector-effect', 'non-scaling-stroke'),
          ]),
        ],
        h,
      ),
      panel(
        'money',
        'Capital vs burn',
        money(capital),
        `· ${(burn / 1000).toFixed(2)}k`,
        [
          ...bars.map((x, index) =>
            h.rect([
              h.Key(`bar-${x}`),
              h.Class('fill-chart-3 opacity-75'),
              h.Attribute('x', String(x)),
              h.Attribute('y', String(32 - index * 1.6)),
              h.Attribute('width', '10'),
              h.Attribute('height', String(12 + index * 1.6)),
            ]),
          ),
          line('stroke-chart-1 stroke-[2]', moneyPoints, h),
        ],
        h,
      ),
    ],
  )
}
