import { Data, Result } from 'effect'
import {
  COMPONENTS,
  CREDIT_CAP,
  DEFAULT_FPM_WORKERS,
  ERAS,
  FIRST_INCIDENT_AFTER,
  FRAMEWORKS,
  KINDS,
  LANGUAGES,
  POOL_LIMITS,
  REQUEST_KINDS,
  RESEARCH,
  RESTART_SECONDS,
  RUNTIMES,
  SAMPLE_RATES,
  SIZES,
  type ComponentId,
  type FamilyId,
  type FrameworkId,
  type Kind,
  type ResearchId,
  type RuntimeId,
} from './catalog.ts'
import {
  frameworkReady,
  has,
  eraOf,
  isDown,
  isFinalEra,
  isUnlocked,
  maxSize,
  nextEra,
  priceOf,
  refundOf,
  replacePrice,
  researchReady,
  resizePrice,
  runtimeReady,
  vcpuOf,
} from './lookups.ts'
import type { Game, GameLink, GameNode } from './state.ts'

/* ==========================================================================
   Everything the player can do. Each action returns the next Game, or a
   Refusal that says why not. The update function only routes Messages here.
   ========================================================================== */

export type Refusal = Data.TaggedEnum<{
  /** Needs research first. */
  Locked: { readonly what: string; readonly research: string }
  /** Needs a later Era. */
  TooEarly: { readonly what: string; readonly era: string }
  Unaffordable: {
    readonly what: string
    readonly price: number
    readonly currency: 'cash' | 'insight'
  }
  /** Breaks a rule of the Design. */
  NotAllowed: { readonly reason: string }
  /** The Node or item is gone. */
  Missing: {}
}>

export const Refusal = Data.taggedEnum<Refusal>()

export const describeRefusal = (refusal: Refusal): string =>
  Refusal.$match(refusal, {
    Locked: ({ what, research }) => `${what} needs ${research}.`,
    TooEarly: ({ what, era }) => `${what} opens in ${era}.`,
    Unaffordable: ({ what, price, currency }) =>
      currency === 'cash'
        ? `${what} costs $${Math.round(price).toLocaleString('en-US')}.`
        : `${what} needs ${Math.round(price)} Insight.`,
    NotAllowed: ({ reason }) => reason,
    Missing: () => 'That is gone.',
  })

export type Action = Result.Result<Game, Refusal>

const ok = (game: Game): Action => Result.succeed(game)
const no = (refusal: Refusal): Action => Result.fail(refusal)
const notAllowed = (reason: string): Action => no(Refusal.NotAllowed({ reason }))

const withNode = (game: Game, id: string, apply: (node: GameNode) => Action): Action => {
  const node = game.nodes.find((entry) => entry.id === id)
  return node ? apply(node) : no(Refusal.Missing())
}

const patch = (game: Game, id: string, change: Partial<GameNode>): Game => ({
  ...game,
  nodes: game.nodes.map((node) => (node.id === id ? { ...node, ...change } : node)),
})

const spend = (game: Game, price: number, what: string, apply: (game: Game) => Game): Action =>
  game.cash < price
    ? no(Refusal.Unaffordable({ what, price, currency: 'cash' }))
    : ok(apply({ ...game, cash: game.cash - price }))

/** A restart: the Node is down for a moment and comes back cold. */
const restarted: Partial<GameNode> = { down: RESTART_SECONDS, warm: 0 }

/* ---------- placing and removing ---------- */

const blankNode = (game: Game, id: string, type: ComponentId, x: number, y: number): GameNode => {
  const stack = game.nodes.find((node) => node.type === 'server')
  return {
    id,
    type,
    x: Math.round(x),
    y: Math.round(y),
    size: 1,
    family: 'general',
    runtime: stack?.runtime ?? 'mod_php',
    framework: stack?.framework ?? 'none',
    workers: stack?.workers ?? DEFAULT_FPM_WORKERS,
    localDb: false,
    sample: 1,
    down: 0,
    warm:
      type === 'server' || type === 'cache' || type === 'database' || type === 'replica' ? 0 : 1,
    credits: 0,
    leak: 0,
  }
}

