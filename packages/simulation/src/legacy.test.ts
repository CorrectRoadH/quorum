import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import { decline, place, raise, setRuntime } from './actions.ts'
import {
  ERAS,
  EXIT_MUTATORS,
  MUTATOR_IDS,
  PERKS,
  PERK_IDS,
  PLAYBOOK_SLOTS,
  VENTURE_IDS,
} from './catalog.ts'
import { newGame } from './company.ts'
import { exitOffers, ipoExit, legacyOf, takeExit } from './exit.ts'
import {
  buyPerk,
  emptyFounder,
  foundingOf,
  playbookSlots,
  recordExit,
  savePlaybook,
  toggleKeep,
  toggleMutator,
  unlockVenture,
  type Founder,
} from './founder.ts'
import { foundCompany, legacyMultiplier } from './founding.ts'
import { budgetOf } from './slo.ts'
import { solveFlow } from './solve.ts'
import { growthOf } from './step.ts'
import { Schema } from 'effect'
import { Founder as FounderSchema } from './founder.ts'
import type { Founding, Game } from './state.ts'

/* Exits, Legacy, the Founder record, perks, Ventures and Mutators (13). */

const founding = (change: Partial<Founding> = {}): Founding => ({
  venture: 'b2b-saas',
  mutators: [],
  perks: {},
  ...change,
})

/** A Company at a stage, with users and Cash to spare. */
const at = (stage: number, game: Game = newGame(7)): Game => ({
  ...game,
  stage,
  users: Math.max(game.users, (ERAS[stage - 1]?.raiseAt ?? 150) * 1.1),
  cash: 1e9,
  researched: [...game.researched, 'stripe'],
})

const rich = (legacy: number): Founder => ({ ...emptyFounder(), legacy })

describe('Legacy', () => {
  test('matches the GDD table: $1M→1, $100M→10, $1B→31, $10B→100, $100B→316', () => {
    expect(legacyOf(1e6)).toBe(1)
    expect(legacyOf(1e8)).toBe(10)
    expect(legacyOf(1e9)).toBe(31)
    expect(legacyOf(1e10)).toBe(100)
    expect(legacyOf(1e11)).toBe(316)
  })

  test('the Venture and Mutators multiply it', () => {
    expect(legacyMultiplier(founding())).toBe(1)
    const hard = founding({ venture: 'fintech', mutators: ['no-caches', 'tight-budget'] })
    expect(legacyMultiplier(hard)).toBeCloseTo(1.3 * 1.6)
    expect(legacyOf(1e8, legacyMultiplier(hard))).toBe(20)
  })
})

describe('Exits', () => {
  test('none before Series A; Acqui-hire from Series A; Acquisition from Series B; only Step down once Public', () => {
    const ids = (stage: number) => {
      const game = at(stage)
      return exitOffers(game, solveFlow(game)).map((offer) => offer.id)
    }
    expect(ids(2)).toEqual([])
    expect(ids(3)).toEqual(['acqui-hire'])
    expect(ids(4)).toEqual(['acqui-hire', 'acquisition'])
    expect(ids(7)).toEqual(['step-down'])
  })

  test('an Acqui-hire pays on at most $50M, at half', () => {
    const game = { ...at(3), users: 10_000_000 }
    const offer = exitOffers(game, solveFlow(game)).find((entry) => entry.id === 'acqui-hire')
    expect(offer?.valuation).toBeLessThanOrEqual(50_000_000)
    expect(offer?.multiplier).toBe(0.5)
    expect(offer?.payout).toBeCloseTo(game.equity * (offer?.valuation ?? 0) * 0.5)
  })

  test('an Exit writes one history row and adds its Legacy to the Founder', () => {
    const game = at(4)
    const result = takeExit(game, solveFlow(game), 'acquisition')
    expect(Result.isSuccess(result)).toBe(true)
    if (!Result.isSuccess(result)) return
    const founder = recordExit(emptyFounder(), result.success)
    expect(founder.history).toHaveLength(1)
    expect(founder.history[0]?.exit).toBe('acquisition')
    expect(founder.history[0]?.snapshot.nodes.length).toBe(game.nodes.length)
    expect(founder.legacy).toBe(result.success.legacy)
    expect(founder.mutators).toEqual(EXIT_MUTATORS)
    expect(founder.ventures).not.toContain('bootstrapped')
    // A record from before achievements keeps what its first Exit opened.
    const old = { ...emptyFounder(), ventures: [...VENTURE_IDS], mutators: [...MUTATOR_IDS] }
    const again = recordExit(old, result.success)
    expect(again.ventures).toEqual(VENTURE_IDS)
    expect(again.mutators).toEqual(MUTATOR_IDS)
  })

  test('the IPO banks its Legacy, and Step down pays only the rest', () => {
    const listed = ipoExit(at(6), solveFlow(at(6)))
    expect(listed.game.banked).toBe(listed.legacy)
    const publicGame = { ...listed.game, stage: 7 }
    const offer = exitOffers(publicGame, solveFlow(publicGame))[0]
    expect(offer?.legacy).toBe(Math.max(0, legacyOf(offer?.payout ?? 0) - listed.legacy))
  })

  test('a Sandbox has no Exit', () => {
    const game = { ...at(4), sandbox: true }
    expect(exitOffers(game, solveFlow(game))).toEqual([])
  })
})

