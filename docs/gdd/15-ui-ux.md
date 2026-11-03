# 15. Interface and game feel

[Index](./README.md) · Previous: [Sandbox, Challenges, and achievements](./14-challenges.md) · Next: [Balancing](./16-balancing.md)

This document applies [pillar 4: the board is the dashboard](./01-vision.md#pillar-4-the-board-is-the-dashboard)
and [pillar 5: respect the player](./01-vision.md#pillar-5-respect-the-player).

## Interface rules

1. **Information over decoration.** Squares on the board carry numbers. Illustrations appear only on
   the title screen, Era transitions, and Exit screens.
2. **No helper text.** No taglines, subtitles, or secondary labels. If a screen needs them to make
   sense, the layout is wrong. Explanations live in Tradeoff cards and the glossary, opened on demand.
3. **One click to the cause.** From any red number, one click opens the Node or link that causes it.
4. **Real units.** rps, ms, MB, $/s, users. No abstract points on the board.
5. **Fullscreen.** The board fills the window. Panels slide over it and close with Escape.
6. **Show only what the player can use.** A control appears when the game state makes it useful
   ([Progressive disclosure](#progressive-disclosure)). A locked control is not shown before its Era.

## Layout

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ HUD: $/s · Cash · Burn · Users (growth) · Apdex · p99 · Error % · Insight · DH · Date │
├──────────────────────────────────────────────────────────────────────────────┬───────┤
│                                                                              │       │
│                                   BOARD                                       │ Inspector
│   Users ──► [DNS] ──► [LB] ──► [App] [App] ──► [Pool] ──► [SQL] ──► [Replica] │ (slides │
│                                   │                    └──► [Cache]          │  in)   │
│                                   └──► [Queue] ──► [Worker] ──► [S3]          │       │
│                                                                              │       │
│   [Payments]                      [Analytics]                                │       │
├──────────────────────────────────────────────────────────────────────────────┴───────┤
│ Dock: Edge · Compute · Data · Async · Platform · Managed      Research · Team · Cost  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

The layout shows every element. A new Company starts with fewer
([Progressive disclosure](#progressive-disclosure)).

## Progressive disclosure

The Garage Era is the tutorial ([Progression](./10-progression.md#era-0-garage)), so its screen must
not show the whole game. A new Company starts with the Board, the build dock, the Inbox, pause and
speed, and four HUD rows: Cash, Users, Apdex, and Latency. Every other element appears the first
time the game state makes it useful.

### Rules

1. **Once shown, always shown.** An element stays for the rest of the Company. Controls that hide
   again are harder to learn than controls that never hid.
2. **The reveal is the cue.** A newly shown element animates in once and glows until the player uses
   it, for at most 30 seconds at any speed. There is no text, toast, or arrow. With reduced motion,
   the glow holds still.
3. **One reveal at a time.** When two triggers fire together, the second element waits until the
   player uses the first or 30 seconds pass.
4. **The save keeps the revealed set.** A save without the set reveals everything.
5. **Experienced players see everything.** The Sandbox, Challenges, and every Company after the first
   Exit show every element in the table below. The build dock and the Research screen follow their
   own rules for every player.
6. **How to play never opens by itself.** It stays on `H` for the player who looks for it. The
   reveals and the mentor's Mail ([Mail](./18-mail.md)) teach the Garage.

### Triggers

| Element                            | Appears when                                                     |
| ---------------------------------- | ---------------------------------------------------------------- |
| Undo and redo                      | The player makes the first Board action                          |
| Collect glow on Payments           | The drawer is half full for the first time                       |
| Resize glow on a Node card         | The Node is the bottleneck for the first time                    |
| Insight HUD row and Research (`R`) | Insight reaches the cost of the cheapest available Research item |
| Errors HUD row                     | The first request fails                                          |
| Team (`T`) and the Feature HUD row | The first Feature is built                                       |
| Hiring in the Team panel           | The Pre-seed Era starts                                          |
| Engineering in the Team panel      | The first memory leak or the first tech debt                     |
| Autopilot in the Team panel        | The backlog holds two items                                      |
| Glossary (`G`)                     | The first Tradeoff card opens                                    |
| Dashboard (`D`)                    | Metrics is researched                                            |
| The pager                          | Alerting is researched                                           |
| Postmortems                        | The first incident ends                                          |
| Playbooks (`P`)                    | The first Exit                                                   |
| Region tabs                        | The Series C Era starts                                          |

### The build dock

- A group lists the Components the player can place, then at most one locked Component: the one with
  the cheapest available Research item. Other locked Components do not show.
- A group with nothing to place and nothing one Research item away does not show.
- The number keys follow the visible order.

## The board

- Flow goes left to right: Users on the left, the data tier on the right, Payments and Analytics at the
  bottom. The board does not enforce this, but new Nodes snap to the matching column.
- Pan with drag, zoom with the wheel. At low zoom, cards collapse to a chip with a load ring.
- Cards never overlap. Each card keeps 24 px clear around it. A card dropped on others moves to the
  nearest free spot, preferring its column, and an outline shows that spot while the card is held.
- Links are belts. They run around cards in orthogonal lanes. Links into one Node merge into one
  trunk; links out of one port keep separate lanes and leave through a splitter. Where two belts
  cross, the vertical one goes underground: a gap with a mouth at each end.
- Chevrons on a belt point the way it runs and move at its speed. Requests ride on it as items. A
  busier belt runs faster; an idle belt is grey and still.
- A link with errors turns red. A belt that crosses zones has orange rails: its calls pay the
  cross-zone latency and Egress. A link that crosses regions shows its latency.
- From Series C, each region is a tab with its own board.
- Node groups: the player can box a set of Nodes as a Service. The box shows the Service's name, team,
  and Stack.

## Node cards

Each card is a small window, like Upload Labs. The card is the main information surface.

```text
┌─ APP · PHP-FPM · Laravel ─────── L3 ┐
│ Inbound     420 rps                  │
│ Capacity    ▓▓▓▓▓▓▓▓░░  82% of 512   │
│ Limit       workers 20/20            │   ← after research `profiling`
│ Latency     38 ms   p99 210 ms       │   ← p99 after research `percentiles`
│ Out         q-read 840 · q-write 60  │
│ [Upgrade $1.2k]                      │
└──────────────────────────────────────┘
```

| Element       | Rule                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Code chip     | Three or four letters (`APP`, `SQL`, `KV`, `CDN`). Color by group.                                                 |
| Status stripe | Left edge. Green, amber above 70%, red above 90%, grey when down, striped when warming up.                         |
| Stack         | Runtime variant and framework for compute Nodes. Engine and mode for data Nodes.                                   |
| Load bar      | Utilization of the limiting resource.                                                                              |
| Stranded row  | Red, replaces Out, when requests have nowhere to go.                                                               |
| Bottleneck    | A pulsing outline on the one Node with the highest lost revenue ([Simulation](./04-simulation.md#the-bottleneck)). |

## Feedback after a change

The Factorio pleasure of watching a system settle is a feature
([Influences](./02-influences.md#factorio)).

1. The player makes a change.
2. The HUD shows **Settling** while queues drain and caches warm, with a small progress ring.
3. When rates stop changing (less than 1% change over 3 seconds), the HUD shows **Stable**.
4. A delta toast compares before and after: "+$1.40/s (+18%) · p99 −120 ms · errors −2.1%".
5. If the change made things worse, the toast is red and offers Undo.

Undo and redo cover every board action for the last 50 actions. Undo refunds the full cost if the
action was less than 30 seconds ago, so experimenting is cheap. After 30 seconds, undo settles Cash
at normal prices: a Node it removes refunds like a sale, a Node it brings back costs its price, and a
resize refunds nothing. Undo and redo never gain Cash. Undo keeps what time did to each Node, such as
credits, a leak, or an incident outage.

Rates count as stopped when revenue and served requests agree within 1%, and the error share within
0.1 points, over 12 UI ticks (about 3 seconds). A change that has not settled after 30 sim seconds
shows its delta anyway.

## Tradeoff cards

A Tradeoff card appears when the player chooses an option: a runtime, a variant, a cache strategy, a
replication mode, a deploy strategy, a pricing model.

```text
┌ Runtime: PHP-FPM → Node.js (cluster) ─────────────────────────────────┐
│        Throughput ●────────○         Radar of the six axes            │
│              Tail ●──○                                                │
│            Memory ○──────●                                            │
│          Velocity ●○                                                  │
│        Resilience ●──────○                                            │
│       Operability ○──●                                                │
│                                                                       │
│ On your design (preview):  +$0.80/s · p99 +40 ms (login blocks loop)  │
│ Cost: 120 DH migration · 4 calendar days                              │
│ [Glossary: event loop] [Glossary: process per request]   [Confirm]    │
└───────────────────────────────────────────────────────────────────────┘
```

- **Preview** runs a ghost copy of the simulation for 10 sim seconds with the option applied and
  shows the result. The player sees the effect on their own design before they pay.
- The card names the real behavior behind each axis and links to the
  [engineering glossary](./glossary.md).
- After the first time, the card collapses to one line with the preview numbers.
- The preview shows the settled effect: the changed Nodes start up and warm. The restart is stated
  on its own, as "restarts cold for N s".
- Hovering an option shows its card. Clicking pins it with Confirm and Cancel. Once an option set
  has been confirmed, a click applies the option at once.
- The radar is drawn for Stack choices only (runtimes and frameworks), where
  [Runtimes](./06-runtimes.md) defines the six axes. Other option sets, such as the instance family,
  show the preview and cost lines.
- Until the in-game glossary (M9), glossary terms show as text that names their glossary entry on
  hover.

## Bulk actions

The fix for Upload Labs click fatigue ([Influences](./02-influences.md#why-players-quit)).

| Tool                 | Available from | Effect                                                                               |
| -------------------- | -------------- | ------------------------------------------------------------------------------------ |
| Buy ×1, ×10, Max     | Start          | Upgrade or place several at once                                                     |
| Hold to repeat       | Start          | Holding Upgrade repeats it every 150 ms                                              |
| Upgrade all of type  | Start          | One action for every selected Node                                                   |
| Multi-select         | Start          | Drag a box; act on all                                                               |
| Copy and paste       | Start          | Duplicate a selection with its links and settings                                    |
| Autoscaler           | Series A       | Capacity follows demand ([Components](./05-components.md#autoscaler))                |
| Policies (Autopilot) | Legacy         | Rules such as "keep App Servers below 70% at peak" and "research cheapest available" |
| Playbooks            | Legacy         | Place a saved design in one action ([Exit and Legacy](./13-prestige.md#playbooks))   |

Rule: no action needs more than five repeated clicks without a bulk alternative.

## Panels

| Panel     | Opens with   | Contents                                                                   |
| --------- | ------------ | -------------------------------------------------------------------------- |
| Inspector | Click a Node | All numbers for the Node, its options, its history, and its Tradeoff cards |
| Research  | `R`          | The tree by track ([Research screen](#research-screen))                    |
| Dashboard | `D`          | Charts over time ([Observability](./12-observability.md#the-dashboard))    |
| Team      | `T`          | Teams, engineers, the backlog, policies, DORA metrics                      |
| Cost      | `C`          | The cloud bill by line, per service, and per kind                          |
| Inbox     | `I`          | Mail: advice, offers, and reports ([Mail](./18-mail.md))                   |
| Incidents | —            | The active incident, history, postmortems, runbooks                        |
| Glossary  | `G`          | The engineering glossary, with discovered entries highlighted              |
| Company   | `E`          | Era, milestone, funding, Equity, valuation, the IPO checklist              |

## Research screen

- A fullscreen tree that scrolls. Each track is a tree that grows up from its root, through one
  band per Era. Items with no prerequisite in their track branch off the track's trunk.
- Locked items are visible and greyed, with their requirements, so the player can plan ahead.
  Items beyond the next Era are faded. The screen opens scrolled to the focused item.
- Each item shows its cost, its effect in one line, and what it unlocks.
- A queue: the player can queue items, and they are bought automatically when Insight allows.

## Notifications

Advice and offers are Mail ([Mail](./18-mail.md)). The rules below cover what stays on the Board.

- One banner at a time at the top of the board. Incidents take priority.
- No sounds or popups for routine events. A short sound for an incident and for an Era milestone,
  both mutable.
- Era transitions use a full-screen card with an illustration, the new kinds, and the new problem in
  one sentence. One click to continue.

## Offline return

A single card: time away, users then and now, Cash, Insight, and Dev Hours earned, the peak hour and
its worst utilization, and one suggestion if users were lost at peak.

## Accessibility

- Request kind colors pass contrast checks, and each kind also has a particle shape (circle, square,
  triangle, diamond) for color-blind players.
- Status uses icons and stripes as well as color.
- Reduced motion: particles become static flow arrows with rate labels.
- Every action has a keyboard shortcut. The board supports keyboard navigation between Nodes.
- Text scales to 150% without breaking cards.

## Save

- Autosave to local storage every 10 seconds and on every Era change.
- Export and import a save as a text string.
- Three save slots.
