## What it does

The Read Replica stands for a PostgreSQL streaming replica: a copy of the primary that answers reads.

It takes only read queries and sends nothing on. It uses the same capacity model as the [Database](/components/database), with an instance type and size, and it has its own connection limit. Writes still go to the primary.

Replicas lag behind the primary, and the lag grows with the write rate. A read that hits a lagging replica can come back stale. A stale answer fails an API read and a checkout that reads its own write. Page views accept it. See [replication lag](/glossary/replication-lag).

## When to place it

Place a replica when the Database CPU is high from reads, and a [Cache](/components/cache) cannot hold the hot data. Link your App Servers to both the primary and the replicas. Reads then spread across them.

## How it fails

- [Replication lag](/incidents/repl-lag): a burst of writes leaves the replicas seconds behind, and reads after a write come back stale. [Read-your-writes routing](/research/ryw-routing) lets an App Server send those reads to the primary.
- Like every Database, it refuses connections past its limit.
- [Instance failure](/incidents/instance) takes one replica out. Its share of reads fails until you replace it.

The [Stale Checkout](/sandboxes/stale-checkout) and [Missed Write](/sandboxes/missed-write) Sandboxes show stale reads.

::Sandbox{id="stale-checkout"}

:::Note{tone="real"}
Asynchronous replication is the default in real Postgres, so real replicas lag too. See [read-your-writes consistency](/glossary/read-your-writes-consistency).
:::

## Tips

- Turn on read-your-writes on App Servers that serve checkouts.
- A write-heavy mix needs a bigger primary, not more replicas.
