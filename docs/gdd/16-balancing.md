# 16. Balancing

[Index](./README.md) · Previous: [Interface](./15-ui-ux.md) · Next: [Scope and roadmap](./17-scope-and-roadmap.md)

This document collects every formula and tunable constant, and describes how balance is checked.

**Source of truth.** Once a number is implemented, `apps/web/src/game/engine/catalog.ts` is the
source of truth, and this document records the target and the reason. When they disagree, the code
wins for the current build, and the difference goes in the [divergence log](#divergence-log) until one
side changes.

## Number ranges

Upload Labs players lose interest when numbers become meaningless
([Influences](./02-influences.md#why-players-quit)). Quorum keeps every number in a real range.

| Number    | Range at start | Range at the end of the first company | Hard limit                          |
| --------- | -------------- | ------------------------------------- | ----------------------------------- |
| Users     | 150            | 50 million                            | About 6 billion (online population) |
| Demand    | 3 rps          | 1 million rps                         | Users × R_user                      |
| Latency   | 30–500 ms      | 30–500 ms                             | —                                   |
| Cash      | $300           | Billions                              | —                                   |
| Valuation | —              | $1–50 billion                         | —                                   |

Formatting: SI suffixes only (k, M, B, T). No letter suffixes such as "aa".

## Constants

| Constant             | Symbol   | Value                           | Where used                                                       |
| -------------------- | -------- | ------------------------------- | ---------------------------------------------------------------- |
| Step length          | —        | 100 ms                          | [Simulation](./04-simulation.md#time)                            |
| Calendar rate        | —        | 1 sim s = 1 calendar min        | [Simulation](./04-simulation.md#time)                            |
| Requests per user    | `R_user` | 0.02 rps                        | [Demand](./04-simulation.md#demand)                              |
| Diurnal amplitude    | `A`      | 0.45                            | [Demand](./04-simulation.md#demand)                              |
| Copy price growth    | —        | 1.25×                           | [Prices](#prices)                                                |
| Resize price growth  | —        | 2× per size step                | [Vertical and horizontal](#vertical-and-horizontal)              |
| Sell refund          | —        | 50%                             | [Components](./05-components.md#rules-for-all-components)        |
| Insight yield        | —        | 0.03 per sample                 | [Observability](./12-observability.md#earning-insight)           |
| Default sample rate  | —        | 10%                             | [Observability](./12-observability.md#earning-insight)           |
| Growth rate          | `g`      | See [User growth](#user-growth) |                                                                  |
| Churn rate           | `c`      | 0.004/s                         | [User growth](#user-growth)                                      |
| Coordination penalty | `k`      | 0.08                            | [Team](./08-team-and-velocity.md#coordination)                   |
| Link timeout         | —        | 30 s                            | [Simulation](./04-simulation.md#capacity-utilization-and-queues) |
| Drawer size          | —        | 60 s of revenue                 | [Economy](./09-economy.md#the-payments-drawer)                   |
| Offline cap          | —        | 8 h                             | [Simulation](./04-simulation.md#offline-progress)                |
| Offline churn cap    | —        | 5%                              | [Simulation](./04-simulation.md#offline-progress)                |

## Prices

```text
place_price(component, k) = base_price(component) × 1.25^(k − 1)      k = copy number
```

The 1.25 growth on copies is a soft push toward bigger instances and toward better design over more
copies. It is stylized: real clouds charge the same for the hundredth VM as the first. The
justification is operational overhead, and the game says so on the card.

Era price scaling: base prices and value per request both rise by ×1.0 in the Garage Era, ×1.0 in
Pre-seed, ×1.2 in Seed, ×1.5 in Series A, ×2.0 in Series B, ×2.5 in Series C, and ×3.0 later.
Because both rise together, ratios stay meaningful while totals grow.

## Vertical and horizontal

A size step doubles vCPU, RAM, and Burn. Price is linear in resources, as in real clouds. So the
choice between one big box and many small ones is not about price per vCPU. It is about:

| One big box                                                                                     | Many small boxes                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| No load balancer, no network hop                                                                | Redundancy: one failure loses a fraction                   |
| One runtime base memory instead of many                                                         | Fine-grained scaling: add 10%, not 100%                    |
| Runtimes that cannot use more cores waste the size (single-process Node.js, one Python process) | Needs a load balancer and more connections to the database |
| Resize means a restart                                                                          | Rolling changes                                            |
| Hard cap at `metal` (96 vCPU)                                                                   | Each copy costs 25% more to place                          |

## User growth

```text
growth = g(Era) × Users × (1 − Users / Market) × h(A)
```

| Era      | `g` (per sim second) | Time to the milestone at Apdex 1.0 with no capacity limit |
| -------- | -------------------- | --------------------------------------------------------- |
| Garage   | 0.0040               | 12 minutes, from 150 to 1,000                             |
| Pre-seed | 0.0022               | 21 minutes, from 1,000 to 5,000                           |
| Seed     | 0.0016               | 28 minutes, from 5,000 to 25,000                          |
| Series A | 0.0009               | 56 minutes, from 25,000 to 150,000                        |
| Series B | 0.0007               | 72 minutes, from 150,000 to 1 million                     |
| Series C | 0.0005               | 1 hour 56 minutes, from 1 million to 10 million           |
| Pre-IPO  | 0.0004               | 1 hour 53 minutes, from 10 million to 50 million          |
| Public   | 0.0002               | —                                                         |

The times solve the logistic equation from the Era's start to its milestone with the market sizes in
[Progression](./10-progression.md#eras): `t = ln(((M − U₀) / U₀) × (U₁ / (M − U₁))) / g`. The sum is
about 7 hours.

These are lower bounds. Real players are slower because capacity, Cash, and research limit them.
The pacing targets in [Progression](./10-progression.md#pacing-targets-for-the-first-company) are
about 1.5× these values.

## Pacing model

The pacing model is a set of scripted players that run against the real simulation in tests. They
exist because a greedy bot found the current build's IPO time (about 44 minutes) far below the target.

| Bot      | Strategy                                                                      | Purpose                                                          |
| -------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Greedy   | Always upgrades the bottleneck Node; researches the cheapest item             | Lower bound on time. Must not beat the targets by more than 40%. |
| Balanced | Holds utilization at 70%, researches by a fixed priority list, ships features | The expected player. Must land inside the targets.               |
| Stubborn | Never changes the starting Stack                                              | Must still reach IPO, within 1.6× the target time.               |
| Polyglot | Uses the best Stack for each service, by a lookup table                       | Must not beat Balanced by more than 30%.                         |
| Idle     | Logs in every 2 hours, spends everything, leaves                              | Must reach Series A within 24 hours of real time.                |

A balance change passes when all five bots meet their limits on 20 seeds.

## The dominance test

Pillar 2 says no option strictly dominates another. The test checks it.

For every option set (languages, variants within a language, frameworks within a language, cache
strategies, replication modes, deploy strategies, pricing models, Component variants):

1. Build a library of reference designs: each Era's typical design, plus the 32 Challenge setups.
2. For each reference design, apply each option and run 10 sim minutes.
3. Score each option on revenue per Burn, p99, errors, and Dev Hours.
4. **Pass** if every option is on the Pareto front for at least one reference design.
5. **Fail** if any option is dominated on every design. The fix is a design change to the option, not
   a number tweak that only passes the test.

The test runs in CI on every change to `catalog.ts`.

## Runtime balance targets

| Check                                                                       | Target                                     |
| --------------------------------------------------------------------------- | ------------------------------------------ |
| PHP-FPM with OPcache against Node.js cluster on `read` with a fast database | Node.js 1.5× to 2.5× throughput per dollar |
| Same, with a database at 100 ms latency                                     | Node.js 3× to 6× (workers held by waits)   |
| Node.js single process with 5% `login`, p99 rise                            | +40 to +120 ms                             |
| Java cold against warm throughput                                           | 30% at start, 100% after 30 s              |
| Rust against Go, server cost for the same load                              | 25% to 40% lower                           |
| Rust against Go, Dev Hours for the same feature set                         | 50% to 70% higher                          |
| Elixir against Node.js, `rt` connections per GB                             | 3× to 5×                                   |
| Rails against Go, Dev Hours for the same feature set                        | 35% to 50% lower                           |

## Prestige curve

```text
legacy = floor( sqrt( payout / $1,000,000 ) )
```

| Company | Expected payout | Legacy  | Cumulative  | Shop progress    |
| ------- | --------------- | ------- | ----------- | ---------------- |
| 1       | $300 million    | 17      | 17          | First tier perks |
| 2       | $1.5 billion    | 38      | 55          | Second tier      |
| 3       | $5 billion      | 70      | 125         | Ventures open    |
| 5       | $20 billion     | 141     | about 450   | Most perks       |
| 8–12    | $50–200 billion | 220–450 | about 2,000 | Complete shop    |

## Divergence log

Known differences between this design and the current build (`49d571b`).

| Topic               | Current build                                                  | This design                                                                |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Upgrade scaling     | Level ×1.75 capacity, ×1.55 Burn, price ×2.3 per level         | Size steps double resources and Burn (linear)                              |
| Language model      | Flat multipliers on throughput, latency, Burn, and value       | Concurrency models, memory limits, and runtime behaviors                   |
| Revenue and latency | Full revenue up to 220 ms mean latency, falling to a 25% floor | Apdex per kind                                                             |
| Growth              | Grows while 90% of requests are served well                    | Logistic growth with Apdex target per Era                                  |
| Request kinds       | 8 user kinds                                                   | 16 user kinds                                                              |
| Eras                | Garage to IPO, 6 stages                                        | Garage to Public, 8 Eras                                                   |
| Team, Dev Hours     | Not present                                                    | Present                                                                    |
| AI prompts          | Only Python App Servers serve them                             | Any App Server forwards `ai` to a GPU Node or LLM API; Python gets a bonus |

[Scope and roadmap](./17-scope-and-roadmap.md) orders the work to close these gaps.
