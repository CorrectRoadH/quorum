## What it does

The Worker stands for a background job runner such as Sidekiq: your code, off the request path.

It pulls tasks from a [Queue](/components/queue) and runs the async part of each kind. It sends read and write queries, push messages, and calls to customer servers. It runs the same [runtimes and frameworks](/runtimes) as an App Server, with an instance type and size. Users never wait for it. Its throughput decides whether the Queue drains or grows.

An export runs many read queries in its task, so link the Worker to the data it reads: the [Database](/components/database), a [Cache](/components/cache), or a [Read Replica](/components/replica). Link it to the [Push Provider](/components/msgp) for notifications.

**Prefetch** sets how many tasks each process takes ahead of time. Higher prefetch spends less time waiting on the broker. A crash loses every task a process had taken.

## When to place it

Place a Worker when you place a Queue: without one, tasks have nowhere to go. Add copies when Queue depth keeps growing.

## How it fails

- Too slow, and the Queue backlog grows until its max length refuses new tasks.
- A crash loses the tasks it had prefetched. A planned restart hands them back first.
- [Poison message](/incidents/poison) keeps Workers busy on one failing task.
- [Bad deploy](/incidents/bad-deploy), [Bad config push](/incidents/config), and [Memory leak](/incidents/leak) hit Workers like App Servers.
- Each process holds database connections, which counts toward [Connection exhaustion](/incidents/connections).

:::Note{tone="real"}
Real queues deliver at least once, so a job can run twice. See [at-least-once delivery](/glossary/at-least-once-delivery).
:::

## Tips

- Link Workers to an [Autoscaler](/components/autoscaler) to follow the backlog.
- Keep prefetch low on Workers that crash often.
