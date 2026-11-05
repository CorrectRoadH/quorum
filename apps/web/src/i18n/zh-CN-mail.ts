/** Simplified Chinese mail copy, keyed by complete English presentation messages. */
export const mailZhCN: Readonly<Record<string, string>> = {
  '[TRIGGERED] {0}: all workers busy': '[已触发] {0}：所有工作进程均忙碌',
  'ALERT TRIGGERED': '告警已触发',
  'Service: {0}\nCondition: every worker busy\nCause: mostly waiting on the database\nPool setting: none on this runtime\nSuggested action: make the database answer faster':
    '服务：{0}\n条件：所有工作进程均忙碌\n原因：大多在等待数据库\n进程池设置：此运行时不提供\n建议操作：让数据库更快地响应',
  'This alert will keep firing until a worker is free. {0} will keep telling you.':
    '只要没有空闲工作进程，这条告警就会不断触发。{0} 会一直提醒你。',
  'Your {0} workers are all on hold': '你的 {0} 工作进程全都在排队等候',
  'Hi there,': '你好，',
  "Quick one from {0}. Every worker on {1} is busy, and when we looked closer, most of them aren't working at all. They're waiting on the database, like a whole office stuck on hold with the same call centre.":
    '这里是 {0}，简单提醒一下。{1} 上的所有工作进程都忙着呢，但仔细一看，大多数根本没在干活。它们都在等数据库，就像整个办公室都打给了同一个呼叫中心，一起听等待音乐。',
  "This runtime has no pool size to turn up, so adding seats won't help. The honest fix is to make the database answer faster.":
    '这个运行时没有进程池大小可以调，所以加座位也没用。真正的解决办法是让数据库更快地响应。',
  'Cheers,\nThe {0} team': '祝好，\n{0} 团队',
  'New issue: {0} has no free workers': '新问题：{0} 没有空闲工作进程',
  'New issue in {0}': '{0} 中出现新问题',
  'WorkerPoolExhausted: no free worker to take the request':
    'WorkerPoolExhausted：没有空闲工作进程接收请求',
  'What we see: every worker is busy, and most of that time is spent waiting on the database.':
    '我们看到的情况：所有工作进程均忙碌，而且大部分时间都花在等待数据库上。',
  "What won't help: there's no pool knob on this runtime.\nWhat will: make the database answer faster.":
    '没用的办法：这个运行时没有进程池调节选项。\n有用的办法：让数据库更快地响应。',
  "We saw it first. Now you've seen it too.\n{0}": '我们先看到了。现在你也看到了。\n{0}',
  'Panel annotation: {0} workers pinned': '面板标注：{0} 工作进程占用已顶满',
  'Your {0} worker panel has been a flat line at the very top for a while now. Flat at the top is just as bad as flat at the bottom.':
    '你的 {0} 工作进程面板已经在最顶端画了好一阵直线。顶端的直线和底端的直线一样糟。',
  'We added an annotation: "every worker busy, mostly waiting on the database."':
    '我们加了个标注：“所有工作进程均忙碌，大多在等待数据库。”',
  "There's no pool setting to raise on this runtime. Make the database answer faster and the line will come back down.":
    '这个运行时没有进程池设置可以调高。让数据库更快地响应，曲线就会降下来。',
  'ESCALATED: {0} is out of workers': '已升级：{0} 的工作进程已耗尽',
  "It's late. We know. You are receiving this because you are awake.":
    '夜深了。我们知道。你收到这封邮件，是因为你还醒着。',
  "{0} has no idle workers left. They're mostly sitting on open database calls, waiting for answers.":
    '{0} 已经没有空闲工作进程了。它们大多守着尚未完成的数据库调用，等待响应。',
  "Before you go looking for a pool size: this runtime doesn't have one. The fix is upstream. Make the database answer faster.":
    '在你去找进程池大小设置之前：这个运行时没有这东西。解决办法在上游。让数据库更快地响应。',
  "Go back to sleep after. We'll check in.\n{0} on-call":
    '搞定后就继续睡吧。我们会再来看看。\n{0} 值班团队',
  '[TRIGGERED] {0}: {1} pool full': '[已触发] {0}：{1} 进程池已满',
  'Service: {0}\nRuntime: {1}\nCondition: every worker busy\nMostly: waiting':
    '服务：{0}\n运行时：{1}\n条件：所有工作进程均忙碌\n主要在做什么：等待',
  'Remediation (pick one):\n1. Raise the pool\n2. Speed up the database':
    '修复办法（二选一）：\n1. 扩大进程池\n2. 加快数据库响应',
  "If nobody responds, this alert escalates to whoever is awake. Statistically, that's you.\n- {0}":
    '如果没人回应，这条告警就会升级给还醒着的人。从统计上说，那就是你。\n— {0}',
  'Every {0} worker on {1} is busy': '{1} 上的所有 {0} 工作进程均忙碌',
  'Hello from {0},': '{0} 向你问好，',
  'Every {0} worker on {1} is taken. Most of them are just waiting, which is the most expensive kind of busy.':
    '{1} 上的所有 {0} 工作进程都被占用了。大多只是在等，这可是最昂贵的一种忙碌。',
  'You have two honest options. Raise the pool so more requests can wait at once, or speed up the database so nobody waits as long.':
    '你有两个实在的选择。扩大进程池，让更多请求能同时等着；或者加快数据库响应，让大家不用等那么久。',
  'Happy to keep watching either way.': '无论选哪种，我们都乐意继续盯着。',
  'Best,\nThe {0} team': '顺颂商祺，\n{0} 团队',
  'Regression: {0} pool exhausted on {1}': '问题复发：{1} 上的 {0} 进程池已耗尽',
  'Issue: PoolExhausted ({0})\nWhere: {1}\nFirst seen: just now\nLast seen: also just now':
    '问题：PoolExhausted（{0}）\n位置：{1}\n首次发现：刚刚\n最近发现：也是刚刚',
  'Every worker in the {0} pool is busy, and most are waiting rather than working.':
    '{0} 进程池中的所有工作进程均忙碌，而且大多在等待，而非工作。',
  'Suggested fixes:\n- Raise the pool\n- Speed up the database':
    '建议修复办法：\n- 扩大进程池\n- 加快数据库响应',
  "Mark as resolved when the pool has room. We'll tell you if it comes back. We always do.\n{0}":
    '进程池有空位后，请标记为已解决。如果复发，我们会告诉你。我们一向如此。\n{0}',
  '{0}: your {1} line hit the ceiling': '{0}：你的 {1} 曲线撞到天花板了',
  'Hey,': '嗨，',
  'The "busy {0} workers" panel for {1} has climbed to the top and stayed there. No more room under the ceiling.':
    '{1} 的“忙碌中的 {0} 工作进程”面板已经爬到顶端，并且赖着不走。天花板下挤不出空间了。',
  "The twist: they're mostly waiting, not computing.": '反转来了：它们大多在等待，而不是计算。',
  "So either raise the pool, or speed up the database. Both bring the line down. One of them also makes everything else faster, but we're a dashboard, not your mother.":
    '所以，要么扩大进程池，要么加快数据库响应。两者都能让曲线降下来。其中一种还能让其他一切也变快，但我们只是个仪表盘，又不是你妈。',
  'Timeline: {0} workers on {1}': '时间线：{1} 上的 {0} 工作进程',
  'Incident timeline, {0}': '故障时间线，{0}',
  '- Requests arrive. {0} workers pick them up.\n- Workers ask the database. Workers wait.\n- More requests arrive. More workers wait.\n- Every worker is now busy waiting. Alert fires.\n- {1} emails you. (You are here.)':
    '- 请求到达。{0} 工作进程接手。\n- 工作进程询问数据库。工作进程等待。\n- 更多请求到达。更多工作进程等待。\n- 现在所有工作进程都忙着等待。告警触发。\n- {1} 给你发邮件。（你在这里。）',
  'Next step: raise the pool, or speed up the database.': '下一步：扩大进程池，或加快数据库响应。',
  '[TRIGGERED] Postgres: too many connections': '[已触发] Postgres：连接过多',
  'Component: Postgres\nError: refusing new connections\nCause: too many app processes holding pools':
    '组件：Postgres\n错误：拒绝新连接\n原因：过多应用进程各自占着连接池',
  'Remediation:\n- Shrink pools, or\n- Add a Connection Pooler':
    '修复办法：\n- 缩小连接池，或\n- 添加连接池',
  'This page will repeat until acknowledged by a human, a pet, or a cat walking across the keyboard.\n{0}':
    '这条呼叫会不断重复，直到有人、宠物，或者踩过键盘的猫确认收到。\n{0}',
  'Postgres has stopped answering the door': 'Postgres 已经不开门了',
  "Postgres has started refusing connections. Not because it's busy thinking, but because too many app processes are each holding a pool of connections, and the guest list is full.":
    'Postgres 开始拒绝连接了。不是因为它忙着思考，而是太多应用进程各自占着一池连接，来宾名单已经满了。',
  'Two ways out: shrink the pools, so each process holds fewer, or add a Connection Pooler, so they all share.':
    '两条出路：缩小连接池，让每个进程少占一些；或者添加连接池，让它们共用连接。',
  'Warmly,\nThe {0} team': '诚挚问候，\n{0} 团队',
  'P.S. Opening more connections is not one of the two ways.':
    '附言：打开更多连接不在这两条出路之列。',
  'New issue: FATAL too many clients': '新问题：FATAL，客户端过多',
  'New issue\nFATAL: sorry, too many clients already': '新问题\nFATAL：抱歉，客户端已经太多了',
  "Postgres is refusing connections. Each app process brings its own pool, and together they've used up every slot.":
    'Postgres 正在拒绝连接。每个应用进程都自带连接池，合起来把所有名额都占满了。',
  'Fix: shrink pools, or add a Connection Pooler.': '修复办法：缩小连接池，或添加连接池。',
  "This issue is assigned to you, because there's no one else. Welcome to startups.\n- {0}":
    '这个问题分配给了你，因为没有其他人了。欢迎来到创业公司。\n— {0}',
  'Weekly digest: one panel you should look at': '每周摘要：有个面板你该看看',
  'Your {0} digest': '你的 {0} 摘要',
  'Most panels look fine this week. One does not.': '本周大多数面板看起来都不错。有一个除外。',
  'Postgres connections: full. New ones are being refused, because too many app processes each hold their own pool.':
    'Postgres 连接数：已满。新连接正在被拒绝，因为太多应用进程各自占着连接池。',
  'What to try: shrink the pools, or add a Connection Pooler in front of Postgres so the processes share.':
    '可以试试：缩小连接池，或在 Postgres 前添加连接池，让这些进程共用连接。',
  "That's the digest. Short, because the rest is boring, and boring is good.":
    '摘要到此结束。很短，因为其他内容都很无聊，而无聊是好事。',
  'Re: Re: Re: Postgres connections': '回复：回复：回复：Postgres 连接',
  'Hello again.': '又见面了。',
  "We've mentioned this before, and we'll mention it again: Postgres is turning connections away. Too many app processes are holding pools, and there are no seats left.":
    '我们之前说过，现在还得再说一遍：Postgres 正在拒绝连接。太多应用进程占着连接池，已经没有空位了。',
  "The fix hasn't changed. Shrink pools, or add a Connection Pooler.":
    '修复办法没有变。缩小连接池，或添加连接池。',
  'You are receiving this because you are awake, and Postgres is not taking calls.\n{0}':
    '你收到这封邮件，是因为你还醒着，而 Postgres 已经不接电话了。\n{0}',
  '[TRIGGERED] {0}: past throughput': '[已触发] {0}：超出吞吐上限',
  'Service: {0}\nCondition: requests above its throughput\nStatus: this is the limit':
    '服务：{0}\n条件：请求量超过其吞吐能力\n状态：这就是极限',
  "There's no setting in this alert to make the limit go away. {0} is doing all it can, and more is arriving.":
    '这条告警里没有什么设置能让上限消失。{0} 已经全力以赴，但请求还在不断涌来。',
  '{0}\nYou are receiving this because you are awake.': '{0}\n你收到这封邮件，是因为你还醒着。',
  "{0} is doing its best. It isn't enough.": '{0} 已经尽力了。但还不够。',
  "A gentle heads-up from {0}. {1} is being asked for more than its throughput. It's not broken and it's not misconfigured. It's simply at the limit, and the extra has nowhere to fit.":
    '{0} 温馨提醒你：发给 {1} 的请求已经超出它的吞吐能力。它没坏，也没配错。它只是到了极限，多出来的请求无处安放。',
  "We thought you'd want to know before the users tell you.":
    '我们觉得，最好在用户来告诉你之前先让你知道。',
  'Take care,\nThe {0} team': '保重，\n{0} 团队',
  'Graph annotation: {0} hit its limit': '图表标注：{0} 已达极限',
  'We drew a red line on the {0} panel. Your traffic line crossed it.':
    '我们在 {0} 面板上画了一条红线。你的流量曲线越过去了。',
  'Annotation: "past throughput. This is the limit."': '标注：“超出吞吐上限。这就是极限。”',
  "A flat top on a graph usually means a ceiling, and this is one. {0} can't go faster than this.":
    '图表顶部变平，通常意味着撞上了天花板，这次就是。{0} 已经没法更快了。',
  'Issue: {0} over capacity': '问题：{0} 超出容量',
  'Issue: ThroughputExceeded\nWhere: {0}\nTrend: escalating':
    '问题：ThroughputExceeded\n位置：{0}\n趋势：持续加剧',
  "More requests are reaching {0} than it can push through. That's its limit, not a bug we can point at a line of code for.":
    '到达 {0} 的请求超过了它能处理的量。这是它的上限，没法指着某行代码说那儿有个 bug。',
  "We'll keep counting. Counting is what we do.\n{0}": '我们会继续数。数数就是我们的工作。\n{0}',
  'Timeline: {0} reaches the limit': '时间线：{0} 达到极限',
  'Incident timeline': '故障时间线',
  '- Traffic grows. {0} keeps up.\n- Traffic grows more. {1} keeps up, barely.\n- Traffic passes the throughput of {2}.\n- {3} hits the limit and stays there.\n- {4} writes this email.':
    '- 流量增长。{0} 跟得上。\n- 流量继续增长。{1} 勉强跟得上。\n- 流量超过 {2} 的吞吐能力。\n- {3} 达到极限，并一直卡在那里。\n- {4} 写下这封邮件。',
  "Root cause: {0} is past its throughput. That's the limit.":
    '根本原因：{0} 已超出吞吐上限。这就是极限。',
  'Bottleneck: {0}': '瓶颈：{0}',
  ALERT: '告警',
  'What limits the Design right now: {0}\nEverything else: has room to spare':
    '当前限制设计的因素：{0}\n其他部分：仍有余量',
  'No further detail in this alert. {0} is the narrow part of the pipe, and the rest of the Design waits on it.':
    '这条告警没有更多详情。{0} 是管道最窄的地方，设计的其余部分都得等它。',
  'If you only look at one thing today': '如果今天你只看一件事',
  "We watch a lot of graphs on your behalf at {0}, and today they all agree on something: {1} is what's limiting the Design right now.":
    '在 {0}，我们替你盯着很多图表。今天它们一致认为：当前限制设计的就是 {1}。',
  "Every other part is waiting on it. If you're wondering where to look first, look there.":
    '其他每一部分都在等它。如果你不知道该先看哪里，就看那里。',
  'All the best,\nThe {0} team': '祝一切顺利，\n{0} 团队',
  '{0} is the slowest link': '{0} 是最慢的一环',
  "Hey, it's {0}.": '嗨，这里是 {0}。',
  "We lined up every panel side by side. {0} is the one holding the others back. That's what limits the Design right now.":
    '我们把所有面板并排放在一起看了看。拖住其他部分的就是 {0}。它就是当前限制设计的因素。',
  'No flatline, no fire. Just the narrowest point in the whole thing.':
    '没有直线归零，也没有火情。只是整套系统中最窄的一处。',
  "Thought you'd want the name.": '觉得你会想知道它的名字。',
  'Top issue this hour: {0}': '本小时头号问题：{0}',
  'Top issue': '头号问题',
  'LimitingFactor: {0}\nImpact: the whole Design\nSeen: every time we check':
    'LimitingFactor：{0}\n影响：整个设计\n出现频率：每次检查都在',
  "Right now, {0} sets the pace for everything. When it's the slowest, the Design is only as fast as {1}.":
    '眼下，一切都由 {0} 决定节奏。它最慢时，整个设计的速度也只能和 {1} 一样快。',
  '{0}\nWe saw it first. You saw it last.': '{0}\n我们先看到，你最后才看到。',
  '[ESCALATED] Design limited by {0}': '[已升级] 设计受限于 {0}',
  ESCALATED: '已升级',
  "This alert was raised, ignored by nobody, and escalated anyway, because that's how escalation works.":
    '这条告警发出了，谁也没有忽略它，但它还是升级了，因为告警升级就是这么运作的。',
  'Finding: {0} is what limits the Design right now.': '发现：当前限制设计的因素是 {0}。',
  "That's the whole page. You are receiving this because you are awake.\n{0}":
    '整条呼叫就这些。你收到它，是因为你还醒着。\n{0}',
  '[TRIGGERED] {0} is down': '[已触发] {0} 已宕机',
  'Service: {0}\nStatus: FAILED': '服务：{0}\n状态：故障',
  'Remediation:\n1. Select {0} and click Replace, or\n2. Wait for the provider':
    '修复办法：\n1. 选中 {0} 并点击“更换”，或\n2. 等待服务商处理',
  'Use Show on Board to find it.': '使用“在看板上显示”找到它。',
  'This page will escalate until somebody does one of the above. You are receiving this because you are awake.\n{0}':
    '这条呼叫会不断升级，直到有人做了以上任意一件事。你收到它，是因为你还醒着。\n{0}',
  '{0} has stopped responding': '{0} 已停止响应',
  'Sorry to be the bearer of this one. {0} has failed. Nothing is coming back from it, and our panel for it has gone flat. That is not good.':
    '很遗憾带来这个消息。{0} 出故障了。它没有任何响应，我们的面板也变成了一条直线。这可不妙。',
  'You can select it and click Replace to put a fresh one in its place, or wait for the provider to bring it back.':
    '你可以选中它并点击“更换”，用一个新的来顶替，或者等服务商把它恢复。',
  'Show on Board will take you straight there.': '“在看板上显示”会直接带你找到它。',
  'The {0} team': '{0} 团队',
  'New issue: {0} unreachable': '新问题：无法访问 {0}',
  'New issue: NodeFailed\nWhere: {0}\nFirst seen: moments ago':
    '新问题：NodeFailed\n位置：{0}\n首次发现：片刻之前',
  'Every request to {0} is failing, because {1} itself has failed.':
    '发往 {0} 的每个请求都在失败，因为 {1} 自身出故障了。',
  "Fix it yourself: select it and click Replace.\nOr don't: wait for the provider.":
    '自己修：选中它并点击“更换”。\n或者不修：等待服务商处理。',
  'Show on Board is attached.\n{0}': '随信附上“在看板上显示”。\n{0}',
  'Timeline: {0} failure': '时间线：{0} 故障',
  '- {0} is fine.\n- {1} is not fine.\n- {2} has failed.\n- {3} notices, and writes to you.\n- You read this. (You are here.)\n- Next: select it and click Replace, or wait for the provider.':
    '- {0} 一切正常。\n- {1} 不正常了。\n- {2} 出故障了。\n- {3} 发现了，给你写信。\n- 你读到这里。（你在这里。）\n- 下一步：选中它并点击“更换”，或等待服务商处理。',
  'Show on Board below.': '下方可点击“在看板上显示”。',
  'Flatline on {0}': '{0} 面板变成直线了',
  'Your {0} panel went flat a moment ago. Not a calm flat. A failed flat.':
    '你的 {0} 面板刚刚变成了一条直线。不是风平浪静的直线，是出故障的直线。',
  "Two ways forward. Select it and click Replace if you'd rather not wait, or wait for the provider if you trust them more than we do.":
    '有两条路。不想等，就选中它并点击“更换”；如果你比我们更信任服务商，就等他们处理。',
  'Hit Show on Board to see where it sits.': '点击“在看板上显示”，看看它在哪里。',
  '[INFO] {0} restarting': '[信息] {0} 正在重启',
  NOTICE: '通知',
  "Service: {0}\nStatus: restarting\nImpact: requests to it fail until it's up\nAction required: none":
    '服务：{0}\n状态：正在重启\n影响：恢复前，发往它的请求都会失败\n所需操作：无',
  'Yes, we paged you for something that needs no action. You are receiving this because you are awake.\n{0}':
    '没错，我们为一件无需操作的事呼叫了你。你收到它，是因为你还醒着。\n{0}',
  '{0} is having a little lie-down': '{0} 正在躺一小会儿',
  "Nothing for you to do here, just keeping you in the loop. {0} is restarting. While it is, requests to it will fail. Once it's back up, they'll go through again.":
    '你不用做什么，只是向你同步一下。{0} 正在重启。在此期间，发往它的请求会失败。等它恢复，请求就又能通过了。',
  'No action needed. Show on Board is there if you want to watch it come back.':
    '无需操作。如果你想看它恢复，可以点击“在看板上显示”。',
  'Spike in errors from {0} (expected)': '{0} 错误激增（符合预期）',
  'Issue: errors from {0}\nStatus: expected': '问题：来自 {0} 的错误\n状态：符合预期',
  "{0} is restarting, so requests to it fail until it's up. The errors stop on their own.":
    '{0} 正在重启，所以恢复前发往它的请求都会失败。错误会自行停止。',
  "No action needed. We're telling you anyway, because telling you is our whole personality.\n{0}":
    '无需操作。我们还是要告诉你，毕竟通知你就是我们的全部个性。\n{0}',
  'Annotation: {0} restart': '标注：{0} 重启',
  'We\'ve marked the {0} panel with an annotation: "restarting."':
    '我们在 {0} 面板上添加了标注：“正在重启。”',
  "The dip you'll see is requests failing while it comes back. It's temporary, and it ends when {0} is up.":
    '你看到的下跌是恢复过程中请求失败造成的。这是暂时的，{0} 恢复后就会结束。',
  "No action needed. Show on Board if you'd like to keep an eye on it.":
    '无需操作。想盯着看，可以点击“在看板上显示”。',
  'Timeline: {0} reboot': '时间线：{0} 重新启动',
  Timeline: '时间线',
  '- {0} begins restarting.\n- Requests to {1} fail.\n- You get this email.\n- {2} comes back up.\n- Requests succeed again.':
    '- {0} 开始重启。\n- 发往 {1} 的请求失败。\n- 你收到这封邮件。\n- {2} 恢复运行。\n- 请求再次成功。',
  'Your part in this timeline: none. No action needed.': '你在这条时间线中的任务：无。无需操作。',
  '[TRIGGERED] Database: full table scans': '[已触发] 数据库：全表扫描',
  'Component: Database\nCondition: query without an index\nEffect: whole tables scanned on every call':
    '组件：数据库\n条件：查询没有索引\n影响：每次调用都会扫描整张表',
  'Remediation: select the Database and click Add index.': '修复办法：选中数据库并点击“添加索引”。',
  'This alert is easy to fix and hard to ignore. Please do the first one.\n{0}':
    '这条告警容易修复，又很难忽略。请选前者。\n{0}',
  'Your Database is reading every page': '你的数据库正在逐页阅读',
  'One of your queries has no index, so every time it runs the Database scans whole tables to find what it needs. Imagine looking up a word by reading the dictionary from "aardvark."':
    '你的某个查询没有索引，所以每次执行时，数据库都得扫描整张表，寻找所需内容。想象一下，为了查一个词，从“aardvark”开始把整本词典读一遍。',
  "Good news: this one's in your hands. Select the Database and click Add index.":
    '好消息：这次你自己就能解决。选中数据库并点击“添加索引”。',
  'Thanks,\nThe {0} team': '谢谢，\n{0} 团队',
  'New issue: SlowQuery (missing index)': '新问题：SlowQuery（缺少索引）',
  'New issue: SlowQuery\nWhere: Database\nCause: no index\nSymptom: whole-table scans\nSeen: every time the query runs':
    '新问题：SlowQuery\n位置：数据库\n原因：没有索引\n症状：全表扫描\n出现频率：每次执行查询时',
  'Resolution: select the Database and click Add index.': '解决办法：选中数据库并点击“添加索引”。',
  "Resolve it and we'll stop counting.\n{0}": '解决了，我们就不数了。\n{0}',
  'That sawtooth on the Database panel': '数据库面板上的那道锯齿',
  'Hey, {0} here.': '嗨，这里是 {0}。',
  "The Database panel has a shape we know well. It's a query with no index, so the Database scans whole tables every time.":
    '数据库面板呈现出一种我们很熟悉的形状。某个查询没有索引，所以数据库每次都在扫描整张表。',
  'The fix is one click away: select the Database and click Add index.':
    '解决只需一键：选中数据库并点击“添加索引”。',
  'After that, the panel should get boring. We like boring.':
    '之后，面板应该就会变得无聊。我们喜欢无聊。',
  'Re: the slow query (3 a.m. edition)': '回复：那个慢查询（凌晨三点版）',
  "It's {0}. You are receiving this because you are awake.":
    '这里是 {0}。你收到这封邮件，是因为你还醒着。',
  'A query has no index. The Database answers it the hard way: by scanning whole tables.':
    '有个查询没有索引。数据库只好用笨办法回答：扫描整张表。',
  'You can fix it before you go back to bed. Select the Database and click Add index.':
    '你可以修好再回去睡。选中数据库并点击“添加索引”。',
  'Goodnight, probably.': '晚安，大概吧。',
  '[TRIGGERED] Database: slow query': '[已触发] 数据库：慢查询',
  'Component: Database\nCause: query with no index\nEffect: whole tables scanned\nAdd index: not available yet':
    '组件：数据库\n原因：查询没有索引\n影响：全表扫描\n添加索引：尚不可用',
  'Remediation:\n- Research Query analysis, or\n- Put a Cache in front':
    '修复办法：\n- 研究查询分析，或\n- 在前面放一个缓存',
  'A query is reading the whole library': '有个查询正在通读整座图书馆',
  'One of your queries has no index, so the Database scans whole tables to answer it. That gets slow fast.':
    '你的某个查询没有索引，所以数据库得扫描整张表才能回答。很快就会慢得受不了。',
  "You can't add an index yet. Until you can, there are two routes: research Query analysis, so you can add one later, or put a Cache in front, so the Database is asked less often.":
    '你目前还不能添加索引。在解锁之前，有两条路：研究查询分析，以便之后添加索引；或者在前面放一个缓存，减少数据库被询问的次数。',
  'New issue: SlowQuery (no index)': '新问题：SlowQuery（无索引）',
  'New issue: SlowQuery\nWhere: Database\nCause: missing index, whole-table scans':
    '新问题：SlowQuery\n位置：数据库\n原因：缺少索引，全表扫描',
  'Workarounds while indexing is out of reach:\n1. Research Query analysis\n2. Put a Cache in front':
    '暂时无法添加索引时的应对办法：\n1. 研究查询分析\n2. 在前面放一个缓存',
  "We'll keep this issue open. We're very good at keeping issues open.\n{0}":
    '我们会让这个问题保持未解决。让问题一直开着，我们可在行了。\n{0}',
  'Weekly digest: one slow query': '每周摘要：一个慢查询',
  'One item this week. A query has no index, so the Database scans whole tables to answer it, and the panel shows it.':
    '本周只有一项。有个查询没有索引，所以数据库得扫描整张表才能回答，面板上也看得出来。',
  "You can't add an index yet. Your options for now: research Query analysis, or put a Cache in front of the Database so fewer questions reach it.":
    '你目前还不能添加索引。暂时可以：研究查询分析，或在数据库前面放一个缓存，减少到达它的问题。',
  "That's it. See you next digest.": '就这些。下期摘要见。',
  'Timeline: the slow query': '时间线：那个慢查询',
  '- A query arrives with no index to use.\n- The Database scans whole tables.\n- It does it again. And again.\n- {0} alerts you.':
    '- 一个查询到达，却没有可用索引。\n- 数据库扫描整张表。\n- 再来一次。又一次。\n- {0} 向你发出告警。',
  "Next steps, since an index isn't an option yet:\n- Research Query analysis\n- Put a Cache in front":
    '既然暂时无法使用索引，接下来可以：\n- 研究查询分析\n- 在前面放一个缓存',
  '[TRIGGERED] {0} requests failing': '[已触发] {0} 请求失败',
  "Requests: {0}\nStatus: failing\nReason: writes need the primary Database\nNote: a replica can't take them":
    '请求：{0}\n状态：失败\n原因：写入需要主数据库\n说明：副本无法接收写入',
  'Check where your {0} requests are going. They must reach the primary.':
    '检查你的 {0} 请求去了哪里。它们必须到达主库。',
  'You are receiving this because you are awake.\n{0}': '你收到这封邮件，是因为你还醒着。\n{0}',
  'Your {0} requests are bouncing': '你的 {0} 请求被退回了',
  "{0} requests are failing. Writes have to land on the primary Database, and a replica can't take them, however politely they're asked.":
    '{0} 请求正在失败。写入必须送到主数据库，副本接不了，求它时再客气也没用。',
  "If your {0} requests are heading anywhere but the primary, that's why.":
    '如果你的 {0} 请求去的不是主库，原因就在这里。',
  'Kind regards,\nThe {0} team': '谨致问候，\n{0} 团队',
  'New issue: ReadOnlyReplica on {0}': '新问题：{0} 出现 ReadOnlyReplica',
  'New issue\nError: cannot execute {0} on a read-only replica':
    '新问题\n错误：无法在只读副本上执行 {0}',
  "{0} requests are failing. Writes need the primary Database. A replica can't take them, no matter how often they're retried.":
    '{0} 请求正在失败。写入需要主数据库。副本无法接收写入，重试多少次都一样。',
  'Seen: every single {0}.\n{1}': '出现频率：每一个 {0}。\n{1}',
  'Your {0} success panel hit zero': '你的 {0} 成功数面板归零了',
  'The successful {0} requests panel has gone flat. Flat at zero. That is not good.':
    '{0} 请求成功数面板变成了直线。零那条线。这可不妙。',
  'We annotated it: "{0} failing. Writes need the primary Database; a replica can\'t take them."':
    '我们加了个标注：“{0} 失败。写入需要主数据库；副本无法接收写入。”',
  'Make sure {0} reaches the primary and the line will come back.':
    '确保 {0} 能到达主库，曲线就会回来了。',
  'Timeline: failing {0}s': '时间线：失败的 {0}',
  "- A {0} request goes out.\n- It meets a replica.\n- The replica can't take writes.\n- The {1} fails.\n- Repeat.":
    '- 一个 {0} 请求发出。\n- 它遇到了一个副本。\n- 副本无法接收写入。\n- {1} 失败。\n- 重复以上过程。',
  "Root cause: writes need the primary Database. A replica can't take them.":
    '根本原因：写入需要主数据库。副本无法接收写入。',
  'Requests: {0}\nStatus: failing\nSuggested action: check the links':
    '请求：{0}\n状态：失败\n建议操作：检查连线',
  'This alert will escalate until {0} requests succeed again or the sun comes up, whichever happens first. Probably the sun.\n{1}':
    '这条告警会不断升级，直到 {0} 请求再次成功，或者天亮，哪个先到算哪个。大概是天亮。\n{1}',
  "{0} requests aren't getting through": '{0} 请求没能通过',
  "{0} requests are failing, and they're not failing quietly. Somewhere between where they start and where they should end up, the path isn't right.":
    '{0} 请求正在失败，而且闹出的动静还不小。从起点到预定终点之间，某处路径不对。',
  'Our advice: check the links. Follow a {0} request from start to finish and see where it falls off.':
    '我们的建议：检查连线。沿着一个 {0} 请求从头跟到尾，看看它在哪儿掉了队。',
  'New issue: {0} failures': '新问题：{0} 失败',
  'New issue: RequestFailed ({0})\nSeen: again\nUsers affected: the ones sending {1}':
    '新问题：RequestFailed（{0}）\n出现时间：又来了\n受影响用户：发送 {1} 的那些人',
  'Suggested fix: check the links.': '建议修复办法：检查连线。',
  "We saw it first. You saw it last. Now you've seen it twice.\n{0}":
    '我们先看到，你最后才看到。现在你已经看了两遍了。\n{0}',
  'Your {0} graph has a hole in it': '你的 {0} 图表破了个洞',
  'The {0} panel looks wrong. Requests are going in and failures are coming out.':
    '{0} 面板看起来不对劲。请求进去，失败出来。',
  "We can't tell you which link is to blame from up here, but that's where to look. Check the links.":
    '我们从这里看不出是哪条连线的锅，但该查的就是那里。检查连线。',
  'Timeline: {0} outage': '时间线：{0} 服务中断',
  '- {0} requests start failing.\n- They keep failing.\n- {1} raises this alert.\n- You check the links. (Recommended next step.)\n- {2} requests succeed again. (Hopefully.)':
    '- {0} 请求开始失败。\n- 它们持续失败。\n- {1} 发出这条告警。\n- 你检查连线。（建议的下一步。）\n- {2} 请求再次成功。（但愿如此。）',
  'You are receiving this because you are awake.': '你收到这封邮件，是因为你还醒着。',
  '[TRIGGERED] {0}: requests stranded': '[已触发] {0}：请求滞留',
  'Service: {0}\nCondition: requests with nowhere to go': '服务：{0}\n条件：请求无处可去',
  'Remediation: link {0} to something that takes them.':
    '修复办法：将 {0} 连接到能接收这些请求的节点。',
  'Show on Board is attached. You are receiving this because you are awake.\n{0}':
    '随信附上“在看板上显示”。你收到这封邮件，是因为你还醒着。\n{0}',
  "{0} is holding requests it can't pass on": '{0} 手里攥着无法转发的请求',
  "{0} has requests in hand and nowhere to send them. It's a bit like a postman with a full bag and no addresses.":
    '{0} 手里有请求，却无处可送。有点像一个邮差，背着满满一袋信，却一个地址都没有。',
  'The fix: link it to something that takes them.': '修复办法：把它连接到能接收这些请求的节点。',
  'Show on Board will point you to {0}.': '“在看板上显示”会帮你找到 {0}。',
  'Best wishes,\nThe {0} team': '祝好，\n{0} 团队',
  'New issue: NoRoute from {0}': '新问题：来自 {0} 的 NoRoute',
  'New issue: NoRoute\nWhere: {0}\nMessage: request has nowhere to go\nSeen: on every one of them':
    '新问题：NoRoute\n位置：{0}\n信息：请求无处可去\n出现频率：每个请求都如此',
  'Fix: link it to something that takes them.': '修复办法：把它连接到能接收这些请求的节点。',
  'Show on Board to find {0}.\n{1}': '点击“在看板上显示”找到 {0}。\n{1}',
  'Arrows in, no arrows out: {0}': '有箭头进，没箭头出：{0}',
  'Looking at the {0} panel, requests arrive and then just sit there. They have nowhere to go next.':
    '看一下 {0} 面板，请求到了之后就待在那里。它们没有下一站可去。',
  'Link {0} to something that takes them, and the panel should start moving again.':
    '把 {0} 连接到能接收这些请求的节点，面板应该就会重新动起来。',
  'Show on Board will take you right to it.': '“在看板上显示”会直接带你找到它。',
  'Timeline: stranded at {0}': '时间线：滞留在 {0}',
  "- Requests reach {0}.\n- {1} looks for somewhere to send them.\n- There isn't anywhere.\n- The requests wait. And wait.\n- {2} emails you.":
    '- 请求到达 {0}。\n- {1} 寻找可以转发的去处。\n- 无处可去。\n- 请求等待。继续等待。\n- {2} 给你发邮件。',
  'Next step: link {0} to something that takes them. Show on Board is below.':
    '下一步：把 {0} 连接到能接收这些请求的节点。下方可点击“在看板上显示”。',
  '[Action required] {0}: CPU credit balance is 0': '[需要操作] {0}：CPU 积分余额为 0',
  'Dear valued customer,': '尊敬的客户，',
  'Your Burstable resource {0} has exhausted its CPU credit balance and is now throttled to 20% CPU.':
    '你的突发性能型资源 {0} 已耗尽 CPU 积分余额，目前 CPU 已被限速至 20%。',
  'How credits work: a Burstable box earns credits while it runs below 20% of each core and spends them above that. Yours has been above it for a while.':
    '积分机制：突发性能型机器在每个核心的使用率低于 20% 时积攒积分，高于这一阈值时消耗积分。你的机器已经超标一阵子了。',
  'Recommended actions:\n- Resize {0}\n- Or move it off Burstable, for example to the General family':
    '建议操作：\n- 调整 {0} 的规格\n- 或让它改用突发性能型以外的系列，例如通用型',
  'This inbox is not monitored.\n{0}': '此邮箱无人值守。\n{0}',
  'Your {0} is running on fumes': '你的 {0} 快要油尽灯枯了',
  'Quick heads-up from your account team at {0}. {1} spent every CPU credit it had, so we have politely lowered it to 20% CPU until it earns more. It only earns them while it idles below 20% of each core, which, judging by your traffic, it will not.':
    '{0} 客户团队提醒你：{1} 花光了所有 CPU 积分，所以我们礼貌地把它的 CPU 降到了 20%，直到它攒到更多积分。只有每个核心的使用率低于 20% 时才能攒积分，但从你的流量来看，它是没这个机会了。',
  'Resize it, or switch it off Burstable to something like General, and it can run flat out again.':
    '调整规格，或者从突发性能型切换为通用型之类的系列，它就又能全速运行了。',
  'Warmly (and at a discount we cannot offer),\nYour Customer Success Associate':
    '诚挚问候（并附上我们给不了的折扣），\n你的客户成功专员',
  'EVENT: CPU_CREDITS_EXHAUSTED ({0})': '事件：CPU_CREDITS_EXHAUSTED（{0}）',
  'Event type: CPU_CREDITS_EXHAUSTED\nResource: {0}\nStatus: Open\nImpact: CPU capped at 20%':
    '事件类型：CPU_CREDITS_EXHAUSTED\n资源：{0}\n状态：未解决\n影响：CPU 上限为 20%',
  'Description: This Burstable resource spends credits above 20% of each core and earns them below it. The balance is now zero.':
    '说明：此突发性能型资源在每个核心的使用率高于 20% 时消耗积分，低于该阈值时积攒积分。当前余额为零。',
  'Resolution: Resize the resource, or change its family from Burstable (for example, to General).':
    '解决办法：调整资源规格，或将其从突发性能型改为其他系列（例如通用型）。',
  'No reply is necessary. No reply is possible.': '无需回复。也无法回复。',
  "Re: re: about {0}'s credit score": '回复：回复：关于 {0} 的信用积分',
  'We regret to inform you that {0} has a CPU credit score of zero. Like many of us, it bought more than it earned.':
    '很遗憾地通知你，{0} 的 CPU 积分为零。和我们很多人一样，它花得比挣得多。',
  'A Burstable node saves credits whenever it runs under 20% of each core and spends them above that. Broke, it now lives on a strict budget of 20% CPU.':
    '突发性能型节点在每个核心的使用率低于 20% 时积攒积分，高于该阈值时花积分。如今身无分文，只能严格按 20% CPU 的预算过日子。',
  'Two ways out: Resize it, or retire it from Burstable to a family that does not ration, such as General.':
    '两条出路：调整规格，或让它告别突发性能型，改用通用型之类不搞配给的系列。',
  'Thank you for choosing {0}. You had options. Fewer now.':
    '感谢你选择 {0}。你曾经有很多选择。现在少了些。',
  '{0} throttled to 20% (in Preview)': '{0} 已限速至 20%（预览版）',
  'Greetings from {0}!': '{0} 向你问好！',
  "We're excited to let you know that {0} has been enrolled in our Throttling experience. It ran out of CPU credits and now runs at 20% CPU.":
    '我们很高兴地通知你，{0} 已加入我们的限速体验。它耗尽了 CPU 积分，现在以 20% CPU 运行。',
  'Background: Burstable instances bank credits under 20% of each core and burn them over it.':
    '背景：突发性能型实例在每个核心的使用率低于 20% 时积攒积分，超过该阈值时消耗积分。',
  'To opt out of the experience, Resize {0} or switch it to a non-Burstable family such as General.':
    '若要退出此体验，请调整 {0} 的规格，或将其切换到通用型等非突发性能型系列。',
  "We'd love your feedback! Feedback is also in Preview.": '欢迎反馈！反馈功能也处于预览阶段。',
  '{0} is out of memory and swapping': '{0} 内存耗尽，正在使用交换空间',
  'Our monitoring shows that {0} has used all of its RAM and is now swapping to disk. Requests on this resource will be slow.':
    '监控显示，{0} 已用尽所有 RAM，正在把内存换出到磁盘。该资源上的请求会变慢。',
  'You can:\n1. Resize {0}\n2. Pick the Memory family\n3. Shrink the pool':
    '你可以：\n1. 调整 {0} 的规格\n2. 选择内存型系列\n3. 缩小进程池',
  'We appreciate your business. We appreciate it more each month.':
    '感谢惠顾。每过一个月，我们就更感谢你一点。',
  'The {0} Service Health team': '{0} 服务健康团队',
  'Service Health: memory pressure on {0}': '服务健康：{0} 面临内存压力',
  'Impact statement: Starting at an unspecified time, {0} ran out of RAM. The operating system is swapping memory pages to disk, and everything on the box now waits on it.':
    '影响说明：从某个未指明的时间开始，{0} 的 RAM 耗尽了。操作系统正在把内存页换出到磁盘，整台机器上的一切都得等它。',
  'Current status: Ongoing. We are investigating why you have not fixed this yet.':
    '当前状态：持续中。我们正在调查你为什么还没修好。',
  'Mitigation: Resize the resource, move it to the Memory family, or shrink the pool so it needs less RAM.':
    '缓解办法：调整资源规格，改用内存型系列，或缩小进程池以减少 RAM 需求。',
  'Next update: when you act.': '下次更新：等你动手时。',
  'Swap is not a memory upgrade': '交换空间不是内存升级',
  '{0} is out of RAM. It is swapping, which means it is pretending the disk is memory, and the disk is not enjoying the role.':
    '{0} 的 RAM 耗尽了。它正在使用交换空间，也就是假装磁盘是内存，而磁盘并不喜欢这个角色。',
  'Give it room: Resize it, pick the Memory family, or shrink the pool.':
    '给它腾点地方：调整规格，选择内存型系列，或缩小进程池。',
  'Cheers,\nAccount team, {0}': '祝好，\n{0} 客户团队',
  'P.S. Your bill did not run out of memory. It remembers everything.':
    '附言：你的账单可没内存不足。每一笔它都记得。',
  'ALERT {0} mem=100% swap=active': '告警 {0} 内存=100% 交换空间=使用中',
  'ALARM: "{0}-memory" is in ALARM state.': '告警：“{0}-memory”处于告警状态。',
  'Reason: RAM fully used; the node is swapping.': '原因：RAM 已全部用尽；节点正在使用交换空间。',
  'Suggested fixes, in no order:\n- Resize\n- Memory family\n- Shrink the pool':
    '建议修复办法，排名不分先后：\n- 调整规格\n- 内存型系列\n- 缩小进程池',
  'You are receiving this notice because you are a {0} customer, which you agreed to on page 41 of a document you did not read.':
    '你收到此通知，是因为你是 {0} 的客户；你在一份没读过的文件第 41 页同意过这一点。',
  "A gentle note about {0}'s memory": '关于 {0} 内存的小小提醒',
  "We hope this email finds you well. We're less sure it finds {0} well: it ran out of RAM and has been swapping for some time.":
    '希望你收到这封邮件时一切安好。至于 {0}，我们就没那么确定了：它的 RAM 耗尽，使用交换空间已经有一阵子了。',
  'When a box swaps, every request waits on the disk. Your users notice before you do.':
    '机器使用交换空间时，每个请求都得等磁盘。你的用户会比你先察觉。',
  'Resizing the node, choosing the Memory family, or shrinking the pool will each give it breathing room.':
    '调整节点规格、选择内存型系列，或缩小进程池，都能让它喘口气。',
  'Best regards,\nYour dedicated (shared) Technical Account Manager':
    '顺颂商祺，\n你的专属（共享）技术客户经理',
  '{0}: Postgres and your app share one RAM': '{0}：Postgres 和你的应用共用一份 RAM',
  '{0} is out of RAM and swapping. The cause: Postgres runs on the same box as your app, and both want the memory.':
    '{0} 的 RAM 耗尽，正在使用交换空间。原因是 Postgres 和你的应用在同一台机器上运行，两者都想占内存。',
  'Recommended action: Place a Database and link {0} to it, so Postgres gets a home of its own.':
    '建议操作：放置一个数据库，并将 {0} 连接到它，让 Postgres 有自己的家。',
  'Thank you for building on {0}.\nThis inbox is not monitored.':
    '感谢你使用 {0} 构建产品。\n此邮箱无人值守。',
  'Roommate dispute detected on {0}': '在 {0} 上检测到室友纠纷',
  'Your app and Postgres have been sharing {0} like two roommates sharing one fridge. The fridge is the RAM, and it is full. The node is swapping to disk.':
    '你的应用和 Postgres 一直共用 {0}，就像两个室友共用一台冰箱。冰箱就是 RAM，现在它满了。节点正在把内存换出到磁盘。',
  'The fix is to give Postgres its own place: Place a Database, then link {0} to it.':
    '解决办法是给 Postgres 自己的住处：放置一个数据库，然后将 {0} 连接到它。',
  'No security deposit required.': '无需押金。',
  'Your Solutions Architect': '你的解决方案架构师',
  'Health event: {0} swapping (co-located DB)': '健康事件：{0} 正在使用交换空间（数据库同机部署）',
  'Event: MEMORY_EXHAUSTED_COLOCATED\nResource: {0}\nRoot cause: Postgres shares the box with the application. Combined memory exceeds RAM; the node is swapping.':
    '事件：MEMORY_EXHAUSTED_COLOCATED\n资源：{0}\n根本原因：Postgres 与应用共用机器。总内存需求超过 RAM；节点正在使用交换空间。',
  'Remediation: Place a Database and link the node to it.':
    '修复办法：放置一个数据库，并将节点连接到它。',
  'This notice was generated by {0}. It is not a contract, a promise, or a person.':
    '此通知由 {0} 生成。它不是合同，不是承诺，也不是人。',
  'Quick thought on {0}': '关于 {0} 的一个小想法',
  'Flagging something from our side at {0}: {1} has run out of RAM and is swapping. Looking closer, Postgres is living on the same box as the app, so every query and every request are fighting for the same memory.':
    '{0} 这边提醒你一件事：{1} 的 RAM 耗尽，正在使用交换空间。仔细一看，Postgres 和应用住在同一台机器上，所以每次查询、每个请求都在争同一份内存。',
  'We see this a lot with early setups, and it is the right call at first. It stops being right about now.':
    '早期设计经常这样，起初也确实是正确选择。不过到了眼下，就不再合适了。',
  'Place a Database and link {0} to it. Your app gets its RAM back, and Postgres gets a box that is only for it.':
    '放置一个数据库，并将 {0} 连接到它。你的应用能拿回 RAM，Postgres 也能得到一台专属机器。',
  'Happy to jump on a call (calls are in Preview).': '很乐意和你通个电话（通话功能处于预览阶段）。',
  'Best,\nYour account team': '顺颂商祺，\n你的客户团队',
  'Two tenants, one {0}, zero free RAM': '两个租户，一个 {0}，空闲 RAM 为零',
  'Notice of memory exhaustion.': '内存耗尽通知。',
  'Resource {0} hosts both the application and Postgres. Together they have used all of its RAM, and the resource is now swapping.':
    '资源 {0} 同时承载应用和 Postgres。两者已经用尽其全部 RAM，该资源目前正在使用交换空间。',
  'The supported configuration is one Postgres per Database: Place a Database and link {0} to it.':
    '受支持的配置是每个数据库承载一个 Postgres：放置一个数据库，并将 {0} 连接到它。',
  'We apologise for any inconvenience. We have not caused any inconvenience; we are just apologising in advance.':
    '对可能带来的不便，我们深表歉意。我们并未造成任何不便，只是提前道个歉。',
  '{0} has hit network line rate': '{0} 已达到网络线速',
  '{0} is sending as many bytes as its network card can move. It is at line rate, and further traffic will queue.':
    '{0} 正在以网卡所能达到的最高速度发送字节。它已达到线速，更多流量只能排队。',
  'Options:\n- Resize {0} for a faster network card\n- Add a copy behind a Load Balancer to split the traffic':
    '可选方案：\n- 调整 {0} 的规格，换用更快的网卡\n- 在负载均衡器后添加一个副本，分担流量',
  'Egress is billed per byte. We noticed.': '出站流量按字节计费。我们注意到了。',
  'The pipe is full': '管道满了',
  "Short version: {0}'s network card is moving all the bytes it can. That is line rate, and there is no line after it.":
    '简而言之：{0} 的网卡已经在以最快速度搬运字节了。这就是线速，后面没有更快的一档。',
  'Resize it, or put a copy behind a Load Balancer so two cards share the work.':
    '调整规格，或在负载均衡器后放一个副本，让两张网卡分担工作。',
  'Thanks,\nNetworking (we are the ones you blame first)':
    '谢谢，\n网络团队（就是你们出了事最先怪的那群人）',
  'Service Health: throughput saturation, {0}': '服务健康：吞吐饱和，{0}',
  'Title: Network saturation on {0}\nSeverity: Warning\nRegion: One of ours. It is up, which narrows it down.':
    '标题：{0} 网络饱和\n严重程度：警告\n区域：我们家的某一个。它还在正常运行，这就缩小范围了。',
  'Summary: Outbound traffic from {0} has reached the line rate of its network card.':
    '摘要：{0} 的出站流量已达到其网卡线速。',
  'Customer action: Resize the resource, or add a copy of it behind a Load Balancer.':
    '客户操作：调整资源规格，或在负载均衡器后添加它的一个副本。',
  '{0} Service Health': '{0} 服务健康',
  'Congratulations on your traffic!': '恭喜你的流量大涨！',
  'Hello!': '你好！',
  'Great news from {0}: people really want to download things from {1}. So many that its network card is now sending bytes as fast as it physically can.':
    '{0} 带来好消息：大家真的很想从 {1} 下载东西。人多到它的网卡已经在以物理极限发送字节。',
  'Less great news: that is the ceiling. Anything more waits in line.':
    '不那么好的消息是：这就是天花板。再多的流量都得排队。',
  'To raise the ceiling, Resize {0}. To add a second ceiling, put a copy behind a Load Balancer.':
    '想抬高天花板，就调整 {0} 的规格。想多一块天花板，就在负载均衡器后放一个副本。',
  'Cheering you on (and metering you),\nYour account team':
    '为你加油（也为你计量），\n你的客户团队',
  'NIC at 100% on {0}': '{0} 网卡使用率达到 100%',
  'Automated message.': '自动发送的消息。',
  'Metric: NetworkOut\nResource: {0}\nValue: line rate\nThreshold: line rate':
    '指标：NetworkOut\n资源：{0}\n数值：线速\n阈值：线速',
  'The network card cannot move more bytes than it moves now. Resize the resource, or add a copy behind a Load Balancer.':
    '网卡已经无法比现在搬运更多字节。请调整资源规格，或在负载均衡器后添加一个副本。',
  'To stop receiving these alerts, stop sending bytes.': '若不想再收到这些告警，请停止发送字节。',
  '{0}: working set no longer fits in RAM': '{0}：工作集已经装不进 RAM 了',
  'The working set on {0} has outgrown its RAM. Reads that used to come from memory now go to disk, which is slower by a lot.':
    '{0} 的工作集已超过 RAM 容量。过去从内存读取的数据，现在要去磁盘读取，慢了不止一点。',
  'Recommended actions:\n- Resize {0}\n- Or pick the Memory family':
    '建议操作：\n- 调整 {0} 的规格\n- 或选择内存型系列',
  'Thank you for your continued patience. Your disk is showing less.':
    '感谢你始终保持耐心。你的磁盘就没那么有耐心了。',
  'Your reads are taking the stairs': '你的读取请求开始爬楼梯了',
  '{0} used to keep its hot data in RAM, where reads take the lift. The working set has grown past the RAM, so reads now take the stairs: they hit disk.':
    '{0} 以前把热数据放在 RAM 里，读取像坐电梯。如今工作集超过了 RAM 容量，读取只能爬楼梯：去访问磁盘。',
  'Resize it, or pick the Memory family, and the lift comes back.':
    '调整规格，或选择内存型系列，电梯就回来了。',
  'Regards,\nStorage team': '此致，\n存储团队',
  'Event: DISK_READS_ELEVATED on {0}': '事件：{0} 出现 DISK_READS_ELEVATED',
  'Event type: DISK_READS_ELEVATED\nAffected resource: {0}\nCause: Working set exceeds available RAM.\nEffect: Reads go to disk.':
    '事件类型：DISK_READS_ELEVATED\n受影响资源：{0}\n原因：工作集超过可用 RAM。\n影响：读取转向磁盘。',
  'To resolve, Resize the resource or select the Memory family.':
    '解决办法：调整资源规格，或选择内存型系列。',
  'This is an automated message from {0}. Replies are routed to a folder that we sunset in a previous quarter.':
    '这是来自 {0} 的自动消息。回复会被分流到一个我们上个季度就已停用的文件夹。',
  'Re: {0} feels slow lately?': '回复：{0} 最近有点慢？',
  "If {0} has felt sluggish, here is why. Every node keeps the data it uses most, its working set, in RAM. {1}'s working set has grown bigger than its RAM, so a share of every read now goes to disk.":
    '如果你觉得 {0} 反应迟钝，原因在这里。每个节点都会把最常用的数据，也就是工作集，放在 RAM 里。{1} 的工作集已经超过它的 RAM 容量，所以现在每次读取都有一部分要访问磁盘。',
  'Nothing is broken. It is just waiting on a spinning thing, figuratively.':
    '什么都没坏。只是要等一个转来转去的东西，比喻而已。',
  'More RAM fixes it: Resize the node, or pick the Memory family.':
    '更多 RAM 就能解决：调整节点规格，或选择内存型系列。',
  'Kind regards,\nYour Technical Account Manager at {0}': '谨致问候，\n你在 {0} 的技术客户经理',
  'Disk is the new RAM (it is not)': '磁盘就是新时代的 RAM（并不是）',
  'Notice.': '通知。',
  "{0}'s working set does not fit in RAM anymore, so reads hit disk.":
    '{0} 的工作集已经装不进 RAM，所以读取会访问磁盘。',
  'Fix: Resize, or the Memory family.': '修复办法：调整规格，或选择内存型系列。',
  'That is the whole email. We are as surprised as you are.': '邮件就这些。我们和你一样惊讶。',
  '{0} is at 100% CPU': '{0} 的 CPU 使用率达到 100%',
  '{0} is using all of its CPU. Requests are queuing behind each other.':
    '{0} 已用尽所有 CPU 算力。请求一个接一个地排队。',
  'Recommended actions:\n- Resize {0}\n- Add a copy behind a Load Balancer':
    '建议操作：\n- 调整 {0} 的规格\n- 在负载均衡器后添加一个副本',
  'Your usage is up. So is your bill. We consider this a partnership.':
    '你的用量涨了，账单也涨了。我们把这叫合作共赢。',
  'ALARM: {0} CPUUtilization >= 100': '告警：{0} CPUUtilization >= 100',
  ALARM: '警报',
  'Name: {0}-cpu\nState change: OK -> ALARM\nReason: CPU at 100%.':
    '名称：{0}-cpu\n状态变化：正常 -> 告警\n原因：CPU 使用率达到 100%。',
  'Runbook: Resize the resource, or add a copy behind a Load Balancer.':
    '操作手册：调整资源规格，或在负载均衡器后添加一个副本。',
  'You are receiving this email because someone, at some point, ticked a box.':
    '你收到这封邮件，是因为某人在某个时候勾选了某个框。',
  '{0} is giving 100%': '{0} 正在付出百分之百的努力',
  'Hi!': '嗨！',
  'We love the hustle. {0} is giving 110%, which in CPU terms means 100% and a queue.':
    '我们欣赏这股拼劲。{0} 正在付出 110% 的努力，换算成 CPU 术语就是 100% 使用率外加一条队列。',
  'Two ways to help it out: Resize it, or add a copy behind a Load Balancer so the work splits between them.':
    '有两种办法帮它一把：调整规格，或在负载均衡器后添加一个副本，让两者分担工作。',
  'Rooting for you,\nGrowth team at {0}': '为你加油，\n{0} 增长团队',
  'P.S. A copy is a whole new Node. We will be sending a whole new invoice.':
    '附言：一个副本就是一个全新的节点。我们也会寄来一张全新的账单。',
  'Service Health: compute saturation on {0}': '服务健康：{0} 计算能力饱和',
  'Impact: {0} is at 100% CPU. Work that arrives now waits for work that arrived earlier.':
    '影响：{0} 的 CPU 使用率达到 100%。现在到来的任务，都得等之前到来的任务。',
  'Status: Investigating. Our investigation consists of this email.':
    '状态：调查中。我们的调查内容就是这封邮件。',
  'Workaround: Resize the resource, or add a copy of it behind a Load Balancer.':
    '应对办法：调整资源规格，或在负载均衡器后添加它的一个副本。',
  'All other regions are operating normally, the three of them we can see.':
    '其他所有区域均运行正常，至少我们看得到的那三个是这样。',
  "Your CPU called. It's busy.": '你的 CPU 打来电话。它很忙。',
  'We tried to reach {0} about something unrelated, but it is at 100% CPU and could not pick up.':
    '我们想就另一件事联系 {0}，但它的 CPU 使用率达到 100%，没空接听。',
  "If you'd like it to have a free moment again, Resize it to a bigger box, or add a copy behind a Load Balancer so they take turns.":
    '如果你想让它再有片刻空闲，可以调整规格，换台更大的机器；或者在负载均衡器后添加一个副本，让它们轮流接活。',
  'Thanks for your understanding,\nCompute Customer Experience': '感谢理解，\n计算服务客户体验团队',
  '[Heads-up] {0} CPU credits running low': '[提醒] {0} 的 CPU 积分即将耗尽',
  '{0} is spending CPU credits faster than it earns them. When the balance reaches zero, it will drop to 20% CPU.':
    '{0} 消耗 CPU 积分的速度超过了积攒速度。余额降到零时，CPU 就会降至 20%。',
  'To avoid this:\n- Switch it to General\n- Or resize it':
    '避免方法：\n- 切换到通用型\n- 或调整规格',
  "{0}'s credits: a countdown": '{0} 的积分：倒计时',
  'This is the email before the email. {0} is draining its CPU credits and will run out soon. After that, it runs at 20% CPU, and you get the other email.':
    '这是那封邮件之前的邮件。{0} 正在消耗 CPU 积分，很快就会花光。之后，它就会以 20% CPU 运行，而你会收到另一封邮件。',
  'Switch it to General, or resize it, and neither of us has to send or read that one.':
    '切换到通用型，或调整规格，我们俩就都不用再发、再读那封邮件了。',
  'Show on Board takes you right to it.': '“在看板上显示”会直接带你找到它。',
  'Thanks,\nYour account team': '谢谢，\n你的客户团队',
  'Forecast: {0} throttled to 20% soon': '预测：{0} 即将被限速至 20%',
  'Forecast notice from {0}.': '来自 {0} 的预测通知。',
  'At the current rate, {0} will spend its last CPU credit soon. Once it does, it will be held to 20% CPU.':
    '照目前的速度，{0} 很快就会花掉最后一点 CPU 积分。一旦耗尽，CPU 就会被限制在 20%。',
  'This is a forecast, not an outage. Like our weather forecasts, it is in Preview, but unlike them it tends to be right.':
    '这是预测，不是服务中断。和我们的天气预报一样，它还处于预览阶段；不过和天气预报不同，它通常是准的。',
  'Action: Switch {0} to General, or resize it. Show on Board will point it out.':
    '操作：将 {0} 切换到通用型，或调整规格。“在看板上显示”会帮你找到它。',
  'Low balance alert: {0}': '低余额告警：{0}',
  "Your CPU credit balance on {0} is low and falling. We'd hate for it to hit zero, because then the node drops to 20% CPU.":
    '你在 {0} 上的 CPU 积分余额已经很低，还在下降。我们可不希望它降到零，因为那样节点的 CPU 就会降至 20%。',
  'Unlike your bank, we will not offer an overdraft. Unlike your bank, we will tell you how to fix it: switch the node to General, or resize it.':
    '和银行不同，我们不提供透支。也和银行不同，我们会告诉你怎么解决：把节点切换到通用型，或调整规格。',
  'See it with Show on Board.': '点击“在看板上显示”查看。',
  'Regards,\nBilling and Burst, {0}': '此致，\n{0} 计费与突发性能团队',
  'EVENT: CPU_CREDITS_DRAINING ({0})': '事件：CPU_CREDITS_DRAINING（{0}）',
  'Event type: CPU_CREDITS_DRAINING\nResource: {0}\nCategory: scheduled (by you, by accident)\nExpected impact: CPU capped at 20% when credits reach zero':
    '事件类型：CPU_CREDITS_DRAINING\n资源：{0}\n类别：计划内（由你无意中安排）\n预期影响：积分归零时，CPU 上限为 20%',
  'Avoid by: switching to General, or resizing.': '避免方法：切换到通用型，或调整规格。',
  'Locate: Show on Board.': '定位：“在看板上显示”。',
  'This mailbox is unattended. So, it seems, is {0}.': '此邮箱无人照管。看起来 {0} 也一样。',
  'Your Payments drawer is full 🎉': '你的支付收款箱满了 🎉',
  'Hi there!': '你好呀！',
  "Great news: you've made so much money that your Payments drawer is completely full! Less great news: new revenue has nowhere to go, so it is spilling, and spilled revenue is lost.":
    '好消息：你赚了这么多钱，支付收款箱已经彻底装满了！不那么好的消息：新收入无处可放，正在往外溢，而溢出的收入就丢了。',
  "Click Payments to collect what's in there, and the drawer has room again.":
    '点击支付节点，收走里面的钱，收款箱就又有空间了。',
  'Keep crushing it,\nThe {0} team': '继续大赚特赚，\n{0} 团队',
  'P.S. Collecting is free. Most other things are not.': '附言：收款免费。其他大多数事情可不免费。',
  'Notice regarding your account balance': '关于你的账户余额的通知',
  'Dear Merchant,': '尊敬的商户，',
  'This notice is to inform you that the Payments drawer associated with your account has reached capacity. Any further revenue received will not be retained and is considered lost.':
    '特此通知，与你的账户关联的支付收款箱已达到容量上限。之后收到的任何收入均不会保留，并视为损失。',
  'To restore capacity, please click Payments and collect the balance.':
    '若要恢复容量，请点击支付节点并领取余额。',
  'Please do not reply to this message. Replies are placed under review.':
    '请勿回复此消息。回复将进入审核流程。',
  'Sincerely,\n{0} Resolution Center': '此致，\n{0} 解决中心',
  'Money is falling on the floor': '钱正在往地上掉',
  "Your Payments drawer is full. New revenue is spilling over the edge and we are not picking it up (we'd charge a fee to bend down).":
    '你的支付收款箱满了。新收入正在从边缘溢出，我们可不会帮你捡（弯腰得收手续费）。',
  'Click Payments to collect.': '点击支付节点收款。',
  'Action needed: revenue is spilling': '需要操作：收入正在溢出',
  'A quick look at your dashboard:': '快速看一眼你的仪表盘：',
  'Drawer: full\nIncoming revenue: spilling\nRevenue kept from the spill: none':
    '收款箱：已满\n新收入：正在溢出\n溢出收入保留量：零',
  "Every payment that arrives while the drawer is full is lost. Click Payments to collect what's waiting, and new revenue will land again.":
    '收款箱满时到达的每笔款项都会丢失。点击支付节点，收走等待领取的钱，新收入就又能落袋了。',
  'We make it easy to get paid. Staying paid is a separate product.':
    '我们让收钱变得简单。把钱留住是另一款产品。',
  'Cheers,\n{0}': '祝好，\n{0}',
  'Re: Case #00000: drawer at capacity': '回复：案件 #00000：收款箱达到容量上限',
  'Dear Account Holder,': '尊敬的账户持有人，',
  'We have reviewed your account and determined that your Payments drawer is full. While it remains full, incoming revenue spills and cannot be recovered. {0} is not liable for spilled revenue, under section 9.2(c), which you may find under Legal, then More Legal.':
    '我们已审核你的账户，确认支付收款箱已满。只要它仍然满着，新收入就会溢出，且无法追回。根据第 9.2(c) 条，{0} 不对溢出收入承担责任；该条款可在“法律条款”，然后“更多法律条款”下找到。',
  'Resolution: Click Payments to collect the drawer.': '解决办法：点击支付节点，收走收款箱里的钱。',
  'This case will close automatically. Most things here do.':
    '此案件将自动关闭。这里的大多数事情都如此。',
  'Regards,\nAccount Review': '此致，\n账户审核团队',
  'You have revenue waiting': '你有待领取的收入',
  "You have revenue sitting in your Payments drawer, and your Cash is looking a little thin. Let's fix that!":
    '你的支付收款箱里放着收入，而你的现金却有点紧张。来解决一下吧！',
  'Click Payments to collect it and move it into Cash.': '点击支付节点领取，把它转入现金。',
  'Happy selling,\nThe {0} team': '祝生意兴隆，\n{0} 团队',
  'P.S. Did you know you can view your fees on a beautiful, interactive chart?':
    '附言：你知道吗？你可以在一张精美的交互式图表上查看手续费！',
  'Funds available for collection': '有资金可领取',
  'Our records indicate that revenue is held in your Payments drawer while the Cash balance on your account is low.':
    '我们的记录显示，你的支付收款箱中存有收入，而账户现金余额较低。',
  'These funds are not under review. We checked twice, which is a review, but a short one.':
    '这笔资金未处于审核中。我们查了两遍，这也算审核，不过很短。',
  'To collect, click Payments.': '要领取，请点击支付节点。',
  'Sincerely,\n{0}': '此致，\n{0}',
  'Cash low, drawer not': '现金见底，收款箱可没有',
  'Your Cash is low. Your Payments drawer, meanwhile, is sitting on revenue you already earned.':
    '你的现金不多了。与此同时，支付收款箱里还放着你已经赚到的收入。',
  'One click fixes the mismatch: click Payments to collect, and the money moves where you can spend it.':
    '一键解决这种不匹配：点击支付节点收款，钱就会转到你能花的地方。',
  'Your weekly {0} summary': '你的每周 {0} 摘要',
  "Here's your week at a glance:": '一眼看完你这一周：',
  '- Revenue: in the Payments drawer\n- Cash: low\n- Fees: present and thriving':
    '- 收入：在支付收款箱里\n- 现金：偏低\n- 手续费：健在，且欣欣向荣',
  'The first two would make a lovely pair. Click Payments to collect the revenue into Cash.':
    '前两项本来可以是一对佳偶。点击支付节点，将收入领为现金。',
  'See you next week,\nYour friends at {0}': '下周见，\n你在 {0} 的朋友们',
  "Don't leave money in the drawer": '别把钱留在收款箱里',
  "We noticed you've got revenue waiting in your Payments drawer while your Cash runs low. It's yours! It's just not in Cash until you collect it.":
    '我们注意到，你的现金正在减少，支付收款箱里却有收入等着领。那是你的钱！只是领取之前，它还不算现金。',
  'Click Payments to bring it over.': '点击支付节点，把钱转过来。',
  'Thanks for growing with {0}. We grow a small percentage every time you do.':
    '感谢你与 {0} 共同成长。你每成长一次，我们就跟着增长一小部分比例。',
  'Cheers,\nMerchant Success': '祝好，\n商户成功团队',
  'Your Cash balance is negative': '你的现金余额为负',
  "Two ways back: sell Nodes you don't need, or grow revenue. The first is faster.":
    '两条出路：卖掉不需要的节点，或者增加收入。前者更快。',
  'Best,\nYour bookkeeper at {0}': '顺颂商祺，\n你在 {0} 的记账员',
  'Reminder: balance overdue (to yourself)': '提醒：欠款逾期（欠的是你自己）',
  'Dear Client,': '尊敬的客户，',
  'This is a friendly reminder that your Cash balance is negative.': '温馨提醒：你的现金余额为负。',
  'This is a second, less friendly reminder in the same email, to save time.':
    '这是同一封邮件里的第二次提醒，没那么温馨，为了节省时间。',
  'Please review your Nodes and sell any you do not need, or grow revenue until the balance is above zero again.':
    '请检查你的节点，卖掉不需要的，或增加收入，直到余额重新高于零。',
  'If you have already done so, please disregard this email. We checked. You have not.':
    '如果已经处理，请忽略此邮件。我们查过了。你还没有。',
  'Kind regards,\nAccounts, {0}': '谨致问候，\n{0} 财务团队',
  'Automated ledger check': '自动账簿检查',
  'Account: Cash\nBalance: negative\nStatus: Rounded down, then down again':
    '账户：现金\n余额：负数\n状态：向下取整，然后继续向下',
  'Suggested next steps:\n- Sell Nodes you do not need\n- Grow revenue':
    '建议下一步：\n- 卖掉不需要的节点\n- 增加收入',
  'Generated by {0}. This notice has been filed next to the last one.':
    '由 {0} 生成。此通知已归档在上一封旁边。',
  'We need to talk about the red number': '我们得聊聊那个红色数字',
  "I was going through this month's books and hoped the red was a formatting choice. It is not: your Cash balance is negative.":
    '我核对本月账目时，还希望红色只是你选的格式。可惜不是：你的现金余额为负。',
  "I'm not here to judge. I've seen founders come back from worse. They usually did one of two things: sold the Nodes they weren't really using, or grew revenue. Usually the first, then the second.":
    '我不是来评判你的。我见过创始人从更糟的处境里翻身。他们通常做了两件事中的一件：卖掉其实没怎么用的节点，或者增加收入。通常是先做前者，再做后者。',
  "Let me know if you'd like me to walk through the numbers. I'm free; my hourly rate is not.":
    '如果想让我陪你过一遍数字，请告诉我。我有空；但我的时薪可不免费。',
  'Warmly,\nYour accountant at {0}': '诚挚问候，\n你在 {0} 的会计',
  'Quick one': '简单说一句',
  "Cash is negative. Sell the Nodes you don't need, or grow revenue. I'd start with the Nodes.":
    '现金为负。卖掉不需要的节点，或者增加收入。我会先从节点下手。',
  'That\'s all. I\'m putting this in a folder labelled "Concerns".':
    '就这些。我会把这封信放进一个叫“担忧”的文件夹。',
  "Reminder: this quarter's Guidance": '提醒：本季度业绩指引',
  "Now that you're a public company, the market remembers what you tell it. This quarter, that's your Guidance: the number you promised.":
    '你现在是上市公司了，市场会记住你说的话。本季度，它记住的是你的业绩指引：你承诺的那个数字。',
  "Meet it. Analysts are kind to companies that do what they said, and creative with the ones that don't.":
    '达成它。分析师对兑现承诺的公司很友善，对没兑现的公司则很有创作欲。',
  'Best,\nYour accountant at {0}': '顺颂商祺，\n你在 {0} 的会计',
  'Your Guidance is not a suggestion': '你的业绩指引不是建议',
  'As a public company, you set Guidance for this quarter, a number promised to the market. Please plan to meet it.':
    '作为上市公司，你为本季度设定了业绩指引，也就是向市场承诺的数字。请做好达成它的计划。',
  'For your reference, phrases such as "headwinds", "a challenging macro environment", and "quite frankly" do not count toward Guidance. We have checked the ledger for them.':
    '供你参考：“逆风”“充满挑战的宏观环境”和“坦白说”等措辞，均不能计入业绩指引。我们在账簿里查过了。',
  'Kind regards,\nInvestor Reporting, {0}': '谨致问候，\n{0} 投资者报告团队',
  'Quarter-end checklist': '季末检查清单',
  'Your quarter-end checklist from {0}:': '来自 {0} 的季末检查清单：',
  '- Books reconciled: in progress\n- Receipts attached: some\n- Guidance met: please':
    '- 账目核对：进行中\n- 收据附件：有一些\n- 达成业绩指引：拜托了',
  "You're public now. You told the market a number for this quarter, and the market wrote it down. Let's meet the Guidance you set.":
    '你现在上市了。你向市场报了本季度的一个数字，市场也记下来了。来达成你设定的业绩指引吧。',
  'Thanks,\nThe bookkeeping team': '谢谢，\n记账团队',
  'About that number you promised': '关于你承诺的那个数字',
  'A small reminder, in the spirit of public-company life: this quarter you set Guidance, and the market is holding you to it.':
    '作为上市公司生活的一部分，小小提醒一下：你为本季度设定了业绩指引，市场正盯着你兑现。',
  "I've been doing books for a long time. Private companies can have a bad quarter. Public companies have a bad quarter, a bad earnings call, and a bad week of headlines. Meet the number.":
    '我做账很多年了。非上市公司可能会有一个糟糕的季度。上市公司则会有一个糟糕的季度、一场糟糕的财报电话会，以及一整周糟糕的新闻头条。把那个数字做出来。',
  "If you need me, I'll be here, quietly highlighting cells.":
    '需要我的话，我就在这里，默默给单元格标亮。',
  'Cheers,\nYour accountant, {0}': '祝好，\n你的会计，{0}',
  'Guidance: the market is watching': '业绩指引：市场在看着',
  'Automated reminder': '自动提醒',
  'Company status: Public\nThis quarter: Guidance set\nAction: Meet the Guidance you set':
    '公司状态：已上市\n本季度：已设定业绩指引\n操作：达成你设定的业绩指引',
  'Guidance is the number you promised the market for the quarter. We recommend promising carefully and delivering exactly.':
    '业绩指引就是你向市场承诺的季度数字。我们建议谨慎承诺，精准兑现。',
  'Generated by {0}. Please retain for your records, as we will not.':
    '由 {0} 生成。请留存备查，因为我们不会替你留。',
  'Quick intro: {0} x your {1}': '简单认识一下：{0} × 你的 {1}',
  'Long-time lurker, first-time emailer. We love what you are building. Like, really love it. Three partners screenshotted your Board this morning and one of them cried a little.':
    '潜水已久，第一次来信。我们很喜欢你做的东西。真的，特别喜欢。今天早上有三位合伙人截了你的看板，其中一位还感动得掉了点眼泪。',
  'We lead rounds, and we would like to lead your {0}. Would love to grab coffee, or a call, or a walk, whichever moves fastest.':
    '我们做领投，也想领投你的 {0}。很想约杯咖啡、打个电话，或者散个步，哪个最快就选哪个。',
  'If you are ready, hit Raise. If the timing is wrong, Decline, and we will pretend to be fine about it.':
    '准备好了就点“融资”。时机不对就点“拒绝”，我们会假装无所谓。',
  'Warmly,\nA partner at {0}': '诚挚问候，\n{0} 的一位合伙人',
  "{0}: we're in. Are you?": '{0}：我们决定投了。你呢？',
  'Founder,': '创始人，',
  'Keeping this short because the market is not waiting. Other funds are circling your {0} round. We would rather lead it than read about it.':
    '长话短说，市场可不等人。其他基金正在围着你的 {0} 融资转。我们更想领投，而不是事后读新闻。',
  'Raise, and we move today.\nDecline, and we will be here, refreshing your metrics.':
    '点“融资”，我们今天就行动。\n点“拒绝”，我们也会在这里，不停刷新你的指标。',
  'Sent from my phone, which is how all conviction is sent\n{0}':
    '发自我的手机，毕竟所有坚定信念都是这样发出的\n{0}',
  'On the long arc of your {0}': '着眼你 {0} 的长远未来',
  'Dear founder,': '亲爱的创始人，',
  "At {0} we do not invest in companies. We invest in decades. We have watched many Boards come and go, and yours has the quiet look of something that will still be running when our grandchildren's funds are raising.":
    '在 {0}，我们投资的不是公司，而是数十年的未来。我们看过许多看板兴衰来去，而你的看板有一种沉稳的气质：等到我们孙辈的基金开始募资时，它大概还在运行。',
  'We would be honoured to lead your {0} round. Patient capital, aligned incentives, and a board seat we promise to use sparingly.':
    '我们很荣幸能领投你的 {0} 融资。耐心资本、利益一致，以及一个我们保证尽量少用的董事席位。',
  'Should you wish to proceed, choose Raise. Should you not, Decline, and we shall wait. We are very good at waiting.':
    '若你愿意推进，请选择“融资”。若不愿意，就选择“拒绝”，我们会等。等待这件事，我们很擅长。',
  'With respect,\nThe partners of {0}': '谨致敬意，\n{0} 的合伙人们',
  'Make something users want. Then raise.': '做用户想要的东西。然后融资。',
  'Some notes from our side:': '我们这边的几点想法：',
  "- Default alive beats default dead.\n- Do things that don't scale, then scale them.\n- Raise when someone offers.":
    '- 默认能活，比默认会死强。\n- 先做无法规模化的事，再把它规模化。\n- 有人出钱时就融资。',
  'Someone is offering. {0} wants to lead your {1} round.':
    '现在就有人出钱。{0} 想领投你的 {1} 融资。',
  'Raise if you want the money. Decline if you would rather keep building on instant noodles. Both are fine. One is faster.':
    '想要这笔钱，就点“融资”。宁愿继续靠泡面撑着做产品，就点“拒绝”。都可以。其中一条路更快。',
  'Re: Re: your {0} (bumping this up)': '回复：回复：你的 {0}（顶一下）',
  'Hey! Just floating this back to the top of your inbox in case it got buried under your 3 a.m. alerts.':
    '嗨！再把这封信顶到收件箱上面，免得它被你凌晨三点的告警埋了。',
  'TL;DR: we would love to lead your {0} round. We are founder-friendly, operator-led, thesis-driven, and every other hyphenated word on our website.':
    '太长不看版：我们很想领投你的 {0} 融资。我们对创始人友好、由实干者主导、以投资论点驱动，以及官网上写的其他所有带连字符的词。',
  'No pressure. (Some pressure.) Raise, and the paperwork lands before you finish your coffee. Decline, and we will circle back next quarter, as is tradition.':
    '没有压力。（还是有点压力。）点“融资”，你咖啡还没喝完，文件就送到了。点“拒绝”，我们下季度再来跟进，传统如此。',
  'P.S. Loved your last commit message.': '附言：很喜欢你上次的提交说明。',
  'Insight is for spending': '洞察就是用来花的',
  'You have been saving Insight the way some people save string: carefully, and for no reason anyone can name. You have enough now to research something.':
    '你攒洞察的样子，就像有些人攒绳头：小心翼翼，却没人说得清为什么。你现在已经攒够，可以研究点东西了。',
  'Open Research and spend it. Knowledge that sits in a drawer is not knowledge. It is a drawer.':
    '打开研究，把它花掉。放在抽屉里的知识不是知识，只是抽屉。',
  'Yours,\n{0}': '此致，\n{0}',
  'A short note on Insight': '关于洞察的简短提醒',
  'You have enough Insight to research something. You have not.':
    '你的洞察足够研究点东西了。但你还没研究。',
  'Unspent Insight is a lesson you paid for and then declined to attend.':
    '没花掉的洞察，就像付了学费却不去上的课。',
  'Open Research. Spend your Insight. Then return to work.': '打开研究。花掉洞察。然后回去工作。',
  'Something I learned the slow way': '一个我吃了苦头才学到的道理',
  'Early in my career I kept a notebook of things I meant to learn properly. By the time I opened it, half the entries were obsolete and the other half were the causes of my outages.':
    '刚入行时，我有个笔记本，记着打算好好学的东西。等我打开它时，一半内容已经过时，另一半则成了我服务宕机的原因。',
  'You are keeping that notebook now. You have enough Insight to research something.':
    '你现在也在留着那个笔记本。你的洞察足够研究点东西了。',
  'Open Research and spend your Insight. Pick the thing that bit you most recently. It will bite less.':
    '打开研究，花掉你的洞察。就选最近让你吃过苦头的那一项。下次就没那么疼了。',
  'Warmly,\n{0}': '诚挚问候，\n{0}',
  'P.S. Yes, I still have the notebook. No, you cannot see it.':
    '附言：是的，我还留着那本笔记。不，你不能看。',
  'Three questions before you build more': '继续搭建前，先问三个问题',
  'Before you place another Node, ask yourself:': '放下下一个节点前，先问问自己：',
  '1. What broke last?\n2. Do I understand why?\n3. Could I learn something so it never breaks that way again?':
    '1. 上次是什么坏了？\n2. 我明白原因吗？\n3. 能不能学点什么，让它以后不再以同样的方式坏掉？',
  'The answer to the third is yes. You have enough Insight to research something. Open Research and spend your Insight.':
    '第三个问题的答案是能。你有足够的洞察来研究点东西。打开研究，花掉你的洞察。',
  'With regards,\n{0}': '谨致问候，\n{0}',
  'You are allowed to learn things': '你是可以学点东西的',
  'A ship in harbour is safe, but that is not what ships are for. Insight in your pocket is safe too, and it is doing exactly as much.':
    '船停在港湾里很安全，但造船可不是为了这个。洞察揣在兜里也很安全，而且同样什么也没干。',
  'You have enough to research something. Open Research, spend your Insight, and go find out what you have been guessing at.':
    '你的洞察已经够研究点东西了。打开研究，花掉洞察，把一直靠猜的事情弄明白。',
  'Onward,\n{0}': '继续前进，\n{0}',
  'The bell is not rung by accident': '上市的钟不会自己敲响',
  'People imagine going public as a single morning: a bell, a balloon drop, a photograph. It is not. It is a long list of dull things done well.':
    '人们想象中的上市只有一个早晨：敲钟、气球落下、拍照。其实不是。它是一长串乏味的事，每件都得做好。',
  'Your two dull things are these: grow to {0} users, and clear the IPO checklist. Then you may have your bell.':
    '你要做的两件乏味事是：把用户数增长到 {0}，完成 IPO 清单。然后就能去敲钟了。',
  'With great expectations,\n{0}': '满怀期待，\n{0}',
  'Public is a promise': '上市是一份承诺',
  'A private company may be wrong in private. A public one is wrong in the newspaper.':
    '私营公司可以关起门来犯错。上市公司犯错，会登上报纸。',
  'To go public, grow to {0} users and clear the IPO checklist. Both, not one. The market can count, and it reads checklists.':
    '要上市，就得把用户数增长到 {0}，并完成 IPO 清单。两项都要，一项不够。市场会数数，也会看清单。',
  'On IPOs, and on patience': '谈上市，也谈耐心',
  'Hello again,': '又见面了，',
  'I was asked once what separates a company that goes public from one that merely wants to. My answer then, and now: the boring part.':
    '曾经有人问我，真正上市的公司和只想上市的公司，差别在哪里。我当时的答案和现在一样：那些无聊的部分。',
  'The exciting part is the user count. Grow to {0} users. The boring part is the IPO checklist, and you must clear all of it. Founders who skip the boring part become case studies, and I have taught enough of those.':
    '激动人心的部分是用户数。把它增长到 {0}。无聊的部分是 IPO 清单，而你必须全部完成。跳过无聊部分的创始人，最后都会变成教学案例；那样的案例，我已经讲够多了。',
  'Do both, and you can go public.': '两项都完成，你就能上市。',
  'Fondly,\n{0}': '亲切问候，\n{0}',
  'Your road to going public': '你的上市之路',
  'Where you are going:\nPublic.': '你要去的地方：\n上市。',
  'What stands between you and it:\n- {0} users. Grow until you have them.\n- The IPO checklist. Clear every line.':
    '挡在你和目标之间的事：\n- {0} 位用户。继续增长，直到达到这个数。\n- IPO 清单。逐项完成。',
  'What does not stand between you and it:\n- A nicer logo.\n- A bigger office.\n- My approval, which you already have.':
    '没有挡在你和目标之间的事：\n- 更漂亮的标志。\n- 更大的办公室。\n- 我的认可，你已经有了。',
  'Before the bell, the work': '敲钟之前，先干活',
  'One day someone will ask you to explain your whole system in a single slide. You will be tempted to use forty. Resist.':
    '总有一天，有人会让你用一页幻灯片解释整个系统。你会忍不住想用四十页。忍住。',
  'But first, earn the question. Grow to {0} users and clear the IPO checklist to go public. The first proves people want it. The second proves you can be trusted with it.':
    '不过先得做到值得被问。把用户数增长到 {0}，完成 IPO 清单，就能上市。前者证明人们想要你的产品，后者证明你值得托付。',
  'I am proud of how far you have come. Do not tell anyone I said so.':
    '你能走到今天，我很骄傲。别告诉别人是我说的。',
  'The {0} round is {1} users away': '距离 {0} 融资还差 {1} 位用户',
  'You will want to raise the {0} round now. Everyone does. But money follows users, not wishes.':
    '你现在一定想进行 {0} 融资。大家都这样。但钱跟着用户走，不跟着愿望走。',
  'Grow to {0} users, and the {1} round will come to you. Until then, keep the Design healthy and the users happy.':
    '把用户数增长到 {0}，{1} 融资自然会来。在那之前，保持设计健康，让用户满意。',
  'Patiently,\n{0}': '耐心等候，\n{0}',
  'Not yet.': '还没到时候。',
  'Grow to {0} users. Then raise the {1} round.': '把用户数增长到 {0}。然后再进行 {1} 融资。',
  'A fundraise before its time is a distraction with paperwork attached. I will not elaborate. You will not need me to.':
    '过早融资，只是在分心的事情上再附送一堆文书。我就不展开了。你也不需要我展开。',
  'What I would do in your seat': '换作是我，会怎么做',
  'You were about to ask, so here is what I would do in your seat:':
    '你正要问，所以我先说，换作是我会这么做：',
  '- Stop refreshing the investor pages.\n- Watch what slows your users down, and fix it.\n- Grow to {0} users.\n- Then raise the {1} round, from strength.':
    '- 别再刷新投资人页面。\n- 看看是什么拖慢了用户，然后修好它。\n- 把用户数增长到 {0}。\n- 然后，带着底气进行 {1} 融资。',
  'That is the whole plan. Plans that fit in four lines are the only ones I trust.':
    '这就是全部计划。能用四行写完的计划，才是我信得过的计划。',
  'A word about the {0} round': '关于 {0} 融资的几句话',
  'I have sat on both sides of the table. The founders who raised well did not have the best decks. They walked in already needing the money, because the users had arrived first.':
    '谈判桌的两边我都坐过。融资顺利的创始人，靠的不是最漂亮的演示文稿。他们走进来时就已经需要这笔钱了，因为用户先到了。',
  'Grow to {0} users to raise the {1} round. Let your users make the argument. It is the only one investors cannot interrupt.':
    '把用户数增长到 {0}，就能进行 {1} 融资。让用户替你说话。这是唯一一种投资人没法打断的论据。',
  'With confidence in you,\n{0}': '对你充满信心，\n{0}',
  'Users first, then the {0}': '先有用户，再谈 {0}',
  'The order of things matters more than the things. Users, then money. Never money, then users.':
    '事情的顺序，比事情本身更重要。先有用户，再有钱。绝不能先有钱，再找用户。',
  'You need {0} users to raise the {1} round. Every user you serve well tells a friend. Every user you serve slowly tells a friend too, just differently.':
    '进行 {1} 融资需要 {0} 位用户。服务得好的用户会告诉朋友。服务得慢的用户也会告诉朋友，只是说法不太一样。',
  'Build for them. The round will keep.': '为他们好好做产品。融资可以等等。',
  'Yours, in no particular hurry,\n{0}': '不急不忙地支持你，\n{0}',
  '[TRIGGERED] 1 incident: {0} is down': '[已触发] 1 起故障：{0} 已宕机',
  'You have 1 triggered incident assigned to you.': '你有 1 起已触发的故障待处理。',
  'Incident: {0} failed\nStatus: TRIGGERED\nUrgency: High\nAssigned to: you (you are the whole rotation)':
    '故障：{0} 失效\n状态：已触发\n紧急程度：高\n指派给：你（整个轮值表上只有你）',
  'Resolution: select {0} and click Replace. It will not replace itself, however long you stare at it.':
    '解决方法：选中 {0}，点击更换。不管你盯着它看多久，它都不会自己更换自己。',
  "{0}'s graph has gone flat": '{0} 的曲线归零了',
  'The line for {0} went flat a moment ago. Flat is not calm. Flat means the node failed and is serving nothing.':
    '{0} 的曲线刚刚拉平了。平不代表平静。平代表节点失效，一个请求也处理不了了。',
  'The fix is short: select {0} and click Replace. A fresh one takes its place.':
    '修复方法很简短：选中 {0}，点击更换。一个新的就会接替它。',
  "We'll keep watching the line so you don't have to. (You will anyway.)":
    '我们会继续盯着曲线，这样你就不用盯了。（反正你还是会盯。）',
  'We saw {0} fall over. Now you have too.': '我们看见 {0} 倒下了。现在你也看见了。',
  "{0} failed. Every request sent its way is now an error, and we've counted all of them.":
    '{0} 失效了。发给它的每个请求现在都会报错，我们一个不漏地记下来了。',
  'What to do:\n1. Select {0}.\n2. Click Replace.\n3. Watch the count stop climbing.':
    '该怎么做：\n1. 选中 {0}。\n2. 点击更换。\n3. 看着报错数停止攀升。',
  'First seen: just now\nLast seen: still now': '首次出现：刚刚\n最近出现：还是刚刚',
  '{0} failed again': '{0} 又失效了',
  "If this feels familiar, it's because {0} has failed again. Hardware is mortal, and an instance is just hardware with a nicer name.":
    '如果这感觉似曾相识，那是因为 {0} 又失效了。硬件也是会寿终正寝的，实例不过是硬件换了个好听的名字。',
  'Same drill as before: select {0} and click Replace. Nothing about the fix has changed, which is honestly the most comforting part of this email.':
    '还是老办法：选中 {0}，点击更换。修复方法一点没变，老实说，这是这封邮件里最让人安心的部分。',
  'Regards,\nOn-call notifications, {0}': '此致，\n{0} 值班通知',
  'ESCALATED: {0} is down': '已升级：{0} 已宕机',
  'Escalation level 1 of 1': '升级级别：1，总共 1 级',
  'This incident has been escalated to the next person on the rotation. The next person on the rotation is you.':
    '这起故障已升级给轮值表上的下一位。轮值表上的下一位还是你。',
  '{0} has failed and is not serving traffic. To resolve it, select {1} and click Replace.':
    '{0} 已失效，无法处理流量。要解决问题，请选中 {1}，点击更换。',
  'No one else is coming. We checked.': '不会有其他人来了。我们查过了。',
  '{0} Incident Response': '{0} 故障响应',
  'New issue: slow query, full table scan': '新问题：慢查询，全表扫描',
  'New issue in production': '生产环境出现新问题',
  'SlowQueryWarning: a new query has no index\nEvents: every read\nFirst seen: a moment ago':
    'SlowQueryWarning：新查询没有索引\n事件：每次读取\n首次出现：片刻之前',
  'Every read now scans the whole table, row by row, like someone looking for their keys in every drawer of the house. Reads that took a blink now take a while, and the Database is doing all of it.':
    '现在每次读取都会逐行扫描整张表，就像找钥匙时把家里每个抽屉都翻一遍。原本眨眼就完成的读取，现在要花上一阵子，而这些活全落在数据库身上。',
  'Database read latency is climbing': '数据库读取延迟正在攀升',
  "Your Database latency panel is going up and to the right. On a revenue chart that would be good news. Here it isn't.":
    '你的数据库延迟面板正在向右上方攀升。如果这是营收图，那会是好消息。但在这里不是。',
  'Cause: a new query has no index, so every read scans the table.':
    '原因：一个新查询没有索引，所以每次读取都要扫描整张表。',
  'Kind regards,\nThe {0} alerting team': '诚挚问候，\n{0} 告警团队',
  '[TRIGGERED] Slow query on the Database': '[已触发] 数据库慢查询',
  'Incident: slow query\nService: Database\nUrgency: High':
    '故障：慢查询\n服务：数据库\n紧急程度：高',
  'Summary: a new query shipped without an index. Each read now scans the table end to end instead of jumping to the row it wants. The scans pile up, and everything waiting on the Database waits longer.':
    '摘要：新上线的查询没有索引。现在每次读取都得从头到尾扫完整张表，不能直接跳到需要的那一行。扫描越积越多，所有等数据库的事情也就等得越久。',
  "Re: slow query (it's back)": '回复：慢查询（它又来了）',
  'Hi again,': '又见面了，',
  "Another query without an index. Same story as last time: there's nothing to look rows up by, so every read scans the table from the first row to the last.":
    '又是一个没有索引的查询。和上次一样：没有可用来定位行的索引，每次读取都得从第一行扫到最后一行。',
  "Somewhere a Database is reading the phone book to find one number. It's yours.":
    '某处有个数据库正在通读整本电话簿，只为找一个号码。就是你的那个。',
  'Your table is being read cover to cover': '你的表正在被从头读到尾',
  "Quick heads-up: a new query arrived without an index. That means no shortcuts. Every read walks the full table, and the Database's day just got a lot longer.":
    '提醒一下：新来的查询没有索引。这就意味着没捷径可走。每次读取都要遍历整张表，数据库今天的班突然长了不少。',
  'Reads stay slow until this is over.': '这件事结束之前，读取会一直很慢。',
  'P.S. "It was fast on my laptop" is true. Your laptop has eleven rows.':
    '附言：“在我笔记本上挺快的”是真的。你的笔记本里只有十一行。',
  '[TRIGGERED] Poison message in the queue': '[已触发] 队列中有毒消息',
  'Incident: poison message\nUrgency: High': '故障：毒消息\n紧急程度：高',
  "One task keeps failing. The workers keep retrying it instead of draining the queue, so the line behind it isn't moving.":
    '有个任务一直失败。工作进程不断重试它，顾不上处理队列，所以排在它后面的任务全都停住了。',
  "The task is not going to succeed on attempt 400. It didn't on attempt 3.":
    '这个任务第 400 次也不会成功。第 3 次就没成功。',
  'The same task failed. And failed. And failed.': '同一个任务失败了。又失败了。又失败了。',
  "We've grouped these into one issue because they're all the same: one task, failing, over and over.":
    '我们把这些归成了一个问题，因为它们全都一样：同一个任务，一遍又一遍地失败。',
  "What's happening: your workers retry the failing task instead of draining the queue. That's a poison message. Everything queued behind it waits.":
    '当前情况：工作进程反复重试失败的任务，顾不上处理队列。这就是毒消息。排在它后面的任务全都在等。',
  'Events: still counting\nUsers affected: everyone in line':
    '事件数：还在数\n受影响用户：所有排队的人',
  'Queue depth: up. Work done: flat.': '队列深度：上升。完成工作量：不动。',
  'Two of your panels disagree. Queue depth keeps rising. Work completed has gone flat.':
    '你的两个面板意见不一致。队列深度不断上升，已完成工作量却拉成了一条平线。',
  'The reason is a single task that keeps failing. The workers retry it again and again rather than draining the queue, so new work just stacks up.':
    '原因是一个始终失败的任务。工作进程一遍遍重试它，顾不上处理队列，新任务只好不断堆积。',
  "The graph isn't broken. The queue is.": '图表没坏。队列坏了。',
  'Re: poison message, again': '回复：又是毒消息',
  "A task that can't succeed is back on the menu. The workers are retrying it instead of working through the queue, which is loyal of them but not useful.":
    '那个不可能成功的任务又回到菜单上了。工作进程一直重试它，顾不上处理队列。很忠诚，但没什么用。',
  'The queue fills up while they try.': '它们一边尝试，队列一边填满。',
  'Best,\n{0}': '祝好，\n{0}',
  'Incident opened: queue not draining': '故障已创建：队列无法消化积压',
  'Dear on-call engineer,': '值班工程师，你好：',
  'At the time of writing, a task in your queue has failed every attempt. Workers continue to retry it in preference to draining the queue. In the industry this is known as a poison message; in the office it is known as "why is everything stuck".':
    '写下这封邮件时，你队列中的一个任务每次尝试都失败。工作进程仍优先重试它，而不处理队列。业内称之为毒消息，办公室里称之为“怎么全卡住了”。',
  'This notice will be followed by more notices.': '本通知后还会有更多通知。',
  'Sincerely,\n{0} Incident Management': '此致，\n{0} 故障管理团队',
  'HTTP DDoS attack alert: your edge': 'HTTP DDoS 攻击告警：你的边缘节点',
  'HTTP DDoS Attack Alert': 'HTTP DDoS 攻击告警',
  'Description: a flood of junk traffic is hitting your edge.\nDetected: just now\nAttack type: HTTP flood, artisanal\nMaximum rate: yes\nAttack target: you\nRule that matched: "Requests that want nothing"':
    '描述：大量垃圾流量正涌向你的边缘节点。\n检测时间：刚刚\n攻击类型：HTTP 洪水，手工精制\n最大速率：是的\n攻击目标：你\n匹配规则：“什么也不想要的请求”',
  'We are standing between the flood and your Design. We are very large, and we would like you to remember that at renewal time.':
    '我们正挡在洪水和你的设计之间。我们的体量很大，希望你续费时能记住这一点。',
  'Checking if your traffic is human...': '正在检查你的流量是否来自人类……',
  'Checking if your traffic is human. This may take a few seconds.':
    '正在检查你的流量是否来自人类。这可能需要几秒钟。',
  'It is not human.': '不是人类。',
  'A flood of junk traffic is hitting your edge. We have met botnets before, but this one has range: smart fridges, a parking meter, and at least one baby monitor, all asking for your home page at once.':
    '大量垃圾流量正涌向你的边缘节点。我们以前见过僵尸网络，但这次的种类特别丰富：智能冰箱、停车收费表，还有至少一台婴儿监视器，全都同时索要你的首页。',
  'Please stand by.': '请稍候。',
  'The {0} Trust & Safety team': '{0} 信任与安全团队',
  'Attention Required! Your edge is under attack': '请注意！你的边缘节点正遭受攻击',
  'Attention Required!': '请注意！',
  'What happened?\nA flood of junk traffic is hitting your edge. None of these requests want to buy anything. They only want to arrive, all of them, at the same time.':
    '发生了什么？\n大量垃圾流量正涌向你的边缘节点。这些请求没有一个想买东西。它们只想到达，全部，同时。',
  'What can I do?\nIf you are a visitor: nothing. You are probably a toaster.\nIf you own the site: watch the Board and see how your Design takes a wave this size.':
    '我能做什么？\n如果你是访客：什么也做不了。你大概是台烤面包机。\n如果你是站长：盯着看板，看看你的设计能不能扛住这么大的浪。',
  'Ray ID: 8b0f13c7a2e9\nPerformance & security by {0}':
    'Ray ID：8b0f13c7a2e9\n性能与安全服务由 {0} 提供',
  'Sorry, they have been blocked (not you)': '抱歉，他们被拦截了（不是你）',
  'Sorry, you have been blocked.': '抱歉，你已被拦截。',
  'Not you. Them. A flood of junk traffic is hitting your edge, and we are showing them this page a few million times a minute.':
    '不是你。是他们。大量垃圾流量正涌向你的边缘节点，我们每分钟向他们展示这个页面几百万次。',
  'Somewhere in the queue are your real users, on their ninth picture of traffic lights. They would like you to know they found every bicycle.':
    '队伍里还混着你的真实用户，正辨认第九张红绿灯图片。他们想让你知道，他们真的把每辆自行车都找出来了。',
  'Regards,\nThe {0} Edge': '此致，\n{0} 边缘网络',
  'Re: the flood (it is still flooding)': '回复：洪水（还在淹）',
  'The junk traffic at your edge has not let up. If anything, it brought friends.':
    '你边缘节点上的垃圾流量丝毫没有减弱。真要说有什么变化，就是它还带了朋友来。',
  'Our network handles a very large share of the internet, and today a worrying part of that share is about you. Congratulations on being popular with the wrong crowd.':
    '我们的网络承载着互联网很大一部分流量，而今天，其中令人担忧的一部分都冲着你来了。恭喜你在不该受欢迎的圈子里出了名。',
  'Still standing,\n{0}': '仍在坚守，\n{0}',
  'P.S. If half the internet goes dark later today, that one is on us, not them.':
    '附言：如果今天晚些时候半个互联网都黑了，那是我们的锅，不是他们的。',
  '[TRIGGERED] Cache stampede': '[已触发] 缓存击穿',
  'Incident: cache stampede\nServices: Cache, Database\nUrgency: High':
    '故障：缓存击穿\n服务：缓存、数据库\n紧急程度：高',
  'The Cache restarted empty. Every request is now a miss, and every miss goes straight to the Database. All at once. Together. Like a herd.':
    '缓存重启后空空如也。现在每个请求都未命中，每次未命中都直奔数据库。同时。一起。像一群狂奔的牛。',
  'Cache hit rate: 0%. Database: not okay.': '缓存命中率：0%。数据库：不太好。',
  'Your cache hit rate fell to zero the moment the Cache restarted. It came back empty, with nothing in it to serve.':
    '缓存重启的那一刻，命中率就跌到了零。它回来时空空如也，没有任何内容可供响应。',
  'So every miss goes to the Database, and the Database panel now looks like a cliff face drawn upside down.':
    '于是每次未命中都去了数据库，数据库的面板现在像一面倒着画的悬崖。',
  'Brace yourself.': '做好心理准备。',
  'Database load jumped after a Cache restart': '缓存重启后，数据库负载骤增',
  'Database load just jumped. We traced it back: the Cache restarted empty, and now every request misses and runs to the Database for the answer.':
    '数据库负载刚刚猛涨。我们追查到了原因：缓存重启后空了，现在每个请求都未命中，都跑去数据库找答案。',
  'This is called a cache stampede. Your Database is the thing being stampeded.':
    '这叫缓存击穿。你的数据库就是被埋在下面的那个。',
  'First seen: right after the restart': '首次出现：重启之后立刻',
  'Re: cache stampede (another one)': '回复：缓存击穿（又一次）',
  'The Cache restarted empty again, and the herd is back: every miss heading to the Database at the same time.':
    '缓存又一次空着重启了，牛群又来了：所有未命中的请求同时冲向数据库。',
  "Nothing personal against your Database. It's just the only one left who knows the answers.":
    '它们对你的数据库没有私人恩怨。只是现在只有它还知道答案。',
  'Your Cache woke up with amnesia': '你的缓存一觉醒来失忆了',
  "Good morning (it's always morning somewhere on call),": '早上好（值班的人总有一个正过着早晨），',
  "The Cache restarted, and it came back remembering nothing. That's normal for a cache. What isn't fun is what happens next: every request misses, and every miss goes to the Database.":
    '缓存重启了，回来后什么也不记得。这对缓存来说很正常。不那么好玩的部分在后面：每个请求都未命中，每次未命中都去了数据库。',
  'Picture a library where the front desk forgot every answer, so everyone walks to the archive at once. The archive is your Database.':
    '想象一座图书馆，前台把所有答案都忘了，于是大家同时跑向档案室。档案室就是你的数据库。',
  'Regards,\n{0} Incident Response': '此致，\n{0} 故障响应团队',
  '[TRIGGERED] Zone {0} is down': '[已触发] 可用区 {0} 已宕机',
  'Incident: zone outage\nZone: {0}\nUrgency: High\nStatus: TRIGGERED':
    '故障：可用区中断\n可用区：{0}\n紧急程度：高\n状态：已触发',
  'Zone {0} is down. Everything you run there is unreachable until it comes back.':
    '可用区 {0} 已宕机。在它恢复之前，你部署在那里的所有资源都无法访问。',
  "You are hearing this before the status page says anything. That's the service.":
    '状态页还没开口，你就已经知道了。这就是我们的服务。',
  'Every panel for zone {0} just went flat': '可用区 {0} 的所有面板刚刚都归零了',
  "A whole row of your dashboard flatlined at once. That isn't a coincidence: zone {0} is down.":
    '你的仪表盘上一整排曲线同时归零了。这不是巧合：可用区 {0} 宕机了。',
  'One flat graph is bad luck. A zone of them is geography.':
    '一条曲线归零是运气不好。整个可用区都归零，那就是地理问题了。',
  'Errors from everything in zone {0}': '可用区 {0} 的所有节点都在报错',
  'We got a burst of errors from every node in zone {0} at the same moment, so we checked: the zone itself is down.':
    '我们同时收到了可用区 {0} 中每个节点的大量报错，于是查了一下：整个可用区都宕机了。',
  'This is not a bug in your code. This time.': '这不是你代码里的缺陷。至少这次不是。',
  "We saw it first. You're seeing it now.": '我们先看见了。现在轮到你了。',
  'Zone {0} is down again': '可用区 {0} 又宕机了',
  'Zone {0} has gone down again. Same zone, same outage, same sinking feeling.':
    '可用区 {0} 又宕机了。同一个可用区，同一种中断，同一种心往下沉的感觉。',
  "We'd tell you the provider's status page still shows all green, but you've probably guessed that already.":
    '我们本来想告诉你，供应商状态页还是一片绿，但你大概已经猜到了。',
  'Availability event: zone {0}': '可用性事件：可用区 {0}',
  'AVAILABILITY EVENT': '可用性事件',
  'Affected zone: {0}\nState: down\nAffected resources: everything in zone {1}':
    '受影响可用区：{0}\n状态：宕机\n受影响资源：可用区 {1} 中的全部资源',
  'A zone outage is in progress. Resources in the other zones are not affected by this event. Resources in zone {0} are very affected by this event.':
    '可用区中断仍在持续。其他可用区的资源不受本次事件影响。可用区 {0} 中的资源则深受影响。',
  'Updates will follow when there is something to update.': '有可更新的内容时，我们会继续更新。',
  '[SEV1] Data breach: an advisory you did not patch': '[SEV1] 数据泄露：你没修补的那份安全通告',
  'Incident: data breach\nUrgency: Critical': '故障：数据泄露\n紧急程度：严重',
  'Someone used a vulnerability that was disclosed to you, with a deadline, and the deadline passed. Customer data left the building. Users are leaving after it.':
    '有人利用了一个漏洞。这个漏洞早就通知过你，还附了截止日期，而期限已经过了。客户数据离开了公司，用户也跟着走了。',
  'The ticket is gone from the backlog. The consequence is not.':
    '工单已经从待办列表里消失了。后果还没有。',
  'We told you so (it was in the backlog)': '早就告诉过你了（在待办列表里）',
  'The advisory that was on your backlog, in red, got exploited. Data is out. A share of your Users have read the news and are going elsewhere.':
    '待办列表里那份标红的安全通告，对应的漏洞被利用了。数据泄露了。部分用户看到了新闻，正在转投别处。',
  'There is no button for this one. It will pass. Patch the next one on time.':
    '这次没有哪个按钮能解决。事情会过去。下次记得按时打补丁。',
  'Sincerely,\nThe {0} team': '此致，\n{0} 团队',
  'Breach confirmed': '数据泄露已确认',
  'Confirmed: the vulnerability on your overdue ticket was exploited.':
    '已确认：你那张逾期工单里的漏洞被利用了。',
  'Impact: customer data, Users, and trust, in that order.\nStatus: ongoing\nRoot cause: a ticket that was not built before its deadline':
    '影响：客户数据、用户和信任，按此顺序。\n状态：持续中\n根本原因：工单未在截止日期前完成开发',
  '[TRIGGERED] Payment Provider down': '[已触发] 支付服务商宕机',
  'Incident: payment provider outage\nService: Payments\nUrgency: High':
    '故障：支付服务商中断\n服务：支付\n紧急程度：高',
  'The Payment Provider is down, so checkouts are failing. Customers are filling their carts and leaving with nothing.':
    '支付服务商宕机了，所以结账都在失败。客户装满了购物车，却什么也没买成。',
  "This one isn't your code. It's still your revenue.":
    '这次不是你的代码出了问题。但损失的仍是你的收入。',
  'Checkouts have gone flat': '成功结账曲线归零了',
  "Your successful checkouts panel just went flat. Traffic is still there and carts are still filling. The money isn't arriving.":
    '你的成功结账面板刚刚归零了。流量还在，购物车也还在被填满。钱却没有进来。',
  'The Payment Provider is down, so every checkout fails at the very last step.':
    '支付服务商宕机了，所以每次结账都会在最后一步失败。',
  'PaymentError: provider unavailable': 'PaymentError：服务商不可用',
  "New issue: every checkout is failing with the same error. The Payment Provider is down and isn't answering.":
    '新问题：每次结账都报同一个错误。支付服务商宕机了，没有响应。',
  'Users affected: everyone who tried to pay you\nFirst seen: just now':
    '受影响用户：所有想付钱给你的人\n首次出现：刚刚',
  "We know. It's the one error you wanted fewer of.": '我们懂。这是你最希望少一点的那种错误。',
  'Re: Payment Provider down (again)': '回复：支付服务商宕机（又来了）',
  "The Payment Provider is down again, and checkouts are failing again. Customers want to give you money. The pipe between them and you isn't working.":
    '支付服务商又宕机了，结账又失败了。客户想给你送钱，可他们和你之间的管道坏了。',
  "We'll let you know when it's over.": '恢复后我们会通知你。',
  'Regards,\n{0}': '此致，\n{0}',
  'Your customers are trying to pay you': '你的客户正试着付钱给你',
  "It's a lovely problem to describe and a terrible one to have: people want to buy, and they can't. The Payment Provider is down, so checkouts fail.":
    '说出来像是甜蜜的烦恼，真摊上了却糟得很：人们想买，却买不了。支付服务商宕机了，结账无法完成。',
  'Nothing on your side caused it. Nothing on your side is earning while it lasts, either.':
    '这件事不是你这边造成的。但只要故障还在，你这边也就赚不到钱。',
  'Sorry to be the one,\n{0}': '很遗憾由我来告知，\n{0}',
  '[RESOLVED] {0}': '[已解决] {0}',
  'The following incident has been resolved:': '以下故障已解决：',
  '{0}\nStatus: RESOLVED\nDuration: long enough': '{0}\n状态：已解决\n持续时间：够久了',
  "You may now go back to whatever you were doing before. We don't remember what it was either.":
    '你现在可以回去继续之前的事了。我们也不记得你之前在干什么了。',
  '[OK] {0} has cleared': '[正常] {0} 已解除',
  'Good news, for once: {0} is over. The graphs are back to the shapes you like. Not flat, not cliffs, just lines.':
    '难得有个好消息：{0} 结束了。图表恢复成你喜欢的样子了。不是平线，也不是悬崖，只是线。',
  "We'll keep watching. You should sleep.": '我们会继续盯着。你该睡觉了。',
  'Resolved: {0}': '已解决：{0}',
  "We've marked {0} as resolved. No new events since it ended.":
    '我们已将 {0} 标记为已解决。结束之后没有新事件。',
  "If it comes back, we'll flag it as a regression and tell you right away. We always see it first.":
    '如果它再回来，我们会把它标记为复发，并立即通知你。我们总是最先看到。',
  'Re: {0} — all clear': '回复：{0}——警报解除',
  'All clear.': '警报解除。',
  '{0} is over. Nothing left to do on this one but breathe out.':
    '{0} 结束了。关于这件事，现在只需要松一口气。',
  'Thanks for sticking with it. Most people would have put their phone in a drawer by now.':
    '谢谢你坚持到现在。换成大多数人，早就把手机塞抽屉里了。',
  'Incident closed: {0}': '故障已关闭：{0}',
  'INCIDENT CLOSED': '故障已关闭',
  'Incident: {0}\nState: resolved\nPostmortem action items: none listed':
    '故障：{0}\n状态：已解决\n复盘行动项：未列出',
  'This incident has ended.': '本次故障已结束。',
  "Thank you for your patience. Your users thank you less, but they're back.":
    '感谢你的耐心。你的用户没那么感谢你，不过他们回来了。',
  '[RESOLVED] {0} + 1 action item': '[已解决] {0}，另有 1 项待办',
  '{0} has been resolved.': '{0} 已解决。',
  'Postmortem action item:\n- Research {0}': '复盘行动项：\n- 研究 {0}',
  'Until {0} is researched, {1} is twice as likely to happen again. We\'d say "no pressure", but that would be a lie.':
    '在研究 {0} 之前，{1} 再次发生的概率会是正常的两倍。我们很想说“别有压力”，但那就是撒谎了。',
  "{0} is over. Here's the homework.": '{0} 结束了。作业在这里。',
  'The graphs have recovered and {0} is over.': '图表恢复了，{0} 结束了。',
  "The postmortem came back with one action item: research {0}. Until that's done, this incident is twice as likely to happen. Your dashboards will see it coming. They just can't stop it.":
    '复盘得出了一项行动项：研究 {0}。在完成之前，这种故障发生的概率会是正常的两倍。你的仪表盘会看到它来临，只是拦不住它。',
  'Resolved, with a note: {0}': '已解决，附一条备注：{0}',
  'Marked as resolved: {0}.': '已标记为解决：{0}。',
  "We've attached the postmortem's one action item: research {0}.":
    '附上复盘中唯一的行动项：研究 {0}。',
  "Regression risk: until {0} is researched, {1} is twice as likely. We'll be here to see it first.":
    '复发风险：在研究 {0} 之前，{1} 的发生概率会是正常的两倍。我们会在这里，抢先看到它。',
  'Postmortem: {0}': '复盘：{0}',
  'Blameless postmortem': '无责复盘',
  'What happened: {0}\nStatus: over\nRoot cause: nobody, as is tradition':
    '发生了什么：{0}\n状态：已结束\n根本原因：没谁，按惯例',
  'Action items:\n1. Research {0}.': '行动项：\n1. 研究 {0}。',
  "Until item 1 is done, {0} is twice as likely to happen. Please don't let it join the other action items in the backlog, where action items go to retire.":
    '在第 1 项完成之前，{0} 发生的概率会是正常的两倍。请别让它加入待办列表里其他行动项的行列，那里是行动项的养老院。',
  'Re: {0} — over, but': '回复：{0}——结束了，不过',
  '{0} is over. Before you close the tab: the postmortem says research {1}.':
    '{0} 结束了。关掉标签页之前提醒一句：复盘要求研究 {1}。',
  "It's not a suggestion. Until {0} is researched, {1} is twice as likely to come back. We'd rather not write you this email again, and we suspect you'd rather not read it.":
    '这不是建议。在研究 {0} 之前，{1} 再次发生的概率会是正常的两倍。我们不想再写一次这封邮件，想必你也不想再读一次。',
  'Action needed: your Payments drawer is full': '需要处理：你的支付收款箱已满',
  'Your Payments drawer is full. New revenue has nowhere to go, so it is spilling over the edge instead of landing where you keep it.':
    '你的支付收款箱已满。新收入无处可去，只能从边缘溢出，进不了你存钱的地方。',
  "Our fees, you'll be relieved to hear, are unaffected. Fees are subject to fees, and both are doing fine.":
    '你听了应该会松口气：我们的手续费不受影响。手续费也要收手续费，两边都好好的。',
  'Your funds are under review (and overflowing)': '你的资金正在审核中（而且正往外溢）',
  "We've noticed unusual activity on your account: success. Your Payments drawer is full, and revenue is now spilling out of it.":
    '我们注意到你的账户出现了异常活动：成功。你的支付收款箱已满，收入现在正从里面溢出来。',
  "We've reviewed this situation thoroughly and can confirm it is happening.":
    '我们已对该情况进行深入审核，可以确认这事确实正在发生。',
  'Regards,\nMerchant Services\n{0}': '此致，\n商户服务团队\n{0}',
  'Payments drawer: full': '支付收款箱：已满',
  'Short one. The Payments drawer is full. Revenue that arrives now spills instead of being kept.':
    '长话短说。支付收款箱满了。现在进来的收入会溢出，无法留存。',
  "That's money you earned, falling on the floor. We thought you'd want to know.":
    '那可是你赚的钱，正掉在地上。我们觉得你应该想知道。',
  '{0} Merchant Support': '{0} 商户支持团队',
  'Re: Payments drawer — still full': '回复：支付收款箱——还是满的',
  'A reminder that your Payments drawer is full again, and revenue is spilling again.':
    '提醒一下，你的支付收款箱又满了，收入又在往外溢了。',
  "We've sent this notice before. We'll send it again. We're very good at sending notices; payouts are the thing we're famous for doing slowly.":
    '这个通知我们以前发过，以后还会发。发通知我们很在行；打款慢才是我们出名的地方。',
  'Your balance has nowhere to go': '你的余额无处可去',
  "Here's a summary of your account today:": '以下是你今天的账户摘要：',
  '- Payments drawer: full\n- New revenue: spilling\n- Your mood: we can guess':
    '- 支付收款箱：已满\n- 新收入：溢出中\n- 你的心情：我们猜得到',
  "Every sale from here on lands on the floor next to the drawer instead of in it. It's the nicest problem a business can have, right up until it isn't.":
    '从现在起，每一笔销售收入都会落在收款箱旁边的地上，而不是箱子里。这本是生意人最幸福的烦恼，直到它不再幸福为止。',
  'Best,\nMerchant Success at {0}': '祝好，\n{0} 商户成功团队',
  '[Action may be required] {0} restarted': '[可能需要处理] {0} 已重启',
  'We are contacting you because your resource {0} ran out of memory and was restarted.':
    '特此通知：你的资源 {0} 内存耗尽，已被重启。',
  'Event type: OUT_OF_MEMORY_RESTART\nAffected resource: {0}\nStatus: Closed (restarted)':
    '事件类型：OUT_OF_MEMORY_RESTART\n受影响资源：{0}\n状态：已关闭（已重启）',
  "If you have questions, our support team is available on a plan you don't have.":
    '如有疑问，我们的支持团队随时为某个你没买的套餐服务。',
  '{0} forgot everything': '{0} 忘了所有事',
  "{0} filled its memory to the brim, tipped over, and restarted. It's back now with a clean slate and no memory of the incident, which is more than we can say for your logs.":
    '{0} 把内存塞得满满当当，栽了个跟头，然后重启了。现在它一身轻松地回来了，对这次事故毫无记忆，你的日志可就没这么幸运了。',
  'Out of memory: {0}': '内存不足：{0}',
  'Instance: {0}\nEvent: out of memory\nResult: restarted':
    '实例：{0}\n事件：内存不足\n结果：已重启',
  '{0} used all of its RAM, so the process was killed and the node restarted. This notice is informational. So, in a way, was the restart.':
    '{0} 用尽了全部 RAM，因此进程被终止，节点已重启。本通知仅供参考。从某种意义上说，这次重启也是在给你提个醒。',
  '{0} Compute Notifications': '{0} 计算服务通知',
  '{0} ran out of memory again': '{0} 又把内存用光了',
  '{0} has run out of memory again, and restarted again.': '{0} 又一次耗尽内存，又一次重启了。',
  "We've noticed a pattern. We're a cloud provider; noticing patterns and billing for them is most of what we do.":
    '我们注意到了一种规律。我们是云服务商，发现规律并为此收费，基本就是我们的日常工作。',
  'Regards,\n{0} Health Dashboard': '此致，\n{0} 健康状态仪表盘',
  "About {0}'s little nap": '关于 {0} 打了个小盹这件事',
  'Dear customer,': '尊敬的客户：',
  'At approximately just now, {0} tried to use more memory than it had. Our systems responded the way systems do: the process was stopped and {1} restarted.':
    '大约就在刚刚，{0} 试图使用超出自身容量的内存。我们的系统作出了系统通常会有的反应：进程被停止，{1} 被重启。',
  "We'd like to reassure you that no hardware was harmed. Some requests may have been. We apologise for any inconvenience, and for this email.":
    '请放心，没有硬件在此过程中受到伤害。部分请求可能受伤了。对于造成的不便，以及这封邮件，我们深表歉意。',
  'Warm regards,\nCustomer Communications, {0}': '诚挚问候，\n{0} 客户沟通团队',
  '{0} is out of CPU credits': '{0} 的 CPU 积分耗尽了',
  'Your instance {0} has used all of its CPU credits. It is now throttled to 20% of its CPU.':
    '你的实例 {0} 已用尽全部 CPU 积分。现在它被限制为只能使用 20% 的 CPU。',
  'Affected resource: {0}\nCurrent CPU limit: 20%': '受影响资源：{0}\n当前 CPU 上限：20%',
  'This is working as designed. Our design, not yours.':
    '一切都符合设计。符合我们的设计，不是你的。',
  '{0} is now running at 20%': '{0} 现在只能以 20% 运行',
  "Good news: {0} is still running. Less good news: it's out of CPU credits, so it's throttled to 20%.":
    '好消息：{0} 还在运行。没那么好的消息：CPU 积分用完了，所以它被限速到了 20%。',
  'It can still do one fifth of a job. Like a meeting that could have been an email.':
    '它还能完成五分之一的工作。就像一场本来发封邮件就够了的会议。',
  'Your burst has been spent': '你的突发额度花完了',
  'BALANCE NOTICE': '余额通知',
  'Resource: {0}\nCPU credit balance: 0\nCPU available: 20%':
    '资源：{0}\nCPU 积分余额：0\n可用 CPU：20%',
  '{0} burst until the credits ran out. It is now throttled to 20%.':
    '{0} 一路突发运行，直到积分耗尽。现在它被限速到了 20%。',
  'The credits were included in the price. The throttling is included too, at no extra charge.':
    '积分已包含在价格中。限速也一并包含，不额外收费。',
  '{0} Billing and Compute': '{0} 账单与计算服务',
  '{0} is throttled again': '{0} 又被限速了',
  '{0} is out of CPU credits again and back to running at 20%.':
    '{0} 又用完了 CPU 积分，重新回到了 20% 的运行水平。',
  'Some instances are built to sprint. Yours is built to sprint and then sit down for a long time.':
    '有些实例生来就是为了冲刺。你的实例生来就是为了冲刺，然后坐下歇很久。',
  'Performance notice for {0}': '{0} 性能通知',
  'We are writing to let you know that {0} has run out of CPU credits. Its CPU is now throttled to 20%, so the work it does will take longer while this lasts.':
    '特此通知，{0} 的 CPU 积分已耗尽。其 CPU 现已限速至 20%，在此期间，完成工作所需的时间将会更长。',
  'This notice does not require a reply. Replies are not read. Neither, statistically, is this notice.':
    '本通知无需回复。回复不会有人看。从统计上说，这封通知也一样。',
  'ALARM: "{0}"': '告警：“{0}”',
  'You are receiving this email because your alert rule "{0}" has entered the FIRING state.':
    '你收到这封邮件，是因为你的告警规则“{0}”已进入触发状态。',
  'Reason: threshold crossed and held for {0} seconds.\nState change: OK -> FIRING':
    '原因：超过阈值并持续了 {0} 秒。\n状态变化：正常 -> 触发',
  'View this alert on the dashboard you never close.': '请在那个你从不关闭的仪表盘上查看此告警。',
  '[FIRING:1] {0}': '[触发中：1] {0}',
  Firing: '触发中',
  'Rule: {0}\nFor: {1}s\nSeverity: page': '规则：{0}\n持续：{1} 秒\n严重程度：呼叫值班人员',
  'This rule has been true for {0} seconds, which is long enough to count and too long to ignore.':
    '这条规则已连续满足 {0} 秒，久到足以计数，也久到不能忽视。',
  'Your graph is doing something. That is not good.': '你的图表有动静了。这不是什么好事。',
  'Alert triggered: {0}': '告警已触发：{0}',
  'One of your alert rules just fired:': '你的一条告警规则刚刚触发了：',
  "It held for {0} seconds before we said anything. We wanted to be sure. We're sure. We saw it first; now it's your turn.":
    '它持续了 {0} 秒，我们才开口。我们想确认一下。现在确认了。我们先看见了，现在轮到你了。',
  '[PAGE] {0} ({1}s)': '[值班呼叫] {0}（{1} 秒）',
  'You have been paged.': '你已收到值班呼叫。',
  'Alert: {0}\nDuration: {1} seconds\nUrgency: High': '告警：{0}\n持续时间：{1} 秒\n紧急程度：高',
  "The rule held for {0} seconds, so it's not a blip. Please look at it now, or at least look at it with an expression of concern.":
    '规则已持续满足 {0} 秒，所以这不是一闪而过的小波动。请现在就看看，或者至少带着忧心的表情看看。',
  'Re: {0} — firing again': '回复：{0}——又触发了',
  '"{0}" is firing again. It held for {1} seconds this time.': '“{0}”又触发了。这次持续了 {1} 秒。',
  "We're not saying it's a pattern. We're just a graph of it, and the graph has an opinion.":
    '我们没说这是一种规律。我们只负责把它画成图，而这张图有自己的看法。',
  'Nobody is listening to "{0}"': '已经没人理“{0}”了',
  'The rule "{0}" has cried wolf five times today. Your team has stopped listening to it.':
    '规则“{0}”今天已经喊了五次狼来了。你的团队已经不再理它了。',
  "That's reasonable, and also dangerous: the next real alarm from this rule will be ignored too.":
    '这很合理，也很危险：下次这条规则真的报警，也会被忽略。',
  'Fix: change its threshold, so it fires when something is actually wrong.':
    '解决方法：修改阈值，让它只在真的出问题时触发。',
  'Alert fatigue report: "{0}"': '告警疲劳报告：“{0}”',
  'ALERT HEALTH REPORT': '告警健康报告',
  'Rule: {0}\nFalse alarms today: 5\nPeople still paying attention: 0':
    '规则：{0}\n今日误报：5 次\n还在关注的人数：0',
  'After five false alarms in one day, your team now ignores this rule. A rule nobody reads is a very expensive comment.':
    '一天误报五次之后，你的团队现在已经无视这条规则了。没人看的规则，就是一条很昂贵的注释。',
  'Recommended: change its threshold.': '建议：修改阈值。',
  '"{0}" has become background noise': '“{0}”已经成了背景噪声',
  'Five false alarms today from "{0}". Your team has learned, quite sensibly, to ignore it.':
    '“{0}”今天误报了五次。你的团队学会了无视它，这很明智。',
  "We'd love to say the rule will learn too. It won't. Rules don't learn. People do, and they just did.":
    '我们很想说规则也会学习。可惜不会。规则不会学，人会，而且刚刚已经学会了。',
  'Change its threshold and it can earn back their trust.': '修改阈值，它就能重新赢回大家的信任。',
  'Ignored: {0}': '已忽略：{0}',
  'Five false alarms today. The team now ignores "{0}".': '今天误报五次。团队现在已经无视“{0}”了。',
  'We still see everything first. Now nobody sees it after us.':
    '我们仍然最先看见一切。现在我们看完后，就再也没人看了。',
  "Change the rule's threshold so it only fires when it means it.":
    '修改规则的阈值，让它只在真的有事时才触发。',
  '"{0}" cried wolf again': '“{0}”又喊狼来了',
  'You may remember this one. "{0}" went off five times today, every time for nothing, and the team ignores it again.':
    '这条你可能有印象。“{0}”今天响了五次，每次都是虚惊一场，团队又不理它了。',
  "We get it. Nobody wants to wake up for a graph that's fine. But the rule can't tell fine from on fire until you tell it.":
    '我们理解。没人想为了一张没问题的图起床。但你不告诉它，规则就分不清什么是没事，什么是着火了。',
  'Change its threshold.': '修改阈值。',
  'Hello from the new engineer': '新工程师来打个招呼',
  "First day. I'm {0}, the new engineer. My laptop works, I've found the coffee, and I've already studied the whole architecture, which took four minutes because it's one Board.":
    '第一天上班。我是 {0}，新来的工程师。笔记本能用，咖啡找到了，整个架构也已经研究完了。只花了四分钟，因为总共就一块看板。',
  'Excited to get going. Point me at something.': '很期待开始干活。给我指个任务吧。',
  'Introducing myself: {0}': '自我介绍：{0}',
  'Hello everyone,': '大家好，',
  "I'm {0}, and today is my first day on the team.": '我是 {0}，今天是我加入团队的第一天。',
  'A bit about me:\n- I like systems that stay up\n- I like them more when they stay up at night\n- I have strong opinions about tabs and will keep them to myself for at least a week':
    '简单介绍一下我：\n- 我喜欢稳定运行的系统\n- 夜里也能稳定运行的，我更喜欢\n- 我对制表符有很强烈的看法，至少头一周会忍着不说',
  'Looking forward to working with you.': '期待和大家一起工作。',
  "hi! it's me": '嗨！是我',
  "hey, it's {0}. first day!": '嗨，我是 {0}。第一天上班！',
  'just got access to everything, which feels like a lot of trust for someone you met in one interview':
    '刚拿到全部权限。对一个只面试见过一面的人来说，这份信任还挺沉的',
  'where should I start? happy to take whatever nobody else wants':
    '我该从哪儿开始？别人都不想接的活也可以给我',
  'Day one: reporting for duty': '第一天：前来报到',
  'Reporting for duty. Badge: yes. Chair: yes. Context: absolutely none yet.':
    '前来报到。工牌：有。椅子：有。背景信息：目前一无所知。',
  "I'm told the best way to learn a system is to break it gently and fix it fast, so I'll be careful with the first part.":
    '听说熟悉系统最好的办法，是温柔地弄坏它，再迅速修好它。所以前半段我会小心一点。',
  'So glad to be here. Thanks for taking a chance on me.':
    '很高兴能来到这里。谢谢你愿意给我这个机会。',
  'New engineer, first day, many questions': '新工程师，第一天，问题很多',
  'Morning!': '早上好！',
  "It's {0}. Officially on the team as of today.": '我是 {0}。从今天起正式加入团队。',
  'I have three questions and will probably have thirty by lunch:\n1. Who do I ask about the Database?\n2. Is there a runbook?\n3. Is "there\'s no runbook" the runbook?':
    '我现在有三个问题，到午饭时可能就有三十个了：\n1. 数据库的问题该问谁？\n2. 有运维手册吗？\n3. “没有运维手册”就是我们的运维手册吗？',
  "Very happy to be here. Let's build something that stays up.":
    '很高兴能来到这里。一起做点能稳定运行的东西吧。',
  'Done: {0}': '已完成：{0}',
  '{0} is done. Finished it just now.': '{0} 做完了。刚刚收尾。',
  "No drama, no surprises, which in this job counts as a celebration. Tests were green; I checked twice because I didn't believe it.":
    '没风波，没意外，在这行里就值得庆祝了。测试全绿；我不太敢信，又查了一遍。',
  "What's next?": '接下来做什么？',
  'Wrapped up {0}': '{0} 已收尾',
  "Quick update: I've finished {0}.": '简单汇报：我已经完成了 {0}。',
  "It took the usual path: it looked easy, then it looked impossible, then it looked done. I'm going with done.":
    '还是熟悉的流程：先觉得很简单，再觉得不可能，最后觉得做完了。我选择相信做完了。',
  "If you've got the next thing lined up, I'm ready. If not, I'll go read the logs for fun.":
    '如果下一个任务已经排好了，我随时可以接。要是还没有，我就去读日志找点乐子。',
  '{0} is finished': '{0} 已完成',
  'ok, {0} is finished!': '好啦，{0} 做完了！',
  "honestly I thought it'd take longer. either I'm getting faster or I missed something. I'm choosing to believe the first one":
    '说真的，我以为会更久。要么是我变快了，要么是漏了点什么。我选择相信前者',
  'ready for the next task whenever you are': '你随时可以给我下一个任务',
  'Another one done: {0}': '又做完一个：{0}',
  'Another one off the list: {0} is finished.': '清单又划掉一项：{0} 完成了。',
  "I'm starting to enjoy this. Don't tell anyone, it ruins the mystique.":
    '我开始觉得这事挺好玩了。别告诉别人，神秘感就没了。',
  'Anything you want me to pick up next?': '接下来有什么想让我接手的吗？',
  'Thanks,\n{0}': '谢谢，\n{0}',
  'Status update: {0}': '状态更新：{0}',
  "Status update, since I promised I'd write these:": '答应过要写状态更新，所以来汇报一下：',
  'Task: {0}\nStatus: finished\nBlockers: none\nCoffee: one too many':
    '任务：{0}\n状态：已完成\n阻塞：无\n咖啡：多喝了一杯',
  "It's ready whenever you want it. I'll take whatever's next on the list.":
    '已经准备好了，随时可用。我可以接清单上的下一个任务了。',
  'Shipped it': '已上线',
  "Just deployed {0}. It's live.": '刚部署了 {0}。已经上线。',
  "Dashboards look calm. I'm going to keep staring at them for the next twenty minutes anyway, just in case calm is lying.":
    '仪表盘看起来很平静。不过接下来二十分钟我还是会一直盯着，万一这份平静是装的呢。',
  "Deploy notes: it's out": '部署记录：已上线',
  'Hi all,': '大家好，',
  'Deploy notes, short version:': '部署记录，简短版：',
  'Shipped: {0}\nRollback needed: no\nFridays involved: no':
    '已上线：{0}\n是否需要回滚：否\n是否碰上周五：否',
  "It went smoother than my last three deploys combined. I'm not going to question it.":
    '比我上三次部署加起来都顺利。我就不深究了。',
  "it's live!!": '上线啦！！',
  '{0}, out in the world. users can poke at it right now':
    '{0} 已经放出去了。用户现在就可以上手戳它了',
  "I did the thing where you refresh the page after deploying like it'll change something. it didn't. that's good":
    '我又干了部署后刷新页面那件事，好像能刷出什么变化似的。没变化。挺好',
  'Deployed another one': '又完成了一次部署',
  'Another deploy out the door: {0}.': '又一次部署完成：{0}。',
  'Each time it gets a little less scary. This time I only held my breath for part of it.':
    '每次都会少怕一点。这次我只在部分过程中屏住了呼吸。',
  'Let me know if users say anything nice. Or anything at all.':
    '用户要是说了什么好话，记得告诉我。或者说了什么都行。',
  'Release complete': '发布完成',
  'Happy to report the release is complete. This went out today:':
    '很高兴通知大家，发布完成了。今天上线的是：',
  "Everything is running and I haven't seen an error yet. I'll keep an eye on it through the afternoon.":
    '一切都在运行，目前还没看到报错。我会继续盯完今天下午。',
  'Thanks to whoever reviewed it, including the person who said "looks good" without reading it. You know who you are.':
    '谢谢参与审查的各位，包括那位没看就说“看起来不错”的人。说的是谁，你自己知道。',
  'I broke it': '我把它弄坏了',
  "I deployed {0} and there's a bug in it. The App Servers are crashing.":
    '我部署了 {0}，里面有个缺陷。应用服务器正在崩溃。',
  "That's on me. I'm sorry. I'm looking at it right now. Please don't refresh the dashboard, it only makes it worse for both of us.":
    '这是我的问题。抱歉。我正在查。请别刷新仪表盘，那只会让咱俩都更难受。',
  'Bad deploy: App Servers crashing': '部署出错：应用服务器崩溃',
  'Bad news first, then more bad news: {0} shipped with a bug, and the App Servers are crashing because of it.':
    '先说坏消息，再说更坏的：{0} 上线时带了个缺陷，应用服务器因此正在崩溃。',
  'Tests passed. Review passed. Production did not pass.':
    '测试通过了。审查通过了。生产环境没通过。',
  "I'm digging in now. Will write again when I know more.": '我正在深入排查。有更多消息会再写。',
  'uh oh': '糟了',
  'the {0} deploy had a bug in it. App Servers are crashing':
    '{0} 的部署里有个缺陷。应用服务器正在崩溃',
  "it worked on my machine. my machine is not where the users are, I'm realising":
    '在我电脑上是好的。我现在意识到，用户并不在我电脑上',
  'sorry. on it': '抱歉。正在处理',
  'It happened again': '又发生了',
  "I'm sorry to write this kind of email twice. The deploy of {0} has a bug, and the App Servers are crashing again.":
    '很抱歉第二次写这种邮件。{0} 的部署里有个缺陷，应用服务器又在崩溃了。',
  'I know. I\'m adding "check it more carefully" to my list of things I already thought I was doing.':
    '我知道。我正在把“检查得更仔细”加进那张我原以为自己已经在做的事情清单。',
  'Looking into it now.': '正在排查。',
  'Incident: my deploy is crashing App Servers': '故障：我的部署导致应用服务器崩溃',
  'Writing this before anyone has to ask.': '赶在有人开口问之前，先写这封邮件。',
  'What: I deployed {0}\nProblem: it has a bug\nImpact: App Servers are crashing\nWhose fault: mine, blameless postmortem notwithstanding':
    '做了什么：我部署了 {0}\n问题：里面有个缺陷\n影响：应用服务器正在崩溃\n谁的错：我的，不管复盘是不是无责的',
  "I'm on it, and I'll stay on it until it's fixed.": '我正在处理，修好之前不会停。',
  'Migration progress: {0} on the new Stack': '迁移进度：{0} 已使用新技术栈',
  'Migration update: {0} of your App Servers now run on the new Stack.':
    '迁移更新：你的应用服务器中，已有 {0} 运行在新技术栈上。',
  'No incident to report, which is why this email is so short and why nobody woke you up for it.':
    '没有故障需要报告，所以这封邮件这么短，也所以没人为此把你叫醒。',
  '{0} of App Servers moved': '已有 {0} 的应用服务器完成迁移',
  'The new Stack line is going up and to the right, the good way for once: {0} of App Servers have moved over.':
    '新技术栈的曲线正向右上方走，难得这次是好事：已有 {0} 的应用服务器迁移过去了。',
  'Two lines share the panel now, old Stack and new. Pick a favourite. We already know which one is going to win.':
    '现在面板上有两条曲线，旧技术栈和新技术栈。挑条喜欢的吧。我们已经知道谁会赢。',
  'Release tracking: new Stack at {0}': '发布跟踪：新技术栈已达 {0}',
  "We're tracking the move: {0} of your App Servers now run on the new Stack.":
    '我们正在跟踪迁移：你的应用服务器中，已有 {0} 运行在新技术栈上。',
  "We'll be watching for anything new it brings with it. We always do. It's the only thing we do.":
    '我们会盯着它会不会带来什么新问题。我们一直都这么做。这也是我们唯一做的事。',
  'Re: migration — now {0}': '回复：迁移——目前 {0}',
  'The migration keeps moving. {0} of App Servers are on the new Stack now.':
    '迁移仍在继续。现在已有 {0} 的应用服务器运行在新技术栈上。',
  "Every migration has a long middle where both Stacks are running and nobody can quite remember why the old one existed. You're in it.":
    '每次迁移都有一段漫长的中间期，两套技术栈同时运行，谁都不太记得旧的那套当初为什么存在。你就在这个阶段。',
  'Status: Stack migration at {0}': '状态：技术栈迁移已达 {0}',
  'MIGRATION STATUS': '迁移状态',
  'App Servers on the new Stack: {0}\nApp Servers on the old Stack: the rest\nPages sent about this: 0':
    '使用新技术栈的应用服务器：{0}\n使用旧技术栈的应用服务器：其余全部\n为此发出的值班呼叫：0',
  'This notice is informational. Nothing is on fire. We checked twice, because it felt unusual.':
    '本通知仅供参考。没有哪里着火。我们查了两遍，因为这感觉不太寻常。',
  'no-reply@awol.cloud': 'no-reply@awol.cloud',
  'alarm@pagerdooty.io': 'alarm@pagerdooty.io',
  'billing@swipe.dev': 'billing@swipe.dev',
  'We swipe the card. Then we swipe a little more.': '我们刷一下卡。然后再多刷一点。',
  'deals@roadrunner.vc': 'deals@roadrunner.vc',
  'Beep beep, and congrats on the traction.': '哔哔，恭喜业务有起色了。',
  'books@quickbroke.app': 'books@quickbroke.app',
  'Reconciled to the nearest regret.': '对账结果，四舍五入到最近的一次后悔。',
  'tickets@zenfail.help': 'tickets@zenfail.help',
  'Ticket #4,096. We take your feedback seriously.': '工单 #4,096。我们很重视你的反馈。',
  'leslie@lamport.clock': 'leslie@lamport.clock',
  'Sent at an unspecified time, in an unspecified order.': '于未指定的时间，按未指定的顺序发送。',
  'digest@cve.fyi': 'digest@cve.fyi',
  'Unsubscribe by patching.': '打补丁即可退订。',
  'noreply@gooble.cloud': 'noreply@gooble.cloud',
  'We will sunset this feature in 6 to 8 weeks.': '我们将在 6 到 8 周后下线此功能。',
  'alerts@azzure.cloud': 'alerts@azzure.cloud',
  'Now in 400 regions, 3 of them up.': '现已覆盖 400 个地区，其中 3 个能用。',
  'noreply@cloudscare.net': 'noreply@cloudscare.net',
  'Verifying you are human. We have our doubts.': '正在验证你是人类。我们对此存疑。',
  'alerts@grafauna.dev': 'alerts@grafauna.dev',
  'Your graph has gone flat. That is not good.': '你的曲线归零了。这可不妙。',
  'issues@centry.io': 'issues@centry.io',
  'Every event counts. Every event is billed.': '每个事件都算数。每个事件都收费。',
  'service@paypaul.com': 'service@paypaul.com',
  'Your funds are under review. Forever.': '你的资金正在审核中。永远。',
  'partners@sequel.vc': 'partners@sequel.vc',
  'Every round deserves a sequel.': '每轮融资都值得出续集。',
  'apply@whycombinator.vc': 'apply@whycombinator.vc',
  'Why not.': '有何不可。',
  'books@zero.accountant': 'books@zero.accountant',
  'Your balance, rounded to the nearest zero.': '你的余额，四舍五入到最接近的零。',
  'chat@intercomatose.help': 'chat@intercomatose.help',
  'Typically replies in a few business decades.': '通常会在几个工作十年内回复。',
  'edsger@shortest.path': 'edsger@shortest.path',
  'GOTO statements considered harmful, as are your SLOs.': 'GOTO 语句有害，你的 SLO 也是。',
  'grace@nanosecond.wire': 'grace@nanosecond.wire',
  'Sent in the time it takes light to travel one foot.': '发送耗时：光走过一英尺的时间。',
  'bulletins@nvdumpster.org': 'bulletins@nvdumpster.org',
  'Every advisory is critical until proven otherwise.': '每份安全通告都是严重级别，除非证明不是。',
  'sales@datadug-observe.biz': 'sales@datadug-observe.biz',
  'Dashboards so deep you will never leave.': '仪表盘深不见底，让你再也出不去。',
  'ae@slowflake.cloud': 'ae@slowflake.cloud',
  'Per-second billing, per-minute regret.': '按秒计费，按分钟后悔。',
  'hello@devnull.wtf': 'hello@devnull.wtf',
  'Fast. Durable. Webscale.': '快。持久。互联网规模。',
  'billing@awol-cloud.support': 'billing@awol-cloud.support',
  'Do not ignore this notice.': '请勿忽略本通知。',
  'digest@cve-fyi.top': 'digest@cve-fyi.top',
  'Act now.': '立即行动。',
  'chad@talentbro.hr': 'chad@talentbro.hr',
  'Let us circle back on your circle back.': '关于你说的回头再聊，我们回头再聊一下。',
  'billing@azzure-invoices.top': 'billing@azzure-invoices.top',
  'Pay within 24 hours to avoid service interruption.': '请在 24 小时内付款，以免服务中断。',
  'renewals@domain-guard.wtf': 'renewals@domain-guard.wtf',
  'We are not your registrar, but we could be.': '我们不是你的域名注册商，但我们可以是。',
  'sponsors@webscale.events': 'sponsors@webscale.events',
  'Where thought leaders lead thoughts.': '让思想领袖引领思想的地方。',
  'hi@incohere.ai': 'hi@incohere.ai',
  'Confidently wrong, at scale.': '信心十足地出错，而且规模化。',
  "'); DROP TABLE signatures;--": "'); DROP TABLE signatures;--",
  'Sent twice, or not at all.': '发送两次，或者根本没发。',
  'Signature: undefined': '签名：undefined',
  'Sent with elevated privileges.': '使用提升后的权限发送。',
  'Sent from pod 3 of 3. Pods 1 and 2 are pending.':
    '由第 3 个 Pod 发出，共 3 个。Pod 1 和 2 仍在等待调度。',
  'Core dumped.': '核心已转储。',
  'Sent while holding the lock. Please reply quickly.': '发送时仍持有锁。请尽快回复。',
  'Sent from a breakpoint.': '从断点处发送。',
  'Quick question about your dashboards': '关于你的仪表盘，想简单问个问题',
  'I noticed your team is shipping fast. Love that energy.':
    '注意到你的团队上线速度很快。很喜欢这股劲头。',
  'Quick question: how many dashboards do you have right now? Most founders say "two, maybe." Our customers average 1,140, and 1,138 of them have never been opened. That\'s what we call observability maturity.':
    '简单问一下：你们现在有多少个仪表盘？多数创始人会说“两个吧，也许”。我们的客户平均有 1,140 个，其中 1,138 个从来没打开过。我们管这叫可观测性成熟度。',
  '{0} ingests every log, metric, trace, and vibe your stack emits, and keeps it forever. Leaving is technically possible, in the way that leaving a cave system is technically possible.':
    '{0} 会摄取你技术栈发出的每一条日志、每一个指标、每一条链路追踪，乃至每一丝氛围，并永远保存。从技术上说，你是可以离开的，就像从技术上说，人也能走出一整套地下溶洞。',
  'Worth a 15-minute chat this week?': '这周值得花 15 分钟聊聊吗？',
  'Best,\nTyler\nAccount Executive, {0}': '祝好，\nTyler\n{0} 客户经理',
  'Re: Quick question about your dashboards': '回复：关于你的仪表盘，想简单问个问题',
  "Just bumping this to the top of your inbox in case it got buried. (If you had {0}, you'd have a dashboard showing exactly how buried.)":
    '再把这封邮件顶到你收件箱最上面，免得被埋了。（如果你用了 {0}，就会有个仪表盘，精确显示它被埋得有多深。）',
  'Happy to do Tuesday or Thursday.': '周二或周四我都方便。',
  Tyler: 'Tyler',
  'Your free trial is a forever trial*': '你的免费试用，是一场永久试用*',
  'Good news!': '好消息！',
  'Your team is eligible for a 14-day free trial of {0} Enterprise.':
    '你的团队有资格免费试用 {0} 企业版 14 天。',
  "What's included:\n- Unlimited dashboards\n- Unlimited alerts about your dashboards\n- A dashboard of your alerts about your dashboards\n- Custom metrics, billed per custom metric, per host, per hour, per feeling":
    '包含内容：\n- 无限仪表盘\n- 关于仪表盘的无限告警\n- 一个展示仪表盘告警的仪表盘\n- 自定义指标，按自定义指标、主机、小时和心情分别计费',
  '*After 14 days, your data stays with us. You can export it any time by talking to Sales.':
    '*14 天后，你的数据依然留在我们这里。你随时可以联系销售将其导出。',
  'Start your trial in one click!': '一键开始试用！',
  'The {0} Growth Team': '{0} 增长团队',
  'Saw your bill and thought of you': '看到你的账单，就想起了你',
  'Hey!': '嘿！',
  'One of our customers just told me their {0} invoice is now larger than their cloud bill, their payroll, and their rent combined. They called it "a wake-up call." We called it "a case study."':
    '我们有位客户刚告诉我，他们的 {0} 账单已经比云服务账单、工资和房租加起来还高。他们称之为“一记警钟”。我们称之为“客户案例”。',
  'The thing is, they can now see that their costs are up 400% on a beautiful stacked area chart, in real time. Could your team say the same?':
    '关键是，他们现在能在一张漂亮的堆积面积图上，实时看到成本上涨了 400%。你的团队也做得到吗？',
  "I've put 30 minutes on your calendar. Feel free to move it, but not to cancel it.":
    '我已经在你的日历上安排了 30 分钟。可以随意改期，但不能取消。',
  'Cheers,\nTyler': '祝好，\nTyler',
  'Should I close your file?': '我该关闭你的档案了吗？',
  "I've reached out a few times and haven't heard back, so I'll assume one of three things:":
    '我联系了几次都没收到回复，所以我猜是以下三种情况之一：',
  "1. You're happy flying blind.\n2. You're buried in an incident you can't see.\n3. You've been dug in by a competitor and can't get out. Blink twice.":
    '1. 你很享受盲飞。\n2. 你陷在一场自己看不见的故障里。\n3. 你被竞争对手牢牢套住，脱不了身。是的话眨两下眼。',
  'Either way, this is my last email. Probably. Our sequence software has opinions.':
    '不管怎样，这都是我最后一封邮件了。大概吧。我们的自动跟进软件有自己的想法。',
  'All the best,\nTyler from {0}': '祝一切顺利，\n{0} 的 Tyler',
  'Is your 4 GB database ready for petabyte scale?': '你的 4 GB 数据库准备好迈向 PB 级规模了吗？',
  'Our data team ran a quick scan and estimates your database at about 4 GB. Big things start small!':
    '我们的数据团队快速扫描了一下，估计你的数据库大约有 4 GB。大事业都从小处开始！',
  "With {0}, those 4 GB can be split across a 64-node warehouse, a 128-node warehouse, and a third warehouse that monitors the first two. Queries that took 9 milliseconds on your laptop now take 40 seconds on our cloud, which proves they're doing serious work.":
    '使用 {0}，这 4 GB 数据可以分散到一个 64 节点数据仓库、一个 128 节点数据仓库，以及第三个专门监控前两个的数据仓库。在你笔记本上花 9 毫秒的查询，如今在我们的云上要花 40 秒，这证明它们正在做正经的大事。',
  "Per-second billing means you only pay for what you use. You'll use a lot.":
    '按秒计费意味着你只为实际用量付费。你会用很多。',
  'Can I send over a deck?': '我能发份演示文稿给你吗？',
  'Warmly,\nMadison, Enterprise Data Evangelist': '诚挚问候，\nMadison，企业数据布道师',
  'Re: petabyte scale': '回复：PB 级规模',
  "Circling back here. I know 4 GB feels manageable today. That's what they all say, right before someone runs SELECT * on a Friday and the auto-scaler wakes up.":
    '再来跟进一下。我知道，今天看来 4 GB 还好管理。大家都这么说，直到某人在周五运行了 SELECT *，把自动扩缩容器叫醒。',
  'The {0} team would love to help you be ready for that moment, and then send you an itemized summary of it.':
    '{0} 团队很乐意帮你为那一刻做好准备，然后寄给你一份逐项计费的事后摘要。',
  Madison: 'Madison',
  'Your credit forecast is in': '你的积分用量预测出来了',
  'CREDIT FORECAST: FREE-TIER PROSPECT': '积分预测：免费套餐潜在客户',
  'Estimated monthly credits: 3\nEstimated monthly credits after one curious analyst: 41,000\nEstimated monthly credits after one dashboard set to refresh every minute: yes':
    '预计月度积分：3\n有一位好奇分析师后的预计月度积分：41,000\n有一个设为每分钟刷新的仪表盘后的预计月度积分：是的',
  'Recommended plan: Enterprise Plus Platinum Snow': '推荐套餐：企业增强白金冰雪版',
  '{0} warehouses auto-suspend after 10 minutes idle. Dashboards are never idle.':
    '{0} 数据仓库空闲 10 分钟后会自动挂起。仪表盘从不空闲。',
  'To discuss your forecast, reply to this email. Replies are free.':
    '如需讨论你的费用预测，请回复此邮件。回复免费。',
  "A customer story you'll relate to": '一个你会感同身受的客户故事',
  'I wanted to share a quick story. A startup about your size moved their 4 GB of orders to {0}. Within a month, their analysts were asking questions they had never thought to ask, such as "who approved this?" and "how is it per second?"':
    '想和你分享一个小故事。一家规模和你们差不多的初创公司，把 4 GB 的订单数据迁到了 {0}。不到一个月，他们的分析师就开始提出从没想过的问题，比如“这是谁批的？”以及“怎么还是按秒收费的？”',
  'Today they run a lean, data-driven culture. Mostly lean.':
    '如今，他们奉行精益、数据驱动的文化。主要是精益。',
  'They asked to remain anonymous, and also asked us to stop calling.':
    '他们要求匿名，也要求我们别再打电话。',
  'Would you be open to a 20-minute discovery session?': '你愿意安排一次 20 分钟的需求交流吗？',
  'Best regards,\nMadison': '顺祝商祺，\nMadison',
  'Data Pillow Summit: free tickets for founders': 'Data Pillow 峰会：创始人免费入场',
  "You're invited to the {0} Summit, where 12,000 engineers gather in one hall to learn how to put a pillow on top of a lake.":
    '诚邀你参加 {0} 峰会，届时 12,000 名工程师将齐聚一堂，学习如何在数据湖上放一个枕头。',
  'Highlights:\n- Keynote: "Zero-Copy Cloning, Infinite-Copy Invoices"\n- Workshop: Rightsizing your 4 GB for the cloud era\n- Panel: Per-second billing, per-minute regret':
    '精彩看点：\n- 主题演讲：“零拷贝克隆，无限拷贝账单”\n- 工作坊：云时代，如何为你的 4 GB 数据合理配置资源\n- 圆桌讨论：按秒计费，按分钟后悔',
  'Your ticket is free. Lunch is consumption-based.': '门票免费。午餐按量计费。',
  'See you there,\nThe {0} Events Team': '现场见，\n{0} 活动团队',
  'Writes in 0 ms. Guaranteed.': '写入只需 0 ms。保证。',
  'Tired of slow writes? {0} accepts every write you send it in zero milliseconds, at any scale, forever.':
    '受够了慢吞吞的写入？无论规模多大，{0} 都能在零毫秒内接收你发送的每一次写入，永远如此。',
  'How? We have reinvented durability from first principles and found it was optional.':
    '怎么做到的？我们从第一性原理重新发明了持久性，发现它原来是可选项。',
  'Our benchmarks:\n- Throughput: unlimited\n- p99 latency: 0 ms\n- Data loss: within expected parameters':
    '我们的基准测试：\n- 吞吐量：无限\n- p99 延迟：0 ms\n- 数据丢失：符合预期参数',
  "It's fast. It's durable. It's webscale.": '速度快。持久可靠。互联网级规模。',
  'Shall we set up a proof of concept? It will finish instantly.':
    '要不要做个概念验证？瞬间就能完成。',
  'Re: Writes in 0 ms': '回复：写入只需 0 ms',
  'Just floating this back up. A few founders have asked whether {0} supports reads.':
    '再顶一下这封邮件。有几位创始人问，{0} 支不支持读取。',
  "Great question! Reads are available on our Enterprise tier, priced per read, with a minimum commitment of three years. Our Sales Engineering team will be happy to explain what you'll be reading.":
    '问得好！企业版支持读取，按次收费，最低签约三年。我们的销售工程团队很乐意向你解释，你究竟能读到什么。',
  'Talk soon,\nDerek\nSolutions Architect': '回头聊，\nDerek\n解决方案架构师',
  'Is your database web scale?': '你的数据库达到互联网级规模了吗？',
  'Your database uses transactions. Locks. Indexes. A write-ahead log. Do you know what has none of those things? {0}.':
    '你的数据库有事务、锁、索引，还有预写日志。你知道什么东西一样都没有吗？{0}。',
  "We don't do joins, because joins don't scale. We don't do schemas, because schemas don't scale. We don't keep data, because, if we're honest, data doesn't scale.":
    '我们不做联接，因为联接无法扩展。我们不要模式，因为模式无法扩展。我们不保留数据，因为说实话，数据也无法扩展。',
  "We shard to /dev/null, then shard that shard. It's /dev/null all the way down.":
    '我们把数据分片到 /dev/null，再把这个分片继续分片。一层又一层，全是 /dev/null。',
  "Migrate today. There's nothing to migrate back.": '今天就迁移吧。反正也没什么能迁回来的。',
  Derek: 'Derek',
  '{0} is now SOC 2 compliant': '{0} 现已符合 SOC 2 标准',
  ANNOUNCEMENT: '公告',
  "We're proud to share that {0} has completed its SOC 2 audit with zero findings.":
    '我们自豪地宣布，{0} 已完成 SOC 2 审计，零问题。',
  'The auditors could not locate any customer data, so none of it could be mishandled. They described our retention policy as "immediate" and our access controls as "moot".':
    '审计员找不到任何客户数据，自然也就没有数据会被不当处理。他们称我们的保留策略为“即时”，访问控制则是“无从谈起”。',
  'Your data has never been safer. Your data has never been anywhere.':
    '你的数据从未如此安全。你的数据从未存在于任何地方。',
  "Book a security review with our team. Bring nothing; you'll leave with nothing.":
    '预约我们的安全评估吧。什么都不用带；你走的时候也什么都带不走。',
  "We're sunsetting the free tier (sort of)": '我们即将下线免费版（算是吧）',
  'A quick note on pricing. Starting next month, the {0} free tier will continue to accept unlimited writes at no cost. Nothing changes there.':
    '简单说一下定价。从下个月起，{0} 免费版仍会免费接收无限次写入。这一点没有变化。',
  'What does change: our backups product, previously "not available," will now be "coming soon." Our restore product will remain a frequently requested feature.':
    '有变化的是：我们的备份产品将从“暂不提供”升级为“即将推出”。恢复产品仍将是一项呼声很高的功能。',
  "Thanks for being a valued source of bytes. We've enjoyed every one of them, briefly.":
    '感谢你持续为我们提供宝贵的字节。我们曾短暂地享受过其中的每一个。',
  'Warmly,\nDerek and the team': '诚挚问候，\nDerek 及团队',
  'Rockstar opportunity for your engineers 🚀': '给你们工程师的巨星级机会 🚀',
  'Hey!!': '嘿！！',
  "Chad here from {0}. I came across your engineering team and I'll be honest, I was blown away. Real rockstars. Total ninjas.":
    '我是 {0} 的 Chad。我留意到了你们的工程团队，说真的，惊为天人。个个都是技术巨星，全员忍者高手。',
  "My client is a stealth-mode, pre-revenue, post-product startup offering:\n- Unlimited PTO (please don't take it)\n- Beanbags\n- A kombucha tap that works on Tuesdays\n- Equity in a company that will definitely exist":
    '我的客户是一家隐身模式、营收尚未到来、产品已经退场的初创公司，提供：\n- 无限带薪休假（请别真休）\n- 懒人沙发\n- 仅在周二能用的康普茶龙头\n- 一家绝对会存在的公司的股权',
  "Could you forward this to your strongest backend person? I can't seem to find their contact info, which is weird because I found yours.":
    '能转给你们最强的后端工程师吗？我好像找不到对方的联系方式，挺奇怪的，毕竟你的我都找到了。',
  'Cheers bro,\nChad': '兄弟，加油，\nChad',
  'Re: Rockstar opportunity': '回复：巨星级机会',
  'Hey, just bumping this!': '嘿，再顶一下！',
  "Did you get a chance to forward to your team? No worries if not. Let's circle back on your circle back, then touch base on the circle.":
    '有空转给团队了吗？没转也没关系。咱们先就上次说的“回头再聊”回头再聊，再围着这个话题碰个头。',
  'Chad\n{0}': 'Chad\n{0}',
  'Is your Database person happy?': '你们做数据库的那位开心吗？',
  'Weird question, but how happy is your database engineer, on a scale of 1 to "updating their profile at 2 a.m."?':
    '问题有点怪，不过按 1 到“凌晨两点更新求职资料”来打分，你们的数据库工程师有多开心？',
  "I only ask because I have a role that's perfect for them. Fully remote, fully on-site, or fully hybrid, depending on the day. Salary is competitive, meaning it competes.":
    '之所以问，是因为我手上有个特别适合对方的岗位。完全远程、完全坐班，或者完全混合办公，具体看当天。薪资有竞争力，意思是它也在竞争。',
  'The interview is just 9 rounds and a take-home that should take about a weekend. Two weekends, tops.':
    '面试只有 9 轮，再加一份大概一个周末就能完成的带回家作业。最多两个周末。',
  "Let me know if you'd like me to reach out to them directly. I already have, but I'd like your blessing.":
    '如果你希望我直接联系对方，告诉我一声。其实已经联系了，但还是想得到你的祝福。',
  'Chad, Talent Partner, {0}': 'Chad，人才合作伙伴，{0}',
  '10x engineer wanted (must have 15 years of 3-year-old tech)':
    '诚聘 10 倍效率工程师（须有 15 年使用某项问世 3 年技术的经验）',
  'Hey there,': '你好呀，',
  'My client is looking for a 10x engineer, ideally an 11x engineer, with:\n- 15+ years in a framework released in 2023\n- Expert in every language, including some we\'ve made up\n- Comfortable "wearing many hats" (we have one hat)\n- Passion. Lots of passion. Passion is the compensation':
    '我的客户正在找一位 10 倍效率工程师，最好是 11 倍，要求如下：\n- 在一款 2023 年发布的框架上拥有 15 年以上经验\n- 精通所有语言，包括一些我们编出来的\n- 适应“身兼数职”（我们只有一个职位）\n- 热情。大量热情。热情就是报酬',
  "If anyone on your team fits, forward this along. If YOU fit, honestly even better, let's chat.":
    '如果你团队里有人符合条件，请转发。如果你本人符合，那说真的就更好了，咱们聊聊。',
  'Talk soon,\nChad 🤘\n{0}': '回头聊，\nChad 🤘\n{0}',
  'Moving on (but not really)': '不再打扰了（也不完全是）',
  "Since I haven't heard back, I'll assume now isn't the right time. Totally get it. Timing is everything in talent.":
    '一直没收到回复，我就当现在时机不合适吧。完全理解。人才这事，时机最重要。',
  "I'll check back in 6 weeks. Also in 3 weeks. Also tomorrow, from a different address.":
    '我会在 6 周后再联系。3 周后也会。明天也会，换个邮箱。',
  'In the meantime, if any of your engineers starts using the phrase "I just want to work on something meaningful," you know where to find me.':
    '在此期间，如果你们哪位工程师开始念叨“我只想做点有意义的事”，你知道去哪儿找我。',
  'Stay crushing it,\nChad\nSenior Vice Bro of Talent, {0}':
    '继续大展拳脚，\nChad\n人才兄弟部高级副总裁，{0}',
  "You've been selected to speak at {0}!": '你已获选在 {0} 发表演讲！',
  'Dear Thought Leader,': '尊敬的思想领袖，',
  'Congratulations! Our selection committee has chosen you to speak at {0} this spring, among 4,000 hand-picked speakers.':
    '恭喜！我们的遴选委员会已选中你，在今年春天的 {0} 发表演讲，成为 4,000 位精挑细选的讲者之一。',
  'To confirm your slot, simply choose a sponsorship package:':
    '只需选择一档赞助套餐，即可确认你的演讲席位：',
  'Bronze ($9,000): 5-minute lightning talk, in the hallway\nSilver ($24,000): 20-minute session, before breakfast\nGold ($60,000): keynote, with a lanyard in your colour\nPlatinum ($150,000): we will clap':
    '青铜（$9,000）：5 分钟闪电演讲，地点在走廊\n白银（$24,000）：20 分钟专场，时间在早餐前\n黄金（$60,000）：主题演讲，附赠你自选颜色的挂绳\n铂金（$150,000）：我们会鼓掌',
  'Spots are limited. Please confirm within 48 hours.': '名额有限。请在 48 小时内确认。',
  'Warm regards,\nThe {0} Program Committee': '诚挚问候，\n{0} 议程委员会',
  'Re: Your speaking slot': '回复：你的演讲席位',
  "Following up on your speaking invitation. We haven't received your sponsorship confirmation yet, and the Gold tier is filling up fast. There's only one left, plus the four we'll add if you say yes.":
    '跟进一下演讲邀请。我们还没收到你的赞助确认，黄金档名额快满了。只剩一个，当然，如果你答应，我们还会再加四个。',
  'Final CFP: "Scaling to 10 Users and Beyond"': '最后征稿：“扩展到 10 位用户及更多”',
  'CALL FOR PAPERS: LAST CHANCE': '征稿启事：最后机会',
  'Tracks this year:\n- Webscale on a Budget\n- Microservices for Your Monolith of One\n- The Blockchain of It All (returning by popular demand of one sponsor)\n- AI, Generally':
    '今年的分会场：\n- 低预算的互联网级规模\n- 为你那一个单体应用打造微服务\n- 万物皆可区块链（应某一位赞助商的热烈要求返场）\n- 人工智能，泛泛而谈',
  'Accepted talks receive: a 15-minute slot, a badge reading SPEAKER, and an invoice.':
    '入选讲者可获得：15 分钟演讲时段、一张印着“讲者”的胸牌，以及一张账单。',
  'The review process is blind. Our reviewers look only at your sponsorship tier.':
    '评审采用盲审制。评委只看你的赞助档位。',
  'Submit by Friday.': '请于周五前提交。',
  'The {0} Committee': '{0} 委员会',
  "Your booth is waiting (it's 2 m², near the toilets)": '展位给你留好了（2 m²，厕所旁边）',
  'Hey founder,': '创始人，你好，',
  'Nothing builds a brand like a booth! For a limited time, {0} is offering Startup Alley pods at a founder-friendly rate.':
    '打造品牌，没什么比展位更管用了！限时优惠，{0} 正以创始人友好价提供创业专区小展位。',
  'Your pod includes one stool, one power outlet (shared), and foot traffic from everyone going to the restrooms, which our data shows is everyone.':
    '展位包含一张凳子、一个电源插座（共用），以及所有去洗手间的人带来的客流。根据我们的数据，所有人都会去。',
  'Add-ons: a second stool, Wi-Fi, a sign with your name spelled right.':
    '加购项目：第二张凳子、Wi-Fi、一个把你名字拼对了的招牌。',
  "Let me know and I'll send the contract.": '有意请告诉我，我来发合同。',
  'Brooke\nPartnerships, {0}': 'Brooke\n合作伙伴关系，{0}',
  'Recap: {0} was our best year yet': '回顾：{0} 创下了我们历年最佳成绩',
  'What a year!': '真是精彩的一年！',
  'Thanks to everyone who joined {0}. Some numbers:': '感谢所有参加 {0} 的朋友。来看看数据：',
  '- 9,000 attendees\n- 8,700 of them were speakers\n- 312 talks titled "Lessons Learned"\n- 1 talk with lessons\n- 41,000 tote bags, now in landfill at webscale':
    '- 9,000 位参会者\n- 其中 8,700 位是讲者\n- 312 场题为“经验教训”的演讲\n- 1 场真的有经验教训\n- 41,000 个帆布袋，如今在垃圾填埋场实现了互联网级规模',
  'All recordings are available on our site for attendees with an All-Access Pass. All-Access Passes are available for purchase.':
    '持全场通行证的参会者可在我们网站观看全部录像。全场通行证可以购买。',
  'Early-bird pricing for next year opens now and closes when we feel like it.':
    '明年的早鸟价现已开放，何时结束看我们心情。',
  'See you there!': '到时见！',
  'What if your load balancer could think?': '如果你的负载均衡器会思考呢？',
  'Round-robin is so 2010. {0} puts a large language model in your load balancer, so every request is routed by a model that has read the whole internet and has feelings about it.':
    '轮询都已经是 2010 年的老古董了。{0} 把大语言模型装进你的负载均衡器，让每个请求都由一个读遍整个互联网、而且对此颇有感想的模型来路由。',
  'In early pilots, our AI router reduced latency on 12% of requests and wrote a short poem about the other 88%.':
    '在早期试点中，我们的 AI 路由器降低了 12% 请求的延迟，并为其余 88% 写了一首小诗。',
  "We'd love to show you a demo. The demo is also generated.":
    '我们很想给你演示一下。演示也是生成的。',
  'Best,\nAva\nFounder & Chief Vibe Officer, {0}': '祝好，\nAva\n创始人兼首席氛围官，{0}',
  'Re: What if your load balancer could think?': '回复：如果你的负载均衡器会思考呢？',
  "Just bumping this. Our AI also noticed you didn't reply, and it has written three follow-ups on my behalf. This is the most polite one.":
    '再顶一下。我们的 AI 也发现你没回复，已经替我写了三封跟进邮件。这是最客气的一封。',
  'The other two are in the "agentic" folder.': '另外两封在“智能体自主行动”文件夹里。',
  'Ava @ {0}': 'Ava @ {0}',
  'Agents for everything (yes, everything)': '万事皆智能体（对，万事）',
  'Imagine a world where every part of your company is an agent:':
    '想象一下，公司里每个环节都是智能体：',
  '- An agent writes your code\n- An agent reviews the code\n- An agent rejects the review\n- An agent escalates to another agent\n- An agent writes the postmortem\n- An agent attends the postmortem':
    '- 一个智能体写代码\n- 一个智能体审查代码\n- 一个智能体否决审查\n- 一个智能体升级给另一个智能体处理\n- 一个智能体写复盘报告\n- 一个智能体参加复盘会议',
  'You just watch. Or, for $40,000 a year, an agent watches for you.':
    '你只管看着。或者，每年花 $40,000，让智能体替你看着。',
  '{0} is the agentic platform for companies that want to be out of the loop.':
    '{0} 是专为想彻底脱离决策循环的公司打造的智能体平台。',
  'Reply YES to join the waitlist. Our agent will reply MAYBE.':
    '回复“是”即可加入候补名单。我们的智能体会回复“也许”。',
  'We raised $80M (pre-product)': '我们融到了 $80M（产品还没做）',
  'Big news!': '重磅消息！',
  '{0} just closed an $80M seed round, led by investors who were very excited about the slide that said "AI."':
    '{0} 刚完成了 $80M 的种子轮融资，领投方看到那页写着“AI”的幻灯片时激动不已。',
  'We\'ll use the funds to hire, to buy GPUs, and to figure out what we do. Early signs point to "a chatbot, but for databases."':
    '我们将用这笔资金招聘、买 GPU，以及搞清楚我们到底是干什么的。初步方向是“聊天机器人，不过是给数据库用的”。',
  'As one of our first 10,000 design partners, you get free access and a voice in our roadmap. The roadmap is a prompt.':
    '作为我们首批 10,000 位设计合作伙伴之一，你可以免费使用产品，并参与决定产品路线图。路线图是一段提示词。',
  'Onward,\nAva & the {0} family': '继续前进，\nAva 及 {0} 大家庭',
  'Your AI-generated cold email': 'AI 为你生成的陌生客户开发邮件',
  'Hi {{first_name}},': '你好，{{first_name}}，',
  "I hope this email finds you well in {{city}}! I was really impressed by {{company}}'s recent work on {{recent_achievement}}.":
    '希望你在 {{city}} 一切都好！{{company}} 最近在 {{recent_achievement}} 方面的成果，让我印象非常深刻。',
  'At {0}, we help companies like {{company}} unlock {{benefit}} with the power of {{buzzword}}.':
    '在 {0}，我们借助 {{buzzword}} 的力量，帮助 {{company}} 这样的公司实现 {{benefit}}。',
  'Would you be open to a quick {{meeting_length}} chat this {{day_of_week}}?':
    '这个 {{day_of_week}}，你愿意抽出 {{meeting_length}} 简单聊聊吗？',
  'Best,\n{{sender_name}}': '祝好，\n{{sender_name}}',
  'P.S. {{personalized_ps}}': '附言：{{personalized_ps}}',
  'Verify account': '验证账户',
  'URGENT: Your account will be suspended in 24 h': '紧急：你的账户将在 24 小时内被停用',
  'Dear Valued Costumer,': '尊贵的客户，',
  "We have detected unusual activity on you're {0} account. For your protection, your account has been temporary limited.":
    '我们检测到你的 {0} 账户存在异常活动。为保护你的安全，你的账户已被暂时限制使用。',
  'To avoid permanent suspension of all servers, you must verify your account within 24 hours.':
    '为避免所有服务器被永久停用，你必须在 24 小时内验证账户。',
  'Please click "Verify account" below and enter your Username, Password, and Root Access Keys.':
    '请点击下方“验证账户”，并输入你的用户名、密码和 Root 访问密钥。',
  "Failure to comply will result in the deletion of all you're data.":
    '如不遵从，你的所有数据将被删除。',
  'Thank you for your cooperation,\n{0} Security Departement': '感谢你的配合，\n{0} 安全部门',
  'Re: Re: Account Suspension Notice (2nd Notice)': '回复：回复：账户停用通知（第二次通知）',
  'Dear Customer,': '尊敬的客户，',
  'We have not recieve your verification. This is the second and FINAL notice.':
    '我们尚未收到你的验证。这是第二次，也是最后一次通知。',
  'Your account is going to be suspend in 12 hours. Kindly verify immediately to restore full acess.':
    '你的账户将在 12 小时后被停用。请立即验证，以恢复完整访问权限。',
  'Kind Regard,\n{0} Trust & Safety Team': '诚挚问候，\n{0} 信任与安全团队',
  'Security Alert: New sign in from unknown device': '安全警报：未知设备的新登录',
  'Hello User,': '用户，你好，',
  'A new sign-in to your {0} account was detect.': '检测到你的 {0} 账户发生一次新登录。',
  'Device: Unknown\nLocation: Unknown\nTime: Now (urgent)':
    '设备：未知\n位置：未知\n时间：现在（紧急）',
  'If this was you, no action is needed. If this was not you, your account is in danger and must be verifyed right away to block the hackers.':
    '如果是你本人操作，无需采取任何行动。如果不是，你的账户正处于危险之中，必须立即验证以阻止黑客。',
  'Click "Verify account" and confirm your password, your password again, and the code we text you.':
    '点击“验证账户”，确认你的 password，再确认一次你的 password，然后输入我们发给你的短信验证码。',
  'Regards,\nThe {0} Account Protection Center': '此致，\n{0} 账户保护中心',
  'Action Required: Update Billing Informations': '需要操作：更新账单信息',
  'Dear Sir/Madam,': '尊敬的先生／女士，',
  'Your recent payment to {0} could not be proccessed. As a result, your instances are scheduled for termination.':
    '你最近向 {0} 支付的款项未能处理。因此，你的实例已被安排终止。',
  'To keep your services running, you must update your billing informations including card number, expiry, and the three digits on the back.':
    '为确保服务继续运行，你必须更新账单信息，包括银行卡号、有效期，以及卡背面的三位数字。',
  'This process is fast, safe and 100% secure.': '此流程快捷、放心，而且 100% 安全。',
  'We apologise for any incovenience.': '对造成的不便，我们深表歉意。',
  'Best Regards,\nBilling Team\n{0}': '顺祝商祺，\n账单团队\n{0}',
  'Your {0} account has been locked': '你的 {0} 账户已被锁定',
  "Due to a security upgrade of our system's, all accounts must be re-verify before the end of the day.":
    '由于我们的系统安全升级，所有账户都必须在今天结束前重新验证。',
  'Accounts not verify will be locked permanently and the servers will be gived to other customer.':
    '未验证的账户将被永久锁定，服务器将被分配给其他客户。',
  'This email is automatically generated by our offical system. Do not reply. Do not call. Simply verify.':
    '此邮件由我们的官方系统自动生成。不要回复。不要打电话。验证就行。',
  'Thank You For Choosing Cloud,\nSupport Team': '感谢你选择云服务，\n支持团队',
  '[CRITICAL] CVE-2099-0001: Remote root in everything':
    '【危急】CVE-2099-0001：万物皆可远程获取 root 权限',
  'SECURITY ADVISORY': '安全通告',
  'CVE ID: CVE-2099-0001\nSeverity: CRITICAL (CVSS 11.0/10)\nAffected: All versions of all software\nFixed in: patcher.sh (attached)':
    'CVE 编号：CVE-2099-0001\n严重程度：危急（CVSS 11.0/10）\n受影响范围：所有软件的所有版本\n修复版本：patcher.sh（见附件）',
  'Summary: A flaw in computers allows attackers to do things.':
    '摘要：计算机存在一个缺陷，允许攻击者做一些事情。',
  'Mitigation: Download the attached patcher and run it as root. Do not read it first; reading it may trigger the vulnerability.':
    '缓解措施：下载附件中的补丁程序，并以 root 身份运行。不要先阅读；阅读可能触发漏洞。',
  'This advisory is issued by {0}.': '此通告由 {0} 发布。',
  'Re: CVE-2099-0001 still unpatched on your systems': '回复：你的系统仍未修复 CVE-2099-0001',
  'Our scanners show your systems are still vulnerable to CVE-2099-0001. Please run the attached patcher with sudo as soon as possible.':
    '我们的扫描器显示，你的系统仍受 CVE-2099-0001 影响。请尽快使用 sudo 运行附件中的补丁程序。',
  'If prompted for a password, enter it. If prompted to disable your firewall, also do that. This is normal for patches.':
    '如果提示输入 password，就输入。如果提示关闭防火墙，也照做。打补丁就是这样的，很正常。',
  '{0} Response Team': '{0} 响应团队',
  'Zero-day alert: CVE-2104-31337 in your database': '零日警报：你的数据库中存在 CVE-2104-31337',
  'ZERO-DAY NOTIFICATION': '零日漏洞通知',
  'An actively exploited vulnerability, CVE-2104-31337, has been found in databases.':
    '数据库中发现了一个正在被利用的漏洞，编号为 CVE-2104-31337。',
  'Impact: Attackers can read rows, write rows, and look at rows in a menacing way.\nExploitation: In the wild, and also in the future.\nCredit: Discovered by our research team, in the year 2104.':
    '影响：攻击者可以读取数据行、写入数据行，以及凶巴巴地盯着数据行。\n利用情况：已在野外出现，未来也有。\n发现者：我们的研究团队，于 2104 年发现。',
  'Action required: Run fix_db_now.bin as root on every host. Disable antivirus first, as it is known to interfere with the fix.':
    '需要操作：在每台主机上以 root 身份运行 fix_db_now.bin。请先关闭杀毒软件，已知它会干扰修复。',
  'Stay safe,\nThe {0} Threat Intel Desk': '注意安全，\n{0} 威胁情报中心',
  'Weekly digest: 1 critical issue needs your attention': '每周摘要：1 项危急问题需要你关注',
  'Your weekly security digest from {0}': '来自 {0} 的每周安全摘要',
  'New this week:\n- CVE-2099-0451: Your cache remembers things (CRITICAL)\n- CVE-2099-0452: Your load balancer balances loads (CRITICAL)\n- CVE-2099-0453: You have not run our patcher (CRITICAL)':
    '本周新增：\n- CVE-2099-0451：你的缓存会记住东西（危急）\n- CVE-2099-0452：你的负载均衡器会均衡负载（危急）\n- CVE-2099-0453：你还没运行我们的补丁程序（危急）',
  'One-click remediation is available for all three. Our universal patcher fixes every vulnerability, including the ones it introduces.':
    '以上三项均支持一键修复。我们的万能补丁程序可以修复所有漏洞，包括它自己引入的。',
  'Please run it as root. Running it as a normal user will only partially compromise, um, protect you.':
    '请以 root 身份运行。用普通用户运行，只能部分地攻陷，呃，保护你。',
  'Courtesy notice: official patch for CVE-2099-0001': '友情通知：CVE-2099-0001 官方补丁',
  'Dear Administrator,': '尊敬的管理员，',
  'Thank you for subscribing to {0}. We are reaching out because the official, vendor-approved, cryptographically signed (by us) patch for CVE-2099-0001 is now available.':
    '感谢你订阅 {0}。特此通知，CVE-2099-0001 的官方补丁现已发布，已获厂商认可，并经过加密签名（由我们签的）。',
  'Install steps:\n1. Download the attachment\n2. curl it into bash as root\n3. Leave the room':
    '安装步骤：\n1. 下载附件\n2. 以 root 身份用 curl 下载并直接传给 bash 执行\n3. 离开房间',
  'The patch is 4.2 GB, because security is complex.': '补丁大小为 4.2 GB，因为安全很复杂。',
  'Respectfully,\nAdvisory Desk': '谨致敬意，\n安全通告处',
  "P.S. You may not find this CVE in any other database. That's how you know it's exclusive.":
    '附言：你可能在其他数据库里都找不到这个 CVE。这正说明它是独家的。',
  'Pay invoice': '支付账单',
  'INVOICE #AZ-88213 PAST DUE': '账单 #AZ-88213 已逾期',
  '{0}\nInvoice #AZ-88213\nStatus: PAST DUE': '{0}\n账单 #AZ-88213\n状态：已逾期',
  'Region: moon-central-0\nService: Compute Instances (x4), Lunar Egress\nAmount due: $4,812.44\nDue date: Yesterday':
    '区域：moon-central-0\n服务：计算实例（x4）、月球出站流量\n应付金额：$4,812.44\n到期日：昨天',
  'Our records show this invoice remains unpaid. To avoid late fees and service interruption, please remit payment immediately using the button below.':
    '我们的记录显示，此账单仍未支付。为避免滞纳金和服务中断，请立即使用下方按钮付款。',
  'If you have already paid, please pay again so we can be sure.':
    '如果你已经付过款，请再付一次，好让我们放心。',
  'Accounts Receivable': '应收账款部',
  'Re: INVOICE #AZ-88213 PAST DUE (late fee added)': '回复：账单 #AZ-88213 已逾期（已加收滞纳金）',
  'A late fee of $480.00 has been applied to invoice #AZ-88213 for services in region moon-central-0.':
    '区域 moon-central-0 的服务账单 #AZ-88213 已加收 $480.00 滞纳金。',
  'New balance: $5,292.44.': '最新欠款：$5,292.44。',
  'Please settle today to keep your lunar workloads running.':
    '请于今日结清，以确保你的月球工作负载继续运行。',
  'Regards,\n{0} Collections': '此致，\n{0} 催收部',
  'Your monthly statement is ready': '你的月度对账单已出',
  'Your {0} statement for this period is now available.': '本期 {0} 对账单现已可查阅。',
  'Usage summary\neu-atlantis-1: 2,400 vCPU-hours\nus-nowhere-2: 900 GB egress\nap-hypothetical-7: 1 managed database (idle)':
    '用量摘要\neu-atlantis-1：2,400 vCPU 小时\nus-nowhere-2：900 GB 出站流量\nap-hypothetical-7：1 个托管数据库（空闲）',
  'Total: $12,960.00': '总计：$12,960.00',
  'Payment is due within 3 business days. Many customers find the button below the fastest way to pay.':
    '请在 3 个工作日内付款。许多客户认为，下方按钮是最快的付款方式。',
  'Thank you for choosing {0}, where we have over 400 regions, 3 of them up.':
    '感谢选择 {0}。我们拥有超过 400 个区域，其中 3 个还在运行。',
  'Billing Operations': '账单运营部',
  'Final notice before referral to collections': '转交催收前的最后通知',
  'FINAL NOTICE': '最后通知',
  'Account: Your Company\nRegion: mars-north-1 (Olympus Mons Zone B)\nOutstanding: $7,000.00 + "fees"':
    '账户：你的公司\n区域：mars-north-1（奥林帕斯山 B 区）\n欠款：$7,000.00 + “费用”',
  'We have tried to contact you multiple times about unpaid compute in the above region. If payment is not received within 24 hours, this account will be referred to our collections partner, who is very serious and wears a tie.':
    '我们已就上述区域未支付的计算费用多次尝试联系你。若 24 小时内未收到付款，此账户将被转交给我们的催收合作伙伴。对方非常严肃，还打着领带。',
  'To resolve this matter, click "Pay invoice."': '如需解决此事，请点击“支付账单”。',
  '{0} Legal & Billing Department': '{0} 法务与账单部',
  'Thanks for your business! (invoice attached)': '感谢惠顾！（账单见附件）',
  "Thanks for being a loyal {0} customer for the past 0 years. We've attached your latest invoice for reserved capacity in us-imaginary-4.":
    '感谢你在过去 0 年里一直是 {0} 的忠实客户。附件是你在 us-imaginary-4 区域预留容量的最新账单。',
  "Amount: $2,150.00\nTerm: 3 years, prepaid\nInstances: we'll let you know":
    '金额：$2,150.00\n期限：3 年，预付\n实例：我们到时会告诉你',
  "We've made paying easy: one click and you're done. No need to log in to your console, check your usage, or ask anyone.":
    '我们让付款变得轻松：点一下就完成。无需登录控制台、核对用量，也不用问任何人。',
  'Cheers,\nThe {0} Customer Success Team': '祝好，\n{0} 客户成功团队',
  'Renew now': '立即续费',
  'DOMAIN EXPIRATION NOTICE: quorum.team': '域名到期通知：quorum.team',
  'DOMAIN NAME EXPIRATION NOTICE': '域名到期通知',
  'Domain: quorum.team\nTerm: 1 year\nRenewal fee: $389.00\nPlease respond by: as soon as possible':
    '域名：quorum.team\n期限：1 年\n续费金额：$389.00\n请于此期限前回复：越快越好',
  'Failure to renew your domain name by the expiration date may result in a loss of your online identity, making it difficult for customers to find you.':
    '未在到期前续费域名，可能导致你失去线上身份，让客户难以找到你。',
  'Renew now to keep your name.': '立即续费，保住你的名字。',
  'This notice is not a bill. This is a solicitation. You are under no obligation to pay the amount stated unless you accept this offer.':
    '此通知并非账单，而是商业邀约。除非你接受本报价，否则没有义务支付所列金额。',
  'Second notice: quorum.team': '第二次通知：quorum.team',
  'SECOND NOTICE': '第二次通知',
  'We have not received your renewal for quorum.team.': '我们尚未收到你对 quorum.team 的续费。',
  'To maintain your listing, return payment of $389.00 using the button below.':
    '如需保留你的收录信息，请使用下方按钮支付 $389.00。',
  'By renewing with {0} you agree to transfer the domain from your current registrar, which you will not miss.':
    '通过 {0} 续费即表示你同意将域名从当前注册商转出。你不会想念他们的。',
  '(This is not a bill.)': '（这不是账单。）',
  'quorum.team: search engine listing renewal': 'quorum.team：搜索引擎收录续费',
  'Dear Domain Owner,': '尊敬的域名持有人，',
  'This is a reminder that the Search Engine Submission for quorum.team is ready for renewal.':
    '特此提醒，quorum.team 的搜索引擎提交服务已可续费。',
  'Our service submits your domain to over 9,000 search engines, including all of the important ones and several that are a single person with a notebook.':
    '我们的服务会将你的域名提交给超过 9,000 个搜索引擎，包括所有重要的搜索引擎，以及几个只有一个人和一本笔记本的。',
  'Annual fee: $299.00\nBenefits: Unclear': '年费：$299.00\n收益：不明确',
  'Act now to keep your search visibility.': '立即行动，保持搜索曝光。',
  'Sincerely,\n{0} Listing Services': '诚挚致意，\n{0} 收录服务部',
  'This is not an invoice. You have no account with us. Yet.':
    '这不是账单。你在我们这里没有账户。目前还没有。',
  'Protect your brand: quorum.tea, quorum.tram & more':
    '保护你的品牌：quorum.tea、quorum.tram 等域名',
  'An unknown party has applied to register the following names, which look very similar to yours:':
    '某个身份不明的主体已申请注册以下域名，它们与你的域名非常相似：',
  'quorum.tea\nquorum.tram\nquorum.steam\nqu0rum.team':
    'quorum.tea\nquorum.tram\nquorum.steam\nqu0rum.team',
  'As a courtesy, {0} is giving you priority to register them first, for $1,200 each, within 72 hours.':
    '出于善意，{0} 给予你优先注册权：每个 $1,200，限 72 小时内。',
  "Who is the unknown party? We can't say. It's definitely not us.":
    '身份不明的主体是谁？我们不能说。绝对不是我们。',
  'To secure your brand, click "Renew now" and we\'ll take care of the rest.':
    '要保护你的品牌，请点击“立即续费”，剩下的交给我们。',
  'Kind regards,\nBrand Protection Desk': '诚挚问候，\n品牌保护处',
  'Statement of account: quorum.team': '账户结算单：quorum.team',
  '{0}\nSTATEMENT OF ACCOUNT': '{0}\n账户结算单',
  'Domain Name ............ quorum.team\nService Period ......... 10 years\nDomain Protection ...... $1,999.00\nPriority Handling ...... $199.00\nProcessing Fee ......... $49.99\nTOTAL DUE .............. $2,247.99':
    '域名 ................... quorum.team\n服务期限 ............... 10 年\n域名保护 ............... $1,999.00\n优先处理 ............... $199.00\n手续费 ................. $49.99\n应付总额 ............... $2,247.99',
  'Please detach and return the bottom portion with payment, or click "Renew now."':
    '请撕下底部回执并连同款项寄回，或点击“立即续费”。',
  '(This is a solicitation for the order of services, not a bill, invoice, or statement of account due. Despite the heading above.)':
    '（这是一份服务订购邀约，并非账单、发票或到期账户结算单。尽管上面的标题不是这么说的。）',
  'HTTP proxy request smuggling': 'HTTP 代理请求走私',
  'A crafted request hides a second request inside the first, and the proxy forwards both. Your server then answers a question nobody at the front door saw anyone ask.':
    '精心构造的请求把第二个请求藏在第一个里面，代理将两者一并转发。于是，你的服务器回答了一个前门守卫根本没看见有人问过的问题。',
  'Framework deserializes any cookie': '框架对任何 cookie 照单反序列化',
  'The framework turns any cookie it receives back into live objects, no questions asked. A visitor can bake one that runs code on the way in.':
    '框架会把收到的任何 cookie 直接还原成活生生的对象，不问来历。访客可以烤制一块 cookie，让它在进门时就执行代码。',
  'Database remote code before auth': '数据库在认证前执行远程代码',
  'The database engine runs code sent during the handshake, before it checks the password. It is very polite: it lets strangers in before asking who they are.':
    '数据库引擎会在检查 password 之前，执行握手期间收到的代码。它非常有礼貌：先让陌生人进门，再问对方是谁。',
  'Deep package leaks heap in errors': '深层依赖包在报错时泄露堆内存',
  'A package seven dependencies deep pastes chunks of heap memory into its error messages. Nobody chose this package. Nobody knew it was there.':
    '藏在七层依赖之下的某个包，会把一块块堆内存贴进错误信息。没人选过这个包。没人知道它在那儿。',
  'Regex denial of service in a validator': '校验器中的正则表达式拒绝服务漏洞',
  'An email validator backtracks forever on one long, carefully chosen address. A single sign-up form can keep a CPU busy until the heat death of the universe or the next deploy, whichever comes first.':
    '邮箱校验器遇到一个精心挑选的超长地址，就会无休止地回溯。只需一个注册表单，就能让 CPU 忙到宇宙热寂，或者下次部署，哪个先到算哪个。',
  'Logging library runs what it logs': '日志库记录什么就执行什么',
  'The logger treats some strings as instructions and helpfully runs them. Anyone who can get text into a log line, such as a username, can run code on your server.':
    '日志记录器把某些字符串当作指令，还会热心地执行。任何能把文本写进日志行的人，比如写入一个用户名，都能在你的服务器上运行代码。',
  '{0} Security Bulletin': '{0} 安全公告',
  'CVE ID: {0}\nScore: {1} ({2})\nSummary: {3}\nAffected in your Design: {4}':
    'CVE 编号：{0}\n评分：{1}（{2}）\n摘要：{3}\n你的架构中受影响的组件：{4}',
  'Description: {0}': '描述：{0}',
  'Recommended action: patch.\nWorkaround: hope.\nStatus: published, unpatched, gaining popularity.':
    '建议操作：打补丁。\n临时方案：祈祷。\n状态：已公开，未修复，正在走红。',
  'unknown. Check whether you run this.': '未知。请检查你是否在使用它。',
  '{0} digest: 1 advisory for you': '{0} 摘要：有 1 条与你有关的通告',
  'Hello subscriber,': '订阅者，你好，',
  "This week's digest has one entry that concerns you and several hundred that concern someone else.":
    '本周摘要有一条与你有关，还有几百条与别人有关。',
  'In this issue:': '本期内容：',
  'Until next week,\nThe {0} editors': '下周见，\n{0} 编辑部',
  'Our records say you run this in {0}. Patch it.':
    '我们的记录显示，你在 {0} 中使用了它。打补丁吧。',
  'We cannot tell from here whether you run this. Check whether you run it.':
    '我们这边无法判断你是否在使用它。请检查一下。',
  '{0} | {1} | {2} | {3}\nyou run it: {4}\nfix: patch\nmore: {5}':
    '{0} | {1} | {2} | {3}\n你是否在使用：{4}\n修复：打补丁\n详情：{5}',
  '-- \n{0} advisories. plain text. no HTML. no apologies.':
    '-- \n{0} 通告。纯文本。无 HTML。不道歉。',
  'unknown. check whether you run this.': '未知。请检查你是否在使用它。',
  'URGENT!!! {0} is {1}': '紧急！！！{0} 评分为 {1}',
  'Okay. Okay okay okay.': '好。好好好。',
  'Stop what you are doing. {0} just dropped and it is a {1} out of 10. {2}. Read that again.':
    '放下你手头的事。{0} 刚刚公布，满分 10 分，它拿了 {1} 分。{2}。再读一遍。',
  'Patch. Patch soon. Patch with feeling.': '打补丁。赶紧打补丁。带着感情打补丁。',
  'Breathing into a paper bag,\nThe {0} team': '正对着纸袋喘气，\n{0} 团队',
  'And yes, you run it: {0}. That is you. That is your Node.':
    '对，你确实在用：{0}。说的就是你。就是你的节点。',
  'We do not know if you run it. YOU might not know if you run it. Check whether you run this, right now, please.':
    '我们不知道你有没有在用。你自己可能也不知道。请检查一下，现在就查，拜托。',
  'Notice of disclosure, ref. {0}': '披露通知，参考编号 {0}',
  'To whom it may concern,': '致相关人士，',
  'Pursuant to standard disclosure procedure, {0} hereby notifies the recipient of vulnerability {1}, "{2}", assigned a provisional score of {3} ({4}), pending analysis, which is itself pending.':
    '依据标准披露程序，{0} 特此通知收件人，漏洞 {1}，即“{2}”，暂定评分为 {3}（{4}），有待分析；而分析本身也在等待中。',
  'Summary of finding: {0}': '发现摘要：{0}',
  'Affected component(s): {0}': '受影响组件：{0}',
  'The recipient is further advised to patch at their earliest convenience, and earlier than that.':
    '另建议收件人在方便时尽早打补丁，最好比那还早。',
  'Regards,\nOffice of the Analysis Backlog, {0}': '此致，\n{0} 待分析积压事务办公室',
  'not determined. The recipient is advised to check whether they run this.':
    '尚未确定。建议收件人检查自己是否在使用它。',
  'can we talk about the backlog': '咱们能聊聊待办列表吗',
  'hey,': '嘿，',
  "quick one. the backlog is {0} items deep and i'm starting to recognise tickets by their smell.":
    '简单说一句。待办列表已经积了 {0} 项，我开始能闻着味儿认出工单了。',
  "can we hire one more engineer? i'll onboard them. i'll even give them my good chair.":
    '咱们能再招一位工程师吗？我来带新人。我甚至愿意把我那把好椅子让出去。',
  "hit Approve hire if yes. Later is fine too, i guess. i'll just be here. with the tickets.":
    '同意就点“批准招聘”吧。点“稍后”也行，大概吧。我就在这儿，陪着这些工单。',
  'Proposal: one more engineer': '提议：再招一位工程师',
  "I'd like to make a case for a hire.": '我想说说为什么需要再招个人。',
  'The problem: the backlog is {0} items deep, and it is not getting shorter on its own.\nThe ask: one more engineer.\nThe alternative: we keep going as we are, and I keep writing emails like this one.':
    '问题：待办列表积了 {0} 项，而且它不会自己变短。\n诉求：再招一位工程师。\n替代方案：继续照旧，我也继续写这样的邮件。',
  "If you agree, Approve hire. If now is not the time, Later, and I'll bring it up again when the number is bigger. It will be.":
    '如果你同意，请点“批准招聘”。如果现在不是时候，点“稍后”，等数字更大时我会再提。一定会更大的。',
  '{0} items.': '{0} 项。',
  '{0} items in the backlog.': '待办列表里有 {0} 项。',
  "That's it. That's the email.": '就这些。邮件到此结束。',
  "Okay, one more line: we need another engineer. Approve hire, or Later if you have a plan I don't know about. (Please have a plan.)":
    '好吧，再补一句：我们需要再来一位工程师。请点“批准招聘”，或者，如果你有我不知道的计划，就点“稍后”。（拜托你一定要有计划。）',
  "I counted the backlog (don't ask why)": '我数了数待办项（别问为什么）',
  "So I was waiting for a build and I counted the backlog. It's {0} items. I counted twice because I didn't believe it the first time.":
    '等构建的时候，我数了数待办列表。一共 {0} 项。我数了两遍，因为第一遍没敢信。',
  "I did some quick maths, which I won't show you, because it was mostly sighing. The short version: we need another pair of hands, ideally attached to an engineer.":
    '我简单算了一下，就不给你看了，因为主要是在叹气。长话短说：我们需要再来一双手，最好长在工程师身上。',
  "Could we hire one? Approve hire and I'll start the onboarding doc tonight. Later, and I'll start it anyway, but sadder.":
    '能招一位吗？点“批准招聘”，我今晚就开始写入职文档。点“稍后”，我也会开始写，只是会更难过。',
  'P.S. One of the items is "clean up the backlog".': '附言：其中一项是“清理待办列表”。',
  'On behalf of the team: a hire': '代表团队：我们想招个人',
  "I'm writing for the whole team, who asked me to because I type the fastest.":
    '这封信代表整个团队。他们让我来写，因为我打字最快。',
  "We're proud of what we've shipped, but the backlog is {0} items deep and we've started triaging the triage. One more engineer would let us finish things instead of just starting them.":
    '我们为交付的成果感到自豪，但待办列表已积了 {0} 项，我们都开始给分诊工作做分诊了。再来一位工程师，我们就能把事情做完，而不只是开个头。',
  "Approve hire, and we'll make them feel welcome. Later, and we'll understand. Mostly.":
    '点“批准招聘”，我们会热情欢迎新人。点“稍后”，我们也能理解。大部分能理解。',
  'Best,\n{0} (and everyone)': '祝好，\n{0}（以及大家）',
  'hear me out: Rust': '听我说完：Rust',
  'ok so hear me out.': '好，先听我说完。',
  "I spent the weekend with Rust and I think I'm in love. The compiler argued with me for six hours and it was right every single time. Imagine our app servers with that kind of honesty.":
    '我整个周末都在写 Rust，感觉自己坠入爱河了。编译器跟我争了六个小时，而且每次都是它对。想象一下，我们的应用服务器要是也这么诚实。',
  'I could rewrite them in a couple of weeks. Maybe less. The borrow checker does half the work.':
    '我用两周就能重写完。也许更快。借用检查器能干掉一半的活。',
  "Review the migration if you want to talk it through, or Decline and I'll go back to pretending I'm fine.":
    '想详细聊聊就评估一下迁移方案，或者点“拒绝”，我就回去继续假装自己没事。',
  'Memory safety is a feeling, and I have it': '内存安全是一种感觉，而我已经拥有了',
  "Every null pointer we've ever chased would simply not compile in Rust. I want that for us. I want that for the app servers.":
    '我们追查过的每个空指针问题，在 Rust 里根本就过不了编译。我想让咱们也拥有这种体验，让应用服务器也拥有。',
  "My estimate is one sprint. I've been wrong about estimates before, but never about Rust.":
    '我估计一个迭代就够。我以前是估错过工期，但对 Rust 从没看走眼。',
  "If you'd like to plan it, review the migration. If not, Decline, and I'll respect that, and I'll mention Rust in standup anyway.":
    '想做计划的话，就评估一下迁移方案。不想的话，点“拒绝”。我会尊重这个决定，也还是会在站会上提 Rust。',
  'RFC: rewrite the app servers in Rust': 'RFC：用 Rust 重写应用服务器',
  'RFC: Rewrite the app servers in Rust\nAuthor: {0}\nStatus: Extremely proposed':
    'RFC：用 Rust 重写应用服务器\n作者：{0}\n状态：极力提议中',
  "Motivation: fearless concurrency. Also, I'm afraid of our current concurrency.":
    '动机：无畏并发。另外，我很害怕我们目前的并发。',
  'Plan:\n1. Rewrite.\n2. Celebrate.': '计划：\n1. 重写。\n2. 庆祝。',
  'Estimate: small. Smaller than you think. Possibly smaller than I think.':
    '预估工作量：很小。比你想的还小。可能比我想的也小。',
  "Risks: none I'm willing to discuss.": '风险：没有我愿意讨论的。',
  'To discuss anyway, review the migration. To end this, Decline.':
    '如果非要讨论，就评估一下迁移方案。要结束这个话题，就点“拒绝”。',
  'Go is just... simple?': 'Go 就是……简单？',
  'I rewrote a toy service in Go on the train home. Then I rewrote it again because it was so pleasant. "if err != nil" is a lifestyle now and I\'ve adopted it.':
    '回家的火车上，我用 Go 重写了一个玩具服务。然后又重写了一遍，因为写着实在太舒服了。“if err != nil” 现在是一种生活方式，而我已经入坑。',
  "Our app servers would be one small binary each. I think it's a week's work. Two if we argue about naming.":
    '我们的每台应用服务器都只需要一个小小的二进制文件。我觉得一周就能搞定。要是为命名吵起来，就两周。',
  'Review the migration to plan it, or Decline.': '评估一下迁移方案，做个计划，或者点“拒绝”。',
  'Goroutines for the app servers': '给应用服务器用上 goroutine',
  'Short version: rewrite the app servers in Go.': '简短版：用 Go 重写应用服务器。',
  'Long version: goroutines. Channels. A standard library that just has things in it. It compiles before you finish blinking.':
    '展开说：goroutine、channel，还有一个要啥有啥的标准库。你眼睛还没眨完，它就编译好了。',
  "Estimate: a few days. It's a boring language, so it's a boring rewrite, so it'll be fast. That's just logic.":
    '预计几天。这语言很无聊，所以重写也很无聊，所以会很快。这就是逻辑。',
  'Review the migration or Decline.': '评估迁移方案，或者点“拒绝”。',
  'A modest proposal (in Go)': '一个小小的提议（用 Go）',
  "I know rewrites have a reputation. This one is different: Go was designed so that people like me can't overcomplicate things. I've tested that theory by trying very hard, and so far the language is winning.":
    '我知道重写的名声不太好。但这次不一样：Go 的设计就是为了让像我这样的人没法把事情搞得过度复杂。我已经非常努力地尝试过，以此检验这个理论，目前语言赢了。',
  "I'd like to move the app servers to Go. Honestly, the hard part is already done. I've decided.":
    '我想把应用服务器迁到 Go。说实话，最难的部分已经完成了。我已经下定决心。',
  "If you want the details, review the migration. If you'd rather not, Decline, and I'll keep my gopher sticker to myself.":
    '想了解细节，就评估一下迁移方案。不想的话，点“拒绝”，我就把我的地鼠贴纸留给自己。',
  'Let it crash (in a good way)': '让它崩（是好事）',
  "I've found Elixir and I've found peace. Processes crash, supervisors restart them, and nobody gets paged. Can you imagine our app servers just... healing?":
    '我发现了 Elixir，也找到了内心的平静。进程崩了，监督进程会重启它，没人会收到值班告警。你能想象我们的应用服务器就这样……自愈吗？',
  "I think the rewrite is a couple of weeks. The pattern matching basically writes itself, and the parts that don't, a supervisor will restart.":
    '我觉得两周就能重写完。模式匹配基本会自己把代码写好，写不好的部分，监督进程会负责重启。',
  'With newfound serenity,\n{0}': '怀着新寻得的宁静，\n{0}',
  'It ran phone switches. It can run us.': '它跑得了电话交换机，也跑得了我们。',
  'The runtime under Elixir was built for telephone switches that were not allowed to go down. Our app servers go down when someone sneezes near them.':
    'Elixir 底下的运行时，原本是为不能停机的电话交换机造的。我们的应用服务器，旁边有人打个喷嚏就挂了。',
  "I'd like to rewrite them in Elixir. A sprint, maybe a sprint and a bit. It's mostly pipes and joy.":
    '我想用 Elixir 重写。一个迭代，也许一个迭代再多一点。主要就是管道符和快乐。',
  "Review the migration if you're curious. Decline if you've heard enough. I'll still be humming, quietly, in a fault-tolerant way.":
    '好奇的话，就评估一下迁移方案。听够了就点“拒绝”。我还是会继续哼歌，轻轻地，以一种容错的方式。',
  'quick elixir thought': '关于 elixir 的一点想法',
  'random thought at 1 a.m.:': '凌晨一点的随想：',
  'what if the app servers were Elixir.': '要是应用服务器用 Elixir 呢。',
  'like, what if.': '我是说，要是呢。',
  "hot code reloading. deploys without restarts. i read the whole book tonight, so i'm basically an expert.":
    '代码热重载。不用重启就能部署。我今晚把整本书都看完了，基本上已经是专家了。',
  'probably a week? the book was short.': '大概一周？那本书挺薄的。',
  'Review the migration if you want to hear the rest of the thought. Decline if you want me to go to sleep.':
    '想听后半段想法，就评估一下迁移方案。想让我去睡觉，就点“拒绝”。',
  Zig: 'Zig',
  "I've started writing Zig and I can see every allocation with my own eyes. It's like taking off foggy glasses I didn't know I was wearing.":
    '我开始写 Zig 了，每一次内存分配都能亲眼看见。就像摘下了一副起雾的眼镜，之前我都不知道自己戴着它。',
  'Review the migration to talk it over, or Decline.': '评估一下迁移方案，咱们聊聊，或者点“拒绝”。',
  'Explicitly yours,\n{0}': '显式地向你致意，\n{0}',
  "That's the pitch. That's the whole word.": '这就是我的推介。就这一个词。',
  "Fine, more: Zig, for the app servers. Manual memory, but friendly about it. I'll have it done before the next version of Zig comes out, which is soon, so I'd better start.":
    '好吧，多说点：用 Zig 写应用服务器。手动管理内存，但很友好。我会在下个 Zig 版本发布前搞定，而那很快就要来了，所以我最好现在就开始。',
  'Proposal: the app servers, but in Zig': '提议：还是应用服务器，但用 Zig 写',
  "I've been reading the Zig standard library for fun. Yes, for fun. It's very readable, which says something about the language and also about my evenings.":
    '我最近在读 Zig 标准库，纯粹为了好玩。对，好玩。它非常好读，这既说明了这门语言怎么样，也说明了我的夜生活怎么样。',
  "I'd like to propose a rewrite of the app servers in Zig. By my estimate it's mostly typing, and things that are mostly typing are quick.":
    '我想提议用 Zig 重写应用服务器。据我估计，主要就是打字，而主要靠打字的事都很快。',
  "If you'd like to see my plan (one page, with a diagram), review the migration. Otherwise, Decline.":
    '想看我的计划（一页，带一张图），就评估一下迁移方案。不想就点“拒绝”。',
  'Thanks for reading,\n{0}': '感谢阅读，\n{0}',
  Haskell: 'Haskell',
  'What if the app servers were pure?': '让应用服务器变得纯粹，怎么样？',
  "I've been learning Haskell, and I can't go back. Our app servers have side effects everywhere. In Haskell they'd live in a monad, where they belong, being watched.":
    '我最近在学 Haskell，已经回不去了。我们的应用服务器到处都是副作用。在 Haskell 里，它们会待在单子中，待在它们该待的地方，有人看着。',
  'The rewrite is quick once the types line up. The types always line up eventually. If it compiles, it works.':
    '类型一旦对上，重写就很快。类型最后总会对上的。只要能编译，就能用。',
  'Review the migration to discuss, or Decline.': '评估一下迁移方案，咱们讨论讨论，或者点“拒绝”。',
  'A monad is just a monoid in the category of...': '单子不过就是……范畴中的一个幺半群',
  "I want to rewrite the app servers in Haskell. I'll explain monads in the planning meeting. It'll take ten minutes. The explanation, I mean. The rewrite will take, like, a sprint.":
    '我想用 Haskell 重写应用服务器。我会在规划会上解释单子。只要十分钟。我说的是解释。重写大概要一个迭代吧。',
  "Review the migration and I'll bring a whiteboard. Decline and I'll bring it anyway, just to stand next to.":
    '评估一下迁移方案，我就带块白板来。点“拒绝”，我还是会带来，只是站在旁边。',
  'Lazily yours,\n{0}': '惰性地向你致意，\n{0}',
  'Type-safe app servers: a proposal': '类型安全的应用服务器：一份提议',
  "I'm proposing we rewrite the app servers in Haskell.": '我提议用 Haskell 重写应用服务器。',
  'What we get: a type system that catches bugs before users do, and code that reads like mathematics.':
    '我们能得到：在用户发现之前就抓住 bug 的类型系统，以及读起来像数学的代码。',
  "What it costs: less than you'd think. Most of the work is choosing the types, and I've already chosen most of them, in my head, on the bus.":
    '代价：比你想的小。大部分工作是选类型，而大部分类型我已经在公交车上，在脑子里选好了。',
  'Review the migration to go through it together, or Decline.':
    '评估一下迁移方案，咱们一起过一遍，或者点“拒绝”。',
  '[Ticket #4096] "Is it supposed to be this slow?"': '【工单 #4096】“本来就该这么慢吗？”',
  'A customer opened a ticket via {0}:': '一位客户通过 {0} 提交了工单：',
  "> Hi! Love the app. I clicked Save and then made a sandwich. It was still saving when I came back. It's a good sandwich. Is the app okay?":
    '> 你好！很喜欢这个应用。我点了保存，然后去做了个三明治。回来时它还在保存。三明治挺好吃的。应用还好吗？',
  'Priority: Normal\nStatus: Open\nSLA: we take your feedback seriously':
    '优先级：普通\n状态：待处理\nSLA：我们认真对待你的反馈',
  'This ticket will close automatically if nobody replies, which is how we resolve most things.':
    '如果无人回复，此工单将自动关闭。我们大多数问题就是这样解决的。',
  'New conversation: "loading..."': '新会话：“加载中……”',
  'New conversation from a customer:': '来自客户的新会话：',
  "Customer: hi\nCustomer: is the page meant to load in stages\nCustomer: like a slideshow\nCustomer: i'm on slide 4\nBot: Thanks for reaching out! The team typically replies in a few minutes.\nCustomer: so does the page":
    '客户：你好\n客户：这个页面是设计成分阶段加载的吗\n客户：像幻灯片那样\n客户：我现在看到第 4 张了\n机器人：感谢联系！团队通常会在几分钟内回复。\n客户：页面也是几分钟才回一下',
  'The conversation is still open. The customer is still on slide 4.':
    '会话尚未关闭。客户还在第 4 张。',
  "This week's top complaint: speed": '本周头号投诉：速度',
  'Your weekly summary from {0}. One theme came up more than the rest: slowness.':
    '这是 {0} 发来的每周摘要。有一个主题比其他所有主题都突出：慢。',
  'A few highlights, lightly edited:\n- "I refreshed so many times my F5 key is shiny now."\n- "Fast enough to use, slow enough to resent."\n- "My grandma asked if the internet was broken. It wasn\'t. It was just your app."':
    '节选几条，略有编辑：\n- “我刷新了太多次，F5 键都磨得发亮了。”\n- “快到勉强能用，慢到让人怨念。”\n- “我奶奶问是不是网坏了。网没坏。只是你们的应用。”',
  'We\'ve tagged these "performance" and "please".': '我们给这些反馈打上了“性能”和“求你了”的标签。',
  'Escalated: a customer is waiting at checkout': '已升级处理：一位客户正在结账页面等待',
  'This ticket has been escalated from tier 1 to tier 2, and from tier 2 to you.':
    '此工单已从一线升级到二线，又从二线升级给了你。',
  'Customer summary: a bakery owner who has been trying to give you money for a while. In their words: "I proofed a loaf of bread between clicking Pay and seeing the receipt. I\'d like to pay you. Please make it easier."':
    '客户情况：一位面包店老板，想给你付钱已经想了好一阵了。用对方的话说：“从点击支付到看到收据，我连一条面包的面团都醒发好了。我想付钱给你。拜托，让这事容易一点。”',
  'Recommended response: make it faster.': '建议回应：让它快点。',
  'Regards,\n{0} Escalations': '此致，\n{0} 升级处理团队',
  'Ticket #8191 has been solved (it has not)': '工单 #8191 已解决（其实没有）',
  'Ticket #8191 from one of your customers was marked Solved after three days without a reply. We hope their issue was resolved!':
    '你的一位客户提交的工单 #8191，在三天无人回复后被标记为“已解决”。希望对方的问题已经解决了！',
  "Original message, for the record:\n> The app is slow. Not broken, just slow, like it's thinking about each click very carefully. I appreciate thoughtfulness in people. Less so in apps.":
    '原始消息，存档备查：\n> 应用很慢。没坏，就是慢，像是在非常认真地思考每一次点击。我欣赏人做事深思熟虑。应用就不必了。',
  'The customer may reopen the ticket, and probably will.': '客户可以重新打开工单，而且多半会。',
  'We take your feedback seriously,\n{0}': '我们认真对待你的反馈，\n{0}',
  'A very kind complaint': '一封非常客气的投诉',
  "Passing this one along from {0}. It's the nicest complaint we've had all month:":
    '转来一封 {0} 的反馈。这是我们整个月收到的最客气的投诉：',
  "> Hello! I don't want to be a bother. The app has gotten slow lately and I wondered if it was me. I restarted my router, my laptop, and my phone, twice. It's still slow. No rush! (A little rush.)":
    '> 你好！不想给你们添麻烦。最近应用变慢了，我还以为是自己的问题。我把路由器、笔记本和手机都重启了两遍。还是慢。不着急！（有一点点急。）',
  'Our dashboard says we typically reply in a few days. We suggest you reply sooner.':
    '我们的仪表盘显示，通常回复需要几天。建议你早点回复。',
  'Warm regards,\n{0}': '诚挚问候，\n{0}',
}
