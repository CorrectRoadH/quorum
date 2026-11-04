## What it does

The Payment Provider stands for Stripe: the third party that charges your customers' cards.

Link an App Server to it, and each checkout sends one charge. It is a Managed Component: it costs nothing to place, serves every region, and takes a fee from each successful checkout. Each charge waits a long, fixed time, which shows in the Checkout p99. Each size step is a usage tier that doubles how many charges per second it takes.

Do not confuse it with [Payments](/components/payments), the drawer where your revenue waits. Checkouts are the highest-value request kind, so the Payment Provider sits on your most important path.

## When to place it

Place it when you ship the Checkout Feature. Without it, checkouts have nowhere to charge. It unlocks with the [Checkout](/research/checkout) Research.

## How it fails

- [Payment provider outage](/incidents/psp-outage): their outage, not yours. Every checkout fails until it ends. Nothing on your side prevents it.
- [Double charge](/incidents/double-charge): the provider slows, charges time out, and a retrying link charges some customers twice. Duplicates fail as `duplicate`. [Idempotency keys](/research/idempotency-keys) prevent it. Stop retries on the charge link to end it. See [idempotency](/glossary/idempotency).
- Past its tier's rate, it drops charges. Resize it before a spike.

:::Note{tone="real"}
Stripe lets a client send an idempotency key with each charge, so a retry returns the first result instead of charging again.
:::

## Tips

- Do not turn on retries on the charge link until you own Idempotency keys.
- Give the charge link a timeout longer than a normal charge.
