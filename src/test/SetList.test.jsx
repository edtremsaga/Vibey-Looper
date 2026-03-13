import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

let mockDragResult = null

vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ onDragEnd, children }) => (
    <div>
      <button
        type="button"
        aria-label="trigger drag end"
        onClick={() => {
          if (mockDragResult) {
            onDragEnd(mockDragResult)
          }
        }}
      >
        trigger drag end
      </button>
      {children}
    </div>
  ),
  Droppable: ({ children, droppableId }) =>
    children(
      { innerRef: () => {}, droppableProps: { 'data-droppable-id': droppableId } },
      { isDraggingOver: false }
    ),
  Draggable: ({ children }) =>
    children(
      { innerRef: () => {}, draggableProps: { style: {} }, dragHandleProps: {} },
      { isDragging: false }
    ),
}))

import SetList from '../SetList.jsx'
import { loadSavedSetLists, loadSetList } from '../utils/storage.js'

const songA = {
  id: 'loop-a',
  videoId: 'aaaaaaaaaaa',
  url: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
  startTime: 0,
  endTime: 60,
  targetLoops: 3,
  playbackSpeed: 1,
  title: 'Song A',
  author: 'Artist A',
  thumbnail: 'https://example.com/a.jpg',
  timestamp: 1,
}

const songB = {
  id: 'loop-b',
  videoId: 'bbbbbbbbbbb',
  url: 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
  startTime: 5,
  endTime: 75,
  targetLoops: 4,
  playbackSpeed: 1,
  title: 'Song B',
  author: 'Artist B',
  thumbnail: 'https://example.com/b.jpg',
  timestamp: 2,
}

