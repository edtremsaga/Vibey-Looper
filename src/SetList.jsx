import { useState, useEffect, useRef, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import './App.css'
import { extractVideoId } from './utils/helpers.js'
import { loadSavedLoops, saveSetList, loadSetList, saveSavedSetList, loadSavedSetLists, deleteSavedSetList, updateSavedSetList } from './utils/storage.js'

function SetList({ onBack, savedLoops: savedLoopsProp }) {
  // State management
  const [savedLoops, setSavedLoops] = useState([])
  const [setList, setSetList] = useState([])
  const [player, setPlayer] = useState(null)
  const [apiReady, setApiReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSongIndex, setCurrentSongIndex] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [completionMessage, setCompletionMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Save Set List feature state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [setListName, setSetListName] = useState('')
  const [saveModalError, setSaveModalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [savedSetLists, setSavedSetLists] = useState([])
  const [showSavedSetListsDropdown, setShowSavedSetListsDropdown] = useState(false)
  const [loadedSetListId, setLoadedSetListId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  
  // Refs
  const playerRef = useRef(null)
  const playerInitializedRef = useRef(false)
  const countdownIntervalRef = useRef(null)
  const playSongAtIndexRef = useRef(null)
  const savedSetListsDropdownRef = useRef(null)
  const savedSetListsButtonRef = useRef(null)

  // Load saved loops and set list on mount
  useEffect(() => {
    const loops = savedLoopsProp || loadSavedLoops()
    setSavedLoops(loops)
    
    const loadedSetList = loadSetList()
    setSetList(loadedSetList)
  }, [savedLoopsProp])

  // Save set list to localStorage whenever it changes
  useEffect(() => {
    saveSetList(setList)
  }, [setList])

  // Load saved set lists on mount
  useEffect(() => {
    const loaded = loadSavedSetLists()
    console.log('Loaded saved set lists:', loaded.length, 'items:', loaded)
    setSavedSetLists(loaded)
  }, [])

  // Close saved set lists dropdown when clicking outside
  useEffect(() => {
    if (!showSavedSetListsDropdown) return

    const handleClickOutside = (event) => {
      if (savedSetListsDropdownRef.current && 
          savedSetListsButtonRef.current &&
          !savedSetListsDropdownRef.current.contains(event.target) &&
          !savedSetListsButtonRef.current.contains(event.target)) {
        setShowSavedSetListsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSavedSetListsDropdown])

  // Handle ESC key to close modals/dropdowns and help reset drag state
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        // Close any open dropdowns/modals
        setShowSavedSetListsDropdown(false)
        setShowSaveModal(false)
        setDeleteConfirmId(null)
        // Clicking on the container area might help clear drag state
        // The DragDropContext should handle cleanup automatically
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true)
    }

    if (window.YT && window.YT.Player) {
      setApiReady(true)
    }
  }, [])

  // Play song at specific index
  const playSongAtIndex = useCallback((index) => {
    if (index < 0 || index >= setList.length) return
    
    // Initialize player if not already initialized
    if (!player && apiReady && playerRef.current && !playerInitializedRef.current) {
      playerInitializedRef.current = true
      setIsLoading(true)
      
      const videoId = extractVideoId(setList[index].url)
      const container = playerRef.current
      
      setTimeout(() => {
        if (!container) return
        
        try {
          const newPlayer = new window.YT.Player(container, {
            height: '390',
            width: '640',
            videoId: videoId,
            playerVars: {
              playsinline: 1,
              autoplay: 1,
            },
            events: {
              onReady: (event) => {
                setPlayer(event.target)
                setIsLoading(false)
                setCurrentSongIndex(index)
                setErrorMessage('')
                setIsPlaying(true)
              },
              onStateChange: (event) => {
                if (event.data === 0) {
                  handleVideoEnd()
                } else if (event.data === 1) {
                  setIsPlaying(true)
                } else if (event.data === 2) {
                  setIsPlaying(false)
                }
              },
              onError: (event) => {
                setIsLoading(false)
                setErrorMessage('Error loading video. Please try again.')
                playerInitializedRef.current = false
              },
            },
          })
        } catch (error) {
          setIsLoading(false)
          setErrorMessage('Error initializing video player. Please refresh the page and try again.')
          playerInitializedRef.current = false
        }
      }, 200)
      return
    }
    
    // Player exists, load and play the video
    if (player && player.loadVideoById) {
      const videoId = extractVideoId(setList[index].url)
      try {
        player.loadVideoById(videoId)
        setCurrentSongIndex(index)
        setErrorMessage('')
        setIsPlaying(true)
      } catch (error) {
        setErrorMessage('Error loading video. Please try again.')
      }
    }
  }, [setList, player, apiReady])

  // Update playSongAtIndex ref whenever the function changes
  useEffect(() => {
    playSongAtIndexRef.current = playSongAtIndex
  }, [playSongAtIndex])

  // Handle video end - start countdown or show completion
  const handleVideoEnd = useCallback(() => {
    setCurrentSongIndex((prevIndex) => {
      if (prevIndex === null) return null
      
      // If there's a next song, start 5-second countdown
      if (prevIndex < setList.length - 1) {
        setIsPlaying(false)
        
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
        
        let remaining = 5
        setCountdown(remaining)
        
        countdownIntervalRef.current = setInterval(() => {
          remaining--
          setCountdown(remaining)
          if (remaining <= 0) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
            setCountdown(null)
            if (playSongAtIndexRef.current) {
              playSongAtIndexRef.current(prevIndex + 1)
            }
          }
        }, 1000)
      } else {
        // Last song finished - show completion message
        setIsPlaying(false)
        setCompletionMessage('Set list complete')
        setTimeout(() => {
          setCompletionMessage('')
        }, 5000)
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        setCountdown(null)
        return null
      }
      return prevIndex
    })
  }, [setList.length])

  // Handle drag end
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result
    
    // Clear any error messages
    setErrorMessage('')
    
    // If no destination (drag cancelled), just return - DragDropContext handles cleanup
    if (!destination) {
      return
    }
    
    // If dragging from left (saved loops) to right (set list)
    if (source.droppableId === 'saved-loops' && destination.droppableId === 'set-list') {
      const draggedItem = savedLoops.find(loop => loop.id === draggableId)
      if (!draggedItem) {
        return
      }
      
      // Check for duplicates
      const isDuplicate = setList.some(item => item.videoId === draggedItem.videoId)
      if (isDuplicate) {
        setErrorMessage('This song is already in the set list.')
        setTimeout(() => setErrorMessage(''), 3000)
        return
      }
      
      // Add to set list at destination index
      const newSetList = [...setList]
      newSetList.splice(destination.index, 0, draggedItem)
      setSetList(newSetList)
      setErrorMessage('')
    }
    // If dragging within set list (reordering)
    else if (source.droppableId === 'set-list' && destination.droppableId === 'set-list') {
      const newSetList = [...setList]
      const [removed] = newSetList.splice(source.index, 1)
      newSetList.splice(destination.index, 0, removed)
      setSetList(newSetList)
      setErrorMessage('')
    }
  }

  // Remove song from set list
  const handleRemoveFromSetList = (index) => {
    const newSetList = setList.filter((_, i) => i !== index)
    setSetList(newSetList)
    
    // If we're playing and this is the current or a future song, stop playback
    if (currentSongIndex !== null) {
      if (index === currentSongIndex) {
        // Current song removed - stop playback
        if (player && player.stopVideo) {
          player.stopVideo()
        }
        setIsPlaying(false)
        setCurrentSongIndex(null)
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        setCountdown(null)
      } else if (index < currentSongIndex) {
        // Earlier song removed - adjust index
        setCurrentSongIndex(currentSongIndex - 1)
      }
    }
  }

  // Play set list
  const handlePlaySetList = () => {
    if (setList.length === 0) {
      setErrorMessage('Set list is empty. Add songs to the set list to play.')
      return
    }
    
    // Clear any existing messages
    setErrorMessage('')
    setCompletionMessage('')
    
    // Stop any current playback
    if (player && player.stopVideo) {
      player.stopVideo()
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(null)
    
    // Start playing from first song
    playSongAtIndex(0)
  }

  // Stop playback
  const handleStop = () => {
    if (player && player.stopVideo) {
      player.stopVideo()
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setIsPlaying(false)
    setCurrentSongIndex(null)
    setCountdown(null)
    setErrorMessage('')
  }

  // Save Set List handlers
  const handleOpenSaveModal = () => {
    if (setList.length === 0) {
      setErrorMessage('Set list is empty. Add songs to the set list before saving.')
      return
    }
    console.log('[Save Modal] Opening save modal - current loadedSetListId:', loadedSetListId)
    console.log('[Save Modal] Current set list has', setList.length, 'songs')
    setSetListName('')
    setSaveModalError('')
    setShowSaveModal(true)
  }

  const handleCloseSaveModal = () => {
    setShowSaveModal(false)
    setSetListName('')
    setSaveModalError('')
  }

  const handleSaveSetList = () => {
    // Validate name
    const trimmedName = setListName.trim()
    if (!trimmedName) {
      setSaveModalError('Set list name cannot be empty.')
      return
    }

    if (trimmedName.length > 50) {
      setSaveModalError('Set list name cannot exceed 50 characters.')
      return
    }

    console.log('[Save Handler] Current loadedSetListId:', loadedSetListId)
    console.log('[Save Handler] Current savedSetLists count:', savedSetLists.length)

    // Check for duplicate name (unless it's the currently loaded set list)
    const existing = savedSetLists.find(list => 
      list.name.toLowerCase() === trimmedName.toLowerCase() && 
      list.id !== loadedSetListId
    )
    
    console.log('[Save Handler] Duplicate check - existing:', existing ? `Found "${existing.name}" (ID: ${existing.id})` : 'No duplicate found')
    
    if (existing) {
      setSaveModalError('A set list with this name already exists. Please choose a different name.')
      return
    }

    // Save or update
    // Only update if: loadedSetListId is set AND the name matches the loaded set list's name
    // Otherwise, create a new set list
    let saved
    if (loadedSetListId) {
      const loadedSetList = savedSetLists.find(list => list.id === loadedSetListId)
      if (loadedSetList && loadedSetList.name.toLowerCase() === trimmedName.toLowerCase()) {
        // Same name as loaded set list - update it
        console.log('[Save Handler] UPDATING existing set list (ID:', loadedSetListId, ') - same name')
        saved = updateSavedSetList(loadedSetListId, trimmedName, setList)
        console.log('[Save Handler] Update result:', saved ? `Success (ID: ${saved.id})` : 'Failed')
      } else {
        // Different name - create new set list
        console.log('[Save Handler] CREATING new set list - different name from loaded set list')
        saved = saveSavedSetList(trimmedName, setList)
        console.log('[Save Handler] Create result:', saved ? `Success (ID: ${saved.id})` : 'Failed')
        // Clear loadedSetListId since we're creating a new one
        setLoadedSetListId(null)
        console.log('[Save Handler] Cleared loadedSetListId (creating new set list)')
      }
    } else {
      // Create new
      console.log('[Save Handler] CREATING new set list')
      saved = saveSavedSetList(trimmedName, setList)
      console.log('[Save Handler] Create result:', saved ? `Success (ID: ${saved.id})` : 'Failed')
    }

    if (saved) {
      // Reload saved set lists
      console.log('[Save Handler] Reloading saved set lists...')
      const updated = loadSavedSetLists()
      console.log('[Save Handler] Reloaded count:', updated.length)
      setSavedSetLists(updated)
      
      // Only track loadedSetListId if we updated an existing set list (same name)
      // If we created a new one, don't track it (allow user to create more new ones)
      if (loadedSetListId && updated.find(list => list.id === loadedSetListId && list.name.toLowerCase() === trimmedName.toLowerCase())) {
        console.log('[Save Handler] Keeping loadedSetListId:', loadedSetListId, '(updated existing)')
        // loadedSetListId already set, keep it
      } else {
        console.log('[Save Handler] Cleared loadedSetListId (created new set list)')
        setLoadedSetListId(null)
      }
      
      // Close modal and show success
      handleCloseSaveModal()
      setSuccessMessage(`Set list '${trimmedName}' saved successfully`)
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } else {
      console.error('[Save Handler] Save/update failed!')
      setSaveModalError('Failed to save set list. Please try again.')
    }
  }

  const handleToggleSavedSetListsDropdown = () => {
    if (isPlaying) {
      return // Don't allow during playback
    }
    setShowSavedSetListsDropdown(!showSavedSetListsDropdown)
  }

  const handleLoadSavedSetList = (savedSetList) => {
    console.log('[Load Handler] Loading saved set list:', savedSetList.name, '(ID:', savedSetList.id, ')')
    setSetList(savedSetList.songs)
    setLoadedSetListId(savedSetList.id)
    console.log('[Load Handler] Set loadedSetListId to:', savedSetList.id)
    setShowSavedSetListsDropdown(false)
    setErrorMessage('')
  }

  const handleDeleteSavedSetList = (id, e) => {
    e.stopPropagation()
    setDeleteConfirmId(id)
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      const updated = deleteSavedSetList(deleteConfirmId)
      setSavedSetLists(updated)
      
      // If deleted set list was currently loaded, clear the loaded ID but keep the set list
      if (deleteConfirmId === loadedSetListId) {
        setLoadedSetListId(null)
      }
      
      setDeleteConfirmId(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmId(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      if (player && player.destroy) {
        player.destroy()
      }
    }
  }, [player])

  return (
    <div className="app">
      {/* Back button and title row */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0px', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          className="help-link-text" 
          onClick={onBack} 
          disabled={isPlaying}
          style={{ opacity: isPlaying ? 0.5 : 1, cursor: isPlaying ? 'not-allowed' : 'pointer' }}
        >
          ← back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginRight: 'auto', marginLeft: 'auto' }}>
          <h1 className="title" style={{ margin: 0, fontSize: '22px' }}>Music Looper</h1>
          <span className="title-byline">by Vibey Craft</span>
        </div>
        <div style={{ width: '100px' }}></div>
      </div>
      <p className="subtitle" style={{ marginTop: '0px', marginBottom: '10px' }}>Create & play a set list from your saved loops</p>

      {/* YouTube player container */}
      <div className="video-container">
        {isLoading && !player && (
          <div className="video-loading">
            <div className="spinner"></div>
            <p>Loading video...</p>
          </div>
        )}
        <div ref={playerRef} id="youtube-player-setlist" style={{width: '100%', height: '100%'}}></div>
      </div>

      {/* Countdown display */}
      {countdown !== null && (
        <div className="set-list-countdown">
          Next song in: {countdown}
        </div>
      )}

      {/* Completion message */}
      {completionMessage && (
        <div className="set-list-completion">
          {completionMessage}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="set-list-error">
          {errorMessage}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="set-list-success-message" style={{ color: '#22cc22', textAlign: 'center', marginBottom: '10px' }}>
          {successMessage}
        </div>
      )}

      {/* Play Set list, Save Set list, and Saved Set Lists buttons */}
      <div className="set-list-play-button-container">
        <button
          className="btn btn-start set-list-play-button"
          onClick={isPlaying ? handleStop : handlePlaySetList}
          disabled={setList.length === 0}
        >
          {isPlaying ? 'Stop Set List' : 'Play Set List'}
        </button>
        <button
          className="btn btn-start set-list-play-button"
          onClick={handleOpenSaveModal}
          disabled={setList.length === 0}
        >
          Save Set List
        </button>
        <div style={{ position: 'relative' }}>
          <button
            ref={savedSetListsButtonRef}
            className="btn btn-start set-list-play-button"
            onClick={handleToggleSavedSetListsDropdown}
            disabled={isPlaying}
            style={{ opacity: isPlaying ? 0.5 : 1, cursor: isPlaying ? 'not-allowed' : 'pointer' }}
          >
            Saved Set Lists
          </button>
          {showSavedSetListsDropdown && (
            <div ref={savedSetListsDropdownRef} className="saved-set-lists-dropdown">
              {savedSetLists.length === 0 ? (
                <div className="saved-set-list-item" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No saved set lists
                </div>
              ) : (
                (() => {
                  console.log('Rendering saved set lists dropdown:', savedSetLists.length, 'items')
                  return savedSetLists.map((savedSetList) => (
                  <div
                    key={savedSetList.id}
                    className="saved-set-list-item"
                    onClick={() => handleLoadSavedSetList(savedSetList)}
                    style={{ cursor: 'pointer', position: 'relative', paddingRight: '40px' }}
                  >
                    <div>{savedSetList.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {savedSetList.songs.length} {savedSetList.songs.length === 1 ? 'song' : 'songs'}
                    </div>
                    <button
                      className="delete-button"
                      onClick={(e) => handleDeleteSavedSetList(savedSetList.id, e)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      title="Delete saved set list"
                    >
                      ×
                    </button>
                  </div>
                ))
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="set-list-container">
          {/* Left column - Saved loops */}
          <div>
            <h2 className="set-list-column-title">
              Saved Loops
            </h2>
            <Droppable droppableId="saved-loops">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`set-list-column ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                >
                  {savedLoops.length === 0 ? (
                    <div className="set-list-empty-state">
                      No saved loops available
                    </div>
                  ) : (
                    savedLoops.map((loop, index) => {
                      const fullText = loop.author 
                        ? `${loop.title || `Video ${loop.videoId}`} - ${loop.author}`
                        : (loop.title || `Video ${loop.videoId}`)
                      return (
                        <Draggable key={loop.id} draggableId={loop.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`set-list-item ${snapshot.isDragging ? 'dragging' : ''}`}
                              style={provided.draggableProps.style}
                            >
                              <span className="set-list-drag-handle">⋮⋮</span>
                              {loop.thumbnail && (
                                <img 
                                  src={loop.thumbnail} 
                                  alt={loop.title || 'Thumbnail'}
                                  className="set-list-item-thumbnail"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              )}
                              <div className="set-list-item-info" title={fullText}>
                                <div className="set-list-item-title">
                                  {loop.title || `Video ${loop.videoId}`}
                                </div>
                                {loop.author && (
                                  <div className="set-list-item-author">
                                    {loop.author}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Right column - Set list */}
          <div>
            <h2 className="set-list-column-title">
              Set List
            </h2>
            <Droppable droppableId="set-list">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`set-list-column ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                >
                  {setList.length === 0 ? (
                    <div className="set-list-empty-state">
                      Drag songs here to create your set list. Then click the play set list button
                    </div>
                  ) : (
                    setList.map((item, index) => {
                      const fullText = item.author 
                        ? `${item.title || `Video ${item.videoId}`} - ${item.author}`
                        : (item.title || `Video ${item.videoId}`)
                      return (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`set-list-item ${snapshot.isDragging ? 'dragging' : ''} ${currentSongIndex === index ? 'playing' : ''}`}
                              style={provided.draggableProps.style}
                            >
                              <div className="set-list-drag-handle">
                                <div className="set-list-number-badge">
                                  {index + 1}
                                </div>
                                <span>⋮⋮</span>
                              </div>
                              {item.thumbnail && (
                                <img 
                                  src={item.thumbnail} 
                                  alt={item.title || 'Thumbnail'}
                                  className="set-list-item-thumbnail"
                                  onError={(e) => { e.target.style.display = 'none' }}
                                />
                              )}
                              <div className="set-list-item-info" title={fullText}>
                                <div className="set-list-item-title">
                                  {item.title || `Video ${item.videoId}`}
                                </div>
                                {item.author && (
                                  <div className="set-list-item-author">
                                    {item.author}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveFromSetList(index)
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="set-list-remove-button"
                                title="Remove from set list"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </Draggable>
                      )
                    })
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {/* Save Set List Modal */}
      {showSaveModal && (
        <div className="help-modal-overlay" onClick={handleCloseSaveModal}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <h2>Save Set List</h2>
              <button 
                className="help-modal-close"
                onClick={handleCloseSaveModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="help-modal-content">
              <label htmlFor="set-list-name-input" style={{ display: 'block', marginBottom: '10px' }}>
                Set List Name:
              </label>
              <input
                id="set-list-name-input"
                type="text"
                value={setListName}
                onChange={(e) => {
                  setSetListName(e.target.value)
                  setSaveModalError('')
                }}
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#000',
                  border: '2px solid #fff',
                  color: '#fff',
                  fontSize: '16px',
                  marginBottom: '10px'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveSetList()
                  } else if (e.key === 'Escape') {
                    handleCloseSaveModal()
                  }
                }}
              />
              {saveModalError && (
                <div style={{ color: '#ff0000', marginBottom: '10px', fontSize: '14px' }}>
                  {saveModalError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  className="btn"
                  onClick={handleCloseSaveModal}
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-start"
                  onClick={handleSaveSetList}
                  style={{ padding: '8px 16px' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="help-modal-overlay" onClick={handleCancelDelete}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <h2>Delete Set List</h2>
            </div>
            <div className="help-modal-content">
              <p>Are you sure you want to delete this saved set list?</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  className="btn"
                  onClick={handleCancelDelete}
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleConfirmDelete}
                  style={{ padding: '8px 16px', background: '#ff0000', borderColor: '#ff0000' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SetList
