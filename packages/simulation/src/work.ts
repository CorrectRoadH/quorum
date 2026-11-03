import { Result } from 'effect'
import {
  COMPONENTS,
  ERAS,
  type ComponentId,
  FEATURES,
  FEATURE_IDS,
  FIXES,
  HOTFIX_DEBT,
  KLOC_PER_DH,
  LIVE_TUNING,
  MIGRATION_FEATURE_SPEED,
  POLICIES,
  REFACTOR_PER_DH,
  RESEARCH,
  type ResearchId,
  STRUCTURED_DEBT,
  TASKS,
  UNSTRUCTURED_DEBT,
  type FeatureId,
  type FixId,
  type FrameworkId,
  type PolicyId,
  type RuntimeId,
  type TaskId,
  type Tuning,
} from './catalog.ts'
import { Refusal, setFramework, setRuntime, type Action } from './actions.ts'
import { startIncident } from './director.ts'
import { StepEvent } from './events.ts'
import type { Ledger } from './ledger.ts'
import { has } from './lookups.ts'
import {
  bugsFixed,
  cancelMigration,
  shiftMigration,
  startMigration,
  targetOf,
} from './migration.ts'
import { nextRandom } from './random.ts'
import type { Game, WorkItem } from './state.ts'
import {
  badDeployChance,
  deployEvery,
  enqueue,
  hireSeconds,
  languageOfService,
  moraleSeconds,
  policyNow,
  serviceOf,
  signingOf,
  stackOf,
  structured,
  teamOutputs,
  withService,
} from './team.ts'

/* ==========================================================================
   Work (08): the backlog, the Team, and deploys. Each team builds the first
   backlog item no team ahead of it has; Dev Hours with nothing to build go
   to the pool, which can rush any item. Built Features wait for the next
   deploy. With the autopilot on, an idle team picks the next Feature itself,
   so a player who never opens the Team panel still ships.
   ========================================================================== */

const ok = (game: Game): Action => Result.succeed(game)
const no = (refusal: Refusal): Action => Result.fail(refusal)
const notAllowed = (reason: string): Action => no(Refusal.NotAllowed({ reason }))

const SANDBOX = 'A Sandbox has no Team.'
/** Teams the player can run in the slice. */
export const MAX_TEAMS = 4
/** The autopilot refactors once debt reaches this. */
const AUTO_REFACTOR = 0.3

/** What a backlog item is called. */
export const itemName = (item: WorkItem): string => {
  if (item.kind === 'feature') return FEATURES[item.ref as FeatureId]?.name ?? item.ref
  if (item.kind === 'task') return TASKS[item.ref as TaskId]?.name ?? item.ref
  if (item.kind === 'patch')
    return `Patch ${COMPONENTS[item.target as ComponentId]?.name ?? 'Design'}`
  if (item.kind === 'spike') return `Spike: ${RESEARCH[item.ref as ResearchId]?.name ?? item.ref}`
  return `Migration step ${item.ref.slice(5)}`
}

const queued = (game: Game, ref: string): boolean => game.backlog.some((item) => item.ref === ref)

/** Features the Company has, has built, or has queued. */
const planned = (game: Game, id: FeatureId): boolean =>
  game.shipped.includes(id) || game.awaiting.includes(id) || queued(game, id)

/* ---------- what can be queued ---------- */

export const featureRefusal = (game: Game, id: FeatureId): Refusal | null => {
  const def = FEATURES[id]
  if (game.sandbox) return Refusal.NotAllowed({ reason: SANDBOX })
  if (game.shipped.includes(id)) return Refusal.NotAllowed({ reason: `${def.name} is live.` })
  if (game.awaiting.includes(id))
    return Refusal.NotAllowed({ reason: `${def.name} waits for the next deploy.` })
  if (queued(game, id)) return Refusal.NotAllowed({ reason: `${def.name} is on the backlog.` })
  if (def.era > game.stage)
    return Refusal.TooEarly({ what: def.name, era: ERAS[def.era]?.name ?? 'a later Era' })
  if (def.research && !has(game, def.research))
    return Refusal.Locked({ what: def.name, research: RESEARCH[def.research].name })
  const missing = def.requires.filter((needed) => !planned(game, needed))
  if (missing.length > 0)
    return Refusal.NotAllowed({
      reason: `${def.name} needs ${missing.map((needed) => FEATURES[needed].name).join(' and ')}.`,
    })
  return null
}

