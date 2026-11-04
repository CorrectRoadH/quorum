import { localizeHtml } from '../i18n/index.ts'
import type { Document, HtmlBuilder } from 'foldkit/html'
import { toast } from '@/components/lab/bits.ts'
import { settingsPanel } from '@/components/lab/panels.ts'
import { labScreen } from './screens.ts'
import { titleScreen } from './title.ts'
import type { Message } from './message.ts'
import type { Model } from './model.ts'
import { onBoard } from './route.ts'

/* ==========================================================================
   The root view. Quorum is one window: the active screen fills it, and the
   toast floats above it.
   ========================================================================== */

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'Quorum',
  body: localizeHtml(
    model.locale,
    h.div(
      [
        h.Class('h-dvh w-full overflow-hidden bg-background text-foreground select-none'),
        h.DataAttribute('toast', model.toast ? 'on' : 'off'),
      ],
      [
        h.div(
          [h.Key(onBoard(model.route) ? 'board' : 'title'), h.Class('h-full')],
          [onBoard(model.route) ? labScreen(model, h) : titleScreen(model, h)],
        ),
        // Outside the title's dark palette, so Settings looks the same as on the board.
        !onBoard(model.route) && model.panel === 'settings' ? settingsPanel(model, h) : h.empty,
        toast(model.toast, model.panel !== 'none', h),
      ],
    ),
  ),
})
