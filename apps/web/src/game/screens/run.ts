import type { Html, HtmlBuilder } from 'foldkit/html'
import { canvasChrome, diagram } from '@/components/game/canvas.ts'
import { charts } from '@/components/game/charts.ts'
import { frame } from '@/components/game/frame.ts'
import { hud } from '@/components/game/hud.ts'
import { inspector } from '@/components/game/inspector.ts'
import { ledger } from '@/components/game/ledger.ts'
import { palette } from '@/components/game/palette.ts'
import { pauseOverlay } from '@/components/game/overlays/pause.ts'
import { tradeoffOverlay } from '@/components/game/overlays/tradeoff.ts'
import type { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'

/* ==========================================================================
   The run. Quorum plays here: a HUD you can read at a glance, the catalog on
   the left, the design on a PixiJS canvas, the inspector on the right, and
   the Ledger underneath with the graphs above it.
   ========================================================================== */

const BODY = 'grid min-h-0 grid-cols-[240px_minmax(0,1fr)_320px]'
const DOCK = 'grid min-h-0 grid-rows-[80px_minmax(0,1fr)] border-t border-border bg-card'

export const runScreen = (model: Model, h: HtmlBuilder<Message>): Html =>
  frame(
    'run',
    [
      hud(model, h),
      h.div(
        [h.Class(BODY)],
        [
          palette(model, h),
          h.div(
            [h.Class('relative min-h-0 bg-canvas')],
            [diagram('run', h), ...canvasChrome(model, h)],
          ),
          inspector(model, h),
        ],
      ),
      h.div([h.Class(DOCK)], [charts(model, h), ledger(model, h)]),
      model.run.overlay === 'tradeoff' ? tradeoffOverlay(model, h) : h.empty,
      model.run.overlay === 'pause' ? pauseOverlay(model, h) : h.empty,
    ],
    h,
  )
