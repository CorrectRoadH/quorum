import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import type { Message } from '../main.ts'
import type { Page } from '../page.ts'

/* The right rail: the page's headings. */

export const toc = (page: Page, h: HtmlBuilder<Message>): Html =>
  page.headings.length < 2
    ? h.empty
    : h.nav(
        [
          h.AriaLabel('On this page'),
          h.Class('sticky top-[100px] hidden self-start py-8 xl:block'),
        ],
        [
          h.div([h.Class('mb-2 text-[12.5px] font-semibold')], ['On this page']),
          h.ul(
            [h.Class('border-l border-border')],
            page.headings.map((heading) =>
              h.li(
                [h.Key(heading.id)],
                [
                  h.a(
                    [
                      h.Href(`#${heading.id}`),
                      h.Class(
                        cn(
                          '-ml-px block border-l border-transparent py-1 text-[13px] text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                          heading.level === 3 ? 'pl-6' : 'pl-3',
                        ),
                      ),
                    ],
                    [heading.text],
                  ),
                ],
              ),
            ),
          ),
        ],
      )
