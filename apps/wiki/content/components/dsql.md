## What it does

Distributed SQL stands for CockroachDB: SQL with transactions across regions, built on [Raft](/glossary/raft) consensus.

It takes read queries, write queries, and transactions. It sends nothing on. Its capacity is counted in transactions, and a read costs a fraction of a transaction. Each size step doubles its capacity.

Every write waits for a majority of its replicas. In one region that costs a few milliseconds. Spread across regions, a write waits for a cross-region round trip, so write latency rises. Reads stay local. When spread, its Burn grows with each region.

## When to place it

Place it when your Company runs in several regions and checkouts must stay correct everywhere. It is the right store for checkouts, and an expensive one for feeds. It unlocks with [Consensus databases](/research/consensus). See [Go global](/guides/go-global).

## How it fails

- Spread across regions, every write pays the round trip. Write-heavy kinds feel it in p99.
- Overloaded, it drops queries like any data Node.
- It is the most expensive data Component. Do not place it for traffic that a [Database](/components/database) or [Wide-column Store](/components/wide) can serve.

It also prevents failures:

- Spread across three regions, it survives a [Region outage](/incidents/region) with no data loss, because a majority remains.
- It makes a [Network partition](/incidents/partition) less harmful: a consensus store keeps one leader, so writes do not diverge. Fence the old leader to end the incident. See [network partition](/glossary/network-partition).

:::Note{tone="real"}
Consensus trades latency for correctness. Real teams use it for money and keep cheaper stores for the rest.
:::

## Tips

- Open a third region before you count on it to survive a region outage.
