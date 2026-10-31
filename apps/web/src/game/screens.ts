import type { Html, HtmlBuilder } from 'foldkit/html'
import { dock } from '@/components/lab/dock.ts'
import { changeBar, goalBar, hud, toolbar } from '@/components/lab/hud.ts'
import { pager, postmortems } from '@/components/lab/incidents.ts'
import { inspector } from '@/components/lab/inspector.ts'
import {
  devPanel,
  endPanel,
  eraPanel,
  helpPanel,
  offerPanel,
  researchPanel,
} from '@/components/lab/panels.ts'
import { Pause } from 'lucide'
import { icon } from '@/lib/icons'
import { boardHost } from './board-mount.ts'
import { nextGoal } from './engine/goals.ts'
import { solve } from './engine/solve.ts'
import type { Message } from './message.ts'
import type { Model } from './model.ts'

/* ==========================================================================
   The lab is the game, fullscreen. The title screen is in title.ts.
   ========================================================================== */

export const labScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const ledger = solve(model.game)
  return h.main(
    [h.Class('relative h-full overflow-hidden bg-canvas')],
    [
      boardHost(h),
      hud(model, ledger, h),
      toolbar(model, h),
      h.div(
        [
          h.Class(
            'pointer-events-none absolute top-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2',
          ),
        ],
        [
          pager(model, h),
          goalBar(nextGoal(model.game, ledger), h),
          changeBar(model, h),
          model.paused
            ? h.div(
                [
                  h.Key('paused'),
                  h.Class(
                    'flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground shadow-card',
                  ),
                ],
                [icon(h, Pause, 'size-3'), 'Paused'],
              )
            : h.empty,
        ],
      ),
      inspector(model, ledger, h),
      postmortems(model, h),
      dock(model, h),
      model.panel === 'research' ? researchPanel(model, h) : h.empty,
      model.panel === 'help' ? helpPanel(h) : h.empty,
      model.panel === 'offer' ? offerPanel(model, h) : h.empty,
      model.panel === 'era' ? eraPanel(model, h) : h.empty,
      model.panel === 'end' ? endPanel(model, h) : h.empty,
      model.panel === 'dev' ? devPanel(model, h) : h.empty,
    ],
  )
}
