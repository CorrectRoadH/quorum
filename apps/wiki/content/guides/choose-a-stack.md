---
title: Choose a Stack
summary: Pick the runtime and framework for your App Servers from the limit your Design hits, then move to it with a migration that shifts traffic in steps.
section: guides
order: 8
aliases: stack, runtime, framework, language, migration, php, node, go, java, rust, elixir, strangler
gdd: docs/gdd/06-runtimes.md
---

Use this guide when your App Servers hit a limit that capacity does not fix, or when you want the
Team to ship Features faster.

A Stack is a runtime and a framework. No Stack is strictly better. Each one trades throughput, tail
latency, memory, and how fast the Team ships. See [Runtimes](/runtimes) for every option and its
numbers.

## Name the problem first

1. Select an App Server and read its **Resources** gauges.
2. Find your problem in the table. It points to the Stacks that fix it.

| What you see                                   | Stacks that help                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **RAM** is full before **CPU**.                | A runtime with little memory per request: [Go](/runtimes/go), [Tokio](/runtimes/tokio), [Node.js](/runtimes/node).             |
| **Workers busy** is full and CPU is low.       | A runtime where waiting holds no worker: [Go](/runtimes/go), [Node.js](/runtimes/node), [Kestrel](/runtimes/kestrel).          |
| One slow request raises the p99 of every kind. | A runtime with no single event loop: [Go](/runtimes/go), [BEAM](/runtimes/beam). Or [Node.js cluster](/runtimes/node_cluster). |
| The p50 is fine and the p99 spikes.            | A runtime with no GC pauses: [Tokio](/runtimes/tokio), [BEAM](/runtimes/beam). Or tune the collector on Java and Go.           |
| CPU is full on a small Design.                 | A faster runtime, or a framework with less overhead. [OPcache](/research/opcache) makes PHP 2.5 times faster.                  |
| Features ship too slowly.                      | A framework that ships fast: [Laravel](/frameworks/laravel), [Rails](/frameworks/rails), [Django](/frameworks/django).         |

Fast-shipping frameworks cost CPU, and Laravel, Rails, and Django send
[N+1 queries](/glossary/n1-query) until you research [Eager loading](/research/eager-loading).

## Compare the options

3. Open the **Runtime** section of the App Server.
4. Hold the pointer over a runtime. A Tradeoff card draws its six axes against your current Stack,
   with a preview of what it does to this Design.
5. Do the same in the **Framework** section. It lists only frameworks for the runtime's language.
6. A greyed option needs Research. Its tooltip names the Research that unlocks it.

Also compare the language's salary and time to hire. You hire engineers for the language of your
service, so a rare language makes the Team more expensive and slower to grow. See
[Team and velocity](/explanation/team-and-velocity).

## Start the migration

In a Company, a new Stack is a migration of the whole service, not a click.

7. Select the new runtime or framework on any App Server. The first time you pick from a section,
   the Tradeoff card stays open. Click **Confirm** on it. The game starts a migration and puts its
   first step on the Team backlog.
8. Press **T** to open the Team panel. A migration card at the top shows the old and new Stack.

The cost in Dev Hours depends on how large the change is and on your codebase. A runtime of the
same language costs least. A framework costs more. A new language costs most, and more again for a
language that ships slowly.

## Shift traffic in steps

The migration moves App Servers to the new Stack in four steps: 5%, 25%, 50%, and 100%. This is the
[strangler pattern](/glossary/strangler-pattern).

9. Wait until the card shows **Ready**. The Team has built the step.
10. Click **Shift to …%**. The game moves that share of App Servers to the new Stack. They restart
    cold. With **Autopilot** on, the game shifts each ready step for you.
11. Watch the **Bugs** badge on the card. Requests on the new Stack fail a small share of the time
    until the **Fix migration bugs** task ships. The game queues that task for you.
12. Check Apdex and the error share on the HUD after each step.

If the new Stack makes things worse, click **Cancel** on the card. The moved App Servers go back,
and the Dev Hours you spent are lost. You cannot cancel after the last step. Fix its bugs instead.

:::Note{tone="warn"}
Features build at half speed while a migration runs. Start one when the Design is stable, not
during an incident.
:::

## Smaller changes

You do not always need a new language:

- **Pool size.** On PHP-FPM and Gunicorn, the **Pool size** section sets the workers. Keep the count
  at or under **RAM fits**.
- **Collector.** On Java, research [ZGC](/research/zgc) and pick it in **Collector**.
- **GOGC.** On Go, research [Go GC tuning](/research/gogc-tuning) and change **GOGC**.
- **Node.js cluster.** Research [Node.js cluster mode](/research/node-cluster) to use every core.

Workers run their own Stack. A change on a Worker takes effect on that Worker at once.

## Check the result

13. After the last shift, the card shows **Migrated** until Fix migration bugs ships. Then the card
    closes.
14. Read the gauge that was full in step 1. It must have room now.
15. Read **Velocity** on the Users Node. It shows how fast the current Stack ships.

## Practice

The [Event Loop Stall](/sandboxes/event-loop-stall) and [GC Pauses](/sandboxes/gc-pauses) Sandboxes
each show one runtime's weakness. In a Sandbox, a Stack change applies at once, with no migration.

## Related

- [Runtimes](/runtimes) lists every runtime and framework.
- [Read p99 and tail latency](/guides/read-p99) for GC pauses and event-loop stalls.
