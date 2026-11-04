import type { IncomingMessage } from 'node:http'
import { WebSocketServer, type RawData, type WebSocket } from 'ws'
import {
  QUORUM_ORIGIN,
  RELAY_HOST,
  RELAY_PORT,
  type PageMessage,
  type RelayMessage,
} from './protocol.ts'

/* ==========================================================================
   The relay: a WebSocket server on loopback that the Quorum page connects to,
   and a `call` that asks the open page to run one tool. Nothing here writes to
   the game; a page can only answer the questions it is asked.
   ========================================================================== */

export type Relay = Readonly<{
  port: number
  /** Asks the page the player is looking at to run a tool, and returns its JSON text. */
  call: (tool: string, input: Record<string, unknown>) => Promise<string>
  /** Open Quorum tabs connected right now. */
  pages: () => number
  close: () => Promise<void>
}>

export type RelayOptions = Readonly<{
  port?: number
  /** Milliseconds a tab has to answer a call. */
  timeoutMs?: number
  log?: (line: string) => void
}>

const NO_PAGE =
  'No Quorum tab is connected. Ask the player to open https://playquorum.dev, start a Company, and turn on "Agent access" in Settings.'

type Page = {
  readonly socket: WebSocket
  /** When the tab last became the one the player is looking at. */
  activeAt: number
}

type Pending = {
  readonly page: Page
  readonly resolve: (text: string) => void
  readonly reject: (error: Error) => void
  readonly timer: NodeJS.Timeout
}

const hostnameOf = (value: string | undefined): string | null => {
  try {
    return new URL(value?.includes('://') ? value : `http://${value ?? ''}`).hostname
  } catch {
    return null
  }
}

const textOf = (data: RawData): string =>
  Array.isArray(data) ? Buffer.concat(data).toString() : Buffer.from(data as Buffer).toString()

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Only Quorum, or a page on this machine (development), may connect. */
export const allowed = (req: IncomingMessage): boolean => {
  const origin = req.headers.origin
  if (!origin) return false
  // A page that reached loopback through a rebound DNS name still sends its own Host.
  if (!LOOPBACK.has(hostnameOf(req.headers.host) ?? '')) return false
  return origin === QUORUM_ORIGIN || LOOPBACK.has(hostnameOf(origin) ?? '')
}

export const startRelay = ({
  port = RELAY_PORT,
  timeoutMs = 10_000,
  log = () => {},
}: RelayOptions = {}): Promise<Relay> =>
  new Promise((resolve, reject) => {
    const pages = new Set<Page>()
    const pending = new Map<number, Pending>()
    let sequence = 0

    const server = new WebSocketServer({
      host: RELAY_HOST,
      port,
      verifyClient: ({ req }, done) => (allowed(req) ? done(true) : done(false, 403, 'Forbidden')),
    })

    server.on('error', reject)
    server.on('listening', () => {
      server.off('error', reject)
      const address = server.address()
      resolve({
        port: typeof address === 'object' && address ? address.port : port,
        pages: () => pages.size,
        call: (tool, input) => {
          const page = [...pages].sort((a, b) => b.activeAt - a.activeAt)[0]
          if (!page) return Promise.reject(new Error(NO_PAGE))
          const id = (sequence += 1)
          return new Promise<string>((ok, fail) => {
            const timer = setTimeout(() => {
              pending.delete(id)
              fail(
                new Error(
                  'The Quorum tab did not answer in time. It may be asleep in the background.',
                ),
              )
            }, timeoutMs)
            pending.set(id, { page, resolve: ok, reject: fail, timer })
            const message: RelayMessage = { type: 'call', id, tool, input }
            page.socket.send(JSON.stringify(message))
          })
        },
        close: () =>
          new Promise<void>((done) => {
            for (const page of pages) page.socket.terminate()
            server.close(() => done())
          }),
      })
    })

    server.on('connection', (socket) => {
      const page: Page = { socket, activeAt: Date.now() }
      pages.add(page)
      log('A Quorum tab connected.')

      socket.on('message', (data) => {
        let message: PageMessage
        try {
          message = JSON.parse(textOf(data)) as PageMessage
        } catch {
          return
        }
        if (message.type === 'hello' || message.type === 'visible') {
          if (message.visible) page.activeAt = Date.now()
          return
        }
        if (message.type !== 'result') return
        const waiting = pending.get(message.id)
        // Only the tab that was asked may answer.
        if (!waiting || waiting.page !== page) return
        pending.delete(message.id)
        clearTimeout(waiting.timer)
        if (message.ok) waiting.resolve(message.text)
        else waiting.reject(new Error(message.error))
      })

      socket.on('close', () => {
        pages.delete(page)
        log('A Quorum tab disconnected.')
        for (const [id, waiting] of pending) {
          if (waiting.page !== page) continue
          pending.delete(id)
          clearTimeout(waiting.timer)
          waiting.reject(new Error('The Quorum tab closed before it answered.'))
        }
      })
    })
  })
