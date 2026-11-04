import { RUNNING, warming, withWarm } from './life.ts'
import { Data, Result } from 'effect'
import {
  ALERT_THRESHOLDS,
  CACHE_TTLS,
  CDN_TTLS,
  COMPONENTS,
  PARANOIA,
  SCALE_MAXIMA,
  SCALE_TARGETS,
  STANDBY_TYPES,
  CHECK_INTERVALS,
  CREDIT_CAP,
  GOGC,
  DEFAULT_FPM_WORKERS,
  DNS_TTLS,
  ERAS,
  FIRST_INCIDENT_AFTER,
  FRAMEWORKS,
  KINDS,
  LANGUAGES,
  LB_POLICIES,
  MAX_ATTEMPTS,
  POOL_LIMITS,
  PREFETCH,
  QUEUE_LENGTHS,
  REQUEST_KINDS,
  RESEARCH,
  RUNTIMES,
  MAX_STUDIES,
  RETENTION_WINDOWS,
  SAMPLE_RATES,
  SIZES,
  type ComponentId,
  type FamilyId,
  type FrameworkId,
  type IncidentId,
  type Kind,
  type RequestKind,
  type ResearchId,
  type RuntimeId,
  HOME_REGION,
  OPEN_REGION_PRICE,
  QUORUM_N,
  REGION_INFO,
  REGIONS_FROM_STAGE,
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
  restarted,
  runtimeReady,
  vcpuOf,
} from './lookups.ts'
import { link } from './company.ts'
import { goGlobal, isGlobal, openRegions } from './regions.ts'
import {
  alumniOf,
  dilutionOf,
  grantOf,
  perkLevel,
  placeRefusal,
  runtimeRefusal,
  ventureOf,
} from './founding.ts'
import { startIncident, zoned } from './director.ts'
import { IPO_BURN_SECONDS, PRE_IPO_STAGE, ipoReady, newDrill } from './ipo.ts'
import { firstQuarter, guidanceOpen } from './quarters.ts'
import { solveFlow } from './solve.ts'
import type { AlertRule } from './events.ts'
import type {
  CacheEngine,
  Collector,
  Game,
  GpuType,
  GameLink,
  GameNode,
  LbPolicy,
  PmMode,
  PoolerMode,
  Retries,
  ScaleSignal,
  Zone,
  Region,
  Backup,
  Fanout,
} from './state.ts'

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
    readonly currency: 'cash'
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
    Unaffordable: ({ what, price }) =>
      `${what} costs $${Math.round(price).toLocaleString('en-US')}.`,
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

/* ---------- placing and removing ---------- */

export const blankNode = (
  game: Game,
  id: string,
  type: ComponentId,
  x: number,
  y: number,
  region: Region = HOME_REGION,
): GameNode => {
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
    sampleRate: 0.1,
    retention: 900,
    life: COMPONENTS[type].coldStart ? warming(0) : RUNNING,
    credits: 0,
    leak: 0,
    compress: stack?.compress ?? false,
    downAt: 0,
    policy: 'weighted',
    checkEvery: 10,
    deepCheck: false,
    ttl: type === 'cache' ? 60 : 300,
    engine: 'redis',
    pm: 'static',
    mode: 'transaction',
    depth: 0,
    dlq: false,
    attempts: 25,
    maxLength: 0,
    prefetch: 10,
    upgradedAt: game.time,
    coalesce: false,
    warming: false,
    paranoia: 2,
    underAttack: false,
    zone: 'a',
    standby: false,
    replicas: 1,
    pending: 0,
    readyIn: 0,
    scaledAt: 0,
    signal: 'cpu',
    target: 0.6,
    minCopies: 1,
    maxCopies: 8,
    gpu: 't4',
    collector: 'g1',
    gogc: 100,
    shed: false,
    ryw: false,
    region,
    n: 3,
    r: 1,
    w: 1,
    lost: 0,
    spread: false,
    backup: 'none',
    fanout: 'pull',
    split: false,
  }
}

