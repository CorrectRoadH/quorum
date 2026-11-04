/* ==========================================================================
   The game's rules, as the wiki writes them: prose first, symbols second.

   A ```formula fence holds one rule per line. The parser reads the notation
   the rules actually use, which is small: words and figures, + − × ÷ /,
   relations, parentheses, √, floor/min/max, Σ, and superscripts. It lays
   them out the way a paper would: a short denominator stacks, a long one
   keeps its slash, single letters turn italic, names stay upright.

   Two spaces separate a trailing note from the rule, so
   `health = (Apdex − target) / (1 − target)     kept between −1 and 1`
   keeps its note. Spaces before `=` are alignment, never a note.
   ========================================================================== */

export type MathPart = Readonly<{ kind: 'word' | 'number' | 'variable'; value: string }>

export type MathNode =
  | Readonly<{ _tag: 'Row'; items: ReadonlyArray<MathNode> }>
  | Readonly<{ _tag: 'Text'; parts: ReadonlyArray<MathPart> }>
  | Readonly<{ _tag: 'Group'; inner: MathNode }>
  | Readonly<{
      _tag: 'Fraction'
      numerator: MathNode
      denominator: MathNode
      /** A short denominator stacks; a long one keeps its slash. */
      stacked: boolean
    }>
  | Readonly<{ _tag: 'Root'; inner: MathNode }>
  | Readonly<{ _tag: 'Call'; name: string; args: ReadonlyArray<MathNode> }>
  | Readonly<{ _tag: 'Sum'; label: string }>
  | Readonly<{ _tag: 'Script'; base: MathPart; script: string }>
  | Readonly<{ _tag: 'Operator'; kind: 'binary' | 'comma'; value: string }>

export type FormulaLine = Readonly<{
  lhs: MathNode | null
  relation: string | null
  rhs: MathNode
  note: string | null
}>

export type Formula = Readonly<{ source: string; lines: ReadonlyArray<FormulaLine> }>

type Token =
  | Readonly<{ _tag: 'Number'; value: string }>
  | Readonly<{ _tag: 'Word'; value: string }>
  | Readonly<{ _tag: 'Binary'; value: string }>
  | Readonly<{ _tag: 'Relation'; value: string }>
  | Readonly<{ _tag: 'Punctuation'; value: string }>
  | Readonly<{ _tag: 'Symbol'; value: string }>
  | Readonly<{ _tag: 'Superscript'; value: string }>

/** A denominator longer than this reads better on a slash than in a stack. */
const STACKED_LIMIT = 14

/** A run of two or more spaces that does not sit before an operator or a relation. */
const GAP = / {2,}/g

/** What a gap may precede and still be alignment: the line continues, it does not note. */
const CONTINUES = new Set(['=', '<', '>', '≤', '≥', '+', '×', '÷', '−', '/', ':'])

const TOKEN =
  /(?<space>\s+)|(?<number>\$?\d[\d,]*(?:\.\d+)?%?)|(?<superscript>[²³])|(?<relation>[=><≥≤])|(?<binary>[+×÷−/])|(?<punctuation>[(),:])|(?<symbol>[√Σ])|(?<word>[^\s=><≥≤+×÷−/(),:√Σ²³]+)/gu

const tokenize = (source: string): ReadonlyArray<Token> => {
  const tokens: Array<Token> = []
  for (const match of source.matchAll(TOKEN)) {
    const { space, number, superscript, relation, binary, punctuation, symbol, word } =
      match.groups ?? {}
    if (space !== undefined) continue
    else if (number !== undefined) tokens.push({ _tag: 'Number', value: number })
    else if (superscript !== undefined) tokens.push({ _tag: 'Superscript', value: superscript })
    else if (relation !== undefined) tokens.push({ _tag: 'Relation', value: relation })
    else if (binary !== undefined) tokens.push({ _tag: 'Binary', value: binary })
    else if (punctuation !== undefined) tokens.push({ _tag: 'Punctuation', value: punctuation })
    else if (symbol !== undefined) tokens.push({ _tag: 'Symbol', value: symbol })
    else if (word !== undefined) tokens.push({ _tag: 'Word', value: word })
  }
  return tokens
}

