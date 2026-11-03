import type { Html, HtmlBuilder } from 'foldkit/html'
import { dock } from '@/components/lab/dock.ts'
import { changeBar, hud, regionTabs, toolbar } from '@/components/lab/hud.ts'
import { badDeploy, expiredCertificate, pager, postmortems } from '@/components/lab/incidents.ts'
import { inspector } from '@/components/lab/inspector.ts'
import {
  devPanel,
  endPanel,
  eraPanel,
  helpPanel,
  offerPanel,
  settingsPanel,
} from '@/components/lab/panels.ts'
import { inboxButton, inboxPanel } from '@/components/lab/inbox.ts'
import { glossaryPanel } from '@/components/lab/glossary.ts'
import { dashboardPanel } from '@/components/lab/dashboard.ts'
import { researchPanel } from '@/components/lab/research.ts'
import { teamPanel } from '@/components/lab/team.ts'
import {
  awayPanel,
  exitPanel,
  exitPill,
  exitedPanel,
  playbooksPanel,
  selectionBar,
  stampBar,
} from '@/components/lab/legacy.ts'
import { objectiveBar, passedPanel, sandboxHud } from '@/components/lab/sandbox.ts'
import { challengeBar, challengeHud, challengePanel } from '@/components/lab/challenge.ts'
import { tradeoffCard } from '@/components/lab/tradeoff.ts'
import { Pause } from 'lucide'
import { icon } from '@/lib/icons'
import { boardHost } from './board-mount.ts'
import type { Message } from './message.ts'
import { ledgerOf, type Model } from './model.ts'

/* ==========================================================================
   The lab is the game, fullscreen. The title screen is in title.ts.
   ========================================================================== */

/** Display-contents on a desktop, so the HUD, toolbar and goals keep their own corners. */
const TOP =
  'contents compact:pointer-events-none compact:absolute compact:inset-x-0 compact:top-0 compact:z-20 compact:flex compact:flex-col compact:gap-1.5 compact:[--toolbar-w:196px] compact:pt-[max(8px,env(safe-area-inset-top))] compact:pr-[max(8px,env(safe-area-inset-right))] compact:pb-0 compact:pl-[max(8px,env(safe-area-inset-left))]'

export const labScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const ledger = ledgerOf(model)
  return h.main(
    [h.Class('relative h-full overflow-hidden bg-canvas')],
    [
      boardHost(h),
      // On a desktop these three float on their own; on a phone they stack at the top.
      h.div(
        [h.Class(TOP)],
        [
          model.challenge
            ? challengeHud(model, ledger, h)
            : model.sandbox
              ? sandboxHud(model, ledger, h)
              : hud(model, ledger, h),
          toolbar(model, h),
          // Notices stack here; when one comes or goes, the others slide over.
          h.div(
            [
              h.DataAttribute('flip', 'notice'),
              h.Class(
                'pointer-events-none absolute top-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 compact:static compact:translate-x-0 compact:items-stretch compact:gap-1.5',
              ),
            ],
            [
              pager(model, h),
              badDeploy(model, h),
              exitPill(model, h),
              selectionBar(model, h),
              stampBar(model, h),
              expiredCertificate(model, h),
              model.challenge
                ? challengeBar(model, h)
                : model.sandbox
                  ? objectiveBar(model, h)
                  : h.empty,
              regionTabs(model, h),
              changeBar(model, h),
              model.paused
                ? h.div(
                    [
                      h.Key('paused'),
                      h.DataAttribute('exit', 'gesture'),
                      h.Class(
                        'enter-badge flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 compact:hidden font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground shadow-card',
                      ),
                    ],
                    [icon(h, Pause, 'size-3'), 'Paused'],
                  )
                : h.empty,
            ],
          ),
        ],
      ),
      inspector(model, ledger, h),
      tradeoffCard(model, h),
      postmortems(model, h),
      dock(model, h),
      model.challenge ? h.empty : inboxButton(model, h),
      model.panel === 'research' ? researchPanel(model, h) : h.empty,
      model.panel === 'team' ? teamPanel(model, h) : h.empty,
      model.panel === 'exit' ? exitPanel(model, h) : h.empty,
      model.panel === 'exited' ? exitedPanel(model, h) : h.empty,
      model.panel === 'away' ? awayPanel(model, h) : h.empty,
      model.panel === 'playbooks' ? playbooksPanel(model, h) : h.empty,
      model.panel === 'help' ? helpPanel(h) : h.empty,
      model.panel === 'settings' ? settingsPanel(model, h) : h.empty,
      model.panel === 'inbox' ? inboxPanel(model, h) : h.empty,
      model.panel === 'glossary' ? glossaryPanel(model, h) : h.empty,
      model.panel === 'dashboard' ? dashboardPanel(model, h) : h.empty,
      model.panel === 'offer' ? offerPanel(model, h) : h.empty,
      model.panel === 'era' ? eraPanel(model, h) : h.empty,
      model.panel === 'end' ? endPanel(model, h) : h.empty,
      model.panel === 'dev' ? devPanel(model, h) : h.empty,
      model.panel === 'passed' ? passedPanel(model, h) : h.empty,
      model.panel === 'challenge' ? challengePanel(model, h) : h.empty,
    ],
  )
}
