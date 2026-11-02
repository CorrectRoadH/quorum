import type { Html, HtmlBuilder } from 'foldkit/html'
import { Check, Search } from 'lucide'
import { GLOSSARY, type GlossaryEntry } from '@template/simulation/catalog'
import { Message } from '@/game/message.ts'
import type { Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { EYEBROW, SCROLL, WELL } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   The Glossary (15, glossary.md): every engineering term the game uses.
   Terms the player has met in play carry a check; the rest stay readable.
   ========================================================================== */

const matches = (entry: GlossaryEntry, query: string): boolean => {
  const text = query.trim().toLowerCase()
  return (
    text === '' ||
    entry.term.toLowerCase().includes(text) ||
    entry.definition.toLowerCase().includes(text)
  )
}

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
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]',
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

const detail = (entry: GlossaryEntry, h: HtmlBuilder<Message>): Html =>
  h.article(
    [h.Key(entry.id), h.Class('flex flex-col gap-3')],
    [
      h.h2([h.Class('text-[17px] font-semibold tracking-[-0.02em]')], [entry.term]),
      h.p([h.Class('text-[13.5px] leading-relaxed')], [entry.definition]),
      h.div(
        [h.Class(cn(WELL, 'flex flex-col gap-1.5 p-3'))],
        [
          h.span([h.Class(EYEBROW)], ['In the game']),
          h.p([h.Class('text-[13px] leading-relaxed')], [entry.inGame]),
        ],
      ),
    ],
  )

export const glossaryPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const shown = GLOSSARY.filter((entry) => matches(entry, model.glossaryQuery))
  const open = GLOSSARY.find((entry) => entry.id === model.glossaryFocus) ?? shown[0] ?? GLOSSARY[0]
  const met = (entry: GlossaryEntry) => model.founder.glossary.includes(entry.id)
  return shell(
    'Glossary',
    [
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
      h.div(
        [
          h.Class(
            'grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] gap-5 px-5 pt-1 pb-5 compact:grid-cols-1',
          ),
        ],
        [
          h.ul(
            [h.AriaLabel('Terms'), h.Class(cn('flex max-h-[60vh] flex-col gap-0.5 pr-1', SCROLL))],
            shown.map((entry) => row(entry, entry.id === open?.id, met(entry), h)),
          ),
          h.div([h.Class(cn('max-h-[60vh] pr-1', SCROLL))], open ? [detail(open, h)] : []),
        ],
      ),
    ],
    'max-w-[820px]',
    h,
  )
}
