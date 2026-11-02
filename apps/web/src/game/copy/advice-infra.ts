import type { AdviceLetters } from './letter.ts'

/* ==========================================================================
   Infrastructure advice: cloud notices about a Node at a hard limit, vendor
   notes about the Payments drawer, and accountant reminders about Cash.
   ========================================================================== */

export const INFRA: Pick<
  AdviceLetters,
  | 'credits'
  | 'memory'
  | 'memory-shared'
  | 'network'
  | 'disk'
  | 'cpu'
  | 'draining'
  | 'drawer'
  | 'collect'
  | 'negative'
  | 'guidance'
> = {
  credits: [
    ({ from, node }) => ({
      subject: `[Action required] ${node}: CPU credit balance is 0`,
      body: `Dear valued customer,\n\nYour Burstable resource ${node} has exhausted its CPU credit balance and is now throttled to 20% CPU.\n\nHow credits work: a Burstable box earns credits while it runs below 20% of each core and spends them above that. Yours has been above it for a while.\n\nRecommended actions:\n- Resize ${node}\n- Or move it off Burstable, for example to the General family\n\nThis inbox is not monitored.\n${from}`,
    }),
    ({ from, node }) => ({
      subject: `Your ${node} is running on fumes`,
      body: `Hi there,\n\nQuick heads-up from your account team at ${from}. ${node} spent every CPU credit it had, so we have politely lowered it to 20% CPU until it earns more. It only earns them while it idles below 20% of each core, which, judging by your traffic, it will not.\n\nResize it, or switch it off Burstable to something like General, and it can run flat out again.\n\nWarmly (and at a discount we cannot offer),\nYour Customer Success Associate`,
    }),
    ({ node }) => ({
      subject: `EVENT: CPU_CREDITS_EXHAUSTED (${node})`,
      body: `Event type: CPU_CREDITS_EXHAUSTED\nResource: ${node}\nStatus: Open\nImpact: CPU capped at 20%\n\nDescription: This Burstable resource spends credits above 20% of each core and earns them below it. The balance is now zero.\n\nResolution: Resize the resource, or change its family from Burstable (for example, to General).\n\nNo reply is necessary. No reply is possible.`,
    }),
    ({ from, node }) => ({
      subject: `Re: re: about ${node}'s credit score`,
      body: `Hello,\n\nWe regret to inform you that ${node} has a CPU credit score of zero. Like many of us, it bought more than it earned.\n\nA Burstable node saves credits whenever it runs under 20% of each core and spends them above that. Broke, it now lives on a strict budget of 20% CPU.\n\nTwo ways out: Resize it, or retire it from Burstable to a family that does not ration, such as General.\n\nThank you for choosing ${from}. You had options. Fewer now.`,
    }),
    ({ from, node }) => ({
      subject: `${node} throttled to 20% (in Preview)`,
      body: `Greetings from ${from}!\n\nWe're excited to let you know that ${node} has been enrolled in our Throttling experience. It ran out of CPU credits and now runs at 20% CPU.\n\nBackground: Burstable instances bank credits under 20% of each core and burn them over it.\n\nTo opt out of the experience, Resize ${node} or switch it to a non-Burstable family such as General.\n\nWe'd love your feedback! Feedback is also in Preview.`,
    }),
  ],
  memory: [
    ({ from, node }) => ({
      subject: `${node} is out of memory and swapping`,
      body: `Dear valued customer,\n\nOur monitoring shows that ${node} has used all of its RAM and is now swapping to disk. Requests on this resource will be slow.\n\nYou can:\n1. Resize ${node}\n2. Pick the Memory family\n3. Shrink the pool\n\nWe appreciate your business. We appreciate it more each month.\n\nThe ${from} Service Health team`,
    }),
    ({ node }) => ({
      subject: `Service Health: memory pressure on ${node}`,
      body: `Impact statement: Starting at an unspecified time, ${node} ran out of RAM. The operating system is swapping memory pages to disk, and everything on the box now waits on it.\n\nCurrent status: Ongoing. We are investigating why you have not fixed this yet.\n\nMitigation: Resize the resource, move it to the Memory family, or shrink the pool so it needs less RAM.\n\nNext update: when you act.`,
    }),
    ({ from, node }) => ({
      subject: `Swap is not a memory upgrade`,
      body: `Hi,\n\n${node} is out of RAM. It is swapping, which means it is pretending the disk is memory, and the disk is not enjoying the role.\n\nGive it room: Resize it, pick the Memory family, or shrink the pool.\n\nCheers,\nAccount team, ${from}\n\nP.S. Your bill did not run out of memory. It remembers everything.`,
    }),
    ({ from, node }) => ({
      subject: `ALERT ${node} mem=100% swap=active`,
      body: `ALARM: "${node}-memory" is in ALARM state.\n\nReason: RAM fully used; the node is swapping.\n\nSuggested fixes, in no order:\n- Resize\n- Memory family\n- Shrink the pool\n\nYou are receiving this notice because you are a ${from} customer, which you agreed to on page 41 of a document you did not read.`,
    }),
    ({ from, node }) => ({
      subject: `A gentle note about ${node}'s memory`,
      body: `Hello from ${from},\n\nWe hope this email finds you well. We're less sure it finds ${node} well: it ran out of RAM and has been swapping for some time.\n\nWhen a box swaps, every request waits on the disk. Your users notice before you do.\n\nResizing the node, choosing the Memory family, or shrinking the pool will each give it breathing room.\n\nBest regards,\nYour dedicated (shared) Technical Account Manager`,
    }),
  ],
  'memory-shared': [
    ({ from, node }) => ({
      subject: `${node}: Postgres and your app share one RAM`,
      body: `Dear valued customer,\n\n${node} is out of RAM and swapping. The cause: Postgres runs on the same box as your app, and both want the memory.\n\nRecommended action: Place a Database and link ${node} to it, so Postgres gets a home of its own.\n\nThank you for building on ${from}.\nThis inbox is not monitored.`,
    }),
    ({ node }) => ({
      subject: `Roommate dispute detected on ${node}`,
      body: `Hi,\n\nYour app and Postgres have been sharing ${node} like two roommates sharing one fridge. The fridge is the RAM, and it is full. The node is swapping to disk.\n\nThe fix is to give Postgres its own place: Place a Database, then link ${node} to it.\n\nNo security deposit required.\n\nYour Solutions Architect`,
    }),
    ({ from, node }) => ({
      subject: `Health event: ${node} swapping (co-located DB)`,
      body: `Event: MEMORY_EXHAUSTED_COLOCATED\nResource: ${node}\nRoot cause: Postgres shares the box with the application. Combined memory exceeds RAM; the node is swapping.\n\nRemediation: Place a Database and link the node to it.\n\nThis notice was generated by ${from}. It is not a contract, a promise, or a person.`,
    }),
    ({ from, node }) => ({
      subject: `Quick thought on ${node}`,
      body: `Hey,\n\nFlagging something from our side at ${from}: ${node} has run out of RAM and is swapping. Looking closer, Postgres is living on the same box as the app, so every query and every request are fighting for the same memory.\n\nWe see this a lot with early setups, and it is the right call at first. It stops being right about now.\n\nPlace a Database and link ${node} to it. Your app gets its RAM back, and Postgres gets a box that is only for it.\n\nHappy to jump on a call (calls are in Preview).\n\nBest,\nYour account team`,
    }),
    ({ node }) => ({
      subject: `Two tenants, one ${node}, zero free RAM`,
      body: `Notice of memory exhaustion.\n\nResource ${node} hosts both the application and Postgres. Together they have used all of its RAM, and the resource is now swapping.\n\nThe supported configuration is one Postgres per Database: Place a Database and link ${node} to it.\n\nWe apologise for any inconvenience. We have not caused any inconvenience; we are just apologising in advance.`,
    }),
  ],
  network: [
    ({ from, node }) => ({
      subject: `${node} has hit network line rate`,
      body: `Dear valued customer,\n\n${node} is sending as many bytes as its network card can move. It is at line rate, and further traffic will queue.\n\nOptions:\n- Resize ${node} for a faster network card\n- Add a copy behind a Load Balancer to split the traffic\n\nEgress is billed per byte. We noticed.\n\nThe ${from} team`,
    }),
    ({ node }) => ({
      subject: `The pipe is full`,
      body: `Hi,\n\nShort version: ${node}'s network card is moving all the bytes it can. That is line rate, and there is no line after it.\n\nResize it, or put a copy behind a Load Balancer so two cards share the work.\n\nThanks,\nNetworking (we are the ones you blame first)`,
    }),
    ({ from, node }) => ({
      subject: `Service Health: throughput saturation, ${node}`,
      body: `Title: Network saturation on ${node}\nSeverity: Warning\nRegion: One of ours. It is up, which narrows it down.\n\nSummary: Outbound traffic from ${node} has reached the line rate of its network card.\n\nCustomer action: Resize the resource, or add a copy of it behind a Load Balancer.\n\n${from} Service Health`,
    }),
    ({ from, node }) => ({
      subject: `Congratulations on your traffic!`,
      body: `Hello!\n\nGreat news from ${from}: people really want to download things from ${node}. So many that its network card is now sending bytes as fast as it physically can.\n\nLess great news: that is the ceiling. Anything more waits in line.\n\nTo raise the ceiling, Resize ${node}. To add a second ceiling, put a copy behind a Load Balancer.\n\nCheering you on (and metering you),\nYour account team`,
    }),
    ({ node }) => ({
      subject: `NIC at 100% on ${node}`,
      body: `Automated message.\n\nMetric: NetworkOut\nResource: ${node}\nValue: line rate\nThreshold: line rate\n\nThe network card cannot move more bytes than it moves now. Resize the resource, or add a copy behind a Load Balancer.\n\nTo stop receiving these alerts, stop sending bytes.`,
    }),
  ],
  disk: [
    ({ from, node }) => ({
      subject: `${node}: working set no longer fits in RAM`,
      body: `Dear valued customer,\n\nThe working set on ${node} has outgrown its RAM. Reads that used to come from memory now go to disk, which is slower by a lot.\n\nRecommended actions:\n- Resize ${node}\n- Or pick the Memory family\n\nThank you for your continued patience. Your disk is showing less.\n\n${from}`,
    }),
    ({ node }) => ({
      subject: `Your reads are taking the stairs`,
      body: `Hi,\n\n${node} used to keep its hot data in RAM, where reads take the lift. The working set has grown past the RAM, so reads now take the stairs: they hit disk.\n\nResize it, or pick the Memory family, and the lift comes back.\n\nRegards,\nStorage team`,
    }),
    ({ from, node }) => ({
      subject: `Event: DISK_READS_ELEVATED on ${node}`,
      body: `Event type: DISK_READS_ELEVATED\nAffected resource: ${node}\nCause: Working set exceeds available RAM.\nEffect: Reads go to disk.\n\nTo resolve, Resize the resource or select the Memory family.\n\nThis is an automated message from ${from}. Replies are routed to a folder that we sunset in a previous quarter.`,
    }),
    ({ from, node }) => ({
      subject: `Re: ${node} feels slow lately?`,
      body: `Hello,\n\nIf ${node} has felt sluggish, here is why. Every node keeps the data it uses most, its working set, in RAM. ${node}'s working set has grown bigger than its RAM, so a share of every read now goes to disk.\n\nNothing is broken. It is just waiting on a spinning thing, figuratively.\n\nMore RAM fixes it: Resize the node, or pick the Memory family.\n\nKind regards,\nYour Technical Account Manager at ${from}`,
    }),
    ({ node }) => ({
      subject: `Disk is the new RAM (it is not)`,
      body: `Notice.\n\n${node}'s working set does not fit in RAM anymore, so reads hit disk.\n\nFix: Resize, or the Memory family.\n\nThat is the whole email. We are as surprised as you are.`,
    }),
  ],
  cpu: [
    ({ from, node }) => ({
      subject: `${node} is at 100% CPU`,
      body: `Dear valued customer,\n\n${node} is using all of its CPU. Requests are queuing behind each other.\n\nRecommended actions:\n- Resize ${node}\n- Add a copy behind a Load Balancer\n\nYour usage is up. So is your bill. We consider this a partnership.\n\nThe ${from} team`,
    }),
    ({ node }) => ({
      subject: `ALARM: ${node} CPUUtilization >= 100`,
      body: `ALARM\n\nName: ${node}-cpu\nState change: OK -> ALARM\nReason: CPU at 100%.\n\nRunbook: Resize the resource, or add a copy behind a Load Balancer.\n\nYou are receiving this email because someone, at some point, ticked a box.`,
    }),
    ({ from, node }) => ({
      subject: `${node} is giving 100%`,
      body: `Hi!\n\nWe love the hustle. ${node} is giving 110%, which in CPU terms means 100% and a queue.\n\nTwo ways to help it out: Resize it, or add a copy behind a Load Balancer so the work splits between them.\n\nRooting for you,\nGrowth team at ${from}\n\nP.S. A copy is a whole new Node. We will be sending a whole new invoice.`,
    }),
    ({ from, node }) => ({
      subject: `Service Health: compute saturation on ${node}`,
      body: `Impact: ${node} is at 100% CPU. Work that arrives now waits for work that arrived earlier.\n\nStatus: Investigating. Our investigation consists of this email.\n\nWorkaround: Resize the resource, or add a copy of it behind a Load Balancer.\n\nAll other regions are operating normally, the three of them we can see.\n\n${from}`,
    }),
    ({ node }) => ({
      subject: `Your CPU called. It's busy.`,
      body: `Hello,\n\nWe tried to reach ${node} about something unrelated, but it is at 100% CPU and could not pick up.\n\nIf you'd like it to have a free moment again, Resize it to a bigger box, or add a copy behind a Load Balancer so they take turns.\n\nThanks for your understanding,\nCompute Customer Experience`,
    }),
  ],
  draining: [
    ({ from, node }) => ({
      subject: `[Heads-up] ${node} CPU credits running low`,
      body: `Dear valued customer,\n\n${node} is spending CPU credits faster than it earns them. When the balance reaches zero, it will drop to 20% CPU.\n\nTo avoid this:\n- Switch it to General\n- Or resize it\n\nUse Show on Board to find it.\n\nThe ${from} team`,
    }),
    ({ node }) => ({
      subject: `${node}'s credits: a countdown`,
      body: `Hi,\n\nThis is the email before the email. ${node} is draining its CPU credits and will run out soon. After that, it runs at 20% CPU, and you get the other email.\n\nSwitch it to General, or resize it, and neither of us has to send or read that one.\n\nShow on Board takes you right to it.\n\nThanks,\nYour account team`,
    }),
    ({ from, node }) => ({
      subject: `Forecast: ${node} throttled to 20% soon`,
      body: `Forecast notice from ${from}.\n\nAt the current rate, ${node} will spend its last CPU credit soon. Once it does, it will be held to 20% CPU.\n\nThis is a forecast, not an outage. Like our weather forecasts, it is in Preview, but unlike them it tends to be right.\n\nAction: Switch ${node} to General, or resize it. Show on Board will point it out.`,
    }),
    ({ from, node }) => ({
      subject: `Low balance alert: ${node}`,
      body: `Hello,\n\nYour CPU credit balance on ${node} is low and falling. We'd hate for it to hit zero, because then the node drops to 20% CPU.\n\nUnlike your bank, we will not offer an overdraft. Unlike your bank, we will tell you how to fix it: switch the node to General, or resize it.\n\nSee it with Show on Board.\n\nRegards,\nBilling and Burst, ${from}`,
    }),
    ({ node }) => ({
      subject: `EVENT: CPU_CREDITS_DRAINING (${node})`,
      body: `Event type: CPU_CREDITS_DRAINING\nResource: ${node}\nCategory: scheduled (by you, by accident)\nExpected impact: CPU capped at 20% when credits reach zero\n\nAvoid by: switching to General, or resizing.\n\nLocate: Show on Board.\n\nThis mailbox is unattended. So, it seems, is ${node}.`,
    }),
  ],
  drawer: [
    ({ from }) => ({
      subject: `Your Payments drawer is full 🎉`,
      body: `Hi there!\n\nGreat news: you've made so much money that your Payments drawer is completely full! Less great news: new revenue has nowhere to go, so it is spilling, and spilled revenue is lost.\n\nClick Payments to collect what's in there, and the drawer has room again.\n\nKeep crushing it,\nThe ${from} team\n\nP.S. Collecting is free. Most other things are not.`,
    }),
    ({ from }) => ({
      subject: `Notice regarding your account balance`,
      body: `Dear Merchant,\n\nThis notice is to inform you that the Payments drawer associated with your account has reached capacity. Any further revenue received will not be retained and is considered lost.\n\nTo restore capacity, please click Payments and collect the balance.\n\nPlease do not reply to this message. Replies are placed under review.\n\nSincerely,\n${from} Resolution Center`,
    }),
    ({ from }) => ({
      subject: `Money is falling on the floor`,
      body: `Hey,\n\nYour Payments drawer is full. New revenue is spilling over the edge and we are not picking it up (we'd charge a fee to bend down).\n\nClick Payments to collect.\n\n— ${from}`,
    }),
    ({ from }) => ({
      subject: `Action needed: revenue is spilling`,
      body: `Hello,\n\nA quick look at your dashboard:\n\nDrawer: full\nIncoming revenue: spilling\nRevenue kept from the spill: none\n\nEvery payment that arrives while the drawer is full is lost. Click Payments to collect what's waiting, and new revenue will land again.\n\nWe make it easy to get paid. Staying paid is a separate product.\n\nCheers,\n${from}`,
    }),
    ({ from }) => ({
      subject: `Re: Case #00000: drawer at capacity`,
      body: `Dear Account Holder,\n\nWe have reviewed your account and determined that your Payments drawer is full. While it remains full, incoming revenue spills and cannot be recovered. ${from} is not liable for spilled revenue, under section 9.2(c), which you may find under Legal, then More Legal.\n\nResolution: Click Payments to collect the drawer.\n\nThis case will close automatically. Most things here do.\n\nRegards,\nAccount Review`,
    }),
  ],
  collect: [
    ({ from }) => ({
      subject: `You have revenue waiting`,
      body: `Hi!\n\nYou have revenue sitting in your Payments drawer, and your Cash is looking a little thin. Let's fix that!\n\nClick Payments to collect it and move it into Cash.\n\nHappy selling,\nThe ${from} team\n\nP.S. Did you know you can view your fees on a beautiful, interactive chart?`,
    }),
    ({ from }) => ({
      subject: `Funds available for collection`,
      body: `Dear Merchant,\n\nOur records indicate that revenue is held in your Payments drawer while the Cash balance on your account is low.\n\nThese funds are not under review. We checked twice, which is a review, but a short one.\n\nTo collect, click Payments.\n\nSincerely,\n${from}`,
    }),
    ({ from }) => ({
      subject: `Cash low, drawer not`,
      body: `Hey,\n\nYour Cash is low. Your Payments drawer, meanwhile, is sitting on revenue you already earned.\n\nOne click fixes the mismatch: click Payments to collect, and the money moves where you can spend it.\n\n${from}`,
    }),
    ({ from }) => ({
      subject: `Your weekly ${from} summary`,
      body: `Hello!\n\nHere's your week at a glance:\n\n- Revenue: in the Payments drawer\n- Cash: low\n- Fees: present and thriving\n\nThe first two would make a lovely pair. Click Payments to collect the revenue into Cash.\n\nSee you next week,\nYour friends at ${from}`,
    }),
    ({ from }) => ({
      subject: `Don't leave money in the drawer`,
      body: `Hi there,\n\nWe noticed you've got revenue waiting in your Payments drawer while your Cash runs low. It's yours! It's just not in Cash until you collect it.\n\nClick Payments to bring it over.\n\nThanks for growing with ${from}. We grow a small percentage every time you do.\n\nCheers,\nMerchant Success`,
    }),
  ],
  negative: [
    ({ from }) => ({
      subject: `Your Cash balance is negative`,
      body: `Hi,\n\nI've reconciled the books and your Cash balance is below zero. I rounded twice and it's still below zero.\n\nTwo ways back: sell Nodes you don't need, or grow revenue. The first is faster.\n\nBest,\nYour bookkeeper at ${from}`,
    }),
    ({ from }) => ({
      subject: `Reminder: balance overdue (to yourself)`,
      body: `Dear Client,\n\nThis is a friendly reminder that your Cash balance is negative.\n\nThis is a second, less friendly reminder in the same email, to save time.\n\nPlease review your Nodes and sell any you do not need, or grow revenue until the balance is above zero again.\n\nIf you have already done so, please disregard this email. We checked. You have not.\n\nKind regards,\nAccounts, ${from}`,
    }),
    ({ from }) => ({
      subject: `Ledger alert: Cash < 0`,
      body: `Automated ledger check\n\nAccount: Cash\nBalance: negative\nStatus: Rounded down, then down again\n\nSuggested next steps:\n- Sell Nodes you do not need\n- Grow revenue\n\nGenerated by ${from}. This notice has been filed next to the last one.`,
    }),
    ({ from }) => ({
      subject: `We need to talk about the red number`,
      body: `Hello,\n\nI was going through this month's books and hoped the red was a formatting choice. It is not: your Cash balance is negative.\n\nI'm not here to judge. I've seen founders come back from worse. They usually did one of two things: sold the Nodes they weren't really using, or grew revenue. Usually the first, then the second.\n\nLet me know if you'd like me to walk through the numbers. I'm free; my hourly rate is not.\n\nWarmly,\nYour accountant at ${from}`,
    }),
    ({ from }) => ({
      subject: `Quick one`,
      body: `Hi,\n\nCash is negative. Sell the Nodes you don't need, or grow revenue. I'd start with the Nodes.\n\nThat's all. I'm putting this in a folder labelled "Concerns".\n\n— ${from}`,
    }),
  ],
  guidance: [
    ({ from }) => ({
      subject: `Reminder: this quarter's Guidance`,
      body: `Hi,\n\nNow that you're a public company, the market remembers what you tell it. This quarter, that's your Guidance: the number you promised.\n\nMeet it. Analysts are kind to companies that do what they said, and creative with the ones that don't.\n\nBest,\nYour accountant at ${from}`,
    }),
    ({ from }) => ({
      subject: `Your Guidance is not a suggestion`,
      body: `Dear Client,\n\nAs a public company, you set Guidance for this quarter, a number promised to the market. Please plan to meet it.\n\nFor your reference, phrases such as "headwinds", "a challenging macro environment", and "quite frankly" do not count toward Guidance. We have checked the ledger for them.\n\nKind regards,\nInvestor Reporting, ${from}`,
    }),
    ({ from }) => ({
      subject: `Quarter-end checklist`,
      body: `Hello,\n\nYour quarter-end checklist from ${from}:\n\n- Books reconciled: in progress\n- Receipts attached: some\n- Guidance met: please\n\nYou're public now. You told the market a number for this quarter, and the market wrote it down. Let's meet the Guidance you set.\n\nThanks,\nThe bookkeeping team`,
    }),
    ({ from }) => ({
      subject: `About that number you promised`,
      body: `Hi,\n\nA small reminder, in the spirit of public-company life: this quarter you set Guidance, and the market is holding you to it.\n\nI've been doing books for a long time. Private companies can have a bad quarter. Public companies have a bad quarter, a bad earnings call, and a bad week of headlines. Meet the number.\n\nIf you need me, I'll be here, quietly highlighting cells.\n\nCheers,\nYour accountant, ${from}`,
    }),
    ({ from }) => ({
      subject: `Guidance: the market is watching`,
      body: `Automated reminder\n\nCompany status: Public\nThis quarter: Guidance set\nAction: Meet the Guidance you set\n\nGuidance is the number you promised the market for the quarter. We recommend promising carefully and delivering exactly.\n\nGenerated by ${from}. Please retain for your records, as we will not.`,
    }),
  ],
}
