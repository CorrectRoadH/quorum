# Quorum: game design document

Quorum is an incremental systems game in the spirit of Upload Labs
and Factorio, built on real engineering behavior.

## The game in one paragraph

You are the first engineer of a startup. Users send requests. You wire Components on a board, pick
the runtime and framework that each server runs, and watch requests flow through your design as
particles. Served requests earn Cash. Sampled traffic earns Insight, which buys research. Each fix
moves the bottleneck somewhere else. Funding rounds bring new kinds of requests that break your
design in new ways. At the end of a company you Exit, earn Legacy, and found a new company with
different rules. Every number in the game comes from a real behavior: PHP-FPM workers run out of
memory, a Node.js event loop stalls on bcrypt, a JVM is slow until it warms up, and an average
latency hides the p99.

## Table of Contents

| #   | Document                                                    | Answers                                                                                   |
| --- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | [Vision and pillars](./01-vision.md)                        | What the game is, who it is for, and the rules every design decision follows.             |
| 2   | [Influences and research](./02-influences.md)               | Why players love Upload Labs, Factorio, and Opus Magnum, and why some players quit.       |
| 3   | [Game loops](./03-game-loops.md)                            | The six nested loops, from a two-second glance to a hundred-hour mastery goal.            |
| 4   | [Simulation](./04-simulation.md)                            | How requests, capacity, queues, latency, errors, and users are calculated.                |
| 5   | [Components](./05-components.md)                            | Every placeable Component, its real product, its stats, and its options.                  |
| 6   | [Runtimes and frameworks](./06-runtimes.md)                 | Languages, runtime variants, and frameworks as tradeoffs, not tiers.                      |
| 7   | [Data tier](./07-data-tier.md)                              | Databases, caches, replicas, quorums, consistency, and storage.                           |
| 8   | [Team and velocity](./08-team-and-velocity.md)              | Engineers, Dev Hours, features, tech debt, services, and Conway's law.                    |
| 9   | [Economy](./09-economy.md)                                  | Currencies, sources and sinks, the cloud bill, pricing models, and funding.               |
| 10  | [Progression](./10-progression.md)                          | Eras, the research tree, product features, and pacing targets.                            |
| 11  | [Incidents and reliability](./11-incidents.md)              | The incident catalog, the incident loop, SLOs, and error budgets.                         |
| 12  | [Observability and Insight](./12-observability.md)          | Fog of war for systems: what the player can see and how they earn the right to see more.  |
| 13  | [Exit and Legacy](./13-prestige.md)                         | The prestige layer: Exits, Legacy, Ventures, and Mutators.                                |
| 14  | [Sandbox, Challenges, and achievements](./14-challenges.md) | Guided and free Sandboxes, fixed puzzles with histograms, daily drills, and achievements. |
| 15  | [Interface and game feel](./15-ui-ux.md)                    | The board, Node cards, feedback, bulk actions, and accessibility.                         |
| 16  | [Balancing](./16-balancing.md)                              | Every formula, every tunable constant, and the pacing model.                              |
| 17  | [Scope and roadmap](./17-scope-and-roadmap.md)              | What ships first, what exists in code today, and open questions.                          |

## Reference documents

| Document                              | Use it for                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| [CONTEXT.md](../../CONTEXT.md)        | The game vocabulary. Code, UI copy, and these documents use these words.              |
| [Engineering glossary](./glossary.md) | Real engineering terms that the game teaches, each linked to its mechanic.            |
| [Reality check](./reality-check.md)   | Each real-world claim, the game rule built on it, the simplification, and its source. |
| [Decision records](../adr)            | The reasons behind load-bearing decisions.                                            |

## Conventions in these documents

- **Bold Capitalized** words, such as **Node**, **Era**, and **Insight**, are game terms defined in
  [CONTEXT.md](../../CONTEXT.md).
- Engineering terms, such as [event loop](./glossary.md#event-loop), link to the
  [engineering glossary](./glossary.md).
- Every number is a balance target unless the text says otherwise. The source of truth for numbers
  in code is `apps/web/src/game/engine/catalog.ts`. When this document and the catalog disagree,
  [Balancing](./16-balancing.md) records which one wins.
- "Real" marks a behavior taken from real systems. "Stylized" marks a behavior that the game
  simplifies or exaggerates for play. [Reality check](./reality-check.md) lists both.
