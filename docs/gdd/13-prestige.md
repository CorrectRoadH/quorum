# 13. Exit and Legacy

[Index](./README.md) · Previous: [Observability](./12-observability.md) · Next: [Sandbox, Challenges, and achievements](./14-challenges.md)

The prestige layer. A company ends in an **Exit**. The Exit pays **Legacy**. Legacy buys permanent
perks and opens new **Ventures**, which change the rules of the next company. This follows the idle
game prestige pattern ([Influences](./02-influences.md#idle-game-theory)), and it uses Ventures and
Mutators to keep each company different, which answers the Upload Labs complaint about repetition.

## Exits

| Exit        | Available from    | Payout basis                  | Multiplier                  | Notes                                                   |
| ----------- | ----------------- | ----------------------------- | --------------------------- | ------------------------------------------------------- |
| Acqui-hire  | Series A          | Equity × min(valuation, $50M) | 0.5                         | Ends early. Good for a fast restart with a new Venture. |
| Acquisition | Series B          | Equity × valuation            | 1.0                         | The buyer pays the current valuation.                   |
| IPO         | Pre-IPO checklist | Equity × valuation at listing | 1.5                         | Continues into the Public Era.                          |
| Step down   | Public            | Equity × current market value | 1.5, + quarter streak bonus | Ends the company from the Public Era.                   |

```text
payout = equity × valuation × exit_multiplier
legacy = floor( sqrt( payout / $1,000,000 ) )
```

| Payout       | Legacy |
| ------------ | ------ |
| $1 million   | 1      |
| $100 million | 10     |
| $1 billion   | 31     |
| $10 billion  | 100    |
| $100 billion | 316    |

The square root follows the common prestige curve: each Exit is worth more than the last, but not
exponentially more, so the player keeps a reason to improve rather than repeat
([Balancing](./16-balancing.md#prestige-curve)).

**What resets.** Cash, Insight, Dev Hours, users, research, the board, the team, and Equity.

**What stays.** Legacy, Legacy shop purchases, Playbooks, achievements, Challenge results, unlocked
Ventures and Mutators, and the engineering glossary entries the player has discovered.

## The Legacy shop

| Perk                    | Levels | Cost (★) per level | Effect per level                                                                             |
| ----------------------- | ------ | ------------------ | -------------------------------------------------------------------------------------------- |
| Angel network           | 5      | 2, 4, 8, 16, 32    | Starting Cash ×2                                                                             |
| Alumni network          | 5      | 3, 6, 12, 24, 48   | +1 starting engineer (from the Pre-seed Era)                                                 |
| Institutional knowledge | 10     | 5 each             | Keep one researched item of your choice through the next Exit                                |
| Pattern recognition     | 5      | 4, 8, 16, 32, 64   | Insight +20%                                                                                 |
| Founder's reputation    | 5      | 4, 8, 16, 32, 64   | User growth +10%                                                                             |
| Better terms            | 5      | 6, 12, 24, 48, 96  | Dilution per round −2 points                                                                 |
| Night shift             | 3      | 5, 15, 45          | Offline cap 12 h, 18 h, 24 h                                                                 |
| Time dilation           | 2      | 20, 80             | Unlocks 2× and then 4× speed                                                                 |
| Playbooks               | 4      | 5, 15, 45, 135     | Playbook slots: 2, 5, 10, 25 ([Playbooks](#playbooks))                                       |
| Autopilot               | 3      | 10, 30, 90         | Policies for upgrades, research queues, and hiring ([Interface](./15-ui-ux.md#bulk-actions)) |
| War stories             | 3      | 8, 24, 72          | Open action items raise incident odds by half as much                                        |
| Head start              | 3      | 25, 75, 225        | Start the next company in the Pre-seed, Seed, or Series A Era with that Era's starter design |

Costs grow so that a full shop needs about 8 to 12 Exits, which is the target for 80 to 150 hours.

## Playbooks

A **Playbook** is a saved sub-design: Nodes, links, Stacks, and settings. It is Quorum's version of
Factorio blueprints ([Influences](./02-influences.md#factorio)).

- The player saves a selection on the board as a Playbook.
- Placing a Playbook places all its Nodes in one action, if the player has the Cash and the research.
  Missing research shows as ghost Nodes.
- Playbooks survive Exits. The second company's first hour is faster because the player places a
  known-good Garage design in one action.
- Playbooks export as a text string, so players can share them.

Playbooks remove the post-prestige tedium that Upload Labs players report
([Influences](./02-influences.md#why-players-quit)).

## Ventures

A **Venture** is the kind of company the player founds. Each Venture changes the request mix, demand
shape, constraints, and incidents. The default Venture is unlocked from the start. Others cost Legacy
or come from achievements.

| Venture             | Unlock                      | Demand shape                              | Mix changes                                          | Constraint                                                                                                     | Signature incident          |
| ------------------- | --------------------------- | ----------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------- |
| B2B SaaS (default)  | Start                       | Weekday office hours, weekend 0.5×        | `write` and `report` +50%                            | SLA credits from Series B                                                                                      | Big tenant hot shard        |
| Consumer social     | 5 ★                         | Evening peak, weekend 1.15×, viral spikes | `feed` arrives in Series A, `media` +50%             | Very low value per request; huge volume                                                                        | Celebrity post              |
| Fintech             | 10 ★                        | Business hours, month-end peaks           | `buy` ×4, `write` +50%                               | Any `stale` on money kinds is a compliance fine                                                                | Double charge               |
| Streaming media     | 10 ★                        | Evening peak, premieres                   | `media` ×4                                           | Egress dominates the bill                                                                                      | Premiere spike              |
| Game backend        | 15 ★                        | Evening peak by region                    | `rt` ×4                                              | `rt` Apdex T 50 ms; regions matter from Series A                                                               | Launch day                  |
| AI startup          | 15 ★                        | Flat, with launch spikes                  | `ai` arrives in Seed, ×3                             | GPUs are scarce; inference cost decides margin                                                                 | GPU shortage                |
| E-commerce          | 20 ★                        | Daily, with a yearly event                | `buy` ×2, `search` ×2                                | One scheduled sale event per calendar month at ×20 demand                                                      | Flash sale                  |
| Developer platform  | 20 ★                        | Flat, bursty clients                      | `hook` arrives in Seed, `read` from API clients      | Rate limits matter; customers write retry loops                                                                | Retry storm from a customer |
| Healthcare          | 30 ★                        | Business hours                            | `write` +50%                                         | Data residency and encryption required from Series A                                                           | Audit finding               |
| Ad tech             | 30 ★                        | Flat, enormous                            | A bid kind: value $0.001, Apdex T 100 ms, 10× volume | Requests that miss 100 ms earn nothing (real-time bidding deadlines)                                           | Latency regression          |
| Bootstrapped indie  | Achievement "Default Alive" | Any                                       | Default                                              | No funding rounds. Equity stays 100%. Salaries from revenue only.                                              | Runway                      |
| Government contract | 40 ★                        | Business hours, deadline spikes           | Default                                              | Must use Java or C# for the core service; long procurement for new Components (placement takes 1 calendar day) | Deadline day                |

Each Venture has its own Legacy multiplier (1.0× to 1.5×), shown before founding.

## Mutators

A **Mutator** is an optional rule that makes a company harder in exchange for more Legacy. Mutators
are unlocked by achievements. Each one adds a Legacy multiplier.

| Mutator                 | Rule                                                                            | Legacy |
| ----------------------- | ------------------------------------------------------------------------------- | ------ |
| Chaos Monkey            | A random Node is terminated every few minutes, from the Seed Era                | +25%   |
| Hacker News front page  | Traffic spikes are three times as frequent                                      | +15%   |
| Legacy monolith         | Start with a large PHP codebase: migrations cost 3× and tech debt starts at 40% | +20%   |
| One region forever      | Multi-region is disabled                                                        | +20%   |
| No caches               | The Cache and CDN are disabled                                                  | +40%   |
| Shared tenancy          | Noisy neighbors: random CPU steal on every instance                             | +10%   |
| Tight budget            | Funding grants are halved                                                       | +20%   |
| Single language         | Every service must use the first language you choose                            | +15%   |
| Postgres for everything | The only data Components are the Database, its replicas, and the pooler         | +30%   |
| Strict SLO              | The SLO is one level higher in every Era                                        | +20%   |

"Postgres for everything" is a real engineering argument. With this Mutator the game supports it:
Postgres can serve `q-search` with full-text search, `ai` lookups with pgvector, and queues with
`SKIP LOCKED`, each with a lower ceiling than the dedicated Component.

## Company history

Each Exit adds a row to the company history: the Company's name, Venture, Mutators, time played, peak users, Exit type,
payout, Legacy earned, final Stack mix, and a snapshot of the board. The history is a record of how
the player's engineering changed over time.
