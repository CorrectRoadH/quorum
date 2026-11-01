# 17. Scope and roadmap

[Index](./README.md) · Previous: [Balancing](./16-balancing.md)

## What exists today

Build `02f8200` plus the M1 work implements the Garage and Pre-seed vertical slice in the browser. All
paths are under `apps/web/src/`.

| Area          | In the build                                                                                                                                                                                         | Code                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Board         | PixiJS board with Node cards, links, particles, the Bottleneck marker, pan and zoom                                                                                                                  | `game/board.ts`                                                                                     |
| Simulation    | Pure flow solve with the capacity model, latency coupling, connections, Apdex revenue, and the Bottleneck search; the 100 ms Step with logistic growth, OOM kills, and warmup; the incident director | `game/engine/solve.ts`, `capacity.ts`, `distribution.ts`, `step.ts`, `director.ts`                  |
| Actions       | Every player action, as a new Game or a refusal that says why                                                                                                                                        | `game/engine/actions.ts`                                                                            |
| Catalog       | 11 Components, 4 user kinds and 3 backend kinds, 4 languages, 6 runtime variants, 4 frameworks, 9 instance sizes in 4 families, 26 research items, 3 Eras (Seed is a stub), 6 incidents              | `game/engine/catalog/*.ts` (`catalog.ts` re-exports them)                                           |
| Save          | Effect Schema for the Game, saved to local storage. Every field added since the first release has a decoding default                                                                                 | `game/engine/state.ts`                                                                              |
| UI            | HUD, build dock, inspector, research panel, pager and postmortems, Settling and the delta toast, one-step Undo                                                                                       | `components/lab/`, `game/update.ts`, `game/feedback.ts`                                             |
| Sandbox       | Garage and Pre-seed Sandbox tracks (6 guided Sandboxes), the free Sandbox, and the Sandbox menu                                                                                                      | `game/engine/sandbox.ts`, `components/lab/sandbox.ts`                                               |
| Balance tools | Runtime balance targets, the dominance test, the Balanced pacing bot with margins, and a 200-Node benchmark                                                                                          | `game/engine/balance.test.ts`, `dominance.test.ts`, `pacing.ts`, `pacing.test.ts`, `solve.bench.ts` |
| Tests         | Solve, Step, actions, Sandboxes, old saves (a frozen save fixture), Undo, and the clock                                                                                                              | `game/engine/*.test.ts`, `game/engine/fixtures/`, `game/feedback.test.ts`, `game/update.test.ts`    |

