import type { CaptureResult } from 'posthog-js'
import { eraOf } from '@quorum/simulation/lookups'
import { SIM_VERSION } from '@quorum/simulation/version'
import { eventsOf } from '../game/analytics-bridge.ts'
import { allow } from '../game/analytics-budget.ts'
import { halted, ledgerOf, type Model } from '../game/model.ts'
import type { LogEntry } from '../game/playlog.ts'
import { onBoard } from '../game/route.ts'

/* ==========================================================================
   Product analytics. The SDK is loaded after boot, only when a project token
   is configured, and every event passes the free-tier budget in `before_send`.
   The game never reads this module's state; `entry.ts` observes each Model.
   ========================================================================== */

type Client = typeof import('posthog-js').default

const TOKEN = import.meta.env.VITE_POSTHOG_KEY
const HEARTBEAT_MS = 120_000
const MAX_HEARTBEATS = 30
/** `?analytics=off` disables capture, `?analytics=on` allows it in a development build. */
const FORCED =
  typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get('analytics')

export const PRIVACY_URL = 'https://wiki.playquorum.dev/about/privacy'

let client: Client | null = null
let starting = false
let latest: Model | null = null
let enabled = true
let ended = false
let startedAt = Date.now()
let activeSince = Date.now()
let activeMs = 0
let heartbeats = 0
let maxEra = 0
const companies = new Set<string>()
const seenComponents = new Set<string>()
let lastContext = ''

const round = (value: number, digits = 2): number => {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

const search = (): URLSearchParams =>
  typeof window === 'undefined'
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search)

const referrerDomain = (referrer: string): string | null => {
  if (referrer === '') return null
  try {
    return new URL(referrer).hostname
  } catch {
    return null
  }
}

const viewportBucket = (width: number): string =>
  width < 600 ? 'phone' : width < 1024 ? 'tablet' : width < 1600 ? 'laptop' : 'desktop'

const beforeSend = (event: CaptureResult | null): CaptureResult | null => {
  if (event === null) return null
  if (FORCED === 'off') return null
  if (!import.meta.env.PROD && FORCED === null) return null
  if (!allow(event.event, Date.now())) return null
  return {
    ...event,
    properties: {
      ...Object.fromEntries(
        Object.entries(event.properties).map(([key, value]) => [
          key,
          typeof value === 'string' && value.length > 200 ? value.slice(0, 200) : value,
        ]),
      ),
      app_surface: 'game',
    },
  }
}

const sessionStart = (model: Model): Record<string, unknown> => {
  const params = search()
  return {
    entry_route: model.route._tag,
    referrer_domain: typeof document === 'undefined' ? null : referrerDomain(document.referrer),
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    is_returning: model.saves.companies.length > 0,
    company_count: model.saves.companies.length,
    locale: model.prefs.locale,
    viewport_bucket: typeof window === 'undefined' ? null : viewportBucket(window.innerWidth),
    is_pwa:
      typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches,
    has_agent_access: model.prefs.agentAccess,
  }
}

const end = (): void => {
  if (client === null || ended) return
  ended = true
  if (typeof document !== 'undefined' && document.visibilityState === 'visible')
    activeMs += Date.now() - activeSince
  client.capture(
    'app:session_end',
    {
      duration_ms: Date.now() - startedAt,
      active_ms: activeMs,
      sim_seconds:
        latest !== null && onBoard(latest.route) ? Math.round(latest.board.game.time) : 0,
      max_era: maxEra,
      companies_opened: companies.size,
    },
    { transport: 'sendBeacon', send_instantly: true },
  )
}

