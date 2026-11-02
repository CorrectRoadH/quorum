import { Context, Layer } from 'effect'
import { RpcClient, RpcClientError, RpcSerialization } from 'effect/rpc'
import { Http } from 'foldkit'
import { Api, RPC_PATH } from '@quorum/rpc'

/** The API Worker's RPC client, same origin. Copied from `examples/reference/src/platform/rpc.ts`. */
export class ApiRpc extends Context.Service<
  ApiRpc,
  RpcClient.FromGroup<typeof Api, RpcClientError.RpcClientError>
>()('quorum/web/ApiRpc') {
  static readonly layer = Layer.effect(ApiRpc, RpcClient.make(Api)).pipe(
    Layer.provide(RpcClient.layerProtocolHttp({ url: RPC_PATH })),
    Layer.provide(RpcSerialization.layerJson),
    Layer.provide(Http.layer),
  )
}
