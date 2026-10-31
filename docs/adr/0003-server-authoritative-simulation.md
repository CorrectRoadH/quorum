# The server owns the simulation and the game owns the clock

Status: superseded by [ADR 0007](./0007-endless-idle-game-in-the-browser.md).

The server runs the simulation. The client sends intents and renders snapshots. The server
advances the cluster in fixed steps under its own control, because reproducibility requires a
paused cluster driven by explicit steps; an unpaused cluster follows real wall-clock time and
is not reproducible.

Considered options: a client-side simulation. Rejected because the run needs one authority for
validated intents and because multiplayer would move it to the server anyway.

## Consequences

- One protocol covers single-player and multiplayer: intents in, snapshots out.
- Determinism becomes a server-side test property: the same seed and the same step sequence
  give the same run.
- The simulation dependency stays out of the browser bundle.
- A ticking run bills for the whole session, because scheduled work prevents the room from
  hibernating.
- The simulation engine offers no cluster snapshot or restore, so a resumed run or a late
  joiner needs the game's own serialized view (design, tick, economy, seed) rebuilt by replay.
