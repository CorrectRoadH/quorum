## What it does

The Autoscaler stands for an AWS Auto Scaling group: a controller that adds and removes copies of a server as load changes.

It takes no traffic. Link App Servers or Workers into it to put them under its control. Each linked Node then scales on its own. When the Node runs above the target, the Autoscaler asks for more copies. When it idles well below the target, it gives one back. See [autoscaling](/glossary/autoscaling).

Settings on its card:

- **Signal**: CPU, or load (the Node's tightest limit).
- **Target**: the utilization to hold. Lower is safer and costs more.
- **Min and max copies**: the max is your cost guard.

New copies are not instant. A VM takes minutes to boot. In a [Kubernetes Cluster](/components/cluster), a pod takes seconds. Between two scaling actions on one Node it waits a cooldown. New copies start cold, so a JIT runtime runs them slowly at first. See [cold start](/glossary/cold-start).

## When to place it

Place it when demand swings through the day and you either pay for idle copies at night or run hot at peak. It unlocks with [Autoscaling](/research/autoscaling).

## How it fails

- A spike faster than the boot time still hurts. A [Traffic spike](/incidents/spike) can be over before new VMs serve.
- CPU is the wrong signal for runtimes that wait on I/O: their CPU stays low while their workers are full. Use load.
- Without a max, a bug or an attack scales the bill.
- Scale-up under load can make p99 worse at first, while cold copies warm.

## Tips

- Put scaled App Servers in a Cluster to cut reaction time.
- Keep the min high enough to survive the first minutes of a spike.
