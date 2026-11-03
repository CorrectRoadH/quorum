import type { Html, HtmlBuilder } from 'foldkit/html'
import { ArrowUpRight, Check, Search } from 'lucide'
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
  type GlossaryEntry,
} from '@quorum/simulation/catalog'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, SCROLL, WELL } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   The Glossary (15, glossary.md): every engineering term the game uses, what
   it does in the game, and where to read more. Terms the player has met in
   play carry a check; the rest stay readable.
   ========================================================================== */

const CATEGORY_NAMES: Record<GlossaryCategory, string> = {
  performance: 'Performance',
  reliability: 'Reliability',
  data: 'Data',
  runtimes: 'Runtimes',
  network: 'Network',
  security: 'Security',
  delivery: 'Delivery',
  team: 'Team',
  business: 'Business',
}

const BY_ID = new Map(GLOSSARY.map((entry) => [entry.id, entry]))

const matches = (entry: GlossaryEntry, query: string, category: string | null): boolean => {
  if (category !== null && entry.category !== category) return false
  const text = query.trim().toLowerCase()
  return (
    text === '' ||
    entry.term.toLowerCase().includes(text) ||
    entry.definition.toLowerCase().includes(text) ||
    entry.inGame.toLowerCase().includes(text)
  )
}

const filter = (
  key: string,
  label: string,
  category: GlossaryCategory | null,
  chosen: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.button(
    [
      h.Key(key),
      h.Type('button'),
      h.AriaPressed(chosen ? 'true' : 'false'),
      h.OnClick(Message.GlossaryFiltered({ category })),
      h.Class(
        cn(
          'h-7 shrink-0 rounded-lg px-2.5 text-[12px] font-medium transition-colors',
          chosen
            ? 'bg-raised text-foreground shadow-raised'
            : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
        ),
      ),
    ],
    [label],
  )

const filters = (chosen: string | null, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('px-5 pb-3')],
    [
      h.div(
        [
          h.Role('group'),
          h.AriaLabel('Category'),
          h.Class(
            cn(
              'flex gap-[3px] overflow-x-auto rounded-[11px] p-[3px] [scrollbar-width:none]',
              WELL,
            ),
          ),
        ],
        [
          filter('all', 'All', null, chosen === null, h),
          ...GLOSSARY_CATEGORIES.map((category) =>
            filter(category, CATEGORY_NAMES[category], category, chosen === category, h),
          ),
        ],
      ),
    ],
  )

const row = (entry: GlossaryEntry, open: boolean, met: boolean, h: HtmlBuilder<Message>): Html =>
  h.li(
    [h.Key(entry.id)],
    [
      h.button(
        [
          h.Type('button'),
          h.AriaCurrent(open ? 'true' : 'false'),
          h.OnClick(Message.GlossaryOpened({ id: entry.id })),
          h.Class(
            cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors',
              open
                ? 'bg-primary-fill text-on-primary-fill'
                : met
                  ? 'text-foreground hover:bg-well'
                  : 'text-muted-foreground hover:bg-well hover:text-foreground',
            ),
          ),
        ],
        [
          h.span([h.Class('flex-1 truncate')], [entry.term]),
          ...(met
            ? [icon(h, Check, 'size-3.5 shrink-0'), h.span([h.Class('sr-only')], ['met'])]
            : []),
        ],
      ),
    ],
  )

const section = (label: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>): Html =>
  h.section(
    [h.AriaLabel(label), h.Class('flex flex-col gap-2')],
    [h.h3([h.Class(EYEBROW)], [label]), ...children],
  )

const related = (entry: GlossaryEntry, met: (id: string) => boolean, h: HtmlBuilder<Message>) =>
  h.ul(
    [h.Class('flex flex-wrap gap-1.5')],
    entry.related.flatMap((id) => {
      const other = BY_ID.get(id)
      if (!other) return []
      return [
        h.li(
          [h.Key(id)],
          [
            h.button(
              [
                h.Type('button'),
                h.OnClick(Message.GlossaryOpened({ id })),
                h.Class(
                  'flex h-7 items-center gap-1.5 rounded-lg bg-well px-2.5 text-[12.5px] shadow-well transition-colors hover:bg-foreground/10',
                ),
              ],
              [
                other.term,
                ...(met(id) ? [icon(h, Check, 'size-3 shrink-0 text-muted-foreground')] : []),
              ],
            ),
          ],
        ),
      ]
    }),
  )

