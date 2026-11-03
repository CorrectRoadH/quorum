import { Result } from 'effect'
import * as Actions from '../actions.ts'
import type { Challenge } from '../challenges.ts'
import { designOf, type Replay } from '../replay.ts'
import type { Game } from '../state.ts'
import { SIM_VERSION } from '../version.ts'
import { setFix } from '../work.ts'

/* Each Challenge's reference solution, built with the board's actions. Node, the browsers and workerd replay them. */

const ok = (action: Actions.Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const lastId = (game: Game): string => game.nodes.at(-1)?.id ?? ''

/** Puts a data Node between every App Server and `behind`. */
const inFront = (game: Game, type: 'pooler' | 'cache', behind: string): Game => {
  const placed = ok(Actions.place(game, type, 800, 280))
  const id = lastId(placed)
  const rewired = placed.nodes
    .filter((node) => node.type === 'server')
    .reduce(
      (current, server) =>
        ok(Actions.connect(Actions.disconnect(current, server.id, behind), server.id, id)),
      placed,
    )
  return ok(Actions.connect(rewired, id, behind))
}

/** Puts a Node of `type` between Users and what Users call. */
const atEdge = (game: Game, type: 'cdn' | 'waf'): Game => {
  const to = game.links.find((entry) => entry.from === 'users')?.to ?? ''
  const placed = ok(Actions.place(game, type, 240, 280))
  const id = lastId(placed)
  return ok(
    Actions.connect(
      ok(Actions.connect(Actions.disconnect(placed, 'users', to), 'users', id)),
      id,
      to,
    ),
  )
}

/** Adds copies of an App Server behind the Load Balancer, linked to what it calls. */
const more = (game: Game, like: string, count: number): Game => {
  const proto = game.nodes.find((entry) => entry.id === like)
  if (!proto) return game
  const callees = game.links.filter((entry) => entry.from === like).map((entry) => entry.to)
  let next = game
  for (let index = 0; index < count; index += 1) {
    next = ok(Actions.place(next, 'server', proto.x + 40, proto.y + 60 * (index + 1), proto.region))
    const id = lastId(next)
    next = ok(Actions.setRuntime(next, id, proto.runtime))
    while ((next.nodes.find((entry) => entry.id === id)?.size ?? proto.size) < proto.size)
      next = ok(Actions.resize(next, id, 1))
    next = ok(Actions.connect(next, 'lb', id))
    for (const to of callees) next = ok(Actions.connect(next, id, to))
  }
  return next
}

const servers = (game: Game) =>
  game.nodes.filter((entry) => entry.type === 'server').map((entry) => entry.id)

/** The fix each Challenge teaches. */
export const REFERENCE: Record<string, (game: Game) => Game> = {
  'hello-world': (game) => ok(Actions.setFamily(game, 'server', 'general')),
  'split-the-box': (game) => {
    const placed = ok(Actions.place(game, 'database', 760, 280))
    const database = lastId(placed)
    const linked = ok(Actions.connect(placed, 'server', database))
    const shaped = ok(
      Actions.setFamily(ok(Actions.setFamily(linked, 'server', 'compute')), database, 'memory'),
    )
    return ok(
      Actions.resize(
        ok(Actions.resize(ok(Actions.resize(shaped, 'server', 1)), 'server', 1)),
        database,
        1,
      ),
    )
  },
  slashdotted: (start) => {
    let game = inFront(start, 'pooler', 'database')
    const pooler = lastId(game)
    for (let index = 0; index < 6; index += 1) {
      game = ok(Actions.place(game, 'server', 600, 400 + 40 * index))
      const id = lastId(game)
      game = ok(Actions.setRuntime(game, id, 'php_fpm'))
      game = ok(Actions.connect(ok(Actions.connect(game, 'lb', id)), id, pooler))
    }
    for (const server of game.nodes.filter((node) => node.type === 'server'))
      game = ok(Actions.setWorkers(game, server.id, 40))
    game = ok(Actions.place(game, 'cache', 700, 520))
    const cache = lastId(game)
    for (const server of game.nodes.filter((node) => node.type === 'server'))
      game = ok(Actions.connect(game, server.id, cache))
    game = ok(Actions.connect(game, cache, pooler))
    return ok(Actions.resize(ok(Actions.resize(game, 'database', 1)), 'database', 1))
  },
  c10k: (game) =>
    ['server1', 'server2'].reduce(
      (current, server) => ok(Actions.setRuntime(current, server, 'node')),
      game,
    ),
  'event-loop': (game) => ok(Actions.setRuntime(game, 'server', 'node_cluster')),
  'too-many-connections': (game) => inFront(game, 'pooler', 'database'),
  shoestring: (start) => {
    let game = inFront(ok(Actions.sell(start, 'server2')), 'cache', 'database')
    game = ok(Actions.setRuntime(game, 'server1', 'kestrel'))
    for (let step = 0; step < 3; step += 1) game = ok(Actions.resize(game, 'server1', 1))
    for (let step = 0; step < 3; step += 1) game = ok(Actions.resize(game, 'database', 1))
    return game
  },
  'n-plus-one': (game) => ok(setFix(game, 'eager-loading', true)),
  'thirteen-engineers': (game) =>
    ok(Actions.resize(ok(setFix(game, 'eager-loading', true)), 'database', 1)),
  'credential-stuffing': (start) => {
    const guarded = atEdge(start, 'waf')
    const placed = ok(Actions.place(guarded, 'auth', 880, 700))
    const auth = lastId(placed)
    return servers(placed).reduce((game, id) => ok(Actions.connect(game, id, auth)), placed)
  },
  'black-friday': (start) =>
    more(
      ok(Actions.resize(inFront(atEdge(start, 'cdn'), 'cache', 'database'), 'database', 1)),
      'server1',
      2,
    ),
  'us-east-1': (start) => {
    const spread = ok(Actions.setZone(ok(Actions.setZone(start, 'server2', 'b')), 'server3', 'c'))
    const standby = ok(
      Actions.setStandby(ok(Actions.setStandby(spread, 'database', true)), 'search', true),
    )
    return ok(Actions.setHealthCheck(standby, 'lb', { checkEvery: 2 }))
  },
  'two-million-sockets': (start) =>
    ok(
      Actions.setRuntime(
        servers(start)
          .slice(1)
          .reduce((game, id) => ok(Actions.sell(game, id)), start),
        'server1',
        'beam',
      ),
    ),
  'pokemon-go': (start) => {
    let game = inFront(atEdge(start, 'cdn'), 'cache', 'database')
    const cache = lastId(game)
    game = ok(Actions.place(game, 'autoscaler', 600, 80))
    const scaler = lastId(game)
    game = ok(Actions.place(game, 'cluster', 800, 80))
    const cluster = lastId(game)
    for (const id of servers(game))
      game = ok(
        Actions.connect(
          ok(Actions.connect(ok(Actions.resize(game, id, 1)), id, scaler)),
          id,
          cluster,
        ),
      )
    game = ok(Actions.setAutoscaler(game, scaler, { minCopies: 2, maxCopies: 16 }))
    for (let step = 0; step < 3; step += 1) game = ok(Actions.resize(game, cache, 1))
    for (let step = 0; step < 3; step += 1) game = ok(Actions.resize(game, 'lb', 1))
    for (let step = 0; step < 4; step += 1) game = ok(Actions.resize(game, 'database', 1))
    // One pool to the Database for every copy of every App Server, and for the Cache's misses.
    game = ok(Actions.place(game, 'pooler', 900, 120))
    const pooler = lastId(game)
    for (const from of [...servers(game), cache])
      game = ok(Actions.connect(Actions.disconnect(game, from, 'database'), from, pooler))
    return ok(Actions.connect(game, pooler, 'database'))
  },
  'healthcare-launch': (start) => {
    let game = ok(Actions.setFamily(start, 'database', 'general'))
    for (const id of servers(game))
      game = ok(Actions.setRuntime(ok(Actions.setFamily(game, id, 'general')), id, 'go'))
    game = ok(Actions.setTtl(ok(Actions.connect(game, 'cache', 'database')), 'cache', 3_600))
    return ok(Actions.resize(game, 'database', 1))
  },
  'thundering-herd': (start) => {
    const placed = ok(Actions.place(start, 'auth', 1_000, 700))
    const auth = lastId(placed)
    const linked = servers(placed).reduce((game, id) => ok(Actions.connect(game, id, auth)), placed)
    return ok(Actions.resize(ok(Actions.resize(linked, 'lb', 1)), 'lb', 1))
  },
  'read-states': (start) =>
    ok(
      Actions.setFamily(
        ok(Actions.setRuntime(ok(Actions.sell(start, 'server2')), 'server1', 'tokio')),
        'server1',
        'general',
      ),
    ),
  'fail-whale': (start) =>
    servers(start).reduce((game, id) => ok(Actions.setFanout(game, id, 'push')), start),
  'reports-at-noon': (start) => {
    const placed = ok(Actions.place(start, 'warehouse', 1_120, 420))
    const warehouse = lastId(placed)
    return servers(placed).reduce((game, id) => ok(Actions.connect(game, id, warehouse)), placed)
  },
  'gpu-economics': (start) => {
    // One H100 node, eight GPUs, about 85% busy: the cheapest prompt there is.
    const gpus = start.nodes.filter((node) => node.type === 'gpu').map((node) => node.id)
    let game = gpus.slice(1).reduce((current, id) => ok(Actions.sell(current, id)), start)
    game = ok(Actions.setGpuType(game, 'gpu1', 'h100'))
    for (let step = 0; step < 2; step += 1) game = ok(Actions.resize(game, 'gpu1', 1))
    return game
  },
  metastable: (start) =>
    servers(start).reduce(
      (game, id) => ok(Actions.setLinkPolicy(game, id, 'database', { breaker: true })),
      start,
    ),
  'regex-of-doom': (start) => start,
  'forty-three-seconds': (start) => start,
  'follow-the-sun': (start) => {
    // Each region sized for its own evening peak: South America's and Asia-Pacific's are smaller.
    const smaller = (game: Game, id: string, steps: number) => {
      let next = game
      for (let step = 0; step < steps; step += 1) next = ok(Actions.resize(next, id, -1))
      return next
    }
    const sized = servers(start).reduce((game, id) => smaller(game, id, 1), start)
    return smaller(smaller(sized, 'n3', 1), 'n2', 1)
  },
  'leap-second': (start) => {
    // A Load Balancer in Asia-Pacific that fails over to the North American App Servers.
    const placed = ok(Actions.place(start, 'lb', 300, 300, 'apac'))
    const lb = lastId(placed)
    let game = ok(Actions.connect(Actions.disconnect(placed, 'users-apac', 'n1'), 'users-apac', lb))
    for (const id of ['n1', 'server1', 'server2']) game = ok(Actions.connect(game, lb, id))
    return game
  },
  'rule-of-40': (start) => {
    // Every Node sized for the load it has, not the load someone hoped for.
    const target: ReadonlyArray<readonly [string, number]> = [
      ['server1', 3],
      ['server2', 3],
      ['n1', 3],
      ['wide', 2],
      ['search', 2],
      ['llm', 1],
    ]
    return target.reduce((game, [id, size]) => {
      let next = game
      while ((next.nodes.find((node) => node.id === id)?.size ?? size) > size)
        next = ok(Actions.resize(next, id, -1))
      return next
    }, start)
  },
  'postgres-for-everything': (start) => {
    // A Postgres big enough for search, files and timelines, and App Servers to match.
    let game = start
    for (let step = 0; step < 3; step += 1) game = ok(Actions.resize(game, 'database', 1))
    return servers(game).reduce((current, id) => ok(Actions.resize(current, id, 1)), game)
  },
  'five-nines': (start) => {
    // Three regions on Distributed SQL; in each, six App Servers across three zones.
    let game = ok(Actions.place(start, 'dsql', 900, 220))
    const store = lastId(game)
    game = ['wide', 'server1', 'server2'].reduce(
      (current, id) => ok(Actions.sell(current, id)),
      game,
    )
    const fleet = (from: Game, lb: string, region: 'na' | 'eu' | 'apac'): Game => {
      let next = ok(Actions.setHealthCheck(from, lb, { checkEvery: 2 }))
      for (const zone of ['a', 'a', 'b', 'b', 'c', 'c'] as const) {
        next = ok(Actions.place(next, 'server', 600, 300, region))
        const id = lastId(next)
        next = ok(Actions.setZone(ok(Actions.setRuntime(next, id, 'go')), id, zone))
        next = ok(Actions.resize(next, id, 1))
        for (const [a, b] of [
          [lb, id],
          [id, store],
          [id, 'psp'],
        ] as const)
          next = ok(Actions.connect(next, a, b))
      }
      return next
    }
    game = fleet(game, 'lb', 'na')
    for (const region of ['eu', 'apac'] as const) {
      game = ok(Actions.place(ok(Actions.openRegion(game, region)), 'lb', 300, 300, region))
      const lb = lastId(game)
      game = fleet(ok(Actions.connect(game, `users-${region}`, lb)), lb, region)
    }
    return ok(Actions.setSpread(game, store, true))
  },
  celebrity: (start) => ok(Actions.setSplit(start, 'wide', true)),
  'gone-from-the-internet': (start) => start,
  'the-typo': (start) => start,
  'exactly-once': (start) =>
    servers(start).reduce(
      (game, id) => ok(Actions.setLinkPolicy(game, id, 'psp', { timeout: 5 })),
      start,
    ),
}

/** What each reference does while it runs: the responses to its incidents. */
export const REFERENCE_ACTIONS: Record<string, Replay['actions']> = {
  // Disable the backtracking rule a second after the WAFs pin.
  'regex-of-doom': [{ step: 121, action: { _tag: 'Respond', response: 'disable-rule' } }],
  // Fence the old leader a second after the regions lose contact.
  'forty-three-seconds': [{ step: 121, action: { _tag: 'Respond', response: 'fence-leader' } }],
  'gone-from-the-internet': [
    { step: 121, action: { _tag: 'Respond', response: 'roll-back-routes' } },
  ],
  // Replace the Search Engine the command removed.
  'the-typo': [{ step: 121, action: { _tag: 'Replace', node: 'search' } }],
}

/** A replay of a Design on a Challenge. */
export const replayOf = (
  challenge: Challenge,
  game: Game,
  actions: Replay['actions'] = [],
): Replay => ({
  v: 1,
  challenge: challenge.id,
  simVersion: SIM_VERSION,
  design: designOf(game),
  actions,
})

/** The reference solution's replay. */
export const referenceReplay = (challenge: Challenge): Replay =>
  replayOf(
    challenge,
    REFERENCE[challenge.id]?.(challenge.start()) ?? challenge.start(),
    REFERENCE_ACTIONS[challenge.id],
  )
