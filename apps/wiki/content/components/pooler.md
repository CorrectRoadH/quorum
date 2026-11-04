## What it does

The Connection Pooler stands for PgBouncer: a proxy that lets many app connections share a few database connections.

Place it between your App Servers or Workers and the [Database](/components/database). It takes the same queries the Database takes and passes them on, with almost no added latency. It has a throughput limit, which each size step doubles.

Its mode sets how many Database connections it opens:

- **Transaction** (the default): every client shares 20 server connections. Code that keeps session state breaks, and a share of requests crash until your team finishes the "Drop session state" task on the [Team](/team#tasks) page.
- **Session**: one server connection per client. Nothing breaks, and it barely helps.

See [connection pooling](/glossary/connection-pooling).

## When to place it

Place it when the Database refuses connections: errors show `refused` while its CPU is not full. This happens when you add App Servers, or when a runtime opens a large pool per process. The [Connection Limit](/sandboxes/connection-limit) Sandbox shows it.

::Sandbox{id="connection-limit"}

## How it fails

- Without one, [Connection exhaustion](/incidents/connections) is much more likely. A deploy doubles every pool, and Postgres refuses the excess.
- In transaction mode, crashes continue until the session-state task is done.
- Overloaded, it drops queries before they reach the Database.
- A [Zone outage](/incidents/zone) takes it down unless it has a standby in another zone.

## Tips

- Queue the "Drop session state" task as soon as you place a Pooler in transaction mode.
- Link a [Cache](/components/cache) to the Pooler, not straight to the Database.
