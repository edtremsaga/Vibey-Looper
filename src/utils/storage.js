// Helper functions for localStorage operations
import { extractVideoId } from './helpers.js'

// Helper function to save recent video to localStorage
// Security: Validates inputs before saving to prevent invalid data storage
export const saveRecentVideo = (videoId, title = '', author = '', thumbnail = '') => {
  try {
    // Validate videoId before saving (security: prevent invalid data storage)
    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      console.warn('Invalid videoId provided to saveRecentVideo:', videoId)
      // Return existing data instead of saving invalid data
      return loadRecentVideos()
    }
    
    // Sanitize inputs before saving
    const sanitized = {
      videoId, // Already validated above
      title: typeof title === 'string' ? title.substring(0, 200) : '',
      author: typeof author === 'string' ? author.substring(0, 100) : '',
      thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('https://')
        ? thumbnail.substring(0, 500)
        : '',
      timestamp: Date.now()
    }
    
    const recent = JSON.parse(localStorage.getItem('recentVideos') || '[]')
    const newRecent = [
      sanitized,
      ...recent.filter(v => v.videoId !== videoId)
    ].slice(0, 100) // Keep last 100
    localStorage.setItem('recentVideos', JSON.stringify(newRecent))
    return newRecent
  } catch (error) {
    console.warn('Failed to save recent video:', error)
    return []
  }
}

// Security: Validate recent video data structure to prevent data poisoning
const validateRecentVideo = (video) => {
  // Basic structure check
  if (!video || typeof video !== 'object') {
    return null
  }
  
  // Video ID is required and must be valid (11 characters, alphanumeric)
  if (!video.videoId || typeof video.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(video.videoId)) {
    return null
  }
  
  // Return validated and sanitized video object
  // Optional fields with defaults and length limits (truncate if too long)
  return {
    videoId: video.videoId, // Already validated above
    title: typeof video.title === 'string' && video.title.length > 0
      ? video.title.substring(0, 200) // Truncate to 200 chars
      : '',
    author: typeof video.author === 'string' && video.author.length > 0
      ? video.author.substring(0, 100) // Truncate to 100 chars
      : '',
    thumbnail: typeof video.thumbnail === 'string' && 
               video.thumbnail.length > 0 &&
               video.thumbnail.startsWith('https://')
      ? video.thumbnail.substring(0, 500) // Truncate to 500 chars
      : '',
    timestamp: typeof video.timestamp === 'number' && video.timestamp > 0
      ? video.timestamp
      : Date.now() // Default to current time if invalid
  }
}

// Helper function to load recent videos from localStorage
// Security: Validates and sanitizes data to prevent data poisoning attacks
export const loadRecentVideos = () => {
  try {
    const data = JSON.parse(localStorage.getItem('recentVideos') || '[]')
    
    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.warn('Invalid recent videos data structure, resetting to empty array')
      return []
    }
    
    // Validate and filter out invalid entries
    // This silently removes corrupted or malicious data
    const validated = data
      .map(validateRecentVideo)
      .filter(video => video !== null) // Remove invalid entries
      .slice(0, 100) // Enforce maximum limit
    
    // Log if entries were filtered out (for debugging)
    if (validated.length < data.length) {
      console.warn(`Filtered out ${data.length - validated.length} invalid recent video entries`)
    }
    
    return validated
  } catch (error) {
    console.warn('Failed to load recent videos:', error)
    return []
  }
}

// Helper function to delete a recent video by videoId
export const deleteRecentVideo = (videoId) => {
  try {
    // Validate videoId before deleting
    if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      console.warn('Invalid videoId provided to deleteRecentVideo:', videoId)
      return loadRecentVideos() // Return current valid state
    }
    
    const recent = JSON.parse(localStorage.getItem('recentVideos') || '[]')
    const filtered = recent.filter(v => v.videoId !== videoId)
    localStorage.setItem('recentVideos', JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.warn('Failed to delete recent video:', error)
    return loadRecentVideos() // Return current valid state on error
  }
}

// Helper function to save user's default video to localStorage
// Security: Validates inputs before saving to prevent invalid data storage
export const saveDefaultVideo = (videoId, title = '', author = '', thumbnail = '') => {
  try {
    // Validate videoId before saving (security: prevent invalid data storage)
    const extractedId = extractVideoId(videoId)
    if (!extractedId || extractedId.length !== 11) {
      console.warn('Invalid videoId provided to saveDefaultVideo:', videoId)
      return null // Return null to indicate failure
    }
    
    // Validate URL is provided and is a string
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      console.warn('Invalid URL provided to saveDefaultVideo')
      return null
    }
    
    // Sanitize inputs before saving
    const defaultVideo = {
      videoId: extractedId, // Already validated above
      url: videoId.trim().substring(0, 500), // Sanitize URL length
      title: typeof title === 'string' ? title.substring(0, 200) : '',
      author: typeof author === 'string' ? author.substring(0, 100) : '',
      thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('https://')
        ? thumbnail.substring(0, 500)
        : '',
      timestamp: Date.now()
    }
    
    localStorage.setItem('defaultVideo', JSON.stringify(defaultVideo))
    return defaultVideo
  } catch (error) {
    console.warn('Failed to save default video:', error)
    return null
  }
}

