import * as Sentry from '@sentry/cloudflare'
import { SentryEffectLogger, SentryEffectTracer } from '@sentry/effect'
import { ErrorReporter } from 'effect'
import * as HttpRouter from 'effect/http/HttpRouter'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Tracer from 'effect/Tracer'
import { RpcSerialization, RpcServer } from 'effect/rpc'
import { Api, RPC_PATH } from '@quorum/rpc'
import { ChallengeHandlers } from './contexts/challenges/handlers.ts'
import { ResultStore } from './contexts/challenges/store.ts'
import { SystemHandlers } from './contexts/system/handlers.ts'
import { d1ResultStore, type SqlRunner } from './platform/d1-result-store.ts'

/**
 * The bindings `alchemy.run.ts` gives the API Worker. A `D1Database` is a `SqlRunner`.
 * Without `SENTRY_DSN` the Sentry SDK stays off.
 */
export type Env = Readonly<{ RESULTS: SqlRunner; SENTRY_DSN?: string; SENTRY_RELEASE?: string }>

/**
 * Sentry gets every failure Effect reports except `ApiError`: it is the declared answer to a bad
 * request, not a fault, so it stays out of the issue list.
 */
const SentryErrors = ErrorReporter.layer(
  [
    ErrorReporter.make(({ error }) => {
      if ('_tag' in error && error._tag === 'ApiError') return
      Sentry.captureException(error)
    }),
  ],
  { mergeWithExisting: true },
)

/** Effect spans become Sentry spans, and Effect logs reach Sentry next to the console. */
const SentryLive = Layer.mergeAll(
  SentryErrors,
  Layer.succeed(Tracer.Tracer, SentryEffectTracer),
  Logger.layer([SentryEffectLogger], { mergeWithExisting: true }),
)

const handlerFor = (env: Env) =>
  HttpRouter.toWebHandler(
    RpcServer.layerHttp({
      group: Api,
      path: RPC_PATH,
      protocol: 'http',
    }).pipe(
      Layer.provide(Layer.mergeAll(SystemHandlers, ChallengeHandlers)),
      Layer.provide(Layer.succeed(ResultStore, d1ResultStore(env.RESULTS))),
      Layer.provideMerge(RpcSerialization.layerJson),
      Layer.provide(SentryLive),
    ),
  )

// Built on the first request and kept for the isolate, once per database binding.
let built: Readonly<{ db: SqlRunner; handler: ReturnType<typeof handlerFor> }> | undefined

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    release: env.SENTRY_RELEASE,
    // Sentry owns traces; Cloudflare Workers Observability keeps logs only (see `alchemy.run.ts`).
    tracesSampleRate: 0.1,
    initialScope: { tags: { service: 'api-worker' } },
  }),
  {
    fetch: (request: Request, env: Env): Promise<Response> => {
      if (built?.db !== env.RESULTS) built = { db: env.RESULTS, handler: handlerFor(env) }
      return built.handler.handler(request)
    },
  },
)
