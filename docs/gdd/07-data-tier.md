# 7. Data tier

[Index](./README.md) · Previous: [Runtimes](./06-runtimes.md) · Next: [Team and velocity](./08-team-and-velocity.md)

Stateless app servers are easy to copy. State is hard to copy. This document defines the Components
that hold state and the mechanics that make the data tier the long-term challenge of the game:
connections, indexes, caches, replication, consistency, partitioning, and quorums.

## Data volume

The game tracks stored data in GB. Every `q-write`, `blob-put`, and `rt` message adds data. Data never
shrinks by itself.

- Storage Burn grows with volume ([Economy](./09-economy.md#the-cloud-bill)).
- Table size affects query cost: an unindexed query gets slower as the table grows.
- Backups, replicas, and migrations take longer as volume grows.
- Research "Retention policies" deletes or archives old data, and it lowers some feature values.

## Relational database

Real products: PostgreSQL (start), MySQL (variant).

The source of truth. It serves `q-read`, `q-write`, and `q-tx`. It can also serve `q-search` with
built-in full-text search and `q-scan`, both badly at volume.

### Capacity

```text
capacity = min(cpu_limit, iops_limit, connection_limit)
```

| Limit        | Detail                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CPU          | Each query kind has a CPU cost. Missing indexes multiply it.                                                                                                             |
| IOPS         | Reads that miss the buffer cache and every write go to disk. Storage class sets IOPS: general purpose (3,000 base) or provisioned (up to 64,000 at higher cost).         |
| Connections  | Postgres forks one process per connection, 5 to 10 MB each. `max_connections` is 100 by default. MySQL uses a thread per connection and handles more connections per GB. |
| Buffer cache | RAM that holds hot data. When the working set exceeds RAM, reads go to disk and latency jumps. This is why a Memory instance can beat a Compute instance for a database. |

### Variants

| Variant    | Profile                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PostgreSQL | Rich features: JSONB, full-text search, extensions such as pgvector. Process per connection, so it needs a pooler early. MVCC leaves dead rows that `VACUUM` must clean; heavy update load without tuning causes bloat (incident "Table bloat"). |
| MySQL      | Thread per connection, cheaper connections. Fewer built-in features: no pgvector, weaker full-text search. Replication is simple and widely used.                                                                                                |

### Indexes

Each feature the player ships adds query shapes. Some of them have no index.

- An unindexed query costs `table_rows × 0.0001` ms of CPU instead of a constant. It is invisible at
  small scale and becomes the bottleneck as data grows. This is incident "Slow query"
  ([Incidents](./11-incidents.md#catalog)).
- Adding an index costs Dev Hours and adds 5% write cost per index. Too many indexes slow writes.
- Research "Query analysis" (`EXPLAIN`) shows which query shapes lack an index.

### Schema migrations

Some features need a schema change. An `ALTER TABLE` that rewrites a large table locks it. Writes
fail or queue while the lock is held.

| Approach                         | Effect                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| Run it directly                  | Free, and causes a write outage proportional to table size.                         |
| Online migration tool (research) | Copies the table in the background. Costs Dev Hours and extra IOPS for a while.     |
| Expand and contract (research)   | Adds the new shape, backfills, then removes the old shape. No lock, more Dev Hours. |

## Connection Pooler

Real products: PgBouncer, ProxySQL.

Sits between app servers and the database. Many client connections share a few server connections.

| Mode        | Server connections needed  | Limitation                                                                                                                                                           |
| ----------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session     | One per client session     | Barely helps.                                                                                                                                                        |
| Transaction | One per active transaction | Session state breaks: session-level prepared statements, advisory locks, and `SET` commands. A service that uses them gets `crash` errors until it spends Dev Hours. |
| Statement   | One per statement          | Multi-statement transactions are impossible. `q-tx` fails.                                                                                                           |

Teaches: [connection pooling](./glossary.md#connection-pooling), and why "just add more app servers"
can take the database down ([Simulation](./04-simulation.md#connections)).

## Cache

Real products: Redis (start), Memcached (variant), Valkey.

Serves `q-read` from memory. A hit costs 0.5 ms. A miss costs the cache lookup plus the database read.

### Variants

| Variant   | Profile                                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Redis     | Data structures (sorted sets, streams), optional persistence, replication. Executes commands on one main thread, so one core caps a node and one slow command (for example `KEYS *`) blocks all clients. |
| Memcached | Multi-threaded, simple keys and values only, no persistence. Scales up on one big box better than Redis. Restart means a cold cache.                                                                     |

### Hit ratio

```text
hit_ratio = working_set_coverage × (1 − invalidation_rate)
working_set_coverage = min(1, cache_memory / hot_data_size) ^ 0.5
```

The square root models a skewed access pattern: a small cache already holds the hottest keys, so the
first GB of cache is worth more than the tenth.

### Strategies (a Tradeoff card)

| Strategy      | Read latency        | Write latency     | Staleness                               | Risk                                                           |
| ------------- | ------------------- | ----------------- | --------------------------------------- | -------------------------------------------------------------- |
| Cache-aside   | Hit fast, miss slow | Unchanged         | Until TTL or invalidation               | Race between a write and a concurrent miss can store old data. |
| Read-through  | Same as cache-aside | Unchanged         | Until TTL                               | The cache library owns loading.                                |
| Write-through | Hit fast            | +1 cache write    | None for keys written through the cache | Write latency up; caches data that may never be read.          |
| Write-behind  | Hit fast            | Fast (cache only) | None in cache; the database lags        | A cache crash loses writes not yet flushed.                    |

### TTL

| TTL    | Hit ratio | Stale reads on `write`-heavy data |
| ------ | --------- | --------------------------------- |
| 10 s   | Low       | Very few                          |
| 60 s   | Medium    | Some                              |
| 1 hour | High      | Many                              |

A stale read counts as a `stale` error only for kinds that need fresh data, such as `write` followed
by `read` of the same record (read-your-writes) and `buy`. For `page` and `feed`, staleness is
acceptable up to a limit set by the Venture.

### Stampedes

When a hot key expires, or the cache restarts, many requests miss at once and hit the database
together. This is a [cache stampede](./glossary.md#cache-stampede).

| Protection (research)          | Effect                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Request coalescing             | One request reloads the key while the others wait for it.                            |
| Probabilistic early expiration | Keys refresh slightly before they expire, at random, so they do not expire together. |
| Stale-while-revalidate         | Serves the old value while one request refreshes it.                                 |
| Cache warming                  | Fills a new or restarted cache before it takes traffic.                              |

## Read Replica

Real products: PostgreSQL streaming replication, MySQL replication, Aurora replicas.

A copy of the primary that serves `q-read`. Writes still go to the primary.

| Option                              | Effect                                                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Asynchronous (start)                | No write cost. Replicas lag by `base_lag + write_rate × lag_factor`. Under heavy writes, lag reaches seconds. A read after a write on a lagging replica is `stale`. |
| Synchronous                         | No lag on the synchronous replica. Every write waits for it: +2 ms in the same zone, more across zones. If the replica is down, writes stall.                       |
| Read-your-writes routing (research) | Sends a user's reads to the primary for a few seconds after that user writes. Removes most `stale` errors and keeps some read load on the primary.                  |

Replicas behind a misconfigured route are a common bug: sending `q-write` to a replica fails every
write. The card shows a red "Read-only" row.

## Partitioning (sharding)

Research "Sharding" splits one database into N shards by a key.

| Choice          | Effect                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Hash of user ID | Even load. Queries across users touch every shard (scatter-gather), which is slow and fans out ([fan-out](#fan-out)). |
| Range of IDs    | Simple to split further. New users all land on the last shard: a hot shard.                                           |
| By tenant       | Natural for B2B. One large customer is a hot shard.                                                                   |
| By region       | Data residency for free. Cross-region users are slow.                                                                 |

- Resharding (changing N) costs Dev Hours and IOPS for a calendar day.
- `q-tx` that touches two shards needs a distributed transaction: 3× latency and a failure mode on
  each shard.
- A hot key (a celebrity, a big tenant) overloads one shard while others idle. The card shows the
  skew.

## Fan-out

When one user request becomes many backend requests, the tail grows
([Simulation](./04-simulation.md#percentiles)).

`feed` is the main example. It has two designs, which is the real Twitter timeline problem:

| Design                  | Read cost                                      | Write cost                            | Problem                                                                                            |
| ----------------------- | ---------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Fan-out on read (pull)  | 20 × `q-read` per `feed`                       | 1 × `q-write` per post                | Slow feeds, a long tail, and heavy read load.                                                      |
| Fan-out on write (push) | 1 cache read per `feed`                        | One cache write per follower per post | A post by an account with millions of followers creates millions of writes: the celebrity problem. |
| Hybrid (research)       | Push for normal accounts, pull for celebrities | Bounded                               | Costs Dev Hours, and it is what real systems do.                                                   |

## Search Engine

Real products: Elasticsearch, OpenSearch (variant), Meilisearch (variant).

| Option              | Effect                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Refresh interval    | 1 s by default: new documents become searchable within 1 s. Shorter is fresher and costs indexing CPU. Longer is cheaper and staler. |
| Shards and replicas | More shards parallelize large indexes and fan out every query. Replicas add query capacity and memory.                               |
| Heap                | The JVM heap holds caches. Too small: GC pauses. Too large: long pauses and less file system cache.                                  |

| Variant       | Profile                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Elasticsearch | Full features, JVM, heavy memory. A license change can arrive as a business event.               |
| OpenSearch    | The Apache-licensed fork. Same profile, no license event.                                        |
| Meilisearch   | Simple and fast for small and medium indexes. One node until research. Lower relevance at scale. |

Feeding the index: either dual writes from the app or a CDC Connector
([keeping copies in sync](#keeping-copies-in-sync)).

## Object Storage

Real products: Amazon S3, Cloudflare R2, Google Cloud Storage.

Unlimited capacity. Pay per GB stored, per request, and per GB of egress.

| Variant | Profile                                                                 |
| ------- | ----------------------------------------------------------------------- |
| S3      | Standard. Egress costs money unless it goes through a CDN.              |
| R2      | No egress fees. Slightly higher first-byte latency outside its own CDN. |

| Storage class     | Storage price | Retrieval                                                      |
| ----------------- | ------------- | -------------------------------------------------------------- |
| Standard          | 1.0×          | Instant                                                        |
| Infrequent access | 0.5×          | Instant, retrieval fee                                         |
| Archive           | 0.1×          | Hours. A `media` request for archived data fails as `timeout`. |

Research "Lifecycle rules" moves old objects to cheaper classes automatically.

## Document Store

Real products: MongoDB, Firestore.

Serves `q-read` and `q-write` on documents.

- Flexible schema: features that change data shape cost −25% Dev Hours and skip schema migrations.
- Joins happen in the app: `report` and `q-tx` across documents cost 3× and lose atomicity unless the
  multi-document transaction option is on (+50% write latency).
- Scales out by sharding on a shard key, with the same hot-key risks as relational sharding.

## Data Warehouse

Real products: BigQuery, Snowflake, ClickHouse.

Serves `q-scan`. Columnar storage makes scans cheap.

- Pay per scan (BigQuery style) or per running warehouse (Snowflake style). A careless `report`
  feature that scans everything can cost more than it earns.
- Data arrives by batch ETL (hourly, cheap, stale) or by CDC (seconds, more Burn).
- Running `report` on the primary database instead harms every other kind: scans evict the buffer
  cache and hold locks. Separating analytics from transactions is the Series B lesson.

## Vector Index

Real products: pgvector, Pinecone, Qdrant.

Holds embeddings for retrieval-augmented generation. With a Vector Index in the `ai` path, `ai` value
rises by 30%, because answers use the company's own data.

| Option     | Effect                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| Index type | Exact (perfect recall, slow at scale) or approximate HNSW (fast, memory-heavy, 95% recall). |
| pgvector   | Lives inside Postgres. No new Node, and it competes with transactional load.                |

## Wide-column Store

Real products: Apache Cassandra, ScyllaDB, Amazon DynamoDB.

This Component is the game's namesake. It replicates each key to N nodes and uses quorums for reads
and writes.

```text
N = replication factor     W = nodes that must acknowledge a write     R = nodes asked on a read
R + W > N  →  every read overlaps the latest write: strong consistency
R + W ≤ N  →  a read can miss the latest write: eventual consistency
```

| Setting (N = 3)   | Write latency          | Read latency           | Consistency | Survives                             |
| ----------------- | ---------------------- | ---------------------- | ----------- | ------------------------------------ |
| W=1, R=1          | Fastest                | Fastest                | Eventual    | 2 node failures for reads and writes |
| W=2, R=2 (QUORUM) | Second-fastest replica | Second-fastest replica | Strong      | 1 node failure                       |
| W=3, R=1          | Slowest replica        | Fastest                | Strong      | 0 node failures for writes           |
| W=1, R=3          | Fastest                | Slowest replica        | Strong      | 0 node failures for reads            |

- Latency at a quorum is the latency of the k-th fastest replica, so quorum reads have a better tail
  than "all" reads and a worse tail than "one" reads.
- Writes scale linearly with nodes, until the partition key is skewed.
- No joins and no ad hoc queries. Each query pattern needs its own table, designed for it: +Dev Hours
  per feature.
- Across regions, `LOCAL_QUORUM` keeps latency local and gives up global consistency.

## Distributed SQL

Real products: CockroachDB, Google Spanner, YugabyteDB.

SQL with transactions across shards and regions, built on consensus ([Raft](./glossary.md#raft)).

- Every write waits for a majority of replicas. In one region that costs a few milliseconds. Across
  three regions it costs a cross-region round trip, 70 ms or more.
- Survives a whole region outage with no data loss.
- Expensive per node. The right tool for `buy` in a multi-region company, and the wrong tool for
  `feed`.

## Keeping copies in sync

Once data lives in more than one place (database, cache, search index, warehouse), the copies can
disagree.

| Approach                        | Risk                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dual writes from the app        | If one write fails, the copies diverge until a repair job runs. The game counts divergence as `stale` on search results.        |
| Transactional outbox (research) | The app writes the change and an outbox row in one transaction. A relay publishes it. Correct, with a little lag and Dev Hours. |
| CDC Connector                   | Reads the database log. Correct, with lag, and no app changes.                                                                  |

## Delivery semantics

Queues and streams deliver messages with one of three guarantees.

| Guarantee                  | Behavior                                            | Game effect                                                                              |
| -------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| At most once               | A message is never delivered twice and may be lost. | A crash loses in-flight `task`.                                                          |
| At least once              | A message is never lost and may be delivered twice. | Non-idempotent jobs run twice. `push` sends duplicate notifications, which raises churn. |
| Exactly once (effectively) | At least once plus idempotent processing.           | Needs research "Idempotency keys" and Dev Hours per consumer.                            |

## Multi-region data

From the Series C Era, the player must decide where each kind of data lives.

| Pattern                         | Reads                                           | Writes                        | On a region outage                                               |
| ------------------------------- | ----------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Single primary, remote replicas | Local, possibly stale                           | Cross-region to the primary   | Writes stop until failover. Recent writes may be lost (RPO > 0). |
| Partition by region             | Local                                           | Local                         | That region's users are down, others are fine.                   |
| Leaderless (wide-column)        | Local quorum                                    | Local quorum                  | Fine, with eventual consistency across regions.                  |
| Consensus (distributed SQL)     | Local (follower reads, stale) or remote (fresh) | Majority across regions, slow | Fine, no data loss.                                              |

[RPO and RTO](./glossary.md#rpo-and-rto) are scored in the Pre-IPO Era, when a disaster recovery audit
is part of the IPO checklist ([Progression](./10-progression.md#era-6-pre-ipo)).

## Backups

| Option                                 | RPO        | Cost                                   |
| -------------------------------------- | ---------- | -------------------------------------- |
| None                                   | Everything | Free until "Accidental delete" happens |
| Nightly snapshot                       | 24 hours   | Storage                                |
| Point-in-time recovery (WAL archiving) | Minutes    | Storage and IOPS                       |

Incident "Accidental delete" (a real class of outage) deletes a table. With no backup, the company
loses users and data. Restore time grows with data volume. Untested backups have a 20% chance to fail
on restore until research "Restore drills".
