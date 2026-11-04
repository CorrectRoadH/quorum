# State machines are for flows, not for numbers

A flow with exclusive phases and more than one event uses a Machine. A number that the solver
integrates stays a number.

The flows were written as nullable fields, booleans, and sentinel numbers, and every rule was an
`if` at the point of use: `{ phase: 'build' }` could still carry a result, a board could hold a
Sandbox and a Challenge at once, and a Node's `down`, `warm` and `downCause` could disagree. Foldkit
ships `foldkit/experimental/machine`, a declarative transition table over two `Schema` unions. Effect
4.0.0 ships no state-machine module: it has `Ref`, `SubscriptionRef`, and `Durable Workflow`, which
are stores and durable execution, not a transition table.

## Decision

1. A flow with exclusive phases gets a Machine in `apps/web`, with its state as a tagged `Schema`
   union beside it. The union makes phase-and-payload combinations unrepresentable. The Machine's
   table makes the legal events per phase explicit, and every other event leaves the state
   unchanged (`Ignored`) instead of running a handler.
2. Flows live in `apps/web`. An exclusive simulation mode is a tagged union in the save, because
   `packages/simulation` may import only `effect` ([ADR 0004](./0004-simulation-package.md)) and a
   `Game` is saved, replayed, and hashed. Its transitions live in one function. A gauge that the
   solver integrates, such as `credits`, `leak`, or queue `depth`, stays a number inside the state.
3. Adopting a Machine is a refactor of the flow when you touch it, not a rewrite of the app.
   `Model`, the `Message` union, and the views keep their shape; only the flow's own state changes.

## Applications

- **Challenge run** (`challenge-machine.ts`): `Building | Running | Result`. `Building` has no
  replay, `Running` has no result, and only `Result` has a verification. This fixed a latent bug:
  `ChallengeVerified` and `ChallengeUnverified` used to patch any open run, including a build board.
- **Boot** (`boot-machine.ts`): `Shut | Clocking | Ready | Connecting`. It replaced `gate` plus a
  `connecting` boolean, which allowed "shut and connecting". A reveal that arrives before the
  clock-in, or a connect that arrives before a board opens, is ignored.
- **Board session** (`session-machine.ts`): `Company | Sandbox | Challenge`. It replaced two
  nullable fields, which allowed a Sandbox and a Challenge at once.
- **Node lifecycle** (`packages/simulation/src/life.ts`): `Running | Warming | Restarting | Stopped`,
  stored as `GameNode.life`. It replaced `down` (0, seconds left, or −1), `warm`, and `downCause`.
  Decoding derives `life` from the old fields, so a save from before the machine opens; encoding
  writes `life`, so the phase is explicit in the save. `SIM_VERSION` 17 and the golden hashes moved
  with it.
- **Stack migration** (`packages/simulation/src/migration.ts`): `Building | Ready | Finishing`. It
  replaced `ready` and the `step = 4` sentinel; `step` is a payload only while another tranche is
  left. Decoding derives the state from `step`, `ready` and `bugs`. The golden hashes did not move,
  because no recorded Company or Challenge runs a migration.

`update.ts` prepares payloads and effects, then calls the flow's `step`; an event that does not
apply returns the same state.

## Consequences

- Each web flow is one file: the state union, the event union, the table, and a `step` wrapper. Its
  test asserts the legal edges and checks `unreachableStates()` and `deadTransitions()`.
- A simulation flow is one module: the state union in `state.ts` or `life.ts`, and its transitions
  as constructors beside it (`warming`, `restarting`, `trancheBuilt`, `shifted`, `fixed`). Its test
  asserts that every state is reachable and every event outside the table returns the same state.
- `challengeMachine.toMermaid()` renders the flow, so a review can read it without tracing the
  update function.
- The Machine is not a runtime: it returns Foldkit's `Update.Return`, no layer or service, so the
  UI needs no new dependency. `foldkit` is already a dependency of `apps/web`.
- `foldkit/experimental/machine` is experimental. Pin `foldkit` in `package.json`; a breaking change
  is a local edit in the flow's file, not a codebase-wide migration.
- The Simulation still decides the rules. A Challenge's score, Legacy, and hash come from
  `@quorum/simulation`, not from the Machine.
- A Node's reads go through `isDown`, `warmOf`, `causeOf`, and `leftOf`; no caller compares
  `down` or `warm` any more. The capacity model keeps the numbers it integrates.
- A new simulation phase needs a `SIM_VERSION` and golden-hash bump. A new web flow does not.
- [State machines](../state-machines.md) keeps the inventory, the properties, and the steps for the
  next flow in one place.
- What would change it: an Effect state-machine module that the Simulation may import.
