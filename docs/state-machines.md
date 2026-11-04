# State machines

A state machine makes a flow predictable: its states are a closed set, its events are a closed set,
and every event that does not apply leaves the state unchanged. This page lists every flow that has
one, the properties its test checks, and how to add the next one.

## When a flow gets a machine

A machine pays for itself when all three hold:

1. The flow has two or more exclusive phases, and a phase needs data the other phases cannot have.
2. More than one event moves it, including events that can arrive late or twice.
3. An illegal combination is possible today, or a transition is easy to miss.

A number the solver integrates is not a phase. `credits`, `leak`, `depth`, `replicas`, and `warm`
inside `Warming` stay payload. A selection, such as the open panel or the chosen tool, is a value,
not a flow. A progress counter with one transition is a work item, not a state machine.

## The machines

| Flow            | Source                                   | States                                        | Persistence         |
| --------------- | ---------------------------------------- | --------------------------------------------- | ------------------- |
| Boot            | `apps/web/src/game/boot-machine.ts`      | `Shut`, `Clocking`, `Ready`, `Connecting`     | Session only        |
| Board session   | `apps/web/src/game/session-machine.ts`   | `Company`, `Sandbox`, `Challenge`             | Session only        |
| Challenge run   | `apps/web/src/game/challenge-machine.ts` | `Building`, `Running`, `Result`               | Session only        |
| Node lifecycle  | `packages/simulation/src/life.ts`        | `Running`, `Warming`, `Restarting`, `Stopped` | `GameNode.life`     |
| Stack migration | `packages/simulation/src/migration.ts`   | `Building`, `Ready`, `Finishing`              | `Service.migration` |

The web flows use `foldkit/experimental/machine`: a state union, an event union, and a transition
table. A transition handler returns the next state and, when it needs one, a Command. The simulation
flows cannot import Foldkit, so they keep a tagged union plus total constructors in the same module:
`warming`, `restarting`, `stopped`, `trancheBuilt`, `shifted`, `fixed`.

## Properties each machine holds

| Property                                   | Web                                          | Simulation                               |
| ------------------------------------------ | -------------------------------------------- | ---------------------------------------- |
| Closed state set                           | `Schema.Union` of tagged structs             | `Schema.Union` of tagged structs         |
| Closed event set                           | `Message` union per flow                     | exported event constructors              |
| An event outside the table changes nothing | `step` returns `Ignored` with the same state | each constructor returns its input       |
| Every declared state is reachable          | `unreachableStates()` is empty               | transition test visits each state        |
| No edge can never fire                     | `deadTransitions()` is empty                 | no branch is unreachable by construction |
| One writer per state                       | the table                                    | the module's constructors                |
| Deterministic                              | no clock, no randomness                      | no clock, no randomness                  |

Each test asserts the first five. `machine.toMermaid()` renders a web flow, and
`docs/adr/0011-state-machines-are-for-flows.md` records why a flow uses a machine and a number does
not.

## Adding a web flow

1. Put the state and event unions in `apps/web/src/game/<flow>-machine.ts`.
2. Define the table with `define`, `to`, `when`, and `otherwise`.
3. Export a `step` wrapper that returns `machine.step(state, event).state`, so a stale or repeated
   event is a no-op.
4. Route the flow's Messages through it in `update.ts`; compute payloads and Commands first.
5. Test the legal edges, the ignored events, and the two static analyses.

## Adding a simulation flow

1. Add the tagged union to `state.ts`, or to the module that owns the flow.
2. Keep a stored schema for old saves and a `decodeTo` transform that derives the state, as
   `GameNode` and `MigrationState` do.
3. Put every transition in the flow's module as a total function. Do not write the fields from
   anywhere else.
4. Read through selectors (`isDown`, `stepOf`, `isReady`), never through the payload of a phase that
   may not have it.
5. If the encoded save changes, bump `SIM_VERSION` and the golden hash; if only the runtime shape
   changes and the encoded Game is identical, keep the version.

## Adding a state chart

A web flow renders itself: `challengeMachine.toMermaid()`. A simulation flow's transitions live in
its constructors, so the chart is the constructor list plus the transition test. Keep both in sync
with the table above.
