import type { Html, HtmlBuilder } from 'foldkit/html'
import { BellRing, ChevronRight, FileText, Gem, Timer, Users, Wallet } from 'lucide'
import { ALERT_RULES, INCIDENTS } from '@/game/engine/catalog.ts'
import { has } from '@/game/engine/lookups.ts'
import type { Postmortem } from '@/game/engine/state.ts'
import { compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, PANEL, WELL } from './bits.ts'

/* ==========================================================================
   The incident loop on screen: the pager, once Alerting is researched, and
   the postmortems waiting to be written.
   ========================================================================== */

const ALERT_TEXT = {
  errors: 'Error rate above 1%',
  latency: 'p99 above 4× the Apdex target',
  saturation: 'A Node above 90% load',
} as const

/** Symptom-based pages, like real alerting: they name what users feel, not the cause. */
export const pager = (model: Model, h: HtmlBuilder<Message>): Html => {
  if (!has(model.game, 'alerting')) return h.empty
  const firing = (Object.keys(ALERT_RULES) as Array<keyof typeof ALERT_RULES>).filter(
    (rule) => model.game.alarms[rule] >= ALERT_RULES[rule].seconds,
  )
  if (firing.length === 0) return h.empty
  return h.div(
    [
      h.Class(
        'flex items-center gap-2.5 rounded-xl bg-danger px-3.5 py-2 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.25),0_0_0_1px_color-mix(in_oklch,var(--danger),black_25%),0_10px_24px_-8px_color-mix(in_oklch,var(--danger)_60%,transparent)]',
      ),
    ],
    [
      icon(h, BellRing, 'size-4 animate-pulse'),
      h.span([], [firing.map((rule) => ALERT_TEXT[rule]).join(' · ')]),
    ],
  )
}

/** A postmortem: one compact row to file it, with the details folded away. */
const card = (postmortem: Postmortem, h: HtmlBuilder<Message>): Html => {
  const def = INCIDENTS[postmortem.kind]
  return h.details(
    [
      h.Key(`pm-${postmortem.id}`),
      h.Class(`group w-[340px] ${PANEL} animate-in fade-in slide-in-from-left-2`),
    ],
    [
      h.summary(
        [
          h.Class(
            'flex cursor-pointer list-none items-center gap-2 p-1.5 pl-2.5 [&::-webkit-details-marker]:hidden',
          ),
          h.Title('Show details'),
        ],
        [
          icon(
            h,
            ChevronRight,
            'size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90',
          ),
          badge(
            { variant: def.severity === 2 ? 'destructive' : 'warn', className: 'font-mono' },
            [`SEV${def.severity}`],
            h,
          ),
          h.span([h.Class('min-w-0 flex-1 truncate text-[12.5px] font-semibold')], [def.name]),
          button(
            {
              onClick: Message.PostmortemFiled({ id: postmortem.id }),
              size: 'sm',
              attributes: [h.Title('Write postmortem')],
            },
            [
              icon(h, FileText, 'size-3.5'),
              'Write',
              h.span([h.Class(cn(FIGURE, 'opacity-75'))], [`+${postmortem.reward}`]),
              icon(h, Gem, 'size-3'),
            ],
            h,
          ),
        ],
      ),
      h.div(
        [h.Class('flex flex-col gap-2.5 px-3 pt-1 pb-3')],
        [
          h.p(
            [h.Class('text-[12px] leading-snug text-muted-foreground')],
            [postmortem.target ? `${postmortem.target}: ${def.cause}` : def.cause],
          ),
          h.div(
            [h.Class(`grid grid-cols-3 divide-x divide-hairline ${WELL}`)],
            (
              [
                ['MTTR', Timer, `${Math.round(postmortem.mttr)}m`],
                ['Users', Users, `−${compact(postmortem.lostUsers)}`],
                ['Revenue', Wallet, `−${money(postmortem.lostRevenue)}`],
              ] as const
            ).map(([name, glyph, value]) =>
              h.div(
                [h.Key(name), h.Class('flex flex-col gap-1 px-2.5 py-1.5')],
                [
                  h.span(
                    [h.Class(cn(EYEBROW, 'flex items-center gap-1'))],
                    [icon(h, glyph, 'size-3 shrink-0'), name],
                  ),
                  h.span([h.Class(`${FIGURE} text-[12.5px]`)], [value]),
                ],
              ),
            ),
          ),
          h.p([h.Class('text-[12px] leading-snug')], [def.prevention]),
        ],
      ),
    ],
  )
}

export const postmortems = (model: Model, h: HtmlBuilder<Message>): Html =>
  model.game.postmortems.length === 0
    ? h.empty
    : h.div(
        [h.Class('absolute bottom-3 left-3 z-20 flex flex-col gap-2')],
        model.game.postmortems.slice(-3).map((entry) => card(entry, h)),
      )
