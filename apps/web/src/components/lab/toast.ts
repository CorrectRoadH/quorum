import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Message } from '@/game/message.ts'
import type { Toast } from '@/game/model.ts'

const TOAST_MARK: Record<Toast['tone'], string> = {
  plain: 'bg-muted-foreground',
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  primary: 'bg-primary-strong',
}

/** One toast surface. A new message replaces the text in place and the surface
 *  morphs to fit it, so a run of messages never blinks; it leaves when the
 *  last one expires. */
export const toast = (value: Toast | null, overPanel: boolean, h: HtmlBuilder<Message>): Html =>
  value
    ? h.div(
        [
          h.Key('toast'),
          h.Role('status'),
          h.DataAttribute('morph', 'notice'),
          h.DataAttribute('exit', 'notice'),
          // A panel can fill a short screen, so the toast moves above it rather than over its actions.
          h.Class(
            `pointer-events-none fixed bottom-[176px] left-1/2 z-50 flex max-w-[calc(100%-16px)] -translate-x-1/2 justify-center rounded-xl bg-surface px-3.5 py-2.5 text-[13px] shadow-float enter-toast compact:right-[calc(max(8px,env(safe-area-inset-right))+52px)] compact:bottom-[calc(max(8px,env(safe-area-inset-bottom))+84px)] compact:left-[max(8px,env(safe-area-inset-left))] compact:max-w-none compact:translate-x-0 compact:justify-start ${
              overPanel
                ? 'short:top-[max(2px,env(safe-area-inset-top))]! short:right-auto! short:bottom-auto! short:left-1/2! short:max-w-[calc(100%-16px)]! short:translate-x-[-50%]! short:justify-center!'
                : ''
            }`,
          ),
        ],
        [
          h.div(
            [
              h.Key(`toast-${value.id}`),
              h.DataAttribute('exit', 'notice'),
              h.Class('swap flex w-max max-w-full shrink-0 items-center gap-2.5'),
            ],
            [
              h.span([h.Class(`size-2 shrink-0 rounded-full ${TOAST_MARK[value.tone]}`)], []),
              value.message,
            ],
          ),
        ],
      )
    : h.empty
