import type { Html, HtmlBuilder } from 'foldkit/html'
import {
  COMPONENTS,
  IAC_TOOLS,
  IAC_TOOL_INFO,
  MIRROR_TIME,
  OPEN_REGION_PRICE,
  REGIONS,
  REGION_INFO,
  SIZES,
  type DataPatternId,
  type RegionId,
} from '@quorum/simulation/catalog'
import { eraOf, has } from '@quorum/simulation/lookups'
import {
  applyCost,
  driftOf,
  mirrorOf,
  mirrorsOf,
  overridable,
  patternsFor,
  previewApply,
  switchLeft,
  type Change,
  type Drift,
  type Managed,
} from '@quorum/simulation/mirror'
import { openRegions } from '@quorum/simulation/regions'
import { solveFlow } from '@quorum/simulation/solve'
import type { Game, Mirror } from '@quorum/simulation/state'
import { money } from '@quorum/ui/game/format'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { button } from '@quorum/ui/primitives/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, SCROLL, WELL } from '@quorum/ui/game/bits'
import { shell } from './panels.ts'

/* ==========================================================================
   Mirrors (GDD 05 "Mirror a region"): the IaC tool, GitOps, and the plan for
   the region on the board. It opens from the region tabs.
   ========================================================================== */

const FIELD_LABEL: Record<Managed, string> = {
  size: 'Size',
  family: 'Family',
  runtime: 'Runtime',
  framework: 'Framework',
  workers: 'Workers',
  compress: 'Compression',
  sampleRate: 'Sample rate',
  retention: 'Retention',
  policy: 'Policy',
  checkEvery: 'Health check',
  deepCheck: 'Deep check',
  ttl: 'TTL',
  pm: 'Process manager',
  engine: 'Engine',
  mode: 'Pool mode',
  dlq: 'Dead-letter queue',
  attempts: 'Attempts',
  maxLength: 'Max length',
  prefetch: 'Prefetch',
  coalesce: 'Stampede protection',
  warming: 'Cache warming',
  paranoia: 'Paranoia',
  zone: 'Zone',
  standby: 'Standby',
  signal: 'Signal',
  target: 'Target',
  minCopies: 'Min copies',
  maxCopies: 'Max copies',
  gpu: 'GPU',
  collector: 'Collector',
  gogc: 'GOGC',
  shed: 'Load shedding',
  ryw: 'Read-your-writes',
  n: 'N',
  r: 'R',
  w: 'W',
  backup: 'Backups',
  fanout: 'Fan-out',
  split: 'Key splitting',
}

const PATTERN_LABEL: Record<DataPatternId, string> = {
  replica: 'Read replica',
  primary: 'Own primary',
  replicate: 'Replicate',
  call: 'Call source',
}

/** Each tool's documented default workflow: how a plan finds hand changes, and what Apply waits for. */
const TOOL_FACTS: Record<(typeof IAC_TOOLS)[number], ReadonlyArray<readonly [string, string]>> = {
  terraform: [
    ['Plan', 'Refreshes live state'],
    ['Apply', `${MIRROR_TIME} min + refresh`],
    ['Drift', 'Every plan'],
  ],
  pulumi: [
    ['Plan', 'Recorded state'],
    ['Apply', `${MIRROR_TIME} min`],
    ['Drift', 'pulumi refresh'],
  ],
  alchemy: [
    ['Plan', 'Recorded state'],
    ['Apply', `${MIRROR_TIME} min`],
    ['Drift', 'alchemy drift, repair'],
  ],
}

const valueText = (field: Managed, value: unknown): string =>
  field === 'size' && typeof value === 'number'
    ? (SIZES[value]?.name ?? String(value))
    : typeof value === 'boolean'
      ? value
        ? 'on'
        : 'off'
      : String(value)

/**
 * A Node's name, with its region when it is not in the Mirror's: a Link to the
 * source shows where it goes. A Node the plan has not built yet is named after its source.
 */
