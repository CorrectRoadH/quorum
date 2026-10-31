# Quorum is an endless incremental game simulated in the browser

Quorum is an incremental systems game in the style of Upload Labs and Factorio. A Company grows
through Eras, ends in an Exit, and the player founds the next Company with Legacy. The Simulation is a
pure TypeScript module that runs in the browser. It models the behaviors the player optimizes
(capacity, concurrency models, queues, latency, errors, and money) directly.

Considered options:

- Bounded sessions, such as one simulated month per play. Rejected: they give no long-term goals,
  and the game must hold players for many hours.
- A server-authoritative Simulation. Rejected for the Company: an idle game must run offline, must
  simulate hours of absence in under a second, and must stay cheap per player. The server keeps only
  the jobs that need trust: Challenge verification, histograms, and the daily drill.
- Driving a faithful Kubernetes simulation. Rejected: it does not model the numbers the player
  optimizes, and its bundle size and CPU cost do not fit a browser game that steps ten times a second.

## Consequences

- The Simulation must be deterministic, so the server can verify a Challenge by replaying the same
  Design, seed, and actions.
- Offline progress is a coarse re-run of the same Simulation ([Simulation](../gdd/04-simulation.md#offline-progress)).
- Kubernetes appears as a Component with modeled behavior, not as a simulated cluster.
