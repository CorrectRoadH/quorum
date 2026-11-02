import { Schema } from 'effect'
import { expect, test } from 'vitest'
import { ChallengeHistograms, ChallengeSubmission, ChallengeVerdict } from './challenges.ts'

const roundTrip = <S extends Schema.Codec<unknown, unknown>>(schema: S, value: S['Type']) =>
  expect(Schema.decodeUnknownSync(schema)(Schema.encodeUnknownSync(schema)(value))).toEqual(value)

test('Challenge schemas round-trip through their wire form', () => {
  roundTrip(ChallengeSubmission, {
    challengeId: 'hello-world',
    simVersion: 8,
    deviceId: '3f2c',
    replay: 'QRP1:e30',
  })
  roundTrip(ChallengeVerdict, {
    passed: true,
    missed: null,
    score: { cost: 0.05, tail: 880, complexity: 2 },
    best: { cost: 0.05, tail: 880, complexity: 2 },
    percentiles: { cost: 0.72, tail: 0.5, complexity: 0 },
  })
  roundTrip(ChallengeHistograms, {
    challengeId: 'daily:2026-11-02',
    simVersion: 8,
    players: 1,
    cost: { edges: [0.1, 0.2], counts: [1, 0, 0] },
    tail: { edges: [100], counts: [0, 1] },
    complexity: { edges: [4], counts: [1, 0] },
  })
})

test('a submission without a replay does not decode', () => {
  expect(() =>
    Schema.decodeUnknownSync(ChallengeSubmission)({
      challengeId: 'x',
      simVersion: 1,
      deviceId: 'd',
    }),
  ).toThrow()
})
