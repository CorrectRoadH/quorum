# 17. Scope and roadmap

[Index](./README.md) · Previous: [Balancing](./16-balancing.md)

## What exists today

Build `49d571b` ("Rebuild Quorum as an idle systems game") implements a first version of the core
loop in the browser.

| Area       | In the build                                                                                 | Code                                   |
| ---------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| Board      | PixiJS board with Node cards, links, particles, pan and zoom                                 | `apps/web/src/game/board.ts`           |
| Simulation | Pure solver and time step; capacity, latency by utilization, revenue, user growth, incidents | `apps/web/src/game/engine/sim.ts`      |
| Catalog    | 15 Components, 8 user kinds, 8 languages, 11 frameworks, 34 research items, 6 funding stages | `apps/web/src/game/engine/catalog.ts`  |
| Save       | Effect Schema for the game state, saved to local storage                                     | `apps/web/src/game/engine/state.ts`    |
| UI         | HUD, dock, inspector, research panels                                                        | `apps/web/src/components/lab/`         |
| Tests      | Simulation tests                                                                             | `apps/web/src/game/engine/sim.test.ts` |

The [divergence log](./16-balancing.md#divergence-log) lists where the build and this design differ.

## Scope rules

- The simulation stays a pure module with no UI imports, so it can run in tests, in the offline
  simulation, in Challenge verification on the server, and in the Tradeoff card preview.
- The browser owns the company simulation ([ADR 0002](../adr/0002-endless-incremental-game-in-the-browser.md)).
  The API Worker owns only what needs a server: Challenge verification, histograms, and the daily
  drill. Those contracts go in `packages/rpc` and their handlers in `apps/backend`, as the repository
  guide requires.
- Content is data. A new Component, runtime, kind, incident, or research item is a catalog entry plus,
  at most, one new rule in the solver.

## Milestones

Each milestone is playable on its own and ends with the [pacing bots](./16-balancing.md#pacing-model)
and the [dominance test](./16-balancing.md#the-dominance-test) passing for the content it includes.

| #   | Milestone                    | Contents                                                                                                                                                           | Exit check                                                                            |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| M0  | Design and vocabulary        | These documents, [CONTEXT.md](../../CONTEXT.md), [ADR 0002](../adr/0002-endless-incremental-game-in-the-browser.md)                                                | Reviewed                                                                              |
| M1  | Real capacity model          | Instance types, concurrency models, memory limits, the latency coupling, Apdex revenue, logistic growth, connection limits, the bottleneck marker                  | Runtime balance targets pass ([Balancing](./16-balancing.md#runtime-balance-targets)) |
| M2  | Garage and Pre-seed complete | Kinds `page` to `login`; PHP, Ruby, Node.js, Python with their early variants; Cache, Pooler, Replica, DNS, Load Balancer; visibility steps 0–4; first incidents   | Balanced bot reaches Seed in 45–60 minutes                                            |
| M3  | Tradeoff cards and preview   | The six-axis card, the ghost-simulation preview, Settling and Stable, delta toasts, undo                                                                           | Playtest: players predict the effect of a Stack change                                |
| M4  | Team and Dev Hours           | Hiring, teams, backlog, features, tasks, migrations, tech debt, deploy frequency                                                                                   | Stubborn and Polyglot bots within limits                                              |
| M5  | Seed to Series B             | Kinds to `ai`; Go, Java, C#, Elixir, Rust; Queue, Worker, CDN, WAF, Search, Object Storage, zones, Autoscaler, Kubernetes, Warehouse, GPU; SLOs; incident director | Balanced bot reaches Series C in 4:30–5:30                                            |
| M6  | Series C to Public           | Regions as boards, quorum stores, distributed SQL, the IPO checklist, quarters                                                                                     | Balanced bot reaches IPO in 9–12 hours                                                |
| M7  | Exit and Legacy              | Exits, the Legacy shop, Playbooks, Ventures, Mutators, company history                                                                                             | Second company 3–6 hours                                                              |
| M8  | Challenges                   | Challenge mode, server verification, histograms, the daily drill                                                                                                   | Deterministic replays match on server and client                                      |
| M9  | Polish                       | Accessibility, sound, achievements, the in-game glossary                                                                                                           | Accessibility checklist passes                                                        |

## Out of scope

- Multiplayer and shared companies.
- Accounts beyond what Challenge histograms need.
- Paid currency of any kind.
- A simulated Kubernetes cluster ([ADR 0002](../adr/0002-endless-incremental-game-in-the-browser.md)).
- Mobile layouts below 1024 px wide. The board needs space.

## Open questions

| Question                                                          | Notes                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Does the Team system make the idle part too busy?                 | Test in M4. Fallback: auto-assign DH by policy, so the player only sets priorities.         |
| Is 100 ms the right step for 200 Nodes with the latency coupling? | Measure in M1 against the [performance budget](./04-simulation.md#performance-budget).      |
| Should regions be separate boards or one large board?             | Separate boards are easier to read; one board shows global flow. Prototype both in M6.      |
| How visible should runtime stereotypes be in copy?                | Copy names behaviors ("holds a worker while waiting"), never judgments ("slow language").   |
| Do Challenge histograms need an account?                          | Prefer an anonymous device ID with optional sign-in.                                        |
| How do we keep real outage references respectful?                 | Name the event and the year, link the public postmortem, and never mock the company.        |
| Should the Public Era have an end?                                | Current answer: no end, but the Step down Exit gives a natural stopping point with a score. |
