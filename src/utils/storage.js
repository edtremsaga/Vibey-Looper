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
    ].slice(0, 30) // Keep last 30
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
      .slice(0, 30) // Enforce maximum limit
    
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

