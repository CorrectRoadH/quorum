import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowRight } from 'lucide'
import { GUIDED, type SandboxId } from '@quorum/simulation/sandbox'
import { EYEBROW, PANEL } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import type { Message, Model } from './main.ts'

/* A guided Sandbox placed in a page. */

export const sandboxView = (
  _model: Model,
  id: SandboxId,
  _index: number,
  h: HtmlBuilder<Message>,
): Html => {
  const def = GUIDED[id]
  return h.a(
    [
      h.Href(`/sandboxes/${id}`),
      h.Class(cn(PANEL, 'not-prose group my-6 flex items-center gap-4 px-5 py-4')),
    ],
    [
      h.span(
        [h.Class('min-w-0 flex-1')],
        [
          h.span([h.Class(EYEBROW)], ['Sandbox']),
          h.span([h.Class('mt-1 block text-[16px] font-semibold tracking-tight')], [def.name]),
          h.span(
            [h.Class('block text-[13px] text-muted-foreground')],
            [def.objectives[0]?.goal ?? ''],
          ),
        ],
      ),
      icon(h, ArrowRight, 'size-4 text-muted-foreground'),
    ],
  )
}
