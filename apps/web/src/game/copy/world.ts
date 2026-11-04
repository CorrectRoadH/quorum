import type { Cve, CveVars, Letters, Rewrite } from './letter.ts'

/* ==========================================================================
   Mail about the world around the Design (GDD 18): security advisories,
   teammates who want help or a new language, and customers who wait.
   ========================================================================== */

/** Fictional vulnerabilities the Simulation can disclose. */
export const CVES: ReadonlyArray<Cve> = [
  {
    id: 'CVE-2026-1337',
    title: 'HTTP proxy request smuggling',
    what: 'A crafted request hides a second request inside the first, and the proxy forwards both. Your server then answers a question nobody at the front door saw anyone ask.',
  },
  {
    id: 'CVE-2026-0451',
    title: 'Framework deserializes any cookie',
    what: 'The framework turns any cookie it receives back into live objects, no questions asked. A visitor can bake one that runs code on the way in.',
  },
  {
    id: 'CVE-2026-2718',
    title: 'Database remote code before auth',
    what: 'The database engine runs code sent during the handshake, before it checks the password. It is very polite: it lets strangers in before asking who they are.',
  },
  {
    id: 'CVE-2026-0042',
    title: 'Deep package leaks heap in errors',
    what: 'A package seven dependencies deep pastes chunks of heap memory into its error messages. Nobody chose this package. Nobody knew it was there.',
  },
  {
    id: 'CVE-2026-3141',
    title: 'Regex denial of service in a validator',
    what: 'An email validator backtracks forever on one long, carefully chosen address. A single sign-up form can keep a CPU busy until the heat death of the universe or the next deploy, whichever comes first.',
  },
  {
    id: 'CVE-2026-1024',
    title: 'Logging library runs what it logs',
    what: 'The logger treats some strings as instructions and helpfully runs them. Anyone who can get text into a log line, such as a username, can run code on your server.',
  },
]

/** Security advisories. Each one parodies a different advisory format. */
export const CVE_LETTERS: Letters<CveVars> = [
  ({ from, id, score, title, what, severity, exposed }) => ({
    subject: `${id}: ${title}`,
    body: `${from} Security Bulletin\n\nCVE ID: ${id}\nScore: ${score.toFixed(1)} (${severity})\nSummary: ${title}\nAffected in your Design: ${exposed ?? 'unknown. Check whether you run this.'}\n\nDescription: ${what}\n\nRecommended action: patch.\nWorkaround: hope.\nStatus: published, unpatched, gaining popularity.`,
  }),
  ({ from, id, score, title, what, severity, exposed }) => ({
    subject: `${from} digest: 1 advisory for you`,
    body: `Hello subscriber,\n\nThis week's digest has one entry that concerns you and several hundred that concern someone else.\n\nIn this issue:\n\n1. ${id} · ${title} · ${score.toFixed(1)} ${severity}\n${what}\n\n${exposed ? `Our records say you run this in ${exposed}. Patch it.` : 'We cannot tell from here whether you run this. Check whether you run it.'}\n\nUntil next week,\nThe ${from} editors`,
  }),
  ({ from, id, score, title, what, severity, exposed }) => ({
    subject: `${id} (${score.toFixed(1)})`,
    body: `${id} | ${score.toFixed(1)} | ${severity} | ${title}\nyou run it: ${exposed ?? 'unknown. check whether you run this.'}\nfix: patch\nmore: ${what}\n\n-- \n${from} advisories. plain text. no HTML. no apologies.`,
  }),
  ({ from, id, score, title, what, severity, exposed }) => ({
    subject: `URGENT!!! ${id} is ${severity.toUpperCase()}`,
    body: `Okay. Okay okay okay.\n\nStop what you are doing. ${id} just dropped and it is a ${score.toFixed(1)} out of 10. ${title}. Read that again.\n\n${what}\n\n${exposed ? `And yes, you run it: ${exposed}. That is you. That is your Node.` : 'We do not know if you run it. YOU might not know if you run it. Check whether you run this, right now, please.'}\n\nPatch. Patch soon. Patch with feeling.\n\nBreathing into a paper bag,\nThe ${from} team`,
  }),
  ({ from, id, score, title, what, severity, exposed }) => ({
    subject: `Notice of disclosure, ref. ${id}`,
    body: `To whom it may concern,\n\nPursuant to standard disclosure procedure, ${from} hereby notifies the recipient of vulnerability ${id}, "${title}", assigned a provisional score of ${score.toFixed(1)} (${severity}), pending analysis, which is itself pending.\n\nSummary of finding: ${what}\n\nAffected component(s): ${exposed ?? 'not determined. The recipient is advised to check whether they run this.'}\n\nThe recipient is further advised to patch at their earliest convenience, and earlier than that.\n\nRegards,\nOffice of the Analysis Backlog, ${from}`,
  }),
]

