/* Number formatting shared by the HTML views and the board. */

const UNITS = ['', 'k', 'M', 'B', 'T'] as const

/** 1234 → 1.23k, 5_600_000 → 5.6M. */
export const compact = (value: number): string => {
  const sign = value < 0 ? '−' : ''
  let rest = Math.abs(value)
  let unit = 0
  while (rest >= 1000 && unit < UNITS.length - 1) {
    rest /= 1000
    unit += 1
  }
  const digits =
    unit === 0 ? (rest < 10 && rest % 1 !== 0 ? 1 : 0) : rest < 10 ? 2 : rest < 100 ? 1 : 0
  return `${sign}${rest.toFixed(digits)}${UNITS[unit] ?? ''}`
}

export const money = (value: number): string => {
  const sign = value < 0 ? '−' : ''
  const rest = Math.abs(value)
  return `${sign}$${rest < 1000 ? (rest < 10 ? rest.toFixed(2) : Math.round(rest)) : compact(rest)}`
}

/** A price on a button. A Sandbox has no money, so it shows none. */
export const priceLabel = (sandbox: boolean, value: number): string => (sandbox ? '' : money(value))

/** Requests per second: one decimal under 100, compact above. */
export const rate = (value: number): string =>
  value === Number.POSITIVE_INFINITY ? '∞' : value < 100 ? value.toFixed(1) : compact(value)

/** Milliseconds: whole ms under a second, seconds above. */
export const ms = (value: number): string =>
  value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)} s`

/** How long a new task waits in a Queue: seconds, minutes or hours, or stalled with no Worker draining. */
export const queueWait = (seconds: number | null): string =>
  seconds === null
    ? '—'
    : seconds === Number.POSITIVE_INFINITY
      ? 'stalled'
      : seconds < 60
        ? `${Math.round(seconds)} s`
        : seconds < 3600
          ? `${Math.round(seconds / 60)} min`
          : `${Math.round(seconds / 3600)} h`

/** What an alert rule pages on, at its threshold. */
export const alertText = (rule: 'errors' | 'latency' | 'saturation', threshold: number): string =>
  rule === 'errors'
    ? `Error rate above ${threshold * 100}%`
    : rule === 'latency'
      ? `p99 above ${threshold}× the Apdex target`
      : `A Node above ${Math.round(threshold * 100)}% load`

/** A setting in seconds: 30 s, 5 min, 1 h. */
export const duration = (seconds: number): string =>
  seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${seconds / 60} min` : `${seconds / 3600} h`

export const clock = (seconds: number): string => {
  const whole = Math.floor(seconds)
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const rest = String(whole % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}
