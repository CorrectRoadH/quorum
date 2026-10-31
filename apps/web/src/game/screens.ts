import type { Html, HtmlBuilder } from 'foldkit/html'
import { dock } from '@/components/lab/dock.ts'
import { changeBar, goalBar, hud } from '@/components/lab/hud.ts'
import { pager, postmortems } from '@/components/lab/incidents.ts'
import { inspector } from '@/components/lab/inspector.ts'
import {
  devPanel,
  endPanel,
  eraPanel,
  helpPanel,
  offerPanel,
  researchPanel,
} from '@/components/lab/panels.ts'
import { ArrowRight } from 'lucide'
import { icon } from '@/lib/icons'
import { boardHost } from './board-mount.ts'
import { nextGoal } from './engine/goals.ts'
import { eraOf } from './engine/lookups.ts'
import { solve } from './engine/solve.ts'
import { clock, compact } from './format.ts'
import { Message } from './message.ts'
import type { Model } from './model.ts'

/* ==========================================================================
   The two screens. The title is a door; the lab is the game, fullscreen.
   ========================================================================== */

const menuButton = (
  label: string,
  detail: string,
  message: Message,
  primary: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.button(
    [
      h.Key(label),
      h.Type('button'),
      h.OnClick(message),
      h.Class(
        `group flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3.5 text-left transition-[filter] active:translate-y-px ${
          primary
            ? 'bg-primary-fill text-on-primary-fill shadow-primary hover:brightness-110'
            : 'bg-raised shadow-raised hover:brightness-[0.985]'
        }`,
      ),
    ],
    [
      h.span(
        [h.Class('flex flex-col gap-0.5')],
        [
          h.span([h.Class('text-[15px] font-medium')], [label]),
          detail
            ? h.span(
                [
                  h.Class(
                    `font-mono text-[11.5px] tabular-nums ${primary ? 'opacity-70' : 'text-muted-foreground'}`,
                  ),
                ],
                [detail],
              )
            : h.empty,
        ],
      ),
      h.span(
        [h.Class('opacity-60 transition-transform group-hover:translate-x-0.5')],
        [icon(h, ArrowRight, 'size-4')],
      ),
    ],
  )

export const titleScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.game
  return h.main(
    [
      h.Class(
        'relative grid h-full grid-cols-[minmax(360px,440px)_minmax(0,1fr)] items-center gap-10 overflow-hidden bg-background px-[6vw]',
      ),
    ],
    [
      h.div(
        [
          h.Class(
            'pointer-events-none absolute inset-0 bg-[radial-gradient(var(--canvas-dot)_1px,transparent_1px)] [background-size:28px_28px] opacity-70',
          ),
        ],
        [],
      ),
      h.div(
        [h.Class('relative z-10 flex flex-col gap-8')],
        [
          h.h1([h.Class('text-[88px] leading-[0.9] font-semibold tracking-[-0.06em]')], ['Quorum']),
          h.div(
            [h.Class('flex flex-col gap-2 rounded-2xl bg-surface p-2 shadow-card')],
            [
              ...(model.saved
                ? [
                    menuButton(
                      'Continue',
                      `${eraOf(game).name} · ${compact(game.users)} users · ${clock(game.time)}`,
                      Message.Continued(),
                      true,
                      h,
                    ),
                  ]
                : []),
              menuButton(
                model.saved ? 'New company' : 'Start a company',
                '',
                Message.NewCompanyStarted(),
                !model.saved,
                h,
              ),
              menuButton('Start in Pre-seed', '', Message.PreseedStarted(), false, h),
              menuButton('Export playtest log', '', Message.LogExported(), false, h),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('relative z-10 flex min-w-0 items-center justify-center')],
        [
          h.img([
            h.Src('/art/hero.svg'),
            h.Alt(
              'An isometric bench: users, a load balancer, two servers, a cache and a database.',
            ),
            h.Class('w-full max-w-[920px] drop-shadow-sm'),
          ]),
        ],
      ),
    ],
  )
}

export const labScreen = (model: Model, h: HtmlBuilder<Message>): Html => {
  const ledger = solve(model.game)
  return h.main(
    [h.Class('relative h-full overflow-hidden bg-canvas')],
    [
      boardHost(h),
      hud(model, ledger, h),
      goalBar(nextGoal(model.game, ledger), h),
      changeBar(model, h),
      pager(model, h),
      inspector(model, ledger, h),
      postmortems(model, h),
      dock(model, h),
      model.paused
        ? h.div(
            [
              h.Class(
                'pointer-events-none absolute top-[84px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-surface px-3 py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground shadow-card',
              ),
            ],
            ['Paused'],
          )
        : h.empty,
      model.panel === 'research' ? researchPanel(model, h) : h.empty,
      model.panel === 'help' ? helpPanel(h) : h.empty,
      model.panel === 'offer' ? offerPanel(model, h) : h.empty,
      model.panel === 'era' ? eraPanel(model, h) : h.empty,
      model.panel === 'end' ? endPanel(model, h) : h.empty,
      model.panel === 'dev' ? devPanel(model, h) : h.empty,
    ],
  )
}
