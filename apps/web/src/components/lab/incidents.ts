import type { Html, HtmlBuilder } from 'foldkit/html'
import {
  BellOff,
  BellRing,
  Check,
  ChevronRight,
  FileBadge,
  Lock,
  Timer,
  Undo2,
  Users,
  Wallet,
  X,
} from 'lucide'
import { ALERT_RULES, ALERT_THRESHOLDS, INCIDENTS, RESEARCH } from '@quorum/simulation/catalog'
import type { AlertRule } from '@quorum/simulation/events'
import { has } from '@quorum/simulation/lookups'
import { ignored } from '@quorum/simulation/step'
import type { Game, Postmortem } from '@quorum/simulation/state'
import { alertText, compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { recipeOf } from '@/game/pools.ts'
import { icon } from '@/lib/icons'
import { badge } from '@/components/ui/badge'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, PANEL, WELL, insightChip } from './bits.ts'

/* ==========================================================================
   The incident loop on screen: the pager, once Alerting is researched, and
   the postmortems waiting to be written.
   ========================================================================== */

/** Symptom-based pages, like real alerting: they name what users feel, not the cause. A rule
 * that cried wolf too often today is ignored until the player changes its threshold. */
export const pager = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  if (!has(game, 'alerting')) return h.empty
  const rules = Object.keys(ALERT_RULES) as Array<AlertRule>
  const firing = rules.filter(
    (rule) => !ignored(game, rule) && game.alarms[rule] >= ALERT_RULES[rule].seconds,
  )
  const muted = rules.filter((rule) => ignored(game, rule))
  if (firing.length === 0 && muted.length === 0) return h.empty
  return h.div(
    [h.Class('flex flex-col items-center gap-1.5')],
    [
      firing.length > 0
        ? h.div(
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
                [firing.map((rule) => alertText(rule, game.alertRules[rule])).join(' · ')],
              ),
            ],
          )
        : h.empty,
      ...muted.map((rule) =>
        h.div(
          [
            h.Key(`ignored-${rule}`),
            h.Class(cn('flex items-center gap-2 py-1 pr-1 pl-3 text-[12.5px]', PANEL)),
          ],
          [
            icon(h, BellOff, 'size-3.5 text-muted-foreground'),
            h.span([h.Class('font-medium')], [alertText(rule, game.alertRules[rule])]),
            badge({ variant: 'warn' }, ['Ignored'], h),
            h.div(
              [h.Class(cn('flex gap-[3px] rounded-lg p-[3px]', WELL))],
              ALERT_THRESHOLDS[rule].map((threshold) =>
                h.button(
                  [
                    h.Key(`${rule}-${threshold}`),
                    h.Type('button'),
                    h.AriaPressed(threshold === game.alertRules[rule] ? 'true' : 'false'),
                    h.OnClick(Message.AlertRuleChosen({ rule, threshold })),
                    h.Class(
                      cn(
                        FIGURE,
                        'h-6 rounded-md px-2 text-[11.5px]',
                        threshold === game.alertRules[rule]
                          ? 'bg-raised text-foreground shadow-raised'
                          : 'text-muted-foreground hover:text-foreground',
                      ),
                    ),
                  ],
                  [rule === 'latency' ? `${threshold}×` : `${Math.round(threshold * 1000) / 10}%`],
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  )
}

/** A bad deploy on screen: App Servers crash until it is rolled back or runs its course. */
export const badDeploy = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  if (game.incident?.kind !== 'bad-deploy') return h.empty
  const ready = has(game, 'ci')
  return h.div(
    [
      h.Key('bad-deploy'),
      h.Class(
        'pointer-events-auto enter-down flex items-center gap-2.5 rounded-xl bg-danger py-1.5 pr-1.5 pl-3.5 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.25),0_0_0_1px_color-mix(in_oklch,var(--danger),black_25%),0_10px_24px_-8px_color-mix(in_oklch,var(--danger)_60%,transparent)]',
      ),
    ],
    [
      h.span([], [INCIDENTS['bad-deploy'].name]),
      button(
        {
          onClick: Message.RolledBack(),
          isDisabled: !ready,
          size: 'sm',
          variant: 'outline',
          attributes: [h.Title(ready ? 'Roll back' : `Research ${RESEARCH.ci.name} to roll back`)],
        },
        [icon(h, ready ? Undo2 : Lock, 'size-3.5'), 'Roll back'],
        h,
      ),
    ],
  )
}

/** An expired certificate on screen: every request fails until it is renewed. */
/** Incidents one action ends, with no Node to select: a banner with the fix. */
const BANNERS = {
  certificate: { label: 'Renew', message: Message.CertificateRenewed() },
  bgp: { label: 'Roll back', message: Message.RoutesRolledBack() },
  partition: { label: 'Fence leader', message: Message.LeaderFenced() },
} as const

export const expiredCertificate = (model: Model, h: HtmlBuilder<Message>): Html => {
  const kind = model.game.incident?.kind
  if (kind !== 'certificate' && kind !== 'bgp' && kind !== 'partition') return h.empty
  const banner = BANNERS[kind]
  return h.div(
    [
      h.Key(kind),
      h.Class(
        'pointer-events-auto enter-down flex items-center gap-2.5 rounded-xl bg-danger py-1.5 pr-1.5 pl-3.5 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.25),0_0_0_1px_color-mix(in_oklch,var(--danger),black_25%),0_10px_24px_-8px_color-mix(in_oklch,var(--danger)_60%,transparent)]',
      ),
    ],
    [
      h.span([], [INCIDENTS[kind].name]),
      button(
        { onClick: banner.message, size: 'sm', variant: 'outline' },
        [icon(h, FileBadge, 'size-3.5'), banner.label],
        h,
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
  return h.div(
    [h.Class('flex items-center gap-1')],
    [
      button(
        {
          onClick: Message.PostmortemFiled({ id: postmortem.id, take: true }),
          size: 'sm',
          attributes: [h.Title(`Action item: ${RESEARCH[action].blurb}`)],
        },
        [
          icon(h, Check, 'size-3.5'),
          RESEARCH[action].name,
          ...recipeOf(action).map(([pool, cost]) => insightChip(pool, compact(cost), h)),
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
            {
              variant: postmortem.severity <= 2 ? 'destructive' : 'warn',
              className: 'font-mono',
            },
            [`SEV${postmortem.severity}`],
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
        'absolute bottom-3 left-3 z-20 flex flex-col gap-2 compact:static compact:w-auto compact:pointer-events-auto short:[&>details:not(:last-child)]:hidden',
      ),
    ],
    model.game.postmortems.slice(-3).map((entry) => card(model.game, entry, h)),
  )