/** A teammate asks for another engineer. `from` is their full name; they sign with the first. */
export const HIRE: Letters<{ readonly backlog: string }> = [
  ({ from, backlog }) => ({
    subject: `can we talk about the backlog`,
    body: `hey,\n\nquick one. the backlog is ${backlog} items deep and i'm starting to recognise tickets by their smell.\n\ncan we hire one more engineer? i'll onboard them. i'll even give them my good chair.\n\nhit Approve hire if yes. Later is fine too, i guess. i'll just be here. with the tickets.\n\n${from.split(' ')[0]}`,
  }),
  ({ from, backlog }) => ({
    subject: `Proposal: one more engineer`,
    body: `Hi,\n\nI'd like to make a case for a hire.\n\nThe problem: the backlog is ${backlog} items deep, and it is not getting shorter on its own.\nThe ask: one more engineer.\nThe alternative: we keep going as we are, and I keep writing emails like this one.\n\nIf you agree, Approve hire. If now is not the time, Later, and I'll bring it up again when the number is bigger. It will be.\n\nThanks,\n${from.split(' ')[0]}`,
  }),
  ({ from, backlog }) => ({
    subject: `${backlog} items.`,
    body: `${backlog} items in the backlog.\n\nThat's it. That's the email.\n\nOkay, one more line: we need another engineer. Approve hire, or Later if you have a plan I don't know about. (Please have a plan.)\n\n${from.split(' ')[0]}`,
  }),
  ({ from, backlog }) => ({
    subject: `I counted the backlog (don't ask why)`,
    body: `Hi!\n\nSo I was waiting for a build and I counted the backlog. It's ${backlog} items. I counted twice because I didn't believe it the first time.\n\nI did some quick maths, which I won't show you, because it was mostly sighing. The short version: we need another pair of hands, ideally attached to an engineer.\n\nCould we hire one? Approve hire and I'll start the onboarding doc tonight. Later, and I'll start it anyway, but sadder.\n\nCheers,\n${from.split(' ')[0]}\n\nP.S. One of the items is "clean up the backlog".`,
  }),
  ({ from, backlog }) => ({
    subject: `On behalf of the team: a hire`,
    body: `Hello,\n\nI'm writing for the whole team, who asked me to because I type the fastest.\n\nWe're proud of what we've shipped, but the backlog is ${backlog} items deep and we've started triaging the triage. One more engineer would let us finish things instead of just starting them.\n\nApprove hire, and we'll make them feel welcome. Later, and we'll understand. Mostly.\n\nBest,\n${from.split(' ')[0]} (and everyone)`,
  }),
]

