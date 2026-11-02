import type { Html, HtmlBuilder } from 'foldkit/html'
import {
  Activity,
  ArchiveRestore,
  Ban,
  CircleCheck,
  Cloud,
  Compass,
  CreditCard,
  Landmark,
  LifeBuoy,
  Mail as MailIcon,
  ShieldAlert,
  Trash2,
  TrendingUp,
  User,
  X,
  type IconNode,
  Dices,
} from 'lucide'
import { button } from '@/components/ui/button'
import { clock } from '@/game/format.ts'
import { KIND_LABEL, SAMPLES, senderOf, type Sender, type SenderKind } from '@/game/mail.ts'
import type { BuildGroup } from '@quorum/simulation/catalog'
import { Kbd } from '@/components/ui/kbd'
import {
  nativeSelect,
  nativeSelectOptGroup,
  nativeSelectOption,
} from '@/components/ui/native-select'
import { Message } from '@/game/message.ts'
import type { Folder, Mail, Model } from '@/game/model.ts'
import { icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { EYEBROW, FIGURE, FLOAT, PANEL, SCROLL, groupBadge } from './bits.ts'

/* ==========================================================================
   The Inbox (GDD 18): the game's voice, as a mail window docked above its
   corner button. Senders wear the app's own badges: the shape and colour
   say what kind of party wrote (a person, a provider, an alarm), the way
   the dock's badges say what kind of Component it is.
   ========================================================================== */

/** The badge each kind of sender wears: a shape from the build groups, a glyph, a colour. */
const BADGE: Record<SenderKind, { group: BuildGroup; glyph: IconNode }> = {
  cloud: { group: 'edge', glyph: Cloud },
  monitoring: { group: 'ops', glyph: Activity },
  vendor: { group: 'ops', glyph: CreditCard },
  investor: { group: 'compute', glyph: TrendingUp },
  finance: { group: 'data', glyph: Landmark },
  customers: { group: 'edge', glyph: LifeBuoy },
  mentor: { group: 'compute', glyph: Compass },
  teammate: { group: 'data', glyph: User },
  security: { group: 'ops', glyph: ShieldAlert },
  spam: { group: 'edge', glyph: Ban },
}

/** The shape and glyph say what kind of party wrote; the colour is the brand it parodies. */
const badge = (sender: Sender, size: string, h: HtmlBuilder<Message>): Html => {
  const { group, glyph } = BADGE[sender.looks]
  return groupBadge(group, glyph, size, h, false, sender.color)
}

const inFolder = (mail: Mail, folder: Folder): boolean =>
  folder === 'trash' ? mail.trashed : !mail.trashed && mail.spam === (folder === 'spam')

const unreadIn = (model: Model, folder: Folder): number =>
  model.inbox.filter((mail) => inFolder(mail, folder) && !mail.read).length

export const inboxButton = (model: Model, h: HtmlBuilder<Message>): Html => {
  const unread = unreadIn(model, 'inbox')
  return h.button(
    [
      h.Key('inbox'),
      h.Type('button'),
      h.Title('Inbox (I)'),
      h.AriaLabel(unread > 0 ? `Inbox, ${unread} unread` : 'Inbox'),
      h.OnClick(Message.PanelOpened({ panel: 'inbox' })),
      h.Class(
        `absolute right-3 bottom-3 z-20 grid size-11 place-items-center ${PANEL} text-muted-foreground hover:text-foreground compact:right-[max(8px,env(safe-area-inset-right))] compact:bottom-[calc(max(8px,env(safe-area-inset-bottom))+84px)]`,
      ),
    ],
    [
      icon(h, MailIcon, 'size-[18px]'),
      unread > 0
        ? h.span(
            [
              h.Key(`unread-${unread}`),
              h.Class(
                cn(
                  FIGURE,
                  'enter-badge absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary-fill px-1 text-[10.5px] font-medium text-on-primary-fill shadow-raised',
                ),
              ),
            ],
            [String(unread)],
          )
        : h.empty,
    ],
  )
}

const row = (mail: Mail, open: boolean, h: HtmlBuilder<Message>): Html => {
  const sender = senderOf(mail.sender)
  return h.li(
    [h.Key(String(mail.id))],
    [
      h.button(
        [
          h.Type('button'),
          h.AriaCurrent(open ? 'true' : 'false'),
          h.OnClick(Message.MailOpened({ id: mail.id })),
          h.Class(
            cn(
              'relative flex w-full items-start gap-2.5 px-3.5 py-2 text-left',
              open ? 'bg-well' : 'hover:bg-well/50',
            ),
          ),
        ],
        [
          mail.read
            ? h.empty
            : h.span(
                [
                  h.Class('absolute top-[17px] left-1.5 size-1.5 rounded-full bg-primary-strong'),
                  h.Role('img'),
                  h.AriaLabel('Unread'),
                ],
                [],
              ),
          badge(sender, 'mt-px size-6', h),
          h.span(
            [h.Class('flex min-w-0 flex-1 flex-col gap-0.5')],
            [
              h.span(
                [h.Class('flex items-baseline gap-2')],
                [
                  h.span(
                    [
                      h.Class(
                        cn('flex-1 truncate text-[12.5px]', mail.read ? '' : 'font-semibold'),
                      ),
                    ],
                    [sender.name],
                  ),
                  mail.entries.length > 1
                    ? h.span(
                        [h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))],
                        [`×${mail.entries.length}`],
                      )
                    : h.empty,
                  h.span(
                    [h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))],
                    [clock(mail.time)],
                  ),
                ],
              ),
              h.span(
                [
                  h.Class(
                    cn(
                      'truncate text-[12px]',
                      mail.read ? 'text-muted-foreground' : 'text-foreground/85',
                    ),
                  ),
                ],
                [mail.subject],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

const folderTab = (
  folder: Folder,
  label: string,
  count: number,
  active: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.button(
    [
      h.Key(folder),
      h.Type('button'),
      h.AriaCurrent(active ? 'true' : 'false'),
      h.OnClick(Message.FolderChosen({ folder })),
      h.Class(
        cn(
          'press flex h-6 items-center gap-1.5 rounded-lg px-2.5 text-[12px]',
          active
            ? 'bg-raised font-medium text-foreground shadow-raised'
            : 'text-muted-foreground hover:text-foreground',
        ),
      ),
    ],
    [label, count > 0 ? h.span([h.Class(cn(FIGURE, 'text-[10.5px]'))], [String(count)]) : h.empty],
  )

const tool = (label: string, glyph: IconNode, message: Message, h: HtmlBuilder<Message>): Html =>
  button(
    {
      onClick: message,
      variant: 'ghost',
      size: 'icon-sm',
      className: 'text-muted-foreground',
      attributes: [h.AriaLabel(label), h.Title(label)],
    },
    icon(h, glyph, 'size-4'),
    h,
  )

const letter = (mail: Mail, h: HtmlBuilder<Message>): Html => {
  const sender = senderOf(mail.sender)
  const threaded = mail.entries.length > 1
  const buttons =
    mail.answer !== null
      ? [h.p([h.Class('flex-1 text-[12px] text-muted-foreground')], [mail.answer])]
      : mail.resolved === null
        ? mail.actions.slice(0, 3).map((action, index) =>
            button(
              {
                onClick: Message.MailActed({ id: mail.id, action: action.id }),
                variant: action.id.startsWith('show') ? 'outline' : 'default',
                size: 'sm',
                attributes: [h.Key(action.id)],
              },
              [action.label, Kbd({ className: 'ml-1 opacity-80' }, [String(index + 1)], h)],
              h,
            ),
          )
        : []
  return h.article(
    [h.Key(String(mail.id)), h.Class('flex min-h-0 flex-1 flex-col')],
    [
      h.div(
        [h.Class(cn('flex min-h-0 flex-1 flex-col gap-3 px-5 py-4', SCROLL))],
        [
          h.div(
            [h.Class('flex items-center gap-2')],
            [
              h.span([h.Class(EYEBROW)], [KIND_LABEL[sender.kind]]),
              mail.resolved === null
                ? h.empty
                : h.span(
                    [h.Class('flex items-center gap-1 text-[11.5px] font-medium text-ok')],
                    [icon(h, CircleCheck, 'size-3.5'), `Resolved ${clock(mail.resolved)}`],
                  ),
            ],
          ),
          h.h2(
            [h.Class('text-[16px] leading-snug font-semibold tracking-[-0.02em]')],
            [mail.subject],
          ),
          h.div(
            [h.Class('flex items-center gap-2.5')],
            [
              badge(sender, 'size-7', h),
              h.div(
                [h.Class('flex min-w-0 flex-col')],
                [
                  h.span([h.Class('truncate text-[12.5px] font-medium')], [sender.name]),
                  h.span(
                    [h.Class(cn(FIGURE, 'truncate text-[11px] text-muted-foreground'))],
                    [sender.address],
                  ),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class('flex flex-col gap-3 text-[13px] leading-relaxed')],
            mail.entries.map((entry, index) =>
              h.div(
                [
                  h.Key(`entry-${index}`),
                  h.Class(
                    threaded
                      ? 'flex flex-col gap-0.5 border-l-2 border-hairline pl-3'
                      : 'flex flex-col',
                  ),
                ],
                [
                  threaded
                    ? h.span(
                        [h.Class(cn(FIGURE, 'text-[10.5px] text-muted-foreground'))],
                        [clock(entry.time)],
                      )
                    : h.empty,
                  h.div(
                    [h.Class('flex flex-col gap-3 whitespace-pre-line')],
                    entry.text.split('\n\n').map((paragraph) => h.p([], [paragraph])),
                  ),
                ],
              ),
            ),
          ),
          h.p([h.Class('text-[11.5px] text-muted-foreground')], [sender.sign]),
        ],
      ),
      h.div(
        [h.Class('flex items-center gap-2 border-t border-hairline bg-nested px-3 py-2')],
        [
          ...buttons,
          h.span([h.Class('flex-1')], []),
          mail.trashed
            ? tool('Move to Inbox (E)', ArchiveRestore, Message.MailRestored({ id: mail.id }), h)
            : h.span(
                [h.Class('flex items-center')],
                [
                  tool(
                    mail.spam ? 'Not spam (S)' : 'Report spam (S)',
                    mail.spam ? MailIcon : Ban,
                    Message.MailMarkedSpam({ id: mail.id }),
                    h,
                  ),
                  tool('Delete (E)', Trash2, Message.MailTrashed({ id: mail.id }), h),
                ],
              ),
        ],
      ),
    ],
  )
}

const KIND_FOLDER: Record<Folder, string> = { inbox: 'Inbox', spam: 'Spam', trash: 'Trash' }

/** The Sandbox's stress bench: send any kind of Mail, one or many, without waiting for it. */
const generator = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [
      h.Class(
        'flex flex-wrap items-end gap-2 border-t border-hairline bg-nested px-3 py-2 compact:gap-1.5',
      ),
    ],
    [
      nativeSelect(
        {
          id: 'mail-sample',
          label: 'Sample',
          labelClass: 'sr-only',
          size: 'sm',
          value: model.mailSample,
          onChange: (id) => Message.MailSampleChosen({ id }),
          wrapperClass: 'w-64',
          options: [...new Set(SAMPLES.map((sample) => sample.group))].map((group) =>
            nativeSelectOptGroup(
              { label: group },
              SAMPLES.filter((sample) => sample.group === group).map((sample) =>
                nativeSelectOption({ value: sample.id, label: sample.label }, h),
              ),
              h,
            ),
          ),
        },
        h,
      ),
      ...[1, 10, 50].map((count) =>
        button(
          {
            onClick: Message.MailGenerated({ count }),
            variant: count === 1 ? 'default' : 'outline',
            size: 'sm',
            attributes: [
              h.Key(`send-${count}`),
              ...(count === 1
                ? []
                : [h.AriaLabel(`Send ${count} random`), h.Title(`Send ${count} random`)]),
            ],
          },
          count === 1 ? 'Send' : [icon(h, Dices, 'size-3.5'), `×${count}`],
          h,
        ),
      ),
      h.span([h.Class('flex-1')], []),
      button(
        { onClick: Message.MailResolved(), variant: 'ghost', size: 'sm' },
        'Resolve threads',
        h,
      ),
      button({ onClick: Message.MailCleared(), variant: 'ghost', size: 'sm' }, 'Clear', h),
    ],
  )

/** A mail window docked above the corner button: the Board stays in view and clickable. */
export const inboxPanel = (model: Model, h: HtmlBuilder<Message>): Html => {
  const newest = model.inbox.filter((mail) => inFolder(mail, model.folder)).reverse()
  const open = newest.find((mail) => mail.id === model.inboxFocus) ?? newest[0]
  return h.section(
    [
      h.Key('inbox-panel'),
      h.DataAttribute('exit', 'gesture'),
      h.AriaLabel('Inbox'),
      h.Class(
        `absolute right-3 bottom-[68px] z-30 flex h-[min(520px,calc(100%-96px))] w-[min(720px,calc(100%-24px))] flex-col overflow-hidden ${FLOAT} enter-panel compact:inset-x-2 compact:right-2 compact:bottom-[calc(max(8px,env(safe-area-inset-bottom))+136px)] compact:w-auto`,
      ),
    ],
    [
      h.div(
        [h.Class('flex items-center gap-2 px-3 py-2.5')],
        [
          h.div(
            [h.Class('flex gap-0.5 rounded-xl bg-well p-0.5 shadow-well')],
            [
              folderTab('inbox', 'Inbox', unreadIn(model, 'inbox'), model.folder === 'inbox', h),
              folderTab('spam', 'Spam', unreadIn(model, 'spam'), model.folder === 'spam', h),
              folderTab('trash', 'Trash', 0, model.folder === 'trash', h),
            ],
          ),
          h.span([h.Class('flex-1')], []),
          Kbd.group({}, [Kbd({}, ['J'], h), Kbd({}, ['K'], h)], h),
          Kbd({}, ['Esc'], h),
          button(
            {
              onClick: Message.PanelClosed(),
              variant: 'ghost',
              size: 'icon-sm',
              className: 'text-muted-foreground',
              attributes: [h.AriaLabel('Close (Esc)')],
            },
            icon(h, X, 'size-3.5'),
            h,
          ),
        ],
      ),
      model.sandbox ? generator(model, h) : h.empty,
      h.div(
        [
          h.Class(
            cn(
              'grid min-h-0 flex-1 grid-cols-[264px_minmax(0,1fr)] border-t border-hairline compact:grid-cols-1 compact:grid-rows-[minmax(0,1fr)_minmax(0,1.3fr)]',
            ),
          ),
        ],
        [
          h.ul(
            [
              h.AriaLabel('Mail'),
              h.Class(
                cn(
                  'flex flex-col divide-y divide-hairline border-r border-hairline compact:border-r-0 compact:border-b',
                  SCROLL,
                ),
              ),
            ],
            newest.length === 0
              ? [
                  h.li(
                    [h.Class('px-4 py-4 text-[12.5px] text-muted-foreground')],
                    [
                      model.folder === 'inbox'
                        ? 'No mail.'
                        : `${KIND_FOLDER[model.folder]} is empty.`,
                    ],
                  ),
                ]
              : newest.map((mail) => row(mail, mail.id === open?.id, h)),
          ),
          h.div([h.Class('flex min-h-0 min-w-0 flex-col')], open ? [letter(open, h)] : []),
        ],
      ),
    ],
  )
}
