import { useState, useEffect, useRef, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import './App.css'
import { extractVideoId } from './utils/helpers.js'
import { loadSavedLoops, saveSetList, loadSetList } from './utils/storage.js'

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
  
  // Refs
  const playerRef = useRef(null)
  const playerInitializedRef = useRef(false)
  const countdownIntervalRef = useRef(null)
  const playSongAtIndexRef = useRef(null)

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

      {/* Play Set list button */}
      <div className="set-list-play-button-container">
        <button
          className="btn btn-start set-list-play-button"
          onClick={isPlaying ? handleStop : handlePlaySetList}
          disabled={setList.length === 0}
        >
          {isPlaying ? 'Stop Set List' : 'Play Set List'}
        </button>
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
    </div>
  )
}

export default SetList
