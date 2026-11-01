import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

/*
 * The browser plays the Simulation and the API Worker replays it, so it must
 * run the same everywhere (docs/adr/0004-simulation-package.md, 04
 * "Determinism and randomness"). Its sources import only `effect` and their
 * own files, touch no host globals, and use only exact math.
 */

const root = dirname(fileURLToPath(import.meta.url))

const listSources = async (directory: string): Promise<Array<string>> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return listSources(path)
      const source =
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.test.ts') &&
        !entry.name.endsWith('.bench.ts')
      return source ? [path] : []
    }),
  )
  return nested.flat()
}

/** The code without its comments and string literals, so prose cannot trip a rule. */
const codeOf = (text: string): string =>
  text
    .replaceAll(/\/\*[\s\S]*?\*\//g, '')
    .replaceAll(/\/\/.*$/gm, '')
    .replaceAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''")

const specifiers = (text: string): Array<string> =>
  [...text.matchAll(/(?:\bfrom\s+|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)].map(
    ([, specifier]) => specifier ?? '',
  )

const allowedImport = (specifier: string): boolean =>
  specifier === 'effect' || specifier.startsWith('effect/') || specifier.startsWith('.')

/** ECMAScript leaves these to the engine, and engines differ by a few ulp. */
const inexactMath =
  /\bMath\.(?:sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|exp|expm1|log|log2|log10|log1p|pow|cbrt|hypot|random)\b/

/** The exponent operator is `Math.pow` by another name. */
const exponent = /\*\*/

/** Clocks and host objects differ between the browser, Node, and the Worker. */
const hostGlobal =
  /\b(?:Date|performance|window|document|navigator|localStorage|sessionStorage|process|crypto|fetch|setTimeout|setInterval|requestAnimationFrame)\b/

test('the Simulation imports only effect and its own files', async () => {
  const sources = await listSources(root)
  const violations = []
  for (const source of sources) {
    const text = await readFile(source, 'utf8')
    for (const specifier of specifiers(text))
      if (!allowedImport(specifier))
        violations.push(`${relative(root, source)}: imports ${specifier}`)
  }
  expect(sources.length).toBeGreaterThan(0)
  expect(violations).toEqual([])
})

test('the Simulation uses only exact math and no host globals', async () => {
  const sources = await listSources(root)
  const violations = []
  for (const source of sources) {
    const code = codeOf(await readFile(source, 'utf8'))
    const file = relative(root, source)
    if (inexactMath.test(code)) violations.push(`${file}: ${code.match(inexactMath)?.[0]}`)
    if (exponent.test(code)) violations.push(`${file}: uses **`)
    if (hostGlobal.test(code)) violations.push(`${file}: names ${code.match(hostGlobal)?.[0]}`)
  }
  expect(violations).toEqual([])
})

test('the rules catch what they are meant to catch', () => {
  expect(inexactMath.test(codeOf('const x = Math.cos(t)'))).toBe(true)
  expect(exponent.test(codeOf('const x = 2 ** n'))).toBe(true)
  expect(hostGlobal.test(codeOf('const now = Date.now()'))).toBe(true)
  expect(exponent.test(codeOf('/** A doc comment. */ const x = 1'))).toBe(false)
  expect(hostGlobal.test(codeOf("track: 'performance'"))).toBe(false)
  expect(specifiers("import { h } from 'foldkit/html'").every(allowedImport)).toBe(false)
  expect(specifiers("import { Schema } from 'effect'").every(allowedImport)).toBe(true)
})