// Security: Validate default video data structure to prevent data poisoning
const validateDefaultVideo = (video) => {
  // Basic structure check
  if (!video || typeof video !== 'object') {
    return null
  }
  
  // Video ID is required and must be valid (11 characters, alphanumeric)
  if (!video.videoId || typeof video.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(video.videoId)) {
    return null
  }
  
  // URL is required (can be full URL or just video ID)
  if (!video.url || typeof video.url !== 'string' || video.url.trim() === '') {
    return null
  }
  
  // Return validated and sanitized default video object
  return {
    videoId: video.videoId, // Already validated above
    url: video.url.trim().substring(0, 500), // Sanitize URL length
    title: typeof video.title === 'string' && video.title.length > 0
      ? video.title.substring(0, 200) // Truncate to 200 chars
      : '',
    author: typeof video.author === 'string' && video.author.length > 0
      ? video.author.substring(0, 100) // Truncate to 100 chars
      : '',
    thumbnail: typeof video.thumbnail === 'string' && 
               video.thumbnail.length > 0 &&
               video.thumbnail.startsWith('https://')
      ? video.thumbnail.substring(0, 500) // Truncate to 500 chars
      : '',
    timestamp: typeof video.timestamp === 'number' && video.timestamp > 0
      ? video.timestamp
      : Date.now() // Default to current time if invalid
  }
}

// Helper function to load user's default video from localStorage
// Security: Validates and sanitizes data to prevent data poisoning attacks
export const loadDefaultVideo = () => {
  try {
    const stored = localStorage.getItem('defaultVideo')
    if (!stored) {
      return null
    }
    
    const data = JSON.parse(stored)
    
    // Validate and sanitize the data
    const validated = validateDefaultVideo(data)
    
    if (!validated) {
      console.warn('Invalid default video data structure, clearing')
      // Clear invalid data
      localStorage.removeItem('defaultVideo')
      return null
    }
    
    return validated
  } catch (error) {
    console.warn('Failed to load default video:', error)
    // Clear corrupted data
    try {
      localStorage.removeItem('defaultVideo')
    } catch (clearError) {
      // Ignore errors when clearing
    }
    return null
  }
}

// Helper function to clear user's default video (reset to app default)
export const clearDefaultVideo = () => {
  try {
    localStorage.removeItem('defaultVideo')
  } catch (error) {
    console.warn('Failed to clear default video:', error)
  }
}

// Security: Validate saved loop data structure to prevent data poisoning
const validateSavedLoop = (loop) => {
  // Basic structure check
  if (!loop || typeof loop !== 'object') {
    return null
  }
  
  // Video ID is required and must be valid (11 characters, alphanumeric)
  if (!loop.videoId || typeof loop.videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(loop.videoId)) {
    return null
  }
  
  // URL is required
  if (!loop.url || typeof loop.url !== 'string' || loop.url.trim() === '') {
    return null
  }
  
  // Start time: must be number, 0-86400 (24 hours max)
  const startTime = typeof loop.startTime === 'number' && loop.startTime >= 0 && loop.startTime <= 86400
    ? loop.startTime
    : null
  if (startTime === null) return null
  
  // End time: must be number, 0-86400, and > startTime
  const endTime = typeof loop.endTime === 'number' && loop.endTime > startTime && loop.endTime <= 86400
    ? loop.endTime
    : null
  if (endTime === null) return null
  
  // Target loops: must be number, 1-10000
  const targetLoops = typeof loop.targetLoops === 'number' && loop.targetLoops >= 1 && loop.targetLoops <= 10000
    ? loop.targetLoops
    : null
  if (targetLoops === null) return null
  
  // Return validated and sanitized saved loop object
  return {
    id: typeof loop.id === 'string' && loop.id.length > 0
      ? loop.id.substring(0, 100) // Unique ID
      : `${loop.videoId}-${Date.now()}`, // Generate ID if missing
    videoId: loop.videoId, // Already validated above
    url: loop.url.trim().substring(0, 500), // Sanitize URL length
    startTime, // Already validated above
    endTime, // Already validated above
    targetLoops, // Already validated above
    playbackSpeed: typeof loop.playbackSpeed === 'number' && loop.playbackSpeed >= 0.25 && loop.playbackSpeed <= 2.0
      ? loop.playbackSpeed
      : 1, // Default to 1x if invalid
    title: typeof loop.title === 'string' && loop.title.length > 0
      ? loop.title.substring(0, 200) // Truncate to 200 chars
      : '',
    author: typeof loop.author === 'string' && loop.author.length > 0
      ? loop.author.substring(0, 100) // Truncate to 100 chars
      : '',
    thumbnail: typeof loop.thumbnail === 'string' && 
               loop.thumbnail.length > 0 &&
               loop.thumbnail.startsWith('https://')
      ? loop.thumbnail.substring(0, 500) // Truncate to 500 chars
      : '',
    timestamp: typeof loop.timestamp === 'number' && loop.timestamp > 0
      ? loop.timestamp
      : Date.now() // Default to current time if invalid
  }
}

