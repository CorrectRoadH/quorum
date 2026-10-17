# A run is one bounded month

A run is a bounded session that represents one month. The player starts with a small capital
and a small design, demand grows during the month, income follows the requests the design
serves, and the month ends in a report card. Leftover capital carries into the next scenario,
so progression lives across scenarios instead of inside one endless session.

Considered options: endless growth in the style of Factorio, and a fixed-budget puzzle with no
time. Endless growth has no natural scoring moment and needs save, resume, and a difficulty
curve; the fixed-budget puzzle gives the player nothing to react to during the run, so the
adapt step of the loop has no driver.

## Consequences

- Scenario data owns starting capital, income, the demand curve, and the duration.
- An endless scenario later is scenario data (a long duration and a rising curve), not a
  change to the architecture.
- The run's clock shows the month, and money is the number the player watches.
