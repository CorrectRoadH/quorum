import type { AdviceLetters } from './letter.ts'

/* ==========================================================================
   Monitoring advice (GDD 18): the pager, the dashboard, and the error
   tracker. Every letter must read right from any sender in the pool, so the
   name is always `${from}`.
   ========================================================================== */

export const ALERTS: Pick<
  AdviceLetters,
  | 'workers'
  | 'workers-pool'
  | 'connections'
  | 'throughput'
  | 'limit'
  | 'failed'
  | 'restarting'
  | 'slow-query-fix'
  | 'slow-query'
  | 'failing-writes'
  | 'failing'
  | 'stranded'
> = {
  workers: [
    ({ from, node }) => ({
      subject: `[TRIGGERED] ${node}: all workers busy`,
      body: `ALERT TRIGGERED\n\nService: ${node}\nCondition: every worker busy\nCause: mostly waiting on the database\nPool setting: none on this runtime\nSuggested action: make the database answer faster\n\nThis alert will keep firing until a worker is free. ${from} will keep telling you.`,
    }),
    ({ from, node }) => ({
      subject: `Your ${node} workers are all on hold`,
      body: `Hi there,\n\nQuick one from ${from}. Every worker on ${node} is busy, and when we looked closer, most of them aren't working at all. They're waiting on the database, like a whole office stuck on hold with the same call centre.\n\nThis runtime has no pool size to turn up, so adding seats won't help. The honest fix is to make the database answer faster.\n\nCheers,\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `New issue: ${node} has no free workers`,
      body: `New issue in ${node}\n\nWorkerPoolExhausted: no free worker to take the request\n\nWhat we see: every worker is busy, and most of that time is spent waiting on the database.\n\nWhat won't help: there's no pool knob on this runtime.\nWhat will: make the database answer faster.\n\nWe saw it first. Now you've seen it too.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `Panel annotation: ${node} workers pinned`,
      body: `Your ${node} worker panel has been a flat line at the very top for a while now. Flat at the top is just as bad as flat at the bottom.\n\nWe added an annotation: "every worker busy, mostly waiting on the database."\n\nThere's no pool setting to raise on this runtime. Make the database answer faster and the line will come back down.\n\n- ${from}`,
    }),
    ({ from, node }) => ({
      subject: `ESCALATED: ${node} is out of workers`,
      body: `It's late. We know. You are receiving this because you are awake.\n\n${node} has no idle workers left. They're mostly sitting on open database calls, waiting for answers.\n\nBefore you go looking for a pool size: this runtime doesn't have one. The fix is upstream. Make the database answer faster.\n\nGo back to sleep after. We'll check in.\n${from} on-call`,
    }),
  ],

  'workers-pool': [
    ({ from, node, runtime }) => ({
      subject: `[TRIGGERED] ${node}: ${runtime} pool full`,
      body: `ALERT TRIGGERED\n\nService: ${node}\nRuntime: ${runtime}\nCondition: every worker busy\nMostly: waiting\n\nRemediation (pick one):\n1. Raise the pool\n2. Speed up the database\n\nIf nobody responds, this alert escalates to whoever is awake. Statistically, that's you.\n- ${from}`,
    }),
    ({ from, node, runtime }) => ({
      subject: `Every ${runtime} worker on ${node} is busy`,
      body: `Hello from ${from},\n\nEvery ${runtime} worker on ${node} is taken. Most of them are just waiting, which is the most expensive kind of busy.\n\nYou have two honest options. Raise the pool so more requests can wait at once, or speed up the database so nobody waits as long.\n\nHappy to keep watching either way.\n\nBest,\nThe ${from} team`,
    }),
    ({ from, node, runtime }) => ({
      subject: `Regression: ${runtime} pool exhausted on ${node}`,
      body: `Issue: PoolExhausted (${runtime})\nWhere: ${node}\nFirst seen: just now\nLast seen: also just now\n\nEvery worker in the ${runtime} pool is busy, and most are waiting rather than working.\n\nSuggested fixes:\n- Raise the pool\n- Speed up the database\n\nMark as resolved when the pool has room. We'll tell you if it comes back. We always do.\n${from}`,
    }),
    ({ from, node, runtime }) => ({
      subject: `${node}: your ${runtime} line hit the ceiling`,
      body: `Hey,\n\nThe "busy ${runtime} workers" panel for ${node} has climbed to the top and stayed there. No more room under the ceiling.\n\nThe twist: they're mostly waiting, not computing.\n\nSo either raise the pool, or speed up the database. Both bring the line down. One of them also makes everything else faster, but we're a dashboard, not your mother.\n\n- ${from}`,
    }),
    ({ from, node, runtime }) => ({
      subject: `Timeline: ${runtime} workers on ${node}`,
      body: `Incident timeline, ${node}\n\n- Requests arrive. ${runtime} workers pick them up.\n- Workers ask the database. Workers wait.\n- More requests arrive. More workers wait.\n- Every worker is now busy waiting. Alert fires.\n- ${from} emails you. (You are here.)\n\nNext step: raise the pool, or speed up the database.`,
    }),
  ],

  connections: [
    ({ from }) => ({
      subject: `[TRIGGERED] Postgres: too many connections`,
      body: `ALERT TRIGGERED\n\nComponent: Postgres\nError: refusing new connections\nCause: too many app processes holding pools\n\nRemediation:\n- Shrink pools, or\n- Add a Connection Pooler\n\nThis page will repeat until acknowledged by a human, a pet, or a cat walking across the keyboard.\n${from}`,
    }),
    ({ from }) => ({
      subject: `Postgres has stopped answering the door`,
      body: `Hi,\n\nPostgres has started refusing connections. Not because it's busy thinking, but because too many app processes are each holding a pool of connections, and the guest list is full.\n\nTwo ways out: shrink the pools, so each process holds fewer, or add a Connection Pooler, so they all share.\n\nWarmly,\nThe ${from} team\n\nP.S. Opening more connections is not one of the two ways.`,
    }),
    ({ from }) => ({
      subject: `New issue: FATAL too many clients`,
      body: `New issue\nFATAL: sorry, too many clients already\n\nPostgres is refusing connections. Each app process brings its own pool, and together they've used up every slot.\n\nFix: shrink pools, or add a Connection Pooler.\n\nThis issue is assigned to you, because there's no one else. Welcome to startups.\n- ${from}`,
    }),
    ({ from }) => ({
      subject: `Weekly digest: one panel you should look at`,
      body: `Your ${from} digest\n\nMost panels look fine this week. One does not.\n\nPostgres connections: full. New ones are being refused, because too many app processes each hold their own pool.\n\nWhat to try: shrink the pools, or add a Connection Pooler in front of Postgres so the processes share.\n\nThat's the digest. Short, because the rest is boring, and boring is good.`,
    }),
    ({ from }) => ({
      subject: `Re: Re: Re: Postgres connections`,
      body: `Hello again.\n\nWe've mentioned this before, and we'll mention it again: Postgres is turning connections away. Too many app processes are holding pools, and there are no seats left.\n\nThe fix hasn't changed. Shrink pools, or add a Connection Pooler.\n\nYou are receiving this because you are awake, and Postgres is not taking calls.\n${from}`,
    }),
  ],

  throughput: [
    ({ from, node }) => ({
      subject: `[TRIGGERED] ${node}: past throughput`,
      body: `ALERT TRIGGERED\n\nService: ${node}\nCondition: requests above its throughput\nStatus: this is the limit\n\nThere's no setting in this alert to make the limit go away. ${node} is doing all it can, and more is arriving.\n\n${from}\nYou are receiving this because you are awake.`,
    }),
    ({ from, node }) => ({
      subject: `${node} is doing its best. It isn't enough.`,
      body: `Hi,\n\nA gentle heads-up from ${from}. ${node} is being asked for more than its throughput. It's not broken and it's not misconfigured. It's simply at the limit, and the extra has nowhere to fit.\n\nWe thought you'd want to know before the users tell you.\n\nTake care,\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `Graph annotation: ${node} hit its limit`,
      body: `We drew a red line on the ${node} panel. Your traffic line crossed it.\n\nAnnotation: "past throughput. This is the limit."\n\nA flat top on a graph usually means a ceiling, and this is one. ${node} can't go faster than this.\n\n- ${from}`,
    }),
    ({ from, node }) => ({
      subject: `Issue: ${node} over capacity`,
      body: `Issue: ThroughputExceeded\nWhere: ${node}\nTrend: escalating\n\nMore requests are reaching ${node} than it can push through. That's its limit, not a bug we can point at a line of code for.\n\nWe'll keep counting. Counting is what we do.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `Timeline: ${node} reaches the limit`,
      body: `Incident timeline\n\n- Traffic grows. ${node} keeps up.\n- Traffic grows more. ${node} keeps up, barely.\n- Traffic passes the throughput of ${node}.\n- ${node} hits the limit and stays there.\n- ${from} writes this email.\n\nRoot cause: ${node} is past its throughput. That's the limit.`,
    }),
  ],

  limit: [
    ({ from, node }) => ({
      subject: `Bottleneck: ${node}`,
      body: `ALERT\n\nWhat limits the Design right now: ${node}\nEverything else: has room to spare\n\nNo further detail in this alert. ${node} is the narrow part of the pipe, and the rest of the Design waits on it.\n\n- ${from}`,
    }),
    ({ from, node }) => ({
      subject: `If you only look at one thing today`,
      body: `Hi,\n\nWe watch a lot of graphs on your behalf at ${from}, and today they all agree on something: ${node} is what's limiting the Design right now.\n\nEvery other part is waiting on it. If you're wondering where to look first, look there.\n\nAll the best,\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `${node} is the slowest link`,
      body: `Hey, it's ${from}.\n\nWe lined up every panel side by side. ${node} is the one holding the others back. That's what limits the Design right now.\n\nNo flatline, no fire. Just the narrowest point in the whole thing.\n\nThought you'd want the name.`,
    }),
    ({ from, node }) => ({
      subject: `Top issue this hour: ${node}`,
      body: `Top issue\n\nLimitingFactor: ${node}\nImpact: the whole Design\nSeen: every time we check\n\nRight now, ${node} sets the pace for everything. When it's the slowest, the Design is only as fast as ${node}.\n\n${from}\nWe saw it first. You saw it last.`,
    }),
    ({ from, node }) => ({
      subject: `[ESCALATED] Design limited by ${node}`,
      body: `ESCALATED\n\nThis alert was raised, ignored by nobody, and escalated anyway, because that's how escalation works.\n\nFinding: ${node} is what limits the Design right now.\n\nThat's the whole page. You are receiving this because you are awake.\n${from}`,
    }),
  ],

  failed: [
    ({ from, node }) => ({
      subject: `[TRIGGERED] ${node} is down`,
      body: `ALERT TRIGGERED\n\nService: ${node}\nStatus: FAILED\n\nRemediation:\n1. Select ${node} and click Replace, or\n2. Wait for the provider\n\nUse Show on Board to find it.\n\nThis page will escalate until somebody does one of the above. You are receiving this because you are awake.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `${node} has stopped responding`,
      body: `Hi,\n\nSorry to be the bearer of this one. ${node} has failed. Nothing is coming back from it, and our panel for it has gone flat. That is not good.\n\nYou can select it and click Replace to put a fresh one in its place, or wait for the provider to bring it back.\n\nShow on Board will take you straight there.\n\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `New issue: ${node} unreachable`,
      body: `New issue: NodeFailed\nWhere: ${node}\nFirst seen: moments ago\n\nEvery request to ${node} is failing, because ${node} itself has failed.\n\nFix it yourself: select it and click Replace.\nOr don't: wait for the provider.\n\nShow on Board is attached.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `Timeline: ${node} failure`,
      body: `Incident timeline\n\n- ${node} is fine.\n- ${node} is not fine.\n- ${node} has failed.\n- ${from} notices, and writes to you.\n- You read this. (You are here.)\n- Next: select it and click Replace, or wait for the provider.\n\nShow on Board below.`,
    }),
    ({ from, node }) => ({
      subject: `Flatline on ${node}`,
      body: `Your ${node} panel went flat a moment ago. Not a calm flat. A failed flat.\n\nTwo ways forward. Select it and click Replace if you'd rather not wait, or wait for the provider if you trust them more than we do.\n\nHit Show on Board to see where it sits.\n\n- ${from}`,
    }),
  ],

  restarting: [
    ({ from, node }) => ({
      subject: `[INFO] ${node} restarting`,
      body: `NOTICE\n\nService: ${node}\nStatus: restarting\nImpact: requests to it fail until it's up\nAction required: none\n\nYes, we paged you for something that needs no action. You are receiving this because you are awake.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `${node} is having a little lie-down`,
      body: `Hi,\n\nNothing for you to do here, just keeping you in the loop. ${node} is restarting. While it is, requests to it will fail. Once it's back up, they'll go through again.\n\nNo action needed. Show on Board is there if you want to watch it come back.\n\nBest,\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `Spike in errors from ${node} (expected)`,
      body: `Issue: errors from ${node}\nStatus: expected\n\n${node} is restarting, so requests to it fail until it's up. The errors stop on their own.\n\nNo action needed. We're telling you anyway, because telling you is our whole personality.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `Annotation: ${node} restart`,
      body: `We've marked the ${node} panel with an annotation: "restarting."\n\nThe dip you'll see is requests failing while it comes back. It's temporary, and it ends when ${node} is up.\n\nNo action needed. Show on Board if you'd like to keep an eye on it.\n\n- ${from}`,
    }),
    ({ from, node }) => ({
      subject: `Timeline: ${node} reboot`,
      body: `Timeline\n\n- ${node} begins restarting.\n- Requests to ${node} fail.\n- You get this email.\n- ${node} comes back up.\n- Requests succeed again.\n\nYour part in this timeline: none. No action needed.\n\n${from}`,
    }),
  ],

  'slow-query-fix': [
    ({ from }) => ({
      subject: `[TRIGGERED] Database: full table scans`,
      body: `ALERT TRIGGERED\n\nComponent: Database\nCondition: query without an index\nEffect: whole tables scanned on every call\n\nRemediation: select the Database and click Add index.\n\nThis alert is easy to fix and hard to ignore. Please do the first one.\n${from}`,
    }),
    ({ from }) => ({
      subject: `Your Database is reading every page`,
      body: `Hi,\n\nOne of your queries has no index, so every time it runs the Database scans whole tables to find what it needs. Imagine looking up a word by reading the dictionary from "aardvark."\n\nGood news: this one's in your hands. Select the Database and click Add index.\n\nThanks,\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `New issue: SlowQuery (missing index)`,
      body: `New issue: SlowQuery\nWhere: Database\nCause: no index\nSymptom: whole-table scans\nSeen: every time the query runs\n\nResolution: select the Database and click Add index.\n\nResolve it and we'll stop counting.\n${from}`,
    }),
    ({ from }) => ({
      subject: `That sawtooth on the Database panel`,
      body: `Hey, ${from} here.\n\nThe Database panel has a shape we know well. It's a query with no index, so the Database scans whole tables every time.\n\nThe fix is one click away: select the Database and click Add index.\n\nAfter that, the panel should get boring. We like boring.`,
    }),
    ({ from }) => ({
      subject: `Re: the slow query (3 a.m. edition)`,
      body: `It's ${from}. You are receiving this because you are awake.\n\nA query has no index. The Database answers it the hard way: by scanning whole tables.\n\nYou can fix it before you go back to bed. Select the Database and click Add index.\n\nGoodnight, probably.`,
    }),
  ],

  'slow-query': [
    ({ from }) => ({
      subject: `[TRIGGERED] Database: slow query`,
      body: `ALERT TRIGGERED\n\nComponent: Database\nCause: query with no index\nEffect: whole tables scanned\nAdd index: not available yet\n\nRemediation:\n- Research Query analysis, or\n- Put a Cache in front\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `A query is reading the whole library`,
      body: `Hi,\n\nOne of your queries has no index, so the Database scans whole tables to answer it. That gets slow fast.\n\nYou can't add an index yet. Until you can, there are two routes: research Query analysis, so you can add one later, or put a Cache in front, so the Database is asked less often.\n\nAll the best,\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `New issue: SlowQuery (no index)`,
      body: `New issue: SlowQuery\nWhere: Database\nCause: missing index, whole-table scans\n\nWorkarounds while indexing is out of reach:\n1. Research Query analysis\n2. Put a Cache in front\n\nWe'll keep this issue open. We're very good at keeping issues open.\n${from}`,
    }),
    ({ from }) => ({
      subject: `Weekly digest: one slow query`,
      body: `Your ${from} digest\n\nOne item this week. A query has no index, so the Database scans whole tables to answer it, and the panel shows it.\n\nYou can't add an index yet. Your options for now: research Query analysis, or put a Cache in front of the Database so fewer questions reach it.\n\nThat's it. See you next digest.`,
    }),
    ({ from }) => ({
      subject: `Timeline: the slow query`,
      body: `Timeline\n\n- A query arrives with no index to use.\n- The Database scans whole tables.\n- It does it again. And again.\n- ${from} alerts you.\n\nNext steps, since an index isn't an option yet:\n- Research Query analysis\n- Put a Cache in front`,
    }),
  ],

  'failing-writes': [
    ({ from, kind }) => ({
      subject: `[TRIGGERED] ${kind} requests failing`,
      body: `ALERT TRIGGERED\n\nRequests: ${kind}\nStatus: failing\nReason: writes need the primary Database\nNote: a replica can't take them\n\nCheck where your ${kind} requests are going. They must reach the primary.\n\nYou are receiving this because you are awake.\n${from}`,
    }),
    ({ from, kind }) => ({
      subject: `Your ${kind} requests are bouncing`,
      body: `Hi,\n\n${kind} requests are failing. Writes have to land on the primary Database, and a replica can't take them, however politely they're asked.\n\nIf your ${kind} requests are heading anywhere but the primary, that's why.\n\nKind regards,\nThe ${from} team`,
    }),
    ({ from, kind }) => ({
      subject: `New issue: ReadOnlyReplica on ${kind}`,
      body: `New issue\nError: cannot execute ${kind} on a read-only replica\n\n${kind} requests are failing. Writes need the primary Database. A replica can't take them, no matter how often they're retried.\n\nSeen: every single ${kind}.\n${from}`,
    }),
    ({ from, kind }) => ({
      subject: `Your ${kind} success panel hit zero`,
      body: `The successful ${kind} requests panel has gone flat. Flat at zero. That is not good.\n\nWe annotated it: "${kind} failing. Writes need the primary Database; a replica can't take them."\n\nMake sure ${kind} reaches the primary and the line will come back.\n\n- ${from}`,
    }),
    ({ from, kind }) => ({
      subject: `Timeline: failing ${kind}s`,
      body: `Incident timeline\n\n- A ${kind} request goes out.\n- It meets a replica.\n- The replica can't take writes.\n- The ${kind} fails.\n- Repeat.\n\nRoot cause: writes need the primary Database. A replica can't take them.\n\n${from}`,
    }),
  ],

  failing: [
    ({ from, kind }) => ({
      subject: `[TRIGGERED] ${kind} requests failing`,
      body: `ALERT TRIGGERED\n\nRequests: ${kind}\nStatus: failing\nSuggested action: check the links\n\nThis alert will escalate until ${kind} requests succeed again or the sun comes up, whichever happens first. Probably the sun.\n${from}`,
    }),
    ({ from, kind }) => ({
      subject: `${kind} requests aren't getting through`,
      body: `Hi there,\n\n${kind} requests are failing, and they're not failing quietly. Somewhere between where they start and where they should end up, the path isn't right.\n\nOur advice: check the links. Follow a ${kind} request from start to finish and see where it falls off.\n\nCheers,\nThe ${from} team`,
    }),
    ({ from, kind }) => ({
      subject: `New issue: ${kind} failures`,
      body: `New issue: RequestFailed (${kind})\nSeen: again\nUsers affected: the ones sending ${kind}\n\nSuggested fix: check the links.\n\nWe saw it first. You saw it last. Now you've seen it twice.\n${from}`,
    }),
    ({ from, kind }) => ({
      subject: `Your ${kind} graph has a hole in it`,
      body: `The ${kind} panel looks wrong. Requests are going in and failures are coming out.\n\nWe can't tell you which link is to blame from up here, but that's where to look. Check the links.\n\n- ${from}`,
    }),
    ({ from, kind }) => ({
      subject: `Timeline: ${kind} outage`,
      body: `Timeline\n\n- ${kind} requests start failing.\n- They keep failing.\n- ${from} raises this alert.\n- You check the links. (Recommended next step.)\n- ${kind} requests succeed again. (Hopefully.)\n\nYou are receiving this because you are awake.`,
    }),
  ],

  stranded: [
    ({ from, node }) => ({
      subject: `[TRIGGERED] ${node}: requests stranded`,
      body: `ALERT TRIGGERED\n\nService: ${node}\nCondition: requests with nowhere to go\n\nRemediation: link ${node} to something that takes them.\n\nShow on Board is attached. You are receiving this because you are awake.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `${node} is holding requests it can't pass on`,
      body: `Hi,\n\n${node} has requests in hand and nowhere to send them. It's a bit like a postman with a full bag and no addresses.\n\nThe fix: link it to something that takes them.\n\nShow on Board will point you to ${node}.\n\nBest wishes,\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `New issue: NoRoute from ${node}`,
      body: `New issue: NoRoute\nWhere: ${node}\nMessage: request has nowhere to go\nSeen: on every one of them\n\nFix: link it to something that takes them.\n\nShow on Board to find ${node}.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `Arrows in, no arrows out: ${node}`,
      body: `Hey, it's ${from}.\n\nLooking at the ${node} panel, requests arrive and then just sit there. They have nowhere to go next.\n\nLink ${node} to something that takes them, and the panel should start moving again.\n\nShow on Board will take you right to it.`,
    }),
    ({ from, node }) => ({
      subject: `Timeline: stranded at ${node}`,
      body: `Incident timeline\n\n- Requests reach ${node}.\n- ${node} looks for somewhere to send them.\n- There isn't anywhere.\n- The requests wait. And wait.\n- ${from} emails you.\n\nNext step: link ${node} to something that takes them. Show on Board is below.`,
    }),
  ],
}
