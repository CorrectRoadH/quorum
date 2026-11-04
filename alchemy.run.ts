import * as Alchemy from 'alchemy'
import * as Cloudflare from '@alchemy.run/cloudflare'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { API_PREFIX, INGEST_PREFIX } from '@quorum/rpc'

const compatibility = { date: '2026-10-08' }

/**
 * The PostHog project token. It is a build-time Vite variable, not a Worker
 * binding: the app inlines it at build time and the Worker only proxies the
 * requests. The deploy environment must set it.
 */
const posthogKey = process.env.VITE_POSTHOG_KEY ?? ''

/**
 * The public hostnames of the `prod` stage. The old hostname 301s to the new one, path and query
 * kept. Both zones must exist in the Cloudflare account.
 */
const PRODUCTION_DOMAIN = { name: 'playquorum.dev', redirects: ['quorum.elianiva.com'] }

/** The wiki's public hostname in the `prod` stage, in the same zone (ADR 0009). */
const WIKI_DOMAIN = 'wiki.playquorum.dev'

/**
 * Cloudflare Workers Observability, configured on the host resources only.
 * Sampling at 1 records every request: lower both rates before real traffic.
 */
const observability = {
  enabled: true,
  headSamplingRate: 1,
  logs: { enabled: true, invocationLogs: true, headSamplingRate: 1, persist: true },
  traces: { enabled: true, headSamplingRate: 1, persist: true },
}

const state = Layer.unwrap(
  Effect.gen(function* () {
    const dev = yield* Alchemy.ALCHEMY_DEV.pipe(Effect.orDie)
    return dev ? Alchemy.localState() : Cloudflare.state()
  }),
)

export default Alchemy.Stack(
  'quorum',
  { providers: Cloudflare.providers(), state },
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stack.use((stack) => Effect.succeed(stack.stage))
    // A prod deploy without the token would ship a site that silently collects
    // nothing. Fail here instead.
    if (stage === 'prod' && posthogKey === '')
      return yield* Effect.die(
        new Error(
          'VITE_POSTHOG_KEY is required for the prod stage. Set it in the deploy environment.',
        ),
      )
    // Verified Challenge results: per-axis bests and histograms (docs/architecture.md).
    const Results = Cloudflare.D1.Database('Results', { migrations: './apps/backend/migrations' })
    const ApiWorker = Cloudflare.Worker('Api', {
      main: './apps/backend/src/worker.ts',
      env: { RESULTS: Results },
      compatibility,
      observability,
      // The website reaches the API through its service binding only. Remove
      // this when the API needs its own public URL or custom domain.
      workersDev: false,
    })
    const Website = Cloudflare.Website.Foldkit('Website', {
      rootDir: stage === 'reference' ? 'examples/reference' : 'apps/web',
      main: 'src/worker.ts',
      env: { API: ApiWorker },
      assets: {
        runWorkerFirst: [`${API_PREFIX}/*`, `${INGEST_PREFIX}/*`],
        notFoundHandling: 'single-page-application',
      },
      ...(stage === 'prod' && { domain: PRODUCTION_DOMAIN }),
      compatibility,
      observability,
    })

    // The wiki: every page prerendered at build time. Foldkit's generated Worker answers the
    // rest (the sitemap and 404s). Pages are folders, so serve them without a trailing slash.
    const Wiki = Cloudflare.Website.Foldkit('Wiki', {
      rootDir: 'apps/wiki',
      assets: { htmlHandling: 'drop-trailing-slash' },
      ...(stage === 'prod' && { domain: WIKI_DOMAIN }),
      compatibility,
      observability,
    })

    yield* Results
    yield* ApiWorker
    const website = yield* Website
    if (stage === 'reference') return { url: website.url }
    const wiki = yield* Wiki
    return { url: website.url, wiki: wiki.url }
  }),
)
