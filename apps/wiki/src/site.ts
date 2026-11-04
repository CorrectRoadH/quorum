import { SIM_VERSION } from '@quorum/simulation/version'

/* The wiki's fixed facts: where it lives, where the game lives, and where its source is. */

export const WIKI_ORIGIN = 'https://wiki.playquorum.dev'
export const GAME_ORIGIN = 'https://playquorum.dev'
export const REPOSITORY = 'https://github.com/elianiva/quorum'

/** The Simulation version every number on the wiki comes from. */
export const VERSION = SIM_VERSION

/** A link to a file in the repository, for "Edit on GitHub" and GDD sources. */
export const sourceUrl = (file: string): string => `${REPOSITORY}/blob/main/${file}`
export const editUrl = (file: string): string => `${REPOSITORY}/edit/main/${file}`
