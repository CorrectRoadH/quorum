# Repository guide

This repository is a pnpm monorepo for an Effect + Foldkit application deployed to Cloudflare with Alchemy.

## Package boundaries

- `apps/web` is the Foldkit website and its website Worker.
- `apps/backend` is the API Worker and owns server-side behavior.
- `packages/rpc` contains only the typed wire contract shared by the browser and API Worker.
- `packages/simulation` is the Simulation, played by the browser and replayed by the API Worker (ADR 0004). It imports only `effect` and its own files: no UI, browser, Node, or Cloudflare modules, and only exact math.
- `packages/ui` is the shared UI package (ADR 0010): design-system primitives, the Quorum theme, and the game views that the wiki embeds. Views take the data they show and the Messages they send, never an app's Model.
- `packages/mcp-relay` is the published `quorum-mcp-relay` CLI, a read-only MCP server that lets a terminal agent read the game open in the player's browser (ADR 0007). Its `tools` and `protocol` files are pure data that the web app imports; nothing in it can change the game.
- `examples/reference` is a maintained, separately runnable example. It is not part of the default deployment.
- Keep Alchemy resources and deployment composition in the root `alchemy.run.ts`. App-owned `src/worker.ts` files are plain Cloudflare Worker entry modules and must not import Alchemy or declare infrastructure.
- Do not add a domain package or product domain until the product vocabulary and boundaries are agreed.

## Working agreements

- Keep the browser from importing `apps/backend` or platform-specific modules.
- Keep game rules, the catalog, and the Game schema in `packages/simulation`; keep rendering, input, and storage in `apps/web`.
- Keep design tokens in `packages/ui/src/theme.css` and shared views in `packages/ui`; keep screens that exist only in the game in `apps/web`.
- Keep the agent tool names and wire protocol in `packages/mcp-relay`; keep their implementation over the Model in `apps/web/src/game/agent-tools.ts`. Agent tools only read.
- Keep RPC schemas and errors in `packages/rpc`; keep handlers and internal models in `apps/backend`.
- Keep unstable Effect APIs inside the tsconfig allowlist for their file. See `docs/guardrails.md` before you widen one.
- Use Foldkit Query for retained remote data. Loading and revalidation decisions belong in Foldkit update handlers.
- Add a workspace package only for a real reusable or independently owned boundary.
- Keep Cloudflare services out of the starter unless a concrete feature needs them.

## Commands

- `pnpm dev` runs the default Alchemy stack.
- `pnpm dev:reference` runs the reference stack.
- `pnpm check` runs Vite+ formatting, lint, and configured checks.
- `pnpm typecheck`, `pnpm test`, and `pnpm build` run through Turbo.
- `pnpm deploy` changes Cloudflare infrastructure. Do not run it without explicit approval.

## Type checking

- Use only `tsrs` for TypeScript diagnostics, and only `effect-tsrs` for Effect diagnostics. `pnpm typecheck` runs both.
- To check one package, run `pnpm exec tsrs --noEmit -p tsconfig.json && pnpm exec effect-tsrs diagnostics --strict --project tsconfig.json` in its directory.
- `vp lint` runs the Effect rules from the `effect-tsrs` Oxlint preset. The root `prepare` script runs `effect-tsrs patch --oxlint`, which replaces the tsgolint backend with `effect-tsrs`. If `vp lint` fails after an install that skipped scripts, run `pnpm exec effect-tsrs patch --oxlint`.
- Never run `tsc`, `tsgo`, `@typescript/native-preview`, the original `oxlint-tsgolint` binary, or `vp lint --type-check`. Do not add `typescript` or `@typescript/native-preview` as a dependency, and do not turn on `typeCheck` in `vite.config.ts`.
- Do not turn on a non-Effect type-aware Oxlint rule (such as `typescript/no-floating-promises`), because `effect-tsrs` sends those rules to tsgolint.

See `docs/architecture.md` and `docs/tooling.md` before changing workspace boundaries or tool ownership. `docs/guardrails.md` lists the rules this repository enforces and the check behind each one.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
