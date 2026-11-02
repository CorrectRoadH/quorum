# The Simulation is a workspace package

The Simulation lives in `packages/simulation` (`@quorum/simulation`), not inside the website.
The browser plays it, and from M8 the API Worker replays Challenge submissions with it to compute
the authoritative score ([ADR 0002](./0002-endless-incremental-game-in-the-browser.md),
[Challenges](../gdd/14-challenges.md#rules)). Two runtimes execute the same code, so it is a real
shared boundary, and [GDD 17](../gdd/17-scope-and-roadmap.md#scope-rules) already names it: the
Simulation stays a pure module that runs in tests, offline progress, the Tradeoff preview, and
server verification. CONTEXT.md defines the word, so the package is named for it.

Considered options:

- Keep it in `apps/web/src/game/engine` and let the backend import it by relative path or through
  `@quorum/web`. Rejected: an app-to-app dependency breaks the dependency direction in
  [Architecture](../architecture.md), and it pulls the website's Vite and DOM configuration into
  the Worker.
- Put it in `packages/rpc`. Rejected: that package is the wire contract only.
- Copy it into the backend. Rejected: a score is only authoritative if both sides run one source.

## Consequences

- `apps/web` and, from M8, `apps/backend` depend on `@quorum/simulation`. `packages/rpc` does not:
  a Challenge submission crosses the wire as an encoded string that the backend decodes with the
  Simulation's schemas.
- The Simulation imports only `effect` and its own files. Its tsconfig has no DOM library, and
  `src/purity.test.ts` rejects any other import, host globals such as `Date` and `window`, and the
  math that engines may compute differently (`Math.cos`, `Math.exp`, `Math.pow`, `**`, and the
  rest), as [GDD 04](../gdd/04-simulation.md#determinism-and-randomness) requires.
- `src/golden.test.ts` replays one fixed Company for 10,000 Steps and checks the hash of the Game.
  A change that moves the hash bumps `SIM_VERSION`, so results from different versions are never
  compared.
- The UI stays in `apps/web`. The Simulation exports data and pure functions; it never renders,
  stores, or schedules anything.
