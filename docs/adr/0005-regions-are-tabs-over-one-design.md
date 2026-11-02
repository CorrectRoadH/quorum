# Regions are tabs over one Design

From Series C, users live on four continents and the Company can run in more than one region
([GDD 05](../gdd/05-components.md#zones-and-regions), [GDD 10](../gdd/10-progression.md#era-5-series-c)).
The GDD says each region is "a separate board tab, like a planet in Factorio Space Age". We keep one
Design and one graph: every Node carries a `region` (`na`, `eu`, `apac`, `sa`; default `na`), and the
board shows one tab per open region, filtered to that region's Nodes. Opening a region adds its own
fixed Users Node.

The Simulation stays one flow solve over one graph. A call between two Nodes pays for where they
sit: the round trip between their regions (`rttOf` in `catalog/regions.ts`), or the cross-zone hop
inside one. A Users Node pays two round trips to a Node in another region, one to open the
connection and one for the request. Managed and edge Components (Payment Provider, LLM API, Push
Provider, Auth Provider, CDN, Analytics, Payments) serve every region at no extra hop. Each region's
users have a demand share and their own evening peak, read on the home calendar through the exact
cosine (`regions.ts`). Without GeoDNS every user enters the home Users Node and the far ones pay the
round trip; with GeoDNS each region's users enter their own Users Node, or the nearest live one.

Considered options:

- **One `Game.boards[]`, a graph per region, and explicit inter-region gateways.** Truer to
  "separate boards", but every solve rule (latency coupling across passes, the Bottleneck search,
  weighted splits, retries, determinism) would need a cross-board pass, and a save would need a
  migration of every Node into a board. Rejected for M6.
- **One board with region lanes.** No new UI, but a four-region Design would hold four copies of
  every column on one canvas, which is the clutter the tabs exist to avoid. Rejected.

## Consequences

- `GameNode.region` decodes to `na`, so every earlier save is a one-region Design and plays as before.
- A Link may join two regions. Its card shows the round trip on both tabs; the board draws it as a
  stub to the other tab.
- A Region outage downs every Node in one region that does not survive it: global Components, Users
  Nodes, and stores spread across enough regions keep serving.
- A tab shows fewer cards than the whole Design, which also eases the fit-zoom crowding of large
  boards.
- What would change it: a playtest finding that players need one zoomed-out view of every region.
  A "World" tab that shows all regions at once needs no model change.
