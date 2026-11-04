import { Schema } from 'effect'
import { define, to } from 'foldkit/experimental/machine'
import { Progress, SANDBOX_IDS } from '@quorum/simulation/sandbox'
import { ChallengeRun } from './challenge-machine.ts'

/* ==========================================================================
   What a board plays. The Company, a Sandbox and a Challenge are exclusive;
   they were two nullable fields, so "a Sandbox and a Challenge at once" was
   representable. One machine moves between them.
   ========================================================================== */

export const SandboxId = Schema.Literals(SANDBOX_IDS)

/** The Sandbox on the board: a guided one and its progress, or the free one when `id` is null. */
export const SandboxRun = Schema.Struct({
  id: Schema.NullOr(SandboxId),
  progress: Progress,
})
export type SandboxRun = typeof SandboxRun.Type

export const Session = Schema.Union([
  /** The Company's own board. */
  Schema.TaggedStruct('Company', {}),
  Schema.TaggedStruct('Sandbox', { run: SandboxRun }),
  Schema.TaggedStruct('Challenge', { run: ChallengeRun }),
])
export type Session = typeof Session.Type

export const SessionEvent = Schema.Union([
  Schema.TaggedStruct('SandboxOpened', { run: SandboxRun }),
  Schema.TaggedStruct('ChallengeOpened', { run: ChallengeRun }),
  Schema.TaggedStruct('Closed', {}),
  /** The open Sandbox or Challenge advanced; the session does not change. */
  Schema.TaggedStruct('SandboxUpdated', { run: SandboxRun }),
  Schema.TaggedStruct('ChallengeUpdated', { run: ChallengeRun }),
])
export type SessionEvent = typeof SessionEvent.Type

const company: Session = { _tag: 'Company' }

export const sessionMachine = define({ state: Session, message: SessionEvent })({
  initial: company,
  states: {
    Company: {
      on: {
        SandboxOpened: to('Sandbox', ({ message }) => ({
          model: { _tag: 'Sandbox', run: message.run },
        })),
        ChallengeOpened: to('Challenge', ({ message }) => ({
          model: { _tag: 'Challenge', run: message.run },
        })),
      },
    },
    Sandbox: {
      on: {
        Closed: to('Company', () => ({ model: company })),
        SandboxOpened: to('Sandbox', ({ message }) => ({
          model: { _tag: 'Sandbox', run: message.run },
        })),
        SandboxUpdated: to('Sandbox', ({ message }) => ({
          model: { _tag: 'Sandbox', run: message.run },
        })),
        ChallengeOpened: to('Challenge', ({ message }) => ({
          model: { _tag: 'Challenge', run: message.run },
        })),
      },
    },
    Challenge: {
      on: {
        Closed: to('Company', () => ({ model: company })),
        ChallengeOpened: to('Challenge', ({ message }) => ({
          model: { _tag: 'Challenge', run: message.run },
        })),
        ChallengeUpdated: to('Challenge', ({ message }) => ({
          model: { _tag: 'Challenge', run: message.run },
        })),
        SandboxOpened: to('Sandbox', ({ message }) => ({
          model: { _tag: 'Sandbox', run: message.run },
        })),
      },
    },
  },
})

/** The next session, or the same one when the event does not apply. */
export const sessionStep = (session: Session, event: SessionEvent): Session =>
  sessionMachine.step(session, event).state
