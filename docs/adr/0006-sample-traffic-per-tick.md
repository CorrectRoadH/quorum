# Sample traffic per tick instead of tracing all of it

Status: superseded by [ADR 0007](./0007-endless-idle-game-in-the-browser.md).

Each tick sends a fixed sample of requests into the simulation, and the money model scales that
sample up to the demand curve. The sample rate is scenario data.

Measured: tracing every request at 2000 requests per second across a 900-tick run costs about
30 to 40 seconds, which is affordable once but leaves no room for fast-forward. A sample of 200
requests per tick over 900 ticks still yields 180,000 latency samples for the report card and
costs about 3 seconds.

Considered options: tracing all traffic, and tracing in full only in a detailed mode. The first
removes the fast-forward control; the second gives two simulation modes to keep consistent.

## Consequences

- Reported percentiles come from the sample, so the sample rate is visible to the player.
- A scenario can lower the sample rate to teach what sampling means.
