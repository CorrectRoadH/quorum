import { Schema } from 'effect'
import type { Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import type { Glossary } from './model.ts'

/* The Glossary panel's search and category filter, folded into the parent with foldChild. */

export const GlossaryMessage = defineMessageUnion({
  Searched: { query: Schema.String },
  Filtered: { category: Schema.NullOr(Schema.String) },
})
export type GlossaryMessage = typeof GlossaryMessage.Type

export const updateGlossary = (
  glossary: Glossary,
  message: GlossaryMessage,
): Update.Return<Glossary, GlossaryMessage> =>
  GlossaryMessage.match<Update.Return<Glossary, GlossaryMessage>>(message, {
    Searched: ({ query }) => ({ model: { ...glossary, query } }),
    Filtered: ({ category }) => ({ model: { ...glossary, category } }),
  })
