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

/** Requests per second: one decimal under 100, compact above. */
export const rate = (value: number): string =>
  value === Number.POSITIVE_INFINITY ? '∞' : value < 100 ? value.toFixed(1) : compact(value)

/** Milliseconds: whole ms under a second, seconds above. */
export const ms = (value: number): string =>
  value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)} s`

export const clock = (seconds: number): string => {
  const whole = Math.floor(seconds)
  const hours = Math.floor(whole / 3600)
  const minutes = Math.floor((whole % 3600) / 60)
  const rest = String(whole % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}