export const place = (game: Game, type: ComponentId, x: number, y: number): Action => {
  const def = COMPONENTS[type]
  if (def.fixed) return notAllowed(`${def.name} cannot be placed.`)
  if (!isUnlocked(game, type) && def.unlock)
    return no(Refusal.Locked({ what: def.name, research: RESEARCH[def.unlock].name }))
  const node = blankNode(game, `n${game.nextId}`, type, x, y)
  return spend(game, priceOf(game, type), def.name, (paid) => ({
    ...paid,
    nextId: paid.nextId + 1,
    nodes: [...paid.nodes, node],
  }))
}

export const sell = (game: Game, id: string): Action =>
  withNode(game, id, (node) =>
    COMPONENTS[node.type].fixed
      ? notAllowed(`${COMPONENTS[node.type].name} stays.`)
      : ok({
          ...game,
          cash: game.cash + refundOf(game, node),
          nodes: game.nodes.filter((entry) => entry.id !== id),
          links: game.links.filter((link) => link.from !== id && link.to !== id),
        }),
  )

export const move = (game: Game, id: string, x: number, y: number): Game =>
  patch(game, id, { x: Math.round(x), y: Math.round(y) })

/* ---------- links ---------- */

/** Kinds a Node sends on its routing links. */
const emitsOf = (node: GameNode): ReadonlyArray<Kind> => {
  switch (node.type) {
    case 'users':
    case 'dns':
    case 'lb':
      return REQUEST_KINDS
    case 'server':
      return ['q-read', 'q-write', 'auth']
    case 'cache':
    case 'pooler':
      return ['q-read', 'q-write']
    default:
      return []
  }
}

const reaches = (links: ReadonlyArray<GameLink>, from: string, to: string): boolean => {
  const seen = new Set<string>()
  const stack = [from]
  while (stack.length > 0) {
    const at = stack.pop() as string
    if (at === to) return true
    if (seen.has(at)) continue
    seen.add(at)
    for (const link of links) if (link.from === at) stack.push(link.to)
  }
  return false
}

const kindList = (kinds: ReadonlyArray<Kind>): string =>
  kinds.map((kind) => KINDS[kind].label.toLowerCase()).join(', ')

export const connect = (game: Game, from: string, to: string): Action => {
  const source = game.nodes.find((node) => node.id === from)
  const target = game.nodes.find((node) => node.id === to)
  if (!source || !target || from === to) return notAllowed('Link two different Nodes.')
  const sourceDef = COMPONENTS[source.type]
  const targetDef = COMPONENTS[target.type]
  if (game.links.some((link) => link.from === from && link.to === to))
    return notAllowed('Already linked.')
  if (targetDef.tap) {
    if (sourceDef.tap || source.type === 'payments')
      return notAllowed(`${sourceDef.name} has no traffic to sample.`)
    return ok({ ...game, links: [...game.links, { from, to }] })
  }
  if (sourceDef.maxOut === 0 || emitsOf(source).length === 0)
    return notAllowed(`${sourceDef.name} sends nothing on. Link it into Analytics to sample it.`)
  if (targetDef.accepts.length === 0) return notAllowed(`${targetDef.name} has no input.`)
  const carried = emitsOf(source).filter((kind) => targetDef.accepts.includes(kind))
  if (carried.length === 0)
    return notAllowed(
      `${targetDef.name} takes ${kindList(targetDef.accepts)}. ${sourceDef.name} sends ${kindList(emitsOf(source))}.`,
    )
  const routing = game.links.filter((link) => {
    const end = game.nodes.find((node) => node.id === link.to)
    return link.from === from && end && !COMPONENTS[end.type].tap
  })
  if (routing.length >= sourceDef.maxOut)
    return notAllowed(
      source.type === 'users'
        ? 'A domain resolves to one host. Put DNS or a Load Balancer in front to reach more.'
        : `${sourceDef.name} takes ${sourceDef.maxOut} links.`,
    )
  if (reaches(game.links, to, from)) return notAllowed('That link would make a loop.')
  const linked: Game = { ...game, links: [...game.links, { from, to }] }
  // Linking the first box to a Database moves Postgres off it, for good.
  return ok(
    source.localDb &&
      (target.type === 'database' || target.type === 'pooler' || target.type === 'cache')
      ? patch(linked, from, { localDb: false })
      : linked,
  )
}

