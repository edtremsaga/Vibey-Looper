import { beforeEach, describe, expect, it, vi } from 'vitest'
import { importRecording, loadLocalLoops, saveLocalLoop } from '../utils/recordings.js'

beforeEach(() => { localStorage.clear() })

describe('local recording storage contract', () => {
  const loop = { recordingId: 'audio:' + 'a'.repeat(64), title: 'MP3', startTime: 1, endTime: 20, targetLoops: 5, playbackSpeed: 1 }
  it('round-trips saved MP3 loops without touching existing YouTube data', () => {
    localStorage.setItem('savedLoops', '[{"existing":true}]')
    localStorage.setItem('defaultVideo', '{"existing":true}')
    const saved = saveLocalLoop(loop)
    expect(loadLocalLoops()).toEqual([saved])
    expect(localStorage.getItem('savedLoops')).toBe('[{"existing":true}]')
    expect(localStorage.getItem('defaultVideo')).toBe('{"existing":true}')
  })
  it('ignores malformed and invalid saved data', () => {
    localStorage.setItem('musicLooperLocalLoops_v1', 'not json')
    expect(loadLocalLoops()).toEqual([])
    localStorage.setItem('musicLooperLocalLoops_v1', JSON.stringify([{ ...loop, id: 'bad', endTime: 0 }]))
    expect(loadLocalLoops()).toEqual([])
  })
  it('rejects non-MP3, empty and oversized files before decoding or storage', async () => {
    await expect(importRecording({ name: 'file.wav', size: 20 })).rejects.toThrow('MP3')
    await expect(importRecording({ name: 'file.mp3', size: 0 })).rejects.toThrow('empty')
    await expect(importRecording({ name: 'file.mp3', size: 101 * 1024 * 1024 })).rejects.toThrow('100 MB')
  })
})
