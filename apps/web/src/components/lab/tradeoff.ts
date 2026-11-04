import type { Html, HtmlBuilder } from 'foldkit/html'
import { Check, Sparkles, X } from 'lucide'
import {
  AXES,
  FAMILIES,
  FRAMEWORKS,
  RUNTIMES,
  type Axes,
  type Axis,
} from '@quorum/simulation/catalog'
import { has } from '@quorum/simulation/lookups'
import { migrationCost, targetOf } from '@quorum/simulation/migration'
import type { GameNode } from '@quorum/simulation/state'
import { describeDelta } from '@/game/feedback.ts'
import { money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model, PreviewFigures, Tradeoff, TradeoffOption } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FIGURE, PANEL } from './bits.ts'

/* ==========================================================================
   The Tradeoff card (15 "Tradeoff cards"): what an option is, on the six
   axes, and what the ghost run says it does to this Design. Stack choices
   get the radar (16 D21); other options get the preview and the cost. Once
   an option set is confirmed, its card is one line.
   ========================================================================== */

const KIND_TITLE: Record<TradeoffOption['kind'], string> = {
  runtime: 'Runtime',
  framework: 'Framework',
  family: 'Instance',
}

const AXIS_LABEL: Record<Axis, string> = {
  throughput: 'Throughput',
  tail: 'Tail',
  memory: 'Memory',
  velocity: 'Velocity',
  resilience: 'Resilience',
  operability: 'Operability',
}

/** Glossary headings for the anchors the catalog names (docs/gdd/glossary.md). */
const TERMS: Readonly<Record<string, string>> = {
  'process-per-request': 'process per request',
  'shared-nothing': 'shared nothing',
  'gil-global-interpreter-lock': 'GIL',
  'cold-start': 'cold start',
  'event-loop': 'event loop',
  'blast-radius': 'blast radius',
  'vertical-and-horizontal-scaling': 'horizontal scaling',
  'tech-debt': 'tech debt',
  'n1-query': 'N+1 query',
}

const nameOf = (option: TradeoffOption): string => {
  switch (option.kind) {
    case 'runtime':
      return RUNTIMES[option.id].name
    case 'framework':
      return FRAMEWORKS[option.id].name
    case 'family':
      return FAMILIES[option.id].name
  }
}

/** The option the Node runs now, in the same option set. */
const currentOf = (node: GameNode, option: TradeoffOption): TradeoffOption => {
  switch (option.kind) {
    case 'runtime':
      return { kind: 'runtime', id: node.runtime }
    case 'framework':
      return { kind: 'framework', id: node.framework }
    case 'family':
      return { kind: 'family', id: node.family }
  }
}

const stackOf = (
  option: TradeoffOption,
): Readonly<{ axes: Axes; glossary: ReadonlyArray<string> }> | null =>
  option.kind === 'runtime'
    ? RUNTIMES[option.id]
    : option.kind === 'framework'
      ? FRAMEWORKS[option.id]
      : null

/* ---------- the radar ---------- */

const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 62

