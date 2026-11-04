import { afterEach, expect, test, vi } from 'vitest'
import worker from './worker.ts'

afterEach(() => vi.unstubAllGlobals())

test('the website Worker forwards API requests through the service binding', async () => {
  const forwarded: Array<Request> = []
  const request = new Request('https://quorum.test/api/rpc', {
    method: 'POST',
    body: '{"method":"ping"}',
  })

  const response = await worker.fetch(request, {
    API: {
      fetch(input) {
        forwarded.push(input)
        return Promise.resolve(new Response('from the API Worker', { status: 202 }))
      },
    },
  })

  expect(forwarded).toEqual([request])
  expect(response.status).toBe(202)
  expect(await response.text()).toBe('from the API Worker')
})

test('the website Worker proxies analytics to PostHog without cookies', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = []
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} })
    return Promise.resolve(new Response('ok', { status: 200 }))
  })

  const request = new Request('https://quorum.test/q/i/v0/e/', {
    method: 'POST',
    body: '{"event":"app:session_start"}',
    headers: {
      'CF-Connecting-IP': '203.0.113.7',
      cookie: 'session=1',
      authorization: 'Bearer phc_test',
      'content-type': 'application/json',
    },
  })
  const response = await worker.fetch(request, {
    API: { fetch: () => Promise.reject(new Error('the API must not see analytics')) },
  })

  expect(response.status).toBe(200)
  expect(calls).toHaveLength(1)
  expect(calls[0]?.url).toBe('https://us.i.posthog.com/i/v0/e/')
  const headers = new Headers(calls[0]?.init.headers)
  expect(headers.get('x-forwarded-for')).toBe('203.0.113.7')
  expect(headers.get('cookie')).toBeNull()
  expect(headers.get('authorization')).toBe('Bearer phc_test')
  expect(calls[0]?.init.body).toBeInstanceOf(ArrayBuffer)
})

test('the website Worker sends analytics assets to the asset host', async () => {
  const urls: Array<string> = []
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    urls.push(String(input))
    return Promise.resolve(new Response('ok'))
  })

  await worker.fetch(new Request('https://quorum.test/q/static/array.js'), {
    API: { fetch: () => Promise.reject(new Error('the API must not see analytics')) },
  })

  expect(urls).toEqual(['https://us-assets.i.posthog.com/static/array.js'])
})
