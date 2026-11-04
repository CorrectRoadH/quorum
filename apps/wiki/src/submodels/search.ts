import { Effect, Schema } from 'effect'
import { Command, type Update } from 'foldkit'
import { defineView } from 'foldkit/submodel'
import { defineMessageUnion } from 'foldkit/message'
import { Search as SearchIcon } from 'lucide'
import { icon } from '@quorum/ui/primitives/icon'
import { QUADRANTS } from '../components/quadrant.ts'
import { search, type Entry } from '../search.ts'

/* The search box in the header: the query, and whether its results are open. */

export const Model = Schema.Struct({ query: Schema.String, open: Schema.Boolean })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  QueryChanged: { query: Schema.String },
  Closed: {},
  Focused: {},
  Settled: {},
})
export type Message = typeof Message.Type

export const init: Model = { query: '', open: false }

const FocusSearch = Command.define('FocusSearch', {
  messages: [Message.Settled],
  execute: Effect.sync(() => {
    document.querySelector<HTMLInputElement>('#search')?.focus()
    return Message.Settled()
  }),
})

export const update = (model: Model, message: Message): Update.Return<Model, Message> =>
  Message.match<Update.Return<Model, Message>>(message, {
    QueryChanged: ({ query }) => ({ model: { query, open: query.trim() !== '' } }),
    Closed: () => ({ model: { ...model, open: false } }),
    Focused: () => ({ model, commands: [FocusSearch()] }),
    Settled: () => ({ model }),
  })

/** The page index is a view input, so this module does not load every page. */
export const view = defineView<Model, Message, ReadonlyArray<Entry>>((model, index, h) => {
  const hits = model.open ? search(index, model.query) : []
  return h.div(
    [h.Class('relative min-w-0 flex-1 sm:max-w-[360px]')],
    [
      h.label(
        [
          h.Class(
            'flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-muted-foreground transition-colors focus-within:border-foreground/30',
          ),
        ],
        [
          icon(h, SearchIcon, 'size-3.5 shrink-0'),
          h.input([
            h.Id('search'),
            h.Type('search'),
            h.Value(model.query),
            h.Placeholder('Search'),
            h.AriaLabel('Search the wiki'),
            h.Autocomplete('off'),
            h.Spellcheck(false),
            h.Class(
              'h-full min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground',
            ),
            h.OnInput((query) => Message.QueryChanged({ query })),
            h.OnKeyDown((key) => (key === 'Escape' ? Message.Closed() : Message.Settled())),
          ]),
          h.kbd(
            [
              h.Class(
                'hidden rounded border border-border px-1.5 font-mono text-[10.5px] leading-4 sm:block',
              ),
            ],
            ['/'],
          ),
        ],
      ),
      model.open
        ? h.div(
            [
              h.Role('listbox'),
              h.AriaLabel('Search results'),
              h.Class(
                'absolute top-10 right-0 left-0 z-50 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg',
              ),
            ],
            hits.length === 0
              ? [
                  h.p(
                    [h.Class('px-3 py-2.5 text-[13px] text-muted-foreground')],
                    ['No page matches.'],
                  ),
                ]
              : hits.map(({ page, heading }) =>
                  h.a(
                    [
                      h.Key(page.path),
                      h.Href(heading ? `${page.path}#${heading}` : page.path),
                      h.Class(
                        'block rounded-md px-3 py-2 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none',
                      ),
                    ],
                    [
                      h.div(
                        [h.Class('flex items-baseline justify-between gap-3')],
                        [
                          h.span(
                            [h.Class('text-[13.5px] font-medium text-foreground')],
                            [page.title],
                          ),
                          h.span(
                            [h.Class('text-[11.5px] text-muted-foreground')],
                            [QUADRANTS[page.section].label],
                          ),
                        ],
                      ),
                      h.p(
                        [h.Class('mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground')],
                        [page.summary],
                      ),
                    ],
                  ),
                ),
          )
        : h.empty,
    ],
  )
})
