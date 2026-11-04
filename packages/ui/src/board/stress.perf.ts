import { bottleneckOf, solveFlow } from '@quorum/simulation/solve'
import { step } from '@quorum/simulation/step'
import { routeLinks } from './routing.ts'
import { BIG_LINKS, STRESS_LINKS, bigBoard, bigNodes, stressNodes } from './stress.ts'

/*
 * The stress harness: what the stress boards cost outside of drawing. The big board
 * (61 Nodes, 279 Links) is a player's screenshot. Routing runs on every change to the
 * Design; a tick runs 2.5 Steps at 1× and the Bottleneck search once per sim second.
 *
 *   pnpm --filter @quorum/web stress
 *
 * Plain Node, not Vitest: Vitest's module runner puts a getter on every import, which
 * adds more to these hot loops than the code they measure. CI does not run it.
 */

const time = (name: string, run: () => void, samples = 30): void => {
  for (let index = 0; index < 3; index += 1) run()
  const times: Array<number> = []
  for (let index = 0; index < samples; index += 1) {
    const start = performance.now()
    run()
    times.push(performance.now() - start)
  }
  times.sort((a, b) => a - b)
  const at = (share: number) => (times[Math.floor(share * (times.length - 1))] as number).toFixed(2)
  console.log(`${name.padEnd(36)} median ${at(0.5).padStart(8)} ms   p90 ${at(0.9).padStart(8)} ms`)
}

const stress = stressNodes()
const nodes = bigNodes()
time('routeLinks, stress board (16 Nodes)', () => routeLinks(stress, STRESS_LINKS))
time('routeLinks, big board (61 Nodes)', () => routeLinks(nodes, BIG_LINKS), 10)

let game = bigBoard()
for (let index = 0; index < 50; index += 1) game = step(game, 0.1).game
const flow = solveFlow(game)
// A fresh Game object each time, so the per-Game cache does not answer.
time('solveFlow, big board', () => solveFlow({ ...game }))
time('step, big board', () => step({ ...game }, 0.1))
time('bottleneckOf, big board', () => bottleneckOf(game, flow), 10)
