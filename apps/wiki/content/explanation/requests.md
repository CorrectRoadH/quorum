---
title: How requests flow
summary: How the game turns your Design and your users into demand, routes it through every Node, and finds the bottleneck.
section: explanation
order: 1
aliases: flow solve, demand, request kinds, backend kinds, stranded, simulation, ledger
gdd: docs/gdd/04-simulation.md
---

Every number in Quorum comes from one model. The game takes your Design and the current demand and
computes the **Ledger**: every rate, latency, error, and dollar on the screen. This page explains how
that model moves requests through your board, and why it behaves like a real system.

## Users send request kinds

Users do not send generic "traffic". They send **request kinds**, such as page views, API reads,
logins, and checkouts. Each kind has three properties that matter to you:

- **A value.** What one satisfied request earns. A checkout earns far more than a page view.
- **A cost profile.** How much CPU it needs on an App Server, and which backend calls it makes.
- **A patience target.** The Apdex target T, the latency under which a user is satisfied. See
  [Apdex and revenue](/explanation/apdex-and-revenue).

Each Era brings new kinds and changes the mix. In the Garage you serve only page views and API reads.
By Series A, users also stream video, chat, and buy things:

::Mix{era="3"}

The [Eras](/eras) reference pages list each Era's kinds and shares. Bots are a kind too. They earn
nothing and do not count toward Apdex, but they still use your capacity.

## App Servers turn requests into backend work

An App Server does not answer most requests alone. It turns each request into **backend kinds**: read
queries, write queries, transactions, searches, object reads and writes, tasks, charges, scans, and
inferences. For example, a page view sends two read queries to the database.

Backend kinds earn nothing by themselves. They carry load to the data tier and to managed services.
A request keeps its original kind on every hop, though. The read queries that a page view sends still
count as page-view traffic when Analytics samples the Database. That is why Insight has a request
kind.

## Demand follows the clock

Demand is your user count times the requests each user sends, shaped by the clock and the mix:

```text
demand(kind) = users × requests per user × daily cycle × weekly cycle × mix(kind) × features
```

The daily cycle peaks in the evening and falls in the morning, like real
[diurnal traffic](/glossary/diurnal-traffic). One sim second is one calendar minute, so a full day
passes in 24 real minutes at normal speed. You must choose: size for the peak and pay for idle
capacity at night, or let an [Autoscaler](/components/autoscaler) follow the curve. Your Venture sets
its own curve, and Features raise the use of the kinds they touch.

Incidents add demand on top. A traffic spike multiplies it, and attacks add bot traffic.

## The flow solve

Your Design is a graph with no loops. The game refuses a Link that would create one. In each Step of
a tenth of a sim second, the solve walks the graph from Users, one Node at a time, in order. At each
Node it does six things:

1. **Arrive.** The Node receives a rate for each kind.
2. **Accept or strand.** A Node passes on kinds it does not handle. If no Link out accepts a kind,
   those requests are **stranded** and count as errors.
3. **Serve.** The Node answers what it can itself. A Cache answers its hits.
4. **Transform.** An App Server turns requests into backend kinds.
5. **Split.** The rest goes out on Links. A [Load Balancer](/components/lb) splits by its algorithm,
   and other Nodes route by kind.
6. **Limit.** Capacity caps what the Node processes. See
   [Capacity, utilization, and queues](/explanation/queues).

## Why a slow database fills your App Servers

Many runtimes hold a worker or a thread for each request until every call it makes returns. So a
request occupies an App Server slot for its own CPU time plus the time it waits on the database. This
is [Little's law](/glossary/littles-law): slots in use equal the arrival rate times the time each
request stays.

That creates a circle. The App Server's capacity depends on the database's latency, and the
database's latency depends on how much the App Servers send. The solve resolves it by walking the
graph several times per Step and blending the call latencies until they settle.

:::Note{tone="real"}
This is why "the database is slow" often shows up in production as "the app servers are full". The
app servers are not busy computing. They are busy waiting. Adding more of them only sends more load to
the database.
:::

::Quiz{question="Your App Servers show full load bars, and your Database is amber. The App Servers run PHP-FPM. What is the most likely fix?" options="Add more App Servers|Make the Database faster|Raise the Users’ request rate" answer="2" explain="Each PHP-FPM worker waits for its database calls. A faster database frees the workers, while more App Servers send even more load to the database."}

Runtimes that wait without holding a slot, such as Node.js or Go, break this coupling. The
[Runtimes](/runtimes) pages show which model each runtime uses.

## The bottleneck marker

The board marks one Node as the **bottleneck**: the Node that costs you the most revenue now. The game
finds it with a real technique, a sensitivity analysis. Once per sim second, it takes the three
busiest Nodes above 60% utilization. It re-solves the whole Design with each one at double capacity,
and keeps the Node whose boost earns the most.

So the marker does not point at the reddest card. It points at the change that would pay. A Node at
95% that feeds an even slower Node may gain nothing from more capacity. For a step-by-step method, see
[Find the bottleneck](/guides/find-the-bottleneck).

## The same Design gives the same result

The model is deterministic. One seeded random generator in the save decides incident timing and
targets. Everything else follows from the Design and the clock. The Simulation uses only exact
arithmetic, so every browser and the server compute the same Ledger from the same actions. That is
what makes Challenge scores fair.
