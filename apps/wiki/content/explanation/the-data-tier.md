---
title: The data tier
summary: Why state is the hard part of scaling, and how the Database, Cache, Read Replica, and quorum stores trade speed for freshness.
section: explanation
order: 7
era: 1
aliases: database, postgres, cache, redis, replica, replication lag, stale, slow query, index, n+1, quorum, wide-column, distributed sql, warehouse, hot key
gdd: docs/gdd/07-data-tier.md
---

App Servers are easy to copy. They hold no data, so ten copies are as correct as one. Data is
different. Every copy of data must agree with the others, or users see the wrong answer. That is why
the data tier becomes the long-term challenge of every Company.

## The Database is the source of truth

The [Database](/components/database) answers read queries, write queries, and transactions. Until you
link a better Component, it also does other jobs badly. It runs full-text search, stores uploaded
files as rows, and runs report scans. Each of these costs it far more CPU than a normal read. A
[Search Engine](/components/search), [Object Storage](/components/storage), and a
[Data Warehouse](/components/warehouse) take those jobs away.

Three limits cap a Database:

- **CPU.** Every query costs CPU. A cold Database, just restarted, needs more of it per query.
- **Connections.** Postgres runs one process per connection and accepts a fixed number. Read
  [Errors and retries](/explanation/errors-and-retries) for why more App Servers make this worse.
- **The buffer cache.** Report scans fill memory with cold data. Other reads then go to disk, and
  writes wait behind the scans. This is why analytics and transactions should not share a Database.
  See [OLTP and OLAP](/glossary/oltp-and-olap).

## Slow queries hide until you grow

Two code problems cost little at first and a lot later.

An **unindexed query** scans the table. Its cost grows with the number of rows, and the rows grow with
your users. It is invisible in the Garage and becomes the bottleneck later. The
[Slow query](/incidents/slow-query) incident is this problem. [Query analysis](/research/query-analysis)
shows it, and the Add index task fixes it.

An **N+1 query** comes from an ORM that sends one query per item in a list. Laravel, Rails, and Django
make extra reads on page views and API reads until you ship Eager loading. See
[N+1 query](/glossary/n1-query).

## The Cache: memory in front of the Database

A [Cache](/components/cache) answers read queries from memory and sends misses on to the Database. Its
hit ratio decides how much load it takes off:

```text
hit ratio = √(memory / hot data) × TTL factor × write penalty × warmth
```

The square root models skewed access. Most reads ask for a few hot keys, so a small Cache already
holds the hottest ones. The first gigabyte of Cache is worth more than the tenth. Hot data grows with
your users, so a Cache that was big enough last Era may not be now.

Writes invalidate keys, so a write-heavy mix lowers the hit ratio. A longer TTL keeps more hits but
serves more stale data. A Cache that restarts comes back cold, and every miss goes to the Database at
once. That is a [cache stampede](/glossary/cache-stampede).
[Stampede protection](/research/stampede-protection) and [Cache warming](/research/cache-warming)
soften it.

:::Note{tone="real"}
Redis answers commands on one main thread, so one core caps a Redis node and one slow command blocks
every client. Memcached uses every core but keeps nothing on restart. The game models both, as Cache
engines with different limits.
:::

## Read Replicas: more reads, older data

A [Read Replica](/components/replica) runs like a Database but answers only reads. Writes still go to
the primary and then stream to the replica. The replica is always a little behind, and the lag grows
with your write rate. See [replication lag](/glossary/replication-lag).

A read from a lagging replica can return old data. Whether that matters depends on the kind:

- A page view accepts slightly old data.
- An API read that comes back stale fails as `stale`.
- A checkout that reads its own write fails as `stale`, which costs real money.

[Read-your-writes routing](/research/ryw-routing) sends the reads that care to the primary. That
fixes most stale errors and keeps some read load on the primary.

::Sandbox{id="stale-checkout"}

## Quorums: the game's namesake

A [Wide-column Store](/components/wide) keeps each key on N replicas. You choose two numbers: R, the
replicas a read asks, and W, the replicas a write waits for.

```text
R + W > N   every read asks at least one replica that has the latest write
R + W ≤ N   a read can miss the latest write: eventual consistency
```

Smaller R and W are faster, because each operation waits for an earlier reply, and they cost fewer
replica operations. But a weak quorum serves stale reads. A quorum that needs every replica fails while
one replica is down. See [quorum](/glossary/quorum).

::Quiz{question="A Wide-column Store keeps N = 3 replicas. Which setting makes every read see the latest write?" options="R = 1, W = 1|R = 1, W = 2|R = 2, W = 2" answer="3" explain="Only R = 2 and W = 2 gives R + W > N. The other settings let a read ask only replicas that missed the latest write."}

Overlap is not the same as a single, ordered history. Concurrent writes can still conflict, so even a
strong quorum gets an occasional stale read or duplicate on checkouts. A
[Distributed SQL](/components/dsql) Node fixes that with consensus: every write waits for a majority of
its replicas. Inside one region, that is cheap. Across regions, every write pays a long round trip.
See [Raft](/glossary/raft).

## Hot keys

Spreading data across nodes only helps if the load spreads too. In the [Hot key](/incidents/hot-key)
incident, a large share of reads asks for one key, such as a celebrity's post. That key lives on one
shard, which saturates while the others idle. [Hybrid fan-out](/research/hybrid-fanout) lets you split
hot keys across shards. See [hot key](/glossary/hot-key).

## The pattern behind all of it

Every data choice in Quorum trades among three things: speed, freshness, and survival. A Cache and a
replica buy speed with freshness. A strong quorum and consensus buy freshness with speed. Copies in
other zones and regions buy survival with Burn. The Data track shows the research behind each tool:

::Track{track="data"}

For practical steps, see [Scale the database](/guides/scale-the-database) and
[Fix slow queries](/guides/fix-slow-queries).
