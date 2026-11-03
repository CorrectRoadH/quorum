/* ==========================================================================
   The wire between the relay and the Quorum page. The page opens a WebSocket
   to the relay and keeps it open; the relay asks, the page answers. Both
   sides import this file, so it names only data: no Node, no browser.
   ========================================================================== */

export const RELAY_HOST = '127.0.0.1'
export const RELAY_PORT = 7437

/** The page's address. Pages on localhost may also connect, for development. */
export const QUORUM_ORIGIN = 'https://quorum.elianiva.com'

/** Page to relay. */
export type PageMessage =
  | Readonly<{ type: 'hello'; visible: boolean }>
  | Readonly<{ type: 'visible'; visible: boolean }>
  | Readonly<{ type: 'result'; id: number; ok: true; text: string }>
  | Readonly<{ type: 'result'; id: number; ok: false; error: string }>

/** Relay to page. */
export type RelayMessage = Readonly<{
  type: 'call'
  id: number
  tool: string
  input: Record<string, unknown>
}>
