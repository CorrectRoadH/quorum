import type { Html, HtmlBuilder } from 'foldkit/html'
import { Lock, X } from 'lucide'
import {
  BUILD_GROUPS,
  COMPONENTS,
  RESEARCH,
  type BuildGroup,
  type ComponentId,
} from '@/game/engine/catalog.ts'
import { buildItems, isUnlocked, priceOf } from '@/game/engine/lookups.ts'
import { money } from '@/game/format.ts'
import { COMPONENT_ICONS, GROUP_ICONS } from '@/game/icons.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import { FIGURE, GROUP_TEXT, PANEL, groupBadge, tool } from './bits.ts'

/* ==========================================================================
   The build dock, disclosed in steps: four group icons. A group opens a list
   of its Components; picking one closes the list and arms it, then a click
   on the board places it.
   ========================================================================== */

/** A row is 48px with a 2px gap; the list's height follows from the count. */
const ROW = 50

const TAB_OFFSET: Record<BuildGroup, string> = {
  edge: 'translate-x-0',
  compute: 'translate-x-11',
  data: 'translate-x-22',
  ops: 'translate-x-33',
}

const row = (model: Model, type: ComponentId, index: number, h: HtmlBuilder<Message>): Html => {
  const def = COMPONENTS[type]
  const unlocked = isUnlocked(model.game, type)
  const price = priceOf(model.game, type)
  return h.button(
    [
      h.Key(type),
      h.Type('button'),
      h.OnClick(Message.PlacingChosen({ type })),
      h.Class(
        cn(
          'press flex h-12 w-full shrink-0 items-center gap-3 rounded-xl px-2.5 text-left hover:bg-well',
          unlocked ? '' : 'opacity-70',
        ),
      ),
    ],
    [
      groupBadge(def.group, COMPONENT_ICONS[type], 'size-8 shrink-0', h, !unlocked),
      h.span(
        [h.Class('flex min-w-0 flex-1 flex-col gap-0.5')],
        [
          h.span([h.Class('text-[13px] leading-none font-medium')], [def.name]),
          h.span(
            [h.Class('truncate text-[11.5px] leading-tight text-muted-foreground')],
            [def.blurb],
          ),
        ],
      ),
      unlocked
        ? h.span(
            [h.Class(cn(FIGURE, 'text-[12.5px]', model.game.cash >= price ? '' : 'text-danger'))],
            [model.game.sandbox ? '' : money(price)],
          )
        : h.span(
            [h.Class('flex items-center gap-1 text-[11px] text-muted-foreground')],
            [icon(h, Lock, 'size-3'), RESEARCH[def.unlock ?? 'stripe'].name],
          ),
      Kbd({}, [String(index + 1)], h),
    ],
  )
}

/** The part in hand: its mark and name, and a way to put it down. */
const armed = (type: ComponentId, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Key('armed'), h.Class('enter-pop flex items-center gap-2 pr-1 pl-2 text-[12.5px]')],
    [
      groupBadge(COMPONENTS[type].group, COMPONENT_ICONS[type], 'size-5', h),
      h.span([h.Class('font-medium')], [COMPONENTS[type].name]),
      h.span([h.Class('text-muted-foreground compact:hidden')], ['Click the board']),
      h.button(
        [
          h.Type('button'),
          h.Title('Stop placing (Esc)'),
          h.AriaLabel('Stop placing'),
          h.OnClick(Message.PlacingChosen({ type: null })),
          h.Class(tool(false)),
        ],
        [icon(h, X, 'size-4')],
      ),
    ],
  )

export const dock = (model: Model, h: HtmlBuilder<Message>): Html => {
  const open = model.buildGroup
  return h.div(
    [
      h.Class(
        `absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-col items-stretch p-1.5 ${PANEL} compact:right-[max(8px,env(safe-area-inset-right))] compact:bottom-[max(8px,env(safe-area-inset-bottom))] compact:left-[max(8px,env(safe-area-inset-left))] compact:translate-x-0`,
      ),
    ],
    [
      // The list always renders; its height is known from the row count, so the panel
      // grows, shrinks and moves between groups instead of snapping.
      h.div(
        [
          h.Key('list'),
          h.Style({ height: `${open ? buildItems(open).length * ROW + 2 : 0}px` }),
          h.AriaHidden(!open),
          h.Class(
            cn(
              'max-w-full self-center overflow-hidden transition-[height,width] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none compact:w-auto compact:self-stretch',
              open ? 'w-[420px]' : 'w-0',
            ),
          ),
        ],
        [
          h.div(
            [h.Class('flex flex-col gap-0.5 pb-1')],
            buildItems(model.lastGroup).map((type, index) => row(model, type, index, h)),
          ),
        ],
      ),
      h.div(
        [h.Class('flex items-center justify-center gap-1'), h.Role('group'), h.AriaLabel('Build')],
        [
          h.div(
            [h.Class('relative flex gap-1')],
            [
              // One highlight slides between the tabs. It is a fresh element each time the
              // list opens, so it fades in on the tab you clicked instead of sliding from another.
              open
                ? h.span(
                    [
                      h.Key('tab-highlight'),
                      // The offset is a class, not an inline style: a style set after the element
                      // is inserted would transition from the left edge.
                      h.Class(
                        cn(
                          'animate-in fade-in pointer-events-none absolute top-0 left-0 size-10 rounded-xl bg-well shadow-well transition-[translate] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                          TAB_OFFSET[open],
                        ),
                      ),
                    ],
                    [],
                  )
                : h.empty,
              ...BUILD_GROUPS.map((group, index) =>
                h.button(
                  [
                    h.Key(group.key),
                    h.Type('button'),
                    h.Title(`${group.label} (${index + 1})`),
                    h.AriaLabel(group.label),
                    h.AriaPressed(group.key === open ? 'true' : 'false'),
                    h.OnClick(Message.BuildGroupChosen({ group: group.key })),
                    h.Class(
                      cn(
                        'press relative grid size-10 shrink-0 place-items-center rounded-xl',
                        group.key === open ? '' : 'hover:bg-well',
                      ),
                    ),
                  ],
                  [
                    groupBadge(group.key, GROUP_ICONS[group.key], 'size-6', h),
                    // The open tab carries its group colour as an underline.
                    h.span(
                      [
                        h.Class(
                          cn(
                            'absolute bottom-1 h-0.5 rounded-full bg-current transition-[width] duration-200',
                            group.key === open ? 'w-4' : 'w-0',
                            GROUP_TEXT[group.key],
                          ),
                        ),
                      ],
                      [],
                    ),
                  ],
                ),
              ),
            ],
          ),
          model.placing ? armed(model.placing, h) : h.empty,
        ],
      ),
    ],
  )
}
