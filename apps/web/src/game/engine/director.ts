import { Match } from 'effect'
import {
  COMPONENTS,
  INCIDENTS,
  INCIDENT_GAP,
  INCIDENT_IDS,
  LEAK_RATE,
  OPEN_ACTION_WEIGHT,
  RUNTIMES,
  type ComponentId,
  type IncidentId,
} from './catalog.ts'
import { StepEvent } from './events.ts'
import type { Ledger } from './ledger.ts'
import { has, isDown, ramOf, researchReady, restarted } from './lookups.ts'
import { nextRandom, pickWeighted } from './random.ts'
import type { Game, GameNode, Incident, Postmortem } from './state.ts'

/* ==========================================================================
   The incident director. It attacks the Design, not the player: each
   incident type weighs more when the Design has the weakness it tests. A
   well-built Design survives most incidents without a click.
   ========================================================================== */

/** The director avoids repeating the last incident type. */
const REPEAT_WEIGHT = 0.3

const TARGETS = new Set(['server', 'database', 'replica', 'cache', 'pooler', 'lb'])

const busy = (ledger: Ledger, node: GameNode): boolean => (ledger.nodes[node.id]?.inbound ?? 0) > 0

/** Nodes an instance failure can hit, weighted toward Nodes with no second copy. */
const instanceTargets = (game: Game, ledger: Ledger): ReadonlyArray<readonly [GameNode, number]> =>
  game.nodes
    .filter((node) => TARGETS.has(node.type) && !isDown(node) && busy(ledger, node))
    .map((node) => {
      const copies = game.nodes.filter((other) => other.type === node.type).length
      return [node, copies === 1 ? 3 : 0.5] as const
    })

const leakTargets = (game: Game, ledger: Ledger): ReadonlyArray<GameNode> =>
  game.nodes.filter(
    (node) =>
      node.type === 'server' &&
      RUNTIMES[node.runtime].persistent &&
      !isDown(node) &&
      busy(ledger, node),
  )

/** How hard this incident would hit the current Design, from 0 (not at all) to 3. */
export const weaknessOf = (game: Game, ledger: Ledger, kind: IncidentId): number =>
  Match.value(kind).pipe(
    Match.when('spike', () => {
      const hottest = Math.max(
        0,
        ...game.nodes
          .filter((node) => TARGETS.has(node.type))
          .map((node) => ledger.nodes[node.id]?.utilization ?? 0),
      )
      return hottest > 0.5 ? 2 : 1
    }),
    Match.when('instance', () =>
      Math.max(0, ...instanceTargets(game, ledger).map(([, weight]) => weight)),
    ),
    Match.when('connections', () => {
      if (game.nodes.some((node) => node.type === 'pooler')) return 0.1
      const fullest = Math.max(
        0,
        ...Object.values(ledger.nodes).map((entry) =>
          entry.connections ? entry.connections.used / entry.connections.max : 0,
        ),
      )
      return fullest > 0.5 ? 2.5 : fullest > 0.2 ? 0.8 : 0
    }),
    Match.when('loop', () =>
      !has(game, 'libuv-pool') &&
      game.nodes.some(
        (node) =>
          node.type === 'server' && RUNTIMES[node.runtime].model === 'loop' && busy(ledger, node),
      ) &&
      (ledger.kinds.login?.rate ?? 0) > 0
        ? 3
        : 0,
    ),
    Match.when('leak', () => (leakTargets(game, ledger).length > 0 ? 2 : 0)),
    Match.when('slow-query', () =>
      game.nodes.some((node) => node.type === 'database' && busy(ledger, node)) ? 1.5 : 0,
    ),
    Match.exhaustive,
  )

/** A postmortem opened an action item against this incident, and its research is not owned yet. */
const unaddressed = (game: Game, kind: IncidentId): boolean =>
  INCIDENTS[kind].actions.some((id) => game.openActions.includes(id) && !has(game, id))

/** Starts an incident. Returns null when the Design has nothing it can hit. */
export const startIncident = (
  game: Game,
  ledger: Ledger,
  kind: IncidentId,
  roll: number,
  only?: ComponentId,
): Readonly<{ game: Game; incident: Incident }> | null => {
  const target = Match.value(kind).pipe(
    Match.when('instance', () =>
      pickWeighted(
        instanceTargets(game, ledger).filter(([node]) => !only || node.type === only),
        roll,
      ),
    ),
    Match.when('leak', () => {
      const targets = leakTargets(game, ledger)
      return targets[Math.floor(roll * targets.length)]
    }),
    Match.when('slow-query', () =>
      game.nodes.find((node) => node.type === 'database' && busy(ledger, node)),
    ),
    Match.orElse(() => undefined),
  )
  if ((kind === 'instance' || kind === 'leak' || kind === 'slow-query') && !target) return null
  const incident: Incident = {
    kind,
    remaining: INCIDENTS[kind].duration,
    nodeId: target?.id ?? null,
    startedAt: game.time,
    baseline: ledger.revenue,
    usersAtStart: game.users,
    impaired: 0,
    lostRevenue: 0,
    failed: 0,
  }
  const nodes =
    kind === 'instance' && target
      ? game.nodes.map((node) =>
          node.id === target.id ? { ...node, down: -1, downCause: 'failure' as const } : node,
        )
      : game.nodes
  return { game: { ...game, nodes, incident, lastIncident: kind }, incident }
}

