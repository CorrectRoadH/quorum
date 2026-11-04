import { JOBS, PRIORITY, type Channel } from './jobs.ts'

/*
 * The compute worker. Each channel keeps only its newest request: a request
 * that a newer one replaces before it starts is answered as superseded, so a
 * burst of hovers or edits never queues stale work.
 */

type Request = Readonly<{ id: number; channel: Channel; input: unknown }>

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null
  postMessage: (message: unknown) => void
}

const waiting = new Map<Channel, Request>()
let scheduled = false

const schedule = (): void => {
  if (scheduled) return
  scheduled = true
  // A task of its own, so requests that arrived during a job are read before the next one.
  setTimeout(serve, 0)
}

const serve = (): void => {
  scheduled = false
  const channel = PRIORITY.find((entry) => waiting.has(entry))
  const request = channel && waiting.get(channel)
  if (!channel || !request) return
  waiting.delete(channel)
  try {
    const output = (JOBS[channel] as (input: unknown) => unknown)(request.input)
    scope.postMessage({ id: request.id, done: true, output })
  } catch (error) {
    console.error(error)
    scope.postMessage({ id: request.id, done: false })
  }
  if (waiting.size > 0) schedule()
}

scope.onmessage = ({ data }) => {
  const replaced = waiting.get(data.channel)
  if (replaced) scope.postMessage({ id: replaced.id, done: false })
  waiting.set(data.channel, data)
  schedule()
}
