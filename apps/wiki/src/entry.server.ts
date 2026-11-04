import { Effect } from 'effect'
import { Server } from 'foldkit/experimental'
import { init, normalize } from './main.ts'
import { PAGES, pageAt } from './pages.ts'
import { WIKI_ORIGIN } from './site.ts'
import { view } from './view.ts'

/* ==========================================================================
   The server entry. The build prerenders every page in `prerenderPaths`; a
   deployed Worker answers the rest: the sitemap, and a 404 page for any
   other path.
   ========================================================================== */

const FONTS =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap'

const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const renderDocument: Server.DocumentRenderer = (application, assets) => {
  const page = pageAt(normalize(new URL(application.canonical ?? WIKI_ORIGIN).pathname))
  const description = escape(page?.summary ?? 'How Quorum works.')
  const title = escape(application.title)
  return Server.renderDocument(application, assets, {
    lang: 'en',
    head: [
      `<meta name="description" content="${description}">`,
      '<meta name="theme-color" content="#f1f2f4">',
      '<meta property="og:type" content="article">',
      '<meta property="og:site_name" content="Quorum Wiki">',
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      '<meta property="og:image" content="https://playquorum.dev/og.png">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      `<link rel="stylesheet" href="${FONTS}">`,
    ].join(''),
  })
}

export const prerenderPaths: ReadonlyArray<string> = PAGES.map((page) => page.path)

const sitemap = (): Response =>
  new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...PAGES.map(
        (page) => `<url><loc>${WIKI_ORIGIN}${page.path === '/' ? '' : page.path}</loc></url>`,
      ),
      '</urlset>',
    ].join('\n'),
    { headers: { 'content-type': 'application/xml; charset=utf-8' } },
  )

export const renderPage = (request: Request): Promise<Server.EntryResult> => {
  const path = normalize(new URL(request.url).pathname)
  if (path === '/sitemap.xml') return Promise.resolve(Server.Responded(sitemap()))
  return Effect.runPromise(
    Server.renderToString({ routing: {}, init, view }, { url: request.url }).pipe(
      Effect.map((application) =>
        Server.Rendered(application, pageAt(path) ? {} : { status: 404 }),
      ),
    ),
  )
}
