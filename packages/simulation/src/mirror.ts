import { Result } from 'effect'
import {
  COMPONENTS,
  IAC_SWITCH,
  IAC_TOOL_INFO,
  MIRROR_TIME,
  REFRESH_TIME,
  REGION_INFO,
  RESEARCH,
  SIZES,
  STAGE_WAIT,
  SYNC_POLL,
  type ComponentId,
  type DataPatternId,
  type IacToolId,
  type RegionId,
} from './catalog.ts'
import { Refusal, blankNode, openRegion, type Action } from './actions.ts'
import { has, priceOf, refundOf, resizePrice, restarted } from './lookups.ts'
import { isGlobal, openRegions, userSharesOf, usersOf } from './regions.ts'
import type {
  DataPattern,
  Game,
  GameLink,
  GameNode,
  Mirror,
  NodeSpec,
  Observed,
  SyncMode,
} from './state.ts'

/* ==========================================================================
   Mirrors (05 "Mirror a region", "Keeping a Mirror in sync", "IaC tools",
   "GitOps"). A Mirror is a region built from another region's Nodes and Links.
   Apply writes the source as it is now into the Mirror's code, pays for it, and
   lands after the IaC tool's apply time. Drift is every difference between the
   Mirror and its source that is not an override: the source ahead of the code is
   behind, and the Mirror away from the code is a hand change. Apply brings the
   Mirror back to the source and reverts every hand change its plan sees: all of
   them with Terraform, which refreshes on every plan, and the ones the last
   `pulumi refresh` or `alchemy drift` read with the other two.
   ========================================================================== */

/** Settings the code manages on a Node. The rest is state the Node runs with. */
export const MANAGED = [
  'size',
  'family',
  'runtime',
  'framework',
  'workers',
  'compress',
  'sampleRate',
  'retention',
  'policy',
  'checkEvery',
  'deepCheck',
  'ttl',
  'pm',
  'engine',
  'mode',
  'dlq',
  'attempts',
  'maxLength',
  'prefetch',
  'coalesce',
  'warming',
  'paranoia',
  'zone',
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
  'backup',
  'fanout',
  'split',
] as const satisfies ReadonlyArray<keyof GameNode>
export type Managed = (typeof MANAGED)[number]

/** One difference between a Mirror and its source, as the plan lists it. */
export type Change =
  | Readonly<{ _tag: 'create'; source: string; type: ComponentId; hand: boolean }>
  | Readonly<{
      _tag: 'set'
      node: string
      field: Managed
      from: NodeSpec[string]
      to: NodeSpec[string]
      hand: boolean
    }>
  | Readonly<{ _tag: 'remove'; node: string; type: ComponentId; data: boolean; hand: boolean }>
  | Readonly<{ _tag: 'link'; from: string; to: string; add: boolean; hand: boolean }>
  /** A new data Node in the source: the plan stops until the player picks its pattern. */
  | Readonly<{ _tag: 'choose'; source: string; type: ComponentId }>

export type Drift = Readonly<{
  /** The changes the plan shows. */
  changes: ReadonlyArray<Change>
  /** Hand changes the plan cannot see until the player reads live state. */
  hidden: ReadonlyArray<Change>
  behind: number
  hand: number
  /** Data Nodes sold in the source, which Apply removes only when the player confirms. */
  data: number
  /** New source data Nodes waiting for a pattern. */
  choices: number
}>

const ok = (game: Game): Action => Result.succeed(game)
const no = (refusal: Refusal): Action => Result.fail(refusal)
const notAllowed = (reason: string): Action => no(Refusal.NotAllowed({ reason }))

export const mirrorsOf = (game: Game): ReadonlyArray<Mirror> => game.mirrors ?? []

/** The Mirror built in this region, if any. */
export const mirrorOf = (game: Game, region: RegionId): Mirror | undefined =>
  mirrorsOf(game).find((mirror) => mirror.region === region)

const withMirror = (game: Game, mirror: Mirror): Game => ({
  ...game,
  mirrors: mirrorsOf(game).map((entry) => (entry.region === mirror.region ? mirror : entry)),
})

/** The IaC tool the Company writes its Mirrors in, if it picked one. */
export const toolOf = (game: Game): IacToolId | null => game.iac?.tool ?? null

/** Every plan reads live state first, so it sees every hand change: Terraform. */
export const refreshesOnPlan = (game: Game): boolean => {
  const tool = toolOf(game)
  return tool !== null && IAC_TOOL_INFO[tool].refreshOnPlan
}

