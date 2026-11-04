## What it does

DNS stands for a managed name service, such as Route 53, that answers one domain with several addresses.

It takes every request kind and sends it on unchanged. It splits traffic evenly across its links, one equal share each, round robin. It adds no latency and has no capacity limit. It turns the one link from [Users](/components/users) into many.

DNS has no health checks. A dead host keeps its share, and those requests fail. The [Health checks](/research/health-checks) Research makes DNS drop a dead host once its TTL runs out, and lets you set the TTL. A short TTL drops a dead host faster. A long one keeps sending users to it.

DNS ignores size. A small App Server gets the same share as a large one.

## When to place it

Place DNS when one App Server is not enough and you cannot yet afford a [Load Balancer](/components/lb). The symptom is a board that refuses a second link from Users. See [DNS round robin](/glossary/dns-round-robin).

## How it fails

- A host goes down in an [Instance failure](/incidents/instance), and its share of requests fails until DNS drops it, or never without Health checks.
- Mixed sizes overload the smallest host first, because each gets an equal share.

:::Note{tone="real"}
Real clients cache DNS answers for the TTL and often longer, so DNS is a slow, coarse load balancer. Real teams put a Load Balancer behind it.
:::

## Tips

- Keep every host behind DNS the same size.
- Replace DNS with a Load Balancer when you research [Load balancing](/research/load-balancing).
