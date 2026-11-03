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

| Source              | Amount                                                       |
| ------------------- | ------------------------------------------------------------ |
| Load tests          | A one-time grant per test                                    |
| Chaos experiments   | A grant per experiment that finds a weakness                 |
| First time per kind | A one-time grant the first time the design serves a new kind |

## The visibility ladder

| Step | Research            | Era      | What the player can now see                                                                                                                                      |
| ---- | ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Starting view       | Garage   | Load bars, inbound rps, mean latency, a red "Stranded" row, the bottleneck marker. Errors as one number.                                                         |
| 1    | `logs`              | Garage   | The error breakdown by cause: `timeout`, `refused`, `oom`, and the rest ([Simulation](./04-simulation.md#errors)).                                               |
| 2    | `metrics`           | Garage   | A history graph on each Node card for the last calendar day, and [the Dashboard](#the-dashboard). Before this, the player sees only "now".                       |
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

## The Dashboard

The Board shows the system **now**. The **Dashboard** shows it **over time**. It is a full-screen
view of Charts, with the look of a Grafana dashboard, from the Monitoring sender Grafauna
([Mail](./18-mail.md#senders)). It opens with `D` once `metrics` is researched, and each later
visibility step adds Charts to it. The player does not buy the Dashboard with its own research.
It grows as they climb the ladder.

### The Dashboard and pillar 4

[Pillar 4](./01-vision.md#pillar-4-the-board-is-the-dashboard) says that the Board is the
dashboard. The Dashboard keeps that rule because it answers only questions about time and
correlation, which the Board cannot answer:

- Did p99 go up after that deploy, or after that resize?
- What happened during the 03:00 spike while I was away?
- Which Node saturated first, and which ones followed?
- Is the error budget burning faster this week than last week?

Rules:

1. **No number is only on the Dashboard.** Every value on a Chart's last point is also on a Node
   card, the HUD, or a panel. The Dashboard adds history, not new facts.
2. **The bottleneck stays on the Board.** The Dashboard has no bottleneck marker. Test: during
   normal play, the player can still find the bottleneck without the Dashboard.
3. **It shows only what the player has researched.** It follows
   [the Ledger and what is hidden](#the-ledger-and-what-is-hidden): a Chart that needs a later step
   shows as a greyed tile that names the research, as in "No data. Research `tracing`."
4. **It works while paused.** The player can study the past while time stands still.

### How real teams build dashboards

The Dashboard copies the methods that real teams use, so that what the player learns transfers.

| Practice                    | What it is                                                                                                                                                      | In the Dashboard                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Four golden signals         | Google SRE: if you can measure only four things about a user-facing system, measure latency, traffic, errors, and saturation.                                   | The Overview row is the four signals.                                                                         |
| RED method                  | Rate, Errors, Duration for each service. It measures what users feel, so alerts go here.                                                                        | One row per Service, with request rate, errors, and latency side by side.                                     |
| USE method                  | Utilization, Saturation, Errors for each resource. It measures causes.                                                                                          | One row per Node for the data tier and with `profiling`.                                                      |
| One row per service         | Grafana's best practice: the layout follows the service hierarchy, rate and errors on the left, duration on the right.                                          | Rows follow the Board: edge, App Servers, Workers, data tier, Managed Components.                             |
| Annotations                 | Vertical markers for deploys, incidents, and maintenance, so a change in a graph has a visible cause.                                                           | Markers for deploys, incidents, Design changes, research, and Eras.                                           |
| Shared crosshair            | Hover on one panel draws the same moment on every panel.                                                                                                        | On by default.                                                                                                |
| Template variables          | Drop-downs at the top, such as service, instance, or environment, that filter every panel.                                                                      | Service, Request kind, and Region.                                                                            |
| Percentiles from histograms | Prometheus records latency in buckets and computes `histogram_quantile(0.99, ...)` at query time. Percentiles cannot be averaged across instances; buckets can. | p50, p95, and p99 lines. The mean stays on the Chart, so the player sees how much it hides.                   |
| Burn rate                   | How fast an SLO spends its error budget. A burn rate of 1 spends exactly the whole budget in the SLO window.                                                    | The SLO row, with lines at 1× and at the 10× of the Budget burn alert.                                        |
| Exemplars                   | Points on a metric graph that link to one trace of a real request.                                                                                              | Dots on latency Charts that open the trace waterfall, with `tracing`.                                         |
| Downsampling and retention  | Thanos keeps raw samples, then 5-minute blocks after 40 hours and 1-hour blocks after 10 days. Each block stores min, max, sum, and count.                      | Three resolutions, each keeping min, max, sum, and count ([History and resolution](#history-and-resolution)). |
| Cardinality                 | Every label combination is a new time series. Labels such as user ID make the storage bill explode.                                                             | Series are per Node, per Request kind, and per Region only, never per request or per User.                    |
| Logs, traces, and profiles  | Grafana's stack adds Loki (logs), Tempo (traces), Pyroscope (profiles), and Faro (real user monitoring) next to Prometheus metrics.                             | The visibility ladder: `logs`, `tracing`, `profiling`, and `rum` each add their signal.                       |

### Charts by research

Each visibility step adds a row. A row appears only when its research is owned.

| Research            | Row             | Charts                                                                                                                                                                                                                         |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `metrics`           | Overview        | Stats for Users, Apdex, and Cash per second, each with a sparkline. Time series: demand against served (traffic), mean latency, errors, and utilization per Node with lines at 70% and 90% (saturation). Revenue against Burn. |
| `logs`              | Errors          | Errors per second as a stacked area by cause: `timeout`, `refused`, `oom`, and the rest.                                                                                                                                       |
| `percentiles`       | Latency         | p50, p95, and p99 with the mean. Latency per Node as a bar gauge for the selected moment.                                                                                                                                      |
| `alerting`          | Alerts          | A state timeline per alert rule: OK, pending, firing, and ignored. Threshold lines on the Charts that each rule watches.                                                                                                       |
| `tracing`           | Services (RED)  | One row per Service: rate, errors, and p99 per Request kind. Exemplar dots on the latency Charts.                                                                                                                              |
| `slo-dashboards`    | SLO             | Availability this calendar week as a stat, error budget left as a gauge, and burn rate over the last day. The HUD keeps availability and the budget left.                                                                      |
| `profiling`         | Resources (USE) | A state timeline per Node that colours its limiting resource: CPU, workers, memory, connections, network, GC, or event-loop blocking. Pool waits and queue depths.                                                             |
| `tail-sampling`     | —               | Exemplars prefer slow and failed requests, so the dots sit in the tail.                                                                                                                                                        |
| `rum`               | Users           | Latency per region and device from the user's side, including the internet hop.                                                                                                                                                |
| `anomaly-detection` | —               | A forecast band on the traffic and latency Charts, and a line at tomorrow's predicted peak.                                                                                                                                    |

### Component rows

Like the community dashboards for Postgres, Redis, nginx, or the JVM, each Component on the Board
adds its own row of the numbers that matter for it. A row appears the first time the Board holds
that Component, after `metrics`. Each Chart reads a number that the Ledger already holds; a Chart
whose number the Ledger does not hold yet is not built.

| Component         | Charts                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| Load Balancer     | Requests per backend Node, which shows uneven balancing                            |
| App Server        | Copies, busy workers against the pool, and with `profiling`, GC or event-loop time |
| Database          | Connections used against the limit, buffer cache hit ratio, and replication lag    |
| Cache             | Hit ratio and evictions                                                            |
| Queue             | Queue depth and the age of the oldest Task                                         |
| CDN               | Hit ratio and Egress                                                               |
| Managed Component | Calls, cost per hour, and outage state                                             |

### Annotations

Every time series shows vertical markers for the events that change a system. The player can turn
each group on and off.

| Group          | Marks                                                              | Colour |
| -------------- | ------------------------------------------------------------------ | ------ |
| Deploys        | Each deploy of a Service, and rollbacks                            | Blue   |
| Design changes | Nodes placed, resized, or removed; Links drawn; options changed    | Grey   |
| Incidents      | A shaded band from the start to the end of each Incident, with SEV | Red    |
| Research       | Each research item bought                                          | Purple |
| Company        | Eras, Funding rounds, and Features shipped                         | Green  |

Design changes are the most important group. The player changes the Board to fix a problem, and
the marker shows whether the line moved after the change. This closes the loop that the
[ghost-simulation preview](./15-ui-ux.md#feedback-after-a-change) opens before the change.

### Controls

- **Time range.** Last 1 hour, 6 hours (the default), 24 hours, 7 days, and 30 days, in calendar
  time. At 1× speed, 1 calendar hour is 1 real minute.
- **Compare.** Draws yesterday's line for the same time range as a faint line, so the player can
  separate the daily cycle from a real change. Grafana calls this a time shift.
- **Variables.** Service, Request kind, and Region filter every Chart. Region appears with the
  Series C Era.
- **Crosshair and focus.** Hover shows the same moment on every Chart. Clicking a Node's series
  selects that Node on the Board and closes the Dashboard.
- **Table view.** Each Chart can show its values as a table, for screen readers and for exact
  numbers ([Accessibility](./15-ui-ux.md#accessibility)).

The player cannot edit queries, add Charts, or move rows. The Dashboard teaches what to look at;
building dashboards is out of scope.

### History and resolution

The Simulation keeps only the last 600 one-second Samples of global numbers. The Dashboard needs
more, per Node, per Request kind, and over days, so the web app keeps its own history.

| Resolution        | Kept for          | Points per series |
| ----------------- | ----------------- | ----------------- |
| 1 calendar minute | The last 10 hours | 600               |
| 15 minutes        | The last 7 days   | 672               |
| 1 hour            | The last 30 days  | 720               |

Each point at a coarser resolution stores min, max, sum, and count, so a Chart can show the mean and
the worst value of a 15-minute block. A spike shorter than the block still shows in the max.

The history is client state, in the same way as Mail
([ADR 0006](../adr/0006-mail-is-client-state.md)). It is not part of the Game schema, so it
does not grow the Simulation's state or change replays
([ADR 0004](../adr/0004-simulation-package.md)). The save keeps it, and a save without it
starts with empty Charts. Offline progress has no per-minute history: the Dashboard shows the time
away as one band labelled "Away", with the values from the away card.

The error budget is the one exception: the Simulation already keeps it per calendar hour
(`BudgetHour`), so the SLO row reads it from the Game.

The Dashboard redraws once per real second, not on every frame.
