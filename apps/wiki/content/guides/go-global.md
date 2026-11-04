---
title: Go global
summary: Serve users on other continents from Series C, with a second region, GeoDNS, local copies of your Design, and data that survives a Region outage.
section: guides
order: 9
era: 5
aliases: regions, multi-region, geodns, latency abroad, europe, apac, region outage, mirror, anycast
gdd: docs/gdd/10-progression.md
---

Use this guide when you reach the Series C Era and users abroad are slow, or when you need to
survive a Region outage.

From Series C, users live in four regions: North America, Europe, Asia-Pacific, and South
America. Each region grows or shrinks on its own Apdex. Every user still enters your home region at
first, and a far user pays the round trip across the ocean twice for each request.

## Find out who is slow

1. Select **Users** on the HUD to open **Why users leave**. Look for rows from far regions.
2. Select the **Users** Node and open **Requests**. Compare the mean latency of each kind with the
   figures before Series C.
3. Read the [Series C](/eras/series-c) page for each region's share of your users.

No change to capacity fixes this. The time is the distance. You must serve users from a region near
them.

## Open a second region

4. Research [Multiple regions](/research/multi-region). It needs [Multiple zones](/research/multi-az).
5. Find the region tabs at the top of the board. Closed regions show as **+ EU**, **+ APAC**, and
   **+ SA**.
6. Click the region with the most slow users. Its tooltip shows the price. The game opens the
   region and adds its own Users Node.
7. Click the new tab to see that region's board.

## Send users to their region

8. Research [GeoDNS](/research/geo-dns). Without it, every user still enters the home Users Node.
   With it, each region's users enter their own Users Node, or the nearest one that is up.
9. On the new tab, place a Load Balancer and App Servers, and link the region's Users Node to them.
10. Select a Node and open its **Region** section to move it to another open region. A Node that
    moves restarts.

The Payment Provider, LLM API, Push Provider, Auth Provider, CDN, Analytics, and Payments serve
every region. Do not copy them.

## Decide where the data lives

An App Server abroad that calls the home Database pays a cross-region round trip on every query.
Pick one pattern for each data Node:

| Pattern                  | How                                                                                              | Tradeoff                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Read locally, write home | Place a [Read Replica](/components/replica) in the new region. Link writes to the home Database. | Fast reads. Writes cross the ocean. Some reads come back stale. |
| Leaderless store         | [Wide-column Store](/components/wide) with **Regions** set to **Spread**.                        | Local quorums. Eventual consistency across regions.             |
| Consensus store          | [Distributed SQL](/components/dsql) with **Regions** set to **Spread**.                          | Correct everywhere. Slow writes. Much more Burn.                |

A spread store runs nodes in up to three regions and bills for each. Use Distributed SQL for
checkouts, and a leaderless store for feeds. See [The data tier](/explanation/the-data-tier).

## Copy the Design with a Mirror

Building each region by hand is slow and drifts. With
[Infrastructure as code](/research/infra-as-code), you mirror one region into another.

11. Click **Mirror** next to the region tabs.
12. Pick an IaC tool. Then, under "Mirror … into", pick the target region. Each button shows its
    price.
13. For each data Node, pick how the Mirror copies it: **Read replica**, **Own primary**,
    **Replicate**, or **Call source**.
14. Click **Apply**. The new Nodes serve after the apply time.
15. Later, a dot on a tab shows that the region has drifted from its source. Apply again, or keep the
    change as an override.

[GitOps](/research/gitops) syncs Mirrors on its own, all at once or **Staged**.

## Survive a Region outage

A [Region outage](/incidents/region) takes down every Node in one region, except global Components
and stores spread across enough regions.

16. Keep App Servers in at least two regions, with GeoDNS on.
17. Keep the data that the other region needs available there: a spread store, or a replica you
    can serve from.
18. Keep spare capacity in each region. The users of the failed region move to the nearest live
    one.

## Cut the user hop

- [Anycast](/research/anycast) takes 20 ms off the user hop everywhere.
- [HTTP/3](/research/http3) cuts the hop to distant users by 20%.
- Calls between regions also cost [egress](/glossary/egress). Keep each region's App Servers
  calling their own data where you can.

## Check the result

19. Open **Why users leave** again. The far-region rows must shrink.
20. Check that Apdex on the HUD returns to its target.
21. Before the IPO, the DR drill fails your home region on purpose. See
    [Prepare for an Exit](/guides/prepare-for-an-exit).

## Practice

The [Far Away](/sandboxes/far-away) Sandbox puts half your users outside North America. Get API
reads under its limit on average. The [Missed Write](/sandboxes/missed-write) Sandbox asks every API
read to see the latest write.

## Related

- [GeoDNS](/glossary/geodns), [Leaderless replication](/glossary/leaderless-replication), and
  [RPO and RTO](/glossary/rpo-and-rto) in the glossary.
- [Users and growth](/explanation/users-and-growth)
