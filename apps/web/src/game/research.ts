import { Schema } from 'effect'
import type { Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { ResearchId } from '@quorum/simulation/state'
import type { Research } from './model.ts'

/* The Research panel's side-pane focus, folded into the parent with foldChild.
   Buying and the Study queue change the Game, so the parent runs them. */

export const ResearchMessage = defineMessageUnion({
  Focused: { id: ResearchId },
  Bought: { id: ResearchId },
  /** The Study queue: move one, run one now, or take one off. */
  StudyMoved: { id: ResearchId, direction: Schema.Literals([1, -1]) },
  StudyPrioritized: { id: ResearchId },
  StudyCancelled: { id: ResearchId },
})
export type ResearchMessage = typeof ResearchMessage.Type

export const ResearchOutMessage = defineMessageUnion({
  Study: { id: ResearchId },
  Move: { id: ResearchId, direction: Schema.Literals([1, -1]) },
  StudyNow: { id: ResearchId },
  Cancel: { id: ResearchId },
})
export type ResearchOutMessage = typeof ResearchOutMessage.Type

export const EMPTY_RESEARCH: Research = { focus: null }

type ResearchReturn = Update.ReturnWithOutMessage<Research, ResearchMessage, ResearchOutMessage>

const out = (research: Research, outMessage: ResearchOutMessage): ResearchReturn => ({
  model: research,
  outMessage,
})

export const updateResearch = (research: Research, message: ResearchMessage): ResearchReturn =>
  ResearchMessage.match<ResearchReturn>(message, {
    Focused: ({ id }) => ({ model: { ...research, focus: id } }),
    Bought: ({ id }) => out(research, ResearchOutMessage.Study({ id })),
    StudyMoved: ({ id, direction }) => out(research, ResearchOutMessage.Move({ id, direction })),
    StudyPrioritized: ({ id }) => out(research, ResearchOutMessage.StudyNow({ id })),
    StudyCancelled: ({ id }) => out(research, ResearchOutMessage.Cancel({ id })),
  })
