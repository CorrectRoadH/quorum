import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import type { Action } from './actions.ts'
import { MIRROR_TIME, REFRESH_TIME, RESEARCH_IDS, STAGE_WAIT, SYNC_POLL } from './catalog.ts'
import { company, link, node } from './company.ts'
import { forceIncident } from './director.ts'
import {
  applyCost,
  applyMirror,
  driftOf,
  mirrorOf,
  pickIacTool,
  refreshMirror,
  repairMirror,
  setComputed,
  setMirrorData,
  setOverride,
  setSyncMode,
  startMirror,
} from './mirror.ts'
import { solveFlow } from './solve.ts'
import type { Game, GameNode } from './state.ts'
import { step } from './step.ts'

/* Mirrors (05 "Mirror a region"): Apply, drift, overrides, IaC tools, and GitOps. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const refused = (action: Action): string => {
  if (Result.isSuccess(action)) throw new Error('expected a refusal')
  return JSON.stringify(action.failure)
}

/** A Series C Company in North America with an LB, two App Servers, a Database, and Object Storage. */
const home = (): Game => ({
  ...company(7),
  stage: 5,
  cash: 10_000_000,
  users: 1_000_000,
  userShares: { na: 0.8, eu: 0.1, apac: 0.06, sa: 0.04 },
  researched: RESEARCH_IDS,
  nodes: [
    node('users', 'users', 120, 280),
    node('lb', 'lb', 280, 280),
    node('s1', 'server', 440, 200, { size: 5, runtime: 'go' }),
    node('s2', 'server', 440, 360, { size: 5, runtime: 'go' }),
    node('db', 'database', 760, 200, { size: 6 }),
    node('blob', 'storage', 760, 360),
    node('psp', 'psp', 760, 520),
  ],
  links: [
    link('users', 'lb'),
    link('lb', 's1'),
    link('lb', 's2'),
    link('s1', 'db'),
    link('s2', 'db'),
    link('s1', 'blob'),
    link('s1', 'psp'),
  ],
})

const run = (game: Game, seconds: number): Game => {
  let next = game
  for (let at = 0; at < seconds * 10; at += 1) next = step(next, 0.1).game
  return next
}

const mirrored = (tool: 'terraform' | 'pulumi' | 'alchemy' = 'terraform'): Game => {
  const picked = ok(pickIacTool(home(), tool))
  return ok(startMirror(picked, 'eu', 'na'))
}

/** Runs until every Apply has landed. */
const settle = (game: Game): Game => {
  const ready = Math.max(0, ...(game.mirrors ?? []).map((mirror) => mirror.readyAt ?? 0))
  return ready > game.time ? run(game, ready - game.time + 0.1) : game
}

const landed = (tool: 'terraform' | 'pulumi' | 'alchemy' = 'terraform'): Game =>
  settle(ok(applyMirror(mirrored(tool), 'eu')))

const euNodes = (game: Game): ReadonlyArray<GameNode> =>
  game.nodes.filter((entry) => entry.region === 'eu')

const copyOf = (game: Game, source: string): GameNode => {
  const id = mirrorOf(game, 'eu')?.nodes[source]
  const found = game.nodes.find((entry) => entry.id === id)
  if (!found) throw new Error(`no copy of ${source}`)
  return found
}

