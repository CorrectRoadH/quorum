import { Listbox } from '@foldkit/ui'
import { Option } from 'effect'
import type { HtmlBuilder } from 'foldkit/html'
import { Check, ChevronDown } from 'lucide'
import { icon } from '../lib/icons.ts'
import { Message } from '../game/message.ts'
import { languageListbox } from './listbox.ts'
import { supportedLocales, translate, type Locale } from './index.ts'

/** Always reachable, including before clock-in and while a company is paused. */
export const languagePicker = (
  locale: Locale,
  model: Listbox.Model,
  onBoard: boolean,
  h: HtmlBuilder<Message>,
) =>
  h.div(
    [
      h.DataAttribute('language-picker', ''),
      // Keep the non-portaled menu inside the title's scoped dark palette.
      h.Class(
        `fixed z-50 text-foreground ${onBoard ? 'bottom-2 left-3 compact:bottom-20' : 'dark scheme-dark top-8 right-8 compact:top-4 compact:right-4'}`,
      ),
    ],
    [
      h.submodel({
        slotId: 'interface-language',
        model,
        view: languageListbox.view,
        toParentMessage: (message) => Message.LanguagePickerChanged({ message }),
        viewInputs: {
          items: supportedLocales,
          itemToValue: (choice) => choice.value,
          itemToSearchText: (choice) => choice.label,
          maybeSelectedValue: Option.some(locale),
          ariaLabel: translate(locale, 'Language'),
          anchor: { placement: onBoard ? 'top-start' : 'bottom-end', gap: 6, portal: false },
          buttonClassName:
            'flex h-8 min-w-32 cursor-pointer items-center justify-between gap-3 rounded-lg bg-well px-2.5 text-sm text-foreground shadow-well outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
          buttonContent: h.span(
            [h.Class('flex w-full items-center justify-between gap-3')],
            [
              h.span(
                [h.Attribute('lang', locale)],
                [supportedLocales.find((choice) => choice.value === locale)?.label ?? locale],
              ),
              icon(h, ChevronDown, 'size-4 text-muted-foreground'),
            ],
          ),
          itemsClassName:
            'z-50 min-w-40 rounded-xl border border-border bg-raised p-1 text-foreground shadow-lg outline-none',
          itemsScrollClassName: 'max-h-64 overflow-y-auto',
          backdropClassName: 'fixed inset-0 z-40',
          itemToConfig: (choice, { isActive, isSelected }) => ({
            className: `flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm outline-none ${isActive ? 'bg-muted text-foreground' : ''}`,
            content: h.span(
              [
                h.Class('flex w-full items-center justify-between gap-4'),
                h.Attribute('lang', choice.value),
              ],
              [
                h.span([], [choice.label]),
                h.span(
                  [h.AriaHidden(true), h.Class(isSelected ? '' : 'invisible')],
                  [icon(h, Check, 'size-4 text-primary')],
                ),
              ],
            ),
          }),
        },
      }),
    ],
  )
