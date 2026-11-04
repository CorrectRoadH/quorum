---
title: Your first incident
summary: Raise the Pre-seed round, meet your first incident, respond to it, and file its postmortem.
section: tutorials
order: 3
era: 1
aliases: first incident, pre-seed, raise, funding round, postmortem, action item, replace, traffic spike, instance failure
gdd: docs/gdd/11-incidents.md
---

In this lesson you raise your first funding round and handle your first incident. Incidents start
only after the Garage. Begin with a Company that has its database on its own Node, as in
[Your first bottleneck](/tutorials/first-bottleneck).

## Raise the Pre-seed round

1. Grow your Company to 1,000 users. The bar under the Era name on the HUD fills as you get closer.
2. Find the **Pre-seed offer** button under the Era name. Click it. The offer opens.
3. Read the two choices. **Raise** gives you Cash and costs Equity. **Decline** keeps your Equity,
   gives no Cash, and slows your growth in the next Era.
4. Select **Raise**.
5. Read the Era card. It names the next round's user target, the Apdex target, and the price level.
   Select **Continue**.

The HUD now shows **Pre-seed**. Two new request kinds arrive: writes and logins. Prices go up, and
incidents can now happen. See [Pre-seed](/eras/pre-seed) for the numbers.

## Prepare

Your first incident comes soon after the raise. Get ready while you wait.

1. Collect your revenue, so that you have Cash to spend.
2. Select each Node and check its **Load** row. A row under 70% leaves room for more traffic.
3. If a row is amber or red, fix it as in [Your first bottleneck](/tutorials/first-bottleneck).

An incident is a test of your Design. The game picks the incident that hits your weakest point. A
Design with one copy of each Node and little spare capacity is weak against the first incidents.
For the rules, see [How incidents work](/explanation/incidents).

## Notice the incident

When an incident starts, these things happen:

- A short sound plays.
- If the clock runs faster than normal speed, it drops to normal speed.
- Cards turn amber, red, or grey, and the HUD shows the change.

The first incident in a young Company is often one of these two. Read the one that you see.

## If it is an Instance failure

The host under one of your machines died. That Node goes grey and serves nothing.

1. Read the toast. It names the Node and says **Select it and click Replace.**
2. Select the grey Node. The Inspector shows **The host under this VM died. It still bills.**
3. Select **Replace**. The price is on the button.

The Node comes back cold and warms up. Errors stop, and Apdex starts to climb. A failed Node keeps
its Burn until you replace it, so do not wait.

The [Instance failure](/incidents/instance) page lists what prevents it. The usual fix is a second
copy behind a [Load Balancer](/components/lb), which skips dead hosts.

## If it is a Traffic spike

A big news site linked to your product. Demand jumps to several times the normal rate for a short
time.

1. Watch the cards. Your busiest Node turns red, and some requests fail.
2. Select the Node with the **BOTTLENECK** tag, and read its **Load** row.
3. Wait. A Traffic spike ends on its own.

**Larger** adds capacity, but the Node restarts first and drops its traffic for a moment. On a
single box, add the capacity after the spike.

Spare capacity is the best defense. A Design that runs near full every day has no room for a spike.
See [Traffic spike](/incidents/spike).

:::Note{tone="warn"}
An incident that hurts your users for more than half its time steps up one severity level. It then
lasts longer, and a spike gets bigger. A fast response keeps it small.
:::

## Read the postmortem

When the incident ends, a toast says it is over. A postmortem card appears at the bottom left.

1. Find the card. It shows a **SEV** badge and the incident's name.
2. Click the card to open its details. Read the cause, the **MTTR** (the time to restore service),
   the users you lost, and the revenue you lost.
3. Read the last line. It names what prevents the incident.

## File the postmortem

Most postmortems carry an action item: a Research item that prevents the same incident.

1. Find the button on the card with the Research name and its cost in Insight.
2. Click it. The card closes, and the Study goes to the front of your Research queue.

You can also click the **X** to file the postmortem and leave the action item open. Then that
incident stays twice as likely until you own the Research. If you do not have the Insight yet, take
the action item anyway. The Study runs as your Insight pools fill.

[Earn Insight and research](/tutorials/research-and-insight) explains Insight and the queue.

## What you learned

- A funding round starts the next Era, and incidents start in Pre-seed.
- An incident hits the weakest part of your Design.
- A failed Node needs **Replace**. A spike needs spare capacity.
- A postmortem's action item is the Research that prevents the incident.

Next: [Earn Insight and research](/tutorials/research-and-insight).