export const place = (
  game: Game,
  type: ComponentId,
  x: number,
  y: number,
  region: Region = HOME_REGION,
): Action => {
  const def = COMPONENTS[type]
  if (def.fixed) return notAllowed(`${def.name} cannot be placed.`)
  if (!isUnlocked(game, type) && def.unlock)
    return no(Refusal.Locked({ what: def.name, research: RESEARCH[def.unlock].name }))
  const banned = placeRefusal(game, type, region)
  if (banned) return notAllowed(banned)
  if (!openRegions(game).includes(region)) return notAllowed('Open that region first.')
  const node = blankNode(game, `n${game.nextId}`, type, x, y, region)
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
const emitsOf = (node: GameNode): ReadonlyArray<Kind> => COMPONENTS[node.type].sends

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
  // App Servers and Workers link into an Autoscaler or a Cluster to come under it: one of each.
  if (targetDef.control) {
    if (source.type !== 'server' && source.type !== 'worker')
      return notAllowed(`Link App Servers or Workers into the ${targetDef.name}.`)
    const taken = game.links.some(
      (entry) =>
        entry.from === from &&
        game.nodes.some((node) => node.id === entry.to && node.type === target.type),
    )
    if (taken) return notAllowed(`${sourceDef.name} already has a ${targetDef.name}.`)
    return ok({ ...game, links: [...game.links, link(from, to)] })
  }
  if (targetDef.tap) {
    if (sourceDef.tap || source.type === 'payments')
      return notAllowed(`${sourceDef.name} has no traffic to sample.`)
    return ok({ ...game, links: [...game.links, link(from, to)] })
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
  const linked: Game = { ...game, links: [...game.links, link(from, to)] }
  // Linking the first box to a Database moves Postgres off it, for good.
  return ok(
    source.localDb &&
      (target.type === 'database' || target.type === 'pooler' || target.type === 'cache')
      ? patch(linked, from, { localDb: false })
      : linked,
  )
}

/** Timeouts a Link can wait, in seconds. */
export const LINK_TIMEOUTS = [1, 5, 30] as const

/** Sets a Link's timeout or retry policy. Needs Timeouts and retries. */
export const setLinkPolicy = (
  game: Game,
  from: string,
  to: string,
  change: Readonly<{ timeout?: number; retries?: Retries; breaker?: boolean }>,
): Action => {
  const index = game.links.findIndex((entry) => entry.from === from && entry.to === to)
  const current = game.links[index]
  if (!current) return no(Refusal.Missing())
  if (!has(game, 'timeouts'))
    return no(Refusal.Locked({ what: 'Call policy', research: RESEARCH.timeouts.name }))
  if (change.retries === 'backoff' && !has(game, 'backoff-jitter'))
    return no(Refusal.Locked({ what: 'Backoff', research: RESEARCH['backoff-jitter'].name }))
  if (change.breaker && !has(game, 'circuit-breakers'))
    return no(
      Refusal.Locked({ what: 'A circuit breaker', research: RESEARCH['circuit-breakers'].name }),
    )
  if (
    change.timeout !== undefined &&
    !(LINK_TIMEOUTS as ReadonlyArray<number>).includes(change.timeout)
  )
    return notAllowed('A timeout is 1, 5, or 30 seconds.')
  // A new retry policy or breaker starts fresh.
  const next = {
    ...current,
    ...change,
    failure: 0,
    open: change.breaker === false ? 0 : current.open,
  }
  return ok({ ...game, links: game.links.map((entry, at) => (at === index ? next : entry)) })
}

/** Sets the request kinds a Load Balancer Link carries, or null for all of them. */
export const setLinkKinds = (
  game: Game,
  from: string,
  to: string,
  kinds: ReadonlyArray<RequestKind> | null,
): Action => {
  const index = game.links.findIndex((entry) => entry.from === from && entry.to === to)
  const current = game.links[index]
  const source = game.nodes.find((node) => node.id === from)
  if (!current || !source) return no(Refusal.Missing())
  if (source.type !== 'lb') return notAllowed('Only a Load Balancer routes by request kind.')
  const next = { ...current, kinds: kinds && REQUEST_KINDS.filter((kind) => kinds.includes(kind)) }
  return ok({ ...game, links: game.links.map((entry, at) => (at === index ? next : entry)) })
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
      return ok(patch(game, id, { size: node.size - 1, ...(def.sized ? restarted(node) : {}) }))
    }
    const price = resizePrice(game, node)
    if (price === null || node.size >= maxSize(node))
      return notAllowed(`${def.name} is at its largest size.`)
    const label = def.sized
      ? `${SIZES[node.size + 1]?.name ?? 'Next size'}`
      : `Size ${node.size + 1}`
    return spend(game, price, label, (paid) =>
      patch(paid, id, { size: node.size + 1, ...(def.sized ? restarted(node) : {}) }),
    )
  })

export const setFamily = (game: Game, id: string, family: FamilyId): Action =>
  withNode(game, id, (node) => {
    if (!COMPONENTS[node.type].sized) return notAllowed('Only VMs have an instance family.')
    if (node.family === family) return ok(game)
    return ok(
      patch(game, id, {
        family,
        ...restarted(node),
        credits: family === 'burstable' ? (CREDIT_CAP * vcpuOf(node)) / 2 : 0,
      }),
    )
  })

const defaultWorkers = (node: GameNode, runtime: RuntimeId): number =>
  runtime === 'gunicorn' ? 2 * Math.max(1, Math.round(vcpuOf(node))) + 1 : DEFAULT_FPM_WORKERS

