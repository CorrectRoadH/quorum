# Quorum

An incremental systems game for software engineers, built on Cafe: Cloudflare · Alchemy ·
Foldkit · Effect.

You grow a startup from one virtual machine in a garage to a public company. Users send
requests. You wire Components on a board, choose the language, runtime, and framework each
server runs, and fix one bottleneck after another. Every mechanic models real behavior: PHP-FPM
workers wait on the database, a Node.js event loop stalls on bcrypt, a JVM is slow until it
warms up, and an average hides the p99.

## How a company plays

1. Users send requests. Served requests earn Cash, and sampled traffic earns Insight.
2. You place and connect Components, pick Stacks, and spend Insight on research.
3. Each fix moves the bottleneck. Users grow while the design keeps them satisfied.
4. Funding rounds bring new request kinds that break the design in new ways.
5. The company ends in an Exit. Legacy carries into the next company, with new rules.

Read the [game design document](docs/gdd/README.md) for the full design,
[CONTEXT.md](CONTEXT.md) for the vocabulary, and [docs/adr](docs/adr) for the decisions behind
both.

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
