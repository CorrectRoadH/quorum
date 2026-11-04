---
title: Users and growth
summary: Why users grow on an S-curve, why they leave fast when Apdex slips, and how regions change growth from Series C.
section: explanation
order: 6
aliases: users, growth, churn, market, s-curve, fickle, steady, regions, going global, churn breakdown, word of mouth
gdd: docs/gdd/04-simulation.md
---

Users are not a currency in Quorum. They are the state that every currency depends on: more users
send more requests, earn more revenue, and feed more Insight. Users grow only while your Design keeps
them happy, and they leave fast when it does not.

## Growth follows an S-curve

New users come from word of mouth: the more users you have, the more people hear about you. Growth
also slows as you approach the size of the market, because fewer people are left to win. Together
these give an S-curve:

```text
growth = rate × users × (1 − users / market) × health
```

Early on, growth is slow because few people talk about you. In the middle, it is fastest. Near the
market size, it flattens. Each Era has its own market size and growth rate, and Features that reach
more people raise the market. The [Eras](/eras) reference pages list both.

:::Note{tone="real"}
This is the classic diffusion model that marketers have used since the 1960s. In real products a few
people also adopt with no word of mouth at all. The game leaves that term out: your starting users
play that role.
:::

## Health: the Apdex test

The `health` term compares your users' Apdex over the last calendar hour with the Era's target:

```text
health = (Apdex − target) / (1 − target)     kept between −1 and 1
```

Above the target, health is positive and users grow. At exactly the target, growth stops. Below it,
health is negative and users leave. The target rises each Era, so a Design that was good enough in
the Garage is not good enough later.

Churn has no market term. Unhappy users leave at a rate proportional to how far you are under the
target, whatever your size. That asymmetry is the main pressure in the game: growth takes hours, and
a bad evening can undo a lot of it.

::Quiz{question="Your users’ Apdex sits just under the Era’s target. No card is red and nothing fails. What happens to your users?" options="They hold steady|They grow slowly|They leave" answer="3" explain="Any Apdex under the target makes health negative, so users leave. No outage is needed: slow requests alone cause churn."}

## Fickle and steady users

Not every user is equally loyal. Half of your new users are fickle, and the rest are steady. Steady
users leave at a small fraction of the fickle rate. Under a bad Apdex, the fickle users go first. The
users who stay are steadier, so the next bad spell costs you less.

This matches real retention data. Peter Fader and Bruce Hardie showed in 2007 that retention rises with
tenure mainly because the least loyal customers leave first, not because each customer grows more
loyal.

## Things that speed growth

- **Funding.** An Era that began with a raised round grows at the full rate. One that began with a
  declined round grows slower.
- **Features.** Some raise growth or the market, and some lower churn. See the
  [Team](/team#features) reference.
- **Research.** [Funnel analytics](/research/funnels) raises growth.
- **Legacy.** The Founder’s reputation Perk raises growth in every later Company. See
  [Prestige](/prestige#perks).

## While you are away

When you come back, the game simulates the time you were away. Users grow only while errors stayed
inside the Era's SLO, and they can still leave. Each region keeps at least 95% of its users, so you
never return to a ruined Company.

## Going global

In Series C, your users live on four continents. All your existing users stay in North America, where
the Company started. Each other region starts with a small seed of users and grows from there.

From then on, each region has its own user count, market share, and Apdex. The growth formula runs
per region. Three rules make this work like the real thing:

- **Each region peaks at its own evening.** Demand follows the sun, so your quiet hour at home is
  someone else's peak.
- **A region's Apdex counts its own users' requests, wherever you serve them.** A European user whose
  read crosses the ocean to North America pays two round trips on the internet hop. That user counts
  in Europe's Apdex, and Europe's users leave if it is too slow.
- **Word of mouth crosses borders.** A region grows mostly from its own users, and a little from your
  users everywhere else. A region that lost its users can recover once you serve it well.

So a far region can fall below target while every Node on the home board is green. The fix is to
serve those users nearby: open the region, and use [GeoDNS](/research/geo-dns) to send each region's
users to their own region.

::Sandbox{id="far-away"}

## The Churn breakdown

Users can leave with no outage and no red Node, so the game gives you a direct answer. The **Churn
breakdown** opens from the Users figure. It lists, for each region, the rows that take Apdex points:
one row per request kind and cause.

- `far` means the round trip to a Design in another region.
- `slow` means time spent inside your Design.
- `failed` means errors. With [Structured logs](/research/logs), it names the error cause.

The rows add up to the Apdex you are missing. The header shows the current rate and a forecast for one
calendar day, from the same formula the Simulation uses. Fix the top rows first.
