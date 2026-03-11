import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../SetList.jsx', () => ({
  default: ({ onBack }) => (
    <button type="button" onClick={onBack}>
      Back to looper
    </button>
  ),
}))

import App from '../App.jsx'

// Stub localStorage so App can load without errors
beforeEach(() => {
  const store = {}
  vi.stubGlobal('localStorage', {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length },
    key: (i) => Object.keys(store)[i] ?? null,
  })
})

describe('App', () => {
  const renderApp = async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset loop/i })).toBeEnabled()
    })
  }

  const getStartTimeInput = () => screen.getByLabelText(/start time/i, { selector: 'input' })
  const getEndTimeInput = () => screen.getByLabelText(/end time/i, { selector: 'input' })
  const getVideoInput = () => screen.getByLabelText(/url or video id of song from youtube/i, { selector: 'input' })

  const setLoopTimes = (startValue, endValue) => {
    fireEvent.change(getStartTimeInput(), { target: { value: startValue } })
    fireEvent.change(getEndTimeInput(), { target: { value: endValue } })
  }

  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText(/loop sections of songs/i)).toBeInTheDocument()
  })

  it('has no button nested inside another button', () => {
    const { container } = render(<App />)
    const buttons = container.querySelectorAll('button')
    buttons.forEach((btn) => {
      const nestedButton = btn.querySelector('button')
      expect(nestedButton).toBeNull()
    })
  })

  it('help modal contains updated help content (default video, Resume Loop, target loops range, Set/Set from Video)', () => {
    render(<App />)
    const helpButton = screen.getByRole('button', { name: /help/i })
    fireEvent.click(helpButton)

    const helpContent = document.querySelector('.help-modal .help-content')
    expect(helpContent).toBeInTheDocument()

    const text = helpContent?.textContent ?? ''

    // Default video (star) - added in update
    expect(text).toMatch(/star.*default|default.*star/i)
    expect(text).toMatch(/load when you open the app/i)

    // Resume Loop - added in update
    expect(text).toMatch(/Resume Loop/i)
    expect(text).toMatch(/resume from the current position/i)

    // Target loops range (1 to 10,000) - added in update
    expect(text).toMatch(/1 to 10,000/)

    // Set button: desktop shows "Set from Video", mobile shows "Set" - at least one must appear
    const hasSetFromVideo = text.includes('Set from Video')
    const hasSetButton = /"Set"|'Set'/.test(text) || text.includes('the Set button')
    expect(hasSetFromVideo || hasSetButton).toBe(true)

    // Playback speed: preset 0.5x to 2x; desktop also 0.25x to 2x
    expect(text).toMatch(/0\.5x to 2x/)
  })

  it('does not restore stale times after loading a different video and clicking reset', async () => {
    await renderApp()

    setLoopTimes('0:05', '0:30')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    fireEvent.change(getVideoInput(), {
      target: { value: 'https://www.youtube.com/watch?v=abcdefghijk' },
    })

    await waitFor(() => {
      expect(getStartTimeInput()).toHaveValue('0:00')
    })

    fireEvent.click(screen.getByRole('button', { name: /reset loop/i }))

    expect(getStartTimeInput()).toHaveValue('0:00')
    expect(getEndTimeInput()).toHaveValue('0:30')
  })

  it('does not restore stale times after loading a saved loop for a different video and clicking reset', async () => {
    localStorage.setItem(
      'savedLoops',
      JSON.stringify([
        {
          id: 'saved-loop-1',
          videoId: 'lmnopqrstuv',
          url: 'https://www.youtube.com/watch?v=lmnopqrstuv',
          startTime: 20,
          endTime: 40,
          targetLoops: 3,
          playbackSpeed: 1,
          title: 'Saved Loop',
          author: 'Test Author',
          thumbnail: 'https://example.com/thumb.jpg',
          timestamp: Date.now(),
        },
      ])
    )

    await renderApp()

    setLoopTimes('0:05', '0:30')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    const savedLoopsButtons = screen.getAllByRole('button', { name: /saved loops/i })
    fireEvent.click(savedLoopsButtons[savedLoopsButtons.length - 1])
    fireEvent.click(screen.getAllByRole('menuitem')[0])

    await waitFor(() => {
      expect(getStartTimeInput()).toHaveValue('0:20')
      expect(getEndTimeInput()).toHaveValue('0:40')
    })

    fireEvent.click(screen.getByRole('button', { name: /reset loop/i }))

    expect(getStartTimeInput()).toHaveValue('0:20')
    expect(getEndTimeInput()).toHaveValue('0:40')
  })

  it('still restores the last started times when resetting within the same video', async () => {
    await renderApp()

    setLoopTimes('0:05', '0:30')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    setLoopTimes('0:10', '0:20')
    fireEvent.click(screen.getByRole('button', { name: /reset loop/i }))

    expect(getStartTimeInput()).toHaveValue('0:05')
    expect(getEndTimeInput()).toHaveValue('0:30')
  })

  it('does not restore stale times after returning from Set List and clicking reset', async () => {
    await renderApp()

    setLoopTimes('0:05', '0:30')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    fireEvent.click(screen.getByRole('button', { name: /^set list$/i }))
    fireEvent.click(screen.getByRole('button', { name: /back to looper/i }))
    fireEvent.click(screen.getByRole('button', { name: '1.25x' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset loop/i })).toBeEnabled()
      expect(getStartTimeInput()).toHaveValue('0:00')
    })

    fireEvent.click(screen.getByRole('button', { name: /reset loop/i }))

    expect(getStartTimeInput()).toHaveValue('0:00')
    expect(getEndTimeInput()).not.toHaveValue('0:30')
  })
})
