# Tooling

| Tool                       | Owns                                                                          |
| -------------------------- | ----------------------------------------------------------------------------- |
| pnpm                       | Workspace installation and package linking                                    |
| Turborepo                  | Cached build, typecheck, and test task graph                                  |
| Vite+ (`vp`)               | Root formatting/lint configuration and unified checks                         |
| Oxfmt                      | Formatting engine used by Vite+                                               |
| Oxlint                     | Lint engine used by Vite+                                                     |
| Vite                       | Web app bundler, integrated into Alchemy's website dev/deploy flow            |
| Alchemy                    | Local Cloudflare development and deployment through the root `alchemy.run.ts` |
| Vitest                     | Unit and integration tests                                                    |
| Playwright                 | Browsers for the cross-engine golden check (`pnpm test:golden`)               |
| `effect-tsgo`              | Effect-aware TypeScript compiler, patched in after install                    |
| `@effect/language-service` | Effect diagnostics, including per-file `allowedUnstableApis`                  |

Use `pnpm check` for the Vite+ checks. Use `pnpm typecheck`, `pnpm test`, and `pnpm build` for Turbo tasks. Do not add standalone Prettier or ESLint configurations alongside Vite+.

Dependencies are pinned to exact versions in workspace manifests and `pnpm-lock.yaml`. Keep Effect on one version across the workspace. Foldkit Query is experimental, so review its release notes and run the reference tests when upgrading Foldkit.

## TypeScript and unstable Effect APIs

`pnpm install` runs `prepare`, which installs the Git hooks and calls `effect-tsgo patch`. The patch replaces the platform `tsc` binary with an Effect-aware build, so `pnpm typecheck` also reports Effect diagnostics. If the patch does not apply, typecheck still runs on stock TypeScript, but the Effect rules are skipped.

Unstable Effect APIs fail typecheck unless a tsconfig override allows them for named files. Each override lives beside the code that needs it, for example in `apps/backend/tsconfig.json`. See [Guardrails](guardrails.md) for the rule and the current exceptions.

## Common commands

```sh
pnpm check
pnpm typecheck
pnpm test
pnpm build
pnpm test:golden
pnpm dev
pnpm dev:reference
```

`pnpm test` skips the multi-minute simulation checks (the dominance test, the Balanced bot through Series B, and the heaviest Sandboxes). Run `SLOW_TESTS=1 pnpm test` to include them; CI does.

`pnpm test:golden` replays the golden Company and every Challenge's reference solution in Chromium, Firefox, and WebKit (Vitest browser mode with Playwright) and in workerd, and compares the hashes with Node's. It is not part of `pnpm test` because it needs browser binaries: install them with `pnpm --filter @template/simulation exec playwright install chromium firefox webkit`, plus `playwright install-deps webkit` on Linux (`.agents/setup` does both in an orb).

`pnpm deploy` modifies Cloudflare infrastructure. It is not part of routine verification.
`pnpm dev:reference` uses the same root entrypoint with the `reference` stage; the default stage selects `apps/web`.
