import { Schema } from 'effect'
import { Game } from './state.ts'

const encode = Schema.encodeSync(Game)

/**
 * FNV-1a, 32 bits, over the encoded Game as JSON, as 8 hex digits. ECMAScript
 * fully specifies `JSON.stringify` and number-to-string, and `Math.imul` is
 * exact, so every engine gets the same hash for the same Game.
 */
export const hashGame = (game: Game): string => {
  const text = JSON.stringify(encode(game))
  let hash = 0x81_1c_9d_c5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
