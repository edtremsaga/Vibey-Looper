import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

vi.mock('../SetList.jsx', () => ({
  default: ({ onBack }) => (
    <button type="button" onClick={onBack}>
      Back to looper
    </button>
  ),
}))

import App, { isTimeValidationError } from '../App.jsx'

// Stub localStorage so App can load without errors
beforeEach(() => {
  vi.clearAllMocks()
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
  const getVideoInput = () => screen.getByPlaceholderText(/search or paste a youtube link/i)
  const getMockPlayer = () => globalThis.YT.Player.mock.results[0]?.value
  const getPlayerOptions = () => globalThis.YT.Player.mock.calls[0]?.[1]
  const getSavedLoopsToggle = () => {
    const buttons = screen.getAllByRole('button', { name: /saved loops/i })
    return buttons[buttons.length - 1]
  }
  const openSavedLoopsMenuAndLoadFirst = async () => {
    fireEvent.click(getSavedLoopsToggle())
    await waitFor(() => {
      expect(screen.getAllByRole('menuitem').length).toBeGreaterThan(0)
    })
    fireEvent.click(screen.getAllByRole('menuitem')[0])
  }
  const setSavedLoops = (loops) => {
    localStorage.setItem('savedLoops', JSON.stringify(loops))
  }

  const setLoopTimes = (startValue, endValue) => {
    fireEvent.change(getStartTimeInput(), { target: { value: startValue } })
    fireEvent.change(getEndTimeInput(), { target: { value: endValue } })
  }

  const setupPlayerSpies = async () => {
    await waitFor(() => {
      expect(globalThis.YT.Player).toHaveBeenCalled()
    })

    const mockPlayer = getMockPlayer()
    mockPlayer.setPlaybackRate = vi.fn()
    mockPlayer.setVolume = vi.fn()
    mockPlayer.playVideo = vi.fn()
    mockPlayer.pauseVideo = vi.fn()
    mockPlayer.seekTo = vi.fn()
    mockPlayer.getCurrentTime = vi.fn(() => 0)
    mockPlayer.getDuration = vi.fn(() => 120)

    return mockPlayer
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

  it('clears the end-before-start validation error after times become valid', async () => {
    await renderApp()

    setLoopTimes('0:30', '0:05')
    expect(screen.getAllByText(/end time must be after start time/i).length).toBeGreaterThan(0)

    fireEvent.change(getEndTimeInput(), { target: { value: '0:45' } })

    await waitFor(() => {
      expect(screen.queryByText(/end time must be after start time/i)).not.toBeInTheDocument()
    })
  })

  it('recognizes start-after-duration validation messages as time errors', () => {
    expect(
      isTimeValidationError('Start time must be before the video ends (2:00). Use the "Set from Video" button to capture the exact time.')
    ).toBe(true)
  })

  it('recognizes end-after-duration validation messages as time errors', () => {
    expect(
      isTimeValidationError('End time cannot be after the video ends (2:00). Use the "Set from Video" button to capture the exact time.')
    ).toBe(true)
  })

  it('does not clear unrelated validation errors when times change', async () => {
    await renderApp()

    fireEvent.change(getVideoInput(), { target: { value: '' } })
    fireEvent.click(screen.getAllByRole('button', { name: /save current loop configuration/i }).slice(-1)[0])

    expect(screen.getAllByText(/invalid video\./i).length).toBeGreaterThan(0)

    setLoopTimes('0:10', '0:20')

    await waitFor(() => {
      expect(screen.getAllByText(/invalid video\./i).length).toBeGreaterThan(0)
    })
  })

  it('does not treat unrelated validation messages as time errors', () => {
    expect(isTimeValidationError('Invalid video. Please load a valid YouTube video first.')).toBe(false)
  })

  it('does not restore stale times after loading a saved loop for a different video and clicking reset', async () => {
    setSavedLoops([
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

    await renderApp()

    setLoopTimes('0:05', '0:30')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    await openSavedLoopsMenuAndLoadFirst()

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

  it('uses ENDED as a fallback loop completion path when polling has not completed the cycle', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    const onStateChange = getPlayerOptions().events.onStateChange

    act(() => {
      onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 5/i)).toBeInTheDocument()
    })

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0, true)
    expect(mockPlayer.playVideo).toHaveBeenCalled()
  })

  it('does not double-count when polling and ENDED happen close together', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()
    mockPlayer.getCurrentTime = vi.fn(() => 10)

    setLoopTimes('0:05', '0:10')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 5/i)).toBeInTheDocument()
    })

    const onStateChange = getPlayerOptions().events.onStateChange

    act(() => {
      onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 5/i)).toBeInTheDocument()
    })

    expect(screen.queryByText(/loop 2 \/ 5/i)).not.toBeInTheDocument()
  })

  it('preserves shortened-loop polling behavior', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()
    mockPlayer.getCurrentTime = vi.fn(() => 10)

    setLoopTimes('0:05', '0:10')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 5/i)).toBeInTheDocument()
    })

    expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(5, true)
  })

  it('stops on the final target loop when ENDED fallback completes the last cycle', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    fireEvent.change(screen.getByLabelText(/# of loops/i, { selector: 'input' }), {
      target: { value: '1' },
    })

    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    const onStateChange = getPlayerOptions().events.onStateChange

    act(() => {
      onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 1/i)).toBeInTheDocument()
    })

    expect(mockPlayer.pauseVideo).toHaveBeenCalled()
  })

  it('restarts a saved default full-song loop when ENDED fires', async () => {
    setSavedLoops([
      {
        id: 'saved-default-loop',
        videoId: 'lmnopqrstuv',
        url: 'https://www.youtube.com/watch?v=lmnopqrstuv',
        startTime: 0,
        endTime: 120,
        targetLoops: 5,
        playbackSpeed: 1,
        title: 'Saved Full Song',
        author: 'Test Author',
        thumbnail: 'https://example.com/thumb.jpg',
        timestamp: Date.now(),
      },
    ])

    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    await openSavedLoopsMenuAndLoadFirst()

    await waitFor(() => {
      expect(getStartTimeInput()).toHaveValue('0:00')
      expect(getEndTimeInput()).toHaveValue('2:00')
    })

    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    act(() => {
      getPlayerOptions().events.onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 5/i)).toBeInTheDocument()
    })

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0, true)
    expect(mockPlayer.playVideo).toHaveBeenCalled()
  })

  it('advances exactly once per ENDED cycle across multiple repeats and stops at target', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    fireEvent.change(screen.getByLabelText(/# of loops/i, { selector: 'input' }), {
      target: { value: '2' },
    })

    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    act(() => {
      getPlayerOptions().events.onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 2/i)).toBeInTheDocument()
    })

    // Simulate playback resuming from the loop start so the polling path can
    // clear the cycle guard before the next ENDED event arrives.
    mockPlayer.getCurrentTime = vi.fn(() => 0)
    await waitFor(() => {
      expect(screen.getByText(/current: 0:00/i)).toBeInTheDocument()
    })

    act(() => {
      getPlayerOptions().events.onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 2 \/ 2/i)).toBeInTheDocument()
    })

    expect(mockPlayer.pauseVideo).toHaveBeenCalled()
    expect(screen.queryByText(/loop 3 \/ 2/i)).not.toBeInTheDocument()
  })

  it('does nothing on ENDED when no loop is active', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    act(() => {
      getPlayerOptions().events.onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 0 \/ 5/i)).toBeInTheDocument()
    })

    expect(mockPlayer.seekTo).not.toHaveBeenCalled()
    expect(mockPlayer.playVideo).not.toHaveBeenCalled()
  })

  it('does not restart on ENDED after the loop has been stopped', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))
    fireEvent.click(screen.getByRole('button', { name: /^stop loop$/i }))

    act(() => {
      getPlayerOptions().events.onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 0 \/ 5/i)).toBeInTheDocument()
    })

    expect(mockPlayer.seekTo).toHaveBeenCalledTimes(1)
    expect(mockPlayer.playVideo).toHaveBeenCalledTimes(1)
  })

  it('reset still restores the last started loop state after an ENDED fallback cycle', async () => {
    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    setLoopTimes('0:05', '0:20')
    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    act(() => {
      getPlayerOptions().events.onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 5/i)).toBeInTheDocument()
    })

    setLoopTimes('0:10', '0:15')
    fireEvent.click(screen.getByRole('button', { name: /reset loop/i }))

    expect(getStartTimeInput()).toHaveValue('0:05')
    expect(getEndTimeInput()).toHaveValue('0:20')
  })

  it('restarts a saved loop with a non-zero start time from that same start after ENDED', async () => {
    setSavedLoops([
      {
        id: 'saved-nonzero-loop',
        videoId: 'lmnopqrstuv',
        url: 'https://www.youtube.com/watch?v=lmnopqrstuv',
        startTime: 20,
        endTime: 120,
        targetLoops: 4,
        playbackSpeed: 1,
        title: 'Saved Offset Loop',
        author: 'Test Author',
        thumbnail: 'https://example.com/thumb.jpg',
        timestamp: Date.now(),
      },
    ])

    await renderApp()
    const mockPlayer = await setupPlayerSpies()

    await openSavedLoopsMenuAndLoadFirst()

    await waitFor(() => {
      expect(getStartTimeInput()).toHaveValue('0:20')
      expect(getEndTimeInput()).toHaveValue('2:00')
    })

    fireEvent.click(screen.getByRole('button', { name: /start loop/i }))

    act(() => {
      getPlayerOptions().events.onStateChange({ data: 0, target: mockPlayer })
    })

    await waitFor(() => {
      expect(screen.getByText(/loop 1 \/ 4/i)).toBeInTheDocument()
    })

    expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(20, true)
  })
})
