import type { EventLetters } from './letter.ts'

/* ==========================================================================
   Step events (GDD 18): Mail about something that just happened in the
   Design. A repeat of the same event joins its Thread, so some letters read
   as a follow-up.
   ========================================================================== */

/** A teammate signs with their first name. */
const first = (from: string): string => from.split(' ')[0] ?? from

export const EVENTS: EventLetters = {
  'incident-instance': [
    ({ from, node }) => ({
      subject: `[TRIGGERED] 1 incident: ${node} is down`,
      body: `Hello,\n\nYou have 1 triggered incident assigned to you.\n\nIncident: ${node} failed\nStatus: TRIGGERED\nUrgency: High\nAssigned to: you (you are the whole rotation)\n\nResolution: select ${node} and click Replace. It will not replace itself, however long you stare at it.\n\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `${node}'s graph has gone flat`,
      body: `Hi there,\n\nThe line for ${node} went flat a moment ago. Flat is not calm. Flat means the node failed and is serving nothing.\n\nThe fix is short: select ${node} and click Replace. A fresh one takes its place.\n\nWe'll keep watching the line so you don't have to. (You will anyway.)\n\n— ${from}`,
    }),
    ({ from, node }) => ({
      subject: `We saw ${node} fall over. Now you have too.`,
      body: `${node} failed. Every request sent its way is now an error, and we've counted all of them.\n\nWhat to do:\n1. Select ${node}.\n2. Click Replace.\n3. Watch the count stop climbing.\n\nFirst seen: just now\nLast seen: still now\n\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `${node} failed again`,
      body: `Hi,\n\nIf this feels familiar, it's because ${node} has failed again. Hardware is mortal, and an instance is just hardware with a nicer name.\n\nSame drill as before: select ${node} and click Replace. Nothing about the fix has changed, which is honestly the most comforting part of this email.\n\nRegards,\nOn-call notifications, ${from}`,
    }),
    ({ from, node }) => ({
      subject: `ESCALATED: ${node} is down`,
      body: `Escalation level 1 of 1\n\nThis incident has been escalated to the next person on the rotation. The next person on the rotation is you.\n\n${node} has failed and is not serving traffic. To resolve it, select ${node} and click Replace.\n\nNo one else is coming. We checked.\n\n${from} Incident Response`,
    }),
  ],

  'incident-slow-query': [
    ({ from }) => ({
      subject: `New issue: slow query, full table scan`,
      body: `New issue in production\n\nSlowQueryWarning: a new query has no index\nEvents: every read\nFirst seen: a moment ago\n\nEvery read now scans the whole table, row by row, like someone looking for their keys in every drawer of the house. Reads that took a blink now take a while, and the Database is doing all of it.\n\n— ${from}`,
    }),
    ({ from }) => ({
      subject: `Database read latency is climbing`,
      body: `Hello,\n\nYour Database latency panel is going up and to the right. On a revenue chart that would be good news. Here it isn't.\n\nCause: a new query has no index, so every read scans the table.\n\nKind regards,\nThe ${from} alerting team`,
    }),
    ({ from }) => ({
      subject: `[TRIGGERED] Slow query on the Database`,
      body: `Incident: slow query\nService: Database\nUrgency: High\n\nSummary: a new query shipped without an index. Each read now scans the table end to end instead of jumping to the row it wants. The scans pile up, and everything waiting on the Database waits longer.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Re: slow query (it's back)`,
      body: `Hi again,\n\nAnother query without an index. Same story as last time: there's nothing to look rows up by, so every read scans the table from the first row to the last.\n\nSomewhere a Database is reading the phone book to find one number. It's yours.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Your table is being read cover to cover`,
      body: `Hey,\n\nQuick heads-up: a new query arrived without an index. That means no shortcuts. Every read walks the full table, and the Database's day just got a lot longer.\n\nReads stay slow until this is over.\n\nCheers,\n${from}\n\nP.S. "It was fast on my laptop" is true. Your laptop has eleven rows.`,
    }),
  ],

  'incident-poison': [
    ({ from }) => ({
      subject: `[TRIGGERED] Poison message in the queue`,
      body: `Incident: poison message\nUrgency: High\n\nOne task keeps failing. The workers keep retrying it instead of draining the queue, so the line behind it isn't moving.\n\nThe task is not going to succeed on attempt 400. It didn't on attempt 3.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `The same task failed. And failed. And failed.`,
      body: `Hi,\n\nWe've grouped these into one issue because they're all the same: one task, failing, over and over.\n\nWhat's happening: your workers retry the failing task instead of draining the queue. That's a poison message. Everything queued behind it waits.\n\nEvents: still counting\nUsers affected: everyone in line\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Queue depth: up. Work done: flat.`,
      body: `Hello,\n\nTwo of your panels disagree. Queue depth keeps rising. Work completed has gone flat.\n\nThe reason is a single task that keeps failing. The workers retry it again and again rather than draining the queue, so new work just stacks up.\n\nThe graph isn't broken. The queue is.\n\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `Re: poison message, again`,
      body: `Hi,\n\nA task that can't succeed is back on the menu. The workers are retrying it instead of working through the queue, which is loyal of them but not useful.\n\nThe queue fills up while they try.\n\nBest,\n${from}`,
    }),
    ({ from }) => ({
      subject: `Incident opened: queue not draining`,
      body: `Dear on-call engineer,\n\nAt the time of writing, a task in your queue has failed every attempt. Workers continue to retry it in preference to draining the queue. In the industry this is known as a poison message; in the office it is known as "why is everything stuck".\n\nThis notice will be followed by more notices.\n\nSincerely,\n${from} Incident Management`,
    }),
  ],

  // Only the edge network writes these: Cloudscare sees the flood before anyone else does.
  'incident-ddos': [
    ({ from }) => ({
      subject: `HTTP DDoS attack alert: your edge`,
      body: `HTTP DDoS Attack Alert\n\nDescription: a flood of junk traffic is hitting your edge.\nDetected: just now\nAttack type: HTTP flood, artisanal\nMaximum rate: yes\nAttack target: you\nRule that matched: "Requests that want nothing"\n\nWe are standing between the flood and your Design. We are very large, and we would like you to remember that at renewal time.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Checking if your traffic is human...`,
      body: `Checking if your traffic is human. This may take a few seconds.\n\n...\n\nIt is not human.\n\nA flood of junk traffic is hitting your edge. We have met botnets before, but this one has range: smart fridges, a parking meter, and at least one baby monitor, all asking for your home page at once.\n\nPlease stand by.\n\nThe ${from} Trust & Safety team`,
    }),
    ({ from }) => ({
      subject: `Attention Required! Your edge is under attack`,
      body: `Attention Required!\n\nWhat happened?\nA flood of junk traffic is hitting your edge. None of these requests want to buy anything. They only want to arrive, all of them, at the same time.\n\nWhat can I do?\nIf you are a visitor: nothing. You are probably a toaster.\nIf you own the site: watch the Board and see how your Design takes a wave this size.\n\nRay ID: 8b0f13c7a2e9\nPerformance & security by ${from}`,
    }),
    ({ from }) => ({
      subject: `Sorry, they have been blocked (not you)`,
      body: `Sorry, you have been blocked.\n\nNot you. Them. A flood of junk traffic is hitting your edge, and we are showing them this page a few million times a minute.\n\nSomewhere in the queue are your real users, on their ninth picture of traffic lights. They would like you to know they found every bicycle.\n\nRegards,\nThe ${from} Edge`,
    }),
    ({ from }) => ({
      subject: `Re: the flood (it is still flooding)`,
      body: `Hi again,\n\nThe junk traffic at your edge has not let up. If anything, it brought friends.\n\nOur network handles a very large share of the internet, and today a worrying part of that share is about you. Congratulations on being popular with the wrong crowd.\n\nStill standing,\n${from}\n\nP.S. If half the internet goes dark later today, that one is on us, not them.`,
    }),
  ],

  'incident-stampede': [
    ({ from }) => ({
      subject: `[TRIGGERED] Cache stampede`,
      body: `Incident: cache stampede\nServices: Cache, Database\nUrgency: High\n\nThe Cache restarted empty. Every request is now a miss, and every miss goes straight to the Database. All at once. Together. Like a herd.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Cache hit rate: 0%. Database: not okay.`,
      body: `Hello,\n\nYour cache hit rate fell to zero the moment the Cache restarted. It came back empty, with nothing in it to serve.\n\nSo every miss goes to the Database, and the Database panel now looks like a cliff face drawn upside down.\n\nBrace yourself.\n\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `Database load jumped after a Cache restart`,
      body: `Hi,\n\nDatabase load just jumped. We traced it back: the Cache restarted empty, and now every request misses and runs to the Database for the answer.\n\nThis is called a cache stampede. Your Database is the thing being stampeded.\n\nFirst seen: right after the restart\n\n— ${from}`,
    }),
    ({ from }) => ({
      subject: `Re: cache stampede (another one)`,
      body: `Hi again,\n\nThe Cache restarted empty again, and the herd is back: every miss heading to the Database at the same time.\n\nNothing personal against your Database. It's just the only one left who knows the answers.\n\nBest,\n${from}`,
    }),
    ({ from }) => ({
      subject: `Your Cache woke up with amnesia`,
      body: `Good morning (it's always morning somewhere on call),\n\nThe Cache restarted, and it came back remembering nothing. That's normal for a cache. What isn't fun is what happens next: every request misses, and every miss goes to the Database.\n\nPicture a library where the front desk forgot every answer, so everyone walks to the archive at once. The archive is your Database.\n\nRegards,\n${from} Incident Response`,
    }),
  ],

  'incident-zone': [
    ({ from, zone }) => ({
      subject: `[TRIGGERED] Zone ${zone} is down`,
      body: `Incident: zone outage\nZone: ${zone}\nUrgency: High\nStatus: TRIGGERED\n\nZone ${zone} is down. Everything you run there is unreachable until it comes back.\n\nYou are hearing this before the status page says anything. That's the service.\n\n${from}`,
    }),
    ({ from, zone }) => ({
      subject: `Every panel for zone ${zone} just went flat`,
      body: `Hi,\n\nA whole row of your dashboard flatlined at once. That isn't a coincidence: zone ${zone} is down.\n\nOne flat graph is bad luck. A zone of them is geography.\n\nKind regards,\nThe ${from} team`,
    }),
    ({ from, zone }) => ({
      subject: `Errors from everything in zone ${zone}`,
      body: `Hi,\n\nWe got a burst of errors from every node in zone ${zone} at the same moment, so we checked: the zone itself is down.\n\nThis is not a bug in your code. This time.\n\nWe saw it first. You're seeing it now.\n\n— ${from}`,
    }),
    ({ from, zone }) => ({
      subject: `Zone ${zone} is down again`,
      body: `Hey,\n\nZone ${zone} has gone down again. Same zone, same outage, same sinking feeling.\n\nWe'd tell you the provider's status page still shows all green, but you've probably guessed that already.\n\nBest,\n${from}`,
    }),
    ({ from, zone }) => ({
      subject: `Availability event: zone ${zone}`,
      body: `AVAILABILITY EVENT\n\nAffected zone: ${zone}\nState: down\nAffected resources: everything in zone ${zone}\n\nA zone outage is in progress. Resources in the other zones are not affected by this event. Resources in zone ${zone} are very affected by this event.\n\nUpdates will follow when there is something to update.\n\n${from} Incident Response`,
    }),
  ],

  'incident-breach': [
    ({ from }) => ({
      subject: `[SEV1] Data breach: an advisory you did not patch`,
      body: `Incident: data breach\nUrgency: Critical\n\nSomeone used a vulnerability that was disclosed to you, with a deadline, and the deadline passed. Customer data left the building. Users are leaving after it.\n\nThe ticket is gone from the backlog. The consequence is not.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `We told you so (it was in the backlog)`,
      body: `Hi,\n\nThe advisory that was on your backlog, in red, got exploited. Data is out. A share of your Users have read the news and are going elsewhere.\n\nThere is no button for this one. It will pass. Patch the next one on time.\n\nSincerely,\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `Breach confirmed`,
      body: `Confirmed: the vulnerability on your overdue ticket was exploited.\n\nImpact: customer data, Users, and trust, in that order.\nStatus: ongoing\nRoot cause: a ticket that was not built before its deadline\n\n${from}`,
    }),
  ],

  'incident-psp': [
    ({ from }) => ({
      subject: `[TRIGGERED] Payment Provider down`,
      body: `Incident: payment provider outage\nService: Payments\nUrgency: High\n\nThe Payment Provider is down, so checkouts are failing. Customers are filling their carts and leaving with nothing.\n\nThis one isn't your code. It's still your revenue.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Checkouts have gone flat`,
      body: `Hi,\n\nYour successful checkouts panel just went flat. Traffic is still there and carts are still filling. The money isn't arriving.\n\nThe Payment Provider is down, so every checkout fails at the very last step.\n\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `PaymentError: provider unavailable`,
      body: `Hi,\n\nNew issue: every checkout is failing with the same error. The Payment Provider is down and isn't answering.\n\nUsers affected: everyone who tried to pay you\nFirst seen: just now\n\nWe know. It's the one error you wanted fewer of.\n\n— ${from}`,
    }),
    ({ from }) => ({
      subject: `Re: Payment Provider down (again)`,
      body: `Hello again,\n\nThe Payment Provider is down again, and checkouts are failing again. Customers want to give you money. The pipe between them and you isn't working.\n\nWe'll let you know when it's over.\n\nRegards,\n${from}`,
    }),
    ({ from }) => ({
      subject: `Your customers are trying to pay you`,
      body: `Hi,\n\nIt's a lovely problem to describe and a terrible one to have: people want to buy, and they can't. The Payment Provider is down, so checkouts fail.\n\nNothing on your side caused it. Nothing on your side is earning while it lasts, either.\n\nSorry to be the one,\n${from}`,
    }),
  ],

  resolved: [
    ({ from, incident }) => ({
      subject: `[RESOLVED] ${incident}`,
      body: `Hello,\n\nThe following incident has been resolved:\n\n${incident}\nStatus: RESOLVED\nDuration: long enough\n\nYou may now go back to whatever you were doing before. We don't remember what it was either.\n\n${from}`,
    }),
    ({ from, incident }) => ({
      subject: `[OK] ${incident} has cleared`,
      body: `Hi,\n\nGood news, for once: ${incident} is over. The graphs are back to the shapes you like. Not flat, not cliffs, just lines.\n\nWe'll keep watching. You should sleep.\n\nThe ${from} team`,
    }),
    ({ from, incident }) => ({
      subject: `Resolved: ${incident}`,
      body: `Hi,\n\nWe've marked ${incident} as resolved. No new events since it ended.\n\nIf it comes back, we'll flag it as a regression and tell you right away. We always see it first.\n\n— ${from}`,
    }),
    ({ from, incident }) => ({
      subject: `Re: ${incident} — all clear`,
      body: `All clear.\n\n${incident} is over. Nothing left to do on this one but breathe out.\n\nThanks for sticking with it. Most people would have put their phone in a drawer by now.\n\n${from}`,
    }),
    ({ from, incident }) => ({
      subject: `Incident closed: ${incident}`,
      body: `INCIDENT CLOSED\n\nIncident: ${incident}\nState: resolved\nPostmortem action items: none listed\n\nThis incident has ended.\n\nThank you for your patience. Your users thank you less, but they're back.\n\n${from} Incident Response`,
    }),
  ],

  'resolved-action': [
    ({ from, incident, action }) => ({
      subject: `[RESOLVED] ${incident} + 1 action item`,
      body: `Hello,\n\n${incident} has been resolved.\n\nPostmortem action item:\n- Research ${action}\n\nUntil ${action} is researched, ${incident} is twice as likely to happen again. We'd say "no pressure", but that would be a lie.\n\n${from}`,
    }),
    ({ from, incident, action }) => ({
      subject: `${incident} is over. Here's the homework.`,
      body: `Hi,\n\nThe graphs have recovered and ${incident} is over.\n\nThe postmortem came back with one action item: research ${action}. Until that's done, this incident is twice as likely to happen. Your dashboards will see it coming. They just can't stop it.\n\nThe ${from} team`,
    }),
    ({ from, incident, action }) => ({
      subject: `Resolved, with a note: ${incident}`,
      body: `Hi,\n\nMarked as resolved: ${incident}.\n\nWe've attached the postmortem's one action item: research ${action}.\n\nRegression risk: until ${action} is researched, ${incident} is twice as likely. We'll be here to see it first.\n\n— ${from}`,
    }),
    ({ from, incident, action }) => ({
      subject: `Postmortem: ${incident}`,
      body: `Blameless postmortem\n\nWhat happened: ${incident}\nStatus: over\nRoot cause: nobody, as is tradition\n\nAction items:\n1. Research ${action}.\n\nUntil item 1 is done, ${incident} is twice as likely to happen. Please don't let it join the other action items in the backlog, where action items go to retire.\n\n${from} Incident Response`,
    }),
    ({ from, incident, action }) => ({
      subject: `Re: ${incident} — over, but`,
      body: `Hey,\n\n${incident} is over. Before you close the tab: the postmortem says research ${action}.\n\nIt's not a suggestion. Until ${action} is researched, ${incident} is twice as likely to come back. We'd rather not write you this email again, and we suspect you'd rather not read it.\n\nBest,\n${from}`,
    }),
  ],

  drawer: [
    ({ from }) => ({
      subject: `Action needed: your Payments drawer is full`,
      body: `Hello,\n\nYour Payments drawer is full. New revenue has nowhere to go, so it is spilling over the edge instead of landing where you keep it.\n\nOur fees, you'll be relieved to hear, are unaffected. Fees are subject to fees, and both are doing fine.\n\nThanks,\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `Your funds are under review (and overflowing)`,
      body: `Dear Merchant,\n\nWe've noticed unusual activity on your account: success. Your Payments drawer is full, and revenue is now spilling out of it.\n\nWe've reviewed this situation thoroughly and can confirm it is happening.\n\nRegards,\nMerchant Services\n${from}`,
    }),
    ({ from }) => ({
      subject: `Payments drawer: full`,
      body: `Hi,\n\nShort one. The Payments drawer is full. Revenue that arrives now spills instead of being kept.\n\nThat's money you earned, falling on the floor. We thought you'd want to know.\n\n${from} Merchant Support`,
    }),
    ({ from }) => ({
      subject: `Re: Payments drawer — still full`,
      body: `Hello again,\n\nA reminder that your Payments drawer is full again, and revenue is spilling again.\n\nWe've sent this notice before. We'll send it again. We're very good at sending notices; payouts are the thing we're famous for doing slowly.\n\nKind regards,\nThe ${from} team`,
    }),
    ({ from }) => ({
      subject: `Your balance has nowhere to go`,
      body: `Hi there,\n\nHere's a summary of your account today:\n\n- Payments drawer: full\n- New revenue: spilling\n- Your mood: we can guess\n\nEvery sale from here on lands on the floor next to the drawer instead of in it. It's the nicest problem a business can have, right up until it isn't.\n\nBest,\nMerchant Success at ${from}`,
    }),
  ],

  oom: [
    ({ from, node }) => ({
      subject: `[Action may be required] ${node} restarted`,
      body: `Hello,\n\nWe are contacting you because your resource ${node} ran out of memory and was restarted.\n\nEvent type: OUT_OF_MEMORY_RESTART\nAffected resource: ${node}\nStatus: Closed (restarted)\n\nIf you have questions, our support team is available on a plan you don't have.\n\nSincerely,\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `${node} forgot everything`,
      body: `Hi,\n\n${node} filled its memory to the brim, tipped over, and restarted. It's back now with a clean slate and no memory of the incident, which is more than we can say for your logs.\n\nCheers,\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `Out of memory: ${node}`,
      body: `Instance: ${node}\nEvent: out of memory\nResult: restarted\n\n${node} used all of its RAM, so the process was killed and the node restarted. This notice is informational. So, in a way, was the restart.\n\n${from} Compute Notifications`,
    }),
    ({ from, node }) => ({
      subject: `${node} ran out of memory again`,
      body: `Hello,\n\n${node} has run out of memory again, and restarted again.\n\nWe've noticed a pattern. We're a cloud provider; noticing patterns and billing for them is most of what we do.\n\nRegards,\n${from} Health Dashboard`,
    }),
    ({ from, node }) => ({
      subject: `About ${node}'s little nap`,
      body: `Dear customer,\n\nAt approximately just now, ${node} tried to use more memory than it had. Our systems responded the way systems do: the process was stopped and ${node} restarted.\n\nWe'd like to reassure you that no hardware was harmed. Some requests may have been. We apologise for any inconvenience, and for this email.\n\nWarm regards,\nCustomer Communications, ${from}`,
    }),
  ],

  credits: [
    ({ from, node }) => ({
      subject: `${node} is out of CPU credits`,
      body: `Hello,\n\nYour instance ${node} has used all of its CPU credits. It is now throttled to 20% of its CPU.\n\nAffected resource: ${node}\nCurrent CPU limit: 20%\n\nThis is working as designed. Our design, not yours.\n\nSincerely,\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `${node} is now running at 20%`,
      body: `Hi,\n\nGood news: ${node} is still running. Less good news: it's out of CPU credits, so it's throttled to 20%.\n\nIt can still do one fifth of a job. Like a meeting that could have been an email.\n\nThanks,\nThe ${from} team`,
    }),
    ({ from, node }) => ({
      subject: `Your burst has been spent`,
      body: `BALANCE NOTICE\n\nResource: ${node}\nCPU credit balance: 0\nCPU available: 20%\n\n${node} burst until the credits ran out. It is now throttled to 20%.\n\nThe credits were included in the price. The throttling is included too, at no extra charge.\n\n${from} Billing and Compute`,
    }),
    ({ from, node }) => ({
      subject: `${node} is throttled again`,
      body: `Hello again,\n\n${node} is out of CPU credits again and back to running at 20%.\n\nSome instances are built to sprint. Yours is built to sprint and then sit down for a long time.\n\nRegards,\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `Performance notice for ${node}`,
      body: `Dear customer,\n\nWe are writing to let you know that ${node} has run out of CPU credits. Its CPU is now throttled to 20%, so the work it does will take longer while this lasts.\n\nThis notice does not require a reply. Replies are not read. Neither, statistically, is this notice.\n\nKind regards,\nThe ${from} team`,
    }),
  ],

  alert: [
    ({ from, alert, seconds }) => ({
      subject: `ALARM: "${alert}"`,
      body: `You are receiving this email because your alert rule "${alert}" has entered the FIRING state.\n\nReason: threshold crossed and held for ${seconds} seconds.\nState change: OK -> FIRING\n\nView this alert on the dashboard you never close.\n\n${from}`,
    }),
    ({ from, alert, seconds }) => ({
      subject: `[FIRING:1] ${alert}`,
      body: `Firing\n\nRule: ${alert}\nFor: ${seconds}s\nSeverity: page\n\nThis rule has been true for ${seconds} seconds, which is long enough to count and too long to ignore.\n\nYour graph is doing something. That is not good.\n\n${from}`,
    }),
    ({ from, alert, seconds }) => ({
      subject: `Alert triggered: ${alert}`,
      body: `Hi,\n\nOne of your alert rules just fired:\n\n${alert}\n\nIt held for ${seconds} seconds before we said anything. We wanted to be sure. We're sure. We saw it first; now it's your turn.\n\n— ${from}`,
    }),
    ({ from, alert, seconds }) => ({
      subject: `[PAGE] ${alert} (${seconds}s)`,
      body: `Hello,\n\nYou have been paged.\n\nAlert: ${alert}\nDuration: ${seconds} seconds\nUrgency: High\n\nThe rule held for ${seconds} seconds, so it's not a blip. Please look at it now, or at least look at it with an expression of concern.\n\n${from}`,
    }),
    ({ from, alert, seconds }) => ({
      subject: `Re: ${alert} — firing again`,
      body: `Hey,\n\n"${alert}" is firing again. It held for ${seconds} seconds this time.\n\nWe're not saying it's a pattern. We're just a graph of it, and the graph has an opinion.\n\n${from}`,
    }),
  ],

  'alert-ignored': [
    ({ from, alert }) => ({
      subject: `Nobody is listening to "${alert}"`,
      body: `Hi,\n\nThe rule "${alert}" has cried wolf five times today. Your team has stopped listening to it.\n\nThat's reasonable, and also dangerous: the next real alarm from this rule will be ignored too.\n\nFix: change its threshold, so it fires when something is actually wrong.\n\n${from}`,
    }),
    ({ from, alert }) => ({
      subject: `Alert fatigue report: "${alert}"`,
      body: `ALERT HEALTH REPORT\n\nRule: ${alert}\nFalse alarms today: 5\nPeople still paying attention: 0\n\nAfter five false alarms in one day, your team now ignores this rule. A rule nobody reads is a very expensive comment.\n\nRecommended: change its threshold.\n\n${from}`,
    }),
    ({ from, alert }) => ({
      subject: `"${alert}" has become background noise`,
      body: `Hello,\n\nFive false alarms today from "${alert}". Your team has learned, quite sensibly, to ignore it.\n\nWe'd love to say the rule will learn too. It won't. Rules don't learn. People do, and they just did.\n\nChange its threshold and it can earn back their trust.\n\nThe ${from} team`,
    }),
    ({ from, alert }) => ({
      subject: `Ignored: ${alert}`,
      body: `Hi,\n\nFive false alarms today. The team now ignores "${alert}".\n\nWe still see everything first. Now nobody sees it after us.\n\nChange the rule's threshold so it only fires when it means it.\n\n— ${from}`,
    }),
    ({ from, alert }) => ({
      subject: `"${alert}" cried wolf again`,
      body: `Hi,\n\nYou may remember this one. "${alert}" went off five times today, every time for nothing, and the team ignores it again.\n\nWe get it. Nobody wants to wake up for a graph that's fine. But the rule can't tell fine from on fire until you tell it.\n\nChange its threshold.\n\nRegards,\n${from}`,
    }),
  ],

  hired: [
    ({ from }) => ({
      subject: `Hello from the new engineer`,
      body: `Hi!\n\nFirst day. I'm ${from}, the new engineer. My laptop works, I've found the coffee, and I've already studied the whole architecture, which took four minutes because it's one Board.\n\nExcited to get going. Point me at something.\n\n${first(from)}`,
    }),
    ({ from }) => ({
      subject: `Introducing myself: ${from}`,
      body: `Hello everyone,\n\nI'm ${from}, and today is my first day on the team.\n\nA bit about me:\n- I like systems that stay up\n- I like them more when they stay up at night\n- I have strong opinions about tabs and will keep them to myself for at least a week\n\nLooking forward to working with you.\n\nBest,\n${first(from)}`,
    }),
    ({ from }) => ({
      subject: `hi! it's me`,
      body: `hey, it's ${first(from)}. first day!\n\njust got access to everything, which feels like a lot of trust for someone you met in one interview\n\nwhere should I start? happy to take whatever nobody else wants\n\n${first(from)}`,
    }),
    ({ from }) => ({
      subject: `Day one: reporting for duty`,
      body: `Hi,\n\nReporting for duty. Badge: yes. Chair: yes. Context: absolutely none yet.\n\nI'm told the best way to learn a system is to break it gently and fix it fast, so I'll be careful with the first part.\n\nSo glad to be here. Thanks for taking a chance on me.\n\n${first(from)}`,
    }),
    ({ from }) => ({
      subject: `New engineer, first day, many questions`,
      body: `Morning!\n\nIt's ${from}. Officially on the team as of today.\n\nI have three questions and will probably have thirty by lunch:\n1. Who do I ask about the Database?\n2. Is there a runbook?\n3. Is "there's no runbook" the runbook?\n\nVery happy to be here. Let's build something that stays up.\n\n${first(from)}`,
    }),
  ],

  finished: [
    ({ from, item }) => ({
      subject: `Done: ${item}`,
      body: `Hey,\n\n${item} is done. Finished it just now.\n\nNo drama, no surprises, which in this job counts as a celebration. Tests were green; I checked twice because I didn't believe it.\n\nWhat's next?\n\n${first(from)}`,
    }),
    ({ from, item }) => ({
      subject: `Wrapped up ${item}`,
      body: `Hi,\n\nQuick update: I've finished ${item}.\n\nIt took the usual path: it looked easy, then it looked impossible, then it looked done. I'm going with done.\n\nIf you've got the next thing lined up, I'm ready. If not, I'll go read the logs for fun.\n\nCheers,\n${first(from)}`,
    }),
    ({ from, item }) => ({
      subject: `${item} is finished`,
      body: `ok, ${item} is finished!\n\nhonestly I thought it'd take longer. either I'm getting faster or I missed something. I'm choosing to believe the first one\n\nready for the next task whenever you are\n\n${first(from)}`,
    }),
    ({ from, item }) => ({
      subject: `Another one done: ${item}`,
      body: `Hi,\n\nAnother one off the list: ${item} is finished.\n\nI'm starting to enjoy this. Don't tell anyone, it ruins the mystique.\n\nAnything you want me to pick up next?\n\nThanks,\n${first(from)}`,
    }),
    ({ from, item }) => ({
      subject: `Status update: ${item}`,
      body: `Hi,\n\nStatus update, since I promised I'd write these:\n\nTask: ${item}\nStatus: finished\nBlockers: none\nCoffee: one too many\n\nIt's ready whenever you want it. I'll take whatever's next on the list.\n\n${first(from)}`,
    }),
  ],

  deployed: [
    ({ from, features }) => ({
      subject: `Shipped it`,
      body: `Hey,\n\nJust deployed ${features}. It's live.\n\nDashboards look calm. I'm going to keep staring at them for the next twenty minutes anyway, just in case calm is lying.\n\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `Deploy notes: it's out`,
      body: `Hi all,\n\nDeploy notes, short version:\n\nShipped: ${features}\nRollback needed: no\nFridays involved: no\n\nIt went smoother than my last three deploys combined. I'm not going to question it.\n\nCheers,\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `it's live!!`,
      body: `it's live!!\n\n${features}, out in the world. users can poke at it right now\n\nI did the thing where you refresh the page after deploying like it'll change something. it didn't. that's good\n\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `Deployed another one`,
      body: `Hi,\n\nAnother deploy out the door: ${features}.\n\nEach time it gets a little less scary. This time I only held my breath for part of it.\n\nLet me know if users say anything nice. Or anything at all.\n\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `Release complete`,
      body: `Hello,\n\nHappy to report the release is complete. This went out today:\n\n${features}\n\nEverything is running and I haven't seen an error yet. I'll keep an eye on it through the afternoon.\n\nThanks to whoever reviewed it, including the person who said "looks good" without reading it. You know who you are.\n\n${first(from)}`,
    }),
  ],

  'deployed-bad': [
    ({ from, features }) => ({
      subject: `I broke it`,
      body: `Hey,\n\nI deployed ${features} and there's a bug in it. The App Servers are crashing.\n\nThat's on me. I'm sorry. I'm looking at it right now. Please don't refresh the dashboard, it only makes it worse for both of us.\n\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `Bad deploy: App Servers crashing`,
      body: `Hi,\n\nBad news first, then more bad news: ${features} shipped with a bug, and the App Servers are crashing because of it.\n\nTests passed. Review passed. Production did not pass.\n\nI'm digging in now. Will write again when I know more.\n\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `uh oh`,
      body: `uh oh\n\nthe ${features} deploy had a bug in it. App Servers are crashing\n\nit worked on my machine. my machine is not where the users are, I'm realising\n\nsorry. on it\n\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `It happened again`,
      body: `Hi,\n\nI'm sorry to write this kind of email twice. The deploy of ${features} has a bug, and the App Servers are crashing again.\n\nI know. I'm adding "check it more carefully" to my list of things I already thought I was doing.\n\nLooking into it now.\n\n${first(from)}`,
    }),
    ({ from, features }) => ({
      subject: `Incident: my deploy is crashing App Servers`,
      body: `Hi,\n\nWriting this before anyone has to ask.\n\nWhat: I deployed ${features}\nProblem: it has a bug\nImpact: App Servers are crashing\nWhose fault: mine, blameless postmortem notwithstanding\n\nI'm on it, and I'll stay on it until it's fixed.\n\n${first(from)}`,
    }),
  ],

  migration: [
    ({ from, share }) => ({
      subject: `Migration progress: ${share} on the new Stack`,
      body: `Hello,\n\nMigration update: ${share} of your App Servers now run on the new Stack.\n\nNo incident to report, which is why this email is so short and why nobody woke you up for it.\n\n${from}`,
    }),
    ({ from, share }) => ({
      subject: `${share} of App Servers moved`,
      body: `Hi,\n\nThe new Stack line is going up and to the right, the good way for once: ${share} of App Servers have moved over.\n\nTwo lines share the panel now, old Stack and new. Pick a favourite. We already know which one is going to win.\n\nThe ${from} team`,
    }),
    ({ from, share }) => ({
      subject: `Release tracking: new Stack at ${share}`,
      body: `Hi,\n\nWe're tracking the move: ${share} of your App Servers now run on the new Stack.\n\nWe'll be watching for anything new it brings with it. We always do. It's the only thing we do.\n\n— ${from}`,
    }),
    ({ from, share }) => ({
      subject: `Re: migration — now ${share}`,
      body: `Hi again,\n\nThe migration keeps moving. ${share} of App Servers are on the new Stack now.\n\nEvery migration has a long middle where both Stacks are running and nobody can quite remember why the old one existed. You're in it.\n\nRegards,\n${from}`,
    }),
    ({ from, share }) => ({
      subject: `Status: Stack migration at ${share}`,
      body: `MIGRATION STATUS\n\nApp Servers on the new Stack: ${share}\nApp Servers on the old Stack: the rest\nPages sent about this: 0\n\nThis notice is informational. Nothing is on fire. We checked twice, because it felt unusual.\n\n${from}`,
    }),
  ],
}