export const taskRefusal = (game: Game, id: TaskId): Refusal | null => {
  const def = TASKS[id]
  if (game.sandbox) return Refusal.NotAllowed({ reason: SANDBOX })
  if (def.internal) return Refusal.NotAllowed({ reason: `${def.name} comes with a migration.` })
  if (def.research && !has(game, def.research))
    return Refusal.Locked({ what: def.name, research: RESEARCH[def.research].name })
  if (queued(game, id)) return Refusal.NotAllowed({ reason: `${def.name} is on the backlog.` })
  if ((FIXES as ReadonlyArray<string>).includes(id) && serviceOf(game).fixes.includes(id as FixId))
    return Refusal.NotAllowed({ reason: `${def.name} is done.` })
  if (id === 'add-index' && serviceOf(game).shapes <= 0 && game.incident?.kind !== 'slow-query')
    return Refusal.NotAllowed({ reason: 'Every query has an index.' })
  if (id === 'refactor' && serviceOf(game).debt <= 0)
    return Refusal.NotAllowed({ reason: 'There is no tech debt.' })
  return null
}

const refused = (refusal: Refusal | null, apply: () => Game): Action =>
  refusal ? no(refusal) : ok(apply())

export const queueFeature = (game: Game, id: FeatureId): Action =>
  refused(featureRefusal(game, id), () => enqueue(game, 'feature', id, FEATURES[id].dh))

export const queueTask = (game: Game, id: TaskId): Action =>
  refused(taskRefusal(game, id), () => enqueue(game, 'task', id, TASKS[id].dh))

/**
 * Puts a fix in the code, or takes it out, on a Challenge whose fixes cost Dev Hours
 * (14 "The N+1"). The Challenge counts the Dev Hours; the fix itself is instant.
 */
export const setFix = (game: Game, id: FixId, on: boolean): Action => {
  if (!game.scenario?.tasks) return notAllowed(SANDBOX)
  const research = TASKS[id].research
  if (research && !has(game, research))
    return no(Refusal.Locked({ what: TASKS[id].name, research: RESEARCH[research].name }))
  const fixes = serviceOf(game).fixes
  if (fixes.includes(id) === on) return ok(game)
  return ok(
    withService(game, { fixes: on ? [...fixes, id] : fixes.filter((entry) => entry !== id) }),
  )
}

/** Puts a Team on the running Study (08 "Spikes"): it runs 2× while the Team works on it. */
export const queueSpike = (game: Game): Action => {
  const running = game.studies[0]
  if (game.sandbox) return notAllowed(SANDBOX)
  if (!running) return notAllowed('No Study is running.')
  if (queued(game, running.id))
    return notAllowed(`A Team already spikes ${RESEARCH[running.id].name}.`)
  // A Spike has no size: it holds its Team until its Study completes.
  return ok(enqueue(game, 'spike', running.id, Number.MAX_SAFE_INTEGER, true))
}

/* ---------- the backlog ---------- */

const withItem = (game: Game, id: number, apply: (index: number) => Action): Action => {
  const index = game.backlog.findIndex((item) => item.id === id)
  return index === -1 ? no(Refusal.Missing()) : apply(index)
}

/** Moves an item up or down the backlog. */
export const moveItem = (game: Game, id: number, direction: 1 | -1): Action =>
  withItem(game, id, (index) => {
    const to = index + direction
    if (to < 0 || to >= game.backlog.length) return ok(game)
    const backlog = [...game.backlog]
    const [item] = backlog.splice(index, 1)
    if (item) backlog.splice(to, 0, item)
    return ok({ ...game, backlog })
  })

/** Moves an item to the top of the backlog, so the next free team builds it. */
export const prioritizeItem = (game: Game, id: number): Action =>
  withItem(game, id, (index) => {
    const item = game.backlog[index]
    if (!item) return no(Refusal.Missing())
    return ok({ ...game, backlog: [item, ...game.backlog.filter((entry) => entry.id !== id)] })
  })

