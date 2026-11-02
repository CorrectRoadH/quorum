import { eraOf } from '@template/simulation/lookups'
import type { Game } from '@template/simulation/state'

/* Playtest cheats grow with the Era, so a skipped-to Era can still buy its research and Nodes. */

export const cheatCash = (game: Game): number =>
  (game.stage >= 5 ? 500_000 : game.stage >= 4 ? 50_000 : game.stage >= 3 ? 10_000 : 1_000) *
  eraOf(game).costIndex
export const cheatInsight = (game: Game): number =>
  game.stage >= 6
    ? 1_500_000
    : game.stage >= 5
      ? 400_000
      : game.stage >= 4
        ? 20_000
        : game.stage >= 3
          ? 5_000
          : game.stage >= 2
            ? 1_000
            : 100
