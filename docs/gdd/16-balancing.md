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

| Number    | Range at start | Range at the end of the first company | Hard limit                            |
| --------- | -------------- | ------------------------------------- | ------------------------------------- |
| Users     | 150            | 50 million                            | About 6 billion (online population)   |
| Demand    | 3 rps          | 1 million rps                         | Users × R_user                        |
| Latency   | 30–500 ms      | 30–500 ms                             | —                                     |
| Cash      | $300           | Trillions of game dollars             | —                                     |
| Valuation | —              | About $1 billion at the IPO           | About $100 billion at 6 billion users |

Cash, revenue, and Burn are game dollars. Valuation, payout, and Legacy use real dollars, converted
by the [valuation scale](#valuation-scale).

Formatting: SI suffixes only (k, M, B, T). No letter suffixes such as "aa".

## Constants

| Constant              | Symbol   | Value                           | Where used                                                       |
| --------------------- | -------- | ------------------------------- | ---------------------------------------------------------------- |
| Step length           | —        | 100 ms                          | [Simulation](./04-simulation.md#time)                            |
| Calendar rate         | —        | 1 sim s = 1 calendar min        | [Simulation](./04-simulation.md#time)                            |
| Requests per user     | `R_user` | 0.02 rps                        | [Demand](./04-simulation.md#demand)                              |
| Diurnal amplitude     | `A`      | 0.45                            | [Demand](./04-simulation.md#demand)                              |
| Copy price growth     | —        | 1.25×                           | [Prices](#prices)                                                |
| Resize price growth   | —        | 2× per size step                | [Vertical and horizontal](#vertical-and-horizontal)              |
| Sell refund           | —        | 50%                             | [Components](./05-components.md#rules-for-all-components)        |
| Insight yield         | —        | 0.5 per sample                  | [Observability](./12-observability.md#earning-insight)           |
| Default sample rate   | —        | 10%                             | [Observability](./12-observability.md#earning-insight)           |
| Growth rate           | `g`      | See [User growth](#user-growth) |                                                                  |
| Churn rate            | `c`      | 0.004/s                         | [User growth](#user-growth)                                      |
| Declined-round growth | —        | 0.7 × `g`                       | [Funding](./09-economy.md#funding)                               |
| Valuation scale       | —        | 7.5 × 10⁻⁵                      | [Valuation scale](#valuation-scale)                              |
| Coordination penalty  | `k`      | 0.08                            | [Team](./08-team-and-velocity.md#coordination)                   |
| Link timeout          | —        | 30 s                            | [Simulation](./04-simulation.md#capacity-utilization-and-queues) |
| Drawer size           | —        | 60 s of revenue                 | [Economy](./09-economy.md#the-payments-drawer)                   |
| Offline cap           | —        | 8 h                             | [Simulation](./04-simulation.md#offline-progress)                |
| Offline churn cap     | —        | 5%                              | [Simulation](./04-simulation.md#offline-progress)                |

## Prices

```text
place_price(component, k) = base_price(component) × 1.25^(k − 1)      k = copy number
```

The 1.25 growth on copies is a soft push toward bigger instances and toward better design over more
copies. It is stylized: real clouds charge the same for the hundredth VM as the first. The
justification is operational overhead, and the game says so on the card.

### Cost index

Request values stay fixed. Prices rise with the Era. Every price in this document is a Garage price,
and the Era's **cost index** multiplies it: placement, Burn, egress, and third-party fees. A separate
**salary index** multiplies engineer salary. Without them, a vCPU costs about 0.1% of the value of the
requests it serves, and Burn never matters.

| Era      | Cost index | Salary index | vCPU ($/s) | Engineer salary ($/s) |
| -------- | ---------- | ------------ | ---------- | --------------------- |
| Garage   | 1          | 1            | 0.05       | 0.40                  |
| Pre-seed | 1          | 1            | 0.05       | 0.40                  |
| Seed     | 25         | 12           | 1.25       | 4.80                  |
| Series A | 120        | 100          | 6.00       | 40                    |
| Series B | 120        | 400          | 6.00       | 160                   |
| Series C | 160        | 1,400        | 8.00       | 560                   |
| Pre-IPO  | 190        | 2,700        | 9.50       | 1,080                 |
| Public   | 190        | 2,700        | 9.50       | 1,080                 |

How the table was derived, for the reference design at each Era milestone:

- The Stack runs at speed 0.7 (Node.js class) at 60% utilization at peak, and edge and data compute
  equal the app compute.
- Infrastructure Burn is 12% of revenue at Seed, then 18%, 24%, and 30% at Series A, B, and C, and 35% from
  Pre-IPO. Payroll is 15% of revenue at Seed and 20% to 22% after that, for 8, 20, 50, 150, and 400
  engineers.
- Garage and Pre-seed keep index 1. At that size the minimum box, not the traffic, sets the cost.

Third-party fees, egress, and observability come on top. A Balanced design should land at a margin
of 25% to 45%, which puts the Rule of 40 checklist item within reach but not free. The pacing bots
check the margin at each Era milestone, and a change to any value or price fails the bots until the
table is derived again.

### Valuation scale

Game revenue is stylized: 50 million users at 0.02 rps send 1 million rps, and the average request
is worth about $2 to $6. A year of that revenue is about $1 trillion. A real company of that size
reports an ARR near $77 million. The valuation scale, 7.5 × 10⁻⁵, converts a year of game revenue into
that real ARR. At the IPO, a Rule of 40 multiple of 13 gives a Valuation of about $1 billion. At 6
billion users the Valuation is about $100 billion.

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

| Bot      | Strategy                                                                      | Purpose                                                                  |
| -------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Greedy   | Always upgrades the bottleneck Node; researches the cheapest item             | Lower bound on time. Must not beat the targets by more than 40%.         |
| Balanced | Holds utilization at 70%, researches by a fixed priority list, ships features | The expected player. Must land inside the targets.                       |
| Stubborn | Never changes the starting Stack                                              | Must still reach IPO, within 1.6× the target time.                       |
| Polyglot | Uses the best Stack for each service, by a lookup table                       | Must not beat Balanced by more than 30%.                                 |
| Idle     | Logs in every 2 hours, spends everything, leaves                              | Must reach Series A within 24 hours of real time.                        |
| Decliner | Plays like Balanced and declines every funding round                          | Legacy per hour must not beat Balanced by more than 15%.                 |
| Margin   | Plays like Balanced and records margin at each Era milestone                  | Margin must stay in 25% to 45% from Seed on ([Cost index](#cost-index)). |

A balance change passes when all seven bots meet their limits on 20 seeds.

## The dominance test

Pillar 2 says no option strictly dominates another. The test checks it.

For every option set (languages, variants within a language, frameworks within a language, cache
strategies, replication modes, deploy strategies, pricing models, Component variants):

1. Build a library of reference designs: each Era's typical design, the 32 Challenge setups, and every guided
   Sandbox.
2. For each reference design, apply each option and run 10 sim minutes.
3. Score each option on revenue per Burn, p99, errors, and Dev Hours.
4. **Pass** if every option beats every sibling option by at least 10% on at least one of the four
   scores on at least one reference design. Membership of the Pareto front is not enough: a cheaper
   option is always on the front.
5. **Fail** if any option has no such design. The fix is a design change to the option, not
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
| 1       | $500 million    | 22      | 22          | First tier perks |
| 2       | $1.5 billion    | 38      | 60          | Second tier      |
| 3       | $5 billion      | 70      | 130         | Ventures open    |
| 5       | $20 billion     | 141     | about 450   | Most perks       |
| 8–12    | $50–200 billion | 220–450 | about 2,000 | Complete shop    |

## Divergence log

Known differences between this design and the current build (`02f8200` plus the M1 work). The code
wins for the current build. Each row says why, and what would close it.

### Pacing: the live game plays faster than the design

The design's pacing values make the slice feel empty and slow in playtests. The live game keeps the
playtest knobs in `catalog/tuning.ts`. Tests and bots pass the design values as overrides
(`DESIGN_TUNING`, `DESIGN_COST_INDEX`, and the `tuning` parameter of `step`, `growthOf`,
`directIncidents`, `raise`, and `decline`).

| Topic                   | Live game                                     | This design                   | Checked at the design value by                  |
| ----------------------- | --------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| Growth rate             | `g` × 2 (`PLAYTEST_PACE`)                     | `g` × 1                       | `step.test.ts` “user growth at the design pace” |
| Incident gap            | 200 sim s mean (`INCIDENT_GAP`)               | 12 minutes (720 s)            | `pacing.ts` bots                                |
| First Pre-seed incident | 90 s after the raise (`FIRST_INCIDENT_AFTER`) | About 10 minutes (600 s)      | `pacing.ts` bots                                |
| Cost index              | Garage 1, Pre-seed 4, Seed 4                  | Garage 1, Pre-seed 1, Seed 25 | `pacing.ts` margin at Seed entry (`burnAt`)     |
| Company speeds          | 1×, 3×, 10×                                   | 1×; 2× and 4× from Legacy     | Not checked; bots step at 1 s                   |

At the design pace, the Balanced bot reaches Seed at about 34–35 sim minutes on seeds 1–3, below the
45–60 minute target. The M2 pacing bots assert that window; M1 records it. Its margin at Seed entry
at cost index 25 is 27% to 75%, with no payroll yet.

### Simulation and capacity model

| Topic               | Current build                                                                                                                                                                         | This design                                                           | Why                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Diurnal curve       | A cosine series with only `+ − × ÷` and `floor` (`solve.ts` `cosTurns`), within 1e-12 of `Math.cos`                                                                                   | A committed table of 1,440 values                                     | Same determinism with nothing to regenerate. Switch to a table if the M8 golden-hash test finds an engine difference.                                                                |
| Weekly cycle        | `weekly(t)` with `WEEKEND_FACTOR = 1`                                                                                                                                                 | Each Venture sets its weekend factor                                  | Ventures are M7.                                                                                                                                                                     |
| Latency coupling    | 6 passes, each blending 50%                                                                                                                                                           | 3 passes                                                              | Settles closer; costs solve time (see Performance).                                                                                                                                  |
| Event-loop tail     | `loop_block_ms` over every kind on the loop; the stall hits the slowest 2% of requests (`LOOP_TAIL_SHARE`), so it moves the p99 and not the p95                                       | A tail event with no stated share                                     | The share that puts `added_p99` on the p99. With 5% `login` the stall is 43.6 ms at ρ ≥ 0.5, inside +40 to +120.                                                                     |
| Event-loop fixes    | The libuv pool and an Auth Provider remove the `login` term only. The pool has no queue                                                                                               | The pool queues behind 4 hashes per process                           | Simplification. Revisit if login bursts become a mechanic.                                                                                                                           |
| Login CPU           | `login` is native: the runtime speed does not divide it                                                                                                                               | Every kind divides by speed                                           | bcrypt is C in every runtime.                                                                                                                                                        |
| Out-of-memory kills | Pooled runtimes (PHP-FPM, Gunicorn) and leaking processes die at 1.25× RAM. Self-sized runtimes (mod_php, Puma, Node.js) only swap                                                    | Every oversized pool swaps, then OOMs                                 | mod_php sizes its own pool, and the Garage box with Postgres on board passes 1.25× at about 600 users. Killing it would loop with nothing the player could set. The cure is the box. |
| Startup and warmup  | Startup: PHP 0 s (1 s for the VM), Puma 10 s, Gunicorn 5 s, Node.js 1 s. Cold speed: Puma 0.9, Gunicorn 0.95, Node.js 0.8; PHP starts at full speed and OPcache fills from 1× to 2.5× | “Instant”, “10 s”, “5 s”, “1 s”; light JIT warmup; OPcache cache fill | PHP’s warmup is its OPcache fill, so it is modeled there and not as a JIT share.                                                                                                     |
| Network limit       | `network` limit at size bandwidth over response payload (page 80, read 4, write 2, login 1 KB). Bandwidth: 0.5, 1, 2, 5, 10, 12.5, 25, 50, 100 Gbps                                   | `instance_bandwidth / bytes_per_request`, no bandwidth table          | The table is close to typical cloud “up to” values. It never binds before `media` and `upload` (M5).                                                                                 |
| Backlog             | Steady state: work over capacity is dropped at once                                                                                                                                   | A backlog grows at ρ ≥ 1 until timeouts or the backlog limit          | Keeps the solve stateless. `timeout` is an error cause already; link timeouts are M2.                                                                                                |
| Users floor         | Users never fall below 20                                                                                                                                                             | No floor                                                              | A Company never empties out completely.                                                                                                                                              |
| Market              | Era market × `marketFor(velocity)`                                                                                                                                                    | Era market × features                                                 | Velocity stands in for Features until M4.                                                                                                                                            |

### Sizes and prices

| Topic          | Current build                                                                                    | This design                                      | Why                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Instance sizes | 9 sizes, `nano` 0.5 to `metal` 96 vCPU; `metal` is a 1.5× step. Resize price is linear in vCPU   | 9 sizes ([Components](./05-components.md#stats)) | Doubling from 0.5 cannot give 11 sizes and end at 96. The Components table now says 9. |
| Flat sizes     | Load Balancer 6, Pooler 4, Cache 8, Analytics 8, Payments 6; each step doubles capacity and Burn | Same                                             | —                                                                                      |
| Sell refund    | 50% of what the last copy of that Component cost, at the copy markup                             | 50% of its placement cost                        | Matches.                                                                               |

### Observability, feedback, and tools

| Topic             | Current build                                                                                                                                                                                                     | This design                                         | Why                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Limits on cards   | The inspector shows CPU, RAM, workers, network, and connections gauges; the goal bar names the limit                                                                                                              | Limits show from `profiling` (Series A)             | Garage players needed them in playtests. Revisit with `profiling`.                       |
| Bottleneck search | Once per sim second, and again after every action                                                                                                                                                                 | Once per second                                     | Matches.                                                                                 |
| Performance       | 200-Node board, Node.js 26: about 24 ms per solve and 24 ms per Bottleneck search                                                                                                                                 | Under 2 ms per Step, under 3 ms per search          | Today’s boards have 5 to 20 Nodes (0.23 ms). The solver must get about 12× faster by M5. |
| Undo              | One action, for 30 s                                                                                                                                                                                              | 50 actions, with redo                               | M3.                                                                                      |
| Margin bot        | Asserts positive Garage and Pre-seed margins; records margin at Seed entry                                                                                                                                        | 25% to 45% from Seed on                             | Needs payroll (M4) and Seed content (M5).                                                |
| Runtime balance   | The three PHP, Node.js, and event-loop rows pass (1.87×, 4.85×, +43.6 ms). The Java, Rust, Elixir, and Rails rows are `test.todo`                                                                                 | Every row                                           | Those runtimes are M5; Dev Hours are M4.                                                 |
| Dominance test    | Garage and Pre-seed starts, a three-server design, and the six guided Sandboxes; 10 sim minutes at 5 s Steps; velocity stands in for Dev Hours; pools sized to RAM, 10 per vCPU, and a share of `max_connections` | Every Era’s design and the 32 Challenges; Dev Hours | Challenges are M8 and Dev Hours M4. 1 s and 2 s Steps give the same verdicts.            |
| Pacing bots       | Balanced only, 3 seeds                                                                                                                                                                                            | Seven bots, 20 seeds                                | Greedy, Stubborn, and Decliner arrive in M2.                                             |

[Scope and roadmap](./17-scope-and-roadmap.md) orders the work to close these gaps.
