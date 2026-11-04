import type { Html, HtmlBuilder } from 'foldkit/html'
import type { Formula, MathNode, MathPart } from '../formula.ts'

/* ==========================================================================
   A rule from the Simulation, set the way a paper sets one: the relation
   holds the center, the fraction stacks when its denominator is short, and
   the page number sits in the margin. Labels and notes keep the wiki's
   Geist; only the math wears Computer Modern (public/fonts).

   The visual tree is hidden from assistive technology and the figure carries
   the source text as its label, so a screen reader reads the rule once, in
   the order a person would say it.
   ========================================================================== */

const part = <M>(value: MathPart, h: HtmlBuilder<M>): Html =>
  value.kind === 'variable'
    ? h.span([h.Class('formula-var')], [value.value])
    : value.kind === 'number'
      ? h.span([h.Class('formula-num')], [value.value])
      : h.span([h.Class('formula-word')], [value.value])

const isAtom = (node: MathNode): boolean => node._tag !== 'Operator'

const node = <M>(value: MathNode, h: HtmlBuilder<M>): Html => {
  switch (value._tag) {
    case 'Text': {
      const children: Array<Html | string> = []
      value.parts.forEach((piece, index) => {
        if (index > 0) children.push(' ')
        children.push(part(piece, h))
      })
      return h.span([h.Class('formula-text')], children)
    }
    case 'Row': {
      const children: Array<Html | string> = []
      value.items.forEach((item, index) => {
        const previous = value.items[index - 1]
        // A word before a group is a call, not two things: `Insight(kind)`.
        const joins = previous !== undefined && isAtom(previous) && item._tag === 'Group'
        if (previous !== undefined && isAtom(previous) && isAtom(item) && !joins) children.push(' ')
        children.push(node(item, h))
      })
      return h.span([h.Class('formula-row')], children)
    }
    case 'Group':
      return h.span(
        [h.Class('formula-group')],
        [
          h.span([h.Class('formula-paren')], ['(']),
          node(value.inner, h),
          h.span([h.Class('formula-paren')], [')']),
        ],
      )
    case 'Fraction':
      return value.stacked
        ? h.span(
            [h.Class('formula-fraction')],
            [
              h.span([h.Class('formula-numerator')], [node(value.numerator, h)]),
              h.span([h.Class('formula-denominator')], [node(value.denominator, h)]),
            ],
          )
        : h.span(
            [h.Class('formula-quotient')],
            [
              node(value.numerator, h),
              h.span([h.Class('formula-op')], ['/']),
              node(value.denominator, h),
            ],
          )
    case 'Root':
      // A drawn radical stretches to whatever it holds; the glyph did not.
      return h.span(
        [h.Class('formula-root')],
        [
          h.svg(
            [
              h.AriaHidden(true),
              h.Class('formula-root-sign'),
              h.ViewBox('0 0 12 24'),
              h.PreserveAspectRatio('none'),
            ],
            [
              h.path(
                [
                  h.D('M0 16.4 L3.1 15.4 L6.4 22.8 L12 0.6'),
                  h.Fill('none'),
                  h.Stroke('currentColor'),
                  h.StrokeWidth('1.4'),
                  h.StrokeLinejoin('round'),
                ],
                [],
              ),
            ],
          ),
          h.span([h.Class('formula-root-body')], [node(value.inner, h)]),
        ],
      )
    case 'Call': {
      const children: Array<Html | string> = [
        h.span([h.Class('formula-call')], [value.name]),
        h.span([h.Class('formula-paren')], ['(']),
      ]
      value.args.forEach((arg, index) => {
        if (index > 0) children.push(h.span([h.Class('formula-comma')], [', ']))
        children.push(node(arg, h))
      })
      children.push(h.span([h.Class('formula-paren')], [')']))
      return h.span([h.Class('formula-invocation')], children)
    }
    case 'Sum':
      return h.span(
        [h.Class('formula-sum')],
        [
          h.span([h.Class('formula-sum-sign')], ['Σ']),
          h.span([h.Class('formula-sum-label')], [value.label]),
        ],
      )
    case 'Script':
      return h.span(
        [h.Class('formula-script')],
        [part(value.base, h), h.sup([h.Class('formula-script-value')], [value.script])],
      )
    case 'Operator':
      return h.span(
        [h.Class(value.kind === 'comma' ? 'formula-comma' : 'formula-op')],
        [value.value],
      )
  }
}

export const formulaView = <M>(formula: Formula, tag: number, h: HtmlBuilder<M>): Html => {
  const cells: Array<Html | string> = []
  for (const line of formula.lines) {
    if (line.lhs !== null && line.relation !== null) {
      cells.push(
        h.span([h.Class('formula-lhs')], [node(line.lhs, h)]),
        h.span([h.Class('formula-relation')], [line.relation]),
        h.span([h.Class('formula-rhs')], [node(line.rhs, h)]),
      )
    } else {
      cells.push(h.span([h.Class('formula-rule')], [node(line.rhs, h)]))
    }
    if (line.note !== null) cells.push(h.span([h.Class('formula-note')], [line.note]))
  }
  return h.figure(
    [h.Class('formula'), h.AriaLabel(formula.source.replace(/\s+/g, ' '))],
    [
      h.div([h.AriaHidden(true), h.Class('formula-lines')], cells),
      ...(tag > 0 ? [h.span([h.AriaHidden(true), h.Class('formula-tag')], [String(tag)])] : []),
    ],
  )
}
