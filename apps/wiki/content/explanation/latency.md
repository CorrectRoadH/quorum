---
title: Latency and percentiles
summary: Where a request's time goes, why the mean hides your slowest users, and how the game computes p50, p95, and p99.
section: explanation
order: 2
aliases: latency, p99, p95, p50, percentile, tail latency, mean, fan-out, gc pause
gdd: docs/gdd/04-simulation.md
---

Latency is the time a user waits for an answer. Quorum computes it for every request kind on every
path through your Design. Latency decides how much each request earns and whether users stay, so it
is worth understanding where the time goes.

## Where the time goes

A request's latency is the sum of every hop on its synchronous path. Each hop adds four parts:

- **Fixed overhead.** Every Component adds a small base latency. The first hop, across the internet
  from Users to your edge, is the largest one in a small Design.
- **Service time.** The CPU time the work needs, divided by the runtime's speed, plus I/O on data
  Nodes.
- **Queueing wait.** The time a request waits for a free slot. It grows sharply as a Node fills up.
  See [Capacity, utilization, and queues](/explanation/queues).
- **Network.** A call inside one zone is cheap. A call to another zone costs more, and a call to
  another region pays the round trip.

On top of these, rare **tail events** hit a small share of requests: a garbage collection pause, an
event loop stall, a cold start. They add a lot of time to a few requests.

An asynchronous hop does not add to what the user waits. A request that goes through a
[Queue](/components/queue) waits only for the enqueue. The game scores those kinds on when the
result is ready instead.

## Why the mean lies

Queueing and service time do not give every request the same latency. The game models them like the
textbook single-server queue: response times follow an exponential curve. Most requests are fast and a
long tail is slow. On that curve, the 99th percentile is about 4.6 times the mean of the variable part.

So a mean of 100 ms can hide users who wait half a second. And the mean barely moves when a tail
event hits 2% of requests, because 98% of requests are unchanged. The p99 moves a lot.

A [percentile](/glossary/percentile-p50-p95-p99) answers a better question: "How slow is the
slowest share of my users?" The p50 is the typical request. The p95 and p99 are your unlucky users,
and on a busy site they are many people.

::Quiz{question="A GC pause adds 150 ms to about 2% of the requests on one App Server. Which number moves the most?" options="The mean|The p50|The p99" answer="3" explain="Only the slowest few percent of requests get the pause, so it lands in the p99. The p50 does not change, and the mean rises only a little."}

## What you see and when

The Garage view shows mean latency. The [Percentiles](/research/percentiles) research adds the p99
to the HUD and p50, p95, and p99 to each request kind. The Ledger computes percentiles from the start,
and slow requests cost you revenue before you can see them. Research changes only what the screen
shows.

The game computes a percentile from the model's distribution, not from a sample. The fixed parts add
directly. The exponential part sets the curve. Tail events land on the slowest share of requests,
equal to their probability. For how to act on the number, see [Read p99](/guides/read-p99).

## Tails add up along a path

A request collects the tail events of every Node on its path. If one Node stalls 1% of requests and
the next stalls 1%, a request that crosses both has about a 2% chance to stall. The game combines two
chances `a` and `b` as `1 − (1 − a)(1 − b)`. A long chain of Nodes that each stall now and then has a
worse p99 than any one of them.

Fan-out makes this worse. When one request makes many backend calls and waits for all of them, the
slowest call decides its latency. A pulled feed reads many posts per request, so its tail is long.
This is [the tail at scale](/glossary/tail-at-scale) and [fan-out](/glossary/fan-out).

:::Note{tone="real"}
Jeff Dean and Luiz Barroso described this in "The Tail at Scale" (2013). If one server is slow on 1%
of requests and a page calls 100 servers, most page loads hit at least one slow server. Large
services fight the tail with hedged requests, timeouts, and fewer hops on the critical path.
:::

## Runtimes shape the tail

Some tail events come from your Stack:

- **Garbage collection.** When an App Server's heap is nearly full, its collector pauses a small
  share of requests. The length depends on the runtime and the collector.
- **Event loops.** On Node.js, one CPU-heavy request, such as a password hash at login, stalls every
  request behind it on that loop.
- **Cold starts.** A new or restarted App Server runs slowly until it warms up, so scaling out during
  a peak can make the p99 worse for a while.

These show in the p99 long before they move the mean. The [Runtimes](/runtimes) pages list each
runtime's behavior, and the glossary explains [GC pauses](/glossary/gc-pause),
[the event loop](/glossary/event-loop), and [JIT warmup](/glossary/jit-warmup).

::Sandbox{id="gc-pauses"}

## Timeouts cut the tail, at a price

A Link waits for an answer up to its timeout. A request that waits longer fails as a `timeout`. A
short timeout keeps a slow callee from holding the caller's slots for long, but it turns slow
requests into failed ones. See [Errors and retries](/explanation/errors-and-retries) for how that
trade works.
