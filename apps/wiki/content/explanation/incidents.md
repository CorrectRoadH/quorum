---
title: How incidents work
summary: How the incident director picks what breaks, why it aims at your weakest point, and how postmortems, error budgets, and security patches tie incidents back to your Design.
section: explanation
order: 11
era: 1
aliases: incidents, incident director, severity, sev1, sev2, sev3, escalation, postmortem, action item, mttr, error budget, slo, cve, patch, breach, outage
gdd: docs/gdd/11-incidents.md
---

An incident is an event that stresses your Design. Incidents are the game's tests: each one is a
real class of outage, and each one checks whether your Design survives it. A well-built Design
survives most incidents with no action from you. A fragile one teaches you where it is fragile.

## When incidents start

The Garage has no incidents. They begin in Pre-seed, shortly after you raise or decline the round.
After that, the director waits a random time around the Era's interval before it starts the next
one. Only one incident runs at a time.

No incident starts while you are away. When you come back, the next one waits a short while, so
nothing strikes the moment you return.

## The director aims at your weaknesses

The director does not pick incidents at random. Each incident type gets a weight from how hard it
would hit your current Design:

```text
weight = weakness × (1 + tech debt) × repeat × open action item × Mutators
```

- **Weakness** is 0 when the Design has nothing the incident can hit. Otherwise it runs from 0.2 to 3.
  An Instance failure weighs 3 on a Node with no second copy, and much less on Nodes with one. A
  Retry storm weighs most when Links retry into a Database with no backoff.
- **Tech debt** makes every incident likelier.
- **Repeat.** The type that ran last is less likely to run again.
- **Open action items** double an incident's weight (see below).

So the director is a teacher. It shows you the weak point in your Design, and it stops hitting it
once you fix it. Two incidents are not picked this way: a [Bad deploy](/incidents/bad-deploy) comes
only from a deploy, and a Data breach comes only from a security patch you missed.

## Severity and escalation

Each incident has a severity. SEV3 hits one Node or one kind. SEV2 hits a service or a zone. SEV1
hits the whole Company or a region. Each Era caps the worst severity an incident can start at, so no
incident starts at SEV1 before Series B.

An incident can grow. At its halfway point, if it has hurt users for more than half of its time so
far, it steps up one severity. Its remaining time grows by half, and a Traffic spike grows by half
too. Acting early keeps an incident small.

## How long an incident lasts

An unmitigated incident ends on its own after a set time. From Series A, incident times follow the
calendar, because the SLO does: at most 5 calendar minutes at SEV3, 20 at SEV2, and 60 at SEV1.
One sim second is one calendar minute.

Many incidents end sooner when you fix the cause. You can replace a failed Node, add the missing
index, restart a leaking server, or roll back a bad deploy. A Retry storm has no clock: it ends only
when the backlog on the slow Database drains. Each [incident](/incidents) page lists its fix and its
prevention.

:::Note{tone="real"}
Real outages work the same way. A Design with spare capacity and redundant copies loses little or
nothing to the same event that takes down a single-box Design. The incident is the trigger. Your
Design decides the damage.
:::

## Postmortems and action items

When an incident ends, the game files a blameless postmortem. It shows the timeline, the users and
revenue lost, the failed requests, and the MTTR: the minutes in which more than 1% of requests
failed. See [MTTR](/glossary/mttr).

A postmortem pays no Insight. If it did, a weak Design that failed often would research faster than
a strong one. Instead, it opens one **action item**: the first Research on the incident's prevention
list that you do not own and can study now. Until you own it, the director picks that incident twice
as often. An unfixed root cause comes back. The War stories [Perk](/prestige#perks) softens this.

Failures still teach you something. Failed and frustrated requests fill the Failure Insight pool,
which pays for Reliability Research.

## SLOs and the error budget

From Series A, each Era has an availability SLO, such as 99.9%. The game counts your users' requests
and failures over the last calendar week. The failures the SLO allows are your
[error budget](/glossary/error-budget):

```text
error budget = (1 − SLO) × requests in the last calendar week
```

Bots do not count. Nor do real users the WAF blocked, because a block is a client error, not a
failure to answer. The budget counts failed requests, not clock time, so a partial outage spends a
partial budget.

After [Error budgets](/research/error-budgets) research, the budget changes your team's speed. With
more than half left, teams work 10% faster. When it is spent, they work at half speed until it
recovers. [SLO dashboards](/research/slo-dashboards) put the budget on the HUD. See
[SLO, SLA, and SLI](/glossary/slo-sla-sli).

:::Note{tone="real"}
This is the error budget policy from Google's SRE book. A team with budget to spare can take risks
and ship fast. A team that spent it slows down and fixes reliability first.
:::

## Security patches

From Pre-seed, a vulnerability in software your Design runs is disclosed every few minutes. Each one
puts a patch ticket at the end of your backlog, with a deadline. A higher score means a shorter
deadline and a bigger patch. You must move the ticket up or rush it with pooled Dev Hours. If it
stays overdue past a short grace, the vulnerability is exploited: a Data breach starts, and 15% of
your users leave at once.

## Related pages

- [Your first incident](/tutorials/first-incident) walks you through one.
- [Stop a retry storm](/guides/stop-a-retry-storm) and
  [Survive a traffic spike](/guides/survive-a-traffic-spike) handle the hardest ones.
- [Errors and retries](/explanation/errors-and-retries) explains why retries make overload worse.
