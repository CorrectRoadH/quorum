/** Chinese engineering glossary, keyed by the English presentation copy. */
export const glossaryZhCN: Readonly<Record<string, string>> = {
  'A score from 0 to 1 for user satisfaction with response time: satisfied requests (under a target T) count fully, tolerating requests (under 4T) count half, the rest count zero.':
    '衡量用户对响应时间满意度的 0 至 1 分数：满意的请求（耗时低于目标 T）计 1 分，可容忍的请求（低于 4T）计半分，其余计 0 分。',
  'revenue and user growth (Simulation).': '影响收入和用户增长（模拟）。',
  'Async I/O': '异步 I/O',
  'A way to wait for the network or disk without holding a thread, so one thread can serve many waiting requests.':
    '等待网络或磁盘时不占住线程，让一个线程能够处理多个正在等待的请求。',
  'event loops and green threads.': '事件循环与绿色线程。',
  'At-least-once delivery': '至少一次投递',
  'A messaging guarantee: no message is lost, and some messages arrive twice. Consumers must be idempotent.':
    '保证消息不丢失，但部分消息可能重复到达。消费者必须具备幂等性。',
  'Delivery semantics.': '投递语义。',
  Backpressure: '背压',
  'A signal from a slow consumer that tells producers to slow down, instead of letting a queue grow without limit.':
    '慢消费者向生产者发出减速信号，避免队列无限增长。',
  'Queue max length (Components).': '队列最大长度（组件）。',
  'A password hashing function designed to be slow, with a tunable cost. Slowness protects stored passwords and costs CPU on every login.':
    '一种刻意设计得较慢、成本可调的密码哈希算法。较慢的计算保护了已存储的密码，但每次登录都会消耗 CPU。',
  'the `login` kind (Simulation).': '登录请求类型（模拟）。',
  'Blast radius': '故障影响范围',
  'How much of a system one failure affects.': '一次故障会影响系统的多大范围。',
  'per runtime (Runtimes) and per deploy strategy (Components).': '各运行时以及各部署策略。',
  'Blue-green deployment': '蓝绿部署',
  'Running two full environments and switching traffic from the old one to the new one at once, with instant rollback.':
    '同时运行两套完整环境，一次性将流量从旧环境切到新环境，并支持立即回滚。',
  'CI/CD Pipeline.': 'CI/CD 流水线。',
  "Brooks's law": '布鲁克斯定律',
  '"Adding manpower to a late software project makes it later." Communication overhead grows faster than headcount.':
    '“向已经延期的软件项目增加人手，只会让它更晚。”沟通开销的增长速度超过人数的增长速度。',
  'Coordination.': '团队协调。',
  Bulkhead: '舱壁隔离',
  "A limit on how much of a caller's capacity one dependency can use, so one slow dependency cannot exhaust it.":
    '限制单个依赖能占用的调用方容量，避免一个缓慢的依赖耗尽全部资源。',
  'Links.': '连线。',
  'Cache-aside': '旁路缓存',
  'The application reads from the cache, and on a miss reads from the database and fills the cache.':
    '应用先读取缓存，未命中时读取数据库，再填充缓存。',
  'Cache strategies.': '缓存策略。',
  'Cache stampede': '缓存击穿',
  'Many requests miss the same cache key at the same time and overload the database together.':
    '大量请求同时未命中同一个缓存键，共同压垮数据库。',
  'Stampedes, incident.': '缓存击穿故障。',
  'Canary deployment': '金丝雀部署',
  'Sending a small share of traffic to a new version and checking it before sending the rest.':
    '先把少量流量发送到新版本，检查通过后再切换剩余流量。',
  'CDC (change data capture)': 'CDC（变更数据捕获）',
  "Reading a database's change log and publishing each change as an event.":
    '读取数据库变更日志，将每次变更发布为事件。',
  'CDC Connector.': 'CDC 连接器。',
  'Circuit breaker': '熔断器',
  'A switch on a call path that stops calls to a failing dependency for a while, so callers fail fast and the dependency can recover.':
    '在调用路径上暂时停止访问故障依赖，让调用方快速失败，也让依赖有机会恢复。',
  'Links, Retry storm.': '连线与重试风暴。',
  'Cold start': '冷启动',
  'The delay when a new process or function instance starts before it can serve.':
    '新进程或函数实例启动后，在能够处理请求之前所需的时间。',
  'Serverless Function, Runtime behaviors.': '无服务器函数与运行时行为。',
  'Connection pooling': '连接池技术',
  'Sharing a small number of database connections among many clients.':
    '让多个客户端共用少量数据库连接。',
  'Connection Pooler.': '连接池。',
  'Consistent hashing': '一致性哈希',
  'A way to map keys to servers so that adding or removing a server moves only a small share of keys.':
    '将键映射到服务器的方法，增删服务器时只需迁移少量键。',
  'a Load Balancer algorithm.': '一种负载均衡算法。',
  "Conway's law": '康威定律',
  'Organizations design systems that copy their communication structure.':
    '组织设计出的系统结构，会反映其沟通结构。',
  'Services.': '服务。',
  'DORA metrics': 'DORA 指标',
  'Five measures of software delivery from the DORA research program: deploy frequency, lead time for changes, change failure rate, failed deployment recovery time (formerly time to restore service), and rework rate.':
    'DORA 研究计划的软件交付五项指标：部署频率、变更前置时间、变更失败率、失败部署恢复时间（原服务恢复时间）和返工率。',
  'Deploy frequency.': '部署频率。',
  Egress: '出站流量',
  'Data leaving a cloud network, which cloud providers charge for.':
    '离开云网络的数据，云服务商通常按量收费。',
  'Egress.': '出站流量。',
  'Error budget': '错误预算',
  'The amount of failure an SLO allows. Teams spend it on risk, such as faster releases.':
    'SLO 允许的故障额度。团队可以用它承担风险，例如加快发布。',
  'SLOs and error budgets.': 'SLO 与错误预算。',
  'Event loop': '事件循环',
  'A single thread that runs callbacks one at a time when their I/O is ready. It serves many waiting connections, and any long-running callback blocks all of them.':
    '单个线程在 I/O 就绪后逐个执行回调，可以处理大量等待中的连接，但任何长时间运行的回调都会阻塞其他回调。',
  'Event loops and blocking.': '事件循环与阻塞。',
  'Eventual consistency': '最终一致性',
  'Replicas may return old data for a while, and they converge if writes stop.':
    '副本可能暂时返回旧数据；如果停止写入，它们最终会收敛到一致状态。',
  'Wide-column Store.': '宽列存储。',
  'Fallacies of distributed computing': '分布式计算谬误',
  'Eight false assumptions about networks, collected by L. Peter Deutsch and others at Sun: the network is reliable, latency is zero, bandwidth is infinite, the network is secure, topology does not change, there is one administrator, transport cost is zero, and the network is homogeneous.':
    'Sun 的研究者总结的八个错误假设：网络可靠、延迟为零、带宽无限、网络安全、拓扑不变、只有一个管理员、传输成本为零、网络同构。',
  'the "Fallacies" achievement (Challenges).': '挑战中的“谬误”成就。',
  'Fan-out': '扇出',
  'One request that becomes many requests to other services.':
    '一个请求衍生出多个发往其他服务的请求。',
  'Fan-out.': '扇出。',
  'Feature flag': '功能开关',
  'A switch that turns a feature on or off at runtime, often for a share of users.':
    '在运行时启用或禁用功能的开关，通常可以只面向部分用户。',
  'Feature Flags.': '功能开关。',
  'GC pause': '垃圾回收停顿',
  'Time when a garbage collector stops or slows the application to reclaim memory.':
    '垃圾回收器为回收内存而暂停或拖慢应用的时间。',
  'Runtime behaviors.': '运行时行为。',
  'GIL (global interpreter lock)': 'GIL（全局解释器锁）',
  'A lock in CPython (and the GVL in CRuby) that lets only one thread run interpreter code at a time. Threads still overlap I/O waits, but CPU work does not run in parallel inside one process.':
    'CPython 中的一把锁（CRuby 中对应 GVL），每次只允许一个线程执行解释器代码。线程仍可并行等待 I/O，但单进程内的 CPU 工作无法并行。',
  'Concurrency models.': '并发模型。',
  'Green threads': '绿色线程',
  'Lightweight threads scheduled by the runtime instead of the operating system, such as goroutines, Java virtual threads, and Erlang processes.':
    '由运行时而非操作系统调度的轻量线程，例如 goroutine、Java 虚拟线程和 Erlang 进程。',
  'Health check': '健康检查',
  'A periodic probe that decides whether a server should receive traffic.':
    '定期探测服务器是否适合接收流量。',
  'Load Balancer.': '负载均衡器。',
  'Hedged request': '对冲请求',
  'Sending a second copy of a slow request to another replica and using whichever answer arrives first.':
    '将慢请求的副本发送到另一个副本节点，使用最先返回的结果。',
  'research `hedged-requests` (Progression).': '进阶研究：对冲请求。',
  'Hot key': '热点键',
  'A key that receives a very large share of traffic, which overloads the one server that owns it.':
    '接收了大量流量的键，导致负责它的服务器过载。',
  'Partitioning.': '数据分区。',
  Idempotency: '幂等性',
  'An operation is idempotent when doing it twice has the same effect as doing it once. Idempotency keys let a server detect a retry.':
    '执行两次与执行一次效果相同的操作具有幂等性。幂等键帮助服务器识别重试。',
  'Payment Provider.': '支付服务。',
  'JIT warmup': 'JIT 预热',
  'The time a just-in-time compiler needs to compile hot code before a process reaches full speed.':
    '即时编译器编译热点代码、使进程达到全速所需的时间。',
  "Little's law": '利特尔定律',
  'In a stable system, the average number of items inside equals the arrival rate times the average time each item stays: L = λW.':
    '稳定系统中，系统内平均任务数等于到达速率乘以平均停留时间：L = λW。',
  'The latency coupling.': '延迟耦合。',
  'Load shedding': '负载卸载',
  'Rejecting some requests on purpose during overload, so the rest succeed.':
    '过载时主动拒绝部分请求，让其余请求能够成功。',
  'Mitigation toolbox.': '故障缓解工具。',
  'Memory leak': '内存泄漏',
  'Memory that a long-running process keeps but no longer uses, so its memory grows with uptime.':
    '长期运行的进程持有不再使用的内存，导致内存占用随运行时间增长。',
  'Metastable failure': '亚稳态故障',
  'An overload that keeps itself going after its trigger is gone, often because of retries.':
    '触发因素消失后仍会自我维持的过载状态，常由重试引起。',
  'Retry storm.': '重试风暴。',
  'Mean time to restore service after an incident.': '故障后恢复服务所需的平均时间。',
  'The incident loop.': '故障处理循环。',
  'N+1 query': 'N+1 查询',
  "Loading a list with one query and then each item's related data with one more query per item, often caused by an ORM's lazy loading.":
    '用一次查询加载列表，再为每个条目各查询一次关联数据，通常由 ORM 的懒加载导致。',
  'Frameworks.': '框架。',
  'OLTP and OLAP': 'OLTP 与 OLAP',
  'Online transaction processing (many small reads and writes) and online analytical processing (few large scans). They need different storage.':
    '在线事务处理是大量小规模读写；在线分析处理是少量大范围扫描。两者需要不同的存储方式。',
  'Data Warehouse.': '数据仓库。',
  'Percentile (p50, p95, p99)': '百分位数（p50、p95、p99）',
  'The value under which a given share of measurements fall. The p99 latency is the latency that 99% of requests beat.':
    '一定比例的测量值低于的数值。p99 延迟表示 99% 请求的延迟都不超过它。',
  'Percentiles.': '百分位数。',
  'Power of two choices': '随机二选一',
  'A load balancing method: pick two servers at random and send to the less loaded one.':
    '一种负载均衡方法：随机选两台服务器，将请求发给负载更低的一台。',
  'Process per request': '每请求独占进程',
  'A server model in which each request occupies a whole process until it finishes, as in PHP-FPM.':
    '每个请求在完成前一直占用整个进程的服务器模型，例如 PHP-FPM。',
  'The number of replicas that must take part in a read or write. With N replicas, read quorum R, and write quorum W, R + W > N means every read asks at least one replica that acknowledged the latest write. That is not linearizability: concurrent writes and sloppy quorums can still return old values.':
    '读写操作必须参与的副本数量。共 N 个副本，读法定人数为 R、写法定人数为 W 时，R + W > N 保证读取至少询问一个确认过最新写入的副本。但这不等于线性一致性：并发写入和宽松法定人数仍可能返回旧值。',
  'A consensus algorithm in which a leader replicates a log to a majority of nodes before a write commits.':
    '一种共识算法：主节点将日志复制到多数节点后，写入才能提交。',
  'Distributed SQL.': '分布式 SQL。',
  'Rate limiting': '限流',
  'Capping how many requests a client can make in a period, often with a token bucket.':
    '限制客户端在一段时间内的请求数量，常通过令牌桶实现。',
  'API Gateway.': 'API 网关。',
  'Read-your-writes consistency': '读己之写一致性',
  'A guarantee that a user always sees their own recent writes.':
    '保证用户始终能读到自己最近写入的数据。',
  'Read Replica.': '只读副本。',
  'Replication lag': '复制滞后',
  'The delay between a write on a primary database and its arrival on a replica.':
    '主数据库完成写入到副本收到该写入之间的延迟。',
  'Retry with backoff and jitter': '带退避和抖动的重试',
  'Waiting longer after each failed attempt, with a random spread, so that clients do not retry together.':
    '每次失败后等待更长时间，并加入随机偏移，避免客户端同时重试。',
  'Retries.': '重试。',
  'RPO and RTO': 'RPO 与 RTO',
  'Recovery point objective (how much recent data can be lost) and recovery time objective (how long recovery can take).':
    '恢复点目标表示允许丢失多少近期数据；恢复时间目标表示恢复最多可以耗时多久。',
  'Multi-region data, the IPO checklist.': '多区域数据与上市清单。',
  'Rule of 40': '40 法则',
  'A heuristic for software companies: revenue growth rate plus profit margin should be at least 40%.':
    '软件公司的经验准则：收入增长率加利润率应至少达到 40%。',
  'Valuation.': '估值。',
  Sharding: '分片',
  'Splitting data across several databases by a key.': '按键将数据拆分到多个数据库。',
  'Shared nothing': '无共享架构',
  'A design in which each request or node shares no memory with others. PHP-FPM requests are shared nothing: each starts clean.':
    '每个请求或节点都不与其他请求或节点共享内存。PHP-FPM 请求相互独立，每次从干净状态开始。',
  'SLO, SLA, SLI': 'SLO、SLA、SLI',
  'A service level indicator is a measurement, such as availability. A service level objective is a target for it. A service level agreement is a contract with penalties.':
    '服务水平指标是可用性等测量值；服务水平目标是指标应达到的目标；服务水平协议是包含违约责任的合同。',
  'Spot instance': '竞价实例',
  'Spare cloud capacity sold at a discount that the provider can reclaim with short notice.':
    '云厂商折价出售的闲置容量，可在短暂通知后收回。',
  'Pricing models.': '定价模型。',
  'Strangler pattern': '绞杀者模式',
  'Replacing a system piece by piece by routing more traffic to the new version over time.':
    '逐步将更多流量路由到新版本，分块替换旧系统。',
  'Migrations.': '迁移。',
  'Tail at scale': '大规模系统的尾延迟',
  'When a request fans out to many servers, the slowest server decides its latency, so rare slowness on each server becomes common slowness overall. From Dean and Barroso (2013).':
    '一个请求扇出到多台服务器时，最慢的服务器决定整体延迟，因此单台服务器偶发的慢响应会变成整体常见的慢响应。出自 Dean 与 Barroso（2013）。',
  'Tech debt': '技术债',
  'Shortcuts in code that make later changes slower until someone repays them.':
    '代码中的捷径，在有人偿还之前会持续拖慢后续修改。',
  'Tech debt.': '技术债。',
  'Thundering herd': '惊群',
  'Many clients waking up and acting at the same moment, for example reconnecting after a restart.':
    '大量客户端同时醒来并行动，例如重启后同时重连。',
  'Realtime Hub.': '实时通信中心。',
  'Token bucket': '令牌桶',
  'A rate limiting method: tokens refill at a fixed rate, and each request takes one.':
    '一种限流方法：令牌以固定速率补充，每个请求消耗一个令牌。',
  'Transactional outbox': '事务发件箱',
  'Writing a change and an event about it in the same database transaction, then publishing the event later.':
    '在同一个数据库事务中写入数据变更及其事件，随后再发布事件。',
  'Keeping copies in sync.': '保持副本同步。',
  Utilization: '利用率',
  "The share of a resource's capacity in use. Queueing delay rises sharply as utilization approaches 100%.":
    '资源容量中正在使用的比例。利用率接近 100% 时，排队延迟会急剧上升。',
  'Capacity, utilization, and queues.': '容量、利用率与队列。',
  'Vertical and horizontal scaling': '纵向与横向扩容',
  'Vertical scaling makes one machine bigger. Horizontal scaling adds more machines.':
    '纵向扩容提高单台机器的规格；横向扩容增加机器数量。',
  'Vertical and horizontal.': '纵向与横向扩容。',
  'Write-through cache': '直写缓存',
  'Every write goes to the cache and the database together, so cached reads are never stale for those keys.':
    '每次写入同时更新缓存和数据库，保证这些键的缓存读取不会过时。',
  Drift: '漂移',
  'The difference between the infrastructure a tool such as Terraform or Pulumi last deployed and what runs now. Drift comes from changes made outside the tool, such as a resize in a cloud console, and from code changes that are not applied yet.':
    'Terraform 或 Pulumi 等工具上次部署的基础设施与当前实际运行状态之间的差异。漂移来自工具之外的变更（例如在云控制台中调整规格），以及尚未应用的代码变更。',
  'A Mirror drifts in two ways: it is behind when its source region changed, and it has a hand change when you changed the Mirror directly. Apply brings the Mirror back to its source and reverts the hand changes its plan sees. Terraform plans see every hand change at once. Pulumi and Alchemy plan against the state they recorded, so a hand change shows only after Refresh or Check drift. Keep a correct regional difference as an override.':
    '镜像有两种漂移：源区域变更后它会落后；你直接修改镜像则产生手动变更。应用会让镜像回到源区域的状态，并还原计划看到的手动变更。Terraform 的计划会立即看到所有手动变更。Pulumi 和 Alchemy 与其记录的状态比较，因此手动变更只有在刷新或检查漂移之后才会显示。把合理的区域差异保留为覆盖项。',
  'IaC tool': 'IaC 工具',
  'A tool that describes infrastructure as code and applies it: it compares the code with the recorded state, shows a plan, and makes the changes. Terraform uses HCL; Pulumi and Alchemy use general-purpose languages such as TypeScript. Each keeps a state file of what it deployed.':
    '以代码描述基础设施并加以应用的工具：它将代码与已记录的状态比较，展示计划，然后执行变更。Terraform 使用 HCL；Pulumi 和 Alchemy 使用 TypeScript 等通用语言。每个工具都会保存一份已部署内容的状态文件。',
  "Infrastructure as code Research asks you to pick Terraform, Pulumi, or Alchemy. All three build every Component and can set any value per region. They differ in how a plan finds hand changes, as in each tool's default workflow: Terraform refreshes live state on every plan, so its plans are complete and each Apply waits for the refresh. Pulumi plans against its recorded state until you Refresh. Alchemy also plans against recorded state; Check drift reads live state, and Repair restores hand changes without taking source changes. Moving to another tool stops every sync for a calendar day.":
    '“基础设施即代码”研究会让你选择 Terraform、Pulumi 或 Alchemy。三者都能构建所有组件，并能为每个区域设置任意值。它们的区别在于计划如何发现手动变更，与各工具的默认工作流一致：Terraform 每次计划都会读取实时状态，因此计划完整，每次应用都要等待刷新。Pulumi 与已记录的状态比较，直到你刷新。Alchemy 同样与已记录的状态比较；检查漂移会读取实时状态，修复会还原手动变更但不采用源区域的变更。更换工具会让所有同步暂停一个日历日。',
  Mirror: '镜像',
  'Running the same infrastructure code in another region, such as one Terraform module applied once per region or a CloudFormation StackSet. The servers copy easily. The data does not: each copy must decide where its writes go.':
    '在另一个区域运行同一份基础设施代码，例如每个区域各应用一次的 Terraform 模块，或 CloudFormation StackSet。服务器很容易复制，数据却不然：每个副本都必须决定写入去向。',
  "After Infrastructure as code Research, the Mirror button beside the region tabs copies one region's Nodes and Links into another. For each Database you pick a read replica, an own primary, or calling the source, and for Object Storage, replicate or call the source. Apply pays at once and the new Nodes arrive cold after the build time. The region's Users get their Links only when the plan lands. The Mirror stays linked to its source, so it can drift; GitOps keeps it in sync on its own.":
    '完成“基础设施即代码”研究后，区域标签旁的“镜像”按钮可以把一个区域的节点和链路复制到另一个区域。每个数据库可选择只读副本、独立主库或调用源区域；对象存储可选择复制或调用源区域。应用会立即付款，新节点在构建时间结束后以冷启动状态上线。该区域的用户只有在计划落地时才会获得链路。镜像与源区域保持关联，因此可能漂移；GitOps 会自动保持同步。',
  'Terraform tutorial: Use refresh-only mode to sync Terraform state':
    'Terraform tutorial: Use refresh-only mode to sync Terraform state',
  'Pulumi docs: Detecting and reconciling drift': 'Pulumi docs: Detecting and reconciling drift',
  'Alchemy docs: drift': 'Alchemy docs: drift',
  'Terraform docs: What is Terraform?': 'Terraform docs: What is Terraform?',
  'Pulumi docs: Infrastructure as code': 'Pulumi docs: Infrastructure as code',
  'Alchemy docs: Providers': 'Alchemy docs: Providers',
  'Wikipedia: Infrastructure as code': 'Wikipedia: Infrastructure as code',
  'Terraform docs: Modules overview': 'Terraform docs: Modules overview',
  'AWS docs: Working with CloudFormation StackSets':
    'AWS docs: Working with CloudFormation StackSets',
  GitOps: 'GitOps',
  'A way to run infrastructure where the desired state lives in Git as declarative code, and an agent such as Argo CD or Flux pulls it and keeps reconciling the live system to match. OpenGitOps lists four principles: declarative, versioned and immutable, pulled automatically, and continuously reconciled.':
    '一种管理基础设施的方式：期望状态以声明式代码保存在 Git 中，由 Argo CD 或 Flux 等代理拉取，并持续让实际系统与之保持一致。OpenGitOps 列出四条原则：声明式、版本化且不可变、自动拉取、持续协调。',
  "GitOps is Series C Research after Infrastructure as code. It applies each source change to every Mirror on its own, so Mirrors stop falling behind. It also reverts hand changes at the next sync with every IaC tool, like Argo CD with self-heal on, so overrides are the only way to tune a region. All at once syncs within 3 calendar minutes, like Argo CD's default poll. Staged holds a change on the source for 60 minutes first. All at once trades drift for blast radius: a Bad config push reaches every Mirror together.":
    'GitOps 是 C 轮研究，需要先完成“基础设施即代码”。它会自动把源区域的每个变更应用到每个镜像，镜像不再落后。无论使用哪种 IaC 工具，它都会在下次同步时还原手动变更，相当于开启自愈的 Argo CD，因此覆盖项是调整区域的唯一方式。一次性同步最多在 3 个日历分钟内完成，与 Argo CD 的默认轮询一致。分阶段同步会先把变更在源区域保留 60 分钟。一次性同步以影响范围换取漂移：一次错误配置推送会同时到达所有镜像。',
  'OpenGitOps: GitOps Principles': 'OpenGitOps: GitOps Principles',
  'Argo CD docs: Automated Sync Policy': 'Argo CD docs: Automated Sync Policy',
  'Flux docs: Core Concepts': 'Flux docs: Core Concepts',
  'A marker on a time series chart for an event, such as a deploy, a configuration change, or an incident. It gives a change in a graph a visible cause.':
    '时间序列图上用于标记部署、配置变更或故障等事件的标记，让图中变化的原因清晰可见。',
  'Each time series on the Dashboard draws a dashed blue line, with a label, for each Design change that you can still undo. A red line marks the start of the open Incident. Use them to check that a line moved after your fix, and not before it.':
    '仪表盘的每张时间序列图都会用带标签的蓝色虚线，标出每次仍可撤销的架构变更；红线则标记当前故障的开始时间。用它们确认曲线是在修复后才发生变化，而不是修复前。',
  'Grafana docs: Annotate visualizations': 'Grafana 文档：为可视化图表添加注释',
  'A routing method where many servers in different places announce the same IP address. Internet routing (BGP) sends each user to the nearest of them, so users connect to a close server and a flood spreads across all of them.':
    '一种路由方式：不同地点的多台服务器宣告同一个 IP 地址。互联网路由（BGP）将用户引导至其中最近的一台，让用户连接附近的服务器，也让洪泛流量分散到所有服务器。',
  "You can research Anycast in Series C after GeoDNS. It does not change latency yet. GeoDNS is the working way to shorten the user hop: it sends each region's Users to their own region, or to the nearest region that is still up.":
    '在 C 轮完成 GeoDNS 研究后，可以研究 Anycast。它目前还不会改变延迟。要实际缩短用户的访问路径，请使用 GeoDNS：它将各区域的用户引导至本区域，或仍在运行的最近区域。',
  'Cloudflare Learning Center: What is Anycast?': 'Cloudflare 学习中心：什么是 Anycast？',
  'RFC 4786: Operation of Anycast Services': 'RFC 4786：Anycast 服务的运行',
  Wikipedia: '维基百科',
  'Application Performance Index: a score from 0 to 1 for how satisfied users are with response time. Requests faster than a target T are satisfied and count fully, requests up to 4T are tolerating and count half, and slower or failed requests count zero.':
    '应用性能指数：衡量用户对响应时间满意度的 0 至 1 分数。耗时低于目标 T 的请求视为满意，计满分；耗时不超过 4T 的请求视为可容忍，计半分；更慢或失败的请求计零分。',
  "Each Request kind has its own T: 400 ms for a page view, 200 ms for an API read, 800 ms for a login. A request earns its value times its Apdex, so a tolerating request earns half. Users grow while Apdex beats the Era's target (0.85 in Garage, up to 0.94 when Public) and leave when it falls below.":
    '每种请求都有自己的 T：页面浏览为 400 ms，API 读取为 200 ms，登录为 800 ms。每个请求的收益等于其价值乘以 Apdex，因此可容忍的请求只能赚取一半。Apdex 高于当前阶段的目标时，用户会增长；低于目标时，用户会流失。目标从车库创业阶段的 0.85 逐步提高到上市后的 0.94。',
  'New Relic docs: Apdex': 'New Relic 文档：Apdex',
  'The Apdex Users Group': 'Apdex 用户组织',
  "A way to start a network or disk operation and do other work until it completes, instead of blocking a thread while it waits. One thread can then keep many requests in flight. Node.js, .NET async, and Rust's Tokio are built on it.":
    '发起网络或磁盘操作后，在其完成前先做其他工作，而不是阻塞线程等待。这样，一个线程就能同时处理许多尚未完成的请求。Node.js、.NET async 和 Rust 的 Tokio 都以此为基础。',
  'Node.js, Kestrel (C#), and Tokio (Rust) hold no worker slot while a request waits for the Database, so a slow query does not use up their capacity. A PHP-FPM or Gunicorn worker is held for the whole wait. Async runtimes also keep Realtime connections open for a few KB each (Tokio 5 KB, Node.js 20 KB), while PHP and Gunicorn refuse them.':
    'Node.js、Kestrel（C#）和 Tokio（Rust）在请求等待数据库时不占用工作槽位，因此慢查询不会耗尽它们的处理容量。而 PHP-FPM 或 Gunicorn 的工作进程会在整个等待期间一直被占用。异步运行时还能以每条连接几 KB 的开销维持实时连接（Tokio 为 5 KB，Node.js 为 20 KB），PHP 和 Gunicorn 则会拒绝这些连接。',
  'Node.js: Blocking vs non-blocking': 'Node.js：阻塞与非阻塞',
  'Python docs: asyncio': 'Python 文档：asyncio',
  'A delivery guarantee where the system resends a message or call until it is acknowledged. Nothing is lost, but some messages arrive more than once, so consumers must be idempotent.':
    '一种投递保证：系统不断重发消息或调用，直到收到确认。消息不会丢失，但部分消息会到达多次，因此消费者必须具备幂等性。',
  "A retried call can arrive twice. In the Double charge Incident, charges time out and retry, and some customers pay twice until you research Idempotency keys or stop retries on the charge Link. In the Poison message Incident, a task that always fails keeps coming back, and Workers spend 90% of their time on it. Turn on the Queue's dead-letter queue to prevent it, or delete the message to end it.":
    '重试的调用可能到达两次。在“重复扣款”故障中，扣款超时后会重试，部分客户会被重复收费，直到你研究幂等键或关闭扣款链路的重试。在“毒消息”故障中，一项总是失败的任务不断重新出现，工作进程将 90% 的时间浪费在它身上。开启队列的死信队列可以预防，删除该消息则能结束故障。',
  'AWS docs: SQS at-least-once delivery': 'AWS 文档：SQS 至少一次投递',
  'RabbitMQ: Consumer acknowledgements': 'RabbitMQ：消费者确认',
  'RabbitMQ: Reliability guide': 'RabbitMQ：可靠性指南',
  'Adding and removing machines automatically so that capacity follows demand. A controller watches a signal such as CPU use, compares it with a target, and changes the number of copies. New capacity takes time to boot, so autoscaling follows slow changes in load well and sudden spikes badly.':
    '自动增减机器，让容量随需求变化。控制器监测 CPU 使用率等信号，将其与目标比较，再调整副本数。新增容量需要启动时间，因此自动扩缩容擅长应对负载的缓慢变化，却难以应付突然的峰值。',
  'The Autoscaler (Autoscaling Research) controls the App Servers and Workers that you link into it. When a Node runs above its target (40%, 60%, or 80% of CPU or of its whole load), it asks for more copies, up to a max of 4, 8, 16, or no limit. New copies serve after 180 s on VMs or 30 s in a Kubernetes Cluster, and they start cold. It removes one copy when load falls below 60% of the target, and it acts at most once every 30 s, so keep spare capacity for a sudden Traffic spike.':
    '自动扩缩容器（通过“自动扩缩容”研究解锁）控制你连接给它的应用服务器和工作进程。当节点超过目标值（CPU 使用率或整体负载的 40%、60% 或 80%）时，它会请求增加副本，最多可设为 4、8、16 个或不设上限。新副本在虚拟机上需 180 秒、在 Kubernetes 集群中需 30 秒才能提供服务，而且初始为冷启动状态。负载降至目标的 60% 以下时，它会移除一个副本，每 30 秒最多动作一次，因此要为突发流量预留容量。',
  'AWS: What is Amazon EC2 Auto Scaling?': 'AWS：什么是 Amazon EC2 Auto Scaling？',
  'Kubernetes: Horizontal Pod Autoscaling': 'Kubernetes：Pod 水平自动扩缩容',
  'Availability zone': '可用区',
  'An isolated data center, or group of data centers, inside a cloud region, with its own power, cooling, and network. Zones in one region are close enough for fast links, and far enough apart that one failure rarely takes down two.':
    '云区域内一个独立的数据中心或一组数据中心，拥有独立的供电、制冷和网络。同一区域的可用区距离足够近，能够高速互联，也相隔足够远，单次故障通常不会同时影响两个可用区。',
  'The game calls these Zones. After Multiple zones research, you can place each zoned Node in zone a, b, or c, and give a Database, Pooler, Cache, Search Engine, or Queue a Standby in another zone at twice its Burn. A call between zones costs 1 ms more and $0.01 per GB of Egress both ways. A Zone outage takes down every Node in one zone; a Standby takes over in about 20 s, and copies in another zone keep serving.':
    '游戏中称其为“可用区”。完成“多可用区”研究后，你可以将支持可用区的各节点放入 a、b 或 c 区，并为数据库、连接池、缓存、搜索引擎或队列配置位于另一区的备用节点，支出为原来的两倍。跨可用区调用会增加 1 ms 延迟，双向出站流量均按每 GB $0.01 收费。“可用区故障”会使一个区内的所有节点宕机；备用节点约 20 秒后接管，其他区的副本则继续提供服务。',
  'AWS: Regions and Zones': 'AWS：区域与可用区',
  "AWS Builders' Library: Static stability using Availability Zones":
    'AWS 构建者文库：利用可用区实现静态稳定性',
  'Google Cloud: Regions and zones': 'Google Cloud：区域与可用区',
  'A signal from a slow consumer that tells producers to slow down or stop, so a buffer or queue does not grow without limit. Without it, a backlog grows until memory or latency runs out.':
    '慢消费者要求生产者减速或停止的信号，避免缓冲区或队列无限增长。没有背压时，积压会不断增加，直到耗尽内存或延迟变得无法接受。',
  "The Queue's Max length is the closest thing to backpressure: past it, the Queue refuses new tasks, and the upload or export that sent one fails. With no limit, Queue depth grows when Workers drain tasks slower than they arrive. A new task waits behind the backlog, and users score an upload or export on when its result is ready: past 40 s for an upload, or 4 minutes for an export, they are frustrated. Add Workers or make them bigger to bring the depth down.":
    '队列的“最大长度”最接近背压机制：超过上限后，队列拒绝新任务，提交该任务的上传或导出请求也会失败。不设上限时，只要工作进程处理速度低于任务到达速度，队列深度就会增加。新任务必须在积压任务后面等待，而用户会按结果就绪的时间评价上传或导出：上传超过 40 秒，导出超过 4 分钟，用户就会感到沮丧。增加工作进程或提高其规格，可以降低队列深度。',
  "AWS Builders' Library: Avoiding insurmountable queue backlogs":
    'AWS 构建者文库：避免难以消化的队列积压',
  'Node.js: Backpressuring in streams': 'Node.js：流中的背压',
  'A password hashing function from 1999, based on the Blowfish cipher, with a built-in salt and a tunable cost. Each step of cost doubles the work, so stored hashes stay slow to crack as hardware gets faster. The same slowness costs server CPU on every login.':
    '一种 1999 年提出、基于 Blowfish 密码算法的 password 哈希函数，内置盐值，计算成本可调。成本每提高一级，计算量就翻倍，因此即使硬件不断变快，已存储的哈希仍难以快速破解。同样的缓慢计算也会在每次登录时消耗服务器 CPU。',
  'A login costs 80 ms of CPU for the hash, and a faster runtime does not shorten it. In the Event loop block Incident the cost goes from 10 to 12 rounds, which is 4× the CPU per login. In Credential stuffing, bots send 20× the logins. An Auth Provider (Managed identity) takes the hash off your App Servers for a per-user price.':
    '每次登录的哈希计算消耗 80 ms CPU 时间，更快的运行时也无法缩短它。在“事件循环阻塞”故障中，成本从 10 轮提高到 12 轮，每次登录的 CPU 开销变为 4 倍。在“撞库攻击”中，机器人会发起 20 倍的登录请求。认证服务商（通过“托管身份认证”解锁）可以将哈希计算从你的应用服务器移走，但会按用户收费。',
  'Provos and Mazieres: A Future-Adaptable Password Scheme (USENIX 1999)':
    'Provos 和 Mazieres：可适应未来的密码方案（USENIX 1999）',
  'OWASP: Password Storage Cheat Sheet': 'OWASP：密码存储速查表',
  'The protocol that networks on the internet use to tell each other which IP addresses they can reach. If a network withdraws its routes by mistake, the rest of the internet can no longer find it, even though its servers still run.':
    '互联网上各网络用来告知彼此能够到达哪些 IP 地址的协议。如果一个网络误撤销了路由，即使服务器仍在运行，互联网的其他部分也无法再找到它。',
  'The BGP misconfiguration Incident can start in Series C. A routing change withdraws your Company from the internet: every request from Users fails as down, in every region, for up to 120 s. No Research prevents it, and the director picks it rarely. Press Roll back on the Incident to end it at once.':
    '“BGP 配置错误”故障可能从 C 轮开始发生。一次路由变更会让你的公司从互联网上消失：所有区域中，来自用户的每个请求都会因服务不可用而失败，最长持续 120 秒。没有研究能够预防它，故障调度器也很少选择它。点击故障上的“回滚”，即可立即结束。',
  'Cloudflare Learning Center: What is BGP?': 'Cloudflare 学习中心：什么是 BGP？',
  'RFC 4271: BGP-4': 'RFC 4271：BGP-4',
  'Meta Engineering: More details about the October 4 outage':
    'Meta 工程博客：10 月 4 日故障的更多细节',
  'The share of a system, its users, or its traffic that one failure affects. Fault isolation, such as zones, cells, and small deploys, keeps the blast radius small.':
    '一次故障所影响的系统、用户或流量的范围。可用区、单元架构和小批量部署等故障隔离措施，可以缩小故障影响范围。',
  'A Zone outage takes down every Node in that zone. With Multiple zones you can spread copies across three zones and give a data Node a standby that takes over in seconds. A Bad deploy fails 8% of App Server requests for each item it shipped, up to 40%, so smaller deploys break less. On Node.js one slow request stalls every request on its event loop, while BEAM keeps each request apart.':
    '“可用区故障”会使该区的所有节点宕机。完成“多可用区”研究后，你可以将副本分布在三个可用区，并为数据节点配置能在数秒内接管的备用节点。一次“错误部署”每发布一个项目，就会使应用服务器的请求失败率增加 8%，最高 40%，所以部署批次越小，破坏越少。Node.js 的一个慢请求会拖住同一事件循环上的所有请求，而 BEAM 会将各请求彼此隔离。',
  'AWS Well-Architected: Use fault isolation': 'AWS Well-Architected：使用故障隔离',
  'AWS whitepaper: Cell-based architecture': 'AWS 白皮书：单元架构',
  'A release method with two identical production environments. You deploy the new version to the idle one, switch all traffic to it at once, and switch back if it fails, so rollback is fast.':
    '一种使用两套完全相同的生产环境的发布方式。将新版本部署到空闲环境，再一次性把全部流量切过去；出问题时再切回来，因此回滚很快。',
  'The game has no blue-green option yet. The closest is the Continuous delivery research: a deploy takes 5 minutes instead of 30, and you can roll back a Bad deploy. A rollback ends the Incident at once and puts its Features back in line for the next deploy.':
    '游戏目前还没有蓝绿部署选项。最接近的是“持续交付”研究：它将部署时间从 30 分钟缩短为 5 分钟，并允许回滚错误部署。回滚会立即结束故障，并将该次发布的功能重新放回下一次部署的队列。',
  'Martin Fowler: BlueGreenDeployment': 'Martin Fowler：蓝绿部署',
  'AWS whitepaper: Blue/Green deployments': 'AWS 白皮书：蓝绿部署',
  '"Adding manpower to a late software project makes it later," from Fred Brooks\'s 1975 book The Mythical Man-Month. New people need time to ramp up, and the paths of communication grow faster than headcount.':
    '“向已经延期的软件项目增加人手，只会让它更晚。”这句话出自 Fred Brooks 于 1975 年出版的《人月神话》。新人需要时间上手，而沟通路径的增长速度超过人数的增长速度。',
  "A Team's effective size is n / (1 + 0.08(n − 1) + 0.0004·n(n − 1)), so 8 people work like about 5, and past about 48 people a Team gets slower. A new hire also works at 30% for their first calendar week. The penalty counts inside each Team, so splitting people into up to 4 Teams helps, and Symfony lowers it by 30%.":
    '团队的有效人数为 n / (1 + 0.08(n − 1) + 0.0004·n(n − 1))，因此 8 人的效率约等于 5 人，人数超过约 48 人后，团队反而会变慢。新员工在第一个日历周也只有 30% 的工作效率。此惩罚在各团队内部单独计算，因此将人员拆分到最多 4 个团队会有所帮助，Symfony 还能将惩罚降低 30%。',
  "Wikipedia: Brooks's law": '维基百科：布鲁克斯定律',
  'Wikipedia: The Mythical Man-Month': '维基百科：人月神话',
  "A limit on how much of a caller's capacity, such as threads, connections, or slots, one dependency can use. When that dependency slows down, it fills only its own share, and calls to other dependencies keep working. The name comes from the walls that split a ship's hull into compartments.":
    '限制单个依赖能够占用的调用方资源，例如线程、连接或槽位。依赖变慢时，只会占满分给它的那部分容量，其他依赖的调用仍可正常进行。名字源于将船体分隔为多个舱室的隔墙。',
  "No bulkhead setting exists yet: one slow dependency can fill every slot. On thread and process runtimes, each call holds the caller's slot until it answers or times out, 30 s by default. The closest tools are short Link timeouts (Timeouts and retries) and Circuit breakers, which stop calls to a failing Node.":
    '游戏目前还没有舱壁隔离设置：一个缓慢的依赖就可能占满所有槽位。在线程和进程型运行时中，每次调用都会一直占用调用方的槽位，直到收到响应或超时，默认超时为 30 秒。最接近的工具是较短的链路超时（通过“超时与重试”解锁），以及会停止调用故障节点的熔断器。',
  'Azure Architecture Center: Bulkhead pattern': 'Azure 架构中心：舱壁隔离模式',
  'Wikipedia: Bulkhead (partition)': '维基百科：舱壁（隔板）',
  'How fast a service spends its error budget, relative to the SLO. A burn rate of 1 spends exactly the whole budget in the SLO window; a burn rate of 10 spends it in a tenth of the window. Teams page on a high burn rate instead of on single errors.':
    '服务相对于 SLO 消耗错误预算的速度。消耗速率为 1 时，恰好在 SLO 窗口内用完整个预算；为 10 时，只需窗口十分之一的时间就会用完。团队会在消耗速率过高时呼叫值班人员，而不是为每个错误都报警。',
  'With SLO dashboards researched, the Dashboard (D) charts the error budget burn rate over time: your failure rate divided by the share of failures the SLO allows. Lines mark 1× and 10×; above 10×, the budget is gone long before the week ends. Fix the cause or slow your deploys until the line drops below 1×.':
    '完成“SLO 仪表盘”研究后，仪表盘（D）会绘制错误预算消耗速率的时间曲线：用实际失败率除以 SLO 允许的失败比例。图中标出 1× 和 10×；超过 10× 时，预算会在一周结束很久之前就耗尽。修复原因或放慢部署，直到曲线降至 1× 以下。',
  'Google SRE workbook: Alerting on SLOs': 'Google SRE 工作手册：基于 SLO 告警',
  'Bytecode cache': '字节码缓存',
  "A cache that keeps the compiled form of a script so the interpreter does not parse and compile the source on every run. PHP's OPcache keeps precompiled bytecode in shared memory, and Python writes .pyc files for the same reason.":
    '缓存脚本编译后的形式，让解释器无需每次运行都重新解析和编译源码。PHP 的 OPcache 将预编译的字节码保存在共享内存中，Python 写入 .pyc 文件也是出于同样的原因。',
  'Without a bytecode cache, PHP compiles every script on every request. The OPcache Research (after PHP-FPM) multiplies the CPU speed of PHP App Servers by 2.5. A PHP box that restarts runs without OPcache at first and reaches the full 2.5× as it warms up.':
    '没有字节码缓存时，PHP 每次请求都会编译所有脚本。在 PHP-FPM 之后研究 OPcache，可将 PHP 应用服务器的 CPU 处理速度提高到 2.5 倍。PHP 机器重启后，起初没有 OPcache，随着预热才逐步恢复完整的 2.5 倍加速。',
  'PHP manual: OPcache': 'PHP 手册：OPcache',
  'PEP 3147: PYC repository directories': 'PEP 3147：PYC 存储目录',
  'The share of lookups that a cache answers from its own copy, without asking the slower system behind it. A miss goes to the origin or database. A small change in hit rate can change the load on the origin a lot: going from 90% to 80% doubles the misses.':
    '缓存直接用自身副本回答的查询占比，无需访问后方更慢的系统。未命中时，请求会访问源站或数据库。命中率的一点变化就可能大幅改变源站负载：从 90% 降到 80%，未命中数就会翻倍。',
  "A Cache or CDN Node shows its hit ratio on its card. A Cache's hit rate is the square root of (its memory / hot data, about 200 KB per user) × a TTL factor (60% at 10 s, 85% at 60 s, 97% at 1 h) × a write penalty of up to 50% × how warm it is. A CDN answers 70% of page and 75% of media requests at the 300 s TTL, × 0.8 at 60 s or × 1.2 at 1 h, at most 95%. Give the Cache more memory or a longer TTL to raise the rate, but a longer TTL serves more stale reads.":
    '缓存或 CDN 节点会在卡片上显示命中率。缓存的命中率为（内存 / 热数据，约每用户 200 KB）的平方根 × TTL 系数（10 秒为 60%，60 秒为 85%，1 小时为 97%）× 最高 50% 的写入惩罚系数 × 预热程度。CDN 在 TTL 为 300 秒时，可回答 70% 的页面请求和 75% 的媒体请求；TTL 为 60 秒时乘以 0.8，1 小时时乘以 1.2，最高 95%。增加缓存内存或延长 TTL 可以提高命中率，但更长的 TTL 会返回更多过期数据。',
  'Cloudflare: What is a cache hit ratio?': 'Cloudflare：什么是缓存命中率？',
  'AWS: Caching best practices': 'AWS：缓存最佳实践',
  "AWS Builders' Library: Caching challenges and strategies": 'AWS 构建者文库：缓存的挑战与策略',
  'Many requests miss the same cached data at the same moment, for example after a cache restart or an expiry, and all of them go to the database together. The extra load can slow the database so much that the cache never refills.':
    '大量请求在同一时刻未命中相同的缓存数据，例如缓存重启或过期之后，所有请求一起涌向数据库。额外负载可能使数据库慢到缓存始终无法重新填满。',
  'In the Cache stampede Incident a Cache restarts empty, and every miss goes to the Database at once. While the Database is 90% busy or more, refills time out and the Cache stays cold. Stampede protection lets a cold Cache send on only 25% of its extra misses. Cache warming brings it back 80% warm after a restart.':
    '在“缓存击穿”故障中，缓存重启后为空，所有未命中请求同时访问数据库。数据库繁忙程度达到或超过 90% 时，回填会超时，缓存持续处于冷状态。“缓存击穿保护”让冷缓存只向下游发送额外未命中请求的 25%。“缓存预热”则让缓存重启后恢复到 80% 的预热程度。',
  'Nishtala et al.: Scaling Memcache at Facebook (NSDI 2013)':
    'Nishtala 等：Facebook 的 Memcache 扩展实践（NSDI 2013）',
  'Filling a cache with likely data before it takes traffic, so that the first requests do not all miss. Teams warm a cache after a restart, a deploy, or when they add a new cache node, often by loading a snapshot or replaying recent keys.':
    '在缓存接收流量前，提前填入可能会用到的数据，避免最初的请求全部未命中。团队通常会在重启、部署或新增缓存节点后，通过加载快照或重放最近的键来预热缓存。',
  'A Cache that restarts comes back cold, and every miss goes to the database. Redis reloads half of its data by itself, and Memcached reloads none. After the Cache warming Research, you can turn on Warming on a Cache card: the Cache then comes back 80% warm after a restart or a Cache stampede. Stampede protection is the step before it and handles the misses that remain.':
    '缓存重启后会处于冷状态，每次未命中都会访问数据库。Redis 会自行重新加载一半数据，Memcached 则完全不会。完成“缓存预热”研究后，可以在缓存卡片上开启“预热”：缓存将在重启或缓存击穿后恢复到 80% 的预热程度。前置研究“缓存击穿保护”则用于处理剩余的未命中请求。',
  'Netflix TechBlog: Cache warming': 'Netflix 技术博客：缓存预热',
  'Redis docs: Persistence': 'Redis 文档：持久化',
  'A caching pattern where the application checks the cache first. On a miss it reads the database and puts the result in the cache, and on a write it updates the database and invalidates the cached entry.':
    '一种缓存模式：应用先查缓存，未命中时读取数据库并将结果放入缓存；写入时更新数据库，并使缓存条目失效。',
  'A Cache answers read queries it holds and sends misses on to the Database. Its hit ratio is √(memory / hot data) × TTL factor × warmth, with about 200 KB of hot data per user. Writes pass through and invalidate, so a write-heavy mix lowers hits. A longer TTL (10 s, 60 s, or 1 h) keeps more hits but serves more stale reads.':
    '缓存直接回答已有的读取查询，将未命中请求发送给数据库。其命中率为 √(内存 / 热数据) × TTL 系数 × 预热程度，每个用户约有 200 KB 热数据。写入会穿过缓存并使数据失效，因此写入占比高会降低命中率。更长的 TTL（10 秒、60 秒或 1 小时）可以提高命中率，但也会返回更多过期数据。',
  'Azure Architecture Center: Cache-Aside pattern': 'Azure 架构中心：旁路缓存模式',
  'A release method that sends a small share of traffic to a new version first and compares its errors and latency with the old version. If the canary looks healthy, the rollout continues; if not, it is rolled back before most users see it.':
    '一种发布方式：先将少量流量发给新版本，与旧版本比较错误率和延迟。如果金丝雀版本表现良好，就继续上线；否则，在大多数用户接触到它之前回滚。',
  'The game has no canary deploy option yet: a deploy ships to every App Server at once. The closest is a Stack migration, which moves traffic to the new Stack in steps of 5%, 25%, 50%, and 100%. The new Stack fails 3% of its requests until you pay to fix its bugs, so early steps limit the damage.':
    '游戏目前还没有金丝雀部署选项：每次部署都会同时发布到所有应用服务器。最接近的是技术栈迁移，按 5%、25%、50% 和 100% 逐步将流量迁移到新技术栈。修复缺陷需要付费；修复之前，新技术栈有 3% 的请求会失败，因此早期的小步切流可以限制损失。',
  'Martin Fowler: CanaryRelease': 'Martin Fowler：金丝雀发布',
  'Google SRE workbook: Canarying releases': 'Google SRE 工作手册：金丝雀发布',
  "Reading a database's change log, such as the PostgreSQL write-ahead log, and publishing each insert, update, and delete as an event. Other systems, such as a data warehouse or a search index, stay in sync without querying the source.":
    '读取数据库的变更日志，例如 PostgreSQL 的预写式日志，并将每次插入、更新和删除发布为事件。数据仓库或搜索索引等其他系统无需查询源数据库，就能保持同步。',
  'There is no CDC Connector yet. The closest is the Data Warehouse: App Servers send report scans to it directly, at 1.5 s and a fee per scan. Reports then stop scanning the primary Database and evicting its buffer cache.':
    '游戏目前还没有 CDC 连接器。最接近的是数据仓库：应用服务器将报表扫描直接发送给它，每次耗时 1.5 秒，并按扫描收费。这样，报表就不再扫描主数据库，也不会将其缓冲缓存中的数据挤出。',
  'PostgreSQL docs: Logical decoding concepts': 'PostgreSQL 文档：逻辑解码概念',
  'Debezium documentation': 'Debezium 文档',
  'CDN (content delivery network)': 'CDN（内容分发网络）',
  'A network of cache servers in many locations that store copies of content close to users. A request that the nearest edge can answer never reaches the origin, so it is faster and costs the origin nothing.':
    '由分布在多地的缓存服务器组成的网络，将内容副本保存在用户附近。最近的边缘节点能够回答的请求无需到达源站，因此速度更快，源站也无需为此付出成本。',
  'Content delivery research unlocks the CDN Component. At the default 300 s TTL it answers 70% of page and 75% of media requests at the edge; a 60 s TTL lowers that by 20% and a 3,600 s TTL raises it by 20%, up to 95%. Edge Egress costs $0.02 per GB, against $0.09 per GB from App Servers. Tiered caching lifts the media hit rate to 92%.':
    '“内容分发”研究解锁 CDN 组件。默认 TTL 为 300 秒时，它在边缘回答 70% 的页面请求和 75% 的媒体请求；TTL 为 60 秒时，命中率降低 20%，为 3,600 秒时提高 20%，最高 95%。边缘出站流量每 GB 收费 $0.02，而应用服务器为每 GB $0.09。“分层缓存”将媒体命中率提高到 92%。',
  'Cloudflare Learning Center: What is a CDN?': 'Cloudflare 学习中心：什么是 CDN？',
  'MDN: CDN': 'MDN：CDN',
  'A switch on a call path that watches for failures. When too many calls fail, it opens and fails new calls at once for a while, so callers stop waiting and the struggling service can recover. Then it lets a few calls through to test whether the service is back.':
    '调用路径上用于监测失败的开关。当失败调用过多时，它会断开一段时间，立即拒绝新调用，让调用方不再等待，也让承压的服务恢复。随后会放行少量调用，测试服务是否恢复。',
  "After the Circuit breakers research, you can turn on a breaker for each Link. When more than half of the Link's calls fail, it opens for 5 s: it sends nothing, and its calls fail at once as refused. Then it closes and tries again. Circuit breakers are one of the three preventions for a Retry storm.":
    '完成“熔断器”研究后，可以为每条链路开启熔断器。当链路超过一半的调用失败时，它会断开 5 秒：不发送任何请求，调用立即以“被拒绝”失败。随后它会闭合并重试。熔断器是预防“重试风暴”的三种措施之一。',
  'Martin Fowler: CircuitBreaker': 'Martin Fowler：熔断器',
  'Azure Architecture Center: Circuit Breaker pattern': 'Azure 架构中心：熔断器模式',
  'A practice where another engineer reads a change before it merges, to find defects, keep the code consistent, and share knowledge. Modern code review is usually lightweight and done in a tool on small changes.':
    '在变更合并前，由另一位工程师阅读代码，以发现缺陷、保持代码一致并分享知识。现代代码审查通常比较轻量，借助工具对小批量变更进行。',
  'Google engineering practices: Code review': 'Google 工程实践：代码审查',
  'Modern code review: a case study at Google': '现代代码审查：Google 案例研究',
  'The delay and slow first requests when a new process, container, or function instance starts. It must boot, load code and data, and fill caches or JIT-compile hot code before it reaches full speed.':
    '新进程、容器或函数实例启动时的延迟，以及最初几个请求的缓慢响应。它必须完成启动、加载代码和数据、填充缓存或对热点代码进行 JIT 编译，才能达到全速。',
  'A new or restarted App Server boots, then warms up. A Java (Tomcat) copy starts at 30% speed and needs 30 s to reach full speed, while Go starts at full speed. A new copy from an Autoscaler serves after 180 s on VMs, or 30 s in a Kubernetes Cluster. A restarted Cache comes back empty with Memcached or half warm with Redis, and a cold Database runs its queries at up to twice the CPU.':
    '新建或重启的应用服务器会先启动，再预热。Java（Tomcat）副本起初只有 30% 的速度，需要 30 秒达到全速；Go 则从一开始就是全速。自动扩缩容器新增的副本在虚拟机上需要 180 秒、在 Kubernetes 集群中需要 30 秒才能提供服务。重启后的缓存中，Memcached 为空，Redis 则恢复一半；冷数据库执行查询时，CPU 开销最高会翻倍。',
  'AWS Lambda docs: Execution environment lifecycle': 'AWS Lambda 文档：执行环境生命周期',
  'Wikipedia: Cold start (computing)': '维基百科：冷启动（计算）',
  'Encoding a response in fewer bytes before it goes over the network, for example with gzip or Brotli. The client decodes it. It saves bandwidth and transfer time and costs CPU on both ends.':
    '在响应通过网络发送之前，用 gzip 或 Brotli 等方式将其编码为更少的字节，再由客户端解码。它能节省带宽和传输时间，但两端都要消耗 CPU。',
  "Compression research lets you turn on gzip for each App Server. Its page, read, search, and bot responses shrink to 30% of their size, and those requests cost 10% more CPU. Smaller responses reach users sooner, use less of the box's network card, and cut origin Egress. Other kinds, such as upload and media, stay the same size.":
    '“压缩”研究允许你为每台应用服务器开启 gzip。页面、读取、搜索和机器人响应会缩小至原来的 30%，这些请求的 CPU 开销则增加 10%。更小的响应能更快到达用户，减少机器网卡的占用，并降低源站出站流量。上传、媒体等其他请求类型的大小保持不变。',
  'MDN: Compression in HTTP': 'MDN：HTTP 中的压缩',
  'RFC 1952: GZIP file format': 'RFC 1952：GZIP 文件格式',
  'Keeping a set of open database connections and sharing them among many clients, instead of opening one per client or per request. It saves connection setup time and keeps the database under its connection limit.':
    '保留一组已打开的数据库连接，供多个客户端共用，而不是为每个客户端或每次请求单独建立连接。这样既节省建连时间，也能避免数据库连接数超过上限。',
  "The Database accepts 100 connections and refuses the rest. Every App Server process holds its own pool: 1 connection per PHP or Gunicorn worker, 5 per Puma process, 10 for Node.js or Go. A Connection Pooler in transaction mode shares 20 server connections among all of them, but fails 5% of pooled queries until you fix the code's session state. The Connection exhaustion Incident doubles every pool.":
    '数据库接受 100 个连接，超出的连接会被拒绝。每个应用服务器进程都有自己的连接池：PHP 或 Gunicorn 的每个工作进程占 1 个连接，Puma 每进程占 5 个，Node.js 或 Go 占 10 个。事务模式下的连接池组件让它们共享 20 个服务端连接，但在你修复代码中的会话状态问题前，会有 5% 的池化查询失败。“连接耗尽”故障会使每个连接池的连接数翻倍。',
  'PgBouncer: Features and pooling modes': 'PgBouncer：功能与连接池模式',
  'PostgreSQL docs: Connections (max_connections)': 'PostgreSQL 文档：连接（max_connections）',
  "A way to map keys to servers on a hash ring, so that adding or removing one server moves only about 1/n of the keys. Karger and others described it in 1997 for web caches, and Amazon's Dynamo and Apache Cassandra use it to place data.":
    '在哈希环上将键映射到服务器的方法，增删一台服务器时，只需移动约 1/n 的键。Karger 等人于 1997 年为 Web 缓存提出此方法，Amazon 的 Dynamo 和 Apache Cassandra 也用它放置数据。',
  "The game does not model consistent hashing yet. A Load Balancer splits traffic by Weighted, Round robin, Least conn, or Two choices, not by key. The closest is the Wide-column Store, which places each key on N replicas, and the Hot key Incident, where one key's shard saturates.":
    '游戏目前尚未模拟一致性哈希。负载均衡器通过加权、轮询、最少连接或随机二选一来分配流量，而不是按键分配。最接近的是宽列存储，它将每个键放在 N 个副本上；以及“热键”故障，其中一个键所在的分片会达到饱和。',
  'Karger et al.: Consistent hashing and random trees (STOC 1997)':
    'Karger 等：一致性哈希与随机树（STOC 1997）',
  'DeCandia et al.: Dynamo (SOSP 2007)': 'DeCandia 等：Dynamo（SOSP 2007）',
  'Software that places containers on a shared pool of machines, restarts them when they fail, and scales them up and down. Kubernetes is the common example. Packing many workloads onto shared nodes uses machines better, but neighbours can slow each other down.':
    '将容器调度到共享机器池、在故障时重启容器并进行扩缩容的软件，Kubernetes 是常见例子。把多个工作负载放在共享节点上能提高机器利用率，但相邻负载也可能互相拖慢。',
  'The Container orchestration Research unlocks the Kubernetes Cluster. App Servers and Workers that you link into it run as pods: they cost 15% less Burn, an Autoscaler adds their copies in 30 s instead of 180 s, a bad deploy stops after its first quarter of pods, and a pod whose host dies is back in 30 s. Each Cluster takes half an engineer of Dev Hours unless a Platform team runs it, and a version left out of support for a quarter risks a forced upgrade that crashes 30% of pod requests. Noisy neighbours add 10 ms to 0.5% to 2% of requests as the pods get busier.':
    '“容器编排”研究解锁 Kubernetes 集群。连接到集群的应用服务器和工作进程以 Pod 运行：支出降低 15%，自动扩缩容器新增副本只需 30 秒而非 180 秒，错误部署在发布到首批四分之一的 Pod 后就会停止，宿主机宕机的 Pod 也能在 30 秒后恢复。除非由平台团队管理，每个集群都会占用相当于半名工程师的开发工时。版本停止支持满一个季度后，可能触发强制升级，使 30% 的 Pod 请求崩溃。Pod 越繁忙，邻居干扰就越严重，会让 0.5% 至 2% 的请求额外增加 10 ms 延迟。',
  'Kubernetes: Overview': 'Kubernetes：概述',
  'Kubernetes: Resource management for pods and containers': 'Kubernetes：Pod 和容器的资源管理',
  'Large-scale cluster management at Google with Borg': '利用 Borg 在 Google 进行大规模集群管理',
  'A practice that keeps software in a state where any change can be released safely at any time, through an automated pipeline that builds, tests, and deploys it. It makes releases small, frequent, and easy to roll back.':
    '通过自动化流水线构建、测试和部署软件，让软件始终处于任何变更都能随时安全发布的状态。这使发布更小、更频繁，也更容易回滚。',
  'Before the Continuous delivery Research, a deploy takes 30 minutes by hand. After it, a pipeline deploys in 5 minutes, so more deploys fit in the 8-hour work day with the build and the 15-minute check. It also lets you roll back a Bad deploy, which ends the Incident and puts its Features back in line for the next deploy. A bad deploy fails 8% of App Server requests per item it shipped, up to 40%, so smaller deploys break less.':
    '完成“持续交付”研究前，手动部署需要 30 分钟；完成后，流水线部署只需 5 分钟，因此加上构建和 15 分钟检查后，8 小时工作日内能容纳更多次部署。它还允许回滚错误部署，立即结束故障，并将该次发布的功能重新排入下一次部署。错误部署每发布一个项目，就会使应用服务器的请求失败率增加 8%，最高 40%，所以部署批次越小，破坏越少。',
  'Martin Fowler: Continuous delivery': 'Martin Fowler：持续交付',
  'DORA: Continuous delivery': 'DORA：持续交付',
  '"Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations," from Melvin Conway\'s 1968 paper. Teams that rarely talk tend to build parts with narrow interfaces between them.':
    '“设计系统的组织，其设计不可避免地会成为该组织沟通结构的复制品。”这句话出自 Melvin Conway 于 1968 年发表的论文。很少交流的团队，往往会构建彼此之间接口狭窄的模块。',
  'Not modeled yet: the Company runs one Service, the monolith, and every Team works on it. From Pre-seed you can create up to 4 Teams, each with its own policy. Each Team pays its own coordination cost, so splitting a large group raises total Dev Hours.':
    '目前尚未模拟：公司只运行一个服务，即单体应用，所有团队都在其上工作。从天使轮起，你可以创建最多 4 个团队，各有自己的工作策略。每个团队分别承担协调成本，因此将大团队拆分可以提高总开发工时。',
  "Mel Conway: Conway's Law": 'Mel Conway：康威定律',
  'Martin Fowler: ConwaysLaw': 'Martin Fowler：康威定律',
  'An attack where bots try username and password pairs leaked from other sites against a login form. It works because many people reuse passwords. Each try also costs the site a slow password hash.':
    '机器人使用其他网站泄露的用户名和 password 组合尝试登录的攻击。由于许多人会重复使用密码，这种攻击往往有效。每次尝试也会让网站付出一次缓慢的 password 哈希计算成本。',
  'The Credential stuffing Incident can start from Seed when your Company serves login. Bots send 19 times your normal login rate, and each one costs an App Server a full bcrypt hash, so CPU saturates. A WAF blocks most of the bots: 80% at the default paranoia level 2. An Auth Provider hashes the rest, so a login costs your App Server about 2 ms of CPU.':
    '从种子轮起，公司提供登录服务时，就可能发生“撞库攻击”故障。机器人发送的登录请求是正常速率的 19 倍，每次都要让应用服务器完整计算一次 bcrypt 哈希，从而耗尽 CPU。WAF 会拦截大部分机器人：默认严格级别 2 下可拦截 80%。认证服务商负责剩余的哈希计算，让每次登录在应用服务器上只消耗约 2 ms CPU 时间。',
  'OWASP: Credential stuffing': 'OWASP：撞库攻击',
  'OWASP Cheat Sheet: Credential Stuffing Prevention': 'OWASP 速查表：预防撞库攻击',
  'Cloudflare Learning Center: What is credential stuffing?':
    'Cloudflare 学习中心：什么是撞库攻击？',
  "A rule, from law or from a contract, that some data must be stored and processed inside a given country or region. The EU's GDPR, for example, limits transfers of personal data out of the EU.":
    '法律或合同规定某些数据必须在指定国家或地区内存储和处理的要求。例如，欧盟的 GDPR 对向欧盟以外传输个人数据作出了限制。',
  'Data residency is an item on the Pre-IPO IPO checklist. It is met when you own Data residency controls and GeoDNS, you have a live EU Users Node, and every data Node it reaches sits in the EU region or is a Spread Wide-column Store or Distributed SQL Node. Build a full EU path and keep its data local to tick it.':
    '数据驻留是上市前 IPO 清单中的一项。满足条件需要拥有“数据驻留控制”和 GeoDNS，运行一个欧洲用户节点，并且其可达的每个数据节点都位于欧洲区域，或是采用分散部署的宽列存储或分布式 SQL 节点。搭建完整的欧洲访问路径，并让数据保留在当地，即可完成此项。',
  'Cloudflare Learning Center: What is data localization?':
    'Cloudflare 学习中心：什么是数据本地化？',
  'Wikipedia: Data sovereignty': '维基百科：数据主权',
  'DDoS (distributed denial of service)': 'DDoS（分布式拒绝服务）',
  'An attack that floods a service with traffic from many machines at once, often a botnet, so real users cannot get through. Defenses filter junk at the edge and spread the load over many locations.':
    '多台机器（通常来自僵尸网络）同时向服务灌入海量流量，使真实用户无法访问的攻击。防御措施会在边缘过滤垃圾流量，并将负载分散到多个地点。',
  'The DDoS Incident can start from Seed. It adds 50 times your normal demand as bot traffic for up to 60 s. A WAF filters bots at its paranoia level; turn on Under attack mode to block 99% of them, at the cost of 1% of real users and 40 ms more latency. The director picks a DDoS less often when you run a WAF.':
    '“DDoS”故障从种子轮起可能发生，最多持续 60 秒，期间会加入相当于正常需求 50 倍的机器人流量。WAF 根据严格级别过滤机器人；开启“遭受攻击模式”可拦截 99% 的机器人，代价是误拦 1% 的真实用户，并增加 40 ms 延迟。运行 WAF 时，故障调度器选择 DDoS 的频率也会降低。',
  'Cloudflare Learning Center: What is a DDoS attack?': 'Cloudflare 学习中心：什么是 DDoS 攻击？',
  'CISA: Understanding Denial-of-Service Attacks': 'CISA：了解拒绝服务攻击',
  'Cloudflare docs: Under Attack mode': 'Cloudflare 文档：遭受攻击模式',
  'A separate queue that holds messages a consumer cannot process, after a set number of failed attempts. It stops one bad message from blocking the queue, and keeps the message for people to inspect or replay.':
    '独立存放消费者在多次尝试后仍无法处理的消息的队列。它能防止一条坏消息阻塞整个队列，并保留消息供人检查或重放。',
  'A Queue card has a Failed tasks setting: Retry forever or Dead-letter queue, with 1, 3, 10, or 25 attempts. A failed attempt comes back 30 s later and runs on the Worker again; a task that fails every attempt is lost. The Poison message Incident can hit only a Queue that retries forever: a task that always fails keeps coming back, and its Workers spend 90% of their time on it. Turn on the dead-letter queue to make the Queue immune, or delete the message to end the Incident.':
    '队列卡片的“失败任务”设置可选“无限重试”或“死信队列”，尝试次数为 1、3、10 或 25 次。失败的任务会在 30 秒后返回，交给工作进程再次执行；每次都失败的任务最终会丢失。“毒消息”故障只会影响无限重试的队列：一项总是失败的任务不断回来，工作进程将 90% 的时间耗在它身上。开启死信队列可让队列免受此故障影响，删除消息则可结束当前故障。',
  'AWS: Using dead-letter queues in Amazon SQS': 'AWS：在 Amazon SQS 中使用死信队列',
  'RabbitMQ: Dead letter exchanges': 'RabbitMQ：死信交换器',
  'Enterprise Integration Patterns: Dead Letter Channel': '企业集成模式：死信通道',
  'An automated check of the third-party libraries a project uses against databases of known vulnerabilities. It usually runs in the build pipeline and flags versions that need an upgrade.':
    '自动将项目使用的第三方库与已知漏洞数据库进行比对的检查。它通常在构建流水线中运行，标记出需要升级的版本。',
  'Dependency scanning is Security Research from Series A that needs Continuous delivery. In the game today it has no direct effect on traffic or Incidents. It is one of three prerequisites, with TLS everywhere and Encryption at rest, for the SOC 2 program, which the IPO checklist needs.':
    '“依赖扫描”是 A 轮起可用的安全研究，前置条件是“持续交付”。目前在游戏中，它对流量和故障没有直接影响。它与“全链路 TLS”“静态数据加密”一起，是“SOC 2 计划”的三个前置条件，而 IPO 清单要求完成 SOC 2 计划。',
  'OWASP Top 10: Vulnerable and Outdated Components': 'OWASP Top 10：存在漏洞和过时的组件',
  'OWASP Dependency-Check': 'OWASP Dependency-Check 依赖检查工具',
  'GitHub Docs: About Dependabot alerts': 'GitHub 文档：关于 Dependabot 警报',
  'Following one request across every service it touches. Each hop records a span with its start and end time, and spans that share a trace ID join into one trace. Traces show where time goes and which dependency is slow.':
    '追踪一个请求经过的每个服务。每一跳都记录带有开始和结束时间的跨度，共享同一追踪 ID 的跨度组成完整调用链。调用链能显示时间花在哪里，以及哪个依赖较慢。',
  "The Distributed tracing Research (after Percentiles) promises each request kind's time, Node by Node, but buying it changes nothing in the game today. The closest thing that works now is the Analytics Node, which samples the traffic of the Nodes you link into it and turns it into Insight. Percentiles show p50, p95, and p99, and the Board marks the Bottleneck.":
    '“分布式追踪”研究（需先研究“百分位数”）承诺按节点显示每种请求的耗时，但目前在游戏中购买它不会产生任何变化。当前可用的最接近工具是分析节点，它对连接给它的节点流量进行采样，并转化为洞察。“百分位数”显示 p50、p95 和 p99，画布则会标出瓶颈。',
  "Dapper: Google's tracing infrastructure": 'Dapper：Google 的追踪基础设施',
  'OpenTelemetry: Traces': 'OpenTelemetry：调用链',
  'Diurnal traffic': '昼夜流量变化',
  'The daily rise and fall of demand that follows when people are awake and active. Consumer services often peak in the evening and are quietest in the early morning. Capacity planning must cover the daily peak, and the trough is a safe time for maintenance.':
    '需求随人们清醒和活动时间而每日起伏。面向消费者的服务通常在晚间达到峰值，凌晨最为安静。容量规划必须覆盖每日高峰，而低谷适合进行维护。',
  'Demand follows a daily cycle on the Calendar: by default it peaks at 20:00 at 1.45× the average and falls to 0.55× at 08:00. Each Venture sets its own curve; for example, Fintech peaks at 14:00 and swings ±60%. When you open more regions, each region peaks at its own local 20:00. One sim second is one calendar minute, so a full day passes in 24 minutes at 1×: size for the evening peak, or let an Autoscaler follow the curve.':
    '需求按日历中的每日周期变化：默认在 20:00 达到平均值 1.45 倍的峰值，在 08:00 降至 0.55 倍。每个创业方向都有自己的曲线，例如金融科技在 14:00 达峰，波动幅度为 ±60%。开放更多区域后，各区域会在当地时间 20:00 达峰。模拟中的 1 秒对应日历中的 1 分钟，因此 1 倍速下 24 分钟就过完一天：要么按晚间高峰配置容量，要么让自动扩缩容器跟随曲线调整。',
  'USENIX 1997: Diurnal cycle in a client trace': 'USENIX 1997：客户端追踪中的昼夜周期',
  'AWS: Predictive scaling for EC2 Auto Scaling': 'AWS：EC2 Auto Scaling 的预测式扩缩容',
  "Load spreading by DNS: a name returns several IP addresses, and the server rotates their order so clients spread across hosts. DNS does not know whether a host is alive, and clients cache answers for the record's TTL.":
    '通过 DNS 分散负载：同一个域名返回多个 IP 地址，服务器轮换它们的顺序，让客户端分散到不同主机。DNS 不知道主机是否存活，客户端还会按记录的 TTL 缓存结果。',
  'DNS round robin research unlocks the DNS Component, which splits Users evenly across up to 8 hosts. With no health checks, a dead host keeps its share and those requests fail. After Health checks research, DNS drops a dead host once its TTL runs out: 30, 300, or 3,600 s. A Load Balancer notices a dead host faster, at its next health check.':
    '“DNS 轮询”研究解锁 DNS 组件，将用户平均分配到最多 8 台主机。没有健康检查时，宕机主机仍占有原来的流量份额，这部分请求会失败。完成“健康检查”研究后，DNS 会在 TTL 到期时剔除宕机主机，TTL 可选 30、300 或 3,600 秒。负载均衡器会更快发现宕机主机：在下一次健康检查时就会发现。',
  'Cloudflare Learning Center: What is round-robin DNS?': 'Cloudflare 学习中心：什么是轮询 DNS？',
  'RFC 1794: DNS Support for Load Balancing': 'RFC 1794：DNS 对负载均衡的支持',
  'Five measures of software delivery from the DORA research program: change lead time, deployment frequency, failed deployment recovery time, change fail rate, and rework rate. The first three show throughput, and the last two show instability.':
    'DORA 研究计划提出的软件交付五项指标：变更前置时间、部署频率、失败部署恢复时间、变更失败率和返工率。前三项衡量吞吐，后两项衡量不稳定程度。',
  "Two of them drive play. Deploy frequency is at most 480 work minutes / (build + deploy + 15 verify) per day, capped at 16, 8, or 4 by the Team's policy. Continuous delivery cuts a deploy from 30 to 5 minutes. Each deploy has a 10% base chance to ship a bug, raised by Move fast and tech debt and lowered by Automated tests (−30%) and Code review (−20%); the deploy card shows it.":
    '其中两项会影响玩法。每天的部署频率最多为 480 个工作分钟 /（构建时间 + 部署时间 + 15 分钟验证），并受团队策略限制，最多为 16、8 或 4 次。“持续交付”将部署时间从 30 分钟缩短到 5 分钟。每次部署引入缺陷的基础概率为 10%，“快速推进”和技术债会提高此概率，“自动化测试”（−30%）和“代码审查”（−20%）会降低此概率；部署卡片会显示具体数值。',
  'DORA: Software delivery performance metrics': 'DORA：软件交付性能指标',
  "DORA: A history of DORA's metrics": 'DORA：DORA 指标的历史',
  Downsampling: '降采样',
  'Storing old metrics at a coarser resolution, such as one point per 5 minutes or per hour instead of per second. Long ranges stay cheap to keep and fast to draw. Each coarse point keeps the min, max, sum, and count of the points it replaces.':
    '以更低的分辨率存储旧指标，例如从每秒一个点降为每 5 分钟或每小时一个点，让长时间范围的数据存储成本低、绘图速度快。每个粗粒度数据点会保留被替代数据点的最小值、最大值、总和和数量。',
  'The Dashboard reads one-minute samples for the 1 h and 6 h ranges, 15-minute blocks (kept for 7 days) for 1 d and 7 d, and 1-hour blocks (kept for 30 days) for 30 d. Each chart draws a block as its mean. The p99 line draws the worst minute in each block instead, because an average would hide the spike.':
    '仪表盘在 1 小时和 6 小时范围内读取每分钟采样，在 1 天和 7 天范围内读取 15 分钟聚合块（保留 7 天），在 30 天范围内读取 1 小时聚合块（保留 30 天）。图表通常用每个块的均值绘制，但 p99 曲线使用每个块中最差一分钟的值，以免平均值掩盖峰值。',
  'Thanos docs: Compactor and downsampling': 'Thanos 文档：压缩器与降采样',
  'Prometheus docs: Storage': 'Prometheus 文档：存储',
  'Wikipedia: Downsampling': '维基百科：降采样',
  "Data that leaves a cloud provider's network, to the internet or to another zone or region. Providers charge per GB for it, while data coming in is usually free.":
    '离开云服务商网络、流向互联网或其他可用区或区域的数据。服务商按 GB 收费，而入站数据通常免费。',
  "From Seed, Burn includes egress: $0.09 per GB that App Servers send to users, and $0.02 per GB for pages a CDN answers at the edge. A call between zones costs $0.01 per GB each way, and a call between regions $0.02 per GB, all scaled by the Era's cost index. Compression makes page and read responses 70% smaller for 10% more CPU.":
    '从种子轮起，支出包含出站流量费：应用服务器发送给用户的数据每 GB $0.09，CDN 在边缘回答的页面每 GB $0.02。跨可用区调用双向各收每 GB $0.01，跨区域调用每 GB $0.02，均按当前阶段的成本指数调整。压缩能让页面和读取响应缩小 70%，代价是增加 10% CPU 开销。',
  'Cloudflare Learning Center: What are data egress fees?':
    'Cloudflare 学习中心：什么是数据出站费用？',
  'AWS Architecture Blog: Data transfer costs': 'AWS 架构博客：数据传输成本',
  'Encrypting stored data, such as disks, database files, and backups, so that someone who gets the storage media cannot read it without the keys. It protects against stolen disks and leaked backups, not against an attacker who can query the live system.':
    '对磁盘、数据库文件和备份等存储数据进行加密，让拿到存储介质的人没有密钥就无法读取。它能防范磁盘被盗和备份泄露，却不能防范能够查询在线系统的攻击者。',
  'Encryption at rest is Security Research from Series B. In the game today it has no direct effect on traffic, cost, or Incidents. It is one of three prerequisites, with TLS everywhere and Dependency scanning, for the SOC 2 program, which the IPO checklist needs.':
    '“静态数据加密”是 B 轮起可用的安全研究。目前在游戏中，它对流量、成本或故障没有直接影响。它与“全链路 TLS”“依赖扫描”一起，是“SOC 2 计划”的三个前置条件，而 IPO 清单要求完成 SOC 2 计划。',
  'Google Cloud: Default encryption at rest': 'Google Cloud：默认静态数据加密',
  'OWASP Cheat Sheet: Cryptographic Storage': 'OWASP 速查表：加密存储',
  'PostgreSQL docs: Encryption Options': 'PostgreSQL 文档：加密选项',
  'The amount of failure an SLO allows over a window: with a 99.9% SLO, 0.1% of requests may fail. Teams spend it on risk, such as faster releases, and slow down and fix reliability when it runs out.':
    'SLO 在一个时间窗口内允许的失败额度：SLO 为 99.9% 时，允许 0.1% 的请求失败。团队可以用它承担风险，例如加快发布；预算耗尽时则放慢节奏、修复可靠性。',
  "From Series A, the game counts failed requests over the last calendar week against the Era's SLO, 99.9% in Series A and up to 99.99% when Public. Bots and WAF blocks do not count. After the Error budgets research, more than half the budget left speeds your Teams up 10%, and a spent budget halves their speed. SLO dashboards put the budget on the HUD. SLO dashboards also chart the budget burn rate on the Dashboard.":
    '从 A 轮起，游戏将最近一个日历周的失败请求与当前阶段的 SLO 比较，目标从 A 轮的 99.9% 提高到上市后的 99.99%。机器人和 WAF 拦截不计入。完成“错误预算”研究后，剩余预算超过一半时，团队速度提高 10%；预算耗尽时，速度减半。“SLO 仪表盘”会在 HUD 上显示预算，也会在仪表盘中绘制预算消耗速率曲线。',
  'Google SRE book: Embracing risk': 'Google SRE 书籍：拥抱风险',
  'Google SRE workbook: Error budget policy': 'Google SRE 工作手册：错误预算策略',
  'A single thread that waits for I/O events and runs their callbacks one at a time. It serves many waiting connections cheaply, but a callback that uses the CPU for a long time blocks every other request on that loop.':
    '等待 I/O 事件并逐一执行其回调的单个线程。它能以低成本处理大量等待中的连接，但任何长时间占用 CPU 的回调，都会阻塞该循环上的所有其他请求。',
  'Node.js runs one event loop and uses one core; Node.js cluster runs one loop per core. A CPU-heavy request, such as an 80 ms password hash at login, stalls the requests behind it, and the stall lands on the p99. In the Event loop block Incident each login costs 4× the CPU. The libuv thread pool research or an Auth Provider takes the hash off the loop.':
    'Node.js 运行一个事件循环，使用一个核心；Node.js cluster 则每个核心运行一个循环。CPU 密集型请求，例如登录时耗时 80 ms 的 password 哈希计算，会拖住后面的请求，这种停顿会体现在 p99 上。在“事件循环阻塞”故障中，每次登录的 CPU 开销变为 4 倍。“libuv 线程池”研究或认证服务商可以将哈希计算移出事件循环。',
  'Node.js: The Node.js event loop': 'Node.js：Node.js 事件循环',
  "Node.js: Don't block the event loop": 'Node.js：不要阻塞事件循环',
  'MDN: JavaScript execution model': 'MDN：JavaScript 执行模型',
  'A consistency model where replicas can return old data for a while after a write. If no new writes arrive, all replicas converge to the same latest value.':
    '一种一致性模型：写入之后，副本可能暂时返回旧数据。如果没有新的写入到来，所有副本最终都会收敛到相同的最新值。',
  'A Read Replica lags behind writes, so up to 15% of its reads come back stale, and up to 50% during the Replication lag Incident. A Wide-column Store whose R + W is not greater than N also serves stale reads. A stale read fails an API read and a checkout that reads its own write. Read-your-writes routing sends those reads to the primary instead.':
    '只读副本落后于写入，因此最多有 15% 的读取返回过期数据；在“复制延迟”故障中，最高为 50%。R + W 不大于 N 的宽列存储也会返回过期数据。过期读取会导致 API 读取失败，也会导致需要读取自身写入结果的结账请求失败。“读己之写路由”会将这些读取改发到主库。',
  'Werner Vogels: Eventually Consistent (ACM Queue)': 'Werner Vogels：最终一致性（ACM Queue）',
  'Eight false assumptions that programmers new to distributed systems often make, collected by L. Peter Deutsch and others at Sun Microsystems: the network is reliable, latency is zero, bandwidth is infinite, the network is secure, topology does not change, there is one administrator, transport cost is zero, and the network is homogeneous.':
    '分布式系统新手常犯的八个错误假设，由 Sun Microsystems 的 L. Peter Deutsch 等人总结：网络可靠、延迟为零、带宽无限、网络安全、拓扑不变、只有一个管理员、传输成本为零，以及网络同构。',
  'Several Incidents and costs break these assumptions. In the Network partition Incident, calls between regions time out until the partition heals or you fence the old leader. A call to another zone adds 1 ms and costs egress both ways, and a call to another region pays the round trip. Until Timeouts and retries, every Link waits 30 s for an answer.':
    '多种故障和成本会打破这些假设。在“网络分区”故障中，跨区域调用会持续超时，直到分区恢复或你隔离旧主节点。跨可用区调用增加 1 ms 延迟，并产生双向出站流量费；跨区域调用还要承担往返延迟。在研究“超时与重试”之前，每条链路都会等待响应 30 秒。',
  'Rotem-Gal-Oz: Fallacies of Distributed Computing Explained (PDF)':
    'Rotem-Gal-Oz：分布式计算谬误详解（PDF）',
  'One request that turns into many calls to other services or data stores. The more calls a request waits for, the more likely one of them is slow, so wide fan-out raises tail latency and load.':
    '一个请求衍生出多个对其他服务或数据存储的调用。一个请求等待的调用越多，其中某个调用较慢的概率就越高，因此大规模扇出会提高尾延迟和负载。',
  "A page view makes 2 read queries, and ORM frameworks (Laravel, Rails, Django) make 3 reads where 1 would do until Eager loading. The Activity feed Feature adds feeds: pulled, a feed makes 20 reads. With fan-out on write, a feed makes 1 read but every write fills 20 followers' timelines. Hybrid fan-out cuts that to 2 reads and 10 timeline writes.":
    '一次页面浏览会发起 2 次读取查询；在研究“预先加载”之前，ORM 框架（Laravel、Rails、Django）会将本可 1 次完成的读取变成 3 次。“动态信息流”功能加入信息流请求：拉取模式下，一次信息流请求会读取 20 次；采用写时扇出后，只需读取 1 次，但每次写入都要填充 20 位关注者的时间线。“混合扇出”将其降为 2 次读取和 10 次时间线写入。',
  'Dean and Barroso: The Tail at Scale (CACM 2013)':
    'Dean 和 Barroso：大规模系统中的尾延迟（CACM 2013）',
  'Wikipedia: Fan-out (software)': '维基百科：扇出（软件）',
  "Building each user's feed when a post is written: the post is copied into the timeline of every follower, so reading a feed is one cheap lookup. It moves work from reads to writes, and it is expensive for accounts with many followers. Many systems use a hybrid: push for normal accounts and pull for celebrities at read time.":
    '发布帖子时就构建每位用户的信息流：将帖子复制到每位关注者的时间线，因此读取信息流只需一次低成本查询。它将工作从读取移到写入，但对关注者众多的账号而言，成本很高。许多系统采用混合方式：普通账号推送，名人账号则在读取时拉取。',
  'From Series C, the Activity feed Feature adds the feed kind, and each App Server card offers Feeds: Pull or Push. With Pull, a feed reads 20 posts. With Push, a feed reads one precomputed timeline, but every write makes 20 timeline writes. The Hybrid fan-out Research cuts that to 10 writes and 2 reads per feed, and lets a Cache or Wide-column Store split a Hot key across its shards.':
    '从 C 轮起，“动态信息流”功能加入信息流请求类型，每张应用服务器卡片都有“信息流：拉取或推送”选项。拉取模式下，一次信息流请求读取 20 篇帖子。推送模式下，只读取一条预先计算的时间线，但每次写入会产生 20 次时间线写入。“混合扇出”研究将其降为 10 次写入和每次信息流请求 2 次读取，并允许缓存或宽列存储将热键分散到各个分片。',
  'InfoQ: Timelines at Scale (Twitter)': 'InfoQ：大规模时间线（Twitter）',
  'High Scalability: The architecture Twitter uses': 'High Scalability：Twitter 使用的架构',
  'A switch in the code, controlled at runtime, that turns a feature on or off without a new deploy. Teams use flags to release a feature to a share of users, test it, or turn it off fast when it breaks.':
    '代码中可在运行时控制的开关，无需重新部署即可开启或关闭功能。团队用它向部分用户发布功能、进行测试，或在出问题时迅速关闭。',
  "Not modeled yet: a Feature reaches every user at the next deploy, with no rollout share. The closest tool is a rollback after Continuous delivery, which takes a bad deploy's Features out again and ends the Bad deploy Incident.":
    '目前尚未模拟：功能会在下一次部署时到达所有用户，无法选择发布比例。最接近的工具是在完成“持续交付”研究后进行回滚，将错误部署的功能撤回，并结束“错误部署”故障。',
  "Martin Fowler's site: Feature Toggles (Pete Hodgson)":
    'Martin Fowler 网站：功能开关（Pete Hodgson）',
  'OpenFeature: What are feature flags?': 'OpenFeature：什么是功能开关？',
  'Latency, traffic, errors, and saturation: the four measures that the Google SRE book says to watch first on a user-facing system. If you can measure only four things, measure these.':
    '延迟、流量、错误和饱和度：Google SRE 书籍建议面向用户的系统首先监测这四项。如果只能测量四件事，就测量它们。',
  'The Dashboard (D) opens after Metrics research. Its Golden signals row charts traffic (served against demand), latency (the mean, plus the p99 with Percentiles), and errors (with Structured logs). The Saturation row below shows how full each Node is, and the stats at the top name the Hottest Node.':
    '完成“指标”研究后可打开仪表盘（D）。“黄金信号”一行绘制流量（已处理量与需求量）、延迟（均值，研究“百分位数”后还显示 p99）和错误（需“结构化日志”）曲线。下方“饱和度”一行显示各节点的负载程度，顶部统计会指出最繁忙的节点。',
  'Google SRE book: Monitoring distributed systems': 'Google SRE 书籍：监控分布式系统',
  'Grafana docs: Dashboard best practices': 'Grafana 文档：仪表盘最佳实践',
  'Time when a garbage collector stops or slows the application to find and free memory that is no longer used. Pauses usually hit only some requests, so they show up in tail latency, such as the p99, more than in the average.':
    '垃圾回收器为查找并释放不再使用的内存，暂停或拖慢应用的时间。停顿通常只影响部分请求，因此相较于平均值，它们更容易体现在 p99 等尾延迟指标上。',
  "When an App Server's heap is more than 70% full, its collector pauses up to 2% of requests. Java pauses 30 ms with G1, 150 ms with Parallel, or 1 ms with ZGC, which costs 10% of throughput and 15% more memory. Go pauses only 1 ms but spends up to 25% more CPU, which Go GC tuning trades against memory. In the GC pause storm Incident the heap fills further and 5× as many requests pause.":
    '应用服务器的堆占用超过 70% 时，垃圾回收器会让最多 2% 的请求遭遇停顿。Java 使用 G1 时停顿 30 ms，Parallel 为 150 ms，ZGC 为 1 ms，但 ZGC 会损失 10% 吞吐并多用 15% 内存。Go 仅停顿 1 ms，却最多多消耗 25% CPU；“Go GC 调优”允许在 CPU 与内存之间取舍。在“GC 停顿风暴”故障中，堆会进一步填满，遭遇停顿的请求数变为 5 倍。',
  'Go: A Guide to the Go Garbage Collector': 'Go：Go 垃圾回收器指南',
  'OpenJDK Wiki: ZGC': 'OpenJDK Wiki：ZGC',
  'Oracle: Java GC tuning guide': 'Oracle：Java GC 调优指南',
  'DNS that gives different answers depending on where the user is, so each user resolves to a nearby data center or region. Many providers can also skip a region that fails its health checks.':
    '根据用户位置返回不同解析结果的 DNS，让每位用户连接到附近的数据中心或区域。许多服务商还能跳过健康检查失败的区域。',
  "GeoDNS is Series C Research that needs Multiple regions. Without it, users on every continent enter through the home region and pay two round trips, for example 150 ms from Europe to North America. With it, each region's users enter through their own region's Users Node, or the nearest live one during a Region outage. The Data residency checklist item also needs GeoDNS.":
    'GeoDNS 是 C 轮研究，前置条件为“多区域”。没有它时，各大洲的用户都从本土区域接入，并承担两次往返延迟，例如欧洲到北美为 150 ms。有了它，各区域的用户通过本区域的用户节点接入；发生“区域故障”时，则通过最近仍在线的用户节点接入。“数据驻留”清单项也需要 GeoDNS。',
  'Amazon Route 53: Geolocation routing': 'Amazon Route 53：地理位置路由',
  'Amazon Route 53: Latency-based routing': 'Amazon Route 53：基于延迟的路由',
  "A lock in CPython's default build, and the GVL in CRuby, that lets only one thread run interpreter code at a time. Threads still overlap while they wait for I/O, but CPU work in one process does not run in parallel. CPython 3.13 added an optional free-threaded build without the GIL (PEP 703).":
    'CPython 默认构建中的一把锁，以及 CRuby 中的 GVL，每次只允许一个线程执行解释器代码。线程等待 I/O 时仍可交错推进，但一个进程中的 CPU 工作无法并行。CPython 3.13 新增了不含 GIL 的可选自由线程构建（PEP 703）。',
  "Ruby's Puma must run one process per core to use every core, with 5 threads each and 180 MB per process. Python's Gunicorn runs a pool of sync workers, one request each and 120 MB per worker, and you set the pool size. Runtimes without a GIL, such as Go or Java, run one process on every core.":
    'Ruby 的 Puma 必须每个核心运行一个进程，才能使用所有核心，每进程有 5 个线程，占用 180 MB。Python 的 Gunicorn 运行一组同步工作进程，每进程处理一个请求、占用 120 MB，由你设置进程池大小。Go、Java 等没有 GIL 的运行时，则用一个进程使用所有核心。',
  'Python docs: Glossary (global interpreter lock)': 'Python 文档：术语表（全局解释器锁）',
  'PEP 703: Making the GIL optional': 'PEP 703：让 GIL 变为可选',
  'Lightweight threads that a language runtime schedules instead of the operating system. Goroutines, Java virtual threads, and Erlang processes are examples. Each costs a few KB, so one server can keep many thousands waiting at once.':
    '由语言运行时而非操作系统调度的轻量线程，例如 goroutine、Java 虚拟线程和 Erlang 进程。每个只需几 KB，因此一台服务器能够同时维持数千个等待中的线程。',
  "Go and Elixir's BEAM run green threads on every core, and a waiting request holds no worker slot. Each open Realtime connection costs 10 KB on Go and 5 KB on BEAM, against 1 MB for a Java thread on Tomcat. BEAM is preemptive, so no request stalls another, but its CPU is less than half as fast as Go's.":
    'Go 和 Elixir 的 BEAM 在所有核心上运行绿色线程，等待中的请求不占用工作槽位。每条打开的实时连接在 Go 上占 10 KB，在 BEAM 上占 5 KB，而 Tomcat 上的 Java 线程占 1 MB。BEAM 采用抢占式调度，因此一个请求不会拖住另一个请求，但其 CPU 处理速度不到 Go 的一半。',
  'A Tour of Go: Goroutines': 'Go 语言之旅：Goroutine',
  'JEP 444: Virtual Threads': 'JEP 444：虚拟线程',
  'A periodic probe, such as an HTTP request to a status endpoint, that decides whether a server should receive traffic. A shallow check tests only the server; a deep check also tests what it depends on, such as its database.':
    '定期发送的探测，例如向状态端点发送 HTTP 请求，用来判断服务器是否应该接收流量。浅层检查只检查服务器自身；深层检查还会检查它所依赖的数据库等系统。',
  'A Load Balancer probes its App Servers every 10 s and stops sending traffic to a dead one at the next check. The Health checks research adds 2 s and 30 s intervals and a deep check that also removes App Servers whose Database is down or overloaded. It also lets DNS drop a dead host once its TTL runs out; without it, DNS keeps sending that host its share.':
    '负载均衡器每 10 秒探测一次应用服务器，在下一次检查时停止向宕机服务器发送流量。“健康检查”研究新增 2 秒和 30 秒的检查间隔，以及深层检查；后者还能剔除数据库宕机或过载的应用服务器。它也允许 DNS 在 TTL 到期后移除宕机主机；没有此研究，DNS 会继续把该主机应得的流量发送给它。',
  "AWS Builders' Library: Implementing health checks": 'AWS 构建者文库：实现健康检查',
  'Kubernetes docs: Liveness, readiness, and startup probes':
    'Kubernetes 文档：存活、就绪与启动探针',
  'Sending a second copy of a request to another replica when the first is slower than expected, for example past the 95th-percentile latency, and using whichever answer arrives first. It cuts tail latency for a small amount of extra load.':
    '当首个请求比预期更慢时，例如超过第 95 百分位延迟，向另一个副本发送相同请求，并采用最先到达的响应。只需增加少量负载，就能降低尾延迟。',
  'Not modeled yet: no Link or research sends a hedged copy. The closest is the Wide-column Store, where a read waits only for the fastest R of its N replicas, so a lower R gives a faster read. Percentiles shows the p99 that hedging would cut.':
    '目前尚未模拟：没有链路或研究会发送对冲副本。最接近的是宽列存储：读取只需等待 N 个副本中最快的 R 个，因此 R 越小，读取越快。“百分位数”会显示对冲请求原本可以降低的 p99。',
  'gRPC docs: Request hedging': 'gRPC 文档：请求对冲',
  "One key that receives a very large share of reads or writes, such as a celebrity's profile. The one shard or server that owns it saturates while the others stay idle, so adding servers does not help.":
    '接收了极大比例读写的单个键，例如名人的个人资料。负责该键的单个分片或服务器达到饱和，其他机器却闲着，因此增加服务器也无济于事。',
  'AWS docs: Designing partition keys to distribute workload in DynamoDB':
    'AWS 文档：设计分区键以分散 DynamoDB 工作负载',
  'AWS docs: Write sharding in DynamoDB': 'AWS 文档：DynamoDB 中的写入分片',
  'Redis docs: redis-cli --hotkeys': 'Redis 文档：redis-cli --hotkeys',
  'Reusing one TCP connection for many HTTP requests instead of opening a new one each time. It skips the connection handshake, and for HTTPS the TLS handshake, on every request after the first.':
    '复用同一条 TCP 连接来处理多个 HTTP 请求，而不是每次重新建立连接。这样，除第一个请求外，后续请求都可跳过建连握手；对 HTTPS 而言，也能跳过 TLS 握手。',
  'Every internal call between Nodes costs a 0.5 ms hop plus a 1 ms TCP handshake. Connection reuse research removes the handshake, so each internal call costs 0.5 ms. A request that crosses several Nodes saves 1 ms per hop.':
    '节点之间的每次内部调用会产生 0.5 ms 的跳转延迟和 1 ms 的 TCP 握手。“连接复用”研究会消除握手，使每次内部调用只需 0.5 ms。跨越多个节点的请求，每一跳都能节省 1 ms。',
  'MDN: Connection management in HTTP/1.x': 'MDN：HTTP/1.x 中的连接管理',
  'RFC 9112: HTTP/1.1, Connection Management': 'RFC 9112：HTTP/1.1，连接管理',
  'HTTP/2 and HTTP/3': 'HTTP/2 与 HTTP/3',
  'Newer versions of HTTP. HTTP/2 sends many requests at once over one TCP connection. HTTP/3 runs over QUIC on UDP, which combines the transport and TLS handshakes and stops one lost packet from stalling every stream.':
    '较新的 HTTP 版本。HTTP/2 在一条 TCP 连接上同时发送多个请求。HTTP/3 基于 UDP 上的 QUIC，将传输层握手和 TLS 握手合并，并防止单个数据包丢失拖住所有流。',
  'HTTP/3 is Series C Research that needs HTTP/2. It cuts the round trips a user pays to reach a region on another continent by 20%: a European user served from North America waits 120 ms instead of 150 ms. HTTP/2 research has no effect of its own yet; you research it to unlock HTTP/3.':
    'HTTP/3 是 C 轮研究，前置条件为 HTTP/2。它将用户跨洲访问区域的往返延迟降低 20%：欧洲用户访问北美服务时，等待时间从 150 ms 降至 120 ms。HTTP/2 研究本身目前还没有效果，研究它是为了解锁 HTTP/3。',
  'MDN: Evolution of HTTP': 'MDN：HTTP 的演进',
  'Cloudflare Learning Center: What is HTTP/3?': 'Cloudflare 学习中心：什么是 HTTP/3？',
  'RFC 9114: HTTP/3': 'RFC 9114：HTTP/3',
  'An operation is idempotent when doing it twice has the same effect as doing it once. Reads are idempotent by nature; a card charge or an order is not. An idempotency key is a unique ID the client sends with a request, so the server can recognize a retry and return the first result instead of acting again.':
    '一个操作执行两次与执行一次的效果相同时，就具有幂等性。读取天然幂等，银行卡扣款或下单则不是。幂等键是客户端随请求发送的唯一 ID，服务端可借此识别重试，并返回首次结果，而不是再次执行操作。',
  "A checkout sends a charge to the Payment Provider. In the Double charge Incident the provider slows by about 1.5 s, the charge Link times out, and a retry charges a card that the first attempt already charged, so those checkouts fail as duplicate. Research Idempotency keys (it needs Checkout) so a retried charge never charges twice. Without it, set the charge Link's retries to none to end the Incident.":
    '结账会向支付服务商发送扣款请求。在“重复扣款”故障中，服务商延迟增加约 1.5 秒，扣款链路超时，重试会对首次已经扣款的银行卡再次扣款，这些结账请求因此以重复扣款失败。研究“幂等键”（需要“结账”），就能保证重试扣款不再重复收费。没有这项研究时，将扣款链路的重试设为“无”即可结束故障。',
  "AWS Builders' Library: Making retries safe with idempotent APIs":
    'AWS 构建者文库：利用幂等 API 实现安全重试',
  'Stripe API: Idempotent requests': 'Stripe API：幂等请求',
  'RFC 9110: Idempotent methods': 'RFC 9110：幂等方法',
  'Inverted index': '倒排索引',
  'An index that maps each word to the list of documents that contain it, like the index at the back of a book. Full-text search engines such as Lucene and Elasticsearch use it, and PostgreSQL offers it as a GIN index. A search reads a few short lists instead of scanning every row.':
    '将每个词映射到包含该词的文档列表的索引，就像书末的索引。Lucene、Elasticsearch 等全文搜索引擎使用它，PostgreSQL 也提供 GIN 索引。搜索只需读取几个短列表，而不必扫描每一行。',
  'Until you place a Search Engine, the Database answers q-search itself, at 80 ms of CPU per search: ten times a normal read. The Full-text search Research unlocks the Search Engine, which answers 400 searches per second per size step in about 15 ms. Link it to your App Servers and search stops loading the Database.':
    '放置搜索引擎之前，数据库自行回答 q-search，每次搜索消耗 80 ms CPU 时间，是普通读取的十倍。“全文搜索”研究解锁搜索引擎，每个规格档位每秒能处理 400 次搜索，耗时约 15 ms。将它连接到应用服务器后，搜索就不再增加数据库负载。',
  'Stanford IR book: Building an inverted index': '斯坦福信息检索教材：构建倒排索引',
  'PostgreSQL docs: GIN indexes': 'PostgreSQL 文档：GIN 索引',
  'A just-in-time (JIT) compiler turns frequently run code into optimized machine code while the program runs. Until it has profiled and compiled the hot paths, a new process runs below its peak speed, so its first seconds or minutes are slow. The JVM and .NET warm up this way; tiered compilation and ahead-of-time profiles shorten the warmup.':
    '即时编译器（JIT）在程序运行时，将频繁执行的代码转为优化后的机器码。在完成热点路径的分析与编译前，新进程无法达到峰值速度，因此最初几秒或几分钟会较慢。JVM 和 .NET 都以这种方式预热；分层编译和提前收集的性能分析数据可以缩短预热时间。',
  'Each runtime has a start speed and a warmup time. A cold Tomcat (Java) App Server starts at 30% CPU speed and reaches full speed after 30 s; Kestrel (C#) starts at 60% and Node.js at 80% for 15 s, while Go, BEAM and Tokio start at full speed. Every restart, resize, Stack change, and new Autoscaler copy starts cold, so add capacity before a peak, not during it. PHP warms its OPcache instead: from 1× up to 2.5× CPU speed as the cache fills.':
    '每种运行时都有初始速度和预热时间。冷启动的 Tomcat（Java）应用服务器起初只有 30% 的 CPU 处理速度，30 秒后达到全速；Kestrel（C#）起初为 60%，Node.js 为 80%，持续 15 秒；Go、BEAM 和 Tokio 则从一开始就是全速。每次重启、调整规格、切换技术栈，以及自动扩缩容器新增副本都会从冷状态开始，因此要在高峰前增加容量，而不是高峰中才加。PHP 则预热 OPcache：随着缓存填满，CPU 处理速度从 1 倍提升至 2.5 倍。',
  'OpenJDK JEP 515: Ahead-of-Time Method Profiling': 'OpenJDK JEP 515：预先方法性能分析',
  'Microsoft: How tiered compilation works in OpenJDK': 'Microsoft：OpenJDK 中分层编译的工作原理',
  'Wikipedia: Just-in-time compilation': '维基百科：即时编译',
  "Replication with no single leader: a client sends each write to several replicas and reads from several, and a quorum decides. Amazon's Dynamo made the design well known, and Cassandra uses it. It keeps writing when some replicas fail, at the cost of reads that may be stale unless R + W > N.":
    '没有单一主节点的复制：客户端将每次写入发送给多个副本，也从多个副本读取，由法定数量决定结果。Amazon 的 Dynamo 让这种设计广为人知，Cassandra 也采用它。它能在部分副本故障时继续写入，代价是除非 R + W > N，否则可能读到过期数据。',
  'The Leaderless replication Research (after Sharding) unlocks the Wide-column Store. Each key lives on N replicas (1 to 5, default 3), a read asks R of them, and a write waits for W (default 1 and 1). With R + W > N every read sees the latest write; with less, some reads come back stale. A write costs N replica operations and a read costs R, out of 30,000 per second per size step, and if an Instance failure takes one replica, quorums that need every replica fail.':
    '“无主复制”研究（需先研究“分片”）解锁宽列存储。每个键保存在 N 个副本上（1 至 5，默认为 3），读取请求其中的 R 个，写入等待 W 个（R、W 默认均为 1）。R + W > N 时，每次读取都能看到最新写入；不足时，部分读取会返回过期数据。每次写入消耗 N 次副本操作，读取消耗 R 次，每个规格档位每秒可执行 30,000 次操作。如果“实例故障”导致一个副本不可用，需要全部副本参与的法定数量请求就会失败。',
  "Dynamo: Amazon's highly available key-value store": 'Dynamo：Amazon 的高可用键值存储',
  'Apache Cassandra docs: Dynamo': 'Apache Cassandra 文档：Dynamo',
  'In any stable system, the average number of items inside (L) equals the average arrival rate (λ) times the average time each item spends inside (W): L = λW. John Little proved it in 1961, and it holds whatever the arrival pattern or the service order. For a server, requests in flight = requests per second × seconds each request takes.':
    '在任何稳定系统中，系统内项目的平均数量（L）等于平均到达速率（λ）乘以每项在系统内停留的平均时间（W）：L = λW。John Little 于 1961 年证明了它，无论到达模式或处理顺序如何都成立。对服务器而言，在途请求数 = 每秒请求数 × 每个请求耗时的秒数。',
  'An App Server that holds a worker or a thread per request has a fixed number of slots, and each request holds its slot for its CPU time plus every database call it waits on. Slots in use = arrival rate × that time, so when each request waits 10 times as long on the Database, a PHP-FPM pool of 5 workers serves up to 10 times fewer requests. Fix the slow call, add workers or threads, or move to a runtime that waits without a slot (Node.js, Go, Kestrel, BEAM, Tokio).':
    '为每个请求占用一个工作进程或线程的应用服务器，拥有固定数量的槽位。每个请求占用槽位的时间包括 CPU 处理时间，以及等待所有数据库调用的时间。已用槽位 = 到达速率 × 该时间，因此当每个请求等待数据库的时间变为 10 倍时，拥有 5 个工作进程的 PHP-FPM 池能处理的请求数最多会降至十分之一。可以修复慢调用、增加工作进程或线程，或迁移到等待时不占槽位的运行时（Node.js、Go、Kestrel、BEAM、Tokio）。',
  'Little (1961): A proof for the queuing formula L = λW': 'Little（1961）：排队公式 L = λW 的证明',
  "Wikipedia: Little's law": '维基百科：利特尔定律',
  'A server that spreads incoming requests across a group of backend servers, and stops sending to a backend that fails its health check. It lets you add servers behind one address, and it decides which server gets each request.':
    '将传入请求分散到一组后端服务器，并停止向健康检查失败的后端发送请求的服务器。它让你能在一个地址后添加多台服务器，并决定每个请求交给哪一台。',
  "The Load Balancing Research unlocks the Load Balancer, which handles 2,000 requests per second per size step and adds 1 ms. By default it splits traffic by each App Server's capacity. It drops a dead host at its next health check, every 10 s by default, while DNS round robin keeps sending to a dead host. Load balancing algorithms adds least connections and power of two choices, and Health checks lets you check every 2 s or 30 s.":
    '“负载均衡”研究解锁负载均衡器，每个规格档位每秒处理 2,000 个请求，并增加 1 ms 延迟。默认按各应用服务器的容量分配流量。它会在下一次健康检查时移除宕机主机，默认每 10 秒检查一次；相比之下，DNS 轮询仍会向宕机主机发送请求。“负载均衡算法”新增最少连接和随机二选一，“健康检查”则允许改为每 2 秒或 30 秒检查一次。',
  'Cloudflare: What is load balancing?': 'Cloudflare：什么是负载均衡？',
  'Google SRE book: Load balancing in the datacenter': 'Google SRE 书籍：数据中心内的负载均衡',
  'NGINX: Using nginx as HTTP load balancer': 'NGINX：将 nginx 用作 HTTP 负载均衡器',
  'Rejecting some requests on purpose when a server is overloaded, so the requests it keeps finish in time instead of all of them timing out. Good shedding rejects early, before the work uses resources, and drops the least important or cheapest work first.':
    '服务器过载时，有意拒绝部分请求，让保留的请求能及时完成，而不是全部超时。良好的负载卸载会在工作消耗资源之前尽早拒绝，并优先丢弃最不重要或价值最低的工作。',
  'With Priority load shedding researched, you can turn on load shedding on an App Server. Above 90% load it drops whole request kinds, lowest value first (bots, then Realtime, then page views and up), until its load is back at 90%, so a $25 checkout survives an overload. Dropped requests count as errors and spend the error budget, but the requests it keeps stay fast.':
    '完成“按优先级卸载负载”研究后，可以在应用服务器上开启负载卸载。负载超过 90% 时，它会按价值从低到高整类丢弃请求（先机器人，再实时连接，再页面浏览，依此类推），直到负载回到 90%，让价值 $25 的结账请求能在过载时幸存。被丢弃的请求计为错误，会消耗错误预算，但保留下来的请求仍然很快。',
  "AWS Builders' Library: Using load shedding to avoid overload":
    'AWS 构建者文库：利用负载卸载避免过载',
  'Google SRE book: Handling overload': 'Google SRE 书籍：处理过载',
  'Google SRE book: Addressing cascading failures': 'Google SRE 书籍：应对级联故障',
  'Memory that a long-running process keeps allocated but no longer uses, so its memory use grows with uptime. In garbage-collected languages a leak is usually an object that stays reachable by mistake, such as a cache that only grows or a listener nobody removes. The process slows as it swaps or collects garbage, and the operating system kills it when memory runs out.':
    '长时间运行的进程仍保留分配、却不再使用的内存，使内存用量随运行时间增长。在使用垃圾回收的语言中，泄漏通常是对象因疏忽始终可达，例如只增不减的缓存或从未移除的监听器。进程会因使用交换空间或垃圾回收而变慢，内存耗尽时则会被操作系统终止。',
  'The Memory leak Incident hits an App Server whose runtime keeps its processes between requests (every runtime but Apache mod_php and PHP-FPM). It gains 2.5% of its RAM each second; past its RAM it swaps and slows, and at 125% of RAM the kernel kills it and it restarts cold. Restart the server to free the memory, or ship the Fix memory leak task (15 Dev Hours), which stops leaks until the next Feature ships.':
    '“内存泄漏”故障会影响在请求间保留进程的应用服务器运行时（除 Apache mod_php 和 PHP-FPM 外的所有运行时）。泄漏每秒增加相当于 RAM 2.5% 的内存占用；超出 RAM 后会使用交换空间并变慢，达到 RAM 的 125% 时，内核会终止进程，随后冷启动重启。重启服务器可以释放内存；也可以完成并发布“修复内存泄漏”任务（15 开发工时），在下一个功能发布前阻止泄漏。',
  'Wikipedia: Memory leak': '维基百科：内存泄漏',
  'Node.js Learn: Memory diagnostics': 'Node.js 学习：内存诊断',
  'Oracle Java docs: Troubleshoot memory leaks': 'Oracle Java 文档：排查内存泄漏',
  'A failure that keeps itself going after its trigger is gone. A short slowdown pushes the system into a bad state, and a feedback loop, most often retries, keeps the load above capacity, so the system stays down until someone cuts the load. Bronson and others named this class of failure in 2021.':
    '触发因素消失后仍能自我维持的故障。短暂变慢使系统陷入不良状态，反馈循环（最常见的是重试）让负载持续高于容量，系统因而一直不可用，直到有人削减负载。Bronson 等人于 2021 年为这类故障命名。',
  'The Retry storm Incident slows the Database to 30% of its capacity for 20 s. Links that retry at once send up to 1 + f + f² + f³ calls per call when a share f fails, they carry that failure share into the next Step, and the Database queues what it cannot take; the Incident ends only when that backlog drains. Backoff with jitter, Circuit breakers, and Priority load shedding each break the loop, and naive retries into a Database make this Incident 6 times as likely as backoff does.':
    '“重试风暴”故障会使数据库容量降至 30%，持续 20 秒。若失败比例为 f，立即重试的链路会将每次调用放大为最多 1 + f + f² + f³ 次，并把该失败比例带入下一个模拟步；数据库会将无法处理的请求排队，只有这些积压清空后故障才结束。带抖动的退避、熔断器和按优先级卸载负载都能打破循环；相比退避，对数据库进行无脑重试会让此故障发生的可能性变为 6 倍。',
  'Bronson et al. (HotOS 2021): Metastable failures in distributed systems':
    'Bronson 等（HotOS 2021）：分布式系统中的亚稳态故障',
  'Huang et al. (OSDI 2022): Metastable failures in the wild':
    'Huang 等（OSDI 2022）：真实环境中的亚稳态故障',
  'Marc Brooker: Metastability and distributed systems': 'Marc Brooker：亚稳态与分布式系统',
  'Model inference': '模型推理',
  'Running a trained machine learning model to produce an answer, as opposed to training it. For a large language model, a GPU generates the answer token by token, so cost and speed are measured in tokens per second and time to the first token. You can rent GPUs and serve the model yourself, or pay a hosted API per token.':
    '运行已训练的机器学习模型来生成答案，与训练模型相对。对大语言模型而言，GPU 逐个生成 token，因此成本与速度用每秒 token 数和首个 token 延迟衡量。你可以租用 GPU 自行部署模型，也可以调用托管 API，按 token 付费。',
  'An ai request sends one prompt of 400 tokens to an inference Node. The LLM API (Hosted models Research) needs no GPUs: it costs $2.50 per 1,000 tokens, takes 600 ms to the first token, and throttles prompts above 100 per second per usage tier. A GPU Node (Model serving Research) takes 300 ms to the first token and generates 200 tokens per second per T4, 900 per A100, or 2,000 per H100. Its Burn is the same whether it is busy or idle, so an H100 is cheaper than the LLM API only while it stays about two-thirds busy.':
    '一次 ai 请求会将一个 400 token 的提示发送给推理节点。LLM API（通过“托管模型”研究解锁）无需 GPU：每 1,000 token 收费 $2.50，首个 token 延迟为 600 ms，每个用量档位每秒超过 100 个提示时就会限流。GPU 节点（通过“模型服务”研究解锁）的首个 token 延迟为 300 ms，每块 T4 每秒生成 200 token，A100 为 900，H100 为 2,000。无论繁忙还是空闲，其支出都一样，因此 H100 只有保持约三分之二的繁忙程度时，才比 LLM API 便宜。',
  'Cloudflare: AI inference vs. training': 'Cloudflare：AI 推理与训练的区别',
  'vLLM documentation': 'vLLM 文档',
  'PagedAttention paper (vLLM)': 'PagedAttention 论文（vLLM）',
  'Mean time to restore (or recover): the average time from the start of a failure until the service works again. It measures how fast a team detects, diagnoses, and fixes problems. DORA now measures a narrower version, failed deployment recovery time.':
    '平均恢复时间：从故障开始到服务恢复正常的平均时长，衡量团队发现、诊断和修复问题的速度。DORA 现在采用范围更窄的指标：失败部署恢复时间。',
  "Every Incident ends with a Postmortem that shows its MTTR: the calendar minutes in which more than 1% of requests failed. An Incident that has hurt users more than half the time by its halfway point escalates one severity and runs 1.5 times as long. Keep MTTR down by acting fast: restart, replace, or fail over the hit Node, and research the Postmortem's action item.":
    '每次故障结束后都会生成复盘，显示其 MTTR：请求失败率超过 1% 的日历分钟数。如果故障进展到一半时，超过一半的已过时间都在伤害用户，严重程度会提升一级，持续时间也会变为 1.5 倍。迅速行动可以降低 MTTR：重启、替换受影响节点，或执行故障转移，并研究复盘提出的行动项。',
  'Wikipedia: Mean time to recovery': '维基百科：平均恢复时间',
  'Laravel, Rails, and Django use an ORM that sends 3 read queries where 1 would do, on page views and API reads. A page view then costs the Database 6 reads instead of 2, which adds CPU there and waiting time on the App Server. Research Eager loading, then ship the Eager loading task (10 Dev Hours) to remove them; Symfony and the light frameworks never make them.':
    'Laravel、Rails 和 Django 使用的 ORM 会在页面浏览和 API 读取中，将本可 1 次完成的读取变成 3 次。一次页面浏览因此让数据库执行 6 次读取而非 2 次，既增加数据库 CPU 开销，也延长应用服务器的等待时间。研究“预先加载”，再完成并发布“预先加载”任务（10 开发工时），即可消除这些多余查询；Symfony 和轻量框架从一开始就不会产生它们。',
  'Rails Guides: Eager loading associations': 'Rails 指南：预先加载关联',
  'Django docs: select_related': 'Django 文档：select_related',
  'Laravel docs: Eager loading': 'Laravel 文档：预先加载',
  'A network failure that splits a system into groups of nodes that cannot reach each other, while each group keeps running. During a partition a distributed system must choose between staying available and staying consistent (the CAP theorem).':
    '将系统划分成互相无法访问的多组节点、但各组仍继续运行的网络故障。网络分区期间，分布式系统必须在可用性和一致性之间作出选择（CAP 定理）。',
  'The Network partition Incident can start in Series C when Links cross regions. For up to 45 s every call between regions times out, except calls from Users and to global Components such as the CDN, and leader-based writes diverge. Press Fence leader to end it. A Distributed SQL Node, which keeps one Raft leader, makes the Incident less likely.':
    '当链路跨越区域时，“网络分区”故障从 C 轮起可能发生。最长 45 秒内，所有跨区域调用都会超时，但来自用户或发往 CDN 等全局组件的调用除外；基于主节点的写入还会发生分歧。点击“隔离主节点”即可结束故障。分布式 SQL 节点维持唯一的 Raft 主节点，可以降低此故障的发生概率。',
  'ACM Queue: The Network is Reliable': 'ACM Queue：网络是可靠的',
  'InfoQ: CAP Twelve Years Later': 'InfoQ：十二年后的 CAP',
  'Storage that keeps files as objects in a flat namespace, each with a key, the data, and metadata, reached over an HTTP API. Services such as Amazon S3 scale almost without limit and charge for the bytes stored and moved. It suits uploads, images, video, and backups that a database handles badly.':
    '在扁平命名空间中以对象形式保存文件的存储，每个对象包含键、数据和元数据，通过 HTTP API 访问。Amazon S3 等服务几乎可以无限扩展，按存储和传输的字节数收费。它适合存放数据库不擅长处理的上传文件、图片、视频和备份。',
  'Until you place Object Storage, the Database stores uploads as rows: each 2 MB blob-put costs it 60 ms of CPU. The Object storage Research unlocks Object Storage, which takes uploads and file reads with no capacity limit and 40 ms of latency. Its Burn grows with every GB stored, at the S3 Standard price, so the bill keeps rising as users upload.':
    '放置对象存储之前，数据库以行的形式存储上传文件：每个 2 MB 的 blob-put 消耗 60 ms CPU 时间。“对象存储”研究解锁对象存储，以 40 ms 延迟处理上传和文件读取，没有容量上限。其支出按 S3 Standard 价格随存储的 GB 数增长，因此用户不断上传时，账单也会持续上升。',
  'AWS: What is Amazon S3?': 'AWS：什么是 Amazon S3？',
  'Cloudflare: What is object storage?': 'Cloudflare：什么是对象存储？',
  'How well you can understand what a system is doing from the data it emits, usually logs, metrics, and traces. Good observability lets you answer new questions about a failure without shipping new code.':
    '通过系统输出的数据（通常是日志、指标和调用链）理解其运行状态的能力。良好的可观测性，让你无需发布新代码就能回答关于故障的新问题。',
  'Observability Research shows you more of the Ledger. Structured logs split errors by cause, Metrics adds history graphs to every Node, Percentiles shows p50, p95, and p99, and Alerting raises a pager banner when errors, p99, or saturation cross a threshold. The Analytics Node samples the traffic of Nodes that you link into it, from 1% to 100%, and turns it into Insight. Each sample teaches more as Apdex falls, up to twice as much, and a higher sample rate costs more CPU and Burn. Metrics also opens the Dashboard (D), which charts your Design over time.':
    '可观测性研究让你看到更多运行账目。“结构化日志”按原因拆分错误，“指标”为每个节点增加历史图表，“百分位数”显示 p50、p95 和 p99，“告警”则会在错误、p99 或饱和度超过阈值时显示呼叫横幅。分析节点对连接给它的节点流量进行采样，采样率为 1% 至 100%，并将其转化为洞察。Apdex 越低，每个样本带来的收获越多，最多翻倍；更高采样率则消耗更多 CPU 和支出。“指标”也会解锁仪表盘（D），绘制架构随时间变化的曲线。',
  'OpenTelemetry: Observability primer': 'OpenTelemetry：可观测性入门',
  'Online transaction processing (OLTP) runs many small, fast reads and writes on current rows, such as orders and logins. Online analytical processing (OLAP) runs few large scans and aggregations over history, such as reports. OLTP databases store each row together; OLAP engines usually store each column together, so a scan reads only the columns it needs.':
    '在线事务处理（OLTP）针对当前数据行执行大量小型、快速的读写，例如订单和登录。在线分析处理（OLAP）则针对历史数据执行少量大型扫描和聚合，例如报表。OLTP 数据库按行存储；OLAP 引擎通常按列存储，因此扫描只读取所需的列。',
  "Report requests send q-scan queries. On the Database a scan costs a lot of CPU and evicts its buffer cache, so other reads go to disk and writes wait; the Report kills the database Incident scans 10 times as much. A Data Warehouse (Data warehousing research) takes the scans off the primary: 1.5 s each, no capacity limit, and $0.02 per scan times the Era's cost index.":
    '报表请求会发送 q-scan 查询。在数据库上，扫描消耗大量 CPU，并挤出缓冲缓存中的数据，导致其他读取访问磁盘、写入排队；“报表压垮数据库”故障会使扫描量变为 10 倍。数据仓库（通过“数据仓库技术”研究解锁）将扫描从主库移走：每次耗时 1.5 秒，没有容量上限，每次扫描收费 $0.02，再乘以当前阶段的成本指数。',
  'AWS: OLTP vs OLAP': 'AWS：OLTP 与 OLAP 的区别',
  'Wikipedia: Online analytical processing': '维基百科：在线分析处理',
  'Wikipedia: Online transaction processing': '维基百科：在线事务处理',
  'Operating margin': '营业利润率',
  'Operating profit as a share of revenue: (revenue − operating costs) / revenue. Operating costs include hosting, salaries, and fees. It shows how much of each dollar of revenue the business keeps after it pays to run itself.':
    '营业利润占收入的比例：（收入 − 运营成本）/ 收入。运营成本包括托管、工资和手续费。它显示公司在支付运营费用后，每赚一美元能留下多少。',
  "The game's margin is (revenue − Burn) / revenue, where Burn is the cloud bill plus salaries, Egress, and third-party fees; with no revenue it reads −100%. Margin plus annual user growth is your Rule of 40, which sets the valuation multiple: 4 + 0.15 × the Rule of 40, from 2 to 30. In the Public Era you set margin guidance of 10%, 20%, or 30% each quarter, and a beat raises the multiple while a miss lowers it.":
    '游戏中的利润率为（收入 − 支出）/ 收入，其中支出包括云账单、工资、出站流量和第三方费用；没有收入时显示为 −100%。利润率加上年化用户增长率，即为“40 法则”得分，它决定估值倍数：4 + 0.15 × 40 法则得分，最低 2 倍，最高 30 倍。上市后，每季度需要设定 10%、20% 或 30% 的利润率指引，超出指引会提高估值倍数，未达指引则会降低。',
  'Investopedia: Operating margin': 'Investopedia：营业利润率',
  'The value below which a given share of measurements fall. The p50 (median) latency is what a typical request sees; the p99 is the latency that 99% of requests beat, so 1 request in 100 is slower. Averages hide slow outliers, so SLOs and alerts usually use high percentiles.':
    '一定比例的测量值低于的数值。p50（中位数）延迟反映典型请求的体验；p99 是 99% 的请求都能低于的延迟，即每 100 个请求中有 1 个更慢。平均值会掩盖特别慢的异常请求，因此 SLO 和告警通常使用高百分位数。',
  "Before Percentiles research the HUD shows mean latency; after it, the HUD shows the p99 and each request kind shows its p50, p95, and p99. Event-loop stalls and GC pauses hit about 2% of requests, so they raise the p99 while the mean and the p95 barely move. With Alerting, the latency rule pages you when a kind's p99 stays above 4 times its Apdex target for 30 s. The Latency chart on the Dashboard draws the p99 next to the mean, so you can see how much the mean hides.":
    '研究“百分位数”之前，HUD 显示平均延迟；研究之后，HUD 显示 p99，各请求类型会显示 p50、p95 和 p99。事件循环阻塞和 GC 停顿影响约 2% 的请求，因此会拉高 p99，而平均值和 p95 几乎不动。完成“告警”研究后，某类请求的 p99 连续 30 秒超过其 Apdex 目标的 4 倍时，延迟规则就会呼叫你。仪表盘的延迟图会同时绘制 p99 和均值，让你看清平均值掩盖了多少问题。',
  'Google SRE book: Service level objectives': 'Google SRE 书籍：服务等级目标',
  'Wikipedia: Percentile': '维基百科：百分位数',
  'Restoring a database to its exact state at a chosen moment, by loading a base backup and then replaying the write-ahead log up to that time. Because the log is archived continuously, you lose only the last few minutes of writes, not a whole day.':
    '加载基础备份，再重放预写式日志到指定时间，将数据库恢复到所选时刻的准确状态。由于日志持续归档，最多只会丢失最后几分钟的写入，而非一整天。',
  "The Point-in-time recovery Research adds Backups to the Database card: None, Nightly, or PITR. Nightly snapshots can lose a calendar day of writes and add 5% to the Database's Burn. PITR loses about 2 calendar minutes and adds 15%. The DR drill for the IPO checklist reads this RPO and passes only under 5 minutes, unless a replica in another region already covers the data.":
    '“时间点恢复”研究为数据库卡片增加备份选项：无、每夜备份或 PITR。每夜快照最多可能丢失一个日历日的写入，数据库支出增加 5%；PITR 约丢失 2 个日历分钟的写入，支出增加 15%。IPO 清单的灾难恢复演练会检查此 RPO，只有低于 5 分钟才算通过，除非另一区域的副本已经覆盖这些数据。',
  'PostgreSQL docs: Continuous archiving and PITR': 'PostgreSQL 文档：持续归档与 PITR',
  'AWS: Restoring an RDS instance to a specified time': 'AWS：将 RDS 实例恢复到指定时间',
  "A load balancing method: pick two servers at random and send the request to the less loaded one. Mitzenmacher showed that two random choices spread load exponentially better than one, and the balancer needs no exact, shared view of every server's load. NGINX offers it as random two least_conn.":
    '一种负载均衡方式：随机挑选两台服务器，将请求发送给负载较低的一台。Mitzenmacher 证明，相比随机选一台，随机二选一的负载分散效果有指数级提升，而且均衡器无需精确、共享地掌握所有服务器的负载。NGINX 将此方式提供为 random two least_conn。',
  "With Load balancing algorithms researched, a Load Balancer can use Two choices. It keeps no global state, so the Load Balancer itself handles 1.5 times the traffic, but 10% of the traffic is split evenly whatever each server's load. Least conn splits fully by current capacity, without the capacity bonus.":
    '完成“负载均衡算法”研究后，负载均衡器可以使用“随机二选一”。它不维护全局状态，因此负载均衡器自身可处理 1.5 倍流量，但其中 10% 的流量会无视各服务器的负载而平均分配。“最少连接”完全按当前容量分配，却没有容量加成。',
  'Mitzenmacher (2001): The power of two choices in randomized load balancing':
    'Mitzenmacher（2001）：随机负载均衡中二选一的力量',
  'NGINX docs: upstream module (random)': 'NGINX 文档：upstream 模块（random）',
  'A server design where a master process starts a fixed pool of worker processes ahead of time, and each worker handles one request at a time. Apache prefork, PHP-FPM, and Gunicorn work this way. It isolates requests well, but every worker costs memory, and a request that waits holds its worker.':
    '一种服务器设计：主进程预先启动固定数量的工作进程，每个工作进程一次处理一个请求。Apache prefork、PHP-FPM 和 Gunicorn 都采用此方式。它能很好地隔离请求，但每个工作进程都占内存，等待中的请求也会一直占用工作进程。',
  "PHP-FPM and Python's Gunicorn run a pool of workers that you size from 1 to 400 on the App Server card; PHP-FPM starts with 5. Each worker takes one request, so slow database calls fill the pool, and each worker costs RAM (120 MB in Gunicorn), so a big pool can swap. PHP-FPM's Static mode keeps the whole pool resident. Dynamic and On demand modes save memory but make 2% or 10% of requests wait 20 or 50 ms for a fork.":
    'PHP-FPM 和 Python 的 Gunicorn 运行一组工作进程，可在应用服务器卡片上设为 1 至 400 个；PHP-FPM 初始为 5 个。每个进程处理一个请求，因此慢数据库调用会占满进程池。每个进程都消耗 RAM（Gunicorn 为 120 MB），所以池太大会开始使用交换空间。PHP-FPM 的“静态”模式让整个池常驻内存；“动态”和“按需”模式节省内存，但会让 2% 或 10% 的请求分别等待 20 或 50 ms 来创建进程。',
  'Gunicorn docs: Design': 'Gunicorn 文档：设计',
  'Apache HTTP Server: prefork MPM': 'Apache HTTP Server：prefork MPM',
  'PHP manual: FPM configuration': 'PHP 手册：FPM 配置',
  'A server model in which each request in flight occupies a whole worker process until it finishes, as in Apache prefork with mod_php, PHP-FPM, and Gunicorn sync workers. It isolates requests well, but every waiting request holds a process and its memory, so the pool size and the RAM cap how many requests run at once.':
    '一种服务器模型：每个在途请求在完成前独占一个工作进程，例如带 mod_php 的 Apache prefork、PHP-FPM，以及 Gunicorn 的同步工作进程。它能很好地隔离请求，但每个等待中的请求都会占住进程及其内存，因此进程池大小和 RAM 限制了同时运行的请求数。',
  "Apache mod_php, the starting runtime, runs a process per request in flight, up to 150, each 60 MB because it embeds PHP, so RAM runs out early. PHP-FPM and Gunicorn run a fixed pool that you size (PHP-FPM ships with 5 workers); a request holds its worker while it waits on the Database, and a pool too big for the box swaps until the kernel kills it. Each process also holds its own database connection, so a big pool can hit Postgres's 100-connection limit.":
    '初始运行时 Apache mod_php 为每个在途请求运行一个进程，最多 150 个；由于内嵌 PHP，每个进程占用 60 MB，RAM 很快就会耗尽。PHP-FPM 和 Gunicorn 运行由你设定大小的固定进程池（PHP-FPM 初始为 5 个工作进程）；请求等待数据库时仍占用进程，池超出机器承受能力时会使用交换空间，直到被内核终止。每个进程还有自己的数据库连接，因此大进程池也可能触及 Postgres 的 100 连接上限。',
  'Apache HTTP Server: MPM prefork': 'Apache HTTP Server：MPM prefork',
  'PHP manual: FastCGI Process Manager (FPM)': 'PHP 手册：FastCGI 进程管理器（FPM）',
  'Apache Cassandra docs: Tunable consistency': 'Apache Cassandra 文档：可调一致性',
  'DeCandia et al. (2007): Dynamo': 'DeCandia 等（2007）：Dynamo',
  'Wikipedia: Quorum (distributed computing)': '维基百科：法定数量（分布式计算）',
  'A consensus algorithm that keeps a replicated log identical on a group of servers. An elected leader appends each entry and commits it once a majority has stored it, so the group keeps working when a minority fails and never commits two different values. Ongaro and Ousterhout designed it in 2014 to be easier to understand than Paxos; etcd and CockroachDB use it.':
    '让一组服务器上的复制日志始终一致的共识算法。选出的主节点追加每个条目，多数节点存储后才提交，因此少数节点故障时仍能工作，也绝不会提交两个不同的值。Ongaro 和 Ousterhout 于 2014 年设计它，希望使其比 Paxos 更容易理解；etcd 和 CockroachDB 都使用它。',
  'Distributed SQL (Consensus databases research, which needs Synchronous replication) runs SQL on Raft. Every write waits for the round trip to a majority of the regions it spreads over, while a read asks the leaseholder and costs a quarter of a write. It serves 6,000 transactions per second at size 1 and keeps one leader through a Network partition, so that Incident is a quarter as likely with it.':
    '分布式 SQL（通过“共识数据库”研究解锁，前置为“同步复制”）基于 Raft 运行 SQL。每次写入都等待所分布区域中多数区域的往返响应，读取则询问租约持有者，成本为写入的四分之一。规格 1 时每秒处理 6,000 个事务，并在网络分区期间保持唯一主节点，因此使用它会让该故障的发生概率降至四分之一。',
  'The Raft consensus algorithm': 'Raft 共识算法',
  'Ongaro and Ousterhout (2014): In search of an understandable consensus algorithm':
    'Ongaro 和 Ousterhout（2014）：寻找一种易于理解的共识算法',
  'CockroachDB docs: Replication layer': 'CockroachDB 文档：复制层',
  'Capping how many requests a client can make in a period and rejecting the rest, often with HTTP 429 Too Many Requests. It protects a service from abuse, scrapers, and one noisy client, and lets a provider share capacity fairly. Common algorithms are the token bucket, the leaky bucket, and fixed or sliding windows.':
    '限制客户端在一段时间内可发起的请求数，并拒绝超出的请求，通常返回 HTTP 429“请求过多”。它保护服务免受滥用、爬虫和单个高负载客户端的影响，也让服务商公平分配容量。常见算法包括令牌桶、漏桶，以及固定窗口或滑动窗口。',
  'You meet rate limiting from the client side: the LLM API takes 100 prompts per second per usage tier, and past that, prompts fail at once as throttled. The game has no rate limiter you can put in front of your own App Servers. To stop abusive traffic, a WAF blocks bots by rule instead: 80% of bots at paranoia 2, with 0.5% of real users blocked too.':
    '你会以客户端身份遇到限流：LLM API 每个用量档位每秒接受 100 个提示，超出部分立即因限流失败。游戏没有可放在自己应用服务器前的限流器。要拦截滥用流量，WAF 会改用规则阻止机器人：严格级别 2 下拦截 80% 的机器人，也会误拦 0.5% 的真实用户。',
  'Cloudflare Learning Center: What is rate limiting?': 'Cloudflare 学习中心：什么是限流？',
  'MDN: 429 Too Many Requests': 'MDN：429 请求过多',
  'RFC 6585: Additional HTTP status codes': 'RFC 6585：补充 HTTP 状态码',
  "A copy of a database that follows the primary's writes and answers read-only queries. It takes read load off the primary. Replication is usually asynchronous, so a replica can lag behind and return data that is a little old.":
    '跟随主库写入、回答只读查询的数据库副本。它能减轻主库的读取负载。复制通常是异步的，因此副本可能落后，返回稍旧的数据。',
  'The Read replicas Research unlocks the Read Replica, which runs like a Database but answers only q-read. It lags 20 ms plus 2 ms for each write per second, and up to 15% of its reads come back stale; a Replication lag Incident makes the lag ten times larger. Read-your-writes routing sends reads that follow a write to the primary. A replica in another region also limits how much data you lose if the home region fails.':
    '“只读副本”研究解锁只读副本节点，其运行方式类似数据库，但只回答 q-read。复制延迟为 20 ms 加上每秒每次写入带来的 2 ms，最多有 15% 的读取返回过期数据；“复制延迟”故障会将延迟放大 10 倍。“读己之写路由”将写入后的读取发往主库。另一区域的副本还能在本土区域故障时限制数据丢失量。',
  'AWS: Amazon RDS read replicas': 'AWS：Amazon RDS 只读副本',
  'PostgreSQL docs: Hot standby': 'PostgreSQL 文档：热备',
  "A session guarantee: after a client writes, its own later reads see that write or a newer one, even if other clients still see old data. It matters when reads go to replicas that lag behind the primary; a common fix sends a user's reads to the primary for a short time after they write. Terry and others defined it in 1994.":
    '一种会话保证：客户端写入后，自己后续的读取能看到该次写入或更新的值，即使其他客户端仍看到旧数据。当读取发往落后于主库的副本时，这一点尤其重要；常见的解决方式是让用户写入后的一小段时间内，读取都发往主库。Terry 等人于 1994 年定义了它。',
  'A Read Replica lags behind the primary, so some reads come back stale, and a stale read fails an API read or a checkout that reads its own write. With Read-your-writes routing researched, turn the option on an App Server: checkout reads go to the primary and are never stale, and other stale reads fall by 80%. It also makes the Replication lag Incident much rarer (weight 0.3 instead of 2).':
    '只读副本落后于主库，因此部分读取会返回过期数据，导致 API 读取或需要读取自身写入结果的结账请求失败。研究“读己之写路由”后，在应用服务器上开启该选项：结账读取会发往主库，永不过期，其他过期读取则减少 80%。它还会大幅降低“复制延迟”故障的频率（权重从 2 降至 0.3）。',
  'Jepsen: Read your writes': 'Jepsen：读己之写',
  'Terry et al. (1994): Session guarantees for weakly consistent replicated data':
    'Terry 等（1994）：弱一致性复制数据的会话保证',
  "Rate, Errors, and Duration for each service: how many requests it gets, how many fail, and how long they take. It measures what users feel, so alerts watch it. Tom Wilkie named it as a service-level version of Google's four golden signals.":
    '各服务的请求速率（Rate）、错误（Errors）和耗时（Duration）：接收多少请求、多少失败，以及耗时多久。它衡量用户的实际感受，因此告警会监测它。Tom Wilkie 为它命名，将其作为 Google 四大黄金信号的服务级版本。',
  'The Dashboard (D) opens after Metrics research. Its Golden signals row charts traffic, latency, and, with Structured logs, errors for your whole system over time. A per-Service RED row is not built yet; use the Golden signals row to see when users started to suffer.':
    '完成“指标”研究后可打开仪表盘（D）。“黄金信号”一行绘制整个系统的流量、延迟随时间变化的曲线，研究“结构化日志”后还会显示错误。目前尚未提供按服务划分的 RED 行；请用黄金信号一行查看用户从何时开始受到影响。',
  'Grafana Labs: The RED method': 'Grafana Labs：RED 方法',
  'ReDoS (regular expression denial of service)': 'ReDoS（正则表达式拒绝服务）',
  'A denial of service where a crafted input makes a backtracking regular expression engine take exponential or very long time. One bad pattern can pin a CPU core per request.':
    '精心构造的输入使回溯型正则表达式引擎耗费指数级或极长时间的拒绝服务攻击。一个糟糕的模式就能让每个请求占满一个 CPU 核心。',
  'The Regex backtracking Incident can start from Series B when you run a WAF. A new WAF rule backtracks on long inputs, and every WAF keeps only 10% of its capacity, so traffic through it fails or queues. Press Disable rule on the WAF to end it at once. In real systems, a canary rollout of rules catches this before it reaches every server.':
    '运行 WAF 时，“正则回溯”故障从 B 轮起可能发生。一条新 WAF 规则会在长输入上大量回溯，使每个 WAF 的容量只剩 10%，通过它的流量会失败或排队。点击 WAF 上的“禁用规则”，即可立即结束故障。在真实系统中，对规则进行金丝雀发布，可以在问题蔓延到所有服务器之前将其发现。',
  'OWASP: Regular expression Denial of Service': 'OWASP：正则表达式拒绝服务',
  'Cloudflare blog: Details of the outage on July 2, 2019':
    'Cloudflare 博客：2019 年 7 月 2 日故障详情',
  "The delay between a write committing on the primary database and that write appearing on a replica. An asynchronous replica applies the primary's log after the fact, so the lag grows with write volume, long-running queries on the replica, and network delay. Reads from a lagging replica return old data.":
    '写入在主数据库提交后，到该次写入出现在副本上的延迟。异步副本事后才应用主库日志，因此写入量、副本上的长查询和网络延迟都会增加复制延迟。从落后的副本读取会返回旧数据。',
  'A Read Replica lags 20 ms plus 2 ms for every write per second, and the share of its reads that come back stale equals the lag in seconds, up to 15%. The Replication lag Incident multiplies the lag by 10, up to 50% stale reads. Stale reads fail API reads and checkouts, while page views accept them; Read-your-writes routing sends the reads that care to the primary.':
    '只读副本的延迟为 20 ms 加上每秒每次写入带来的 2 ms，其过期读取比例等于以秒计的延迟，最高 15%。“复制延迟”故障会将延迟放大 10 倍，过期读取最高达 50%。过期读取会使 API 读取和结账失败，而页面浏览可以接受；“读己之写路由”会将介意过期数据的读取发往主库。',
  'Amazon RDS docs: Working with read replicas': 'Amazon RDS 文档：使用只读副本',
  'Retrying a failed call after a wait that grows with each attempt (exponential backoff), with a random spread (jitter), so clients that failed together do not retry together. A retry budget or cap limits how many extra calls retries may add, so retries cannot multiply the load on a service that is already struggling.':
    '失败调用在等待一段时间后重试，每次等待时间递增（指数退避），并加入随机偏移（抖动），让同时失败的客户端不会同时重试。重试预算或次数上限限制重试带来的额外调用，避免重试成倍放大本已不堪重负的服务负载。',
  "Before Timeouts and retries research, every Link waits 30 s and never retries. After it, you set each Link's timeout to 1, 5, or 30 s and can turn on retries: naive retries fire at once, up to three times, so a callee where a share f fails gets 1 + f + f² + f³ calls per call. Backoff with jitter waits about 200 ms per retry and allows at most 10% extra calls, which keeps a Retry storm small.":
    '研究“超时与重试”之前，每条链路等待 30 秒，且永不重试。研究之后，可将各链路超时设为 1、5 或 30 秒，并开启重试：朴素重试会立即执行，最多三次，因此失败比例为 f 的被调用方，每次调用会收到 1 + f + f² + f³ 次调用。带抖动的退避每次重试等待约 200 ms，额外调用最多增加 10%，因此能让重试风暴保持较小规模。',
  "AWS Builders' Library: Timeouts, retries, and backoff with jitter":
    'AWS 构建者文库：超时、重试与带抖动的退避',
  'AWS Architecture Blog: Exponential backoff and jitter': 'AWS 架构博客：指数退避与抖动',
  'The recovery point objective (RPO) is the most recent data you can afford to lose in a disaster, measured as time before the failure. The recovery time objective (RTO) is the longest the service can stay down before it must work again. Together they decide how much backup, replication, and standby capacity a system needs.':
    '恢复点目标（RPO）是灾难中最多可以承受丢失多长时间内的数据，以故障发生前的时间长度计。恢复时间目标（RTO）是服务恢复正常前，最多可以接受的停机时长。两者共同决定系统需要多少备份、复制和备用容量。',
  "A Database's backups set its RPO: None loses everything, Nightly up to 1,440 calendar minutes, and PITR (Point-in-time recovery research) 2 minutes. A Read Replica in another region lowers it to that replica's lag, and a spread Wide-column Store or Distributed SQL loses nothing. The IPO checklist's DR drill fails the home region and passes only when errors fall under 1% within 60 calendar minutes (RTO) and the RPO is under 5 minutes.":
    '数据库的备份方式决定 RPO：无备份会丢失全部数据，每夜备份最多丢失 1,440 个日历分钟，PITR（需“时间点恢复”研究）丢失 2 分钟。另一区域的只读副本将其降至该副本的复制延迟；分散部署的宽列存储或分布式 SQL 则不会丢失数据。IPO 清单的灾难恢复演练会使本土区域故障，只有错误率在 60 个日历分钟内降至 1% 以下（RTO），且 RPO 低于 5 分钟，才算通过。',
  'AWS whitepaper: Disaster recovery of workloads (RPO and RTO)':
    'AWS 白皮书：工作负载的灾难恢复（RPO 与 RTO）',
  'PostgreSQL docs: Continuous archiving and point-in-time recovery':
    'PostgreSQL 文档：持续归档与时间点恢复',
  'A heuristic for software-as-a-service companies: annual revenue growth rate plus profit margin, both in percent, should be at least 40. It lets you compare a fast-growing, loss-making company with a slow, profitable one on one number. Investors often pay higher valuation multiples to companies above 40.':
    '面向软件即服务公司的经验法则：年收入增长率加利润率（均以百分比计）应至少达到 40。它用一个数字，让你可以比较高速增长但亏损的公司与增长缓慢但盈利的公司。得分超过 40 的公司通常能获得投资者更高的估值倍数。',
  'Your Valuation is annual revenue times a multiple set by the Rule of 40: 4 + 0.15 × the score, kept between 2 and 30. The game scores user growth over the last calendar week, annualized, plus margin, which is (Revenue − Burn) / Revenue. A score of 40 or more is an IPO checklist item, so cut Burn or grow faster before you go public.':
    '估值等于年收入乘以“40 法则”决定的倍数：4 + 0.15 × 得分，限制在 2 至 30 之间。游戏使用最近一个日历周的用户增长率进行年化，再加上利润率，即（收入 − 支出）/ 收入。得分达到 40 是 IPO 清单中的一项，因此上市前要削减支出，或加快增长。',
  'Wikipedia: Rule of 40': '维基百科：40 法则',
  'McKinsey: SaaS and the Rule of 40': 'McKinsey：SaaS 与 40 法则',
  'Splitting one dataset across several databases (shards) by a key, such as a hash of the user ID, so each shard stores and serves only part of the data. It scales writes and storage past one machine, but a query that spans shards must ask all of them, and one hot key can overload its shard while the others idle.':
    '按照键（例如用户 ID 的哈希）将一个数据集拆分到多个数据库（分片），让每个分片只存储和处理部分数据。它能将写入和存储扩展到单机之外，但跨分片查询必须询问所有分片，一个热键也可能压垮自己的分片，而其他分片仍闲着。',
  "The Sharding research exists, but today its only effect is to unlock Leaderless replication: you cannot shard the Database. The closest mechanic is the Hot key Incident, where 30% of the reads to a Cache or Wide-column Store ask for one key on one shard, so the Node's capacity falls to about 1 / (0.3 × shards + 0.7). With Hybrid fan-out you can split hot keys across the Node's shards.":
    '“分片”研究已经存在，但目前唯一效果是解锁“无主复制”：你还不能给数据库分片。最接近的机制是“热键”故障：发往缓存或宽列存储的 30% 读取集中请求某个分片上的同一个键，使节点容量降至约 1 / (0.3 × 分片数 + 0.7)。完成“混合扇出”后，可以将热键分散到该节点的各个分片。',
  'Wikipedia: Shard (database architecture)': '维基百科：分片（数据库架构）',
  'MongoDB docs: Sharding': 'MongoDB 文档：分片',
  'AWS: What is database sharding?': 'AWS：什么是数据库分片？',
  'An architecture in which nodes, or requests, share no memory or disk and coordinate only over the network, so each can fail, restart, or scale on its own. Michael Stonebraker argued for it for databases in 1986. PHP applies the idea per request: every request starts with clean process state and frees everything when it ends.':
    '节点或请求不共享内存、磁盘，只通过网络协调的架构，因此各自可以独立故障、重启或扩缩容。Michael Stonebraker 于 1986 年主张将其用于数据库。PHP 将此理念应用于每个请求：每次请求都从干净的进程状态开始，结束后释放所有资源。',
  "Apache mod_php and PHP-FPM are shared nothing: they free all memory after each request, so the Memory leak Incident never picks them. Every other runtime keeps its processes across requests, which avoids per-request setup but can leak. The price is speed: PHP runs at 0.15 times Go's CPU speed, or 0.375 with OPcache.":
    'Apache mod_php 和 PHP-FPM 采用无共享模式：每次请求后释放全部内存，因此“内存泄漏”故障永远不会选中它们。其他所有运行时都会跨请求保留进程，省去了每次请求的初始化，却也可能泄漏内存。代价是速度：PHP 的 CPU 处理速度是 Go 的 0.15 倍，使用 OPcache 后为 0.375 倍。',
  'Stonebraker (1986): The case for shared nothing': 'Stonebraker（1986）：支持无共享架构的理由',
  'Wikipedia: Shared-nothing architecture': '维基百科：无共享架构',
  'A service level indicator (SLI) is a measurement of service behavior, such as the share of requests that succeed. A service level objective (SLO) is a target for an SLI over a window, such as 99.9% over 30 days. A service level agreement (SLA) is a contract with customers that sets consequences, such as service credits, when a promised level is missed; it is usually looser than the internal SLO.':
    '服务等级指标（SLI）是对服务行为的测量，例如请求成功的比例。服务等级目标（SLO）是在一个时间窗口内对 SLI 设定的目标，例如 30 天内达到 99.9%。服务等级协议（SLA）是与客户签订的合同，规定未达到承诺服务等级时的后果，例如提供服务抵扣额度；其要求通常比内部 SLO 宽松。',
  'The SLI is availability: the share of user requests answered over the last calendar week, without bots and WAF blocks. Each Era sets the SLO, from 99% in Garage to 99.99% in Public, and from Series A the failures it allows are your error budget. SLO dashboards put that budget on the HUD, and the IPO checklist needs 99.95%. The game has no SLA yet.':
    'SLI 使用可用性：最近一个日历周内得到响应的用户请求比例，不包含机器人和 WAF 拦截。各阶段设定自己的 SLO，从车库创业的 99% 到上市后的 99.99%；从 A 轮起，允许的失败额度就是错误预算。“SLO 仪表盘”会在 HUD 上显示预算，IPO 清单则要求 99.95%。游戏目前还没有 SLA。',
  'Google SRE workbook: Implementing SLOs': 'Google SRE 工作手册：实施 SLO',
  'Google Cloud blog: SLIs, SLAs, and SLOs': 'Google Cloud 博客：SLI、SLA 与 SLO',
  "An audit framework from the AICPA. An independent auditor reports on a service organization's controls for security, availability, processing integrity, confidentiality, and privacy. Enterprise customers often require a SOC 2 report.":
    'AICPA 制定的审计框架。独立审计师就服务组织在安全性、可用性、处理完整性、保密性和隐私方面的控制措施出具报告。企业客户通常会要求提供 SOC 2 报告。',
  'SOC 2 is an item on the Pre-IPO IPO checklist. You need the SOC 2 program Research, which needs TLS everywhere, Encryption at rest, and Dependency scanning, and you need the Security team Research. Without a Security team, an Audit finding Incident can reset a passed DR drill.':
    'SOC 2 是上市前 IPO 清单中的一项。你需要“SOC 2 计划”研究，其前置条件为“全链路 TLS”“静态数据加密”和“依赖扫描”，还需要“安全团队”研究。没有安全团队时，“审计发现问题”故障可能重置已通过的灾难恢复演练。',
  'AICPA: System and Organization Controls': 'AICPA：系统与组织控制',
  'Spare cloud capacity sold at a large discount, up to 90% off the on-demand price, that the provider can take back whenever it needs the capacity. AWS gives a two-minute interruption notice. Spot suits stateless, fault-tolerant work such as batch jobs and servers behind a load balancer with spare capacity, not a single database.':
    '以大幅折扣出售的闲置云容量，最低可比按需价格便宜 90%，但服务商需要时可以随时收回。AWS 会提前两分钟通知中断。竞价实例适合无状态、可容错的工作，例如批处理任务，或放在负载均衡器后且有备用容量的服务器，不适合单个数据库。',
  "Spot pricing is designed but not in the game yet. The closest is the GPU shortage Incident: the provider reclaims a GPU Node, H100s first, and it stays down for the Incident; an LLM API as a fallback makes it a quarter as likely. The Instance failure Incident also kills one Node's host, three times as often on a Node with no second copy as on others.":
    '竞价定价已有设计，但尚未加入游戏。最接近的是“GPU 短缺”故障：服务商收回一个 GPU 节点，优先收回 H100，该节点会在故障期间持续宕机；配置 LLM API 作为备用方案，可以将发生概率降至四分之一。“实例故障”也会使一个节点的宿主机宕机，没有第二个副本的节点发生频率是其他节点的三倍。',
  'AWS EC2 docs: Spot Instances': 'AWS EC2 文档：竞价实例',
  'AWS EC2 docs: Spot Instance interruption notices': 'AWS EC2 文档：竞价实例中断通知',
  'Google Cloud docs: Spot VMs': 'Google Cloud 文档：竞价虚拟机',
  'Replacing a legacy system piece by piece: put a routing layer in front of it, send a growing share of traffic or features to the new system, and retire the old one when nothing uses it. Martin Fowler named it after the strangler fig, a vine that grows around a tree until it replaces it. It avoids a risky big-bang rewrite.':
    '逐步替换旧系统：在前方放置路由层，将越来越多的流量或功能交给新系统，等不再有人使用旧系统时将其退役。Martin Fowler 以绞杀榕命名这种方式：藤蔓环绕树木生长，最终将其取代。它避免了高风险的一次性全面重写。',
  "Changing a Service's Stack in a Company starts a migration that runs both versions and moves App Servers over in four steps: 5%, 25%, 50%, then 100% of traffic. Each step costs its share of the migration's Dev Hours (10%, 20%, 30%, 40%), and requests on the new Stack fail 3% of the time until you ship Fix migration bugs. Features on the migrating Service build at half speed.":
    '在公司中更改服务的技术栈，会开始一次同时运行新旧版本的迁移，分四步将应用服务器流量切至新栈：5%、25%、50%，最后 100%。每一步消耗迁移开发工时的相应份额（10%、20%、30%、40%）。完成并发布“修复迁移缺陷”之前，新技术栈上的请求有 3% 会失败。迁移中的服务，其功能开发速度减半。',
  'Martin Fowler: Strangler Fig': 'Martin Fowler：绞杀榕',
  'Azure Architecture Center: Strangler Fig pattern': 'Azure 架构中心：绞杀榕模式',
  'AWS Prescriptive Guidance: Strangler fig pattern': 'AWS 实践指南：绞杀榕模式',
  'Replication where the primary confirms a write only after at least one replica has also stored it. No acknowledged write is lost if the primary fails, but every write waits for the round trip to the replica.':
    '主库必须等至少一个副本也存储了写入后，才确认写入的复制方式。主库故障时，不会丢失任何已确认的写入，但每次写入都要等待与副本之间的往返通信。',
  'The Synchronous replication Research says that writes wait for a replica, but today it only unlocks Consensus databases; it does not change Read Replicas or the Database. The closest thing the game models is Distributed SQL: every write waits for a majority of its replicas, so writes across regions pay the round trip. A Database with a Standby also fails over in seconds when its zone fails.':
    '“同步复制”研究说明写入需要等待副本，但目前它只解锁“共识数据库”，不会改变只读副本或数据库。游戏实际模拟的最接近机制是分布式 SQL：每次写入等待多数副本，因此跨区域写入要承担往返延迟。拥有备用节点的数据库，在其可用区故障时也能在数秒内完成故障转移。',
  'PostgreSQL docs: Log-shipping standby servers (synchronous replication)':
    'PostgreSQL 文档：日志传送备用服务器（同步复制）',
  'PostgreSQL docs: Replication settings': 'PostgreSQL 文档：复制设置',
  'Wikipedia: Replication (computing)': '维基百科：复制（计算）',
  'When one request fans out to many servers or waits for many replies, the slowest reply sets its latency, so a delay that is rare on each server becomes common for the whole request. With 100 servers each slow 1% of the time, 63% of requests meet at least one slow reply. Dean and Barroso described it in 2013, with fixes such as hedged requests.':
    '一个请求扇出到许多服务器或等待多个响应时，最慢的响应决定其延迟，因此在每台服务器上罕见的延迟，对整个请求却会变得常见。若 100 台服务器各有 1% 的概率变慢，63% 的请求会遇到至少一个慢响应。Dean 和 Barroso 于 2013 年描述了此现象，并提出对冲请求等解决办法。',
  'A request collects the tail events of every Node on its path: two independent chances a and b combine to 1 − (1 − a)(1 − b), so a long chain of Nodes that each stall now and then has a worse p99 than any one of them. A Wide-column Store read waits for the R-th fastest of N replicas, and at R = N it waits for the slowest one. Percentiles research shows the p99 where this appears.':
    '一个请求会汇集路径上各节点的尾延迟事件：两个独立概率 a 和 b 合并为 1 − (1 − a)(1 − b)，因此一长串偶尔停顿的节点，其 p99 会比其中任何单个节点都差。宽列存储的读取要等待 N 个副本中第 R 快的那个；R = N 时，就得等最慢的副本。“百分位数”研究会显示体现此现象的 p99。',
  'Dean and Barroso (2013): The tail at scale': 'Dean 和 Barroso（2013）：大规模系统中的尾延迟',
  'The tail at scale (PDF)': '大规模系统中的尾延迟（PDF）',
  'Communications of the ACM: The tail at scale': 'Communications of the ACM：大规模系统中的尾延迟',
  'Shortcuts and outdated design in code that make each later change slower or riskier, like interest on a loan, until the team repays the debt by refactoring. Ward Cunningham coined the metaphor in 1992. Some debt is a deliberate tradeoff to ship sooner; its cost is the extra effort it adds to every later change.':
    '代码中的捷径和过时设计，让后续每次变更更慢或风险更高，就像贷款利息，直到团队通过重构偿还债务。Ward Cunningham 于 1992 年提出此比喻。有些债务是为尽早交付而有意作出的取舍；其成本体现在给以后每次变更新增的工作量上。',
  'Each Service has a tech debt percentage. Every shipped Feature adds 6 points under Move fast, 3 under Balanced, and 1 under Quality, plus 1 with no framework, and a task shipped during an Incident adds 2. Debt cuts velocity by up to half, raises the bad-deploy chance up to 3 times, and makes every Incident likelier. The Refactor task (10 Dev Hours) removes 20 points, and the Quality policy pays some down by itself.':
    '每个服务都有技术债百分比。每发布一个功能，“快速推进”策略下增加 6 个百分点，“平衡”为 3 点，“质量优先”为 1 点；不使用框架额外增加 1 点，故障期间发布的任务再增加 2 点。技术债最多让开发速度减半，将错误部署概率提高到 3 倍，也让所有故障更容易发生。“重构”任务（10 开发工时）可消除 20 点技术债，“质量优先”策略也会自行偿还一部分。',
  'Martin Fowler: Technical debt': 'Martin Fowler：技术债',
  'Wikipedia: Technical debt': '维基百科：技术债',
  'Thread pool': '线程池',
  'A fixed set of threads that take work from a shared queue, so a program does not pay to create a thread per task. In a thread-per-request server, the pool size limits how many requests run at once, and a request that waits on I/O still holds its thread.':
    '一组固定数量的线程，从共享队列中领取工作，让程序无需为每个任务创建新线程。在每请求独占线程的服务器中，池大小限制并发请求数，而等待 I/O 的请求仍会占住线程。',
  "Java's Tomcat runs 200 threads in one JVM, and Ruby's Puma runs 5 threads per process: each waiting request holds a thread, so slow database calls can fill the pool. For Node.js, the libuv thread pool Research moves password hashing off the event loop, so logins stop stalling other requests. Rust's Tokio runs async tasks on a pool of worker threads, where a CPU-heavy task blocks only one of them.":
    'Java 的 Tomcat 在一个 JVM 中运行 200 个线程，Ruby 的 Puma 每进程运行 5 个线程：每个等待中的请求都占住线程，因此慢数据库调用可以填满线程池。对 Node.js 而言，“libuv 线程池”研究会将 password 哈希计算移出事件循环，让登录不再拖住其他请求。Rust 的 Tokio 在线程池上运行异步任务，CPU 密集型任务只会阻塞其中一个工作线程。',
  "Node.js: Don't block the event loop (or the worker pool)":
    'Node.js：不要阻塞事件循环（或工作线程池）',
  'Apache Tomcat: The Executor (thread pool)': 'Apache Tomcat：执行器（线程池）',
  'Many clients or processes wake up and act at the same moment, for example after a restart, a cache expiry, or a shared timer, and their combined load overwhelms a shared resource. The fixes spread the herd out: jitter, request coalescing, and staggered restarts.':
    '许多客户端或进程同时唤醒并行动，例如在重启、缓存过期或共享定时器触发后，它们叠加的负载会压垮共享资源。解决方法是将群体打散：加入抖动、合并请求，以及错开重启时间。',
  'The Cache stampede Incident restarts a Cache empty, and every miss goes to the Database at once; while the Database runs at 90% or more, refills time out and the Cache stays cold. Stampede protection lets a cold Cache send on only 25% of its extra misses while the rest wait on one fetch, and Cache warming brings a Cache back 80% warm. Naive retries are a herd too: every caller retries at once, and Backoff with jitter spreads them out.':
    '“缓存击穿”故障会让缓存空着重启，所有未命中请求同时访问数据库；数据库负载达到或超过 90% 时，回填超时，缓存持续处于冷状态。“缓存击穿保护”让冷缓存只向下游发送额外未命中请求的 25%，其余请求等待同一次获取；“缓存预热”让缓存恢复到 80% 的预热程度。朴素重试也是惊群：所有调用方立即重试，而带抖动的退避会将它们错开。',
  'Wikipedia: Thundering herd problem': '维基百科：惊群问题',
  'A CDN setup where edge locations ask a smaller set of regional or upper-tier caches before the origin. Edges share what the upper tier holds, so the hit rate rises, and fewer requests reach the origin.':
    '一种 CDN 架构：边缘节点先询问数量较少的区域缓存或上层缓存，再访问源站。各边缘节点共享上层缓存已有的内容，从而提高命中率，减少到达源站的请求。',
  'The Tiered caching Research (after Content delivery) makes CDN edges ask a regional tier before your origin. It raises the share of media requests that a CDN answers from 75% to 92% at the default TTL. Video that the CDN answers does not load your App Servers and is billed at the cheaper edge Egress price.':
    '“分层缓存”研究（需先研究“内容分发”）让 CDN 边缘节点先询问区域层，再访问你的源站。在默认 TTL 下，CDN 回答的媒体请求比例从 75% 提高到 92%。CDN 回答的视频请求不会增加应用服务器负载，并按更便宜的边缘出站流量价格计费。',
  'Cloudflare docs: Tiered Cache': 'Cloudflare 文档：分层缓存',
  'AWS: CloudFront Origin Shield': 'AWS：CloudFront 源站保护',
  Timeout: '超时',
  "The longest time a caller waits for a response before it gives up. A timeout frees the caller's thread or connection, so a slow dependency cannot hold it forever, but a timeout set too short fails calls that would have worked.":
    '调用方在放弃前等待响应的最长时间。超时会释放调用方的线程或连接，让慢依赖无法永远占住资源；但设得太短，也会让本来能成功的调用失败。',
  "Every Link waits 30 s for an answer. After Timeouts and retries research, you can set each Link's timeout to 1, 5, or 30 s. A caller holds its slot only until the timeout, so a short timeout keeps a slow Database from filling every App Server slot, and calls past it fail as timeouts. A charge that times out and is retried can charge twice until you own Idempotency keys.":
    '每条链路等待响应 30 秒。研究“超时与重试”后，可将各链路超时设为 1、5 或 30 秒。调用方只在超时前占用槽位，因此较短的超时能防止慢数据库占满应用服务器的所有槽位，超过时限的调用则以超时失败。拥有“幂等键”之前，超时后重试的扣款可能重复收费。',
  'Google SRE book: Addressing Cascading Failures': 'Google SRE 书籍：应对级联故障',
  'TLS certificate': 'TLS 证书',
  "A signed file that binds a domain name to a public key, issued by a certificate authority. Browsers check it before they open an HTTPS connection, and refuse the site once it expires. Certificates are short-lived, so teams renew them automatically, for example with ACME and Let's Encrypt.":
    "由证书颁发机构签发、将域名与公钥绑定的签名文件。浏览器在建立 HTTPS 连接前会检查它，证书过期后则拒绝访问网站。证书有效期较短，因此团队会使用 ACME 和 Let's Encrypt 等方式自动续期。",
  'The Certificate expired Incident can start from Seed. While it runs, every browser refuses the site: every request from Users fails as down, for up to 60 s. Press Renew to end it. Certificate automation research renews certificates before they expire, so the Incident never starts again.':
    '“证书过期”故障从种子轮起可能发生。期间所有浏览器都拒绝访问网站：来自用户的每个请求都因服务不可用而失败，最长持续 60 秒。点击“续期”即可结束。“证书自动化”研究会在证书过期前续期，因此该故障不会再发生。',
  'Cloudflare Learning Center: What is an SSL certificate?':
    'Cloudflare 学习中心：什么是 SSL 证书？',
  "Let's Encrypt: Decreasing Certificate Lifetimes to 45 Days":
    "Let's Encrypt：将证书有效期缩短至 45 天",
  "Let's Encrypt: FAQ": "Let's Encrypt：常见问题",
  'A rate limiting algorithm. A bucket holds up to B tokens and refills at a fixed rate r; each request takes a token, and a request that finds the bucket empty waits or is rejected. It allows short bursts of up to B while it holds the long-run average to r.':
    '一种限流算法。桶最多容纳 B 个令牌，并以固定速率 r 补充；每次请求消耗一个令牌，桶空时，请求必须等待或被拒绝。它允许最多 B 个请求的短暂突发，同时将长期平均速率保持在 r。',
  'Burstable instances run on a token bucket of CPU credits. A Burstable Node earns credits while it uses less than 20% of its vCPU, banks up to 100 core-seconds per vCPU, and spends them to run above that baseline. When the bucket is empty it drops to 20% CPU, so a Burstable box that runs hot all day stalls; in exchange it costs 0.4 times a General box.':
    '突发型实例使用 CPU 积分令牌桶。突发型节点在使用少于 20% vCPU 时积累积分，每个 vCPU 最多储存 100 核心秒，并消耗积分以超出该基准运行。桶空后，CPU 降至 20%，因此整天高负载运行的突发型机器会停滞；作为交换，它的成本仅为通用型机器的 0.4 倍。',
  'Wikipedia: Token bucket': '维基百科：令牌桶',
  'AWS EC2 docs: Burstable performance instances, key concepts':
    'AWS EC2 文档：突发性能实例的关键概念',
  'A way to update a database and publish an event without losing either. The service writes the change and an outbox row in the same database transaction, and a separate relay reads the outbox and publishes each event to the message broker, at least once. It avoids the dual-write problem, where the database commit succeeds and the publish fails, or the reverse.':
    '一种同时更新数据库并发布事件、且不会丢失任何一方的方式。服务在同一个数据库事务中写入变更和一条发件箱记录，再由独立中继读取发件箱，将每个事件至少一次发布到消息代理。它避免了双写问题：数据库提交成功但发布失败，或反过来。',
  'The outbox is designed but not in the game yet. The closest mechanic is the Queue: an App Server linked to a Queue hands the async part of slow requests to Workers, and users wait only for the enqueue. The game does not model an event lost or duplicated between a database write and a publish.':
    '发件箱已有设计，但尚未加入游戏。最接近的机制是队列：连接到队列的应用服务器将慢请求的异步部分交给工作进程，用户只需等待任务入队。游戏没有模拟数据库写入与发布之间的事件丢失或重复。',
  'microservices.io: Transactional outbox': 'microservices.io：事务发件箱',
  'AWS Prescriptive Guidance: Transactional outbox pattern': 'AWS 实践指南：事务发件箱模式',
  'Debezium docs: Outbox event router': 'Debezium 文档：发件箱事件路由器',
  'Utilization, Saturation, and Errors for each resource, such as CPU, memory, or a connection pool. It measures causes, not symptoms: a resource at 100% with work waiting is the likely bottleneck. Brendan Gregg described it as a checklist for performance analysis.':
    'CPU、内存或连接池等各资源的利用率（Utilization）、饱和度（Saturation）和错误（Errors）。它测量原因而非症状：资源占用达到 100% 且工作仍在等待时，它很可能就是瓶颈。Brendan Gregg 将其描述为性能分析检查清单。',
  "The Dashboard's Saturation row shows utilization for each Node as a bar gauge, a state timeline, and a table, so you can see which Node filled up first. A full per-resource USE row is not built yet. On the Board, the Load bar on each Node card shows the same utilization now.":
    '仪表盘的“饱和度”一行以条形仪表、状态时间线和表格显示各节点的利用率，让你看清哪个节点最先占满。完整的逐资源 USE 行目前尚未实现。画布上，各节点卡片的负载条会显示同一利用率的当前值。',
  'Brendan Gregg: The USE method': 'Brendan Gregg：USE 方法',
  "The share of a resource's capacity in use over a period: offered work divided by capacity. Queueing delay grows sharply as utilization nears 100%: in a simple M/M/1 queue the wait is proportional to ρ / (1 − ρ), so going from 50% to 90% busy multiplies the wait by 9.":
    '一段时间内资源容量的使用比例：待处理工作量除以容量。利用率接近 100% 时，排队延迟会急剧增加：在简单的 M/M/1 队列中，等待时间正比于 ρ / (1 − ρ)，因此繁忙程度从 50% 提高到 90%，等待时间会变为 9 倍。',
  'Each Node shows its utilization: offered work over the capacity of its tightest limit, whether CPU, slots, memory, connections, or network. Queueing delay grows as ρ / (1 − ρ), the Node warns at 70% and shows danger at 90%, and above 100% it drops the excess. The Bottleneck search weighs only Nodes above 60%, and an Autoscaler targets 40%, 60%, or 80%. The Saturation row on the Dashboard shows each Node as a gauge and as a 24-hour timeline, with the same 70% and 90% lines.':
    '每个节点都显示其利用率：待处理工作量除以最紧张资源的容量，无论该资源是 CPU、槽位、内存、连接还是网络。排队延迟按 ρ / (1 − ρ) 增长，节点在 70% 时警告，90% 时显示危险，超过 100% 则丢弃超出部分。瓶颈搜索只对超过 60% 的节点进行权衡，自动扩缩容器则以 40%、60% 或 80% 为目标。仪表盘的“饱和度”一行以仪表和 24 小时时间线显示各节点，并标出相同的 70% 和 90% 阈值。',
  'Wikipedia: M/M/1 queue': '维基百科：M/M/1 队列',
  'Vertical scaling (scaling up) moves a workload to a bigger machine with more CPU and memory. Horizontal scaling (scaling out) adds more machines and splits the work among them. Scaling up is simple but has a ceiling and usually a restart; scaling out needs a load balancer and stateless servers, but has no hard ceiling and survives the loss of one machine.':
    '纵向扩容将工作负载迁移到拥有更多 CPU 和内存的更大机器。横向扩容则增加机器，将工作分摊给它们。纵向扩容简单，但有上限，通常还需要重启；横向扩容需要负载均衡器和无状态服务器，但没有硬性上限，也能承受单台机器故障。',
  'Resizing a sized Node moves it one step between nano (0.5 vCPU) and metal (96 vCPU), and each step doubles vCPU and RAM, but the Node restarts and comes back cold. Some software cannot use the extra cores: Node.js runs one event loop on one core, and Redis answers on one thread. To scale out, put more App Servers behind DNS or a Load Balancer, each copy costing 25% more to place, or let an Autoscaler add copies, which take 180 s on VMs or 30 s in a Kubernetes Cluster.':
    '调整有规格的节点时，每次从 nano（0.5 vCPU）到 metal（96 vCPU）之间移动一个档位，每档 vCPU 和 RAM 都翻倍，但节点会重启并从冷状态恢复。有些软件无法使用额外核心：Node.js 仅在一个核心上运行一个事件循环，Redis 也只用一个线程回答请求。要横向扩容，可在 DNS 或负载均衡器后添加更多应用服务器，每新增一个副本，放置成本提高 25%；也可以让自动扩缩容器增加副本，在虚拟机上需要 180 秒，在 Kubernetes 集群中需要 30 秒。',
  'Azure Architecture Center: Design to scale out': 'Azure 架构中心：为横向扩容而设计',
  'Wikipedia: Scalability (horizontal and vertical)': '维基百科：可扩展性（横向与纵向）',
  'WAF (web application firewall)': 'WAF（Web 应用防火墙）',
  'A filter in front of a web application that inspects HTTP requests and blocks those that match attack or bot rules. Stricter rule sets catch more attacks and also block more real users by mistake (false positives).':
    '放在 Web 应用前方的过滤器，检查 HTTP 请求，拦截符合攻击或机器人规则的请求。更严格的规则集能捕获更多攻击，也会错误拦截更多真实用户（误报）。',
  'Web application firewall research unlocks the WAF Component. It blocks a share of bot requests and, by mistake, a share of real users, set by its paranoia level: level 1 blocks 60% of bots and 0.1% of users, level 2 (the default) 80% and 0.5%, level 3 92% and 2%, level 4 98% and 6%. Higher levels cost more CPU per request, up to 4 times level 1. Under attack mode blocks 99% of bots and 1% of users and adds 40 ms.':
    '“Web 应用防火墙”研究解锁 WAF 组件。其严格级别决定拦截的机器人请求比例，以及误拦的真实用户比例：级别 1 拦截 60% 机器人和 0.1% 用户，级别 2（默认）为 80% 和 0.5%，级别 3 为 92% 和 2%，级别 4 为 98% 和 6%。级别越高，每个请求消耗的 CPU 越多，最高为级别 1 的 4 倍。“遭受攻击模式”拦截 99% 机器人和 1% 用户，并增加 40 ms 延迟。',
  'Cloudflare Learning Center: What is a WAF?': 'Cloudflare 学习中心：什么是 WAF？',
  'OWASP CRS: Paranoia Levels': 'OWASP CRS：严格级别',
  'OWASP: Web Application Firewall': 'OWASP：Web 应用防火墙',
  'A caching policy in which every write goes to the cache and the database together, so the cache always holds the latest value for the keys written through it. Reads hit more often and are never stale for those keys, but each write is slower and the cache fills with data that may never be read. Cache-aside and write-behind are the common alternatives.':
    '一种缓存策略：每次写入同时进入缓存和数据库，因此缓存始终保存经它写入的各键的最新值。这些键的读取命中率更高，且不会过期，但每次写入更慢，缓存也可能填满从未被读取的数据。常见替代方案是旁路缓存和异步回写。',
  'Write-through is designed as a Cache strategy but not in the game yet. Today a Cache works like cache-aside with invalidation: writes pass through to the Database and invalidate keys, so its hit ratio falls by twice the write share, at most by half. Between invalidations some hits are stale, from 0.5% to 10% per unit of write share as the TTL grows from 10 s to 1 hour.':
    '直写已设计为一种缓存策略，但尚未加入游戏。目前缓存采用带失效的旁路缓存模式：写入穿过缓存到达数据库，并使相关键失效，因此命中率会按写入占比的两倍下降，最多降低一半。在两次失效之间，部分命中仍会过期；随着 TTL 从 10 秒延长至 1 小时，每单位写入占比对应的过期比例从 0.5% 增至 10%。',
  'Amazon ElastiCache docs: Caching strategies': 'Amazon ElastiCache 文档：缓存策略',
  'Wikipedia: Cache write policies': '维基百科：缓存写入策略',
}
