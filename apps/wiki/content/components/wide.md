## What it does

The Wide-column Store stands for Apache Cassandra, the Component the game is named after. It copies each key to N replicas and uses [quorums](/glossary/quorum) to read and write.

It takes read and write queries, transactions, and timeline writes. It sends nothing on. You set three numbers on its card:

- **N**: how many replicas hold each key.
- **W**: how many replicas must confirm a write.
- **R**: how many replicas a read asks.

When R + W is greater than N, every read asks at least one replica that has the latest write. When it is not, a read can miss the latest write: [eventual consistency](/glossary/eventual-consistency). A write costs N replica operations and a read costs R, so higher settings use more capacity. Latency is the time of the slowest replica you wait for.

You can spread it across your open regions. Each region then keeps its own replicas, and the Burn grows with each region.

## When to place it

Place it when writes outgrow one [Database](/components/database), for example timeline writes from fan-out on write. It unlocks with [Leaderless replication](/research/leaderless).

## How it fails

- A weak quorum serves stale reads.
- Checkouts still go wrong now and then, even with a strong quorum: some come back stale or duplicate. Overlap is not linearizability. Use [Distributed SQL](/components/dsql) for checkouts.
- When a replica is lost, a quorum that needs every replica cannot form, and those calls fail.
- [Hot key](/incidents/hot-key): one key saturates one shard. [Hybrid fan-out](/research/hybrid-fanout) lets you split hot keys.
- A spread store survives a [Region outage](/incidents/region).

::Sandbox{id="hot-key"}

## Tips

- Use W and R of 2 with N of 3 for read-after-write with one failure to spare.
