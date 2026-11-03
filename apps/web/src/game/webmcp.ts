import { TOOLS, type ToolName } from 'quorum-mcp-relay/tools'
import { ledgerOf, offCompany, type Model } from './model.ts'

/* ==========================================================================
   The read-only tools an agent can call: WebMCP for an agent in the player's
   browser, the agent relay for a terminal agent, and the "Copy state as JSON"
   button. They share one set of readers over the last Model that `publish`
   saw. Nothing here can send a Message: the player decides.
   Tool names and descriptions live in `quorum-mcp-relay/tools`.
   https://developer.chrome.com/docs/ai/webmcp/imperative-api
   ========================================================================== */

type Input = Record<string, unknown>

let latest: Model | null = null

/** Remembers the newest Model. The update loop calls it after every Message. */
export const publish = (model: Model): void => {
  latest = model
}

const round = (n: number): number => Math.round(n * 1000) / 1000

const runs: Record<ToolName, (model: Model, input: Input) => unknown> = {
  get_company: (m) => {
    const ledger = ledgerOf(m)
    return {
      mode: m.challenge ? 'challenge' : m.sandbox ? 'sandbox' : 'company',
      offCompany: offCompany(m),
      screen: { route: m.route._tag, panel: m.panel, region: m.region, selectedNode: m.selected },
      paused: m.paused,
      speed: m.speed,
      simSeconds: round(m.game.time),
      stage: m.game.stage,
      founding: m.game.founding,
      cash: round(m.game.cash),
      equity: m.game.equity,
      users: round(m.game.users),
      market: round(ledger.market),
      apdex: round(ledger.apdex),
      demand: round(ledger.demand),
      served: round(ledger.served),
      errorShare: round(ledger.errorShare),
      latencyMs: {
        mean: round(ledger.latency),
        p50: round(ledger.p50),
        p95: round(ledger.p95),
        p99: round(ledger.p99),
      },
      revenuePerSec: round(ledger.revenue),
      burnPerSec: round(ledger.burn),
      bottleneck: m.bottleneck,
      failingKinds: ledger.failing,
      researched: m.game.researched,
      studies: m.game.studies,
      openActions: m.game.openActions,
    }
  },
  get_design: (m) => {
    const ledger = ledgerOf(m)
    return {
      nodes: m.game.nodes.map((node) => ({ ...node, ledger: ledger.nodes[node.id] ?? null })),
      links: m.game.links.map((link) => ({
        ...link,
        ledger: ledger.links.find((l) => l.from === link.from && l.to === link.to) ?? null,
      })),
      kinds: ledger.kinds,
      errors: ledger.errors,
    }
  },
  get_incidents: (m, input) => ({
    active: m.game.incident,
    alertRules: m.game.alertRules,
    alarms: m.game.alarms,
    falseAlarms: m.game.falseAlarms,
    openActions: m.game.openActions,
    postmortems: m.game.postmortems.slice(-(Number(input['limit']) || 5)),
  }),
  get_inbox: (m, input) =>
    m.inbox
      .filter((mail) => {
        const folder = mail.trashed ? 'trash' : mail.spam ? 'spam' : 'inbox'
        return folder === (input['folder'] ?? 'inbox') && (!input['unreadOnly'] || !mail.read)
      })
      .map((mail) => ({
        id: mail.id,
        sender: mail.sender,
        subject: mail.subject,
        time: round(mail.time),
        read: mail.read,
        resolved: mail.resolved !== null,
        answer: mail.answer,
        choices: mail.actions.map((action) => action.label),
        entries: mail.entries,
      })),
  get_history: (m, input) => m.game.history.slice(-Math.min(600, Number(input['last']) || 60)),
  get_game: (m) => ({ ...m.game, history: undefined }),
}

/** Why an agent gets nothing, or null when it may read the game. */
export const refusal = (model: Model | null): string | null =>
  model === null
    ? 'No Company is open. Ask the player to open one.'
    : model.challenge
      ? 'A Challenge is open. Challenges are scored, so agents cannot read them.'
      : null

/** Runs one tool over the newest Model, and returns its JSON text. Throws the reason it cannot. */
export const readTool = (name: string, input: Input = {}): string => {
  const reason = refusal(latest)
  if (reason !== null || latest === null) throw new Error(reason ?? '')
  const run = (runs as Record<string, (model: Model, input: Input) => unknown>)[name]
  if (!run) throw new Error(`Unknown tool: ${name}`)
  return JSON.stringify(run(latest, input))
}

/** What the "Copy state as JSON" button copies: the same views the tools return, in one document. */
export const stateJson = (model: Model): string =>
  JSON.stringify(
    {
      company: runs.get_company(model, {}),
      design: runs.get_design(model, {}),
      incidents: runs.get_incidents(model, {}),
      inbox: runs.get_inbox(model, {}),
      history: runs.get_history(model, {}),
    },
    null,
    2,
  )

type WebMcpTool = Readonly<{
  name: string
  description: string
  inputSchema: object
  annotations: { readOnlyHint: true }
  execute: (input: Input) => string
}>

type ModelContext = { registerTool: (tool: WebMcpTool) => unknown }

/** WebMCP shows a tool's error to the agent as a result, so a refusal returns its reason. */
const execute = (name: string, input: Input): string => {
  try {
    return readTool(name, input ?? {})
  } catch (error) {
    return JSON.stringify({ error: error instanceof Error ? error.message : String(error) })
  }
}

/** Registers the tools with the browser, when it supports WebMCP. */
export const registerWebMcp = (): void => {
  const context = ((document as unknown as { modelContext?: ModelContext }).modelContext ??
    (navigator as unknown as { modelContext?: ModelContext }).modelContext) as
    | ModelContext
    | undefined
  if (!context) {
    console.warn('[quorum] WebMCP unavailable: document.modelContext is undefined')
    return
  }
  for (const definition of TOOLS) {
    const tool: WebMcpTool = {
      ...definition,
      annotations: { readOnlyHint: true },
      execute: (input) => execute(definition.name, input),
    }
    try {
      void Promise.resolve(context.registerTool(tool)).catch((error: unknown) =>
        console.error(`[quorum] WebMCP registerTool(${tool.name}) rejected`, error),
      )
    } catch (error) {
      console.error(`[quorum] WebMCP registerTool(${tool.name}) threw`, error)
    }
  }
  console.info(`[quorum] WebMCP: registered ${TOOLS.length} read-only tools`)
}
