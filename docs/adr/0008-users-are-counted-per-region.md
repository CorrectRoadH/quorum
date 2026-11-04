# Users are counted per region

From Series C, a share of demand comes from Europe, Asia-Pacific, and South America
([ADR 0005](./0005-regions-are-tabs-over-one-design.md)). Before this decision, the Game held one
user count and one Apdex. A Company that reached Series C with a single-region Design had 60% of its
demand move abroad at once, and the far users' round trips lowered the one Apdex that every user's
churn reads. Users at home left because users abroad were slow, and the player saw only one Apdex
number below target.

We keep a user count and an hourly Apdex per region in the Game. Growth and churn run per region on
that region's Apdex, demand per region is that region's Users, and each region's market is the Era
market times its share ([GDD 04](../gdd/04-simulation.md#users-and-growth)). At the Series C start,
every existing user stays in North America and each far region starts from a seed
([Going global](../gdd/04-simulation.md#going-global)).

Considered options:

- **Keep one count and ramp the far shares in over days.** A smaller change, but a far region's
  slowness still makes home users leave, and the Churn breakdown could not say which users leave.
  Rejected.
- **One count, but weight each region's Apdex by its share for churn.** The same as one global
  Apdex in effect. Rejected.

## Consequences

- The save keeps `users` as the total and adds `userShares`, each region's share of it,
  `steady`, each region's share of steady users, and `regionApdex`. Code that changes the total, such as a Data breach, scales every region together.
- Both new fields decode to null. A null `userShares` keeps the split from before this decision:
  everyone at home before Series C, and the catalog's 40/30/20/10 from Series C. So a save already
  in Series C, and every Sandbox and Challenge, plays as before. Only the raise into Series C writes
  the seeded split. This bumps `SIM_VERSION` to 15.
- The Ledger gives each region's users their own Apdex (`regions`), from the outcome the solve
  already computes for each region's route before it blends them.
- The Milestone, Valuation, the Rule of 40, and the HUD read the total.
- A Region outage makes the failed region's users leave, not every user.
- What would change it: a playtest finding that four counts are harder to read than one. The HUD
  shows the total, so only the Churn breakdown and the Users Nodes would change.
