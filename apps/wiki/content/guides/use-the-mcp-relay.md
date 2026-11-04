---
title: Use the MCP relay
summary: Let a coding agent in your terminal read your open game through the quorum-mcp-relay CLI, and ask it for advice. The agent reads; you play.
section: guides
order: 11
aliases: mcp, agent, claude code, codex, relay, quorum-mcp-relay, ai, assistant, copy state as json
---

Use this guide when you want a coding agent, such as Claude Code or Codex, to read your Quorum game
and tell you what to fix.

The relay is a small read-only [MCP](https://modelcontextprotocol.io) server that runs on your
machine. Your agent talks to it, and the Quorum page in your browser answers it. The agent can read
the board, the incidents, and the Inbox. It cannot place a Node, click a button, or change a
setting. Nothing leaves your machine.

## Before you start

- Node.js 22 or later, for `npx`.
- An agent that supports MCP servers on stdio.
- A Company open in [playquorum.dev](https://playquorum.dev).

## Add the relay to your agent

1. Add `npx -y quorum-mcp-relay` to your agent's MCP servers.

   For Claude Code, run:

   ```sh
   claude mcp add quorum -- npx -y quorum-mcp-relay
   ```

   For Codex, add this to `~/.codex/config.toml`:

   ```toml
   [mcp_servers.quorum]
   command = "npx"
   args = ["-y", "quorum-mcp-relay"]
   ```

2. Start the agent. The relay starts with it and waits for a Quorum tab on port 7437 of your
   machine.

## Turn on Agent access

3. Open the game menu with **Esc** and select **Settings**.
4. Turn on **Agent access**. It is off by default, and the game remembers your choice.
5. If the browser asks to allow access to the local network, allow it.

The page now connects to the relay. If no relay runs, the page tries again and waits longer each
time, so you can start the agent later.

## Ask the agent

6. Ask a question, for example: "Read my Quorum game and tell me what to fix first."
7. Check that the agent calls `get_company`. If the answer names your Cash, users, and Era, the
   connection works.

The agent has six tools. All of them only read:

| Tool            | What it returns                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| `get_company`   | Cash, users, Apdex, the Era, latency percentiles, revenue, Burn, the bottleneck, and your Research. Start here. |
| `get_design`    | Every Node and Link, with its live load, latency, and drops, plus the health of each request kind.              |
| `get_incidents` | The running incident, the alert rules and alarms, and recent postmortems.                                       |
| `get_inbox`     | Your mail, with the choices each message offers. The agent can read the choices, not take them.                 |
| `get_history`   | Recent samples of users, revenue, Burn, latency, p99, Apdex, and errors, to see trends.                         |
| `get_game`      | The whole saved Game as JSON. It is large, so the agent should prefer the others.                               |

The agent sees the tab you looked at last. Pause the game (**Space**) if you want its answer to
match what you see.

## Apply the advice yourself

8. Read what the agent suggests.
9. Check the claim on the board before you act. For example, select the Node it names and read
   its **Load** row.
10. Make the change yourself, then ask the agent to read the game again.

## When it does not answer

| Message from the agent                   | Fix                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| "No Quorum tab is connected."            | Open the game, start a Company, and turn on **Agent access**.                          |
| "The Quorum tab did not answer in time." | The tab may be asleep in the background. Bring it to the front.                        |
| "A Challenge is open."                   | Challenges are scored, so no agent can read them. Leave the Challenge first.           |
| "No Company is open."                    | Open a Company.                                                                        |
| The relay logs "Port 7437 is in use."    | Another relay already runs. Close the other agent. Only one relay can run per machine. |

## When the relay cannot connect

Some browsers block a secure page from reaching your own machine. Safari may block it.

11. Open **Settings** and select **Copy state as JSON**.
12. Paste the result into your agent.

The JSON holds the same views that the tools return. It answers nothing while a Challenge is open,
too. Copy it again each time the game changes.

:::Note{tone="tip"}
Ask the agent to explain, not only to prescribe. "Why is the Database the bottleneck?" teaches you
more than "What do I click?"
:::

## Related

- [Find the bottleneck](/guides/find-the-bottleneck) shows how to check the agent's answer on the
  board.
- The relay's source is in the
  [Quorum repository](https://github.com/elianiva/quorum/tree/main/packages/mcp-relay).
