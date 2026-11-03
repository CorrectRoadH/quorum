# 5. Components

[Index](./README.md) · Previous: [Simulation](./04-simulation.md) · Next: [Runtimes and frameworks](./06-runtimes.md)

A **Component** is an entry in the catalog. A **Node** is one placed copy of it. This document lists
every Component, the real products it stands for, its stats, and its options. Database and cache
details are in [Data tier](./07-data-tier.md). Runtime details for App Servers are in
[Runtimes](./06-runtimes.md).

## Rules for all Components

- **Place.** Placing a Node costs Cash. Each further copy of the same Component costs 25% more than
  the previous copy ([Balancing](./16-balancing.md#prices)).
- **Burn.** Each Node burns Cash every second while it exists, even while it is down.
- **Resize.** Most Components have sizes. A size step doubles resources and doubles Burn. A resize
  restarts the Node, so it is briefly down unless a redundant Node carries the load. Real cloud
  prices scale linearly with size, so vertical scaling is not a discount. It saves a network hop, a
  load balancer, and per-process overhead ([Balancing](./16-balancing.md#vertical-and-horizontal)).
- **Sell.** Removing a Node refunds 50% of its placement cost and stops its Burn. Reserved Nodes keep
  burning until their term ends ([Economy](./09-economy.md#pricing-models)).
- **Options.** A Tradeoff card presents each option. An option belongs to the choice, not to the
  Component, so several Components share the same card ([Interface](./15-ui-ux.md#tradeoff-cards)).
- **Variants.** Some Components have product variants, such as RabbitMQ or Kafka for the Queue. A
  variant is a sidegrade: it changes the profile, not the tier.

## Catalog overview

| Group         | Component                                                | Code   | Unlocked by              | Era      |
| ------------- | -------------------------------------------------------- | ------ | ------------------------ | -------- |
| Edge          | [Users](#users)                                          | `www`  | Starter                  | Garage   |
| Edge          | [DNS](#dns)                                              | `dns`  | DNS round robin          | Garage   |
| Edge          | [Load Balancer](#load-balancer)                          | `lb`   | Load balancing           | Garage   |
| Edge          | [CDN](#cdn)                                              | `cdn`  | Content delivery         | Seed     |
| Edge          | [WAF](#waf)                                              | `waf`  | Web application firewall | Seed     |
| Edge          | [API Gateway](#api-gateway)                              | `gw`   | API gateway              | Series A |
| Compute       | [App Server](#app-server)                                | `app`  | Starter                  | Garage   |
| Compute       | [Worker](#worker)                                        | `wrk`  | Background jobs          | Seed     |
| Compute       | [Serverless Function](#serverless-function)              | `fn`   | Serverless               | Series A |
| Compute       | [Kubernetes Cluster](#kubernetes-cluster)                | `k8s`  | Container orchestration  | Series A |
| Compute       | [GPU Node](#gpu-node)                                    | `gpu`  | Model serving            | Series B |
| Compute       | [Edge Function](#edge-function)                          | `edge` | Edge compute             | Series C |
| Data          | [Database](./07-data-tier.md#relational-database)        | `sql`  | Starter                  | Garage   |
| Data          | [Connection Pooler](./07-data-tier.md#connection-pooler) | `pool` | Connection pooling       | Pre-seed |
| Data          | [Cache](./07-data-tier.md#cache)                         | `kv`   | Caching                  | Pre-seed |
| Data          | [Read Replica](./07-data-tier.md#read-replica)           | `rep`  | Replication              | Pre-seed |
| Data          | [Search Engine](./07-data-tier.md#search-engine)         | `fts`  | Full-text search         | Seed     |
| Data          | [Object Storage](./07-data-tier.md#object-storage)       | `s3`   | Object storage           | Seed     |
| Data          | [Document Store](./07-data-tier.md#document-store)       | `doc`  | Document databases       | Series A |
| Data          | [Data Warehouse](./07-data-tier.md#data-warehouse)       | `olap` | Data warehousing         | Series B |
| Data          | [Vector Index](./07-data-tier.md#vector-index)           | `vec`  | Embeddings               | Series B |
| Data          | [Wide-column Store](./07-data-tier.md#wide-column-store) | `wide` | Leaderless replication   | Series C |
| Data          | [Distributed SQL](./07-data-tier.md#distributed-sql)     | `dsql` | Consensus databases      | Series C |
| Async         | [Queue](#queue)                                          | `mq`   | Message queues           | Seed     |
| Async         | [Realtime Hub](#realtime-hub)                            | `ws`   | WebSockets               | Series A |
| Async         | [Event Stream](#event-stream)                            | `log`  | Event streaming          | Series B |
| Async         | [CDC Connector](#cdc-connector)                          | `cdc`  | Change data capture      | Series B |
| Platform      | [Autoscaler](#autoscaler)                                | `hpa`  | Autoscaling              | Series A |
| Platform      | [Service Mesh](#service-mesh)                            | `mesh` | Service mesh             | Series B |
| Platform      | [CI/CD Pipeline](#cicd-pipeline)                         | `ci`   | Continuous delivery      | Pre-seed |
| Platform      | [Feature Flags](#feature-flags)                          | `ff`   | Feature flags            | Seed     |
| Platform      | [Secrets and Certificates](#secrets-and-certificates)    | `pki`  | Certificate automation   | Seed     |
| Observability | [Analytics](#analytics)                                  | `otel` | Starter                  | Garage   |
| Observability | [Payments](#payments)                                    | `pay`  | Starter                  | Garage   |
| Managed       | [Payment Provider](#payment-provider)                    | `psp`  | Checkout                 | Series A |
| Managed       | [Auth Provider](#auth-provider)                          | `idp`  | Managed identity         | Pre-seed |
| Managed       | [LLM API](#llm-api)                                      | `llm`  | Hosted models            | Series B |
| Managed       | [Push and Email Provider](#push-and-email-provider)      | `msgp` | Notifications            | Series C |

## Stats

| Component                | Place ($) | Burn at base ($/s)        | Capacity at base                | Base latency           | Sizes   |
| ------------------------ | --------- | ------------------------- | ------------------------------- | ---------------------- | ------- |
| Users                    | —         | —                         | —                               | 30 ms                  | —       |
| DNS                      | 20        | 0.01                      | Unlimited                       | 0 ms (cached)          | —       |
| Load Balancer            | 120       | 0.08                      | 2,000 rps (L7), 20,000 rps (L4) | 1 ms (L7), 0.2 ms (L4) | 6       |
| CDN                      | 220       | 0.05 + egress             | Unlimited                       | 8 ms at edge           | —       |
| WAF                      | 260       | 0.10                      | 5,000 rps                       | 2 ms                   | 6       |
| API Gateway              | 300       | 0.002 per request         | 10,000 rps                      | 6 ms                   | —       |
| App Server               | 60        | Instance price            | Runtime model                   | 2 ms                   | 9       |
| Worker                   | 60        | Instance price            | Runtime model                   | —                      | 9       |
| Serverless Function      | 0         | Per request + GB-s        | 1,000 concurrent                | Cold start             | —       |
| Kubernetes Cluster       | 500       | 0.10 control plane        | Holds services                  | —                      | —       |
| GPU Node                 | 900       | 0.53 (T4) to 3.30 (H100)  | Tokens per second               | Model-based            | 3 types |
| Edge Function            | 0         | Per request               | Unlimited                       | 5 ms                   | —       |
| Database                 | 90        | Instance price            | IOPS and CPU                    | 2 ms                   | 9       |
| Connection Pooler        | 80        | 0.03                      | 10,000 client connections       | 0.3 ms                 | 4       |
| Cache                    | 150       | 0.06                      | 50,000 ops/s per core           | 0.5 ms                 | 8       |
| Read Replica             | 160       | As Database               | As Database (reads only)        | 2 ms                   | 9       |
| Search Engine            | 300       | 0.25                      | 400 queries/s per node          | 15 ms                  | 8       |
| Object Storage           | 280       | Per GB + egress           | Unlimited                       | 40 ms first byte       | —       |
| Document Store           | 260       | 0.20                      | 3,000 ops/s                     | 3 ms                   | 8       |
| Data Warehouse           | 800       | Per scan                  | Scan throughput                 | 1,500 ms               | —       |
| Vector Index             | 400       | 0.30                      | 500 queries/s                   | 20 ms                  | 6       |
| Wide-column Store        | 1,200     | 0.40 per node             | 10,000 writes/s per node        | 3 ms                   | 6       |
| Distributed SQL          | 2,500     | 0.65 per node             | 2,000 tx/s per node             | Quorum-based           | 6       |
| Queue                    | 360       | 0.10                      | Variant-based                   | 2 ms enqueue           | 6       |
| Realtime Hub             | 400       | 0.15                      | Connections by runtime          | 1 ms                   | 8       |
| Event Stream             | 900       | 0.30                      | 100,000 msg/s per broker        | 5 ms                   | 6       |
| CDC Connector            | 300       | 0.05                      | 20,000 changes/s                | Lag-based              | —       |
| Autoscaler               | 200       | 0                         | —                               | —                      | —       |
| Service Mesh             | 600       | Sidecar overhead          | —                               | +1 ms per hop          | —       |
| CI/CD Pipeline           | 100       | 0.02                      | —                               | —                      | —       |
| Feature Flags            | 150       | 0.01                      | —                               | —                      | —       |
| Secrets and Certificates | 80        | 0.005                     | —                               | —                      | —       |
| Analytics                | 40        | 0.05 + storage            | Samples per second              | —                      | 8       |
| Payments                 | —         | —                         | Drawer size                     | —                      | 6       |
| Payment Provider         | 0         | 2.9% + $0.30 per checkout | 1,000 tx/s                      | 400 ms                 | —       |
| Auth Provider            | 0         | Per monthly user          | Unlimited                       | 120 ms                 | —       |
| LLM API                  | 0         | Per token                 | Rate limit (tokens per minute)  | 600 ms first token     | —       |
| Push and Email Provider  | 0         | Per message               | 10,000 msg/s                    | Async                  | —       |

## Edge

### Users

The source of all traffic. Fixed, and the player cannot place or sell it.

- Users take **one** outbound link in the Garage Era, because a domain name resolves to one host. A
  **DNS** Node lifts this limit.
- In the Series C Era, Users split into regional sources (North America, Europe, Asia-Pacific, South
  America), each with its own share of demand and peak hour ([Zones and regions](#zones-and-regions)).

### DNS

Real products: Route 53, Cloudflare DNS.

DNS turns one link into many. It is the first fix when one box is not enough.

| Option                    | Effect                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Round robin               | Splits traffic evenly across up to 8 targets. No health checks: a dead target keeps its share until the TTL expires, and those requests fail. |
| TTL                       | 30 s, 300 s, or 3,600 s. A short TTL fails over faster and costs more queries. A long TTL is cheap and keeps sending users to a dead host.    |
| Health-checked (research) | Removes dead targets after the TTL.                                                                                                           |
| GeoDNS (Series C)         | Routes each region's users to the nearest target.                                                                                             |

Teaches: DNS is a slow, coarse load balancer. Real clients cache answers.

### Load Balancer

Real products: NGINX, HAProxy, Envoy, AWS ALB and NLB.

| Variant | Profile                                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L7      | Understands HTTP. Routes by path and kind, terminates TLS, retries failed requests. Lower capacity and 1 ms latency.                                           |
| L4      | Forwards TCP. Ten times the capacity, 0.2 ms latency, and cheaper. Cannot route by kind, cannot retry, and treats a long-lived connection as one unit of load. |

| Algorithm            | Behavior                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Round robin          | Equal shares. Good when targets are identical. Bad when one target is slower: it gets the same share and its queue grows.                                      |
| Weighted by capacity | Shares proportional to capacity. The default. Needs a reasonably fresh view of capacity.                                                                       |
| Least connections    | Sends to the target with the fewest in-flight requests. Adapts to slow targets. Best with mixed instance sizes.                                                |
| Power of two choices | Picks two targets at random and sends to the less loaded one. Nearly as good as least connections, with no global state. Research "Load balancing algorithms". |
| Consistent hashing   | The same key always goes to the same target. Improves cache hit ratio on the targets. One hot key overloads one target.                                        |

| Option                | Effect                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health check interval | 2 s, 10 s, or 30 s. Short intervals detect failures fast and cost a little CPU on targets. Long intervals keep routing to a dead Node.                                                            |
| Health check depth    | Shallow (process alive) or deep (checks the database too). Deep checks catch more failures, and they take every app server out of rotation when the database is slow, which causes a full outage. |
| Retries               | L7 only. See [retries](./04-simulation.md#retries).                                                                                                                                               |
| Sticky sessions       | Keeps a user on one target. Helps in-process caches and realtime. Unbalances load and loses sessions when a target dies.                                                                          |

Teaches: load balancing is a policy choice, and health checks can cause outages as well as prevent them.

### CDN

Real products: Cloudflare, Fastly, CloudFront, Akamai.

A CDN answers cacheable requests at the edge, near the user. It also cuts egress cost, because
egress from a CDN is cheaper than egress from the origin ([Economy](./09-economy.md#egress)).

| Kind    | Base hit ratio           | Notes                                                                   |
| ------- | ------------------------ | ----------------------------------------------------------------------- |
| `page`  | 70% of anonymous traffic | Logged-in pages are not cacheable unless research "Edge-side includes". |
| `media` | 75%                      | Raised to 92% by "Tiered caching".                                      |
| `read`  | 0%                       | 30% with Edge compute ([Edge Function](#edge-function)).                |

| Option          | Effect                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| TTL             | Longer TTL, higher hit ratio, staler content. A deploy needs a purge.                                                                       |
| Purge on deploy | Clears the cache. The origin takes a burst of misses: a small [stampede](./glossary.md#cache-stampede).                                     |
| Cache key       | Including query strings or cookies lowers the hit ratio. Ignoring them can serve one user's page to another, which is a data leak incident. |

### WAF

Real products: Cloudflare WAF, AWS WAF, ModSecurity with the OWASP Core Rule Set.

A WAF blocks bots and attacks before they reach the app.

| Option           | Bot block rate | False positive rate on real users | CPU per request |
| ---------------- | -------------- | --------------------------------- | --------------- |
| Paranoia level 1 | 60%            | 0.1%                              | Low             |
| Paranoia level 2 | 80%            | 0.5%                              | Medium          |
| Paranoia level 3 | 92%            | 2%                                | High            |
| Paranoia level 4 | 98%            | 6%                                | Very high       |

The OWASP Core Rule Set uses real paranoia levels with this tradeoff. Blocked real users fail as
`blocked`. Research "Bot management" adds a challenge that lowers false positives at the cost of
latency on suspicious requests.

The WAF has a regex cost. Incident "Regex backtracking" makes one rule consume all CPU on every WAF
Node, which takes the edge down ([Incidents](./11-incidents.md#catalog)).

### API Gateway

Real products: Kong, AWS API Gateway, Apigee.

Routes requests to services by path, checks authentication, and applies rate limits.

| Option             | Effect                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate limit         | A token bucket per user or per API key. Rejected requests fail as `throttled` and cost no downstream capacity. Protects against bursts and abusive clients. |
| Auth at the edge   | Validates tokens once, so services skip it. Adds 2 ms.                                                                                                      |
| Request coalescing | Merges identical in-flight reads. Lowers load during spikes.                                                                                                |

Cost is per request, so the gateway is cheap at low volume and expensive at high volume.

## Compute

### App Server

Real product: a virtual machine running your code.

The App Server is the center of the game. Its capacity depends on its instance type, its runtime, its
runtime variant, and its framework. [Runtimes and frameworks](./06-runtimes.md) defines all four.

| Instance family | vCPU : RAM    | Price per vCPU | Best for                                                                           |
| --------------- | ------------- | -------------- | ---------------------------------------------------------------------------------- |
| General         | 1 : 4 GB      | 1.0×           | Mixed workloads                                                                    |
| Compute         | 1 : 2 GB      | 0.85×          | CPU-bound runtimes and kinds: Go, Rust, Java, `login`, `upload`                    |
| Memory          | 1 : 8 GB      | 1.3×           | Memory-bound runtimes: many PHP-FPM or Ruby workers, the JVM                       |
| Burstable       | 1 : 2 GB      | 0.4×           | Garage. Earns CPU credits while idle and is throttled to 20% when credits run out. |
| ARM (research)  | Same as above | 0.8×           | 20% cheaper. Some runtimes and libraries are slower or need work to port.          |

Sizes go from `nano` (0.5 vCPU) to `metal` (96 vCPU): nine sizes, each step doubling vCPU and RAM, and
`metal` a 1.5× last step.

The App Server answers `page` and `bot` itself and turns other kinds into backend kinds
([Simulation](./04-simulation.md#backend-kinds)).

### Worker

Real products: Sidekiq, Celery, BullMQ, Oban.

A Worker runs the same runtimes as an App Server, but it pulls `task` from a Queue instead of
receiving user requests. Its latency does not count toward user latency. Its throughput decides
how long the queue grows.

| Option       | Effect                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------ |
| Concurrency  | Jobs in parallel per process. More is faster until CPU or memory runs out.                       |
| Prefetch     | Jobs taken from the queue ahead of time. Higher prefetch is faster, and a crash loses more jobs. |
| Max attempts | Retries for failed jobs before the dead-letter queue.                                            |

### Serverless Function

Real products: AWS Lambda, Google Cloud Functions, Azure Functions.

Pay per request and per GB-second. Scales from zero to 1,000 concurrent executions with no
placement cost.

| Tradeoff        | Detail                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cost curve      | Cheap at low and spiky volume. Above about 30% steady utilization of an equal VM, it costs more than the VM.                                                |
| Cold starts     | A new execution environment starts cold. Cold start by runtime: Rust and Go 50 ms, Node and Python 200 ms, .NET 500 ms, JVM 2,000 ms (native image 100 ms). |
| Concurrency cap | 1,000 per region by default. Spikes above the cap are throttled.                                                                                            |
| Connections     | Each concurrent execution opens its own database connections. Without a pooler, a spike exhausts Postgres.                                                  |
| Duration limit  | 15 minutes. Long `job` work must be split.                                                                                                                  |

### Kubernetes Cluster

Real products: Kubernetes, EKS, GKE.

A cluster holds App Servers and Workers as replicas of services, instead of as separate VMs.

| Benefit                                                      | Cost                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Bin packing: 15% less Burn for the same capacity             | Control plane Burn                                                                                          |
| Rolling deploys and self-healing restarts                    | Platform Dev Hours: 0.5 engineers per cluster, or a Platform team ([Team](./08-team-and-velocity.md#teams)) |
| Fast autoscaling of replicas (30 s instead of 3 min for VMs) | Noisy neighbors: replicas on the same node share CPU                                                        |
| Unlocks the Service Mesh                                     | A cluster upgrade incident every calendar quarter if not maintained                                         |

Teaches: orchestration pays off at a certain size, and it has a real operational cost.

### GPU Node

Real products: vLLM or Triton on NVIDIA T4, A100, and H100.

Serves `infer`. Capacity is measured in tokens per second.

| Option       | Effect                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| GPU type     | T4: cheap, slow. A100: balanced. H100: fastest per dollar, and scarce. Placing an H100 has a waiting list in some calendar months.                  |
| Batch size   | Larger batches raise throughput and raise time to first token. Continuous batching (research) keeps latency low at high throughput.                 |
| Quantization | FP16, INT8, INT4. Lower precision is faster and uses less memory, and it lowers answer quality, which lowers `ai` value by 5% (INT8) or 15% (INT4). |
| Model size   | Small, medium, large. Larger models earn more per prompt and need more GPU memory. A model that does not fit causes `oom`.                          |

### Edge Function

Real products: Cloudflare Workers, Fastly Compute.

Runs small handlers in the CDN, near the user. Starts in under 5 ms because it uses V8 isolates
instead of containers.

- Answers 30% of `read` from an edge key-value cache, and personalizes cached pages.
- Supports JavaScript, TypeScript, and WebAssembly only. Rust and Go can compile to WebAssembly.
- Has a CPU time limit per request. CPU-heavy kinds fail as `timeout`.

## Data

The data tier has its own document: [Data tier](./07-data-tier.md). This table is a summary.

| Component         | Serves                                                       | The tradeoff it teaches                                                                               |
| ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Database          | `q-read`, `q-write`, `q-tx`, small `q-search`, slow `q-scan` | One source of truth with a hard vertical limit and a connection limit.                                |
| Connection Pooler | Database connections                                         | Fewer connections, and some session features stop working.                                            |
| Cache             | `q-read`                                                     | Speed against staleness and stampedes.                                                                |
| Read Replica      | `q-read`                                                     | Read capacity against replication lag.                                                                |
| Search Engine     | `q-search`                                                   | Fast search against indexing lag and heap memory.                                                     |
| Object Storage    | `blob-get`, `blob-put`                                       | Unlimited storage against egress cost and first-byte latency.                                         |
| Document Store    | `q-read`, `q-write`                                          | Developer velocity against joins and transactions.                                                    |
| Data Warehouse    | `q-scan`                                                     | Cheap scans against freshness.                                                                        |
| Vector Index      | Embedding lookups for `ai`                                   | Better AI answers against memory and recall.                                                          |
| Wide-column Store | `q-read`, `q-write` at very high volume                      | Linear write scaling against partition design and eventual consistency. The game's namesake: quorums. |
| Distributed SQL   | `q-tx` across regions                                        | Global consistency against write latency.                                                             |

## Async

### Queue

Real products: RabbitMQ, Amazon SQS, Kafka (as a queue).

A Queue accepts work now and lets Workers finish it later. Everything behind a Queue is
asynchronous: the user does not wait for it ([Simulation](./04-simulation.md#latency)).

| Variant  | Profile                                                                                                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RabbitMQ | Smart broker. Per-message acknowledgment, routing by key, priorities. 20,000 msg/s per node. Memory grows with backlog, and a large backlog slows the broker.                                             |
| SQS      | Managed. No placement cost, pay per request. Standard queues: nearly unlimited throughput, at-least-once delivery, no strict order. FIFO queues: ordered and deduplicated, with a lower throughput limit. |
| Kafka    | See [Event Stream](#event-stream). A log, not a queue: messages stay after they are read.                                                                                                                 |

| Option             | Effect                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery           | At-most-once: fast, loses work on a crash. At-least-once: safe, delivers duplicates, so jobs must be idempotent ([Async patterns](./07-data-tier.md#delivery-semantics)). |
| Visibility timeout | How long a job stays hidden after a Worker takes it. Too short: a slow job runs twice. Too long: a crashed job waits.                                                     |
| Dead-letter queue  | Moves jobs that fail too often aside. Without one, a poison message blocks the queue forever ([Incidents](./11-incidents.md#catalog)).                                    |
| Max length         | Rejects new work when full (backpressure) instead of growing without limit.                                                                                               |

Queue depth is a game stat. A growing depth is the earliest sign that Workers are too slow.

### Realtime Hub

Real products: Phoenix Channels, Socket.IO, Centrifugo, Pusher.

Holds the long-lived connections that `rt` needs and fans messages out to them. Its capacity is
measured in concurrent connections and depends on the runtime: a thread per connection holds about
1 MB of memory, and a BEAM process holds a few KB ([Runtimes](./06-runtimes.md#realtime-connections)).

| Option            | Effect                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presence          | Tracks who is online. Earns more per message (social features) and costs CPU per join and leave.                                                     |
| Reconnect backoff | After a deploy or crash, all clients reconnect. Without jittered backoff they reconnect at once: a [thundering herd](./glossary.md#thundering-herd). |
| Clustering        | Several hubs share a pub/sub backbone. Needed above one box.                                                                                         |

### Event Stream

Real products: Apache Kafka, Redpanda, Amazon Kinesis.

A partitioned, replicated log. Producers append, consumers read at their own pace.

| Option             | Effect                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Partitions         | Parallelism. A consumer group can use at most one consumer per partition. Order is guaranteed only inside a partition. |
| Partition key      | A key with skewed volume makes a hot partition.                                                                        |
| Replication factor | 1, 2, or 3. Higher is safer and costs more disk and write latency.                                                     |
| `acks`             | `0`, `1`, or `all`. Trades write latency for durability.                                                               |
| Retention          | How long messages stay. Allows replay into a new consumer, such as a new search index, without touching the database.  |

Consumer lag is a game stat. It is the stream's version of queue depth.

### CDC Connector

Real products: Debezium.

Reads the database's write-ahead log and publishes every change to an Event Stream. Feeds the
Search Engine, the Data Warehouse, and caches without dual writes from the app.

- Removes the "dual write" inconsistency risk: writing to the database and the index separately can
  leave them out of sync ([Data tier](./07-data-tier.md#keeping-copies-in-sync)).
- Adds lag. Search results and reports are seconds behind.

## Platform

### Autoscaler

Real products: Kubernetes HPA, AWS Auto Scaling groups.

Attaches to a group of App Servers or Workers and adds or removes copies.

| Option            | Effect                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signal            | CPU utilization, request rate, queue depth, or p95 latency. CPU is wrong for runtimes that wait on I/O, because their CPU stays low while workers are full. Queue depth is best for Workers. |
| Target            | The utilization to hold, for example 60%. Lower is safer and costs more.                                                                                                                     |
| Reaction time     | VMs take 3 minutes to boot and warm. Containers take 30 seconds. A spike that is faster than the reaction time still hurts.                                                                  |
| Cooldown          | Minimum time between scaling actions. Too short causes flapping. Too long reacts late.                                                                                                       |
| Min and max       | The max is a cost guard. Without a max, a bug or an attack scales the bill ([Incidents: runaway bill](./11-incidents.md#catalog)).                                                           |
| Scheduled scaling | Adds capacity before the known daily peak.                                                                                                                                                   |

JVM warmup interacts with autoscaling: new copies are slow for their first seconds, so a scale-up
under load can make the p99 worse at first ([Runtimes](./06-runtimes.md#runtime-behaviors)).

### Service Mesh

Real products: Istio, Linkerd.

Adds a sidecar proxy to every service in a Kubernetes Cluster.

| Gives                                                                | Costs                                             |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| Mutual TLS between services                                          | +1 ms latency per hop                             |
| Retries, timeouts, and circuit breakers on every link                | CPU and memory per sidecar (about 5% per replica) |
| Per-link metrics without code changes (+20% Insight on mesh traffic) | Platform Dev Hours                                |

### CI/CD Pipeline

Real products: GitHub Actions, GitLab CI, Argo CD.

Decides how code reaches production. It affects how fast features ship and how bad a bad deploy is.

| Deploy strategy | Downtime               | Bad deploy blast radius       | Extra cost                        |
| --------------- | ---------------------- | ----------------------------- | --------------------------------- |
| Recreate        | Seconds of full outage | 100% until rollback           | None                              |
| Rolling         | None                   | Grows as the rollout proceeds | None                              |
| Blue-green      | None                   | 100%, with instant rollback   | Double capacity during deploy     |
| Canary          | None                   | 5% until promotion            | Needs metrics to judge the canary |

Build time depends on the language ([Runtimes](./06-runtimes.md#language-profiles)). Deploy frequency
multiplies feature velocity ([Team and velocity](./08-team-and-velocity.md#deploy-frequency)).

### Feature Flags

Real products: LaunchDarkly, Unleash.

Ships features dark and turns them on gradually, in steps of 5%, 25%, 50%, and 100% of users
([Rollout](./08-team-and-velocity.md#rollout)). A feature behind a flag cannot cause a bad-deploy
incident larger than its rollout percentage, and the player can turn it off in one click. Users who
do not have a feature yet form the holdout group that measures its lift
([Measured lift](./08-team-and-velocity.md#measured-lift)). Flags also
enable graceful degradation: turning off expensive features during an incident
([Incidents](./11-incidents.md#mitigation-toolbox)).

### Secrets and Certificates

Real products: Let's Encrypt with ACME, HashiCorp Vault, AWS Secrets Manager.

Without this Component, TLS certificates expire on the calendar, and the incident "Certificate
expired" takes down every Node that terminates TLS. Let's Encrypt certificates last 90 days, which is
why automation matters. With this Component, renewal is automatic.

Real lifetimes are shrinking: the industry maximum is 200 days since March 2026 and falls to 47 days
in March 2029, and Let's Encrypt moves to 45 days by 2028. The game follows the trend. Certificates
last 90 calendar days until Series C and 45 calendar days from Series C, so manual renewal gets
harder with each Era.

## Observability and money

### Analytics

Real products: an OpenTelemetry collector with a tracing backend.

Analytics is a tap. Link any Node into it, and it samples that Node's traffic. Each sampled request
earns Insight. [Observability](./12-observability.md#earning-insight) defines the formula, the
sampling rate tradeoff, and what Analytics reveals.

### Payments

The drawer where revenue waits until the player collects it. It has a size. Revenue beyond the size
is lost until the player collects or upgrades the drawer. Research "Stripe Billing" collects
automatically ([Economy](./09-economy.md#cash)).

## Managed Components

A **Managed Component** is a third-party service. It costs nothing to place and charges per use. It
has its own outages, which the player cannot fix, only survive.

### Payment Provider

Real products: Stripe, Adyen.

Needed for `buy`. Fee: 2.9% plus $0.30 per successful checkout, which is Stripe's standard US card
price. Latency is 400 ms, and it has outages a few times a calendar year.

- Retrying a timed-out charge without an **idempotency key** can charge twice. Duplicates fail as
  `duplicate` and cost a refund plus a reputation penalty. Research "Idempotency keys" fixes it.

### Auth Provider

Real products: Auth0, Clerk, Cognito.

Takes `login` off your servers, so your CPU does not pay for password hashing. Priced per monthly
active user. Cheap at first, and at scale it becomes one of the largest lines on the bill. Moving
auth back in-house later is a migration ([Team](./08-team-and-velocity.md#migrations)).

### LLM API

Real products: hosted model APIs.

Serves `infer` without GPUs. Priced per token, with a tokens-per-minute rate limit. No placement cost.
At high volume a GPU Node is cheaper per token, and it needs operations work. The rate limit causes
`throttled` errors during spikes.

### Push and Email Provider

Real products: Firebase Cloud Messaging, Apple Push Notification service, Amazon SES.

Delivers `push`. Priced per message. Has sending quotas and reputation: sending too many
notifications raises user churn ([Team: features](./08-team-and-velocity.md#features)).

## Links

A link is a network call. Each link has:

| Property        | Default        | Effect                                                                                                         |
| --------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| Latency         | By placement   | See [Zones and regions](#zones-and-regions).                                                                   |
| Timeout         | 30 s           | See [timeouts](./04-simulation.md#capacity-utilization-and-queues).                                            |
| Retry policy    | None           | See [retries](./04-simulation.md#retries).                                                                     |
| Circuit breaker | Off (research) | Opens after the error rate passes a threshold. Fails fast while open, then tests again.                        |
| Bulkhead        | Off (research) | Limits the share of the caller's slots that this link can hold, so one slow dependency cannot use all of them. |

Links that cross zones or regions add egress cost ([Economy](./09-economy.md#egress)).

## Zones and regions

From Series A, Nodes have a placement.

| Placement             | Hop latency    | Hop cost          | Failure domain |
| --------------------- | -------------- | ----------------- | -------------- |
| Same box (co-located) | 0 ms           | Free              | Box            |
| Same zone             | 0.5 ms         | Free              | Zone           |
| Cross zone            | 1.5 ms         | $0.01/GB each way | Region         |
| Cross region          | Distance-based | $0.02/GB          | None shared    |

Cross-region latency follows the speed of light in fiber, about 5 µs per km one way, plus routing
overhead. Typical round trips: US East to US West 65 ms, US East to Europe 75 ms, Europe to Asia 160
ms, US East to Sydney 200 ms.

- **Multi-zone** (Series A) protects against a zone outage. It costs cross-zone traffic and
  redundancy.
- **Multi-region** (Series C) brings latency down for distant users and protects against a region
  outage. It forces a data decision: where does each write go? ([Data tier](./07-data-tier.md#multi-region-data)).
- **Data residency** (Pre-IPO) requires European users' data to stay in Europe.

Each region is a separate board tab, like a planet in Factorio Space Age. Inter-region links connect
them.
