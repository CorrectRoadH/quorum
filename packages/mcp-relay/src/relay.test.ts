import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import { serveMcp } from './mcp.ts'
import { QUORUM_ORIGIN, type PageMessage, type RelayMessage } from './protocol.ts'
import { startRelay, type Relay } from './relay.ts'
import { TOOLS } from './tools.ts'

const open: Array<{ close: () => unknown }> = []
afterEach(async () => {
  for (const item of open.splice(0)) await item.close()
})

const relayOn = async (): Promise<Relay> => {
  const relay = await startRelay({ port: 0, timeoutMs: 100 })
  open.push(relay)
  return relay
}

/** A fake Quorum page: answers every call with `reply(call)`. */
const page = async (
  relay: Relay,
  options: {
    origin?: string
    host?: string
    reply?: (call: RelayMessage) => PageMessage | null
  } = {},
): Promise<WebSocket> => {
  const socket = new WebSocket(`ws://127.0.0.1:${relay.port}`, {
    origin: options.origin ?? QUORUM_ORIGIN,
    ...(options.host ? { headers: { Host: options.host } } : {}),
  })
  open.push({ close: () => socket.terminate() })
  socket.on('message', (data) => {
    const call = JSON.parse(Buffer.from(data as Buffer).toString()) as RelayMessage
    const answer = options.reply?.(call)
    if (answer) socket.send(JSON.stringify(answer))
  })
  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve())
    socket.once('error', reject)
  })
  socket.send(JSON.stringify({ type: 'hello', visible: true } satisfies PageMessage))
  return socket
}

const echo = (call: RelayMessage): PageMessage => ({
  type: 'result',
  id: call.id,
  ok: true,
  text: JSON.stringify({ tool: call.tool, input: call.input }),
})

/** Sends MCP requests as lines and collects the replies by id. */
const client = (relay: Relay) => {
  const input = new PassThrough()
  const output = new PassThrough()
  type Reply = {
    id: number
    result: {
      protocolVersion: string
      isError?: boolean
      tools: Array<{ name: string; annotations: { readOnlyHint: boolean } }>
      content: Array<{ text: string }>
    }
    error: { code: number }
  }
  const replies = new Map<number, Reply>()
  output.setEncoding('utf8')
  output.on('data', (chunk: string) => {
    for (const line of chunk.split('\n').filter(Boolean)) {
      const message = JSON.parse(line) as Reply
      replies.set(message.id, message)
    }
  })
  void serveMcp(relay, { name: 'quorum', version: '0.0.0' }, input, output)
  let next = 0
  return {
    request: async (method: string, params?: unknown) => {
      const id = (next += 1)
      input.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
      for (let tries = 0; tries < 200 && !replies.has(id); tries += 1)
        await new Promise((resolve) => setTimeout(resolve, 5))
      return replies.get(id) as Reply
    },
    notify: (method: string) => input.write(`${JSON.stringify({ jsonrpc: '2.0', method })}\n`),
    replies,
  }
}

describe('who may connect', () => {
  it('accepts Quorum and loopback pages, and refuses any other origin', async () => {
    const relay = await relayOn()
    await page(relay, { origin: QUORUM_ORIGIN })
    await page(relay, { origin: 'http://localhost:5173' })
    await expect(page(relay, { origin: 'https://evil.example' })).rejects.toThrow('403')
    // Looks like Quorum but is a different host.
    await expect(
      page(relay, { origin: 'https://quorum.elianiva.com.evil.example' }),
    ).rejects.toThrow('403')
    expect(relay.pages()).toBe(2)
  })

  it('refuses a request that reached loopback under another Host name', async () => {
    const relay = await relayOn()
    await expect(page(relay, { host: 'rebound.example' })).rejects.toThrow('403')
  })
})

describe('MCP', () => {
  it('lists every tool as read-only, before any page connects', async () => {
    const mcp = client(await relayOn())
    const init = await mcp.request('initialize', { protocolVersion: '2025-03-26' })
    expect(init.result.protocolVersion).toBe('2025-03-26')
    const list = await mcp.request('tools/list')
    expect(list.result.tools.map((tool) => tool.name)).toEqual(TOOLS.map((tool) => tool.name))
    expect(list.result.tools.every((tool) => tool.annotations.readOnlyHint)).toBe(true)
  })

  it('answers a notification with nothing, and an unknown method with an error', async () => {
    const mcp = client(await relayOn())
    mcp.notify('notifications/initialized')
    const unknown = await mcp.request('resources/list')
    expect(unknown.error.code).toBe(-32601)
    expect(mcp.replies.size).toBe(1)
  })

  it('forwards a tool call to the page with its arguments, and returns the page text', async () => {
    const relay = await relayOn()
    await page(relay, { reply: echo })
    const mcp = client(relay)
    const call = await mcp.request('tools/call', { name: 'get_history', arguments: { last: 3 } })
    expect(JSON.parse(call.result.content[0]?.text ?? '')).toEqual({
      tool: 'get_history',
      input: { last: 3 },
    })
    expect(call.result.isError).toBeUndefined()
  })

  it('tells the agent what to do when no tab is connected, and refuses unknown tools', async () => {
    const mcp = client(await relayOn())
    const none = await mcp.request('tools/call', { name: 'get_company' })
    expect(none.result.isError).toBe(true)
    expect(none.result.content[0]?.text).toContain('Agent access')
    const unknown = await mcp.request('tools/call', { name: 'click_everything' })
    expect(unknown.error.code).toBe(-32602)
  })

  it('reports a page error as a tool error, not a protocol error', async () => {
    const relay = await relayOn()
    await page(relay, {
      reply: (call) => ({
        type: 'result',
        id: call.id,
        ok: false,
        error: 'Challenges are scored.',
      }),
    })
    const call = await client(relay).request('tools/call', { name: 'get_game' })
    expect(call.result).toMatchObject({
      isError: true,
      content: [{ text: 'Challenges are scored.' }],
    })
  })
})

describe('which tab answers', () => {
  it('asks the tab that was last in view', async () => {
    const relay = await relayOn()
    const named = (name: string) => (call: RelayMessage) =>
      ({ type: 'result', id: call.id, ok: true, text: name }) satisfies PageMessage
    const first = await page(relay, { reply: named('first') })
    await new Promise((resolve) => setTimeout(resolve, 5))
    await page(relay, { reply: named('second') })
    expect(await relay.call('get_company', {})).toBe('second')
    // The first tab comes back into view; a hidden tab does not take over.
    await new Promise((resolve) => setTimeout(resolve, 5))
    first.send(JSON.stringify({ type: 'visible', visible: true } satisfies PageMessage))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(await relay.call('get_company', {})).toBe('first')
  })

  it('does not accept an answer from a tab that was not asked', async () => {
    const relay = await relayOn()
    const bystander = await page(relay)
    // The asked tab stays silent; the bystander tries to answer id 1 anyway.
    const quiet = await page(relay, {
      reply: (call) => {
        bystander.send(JSON.stringify({ type: 'result', id: call.id, ok: true, text: 'forged' }))
        return null
      },
    })
    void quiet
    await expect(relay.call('get_company', {})).rejects.toThrow('did not answer in time')
  })

  it('fails a pending call when its tab closes', async () => {
    const relay = await relayOn()
    const socket = await page(relay, { reply: () => null })
    const pending = relay.call('get_company', {})
    await new Promise((resolve) => setTimeout(resolve, 20))
    socket.close()
    await expect(pending).rejects.toThrow('closed before it answered')
  })
})
