import type { Html, HtmlBuilder } from 'foldkit/html'
import { churnOf, type ChurnFix, type ChurnRow, type RegionChurn } from '@quorum/simulation/churn'
import { COMPONENTS, REGION_INFO, RESEARCH } from '@quorum/simulation/catalog'
import { openRegions } from '@quorum/simulation/regions'
import type { Game } from '@quorum/simulation/state'
import { compact, ms } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import { ledgerOf, type Model } from '@/game/model.ts'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FIGURE, SCROLL, WELL, toneText } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   The Churn breakdown (GDD 12): why each region's Users leave, and the fixes
   that win back the Apdex the region needs. It opens from Users on the HUD.
   ========================================================================== */

/** The button that applies a row's fix, or its advice as text. */
const fixOf = (game: Game, fix: ChurnFix, h: HtmlBuilder<Message>): Html => {
  if (fix._tag === 'advice')
    return h.span([h.Class('text-[12px] leading-snug text-muted-foreground')], [fix.text])
  const [label, message] =
    fix._tag === 'region'
      ? [
          `${openRegions(game).includes(fix.region) ? 'Build in' : 'Open'} ${REGION_INFO[fix.region].name}`,
          Message.ChurnFixTaken({ fix: 'region', target: fix.region }),
        ]
      : fix._tag === 'research'
        ? [
            `Research ${RESEARCH[fix.research].name}`,
            Message.ChurnFixTaken({ fix: 'research', target: fix.research }),
          ]
        : [
            `Show ${COMPONENTS[game.nodes.find((node) => node.id === fix.nodeId)?.type ?? 'server'].name}`,
            Message.ChurnFixTaken({ fix: 'node', target: fix.nodeId }),
          ]
  return button(
    { onClick: message, variant: 'outline', size: 'sm', className: 'justify-self-start' },
    label,
    h,
  )
}

const row = (
  game: Game,
  entry: ChurnRow,
  widest: number,
  fixed: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(`${entry.kind}:${entry.cause}`),
      h.Class(
        cn(
          'grid grid-cols-[56px_64px_1fr_44px_minmax(0,180px)] items-center gap-3 px-3 py-1.5 compact:grid-cols-[48px_56px_1fr_40px]',
          !entry.needed && 'opacity-60',
        ),
      ),
    ],
    [
      h.span([h.Class('text-[12.5px] font-medium')], [entry.kind]),
      h.span(
        [
          h.Class(
            cn(
              'text-[12px]',
              entry.cause === 'slow' || entry.cause === 'far' ? 'text-warn' : 'text-danger',
            ),
          ),
        ],
        [entry.cause],
      ),
      h.div(
        [
          h.Class('h-1.5 rounded-full bg-muted'),
          h.Title(entry.p99 === null ? '' : `p99 ${ms(entry.p99)} · T ${ms(entry.target)}`),
        ],
        [
          h.div(
            [
              h.Class(
                cn('h-full rounded-full', entry.needed ? 'bg-danger' : 'bg-muted-foreground'),
              ),
              h.Style({ width: `${Math.max(4, (entry.points / widest) * 100)}%` }),
            ],
            [],
          ),
        ],
      ),
      h.span([h.Class(cn(FIGURE, 'text-right text-[12px]'))], [entry.points.toFixed(3)]),
      h.div([h.Class('compact:col-span-4')], fixed ? [fixOf(game, entry.fix, h)] : []),
    ],
  )

const section = (game: Game, region: RegionChurn, h: HtmlBuilder<Message>): Html => {
  const falling = region.perHour < 0
  const share = region.users > 0 ? (region.perHour / region.users) * 100 : 0
  const widest = region.rows.reduce((most, entry) => Math.max(most, entry.points), 0.001)
  return h.section(
    [h.Key(region.region), h.Class(cn('flex flex-col py-1', WELL))],
    [
      h.div(
        [h.Class('flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 pt-2 pb-1.5')],
        [
          h.span([h.Class('text-[14px] font-semibold')], [REGION_INFO[region.region].name]),
          h.span([h.Class(cn(FIGURE, 'text-[12.5px]'))], [`${compact(region.users)} users`]),
          h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'text-[12.5px]',
                  toneText(region.now >= region.target ? 'ok' : 'danger'),
                ),
              ),
            ],
            [`Apdex ${region.now.toFixed(2)} / ${region.target.toFixed(2)}`],
          ),
          h.span(
            [h.Class(cn(FIGURE, 'text-[12.5px]', toneText(falling ? 'danger' : 'ok')))],
            [`${share >= 0 ? '+' : '−'}${Math.abs(share).toFixed(1)}%/h`],
          ),
          h.span(
            [h.Class(cn(FIGURE, 'ml-auto text-[12.5px] text-muted-foreground'))],
            [`1 day: ${compact(region.inADay)}`],
          ),
        ],
      ),
      // Each fix shows once, on the first row the region needs it for.
      ...region.rows.map((entry, index) =>
        row(
          game,
          entry,
          widest,
          entry.needed &&
            region.rows.findIndex(
              (other) => JSON.stringify(other.fix) === JSON.stringify(entry.fix),
            ) === index,
          h,
        ),
      ),
    ],
  )
}

/** The breakdown runs a day's forecast, so each Game computes it once, not every frame. */
const cache = new WeakMap<Game, ReadonlyArray<RegionChurn>>()

export const churnPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.board.game
  const regions = cache.get(game) ?? churnOf(game, ledgerOf(model))
  cache.set(game, regions)
  return shell(
    'Why users leave',
    [],
    [
      h.div(
        [h.Class(cn('flex flex-col gap-3 px-5 pt-1 pb-5', SCROLL))],
        regions.map((region) => section(game, region, h)),
      ),
    ],
    'max-w-[720px]',
    h,
  )
}