// Helper function to save a loop configuration to localStorage
// Security: Validates inputs before saving to prevent invalid data storage
export const saveSavedLoop = (videoId, startTime, endTime, targetLoops, playbackSpeed = 1, title = '', author = '', thumbnail = '') => {
  try {
    // Validate videoId
    const extractedId = extractVideoId(videoId)
    if (!extractedId || extractedId.length !== 11) {
      console.warn('Invalid videoId provided to saveSavedLoop:', videoId)
      return null
    }
    
    // Validate URL
    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
      console.warn('Invalid URL provided to saveSavedLoop')
      return null
    }
    
    // Validate times
    if (typeof startTime !== 'number' || startTime < 0 || startTime > 86400) {
      console.warn('Invalid startTime provided to saveSavedLoop:', startTime)
      return null
    }
    
    if (typeof endTime !== 'number' || endTime <= startTime || endTime > 86400) {
      console.warn('Invalid endTime provided to saveSavedLoop:', endTime)
      return null
    }
    
    // Validate target loops
    if (typeof targetLoops !== 'number' || targetLoops < 1 || targetLoops > 10000) {
      console.warn('Invalid targetLoops provided to saveSavedLoop:', targetLoops)
      return null
    }
    
    // Validate playback speed
    if (typeof playbackSpeed !== 'number' || playbackSpeed < 0.25 || playbackSpeed > 2.0) {
      playbackSpeed = 1 // Default to 1x if invalid
    }
    
    // Create saved loop object
    const savedLoop = {
      id: `${extractedId}-${Date.now()}`, // Unique ID
      videoId: extractedId,
      url: videoId.trim().substring(0, 500),
      startTime,
      endTime,
      targetLoops,
      playbackSpeed,
      title: typeof title === 'string' ? title.substring(0, 200) : '',
      author: typeof author === 'string' ? author.substring(0, 100) : '',
      thumbnail: typeof thumbnail === 'string' && thumbnail.startsWith('https://')
        ? thumbnail.substring(0, 500)
        : '',
      timestamp: Date.now()
    }
    
    // Load existing saved loops
    const savedLoops = JSON.parse(localStorage.getItem('savedLoops') || '[]')
    
    // Add new loop to the beginning (most recent first)
    const newSavedLoops = [savedLoop, ...savedLoops].slice(0, 100) // Keep max 100 saved loops
    
    localStorage.setItem('savedLoops', JSON.stringify(newSavedLoops))
    return savedLoop
  } catch (error) {
    console.warn('Failed to save loop:', error)
    return null
  }
}

// Helper function to load saved loops from localStorage
// Security: Validates and sanitizes data to prevent data poisoning attacks
export const loadSavedLoops = () => {
  try {
    const data = JSON.parse(localStorage.getItem('savedLoops') || '[]')
    
    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.warn('Invalid saved loops data structure, resetting to empty array')
      return []
    }
    
    // Validate and filter out invalid entries
    const validated = data
      .map(validateSavedLoop)
      .filter(loop => loop !== null) // Remove invalid entries
      .slice(0, 100) // Enforce maximum limit
    
    // Log if entries were filtered out (for debugging)
    if (validated.length < data.length) {
      console.warn(`Filtered out ${data.length - validated.length} invalid saved loop entries`)
    }
    
    return validated
  } catch (error) {
    console.warn('Failed to load saved loops:', error)
    return []
  }
}

// Helper function to delete a saved loop by ID
export const deleteSavedLoop = (loopId) => {
  try {
    const savedLoops = JSON.parse(localStorage.getItem('savedLoops') || '[]')
    const filtered = savedLoops.filter(loop => loop.id !== loopId)
    localStorage.setItem('savedLoops', JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.warn('Failed to delete saved loop:', error)
    return loadSavedLoops() // Return current valid state on error
  }
}

