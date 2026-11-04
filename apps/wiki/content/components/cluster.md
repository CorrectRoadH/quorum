## What it does

The Kubernetes Cluster stands for Kubernetes: an orchestrator that packs your services onto shared machines.

It takes no traffic. Link App Servers or Workers into it, and they run as pods. Pods pack onto shared nodes, so they cost less Burn for the same capacity. An [Autoscaler](/components/autoscaler) adds pods in seconds instead of booting VMs for minutes. See [container orchestration](/glossary/container-orchestration).

It also brings:

- **Rolling deploys**: a bad deploy stops after its first batch of pods, so only part of the traffic fails.
- **Self-healing**: when a pod's host dies, the Cluster reschedules it.

The costs:

- **Noisy neighbours**: pods share CPU, and busy neighbours add delay to a share of requests.
- **Platform work**: without a Platform team, each Cluster takes Dev Hours from your product teams. See [Team and velocity](/explanation/team-and-velocity).
- **Upgrades**: each Kubernetes version is supported for a limited time.

## When to place it

Place it when you run many App Servers and Workers, and Burn or scaling speed matters more than simplicity. It unlocks with [Container orchestration](/research/containers).

## How it fails

- [Forced cluster upgrade](/incidents/cluster-upgrade): the provider upgrades a Cluster off an unsupported version, and pods that used removed APIs crash. Run the "Upgrade clusters" task each quarter, or staff a Platform team. See [Team tasks](/team#tasks).
- If the Cluster goes down, its pods run as plain VMs again: full Burn and slow scaling.
- Noisy neighbours raise p99 when the shared nodes run busy.

## Tips

- One Cluster for many services costs less platform time than several Clusters.
- Pair a Cluster with an Autoscaler. Fast pod scaling is most of its value.
