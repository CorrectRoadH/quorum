import type { Html, HtmlBuilder } from 'foldkit/html'
import { BellRing, Check, ChevronRight, Gem, Timer, Users, Wallet, X } from 'lucide'
import { ALERT_RULES, INCIDENTS, RESEARCH } from '@/game/engine/catalog.ts'
import { has } from '@/game/engine/lookups.ts'
import type { Game, Postmortem } from '@/game/engine/state.ts'
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
      h.Key('pager'),
      h.DataAttribute('morph', 'notice'),
      h.DataAttribute('exit', 'notice'),
      h.Class(
        'enter-down flex items-center gap-2.5 rounded-xl bg-danger px-3.5 py-2 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.25),0_0_0_1px_color-mix(in_oklch,var(--danger),black_25%),0_10px_24px_-8px_color-mix(in_oklch,var(--danger)_60%,transparent)]',
      ),
    ],
    [
      icon(h, BellRing, 'ring size-4 shrink-0'),
      // A new page swaps in; the pill morphs to its length.
      h.span(
        [
          h.Key(firing.join()),
          h.DataAttribute('exit', 'notice'),
          h.Class('swap whitespace-nowrap'),
        ],
        [firing.map((rule) => ALERT_TEXT[rule]).join(' · ')],
      ),
    ],
  )
}

/** The action item: research the prevention now, or file the postmortem and leave it open. */
const actionButtons = (game: Game, postmortem: Postmortem, h: HtmlBuilder<Message>): Html => {
  const action = postmortem.action && !has(game, postmortem.action) ? postmortem.action : null
  if (!action)
    return button(
      {
        onClick: Message.PostmortemFiled({ id: postmortem.id, take: false }),
        size: 'sm',
        variant: 'outline',
      },
      ['File'],
      h,
    )
  const price = RESEARCH[action].cost
  return h.div(
    [h.Class('flex items-center gap-1')],
    [
      button(
        {
          onClick: Message.PostmortemFiled({ id: postmortem.id, take: true }),
          isDisabled: game.insight < price,
          size: 'sm',
          attributes: [h.Title(`Action item: ${RESEARCH[action].blurb}`)],
        },
        [
          icon(h, Check, 'size-3.5'),
          RESEARCH[action].name,
          h.span([h.Class(cn(FIGURE, 'opacity-75'))], [`${price}`]),
          icon(h, Gem, 'size-3'),
        ],
        h,
      ),
      button(
        {
          onClick: Message.PostmortemFiled({ id: postmortem.id, take: false }),
          size: 'sm',
          variant: 'ghost',
          attributes: [
            h.Title('File and leave the action item open: this incident stays twice as likely'),
            h.AriaLabel('File'),
          ],
        },
        [icon(h, X, 'size-3.5')],
        h,
      ),
    ],
  )
}

/** A postmortem: one compact row with its action item, the details folded away. */
const card = (game: Game, postmortem: Postmortem, h: HtmlBuilder<Message>): Html => {
  const def = INCIDENTS[postmortem.kind]
  return h.details(
    [
      h.Key(`pm-${postmortem.id}`),
      h.DataAttribute('exit', 'gesture'),
      h.DataAttribute('exit-anchor', 'bottom'),
      h.Class(`fold enter-left group w-[380px] compact:w-auto ${PANEL}`),
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
            'fold-chevron size-3.5 shrink-0 text-muted-foreground group-open:rotate-90',
          ),
          badge(
            { variant: def.severity === 2 ? 'destructive' : 'warn', className: 'font-mono' },
            [`SEV${def.severity}`],
            h,
          ),
          h.span([h.Class('min-w-0 flex-1 truncate text-[12.5px] font-semibold')], [def.name]),
          actionButtons(game, postmortem, h),
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

/** The column stays when it is empty, so the last card can still leave. */
export const postmortems = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.DataAttribute('flip', 'gesture'),
      h.Class(
        'absolute bottom-3 left-3 z-20 flex flex-col gap-2 compact:right-2 compact:bottom-[calc(max(8px,env(safe-area-inset-bottom))+68px)] compact:left-2',
      ),
    ],
    model.game.postmortems.slice(-3).map((entry) => card(model.game, entry, h)),
  )
