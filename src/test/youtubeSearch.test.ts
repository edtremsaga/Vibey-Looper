// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let handler: typeof import('../../api/youtube-search').default
const sample = { id: { videoId: 'abcdefghijk' }, snippet: {
  title: 'Practice song', channelTitle: 'Artist', thumbnails: { medium: { url: 'https://example.com/thumb.jpg' } },
} }
const response = (body: unknown, status = 200) => ({ ok: status === 200, status, json: async () => body })
const search = (items = [sample]) => response({ items })
const durations = () => response({ items: [{ id: 'abcdefghijk', contentDetails: { duration: 'PT3M15S' } }] })
const fetchMock = () => vi.mocked(fetch)
function call(q: unknown = 'practice', method = 'GET') {
  const res = { code: 0, body: undefined as any, headers: {} as Record<string, string>,
    setHeader(name: string, value: string) { this.headers[name] = value },
    status(code: number) { this.code = code; return this },
    json(body: unknown) { this.body = body },
  }
  const done = handler({ method, query: { q } } as any, res)
  return { res, done }
}
async function request(q: unknown = 'practice', method = 'GET') {
  const { res, done } = call(q, method)
  await done
  return res
}
const abortingFetch = (_url: unknown, options: any) => new Promise<never>((_resolve, reject) => {
  options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
})
beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-31T12:00:00Z'))
  vi.stubEnv('YOUTUBE_API_KEY', 'test-server-only-key')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(search([])))
  handler = (await import('../../api/youtube-search')).default
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('YouTube search protections', () => {
  it('rejects unsupported methods, duplicate queries, and oversized queries without upstream calls', async () => {
    const post = await request('song', 'POST')
    expect(post.code).toBe(405)
    expect(post.headers.Allow).toBe('GET')
    expect((await request(['a', 'b'])).code).toBe(400)
    expect((await request(123)).code).toBe(400)
    expect((await request('x'.repeat(201))).code).toBe(400)
    expect((await request('   ')).body).toEqual({ items: [] })
    expect(fetch).not.toHaveBeenCalled()
  })
  it('returns an error when the server key is missing', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', '')
    expect((await request()).code).toBe(500)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('preserves results, durations, official search, and case-insensitive caching', async () => {
    fetchMock().mockResolvedValueOnce(search() as any).mockResolvedValueOnce(durations() as any)
    const first = await request(' Practice ')
    expect(first.code).toBe(200)
    expect(first.body.items[0]).toEqual({ videoId: 'abcdefghijk', title: 'Practice song', channelTitle: 'Artist', thumbnailUrl: 'https://example.com/thumb.jpg', duration: '3:15' })
    expect(new URL(fetchMock().mock.calls[0][0] as string).searchParams.get('q')).toBe('Practice official')
    expect(JSON.stringify(first.body)).not.toContain('test-server-only-key')
    expect((await request('PRACTICE')).body).toEqual(first.body)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(first.headers['Cache-Control']).toBe('no-store')
  })
  it('expires search results but reuses duration metadata', async () => {
    fetchMock().mockResolvedValueOnce(search() as any).mockResolvedValueOnce(durations() as any)
    await request()
    vi.advanceTimersByTime(300_001)
    fetchMock().mockResolvedValueOnce(search() as any)
    expect((await request()).body.items[0].duration).toBe('3:15')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it('shares identical concurrent searches', async () => {
    let release!: (value: any) => void
    fetchMock().mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
    const a = call('same'); const b = call('SAME')
    expect(fetch).toHaveBeenCalledTimes(1)
    release(search([]))
    await Promise.all([a.done, b.done])
    expect(a.res.code).toBe(200)
    expect(b.res.body).toEqual(a.res.body)
  })
  it('caps distinct concurrent searches and releases capacity after failure', async () => {
    fetchMock().mockImplementation(abortingFetch as any)
    const pending = Array.from({ length: 8 }, (_, i) => call(`song ${i}`))
    const blocked = await request('ninth song')
    expect(blocked.code).toBe(429)
    expect(blocked.headers['Retry-After']).toBe('8')
    expect(fetch).toHaveBeenCalledTimes(8)
    await vi.advanceTimersByTimeAsync(8000)
    await Promise.all(pending.map(p => p.done))
    expect(pending.every(p => p.res.code === 504)).toBe(true)
    fetchMock().mockResolvedValue(search([]) as any)
    expect((await request('retry')).code).toBe(200)
  })
  it('limits requests even for cache hits and resets the window', async () => {
    for (let i = 0; i < 60; i++) expect((await request()).code).toBe(200)
    expect((await request()).code).toBe(429)
    expect(fetch).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(60_000)
    expect((await request()).code).toBe(200)
  })
  it('enforces the same deadline on duration fetching', async () => {
    fetchMock().mockImplementationOnce(async () => {
      vi.advanceTimersByTime(7000)
      return search() as any
    }).mockImplementationOnce(abortingFetch as any)
    const pending = call()
    await vi.advanceTimersByTimeAsync(1000)
    await pending.done
    expect(pending.res.code).toBe(504)
  })
  it('does not cache errors and maps provider quota failures to 429', async () => {
    fetchMock().mockResolvedValueOnce(response({ error: { errors: [{ reason: 'quotaExceeded' }] } }, 403) as any)
    expect((await request()).code).toBe(429)
    expect((await request()).code).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('returns a generic error without leaking provider details or secrets', async () => {
    fetchMock().mockRejectedValueOnce(new Error('test-server-only-key'))
    const result = await request()
    expect(result.code).toBe(502)
    expect(result.body).toEqual({ error: 'Search failed' })
  })
  it('evicts entries at the size bound before their TTL expires', async () => {
    fetchMock().mockImplementation(async (url: any) => {
      const parsed = new URL(url)
      if (parsed.pathname.endsWith('/search')) {
        const query = parsed.searchParams.get('q')!
        return search(Array.from({ length: 8 }, (_, i) => ({ ...sample, id: { videoId: `${query}-${i}` } }))) as any
      }
      return response({ items: parsed.searchParams.get('id')!.split(',').map(id => ({
        id, contentDetails: { duration: 'PT1M' },
      })) }) as any
    })
    // Each search inserts 8 durations and one result; 58 searches exceed 512 entries.
    for (let i = 0; i < 58; i++) await request(`song ${i}`)
    const before = fetchMock().mock.calls.length
    await request('song 0')
    expect(fetchMock().mock.calls.length).toBe(before + 2)
  })
})
