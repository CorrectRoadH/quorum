import { afterEach, expect, test, vi } from 'vitest'
import { newGame } from '@quorum/simulation/company'
import { bottleneckOf, solveFlow } from '@quorum/simulation/solve'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

test('a compute worker that fails to load answers its jobs on the page instead of hanging', async () => {
  const workers: Array<{ onerror: ((event: unknown) => void) | null }> = []
  vi.stubGlobal(
    'Worker',
    class {
      onmessage = null
      onerror: ((event: unknown) => void) | null = null
      onmessageerror = null
      constructor() {
        workers.push(this)
      }
      postMessage() {}
      terminate() {}
    },
  )
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const { compute } = await import('./compute.ts')
  const game = newGame()
  const older = compute('bottleneck', { game })
  const newer = compute('bottleneck', { game })
  workers[0]?.onerror?.({ message: 'failed to load', preventDefault: () => {} })
  await expect(older).resolves.toBeUndefined()
  await expect(newer).resolves.toBe(bottleneckOf(game, solveFlow(game)))
  // Later jobs skip the dead worker.
  await expect(compute('bottleneck', { game })).resolves.toBe(bottleneckOf(game, solveFlow(game)))
  expect(workers).toHaveLength(1)
})
