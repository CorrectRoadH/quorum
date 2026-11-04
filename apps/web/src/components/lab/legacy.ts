import type { Html, HtmlBuilder } from 'foldkit/html'
import { BookCopy, Clipboard, Copy, CopyPlus, Plus, Stamp, Trash2, Upload, X } from 'lucide'
import { COMPONENTS, ERAS, EXITS, RESEARCH } from '@quorum/simulation/catalog'
import { exitOffers } from '@quorum/simulation/exit'
import { keepSlots, playbookSlots } from '@quorum/simulation/founder'
import { refundOf } from '@quorum/simulation/lookups'
import { legacyMultiplier } from '@quorum/simulation/founding'
import { valuationOf } from '@quorum/simulation/valuation'
import { clock, compact, money } from '@/game/format.ts'
import { Message } from '@/game/message.ts'
import { ledgerOf, type Model, offCompany, stampedPlaybook } from '@/game/model.ts'
import { icon } from '@quorum/ui/primitives/icon'
import { button } from '@quorum/ui/primitives/button'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, NESTED, SCROLL, WELL } from './bits.ts'
import { shell } from './panels.ts'

/* ==========================================================================
   Exit and Legacy on the board (13): the Exit offers, the summary after an
   Exit, the return from time away, and the Playbooks tray.
   ========================================================================== */

const stat = (name: string, value: string, h: HtmlBuilder<Message>) =>
  h.div(
    [h.Key(name), h.Class('flex flex-col gap-1 px-4 py-3')],
    [h.span([h.Class(EYEBROW)], [name]), h.span([h.Class(cn(FIGURE, 'text-[18px]'))], [value])],
  )

