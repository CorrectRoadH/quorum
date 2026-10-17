# Architect: game design overview

Version 1.1. This overview replaces the earlier handoff document. It drops the technical stack
section, because the stack is fixed, and it records the decisions taken since. The vocabulary
lives in [CONTEXT.md](../CONTEXT.md), and the reasoning behind the load-bearing choices lives
in [docs/adr](./adr).

## 1. What the game is

A learning game about system design. A player assembles an architecture from a fixed catalog,
runs it for one simulated month, and is then scored on what that architecture did.

Three ideas carry the game:

- The diagram is the input. The player changes the design by placing and connecting Components.
- The Ledger is the truth. Every figure the game shows is derived from the simulation.
- Every choice costs something. There are no free wins and no definitions, only tradeoffs.

The first version is single-player ([ADR 0001](./adr/0001-single-player-first.md)). Roles exist
as hats, not as separate owners.

## 2. The core loop

```text
DESIGN  ──►  DEPLOY  ──►  OBSERVE  ──►  ADAPT  ──►  SCORE
(canvas)     (run)        (metrics     (spend       (report
                          table and    Capital)      card)
                          graphs)
```

A run is one month ([ADR 0002](./adr/0002-a-run-is-one-bounded-month.md)). The player starts
with a small design and a small Capital. Demand grows during the month. The player watches the
metrics table, reacts, and scales the design while the clock moves. The month ends and the
report card lands.

Target session length: 15 to 25 minutes.

## 3. The economy

| Term    | Meaning                                                                |
| ------- | ---------------------------------------------------------------------- |
| Capital | The money held. Placing a Node spends it, and served requests earn it. |
| Burn    | The monthly cost a Node accrues while it exists.                       |
| Income  | The money earned per request the design serves.                        |

Rules:

- Placing a Node costs Capital up front. Removing a Node returns nothing, but it stops the Burn.
- Burn is charged each Tick. Removing a Node at the right moment is therefore a real decision.
- Demand grows during the month, so Income grows with it, and so does the cost of keeping up.
- When Capital runs out, the design sheds the Nodes it can no longer pay for, one at a time, and
  the player watches it degrade. A run ends when Capital stays empty.
- Leftover Capital carries into the next Scenario, so progression lives across Scenarios.
- Idle capacity is the enemy. The report card judges money kept and requests served, not money
  spent.

## 4. What is faithful, and what the game invents

A faithful Kubernetes simulation runs the cluster
([ADR 0004](./adr/0004-faithful-cluster-mechanics.md)). Pods, deployments, replicas, rollout,
probes, restarts, crash loops, services, DNS, and endpoint routing behave like Kubernetes.

The game invents everything the player is scored on: demand, latency under load, capacity,
request failures, Burn, and Income. The cluster simulation does not model resource requests and
limits, node capacity, or autoscaling, so those numbers cannot come from it.

The two meet at one point: the latency model reads real cluster state. A crash loop, an endpoint
that leaves rotation, or a replica that never becomes ready all worsen the score, so the
faithful layer and the invented layer tell one story.

## 5. Components

The catalog has two families.

| Family            | Behaviour                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Cluster Component | Maps to Kubernetes resources in the simulated cluster, and therefore appears in the generated Manifest. |
| Managed Component | Exists outside the cluster, is modelled entirely by the game, and never appears in the Manifest.        |

The Manifest is a read-only teaching artifact. The player never edits it, because the diagram is
the input.

The item list and each item's family are still open; see section 14.

## 6. The simulation

**Time.** One Tick is one step of simulated time. A run covers 900 Ticks, which the game calls
the month.

**Traffic.** Each Tick sends a fixed sample of requests into the design
([ADR 0006](./adr/0006-sample-traffic-per-tick.md)). The money model scales that sample up to
the demand curve. The sample rate is Scenario data and is visible to the player.

**Capacity.** Each Component has a capacity in requests per second and a separate backlog limit
in requests. The backlog grows while demand exceeds capacity, latency grows with the backlog,
and requests fail once the backlog passes the limit. This is what makes the p99 rise before the
errors appear.

**Load.** Latency rises with utilization and with queue depth. A Component that sits near its
ceiling is slow before it fails.

**Caches and staleness.** A cache reduces read latency and introduces staleness. Staleness is an
error: a read that follows a write inside the TTL window returns the old value and counts as a
failed request. Write-through removes the staleness and adds write latency. This is the game's
cleanest tradeoff, and it is the one the first playable build exists to test.