/** Every tool sets any value per region: Terraform variables, Pulumi stack config, or Alchemy stage values. */
export const overridable = (game: Game): boolean => toolOf(game) !== null

/** Data Nodes whose writes the player must place. */
const isData = (type: ComponentId): boolean => type === 'database' || type === 'storage'

/** The patterns a source data Node can take. */
export const patternsFor = (type: ComponentId): ReadonlyArray<DataPatternId> =>
  type === 'database'
    ? ['replica', 'primary', 'call']
    : type === 'storage'
      ? ['replicate', 'call']
      : []

const defaultPattern = (type: ComponentId): DataPattern =>
  type === 'database' ? 'replica' : 'replicate'

/** Calendar minutes the Company has left moving to its IaC tool; 0 when Mirrors sync. */
export const switchLeft = (game: Game): number => Math.max(0, (game.iac?.until ?? 0) - game.time)

/* ---------- what the source says the Mirror should be ---------- */

type Want = Readonly<{ source: string; spec: NodeSpec }>

/** √2, so a ratio rounds to the nearest size step. */
const HALF_STEP = 1.4142135623730951

/** The size nearest to `ratio` times the capacity: each size step doubles vCPU. Exact. */
const sizeFor = (size: number, ratio: number): number => {
  let next = size
  let left = ratio
  while (left > HALF_STEP && next < SIZES.length - 1) {
    next += 1
    left /= 2
  }
  while (left * HALF_STEP < 1 && next > 0) {
    next -= 1
    left *= 2
  }
  return next
}

const specOf = (game: Game, mirror: Mirror, node: GameNode, type: ComponentId): NodeSpec => {
  const spec: Record<string, NodeSpec[string]> = { type, x: node.x, y: node.y }
  for (const field of MANAGED) spec[field] = node[field]
  // A computed value: the Mirror sizes for its own region's users.
  if (mirror.computed) {
    const shares = userSharesOf(game)
    const ratio = shares[mirror.source] > 0 ? shares[mirror.region] / shares[mirror.source] : 1
    if (COMPONENTS[type].sized) spec.size = sizeFor(node.size, ratio)
    const most = Math.max(1, Math.round(node.maxCopies * ratio))
    spec.maxCopies = most
    spec.minCopies = Math.max(1, Math.min(most, Math.round(node.minCopies * ratio)))
  }
  return spec
}

/** The Component a source Node becomes in the Mirror, or null when the Mirror does not copy it. */
const copyType = (game: Game, mirror: Mirror, node: GameNode): ComponentId | null => {
  if (node.type === 'users' || isGlobal(node) || node.type === 'wide' || node.type === 'dsql')
    return null
  if (node.type === 'database') {
    const pattern = mirror.data[node.id]
    return pattern === 'replica' ? 'replica' : pattern === 'primary' ? 'database' : null
  }
  if (node.type === 'storage') return mirror.data[node.id] === 'replicate' ? 'storage' : null
  // Replicas and poolers follow the region's Database: none when the Mirror calls it.
  if (node.type === 'replica' || node.type === 'pooler') {
    const db = game.nodes.find(
      (entry) => entry.type === 'database' && entry.region === mirror.source,
    )
    return db && mirror.data[db.id] === 'call' ? null : node.type
  }
  return node.type
}

const sourceNodes = (game: Game, mirror: Mirror): ReadonlyArray<GameNode> =>
  game.nodes.filter((node) => node.region === mirror.source)

/** Every Node the source says the Mirror should have. */
const wantsOf = (game: Game, mirror: Mirror): ReadonlyArray<Want> =>
  sourceNodes(game, mirror).flatMap((node) => {
    const type = copyType(game, mirror, node)
    return type === null ? [] : [{ source: node.id, spec: specOf(game, mirror, node, type) }]
  })

/** The Mirror ids a source Node's Links go to: its copy, the source Node itself, or both. */
const endsOf = (
  game: Game,
  mirror: Mirror,
  ids: Readonly<Record<string, string>>,
  sourceId: string,
): ReadonlyArray<string> => {
  const node = game.nodes.find((entry) => entry.id === sourceId)
  if (!node) return []
  if (node.region !== mirror.source) return [sourceId]
  const copy = ids[sourceId]
  if (node.type === 'database') {
    const pattern = mirror.data[sourceId]
    // A read replica answers reads in the region; writes cross to the source primary.
    if (pattern === 'replica') return copy ? [copy, sourceId] : [sourceId]
    if (pattern === 'primary') return copy ? [copy] : []
    return [sourceId]
  }
  if (copy) return [copy]
  return copyType(game, mirror, node) === null ? [sourceId] : []
}

