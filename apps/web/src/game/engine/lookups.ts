import {
  AUTH_PRICE_PER_USER,
  COMPONENTS,
  COPY_PRICE_GROWTH,
  DRAWER_MIN,
  DRAWER_SECONDS,
  ERAS,
  FAMILIES,
  FRAMEWORK_RESEARCH,
  RESEARCH,
  RUNTIMES,
  SAMPLE_STORAGE,
  SELL_REFUND,
  SIZES,
  VCPU_PRICE,
  type ComponentId,
  type EraDef,
  type FrameworkId,
  type ResearchId,
  type RuntimeId,
} from './catalog.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   Small facts about a Game that the solver, the actions and the UI all ask:
   what is researched, what a Node's hardware is, and what things cost.
   ========================================================================== */

export const has = (game: Game, id: ResearchId): boolean => game.researched.includes(id)

export const eraOf = (game: Game): EraDef => ERAS[Math.min(game.stage, ERAS.length - 1)] as EraDef

export const nextEra = (game: Game): EraDef | undefined => ERAS[game.stage + 1]

export const isFinalEra = (game: Game): boolean => game.stage >= ERAS.length - 1

export const isUnlocked = (game: Game, type: ComponentId): boolean => {
  const unlock = COMPONENTS[type].unlock
  return unlock === null || has(game, unlock)
}

export const researchReady = (game: Game, id: ResearchId): boolean =>
  RESEARCH[id].era <= game.stage && RESEARCH[id].requires.every((needed) => has(game, needed))

export const runtimeReady = (game: Game, runtime: RuntimeId): boolean => {
  const needed = RUNTIMES[runtime].research
  return needed === null || has(game, needed)
}

export const frameworkReady = (game: Game, framework: FrameworkId): boolean => {
  const needed = FRAMEWORK_RESEARCH[framework]
  return needed === null || has(game, needed)
}

/* ---------- hardware ---------- */

export const sizeName = (node: GameNode): string => SIZES[node.size]?.name ?? 'custom'

export const vcpuOf = (node: GameNode): number => SIZES[node.size]?.vcpu ?? 1

/** GB of RAM. */
export const ramOf = (node: GameNode): number => vcpuOf(node) * FAMILIES[node.family].ram

export const isDown = (node: GameNode): boolean => node.down !== 0

export const languageOf = (node: GameNode) => RUNTIMES[node.runtime].language

/* ---------- money ---------- */

/** Dollars per second a Node costs while it exists, down or not. */
export const burnOf = (game: Game, node: GameNode): number => {
  const def = COMPONENTS[node.type]
  const index = eraOf(game).costIndex
  if (def.sized) return vcpuOf(node) * VCPU_PRICE * FAMILIES[node.family].price * index
  if (node.type === 'analytics')
    return def.burn * (SAMPLE_STORAGE[node.sample] ?? 1) * 2 ** (node.size - 1) * index
  if (node.type === 'auth') return game.users * AUTH_PRICE_PER_USER
  return def.burn * index
}

export const priceOf = (game: Game, type: ComponentId): number => {
  const count = game.nodes.filter((node) => node.type === type).length
  return Math.round(COMPONENTS[type].cost * COPY_PRICE_GROWTH ** count * eraOf(game).costIndex)
}

export const refundOf = (game: Game, node: GameNode): number =>
  Math.round(COMPONENTS[node.type].cost * SELL_REFUND * eraOf(game).costIndex)

export const maxSize = (node: GameNode): number => {
  if (COMPONENTS[node.type].sized) return SIZES.length - 1
  if (node.type === 'payments' || node.type === 'analytics') return 6
  return node.size
}

/** Cash for the next size step, or null at the largest size. */
export const resizePrice = (game: Game, node: GameNode): number | null => {
  if (node.size >= maxSize(node)) return null
  const index = eraOf(game).costIndex
  if (node.type === 'payments') return Math.round(40 * 3 ** (node.size - 1) * index)
  if (node.type === 'analytics') return Math.round(40 * 2 ** node.size * index)
  return Math.round(COMPONENTS[node.type].cost * 2 ** (node.size + 1) * index)
}

/** Cash to replace a failed Node. */
export const replacePrice = (game: Game, node: GameNode): number =>
  Math.round(COMPONENTS[node.type].cost * 0.5 * eraOf(game).costIndex)

/** The drawer holds about a minute of revenue; each size step doubles it. */
export const drawerSize = (game: Game, revenue: number): number => {
  const payments = game.nodes.find((node) => node.type === 'payments')
  return Math.max(DRAWER_MIN, revenue * DRAWER_SECONDS) * 2 ** ((payments?.size ?? 1) - 1)
}
