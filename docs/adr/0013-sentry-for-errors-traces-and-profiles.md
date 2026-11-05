# Sentry records errors, traces, and profiles

PostHog counts what players do ([ADR 0008](./0008-users-are-counted-per-region.md) counts users;
`apps/web/src/platform/analytics.ts` sends the events). It cannot say why a tick took 60 ms, why a
request failed, or where a crash came from. The Simulation runs in the browser and is replayed in the
API Worker ([ADR 0004](./0004-simulation-package.md)), so a slow step or a crash is the failure that
matters most.

We add Sentry (SaaS) for three jobs, and keep PostHog for product events:

- **Errors**, with source maps, from the browser and both Workers. A Foldkit crash reports the
  Message tag, the route, the session kind, the Era, and `SIM_VERSION`, never the Model.
- **Traces** from the browser through the website Worker and the API Worker to D1. Sentry owns
  traces; Cloudflare Workers Observability keeps logs only.
- **Profiles** of the page, in 5% of sessions, in Chromium only.

Only the app edges import Sentry: `apps/web/src/platform/sentry.ts` and the two Worker entries.
`packages/simulation`, the backend contexts, and `packages/ui` do not. Contexts mark work with
`Effect.withSpan` and `ErrorReporter.report`, and the Worker entry decides where those go.

Considered options:

- **`@sentry/effect` everywhere.** It supports Effect 4, but its Node entry pulls in `@sentry/node`,
  and the browser has no Effect failures to report: Foldkit turns Command failures into Messages.
  The API Worker uses its tracer and logger. The browser uses `@sentry/browser`.
- **A span per Message.** The clock sends eight Messages a second. Foldkit's `slow` option reports
  only an update, view, or patch over its budget, and `sim.tick_ms` samples one tick in sixteen.
  Rejected: a span per Message.
- **Session Replay.** Company names and mail are player text, and the crash tags cover most needs.
  Rejected.

## Consequences

- The deploy sets `VITE_SENTRY_DSN` (required for `prod`) and `VITE_SENTRY_RELEASE`. A build with
  `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` uploads hidden source maps.
- The browser follows the "Share anonymous usage data" setting and Do Not Track. The privacy page
  names Sentry as a second processor.
- Trace headers go only to `/api/`. The PostHog proxy at `/q` never receives them.
- A Worker's clock stands still until I/O, so a CPU-bound span reads zero. The replay cost is read
  from Cloudflare's CPU time. The `challenge.replay` span carries the outcome.
- Source maps upload from the build, with a debug ID in each bundle: the website build uploads the
  assets and its Worker (`apps/web/vite.config.ts`), and the API Worker's rolldown build uploads its
  own (`alchemy.run.ts`). Only the public assets lose their maps; the Worker maps stay in `.alchemy`
  and `dist/ssr`, which no deploy ships.