describe('Mirror a region', () => {
  test('Apply pays now and the copies arrive cold after the apply time', () => {
    const game = mirrored()
    const plan = driftOf(game, mirrorOf(game, 'eu') as never)
    // LB, two App Servers, a read replica of the Database, and a copy of Object Storage.
    expect(plan.changes.filter((change) => change._tag === 'create')).toHaveLength(5)
    const cost = applyCost(game, mirrorOf(game, 'eu') as never)
    expect(cost).toBeGreaterThan(0)
    const applied = ok(applyMirror(game, 'eu'))
    expect(applied.cash).toBe(game.cash - cost)
    expect(euNodes(applied).map((entry) => entry.type)).toEqual(['users'])
    // Terraform refreshes the five copies it will manage before it builds them.
    expect(mirrorOf(applied, 'eu')?.readyAt).toBe(MIRROR_TIME + 5 * REFRESH_TIME)

    const after = settle(applied)
    const types = euNodes(after)
      .map((entry) => entry.type)
      .toSorted()
    expect(types).toEqual(['lb', 'replica', 'server', 'server', 'storage', 'users'])
    // The Database's copy is a read replica: reads stay in Europe, writes cross to the primary.
    const replica = copyOf(after, 'db')
    const server = copyOf(after, 's1')
    expect(server.size).toBe(5)
    expect(server.runtime).toBe('go')
    const out = after.links.filter((entry) => entry.from === server.id).map((entry) => entry.to)
    expect(out.toSorted()).toEqual([replica.id, 'db', copyOf(after, 'blob').id, 'psp'].toSorted())
    expect(after.links.some((entry) => entry.from === 'users-eu')).toBe(true)
    expect(driftOf(after, mirrorOf(after, 'eu') as never).changes).toEqual([])
  })

  test('with GeoDNS, European reads stay on the local replica', () => {
    const game = landed()
    const ledger = solveFlow(run(game, 60))
    expect(ledger.nodes[copyOf(game, 'db').id]?.inbound ?? 0).toBeGreaterThan(0)
    expect(ledger.nodes[copyOf(game, 's1').id]?.inbound ?? 0).toBeGreaterThan(0)
  })

  test('an own primary copies the Database; calling the source copies nothing', () => {
    const primary = settle(
      ok(applyMirror(ok(setMirrorData(mirrored(), 'eu', 'db', 'primary')), 'eu')),
    )
    expect(copyOf(primary, 'db').type).toBe('database')
    const calling = settle(ok(applyMirror(ok(setMirrorData(mirrored(), 'eu', 'db', 'call')), 'eu')))
    expect(
      euNodes(calling).some((entry) => entry.type === 'database' || entry.type === 'replica'),
    ).toBe(false)
    expect(
      calling.links.some((entry) => entry.from === copyOf(calling, 's1').id && entry.to === 'db'),
    ).toBe(true)
  })
})

describe('drift', () => {
  test('a source resize is behind; a resize on the Mirror is a hand change; Apply fixes both', () => {
    const game = landed()
    const behind = ok(Actions.resize(game, 's1', 1))
    const both = ok(Actions.resize(behind, copyOf(game, 's2').id, -1))
    const drift = driftOf(both, mirrorOf(both, 'eu') as never)
    expect([drift.behind, drift.hand]).toEqual([1, 1])
    const synced = settle(ok(applyMirror(both, 'eu')))
    expect(copyOf(synced, 's1').size).toBe(6)
    expect(copyOf(synced, 's2').size).toBe(5)
    expect(driftOf(synced, mirrorOf(synced, 'eu') as never).changes).toEqual([])
  })

  test('an override is not drift', () => {
    const game = landed()
    const id = copyOf(game, 's2').id
    const smaller = ok(Actions.resize(game, id, -1))
    const kept = ok(setOverride(smaller, 'eu', id, 'size', true))
    expect(driftOf(kept, mirrorOf(kept, 'eu') as never).hand).toBe(0)
    expect(copyOf(settle(ok(applyMirror(kept, 'eu'))), 's2').size).toBe(4)
  })

  test('a new data Node stops the plan; a sold one stays until the player confirms', () => {
    const game = landed()
    const added = ok(Actions.place(game, 'storage', 900, 500, 'na'))
    expect(refused(applyMirror(added, 'eu'))).toContain('data Node')
    const picked = ok(setMirrorData(added, 'eu', `n${game.nextId}`, 'call'))
    expect(Result.isSuccess(applyMirror(picked, 'eu'))).toBe(true)

    const sold = ok(Actions.sell(game, 'blob'))
    const drift = driftOf(sold, mirrorOf(sold, 'eu') as never)
    expect(drift.data).toBe(1)
    const blob = copyOf(game, 'blob').id
    expect(settle(ok(applyMirror(sold, 'eu'))).nodes.some((entry) => entry.id === blob)).toBe(true)
    expect(settle(ok(applyMirror(sold, 'eu', true))).nodes.some((entry) => entry.id === blob)).toBe(
      false,
    )
  })
})

