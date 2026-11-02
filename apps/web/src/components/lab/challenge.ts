import type { Html, HtmlBuilder } from 'foldkit/html'
import { AsyncData } from 'foldkit'
import {
  Check,
  FastForward,
  Menu,
  Play,
  RotateCcw,
  Timer,
  TriangleAlert,
  Wallet,
  Waypoints,
} from 'lucide'
import type { ChallengeHistograms, Histogram } from '@quorum/rpc'
import {
  bucketOf,
  challengeById,
  complexityOf,
  stepsOf,
  type Challenge,
  type ScoreAxis,
} from '@quorum/simulation/challenges'
import type { Ledger } from '@quorum/simulation/ledger'
import { SIM_VERSION } from '@quorum/simulation/version'
import { histogramQuery } from '@/game/challenge-query.ts'
import { clock, money, ms } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import type { ChallengeRun, Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CHIPS, FIGURE, PANEL, WELL, meter, toneText, type Tone } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   Challenge mode: the HUD while the player builds and runs, the brief in the
   goal slot, and the result card with each axis on its histogram.
   ========================================================================== */

const AXIS_NAMES: Record<ScoreAxis, string> = {
  cost: 'Cost',
  tail: 'Tail',
  complexity: 'Complexity',
}

const axisValue = (axis: ScoreAxis, value: number): string =>
  axis === 'cost' ? `${money(value)}/s` : axis === 'tail' ? ms(value) : String(value)

const figureRow = (
  name: string,
  glyph: Parameters<typeof icon>[1],
  value: string,
  tone: Tone,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Key(name), h.Class('flex h-8 items-center gap-2.5 px-2.5 compact:shrink-0 compact:px-3')],
    [
      icon(h, glyph, 'size-3.5 shrink-0 text-muted-foreground'),
      h.span(
        [h.Class('w-[72px] shrink-0 text-[11.5px] text-muted-foreground compact:hidden')],
        [name],
      ),
      h.span([h.Class(cn(FIGURE, 'ml-auto text-[13.5px] leading-none', toneText(tone)))], [value]),
    ],
  )

/** The live figures: what the Design costs and serves now, and its complexity. */
const figures = (
  model: Model,
  challenge: Challenge,
  ledger: Ledger,
  h: HtmlBuilder<Message>,
): Html => {
  const errors = ledger.errorShare * 100
  const { targets } = challenge
  return h.div(
    [h.Class(`flex flex-col divide-y divide-hairline ${WELL} ${CHIPS}`)],
    [
      figureRow(
        'Cost',
        Wallet,
        `${money(ledger.burn)}/s`,
        targets.cost !== undefined && ledger.burn > targets.cost ? 'danger' : 'plain',
        h,
      ),
      figureRow(
        'Tail',
        Timer,
        ms(ledger.p99),
        targets.tail !== undefined && ledger.p99 > targets.tail ? 'danger' : 'plain',
        h,
      ),
      figureRow('Complexity', Waypoints, String(complexityOf(model.game)), 'plain', h),
      figureRow(
        'Errors',
        TriangleAlert,
        `${errors.toFixed(errors >= 10 ? 0 : 1)}%`,
        errors <= targets.errors * 100 ? 'ok' : 'danger',
        h,
      ),
    ],
  )
}

const targetText = (challenge: Challenge): string =>
  [
    `errors ≤ ${(challenge.targets.errors * 100).toFixed(0)}%`,
    challenge.targets.refused !== undefined ? 'no refused' : '',
    challenge.targets.tail !== undefined ? `tail ≤ ${ms(challenge.targets.tail)}` : '',
    challenge.targets.cost !== undefined ? `cost ≤ ${money(challenge.targets.cost)}/s` : '',
  ]
    .filter(Boolean)
    .join(' · ')

const actions = (run: ChallengeRun, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex gap-1.5 px-1 pt-1')],
    run.phase === 'build'
      ? [
          button(
            { onClick: Message.ChallengeRan(), size: 'sm', className: 'flex-1' },
            [icon(h, Play, 'size-3.5'), 'Run'],
            h,
          ),
        ]
      : run.phase === 'running'
        ? [
            button(
              { onClick: Message.ChallengeFinished(), size: 'sm', className: 'flex-1' },
              [icon(h, FastForward, 'size-3.5'), 'Finish'],
              h,
            ),
            button(
              { onClick: Message.ChallengeRebuilt(), variant: 'outline', size: 'sm' },
              [icon(h, RotateCcw, 'size-3.5'), 'Rebuild'],
              h,
            ),
          ]
        : [
            button(
              {
                onClick: Message.PanelOpened({ panel: 'challenge' }),
                size: 'sm',
                className: 'flex-1',
              },
              'Result',
              h,
            ),
            button(
              { onClick: Message.ChallengeRebuilt(), variant: 'outline', size: 'sm' },
              [icon(h, RotateCcw, 'size-3.5'), 'Rebuild'],
              h,
            ),
          ],
  )

export const challengeHud = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const run = model.challenge
  const challenge = run ? challengeById(run.id) : undefined
  if (!run || !challenge) return h.empty
  return h.header(
    [
      h.Class(
        `absolute top-3 left-3 z-20 flex w-[248px] flex-col gap-1 p-1.5 ${PANEL} compact:pointer-events-auto compact:static compact:w-auto compact:p-1`,
      ),
    ],
    [
      h.div(
        [h.Class('flex min-h-9 items-center gap-2 px-2.5 pt-1.5 pb-2')],
        [
          button(
            {
              onClick: Message.TitleOpened(),
              variant: 'ghost',
              size: 'icon-sm',
              className: '-ml-1.5 text-muted-foreground',
              attributes: [h.AriaLabel('Challenges'), h.Title('Challenges')],
            },
            icon(h, Menu, 'size-4'),
            h,
          ),
          h.span([h.Class('truncate text-[13px] font-semibold')], [challenge.name]),
          model.founder.completed.includes(challenge.id)
            ? h.span([h.Class('ml-auto')], [icon(h, Check, 'size-3.5 text-ok')])
            : h.empty,
        ],
      ),
      figures(model, challenge, ledger, h),
      actions(run, h),
    ],
  )
}

