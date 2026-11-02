import { CALENDAR_START } from './catalog.ts'

/* The calendar, and an exact cosine for the daily cycles (04 "Determinism"). */

/** Minutes since the calendar began. One sim second is one calendar minute. */
export const calendarMinute = (time: number): number => CALENDAR_START + time

export const clockOf = (time: number) => {
  const minute = calendarMinute(time)
  return {
    day: Math.floor(minute / 1440) + 1,
    hour: Math.floor((minute % 1440) / 60),
    minute: Math.floor(minute % 60),
  }
}

const PI = 3.141592653589793

/** Taylor series of cos and sin around 0, exact to double precision on [−π/4, π/4]. */
const cosSeries = (x: number): number => {
  const xx = x * x
  let term = 1
  let sum = 1
  for (let n = 2; n <= 20; n += 2) {
    term *= -xx / ((n - 1) * n)
    sum += term
  }
  return sum
}
const sinSeries = (x: number): number => {
  const xx = x * x
  let term = x
  let sum = x
  for (let n = 3; n <= 21; n += 2) {
    term *= -xx / ((n - 1) * n)
    sum += term
  }
  return sum
}

/**
 * cos(2π × turns) with only + − × ÷ and floor, so every engine gets the same
 * bits (04 "Determinism"). The angle folds into [0, π/4] by symmetry first.
 */
export const cosTurns = (turns: number): number => {
  const t = turns - Math.floor(turns)
  // cos is even and has period 1 in turns: fold to [0, 1/2].
  const half = t > 0.5 ? 1 - t : t
  // cos(π − x) = −cos(x): fold to [0, 1/4].
  const sign = half > 0.25 ? -1 : 1
  const quarter = half > 0.25 ? 0.5 - half : half
  // cos(x) = sin(π/2 − x): fold to [0, 1/8].
  return quarter > 0.125
    ? sign * sinSeries((0.25 - quarter) * 2 * PI)
    : sign * cosSeries(quarter * 2 * PI)
}
