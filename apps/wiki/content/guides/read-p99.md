---
title: Read p99 and tail latency
summary: Read the p99 on the HUD, the Users Node, and each card, find the request kind and the Node that make the tail, and pick the fix for its cause.
section: guides
order: 2
era: 1
aliases: p99, p95, p50, percentile, tail latency, slow requests, mean latency, latency
gdd: docs/gdd/12-observability.md
---

Use this guide when Apdex is under target but the mean latency looks fine, or when the p99 on the
HUD is much higher than the mean.

The p99 is the time that 99 requests out of 100 beat. The slowest 1% sit above it. A mean hides
that 1%, but your users still feel it and pay less for it. See
[Latency and percentiles](/explanation/latency) for the reason.

## Before you start

You need the [Percentiles](/research/percentiles) Research. It opens in the Pre-seed Era and needs
[Metrics](/research/metrics) first. Without it, the game shows only the mean.

## Read the p99

1. Look at the latency figure on the HUD. With Percentiles it reads **p99**, and the mean shows
   next to it after **μ**.
2. Compare the two values.
   - If the p99 is a few times the mean, the tail is normal for a busy Design.
   - If the p99 is ten or more times the mean, a small share of requests is very slow. Continue
     with step 3.
3. Select the **Users** Node. The Inspector opens.
4. In the **Requests** section, read the line under each request kind. It shows the mean, p50,
   p95, and p99 of that kind.
5. Find the kind whose figures show in amber. Amber means its p99 is above its Apdex target.
   A red figure means the kind also fails often.

Each kind has its own target. An API read must be fast. A report can take seconds. The
[Request mix of each Era](/eras) lists the kinds you serve.

## Find the Node that makes the tail

6. Read the **Latency** row on each Node card. With Percentiles it shows the mean and then the p99.
7. Follow the path of the slow kind from the Users Node to the data tier.
8. Find the first Node whose p99 jumps far above its mean.

## Match the pattern to the cause

9. Use the table to name the cause, and apply its fix.

| What you see                                                             | Cause                                                                                   | Fix                                                                                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The Node is amber or red on Load, and every kind on it is slow.          | Queueing near full capacity.                                                            | Add capacity. See [Find the bottleneck](/guides/find-the-bottleneck).                                                                                        |
| A Node.js App Server has a high p99 on every kind, and logins are on it. | One CPU-heavy request blocks the [event loop](/glossary/event-loop).                    | Research [libuv thread pool](/research/libuv-pool), place an [Auth Provider](/components/auth), or use [Node.js cluster](/research/node-cluster).            |
| A Java or Go App Server has a normal p50 and a high p99.                 | [Garbage collection pauses](/glossary/gc-pause).                                        | Select **Larger** for more RAM. For Java, pick ZGC in **Collector** ([ZGC](/research/zgc)). For Go, change **GOGC** ([Go GC tuning](/research/gogc-tuning)). |
| The p99 rises just after new Java copies start.                          | [JIT warmup](/glossary/jit-warmup): new copies run slowly at first.                     | Keep copies warm with a higher minimum on the [Autoscaler](/components/autoscaler).                                                                          |
| The p99 is high only on one Node that many requests call.                | [The tail at scale](/glossary/tail-at-scale): one slow backend slows the whole request. | Fix that backend first.                                                                                                                                      |

10. Wait a short time of game time after the change.
11. Check that the amber figures under the Users Node return to plain.
12. Check that Apdex on the HUD moves up.

If the p99 does not change, the cause is on another Node of the path. Go back to step 7.

:::Note{tone="tip"}
The p99 of a kind matters most when it passes the kind's target. A request slower than the target
earns half. A request four times slower than the target earns nothing.
:::

## See the tail over time

- Press **D** to open the Dashboard. The **Latency** chart draws the mean with the p50, p95, and
  p99 lines. Look for the moment when the p99 left the others.
- Select **Users** on the HUD to open **Why users leave**. A `slow` row shows the kind's p99
  against its target, and it names the share of Apdex that the kind costs you.
- Research [Alerting](/research/alerting) to get a pager banner when the p99 stays high.

## Practice

The Event Loop Stall Sandbox runs Node.js with logins on the same App Server. Keep the p99 under
its limit when password hashing gets slower.

::Sandbox{id="event-loop-stall"}

For garbage collection, try the [GC Pauses](/sandboxes/gc-pauses) Sandbox.

## Related

- [Percentile (p50, p95, p99)](/glossary/percentile-p50-p95-p99) in the glossary.
- [Apdex and revenue](/explanation/apdex-and-revenue) explains how slow requests lose money.
