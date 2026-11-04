import type { CaptureResult } from 'posthog-js'

/* ==========================================================================
   The wiki sends page views to the same PostHog project as the game. It has
   no custom events: `$pageview` carries the path, the referrer, and UTMs.
   ========================================================================== */

const TOKEN = import.meta.env.VITE_POSTHOG_KEY
const FORCED =
  typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get('analytics')

/** A runaway client cannot spend the project's month on one page load. */
const LIMIT = 300
let sent = 0

const beforeSend = (event: CaptureResult | null): CaptureResult | null => {
  if (event === null || FORCED === 'off') return null
  if (!import.meta.env.PROD && FORCED === null) return null
  if (sent >= LIMIT) return null
  sent += 1
  return { ...event, properties: { ...event.properties, app_surface: 'wiki' } }
}

export const startAnalytics = (): void => {
  if (TOKEN === undefined || TOKEN === '' || typeof window === 'undefined') return
  void import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(TOKEN, {
        api_host: 'https://us.i.posthog.com',
        ui_host: 'https://us.posthog.com',
        defaults: '2026-08-30',
        autocapture: false,
        capture_pageview: 'history_change',
        capture_pageleave: true,
        person_profiles: 'identified_only',
        persistence: 'localStorage',
        opt_out_useragent_filter: !import.meta.env.PROD,
        respect_dnt: true,
        disable_session_recording: true,
        advanced_disable_flags: true,
        before_send: beforeSend,
      })
      posthog.register({ app_surface: 'wiki' })
    })
    .catch(() => {
      // The wiki works without analytics.
    })
}