const linkKey = (from: string, to: string): string => `${from}>${to}`

/** Every Link the source says the Mirror should have, by Mirror ids. */
const wantLinksOf = (
  game: Game,
  mirror: Mirror,
  ids: Readonly<Record<string, string>>,
  wants: ReadonlyArray<Want>,
): ReadonlyArray<string> => {
  const copied = new Set(wants.map((want) => want.source))
  const keys = new Set<string>()
  for (const link of game.links) {
    const from = game.nodes.find((node) => node.id === link.from)
    if (!from || from.region !== mirror.source) continue
    if (from.type !== 'users' && !copied.has(from.id)) continue
    const start = ids[from.id]
    if (!start) continue
    for (const end of endsOf(game, mirror, ids, link.to)) keys.add(linkKey(start, end))
  }
  return [...keys].toSorted()
}

/** Mirror ids of the Nodes whose Links the code manages: the copies, and the region's Users. */
const managedFrom = (game: Game, mirror: Mirror): ReadonlySet<string> => {
  const from = new Set<string>()
  for (const source of Object.keys(mirror.code)) {
    const id = mirror.nodes[source]
    if (id) from.add(id)
  }
  const users = usersOf(game, mirror.region)
  if (users) from.add(users.id)
  return from
}

const valueOf = (node: GameNode, field: Managed): NodeSpec[string] => node[field]

/* ---------- drift ---------- */

/**
 * The plan: every difference between the Mirror and its source, each marked as
 * behind (the source changed) or a hand change (the Mirror changed).
 */
export const driftOf = (game: Game, mirror: Mirror): Drift => {
  const changes: Array<Change> = []
  if (mirror.readyAt !== null)
    return { changes, hidden: [], behind: 0, hand: 0, data: 0, choices: 0 }
  for (const node of sourceNodes(game, mirror))
    if (isData(node.type) && !mirror.data[node.id])
      changes.push({ _tag: 'choose', source: node.id, type: node.type })
  const wants = wantsOf(game, mirror)
  const wanted = new Set(wants.map((want) => want.source))
  for (const want of wants) {
    const id = mirror.nodes[want.source]
    const node = id ? game.nodes.find((entry) => entry.id === id) : undefined
    const type = want.spec.type as ComponentId
    if (!node || node.type !== type) {
      if (node)
        changes.push({ _tag: 'remove', node: node.id, type: node.type, data: false, hand: false })
      // The code had it, so the Mirror lost it by hand.
      changes.push({
        _tag: 'create',
        source: want.source,
        type,
        hand: !node && mirror.code[want.source]?.type === type,
      })
      continue
    }
    const kept = mirror.overrides[node.id] ?? []
    const code = mirror.code[want.source]
    for (const field of MANAGED) {
      if (kept.includes(field)) continue
      const to = want.spec[field]
      const from = valueOf(node, field)
      if (to === undefined || from === to) continue
      changes.push({ _tag: 'set', node: node.id, field, from, to, hand: code?.[field] === to })
    }
  }
  for (const [source, id] of Object.entries(mirror.nodes)) {
    if (wanted.has(source)) continue
    const node = game.nodes.find((entry) => entry.id === id)
    if (!node || node.type === 'users') continue
    changes.push({
      _tag: 'remove',
      node: id,
      type: node.type,
      data: node.type === 'database' || node.type === 'storage' || node.type === 'replica',
      hand: false,
    })
  }
  const ids = { ...mirror.nodes }
  for (const want of wants) ids[want.source] ??= `+${want.source}`
  const want = new Set(wantLinksOf(game, mirror, ids, wants))
  const from = managedFrom(game, mirror)
  const have = new Set(
    game.links.filter((link) => from.has(link.from)).map((link) => linkKey(link.from, link.to)),
  )
  const coded = new Set(mirror.links)
  for (const key of want)
    if (!have.has(key)) {
      const [start = '', end = ''] = key.split('>')
      changes.push({ _tag: 'link', from: start, to: end, add: true, hand: coded.has(key) })
    }
  for (const key of have)
    if (!want.has(key)) {
      const [start = '', end = ''] = key.split('>')
      // A Link into a Node placed by hand in the region is not the code's business.
      const target = game.nodes.find((node) => node.id === end)
      if (target && target.region === mirror.region && !managedNode(mirror, end)) continue
      changes.push({ _tag: 'link', from: start, to: end, add: false, hand: !coded.has(key) })
    }
  const all = changes
  const shown = all.filter((change) => seenBy(game, mirror, change))
  const count = (hand: boolean): number =>
    shown.filter((change) => change._tag !== 'choose' && change.hand === hand).length
  return {
    changes: shown,
    hidden: all.filter((change) => !seenBy(game, mirror, change)),
    behind: count(false) + shown.filter((change) => change._tag === 'choose').length,
    hand: count(true),
    data: shown.filter((change) => change._tag === 'remove' && change.data).length,
    choices: shown.filter((change) => change._tag === 'choose').length,
  }
}

