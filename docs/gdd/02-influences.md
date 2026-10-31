# 2. Influences and research

[Index](./README.md) · Previous: [Vision](./01-vision.md) · Next: [Game loops](./03-game-loops.md)

This document records what we learned from comparable games and from players, and how each lesson
becomes a rule in Quorum. Research was done in October 2026 with web search. Sources are listed at
the end.

## Upload Labs

Upload Labs (EnigmaDev Studios, October 2025) is a free-to-play incremental game. The player
connects window-like Nodes that download, process, and upload files. It has about 5,000 English
Steam reviews, and about 89–90% of them are positive.

### Why players like it

| Observation                                                                                                                                                                               | Evidence                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Nodes are windows full of live numbers.** Each Node shows its own throughput and state, so the board is the dashboard.                                                                  | Wiki: Nodes are "window-like interfaces representing internal computer components and processes".                                 |
| **Flow goes left to right.** A source, processors, an uploader, and a collector. The player reads the chain at a glance.                                                                  | Getting-started guide: "The connection flow in the game is always from left to right."                                            |
| **Income per second is the score.** Players learn to watch the rate, not the total, and to compare before and after each change.                                                          | Nub Games guide: "Income per second is the better signal because it quickly shows whether a change delivered a real improvement." |
| **Upgrade the slowest stage.** The core skill is to find the limiting stage, not to add more Nodes. Extra branches can make the system slower because consumers share throughput.         | Nub Games guide: "upgrade the slowest stage instead of boosting the entire network at once".                                      |
| **Stacked multipliers invite theorycrafting.** Processors such as Refiner, Pre-analyzer, and Enhancer multiply value, size, or research yield. Players discuss the best chains on forums. | Steam discussion "Best combination to get research points?" with chains like "data refiner > pre-analyzer > enhancer > data lab". |
| **Resource ratios.** Advanced players split CPU, GPU, download, and upload by ratio to the cycles each Node needs.                                                                        | Steam guide "Full Guide 2.2": "If 1 node requires 100C and another requires 50C, split the CPU 2:1."                              |
| **Several currencies, several loops.** Cash, Tokens, Science, Hacker XP, and Application Points each feed a different system.                                                             | Upload Labs wiki, "Progression & Prestige".                                                                                       |
| **A prestige portal with modifiers.** Version 3.0 reworked the portal around "universe modifiers, which change how you play in exchange for increased game speed".                        | SteamDB patch notes, 20 September 2026.                                                                                           |
| **It runs in the background.** The game is light and can be minimized.                                                                                                                    | Getting-started guide.                                                                                                            |

### Why players quit

| Complaint                                                                                                                                                             | Evidence                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Shallow late game.** New file types repeat the same loop with a bigger number. "Unlocking a new machine or resource \[should introduce\] a fresh problem to solve." | Steam discussion "A promising concept hiding a shallow idle grind".                |
| **Numbers lose meaning.** Suffixes go k, M, b, t, and then aa, ab, ac. "This destroys any sense of scale or achievement."                                             | Same discussion. The author proposes a clear end target.                           |
| **Click tedium after prestige.** "Having to click on each network node 200 times for upgrades… this game triggered my carpal tunnel."                                 | Steam discussion "This game is painful".                                           |
| **Poor documentation.** "This game barely has any documentation, the guide is no help at all at some points."                                                         | Steam discussion "Questions about 2.0".                                            |
| **Monetization pressure.** Paid tokens and time generators feel like a mobile game.                                                                                   | VaporLens review summary; Steam store DLC list ("Daily Tokens", "Time Generator"). |
| **Confusing tutorial.**                                                                                                                                               | VaporLens: "Tutorial is confusing and buggy" is the top complaint.                 |

## Factorio

Factorio is the reference for automation games and is popular with software developers.

| Observation                                                                                                                                                                                              | Evidence                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Evenly spaced goals.** "It evenly spaces out its achievement moments so that you get a steady stream of goals."                                                                                        | Hacker News thread on Factorio addiction.                                                                               |
| **Every problem is the player's fault.** "Almost every single problem is directly caused by the player's own actions, through a logical chain of events."                                                | Same thread.                                                                                                            |
| **It feels like programming.** Concurrency, bottlenecks, deadlocks, and starvation appear in the factory. "The only thing preventing you from doing this to your application is the lack of visibility." | Same thread.                                                                                                            |
| **Watching the system settle.** "Once you make a change, watching the system come to equilibrium again is really fun."                                                                                   | Fuseki.net, "What Is Interesting About Factorio".                                                                       |
| **Refactoring is inevitable.** Early designs become obsolete, and rebuilding them is part of the fun.                                                                                                    | LeadDev, "Factorio and the promise of better software engineering"; James Quigley, "Dev Lessons Learned From Factorio". |
| **Blueprints.** Reusable, tileable designs save time and reward modular thinking.                                                                                                                        | James Quigley.                                                                                                          |
| **Flow from challenge and mastery.** "As soon as you reach one goal, there's always a new goal which immediately pops up."                                                                               | TheGamer, "Yes, Factorio Is Actually THAT Good".                                                                        |
| **No manipulative tricks.** "There are certainly no loot boxes or randomized rewards."                                                                                                                   | Hacker News thread.                                                                                                     |

