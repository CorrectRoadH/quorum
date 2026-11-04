---
title: Cash, Burn, and funding
summary: How revenue becomes Cash, what your Burn pays for, what raising or declining a round really costs, and how the Valuation is computed.
section: explanation
order: 9
aliases: cash, burn, money, funding, raise, decline, round, equity, dilution, valuation, rule of 40, margin, payments drawer, subscriptions, ipo, quarters, guidance, negative cash
gdd: docs/gdd/09-economy.md
---

Cash is what you spend on the board. It comes in from requests your users send, and it goes out as
Burn every second. Funding rounds add Cash in large steps, and they cost you Equity. Your Valuation
turns all of this into one number, which decides what an Exit pays.

## Where Cash comes from

**Request revenue.** Each served request earns its kind's value, weighted by Apdex: a satisfied
request earns all of it, a tolerating one half. [Apdex and revenue](/explanation/apdex-and-revenue)
explains the weighting.

**The Payments drawer.** Revenue first waits in the Payments drawer, and you click Collect to move it
into Cash. The drawer holds 60 seconds of revenue at size 1, and never less than $25. Each size step
doubles it. Revenue past the drawer's size is lost. [Stripe Billing](/research/stripe) collects for
you, and after that the drawer only shows the rate. While you are away, revenue goes straight to Cash.

**Subscriptions.** Once the Paid plans Feature ships, 5% of your users pay a plan worth $24 per
calendar day. This income does not depend on requests, so it rewards keeping users more than
serving bursts.

**Funding grants** come with each round you raise (see below). **Selling a Node** refunds half of
what the last copy of its Component cost to place.

## What Burn pays for

Burn is the total Cash you spend per second. It has four parts:

- **The cloud bill.** Every Node costs Cash to place and Cash per second to run. Each copy of a
  Component costs 25% more to place than the one before.
- **Salaries.** Each engineer's salary, scaled by their language. The founder draws none.
- **Egress.** Bytes sent out to users cost money, which makes media expensive without a CDN.
- **Third-party fees.** Payment Provider fees, Auth Provider fees, LLM tokens, and push messages.

Prices rise with each Era through a cost index, and salaries through a salary index. This keeps Burn
a real share of revenue at every size of Company. The [Eras](/eras) pages show each Era's index, and
[Infrastructure](/infrastructure) shows instance prices. [Cut the cloud bill](/guides/cut-the-cloud-bill)
shows where to look first.

## Running out of Cash

A Company never ends because it runs out of money. Cash can go below zero. Burn continues, and the
game refuses anything that costs Cash, such as placing a Node or signing a hire, until you can pay.
Nothing shuts down by itself. The fix is to sell Nodes you do not need or to grow revenue.

## Funding rounds

Each Era has a user milestone. When you reach it, investors offer the next round, and you choose:

- **Raise.** You get the round's grant, and your Equity shrinks by the round's dilution.
- **Decline.** You keep your Equity and get no grant. The next Era grows at 70% of the normal rate.

The Era advances either way, so its new request kinds and problems arrive whether you raised or not.
Money buys growth, and Equity is the price. Dilution compounds over rounds, and your Equity at the
Exit multiplies the payout. The [Eras](/eras) pages list each milestone, grant, and dilution.

The IPO is the last round. It needs the IPO checklist as well as the milestone, you cannot decline
it, and it pays 1,000 seconds of your current Burn.

:::Note{tone="real"}
The dilution of the Seed through Series C rounds follows Carta's published medians. "Default
alive" is Paul Graham's term for a startup that can reach profit on the money it has. In Quorum, the
achievement of that name goes to a player who reaches the Public Era without raising a round.
:::

The Bootstrapped indie [Venture](/prestige#ventures) takes no rounds at all. Its Equity stays at
100%, and declining costs it no growth.

## How the Valuation works

Your Valuation is annual revenue times a multiple:

```formula
ARR       = revenue per calendar day × 365 × 0.00015
multiple  = 4 + 0.15 × max(0, Rule of 40)          kept between 2 and 30
Valuation = ARR × multiple
```

Request values are game dollars, so Cash and revenue run far above real figures. The scale factor
converts a year of game revenue into the real-dollar ARR a company of your size would report. The
Valuation, Exit payouts, and Legacy use real dollars. Cash, revenue, and Burn use game dollars.

The [Rule of 40](/glossary/rule-of-40) adds two numbers:

- **Growth.** User growth over the last calendar week, annualized, in percent.
- **Margin.** (revenue − Burn) / revenue, in percent. With no revenue, it reads −100%. See
  [operating margin](/glossary/operating-margin).

So the multiple rewards both growth and profit. Early on, growth carries it. Later, when growth slows,
margin decides your Valuation. [Investor relations](/research/investor-relations) adds 2 to the
multiple.

## Public quarters

In the Public Era, the game runs in quarters of 7 calendar days. At the start of each quarter, you
set guidance: a revenue growth target and a margin target. At the end, the market compares your
results with it. A beat raises the multiple, more for higher guidance, and every fourth beat in a
row adds a bonus. A miss lowers it. Quarters can move the multiple by at most 10 either way.
[Guidance modeling](/research/guidance-modeling) shows your chance of beating each level.

## The three currencies stay separate

Cash, Insight, and Dev Hours do not convert into each other. The only bridges are that Cash hires
engineers and pays for Analytics. So each choice stays readable: Cash buys capacity, Insight buys
knowledge, and Dev Hours buy change. See [Team and velocity](/explanation/team-and-velocity) and
[Eras and Research](/explanation/progression).
