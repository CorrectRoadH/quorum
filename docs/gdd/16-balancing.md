# 16. Balancing

[Index](./README.md) · Previous: [Interface](./15-ui-ux.md) · Next: [Scope and roadmap](./17-scope-and-roadmap.md)

This document collects every formula and tunable constant, and describes how balance is checked.

**Source of truth.** Once a number is implemented, `packages/simulation/src/catalog.ts` is the
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
| Valuation scale       | —        | 1.5 × 10⁻⁴                      | [Valuation scale](#valuation-scale)                              |
| Coordination penalty  | `k`      | 0.08                            | [Team](./08-team-and-velocity.md#coordination)                   |
| Dev Hours per day     | —        | 8 per engineer, 6.4 founder     | [Team](./08-team-and-velocity.md#dev-hours)                      |
| Adoption time         | `τ`      | 7 calendar days                 | [Adoption](./08-team-and-velocity.md#adoption)                   |
| Lift spread           | `σ`      | 1.0                             | [Measured lift](./08-team-and-velocity.md#measured-lift)         |
| Upkeep ceiling        | —        | 0.4 × S / (S + 2,000), max 0.6  | [Upkeep](./08-team-and-velocity.md#upkeep)                       |
| Market gain cap       | —        | +100% of the Era market         | [Sizes](./08-team-and-velocity.md#sizes)                         |
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
is worth about $1 to $3. A year of that revenue is about $500 billion. A real company of that size
reports an ARR near $77 million. The valuation scale, 1.5 × 10⁻⁴, converts a year of game revenue into
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

Known differences between this design and the current build (`02f8200` plus the M1–M4 work). The code
wins for the current build. Each row says why, and what would close it.

### Pacing: the live game plays faster than the design

The design's pacing values make the slice feel empty and slow in playtests. The live game keeps the
playtest knobs in `catalog/tuning.ts`. Tests and bots pass the design values as overrides
(`DESIGN_TUNING`, `DESIGN_COST_INDEX`, and the `tuning` parameter of `step`, `growthOf`,
`directIncidents`, `raise`, and `decline`).

| Topic                   | Live game                                                                                                     | This design                                                                           | Checked at the design value by                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Growth rate             | `g` × 2 (`PLAYTEST_PACE`)                                                                                     | `g` × 1                                                                               | `step.test.ts` “user growth at the design pace”          |
| Incident gap            | 200 sim s mean (`INCIDENT_GAP`)                                                                               | 12 minutes (720 s)                                                                    | `pacing.ts` bots                                         |
| First Pre-seed incident | 90 s after the raise (`FIRST_INCIDENT_AFTER`)                                                                 | About 10 minutes (600 s)                                                              | `pacing.ts` bots                                         |
| Cost index              | Garage 1, Pre-seed 4, Seed 8, Series A 12, Series B 16, Series C 20, Pre-IPO and Public 24                    | Garage 1, Pre-seed 1, Seed 25, Series A 120                                           | `pacing.ts` margin at Seed and Series A entry (`burnAt`) |
| Company speeds          | 1×, 3×, 10×                                                                                                   | 1×; 2× and 4× from Legacy                                                             | Not checked; bots step at 1 s                            |
| Calendar pace           | Team durations ÷ 24 (`CALENDAR_PACE`): a hire takes 1 sim minute, ramp 7 sim minutes, deploys every 7.5 sim s | Same since `SIM_VERSION` 8: a Team calendar day is 60 sim s, and Dev Hours flow on it | `pacing.ts` bots, `team.test.ts`                         |
| Salary index            | Follows the cost index                                                                                        | Garage 1, Pre-seed 1, Seed 12 (`DESIGN_SALARY_INDEX`)                                 | `pacing.ts` margin at Seed entry (`burnAt`)              |

The live cost index rises from Seed, so prices keep up with income. With a flat index of 4, the
Balanced bot ran at a 93–98% margin from Seed on and held $327,000 Cash at 40 sim minutes. With
`SIM_VERSION` 9 (half the request values, the rising index), at the live pace on seeds 1 and 3, it
runs at 50–78% in Seed and 86–90% in Series A, holds $18,000–$128,000 at 40 minutes, and raises
Series A at 38–41 minutes instead of 36. An index of 16 at Seed stalled it in Seed. The bot keeps 4
engineers and builds no redundancy, so a player who hires and spreads zones runs closer to the
25–45% target.

At the design pace, on seeds 1–5, the Balanced bot reaches each milestone at:

| Milestone      | Measured (sim min) | Target ([10](./10-progression.md#pacing-targets)) |
| -------------- | ------------------ | ------------------------------------------------- |
| First research | 2.3                | 2:00                                              |
| First upgrade  | 7.8                | 0:30                                              |
| Database split | 7.8                | 5:00                                              |
| First Feature  | 1.4                | Not stated                                        |
| Pre-seed       | 10.6               | 15–20                                             |
| First hire     | 10.7               | Pre-seed                                          |
| Second server  | Never before Seed  | 8:00                                              |
| First incident | 16.3–20.6          | About 30                                          |
| Seed           | 27.1–29.3          | 45–60                                             |

These times are from `SIM_VERSION` 8, where the design pace runs the Team's calendar at the live
pace and Features have [real sizes](./08-team-and-velocity.md#sizes). The founder makes 6.4 DH per
sim minute, so the 8 DH Landing page ships in under 2 minutes, and the bot reaches Seed with 4
engineers and 6 Features live. Before, the first Feature shipped at 18 minutes and Seed came at
35–40.

Before `SIM_VERSION` 8, Greedy (bigger boxes, cheapest research) reached Seed at 31–33 minutes, Stubborn at 30–33, Polyglot
(switches to Node.js through a migration) at 37–40, and Decliner at 43–46. These were not
re-measured; the bounds the tests assert below still hold. Since M4, Stubborn beat
Balanced: Balanced's switch to PHP-FPM is now a migration, and Features build at half speed while
it runs, so Balanced ships its first Feature at 18 minutes and Stubborn ships two by 12. At the
design pace a hire took a calendar day (24 sim minutes), so the hire both bots signed at Pre-seed
barely joined before Seed. Now a hire takes one sim minute. This is recorded, not tuned. At the live pace the Balanced bot raises Pre-seed
at 6.3 minutes, ships its first Feature at 7.1, and reaches Seed at 17–21 with 3–4 engineers and
3–4 Features live. Seed time is bound by user growth, not by the Design: the Garage grows from 150 to
1,000 users in 12 minutes and Pre-seed from 1,000 to 5,000 in 21, both as this document specifies,
and the bot keeps Apdex high enough that growth runs at full rate. So no Design choice can stretch
the Garage and Pre-seed to 45–60 minutes. The tests assert what holds: Seed is reached on every seed,
Pre-seed within 20 minutes, Greedy no faster than 27 minutes, Stubborn within 1.6× Balanced, Polyglot
no faster than 0.7× Balanced, Decliner reaches Seed. Closing the gap is a design decision, not tuning: raise the Pre-seed and Seed thresholds, or
lower `g`. The live game is faster still (`PLAYTEST_PACE`). The margin at Pre-seed's end, at the
design cost and salary index, is 55% to 74% with one engineer.

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
| Backlog             | Steady state: work over capacity is dropped at once                                                                                                                                   | A backlog grows at ρ ≥ 1 until timeouts or the backlog limit          | Keeps the solve stateless. Link timeouts cap how long a caller waits and holds its slot.                                                                                             |
| Users floor         | Users never fall below 20                                                                                                                                                             | No floor                                                              | A Company never empties out completely.                                                                                                                                              |
| Market              | Era market × the shipped Features' market factors (`features.ts`)                                                                                                                     | Era market × features                                                 | Matches. `marketFor` is gone.                                                                                                                                                        |

### Sizes and prices

| Topic          | Current build                                                                                    | This design                                      | Why                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Instance sizes | 9 sizes, `nano` 0.5 to `metal` 96 vCPU; `metal` is a 1.5× step. Resize price is linear in vCPU   | 9 sizes ([Components](./05-components.md#stats)) | Doubling from 0.5 cannot give 11 sizes and end at 96. The Components table now says 9. |
| Flat sizes     | Load Balancer 6, Pooler 4, Cache 8, Analytics 8, Payments 6; each step doubles capacity and Burn | Same                                             | —                                                                                      |
| Sell refund    | 50% of what the last copy of that Component cost, at the copy markup                             | 50% of its placement cost                        | Matches.                                                                               |

### Observability, feedback, and tools

| Topic             | Current build                                                                                                                                                                                          | This design                                         | Why                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Limits on cards   | The inspector shows CPU, RAM, workers, network, and connections gauges; the goal bar names the limit                                                                                                   | Limits show from `profiling` (Series A)             | Garage players needed them in playtests. Revisit with `profiling`.                       |
| Bottleneck search | Once per sim second, and again after every action                                                                                                                                                      | Once per second                                     | Matches.                                                                                 |
| Performance       | 200-Node board, Node.js 26: about 24 ms per solve and 24 ms per Bottleneck search                                                                                                                      | Under 2 ms per Step, under 3 ms per search          | Today’s boards have 5 to 20 Nodes (0.23 ms). The solver must get about 12× faster by M5. |
| Undo              | 50 actions, with redo. Exact Cash for 30 s; after that, normal prices (see M3 mechanics)                                                                                                               | 50 actions, with redo                               | Matches.                                                                                 |
| Margin bot        | Asserts positive Garage and Pre-seed margins, payroll included; records margin at Seed entry                                                                                                           | 25% to 45% from Seed on                             | Needs Seed content (M5).                                                                 |
| Runtime balance   | The three PHP, Node.js, and event-loop rows pass (1.87×, 4.85×, +43.6 ms). The Java, Rust, Elixir, and Rails rows are `test.todo`                                                                      | Every row                                           | Those runtimes are M5; Dev Hours are M4.                                                 |
| Dominance test    | Garage and Pre-seed starts, a three-server design, and the six guided Sandboxes; 10 sim minutes at 5 s Steps; the Team on autopilot; pools sized to RAM, 10 per vCPU, and a share of `max_connections` | Every Era’s design and the 32 Challenges; Dev Hours | Challenges are M8. 1 s and 2 s Steps give the same verdicts.                             |
| Pacing bots       | Balanced on 5 seeds; Greedy, Stubborn, Decliner, and Polyglot on 3 seeds each. All keep the autopilot on; every bot but Greedy hires while payroll is under 25% of revenue, up to 4                    | Seven bots, 20 seeds                                | The rest need later Eras. 3 seeds keep the suite fast.                                   |

### M2 mechanics

| Topic                    | Current build                                                                                                                                                                           | This design                                         | Why                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Sinatra mark             | The Ruby mark in Sinatra red                                                                                                                                                            | —                                                   | simple-icons has no Sinatra logo.                                                                                         |
| Gzip                     | Page 80 KB and read 4 KB shrink to 30%; 1.1× CPU on those kinds; the user downlink is 20 Mbps. A page view gets about 19 ms faster                                                      | “About 22 ms faster”                                | The extra CPU gives back about 3 ms. The model's number stands.                                                           |
| Keep-alive               | Each internal call costs a 0.5 ms hop plus a 1 ms handshake until `keepalive`                                                                                                           | A handshake per call                                | Matches; the numbers are the build's choice.                                                                              |
| Load Balancer policies   | Weighted splits by capacity on paper at the start of the solve; least connections by live capacity; two choices is least connections with 10% split evenly and 1.5× LB capacity         | The four policies; consistent hashing               | Consistent hashing waits for sessions and cache affinity. Least connections and two choices need `lb-algorithms`.         |
| Health checks            | A failed or OOM-killed host keeps its share until `checkEvery` (10 s; 2 s and 30 s with `health-checks`) after it went down. A planned restart drains at once                           | Every dead host waits for a check                   | A planned restart is announced to the LB.                                                                                 |
| Deep checks              | With `health-checks`: a server whose database path is down or at utilization ≥ 1 is taken out, and stays out for the rest of that solve                                                 | Same, by design a full outage on a slow DB          | Without the stickiness the fixed point flaps.                                                                             |
| DNS TTL                  | Without `health-checks` a dead host keeps its share for ever; with it, it leaves `ttl` after it went down. The TTL control appears with `health-checks`                                 | Same                                                | Matches.                                                                                                                  |
| Cache                    | Hit ratio `sqrt(min(1, mem/hot)) × ttl × (1 − invalidation) × warm`; 200 KB hot per user; TTL 10 s, 60 s, 1 h; a new Cache starts at 60 s; old saves decode at 300 s, in the 60 s class | Same                                                | 60 s keeps the old 85% for a warm, fitting Cache. Swapping the engine empties the Cache.                                  |
| Replica lag              | `20 + 2 × writes/s` ms; stale share `min(0.15, lag/1000)`                                                                                                                               | Lag on the Ledger                                   | Reproduces the old stale share exactly.                                                                                   |
| Card p99                 | With `percentiles`, the latency row shows the Node's own p99 for its busiest kind                                                                                                       | p99 on cards                                        | A Node's whole-request p99 needs a per-Node percentile solve.                                                             |
| Alert rules              | Thresholds from three options each (errors 0.5/1/5%, p99 2/4/8× Apdex T, load 80/90/95%); the threshold control shows on an Ignored rule in the pager                                   | Player-set rules; queue and budget alerts           | Queue and budget alerts need Queues (M5) and SLOs (M5).                                                                   |
| Alert fatigue            | An alert that fires with no incident running is false. Five in a calendar day ignore the rule until its threshold changes, across days                                                  | Same                                                | Matches.                                                                                                                  |
| Sample rates             | Stored by value (1, 5, 10, 50, 100%). Old saves decode at 10%, whatever their index was                                                                                                 | Same rates                                          | Index 1 (10%) was the default; other old indexes would now mean another rate.                                             |
| First kind Insight       | 20 Insight the first time a kind succeeds over 50%. The Pre-seed's first Step pays 40: `write` and `login` together                                                                     | A bonus per first kind                              | The amount is the build's choice (plan D14).                                                                              |
| Incident severity        | Escalation once, at half the duration, when users were hurt over half the time: SEV steps up, the rest runs 1.5× longer, a spike grows 1.5×. Never in a Sandbox. Old saves decode SEV3  | Escalation                                          | Sandbox incidents are scripted. Spikes now roll 3× to 10× demand, so live spikes are harder than the old 3×.              |
| Incident weights         | A possible incident weighs at least 0.2                                                                                                                                                 | Every incident stays possible                       | Matches.                                                                                                                  |
| PHP-FPM process managers | Static keeps the pool resident. Dynamic keeps busy + 2 and makes 2% wait 20 ms; on demand keeps busy and makes 10% wait 50 ms. No research gate                                         | 50 ms spawn latency for dynamic and on demand       | At 50 ms on 2%, dynamic had on demand's p99 and was dominated. Passes the dominance test on pools twice the careful size. |
| Shared Box               | A third objective: night traffic at 1,400 users, Apdex above 0.9 with Burn at $0.11/s or less. Fastest pass about 5 minutes                                                             | 4–11 minutes per guided Sandbox                     | It was 3.7 minutes.                                                                                                       |
| Read Mostly replica      | A Read Replica passes the first objective and shows stale reads, then stalls: at 8,000 users stale reads alone pass 1% of requests, and a replica big enough costs $2.92/s              | Plan: the replica passes objectives 1–2             | The Cache is the fix this Sandbox teaches. Making the replica pass would mean not counting stale reads as errors.         |
| Event Loop Stall         | The fastest pass, Node.js cluster mode, takes exactly 240 sim s                                                                                                                         | 4–11 minutes                                        | On the lower bound.                                                                                                       |
| Playtest gate            | Not run                                                                                                                                                                                 | A playtest shows a new bottleneck every few minutes | A human check. It remains before any M5 content.                                                                          |

### M3 mechanics

| Topic              | Current build                                                                                                                                                                  | This design                                  | Why                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Undo after 30 s    | Cash settles at normal prices: a removed Node refunds like a sale, a returned Node costs its price, a resize refunds nothing. Redo applies the inverse                         | Full refund under 30 s; nothing said after   | Never gains Cash, and keeps undo useful (plan D17).                                                                                                                                                  |
| Undo and time      | Undo restores the Design and keeps credits, leaks, and incident outages on each Node                                                                                           | Undo every board action                      | Undo must not rewind time or cure an incident.                                                                                                                                                       |
| Stable             | Revenue and served within 1%, error share within 0.1 points, over 12 UI ticks; the delta shows anyway after 30 sim s. "Stable" shows for 8 ticks                               | Under 1% change over 3 seconds               | 12 ticks is about 3 real seconds at 1× (plan D18). The cap keeps an oscillating Design from waiting forever.                                                                                         |
| Preview            | Two 10 sim s ghost runs (before and after) at 1 s Steps, with no incidents and users held. Changed Nodes start up and warm; the card states the restart on its own             | A 10 sim s ghost with the option applied     | The raw ghost shows mostly the restart dip (plan D19). Revenue matches the settled delta within about 2%.                                                                                            |
| Preview cost       | Pre-seed board: about 30 ms for the first option on a Game, 13 ms for each other option (the unchanged ghost is cached), and nothing for a repeat. 200-Node board: about 2.5 s | Not stated                                   | Computed once on hover, in the update handler. The 200-Node cost is 20 solves of about 120 ms on the measuring machine, where the M1 build's solve also took about 120 ms; it falls with the solver. |
| Six axes           | 1–5 per axis for each runtime and framework; no option is at least as good as a same-language sibling on every axis                                                            | Axes named, no values                        | The values are the build's judgement from [Runtimes](./06-runtimes.md).                                                                                                                              |
| Card scope         | Radar for runtimes and frameworks; the instance family gets the preview and cost. Glossary terms are text with their entry on hover                                            | A radar for every option; glossary links     | Axes exist only for Stacks (plan D21); the in-game glossary is M9 (plan D22).                                                                                                                        |
| Seen cards         | Kept in the local-storage record `quorum.prefs.v1`, not in the Game                                                                                                            | Collapses after the first time               | The Game holds only Simulation state (plan D20).                                                                                                                                                     |
| Playtest exit (M3) | Not run                                                                                                                                                                        | Players predict the effect of a Stack change | A human check.                                                                                                                                                                                       |

### M4 mechanics

| Topic             | Current build                                                                                                                                                                                                                                                      | This design                             | Why                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Services          | One Service, the monolith. Old saves decode to a monolith with Eager loading and session state already fixed, so they play as before                                                                                                                               | Services, Ownership, splits             | Splits need more App Servers per Service and the Ownership rules; later work.                                                                                                                                                                      |
| Sandboxes         | No Team: no Dev Hours, no salaries, Stack changes swap at once, every fix in place                                                                                                                                                                                 | Not stated                              | A Sandbox teaches the system, not the Team.                                                                                                                                                                                                        |
| Autopilot         | On by default. Idle teams queue the next Feature in catalog order, refactor at 30% debt, and shift a built migration step                                                                                                                                          | Open question: auto-assign by policy    | The fallback from [Scope](./17-scope-and-roadmap.md#open-questions), so a player who ignores the Team still progresses.                                                                                                                            |
| Features          | Landing page, Signup flow, Pagination, Password login, Paid plans, Email digests. Password login gates `login`: no user sends it before. Email digests ships only its churn −10%; its `job` burst waits for Queues                                                 | The full Feature list                   | The rest need later Components.                                                                                                                                                                                                                    |
| Engineering tasks | Add index, Eager loading, Fix memory leak, Drop session state, Refactor, and the internal Fix migration bugs                                                                                                                                                       | The full task list                      | Idempotency keys, timeouts and retries, runbooks, health check endpoint, graceful shutdown, CPU off the loop, and load tests are not built.                                                                                                        |
| Eager loading     | Needs the research and the task                                                                                                                                                                                                                                    | Research                                | The research shows the N+1; the code still has to change.                                                                                                                                                                                          |
| Add index         | In a Company the index is a 4 DH task put at the top of the backlog and rushed from the pool; in a Sandbox it is instant                                                                                                                                           | A task                                  | Matches, with the Sandbox exception.                                                                                                                                                                                                               |
| Debt per Feature  | Move fast 0.06, Balanced 0.03, Quality 0.01; Quality pays down debt with 10% of its Dev Hours                                                                                                                                                                      | Relative values                         | The build's numbers.                                                                                                                                                                                                                               |
| Deploys           | Deploys wait only behind a Bad deploy. The policy and the build plus deploy plus verify time set the slots; Bad deploys roll 10% base at Pre-seed                                                                                                                  | Same                                    | Matches.                                                                                                                                                                                                                                           |
| Rollback          | Needs `ci`; the rolled-back Features wait for the next deploy                                                                                                                                                                                                      | Rollback with CI/CD                     | The CI/CD Pipeline Component is M5; the research stands in.                                                                                                                                                                                        |
| Migrations        | Stack choices on an App Server in a Company start a migration: codebase × factor DH, strangler steps at 5, 25, 50, and 100% of App Servers (floor), Fix bugs fails 3% on moved servers. The Tradeoff card's Confirm starts it; the preview shows the settled Stack | Same                                    | The preview shows where the migration ends, not its steps.                                                                                                                                                                                         |
| Pooler modes      | A new Company's Pooler runs transaction mode, which breaks 5% of queries until Drop session state ships; session mode holds a server connection per client                                                                                                         | Session and transaction modes           | Matches.                                                                                                                                                                                                                                           |
| DORA metrics      | Hidden                                                                                                                                                                                                                                                             | On the Team panel with a CI/CD Pipeline | The Pipeline is M5.                                                                                                                                                                                                                                |
| Golden hash       | `SIM_VERSION` 4                                                                                                                                                                                                                                                    | —                                       | M4's Features and Bad deploy rolls changed the Pre-seed replay; M5 Seed and Series A added save fields (Queue depth, Cache, Queue and WAF options, stored GB; zones, standbys, copies, Autoscaler settings, the error budget) without changing it. |

### Seed (M5, batches B1–B4)

At the design pace, on seeds 1–5, the Balanced bot plays Seed and raises Series A (`pacing.test.ts`, the
second describe block, `runBot(…, 'balanced', 3)`):

| Milestone                 | Measured (sim min) | Target ([10](./10-progression.md#pacing-targets)) |
| ------------------------- | ------------------ | ------------------------------------------------- |
| Seed                      | 35.4–40.1          | 45–60                                             |
| Search Engine, WAF placed | Within 0.2 of Seed | Not stated                                        |
| Second App Server         | 45.5–55.5          | 8:00 (Garage)                                     |
| Series A                  | 63.8–73.3          | Not stated                                        |

Seed lasts 27–33 minutes. As in the earlier Eras, growth bounds it: 5,000 to 25,000 users against a
35,000 market at `g` = 0.0016. Greedy reaches Series A at 53–66 minutes, Stubborn at 62–68, Polyglot
at 64–76, Decliner at 79–89. The bot's autopilot builds Features in catalog order, so Profile photos
(which gates `upload`) has not shipped by Series A; its Queue and Worker branch never runs in a
Company. The Seed Sandbox tests play it instead. Margin at Seed's end is 82–93% live (cost index 4)
and −92% to −419% at the design's Series A index of 120: at that index the build's Seed Designs
cannot pay their way. That is recorded, not asserted; the Margin bot (B14) decides the index.

| Topic                 | Current build                                                                                                                                            | This design                                                | Why                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `upload` arrival      | Gated by Profile photos (08 lists it as the Feature that unlocks `upload`)                                                                               | 4% of the Seed mix                                         | 08 and 10 disagree; the Feature wins so the player meets uploads by choice.         |
| `upload` CPU          | Native, 120 ms: the runtime speed does not divide it (image resizing runs in a library)                                                                  | 120 ms reference                                           | Proposed; makes a Worker's runtime irrelevant to upload cost.                       |
| `upload` slot time    | The 2 MB body holds an App Server slot for 0.8 s (20 Mbps uplink); offloaded, 10% of that                                                                | Not stated                                                 | Proposed; this is why `upload` holds slots.                                         |
| Async share           | A Queue takes 90% of `upload` CPU to a Worker; the App Server keeps 10% plus `blob-put` and `q-write`                                                    | "Can go async"                                             | Proposed.                                                                           |
| Postgres search       | `q-search` costs 80 ms of Database CPU (10 reads); Postgres also stores `blob-put` at 60 ms until Object Storage is linked                               | "Works at low volume"                                      | Proposed. A linked Search Engine or Object Storage takes the kind from Postgres.    |
| Bots                  | Excluded from Apdex, error share, revenue and first-kind Insight; consume capacity                                                                       | T is "—"                                                   | Plan resolution 9.                                                                  |
| CDN                   | 70% of `page` at TTL 5 min (×0.8 at 1 min, ×1.2 at 1 h); answered in 8 ms at the edge                                                                    | 70% of anonymous `page`                                    | Anonymous share undefined; TTL factors proposed.                                    |
| WAF                   | Paranoia sets block, false positives and CPU (×1, 1.5, 2.5, 4); Under attack blocks 99%, 1% real users, +40 ms                                           | Low to very high CPU                                       | CPU multipliers and Under attack numbers proposed.                                  |
| Egress                | Origin $0.09/GB and CDN $0.02/GB × cost index, from Seed                                                                                                 | From the Garage                                            | Before Seed the smallest box costs more than every byte.                            |
| Storage price         | $0.000032 per GB per second × cost index (S3 Standard per GB-hour)                                                                                       | "Per GB stored"                                            | Time-billed rule ([09](./09-economy.md#how-prices-map-to-real-prices)).             |
| Queue                 | RabbitMQ only, 20,000 msg/s per size step; a backlog adds 0.01 ms per task to the enqueue; offers its backlog over 10 s                                  | RabbitMQ and SQS, delivery, visibility timeout, max length | SQS, delivery and max length are not built.                                         |
| Poison message        | Without a dead-letter queue, Workers spend 90% of their time on it; Delete message ends it                                                               | Workers busy, depth climbs forever                         | Matches.                                                                            |
| Cache stampede        | The Cache restarts empty (80% warm with Cache warming); refills stall while the database is at 90% or more; Coalescing passes 25% of the extra misses on | Throttle, warm the cache                                   | Numbers proposed. Coalescing and Warming are per-Cache options, on once researched. |
| Credential stuffing   | Bots send logins at 19× the login rate (20× in all); they hash like `login`                                                                              | `login` ×20                                                | Matches.                                                                            |
| Seed incidents        | Certificate expired: weakness 0.5 without `cert-automation`, every request fails until Renew. Disk full: built in B13 (see Series B)                     | Seed incidents                                             | Matches.                                                                            |
| Seed research missing | `pitr`, `cache-strategies`, `l4-lb`, and the rest of 10's Seed list. `tracing`, `cert-automation`, `backoff-jitter`, Go, Java and C# are built           | Seed research                                              | `pitr` needs backups and the Data Loss incident.                                    |
| Bots Sandbox fix      | A WAF at paranoia 2 or 3                                                                                                                                 | Rate limits and a WAF                                      | Rate limiting needs the API Gateway (Series A).                                     |

### Series A (M5, batches B5–B9)

At the design pace, on seeds 1–5, the Balanced bot plays 40 minutes into Series A (`pacing.test.ts`,
the second describe block, `runBot(…, 'balanced', 4)` until 110 minutes):

| Milestone                  | Measured (sim min) | Target ([10](./10-progression.md#pacing-targets)) |
| -------------------------- | ------------------ | ------------------------------------------------- |
| Series A                   | 63.8–72.6          | Not stated                                        |
| Second zone and standbys   | 82.3–87.5          | Not stated                                        |
| Users at 110 min           | 22,000–54,000      | 150,000 after 56 min of Series A                  |
| Availability over Series A | 85.7–91.8%         | SLO 99.9%                                         |

Series B is a placeholder, so the run stops on the clock. The bot researches Multiple zones first,
then spreads every other App Server and Worker to zone B and gives every data Node a standby. Its
autopilot has not built Video, Chat or Checkout by 110 minutes, so `media`, `rt` and `buy` do not
arrive in a bot Company; the Series A Sandboxes and `series-a.test.ts` play them. The bot spends its
error budget many times over: the build's incidents last 30 to 300 sim seconds, against 11's 5, 20
and 60, and a 99.9% week allows 10 seconds of full outage. It skips Error budgets, which would then
halve its velocity. Churn after a long incident (a slow query, a zone outage before Multiple zones)
takes 30% to 50% of its users. These are recorded, not tuned.

| Topic                     | Current build                                                                                                                                                             | This design                           | Why                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Media, rt, buy            | Gated by Video, Chat and Checkout (Checkout also needs the `checkout` research)                                                                                           | 10%, 8% and 3% of the Series A mix    | As `upload` at Seed: the player meets them by choice.                                                    |
| `media`                   | 5 MB, streamed: the user waits for the first 500 KB; a `blob-get` per view (30 ms on Postgres); CDN hit 75%, 92% with Tiered caching                                      | Large egress; CDN essential           | Stream size and the Postgres cost proposed.                                                              |
| `rt`                      | 0.3 ms per message; open connections are rt/s × 300 s; each holds `connectionKB` of RAM (Tomcat 1 MB, Node.js and Kestrel 10 KB, BEAM and Tokio 5 KB); PHP-FPM holds none | Connections, not requests             | The hold time and per-connection RAM are proposed.                                                       |
| `buy`                     | $25; a 40 ms `q-tx` and a Payment Provider `charge` (400 ms, 1,000/s); fees 2.9% + $0.30, not indexed                                                                     | Checkout through the PSP              | `q-tx` cost proposed.                                                                                    |
| JVM and .NET warmup       | Tomcat starts at 30% and warms for 30 s (startup 20 s, Spring Boot +15 s); Kestrel 60% over 15 s                                                                          | JIT warmup                            | Kestrel's numbers proposed.                                                                              |
| GC pauses                 | Above 70% heap: 2% × pressure of requests pause (Tomcat 30 ms, Kestrel 15 ms, Go 1 ms plus up to 25% CPU)                                                                 | Above 70% heap, p99 not p50           | The 2% share proposed.                                                                                   |
| Tokio blocking            | Blocking work stalls a share of the loop tail divided by cores                                                                                                            | `spawn_blocking` removes it           | `spawn_blocking` is not built.                                                                           |
| Rust frameworks           | None: Rust runs bare Tokio                                                                                                                                                | Axum, Actix                           | Not built.                                                                                               |
| Zones                     | Three zones; a call between zones +1 ms and $0.01/GB each way (backend calls 4 KB); the LB, WAF, Payment Provider, CDN and Object Storage span every zone                 | Same                                  | Backend call size proposed.                                                                              |
| Standby                   | Database, Pooler, Cache, Search Engine and Queue; ×2 Burn; fails over in 20 s                                                                                             | A Database standby                    | Extended to every data Node so a Company can survive a zone. 20 s proposed.                              |
| Zone outage               | Downs every zoned Node in the zone for 120 s. Weakness 3 once Multiple zones is researched and a Component sits in one zone, 0.5 before, 0.2 when spread                  | Weakness by single-zone services      | Before the research the Company has no answer, so the outage stays rare.                                 |
| Copies and the Autoscaler | One Node, `replicas` copies; VMs join after 180 s, pods after 30 s; 30 s cooldown; scales in only when the rest stay under target                                         | Copies on the board                   | One card per Node; the scale-in guard stops flapping.                                                    |
| Kubernetes Cluster        | Members cost 85% of their Burn; 1% of their requests wait 10 ms (noisy neighbours)                                                                                        | Bin packing, noisy neighbours         | The noisy-neighbour numbers proposed.                                                                    |
| SLO and error budget      | Counts from Series A, hourly over 168 calendar hours; the HUD shows availability, and the budget left with SLO dashboards                                                 | Same                                  | Matches.                                                                                                 |
| Incident director         | Each Era's interval scales the playtest gap by interval / 720 s; incidents above the Era's worst starting severity never start                                            | Per-Era interval and severity         | Matches.                                                                                                 |
| Payment Provider outage   | 60 s; every `buy` fails `upstream`; no prevention                                                                                                                         | Their outage                          | Matches.                                                                                                 |
| Language salaries         | Go 1.15, Java 1.05, C# 1.0, Elixir 1.0, Rust 1.25 × base; Rust hires take 2× as long                                                                                      | 06                                    | Matches.                                                                                                 |
| Six axes                  | Puma velocity 4, Tomcat operability 4                                                                                                                                     | Not stated                            | Raised so Go does not dominate Puma, nor Kestrel Tomcat.                                                 |
| Zone Outage Sandbox       | 2 Go App Servers in zone A; pass: move one to zone B and add a Database standby; Burn cap $12/s at 12,000 users (Payment Provider fees included)                          | A zone fails at minute 2              | The fix passes in 398 s; a third App Server in zone A fails, and spread plus a spare fails the Burn cap. |
| Cold Start Sandbox        | A Tomcat App Server, a scripted 4× spike; pass: Autoscaler and Cluster with min 2 copies, then min 1 at night under $7.30/s                                               | New JVM Nodes are slow during a spike | The fix passes in 330 s. An Autoscaler on VMs alone reacts late and passes later.                        |
| Stale Checkout Sandbox    | Two Go App Servers read from a replica; `buy` reads its cart before it charges; pass: Read-your-writes on both App Servers. A second replica lags as far and fails        | Read-your-writes routing              | Built in B10. The cart read on `buy` is proposed: the GDD gives `buy` only `q-tx` and `charge`.          |

### Series B (M5, batches B10–B14)

| Topic                    | Current build                                                                                                                                                                                    | This design                                  | Why                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Series B Era             | Raise at 1,000,000 users for $18M at 15%; market 1.4M; g 0.0007; Apdex 0.91; SLO 99.9%; interval 8 min; SEV1. Series C was the placeholder end until M6                                          | Same                                         | Matches. The live cost and salary index stay 4.                                                                                           |
| `job`                    | 400 ms CPU, 50 reads and a 10 MB file inline; through a Queue, 95% of the CPU and the 50 reads go to a Worker and the user gets a 2 KB acknowledgement; Apdex T 1 s on that acknowledgement      | Async, scored on completion time             | Completion-time Apdex is not built: the async part is unscored, as `upload`'s is.                                                         |
| `report`                 | 20 ms CPU, one `q-scan`; on the primary 100 ms of CPU, and scans evict the buffer cache: reads and writes cost up to 1.5× and reads wait up to 8 ms more, by twice the scans' CPU share          | Harms every kind on the primary              | The scan cost and the eviction rule are proposed.                                                                                         |
| Data Warehouse           | 1.5 s per scan, no limit, $0.02 per scan × cost index, $0.05/s                                                                                                                                   | Per-scan pricing                             | Scan price proposed.                                                                                                                      |
| `ai` and the GPU Node    | 400 tokens per prompt; T4 200, A100 900, H100 2,000 tokens/s per size step at $0.53, $1.80 and $3.30/s × cost index; 300 ms to the first token; a cold Node loads its model                      | Real GPU-hour prices, tokens per second      | Prices: real rentals per GPU-hour. H100 rate from SemiAnalysis; T4 and A100 rates proposed. Batch, quantization and model size not built. |
| LLM API                  | 100 prompts/s per tier (each tier doubles), 600 ms first token, past the limit `throttled`; $2.50 per 1,000 tokens × cost index                                                                  | Per token, rate limited                      | $0.69 per million real tokens, time-billed; an H100 is cheaper only while about two-thirds busy.                                          |
| Series B Features        | Data export, Dashboards, AI assistant (gated, unlock `job`, `report`, `ai`), Recommendations (video and exports +30%), Audit log (write queries +20%, market +10%)                               | 08's list                                    | "Enterprise plans" are market +10%: enterprise sales are not built.                                                                       |
| Retries and breakers     | Naive: 1 + f + f² + f³ calls; backoff: at most 10% extra calls, 200 ms wait each; a Link's failure share carries to the next Step; a breaker opens at 50% failures for 5 s and fails fast        | Backoff, retry budgets, breakers             | Retry budget, backoff wait and breaker numbers proposed.                                                                                  |
| Load shedding            | A saturated App Server with shedding on keeps 90% load and drops whole kinds, lowest value first                                                                                                 | Drop the lowest-value kinds first            | The 90% line proposed.                                                                                                                    |
| Retry storm              | The busiest Database runs at 30% for 20 s; its backlog drains at capacity; the incident ends when the backlog is empty, never on the clock                                                       | Metastable, 2→1                              | Matches the flagship sequence.                                                                                                            |
| Double charge            | The Payment Provider slows by 1.5 s on average; a charge that succeeds on a retry after a timeout fails as `duplicate` without Idempotency keys; it ends when no charge Link retries             | Same                                         | Matches.                                                                                                                                  |
| GC options               | Java G1 30 ms, Parallel 150 ms (1.05× speed, 0.95× memory), ZGC 1 ms (0.9×, 1.15×); GOGC 50/100/200 sets memory 0.7/1/1.5× and GC CPU 2/1/0.5×; a GC pause storm adds 20% heap and 5× the pauses | 06                                           | GOGC CPU factors and the storm numbers proposed.                                                                                          |
| Other Series B incidents | Report kills the database (cancel the report), GPU shortage (a GPU Node down; no H100s), Regex backtracking (every WAF at 10% capacity; disable the rule), Replication lag (10× lag)             | 11                                           | Severities and durations proposed where 11 gives none.                                                                                    |
| Disk full                | Seed, SEV2: every write to the busiest Database fails `refused` until Expand volume, at a replacement's price                                                                                    | Expand the volume                            | Built without a disk volume model.                                                                                                        |
| Axum and Actix           | Axum 1.0× CPU, 1.15× velocity; Actix 0.95×, 1.10×. The dominance test lists them as known gaps: each beats the other by 5%                                                                       | 06                                           | Matches 06's numbers.                                                                                                                     |
| GC Pauses Sandbox        | Two compute-family Tomcat App Servers at 84% heap; pass: Memory family or ZGC; Parallel GC or nothing fails the 110 ms read p99                                                                  | More memory or another collector             | Fixes pass in 4–11 minutes.                                                                                                               |
| Retry Storm Sandbox      | Naive retries with a 1 s timeout into a size-4 Database; pass: backoff or breakers; two sizes bigger passes the storm and fails the $53.60/s Burn cap                                            | Backoff, breakers, shedding; bigger DB wrong | Matches.                                                                                                                                  |
| Analytics on Primary     | Reports scan a size-4 primary; pass: a Warehouse under $63.50/s at 12,000 users; three sizes bigger fails the cap                                                                                | A Warehouse                                  | Matches.                                                                                                                                  |

**The SLO was not winnable.** Over Series A the Balanced bot held 85.7–91.8% against 99.9%. The build's
incidents ran 30 to 300 sim seconds, against 11's 5, 20 and 60. Three changes, recorded here:

1. From Series A, outside Sandboxes, an incident runs at most 5, 20 or 60 sim seconds by its starting
   severity (`CALENDAR_DURATION`), as 11 "Duration" says. A zone outage's failover shrinks with it, and
   a retry storm still ends only when its backlog drains. Earlier Eras keep the playtest durations.
2. A real user the WAF blocks gets a 403, a client error: it no longer spends the error budget. It still
   counts in the error share and in Apdex.
3. An Instance failure on a Node with a standby fails over in the same time as a zone outage, instead of
   waiting for a replacement. Under attack mode costs paranoia 1's CPU, not paranoia 4's.

A well-built Series A Design at 60,000 users (two zones, standbys, a WAF and Load Balancer pair, a
coalescing Cache) with a scripted responder holds 99.84–99.89% over a calendar week without a traffic
spike, and 99.40% in a week with one: a 3–10× spike still drops what spare capacity cannot take in its
5 seconds. The Balanced bot does not play this well: over its last calendar week it holds 97.6–99.0% (85.7–91.8%
before these changes), so it still spends its budget, mostly in the minutes a spike or slow query outruns
its responder.

At the design pace, on seeds 1–5, the Balanced bot raises Series A at 46.5–54.9 sim minutes and Series B
at 80.1–93.3 (`pacing.test.ts`, `runBot(…, 'balanced', 5)` until 130 minutes; 62.7–71.3 and
112.2–121.3 before `SIM_VERSION` 8). Its autopilot ships Video, Chat, Checkout, and Notifications
center in Series A, so `media`, `rt`, and `buy` reach a bot Company. It still ships none of the
Series B Features, so `job`, `report` and `ai`, the Warehouse and the GPU Node do not appear;
`series-b.test.ts` and the Series B Sandboxes play them. PHP-FPM holds no realtime connections and
refuses every `rt` request, which alone costs about 10% of requests. So once Chat is on the backlog,
the bot researches Node.js cluster mode and migrates to it. At 130 minutes it holds Apdex
0.951–0.964 with 4 engineers, 42–43 App Servers, and 265,000–305,000 users; on two seeds the
migration is still at step 3, where `rt` succeeds about 70% of the time. Without the migration it
held Apdex 0.881–0.904 with 66,000–104,000 users. The Realtime Hub
([Components](./05-components.md#realtime-hub)) is not built, so a migration is the only way to serve
`rt`.

### Series C to Public (M6, batches B15–B22)

| Topic                  | Current build                                                                                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regions                | Tabs over one Design ([ADR 0005](../adr/0005-regions-are-tabs-over-one-design.md)), not separate boards. NA, EU, APAC, SA; demand shares 0.4/0.3/0.2/0.1 and peak offsets 0/360/840/120 sim minutes (proposed). Opening a region costs $20,000 × cost index; regions open at Series C |
| Cross-region latency   | NA–EU 75 ms and EU–APAC 160 ms round trips (from 07); the others proposed. A user pays 2 round trips to a far region; HTTP/2 cuts 15% and HTTP/3 20%. Cross-region egress $0.02/GB. Anycast's −20 ms is in the catalog but not wired                                                  |
| Series C Era           | Raise at 10,000,000 users for $150M at 12%; SLO 99.95%. Pre-IPO raises at 50,000,000 once the IPO checklist passes; the IPO pays 1,000 s of Burn and dilutes 15%. Public: SLO 99.99%, no end                                                                                          |
| `feed`, `hook`, `push` | `hook` calls out of the Design: 800 ms, 2% failures (proposed). Push fan-out: a write fills 20 followers' timelines; hybrid reads 2× and writes 0.5× (proposed). The Push Provider: 10,000 sends/s per size step, $0.0001 per send × cost index                                       |
| Hot keys               | A hot-key incident sends 30% of reads to one key; capacity divides by the share on one replica. Key splitting removes it                                                                                                                                                              |
| Wide-column Store      | 30,000 ops/s per size step. N 1–5, R and W up to N; latency is the R-th (or W-th) fastest replica. R + W ≤ N reads go stale 50% of the time a write is in flight; `buy` on it fails 2% stale and 1% duplicate (proposed)                                                              |
| Distributed SQL        | 6,000 transactions/s per size step; a read costs 0.25 of a write; a write waits for a majority of replicas (proposed)                                                                                                                                                                 |
| Backups                | None, Nightly (RPO 1,440 min, +5% Burn), PITR (RPO 2 min, +15% Burn) (proposed)                                                                                                                                                                                                       |
| DR drill               | Fails the home region for 60 s; recovered once errors fall under 1%; passes with RTO under 60 calendar minutes and the backup's RPO under 5 (proposed)                                                                                                                                |
| IPO checklist          | Users at the raise, availability at the Era's SLO, SOC 2, a passing DR drill, data residency (EU Users behind GeoDNS reach only EU or spread stores), and Rule of 40                                                                                                                  |
| Valuation              | ARR is a year of revenue × 0.00015; the multiple is 4 + 0.15 × Rule of 40, clamped to 2–30, +2 with Investor relations, plus the quarter bonus. User growth is annualized linearly (proposed)                                                                                         |
| Quarters               | 7 calendar days. Guidance: growth 5/10/20%, margin 10/20/30%, set in the first day. A beat adds 0.5 + 0.25 per level to the multiple, a miss takes 1, a streak adds 1, up to 10 (proposed). Quarter growth is revenue against the quarter's start                                     |
| Fit the board          | Fit measures the current region tab's Nodes and keeps 380 px clear on the left for the HUD on desktop                                                                                                                                                                                 |

The Balanced bot does not reach Series C: before `SIM_VERSION` 8, on seed 3 it held 255,000 users at 200 sim minutes
(Series A at 62.7, Series B at 112.2, availability 96.3%), far from the 10,000,000 Series C needs.
M6's exit check (IPO in 9–12 hours) is not measured. `series-c.test.ts` and the Series C Sandboxes play
the Series C to Public mechanics on built Designs.

### Exit and Legacy (M7, batches M7.1–M7.7)

| Topic              | Current build                                                                                                                                                               | Design ([13](./13-prestige.md))                        | Notes                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Legacy             | floor(√(payout / $1M) × Venture multiplier × (1 + Σ Mutator shares)), minus Legacy already banked by this Company                                                           | Same formula; combination of multipliers not specified | The IPO banks Legacy at the raise; a later Step down pays only the difference.                          |
| Exits              | Acqui-hire from Series A, Acquisition from Series B, IPO at the Pre-IPO raise, Step down once Public; the streak bonus is +0.1 per beat quarter, up to +1                   | Same Exits; streak bonus not sized                     | Valuation is M6's `valuationOf`. The streak bonus is proposed.                                          |
| Time dilation      | Adds 20× and 40× to the 1×, 3×, 10× speeds                                                                                                                                  | Multiplies the top speed                               | Extra speeds read better than a scaled top speed.                                                       |
| Head start         | Level 1 only: start at Pre-seed                                                                                                                                             | Levels to later Eras                                   | Later levels skip content the bots have not paced.                                                      |
| Playbook slots     | 1 slot with no perk, then 2, 5, 10, 25                                                                                                                                      | Slots come from the perk                               | One free slot so every player meets Playbooks.                                                          |
| Unlocks            | Default Alive opens Bootstrapped indie; six achievements open their Mutators; the first Exit opens Legacy monolith, One region, and Tight budget                            | Achievements                                           | GDD 13 ties no achievement to those three. Records from M7 keep what their first Exit opened            |
| Ventures           | B2B SaaS (default, keeps today's evening curve), Consumer social, Fintech, Streaming, Game backend, AI startup, E-commerce, Bootstrapped                                    | 12 Ventures                                            | Developer platform, Healthcare, Ad tech, and Government contract are deferred: their kinds are missing. |
| Mutators           | Nine of 13's ten; Chaos Monkey weights instance incidents ×4 from Seed; HN front page weights traffic spikes ×3; Legacy monolith starts at 40 kloc, 0.4 debt, migrations ×3 | Nine Mutators                                          | Shared tenancy is skipped: CPU steal has no model yet.                                                  |
| Autopilot perk     | Not built                                                                                                                                                                   | Policies for upgrades, research, hiring                | The M4 autopilot already covers hiring and Features.                                                    |
| Offline progress   | 10 s Steps, no incidents, no Bad deploys, growth only while errors stay under 1 − SLO, 5% churn floor; cap 8, 12, 18, 24 h                                                  | Same rules, 1 s budget for 8 h                         | 8 h takes about 2.4 s in Node (0.7 ms per solve). `offline.test.ts` guards 20 s.                        |
| Simulation version | SIM_VERSION 7, GOLDEN_HASH `2b638fc7`                                                                                                                                       |                                                        | Only the four new Game fields moved the hash; without them the replay still hashes to `aed6bacd`.       |

A second Company on the same seed with Angel network 1, Pattern recognition 1, and Founder's reputation
1 (10 Legacy) against a first Company, Balanced bot (`legacy-pacing.test.ts`):

| Seed | First: Pre-seed | First: Seed | Second: Pre-seed | Second: Seed |
| ---- | --------------- | ----------- | ---------------- | ------------ |
| 1    | 12.4            | 36.7        | 11.3             | 34.0         |
| 2    | 12.4            | 40.1        | 11.3             | 37.3         |
| 3    | 12.4            | 38.5        | 11.3             | 34.3         |

Sim minutes. The M7 exit check (a second Company reaches its Exit in 3 to 6 hours) is not measured: the
Balanced bot does not reach Public.

### Challenges (M8, batches M8.1–M8.7)

| Topic                | Current build                                                                                                                                                           | Design ([14](./14-challenges.md))                    | Notes                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scores               | Cost: mean Burn per second; Tail: request-weighted p99; Complexity: Nodes the player can change plus every Link. Cost and Tail skip the first 30 sim seconds            | Burn at target load, p99 over the run, Nodes + Links | Fixed Users, Payments, and Analytics Nodes do not count.                                       |
| Run                  | Build on a live board, then Run replays the Design from t = 0 on the Challenge's seed with `DESIGN_TUNING`. During the run only Restart, Replace, and Resize are logged | Upload a design plus a seed                          | A refused placement or link fails the replay, as the board would refuse it.                    |
| Step size            | 1 sim second per Step for every shipped Challenge                                                                                                                       | Not set                                              | The plan's 0.25 s made Too Many Connections take 14.7 s to verify in Node.                     |
| Shipped              | Hello, World; Split the Box; Slashdotted; The Event Loop; Too Many Connections; and the daily drill                                                                     | 32 Challenges                                        | C10k needs slow clients; the Seed and later Challenges need authored boards.                   |
| Hello, World         | 1,000 users (20 rps) on a throttled Burstable box; budget $0.05/s                                                                                                       | 20 rps under $0.50/s                                 | At $0.50/s any box passes; the fix is the General family at $0.05/s.                           |
| Slashdotted          | 1,500 users, ×10 from minute 1 to minute 4; errors ≤ 2%, Cost ≤ $4/s                                                                                                    | ×10 for 3 minutes on a fixed budget                  | The reference (8 PHP-FPM servers at 40 workers, a Pooler, a Cache, Database +2) costs $3.88/s. |
| Too Many Connections | 40 PHP-FPM servers at 40 workers, one Postgres, 20,000 users; a `connections` incident at minute 2; no refused requests                                                 | 40 App Servers, one Postgres                         | A Pooler fixes it; the start refuses 97% of requests.                                          |
| Legacy               | 1, 1, 2, 2, 3; the daily drill pays none                                                                                                                                | 1 to 10 by difficulty                                | Awarded locally on first completion; a server rejection marks the result unverified.           |
| Daily drill          | One of two Garage/Pre-seed boards and one of four incidents at minute 2, picked from the UTC date's FNV hash; 5 minutes; results for today or yesterday                 | 5 to 15 minutes                                      | Nothing about a drill is stored: client and server derive it from the date.                    |
| Histograms           | Per Challenge and SIM_VERSION in D1; each device's independent best per axis; percentile = share of players whose best is worse                                         | Same                                                 | Device ids are random UUIDs, accepted as given. No rank is shown.                              |

Verification time for each reference replay (wall clock):

| Challenge            | Steps | Node   | workerd | Chromium | Firefox | WebKit |
| -------------------- | ----- | ------ | ------- | -------- | ------- | ------ |
| Hello, World         | 180   | 140 ms | 48 ms   | 122 ms   | 75 ms   | 120 ms |
| Split the Box        | 240   | 218 ms | 101 ms  | 150 ms   | 218 ms  | 279 ms |
| Slashdotted          | 300   | 1.5 s  | 0.96 s  | 1.4 s    | 1.8 s   | 1.6 s  |
| The Event Loop       | 240   | 191 ms | 121 ms  | 210 ms   | 189 ms  | 156 ms |
| Too Many Connections | 240   | 3.7 s  | 2.3 s   | 3.2 s    | 3.1 s   | 2.9 s  |

The longest replay, Too Many Connections (81 Nodes), takes about 2.3 s of CPU in workerd. That fits
the Workers Paid default of 30 s CPU per request but not the Free plan's 10 ms, so the API Worker
needs a paid plan; no `limits.cpu_ms` change is needed for these five. Longer Challenges (Five Nines)
will need coarser Steps.

### Polish (M9, batches M9.1–M9.4)

| Topic          | Current build                                                                                                                | Design ([15](./15-ui-ux.md), [14](./14-challenges.md)) | Notes                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Settings       | Mute and Reduce motion in `quorum.prefs.v1`; `M` toggles mute                                                                | Mute, reduced motion, text at 150%                     | No text scale: PixiJS card text is fixed              |
| Sound          | Incident, Era, and achievement sounds, skipped when muted                                                                    | Incident and Era milestone sounds                      |                                                       |
| Status         | Node cards mark ok, warn, danger, and down with a dot, a triangle, a square, and a cross as well as colour                   | Shape or icon plus colour                              |                                                       |
| Request kinds  | Packets are circles in the kind's colour                                                                                     | A shape per kind                                       | Not built                                             |
| Reduced motion | Packets hold still and the Bottleneck stops pulsing; panels and toasts appear at once                                        | Static flow arrows with rate labels                    | No rate labels                                        |
| Keyboard       | Arrows select the nearest Node, Enter moves focus into the Inspector, a focus ring marks the selected Node; `G` Glossary     | Every action has a key; T, E, I, G, C panels           | No Company, Incidents, or Cost key; `C` stays Collect |
| Contrast       | Light `--ok` darkened to L 0.50 and `--danger` to L 0.52, so status text is at least 4.5:1 on wells                          | WCAG AA                                                | Fixed axe's one serious violation (3.64:1)            |
| Achievements   | 23 defined; detected each tick in a Company, never in a Sandbox or Challenge; Histogram and Pareto from verified percentiles | 45                                                     | The rest need content the build lacks                 |
| Glossary       | All 65 entries of `glossary.md`, kept in sync by a test; met entries carry a check; Tradeoff card terms open it              | Same, entries highlighted when met                     | Undiscovered entries stay readable                    |

axe-core 4.11 (WCAG 2.0/2.1 A and AA plus best practices), before and after:

| Screen                  | Before                                                    | After   |
| ----------------------- | --------------------------------------------------------- | ------- |
| Title                   | 0 violations                                              | 0       |
| Lab, Team panel open    | 0 violations; `aria-hidden-focus` incomplete (build dock) | 0; none |
| Lab, panel closed       | 1 violation                                               | 0       |
| Daily drill (Challenge) | 1 serious `color-contrast` (`.text-ok`, 3.64:1)           | 0       |

### Features: sizes, outcomes, and upkeep (partly built)

[Features](./08-team-and-velocity.md#features) now have real sizes, rolled outcomes, rollouts,
adoption, measured lift, and upkeep. `SIM_VERSION` 8 builds the Dev Hours rate, the sizes, and the
requirements; the rest is not built.

| Topic         | Current build                                              | This design                                                  | What closes it                                                    |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| Dev Hours     | 8 DH per engineer per calendar day, on the Team's calendar | Same                                                         | Built                                                             |
| Feature sizes | 4 to 960 DH                                                | 4 to 1,440 DH                                                | Data residency (1,440 DH) is not in the catalog                   |
| Requirements  | Every row of the Features table that is in the catalog     | Every row, and Data residency needs an EU region             | Data residency                                                    |
| Effects       | Certain, at full strength on deploy                        | Rolled outcome × rollout × adoption                          | An outcome roll on queue and an `adoption` field per live Feature |
| Market gains  | Multiply                                                   | Add, capped at +100% of the Era market                       | `marketOf` in `features.ts`                                       |
| Feature Flags | Not built                                                  | Seed research and Component; rollout steps; turn off; remove | The Component, a rollout per Feature, and a Remove work item      |
| A/B testing   | Not built (designed as "Feature effects +20%")             | Measures lift against the holdout                            | Counting sampled requests per group on the Analytics tap          |
| Upkeep        | None                                                       | `0.4 × S / (S + 2,000) × (1 + debt)`, max 0.6                | A per-service share taken before the backlog                      |

A rough budget checks that the sizes fit the Eras at the live pace, where a calendar day is one real
minute. It multiplies each Era's live length by the effective engineers the bots reach:

| Era      | Live length | Effective engineers | DH in the Era | Feature DH in the Era |
| -------- | ----------- | ------------------- | ------------- | --------------------- |
| Garage   | ~6 min      | 0.8 (the founder)   | ~38           | 28                    |
| Pre-seed | ~10 min     | ~2                  | ~160          | 160                   |
| Seed     | ~14 min     | ~4                  | ~450          | 264                   |
| Series A | ~28 min     | ~9                  | ~2,000        | 2,320                 |

Before upkeep, a player can build most of each Era's Features but not all of Series A. That is the
intended choice. The design pace now runs the Team's calendar at the live pace, so the budget holds
for the bots too: the Balanced bot reaches Seed with 6 Features live and ships the four cheapest
Series A Features before Series B. Upkeep is not built, so the times above must be measured again
when it is.

[Scope and roadmap](./17-scope-and-roadmap.md) orders the work to close these gaps.
