import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './App.css'
import { secondsToMMSS, mmssToSeconds, normalizeMMSS, extractVideoId, getYouTubeErrorMessage } from './utils/helpers.js'
import { saveRecentVideo, loadRecentVideos, deleteRecentVideo, saveDefaultVideo, loadDefaultVideo, clearDefaultVideo, saveSavedLoop, loadSavedLoops, deleteSavedLoop } from './utils/storage.js'
import SetList from './SetList.jsx'

// App default video (fallback)
const APP_DEFAULT_VIDEO = 'https://www.youtube.com/watch?v=u7p8bkf5hBY&list=RDu7p8bkf5hBY&start_radio=1'

// Helper function to fetch video title from YouTube oEmbed API (free, no API key needed)
// Security: Validates and sanitizes API responses to prevent XSS and data injection
const fetchVideoTitle = async (videoId) => {
  try {
    // Validate videoId before making request (security: prevent invalid API calls)
    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null
    }
    
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    
    // Security: Add timeout to prevent hanging requests (5 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) return null
    
    // Security: Validate content type to ensure we're getting JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Invalid content type from YouTube API:', contentType)
      return null
    }
    
    const data = await response.json()
    
    // Security: Validate response structure before accessing properties
    if (!data || typeof data !== 'object') {
      return null
    }
    
    // Security: Sanitize and validate each field with length limits
    // Title: max 200 characters, default to empty string if invalid
    const title = typeof data.title === 'string' && data.title.length > 0 && data.title.length <= 200
      ? data.title.substring(0, 200)
      : ''
    
    // Author: max 100 characters, optional field (default to empty string)
    const author = typeof data.author_name === 'string' && data.author_name.length > 0 && data.author_name.length <= 100
      ? data.author_name.substring(0, 100)
      : ''
    
    // Thumbnail: must be valid HTTPS URL, max 500 characters
    let thumbnail = ''
    if (typeof data.thumbnail_url === 'string' && 
        data.thumbnail_url.length > 0 && 
        data.thumbnail_url.length <= 500 &&
        data.thumbnail_url.startsWith('https://')) {
      thumbnail = data.thumbnail_url.substring(0, 500)
    }
    
    // Return object with validated and sanitized data
    return {
      title,
      author,
      thumbnail
    }
  } catch (error) {
    // Handle abort (timeout) and other errors gracefully
    if (error.name === 'AbortError') {
      console.warn('YouTube API request timed out')
    } else {
      console.warn('Failed to fetch video title:', error)
    }
    return null
  }
}

