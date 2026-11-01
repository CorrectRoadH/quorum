/* ==========================================================================
   What happens to one request on its way through the Design. An Outcome is a
   success share, a latency distribution, and the share that fails by cause.

   Latency is a fixed part (base latencies, network hops) plus an exponential
   part (service and queueing), plus a rare tail event such as an event loop
   stall. The tail lands on the slowest `tailP` share of requests: they are the
   ones that waited behind the stall. Exponential response times are the M/M/1 shape, so percentiles and
   Apdex fall out of one formula. The math uses only + − × ÷, so it is exact
   across JavaScript engines.
   ========================================================================== */

export const ERROR_CAUSES = [
  'stranded',
  'dropped',
  'refused',
  'down',
  'stale',
  'oom',
  'timeout',
] as const
export type ErrorCause = (typeof ERROR_CAUSES)[number]
export type Failures = Readonly<Record<ErrorCause, number>>

export type Outcome = Readonly<{
  /** Share of requests that get an answer. */
  success: number
  /** Milliseconds every request pays. */
  fixed: number
  /** Mean of the exponential part, in milliseconds. */
  variable: number
  /** Share of requests hit by a tail event, and what it adds. */
  tailP: number
  tailMs: number
  /** Share of answered reads that come back stale. */
  stale: number
  /** Revenue multiplier from the Stack that answered. */
  value: number
  /** Share of requests that fail, by cause. Sums to 1 − success. */
  fail: Failures
}>

/** A Failures record with one value per cause. A plain loop: this runs on every hop of every solve. */
const failuresBy = (value: (cause: ErrorCause) => number): Failures => {
  const fail = {} as Record<ErrorCause, number>
  for (const cause of ERROR_CAUSES) fail[cause] = value(cause)
  return fail
}

export const NO_FAILURES: Failures = failuresBy(() => 0)

const scaleFailures = (fail: Failures, by: number): Failures =>
  failuresBy((cause) => fail[cause] * by)

const addFailures = (a: Failures, b: Failures): Failures =>
  failuresBy((cause) => a[cause] + b[cause])

/** Every request fails for one cause. */
export const failed = (cause: ErrorCause): Outcome => ({
  success: 0,
  fixed: 0,
  variable: 0,
  tailP: 0,
  tailMs: 0,
  stale: 0,
  value: 1,
  fail: { ...NO_FAILURES, [cause]: 1 },
})

/** Every request is answered here. */
export const answered = (fixed: number, variable: number): Outcome => ({
  success: 1,
  fixed,
  variable,
  tailP: 0,
  tailMs: 0,
  stale: 0,
  value: 1,
  fail: NO_FAILURES,
})

/** What a Node adds before it passes the request on. */
export type Hop = Readonly<{
  /** Share it processes; the rest fails for `cause`. */
  share: number
  cause: ErrorCause
  fixed: number
  variable: number
  tailP: number
  tailMs: number
  value: number
}>

export const hop = (entry: Partial<Hop>): Hop => ({
  share: 1,
  cause: 'dropped',
  fixed: 0,
  variable: 0,
  tailP: 0,
  tailMs: 0,
  value: 1,
  ...entry,
})

const combineTail = (a: number, aMs: number, b: number, bMs: number) => {
  const p = 1 - (1 - a) * (1 - b)
  return { tailP: p, tailMs: a + b > 0 ? (a * aMs + b * bMs) / (a + b) : 0 }
}

