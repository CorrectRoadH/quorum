import { Result, Schema } from 'effect'
import { COMPONENTS, HOME_REGION, RESEARCH } from './catalog.ts'
import {
  Refusal,
  connect,
  place,
  resize,
  setFamily,
  setFramework,
  setRuntime,
  type Action,
} from './actions.ts'
import { decodeText, encodeText } from './codec.ts'
import { placeRefusal } from './founding.ts'
import { isUnlocked } from './lookups.ts'
import { ComponentId, GameLink, GameNode, type Game, type Region } from './state.ts'

/* ==========================================================================
   Playbooks (13 "Playbooks"): a saved part of a Design. Placing one places
   every Node the Company can build, with its Stack and settings, in one
   action. Nodes whose Component is locked come back as ghosts. A Playbook
   travels as text: `QPB1:` and base64url JSON.
   ========================================================================== */

/** A Link end: a Node of the Playbook by key, or a fixed Node by `@type`. */
export const PlaybookNode = Schema.Struct({
  key: Schema.String,
  type: ComponentId,
  dx: Schema.Finite,
  dy: Schema.Finite,
  settings: Schema.Record(Schema.String, Schema.Unknown),
})
export type PlaybookNode = typeof PlaybookNode.Type

export const Playbook = Schema.Struct({
  name: Schema.String,
  nodes: Schema.Array(PlaybookNode),
  links: Schema.Array(
    Schema.Struct({
      from: Schema.String,
      to: Schema.String,
      settings: Schema.Record(Schema.String, Schema.Unknown),
    }),
  ),
})
export type Playbook = typeof Playbook.Type

/** Node options a Playbook keeps. Size, family, runtime and framework go through their actions. */
export const NODE_SETTINGS = [
  'workers',
  'sampleRate',
  'compress',
  'policy',
  'checkEvery',
  'deepCheck',
  'ttl',
  'engine',
  'pm',
  'mode',
  'dlq',
  'coalesce',
  'warming',
  'paranoia',
  'standby',
  'signal',
  'target',
  'minCopies',
  'maxCopies',
  'gpu',
  'collector',
  'gogc',
  'shed',
  'ryw',
  'n',
  'r',
  'w',
  'spread',
  'backup',
  'fanout',
  'split',
] as const
export const STACK_SETTINGS = ['size', 'family', 'runtime', 'framework'] as const
export const LINK_SETTINGS = ['timeout', 'retries', 'kinds', 'breaker'] as const

export const pick = (from: object, keys: ReadonlyArray<string>): Record<string, unknown> =>
  Object.fromEntries(
    keys.filter((key) => key in from).map((key) => [key, (from as Record<string, unknown>)[key]]),
  )

/** Nodes every Company has one of: a Playbook links to them by type and never copies them. */
export const SHARED: ReadonlyArray<GameNode['type']> = ['users', 'payments', 'analytics']

const fixedKey = (node: GameNode): string => `@${node.type}`

/** Captures the selected Nodes. Fixed Nodes stay behind; Links to them are kept by type. */
export const capture = (game: Game, ids: ReadonlyArray<string>, name: string): Playbook | null => {
  const chosen = game.nodes.filter(
    (node) => ids.includes(node.id) && !COMPONENTS[node.type].fixed && !SHARED.includes(node.type),
  )
  if (chosen.length === 0) return null
  const left = Math.min(...chosen.map((node) => node.x))
  const top = Math.min(...chosen.map((node) => node.y))
  const keys = new Map(chosen.map((node) => [node.id, node.id]))
  const endOf = (id: string): string | null => {
    if (keys.has(id)) return id
    const node = game.nodes.find((entry) => entry.id === id)
    return node && SHARED.includes(node.type) ? fixedKey(node) : null
  }
  return {
    name,
    nodes: chosen.map((node) => ({
      key: node.id,
      type: node.type,
      dx: node.x - left,
      dy: node.y - top,
      settings: pick(node, [...STACK_SETTINGS, ...NODE_SETTINGS]),
    })),
    links: game.links.flatMap((link) => {
      const from = endOf(link.from)
      const to = endOf(link.to)
      // A Link counts when at least one end is in the Playbook.
      if (!from || !to || (!keys.has(link.from) && !keys.has(link.to))) return []
      return [{ from, to, settings: pick(link, LINK_SETTINGS) }]
    }),
  }
}

/** Why a Playbook Node cannot be built in this Company: its research, or a Mutator. */
export const ghostReason = (game: Game, node: PlaybookNode, region: Region): string | null => {
  const def = COMPONENTS[node.type]
  if (def.fixed) return `${def.name} is already on the Board.`
  if (!isUnlocked(game, node.type) && def.unlock) return RESEARCH[def.unlock].name
  return placeRefusal(game, node.type, region)
}

