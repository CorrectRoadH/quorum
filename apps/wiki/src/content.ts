import * as Markdown from '@foldkit/markdown'
import { Schema } from 'effect'
import { Frontmatter } from './frontmatter.ts'
import { headingsOf, prose, textOf } from './prose.ts'
import type { Page } from './page.ts'

/* ==========================================================================
   Authored pages: every Markdown file under content/. Its path is its URL
   (content/guides/find-the-bottleneck.md is /guides/find-the-bottleneck, and
   index.md is its folder). A file without frontmatter is prose for a
   catalog page, such as content/components/lb.md; src/reference/ reads it.
   ========================================================================== */

type Module = Readonly<{ default: unknown; frontmatter: unknown }>

const modules = import.meta.glob<Module>('../content/**/*.md', { eager: true })

const decodeFrontmatter = Schema.decodeUnknownSync(Frontmatter)

/** `../content/guides/x.md` → `/guides/x`; `../content/index.md` → `/`. */
const pathOf = (file: string): string => {
  const path = file
    .replace(/^\.\.\/content/, '')
    .replace(/\.md$/, '')
    .replace(/\/index$/, '')
  return path === '' ? '/' : path
}

export type Prose = Readonly<{
  document: Markdown.MarkdownDocument
  text: string
  source: string
}>

const entries = Object.entries(modules).map(([file, module]) => ({
  path: pathOf(file),
  source: `apps/wiki/content${file.replace(/^\.\.\/content/, '')}`,
  document: Markdown.decodeDocument(module.default),
  frontmatter: module.frontmatter === undefined ? null : decodeFrontmatter(module.frontmatter),
}))

/** Prose for a catalog page, by its path, such as `/components/lb`. */
export const proseAt = (path: string): Prose | null => {
  const entry = entries.find((candidate) => candidate.path === path && !candidate.frontmatter)
  return entry
    ? { document: entry.document, text: textOf(entry.document), source: entry.source }
    : null
}

/** Every prose file that belongs to a catalog page, for the coverage tests. */
export const prosePaths: ReadonlyArray<string> = entries
  .filter((entry) => !entry.frontmatter)
  .map((entry) => entry.path)

export const authoredPages: ReadonlyArray<Page> = entries.flatMap((entry) => {
  const meta = entry.frontmatter
  if (!meta) return []
  const document = entry.document
  return [
    {
      path: entry.path,
      title: meta.title,
      summary: meta.summary,
      section: meta.section,
      parent: null,
      order: Number(meta.order ?? 100),
      era: meta.era === undefined ? null : Number(meta.era),
      aliases: (meta.aliases ?? '')
        .split(',')
        .map((alias) => alias.trim())
        .filter(Boolean),
      source: entry.source,
      gdd: meta.gdd ?? null,
      headings: headingsOf(document),
      aside: null,
      body: (model, h) => prose(document, model, h),
      related: [],
      text: textOf(document),
    },
  ]
})
