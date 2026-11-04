## What it does

The Load Balancer stands for a reverse proxy such as NGINX that spreads requests across your App Servers.

It takes every request kind and sends it on. It adds a little latency and has a throughput limit, which each size step doubles. It spans every zone, so a zone outage does not take it down.

By default it splits traffic by each target's capacity, so a large App Server gets a larger share. Round robin is also on offer. The [Load balancing algorithms](/research/lb-algorithms) Research adds least connections and [power of two choices](/glossary/power-of-two-choices). Two choices handles more traffic with a little imbalance.

It drops a dead host at its next [health check](/glossary/health-check). The [Health checks](/research/health-checks) Research lets you change the interval and turn on deep checks. A Load Balancer can also route by request kind: set which kinds each of its links carries.

## When to place it

Place it when you need a second App Server, or when hosts behind [DNS](/components/dns) have mixed sizes. Resize it when its card shows it near its throughput limit.

## How it fails

- Overloaded, it drops requests before they reach any App Server.
- A long health check interval keeps routing to a dead host during an [Instance failure](/incidents/instance).
- A deep check takes out every App Server whose Database is down or overloaded. If that is all of them, the Load Balancer has nowhere to send traffic, and a slow Database becomes a full outage.

:::Note{tone="real"}
Health checks can cause outages as well as prevent them. Real teams keep deep checks narrow for this reason.
:::

## Tips

- Use least connections when App Servers have mixed sizes or runtimes.
- Route slow kinds, such as exports, to their own App Servers.
