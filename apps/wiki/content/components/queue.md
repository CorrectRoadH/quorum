## What it does

The Queue stands for RabbitMQ: a broker that holds work now so that [Workers](/components/worker) can do it later.

When an App Server links to a Queue, kinds that can go async hand most of their work to it as tasks: uploads, exports, webhooks, and notifications. The user waits only for the enqueue. The Queue offers its Workers what arrives, plus part of its backlog when they have room. It has a throughput limit, which each size step doubles.

Queue depth is the number of tasks waiting. A large backlog slows each enqueue a little.

Settings on its card:

- **Max length**: refuses new tasks when full, instead of growing without limit. See [backpressure](/glossary/backpressure).
- **Dead-letter queue**: moves a task aside after its max attempts. Without one, a failing task retries forever. See [dead-letter queue](/glossary/dead-letter-queue).

## When to place it

Place it when slow kinds hold App Server slots, for example uploads from slow clients or exports. A growing depth is the earliest sign that Workers are too slow.

## How it fails

- With no Worker linked, every task is stranded.
- A full Queue refuses what its Workers cannot take, and those requests fail as dropped.
- [Poison message](/incidents/poison): a task that always fails keeps coming back, and Workers spend most of their time on it. A dead-letter queue prevents it. Delete the message to end it.
- A [Zone outage](/incidents/zone) takes it down unless it has a standby.

## Tips

- Turn on the dead-letter queue as soon as you place a Queue.
- Watch depth, not latency: users do not feel a backlog until it hits the max length.
