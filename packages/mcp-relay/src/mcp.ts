import { createInterface } from 'node:readline'
import type { Readable, Writable } from 'node:stream'
import { TOOLS } from './tools.ts'
import type { Relay } from './relay.ts'

/* ==========================================================================
   MCP over stdio, by hand: the four requests a read-only tool server answers.
   One JSON message per line (https://modelcontextprotocol.io/specification).
   ========================================================================== */

const SUPPORTED = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'] as const

type Request = Readonly<{ jsonrpc: '2.0'; id?: number | string; method: string; params?: unknown }>

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

const reply = (id: number | string, result: unknown) => ({ jsonrpc: '2.0', id, result })
const failure = (id: number | string | null, code: number, message: string) => ({
  jsonrpc: '2.0',
  id,
  error: { code, message },
})

export type McpInfo = Readonly<{ name: string; version: string }>

const handle = async (relay: Relay, info: McpInfo, request: Request): Promise<unknown> => {
  const { id, method } = request
  // A notification has no id and gets no answer.
  if (id === undefined) return undefined
  const params = record(request.params)

  switch (method) {
    case 'initialize': {
      const asked = typeof params['protocolVersion'] === 'string' ? params['protocolVersion'] : ''
      return reply(id, {
        protocolVersion: (SUPPORTED as ReadonlyArray<string>).includes(asked)
          ? asked
          : SUPPORTED[1],
        capabilities: { tools: { listChanged: false } },
        serverInfo: info,
        instructions:
          'Read-only view of the Quorum game the player has open in their browser. Start with get_company. These tools cannot change the game: the player makes every decision.',
      })
    }
    case 'ping':
      return reply(id, {})
    case 'tools/list':
      return reply(id, {
        tools: TOOLS.map((tool) => ({
          ...tool,
          annotations: { readOnlyHint: true, openWorldHint: false },
        })),
      })
    case 'tools/call': {
      const name = params['name']
      if (typeof name !== 'string' || !TOOLS.some((tool) => tool.name === name))
        return failure(id, -32602, `Unknown tool: ${String(name)}`)
      try {
        const text = await relay.call(name, record(params['arguments']))
        return reply(id, { content: [{ type: 'text', text }] })
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error)
        return reply(id, { isError: true, content: [{ type: 'text', text }] })
      }
    }
    default:
      return failure(id, -32601, `Method not found: ${method}`)
  }
}

/** Answers MCP requests from `input` until it ends. Replies go to `output`, one per line. */
export const serveMcp = (
  relay: Relay,
  info: McpInfo,
  input: Readable,
  output: Writable,
): Promise<void> =>
  new Promise((done) => {
    const lines = createInterface({ input })
    const work = new Set<Promise<void>>()
    lines.on('line', (line) => {
      if (!line.trim()) return
      const task = (async () => {
        let request: Request
        try {
          request = JSON.parse(line) as Request
        } catch {
          output.write(`${JSON.stringify(failure(null, -32700, 'Parse error'))}\n`)
          return
        }
        const response = await handle(relay, info, request)
        if (response !== undefined) output.write(`${JSON.stringify(response)}\n`)
      })().finally(() => work.delete(task))
      work.add(task)
    })
    lines.on('close', () => void Promise.all(work).then(() => done()))
  })
