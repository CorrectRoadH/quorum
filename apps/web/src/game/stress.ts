import type { ComponentId } from '@template/simulation/catalog'
import { link, node } from '@template/simulation/company'
import { freeSandbox } from '@template/simulation/sandbox'
import type { Game } from '@template/simulation/state'
import { CARD_W, boxOf, freeSpot, heightOf } from './geometry.ts'
import type { RoutedLink, RoutedNode } from './routing.ts'

/*
 * The stress board: a Public-era NA board from a player's screenshot. Four App
 * Servers fan out to six data Nodes through one channel, and the cards were
 * dropped where they overlap (Payments under the WAF, Wide-column on an App Server).
 * The routing test checks it, and the free Sandbox can load it to look at.
 */
const DROPS: ReadonlyArray<readonly [string, ComponentId, number, number]> = [
  ['users', 'users', 0, 80],
  ['cdn', 'cdn', 184, 0],
  ['waf', 'waf', 184, 224],
  ['lb', 'lb', 448, 224],
  ['payments', 'payments', 328, 264],
  ['app1', 'server', 712, -160],
  ['app2', 'server', 712, 32],
  ['app3', 'server', 712, 224],
  ['app4', 'server', 712, 416],
  ['wide', 'wide', 776, 384],
  ['cache', 'cache', 1016, -160],
  ['storage', 'storage', 1016, 64],
  ['warehouse', 'warehouse', 1016, 288],
  ['gpu', 'gpu', 1016, 488],
  ['database', 'database', 1280, -80],
  ['psp', 'psp', 1280, 288],
]

const APPS = ['app1', 'app2', 'app3', 'app4']

export const STRESS_LINKS: ReadonlyArray<RoutedLink> = [
  { from: 'users', to: 'cdn' },
  { from: 'users', to: 'waf' },
  { from: 'cdn', to: 'lb' },
  { from: 'waf', to: 'lb' },
  ...APPS.map((app) => ({ from: 'lb', to: app })),
  ...APPS.flatMap((app) =>
    ['cache', 'wide', 'storage', 'warehouse', 'gpu', 'psp'].map((to) => ({ from: app, to })),
  ),
  { from: 'cache', to: 'database' },
]

/** Drops each card in order, as a player would, moved to the nearest free spot. */
export const stressNodes = (): ReadonlyArray<RoutedNode> =>
  DROPS.reduce<ReadonlyArray<RoutedNode>>((nodes, [id, type, x, y]) => {
    const spot = freeSpot(nodes.map(boxOf), { x, y, w: CARD_W, h: heightOf(type) })
    return [...nodes, { id, type, ...spot }]
  }, [])

/** The free Sandbox with the stress board on it. */
export const stressBoard = (): Game => ({
  ...freeSandbox(),
  nodes: stressNodes().map((entry) =>
    node(entry.id, entry.type, entry.x, entry.y, entry.id === 'app2' ? { zone: 'b' } : {}),
  ),
  links: STRESS_LINKS.map((entry) => link(entry.from, entry.to)),
})
