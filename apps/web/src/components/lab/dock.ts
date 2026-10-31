import type { Html, HtmlBuilder } from 'foldkit/html'
import { Lock } from 'lucide'
import {
  BUILD_GROUPS,
  COMPONENTS,
  COMPONENT_IDS,
  RESEARCH,
  type ComponentId,
} from '@/game/engine/catalog.ts'
import { isUnlocked, priceOf } from '@/game/engine/sim.ts'
import { money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { PANEL, mark } from './bits.ts'

/* ==========================================================================
   The build dock: pick a group, pick a Component, click the board to place
   it. Locked Components show the research that opens them.
   ========================================================================== */

const card = (model: Model, type: ComponentId, h: HtmlBuilder<Message>): Html => {
  const def = COMPONENTS[type]
  const unlocked = isUnlocked(model.game, type)
  const price = priceOf(model.game, type)
  const affordable = model.game.cash >= price
  const armed = model.placing === type
  return h.button(
    [
      h.Key(type),
      h.Type('button'),
      h.Title(unlocked ? def.blurb : `Research ${RESEARCH[def.unlock ?? 'stripe'].name} to unlock`),
      h.OnClick(Message.PlacingChosen({ type })),
      h.Class(
        `flex w-[156px] shrink-0 items-center gap-2.5 border px-2.5 py-2 text-left transition-colors ${
          armed
            ? 'border-primary-strong bg-primary/10'
            : unlocked
              ? 'border-border bg-card hover:border-primary-strong/60 hover:bg-secondary/60'
              : 'border-dashed border-border bg-card/60 text-muted-foreground'
        }`,
      ),
    ],
    [
      mark(def.code, `h-7 w-9 text-[10px] uppercase ${unlocked ? '' : 'opacity-40'}`, h),
      h.span(
        [h.Class('flex min-w-0 flex-col')],
        [
          h.span([h.Class('truncate text-[12.5px] font-semibold')], [def.name]),
          unlocked
            ? h.span(
                [
                  h.Class(
                    `font-mono text-[11px] ${affordable ? 'text-muted-foreground' : 'text-danger'}`,
                  ),
                ],
                [money(price)],
              )
            : h.span(
                [h.Class('flex items-center gap-1 font-mono text-[10.5px]')],
                [icon(h, Lock, 'size-3 shrink-0'), 'Locked'],
              ),
        ],
      ),
    ],
  )
}

export const dock = (model: Model, h: HtmlBuilder<Message>): Html => {
  const items = COMPONENT_IDS.filter(
    (type) => COMPONENTS[type].group === model.buildGroup && !COMPONENTS[type].fixed,
  )
  return h.div(
    [h.Class(`absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col ${PANEL}`)],
    [
      h.div(
        [h.Class('flex items-center border-b border-border')],
        [
          ...BUILD_GROUPS.map((group, index) =>
            h.button(
              [
                h.Key(group.key),
                h.Type('button'),
                h.OnClick(Message.BuildGroupChosen({ group: group.key })),
                h.Class(
                  `flex items-center gap-2 border-r border-border px-3.5 py-2 text-[12px] font-medium transition-colors ${
                    group.key === model.buildGroup
                      ? 'bg-card text-foreground shadow-[inset_0_-2px_0_var(--primary-strong)]'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                  }`,
                ),
              ],
              [
                h.span(
                  [h.Class('font-mono text-[10px] text-muted-foreground')],
                  [String(index + 1)],
                ),
                group.label,
              ],
            ),
          ),
          h.span(
            [h.Class('px-3.5 font-mono text-[10.5px] text-muted-foreground')],
            [model.placing ? 'Click the board to place · Esc to cancel' : ''],
          ),
        ],
      ),
      h.div(
        [h.Class('flex gap-2 p-2')],
        items.map((type) => card(model, type, h)),
      ),
    ],
  )
}
