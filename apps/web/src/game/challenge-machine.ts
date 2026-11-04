import { Schema } from 'effect'
import { define, to } from 'foldkit/experimental/machine'
import { ChallengeVerdict } from '@quorum/rpc'
import {
  ChallengeResult,
  NO_TOTALS,
  RunTotals,
  type ChallengeResult as ChallengeResultType,
} from '@quorum/simulation/challenges'
import { Replay, ReplayAction } from '@quorum/simulation/replay'
import { Game } from '@quorum/simulation/state'

/* ==========================================================================
   A Challenge run is a flow, not a bag of nullable fields. Building has no
   replay, Running has no result, and a verification can only land on a
   Result. The union makes the other combinations unrepresentable, and the
   Machine below is the only place a phase changes.
   ========================================================================== */

/** Where a Challenge result stands with the server: provisional until it confirms. */
export const Verification = Schema.Literals([
  'local',
  'sending',
  'verified',
  'unverified',
  'offline',
])
export type Verification = typeof Verification.Type

/** The player builds on a live preview, then Run replays the Design from t = 0. */
export const ChallengeRun = Schema.Union([
  /** The Design is open for edits; nothing has been scored. */
  Schema.TaggedStruct('Building', {
    id: Schema.String,
    totals: RunTotals,
  }),
  /** The replay runs. The Design is fixed until Rebuild. */
  Schema.TaggedStruct('Running', {
    id: Schema.String,
    totals: RunTotals,
    /** The build board at Run, restored by Rebuild. */
    board: Game,
    /** The Design at Run, and the actions logged since. */
    replay: Replay,
  }),
  /** The run is scored, and the server is confirming it. */
  Schema.TaggedStruct('Result', {
    id: Schema.String,
    totals: RunTotals,
    board: Game,
    replay: Replay,
    result: ChallengeResult,
    /** The server's verdict, once it answers. */
    verdict: Schema.NullOr(ChallengeVerdict),
    verification: Verification,
    /** Why the server did not confirm, when it did not. */
    note: Schema.NullOr(Schema.String),
  }),
])
export type ChallengeRun = typeof ChallengeRun.Type
/** A scored run: the only phase with a result and a verification. */
export type ChallengeResultRun = Extract<ChallengeRun, Readonly<{ _tag: 'Result' }>>
/** A run in progress: the only phase with a replay and a build board. */
export type ChallengeRunningRun = Extract<ChallengeRun, Readonly<{ _tag: 'Running' }>>

/** Everything that can happen to an open Challenge. The phase itself is not one. */
export const ChallengeEvent = Schema.Union([
  /** The player presses Run: the prepared replay starts from t = 0. */
  Schema.TaggedStruct('Run', {
    board: Game,
    replay: Replay,
  }),
  /** The clock advances the run by some Steps. */
  Schema.TaggedStruct('Ticked', { totals: RunTotals }),
  /** An incident response or restart is logged at the next Step. */
  Schema.TaggedStruct('ActionLogged', { action: ReplayAction }),
  /** The last Step is done: the run is scored. */
  Schema.TaggedStruct('Finished', { result: ChallengeResult }),
  /** The player goes back to the build board. */
  Schema.TaggedStruct('Rebuilt', {}),
  /** The server confirmed the result. */
  Schema.TaggedStruct('Verified', { verdict: ChallengeVerdict }),
  /** The server did not confirm, or could not be reached. */
  Schema.TaggedStruct('Unverified', { message: Schema.String, offline: Schema.Boolean }),
])
export type ChallengeEvent = typeof ChallengeEvent.Type

type ChallengeBuildingRun = Extract<ChallengeRun, Readonly<{ _tag: 'Building' }>>

const building = (id: string): ChallengeBuildingRun => ({
  _tag: 'Building',
  id,
  totals: NO_TOTALS,
})

const scored = (state: ChallengeRunningRun, result: ChallengeResultType): ChallengeResultRun => ({
  _tag: 'Result',
  id: state.id,
  totals: state.totals,
  board: state.board,
  replay: state.replay,
  result,
  verdict: null,
  verification: 'sending',
  note: null,
})

export const challengeMachine = define({
  state: ChallengeRun,
  message: ChallengeEvent,
})({
  initial: building(''),
  states: {
    Building: {
      on: {
        Run: to('Running', ({ state, message }) => ({
          model: {
            _tag: 'Running',
            id: state.id,
            totals: NO_TOTALS,
            board: message.board,
            replay: message.replay,
          },
        })),
      },
    },
    Running: {
      on: {
        Ticked: to('Running', ({ state, message }) => ({
          model: { ...state, totals: message.totals },
        })),
        ActionLogged: to('Running', ({ state, message }) => ({
          model: {
            ...state,
            replay: {
              ...state.replay,
              actions: [
                ...state.replay.actions,
                { step: state.totals.step, action: message.action },
              ],
            },
          },
        })),
        Finished: to('Result', ({ state, message }) => ({ model: scored(state, message.result) })),
        Rebuilt: to('Building', ({ state }) => ({ model: building(state.id) })),
      },
    },
    Result: {
      on: {
        Rebuilt: to('Building', ({ state }) => ({ model: building(state.id) })),
        Verified: to('Result', ({ state, message }) => ({
          model: {
            ...state,
            verdict: message.verdict,
            verification: 'verified',
            note: null,
          },
        })),
        Unverified: to('Result', ({ state, message }) => ({
          model: {
            ...state,
            verification: message.offline ? 'offline' : 'unverified',
            note: message.message,
          },
        })),
      },
    },
  },
})

/**
 * The next phase, or the same one when the event does not apply. A stale
 * server reply or a click that no longer fits cannot corrupt a run.
 */
export const challengeStep = (run: ChallengeRun, event: ChallengeEvent): ChallengeRun =>
  challengeMachine.step(run, event).state
