import { Schema, pipe } from 'effect'
import {
  defineRouteUnion,
  literal,
  mapTo,
  oneOf,
  parseUrlWithFallback,
  root,
  schemaSegment,
  slash,
  string,
} from 'foldkit/route'
import { SANDBOX_IDS } from '@quorum/simulation/sandbox'

/* ==========================================================================
   The URL of each screen. The title menu pages, the Company, each Sandbox,
   and each Challenge have their own path, so back and forward move between
   them. Every other path opens the title screen.
   ========================================================================== */

export const MENU_PAGES = [
  'sandbox',
  'found',
  'legacy',
  'history',
  'challenges',
  'achievements',
  'settings',
] as const
export const MenuPage = Schema.Literals(MENU_PAGES)

/** A Sandbox in the URL: a guided one by id, or the free one. */
export const SandboxPath = Schema.Literals([...SANDBOX_IDS, 'free'])

export const AppRoute = defineRouteUnion({
  Title: {},
  Menu: { menu: MenuPage },
  Company: {},
  Sandbox: { sandbox: SandboxPath },
  Challenge: { challenge: Schema.String },
})
export type AppRoute = typeof AppRoute.Type

export const titleRouter = pipe(root, mapTo(AppRoute.Title))
export const menuRouter = pipe(schemaSegment('menu', MenuPage), mapTo(AppRoute.Menu))
export const companyRouter = pipe(literal('company'), mapTo(AppRoute.Company))
export const sandboxRouter = pipe(
  literal('sandbox'),
  slash(schemaSegment('sandbox', SandboxPath)),
  mapTo(AppRoute.Sandbox),
)
export const challengeRouter = pipe(
  literal('challenges'),
  slash(string('challenge')),
  mapTo(AppRoute.Challenge),
)

export const urlToAppRoute = parseUrlWithFallback(
  oneOf(titleRouter, menuRouter, companyRouter, sandboxRouter, challengeRouter),
  { make: () => AppRoute.Title() },
)

export const urlOf = (route: AppRoute): string =>
  AppRoute.match(route, {
    Title: () => titleRouter(),
    Menu: (menu) => menuRouter(menu),
    Company: () => companyRouter(),
    Sandbox: (sandbox) => sandboxRouter(sandbox),
    Challenge: (challenge) => challengeRouter(challenge),
  })

/** The board is open: a Company, a Sandbox, or a Challenge. */
export const onBoard = (route: AppRoute): boolean =>
  route._tag === 'Company' || route._tag === 'Sandbox' || route._tag === 'Challenge'

/** The title menu page a route shows. */
export const menuOf = (route: AppRoute): typeof MenuPage.Type | 'main' =>
  route._tag === 'Menu' ? route.menu : 'main'

export const routeOfMenu = (menu: typeof MenuPage.Type | 'main'): AppRoute =>
  menu === 'main' ? AppRoute.Title() : AppRoute.Menu({ menu })

/** Where a board route opens when its board cannot: the menu that lists it. */
export const menuFor = (route: AppRoute): AppRoute =>
  route._tag === 'Sandbox'
    ? AppRoute.Menu({ menu: 'sandbox' })
    : route._tag === 'Challenge'
      ? AppRoute.Menu({ menu: 'challenges' })
      : route._tag === 'Company'
        ? AppRoute.Title()
        : route