export const setRuntime = (game: Game, id: string, runtime: RuntimeId): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'server' && node.type !== 'worker')
      return notAllowed('Only App Servers and Workers run a Stack.')
    const def = RUNTIMES[runtime]
    if (!runtimeReady(game, runtime) && def.research)
      return no(Refusal.Locked({ what: def.name, research: RESEARCH[def.research].name }))
    const banned = runtimeRefusal(game, runtime)
    if (banned) return notAllowed(banned)
    if (node.runtime === runtime) return ok(game)
    const framework = FRAMEWORKS[node.framework].language === def.language ? node.framework : 'none'
    return ok(
      patch(game, id, {
        runtime,
        framework,
        workers: def.pool ? defaultWorkers(node, runtime) : node.workers,
        leak: 0,
        ...restarted({ ...node, runtime }),
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
    return ok(patch(game, id, { framework, ...restarted(node) }))
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

/** Turns gzip on or off for an App Server's page and read responses. Needs Compression. */
export const setCompression = (game: Game, id: string, compress: boolean): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'server') return notAllowed('Only App Servers compress responses.')
    if (!has(game, 'gzip'))
      return no(Refusal.Locked({ what: 'Gzip', research: RESEARCH.gzip.name }))
    return ok(node.compress === compress ? game : patch(game, id, { compress }))
  })

/** Chooses how a Load Balancer splits traffic. Least connections and two choices need research. */
export const setPolicy = (game: Game, id: string, policy: LbPolicy): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'lb') return notAllowed('Only a Load Balancer has a policy.')
    const research = LB_POLICIES[policy].research
    if (research && !has(game, research))
      return no(
        Refusal.Locked({ what: LB_POLICIES[policy].label, research: RESEARCH[research].name }),
      )
    return ok(patch(game, id, { policy }))
  })

/** Sets a Load Balancer's health checks. Intervals other than 10 s and deep checks need Health checks. */
export const setHealthCheck = (
  game: Game,
  id: string,
  change: Readonly<{ checkEvery?: number; deepCheck?: boolean }>,
): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'lb') return notAllowed('Only a Load Balancer runs health checks.')
    if (
      change.checkEvery !== undefined &&
      !(CHECK_INTERVALS as ReadonlyArray<number>).includes(change.checkEvery)
    )
      return notAllowed('A health check runs every 2, 10, or 30 seconds.')
    const tuned = (change.checkEvery ?? 10) !== 10 || change.deepCheck === true
    if (tuned && !has(game, 'health-checks'))
      return no(Refusal.Locked({ what: 'Health checks', research: RESEARCH['health-checks'].name }))
    return ok(patch(game, id, change))
  })

/** Sets a Cache's TTL, or the DNS TTL. DNS needs Health checks, which make it drop dead hosts. */
export const setTtl = (game: Game, id: string, ttl: number): Action =>
  withNode(game, id, (node) => {
    if (node.type === 'cache')
      return CACHE_TTLS.some((entry) => entry.ttl === ttl)
        ? ok(patch(game, id, { ttl }))
        : notAllowed('A cache TTL is 10 seconds, 1 minute, or 1 hour.')
    if (node.type === 'cdn')
      return CDN_TTLS.some((entry) => entry.ttl === ttl)
        ? ok(patch(game, id, { ttl }))
        : notAllowed('A CDN TTL is 1 minute, 5 minutes, or 1 hour.')
    if (node.type !== 'dns') return notAllowed('Only DNS, CDNs and Caches have a TTL.')
    if (!(DNS_TTLS as ReadonlyArray<number>).includes(ttl))
      return notAllowed('A TTL is 30 seconds, 5 minutes, or 1 hour.')
    if (!has(game, 'health-checks'))
      return no(Refusal.Locked({ what: 'TTL', research: RESEARCH['health-checks'].name }))
    return ok(patch(game, id, { ttl }))
  })

/** Sets PHP-FPM's process manager. */
export const setPm = (game: Game, id: string, pm: PmMode): Action =>
  withNode(game, id, (node) =>
    (node.type === 'server' || node.type === 'worker') && node.runtime === 'php_fpm'
      ? ok(node.pm === pm ? game : patch(game, id, { pm }))
      : notAllowed('Only PHP-FPM has a process manager.'),
  )

/** Sets a Connection Pooler's mode: session holds a server connection per client, transaction shares a few. */
export const setPoolerMode = (game: Game, id: string, mode: PoolerMode): Action =>
  withNode(game, id, (node) =>
    node.type === 'pooler'
      ? ok(node.mode === mode ? game : patch(game, id, { mode }))
      : notAllowed('Only a Connection Pooler has a mode.'),
  )

/** Swaps a Cache's engine. The new one starts empty. */
export const setCacheEngine = (game: Game, id: string, engine: CacheEngine): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'cache') return notAllowed('Only a Cache has an engine.')
    return ok(
      node.engine === engine ? game : patch(game, id, { engine, life: withWarm(node.life, 0) }),
    )
  })

