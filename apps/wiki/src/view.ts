import type { Document, HtmlBuilder } from 'foldkit/html'
import { article, notFound } from './components/article.ts'
import { header } from './components/header.ts'
import { homeView } from './components/home.ts'
import { sidebar } from './components/sidebar.ts'
import { toc } from './components/toc.ts'
import type { Message, Model } from './main.ts'
import { pageAt } from './pages.ts'
import { WIKI_ORIGIN } from './site.ts'

/* ==========================================================================
   The wiki's frame: a documentation site, not a game screen. One plain page
   surface separated by hairlines and whitespace: the header bar, the
   navigation rail, the page, and its headings. The game shows in the
   content: its type, colours, badges, and Node cards. The parts live in
   src/components; the state a reader changes lives in src/submodels.
   ========================================================================== */

export const view = (model: Model, h: HtmlBuilder<Message>): Document => {
  const page = pageAt(model.path)
  const isHome = model.path === '/'
  return {
    title: page
      ? isHome
        ? 'Quorum Wiki'
        : `${page.title} · Quorum Wiki`
      : 'Not found · Quorum Wiki',
    lang: 'en',
    ...(page ? { canonical: `${WIKI_ORIGIN}${page.path}` } : {}),
    body: h.div(
      [h.Class('min-h-dvh')],
      [
        header(model, h),
        h.div(
          [
            h.Class(
              'mx-auto grid max-w-[1400px] px-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_200px]',
            ),
          ],
          [
            sidebar(model, h),
            page
              ? isHome
                ? homeView(page, model, h)
                : article(page, model, h)
              : notFound(model, h),
            page && !isHome ? toc(page, h) : h.empty,
          ],
        ),
      ],
    ),
  }
}
