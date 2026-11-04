import { Result } from 'effect'
import {
  FIX_BUGS_SHARE,
  FRAMEWORKS,
  LANGUAGES,
  MIGRATION_FACTORS,
  MIGRATION_STEPS,
  MIGRATION_TRANCHES,
  MONOLITH_MIGRATION,
  RUNTIMES,
  type FrameworkId,
  type RuntimeId,
} from './catalog.ts'
import { hasMutator } from './founding.ts'
import { Refusal, setFramework, setRuntime, type Action } from './actions.ts'
import type { Game, GameNode, Migration } from './state.ts'
import { enqueue, serviceOf, stackOf, withService } from './team.ts'

/* ==========================================================================
   Migrations (08): a Stack change in a Company costs Dev Hours, sized by the
   codebase. Both versions run while the strangler moves App Servers over at
   5%, 25%, 50%, and 100%. Each step needs its share of the Dev Hours, and
   each step that moves a server reveals bugs until Fix bugs ships.
   ========================================================================== */

export type StackTarget = Readonly<{ runtime: RuntimeId; framework: FrameworkId }>

/* ---------- the migration machine ---------- */

/** Steps shifted so far: every App Server moved once it reaches the step count. */
export const stepOf = (migration: Migration): number =>
  migration._tag === 'Finishing' ? MIGRATION_STEPS.length : migration.step

/** Traffic can shift only from Ready. */
export const isReady = (migration: Migration): boolean => migration._tag === 'Ready'

/** The next tranche's Dev Hours are built: Building becomes Ready. */
export const trancheBuilt = (migration: Migration): Migration => {
  if (migration._tag !== 'Building') return migration
  const { runtime, framework, fromRuntime, fromFramework, total, step, bugs } = migration
  return { _tag: 'Ready', runtime, framework, fromRuntime, fromFramework, total, step, bugs }
}

/**
 * Shifts traffic one step. A migration that moved its last App Server and has
 * no bugs left ends; one that moved it with bugs stays to be fixed.
 */
export const shifted = (migration: Migration, moved: boolean): Migration | null => {
  if (migration._tag !== 'Ready') return migration
  const { runtime, framework, fromRuntime, fromFramework, total } = migration
  const step = migration.step + 1
  const bugs = migration.bugs || moved
  if (step >= MIGRATION_STEPS.length)
    return bugs
      ? { _tag: 'Finishing', runtime, framework, fromRuntime, fromFramework, total, bugs }
      : null
  return {
    _tag: 'Building',
    runtime,
    framework,
    fromRuntime,
    fromFramework,
    total,
    step,
    bugs,
  }
}

/** Fix bugs shipped: a finished migration ends, and a running one stops failing requests. */
export const fixed = (migration: Migration): Migration | null =>
  migration._tag === 'Finishing' ? null : { ...migration, bugs: false }

/** The migration factor: a variant 0.1, a framework 0.5, a language 1 over the new language's velocity. */
export const migrationFactor = (from: StackTarget, to: StackTarget): number => {
  const language = RUNTIMES[to.runtime].language
  if (RUNTIMES[from.runtime].language !== language)
    return MIGRATION_FACTORS.language / LANGUAGES[language].velocity
  if (from.framework !== to.framework) return MIGRATION_FACTORS.framework
  return MIGRATION_FACTORS.variant
}

/** Dev Hours to move the whole codebase, to a tenth. */
export const migrationCost = (game: Game, to: StackTarget): number =>
  Math.max(
    0.5,
    Math.round(
      serviceOf(game).codebase *
        migrationFactor(stackOf(game), to) *
        (hasMutator(game, 'legacy-monolith') ? MONOLITH_MIGRATION : 1) *
        10,
    ) / 10,
  )

/** Dev Hours of one step: its tranche of the total. */
export const trancheOf = (migration: Migration, step: number): number =>
  Math.round(migration.total * (MIGRATION_TRANCHES[step - 1] ?? 0) * 10) / 10

/** The target Stack of a runtime or framework choice on an App Server. */
export const targetOf = (
  node: GameNode,
  choice: Readonly<{ runtime?: RuntimeId; framework?: FrameworkId }>,
): StackTarget => {
  const runtime = choice.runtime ?? node.runtime
  const framework =
    choice.framework ??
    (FRAMEWORKS[node.framework].language === RUNTIMES[runtime].language ? node.framework : 'none')
  return { runtime, framework }
}

const servers = (game: Game) => game.nodes.filter((node) => node.type === 'server')

const onStack = (node: GameNode, stack: StackTarget): boolean =>
  node.runtime === stack.runtime && node.framework === stack.framework

/** Swaps one App Server's Stack now: it restarts cold. */
const swap = (game: Game, id: string, stack: StackTarget): Action =>
  Result.flatMap(setRuntime(game, id, stack.runtime), (next) =>
    setFramework(next, id, stack.framework),
  )

