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
  menuPanel,
  offerPanel,
  settingsPanel,
} from '@/components/lab/panels.ts'
import { inboxButton, inboxPanel, peek } from '@/components/lab/inbox.ts'
import { glossaryPanel } from '@/components/lab/glossary.ts'
import { dashboardPanel } from '@/components/lab/dashboard.ts'
import { researchPanel } from '@/components/lab/research.ts'
import { teamPanel } from '@/components/lab/team.ts'
import {
  awayPanel,
  exitPanel,
  exitedPanel,
  playbooksPanel,
  selectionBar,
  sellBar,
  stampBar,
} from '@/components/lab/legacy.ts'
import { objectiveBar, passedPanel, sandboxHud } from '@/components/lab/sandbox.ts'
import { challengeBar, challengeHud, challengePanel } from '@/components/lab/challenge.ts'
import { tradeoffCard } from '@/components/lab/tradeoff.ts'
import { boardHost } from './board-mount.ts'
import type { Message } from './message.ts'
import { ledgerOf, type Model, offCompany, stampedPlaybook } from './model.ts'

/* ==========================================================================
   The lab is the game, fullscreen. The title screen is in title.ts.
   ========================================================================== */

/** Display-contents on a desktop, so the HUD, toolbar and goals keep their own corners. */
const TOP =
  'contents compact:pointer-events-none compact:absolute compact:inset-x-0 compact:top-0 compact:z-20 compact:flex compact:flex-col compact:gap-1.5 compact:[--toolbar-w:196px] compact:pt-[max(8px,env(safe-area-inset-top))] compact:pr-[max(8px,env(safe-area-inset-right))] compact:pb-0 compact:pl-[max(8px,env(safe-area-inset-left))]'

/** The desktop's top row, right of the HUD (left-3 + 248px + a 12px gap). */
const TOP_ROW =
  'pointer-events-none absolute top-3 right-3 left-[272px] z-20 flex items-start gap-3 compact:contents'

/** Board context first, so it holds still while incidents come and go below it. */
const LANE = 'flex min-w-0 flex-1 flex-col items-center gap-2 compact:items-stretch compact:gap-1.5'

const BOTTOM =
  'pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 compact:right-[max(8px,env(safe-area-inset-right))] compact:bottom-[max(8px,env(safe-area-inset-bottom))] compact:left-[max(8px,env(safe-area-inset-left))] compact:translate-x-0 compact:items-stretch'

/** On a phone the mail preview and postmortems share one stack above the bottom controls, so the
 *  Inbox button and dock never cover an alert. On a desktop they keep their own corners. */
const bottomNotices = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class(
        'contents compact:pointer-events-none compact:absolute compact:inset-x-2 compact:bottom-[calc(max(8px,env(safe-area-inset-bottom))+144px)] compact:z-20 compact:flex compact:flex-col compact:gap-2',
      ),
    ],
    [peek(model, h), postmortems(model, h)],
  )

export const labScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const ledger = ledgerOf(model)
  return h.main(
    [h.Class('relative h-full overflow-hidden bg-canvas')],
    [
      boardHost(h),
      // On a desktop the HUD and the top row float on their own; on a phone they stack at the top.
      h.div(
        [h.Class(TOP)],
        [
          model.challenge
            ? challengeHud(model, ledger, h)
            : model.sandbox
              ? sandboxHud(model, ledger, h)
              : hud(model, ledger, h),
          // On a desktop the top row runs from the HUD's right edge to the screen's: the lane
          // centres in what the toolbar leaves, so the two never overlap. On a phone it dissolves.
          h.div(
            [h.Class(TOP_ROW)],
            [
              h.div(
                [h.DataAttribute('flip', 'notice'), h.Class(LANE)],
                [
                  regionTabs(model, h),
                  model.challenge
                    ? challengeBar(model, h)
                    : model.sandbox
                      ? objectiveBar(model, h)
                      : h.empty,
                  pager(model, h),
                  badDeploy(model, h),
                  expiredCertificate(model, h),
                  changeBar(model, h, 'enter-down hidden compact:flex'),
                ],
              ),
              toolbar(model, h),
            ],
          ),
        ],
      ),
      // What you are doing on the board: the dock, or the bar for the mode you are in.
      h.div(
        [h.DataAttribute('flip', 'gesture'), h.Class(BOTTOM)],
        [
          changeBar(model, h, 'enter-pop compact:hidden'),
          model.confirmSell
            ? sellBar(model, h)
            : !offCompany(model) && model.selection.length > 0
              ? selectionBar(model, h)
              : stampedPlaybook(model)
                ? stampBar(model, h)
                : dock(model, h),
        ],
      ),
      inspector(model, ledger, h),
      tradeoffCard(model, h),
      bottomNotices(model, h),
      // The inspector takes the Inbox's corner; the Inbox comes back when it closes.
      model.challenge || model.game.nodes.some((node) => node.id === model.selected)
        ? h.empty
        : inboxButton(model, h),
      model.panel === 'research' ? researchPanel(model, h) : h.empty,
      model.panel === 'team' ? teamPanel(model, h) : h.empty,
      model.panel === 'exit' ? exitPanel(model, h) : h.empty,
      model.panel === 'exited' ? exitedPanel(model, h) : h.empty,
      model.panel === 'away' ? awayPanel(model, h) : h.empty,
      model.panel === 'playbooks' ? playbooksPanel(model, h) : h.empty,
      model.panel === 'help' ? helpPanel(h) : h.empty,
      model.panel === 'menu' ? menuPanel(model, h) : h.empty,
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