const splitNote = (line: string): Readonly<{ body: string; note: string | null }> => {
  for (const gap of line.matchAll(GAP)) {
    const index = gap.index
    if (index === undefined) continue
    const after = line.slice(index + gap[0].length)
    if (after.trim() === '' || CONTINUES.has(after.trimStart().charAt(0))) continue
    return { body: line.slice(0, index).trimEnd(), note: after.trim() }
  }
  return { body: line.trimEnd(), note: null }
}

const isLetter = (value: string): boolean => /^[A-Za-z]$/.test(value)

const partOf = (token: Token): MathPart | null => {
  if (token._tag === 'Word') {
    return { kind: isLetter(token.value) ? 'variable' : 'word', value: token.value }
  }
  if (token._tag === 'Number') return { kind: 'number', value: token.value }
  return null
}

/** How many characters a node sets, for the stacked/slash decision. */
const width = (node: MathNode): number => {
  switch (node._tag) {
    case 'Text':
      return node.parts.reduce((sum, part) => sum + part.value.length + 1, 0)
    case 'Row':
      return node.items.reduce((sum, item) => sum + width(item), 0)
    case 'Group':
      return width(node.inner) + 2
    case 'Fraction':
      return width(node.numerator) + width(node.denominator) + 1
    case 'Root':
      return width(node.inner) + 1
    case 'Call':
      return node.name.length + node.args.reduce((sum, arg) => sum + width(arg), 0) + 2
    case 'Sum':
      return node.label.length + 1
    case 'Script':
      return 2
    case 'Operator':
      return 1
  }
}

const empty: MathNode = { _tag: 'Text', parts: [] }

const parse = (tokens: ReadonlyArray<Token>): MathNode => {
  let at = 0

  const peek = (): Token | null => tokens[at] ?? null
  const peekAt = (offset: number): Token | null => tokens[at + offset] ?? null
  const take = (): Token | null => tokens[at++] ?? null
  const isPunctuation = (token: Token | null, value: string): boolean =>
    token !== null && token._tag === 'Punctuation' && token.value === value

  const parseAtom = (): MathNode => {
    const token = peek()
    if (token === null) return empty

    if (isPunctuation(token, '(')) {
      take()
      const inner = parseSum()
      if (isPunctuation(peek(), ')')) take()
      return { _tag: 'Group', inner }
    }

    if (token._tag === 'Symbol' && token.value === '√') {
      take()
      if (isPunctuation(peek(), '(')) {
        take()
        const inner = parseSum()
        if (isPunctuation(peek(), ')')) take()
        return { _tag: 'Root', inner }
      }
      return { _tag: 'Text', parts: [{ kind: 'word', value: '√' }] }
    }

    if (token._tag === 'Symbol' && token.value === 'Σ') {
      take()
      const words: Array<string> = []
      while (peek() !== null && peek()?._tag !== 'Punctuation') {
        const next = take()
        if (next !== null && (next._tag === 'Word' || next._tag === 'Number'))
          words.push(next.value)
      }
      if (isPunctuation(peek(), ':')) take()
      return { _tag: 'Sum', label: `${words.join(' ')}:` }
    }

    if (
      token._tag === 'Word' &&
      (token.value === 'floor' || token.value === 'min' || token.value === 'max') &&
      isPunctuation(peekAt(1), '(')
    ) {
      const name = token.value
      take()
      take()
      const args: Array<MathNode> = [parseSum()]
      while (isPunctuation(peek(), ',')) {
        take()
        args.push(parseSum())
      }
      if (isPunctuation(peek(), ')')) take()
      return { _tag: 'Call', name, args }
    }

    const part = partOf(token)
    if (part !== null) {
      take()
      const script = peek()
      if (part.kind === 'variable' && script !== null && script._tag === 'Superscript') {
        take()
        return { _tag: 'Script', base: part, script: script.value === '²' ? '2' : '3' }
      }
      const parts: Array<MathPart> = [part]
      for (;;) {
        const next = peek()
        if (next === null || (next._tag !== 'Word' && next._tag !== 'Number')) break
        const nextPart = partOf(next)
        if (nextPart === null) break
        take()
        parts.push(nextPart)
      }
      return { _tag: 'Text', parts }
    }

    take()
    return empty
  }

  const parseFactor = (): MathNode => {
    const numerator = parseAtom()
    const next = peek()
    if (next !== null && next._tag === 'Binary' && next.value === '/') {
      take()
      return { _tag: 'Fraction', numerator, denominator: parseAtom(), stacked: false }
    }
    return numerator
  }

  /** A number, a word, a symbol, or an opening parenthesis starts an operand. */
  const startsOperand = (token: Token | null): boolean =>
    token !== null &&
    (token._tag === 'Word' ||
      token._tag === 'Number' ||
      token._tag === 'Symbol' ||
      isPunctuation(token, '('))

  const parseProduct = (): MathNode => {
    const items: Array<MathNode> = [parseFactor()]
    for (;;) {
      const next = peek()
      if (next !== null && next._tag === 'Binary' && next.value === '×') {
        take()
        items.push({ _tag: 'Operator', kind: 'binary', value: next.value }, parseFactor())
        continue
      }
      // `Σ kinds: rate` and `Insight(kind)` put operands side by side.
      if (startsOperand(next)) {
        items.push(parseFactor())
        continue
      }
      break
    }
    return items.length === 1 ? (items[0] ?? empty) : { _tag: 'Row', items }
  }

  const parseSum = (): MathNode => {
    const items: Array<MathNode> = [parseProduct()]
    for (;;) {
      const next = peek()
      if (next === null || next._tag !== 'Binary' || (next.value !== '+' && next.value !== '−'))
        break
      take()
      items.push({ _tag: 'Operator', kind: 'binary', value: next.value }, parseProduct())
    }
    return items.length === 1 ? (items[0] ?? empty) : { _tag: 'Row', items }
  }

  return parseSum()
}

