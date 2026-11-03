import { Menu } from '@foldkit/ui'

/** On a phone the toolbar keeps the controls you use all the time; the rest wait in More. */
export type MoreItem =
  | 'exit'
  | 'playbooks'
  | 'dashboard'
  | 'help'
  | 'glossary'
  | 'undo'
  | 'redo'
  | 'tidy'
  | 'fit'
  | 'fullscreen'

export const moreMenu = Menu.create<MoreItem>()
