import type { Document, HtmlBuilder } from 'foldkit/html'
import { toasts } from '@/components/game/frame.ts'
import { activeScreen } from './screens/index.ts'
import type { Message } from './message.ts'
import type { Model } from './model.ts'

/* ==========================================================================
   The root view. Quorum is one window: the active screen fills it, and
   toasts float above whatever that screen is.
   ========================================================================== */

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: 'Quorum — a month in the life of your design',
  body: h.div(
    [h.Class('h-dvh w-full overflow-hidden bg-background text-foreground')],
    [
      h.div([h.Key(model.route), h.Class('h-full')], [activeScreen(model, h)]),
      toasts(model.toast, h),
    ],
  ),
})
