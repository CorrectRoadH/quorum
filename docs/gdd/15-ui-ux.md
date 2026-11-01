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

## The board

- Flow goes left to right: Users on the left, the data tier on the right, Payments and Analytics at the
  bottom. The board does not enforce this, but new Nodes snap to the matching column.
- Pan with drag, zoom with the wheel. At low zoom, cards collapse to a chip with a load ring.
- Links show direction with particles. Link thickness scales with the log of throughput.
- A link with errors turns red. A link that crosses zones is dashed. A link that crosses regions shows
  its latency.
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
action was less than 30 seconds ago, so experimenting is cheap.

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
| Team      | `T`          | Teams, engineers, the backlog, policies, DORA metrics                      |
| Cost      | `C`          | The cloud bill by line, per service, and per kind                          |
| Incidents | `I`          | The active incident, history, postmortems, runbooks                        |
| Glossary  | `G`          | The engineering glossary, with discovered entries highlighted              |
| Company   | `E`          | Era, milestone, funding, Equity, valuation, the IPO checklist              |

## Research screen

- Tracks as columns, Eras as rows. Locked items are visible and greyed, with their requirements, so
  the player can plan.
- Each item shows its cost, its effect in one line, and what it unlocks.
- A queue: the player can queue items, and they are bought automatically when Insight allows.

## Notifications

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