const pointAt = (index: number, value: number): readonly [number, number] => {
  const angle = (Math.PI / 3) * index - Math.PI / 2
  const r = (RADIUS * value) / 5
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

const polygonOf = (axes: Axes): string =>
  AXES.map((axis, index) =>
    pointAt(index, axes[axis])
      .map((n) => n.toFixed(1))
      .join(','),
  ).join(' ')

const radar = (now: Axes, next: Axes, h: HtmlBuilder<Message>): Html =>
  h.svg(
    [
      h.Class('mx-auto block h-[176px] w-[220px] overflow-visible'),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox(`0 22 ${SIZE} 176`),
      h.AriaLabel('Six axes: now and with this option'),
    ],
    [
      ...[1, 2, 3, 4, 5].map((ring) =>
        h.polygon([
          h.Key(`ring-${ring}`),
          h.Points(
            AXES.map((_, index) =>
              pointAt(index, ring)
                .map((n) => n.toFixed(1))
                .join(','),
            ).join(' '),
          ),
          h.Fill('none'),
          h.Class('stroke-hairline'),
          h.StrokeWidth('1'),
        ]),
      ),
      h.polygon([
        h.Key('now'),
        h.Points(polygonOf(now)),
        h.Class('fill-muted-foreground/10 stroke-muted-foreground'),
        h.StrokeWidth('1.25'),
        h.Attribute('stroke-dasharray', '3 2'),
      ]),
      h.polygon([
        h.Key('next'),
        h.Points(polygonOf(next)),
        h.Class('fill-group-compute/20 stroke-group-compute'),
        h.StrokeWidth('1.75'),
        h.StrokeLinejoin('round'),
      ]),
      ...AXES.map((axis, index) => {
        const [x, y] = pointAt(index, 6.6)
        const anchor = Math.abs(x - CENTER) < 4 ? 'middle' : x > CENTER ? 'start' : 'end'
        const up = next[axis] > now[axis]
        const down = next[axis] < now[axis]
        return h.text(
          [
            h.Key(`label-${axis}`),
            h.Attribute('x', x.toFixed(1)),
            h.Attribute('y', (y + 3.5).toFixed(1)),
            h.Attribute('text-anchor', anchor),
            h.Class(
              cn(
                'text-[10.5px] font-medium',
                up ? 'fill-ok' : down ? 'fill-danger' : 'fill-muted-foreground',
              ),
            ),
          ],
          [AXIS_LABEL[axis]],
        )
      }),
    ],
  )

/* ---------- lines ---------- */

/** "+$0.80/s (+12%) · p99 +40 ms" from the ghost run. */
const previewLine = (model: Model, preview: PreviewFigures): string =>
  describeDelta(
    {
      id: 0,
      label: '',
      before: preview.before,
      after: preview.after,
      worse: false,
      shownAt: 0,
    },
    has(model.board.game, 'percentiles'),
  )

/** Cash now, the change in Burn, and the restart. */
const costLine = (model: Model, preview: PreviewFigures): string => {
  const [before = 0, after = 0] = preview.burn
  const burn = after - before
  return [
    !model.board.game.sandbox && preview.cash > 0 ? money(preview.cash) : null,
    Math.abs(burn) >= 0.005 ? `Burn ${burn > 0 ? '+' : '−'}${money(Math.abs(burn))}/s` : null,
    preview.restart > 0 ? `restarts cold for ${Math.ceil(preview.restart)} s` : null,
  ]
    .filter((part) => part !== null)
    .join(' · ')
}

const worse = (preview: PreviewFigures): boolean =>
  preview.after.revenue < preview.before.revenue * 0.98 ||
  preview.after.errors > preview.before.errors + 0.005

const effect = (model: Model, card: Tradeoff, h: HtmlBuilder<Message>): Html =>
  card.preview
    ? h.div(
        [h.Class('flex flex-col gap-0.5')],
        [
          h.div(
            [h.Class('flex items-center gap-2')],
            [
              h.span(
                [
                  h.Class(
                    `size-2 shrink-0 rounded-full ${worse(card.preview) ? 'bg-danger' : 'bg-ok'}`,
                  ),
                ],
                [],
              ),
              h.span([h.Class(cn(FIGURE, 'text-[12px]'))], [previewLine(model, card.preview)]),
            ],
          ),
          costLine(model, card.preview)
            ? h.span(
                [h.Class(cn(FIGURE, 'pl-4 text-[11.5px] text-muted-foreground'))],
                [costLine(model, card.preview)],
              )
            : h.empty,
        ],
      )
    : card.refusal
      ? h.span([h.Class('text-[12px] text-warn')], [card.refusal])
      : h.empty

/* ---------- the card ---------- */

const PLACE =
  'absolute top-[76px] right-[372px] z-20 w-[320px] compact:inset-x-2 compact:top-auto compact:right-2 compact:bottom-[calc(62%+16px)] compact:w-auto short:right-[340px]'

export const tradeoffCard = (model: Model, h: HtmlBuilder<Message>): Html => {
  const card = model.board.tradeoff
  if (!card || card.nodeId !== model.board.selected) return h.empty
  const node = model.board.game.nodes.find((entry) => entry.id === card.nodeId)
  if (!node) return h.empty
  const current = currentOf(node, card.option)
  const title = `${KIND_TITLE[card.option.kind]}: ${nameOf(current)} → ${nameOf(card.option)}`

  // Explicit reviews stay expanded even after this option set has been seen.
  if (!card.pinned && model.prefs.seenTradeoffs.includes(card.option.kind))
    return h.div(
      [
        h.Key('tradeoff-line'),
        h.Class(cn(PLACE, PANEL, 'enter-panel flex flex-col gap-1 px-3.5 py-2.5')),
      ],
      [
        h.span([h.Class('text-[12.5px] font-semibold')], [nameOf(card.option)]),
        effect(model, card, h),
      ],
    )

  const stack = stackOf(card.option)
  const now = stackOf(current)
  const migration =
    !model.board.game.sandbox &&
    node.type === 'server' &&
    (card.option.kind === 'runtime' || card.option.kind === 'framework')
      ? targetOf(
          node,
          card.option.kind === 'runtime'
            ? { runtime: card.option.id }
            : { framework: card.option.id },
        )
      : null
  return h.div(
    [
      h.Key('tradeoff'),
      h.Class(cn(PLACE, PANEL, 'enter-panel flex flex-col gap-3 p-4')),
      h.AriaLabel(title),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-2')],
        [
          icon(h, Sparkles, 'size-4 shrink-0 text-group-compute'),
          h.span([h.Class('min-w-0 flex-1 text-[13.5px] font-semibold')], [title]),
          card.pinned
            ? button(
                {
                  onClick: Message.TradeoffClosed(),
                  variant: 'ghost',
                  size: 'icon-sm',
                  className: 'text-muted-foreground',
                  attributes: [h.AriaLabel('Cancel (Escape)'), h.Title('Cancel (Escape)')],
                },
                icon(h, X, 'size-4'),
                h,
              )
            : h.empty,
        ],
      ),
      stack && now ? radar(now.axes, stack.axes, h) : h.empty,
      effect(model, card, h),
      migration && !card.refusal
        ? h.p(
            [h.Class('text-[12px] leading-snug text-muted-foreground')],
            [
              `Migration: ${migrationCost(model.board.game, migration)} DH across all App Servers. Feature work slows and rollout can expose bugs. Manage work and shift traffic in Team after starting.`,
            ],
          )
        : h.empty,
      stack && stack.glossary.length > 0
        ? h.div(
            [h.Class('flex flex-wrap gap-1.5')],
            stack.glossary.map((anchor) =>
              h.button(
                [
                  h.Key(anchor),
                  h.Type('button'),
                  h.OnClick(Message.GlossaryOpened({ id: anchor })),
                  h.Class(
                    'rounded-md bg-nested px-1.5 py-0.5 text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground',
                  ),
                ],
                [TERMS[anchor] ?? anchor],
              ),
            ),
          )
        : h.empty,
      card.pinned
        ? h.div(
            [h.Class('flex gap-2')],
            [
              button(
                {
                  onClick: Message.OptionConfirmed(),
                  isDisabled: card.preview === null || card.refusal !== null,
                  size: 'lg',
                  className: 'flex-1',
                },
                [icon(h, Check, 'size-4'), migration ? 'Start migration' : 'Confirm'],
                h,
              ),
              button(
                {
                  onClick: Message.TradeoffClosed(),
                  variant: 'outline',
                  size: 'lg',
                },
                ['Cancel'],
                h,
              ),
            ],
          )
        : h.empty,
    ],
  )
}
