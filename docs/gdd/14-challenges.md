# 14. Challenges and achievements

[Index](./README.md) · Previous: [Exit and Legacy](./13-prestige.md) · Next: [Interface and game feel](./15-ui-ux.md)

## Challenges

A **Challenge** is a fixed puzzle, separate from the company. It gives a brief, a fixed demand,
a fixed palette, a fixed budget, and a duration. The player builds a design and runs it. A Challenge
is complete when the design meets its targets.

This mode follows Opus Magnum: a crude solution is easy, and the depth is in improving it
([Influences](./02-influences.md#opus-magnum-and-zachtronics)).

### Scoring

Every completed Challenge scores three axes. Lower is better on all three.

| Axis       | Measure                              |
| ---------- | ------------------------------------ |
| Cost       | Burn per second at the target load   |
| Tail       | p99 latency over the run             |
| Complexity | Number of Nodes plus number of links |

Each axis has a **histogram** of every player's best result. The player sees where they fall, for
example "Cost: better than 72% of players". The game never shows a rank or a top-10 list. The
question is "can you reach the 70th percentile", not "can you be first".

The three axes conflict. A cheap design has a long tail. A short tail needs more Nodes. So the player
picks a direction, and each player's best results usually come from different designs.

### Rules

- Challenges unlock by Era reached in any company.
- A Challenge's palette is fixed. Legacy perks do not apply. Every player has the same tools.
- The seed is fixed. Incidents in a Challenge are scripted and the same for everyone.
- Results upload as a design plus a seed, and the server re-runs them to verify. The server score is
  the authoritative one, and a score on the player's device is provisional until the server confirms
  it. The simulation is
  deterministic ([Simulation](./04-simulation.md#determinism-and-randomness)).
- Rewards: a badge, and Legacy on first completion (1 to 10 ★ by difficulty). No Cash, no power.

### Challenge list

Each Challenge is inspired by a real event or a real engineering problem. Briefs name the event as
an inspiration; the numbers are the game's.

| #   | Challenge                      | Unlock   | Inspired by                                                           | The problem                                                          |
| --- | ------------------------------ | -------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Hello, World                   | Garage   | Every first deploy                                                    | Serve 20 rps of `page` on one box under $0.50/s                      |
| 2   | Split the Box                  | Garage   | The first scaling step at most companies                              | App and database share a box; reach 100 rps                          |
| 3   | Slashdotted                    | Pre-seed | The Slashdot effect                                                   | ×10 traffic for 3 minutes with a fixed budget                        |
| 4   | C10k                           | Pre-seed | Dan Kegel's C10k problem (1999)                                       | 10,000 concurrent slow clients; process-per-request runtimes fail    |
| 5   | The Event Loop                 | Pre-seed | Node.js "Don't block the event loop"                                  | Node.js only; 5% `login`; p99 under 300 ms                           |
| 6   | Too Many Connections           | Pre-seed | PostgreSQL connection limits                                          | 40 App Servers, one Postgres; no `refused` errors                    |
| 7   | Stack Overflow on a Shoestring | Seed     | Stack Overflow serving huge traffic from a small number of servers    | Serve the target with at most 12 Nodes                               |
| 8   | The N+1                        | Seed     | ORM lazy loading                                                      | Rails with N+1; fix it with the fewest Dev Hours                     |
| 9   | Thirteen Engineers             | Seed     | Instagram had 13 employees when Facebook acquired it (2012)           | Reach the target with a team of 13 and a fixed Dev Hour budget       |
| 10  | Credential Stuffing            | Seed     | Common attacks on login endpoints                                     | Survive a `login` bot flood without blocking real users              |
| 11  | Black Friday                   | Series A | Retail peak days                                                      | A known spike at a known hour; minimize cost                         |
| 12  | us-east-1                      | Series A | Several AWS us-east-1 outages                                         | A zone dies at minute 5; keep 99.9%                                  |
| 13  | Exactly Once                   | Series A | Payment idempotency                                                   | Checkout with retries and no duplicates                              |
| 14  | Two Million Sockets            | Series A | Phoenix reached 2 million WebSocket connections on one server (2015)  | Hold the most `rt` connections per dollar                            |
| 15  | Pokémon GO                     | Series A | Pokémon GO launch traffic reached about 50× the planned target (2016) | Demand ×50 of the forecast within 10 minutes                         |
| 16  | Healthcare Launch Day          | Series A | The healthcare.gov launch (2013)                                      | A fixed design with many faults; fix it under time pressure          |
| 17  | Thundering Herd                | Series A | Reconnect storms                                                      | A Realtime Hub restart with 1 million clients                        |
| 18  | Read States                    | Series B | Discord moved a service from Go to Rust to remove GC spikes (2020)    | A hot service with a strict p99; any runtime                         |
| 19  | The Fail Whale                 | Series B | Twitter's timeline scaling problems                                   | Serve `feed` for accounts with 10 million followers                  |
| 20  | Reports at Noon                | Series B | Analytical queries on transactional databases                         | Add dashboards without hurting checkout                              |
| 21  | GPU Economics                  | Series B | Self-hosted inference against hosted APIs                             | Serve `ai` at the target with a positive margin                      |
| 22  | Metastable                     | Series B | Metastable failures in distributed systems                            | A retry storm in progress; recover with the fewest changes           |
| 23  | Regex of Doom                  | Series B | Cloudflare outage, 2 July 2019                                        | A WAF rule pins CPU worldwide; restore service                       |
| 24  | 43 Seconds                     | Series C | GitHub network partition, 21 October 2018                             | A short partition between regions; avoid split brain                 |
| 25  | Follow the Sun                 | Series C | Global daily peaks                                                    | Four regions with offset peaks; minimize cost                        |
| 26  | Celebrity                      | Series C | Hot keys from viral accounts                                          | One key receives 30% of reads                                        |
| 27  | Gone From the Internet         | Series C | Facebook outage, 4 October 2021                                       | A routing change removes all regions; restore with a staged rollout  |
| 28  | The Typo                       | Series C | Amazon S3 outage, 28 February 2017                                    | A capacity removal command goes wrong; recover a data tier           |
| 29  | Leap Second                    | Pre-IPO  | The 2012 leap second                                                  | Clock jumps across a region                                          |
| 30  | Rule of 40                     | Pre-IPO  | The SaaS Rule of 40                                                   | Reach growth plus margin of 40 from a loss-making design             |
| 31  | Postgres for Everything        | Pre-IPO  | The "just use Postgres" argument                                      | Serve every kind with only Postgres Components                       |
| 32  | Five Nines                     | Public   | 99.999% availability targets                                          | 99.999% of requests across four calendar weeks of scripted incidents |

## The daily drill

Every calendar day (real day, UTC), all players get the same short Challenge: a seeded design with
a seeded incident. Results go on a daily histogram. The drill takes 5 to 15 minutes. It is optional
and never rewards streaks, so missing a day costs nothing.

## Achievements

Achievements reward knowledge, unusual builds, and real engineering moments. They do not reward hours
played. Some unlock Mutators or Ventures ([Exit and Legacy](./13-prestige.md)).

| Achievement             | Condition                                                                     | Unlocks                          |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------- |
| Hello, World            | Serve the first request                                                       | —                                |
| It Works on My Machine  | Ship a bad deploy                                                             | —                                |
| Split Brain             | Split the database onto its own Node                                          | —                                |
| Averages Lie            | Research `percentiles` while p99 is more than 5× the mean                     | —                                |
| Shared Nothing          | Reach Seed with only PHP-FPM servers and no memory incident                   | —                                |
| Blocked                 | Have a Node.js service whose p99 rises by 100 ms from one kind                | —                                |
| Two Hard Things         | Have a stale-read incident on a cache                                         | —                                |
| Off by One Region       | Serve a user from a region more than 150 ms away                              | —                                |
| Little's Law            | Fix an app server bottleneck by fixing the database                           | —                                |
| Default Alive           | Reach IPO without raising any round                                           | Bootstrapped indie               |
| Polyglot                | Run five languages in production at once                                      | —                                |
| Monoglot                | Reach IPO with one language                                                   | Mutator: Single language         |
| Big Rewrite             | Migrate every service to a new language in one company                        | —                                |
| Strangler               | Finish a migration in four traffic steps with no errors                       | —                                |
| Conway's Law            | Have more services than teams, then fix it                                    | —                                |
| Fallacies               | Experience all eight fallacies of distributed computing in incidents          | —                                |
| Quorum                  | Run a wide-column store with R + W > N across three regions                   | —                                |
| Eventually              | Run R = 1, W = 1 at a billion users                                           | —                                |
| Nines                   | Hold 99.99% for a calendar week                                               | Mutator: Strict SLO              |
| Five Nines              | Complete the Five Nines Challenge                                             | —                                |
| Thundering Herd         | Survive a reconnect storm with no errors                                      | —                                |
| Metastable              | Recover from a retry storm                                                    | —                                |
| Blameless               | Write 50 postmortems                                                          | —                                |
| Runbook                 | Have a runbook resolve an incident with no player action                      | —                                |
| Chaos Monkey            | Survive 100 random terminations                                               | Mutator: Chaos Monkey            |
| Hug of Death            | Survive a ×10 spike with no lost users                                        | Mutator: Hacker News front page  |
| Egress Shock            | Have egress be the largest line on the bill                                   | —                                |
| FinOps                  | Run a fleet with reserved, on-demand, and spot Nodes at once                  | —                                |
| Spot the Difference     | Survive a spot reclaim wave with no errors                                    | —                                |
| Warm Start              | Scale a JVM service during a spike with no p99 regression                     | —                                |
| Zero GC                 | Run a Rust service at 100,000 rps                                             | —                                |
| Let It Crash            | Have an Elixir service survive 1,000 crashes with no failed neighbor requests | —                                |
| Postgres for Everything | Reach Series B with only Postgres data Components                             | Mutator: Postgres for everything |
| No Cache                | Reach Series A with no Cache and no CDN                                       | Mutator: No caches               |
| Celebrity               | Serve a 10-million-follower post with no hot key errors                       | —                                |
| Follow the Sun          | Serve four regions with no Node above 70% at its local peak                   | —                                |
| Rule of 40              | Reach a Rule of 40 score of 80                                                | —                                |
| Beat and Raise          | Beat guidance eight quarters in a row                                         | —                                |
| Unicorn                 | Reach a $1 billion valuation                                                  | —                                |
| Decacorn                | Reach a $10 billion valuation                                                 | —                                |
| Everyone Online         | Reach 6 billion users                                                         | —                                |
| Serial Founder          | Exit with every Venture                                                       | —                                |
| Histogram               | Reach the 90th percentile on any axis of any Challenge                        | —                                |
| Pareto                  | Reach the 70th percentile on all three axes of one Challenge with one design  | —                                |
