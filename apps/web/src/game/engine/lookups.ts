import {
  AUTH_PRICE_PER_USER,
  COMPONENTS,
  COMPONENT_IDS,
  COPY_PRICE_GROWTH,
  DRAWER_MIN,
  DRAWER_SECONDS,
  ERAS,
  FAMILIES,
  FRAMEWORK_RESEARCH,
  RESEARCH,
  RUNTIMES,
  SAMPLE_STORAGE,
  RESTART_SECONDS,
  SELL_REFUND,
  SIZES,
  VCPU_PRICE,
  VM_RESTART_SECONDS,
  type BuildGroup,
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

/** The Components a player can place from one build group, in catalog order. */
export const buildItems = (group: BuildGroup): ReadonlyArray<ComponentId> =>
  COMPONENT_IDS.filter((type) => COMPONENTS[type].group === group && !COMPONENTS[type].fixed)

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

/** What a card calls a size: the instance size, or a step number for flat Components. */
export const sizeLabel = (node: GameNode, size = node.size): string =>
  COMPONENTS[node.type].sized ? (SIZES[size]?.name ?? '') : `size ${size}`

/** Capacity and Burn multiplier of a flat Component's size: each step doubles both. */
export const flatScale = (node: GameNode): number => grown(1, 2, node.size - 1)

export const vcpuOf = (node: GameNode): number => SIZES[node.size]?.vcpu ?? 1

/** KB per second the box's network card moves: Gbps × 125,000. */
export const networkOf = (node: GameNode): number => (SIZES[node.size]?.gbps ?? 1) * 125_000

/** GB of RAM. */
export const ramOf = (node: GameNode): number => vcpuOf(node) * FAMILIES[node.family].ram

export const isDown = (node: GameNode): boolean => node.down !== 0

/** Seconds a Node stays down when it restarts: an App Server boots its runtime, at least 1 s for the VM. */
export const restartSeconds = (node: GameNode): number =>
  node.type === 'server'
    ? Math.max(VM_RESTART_SECONDS, RUNTIMES[node.runtime].startup)
    : RESTART_SECONDS

/** The fields of a Node that restarts and comes back cold. */
export const restarted = (node: GameNode, cause: GameNode['downCause'] = 'restart') => ({
  down: restartSeconds(node),
  downCause: cause,
  warm: 0,
})

export const languageOf = (node: GameNode) => RUNTIMES[node.runtime].language

/* ---------- money ---------- */

/** base × factor^steps by repeated multiplication: `**` is not exact across engines. */
export const grown = (base: number, factor: number, steps: number): number => {
  let value = base
  for (let index = 0; index < steps; index += 1) value *= factor
  for (let index = 0; index > steps; index -= 1) value /= factor
  return value
}

/** Dollars per second a Node costs while it exists, down or not. */
export const burnOf = (game: Game, node: GameNode): number => {
  const def = COMPONENTS[node.type]
  const index = eraOf(game).costIndex
  if (def.sized) return vcpuOf(node) * VCPU_PRICE * FAMILIES[node.family].price * index
  if (node.type === 'analytics')
    return def.burn * (SAMPLE_STORAGE[node.sample] ?? 1) * flatScale(node) * index
  if (node.type === 'auth') return game.users * AUTH_PRICE_PER_USER
  return def.burn * flatScale(node) * index
}

/* A Sandbox has no money: every price below is 0 there. */

/** What the copy after `count` copies costs: each further copy costs 25% more. */
const copyPrice = (game: Game, type: ComponentId, count: number): number =>
  Math.round(grown(COMPONENTS[type].cost, COPY_PRICE_GROWTH, count) * eraOf(game).costIndex)

export const priceOf = (game: Game, type: ComponentId): number => {
  if (game.sandbox) return 0
  return copyPrice(game, type, game.nodes.filter((node) => node.type === type).length)
}

/** Selling refunds half of what the last copy of its Component cost to place. */
export const refundOf = (game: Game, node: GameNode): number => {
  if (game.sandbox) return 0
  const count = game.nodes.filter((entry) => entry.type === node.type).length
  return Math.round(copyPrice(game, node.type, Math.max(0, count - 1)) * SELL_REFUND)
}

export const maxSize = (node: GameNode): number =>
  COMPONENTS[node.type].sized ? SIZES.length - 1 : Math.max(node.size, COMPONENTS[node.type].steps)

/** Cash for the next size step, or null at the largest size. */
export const resizePrice = (game: Game, node: GameNode): number | null => {
  if (node.size >= maxSize(node)) return null
  if (game.sandbox) return 0
  const index = eraOf(game).costIndex
  if (node.type === 'payments') return Math.round(grown(40, 3, node.size - 1) * index)
  if (node.type === 'analytics') return Math.round(grown(40, 2, node.size) * index)
  // Instance prices are linear in vCPU: twice the place price per vCPU of the next size.
  if (COMPONENTS[node.type].sized)
    return Math.round(COMPONENTS[node.type].cost * 2 * (SIZES[node.size + 1]?.vcpu ?? 0) * index)
  return Math.round(grown(COMPONENTS[node.type].cost, 2, node.size + 1) * index)
}

/** Cash to replace a failed Node. */
export const replacePrice = (game: Game, node: GameNode): number =>
  game.sandbox ? 0 : Math.round(COMPONENTS[node.type].cost * 0.5 * eraOf(game).costIndex)

/** The drawer holds about a minute of revenue; each size step doubles it. */
export const drawerSize = (game: Game, revenue: number): number => {
  const payments = game.nodes.find((node) => node.type === 'payments')
  return Math.max(DRAWER_MIN, revenue * DRAWER_SECONDS) * grown(1, 2, (payments?.size ?? 1) - 1)
}