**Failures.** Failures come from the Scenario, and from a manual inject control that does not
affect the score. A Component stays down while the causing event lasts, then restarts. A failed
Component keeps billing, so a dead Node is a Node the player still pays for. A zone failure
takes one Node of the fixed cluster down for its full duration.

## 7. The design surface

- Drag a Component from the palette onto the canvas to place a Node.
- Connect any Node to any Node. There is one connection type and one rule function that decides
  what a connection means for a pair. Typed ports are dropped.
- Traffic enters any Node that has no inbound connection. That is also the entry rule the
  validator uses, so "no orphan app servers" becomes one clear error instead of a special case.
- One configuration surface: the Tradeoff card holds the choices, and the panel holds the
  numbers such as instance count and TTL seconds.
- Validation blocks structural impossibilities only, such as a Component with no path from the
  traffic entry. Everything else is allowed to run and fail, because that failure is the lesson.

## 8. The Ledger and the metrics table

The metrics table presents the Ledger during a run: one row per Node, sorted by category, with
its configuration, Burn, incoming rate, capacity, utilization, p50, p99, errors, and status.

- Rows update a few times a second, not every Tick.
- Hovering a row highlights the Node on the canvas, and the reverse holds too.
- Utilization above 80 percent turns the row amber, above 95 percent red.
- The header shows the calendar, the current load, the p95, the error rate, and Capital against
  Burn.
- Graphs above the table show latency over time, throughput with error rate, and cumulative
  money against Income.

## 9. Roles

Three Roles, worn as hats: Edge Lead, Data Lead, and Platform Lead. A Role groups Components in
the palette and shows that owner's objective and its own slice of the report card. There is one
Capital, so the hats teach that different owners want different things without pretending that
money is separate.

## 10. Tradeoff cards

A card belongs to a configuration choice, not to a Component, so one card can serve several
Components. A card is a forced choice with the consequence of each option written on it, and it
collapses after the first time the player places that Component in a run. After the run, the
report card quotes the cards the player engaged with and what each choice cost.

## 11. Scoring and the report card

| Axis        | What it measures                                                   |
| ----------- | ------------------------------------------------------------------ |
| Reliability | Requests served, and survival through injected failures            |
| Performance | Latency against the Scenario target                                |
| Simplicity  | Accidental complexity: unnecessary Nodes and needless dependencies |
| Money       | Capital earned and kept through the month                          |

Stars require the Scenario targets. A run that misses every target cannot earn a star, which
removes the reward for failure in the earlier version of this document.

## 12. Content plan

Six Scenarios, re-cut for the economy.

| Build order | Scenario      | Teaches                                                         |
| ----------- | ------------- | --------------------------------------------------------------- |
| 1           | The Blog      | The loop itself: one app, one database, a first failure         |
| 2           | Incident: 3AM | Diagnosis from the metrics table, under time and money pressure |
| 3           | Read-Heavy    | Cache staleness against speed                                   |
| 4           | The Spike     | Demand growth against capital                                   |
| 5           | Zone Down     | Resilience inside a fixed cluster                               |
| 6           | Cut 30%       | Right-sizing when the money shrinks                             |

Each Scenario owns its brief, demand curve, starting Capital, Income, duration, sample rate,
fixed cluster size, allowed Components, targets, and failures.

## 13. Out of scope for v1

Multiplayer, accounts and saved history, an endless mode, stateful storage and volumes,
autoscaling, a scenario editor, native clients, and 3D rendering.

## 14. Open questions

- **The catalog item list.** Which Components exist, and which family each one belongs to. This
  is the one open item that blocks implementation.
- **The diagram renderer.** Real elements on a pan and zoom plane, or pixels drawn on a canvas.
- **Multiplayer snapshot, reconnect, and late join.** The simulation engine has no cluster
  snapshot, so a resumed run needs the game's own serialized view rebuilt by replay.
- **Balance constants.** Every price, capacity, and curve in v1 is a placeholder.
- **Incident-mode scoring.** How time-to-fix and cost-of-fix are weighed.

## 15. Where the decisions live

- [CONTEXT.md](../CONTEXT.md) owns the vocabulary.
- [ADR 0001](./adr/0001-single-player-first.md): single-player first.
- [ADR 0002](./adr/0002-a-run-is-one-bounded-month.md): a run is one bounded month.
- [ADR 0003](./adr/0003-server-authoritative-simulation.md): the server owns the simulation.
- [ADR 0004](./adr/0004-faithful-cluster-mechanics.md): the faithful boundary.
- [ADR 0005](./adr/0005-keep-the-kubernetes-port-behind-one-adapter.md): the simulation dependency.
- [ADR 0006](./adr/0006-sample-traffic-per-tick.md): traffic sampling.
