import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Scope from 'effect/Scope'
import { Result } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { RpcClient, RpcSerialization } from 'effect/rpc'
import { beforeEach, expect, test } from 'vitest'
import { Api, RPC_PATH } from '@template/rpc'
import {
  SIM_VERSION,
  challengeById,
  dailyDrill,
  designOf,
  encodeReplay,
  setFamily,
  type Challenge,
  type Game,
} from '@template/simulation'
import { sqliteRunner } from './platform/sqlite-runner.ts'
import worker, { type Env } from './worker.ts'

const url = `http://api.test${RPC_PATH}`

let env: Env = { RESULTS: sqliteRunner() }
beforeEach(() => {
  env = { RESULTS: sqliteRunner() }
})

/**
 * Sends the RPC client's HTTP requests straight to the Worker entry module, so
 * the test covers request encoding, routing, the handler, and error mapping.
 */
const fetchThroughWorker: typeof globalThis.fetch = async (input, init) => {
  const request = new Request(input, init)
  return worker.fetch(request, env)
}

const protocol = RpcClient.layerProtocolHttp({ url }).pipe(
  Layer.provide(RpcSerialization.layerJson),
  Layer.provide(FetchHttpClient.layer),
)

const run = <A, E>(effect: Effect.Effect<A, E, RpcClient.Protocol | Scope.Scope>) =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(protocol),
      Effect.provideService(FetchHttpClient.Fetch, fetchThroughWorker),
      Effect.scoped,
    ),
  )

const client = RpcClient.make(Api)

const DEVICE = '0b6f2f0e-5d0c-4b1e-9a51-1f5c2a7d9e10'

const hello = challengeById('hello-world') as Challenge

const general = (game: Game): Game => {
  const changed = setFamily(game, 'server', 'general')
  return Result.isSuccess(changed) ? changed.success : game
}

const replayOf = (challenge: Challenge, game: Game) =>
  encodeReplay({
    v: 1,
    challenge: challenge.id,
    simVersion: SIM_VERSION,
    design: designOf(game),
    actions: [],
  })

const submit = (challenge: Challenge, replay: string, simVersion = SIM_VERSION) =>
  Effect.gen(function* () {
    const api = yield* client
    return yield* api.challengeSubmit({
      challengeId: challenge.id,
      simVersion,
      deviceId: DEVICE,
      replay,
    })
  })

test('the API Worker serves the shared RPC contract over HTTP', async () => {
  const response = await run(
    Effect.gen(function* () {
      const api = yield* client
      return yield* api.systemStatusGet()
    }),
  )

  expect(response).toEqual({ message: 'The API Worker is connected.' })
})

test('the API Worker rejects unknown paths', async () => {
  const response = await worker.fetch(
    new Request('http://api.test/unknown', { method: 'POST' }),
    env,
  )

  expect(response.status).toBe(404)
})

test('a passing replay is verified, stored, and placed on the histogram', async () => {
  const verdict = await run(submit(hello, replayOf(hello, general(hello.start()))))
  expect(verdict).toMatchObject({ passed: true, missed: null, percentiles: { cost: 0 } })
  expect(verdict.best).toEqual(verdict.score)

  const histograms = await run(
    Effect.gen(function* () {
      const api = yield* client
      return yield* api.challengeHistogramGet({ challengeId: hello.id, simVersion: SIM_VERSION })
    }),
  )
  expect(histograms.players).toBe(1)
  expect(histograms.cost.counts.reduce((sum, n) => sum + n, 0)).toBe(1)
  expect(histograms.cost.edges).toEqual(hello.edges.cost)
})

test('the server scores the Design it re-runs, not what the client says', async () => {
  // The starting box throttles; a replay of it fails however the client labels it.
  const verdict = await run(submit(hello, replayOf(hello, hello.start())))
  expect(verdict).toMatchObject({
    passed: false,
    missed: 'Too many errors.',
    best: null,
    percentiles: null,
  })
})

test('submissions the server cannot trust fail with ApiError', async () => {
  const failure = (effect: ReturnType<typeof submit>) =>
    run(Effect.flip(effect)).then((error) => ({ tag: error._tag, message: error.message }))

  expect(await failure(submit(hello, replayOf(hello, hello.start()), SIM_VERSION - 1))).toEqual({
    tag: 'ApiError',
    message: 'Update Quorum to submit this result.',
  })
  expect(await failure(submit(hello, 'QRP1:not-a-replay'))).toEqual({
    tag: 'ApiError',
    message: 'That is not a replay.',
  })
  const old = dailyDrill(new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10))
  expect(await failure(submit(old, replayOf(old, old.start())))).toEqual({
    tag: 'ApiError',
    message: 'That daily drill is closed.',
  })
  const missing = await run(
    Effect.flip(
      Effect.gen(function* () {
        const api = yield* client
        return yield* api.challengeHistogramGet({ challengeId: 'nope', simVersion: SIM_VERSION })
      }),
    ),
  )
  expect(missing).toMatchObject({ _tag: 'ApiError', message: 'There is no such Challenge.' })
})

test("today's daily drill takes a result", async () => {
  const today = dailyDrill(new Date().toISOString().slice(0, 10))
  const verdict = await run(submit(today, replayOf(today, today.start())))
  expect(typeof verdict.passed).toBe('boolean')
})
