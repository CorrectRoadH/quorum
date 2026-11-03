<p align="center">
  <img src="docs/images/hero.png" alt="Quorum: grow a startup one bottleneck at a time" width="100%" />
</p>

<p align="center">
  <b>An incremental systems game for software engineers.</b><br />
  Play it at <a href="https://quorum.elianiva.com">quorum.elianiva.com</a>.
</p>

---

You found a startup with one virtual machine in a garage. Users send requests. You wire
Components on a board, choose the language and runtime each server runs, and fix one bottleneck
after another, until the company serves billions of people and goes public.

Every mechanic models real behavior. PHP-FPM workers wait on the database. A Node.js event loop
stalls on bcrypt. A JVM is slow until it warms up. A cache stampedes when it restarts. An average
hides the p99. If you have been paged at 3 AM, you know the problems. The game asks you to fix
them with numbers.

![A Series A board: CDN and WAF in front of a load balancer, three Go App Servers, and a Database marked as the bottleneck](docs/images/board.png)

## How to play

### Start small

The first Company is one Users node, one App Server, Payments, and Analytics. Requests flow
along the Links you draw. Served requests earn Cash, which waits in the Payments drawer until you
collect it. Analytics samples traffic and turns it into Insight, the research currency.

![The Garage Era: Users, one App Server running Apache mod_php, Payments, and Analytics](docs/images/garage.png)

### Find the bottleneck

The Simulation is a flow network. At any time, one Node limits the most revenue, and the Board
marks it. Its card says why: out of CPU, credits, RAM, workers, or connections. Each kind of limit
needs a different fix, and more hardware fixes only some of them.

Each fix moves the bottleneck. Faster App Servers send more queries to the Database. A Cache
removes Database load and adds stale reads. A Read Replica adds read capacity and adds
replication lag. The bottleneck is the content.

### Choose a Stack, not a tier

No option strictly beats another. Each App Server runs a Stack: a runtime and a framework. Go
handles many idle connections cheaply, and its garbage collector takes CPU when the heap fills.
Rust is fast and slow to write. PHP-FPM is slow per request and cannot leak memory between
requests. The right choice depends on your Design.

<p align="center">
  <img src="docs/images/runtime.png" alt="The inspector for an App Server, with the runtime list: mod_php, PHP-FPM, Puma, Node.js, Gunicorn, Go, Tomcat, Kestrel, BEAM, and Tokio" width="640" />
</p>

### Research, raise, repeat

Insight buys Research: new Components, runtime variants, techniques, and more visibility. Users
grow while Apdex stays above the Era target, and they leave when it drops.

![The Research tree, with Infrastructure, Data, Reliability, and Observability tracks by Era](docs/images/research.png)

At each Milestone, investors offer a Funding round: Cash for Equity. Each Era brings new request
kinds that break the Design in a new way.

| Era      | Leave at               | New request kinds         | New failure mode                                 |
| -------- | ---------------------- | ------------------------- | ------------------------------------------------ |
| Garage   | 1,000 users            | `page`, `read`            | One box runs out of CPU, then RAM                |
| Pre-seed | 5,000 users            | `write`, `login`          | Database contention, connections, CPU-heavy work |
| Seed     | 25,000 users           | `search`, `upload`, `bot` | Unlike workloads, abuse, large payloads          |
| Series A | 150,000 users          | `media`, `rt`, `buy`      | Zone failures, egress cost, money correctness    |
| Series B | 1,000,000 users        | `job`, `report`, `ai`     | OLTP against OLAP, GPU economics, team scaling   |
| Series C | 10,000,000 users       | `feed`, `hook`, `push`    | Fan-out, hot keys, geography, region failures    |
| Pre-IPO  | 50,000,000 users + IPO | —                         | Compliance, disaster recovery, margin            |
| Public   | Endless                | —                         | Quarterly guidance                               |

### Survive Incidents

An incident director tests the weakest part of your Design: a zone outage, a cache stampede, a
retry storm, a CVE. Each Incident ends in a Postmortem with one action item. Handle an Incident
type by hand, and you can write a Runbook for it.

![The Zone Outage Sandbox while zone A fails: both App Servers and the Database are down, and Apdex is 0](docs/images/zone-outage.png)

### Read your Mail

Advice, offers, invoices, CVE disclosures, and spam arrive in the Inbox as letters from people and
systems in the game. Some carry action buttons. Some are traps.

<p align="center">
  <img src="docs/images/inbox.png" alt="The Inbox with a letter from the mentor, Dr. Leslie Lamportant" width="640" />
</p>

### Exit and start again

A Company ends in an Exit: an acqui-hire, an acquisition, an IPO, or stepping down. Equity times
Valuation pays Legacy. Legacy buys permanent Perks, and your saved Playbooks carry into the next
Company. Exits unlock new Ventures, such as Fintech, Streaming media, or an AI startup, and
Mutators that make a Company harder for more Legacy.

### Outside the Company

- **Sandbox.** Guided Sandboxes teach one mechanic each from a fixed Design, such as Connection
  Limit, Stampede, GC Pauses, or Hot Key. The free Sandbox has everything unlocked.
- **Challenges.** Fixed puzzles scored on cost, tail latency, and complexity. The server re-runs
  each Replay and places your result on a histogram of every player's best. You see a
  percentile, never a rank.

## Learn more

- [Game design document](docs/gdd/README.md) — the full design, from simulation to balancing.
- [Reality check](docs/gdd/reality-check.md) — the real behavior behind each rule.
- [Engineering glossary](docs/gdd/glossary.md) — the engineering terms the game teaches.

## Contribute

To report a bug, propose an idea, or build the game from source, read
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

Quorum is licensed under the [GNU General Public License v3.0 or later](LICENSE).
