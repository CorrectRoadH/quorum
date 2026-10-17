# Architect ships single-player first

Architect ships as a single-player game. The multiplayer design in the original handoff
(rooms, chat, proposals, per-role budgets, reconnection, late joiners) is deferred, and the
run is built so that one run can later serve several players.

Considered options: multiplayer in v1 alongside single-player. Rejected because the core
loop must be validated alone, game feel does not improve with more players, and the
multiplayer surface roughly triples the work.

## Consequences

- Roles survive as hats the single player wears, not as separate owners.
- Every run has one client.
- The intent protocol serves one client in v1 and does not change for multiplayer.
