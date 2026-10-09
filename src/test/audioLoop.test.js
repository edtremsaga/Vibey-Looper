import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAudioLoop } from '../utils/audioLoop.js'

describe('local MP3 loop controller', () => {
  let audio, engine, onCount, onState, onError
  const range = { startTime: 5, endTime: 15, targetLoops: 3 }
  const settleSeek = () => { audio.ended = false; vi.advanceTimersByTime(50) }
  beforeEach(() => {
    vi.useFakeTimers()
    audio = new EventTarget()
    Object.assign(audio, {
      currentTime: 0, seeking: false, ended: false, paused: true,
      play: vi.fn(() => { audio.paused = false; return Promise.resolve() }),
      pause: vi.fn(() => { audio.paused = true }),
    })
    onCount = vi.fn(); onState = vi.fn(); onError = vi.fn()
    engine = createAudioLoop(audio, { onCount, onState, onError })
  })
  afterEach(() => { engine.destroy(); vi.useRealTimers() })

  it('repeats shortened segments and stops exactly at the target', () => {
    engine.start(range)
    for (let count = 1; count <= 3; count += 1) {
      settleSeek()
      audio.currentTime = 15
      vi.advanceTimersByTime(50)
      expect(onCount).toHaveBeenLastCalledWith(count)
      if (count < 3) expect(audio.currentTime).toBe(5)
    }
    expect(onState).toHaveBeenLastCalledWith(false)
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    expect(onCount).toHaveBeenLastCalledWith(3)
  })

  it('uses ENDED when a full recording ends before the polling boundary', () => {
    engine.start({ startTime: 0, endTime: 100, targetLoops: 2 })
    settleSeek()
    audio.currentTime = 99.99
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    expect(onCount).toHaveBeenLastCalledWith(1)
    expect(audio.currentTime).toBe(0)
    expect(audio.play).toHaveBeenCalledTimes(2)
    settleSeek()
    audio.currentTime = 99.99
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    expect(onCount).toHaveBeenLastCalledWith(2)
    expect(onState).toHaveBeenLastCalledWith(false)
  })

  it('does not double-count polling and ENDED for the same cycle', () => {
    engine.start(range)
    settleSeek()
    audio.currentTime = 15
    vi.advanceTimersByTime(50)
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    expect(onCount.mock.calls.map(([value]) => value)).toEqual([0, 1])
    settleSeek()
    audio.dispatchEvent(new Event('ended'))
    expect(onCount).toHaveBeenCalledTimes(2)
  })

  it('waits for seeking to complete before counting a new cycle', () => {
    engine.start(range)
    audio.seeking = true
    audio.currentTime = 15
    vi.advanceTimersByTime(500)
    expect(onCount).toHaveBeenCalledTimes(1)
    audio.seeking = false
    audio.currentTime = 5
    settleSeek()
    audio.currentTime = 15
    vi.advanceTimersByTime(50)
    expect(onCount).toHaveBeenLastCalledWith(1)
  })

  it('rearms on seeked for a segment that ends before the next polling tick', () => {
    engine.start({ startTime: 0, endTime: 0.02, targetLoops: 2 })
    audio.dispatchEvent(new Event('seeked'))
    audio.currentTime = 0.02
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    expect(onCount).toHaveBeenLastCalledWith(1)
    audio.ended = false
    audio.dispatchEvent(new Event('seeked'))
    audio.currentTime = 0.02
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    expect(onCount).toHaveBeenLastCalledWith(2)
  })

  it('pauses/resumes without losing count and honors edited bounds on resume', () => {
    engine.start(range)
    settleSeek()
    audio.currentTime = 15
    vi.advanceTimersByTime(50)
    settleSeek()
    engine.pause()
    audio.currentTime = 20
    vi.advanceTimersByTime(1000)
    expect(onCount).toHaveBeenLastCalledWith(1)
    engine.resume({ ...range, startTime: 2, endTime: 21 })
    audio.currentTime = 21
    vi.advanceTimersByTime(50)
    expect(onCount).toHaveBeenLastCalledWith(2)
    expect(audio.currentTime).toBe(2)
  })

  it('reset clears the active session and late events cannot restart it', () => {
    engine.start(range)
    engine.reset(4)
    expect(audio.currentTime).toBe(4)
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    engine.resume()
    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(onCount).toHaveBeenLastCalledWith(0)
  })

  it('reports a rejected play and ignores old rejection after disposal', async () => {
    audio.play.mockRejectedValueOnce(new DOMException('blocked', 'NotAllowedError'))
    engine.start(range)
    await vi.advanceTimersByTimeAsync(0)
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('blocked'))
    onError.mockClear()
    audio.play.mockRejectedValueOnce(new Error('old'))
    engine.start(range)
    engine.destroy()
    await vi.advanceTimersByTimeAsync(0)
    expect(onError).not.toHaveBeenCalled()
  })

  it('destroy removes listeners and timer', () => {
    engine.start(range)
    engine.destroy()
    audio.currentTime = 15; audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    vi.advanceTimersByTime(1000)
    expect(onCount).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})
