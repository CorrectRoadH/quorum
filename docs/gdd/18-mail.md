# 18. Mail

[Index](./README.md) · Previous: [Scope and roadmap](./17-scope-and-roadmap.md)

This document applies [pillar 4: the board is the dashboard](./01-vision.md#pillar-4-the-board-is-the-dashboard)
and [pillar 5: respect the player](./01-vision.md#pillar-5-respect-the-player). It changes the main
channel between the game and the player. The Board shows what the system is doing now. **Mail** tells
the player what happened, who is asking for what, and what to decide. It arrives in an **Inbox** that
works like an email app.

## Why

- A founder's day is email. The cloud provider warns about limits. Engineers ask for time. Investors
  write. A security list announces a vulnerability. Spam arrives all day. A game that shows these as
  one sentence in a pill feels like a tutorial. A game that shows them as email feels like a job.
- The source changes the meaning. "CPU is maxed" from the cloud provider is a capacity warning from a
  vendor. The same fact from a teammate is a request for help. The player learns who to trust and what
  to do with each kind of sender.
- An Inbox is a record. The player can reread a warning, find the offer from three Eras ago, and see
  what the team asked for before the outage.
- It scales. A new Era, incident, or system adds a sender and some templates. It does not add a
  panel.

## Rules

1. **Mail is the voice of the world.** Anything a person or a system tells the player, other than the
   direct answer to the last click, is Mail.
2. **The sender is the source of the fact.** A fact comes from the party that would know it in real
   life ([Senders](#senders)). No fact comes from "the game".
3. **Every sender has a colour and a shape** ([Colour code](#colour-code)). The player can read an
   Inbox by colour before reading a word.
4. **Mail never covers the Board.** One corner button shows the unread count. The Inbox is a small
   window docked above it that leaves the Board in view and clickable. `I` opens it, `Esc` closes it.
5. **Mail asks, the player answers with buttons.** Actions send the same Messages the old panels
   sent. There is no free text and no reply box.
6. **One click to the cause.** Mail about a Node or Link has a "Show on Board" button that selects it
   ([Interface rule 3](./15-ui-ux.md#interface-rules)).
7. **Mail stays until the player deletes it.** Deleted Mail goes to Trash and can be restored.
8. **Urgent Mail still interrupts.** An outage page stays a Board banner, because waiting to open an
   email costs the player money. The Mail that follows is the record.
9. **Gesture feedback stays a toast.** "Collected $16", refusals, and the change delta answer the
   click that just happened. They are not Mail.
10. **Mail never lies about the Simulation.** Spam and phishing lie about the world; they never change
    a number on the Board until the player acts on them.

## The Inbox

A compact two-pane email window, after Proton Mail, Superhuman, and Gmail.

```text
┌───────────────────────────────────────────────────────────────────────┐
│ ✉  Inbox 3   Spam 2   Trash                                        ✕  │
├───────────────────────┬───────────────────────────────────────────────┤
│ ■ Nimbus Cloud   3:33 │ Capacity warning: app-01 is at 100% CPU       │
│   Capacity warning…   │ (N) Nimbus Cloud <alerts@nimbus.cloud>   3:33 │
│ ■ Dana Okafor    3:20 │     to me                                     │
│   Rewrite checkout?   │                                               │
│ ■ Larch Ventures 2:58 │ app-01 has served 10.4 req/s against a limit  │
│   Pre-seed offer      │ of 0.7 req/s for 40 s. …                      │
│                       │ [ Show on Board ]  [ Resize to small $240 ]   │
└───────────────────────┴───────────────────────────────────────────────┘
```

- **Folders:** Inbox, Spam, Trash. The count beside Inbox is the unread count. Spam shows its own
  count so the player knows something is there.
- **List:** newest first, grouped by thread ([Threads](#threads)). Each row shows the sender's colour
  chip, the sender, the time, and the subject. Unread Mail has a dot and a bold subject.
- **Reader:** the subject, the sender's name and address, the time, the body, and the action buttons.
- **Labels:** each Mail has one label from its sender kind (Cloud, Team, Investor, Security, and so
  on). Labels are the filter chips above the list.
- Opening the Inbox selects the newest unread Mail. On a phone the two panes stack.
- Time is the Company clock.

## Senders

Each sender has one voice and one reason to write. All names and companies are fictional. A sender
has a **kind**, a **name**, an **address**, and a colour.

| Kind       | Examples                                                                    | Writes when                                                                                                                                                                                  | Actions                                                |
| ---------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Cloud      | Nimbus Cloud (compute, network, storage bill)                               | A Node nears or passes a hard limit: CPU credits, RAM, bandwidth, disk, quota; the monthly bill; a zone or region incident on the provider's side; Spot reclaim notices; maintenance windows | Show on Board, Resize, Raise quota, Switch to Reserved |
| Monitoring | Pulse (your alerting tool)                                                  | An alert rule fires or clears: error rate, p99, saturation. It is the pager's inbox copy ([Observability](./12-observability.md))                                                            | Show on Board, Acknowledge, Mute for 1 h               |
| Vendor     | Payfold (payments), Authly (auth), Postbox (email and push), Gridwave (CDN) | A managed Component has an outage, a price change, or a new limit                                                                                                                            | Show on Board, Switch provider (when a second exists)  |
| Teammate   | Each hired engineer, by name                                                | They finish work, hit a blocker, propose a rewrite, ask for a hire, or want to quit ([Team](#teammates))                                                                                     | Approve, Decline, Later                                |
| Investor   | A fund per round: Larch Ventures, Northline, …                              | A Milestone is met ([Economy](./09-economy.md#funding)); a term sheet changes; a board update is due                                                                                         | Raise, Decline                                         |
| Security   | CVE Digest (a public advisory list), your Security lead                     | A vulnerability is disclosed in something the Design runs ([CVEs](#cves-and-patches)); a patch is overdue; an audit finding                                                                  | Show on Board, Patch now, Queue the patch              |
| Finance    | Your accountant                                                             | A Quarter closes: **Guidance** met or missed; runway under 6 months                                                                                                                          | None                                                   |
| Customers  | Support inbox, named customers                                              | Users complain: slow checkout, errors, a lost region; a big customer asks for a feature                                                                                                      | Show on Board, Add to backlog                          |
| Mentor     | Dr. Leslie Lamportant, an advisor and former CTO                            | A strategic nudge the other senders would not give: research to open, a shape worth trying. She is the tutorial voice in the Garage and Pre-seed Eras and speaks rarely after                | None                                                   |
| Spam       | Anyone ([Spam](#spam-and-phishing))                                         | Always                                                                                                                                                                                       | Usually none; a few are traps                          |

Capacity facts that live in the Simulation today (`nextGoal`: out of CPU credits, out of RAM, workers
busy, connections, network) belong to **Cloud** or **Monitoring**, not to the Mentor. The bottleneck
tells the player what is wrong. The sender and its buttons tell the player what is possible.

## Colour code

A sender wears the app's own **badge**: the shape and glyph knocked out in white, as on the dock
([Interface](./15-ui-ux.md)). The shape says what kind of party wrote. The colour comes from the
app's palette, not from a new one, so Mail looks like part of the Board.

| Kind       | Shape (build group) | Colour (app token) | Glyph       |
| ---------- | ------------------- | ------------------ | ----------- |
| Cloud      | Hexagon (Edge)      | `--group-edge`     | Cloud       |
| Monitoring | Diamond (Ops)       | `--warn`           | Pulse line  |
| Vendor     | Diamond (Ops)       | `--group-ops`      | Credit card |
| Investor   | Chip (Compute)      | `--group-compute`  | Trend line  |
| Finance    | Disc (Data)         | `--chart-4`        | Ledger      |
| Customers  | Hexagon (Edge)      | `--chart-2`        | Life buoy   |
| Mentor     | Chip (Compute)      | `--primary` (ink)  | Compass     |
| Teammate   | Disc (Data)         | `--ok`, shifted    | Person      |
| Security   | Diamond (Ops)       | `--danger`         | Shield      |
| Spam       | Hexagon (Edge)      | Grey               | Barred      |

Rules:

- Colour is never the only signal. The shape, the glyph, and the kind label repeat it
  ([Accessibility](./15-ui-ux.md#accessibility)).
- A sender's badge is the same everywhere: the list, the reader, and the "Show on Board" highlight.
- Phishing copies a real sender's name, badge, and subject but not its address. The address is the
  tell ([Phishing](#spam-and-phishing)); spam always wears the grey badge.
- A teammate keeps the green hue, shifted a little by a stable hash of their id, so no two
  engineers match.

## Threads

Mail groups by **thread**: one subject from one sender about one thing. A repeat of the same fact
joins its thread instead of adding a new row, and the row shows a count.

- A thread has a **key**: sender plus subject kind plus the thing it is about, such as
  `cloud:cpu:app-01`.
- A repeat bumps the thread to the top, marks it unread, and adds a dated line to the reader. It does
  not add a new row.
- A thread **resolves** when its cause is gone: the CPU warning resolves when `app-01` is below its
  limit. The reader shows "Resolved at 3:41" and the thread stays in the Inbox as a record.
- A thread **reopens** if the cause returns after it resolved.
- Deleting a thread removes the whole thread. A later repeat starts a new one.
- A thread has at most 20 entries. Older entries collapse to "N earlier messages".

This replaces the "same text in the last six" rule of the first build, which could not tell a repeat
from a new problem.

## Teammates

People are the richest source of Mail. Each hired engineer is a named sender ([Team and
velocity](./08-team-and-velocity.md)). They write in a few fixed shapes, with a body drawn from their
language, seniority, and the state of the Design.

| Mail                 | Triggers on                                                                                        | Actions                                            |
| -------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Shipped              | A feature or task finishes                                                                         | Show on Board                                      |
| Blocked              | A task cannot move: waiting for a decision, an index, a database copy, or a hire                   | Approve, Later                                     |
| Rewrite proposal     | An engineer who knows a language well and sees a service with high **tech debt** or a slow runtime | Approve rewrite, Decline, Later                    |
| Hire request         | A team is past its coordination limit or its backlog is long                                       | Approve hire, Decline                              |
| Incident follow-up   | An Incident resolved                                                                               | File postmortem, File and research the action item |
| Burnout and quitting | Long freeze, many pages, or a pay gap                                                              | Give time off, Raise salary, Accept resignation    |
| Proposal to patch    | A CVE affects a service the engineer owns                                                          | Patch now, Queue the patch                         |

### Rewrite proposals

A rewrite proposal is how the "big rewrite" trap ([Team and velocity](./08-team-and-velocity.md#migrations))
becomes a decision with a person behind it.

- The proposal names the service, the target language, the DH cost from the migration table, and the
  engineer's own estimate, which is too low by a factor that grows with their enthusiasm.
- **Approve** starts the migration with the strangler steps. **Decline** keeps the service. **Later**
  snoozes the proposal for a calendar week and then asks again with a bigger complaint.
- The engineer's mood moves with the answer. A declined senior engineer who has asked three times
  may write a resignation.
- A proposal that is right is common. A proposal that is wrong sounds just as sure. The player judges
  it from the numbers in the Mail and on the Board: p99, errors, tech debt, velocity.

## CVEs and patches

A **CVE** is a vulnerability disclosed in software the Design runs. It is the reason the Inbox needs
a Security sender and a spam folder together.

- **Disclosure.** The Simulation draws CVEs from the Company's seed. A CVE affects one thing the
  Design runs: a runtime and version, a framework, a database engine, a proxy, or a package set.
  Only a Design that runs the affected thing is exposed. Examples, all fictional: a request-smuggling
  bug in an HTTP proxy, a deserialization bug in a framework, a remote-code bug in a database engine.
- **Severity.** Each CVE has a score from 1 to 10 and a class (remote code, denial of service,
  data leak). The score sets the clock: how long until it is exploited in the wild.
- **Who tells the player.** Security mail names the CVE id, the score, what it affects, and which of
  the player's Nodes are exposed. Without research ("Dependency scanning"), the list of exposed Nodes
  is missing and the Mail says "Check whether you run this." A Security team writes the full version
  and offers the patch.
- **The patch** is an engineering task with a DH cost ([Team and velocity](./08-team-and-velocity.md#engineering-tasks)),
  often followed by a deploy. A **Patch now** button queues it at the top of the backlog. **Queue the
  patch** puts it at normal priority.
- **The clock.** While an exposed CVE is unpatched, its exploit chance rises each calendar day. When
  it fires, the **Data breach** incident starts: data loss, users lost, a Reputation hit, and a
  postmortem. Patching before the clock runs out removes the risk.
- **The cost of speed.** Patching in a hurry steals DH from features and risks a **Bad deploy**.
  Patching late risks a breach. The player trades these off from the Mail.
- **Supply chain.** The existing Supply-chain compromise incident ([Incidents](./11-incidents.md#catalog))
  arrives as a CVE with a false "safe" advisory first, then a correction: Security mail, then a
  second thread entry that says to pin and redeploy.

Two incidents are new and need entries in the [catalog](./11-incidents.md#catalog): **Data breach**
(from an exploited CVE) and **Credential leak** (from phishing).

CVE rate scales with how much the Design runs: more distinct runtimes and Components mean more
exposure, which gives a reason to keep a small stack ([Runtimes](./06-runtimes.md)).

## Spam and phishing

Real inboxes are mostly noise. The Spam folder teaches the player to read, and it hides a few traps
and one gift.

- **Spam arrives from Seed on.** The rate grows with Users and press. It is flavour with a purpose:
  it fills the Inbox with sound that the filter removes.
- **A spam filter** sorts Mail into Spam by sender reputation. It is a research item and a Postbox
  setting. Without it, spam lands in the Inbox. With it, a small share of real Mail lands in Spam
  by mistake, so the player checks the folder.
- **Kinds of spam.**

| Kind             | Looks like                                                                 | Effect                                                            |
| ---------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Vendor pitch     | "10× your observability, book a demo"                                      | Noise. A few are real tools that unlock a research discount.      |
| Fake invoice     | An invoice from a cloud provider you do not use                            | Paying it costs Cash and teaches the lesson once.                 |
| Phishing         | A look-alike of a real sender: "Nimbus Cloud: verify your account in 24 h" | Acting on it leaks credentials: the **Credential leak** incident. |
| Fake CVE alert   | A real-looking advisory with a link and a "patch now" button               | Acting on it installs a backdoor. See below.                      |
| Recruiter        | Offers to your engineers                                                   | A hint that a teammate is unhappy.                                |
| Real CVE in Spam | A true advisory that the filter sorted wrongly                             | Ignoring it starts the CVE clock without a warning.               |

- **How to tell.** The sender's address is on a lookalike domain (`alerts@nimbus-cloud.support`
  against `alerts@nimbus.cloud`). A real advisory names a CVE id that the player can look up in the
  Glossary, which lists the real ones the Design is exposed to. A fake one names an id the Glossary
  does not know, or one that does not affect anything the Design runs.
- **A button is a commitment.** A trap's action button looks normal. Hovering shows the real
  destination. Clicking it is the player's act, not the game's.
- **Report spam.** Marking a Mail as spam teaches the filter and, for phishing, removes the risk.
  Reporting a real Mail as spam is a mistake the player can undo from Spam.
- **Tone.** Spam is funny and plausible, never cruel. Real vendor names are not used.

Spam is pillar 5's mirror: the player is never punished for opening Mail, only for acting on a
trap. The cost is one click and one lesson.

## Actions

- An action is a button in the reader. Choosing it sends the Message the matching panel sends today
  and ends the question: the buttons are replaced by one line, such as "You raised $2,500 for 10%".
- A standing offer lasts while its condition holds. If Users fall below the Milestone, the offer
  expires and the thread says so.
- Mail the player has answered stays in the Inbox as the record.
- Every action has a keyboard shortcut in the reader: `1`, `2`, `3` for the buttons, `E` to delete,
  `J` and `K` to move, `S` to mark spam.

## What Mail replaces

| Today                              | With Mail                                                          |
| ---------------------------------- | ------------------------------------------------------------------ |
| Goal pill at the top of the Board  | Cloud, Monitoring, and Mentor Mail. Partly done: the pill is gone. |
| Funding round modal and pager chip | Investor Mail with Raise and Decline                               |
| Postmortem card                    | Teammate Mail with the file actions                                |
| Away card                          | A Mail from Finance and Monitoring, "While you were away"          |
| Team panel requests                | Teammate Mail; the panel stays for the roster                      |
| Era card                           | Stays. An Era transition is a scene, not a message.                |
| Sandbox and Challenge objectives   | Stay on the Board. Mail belongs to a Company.                      |

## How it works

The Simulation emits **facts**: typed, deterministic records of things that happened or became true
(a limit reached, a task finished, a CVE disclosed). The web app turns each fact into Mail. See
[ADR 0006](../adr/0006-mail-is-client-state.md).

- Facts that change the game are Simulation state: a CVE and its exploit clock, a rewrite proposal
  and its answer, an open funding round. Their answers are Actions, so replays and the server's
  check see them.
- Mail text, sender style, spam, and phishing copy are client content. Spam and phishing are drawn
  from the seed so a Company is the same on every device, but they change no Simulation number
  until the player acts. The act is an Action.

## Pacing and volume

- **Quiet at the start.** The Garage Era sends at most one Mail a minute, mostly from the Mentor.
- **Priority.** Mail that needs a decision, such as an offer or a CVE with a clock, sits above the
  rest and carries a coloured left bar.
- **Digest.** When more than eight threads are unread, the oldest low-priority ones fold into one
  "Digest" thread.
- **No guilt.** Unread Mail never expires a decision the player has not been told about, and never
  costs anything on its own. Clocks start when the Mail arrives and are shown in it.

## Open questions

| Question                                   | Current answer                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Does the Inbox survive a reload?           | Yes, once it is saved with the Company. In the build it is not saved yet.                              |
| Does new Mail raise a sound or a toast?    | Offers, CVEs with a clock, and outages do: one short mutable chime. The rest only change the badge.    |
| Should each Mail have a written subject?   | Yes. Each template writes its own. In the build the subject is the first sentence of the advice.       |
| Does an unanswered offer cost the player?  | No. An Era that begins without a raise already runs at 0.7 × `g` ([Economy](./09-economy.md#funding)). |
| Can the player reply?                      | No. No free text and no threads with replies.                                                          |
| Are teammates procedurally named?          | Yes, from the seed, with a pool of names and a short bio each. A teammate keeps their name for life.   |
| Is Spam only flavour in the first release? | Yes: spam and phishing ship with the CVE system, not before.                                           |
| How many CVEs per hour of play?            | About one every 20 to 30 minutes from Seed, fewer for a small stack. A balancing item.                 |
| Does the Mentor stay?                      | Yes, but rarely after Pre-seed. Her voice is the only one that is not about a fact.                    |

## Names

Every name is a pun on something real, close enough that an engineer gets it a beat late and far
enough to stay fictional. The rule: **change one or two letters, keep the shape of the original,
and let the new meaning be the criticism.** The joke is the sender's reputation in one line.

### Senders

| Name in the game                  | Plays on                                    | Why it is funny                                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AWOL Web Services**             | AWS (Amazon Web Services)                   | "Absent without leave": the provider that vanishes when you need it. Its sign-off, "This inbox is not monitored. Neither is your bill", mocks no-reply mail and bill shock.                                                                                                               |
| **PagerDooty**                    | PagerDuty                                   | "Doody" is what the 3 a.m. page feels like. Its sign-off, "You are receiving this because you are awake", is how on-call works.                                                                                                                                                           |
| **Swipe Payments**                | Stripe                                      | One letter off: it swipes the card, then swipes a cut for itself. "We swipe the card. Then we swipe a little more." mocks the 2.9% + 30¢ off the top.                                                                                                                                     |
| **Sand Hill Road Runner Capital** | Sand Hill Road (the VC street), Road Runner | Venture firms on Sand Hill Road; the cartoon bird is fast and never caught. Sign-off "Beep beep" is how a term sheet arrives and leaves.                                                                                                                                                  |
| **QuickBroke Books**              | QuickBooks                                  | Accounting software that shows you are broke, quickly. "Reconciled to the nearest regret" mocks rounding in the books.                                                                                                                                                                    |
| **Zenfail Support Desk**          | Zendesk                                     | A zen desk that fails you. "Ticket #4,096. We take your feedback seriously" is the stock apology from a queue.                                                                                                                                                                            |
| **Commonly Vulnerable & Exposed** | CVE: Common Vulnerabilities and Exposures   | The real name, read as a description of your stack. "Unsubscribe by patching" is the only way off the list.                                                                                                                                                                               |
| **Dr. Leslie Lamportant**         | Leslie Lamport                              | He wrote Paxos, the logical clock, and "Time, Clocks, and the Ordering of Events". Add "important" and it is a distributed-systems in-joke. Address `lamport.clock`; sign-off "Sent at an unspecified time, in an unspecified order" is the problem he solved. The game is called Quorum. |

### Pools: more than one source per kind

A kind is not one company. Each Thread draws its sender from a pool by the Company's seed and the
Thread's key, so one Thread keeps one sender, and a Company hears from several.

| Kind       | Pool (name, and what it plays on, and why it is funny)                                                                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud      | AWOL Web Services; **Gooble Cloud Platypus** (Google Cloud Platform; "We will sunset this feature in 6 to 8 weeks" is Google's habit); **Azzure Compute Services** (Azure; "400 regions, 3 of them up"); **Cloudscare** (Cloudflare; the bot check that doubts you. It sends only DDoS Mail: "Verifying you are human. We have our doubts.") |
| Monitoring | PagerDooty; **Grafauna** (Grafana; "Your graph has gone flat. That is not good." flatline is the alarm); **Centry** (Sentry; one letter off, and every event is billed by the cent: "Every event counts. Every event is billed.")                                                                                                            |
| Vendor     | Swipe Payments; **PayPaul** (PayPal; "Your funds are under review. Forever." is its account holds)                                                                                                                                                                                                                                           |
| Investor   | Sand Hill Road Runner Capital; **Sequel Capital** (Sequoia; every round has a sequel, and engineers say SQL as "sequel": "Every round deserves a sequel."); **Why Combinator** (Y Combinator; sign-off "Why not.")                                                                                                                           |
| Finance    | QuickBroke Books; **Zero Accounting** (Xero; one letter off, and the number on your balance: "Your balance, rounded to the nearest zero.")                                                                                                                                                                                                   |
| Customers  | Zenfail Support Desk; **Intercomatose** (Intercom; the chat widget in a coma: "Typically replies in a few business decades.")                                                                                                                                                                                                                |
| Mentor     | Dr. Leslie Lamportant; **Prof. Edsger Dijkstrah** (Dijkstra; "GOTO statements considered harmful, as are your SLOs"); **Grace Hoppertunity** (Grace Hopper; the nanosecond wire sign-off)                                                                                                                                                    |
| Security   | Commonly Vulnerable & Exposed; **National Vulnerability Dumpster** (the NVD; "Every advisory is critical until proven otherwise")                                                                                                                                                                                                            |

### Spam

| Name in the game                                   | Plays on                       | Why it is funny                                                                                                                                                                                  |
| -------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Datadug**                                        | Datadog                        | Dug in so deep you cannot leave. "Dashboards so deep you will never leave" mocks vendor lock-in and the bill.                                                                                    |
| **Slowflake Data Pillow**                          | Snowflake                      | A snowflake that is slow; a pillow in place of a lake. "Per-second billing, per-minute regret" mocks usage pricing.                                                                              |
| **/dev/null as a Service**                         | `/dev/null`, "X as a Service"  | The classic Unix joke that writes are fast because the data is discarded; "Fast. Durable. Webscale." is the old "MongoDB is web scale" meme. "Reads are an enterprise feature" is the punchline. |
| **Chad from TalentBro**                            | Recruiter spam, "bro" culture  | "Let us circle back on your circle back" is corporate speak turned in on itself.                                                                                                                 |
| **Incohere**                                       | Cohere, and AI startup pitches | An AI company whose product is the opposite of coherent. "Confidently wrong, at scale."                                                                                                          |
| **AWOL Web Services** at `awol-cloud.support`      | Phishing lookalike             | The tell is the domain, not the name: a real engineer checks the address. This is the lesson of Spam.                                                                                            |
| **Commonly Vulnerable & Exposed** at `cve-fyi.top` | Fake advisory                  | The same name on a `.top` domain, with a CVE id that the Glossary does not know.                                                                                                                 |

### Domains and sign-offs

| Domain                     | Plays on                                   | Why it is funny                                       |
| -------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| `awol.cloud`               | AWS                                        | See above.                                            |
| `pagerdooty.io`            | `.io`, the default TLD for developer tools | Every dev tool is a `.io`.                            |
| `roadrunner.vc`            | `.vc`, the TLD of venture firms            | A real TLD that exists for exactly this.              |
| `lamport.clock`            | Logical clocks                             | A hostname that could only mean one person.           |
| `cve.fyi`                  | `.fyi`                                     | "For your information", which is all a CVE gives you. |
| `.top`, `.support`, `.wtf` | Cheap TLDs that mail filters distrust      | The TLD is the first sign that the mail is not real.  |

### Teammates

Teammates draw a name from a pool and keep it for life.

| Name              | Plays on                                          |
| ----------------- | ------------------------------------------------- |
| **Bobby Tables**  | The xkcd "Little Bobby Tables" SQL injection joke |
| **Rae Condition** | Race condition                                    |
| **Ned Pointer**   | Null pointer                                      |
| **Sue Doe**       | `sudo`, and "John Doe"                            |
| **Kay Ubernetes** | Kubernetes, shortened to K8s                      |
| **Seb Fault**     | Segmentation fault                                |
| **Pat Mutex**     | Mutex                                             |
| **Dee Bugger**    | Debugger                                          |

### Writing a new name

1. Pick a real company, product, person, or term that engineers know.
2. Change one or two letters or add one word, so it reads as the original at a glance.
3. Make the change a critique: what the thing is known for, or what it costs.
4. Give it a domain and a one-line sign-off that carries the same joke a second time.
5. Never name a real person or company in a cruel way. The target is the practice, not the people
   ([Tone](#spam-and-phishing)). Real people appear only as a tribute, as Lamport does.

## What exists today

- **Senders and colour:** the Simulation's `nextAdvice` names who would say each fact and a Thread
  key. Each sender wears an app badge: a shape, a glyph, and a colour.
- **Threads:** a repeat with the same key joins its Thread; a Thread resolves when advice moves on
  and reopens when it returns. Deleting removes the whole Thread.
- **Letters:** every Mail has about five hand-written letters in `apps/web/src/game/copy/`, each
  with its own subject, greeting, and close. The Simulation names the topic and its values; the
  Inbox picks a letter by the Company's seed, the Thread, and the time, so a Company reads the same
  on every device and a Thread rarely repeats itself. Each teammate has their own footer.
- **Folders:** Inbox, Spam, Trash, with "Report spam" and "Not spam".
- **Actions:** Raise and Decline (investor), Approve hire (teammate), Open Team, Show on Board, and
  the phishing traps. Raise, Decline, and Approve hire send the real Messages.
- **World events:** every 45 sim seconds from Pre-seed, the Company's seed draws spam, a CVE, a
  teammate (hire request or rewrite proposal), or a slow-page customer ticket.

Not built yet: the CVE exploit clock, patch tasks, and the Data breach and Credential leak
incidents (a trap only raises a toast); Approve rewrite (it opens Team); Postmortem and Away mail;
the spam filter research; saving the Inbox; and the keyboard shortcuts in the reader. The funding
offer panel still exists beside the investor Mail.

## What happened in the Design

Step events (CPU credits gone, out of memory, drawer full, an alert fires, an incident starts or
ends, a hire, a deploy, a migration step) are Mail, not toasts. The party that would know writes:
the cloud for credits and memory, the alarm for alerts and incidents, the vendor for the drawer, a
teammate for hires and deploys. A repeat joins its Thread. Mail from a cloud, an alarm, or an
advisory plays the warning chime. Toasts remain for the click that just happened, and in a
Challenge, which has no Inbox.

## Mail bench (Sandbox)

Mail belongs to a Company, but a Sandbox shows the Inbox too, with a **bench** under the tabs for
trying Mail without waiting for it. Pick a sample, then Send, ×10, or ×50. Samples cover every kind:
one per sender kind, each CVE, a CVE misfiled in Spam, a hire request, a rewrite proposal, a customer
ticket, each spam pitch (phishing traps included), a **repeating thread** that reuses one key to
test Threads, and a random world event. **Resolve threads** resolves open advice; **Clear** empties
the Inbox. Sandbox Mail follows the same rules as a Company's, and the Inbox keeps the newest 40,
so ×50 also tests the cap. Challenges have no Inbox.

## Delivery order

1. **Senders and colour.** Give every fact a sender kind, move capacity facts to Cloud and Monitoring,
   add the colour chip and glyph, and keep Dr. Leslie Lamportant for strategy.
2. **Threads.** Group repeats, resolve and reopen threads, and replace the six-message rule.
3. **Offers and postmortems.** Move the funding round and the Postmortem into Investor and Teammate
   Mail with action buttons, and remove their panels.
4. **Teammates.** Named engineers, Shipped and Blocked mail, hire requests, and rewrite proposals.
5. **CVEs.** Disclosure, exposure, the patch task, the exploit clock, and the Data breach incident.
6. **Spam.** The folder, the filter, vendor pitches, fake invoices, phishing, and fake CVE alerts.
