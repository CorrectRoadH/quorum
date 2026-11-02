import { test } from 'vitest'
import { resize, setRuntime } from './actions.ts'
import { link, node, preseedGame } from './company.ts'
import { previewOf } from './preview.ts'
import { bottleneckOf, solveFlow } from './solve.ts'
import type { Game, GameLink, GameNode } from './state.ts'

/*
 * The performance budget (04 "Performance budget"): one Step of a 200-Node
 * board under 2 ms, and the Bottleneck search under 3 ms. The Tradeoff preview
 * runs 2 × 10 one-second Steps for the first option hovered on a Game, then 10 for each
 * other option, cached per Game and option. Run it with
 * `pnpm --filter @quorum/simulation exec vitest bench --run`. CI does not assert
 * timings: they depend on the machine.
 */

/** Users → a Load Balancer → 6 Load Balancers × 30 App Servers → 6 Poolers → 6 Databases. */
const bigBoard = (): Game => {
  const nodes: Array<GameNode> = [node('users', 'users', 0, 0), node('lb', 'lb', 100, 0)]
  const links: Array<GameLink> = [link('users', 'lb')]
  for (let group = 0; group < 6; group += 1) {
    const lb = `lb${group}`
    const pooler = `pool${group}`
    const database = `db${group}`
    nodes.push(
      node(lb, 'lb', 200, group * 100),
      node(pooler, 'pooler', 400, group * 100),
      node(database, 'database', 500, group * 100, { size: 5 }),
    )
    links.push(link('lb', lb), link(pooler, database))
    for (let index = 0; index < 30; index += 1) {
      const id = `s${group}-${index}`
      nodes.push(
        node(id, 'server', 300, group * 100 + index, {
          size: 3,
          runtime: 'php_fpm',
          workers: 40,
        }),
      )
      links.push(link(lb, id), link(id, pooler))
    }
  }
  return {
    ...preseedGame(),
    nodes,
    links,
    users: 400_000,
    researched: [...preseedGame().researched, 'pooling', 'opcache'],
  }
}

test('a 200-Node board', async ({ bench }) => {
  const game = bigBoard()
  const flow = solveFlow(game)
  await bench.compare(
    // A fresh Game object each time, so the per-Game cache does not answer.
    bench('solveFlow (budget 2 ms)', () => {
      solveFlow({ ...game })
    }),
    bench('bottleneckOf (budget 3 ms)', () => {
      bottleneckOf(game, flow)
    }),
  )
})

test('the Tradeoff preview', { timeout: 300_000 }, async ({ bench }) => {
  const game: Game = {
    ...preseedGame(),
    users: 4_000,
    researched: [...preseedGame().researched, 'lang-node', 'node-cluster'],
  }
  const big: Game = { ...bigBoard(), cash: 1e9 }
  let second = 0
  await bench.compare(
    // A fresh Game object each time, so the preview cache does not answer.
    bench('previewOf, Pre-seed runtime switch', () => {
      previewOf({ ...game }, 'cluster', (current) => setRuntime(current, 'server', 'node_cluster'))
    }),
    bench('previewOf, Pre-seed resize', () => {
      previewOf({ ...game }, 'resize', (current) => resize(current, 'server', 1))
    }),
    bench('previewOf, Pre-seed second option', () => {
      // The unchanged ghost is cached for this Game; only the changed one runs.
      previewOf(game, `resize-${(second += 1)}`, (current) => resize(current, 'server', 1))
    }),
    // About 2.5 s each on this board: the test timeout covers its samples.
    bench('previewOf, 200-Node board resize', () => {
      previewOf({ ...big }, 'resize', (current) => resize(current, 's0-0', 1))
    }),
    bench('previewOf, cached', () => {
      previewOf(game, 'resize', (current) => resize(current, 'server', 1))
    }),
  )
})
