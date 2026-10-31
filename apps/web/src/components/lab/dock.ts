import type { Html, HtmlBuilder } from 'foldkit/html'
import { Lock } from 'lucide'
import {
  BUILD_GROUPS,
  COMPONENTS,
  COMPONENT_IDS,
  RESEARCH,
  type ComponentId,
} from '@/game/engine/catalog.ts'
import { isUnlocked, priceOf } from '@/game/engine/lookups.ts'
import { money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { Kbd } from '@/components/ui/kbd'
import { tabsListClass, tabsTriggerClass } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FIGURE, PANEL, mark } from './bits.ts'

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
        `flex w-[160px] shrink-0 items-center gap-2.5 rounded-xl p-2 text-left transition-[filter,box-shadow] ${
          armed
            ? 'bg-raised shadow-[var(--elev-raised),0_0_0_1.5px_var(--primary-strong)]'
            : unlocked
              ? 'bg-raised shadow-raised hover:brightness-[0.985]'
              : 'border border-dashed border-border text-muted-foreground'
        }`,
      ),
    ],
    [
      mark(
        def.code,
        `h-8 w-10 rounded-lg text-[10px] uppercase ${unlocked ? '' : 'opacity-40'}`,
        h,
      ),
      h.span(
        [h.Class('flex min-w-0 flex-col')],
        [
          h.span([h.Class('truncate text-[12.5px] font-semibold')], [def.name]),
          unlocked
            ? h.span(
                [
                  h.Class(
                    `${FIGURE} text-[11.5px] ${affordable ? 'text-muted-foreground' : 'text-danger'}`,
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
    [h.Class(`absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col gap-2 p-2 ${PANEL}`)],
    [
      h.div(
        [h.Class('flex items-center gap-3')],
        [
          h.div(
            [
              h.Class(tabsListClass()),
              h.Attribute('data-variant', 'default'),
              h.Role('group'),
              h.AriaLabel('Build group'),
            ],
            BUILD_GROUPS.map((group, index) =>
              h.button(
                [
                  h.Key(group.key),
                  h.Type('button'),
                  h.AriaPressed(group.key === model.buildGroup ? 'true' : 'false'),
                  h.OnClick(Message.BuildGroupChosen({ group: group.key })),
                  h.Class(cn(tabsTriggerClass, 'gap-1.5 px-2.5 text-[12.5px]')),
                  ...(group.key === model.buildGroup ? [h.Attribute('data-selected', '')] : []),
                ],
                [
                  h.span(
                    [h.Class(`${FIGURE} text-[10.5px] text-muted-foreground`)],
                    [String(index + 1)],
                  ),
                  group.label,
                ],
              ),
            ),
          ),
          model.placing
            ? h.span(
                [h.Class('flex items-center gap-1.5 pr-1 text-[12px] text-muted-foreground')],
                ['Click the board to place', Kbd({}, ['Esc'], h)],
              )
            : h.empty,
        ],
      ),
      h.div(
        [h.Class('flex gap-2')],
        items.map((type) => card(model, type, h)),
      ),
    ],
  )
}
