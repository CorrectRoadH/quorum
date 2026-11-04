import { Effect, Schema } from 'effect'
import { Command, type Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

/* The pages a reader has opened, kept in the browser, for the guided paths' progress. */

export const Model = Schema.Struct({ visited: Schema.Array(Schema.String) })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Loaded: { visited: Schema.Array(Schema.String) },
  Visited: { path: Schema.String },
  Saved: {},
})
export type Message = typeof Message.Type

const KEY = 'quorum.wiki.visited'

export const init: Model = { visited: [] }

const read = (): ReadonlyArray<string> => {
  try {
    const stored: unknown = JSON.parse(globalThis.localStorage?.getItem(KEY) ?? '[]')
    return Array.isArray(stored) ? stored.filter((entry) => typeof entry === 'string') : []
  } catch {
    return []
  }
}

/** The pages already opened, plus this one. */
export const Load = Command.define('LoadProgress', {
  args: { path: Schema.String },
  messages: [Message.Loaded],
  execute: ({ path }) =>
    Effect.sync(() => Message.Loaded({ visited: [...new Set([...read(), path])] })),
})

const Save = Command.define('SaveProgress', {
  args: { visited: Schema.Array(Schema.String) },
  messages: [Message.Saved],
  execute: ({ visited }) =>
    Effect.sync(() => {
      globalThis.localStorage?.setItem(KEY, JSON.stringify(visited))
      return Message.Saved()
    }),
})

export const update = (model: Model, message: Message): Update.Return<Model, Message> =>
  Message.match<Update.Return<Model, Message>>(message, {
    Loaded: ({ visited }) => ({ model: { visited }, commands: [Save({ visited })] }),
    Visited: ({ path }) => {
      if (model.visited.includes(path)) return { model }
      const visited = [...model.visited, path]
      return { model: { visited }, commands: [Save({ visited })] }
    },
    Saved: () => ({ model }),
  })
