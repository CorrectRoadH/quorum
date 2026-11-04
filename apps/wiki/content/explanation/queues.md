---
title: Capacity, utilization, and queues
summary: Why a Node gets slow long before it is full, what the amber and red cards mean, and how Queues trade waiting for safety.
section: explanation
order: 3
aliases: utilization, capacity, saturation, queueing, hockey stick, backlog, queue depth, little's law, headroom
gdd: docs/gdd/04-simulation.md
---

Every Node has a capacity: the most work it can do per second. How full a Node is decides how long
requests wait in it. The relationship is not a straight line, and that one fact explains most of the
slowdowns you meet in Quorum.

## Utilization

[Utilization](/glossary/utilization), written ρ (rho), is the work that arrives divided by the work the
Node can do:

```formula
utilization = offered work / capacity
```

Work is measured in the Node's own unit. For an App Server it is CPU time, worker slots, memory, or
network. For a Database it is CPU and connections. The Node's capacity is set by its tightest limit.
The load bar on each card shows utilization, and the card changes color as it rises:

- **Under 70%.** Healthy. Requests barely wait.
- **70% to 90%.** Amber. Waiting time rises fast.
- **90% and above.** Red. The tail is several times the median.
- **Over 100%.** Saturated. The Node processes what it can and drops the rest as errors.

## The hockey stick

Waiting time grows with `ρ / (1 − ρ)` times the service time. At 50% utilization, a request waits
about as long as it takes to serve. At 90%, it waits about nine times as long. The curve is flat for
a long time and then shoots up, like a hockey stick.

This is why a Node at 85% is not "fine with 15% to spare". It is already slow, and a small rise in
traffic makes it much slower. It is also why a small upgrade to a hot Node can help so much.

::Quiz{question="A Node runs at 90% utilization. You double its capacity, so it runs at 45%. About how much does its queueing wait change?" options="It halves|It falls about tenfold|It does not change" answer="2" explain="Wait grows with ρ / (1 − ρ). At 90% that is 9, and at 45% it is about 0.8, so the wait falls by more than ten times."}

:::Note{tone="real"}
Real servers do not follow the single-server queue (M/M/1) exactly. Most have many workers and
irregular service times. But the shape holds everywhere: latency stays flat at low load and rises
steeply as utilization nears 100%. Operators keep a margin of headroom for exactly this reason.
:::

## Headroom is not waste

Demand follows a daily cycle, and the evening peak is far above the daily average. A Design sized
for the average runs red every evening. Spare capacity also absorbs a traffic spike and the loss of
one Node. So a healthy Design runs well under the amber line most of the time.

You can buy headroom three ways:

- **Scale up.** Resize a Node to a bigger instance. Each step doubles vCPU and RAM, but the Node
  restarts and comes back cold. Some software cannot use the extra cores.
- **Scale out.** Add copies behind DNS or a Load Balancer. Each copy of a Component costs more to place
  than the one before.
- **Scale with demand.** An [Autoscaler](/components/autoscaler) adds copies when load passes its
  target and removes them when load falls. New copies take time to boot, so keep a margin anyway.

See [vertical and horizontal scaling](/glossary/vertical-and-horizontal-scaling) and the
[Infrastructure](/infrastructure) reference for instance sizes and prices.

## Slots, not only CPU

An App Server can be full while its CPU is idle. Runtimes such as PHP-FPM, Gunicorn, Puma, and
Tomcat hold a worker or thread for each request until it finishes, including the time it waits on the
Database. When every slot waits, new requests queue, even though the CPU has nothing to do.

This is [Little's law](/glossary/littles-law): slots in use equal the arrival rate times the time each
request holds a slot. Double the wait and you halve the requests a fixed pool can serve. You can fix
the slow call, add workers, or move to a runtime that waits without a slot. The [Runtimes](/runtimes)
pages show which model each runtime uses, and [How requests flow](/explanation/requests) explains why
this links your App Servers to your Database.

## Queues: waiting on purpose

A [Queue](/components/queue) is a Component that stores work so that [Workers](/components/worker)
can do it later. An App Server linked to a Queue hands over the slow, asynchronous part of some
requests, such as resizing an upload or building an export. The user waits only for the enqueue.

A Queue does not drop work when its Workers fall behind. It stores the excess as **depth**, and the
Workers drain it when they can. That turns a burst into a delay instead of errors. But depth is not
free:

- A new task waits behind every task already in the Queue. Users score an upload or export on when
  its result is ready, so a deep Queue frustrates them.
- With no length limit, depth can grow without end when Workers drain slower than tasks arrive.
- A Queue's max length is [backpressure](/glossary/backpressure). Past it, the Queue refuses new
  tasks, and the request that sent one fails at once.

A task that fails comes back for another attempt later. Without a dead-letter queue, a task that
always fails keeps coming back. See [dead-letter queue](/glossary/dead-letter-queue) and the
[Poison message](/incidents/poison) incident.

## Reading a red card

When a card turns red, ask what its tightest limit is. If it is CPU, add capacity or make the work
cheaper. If it is slots, look downstream for the slow call. If it is connections, read
[Errors and retries](/explanation/errors-and-retries). The bottleneck marker tells you which red card
to fix first.
