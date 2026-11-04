import type { Html, HtmlBuilder } from 'foldkit/html'

import { ArrowRight } from 'lucide'
import { GUIDED, type SandboxId } from '@quorum/simulation/sandbox'

import { icon } from '@quorum/ui/primitives/icon'
import type { Message, Model } from '../main.ts'

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
      h.Class(
        'not-prose group my-6 flex items-center gap-4 rounded-lg border border-border px-4 py-3 hover:bg-muted/60',
      ),
    ],
    [
      h.span(
        [h.Class('min-w-0 flex-1')],
        [
          h.span([h.Class('text-[12.5px] text-muted-foreground')], ['Sandbox']),
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
