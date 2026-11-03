import type { HtmlBuilder } from 'foldkit/html'
import { nativeSelect } from '../components/ui/native-select.ts'
import { Message } from '../game/message.ts'
import { supportedLocales, type Locale } from './index.ts'

/** Always reachable, including before clock-in and while a company is paused. */
export const languagePicker = (locale: Locale, onBoard: boolean, h: HtmlBuilder<Message>) =>
  h.div(
    [
      // The title owns a local dark palette; this sibling needs the same scope.
      h.Class(
        `fixed z-50 text-foreground ${onBoard ? 'bottom-2 left-3 compact:bottom-20' : 'dark scheme-dark top-8 right-8 compact:top-4 compact:right-4'}`,
      ),
    ],
    [
      nativeSelect(
        {
          id: 'interface-language',
          label: 'Language',
          labelClass: 'sr-only',
          value: locale,
          className: 'min-w-32 cursor-pointer',
          onChange: (value) =>
            Message.LocaleChosen({
              locale: supportedLocales.find((choice) => choice.value === value)?.value ?? locale,
            }),
          options: supportedLocales.map((choice) =>
            h.option([h.Value(choice.value), h.Attribute('lang', choice.value)], [choice.label]),
          ),
        },
        h,
      ),
    ],
  )