const heartbeat = (): void => {
  if (client === null || latest === null) return
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  const model = latest
  if (!onBoard(model.route) || halted(model)) return
  if (heartbeats >= MAX_HEARTBEATS) return
  heartbeats += 1
  const game = model.board.game
  const ledger = ledgerOf(model)
  const kind = model.board.session._tag.toLowerCase()
  client.capture('game:heartbeat', {
    session_kind: kind,
    company_id: kind === 'company' ? model.saves.current : null,
    era: game.stage,
    era_name: eraOf(game).name,
    users: Math.round(game.users),
    cash: round(game.cash),
    revenue: round(ledger.revenue),
    burn: round(ledger.burn),
    apdex: round(ledger.apdex, 3),
    error_share: round(ledger.errorShare, 4),
    bottleneck_component: game.nodes.find((node) => node.id === ledger.bottleneck)?.type ?? null,
    node_count: game.nodes.length,
    link_count: game.links.length,
    speed: model.board.clock.speed,
    team_size: game.engineers.length,
    region_count: new Set(game.nodes.map((node) => node.region)).size,
    session_minutes: Math.round((Date.now() - startedAt) / 60_000),
  })
}

const start = async (model: Model): Promise<void> => {
  if (starting || client !== null || TOKEN === undefined || TOKEN === '') return
  starting = true
  try {
    const { default: posthog } = await import('posthog-js')
    posthog.init(TOKEN, {
      api_host: `${window.location.origin}/q`,
      ui_host: 'https://us.posthog.com',
      defaults: '2026-08-30',
      autocapture: false,
      capture_pageview: 'history_change',
      capture_pageleave: true,
      person_profiles: 'identified_only',
      persistence: 'localStorage',
      opt_out_capturing_by_default: !enabled,
      // Headless browsers look like bots. A production build keeps the filter.
      opt_out_useragent_filter: !import.meta.env.PROD,
      respect_dnt: true,
      disable_session_recording: true,
      advanced_disable_flags: true,
      capture_exceptions: true,
      bootstrap: { distinctID: model.founder.deviceId, isIdentifiedID: false },
      before_send: beforeSend,
    })
    client = posthog
    if (!enabled) posthog.opt_out_capturing()
    posthog.register({ app_surface: 'game', sim_version: SIM_VERSION })
    posthog.capture('app:session_start', sessionStart(model))
    setInterval(heartbeat, HEARTBEAT_MS)
    window.addEventListener('pagehide', end)
  } catch (error) {
    // The SDK did not load. The game keeps running without analytics.
    if (import.meta.env.DEV) console.error('Analytics did not start', error)
  } finally {
    starting = false
  }
}

/** Keeps the latest Model for the heartbeat, and starts the SDK once it has a device id. */
export const observe = (model: Model): void => {
  latest = model
  if (client === null && !starting && model.founder.deviceId !== '') void start(model)
  if (onBoard(model.route) && model.board.session._tag === 'Company') {
    maxEra = Math.max(maxEra, model.board.game.stage)
    if (model.saves.current !== null) companies.add(model.saves.current)
  }
  if (client === null) return
  const signature = `${model.prefs.locale}|${model.saves.current ?? ''}|${model.board.session._tag}|${model.board.game.stage}|${model.board.game.founding.venture}`
  if (signature === lastContext) return
  lastContext = signature
  const kind = model.board.session._tag.toLowerCase()
  client.register({
    app_surface: 'game',
    locale: model.prefs.locale,
    session_kind: kind,
    company_id: kind === 'company' ? model.saves.current : null,
    era: model.board.game.stage,
    era_name: eraOf(model.board.game).name,
    venture: model.board.game.founding.venture,
  })
}

/** Maps one batch of playtest-log lines to PostHog events. */
export const forward = (entries: ReadonlyArray<LogEntry>): void => {
  if (client === null || latest === null || entries.length === 0) return
  for (const event of eventsOf(entries, { game: latest.board.game, seenComponents }))
    client.capture(event.event, event.properties)
}

/** The Settings switch. PostHog persists the choice in localStorage. */
export const setAnalyticsEnabled = (next: boolean): void => {
  enabled = next
  if (client === null) return
  if (next) client.opt_in_capturing()
  else client.opt_out_capturing()
}
