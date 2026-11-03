# 9. Economy

[Index](./README.md) · Previous: [Team and velocity](./08-team-and-velocity.md) · Next: [Progression](./10-progression.md)

## Currencies

Each currency has one main source and one main sink, so the player always knows what each number
is for.

| Currency  | Symbol | Main source                          | Main sink                   | Resets on Exit |
| --------- | ------ | ------------------------------------ | --------------------------- | -------------- |
| Cash      | $      | Served requests                      | Nodes, Burn, salaries       | Yes            |
| Insight   | ◇      | Sampled traffic                      | Research                    | Yes            |
| Dev Hours | DH     | Engineers                            | Features, tasks, migrations | Yes            |
| Equity    | %      | Starts at 100%; falls when you raise | Determines the Exit payout  | Yes            |
| Legacy    | ★      | Exits                                | The Legacy shop             | No             |

Users are not a currency. They are the state that every currency depends on.

## Cash

### Sources

| Source            | Detail                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Request revenue   | `value × Apdex weight` per served request ([Simulation](./04-simulation.md#apdex-and-revenue)).                                                                                      |
| Funding grants    | One grant per round raised ([Funding](#funding)).                                                                                                                                    |
| Subscriptions     | From the Pre-seed Era, the "Paid plans" feature adds a fixed revenue per paying user per calendar day, independent of requests. This makes revenue less spiky and rewards retention. |
| Challenge rewards | None. Challenges pay in Legacy and badges ([Challenges](./14-challenges.md)).                                                                                                        |
| Sandbox rewards   | None. A Sandbox pays nothing in any currency ([Sandbox](./14-challenges.md#sandbox)).                                                                                                |

### The Payments drawer

Revenue first goes to the **Payments** drawer. The player clicks Collect to move it into Cash.

- The drawer holds 60 seconds of revenue at the current rate, at size 1. Each size step doubles it.
- Revenue beyond the drawer's size is lost while the player is playing. While the player is away, the
  offline simulation pays revenue straight into Cash ([Simulation](./04-simulation.md#offline-progress)).
- Research "Stripe Billing" (Garage, 30 ◇) collects automatically. After that, the drawer only shows
  the rate.

This keeps the Garage Era active and then removes the click before it becomes a chore
([pillar 5](./01-vision.md#pillar-5-respect-the-player)).

## The cloud bill

**Burn** is the total Cash spent per second. The HUD shows it next to income. The Cost panel splits it
into these lines, like a real cloud bill:

| Line          | Formula                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| Compute       | Σ instances `vCPU × price_per_vCPU + RAM × price_per_GB`, × family factor, × pricing model   |
| Managed data  | Σ data Nodes at their size price                                                             |
| Storage       | GB stored × class price ([Data tier](./07-data-tier.md#data-volume))                         |
| Egress        | GB out × egress price ([Egress](#egress))                                                    |
| Requests      | Per-request prices: API Gateway, Serverless Functions, SQS, Object Storage                   |
| Third parties | Payment fees, Auth Provider per user, LLM tokens, push messages                              |
| Observability | Analytics sampling and retention ([Observability](./12-observability.md#the-cost-of-seeing)) |
| Salaries      | Σ engineers × salary × language factor                                                       |

Real teams are often surprised by the egress, observability, and third-party lines. The game
surfaces them on purpose.

### Base prices

| Resource                 | Price             |
| ------------------------ | ----------------- |
| vCPU, general family     | $0.05/s           |
| RAM                      | $0.006/s per GB   |
| Block storage            | $0.0001/s per GB  |
| Object storage, standard | $0.00002/s per GB |
| Engineer salary (base)   | $0.40/s           |

These are Garage prices. Every price in this document, including placement, Burn, egress, and
third-party fees, is multiplied by the Era's cost index, except the Payment Provider's fee. The index keeps Burn a real share of
revenue at every size of company. [Balancing](./16-balancing.md#cost-index) holds the index and the
salary scale, and [Balancing](./16-balancing.md#prices) holds the full table.

### How prices map to real prices

Each price follows one of two rules, so a player who knows the real price can check it:

| Rule        | Prices                                                                            | Mapping                                                             |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Time-billed | Instances, GPUs, managed Nodes, storage, the Kubernetes control plane, LLM tokens | $1 per sim second in the game is $1 per real hour. A vCPU is $0.05. |
| Per use     | Egress, the Payment Provider, push and email messages, Data Warehouse scans       | The real list price per GB, per checkout, per message, or per scan. |

LLM tokens use the time-billed rule because they compete with GPU Nodes for the same prompts. On
the same scale, a busy H100 is cheaper per prompt than the LLM API only while it is more than half
busy, as in real self-hosting ([Reality check](./reality-check.md#prices)).

Request values set what a user is worth. On the time-billed rule, a user sends about 0.02 requests
an hour at about $0.25 each, so revenue is about $4 per user per month. Meta's 2025 worldwide ARPU
was $57 a year, about $4.75 a month.

The two rules do not agree with each other: per-use prices are about 3,600 times cheaper, relative
to compute, than in a real bill. This is on purpose. At the time-billed rate, every page view would
pay half its value in egress. Request values, the cost index, and the salary index are balance
controls and do not follow a real price.

## Pricing models

From the Series A Era, each compute Node has a pricing model.

| Model      | Price   | Condition                                                                                                                                                                                                                                          |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| On-demand  | 1.0×    | None. Remove at any time.                                                                                                                                                                                                                          |
| Reserved   | 0.6×    | A commitment of one calendar week. Removing the Node does not stop the Burn until the term ends.                                                                                                                                                   |
| Spot       | 0.3×    | The provider can reclaim the Node at any time. The player gets a 10-second warning (stylized; the real AWS notice is two minutes). Good for Workers and stateless servers behind a load balancer with spare capacity. Fatal for a single database. |
| Serverless | Per use | Only for Serverless Functions and managed services.                                                                                                                                                                                                |

The real lesson: the cheapest fleet mixes all three. Reserved instances cover the base load, on-demand
instances cover the daily peak, and spot instances run batch work.

## Egress

| Path                          | Price per GB |
| ----------------------------- | ------------ |
| Origin to internet            | $0.09        |
| CDN to internet               | $0.02        |
| Cross-zone, each direction    | $0.01        |
| Cross-region                  | $0.02        |
| Object storage R2 to internet | $0           |

`media` at 5 MB per request makes egress the largest line on the bill in the Series A Era unless a CDN
or R2 serves it. A player who ignores egress sees revenue rise and margin fall.

## Third-party fees

| Service          | Price                                          |
| ---------------- | ---------------------------------------------- |
| Payment Provider | 2.9% + $0.30 per successful `buy`, not indexed |
| Auth Provider    | $0.02 per monthly active user per calendar day |
| LLM API          | $3.24 per 1,000 tokens                         |
| Push and email   | $0.0001 per message                            |
| API Gateway      | $0.002 per request (game dollars)              |

## Funding

When users reach an Era milestone, investors offer a round. The player can raise or decline.

| Round    | Milestone (users)                | Grant         | Dilution                 | Notes                                            |
| -------- | -------------------------------- | ------------- | ------------------------ | ------------------------------------------------ |
| Pre-seed | 1,000                            | $2,500        | 10%                      |                                                  |
| Seed     | 5,000                            | $15,000       | 19%                      | Carta median 19.4% (Q2 2026)                     |
| Series A | 25,000                           | $80,000       | 19%                      | Carta median 18.7% (Q2 2026)                     |
| Series B | 150,000                          | $1,500,000    | 13%                      | Carta median 12.9% (2025)                        |
| Series C | 1,000,000                        | $18,000,000   | 12%                      | Carta: 16% median across seed to Series C        |
| Pre-IPO  | 10,000,000                       | $200,000,000  | 10%                      |                                                  |
| IPO      | 50,000,000 and the IPO checklist | Public market | 15% sold in the offering | [Progression](./10-progression.md#era-6-pre-ipo) |

A grant is about 17 sim minutes (1,000 s) of the Burn at the milestone, so it stays worth taking
at every size of company.

**Money buys growth.** An Era that begins with a raised round runs at the full growth rate `g`. An
Era that begins with a declined round runs at 0.7 × `g`, so it takes about 1.4 times as long
([Simulation](./04-simulation.md#users-and-growth)). The player trades Equity for speed.

**Declining** a round keeps Equity and gives no grant. The Era still advances, so the new kinds still
arrive, and the player must pay for them from revenue. A player who declines every round and still
reaches IPO earns the achievement "Default Alive", named after Paul Graham's essay. The pacing bots
check that this path does not beat the raise-every-round path in Legacy per hour
([Balancing](./16-balancing.md#pacing-model)).

Dilution compounds. A founder who raises every round keeps about
0.90 × 0.81 × 0.81 × 0.87 × 0.88 × 0.90 ≈ 41% before the IPO offering and about 35% after it, which
is above a typical real founder stake at IPO.

## Valuation

The company has a valuation at all times. It decides the Exit payout.

```text
ARR        = revenue per calendar day × 365 × valuation_scale
growth     = user growth over the last calendar week, annualized, in percent
margin     = (income − Burn) / income, in percent
rule_of_40 = growth + margin
multiple   = 4 + 0.15 × max(0, rule_of_40)            clamped to [2, 30]
valuation  = ARR × multiple
```

`valuation_scale` is 1.5 × 10⁻⁴. Request values are stylized game dollars, so Cash and revenue run
far above real figures. The scale converts a year of game revenue into the real-dollar ARR that the
company would report ([Balancing](./16-balancing.md#valuation-scale)). The Valuation, Exit payout,
and Legacy use real dollars. Cash, revenue, and Burn use game dollars.

The [Rule of 40](./glossary.md#rule-of-40) is a real heuristic for software companies: growth plus
profit margin should be at least 40%. It gives the late game a reason to care about margin, not only
growth.

## Runway and running out of Cash

**Runway** is Cash divided by net Burn. The HUD shows it when net Burn is positive.

When Cash reaches zero:

1. Placement and upgrades stop.
2. Burn continues and Cash goes negative.
3. At −1 calendar day of Burn, investors offer a **bridge**: a grant that covers 3 calendar days of
   Burn for 8% dilution. The player can accept, or cut costs.
4. If the player declines and Cash reaches −3 calendar days of Burn, Nodes shut down, most expensive
   first, until net Burn is zero.

The company never ends. Running out of money is a setback, not a game over
([pillar 5](./01-vision.md#pillar-5-respect-the-player)).

## Sources and sinks summary

```text
Users ──requests──► Revenue ──► Payments ──collect──► CASH ──► Nodes, Burn, salaries, hires
  ▲                                                     ▲
  │                                                     └── Funding (costs Equity)
  │
  └── Apdex ◄── design quality ◄── capacity, research, features

Sampled traffic ──► INSIGHT ──► Research ──► Components, variants, techniques, visibility
Postmortems ──► action items (open until researched) ──┘

Engineers ──► DEV HOURS ──► Features (more users, revenue, load)
                         ──► Tasks, migrations, debt paydown (cheaper and safer system)

Exit (Equity × valuation) ──► LEGACY ──► Permanent perks, Playbooks, Ventures
```

The three main currencies (Cash, Insight, Dev Hours) compete for the player's attention, not for
each other. No exchange between them exists, except that Cash hires engineers and pays for Analytics.
This keeps each choice legible.
