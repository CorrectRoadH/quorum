# Engineering glossary

[Index](./README.md) · Game vocabulary: [CONTEXT.md](../../CONTEXT.md) · Sources: [Reality check](./reality-check.md)

Real engineering terms that Quorum teaches. Each entry gives a definition, what the term does in the
game as built, related terms, and sources to read more. "Design" links to the design sections behind
the term. When the game does not model a term yet, "In the game" names the closest mechanic.

The game ships this glossary in the Glossary panel from
`packages/simulation/src/catalog/glossary.ts`, which `glossary.test.ts` keeps in sync with this
file. A term is "discovered" the first time it affects the player's design
(`packages/simulation/src/discovery.ts`).

Game terms, such as Node, Era, and Insight, are in [CONTEXT.md](../../CONTEXT.md), not here.

## Anycast

A routing method where many servers in different places announce the same IP address. Internet routing (BGP) sends each user to the nearest of them, so users connect to a close server and a flood spreads across all of them.

**In the game:** You can research Anycast in Series C after GeoDNS. It does not change latency yet. GeoDNS is the working way to shorten the user hop: it sends each region's Users to their own region, or to the nearest region that is still up.

**Related:** [BGP (Border Gateway Protocol)](#bgp-border-gateway-protocol), [GeoDNS](#geodns), [CDN (content delivery network)](#cdn-content-delivery-network), [DDoS (distributed denial of service)](#ddos-distributed-denial-of-service)

**Learn more:** [Cloudflare Learning Center: What is Anycast?](https://www.cloudflare.com/learning/cdn/glossary/anycast-network/) · [RFC 4786: Operation of Anycast Services](https://www.rfc-editor.org/rfc/rfc4786) · [Wikipedia](https://en.wikipedia.org/wiki/Anycast)

## Apdex

Application Performance Index: a score from 0 to 1 for how satisfied users are with response time. Requests faster than a target T are satisfied and count fully, requests up to 4T are tolerating and count half, and slower or failed requests count zero.

**In the game:** Each Request kind has its own T: 400 ms for a page view, 200 ms for an API read, 800 ms for a login. A request earns its value times its Apdex, so a tolerating request earns half. Users grow while Apdex beats the Era's target (0.85 in Garage, up to 0.94 when Public) and leave when it falls below.

**Design:** revenue and user growth ([Simulation](./04-simulation.md#apdex-and-revenue)).

**Related:** [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [SLO, SLA, SLI](#slo-sla-sli), [Tail at scale](#tail-at-scale)

**Learn more:** [Wikipedia](https://en.wikipedia.org/wiki/Apdex) · [New Relic docs: Apdex](https://docs.newrelic.com/docs/apm/new-relic-apm/apdex/apdex-measure-user-satisfaction/) · [The Apdex Users Group](https://www.apdex.org/)

## Async I/O

A way to start a network or disk operation and do other work until it completes, instead of blocking a thread while it waits. One thread can then keep many requests in flight. Node.js, .NET async, and Rust's Tokio are built on it.

**In the game:** Node.js, Kestrel (C#), and Tokio (Rust) hold no worker slot while a request waits for the Database, so a slow query does not use up their capacity. A PHP-FPM or Gunicorn worker is held for the whole wait. Async runtimes also keep Realtime connections open for a few KB each (Tokio 5 KB, Node.js 20 KB), while PHP and Gunicorn refuse them.

**Design:** [event loops and green threads](./06-runtimes.md#concurrency-models).

**Related:** [Event loop](#event-loop), [Green threads](#green-threads), [Process per request](#process-per-request), [Little's law](#littles-law)

**Learn more:** [Node.js: Blocking vs non-blocking](https://nodejs.org/learn/asynchronous-work/overview-of-blocking-vs-non-blocking) · [Python docs: asyncio](https://docs.python.org/3/library/asyncio.html) · [Wikipedia](https://en.wikipedia.org/wiki/Asynchronous_I/O)

## At-least-once delivery

A delivery guarantee where the system resends a message or call until it is acknowledged. Nothing is lost, but some messages arrive more than once, so consumers must be idempotent.

**In the game:** A retried call can arrive twice. In the Double charge Incident, charges time out and retry, and some customers pay twice until you research Idempotency keys or stop retries on the charge Link. In the Poison message Incident, a task that always fails keeps coming back, and Workers spend 90% of their time on it. Turn on the Queue's dead-letter queue to prevent it, or delete the message to end it.

**Design:** [Delivery semantics](./07-data-tier.md#delivery-semantics).

**Related:** [Idempotency](#idempotency), [Retry with backoff and jitter](#retry-with-backoff-and-jitter), [Dead-letter queue](#dead-letter-queue), [Transactional outbox](#transactional-outbox)

**Learn more:** [AWS docs: SQS at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html) · [RabbitMQ: Consumer acknowledgements](https://www.rabbitmq.com/docs/confirms) · [RabbitMQ: Reliability guide](https://www.rabbitmq.com/docs/reliability)

## Autoscaling

Adding and removing machines automatically so that capacity follows demand. A controller watches a signal such as CPU use, compares it with a target, and changes the number of copies. New capacity takes time to boot, so autoscaling follows slow changes in load well and sudden spikes badly.

**In the game:** The Autoscaler (Autoscaling Research) controls the App Servers and Workers that you link into it. When a Node runs above its target (40%, 60%, or 80% of CPU or of its whole load), it asks for more copies, up to a max of 4, 8, 16, or no limit. New copies serve after 180 s on VMs or 30 s in a Kubernetes Cluster, and they start cold. It removes one copy when load falls below 60% of the target, and it acts at most once every 30 s, so keep spare capacity for a sudden Traffic spike.

**Related:** [Vertical and horizontal scaling](#vertical-and-horizontal-scaling), [Diurnal traffic](#diurnal-traffic), [Cold start](#cold-start), [Container orchestration](#container-orchestration)

**Learn more:** [AWS: What is Amazon EC2 Auto Scaling?](https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html) · [Kubernetes: Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) · [Wikipedia](https://en.wikipedia.org/wiki/Autoscaling)

## Availability zone

An isolated data center, or group of data centers, inside a cloud region, with its own power, cooling, and network. Zones in one region are close enough for fast links, and far enough apart that one failure rarely takes down two.

**In the game:** The game calls these Zones. After Multiple zones research, you can place each zoned Node in zone a, b, or c, and give a Database, Pooler, Cache, Search Engine, or Queue a Standby in another zone at twice its Burn. A call between zones costs 1 ms more and $0.01 per GB of Egress both ways. A Zone outage takes down every Node in one zone; a Standby takes over in about 20 s, and copies in another zone keep serving.

**Related:** [Blast radius](#blast-radius), [Egress](#egress), [RPO and RTO](#rpo-and-rto), [Network partition](#network-partition)

**Learn more:** [AWS: Regions and Zones](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) · [AWS Builders' Library: Static stability using Availability Zones](https://aws.amazon.com/builders-library/static-stability-using-availability-zones/) · [Google Cloud: Regions and zones](https://cloud.google.com/compute/docs/regions-zones)

## Backpressure

A signal from a slow consumer that tells producers to slow down or stop, so a buffer or queue does not grow without limit. Without it, a backlog grows until memory or latency runs out.

**In the game:** No Component sends backpressure yet: nothing tells an App Server to slow down. The closest is the Queue. When Workers drain tasks slower than they arrive, Queue depth grows with no limit, and each waiting task adds 0.01 ms to every new enqueue. Add Workers or make them bigger to bring the depth down.

**Design:** Queue max length ([Components](./05-components.md#queue)).

**Related:** [Load shedding](#load-shedding), [Little's law](#littles-law), [Rate limiting](#rate-limiting), [Utilization](#utilization)

**Learn more:** [AWS Builders' Library: Avoiding insurmountable queue backlogs](https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/) · [Node.js: Backpressuring in streams](https://nodejs.org/learn/modules/backpressuring-in-streams)

## Bcrypt

A password hashing function from 1999, based on the Blowfish cipher, with a built-in salt and a tunable cost. Each step of cost doubles the work, so stored hashes stay slow to crack as hardware gets faster. The same slowness costs server CPU on every login.

**In the game:** A login costs 80 ms of CPU for the hash, and a faster runtime does not shorten it. In the Event loop block Incident the cost goes from 10 to 12 rounds, which is 4× the CPU per login. In Credential stuffing, bots send 20× the logins. An Auth Provider (Managed identity) takes the hash off your App Servers for a per-user price.

**Design:** the `login` kind ([Simulation](./04-simulation.md#request-kinds)).

**Related:** [Event loop](#event-loop), [Credential stuffing](#credential-stuffing), [Rate limiting](#rate-limiting)

**Learn more:** [Provos and Mazieres: A Future-Adaptable Password Scheme (USENIX 1999)](https://www.usenix.org/legacy/events/usenix99/provos/provos.pdf) · [OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) · [Wikipedia](https://en.wikipedia.org/wiki/Bcrypt)

## BGP (Border Gateway Protocol)

The protocol that networks on the internet use to tell each other which IP addresses they can reach. If a network withdraws its routes by mistake, the rest of the internet can no longer find it, even though its servers still run.

**In the game:** The BGP misconfiguration Incident can start in Series C. A routing change withdraws your Company from the internet: every request from Users fails as down, in every region, for up to 120 s. No Research prevents it, and the director picks it rarely. Press Roll back on the Incident to end it at once.

**Related:** [Anycast](#anycast), [Blast radius](#blast-radius), [MTTR](#mttr), [Fallacies of distributed computing](#fallacies-of-distributed-computing)

**Learn more:** [Cloudflare Learning Center: What is BGP?](https://www.cloudflare.com/learning/security/glossary/what-is-bgp/) · [RFC 4271: BGP-4](https://www.rfc-editor.org/rfc/rfc4271) · [Meta Engineering: More details about the October 4 outage](https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/)

## Blast radius

The share of a system, its users, or its traffic that one failure affects. Fault isolation, such as zones, cells, and small deploys, keeps the blast radius small.

**In the game:** A Zone outage takes down every Node in that zone. With Multiple zones you can spread copies across three zones and give a data Node a standby that takes over in seconds. A Bad deploy fails 8% of App Server requests for each item it shipped, up to 40%, so smaller deploys break less. On Node.js one slow request stalls every request on its event loop, while BEAM keeps each request apart.

**Design:** per runtime ([Runtimes](./06-runtimes.md#language-profiles)) and per deploy strategy ([Components](./05-components.md#cicd-pipeline)).

**Related:** [Availability zone](#availability-zone), [Bulkhead](#bulkhead), [Canary deployment](#canary-deployment), [Shared nothing](#shared-nothing)

**Learn more:** [AWS Well-Architected: Use fault isolation](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/use-fault-isolation-to-protect-your-workload.html) · [AWS whitepaper: Cell-based architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html)

## Blue-green deployment

A release method with two identical production environments. You deploy the new version to the idle one, switch all traffic to it at once, and switch back if it fails, so rollback is fast.

**In the game:** The game has no blue-green option yet. The closest is the Continuous delivery research: a deploy takes 5 minutes instead of 30, and you can roll back a Bad deploy. A rollback ends the Incident at once and puts its Features back in line for the next deploy.

**Design:** [CI/CD Pipeline](./05-components.md#cicd-pipeline).

**Related:** [Canary deployment](#canary-deployment), [Feature flag](#feature-flag), [DORA metrics](#dora-metrics), [MTTR](#mttr)

**Learn more:** [Martin Fowler: BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) · [AWS whitepaper: Blue/Green deployments](https://docs.aws.amazon.com/whitepapers/latest/overview-deployment-options/bluegreen-deployments.html) · [Wikipedia](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment)

## Brooks's law

"Adding manpower to a late software project makes it later," from Fred Brooks's 1975 book The Mythical Man-Month. New people need time to ramp up, and the paths of communication grow faster than headcount.

**In the game:** A Team's effective size is n / (1 + 0.08(n − 1) + 0.0004·n(n − 1)), so 8 people work like about 5, and past about 48 people a Team gets slower. A new hire also works at 30% for their first calendar week. The penalty counts inside each Team, so splitting people into up to 4 Teams helps, and Symfony lowers it by 30%.

**Design:** [Coordination](./08-team-and-velocity.md#coordination).

**Related:** [Conway's law](#conways-law), [Tech debt](#tech-debt), [DORA metrics](#dora-metrics)

**Learn more:** [Wikipedia: Brooks's law](https://en.wikipedia.org/wiki/Brooks%27s_law) · [Wikipedia: The Mythical Man-Month](https://en.wikipedia.org/wiki/The_Mythical_Man-Month)

## Bulkhead

A limit on how much of a caller's capacity, such as threads, connections, or slots, one dependency can use. When that dependency slows down, it fills only its own share, and calls to other dependencies keep working. The name comes from the walls that split a ship's hull into compartments.

**In the game:** No bulkhead setting exists yet: one slow dependency can fill every slot. On thread and process runtimes, each call holds the caller's slot until it answers or times out, 30 s by default. The closest tools are short Link timeouts (Timeouts and retries) and Circuit breakers, which stop calls to a failing Node.

**Design:** [Links](./05-components.md#links).

**Related:** [Circuit breaker](#circuit-breaker), [Timeout](#timeout), [Blast radius](#blast-radius), [Thread pool](#thread-pool)

**Learn more:** [Azure Architecture Center: Bulkhead pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) · [Wikipedia: Bulkhead (partition)](<https://en.wikipedia.org/wiki/Bulkhead_(partition)>)

## Burn rate

How fast a service spends its error budget, relative to the SLO. A burn rate of 1 spends exactly the whole budget in the SLO window; a burn rate of 10 spends it in a tenth of the window. Teams page on a high burn rate instead of on single errors.

**In the game:** With SLO dashboards researched, the Dashboard (D) charts the error budget burn rate over time: your failure rate divided by the share of failures the SLO allows. Lines mark 1× and 10×; above 10×, the budget is gone long before the week ends. Fix the cause or slow your deploys until the line drops below 1×.

**Design:** [The Dashboard](./12-observability.md#the-dashboard).

**Related:** [Error budget](#error-budget), [SLO, SLA, SLI](#slo-sla-sli), [Observability](#observability)

**Learn more:** [Google SRE workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)

## Bytecode cache

A cache that keeps the compiled form of a script so the interpreter does not parse and compile the source on every run. PHP's OPcache keeps precompiled bytecode in shared memory, and Python writes .pyc files for the same reason.

**In the game:** Without a bytecode cache, PHP compiles every script on every request. The OPcache Research (after PHP-FPM) multiplies the CPU speed of PHP App Servers by 2.5. A PHP box that restarts runs without OPcache at first and reaches the full 2.5× as it warms up.

**Related:** [Process per request](#process-per-request), [JIT warmup](#jit-warmup), [Cold start](#cold-start), [Pre-fork worker model](#pre-fork-worker-model)

**Learn more:** [PHP manual: OPcache](https://www.php.net/manual/en/book.opcache.php) · [PEP 3147: PYC repository directories](https://peps.python.org/pep-3147/)

## Cache hit rate

The share of lookups that a cache answers from its own copy, without asking the slower system behind it. A miss goes to the origin or database. A small change in hit rate can change the load on the origin a lot: going from 90% to 80% doubles the misses.

**In the game:** A Cache or CDN Node shows its hit ratio on its card. A Cache's hit rate is the square root of (its memory / hot data, about 200 KB per user) × a TTL factor (60% at 10 s, 85% at 60 s, 97% at 1 h) × a write penalty of up to 50% × how warm it is. A CDN answers 70% of page and 75% of media requests at the 300 s TTL, × 0.8 at 60 s or × 1.2 at 1 h, at most 95%. Give the Cache more memory or a longer TTL to raise the rate, but a longer TTL serves more stale reads.

**Related:** [Cache-aside](#cache-aside), [Cache warming](#cache-warming), [Cache stampede](#cache-stampede), [Tiered caching](#tiered-caching)

**Learn more:** [Cloudflare: What is a cache hit ratio?](https://www.cloudflare.com/learning/cdn/what-is-a-cache-hit-ratio/) · [AWS: Caching best practices](https://aws.amazon.com/caching/best-practices/) · [AWS Builders' Library: Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)

## Cache stampede

Many requests miss the same cached data at the same moment, for example after a cache restart or an expiry, and all of them go to the database together. The extra load can slow the database so much that the cache never refills.

**In the game:** In the Cache stampede Incident a Cache restarts empty, and every miss goes to the Database at once. While the Database is 90% busy or more, refills time out and the Cache stays cold. Stampede protection lets a cold Cache send on only 25% of its extra misses. Cache warming brings it back 80% warm after a restart.

**Design:** [Stampedes](./07-data-tier.md#stampedes), [incident](./11-incidents.md#cache-stampede).

**Related:** [Thundering herd](#thundering-herd), [Cache warming](#cache-warming), [Cache-aside](#cache-aside), [Metastable failure](#metastable-failure)

**Learn more:** [Wikipedia](https://en.wikipedia.org/wiki/Cache_stampede) · [Nishtala et al.: Scaling Memcache at Facebook (NSDI 2013)](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala)

## Cache warming

Filling a cache with likely data before it takes traffic, so that the first requests do not all miss. Teams warm a cache after a restart, a deploy, or when they add a new cache node, often by loading a snapshot or replaying recent keys.

**In the game:** A Cache that restarts comes back cold, and every miss goes to the database. Redis reloads half of its data by itself, and Memcached reloads none. After the Cache warming Research, you can turn on Warming on a Cache card: the Cache then comes back 80% warm after a restart or a Cache stampede. Stampede protection is the step before it and handles the misses that remain.

**Related:** [Cache stampede](#cache-stampede), [Cache hit rate](#cache-hit-rate), [Thundering herd](#thundering-herd), [Cold start](#cold-start)

**Learn more:** [Netflix TechBlog: Cache warming](https://netflixtechblog.com/cache-warming-agility-for-a-stateful-service-2d3b1da82642) · [Redis docs: Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

## Cache-aside

A caching pattern where the application checks the cache first. On a miss it reads the database and puts the result in the cache, and on a write it updates the database and invalidates the cached entry.

**In the game:** A Cache answers read queries it holds and sends misses on to the Database. Its hit ratio is √(memory / hot data) × TTL factor × warmth, with about 200 KB of hot data per user. Writes pass through and invalidate, so a write-heavy mix lowers hits. A longer TTL (10 s, 60 s, or 1 h) keeps more hits but serves more stale reads.

**Design:** [Cache strategies](./07-data-tier.md#strategies-a-tradeoff-card).

**Related:** [Write-through cache](#write-through-cache), [Cache stampede](#cache-stampede), [Cache hit rate](#cache-hit-rate), [Hot key](#hot-key)

**Learn more:** [Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside) · [AWS: Caching best practices](https://aws.amazon.com/caching/best-practices/)

## Canary deployment

A release method that sends a small share of traffic to a new version first and compares its errors and latency with the old version. If the canary looks healthy, the rollout continues; if not, it is rolled back before most users see it.

**In the game:** The game has no canary deploy option yet: a deploy ships to every App Server at once. The closest is a Stack migration, which moves traffic to the new Stack in steps of 5%, 25%, 50%, and 100%. The new Stack fails 3% of its requests until you pay to fix its bugs, so early steps limit the damage.

**Design:** [CI/CD Pipeline](./05-components.md#cicd-pipeline).

**Related:** [Blue-green deployment](#blue-green-deployment), [Feature flag](#feature-flag), [Strangler pattern](#strangler-pattern), [Blast radius](#blast-radius)

**Learn more:** [Martin Fowler: CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html) · [Google SRE workbook: Canarying releases](https://sre.google/workbook/canarying-releases/)

## CDC (change data capture)

Reading a database's change log, such as the PostgreSQL write-ahead log, and publishing each insert, update, and delete as an event. Other systems, such as a data warehouse or a search index, stay in sync without querying the source.

**In the game:** There is no CDC Connector yet. The closest is the Data Warehouse: App Servers send report scans to it directly, at 1.5 s and a fee per scan. Reports then stop scanning the primary Database and evicting its buffer cache.

**Design:** [CDC Connector](./05-components.md#cdc-connector).

**Related:** [OLTP and OLAP](#oltp-and-olap), [Transactional outbox](#transactional-outbox), [Eventual consistency](#eventual-consistency)

**Learn more:** [Wikipedia](https://en.wikipedia.org/wiki/Change_data_capture) · [PostgreSQL docs: Logical decoding concepts](https://www.postgresql.org/docs/current/logicaldecoding-explanation.html) · [Debezium documentation](https://debezium.io/documentation/reference/stable/index.html)

## CDN (content delivery network)

A network of cache servers in many locations that store copies of content close to users. A request that the nearest edge can answer never reaches the origin, so it is faster and costs the origin nothing.

**In the game:** Content delivery research unlocks the CDN Component. At the default 300 s TTL it answers 70% of page and 75% of media requests at the edge; a 60 s TTL lowers that by 20% and a 3,600 s TTL raises it by 20%, up to 95%. Edge Egress costs $0.02 per GB, against $0.09 per GB from App Servers. Tiered caching lifts the media hit rate to 92%.

**Related:** [Egress](#egress), [Tiered caching](#tiered-caching), [Cache hit rate](#cache-hit-rate), [Anycast](#anycast)

**Learn more:** [Cloudflare Learning Center: What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) · [MDN: CDN](https://developer.mozilla.org/en-US/docs/Glossary/CDN)

## Circuit breaker

A switch on a call path that watches for failures. When too many calls fail, it opens and fails new calls at once for a while, so callers stop waiting and the struggling service can recover. Then it lets a few calls through to test whether the service is back.

**In the game:** After the Circuit breakers research, you can turn on a breaker for each Link. When more than half of the Link's calls fail, it opens for 5 s: it sends nothing, and its calls fail at once as refused. Then it closes and tries again. Circuit breakers are one of the three preventions for a Retry storm.

**Design:** [Links](./05-components.md#links), [Retry storm](./11-incidents.md#retry-storm).

**Related:** [Retry with backoff and jitter](#retry-with-backoff-and-jitter), [Metastable failure](#metastable-failure), [Bulkhead](#bulkhead), [Timeout](#timeout)

**Learn more:** [Martin Fowler: CircuitBreaker](https://martinfowler.com/bliki/CircuitBreaker.html) · [Azure Architecture Center: Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) · [Wikipedia](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern)

## Code review

A practice where another engineer reads a change before it merges, to find defects, keep the code consistent, and share knowledge. Modern code review is usually lightweight and done in a tool on small changes.

**In the game:** The Code review Research lowers the chance that a deploy ships a bug by 20%, and it stacks with Automated tests (30%). It also shows the hidden cost of each Feature on its tile before the Feature ships, such as 'Each write query costs 20% more'. Tech debt raises the bad-deploy chance, so review matters more as debt grows.

**Related:** [Continuous delivery](#continuous-delivery), [Tech debt](#tech-debt), [DORA metrics](#dora-metrics), [Canary deployment](#canary-deployment)

**Learn more:** [Google engineering practices: Code review](https://google.github.io/eng-practices/review/) · [Modern code review: a case study at Google](https://research.google/pubs/modern-code-review-a-case-study-at-google/) · [Wikipedia](https://en.wikipedia.org/wiki/Code_review)

## Cold start

The delay and slow first requests when a new process, container, or function instance starts. It must boot, load code and data, and fill caches or JIT-compile hot code before it reaches full speed.

**In the game:** A new or restarted App Server boots, then warms up. A Java (Tomcat) copy starts at 30% speed and needs 30 s to reach full speed, while Go starts at full speed. A new copy from an Autoscaler serves after 180 s on VMs, or 30 s in a Kubernetes Cluster. A restarted Cache comes back empty with Memcached or half warm with Redis, and a cold Database runs its queries at up to twice the CPU.

**Design:** [Serverless Function](./05-components.md#serverless-function), [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

**Related:** [JIT warmup](#jit-warmup), [Autoscaling](#autoscaling), [Cache warming](#cache-warming), [Cache stampede](#cache-stampede)

**Learn more:** [AWS Lambda docs: Execution environment lifecycle](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html) · [Wikipedia: Cold start (computing)](<https://en.wikipedia.org/wiki/Cold_start_(computing)>)

## Compression

Encoding a response in fewer bytes before it goes over the network, for example with gzip or Brotli. The client decodes it. It saves bandwidth and transfer time and costs CPU on both ends.

**In the game:** Compression research lets you turn on gzip for each App Server. Its page, read, search, and bot responses shrink to 30% of their size, and those requests cost 10% more CPU. Smaller responses reach users sooner, use less of the box's network card, and cut origin Egress. Other kinds, such as upload and media, stay the same size.

**Related:** [Egress](#egress), [Utilization](#utilization), [CDN (content delivery network)](#cdn-content-delivery-network)

**Learn more:** [MDN: Compression in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression) · [RFC 1952: GZIP file format](https://www.rfc-editor.org/rfc/rfc1952)

## Connection pooling

Keeping a set of open database connections and sharing them among many clients, instead of opening one per client or per request. It saves connection setup time and keeps the database under its connection limit.

**In the game:** The Database accepts 100 connections and refuses the rest. Every App Server process holds its own pool: 1 connection per PHP or Gunicorn worker, 5 per Puma process, 10 for Node.js or Go. A Connection Pooler in transaction mode shares 20 server connections among all of them, but fails 5% of pooled queries until you fix the code's session state. The Connection exhaustion Incident doubles every pool.

**Design:** [Connection Pooler](./07-data-tier.md#connection-pooler).

**Related:** [Process per request](#process-per-request), [Little's law](#littles-law), [Thread pool](#thread-pool)

**Learn more:** [PgBouncer: Features and pooling modes](https://www.pgbouncer.org/features.html) · [PostgreSQL docs: Connections (max_connections)](https://www.postgresql.org/docs/current/runtime-config-connection.html) · [Wikipedia](https://en.wikipedia.org/wiki/Connection_pool)

## Consistent hashing

A way to map keys to servers on a hash ring, so that adding or removing one server moves only about 1/n of the keys. Karger and others described it in 1997 for web caches, and Amazon's Dynamo and Apache Cassandra use it to place data.

**In the game:** The game does not model consistent hashing yet. A Load Balancer splits traffic by Weighted, Round robin, Least conn, or Two choices, not by key. The closest is the Wide-column Store, which places each key on N replicas, and the Hot key Incident, where one key's shard saturates.

**Design:** a [Load Balancer](./05-components.md#load-balancer) algorithm.

**Related:** [Sharding](#sharding), [Hot key](#hot-key), [Leaderless replication](#leaderless-replication), [Power of two choices](#power-of-two-choices)

**Learn more:** [Karger et al.: Consistent hashing and random trees (STOC 1997)](https://dl.acm.org/doi/10.1145/258533.258660) · [DeCandia et al.: Dynamo (SOSP 2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) · [Wikipedia](https://en.wikipedia.org/wiki/Consistent_hashing)

## Container orchestration

Software that places containers on a shared pool of machines, restarts them when they fail, and scales them up and down. Kubernetes is the common example. Packing many workloads onto shared nodes uses machines better, but neighbours can slow each other down.

**In the game:** The Container orchestration Research unlocks the Kubernetes Cluster. App Servers and Workers that you link into it run as pods: they cost 15% less Burn, and an Autoscaler adds their copies in 30 s instead of 180 s. Noisy neighbours add 10 ms to 1% of their requests, which shows in the tail latency.

**Related:** [Autoscaling](#autoscaling), [Cold start](#cold-start), [Tail at scale](#tail-at-scale), [Vertical and horizontal scaling](#vertical-and-horizontal-scaling)

**Learn more:** [Kubernetes: Overview](https://kubernetes.io/docs/concepts/overview/) · [Kubernetes: Resource management for pods and containers](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) · [Large-scale cluster management at Google with Borg](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/)

## Continuous delivery

A practice that keeps software in a state where any change can be released safely at any time, through an automated pipeline that builds, tests, and deploys it. It makes releases small, frequent, and easy to roll back.

**In the game:** Before the Continuous delivery Research, a deploy takes 30 minutes by hand. After it, a pipeline deploys in 5 minutes, so more deploys fit in the 8-hour work day with the build and the 15-minute check. It also lets you roll back a Bad deploy, which ends the Incident and puts its Features back in line for the next deploy. A bad deploy fails 8% of App Server requests per item it shipped, up to 40%, so smaller deploys break less.

**Related:** [DORA metrics](#dora-metrics), [Code review](#code-review), [Canary deployment](#canary-deployment), [Blue-green deployment](#blue-green-deployment)

**Learn more:** [Martin Fowler: Continuous delivery](https://martinfowler.com/bliki/ContinuousDelivery.html) · [DORA: Continuous delivery](https://dora.dev/capabilities/continuous-delivery/) · [Wikipedia](https://en.wikipedia.org/wiki/Continuous_delivery)

## Conway's law

"Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations," from Melvin Conway's 1968 paper. Teams that rarely talk tend to build parts with narrow interfaces between them.

**In the game:** Not modeled yet: the Company runs one Service, the monolith, and every Team works on it. From Pre-seed you can create up to 4 Teams, each with its own policy. Each Team pays its own coordination cost, so splitting a large group raises total Dev Hours.

**Design:** [Services](./08-team-and-velocity.md#services).

**Related:** [Brooks's law](#brookss-law), [Strangler pattern](#strangler-pattern), [Tech debt](#tech-debt)

**Learn more:** [Mel Conway: Conway's Law](https://www.melconway.com/Home/Conways_Law.html) · [Martin Fowler: ConwaysLaw](https://martinfowler.com/bliki/ConwaysLaw.html) · [Wikipedia](https://en.wikipedia.org/wiki/Conway%27s_law)

## Credential stuffing

An attack where bots try username and password pairs leaked from other sites against a login form. It works because many people reuse passwords. Each try also costs the site a slow password hash.

**In the game:** The Credential stuffing Incident can start from Seed when your Company serves login. Bots send 19 times your normal login rate, and each one costs an App Server a full bcrypt hash, so CPU saturates. A WAF blocks most of the bots: 80% at the default paranoia level 2. An Auth Provider hashes the rest, so a login costs your App Server about 2 ms of CPU.

**Related:** [Bcrypt](#bcrypt), [WAF (web application firewall)](#waf-web-application-firewall), [Rate limiting](#rate-limiting)

**Learn more:** [OWASP: Credential stuffing](https://owasp.org/www-community/attacks/Credential_stuffing) · [OWASP Cheat Sheet: Credential Stuffing Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html) · [Cloudflare Learning Center: What is credential stuffing?](https://www.cloudflare.com/learning/bots/what-is-credential-stuffing/)

## Data residency

A rule, from law or from a contract, that some data must be stored and processed inside a given country or region. The EU's GDPR, for example, limits transfers of personal data out of the EU.

**In the game:** Data residency is an item on the Pre-IPO IPO checklist. It is met when you own Data residency controls and GeoDNS, you have a live EU Users Node, and every data Node it reaches sits in the EU region or is a Spread Wide-column Store or Distributed SQL Node. Build a full EU path and keep its data local to tick it.

**Related:** [GeoDNS](#geodns), [SOC 2](#soc-2), [Sharding](#sharding)

**Learn more:** [Cloudflare Learning Center: What is data localization?](https://www.cloudflare.com/learning/privacy/what-is-data-localization/) · [Wikipedia: Data sovereignty](https://en.wikipedia.org/wiki/Data_sovereignty)

## DDoS (distributed denial of service)

An attack that floods a service with traffic from many machines at once, often a botnet, so real users cannot get through. Defenses filter junk at the edge and spread the load over many locations.

**In the game:** The DDoS Incident can start from Seed. It adds 50 times your normal demand as bot traffic for up to 60 s. A WAF filters bots at its paranoia level; turn on Under attack mode to block 99% of them, at the cost of 1% of real users and 40 ms more latency. The director picks a DDoS less often when you run a WAF.

**Related:** [WAF (web application firewall)](#waf-web-application-firewall), [Load shedding](#load-shedding), [Anycast](#anycast), [Rate limiting](#rate-limiting)

**Learn more:** [Cloudflare Learning Center: What is a DDoS attack?](https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/) · [CISA: Understanding Denial-of-Service Attacks](https://www.cisa.gov/news-events/news/understanding-denial-service-attacks) · [Cloudflare docs: Under Attack mode](https://developers.cloudflare.com/fundamentals/reference/under-attack-mode/)

## Dead-letter queue

A separate queue that holds messages a consumer cannot process, after a set number of failed attempts. It stops one bad message from blocking the queue, and keeps the message for people to inspect or replay.

**In the game:** A Queue card has a Failed tasks setting: Retry forever or Dead-letter queue. The Poison message Incident can hit only a Queue that retries forever: a task that always fails keeps coming back, and its Workers spend 90% of their time on it. Turn on the dead-letter queue to make the Queue immune, or delete the message to end the Incident.

**Related:** [At-least-once delivery](#at-least-once-delivery), [Retry with backoff and jitter](#retry-with-backoff-and-jitter), [Idempotency](#idempotency), [Backpressure](#backpressure)

**Learn more:** [AWS: Using dead-letter queues in Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) · [RabbitMQ: Dead letter exchanges](https://www.rabbitmq.com/docs/dlx) · [Enterprise Integration Patterns: Dead Letter Channel](https://www.enterpriseintegrationpatterns.com/patterns/messaging/DeadLetterChannel.html)

## Dependency scanning

An automated check of the third-party libraries a project uses against databases of known vulnerabilities. It usually runs in the build pipeline and flags versions that need an upgrade.

**In the game:** Dependency scanning is Security Research from Series A that needs Continuous delivery. In the game today it has no direct effect on traffic or Incidents. It is one of three prerequisites, with TLS everywhere and Encryption at rest, for the SOC 2 program, which the IPO checklist needs.

**Related:** [SOC 2](#soc-2), [Continuous delivery](#continuous-delivery), [Tech debt](#tech-debt)

**Learn more:** [OWASP Top 10: Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/) · [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) · [GitHub Docs: About Dependabot alerts](https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts)

## Distributed tracing

Following one request across every service it touches. Each hop records a span with its start and end time, and spans that share a trace ID join into one trace. Traces show where time goes and which dependency is slow.

**In the game:** The Distributed tracing Research (after Percentiles) promises each request kind's time, Node by Node, but buying it changes nothing in the game today. The closest thing that works now is the Analytics Node, which samples the traffic of the Nodes you link into it and turns it into Insight. Percentiles show p50, p95, and p99, and the Board marks the Bottleneck.

**Related:** [Observability](#observability), [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [Tail at scale](#tail-at-scale), [Fan-out](#fan-out)

**Learn more:** [Dapper: Google's tracing infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/) · [OpenTelemetry: Traces](https://opentelemetry.io/docs/concepts/signals/traces/)

## Diurnal traffic

The daily rise and fall of demand that follows when people are awake and active. Consumer services often peak in the evening and are quietest in the early morning. Capacity planning must cover the daily peak, and the trough is a safe time for maintenance.

**In the game:** Demand follows a daily cycle on the Calendar: by default it peaks at 20:00 at 1.45× the average and falls to 0.55× at 08:00. Each Venture sets its own curve; for example, Fintech peaks at 14:00 and swings ±60%. When you open more regions, each region peaks at its own local 20:00. One sim second is one calendar minute, so a full day passes in 24 minutes at 1×: size for the evening peak, or let an Autoscaler follow the curve.

**Related:** [Autoscaling](#autoscaling), [Utilization](#utilization), [Little's law](#littles-law), [Thundering herd](#thundering-herd)

**Learn more:** [USENIX 1997: Diurnal cycle in a client trace](https://static.usenix.org/publications/library/proceedings/usits97/full_papers/gribble/gribble_html/node8.html) · [AWS: Predictive scaling for EC2 Auto Scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-predictive-scaling.html)

## DNS round robin

Load spreading by DNS: a name returns several IP addresses, and the server rotates their order so clients spread across hosts. DNS does not know whether a host is alive, and clients cache answers for the record's TTL.

**In the game:** DNS round robin research unlocks the DNS Component, which splits Users evenly across up to 8 hosts. With no health checks, a dead host keeps its share and those requests fail. After Health checks research, DNS drops a dead host once its TTL runs out: 30, 300, or 3,600 s. A Load Balancer notices a dead host faster, at its next health check.

**Related:** [Health check](#health-check), [Load balancer](#load-balancer), [GeoDNS](#geodns), [Vertical and horizontal scaling](#vertical-and-horizontal-scaling)

**Learn more:** [Cloudflare Learning Center: What is round-robin DNS?](https://www.cloudflare.com/learning/dns/glossary/round-robin-dns/) · [RFC 1794: DNS Support for Load Balancing](https://www.rfc-editor.org/rfc/rfc1794) · [Wikipedia](https://en.wikipedia.org/wiki/Round-robin_DNS)

## DORA metrics

Five measures of software delivery from the DORA research program: change lead time, deployment frequency, failed deployment recovery time, change fail rate, and rework rate. The first three show throughput, and the last two show instability.

**In the game:** Two of them drive play. Deploy frequency is at most 480 work minutes / (build + deploy + 15 verify) per day, capped at 16, 8, or 4 by the Team's policy. Continuous delivery cuts a deploy from 30 to 5 minutes. Each deploy has a 10% base chance to ship a bug, raised by Move fast and tech debt and lowered by Automated tests (−30%) and Code review (−20%); the deploy card shows it.

**Design:** [Deploy frequency](./08-team-and-velocity.md#deploy-frequency).

**Related:** [MTTR](#mttr), [Continuous delivery](#continuous-delivery), [Code review](#code-review), [Error budget](#error-budget)

**Learn more:** [DORA: Software delivery performance metrics](https://dora.dev/guides/dora-metrics/) · [DORA: A history of DORA's metrics](https://dora.dev/insights/dora-metrics-history/)

## Egress

Data that leaves a cloud provider's network, to the internet or to another zone or region. Providers charge per GB for it, while data coming in is usually free.

**In the game:** From Seed, Burn includes egress: $0.09 per GB that App Servers send to users, and $0.02 per GB for pages a CDN answers at the edge. A call between zones costs $0.01 per GB each way, and a call between regions $0.02 per GB, all scaled by the Era's cost index. Compression makes page and read responses 70% smaller for 10% more CPU.

**Design:** [Egress](./09-economy.md#egress).

**Related:** [CDN (content delivery network)](#cdn-content-delivery-network), [Compression](#compression), [Availability zone](#availability-zone), [Operating margin](#operating-margin)

**Learn more:** [Cloudflare Learning Center: What are data egress fees?](https://www.cloudflare.com/learning/cloud/what-are-data-egress-fees/) · [AWS Architecture Blog: Data transfer costs](https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/)

## Encryption at rest

Encrypting stored data, such as disks, database files, and backups, so that someone who gets the storage media cannot read it without the keys. It protects against stolen disks and leaked backups, not against an attacker who can query the live system.

**In the game:** Encryption at rest is Security Research from Series B. In the game today it has no direct effect on traffic, cost, or Incidents. It is one of three prerequisites, with TLS everywhere and Dependency scanning, for the SOC 2 program, which the IPO checklist needs.

**Related:** [SOC 2](#soc-2), [TLS certificate](#tls-certificate), [Data residency](#data-residency)

**Learn more:** [Google Cloud: Default encryption at rest](https://cloud.google.com/docs/security/encryption/default-encryption) · [OWASP Cheat Sheet: Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) · [PostgreSQL docs: Encryption Options](https://www.postgresql.org/docs/current/encryption-options.html)

## Error budget

The amount of failure an SLO allows over a window: with a 99.9% SLO, 0.1% of requests may fail. Teams spend it on risk, such as faster releases, and slow down and fix reliability when it runs out.

**In the game:** From Series A, the game counts failed requests over the last calendar week against the Era's SLO, 99.9% in Series A and up to 99.99% when Public. Bots and WAF blocks do not count. After the Error budgets research, more than half the budget left speeds your Teams up 10%, and a spent budget halves their speed. SLO dashboards put the budget on the HUD.

**Design:** [SLOs and error budgets](./11-incidents.md#slos-and-error-budgets).

**Related:** [SLO, SLA, SLI](#slo-sla-sli), [DORA metrics](#dora-metrics), [MTTR](#mttr)

**Learn more:** [Google SRE book: Embracing risk](https://sre.google/sre-book/embracing-risk/) · [Google SRE workbook: Error budget policy](https://sre.google/workbook/error-budget-policy/)

## Event loop

A single thread that waits for I/O events and runs their callbacks one at a time. It serves many waiting connections cheaply, but a callback that uses the CPU for a long time blocks every other request on that loop.

**In the game:** Node.js runs one event loop and uses one core; Node.js cluster runs one loop per core. A CPU-heavy request, such as an 80 ms password hash at login, stalls the requests behind it, and the stall lands on the p99. In the Event loop block Incident each login costs 4× the CPU. The libuv thread pool research or an Auth Provider takes the hash off the loop.

**Design:** [Event loops and blocking](./06-runtimes.md#event-loops-and-blocking).

**Related:** [Async I/O](#async-io), [Bcrypt](#bcrypt), [Green threads](#green-threads), [Percentile (p50, p95, p99)](#percentile-p50-p95-p99)

**Learn more:** [Node.js: The Node.js event loop](https://nodejs.org/learn/asynchronous-work/event-loop-timers-and-nexttick) · [Node.js: Don't block the event loop](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop) · [MDN: JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)

## Eventual consistency

A consistency model where replicas can return old data for a while after a write. If no new writes arrive, all replicas converge to the same latest value.

**In the game:** A Read Replica lags behind writes, so up to 15% of its reads come back stale, and up to 50% during the Replication lag Incident. A Wide-column Store whose R + W is not greater than N also serves stale reads. A stale read fails an API read and a checkout that reads its own write. Read-your-writes routing sends those reads to the primary instead.

**Design:** [Wide-column Store](./07-data-tier.md#wide-column-store).

**Related:** [Replication lag](#replication-lag), [Read-your-writes consistency](#read-your-writes-consistency), [Quorum](#quorum), [Leaderless replication](#leaderless-replication)

**Learn more:** [Werner Vogels: Eventually Consistent (ACM Queue)](https://queue.acm.org/detail.cfm?id=1466448) · [Wikipedia](https://en.wikipedia.org/wiki/Eventual_consistency)

## Fallacies of distributed computing

Eight false assumptions that programmers new to distributed systems often make, collected by L. Peter Deutsch and others at Sun Microsystems: the network is reliable, latency is zero, bandwidth is infinite, the network is secure, topology does not change, there is one administrator, transport cost is zero, and the network is homogeneous.

**In the game:** Several Incidents and costs break these assumptions. In the Network partition Incident, calls between regions time out until the partition heals or you fence the old leader. A call to another zone adds 1 ms and costs egress both ways, and a call to another region pays the round trip. Until Timeouts and retries, every Link waits 30 s for an answer.

**Design:** the "Fallacies" achievement ([Challenges](./14-challenges.md#achievements)).

**Related:** [Network partition](#network-partition), [Egress](#egress), [Timeout](#timeout), [Quorum](#quorum)

**Learn more:** [Wikipedia](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) · [Rotem-Gal-Oz: Fallacies of Distributed Computing Explained (PDF)](https://lasr.cs.ucla.edu/classes/188_winter15/readings/fallacies.pdf)

## Fan-out

One request that turns into many calls to other services or data stores. The more calls a request waits for, the more likely one of them is slow, so wide fan-out raises tail latency and load.

**In the game:** A page view makes 2 read queries, and ORM frameworks (Laravel, Rails, Django) make 3 reads where 1 would do until Eager loading. The Activity feed Feature adds feeds: pulled, a feed makes 20 reads. With fan-out on write, a feed makes 1 read but every write fills 20 followers' timelines. Hybrid fan-out cuts that to 2 reads and 10 timeline writes.

**Design:** [Fan-out](./07-data-tier.md#fan-out).

**Related:** [Fan-out on write](#fan-out-on-write), [N+1 query](#n1-query), [Tail at scale](#tail-at-scale), [Hot key](#hot-key)

**Learn more:** [Dean and Barroso: The Tail at Scale (CACM 2013)](https://cacm.acm.org/research/the-tail-at-scale/) · [Wikipedia: Fan-out (software)](<https://en.wikipedia.org/wiki/Fan-out_(software)>)

## Fan-out on write

Building each user's feed when a post is written: the post is copied into the timeline of every follower, so reading a feed is one cheap lookup. It moves work from reads to writes, and it is expensive for accounts with many followers. Many systems use a hybrid: push for normal accounts and pull for celebrities at read time.

**In the game:** From Series C, the Activity feed Feature adds the feed kind, and each App Server card offers Feeds: Pull or Push. With Pull, a feed reads 20 posts. With Push, a feed reads one precomputed timeline, but every write makes 20 timeline writes. The Hybrid fan-out Research cuts that to 10 writes and 2 reads per feed, and lets a Cache or Wide-column Store split a Hot key across its shards.

**Related:** [Fan-out](#fan-out), [Hot key](#hot-key), [Sharding](#sharding), [Cache-aside](#cache-aside)

**Learn more:** [InfoQ: Timelines at Scale (Twitter)](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/) · [High Scalability: The architecture Twitter uses](https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/)

## Feature flag

A switch in the code, controlled at runtime, that turns a feature on or off without a new deploy. Teams use flags to release a feature to a share of users, test it, or turn it off fast when it breaks.

**In the game:** Not modeled yet: a Feature reaches every user at the next deploy, with no rollout share. The closest tool is a rollback after Continuous delivery, which takes a bad deploy's Features out again and ends the Bad deploy Incident.

**Design:** [Feature Flags](./05-components.md#feature-flags).

**Related:** [Canary deployment](#canary-deployment), [Blue-green deployment](#blue-green-deployment), [Continuous delivery](#continuous-delivery)

**Learn more:** [Martin Fowler's site: Feature Toggles (Pete Hodgson)](https://martinfowler.com/articles/feature-toggles.html) · [OpenFeature: What are feature flags?](https://openfeature.dev/docs/reference/intro) · [Wikipedia](https://en.wikipedia.org/wiki/Feature_toggle)

## GC pause

Time when a garbage collector stops or slows the application to find and free memory that is no longer used. Pauses usually hit only some requests, so they show up in tail latency, such as the p99, more than in the average.

**In the game:** When an App Server's heap is more than 70% full, its collector pauses up to 2% of requests. Java pauses 30 ms with G1, 150 ms with Parallel, or 1 ms with ZGC, which costs 10% of throughput and 15% more memory. Go pauses only 1 ms but spends up to 25% more CPU, which Go GC tuning trades against memory. In the GC pause storm Incident the heap fills further and 5× as many requests pause.

**Design:** [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

**Related:** [Memory leak](#memory-leak), [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [Tail at scale](#tail-at-scale), [JIT warmup](#jit-warmup)

**Learn more:** [Go: A Guide to the Go Garbage Collector](https://go.dev/doc/gc-guide) · [OpenJDK Wiki: ZGC](https://wiki.openjdk.org/display/zgc) · [Oracle: Java GC tuning guide](https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html)

## GeoDNS

DNS that gives different answers depending on where the user is, so each user resolves to a nearby data center or region. Many providers can also skip a region that fails its health checks.

**In the game:** GeoDNS is Series C Research that needs Multiple regions. Without it, users on every continent enter through the home region and pay two round trips, for example 150 ms from Europe to North America. With it, each region's users enter through their own region's Users Node, or the nearest live one during a Region outage. The Data residency checklist item also needs GeoDNS.

**Related:** [DNS round robin](#dns-round-robin), [Anycast](#anycast), [Data residency](#data-residency), [Blast radius](#blast-radius)

**Learn more:** [Amazon Route 53: Geolocation routing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-geo.html) · [Amazon Route 53: Latency-based routing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-latency.html) · [Wikipedia](https://en.wikipedia.org/wiki/GeoDNS)

## GIL (global interpreter lock)

A lock in CPython's default build, and the GVL in CRuby, that lets only one thread run interpreter code at a time. Threads still overlap while they wait for I/O, but CPU work in one process does not run in parallel. CPython 3.13 added an optional free-threaded build without the GIL (PEP 703).

**In the game:** Ruby's Puma must run one process per core to use every core, with 5 threads each and 180 MB per process. Python's Gunicorn runs a pool of sync workers, one request each and 120 MB per worker, and you set the pool size. Runtimes without a GIL, such as Go or Java, run one process on every core.

**Design:** [Concurrency models](./06-runtimes.md#concurrency-models).

**Related:** [Process per request](#process-per-request), [Green threads](#green-threads), [Vertical and horizontal scaling](#vertical-and-horizontal-scaling), [Pre-fork worker model](#pre-fork-worker-model)

**Learn more:** [Python docs: Glossary (global interpreter lock)](https://docs.python.org/3/glossary.html#term-global-interpreter-lock) · [PEP 703: Making the GIL optional](https://peps.python.org/pep-0703/) · [Wikipedia](https://en.wikipedia.org/wiki/Global_interpreter_lock)

## Green threads

Lightweight threads that a language runtime schedules instead of the operating system. Goroutines, Java virtual threads, and Erlang processes are examples. Each costs a few KB, so one server can keep many thousands waiting at once.

**In the game:** Go and Elixir's BEAM run green threads on every core, and a waiting request holds no worker slot. Each open Realtime connection costs 10 KB on Go and 5 KB on BEAM, against 1 MB for a Java thread on Tomcat. BEAM is preemptive, so no request stalls another, but its CPU is less than half as fast as Go's.

**Design:** [Concurrency models](./06-runtimes.md#concurrency-models).

**Related:** [Async I/O](#async-io), [Event loop](#event-loop), [GIL (global interpreter lock)](#gil-global-interpreter-lock), [Thread pool](#thread-pool)

**Learn more:** [A Tour of Go: Goroutines](https://go.dev/tour/concurrency/1) · [JEP 444: Virtual Threads](https://openjdk.org/jeps/444) · [Wikipedia](https://en.wikipedia.org/wiki/Green_thread)

## Health check

A periodic probe, such as an HTTP request to a status endpoint, that decides whether a server should receive traffic. A shallow check tests only the server; a deep check also tests what it depends on, such as its database.

**In the game:** A Load Balancer probes its App Servers every 10 s and stops sending traffic to a dead one at the next check. The Health checks research adds 2 s and 30 s intervals and a deep check that also removes App Servers whose Database is down or overloaded. It also lets DNS drop a dead host once its TTL runs out; without it, DNS keeps sending that host its share.

**Design:** [Load Balancer](./05-components.md#load-balancer).

**Related:** [Load balancer](#load-balancer), [DNS round robin](#dns-round-robin), [MTTR](#mttr), [Vertical and horizontal scaling](#vertical-and-horizontal-scaling)

**Learn more:** [AWS Builders' Library: Implementing health checks](https://aws.amazon.com/builders-library/implementing-health-checks/) · [Kubernetes docs: Liveness, readiness, and startup probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/)

## Hedged request

Sending a second copy of a request to another replica when the first is slower than expected, for example past the 95th-percentile latency, and using whichever answer arrives first. It cuts tail latency for a small amount of extra load.

**In the game:** Not modeled yet: no Link or research sends a hedged copy. The closest is the Wide-column Store, where a read waits only for the fastest R of its N replicas, so a lower R gives a faster read. Percentiles shows the p99 that hedging would cut.

**Design:** research `hedged-requests` ([Progression](./10-progression.md#track-reliability)).

**Related:** [Tail at scale](#tail-at-scale), [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [Quorum](#quorum), [Retry with backoff and jitter](#retry-with-backoff-and-jitter)

**Learn more:** [Dean and Barroso: The Tail at Scale (CACM 2013)](https://cacm.acm.org/research/the-tail-at-scale/) · [gRPC docs: Request hedging](https://grpc.io/docs/guides/request-hedging/)

## Hot key

One key that receives a very large share of reads or writes, such as a celebrity's profile. The one shard or server that owns it saturates while the others stay idle, so adding servers does not help.

**In the game:** In the Hot key Incident (Series C), 30% of the reads on a busy Cache or Wide-column Store ask for one key on one shard. That Node's capacity divides by 0.3 × its shards + 0.7, so a size-4 Node keeps about half. Hybrid fan-out lets you turn on key splitting for that Node, which spreads the hot key and ends the loss.

**Design:** [Partitioning](./07-data-tier.md#partitioning-sharding).

**Related:** [Sharding](#sharding), [Consistent hashing](#consistent-hashing), [Fan-out on write](#fan-out-on-write), [Utilization](#utilization)

**Learn more:** [AWS docs: Designing partition keys to distribute workload in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-uniform-load.html) · [AWS docs: Write sharding in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html) · [Redis docs: redis-cli --hotkeys](https://redis.io/docs/latest/develop/tools/cli/)

## HTTP keep-alive

Reusing one TCP connection for many HTTP requests instead of opening a new one each time. It skips the connection handshake, and for HTTPS the TLS handshake, on every request after the first.

**In the game:** Every internal call between Nodes costs a 0.5 ms hop plus a 1 ms TCP handshake. Connection reuse research removes the handshake, so each internal call costs 0.5 ms. A request that crosses several Nodes saves 1 ms per hop.

**Related:** [Connection pooling](#connection-pooling), [HTTP/2 and HTTP/3](#http2-and-http3), [Timeout](#timeout)

**Learn more:** [MDN: Connection management in HTTP/1.x](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Connection_management_in_HTTP_1.x) · [RFC 9112: HTTP/1.1, Connection Management](https://www.rfc-editor.org/rfc/rfc9112#section-9) · [Wikipedia](https://en.wikipedia.org/wiki/HTTP_persistent_connection)

## HTTP/2 and HTTP/3

Newer versions of HTTP. HTTP/2 sends many requests at once over one TCP connection. HTTP/3 runs over QUIC on UDP, which combines the transport and TLS handshakes and stops one lost packet from stalling every stream.

**In the game:** HTTP/3 is Series C Research that needs HTTP/2. It cuts the round trips a user pays to reach a region on another continent by 20%: a European user served from North America waits 120 ms instead of 150 ms. HTTP/2 research has no effect of its own yet; you research it to unlock HTTP/3.

**Related:** [HTTP keep-alive](#http-keep-alive), [GeoDNS](#geodns), [Tail at scale](#tail-at-scale)

**Learn more:** [MDN: Evolution of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP) · [Cloudflare Learning Center: What is HTTP/3?](https://www.cloudflare.com/learning/performance/what-is-http3/) · [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114)

## Idempotency

An operation is idempotent when doing it twice has the same effect as doing it once. Reads are idempotent by nature; a card charge or an order is not. An idempotency key is a unique ID the client sends with a request, so the server can recognize a retry and return the first result instead of acting again.

**In the game:** A checkout sends a charge to the Payment Provider. In the Double charge Incident the provider slows by about 1.5 s, the charge Link times out, and a retry charges a card that the first attempt already charged, so those checkouts fail as duplicate. Research Idempotency keys (it needs Checkout) so a retried charge never charges twice. Without it, set the charge Link's retries to none to end the Incident.

**Design:** [Payment Provider](./05-components.md#payment-provider).

**Related:** [Retry with backoff and jitter](#retry-with-backoff-and-jitter), [At-least-once delivery](#at-least-once-delivery), [Timeout](#timeout), [Transactional outbox](#transactional-outbox)

**Learn more:** [AWS Builders' Library: Making retries safe with idempotent APIs](https://builder.aws.com/content/3Ev0BENTyBr0XxzRk5FDZzgNYos/making-retries-safe-with-idempotent-apis) · [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · [RFC 9110: Idempotent methods](https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2)

## Inverted index

An index that maps each word to the list of documents that contain it, like the index at the back of a book. Full-text search engines such as Lucene and Elasticsearch use it, and PostgreSQL offers it as a GIN index. A search reads a few short lists instead of scanning every row.

**In the game:** Until you place a Search Engine, the Database answers q-search itself, at 80 ms of CPU per search: ten times a normal read. The Full-text search Research unlocks the Search Engine, which answers 400 searches per second per size step in about 15 ms. Link it to your App Servers and search stops loading the Database.

**Related:** [OLTP and OLAP](#oltp-and-olap), [Sharding](#sharding), [Utilization](#utilization)

**Learn more:** [Stanford IR book: Building an inverted index](https://nlp.stanford.edu/IR-book/html/htmledition/a-first-take-at-building-an-inverted-index-1.html) · [PostgreSQL docs: GIN indexes](https://www.postgresql.org/docs/current/gin.html) · [Wikipedia](https://en.wikipedia.org/wiki/Inverted_index)

## JIT warmup

A just-in-time (JIT) compiler turns frequently run code into optimized machine code while the program runs. Until it has profiled and compiled the hot paths, a new process runs below its peak speed, so its first seconds or minutes are slow. The JVM and .NET warm up this way; tiered compilation and ahead-of-time profiles shorten the warmup.

**In the game:** Each runtime has a start speed and a warmup time. A cold Tomcat (Java) App Server starts at 30% CPU speed and reaches full speed after 30 s; Kestrel (C#) starts at 60% and Node.js at 80% for 15 s, while Go, BEAM and Tokio start at full speed. Every restart, resize, Stack change, and new Autoscaler copy starts cold, so add capacity before a peak, not during it. PHP warms its OPcache instead: from 1× up to 2.5× CPU speed as the cache fills.

**Design:** [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

**Related:** [Cold start](#cold-start), [GC pause](#gc-pause), [Autoscaling](#autoscaling), [Bytecode cache](#bytecode-cache)

**Learn more:** [OpenJDK JEP 515: Ahead-of-Time Method Profiling](https://openjdk.org/jeps/515) · [Microsoft: How tiered compilation works in OpenJDK](https://devblogs.microsoft.com/java/how-tiered-compilation-works-in-openjdk) · [Wikipedia: Just-in-time compilation](https://en.wikipedia.org/wiki/Just-in-time_compilation)

## Leaderless replication

Replication with no single leader: a client sends each write to several replicas and reads from several, and a quorum decides. Amazon's Dynamo made the design well known, and Cassandra uses it. It keeps writing when some replicas fail, at the cost of reads that may be stale unless R + W > N.

**In the game:** The Leaderless replication Research (after Sharding) unlocks the Wide-column Store. Each key lives on N replicas (1 to 5, default 3), a read asks R of them, and a write waits for W (default 1 and 1). With R + W > N every read sees the latest write; with less, some reads come back stale. A write costs N replica operations and a read costs R, out of 30,000 per second per size step, and if an Instance failure takes one replica, quorums that need every replica fail.

**Related:** [Quorum](#quorum), [Eventual consistency](#eventual-consistency), [Consistent hashing](#consistent-hashing), [Hot key](#hot-key)

**Learn more:** [Dynamo: Amazon's highly available key-value store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) · [Apache Cassandra docs: Dynamo](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html)

## Little's law

In any stable system, the average number of items inside (L) equals the average arrival rate (λ) times the average time each item spends inside (W): L = λW. John Little proved it in 1961, and it holds whatever the arrival pattern or the service order. For a server, requests in flight = requests per second × seconds each request takes.

**In the game:** An App Server that holds a worker or a thread per request has a fixed number of slots, and each request holds its slot for its CPU time plus every database call it waits on. Slots in use = arrival rate × that time, so when each request waits 10 times as long on the Database, a PHP-FPM pool of 5 workers serves up to 10 times fewer requests. Fix the slow call, add workers or threads, or move to a runtime that waits without a slot (Node.js, Go, Kestrel, BEAM, Tokio).

**Design:** [The latency coupling](./04-simulation.md#the-latency-coupling).

**Related:** [Utilization](#utilization), [Thread pool](#thread-pool), [Async I/O](#async-io), [Connection pooling](#connection-pooling)

**Learn more:** [Little (1961): A proof for the queuing formula L = λW](https://pubsonline.informs.org/doi/10.1287/opre.9.3.383) · [Wikipedia: Little's law](https://en.wikipedia.org/wiki/Little%27s_law)

## Load balancer

A server that spreads incoming requests across a group of backend servers, and stops sending to a backend that fails its health check. It lets you add servers behind one address, and it decides which server gets each request.

**In the game:** The Load Balancing Research unlocks the Load Balancer, which handles 2,000 requests per second per size step and adds 1 ms. By default it splits traffic by each App Server's capacity. It drops a dead host at its next health check, every 10 s by default, while DNS round robin keeps sending to a dead host. Load balancing algorithms adds least connections and power of two choices, and Health checks lets you check every 2 s or 30 s.

**Related:** [Health check](#health-check), [Power of two choices](#power-of-two-choices), [Vertical and horizontal scaling](#vertical-and-horizontal-scaling), [Consistent hashing](#consistent-hashing)

**Learn more:** [Cloudflare: What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/) · [Google SRE book: Load balancing in the datacenter](https://sre.google/sre-book/load-balancing-datacenter/) · [NGINX: Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html)

## Load shedding

Rejecting some requests on purpose when a server is overloaded, so the requests it keeps finish in time instead of all of them timing out. Good shedding rejects early, before the work uses resources, and drops the least important or cheapest work first.

**In the game:** With Priority load shedding researched, you can turn on load shedding on an App Server. Above 90% load it drops whole request kinds, lowest value first (bots, then Realtime, then page views and up), until its load is back at 90%, so a $25 checkout survives an overload. Dropped requests count as errors and spend the error budget, but the requests it keeps stay fast.

**Design:** [Mitigation toolbox](./11-incidents.md#mitigation-toolbox).

**Related:** [Backpressure](#backpressure), [Circuit breaker](#circuit-breaker), [Rate limiting](#rate-limiting), [Metastable failure](#metastable-failure)

**Learn more:** [AWS Builders' Library: Using load shedding to avoid overload](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/) · [Google SRE book: Handling overload](https://sre.google/sre-book/handling-overload/) · [Google SRE book: Addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/)

## Memory leak

Memory that a long-running process keeps allocated but no longer uses, so its memory use grows with uptime. In garbage-collected languages a leak is usually an object that stays reachable by mistake, such as a cache that only grows or a listener nobody removes. The process slows as it swaps or collects garbage, and the operating system kills it when memory runs out.

**In the game:** The Memory leak Incident hits an App Server whose runtime keeps its processes between requests (every runtime but Apache mod_php and PHP-FPM). It gains 2.5% of its RAM each second; past its RAM it swaps and slows, and at 125% of RAM the kernel kills it and it restarts cold. Restart the server to free the memory, or ship the Fix memory leak task (15 Dev Hours), which stops leaks until the next Feature ships.

**Design:** [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

**Related:** [Shared nothing](#shared-nothing), [GC pause](#gc-pause), [Process per request](#process-per-request), [Health check](#health-check)

**Learn more:** [Wikipedia: Memory leak](https://en.wikipedia.org/wiki/Memory_leak) · [Node.js Learn: Memory diagnostics](https://nodejs.org/en/learn/diagnostics/memory) · [Oracle Java docs: Troubleshoot memory leaks](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html)

## Metastable failure

A failure that keeps itself going after its trigger is gone. A short slowdown pushes the system into a bad state, and a feedback loop, most often retries, keeps the load above capacity, so the system stays down until someone cuts the load. Bronson and others named this class of failure in 2021.

**In the game:** The Retry storm Incident slows the Database to 30% of its capacity for 20 s. Links that retry at once send up to 1 + f + f² + f³ calls per call when a share f fails, they carry that failure share into the next Step, and the Database queues what it cannot take; the Incident ends only when that backlog drains. Backoff with jitter, Circuit breakers, and Priority load shedding each break the loop, and naive retries into a Database make this Incident 6 times as likely as backoff does.

**Design:** [Retry storm](./11-incidents.md#retry-storm).

**Related:** [Retry with backoff and jitter](#retry-with-backoff-and-jitter), [Circuit breaker](#circuit-breaker), [Load shedding](#load-shedding), [Thundering herd](#thundering-herd)

**Learn more:** [Bronson et al. (HotOS 2021): Metastable failures in distributed systems](https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf) · [Huang et al. (OSDI 2022): Metastable failures in the wild](https://www.usenix.org/conference/osdi22/presentation/huang-lexiang) · [Marc Brooker: Metastability and distributed systems](https://brooker.co.za/blog/2021/05/24/metastable.html)

## Model inference

Running a trained machine learning model to produce an answer, as opposed to training it. For a large language model, a GPU generates the answer token by token, so cost and speed are measured in tokens per second and time to the first token. You can rent GPUs and serve the model yourself, or pay a hosted API per token.

**In the game:** An ai request sends one prompt of 400 tokens to an inference Node. The LLM API (Hosted models Research) needs no GPUs: it costs $2.50 per 1,000 tokens, takes 600 ms to the first token, and throttles prompts above 100 per second per usage tier. A GPU Node (Model serving Research) takes 300 ms to the first token and generates 200 tokens per second per T4, 900 per A100, or 2,000 per H100. Its Burn is the same whether it is busy or idle, so an H100 is cheaper than the LLM API only while it stays about two-thirds busy.

**Related:** [Utilization](#utilization), [Cold start](#cold-start), [Rate limiting](#rate-limiting), [Spot instance](#spot-instance)

**Learn more:** [Cloudflare: AI inference vs. training](https://www.cloudflare.com/learning/ai/inference-vs-training/) · [vLLM documentation](https://docs.vllm.ai/en/stable/) · [PagedAttention paper (vLLM)](https://arxiv.org/abs/2309.06180)

## MTTR

Mean time to restore (or recover): the average time from the start of a failure until the service works again. It measures how fast a team detects, diagnoses, and fixes problems. DORA now measures a narrower version, failed deployment recovery time.

**In the game:** Every Incident ends with a Postmortem that shows its MTTR: the calendar minutes in which more than 1% of requests failed. An Incident that has hurt users more than half the time by its halfway point escalates one severity and runs 1.5 times as long. Keep MTTR down by acting fast: restart, replace, or fail over the hit Node, and research the Postmortem's action item.

**Design:** [The incident loop](./11-incidents.md#the-incident-loop).

**Related:** [SLO, SLA, SLI](#slo-sla-sli), [Error budget](#error-budget), [DORA metrics](#dora-metrics), [Blast radius](#blast-radius)

**Learn more:** [Wikipedia: Mean time to recovery](https://en.wikipedia.org/wiki/Mean_time_to_recovery) · [DORA: Software delivery performance metrics](https://dora.dev/guides/dora-metrics-four-keys/)

## N+1 query

Loading a list with one query, then running one more query per item to load its related data: N items cost N + 1 queries. ORMs cause it through lazy loading, which hides the extra queries behind normal-looking code. Eager loading fetches the related rows in one or two queries instead.

**In the game:** Laravel, Rails, and Django use an ORM that sends 3 read queries where 1 would do, on page views and API reads. A page view then costs the Database 6 reads instead of 2, which adds CPU there and waiting time on the App Server. Research Eager loading, then ship the Eager loading task (10 Dev Hours) to remove them; Symfony and the light frameworks never make them.

**Design:** [Frameworks](./06-runtimes.md#frameworks).

**Related:** [Connection pooling](#connection-pooling), [Fan-out](#fan-out), [Distributed tracing](#distributed-tracing)

**Learn more:** [Rails Guides: Eager loading associations](https://guides.rubyonrails.org/active_record_querying.html#eager-loading-associations) · [Django docs: select_related](https://docs.djangoproject.com/en/stable/ref/models/querysets/#select-related) · [Laravel docs: Eager loading](https://laravel.com/docs/eloquent-relationships#eager-loading)

## Network partition

A network failure that splits a system into groups of nodes that cannot reach each other, while each group keeps running. During a partition a distributed system must choose between staying available and staying consistent (the CAP theorem).

**In the game:** The Network partition Incident can start in Series C when Links cross regions. For up to 45 s every call between regions times out, except calls from Users and to global Components such as the CDN, and leader-based writes diverge. Press Fence leader to end it. A Distributed SQL Node, which keeps one Raft leader, makes the Incident less likely.

**Related:** [Fallacies of distributed computing](#fallacies-of-distributed-computing), [Quorum](#quorum), [Raft](#raft), [Timeout](#timeout)

**Learn more:** [ACM Queue: The Network is Reliable](https://queue.acm.org/detail.cfm?id=2655736) · [InfoQ: CAP Twelve Years Later](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/) · [Wikipedia](https://en.wikipedia.org/wiki/Network_partition)

## Object storage

Storage that keeps files as objects in a flat namespace, each with a key, the data, and metadata, reached over an HTTP API. Services such as Amazon S3 scale almost without limit and charge for the bytes stored and moved. It suits uploads, images, video, and backups that a database handles badly.

**In the game:** Until you place Object Storage, the Database stores uploads as rows: each 2 MB blob-put costs it 60 ms of CPU. The Object storage Research unlocks Object Storage, which takes uploads and file reads with no capacity limit and 40 ms of latency. Its Burn grows with every GB stored, at the S3 Standard price, so the bill keeps rising as users upload.

**Related:** [Egress](#egress), [Shared nothing](#shared-nothing), [Encryption at rest](#encryption-at-rest), [CDN (content delivery network)](#cdn-content-delivery-network)

**Learn more:** [AWS: What is Amazon S3?](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) · [Cloudflare: What is object storage?](https://www.cloudflare.com/learning/cloud/what-is-object-storage/) · [Wikipedia](https://en.wikipedia.org/wiki/Object_storage)

## Observability

How well you can understand what a system is doing from the data it emits, usually logs, metrics, and traces. Good observability lets you answer new questions about a failure without shipping new code.

**In the game:** Observability Research shows you more of the Ledger. Structured logs split errors by cause, Metrics adds history graphs to every Node, Percentiles shows p50, p95, and p99, and Alerting raises a pager banner when errors, p99, or saturation cross a threshold. The Analytics Node samples the traffic of Nodes that you link into it, from 1% to 100%, and turns it into Insight. Each sample teaches more as Apdex falls, up to twice as much, and a higher sample rate costs more CPU and Burn.

**Related:** [Distributed tracing](#distributed-tracing), [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [SLO, SLA, SLI](#slo-sla-sli), [MTTR](#mttr)

**Learn more:** [OpenTelemetry: Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/) · [Google SRE book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/) · [Wikipedia](<https://en.wikipedia.org/wiki/Observability_(software)>)

## OLTP and OLAP

Online transaction processing (OLTP) runs many small, fast reads and writes on current rows, such as orders and logins. Online analytical processing (OLAP) runs few large scans and aggregations over history, such as reports. OLTP databases store each row together; OLAP engines usually store each column together, so a scan reads only the columns it needs.

**In the game:** Report requests send q-scan queries. On the Database a scan costs a lot of CPU and evicts its buffer cache, so other reads go to disk and writes wait; the Report kills the database Incident scans 10 times as much. A Data Warehouse (Data warehousing research) takes the scans off the primary: 1.5 s each, no capacity limit, and $0.02 per scan times the Era's cost index.

**Design:** [Data Warehouse](./07-data-tier.md#data-warehouse).

**Related:** [CDC (change data capture)](#cdc-change-data-capture), [Read replica](#read-replica), [Operating margin](#operating-margin)

**Learn more:** [AWS: OLTP vs OLAP](https://aws.amazon.com/compare/the-difference-between-olap-and-oltp/) · [Wikipedia: Online analytical processing](https://en.wikipedia.org/wiki/Online_analytical_processing) · [Wikipedia: Online transaction processing](https://en.wikipedia.org/wiki/Online_transaction_processing)

## Operating margin

Operating profit as a share of revenue: (revenue − operating costs) / revenue. Operating costs include hosting, salaries, and fees. It shows how much of each dollar of revenue the business keeps after it pays to run itself.

**In the game:** The game's margin is (revenue − Burn) / revenue, where Burn is the cloud bill plus salaries, Egress, and third-party fees; with no revenue it reads −100%. Margin plus annual user growth is your Rule of 40, which sets the valuation multiple: 4 + 0.15 × the Rule of 40, from 2 to 30. In the Public Era you set margin guidance of 10%, 20%, or 30% each quarter, and a beat raises the multiple while a miss lowers it.

**Related:** [Rule of 40](#rule-of-40), [Egress](#egress), [Utilization](#utilization), [Spot instance](#spot-instance)

**Learn more:** [Investopedia: Operating margin](https://www.investopedia.com/terms/o/operatingmargin.asp) · [Wikipedia](https://en.wikipedia.org/wiki/Operating_margin)

## Percentile (p50, p95, p99)

The value below which a given share of measurements fall. The p50 (median) latency is what a typical request sees; the p99 is the latency that 99% of requests beat, so 1 request in 100 is slower. Averages hide slow outliers, so SLOs and alerts usually use high percentiles.

**In the game:** Before Percentiles research the HUD shows mean latency; after it, the HUD shows the p99 and each request kind shows its p50, p95, and p99. Event-loop stalls and GC pauses hit about 2% of requests, so they raise the p99 while the mean and the p95 barely move. With Alerting, the latency rule pages you when a kind's p99 stays above 4 times its Apdex target for 30 s.

**Design:** [Percentiles](./04-simulation.md#percentiles).

**Related:** [Tail at scale](#tail-at-scale), [Apdex](#apdex), [SLO, SLA, SLI](#slo-sla-sli), [GC pause](#gc-pause)

**Learn more:** [Google SRE book: Service level objectives](https://sre.google/sre-book/service-level-objectives/) · [Wikipedia: Percentile](https://en.wikipedia.org/wiki/Percentile)

## Point-in-time recovery

Restoring a database to its exact state at a chosen moment, by loading a base backup and then replaying the write-ahead log up to that time. Because the log is archived continuously, you lose only the last few minutes of writes, not a whole day.

**In the game:** The Point-in-time recovery Research adds Backups to the Database card: None, Nightly, or PITR. Nightly snapshots can lose a calendar day of writes and add 5% to the Database's Burn. PITR loses about 2 calendar minutes and adds 15%. The DR drill for the IPO checklist reads this RPO and passes only under 5 minutes, unless a replica in another region already covers the data.

**Related:** [RPO and RTO](#rpo-and-rto), [Replication lag](#replication-lag), [Read replica](#read-replica), [Encryption at rest](#encryption-at-rest)

**Learn more:** [PostgreSQL docs: Continuous archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html) · [AWS: Restoring an RDS instance to a specified time](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)

## Power of two choices

A load balancing method: pick two servers at random and send the request to the less loaded one. Mitzenmacher showed that two random choices spread load exponentially better than one, and the balancer needs no exact, shared view of every server's load. NGINX offers it as random two least_conn.

**In the game:** With Load balancing algorithms researched, a Load Balancer can use Two choices. It keeps no global state, so the Load Balancer itself handles 1.5 times the traffic, but 10% of the traffic is split evenly whatever each server's load. Least conn splits fully by current capacity, without the capacity bonus.

**Design:** [Load Balancer](./05-components.md#load-balancer).

**Related:** [Load balancer](#load-balancer), [Consistent hashing](#consistent-hashing), [Health check](#health-check), [Hot key](#hot-key)

**Learn more:** [Mitzenmacher (2001): The power of two choices in randomized load balancing](https://www.eecs.harvard.edu/~michaelm/postscripts/tpds2001.pdf) · [NGINX docs: upstream module (random)](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#random)

## Pre-fork worker model

A server design where a master process starts a fixed pool of worker processes ahead of time, and each worker handles one request at a time. Apache prefork, PHP-FPM, and Gunicorn work this way. It isolates requests well, but every worker costs memory, and a request that waits holds its worker.

**In the game:** PHP-FPM and Python's Gunicorn run a pool of workers that you size from 1 to 400 on the App Server card; PHP-FPM starts with 5. Each worker takes one request, so slow database calls fill the pool, and each worker costs RAM (120 MB in Gunicorn), so a big pool can swap. PHP-FPM's Static mode keeps the whole pool resident. Dynamic and On demand modes save memory but make 2% or 10% of requests wait 20 or 50 ms for a fork.

**Related:** [Process per request](#process-per-request), [Thread pool](#thread-pool), [GIL (global interpreter lock)](#gil-global-interpreter-lock), [Little's law](#littles-law)

**Learn more:** [Gunicorn docs: Design](https://gunicorn.org/design/) · [Apache HTTP Server: prefork MPM](https://httpd.apache.org/docs/2.4/mod/prefork.html) · [PHP manual: FPM configuration](https://www.php.net/manual/en/install.fpm.configuration.php)

## Process per request

A server model in which each request in flight occupies a whole worker process until it finishes, as in Apache prefork with mod_php, PHP-FPM, and Gunicorn sync workers. It isolates requests well, but every waiting request holds a process and its memory, so the pool size and the RAM cap how many requests run at once.

**In the game:** Apache mod_php, the starting runtime, runs a process per request in flight, up to 150, each 60 MB because it embeds PHP, so RAM runs out early. PHP-FPM and Gunicorn run a fixed pool that you size (PHP-FPM ships with 5 workers); a request holds its worker while it waits on the Database, and a pool too big for the box swaps until the kernel kills it. Each process also holds its own database connection, so a big pool can hit Postgres's 100-connection limit.

**Design:** [Concurrency models](./06-runtimes.md#concurrency-models).

**Related:** [Pre-fork worker model](#pre-fork-worker-model), [Shared nothing](#shared-nothing), [Little's law](#littles-law), [Connection pooling](#connection-pooling)

**Learn more:** [Apache HTTP Server: MPM prefork](https://httpd.apache.org/docs/2.4/mod/prefork.html) · [PHP manual: FastCGI Process Manager (FPM)](https://www.php.net/manual/en/install.fpm.php) · [Gunicorn docs: Design](https://gunicorn.org/design/)

## Quorum

The number of replicas that must take part in a read or a write. With N replicas, read quorum R, and write quorum W, R + W > N means every read asks at least one replica that acknowledged the latest write. That is not linearizability: concurrent writes, failed writes, and sloppy quorums can still return old values.

**In the game:** A Wide-column Store keeps each key on N replicas (1 to 5); you set R, the replicas a read asks, and W, the replicas a write waits for. With R + W > N reads never miss the latest write; a weaker quorum costs fewer replica operations and waits for an earlier reply, but some reads come back stale. A quorum that needs every replica fails while one replica is lost, and even a strong quorum gets 2% stale and 1% duplicate checkouts.

**Design:** [Wide-column Store](./07-data-tier.md#wide-column-store).

**Related:** [Raft](#raft), [Eventual consistency](#eventual-consistency), [Leaderless replication](#leaderless-replication), [Network partition](#network-partition)

**Learn more:** [Apache Cassandra docs: Tunable consistency](https://cassandra.apache.org/doc/stable/cassandra/architecture/dynamo.html) · [DeCandia et al. (2007): Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) · [Wikipedia: Quorum (distributed computing)](<https://en.wikipedia.org/wiki/Quorum_(distributed_computing)>)

## Raft

A consensus algorithm that keeps a replicated log identical on a group of servers. An elected leader appends each entry and commits it once a majority has stored it, so the group keeps working when a minority fails and never commits two different values. Ongaro and Ousterhout designed it in 2014 to be easier to understand than Paxos; etcd and CockroachDB use it.

**In the game:** Distributed SQL (Consensus databases research, which needs Synchronous replication) runs SQL on Raft. Every write waits for the round trip to a majority of the regions it spreads over, while a read asks the leaseholder and costs a quarter of a write. It serves 6,000 transactions per second at size 1 and keeps one leader through a Network partition, so that Incident is a quarter as likely with it.

**Design:** [Distributed SQL](./07-data-tier.md#distributed-sql).

**Related:** [Quorum](#quorum), [Synchronous replication](#synchronous-replication), [Network partition](#network-partition), [Leaderless replication](#leaderless-replication)

**Learn more:** [The Raft consensus algorithm](https://raft.github.io/) · [Ongaro and Ousterhout (2014): In search of an understandable consensus algorithm](https://raft.github.io/raft.pdf) · [CockroachDB docs: Replication layer](https://www.cockroachlabs.com/docs/stable/architecture/replication-layer)

## Rate limiting

Capping how many requests a client can make in a period and rejecting the rest, often with HTTP 429 Too Many Requests. It protects a service from abuse, scrapers, and one noisy client, and lets a provider share capacity fairly. Common algorithms are the token bucket, the leaky bucket, and fixed or sliding windows.

**In the game:** You meet rate limiting from the client side: the LLM API takes 100 prompts per second per usage tier, and past that, prompts fail at once as throttled. The game has no rate limiter you can put in front of your own App Servers. To stop abusive traffic, a WAF blocks bots by rule instead: 80% of bots at paranoia 2, with 0.5% of real users blocked too.

**Design:** [API Gateway](./05-components.md#api-gateway).

**Related:** [Token bucket](#token-bucket), [WAF (web application firewall)](#waf-web-application-firewall), [Load shedding](#load-shedding), [Backpressure](#backpressure)

**Learn more:** [Cloudflare Learning Center: What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/) · [MDN: 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429) · [RFC 6585: Additional HTTP status codes](https://www.rfc-editor.org/rfc/rfc6585)

## Read replica

A copy of a database that follows the primary's writes and answers read-only queries. It takes read load off the primary. Replication is usually asynchronous, so a replica can lag behind and return data that is a little old.

**In the game:** The Read replicas Research unlocks the Read Replica, which runs like a Database but answers only q-read. It lags 20 ms plus 2 ms for each write per second, and up to 15% of its reads come back stale; a Replication lag Incident makes the lag ten times larger. Read-your-writes routing sends reads that follow a write to the primary. A replica in another region also limits how much data you lose if the home region fails.

**Related:** [Replication lag](#replication-lag), [Read-your-writes consistency](#read-your-writes-consistency), [Eventual consistency](#eventual-consistency), [Synchronous replication](#synchronous-replication)

**Learn more:** [AWS: Amazon RDS read replicas](https://aws.amazon.com/rds/features/read-replicas/) · [PostgreSQL docs: Hot standby](https://www.postgresql.org/docs/current/hot-standby.html)

## Read-your-writes consistency

A session guarantee: after a client writes, its own later reads see that write or a newer one, even if other clients still see old data. It matters when reads go to replicas that lag behind the primary; a common fix sends a user's reads to the primary for a short time after they write. Terry and others defined it in 1994.

**In the game:** A Read Replica lags behind the primary, so some reads come back stale, and a stale read fails an API read or a checkout that reads its own write. With Read-your-writes routing researched, turn the option on an App Server: checkout reads go to the primary and are never stale, and other stale reads fall by 80%. It also makes the Replication lag Incident much rarer (weight 0.3 instead of 2).

**Design:** [Read Replica](./07-data-tier.md#read-replica).

**Related:** [Replication lag](#replication-lag), [Read replica](#read-replica), [Eventual consistency](#eventual-consistency), [Synchronous replication](#synchronous-replication)

**Learn more:** [Jepsen: Read your writes](https://jepsen.io/consistency/models/read-your-writes) · [Terry et al. (1994): Session guarantees for weakly consistent replicated data](https://www.cs.utexas.edu/users/dahlin/Classes/GradOS/papers/SessionGuaranteesPDIS.pdf)

## RED method

Rate, Errors, and Duration for each service: how many requests it gets, how many fail, and how long they take. It measures what users feel, so alerts watch it. Tom Wilkie named it as a service-level version of Google's four golden signals.

**In the game:** The Dashboard (D) opens after Metrics research. Its Golden signals row charts traffic, latency, and, with Structured logs, errors for your whole system over time. A per-Service RED row is not built yet; use the Golden signals row to see when users started to suffer.

**Design:** [The Dashboard](./12-observability.md#the-dashboard).

**Related:** [USE method](#use-method), [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [Observability](#observability), [Apdex](#apdex)

**Learn more:** [Grafana Labs: The RED method](https://grafana.com/blog/2018/08/02/the-red-method-how-to-instrument-your-services/) · [Google SRE book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)

## ReDoS (regular expression denial of service)

A denial of service where a crafted input makes a backtracking regular expression engine take exponential or very long time. One bad pattern can pin a CPU core per request.

**In the game:** The Regex backtracking Incident can start from Series B when you run a WAF. A new WAF rule backtracks on long inputs, and every WAF keeps only 10% of its capacity, so traffic through it fails or queues. Press Disable rule on the WAF to end it at once. In real systems, a canary rollout of rules catches this before it reaches every server.

**Related:** [WAF (web application firewall)](#waf-web-application-firewall), [Canary deployment](#canary-deployment), [Blast radius](#blast-radius)

**Learn more:** [OWASP: Regular expression Denial of Service](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS) · [Cloudflare blog: Details of the outage on July 2, 2019](https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/) · [Wikipedia](https://en.wikipedia.org/wiki/ReDoS)

## Replication lag

The delay between a write committing on the primary database and that write appearing on a replica. An asynchronous replica applies the primary's log after the fact, so the lag grows with write volume, long-running queries on the replica, and network delay. Reads from a lagging replica return old data.

**In the game:** A Read Replica lags 20 ms plus 2 ms for every write per second, and the share of its reads that come back stale equals the lag in seconds, up to 15%. The Replication lag Incident multiplies the lag by 10, up to 50% stale reads. Stale reads fail API reads and checkouts, while page views accept them; Read-your-writes routing sends the reads that care to the primary.

**Design:** [Read Replica](./07-data-tier.md#read-replica).

**Related:** [Read-your-writes consistency](#read-your-writes-consistency), [Read replica](#read-replica), [Synchronous replication](#synchronous-replication), [RPO and RTO](#rpo-and-rto)

**Learn more:** [PostgreSQL docs: Hot standby](https://www.postgresql.org/docs/current/hot-standby.html) · [Amazon RDS docs: Working with read replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)

## Retry with backoff and jitter

Retrying a failed call after a wait that grows with each attempt (exponential backoff), with a random spread (jitter), so clients that failed together do not retry together. A retry budget or cap limits how many extra calls retries may add, so retries cannot multiply the load on a service that is already struggling.

**In the game:** Before Timeouts and retries research, every Link waits 30 s and never retries. After it, you set each Link's timeout to 1, 5, or 30 s and can turn on retries: naive retries fire at once, up to three times, so a callee where a share f fails gets 1 + f + f² + f³ calls per call. Backoff with jitter waits about 200 ms per retry and allows at most 10% extra calls, which keeps a Retry storm small.

**Design:** [Retries](./04-simulation.md#retries).

**Related:** [Metastable failure](#metastable-failure), [Timeout](#timeout), [Circuit breaker](#circuit-breaker), [Thundering herd](#thundering-herd)

**Learn more:** [AWS Builders' Library: Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) · [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) · [Google SRE book: Addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/)

## RPO and RTO

The recovery point objective (RPO) is the most recent data you can afford to lose in a disaster, measured as time before the failure. The recovery time objective (RTO) is the longest the service can stay down before it must work again. Together they decide how much backup, replication, and standby capacity a system needs.

**In the game:** A Database's backups set its RPO: None loses everything, Nightly up to 1,440 calendar minutes, and PITR (Point-in-time recovery research) 2 minutes. A Read Replica in another region lowers it to that replica's lag, and a spread Wide-column Store or Distributed SQL loses nothing. The IPO checklist's DR drill fails the home region and passes only when errors fall under 1% within 60 calendar minutes (RTO) and the RPO is under 5 minutes.

**Design:** [Multi-region data](./07-data-tier.md#multi-region-data), [the IPO checklist](./10-progression.md#era-6-pre-ipo).

**Related:** [Point-in-time recovery](#point-in-time-recovery), [Synchronous replication](#synchronous-replication), [Availability zone](#availability-zone), [MTTR](#mttr)

**Learn more:** [AWS whitepaper: Disaster recovery of workloads (RPO and RTO)](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/business-continuity-plan-bcp.html) · [PostgreSQL docs: Continuous archiving and point-in-time recovery](https://www.postgresql.org/docs/current/continuous-archiving.html)

## Rule of 40

A heuristic for software-as-a-service companies: annual revenue growth rate plus profit margin, both in percent, should be at least 40. It lets you compare a fast-growing, loss-making company with a slow, profitable one on one number. Investors often pay higher valuation multiples to companies above 40.

**In the game:** Your Valuation is annual revenue times a multiple set by the Rule of 40: 4 + 0.15 × the score, kept between 2 and 30. The game scores user growth over the last calendar week, annualized, plus margin, which is (Revenue − Burn) / Revenue. A score of 40 or more is an IPO checklist item, so cut Burn or grow faster before you go public.

**Design:** [Valuation](./09-economy.md#valuation).

**Related:** [Operating margin](#operating-margin), [Egress](#egress), [Spot instance](#spot-instance)

**Learn more:** [Wikipedia: Rule of 40](https://en.wikipedia.org/wiki/Rule_of_40) · [McKinsey: SaaS and the Rule of 40](https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/saas-and-the-rule-of-40-keys-to-the-critical-value-creation-metric)

## Sharding

Splitting one dataset across several databases (shards) by a key, such as a hash of the user ID, so each shard stores and serves only part of the data. It scales writes and storage past one machine, but a query that spans shards must ask all of them, and one hot key can overload its shard while the others idle.

**In the game:** The Sharding research exists, but today its only effect is to unlock Leaderless replication: you cannot shard the Database. The closest mechanic is the Hot key Incident, where 30% of the reads to a Cache or Wide-column Store ask for one key on one shard, so the Node's capacity falls to about 1 / (0.3 × shards + 0.7). With Hybrid fan-out you can split hot keys across the Node's shards.

**Design:** [Partitioning](./07-data-tier.md#partitioning-sharding).

**Related:** [Hot key](#hot-key), [Consistent hashing](#consistent-hashing), [Leaderless replication](#leaderless-replication), [Fan-out](#fan-out)

**Learn more:** [Wikipedia: Shard (database architecture)](<https://en.wikipedia.org/wiki/Shard_(database_architecture)>) · [MongoDB docs: Sharding](https://www.mongodb.com/docs/manual/sharding/) · [AWS: What is database sharding?](https://aws.amazon.com/what-is/database-sharding/)

## Shared nothing

An architecture in which nodes, or requests, share no memory or disk and coordinate only over the network, so each can fail, restart, or scale on its own. Michael Stonebraker argued for it for databases in 1986. PHP applies the idea per request: every request starts with clean process state and frees everything when it ends.

**In the game:** Apache mod_php and PHP-FPM are shared nothing: they free all memory after each request, so the Memory leak Incident never picks them. Every other runtime keeps its processes across requests, which avoids per-request setup but can leak. The price is speed: PHP runs at 0.15 times Go's CPU speed, or 0.375 with OPcache.

**Design:** [Runtime behaviors](./06-runtimes.md#runtime-behaviors).

**Related:** [Process per request](#process-per-request), [Memory leak](#memory-leak), [Vertical and horizontal scaling](#vertical-and-horizontal-scaling)

**Learn more:** [Stonebraker (1986): The case for shared nothing](https://dsf.berkeley.edu/papers/hpts85-nothing.pdf) · [Wikipedia: Shared-nothing architecture](https://en.wikipedia.org/wiki/Shared-nothing_architecture)

## SLO, SLA, SLI

A service level indicator (SLI) is a measurement of service behavior, such as the share of requests that succeed. A service level objective (SLO) is a target for an SLI over a window, such as 99.9% over 30 days. A service level agreement (SLA) is a contract with customers that sets consequences, such as service credits, when a promised level is missed; it is usually looser than the internal SLO.

**In the game:** The SLI is availability: the share of user requests answered over the last calendar week, without bots and WAF blocks. Each Era sets the SLO, from 99% in Garage to 99.99% in Public, and from Series A the failures it allows are your error budget. SLO dashboards put that budget on the HUD, and the IPO checklist needs 99.95%. The game has no SLA yet.

**Design:** [SLOs and error budgets](./11-incidents.md#slos-and-error-budgets).

**Related:** [Error budget](#error-budget), [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [MTTR](#mttr), [Apdex](#apdex)

**Learn more:** [Google SRE book: Service level objectives](https://sre.google/sre-book/service-level-objectives/) · [Google SRE workbook: Implementing SLOs](https://sre.google/workbook/implementing-slos/) · [Google Cloud blog: SLIs, SLAs, and SLOs](https://cloud.google.com/blog/products/devops-sre/sre-fundamentals-slis-slas-and-slos)

## SOC 2

An audit framework from the AICPA. An independent auditor reports on a service organization's controls for security, availability, processing integrity, confidentiality, and privacy. Enterprise customers often require a SOC 2 report.

**In the game:** SOC 2 is an item on the Pre-IPO IPO checklist. You need the SOC 2 program Research, which needs TLS everywhere, Encryption at rest, and Dependency scanning, and you need the Security team Research. Without a Security team, an Audit finding Incident can reset a passed DR drill.

**Related:** [Encryption at rest](#encryption-at-rest), [Dependency scanning](#dependency-scanning), [TLS certificate](#tls-certificate), [Data residency](#data-residency)

**Learn more:** [AICPA: System and Organization Controls](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2) · [Wikipedia](https://en.wikipedia.org/wiki/System_and_Organization_Controls)

## Spot instance

Spare cloud capacity sold at a large discount, up to 90% off the on-demand price, that the provider can take back whenever it needs the capacity. AWS gives a two-minute interruption notice. Spot suits stateless, fault-tolerant work such as batch jobs and servers behind a load balancer with spare capacity, not a single database.

**In the game:** Spot pricing is designed but not in the game yet. The closest is the GPU shortage Incident: the provider reclaims a GPU Node, H100s first, and it stays down for the Incident; an LLM API as a fallback makes it a quarter as likely. The Instance failure Incident also kills one Node's host, three times as often on a Node with no second copy as on others.

**Design:** [Pricing models](./09-economy.md#pricing-models).

**Related:** [Operating margin](#operating-margin), [Autoscaling](#autoscaling), [Health check](#health-check), [Model inference](#model-inference)

**Learn more:** [AWS EC2 docs: Spot Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html) · [AWS EC2 docs: Spot Instance interruption notices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html) · [Google Cloud docs: Spot VMs](https://cloud.google.com/compute/docs/instances/spot)

## Strangler pattern

Replacing a legacy system piece by piece: put a routing layer in front of it, send a growing share of traffic or features to the new system, and retire the old one when nothing uses it. Martin Fowler named it after the strangler fig, a vine that grows around a tree until it replaces it. It avoids a risky big-bang rewrite.

**In the game:** Changing a Service's Stack in a Company starts a migration that runs both versions and moves App Servers over in four steps: 5%, 25%, 50%, then 100% of traffic. Each step costs its share of the migration's Dev Hours (10%, 20%, 30%, 40%), and requests on the new Stack fail 3% of the time until you ship Fix migration bugs. Features on the migrating Service build at half speed.

**Design:** [Migrations](./08-team-and-velocity.md#migrations).

**Related:** [Tech debt](#tech-debt), [Canary deployment](#canary-deployment), [Feature flag](#feature-flag), [Blue-green deployment](#blue-green-deployment)

**Learn more:** [Martin Fowler: Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html) · [Azure Architecture Center: Strangler Fig pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig) · [AWS Prescriptive Guidance: Strangler fig pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)

## Synchronous replication

Replication where the primary confirms a write only after at least one replica has also stored it. No acknowledged write is lost if the primary fails, but every write waits for the round trip to the replica.

**In the game:** The Synchronous replication Research says that writes wait for a replica, but today it only unlocks Consensus databases; it does not change Read Replicas or the Database. The closest thing the game models is Distributed SQL: every write waits for a majority of its replicas, so writes across regions pay the round trip. A Database with a Standby also fails over in seconds when its zone fails.

**Related:** [Read replica](#read-replica), [Replication lag](#replication-lag), [Raft](#raft), [RPO and RTO](#rpo-and-rto)

**Learn more:** [PostgreSQL docs: Log-shipping standby servers (synchronous replication)](https://www.postgresql.org/docs/current/warm-standby.html) · [PostgreSQL docs: Replication settings](https://www.postgresql.org/docs/current/runtime-config-replication.html) · [Wikipedia: Replication (computing)](<https://en.wikipedia.org/wiki/Replication_(computing)>)

## Tail at scale

When one request fans out to many servers or waits for many replies, the slowest reply sets its latency, so a delay that is rare on each server becomes common for the whole request. With 100 servers each slow 1% of the time, 63% of requests meet at least one slow reply. Dean and Barroso described it in 2013, with fixes such as hedged requests.

**In the game:** A request collects the tail events of every Node on its path: two independent chances a and b combine to 1 − (1 − a)(1 − b), so a long chain of Nodes that each stall now and then has a worse p99 than any one of them. A Wide-column Store read waits for the R-th fastest of N replicas, and at R = N it waits for the slowest one. Percentiles research shows the p99 where this appears.

**Design:** [Percentiles](./04-simulation.md#percentiles).

**Related:** [Percentile (p50, p95, p99)](#percentile-p50-p95-p99), [Hedged request](#hedged-request), [Fan-out](#fan-out), [Quorum](#quorum)

**Learn more:** [Dean and Barroso (2013): The tail at scale](https://research.google/pubs/the-tail-at-scale/) · [The tail at scale (PDF)](https://www.barroso.org/publications/TheTailAtScale.pdf) · [Communications of the ACM: The tail at scale](https://cacm.acm.org/research/the-tail-at-scale/)

## Tech debt

Shortcuts and outdated design in code that make each later change slower or riskier, like interest on a loan, until the team repays the debt by refactoring. Ward Cunningham coined the metaphor in 1992. Some debt is a deliberate tradeoff to ship sooner; its cost is the extra effort it adds to every later change.

**In the game:** Each Service has a tech debt percentage. Every shipped Feature adds 6 points under Move fast, 3 under Balanced, and 1 under Quality, plus 1 with no framework, and a task shipped during an Incident adds 2. Debt cuts velocity by up to half, raises the bad-deploy chance up to 3 times, and makes every Incident likelier. The Refactor task (10 Dev Hours) removes 20 points, and the Quality policy pays some down by itself.

**Design:** [Tech debt](./08-team-and-velocity.md#tech-debt).

**Related:** [Brooks's law](#brookss-law), [Strangler pattern](#strangler-pattern), [Code review](#code-review), [DORA metrics](#dora-metrics)

**Learn more:** [Martin Fowler: Technical debt](https://martinfowler.com/bliki/TechnicalDebt.html) · [Wikipedia: Technical debt](https://en.wikipedia.org/wiki/Technical_debt)

## Thread pool

A fixed set of threads that take work from a shared queue, so a program does not pay to create a thread per task. In a thread-per-request server, the pool size limits how many requests run at once, and a request that waits on I/O still holds its thread.

**In the game:** Java's Tomcat runs 200 threads in one JVM, and Ruby's Puma runs 5 threads per process: each waiting request holds a thread, so slow database calls can fill the pool. For Node.js, the libuv thread pool Research moves password hashing off the event loop, so logins stop stalling other requests. Rust's Tokio runs async tasks on a pool of worker threads, where a CPU-heavy task blocks only one of them.

**Related:** [Event loop](#event-loop), [Pre-fork worker model](#pre-fork-worker-model), [Async I/O](#async-io), [Little's law](#littles-law)

**Learn more:** [Wikipedia](https://en.wikipedia.org/wiki/Thread_pool) · [Node.js: Don't block the event loop (or the worker pool)](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop) · [Apache Tomcat: The Executor (thread pool)](https://tomcat.apache.org/tomcat-10.1-doc/config/executor.html)

## Thundering herd

Many clients or processes wake up and act at the same moment, for example after a restart, a cache expiry, or a shared timer, and their combined load overwhelms a shared resource. The fixes spread the herd out: jitter, request coalescing, and staggered restarts.

**In the game:** The Cache stampede Incident restarts a Cache empty, and every miss goes to the Database at once; while the Database runs at 90% or more, refills time out and the Cache stays cold. Stampede protection lets a cold Cache send on only 25% of its extra misses while the rest wait on one fetch, and Cache warming brings a Cache back 80% warm. Naive retries are a herd too: every caller retries at once, and Backoff with jitter spreads them out.

**Design:** [Realtime Hub](./05-components.md#realtime-hub).

**Related:** [Cache stampede](#cache-stampede), [Retry with backoff and jitter](#retry-with-backoff-and-jitter), [Cache warming](#cache-warming), [Metastable failure](#metastable-failure)

**Learn more:** [Wikipedia: Thundering herd problem](https://en.wikipedia.org/wiki/Thundering_herd_problem) · [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

## Tiered caching

A CDN setup where edge locations ask a smaller set of regional or upper-tier caches before the origin. Edges share what the upper tier holds, so the hit rate rises, and fewer requests reach the origin.

**In the game:** The Tiered caching Research (after Content delivery) makes CDN edges ask a regional tier before your origin. It raises the share of media requests that a CDN answers from 75% to 92% at the default TTL. Video that the CDN answers does not load your App Servers and is billed at the cheaper edge Egress price.

**Related:** [Cache hit rate](#cache-hit-rate), [CDN (content delivery network)](#cdn-content-delivery-network), [Egress](#egress), [Cache-aside](#cache-aside)

**Learn more:** [Cloudflare docs: Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/) · [AWS: CloudFront Origin Shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html)

## Timeout

The longest time a caller waits for a response before it gives up. A timeout frees the caller's thread or connection, so a slow dependency cannot hold it forever, but a timeout set too short fails calls that would have worked.

**In the game:** Every Link waits 30 s for an answer. After Timeouts and retries research, you can set each Link's timeout to 1, 5, or 30 s. A caller holds its slot only until the timeout, so a short timeout keeps a slow Database from filling every App Server slot, and calls past it fail as timeouts. A charge that times out and is retried can charge twice until you own Idempotency keys.

**Related:** [Retry with backoff and jitter](#retry-with-backoff-and-jitter), [Circuit breaker](#circuit-breaker), [Idempotency](#idempotency), [Little's law](#littles-law)

**Learn more:** [AWS Builders' Library: Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) · [Google SRE book: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)

## TLS certificate

A signed file that binds a domain name to a public key, issued by a certificate authority. Browsers check it before they open an HTTPS connection, and refuse the site once it expires. Certificates are short-lived, so teams renew them automatically, for example with ACME and Let's Encrypt.

**In the game:** The Certificate expired Incident can start from Seed. While it runs, every browser refuses the site: every request from Users fails as down, for up to 60 s. Press Renew to end it. Certificate automation research renews certificates before they expire, so the Incident never starts again.

**Related:** [SOC 2](#soc-2), [MTTR](#mttr), [Blast radius](#blast-radius)

**Learn more:** [Cloudflare Learning Center: What is an SSL certificate?](https://www.cloudflare.com/learning/ssl/what-is-an-ssl-certificate/) · [Let's Encrypt: Decreasing Certificate Lifetimes to 45 Days](https://letsencrypt.org/2025/12/02/from-90-to-45/) · [Let's Encrypt: FAQ](https://letsencrypt.org/docs/faq/)

## Token bucket

A rate limiting algorithm. A bucket holds up to B tokens and refills at a fixed rate r; each request takes a token, and a request that finds the bucket empty waits or is rejected. It allows short bursts of up to B while it holds the long-run average to r.

**In the game:** Burstable instances run on a token bucket of CPU credits. A Burstable Node earns credits while it uses less than 20% of its vCPU, banks up to 100 core-seconds per vCPU, and spends them to run above that baseline. When the bucket is empty it drops to 20% CPU, so a Burstable box that runs hot all day stalls; in exchange it costs 0.4 times a General box.

**Design:** [API Gateway](./05-components.md#api-gateway).

**Related:** [Rate limiting](#rate-limiting), [Utilization](#utilization), [Vertical and horizontal scaling](#vertical-and-horizontal-scaling)

**Learn more:** [Wikipedia: Token bucket](https://en.wikipedia.org/wiki/Token_bucket) · [AWS EC2 docs: Burstable performance instances, key concepts](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html)

## Transactional outbox

A way to update a database and publish an event without losing either. The service writes the change and an outbox row in the same database transaction, and a separate relay reads the outbox and publishes each event to the message broker, at least once. It avoids the dual-write problem, where the database commit succeeds and the publish fails, or the reverse.

**In the game:** The outbox is designed but not in the game yet. The closest mechanic is the Queue: an App Server linked to a Queue hands the async part of slow requests to Workers, and users wait only for the enqueue. The game does not model an event lost or duplicated between a database write and a publish.

**Design:** [Keeping copies in sync](./07-data-tier.md#keeping-copies-in-sync).

**Related:** [At-least-once delivery](#at-least-once-delivery), [CDC (change data capture)](#cdc-change-data-capture), [Idempotency](#idempotency), [Dead-letter queue](#dead-letter-queue)

**Learn more:** [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) · [AWS Prescriptive Guidance: Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) · [Debezium docs: Outbox event router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)

## USE method

Utilization, Saturation, and Errors for each resource, such as CPU, memory, or a connection pool. It measures causes, not symptoms: a resource at 100% with work waiting is the likely bottleneck. Brendan Gregg described it as a checklist for performance analysis.

**In the game:** The Dashboard's Saturation row shows utilization for each Node as a bar gauge, a state timeline, and a table, so you can see which Node filled up first. A full per-resource USE row is not built yet. On the Board, the Load bar on each Node card shows the same utilization now.

**Design:** [The Dashboard](./12-observability.md#the-dashboard).

**Related:** [RED method](#red-method), [Utilization](#utilization), [Little's law](#littles-law), [Observability](#observability)

**Learn more:** [Brendan Gregg: The USE method](https://www.brendangregg.com/usemethod.html)

## Utilization

The share of a resource's capacity in use over a period: offered work divided by capacity. Queueing delay grows sharply as utilization nears 100%: in a simple M/M/1 queue the wait is proportional to ρ / (1 − ρ), so going from 50% to 90% busy multiplies the wait by 9.

**In the game:** Each Node shows its utilization: offered work over the capacity of its tightest limit, whether CPU, slots, memory, connections, or network. Queueing delay grows as ρ / (1 − ρ), the Node warns at 70% and shows danger at 90%, and above 100% it drops the excess. The Bottleneck search weighs only Nodes above 60%, and an Autoscaler targets 40%, 60%, or 80%.

**Design:** [Capacity, utilization, and queues](./04-simulation.md#capacity-utilization-and-queues).

**Related:** [Little's law](#littles-law), [Backpressure](#backpressure), [Autoscaling](#autoscaling), [Load shedding](#load-shedding)

**Learn more:** [Brendan Gregg: The USE method](https://www.brendangregg.com/usemethod.html) · [Wikipedia: M/M/1 queue](https://en.wikipedia.org/wiki/M/M/1_queue)

## Vertical and horizontal scaling

Vertical scaling (scaling up) moves a workload to a bigger machine with more CPU and memory. Horizontal scaling (scaling out) adds more machines and splits the work among them. Scaling up is simple but has a ceiling and usually a restart; scaling out needs a load balancer and stateless servers, but has no hard ceiling and survives the loss of one machine.

**In the game:** Resizing a sized Node moves it one step between nano (0.5 vCPU) and metal (96 vCPU), and each step doubles vCPU and RAM, but the Node restarts and comes back cold. Some software cannot use the extra cores: Node.js runs one event loop on one core, and Redis answers on one thread. To scale out, put more App Servers behind DNS or a Load Balancer, each copy costing 25% more to place, or let an Autoscaler add copies, which take 180 s on VMs or 30 s in a Kubernetes Cluster.

**Design:** [Vertical and horizontal](./16-balancing.md#vertical-and-horizontal).

**Related:** [Load balancer](#load-balancer), [Autoscaling](#autoscaling), [Shared nothing](#shared-nothing), [Utilization](#utilization)

**Learn more:** [Azure Architecture Center: Design to scale out](https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/scale-out) · [Wikipedia: Scalability (horizontal and vertical)](https://en.wikipedia.org/wiki/Scalability)

## WAF (web application firewall)

A filter in front of a web application that inspects HTTP requests and blocks those that match attack or bot rules. Stricter rule sets catch more attacks and also block more real users by mistake (false positives).

**In the game:** Web application firewall research unlocks the WAF Component. It blocks a share of bot requests and, by mistake, a share of real users, set by its paranoia level: level 1 blocks 60% of bots and 0.1% of users, level 2 (the default) 80% and 0.5%, level 3 92% and 2%, level 4 98% and 6%. Higher levels cost more CPU per request, up to 4 times level 1. Under attack mode blocks 99% of bots and 1% of users and adds 40 ms.

**Related:** [DDoS (distributed denial of service)](#ddos-distributed-denial-of-service), [Credential stuffing](#credential-stuffing), [ReDoS (regular expression denial of service)](#redos-regular-expression-denial-of-service), [Rate limiting](#rate-limiting)

**Learn more:** [Cloudflare Learning Center: What is a WAF?](https://www.cloudflare.com/learning/ddos/glossary/web-application-firewall-waf/) · [OWASP CRS: Paranoia Levels](https://coreruleset.org/docs/2-how-crs-works/2-2-paranoia_levels/) · [OWASP: Web Application Firewall](https://owasp.org/www-community/Web_Application_Firewall)

## Write-through cache

A caching policy in which every write goes to the cache and the database together, so the cache always holds the latest value for the keys written through it. Reads hit more often and are never stale for those keys, but each write is slower and the cache fills with data that may never be read. Cache-aside and write-behind are the common alternatives.

**In the game:** Write-through is designed as a Cache strategy but not in the game yet. Today a Cache works like cache-aside with invalidation: writes pass through to the Database and invalidate keys, so its hit ratio falls by twice the write share, at most by half. Between invalidations some hits are stale, from 0.5% to 10% per unit of write share as the TTL grows from 10 s to 1 hour.

**Design:** [Cache strategies](./07-data-tier.md#strategies-a-tradeoff-card).

**Related:** [Cache-aside](#cache-aside), [Cache hit rate](#cache-hit-rate), [Eventual consistency](#eventual-consistency), [Cache stampede](#cache-stampede)

**Learn more:** [Amazon ElastiCache docs: Caching strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html) · [Wikipedia: Cache write policies](<https://en.wikipedia.org/wiki/Cache_(computing)#Writing_policies>)
