---
title: Apdex and revenue
summary: How latency becomes money, why a slow request earns half, and where your revenue waits before it becomes Cash.
section: explanation
order: 5
aliases: apdex, revenue, income, satisfied, tolerating, frustrated, payments drawer, collect, value per request
gdd: docs/gdd/04-simulation.md
---

In Quorum, speed is money. A request earns its full value only if the user gets an answer fast
enough. The game measures "fast enough" with Apdex, a real industry score, and uses the same score to
decide whether users stay.

## Satisfied, tolerating, frustrated

Every request kind has a target time, T. A page view's T is longer than an API read's, because people
expect a page to take a moment. Each served request falls into one class:

| Class      | Condition                | What it earns  |
| ---------- | ------------------------ | -------------- |
| Satisfied  | Latency up to T          | Its full value |
| Tolerating | Latency over T, up to 4T | Half its value |
| Frustrated | Latency over 4T          | Nothing        |
| Failed     | Any error                | Nothing        |

[Apdex](/glossary/apdex) is the share of satisfied requests plus half the share of tolerating ones:

```text
Apdex = (satisfied + tolerating / 2) / total
```

An Apdex of 1 means every user was satisfied. An Apdex of 0.5 can mean that every user tolerated the
wait, or that half were satisfied and half gave up.

::Quiz{question="An API read has a target T of 200 ms. One read answers in 500 ms. What does it earn?" options="Its full value|Half its value|Nothing" answer="2" explain="500 ms is over T but under 4T (800 ms), so the request is tolerating and earns half."}

## Why Apdex and not average latency

Average latency mixes everyone into one number. Apdex counts people. A user who waited 5 seconds is
lost no matter how fast the others were, and Apdex gives that request zero. A user who waited a little
too long is not lost, and Apdex gives half credit.

This matches how the game computes latency. Response times spread out along a curve, so some share of
every kind is always slower than its target. The game computes, for each kind, the exact share of
answered requests below T and below 4T. That share falls smoothly as a Node fills up, long before the
average looks bad. See [Latency and percentiles](/explanation/latency).

Bots do not count toward Apdex. Kinds that run through a Queue, such as uploads and exports, are
scored on when their result is ready, not on the enqueue.

## What a request is worth

Revenue is the sum, over every kind, of its value times its Apdex credit:

```text
revenue = Σ kinds: rate × value × (satisfied + tolerating / 2)
```

Values differ a lot between kinds. A checkout is worth far more than a page view, and a bot is worth
nothing. So the same latency problem costs more on the money path. Other things scale the value:

- **Features.** Some Features make a kind earn more. See the [Team](/team#features) reference.
- **The Stack.** The framework that answers a request can change what it earns.
- **The Venture.** Each Venture sets its own value per request.

The **Paid plans** Feature adds a second source: a subscription per paying user per calendar day. It
does not depend on requests, so it smooths income and rewards keeping users.

:::Note{tone="real"}
The Apdex formula is a real standard from the Apdex Alliance, and monitoring tools still report it.
Real revenue does not halve at exactly T, but the shape is right. A 2009 Google study found that
400 ms of extra delay lowered how much people searched, and the loss lasted after the delay was gone.
:::

## Apdex also moves your users

The same score decides growth. Each Era sets an Apdex target. While your users' Apdex over the last
calendar hour beats it, users grow. When it falls below, they leave. So a slow Design loses money
twice: once on each request, and again as users go. See [Users and growth](/explanation/users-and-growth).

## The Payments drawer

Revenue does not go straight to Cash. It goes to the [Payments](/components/payments) drawer first,
and you select Collect to move it. The drawer holds about a minute of revenue at the current rate.
Bigger sizes hold more. Revenue that arrives while the drawer is full is lost.

The drawer keeps the first minutes of the Garage active, and then it gets out of the way. The
[Stripe Billing](/research/stripe) research collects automatically. While you are away, the game pays
revenue straight into Cash.

## How to raise income

Income per second is the best score for a change. Compare it before and after, once the system
settles. Most gains come from one of three moves:

1. Remove the bottleneck, so more requests get answered.
2. Make answered requests faster, so more of them are satisfied.
3. Protect the expensive kinds first, so a slowdown costs page views, not checkouts.
