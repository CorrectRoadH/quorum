import { Schema } from 'effect'
import type { Html, HtmlBuilder } from 'foldkit/html'
import {
  Cable,
  Check,
  ChevronRight,
  Copy,
  Flag,
  Gauge,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  Smile,
  Timer,
  TriangleAlert,
  Wallet,
  Zap,
} from 'lucide'
import { ERAS, INCIDENTS, INCIDENT_IDS } from '@quorum/simulation/catalog'
import type { Ledger } from '@quorum/simulation/ledger'
import { has } from '@quorum/simulation/lookups'
import { IncidentId } from '@quorum/simulation/state'
import { GUIDED, TRACKS, type SandboxId } from '@quorum/simulation/sandbox'
import { clock, money, ms, rate } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import { isPhone } from '@/game/viewport.ts'
import type { Model, SandboxRun } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { button } from '@/components/ui/button'
import { nativeSelect, nativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'
import { CHIPS, EYEBROW, FIGURE, PANEL, WELL, meter, toneText, type Tone } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   The Sandbox surfaces: the HUD that replaces the Company's, the objective in
   the goal slot, and the card when a guided Sandbox passes.
   ========================================================================== */

/** The guided Sandbox after this one: the next in its track, then the next track. */
export const nextGuided = (id: SandboxId): SandboxId | null => {
  const order = TRACKS.flatMap((track) => track.sandboxes)
  return order[order.indexOf(id) + 1] ?? null
}

const figureRow = (
  name: string,
  glyph: Parameters<typeof icon>[1],
  value: string,
  tone: Tone,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(name),
      h.Class('flex h-8 items-center gap-2.5 px-2.5 compact:shrink-0 compact:gap-1.5 compact:px-3'),
    ],
    [
      icon(h, glyph, 'size-3.5 shrink-0 text-muted-foreground'),
      h.span(
        [
          h.Class(
            'min-w-[52px] shrink-0 whitespace-nowrap text-[11.5px] text-muted-foreground compact:hidden',
          ),
        ],
        [name],
      ),
      h.span(
        [
          h.Class(
            cn(
              FIGURE,
              'ml-auto text-[13.5px] leading-none whitespace-nowrap compact:ml-0',
              toneText(tone),
            ),
          ),
        ],
        [value],
      ),
    ],
  )

const figures = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const errors = ledger.errorShare * 100
  const percentiles = has(model.game, 'percentiles')
  // A guided objective sets the Apdex and Burn it asks for, and may be measured on another figure.
  const objective = model.sandbox?.id
    ? GUIDED[model.sandbox.id].objectives[model.sandbox.progress.objective]
    : undefined
  const apdex = objective?.apdex ?? 0.85
  const watch = objective?.watch
  const watched = watch?.value(ledger) ?? 0
  return h.div(
    [h.Class(`flex flex-col divide-y divide-hairline ${WELL} ${CHIPS}`)],
    [
      figureRow('Demand', Gauge, `${rate(ledger.demand)}/s`, 'plain', h),
      figureRow(
        'Burn',
        Wallet,
        `${money(ledger.burn)}/s`,
        objective?.burn === undefined
          ? 'plain'
          : ledger.burn <= objective.burn + 1e-9
            ? 'ok'
            : 'danger',
        h,
      ),
      figureRow(
        'Apdex',
        Smile,
        ledger.apdex.toFixed(2),
        ledger.apdex >= apdex ? 'ok' : 'danger',
        h,
      ),
      figureRow(
        'Errors',
        TriangleAlert,
        `${errors.toFixed(errors >= 10 ? 0 : 1)}%`,
        errors < 1 ? 'ok' : errors < 5 ? 'warn' : 'danger',
        h,
      ),
      figureRow(
        percentiles ? 'p99' : 'Latency',
        Timer,
        ms(percentiles ? ledger.p99 : ledger.latency),
        'plain',
        h,
      ),
      watch
        ? figureRow(
            watch.label,
            Flag,
            watch.unit === 'ms' ? ms(watched) : `${(watched * 100).toFixed(1)}%`,
            'plain',
            h,
          )
        : h.empty,
    ],
  )
}

const header = (title: string, aside: Html, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class(
        'flex min-h-9 items-center gap-2 px-2.5 pt-1.5 pb-2 compact:pb-1 compact:pr-[var(--toolbar-w)]',
      ),
    ],
    [
      button(
        {
          onClick: Message.TitleOpened(),
          variant: 'ghost',
          size: 'icon-sm',
          className: '-ml-1.5 text-muted-foreground',
          attributes: [h.AriaLabel('Sandbox menu'), h.Title('Sandbox menu')],
        },
        icon(h, Menu, 'size-4'),
        h,
      ),
      h.span([h.Class('truncate text-[13px] font-semibold')], [title]),
      h.span([h.Class('ml-auto')], [aside]),
    ],
  )

