import { CHALLENGE_IDS, goldenHash, referenceHash } from './report.ts'

/* A Worker for `engines/workerd.mjs`: `/golden` and `/challenge/<id>` answer with the hash workerd computes. */

export default {
  fetch: (request: Request): Response => {
    const path = new URL(request.url).pathname
    if (path === '/golden') return new Response(goldenHash())
    if (path === '/challenges') return Response.json(CHALLENGE_IDS)
    const id = path.startsWith('/challenge/') ? path.slice('/challenge/'.length) : ''
    return CHALLENGE_IDS.includes(id)
      ? new Response(referenceHash(id))
      : new Response('Not found', { status: 404 })
  },
}
