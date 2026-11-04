---
title: Scale the database
summary: Read which limit the Database hits, then take load off it with a larger box, a Pooler, a Cache, Read Replicas, or a dedicated store for each kind of query.
section: guides
order: 4
era: 1
aliases: database, postgres, db, connections, read replica, cache, pooler, working set, scale up
gdd: docs/gdd/07-data-tier.md
---

Use this guide when the Database is the bottleneck, or when it shows a red or amber callout in
the Inspector.

App Servers are easy to copy. The Database is not, because it holds the state. So you scale it
in two ways: give it a larger box, or send it less work. See
[The data tier](/explanation/the-data-tier) for the reason.

## Find the limit

1. Select the Database. The Inspector opens.
2. Read the callouts at the top of the panel. Each one names a different limit:
   - "Refusing … queries/s: too many connections." The connection limit is full.
   - "The working set does not fit in RAM: reads hit disk." Reads are slow because the hot data
     is larger than memory.
   - "Out of CPU credits: throttled to 20% CPU." A Burstable box spent its credits.
   - "A new query has no index." A Slow query incident runs. Go to
     [Fix slow queries](/guides/fix-slow-queries).
3. Open **Resources** and find the fullest gauge: **CPU**, **RAM**, or **Connections**.
4. Select the **Users** Node and open **Requests**. Note which request kinds you serve. Each kind
   sends different queries to the Database.

Use the section below that matches the limit.

## Connections are full

Postgres opens one process per connection, up to 100. Every App Server copy holds its own
connections, so more App Servers can take the Database down.

5. Research [Connection pooling](/research/pooling).
6. Place a [Connection Pooler](/components/pooler) between the App Servers and the Database.
   Link each App Server to the Pooler, and the Pooler to the Database.
7. Keep **Pooling mode** on **Transaction**. In this mode, many app connections share 20
   connections to the Database. **Session** mode needs one per client and barely helps.
8. If requests fail as `crash` after the change, queue the **Drop session state** task in the
   Team panel (T). Transaction pooling breaks code that keeps session state until it ships.

Check that the Connections gauge falls and the "Refusing" callout disappears.

## CPU is full

9. Select **Larger** in the **Instance** section. Each size doubles vCPU and RAM.
10. If the Database is still the bottleneck, take reads off it:
    - Research [Caching](/research/caching) and place a [Cache](/components/cache) between the App
      Servers and the Database. It answers reads from memory while the hot data fits. Writes pass
      through.
    - Research [Read replicas](/research/replication) and place a
      [Read Replica](/components/replica). Link the App Servers to it. It answers read queries
      only.
11. If you run Laravel, Rails, or Django, research [Eager loading](/research/eager-loading) and
    queue its task. These ORM frameworks send several read queries where one would do. See
    [N+1 query](/glossary/n1-query).

Check that the Database Load row falls under 70% and that the **BOTTLENECK** tag moves away.

:::Note{tone="warn"}
A Cache with a long **TTL** hits more often and serves more old data. A Read Replica lags behind
writes, so some API reads come back `stale`. Research
[Read-your-writes routing](/research/ryw-routing) and set **Read your writes** in the **Overload**
section of each App Server to send reads that follow a write to the primary.
:::

## Reads hit disk

12. Open the **Instance** section and pick the **Memory** family. It has twice the RAM of General
    per vCPU.
13. Or select **Larger** for more RAM.
14. Check that the "reads hit disk" callout disappears.

The working set grows with users, so this callout comes back as you grow.

## Move work to the right store

The Database can answer almost every query, but badly at volume. When a new request kind arrives
in an Era, give its queries their own Component:

| Kind of work      | Component                                                   | Research                                       |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Search queries    | [Search Engine](/components/search)                         | [Full-text search](/research/full-text-search) |
| Uploaded files    | [Object Storage](/components/storage)                       | [Object storage](/research/object-storage)     |
| Slow work, export | [Queue](/components/queue) and [Worker](/components/worker) | [Message queues](/research/queues)             |
| Reports           | [Data Warehouse](/components/warehouse)                     | [Data warehousing](/research/data-warehouse)   |

Reports on the primary also evict its buffer cache, so every other kind slows down. A Data
Warehouse stops the [Report kills the database](/incidents/report-db) incident.

## When one Database is not enough

From the Series C Era, the leaderless and consensus stores take writes on more than one node:

- [Wide-column Store](/components/wide) replicates each key to N nodes with tunable quorums.
  Research [Leaderless replication](/research/leaderless).
- [Distributed SQL](/components/dsql) keeps transactions on a majority of replicas. Research
  [Consensus databases](/research/consensus).

Both cost far more Burn than a Database. Move to them only when the largest Database with a Cache
and replicas still cannot keep up, or when you need to survive a region outage. See
[Go global](/guides/go-global).

## Check the result

15. Wait a few seconds of game time after each change.
16. Check that the Database Load row is plain, under 70%.
17. Check that Apdex on the HUD rises toward its target.
18. With [Structured logs](/research/logs), select the Users Node and read **Errors by cause**.
    `refused`, `stale`, and `crash` must stay near zero.

## Practice

- [Connection Limit](/sandboxes/connection-limit): a deploy doubles every pool.
- [Read Mostly](/sandboxes/read-mostly): reads dominate, under a Burn limit.
- [Stampede](/sandboxes/stampede): the Cache restarts empty.
- [Analytics on Primary](/sandboxes/analytics-primary): a report scans every table.

## Related

- [Find the bottleneck](/guides/find-the-bottleneck)
- [Connection pooling](/glossary/connection-pooling) and [Read replica](/glossary/read-replica) in
  the glossary.