function App() {
  // Load user's default video on mount, or use app default
  const [videoId, setVideoId] = useState(() => {
    const userDefault = loadDefaultVideo()
    return userDefault ? userDefault.url : APP_DEFAULT_VIDEO
  })
  const [userDefaultVideo, setUserDefaultVideo] = useState(null)
  const [isDefaultVideo, setIsDefaultVideo] = useState(false)
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
  const [videoDuration, setVideoDuration] = useState(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoThumbnail, setVideoThumbnail] = useState('')
  const [videoAuthor, setVideoAuthor] = useState('')
  const [recentVideos, setRecentVideos] = useState([])
  const [showRecentVideos, setShowRecentVideos] = useState(false)
  const [savedLoops, setSavedLoops] = useState([])
  const [showSavedLoops, setShowSavedLoops] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type: 'recent' | 'saved', id: string, title: string }
  const [showSetListPage, setShowSetListPage] = useState(false)
  
  const playerRef = useRef(null)
  const checkIntervalRef = useRef(null)
  const hasLoopedRef = useRef(false)
  const loadingTimeoutRef = useRef(null)
  const isCheckingTimeRef = useRef(false)
  const loadingFromSavedLoopRef = useRef(null) // Track start time when loading from saved loop
  const loadingFromRecentVideoRef = useRef(false) // Track when loading from recent video
  const previousShowSetListPageRef = useRef(false) // Track previous Set List page state
  const lastAutoSetEndTimeVideoIdRef = useRef(null) // Track which video ID we've auto-set endTime for
  const videoDurationVideoIdRef = useRef(null) // Track which videoId the current videoDuration belongs to

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      // Multiple detection methods for reliability
      const viewportWidth = window.innerWidth
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      
      // Consider mobile if:
      // 1. Viewport <= 768px, OR
      // 2. Has touch capability AND viewport <= 1024px, OR
      // 3. User agent indicates mobile device
      const isMobileDevice = viewportWidth <= 768 || 
                            (hasTouch && viewportWidth <= 1024) || 
                            isMobileUA
      
      setIsMobile(isMobileDevice)
    }
    
    // Check on mount
    checkMobile()
    
    // Check on resize
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Helper to detect if device is iPhone (not iPad or MacBook)
  const isIPhone = useMemo(() => {
    if (typeof window === 'undefined') return false
    const userAgent = window.navigator.userAgent.toLowerCase()
    // Check if it's specifically an iPhone (not iPad)
    const isIPhoneDevice = /iphone/.test(userAgent) && !/ipad/.test(userAgent)
    return isIPhoneDevice
  }, [])

  // Handle Delete key to clear entire input (iPad and MacBook only, not iPhone)
  const handleInputKeyDown = useCallback((e, setValue) => {
    // Only work on iPad and MacBook, not iPhone
    if (isIPhone) return
    
    // Check for Delete key (on Mac, the Delete key sends "Backspace")
    if ((e.key === 'Delete' || e.key === 'Backspace') && e.target === document.activeElement) {
      const input = e.target
      const allSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length
      const cursorAtStart = input.selectionStart === 0 && input.selectionEnd === 0
      const hasModifier = e.metaKey || e.ctrlKey || e.altKey // Cmd, Ctrl, or Option
      
      // Clear entire input if:
      // 1. All text is selected, OR
      // 2. Cursor is at start and Delete is pressed, OR  
      // 3. Modifier key is held with Delete
      if (input.value && (allSelected || (cursorAtStart && e.key === 'Backspace') || hasModifier)) {
        e.preventDefault()
        setValue('')
        input.focus() // Keep focus on the input
      }
    }
  }, [isIPhone])

  // Load recent videos on mount
  useEffect(() => {
    setRecentVideos(loadRecentVideos())
  }, [])

  // Load saved loops on mount
  useEffect(() => {
    setSavedLoops(loadSavedLoops())
  }, [])

  // Load user's default video on mount
  useEffect(() => {
    const defaultVideo = loadDefaultVideo()
    setUserDefaultVideo(defaultVideo)
  }, [])

  // Check if current video is the default
  useEffect(() => {
    const currentVideoId = extractVideoId(videoId)
    if (userDefaultVideo && currentVideoId === userDefaultVideo.videoId) {
      setIsDefaultVideo(true)
    } else {
      setIsDefaultVideo(false)
    }
  }, [videoId, userDefaultVideo])

  // Reset main page state when returning from Set List page
  // This ensures the page is in a fresh state, as if the app just loaded
  useEffect(() => {
    // Check if we're transitioning from Set List page back to main page
    const wasOnSetList = previousShowSetListPageRef.current === true
    const isReturningFromSetList = wasOnSetList && !showSetListPage
    
    if (isReturningFromSetList) {
      // Reset all state to initial values
      const defaultVideo = loadDefaultVideo()
      const initialVideoId = defaultVideo ? defaultVideo.url : APP_DEFAULT_VIDEO
      
      setVideoId(initialVideoId)
      setStartTime(0)
      setStartTimeDisplay('0:00')
      setEndTime(10)
      setEndTimeDisplay('0:10')
      setTargetLoops(5)
      setTargetLoopsDisplay('5')
      setCurrentLoops(0)
      setIsPlaying(false)
      setHasBeenStopped(false)
      setPlaybackSpeed(1)
      setValidationError('')
      setCurrentTime(0)
      setVideoDuration(null)
      setPlayer(null)
      
      // Reset refs
      playerInitializedRef.current = false
      hasLoopedRef.current = false
      loadingFromSavedLoopRef.current = null
      loadingFromRecentVideoRef.current = false
      lastAutoSetEndTimeVideoIdRef.current = null
      
      // Reset video info - will be fetched when player initializes with default video
      const defaultVideoId = extractVideoId(initialVideoId)
      if (defaultVideoId && defaultVideoId.length === 11) {
        // Try to get video info from recent videos first
        const recentVideos = loadRecentVideos()
        const existingVideo = recentVideos.find(v => v.videoId === defaultVideoId)
        if (existingVideo) {
          setVideoTitle(existingVideo.title || '')
          setVideoThumbnail(existingVideo.thumbnail || '')
          setVideoAuthor(existingVideo.author || '')
        } else {
          // Clear and let the player initialization fetch it
          setVideoTitle('')
          setVideoThumbnail('')
          setVideoAuthor('')
        }
      }
    } else if (showSetListPage) {
      // When going to Set List, clear player state
      setPlayer(null)
      playerInitializedRef.current = false
    }
    
    // Update the previous state ref
    previousShowSetListPageRef.current = showSetListPage
  }, [showSetListPage])

  // Fetch default video info on mount and save to recent videos
  useEffect(() => {
    const defaultVideoId = extractVideoId(videoId)
    if (defaultVideoId && defaultVideoId.length === 11) {
      // Check if default video is already in recent videos
      const currentRecent = loadRecentVideos()
      const isAlreadyInRecent = currentRecent.some(v => v.videoId === defaultVideoId)
      
      if (!isAlreadyInRecent) {
        // Fetch video info and save to recent videos
        fetchVideoTitle(defaultVideoId).then(videoInfo => {
          if (videoInfo) {
            const updated = saveRecentVideo(
              defaultVideoId,
              videoInfo.title,
              videoInfo.author,
              videoInfo.thumbnail
            )
            setRecentVideos(updated)
            setVideoTitle(videoInfo.title)
            setVideoThumbnail(videoInfo.thumbnail)
            setVideoAuthor(videoInfo.author)
          } else {
            // Save with placeholder if fetch fails
            const updated = saveRecentVideo(defaultVideoId, `Video ${defaultVideoId}`, '', '')
            setRecentVideos(updated)
          }
        }).catch(() => {
          // Save with placeholder on error
          const updated = saveRecentVideo(defaultVideoId, `Video ${defaultVideoId}`, '', '')
          setRecentVideos(updated)
        })
      } else {
        // Video already in recent, just set the state from existing data
        const existingVideo = currentRecent.find(v => v.videoId === defaultVideoId)
        if (existingVideo) {
          setVideoTitle(existingVideo.title || '')
          setVideoThumbnail(existingVideo.thumbnail || '')
          setVideoAuthor(existingVideo.author || '')
        }
      }
    }
  }, []) // Only run on mount

  // Update video info when videoId changes
  useEffect(() => {
    const extractedId = extractVideoId(videoId)
    if (extractedId && extractedId.length === 11) {
      // Fetch video info when videoId changes
      fetchVideoTitle(extractedId).then(videoInfo => {
        if (videoInfo) {
          setVideoTitle(videoInfo.title)
          setVideoThumbnail(videoInfo.thumbnail)
          setVideoAuthor(videoInfo.author)
        } else {
          // Clear if fetch fails
          setVideoTitle('')
          setVideoThumbnail('')
          setVideoAuthor('')
        }
      }).catch(() => {
        // Clear on error
        setVideoTitle('')
        setVideoThumbnail('')
        setVideoAuthor('')
      })
    } else {
      // Clear if invalid video ID
      setVideoTitle('')
      setVideoThumbnail('')
      setVideoAuthor('')
    }
    setVideoDuration(null)
  }, [videoId])

  // Close recent videos dropdown when clicking outside
  useEffect(() => {
    if (!showRecentVideos) return

    const handleClickOutside = (event) => {
      if (!event.target.closest('.recent-videos-wrapper')) {
        setShowRecentVideos(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showRecentVideos])

  // Close saved loops dropdown when clicking outside
  useEffect(() => {
    if (!showSavedLoops) return

    const handleClickOutside = (event) => {
      if (!event.target.closest('.saved-loops-wrapper')) {
        setShowSavedLoops(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSavedLoops])

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
          onReady: async (event) => {
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
            
            // Get video duration (may not be available immediately)
            setTimeout(() => {
              try {
                const duration = event.target.getDuration()
                if (duration && duration > 0) {
                  const extractedId = extractVideoId(videoId)
                  if (extractedId && extractedId.length === 11) {
                    setVideoDuration(duration)
                    videoDurationVideoIdRef.current = extractedId // Track which video this duration belongs to
                  }
                }
              } catch (error) {
                // Duration not available yet, will be fetched by useEffect
                console.warn('Duration not available yet')
              }
            }, 500)
            
            // Fetch and save video info to recent videos
            const extractedId = extractVideoId(videoId)
            if (extractedId && extractedId.length === 11) {
              // Fetch video info asynchronously
              fetchVideoTitle(extractedId).then(videoInfo => {
                if (videoInfo) {
                  const updated = saveRecentVideo(
                    extractedId, 
                    videoInfo.title, 
                    videoInfo.author, 
                    videoInfo.thumbnail
                  )
                  setRecentVideos(updated)
                  setVideoTitle(videoInfo.title)
                  setVideoThumbnail(videoInfo.thumbnail)
                  setVideoAuthor(videoInfo.author)
                } else {
                  // Fallback if fetch fails
                  const updated = saveRecentVideo(extractedId, `Video ${extractedId}`, '', '')
                  setRecentVideos(updated)
                }
              }).catch(() => {
                // Fallback on error
                const updated = saveRecentVideo(extractedId, `Video ${extractedId}`, '', '')
                setRecentVideos(updated)
              })
            }
          },
          onStateChange: (event) => {
            // Sync isPlaying state with actual player state
            // State: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            if (event.data === 1) {
              // Video is playing
              setIsPlaying(true)
            } else if (event.data === 2) {
              // Video is paused
              setIsPlaying(false)
            }
            
            // When video is cued (state 5), it's ready and showing thumbnail
            // If we're loading from a saved loop, seek to the start time
            // Note: cueVideoById doesn't auto-play, so we don't need to pause
            if (event.data === 5 && loadingFromSavedLoopRef.current !== null) {
              const startTime = loadingFromSavedLoopRef.current
              if (event.target && event.target.seekTo) {
                try {
                  // Seek to start time - video is already paused from cueVideoById
                  event.target.seekTo(startTime, true)
                  loadingFromSavedLoopRef.current = null // Clear flag after successful seek
                  setIsPlaying(false) // Ensure state reflects paused
                } catch (error) {
                  console.warn('Failed to seek to saved loop start time:', error)
                  // Keep flag set, will retry on next state change or timeout
                }
              }
            }
            
            // When video starts playing or buffering, it means it loaded successfully
            if (event.data === 1 || event.data === 3) {
              // Use currentVideoIdRef to get the most current video ID
              const currentId = currentVideoIdRef.current
              const extractedId = extractVideoId(currentId)
              if (extractedId && extractedId.length === 11) {
                // Check if we already have this video in recent (to avoid duplicate fetches)
                const currentRecent = loadRecentVideos()
                const existingVideo = currentRecent.find(v => v.videoId === extractedId)
                
                if (!existingVideo || !existingVideo.title || existingVideo.title.startsWith('Video ')) {
                  // Fetch video info if we don't have it or only have placeholder
                  fetchVideoTitle(extractedId).then(videoInfo => {
                    if (videoInfo) {
                      const updated = saveRecentVideo(
                        extractedId, 
                        videoInfo.title, 
                        videoInfo.author, 
                        videoInfo.thumbnail
                      )
                      setRecentVideos(updated)
                      setVideoTitle(videoInfo.title)
                      setVideoThumbnail(videoInfo.thumbnail)
                      setVideoAuthor(videoInfo.author)
                    }
                  }).catch(() => {
                    // Silently fail - video will be saved with placeholder
                  })
                }
              }
            }
          },
            onError: (event) => {
              setIsLoading(false)
              const errorCode = event.data
              const errorMessage = getYouTubeErrorMessage(errorCode)
              setValidationError(errorMessage)
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
  // Use cueVideoById for all video loads to consistently show thumbnail without auto-play
  useEffect(() => {
    if (!player || videoId === currentVideoIdRef.current) return
    
    const extractedId = extractVideoId(videoId)
    if (extractedId) {
      const isLoadingFromSavedLoop = loadingFromSavedLoopRef.current !== null
      const isLoadingFromRecentVideo = loadingFromRecentVideoRef.current === true
      
      // Use cueVideoById for all video loads to show thumbnail without auto-play
      // Fallback to loadVideoById if cueVideoById is not available
      const loadMethod = player.cueVideoById || player.loadVideoById
      
      if (!loadMethod) return
      
      currentVideoIdRef.current = videoId
      setIsLoading(true)
      try {
        // Use cueVideoById for all loads (shows thumbnail, no auto-play)
        if (player.cueVideoById) {
          player.cueVideoById(extractedId)
        } else {
          // Fallback to loadVideoById if cueVideoById not available
          player.loadVideoById(extractedId)
          // Pause immediately if using loadVideoById fallback
          if (player.pauseVideo) {
            try {
              player.pauseVideo()
            } catch (error) {
              // Ignore if player not ready yet
            }
          }
        }
        
        setIsPlaying(false)
        setCurrentLoops(0)
        hasLoopedRef.current = false
        
        // Clear any existing timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
        }
        
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false)
          
          // Clear recent video flag after loading
          if (isLoadingFromRecentVideo) {
            loadingFromRecentVideoRef.current = false
          }
          
          // For saved loops, seek to start time after video is cued
          // (cueVideoById doesn't auto-play, so we just need to seek)
          if (isLoadingFromSavedLoop && player && player.seekTo) {
            const startTime = loadingFromSavedLoopRef.current
            if (startTime !== null) {
              try {
                player.seekTo(startTime, true)
                loadingFromSavedLoopRef.current = null // Clear flag after seeking
              } catch (error) {
                console.warn('Failed to seek to saved loop start time in timeout:', error)
                // Keep flag set, onStateChange will retry
              }
            }
          }
          
          // Fetch and save video info to recent videos after successful load
          if (extractedId && extractedId.length === 11) {
            fetchVideoTitle(extractedId).then(videoInfo => {
              if (videoInfo) {
                const updated = saveRecentVideo(
                  extractedId, 
                  videoInfo.title, 
                  videoInfo.author, 
                  videoInfo.thumbnail
                )
                setRecentVideos(updated)
                setVideoTitle(videoInfo.title)
                setVideoThumbnail(videoInfo.thumbnail)
                setVideoAuthor(videoInfo.author)
              } else {
                // Fallback if fetch fails
                const updated = saveRecentVideo(extractedId, `Video ${extractedId}`, '', '')
                setRecentVideos(updated)
              }
            }).catch(() => {
              // Fallback on error
              const updated = saveRecentVideo(extractedId, `Video ${extractedId}`, '', '')
              setRecentVideos(updated)
            })
          }
          loadingTimeoutRef.current = null
        }, 1000)
      } catch (error) {
        setIsLoading(false)
        setValidationError('Error loading video. Please check the URL or Video ID and try again.')
        // Clear flags on error
        loadingFromRecentVideoRef.current = false
      }
    }
  }, [apiReady, playbackSpeed, videoId])

  // Get video duration when player is ready and video is loaded
  useEffect(() => {
    if (!player || !player.getDuration) return

    const getDuration = () => {
      try {
        const duration = player.getDuration()
        if (duration && duration > 0 && !isNaN(duration)) {
          const extractedId = extractVideoId(videoId)
          if (extractedId && extractedId.length === 11) {
            setVideoDuration(duration)
            videoDurationVideoIdRef.current = extractedId // Track which video this duration belongs to
          }
        } else {
          // Duration might not be available immediately, try again
          setTimeout(() => {
            if (player && player.getDuration) {
              try {
                const dur = player.getDuration()
                if (dur && dur > 0 && !isNaN(dur)) {
                  const extractedId = extractVideoId(videoId)
                  if (extractedId && extractedId.length === 11) {
                    setVideoDuration(dur)
                    videoDurationVideoIdRef.current = extractedId // Track which video this duration belongs to
                  }
                }
              } catch (e) {
                // Duration still not available
              }
            }
          }, 1000)
        }
      } catch (error) {
        // Duration not available yet, will retry
      }
    }

    // Try to get duration after a short delay to ensure video is loaded
    const timer = setTimeout(getDuration, 500)
    return () => clearTimeout(timer)
  }, [player, videoId])

  // Auto-set endTime to video duration when a new video loads
  // This runs after videoDuration becomes available
  useEffect(() => {
    // Skip if:
    // - No video duration available yet
    // - Loading from a saved loop (preserve saved times)
    // - Already auto-set endTime for this video
    // - videoDuration doesn't belong to the current video (prevents using stale duration)
    if (!videoDuration || videoDuration <= 0) return
    if (loadingFromSavedLoopRef.current !== null) return
    
    const currentVideoId = extractVideoId(videoId)
    if (!currentVideoId || currentVideoId.length !== 11) return
    
    // Only use videoDuration if it belongs to the current video
    // This prevents using stale duration from a previous video
    if (videoDurationVideoIdRef.current !== currentVideoId) return
    
    if (lastAutoSetEndTimeVideoIdRef.current === currentVideoId) return
    
    // Auto-set endTime to video duration
    setEndTime(videoDuration)
    setEndTimeDisplay(secondsToMMSS(videoDuration))
    
    // Track that we've auto-set for this video
    lastAutoSetEndTimeVideoIdRef.current = currentVideoId
  }, [videoDuration, videoId])

  // Validate times
  // Security: Validates time inputs against video duration and prevents invalid ranges
  useEffect(() => {
    // Check basic range validation
    if (endTime <= startTime) {
      setValidationError('End time must be greater than start time')
      return
    }
    
    // Check against video duration if available
    if (videoDuration && videoDuration > 0) {
      if (startTime >= videoDuration) {
        setValidationError(`Start time must be less than video duration (${secondsToMMSS(videoDuration)})`)
        return
      }
      if (endTime > videoDuration) {
        setValidationError(`End time cannot exceed video duration (${secondsToMMSS(videoDuration)})`)
        return
      }
    }
    
    // Clear validation errors if all checks pass
    // Only clear time validation errors, not YouTube errors
    setValidationError((prevError) => {
      if (prevError && (
        prevError === 'End time must be greater than start time' ||
        prevError.includes('video duration')
      )) {
        return ''
      }
      return prevError
    })
  }, [startTime, endTime, videoDuration])

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
      // Check actual player state to handle cases where video auto-plays
      // but isPlaying state hasn't been updated yet
      let actualPlayerState = null
      try {
        actualPlayerState = player.getPlayerState ? player.getPlayerState() : null
      } catch (error) {
        // If we can't get player state, fall back to isPlaying state
      }
      
      // Player state: 1 = playing, 2 = paused, 3 = buffering
      // If video is actually playing (state 1 or 3), pause it
      // Otherwise, resume it
      const isActuallyPlaying = actualPlayerState === 1 || actualPlayerState === 3 || (actualPlayerState === null && isPlaying)
      
      if (isActuallyPlaying) {
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
    setShowRecentVideos(false)
    
    // Reset start time to beginning of video when new URL is loaded
    setStartTime(0)
    setStartTimeDisplay('0:00')
    
    // Clear the auto-set tracking so endTime can be set to duration when available
    lastAutoSetEndTimeVideoIdRef.current = null
    
    // Video loading will be handled by the useEffect watching videoId
  }, [])

  const handleRecentVideoSelect = useCallback((recentVideo) => {
    const url = `https://www.youtube.com/watch?v=${recentVideo.videoId}`
    
    // Track that we're loading from recent video (for cueVideoById)
    loadingFromRecentVideoRef.current = true
    
    setVideoId(url)
    setVideoTitle(recentVideo.title || '')
    setValidationError('')
    setShowRecentVideos(false)
    
    // Reset button states to default
    setIsPlaying(false)
    setHasBeenStopped(false)
    setCurrentLoops(0)
    hasLoopedRef.current = false
    
    // Reset start time to beginning of video
    setStartTime(0)
    setStartTimeDisplay('0:00')
    
    // Reset end time temporarily to 10 seconds (will be updated to video duration when available)
    setEndTime(10)
    setEndTimeDisplay('0:10')
    
    // Clear the auto-set tracking so endTime can be set to duration when available
    lastAutoSetEndTimeVideoIdRef.current = null
    
    // Note: Don't pause here - let cueVideoById handle it (shows thumbnail without auto-play)
  }, [])

  // Handler to delete a recent video
  const handleDeleteRecentVideo = useCallback((videoId, videoTitle) => {
    // Check if this is the default video
    if (userDefaultVideo && userDefaultVideo.videoId === videoId) {
      setValidationError('Cannot delete the default video. Remove it as default first.')
      return
    }
    
    // Show confirmation dialog
    setDeleteConfirm({
      type: 'recent',
      id: videoId,
      title: videoTitle || `Video ${videoId}`
    })
  }, [userDefaultVideo])

  // Handler to delete a saved loop
  const handleDeleteSavedLoop = useCallback((loopId, loopTitle) => {
    // Show confirmation dialog
    setDeleteConfirm({
      type: 'saved',
      id: loopId,
      title: loopTitle || 'Saved loop'
    })
  }, [])

  // Handler to confirm deletion
  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirm) return
    
    if (deleteConfirm.type === 'recent') {
      const updated = deleteRecentVideo(deleteConfirm.id)
      setRecentVideos(updated)
    } else if (deleteConfirm.type === 'saved') {
      const updated = deleteSavedLoop(deleteConfirm.id)
      setSavedLoops(updated)
    }
    
    setDeleteConfirm(null)
  }, [deleteConfirm])

  // Handler to cancel deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm(null)
  }, [])

  const handleSetAsDefault = useCallback(async () => {
    const extractedId = extractVideoId(videoId)
    if (!extractedId || extractedId.length !== 11) {
      setValidationError('Please load a valid video first')
      return
    }
    
    // Use existing video info if available, otherwise fetch it
    let videoInfo = { 
      title: videoTitle || '', 
      author: videoAuthor || '', 
      thumbnail: videoThumbnail || '' 
    }
    
    // Fetch video info if we don't have it or only have placeholder
    if (!videoInfo.title || videoInfo.title.startsWith('Video ')) {
      const fetched = await fetchVideoTitle(extractedId)
      if (fetched) {
        videoInfo = fetched
        setVideoTitle(fetched.title)
        setVideoAuthor(fetched.author)
        setVideoThumbnail(fetched.thumbnail)
      }
    }
    
    // Save as default
    const saved = saveDefaultVideo(
      videoId,
      videoInfo.title || `Video ${extractedId}`,
      videoInfo.author || '',
      videoInfo.thumbnail || ''
    )
    
    if (saved) {
      setUserDefaultVideo(saved)
      setIsDefaultVideo(true)
      // Show brief confirmation (you could add a toast notification here)
      setValidationError('') // Clear any errors
    }
  }, [videoId, videoTitle, videoAuthor, videoThumbnail])

  const handleClearDefault = useCallback(() => {
    // Reset to app default if current video was the user default
    const currentVideoId = extractVideoId(videoId)
    if (userDefaultVideo && currentVideoId === userDefaultVideo.videoId) {
      setVideoId(APP_DEFAULT_VIDEO)
    }
    clearDefaultVideo()
    setUserDefaultVideo(null)
    setIsDefaultVideo(false)
  }, [videoId, userDefaultVideo])

  // Handler to save current loop configuration
  const handleSaveLoop = useCallback(() => {
    const extractedId = extractVideoId(videoId)
    if (!extractedId || extractedId.length !== 11) {
      setValidationError('Invalid video. Please load a valid YouTube video first.')
      return
    }

    if (endTime <= startTime) {
      setValidationError('End time must be greater than start time.')
      return
    }

    // Get video info (use current state or fetch if needed)
    const videoInfo = {
      title: videoTitle || `Video ${extractedId}`,
      author: videoAuthor || '',
      thumbnail: videoThumbnail || ''
    }

    // Save the loop
    const saved = saveSavedLoop(
      videoId,
      startTime,
      endTime,
      targetLoops,
      playbackSpeed,
      videoInfo.title,
      videoInfo.author,
      videoInfo.thumbnail
    )

    if (saved) {
      // Reload saved loops to update UI
      setSavedLoops(loadSavedLoops())
      setValidationError('') // Clear any errors
      // Could show a success message here
    } else {
      setValidationError('Failed to save loop. Please try again.')
    }
  }, [videoId, startTime, endTime, targetLoops, playbackSpeed, videoTitle, videoAuthor, videoThumbnail])

  // Handler to load a saved loop
  // Works exactly like handleRecentVideoSelect - just changes videoId and lets normal flow handle it
  const handleLoadSavedLoop = useCallback((savedLoop) => {
    // Reset button states to default
    setIsPlaying(false)
    setHasBeenStopped(false)
    setCurrentLoops(0)
    hasLoopedRef.current = false
    
    // Set video (only if it's different from current video)
    // This works exactly like recent videos - just change videoId and let useEffect handle loading
    const currentVideoId = extractVideoId(videoId)
    const savedVideoId = extractVideoId(savedLoop.url)
    const isSameVideo = currentVideoId === savedVideoId
    
    // Set times (convert to display format) FIRST, before loading video
    setStartTime(savedLoop.startTime)
    setStartTimeDisplay(secondsToMMSS(savedLoop.startTime))
    setEndTime(savedLoop.endTime)
    setEndTimeDisplay(secondsToMMSS(savedLoop.endTime))
    
    // Set target loops
    setTargetLoops(savedLoop.targetLoops)
    setTargetLoopsDisplay(savedLoop.targetLoops.toString())
    
    // Set playback speed
    setPlaybackSpeed(savedLoop.playbackSpeed || 1)
    
    // Track that we're loading from saved loop - store start time for seeking
    loadingFromSavedLoopRef.current = savedLoop.startTime
    
    // Close dropdown
    setShowSavedLoops(false)
    
    // Clear any errors
    setValidationError('')
    
    // If same video and player is ready, seek to start time and pause immediately
    if (isSameVideo && player) {
      try {
        // Pause first to stop any auto-play
        if (player.pauseVideo) {
          player.pauseVideo()
        }
        // Then seek to start time
        if (player.seekTo) {
          player.seekTo(savedLoop.startTime, true)
        }
        loadingFromSavedLoopRef.current = null // Clear flag after seeking
      } catch (error) {
        // If seek fails, keep flag set so onStateChange can retry
        console.warn('Failed to seek to start time immediately:', error)
      }
    } else if (!isSameVideo) {
      // For new video, set videoId - loading will be handled by useEffect
      setVideoId(savedLoop.url)
      // Video loading will be handled by the useEffect watching videoId
    }
    
    // Note: Video loads but doesn't auto-play
    // User must click "Start Loop" button to begin looping with new settings
  }, [videoId, player])

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

  const handleSetFromCurrentPosition = useCallback((type) => {
    if (!player || !player.getCurrentTime) {
      return
    }
    
    try {
      const currentTime = player.getCurrentTime()
      const formatted = secondsToMMSS(currentTime)
      
      if (type === 'start') {
        setStartTimeDisplay(formatted)
        setStartTime(currentTime)
      } else {
        setEndTimeDisplay(formatted)
        setEndTime(currentTime)
      }
    } catch (error) {
      console.warn('Failed to get current time:', error)
    }
  }, [player])

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
            // Pause the loop
            handleStop()
          } else if (hasBeenStopped && player) {
            // Resume from current position
            handleStop()
          } else if (player && !validationError && endTime > startTime) {
            // Start fresh loop from beginning
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
  }, [isPlaying, hasBeenStopped, player, validationError, startTime, endTime, showHelp, handleStart, handleStop, handleReset])

  return (
    <>
      {showSetListPage ? (
        <SetList 
          onBack={() => setShowSetListPage(false)}
          savedLoops={savedLoops}
        />
      ) : (
    <>
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Live region for status updates */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isPlaying && `Loop ${currentLoops} of ${targetLoops} completed. ${overallProgress}% complete.`}
      </div>
      
      {/* Live region for errors */}
      {validationError && (
        <div 
          role="alert" 
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          Error: {validationError}
        </div>
      )}
      
      {/* Live region for loading states */}
      {isLoading && (
        <div 
          role="status" 
          aria-live="polite"
          aria-busy="true"
          className="sr-only"
        >
          Loading video...
        </div>
      )}
      
      <div className="app" id="main-content">
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
              <button 
                className="help-close" 
                onClick={() => setShowHelp(false)}
                aria-label="Close help dialog"
              >
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
                    <li>Paste a YouTube URL or enter a Video ID directly in the input field below.</li>
                  </ul>
                </li>
                <li>
                  <strong>Set your loop times:</strong>
                  <ul>
                    <li><strong>Start Time:</strong> Enter the start time in MM:SS format (e.g., "0:46" for 46 seconds, "1:02" for 1 minute 2 seconds), or {isMobile ? 'tap' : 'click'} the "Set" button next to the input to capture the current video playback time as the start time</li>
                    <li><strong>End Time:</strong> Enter the end time in MM:SS format (e.g., "1:30" for 1 minute 30 seconds), or {isMobile ? 'tap' : 'click'} the "Set" button next to the input to capture the current video playback time as the end time</li>
                    <li>To use the "Set" buttons: Play the video to the desired time, then {isMobile ? 'tap' : 'click'} the "Set" button to capture that time in the start time or end time.</li>
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
                    <li>{isMobile ? 'Tap' : 'Click'} "Stop Loop" (red button) to pause the loop</li>
                    <li>{isMobile ? 'Tap' : 'Click'} "Reset Loop" (blue button) to return to the start time and reset the loop counter</li>
                    <li>Use the "Playback Speed" buttons to adjust video speed (0.5x to 2x)</li>
                  </ul>
                </li>
                <li>
                  <strong>Recent Videos:</strong>
                  <ul>
                    <li>The app automatically saves videos you've loaded in the "Recent" dropdown</li>
                    <li>{isMobile ? 'Tap' : 'Click'} the "Recent" button to see your recently viewed videos</li>
                    <li>{isMobile ? 'Tap' : 'Click'} any video in the recent list to load it instantly</li>
                    <li>{isMobile ? 'Tap' : 'Click'} the red X on any video to remove it from your recent list</li>
                    {isMobile && (
                      <li>On mobile, the recent videos list appears as a bottom sheet with improved touch targets</li>
                    )}
                  </ul>
                </li>
                <li>
                  <strong>Save Loops:</strong>
                  <ul>
                    <li>After setting your start time, end time, and target loops, {isMobile ? 'tap' : 'click'} the "Save Loop" button to save the settings for looping that song again</li>
                    <li>The saved loop will use the video's title and store the settings for the loop</li>
                    <li>Access your saved loops anytime by {isMobile ? 'tapping' : 'clicking'} the "Saved Loops" button</li>
                    <li>{isMobile ? 'Tap' : 'Click'} any saved loop to instantly load the video and restore all the saved settings for the loop</li>
                    <li>{isMobile ? 'Tap' : 'Click'} the red X on any saved loop to delete it</li>
                    {isMobile && (
                      <li>On mobile, the saved loops list appears as a bottom sheet with improved touch targets and spacing</li>
                    )}
                  </ul>
                </li>
                {!isMobile && (
                  <li>
                    <strong>Set List (Desktop Only):</strong>
                    <ul>
                      <li>Create a playlist of multiple songs to play in sequence</li>
                      <li>{isMobile ? 'Tap' : 'Click'} the "set list" link below the loop counter to open the Set List page</li>
                      <li>Drag songs from your "Saved Loops" column to the "Set List" column to add them to your playlist</li>
                      <li>Drag songs within the Set List column to reorder them</li>
                      <li>Each song in the set list is numbered (1, 2, 3...) showing the play order</li>
                      <li>{isMobile ? 'Tap' : 'Click'} the "X" button on any song to remove it from the set list</li>
                      <li>{isMobile ? 'Tap' : 'Click'} "Play Set List" to play all songs in order with a 5-second pause between songs</li>
                      <li>During playback, you'll see a countdown showing when the next song will start</li>
                      <li>After the last song, you'll see a "Set list complete" message</li>
                      <li><strong>Save Set List:</strong> {isMobile ? 'Tap' : 'Click'} "Save Set List" to save your current set list with a custom name (max 50 characters)</li>
                      <li><strong>Load Saved Set Lists:</strong> {isMobile ? 'Tap' : 'Click'} "Saved Set Lists" to see all your saved set lists and load one to replace your current set list</li>
                      <li><strong>Delete Saved Set Lists:</strong> {isMobile ? 'Tap' : 'Click'} the red X next to any saved set list to delete it (with confirmation)</li>
                      <li>Set lists are saved in your browser's local storage and will persist between sessions</li>
                    </ul>
                  </li>
                )}
              </ol>
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
              {isMobile && (
                <div className="help-mobile-note">
                  <p style={{ fontStyle: 'italic', fontSize: '13px', color: '#aaa', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <strong>Note:</strong> YouTube search, volume control, playback speed slider, loop duration display, Set List feature, and keyboard shortcuts are only included in the Desktop version of this app. The Mobile version does not include these items. However, Save Loop, Saved Loops, and Recent Videos functionality is fully available on mobile with optimized touch targets and bottom sheet interfaces.
                  </p>
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
              onKeyDown={(e) => handleInputKeyDown(e, setSearchQuery)}
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
        {/* Mobile buttons row - shown only on mobile */}
        <div className="mobile-buttons-row">
          {player && endTime > startTime && (
            <div className="saved-loops-controls">
              <button
                type="button"
                className="btn-save-loop"
                onClick={handleSaveLoop}
                title="Save current loop configuration (start time, end time, target loops)"
                aria-label="Save current loop configuration"
              >
                Save Loop
              </button>
            </div>
          )}
          {savedLoops.length > 0 && (
            <div className="saved-loops-wrapper">
              <button
                type="button"
                className="saved-loops-toggle"
                onClick={() => setShowSavedLoops(!showSavedLoops)}
                aria-expanded={showSavedLoops}
                aria-haspopup="true"
                aria-controls="saved-loops-menu"
              >
                Saved Loops ({savedLoops.length})
              </button>
              {showSavedLoops && (
                <>
                  {/* Backdrop overlay for mobile */}
                  <div 
                    className="saved-loops-backdrop"
                    onClick={() => setShowSavedLoops(false)}
                    aria-hidden="true"
                  />
                  <div 
                    id="saved-loops-menu"
                    className="saved-loops-dropdown"
                    role="menu"
                    aria-label="Saved loops"
                  >
                  {savedLoops.map((loop, index) => (
                    <button
                      key={loop.id || index}
                      type="button"
                      className="saved-loop-item"
                      onClick={() => handleLoadSavedLoop(loop)}
                      role="menuitem"
                    >
                      {loop.thumbnail && (
                        <img 
                          src={loop.thumbnail} 
                          alt={loop.title || 'Video thumbnail'}
                          className="saved-loop-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="saved-loop-info">
                        <span className="saved-loop-title">{loop.title || `Video ${loop.videoId}`}</span>
                        {loop.author && (
                          <span className="saved-loop-author">{loop.author}</span>
                        )}
                        <span className="saved-loop-times">
                          {secondsToMMSS(loop.startTime)} - {secondsToMMSS(loop.endTime)} ({loop.targetLoops} loops)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSavedLoop(loop.id, loop.title || `Video ${loop.videoId}`)
                        }}
                        aria-label={`Delete saved loop: ${loop.title || loop.videoId}`}
                        title="Delete this saved loop"
                      >
                        ×
                      </button>
                    </button>
                  ))}
                  </div>
                </>
              )}
            </div>
          )}
          {recentVideos.length > 0 && (
            <div className="recent-videos-wrapper">
              <button
                type="button"
                className="recent-videos-toggle"
                onClick={() => setShowRecentVideos(!showRecentVideos)}
                aria-expanded={showRecentVideos}
                aria-haspopup="true"
                aria-controls="recent-videos-menu"
              >
                Recent ({recentVideos.length})
              </button>
            {showRecentVideos && (
              <>
                {/* Backdrop overlay for mobile */}
                <div 
                  className="recent-videos-backdrop"
                  onClick={() => setShowRecentVideos(false)}
                  aria-hidden="true"
                />
                <div 
                  id="recent-videos-menu"
                  className="recent-videos-dropdown"
                  role="menu"
                  aria-label="Recent videos"
                >
                {recentVideos.map((video, index) => {
                  const isDefault = userDefaultVideo && userDefaultVideo.videoId === video.videoId
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`recent-video-item ${isDefault ? 'is-default' : ''}`}
                      onClick={() => handleRecentVideoSelect(video)}
                      role="menuitem"
                    >
                      {video.thumbnail && (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title || 'Video thumbnail'}
                          className="recent-video-thumbnail"
                          onError={(e) => {
                            // Fallback to default thumbnail if image fails to load
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="recent-video-info">
                        <span className="recent-video-title">{video.title || `Video ${video.videoId}`}</span>
                        {video.author && (
                          <span className="recent-video-author">{video.author}</span>
                        )}
                        {!video.author && (
                          <span className="recent-video-id">{video.videoId}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRecentVideo(video.videoId, video.title || `Video ${video.videoId}`)
                        }}
                        aria-label={`Delete recent video: ${video.title || video.videoId}`}
                        title="Delete this recent video"
                      >
                        ×
                      </button>
                    </button>
                  )
                })}
                </div>
              </>
            )}
            </div>
          )}
        </div>
        
        {/* Desktop layout - label and buttons side by side */}
        <div className="desktop-label-buttons" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label htmlFor="video-id">URL or Video ID of song from YouTube</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="default-video-controls">
              {player && (
                <button
                  type="button"
                  className={isDefaultVideo ? "btn-default-toggle active" : "btn-default-toggle"}
                  onClick={isDefaultVideo ? handleClearDefault : handleSetAsDefault}
                  title={isDefaultVideo ? "Remove as default video" : "Set this video as your default"}
                  aria-label={isDefaultVideo ? "Remove as default video" : "Set this video as your default"}
                >
                  ★
                </button>
              )}
            </div>
            {player && endTime > startTime && (
              <div className="saved-loops-controls">
                <button
                  type="button"
                  className="btn-save-loop"
                  onClick={handleSaveLoop}
                  title="Save current loop configuration (start time, end time, target loops)"
                  aria-label="Save current loop configuration"
                >
                  💾 Save Loop
                </button>
              </div>
            )}
            {savedLoops.length > 0 && (
              <div className="saved-loops-wrapper">
                <button
                  type="button"
                  className="saved-loops-toggle"
                  onClick={() => setShowSavedLoops(!showSavedLoops)}
                  aria-expanded={showSavedLoops}
                  aria-haspopup="true"
                  aria-controls="saved-loops-menu"
                >
                  ⭐ Saved Loops ({savedLoops.length})
                </button>
                {showSavedLoops && (
                  <>
                    {/* Backdrop overlay for mobile */}
                    <div 
                      className="saved-loops-backdrop"
                      onClick={() => setShowSavedLoops(false)}
                      aria-hidden="true"
                    />
                  <div 
                    id="saved-loops-menu"
                    className="saved-loops-dropdown"
                    role="menu"
                    aria-label="Saved loops"
                  >
                    {savedLoops.map((loop, index) => (
                      <button
                        key={loop.id || index}
                        type="button"
                        className="saved-loop-item"
                        onClick={() => handleLoadSavedLoop(loop)}
                        role="menuitem"
                      >
                        {loop.thumbnail && (
                          <img 
                            src={loop.thumbnail} 
                            alt={loop.title || 'Video thumbnail'}
                            className="saved-loop-thumbnail"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="saved-loop-info">
                          <span className="saved-loop-title">{loop.title || `Video ${loop.videoId}`}</span>
                          {loop.author && (
                            <span className="saved-loop-author">{loop.author}</span>
                          )}
                          <span className="saved-loop-times">
                            {secondsToMMSS(loop.startTime)} - {secondsToMMSS(loop.endTime)} ({loop.targetLoops} loops)
                          </span>
                        </div>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSavedLoop(loop.id, loop.title || `Video ${loop.videoId}`)
                          }}
                          aria-label={`Delete saved loop: ${loop.title || loop.videoId}`}
                          title="Delete this saved loop"
                        >
                          ×
                        </button>
                      </button>
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}
            {recentVideos.length > 0 && (
              <div className="recent-videos-wrapper">
                <button
                  type="button"
                  className="recent-videos-toggle"
                  onClick={() => setShowRecentVideos(!showRecentVideos)}
                  aria-expanded={showRecentVideos}
                  aria-haspopup="true"
                  aria-controls="recent-videos-menu"
                >
                  📋 Recent ({recentVideos.length})
                </button>
              {showRecentVideos && (
                <>
                  {/* Backdrop overlay for mobile */}
                  <div 
                    className="recent-videos-backdrop"
                    onClick={() => setShowRecentVideos(false)}
                    aria-hidden="true"
                  />
                <div 
                  id="recent-videos-menu"
                  className="recent-videos-dropdown"
                  role="menu"
                  aria-label="Recent videos"
                >
                  {recentVideos.map((video, index) => {
                    const isDefault = userDefaultVideo && userDefaultVideo.videoId === video.videoId
                    return (
                    <button
                      key={index}
                      type="button"
                      className={`recent-video-item ${isDefault ? 'is-default' : ''}`}
                      onClick={() => handleRecentVideoSelect(video)}
                      role="menuitem"
                    >
                      {video.thumbnail && (
                        <img 
                          src={video.thumbnail} 
                          alt={video.title || 'Video thumbnail'}
                          className="recent-video-thumbnail"
                          onError={(e) => {
                            // Fallback to default thumbnail if image fails to load
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="recent-video-info">
                        <span className="recent-video-title">{video.title || `Video ${video.videoId}`}</span>
                        {video.author && (
                          <span className="recent-video-author">{video.author}</span>
                        )}
                        {!video.author && (
                          <span className="recent-video-id">{video.videoId}</span>
                        )}
                      </div>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRecentVideo(video.videoId, video.title || `Video ${video.videoId}`)
                          }}
                          aria-label={`Delete recent video: ${video.title || video.videoId}`}
                          title="Delete this recent video"
                        >
                          ×
                        </button>
                    </button>
                    )
                  })}
                </div>
                </>
              )}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile label - shown only on mobile, below buttons */}
        <label htmlFor="video-id" className="mobile-label">URL or Video ID of song from YouTube</label>
        <div className="video-id-input-wrapper">
        <input
          id="video-id"
          type="text"
          value={videoId}
          onChange={(e) => handleVideoIdChange(e.target.value)}
          onKeyDown={(e) => handleInputKeyDown(e, setVideoId)}
          onFocus={() => setShowRecentVideos(false)}
          placeholder="Enter URL or Video ID of song from YouTube"
          disabled={!apiReady}
          autoFocus
          aria-invalid={!!validationError}
          aria-describedby={validationError ? "video-id-error" : undefined}
          aria-errormessage={validationError ? "video-id-error" : undefined}
        />
          {videoId && (
            <button
              type="button"
              className="clear-input-button"
              onClick={() => handleVideoIdChange('')}
              aria-label="Clear URL input"
              title="Clear URL"
            >
              ×
            </button>
          )}
        </div>
        {isLoading && (
          <div 
            className="loading-indicator"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            Loading video...
          </div>
        )}
        {validationError && (
          <span 
            id="video-id-error"
            className="error-message"
            role="alert"
            aria-live="assertive"
          >
            {validationError}
          </span>
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
          <label htmlFor="start-time">
            Start Time (MM:SS)
            <span className="sr-only">Format: minutes and seconds, for example 0:46 for 46 seconds or 1:02 for 1 minute 2 seconds</span>
          </label>
          <div className="input-with-button">
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
              onBlur={(e) => {
                // Normalize MM:SS format on blur (e.g., "0:75" → "1:15")
                const normalized = normalizeMMSS(e.target.value)
                if (normalized !== e.target.value) {
                  setStartTimeDisplay(normalized)
                  const seconds = mmssToSeconds(normalized)
                  setStartTime(seconds)
                }
              }}
              placeholder="0:00"
              disabled={isPlaying}
              aria-describedby="start-time-help"
            />
            <button
              type="button"
              className="btn-set-from-video"
              onClick={() => handleSetFromCurrentPosition('start')}
              disabled={!player || !player.getCurrentTime || isLoading}
              title="Set start time from current video position"
              aria-label="Set start time from current video position"
            >
              {isMobile ? 'Set' : 'Set from Video'}
            </button>
          </div>
          <span id="start-time-help" className="sr-only">
            Enter time in minutes:seconds format. For example, 0:46 for 46 seconds or 1:02 for 1 minute 2 seconds.
          </span>
        </div>

        <div className="input-group">
          <label htmlFor="end-time">
            End Time (MM:SS)
            <span className="sr-only">Format: minutes and seconds, for example 1:30 for 1 minute 30 seconds</span>
          </label>
          <div className="input-with-button">
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
              onBlur={(e) => {
                // Normalize MM:SS format on blur (e.g., "0:75" → "1:15")
                const normalized = normalizeMMSS(e.target.value)
                if (normalized !== e.target.value) {
                  setEndTimeDisplay(normalized)
                  const seconds = mmssToSeconds(normalized)
                  setEndTime(seconds)
                }
              }}
              placeholder="0:00"
              disabled={isPlaying}
              className={validationError ? 'error' : ''}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "end-time-error" : "end-time-help"}
              aria-errormessage={validationError ? "end-time-error" : undefined}
            />
            <button
              type="button"
              className="btn-set-from-video"
              onClick={() => handleSetFromCurrentPosition('end')}
              disabled={!player || !player.getCurrentTime || isLoading}
              title="Set end time from current video position"
              aria-label="Set end time from current video position"
            >
              {isMobile ? 'Set' : 'Set from Video'}
            </button>
          </div>
          <span id="end-time-help" className="sr-only">
            Enter time in minutes:seconds format. For example, 1:30 for 1 minute 30 seconds.
          </span>
          {validationError && (
            <span 
              id="end-time-error"
              className="error-message"
              role="alert"
              aria-live="assertive"
            >
              {validationError}
            </span>
          )}
        </div>

        <div className="input-group">
          <label htmlFor="target-loops">
            # of Loops
            <span className="sr-only">Enter number of times to loop, maximum 10,000</span>
          </label>
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
                // Security: Maximum reasonable limit (10,000 loops) to prevent DoS attacks
                const MAX_LOOPS = 10000
                const clampedValue = Math.min(Math.max(1, numValue || 1), MAX_LOOPS)
                setTargetLoops(clampedValue)
                
                // Update display if value was clamped (user entered value > MAX_LOOPS)
                if (clampedValue !== numValue && numValue > 0 && value !== '') {
                  setTargetLoopsDisplay(clampedValue.toString())
                }
              }
            }}
            onBlur={(e) => {
              // If empty on blur, set to default value
              if (e.target.value === '') {
                setTargetLoopsDisplay('5')
                setTargetLoops(5)
              } else {
                // Ensure display matches actual value (in case it was clamped)
                const numValue = parseInt(e.target.value, 10)
                const MAX_LOOPS = 10000
                const clampedValue = Math.min(Math.max(1, numValue || 1), MAX_LOOPS)
                if (clampedValue !== numValue) {
                  setTargetLoopsDisplay(clampedValue.toString())
                  setTargetLoops(clampedValue)
                }
              }
            }}
            placeholder="5"
            disabled={isPlaying}
            aria-describedby="target-loops-help"
            aria-valuemin="1"
            aria-valuemax="10000"
            aria-valuenow={targetLoops}
          />
          <span id="target-loops-help" className="sr-only">
            Enter how many times you want the video to loop. Minimum 1, maximum 10,000.
          </span>
        </div>

        {!isMobile && (
          <div className="input-group loop-duration-group">
            <label>Loop Time</label>
            <div className="loop-duration-display-box">
              {endTime > startTime ? secondsToMMSS(endTime - startTime) : '0:00'}
            </div>
          </div>
        )}
      </div>

      {/* Volume Control Section - Above Playback Speed */}
      {!isMobile && (
        <div className="volume-control-section">
          <label htmlFor="volumeSlider" className="volume-control-label">
            Volume
            <span className="sr-only">Current volume: {volume} percent</span>
          </label>
          <div className="volume-control-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              id="volumeSlider"
              aria-label="Volume"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={volume}
              aria-valuetext={`${volume} percent`}
            />
            <span aria-live="polite" aria-atomic="true" className="sr-only">
              {volume}%
            </span>
          </div>
        </div>
      )}

      {/* Main Action Buttons - Positioned above Playback Speed */}
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
            {isPlaying ? 'Stop Loop' : (hasBeenStopped ? 'Resume Loop' : 'Stop Loop')}
          </button>
          <button
            className="btn btn-reset"
            onClick={handleReset}
            disabled={!player}
          >
            Reset Loop
          </button>
        </div>
      </div>

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
              <label htmlFor="speedSlider" className="speed-slider-label">
                {playbackSpeed.toFixed(2)}x
                <span className="sr-only">Playback speed: {playbackSpeed.toFixed(2)} times normal speed</span>
              </label>
              <input
                type="range"
                min="0.25"
                max="2.0"
                step="0.05"
                value={playbackSpeed}
                onChange={handlePlaybackSpeedChange}
                className="speed-slider"
                id="speedSlider"
                aria-label="Playback speed"
                aria-valuemin="0.25"
                aria-valuemax="2.0"
                aria-valuenow={playbackSpeed}
                aria-valuetext={`${playbackSpeed.toFixed(2)} times normal speed`}
              />
              <span aria-live="polite" aria-atomic="true" className="sr-only">
                {playbackSpeed.toFixed(2)}x
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isPlaying && endTime > startTime && (
        <div className="progress-container">
          <div 
            className="progress-bar"
            role="progressbar"
            aria-valuenow={loopProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Loop progress"
            aria-describedby="progress-text"
          >
            <div 
              className="progress-fill" 
              style={{ width: `${loopProgress}%` }}
            ></div>
          </div>
          <span id="progress-text" className="sr-only">
            {loopProgress}% complete
          </span>
          <div className="progress-labels">
            <span>{startTimeFormatted}</span>
            <span className="current-time">{currentTimeFormatted}</span>
            <span>{endTimeFormatted}</span>
          </div>
        </div>
      )}

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

      {/* Set List control button - Desktop only */}
      {!isMobile && (
        <div className="set-list-link-bottom">
          <button className="help-link-text" onClick={() => setShowSetListPage(true)}>
            set list
          </button>
        </div>
      )}

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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
          <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {deleteConfirm.type === 'recent' ? 'Recent Video' : 'Saved Loop'}?</h3>
            <p>{deleteConfirm.title}</p>
            <div className="delete-confirm-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
      )}
    </>
  )
}

export default App
