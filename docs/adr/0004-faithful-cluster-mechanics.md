# Faithful cluster mechanics, invented load and economics

Status: superseded by [ADR 0007](./0007-endless-idle-game-in-the-browser.md).

A faithful Kubernetes simulation runs the cluster. Pods, deployments, replicas, rollout,
probes, restarts, crash loops, services, DNS, and endpoint routing behave like Kubernetes, and
that behaviour is taken on trust from the port rather than reimplemented.

The game invents everything the player is scored on: demand, latency under load, capacity and
backlog, request failures, cost, and income. The cluster port does not model resource requests
or limits, node capacity, a scheduler with meaning, evictions, or autoscaling, so those
numbers cannot come from it. The game's latency model reads real cluster state, so a crash loop
or a lost endpoint visibly worsens the score.

Considered options: extending the port so capacity and scheduling are real (rejected: it means
owning a fork of a pre-1.0 dependency), and dropping the invented metrics in favour of pure
Kubernetes behaviour (rejected: it deletes the numbers the game scores).

## Consequences

- The catalog splits into two families. A Cluster Component maps to Kubernetes resources and
  produces a manifest; a Managed Component exists outside the cluster and is modelled entirely
  by the game.
- The manifest is a teaching artifact and a read-only one. The player never edits it, because
  the diagram is the input.
- Adding storage or scheduled workloads later means adding Kubernetes kinds the port does not
  have, which is a fork-sized decision.
