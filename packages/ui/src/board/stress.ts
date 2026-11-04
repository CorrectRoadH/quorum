import type { ComponentId } from '@quorum/simulation/catalog'
import { link, node } from '@quorum/simulation/company'
import { freeSandbox } from '@quorum/simulation/sandbox'
import type { Game } from '@quorum/simulation/state'
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

/*
 * The big board: a later screenshot of the same player's NA board, at 61 Nodes and
 * 282 Links. Every Load Balancer feeds every App Server, and every App Server calls
 * every Cache, Pooler and Queue. The positions are the screenshot's, scaled to the board.
 */
const BIG_DROPS: ReadonlyArray<readonly [string, ComponentId, number, number]> = [
  ['users', 'users', 85, 770],
  ...[680, 790].map((y, index) => [`waf${index}`, 'waf', 175, y] as const),
  ...[1100, 1170].map((y, index) => [`cdn${index}`, 'cdn', 310, y] as const),
  ...[520, 610, 690, 770, 850, 930, 1010].map((y, index) => [`lb${index}`, 'lb', 380, y] as const),
  ...[430, 540, 650, 760, 875, 990, 1100, 1210].map(
    (y, index) => [`app${index}`, 'server', 560, y] as const,
  ),
  ['analytics0', 'analytics', 515, 265],
  ...[
    [720, 88],
    [752, 170],
    [762, 265],
    [768, 345],
  ].map(([x, y], index) => [`cache${index}`, 'cache', x as number, y as number] as const),
  ...[440, 520, 600].map((y, index) => [`pool${index}`, 'pooler', 825, y] as const),
  ['payments', 'payments', 990, 540],
  ...[
    [1130, 390],
    [1255, 390],
    [1410, 400],
    [1545, 362],
    [1255, 500],
    [1135, 615],
    [1250, 615],
    [1570, 662],
    [1675, 532],
  ].map(([x, y], index) => [`db${index}`, 'database', x as number, y as number] as const),
  ['replica0', 'replica', 1135, 500],
  ['replica1', 'replica', 1410, 662],
  ...[
    [1410, 505],
    [1520, 580],
    [1270, 715],
  ].map(([x, y], index) => [`storage${index}`, 'storage', x as number, y as number] as const),
  ['search', 'search', 1388, 575],
  ['warehouse', 'warehouse', 1535, 467],
  ['analytics1', 'analytics', 1012, 802],
  ['analytics2', 'analytics', 1190, 890],
  ['psp', 'psp', 1012, 995],
  ['llm', 'llm', 1005, 1062],
  ['auth', 'auth', 1790, 1055],
  ['autoscaler', 'autoscaler', 1765, 105],
  ['cluster', 'cluster', 860, 1168],
  ['queue0', 'queue', 860, 1222],
  ['queue1', 'queue', 860, 1322],
  ...[1175, 1262, 1350, 1438].map((y, index) => [`worker${index}`, 'worker', 1035, y] as const),
  ...[1155, 1255, 1355].map((y, index) => [`gpu${index}`, 'gpu', 1370, y] as const),
]

const ids = (prefix: string, count: number): ReadonlyArray<string> =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`)
const every = (
  froms: ReadonlyArray<string>,
  tos: ReadonlyArray<string>,
): ReadonlyArray<RoutedLink> => froms.flatMap((from) => tos.map((to) => ({ from, to })))

const BIG_APPS = ids('app', 8)
const POOLS = ids('pool', 3)

export const BIG_LINKS: ReadonlyArray<RoutedLink> = [
  ...every(['users'], [...ids('waf', 2), ...ids('cdn', 2)]),
  ...every([...ids('waf', 2), ...ids('cdn', 2)], ids('lb', 7)),
  ...every(ids('lb', 7), BIG_APPS),
  ...every(BIG_APPS, [
    ...ids('cache', 4),
    ...POOLS,
    ...ids('queue', 2),
    'search',
    'psp',
    'llm',
    'auth',
    'warehouse',
  ]),
  ...BIG_APPS.flatMap((from, index) =>
    [`analytics${index % 3}`, `storage${index % 3}`, `gpu${index % 3}`].map((to) => ({ from, to })),
  ),
  ...every(ids('cache', 4), POOLS),
  ...every(POOLS, [...ids('db', 9), ...ids('replica', 2)]),
  ...every(ids('queue', 2), ids('worker', 4)),
  { from: 'app0', to: 'autoscaler' },
  { from: 'app0', to: 'cluster' },
]

/** The big board's cards, dropped in order where the screenshot has them. */
export const bigNodes = (): ReadonlyArray<RoutedNode> =>
  BIG_DROPS.reduce<ReadonlyArray<RoutedNode>>((nodes, [id, type, x, y]) => {
    const spot = freeSpot(nodes.map(boxOf), {
      x: (x - 85) * 2,
      y: y * 2,
      w: CARD_W,
      h: heightOf(type),
    })
    return [...nodes, { id, type, ...spot }]
  }, [])

/** The free Sandbox with the big board on it, at Public-era demand. */
export const bigBoard = (): Game => ({
  ...freeSandbox(),
  users: 2_000_000,
  nodes: bigNodes().map((entry, index) =>
    node(entry.id, entry.type, entry.x, entry.y, {
      zone: index % 3 === 0 ? 'a' : index % 3 === 1 ? 'b' : 'c',
      ...(entry.type === 'server' ? { size: 4, runtime: 'go', workers: 64 } : {}),
      ...(entry.type === 'database' ? { size: 5 } : {}),
    }),
  ),
  links: BIG_LINKS.map((entry) => link(entry.from, entry.to)),
})
