---
title: Your first Company
summary: Start a Company in the Garage, read the board, collect your first revenue, and grow toward the first funding round.
section: tutorials
order: 1
era: 0
aliases: first run, start, new game, garage, collect, payments, drawer, hud
gdd: docs/gdd/03-game-loops.md
---

In this lesson you start a Company, learn what each part of the board shows, and earn your first
Cash. You need about ten minutes. You do not build anything yet.

## Start the Company

1. Open Quorum. A badge reader shows on the screen.
2. Click the **Founder** badge to clock in. The main menu opens.
3. Select **Start a company**. The New company screen opens.
4. Type a name in **Company name** and select a logo. The logo appears on the title screen and in
   the game menu.
5. Leave **B2B SaaS** selected. It is the only Venture at the start. Mutators are locked until you
   earn them.
6. Select **Found**, at the bottom of the screen.

The board opens in the **Garage**, the first [Era](/eras/garage). The game shows only a few
controls now. Other controls appear one at a time, when they become useful.

## Read the board

The board holds four Nodes, joined by Links. Requests move along the Links from left to right.

- **Users** is where traffic starts. Its card shows your user count, your Apdex, and the requests
  per second that users send.
- **App Server** is your only box. It runs PHP under Apache, and the PostgreSQL database runs on
  the same box. It is a small, cheap Burstable machine.
- **Analytics** samples the App Server's traffic and turns it into Insight.
- **Payments** holds the revenue that your users pay.

::Component{id="server"}

Select the App Server. The Inspector opens on the right. Read the **Load** row: it shows how much of
the box's capacity is in use. Find the **Resources** section. It shows the CPU, RAM, and CPU credits
gauges. Press **Esc** to close the Inspector.

In the Garage, users send two request kinds: page views and API reads.

::Mix{era="0"}

## Read the HUD

The HUD is the panel at the top left. At the start it shows four rows:

- **Cash**: the money you can spend, and your net income per second.
- **Users**: your user count, and a ▲ or ▼ for the recent trend.
- **Apdex**: how satisfied your users are, from 0 to 1, next to the Era's target.
- **Latency**: the mean time to answer a request.

The top row shows the Era's name and the calendar time. One second of game time is one minute on
the calendar. The bar under it fills as your users approach the next funding round.

Your Company starts with 150 users and $300. Users grow while Apdex stays at or above the target, and
they leave when it falls below. For the reason, see [Apdex and revenue](/explanation/apdex-and-revenue).

## Collect your revenue

Revenue does not go to Cash by itself. It waits in the Payments drawer.

1. Wait about thirty seconds. Watch the Payments card. Its **Drawer** row fills.
2. Find the button at the bottom of the Payments card. It reads **Collect** and an amount.
3. Click **Collect**. A toast confirms the amount, and the Cash row on the HUD rises.

You can also press **C** anywhere on the board to collect.

The drawer holds about a minute of revenue. When it is full, new revenue spills and is lost, and the
game warns you. Collect at least once a minute while you play.

:::Note{tone="tip"}
When the drawer is half full for the first time, the Collect button glows. The glow is the game's
only hint. It stops when you use the button.
:::

## Control the clock

- Press **Space** to pause and resume.
- Press **S** to change the speed. Each press moves to the next speed.

Pause when you want to read the board. Nothing changes while the clock stops.

## Watch your users grow

1. Set the speed to a faster step.
2. Collect when the drawer fills.
3. Watch the **Users** row. The number climbs.
4. Watch the App Server's **Load** row. It climbs with your users.

As load grows, the box gets closer to a limit. Its row turns amber at 70% and red at 90%. Soon one
of its resources runs out. The next lesson shows you how to find and fix that limit.

## Know the goal

The Garage ends at 1,000 users. When you reach it, a button for the **Pre-seed offer** appears
under the Era name on the HUD. You raise that round in [Your first incident](/tutorials/first-incident).

Press **H** at any time to open **How to play**. It lists the keys and the six core actions.

## What you learned

- The board shows your Design: Users, the App Server, Analytics, and Payments.
- The HUD shows Cash, Users, Apdex, and Latency.
- Revenue waits in Payments until you collect it.
- Users grow while Apdex meets the Era's target.
- Each Company is saved separately, with its own name and logo.

:::Note{tone="tip"}
Quorum saves this Company every ten seconds. To start another, go to the title screen and select
**Start a company**; this one stays in **Companies**. If you played the playtest build, read
[Import your playtest save](/guides/import-your-playtest-save).
:::

Next: [Your first bottleneck](/tutorials/first-bottleneck).
