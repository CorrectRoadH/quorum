# Architect

A learning game about system design, built on Cafe: Cloudflare · Alchemy · Foldkit · Effect.

A player assembles an architecture from a fixed catalog of components, runs it for one
simulated month, and is scored on what that architecture did. The diagram is the input, the
ledger is the truth, and every choice costs something.

The design is settled. Implementation has not started, so the apps still ship the starter's
demo surface.

## How a run plays

1. A scenario hands you a brief, a small starting capital, and a demand curve.
2. You place components on the canvas and connect them. Placing a component spends capital, and
   every component burns money for as long as it exists.
3. You run the month. Demand grows, income follows the requests your design serves, and the
   metrics table and the graphs show latency, throughput, errors, and money as they move.
4. You adapt while the clock runs: add capacity, move a cache, fix the bottleneck, drop what
   you cannot pay for.
5. The month ends in a report card: Reliability, Performance, Simplicity, and Money.

A session runs 15 to 25 minutes. Roles, meaning the Edge Lead, the Data Lead, and the Platform
Lead, are hats you wear to see a different objective over the same design.

The cluster behaves like Kubernetes: pods, deployments, rollout, probes, restarts, services,
DNS, and endpoints. The game models what the cluster does not: demand, latency under load,
capacity, failures, cost, and income.

Read [Game design](docs/game-design.md) for the overview, [CONTEXT.md](CONTEXT.md) for the
vocabulary, and [docs/adr](docs/adr) for the decisions behind both.

## The stack

Cafe is the stack. Cloudflare for the runtime, Alchemy for infrastructure and deployment,
Foldkit for the UI, and Effect for the server and the shared contract.

The website and the API are separate apps. Alchemy composes them into one deployment, with a
service binding routing same-origin API requests to the backend.

## Apps and packages

- `apps/web` — Foldkit application, website Worker, and static assets.
- `apps/backend` — Effect RPC handlers and the API Worker entry.
- `packages/rpc` — the wire contract: RPC groups, schemas, declared errors, and the API path prefix.
- `examples/reference` — a complete Foldkit Query to RPC example, deployed only to the `reference` stage.

## Get started

Requirements: Node.js 24.11 or newer and pnpm 12.

```sh
pnpm install
pnpm dev
```

The default Alchemy stack creates the website and API Workers. The reference application uses the same root Alchemy entrypoint with a separate stage:

```sh
pnpm dev:reference
```

## Verify a change

```sh
pnpm check
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` formats and lints through Vite+; the other scripts run through Turbo. Pre-commit runs `pnpm check`, and pre-push runs the typecheck and the tests.

## Deploy

`pnpm deploy` deploys the default stack to Cloudflare with the `prod` stage. Configure your Alchemy credentials and stack state before the first deploy.

The API Worker has no `workers.dev` URL. The website reaches it through its service binding, so the RPC endpoint has one public origin. Remove `workersDev: false` in `alchemy.run.ts` when the API needs its own URL or custom domain.

## Design notes

- Read [Architecture](docs/architecture.md) for app and RPC boundaries.
- Read [Tooling](docs/tooling.md) for Vite+, Turbo, and Oxfmt/Oxlint responsibilities.
- Read [Guardrails](docs/guardrails.md) for the rules and the checks that enforce them.
- Read [Adding a feature](docs/extending.md) for the path from contract to handler to UI.
- The reference example is intentionally kept separate from the starter UI. Copy patterns from it; do not move its demo behavior into the default app by default.
