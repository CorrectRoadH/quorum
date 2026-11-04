import { Schema } from 'effect'
import type { Html } from 'foldkit/html'
import { zhCN } from './zh-CN.ts'
import { fr } from './fr.ts'

export const supportedLocales = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'zh-CN', label: '简体中文' },
] as const

export const Locale = Schema.Literals(supportedLocales.map(({ value }) => value))
export type Locale = typeof Locale.Type

const dictionaries = { fr, 'zh-CN': zhCN }

const compile = (dictionary: Readonly<Record<string, string>>) =>
  Object.entries(dictionary)
    .filter(([key]) => /\{\d+\}/.test(key))
    .map(([key, value]) => {
      const parts = key.split(/\{\d+\}/)
      const slots = Array.from(key.matchAll(/\{(\d+)\}/g), (match) => match[1]!)
      // Compact durations such as "{0}h" contain numbers, not arbitrary words
      // ending in h (including the language name "English").
      const capture = /^\{\d+\}[dhms]$/.test(key) ? '([\\d.,+−-]+)' : '(.*?)'
      const expression = parts
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join(capture)
      return {
        pattern: new RegExp(`^${expression}$`, 's'),
        prefix: parts[0]!,
        suffix: parts[parts.length - 1]!,
        specificity: parts.join('').length,
        slots,
        value,
      }
    })
    // A broad message such as "{0} users" must not shadow a whole explanation.
    .filter(({ specificity }) => specificity > 0)
    .sort((a, b) => b.specificity - a.specificity)

const patterns = { fr: compile(fr), 'zh-CN': compile(zhCN) }

/** Translate complete presentation messages; never replace words inside unknown prose. */
export const translate = (locale: Locale, text: string): string => {
  if (locale === 'en') return text
  const dictionary = dictionaries[locale]
  const direct = Object.hasOwn(dictionary, text) ? dictionary[text] : undefined
  if (direct !== undefined) return direct
  // Lists are assembled from catalog labels (for example newly shipped Features).
  // Only translate a list when every item is known; unknown prose keeps its fallback.
  const list = text.split(/(, | · )/)
  if (
    list.length > 1 &&
    list.every((part, index) => index % 2 === 1 || Object.hasOwn(dictionary, part))
  )
    return list.map((part, index) => (index % 2 === 1 ? part : dictionary[part])).join('')
  for (const { pattern, prefix, suffix, slots, value } of patterns[locale]) {
    if (!text.startsWith(prefix) || !text.endsWith(suffix)) continue
    const match = pattern.exec(text)
    if (match) {
      const values = new Map(slots.map((slot, index) => [slot, match[index + 1] ?? '']))
      return value.replace(/\{(\d+)\}/g, (_, index: string) =>
        translate(locale, values.get(index) ?? ''),
      )
    }
  }
  return text
}

/** Copy the fresh view, preserving all behavior and identity metadata. */
export const localizeHtml = (locale: Locale, html: Html): Html => {
  // Traverse all languages: Foldkit brands function results, so an English-only
  // shortcut would change ancestor identities and remount the live Pixi board.
  if (html === null) return html
  const props = html.data?.props
  const translatedProps = props ? { ...props } : undefined
  if (translatedProps)
    for (const key of ['title', 'alt', 'placeholder']) {
      const value = translatedProps[key]
      if (typeof value === 'string') translatedProps[key] = translate(locale, value)
    }
  const attrs = html.data?.attrs
  const translatedAttrs = attrs ? { ...attrs } : undefined
  if (translatedAttrs)
    for (const key of ['title', 'alt', 'placeholder', 'aria-label']) {
      const value = translatedAttrs[key]
      if (typeof value === 'string') translatedAttrs[key] = translate(locale, value)
    }
  return {
    ...html,
    ...(html.data
      ? {
          data: {
            ...html.data,
            ...(translatedAttrs ? { attrs: translatedAttrs } : {}),
            ...(translatedProps ? { props: translatedProps } : {}),
          },
        }
      : {}),
    text: html.text === undefined ? undefined : translate(locale, html.text),
    children: html.children?.map((child) =>
      typeof child === 'string' ? translate(locale, child) : localizeHtml(locale, child)!,
    ),
  }
}
