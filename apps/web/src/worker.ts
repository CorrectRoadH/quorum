import * as Sentry from '@sentry/cloudflare'
import { INGEST_PREFIX } from '@quorum/rpc'

interface ApiBinding {
  fetch(request: Request): Promise<Response>
}

interface Environment {
  readonly API: ApiBinding
  /** Without it the Sentry SDK stays off. */
  readonly SENTRY_DSN?: string
  readonly SENTRY_RELEASE?: string
}

/** PostHog Cloud US. The proxy keeps the project token and the hostname out of the page. */
const POSTHOG_API = 'us.i.posthog.com'
const POSTHOG_ASSETS = 'us-assets.i.posthog.com'

const isIngest = (pathname: string): boolean =>
  pathname === INGEST_PREFIX || pathname.startsWith(`${INGEST_PREFIX}/`)

/**
 * Forwards one analytics request to PostHog. Assets go to the asset host;
 * everything else goes to the ingest host. Cookies and any credential that is
 * not a PostHog key are dropped, and the real client IP is forwarded so
 * PostHog records the player's location rather than the Worker's.
 */
const ingest = async (request: Request, url: URL): Promise<Response> => {
  const path = url.pathname.slice(INGEST_PREFIX.length) || '/'
  const asset = path.startsWith('/static/') || path.startsWith('/array/')
  const headers = new Headers(request.headers)
  headers.delete('cookie')
  if (!/^Bearer ph[csx]_/.test(headers.get('authorization') ?? '')) headers.delete('authorization')
  const ip = request.headers.get('CF-Connecting-IP')
  if (ip) headers.set('X-Forwarded-For', ip)
  return fetch(`https://${asset ? POSTHOG_ASSETS : POSTHOG_API}${path}${url.search}`, {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD' ? null : await request.arrayBuffer(),
    redirect: request.redirect,
  })
}

/**
 * Only requests under the API or ingest prefixes reach this module (see
 * `runWorkerFirst` in `alchemy.run.ts`). Every other path is served from the
 * static assets.
 */
export default Sentry.withSentry(
  (env: Environment) => ({
    dsn: env.SENTRY_DSN,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
    initialScope: { tags: { service: 'website-worker' } },
  }),
  {
    // The incoming request carries the browser's trace headers. Sentry continues that trace, and
    // the service binding passes the same headers on, so the API Worker joins it.
    fetch(request: Request, env: Environment): Promise<Response> {
      const url = new URL(request.url)
      return isIngest(url.pathname) ? ingest(request, url) : env.API.fetch(request)
    },
  },
)
