# 8. Team and velocity

[Index](./README.md) · Previous: [Data tier](./07-data-tier.md) · Next: [Economy](./09-economy.md)

Servers are half of the game. The other half is the people who change them. This system makes
runtime choices bite in both directions: Rust saves servers and costs engineer time, Rails saves
engineer time and costs servers. It also makes microservices a real decision with a real reason, as
described by [Conway's law](./glossary.md#conways-law) and [Brooks's law](./glossary.md#brookss-law).

The Team system arrives in two steps. In the Garage Era, the player is the only engineer and
produces Dev Hours. Hiring unlocks in the Pre-seed Era.

## Dev Hours

**Dev Hours** (DH) are the currency of engineering work.

```text
DH per calendar day = Σ_teams effective_engineers(team) × 8 × velocity(team) × policy × error_budget_factor × (1 − upkeep_share)
```

One DH is one engineer-hour. An engineer works 8 hours in a calendar day (the same work window that
limits deploys), so one engineer produces 8 DH per calendar day. The founder produces 0.8 of that,
because the founder also runs the company. Dev Hours follow the Team's calendar, like hiring,
ramp-up, and deploys. The live game runs the Team's calendar 24× faster than the board's (see the
[divergence log](./16-balancing.md#divergence-log)), so an engineer produces 8 DH per real minute.

| Term                  | Source                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `effective_engineers` | Headcount after the coordination penalty ([Coordination](#coordination)).                                            |
| `velocity`            | Language × framework × tech debt factor ([Runtimes](./06-runtimes.md#language-profiles)).                            |
| `policy`              | The team policy ([Team policy](#team-policy)).                                                                       |
| `error_budget_factor` | 1.1 with budget to spare, 1.0 normally, 0.5 during a freeze ([Incidents](./11-incidents.md#slos-and-error-budgets)). |
| `upkeep_share`        | The share that keeps live Features running ([Upkeep](#upkeep)).                                                      |

Dev Hours are spent on five kinds of work:

| Work              | Examples                                                         | Section                                 |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------- |
| Features          | Onboarding, search filters, recommendations                      | [Features](#features)                   |
| Engineering tasks | Add an index, eager loading, idempotency keys, fix a memory leak | [Engineering tasks](#engineering-tasks) |
| Migrations        | Change a service's language, split a service, move auth in-house | [Migrations](#migrations)               |
| Debt paydown      | Refactoring sprints                                              | [Tech debt](#tech-debt)                 |
| Upkeep            | Bug fixes, dependency updates, support for live Features         | [Upkeep](#upkeep)                       |

Work items sit in a **backlog** with a priority order. Engineers work on the top items in parallel,
up to one item per team at a time.

## Hiring

| Property     | Detail                                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Signing cost | One-time Cash: $2,000 × salary multiplier in the Pre-seed Era, scaling with the Era.                                                            |
| Salary       | Burn per engineer, multiplied by the language's salary factor ([Runtimes](./06-runtimes.md#hiring-and-salaries)).                               |
| Time to hire | Calendar days, multiplied by the language's time-to-hire factor. A company with services in several languages hires for the service's language. |
| Ramp-up      | A new hire produces 30% for the first calendar week, then 100%. Rails conventions halve the ramp.                                               |

Layoffs refund nothing, end the salary Burn, and cost 10% velocity for the rest of the team for a
calendar week (morale).

## Teams

Engineers belong to teams. The player creates teams and assigns engineers.

| Team type     | Unlocked | Owns                                       | Effect                                                                                                                                             |
| ------------- | -------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product team  | Pre-seed | One or more services                       | Produces DH for features and engineering tasks on its services.                                                                                    |
| Platform team | Series A | Kubernetes, CI/CD, the Service Mesh        | Removes the per-cluster DH tax. Halves deploy time.                                                                                                |
| SRE team      | Series A | On-call, runbooks, incident response       | MTTR −40%. Open action items raise incident odds by half as much. Runbooks become automatic mitigations ([Incidents](./11-incidents.md#runbooks)). |
| Data team     | Series B | The warehouse, CDC, the Vector Index       | `report` and `ai` features cost −30% DH. Pipelines have half the lag.                                                                              |
| Security team | Pre-IPO  | WAF rules, dependency scanning, compliance | Required for the SOC 2 milestone. Lowers supply-chain and breach incident chances.                                                                 |

## Coordination

Communication cost grows with the number of people who must agree. The game models this per team:

```text
effective_engineers(team) = n / (1 + k × (n − 1) + β × n × (n − 1))
k = 0.08 by default, × 0.7 with a structured framework (Spring Boot, NestJS, Symfony)
β = 0.0004
```

| Engineers in one team | Effective engineers |
| --------------------- | ------------------- |
| 1                     | 1.0                 |
| 5                     | 3.8                 |
| 10                    | 5.7                 |
| 20                    | 7.5                 |
| 40                    | 8.4                 |
| 80                    | 8.1                 |

Past about 10 people, one team adds little. The β term is the retrograde term of the Universal
Scalability Law: a team above about 48 people produces less than a smaller one. This is the game's
version of Brooks's law: "adding manpower to a late software project makes it later".

## Services

A **Service** is a codebase with its own deploy pipeline, owned by one team. Every App Server and
Worker belongs to a Service. The starting company has one Service: the monolith.

**Splitting** a service (research "Service boundaries", Series B) moves some request kinds to a new
codebase.

| Gain                                           | Cost                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Teams stay small, so coordination improves     | A network hop between services: +1 ms and serialization CPU on both sides                      |
| Each service can pick its own Stack            | Another deploy pipeline, more Nodes, more Burn                                                 |
| A bad deploy hits one service, not all of them | Distributed failure modes: partial outages, retries, timeouts ([Incidents](./11-incidents.md)) |
| Each service scales on its own                 | DH for the split itself (proportional to the moved code)                                       |

**Shared database penalty.** Services that share one database keep 50% of the coordination penalty,
because schema changes still need agreement. This is the "distributed monolith" trap. Giving each
service its own data store removes the penalty and creates the problems in
[keeping copies in sync](./07-data-tier.md#keeping-copies-in-sync).

Conway's law works in both directions in the game: the team structure the player builds shapes the
service graph, and the service graph decides how well the teams work.

## Features

A **Feature** is a product change built with Dev Hours. Features are the main way to raise revenue
per user and market size. Every feature also changes load, which feeds the
[bottleneck loop](./03-game-loops.md#l1-bottleneck-30-seconds-to-3-minutes).

Four rules make Features behave like real product work:

1. **Real sizes.** A Feature costs what a small team needs to build it.
2. **Uncertain effects.** A Feature's effect is not known until users have it.
3. **Gradual rollout and adoption.** Users get a Feature in steps and pick it up over time.
4. **Upkeep.** A live Feature costs Dev Hours for as long as it stays in the product.

### Sizes

DH are engineer-hours, so sizes come from how long real teams take. The sizes follow the appetites in
Basecamp's _Shape Up_: a small batch is one engineer for one to two weeks, and a big batch is two
engineers for six weeks. A week is 40 DH.

| Feature              | Era      | Requires                         | Size                  | DH    | Win effect on users and money        | Effect on load                                     |
| -------------------- | -------- | -------------------------------- | --------------------- | ----- | ------------------------------------ | -------------------------------------------------- |
| Landing page         | Garage   | —                                | 1 day                 | 8     | Market +20%                          | `page` +10%                                        |
| Signup flow          | Garage   | —                                | 2 days                | 16    | Growth +15%                          | Unlocks `write` early at a low share               |
| Pagination           | Garage   | —                                | Half a day            | 4     | —                                    | `read` payload −50%, adds an unindexed query shape |
| Password login       | Pre-seed | Signup flow                      | 1 week                | 40    | Required for paid plans              | Unlocks `login`                                    |
| Paid plans           | Pre-seed | Password login                   | 2 weeks               | 80    | `write` value +30%                   | —                                                  |
| Email digests        | Pre-seed | Signup flow                      | 1 week                | 40    | Churn −10%                           | Nightly `job` burst                                |
| Search filters       | Seed     | —                                | 1 week                | 40    | `search` value +25%                  | `q-search` cost +40%                               |
| Profile photos       | Seed     | Password login                   | 1 week                | 40    | Growth +10%                          | Unlocks `upload`                                   |
| Public API           | Seed     | Password login                   | 4 weeks               | 160   | Market +25%                          | `read` +30%, bursty clients, bots                  |
| Infinite scroll      | Seed     | Pagination                       | 3 days                | 24    | `read` value +10%, time in app +25%  | `read` +40%                                        |
| Video                | Series A | Profile photos                   | 2 engineers, 6 weeks  | 480   | Market +40%                          | Unlocks `media`                                    |
| Chat                 | Series A | Password login                   | 2 engineers, 6 weeks  | 480   | Churn −20%                           | Unlocks `rt`                                       |
| Checkout             | Series A | Paid plans                       | 2 engineers, 4 weeks  | 320   | Unlocks `buy`                        | `q-tx`, Payment Provider dependency                |
| Notifications center | Series A | Chat                             | 2 weeks               | 80    | Growth +10%                          | `rt` +20%                                          |
| Mobile app           | Series A | Public API                       | 2 engineers, 3 months | 960   | Market +60%                          | `read` +50%, `push` earlier                        |
| Data export          | Series B | —                                | 2 weeks               | 80    | Enterprise plans: `write` value +20% | Unlocks `job`                                      |
| Dashboards           | Series B | —                                | 2 engineers, 6 weeks  | 480   | Enterprise plans                     | Unlocks `report`                                   |
| AI assistant         | Series B | —                                | 2 engineers, 6 weeks  | 480   | Unlocks `ai`                         | GPU or LLM API dependency                          |
| Recommendations      | Series B | Video, Data export               | 2 engineers, 6 weeks  | 480   | `media` and `feed` usage +30%        | Batch `job` and a model                            |
| Audit log            | Series B | Password login                   | 3 weeks               | 120   | Required for enterprise              | `q-write` +20%                                     |
| Activity feed        | Series C | —                                | 2 engineers, 6 weeks  | 480   | Market +50%                          | Unlocks `feed`                                     |
| Webhooks             | Series C | Public API                       | 3 weeks               | 120   | Market +20% (integrations)           | Unlocks `hook`                                     |
| Push notifications   | Series C | Mobile app, Notifications center | 2 weeks               | 80    | Growth +15%, churn +5% if over-sent  | Unlocks `push`                                     |
| Localization         | Series C | —                                | 2 engineers, 6 weeks  | 480   | Market +40% outside North America    | More regions matter                                |
| Offline mode         | Series C | Mobile app                       | 2 engineers, 6 weeks  | 480   | Churn −10%                           | Sync bursts on reconnect                           |
| Single sign-on       | Pre-IPO  | Password login                   | 6 weeks               | 240   | Enterprise market +30%               | `login` moves to SAML or OIDC                      |
| Data residency       | Pre-IPO  | An open EU region                | 3 engineers, 3 months | 1,440 | Required for the EU market           | EU data must stay in an EU region                  |
| Status page          | Pre-IPO  | —                                | 2 days                | 16    | Churn during incidents −30%          | —                                                  |
| Usage-based pricing  | Public   | Paid plans                       | 2 engineers, 6 weeks  | 480   | Revenue per request +15%             | Metering `job` and `q-write`                       |

Market gains add instead of multiply, and their sum is capped at +100% of the Era's market. Features
reach more of the people who could use the product. They cannot create new people.

Some features ship with hidden costs that appear later: a new unindexed query shape, an N+1 in a
list view, or a scan in a dashboard. Research "Code review" reveals these costs before the feature
ships.

### Outcomes

The "Win effect" column is what a Feature does when it works. Most product changes do not work as
planned. When Microsoft ran controlled experiments, about a third of ideas improved the metric they
targeted, a third did nothing, and a third made it worse.

When a Feature is queued, the Simulation rolls its outcome from the Company's seeded random stream.
The roll changes only the effects on users and money: market, growth, churn, and value. The effect
on load is certain, because users call the new code whether it helps them or not. A Feature that
fails still costs capacity.

| Outcome | Chance | Realized effect, as a share of the win effect |
| ------- | ------ | --------------------------------------------- |
| Win     | 1/3    | 60% to 140%                                   |
| Flat    | 1/3    | −10% to +20%                                  |
| Loss    | 1/3    | −50% to −10%                                  |

A Feature that only unlocks a kind or meets a requirement, such as Password login or Checkout, always
does that. Its roll applies only to the other effects it has.

The player does not see the roll. The Feature card shows the win effect as "Expected". The player
learns the realized effect only by measuring it ([Measured lift](#measured-lift)).

### Rollout

Without Feature Flags ([Components](./05-components.md#feature-flags)), a Feature goes to every user
in the deploy that ships it.

With Feature Flags, a shipped Feature starts dark. The player moves it through the same steps as a
migration: 5%, 25%, 50%, 100% of users. The **rollout** share scales both the Feature's effects and
its load. At any step the player can:

- **Shift** it to the next step.
- **Turn it off.** Effects and load stop at once. The code stays, so upkeep continues.
- **Remove** it. This is a backlog item of 25% of the Feature's DH. When it ships, the code is gone:
  effects, load, and upkeep end. Deleting code is work too.

A bad deploy that comes from a flagged Feature hits only its rollout share
([Incidents](./11-incidents.md#mitigation-toolbox)).

### Adoption

Users do not adopt a Feature on the day it ships. Each Feature has an **adoption** share that
approaches 1 as calendar time passes:

```text
adoption += (1 − adoption) × Δt / τ        τ = 7 calendar days
exposure  = rollout × adoption
```

All effects and load scale with `exposure`. After one calendar week, a Feature at 100% rollout
reaches about 63% of its effect, and about 95% after three weeks. Real adoption follows an S-curve
(the Bass diffusion model). The game uses the exponential approach because the Simulation allows only
exact arithmetic ([Simulation](./04-simulation.md)).

### Measured lift

Analytics measures a Feature's **lift**, its realized effect, under two conditions:

- Research "A/B testing" is done.
- The Feature is between 5% and 50% rollout, so some users still do not have it and form a holdout
  group.

The Feature card then shows the lift with a 95% confidence interval. The interval narrows as
Analytics samples more requests from both groups:

```text
half_width = 1.96 × σ × sqrt(1 / n_exposed + 1 / n_holdout)
σ = 1.0 (the spread of a relative effect, tunable)
```

`n_exposed` and `n_holdout` count sampled requests from each group since the Feature reached its
current step. The verdict is **Wins** when the interval is above zero, **Loses** when it is below
zero, and **Too early** while it contains zero. A higher sample rate gives a verdict sooner, which is
one more reason to pay for sampling ([Observability](./12-observability.md#the-cost-of-seeing)).

Before A/B testing, the player can compare the metrics before and after a launch. Growth, the Era,
and incidents also move those metrics at the same time. That is the real reason teams use
controlled experiments.

### Upkeep

Every live Feature needs upkeep: bug fixes, dependency updates, and support questions. Upkeep takes
a share of each team's Dev Hours before the backlog gets any:

```text
upkeep_share(service) = 0.4 × S / (S + 2,000) × (1 + debt)        capped at 0.6
S = DH of the Features shipped on the service and not yet removed
```

A product with 500 DH of Features spends 8% of its Dev Hours on upkeep. With 4,000 DH it spends 27%,
and it approaches 40% with no debt. Developers in Stripe's survey spent about 42% of their week on
maintenance and bad code. Turning a Feature off does not end its upkeep. Removing it does.

Upkeep makes a large product slower to change. The player chooses which Features earn their upkeep
and removes the ones that lose or stay flat.

## Engineering tasks

Tasks are DH spent on the system instead of the product. Many come from incident action items.

| Task                        | DH  | Effect                                                                      |
| --------------------------- | --- | --------------------------------------------------------------------------- |
| Add index (per query shape) | 4   | Removes one slow query shape ([Data tier](./07-data-tier.md#indexes)).      |
| Eager loading               | 10  | Removes N+1 multipliers on one service.                                     |
| Fix memory leak             | 15  | Stops RSS growth on one service until the next big feature.                 |
| Idempotency keys            | 20  | Removes `duplicate` on checkout and double-processing on queues.            |
| Move CPU work off the loop  | 12  | Node.js and Python async only: moves a CPU-heavy kind to worker threads.    |
| Add timeouts and retries    | 8   | Applies a link policy to every link of one service.                         |
| Graceful shutdown           | 6   | Deploys and scale-downs finish in-flight requests instead of failing them.  |
| Health check endpoint       | 4   | Enables deep health checks.                                                 |
| Write a runbook             | 10  | Enables automatic mitigation for one incident type (with an SRE team).      |
| Load test                   | 15  | Shows the capacity of each Node at 2× current demand, for one calendar day. |

## Migrations

A migration changes a service's language, moves a capability between Components, or splits a service.

```text
migration_DH = codebase_size × migration_factor
codebase_size grows with every feature shipped on that service (in thousands of lines)
```

| Migration                                 | Factor                | Notes                                                                                 |
| ----------------------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| Variant inside a language (FPM to Octane) | 0.1                   | Fast, with surprises (state bleed).                                                   |
| Framework inside a language               | 0.5                   |                                                                                       |
| Language change                           | 1.0                   | Multiplied by the target language's velocity inverse: rewriting into Rust costs more. |
| Split a service                           | 0.3 of the moved part |                                                                                       |
| Move auth in-house from an Auth Provider  | Fixed 120             |                                                                                       |
| Database engine change                    | 0.8                   | Plus a data copy that takes calendar time proportional to volume.                     |

During a migration:

- Both versions run, and the player shifts traffic in steps (strangler pattern): 5%, 25%, 50%, 100%.
- Each step can reveal bugs, which appear as a small error rate on the new version until fixed.
- Features on that service ship at half speed.

The "big rewrite" is a trap. A full-company language change while competitors ship features costs
users. The game makes this visible with a market-share line in the Series B Era and later.

## Tech debt

**Tech debt** is a percentage from 0% to 100% per service.

| Grows with                                        | Effect                             |
| ------------------------------------------------- | ---------------------------------- |
| Each feature shipped under the "Move fast" policy | Velocity × (1 − 0.5 × debt)        |
| Hotfixes during incidents                         | Incident chance × (1 + debt)       |
| No framework, as the codebase grows               | New hire ramp-up × (1 + debt)      |
| Skipped tests (no CI)                             | Bad-deploy chance × (1 + 2 × debt) |

Paydown: assign DH to "Refactor" on a service. Each DH removes a fixed amount of debt. Paying down
debt earns nothing directly. It makes everything else cheaper, which is why it is real.

## Team policy

One setting per team, changeable at any time with a one-calendar-day transition.

| Policy    | Velocity | Debt per feature          | Bad-deploy chance |
| --------- | -------- | ------------------------- | ----------------- |
| Move fast | 1.3×     | High                      | 1.5×              |
| Balanced  | 1.0×     | Medium                    | 1.0×              |
| Quality   | 0.8×     | Low, with passive paydown | 0.5×              |

## Deploy frequency

Features ship in deploys. A feature finished between deploys waits for the next one.

```text
deploys_per_calendar_day = min(max_from_policy, 8 hours of work / (build_time + deploy_time + verify_time))
```

- Build time comes from the language ([Runtimes](./06-runtimes.md#language-profiles)). Rust's 12-minute
  builds and Java's 6-minute builds slow shipping. PHP's 30-second builds and file-copy deploys speed
  it up.
- Deploy time comes from the strategy ([Components](./05-components.md#cicd-pipeline)) and the runtime
  startup and warmup.
- More deploys per day ship features sooner and make each deploy smaller, which lowers the size of a
  bad deploy. DORA research links deployment frequency and short lead times to better
  delivery performance. Its 2024 report found that change failure rate does not fall in step: the
  medium cluster had a lower rate than the high cluster. So the game lowers the size of a bad deploy
  with frequency, and it does not lower the chance.

The five DORA metrics appear on the Team panel once the player has a CI/CD Pipeline: deploy
frequency, lead time for changes, change failure rate, failed deployment recovery time, and rework
rate.
