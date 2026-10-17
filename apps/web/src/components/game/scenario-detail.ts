import type { Html, HtmlBuilder } from 'foldkit/html'
import { badge } from '@/components/ui/badge'
import type { Message } from '@/game/message.ts'
import type { Scenario } from '@/game/content.ts'

/* ==========================================================================
   The pieces a Briefing is made of: the demand curve, the failures the
   Scenario will inject, and the Components it allows.
   ========================================================================== */

export const demandCurve = (scenario: Scenario, h: HtmlBuilder<Message>): Html =>
  h.svg(
    [
      h.Class('h-[92px] w-full'),
      h.Attribute('viewBox', '0 0 320 96'),
      h.PreserveAspectRatio('none'),
      h.AriaHidden(true),
    ],
    [
      h.line([
        h.Class('stroke-border'),
        h.Attribute('x1', '0'),
        h.Attribute('y1', '24'),
        h.Attribute('x2', '320'),
        h.Attribute('y2', '24'),
        h.Attribute('stroke-dasharray', '2 4'),
      ]),
      h.line([
        h.Class('stroke-border'),
        h.Attribute('x1', '0'),
        h.Attribute('y1', '56'),
        h.Attribute('x2', '320'),
        h.Attribute('y2', '56'),
        h.Attribute('stroke-dasharray', '2 4'),
      ]),
      h.polyline([
        h.Class('fill-none stroke-chart-1 stroke-2'),
        h.Attribute('points', scenario.demand.join(' ')),
        h.Attribute('vector-effect', 'non-scaling-stroke'),
      ]),
      h.line([
        h.Class('stroke-warn'),
        h.Attribute('x1', '178'),
        h.Attribute('y1', '0'),
        h.Attribute('x2', '178'),
        h.Attribute('y2', '96'),
      ]),
    ],
  )

const DOT: Record<'plain' | 'warn' | 'danger', string> = {
  plain: 'border-primary-strong bg-card',
  warn: 'border-warn bg-warn',
  danger: 'border-danger bg-danger',
}

export const timeline = (scenario: Scenario, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('ml-2 flex flex-col border-l border-border')],
    scenario.failures.map((failure) =>
      h.div(
        [h.Key(failure.when), h.Class('relative pb-4 pl-5 last:pb-0')],
        [
          h.span([h.Class(`absolute -left-[5px] top-1 size-2.5 border ${DOT[failure.tone]}`)], []),
          h.div([h.Class('font-mono text-[11px] text-muted-foreground')], [failure.when]),
          h.div([h.Class('text-[13.5px]')], [failure.what]),
        ],
      ),
    ),
  )

export const componentChips = (scenario: Scenario, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex flex-wrap gap-2')],
    scenario.components.map((component) =>
      badge({ variant: component.family === 'cluster' ? 'outline' : 'ghost' }, [component.name], h),
    ),
  )