/** Turns a Cache's stampede protection or warming on or off. Each needs its research. */
export const setCacheGuard = (
  game: Game,
  id: string,
  change: Readonly<{ coalesce?: boolean; warming?: boolean }>,
): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'cache') return notAllowed('Only a Cache has stampede guards.')
    if (change.coalesce && !has(game, 'stampede-protection'))
      return no(
        Refusal.Locked({ what: 'Coalescing', research: RESEARCH['stampede-protection'].name }),
      )
    if (change.warming && !has(game, 'cache-warming'))
      return no(Refusal.Locked({ what: 'Warming', research: RESEARCH['cache-warming'].name }))
    return ok(patch(game, id, change))
  })

/** Turns a Queue's dead-letter queue on or off. */
export const setDlq = (game: Game, id: string, dlq: boolean): Action =>
  withNode(game, id, (node) =>
    node.type === 'queue'
      ? ok(node.dlq === dlq ? game : patch(game, id, { dlq }))
      : notAllowed('Only a Queue has a dead-letter queue.'),
  )

/** Sets the attempts a Queue's dead-letter queue allows a task. */
export const setAttempts = (game: Game, id: string, attempts: number): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'queue') return notAllowed('Only a Queue retries tasks.')
    if (!(MAX_ATTEMPTS as ReadonlyArray<number>).includes(attempts))
      return notAllowed(`Max attempts are ${MAX_ATTEMPTS.join(', ')}.`)
    return ok(node.attempts === attempts ? game : patch(game, id, { attempts }))
  })

/** Sets the most tasks a Queue holds before it refuses new ones; 0 means no limit. */
export const setMaxLength = (game: Game, id: string, maxLength: number): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'queue') return notAllowed('Only a Queue has a max length.')
    if (!(QUEUE_LENGTHS as ReadonlyArray<number>).includes(maxLength))
      return notAllowed('That max length is not on offer.')
    return ok(
      node.maxLength === maxLength
        ? game
        : patch(game, id, {
            maxLength,
            depth: maxLength > 0 ? Math.min(node.depth, maxLength) : node.depth,
          }),
    )
  })

/** Sets how many tasks each Worker process takes from its Queue ahead of time. */
export const setPrefetch = (game: Game, id: string, prefetch: number): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'worker') return notAllowed('Only a Worker prefetches tasks.')
    if (!(PREFETCH as ReadonlyArray<number>).includes(prefetch))
      return notAllowed(`Prefetch is ${PREFETCH.join(', ')}.`)
    return ok(node.prefetch === prefetch ? game : patch(game, id, { prefetch }))
  })

/** Sets a WAF's paranoia level, 1 to 4. */
export const setParanoia = (game: Game, id: string, paranoia: number): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'waf') return notAllowed('Only a WAF has a paranoia level.')
    if (!PARANOIA.some((entry) => entry.level === paranoia))
      return notAllowed('Paranoia runs from 1 to 4.')
    return ok(node.paranoia === paranoia ? game : patch(game, id, { paranoia }))
  })

/** Turns a WAF's Under attack mode on or off: it challenges every request. */
export const setUnderAttack = (game: Game, id: string, underAttack: boolean): Action =>
  withNode(game, id, (node) =>
    node.type === 'waf'
      ? ok(node.underAttack === underAttack ? game : patch(game, id, { underAttack }))
      : notAllowed('Only a WAF has Under attack mode.'),
  )

/** Moves a Node to another zone. Needs Multiple zones; a sized Node restarts there. */
export const setZone = (game: Game, id: string, zone: Zone): Action =>
  withNode(game, id, (node) => {
    if (!has(game, 'multi-az'))
      return no(Refusal.Locked({ what: 'Zones', research: RESEARCH['multi-az'].name }))
    if (!zoned(node)) return notAllowed(`${COMPONENTS[node.type].name} spans every zone.`)
    if (node.zone === zone) return ok(game)
    return ok(
      patch(game, id, {
        zone,
        ...(COMPONENTS[node.type].sized && !isDown(node) ? restarted(node) : {}),
      }),
    )
  })

/** Gives a data Node a standby in another zone, at twice the Burn. Needs Multiple zones. */
export const setStandby = (game: Game, id: string, standby: boolean): Action =>
  withNode(game, id, (node) => {
    if (!STANDBY_TYPES.includes(node.type))
      return notAllowed('Only a Database, Pooler, Cache, Search Engine, or Queue keeps a standby.')
    if (standby && !has(game, 'multi-az'))
      return no(Refusal.Locked({ what: 'A standby', research: RESEARCH['multi-az'].name }))
    return ok(node.standby === standby ? game : patch(game, id, { standby }))
  })