/** Takes an item off the backlog. Dev Hours spent on it are lost. */
export const cancelItem = (game: Game, id: number): Action =>
  withItem(game, id, (index) => {
    const item = game.backlog[index]
    if (item?.kind === 'migration') return notAllowed('Cancel the migration instead.')
    if (item?.ref === 'fix-bugs') return notAllowed('The migration needs its bugs fixed.')
    if (item?.kind === 'patch') return notAllowed('A patch stays until it is built or it expires.')
    return ok({ ...game, backlog: game.backlog.filter((entry) => entry.id !== id) })
  })

/** Pays what an item still needs from the Dev Hours pool, as far as it reaches. */
export const rushItem = (game: Game, id: number): Action =>
  withItem(game, id, (index) => {
    const item = game.backlog[index]
    if (!item) return no(Refusal.Missing())
    if (item.kind === 'spike') return notAllowed('A Spike ends when its Study completes.')
    if (game.devHours < 0.01) return notAllowed('The Dev Hours pool is empty.')
    const paid = Math.min(game.devHours, item.cost - item.spent)
    const backlog = game.backlog.map((entry, at) =>
      at === index ? { ...entry, spent: entry.spent + paid } : entry,
    )
    return ok({ ...game, devHours: game.devHours - paid, backlog })
  })

export const setAutopilot = (game: Game, autopilot: boolean): Game => ({ ...game, autopilot })

/**
 * Adds the missing index. Needs Query analysis to find it. A Sandbox adds it at
 * once; a Company puts the task at the top of the backlog and rushes it from the pool.
 */
export const addIndex = (game: Game, nodeId: string): Action => {
  const node = game.nodes.find((entry) => entry.id === nodeId)
  if (!node) return no(Refusal.Missing())
  if (node.type !== 'database') return notAllowed('Indexes live on the Database.')
  if (!has(game, 'query-analysis'))
    return no(Refusal.Locked({ what: 'Add index', research: RESEARCH['query-analysis'].name }))
  if (game.sandbox) {
    const incident = game.incident
    if (incident?.kind !== 'slow-query') return notAllowed('Every query has an index.')
    return ok({ ...game, incident: { ...incident, remaining: 0 } })
  }
  const existing = game.backlog.find((item) => item.ref === 'add-index')
  const queuedTop: Action = existing
    ? ok({ ...game, backlog: [existing, ...game.backlog.filter((item) => item !== existing)] })
    : refused(taskRefusal(game, 'add-index'), () =>
        enqueue(game, 'task', 'add-index', TASKS['add-index'].dh, true),
      )
  return Result.map(queuedTop, (next) => {
    const top = next.backlog[0]
    return top && next.devHours > 0.01 ? Result.getOrElse(rushItem(next, top.id), () => next) : next
  })
}

/* ---------- the Team ---------- */

/** Signs an engineer for the Service's language: they join after the time to hire. */
export const hire = (game: Game, tuning: Tuning = LIVE_TUNING): Action => {
  if (game.sandbox) return notAllowed(SANDBOX)
  if (game.stage < 1) return no(Refusal.TooEarly({ what: 'Hiring', era: ERAS[1]?.name ?? '' }))
  const language = languageOfService(game)
  const price = signingOf(game, language)
  if (game.cash < price)
    return no(Refusal.Unaffordable({ what: 'A hire', price, currency: 'cash' }))
  const team = game.teams[0]?.id ?? 'core'
  return ok({
    ...game,
    cash: game.cash - price,
    workSeq: game.workSeq + 1,
    hires: [
      ...game.hires,
      {
        id: `e${game.workSeq + 1}`,
        team,
        language,
        readyAt: game.time + hireSeconds(language, tuning),
      },
    ],
  })
}

/** Lets an engineer go: no refund, no more salary, and the rest of the team loses heart for a week. */
export const layoff = (game: Game, engineerId: string, tuning: Tuning = LIVE_TUNING): Action => {
  if (!game.engineers.some((engineer) => engineer.id === engineerId)) return no(Refusal.Missing())
  return ok({
    ...game,
    engineers: game.engineers.filter((engineer) => engineer.id !== engineerId),
    moraleUntil: game.time + moraleSeconds(tuning),
  })
}

