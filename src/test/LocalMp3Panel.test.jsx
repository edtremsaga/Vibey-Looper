import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LocalAudioLooper } from '../LocalMp3Panel.jsx'
import { readRecording, saveLocalLoop } from '../utils/recordings.js'

vi.mock('../utils/recordings.js', () => ({
  readRecording: vi.fn(), saveLocalLoop: vi.fn(), loadLocalLoops: vi.fn(() => []),
  listRecordings: vi.fn(() => Promise.resolve([])), importRecording: vi.fn(),
}))

const selection = { recording: { id: 'audio:' + 'a'.repeat(64), title: 'Practice MP3' } }
let revoke, saved
beforeEach(() => {
  vi.clearAllMocks()
  readRecording.mockResolvedValue({ blob: new Blob(['audio']) })
  URL.createObjectURL = vi.fn(() => 'blob:test')
  revoke = URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  saved = vi.fn()
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

async function ready(value = selection) {
  const view = render(<LocalAudioLooper selection={value} onSaved={saved} />)
  const audio = screen.getByLabelText('MP3 preview')
  await waitFor(() => expect(audio).toHaveAttribute('src', 'blob:test'))
  Object.defineProperty(audio, 'duration', { configurable: true, value: 120.125 })
  fireEvent.loadedMetadata(audio)
  return { ...view, audio }
}

describe('MP3 loop controls', () => {
  it('initializes full duration, saves exact metadata and preserves YouTube storage', async () => {
    await ready()
    expect(screen.getByLabelText('MP3 start time')).toHaveValue('0:00')
    expect(screen.getByLabelText('MP3 end time')).toHaveValue('2:00.125')
    fireEvent.click(screen.getByText('Save MP3 Loop'))
    expect(saveLocalLoop).toHaveBeenCalledWith(expect.objectContaining({ startTime: 0, endTime: 120.125, recordingId: selection.recording.id }))
    expect(saved).toHaveBeenCalled()
  })

  it('preserves saved boundaries and rejects out-of-range saved loops', async () => {
    await ready({ ...selection, loop: { startTime: 5, endTime: 150, targetLoops: 3, playbackSpeed: 0.75 } })
    expect(screen.getByLabelText('MP3 start time')).toHaveValue('0:05')
    expect(screen.getByLabelText('MP3 end time')).toHaveValue('2:30')
    expect(screen.getByText('Start Loop')).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('valid start and end')
  })

  it('Reset restores last started bounds, but never another recording context', async () => {
    const { unmount } = await ready()
    fireEvent.change(screen.getByLabelText('MP3 start time'), { target: { value: '0:05' } })
    fireEvent.change(screen.getByLabelText('MP3 end time'), { target: { value: '0:20' } })
    fireEvent.click(screen.getByText('Start Loop'))
    fireEvent.click(screen.getByText('Stop Loop'))
    fireEvent.change(screen.getByLabelText('MP3 start time'), { target: { value: '0:10' } })
    fireEvent.click(screen.getByText('Reset Loop'))
    expect(screen.getByLabelText('MP3 start time')).toHaveValue('0:05')
    unmount()
    await ready({ recording: { id: 'audio:' + 'b'.repeat(64), title: 'Second' } })
    fireEvent.click(screen.getByText('Reset Loop'))
    expect(screen.getByLabelText('MP3 start time')).toHaveValue('0:00')
    expect(screen.getByLabelText('MP3 end time')).toHaveValue('2:00.125')
  })

  it('captures current position, changes rate/volume and validates invalid input', async () => {
    const { audio } = await ready()
    audio.currentTime = 12.5
    fireEvent.click(screen.getAllByText('Set from Audio')[0])
    expect(screen.getByLabelText('MP3 start time')).toHaveValue('0:12.5')
    fireEvent.change(screen.getByLabelText('MP3 playback speed'), { target: { value: '0.5' } })
    fireEvent.change(screen.getByLabelText('MP3 volume'), { target: { value: '30' } })
    expect(audio.playbackRate).toBe(0.5)
    expect(audio.preservesPitch).toBe(true)
    expect(audio.volume).toBe(0.3)
    fireEvent.change(screen.getByLabelText('MP3 end time'), { target: { value: 'junk' } })
    expect(screen.getByText('Start Loop')).toBeDisabled()
  })

  it('reports missing files and storage failure without pretending success', async () => {
    readRecording.mockResolvedValueOnce(undefined)
    const view = render(<LocalAudioLooper selection={selection} onSaved={saved} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Import the same MP3')
    view.unmount()
    await ready()
    saveLocalLoop.mockImplementationOnce(() => { throw new Error('quota') })
    fireEvent.click(screen.getByText('Save MP3 Loop'))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save')
    expect(saved).not.toHaveBeenCalled()
  })

  it('releases object URLs and stops playback on unmount/source switching', async () => {
    const { unmount, audio } = await ready()
    fireEvent.click(screen.getByText('Start Loop'))
    unmount()
    expect(audio.pause).toHaveBeenCalled()
    expect(revoke).toHaveBeenCalledWith('blob:test')
    expect(audio.hasAttribute('src')).toBe(false)
  })
})
