# Keep the Kubernetes port behind one adapter

The simulation uses `@ngrok/webernetes` pinned to `0.6.1`, and reaches it through one adapter
module that exposes only what the game needs: apply a design, step a tick, read cluster state,
read request events. The game never imports the port anywhere else.

Measured before deciding: the port bundles to 516 KB minified and 137 KB gzipped for a Worker,
runs inside `workerd` with a two-replica deployment, answers simulated requests, and reproduces
its state under the same seed and step sequence. A full 900-tick run at 50 to 200 requests per
tick costs seconds of CPU.

Considered options: writing a purpose-built engine, and vendoring a fork. A purpose-built
engine means rebuilding reconciliation, watches, retries, probe timers, rollout, and endpoint
readiness, and a hand-rolled version would be less faithful than the port. A fork means owning
all future upstream work.

Revisit this decision when a scenario needs node-level capacity or a capacity-aware scheduler,
when upstream stalls or changes a required API, or when a deployed Worker hits a memory or CPU
limit that stepping cannot avoid.
