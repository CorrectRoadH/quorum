import { Match } from 'effect'
import {
  COMPONENTS,
  ERAS,
  ESCALATION,
  FAILOVER_SECONDS,
  INCIDENTS,
  INCIDENT_GAP,
  INCIDENT_IDS,
  LEAK_RATE,
  MIN_WEAKNESS,
  OPEN_ACTION_WEIGHT,
  RUNTIMES,
  SPIKE_MAGNITUDE,
  WARMED,
  type ComponentId,
  type IncidentId,
} from './catalog.ts'
import { StepEvent } from './events.ts'
import type { Ledger } from './ledger.ts'
import { eraOf, has, isDown, ramOf, researchReady, restarted, zoned } from './lookups.ts'

export { zoned }
import { nextRandom, pickWeighted } from './random.ts'
import type { Game, GameNode, Incident, Postmortem, Zone } from './state.ts'
import { fixed, serviceOf } from './team.ts'

/* ==========================================================================
   The incident director. It attacks the Design, not the player: each
   incident type weighs more when the Design has the weakness it tests. A
   well-built Design survives most incidents without a click.
   ========================================================================== */

/** The director avoids repeating the last incident type. */
const REPEAT_WEIGHT = 0.3

const busy = (ledger: Ledger, node: GameNode): boolean => (ledger.nodes[node.id]?.inbound ?? 0) > 0

/** Nodes an instance failure can hit, weighted toward Nodes with no second copy. */
const instanceTargets = (game: Game, ledger: Ledger): ReadonlyArray<readonly [GameNode, number]> =>
  game.nodes
    .filter((node) => COMPONENTS[node.type].limiting && !isDown(node) && busy(ledger, node))
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

const hasNode = (game: Game, type: ComponentId): boolean =>
  game.nodes.some((node) => node.type === type && !isDown(node))

const cacheTargets = (game: Game, ledger: Ledger): ReadonlyArray<GameNode> =>
  game.nodes.filter((node) => node.type === 'cache' && !isDown(node) && busy(ledger, node))

const poisonTargets = (game: Game): ReadonlyArray<GameNode> =>
  game.nodes.filter((node) => node.type === 'queue' && !node.dlq)

/**
 * Zones whose loss would take a whole Component out: every live copy of some
 * Component sits there, and a data Node there has no standby elsewhere.
 */
export const fragileZones = (game: Game): ReadonlyArray<Zone> => {
  const live = game.nodes.filter((node) => zoned(node) && !isDown(node))
  const zones = new Set<Zone>()
  for (const node of live) {
    if (node.standby) continue
    const copies = live.filter((other) => other.type === node.type)
    if (copies.every((other) => other.zone === node.zone)) zones.add(node.zone)
  }
  return [...zones].toSorted()
}

/** How hard this incident would hit the current Design: 0 when it has nothing to hit, else 0.2 to 3. */
export const weaknessOf = (game: Game, ledger: Ledger, kind: IncidentId): number => {
  if (INCIDENTS[kind].era > game.stage) return 0
  const weakness = rawWeakness(game, ledger, kind)
  return weakness > 0 ? Math.max(MIN_WEAKNESS, weakness) : 0
}

