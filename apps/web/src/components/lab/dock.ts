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
import { COMPONENT_ICONS, GROUP_ICONS } from '@/game/icons.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import { FIGURE, PANEL, tool } from './bits.ts'

/* ==========================================================================
   The build dock: four group icons. A group opens its tray of Components;
   pick one, then click the board to place it.
   ========================================================================== */

const tile = (model: Model, type: ComponentId, h: HtmlBuilder<Message>): Html => {
  const def = COMPONENTS[type]
  const unlocked = isUnlocked(model.game, type)
  const price = priceOf(model.game, type)
  const affordable = model.game.cash >= price
  const armed = model.placing === type
  return h.button(
    [
      h.Key(type),
      h.Type('button'),
      h.Title(
        unlocked
          ? `${def.name}: ${def.blurb}`
          : `${def.name}: research ${RESEARCH[def.unlock ?? 'stripe'].name} to unlock`,
      ),
      h.OnClick(Message.PlacingChosen({ type })),
      h.Class(
        `press flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-xl px-1.5 pt-2.5 pb-2 ${
          armed
            ? 'bg-raised shadow-[var(--elev-raised),0_0_0_1.5px_var(--primary-strong)]'
            : unlocked
              ? 'bg-raised shadow-raised hover:brightness-[0.985]'
              : 'border border-dashed border-border text-muted-foreground'
        }`,
      ),
    ],
    [
      h.span(
        [h.Class('relative grid size-9 place-items-center rounded-lg bg-well shadow-well')],
        [
          icon(h, COMPONENT_ICONS[type], cn('size-[18px]', unlocked ? '' : 'opacity-40')),
          unlocked
            ? h.empty
            : h.span(
                [
                  h.Class(
                    'absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-surface text-muted-foreground shadow-raised',
                  ),
                ],
                [icon(h, Lock, 'size-2.5')],
              ),
        ],
      ),
      h.span(
        [h.Class('w-full truncate text-center text-[11.5px] leading-none font-medium')],
        [def.name],
      ),
      h.span(
        [
          h.Class(
            cn(
              FIGURE,
              'w-full truncate text-center text-[11px] leading-none',
              unlocked && !affordable ? 'text-danger' : 'text-muted-foreground',
            ),
          ),
        ],
        [unlocked ? money(price) : 'Locked'],
      ),
    ],
  )
}

export const dock = (model: Model, h: HtmlBuilder<Message>): Html => {
  const open = model.buildGroup
  const items = COMPONENT_IDS.filter(
    (type) => COMPONENTS[type].group === open && !COMPONENTS[type].fixed,
  )
  return h.div(
    [
      h.Class(
        `absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 p-1.5 ${PANEL}`,
      ),
    ],
    [
      open
        ? h.div(
            [h.Key('tray'), h.Class('enter-pop flex gap-1.5')],
            items.map((type) => tile(model, type, h)),
          )
        : h.empty,
      h.div(
        [h.Class('flex items-center gap-1'), h.Role('group'), h.AriaLabel('Build')],
        [
          ...BUILD_GROUPS.map((group, index) => {
            const active = group.key === open
            return h.button(
              [
                h.Key(group.key),
                h.Type('button'),
                h.Title(`${group.label} (${index + 1})`),
                h.AriaLabel(group.label),
                h.AriaPressed(active ? 'true' : 'false'),
                h.OnClick(Message.BuildGroupChosen({ group: group.key })),
                h.Class(cn(tool(active), 'flex w-auto gap-2 px-3 text-[13px] font-medium')),
              ],
              [
                icon(h, GROUP_ICONS[group.key], 'size-[18px]'),
                group.label,
                h.span([h.Class(cn(FIGURE, 'text-[10px] opacity-55'))], [String(index + 1)]),
              ],
            )
          }),
          model.placing
            ? h.span(
                [h.Class('flex items-center gap-1.5 px-2 text-[12px] text-muted-foreground')],
                [
                  icon(h, COMPONENT_ICONS[model.placing], 'size-3.5 text-foreground'),
                  Kbd({}, ['Esc'], h),
                ],
              )
            : h.empty,
        ],
      ),
    ],
  )
}
