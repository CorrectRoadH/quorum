import type { Document, HtmlBuilder } from 'foldkit/html'
import { toast } from '@/components/lab/bits.ts'
import { labScreen } from './screens.ts'
import { titleScreen } from './title.ts'
import type { Message } from './message.ts'
import type { Model } from './model.ts'

/* ==========================================================================
   The root view. Quorum is one window: the active screen fills it, and the
   toast floats above it.
   ========================================================================== */

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'Quorum',
  body: h.div(
    [h.Class('h-dvh w-full overflow-hidden bg-background text-foreground select-none')],
    [
      h.div(
        [h.Key(model.route), h.Class('h-full')],
        [model.route === 'lab' ? labScreen(model, h) : titleScreen(model, h)],
      ),
      toast(model.toast, h),
    ],
  ),
})
