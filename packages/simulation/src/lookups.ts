import {
  CACHE_ENGINES,
  AUTH_PRICE_PER_USER,
  COMPONENTS,
  COMPONENT_IDS,
  COPY_PRICE_GROWTH,
  CROSS_ZONE_MS,
  DRAWER_MIN,
  DRAWER_SECONDS,
  ERAS,
  FAMILIES,
  FRAMEWORKS,
  FRAMEWORK_RESEARCH,
  RESEARCH,
  RUNTIMES,
  SAMPLE_RATES,
  RETENTION_STORAGE,
  RETENTION_WINDOWS,
  SAMPLE_STORAGE,
  GPU_TYPES,
  GZIP_RATIO,
  HANDSHAKE_MS,
  HOP_MS,
  POD_BURN,
  PROFILES,
  RESTART_SECONDS,
  SELL_REFUND,
  SIZES,
  STORAGE_PRICE,
  STREAM_KB,
  VCPU_PRICE,
  WARMED,
  USER_MBPS,
  USER_UP_MBPS,
  VM_RESTART_SECONDS,
  type BuildGroup,
  type ComponentId,
  type EraDef,
  type FrameworkId,
  type RequestKind,
  type RequestProfile,
  type ResearchId,
  type RuntimeId,
  BACKUPS,
  SPREAD_REGIONS,
} from './catalog.ts'
import type { Game, GameNode } from './state.ts'

/* ==========================================================================
   Small facts about a Game that the solver, the actions and the UI all ask:
   what is researched, what a Node's hardware is, and what things cost.
   ========================================================================== */

/** The researched list as a set, built once per list: the solver asks on every hop. */
const researchedSets = new WeakMap<ReadonlyArray<ResearchId>, ReadonlySet<ResearchId>>()

export const has = (game: Game, id: ResearchId): boolean => {
  let set = researchedSets.get(game.researched)
  if (!set) {
    set = new Set(game.researched)
    researchedSets.set(game.researched, set)
  }
  return set.has(id)
}

/** All pools together, for figures that show one Insight number. */
export const insightTotal = (pools: Readonly<Record<string, number>>): number =>
  Object.values(pools).reduce((sum, value) => sum + value, 0)

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

/** Where an Analytics Node's sample rate sits on the ladder of rates. */
export const sampleIndex = (node: GameNode): number => {
  const index = (SAMPLE_RATES as ReadonlyArray<number>).indexOf(node.sampleRate)
  return index === -1 ? 2 : index
}

export const vcpuOf = (node: GameNode): number => SIZES[node.size]?.vcpu ?? 1

/** KB a response of this kind sends from this Node: gzip shrinks the compressible kinds. */
export const payloadOf = (node: GameNode, kind: RequestKind, offloaded = false): number =>
  (offloaded && PROFILES[kind].offload > 0 ? PROFILES[kind].asyncKB : PROFILES[kind].payloadKB) *
  (node.compress && PROFILES[kind].compressible ? GZIP_RATIO : 1)

/** Milliseconds the response takes to reach the user over their downlink, after the request came up. */
export const transferMs = (node: GameNode, kind: RequestKind, offloaded = false): number =>
  ((PROFILES[kind].stream
    ? Math.min(STREAM_KB, payloadOf(node, kind, offloaded))
    : payloadOf(node, kind, offloaded)) *
    8) /
    USER_MBPS +
  (PROFILES[kind].inKB * 8) / USER_UP_MBPS

/** Credential stuffing: bots send logins, each one a password hash. */
export const stuffing = (game: Game): boolean => game.incident?.kind === 'stuffing'

/** A kind's profile now: during credential stuffing, bots send logins. */
export const profileOf = (game: Game, kind: RequestKind): RequestProfile =>
  kind === 'bot' && stuffing(game) ? { ...PROFILES.login, scored: false } : PROFILES[kind]

/** This kind costs an App Server a login: a password hash, or a call to the Auth Provider. */
export const asLogin = (game: Game, kind: RequestKind): boolean =>
  kind === 'login' || (kind === 'bot' && stuffing(game))

/** Milliseconds one internal call costs on the wire: a hop, plus a handshake without keep-alive. */
export const hopMs = (game: Game): number => HOP_MS + (has(game, 'keepalive') ? 0 : HANDSHAKE_MS)

/** Nodes a zone outage takes down: what the Company runs in one zone itself. */
export const zoned = (node: GameNode): boolean =>
  COMPONENTS[node.type].limiting &&
  !COMPONENTS[node.type].fixed &&
  // A provider's, and the regional Load Balancer's and WAF's, span every zone.
  node.type !== 'psp' &&
  node.type !== 'llm' &&
  node.type !== 'lb' &&
  node.type !== 'waf' &&
  // A store spread across regions keeps replicas in every zone too.
  !((node.type === 'wide' || node.type === 'dsql') && node.spread)

