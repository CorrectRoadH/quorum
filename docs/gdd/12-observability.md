# 12. Observability and Insight

[Index](./README.md) · Previous: [Incidents](./11-incidents.md) · Next: [Exit and Legacy](./13-prestige.md)

A Hacker News comment on Factorio says: "The only thing preventing you from doing this to your
application is the lack of visibility into the problems." Quorum makes visibility a progression track.
The player starts with almost nothing, like a real early startup, and earns better tools. This is fog
of war for systems.

Observability does two jobs:

1. It produces **Insight**, the research currency.
2. It decides what the player can **see**.

## Earning Insight

**Analytics** is a tap ([Components](./05-components.md#analytics)). Each Node linked into it sends a
sample of its traffic.

```text
sampled_rps(node)  = λ(node) × sample_rate
insight_per_second = Σ_nodes sampled_rps(node) × yield(kind) × multipliers
```

| Term          | Value                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `sample_rate` | A setting: 1%, 5%, 10% (default), 50%, or 100%.                                                                |
| `yield(kind)` | 0.5 Insight per sampled request, × 2 for failed or slow requests (they teach more), × 0 for `bot`.             |
| Multipliers   | JVM services +25% ([Runtimes](./06-runtimes.md#java)), Service Mesh +20%, `tail-sampling` × 2 for kept traces. |

Analytics has a capacity in samples per second. Samples beyond it are dropped.

### The cost of seeing

Sampling is not free. That is real, and observability bills are a common surprise.

| Sample rate | CPU overhead on tapped Nodes | Storage Burn | Insight |
| ----------- | ---------------------------- | ------------ | ------- |
| 1%          | +0.1%                        | 0.1×         | 0.1×    |
| 10%         | +1%                          | 1×           | 1×      |
| 50%         | +3%                          | 5×           | 5×      |
| 100%        | +5%                          | 10×          | 10×     |

So the player chooses: more Insight now, or more capacity and less Burn. Research `tail-sampling`
improves the deal by keeping the interesting traces.

### Other Insight sources

| Source              | Amount                                                            |
| ------------------- | ----------------------------------------------------------------- |
| Postmortems         | By severity and MTTR ([Incidents](./11-incidents.md#postmortems)) |
| Load tests          | A one-time grant per test                                         |
| Chaos experiments   | A grant per experiment that finds a weakness                      |
| First time per kind | A one-time grant the first time the design serves a new kind      |

## The visibility ladder

| Step | Research            | Era      | What the player can now see                                                                                                                                      |
| ---- | ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Starting view       | Garage   | Load bars, inbound rps, mean latency, a red "Stranded" row, the bottleneck marker. Errors as one number.                                                         |
| 1    | `logs`              | Garage   | The error breakdown by cause: `timeout`, `refused`, `oom`, and the rest ([Simulation](./04-simulation.md#errors)).                                               |
| 2    | `metrics`           | Garage   | A history graph on each Node card for the last calendar day. Before this, the player sees only "now".                                                            |
| 3    | `percentiles`       | Pre-seed | p50, p95, and p99 on cards and the HUD. The mean is still shown, so the player sees how much it hides.                                                           |
| 4    | `alerting`          | Pre-seed | A pager banner when thresholds are crossed ([Alerting](#alerting)).                                                                                              |
| 5    | `tracing`           | Seed     | Click a request kind to see a waterfall of its path: time per hop, waiting versus working. The bottleneck marker works per kind.                                 |
| 6    | `slo-dashboards`    | Series A | The error budget panel and burn rate.                                                                                                                            |
| 7    | `profiling`         | Series A | Each card names its limiting resource: CPU, workers, memory, connections, network, GC, or event-loop blocking ([Runtimes](./06-runtimes.md#the-capacity-model)). |
| 8    | `tail-sampling`     | Series B | Slow and failed traces are kept; Insight doubles for them.                                                                                                       |
| 9    | `rum`               | Series C | Latency per region and device, from the user's side, including the internet hop.                                                                                 |
| 10   | `anomaly-detection` | Series C | Warnings before an incident peaks, and a forecast of tomorrow's peak.                                                                                            |

### What the player sees at each step: an example

The same problem, a database at 95% utilization behind PHP-FPM servers, seen at three steps:

| Step | What the board shows                                                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | The App Servers are red with full load bars. The database is amber. The bottleneck marker is on the database. Mean latency 180 ms.                          |
| 3    | Same, plus p99 1.4 s. The player sees that some users wait more than a second.                                                                              |
| 7    | The App Server card says "Limit: workers (20/20), CPU 22%". The database card says "Limit: CPU 95%". The player knows that more App Servers would not help. |

The player can solve the problem at step 0 by trusting the bottleneck marker. At step 7 they
understand why, and they can predict the effect of a change before they make it.

## Alerting

With `alerting`, the player can set alert rules. The defaults:

| Alert           | Condition                                               |
| --------------- | ------------------------------------------------------- |
| High error rate | Error rate above 1% for 30 s                            |
| High latency    | p99 above 4× the kind's Apdex T for 30 s                |
| Saturation      | Any Node above 90% utilization for 60 s                 |
| Queue growth    | Queue depth growing for 60 s                            |
| Budget burn     | Error budget burning more than 10× the sustainable rate |

Alerts that fire too often lower their own value: after five false alarms in a calendar day, the
banner shows "Ignored" and the player must tune the rule. This is alert fatigue, and it is real.

## The Ledger and what is hidden

The Ledger always holds every number. Visibility research changes what the UI shows, not what the
simulation computes. A player who has not researched `percentiles` still loses revenue to slow
requests. They just cannot see the p99.

The bottleneck marker is always visible. It is the safety net that keeps the game playable at step 0.
