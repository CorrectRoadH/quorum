---
title: Find the bottleneck
summary: Find the one Node that limits your Design, learn which of its resources is full, and pick the fix that moves the limit.
section: guides
order: 1
aliases: bottleneck, slow design, red node, amber node, limit, saturation, hottest node
gdd: docs/gdd/04-simulation.md
---

Use this guide when Apdex falls under its target, users leave, and you do not know which Node to fix.

A Design is only as fast as its slowest Node. That Node is the
[bottleneck](/explanation/queues). Adding capacity anywhere else costs Cash and changes nothing.

## Find the Node

1. Look for the **BOTTLENECK** tag on the board. It sits above one Node, and that Node has a
   pulsing outline.
2. Select that Node. The Inspector opens.
3. Read the **Load** row. It shows the share of capacity in use, as in "85% of 120/s".
4. Compare the row color with these limits:
   - Plain: under 70%. The Node is healthy.
   - Amber: 70% or more. Waiting time rises fast.
   - Red: 90% or more. The tail latency is several times the median.

The game finds the bottleneck again once per second. It tries each of the busiest Nodes with
double the capacity and marks the one that earns the most revenue. Only Nodes above 60% load can get the
marker.

If no Node has the tag, capacity does not limit your revenue. Go to "When there is no marker"
below.

## Find the full resource

5. In the Inspector, read the **Resources** section of the bottleneck Node.
6. Find the gauge that is nearest to full. Use the table to choose the fix.

| Full gauge                 | What it means                                                            | Fix                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| CPU                        | The Node does too much work per request.                                 | Select **Larger**, or place a second copy behind a [Load Balancer](/components/lb).                    |
| Workers busy, with CPU low | Each request holds a worker while it waits for a slower Node downstream. | Fix the Node that the requests wait for. Or select **More workers** if **RAM fits** a larger pool.     |
| RAM                        | The process is near its memory limit.                                    | Select **Fewer workers**, select **Larger**, or pick the **Memory** family.                            |
| CPU credits                | A Burstable box spent its credits and runs at a fraction of its CPU.     | Pick the **General** or **Compute** family.                                                            |
| Connections                | The Database is at its connection limit.                                 | Place a [Connection Pooler](/components/pooler). See [Scale the database](/guides/scale-the-database). |

A full "Workers busy" gauge with low CPU is the most common trap. The App Server looks full, but
the slow part is the Database behind it. This is [Little's law](/glossary/littles-law): a request
that waits longer holds its worker longer.

## Apply the fix and check it

7. Make one change only.
8. Wait a few seconds of game time, so that the flow settles.
9. Check that the Load row of the old bottleneck falls under 70%.
10. Check that Apdex on the HUD rises toward its target.
11. Look for the **BOTTLENECK** tag again. It usually moves to a new Node. Repeat from step 2.

If the tag stays on the same Node and its Load does not fall, you fixed the wrong resource. Go back
to step 5.

:::Note{tone="warn"}
**Larger** and a change of family restart the Node for a short time. A single Node with no second
copy drops its traffic while it restarts.
:::

## When there is no marker

The Design can lose users with no bottleneck. Check these places:

- **A red "Stranded" row** on a Node card. No linked Node accepts a request kind. Draw a Link
  to a Node that accepts it.
- **Errors** on the HUD. With [Structured logs](/research/logs), select the Users Node and read
  **Errors by cause**.
- **Why users leave.** Select **Users** on the HUD. Each row names a request kind and a cause. A
  `slow` row has a **Show** button that selects the bottleneck Node for you.

## Other ways to find it

- Press **D** to open the [Dashboard](/explanation/observability), once you own
  [Metrics](/research/metrics). The **Saturation** row shows each Node's load over time. The stat
  **Hottest Node** names the busiest Node.
- With [Percentiles](/research/percentiles), the Latency row of each card shows the p99. A Node with a
  high p99 and a low load points to tail events, not capacity. See
  [Read p99 and tail latency](/guides/read-p99).

## Practice

The Shared Box Sandbox starts with the Database and the App Server on one box. Find out which
resource fills first, and fix it within the Burn limit.

::Sandbox{id="shared-box"}

## Related

- [Your first bottleneck](/tutorials/first-bottleneck) teaches this loop step by step.
- [Capacity, utilization, and queues](/explanation/queues) explains why waiting time rises so fast
  near full load.
- [Utilization](/glossary/utilization) in the glossary.
