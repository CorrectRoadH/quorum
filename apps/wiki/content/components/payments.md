## What it does

Payments stands for the invoices and payouts that turn your users' activity into money in the bank.

Every successful request earns revenue, and that revenue waits in the Payments drawer. Click Payments to collect it into Cash. The drawer holds about a minute of revenue at your current rate. Each size step doubles what it holds.

Payments takes no links and sends nothing. It does not slow requests and it cannot fail. The [Stripe Billing](/research/stripe) Research collects revenue for you, so the drawer stops mattering.

Payments is not the [Payment Provider](/components/psp). The Payment Provider charges cards for checkouts. Payments only holds the money you already earned.

## When to place it

Payments is always on the board. You resize it.

The symptom is a "Your payout drawer is full" banner. While the drawer is full, new revenue spills and is lost. Resize the drawer when you cannot collect often enough, for example during a long session of building. Research Stripe Billing when you want to stop collecting by hand.

## How it fails

A full drawer is the only failure. Revenue beyond its size is lost, and your Cash stops growing while Burn keeps falling on it. Your users notice nothing, so the loss is easy to miss. Watch Cash: if it falls while Apdex is good, check the drawer first.

No incident targets Payments.

## Tips

- Collect before you leave a Company running for a while.
- Stripe Billing is cheap early Research and removes a chore for the rest of the run.
