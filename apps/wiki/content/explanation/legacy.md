---
title: Why a Company ends
summary: Why each Company ends in an Exit, how an Exit becomes Legacy, and how Perks, Ventures, and Mutators make the next Company different.
section: explanation
order: 13
era: 3
aliases: exit, legacy, prestige, acqui-hire, acquisition, ipo, step down, perks, legacy shop, ventures, mutators, founder, reset, new company, playbooks
gdd: docs/gdd/13-prestige.md
---

Quorum is endless, but a single Company is not meant to be. At some point you sell it, list it, or
step down. That is an **Exit**. The Exit pays **Legacy**, which stays with you as the Founder. Legacy
buys permanent Perks and opens new Ventures, which change the rules of your next Company.

This is the prestige pattern of incremental games. Each Company starts over, but you start it
stronger and with more choices, so the second Garage takes less time than the first.

## The four Exits

| Exit        | Offered from | Pays on                   | Multiplier  | After it                |
| ----------- | ------------ | ------------------------- | ----------- | ----------------------- |
| Acqui-hire  | Series A     | Valuation, capped at $50M | 0.5         | The Company ends        |
| Acquisition | Series B     | Valuation                 | 1           | The Company ends        |
| IPO         | Pre-IPO      | Valuation at listing      | 1.5         | The Company goes Public |
| Step down   | Public       | Valuation                 | 1.5 + bonus | The Company ends        |

The payout is your Equity times the Valuation times the multiplier. An Acqui-hire is a fast way out
when you want to try a new Venture. An Acquisition pays your full Valuation.

The IPO is not a button on the Exit list. It is the Pre-IPO funding round, and it needs the IPO
checklist. It pays Legacy at listing, and the Company goes on into the Public Era. Once you are
listed, Step down is the only way out. It pays only the Legacy you did not already get at the IPO,
and each
quarter in your current streak of beaten guidance adds 0.1 to its multiplier, up to 1 more.
[Cash, Burn, and funding](/explanation/money) explains the Valuation and quarters.

## From payout to Legacy

```text
Legacy = floor( √(payout / $1,000,000) × founding multiplier )
```

A $1 million payout gives 1 Legacy. A $100 million payout gives 10, and $10 billion gives 100. The
square root makes each better Exit worth more, but not so much more that one huge run makes the
rest pointless. The founding multiplier comes from your Venture and Mutators (see below).

:::Note{tone="real"}
Real founders feel the same tradeoff. Equity is what you sell in every funding round, and your
share at the Exit decides what you take home. A founder who raised every round owns a small slice of
a large company. One who declined owns a large slice of a smaller one.
:::

## What resets and what stays

An Exit ends the Company. Cash, Insight, Dev Hours, users, Research, the board, the team, and
Equity all reset, and you found a new Company in the Garage, or in Pre-seed with the Head start
Perk.

The Founder keeps:

- Legacy, and the Perks it bought.
- Playbooks: saved parts of a Design that you can place again in one action.
- Unlocked Ventures and Mutators.
- Achievements, Challenge results, and the glossary terms you met.
- The company history: one row per Exit, with its Venture, payout, Legacy, peak users, Stack, and
  a snapshot of the board.

## Perks

The Legacy shop sells Perks. Each has levels, and each level costs more Legacy than the last. Some
examples:

- **Angel network** doubles your starting Cash per level.
- **Alumni network** adds an engineer who joins when hiring opens.
- **Institutional knowledge** keeps one Research item of your choice through the next Exit, per
  level.
- **Pattern recognition** adds 20% Insight per level. **Founder's reputation** adds 10% user growth.
- **Better terms** takes 2 points off the dilution of each round.
- **Night shift** raises the offline cap from 8 hours up to 24.
- **Time dilation** unlocks faster Company speeds.
- **War stories** halves the extra weight that open action items give incidents.
- **Head start** founds the next Company in Pre-seed.

The [Prestige](/prestige#perks) reference lists every Perk with its prices.

## Ventures change the rules

A **Venture** is the kind of Company you found. B2B SaaS is open from the start. Others cost Legacy
to unlock, and one comes from an achievement. A Venture changes what your users send and when:

- **Consumer social** has twice the market and half the value per request, with more media.
- **Fintech** peaks in business hours and sends four times the purchases.
- **Streaming media** sends four times the media, so egress dominates the bill.
- **Game backend** sends four times the realtime traffic.
- **AI startup** has flat demand and three times the AI prompts.
- **E-commerce** doubles purchases and search.
- **Bootstrapped indie** takes no funding rounds, and its Equity stays at 100%. It opens with the
  Default Alive achievement: reach the Public Era without raising a round.

Each Venture has its own Legacy multiplier, shown before you found it. A harder Venture pays more.
The [Prestige](/prestige#ventures) reference has the details.

## Mutators make it harder for more Legacy

A **Mutator** is an optional rule that makes a Company harder. Each one adds to the founding
multiplier: the Venture's multiplier times one plus the sum of the Mutators' shares. Your first Exit
opens some Mutators. Achievements open the rest.

Examples include No caches (no Cache or CDN), Tight budget (funding grants halved), One region
forever, Strict SLO (each Era's SLO one level higher), Chaos Monkey (instance failures dominate from
Seed), and Postgres for everything. Each forces a different Design. The last one is a real argument
among engineers: how far one relational database can go.

See the [Prestige](/prestige#mutators) reference for every Mutator and its share.

## When to take an Exit

There is no single right time. A later Exit usually pays more, but the Legacy curve flattens, and a
new Company with better Perks may earn more per hour. [Your first Exit](/tutorials/first-exit) walks
through one, and [Prepare for an Exit](/guides/prepare-for-an-exit) shows how to raise the payout
first.
