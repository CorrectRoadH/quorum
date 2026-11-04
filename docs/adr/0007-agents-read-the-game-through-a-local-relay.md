# Agents read the game through a local relay

A player can let a coding agent (Claude Code, Pi, Codex, and the like) read their game and give
feedback, without screenshots. The agent never acts: the player makes every decision.

The game state lives in the browser ([ADR 0006](./0006-mail-is-client-state.md)), and these agents
run in a terminal. `packages/mcp-relay` (`quorum-mcp-relay`) joins them. The player adds
`npx quorum-mcp-relay` to the agent's MCP servers and turns on **Agent access** in Settings, which
is off by default and saved. The relay is an MCP server on stdio for the agent and a WebSocket
server on `127.0.0.1` for the page. The page connects while the setting is on. For each tool call
the relay asks the open tab, and the tab answers from its newest Model. Nothing leaves the
player's machine.

A **Copy state as JSON** button in Settings covers every other case.
The tools are described once, in `packages/mcp-relay/src/tools.ts`.

Considered options:

- **WebMCP alone.** It needs an experimental Chrome, a third-party extension, and a native
  server to reach a terminal agent. Rejected; an earlier version registered the tools with WebMCP as
  an extra, and it was removed.
- **A hosted MCP server.** Zero install for the player, but it needs a backend store, accounts or
  tokens, and uploads every player's game. That breaks [single-player first](./0001-single-player-first.md)
  and the client-state rule above. Rejected.
- **Only the JSON button.** No setup, but the agent cannot look again as the game changes.
  Kept as the fallback.

## Consequences

- Only a page on `https://playquorum.dev`, or on `localhost` for development, may connect, and
  only under a loopback `Host`, so a website cannot reach the relay through a rebound DNS name.
  The relay has no tool that writes, and the page answers only the six named tools.
- A Challenge is scored by replay and the server's check, so an agent that reads one is a hint.
  Every agent surface, and the JSON button, answers nothing while a Challenge is open.
- The relay uses one fixed port, 7437. A second relay on the same machine fails with a clear
  message instead of picking another port, because the page only tries that port.
- A browser may ask the player to allow access to the local network, and Safari may block a secure
  page from reaching `ws://127.0.0.1`. Those players use the JSON button.
- The package is published to npm by hand. Its `tools` and `protocol` files stay free of Node and
  browser code so the web app can import them from the workspace.
- What would change it: a hosted option, if players ask for zero install and accept uploading their
  game.
