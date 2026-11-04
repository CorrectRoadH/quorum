/* ==========================================================================
   The free-tier budget. Every event passes through `allow` in `before_send`.
   Funnel events bypass the session cap, so a conversion rate never loses its
   numerator, but they still count against the month.
   ========================================================================== */

export const SESSION_LIMIT = 80
export const MONTH_LIMIT = 600

const KEY = 'quorum.analytics.v1'

/** Events that answer the activation and progression questions. */
const FUNNEL = new Set([
  'app:session_start',
  'app:session_end',
  'company:founded',
  'company:era_reached',
  'company:exited',
])

type Store = Readonly<{
  /** UTC month, `YYYY-MM`. */
  month: string
  events: number
  session: string
  sessionEvents: number
}>

let memory: Store | null = null

const session = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const monthOf = (now: number): string => new Date(now).toISOString().slice(0, 7)

const read = (now: number): Store => {
  const month = monthOf(now)
  const fresh: Store = { month, events: 0, session, sessionEvents: 0 }
  if (typeof window === 'undefined') return memory ?? (memory = fresh)
  try {
    const raw = window.localStorage.getItem(KEY)
    const stored = raw === null ? null : (JSON.parse(raw) as Store)
    if (stored === null || stored.month !== month) return fresh
    return stored.session === session ? stored : { ...stored, session, sessionEvents: 0 }
  } catch {
    return memory ?? (memory = fresh)
  }
}

const write = (store: Store): void => {
  memory = store
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // Storage is full or blocked: the in-memory counter still caps this session.
  }
}

export const isFunnel = (event: string): boolean => FUNNEL.has(event)

/** True when the event fits the month and session budgets. */
export const allow = (event: string, now: number): boolean => {
  const store = read(now)
  if (store.events >= MONTH_LIMIT) return false
  if (!isFunnel(event) && store.sessionEvents >= SESSION_LIMIT) return false
  write({ ...store, events: store.events + 1, sessionEvents: store.sessionEvents + 1 })
  return true
}