const managedNode = (mirror: Mirror, id: string): boolean =>
  Object.values(mirror.nodes).includes(id)

/** A key for a hand change, so a landing can leave the unseen ones alone. */
const holdKey = (change: Change): string =>
  change._tag === 'set'
    ? `set:${change.node}:${change.field}`
    : change._tag === 'create'
      ? `create:${change.source}`
      : change._tag === 'link'
        ? `link:${change.from}>${change.to}`
        : change._tag === 'remove'
          ? `remove:${change.node}`
          : `choose:${change.source}`

/**
 * The plan sees a change: every change in the source, and every hand change when
 * the tool refreshes on each plan. Otherwise a hand change shows only when the
 * last read of live state already had it.
 */
const seenBy = (game: Game, mirror: Mirror, change: Change): boolean => {
  if (change._tag === 'choose' || !change.hand || refreshesOnPlan(game)) return true
  const seen = mirror.seen
  if (!seen) return false
  if (change._tag === 'set') return seen.nodes[change.node]?.[change.field] === change.from
  if (change._tag === 'create') {
    const id = mirror.nodes[change.source]
    return id !== undefined && seen.nodes[id] === undefined
  }
  if (change._tag === 'link')
    return seen.links.includes(linkKey(change.from, change.to)) !== change.add
  return true
}

/** The Mirror's live state now: what `pulumi refresh` or `alchemy drift` reads. */
const observe = (game: Game, mirror: Mirror): Observed => {
  const nodes: Record<string, NodeSpec> = {}
  for (const id of Object.values(mirror.nodes)) {
    const node = game.nodes.find((entry) => entry.id === id)
    if (!node || node.type === 'users') continue
    const spec: Record<string, NodeSpec[string]> = { type: node.type }
    for (const field of MANAGED) spec[field] = node[field]
    nodes[id] = spec
  }
  const from = managedFrom(game, mirror)
  const links = game.links
    .filter((link) => from.has(link.from))
    .map((link) => linkKey(link.from, link.to))
  return { nodes, links }
}

/** Cash an Apply costs now: each new Node at its place price, and each size step up. */
export const applyCost = (game: Game, mirror: Mirror): number => {
  let cost = 0
  let counted = game
  for (const change of driftOf(game, mirror).changes) {
    if (change._tag === 'create') {
      cost += priceOf(counted, change.type)
      counted = {
        ...counted,
        nodes: [...counted.nodes, blankNode(counted, '', change.type, 0, 0, mirror.region)],
      }
    }
    if (change._tag === 'set' && change.field === 'size') {
      const node = game.nodes.find((entry) => entry.id === change.node)
      if (!node) continue
      for (let size = node.size; size < Number(change.to); size += 1)
        cost += resizePrice(game, { ...node, size }) ?? 0
    }
  }
  return cost
}

/* ---------- Apply and landing ---------- */

/**
 * Calendar minutes from Apply until the plan lands: `mirror_time` when it builds
 * new Nodes, plus the refresh of every Node when the tool refreshes on each plan.
 */
export const applySeconds = (game: Game, mirror: Mirror, creates: boolean): number =>
  (creates ? MIRROR_TIME : 0) +
  (refreshesOnPlan(game) ? REFRESH_TIME * Object.keys(mirror.code).length : 0)

/**
 * Writes the source into the Mirror's code and pays for it. With new Nodes, the
 * plan lands after the tool's apply time; without, it lands now. `destroy`
 * confirms removing data Nodes the source sold.
 */