describe('IaC tools', () => {
  const handResized = (tool: 'terraform' | 'pulumi' | 'alchemy'): Game => {
    const game = landed(tool)
    return ok(Actions.resize(game, copyOf(game, 's2').id, -1))
  }

  test('Terraform plans see a hand change at once; its Apply waits for the refresh', () => {
    const game = handResized('terraform')
    expect(driftOf(game, mirrorOf(game, 'eu') as never).hand).toBe(1)
    const applied = ok(applyMirror(game, 'eu'))
    expect(copyOf(applied, 's2').size).toBe(4)
    expect(copyOf(settle(applied), 's2').size).toBe(5)
  })

  test('Pulumi plans against recorded state: a hand change stays until a refresh reads it', () => {
    const game = handResized('pulumi')
    expect(driftOf(game, mirrorOf(game, 'eu') as never).hand).toBe(0)
    expect(copyOf(settle(ok(applyMirror(game, 'eu'))), 's2').size).toBe(4)
    const refreshed = ok(refreshMirror(game, 'eu'))
    expect(driftOf(refreshed, mirrorOf(refreshed, 'eu') as never).hand).toBe(1)
    expect(copyOf(settle(ok(applyMirror(refreshed, 'eu'))), 's2').size).toBe(5)
    expect(refused(refreshMirror(landed('terraform'), 'eu'))).toContain('every plan')
  })

  test('Alchemy repair restores hand changes to the last deploy and leaves source changes for Apply', () => {
    const game = ok(Actions.resize(handResized('alchemy'), 's1', 1))
    const repaired = ok(repairMirror(game, 'eu'))
    expect(copyOf(repaired, 's2').size).toBe(5)
    expect(copyOf(repaired, 's1').size).toBe(5)
    expect(driftOf(repaired, mirrorOf(repaired, 'eu') as never).behind).toBe(1)
    expect(refused(repairMirror(landed('pulumi'), 'eu'))).toContain('no repair')
  })

  test('computed values size a Mirror for its share of users', () => {
    const game = ok(setComputed(landed('pulumi'), 'eu', true))
    // Europe has an eighth of North America's users: three size steps down.
    expect(copyOf(settle(ok(applyMirror(game, 'eu'))), 's1').size).toBe(2)
  })

  test('a move to another tool stops every sync for a calendar day', () => {
    const game = ok(pickIacTool(landed(), 'pulumi'))
    expect(refused(applyMirror(ok(Actions.resize(game, 's1', 1)), 'eu'))).toContain(
      'moving to Pulumi',
    )
  })
})

describe('GitOps', () => {
  test('all at once syncs at the next poll; staged waits the stage time', () => {
    const changed = (sync: 'all' | 'staged'): Game =>
      ok(Actions.resize(ok(setSyncMode(landed(), sync)), 's1', 1))
    const all = changed('all')
    expect(copyOf(run(all, SYNC_POLL + 5 * REFRESH_TIME + 1), 's1').size).toBe(6)
    const staged = changed('staged')
    expect(copyOf(run(staged, SYNC_POLL + 5 * REFRESH_TIME + 1), 's1').size).toBe(5)
    expect(copyOf(run(staged, STAGE_WAIT + 5 * REFRESH_TIME + 1), 's1').size).toBe(6)
  })

  test('a hand change reverts at the next sync, even with a tool that plans against recorded state', () => {
    const game = ok(setSyncMode(landed('pulumi'), 'all'))
    const id = copyOf(game, 's2').id
    expect(copyOf(run(ok(Actions.resize(game, id, -1)), SYNC_POLL + 1), 's2').size).toBe(5)
  })

  test('a Bad config push reaches every Mirror all at once, and one region staged', () => {
    const push = (sync: 'all' | 'staged'): Game => {
      const game = ok(setSyncMode(landed(), sync))
      const hit = forceIncident(game, solveFlow(game), 'config')
      if (!hit) throw new Error('no push')
      return hit
    }
    const downIn = (game: Game, region: string): number =>
      game.nodes.filter(
        (entry) => entry.type === 'server' && entry.region === region && entry.down > 0,
      ).length
    const all = push('all')
    expect([downIn(all, 'na'), downIn(all, 'eu')]).toEqual([2, 2])
    const staged = push('staged')
    expect([downIn(staged, 'na'), downIn(staged, 'eu')]).toEqual([2, 0])
    // Roll back: the servers restart on the old config instead of waiting out the incident.
    const rolled = step(ok(Actions.rollBackConfig(all)), 0.1).game
    expect(rolled.incident).toBeNull()
    expect(
      Math.max(
        ...rolled.nodes.filter((entry) => entry.type === 'server').map((entry) => entry.down),
      ),
    ).toBeLessThan(60)
  })
})
