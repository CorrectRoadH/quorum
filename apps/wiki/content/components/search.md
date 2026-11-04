## What it does

The Search Engine stands for Elasticsearch: a separate index built for full-text search.

It takes search queries and sends nothing on. It answers each one in a fixed time, and it answers a fixed number per second per size step. Features that make searches heavier lower that number. See [inverted index](/glossary/inverted-index).

Until you link a Search Engine, the [Database](/components/database) answers searches with built-in full-text search. When an App Server links to both, searches go to the Search Engine, and Postgres stops answering them.

## When to place it

Place it when searches load the Database: its CPU climbs as the Search share of the mix grows, and every other query slows with it. It unlocks with [Full-text search](/research/full-text-search). Resize it when its card shows it near its limit.

## How it fails

- Overloaded, it drops searches. Searches fail, but the rest of the Design is fine.
- Without one, search load sits on the primary, and a busy search slows checkouts and writes.
- [Instance failure](/incidents/instance) takes a single copy offline. Searches fail until you replace it, because the Database does not take them back while a Search Engine is linked.
- A [Zone outage](/incidents/zone) takes it down unless it has a standby in another zone.

:::Note{tone="real"}
Real teams feed a search index from the database with dual writes or change data capture, and results lag a little behind. See [CDC](/glossary/cdc-change-data-capture).
:::

## Tips

- Search queries are among the higher-value kinds. Keep their p99 low.
- Give it a standby once you own [Multiple zones](/research/multi-az).
