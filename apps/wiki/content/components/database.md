## What it does

The Database stands for PostgreSQL, the single source of truth for your data.

It takes read and write queries, transactions, and timeline writes. It sends nothing on. Until you link a [Search Engine](/components/search), [Object Storage](/components/storage), or [Data Warehouse](/components/warehouse), it also answers searches, stores files as rows, and runs report scans. It does all three badly at volume.

Its CPU limits how many queries it answers. When the working set no longer fits in RAM, reads go to disk and slow down. Report scans evict the buffer cache, so every other query slows too.

Postgres runs one process per connection, and the Database refuses connections past its limit. Every App Server and Worker process holds its own pool of connections. More App Servers can take the Database down. [The data tier](/explanation/the-data-tier) explains why.

## When to place it

Split Postgres off the Garage box when the shared box runs out of memory or CPU. Resize it when its CPU stays high and query latency rises. When errors show refused connections, add a [Connection Pooler](/components/pooler), not a bigger box.

## How it fails

- [Connection exhaustion](/incidents/connections): too many connections, and the Database refuses the excess.
- [Slow query](/incidents/slow-query): a query with no index scans the whole table. Add the index from its card after [Query analysis](/research/query-analysis).
- [Disk full](/incidents/disk-full): every write fails until you expand the volume.
- [Report kills the database](/incidents/report-db): a large scan slows every kind.
- [Retry storm](/incidents/retry-storm): a short slowdown, and retries keep it overloaded.
- [Instance failure](/incidents/instance) and [Zone outage](/incidents/zone) take a Database with no standby offline.

## Tips

- Put a [Cache](/components/cache) and [Read Replicas](/components/replica) in front to take reads off it.
- Use a Memory instance when the working set outgrows RAM.
- Research [Point-in-time recovery](/research/pitr) to turn on backups.