const songC = {
  id: 'loop-c',
  videoId: 'ccccccccccc',
  url: 'https://www.youtube.com/watch?v=ccccccccccc',
  startTime: 10,
  endTime: 90,
  targetLoops: 2,
  playbackSpeed: 1,
  title: 'Song C',
  author: 'Artist C',
  thumbnail: 'https://example.com/c.jpg',
  timestamp: 3,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDragResult = null

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

describe('SetList save UX', () => {
  const renderSetList = (savedLoops = [songA, songB, songC]) =>
    render(<SetList onBack={() => {}} savedLoops={savedLoops} />)

  const seedSavedSetLists = (savedSetLists) => {
    localStorage.setItem('savedSetLists', JSON.stringify(savedSetLists))
  }

  const openSavedSetLists = () => {
    fireEvent.click(screen.getByRole('button', { name: /saved set lists/i }))
  }

  const openSaveDropdown = () => {
    fireEvent.click(screen.getByRole('button', { name: /save set list/i }))
  }

  const loadSavedSetListByName = async (name) => {
    openSavedSetLists()
    await waitFor(() => {
      expect(screen.getByText(name)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText(name))
  }

  const saveViaModal = async (name, buttonName = /^save$/i) => {
    const input = await screen.findByLabelText(/set list name:/i)
    fireEvent.change(input, { target: { value: name } })
    fireEvent.click(screen.getByRole('button', { name: buttonName }))
  }

  it('updates an existing saved set list in place when reordered and saved', async () => {
    seedSavedSetLists([
      { id: 'set-1', name: 'Practice Set', songs: [songA, songB], createdAt: Date.now() },
    ])

    renderSetList()
    await loadSavedSetListByName('Practice Set')

    expect(screen.getByText(/loaded: practice set/i)).toBeInTheDocument()

    mockDragResult = {
      source: { droppableId: 'set-list', index: 0 },
      destination: { droppableId: 'set-list', index: 1 },
      draggableId: 'loop-a',
    }
    fireEvent.click(screen.getByRole('button', { name: /trigger drag end/i }))

    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()

    openSaveDropdown()
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
    })

    const saved = loadSavedSetLists()
    expect(saved).toHaveLength(1)
    expect(saved[0].id).toBe('set-1')
    expect(saved[0].name).toBe('Practice Set')
    expect(saved[0].songs.map((song) => song.id)).toEqual(['loop-b', 'loop-a'])
  })

  it('creates a new saved set list and keeps the original unchanged on Save As New Set List', async () => {
    seedSavedSetLists([
      { id: 'set-1', name: 'Original Set', songs: [songA, songB], createdAt: Date.now() },
    ])

    renderSetList()
    await loadSavedSetListByName('Original Set')

    fireEvent.click(screen.getByLabelText(/add song c to set list/i))
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()

    openSaveDropdown()
    fireEvent.click(screen.getByRole('button', { name: /save as new set list/i }))
    await saveViaModal('Expanded Set', /save as new set list/i)

    await waitFor(() => {
      expect(screen.getByText(/loaded: expanded set/i)).toBeInTheDocument()
    })

    const saved = loadSavedSetLists()
    expect(saved).toHaveLength(2)
    expect(saved.find((setList) => setList.id === 'set-1')?.songs.map((song) => song.id)).toEqual(['loop-a', 'loop-b'])
    expect(saved.find((setList) => setList.name === 'Expanded Set')?.songs.map((song) => song.id)).toEqual(['loop-a', 'loop-b', 'loop-c'])
    expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
  })

  it('creates and loads a new saved set list when saving a brand-new working set list', async () => {
    renderSetList()

    fireEvent.click(screen.getByLabelText(/add song a to set list/i))
    expect(screen.queryByText(/^loaded:/i)).not.toBeInTheDocument()

    openSaveDropdown()
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    await saveViaModal('Fresh Set')

    await waitFor(() => {
      expect(screen.getByText(/loaded: fresh set/i)).toBeInTheDocument()
    })

    const saved = loadSavedSetLists()
    expect(saved).toHaveLength(1)
    expect(saved[0].name).toBe('Fresh Set')
    expect(saved[0].songs.map((song) => song.id)).toEqual(['loop-a'])
  })

  it('switches working list, loaded identity, and dirty state together when loading a different saved set list', async () => {
    seedSavedSetLists([
      { id: 'set-1', name: 'Set One', songs: [songA, songB], createdAt: Date.now() },
      { id: 'set-2', name: 'Set Two', songs: [songC], createdAt: Date.now() + 1 },
    ])

    renderSetList()
    await loadSavedSetListByName('Set One')

    fireEvent.click(screen.getAllByTitle(/remove from set list/i)[0])
    expect(screen.getByText(/loaded: set one • unsaved changes/i)).toBeInTheDocument()

    await loadSavedSetListByName('Set Two')

    await waitFor(() => {
      expect(screen.getByText(/loaded: set two/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
    expect(loadSetList().map((song) => song.id)).toEqual(['loop-c'])
  })

  it('marks add, remove, and reorder actions as dirty and clears dirty after save', async () => {
    seedSavedSetLists([
      { id: 'set-1', name: 'Dirty Test', songs: [songA, songB], createdAt: Date.now() },
    ])

    renderSetList()
    await loadSavedSetListByName('Dirty Test')

    fireEvent.click(screen.getByLabelText(/add song c to set list/i))
    expect(screen.getByText(/loaded: dirty test • unsaved changes/i)).toBeInTheDocument()

    await loadSavedSetListByName('Dirty Test')
    fireEvent.click(screen.getAllByTitle(/remove from set list/i)[0])
    expect(screen.getByText(/loaded: dirty test • unsaved changes/i)).toBeInTheDocument()

    await loadSavedSetListByName('Dirty Test')
    mockDragResult = {
      source: { droppableId: 'set-list', index: 0 },
      destination: { droppableId: 'set-list', index: 1 },
      draggableId: 'loop-a',
    }
    fireEvent.click(screen.getByRole('button', { name: /trigger drag end/i }))
    expect(screen.getByText(/loaded: dirty test • unsaved changes/i)).toBeInTheDocument()

    openSaveDropdown()
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
    })
  })

  it('set list playback still uses full-video sequence behavior unchanged', async () => {
    seedSavedSetLists([
      { id: 'set-1', name: 'Playback Set', songs: [songA, songB], createdAt: Date.now() },
    ])

    renderSetList()
    await loadSavedSetListByName('Playback Set')

    fireEvent.click(screen.getByRole('button', { name: /play set list/i }))

    await waitFor(() => {
      expect(globalThis.YT.Player).toHaveBeenCalled()
    })

    const playerOptions = globalThis.YT.Player.mock.calls[0][1]
    expect(playerOptions.videoId).toBe('aaaaaaaaaaa')
    expect(playerOptions.playerVars.autoplay).toBe(1)
  })
})
