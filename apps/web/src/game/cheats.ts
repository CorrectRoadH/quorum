import { eraOf } from '@template/simulation/lookups'
import type { Game } from '@template/simulation/state'

/* Playtest cheats grow with the Era, so a skipped-to Era can still buy its research and Nodes. */

export const cheatCash = (game: Game): number => 1_000 * eraOf(game).costIndex
export const cheatInsight = (game: Game): number => (game.stage >= 2 ? 1_000 : 100)