/** Sets an Autoscaler's signal, target, and copy limits. */
export const setAutoscaler = (
  game: Game,
  id: string,
  change: Readonly<{
    signal?: ScaleSignal
    target?: number
    minCopies?: number
    maxCopies?: number
  }>,
): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'autoscaler') return notAllowed('Only an Autoscaler scales.')
    if (
      change.target !== undefined &&
      !(SCALE_TARGETS as ReadonlyArray<number>).includes(change.target)
    )
      return notAllowed('A target is 40%, 60%, or 80%.')
    if (
      change.maxCopies !== undefined &&
      !(SCALE_MAXIMA as ReadonlyArray<number>).includes(change.maxCopies)
    )
      return notAllowed('A max is 4, 8, 16, or none.')
    const minCopies = change.minCopies ?? node.minCopies
    const maxCopies = change.maxCopies ?? node.maxCopies
    if (minCopies < 1 || minCopies > 16 || !Number.isInteger(minCopies))
      return notAllowed('A min is 1 to 16 copies.')
    if (maxCopies > 0 && minCopies > maxCopies) return notAllowed('The min is above the max.')
    return ok(patch(game, id, change))
  })

/** Picks a GPU Node's GPU type. H100s cannot be had during a GPU shortage. */
export const setGpuType = (game: Game, id: string, gpu: GpuType): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'gpu') return notAllowed('Only a GPU Node has a GPU type.')
    if (node.gpu === gpu) return ok(game)
    if (gpu === 'h100' && game.incident?.kind === 'gpu-shortage')
      return notAllowed('No H100 capacity this month.')
    return ok(patch(game, id, { gpu, ...restarted(node) }))
  })

/** Picks a Java App Server's collector. ZGC needs its research. */
export const setCollector = (game: Game, id: string, collector: Collector): Action =>
  withNode(game, id, (node) => {
    if (RUNTIMES[node.runtime].language !== 'java')
      return notAllowed('Only Java runs a choice of collector.')
    if (collector === 'zgc' && !has(game, 'zgc'))
      return no(Refusal.Locked({ what: 'ZGC', research: RESEARCH.zgc.name }))
    if (node.collector === collector) return ok(game)
    return ok(patch(game, id, { collector, ...restarted(node) }))
  })

/** Sets a Go App Server's GOGC: 50, 100 or 200. Needs Go GC tuning. */
export const setGogc = (game: Game, id: string, gogc: number): Action =>
  withNode(game, id, (node) => {
    if (RUNTIMES[node.runtime].language !== 'go') return notAllowed('Only Go has GOGC.')
    if (!has(game, 'gogc-tuning'))
      return no(Refusal.Locked({ what: 'GOGC', research: RESEARCH['gogc-tuning'].name }))
    if (!GOGC.some((entry) => entry.gogc === gogc)) return notAllowed('GOGC is 50, 100 or 200.')
    return ok(node.gogc === gogc ? game : patch(game, id, { gogc }))
  })

/** Turns an App Server's load shedding on or off. Needs Priority load shedding. */
export const setShed = (game: Game, id: string, shed: boolean): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'server') return notAllowed('Only App Servers shed load.')
    if (shed && !has(game, 'load-shedding'))
      return no(Refusal.Locked({ what: 'Load shedding', research: RESEARCH['load-shedding'].name }))
    return ok(node.shed === shed ? game : patch(game, id, { shed }))
  })

/** Turns an App Server's read-your-writes routing on or off. */
export const setRyw = (game: Game, id: string, ryw: boolean): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'server') return notAllowed('Only App Servers route reads.')
    if (ryw && !has(game, 'ryw-routing'))
      return no(
        Refusal.Locked({ what: 'Read-your-writes', research: RESEARCH['ryw-routing'].name }),
      )
    return ok(node.ryw === ryw ? game : patch(game, id, { ryw }))
  })

/* ---------- regions (docs/adr/0005) ---------- */

/** Opens a region: its own Users Node, and a tab on the board. Needs Multiple regions. */
export const openRegion = (game: Game, region: Region): Action => {
  if (!has(game, 'multi-region'))
    return no(Refusal.Locked({ what: 'Regions', research: RESEARCH['multi-region'].name }))
  if (openRegions(game).includes(region)) return notAllowed('That region is open.')
  const home = game.nodes.find((node) => node.type === 'users')
  const id = `users-${region}`
  const users: GameNode = {
    ...blankNode(game, id, 'users', home?.x ?? 80, home?.y ?? 280, region),
    life: RUNNING,
  }
  return spend(
    game,
    game.sandbox ? 0 : Math.round(OPEN_REGION_PRICE * eraOf(game).costIndex),
    REGION_INFO[region].name,
    (paid) => ({ ...paid, nodes: [...paid.nodes, users] }),
  )
}

