import type { Html, HtmlBuilder } from 'foldkit/html'
import { cn } from 'cn'
import { ArrowRight, Check } from 'lucide'
import { FIGURE } from '@quorum/ui/game/bits'
import { icon } from '@quorum/ui/primitives/icon'
import type { Message, Model } from '../main.ts'
import type { Page } from '../page.ts'
import { PATHS, placeOf, resumeOf, stepsOf, type Path } from '../paths.ts'
import { quadrantBadge, quadrantColor } from './quadrant.ts'

/* The guided paths in the page: where a reader is in one, and the step after it. */

type H = HtmlBuilder<Message>

/** One segment per step: read steps fill, the current one takes its kind's colour. */
const segments = (steps: ReadonlyArray<Page>, current: string | null, model: Model, h: H): Html =>
  h.ol(
    [h.Class('flex gap-1')],
    steps.map((step, index) =>
      h.li(
        [h.Key(step.path), h.Class('flex-1')],
        [
          h.a(
            [
              h.Href(step.path),
              h.Title(`${index + 1}. ${step.title}`),
              h.AriaLabel(`Step ${index + 1}: ${step.title}`),
              ...(step.path === current ? [h.AriaCurrent('step')] : []),
              h.Class(
                cn(
                  'block h-1.5 rounded-full transition-colors',
                  step.path === current
                    ? ''
                    : model.progress.visited.includes(step.path)
                      ? 'bg-foreground/45 hover:bg-foreground/60'
                      : 'bg-foreground/10 hover:bg-foreground/25',
                ),
              ),
              ...(step.path === current
                ? [h.Style({ background: quadrantColor(step.section) })]
                : []),
            ],
            [],
          ),
        ],
      ),
    ),
  )

/** Under a page's title: the path it belongs to and the reader's place in it. */
export const pathBar = (page: Page, model: Model, h: H): Html => {
  const place = placeOf(page.path)
  if (!place) return h.empty
  const steps = stepsOf(place.path)
  return h.nav(
    [h.AriaLabel(`Guided path: ${place.path.title}`), h.Class('mt-6 max-w-md')],
    [
      h.div(
        [h.Class('mb-2 flex items-baseline justify-between gap-3')],
        [
          h.span([h.Class('text-[12.5px] text-muted-foreground')], [`Path: ${place.path.title}`]),
          h.span(
            [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
            [`${place.index + 1} of ${steps.length}`],
          ),
        ],
      ),
      segments(steps, page.path, model, h),
    ],
  )
}

/** The next page, as docs sites end a page: a bordered link on the right. */
const nextCard = (label: string, target: Page, h: H): Html =>
  h.div(
    [h.Class('mt-14 flex justify-end')],
    [
      h.a(
        [
          h.Href(target.path),
          h.Class(
            'group flex w-full max-w-sm flex-col items-end gap-1 rounded-lg border border-border px-4 py-3 text-right transition-colors hover:border-foreground/30',
          ),
        ],
        [
          h.span([h.Class('text-[12.5px] text-muted-foreground')], [label]),
          h.span(
            [h.Class('flex items-center gap-1.5 text-[15px] font-medium')],
            [
              target.title,
              icon(h, ArrowRight, 'size-4 transition-transform group-hover:translate-x-0.5'),
            ],
          ),
        ],
      ),
    ],
  )

/** At a page's end: the next step of its path, or the next path when this one is done. */
export const pathNext = (page: Page, h: H): Html => {
  const place = placeOf(page.path)
  if (!place) return h.empty
  const steps = stepsOf(place.path)
  const next = steps[place.index + 1]
  if (next) return nextCard('Next', next, h)
  const following = PATHS[PATHS.indexOf(place.path) + 1]
  const first = following ? stepsOf(following)[0] : undefined
  return following && first ? nextCard(`Next path: ${following.title}`, first, h) : h.empty
}

/** A path on the home page: its steps as dots, and where to go on. */
export const pathCard = (path: Path, model: Model, h: H): Html => {
  const steps = stepsOf(path)
  const read = steps.filter((step) => model.progress.visited.includes(step.path)).length
  const resume = resumeOf(path, model.progress.visited)
  const target = resume ?? steps[0]
  const label = read === 0 ? 'Start' : resume ? 'Continue' : 'Read again'
  return h.article(
    [h.Key(path.id), h.Class('flex flex-col gap-4 bg-background p-5')],
    [
      h.div(
        [h.Class('flex items-start justify-between gap-3')],
        [
          h.div(
            [],
            [
              h.h3([h.Class('text-[18px] font-semibold tracking-tight')], [path.title]),
              h.p(
                [h.Class('mt-1 text-[13.5px] leading-snug text-pretty text-muted-foreground')],
                [path.summary],
              ),
            ],
          ),
          read === steps.length && steps.length > 0
            ? h.span(
                [h.Class('grid size-6 shrink-0 place-items-center rounded-full bg-ok text-white')],
                [icon(h, Check, 'size-3.5')],
              )
            : h.span(
                [h.Class(cn(FIGURE, 'shrink-0 text-[12px] text-muted-foreground'))],
                [`${read}/${steps.length}`],
              ),
        ],
      ),
      h.ol(
        [h.Class('flex flex-col gap-1')],
        steps.map((step, index) =>
          h.li(
            [h.Key(step.path)],
            [
              h.a(
                [
                  h.Href(step.path),
                  h.Class(
                    'group flex items-center gap-2.5 rounded-lg px-1.5 py-1 -mx-1.5 text-[13.5px] hover:bg-well',
                  ),
                ],
                [
                  h.span(
                    [
                      h.Class(
                        cn(
                          FIGURE,
                          'grid size-5 shrink-0 place-items-center rounded-full text-[10px]',
                          model.progress.visited.includes(step.path)
                            ? 'bg-foreground text-background'
                            : 'border border-border',
                        ),
                      ),
                    ],
                    [
                      model.progress.visited.includes(step.path)
                        ? icon(h, Check, 'size-3')
                        : String(index + 1),
                    ],
                  ),
                  h.span([h.Class('min-w-0 flex-1 truncate')], [step.title]),
                  quadrantBadge(step.section, 'size-4 opacity-80', h),
                ],
              ),
            ],
          ),
        ),
      ),
      target
        ? h.a(
            [
              h.Href(target.path),
              h.Class(
                'mt-auto inline-flex w-fit items-center gap-1.5 text-[13.5px] font-medium hover:underline',
              ),
            ],
            [
              label === 'Continue' ? `Continue: ${target.title}` : label,
              icon(h, ArrowRight, 'size-4'),
            ],
          )
        : h.empty,
    ],
  )
}