export const createTeam = (game: Game): Action => {
  if (game.sandbox) return notAllowed(SANDBOX)
  if (game.stage < 1)
    return no(Refusal.TooEarly({ what: 'A second team', era: ERAS[1]?.name ?? '' }))
  if (game.teams.length >= MAX_TEAMS) return notAllowed(`At most ${MAX_TEAMS} teams.`)
  const id = `t${game.workSeq + 1}`
  return ok({
    ...game,
    workSeq: game.workSeq + 1,
    teams: [
      ...game.teams,
      {
        id,
        name: `Team ${game.teams.length + 1}`,
        policy: 'balanced',
        previous: 'balanced',
        since: game.time,
      },
    ],
  })
}

/** Removes a team: its engineers move to the first team. The founder's team stays. */
export const removeTeam = (game: Game, teamId: string): Action => {
  const first = game.teams[0]
  if (!first || first.id === teamId) return notAllowed('The founder’s team stays.')
  if (!game.teams.some((team) => team.id === teamId)) return no(Refusal.Missing())
  return ok({
    ...game,
    teams: game.teams.filter((team) => team.id !== teamId),
    engineers: game.engineers.map((engineer) =>
      engineer.team === teamId ? { ...engineer, team: first.id } : engineer,
    ),
    hires: game.hires.map((entry) =>
      entry.team === teamId ? { ...entry, team: first.id } : entry,
    ),
  })
}

export const assign = (game: Game, engineerId: string, teamId: string): Action => {
  if (!game.teams.some((team) => team.id === teamId)) return no(Refusal.Missing())
  if (!game.engineers.some((engineer) => engineer.id === engineerId)) return no(Refusal.Missing())
  return ok({
    ...game,
    engineers: game.engineers.map((engineer) =>
      engineer.id === engineerId ? { ...engineer, team: teamId } : engineer,
    ),
  })
}

/** Changes a team's policy. The old one holds for a calendar day while the team adjusts. */
export const setTeamPolicy = (
  game: Game,
  teamId: string,
  policy: PolicyId,
  tuning: Tuning = LIVE_TUNING,
): Action => {
  const team = game.teams.find((entry) => entry.id === teamId)
  if (!team) return no(Refusal.Missing())
  if (team.policy === policy) return ok(game)
  const now = policyNow(game, team, tuning).id
  return ok({
    ...game,
    teams: game.teams.map((entry) =>
      entry.id === teamId ? { ...entry, policy, previous: now, since: game.time } : entry,
    ),
  })
}

/* ---------- the Stack ---------- */

/**
 * A runtime or framework choice on an App Server. A Sandbox swaps it at once.
 * A Company starts a migration of its Service: Dev Hours, then the strangler.
 */
export const changeStack = (
  game: Game,
  nodeId: string,
  choice: Readonly<{ runtime?: RuntimeId; framework?: FrameworkId }>,
): Action => {
  const node = game.nodes.find((entry) => entry.id === nodeId)
  if (!node) return no(Refusal.Missing())
  if (game.sandbox || node.type !== 'server')
    return choice.runtime
      ? setRuntime(game, nodeId, choice.runtime)
      : setFramework(game, nodeId, choice.framework ?? node.framework)
  const target = targetOf(node, choice)
  const migration = serviceOf(game).migration
  // Choosing the Stack a migration already moves to, or the one it left, changes nothing.
  if (
    migration &&
    ((target.runtime === migration.runtime && target.framework === migration.framework) ||
      (target.runtime === node.runtime && target.framework === node.framework))
  )
    return ok(game)
  return startMigration(game, target)
}

export { cancelMigration, shiftMigration }

/* ---------- incidents ---------- */

/** Rolls back a bad deploy: its Features wait for the next deploy again. Needs Continuous delivery. */
export const rollback = (game: Game): Action => {
  if (game.incident?.kind !== 'bad-deploy') return notAllowed('No deploy needs rolling back.')
  if (!has(game, 'ci')) return no(Refusal.Locked({ what: 'Roll back', research: RESEARCH.ci.name }))
  const batch = serviceOf(game).lastDeploy
  const rolled: Game = {
    ...game,
    shipped: game.shipped.filter((id) => !batch.includes(id)),
    awaiting: [...batch, ...game.awaiting.filter((id) => !batch.includes(id))],
    incident: { ...game.incident, remaining: 0 },
  }
  return ok(withService(rolled, { lastDeploy: [] }))
}