/** Moves a Node to another open region. It restarts there. */
export const setRegion = (game: Game, id: string, region: Region): Action =>
  withNode(game, id, (node) => {
    if (COMPONENTS[node.type].fixed || isGlobal(node))
      return notAllowed(`${COMPONENTS[node.type].name} serves every region.`)
    if (!openRegions(game).includes(region)) return notAllowed('Open that region first.')
    if (node.region === region) return ok(game)
    return ok(
      patch(game, id, {
        region,
        ...(COMPONENTS[node.type].sized && !isDown(node) ? restarted(node) : {}),
      }),
    )
  })

/** Sets a Wide-column Store's N, R and W (07 "Wide-column Store"). */
export const setQuorum = (game: Game, id: string, n: number, r: number, w: number): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'wide') return notAllowed('Only a Wide-column Store has quorums.')
    if (!QUORUM_N.some((entry) => entry === n) || r < 1 || w < 1 || r > n || w > n)
      return notAllowed('R and W are between 1 and N; N is 1 to 5.')
    return ok(patch(game, id, { n, r, w }))
  })

/** Spreads a Wide-column Store or Distributed SQL Node across the open regions. */
export const setSpread = (game: Game, id: string, spread: boolean): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'wide' && node.type !== 'dsql')
      return notAllowed('Only a Wide-column Store or Distributed SQL spreads across regions.')
    if (spread && openRegions(game).length < 2) return notAllowed('Open a second region first.')
    return ok(node.spread === spread ? game : patch(game, id, { spread }))
  })

/** Sets a Database's backups. Needs Point-in-time recovery. */
export const setBackup = (game: Game, id: string, backup: Backup): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'database') return notAllowed('Only a Database keeps backups.')
    if (backup !== 'none' && !has(game, 'pitr'))
      return no(Refusal.Locked({ what: 'Backups', research: RESEARCH.pitr.name }))
    return ok(node.backup === backup ? game : patch(game, id, { backup }))
  })

/** Pull or push feeds on an App Server (07 "Fan-out"). */
export const setFanout = (game: Game, id: string, fanout: Fanout): Action =>
  withNode(game, id, (node) =>
    node.type !== 'server'
      ? notAllowed('Only App Servers build feeds.')
      : ok(node.fanout === fanout ? game : patch(game, id, { fanout })),
  )

/** Splits hot keys across a Cache's or Wide-column Store's shards. Needs Hybrid fan-out. */
export const setSplit = (game: Game, id: string, split: boolean): Action =>
  withNode(game, id, (node) => {
    if (node.type !== 'cache' && node.type !== 'wide')
      return notAllowed('Only a Cache or Wide-column Store splits keys.')
    if (split && !has(game, 'hybrid-fanout'))
      return no(Refusal.Locked({ what: 'Key splitting', research: RESEARCH['hybrid-fanout'].name }))
    return ok(node.split === split ? game : patch(game, id, { split }))
  })

/** Rolls back the routing change that withdrew the Company from the internet. */
export const rollBackRoutes = (game: Game): Action =>
  endIncident(game, 'bgp', 'No routing change to roll back.')

/** Rolls back the config push that crashed the servers: they restart on the old config. */
export const rollBackConfig = (game: Game): Action =>
  endIncident(game, 'config', 'No config push to roll back.')

/** Fences the old leader: the partition's writes stop diverging. */
export const fenceLeader = (game: Game): Action =>
  endIncident(game, 'partition', 'No partition to fence.')

/** Runs the DR drill: the home region fails for a minute (10 "Era 6"). Needs Disaster recovery drills. */
export const runDrill = (game: Game): Action => {
  if (!has(game, 'dr-drills'))
    return no(Refusal.Locked({ what: 'The DR drill', research: RESEARCH['dr-drills'].name }))
  if (game.incident) return notAllowed('Wait for the incident to end.')
  if (game.drill && !game.drill.done) return notAllowed('A drill is running.')
  const ledger = solveFlow(game)
  const started = startIncident(game, ledger, 'dr-drill', 0)
  if (!started) return notAllowed('Nothing runs in the home region.')
  return ok({ ...started.game, drill: newDrill(game, ledger) })
}

/** Sets the quarter's guidance, on its first calendar day. */
export const setGuidance = (game: Game, growth: number, margin: number): Action => {
  if (!game.quarter) return notAllowed('Guidance starts after the IPO.')
  if (!guidanceOpen(game)) return notAllowed('Guidance is set on the first day of a quarter.')
  if (![0, 1, 2].includes(growth) || ![0, 1, 2].includes(margin))
    return notAllowed('Pick a level for each.')
  return ok({ ...game, quarter: { ...game.quarter, growth, margin } })
}

/** Ends an incident that one action ends. */
const endIncident = (game: Game, kind: IncidentId, refusal: string): Action =>
  game.incident?.kind === kind
    ? ok({ ...game, incident: { ...game.incident, remaining: 0 } })
    : notAllowed(refusal)

