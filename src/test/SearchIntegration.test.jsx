import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App.jsx'

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.stubGlobal('fetch', vi.fn(async (url) => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => String(url).startsWith('/api/youtube-search')
      ? { items: [{ videoId: 'abcdefghijk', title: 'Search practice song', channelTitle: 'Artist', thumbnailUrl: 'https://example.com/thumb.jpg', duration: '2:00' }] }
      : { title: 'Search practice song', author_name: 'Artist' },
  })))
})

describe('Search and player integration', () => {
  it.each(['button', 'Enter'])('loads a search result through the existing controls using %s', async (trigger) => {
    localStorage.setItem('savedLoops', '[]')
    render(<App />)
    await waitFor(() => expect(screen.getByRole('button', { name: /reset loop/i })).toBeEnabled())
    const input = screen.getByLabelText(/search for a song/i)
    fireEvent.change(input, { target: { value: 'practice song' } })
    if (trigger === 'Enter') fireEvent.keyPress(input, { key: 'Enter', charCode: 13 })
    else fireEvent.click(screen.getByRole('button', { name: /^search$/i }))
    const result = await screen.findByRole('button', { name: /Search practice song/i })
    fireEvent.click(result)
    expect(screen.getByPlaceholderText(/search or paste a youtube link/i)).toHaveValue('https://www.youtube.com/watch?v=abcdefghijk')
    expect(screen.getByLabelText(/start time/i, { selector: 'input' })).toHaveValue('0:00')
    expect(screen.getByText('Loaded: Search practice song')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Search practice song/i })).not.toBeInTheDocument()
    expect(localStorage.getItem('savedLoops')).toBe('[]')
  })
  it('shows the existing retry message for a rate-limited search', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByRole('button', { name: /reset loop/i })).toBeEnabled())
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 429 })
    fireEvent.change(screen.getByLabelText(/search for a song/i), { target: { value: 'practice' } })
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }))
    expect(await screen.findByText('Too many searches right now. Try again in a bit.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^search$/i })).toBeEnabled()
  })
})
