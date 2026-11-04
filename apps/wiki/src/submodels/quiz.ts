import { Schema } from 'effect'
import type { Update } from 'foldkit'
import { defineView } from 'foldkit/submodel'
import { defineMessageUnion } from 'foldkit/message'
import { cn } from 'cn'
import { Check, RotateCcw, X } from 'lucide'
import { icon } from '@quorum/ui/primitives/icon'

/* The quizzes on a page: the option the reader chose for each, by `<page path>#<occurrence>`,
   counting from 1. A check, not a score: answers last until the page reloads. */

export const Model = Schema.Struct({ answers: Schema.Record(Schema.String, Schema.Finite) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Answered: { key: Schema.String, choice: Schema.Finite },
  Reset: { key: Schema.String },
})
export type Message = typeof Message.Type

export const init: Model = { answers: {} }

export const update = (model: Model, message: Message): Update.Return<Model, Message> =>
  Message.match<Update.Return<Model, Message>>(message, {
    Answered: ({ key, choice }) => ({ model: { answers: { ...model.answers, [key]: choice } } }),
    Reset: ({ key }) => {
      const { [key]: _dropped, ...answers } = model.answers
      return { model: { answers } }
    },
  })

export type Question = Readonly<{
  key: string
  question: string
  /** Separated by `|`. */
  options: string
  /** Counting from 1. */
  answer: string
  explain: string
}>

export const view = defineView<Model, Message, Question>((model, quiz, h) => {
  const options = quiz.options.split('|').map((option) => option.trim())
  const right = Number(quiz.answer)
  const chosen = model.answers[quiz.key] ?? null
  const correct = chosen === right
  const id = `quiz-${quiz.key.replace(/[^a-z0-9]+/gi, '-')}`
  return h.section(
    [h.Class('not-prose my-8 border-y border-border py-5')],
    [
      h.div([h.Class('text-[12.5px] font-medium text-muted-foreground')], ['Check yourself']),
      h.p(
        [h.Id(id), h.Class('mt-1 text-[15.5px] leading-snug font-medium text-balance')],
        [quiz.question],
      ),
      h.div(
        [h.Role('group'), h.AriaLabelledBy(id), h.Class('mt-3 flex flex-col gap-1.5')],
        options.map((option, at) => {
          const choice = at + 1
          const picked = choice === chosen
          const state =
            chosen === null ? 'open' : choice === right ? 'right' : picked ? 'wrong' : 'other'
          return h.button(
            [
              h.Key(option),
              h.Type('button'),
              h.Disabled(chosen !== null),
              h.AriaPressed(picked ? 'true' : 'false'),
              h.OnClick(Message.Answered({ key: quiz.key, choice })),
              h.Class(
                cn(
                  'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-[14px] transition-colors',
                  state === 'open' && 'border-border hover:border-foreground/30 hover:bg-muted',
                  state === 'right' && 'border-ok/50 bg-ok/8 font-medium',
                  state === 'wrong' && 'border-danger/50 bg-danger/8',
                  state === 'other' && 'border-border text-muted-foreground',
                ),
              ),
            ],
            [
              h.span(
                [
                  h.Class(
                    cn(
                      'grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10.5px]',
                      state === 'right'
                        ? 'bg-ok text-white'
                        : state === 'wrong'
                          ? 'bg-danger text-white'
                          : 'border border-border',
                    ),
                  ),
                ],
                [
                  state === 'right'
                    ? icon(h, Check, 'size-3')
                    : state === 'wrong'
                      ? icon(h, X, 'size-3')
                      : String.fromCharCode(64 + choice),
                ],
              ),
              option,
            ],
          )
        }),
      ),
      chosen === null
        ? h.empty
        : h.div(
            [h.AriaLive('polite'), h.Class('mt-3 flex items-start gap-3')],
            [
              h.p(
                [h.Class('flex-1 text-[14px] leading-relaxed')],
                [
                  h.strong(
                    [h.Class(correct ? 'text-ok' : 'text-danger')],
                    [correct ? 'Right. ' : 'Not quite. '],
                  ),
                  quiz.explain,
                ],
              ),
              correct
                ? h.empty
                : h.button(
                    [
                      h.Type('button'),
                      h.OnClick(Message.Reset({ key: quiz.key })),
                      h.Class(
                        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12.5px] font-medium hover:bg-muted',
                      ),
                    ],
                    [icon(h, RotateCcw, 'size-3.5'), 'Try again'],
                  ),
            ],
          ),
    ],
  )
})