export const disconnect = (game: Game, from: string, to: string): Game => ({
  ...game,
  links: game.links.filter((link) => !(link.from === from && link.to === to)),
})

/* ---------- sizing and Stacks ---------- */

export const resize = (game: Game, id: string, direction: 1 | -1): Action =>
  withNode(game, id, (node) => {
    const def = COMPONENTS[node.type]
    const lowest = def.sized ? 0 : 1
    if (direction === -1) {
      if (node.size <= lowest) return notAllowed(`${def.name} is at its smallest size.`)
      return ok(patch(game, id, { size: node.size - 1, ...(def.sized ? restarted : {}) }))
    }
    const price = resizePrice(game, node)
    if (price === null || node.size >= maxSize(node))
      return notAllowed(`${def.name} is at its largest size.`)
    const label = def.sized
      ? `${SIZES[node.size + 1]?.name ?? 'Next size'}`
      : `Size ${node.size + 1}`
    return spend(game, price, label, (paid) =>
      patch(paid, id, { size: node.size + 1, ...(def.sized ? restarted : {}) }),
    )
  })

export const setFamily = (game: Game, id: string, family: FamilyId): Action =>
  withNode(game, id, (node) => {
    if (!COMPONENTS[node.type].sized) return notAllowed('Only VMs have an instance family.')
    if (node.family === family) return ok(game)
    return ok(
      patch(game, id, {
        family,
        ...restarted,
        credits: family === 'burstable' ? (CREDIT_CAP * vcpuOf(node)) / 2 : 0,
      }),
    )
  })

const defaultWorkers = (node: GameNode, runtime: RuntimeId): number =>
  runtime === 'gunicorn' ? 2 * Math.max(1, Math.round(vcpuOf(node))) + 1 : DEFAULT_FPM_WORKERS

export const setRuntime = (game: Game, id: string, runtime: RuntimeId): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'server') return notAllowed('Only App Servers run a Stack.')
    const def = RUNTIMES[runtime]
    if (!runtimeReady(game, runtime) && def.research)
      return no(Refusal.Locked({ what: def.name, research: RESEARCH[def.research].name }))
    if (node.runtime === runtime) return ok(game)
    const framework = FRAMEWORKS[node.framework].language === def.language ? node.framework : 'none'
    return ok(
      patch(game, id, {
        runtime,
        framework,
        workers: def.pool ? defaultWorkers(node, runtime) : node.workers,
        leak: 0,
        ...restarted,
      }),
    )
  })

export const setFramework = (game: Game, id: string, framework: FrameworkId): Action =>
  withNode(game, id, (node) => {
    const def = FRAMEWORKS[framework]
    const research = def.language ? RESEARCH[`fw-${framework}` as ResearchId] : undefined
    if (!frameworkReady(game, framework) && research)
      return no(Refusal.Locked({ what: def.name, research: research.name }))
    if (def.language !== null && def.language !== RUNTIMES[node.runtime].language)
      return notAllowed(`${def.name} needs ${LANGUAGES[def.language].name}.`)
    if (node.framework === framework) return ok(game)
    return ok(patch(game, id, { framework, ...restarted }))
  })