const nodeName = (game: Game, id: string, mirror: Mirror): string => {
  if (id.startsWith('+')) {
    const source = game.nodes.find((entry) => entry.id === id.slice(1))
    if (!source) return 'Node'
    return source.type === 'database' && mirror.data[source.id] === 'replica'
      ? COMPONENTS.replica.name
      : COMPONENTS[source.type].name
  }
  const node = game.nodes.find((entry) => entry.id === id)
  if (!node) return 'Node'
  const name = COMPONENTS[node.type].name
  return node.region === mirror.region ? name : `${name} ${REGION_INFO[node.region].short}`
}

/** A segmented control: options sunk in a well, the chosen one raised. */
const segmented = <A>(
  key: string,
  options: ReadonlyArray<readonly [A, string]>,
  current: A,
  message: (value: A) => Message,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [
      h.Key(key),
      h.Class(cn('grid gap-[3px] p-[3px]', WELL, 'rounded-[11px]')),
      h.Style({ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }),
    ],
    options.map(([value, label]) =>
      h.button(
        [
          h.Key(label),
          h.Type('button'),
          h.AriaPressed(value === current ? 'true' : 'false'),
          h.OnClick(message(value)),
          h.Class(
            cn(
              'h-7 rounded-lg px-2 text-[12px] font-medium transition-colors',
              value === current
                ? 'bg-raised text-foreground shadow-raised'
                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
            ),
          ),
        ],
        [label],
      ),
    ),
  )

const heading = (text: string, h: HtmlBuilder<Message>): Html =>
  h.span([h.Class(cn(EYEBROW, 'px-1'))], [text])

/* ---------- the IaC tool and GitOps ---------- */

