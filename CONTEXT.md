# Quorum

An incremental systems game. A player grows a startup by building and tuning the system that serves
its users, one bottleneck at a time. The full design is in [docs/gdd](docs/gdd/README.md).

This file is the game vocabulary. Code, UI copy, and the design documents use these words. Real
engineering terms that the game teaches are in the
[engineering glossary](docs/gdd/glossary.md).

## Language

### The company

**Company**:
One play-through, from founding to Exit.
_Avoid_: run, save, game, playthrough

**Venture**:
The kind of Company the player founds. It sets the request mix, demand shape, constraints, and signature incidents.
_Avoid_: scenario, mode, industry, class

**Mutator**:
An optional rule that makes a Company harder in exchange for more Legacy.
_Avoid_: modifier, handicap, challenge

**Era**:
A stage of the Company, from Garage to Public. Each Era brings new Request kinds and a new failure mode.
_Avoid_: stage, level, chapter, tier

**Milestone**:
The user count, and in the Pre-IPO Era the checklist, that ends an Era.
_Avoid_: goal, threshold, gate

**Funding round**:
The offer of a Grant for Equity at a Milestone. The player can raise or decline.
_Avoid_: investment, raise (as a noun), stage

**Users**:
The people the Company serves. They send demand, and they grow or leave with Apdex.
_Avoid_: customers, players, audience, DAU

### The design

**Board**:
The surface where the player places Nodes and draws Links. One Board per region.
_Avoid_: canvas, map, grid, lab

**Component**:
An entry in the fixed catalog that a player can place, with its own cost, capacity, and options.
_Avoid_: building, node type, item

**Managed Component**:
A Component that stands for a third-party service. It costs nothing to place, charges per use, and has outages the player cannot fix.
_Avoid_: external service, SaaS, vendor

**Node**:
One placed copy of a Component, with its own size, options, and card.
_Avoid_: instance, box, entity, machine

**Link**:
A directed network call from one Node to another, with a latency, timeout, and retry policy.
_Avoid_: edge, wire, connection, pipe

**Design**:
The Nodes and Links on all Boards of a Company.
_Avoid_: topology, blueprint, layout, architecture

**Stack**:
The language, runtime variant, and framework that an App Server or Worker runs.
_Avoid_: tech, build, loadout

**Instance type**:
The family and size of a compute or data Node, which sets its vCPU, RAM, and price.
_Avoid_: level, tier, spec

**Zone**:
A failure domain inside a region. Every zoned Node sits in one; a call between zones adds latency and Egress, and a zone outage takes down every Node in it.
_Avoid_: availability zone, AZ (in UI copy), datacenter, rack

**Region**:
A continent the Company runs in: North America, Europe, Asia-Pacific, or South America. Each open region has its own Users and its own tab on the Board; a call between regions pays the round trip.
_Avoid_: datacenter, cloud region (in UI copy), geo

**Region tab**:
The Board's view of one region: its Nodes, the global ones, and the Nodes elsewhere they link to. Every tab shows one Design.
_Avoid_: board (for a single region), map, planet

**Quorum**:
The replicas a Wide-column Store waits for: R on a read and W on a write, of N per key. R + W > N means every read sees the latest write.
_Avoid_: consensus (that is Distributed SQL), majority

**Spread**:
A Wide-column Store or Distributed SQL Node that replicates across the open regions, so it serves through a Region outage.
_Avoid_: global table, geo-replicated

**Hot key**:
One key that takes a large share of reads, so the shard that holds it saturates while the rest idle.
_Avoid_: celebrity problem (in UI copy), hotspot

**Copy**:
One of the identical machines a scaled App Server or Worker Node runs. An Autoscaler adds and removes copies; the Node stays one card.
_Avoid_: replica (that is the read replica Component), instance, pod (in UI copy)

**Standby**:
A second, idle box for a data Node in another zone. It takes over within seconds when the Node's zone fails, and doubles the Node's Burn.
_Avoid_: failover node, secondary, hot spare