/* ---------- the Step ---------- */

type Advance = Readonly<{ game: Game; events: ReadonlyArray<StepEvent> }>

/** The next Feature the autopilot builds: the first in catalog order the Company can start. */
export const nextFeature = (game: Game): FeatureId | undefined =>
  FEATURE_IDS.find((id) => featureRefusal(game, id) === null)

/** Idle teams pick work, and a built migration step shifts. */
const autopilot = (game: Game, events: Array<StepEvent>): Game => {
  let next = game
  const migration = serviceOf(next).migration
  if (migration?.ready) {
    const shifted = shiftMigration(next)
    if (Result.isSuccess(shifted)) {
      next = shifted.success
      events.push(StepEvent.MigrationShifted({ step: migration.step + 1 }))
    }
  }
  while (next.backlog.length < next.teams.length) {
    const feature = nextFeature(next)
    if (feature) {
      next = enqueue(next, 'feature', feature, FEATURES[feature].dh)
      continue
    }
    if (serviceOf(next).debt >= AUTO_REFACTOR && !queued(next, 'refactor')) {
      next = enqueue(next, 'task', 'refactor', TASKS.refactor.dh)
      continue
    }
    break
  }
  return next
}

/** What a finished item does. */
const complete = (game: Game, item: WorkItem): Game => {
  // A patch has no effect to apply: finishing it before it is exploited is the effect.
  if (item.kind === 'spike' || item.kind === 'patch') return game
  const service = serviceOf(game)
  if (item.kind === 'migration') {
    const migration = service.migration
    return migration ? withService(game, { migration: { ...migration, ready: true } }) : game
  }
  if (item.kind === 'feature') {
    const id = item.ref as FeatureId
    const team = game.teams[0]
    const policy = team ? policyNow(game, team) : POLICIES.balanced
    const grows =
      (policy.debt + (stackOf(game).framework === 'none' ? UNSTRUCTURED_DEBT : 0)) *
      (structured(game) ? STRUCTURED_DEBT : 1)
    return withService(
      { ...game, awaiting: [...game.awaiting, id] },
      {
        debt: Math.min(1, service.debt + grows),
        codebase: service.codebase + FEATURES[id].dh * KLOC_PER_DH,
      },
    )
  }
  const id = item.ref as TaskId
  // A task shipped during an incident is a hotfix: it adds debt.
  const hotfix = game.incident !== null && id !== 'refactor' ? HOTFIX_DEBT : 0
  const after = withService(game, { debt: Math.min(1, service.debt + hotfix) })
  switch (id) {
    case 'add-index':
      return withService(
        after.incident?.kind === 'slow-query'
          ? { ...after, incident: { ...after.incident, remaining: 0 } }
          : after,
        { shapes: Math.max(0, service.shapes - 1) },
      )
    case 'fix-leak': {
      const leak = after.incident?.kind === 'leak' ? after.incident : null
      const cleaned: Game = leak
        ? {
            ...after,
            nodes: after.nodes.map((node) =>
              node.id === leak.nodeId ? { ...node, leak: 0 } : node,
            ),
            incident: { ...leak, remaining: 0 },
          }
        : after
      return withService(cleaned, { fixes: [...service.fixes, 'fix-leak'] })
    }
    case 'eager-loading':
    case 'session-state':
      return withService(after, { fixes: [...service.fixes, id] })
    case 'refactor':
      return withService(after, { debt: Math.max(0, service.debt - item.cost * REFACTOR_PER_DH) })
    case 'fix-bugs':
      return bugsFixed(after)
  }
}

