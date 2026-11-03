import type { HtmlBuilder } from 'foldkit/html'
import { Message } from '../game/message.ts'
import type { Locale } from './index.ts'

/** Always reachable, including before clock-in and while a company is paused. */
export const languagePicker = (locale: Locale, onBoard: boolean, h: HtmlBuilder<Message>) =>
  h.div(
    [
      h.Class(
        `fixed z-50 flex gap-1 rounded-lg border border-hairline bg-background/95 p-1 text-xs shadow-sm ${onBoard ? 'bottom-2 left-3 compact:bottom-20' : 'top-8 right-8'}`,
      ),
      h.Role('group'),
      h.AriaLabel('Language'),
    ],
    (['en', 'zh-CN'] as const).map((choice) =>
      h.button(
        [
          h.Type('button'),
          h.AriaPressed(locale === choice ? 'true' : 'false'),
          h.Attribute('lang', choice),
          h.OnClick(Message.LocaleChosen({ locale: choice })),
          h.Class(
            `rounded-md px-2 py-1 focus-visible:outline-2 ${locale === choice ? 'bg-muted font-semibold' : 'text-muted-foreground hover:bg-muted'}`,
          ),
        ],
        [choice === 'en' ? 'English' : '简体中文'],
      ),
    ),
  )
