import type { Page } from './page.ts'

/* ==========================================================================
   Search over every page, in the browser. Each page contributes its title,
   aliases (Component codes such as `lb`, product names such as "Kafka"),
   headings, summary, and text. A title match ranks above an alias, an alias
   above a heading, and so on down.
   ========================================================================== */

export type Hit = Readonly<{ page: Page; heading: string | null }>

export type Entry = Readonly<{
  page: Page
  title: string
  aliases: ReadonlyArray<string>
  headings: ReadonlyArray<Readonly<{ id: string; text: string }>>
  summary: string
  text: string
}>

const fold = (text: string): string => text.toLowerCase().normalize('NFKD')

export const indexOf = (pages: ReadonlyArray<Page>): ReadonlyArray<Entry> =>
  pages.map((page) => ({
    page,
    title: fold(page.title),
    aliases: page.aliases.map(fold),
    headings: page.headings.map((heading) => ({ id: heading.id, text: fold(heading.text) })),
    summary: fold(page.summary),
    text: fold(page.text),
  }))

const scoreOf = (
  entry: Entry,
  words: ReadonlyArray<string>,
): Readonly<{ score: number; heading: string | null }> => {
  let score = 0
  let heading: string | null = null
  for (const word of words) {
    const titleAt = entry.title.indexOf(word)
    const best =
      entry.title === word
        ? 100
        : titleAt === 0
          ? 60
          : titleAt > 0
            ? 40
            : entry.aliases.some((alias) => alias === word)
              ? 50
              : entry.aliases.some((alias) => alias.includes(word))
                ? 30
                : entry.headings.some((candidate) => candidate.text.includes(word))
                  ? 20
                  : entry.summary.includes(word)
                    ? 12
                    : entry.text.includes(word)
                      ? 4
                      : 0
    if (best === 0) return { score: 0, heading: null }
    if (best === 20 && heading === null)
      heading = entry.headings.find((candidate) => candidate.text.includes(word))?.id ?? null
    score += best
  }
  return { score, heading }
}

export const search = (
  index: ReadonlyArray<Entry>,
  query: string,
  limit = 8,
): ReadonlyArray<Hit> => {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return index
    .map((entry) => ({ entry, ...scoreOf(entry, words) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.page.title.length - b.entry.page.title.length)
    .slice(0, limit)
    .map((result) => ({ page: result.entry.page, heading: result.heading }))
}
