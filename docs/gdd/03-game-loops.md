# 3. Game loops

[Index](./README.md) · Previous: [Influences](./02-influences.md) · Next: [Simulation](./04-simulation.md)

Quorum has six nested loops. Each loop feeds the one above it. A short loop must pay off before the
player loses interest, and a long loop must give a reason to keep playing the short loops.

```text
L5  Mastery      Challenges, daily drills, histograms          unbounded
 └─ L4  Company     Found → Eras → Exit → Legacy                  6–15 hours
     └─ L3  Era        Raise → new kinds → new failure mode         30–120 minutes
         └─ L2  Growth     Users ↑ → demand ↑ → spend → research       5–20 minutes
             └─ L1  Bottleneck Observe → diagnose → change → settle       30 seconds–3 minutes
                 └─ L0  Pulse      Glance → collect → react                    1–10 seconds

Interrupt:  Incident  Alert → triage → mitigate → resolve → postmortem
```

## L0: Pulse (1–10 seconds)

The player glances at the board.

1. **Glance.** Particles move. A card turns amber. The $/s number ticks.
2. **Collect.** Revenue piles up in the **Payments** drawer. The player clicks to collect it.
   Research "Stripe Billing" automates this
   ([Progression](./10-progression.md#track-product-and-business)).
3. **React.** The player clicks Upgrade on a red card, or ignores it.

The pulse exists so that an idle player always has a small, satisfying action available. It becomes
automatic by the end of the Garage Era, because a pulse that never changes becomes a chore
([pillar 5](./01-vision.md#pillar-5-respect-the-player)).

## L1: Bottleneck (30 seconds to 3 minutes)

This is the core loop. It is Factorio's loop, applied to requests.

```text
OBSERVE ──► DIAGNOSE ──► CHANGE ──► SETTLE ──► MEASURE
   ▲                                              │
   └──────────── the bottleneck moves ────────────┘
```

| Step     | What the player does                                                                          | What the game provides                                                                           |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Observe  | Reads the board: load bars, stranded requests, latency, errors.                               | Node cards and the bottleneck marker ([Interface](./15-ui-ux.md#node-cards)).                    |
| Diagnose | Asks why. Is the box out of CPU, out of workers, out of memory, or waiting on the database?   | The diagnosis depends on how much the player can see ([Observability](./12-observability.md)).   |
| Change   | Picks one action: upgrade, place, rewire, change runtime, change a setting, or remove a Node. | Each action has a cost and a Tradeoff card ([Interface](./15-ui-ux.md#tradeoff-cards)).          |
| Settle   | Waits a few seconds while queues drain and caches warm.                                       | The HUD shows "Settling" and then "Stable" ([Interface](./15-ui-ux.md#feedback-after-a-change)). |
| Measure  | Compares $/s, p99, and error rate before and after.                                           | A delta toast, for example "+$1.40/s (+18%), p99 −120 ms".                                       |

Rules that keep this loop deep:

- **One tightest Node.** The simulation is a flow network. At any time, one Node limits each request
  path ([Simulation](./04-simulation.md#the-bottleneck)).
- **Several kinds of bottleneck.** A Node can run out of CPU, workers, memory, connections, disk
  I/O, or network. The fix differs for each. More hardware fixes only some of them.
- **Fixes have side effects.** A cache removes database load and adds staleness. A replica adds read
  capacity and adds replication lag. More app servers add database connections.
- **The bottleneck moves downstream and upstream.** Faster app servers send more queries to the
  database. A faster database lets app servers finish sooner, which frees workers.

## L2: Growth (5 to 20 minutes)

```text
         ┌────────── Apdex ≥ target ──────────┐
         ▼                                    │
     USERS ↑ ──► DEMAND ↑ ──► LOAD ↑ ──► (L1 loop) ──► SERVED ──► CASH ──► CAPACITY
                                                          │
                                                          └──► SAMPLED ──► INSIGHT ──► RESEARCH
                                                                                            │
     DEV HOURS ──► FEATURES ──► more demand per user, new mix, more revenue per request ◄──┘
```

- **Users** grow while the design keeps [Apdex](./glossary.md#apdex) above the Era target, and they
  leave when it drops ([Simulation](./04-simulation.md#users-and-growth)).
- **Cash** buys capacity. **Insight** buys research. **Dev Hours** buy features, migrations, and
  fixes ([Economy](./09-economy.md)).
- **Features** raise revenue and change the request mix. A successful feature creates load, so it
  feeds the L1 loop again ([Team and velocity](./08-team-and-velocity.md#features)).
- Growth follows an S-curve toward the Era's market size, so growth slows near the cap. The player
  needs a new Era, a new feature, or a new region to grow further
  ([Balancing](./16-balancing.md#user-growth)).

## L3: Era (30 to 120 minutes)

An **Era** is a stage of the company, from Garage to Public. When users reach the Era's milestone,
the player can raise a funding round.

```text
MILESTONE ──► RAISE (or decline) ──► GRANT + NEW KINDS + NEW CONSTRAINT ──► REDESIGN ──► MILESTONE
```

Each Era is a phase shift: it changes what the player optimizes.

| Era      | The question the player answers                                    |
| -------- | ------------------------------------------------------------------ |
| Garage   | How far does one box go?                                           |
| Pre-seed | What happens when the database is the bottleneck?                  |
| Seed     | How do I handle work that is not alike: CPU-heavy, abusive, large? |
| Series A | How do I stay up when parts fail, and keep money correct?          |
| Series B | How do I separate analytics from transactions, and scale the team? |
| Series C | How do I serve the whole planet and fan out to millions?           |
| Pre-IPO  | Can I prove reliability and make a profit?                         |
| Public   | Can I beat the quarter, every quarter?                             |

[Progression](./10-progression.md#eras) lists the milestones, grants, kinds, and unlocks.

## L4: Company (6 to 15 hours)

```text
FOUND (pick a Venture, Mutators) ──► Eras ──► EXIT ──► LEGACY ──► FOUND the next company
```

- An **Exit** ends a company. Its payout depends on Equity and valuation
  ([Exit and Legacy](./13-prestige.md#exits)).
- **Legacy** buys permanent perks, Playbooks, and new Ventures.
- A **Venture** changes the rules of the next company: its request mix, its constraints, and its
  incidents. A fintech company and a game backend need different designs
  ([Exit and Legacy](./13-prestige.md#ventures)).

The first company takes 9 to 12 hours. Later companies take 3 to 6 hours, because Legacy speeds
the early Eras and Playbooks remove repeated setup.

## L5: Mastery (unbounded)

- **Challenges.** Fixed puzzles inspired by real events. Each one scores cost, p99, and complexity on
  three histograms ([Challenges](./14-challenges.md)).
- **Daily drill.** A seeded incident that every player gets on the same day.
- **Public Era quarters.** An endless mode in which the player must beat growth and margin targets
  each quarter ([Progression](./10-progression.md#era-7-public)).
- **Achievements.** Achievements reward knowledge and unusual builds, not hours played.

## Interrupt: the incident loop

Incidents break into any loop from the Pre-seed Era on.

```text
SIGNAL ──► TRIAGE ──► MITIGATE ──► RESOLVE ──► POSTMORTEM ──► ACTION ITEMS
```

| Step         | Detail                                                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signal       | Without alerting, the player notices red cards or a user drop. With alerting, a pager banner appears earlier ([Observability](./12-observability.md#alerting)). |
| Triage       | The player finds the affected Node and the cause.                                                                                                               |
| Mitigate     | A fast, temporary action: roll back, shed load, block traffic, fail over, or scale up.                                                                          |
| Resolve      | The incident ends, or the cause is removed.                                                                                                                     |
| Postmortem   | The postmortem opens an action item. Until its research is owned, the incident is twice as likely ([Incidents](./11-incidents.md#postmortems)).                 |
| Action items | Optional Dev Hour tasks that prevent the same class of incident, such as idempotency keys or a runbook.                                                         |

## Pacing

The pacing model targets a steady stream of goals, as Factorio does
([Influences](./02-influences.md#factorio)).

| Phase                      | Time since start | A new goal every | Typical goal                                     |
| -------------------------- | ---------------- | ---------------- | ------------------------------------------------ |
| First minutes              | 0–5 min          | 30–60 s          | Collect, upgrade the box, split the database out |
| Garage                     | 5–20 min         | 1–3 min          | First research, first load balancer              |
| Pre-seed and Seed          | 20 min–2 h       | 2–5 min          | Cache, pooler, queue, first hire, first incident |
| Series A and B             | 2–6 h            | 5–10 min         | Zones, replicas, warehouse, GPU, service split   |
| Series C and Pre-IPO       | 6–10 h           | 10–20 min        | Regions, quorum stores, compliance, cost work    |
| Public and later companies | 10 h+            | 10–30 min        | Quarter targets, Ventures, Challenges            |

The [Balancing](./16-balancing.md#pacing-model) document holds the curves behind these targets and
the scripted players that check them.

## Session shapes

| Session  | Length    | What happens                                                                                    |
| -------- | --------- | ----------------------------------------------------------------------------------------------- |
| Check-in | 2–5 min   | Collect offline earnings, buy research, queue a feature, leave.                                 |
| Standard | 30–60 min | Several bottleneck loops, one Era milestone or one large redesign.                              |
| Deep     | 2–4 h     | A full Era, a migration, or a Challenge set.                                                    |
| Idle     | Hours     | The design runs. Users grow only while the design holds the SLO. Incidents do not fire offline. |

Offline rules are in [Simulation](./04-simulation.md#offline-progress).