const stats = (columns: string, children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div([h.Class(cn('grid w-full divide-x divide-hairline', WELL, columns))], children)

const footer = (children: ReadonlyArray<Html>, h: HtmlBuilder<Message>) =>
  h.div([h.Class('flex justify-end gap-2 border-t border-hairline bg-nested px-5 py-3')], children)

export const exitPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const game = model.board.game
  const ledger = ledgerOf(model)
  const value = valuationOf(game, ledger)
  const offers = exitOffers(game, ledger)
  return shell(
    'Exit',
    [],
    [
      h.div(
        [h.Class(`flex flex-col gap-4 px-5 pt-1 pb-5 ${SCROLL}`)],
        [
          stats(
            'grid-cols-4 narrow:grid-cols-2',
            [
              stat('Valuation', money(value.valuation), h),
              stat('Rule of 40', value.ruleOf40.toFixed(0), h),
              stat('Equity', `${Math.round(game.equity * 100)}%`, h),
              stat('Legacy ×', legacyMultiplier(game.founding).toFixed(2), h),
            ],
            h,
          ),
          h.div(
            [h.Class(cn(NESTED, 'flex flex-col divide-y divide-hairline'))],
            offers.map((offer) =>
              h.div(
                [h.Key(offer.id), h.Class('flex items-center gap-3 px-4 py-3')],
                [
                  h.div(
                    [h.Class('flex min-w-0 flex-1 flex-col gap-0.5')],
                    [
                      h.span([h.Class('text-[14px] font-semibold')], [EXITS[offer.id].name]),
                      h.span(
                        [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
                        [`${money(offer.payout)} payout · ×${offer.multiplier.toFixed(1)}`],
                      ),
                    ],
                  ),
                  button(
                    { onClick: Message.ExitTaken({ exit: offer.id }), size: 'lg' },
                    [`Take · ${offer.legacy} Legacy`],
                    h,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
    'max-w-[620px]',
    h,
  )
}

/** A small drawing of the Design at Exit. */
export const snapshotSvg = (
  snapshot: Model['founder']['history'][number]['snapshot'],
  h: HtmlBuilder<Message>,
  className: string,
): Html => {
  const xs = snapshot.nodes.map((node) => node.x)
  const ys = snapshot.nodes.map((node) => node.y)
  const left = Math.min(0, ...xs) - 40
  const top = Math.min(0, ...ys) - 40
  const width = Math.max(400, ...xs) - left + 280
  const height = Math.max(300, ...ys) - top + 200
  return h.svg(
    [
      h.AriaHidden(true),
      h.Xmlns('http://www.w3.org/2000/svg'),
      h.ViewBox(`${left} ${top} ${width} ${height}`),
      h.Class(className),
      h.Fill('none'),
    ],
    [
      ...snapshot.links.map(([from, to], index) => {
        const a = snapshot.nodes[from]
        const b = snapshot.nodes[to]
        return a && b
          ? h.path(
              [
                h.Key(`l${index}`),
                h.D(`M${a.x + 108} ${a.y + 40} L${b.x + 108} ${b.y + 40}`),
                h.StrokeWidth('6'),
                h.Class('stroke-foreground/25'),
              ],
              [],
            )
          : h.empty
      }),
      ...snapshot.nodes.map((node, index) =>
        h.rect(
          [
            h.Key(`n${index}`),
            h.X(String(node.x)),
            h.Y(String(node.y)),
            h.Width('216'),
            h.Height('80'),
            h.Rx('16'),
            h.Fill(`var(--group-${COMPONENTS[node.type].group})`),
            h.Attribute('opacity', '0.75'),
          ],
          [],
        ),
      ),
    ],
  )
}

export const exitedPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const exited = model.board.exited
  if (!exited) return h.empty
  const row = exited.row
  const slots = keepSlots(model.founder)
  const kept = model.founder.keep
  return shell(
    EXITS[row.exit].name,
    [],
    [
      h.div(
        [h.Class(`flex min-h-0 flex-col items-center gap-4 px-6 pt-1 pb-5 ${SCROLL}`)],
        [
          snapshotSvg(
            row.snapshot,
            h,
            'h-[180px] w-full max-w-[520px] rounded-xl bg-well shadow-well p-2',
          ),
          h.span(
            [h.Class(cn(FIGURE, 'text-[30px] font-semibold tracking-[-0.035em]'))],
            [`+${row.legacy} Legacy`],
          ),
          stats(
            'grid-cols-4 narrow:grid-cols-2',
            [
              stat('Payout', money(row.payout), h),
              stat('Peak users', compact(row.peak), h),
              stat('Era', ERAS[row.stage]?.name ?? '', h),
              stat('Played', clock(row.time), h),
            ],
            h,
          ),
          slots > 0
            ? h.div(
                [h.Class('flex w-full flex-col gap-2')],
                [
                  h.span([h.Class(EYEBROW)], [`Keep research · ${kept.length}/${slots}`]),
                  h.div(
                    [h.Class('flex flex-wrap gap-1.5')],
                    exited.researched.map((id) =>
                      button(
                        {
                          onClick: Message.KeepToggled({ id }),
                          size: 'xs',
                          variant: kept.includes(id) ? 'default' : 'outline',
                          attributes: [h.Key(id)],
                        },
                        RESEARCH[id].name,
                        h,
                      ),
                    ),
                  ),
                ],
              )
            : h.empty,
        ],
      ),
      footer(
        [
          button(
            { onClick: Message.MenuChosen({ menu: 'legacy' }), variant: 'outline', size: 'lg' },
            'Legacy shop',
            h,
          ),
          button({ onClick: Message.TitleOpened(), size: 'lg' }, 'Next company', h),
        ],
        h,
      ),
    ],
    'max-w-[680px]',
    h,
  )
}

/** The return from time away (15 "Offline return"). */
export const awayPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const away = model.board.away
  if (!away) return h.empty
  const hours = away.away / 3_600
  const capped = away.seconds < away.away
  return shell(
    `Away ${hours >= 1 ? `${hours.toFixed(1)} h` : `${Math.round(away.away / 60)} min`}`,
    [],
    [
      h.div(
        [h.Class('flex flex-col gap-3 px-5 pt-1 pb-5')],
        [
          stats(
            'grid-cols-4 narrow:grid-cols-2',
            [
              stat('Users', `${compact(away.usersBefore)} → ${compact(away.usersAfter)}`, h),
              stat('Cash', `${away.cash >= 0 ? '+' : ''}${money(away.cash)}`, h),
              stat('Studies', `${away.studied.length}`, h),
              stat('Dev Hours', `+${compact(away.devHours)}`, h),
            ],
            h,
          ),
          h.span(
            [h.Class(cn(FIGURE, 'text-[12.5px] text-muted-foreground'))],
            [
              `Peak ${Math.round(away.peak * 100)}% load${away.peakNode ? ` on ${away.peakNode}` : ''} at ${String(away.peakHour).padStart(2, '0')}:00${capped ? ` · capped at ${Math.round(away.seconds / 3_600)} h` : ''}`,
            ],
          ),
          away.lost
            ? h.span(
                [h.Class('text-[12.5px] text-warn')],
                ['Users left at peak. Add capacity before you go.'],
              )
            : h.empty,
        ],
      ),
      footer([button({ onClick: Message.AwayClosed(), size: 'lg' }, 'Continue', h)], h),
    ],
    'max-w-[620px]',
    h,
  )
}

/** Shown while Nodes are shift-selected: save them as a Playbook. */
export const selectionBar = (model: Model, h: HtmlBuilder<Message>): Html =>
  offCompany(model)
    ? h.empty
    : model.board.selection.length === 0
      ? h.empty
      : h.div(
          [
            h.Key('selection'),
            h.Class(
              'pointer-events-auto enter-pop flex h-[52px] items-center gap-2 rounded-2xl bg-surface py-1.5 pr-1.5 pl-3.5 text-[12.5px] shadow-card',
            ),
          ],
          [
            h.span([h.Class(FIGURE)], [`${model.board.selection.length} selected`]),
            ...(
              [
                [Message.NodesCopied(), Copy, 'Copy (Ctrl+C)'],
                [Message.NodesDuplicated(), CopyPlus, 'Duplicate (Ctrl+D)'],
                [Message.SellAsked(), Trash2, 'Sell (Del)'],
                [Message.PlaybookSaved(), BookCopy, 'Save as Playbook'],
                [Message.SelectionCleared(), X, 'Clear selection (Esc)'],
              ] as const
            ).map(([onClick, glyph, label]) =>
              button(
                {
                  onClick,
                  size: 'icon-sm',
                  variant: 'ghost',
                  attributes: [h.AriaLabel(label), h.Title(label)],
                },
                icon(h, glyph, 'size-4'),
                h,
              ),
            ),
          ],
        )

/** Asks before Nodes are sold: the sale waits for Enter or the button. */
export const sellBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const ids = model.board.confirmSell
  if (!ids) return h.empty
  const refund = model.board.game.nodes
    .filter((node) => ids.includes(node.id))
    .reduce((total, node) => total + refundOf(model.board.game, node), 0)
  return h.div(
    [
      h.Key('sell'),
      h.Class(
        'pointer-events-auto enter-pop flex h-[52px] items-center gap-2 rounded-2xl bg-surface py-1.5 pr-1.5 pl-3.5 text-[12.5px] shadow-card',
      ),
    ],
    [
      h.span(
        [],
        [
          `Sell ${ids.length === 1 ? '1 Node' : `${ids.length} Nodes`}${refund > 0 ? ` for ${money(refund)}` : ''}?`,
        ],
      ),
      button(
        { onClick: Message.SellConfirmed(), size: 'sm', variant: 'destructive' },
        [icon(h, Trash2, 'size-3.5'), 'Sell'],
        h,
      ),
      button({ onClick: Message.SellDismissed(), size: 'sm', variant: 'ghost' }, 'Cancel', h),
    ],
  )
}

/** Shown while a Playbook follows the pointer. */
export const stampBar = (model: Model, h: HtmlBuilder<Message>): Html => {
  const playbook = stampedPlaybook(model)
  return playbook
    ? h.div(
        [
          h.Key('stamp'),
          h.Class(
            'enter-pop flex h-[52px] items-center gap-2 rounded-2xl bg-surface px-3.5 text-[12.5px] shadow-card',
          ),
        ],
        [icon(h, Stamp, 'size-3.5 text-primary-strong'), `Click to place ${playbook.name} · Esc`],
      )
    : h.empty
}

export const playbooksPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const founder = model.founder
  return shell(
    'Playbooks',
    [
      h.span(
        [h.Class(cn(FIGURE, 'text-[12px] text-muted-foreground'))],
        [`${founder.playbooks.length}/${playbookSlots(founder)}`],
      ),
      button(
        { onClick: Message.PlaybookImportAsked(), variant: 'outline', size: 'sm' },
        [icon(h, Upload, 'size-3.5'), 'Import'],
        h,
      ),
    ],
    [
      h.div(
        [h.Class(`flex flex-col gap-2 px-5 pt-1 pb-5 ${SCROLL}`)],
        founder.playbooks.length === 0
          ? [
              h.span(
                [h.Key('empty'), h.Class('text-[12.5px] text-muted-foreground')],
                ['Shift-click or shift-drag Nodes, then Save Playbook.'],
              ),
            ]
          : founder.playbooks.map((playbook, index) =>
              h.div(
                [h.Key(`p${index}`), h.Class(cn(NESTED, 'flex items-center gap-2 px-3 py-2'))],
                [
                  h.span(
                    [h.Class('min-w-0 flex-1 truncate text-[13px] font-medium')],
                    [playbook.name],
                  ),
                  h.span(
                    [h.Class(cn(FIGURE, 'text-[11.5px] text-muted-foreground'))],
                    [`${playbook.nodes.length} Nodes`],
                  ),
                  button(
                    { onClick: Message.PlaybookChosen({ index }), size: 'sm' },
                    [icon(h, Plus, 'size-3.5'), 'Place'],
                    h,
                  ),
                  button(
                    {
                      onClick: Message.PlaybookExported({ index }),
                      variant: 'ghost',
                      size: 'icon-sm',
                      attributes: [h.AriaLabel('Copy'), h.Title('Copy as text')],
                    },
                    icon(h, Clipboard, 'size-3.5'),
                    h,
                  ),
                  button(
                    {
                      onClick: Message.PlaybookDeleted({ index }),
                      variant: 'ghost',
                      size: 'icon-sm',
                      attributes: [h.AriaLabel('Delete'), h.Title('Delete')],
                    },
                    icon(h, Trash2, 'size-3.5'),
                    h,
                  ),
                ],
              ),
            ),
      ),
    ],
    'max-w-[560px]',
    h,
  )
}