/** Extra milliseconds a call between two Nodes pays for leaving its zone. Regional Nodes span every zone. */
export const zoneMs = (from: GameNode, to: GameNode): number =>
  zoned(from) && zoned(to) && from.zone !== to.zone ? CROSS_ZONE_MS : 0

/** KB per second the box's network card moves: Gbps × 125,000. */
export const networkOf = (node: GameNode): number => (SIZES[node.size]?.gbps ?? 1) * 125_000

/** GB of RAM. */
export const ramOf = (node: GameNode): number => vcpuOf(node) * FAMILIES[node.family].ram

export const isDown = (node: GameNode): boolean => node.down !== 0

/** The Node links into a live Kubernetes Cluster: it runs as pods. */
export const inCluster = (game: Game, node: GameNode): boolean =>
  (node.type === 'server' || node.type === 'worker') && clusteredOf(game).has(node.id)

/** The ids of Nodes with a Link into a live Cluster, found once per Game. */
const clustered = new WeakMap<Game, ReadonlySet<string>>()
const clusteredOf = (game: Game): ReadonlySet<string> => {
  let ids = clustered.get(game)
  if (!ids) {
    const live = new Set(
      game.nodes
        .filter((entry) => entry.type === 'cluster' && !isDown(entry))
        .map((entry) => entry.id),
    )
    ids = new Set(game.links.filter((link) => live.has(link.to)).map((link) => link.from))
    clustered.set(game, ids)
  }
  return ids
}

/** Copies of a Node that bill: the ones serving and the ones still booting. */
export const copiesOf = (node: GameNode): number => node.replicas + node.pending

/** Seconds a Node stays down when it restarts: an App Server boots its runtime, at least 1 s for the VM. */
export const restartSeconds = (node: GameNode): number =>
  node.type === 'server'
    ? Math.max(
        VM_RESTART_SECONDS,
        RUNTIMES[node.runtime].startup + FRAMEWORKS[node.framework].startup,
      )
    : RESTART_SECONDS

/** The fields of a Node that restarts and comes back cold. */
/** How warm a Node comes back from a restart: cold, except Redis, which reloads its data. */
export const warmAfterRestart = (node: GameNode, warming = false): number =>
  node.type === 'cache'
    ? Math.max(CACHE_ENGINES[node.engine].warmAfterRestart, warming ? WARMED : 0)
    : 0

export const restarted = (
  node: GameNode,
  cause: GameNode['downCause'] = 'restart',
  warming = false,
) => ({
  down: restartSeconds(node),
  downCause: cause,
  warm: warmAfterRestart(node, warming),
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

/** Regions a spread store replicates to: the open regions, at most SPREAD_REGIONS. */
export const spreadCount = (game: Game): number =>
  Math.min(
    SPREAD_REGIONS,
    new Set([
      'na',
      ...game.nodes.filter((node) => node.type === 'users').map((node) => node.region),
    ]).size,
  )

/** Dollars per second a Node costs while it exists, down or not. */
export const burnOf = (game: Game, node: GameNode): number => {
  const def = COMPONENTS[node.type]
  const index = eraOf(game).costIndex
  if (def.sized) {
    const box = vcpuOf(node) * VCPU_PRICE * FAMILIES[node.family].price * index
    // Backups store snapshots or the WAL on top of the box (07 "Backups").
    const one =
      node.type === 'database' && node.backup !== 'none'
        ? box * (1 + BACKUPS[node.backup].burn)
        : box
    // A standby is a second box; pods pack onto shared nodes.
    if (node.standby) return one * 2
    if (copiesOf(node) === 1 && !inCluster(game, node)) return one
    return one * copiesOf(node) * (inCluster(game, node) ? POD_BURN : 1)
  }
  if (node.type === 'analytics')
    return (
      def.burn *
      (SAMPLE_STORAGE[sampleIndex(node)] ?? 1) *
      (RETENTION_STORAGE[(RETENTION_WINDOWS as ReadonlyArray<number>).indexOf(node.retention)] ??
        1) *
      flatScale(node) *
      index
    )
  if (node.type === 'auth') return game.users * AUTH_PRICE_PER_USER
  if (node.type === 'storage') return (def.burn + game.stored * STORAGE_PRICE) * index
  if (node.type === 'gpu') return GPU_TYPES[node.gpu].burn * flatScale(node) * index
  // A spread store runs its nodes in each region it replicates to.
  if ((node.type === 'wide' || node.type === 'dsql') && node.spread)
    return def.burn * flatScale(node) * index * spreadCount(game)
  return def.burn * flatScale(node) * index * (node.standby ? 2 : 1)
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
