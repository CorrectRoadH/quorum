import * as HttpRouter from 'effect/http/HttpRouter'
import * as Layer from 'effect/Layer'
import { RpcSerialization, RpcServer } from 'effect/rpc'
import { Api, RPC_PATH } from '@quorum/rpc'
import { ChallengeHandlers } from './contexts/challenges/handlers.ts'
import { ResultStore } from './contexts/challenges/store.ts'
import { SystemHandlers } from './contexts/system/handlers.ts'
import { d1ResultStore, type SqlRunner } from './platform/d1-result-store.ts'

/** The bindings `alchemy.run.ts` gives the API Worker. A `D1Database` is a `SqlRunner`. */
export type Env = Readonly<{ RESULTS: SqlRunner }>

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
    ),
  )

// Built on the first request and kept for the isolate, once per database binding.
let built: Readonly<{ db: SqlRunner; handler: ReturnType<typeof handlerFor> }> | undefined

export default {
  fetch: (request: Request, env: Env): Promise<Response> => {
    if (built?.db !== env.RESULTS) built = { db: env.RESULTS, handler: handlerFor(env) }
    return built.handler.handler(request)
  },
}
