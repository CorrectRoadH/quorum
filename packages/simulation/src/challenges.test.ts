import { Result } from 'effect'
import { describe, expect, test } from 'vitest'
import * as Actions from './actions.ts'
import {
  CHALLENGES,
  bucketOf,
  challengeById,
  challengeOpen,
  dailyDrill,
  runChallenge,
  type Challenge,
} from './challenges.ts'
import { REFERENCE, replayOf } from './fixtures/challenges.ts'
import { decodeReplay, designOf, encodeReplay } from './replay.ts'
import type { Game } from './state.ts'
import { SIM_VERSION } from './version.ts'

const ok = (action: Actions.Action): Game => {
  if (Result.isFailure(action)) throw new Error(JSON.stringify(action.failure))
  return action.success
}

const run = (challenge: Challenge, game: Game) => {
  const result = runChallenge(challenge, replayOf(challenge, game))
  if (Result.isFailure(result)) throw new Error(result.failure)
  return result.success
}

const byId = (id: string): Challenge => {
  const challenge = challengeById(id)
  if (!challenge) throw new Error(id)
  return challenge
}

describe('Challenges', () => {
  for (const challenge of CHALLENGES)
    test(
      `${challenge.name} passes with its fix and fails from the start`,
      { timeout: 60_000 },
      () => {
        const fix = REFERENCE[challenge.id]
        expect(fix).toBeDefined()
        const passed = run(challenge, fix?.(challenge.start()) ?? challenge.start())
        expect(passed).toMatchObject({ passed: true, missed: null })
        const start = run(challenge, challenge.start())
        expect(start.passed).toBe(false)
        for (const axis of ['cost', 'tail', 'complexity'] as const)
          expect(bucketOf(challenge.edges[axis], passed[axis])).toBeLessThan(
            challenge.edges[axis].length,
          )
      },
    )

  test('the same replay gives the same result, and a run action changes it', () => {
    const challenge = byId('hello-world')
    const game = REFERENCE['hello-world']?.(challenge.start()) ?? challenge.start()
    const first = runChallenge(challenge, replayOf(challenge, game))
    const second = runChallenge(challenge, replayOf(challenge, game))
    expect(first).toEqual(second)
    const restarted = runChallenge(
      challenge,
      replayOf(challenge, game, [{ step: 60, action: { _tag: 'Restart', node: 'server' } }]),
    )
    expect(Result.isSuccess(restarted) && Result.isSuccess(first)).toBe(true)
    if (Result.isSuccess(restarted) && Result.isSuccess(first))
      expect(restarted.success.hash).not.toBe(first.success.hash)
  })

  test('a replay round-trips through its string, and junk does not decode', () => {
    const challenge = byId('slashdotted')
    const replay = replayOf(
      challenge,
      REFERENCE['slashdotted']?.(challenge.start()) ?? challenge.start(),
      [{ step: 3, action: { _tag: 'Resize', node: 'database', direction: 1 } }],
    )
    const text = encodeReplay(replay)
    expect(text.startsWith('QRP1:')).toBe(true)
    expect(decodeReplay(text)).toEqual(Result.succeed(replay))
    expect(Result.isFailure(decodeReplay('QRP1:not-json'))).toBe(true)
    expect(Result.isFailure(decodeReplay(`QRP1:${'A'.repeat(70_000)}`))).toBe(true)
  })

  test('the run refuses what the board refuses', () => {
    const hello = byId('hello-world')
    // A Cache is not in the Garage palette, so a Design with one cannot have been built.
    const cached = {
      ...replayOf(hello, hello.start()),
      design: {
        ...designOf(hello.start()),
        nodes: [
          ...designOf(hello.start()).nodes,
          { key: 'x', type: 'cache' as const, dx: 0, dy: 0, settings: {} },
        ],
      },
    }
    expect(Result.isFailure(runChallenge(hello, cached))).toBe(true)
    expect(
      runChallenge(hello, { ...replayOf(hello, hello.start()), simVersion: SIM_VERSION - 1 }),
    ).toEqual(Result.fail('Update Quorum to submit this result.'))
    const loop = byId('event-loop')
    expect(
      runChallenge(loop, replayOf(loop, ok(Actions.setRuntime(loop.start(), 'server', 'php_fpm')))),
    ).toEqual(Result.fail('Every App Server runs Node.js.'))
    expect(Result.isFailure(runChallenge(loop, replayOf(hello, hello.start())))).toBe(true)
  })

  test('the daily drill is the same for a date and differs across dates', () => {
    expect(dailyDrill('2026-11-02')).toMatchObject({ id: 'daily:2026-11-02', legacy: 0 })
    expect(designOf(dailyDrill('2026-11-02').start())).toEqual(
      designOf(dailyDrill('2026-11-02').start()),
    )
    const days = Array.from({ length: 14 }, (_, day) => {
      const drill = dailyDrill(`2026-11-${String(day + 1).padStart(2, '0')}`)
      return `${drill.brief}|${drill.start().seed}`
    })
    expect(new Set(days).size).toBe(days.length)
    expect(challengeById('daily:2026-13-45')).toBeUndefined()
    expect(challengeById('nope')).toBeUndefined()
    const drill = dailyDrill('2026-11-02')
    const result = runChallenge(drill, replayOf(drill, drill.start()))
    expect(Result.isSuccess(result)).toBe(true)
  })
})

describe('Challenge unlocks', () => {
  test('only the first Challenge is open at the start', () => {
    expect(challengeOpen(byId('hello-world'), [])).toBe(true)
    expect(challengeOpen(byId('split-the-box'), [])).toBe(false)
    expect(challengeOpen(byId('slashdotted'), [])).toBe(false)
    expect(challengeOpen(byId('event-loop'), [])).toBe(false)
    expect(challengeOpen(byId('too-many-connections'), [])).toBe(false)
  })

  test('each Challenge opens when the one before it in the list is complete', () => {
    expect(challengeOpen(byId('split-the-box'), ['hello-world'])).toBe(true)
    expect(challengeOpen(byId('slashdotted'), ['hello-world'])).toBe(false)
    expect(challengeOpen(byId('slashdotted'), ['hello-world', 'split-the-box'])).toBe(true)
    expect(challengeOpen(byId('event-loop'), ['hello-world', 'split-the-box', 'slashdotted'])).toBe(
      true,
    )
    expect(
      challengeOpen(byId('too-many-connections'), ['hello-world', 'split-the-box', 'slashdotted']),
    ).toBe(false)
    expect(
      challengeOpen(byId('too-many-connections'), [
        'hello-world',
        'split-the-box',
        'slashdotted',
        'event-loop',
      ]),
    ).toBe(true)
  })

  test('the sequence crosses Era boundaries', () => {
    expect(challengeOpen(byId('slashdotted'), ['hello-world', 'split-the-box'])).toBe(true)
  })

  test('a completed Challenge stays open for another run', () => {
    expect(challengeOpen(byId('hello-world'), ['hello-world'])).toBe(true)
    expect(challengeOpen(byId('event-loop'), ['event-loop'])).toBe(true)
  })

  test('the daily drill is always open', () => {
    expect(challengeOpen(dailyDrill('2026-11-02'), [])).toBe(true)
  })
})