/** An engineer who just fell for a language wants to rewrite the app servers in it. */
export const REWRITES: ReadonlyArray<Rewrite> = [
  {
    language: 'Rust',
    letters: [
      ({ from }) => ({
        subject: `hear me out: Rust`,
        body: `ok so hear me out.\n\nI spent the weekend with Rust and I think I'm in love. The compiler argued with me for six hours and it was right every single time. Imagine our app servers with that kind of honesty.\n\nI could rewrite them in a couple of weeks. Maybe less. The borrow checker does half the work.\n\nReview the migration if you want to talk it through, or Decline and I'll go back to pretending I'm fine.\n\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `Memory safety is a feeling, and I have it`,
        body: `Hi,\n\nEvery null pointer we've ever chased would simply not compile in Rust. I want that for us. I want that for the app servers.\n\nMy estimate is one sprint. I've been wrong about estimates before, but never about Rust.\n\nIf you'd like to plan it, review the migration. If not, Decline, and I'll respect that, and I'll mention Rust in standup anyway.\n\nThanks,\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `RFC: rewrite the app servers in Rust`,
        body: `RFC: Rewrite the app servers in Rust\nAuthor: ${from}\nStatus: Extremely proposed\n\nMotivation: fearless concurrency. Also, I'm afraid of our current concurrency.\n\nPlan:\n1. Rewrite.\n2. Celebrate.\n\nEstimate: small. Smaller than you think. Possibly smaller than I think.\n\nRisks: none I'm willing to discuss.\n\nTo discuss anyway, review the migration. To end this, Decline.\n\n${from.split(' ')[0]}`,
      }),
    ],
  },
  {
    language: 'Go',
    letters: [
      ({ from }) => ({
        subject: `Go is just... simple?`,
        body: `Hey,\n\nI rewrote a toy service in Go on the train home. Then I rewrote it again because it was so pleasant. "if err != nil" is a lifestyle now and I've adopted it.\n\nOur app servers would be one small binary each. I think it's a week's work. Two if we argue about naming.\n\nReview the migration to plan it, or Decline.\n\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `Goroutines for the app servers`,
        body: `Short version: rewrite the app servers in Go.\n\nLong version: goroutines. Channels. A standard library that just has things in it. It compiles before you finish blinking.\n\nEstimate: a few days. It's a boring language, so it's a boring rewrite, so it'll be fast. That's just logic.\n\nReview the migration or Decline.\n\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `A modest proposal (in Go)`,
        body: `Hi,\n\nI know rewrites have a reputation. This one is different: Go was designed so that people like me can't overcomplicate things. I've tested that theory by trying very hard, and so far the language is winning.\n\nI'd like to move the app servers to Go. Honestly, the hard part is already done. I've decided.\n\nIf you want the details, review the migration. If you'd rather not, Decline, and I'll keep my gopher sticker to myself.\n\nCheers,\n${from.split(' ')[0]}`,
      }),
    ],
  },
  {
    language: 'Elixir',
    letters: [
      ({ from }) => ({
        subject: `Let it crash (in a good way)`,
        body: `Hi!\n\nI've found Elixir and I've found peace. Processes crash, supervisors restart them, and nobody gets paged. Can you imagine our app servers just... healing?\n\nI think the rewrite is a couple of weeks. The pattern matching basically writes itself, and the parts that don't, a supervisor will restart.\n\nReview the migration to plan it, or Decline.\n\nWith newfound serenity,\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `It ran phone switches. It can run us.`,
        body: `Hey,\n\nThe runtime under Elixir was built for telephone switches that were not allowed to go down. Our app servers go down when someone sneezes near them.\n\nI'd like to rewrite them in Elixir. A sprint, maybe a sprint and a bit. It's mostly pipes and joy.\n\nReview the migration if you're curious. Decline if you've heard enough. I'll still be humming, quietly, in a fault-tolerant way.\n\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `quick elixir thought`,
        body: `random thought at 1 a.m.:\n\nwhat if the app servers were Elixir.\n\nlike, what if.\n\nhot code reloading. deploys without restarts. i read the whole book tonight, so i'm basically an expert.\n\nprobably a week? the book was short.\n\nReview the migration if you want to hear the rest of the thought. Decline if you want me to go to sleep.\n\n${from.split(' ')[0]}`,
      }),
    ],
  },
  {
    language: 'Zig',
    letters: [
      ({ from }) => ({
        subject: `Zig: no hidden control flow, no hidden anything`,
        body: `Hi,\n\nI've started writing Zig and I can see every allocation with my own eyes. It's like taking off foggy glasses I didn't know I was wearing.\n\nI want to rewrite the app servers in Zig. It's young, but so are we. I figure a couple of weeks, since there's no hidden control flow to slow me down.\n\nReview the migration to talk it over, or Decline.\n\nExplicitly yours,\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `comptime`,
        body: `comptime.\n\nThat's the pitch. That's the whole word.\n\nFine, more: Zig, for the app servers. Manual memory, but friendly about it. I'll have it done before the next version of Zig comes out, which is soon, so I'd better start.\n\nReview the migration or Decline.\n\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `Proposal: the app servers, but in Zig`,
        body: `Hello,\n\nI've been reading the Zig standard library for fun. Yes, for fun. It's very readable, which says something about the language and also about my evenings.\n\nI'd like to propose a rewrite of the app servers in Zig. By my estimate it's mostly typing, and things that are mostly typing are quick.\n\nIf you'd like to see my plan (one page, with a diagram), review the migration. Otherwise, Decline.\n\nThanks for reading,\n${from.split(' ')[0]}`,
      }),
    ],
  },
  {
    language: 'Haskell',
    letters: [
      ({ from }) => ({
        subject: `What if the app servers were pure?`,
        body: `Hi,\n\nI've been learning Haskell, and I can't go back. Our app servers have side effects everywhere. In Haskell they'd live in a monad, where they belong, being watched.\n\nThe rewrite is quick once the types line up. The types always line up eventually. If it compiles, it works.\n\nReview the migration to discuss, or Decline.\n\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `A monad is just a monoid in the category of...`,
        body: `...wait, let me start over.\n\nI want to rewrite the app servers in Haskell. I'll explain monads in the planning meeting. It'll take ten minutes. The explanation, I mean. The rewrite will take, like, a sprint.\n\nReview the migration and I'll bring a whiteboard. Decline and I'll bring it anyway, just to stand next to.\n\nLazily yours,\n${from.split(' ')[0]}`,
      }),
      ({ from }) => ({
        subject: `Type-safe app servers: a proposal`,
        body: `Hello,\n\nI'm proposing we rewrite the app servers in Haskell.\n\nWhat we get: a type system that catches bugs before users do, and code that reads like mathematics.\n\nWhat it costs: less than you'd think. Most of the work is choosing the types, and I've already chosen most of them, in my head, on the bus.\n\nReview the migration to go through it together, or Decline.\n\nBest,\n${from.split(' ')[0]}`,
      }),
    ],
  },
]

