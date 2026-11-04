## What it does

The App Server stands for a virtual machine that runs your code.

It takes every request kind. It answers page views and bots itself, and turns other kinds into backend calls: read and write queries, auth calls, tasks, charges, and more. Its capacity depends on its instance type, its [runtime, and its framework](/runtimes). The tightest of four limits sets it: CPU, worker slots, memory, and network.

A request holds its worker slot while it waits on each backend call. So a slow Database also lowers the capacity of runtimes that hold a worker while they wait. This is [Little's law](/glossary/littles-law).

The Garage box runs Postgres on the same machine. When you link it to a [Database](/components/database), [Connection Pooler](/components/pooler), or [Cache](/components/cache), Postgres moves off the box for good. A Burstable box earns CPU credits while idle and is throttled when they run out.

## When to place it

Add a copy, or a size step, when its card shows CPU, workers, or memory near full and p99 climbs. Put a [Load Balancer](/components/lb) in front before the second copy. If the limit is workers while CPU is low, the box waits on its backends: fix those first. See [Find the bottleneck](/guides/find-the-bottleneck).

## How it fails

- Overloaded, it queues requests, then drops them.
- A box with too little RAM swaps, and a pool sized too big for its RAM is killed.
- [Instance failure](/incidents/instance) takes down a single copy. A second copy behind a Load Balancer survives it.
- [Memory leak](/incidents/leak), [Event loop block](/incidents/loop), and [GC pause storm](/incidents/gc-storm) depend on the runtime.
- [Bad deploy](/incidents/bad-deploy) and [Bad config push](/incidents/config) make the code itself fail.
- Every process holds database connections, so more copies can cause [Connection exhaustion](/incidents/connections).

:::Note{tone="real"}
Stateless servers are easy to copy. That is why real teams scale them out first. See [vertical and horizontal scaling](/glossary/vertical-and-horizontal-scaling).
:::

## Tips

- Match the instance family to the runtime: Compute for CPU-bound runtimes, Memory for many workers.
- Restart a leaking server to free its memory. It comes back cold.
