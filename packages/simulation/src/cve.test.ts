import { describe, expect, test } from 'vitest'
import { CVE_EVERY, PATCH_GRACE, patchCost, patchWindow } from './catalog.ts'
import { preseedGame } from './company.ts'
import { overdueBy } from './cve.ts'
import { cancelItem, itemName } from './work.ts'
import { step } from './step.ts'
import type { Game } from './state.ts'

/* GDD 18 "CVEs and patches": a disclosure is a ticket with a deadline. */

/** No team builds and no incident rolls, so only the ticket moves the Company. */
const base = (): Game => ({
  ...preseedGame(),
  autopilot: false,
  teams: [],
  engineers: [],
  hires: [],
  nextIncidentAt: 1e9,
})

/** Steps until `done`, 1 s at a time. */
const run = (game: Game, until: (game: Game) => boolean, limit = 4000): Game => {
  let now = game
  for (let n = 0; n < limit && !until(now); n += 1) now = step(now, 1).game
  return now
}

const disclosed = (): Game => run(base(), (game) => game.backlog.some((i) => i.kind === 'patch'))

describe('disclosure', () => {
  test('a CVE becomes a patch ticket on the backlog, once', () => {
    const game = disclosed()
    const item = game.backlog[0]!
    expect(item.kind).toBe('patch')
    // It arrives as the clock crosses an interval, not at some other moment.
    expect(game.time % CVE_EVERY).toBeLessThan(2)
    expect(game.cves).toEqual([item.ref])
    expect(item.cost).toBeGreaterThanOrEqual(2)
    expect(itemName(item)).toMatch(/^Patch /)
    // The next interval draws a CVE that is not the same one.
    const later = run(game, (g) => g.cves.length > 1, 2000)
    expect(new Set(later.cves).size).toBe(later.cves.length)
  })

  test('a Design that runs nothing affected is never exposed', () => {
    const empty: Game = { ...base(), nodes: base().nodes.filter((n) => n.type === 'users') }
    const game = run(empty, (g) => g.time > CVE_EVERY * 3, 2000)
    expect(game.cves).toEqual([])
  })

  test('a Sandbox gets no tickets', () => {
    const game = run({ ...base(), sandbox: true }, (g) => g.time > CVE_EVERY * 2, 1500)
    expect(game.backlog.filter((i) => i.kind === 'patch')).toEqual([])
  })
})

describe('deadline', () => {
  test('a ticket is overdue after its deadline and cannot be cancelled', () => {
    const game = disclosed()
    const item = game.backlog[0]!
    expect(overdueBy(game, item)).toBe(0)
    expect(cancelItem(game, item.id)._tag).toBe('Failure')
    const late = run(game, (g) => g.time > item.due! + 10, 2000)
    expect(
      overdueBy(
        late,
        late.backlog.find((i) => i.id === item.id)!,
      ),
    ).toBeGreaterThan(9)
  })

  test('a ticket that stays overdue is exploited: Data breach, users lost, ticket gone', () => {
    const game = disclosed()
    const item = game.backlog[0]!
    const before = run(game, (g) => g.time >= item.due! + PATCH_GRACE - 1, 2000)
    expect(before.incident?.kind).not.toBe('breach')
    const users = before.users
    const hit = run(before, (g) => g.incident?.kind === 'breach', 20)
    expect(hit.incident?.severity).toBe(1)
    expect(hit.backlog.some((i) => i.id === item.id)).toBe(false)
    expect(hit.users).toBeLessThan(users * 0.9)
  })

  test('a patch built in time ends the clock and starts no incident', () => {
    const game = disclosed()
    const item = game.backlog[0]!
    const paid: Game = {
      ...game,
      backlog: game.backlog.map((i) => (i.id === item.id ? { ...i, spent: i.cost } : i)),
    }
    const done = run(paid, (g) => g.time > item.due! + PATCH_GRACE + 5, 3000)
    expect(done.backlog.some((i) => i.kind === 'patch' && i.id === item.id)).toBe(false)
    expect(done.incident?.kind).not.toBe('breach')
  })

  test('cost and window follow the score', () => {
    expect(patchCost(9.9)).toBe(5)
    expect(patchCost(5.3)).toBe(3)
    expect(patchWindow(9.9)).toBeLessThan(patchWindow(5.3))
  })
})