const links = (entry: GlossaryEntry, h: HtmlBuilder<Message>) =>
  h.ul(
    [h.Class('flex flex-col')],
    entry.links.map((link) =>
      h.li(
        [h.Key(link.url)],
        [
          h.a(
            [
              h.Href(link.url),
              h.Target('_blank'),
              h.Rel('noreferrer noopener'),
              h.Class(
                'group inline-flex items-center gap-1 py-1 text-[13px] text-foreground underline decoration-foreground/25 underline-offset-[3px] transition-colors hover:decoration-foreground',
              ),
            ],
            [
              link.label,
              icon(
                h,
                ArrowUpRight,
                'size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-px group-hover:-translate-y-px',
              ),
            ],
          ),
        ],
      ),
    ),
  )

const detail = (entry: GlossaryEntry, met: (id: string) => boolean, h: HtmlBuilder<Message>) =>
  h.article(
    [h.Key(entry.id), h.Class('flex flex-col gap-5')],
    [
      h.header(
        [h.Class('flex flex-col gap-1.5')],
        [
          h.span([h.Class(EYEBROW)], [CATEGORY_NAMES[entry.category]]),
          h.h2([h.Class('text-[20px] font-semibold tracking-[-0.02em]')], [entry.term]),
          h.p([h.Class('text-[14px] leading-relaxed text-pretty')], [entry.definition]),
        ],
      ),
      h.div(
        [h.Class(cn(WELL, 'flex flex-col gap-2 p-3.5'))],
        [
          h.span([h.Class(EYEBROW)], ['In the game']),
          h.p([h.Class('text-[13.5px] leading-relaxed text-pretty')], [entry.inGame]),
        ],
      ),
      ...(entry.related.length > 0 ? [section('Related', [related(entry, met, h)], h)] : []),
      ...(entry.links.length > 0 ? [section('Learn more', [links(entry, h)], h)] : []),
    ],
  )

export const glossaryPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const shown = GLOSSARY.filter((entry) =>
    matches(entry, model.glossaryQuery, model.glossaryCategory),
  )
  const open =
    (model.glossaryFocus !== null ? BY_ID.get(model.glossaryFocus) : undefined) ??
    shown[0] ??
    GLOSSARY[0]
  const met = (id: string) => model.founder.glossary.includes(id)
  const metCount = GLOSSARY.filter((entry) => met(entry.id)).length
  return shell(
    'Glossary',
    [
      h.span(
        [
          h.Class(
            cn(FIGURE, 'flex items-center gap-1 text-[12px] text-muted-foreground compact:hidden'),
          ),
          h.AriaLabel(`${metCount} of ${GLOSSARY.length} terms met`),
        ],
        [icon(h, Check, 'size-3.5'), `${metCount} / ${GLOSSARY.length}`],
      ),
      h.label(
        [h.Class(cn(WELL, 'flex h-8 w-56 items-center gap-2 px-2.5 compact:w-40'))],
        [
          icon(h, Search, 'size-3.5 shrink-0 text-muted-foreground'),
          h.input([
            h.Type('search'),
            h.AriaLabel('Search the glossary'),
            h.Value(model.glossaryQuery),
            h.OnInput((query) => Message.GlossarySearched({ query })),
            h.Class('w-full min-w-0 bg-transparent text-[13px] outline-none'),
          ]),
        ],
      ),
    ],
    [
      filters(model.glossaryCategory, h),
      h.div(
        [
          h.Class(
            'grid h-[min(560px,64vh)] min-h-0 grid-cols-[232px_minmax(0,1fr)] gap-6 px-5 pb-5 compact:h-auto compact:grid-cols-1 compact:gap-4',
          ),
        ],
        [
          shown.length > 0
            ? h.ul(
                [
                  h.AriaLabel('Terms'),
                  h.Class(cn('flex min-h-0 flex-col gap-0.5 pr-1 compact:max-h-[28vh]', SCROLL)),
                ],
                shown.map((entry) => row(entry, entry.id === open?.id, met(entry.id), h)),
              )
            : h.p([h.Class('px-2.5 py-1.5 text-[13px] text-muted-foreground')], ['No matches']),
          h.div(
            [h.Class(cn('min-h-0 pr-1 compact:max-h-[50vh]', SCROLL))],
            open ? [detail(open, met, h)] : [],
          ),
        ],
      ),
    ],
    'max-w-[960px]',
    h,
  )
}