/* ---------- guided ---------- */

const steps = (run: SandboxRun, id: SandboxId, h: HtmlBuilder<Message>): Html => {
  const total = GUIDED[id].objectives.length
  return h.span(
    [
      h.Class('flex items-center gap-1'),
      h.AriaLabel(`Objective ${run.progress.objective + 1} of ${total}`),
    ],
    GUIDED[id].objectives.map((_, index) =>
      h.span(
        [
          h.Key(String(index)),
          h.Class(
            cn(
              'h-1.5 w-3 rounded-full',
              index < run.progress.objective
                ? 'bg-ok'
                : index === run.progress.objective
                  ? 'bg-primary-fill'
                  : 'bg-well shadow-well',
            ),
          ),
        ],
        [],
      ),
    ),
  )
}

/** The current objective, in the goal slot, with how long it has held. */
export const objectiveBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const run = model.sandbox
  if (!run?.id) return h.empty
  const objective = GUIDED[run.id].objectives[run.progress.objective]
  if (!objective) return h.empty
  const share = Math.min(1, run.progress.held / objective.hold)
  return h.div(
    [
      h.Key(`objective-${run.progress.objective}`),
      h.DataAttribute('exit', 'notice'),
      h.Class(
        'enter-down flex w-[420px] flex-col gap-2 compact:w-auto rounded-xl bg-surface px-3 py-2.5 text-[12.5px] shadow-card',
      ),
    ],
    [
      h.div(
        [h.Class('flex items-start gap-2.5')],
        [
          icon(h, Flag, 'mt-0.5 size-3.5 shrink-0 text-primary-strong'),
          h.span([h.Class('flex-1 leading-snug')], [objective.goal]),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11px] text-muted-foreground'))],
            [`${clock(run.progress.held)} / ${clock(objective.hold)}`],
          ),
        ],
      ),
      meter(share, share > 0 ? 'bg-ok' : 'bg-primary-fill', h),
    ],
  )
}

/* ---------- free ---------- */

const tiny = (label: string, message: Message, h: HtmlBuilder<Message>, active = false): Html =>
  button(
    {
      onClick: message,
      variant: active ? 'default' : 'outline',
      size: 'sm',
      className: 'h-auto min-h-7 px-2 py-1 text-[11.5px] leading-tight whitespace-normal',
      attributes: [h.Key(label)],
    },
    label,
    h,
  )

/** On a phone the controls fold away under their name; on a desktop they stay open. */
const controls = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.details(
    [h.Key('controls'), h.Open(!isPhone()), h.Class('fold group')],
    [
      h.summary(
        [
          h.Class(
            'hidden h-9 cursor-pointer list-none items-center gap-2 px-2.5 text-[12.5px] font-medium compact:flex [&::-webkit-details-marker]:hidden',
          ),
        ],
        [
          icon(
            h,
            ChevronRight,
            'fold-chevron size-3.5 shrink-0 text-muted-foreground group-open:rotate-90',
          ),
          'Controls',
        ],
      ),
      controlsBody(model, h),
    ],
  )

