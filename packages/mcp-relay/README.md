# quorum-mcp-relay

A read-only MCP server that lets a coding agent read your [Quorum](https://quorum.elianiva.com)
game: the Board, the Inbox, and the incidents. The agent can read and advise. It cannot play.

Nothing leaves your machine. The relay listens on `ws://127.0.0.1:7437` and the Quorum page, running
in your browser, connects to it.

## Set up

1. Add the relay to your agent's MCP servers.

   Claude Code:

   ```sh
   claude mcp add quorum -- npx -y quorum-mcp-relay
   ```

   Codex, in `~/.codex/config.toml`:

   ```toml
   [mcp_servers.quorum]
   command = "npx"
   args = ["-y", "quorum-mcp-relay"]
   ```

   Pi, in `~/.pi/agent/mcp.json`:

   ```json
   { "mcpServers": { "quorum": { "command": "npx", "args": ["-y", "quorum-mcp-relay"] } } }
   ```

2. Open [quorum.elianiva.com](https://quorum.elianiva.com), start a Company, and turn on
   **Agent access** in Settings.
3. Ask your agent: "Read my Quorum game and tell me what to fix first."

## Tools

`get_company`, `get_design`, `get_incidents`, `get_inbox`, `get_history`, `get_game`. All are
read-only. While a Challenge is open they answer nothing, because Challenges are scored.

## Limits

- One relay per machine: the port is fixed, so a second agent's relay will not start. Use one
  agent at a time.
- The agent sees the tab you looked at last. A tab asleep in the background may not answer.
- Your browser may ask to allow access to the local network. Safari may block it. If it does, use
  **Copy state as JSON** in Settings and paste the result to your agent.

## Development

```sh
pnpm --filter quorum-mcp-relay test
pnpm --filter quorum-mcp-relay build   # writes dist/cli.mjs
```

`src/tools.ts` lists the tools and `src/protocol.ts` holds the wire messages. Both import nothing, so
the web app (`apps/web/src/game/webmcp.ts`) imports them too.
