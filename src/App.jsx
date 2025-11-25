import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// Helper functions
const secondsToMMSS = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const mmssToSeconds = (input) => {
  if (!input || input.trim() === '') return 0
  
  // Handle plain number (seconds)
  if (/^\d+$/.test(input.trim())) {
    return parseFloat(input.trim())
  }
  
  // Handle MM:SS format
  const parts = input.trim().split(':')
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0
    const seconds = parseFloat(parts[1]) || 0
    return minutes * 60 + seconds
  }
  
  // Fallback to parsing as seconds
  return parseFloat(input) || 0
}

const extractVideoId = (input) => {
  if (!input) return ''
  
  // If it's already just an ID (11 characters, alphanumeric)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim()
  }
  
  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  
  return input.trim()
}

function App() {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(10)
  const [startTimeDisplay, setStartTimeDisplay] = useState('0:00')
  const [endTimeDisplay, setEndTimeDisplay] = useState('0:10')
  const [targetLoops, setTargetLoops] = useState(5)
  const [currentLoops, setCurrentLoops] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [player, setPlayer] = useState(null)
  const [apiReady, setApiReady] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [validationError, setValidationError] = useState('')
  const [showCompletion, setShowCompletion] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const playerRef = useRef(null)
  const checkIntervalRef = useRef(null)
  const hasLoopedRef = useRef(false)
  const completionTimeoutRef = useRef(null)

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

    // If API is already loaded
    if (window.YT && window.YT.Player) {
      setApiReady(true)
    }
  }, [])

  const playerInitializedRef = useRef(false)
  const currentVideoIdRef = useRef(videoId)

  // Initialize player once when API is ready
  useEffect(() => {
    if (!apiReady || !playerRef.current || playerInitializedRef.current || player) return
    
    playerInitializedRef.current = true
    setIsLoading(true)
    currentVideoIdRef.current = videoId
    
    // Use setTimeout to ensure React has finished rendering
    const timer = setTimeout(() => {
      const container = playerRef.current
      if (!container) return
      
      try {
        const newPlayer = new window.YT.Player(container, {
          height: '390',
          width: '640',
          videoId: extractVideoId(videoId),
          playerVars: {
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              console.log('YouTube player ready')
              setPlayer(event.target)
              setIsLoading(false)
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data)
              setIsLoading(false)
              setValidationError('Failed to load video. Please check the URL or Video ID.')
              playerInitializedRef.current = false
            },
          },
        })
      } catch (error) {
        console.error('Error creating YouTube player:', error)
        setIsLoading(false)
        setValidationError('Error initializing video player.')
        playerInitializedRef.current = false
      }
    }, 200)
    
    return () => clearTimeout(timer)
  }, [apiReady])

  // Load new video when videoId changes (but player already exists)
  useEffect(() => {
    if (!player || !player.loadVideoById || videoId === currentVideoIdRef.current) return
    
    const extractedId = extractVideoId(videoId)
    if (extractedId) {
      currentVideoIdRef.current = videoId
      setIsLoading(true)
      try {
        player.loadVideoById(extractedId)
        setIsPlaying(false)
        setCurrentLoops(0)
        hasLoopedRef.current = false
        setTimeout(() => setIsLoading(false), 1000)
      } catch (error) {
        console.error('Error loading video:', error)
        setIsLoading(false)
      }
    }
  }, [videoId, player])

  // Validate times
  useEffect(() => {
    if (endTime <= startTime) {
      setValidationError('End time must be greater than start time')
    } else {
      setValidationError('')
    }
  }, [startTime, endTime])

  // Check video time and handle looping
  useEffect(() => {
    if (isPlaying && player) {
      checkIntervalRef.current = setInterval(() => {
        if (player && player.getCurrentTime) {
          const time = player.getCurrentTime()
          setCurrentTime(time)
          
          if (time >= endTime) {
            // Check if we've already looped for this cycle
            if (!hasLoopedRef.current) {
              hasLoopedRef.current = true
              
              // Increment loop count
              setCurrentLoops((prev) => {
                const newCount = prev + 1
                
                // Check if we've reached target
                if (newCount >= targetLoops) {
                  setIsPlaying(false)
                  if (player.pauseVideo) {
                    player.pauseVideo()
                  }
                  // Show completion notification
                  setShowCompletion(true)
                  if (completionTimeoutRef.current) {
                    clearTimeout(completionTimeoutRef.current)
                  }
                  completionTimeoutRef.current = setTimeout(() => {
                    setShowCompletion(false)
                  }, 3000)
                  return newCount
                }
                
                // Seek back to start time
                if (player.seekTo) {
                  player.seekTo(startTime, true)
                }
                
                return newCount
              })
            }
          } else if (time < endTime) {
            // Reset the loop flag when we're back in range
            hasLoopedRef.current = false
          }
        }
      }, 100) // Check every 100ms
    } else {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      hasLoopedRef.current = false
      if (!isPlaying) {
        setCurrentTime(0)
      }
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current)
      }
    }
  }, [isPlaying, player, startTime, endTime, targetLoops])

  const handleStart = useCallback(() => {
    if (!player || validationError || endTime <= startTime) return
    
    // Reset loop count
    setCurrentLoops(0)
    hasLoopedRef.current = false
    setShowCompletion(false)
    
    // Seek to start time and play
    player.seekTo(startTime, true)
    player.playVideo()
    setIsPlaying(true)
  }, [player, validationError, endTime, startTime])

  const handleStop = useCallback(() => {
    if (player && player.pauseVideo) {
      player.pauseVideo()
    }
    setIsPlaying(false)
  }, [player])

  const handleReset = useCallback(() => {
    if (player) {
      if (player.pauseVideo) {
        player.pauseVideo()
      }
      if (player.seekTo) {
        player.seekTo(startTime, true)
      }
    }
    setIsPlaying(false)
    setCurrentLoops(0)
    hasLoopedRef.current = false
  }, [player, startTime])

  const handleVideoIdChange = (newVideoId) => {
    setVideoId(newVideoId)
    setValidationError('')
    // Video loading will be handled by the useEffect watching videoId
  }

  // Calculate progress within loop segment
  const getLoopProgress = () => {
    if (!isPlaying || endTime <= startTime) return 0
    const progress = ((currentTime - startTime) / (endTime - startTime)) * 100
    return Math.max(0, Math.min(100, progress))
  }

  // Calculate overall loop progress percentage
  const getOverallProgress = () => {
    if (targetLoops === 0) return 0
    return Math.round((currentLoops / targetLoops) * 100)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (isPlaying) {
            handleStop()
          } else if (player && !validationError && endTime > startTime) {
            handleStart()
          }
          break
        case 'r':
        case 'R':
          e.preventDefault()
          if (player) {
            handleReset()
          }
          break
        case 'Escape':
          if (showHelp) {
            setShowHelp(false)
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isPlaying, player, validationError, startTime, endTime, showHelp, handleStart, handleStop, handleReset])

  console.log('App rendering, player:', !!player, 'apiReady:', apiReady)

  return (
    <div className="app">
      <div className="title-section">
        <h1 className="title">Vibey YouTube Loop Practice</h1>
        <button className="help-link" onClick={() => setShowHelp(true)}>
          ?
        </button>
      </div>
      <p className="subtitle">by Vibey Craft</p>
      
      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="help-modal-header">
              <h2>How to Use</h2>
              <button className="help-close" onClick={() => setShowHelp(false)}>
                ×
              </button>
            </div>
            <div className="help-content">
              <ol>
                <li>
                  <strong>Enter a YouTube video:</strong> Paste a YouTube URL or enter a Video ID in the input field at the top.
                </li>
                <li>
                  <strong>Set your loop times:</strong>
                  <ul>
                    <li><strong>Start Time:</strong> Enter the start time in MM:SS format (e.g., "0:46" for 46 seconds, "1:02" for 1 minute 2 seconds)</li>
                    <li><strong>End Time:</strong> Enter the end time in MM:SS format (e.g., "1:30" for 1 minute 30 seconds)</li>
                  </ul>
                </li>
                <li>
                  <strong>Set target loops:</strong> Enter how many times you want the video to loop between the start and end times.
                </li>
                <li>
                  <strong>Start looping:</strong> Click the green "Start Loop" button. The video will automatically:
                  <ul>
                    <li>Play from the start time</li>
                    <li>Seek back to the start when it reaches the end time</li>
                    <li>Count each completed loop</li>
                    <li>Stop automatically when the target number of loops is reached</li>
                  </ul>
                </li>
                <li>
                  <strong>Control playback:</strong>
                  <ul>
                    <li>Click "Stop" (red button) to pause the loop</li>
                    <li>Click "Reset" (blue button) to return to the start time and reset the loop counter</li>
                  </ul>
                </li>
              </ol>
              <p className="help-tip">
                <strong>Tip:</strong> You can also enter plain numbers (like "46") which will be treated as seconds.
              </p>
              <div className="help-keyboard">
                <h3>Keyboard Shortcuts</h3>
                <ul>
                  <li><strong>Spacebar:</strong> Start/Stop looping</li>
                  <li><strong>R:</strong> Reset to start time</li>
                  <li><strong>Esc:</strong> Close help modal</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="input-group">
        <label htmlFor="video-id">YouTube URL or Video ID</label>
        <input
          id="video-id"
          type="text"
          value={videoId}
          onChange={(e) => handleVideoIdChange(e.target.value)}
          placeholder="Enter YouTube URL or Video ID"
          disabled={!apiReady}
          autoFocus
        />
        {isLoading && (
          <div className="loading-indicator">Loading video...</div>
        )}
      </div>

      <div className="video-container">
        {isLoading && !player && (
          <div className="video-loading">
            <div className="spinner"></div>
            <p>Loading video...</p>
          </div>
        )}
        <div ref={playerRef} id="youtube-player-container" style={{width: '100%', height: '100%'}}></div>
      </div>

      <div className="controls-row">
        <div className="input-group">
          <label htmlFor="start-time">Start Time (MM:SS)</label>
          <input
            id="start-time"
            type="text"
            value={startTimeDisplay}
            onChange={(e) => {
              const displayValue = e.target.value
              setStartTimeDisplay(displayValue)
              const seconds = mmssToSeconds(displayValue)
              setStartTime(seconds)
            }}
            placeholder="0:00"
            disabled={isPlaying}
          />
        </div>

        <div className="input-group">
          <label htmlFor="end-time">End Time (MM:SS)</label>
          <input
            id="end-time"
            type="text"
            value={endTimeDisplay}
            onChange={(e) => {
              const displayValue = e.target.value
              setEndTimeDisplay(displayValue)
              const seconds = mmssToSeconds(displayValue)
              setEndTime(seconds)
            }}
            placeholder="0:00"
            disabled={isPlaying}
            className={validationError ? 'error' : ''}
          />
          {validationError && (
            <span className="error-message">{validationError}</span>
          )}
        </div>

        <div className="input-group">
          <label htmlFor="target-loops">Target Loops</label>
          <input
            id="target-loops"
            type="number"
            value={targetLoops}
            onChange={(e) => setTargetLoops(parseInt(e.target.value) || 1)}
            min="1"
            disabled={isPlaying}
          />
        </div>
      </div>

      {/* Progress bar */}
      {isPlaying && endTime > startTime && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getLoopProgress()}%` }}
            ></div>
          </div>
          <div className="progress-labels">
            <span>{secondsToMMSS(startTime)}</span>
            <span className="current-time">{secondsToMMSS(currentTime)}</span>
            <span>{secondsToMMSS(endTime)}</span>
          </div>
        </div>
      )}

      <div className="buttons-row">
        <button
          className="btn btn-start"
          onClick={handleStart}
          disabled={!player || isPlaying || !apiReady || !!validationError || endTime <= startTime}
        >
          Start Loop
        </button>
        <button
          className="btn btn-stop"
          onClick={handleStop}
          disabled={!isPlaying}
        >
          Stop
        </button>
        <button
          className="btn btn-reset"
          onClick={handleReset}
          disabled={!player}
        >
          Reset
        </button>
      </div>

      <div className="status">
        <div className="status-main">
          Loop {currentLoops} / {targetLoops}
          {targetLoops > 0 && (
            <span className="progress-percent"> ({getOverallProgress()}%)</span>
          )}
        </div>
        {isPlaying && (
          <div className="current-time-display">
            Current: {secondsToMMSS(currentTime)}
          </div>
        )}
      </div>

      {/* Completion notification */}
      {showCompletion && (
        <div className="completion-notification">
          <div className="completion-content">
            <span className="completion-icon">✓</span>
            <span className="completion-text">
              Completed {targetLoops} loop{targetLoops !== 1 ? 's' : ''}!
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
