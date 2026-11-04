## What it does

The Push Provider stands for Amazon SNS and SES: services that deliver push notifications and email for you.

It takes push messages and sends nothing on. It is a Managed Component. It costs nothing to place, serves every region, and bills for each message. Its throughput limit is high, and each size step doubles it. Delivery takes a moment, but users do not wait for it.

Notifications reach it from your code. A Notify request does most of its work asynchronously. With a [Queue](/components/queue) linked, a [Worker](/components/worker) sends the push message. Without one, the App Server sends it itself. Link whichever Node sends them to the Push Provider.

## When to place it

Place it when you ship the Push notifications Feature on the [Team](/team#features) page. Without it, push messages have nowhere to go. It unlocks with the [Notifications](/research/notifications) Research.

## How it fails

- Past its limit, it drops messages. With its high limit, this needs a very large audience.
- Its cost grows with every message. Watch third-party costs in the Ledger.
- Push notifications raise growth, and they also raise churn a little: users tire of them. That cost comes from the Feature, not the Component. See [Users and growth](/explanation/users-and-growth).

No incident targets the Push Provider.

:::Note{tone="real"}
Real queues deliver at least once, so a notification can arrive twice. Real teams make sending idempotent. See [at-least-once delivery](/glossary/at-least-once-delivery).
:::

## Tips

- Send notifications through a Queue and Workers, so a slow send never holds an App Server slot.
