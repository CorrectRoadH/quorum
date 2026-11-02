import { expect, test } from 'vitest'
import { GOLDEN_HASH, REFERENCE_HASHES } from '../src/fixtures/golden.ts'
import { CHALLENGE_IDS, goldenHash, referenceHash } from './report.ts'

/* Runs in Chromium, Firefox and WebKit (`pnpm test:golden`): the same hashes as Node. */

test('the golden Company hashes the same as in Node', () => {
  const started = performance.now()
  expect(goldenHash()).toBe(GOLDEN_HASH)
  console.log(`golden ${GOLDEN_HASH} in ${(performance.now() - started).toFixed(0)} ms`)
}, 120_000)

for (const id of CHALLENGE_IDS)
  test(`${id}: the reference replay hashes the same as in Node`, () => {
    const started = performance.now()
    expect(referenceHash(id)).toBe(REFERENCE_HASHES[id])
    console.log(`${id} replay in ${(performance.now() - started).toFixed(0)} ms`)
  }, 120_000)
