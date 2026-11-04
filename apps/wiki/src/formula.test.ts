import { expect, test } from 'vitest'
import { type MathNode, parseFormula } from './formula.ts'

/* The rules the wiki writes must survive the trip to the page: the note stays
   separate from the rule, the relation is found, and only a short denominator
   stacks. */

const rhsOf = (source: string): MathNode => {
  const line = parseFormula(source).lines[0]
  if (!line) throw new Error(`no line in ${source}`)
  return line.rhs
}

const itemsOf = (node: MathNode): ReadonlyArray<MathNode> =>
  node._tag === 'Row' ? node.items : [node]

const textsOf = (node: MathNode): ReadonlyArray<string> => {
  if (node._tag === 'Text') return node.parts.map((part) => part.value)
  if (node._tag === 'Row') return node.items.flatMap(textsOf)
  if (node._tag === 'Group') return textsOf(node.inner)
  if (node._tag === 'Fraction') return [...textsOf(node.numerator), ...textsOf(node.denominator)]
  return []
}

test('a rule splits into its left side, relation, right side, and note', () => {
  const [line] = parseFormula(
    'health = (Apdex − target) / (1 − target)     kept between −1 and 1',
  ).lines
  expect(line?.relation).toBe('=')
  expect(line?.note).toBe('kept between −1 and 1')
  expect(line?.lhs?._tag).toBe('Text')
  expect(textsOf(line?.rhs ?? { _tag: 'Text', parts: [] })).toEqual([
    'Apdex',
    'target',
    '1',
    'target',
  ])
})

test('alignment spaces before a relation are not a note', () => {
  const [line] = parseFormula(
    'velocity        = Stack velocity × (1 − 0.5 × tech debt) × policy',
  ).lines
  expect(line?.note).toBeNull()
  expect(line?.relation).toBe('=')
})

test('a system keeps one line per statement, each with its own note', () => {
  const formula = parseFormula(
    'R + W > N   every read asks at least one replica that has the latest write\nR + W ≤ N   a read can miss the latest write',
  )
  expect(formula.lines.map((line) => line.relation)).toEqual(['>', '≤'])
  expect(formula.lines.map((line) => line.note)).toEqual([
    'every read asks at least one replica that has the latest write',
    'a read can miss the latest write',
  ])
})

test('a short denominator stacks; a long one keeps its slash', () => {
  const apdex = rhsOf('Apdex = (satisfied + tolerating / 2) / total')
  expect(apdex._tag).toBe('Fraction')
  if (apdex._tag !== 'Fraction') return
  expect(apdex.stacked).toBe(true)

  const nested = apdex.numerator
  expect(nested._tag).toBe('Group')
  if (nested._tag !== 'Group') return
  const inner = itemsOf(nested.inner).find((item) => item._tag === 'Fraction')
  expect(inner?._tag).toBe('Fraction')
  expect(inner?._tag === 'Fraction' ? inner.stacked : true).toBe(false)

  const engineers = rhsOf('effective engineers = n / (1 + 0.08 × (n − 1) + 0.0004 × n × (n − 1))')
  expect(engineers._tag).toBe('Fraction')
  expect(engineers._tag === 'Fraction' ? engineers.stacked : true).toBe(false)
})

test('a single letter is a variable and a name is a word', () => {
  const health = rhsOf('health = (Apdex − target) / (1 − target)')
  expect(health._tag).toBe('Fraction')
  if (health._tag !== 'Fraction' || health.numerator._tag !== 'Group') return
  const first = itemsOf(health.numerator.inner)[0]
  expect(first?._tag === 'Text' ? first.parts[0]?.kind : null).toBe('word')

  const attempts = rhsOf('attempts = 1 + f')
  const last = itemsOf(attempts).at(-1)
  expect(last?._tag === 'Text' ? last.parts[0]?.kind : null).toBe('variable')
})

test('the rule after a sum stays attached to it', () => {
  const items = itemsOf(rhsOf('revenue = Σ kinds: rate × value × (satisfied + tolerating / 2)'))
  expect(items[0]?._tag).toBe('Sum')
  expect(items.map((item) => item._tag)).toContain('Group')
  expect(items.flatMap(textsOf)).toContain('rate')
})

test('roots, calls, sums, and scripts survive the parse', () => {
  const hit = itemsOf(rhsOf('hit ratio = √(memory / hot data) × TTL factor'))
  expect(hit[0]?._tag).toBe('Root')

  const deploys = itemsOf(
    rhsOf('deploys = min(policy cap, 480 work minutes / (build + deploy + 15 verify))'),
  )
  expect(deploys[0]?._tag).toBe('Call')

  const revenue = itemsOf(rhsOf('revenue = Σ kinds: rate × value'))
  expect(revenue[0]?._tag).toBe('Sum')

  const powers = itemsOf(rhsOf('attempts = 1 + f + f² + f³'))
  const script = powers.at(-1)
  expect(script?._tag === 'Script' ? script.script : null).toBe('3')
})
