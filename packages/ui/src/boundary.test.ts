import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from 'vitest'

/* The package's import rules (ADR 0010): no file imports an app or the wire contract, and the
   primitives import neither the game views nor the board, so the wiki can load a button
   without loading the Simulation or Pixi. */

const root = new URL('.', import.meta.url).pathname

const files = (dir: string): ReadonlyArray<string> =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : entry.name.endsWith('.ts')
        ? [join(dir, entry.name)]
        : [],
  )

const importsOf = (file: string): ReadonlyArray<string> =>
  [...readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map(
    (match) => match[1] ?? '',
  )

test('no file imports an app, an app alias, or the wire contract', () => {
  const offending = files(root).flatMap((file) =>
    importsOf(file)
      .filter(
        (spec) => /^(@\/|@quorum\/(web|wiki|rpc|backend)\b)/.test(spec) || spec.includes('apps/'),
      )
      .map((spec) => `${relative(root, file)}: ${spec}`),
  )
  expect(offending).toEqual([])
})

test('the primitives import neither the game views, the board, nor the Simulation', () => {
  const offending = files(join(root, 'primitives')).flatMap((file) =>
    importsOf(file)
      .filter((spec) => /^\.\.\/(game|board)\b|^@quorum\/simulation\b|^pixi\.js$/.test(spec))
      .map((spec) => `${relative(root, file)}: ${spec}`),
  )
  expect(offending).toEqual([])
})
