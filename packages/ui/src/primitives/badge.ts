import type { Html, HtmlBuilder } from 'foldkit/html'

type Child = Html | string

import { cn } from 'cn'

/** Badge variant keys — keep in sync with `badgeVariants`. */
export const badgeVariantKeys = [
  'default',
  'secondary',
  'destructive',
  'ok',
  'warn',
  'outline',
  'ghost',
  'link',
] as const

export const badgeVariants: Record<BadgeVariant, string> = {
  default:
    'bg-primary/14 text-primary-strong shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_28%,transparent)]',
  secondary: 'bg-well text-muted-foreground shadow-well',
  destructive:
    'bg-destructive/10 text-destructive shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--destructive)_25%,transparent)]',
  ok: 'bg-ok/12 text-ok shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--ok)_25%,transparent)]',
  warn: 'bg-warn/14 text-warn shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--warn)_28%,transparent)]',
  outline: 'bg-raised text-foreground shadow-raised',
  ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
  link: 'text-primary underline-offset-4 hover:underline',
}

export type BadgeVariant = (typeof badgeVariantKeys)[number]

export const badgeClass =
  'h-5 gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-[11px] font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none'

type StyleConfig = Readonly<{ className?: string; variant?: BadgeVariant }>

/** Styled badge built as a themed `<span>` (mirrors the shadcn v4 `badge.tsx`
 *  default element). For a link badge, render an `<a>` child and apply
 *  `badgeClass` via `cn` — foldcn has no Radix `Slot`. */
export const badge = <M>(
  config: StyleConfig,
  children: ReadonlyArray<Child>,
  h: HtmlBuilder<M>,
): Html =>
  h.span(
    [
      h.Class(cn(badgeClass, badgeVariants[config.variant ?? 'default'], config.className)),
      h.DataAttribute('slot', 'badge'),
      h.DataAttribute('variant', config.variant ?? 'default'),
    ],
    children,
  )
