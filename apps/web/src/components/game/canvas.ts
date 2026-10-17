import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import type { Message } from '@/game/message.ts'
import type { Model, Node } from '@/game/model.ts'
import { diagramHost } from '@/game/diagram-mount.ts'

/* ==========================================================================
   The design canvas: a PixiJS plane with Foldkit's chrome floating over it.
   The diagram itself is imperative (see game/diagram.ts); this module only
   places the host element and the read-only overlays.
   ========================================================================== */

export const diagram = (key: string, h: HtmlBuilder<Message>): Html => diagramHost(key, h)

const SATURATED_AT = 95

export const canvasChrome = (model: Model, h: HtmlBuilder<Message>): ReadonlyArray<Html> => {
  const nodes = model.design.nodes
  const count = (state: Node['state']) => nodes.filter((node) => node.state === state).length
  const saturated = nodes.filter((node) => node.util >= SATURATED_AT).length
  const legend = [
    { label: 'RUNNING', mark: 'bg-ok', n: count('ok') },
    { label: 'DEGRADED', mark: 'bg-warn', n: count('warn') },
    { label: 'DOWN', mark: 'bg-danger', n: count('danger') + count('down') },
  ]

  return [
    h.div(
      [h.Class('pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2')],
      [
        badge(
          { variant: 'outline' },
          [`Design · ${nodes.length} nodes · ${model.design.links.length} links`],
          h,
        ),
        badge(
          { variant: 'secondary' },
          [model.run.spiked ? 'spike · p95 rising' : `${saturated} saturated`],
          h,
        ),
      ],
    ),
    h.div(
      [
        h.Class(
          'pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-3 font-mono text-[10px] text-muted-foreground',
        ),
      ],
      legend.map(({ label, mark, n }) =>
        h.span(
          [h.Key(label), h.Class('flex items-center gap-1.5')],
          [h.span([h.Class(`size-1.5 ${mark}`)], []), `${label} ${n}`],
        ),
      ),
    ),
  ]
}