const toolCards = (game: Game, h: HtmlBuilder<Message>): Html => {
  const current = game.iac?.tool ?? null
  const left = switchLeft(game)
  return h.section(
    [h.Key('tool'), h.Class('flex flex-col gap-2')],
    [
      heading(
        left > 0 && current
          ? `IaC tool · moving to ${IAC_TOOL_INFO[current].name} · ${Math.ceil(left)} min`
          : 'IaC tool',
        h,
      ),
      h.div(
        [h.Class('grid grid-cols-3 gap-2 compact:grid-cols-1')],
        IAC_TOOLS.map((tool) =>
          h.button(
            [
              h.Key(tool),
              h.Type('button'),
              h.AriaPressed(current === tool ? 'true' : 'false'),
              h.OnClick(Message.IacToolPicked({ tool })),
              h.Class(
                cn(
                  'flex flex-col gap-1.5 rounded-xl p-3 text-left transition-colors',
                  current === tool
                    ? 'bg-raised shadow-raised'
                    : cn(WELL, 'hover:brightness-[0.98]'),
                ),
              ),
            ],
            [
              h.span(
                [h.Class('flex items-baseline justify-between gap-2')],
                [
                  h.span([h.Class('text-[14px] font-semibold')], [IAC_TOOL_INFO[tool].name]),
                  h.span(
                    [h.Class('text-[11.5px] text-muted-foreground')],
                    [IAC_TOOL_INFO[tool].language],
                  ),
                ],
              ),
              ...TOOL_FACTS[tool].map(([name, value]) =>
                h.span(
                  [h.Key(name), h.Class('flex justify-between gap-2 text-[12px]')],
                  [
                    h.span([h.Class('text-muted-foreground')], [name]),
                    h.span([h.Class('font-medium')], [value]),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ],
  )
}

const gitops = (game: Game, h: HtmlBuilder<Message>): Html =>
  !has(game, 'gitops') || !game.iac
    ? h.empty
    : h.section(
        [h.Key('gitops'), h.Class('flex flex-col gap-2')],
        [
          heading('GitOps', h),
          segmented(
            'sync',
            [
              [null, 'Off'],
              ['all', 'All at once'],
              ['staged', 'Staged'],
            ] as const,
            game.iac.sync,
            (sync) => Message.SyncModePicked({ sync }),
            h,
          ),
        ],
      )

/* ---------- the region on the board ---------- */

const driftText = (game: Game, mirror: Mirror, drift: Drift): string => {
  if (mirror.readyAt !== null)
    return `Applying · ${Math.max(1, Math.ceil(mirror.readyAt - game.time))} min`
  const parts = [
    ...(drift.behind > 0 ? [`${drift.behind} behind`] : []),
    ...(drift.hand > 0
      ? [`${drift.hand} ${drift.hand === 1 ? 'hand change' : 'hand changes'}`]
      : []),
  ]
  return parts.length === 0 ? 'In sync' : parts.join(' · ')
}

const changeRow = (
  game: Game,
  mirror: Mirror,
  change: Change,
  index: number,
  h: HtmlBuilder<Message>,
): Html => {
  const [mark, text, keep] = ((): readonly [string, string, Message | null] => {
    switch (change._tag) {
      case 'create':
        return ['+', COMPONENTS[change.type].name, null]
      case 'remove':
        return [
          '−',
          `${COMPONENTS[change.type].name}${change.data ? ' · needs confirm' : ''}`,
          null,
        ]
      case 'set':
        return [
          '~',
          `${nodeName(game, change.node, mirror)} · ${FIELD_LABEL[change.field]} ${valueText(change.field, change.from)} → ${valueText(change.field, change.to)}`,
          change.hand && overridable(game)
            ? Message.MirrorOverrideSet({
                region: mirror.region,
                nodeId: change.node,
                field: change.field,
                keep: true,
              })
            : null,
        ]
      case 'link':
        return [
          change.add ? '+' : '−',
          `Link ${nodeName(game, change.from, mirror)} → ${nodeName(game, change.to, mirror)}`,
          null,
        ]
      case 'choose':
        return ['?', `${COMPONENTS[change.type].name} · pick a pattern`, null]
    }
  })()
  const hand = change._tag !== 'choose' && change.hand
  return h.div(
    [
      h.Key(`${index}`),
      h.Class('grid grid-cols-[16px_1fr_auto] items-center gap-2 px-3 py-1 text-[12.5px]'),
    ],
    [
      h.span([h.Class(cn(FIGURE, hand ? 'text-danger' : 'text-muted-foreground'))], [mark]),
      h.span([h.Class(cn('truncate', hand && 'text-danger'))], [hand ? `${text} · hand` : text]),
      keep
        ? button({ onClick: keep, variant: 'ghost', size: 'xs' }, 'Keep as override', h)
        : h.span([], []),
    ],
  )
}

const dataChoices = (game: Game, mirror: Mirror, h: HtmlBuilder<Message>): Html => {
  const sources = game.nodes.filter(
    (node) => node.region === mirror.source && patternsFor(node.type).length > 0,
  )
  if (sources.length === 0) return h.empty
  return h.div(
    [h.Key('data'), h.Class('flex flex-col gap-1.5')],
    [
      heading('Writes', h),
      ...sources.map((node) =>
        h.div(
          [h.Key(node.id), h.Class('grid grid-cols-[140px_1fr] items-center gap-3')],
          [
            h.span([h.Class('text-[12.5px] font-medium')], [COMPONENTS[node.type].name]),
            segmented(
              node.id,
              patternsFor(node.type).map((pattern) => [pattern, PATTERN_LABEL[pattern]] as const),
              mirror.data[node.id] ?? null,
              (pattern) =>
                Message.MirrorDataPicked({
                  region: mirror.region,
                  source: node.id,
                  pattern: pattern ?? 'call',
                }),
              h,
            ),
          ],
        ),
      ),
    ],
  )
}

const overrides = (game: Game, mirror: Mirror, h: HtmlBuilder<Message>): Html => {
  const kept = Object.entries(mirror.overrides).flatMap(([nodeId, fields]) =>
    fields.map((field) => [nodeId, field as Managed] as const),
  )
  if (kept.length === 0) return h.empty
  return h.div(
    [h.Key('overrides'), h.Class('flex flex-col gap-1')],
    [
      heading('Overrides', h),
      ...kept.map(([nodeId, field]) =>
        h.div(
          [
            h.Key(`${nodeId}:${field}`),
            h.Class('flex items-center justify-between gap-2 px-1 text-[12.5px]'),
          ],
          [
            h.span(
              [],
              [
                `${nodeName(game, nodeId, mirror)} · ${FIELD_LABEL[field]} ${valueText(field, game.nodes.find((node) => node.id === nodeId)?.[field])}`,
              ],
            ),
            button(
              {
                onClick: Message.MirrorOverrideSet({
                  region: mirror.region,
                  nodeId,
                  field,
                  keep: false,
                }),
                variant: 'ghost',
                size: 'xs',
              },
              'Remove',
              h,
            ),
          ],
        ),
      ),
    ],
  )
}

/** Burn per second the plan adds once it lands. Each Game computes it once, not every frame. */
const burnCache = new WeakMap<Game, number>()
const burnAdded = (game: Game, mirror: Mirror): number => {
  const cached = burnCache.get(game)
  if (cached !== undefined) return cached
  const added = solveFlow(previewApply(game, mirror.region)).burn - solveFlow(game).burn
  burnCache.set(game, added)
  return added
}

const mirrorSection = (game: Game, mirror: Mirror, h: HtmlBuilder<Message>): Html => {
  const drift = driftOf(game, mirror)
  const cost = applyCost(game, mirror)
  const burn = drift.changes.length > 0 ? burnAdded(game, mirror) : 0
  const changes = drift.changes
  const pending = mirror.readyAt !== null
  const tool = game.iac ? IAC_TOOL_INFO[game.iac.tool] : null
  return h.section(
    [h.Key(`mirror-${mirror.region}`), h.Class('flex flex-col gap-3')],
    [
      h.div(
        [h.Class('flex flex-wrap items-baseline gap-x-3 gap-y-1')],
        [
          h.span(
            [h.Class('text-[14px] font-semibold')],
            [`${REGION_INFO[mirror.region].name} · Mirror of ${REGION_INFO[mirror.source].name}`],
          ),
          h.span(
            [
              h.Class(
                cn(
                  FIGURE,
                  'text-[12.5px]',
                  drift.hand > 0 ? 'text-danger' : drift.behind > 0 ? 'text-warn' : 'text-ok',
                ),
              ),
            ],
            [driftText(game, mirror, drift)],
          ),
        ],
      ),
      dataChoices(game, mirror, h),
      game.iac
        ? h.div(
            [h.Key('computed'), h.Class('grid grid-cols-[140px_1fr] items-center gap-3')],
            [
              h.span([h.Class('text-[12.5px] font-medium')], ['Computed sizes']),
              segmented(
                'computed',
                [
                  [false, 'Off'],
                  [true, 'Follow users'],
                ] as const,
                mirror.computed,
                (computed) => Message.MirrorComputedSet({ region: mirror.region, computed }),
                h,
              ),
            ],
          )
        : h.empty,
      changes.length > 0
        ? h.div(
            [h.Key('plan'), h.Class(cn('flex flex-col py-1.5', WELL, SCROLL, 'max-h-[240px]'))],
            changes.map((change, index) => changeRow(game, mirror, change, index, h)),
          )
        : h.empty,
      overrides(game, mirror, h),
      h.div(
        [h.Class('flex flex-wrap items-center gap-2')],
        [
          button(
            {
              onClick: Message.MirrorApplied({ region: mirror.region, destroy: false }),
              isDisabled: pending || changes.length === 0 || drift.choices > 0,
              size: 'sm',
            },
            cost > 0 ? `Apply · ${money(cost)}` : 'Apply',
            h,
          ),
          Math.abs(burn) >= 0.01
            ? h.span(
                [h.Key('burn'), h.Class(cn(FIGURE, 'text-[12px] text-muted-foreground'))],
                [`Burn ${burn > 0 ? '+' : ''}${money(burn)}/s`],
              )
            : h.empty,
          drift.data > 0
            ? button(
                {
                  onClick: Message.MirrorApplied({ region: mirror.region, destroy: true }),
                  isDisabled: pending || drift.choices > 0,
                  size: 'sm',
                  variant: 'destructive',
                },
                `Apply and remove ${drift.data} data ${drift.data === 1 ? 'Node' : 'Nodes'}`,
                h,
              )
            : h.empty,
          tool?.refresh
            ? button(
                {
                  onClick: Message.MirrorRefreshed({ region: mirror.region }),
                  isDisabled: pending,
                  size: 'sm',
                  variant: 'outline',
                },
                tool.repair ? 'Check drift' : 'Refresh',
                h,
              )
            : h.empty,
          tool?.repair
            ? button(
                {
                  onClick: Message.MirrorRepaired({ region: mirror.region }),
                  isDisabled: pending,
                  size: 'sm',
                  variant: 'outline',
                },
                'Repair',
                h,
              )
            : h.empty,
          button(
            {
              onClick: Message.MirrorStopped({ region: mirror.region }),
              size: 'sm',
              variant: 'ghost',
              className: 'ml-auto',
            },
            'Stop mirroring',
            h,
          ),
        ],
      ),
    ],
  )
}

/** Regions the region on the board can mirror into, or mirror from when it is empty. */
const startSection = (game: Game, region: RegionId, h: HtmlBuilder<Message>): Html => {
  const open = openRegions(game)
  const mirrors = mirrorsOf(game)
  const isSource = (target: RegionId) => mirrors.some((mirror) => mirror.source === target)
  const empty = !game.nodes.some((node) => node.region === region && node.type !== 'users')
  const price = game.sandbox ? 0 : Math.round(OPEN_REGION_PRICE * eraOf(game).costIndex)
  const targets = empty
    ? open.filter((source) => source !== region && !mirrorOf(game, source))
    : REGIONS.filter((target) => target !== region && !mirrorOf(game, target) && !isSource(target))
  return h.section(
    [h.Key(`start-${region}`), h.Class('flex flex-col gap-2')],
    [
      heading(
        empty
          ? `Mirror into ${REGION_INFO[region].name} from`
          : `Mirror ${REGION_INFO[region].name} into`,
        h,
      ),
      targets.length === 0
        ? h.span([h.Class('px-1 text-[12.5px] text-muted-foreground')], ['No region to pick.'])
        : h.div(
            [h.Class('flex flex-wrap gap-2')],
            targets.map((other) =>
              button(
                {
                  onClick: empty
                    ? Message.MirrorStarted({ target: region, source: other })
                    : Message.MirrorStarted({ target: other, source: region }),
                  isDisabled: !game.iac,
                  size: 'sm',
                  variant: 'outline',
                },
                !empty && !open.includes(other)
                  ? `${REGION_INFO[other].name} · ${money(price)}`
                  : REGION_INFO[other].name,
                h,
              ),
            ),
          ),
    ],
  )
}

export const mirrorPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.board.game
  const region = model.board.region
  const mirror = mirrorOf(game, region)
  return shell(
    'Mirror',
    [],
    [
      h.div(
        [h.Class(cn('flex flex-col gap-5 px-5 pt-1 pb-5', SCROLL))],
        [
          toolCards(game, h),
          gitops(game, h),
          game.iac
            ? mirror
              ? mirrorSection(game, mirror, h)
              : startSection(game, region, h)
            : h.empty,
        ],
      ),
    ],
    'max-w-[680px]',
    h,
  )
}

/** The drift of the Mirror in a region, for its tab: 0 when in sync or not a Mirror. */
export const tabDrift = (game: Game, region: RegionId): number => {
  const mirror = mirrorOf(game, region)
  if (!mirror) return 0
  const drift = driftOf(game, mirror)
  return drift.behind + drift.hand
}
