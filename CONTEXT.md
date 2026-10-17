# Architect

A learning game about system design. A player assembles an architecture from a fixed catalog
and watches a simulation run it for one month.

## Language

### The design

**Component**:
An entry in the fixed catalog that a player can place, with its own cost, capacity, and configuration options.
_Avoid_: building, node type, component type

**Cluster Component**:
A Component that becomes real Kubernetes resources in the simulated cluster, and therefore appears in the generated manifest.
_Avoid_: workload, native component, pod component

**Managed Component**:
A Component the game models itself, outside the simulated cluster, because the simulation does not provide it.
_Avoid_: external service, cloud service, SaaS, third-party

**Node**:
One placed copy of a Component, with its own configuration and its own row in the metrics table.
_Avoid_: instance, box, entity

**Design**:
The Nodes a player places and the connections between them.
_Avoid_: topology, blueprint, layout, architecture

**Manifest**:
The Kubernetes resources a Design compiles to, shown read-only as a teaching artifact.
_Avoid_: YAML, spec, config, output

### The simulation

**Cluster**:
The simulated Kubernetes cluster that runs a Run's Cluster Components.
_Avoid_: environment, sandbox, k8s cluster, backend

**Simulation**:
The game's own model of demand, load, failures, and money running against a Design, as distinct from the cluster's Kubernetes behaviour.
_Avoid_: engine, kernel, simulator

**Tick**:
One step of simulated time. A Run advances in Ticks.
_Avoid_: frame, turn, step, round

### The numbers

**Ledger**:
The complete set of figures that the Simulation derives for a Design at a given Tick. It is the single source of truth for every figure the game shows.
_Avoid_: spreadsheet, simulation state, model, stats

**Metrics table**:
The panel that presents the Ledger, one row per Node.
_Avoid_: spreadsheet, dashboard, stats panel

**Capital**:
The money a player holds. Placing a Node spends it, and served requests earn it.
_Avoid_: budget, wallet, cash, funds

**Burn**:
The monthly cost a Node accrues for as long as it exists. Removing the Node stops the Burn but returns no Capital.
_Avoid_: opex, running cost, upkeep

**Income**:
The money earned for each request that the Design serves.
_Avoid_: revenue, earnings, takings

### A session

**Scenario**:
A fixed challenge: a brief, a demand curve, a starting Capital, targets, and the failures that occur during it.
_Avoid_: level, map, mission, exercise, puzzle

**Run**:
One play-through of a Scenario, from the first Tick to the report card.
_Avoid_: session, match, game, playthrough

**Role**:
One of the three owners a player can wear as a hat. A Role groups Components and shows that owner's objective and score.
_Avoid_: class, faction, seat, player type

**Report card**:
The scored outcome of a Run: one score per axis, with the reasons behind each score.
_Avoid_: results screen, score screen, grading, summary

**Tradeoff card**:
The forced choice that a configuration option presents when a player places or configures a Node, with the consequence of each option. A card belongs to the choice, not to a Component, so several Components can share it.
_Avoid_: tooltip, info card, lesson, tutorial