/** Disables the WAF rule that backtracks. */
export const disableRule = (game: Game): Action =>
  endIncident(game, 'regex', 'No WAF rule is backtracking.')

/** Cancels the report that is scanning the primary. */
export const cancelReport = (game: Game): Action =>
  endIncident(game, 'report-db', 'No report is scanning the Database.')

/** Expands a full Database volume: writes come back. Costs what a replacement would. */
export const expandVolume = (game: Game): Action => {
  const target = game.nodes.find((node) => node.id === game.incident?.nodeId)
  if (game.incident?.kind !== 'disk-full' || !target) return notAllowed('No disk is full.')
  return spend(game, replacePrice(game, target), 'A bigger volume', (paid) =>
    paid.incident ? { ...paid, incident: { ...paid.incident, remaining: 0 } } : paid,
  )
}

/** Renews an expired certificate: the site comes back. */
export const renewCertificate = (game: Game): Action =>
  game.incident?.kind === 'certificate'
    ? ok({ ...game, incident: { ...game.incident, remaining: 0 } })
    : notAllowed('No certificate has expired.')

/** Deletes the poison message: the Workers get back to the queue. */
export const deleteMessage = (game: Game): Action =>
  game.incident?.kind === 'poison'
    ? ok({ ...game, incident: { ...game.incident, remaining: 0 } })
    : notAllowed('No poison message is stuck.')

/** Sets an alert rule's threshold. A new threshold is a fresh start: its false alarms are forgiven. */
export const setAlertRule = (game: Game, rule: AlertRule, threshold: number): Action => {
  if (!has(game, 'alerting'))
    return no(Refusal.Locked({ what: 'Alert rules', research: RESEARCH.alerting.name }))
  if (!(ALERT_THRESHOLDS[rule] as ReadonlyArray<number>).includes(threshold))
    return notAllowed('That threshold is not on offer.')
  if (game.alertRules[rule] === threshold) return ok(game)
  return ok({
    ...game,
    alertRules: { ...game.alertRules, [rule]: threshold },
    falseAlarms: { ...game.falseAlarms, [rule]: 0 },
  })
}

export const setSample = (game: Game, id: string, sampleRate: number): Action =>
  withNode(game, id, (node) =>
    node.type === 'analytics' && (SAMPLE_RATES as ReadonlyArray<number>).includes(sampleRate)
      ? ok(patch(game, id, { sampleRate }))
      : notAllowed('Only Analytics has a sample rate.'),
  )

/** How long Analytics keeps traces (12 "Retention"). */
export const setRetention = (game: Game, id: string, retention: number): Action =>
  withNode(game, id, (node) =>
    node.type === 'analytics' && (RETENTION_WINDOWS as ReadonlyArray<number>).includes(retention)
      ? ok(patch(game, id, { retention }))
      : notAllowed('Only Analytics keeps traces.'),
  )

/* ---------- incidents ---------- */

/** Replaces a failed Node: it comes back cold after a restart. */
export const replace = (game: Game, id: string): Action =>
  withNode(game, id, (node) =>
    node.life._tag !== 'Stopped'
      ? notAllowed(`${COMPONENTS[node.type].name} has not failed.`)
      : spend(game, replacePrice(game, node), 'A replacement', (paid) =>
          patch(paid, id, restarted(node)),
        ),
  )

/** Restarts an App Server: frees leaked memory, comes back cold. */
export const restart = (game: Game, id: string): Action =>
  withNode(game, id, (node) =>
    node.type !== 'server' && node.type !== 'worker'
      ? notAllowed('Only App Servers restart.')
      : isDown(node)
        ? notAllowed('It is already down.')
        : ok(patch(game, id, { ...restarted(node), leak: 0 })),
  )

/**
 * Files a postmortem. Taking its action item researches the prevention at its
 * normal price. Filing without it leaves the item open, and the incident it
 * prevents stays twice as likely until the research is owned.
 */
export const filePostmortem = (game: Game, id: number, take: boolean): Action => {
  const postmortem = game.postmortems.find((entry) => entry.id === id)
  if (!postmortem) return no(Refusal.Missing())
  const filed: Game = {
    ...game,
    postmortems: game.postmortems.filter((entry) => entry.id !== id),
  }
  const action = postmortem.action
  if (!take || !action || has(game, action)) return ok(filed)
  return study(filed, action, true)
}

/* ---------- research and money ---------- */

/**
 * Queues an item's Study (10 "Studies"): at the end, or first so it runs now.
 * A queued item put first keeps its progress.
 */
