import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
