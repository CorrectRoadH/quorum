/* The engineering glossary (docs/gdd/glossary.md), shipped in the Glossary panel. `glossary.test.ts` keeps the two in sync. */

export type GlossaryEntry = Readonly<{
  id: string
  term: string
  definition: string
  inGame: string
}>

export const GLOSSARY: ReadonlyArray<GlossaryEntry> = [
  {
    id: 'apdex',
    term: 'Apdex',
    definition:
      'A score from 0 to 1 for user satisfaction with response time: satisfied requests (under a target T) count fully, tolerating requests (under 4T) count half, the rest count zero.',
    inGame: 'revenue and user growth (Simulation).',
  },
  {
    id: 'async-io',
    term: 'Async I/O',
    definition:
      'A way to wait for the network or disk without holding a thread, so one thread can serve many waiting requests.',
    inGame: 'event loops and green threads.',
  },
  {
    id: 'at-least-once-delivery',
    term: 'At-least-once delivery',
    definition:
      'A messaging guarantee: no message is lost, and some messages arrive twice. Consumers must be idempotent.',
    inGame: 'Delivery semantics.',
  },
  {
    id: 'backpressure',
    term: 'Backpressure',
    definition:
      'A signal from a slow consumer that tells producers to slow down, instead of letting a queue grow without limit.',
    inGame: 'Queue max length (Components).',
  },
  {
    id: 'bcrypt',
    term: 'Bcrypt',
    definition:
      'A password hashing function designed to be slow, with a tunable cost. Slowness protects stored passwords and costs CPU on every login.',
    inGame: 'the `login` kind (Simulation).',
  },
  {
    id: 'blast-radius',
    term: 'Blast radius',
    definition: 'How much of a system one failure affects.',
    inGame: 'per runtime (Runtimes) and per deploy strategy (Components).',
  },
  {
    id: 'blue-green-deployment',
    term: 'Blue-green deployment',
    definition:
      'Running two full environments and switching traffic from the old one to the new one at once, with instant rollback.',
    inGame: 'CI/CD Pipeline.',
  },
  {
    id: 'brookss-law',
    term: "Brooks's law",
    definition:
      '"Adding manpower to a late software project makes it later." Communication overhead grows faster than headcount.',
    inGame: 'Coordination.',
  },
  {
    id: 'bulkhead',
    term: 'Bulkhead',
    definition:
      "A limit on how much of a caller's capacity one dependency can use, so one slow dependency cannot exhaust it.",
    inGame: 'Links.',
  },
  {
    id: 'cache-aside',
    term: 'Cache-aside',
    definition:
      'The application reads from the cache, and on a miss reads from the database and fills the cache.',
    inGame: 'Cache strategies.',
  },
  {
    id: 'cache-stampede',
    term: 'Cache stampede',
    definition:
      'Many requests miss the same cache key at the same time and overload the database together.',
    inGame: 'Stampedes, incident.',
  },
  {
    id: 'canary-deployment',
    term: 'Canary deployment',
    definition:
      'Sending a small share of traffic to a new version and checking it before sending the rest.',
    inGame: 'CI/CD Pipeline.',
  },
  {
    id: 'cdc-change-data-capture',
    term: 'CDC (change data capture)',
    definition: "Reading a database's change log and publishing each change as an event.",
    inGame: 'CDC Connector.',
  },
  {
    id: 'circuit-breaker',
    term: 'Circuit breaker',
    definition:
      'A switch on a call path that stops calls to a failing dependency for a while, so callers fail fast and the dependency can recover.',
    inGame: 'Links, Retry storm.',
  },
  {
    id: 'cold-start',
    term: 'Cold start',
    definition: 'The delay when a new process or function instance starts before it can serve.',
    inGame: 'Serverless Function, Runtime behaviors.',
  },
  {
    id: 'connection-pooling',
    term: 'Connection pooling',
    definition: 'Sharing a small number of database connections among many clients.',
    inGame: 'Connection Pooler.',
  },
  {
    id: 'consistent-hashing',
    term: 'Consistent hashing',
    definition:
      'A way to map keys to servers so that adding or removing a server moves only a small share of keys.',
    inGame: 'a Load Balancer algorithm.',
  },
  {
    id: 'conways-law',
    term: "Conway's law",
    definition: 'Organizations design systems that copy their communication structure.',
    inGame: 'Services.',
  },
  {
    id: 'dora-metrics',
    term: 'DORA metrics',
    definition:
      'Five measures of software delivery from the DORA research program: deploy frequency, lead time for changes, change failure rate, failed deployment recovery time (formerly time to restore service), and rework rate.',
    inGame: 'Deploy frequency.',
  },
  {
    id: 'egress',
    term: 'Egress',
    definition: 'Data leaving a cloud network, which cloud providers charge for.',
    inGame: 'Egress.',
  },
  {
    id: 'error-budget',
    term: 'Error budget',
    definition:
      'The amount of failure an SLO allows. Teams spend it on risk, such as faster releases.',
    inGame: 'SLOs and error budgets.',
  },
  {
    id: 'event-loop',
    term: 'Event loop',
    definition:
      'A single thread that runs callbacks one at a time when their I/O is ready. It serves many waiting connections, and any long-running callback blocks all of them.',
    inGame: 'Event loops and blocking.',
  },
  {
    id: 'eventual-consistency',
    term: 'Eventual consistency',
    definition: 'Replicas may return old data for a while, and they converge if writes stop.',
    inGame: 'Wide-column Store.',
  },
  {
    id: 'fallacies-of-distributed-computing',
    term: 'Fallacies of distributed computing',
    definition:
      'Eight false assumptions about networks, collected by L. Peter Deutsch and others at Sun: the network is reliable, latency is zero, bandwidth is infinite, the network is secure, topology does not change, there is one administrator, transport cost is zero, and the network is homogeneous.',
    inGame: 'the "Fallacies" achievement (Challenges).',
  },
  {
    id: 'fan-out',
    term: 'Fan-out',
    definition: 'One request that becomes many requests to other services.',
    inGame: 'Fan-out.',
  },
  {
    id: 'feature-flag',
    term: 'Feature flag',
    definition: 'A switch that turns a feature on or off at runtime, often for a share of users.',
    inGame: 'Feature Flags.',
  },
  {
    id: 'gc-pause',
    term: 'GC pause',
    definition: 'Time when a garbage collector stops or slows the application to reclaim memory.',
    inGame: 'Runtime behaviors.',
  },
  {
    id: 'gil-global-interpreter-lock',
    term: 'GIL (global interpreter lock)',
    definition:
      'A lock in CPython (and the GVL in CRuby) that lets only one thread run interpreter code at a time. Threads still overlap I/O waits, but CPU work does not run in parallel inside one process.',
    inGame: 'Concurrency models.',
  },
  {
    id: 'green-threads',
    term: 'Green threads',
    definition:
      'Lightweight threads scheduled by the runtime instead of the operating system, such as goroutines, Java virtual threads, and Erlang processes.',
    inGame: 'Concurrency models.',
  },
  {
    id: 'health-check',
    term: 'Health check',
    definition: 'A periodic probe that decides whether a server should receive traffic.',
    inGame: 'Load Balancer.',
  },
  {
    id: 'hedged-request',
    term: 'Hedged request',
    definition:
      'Sending a second copy of a slow request to another replica and using whichever answer arrives first.',
    inGame: 'research `hedged-requests` (Progression).',
  },
  {
    id: 'hot-key',
    term: 'Hot key',
    definition:
      'A key that receives a very large share of traffic, which overloads the one server that owns it.',
    inGame: 'Partitioning.',
  },
  {
    id: 'idempotency',
    term: 'Idempotency',
    definition:
      'An operation is idempotent when doing it twice has the same effect as doing it once. Idempotency keys let a server detect a retry.',
    inGame: 'Payment Provider.',
  },
  {
    id: 'jit-warmup',
    term: 'JIT warmup',
    definition:
      'The time a just-in-time compiler needs to compile hot code before a process reaches full speed.',
    inGame: 'Runtime behaviors.',
  },
  {
    id: 'littles-law',
    term: "Little's law",
    definition:
      'In a stable system, the average number of items inside equals the arrival rate times the average time each item stays: L = \u03bbW.',
    inGame: 'The latency coupling.',
  },
  {
    id: 'load-shedding',
    term: 'Load shedding',
    definition: 'Rejecting some requests on purpose during overload, so the rest succeed.',
    inGame: 'Mitigation toolbox.',
  },
  {
    id: 'memory-leak',
    term: 'Memory leak',
    definition:
      'Memory that a long-running process keeps but no longer uses, so its memory grows with uptime.',
    inGame: 'Runtime behaviors.',
  },
  {
    id: 'metastable-failure',
    term: 'Metastable failure',
    definition:
      'An overload that keeps itself going after its trigger is gone, often because of retries.',
    inGame: 'Retry storm.',
  },
  {
    id: 'mttr',
    term: 'MTTR',
    definition: 'Mean time to restore service after an incident.',
    inGame: 'The incident loop.',
  },
  {
    id: 'n1-query',
    term: 'N+1 query',
    definition:
      "Loading a list with one query and then each item's related data with one more query per item, often caused by an ORM's lazy loading.",
    inGame: 'Frameworks.',
  },
  {
    id: 'oltp-and-olap',
    term: 'OLTP and OLAP',
    definition:
      'Online transaction processing (many small reads and writes) and online analytical processing (few large scans). They need different storage.',
    inGame: 'Data Warehouse.',
  },
  {
    id: 'percentile-p50-p95-p99',
    term: 'Percentile (p50, p95, p99)',
    definition:
      'The value under which a given share of measurements fall. The p99 latency is the latency that 99% of requests beat.',
    inGame: 'Percentiles.',
  },
  {
    id: 'power-of-two-choices',
    term: 'Power of two choices',
    definition:
      'A load balancing method: pick two servers at random and send to the less loaded one.',
    inGame: 'Load Balancer.',
  },
  {
    id: 'process-per-request',
    term: 'Process per request',
    definition:
      'A server model in which each request occupies a whole process until it finishes, as in PHP-FPM.',
    inGame: 'Concurrency models.',
  },
  {
    id: 'quorum',
    term: 'Quorum',
    definition:
      'The number of replicas that must take part in a read or write. With N replicas, read quorum R, and write quorum W, R + W > N means every read asks at least one replica that acknowledged the latest write. That is not linearizability: concurrent writes and sloppy quorums can still return old values.',
    inGame: 'Wide-column Store.',
  },
  {
    id: 'raft',
    term: 'Raft',
    definition:
      'A consensus algorithm in which a leader replicates a log to a majority of nodes before a write commits.',
    inGame: 'Distributed SQL.',
  },
  {
    id: 'rate-limiting',
    term: 'Rate limiting',
    definition:
      'Capping how many requests a client can make in a period, often with a token bucket.',
    inGame: 'API Gateway.',
  },
  {
    id: 'read-your-writes-consistency',
    term: 'Read-your-writes consistency',
    definition: 'A guarantee that a user always sees their own recent writes.',
    inGame: 'Read Replica.',
  },
  {
    id: 'replication-lag',
    term: 'Replication lag',
    definition: 'The delay between a write on a primary database and its arrival on a replica.',
    inGame: 'Read Replica.',
  },
  {
    id: 'retry-with-backoff-and-jitter',
    term: 'Retry with backoff and jitter',
    definition:
      'Waiting longer after each failed attempt, with a random spread, so that clients do not retry together.',
    inGame: 'Retries.',
  },
  {
    id: 'rpo-and-rto',
    term: 'RPO and RTO',
    definition:
      'Recovery point objective (how much recent data can be lost) and recovery time objective (how long recovery can take).',
    inGame: 'Multi-region data, the IPO checklist.',
  },
  {
    id: 'rule-of-40',
    term: 'Rule of 40',
    definition:
      'A heuristic for software companies: revenue growth rate plus profit margin should be at least 40%.',
    inGame: 'Valuation.',
  },
  {
    id: 'sharding',
    term: 'Sharding',
    definition: 'Splitting data across several databases by a key.',
    inGame: 'Partitioning.',
  },
  {
    id: 'shared-nothing',
    term: 'Shared nothing',
    definition:
      'A design in which each request or node shares no memory with others. PHP-FPM requests are shared nothing: each starts clean.',
    inGame: 'Runtime behaviors.',
  },
  {
    id: 'slo-sla-sli',
    term: 'SLO, SLA, SLI',
    definition:
      'A service level indicator is a measurement, such as availability. A service level objective is a target for it. A service level agreement is a contract with penalties.',
    inGame: 'SLOs and error budgets.',
  },
  {
    id: 'spot-instance',
    term: 'Spot instance',
    definition:
      'Spare cloud capacity sold at a discount that the provider can reclaim with short notice.',
    inGame: 'Pricing models.',
  },
  {
    id: 'strangler-pattern',
    term: 'Strangler pattern',
    definition:
      'Replacing a system piece by piece by routing more traffic to the new version over time.',
    inGame: 'Migrations.',
  },
  {
    id: 'tail-at-scale',
    term: 'Tail at scale',
    definition:
      'When a request fans out to many servers, the slowest server decides its latency, so rare slowness on each server becomes common slowness overall. From Dean and Barroso (2013).',
    inGame: 'Percentiles.',
  },
  {
    id: 'tech-debt',
    term: 'Tech debt',
    definition: 'Shortcuts in code that make later changes slower until someone repays them.',
    inGame: 'Tech debt.',
  },
  {
    id: 'thundering-herd',
    term: 'Thundering herd',
    definition:
      'Many clients waking up and acting at the same moment, for example reconnecting after a restart.',
    inGame: 'Realtime Hub.',
  },
  {
    id: 'token-bucket',
    term: 'Token bucket',
    definition:
      'A rate limiting method: tokens refill at a fixed rate, and each request takes one.',
    inGame: 'API Gateway.',
  },
  {
    id: 'transactional-outbox',
    term: 'Transactional outbox',
    definition:
      'Writing a change and an event about it in the same database transaction, then publishing the event later.',
    inGame: 'Keeping copies in sync.',
  },
  {
    id: 'utilization',
    term: 'Utilization',
    definition:
      "The share of a resource's capacity in use. Queueing delay rises sharply as utilization approaches 100%.",
    inGame: 'Capacity, utilization, and queues.',
  },
  {
    id: 'vertical-and-horizontal-scaling',
    term: 'Vertical and horizontal scaling',
    definition: 'Vertical scaling makes one machine bigger. Horizontal scaling adds more machines.',
    inGame: 'Vertical and horizontal.',
  },
  {
    id: 'write-through-cache',
    term: 'Write-through cache',
    definition:
      'Every write goes to the cache and the database together, so cached reads are never stale for those keys.',
    inGame: 'Cache strategies.',
  },
]
