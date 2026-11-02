import type { Pitch } from './letter.ts'

/* ==========================================================================
   Spam (GDD 18, "Spam and phishing"). Noise, mostly; four kinds are traps.
   Spam may lie about the world, but it never changes the game by itself.
   ========================================================================== */

export const SPAM: ReadonlyArray<Pitch> = [
  {
    sender: 'spam-datadug',
    letters: [
      ({ from }) => ({
        subject: `Quick question about your dashboards`,
        body: `Hi there,\n\nI noticed your team is shipping fast. Love that energy.\n\nQuick question: how many dashboards do you have right now? Most founders say "two, maybe." Our customers average 1,140, and 1,138 of them have never been opened. That's what we call observability maturity.\n\n${from} ingests every log, metric, trace, and vibe your stack emits, and keeps it forever. Leaving is technically possible, in the way that leaving a cave system is technically possible.\n\nWorth a 15-minute chat this week?\n\nBest,\nTyler\nAccount Executive, ${from}`,
      }),
      ({ from }) => ({
        subject: `Re: Quick question about your dashboards`,
        body: `Hi again,\n\nJust bumping this to the top of your inbox in case it got buried. (If you had ${from}, you'd have a dashboard showing exactly how buried.)\n\nHappy to do Tuesday or Thursday.\n\nTyler`,
      }),
      ({ from }) => ({
        subject: `Your free trial is a forever trial*`,
        body: `Good news!\n\nYour team is eligible for a 14-day free trial of ${from} Enterprise.\n\nWhat's included:\n- Unlimited dashboards\n- Unlimited alerts about your dashboards\n- A dashboard of your alerts about your dashboards\n- Custom metrics, billed per custom metric, per host, per hour, per feeling\n\n*After 14 days, your data stays with us. You can export it any time by talking to Sales.\n\nStart your trial in one click!\n\nThe ${from} Growth Team`,
      }),
      ({ from }) => ({
        subject: `Saw your bill and thought of you`,
        body: `Hey!\n\nOne of our customers just told me their ${from} invoice is now larger than their cloud bill, their payroll, and their rent combined. They called it "a wake-up call." We called it "a case study."\n\nThe thing is, they can now see that their costs are up 400% on a beautiful stacked area chart, in real time. Could your team say the same?\n\nI've put 30 minutes on your calendar. Feel free to move it, but not to cancel it.\n\nCheers,\nTyler`,
      }),
      ({ from }) => ({
        subject: `Should I close your file?`,
        body: `Hi,\n\nI've reached out a few times and haven't heard back, so I'll assume one of three things:\n\n1. You're happy flying blind.\n2. You're buried in an incident you can't see.\n3. You've been dug in by a competitor and can't get out. Blink twice.\n\nEither way, this is my last email. Probably. Our sequence software has opinions.\n\nAll the best,\nTyler from ${from}`,
      }),
    ],
  },
  {
    sender: 'spam-slowflake',
    letters: [
      ({ from }) => ({
        subject: `Is your 4 GB database ready for petabyte scale?`,
        body: `Hi,\n\nOur data team ran a quick scan and estimates your database at about 4 GB. Big things start small!\n\nWith ${from}, those 4 GB can be split across a 64-node warehouse, a 128-node warehouse, and a third warehouse that monitors the first two. Queries that took 9 milliseconds on your laptop now take 40 seconds on our cloud, which proves they're doing serious work.\n\nPer-second billing means you only pay for what you use. You'll use a lot.\n\nCan I send over a deck?\n\nWarmly,\nMadison, Enterprise Data Evangelist`,
      }),
      ({ from }) => ({
        subject: `Re: petabyte scale`,
        body: `Hey,\n\nCircling back here. I know 4 GB feels manageable today. That's what they all say, right before someone runs SELECT * on a Friday and the auto-scaler wakes up.\n\nThe ${from} team would love to help you be ready for that moment, and then send you an itemized summary of it.\n\nMadison`,
      }),
      ({ from }) => ({
        subject: `Your credit forecast is in`,
        body: `CREDIT FORECAST: FREE-TIER PROSPECT\n\nEstimated monthly credits: 3\nEstimated monthly credits after one curious analyst: 41,000\nEstimated monthly credits after one dashboard set to refresh every minute: yes\n\nRecommended plan: Enterprise Plus Platinum Snow\n\n${from} warehouses auto-suspend after 10 minutes idle. Dashboards are never idle.\n\nTo discuss your forecast, reply to this email. Replies are free.`,
      }),
      ({ from }) => ({
        subject: `A customer story you'll relate to`,
        body: `Hello,\n\nI wanted to share a quick story. A startup about your size moved their 4 GB of orders to ${from}. Within a month, their analysts were asking questions they had never thought to ask, such as "who approved this?" and "how is it per second?"\n\nToday they run a lean, data-driven culture. Mostly lean.\n\nThey asked to remain anonymous, and also asked us to stop calling.\n\nWould you be open to a 20-minute discovery session?\n\nBest regards,\nMadison`,
      }),
      ({ from }) => ({
        subject: `Data Pillow Summit: free tickets for founders`,
        body: `Hi there,\n\nYou're invited to the ${from} Summit, where 12,000 engineers gather in one hall to learn how to put a pillow on top of a lake.\n\nHighlights:\n- Keynote: "Zero-Copy Cloning, Infinite-Copy Invoices"\n- Workshop: Rightsizing your 4 GB for the cloud era\n- Panel: Per-second billing, per-minute regret\n\nYour ticket is free. Lunch is consumption-based.\n\nSee you there,\nThe ${from} Events Team`,
      }),
    ],
  },
  {
    sender: 'spam-devnull',
    letters: [
      ({ from }) => ({
        subject: `Writes in 0 ms. Guaranteed.`,
        body: `Hi,\n\nTired of slow writes? ${from} accepts every write you send it in zero milliseconds, at any scale, forever.\n\nHow? We have reinvented durability from first principles and found it was optional.\n\nOur benchmarks:\n- Throughput: unlimited\n- p99 latency: 0 ms\n- Data loss: within expected parameters\n\nIt's fast. It's durable. It's webscale.\n\nShall we set up a proof of concept? It will finish instantly.\n\nThe ${from} team`,
      }),
      ({ from }) => ({
        subject: `Re: Writes in 0 ms`,
        body: `Hey,\n\nJust floating this back up. A few founders have asked whether ${from} supports reads.\n\nGreat question! Reads are available on our Enterprise tier, priced per read, with a minimum commitment of three years. Our Sales Engineering team will be happy to explain what you'll be reading.\n\nTalk soon,\nDerek\nSolutions Architect`,
      }),
      ({ from }) => ({
        subject: `Is your database web scale?`,
        body: `Founder,\n\nYour database uses transactions. Locks. Indexes. A write-ahead log. Do you know what has none of those things? ${from}.\n\nWe don't do joins, because joins don't scale. We don't do schemas, because schemas don't scale. We don't keep data, because, if we're honest, data doesn't scale.\n\nWe shard to /dev/null, then shard that shard. It's /dev/null all the way down.\n\nMigrate today. There's nothing to migrate back.\n\nDerek`,
      }),
      ({ from }) => ({
        subject: `${from} is now SOC 2 compliant`,
        body: `ANNOUNCEMENT\n\nWe're proud to share that ${from} has completed its SOC 2 audit with zero findings.\n\nThe auditors could not locate any customer data, so none of it could be mishandled. They described our retention policy as "immediate" and our access controls as "moot".\n\nYour data has never been safer. Your data has never been anywhere.\n\nBook a security review with our team. Bring nothing; you'll leave with nothing.`,
      }),
      ({ from }) => ({
        subject: `We're sunsetting the free tier (sort of)`,
        body: `Hi,\n\nA quick note on pricing. Starting next month, the ${from} free tier will continue to accept unlimited writes at no cost. Nothing changes there.\n\nWhat does change: our backups product, previously "not available," will now be "coming soon." Our restore product will remain a frequently requested feature.\n\nThanks for being a valued source of bytes. We've enjoyed every one of them, briefly.\n\nWarmly,\nDerek and the team`,
      }),
    ],
  },
  {
    sender: 'spam-recruiter',
    letters: [
      ({ from }) => ({
        subject: `Rockstar opportunity for your engineers 🚀`,
        body: `Hey!!\n\nChad here from ${from}. I came across your engineering team and I'll be honest, I was blown away. Real rockstars. Total ninjas.\n\nMy client is a stealth-mode, pre-revenue, post-product startup offering:\n- Unlimited PTO (please don't take it)\n- Beanbags\n- A kombucha tap that works on Tuesdays\n- Equity in a company that will definitely exist\n\nCould you forward this to your strongest backend person? I can't seem to find their contact info, which is weird because I found yours.\n\nCheers bro,\nChad`,
      }),
      ({ from }) => ({
        subject: `Re: Rockstar opportunity`,
        body: `Hey, just bumping this!\n\nDid you get a chance to forward to your team? No worries if not. Let's circle back on your circle back, then touch base on the circle.\n\nChad\n${from}`,
      }),
      ({ from }) => ({
        subject: `Is your Database person happy?`,
        body: `Hi,\n\nWeird question, but how happy is your database engineer, on a scale of 1 to "updating their profile at 2 a.m."?\n\nI only ask because I have a role that's perfect for them. Fully remote, fully on-site, or fully hybrid, depending on the day. Salary is competitive, meaning it competes.\n\nThe interview is just 9 rounds and a take-home that should take about a weekend. Two weekends, tops.\n\nLet me know if you'd like me to reach out to them directly. I already have, but I'd like your blessing.\n\nChad, Talent Partner, ${from}`,
      }),
      ({ from }) => ({
        subject: `10x engineer wanted (must have 15 years of 3-year-old tech)`,
        body: `Hey there,\n\nMy client is looking for a 10x engineer, ideally an 11x engineer, with:\n- 15+ years in a framework released in 2023\n- Expert in every language, including some we've made up\n- Comfortable "wearing many hats" (we have one hat)\n- Passion. Lots of passion. Passion is the compensation\n\nIf anyone on your team fits, forward this along. If YOU fit, honestly even better, let's chat.\n\nTalk soon,\nChad 🤘\n${from}`,
      }),
      ({ from }) => ({
        subject: `Moving on (but not really)`,
        body: `Hi,\n\nSince I haven't heard back, I'll assume now isn't the right time. Totally get it. Timing is everything in talent.\n\nI'll check back in 6 weeks. Also in 3 weeks. Also tomorrow, from a different address.\n\nIn the meantime, if any of your engineers starts using the phrase "I just want to work on something meaningful," you know where to find me.\n\nStay crushing it,\nChad\nSenior Vice Bro of Talent, ${from}`,
      }),
    ],
  },
  {
    sender: 'spam-conf',
    letters: [
      ({ from }) => ({
        subject: `You've been selected to speak at ${from}!`,
        body: `Dear Thought Leader,\n\nCongratulations! Our selection committee has chosen you to speak at ${from} this spring, among 4,000 hand-picked speakers.\n\nTo confirm your slot, simply choose a sponsorship package:\n\nBronze ($9,000): 5-minute lightning talk, in the hallway\nSilver ($24,000): 20-minute session, before breakfast\nGold ($60,000): keynote, with a lanyard in your colour\nPlatinum ($150,000): we will clap\n\nSpots are limited. Please confirm within 48 hours.\n\nWarm regards,\nThe ${from} Program Committee`,
      }),
      ({ from }) => ({
        subject: `Re: Your speaking slot`,
        body: `Hi,\n\nFollowing up on your speaking invitation. We haven't received your sponsorship confirmation yet, and the Gold tier is filling up fast. There's only one left, plus the four we'll add if you say yes.\n\nThe ${from} team`,
      }),
      ({ from }) => ({
        subject: `Final CFP: "Scaling to 10 Users and Beyond"`,
        body: `CALL FOR PAPERS: LAST CHANCE\n\nTracks this year:\n- Webscale on a Budget\n- Microservices for Your Monolith of One\n- The Blockchain of It All (returning by popular demand of one sponsor)\n- AI, Generally\n\nAccepted talks receive: a 15-minute slot, a badge reading SPEAKER, and an invoice.\n\nThe review process is blind. Our reviewers look only at your sponsorship tier.\n\nSubmit by Friday.\n\nThe ${from} Committee`,
      }),
      ({ from }) => ({
        subject: `Your booth is waiting (it's 2 m², near the toilets)`,
        body: `Hey founder,\n\nNothing builds a brand like a booth! For a limited time, ${from} is offering Startup Alley pods at a founder-friendly rate.\n\nYour pod includes one stool, one power outlet (shared), and foot traffic from everyone going to the restrooms, which our data shows is everyone.\n\nAdd-ons: a second stool, Wi-Fi, a sign with your name spelled right.\n\nLet me know and I'll send the contract.\n\nBrooke\nPartnerships, ${from}`,
      }),
      ({ from }) => ({
        subject: `Recap: ${from} was our best year yet`,
        body: `What a year!\n\nThanks to everyone who joined ${from}. Some numbers:\n\n- 9,000 attendees\n- 8,700 of them were speakers\n- 312 talks titled "Lessons Learned"\n- 1 talk with lessons\n- 41,000 tote bags, now in landfill at webscale\n\nAll recordings are available on our site for attendees with an All-Access Pass. All-Access Passes are available for purchase.\n\nEarly-bird pricing for next year opens now and closes when we feel like it.\n\nSee you there!`,
      }),
    ],
  },
  {
    sender: 'spam-incohere',
    letters: [
      ({ from }) => ({
        subject: `What if your load balancer could think?`,
        body: `Hi,\n\nRound-robin is so 2010. ${from} puts a large language model in your load balancer, so every request is routed by a model that has read the whole internet and has feelings about it.\n\nIn early pilots, our AI router reduced latency on 12% of requests and wrote a short poem about the other 88%.\n\nWe'd love to show you a demo. The demo is also generated.\n\nBest,\nAva\nFounder & Chief Vibe Officer, ${from}`,
      }),
      ({ from }) => ({
        subject: `Re: What if your load balancer could think?`,
        body: `Hey,\n\nJust bumping this. Our AI also noticed you didn't reply, and it has written three follow-ups on my behalf. This is the most polite one.\n\nThe other two are in the "agentic" folder.\n\nAva @ ${from}`,
      }),
      ({ from }) => ({
        subject: `Agents for everything (yes, everything)`,
        body: `Founder,\n\nImagine a world where every part of your company is an agent:\n\n- An agent writes your code\n- An agent reviews the code\n- An agent rejects the review\n- An agent escalates to another agent\n- An agent writes the postmortem\n- An agent attends the postmortem\n\nYou just watch. Or, for $40,000 a year, an agent watches for you.\n\n${from} is the agentic platform for companies that want to be out of the loop.\n\nReply YES to join the waitlist. Our agent will reply MAYBE.`,
      }),
      ({ from }) => ({
        subject: `We raised $80M (pre-product)`,
        body: `Big news!\n\n${from} just closed an $80M seed round, led by investors who were very excited about the slide that said "AI."\n\nWe'll use the funds to hire, to buy GPUs, and to figure out what we do. Early signs point to "a chatbot, but for databases."\n\nAs one of our first 10,000 design partners, you get free access and a voice in our roadmap. The roadmap is a prompt.\n\nOnward,\nAva & the ${from} family`,
      }),
      ({ from }) => ({
        subject: `Your AI-generated cold email`,
        body: `Hi {{first_name}},\n\nI hope this email finds you well in {{city}}! I was really impressed by {{company}}'s recent work on {{recent_achievement}}.\n\nAt ${from}, we help companies like {{company}} unlock {{benefit}} with the power of {{buzzword}}.\n\nWould you be open to a quick {{meeting_length}} chat this {{day_of_week}}?\n\nBest,\n{{sender_name}}\n\nP.S. {{personalized_ps}}`,
      }),
    ],
  },
  {
    sender: 'spam-awol',
    actions: [{ id: 'trap:phish', label: 'Verify account' }],
    letters: [
      ({ from }) => ({
        subject: `URGENT: Your account will be suspended in 24 h`,
        body: `Dear Valued Costumer,\n\nWe have detected unusual activity on you're ${from} account. For your protection, your account has been temporary limited.\n\nTo avoid permanent suspension of all servers, you must verify your account within 24 hours.\n\nPlease click "Verify account" below and enter your Username, Password, and Root Access Keys.\n\nFailure to comply will result in the deletion of all you're data.\n\nThank you for your cooperation,\n${from} Security Departement`,
      }),
      ({ from }) => ({
        subject: `Re: Re: Account Suspension Notice (2nd Notice)`,
        body: `Dear Customer,\n\nWe have not recieve your verification. This is the second and FINAL notice.\n\nYour account is going to be suspend in 12 hours. Kindly verify immediately to restore full acess.\n\nKind Regard,\n${from} Trust & Safety Team`,
      }),
      ({ from }) => ({
        subject: `Security Alert: New sign in from unknown device`,
        body: `Hello User,\n\nA new sign-in to your ${from} account was detect.\n\nDevice: Unknown\nLocation: Unknown\nTime: Now (urgent)\n\nIf this was you, no action is needed. If this was not you, your account is in danger and must be verifyed right away to block the hackers.\n\nClick "Verify account" and confirm your password, your password again, and the code we text you.\n\nRegards,\nThe ${from} Account Protection Center`,
      }),
      ({ from }) => ({
        subject: `Action Required: Update Billing Informations`,
        body: `Dear Sir/Madam,\n\nYour recent payment to ${from} could not be proccessed. As a result, your instances are scheduled for termination.\n\nTo keep your services running, you must update your billing informations including card number, expiry, and the three digits on the back.\n\nThis process is fast, safe and 100% secure.\n\nWe apologise for any incovenience.\n\nBest Regards,\nBilling Team\n${from}`,
      }),
      ({ from }) => ({
        subject: `Your ${from} account has been locked`,
        body: `Dear Account Holder,\n\nDue to a security upgrade of our system's, all accounts must be re-verify before the end of the day.\n\nAccounts not verify will be locked permanently and the servers will be gived to other customer.\n\nThis email is automatically generated by our offical system. Do not reply. Do not call. Simply verify.\n\nThank You For Choosing Cloud,\nSupport Team`,
      }),
    ],
  },
  {
    sender: 'spam-cve',
    actions: [{ id: 'trap:patcher', label: 'Patch now' }],
    letters: [
      ({ from }) => ({
        subject: `[CRITICAL] CVE-2099-0001: Remote root in everything`,
        body: `SECURITY ADVISORY\n\nCVE ID: CVE-2099-0001\nSeverity: CRITICAL (CVSS 11.0/10)\nAffected: All versions of all software\nFixed in: patcher.sh (attached)\n\nSummary: A flaw in computers allows attackers to do things.\n\nMitigation: Download the attached patcher and run it as root. Do not read it first; reading it may trigger the vulnerability.\n\nThis advisory is issued by ${from}.`,
      }),
      ({ from }) => ({
        subject: `Re: CVE-2099-0001 still unpatched on your systems`,
        body: `Hello,\n\nOur scanners show your systems are still vulnerable to CVE-2099-0001. Please run the attached patcher with sudo as soon as possible.\n\nIf prompted for a password, enter it. If prompted to disable your firewall, also do that. This is normal for patches.\n\n${from} Response Team`,
      }),
      ({ from }) => ({
        subject: `Zero-day alert: CVE-2104-31337 in your database`,
        body: `ZERO-DAY NOTIFICATION\n\nAn actively exploited vulnerability, CVE-2104-31337, has been found in databases.\n\nImpact: Attackers can read rows, write rows, and look at rows in a menacing way.\nExploitation: In the wild, and also in the future.\nCredit: Discovered by our research team, in the year 2104.\n\nAction required: Run fix_db_now.bin as root on every host. Disable antivirus first, as it is known to interfere with the fix.\n\nStay safe,\nThe ${from} Threat Intel Desk`,
      }),
      ({ from }) => ({
        subject: `Weekly digest: 1 critical issue needs your attention`,
        body: `Your weekly security digest from ${from}\n\nNew this week:\n- CVE-2099-0451: Your cache remembers things (CRITICAL)\n- CVE-2099-0452: Your load balancer balances loads (CRITICAL)\n- CVE-2099-0453: You have not run our patcher (CRITICAL)\n\nOne-click remediation is available for all three. Our universal patcher fixes every vulnerability, including the ones it introduces.\n\nPlease run it as root. Running it as a normal user will only partially compromise, um, protect you.`,
      }),
      ({ from }) => ({
        subject: `Courtesy notice: official patch for CVE-2099-0001`,
        body: `Dear Administrator,\n\nThank you for subscribing to ${from}. We are reaching out because the official, vendor-approved, cryptographically signed (by us) patch for CVE-2099-0001 is now available.\n\nInstall steps:\n1. Download the attachment\n2. curl it into bash as root\n3. Leave the room\n\nThe patch is 4.2 GB, because security is complex.\n\nRespectfully,\nAdvisory Desk\n\nP.S. You may not find this CVE in any other database. That's how you know it's exclusive.`,
      }),
    ],
  },
  {
    sender: 'spam-azzure',
    actions: [{ id: 'trap:invoice', label: 'Pay invoice' }],
    letters: [
      ({ from }) => ({
        subject: `INVOICE #AZ-88213 PAST DUE`,
        body: `${from}\nInvoice #AZ-88213\nStatus: PAST DUE\n\nRegion: moon-central-0\nService: Compute Instances (x4), Lunar Egress\nAmount due: $4,812.44\nDue date: Yesterday\n\nOur records show this invoice remains unpaid. To avoid late fees and service interruption, please remit payment immediately using the button below.\n\nIf you have already paid, please pay again so we can be sure.\n\nAccounts Receivable`,
      }),
      ({ from }) => ({
        subject: `Re: INVOICE #AZ-88213 PAST DUE (late fee added)`,
        body: `Dear Customer,\n\nA late fee of $480.00 has been applied to invoice #AZ-88213 for services in region moon-central-0.\n\nNew balance: $5,292.44.\n\nPlease settle today to keep your lunar workloads running.\n\nRegards,\n${from} Collections`,
      }),
      ({ from }) => ({
        subject: `Your monthly statement is ready`,
        body: `Hello,\n\nYour ${from} statement for this period is now available.\n\nUsage summary\neu-atlantis-1: 2,400 vCPU-hours\nus-nowhere-2: 900 GB egress\nap-hypothetical-7: 1 managed database (idle)\n\nTotal: $12,960.00\n\nPayment is due within 3 business days. Many customers find the button below the fastest way to pay.\n\nThank you for choosing ${from}, where we have over 400 regions, 3 of them up.\n\nBilling Operations`,
      }),
      ({ from }) => ({
        subject: `Final notice before referral to collections`,
        body: `FINAL NOTICE\n\nAccount: Your Company\nRegion: mars-north-1 (Olympus Mons Zone B)\nOutstanding: $7,000.00 + "fees"\n\nWe have tried to contact you multiple times about unpaid compute in the above region. If payment is not received within 24 hours, this account will be referred to our collections partner, who is very serious and wears a tie.\n\nTo resolve this matter, click "Pay invoice."\n\n${from} Legal & Billing Department`,
      }),
      ({ from }) => ({
        subject: `Thanks for your business! (invoice attached)`,
        body: `Hi there!\n\nThanks for being a loyal ${from} customer for the past 0 years. We've attached your latest invoice for reserved capacity in us-imaginary-4.\n\nAmount: $2,150.00\nTerm: 3 years, prepaid\nInstances: we'll let you know\n\nWe've made paying easy: one click and you're done. No need to log in to your console, check your usage, or ask anyone.\n\nCheers,\nThe ${from} Customer Success Team`,
      }),
    ],
  },
  {
    sender: 'spam-domain',
    actions: [{ id: 'trap:domain', label: 'Renew now' }],
    letters: [
      ({ from }) => ({
        subject: `DOMAIN EXPIRATION NOTICE: quorum.team`,
        body: `DOMAIN NAME EXPIRATION NOTICE\n\nDomain: quorum.team\nTerm: 1 year\nRenewal fee: $389.00\nPlease respond by: as soon as possible\n\nFailure to renew your domain name by the expiration date may result in a loss of your online identity, making it difficult for customers to find you.\n\nRenew now to keep your name.\n\nThis notice is not a bill. This is a solicitation. You are under no obligation to pay the amount stated unless you accept this offer.\n\n${from}`,
      }),
      ({ from }) => ({
        subject: `Second notice: quorum.team`,
        body: `SECOND NOTICE\n\nWe have not received your renewal for quorum.team.\n\nTo maintain your listing, return payment of $389.00 using the button below.\n\nBy renewing with ${from} you agree to transfer the domain from your current registrar, which you will not miss.\n\n(This is not a bill.)`,
      }),
      ({ from }) => ({
        subject: `quorum.team: search engine listing renewal`,
        body: `Dear Domain Owner,\n\nThis is a reminder that the Search Engine Submission for quorum.team is ready for renewal.\n\nOur service submits your domain to over 9,000 search engines, including all of the important ones and several that are a single person with a notebook.\n\nAnnual fee: $299.00\nBenefits: Unclear\n\nAct now to keep your search visibility.\n\nSincerely,\n${from} Listing Services\n\nThis is not an invoice. You have no account with us. Yet.`,
      }),
      ({ from }) => ({
        subject: `Protect your brand: quorum.tea, quorum.tram & more`,
        body: `Hello,\n\nAn unknown party has applied to register the following names, which look very similar to yours:\n\nquorum.tea\nquorum.tram\nquorum.steam\nqu0rum.team\n\nAs a courtesy, ${from} is giving you priority to register them first, for $1,200 each, within 72 hours.\n\nWho is the unknown party? We can't say. It's definitely not us.\n\nTo secure your brand, click "Renew now" and we'll take care of the rest.\n\nKind regards,\nBrand Protection Desk`,
      }),
      ({ from }) => ({
        subject: `Statement of account: quorum.team`,
        body: `${from}\nSTATEMENT OF ACCOUNT\n\nDomain Name ............ quorum.team\nService Period ......... 10 years\nDomain Protection ...... $1,999.00\nPriority Handling ...... $199.00\nProcessing Fee ......... $49.99\nTOTAL DUE .............. $2,247.99\n\nPlease detach and return the bottom portion with payment, or click "Renew now."\n\n(This is a solicitation for the order of services, not a bill, invoice, or statement of account due. Despite the heading above.)`,
      }),
    ],
  },
]