## Opus Magnum and Zachtronics

| Observation                                                                                                                                   | Evidence                         |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **A crude solution is easy; a good one is hard.** "Finding an initial, crude solution is easy… you're just seeing if you can make it better." | PC Gamer.                        |
| **Histograms, not leaderboards.** "Instead of asking 'Can you be number one?'… they ask, 'Can you make it to the 70th percentile?'"           | PC Gamer.                        |
| **Three axes that conflict.** Cost, cycles, and area. It is hard to lead on all three at once, so players choose a direction.                 | Engadget; biggieblog.com.        |
| **Watching machines work is satisfying.**                                                                                                     | Game Developer, Road to the IGF. |

## Idle game theory

| Observation                                                                                                                                                                 | Evidence                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **A seesaw between production and cost.** Production first beats costs, then costs become prohibitive. Prestige lets the player get further along the cost curve each time. | Anthony Pecorella, "The Math of Idle Games" (Kongregate). |
| **Prestige creates ladder climbing.** A reset with a large boost gives a sense of power.                                                                                    | Same, Part III.                                           |
| **Phase shifts.** Universal Paperclips changes what the game is about several times. "It's not merely the fact that the numbers go up but how they do so."                  | The New Yorker; How-To Geek.                              |
| **A real ending.** Lantz wanted the game "to end in a way that let people pull back from it".                                                                               | hey.gg interview with Frank Lantz.                        |

## Translation table

This table turns each lesson into a Quorum rule and names the document that owns it.

