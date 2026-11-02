import { BUILD_GROUPS, COMPONENTS, RESEARCH, researchList } from '@quorum/simulation/catalog'
import type { BuildGroup, ComponentId } from '@quorum/simulation/catalog'
import type { Ledger } from '@quorum/simulation/ledger'
import {
  buildItems,
  drawerSize,
  has,
  isUnlocked,
  researchReady,
  resizePrice,
} from '@quorum/simulation/lookups'
import type { Game } from '@quorum/simulation/state'
import type { Message } from './message.ts'
import { Reveal, offCompany, type Model } from './model.ts'

/* ==========================================================================
   Progressive disclosure (GDD 15): a first Company shows each element the
   first time the game state makes it useful, one at a time, and the new
   element glows until the player uses it.
   ========================================================================== */

const ALL: ReadonlyArray<Reveal> = Reveal.literals

/** UI ticks a new element glows, and the longest the next one waits for it: 30 s at any speed. */
const CUE_TICKS = 120

/** The Sandbox, Challenges, and every Company after the first Exit show everything. */
export const veteran = (model: Model): boolean =>
  offCompany(model) || model.founder.history.length > 0

export const shown = (model: Model, key: Reveal): boolean =>
  veteran(model) || model.revealed.includes(key)

export const glowing = (model: Model, key: Reveal): boolean =>
  model.cue?.key === key && model.cue.left > 0

/** Playbooks are a Legacy feature: they appear after the first Exit. */
export const playbooksShown = (model: Model): boolean =>
  !offCompany(model) && model.founder.history.length > 0

const cheapestResearch = (game: Game): number =>
  Math.min(
    ...researchList
      .filter((entry) => !has(game, entry.id) && researchReady(game, entry.id))
      .map((entry) => entry.cost),
  )

/** The Node whose footer the resize cue points at: the bottleneck, when it can grow. */
const resizable = (game: Game, bottleneck: string | null): string | null => {
  const node = game.nodes.find((entry) => entry.id === bottleneck)
  return node && node.type !== 'payments' && node.down !== -1 && resizePrice(game, node) !== null
    ? node.id
    : null
}

const triggered = (key: Reveal, model: Model, ledger: Ledger): boolean => {
  const game = model.game
  switch (key) {
    case 'undo':
      return model.undo.length > 0
    case 'collect':
      return !has(game, 'stripe') && game.pending >= drawerSize(game, ledger.revenue) / 2
    case 'resize':
      return resizable(game, ledger.bottleneck) !== null
    case 'research':
      return game.insight >= cheapestResearch(game)
    case 'errors':
      return ledger.errorShare > 0.001
    case 'team':
      return game.shipped.length > 0 || game.awaiting.length > 0
    case 'engineering':
      return (
        game.nodes.some((node) => node.leak > 0) ||
        game.services.some((service) => service.debt > 0)
      )
    case 'autopilot':
      return game.backlog.length >= 2
    case 'glossary':
      return model.tradeoff !== null
  }
}

/** Cues on controls that are always there: they only glow. */
const CUES: ReadonlyArray<Reveal> = ['collect', 'resize']

/** A new Company shows what its state already calls for at once, with no cue. */
export const revealAtStart = (model: Model, ledger: Ledger): Model => ({
  ...model,
  revealed: ALL.filter((key) => !CUES.includes(key) && triggered(key, model, ledger)),
  pending: [],
  cue: null,
})

/** One UI tick: queues the triggers that fired, and shows the next one once the cue is free. */
export const advanceReveals = (model: Model, ledger: Ledger): Model => {
  if (veteran(model)) return model
  const cue = model.cue && model.cue.left > 0 ? { ...model.cue, left: model.cue.left - 1 } : null
  const fired = ALL.filter(
    (key) =>
      !model.revealed.includes(key) &&
      !model.pending.includes(key) &&
      triggered(key, model, ledger),
  )
  const pending = [...model.pending, ...fired]
  const [next, ...rest] = pending
  if (next === undefined || cue !== null) return { ...model, pending, cue }
  return {
    ...model,
    revealed: [...model.revealed, next],
    pending: rest,
    cue: { key: next, left: CUE_TICKS },
  }
}

/** What using each element looks like. */
const USES: Partial<Record<Message['_tag'], (message: Message) => Reveal | null>> = {
  UndoChosen: () => 'undo',
  Collected: () => 'collect',
  ResizeChosen: () => 'resize',
  TaskQueued: () => 'engineering',
  AutopilotToggled: () => 'autopilot',
  GlossaryOpened: () => 'glossary',
  PanelOpened: (message) =>
    message._tag === 'PanelOpened' && (message.panel === 'research' || message.panel === 'team')
      ? message.panel
      : null,
}

/** Using an element shows it for good and ends its glow. */
export const noticed = (model: Model, message: Message): Model => {
  const key = USES[message._tag]?.(message) ?? null
  if (key === null || veteran(model)) return model
  return {
    ...model,
    revealed: model.revealed.includes(key) ? model.revealed : [...model.revealed, key],
    pending: model.pending.filter((entry) => entry !== key),
    cue: model.cue?.key === key ? null : model.cue,
  }
}

/** The Node whose footer button glows on the board. */
export const cueNode = (model: Model): string | null => {
  if (!model.cue || !glowing(model, model.cue.key)) return null
  if (model.cue.key === 'collect')
    return model.game.nodes.find((node) => node.type === 'payments')?.id ?? null
  if (model.cue.key === 'resize') return resizable(model.game, model.bottleneck)
  return null
}

/** What a save says about disclosure. A save from before it shows everything. */
export const revealsOfSave = (saved: unknown): Pick<Model, 'revealed' | 'pending'> => {
  const disclosure =
    typeof saved === 'object' && saved !== null && 'disclosure' in saved ? saved.disclosure : null
  if (typeof disclosure !== 'object' || disclosure === null) return { revealed: ALL, pending: [] }
  const pick = (value: unknown): ReadonlyArray<Reveal> =>
    Array.isArray(value) ? ALL.filter((key) => value.includes(key)) : []
  return {
    revealed: pick('revealed' in disclosure ? disclosure.revealed : null),
    pending: pick('pending' in disclosure ? disclosure.pending : null),
  }
}

/* ---------- the build dock ---------- */

/** A group's Components the dock lists: those the player can place, then the next one to unlock. */
export const dockItems = (game: Game, group: BuildGroup): ReadonlyArray<ComponentId> => {
  const items = buildItems(group)
  const placeable = items.filter((type) => isUnlocked(game, type))
  const next = items
    .filter((type) => {
      const unlock = COMPONENTS[type].unlock
      return !isUnlocked(game, type) && unlock !== null && researchReady(game, unlock)
    })
    .toSorted(
      (a, b) =>
        RESEARCH[COMPONENTS[a].unlock ?? 'stripe'].cost -
        RESEARCH[COMPONENTS[b].unlock ?? 'stripe'].cost,
    )[0]
  return next ? [...placeable, next] : placeable
}

/** The dock's groups with something to list, in order: the number keys follow it. */
export const dockGroups = (game: Game): ReadonlyArray<BuildGroup> =>
  BUILD_GROUPS.map((group) => group.key).filter((key) => dockItems(game, key).length > 0)
