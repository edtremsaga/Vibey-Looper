type YouTubeSearchItem = {
  id?: {
    videoId?: string
  }
  snippet?: {
    title?: string
    channelTitle?: string
    thumbnails?: {
      medium?: { url?: string }
      high?: { url?: string }
      default?: { url?: string }
    }
  }
}

type YouTubeVideoItem = {
  id?: string
  contentDetails?: {
    duration?: string
  }
}

type VercelRequest = {
  method?: string
  query?: {
    q?: string | string[]
  }
}

type VercelResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

type SearchResultItem = {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  duration: string
}

type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const cache = new Map<string, CacheEntry<unknown>>()
const SEARCH_RESULTS_TTL_MS = 5 * 60 * 1000
const DURATION_TTL_MS = 60 * 60 * 1000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rawQuery = Array.isArray(req.query?.q) ? req.query?.q[0] : req.query?.q
  const query = rawQuery?.trim() ?? ''

  if (!query) {
    res.status(200).json({ items: [] })
    return
  }

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Missing YouTube API key' })
    return
  }

  const youtubeQuery = /\bofficial\b/i.test(query) ? query : `${query} official`
  const searchCacheKey = `search:${query.toLowerCase()}`
  const cachedSearchResults = getCachedValue<SearchResultItem[]>(searchCacheKey)

  if (cachedSearchResults) {
    res.status(200).json({ items: cachedSearchResults })
    return
  }

  try {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      maxResults: '8',
      q: youtubeQuery,
      key: apiKey,
    })

    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`,
      { cache: 'no-store' }
    )

    if (!searchResponse.ok) {
      const body = await searchResponse.json().catch(() => null)
      const reason = body?.error?.errors?.[0]?.reason
      if (searchResponse.status === 429 || reason === 'quotaExceeded' || reason === 'rateLimitExceeded') {
        res.status(429).json({ error: 'Rate limit' })
        return
      }

      res.status(502).json({ error: 'Search failed' })
      return
    }

    const searchData = (await searchResponse.json()) as { items?: YouTubeSearchItem[] }
    const searchItems = searchData.items ?? []
    const videoIds = searchItems
      .map((item) => item.id?.videoId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)

    if (videoIds.length === 0) {
      setCachedValue(searchCacheKey, [], SEARCH_RESULTS_TTL_MS)
      res.status(200).json({ items: [] })
      return
    }

    const durationById = new Map<string, string>()
    const uncachedVideoIds: string[] = []

    for (const videoId of videoIds) {
      const cachedDuration = getCachedValue<string>(`duration:${videoId}`)
      if (cachedDuration) {
        durationById.set(videoId, cachedDuration)
      } else {
        uncachedVideoIds.push(videoId)
      }
    }

    if (uncachedVideoIds.length > 0) {
      const videosParams = new URLSearchParams({
        part: 'contentDetails',
        id: uncachedVideoIds.join(','),
        key: apiKey,
      })

      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`,
        { cache: 'no-store' }
      )

      if (videosResponse.ok) {
        const videosData = (await videosResponse.json()) as { items?: YouTubeVideoItem[] }

        for (const item of videosData.items ?? []) {
          if (!item.id) continue
          const formattedDuration = formatIsoDuration(item.contentDetails?.duration ?? '')
          durationById.set(item.id, formattedDuration)
          setCachedValue(`duration:${item.id}`, formattedDuration, DURATION_TTL_MS)
        }
      }
    }

    const items = searchItems
      .map((item) => {
        const videoId = item.id?.videoId
        const title = item.snippet?.title
        const channelTitle = item.snippet?.channelTitle
        const thumbnailUrl =
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.default?.url

        if (!videoId || !title || !channelTitle || !thumbnailUrl) {
          return null
        }

        return {
          videoId,
          title,
          channelTitle,
          thumbnailUrl,
          duration: durationById.get(videoId) ?? '--:--',
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    setCachedValue(searchCacheKey, items, SEARCH_RESULTS_TTL_MS)
    res.status(200).json({ items })
  } catch {
    res.status(500).json({ error: 'Search failed' })
  }
}

function getCachedValue<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) {
    return null
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return null
  }

  return entry.value as T
}

function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

function formatIsoDuration(isoDuration: string): string {
  const match = isoDuration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) {
    return '--:--'
  }

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const seconds = Number(match[3] ?? 0)
  const totalMinutes = hours * 60 + minutes

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${totalMinutes}:${String(seconds).padStart(2, '0')}`
}