export type Placed = Readonly<{ game: Game; placed: number; ghosts: ReadonlyArray<PlaybookNode> }>

const decodeNode = Schema.decodeUnknownOption(GameNode)
const decodeLink = Schema.decodeUnknownOption(GameLink)

/** Applies a Playbook Node's Stack and settings to a placed Node. A setting that is refused stays default. */
const configure = (game: Game, id: string, settings: Record<string, unknown>): Game => {
  let next = game
  const tryAction = (action: Action) => {
    if (Result.isSuccess(action)) next = action.success
  }
  const node = () => next.nodes.find((entry) => entry.id === id)
  if (typeof settings.family === 'string')
    tryAction(setFamily(next, id, settings.family as GameNode['family']))
  if (typeof settings.size === 'number')
    for (let guard = 0; guard < 12 && (node()?.size ?? 0) < settings.size; guard += 1) {
      const before = node()?.size
      tryAction(resize(next, id, 1))
      if (node()?.size === before) break
    }
  if (typeof settings.runtime === 'string')
    tryAction(setRuntime(next, id, settings.runtime as GameNode['runtime']))
  if (typeof settings.framework === 'string')
    tryAction(setFramework(next, id, settings.framework as GameNode['framework']))
  const current = node()
  if (!current) return next
  const merged = decodeNode({ ...current, ...pick(settings, NODE_SETTINGS) })
  if (merged._tag === 'Some')
    next = { ...next, nodes: next.nodes.map((entry) => (entry.id === id ? merged.value : entry)) }
  return next
}

/**
 * Places a Playbook with its top-left corner at (x, y). Every buildable Node is
 * placed, configured and linked; locked ones come back as ghosts. Refused when
 * nothing can be placed or the Cash runs out part way.
 */
export const placePlaybook = (
  game: Game,
  playbook: Playbook,
  x: number,
  y: number,
  region: Region = HOME_REGION,
): Result.Result<Placed, Refusal> => {
  let next = game
  const ids = new Map<string, string>()
  const ghosts: Array<PlaybookNode> = []
  for (const entry of playbook.nodes) {
    if (ghostReason(next, entry, region)) {
      ghosts.push(entry)
      continue
    }
    const id = `n${next.nextId}`
    const placed = place(next, entry.type, x + entry.dx, y + entry.dy, region)
    if (Result.isFailure(placed)) return Result.fail(placed.failure)
    next = configure(placed.success, id, entry.settings)
    ids.set(entry.key, id)
  }
  if (ids.size === 0)
    return Result.fail(
      Refusal.NotAllowed({
        reason: `Nothing in ${playbook.name} can be built yet: ${ghosts
          .map((ghost) => ghostReason(game, ghost, region))
          .filter((reason, index, all) => reason && all.indexOf(reason) === index)
          .join(', ')}.`,
      }),
    )
  const endOf = (key: string): string | undefined => {
    if (!key.startsWith('@')) return ids.get(key)
    const type = key.slice(1)
    return (
      next.nodes.find((node) => node.type === type && node.region === region) ??
      next.nodes.find((node) => node.type === type)
    )?.id
  }
  for (const link of playbook.links) {
    const from = endOf(link.from)
    const to = endOf(link.to)
    if (!from || !to) continue
    const linked = connect(next, from, to)
    if (Result.isFailure(linked)) continue
    next = linked.success
    const made = next.links.find((entry) => entry.from === from && entry.to === to)
    const merged = made ? decodeLink({ ...made, ...pick(link.settings, LINK_SETTINGS) }) : null
    if (merged?._tag === 'Some')
      next = {
        ...next,
        links: next.links.map((entry) => (entry === made ? merged.value : entry)),
      }
  }
  return Result.succeed({ game: next, placed: ids.size, ghosts })
}

/* ---------- sharing ---------- */

const PREFIX = 'QPB1:'

export const encodePlaybook = (playbook: Playbook): string =>
  encodeText(PREFIX, Schema.encodeSync(Playbook)(playbook))

const decode = Schema.decodeUnknownOption(Playbook)

export const decodePlaybook = (text: string): Result.Result<Playbook, Refusal> => {
  const parsed = decode(decodeText(PREFIX, text))
  return parsed._tag === 'Some'
    ? Result.succeed(parsed.value)
    : Result.fail(Refusal.NotAllowed({ reason: 'That is not a Playbook.' }))
}