export const setWorkers = (game: Game, id: string, workers: number): Action =>
  withNode(game, id, (node) =>
    RUNTIMES[node.runtime].pool
      ? ok(
          patch(game, id, {
            workers: Math.round(Math.max(POOL_LIMITS.min, Math.min(POOL_LIMITS.max, workers))),
          }),
        )
      : notAllowed(`${RUNTIMES[node.runtime].name} sizes its own pool.`),
  )

export const setSample = (game: Game, id: string, sample: number): Action =>
  withNode(game, id, (node) =>
    node.type === 'analytics' && sample >= 0 && sample < SAMPLE_RATES.length
      ? ok(patch(game, id, { sample }))
      : notAllowed('Only Analytics has a sample rate.'),
  )

/* ---------- incidents ---------- */

/** Replaces a failed Node: it comes back cold after a restart. */
export const replace = (game: Game, id: string): Action =>
  withNode(game, id, (node) =>
    node.down !== -1
      ? notAllowed(`${COMPONENTS[node.type].name} has not failed.`)
      : spend(game, replacePrice(game, node), 'A replacement', (paid) =>
          patch(paid, id, restarted),
        ),
  )

/** Restarts an App Server: frees leaked memory, comes back cold. */
export const restart = (game: Game, id: string): Action =>
  withNode(game, id, (node) =>
    node.type !== 'server'
      ? notAllowed('Only App Servers restart.')
      : isDown(node)
        ? notAllowed('It is already down.')
        : ok(patch(game, id, { down: 1, warm: 0, leak: 0 })),
  )

export const filePostmortem = (game: Game, id: number): Action => {
  const postmortem = game.postmortems.find((entry) => entry.id === id)
  if (!postmortem) return no(Refusal.Missing())
  return ok({
    ...game,
    insight: game.insight + postmortem.reward,
    postmortems: game.postmortems.filter((entry) => entry.id !== id),
  })
}

/* ---------- research and money ---------- */

export const study = (game: Game, id: ResearchId): Action => {
  const entry = RESEARCH[id]
  if (has(game, id)) return notAllowed(`${entry.name} is already yours.`)
  if (entry.era > game.stage)
    return no(Refusal.TooEarly({ what: entry.name, era: ERAS[entry.era]?.name ?? 'a later Era' }))
  if (!researchReady(game, id)) {
    const missing = entry.requires.filter((needed) => !has(game, needed))
    return no(
      Refusal.Locked({
        what: entry.name,
        research: missing.map((needed) => RESEARCH[needed].name).join(' and '),
      }),
    )
  }
  if (game.insight < entry.cost)
    return no(Refusal.Unaffordable({ what: entry.name, price: entry.cost, currency: 'insight' }))
  return ok({ ...game, insight: game.insight - entry.cost, researched: [...game.researched, id] })
}

export const collect = (game: Game): Game => ({
  ...game,
  cash: game.cash + game.pending,
  pending: 0,
})

export const canRaise = (game: Game): boolean =>
  !isFinalEra(game) && game.users >= eraOf(game).raiseAt

const advanceEra = (game: Game, raised: boolean): Action => {
  if (!canRaise(game)) {
    const era = eraOf(game)
    return notAllowed(`Reach ${era.raiseAt.toLocaleString('en-US')} users first.`)
  }
  const era = eraOf(game)
  const stage = game.stage + 1
  return ok({
    ...game,
    stage,
    cash: game.cash + (raised ? era.grant : 0),
    equity: raised ? game.equity * (1 - era.dilution) : game.equity,
    declined: !raised,
    nextIncidentAt: stage === 1 ? game.time + FIRST_INCIDENT_AFTER : game.nextIncidentAt,
  })
}

/** Takes the round: a grant for Equity, and full growth in the next Era. */
export const raise = (game: Game): Action => advanceEra(game, true)

/** Declines the round: keeps Equity, no grant, and slower growth in the next Era. */
export const decline = (game: Game): Action => advanceEra(game, false)

export const offer = (game: Game) => {
  const next = nextEra(game)
  return next ? { era: next, grant: eraOf(game).grant, dilution: eraOf(game).dilution } : null
}
