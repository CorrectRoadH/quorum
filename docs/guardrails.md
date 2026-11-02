# Guardrails

These are the rules this template enforces, and how each one is checked. Change a
rule and its check in the same commit.

| Concern           | Rule                                                                                                                                                        | Check                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Host isolation    | `apps/backend/src/contexts` must not import Alchemy or Cloudflare adapters, and must not name Cloudflare global types.                                      | `apps/backend/src/contexts/boundary.test.ts`                                                        |
| Simulation purity | `packages/simulation` imports only `effect` and its own files, and names no browser or host globals.                                                        | `packages/simulation/src/purity.test.ts`; its tsconfig has no DOM library                           |
| Determinism       | The Simulation uses only exact math (no `Math.cos`, `Math.exp`, `Math.pow`, `**`, and the like), and one fixed Company replays to one hash in every engine. | `purity.test.ts` and `golden.test.ts`; `pnpm test:golden` in Chromium, Firefox, WebKit, and workerd |
| Wire contract     | Only `packages/rpc` declares RPC groups, schemas, declared errors, and path prefixes.                                                                       | Dependency direction in `docs/architecture.md`                                                      |
| Unstable APIs     | Unstable Effect APIs are allowed only in the files named by a tsconfig override.                                                                            | `effect-tsgo` diagnostics during `pnpm typecheck`                                                   |
| Routing           | The API prefix has one definition.                                                                                                                          | `packages/rpc/src/paths.ts`, imported by `alchemy.run.ts`                                           |
| API surface       | The API Worker has no public URL.                                                                                                                           | `workersDev: false` in `alchemy.run.ts`                                                             |
| Telemetry         | Observability configuration lives on the host resources, never in contexts or a shared runtime.                                                             | Review of `alchemy.run.ts`                                                                          |
| Dependencies      | Effect has one version, and there is no second formatter or linter beside Vite+.                                                                            | `pnpm-workspace.yaml` overrides and review                                                          |

## Unstable API allowances

`effect-tsgo` fails typecheck when code calls an Effect API marked
`@stability unstable`. A tsconfig override grants the exception per file. The
backend allows `effect/rpc` and `effect/http` in its Worker entry and Worker test
only:

```json
{
  "include": ["src/worker.ts", "src/worker.test.ts"],
  "options": { "allowedUnstableApis": ["effect/rpc", "effect/http"] }
}
```

Add an allowance only when the unstable call is the point of the file, and keep
the pattern narrow. Contexts and UI code have no allowance, so unstable Effect
APIs cannot reach them by accident. `apps/web` allows `effect/rpc` in
`src/platform/**` only, where its RPC client lives, as `examples/reference` does.

If the compiler patch does not apply, typecheck falls back to stock TypeScript
and these diagnostics are skipped. Check that `effect-tsgo patch` ran during
install before you trust a green typecheck.

## Review checklist

Before you call a change done:

- Does the change extend the wire contract instead of starting a second one?
- Does every handler stay free of bindings and platform types?
- Does each new endpoint have a test that crosses the RPC path?
- Did you edit an allowlist, and is the new entry as narrow as the code needs?
- Do failures use `ApiError` with `Effect.fail` instead of a thrown value?
- Do `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass?
