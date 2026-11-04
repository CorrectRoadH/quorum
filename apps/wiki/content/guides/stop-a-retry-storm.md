---
title: Stop a retry storm
summary: End a Retry storm by cutting the retries that keep the Database overloaded, and set timeouts, backoff, and circuit breakers so the next slowdown stays small.
section: guides
order: 6
era: 3
aliases: retry storm, retries, metastable failure, timeout, backoff, jitter, circuit breaker, cascade
gdd: docs/gdd/11-incidents.md
---

Use this guide when a [Retry storm](/incidents/retry-storm) incident runs, or when errors stay high
after a Database slowdown has passed.

In a retry storm, the Database slows down for 20 seconds. Callers time out and retry at once, so
the Database gets several calls for each request. The slowdown ends, but the retries keep the
Database full. This is a [metastable failure](/glossary/metastable-failure): the overloaded state
holds itself up. The incident ends only when the Database has drained its backlog.

## Before you start

The call settings need [Timeouts and retries](/research/timeouts). Until you own it, every Link
waits 30 seconds and never retries. **Backoff** needs [Backoff with jitter](/research/backoff-jitter),
and **Breaker** needs [Circuit breakers](/research/circuit-breakers).

The director picks this incident most often when a Link into the Database uses **Retry 3×**.

## Recognize the storm

- The Database Load row stays red after the first seconds of the incident.
- The error share on the HUD stays high, mostly `timeout` in **Errors by cause** on the Users Node.
- With [Alerting](/research/alerting), the pager banner fires on errors.

## Stop it now

1. Press **Space** to pause, if you need time.
2. Select the first App Server that links to the Database. The Inspector opens.
3. Open the **Calls** section. It lists each Link out of the App Server by the Node at its end.
4. Under **Database**, change **Retry 3×** to **Backoff**. With backoff, retries wait and spread
   out, within a budget of 10% more calls. If you do not own Backoff, select **No retries**.
5. If you own Circuit breakers, select **Breaker** under the same Link. A breaker opens when half
   the calls on the Link fail. It sends nothing for 5 seconds and fails fast, then tries again.
6. Repeat steps 2 to 5 for every App Server and Worker that calls the Database.
7. If you own [Priority load shedding](/research/load-shedding), open **Overload** on each App
   Server and select **Shed low value**. The App Servers drop the cheapest kinds first, so less
   work reaches the Database.
8. Resume the game and watch the Database Load row.

If the Load row falls and the error share drops under 1%, the backlog is draining. The incident
ends when it is empty.

If the Load stays red, the Database is too small for the normal load, too. Select **Larger** on the
Database, or see [Scale the database](/guides/scale-the-database).

:::Note{tone="warn"}
A shorter timeout does not stop a storm. A **1 s** timeout with **Retry 3×** gives up early and
sends the call again, which adds load. Use a short timeout only with Backoff or a Breaker.
:::

## Prevent the next one

9. On every Link into a data Node, set the retries to **Backoff**, not **Retry 3×**.
10. Add a **Breaker** on Links to Nodes that can slow down: the Database, a Search Engine, and the
    Payment Provider.
11. Set **Shed low value** on every App Server as a default.
12. Keep spare capacity on the Database. A storm grows only when the slowed Database cannot keep
    up with its retries.
13. When a postmortem card opens, take its action item. The Retry storm card offers Backoff with
    jitter first, then Circuit breakers, then Priority load shedding.

:::Note{tone="tip"}
Retries on the Payment Provider have their own risk. A charge that timed out and is sent again
can charge twice. Research [Idempotency keys](/research/idempotency-keys) before you retry checkouts.
:::

## Check the result

14. Select the Users Node and read **Errors by cause**. `timeout` must stay near zero.
15. Open the Dashboard (D). The **Errors** chart must fall back under its 1% rule after the red
    incident line.
16. Check that Apdex on the HUD returns to its target.

:::Note{tone="real"}
Retry storms cause many real cascading outages. Researchers call them metastable failures (HotOS
2021, OSDI 2022). Real clients use exponential backoff with jitter, retry budgets, and circuit
breakers for the same reason the game does.
:::

## Practice

The [Retry Storm](/sandboxes/retry-storm) Sandbox starts with every App Server call to the
Database set to a 1 s timeout and **Retry 3×**. The Database slows twice. The second time, you
must also stay under a Burn limit.

## Related

- [Errors and retries](/explanation/errors-and-retries) explains how retries multiply load.
- [Retry with backoff and jitter](/glossary/retry-with-backoff-and-jitter),
  [Circuit breaker](/glossary/circuit-breaker), and [Timeout](/glossary/timeout) in the glossary.
