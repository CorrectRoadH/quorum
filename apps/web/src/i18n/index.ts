import { Schema } from 'effect'
import type { Html } from 'foldkit/html'
import { zhCN } from './zh-CN.ts'

export const Locale = Schema.Literals(['en', 'zh-CN'])
export type Locale = typeof Locale.Type

const patterns = Object.entries(zhCN)
  .filter(([key]) => /\{\d+\}/.test(key))
  .map(([key, value]) => {
    const parts = key.split(/\{\d+\}/)
    const expression = parts
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('(.+?)')
    return { pattern: new RegExp(`^${expression}$`, 's'), value }
  })

/** Translate complete presentation messages; never replace words inside unknown prose. */
export const translate = (locale: Locale, text: string): string => {
  if (locale === 'en') return text
  const direct = Object.hasOwn(zhCN, text) ? zhCN[text] : undefined
  if (direct !== undefined) return direct
  for (const { pattern, value } of patterns) {
    const match = pattern.exec(text)
    if (match)
      return value.replace(/\{(\d+)\}/g, (_, index: string) =>
        translate(locale, match[Number(index) + 1] ?? ''),
      )
  }
  return text
}

/** Copy the fresh view, preserving all behavior and identity metadata. */
export const localizeHtml = (locale: Locale, html: Html): Html => {
  // Traverse both languages: Foldkit brands function results, so an English-only
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
