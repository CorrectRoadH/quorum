import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import type { Action } from './actions.ts'
import { CALENDAR_DURATION, ERAS, INCIDENTS, RESEARCH_IDS, type ResearchId } from './catalog.ts'
import { company, link, node } from './company.ts'
import { attemptsFor } from './distribution.ts'
import { forceIncident, incidentDuration } from './director.ts'
import type { Ledger } from './ledger.ts'
import { GUIDED } from './sandbox.ts'
import { budgetFailures } from './slo.ts'
import { solve } from './solve.ts'
import type { Game, GameNode } from './state.ts'
import { step } from './step.ts'

/* Series B (10 "Era 4: Series B"): exports, reports and AI; retries, breakers and shedding. */

const ok = (action: Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const ALL: ReadonlyArray<ResearchId> = RESEARCH_IDS

/** A flat-demand Series B board: one Go App Server, a Database, and whatever else the test adds. */
const seriesB = (
  users: number,
  extra: ReadonlyArray<GameNode> = [],
  links: ReadonlyArray<readonly [string, string]> = [],
  server: Partial<GameNode> = {},
): Game => ({
  ...company(11),
  sandbox: true,
  stage: 4,
  users,
  researched: ALL,
  nodes: [
    node('users', 'users', 120, 280),
    node('server', 'server', 440, 280, { size: 4, runtime: 'go', ...server }),
    node('database', 'database', 760, 200, { size: 4 }),
    node('storage', 'storage', 760, 360),
    node('psp', 'psp', 760, 520),
    ...extra,
  ],
  links: [
    link('users', 'server'),
    link('server', 'database'),
    link('server', 'storage'),
    link('server', 'psp'),
    ...links.map(([from, to]) => link(from, to)),
  ],
})

const settle = (game: Game, seconds: number): Game => {
  let current = game
  for (let elapsed = 0; elapsed < seconds; elapsed += 1) current = step(current, 1).game
  return current
}

const LLM: ReadonlyArray<GameNode> = [node('llm', 'llm', 760, 680)]
const WITH_LLM: ReadonlyArray<readonly [string, string]> = [['server', 'llm']]

describe('the Series B Era', () => {
  test('raises at 1,000,000 users for $18M into Series C', () => {
    expect(ERAS[4]?.raiseAt).toBe(1_000_000)
    expect(ERAS[4]?.grant).toBe(18_000_000)
    expect(ERAS[5]?.name).toBe('Series C')
    const mix = Object.values(ERAS[4]?.mix ?? {}).reduce((sum, share) => sum + (share ?? 0), 0)
    expect(mix).toBeCloseTo(1, 9)
  })
})

describe('reports', () => {
  test('a report on the primary slows every kind; a Data Warehouse takes it off', () => {
    const primary = solve(seriesB(8_000, LLM, WITH_LLM))
    const warehoused = solve(
      seriesB(
        8_000,
        [...LLM, node('warehouse', 'warehouse', 1_000, 200)],
        [...WITH_LLM, ['server', 'warehouse']],
      ),
    )
    // Scans evict the buffer cache: API reads wait on disk.
    expect(warehoused.kinds.read?.mean ?? 0).toBeLessThan(primary.kinds.read?.mean ?? 0)
    expect(warehoused.nodes.database?.utilization ?? 0).toBeLessThan(
      primary.nodes.database?.utilization ?? 0,
    )
    // The Warehouse bills per scan.
    expect(warehoused.fees).toBeGreaterThan(primary.fees)
  })

  test('a quarter-end report overloads the primary until it is cancelled', () => {
    const game = seriesB(8_000, LLM, WITH_LLM)
    const hit = forceIncident(game, solve(game), 'report-db') as Game
    expect(solve(hit).nodes.database?.utilization ?? 0).toBeGreaterThan(1)
    const cancelled = step(ok(Actions.cancelReport(hit)), 1).game
    expect(cancelled.incident).toBeNull()
  })
})

describe('exports', () => {
  test('through a Queue, users wait for an acknowledgement and a Worker reads the data', () => {
    const inline = solve(seriesB(8_000, LLM, WITH_LLM))
    const queued = solve(
      seriesB(
        8_000,
        [
          ...LLM,
          node('queue', 'queue', 600, 60),
          node('worker', 'worker', 880, 60, { size: 3, runtime: 'go' }),
        ],
        [...WITH_LLM, ['server', 'queue'], ['queue', 'worker'], ['worker', 'database']],
      ),
    )
    expect(queued.kinds.job?.mean ?? 0).toBeLessThan((inline.kinds.job?.mean ?? 0) / 10)
    // The Worker sends the export's 50 reads.
    expect(queued.nodes.worker?.out['q-read'] ?? 0).toBeGreaterThan(0)
    expect(queued.nodes.worker?.stranded ?? 1).toBe(0)
  })
})

describe('AI prompts', () => {
  test('the LLM API throttles past its rate limit; a bigger tier takes the load', () => {
    const big = seriesB(200_000, LLM, WITH_LLM, { size: 8 })
    const small = solve(big)
    expect(small.errors.throttled).toBeGreaterThan(0)
    const tier = ok(Actions.resize(ok(Actions.resize(big, 'llm', 1)), 'llm', 1))
    expect(solve(tier).errors.throttled).toBeLessThan(small.errors.throttled)
  })

  test('a busy GPU Node costs less per prompt than the LLM API; an idle one costs more', () => {
    const gpuAt = (users: number) =>
      solve(seriesB(users, [node('gpu', 'gpu', 760, 680, { gpu: 'h100' })], [['server', 'gpu']]))
    const llmAt = (users: number) => solve(seriesB(users, LLM, WITH_LLM))
    const perPrompt = (ledger: Ledger, nodeCost: number) =>
      nodeCost / Math.max(1e-9, ledger.kinds.ai?.rate ?? 0)
    const base = (users: number) => solve(seriesB(users))
    // Busy: 20 prompts a second on one H100 size step.
    const busyGpu = gpuAt(20_000).burn - base(20_000).burn
    const busyLlm = llmAt(20_000).burn - base(20_000).burn
    expect(perPrompt(gpuAt(20_000), busyGpu)).toBeLessThan(perPrompt(llmAt(20_000), busyLlm))
    const idleGpu = gpuAt(1_000).burn - base(1_000).burn
    const idleLlm = llmAt(1_000).burn - base(1_000).burn
    expect(idleGpu).toBeGreaterThan(idleLlm)
  })

  test('a GPU shortage takes a GPU Node down and keeps H100s off the board', () => {
    const game = seriesB(
      8_000,
      [node('gpu', 'gpu', 760, 680, { gpu: 'a100' })],
      [['server', 'gpu']],
    )
    const hit = forceIncident(game, solve(game), 'gpu-shortage') as Game
    expect(hit.nodes.find((entry) => entry.id === 'gpu')?.down ?? 0).toBeGreaterThan(0)
    expect(Result.isFailure(Actions.setGpuType(hit, 'gpu', 'h100'))).toBe(true)
  })
})

describe('retries, breakers and shedding', () => {
  test('naive retries at 50% failure nearly double the callee load; backoff keeps 10%', () => {
    expect(attemptsFor(0.5)).toBeCloseTo(1.875, 9)
    const base = seriesB(30_000, LLM, WITH_LLM, { size: 6 })
    const retrying = (retries: 'naive' | 'backoff'): Game => ({
      ...base,
      links: base.links.map((entry) =>
        entry.to === 'database' ? { ...entry, timeout: 1, retries } : entry,
      ),
    })
    const plain = solve(base).nodes.database?.inbound ?? 0
    const naive = settle(retrying('naive'), 5)
    const backoff = settle(retrying('backoff'), 5)
    const naiveIn = solve(naive).nodes.database?.inbound ?? 0
    const backoffIn = solve(backoff).nodes.database?.inbound ?? 0
    expect(naiveIn).toBeGreaterThan(plain * 1.2)
    expect(backoffIn).toBeLessThanOrEqual(plain * 1.1 + 1e-6)
  })

  test('a retry storm outlives its trigger with naive retries and ends with a breaker', () => {
    const start = GUIDED['retry-storm'].start()
    const stormed = (game: Game) =>
      settle(forceIncident(game, solve(game), 'retry-storm') as Game, 90)
    expect(solve(stormed(start)).errorShare).toBeGreaterThan(0.1)
    const broken = ['server1', 'server2'].reduce(
      (game, id) => ok(Actions.setLinkPolicy(game, id, 'database', { breaker: true })),
      start,
    )
    expect(solve(stormed(broken)).errorShare).toBeLessThan(0.01)
  })

  test('a retried charge without idempotency keys fails as duplicate', () => {
    const base = seriesB(8_000, LLM, WITH_LLM)
    const retried: Game = {
      ...base,
      links: base.links.map((entry) =>
        entry.to === 'psp' ? { ...entry, timeout: 1, retries: 'naive' as const } : entry,
      ),
    }
    const keyless = { ...retried, researched: ALL.filter((id) => id !== 'idempotency-keys') }
    const hit = forceIncident(keyless, solve(keyless), 'double-charge') as Game
    expect(solve(hit).errors.duplicate).toBeGreaterThan(0)
    const keyed = forceIncident(retried, solve(retried), 'double-charge') as Game
    expect(solve(keyed).errors.duplicate).toBe(0)
  })

  test('load shedding drops the lowest-value kinds first and keeps checkouts', () => {
    const hot = seriesB(30_000, LLM, WITH_LLM, { size: 2 })
    const shed = ok(Actions.setShed(hot, 'server', true))
    const before = solve(hot)
    const after = solve(shed)
    expect(after.kinds.buy?.success ?? 0).toBeGreaterThan(before.kinds.buy?.success ?? 0)
    expect(after.kinds.rt?.success ?? 1).toBeLessThan(after.kinds.buy?.success ?? 0)
  })
})

describe('garbage collection', () => {
  test('ZGC removes the pause tail that G1 adds in a GC pause storm', () => {
    const start = GUIDED['gc-pauses'].start()
    const zgc = ['server1', 'server2'].reduce(
      (game, id) => ok(Actions.setCollector(game, id, 'zgc')),
      start,
    )
    const storm = (game: Game) => {
      const warm = settle(game, 60)
      return solve(forceIncident(warm, solve(warm), 'gc-storm') as Game)
    }
    expect(storm(zgc).kinds.read?.p99 ?? 0).toBeLessThan((storm(start).kinds.read?.p99 ?? 0) * 0.85)
  })
})

describe('the SLO is winnable', () => {
  test('from Series A, an incident runs at most 5, 20 or 60 sim seconds by severity', () => {
    const game = { ...seriesB(8_000), sandbox: false }
    expect(incidentDuration(game, 'zone')).toBe(CALENDAR_DURATION[2])
    expect(incidentDuration(game, 'spike')).toBe(CALENDAR_DURATION[3])
    expect(incidentDuration({ ...game, stage: 1 }, 'zone')).toBe(INCIDENTS.zone.duration)
    expect(incidentDuration({ ...game, sandbox: true }, 'zone')).toBe(INCIDENTS.zone.duration)
  })

  test('an instance failure on a Node with a standby fails over instead of waiting for a replacement', () => {
    const game: Game = {
      ...seriesB(8_000, LLM, WITH_LLM),
      sandbox: false,
      nodes: seriesB(8_000, LLM, WITH_LLM).nodes.map((entry) =>
        entry.id === 'database' ? { ...entry, standby: true } : entry,
      ),
    }
    const hit = forceIncident(game, solve(game), 'instance', 'database') as Game
    const down = hit.nodes.find((entry) => entry.id === 'database')?.down ?? 0
    expect(down).toBeGreaterThan(0)
    expect(down).toBeLessThan(CALENDAR_DURATION[3] + 1)
  })

  test('a real user the WAF blocks does not spend the error budget', () => {
    const ledger = solve(
      seriesB(
        8_000,
        [...LLM, node('waf', 'waf', 280, 280, { paranoia: 4, size: 4 })],
        [...WITH_LLM, ['users', 'waf'], ['waf', 'server']],
      ),
    )
    expect(ledger.errors.blocked).toBeGreaterThan(0)
    expect(budgetFailures(ledger)).toBeLessThan(ledger.errorShare * ledger.demand)
  })
})

describe('Disk full', () => {
  test('writes fail until the volume is expanded', () => {
    const game = seriesB(8_000, LLM, WITH_LLM)
    const hit = forceIncident(game, solve(game), 'disk-full') as Game
    expect(solve(hit).kinds.write?.success ?? 1).toBe(0)
    const fixed = step(ok(Actions.expandVolume(hit)), 1).game
    expect(fixed.incident).toBeNull()
  })
})
