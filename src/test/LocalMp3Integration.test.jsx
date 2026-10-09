import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App.jsx'

vi.mock('../LocalMp3Panel.jsx', () => ({
  LocalMp3Library: ({ onSelect }) => (
    <button onClick={() => onSelect({ recording: { id: 'audio:test' }, key: 'test' })}>Choose test MP3</button>
  ),
  LocalMp3Player: ({ selection, onClose }) => selection && <>
    <p>MP3 active</p><button onClick={onClose}>Return to YouTube</button>
  </>,
}))
vi.mock('../SetList.jsx', () => ({ default: ({ onBack }) => <button onClick={onBack}>Back to looper</button> }))

const setViewportWidth = (width) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

beforeEach(() => {
  setViewportWidth(1280)
  localStorage.clear()
  vi.clearAllMocks()
})
async function ready() {
  const view = render(<App />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Reset Loop' })).toBeEnabled())
  const player = globalThis.YT.Player.mock.results[0].value
  player.pauseVideo = vi.fn()
  player.playVideo = vi.fn()
  return { ...view, player, options: globalThis.YT.Player.mock.calls[0][1] }
}

describe('MP3/YouTube isolation', () => {
  it('pauses YouTube, hides its controls, and rejects late PLAYING and keyboard events', async () => {
    const { container, player, options } = await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Start Loop' }))
    fireEvent.click(screen.getByText('Choose test MP3'))
    expect(player.pauseVideo).toHaveBeenCalled()
    expect(container.querySelector('.youtube-workspace')).not.toBeVisible()
    player.playVideo.mockClear()
    act(() => options.events.onStateChange({ data: 1, target: player }))
    fireEvent.keyDown(window, { key: ' ' })
    expect(player.playVideo).not.toHaveBeenCalled()
    expect(player.pauseVideo).toHaveBeenCalledTimes(2)
  })

  it('returns to the existing YouTube workspace without changing saved data', async () => {
    const { container } = await ready()
    const url = screen.getByPlaceholderText('Search or paste a YouTube link').value
    localStorage.setItem('savedLoops', '[{"untouched":true}]')
    fireEvent.click(screen.getByText('Choose test MP3'))
    fireEvent.click(screen.getByText('Return to YouTube'))
    expect(container.querySelector('.youtube-workspace')).toBeVisible()
    expect(screen.getByPlaceholderText('Search or paste a YouTube link')).toHaveValue(url)
    expect(localStorage.getItem('savedLoops')).toBe('[{"untouched":true}]')
  })

  it('clears local context when navigating to Set List and back', async () => {
    await ready()
    fireEvent.click(screen.getByText('Choose test MP3'))
    fireEvent.click(screen.getByRole('button', { name: 'set list' }))
    fireEvent.click(screen.getByText('Back to looper'))
    expect(screen.queryByText('MP3 active')).not.toBeInTheDocument()
  })

  it('does not render the local MP3 control in the mobile layout', async () => {
    setViewportWidth(375)
    render(<App />)
    await waitFor(() => expect(screen.queryByText('Choose test MP3')).not.toBeInTheDocument())
  })
})
