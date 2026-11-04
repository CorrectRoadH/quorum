import type { Html, HtmlBuilder } from 'foldkit/html'

type Child = Html | string

import { cn } from 'cn'

export const kbdClass =
  "bg-raised shadow-raised text-foreground/75 in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:bg-none in-data-[slot=tooltip-content]:shadow-none in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 h-5 w-fit min-w-5 gap-1 rounded-[5px] px-1.5 font-mono text-[10.5px] font-medium [&_svg:not([class*='size-'])]:size-3 pointer-events-none inline-flex items-center justify-center select-none"

export const kbdGroupClass = 'gap-1 inline-flex items-center'

type StyleConfig = Readonly<{ className?: string }>

const kbdContainer = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.kbd([h.Class(cn(kbdClass, config.className)), h.DataAttribute('slot', 'kbd')], children)

const kbdGroup = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.kbd(
    [h.Class(cn(kbdGroupClass, config.className)), h.DataAttribute('slot', 'kbd-group')],
    children,
  )

/** Styled keyboard key(s). `Kbd.group` clusters several keys. Mirrors the
 *  shadcn v4 `kbd.tsx`. */
export const Kbd = Object.assign(kbdContainer, { group: kbdGroup })