The [divergence log](./16-balancing.md#divergence-log) lists where the build and this design differ.

## Scope rules

- The simulation stays a pure module with no UI imports, so it can run in tests, in the offline
  simulation, in Challenge verification on the server, and in the Tradeoff card preview.
- Sandboxes run only in the browser. They need no server, no account, and no histogram, so they ship
  with the milestone that adds their mechanics, not with Challenges in M8.
- The browser owns the company simulation ([ADR 0002](../adr/0002-endless-incremental-game-in-the-browser.md)).
  The API Worker owns only what needs a server: Challenge verification, histograms, and the daily
  drill. Those contracts go in `packages/rpc` and their handlers in `apps/backend`, as the repository
  guide requires.
- Content is data. A new Component, runtime, kind, incident, or research item is a catalog entry plus,
  at most, one new rule in the solver.

## Milestones

Each milestone is playable on its own and ends with the [pacing bots](./16-balancing.md#pacing-model)
and the [dominance test](./16-balancing.md#the-dominance-test) passing for the content it includes.

| #   | Milestone                    | Contents                                                                                                                                                                                                            | Exit check                                                                                                                                                 |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | Design and vocabulary        | These documents, [CONTEXT.md](../../CONTEXT.md), [ADR 0002](../adr/0002-endless-incremental-game-in-the-browser.md)                                                                                                 | Reviewed                                                                                                                                                   |
| M1  | Real capacity model          | Instance types, concurrency models, memory limits, the latency coupling, Apdex revenue, logistic growth, connection limits, the bottleneck marker                                                                   | Runtime balance targets pass ([Balancing](./16-balancing.md#runtime-balance-targets)). The margin bot passes ([Cost index](./16-balancing.md#cost-index)). |
| M2  | Garage and Pre-seed complete | Kinds `page` to `login`; PHP, Ruby, Node.js, Python with their early variants; Cache, Pooler, Replica, DNS, Load Balancer; visibility steps 0–4; first incidents; the Garage and Pre-seed Sandbox tracks            | Balanced bot reaches Seed in 45–60 minutes. Each guided Sandbox passes with its fix and fails with its wrong option.                                       |
| M3  | Tradeoff cards and preview   | The six-axis card, the ghost-simulation preview, Settling and Stable, delta toasts, undo; the free Sandbox                                                                                                          | Playtest: players predict the effect of a Stack change                                                                                                     |
| M4  | Team and Dev Hours           | Hiring, teams, backlog, features, tasks, migrations, tech debt, deploy frequency                                                                                                                                    | Stubborn and Polyglot bots within limits                                                                                                                   |
| M5  | Seed to Series B             | Kinds to `ai`; Go, Java, C#, Elixir, Rust; Queue, Worker, CDN, WAF, Search, Object Storage, zones, Autoscaler, Kubernetes, Warehouse, GPU; SLOs; incident director; the Seed, Series A, and Series B Sandbox tracks | Balanced bot reaches Series C in 4:30–5:30                                                                                                                 |
| M6  | Series C to Public           | Regions as boards, quorum stores, distributed SQL, the IPO checklist, quarters; the Series C Sandbox track                                                                                                          | Balanced bot reaches IPO in 9–12 hours                                                                                                                     |
| M7  | Exit and Legacy              | Exits, the Legacy shop, Playbooks, Ventures, Mutators, company history                                                                                                                                              | Second company 3–6 hours                                                                                                                                   |
| M8  | Challenges                   | Challenge mode, server verification, histograms, the daily drill                                                                                                                                                    | Golden-hash replays match in Chromium, Firefox, WebKit, and the API Worker runtime ([Determinism](./04-simulation.md#determinism-and-randomness))          |
| M9  | Polish                       | Accessibility, sound, achievements, the in-game glossary                                                                                                                                                            | Accessibility checklist passes                                                                                                                             |

**Vertical slice gate.** The catalog is large. No content for M5 or later is written until M2 is
playable and a playtest shows that players meet a new bottleneck every few minutes
([pillar 3](./01-vision.md#pillar-3-the-bottleneck-is-the-content)). If the slice fails that test,
fix the loop before adding Components.

## Out of scope

- Multiplayer and shared companies.
- Accounts beyond what Challenge histograms need.
- Paid currency of any kind.
- A simulated Kubernetes cluster ([ADR 0002](../adr/0002-endless-incremental-game-in-the-browser.md)).
- Mobile layouts below 1024 px wide. The board needs space.

## Open questions

| Question                                                          | Notes                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Does the Team system make the idle part too busy?                 | Test in M4. Fallback: auto-assign DH by policy, so the player only sets priorities.                                                                                                                                                                                                                                      |
| Is 100 ms the right step for 200 Nodes with the latency coupling? | Measured in M1 (`solve.bench.ts`, Node.js 26): one solve of a 200-Node board takes about 24 ms and the Bottleneck search about 24 ms, against budgets of 2 ms and 3 ms. Today's boards have 5 to 20 Nodes (the Pre-seed start solves in 0.23 ms), so the 100 ms Step stays. The solver needs about 12× before M5 boards. |
| Should regions be separate boards or one large board?             | Separate boards are easier to read; one board shows global flow. Prototype both in M6.                                                                                                                                                                                                                                   |
| How visible should runtime stereotypes be in copy?                | Copy names behaviors ("holds a worker while waiting"), never judgments ("slow language").                                                                                                                                                                                                                                |
| Do Challenge histograms need an account?                          | Prefer an anonymous device ID with optional sign-in.                                                                                                                                                                                                                                                                     |
| How do we keep real outage references respectful?                 | Name the event and the year, link the public postmortem, and never mock the company.                                                                                                                                                                                                                                     |
| Does the free Sandbox spoil discovery?                            | It unlocks everything from the start. Fallback: unlock each Component in the free Sandbox when the player meets it in a Company or a guided Sandbox.                                                                                                                                                                     |
| Should the Public Era have an end?                                | Current answer: no end, but the Step down Exit gives a natural stopping point with a score.                                                                                                                                                                                                                              |
