import { Effect, Option, Schema } from 'effect'
import { Command, Runtime, Update } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { Url, toString as urlToString } from 'foldkit/url'
import * as Progress from './submodels/progress.ts'
import * as Quiz from './submodels/quiz.ts'
import * as Search from './submodels/search.ts'
import * as Spoilers from './submodels/spoilers.ts'

/* ==========================================================================
   The wiki as one Foldkit application. The server prerenders every page from
   the same init and view, and the browser hydrates it. The root owns the
   page and the phone menu; each thing a reader changes is a Submodel under
   src/submodels: the search, the spoiler filter, reading progress, and the
   quizzes.
   ========================================================================== */

export const Model = Schema.Struct({
  /** The page path, without a trailing slash. */
  path: Schema.String,
  /** The navigation drawer is open on a phone. */
  menu: Schema.Boolean,
  search: Search.Model,
  spoilers: Spoilers.Model,
  progress: Progress.Model,
  quiz: Quiz.Model,
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  Navigated: {},
  MenuToggled: {},
  SearchChanged: { message: Search.Message },
  SpoilersChanged: { message: Spoilers.Message },
  ProgressChanged: { message: Progress.Message },
  QuizChanged: { message: Quiz.Message },
})
export type Message = typeof Message.Type

/** `/components/lb/` and `/components/lb` are one page. */
export const normalize = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

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

const foldSearch = Update.foldChild({
  update: Search.update,
  read: (model: Model) => Option.some(model.search),
  write: (model, search) => ({ ...model, search }),
  toParentMessage: (message) => Message.SearchChanged({ message }),
})

const foldSpoilers = Update.foldChild({
  update: Spoilers.update,
  read: (model: Model) => Option.some(model.spoilers),
  write: (model, spoilers) => ({ ...model, spoilers }),
  toParentMessage: (message) => Message.SpoilersChanged({ message }),
})

const foldProgress = Update.foldChild({
  update: Progress.update,
  read: (model: Model) => Option.some(model.progress),
  write: (model, progress) => ({ ...model, progress }),
  toParentMessage: (message) => Message.ProgressChanged({ message }),
})

const foldQuiz = Update.foldChild({
  update: Quiz.update,
  read: (model: Model) => Option.some(model.quiz),
  write: (model, quiz) => ({ ...model, quiz }),
  toParentMessage: (message) => Message.QuizChanged({ message }),
})

export const init: Runtime.RoutingApplicationInit<Model, Message> = (url) => {
  const path = normalize(url.pathname)
  return {
    model: {
      path,
      menu: false,
      search: Search.init,
      spoilers: Spoilers.init,
      progress: Progress.init,
      quiz: Quiz.init,
    },
    commands: [
      ...Command.mapMessages([Spoilers.Load()], (message) => Message.SpoilersChanged({ message })),
      ...Command.mapMessages([Progress.Load({ path })], (message) =>
        Message.ProgressChanged({ message }),
      ),
    ],
  }
}

type Return = Update.Return<Model, Message>

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
      const scroll = path === model.path && !hash ? [] : [ScrollTo({ hash })]
      // A new page closes the search and the menu, and counts as read.
      const visited = foldProgress(
        { ...model, path, menu: false, search: Search.init },
        Progress.Message.Visited({ path }),
      )
      return { model: visited.model, commands: [...scroll, ...(visited.commands ?? [])] }
    },
    Navigated: () => ({ model }),
    MenuToggled: () => ({ model: { ...model, menu: !model.menu } }),
    SearchChanged: ({ message }) => foldSearch(model, message),
    SpoilersChanged: ({ message }) => foldSpoilers(model, message),
    ProgressChanged: ({ message }) => foldProgress(model, message),
    QuizChanged: ({ message }) => foldQuiz(model, message),
  })
