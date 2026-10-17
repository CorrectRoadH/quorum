import type { Html, HtmlBuilder } from 'foldkit/html'
import { Table } from '@/components/ui/table'
import { Message } from '@/game/message.ts'
import type { LedgerRow, Model, Tone } from '@/game/model.ts'

/* ==========================================================================
   The Ledger: the metrics table. One row per Node, with the thresholds the
   design calls for — amber above 80% utilization, red above 95%.
   ========================================================================== */

const HEAD =
  'sticky top-0 z-10 h-[30px] bg-card px-2.5 text-right font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground'
const CELL = 'h-[34px] px-2.5 text-right font-mono text-[11.5px] tabular-nums'

const ROW_TINT: Record<Tone, string> = {
  plain: '',
  ok: '',
  warn: 'bg-warn/6',
  danger: 'bg-danger/6',
  primary: '',
}

const TEXT_TONE: Record<Tone, string> = {
  plain: 'text-muted-foreground',
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  primary: 'text-primary-strong',
}

const MARK_TONE: Record<Tone, string> = {
  plain: 'bg-muted-foreground',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  primary: 'bg-primary-strong',
}

type UtilTone = 'plain' | 'warn' | 'danger'

const utilTone = (util: number): UtilTone => (util >= 95 ? 'danger' : util >= 80 ? 'warn' : 'plain')

const UTIL_FILL: Record<UtilTone, string> = {
  plain: 'bg-primary-strong',
  warn: 'bg-warn',
  danger: 'bg-danger',
}

const UTIL_TEXT: Record<UtilTone, string> = {
  plain: 'text-foreground',
  warn: 'text-warn',
  danger: 'text-danger',
}

const nodeCell = (entry: LedgerRow, h: HtmlBuilder<Message>): Html =>
  Table.cell(
    { className: `${CELL} text-left font-sans` },
    [
      h.span(
        [h.Class('flex items-center gap-2')],
        [
          h.span([h.Class(`size-1.5 shrink-0 ${MARK_TONE[entry.tone]}`)], []),
          h.span([h.Class('text-[12.5px] font-medium')], [entry.name]),
          h.span([h.Class('font-mono text-[10px] text-muted-foreground')], [`×${entry.replicas}`]),
        ],
      ),
    ],
    h,
  )

const utilCell = (entry: LedgerRow, h: HtmlBuilder<Message>): Html => {
  const tone = utilTone(entry.util)
  return Table.cell(
    { className: CELL },
    [
      h.span(
        [h.Class(`flex items-center justify-end gap-2 ${UTIL_TEXT[tone]}`)],
        [
          h.span([], [`${entry.util}%`]),
          h.span(
            [h.Class('h-1 w-9 shrink-0 bg-muted')],
            [
              h.span(
                [h.Class(`block h-full ${UTIL_FILL[tone]}`), h.Style({ width: `${entry.util}%` })],
                [],
              ),
            ],
          ),
        ],
      ),
    ],
    h,
  )
}

const statusCell = (entry: LedgerRow, h: HtmlBuilder<Message>): Html =>
  Table.cell(
    { className: `${CELL} text-left font-sans` },
    [
      h.span(
        [h.Class(`flex items-center gap-1.5 text-[11.5px] ${TEXT_TONE[entry.tone]}`)],
        [h.span([h.Class(`size-1.5 ${MARK_TONE[entry.tone]}`)], []), entry.status],
      ),
    ],
    h,
  )

const row = (entry: LedgerRow, selected: boolean, h: HtmlBuilder<Message>): Html =>
  Table.row(
    {
      className: `${ROW_TINT[entry.rowTone]} ${
        selected ? 'bg-primary/15 shadow-[inset_3px_0_0_var(--primary-strong)]' : ''
      }`,
    },
    [
      nodeCell(entry, h),
      Table.cell({ className: CELL }, [`$${entry.burn}`], h),
      Table.cell({ className: CELL }, [entry.inbound], h),
      Table.cell({ className: CELL }, [entry.capacity], h),
      utilCell(entry, h),
      Table.cell({ className: CELL }, [entry.p50], h),
      Table.cell({ className: CELL }, [entry.p99], h),
      Table.cell({ className: CELL }, [entry.errors], h),
      statusCell(entry, h),
    ],
    h,
  )

export const ledger = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class(
        'min-h-0 flex-1 overflow-auto [scrollbar-width:thin] [mask-image:linear-gradient(to_bottom,#000_0,#000_calc(100%-14px),transparent_100%)]',
      ),
    ],
    [
      Table(
        {},
        [
          Table.header(
            {},
            [
              Table.row(
                { className: 'border-b hover:bg-transparent' },
                [
                  Table.head({ className: `${HEAD} w-[280px] text-left` }, ['Node'], h),
                  Table.head({ className: HEAD }, ['Burn'], h),
                  Table.head({ className: HEAD }, ['In'], h),
                  Table.head({ className: HEAD }, ['Cap'], h),
                  Table.head({ className: HEAD }, ['Util'], h),
                  Table.head({ className: HEAD }, ['p50'], h),
                  Table.head({ className: HEAD }, ['p99'], h),
                  Table.head({ className: HEAD }, ['Err'], h),
                  Table.head({ className: `${HEAD} w-[116px] text-left` }, ['Status'], h),
                ],
                h,
              ),
            ],
            h,
          ),
          Table.body(
            {},
            model.ledger.map((entry) => row(entry, model.design.selected === entry.nodeId, h)),
            h,
          ),
        ],
        h,
      ),
    ],
  )
