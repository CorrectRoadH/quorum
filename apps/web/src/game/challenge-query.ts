import * as Effect from 'effect/Effect'
import { Schema } from 'effect'
import { Query } from 'foldkit/experimental'
import { ApiError, ChallengeHistograms } from '@quorum/rpc'
import { ApiRpc } from '@/platform/rpc.ts'

/** Transport failures take the declared error's shape, so views handle one error type. */
export const asApiError = <A>(
  effect: Effect.Effect<
    A,
    ApiError | { readonly _tag: 'RpcClientError'; readonly message: string }
  >,
) =>
  effect.pipe(
    Effect.mapError((error) =>
      error._tag === 'RpcClientError' ? new ApiError({ message: error.message }) : error,
    ),
  )

/** Each Challenge's histograms for one Simulation version, kept while the page lives. */
export const histogramQuery = Query.define({
  name: 'ChallengeHistograms',
  data: ChallengeHistograms,
  error: ApiError,
  args: { challengeId: Schema.String, simVersion: Schema.Finite },
  toKey: ({ challengeId, simVersion }) => `${challengeId}@${simVersion}`,
  execute: (args) =>
    Effect.gen(function* () {
      const rpc = yield* ApiRpc
      return yield* asApiError(rpc.challengeHistogramGet(args))
    }),
})