/** Sets which fractions stack. A fraction inside another one always takes a slash. */
const markFractions = (node: MathNode, depth: number): MathNode => {
  switch (node._tag) {
    case 'Fraction':
      return {
        _tag: 'Fraction',
        numerator: markFractions(node.numerator, depth + 1),
        denominator: markFractions(node.denominator, depth + 1),
        stacked: depth === 0 && width(node.denominator) <= STACKED_LIMIT,
      }
    case 'Row':
      return { _tag: 'Row', items: node.items.map((item) => markFractions(item, depth)) }
    case 'Group':
      // A group is set on one line, so a fraction inside keeps its slash.
      return { _tag: 'Group', inner: markFractions(node.inner, depth + 1) }
    case 'Root':
      return { _tag: 'Root', inner: markFractions(node.inner, depth) }
    case 'Call':
      // A call is set on one line, so its arguments keep their slashes too.
      return { ...node, args: node.args.map((arg) => markFractions(arg, depth + 1)) }
    default:
      return node
  }
}

const parseLine = (line: string): FormulaLine => {
  const { body, note } = splitNote(line)
  const tokens = tokenize(body)
  const relationAt = tokens.findIndex((token) => token._tag === 'Relation')
  if (relationAt === -1) {
    return { lhs: null, relation: null, rhs: markFractions(parse(tokens), 0), note }
  }
  const relation = tokens[relationAt]
  return {
    lhs: markFractions(parse(tokens.slice(0, relationAt)), 0),
    relation: relation !== undefined && relation._tag === 'Relation' ? relation.value : null,
    rhs: markFractions(parse(tokens.slice(relationAt + 1)), 0),
    note,
  }
}

/** One rule, or a system of rules that share an alignment at the relation. */
export const parseFormula = (source: string): Formula => ({
  source: source.trim(),
  lines: source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map(parseLine),
})