/** The brief and targets in the goal slot; while running, how far the run is. */
export const challengeBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const run = model.challenge
  const challenge = run ? challengeById(run.id) : undefined
  if (!run || !challenge) return h.empty
  const running = run.phase !== 'build'
  const elapsed = run.totals.step * challenge.stepSeconds
  return h.div(
    [
      h.Key(`challenge-${run.phase}`),
      h.Class(
        'enter-down flex w-[420px] flex-col gap-2 compact:w-auto rounded-xl bg-surface px-3 py-2.5 text-[12.5px] shadow-card',
      ),
    ],
    [
      h.div(
        [h.Class('flex items-start gap-2.5')],
        [
          h.span([h.Class('flex-1 leading-snug')], [challenge.brief]),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
            [
              running
                ? `${clock(elapsed)} / ${clock(challenge.duration)}`
                : clock(challenge.duration),
            ],
          ),
        ],
      ),
      h.span([h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))], [targetText(challenge)]),
      running ? meter(run.totals.step / stepsOf(challenge), 'bg-primary-fill', h) : h.empty,
    ],
  )
}

/* ---------- the result ---------- */

/** A bar per bucket, the player's bucket marked. */
const strip = (histogram: Histogram, value: number, h: HtmlBuilder<Message>): Html => {
  const mine = bucketOf(histogram.edges, value)
  const top = Math.max(1, ...histogram.counts)
  return h.div(
    [h.Class('flex h-10 items-end gap-[3px]'), h.AriaHidden(true)],
    histogram.counts.map((count, index) =>
      h.span(
        [
          h.Key(String(index)),
          h.Class(
            cn('flex-1 rounded-sm', index === mine ? 'bg-primary-fill' : 'bg-well shadow-well'),
          ),
          h.Style({ height: `${Math.max(8, (count / top) * 100)}%` }),
        ],
        [],
      ),
    ),
  )
}

const axisRow = (
  axis: ScoreAxis,
  run: ChallengeRun,
  data: ChallengeHistograms | null,
  h: HtmlBuilder<Message>,
): Html => {
  const value = run.verdict?.best?.[axis] ?? run.result?.[axis] ?? 0
  const share = run.verdict?.percentiles?.[axis]
  return h.div(
    [h.Key(axis), h.Class('flex flex-col gap-1.5')],
    [
      h.div(
        [h.Class('flex items-baseline justify-between gap-3')],
        [
          h.span([h.Class('text-[13px] font-medium')], [AXIS_NAMES[axis]]),
          h.span([h.Class(cn(FIGURE, 'text-[13px]'))], [axisValue(axis, value)]),
        ],
      ),
      data ? strip(data[axis], value, h) : h.empty,
      share === undefined
        ? h.empty
        : h.span(
            [h.Class('text-[12px] text-muted-foreground')],
            [`Better than ${Math.round(share * 100)}% of players`],
          ),
    ],
  )
}

const VERIFICATION: Record<ChallengeRun['verification'], string> = {
  local: 'Provisional',
  sending: 'Provisional · checking',
  verified: 'Verified',
  unverified: 'Not verified',
  offline: 'Provisional · offline',
}

export const challengePanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const run = model.challenge
  const challenge = run ? challengeById(run.id) : undefined
  if (!run?.result || !challenge) return h.empty
  const result = run.result
  const passed = run.verdict?.passed ?? result.passed
  const histograms = AsyncData.matchData(
    histogramQuery.read(model.histograms, { challengeId: run.id, simVersion: SIM_VERSION }),
    { onEmpty: () => null, onFailure: () => null, onData: (data: ChallengeHistograms) => data },
  )
  return shell(
    challenge.name,
    [
      h.span(
        [
          h.Class(
            cn(
              'font-mono text-[11px] uppercase tracking-[0.08em]',
              run.verification === 'verified' ? 'text-ok' : 'text-muted-foreground',
            ),
          ),
          ...(run.note ? [h.Title(run.note)] : []),
        ],
        [VERIFICATION[run.verification]],
      ),
    ],
    [
      h.div(
        [h.Class('flex flex-col gap-4 px-5 pb-5')],
        [
          h.span(
            [
              h.Class(
                cn(
                  'text-[22px] font-semibold tracking-[-0.03em]',
                  passed ? 'text-ok' : 'text-danger',
                ),
              ),
            ],
            [passed ? 'Passed' : (run.verdict?.missed ?? result.missed ?? 'Failed')],
          ),
          ...(['cost', 'tail', 'complexity'] as const).map((axis) =>
            axisRow(axis, run, histograms, h),
          ),
          histograms
            ? h.span(
                [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
                [`${histograms.players} players`],
              )
            : h.empty,
        ],
      ),
      h.div(
        [h.Class('flex justify-end gap-2 border-t border-hairline bg-nested px-5 py-3')],
        [
          button(
            { onClick: Message.TitleOpened(), variant: 'outline', size: 'lg', className: 'px-3.5' },
            'Challenges',
            h,
          ),
          button(
            { onClick: Message.ChallengeRebuilt(), size: 'lg', className: 'px-4' },
            'Rebuild',
            h,
          ),
        ],
      ),
    ],
    'max-w-[440px]',
    h,
  )
}
