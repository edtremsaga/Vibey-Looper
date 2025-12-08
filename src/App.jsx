import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  const [videoId, setVideoId] = useState('https://www.youtube.com/watch?v=u7p8bkf5hBY&list=RDu7p8bkf5hBY&start_radio=1')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(10)
  const [startTimeDisplay, setStartTimeDisplay] = useState('0:00')
  const [endTimeDisplay, setEndTimeDisplay] = useState('0:10')
  const [targetLoops, setTargetLoops] = useState(5)
  const [targetLoopsDisplay, setTargetLoopsDisplay] = useState('5')
  const [currentLoops, setCurrentLoops] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [player, setPlayer] = useState(null)
  const [apiReady, setApiReady] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [validationError, setValidationError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasBeenStopped, setHasBeenStopped] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [volume, setVolume] = useState(75) // Volume control (0-100)
  
  const playerRef = useRef(null)
  const checkIntervalRef = useRef(null)
  const hasLoopedRef = useRef(false)
  const loadingTimeoutRef = useRef(null)
  const isCheckingTimeRef = useRef(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // Check on mount
    checkMobile()
    
    // Check on resize
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
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
            setPlayer(event.target)
            setIsLoading(false)
            // Set initial playback speed and volume
            if (event.target.setPlaybackRate) {
              event.target.setPlaybackRate(playbackSpeed)
            }
            // iOS Safari doesn't support programmatic volume control
            if (!isMobile && event.target.setVolume) {
              event.target.setVolume(volume)
            }
          },
            onError: (event) => {
              setIsLoading(false)
              setValidationError('Failed to load video. Please check the URL or Video ID.')
              playerInitializedRef.current = false
            },
          },
        })
      } catch (error) {
        setIsLoading(false)
        setValidationError('Error initializing video player. Please refresh the page and try again.')
        playerInitializedRef.current = false
      }
    }, 200)
    
    return () => clearTimeout(timer)
  }, [apiReady, playbackSpeed, videoId])

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
        
        // Clear any existing timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
        }
        
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false)
          loadingTimeoutRef.current = null
        }, 1000)
      } catch (error) {
        setIsLoading(false)
        setValidationError('Error loading video. Please check the URL or Video ID and try again.')
      }
    }
    
    // Cleanup function
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
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

  // Update playback speed when it changes
  useEffect(() => {
    if (player && player.setPlaybackRate) {
      try {
        player.setPlaybackRate(playbackSpeed)
      } catch (error) {
        // Silently handle playback rate errors (may fail if video isn't ready)
        console.warn('Failed to set playback speed:', error)
      }
    }
  }, [playbackSpeed, player])

  // Update volume when it changes
  useEffect(() => {
    // iOS Safari doesn't support programmatic volume control
    // Volume must be controlled via device volume buttons on iOS
    if (isMobile) {
      return
    }
    
    if (player && player.setVolume) {
      try {
        player.setVolume(volume)
      } catch (error) {
        // Silently handle volume errors (may fail if video isn't ready)
        console.warn('Failed to set volume:', error)
      }
    }
  }, [volume, player, isMobile])

  // Check video time and handle looping
  useEffect(() => {
    if (isPlaying && player) {
      isCheckingTimeRef.current = true
      
      // Use recursive setTimeout for adaptive interval frequency
      const checkTime = () => {
        // Double-check conditions in case state changed or cleanup ran
        if (!isCheckingTimeRef.current || !isPlaying || !player || !player.getCurrentTime) {
          return
        }
        
        try {
          const time = player.getCurrentTime()
          setCurrentTime(time)
          
          // Calculate time until end to determine check frequency
          const timeUntilEnd = endTime - time
          // Use adaptive interval: check every 500ms if >5s away, 100ms if closer
          const nextCheckDelay = timeUntilEnd > 5 ? 500 : 100
          
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
                    try {
                      player.pauseVideo()
                    } catch (error) {
                      console.warn('Failed to pause video at loop completion:', error)
                    }
                  }
                  return newCount
                }
                
                // Seek back to start time and maintain playback speed
                try {
                  if (player.seekTo) {
                    player.seekTo(startTime, true)
                  }
                  if (player.setPlaybackRate) {
                    player.setPlaybackRate(playbackSpeed)
                  }
                } catch (error) {
                  console.warn('Failed to seek or set playback speed during loop:', error)
                  // Continue anyway - the loop will try again next check
                }
                
                return newCount
              })
            }
            // Schedule next check with standard interval after loop
            // Only schedule if still checking (cleanup sets isCheckingTimeRef to false)
            if (isCheckingTimeRef.current) {
              checkIntervalRef.current = setTimeout(checkTime, 100)
            }
          } else if (time < endTime) {
            // Reset the loop flag when we're back in range
            hasLoopedRef.current = false
            // Schedule next check with adaptive interval
            // Only schedule if still checking (cleanup sets isCheckingTimeRef to false)
            if (isCheckingTimeRef.current) {
              checkIntervalRef.current = setTimeout(checkTime, nextCheckDelay)
            }
          }
        } catch (error) {
          console.error('Error checking video time:', error)
          // Continue checking - don't break the loop on transient errors
          if (isCheckingTimeRef.current) {
            checkIntervalRef.current = setTimeout(checkTime, 100)
          }
        }
      }
      
      // Start the checking loop
      checkTime()
    } else {
      isCheckingTimeRef.current = false
      if (checkIntervalRef.current) {
        clearTimeout(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      hasLoopedRef.current = false
      if (!isPlaying) {
        setCurrentTime(0)
      }
    }

    return () => {
      isCheckingTimeRef.current = false
      if (checkIntervalRef.current) {
        clearTimeout(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }, [isPlaying, player, startTime, endTime, targetLoops, playbackSpeed])

  const handleStart = useCallback(() => {
    if (!player || validationError || endTime <= startTime) return
    
    try {
      // Reset loop count
      setCurrentLoops(0)
      hasLoopedRef.current = false
      setHasBeenStopped(false)
      
      // Set playback speed before starting
      if (player.setPlaybackRate) {
        try {
          player.setPlaybackRate(playbackSpeed)
        } catch (error) {
          console.warn('Failed to set playback speed:', error)
        }
      }
      
      // Seek to start time and play
      if (player.seekTo) {
        player.seekTo(startTime, true)
      }
      if (player.playVideo) {
        player.playVideo()
      }
      setIsPlaying(true)
    } catch (error) {
      console.error('Error starting video:', error)
      setValidationError('Failed to start video. Please try again.')
      setIsPlaying(false)
    }
  }, [player, validationError, endTime, startTime, playbackSpeed])

  const handleStop = useCallback(() => {
    if (!player) return
    
    try {
      // Toggle behavior: if playing, stop; if stopped, resume
      if (isPlaying) {
        // Stop/pause the video
        if (player.pauseVideo) {
          try {
            player.pauseVideo()
          } catch (error) {
            console.warn('Failed to pause video:', error)
          }
        }
        setIsPlaying(false)
        setHasBeenStopped(true)
      } else {
        // Resume playing from current position
        if (player.playVideo) {
          try {
            player.playVideo()
          } catch (error) {
            console.warn('Failed to resume video:', error)
            setValidationError('Failed to resume video. Please try again.')
            return
          }
        }
        setIsPlaying(true)
        setHasBeenStopped(false)
      }
    } catch (error) {
      console.error('Error in handleStop:', error)
      setValidationError('An error occurred. Please try again.')
    }
  }, [player, isPlaying])

  const handleReset = useCallback(() => {
    try {
      // Reset to default values
      setStartTime(0)
      setEndTime(10)
      setStartTimeDisplay('0:00')
      setEndTimeDisplay('0:10')
      setTargetLoops(5)
      setTargetLoopsDisplay('5')
      
      if (player) {
        if (player.pauseVideo) {
          try {
            player.pauseVideo()
          } catch (error) {
            console.warn('Failed to pause video on reset:', error)
          }
        }
        if (player.seekTo) {
          try {
            player.seekTo(0, true) // Seek to default start time (0)
          } catch (error) {
            console.warn('Failed to seek video on reset:', error)
            setValidationError('Failed to reset video position. Please try again.')
            return
          }
        }
      }
      setIsPlaying(false)
      setCurrentLoops(0)
      hasLoopedRef.current = false
    } catch (error) {
      console.error('Error in handleReset:', error)
      setValidationError('An error occurred while resetting. Please try again.')
    }
  }, [player])

  const handleVideoIdChange = useCallback((newVideoId) => {
    setVideoId(newVideoId)
    setValidationError('')
    // Video loading will be handled by the useEffect watching videoId
  }, [])

  const handleYouTubeSearch = useCallback(() => {
    if (searchQuery.trim()) {
      const encodedQuery = encodeURIComponent(searchQuery.trim())
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`
      window.open(youtubeSearchUrl, '_blank')
    }
  }, [searchQuery])

  const handleSearchKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleYouTubeSearch()
    }
  }, [handleYouTubeSearch])

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseInt(e.target.value, 10)
    setVolume(newVolume)
  }, [])

  const handlePlaybackSpeedChange = useCallback((e) => {
    const newSpeed = parseFloat(e.target.value)
    setPlaybackSpeed(newSpeed)
  }, [])

  // Memoize progress calculations to avoid recalculating on every render
  const loopProgress = useMemo(() => {
    if (!isPlaying || endTime <= startTime) return 0
    const progress = ((currentTime - startTime) / (endTime - startTime)) * 100
    return Math.max(0, Math.min(100, progress))
  }, [isPlaying, currentTime, startTime, endTime])

  const overallProgress = useMemo(() => {
    if (targetLoops === 0) return 0
    return Math.round((currentLoops / targetLoops) * 100)
  }, [currentLoops, targetLoops])

  // Memoize formatted time strings to avoid recalculating on every render
  const startTimeFormatted = useMemo(() => secondsToMMSS(startTime), [startTime])
  const endTimeFormatted = useMemo(() => secondsToMMSS(endTime), [endTime])
  const currentTimeFormatted = useMemo(() => secondsToMMSS(currentTime), [currentTime])

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

  return (
    <div className="app">
      <div className="title-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <h1 className="title">Music Looper</h1>
          <span className="title-byline">by Vibey Craft</span>
        </div>
      </div>
      <p className="subtitle">Loop sections of songs to perfect your practice</p>
      
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
                  <strong>Find a YouTube video:</strong>
                  <ul>
                    {!isMobile && (
                      <li>Use the search box at the top to search for songs. Click "Search on YouTube" to open results in a new tab.</li>
                    )}
                    <li>{!isMobile ? 'Or ' : ''}Paste a YouTube URL or enter a Video ID directly in the input field below.</li>
                  </ul>
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
                  <strong>Start looping:</strong> {isMobile ? 'Tap' : 'Click'} the green "Start Loop" button. The video will automatically:
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
                    <li>{isMobile ? 'Tap' : 'Click'} "Stop" (red button) to pause the loop</li>
                    <li>{isMobile ? 'Tap' : 'Click'} "Reset" (blue button) to return to the start time and reset the loop counter</li>
                    <li>Use the "Playback Speed" buttons to adjust video speed (0.5x to 2x)</li>
                  </ul>
                </li>
              </ol>
              <p className="help-tip">
                <strong>Tip:</strong> You can also enter plain numbers (like "46") which will be treated as seconds.
              </p>
              {!isMobile && (
                <div className="help-keyboard">
                  <h3>Keyboard Shortcuts</h3>
                  <ul>
                    <li><strong>Spacebar:</strong> Start/Stop looping</li>
                    <li><strong>R:</strong> Reset to start time</li>
                    <li><strong>Esc:</strong> Close help modal</li>
                  </ul>
                </div>
              )}
              <div className="help-disclaimer">
                <p style={{ fontStyle: 'italic', fontSize: '12px', color: '#999', lineHeight: '1.6', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  This site uses the YouTube IFrame Player API and streams videos directly from YouTube.<br />
                  <br />
                  No video or audio content is downloaded, stored, or redistributed by this site.<br />
                  <br />
                  All content remains subject to YouTube's Terms of Service and copyright policies.<br />
                  <br />
                  Users are responsible for using the service in compliance with YouTube's terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="search-section">
        <div className="input-group">
          <label htmlFor="search-query">Search for a song</label>
          <div className="search-input-wrapper">
            <input
              id="search-query"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Type song name or artist..."
              className="search-input"
            />
            <button
              type="button"
              className="btn btn-search"
              onClick={handleYouTubeSearch}
              disabled={!searchQuery.trim()}
            >
              Search on YouTube
            </button>
          </div>
          <p className="search-hint">Search will open in a new tab. Copy the video URL and paste it below.</p>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="video-id">URL or Video ID of song from YouTube</label>
        <input
          id="video-id"
          type="text"
          value={videoId}
          onChange={(e) => handleVideoIdChange(e.target.value)}
          placeholder="Enter URL or Video ID of song from YouTube"
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
            type="text"
            value={targetLoopsDisplay}
            onChange={(e) => {
              const value = e.target.value
              // Allow empty string or whole numbers only
              if (value === '' || /^\d+$/.test(value)) {
                setTargetLoopsDisplay(value)
                // Update the actual targetLoops value, default to 1 if empty
                const numValue = value === '' ? 1 : parseInt(value, 10)
                setTargetLoops(numValue || 1)
              }
            }}
            onBlur={(e) => {
              // If empty on blur, set to default value
              if (e.target.value === '') {
                setTargetLoopsDisplay('5')
                setTargetLoops(5)
              }
            }}
            placeholder="5"
            disabled={isPlaying}
          />
        </div>

        {!isMobile && endTime > startTime && (
          <div className="input-group loop-duration-group">
            <label>Loop Duration</label>
            <div className="loop-duration-display-box">
              {secondsToMMSS(endTime - startTime)}
            </div>
          </div>
        )}
      </div>

      {/* Volume Control Section - Above Playback Speed */}
      {!isMobile && (
        <div className="volume-control-section">
          <div className="volume-control-label">Volume</div>
          <div className="volume-control-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              id="volumeSlider"
            />
          </div>
        </div>
      )}

      <div className="speed-presets-section">
        <div className="speed-presets-container">
          <div className="speed-presets-label">Playback Speed</div>
          <div className="speed-presets-buttons">
          <button
            className={`speed-preset-btn ${playbackSpeed === 0.5 ? 'active' : ''}`}
            onClick={() => setPlaybackSpeed(0.5)}
          >
            0.5x
          </button>
          <button
            className={`speed-preset-btn ${playbackSpeed === 0.75 ? 'active' : ''}`}
            onClick={() => setPlaybackSpeed(0.75)}
          >
            0.75x
          </button>
          <button
            className={`speed-preset-btn ${playbackSpeed === 1 ? 'active' : ''}`}
            onClick={() => setPlaybackSpeed(1)}
          >
            1x
          </button>
          <button
            className={`speed-preset-btn ${playbackSpeed === 1.25 ? 'active' : ''}`}
            onClick={() => setPlaybackSpeed(1.25)}
          >
            1.25x
          </button>
          <button
            className={`speed-preset-btn ${playbackSpeed === 1.5 ? 'active' : ''}`}
            onClick={() => setPlaybackSpeed(1.5)}
          >
            1.5x
          </button>
          <button
            className={`speed-preset-btn ${playbackSpeed === 2 ? 'active' : ''}`}
            onClick={() => setPlaybackSpeed(2)}
          >
            2x
          </button>
          </div>
          {/* Playback Speed Slider - Desktop Only */}
          {!isMobile && (
            <div className="speed-slider-wrapper">
              <div className="speed-slider-label">
                {playbackSpeed.toFixed(2)}x
              </div>
              <input
                type="range"
                min="0.25"
                max="2.0"
                step="0.05"
                value={playbackSpeed}
                onChange={handlePlaybackSpeedChange}
                className="speed-slider"
                id="speedSlider"
              />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isPlaying && endTime > startTime && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${loopProgress}%` }}
            ></div>
          </div>
          <div className="progress-labels">
            <span>{startTimeFormatted}</span>
            <span className="current-time">{currentTimeFormatted}</span>
            <span>{endTimeFormatted}</span>
          </div>
        </div>
      )}

      <div className="buttons-row">
        <div className="button-row-wrapper">
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
            disabled={!player}
          >
            {isPlaying ? 'Stop' : (hasBeenStopped ? 'Resume' : 'Stop')}
          </button>
          <button
            className="btn btn-reset"
            onClick={handleReset}
            disabled={!player}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="status">
        <div className="status-main">
          Loop {currentLoops} / {targetLoops}
          {targetLoops > 0 && (
            <span className="progress-percent"> ({overallProgress}%)</span>
          )}
        </div>
        {isPlaying && (
          <div className="current-time-display">
            Current: {currentTimeFormatted}
          </div>
        )}
      </div>

          {/* Help and Feedback links at bottom */}
          <div className="help-link-bottom">
            <button className="help-link-text" onClick={() => setShowHelp(true)}>
              help
            </button>
            <span style={{ color: '#666', margin: '0 8px' }}>|</span>
            <a 
              href="mailto:vibeycraft@gmail.com?subject=Vibey Music Looper Feedback" 
              className="help-link-text"
            >
              feedback
            </a>
          </div>
        </div>
      )
    }

    export default App
