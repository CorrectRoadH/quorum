import type { Html, HtmlBuilder } from 'foldkit/html'
import { logoOf, type LogoId } from '@/game/logos.ts'

/* ==========================================================================
   A Company's logo, wherever the game shows it: the title screen's rows and
   status column, the Companies page, and the board's menu.
   ========================================================================== */

export const companyMark = <M>(logo: LogoId, className: string, h: HtmlBuilder<M>): Html => {
  const def = logoOf(logo)
  return h.svg(
    [
      h.ViewBox('0 0 24 24'),
      h.Class(className),
      h.AriaHidden(true),
      h.Style({ color: `oklch(0.8 0.15 ${def.hue})` }),
    ],
    def.paths.map((d) =>
      h.path([
        h.D(d),
        h.Fill('none'),
        h.Stroke('currentColor'),
        h.StrokeWidth('1.9'),
        h.StrokeLinecap('round'),
        h.StrokeLinejoin('round'),
      ]),
    ),
  )
}
