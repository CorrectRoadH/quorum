import { Option, Schema } from 'effect'
import { CALENDAR_START } from '@quorum/simulation/catalog'
import type { Sample } from '@quorum/simulation/state'

/* ==========================================================================
   The Dashboard's long history (12 "History and resolution"). The Game keeps
   the last 600 one-minute Samples; this keeps 15-minute blocks for 7 days and
   1-hour blocks for 30 days. Each block holds min, max, and sum of every
   Sample field, and how many Samples it took, so a Chart can draw the mean
   and the worst value. It is client state, like Mail: not in the Game, so
   replays do not change.
   ========================================================================== */

export const FIELDS = [
  'users',
  'demand',
  'served',
  'latency',
  'p99',
  'apdex',
  'errors',
  'revenue',
  'burn',
] as const satisfies ReadonlyArray<keyof Sample>
export type Field = (typeof FIELDS)[number]

const Figures = Schema.Record(Schema.String, Schema.Finite)

/** One block: its calendar index at its resolution, and min, max, and sum per field. */
export const Block = Schema.Struct({
  index: Schema.Finite,
  count: Schema.Finite,
  min: Figures,
  max: Figures,
  sum: Figures,
})
export type Block = typeof Block.Type

export const History = Schema.Struct({
  quarter: Schema.Array(Block),
  hour: Schema.Array(Block),
})
export type History = typeof History.Type

export const EMPTY_HISTORY: History = { quarter: [], hour: [] }

/** Block length in calendar minutes, and how many blocks each resolution keeps. */
export const TIERS = {
  quarter: { minutes: 15, keep: 672 },
  hour: { minutes: 60, keep: 720 },
} as const
export type Tier = keyof typeof TIERS

/** The calendar block a sim second falls in; blocks line up with the clock, at :00 and :15. */
const indexOf = (time: number, minutes: number): number =>
  Math.floor((CALENDAR_START + time) / minutes)

/** The sim time a block starts at, for its label. */
export const startOf = (index: number, tier: Tier): number =>
  index * TIERS[tier].minutes - CALENDAR_START

const add = (blocks: ReadonlyArray<Block>, index: number, sample: Sample): ReadonlyArray<Block> => {
  const last = blocks[blocks.length - 1]
  if (last && last.index === index) {
    const min: Record<string, number> = { ...last.min }
    const max: Record<string, number> = { ...last.max }
    const sum: Record<string, number> = { ...last.sum }
    for (const field of FIELDS) {
      min[field] = Math.min(min[field] ?? sample[field], sample[field])
      max[field] = Math.max(max[field] ?? sample[field], sample[field])
      sum[field] = (sum[field] ?? 0) + sample[field]
    }
    return [...blocks.slice(0, -1), { index, count: last.count + 1, min, max, sum }]
  }
  const figures: Record<string, number> = {}
  for (const field of FIELDS) figures[field] = sample[field]
  return [...blocks, { index, count: 1, min: figures, max: figures, sum: figures }]
}

/**
 * Folds the Samples a tick added into the blocks. `samples` end at sim second
 * `last`, one per second. Blocks after `last` belong to another Game, such as a
 * reset Sandbox, so they go first.
 */
export const record = (history: History, samples: ReadonlyArray<Sample>, last: number): History => {
  if (samples.length === 0) return history
  const fold = (tier: Tier): ReadonlyArray<Block> => {
    const { minutes, keep } = TIERS[tier]
    const now = indexOf(last, minutes)
    let blocks: ReadonlyArray<Block> = history[tier].filter((block) => block.index <= now)
    samples.forEach((sample, offset) => {
      blocks = add(blocks, indexOf(last - (samples.length - 1 - offset), minutes), sample)
    })
    return blocks.length > keep ? blocks.slice(-keep) : blocks
  }
  return { quarter: fold('quarter'), hour: fold('hour') }
}

/** The Samples a tick added: one per sim second crossed, as many as the Game still holds. */
export const newSamples = (
  history: ReadonlyArray<Sample>,
  before: number,
  after: number,
): ReadonlyArray<Sample> => {
  const crossed = Math.floor(after) - Math.floor(before)
  return crossed > 0 ? history.slice(-Math.min(crossed, history.length)) : []
}

const decodeHistory = Schema.decodeUnknownOption(History)

/** What a save says about the long history. A save without it starts with empty Charts. */
export const historyOfSave = (saved: unknown): History =>
  typeof saved === 'object' && saved !== null && 'dashboard' in saved
    ? Option.getOrElse(decodeHistory(saved.dashboard), () => EMPTY_HISTORY)
    : EMPTY_HISTORY