const rawWeakness = (game: Game, ledger: Ledger, kind: IncidentId): number =>
  Match.value(kind).pipe(
    Match.when('spike', () => {
      const hottest = Math.max(
        0,
        ...game.nodes
          .filter((node) => COMPONENTS[node.type].limiting)
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
    // Fix memory leak keeps the code from leaking until the next Feature ships.
    Match.when('leak', () =>
      leakTargets(game, ledger).length > 0 && !(fixed(game, 'fix-leak') && !game.sandbox) ? 2 : 0,
    ),
    // Each query shape with no index makes a Slow query likelier.
    Match.when('slow-query', () =>
      game.nodes.some((node) => node.type === 'database' && busy(ledger, node))
        ? 1.5 * (1 + serviceOf(game).shapes)
        : 0,
    ),
    // Only a deploy ships a bug: the director never picks one.
    Match.when('bad-deploy', () => 0),
    // Scrapers and floods hit every Design; a WAF makes them a nuisance.
    Match.when('bot-surge', () => (hasNode(game, 'waf') ? 0.5 : 2)),
    Match.when('ddos', () => (hasNode(game, 'waf') ? 0.5 : 1.5)),
    Match.when('stuffing', () =>
      (ledger.kinds.login?.rate ?? 0) > 0 ? (hasNode(game, 'waf') ? 0.5 : 2) : 0,
    ),
    Match.when('stampede', () =>
      cacheTargets(game, ledger).some(
        (node) => !(node.coalesce && has(game, 'stampede-protection')),
      )
        ? 2
        : cacheTargets(game, ledger).length > 0
          ? 0.5
          : 0,
    ),
    // A dead-letter queue moves the poison message aside: nothing to hit.
    Match.when('poison', () => (poisonTargets(game).length > 0 ? 2 : 0)),
    Match.when('certificate', () => (has(game, 'cert-automation') ? 0 : 0.5)),
    // Their outage, not yours: it hits whoever takes checkouts.
    Match.when('psp-outage', () =>
      game.nodes.some((node) => node.type === 'psp' && busy(ledger, node)) ? 1 : 0,
    ),
    // 3.0 once the Company could spread across zones and has not; before Multiple
    // zones it has no answer, so the outage stays rare. 0.2 when nothing depends on one zone.
    Match.when('zone', () =>
      game.nodes.some((node) => zoned(node) && !isDown(node))
        ? fragileZones(game).length > 0
          ? has(game, 'multi-az')
            ? 3
            : 0.5
          : 0.2
        : 0,
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
    Match.when('stampede', () => {
      const targets = cacheTargets(game, ledger)
      return targets[Math.floor(roll * targets.length)]
    }),
    // It strikes a Queue without a dead-letter queue first; one with a DLQ shrugs it off.
    Match.when('poison', () => {
      const exposed = poisonTargets(game)
      const targets =
        exposed.length > 0 ? exposed : game.nodes.filter((node) => node.type === 'queue')
      return targets[Math.floor(roll * targets.length)]
    }),
    Match.orElse(() => undefined),
  )
  // A zone outage strikes a zone the Design depends on, or else the busiest one.
  const fragile = fragileZones(game)
  const used = [
    ...new Set(game.nodes.filter((node) => zoned(node) && !isDown(node)).map((node) => node.zone)),
  ].toSorted()
  const pool = fragile.length > 0 ? fragile : used
  const zone = kind === 'zone' ? (pool[Math.floor(roll * pool.length)] ?? null) : null
  if (kind === 'zone' && zone === null) return null
  const targeted = ['instance', 'leak', 'slow-query', 'stampede', 'poison'] as const
  if ((targeted as ReadonlyArray<IncidentId>).includes(kind) && !target) return null
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
    severity: INCIDENTS[kind].severity,
    magnitude:
      kind === 'spike'
        ? SPIKE_MAGNITUDE[0] + (SPIKE_MAGNITUDE[1] - SPIKE_MAGNITUDE[0]) * roll
        : SPIKE_MAGNITUDE[0],
    zone,
  }
  // A stampede: the Cache restarted empty, or mostly warm with Cache warming.
  // A zone outage downs its zone for the incident; a Node with a standby fails over.
  const nodes = game.nodes.map((node) =>
    zone !== null && zoned(node) && node.zone === zone && !isDown(node)
      ? {
          ...node,
          down: node.standby ? FAILOVER_SECONDS : INCIDENTS.zone.duration,
          downCause: 'failure' as const,
          downAt: game.time,
        }
      : node.id !== target?.id
        ? node
        : kind === 'instance'
          ? { ...node, down: -1, downCause: 'failure' as const, downAt: game.time }
          : kind === 'stampede'
            ? { ...node, warm: node.warming && has(game, 'cache-warming') ? WARMED : 0 }
            : node,
  )
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
  // Each Era sets its own interval; `gap` is Pre-seed's, so the playtest knob scales them all.
  const interval = eraOf(game).incidentInterval / (ERAS[1]?.incidentInterval ?? 720)
  const scheduled: Game = {
    ...game,
    seed: afterPick,
    nextIncidentAt: game.time + gap * interval * (0.6 + 0.8 * spread),
  }
  const cap = eraOf(game).maxSeverity
  const kind = pickWeighted(
    INCIDENT_IDS.map(
      (id) =>
        [
          id,
          (INCIDENTS[id].severity < cap ? 0 : weaknessOf(game, ledger, id)) *
            // Tech debt makes every incident likelier (08 "Tech debt").
            (1 + serviceOf(game).debt) *
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
    severity: incident.severity,
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
      return { ...node, ...restarted(node, 'oom'), leak: 0, downAt: game.time }
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
  const counted: Incident = {
    ...incident,
    remaining: incident.remaining - seconds,
    impaired: incident.impaired + (ledger.errorShare > 0.01 ? seconds : 0),
    lostRevenue: incident.lostRevenue + Math.max(0, incident.baseline - ledger.revenue) * seconds,
    failed: incident.failed + ledger.errorShare * ledger.demand * seconds,
  }
  // Halfway through, an incident that has hurt users more than half the time steps up once.
  const def = INCIDENTS[incident.kind]
  const half = def.duration / 2
  const elapsed = game.time - incident.startedAt
  const escalates =
    !game.sandbox &&
    incident.severity === def.severity &&
    elapsed >= half &&
    elapsed - seconds < half &&
    counted.impaired > elapsed / 2
  const tracked: Incident = escalates
    ? {
        ...counted,
        severity: def.escalatesTo,
        remaining: counted.remaining * ESCALATION,
        magnitude: incident.kind === 'spike' ? incident.magnitude * ESCALATION : incident.magnitude,
      }
    : counted
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
