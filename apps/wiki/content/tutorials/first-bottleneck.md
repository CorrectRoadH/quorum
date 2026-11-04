---
title: Your first bottleneck
summary: Find the limit of the Garage box, move the database to its own Node, and get the box off Burstable when its CPU credits run out.
section: tutorials
order: 2
era: 0
aliases: first bottleneck, out of ram, swapping, split the database, cpu credits, burstable, vertical scaling
gdd: docs/gdd/10-progression.md
---

In this lesson you find the Node that limits your Design, read why, and fix it. You fix two limits
in the Garage: memory first, then CPU credits. Start from the Company you made in
[Your first Company](/tutorials/first-company).

## Wait for the first limit

1. Keep the game running and collect your revenue.
2. Watch the App Server card. At a few hundred users, its **Load** row jumps, and the row turns
   amber or red.
3. Look above the App Server. A **BOTTLENECK** tag appears, and the card has a pulsing outline.

The bottleneck is the one Node that costs you the most revenue now. See
[How requests flow](/explanation/requests) for how the game finds it.

When the box is the bottleneck for the first time, the resize button at the bottom of its card
glows. Do not click it yet. First, find out why the box is full.

## Read the cause

1. Select the App Server. The Inspector opens.
2. Read the red box under the title. It says **Out of RAM and swapping: every request is slower.**
3. Find the **Resources** section. The **RAM** gauge is full.

The App Server and PostgreSQL share one machine. The database keeps more data in memory as your
users grow, so the box runs out of RAM. When a machine runs out of RAM, it moves memory to disk.
This is called swapping, and it makes every request slow.

Watch the HUD. **Apdex** falls under its target, and the **Users** row shows a ▼. Users leave
while you wait, so act now.

## Move the database to its own Node

Real companies take this step early: they give the database its own machine.

1. In the build dock at the bottom, select the **Data** group. You can also press its number key.
2. Select **Database** in the list. Its price shows at the right of the row.
3. Click the board to the right of the App Server. The Database card appears.
4. Find the blue output port on the App Server card.
5. Drag from that port to the Database card. A Link appears.

When you link the first box to a Database, PostgreSQL moves off the box for good. Select the App
Server again. The red box is gone, and the **RAM** gauge is far from full.

Now watch the HUD for half a minute:

- **Apdex** climbs back over its target.
- **Users** shows a ▲ again.
- The **BOTTLENECK** tag leaves the App Server, or no Node has it.

If you made a mistake, press **Z** to undo. An undo within 30 seconds refunds the full cost.

:::Note{tone="real"}
One box for the app and the database is how most products start. Moving the database out is the
classic first scaling step. Each part can now grow on its own.
:::

## Wait for the second limit

The App Server is a Burstable machine. It earns CPU credits while it is idle, and it spends them
when it works hard. When the credits run out, the box runs at a small fraction of its CPU.

1. Keep the game running. Collect your revenue.
2. Select the App Server from time to time. Watch the **CPU credits** gauge in **Resources**. It
   falls as your traffic grows.
3. When the gauge is empty, the Inspector shows **Out of CPU credits: throttled to 20% CPU.**

The **Load** row turns red, and the **BOTTLENECK** tag comes back to the App Server.

## Leave Burstable

1. Select the App Server.
2. Find the **Instance** section in the Inspector. It shows four families: **Burstable**,
   **General**, **Compute**, and **Memory**.
3. Select **General**.
4. If a Tradeoff card opens, read its preview and select **Confirm**.

The box restarts for a short time, so its traffic drops for a moment. Then the **CPU credits**
gauge is gone, and the **Load** row falls. A General box costs more per second than a Burstable one,
but it never throttles.

You can also make the box bigger. Select **Larger** in the **Instance** section, or press **U** with
the Node selected. A larger box has more CPU and RAM, and a higher price. This is
[vertical scaling](/glossary/vertical-and-horizontal-scaling).

## Practice

Two guided Sandboxes repeat this lesson on a fixed board:

- [Out of Credits](/sandboxes/out-of-credits)
- [Shared Box](/sandboxes/shared-box)

## What you learned

- The **BOTTLENECK** tag marks the Node that limits your revenue.
- The Inspector's **Resources** section shows which resource is full.
- A shared box runs out of RAM. A Database Node of its own fixes it.
- A Burstable box runs out of CPU credits. The General family fixes it.

Next: read [How requests flow](/explanation/requests), then go on to
[Your first incident](/tutorials/first-incident).
