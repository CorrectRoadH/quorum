## What it does

The Cache stands for Redis: an in-memory store that answers repeated reads without asking the database.

Place it in front of the [Database](/components/database) or [Connection Pooler](/components/pooler). It answers a share of read queries from memory, its hit ratio, and sends the misses on. Writes pass through and invalidate cached data, so a write-heavy mix lowers the hit ratio.

The hit ratio grows with memory compared to your hot data, which grows with users. A longer TTL raises it and serves more stale reads. A new or restarted Cache starts cold and fills up over time. See [cache hit rate](/glossary/cache-hit-rate) and [cache-aside](/glossary/cache-aside).

Two engines are on offer. Redis runs on one main thread and reloads part of its data after a restart. Memcached uses every core and comes back empty.

## When to place it

Place it when reads dominate and the Database CPU is high. The [Read Mostly](/sandboxes/read-mostly) Sandbox shows the symptom. Resize it when the hit ratio falls as users grow.

## How it fails

- [Cache stampede](/incidents/stampede): the Cache restarts empty, and every miss hits the Database at once. While the Database is overloaded, refills time out and the Cache stays cold. [Stampede protection](/research/stampede-protection) and [Cache warming](/research/cache-warming) prevent it.
- [Hot key](/incidents/hot-key): one key takes a large share of reads and saturates one shard. [Hybrid fan-out](/research/hybrid-fanout) lets you split hot keys.
- A long TTL serves stale data, which fails reads that need fresh data.
- A Cache does not reduce connections: it passes its callers' connections through.

::Sandbox{id="stampede"}

## Tips

- Turn on coalescing as soon as you own Stampede protection.
- Use Memcached when one Redis thread is the limit.