**Circuit breaker**:
A switch on a Link that stops its calls for a few seconds once half of them fail, so retries cannot keep a struggling Node overloaded.
_Avoid_: fuse, kill switch

**Load shedding**:
An App Server near saturation drops the lowest-value request kinds first, so checkouts survive an overload.
_Avoid_: throttling, rate limiting

**Data Warehouse**:
A Component that answers report scans in columns, paid per scan, so reports stop evicting the primary Database's buffer cache.
_Avoid_: OLAP, analytics DB

**GPU Node**:
A Component that serves AI prompts in tokens per second; cheaper per prompt than the LLM API only while it stays busy.
_Avoid_: inference server, GPU box

**Service**:
A codebase with its own deploy pipeline, owned by one Team. Every App Server and Worker belongs to one.
_Avoid_: app, microservice, group

**Playbook**:
A saved part of a Design that the player can place in one action. Playbooks survive Exits.
_Avoid_: blueprint, template, preset

### Traffic

**Request kind**:
A class of work that Users send, such as `page`, `write`, or `ai`, with a value, a cost profile, and an Apdex target.
_Avoid_: request type, traffic type, file type

**Backend kind**:
A class of work that a Node sends to the data tier or to a Managed Component, such as `q-read` or `infer`. It earns nothing by itself.
_Avoid_: query type, internal request

**Stranded**:
Requests that reach a Node with no outbound Link that accepts them. They count as errors.
_Avoid_: dropped, lost, orphaned

**Task**:
The backend kind an App Server sends to a Queue for the part of a request that can go async. A Worker runs it later; the user waits only for the enqueue.
_Avoid_: job (a later request kind), message