const write = (game: Game, mirror: Mirror, destroy: boolean): Game => {
  const drift = driftOf(game, mirror)
  const wants = wantsOf(game, mirror)
  let nextId = game.nextId
  const nodes = { ...mirror.nodes }
  // A Node the Mirror lost, or one whose type changed, gets a new id now so the code can link it.
  const live = new Set(game.nodes.map((node) => node.id))
  const hold = drift.hidden.map(holdKey)
  for (const want of wants) {
    const id = nodes[want.source]
    const node = id ? game.nodes.find((entry) => entry.id === id) : undefined
    if (id && live.has(id) && node?.type === want.spec.type) continue
    // A copy sold by hand that the plan did not see stays sold, under its old id.
    if (id && hold.includes(`create:${want.source}`)) continue
    nodes[want.source] = `n${nextId}`
    nextId += 1
  }
  const users = usersOf(game, mirror.region)
  const sourceUsers = usersOf(game, mirror.source)
  if (users && sourceUsers) nodes[sourceUsers.id] = users.id
  const code: Record<string, NodeSpec> = {}
  for (const want of wants) code[want.source] = want.spec
  // Data Nodes the source sold stay, in the code as they were, until the player confirms.
  const kept = destroy
    ? []
    : drift.changes.flatMap((change) =>
        change._tag === 'remove' && change.data
          ? Object.entries(mirror.nodes).filter(([, id]) => id === change.node)
          : [],
      )
  for (const [source] of kept) {
    const spec = mirror.code[source]
    if (spec) code[source] = spec
  }
  const links = wantLinksOf(game, { ...mirror, nodes }, nodes, wants)
  const keptLinks = mirror.links.filter((key) =>
    kept.some(([, id]) => key.endsWith(`>${id}`) || key.startsWith(`${id}>`)),
  )
  const creates = drift.changes.some((change) => change._tag === 'create')
  const wait = applySeconds(game, { ...mirror, code }, creates)
  const written: Mirror = {
    ...mirror,
    nodes,
    code,
    links: [...new Set([...links, ...keptLinks])].toSorted(),
    seen: null,
    hold,
    readyAt: wait > 0 ? game.time + wait : null,
    driftAt: null,
  }
  const paid: Game = {
    ...game,
    nextId,
    cash: game.sandbox ? game.cash : game.cash - applyCost(game, mirror),
  }
  return wait > 0 ? withMirror(paid, written) : land(withMirror(paid, written), written)
}

/** The source Link a Mirror Link copies, for its timeout, retries, and breaker. */
const sourceLinkOf = (
  game: Game,
  mirror: Mirror,
  from: string,
  to: string,
): GameLink | undefined => {
  const back = (id: string): string =>
    Object.entries(mirror.nodes).find(([, entry]) => entry === id)?.[0] ?? id
  return game.links.find((link) => link.from === back(from) && link.to === back(to))
}

/**
 * Makes the Mirror what its code says: new Nodes arrive cold, and the hand changes
 * the plan saw revert. The ones it did not see stay.
 */
