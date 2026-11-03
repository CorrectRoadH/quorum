# Architecture

## Runtime boundaries

`apps/web` and `apps/backend` are separate deployable applications. The browser sends requests to the website origin. The website Worker forwards `/api/*` requests to the API Worker through an Alchemy-managed service binding. Alchemy deploys both Workers in one stack.

```text
Browser / Foldkit
       │ same-origin /api/rpc
       ▼
Website Worker ── service binding ──► API Worker
                                           │
                                           ▼
                                      Effect RPC
                                           │
                                           ▼
                                      packages/rpc
```

The service binding is a deployment concern. Business handlers must not depend on Cloudflare types or bindings. The root `alchemy.run.ts` owns all resource declarations and selects the default website or reference example by Alchemy stage (`reference` selects the example). Each app exposes a plain `src/worker.ts` runtime entry module; these modules do not import Alchemy or declare infrastructure.

## Request routing

`packages/rpc/src/paths.ts` owns `API_PREFIX` and `RPC_PATH`. `alchemy.run.ts` derives the website's `runWorkerFirst` rule from `API_PREFIX`, so the path that the contract declares and the path that the deployment routes cannot drift apart.

The website Worker therefore receives only requests under that prefix, and forwards them to the API Worker through the service binding. Every other path is served from the static assets, including the client-side fallback for unmatched routes.

The API Worker sets `workersDev: false`. The website origin is its only public surface, so a caller cannot skip the website Worker by addressing the API directly.

## Telemetry

Observability is configured on the host resources in `alchemy.run.ts`, never in contexts. Both Workers enable logs and traces with full sampling. Lower both `headSamplingRate` values before real traffic, and keep the compatibility date at `2026-07-28` or later, which traces require.

To nest Effect spans in the same waterfall, provide `Cloudflare.Telemetry()` from Alchemy. That layer is a binding, so it needs the inline Worker form: the entry module must default-export `Cloudflare.Worker(...)` with an init effect. This template keeps `src/worker.ts` as a plain module, so Effect spans are not mirrored today. If you adopt the layer, omit `observability.traces` on that Worker: the binding contributes it, and an explicit value wins.

## Code ownership

- `apps/web/src/app` owns the Foldkit application. Remote data belongs in Foldkit Query submodels. Update handlers decide when to load or revalidate them.
- `apps/backend/src/contexts` is the home for server-side bounded contexts as product vocabulary is discovered. Do not pre-invent product domains in the scaffold.
- `packages/rpc` owns the public wire contract only: Effect RPC groups, request/response schemas, declared errors, and the API path prefix.
- `packages/simulation` owns the Simulation: the catalog, the Game schema, the solver, the Step, actions, and the Sandboxes. The browser plays it and the API Worker will replay Challenges with it ([ADR 0004](adr/0004-simulation-package.md)). It imports only `effect` and its own files, and uses only exact math, so every runtime computes the same Game.
- `packages/mcp-relay` is `quorum-mcp-relay`, the one package published to npm. Its CLI runs on the player's machine as an MCP server on stdio and as a WebSocket server on loopback, which the Quorum page connects to ([ADR 0007](adr/0007-agents-read-the-game-through-a-local-relay.md)). `src/tools.ts` and `src/protocol.ts` import nothing, so the web app imports them for the tool list and the wire messages.
- `examples/reference` shows a complete Query-to-RPC path in a separate website app. Run it with `pnpm dev:reference`, which uses the root Alchemy entrypoint with the `reference` stage; it is deliberately excluded from the default stack.

## Dependency direction

```text
apps/web ─────────► packages/rpc, packages/simulation
apps/backend ─────► packages/rpc, packages/simulation
examples/reference ► packages/rpc
apps/web ─────────► packages/mcp-relay (tools, protocol only)
packages/rpc ─────► effect
packages/simulation ► effect
packages/mcp-relay ► ws
```

The web app must not import backend implementation modules. The RPC package must not import either app or the Simulation. The Simulation must not import either app, `packages/rpc`, or any UI, browser, or Cloudflare module. The relay must not import either app, `packages/rpc`, or the Simulation. Share the wire contract, not internal backend models.

## Cloudflare scope

The stack provisions the website Worker, the API Worker, and one D1 database, `Results`, bound to the API Worker as `RESULTS`. Challenges need it: the API Worker re-runs each submitted replay and keeps every device's best per axis, and histograms and percentiles are SQL counts over those rows. KV cannot count, and a Durable Object per Challenge would need hand-written aggregation. The schema is in `apps/backend/migrations`, which Alchemy applies on deploy.

The Challenges context sees only the `ResultStore` service (`apps/backend/src/contexts/challenges/store.ts`). `apps/backend/src/platform/d1-result-store.ts` implements it with SQL against a small structural `SqlRunner`, which a `D1Database` satisfies; tests run the same SQL on `node:sqlite`. Add R2, Access, Durable Objects, or other Cloudflare services only when a product feature requires them.
