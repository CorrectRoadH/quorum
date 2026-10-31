# Quorum is an endless incremental game simulated in the browser

Status: accepted. Supersedes [ADR 0002](./0002-a-run-is-one-bounded-month.md),
[ADR 0003](./0003-server-authoritative-simulation.md),
[ADR 0004](./0004-faithful-cluster-mechanics.md),
[ADR 0005](./0005-keep-the-kubernetes-port-behind-one-adapter.md), and
[ADR 0006](./0006-sample-traffic-per-tick.md).

The game is no longer a bounded one-month scenario. It is an incremental systems game in the style of
Upload Labs and Factorio: a Company grows through Eras, ends in an Exit, and the player founds the next
Company with Legacy. The Simulation is a pure TypeScript module that runs in the browser. It models
the behaviors the player optimizes (capacity, concurrency models, queues, latency, errors, money)
directly, instead of driving a Kubernetes simulation.

Build `49d571b` already implements this direction. This record and the design in
[docs/gdd](../gdd/README.md) make it explicit.

Considered options:

- Keep the bounded month. Rejected: it gives no long-term goals, which the game now needs to hold
  players for many hours.
- Keep a server-authoritative simulation. Rejected for the Company: an idle game must run offline,
  must simulate hours of absence in under a second, and must stay cheap per player. The server keeps
  only the jobs that need trust: Challenge verification, histograms, and the daily drill.
- Keep the Kubernetes port. Rejected: it does not model the numbers the player optimizes, and its
  bundle and CPU cost do not fit a browser game that steps ten times a second.

## Consequences

- The Simulation must be deterministic, so the server can verify a Challenge by replaying the same
  Design, seed, and actions.
- Offline progress is a coarse re-run of the same Simulation ([Simulation](../gdd/04-simulation.md#offline-progress)).
- Kubernetes appears as a Component with modeled behavior, not as a faithful cluster, and the game no
  longer generates a manifest.
- The vocabulary changes. [CONTEXT.md](../../CONTEXT.md) lists the new terms and the retired ones.
