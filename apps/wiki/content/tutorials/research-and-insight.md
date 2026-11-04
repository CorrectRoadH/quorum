---
title: Earn Insight and research
summary: See how Analytics turns your traffic into Insight, then run your first Studies, Stripe Billing and Structured logs.
section: tutorials
order: 4
aliases: insight, research, study, studies, pools, recipe, analytics, stripe billing, structured logs
gdd: docs/gdd/12-observability.md
---

In this lesson you learn where Insight comes from and spend it on Research. You run two Studies:
Stripe Billing, which collects your revenue for you, and Structured logs, which shows why requests
fail. You can do this lesson in the Garage or in Pre-seed.

## Find your Insight

Insight is what you learn from watching your own traffic. Analytics samples the Nodes that link into
it, and each sampled request kind fills its own Insight pool.

1. Look at the Analytics card on the board. It shows **Sampling**, **Kept**, and up to three rows
   with a pool icon and a rate, such as `+0.4/s`.
2. Look under the HUD, at the top left. The **Insight** card lists each pool that you hold or earn,
   with its amount and its rate.

The Insight card appears as soon as your pools hold enough for the cheapest Research item. In a new
Company, that happens within about a minute.

Each pool has its own icon and color. The color matches the request kind's particles on the board,
so page-view Insight looks like page-view traffic.

::Component{id="analytics"}

## Read the help

1. Select the **?** button on the Insight card. **About Insight** opens.
2. Read the four parts: **Pools**, **Earn**, **Spend**, and **Keep**.
3. Press **Esc** to close it.

Two rules matter most. A pool earns with the square root of its samples, so a new request kind earns
more than more of the same traffic. And a pool has a cap: it stops filling at its rate times the
Analytics retention window. Spend Insight. Do not hoard it.

## Open Research

1. Press **R**. You can also select the top row of the Insight card. The Research screen opens.
2. Look at the tree. Each track grows up from its root, through one band per Era. Items in later
   Eras are greyed or faded.

Each item shows its cost as chips, one chip per pool that pays for it. The pools that pay are the
item's **recipe**. Most Garage items cost page and read Insight. Most Pre-seed items cost write and
login Insight.

## Run your first Study

1. Click **Stripe Billing** in the tree. Its detail panel opens at the bottom right.
2. Read the blurb: **Payments collect themselves.**
3. Read the **Cost** rows. Each row shows the pool, the cost, and how much you hold.
4. Select **Start Study**. The button also shows how long the Study takes.

A Study does not take all its Insight at once. It takes Insight from its pools while it runs, so the
pools fall slowly. The pool that runs low first sets the pace.

5. Press **Esc** to close the Research screen.
6. Watch the Insight card. Its top row shows **Stripe Billing** and a percentage, with a progress
   bar.

When the Study ends, look at the Payments card. Its button now reads **Collected automatically**,
and revenue goes straight to Cash. You no longer need to press **C**.

## Queue a second Study

1. Press **R** again.
2. Click **Structured logs**, in the Observability track.
3. Select **Start Study**.

If a Study already runs, the new one joins the **Queue** in the detail panel. The first Study in the
queue runs, and the others wait. You can move a Study up or down, or cancel it. A cancelled Study
loses its progress and the Insight it took.

You can also double-click an item in the tree to queue it.

::Track{track="observability"}

## See what logs show

When Structured logs is yours, errors have causes.

1. Wait until the **Errors** row shows on the HUD. It appears when the first request fails.
2. Hold the pointer over the **Errors** row. Its title lists each cause and its rate.
3. Select the **Users** Node. The Inspector shows **Errors by cause**.

Causes such as `stranded` and `down` tell you what to fix. Without logs, you see only that requests
fail.

:::Note{tone="tip"}
Failed and slow requests fill a separate pool, Failure Insight. An incident fills it fast. Half
the cost of every Reliability item is Failure Insight, so an incident helps pay for the Research
that prevents the next one.
:::

## Earn Insight faster

- Link more Nodes into Analytics. Drag from a Node's blue output port to the Analytics card. The
  Database is a good first choice.
- Serve new request kinds. Each new kind fills a pool of its own.
- Select **More samples** in the Analytics Inspector to sample a larger share of the traffic.
  Sampling costs a little CPU on each Node that it samples.

## What you learned

- Analytics samples traffic, and each request kind fills its own Insight pool.
- Each Research item has a recipe: the pools that pay for it.
- A Study takes its Insight while it runs. The lowest pool sets the pace.
- Stripe Billing collects revenue for you. Structured logs shows why requests fail.

Next: [Find the bottleneck](/guides/find-the-bottleneck), a recipe for every limit you meet. For the
ideas behind this lesson, read [Insight and observability](/explanation/observability).
