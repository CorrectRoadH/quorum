import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { Message } from '@/game/message.ts'
import type { Model, Node } from '@/game/model.ts'
import { card, kv } from './panel.ts'

/* ==========================================================================
   The inspector: everything the Ledger knows about the selected Node, the
   Tradeoff card attached to it, and the two decisions you can take.
   ========================================================================== */

const selected = (model: Model): Node | null =>
  model.design.nodes.find((node) => node.id === model.design.selected) ?? null

const engagement = (model: Model): Readonly<{ title: string; body: string }> => {
  if (model.run.tradeoff === 'write-through') {
    return {
      title: 'Tradeoff engaged: Write-through',
      body: 'Every write lands in the cache too, so reads never go stale. Writes pay 38 ms.',
    }
  }
  if (model.run.tradeoff === 'cache-reads') {
    return {
      title: 'Tradeoff engaged: Cache reads',
      body: 'Reads come from memory and stay fast. A write stays invisible for 60 seconds.',
    }
  }
  return {
    title: 'No tradeoff engaged',
    body: 'The cache sits in front of Postgres, but reads still miss on cold pages.',
  }
}

const stateLabel = (node: Node): string =>
  node.state === 'down' ? 'CrashLoop' : node.state === 'ok' ? 'Running' : 'Degraded'

export const inspector = (model: Model, h: HtmlBuilder<Message>): Html => {
  const node = selected(model)
  const tradeoff = engagement(model)

  return h.aside(
    [h.Class('flex min-h-0 flex-col border-l border-border bg-card')],
    [
      h.div(
        [h.Class('flex flex-col gap-2 border-b border-border px-4 py-3')],
        [
          h.div(
            [h.Class('flex items-center justify-between gap-2')],
            [
              h.h3([h.Class('text-[16px] font-semibold')], [node?.name ?? 'Nothing selected']),
              node
                ? badge(
                    { variant: node.state === 'ok' ? 'outline' : 'secondary' },
                    [stateLabel(node)],
                    h,
                  )
                : h.empty,
            ],
          ),
          h.div(
            [h.Class('flex flex-wrap gap-1.5')],
            [
              node
                ? badge(
                    { variant: 'outline' },
                    [node.family === 'cluster' ? 'Cluster' : 'Managed'],
                    h,
                  )
                : h.empty,
              node ? badge({ variant: 'outline' }, [node.meta], h) : h.empty,
            ],
          ),
        ],
      ),
      h.div(
        [
          h.Class(
            'flex min-h-0 flex-1 flex-col gap-3 overflow-auto [scrollbar-width:thin] px-4 py-3',
          ),
        ],
        [
          kv(
            [
              { label: 'Replicas', value: String(node?.replicas ?? 0) },
              { label: 'Capacity', value: node ? `${node.capacity} rps` : '—' },
              { label: 'Inbound', value: node ? `${node.inbound} rps` : '—' },
              { label: 'Utilization', value: node ? `${node.util}%` : '—' },
              {
                label: 'Burn',
                value: node ? `$${(node.replicas * 160).toLocaleString('en-US')} / mo` : '—',
              },
              {
                label: 'Manifest',
                value: node?.family === 'cluster' ? '4 objects' : 'Not compiled',
              },
            ],
            h,
          ),
          h.div(
            [h.Class('flex flex-col gap-2 border border-primary-strong/35 bg-primary/8 p-3')],
            [
              h.h4(
                [
                  h.Class(
                    'font-mono text-[9.5px] font-normal uppercase tracking-[0.12em] text-muted-foreground',
                  ),
                ],
                [tradeoff.title],
              ),
              h.p([h.Class('text-[12.5px] leading-relaxed')], [tradeoff.body]),
              h.div(
                [h.Class('flex')],
                [
                  button(
                    {
                      size: 'sm',
                      variant: 'outline',
                      onClick: Message.OverlayOpened({ overlay: 'tradeoff' }),
                    },
                    model.run.tradeoff === 'none' ? 'Open “Cache reads?”' : 'Review the tradeoff',
                    h,
                  ),
                ],
              ),
            ],
          ),
          card(
            [
              h.div(
                [h.Class('flex flex-col gap-1.5 px-3 py-3')],
                [
                  h.h4(
                    [
                      h.Class(
                        'font-mono text-[9.5px] font-normal uppercase tracking-[0.12em] text-muted-foreground',
                      ),
                    ],
                    ['Pressure'],
                  ),
                  h.p(
                    [h.Class('text-[12.5px] leading-relaxed')],
                    [
                      `${node?.util ?? 0}% utilized. p99 rises with queue depth. A fourth replica costs $160/mo and buys 700 rps.`,
                    ],
                  ),
                ],
              ),
            ],
            h,
            'bg-muted/60',
          ),
        ],
      ),
      h.div(
        [h.Class('flex gap-2 border-t border-border px-4 py-3')],
        [
          h.div([h.Class('flex-1')], [button({ className: 'w-full' }, 'Configure', h)]),
          h.div(
            [h.Class('flex-1')],
            [button({ className: 'w-full', variant: 'destructive' }, 'Remove', h)],
          ),
        ],
      ),
    ],
  )
}
