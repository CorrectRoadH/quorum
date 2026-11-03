import { Listbox } from '@foldkit/ui'
import type { Locale, supportedLocales } from './index.ts'

export const languageListbox = Listbox.create<(typeof supportedLocales)[number], Locale>()
