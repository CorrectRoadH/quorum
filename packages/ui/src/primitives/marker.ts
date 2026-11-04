import type { Html, HtmlBuilder } from 'foldkit/html'

type Child = Html | string

import { cn } from 'cn'

export const markerVariantKeys = ['default', 'separator', 'border'] as const
export type MarkerVariant = (typeof markerVariantKeys)[number]

export const markerVariants: Record<MarkerVariant, string> = {
  default: '',
  separator:
    'before:h-px before:min-w-0 before:flex-1 before:bg-border after:h-px after:min-w-0 after:flex-1 after:bg-border before:mr-1 after:ml-1',
  border: 'border-b border-border pb-2',
}

export const markerClass =
  "gap-2 text-sm text-muted-foreground [a]:hover:text-foreground [a]:underline-offset-3 [a]:underline [&_svg:not([class*='size-'])]:size-4 min-h-4 text-left group/marker relative flex w-full items-center"

export const markerIconClass = "size-4 [&_svg:not([class*='size-'])]:size-4 shrink-0"

export const markerContentClass =
  'group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:hover:text-foreground *:[a]:underline *:[a]:underline-offset-3 min-w-0 wrap-break-word'

type StyleConfig = Readonly<{ className?: string; variant?: MarkerVariant }>

const markerContainer = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.div(
    [
      h.Class(cn(markerClass, markerVariants[config.variant ?? 'default'], config.className)),
      h.DataAttribute('slot', 'marker'),
      h.DataAttribute('variant', config.variant ?? 'default'),
    ],
    children,
  )

const markerIcon = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.span(
    [
      h.Class(cn(markerIconClass, config.className)),
      h.AriaHidden(true),
      h.DataAttribute('slot', 'marker-icon'),
    ],
    children,
  )

const markerContent = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.span(
    [h.Class(cn(markerContentClass, config.className)), h.DataAttribute('slot', 'marker-content')],
    children,
  )

/** Styled marker — `Marker.icon` and `Marker.content` sub-builders. Mirrors the
 *  shadcn v4 `marker.tsx`. */
export const Marker = Object.assign(markerContainer, {
  icon: markerIcon,
  content: markerContent,
})