/** Ships what waits, at the next deploy slot. Nothing ships on top of a bad deploy. */
const deploy = (
  game: Game,
  ledger: Ledger,
  tuning: Tuning,
  events: Array<StepEvent>,
  offline: boolean,
): Game => {
  const service = serviceOf(game)
  if (game.time < service.nextDeployAt) return game
  const slot = withService(game, { nextDeployAt: game.time + deployEvery(game, tuning) })
  if (game.awaiting.length === 0 || game.incident?.kind === 'bad-deploy') return slot
  const batch = game.awaiting
  let next = withService(
    { ...slot, shipped: [...slot.shipped, ...batch], awaiting: [], deploys: slot.deploys + 1 },
    {
      lastDeploy: batch,
      shapes: service.shapes + batch.reduce((sum, id) => sum + FEATURES[id].shapes, 0),
      // A new Feature can leak again.
      fixes: service.fixes.filter((fix) => fix !== 'fix-leak'),
    },
  )
  // No incident starts while the player is away (04 "Offline progress").
  const chance = offline ? 0 : badDeployChance(next, tuning)
  let bad = false
  if (chance > 0) {
    const [roll, seed] = nextRandom(next.seed)
    next = { ...next, seed }
    const started = roll < chance ? startIncident(next, ledger, 'bad-deploy', roll) : null
    if (started) {
      next = { ...started.game, badDeploys: next.badDeploys + 1 }
      bad = true
      events.push(StepEvent.IncidentStarted({ incident: started.incident }))
    }
  }
  events.push(StepEvent.Deployed({ features: batch, bad }))
  return next
}

/** Whether a Team can work on an item: a Spike waits while its Study is not the running one. */
export const takeable = (game: Game, item: WorkItem): boolean =>
  item.kind !== 'spike' || game.studies[0]?.id === item.ref

/**
 * Advances the Team by some seconds: hires join, idle teams pick work, Dev
 * Hours build the backlog, finished items take effect, and deploys ship.
 */
export const advanceTeam = (
  game: Game,
  ledger: Ledger,
  seconds: number,
  tuning: Tuning = LIVE_TUNING,
  offline = false,
): Advance => {
  if (game.sandbox) return { game, events: [] }
  const events: Array<StepEvent> = []
  let next = game

  const joined = next.hires.filter((entry) => entry.readyAt <= next.time)
  if (joined.length > 0) {
    const teams = new Set(next.teams.map((team) => team.id))
    next = {
      ...next,
      hires: next.hires.filter((entry) => entry.readyAt > next.time),
      engineers: [
        ...next.engineers,
        ...joined.map((entry) => ({
          id: entry.id,
          team: teams.has(entry.team) ? entry.team : (next.teams[0]?.id ?? 'core'),
          language: entry.language,
          hiredAt: entry.readyAt,
        })),
      ],
    }
    for (const entry of joined) events.push(StepEvent.Hired({ engineerId: entry.id }))
  }

  if (next.autopilot) next = autopilot(next, events)

  // Each team builds the first item no team ahead of it has.
  const migrating = serviceOf(next).migration !== null
  const backlog = next.backlog.map((item) => ({ ...item }))
  const taken = new Set<number>()
  let pool = next.devHours
  let paydown = 0
  for (const output of teamOutputs(next, ledger, tuning)) {
    const made = output.rate * seconds
    const kept = made * policyNow(next, output.team, tuning).paydown
    paydown += kept
    const item = backlog.find((entry) => !taken.has(entry.id) && takeable(next, entry))
    if (!item) {
      pool += made - kept
      continue
    }
    taken.add(item.id)
    const speed = item.kind === 'feature' && migrating ? MIGRATION_FEATURE_SPEED : 1
    const put = Math.min(item.cost - item.spent, (made - kept) * speed)
    item.spent += put
    pool += made - kept - put / speed
  }
  const finished = backlog.filter((item) => item.spent >= item.cost - 1e-9)
  const service = serviceOf(next)
  next = withService(
    {
      ...next,
      devHours: pool,
      backlog: backlog.filter((item) => item.spent < item.cost - 1e-9),
    },
    { debt: Math.max(0, service.debt - paydown * REFACTOR_PER_DH) },
  )
  for (const item of finished) {
    next = complete(next, item)
    events.push(StepEvent.WorkFinished({ item }))
  }

  next = deploy(next, ledger, tuning, events, offline)
  return { game: next, events }
}