const land = (game: Game, mirror: Mirror): Game => {
  const held = new Set(mirror.hold)
  let nodes = [...game.nodes]
  let cash = game.cash
  const coded = new Set(Object.keys(mirror.code))
  for (const [source, spec] of Object.entries(mirror.code)) {
    const id = mirror.nodes[source]
    if (!id) continue
    const type = spec.type as ComponentId
    const at = nodes.findIndex((node) => node.id === id)
    const current = nodes[at]
    const kept = mirror.overrides[id] ?? []
    const settings: Record<string, NodeSpec[string]> = {}
    for (const field of MANAGED) {
      const value = spec[field]
      if (value !== undefined && !kept.includes(field) && !held.has(`set:${id}:${field}`))
        settings[field] = value
    }
    if (!current && held.has(`create:${source}`)) continue
    if (current && current.type === type) {
      const resized =
        COMPONENTS[type].sized && settings.size !== undefined && settings.size !== current.size
      nodes[at] = {
        ...current,
        ...(settings as Partial<GameNode>),
        ...(resized ? restarted(current) : {}),
      }
      continue
    }
    if (current) {
      cash += refundOf({ ...game, nodes }, current)
      nodes = nodes.filter((node) => node.id !== id)
    }
    const blank = blankNode(
      { ...game, nodes },
      id,
      type,
      Number(spec.x),
      Number(spec.y),
      mirror.region,
    )
    nodes.push({ ...blank, ...(settings as Partial<GameNode>), upgradedAt: game.time })
  }
  // A copy the code no longer has is sold.
  for (const [source, id] of Object.entries(mirror.nodes)) {
    if (coded.has(source)) continue
    const node = nodes.find((entry) => entry.id === id)
    if (!node || node.type === 'users') continue
    cash += refundOf({ ...game, nodes }, node)
    nodes = nodes.filter((entry) => entry.id !== id)
  }
  const live = new Set(nodes.map((node) => node.id))
  const mapped = Object.fromEntries(
    Object.entries(mirror.nodes).filter(
      ([source, id]) =>
        (live.has(id) || held.has(`create:${source}`)) &&
        (coded.has(source) || nodes.find((node) => node.id === id)?.type === 'users'),
    ),
  )
  const from = managedFrom({ ...game, nodes }, mirror)
  const want = new Set(mirror.links)
  const links = game.links.filter(
    (link) =>
      live.has(link.from) &&
      live.has(link.to) &&
      (!from.has(link.from) ||
        want.has(linkKey(link.from, link.to)) ||
        held.has(`link:${link.from}>${link.to}`) ||
        !managedTarget(nodes, mirror, link.to)),
  )
  const have = new Set(links.map((link) => linkKey(link.from, link.to)))
  for (const key of mirror.links) {
    if (have.has(key) || held.has(`link:${key}`)) continue
    const [start = '', end = ''] = key.split('>')
    if (!live.has(start) || !live.has(end)) continue
    const settings = sourceLinkOf(game, mirror, start, end)
    links.push({
      from: start,
      to: end,
      timeout: settings?.timeout ?? 30,
      retries: settings?.retries ?? 'none',
      kinds: settings?.kinds ?? null,
      breaker: settings?.breaker ?? false,
      open: 0,
      failure: 0,
    })
  }
  const landed: Mirror = {
    ...mirror,
    nodes: mapped,
    hold: [],
    overrides: Object.fromEntries(Object.entries(mirror.overrides).filter(([id]) => live.has(id))),
    readyAt: null,
  }
  return withMirror({ ...game, nodes, links, cash }, landed)
}

/** A Link into a Node in the Mirror's region that the code does not manage is left alone. */
const managedTarget = (nodes: ReadonlyArray<GameNode>, mirror: Mirror, id: string): boolean => {
  const node = nodes.find((entry) => entry.id === id)
  return !node || node.region !== mirror.region || managedNode(mirror, id)
}

/** The Game once the Mirror's Apply has landed, to show what the plan adds to Burn. */
export const previewApply = (game: Game, region: RegionId): Game => {
  const mirror = mirrorOf(game, region)
  if (!mirror || mirror.readyAt !== null) return game
  const written = write({ ...game, cash: Number.MAX_SAFE_INTEGER }, mirror, false)
  const pending = mirrorOf(written, region)
  return pending && pending.readyAt !== null ? land(written, pending) : written
}

/* ---------- actions ---------- */

const locked = (what: string, research: 'infra-as-code' | 'gitops'): Action =>
  no(Refusal.Locked({ what, research: RESEARCH[research].name }))

/** Picks the IaC tool. Moving to another one later stops every Mirror's sync for a calendar day. */
export const pickIacTool = (game: Game, tool: IacToolId): Action => {
  if (!has(game, 'infra-as-code')) return locked('An IaC tool', 'infra-as-code')
  if (game.iac?.tool === tool)
    return notAllowed(`The code is already in ${IAC_TOOL_INFO[tool].name}.`)
  if (switchLeft(game) > 0) return notAllowed('Finish the current move first.')
  return ok({
    ...game,
    iac: {
      tool,
      until: game.iac ? game.time + IAC_SWITCH : game.time,
      sync: game.iac?.sync ?? null,
    },
    // The new tool has read nothing yet.
    ...(game.mirrors && {
      mirrors: game.mirrors.map((mirror) => ({ ...mirror, seen: null })),
    }),
  })
}

/** Sets how GitOps syncs the Mirrors, or null to apply plans by hand. */
export const setSyncMode = (game: Game, sync: SyncMode | null): Action => {
  if (sync !== null && !has(game, 'gitops')) return locked('GitOps', 'gitops')
  if (!game.iac) return notAllowed('Pick an IaC tool first.')
  return ok({
    ...game,
    iac: { ...game.iac, sync },
    ...(game.mirrors && { mirrors: game.mirrors.map((mirror) => ({ ...mirror, driftAt: null })) }),
  })
}

