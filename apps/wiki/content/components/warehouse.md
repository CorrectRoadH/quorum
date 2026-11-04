## What it does

The Data Warehouse stands for BigQuery: a columnar database built to scan large tables for reports.

It takes report scans and sends nothing on. Each scan is slow but has no capacity limit, and you pay for each scan on top of a small Burn. See [OLTP and OLAP](/glossary/oltp-and-olap).

Until you link a Data Warehouse, the [Database](/components/database) runs report scans on the primary. A scan there evicts the buffer cache and holds locks, so reads and writes of every kind slow. When an App Server links to both, scans go to the Warehouse, and the primary stops running them.

## When to place it

Place it when Reports appear in the mix and the Database slows across every kind, not just reports. The [Analytics on Primary](/sandboxes/analytics-primary) Sandbox shows it. It unlocks with [Data warehousing](/research/data-warehouse).

::Sandbox{id="analytics-primary"}

## How it fails

The Warehouse itself does not overload in the game. What goes wrong:

- [Report kills the database](/incidents/report-db): a quarter-end report scans every table on the primary. A Data Warehouse prevents it, because the scan never reaches the primary. Without one, cancel the report to end it.
- Each scan is slow, so report latency stays high. Reports are judged against their own target, so that is usually fine.
- Paid per scan, a heavy report mix shows up as a third-party cost in the Ledger.

:::Note{tone="real"}
Separating analytics from transactions is a classic lesson. Real teams copy data to a warehouse so reports never compete with checkouts.
:::

## Tips

- Place it before the Series B Era's reports grow, not after the first incident.