describe('the Founder record', () => {
  test('decodes from an empty object, so an old player starts empty', () => {
    const founder = Schema.decodeUnknownSync(FounderSchema)({})
    expect(founder.legacy).toBe(0)
    expect(founder.ventures).toEqual(['b2b-saas'])
    expect(founder.history).toEqual([])
  })

  test('perk prices follow GDD 13, and a perk stops at its top level', () => {
    expect(PERKS['angel-network'].costs).toEqual([2, 4, 8, 16, 32])
    expect(PERKS['alumni-network'].costs).toEqual([3, 6, 12, 24, 48])
    expect(PERKS['better-terms'].costs).toEqual([6, 12, 24, 48, 96])
    expect(PERKS['night-shift'].costs).toEqual([5, 15, 45])
    expect(PERKS.playbooks.costs).toEqual([5, 15, 45, 135])
    expect(PERKS['war-stories'].costs).toEqual([8, 24, 72])
    expect(PERKS['time-dilation'].costs).toEqual([20, 80])
    let founder = rich(2_000)
    for (const id of PERK_IDS)
      for (const _ of PERKS[id].costs) founder = Result.getOrThrow(buyPerk(founder, id))
    expect(Result.isFailure(buyPerk(founder, 'angel-network'))).toBe(true)
    expect(Result.isFailure(buyPerk(rich(1), 'angel-network'))).toBe(true)
  })

  test('Ventures cost Legacy; Mutators open with the first Exit', () => {
    expect(Result.isFailure(unlockVenture(rich(4), 'consumer-social'))).toBe(true)
    const social = Result.getOrThrow(unlockVenture(rich(5), 'consumer-social'))
    expect(social.legacy).toBe(0)
    expect(foundingOf(social).venture).toBe('consumer-social')
    expect(Result.isFailure(toggleMutator(emptyFounder(), 'no-caches'))).toBe(true)
  })

  test('Playbook slots and kept research follow their perks', () => {
    expect(playbookSlots(emptyFounder())).toBe(PLAYBOOK_SLOTS[0])
    const playbook = { name: 'P', nodes: [], links: [] }
    const one = Result.getOrThrow(savePlaybook(emptyFounder(), playbook))
    expect(Result.isFailure(savePlaybook(one, playbook))).toBe(true)
    const more = { ...one, perks: { playbooks: 1 } }
    expect(Result.isSuccess(savePlaybook(more, playbook))).toBe(true)
    expect(Result.isFailure(toggleKeep(emptyFounder(), 'caching'))).toBe(true)
    const keeper = { ...emptyFounder(), perks: { 'institutional-knowledge': 1 } }
    const kept = Result.getOrThrow(toggleKeep(keeper, 'caching'))
    expect(Result.isFailure(toggleKeep(kept, 'pooling'))).toBe(true)
    expect(foundCompany(1, founding(), kept.keep).researched).toContain('caching')
  })
})