| Lesson                         | Quorum rule                                                                                                                          | Owner                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Nodes as live windows          | Node cards show Inbound, Capacity with a load bar, Stack, Latency, and Out. No decorative art on the board.                          | [Interface](./15-ui-ux.md#node-cards)                |
| Left-to-right flow             | Users enter on the left. Data stores sit on the right. Payments and Analytics sit at the bottom.                                     | [Interface](./15-ui-ux.md#the-board)                 |
| Income per second              | The HUD leads with $/s. Each change shows a delta toast after the system settles.                                                    | [Interface](./15-ui-ux.md#feedback-after-a-change)   |
| Upgrade the slowest stage      | The simulation is a flow network. The tightest Node limits the chain, and the board marks it.                                        | [Simulation](./04-simulation.md#the-bottleneck)      |
| Stacked multipliers            | Runtimes, frameworks, and techniques multiply different terms of one formula, so combinations matter.                                | [Runtimes](./06-runtimes.md)                         |
| Resource ratios                | Instance types split vCPU and RAM. Each runtime spends them in a different ratio.                                                    | [Runtimes](./06-runtimes.md#the-capacity-model)      |
| Several currencies             | Cash, Insight, Dev Hours, and Legacy, each with one main source and one main sink.                                                   | [Economy](./09-economy.md)                           |
| Prestige with modifiers        | Exit grants Legacy. The next company picks a Venture and optional Mutators.                                                          | [Exit and Legacy](./13-prestige.md)                  |
| **Fix:** shallow late game     | Each Era adds a new failure mode, not a bigger number.                                                                               | [Progression](./10-progression.md#eras)              |
| **Fix:** meaningless numbers   | Real units only: users, rps, ms, $/s. The user count stops near 6 billion.                                                           | [Balancing](./16-balancing.md#number-ranges)         |
| **Fix:** click tedium          | Buy ×10 and Buy Max from day one, hold to repeat, policies at Series A, and Playbooks after the first Exit.                          | [Interface](./15-ui-ux.md#bulk-actions)              |
| **Fix:** poor documentation    | Every Component, runtime, and incident has an in-game card that names the real behavior. The engineering glossary ships in the game. | [Glossary](./glossary.md)                            |
| **Fix:** monetization pressure | No paid currency. No timers that payment can skip.                                                                                   | [Vision](./01-vision.md#pillar-5-respect-the-player) |
| **Fix:** confusing tutorial    | No tutorial screens. The Garage Era is the tutorial: one box, two request kinds, one choice at a time.                               | [Progression](./10-progression.md#era-0-garage)      |
| Evenly spaced goals            | Pacing targets: a new goal every 2–5 minutes early, every 10–20 minutes late.                                                        | [Game loops](./03-game-loops.md#pacing)              |
| Problems caused by the player  | Incidents attack weaknesses in the player's design. Random bad luck is rare and always survivable with redundancy.                   | [Incidents](./11-incidents.md#design-rules)          |
| Lack of visibility             | Observability is a progression track. The player earns p99, traces, and profiles.                                                    | [Observability](./12-observability.md)               |
| Watching the system settle     | After a change, the HUD shows "Settling", then "Stable" with the new rates.                                                          | [Interface](./15-ui-ux.md#feedback-after-a-change)   |
| Refactoring is inevitable      | Migrations, service splits, and data moves are real projects that cost Dev Hours.                                                    | [Team and velocity](./08-team-and-velocity.md)       |
| Blueprints                     | Playbooks: saved sub-designs that a player places in one action.                                                                     | [Exit and Legacy](./13-prestige.md#playbooks)        |
| Histograms on conflicting axes | Challenges score cost, p99, and complexity on three histograms.                                                                      | [Challenges](./14-challenges.md)                     |
| Phase shifts                   | Each Era changes what the player optimizes: one box, then scale-out, data, availability, teams, geography, and margin.               | [Progression](./10-progression.md#eras)              |
| A real ending                  | Each company ends at an Exit with a score. The player chooses to continue.                                                           | [Exit and Legacy](./13-prestige.md)                  |

## Sources

- Upload Labs on Steam: <https://store.steampowered.com/app/3606890/Upload_Labs>
- Upload Labs wiki, Nodes: <https://www.upload-labs.com/en/wiki/nodes>
- Upload Labs wiki, Progression & Prestige: <https://www.upload-labs.com/en/wiki/progression>
- Upload Labs getting-started guide: <https://www.upload-labs.com/en/guides/getting-started>
- Nub Games, Upload Labs guide: <https://nub.games/blog/upload-labs-guide>
- Steam guide, Full Guide 2.2: <https://steamcommunity.com/sharedfiles/filedetails/?id=3624112172>
- Steam discussion, best research combination: <https://steamcommunity.com/app/3606890/discussions/0/603043591290522295>
- Steam discussion, "This game is painful": <https://steamcommunity.com/app/3606890/discussions/0/601919346587124638/>
- Steam discussion, "A promising concept hiding a shallow idle grind": <https://steamcommunity.com/app/3606890/discussions/0/601919346587212222/>
- Steam discussion, "Questions about 2.0": <https://steamcommunity.com/app/3606890/discussions/0/684116795952744705>
- SteamDB, Upload Labs 3.0 patch notes: <https://steamdb.info/patchnotes/25397076/>
- VaporLens, Upload Labs review summary: <https://vaporlens.app/app/3606890/upload_labs>
- Hacker News, Factorio addiction thread: <https://news.ycombinator.com/item?id=24156475>
- Fuseki.net, What Is Interesting About Factorio: <https://www.fuseki.net/What-Is-Interesting-About-Factorio>
- LeadDev, Factorio and better software engineering: <https://leaddev.com/career-development/factorio-and-the-promise-of-better-software-engineering>
- James Quigley, Dev Lessons Learned From Factorio: <https://blog.quigley.codes/dev-lessons-learned-from-factorio>
- TheGamer, Factorio impressions: <https://www.thegamer.com/factorio-impressions-steam-rating-that-good/>
- PC Gamer, Opus Magnum: <https://www.pcgamer.com/perfectly-solving-opus-magnums-puzzles-is-impossible-but-thats-ok/>
- Engadget, Opus Magnum: <https://www.engadget.com/2018-07-09-opus-magnum-zachtronics-irl.html>
- Kongregate, The Math of Idle Games, Part I: <https://www.kongregate.com/en/pages/the-math-of-idle-games-part-i>
- Kongregate, The Math of Idle Games, Part III: <https://www.kongregate.com/en/pages/the-math-of-idle-games-part-iii>
- The New Yorker, Universal Paperclips: <https://www.newyorker.com/culture/culture-desk/the-unexpected-philosophical-depths-of-the-clicker-game-universal-paperclips>
- hey.gg, interview with Frank Lantz: <https://www.hey.gg/blog/frank-lantz>
