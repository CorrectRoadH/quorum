import { Result } from 'effect'
import * as Actions from '@quorum/simulation/actions'
import { previewOf, type Preview } from '@quorum/simulation/preview'
import { bottleneckOf, solveFlow } from '@quorum/simulation/solve'
import type { Game } from '@quorum/simulation/state'
import type { TradeoffOption } from '../game/tradeoff.ts'
import { routeLinks, type RoutedLink, type RoutedNode, type Wire } from './routing.ts'

/*
 * The work the game hands to its compute worker: pure functions of plain data
 * that may answer a few frames late. The worker runs them, and so does the
 * page when it cannot start a worker.
 */

/** The action a Tradeoff option stands for. */
export const optionAction = (
  game: Game,
  nodeId: string,
  option: TradeoffOption,
): Actions.Action => {
  switch (option.kind) {
    case 'runtime':
      return Actions.setRuntime(game, nodeId, option.id)
    case 'framework':
      return Actions.setFramework(game, nodeId, option.id)
    case 'family':
      return Actions.setFamily(game, nodeId, option.id)
  }
}

export type Jobs = {
  /** The Tradeoff card's ghost runs; null when the option is refused. */
  preview: {
    input: Readonly<{ game: Game; nodeId: string; option: TradeoffOption }>
    output: Preview | null
  }
  /** Link routes for the Design's positions. */
  route: {
    input: Readonly<{ nodes: ReadonlyArray<RoutedNode>; links: ReadonlyArray<RoutedLink> }>
    output: Map<string, Wire>
  }
  /** The Bottleneck search. */
  bottleneck: { input: Readonly<{ game: Game }>; output: string | null }
}

export type Channel = keyof Jobs

export const JOBS: { [C in Channel]: (input: Jobs[C]['input']) => Jobs[C]['output'] } = {
  preview: ({ game, nodeId, option }) =>
    Result.match(
      previewOf(game, `${nodeId}:${option.kind}:${option.id}`, (ghost) =>
        optionAction(ghost, nodeId, option),
      ),
      { onSuccess: (preview) => preview, onFailure: () => null },
    ),
  route: ({ nodes, links }) => routeLinks(nodes, links),
  bottleneck: ({ game }) => bottleneckOf(game, solveFlow(game)),
}

/** The order the worker serves waiting jobs in: what the player is touching first. */
export const PRIORITY: ReadonlyArray<Channel> = ['route', 'preview', 'bottleneck']
