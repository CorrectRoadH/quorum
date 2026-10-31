import type { Html, HtmlBuilder } from 'foldkit/html'
import { BellRing, FileText } from 'lucide'
import { ALERT_RULES, INCIDENTS } from '@/game/engine/catalog.ts'
import { has } from '@/game/engine/lookups.ts'
import type { Postmortem } from '@/game/engine/state.ts'
import { compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
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
        'pointer-events-none absolute top-[84px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-danger px-3.5 py-2 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.25),0_0_0_1px_color-mix(in_oklch,var(--danger),black_25%),0_10px_24px_-8px_color-mix(in_oklch,var(--danger)_60%,transparent)]',
      ),
    ],
    [
      icon(h, BellRing, 'size-4 animate-pulse'),
      h.span([], [firing.map((rule) => ALERT_TEXT[rule]).join(' · ')]),
    ],
  )
}

const card = (postmortem: Postmortem, h: HtmlBuilder<Message>): Html => {
  const def = INCIDENTS[postmortem.kind]
  return h.div(
    [
      h.Key(`pm-${postmortem.id}`),
      h.Class(
        `flex w-[300px] flex-col gap-2.5 p-3 ${PANEL} animate-in fade-in slide-in-from-left-2`,
      ),
    ],
    [
      h.div(
        [h.Class('flex items-baseline justify-between gap-2')],
        [
          h.span([h.Class('text-[13.5px] font-semibold')], [def.name]),
          badge(
            { variant: def.severity === 2 ? 'destructive' : 'warn', className: 'font-mono' },
            [`SEV${def.severity}`],
            h,
          ),
        ],
      ),
      h.p(
        [h.Class('text-[12px] leading-snug text-muted-foreground')],
        [postmortem.target ? `${postmortem.target}: ${def.cause}` : def.cause],
      ),
      h.div(
        [h.Class(`grid grid-cols-3 divide-x divide-hairline ${WELL}`)],
        (
          [
            ['MTTR', `${Math.round(postmortem.mttr)}m`],
            ['Users', `−${compact(postmortem.lostUsers)}`],
            ['Revenue', `−${money(postmortem.lostRevenue)}`],
          ] as const
        ).map(([name, value]) =>
          h.div(
            [h.Key(name), h.Class('flex flex-col gap-0.5 px-2.5 py-1.5')],
            [
              h.span([h.Class(EYEBROW)], [name]),
              h.span([h.Class(`${FIGURE} text-[12.5px]`)], [value]),
            ],
          ),
        ),
      ),
      h.p([h.Class('text-[12px] leading-snug')], [def.prevention]),
      button(
        { onClick: Message.PostmortemFiled({ id: postmortem.id }), className: 'w-full' },
        [
          icon(h, FileText, 'size-3.5'),
          'Write postmortem',
          h.span([h.Class(`${FIGURE} opacity-75`)], [`+${postmortem.reward} ◆`]),
        ],
        h,
      ),
    ],
  )
}

export const postmortems = (model: Model, h: HtmlBuilder<Message>): Html =>
  model.game.postmortems.length === 0
    ? h.empty
    : h.div(
        [h.Class('absolute bottom-3 left-3 z-20 flex flex-col gap-2')],
        model.game.postmortems.slice(-2).map((entry) => card(entry, h)),
      )