/** Rolls the next incident when one is due. */
export const directIncidents = (
  game: Game,
  ledger: Ledger,
  gap = INCIDENT_GAP,
): Readonly<{ game: Game; events: ReadonlyArray<StepEvent> }> => {
  if (game.sandbox || game.incident || game.stage < 1 || game.time < game.nextIncidentAt)
    return { game, events: [] }
  const [roll, afterRoll] = nextRandom(game.seed)
  const [spread, afterGap] = nextRandom(afterRoll)
  const [pick, afterPick] = nextRandom(afterGap)
  const scheduled: Game = {
    ...game,
    seed: afterPick,
    nextIncidentAt: game.time + gap * (0.6 + 0.8 * spread),
  }
  const kind = pickWeighted(
    INCIDENT_IDS.map(
      (id) =>
        [
          id,
          weaknessOf(game, ledger, id) *
            (id === game.lastIncident ? REPEAT_WEIGHT : 1) *
            (unaddressed(game, id) ? OPEN_ACTION_WEIGHT : 1),
        ] as const,
    ),
    roll,
  )
  if (!kind) return { game: scheduled, events: [] }
  const started = startIncident(scheduled, ledger, kind, pick)
  if (!started) return { game: scheduled, events: [] }
  return { game: started.game, events: [StepEvent.IncidentStarted({ incident: started.incident })] }
}

const postmortemOf = (game: Game, incident: Incident): Postmortem => {
  const target = game.nodes.find((node) => node.id === incident.nodeId)
  return {
    id: game.postmortemSeq + 1,
    kind: incident.kind,
    target: target ? COMPONENTS[target.type].name : null,
    duration: game.time - incident.startedAt,
    mttr: incident.impaired,
    lostUsers: Math.max(0, incident.usersAtStart - game.users),
    lostRevenue: incident.lostRevenue,
    failed: incident.failed,
    action: game.sandbox
      ? null
      : (INCIDENTS[incident.kind].actions.find((id) => !has(game, id) && researchReady(game, id)) ??
        null),
  }
}

/** Ends the running incident: undoes its effect and files a postmortem to write. */
const resolve = (game: Game): Readonly<{ game: Game; events: ReadonlyArray<StepEvent> }> => {
  const incident = game.incident
  if (!incident) return { game, events: [] }
  const postmortem = postmortemOf(game, incident)
  const killed = game.nodes.find(
    (node) => node.id === incident.nodeId && incident.kind === 'leak' && node.leak > 0,
  )
  const nodes = game.nodes.map((node) => {
    if (node.id !== incident.nodeId) return node
    if (incident.kind === 'instance' && node.down === -1) return { ...node, ...restarted(node) }
    if (incident.kind === 'leak' && node.leak > 0)
      return { ...node, ...restarted(node, 'oom'), leak: 0 }
    return node
  })
  return {
    game: {
      ...game,
      nodes,
      incident: null,
      postmortems: game.sandbox ? game.postmortems : [...game.postmortems, postmortem].slice(-4),
      postmortemSeq: postmortem.id,
      openActions:
        postmortem.action && !game.openActions.includes(postmortem.action)
          ? [...game.openActions, postmortem.action]
          : game.openActions,
    },
    events: [
      ...(killed ? [StepEvent.OutOfMemory({ nodeId: killed.id })] : []),
      StepEvent.IncidentResolved({ postmortem }),
    ],
  }
}

/** Advances the running incident by some seconds: its effect, its cost, and its end. */
export const advanceIncident = (
  game: Game,
  ledger: Ledger,
  seconds: number,
): Readonly<{ game: Game; events: ReadonlyArray<StepEvent> }> => {
  const incident = game.incident
  if (!incident) return { game, events: [] }
  const tracked: Incident = {
    ...incident,
    remaining: incident.remaining - seconds,
    impaired: incident.impaired + (ledger.errorShare > 0.01 ? seconds : 0),
    lostRevenue: incident.lostRevenue + Math.max(0, incident.baseline - ledger.revenue) * seconds,
    failed: incident.failed + ledger.errorShare * ledger.demand * seconds,
  }
  const target = game.nodes.find((node) => node.id === incident.nodeId)
  const nodes =
    incident.kind === 'leak' && target
      ? game.nodes.map((node) =>
          node.id === target.id
            ? { ...node, leak: node.leak + ramOf(node) * LEAK_RATE * seconds }
            : node,
        )
      : game.nodes
  const next: Game = { ...game, nodes, incident: tracked }
  const fixed =
    (incident.kind === 'instance' && (!target || target.down !== -1)) ||
    (incident.kind === 'leak' &&
      (!target || (target.leak === 0 && incident.remaining < INCIDENTS.leak.duration)))
  return tracked.remaining <= 0 || fixed ? resolve(next) : { game: next, events: [] }
}

/** Starts an incident on demand, for the playtest panel and Sandbox scripts. */
export const forceIncident = (
  game: Game,
  ledger: Ledger,
  kind: IncidentId,
  only?: ComponentId,
): Game | null => {
  if (game.incident) return null
  const [roll, seed] = nextRandom(game.seed)
  return startIncident({ ...game, seed }, ledger, kind, roll, only)?.game ?? null
}