export const study = (game: Game, id: ResearchId, first = false): Action => {
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
  const queued = game.studies.find((item) => item.id === id)
  if (queued) {
    if (!first) return notAllowed(`${entry.name} is in the queue.`)
    return ok({ ...game, studies: [queued, ...game.studies.filter((item) => item.id !== id)] })
  }
  if (game.studies.length >= MAX_STUDIES)
    return notAllowed(`The queue holds ${MAX_STUDIES} Studies.`)
  const added = { id, progress: 0 }
  return ok({ ...game, studies: first ? [added, ...game.studies] : [...game.studies, added] })
}

/** Moves a queued Study up or down. The first one runs. */
export const moveStudy = (game: Game, id: ResearchId, direction: 1 | -1): Action => {
  const index = game.studies.findIndex((item) => item.id === id)
  if (index === -1) return no(Refusal.Missing())
  const to = index + direction
  if (to < 0 || to >= game.studies.length) return ok(game)
  const studies = [...game.studies]
  const [item] = studies.splice(index, 1)
  if (item) studies.splice(to, 0, item)
  return ok({ ...game, studies })
}

/** Takes a Study off the queue. Its progress and the Insight it took are lost, and its Spike ends. */
export const cancelStudy = (game: Game, id: ResearchId): Action =>
  game.studies.some((item) => item.id === id)
    ? ok({
        ...game,
        studies: game.studies.filter((item) => item.id !== id),
        backlog: game.backlog.filter((item) => !(item.kind === 'spike' && item.ref === id)),
      })
    : no(Refusal.Missing())

export const collect = (game: Game): Game => ({
  ...game,
  cash: game.cash + game.pending,
  pending: 0,
})

export const canRaise = (game: Game): boolean =>
  !game.sandbox &&
  !isFinalEra(game) &&
  game.users >= eraOf(game).raiseAt &&
  (game.stage !== PRE_IPO_STAGE || ipoReady(game, solveFlow(game)))

const advanceEra = (game: Game, raised: boolean, firstIncidentAfter: number): Action => {
  if (!canRaise(game)) {
    const era = eraOf(game)
    return notAllowed(
      game.stage === PRE_IPO_STAGE && game.users >= era.raiseAt
        ? 'Complete the IPO checklist first.'
        : `Reach ${era.raiseAt.toLocaleString('en-US')} users first.`,
    )
  }
  const era = eraOf(game)
  const stage = game.stage + 1
  const bootstrapped = ventureOf(game).bootstrapped
  if (raised && bootstrapped && game.stage !== PRE_IPO_STAGE)
    return notAllowed('A bootstrapped Company takes no rounds.')
  const dilution = bootstrapped ? 0 : dilutionOf(game, era.dilution)
  // The IPO: no declining it, a grant of Burn, and quarters from now on.
  if (game.stage === PRE_IPO_STAGE) {
    if (!raised) return notAllowed('The IPO cannot be declined.')
    const ledger = solveFlow(game)
    return ok({
      ...game,
      stage,
      cash: game.cash + ledger.burn * IPO_BURN_SECONDS,
      equity: game.equity * (1 - dilution),
      declined: false,
      quarter: firstQuarter(game, ledger.revenue),
    })
  }
  // Alumni network: former colleagues join when hiring opens.
  const alumni = stage === 1 ? alumniOf(game, perkLevel(game, 'alumni-network')) : []
  return ok({
    // Users abroad arrive with the regions (04 "Going global").
    ...(stage === REGIONS_FROM_STAGE ? goGlobal(game) : game),
    stage,
    cash: game.cash + (raised ? grantOf(game, era.grant) : 0),
    equity: raised ? game.equity * (1 - dilution) : game.equity,
    // A bootstrapped Company declines every round, and grows at the full rate.
    declined: !raised && !bootstrapped,
    nextIncidentAt: stage === 1 ? game.time + firstIncidentAfter : game.nextIncidentAt,
    engineers: alumni.length > 0 ? [...game.engineers, ...alumni] : game.engineers,
    workSeq: game.workSeq + alumni.length,
  })
}

/** Takes the round: a grant for Equity, and full growth in the next Era. */
export const raise = (game: Game, firstIncidentAfter = FIRST_INCIDENT_AFTER): Action =>
  advanceEra(game, true, firstIncidentAfter)

/** Declines the round: keeps Equity, no grant, and slower growth in the next Era. */
export const decline = (game: Game, firstIncidentAfter = FIRST_INCIDENT_AFTER): Action =>
  advanceEra(game, false, firstIncidentAfter)

export const offer = (game: Game) => {
  const next = nextEra(game)
  if (!next) return null
  // The IPO pays a thousand seconds of Burn (plan 5.19).
  const grant =
    game.stage === PRE_IPO_STAGE
      ? solveFlow(game).burn * IPO_BURN_SECONDS
      : grantOf(game, eraOf(game).grant)
  const dilution = ventureOf(game).bootstrapped ? 0 : dilutionOf(game, eraOf(game).dilution)
  return { era: next, grant, dilution, bootstrapped: ventureOf(game).bootstrapped }
}
