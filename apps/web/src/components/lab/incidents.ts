import type { Html, HtmlBuilder } from 'foldkit/html'
import { BellRing, FileText } from 'lucide'
import { ALERT_RULES, INCIDENTS } from '@/game/engine/catalog.ts'
import { has } from '@/game/engine/lookups.ts'
import type { Postmortem } from '@/game/engine/state.ts'
import { compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { EYEBROW, PANEL } from './bits.ts'

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
        'pointer-events-none absolute top-[76px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 border border-danger bg-danger px-4 py-2 text-[13px] font-semibold text-white shadow-lg',
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
      h.Class(`flex w-[300px] flex-col gap-2 p-3 ${PANEL} animate-in fade-in slide-in-from-left-2`),
    ],
    [
      h.div(
        [h.Class('flex items-baseline justify-between gap-2')],
        [
          h.span([h.Class('text-[13.5px] font-semibold')], [def.name]),
          h.span(
            [h.Class(`${EYEBROW} ${def.severity === 2 ? 'text-danger' : ''}`)],
            [`SEV${def.severity}`],
          ),
        ],
      ),
      h.p(
        [h.Class('text-[12px] leading-snug text-muted-foreground')],
        [postmortem.target ? `${postmortem.target}: ${def.cause}` : def.cause],
      ),
      h.div(
        [h.Class('grid grid-cols-3 gap-2 font-mono text-[11px]')],
        [
          h.span([], [`MTTR ${Math.round(postmortem.mttr)}m`]),
          h.span([], [`−${compact(postmortem.lostUsers)} users`]),
          h.span([], [`−${money(postmortem.lostRevenue)}`]),
        ],
      ),
      h.p([h.Class('text-[12px] leading-snug')], [def.prevention]),
      h.button(
        [
          h.Type('button'),
          h.OnClick(Message.PostmortemFiled({ id: postmortem.id })),
          h.Class(
            'flex h-8 items-center justify-center gap-1.5 border border-primary-strong bg-primary text-[12px] font-semibold text-primary-foreground hover:bg-primary/85',
          ),
        ],
        [icon(h, FileText, 'size-3.5'), `Write postmortem · +${postmortem.reward} ◆`],
      ),
    ],
  )
}

export const postmortems = (model: Model, h: HtmlBuilder<Message>): Html =>
  model.game.postmortems.length === 0
    ? h.empty
    : h.div(
        [h.Class('absolute bottom-4 left-4 z-20 flex flex-col gap-2')],
        model.game.postmortems.slice(-2).map((entry) => card(entry, h)),
      )
