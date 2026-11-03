#!/usr/bin/env node
import pkg from '../package.json' with { type: 'json' }
import { serveMcp } from './mcp.ts'
import { RELAY_PORT } from './protocol.ts'
import { startRelay } from './relay.ts'

/* ==========================================================================
   `npx quorum-mcp-relay`: an MCP server on stdio for the agent, and a
   loopback WebSocket for the Quorum page. stdout carries MCP only; every log
   line goes to stderr.
   ========================================================================== */

const log = (line: string): void => void process.stderr.write(`[quorum-mcp-relay] ${line}\n`)

if (process.argv.includes('--version')) {
  process.stdout.write(`${pkg.version}\n`)
} else if (process.argv.includes('--help')) {
  process.stdout.write(
    `Usage: npx quorum-mcp-relay\n\nRuns a read-only MCP server on stdio. Add it to your agent's MCP servers,\nthen turn on "Agent access" in Quorum's Settings. The page connects to\nws://127.0.0.1:${RELAY_PORT}; nothing leaves your machine.\n`,
  )
} else {
  try {
    const relay = await startRelay({ log })
    log(`Waiting for a Quorum tab on ws://127.0.0.1:${relay.port}.`)
    await serveMcp(relay, { name: 'quorum', version: pkg.version }, process.stdin, process.stdout)
    await relay.close()
  } catch (error) {
    const busy = error instanceof Error && 'code' in error && error.code === 'EADDRINUSE'
    log(
      busy
        ? `Port ${RELAY_PORT} is in use. Another relay may already be running; close it and try again.`
        : String(error),
    )
    process.exitCode = 1
  }
}
