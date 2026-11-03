import { JOBS, type Channel, type Jobs } from './jobs.ts'

/*
 * Runs a job on the compute worker, off the page's main thread. Only the newest
 * request on a channel is answered: an older one resolves to undefined. Without
 * a worker (tests, a browser that refuses one, or a worker that failed to load
 * or crashed), the job runs on the page.
 */

type Reply = Readonly<{ id: number; done: boolean; output?: unknown }>

type Waiting = Readonly<{ channel: Channel; input: unknown; resolve: (output: unknown) => void }>

let worker: Worker | null | undefined
let nextId = 0
const newest = new Map<Channel, number>()
const waiting = new Map<number, Waiting>()

const runOnPage = (channel: Channel, input: unknown): unknown =>
  (JOBS[channel] as (input: unknown) => unknown)(input)

/** The worker is gone: stop using it, and answer what it still owed on the page. */
const fail = (): void => {
  worker?.terminate()
  worker = null
  const owed = [...waiting]
  waiting.clear()
  for (const [id, entry] of owed)
    entry.resolve(
      newest.get(entry.channel) === id ? runOnPage(entry.channel, entry.input) : undefined,
    )
}

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
    // A module that fails to load or a crash in the worker never posts a reply.
    worker.onerror = (event) => {
      event.preventDefault()
      console.error('Compute worker failed; running jobs on the page.', event.message)
      fail()
    }
    worker.onmessageerror = fail
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
    waiting.set(id, { channel, input, resolve: resolve as (output: unknown) => void })
    target.postMessage({ id, channel, input })
  })
}
