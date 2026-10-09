import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HelpPanel from '../HelpPanel.jsx'

describe('HelpPanel', () => {
  it('explains the local MP3 workflow without showing details by default', () => {
    render(<HelpPanel />)

    expect(screen.getByText('Paste a YouTube link or import a desktop MP3')).toBeInTheDocument()
    expect(screen.queryByText('Practice with a local MP3')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show details' }))

    expect(screen.getByText('Practice with a local MP3')).toBeInTheDocument()
    expect(screen.getByText(/recordings stay in this browser/i)).toBeInTheDocument()
    expect(screen.getByText(/separate from YouTube saved loops and Set List/i)).toBeInTheDocument()
  })
})