**Queue depth**:
Tasks a Queue holds that no Worker has taken yet. It is saved with the Game, and a growing depth is the first sign Workers are too slow.
_Avoid_: backlog (the Team's work list), lag

**Egress**:
The Burn for bytes sent to the internet: responses from App Servers at the origin price, and pages a CDN answers at the cheaper edge price. Billed from Seed.
_Avoid_: bandwidth cost, transfer fee

### The simulation

**Simulation**:
The pure model that turns a Design and demand into the Ledger.
_Avoid_: engine, solver, kernel

**Step**:
One advance of the Simulation, 100 ms of sim time.
_Avoid_: tick, frame, turn

**Sim clock**:
The clock for rates and operational events. One sim second is one real second at 1× speed.
_Avoid_: game time, real time

**Calendar**:
The compressed clock for days, weeks, and quarters. One sim second is one calendar minute.
_Avoid_: date, in-game time

**Ledger**:
Every figure the Simulation derives at a Step. It is the single source of truth for every number the game shows.
_Avoid_: stats, state, model

**Capacity**:
The most work a Node can do per second, set by its tightest limit: CPU, slots, memory, connections, or network.
_Avoid_: throughput, power, max rps

**Utilization**:
Offered work divided by Capacity.
_Avoid_: load (alone), usage

**Bottleneck**:
The one Node whose extra Capacity would earn the most revenue right now. The Board marks it.
_Avoid_: chokepoint, weak link

**Apdex**:
The share of requests that satisfy users, with tolerating requests counted as half. It sets revenue and user growth.
_Avoid_: satisfaction, happiness, patience

### Reliability

**Incident**:
An event that stresses the Design, chosen by the incident director to test a weakness.
_Avoid_: event, disaster, outage (as the general term)

**SLO**:
The availability target for the current Era, measured per calendar week.
_Avoid_: uptime goal, target

**Error budget**:
The failures that the SLO allows. Spending it changes team velocity.
_Avoid_: downtime allowance

**Retry storm**:
A metastable failure: a brief slowdown plus retries keeps a Node overloaded after the trigger ends.
_Avoid_: thundering herd, cascade

**DR drill**:
A scripted outage of the home region that measures recovery time (RTO) and data lost (RPO) for the IPO checklist.
_Avoid_: disaster test, failover test

**IPO checklist**:
The six things Pre-IPO must hold at once to go public: users, reliability, SOC 2, a passed DR drill, data residency, and the Rule of 40.
_Avoid_: IPO requirements, gates

**Quarter**:
Seven calendar days of the Public Era. The player sets guidance at its start; beating it raises the Valuation multiple, missing it lowers it.
_Avoid_: season, period

**Guidance**:
The revenue growth and margin the Company promises for a Quarter.
_Avoid_: forecast, target (alone)

**Mail**:
One message to the player from a person or system in the game: advice, an offer, or a report. It stays until the player deletes it, and it can carry action buttons.
_Avoid_: notification, tip, hint, toast

**Sender**:
The party a Mail comes from: a cloud provider, a vendor, a teammate, an investor, and so on. Each has a kind, a name, an address, and a colour.
_Avoid_: author, source, bot

**Thread**:
Mail about one thing from one Sender. A repeat joins the thread; the thread resolves when its cause is gone.
_Avoid_: conversation, chain

**CVE**:
A vulnerability disclosed in software the Design runs. It starts an exploit clock until the player patches it.
_Avoid_: bug, exploit, vulnerability (alone)

**Spam**:
Mail that no Sender in the game would really send: pitches, fake invoices, phishing. Acting on a trap has a cost; opening it has none.
_Avoid_: junk, noise

**Inbox**:
The panel that lists Mail, like an email app, with an Inbox folder and a Trash folder.
_Avoid_: notification center, feed, log

**Postmortem**:
The card after an Incident that records its cost and opens one action item: a prevention that, until researched, makes the Incident twice as likely.
_Avoid_: report, summary, review

**Runbook**:
An automatic response to one Incident type, written after the player has handled it by hand.
_Avoid_: script, macro, automation

### People

**Team**:
A group of Engineers that owns one or more Services, or a platform, SRE, data, or security area.
_Avoid_: squad, department, crew

**Engineer**:
A hired person who produces Dev Hours. The founder is the first Engineer.
_Avoid_: worker, developer, employee

**Dev Hours**:
The currency of engineering work, spent on Features, tasks, migrations, and debt paydown.
_Avoid_: DH points, effort, time

**Feature**:
A product change built with Dev Hours that grows the market or revenue and changes load.
_Avoid_: upgrade, perk, improvement

**Rollout**:
The share of users who have a Feature: 5%, 25%, 50%, or 100% behind a Feature Flag.
_Avoid_: release, exposure (in UI copy), percentage

**Adoption**:
The share of a Feature's users who use it, which grows over calendar time after it ships.
_Avoid_: usage, uptake, engagement

**Lift**:
A Feature's realized effect, measured against the users who do not have it yet.
_Avoid_: impact, uplift, result

**Upkeep**:
The share of a Service's Dev Hours that keeps its live Features running.
_Avoid_: maintenance tax, KTLO, overhead

**Tech debt**:
A per-Service percentage that slows Dev Hours and raises Incident chances until paid down.
_Avoid_: mess, cruft

### Money and knowledge

**Cash**:
The money the Company holds. Served requests earn it; Nodes, Burn, and salaries spend it.
_Avoid_: capital, budget, wallet, funds

**Burn**:
The Cash spent per second on everything that exists: Nodes, storage, egress, third parties, and salaries.
_Avoid_: upkeep, opex, running cost

**Revenue**:
The Cash earned per second from served requests and subscriptions.
_Avoid_: income (in UI copy), earnings

**Payments drawer**:
Where Revenue waits until the player collects it, until research automates collection.
_Avoid_: collector, wallet, pending

**Insight**:
The research currency, earned from sampled traffic.
_Avoid_: science, research points, XP

**Analytics**:
The Component that samples the traffic of linked Nodes and produces Insight.
_Avoid_: telemetry node, research node

**Research**:
An unlock bought with Insight: a Component, a variant, a technique, or more visibility.
_Avoid_: tech, upgrade, skill

**Dashboard**:
The full-screen view of Charts that shows the Design over time. It opens with `metrics` and grows with each visibility research.
_Avoid_: monitoring screen, Grafana (in UI copy), stats page

**Chart**:
One graph or number on the Dashboard, such as p99 latency or error budget left.
_Avoid_: panel (that is a side panel such as the Inspector), widget, tile

**Tradeoff card**:
The forced choice shown when the player picks an option, with its six-axis profile and a preview on the player's own Design.
_Avoid_: tooltip, info card, lesson

### Prestige

**Equity**:
The founder's share of the Company. It starts at 100% and falls with each Funding round.
_Avoid_: ownership, stake

**Valuation**:
The Company's worth in real dollars: annual revenue, converted at the valuation scale, times a multiple set by the Rule of 40.
_Avoid_: score, net worth, market cap (before IPO)

**Exit**:
The end of a Company: acqui-hire, acquisition, IPO, or stepping down. It pays Legacy.
_Avoid_: prestige, reset, ascend, portal

**Legacy**:
The permanent currency earned at Exit and spent in the Legacy shop.
_Avoid_: prestige points, souls, tokens

**Founder**:
The player across Companies: the record of Legacy, Legacy shop perks, Playbooks, unlocked Ventures and Mutators, Achievements, Glossary entries met, and the company history. It survives every Exit.
_Avoid_: profile, account, player save, meta

**Perk**:
A permanent upgrade bought in the Legacy shop, with levels.
_Avoid_: upgrade, talent, bonus

**Achievement**:
A badge the Founder earns for knowledge, an unusual build, or a real engineering moment, never for hours played. Some unlock a Venture or a Mutator.
_Avoid_: trophy, badge (in UI copy), quest

**Glossary**:
The in-game list of engineering terms, transcribed from the design glossary. Entries the Founder has met in play are marked.
_Avoid_: encyclopedia, codex, wiki

### Outside the Company

**Sandbox**:
A Board outside any Company that changes nothing in a Company. A guided Sandbox teaches one mechanic from a fixed Design. The free Sandbox has everything unlocked and unlimited Cash.
_Avoid_: lab, tutorial, lesson, scenario, creative mode

**Sandbox track**:
The ordered guided Sandboxes for one Era.
_Avoid_: course, campaign, chapter

**Challenge**:
A fixed puzzle outside the Company, scored on cost, tail latency, and complexity histograms.
_Avoid_: level, mission, scenario, puzzle (in UI copy)

**Replay**:
A Challenge result as the server receives it: the Design, the run actions by Step, and the Simulation version. The server re-runs it and keeps its own score.
_Avoid_: recording, save, solution file

**Daily drill**:
The short Challenge every player gets on one UTC day, derived from the date. It never rewards streaks.
_Avoid_: daily challenge, daily quest, streak

**Histogram**:
The distribution of every player's best result on one axis of one Challenge, per Simulation version. Players see their percentile, never a rank.
_Avoid_: leaderboard, ranking, high score

## Relationships

- A **Company** has one **Venture**, any number of **Mutators**, and passes through **Eras** in order.
- A **Design** is made of **Nodes** and **Links** on one or more **Boards**.
- A **Node** is a copy of one **Component**. Compute Nodes run a **Stack** and belong to a **Service**.
- A **Service** is owned by one **Team**. **Engineers** in Teams produce **Dev Hours**.
- The **Simulation** turns the Design into the **Ledger** each **Step**. Every number on screen comes from the Ledger.
- **Analytics** turns sampled traffic into **Insight**. Insight buys **Research**.
- An **Exit** turns **Equity** × **Valuation** into **Legacy**.
- The **Founder** keeps **Legacy**, **Perks**, and **Playbooks** from one **Company** to the next.
- A **Sandbox track** holds guided **Sandboxes** for one **Era**. **Challenges** form a separate sequence across Eras; completing one opens the next.
- A **Challenge** result uploads as a **Replay**; the server re-runs it and places each axis on that Challenge's **Histograms**.
