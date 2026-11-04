/**
 * Path prefix served by the API Worker. The website Worker forwards this
 * prefix to the API through its service binding, so `alchemy.run.ts` derives
 * its `runWorkerFirst` rule from this value.
 */
export const API_PREFIX = '/api'

export const RPC_PATH = `${API_PREFIX}/rpc`

/**
 * The same-origin path the website Worker proxies to PostHog. It is not part
 * of the API: the browser sends analytics here so blockers do not match
 * PostHog's hostname.
 */
export const INGEST_PREFIX = '/q'
