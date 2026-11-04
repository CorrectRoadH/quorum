import { INGEST_PREFIX } from '@quorum/rpc'

interface ApiBinding {
  fetch(request: Request): Promise<Response>
}

interface Environment {
  readonly API: ApiBinding
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
export default {
  fetch(request: Request, env: Environment): Promise<Response> {
    const url = new URL(request.url)
    return isIngest(url.pathname) ? ingest(request, url) : env.API.fetch(request)
  },
}
