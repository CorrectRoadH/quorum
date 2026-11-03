import { ledgerOf, offCompany, type Model } from './model.ts'

/* ==========================================================================
   A read-only WebMCP surface. An agent in the player's browser (a sidebar
   assistant, an extension) can read the Board, the Inbox, and the incidents
   to give feedback. It cannot act: every tool only reads the last Model that
   `publish` saw, and nothing here can send a Message. The player decides.
   https://developer.chrome.com/docs/ai/webmcp/imperative-api
   ========================================================================== */

type Tool = Readonly<{
  name: string
  description: string
  inputSchema: object
  annotations: { readOnlyHint: true }
  execute: (input: Record<string, unknown>) => string
}>

type ModelContext = { registerTool: (tool: Tool) => unknown }

let latest: Model | null = null

/** Remembers the newest Model. The update loop calls it after every Message. */
export const publish = (model: Model): void => {
  latest = model
}

const json = (value: unknown): string => JSON.stringify(value)

const NONE = { error: 'No Company is open. Ask the player to open one.' }

const round = (n: number): number => Math.round(n * 1000) / 1000

const tool = (
  name: string,
  description: string,
  properties: Record<string, object>,
  run: (model: Model, input: Record<string, unknown>) => unknown,
): Tool => ({
  name,
  description,
  inputSchema: { type: 'object', properties },
  annotations: { readOnlyHint: true },
  execute: (input) => (latest ? json(run(latest, input ?? {})) : json(NONE)),
})

const tools: ReadonlyArray<Tool> = [
  tool(
    'get_company',
    'Headline state of the open Company: time, cash, users, Apdex, Era, Venture, the Bottleneck, and what the player has on screen. Start here.',
    {},
    (m) => {
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
  ),
  tool(
    'get_design',
    'The Design: every Node and Link as placed, plus the live Ledger figures for each (utilization, status, latency, drops) and per-request-kind health.',
    {},
    (m) => {
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
  ),
  tool(
    'get_incidents',
    'The running incident, the alert rules and alarms, and recent postmortems with their cost.',
    { limit: { type: 'number', description: 'Most recent postmortems to return. Default 5.' } },
    (m, input) => ({
      active: m.game.incident,
      alertRules: m.game.alertRules,
      alarms: m.game.alarms,
      falseAlarms: m.game.falseAlarms,
      openActions: m.game.openActions,
      postmortems: m.game.postmortems.slice(-(Number(input['limit']) || 5)),
    }),
  ),
  tool(
    'get_inbox',
    'Mail the game sent, oldest first. Each Thread has its sender, subject, entries, and the choices it offers; the agent can read the choices but cannot take them.',
    {
      folder: { enum: ['inbox', 'spam', 'trash'], description: 'Default inbox.' },
      unreadOnly: { type: 'boolean' },
    },
    (m, input) =>
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
  ),
  tool(
    'get_history',
    'Recent Samples of the Company (users, demand, served, revenue, burn, latency, p99, Apdex, errors), oldest first, to see trends.',
    { last: { type: 'number', description: 'How many Samples. Default 60, at most 600.' } },
    (m, input) => m.game.history.slice(-Math.min(600, Number(input['last']) || 60)),
  ),
  tool(
    'get_game',
    'The whole saved Game as JSON, for anything the other tools leave out. Large: prefer the others.',
    {},
    (m) => ({ ...m.game, history: undefined }),
  ),
]

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
  for (const t of tools) {
    try {
      void Promise.resolve(context.registerTool(t)).catch((error: unknown) =>
        console.error(`[quorum] WebMCP registerTool(${t.name}) rejected`, error),
      )
    } catch (error) {
      console.error(`[quorum] WebMCP registerTool(${t.name}) threw`, error)
    }
  }
  console.info(`[quorum] WebMCP: registered ${tools.length} read-only tools`)
}
