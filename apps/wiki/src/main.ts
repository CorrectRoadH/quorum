import { Effect, Schema } from 'effect'
import { Command, Runtime } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { Url, toString as urlToString } from 'foldkit/url'

/* ==========================================================================
   The wiki as one Foldkit application. The server prerenders every page from
   the same init and view, and the browser hydrates it. The Model holds only
   what a reader changes: the page, the search, the Era filter, and the state
   of live islands.
   ========================================================================== */

/** Every Era: content from any Era shows. */
export const ALL_ERAS = -1

export const Model = Schema.Struct({
  /** The page path, without a trailing slash. */
  path: Schema.String,
  query: Schema.String,
  /** The search results are open. */
  searching: Schema.Boolean,
  /** The last Era the reader reached; later content folds. */
  era: Schema.Finite,
  /** The navigation drawer is open on a phone. */
  menu: Schema.Boolean,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  Navigated: {},
  QueryChanged: { query: Schema.String },
  SearchClosed: {},
  SearchFocused: {},
  EraChosen: { era: Schema.Finite },
  EraLoaded: { era: Schema.Finite },
  MenuToggled: {},
})
export type Message = typeof Message.Type

/** `/components/lb/` and `/components/lb` are one page. */
export const normalize = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

const ERA_KEY = 'quorum.wiki.era'

const LoadEra = Command.define('LoadEra', {
  messages: [Message.EraLoaded],
  execute: Effect.sync(() => {
    const stored = Number(globalThis.localStorage?.getItem(ERA_KEY) ?? ALL_ERAS)
    return Message.EraLoaded({ era: Number.isInteger(stored) ? stored : ALL_ERAS })
  }),
})

const SaveEra = Command.define('SaveEra', {
  args: { era: Schema.Finite },
  messages: [Message.Navigated],
  execute: ({ era }) =>
    Effect.sync(() => {
      globalThis.localStorage?.setItem(ERA_KEY, String(era))
      return Message.Navigated()
    }),
})

const Navigate = Command.define('Navigate', {
  args: { url: Schema.String },
  messages: [Message.Navigated],
  execute: ({ url }) => pushUrl(url).pipe(Effect.as(Message.Navigated())),
})

const LoadExternal = Command.define('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.Navigated],
  execute: ({ href }) => load(href).pipe(Effect.as(Message.Navigated())),
})

/** A new page starts at its top, or at the heading its hash names. */
const ScrollTo = Command.define('ScrollTo', {
  args: { hash: Schema.String },
  messages: [Message.Navigated],
  execute: ({ hash }) =>
    Effect.sync(() => {
      requestAnimationFrame(() => {
        const target = hash ? document.getElementById(decodeURIComponent(hash)) : null
        if (target) target.scrollIntoView()
        else window.scrollTo(0, 0)
      })
      return Message.Navigated()
    }),
})

const FocusSearch = Command.define('FocusSearch', {
  messages: [Message.Navigated],
  execute: Effect.sync(() => {
    document.querySelector<HTMLInputElement>('#search')?.focus()
    return Message.Navigated()
  }),
})

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => ({
  model: { path: normalize(url.pathname), query: '', searching: false, era: ALL_ERAS, menu: false },
  commands: [LoadEra()],
})

type Return = Readonly<{ model: Model; commands?: ReadonlyArray<Command.Command<Message>> }>

export const update = (model: Model, message: Message): Return =>
  Message.match<Return>(message, {
    ClickedLink: ({ request }) =>
      UrlRequest.match<Return>(request, {
        Internal: ({ url }) => ({ model, commands: [Navigate({ url: urlToString(url) })] }),
        External: ({ href }) => ({ model, commands: [LoadExternal({ href })] }),
      }),
    ChangedUrl: ({ url }) => {
      const path = normalize(url.pathname)
      const hash = url.hash._tag === 'Some' ? url.hash.value.replace(/^#/, '') : ''
      const samePage = path === model.path
      return {
        model: { ...model, path, query: '', searching: false, menu: false },
        commands: samePage && !hash ? [] : [ScrollTo({ hash })],
      }
    },
    Navigated: () => ({ model }),
    QueryChanged: ({ query }) => ({ model: { ...model, query, searching: query.trim() !== '' } }),
    SearchClosed: () => ({ model: { ...model, searching: false } }),
    SearchFocused: () => ({ model, commands: [FocusSearch()] }),
    EraChosen: ({ era }) => ({ model: { ...model, era }, commands: [SaveEra({ era })] }),
    EraLoaded: ({ era }) => ({ model: { ...model, era } }),
    MenuToggled: () => ({ model: { ...model, menu: !model.menu } }),
  })