/** A hop followed by the requests it sends, called in sequence. */
export const through = (
  own: Hop,
  calls: ReadonlyArray<readonly [Outcome, number]> = [],
  staleCounts = false,
): Outcome => {
  let success = 1
  let fixed = own.fixed
  let variable = own.variable
  let tail = { tailP: own.tailP, tailMs: own.tailMs }
  let causes = NO_FAILURES
  let causeWeight = 0
  let stale = 0
  for (const [call, count] of calls) {
    if (count <= 0) continue
    let reached = 1
    for (let index = 0; index < count; index += 1) reached *= call.success
    success *= reached
    fixed += call.fixed * count
    variable += call.variable * count
    tail = combineTail(tail.tailP, tail.tailMs, call.tailP, call.tailMs)
    causes = addFailures(causes, scaleFailures(call.fail, count))
    causeWeight += (1 - call.success) * count
    stale = Math.max(stale, call.stale)
  }
  const staleLoss = staleCounts ? stale : 0
  const childFailure = 1 - success
  const childFail =
    causeWeight > 0 ? scaleFailures(causes, childFailure / causeWeight) : NO_FAILURES
  const reached = own.share
  const fail = addFailures(
    { ...NO_FAILURES, [own.cause]: 1 - reached },
    scaleFailures(addFailures(childFail, { ...NO_FAILURES, stale: success * staleLoss }), reached),
  )
  return {
    success: reached * success * (1 - staleLoss),
    fixed,
    variable,
    ...tail,
    stale: staleCounts ? 0 : stale,
    value: own.value,
    fail,
  }
}

/** A weighted mix of the outcomes of several targets. Undefined when there are none. */
export const blend = (entries: ReadonlyArray<readonly [Outcome, number]>): Outcome | undefined => {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (entries.length === 0 || total <= 0) return undefined
  let result: Outcome = {
    success: 0,
    fixed: 0,
    variable: 0,
    tailP: 0,
    tailMs: 0,
    stale: 0,
    value: 0,
    fail: NO_FAILURES,
  }
  let tailWeight = 0
  for (const [entry, weight] of entries) {
    const w = weight / total
    tailWeight += entry.tailP * w * entry.tailMs
    result = {
      success: result.success + entry.success * w,
      fixed: result.fixed + entry.fixed * w,
      variable: result.variable + entry.variable * w,
      tailP: result.tailP + entry.tailP * w,
      tailMs: 0,
      stale: result.stale + entry.stale * w,
      value: result.value + entry.value * w,
      fail: addFailures(result.fail, scaleFailures(entry.fail, w)),
    }
  }
  return { ...result, tailMs: result.tailP > 0 ? tailWeight / result.tailP : 0 }
}

/* ---------- reading a distribution ---------- */

/** e^(−x) for x ≥ 0, from a short series and eight squarings. */
export const decay = (x: number): number => {
  if (x <= 0) return 1
  if (x > 60) return 0
  const y = x / 256
  let value = 1 - y + (y * y) / 2 - (y * y * y) / 6
  for (let index = 0; index < 8; index += 1) value *= value
  return value
}

/**
 * Share of answered requests slower than `ms`. The tail event adds `tailMs` to
 * the slowest `tailP` share, so a stall raises the p99 by its length while the
 * p95 and the mean barely move.
 */
export const slowerThan = (outcome: Outcome, ms: number): number => {
  const base = (at: number): number => {
    const left = at - outcome.fixed
    if (left < 0) return 1
    return outcome.variable > 0 ? decay(left / outcome.variable) : 0
  }
  if (outcome.tailP <= 0 || outcome.tailMs <= 0) return base(ms)
  return Math.max(base(ms), Math.min(outcome.tailP, base(ms - outcome.tailMs)))
}

export const meanOf = (outcome: Outcome): number =>
  outcome.fixed + outcome.variable + outcome.tailP * outcome.tailMs

/** Apdex of the answered requests: satisfied plus half the tolerating. */
export const apdexOf = (outcome: Outcome, target: number): number => {
  const slow = slowerThan(outcome, target)
  const frustrated = slowerThan(outcome, target * 4)
  return 1 - slow + (slow - frustrated) / 2
}

/** The q-th percentile of answered requests, in milliseconds. */
export const percentile = (outcome: Outcome, q: number): number => {
  let low = outcome.fixed
  let high = outcome.fixed + outcome.tailMs + outcome.variable * 12 + 1
  for (let index = 0; index < 40; index += 1) {
    const middle = (low + high) / 2
    if (slowerThan(outcome, middle) > 1 - q) low = middle
    else high = middle
  }
  return high
}