describe('perks in a new Company', () => {
  const plain = foundCompany(3, founding())

  test('a new Company with no perks is the Garage', () => {
    expect(plain.nodes).toEqual(newGame(3).nodes)
    expect(plain.cash).toBe(newGame(3).cash)
  })

  test('Angel network doubles starting Cash per level', () => {
    expect(foundCompany(3, founding({ perks: { 'angel-network': 2 } })).cash).toBe(plain.cash * 4)
  })

  test('Head start starts in Pre-seed; Alumni network adds engineers there', () => {
    const start = foundCompany(3, founding({ perks: { 'head-start': 1, 'alumni-network': 2 } }))
    expect(start.stage).toBe(1)
    expect(start.engineers).toHaveLength(2)
    const garage = foundCompany(3, founding({ perks: { 'alumni-network': 1 } }))
    expect(garage.engineers).toHaveLength(0)
    const raised = Result.getOrThrow(raise({ ...garage, users: 2_000 }))
    expect(raised.engineers).toHaveLength(1)
  })

  test('Pattern recognition raises Insight; Founder’s reputation raises growth', () => {
    const sharp = { ...plain, founding: founding({ perks: { 'pattern-recognition': 2 } }) }
    expect(solveFlow(sharp).insight).toBeCloseTo(solveFlow(plain).insight * 1.4)
    const known = { ...plain, founding: founding({ perks: { 'founders-reputation': 1 } }) }
    expect(growthOf(known, solveFlow(known))).toBeCloseTo(growthOf(plain, solveFlow(plain)) * 1.1)
  })

  test('Better terms takes 2 points off each round’s dilution', () => {
    const ready = { ...plain, users: 2_000 }
    const better = { ...ready, founding: founding({ perks: { 'better-terms': 2 } }) }
    const dilution = ERAS[0]?.dilution ?? 0
    expect(Result.getOrThrow(raise(better)).equity).toBeCloseTo(1 - (dilution - 0.04))
  })

  test('a Sandbox ignores every perk', () => {
    const sandbox = {
      ...plain,
      sandbox: true,
      founding: founding({ perks: { 'pattern-recognition': 5 } }),
    }
    expect(solveFlow(sandbox).insight).toBeCloseTo(solveFlow({ ...plain, sandbox: true }).insight)
  })
})

describe('Ventures and Mutators', () => {
  test('the default Venture leaves demand as it was', () => {
    expect(solveFlow(foundCompany(5, founding())).demand).toBe(solveFlow(newGame(5)).demand)
  })

  test('Consumer social doubles the market and halves request value', () => {
    const social = foundCompany(5, founding({ venture: 'consumer-social' }))
    expect(solveFlow(social).market).toBeCloseTo(solveFlow(newGame(5)).market * 2)
    expect(solveFlow(social).revenue).toBeLessThan(solveFlow(newGame(5)).revenue)
  })

  test('Fintech moves the peak to business hours', () => {
    const fintech = foundCompany(5, founding({ venture: 'fintech' }))
    expect(solveFlow(fintech).demand).not.toBeCloseTo(solveFlow(newGame(5)).demand)
  })

  test('Bootstrapped indie takes no rounds, keeps all Equity, and declines without a growth penalty', () => {
    const indie = { ...foundCompany(5, founding({ venture: 'bootstrapped' })), users: 2_000 }
    expect(Result.isFailure(raise(indie))).toBe(true)
    const declined = Result.getOrThrow(decline(indie))
    expect(declined.equity).toBe(1)
    expect(declined.declined).toBe(false)
  })

  test('No caches and Postgres for everything refuse their Components; One region forever refuses other regions', () => {
    const game = {
      ...at(5, foundCompany(5, founding({ mutators: ['no-caches', 'one-region'] }))),
      researched: [],
    }
    const unlocked = { ...game, researched: ['caching', 'cdn'] as Game['researched'] }
    expect(Result.isFailure(place(unlocked, 'cache', 0, 0))).toBe(true)
    const pg = { ...unlocked, founding: founding({ mutators: ['postgres'] }) }
    expect(Result.isFailure(place(pg, 'cache', 0, 0))).toBe(true)
    expect(Result.isFailure(place(game, 'server', 0, 0, 'eu'))).toBe(true)
  })

  test('Single language refuses another language; Tight budget halves the grant', () => {
    const game = {
      ...foundCompany(5, founding({ mutators: ['single-language', 'tight-budget'] })),
      researched: ['lang-node'] as Game['researched'],
      users: 2_000,
    }
    expect(Result.isFailure(setRuntime(game, 'server', 'node'))).toBe(true)
    expect(Result.getOrThrow(raise(game)).cash).toBe(game.cash + (ERAS[0]?.grant ?? 0) / 2)
  })

  test('Strict SLO raises the target one level; Legacy monolith starts in debt', () => {
    const strict = { ...at(3), founding: founding({ mutators: ['strict-slo'] }) }
    expect(budgetOf(strict).slo).toBeGreaterThan(ERAS[3]?.slo ?? 1)
    const old = foundCompany(5, founding({ mutators: ['legacy-monolith'] }))
    expect(old.services[0]?.debt).toBe(0.4)
  })
})
