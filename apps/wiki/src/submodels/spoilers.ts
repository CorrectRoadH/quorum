import { Effect, Schema } from 'effect'
import { Command, type Update } from 'foldkit'
import { defineView } from 'foldkit/submodel'
import { defineMessageUnion } from 'foldkit/message'
import { ERAS } from '@quorum/simulation/catalog'

/* The spoiler filter: the last Era the reader reached. Pages about later Eras fold. Kept in the browser. */

/** Every Era: content from any Era shows. */
export const ALL_ERAS = -1

export const Model = Schema.Struct({ era: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Chosen: { era: Schema.Finite },
  Loaded: { era: Schema.Finite },
  Saved: {},
})
export type Message = typeof Message.Type

const KEY = 'quorum.wiki.era'

export const init: Model = { era: ALL_ERAS }

export const Load = Command.define('LoadEra', {
  messages: [Message.Loaded],
  execute: Effect.sync(() => {
    const stored = Number(globalThis.localStorage?.getItem(KEY) ?? ALL_ERAS)
    return Message.Loaded({ era: Number.isInteger(stored) ? stored : ALL_ERAS })
  }),
})

const Save = Command.define('SaveEra', {
  args: { era: Schema.Finite },
  messages: [Message.Saved],
  execute: ({ era }) =>
    Effect.sync(() => {
      globalThis.localStorage?.setItem(KEY, String(era))
      return Message.Saved()
    }),
})

export const update = (model: Model, message: Message): Update.Return<Model, Message> =>
  Message.match<Update.Return<Model, Message>>(message, {
    Chosen: ({ era }) => ({ model: { era }, commands: [Save({ era })] }),
    Loaded: ({ era }) => ({ model: { era } }),
    Saved: () => ({ model }),
  })

/** A page about `era` folds for this reader. */
export const hides = (model: Model, era: number | null): boolean =>
  era !== null && model.era !== ALL_ERAS && era > model.era

export const view = defineView<Model, Message>((model, h) =>
  h.select(
    [
      h.AriaLabel('Hide content after an Era'),
      h.Title('Spoilers: hide content after the Era you reached'),
      h.Class(
        'hidden h-8 cursor-pointer rounded-md border border-border bg-background px-2 text-[13px] text-foreground outline-none lg:block',
      ),
      h.OnChange((value) => Message.Chosen({ era: Number(value) })),
    ],
    [
      h.option([h.Value(String(ALL_ERAS)), h.Selected(model.era === ALL_ERAS)], ['All Eras']),
      ...ERAS.map((era, index) =>
        h.option([h.Value(String(index)), h.Selected(model.era === index)], [`Up to ${era.name}`]),
      ),
    ],
  ),
)
