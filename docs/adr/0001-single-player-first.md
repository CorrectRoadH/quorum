# Quorum ships single-player first

Quorum ships as a single-player game. Each Company has one player. Shared companies, co-op, and
competitive modes are deferred.

Considered options: multiplayer from the start. Rejected because the core loop must be validated
alone, an idle game is played at each player's own pace, and multiplayer would need a shared
authority for the Simulation, which conflicts with offline progress.

## Consequences

- The Company Simulation runs on the player's device ([ADR 0002](./0002-endless-incremental-game-in-the-browser.md)).
- Players compare results through Challenge histograms and shared Playbooks, not shared Companies.
- Teams in the game are simulated Engineers, not other players.
