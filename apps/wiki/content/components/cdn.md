## What it does

The CDN stands for Cloudflare: a network of edge servers that answer cacheable content near the user.

Place it right after [Users](/components/users). It takes every request kind. It answers most page views and video at the edge, and sends the misses and every other kind on to your origin. It has no capacity limit and serves every region.

Egress from the edge costs less than egress from your App Servers, so a CDN also cuts the cloud bill once egress is billed. A longer TTL raises the hit ratio. The [Tiered caching](/research/tiered-caching) Research lifts how much video the edge answers. See [CDN](/glossary/cdn-content-delivery-network) and [egress](/glossary/egress).

A CDN does not cache API reads, writes, logins, or checkouts. Those always reach the origin.

## When to place it

Place it when page views or video load your App Servers, or when egress is a large line in the Ledger. It unlocks with [Content delivery](/research/cdn).

## How it fails

The CDN itself does not overload in the game. What goes wrong:

- Every request pays the edge hop, including the misses that go on to the origin.
- A short TTL lowers the hit ratio, and more traffic reaches your origin.
- Without one, a [DDoS](/incidents/ddos) or [Traffic spike](/incidents/spike) hits your App Servers in full. A CDN takes the cacheable part.

## Tips

- Pair it with [Object Storage](/components/storage) when you serve video.
- Place a [WAF](/components/waf) after the CDN, so the WAF sees only the misses.
- The default TTL is a sensible start. Raise it when pages change rarely.