const controlsBody = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex flex-col gap-2.5 px-2.5 pt-2.5 pb-1.5')],
    [
      h.div(
        [h.Class('flex items-center gap-1.5')],
        [
          h.span([h.Class(cn(EYEBROW, 'mr-auto'))], ['Users']),
          button(
            {
              onClick: Message.DemandStepped({ direction: -1 }),
              variant: 'outline',
              size: 'icon-sm',
              attributes: [h.AriaLabel('Less demand')],
            },
            icon(h, Minus, 'size-3.5'),
            h,
          ),
          h.span(
            [h.Class(cn(FIGURE, 'w-14 text-center text-[13px]'))],
            [model.game.users.toLocaleString('en-US')],
          ),
          button(
            {
              onClick: Message.DemandStepped({ direction: 1 }),
              variant: 'outline',
              size: 'icon-sm',
              attributes: [h.AriaLabel('More demand')],
            },
            icon(h, Plus, 'size-3.5'),
            h,
          ),
        ],
      ),
      h.div(
        [h.Class('flex items-center gap-1.5')],
        [
          h.span([h.Class(cn(EYEBROW, 'mr-auto'))], ['Mix']),
          ...ERAS.slice(0, 3).map((era, stage) =>
            tiny(era.name, Message.MixChosen({ stage }), h, model.game.stage === stage),
          ),
        ],
      ),
      nativeSelect(
        {
          id: 'sandbox-incident',
          label: 'Incident',
          size: 'sm',
          value: model.game.incident?.kind ?? '',
          isDisabled: model.game.incident !== null,
          onChange: (kind) =>
            Schema.is(IncidentId)(kind) ? Message.IncidentForced({ kind }) : Message.Synced(),
          wrapperClass: 'flex-row items-center gap-1.5 [&>div]:flex-1',
          labelClass: cn(EYEBROW, 'mr-auto p-0'),
          className: 'text-[11.5px]',
          options: [
            nativeSelectOption({ value: '', label: 'None' }, h),
            ...INCIDENT_IDS.map((kind) =>
              nativeSelectOption({ value: kind, label: INCIDENTS[kind].name }, h),
            ),
          ],
        },
        h,
      ),
      h.div(
        [h.Class('flex gap-1.5')],
        [
          button(
            {
              onClick: Message.StressBoardLoaded({ big: false }),
              variant: 'ghost',
              size: 'sm',
              className: 'flex-1 text-muted-foreground',
              attributes: [h.Title('Load a crowded Design to test card placement and link lanes')],
            },
            [icon(h, Cable, 'size-3.5'), 'Stress board'],
            h,
          ),
          button(
            {
              onClick: Message.StressBoardLoaded({ big: true }),
              variant: 'ghost',
              size: 'sm',
              className: 'flex-1 text-muted-foreground',
              attributes: [h.Title('Load a 61-Node Design to test performance')],
            },
            [icon(h, Cable, 'size-3.5'), 'Big board'],
            h,
          ),
        ],
      ),
      h.div(
        [h.Class('flex gap-1.5')],
        [
          button(
            {
              onClick: Message.FreeSandboxReset(),
              variant: 'ghost',
              size: 'sm',
              className: 'flex-1 text-muted-foreground',
            },
            [icon(h, RotateCcw, 'size-3.5'), 'Reset'],
            h,
          ),
          model.company && model.saved
            ? button(
                {
                  onClick: Message.CompanyCopied(),
                  variant: 'ghost',
                  size: 'sm',
                  className: 'flex-1 text-muted-foreground',
                  attributes: [h.Title('Copy the Company Design onto this board')],
                },
                [icon(h, Copy, 'size-3.5'), 'Copy Company'],
                h,
              )
            : h.empty,
        ],
      ),
    ],
  )

/* ---------- the HUD ---------- */

export const sandboxHud = (model: Model, ledger: Ledger, h: HtmlBuilder<Message>): Html => {
  const run = model.sandbox
  if (!run) return h.empty
  return h.header(
    [
      h.Class(
        `absolute top-3 left-3 z-20 flex w-[248px] flex-col gap-1 p-1.5 ${PANEL} compact:pointer-events-auto compact:static compact:w-auto compact:p-1`,
      ),
    ],
    [
      run.id
        ? header(GUIDED[run.id].name, steps(run, run.id, h), h)
        : header('Free Sandbox', icon(h, Zap, 'size-3.5 text-muted-foreground'), h),
      figures(model, ledger, h),
      run.id ? h.empty : controls(model, h),
    ],
  )
}

/* ---------- passed ---------- */

export const passedPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const id = model.sandbox?.id
  if (!id) return h.empty
  const next = nextGuided(id)
  return shell(
    GUIDED[id].name,
    [],
    [
      h.div(
        [h.Class('flex flex-col items-center gap-3 px-8 pt-2 pb-6')],
        [
          h.span(
            [
              h.Class(
                'grid size-12 place-items-center rounded-full bg-ok text-white shadow-raised enter-pop',
              ),
            ],
            [icon(h, Check, 'size-6')],
          ),
          h.span([h.Class('text-[26px] font-semibold tracking-[-0.035em]')], ['Passed']),
        ],
      ),
      h.div(
        [h.Class('flex justify-end gap-2 border-t border-hairline bg-nested px-5 py-3')],
        [
          button(
            { onClick: Message.TitleOpened(), variant: 'outline', size: 'lg', className: 'px-3.5' },
            'Sandbox menu',
            h,
          ),
          next
            ? button(
                { onClick: Message.GuidedStarted({ id: next }), size: 'lg', className: 'px-4' },
                GUIDED[next].name,
                h,
              )
            : button(
                { onClick: Message.FreeSandboxStarted(), size: 'lg', className: 'px-4' },
                'Free Sandbox',
                h,
              ),
        ],
      ),
    ],
    'max-w-[440px]',
    h,
  )
}
