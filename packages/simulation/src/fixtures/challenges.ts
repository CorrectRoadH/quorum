import { Result } from 'effect'
import * as Actions from '../actions.ts'
import type { Challenge } from '../challenges.ts'
import { designOf, type Replay } from '../replay.ts'
import type { Game } from '../state.ts'
import { SIM_VERSION } from '../version.ts'

/* Each Challenge's reference solution, built with the board's actions. Node, the browsers and workerd replay them. */

const ok = (action: Actions.Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const lastId = (game: Game): string => game.nodes.at(-1)?.id ?? ''

/** Puts a data Node between every App Server and `behind`. */
const inFront = (game: Game, type: 'pooler' | 'cache', behind: string): Game => {
  const placed = ok(Actions.place(game, type, 800, 280))
  const id = lastId(placed)
  const rewired = placed.nodes
    .filter((node) => node.type === 'server')
    .reduce(
      (current, server) =>
        ok(Actions.connect(Actions.disconnect(current, server.id, behind), server.id, id)),
      placed,
    )
  return ok(Actions.connect(rewired, id, behind))
}

/** The fix each Challenge teaches. */
export const REFERENCE: Record<string, (game: Game) => Game> = {
  'hello-world': (game) => ok(Actions.setFamily(game, 'server', 'general')),
  'split-the-box': (game) => {
    const placed = ok(Actions.place(game, 'database', 760, 280))
    const database = lastId(placed)
    const linked = ok(Actions.connect(placed, 'server', database))
    return ok(Actions.resize(ok(Actions.resize(linked, 'server', 1)), database, 1))
  },
  slashdotted: (start) => {
    let game = inFront(start, 'pooler', 'database')
    const pooler = lastId(game)
    for (let index = 0; index < 6; index += 1) {
      game = ok(Actions.place(game, 'server', 600, 400 + 40 * index))
      const id = lastId(game)
      game = ok(Actions.setRuntime(game, id, 'php_fpm'))
      game = ok(Actions.connect(ok(Actions.connect(game, 'lb', id)), id, pooler))
    }
    for (const server of game.nodes.filter((node) => node.type === 'server'))
      game = ok(Actions.setWorkers(game, server.id, 40))
    game = ok(Actions.place(game, 'cache', 700, 520))
    const cache = lastId(game)
    for (const server of game.nodes.filter((node) => node.type === 'server'))
      game = ok(Actions.connect(game, server.id, cache))
    game = ok(Actions.connect(game, cache, pooler))
    return ok(Actions.resize(ok(Actions.resize(game, 'database', 1)), 'database', 1))
  },
  'event-loop': (game) => ok(Actions.setRuntime(game, 'server', 'node_cluster')),
  'too-many-connections': (game) => inFront(game, 'pooler', 'database'),
}

/** A replay of a Design on a Challenge. */
export const replayOf = (
  challenge: Challenge,
  game: Game,
  actions: Replay['actions'] = [],
): Replay => ({
  v: 1,
  challenge: challenge.id,
  simVersion: SIM_VERSION,
  design: designOf(game),
  actions,
})

/** The reference solution's replay. */
export const referenceReplay = (challenge: Challenge): Replay =>
  replayOf(challenge, REFERENCE[challenge.id]?.(challenge.start()) ?? challenge.start())
