/* ==========================================================================
   The read model the HUD and the graphs share. Placeholder balance, real
   shape: demand grows, Tuesday morning spikes, latency follows load.
   ========================================================================== */

export const TICKS_IN_MONTH = 900
export const SPIKE_START = 340
export const SPIKE_END = 392

export const loadAt = (tick: number): number => {
  const base = 1.15 + (tick / TICKS_IN_MONTH) * 1.05
  const spike = tick > SPIKE_START && tick < SPIKE_END ? 0.9 : 0
  return base + spike
}

export const latencyAt = (tick: number, spiked: boolean): number =>
  Math.round(88 + (tick / TICKS_IN_MONTH) * 62 + (spiked ? 46 : 0) + ((tick * 7) % 11) - 5)

export const errorsAt = (tick: number, spiked: boolean): string =>
  (0.2 + (tick / TICKS_IN_MONTH) * 0.55 + (spiked ? 0.9 : 0) + ((tick * 3) % 5) / 20).toFixed(1)

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export const calendarAt = (tick: number): Readonly<{ week: number; label: string }> => {
  const dayIndex = Math.floor((tick / TICKS_IN_MONTH) * 28) % 28
  return {
    week: 1 + Math.floor(dayIndex / 7),
    label: `${DAYS[dayIndex % 7] ?? 'Mon'} ${String(3 + (dayIndex % 12)).padStart(2, '0')}:00`,
  }
}

export const money = (value: number): string => `$${Math.round(value).toLocaleString('en-US')}`

export const clock = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
