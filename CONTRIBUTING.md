# Contributing

Thank you for your interest in Quorum.

## Open an issue before you start

If you have an idea for a feature, a mechanic, or a change to the design, open an issue first and
wait for a reply before you write code.

The game does not have a fixed direction yet. I may reject an idea, even a good one, if it does not
fit where the game goes next. I do not want you to spend time on a pull request that I cannot
accept.

Small fixes, such as typos and clear bugs, do not need an issue first.

## Stack

Quorum is built on Cafe: **C**loudflare for the runtime, **A**lchemy for infrastructure,
**F**oldkit for the UI, and **E**ffect for the server and the shared contract.

| Path                  | Contents                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| `apps/web`            | The Foldkit game client, the website Worker, and static assets.              |
| `apps/backend`        | Effect RPC handlers and the API Worker entry.                                |
| `packages/simulation` | The pure Simulation. The browser plays it; the API Worker replays it.        |
| `packages/rpc`        | The wire contract: RPC groups, schemas, declared errors, and the API prefix. |
| `examples/reference`  | A Foldkit Query to RPC example, deployed only to the `reference` stage.      |

Alchemy composes the website and the API into one deployment. A service binding routes
same-origin API requests to the backend.

## Get started

Requirements: Node.js 24.11 or newer and pnpm 12.

```sh
pnpm install
pnpm dev            # the default stack
pnpm dev:reference  # the reference example
```

## Verify a change

```sh
pnpm check      # Vite+ formatting and lint
pnpm typecheck
pnpm test
pnpm build
```

Pre-commit runs `pnpm check`. Pre-push runs the typecheck and the tests.

## Deploy

CI deploys every push to `main` to the `prod` stage at <https://quorum.elianiva.com>, after the
checks pass. The job reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from the
repository's Actions secrets. Alchemy keeps the stack state in a Cloudflare state-store Worker in
the same account, so CI needs no other credentials.

`pnpm deploy` runs the same deployment from your machine. Only the `prod` stage attaches the
custom domain; other stages use their `workers.dev` URL.

The API Worker has no `workers.dev` URL. The website reaches it through its service binding, so
the RPC endpoint has one public origin. Remove `workersDev: false` in `alchemy.run.ts` when the
API needs its own URL or custom domain.

## Art

The social card `apps/web/public/og.png` is a screenshot of `apps/web/art/og.html`, and the README
hero `docs/images/hero.png` is a screenshot of `apps/web/art/hero.html`. Each file says how to
render it again. The other images in `docs/images` are screenshots of the running game.

## Design notes

- [Game design document](docs/gdd/README.md) — the full design, from simulation to balancing.
- [CONTEXT.md](CONTEXT.md) — the game vocabulary that code and UI copy use.
- [docs/adr](docs/adr) — the decisions behind the design and the code.
- [Architecture](docs/architecture.md) — app and RPC boundaries.
- [Tooling](docs/tooling.md) — Vite+, Turbo, and Oxfmt/Oxlint responsibilities.
- [Guardrails](docs/guardrails.md) — the rules and the checks that enforce them.
- [Adding a feature](docs/extending.md) — the path from contract to handler to UI.
- The reference example is intentionally separate from the game. Copy patterns from it; do not
  move its demo behavior into the default app.