/** A support desk relays a customer who finds the product slow. */
export const TICKETS: Letters = [
  ({ from }) => ({
    subject: `[Ticket #4096] "Is it supposed to be this slow?"`,
    body: `Hello,\n\nA customer opened a ticket via ${from}:\n\n> Hi! Love the app. I clicked Save and then made a sandwich. It was still saving when I came back. It's a good sandwich. Is the app okay?\n\nPriority: Normal\nStatus: Open\nSLA: we take your feedback seriously\n\nThis ticket will close automatically if nobody replies, which is how we resolve most things.\n\n${from}`,
  }),
  ({ from }) => ({
    subject: `New conversation: "loading..."`,
    body: `New conversation from a customer:\n\nCustomer: hi\nCustomer: is the page meant to load in stages\nCustomer: like a slideshow\nCustomer: i'm on slide 4\nBot: Thanks for reaching out! The team typically replies in a few minutes.\nCustomer: so does the page\n\nThe conversation is still open. The customer is still on slide 4.\n\n${from}`,
  }),
  ({ from }) => ({
    subject: `This week's top complaint: speed`,
    body: `Hi there,\n\nYour weekly summary from ${from}. One theme came up more than the rest: slowness.\n\nA few highlights, lightly edited:\n- "I refreshed so many times my F5 key is shiny now."\n- "Fast enough to use, slow enough to resent."\n- "My grandma asked if the internet was broken. It wasn't. It was just your app."\n\nWe've tagged these "performance" and "please".\n\nBest,\nThe ${from} team`,
  }),
  ({ from }) => ({
    subject: `Escalated: a customer is waiting at checkout`,
    body: `Hello,\n\nThis ticket has been escalated from tier 1 to tier 2, and from tier 2 to you.\n\nCustomer summary: a bakery owner who has been trying to give you money for a while. In their words: "I proofed a loaf of bread between clicking Pay and seeing the receipt. I'd like to pay you. Please make it easier."\n\nRecommended response: make it faster.\n\nRegards,\n${from} Escalations`,
  }),
  ({ from }) => ({
    subject: `Ticket #8191 has been solved (it has not)`,
    body: `Hello!\n\nTicket #8191 from one of your customers was marked Solved after three days without a reply. We hope their issue was resolved!\n\nOriginal message, for the record:\n> The app is slow. Not broken, just slow, like it's thinking about each click very carefully. I appreciate thoughtfulness in people. Less so in apps.\n\nThe customer may reopen the ticket, and probably will.\n\nWe take your feedback seriously,\n${from}`,
  }),
  ({ from }) => ({
    subject: `A very kind complaint`,
    body: `Hi,\n\nPassing this one along from ${from}. It's the nicest complaint we've had all month:\n\n> Hello! I don't want to be a bother. The app has gotten slow lately and I wondered if it was me. I restarted my router, my laptop, and my phone, twice. It's still slow. No rush! (A little rush.)\n\nOur dashboard says we typically reply in a few days. We suggest you reply sooner.\n\nWarm regards,\n${from}`,
  }),
]

/** What a falling region's churn Mail says (GDD 12 "The Churn breakdown"). */
export type ChurnVars = Readonly<{
  region: string
  users: string
  perHour: string
  inADay: string
  /** The top two causes, one per line. */
  causes: string
}>

export const CHURN_LETTERS: Letters<ChurnVars> = [
  ({ from, region, users, perHour, inADay, causes }) => ({
    subject: `${region}: users are leaving`,
    body: `Hi,\n\nCancellations from ${region} are up. You have ${users} users there, and you lose ${perHour} an hour. At this rate you will have ${inADay} tomorrow.\n\nWhat they complain about most:\n\n${causes}\n\nThe Churn breakdown lists every cause and the fix for each.\n\n${from}`,
  }),
  ({ from, region, users, perHour, inADay, causes }) => ({
    subject: `Support queue: ${region} is unhappy`,
    body: `Hello,\n\nThe ${region} queue doubled this hour. ${users} users, down ${perHour} an hour, ${inADay} by this time tomorrow if nothing changes.\n\nTop tags:\n\n${causes}\n\nOpen the Churn breakdown to see what wins them back.\n\n${from}`,
  }),
]
