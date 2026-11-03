import { JOBS, type Channel, type Jobs } from './jobs.ts'

/*
 * Runs a job on the compute worker, off the page's main thread. Only the newest
 * request on a channel is answered: an older one resolves to undefined. Without
 * a worker (tests, or a browser that refuses one), the job runs on the page.
 */

type Reply = Readonly<{ id: number; done: boolean; output?: unknown }>

let worker: Worker | null | undefined
let nextId = 0
const newest = new Map<Channel, number>()
const waiting = new Map<
  number,
  Readonly<{ channel: Channel; resolve: (output: unknown) => void }>
>()

const workerOf = (): Worker | null => {
  if (worker !== undefined) return worker
  if (typeof Worker === 'undefined') return (worker = null)
  try {
    worker = new Worker(new URL('./compute.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }: MessageEvent<Reply>) => {
      const entry = waiting.get(data.id)
      if (!entry) return
      waiting.delete(data.id)
      entry.resolve(data.done && newest.get(entry.channel) === data.id ? data.output : undefined)
    }
  } catch {
    worker = null
  }
  return worker
}

export const compute = <C extends Channel>(
  channel: C,
  input: Jobs[C]['input'],
): Promise<Jobs[C]['output'] | undefined> => {
  const id = (nextId += 1)
  newest.set(channel, id)
  const target = workerOf()
  if (!target) return Promise.resolve(JOBS[channel](input))
  return new Promise((resolve) => {
    waiting.set(id, { channel, resolve: resolve as (output: unknown) => void })
    target.postMessage({ id, channel, input })
  })
}
