import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
})