/** Moves App Servers to the Stack until `count` run it. */
const convert = (game: Game, stack: StackTarget, count: number): Game => {
  let next = game
  for (const node of servers(game)) {
    if (servers(next).filter((entry) => onStack(entry, stack)).length >= count) break
    if (!onStack(node, stack)) next = Result.getOrElse(swap(next, node.id, stack), () => next)
  }
  return next
}

/** App Servers the step moves over: a floor share of them, and all of them at 100%. */
export const serversAt = (game: Game, step: number): number => {
  const total = servers(game).length
  return step >= MIGRATION_STEPS.length
    ? total
    : Math.floor(total * (MIGRATION_STEPS[step - 1] ?? 0))
}

/** Starts a migration of the Service to a Stack: its first step goes on the backlog. */
export const startMigration = (game: Game, to: StackTarget): Action => {
  const running = serviceOf(game).migration
  if (running)
    return Result.fail(
      Refusal.NotAllowed({
        reason:
          running._tag === 'Finishing'
            ? 'Fix the last migration’s bugs first.'
            : `Finish or cancel the migration to ${RUNTIMES[running.runtime].name} first.`,
      }),
    )
  const from = stackOf(game)
  const first = servers(game)[0]
  if (!first) return Result.fail(Refusal.NotAllowed({ reason: 'There is no App Server.' }))
  if (from.runtime === to.runtime && from.framework === to.framework) return Result.succeed(game)
  // The research gates of the Stack itself.
  const checked = swap(game, first.id, to)
  if (Result.isFailure(checked)) return checked
  const migration: Migration = {
    _tag: 'Building',
    runtime: to.runtime,
    framework: to.framework,
    fromRuntime: from.runtime,
    fromFramework: from.framework,
    total: migrationCost(game, to),
    step: 0,
    bugs: false,
  }
  return Result.succeed(
    enqueue(withService(game, { migration }), 'migration', 'step-1', trancheOf(migration, 1)),
  )
}

/** Shifts traffic to the next step once its Dev Hours are built. */
export const shiftMigration = (game: Game): Action => {
  const migration = serviceOf(game).migration
  if (!migration) return Result.fail(Refusal.NotAllowed({ reason: 'No migration is running.' }))
  if (migration._tag !== 'Ready')
    return Result.fail(Refusal.NotAllowed({ reason: 'The next step is still being built.' }))
  const step = migration.step + 1
  const stack = { runtime: migration.runtime, framework: migration.framework }
  const before = servers(game).filter((node) => onStack(node, stack)).length
  let next = convert(game, stack, serversAt(game, step))
  const moved = servers(next).filter((node) => onStack(node, stack)).length > before
  if (moved && !next.backlog.some((item) => item.ref === 'fix-bugs'))
    next = enqueue(
      next,
      'task',
      'fix-bugs',
      Math.max(1, Math.round(trancheOf(migration, step) * FIX_BUGS_SHARE * 10) / 10),
      true,
    )
  const done = step >= MIGRATION_STEPS.length
  if (!done) next = enqueue(next, 'migration', `step-${step + 1}`, trancheOf(migration, step + 1))
  return Result.succeed(withService(next, { migration: shifted(migration, moved) }))
}

/** Fix bugs shipped: the new Stack stops failing, and a finished migration ends. */
export const bugsFixed = (game: Game): Game => {
  const migration = serviceOf(game).migration
  if (!migration) return game
  return withService(game, { migration: fixed(migration) })
}

/** Stops a migration: the App Servers already moved go back, and the Dev Hours spent are lost. */
export const cancelMigration = (game: Game): Action => {
  const migration = serviceOf(game).migration
  if (!migration) return Result.fail(Refusal.NotAllowed({ reason: 'No migration is running.' }))
  if (migration._tag === 'Finishing')
    return Result.fail(Refusal.NotAllowed({ reason: 'Every App Server has moved. Fix its bugs.' }))
  const from = { runtime: migration.fromRuntime, framework: migration.fromFramework }
  const reverted = convert(game, from, servers(game).length)
  return Result.succeed(
    withService(
      {
        ...reverted,
        backlog: reverted.backlog.filter(
          (item) => item.kind !== 'migration' && item.ref !== 'fix-bugs',
        ),
      },
      { migration: null },
    ),
  )
}

/** Whether an App Server runs the new Stack of a migration whose bugs are not fixed. */
export const buggy = (game: Game, node: GameNode): boolean => {
  const migration = serviceOf(game).migration
  return (
    !!migration &&
    migration.bugs &&
    node.type === 'server' &&
    onStack(node, { runtime: migration.runtime, framework: migration.framework })
  )
}
