import { Option } from 'effect'
import { SIM_VERSION } from '@quorum/simulation/version'
import type { Model } from './model.ts'

/**
 * What an error report may say about the game. The Model holds the player's Company, names, and
 * mail, so a report never carries it or any part of a Message's payload: only these labels.
 */
export const crashTagsOf = (
  model: Model,
  message: Option.Option<{ readonly _tag: string }>,
): Record<string, string | number> => ({
  message: Option.match(message, { onNone: () => 'none', onSome: (value) => value._tag }),
  route: model.route._tag,
  session: model.board.session._tag,
  era: model.board.game.stage,
  sim_version: SIM_VERSION,
})
