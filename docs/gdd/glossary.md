# Engineering glossary

[Index](./README.md) · Game vocabulary: [CONTEXT.md](../../CONTEXT.md) · Sources: [Reality check](./reality-check.md)

Real engineering terms that Quorum teaches. Each entry gives a short definition and the place where
the term appears in the game. The game ships this glossary in the Glossary panel. A term is
"discovered" the first time it affects the player's design.

Game terms, such as Node, Era, and Insight, are in [CONTEXT.md](../../CONTEXT.md), not here.

## Apdex

A score from 0 to 1 for user satisfaction with response time: satisfied requests (under a target T)
count fully, tolerating requests (under 4T) count half, the rest count zero.
In the game: revenue and user growth ([Simulation](./04-simulation.md#apdex-and-revenue)).

## Async I/O

A way to wait for the network or disk without holding a thread, so one thread can serve many waiting
requests. In the game: [event loops and green threads](./06-runtimes.md#concurrency-models).

## At-least-once delivery

A messaging guarantee: no message is lost, and some messages arrive twice. Consumers must be
idempotent. In the game: [Delivery semantics](./07-data-tier.md#delivery-semantics).

## Backpressure

A signal from a slow consumer that tells producers to slow down, instead of letting a queue grow
without limit. In the game: Queue max length ([Components](./05-components.md#queue)).

## Bcrypt

A password hashing function designed to be slow, with a tunable cost. Slowness protects stored
passwords and costs CPU on every login. In the game: the `login` kind
([Simulation](./04-simulation.md#request-kinds)).

## Blast radius

How much of a system one failure affects. In the game: per runtime
([Runtimes](./06-runtimes.md#language-profiles)) and per deploy strategy
([Components](./05-components.md#cicd-pipeline)).

## Blue-green deployment

Running two full environments and switching traffic from the old one to the new one at once, with
instant rollback. In the game: [CI/CD Pipeline](./05-components.md#cicd-pipeline).

## Brooks's law

"Adding manpower to a late software project makes it later." Communication overhead grows faster than
headcount. In the game: [Coordination](./08-team-and-velocity.md#coordination).

## Bulkhead

A limit on how much of a caller's capacity one dependency can use, so one slow dependency cannot
exhaust it. In the game: [Links](./05-components.md#links).

## Burn rate

How fast a service spends its error budget, relative to the SLO. A burn rate of 1 spends exactly
the whole budget in the SLO window. In the game: [The Dashboard](./12-observability.md#the-dashboard).

## Cache-aside

The application reads from the cache, and on a miss reads from the database and fills the cache.
In the game: [Cache strategies](./07-data-tier.md#strategies-a-tradeoff-card).

## Cache stampede

Many requests miss the same cache key at the same time and overload the database together.
In the game: [Stampedes](./07-data-tier.md#stampedes), [incident](./11-incidents.md#cache-stampede).

## Canary deployment

Sending a small share of traffic to a new version and checking it before sending the rest.
In the game: [CI/CD Pipeline](./05-components.md#cicd-pipeline).

## CDC (change data capture)

Reading a database's change log and publishing each change as an event. In the game:
[CDC Connector](./05-components.md#cdc-connector).

## Circuit breaker

A switch on a call path that stops calls to a failing dependency for a while, so callers fail fast
and the dependency can recover. In the game: [Links](./05-components.md#links),
[Retry storm](./11-incidents.md#retry-storm).

## Cold start

The delay when a new process or function instance starts before it can serve. In the game:
[Serverless Function](./05-components.md#serverless-function), [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

## Connection pooling

Sharing a small number of database connections among many clients. In the game:
[Connection Pooler](./07-data-tier.md#connection-pooler).

## Consistent hashing

A way to map keys to servers so that adding or removing a server moves only a small share of keys.
In the game: a [Load Balancer](./05-components.md#load-balancer) algorithm.

## Conway's law

Organizations design systems that copy their communication structure. In the game:
[Services](./08-team-and-velocity.md#services).

## DORA metrics

Five measures of software delivery from the DORA research program: deploy frequency, lead time for
changes, change failure rate, failed deployment recovery time (formerly time to restore service),
and rework rate. In the game:
[Deploy frequency](./08-team-and-velocity.md#deploy-frequency).

## Egress

Data leaving a cloud network, which cloud providers charge for. In the game:
[Egress](./09-economy.md#egress).

## Error budget

The amount of failure an SLO allows. Teams spend it on risk, such as faster releases. In the game:
[SLOs and error budgets](./11-incidents.md#slos-and-error-budgets).

## Event loop

A single thread that runs callbacks one at a time when their I/O is ready. It serves many waiting
connections, and any long-running callback blocks all of them. In the game:
[Event loops and blocking](./06-runtimes.md#event-loops-and-blocking).

## Eventual consistency

Replicas may return old data for a while, and they converge if writes stop. In the game:
[Wide-column Store](./07-data-tier.md#wide-column-store).

## Fallacies of distributed computing

Eight false assumptions about networks, collected by L. Peter Deutsch and others at Sun: the network
is reliable, latency is zero, bandwidth is infinite, the network is secure, topology does not change,
there is one administrator, transport cost is zero, and the network is homogeneous. In the game: the
"Fallacies" achievement ([Challenges](./14-challenges.md#achievements)).

## Fan-out

One request that becomes many requests to other services. In the game:
[Fan-out](./07-data-tier.md#fan-out).

## Feature flag

A switch that turns a feature on or off at runtime, often for a share of users. In the game:
[Feature Flags](./05-components.md#feature-flags).

## GC pause

Time when a garbage collector stops or slows the application to reclaim memory. In the game:
[Runtime behaviors](./06-runtimes.md#runtime-behaviors).

## GIL (global interpreter lock)

A lock in CPython (and the GVL in CRuby) that lets only one thread run interpreter code at a time.
Threads still overlap I/O waits, but CPU work does not run in parallel inside one process. In the
game: [Concurrency models](./06-runtimes.md#concurrency-models).

## Green threads

Lightweight threads scheduled by the runtime instead of the operating system, such as goroutines,
Java virtual threads, and Erlang processes. In the game:
[Concurrency models](./06-runtimes.md#concurrency-models).

## Health check

A periodic probe that decides whether a server should receive traffic. In the game:
[Load Balancer](./05-components.md#load-balancer).

## Hedged request

Sending a second copy of a slow request to another replica and using whichever answer arrives first.
In the game: research `hedged-requests` ([Progression](./10-progression.md#track-reliability)).

## Hot key

A key that receives a very large share of traffic, which overloads the one server that owns it.
In the game: [Partitioning](./07-data-tier.md#partitioning-sharding).

## Idempotency

An operation is idempotent when doing it twice has the same effect as doing it once. Idempotency keys
let a server detect a retry. In the game: [Payment Provider](./05-components.md#payment-provider).

## JIT warmup

The time a just-in-time compiler needs to compile hot code before a process reaches full speed.
In the game: [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

## Little's law

In a stable system, the average number of items inside equals the arrival rate times the average time
each item stays: L = λW. In the game: [The latency coupling](./04-simulation.md#the-latency-coupling).

## Load shedding

Rejecting some requests on purpose during overload, so the rest succeed. In the game:
[Mitigation toolbox](./11-incidents.md#mitigation-toolbox).

## Memory leak

Memory that a long-running process keeps but no longer uses, so its memory grows with uptime.
In the game: [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

## Metastable failure

An overload that keeps itself going after its trigger is gone, often because of retries. In the game:
[Retry storm](./11-incidents.md#retry-storm).

## MTTR

Mean time to restore service after an incident. In the game:
[The incident loop](./11-incidents.md#the-incident-loop).

## N+1 query

Loading a list with one query and then each item's related data with one more query per item, often
caused by an ORM's lazy loading. In the game: [Frameworks](./06-runtimes.md#frameworks).

## OLTP and OLAP

Online transaction processing (many small reads and writes) and online analytical processing (few
large scans). They need different storage. In the game:
[Data Warehouse](./07-data-tier.md#data-warehouse).

## Percentile (p50, p95, p99)

The value under which a given share of measurements fall. The p99 latency is the latency that 99% of
requests beat. In the game: [Percentiles](./04-simulation.md#percentiles).

## Power of two choices

A load balancing method: pick two servers at random and send to the less loaded one. In the game:
[Load Balancer](./05-components.md#load-balancer).

## Process per request

A server model in which each request occupies a whole process until it finishes, as in PHP-FPM.
In the game: [Concurrency models](./06-runtimes.md#concurrency-models).

## Quorum

The number of replicas that must take part in a read or write. With N replicas, read quorum R, and
write quorum W, R + W > N means every read asks at least one replica that acknowledged the latest
write. That is not linearizability: concurrent writes and sloppy quorums can still return old
values. In the game:
[Wide-column Store](./07-data-tier.md#wide-column-store).

## Raft

A consensus algorithm in which a leader replicates a log to a majority of nodes before a write
commits. In the game: [Distributed SQL](./07-data-tier.md#distributed-sql).

## Rate limiting

Capping how many requests a client can make in a period, often with a token bucket. In the game:
[API Gateway](./05-components.md#api-gateway).

## Read-your-writes consistency

A guarantee that a user always sees their own recent writes. In the game:
[Read Replica](./07-data-tier.md#read-replica).

## RED method

Rate, Errors, and Duration for each service. It measures what users feel, so alerts watch it. In
the game: [The Dashboard](./12-observability.md#the-dashboard).

## Replication lag

The delay between a write on a primary database and its arrival on a replica. In the game:
[Read Replica](./07-data-tier.md#read-replica).

## Retry with backoff and jitter

Waiting longer after each failed attempt, with a random spread, so that clients do not retry together.
In the game: [Retries](./04-simulation.md#retries).

## RPO and RTO

Recovery point objective (how much recent data can be lost) and recovery time objective (how long
recovery can take). In the game: [Multi-region data](./07-data-tier.md#multi-region-data),
[the IPO checklist](./10-progression.md#era-6-pre-ipo).

## Rule of 40

A heuristic for software companies: revenue growth rate plus profit margin should be at least 40%.
In the game: [Valuation](./09-economy.md#valuation).

## Sharding

Splitting data across several databases by a key. In the game:
[Partitioning](./07-data-tier.md#partitioning-sharding).

## Shared nothing

A design in which each request or node shares no memory with others. PHP-FPM requests are shared
nothing: each starts clean. In the game: [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

## SLO, SLA, SLI

A service level indicator is a measurement, such as availability. A service level objective is a
target for it. A service level agreement is a contract with penalties. In the game:
[SLOs and error budgets](./11-incidents.md#slos-and-error-budgets).

## Spot instance

Spare cloud capacity sold at a discount that the provider can reclaim with short notice. In the game:
[Pricing models](./09-economy.md#pricing-models).

## Strangler pattern

Replacing a system piece by piece by routing more traffic to the new version over time. In the game:
[Migrations](./08-team-and-velocity.md#migrations).

## Tail at scale

When a request fans out to many servers, the slowest server decides its latency, so rare slowness on
each server becomes common slowness overall. From Dean and Barroso (2013). In the game:
[Percentiles](./04-simulation.md#percentiles).

## Tech debt

Shortcuts in code that make later changes slower until someone repays them. In the game:
[Tech debt](./08-team-and-velocity.md#tech-debt).

## Thundering herd

Many clients waking up and acting at the same moment, for example reconnecting after a restart.
In the game: [Realtime Hub](./05-components.md#realtime-hub).

## Token bucket

A rate limiting method: tokens refill at a fixed rate, and each request takes one. In the game:
[API Gateway](./05-components.md#api-gateway).

## Transactional outbox

Writing a change and an event about it in the same database transaction, then publishing the event
later. In the game: [Keeping copies in sync](./07-data-tier.md#keeping-copies-in-sync).

## USE method

Utilization, Saturation, and Errors for each resource, such as CPU, memory, or a connection pool. It
measures causes, not symptoms. In the game: [The Dashboard](./12-observability.md#the-dashboard).

## Utilization

The share of a resource's capacity in use. Queueing delay rises sharply as utilization approaches
100%. In the game: [Capacity, utilization, and queues](./04-simulation.md#capacity-utilization-and-queues).

## Vertical and horizontal scaling

Vertical scaling makes one machine bigger. Horizontal scaling adds more machines. In the game:
[Vertical and horizontal](./16-balancing.md#vertical-and-horizontal).

## Write-through cache

Every write goes to the cache and the database together, so cached reads are never stale for those
keys. In the game: [Cache strategies](./07-data-tier.md#strategies-a-tradeoff-card).