/** Starts a Mirror of `source` in `target`, opening the target first if it is closed. */
export const startMirror = (game: Game, target: RegionId, source: RegionId): Action => {
  if (!has(game, 'infra-as-code')) return locked('Mirror a region', 'infra-as-code')
  if (!game.iac) return notAllowed('Pick an IaC tool first.')
  if (target === source) return notAllowed('Pick another region to mirror from.')
  if (!openRegions(game).includes(source)) return notAllowed('Open the source region first.')
  if (mirrorOf(game, target)) return notAllowed(`${REGION_INFO[target].name} is already a Mirror.`)
  if (mirrorOf(game, source))
    return notAllowed(
      `${REGION_INFO[source].name} is a Mirror. Mirror from its source, ${REGION_INFO[mirrorOf(game, source)?.source ?? source].name}.`,
    )
  if (mirrorsOf(game).some((mirror) => mirror.source === target))
    return notAllowed(`${REGION_INFO[target].name} is the source of a Mirror.`)
  const opened = openRegions(game).includes(target)
    ? Result.succeed(game)
    : openRegion(game, target)
  if (Result.isFailure(opened)) return opened
  const next = opened.success
  const users = usersOf(next, target)
  const sourceUsers = usersOf(next, source)
  const data: Record<string, DataPattern> = {}
  for (const node of next.nodes)
    if (node.region === source && isData(node.type)) data[node.id] = defaultPattern(node.type)
  const mirror: Mirror = {
    region: target,
    source,
    nodes: users && sourceUsers ? { [sourceUsers.id]: users.id } : {},
    data,
    code: {},
    links: [],
    seen: null,
    hold: [],
    overrides: {},
    computed: false,
    readyAt: null,
    driftAt: null,
  }
  return ok({ ...next, mirrors: [...mirrorsOf(next), mirror] })
}

/** Stops managing a region: its Nodes stay, placed by hand. */
export const stopMirror = (game: Game, region: RegionId): Action =>
  mirrorOf(game, region)
    ? ok({ ...game, mirrors: mirrorsOf(game).filter((mirror) => mirror.region !== region) })
    : notAllowed('That region is not a Mirror.')

const applyRefusal = (game: Game, mirror: Mirror): Action | null => {
  if (!game.iac) return notAllowed('Pick an IaC tool first.')
  const left = switchLeft(game)
  if (left > 0)
    return notAllowed(
      `The code is moving to ${IAC_TOOL_INFO[game.iac.tool].name}. Mirrors sync again in ${Math.ceil(left)} min.`,
    )
  if (mirror.readyAt !== null) return notAllowed('An Apply is landing.')
  const drift = driftOf(game, mirror)
  if (drift.choices > 0) return notAllowed('Pick where each new data Node’s writes go first.')
  const cost = applyCost(game, mirror)
  if (!game.sandbox && game.cash < cost)
    return no(Refusal.Unaffordable({ what: 'The plan', price: cost, currency: 'cash' }))
  return null
}

/** Applies the plan: the Mirror comes back to its source, and every hand change reverts. */
export const applyMirror = (game: Game, region: RegionId, destroy = false): Action => {
  const mirror = mirrorOf(game, region)
  if (!mirror) return notAllowed('That region is not a Mirror.')
  return applyRefusal(game, mirror) ?? ok(write(game, mirror, destroy))
}

/** Picks how the Mirror copies one source data Node. */
export const setMirrorData = (
  game: Game,
  region: RegionId,
  source: string,
  pattern: DataPattern,
): Action => {
  const mirror = mirrorOf(game, region)
  const node = game.nodes.find((entry) => entry.id === source)
  if (!mirror || !node) return no(Refusal.Missing())
  if (!patternsFor(node.type).includes(pattern))
    return notAllowed(`${COMPONENTS[node.type].name} cannot use that pattern.`)
  return ok(withMirror(game, { ...mirror, data: { ...mirror.data, [source]: pattern } }))
}

/** Keeps a Mirror Node's setting as an override, or gives it back to the code. */
export const setOverride = (
  game: Game,
  region: RegionId,
  nodeId: string,
  field: Managed,
  keep: boolean,
): Action => {
  const mirror = mirrorOf(game, region)
  if (!mirror) return notAllowed('That region is not a Mirror.')
  if (keep && !overridable(game)) return notAllowed('Pick an IaC tool first.')
  const current = mirror.overrides[nodeId] ?? []
  const next = keep ? [...new Set([...current, field])] : current.filter((entry) => entry !== field)
  const overrides = Object.fromEntries(
    Object.entries({ ...mirror.overrides, [nodeId]: next }).filter(([, list]) => list.length > 0),
  )
  return ok(withMirror(game, { ...mirror, overrides }))
}

