import type { Html, HtmlBuilder } from 'foldkit/html'

import { cn } from 'cn'
import { button, type ButtonConfig, type ButtonSize, type ButtonVariant } from './button'
import { separatorClass } from './separator'

type Child = Html | string

// ButtonGroup connects a run of controls into a single segmented control.
// Children keep their own outlines; the group's corner-cutting rules join
// them (upstream model).

export const buttonGroupClass =
  "has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-lg flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1"

export const buttonGroupOrientationClasses = {
  horizontal:
    '[&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-lg! *:data-slot:rounded-r-none [&>[data-slot]~[data-slot]]:rounded-l-none [&>[data-slot]~[data-slot]]:border-l-0',
  vertical:
    '[&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-lg! flex-col *:data-slot:rounded-b-none [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0',
} as const

export type ButtonGroupOrientation = keyof typeof buttonGroupOrientationClasses

/** Upstream ButtonGroupText string. */
export const buttonGroupTextClass =
  "bg-well shadow-well gap-2 rounded-lg px-2.5 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 flex items-center [&_svg]:pointer-events-none"

/** Upstream ButtonGroupSeparator string. */
export const buttonGroupSeparatorClass =
  'bg-hairline relative self-stretch data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto'

type StyleConfig = Readonly<{ className?: string; orientation?: ButtonGroupOrientation }>

/** Segmented container — pass buttons/selects/inputs as children. */
export const buttonGroup = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html => {
  const orientation = config.orientation ?? 'horizontal'
  return h.div(
    [
      h.Role('group'),
      h.Class(cn(buttonGroupClass, buttonGroupOrientationClasses[orientation], config.className)),
      h.DataAttribute('slot', 'button-group'),
      h.DataAttribute('orientation', orientation),
    ],
    children,
  )
}

/** Non-interactive text label inside a group. */
export const buttonGroupText = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.div(
    [
      h.DataAttribute('slot', 'button-group-text'),
      h.Class(cn(buttonGroupTextClass, config.className)),
    ],
    children,
  )

// Upstream renders the shared <Separator> part; foldcn composes the same
// attribute set and class merge (separator base wins conflicts first) by hand.

/** Divider between grouped controls — a vertical `Separator` by default,
 *  matching upstream `ButtonGroupSeparator`. Upstream emits only
 *  `data-orientation` + `data-slot`; the `data-horizontal` / `data-vertical`
 *  selectors in the token are matched via the Separator's own
 *  `data-horizontal` / `data-vertical` attributes (see separator.ts). */
export const buttonGroupSeparator = <M>(config: StyleConfig, h: HtmlBuilder<M>): Html => {
  const orientation = config.orientation ?? 'vertical'
  return h.div(
    [
      h.Role('separator'),
      h.AriaOrientation(orientation),
      h.DataAttribute('slot', 'button-group-separator'),
      h.DataAttribute('orientation', orientation),
      h.DataAttribute(orientation, ''),
      h.Class(cn(separatorClass, buttonGroupSeparatorClass, config.className)),
    ],
    [],
  )
}

/** A `button` styled to sit inside a `buttonGroup`. */
export const buttonGroupItem = <M>(
  config: ButtonConfig<M>,
  label: Html | string,
  h: HtmlBuilder<M>,
): Html =>
  button<M>(
    {
      ...config,
      size: config.size ?? ('default' satisfies ButtonSize),
      variant: config.variant ?? ('outline' satisfies ButtonVariant),
      className: cn(config.className),
    },
    label,
    h,
  )
