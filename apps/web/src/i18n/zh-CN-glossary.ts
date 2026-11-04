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
}
