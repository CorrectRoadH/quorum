import { Schema } from 'effect'

/* ==========================================================================
   The playtest log: every gesture, refusal, incident, change result and a
   sample of the company every 10 sim seconds, kept in localStorage across
   reloads and exported as JSON Lines for analysis. Commands call these
   functions; nothing in the Model depends on them.
   ========================================================================== */

export const LOG_KEY = 'quorum.playlog.v1'
const LIMIT = 50_000

/** One line of the log. `data` is the event's payload as JSON. */
export const LogEntry = Schema.Struct({
  /** Sim seconds since the company started. */
  t: Schema.Finite,
  type: Schema.String,
  data: Schema.String,
})
export type LogEntry = typeof LogEntry.Type

type Stored = Readonly<{
  session: string
  seq: number
  /** Wall clock, ms since the epoch. */
  wall: number
  t: number
  type: string
  data: unknown
}>

let cache: Array<Stored> | null = null
let seq = 0
const session = `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`

const load = (): Array<Stored> => {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(LOG_KEY)
    cache = raw ? (JSON.parse(raw) as Array<Stored>) : []
  } catch {
    cache = []
  }
  seq = cache.reduce((highest, entry) => Math.max(highest, entry.seq), 0)
  return cache
}

const persist = (entries: Array<Stored>): void => {
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(entries))
  } catch {
    // Storage is full: keep the newest half and try once more.
    entries.splice(0, Math.floor(entries.length / 2))
    try {
      window.localStorage.setItem(LOG_KEY, JSON.stringify(entries))
    } catch {
      // The log lives in memory until export.
    }
  }
}

export const appendLog = (lines: ReadonlyArray<LogEntry>): void => {
  if (lines.length === 0) return
  const entries = load()
  const wall = Date.now()
  for (const line of lines) {
    seq += 1
    let data: unknown
    try {
      data = JSON.parse(line.data)
    } catch {
      data = line.data
    }
    entries.push({ session, seq, wall, t: Math.round(line.t * 100) / 100, type: line.type, data })
  }
  if (entries.length > LIMIT) entries.splice(0, entries.length - LIMIT)
  persist(entries)
}

export const logSize = (): number => load().length

/** Downloads the log as JSON Lines: one event per line. */
export const downloadLog = (): void => {
  const body = load()
    .map((entry) => JSON.stringify(entry))
    .join('\n')
  const blob = new Blob([body], { type: 'application/x-ndjson' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `quorum-playtest-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const clearLog = (): void => {
  cache = []
  seq = 0
  persist(cache)
}

declare global {
  interface Window {
    /** The playtest log, for the browser console. */
    quorumLog?: () => ReadonlyArray<unknown>
  }
}

if (typeof window !== 'undefined') window.quorumLog = () => load()
