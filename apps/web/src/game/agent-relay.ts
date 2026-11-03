import {
  RELAY_HOST,
  RELAY_PORT,
  type PageMessage,
  type RelayMessage,
} from 'quorum-mcp-relay/protocol'
import { readTool } from './webmcp.ts'

/* ==========================================================================
   The page's end of the agent relay (packages/mcp-relay): while "Agent access"
   is on, keep a WebSocket open to the relay on this machine and answer its
   read-only questions. The relay asks, this answers; nothing is pushed.
   ========================================================================== */

const MAX_DELAY_MS = 30_000

let wanted = false
let socket: WebSocket | null = null
let retry: ReturnType<typeof setTimeout> | undefined
let delay = 1_000
let watching = false

const send = (message: PageMessage): void => {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
}

const answer = (call: RelayMessage): void => {
  try {
    send({ type: 'result', id: call.id, ok: true, text: readTool(call.tool, call.input) })
  } catch (error) {
    send({
      type: 'result',
      id: call.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const connect = (): void => {
  if (!wanted || socket) return
  const next = new WebSocket(`ws://${RELAY_HOST}:${RELAY_PORT}`)
  socket = next
  next.onopen = () => {
    delay = 1_000
    send({ type: 'hello', visible: !document.hidden })
  }
  next.onmessage = (event) => {
    try {
      const message = JSON.parse(String(event.data)) as RelayMessage
      if (message.type === 'call') answer(message)
    } catch {
      // Not ours to answer.
    }
  }
  next.onclose = () => {
    if (socket === next) socket = null
    if (!wanted) return
    // No relay running is the usual case: wait longer each time.
    retry = setTimeout(connect, delay)
    delay = Math.min(delay * 2, MAX_DELAY_MS)
  }
}

/** Connects to the relay, or hangs up. Called whenever settings apply. */
export const setAgentAccess = (on: boolean): void => {
  if (on === wanted) return
  wanted = on
  clearTimeout(retry)
  if (on) {
    if (!watching) {
      watching = true
      // The relay asks the tab the player is looking at.
      document.addEventListener('visibilitychange', () =>
        send({ type: 'visible', visible: !document.hidden }),
      )
    }
    delay = 1_000
    connect()
  } else {
    socket?.close()
    socket = null
  }
}
