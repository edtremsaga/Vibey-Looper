import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Stub YouTube IFrame API so App doesn't load external script or hang
const mockPlayerInstance = {
  getDuration: () => 120,
  setPlaybackRate: () => {},
  setVolume: () => {},
  playVideo: () => {},
  pauseVideo: () => {},
  getCurrentTime: () => 0,
  seekTo: () => {},
}
vi.stubGlobal('YT', {
  Player: vi.fn(function (container, options) {
    const onReady = options?.events?.onReady
    if (typeof onReady === 'function') {
      setTimeout(() => onReady({ target: mockPlayerInstance }), 0)
    }
    return mockPlayerInstance
  }),
})

// Stub fetch so fetchVideoTitle (oEmbed) doesn't hit the network
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () =>
      Promise.resolve({
        title: 'Test Video',
        author_name: 'Test Author',
        thumbnail_url: 'https://example.com/thumb.jpg',
      }),
  })
))