/** The Mirror's sizes and Autoscaler bounds follow its region's share of users. */
export const setComputed = (game: Game, region: RegionId, computed: boolean): Action => {
  const mirror = mirrorOf(game, region)
  if (!mirror) return notAllowed('That region is not a Mirror.')
  return ok(withMirror(game, { ...mirror, computed }))
}

/**
 * Reads the Mirror's live state (`pulumi refresh`, `alchemy drift`), so the plan
 * shows the hand changes made so far. Terraform needs none: each plan refreshes.
 */
export const refreshMirror = (game: Game, region: RegionId): Action => {
  const mirror = mirrorOf(game, region)
  const tool = toolOf(game)
  if (!mirror || !tool) return notAllowed('That region is not a Mirror.')
  if (IAC_TOOL_INFO[tool].refreshOnPlan)
    return notAllowed(`${IAC_TOOL_INFO[tool].name} refreshes on every plan.`)
  if (mirror.readyAt !== null) return notAllowed('An Apply is landing.')
  return ok(withMirror(game, { ...mirror, seen: observe(game, mirror) }))
}

/**
 * Alchemy's `drift --repair`: reads live state again and restores every hand
 * change to the last deployed state. Changes in the source wait for the next Apply.
 */
export const repairMirror = (game: Game, region: RegionId): Action => {
  const mirror = mirrorOf(game, region)
  const tool = toolOf(game)
  if (!mirror || !tool) return notAllowed('That region is not a Mirror.')
  if (!IAC_TOOL_INFO[tool].repair) return notAllowed(`${IAC_TOOL_INFO[tool].name} has no repair.`)
  if (mirror.readyAt !== null) return notAllowed('An Apply is landing.')
  const seen = { ...mirror, seen: observe(game, mirror) }
  const lost = driftOf(game, seen).changes.filter(
    (change) => change._tag === 'create' && change.hand,
  )
  let cost = 0
  let counted = game
  for (const change of lost)
    if (change._tag === 'create') {
      cost += priceOf(counted, change.type)
      counted = {
        ...counted,
        nodes: [...counted.nodes, blankNode(counted, '', change.type, 0, 0, mirror.region)],
      }
    }
  if (!game.sandbox && game.cash < cost)
    return no(Refusal.Unaffordable({ what: 'The repair', price: cost, currency: 'cash' }))
  const paid: Game = { ...game, cash: game.sandbox ? game.cash : game.cash - cost }
  const repaired: Mirror = { ...mirror, seen: null, hold: [] }
  // A Node sold by hand comes back after the build time; settings and Links now.
  return ok(
    lost.length > 0
      ? withMirror(paid, { ...repaired, readyAt: game.time + MIRROR_TIME })
      : land(withMirror(paid, repaired), repaired),
  )
}

/* ---------- the Step ---------- */

const syncDelay = (sync: SyncMode): number => (sync === 'staged' ? STAGE_WAIT : SYNC_POLL)

/**
 * Lands each Apply whose time has come, and with GitOps, applies each drifted
 * Mirror once its sync is due: at the next poll, or after the stage wait.
 */
export const advanceMirrors = (game: Game): Game => {
  if (!game.mirrors || game.mirrors.length === 0) return game
  let next = game
  for (const mirror of game.mirrors) {
    const current = mirrorOf(next, mirror.region)
    if (!current) continue
    if (current.readyAt !== null) {
      if (next.time >= current.readyAt) next = land(next, current)
      continue
    }
    const sync = next.iac?.sync ?? null
    if (sync === null || switchLeft(next) > 0) continue
    // A GitOps controller reconciles against live state: it sees every hand change.
    const watched = { ...current, seen: observe(next, current) }
    const drift = driftOf(next, watched)
    if (drift.behind + drift.hand === 0) {
      if (current.driftAt !== null) next = withMirror(next, { ...current, driftAt: null })
      continue
    }
    const since = current.driftAt ?? next.time
    if (current.driftAt === null) next = withMirror(next, { ...current, driftAt: since })
    if (next.time < since + syncDelay(sync)) continue
    const latest = mirrorOf(next, mirror.region)
    const live = latest && { ...latest, seen: observe(next, latest) }
    if (live && applyRefusal(next, live) === null) next = write(next, live, false)
  }
  return next
}
